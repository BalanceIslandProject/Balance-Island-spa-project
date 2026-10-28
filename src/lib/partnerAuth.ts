import { cookies } from 'next/headers';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'partner_session';
const SESSION_SECRET = process.env.PARTNER_AUTH_SECRET || 'booktherapick-partner-secret-salt-2026';

export interface PartnerSessionData {
  id: string;
  partner_code: string;
  email: string;
  first_name: string;
  last_name?: string;
  business_name?: string;
  status: string;
  commission_rate_pct?: number;
  created_at: number;
}

/**
 * Checks if partner is approved and authorized for full dashboard access
 */
export function isPartnerApproved(session?: PartnerSessionData | null): boolean {
  if (!session) return false;
  return session.status === 'active' || session.status === 'approved';
}

/**
 * Hashes a plain password with salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies password against stored salt:hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === key;
  } catch (e) {
    return false;
  }
}

/**
 * Creates a signed session token
 */
export function createSessionToken(data: PartnerSessionData): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

/**
 * Verifies a session token and returns the parsed payload
 */
export function verifySessionToken(token: string): PartnerSessionData | null {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payload)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    const parsed = JSON.parse(decoded) as PartnerSessionData;

    // Check expiry (e.g. 14 days)
    const maxAge = 14 * 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.created_at > maxAge) {
      return null;
    }

    return parsed;
  } catch (e) {
    return null;
  }
}

/**
 * Retrieves current partner session on server components or route handlers
 */
export async function getPartnerSession(): Promise<PartnerSessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) return null;

    return verifySessionToken(sessionCookie.value);
  } catch (e) {
    return null;
  }
}
