export interface TreatmentInclusionItem {
  duration: string;
  name: string;
}

export interface ParsedTreatmentDetails {
  descClean: string;
  inclusions: TreatmentInclusionItem[];
}

/**
 * Robust parser to extract clean experience description and step-by-step
 * treatment inclusions regardless of how the admin or partner formatted them.
 */
export function parseTreatmentInclusions(rawDesc: string | null | undefined): ParsedTreatmentDetails {
  if (!rawDesc || typeof rawDesc !== 'string') {
    return { descClean: '', inclusions: [] };
  }

  const trimmed = rawDesc.trim();
  if (!trimmed) {
    return { descClean: '', inclusions: [] };
  }

  // Header regex covering all common variations:
  // TREATMENT INCLUSIONS, TREATMENT INCLUDED, TREATMENT INCLUDES,
  // WHAT'S INCLUDED, WHAT IS INCLUDED, PACKAGE INCLUSIONS, PACKAGE INCLUDES, INCLUSIONS, etc.
  const splitRegex = /(?:TREATMENT\s*INCLUSIONS?|TREATMENT\s*INCLUDED|TREATMENT\s*INCLUDES?|WHAT(?:'S|\s+IS)\s*INCLUDED|PACKAGE\s*INCLUSIONS?|PACKAGE\s*INCLUDES?|INCLUSIONS?)\s*:?\s*/i;

  let descClean = '';
  let rawInclusions = '';

  if (splitRegex.test(trimmed)) {
    const parts = trimmed.split(splitRegex);
    descClean = parts[0].trim();
    rawInclusions = parts.slice(1).join(' ').trim();
  } else {
    // If no explicit header, inspect lines to see if there is an inclusions list
    const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const descLines: string[] = [];
    const incLines: string[] = [];

    for (const line of lines) {
      const hasDuration = /(\d+\s*(?:MINUTES?|MINS?|HOURS?|HRS?))\b/i.test(line);
      const hasSeparator = /(?:[—–:]|\s+-\s+|\(|\))/i.test(line);

      if (hasDuration && hasSeparator) {
        incLines.push(line);
      } else if (incLines.length === 0) {
        descLines.push(line);
      } else {
        incLines.push(line);
      }
    }

    if (incLines.length > 0) {
      descClean = descLines.join('\n').trim();
      rawInclusions = incLines.join('\n').trim();
    } else {
      descClean = trimmed;
    }
  }

  const inclusions: TreatmentInclusionItem[] = [];

  if (rawInclusions) {
    // Helper to format duration to e.g. "60 Mins", "45 Mins"
    const formatDuration = (rawDur: string): string => {
      const numMatch = rawDur.match(/\d+(?:\.\d+)?/);
      if (!numMatch) return rawDur.trim();
      const num = parseFloat(numMatch[0]);
      const isHours = /hours?|hrs?/i.test(rawDur);
      const minutes = isHours ? Math.round(num * 60) : Math.round(num);
      return `${minutes} Mins`;
    };

    // Pattern 1: Name — Duration (e.g. "Synchronicity Massage (Four-Hands Massage) — 60 MINUTES")
    // Captures name until separator [—–:] or " - ", then duration token
    const patternNameFirst = /([^\n\r\t]+?)\s*(?:[—–:]|\s+-\s+)\s*(\d+(?:\.\d+)?\s*(?:MINUTES?|MINS?|HOURS?|HRS?))\b/gi;
    let match: RegExpExecArray | null;

    while ((match = patternNameFirst.exec(rawInclusions)) !== null) {
      let name = match[1].trim();
      // Clean leading bullet points, dashes, asterisks, numbers like "1."
      name = name.replace(/^(?:•|\-|\*|\d+[\.\)]|,|\s)+/, '').trim();
      const formattedDur = formatDuration(match[2].trim());

      if (name && !inclusions.some(inc => inc.name === name && inc.duration === formattedDur)) {
        inclusions.push({ duration: formattedDur, name });
      }
    }

    // Pattern 2: Duration First (e.g. "60 Mins — Balinese Massage" or "60 MINUTES - Body Scrub")
    if (inclusions.length === 0) {
      const patternDurFirst = /(\d+(?:\.\d+)?\s*(?:MINUTES?|MINS?|HOURS?|HRS?))\s*(?:[—–:]|\s+-\s+)\s*([^0-9—–:\n]+?)(?=(?:\d+(?:\.\d+)?\s*(?:MINUTES?|MINS?|HOURS?|HRS?))|$)/gi;
      while ((match = patternDurFirst.exec(rawInclusions)) !== null) {
        const formattedDur = formatDuration(match[1].trim());
        let name = match[2].trim().replace(/^[•\-\*\d+[\.\)],\s]+|[•\-\*,\s]+$/g, '');
        if (name && !inclusions.some(inc => inc.name === name && inc.duration === formattedDur)) {
          inclusions.push({ duration: formattedDur, name });
        }
      }
    }

    // Pattern 3: Name (Duration) (e.g. "Synchronicity Massage (60 Mins)")
    if (inclusions.length === 0) {
      const patternParens = /([^\n\r\t()]+?)\s*\(\s*(\d+(?:\.\d+)?\s*(?:MINUTES?|MINS?|HOURS?|HRS?))\s*\)/gi;
      while ((match = patternParens.exec(rawInclusions)) !== null) {
        let name = match[1].trim().replace(/^(?:•|\-|\*|\d+[\.\)]|,|\s)+/, '').trim();
        const formattedDur = formatDuration(match[2].trim());
        if (name && !inclusions.some(inc => inc.name === name && inc.duration === formattedDur)) {
          inclusions.push({ duration: formattedDur, name });
        }
      }
    }

    // Pattern 4: Fallback line-by-line if items don't have duration tokens
    if (inclusions.length === 0) {
      const lines = rawInclusions.split(/\r?\n/).map(l => l.trim().replace(/^(?:•|\-|\*|\d+[\.\)]|,|\s)+/, '')).filter(Boolean);
      for (const line of lines) {
        inclusions.push({ duration: '', name: line });
      }
    }
  }

  return { descClean, inclusions };
}

/**
 * Formats clean experience description and inclusion steps into the canonical format:
 * [Description]
 * 
 * TREATMENT INCLUSIONS:
 * • Step Name — 60 MINUTES
 * • Step Name 2 — 45 MINUTES
 */
export function formatTreatmentDescription(
  descClean: string,
  inclusions: TreatmentInclusionItem[]
): string {
  const cleanExp = (descClean || '').trim();
  const validInclusions = (inclusions || []).filter(item => item && item.name && item.name.trim());

  if (validInclusions.length === 0) {
    return cleanExp;
  }

  const inclusionsText = validInclusions
    .map(inc => {
      const name = inc.name.trim();
      const dur = inc.duration ? inc.duration.trim() : '';
      if (dur) {
        const num = dur.match(/\d+/)?.[0] || dur;
        return `• ${name} — ${num} MINUTES`;
      }
      return `• ${name}`;
    })
    .join('\n');

  if (!cleanExp) {
    return `TREATMENT INCLUSIONS:\n${inclusionsText}`;
  }

  return `${cleanExp}\n\nTREATMENT INCLUSIONS:\n${inclusionsText}`;
}

