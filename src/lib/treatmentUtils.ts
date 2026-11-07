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
    rawInclusions = parts.slice(1).join('\n').trim();
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

    // Split raw inclusions into candidate segments
    let segments: string[] = [];
    if (rawInclusions.includes('•')) {
      segments = rawInclusions.split('•');
    } else {
      const lines = rawInclusions.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
      if (lines.length > 1) {
        segments = lines;
      } else {
        // Single continuous line without newlines or bullets.
        const chunks: string[] = [];
        const multiRegex = /([^\n\r]+?\s*(?:[—–:]|\s+-\s+)\s*\d+\s*(?:MINUTES?|MINS?|HOURS?|HRS?)\b|\d+\s*(?:MINUTES?|MINS?|HOURS?|HRS?)\s*(?:[—–:]|\s+-\s+)\s*[^—–:\d]+)/gi;
        let m: RegExpExecArray | null;
        while ((m = multiRegex.exec(rawInclusions)) !== null) {
          chunks.push(m[0]);
        }
        segments = chunks.length > 0 ? chunks : [rawInclusions];
      }
    }

    for (let seg of segments) {
      seg = seg.trim().replace(/^[•\-\*\d+[\.\)],\s]+|[•\-\*,\s]+$/g, '');
      if (!seg) continue;

      // Pattern 1: Duration first: e.g. "60 Minutes – Balinese Healing Touch" or "(60 Mins) Body Scrub"
      const durFirst = seg.match(/^(\(?\d+(?:\.\d+)?\s*(?:MINUTES?|MINS?|HOURS?|HRS?)\)?)\s*(?:[—–:\-]\s*|\s+-\s+|\s+)?(.+)$/i);
      if (durFirst) {
        const dur = formatDuration(durFirst[1]);
        const name = durFirst[2].trim().replace(/^[—–:\-\s]+/, '').trim();
        if (name && !inclusions.some(inc => inc.name.toLowerCase() === name.toLowerCase())) {
          inclusions.push({ duration: dur, name });
          continue;
        }
      }

      // Pattern 2: Name first with separator: e.g. "Balinese Healing Touch — 60 MINUTES"
      const nameFirst = seg.match(/^(.+?)\s*(?:[—–:]|\s+-\s+|\()\s*(\d+(?:\.\d+)?\s*(?:MINUTES?|MINS?|HOURS?|HRS?))\)?$/i);
      if (nameFirst) {
        const name = nameFirst[1].trim().replace(/^[•\-\*,\s]+|[•\-\*,\s]+$/g, '');
        const dur = formatDuration(nameFirst[2]);
        if (name && !inclusions.some(inc => inc.name.toLowerCase() === name.toLowerCase())) {
          inclusions.push({ duration: dur, name });
          continue;
        }
      }

      // Pattern 3: Duration anywhere in segment
      const anyDur = seg.match(/(\d+(?:\.\d+)?\s*(?:MINUTES?|MINS?|HOURS?|HRS?))/i);
      if (anyDur) {
        const dur = formatDuration(anyDur[1]);
        const name = seg.replace(anyDur[0], '').replace(/^[—–:\-\s\(\)]+|[—–:\-\s\(\)]+$/g, '').trim();
        if (name && !inclusions.some(inc => inc.name.toLowerCase() === name.toLowerCase())) {
          inclusions.push({ duration: dur, name });
          continue;
        }
      }

      // Fallback: No duration
      if (seg.length > 2) {
        inclusions.push({ duration: '', name: seg });
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
