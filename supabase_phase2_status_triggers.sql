-- ==============================================================================
-- BOOKTHERAPICK - PHASE 2 TRANSACTIONAL STATUS & COMMISSION SYNCHRONIZATION
-- Project Reference: esioxxiawkawtpphexzf
-- Target: Atomic PostgreSQL triggers for status transitions (Admin -> Partner Realtime)
-- ==============================================================================

-- 1. Trigger Function: Sync booking status changes to linked affiliate commission
CREATE OR REPLACE FUNCTION public.fn_sync_booking_to_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref_clean TEXT;
  v_is_completed BOOLEAN;
  v_is_paid BOOLEAN;
  v_is_cancelled BOOLEAN;
  v_is_in_progress BOOLEAN;
  v_treatment_status TEXT;
  v_booking_status TEXT;
  v_payment_status TEXT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Extract normalized reference number without '#'
  v_ref_clean := UPPER(TRIM(REPLACE(COALESCE(NEW.reference_number, ''), '#', '')));
  v_booking_status := LOWER(TRIM(COALESCE(NEW.status, '')));
  v_treatment_status := LOWER(TRIM(COALESCE(NEW.treatment_status, '')));
  v_payment_status := LOWER(TRIM(COALESCE(NEW.payment_status, '')));

  -- Determine state flags based on BookTherapick business rules:
  -- - Cancelled / Refunded: Immediately cancels commission
  -- - Completed & Paid: Approves commission for 7-day maturation & payout
  -- - Completed but Unpaid (or Paid but In Progress): Stays pending until both criteria are met
  v_is_cancelled := (
    v_booking_status = 'cancelled' 
    OR v_treatment_status = 'cancelled' 
    OR v_payment_status = 'refunded'
  );

  v_is_completed := (
    v_treatment_status = 'finished' 
    OR v_booking_status = 'completed'
  );

  v_is_paid := (
    v_payment_status = 'paid' 
    OR v_payment_status = 'paid (cash on arrival)' 
    OR v_payment_status LIKE '%paid%'
  );

  v_is_in_progress := (
    v_booking_status IN ('ongoing', 'in progress') 
    OR v_treatment_status = 'in progress'
  );

  -- Branch 1: Cancellation (Never allow cancelled bookings to yield payable commissions)
  IF v_is_cancelled THEN
    UPDATE public.affiliate_commissions
    SET 
      status = 'cancelled',
      service_completed = FALSE,
      updated_at = v_now
    WHERE (booking_id = NEW.id::text 
       OR booking_id = NEW.reference_number 
       OR UPPER(REPLACE(booking_id, '#', '')) = v_ref_clean)
      AND status != 'paid'; -- Protect already disbursed bank payouts from unintended rollback

  -- Branch 2: Fully Completed AND Fully Paid -> Commission Approved!
  ELSIF v_is_completed AND v_is_paid THEN
    UPDATE public.affiliate_commissions
    SET 
      status = 'approved',
      service_completed = TRUE,
      payment_verified = TRUE,
      approved_at = COALESCE(approved_at, v_now),
      updated_at = v_now
    WHERE (booking_id = NEW.id::text 
       OR booking_id = NEW.reference_number 
       OR UPPER(REPLACE(booking_id, '#', '')) = v_ref_clean)
      AND status NOT IN ('paid', 'processing');

  -- Branch 3: Completed, but payment unverified (e.g. Cash collection pending)
  ELSIF v_is_completed AND NOT v_is_paid THEN
    UPDATE public.affiliate_commissions
    SET 
      status = 'pending',
      service_completed = TRUE,
      payment_verified = FALSE,
      updated_at = v_now
    WHERE (booking_id = NEW.id::text 
       OR booking_id = NEW.reference_number 
       OR UPPER(REPLACE(booking_id, '#', '')) = v_ref_clean)
      AND status NOT IN ('paid', 'processing');

  -- Branch 4: Paid online, but treatment is still scheduled / ongoing
  ELSIF NOT v_is_completed AND v_is_paid THEN
    UPDATE public.affiliate_commissions
    SET 
      status = 'pending',
      service_completed = FALSE,
      payment_verified = TRUE,
      updated_at = v_now
    WHERE (booking_id = NEW.id::text 
       OR booking_id = NEW.reference_number 
       OR UPPER(REPLACE(booking_id, '#', '')) = v_ref_clean)
      AND status NOT IN ('paid', 'processing');

  -- Branch 5: Treatment or Booking In Progress
  ELSIF v_is_in_progress THEN
    UPDATE public.affiliate_commissions
    SET 
      status = 'pending',
      service_completed = FALSE,
      updated_at = v_now
    WHERE (booking_id = NEW.id::text 
       OR booking_id = NEW.reference_number 
       OR UPPER(REPLACE(booking_id, '#', '')) = v_ref_clean)
      AND status NOT IN ('paid', 'processing');
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Bind trigger to bookings table
DROP TRIGGER IF EXISTS trg_sync_booking_to_commission ON public.bookings;

CREATE TRIGGER trg_sync_booking_to_commission
AFTER INSERT OR UPDATE OF status, treatment_status, payment_status, reference_number
ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_booking_to_commission();


-- 3. Trigger Function: Sync commission initial status on INSERT
-- Ensures that if a commission record is created for an existing booking, it inherits current status
CREATE OR REPLACE FUNCTION public.fn_sync_commission_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_ref_clean TEXT;
BEGIN
  v_ref_clean := UPPER(TRIM(REPLACE(COALESCE(NEW.booking_id, ''), '#', '')));

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id::text = NEW.booking_id
     OR reference_number = NEW.booking_id
     OR UPPER(REPLACE(reference_number, '#', '')) = v_ref_clean
  LIMIT 1;

  IF FOUND THEN
    IF LOWER(v_booking.status) = 'cancelled' OR LOWER(v_booking.treatment_status) = 'cancelled' THEN
      NEW.status := 'cancelled';
      NEW.service_completed := FALSE;
    ELSIF (LOWER(v_booking.treatment_status) = 'finished' OR LOWER(v_booking.status) = 'completed')
      AND (LOWER(v_booking.payment_status) LIKE '%paid%') THEN
      NEW.status := 'approved';
      NEW.service_completed := TRUE;
      NEW.payment_verified := TRUE;
      NEW.approved_at := COALESCE(NEW.approved_at, NOW());
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Bind trigger to affiliate_commissions table
DROP TRIGGER IF EXISTS trg_sync_commission_on_insert ON public.affiliate_commissions;

CREATE TRIGGER trg_sync_commission_on_insert
BEFORE INSERT ON public.affiliate_commissions
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_commission_on_insert();

