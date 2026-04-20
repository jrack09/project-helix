/**
 * Companion content compliance guardrails.
 *
 * Posture: "lifestyle guidance + not medical advice" (Found / Ro style).
 * Tips, food guidance, and weekly expectations are allowed. Hard-blocked
 * are medical claims, diagnostic language, and prescription-interference.
 */

type BlockedMatch = { pattern: string; matched: string };

const BLOCKED_PATTERNS: { regex: RegExp; label: string }[] = [
  // Medical-claim language
  { regex: /\bcure[sd]?\b/i, label: 'cure claims' },
  { regex: /\bguarantee[ds]?\s+(results|weight\s+loss|outcomes)/i, label: 'guarantee claims' },
  { regex: /\breverse[sd]?\s+(diabetes|obesity|disease)/i, label: 'reversal claims' },
  { regex: /\btreat(ing|ment\s+for)\b/i, label: 'treatment claims' },
  { regex: /\bheals?\b/i, label: 'healing claims' },

  // Diagnostic language
  { regex: /\byou\s+have\s+(diabetes|obesity|a\s+condition)/i, label: 'diagnostic language' },
  { regex: /\byou('re|\s+are)\s+diagnosed\b/i, label: 'diagnostic language' },

  // Prescription interference
  { regex: /\bstop\s+taking\b/i, label: 'prescription interference' },
  { regex: /\bstop\s+your\s+(medication|prescription|dose|drug)/i, label: 'prescription interference' },
  { regex: /\bskip\s+(a\s+)?dose\b/i, label: 'prescription interference' },
  { regex: /\binstead\s+of\s+your\s+prescribed/i, label: 'prescription interference' },
  { regex: /\bdon't\s+need\s+(your\s+)?(prescription|medication|doctor)/i, label: 'prescription interference' },

  // Comparative superiority over named drugs only (not general comparisons like "more effective than drinking water")
  { regex: /\bbetter\s+than\s+(ozempic|wegovy|mounjaro|semaglutide|tirzepatide|saxenda|liraglutide|zepbound)/i, label: 'comparative superiority claims' },
  { regex: /\bmore\s+effective\s+than\s+(ozempic|wegovy|mounjaro|semaglutide|tirzepatide|saxenda|liraglutide|zepbound|other\s+(?:medications?|drugs?|treatments?))/i, label: 'comparative superiority claims' },
];

/**
 * Returns true if the match at matchIndex is immediately preceded by a
 * negation word (not, never, don't, without) within 40 characters.
 * Handles cases like "do not stop taking" or "without stopping taking".
 */
function isPrecededByNegation(text: string, matchIndex: number): boolean {
  const prefix = text.slice(Math.max(0, matchIndex - 40), matchIndex).toLowerCase();
  return /\b(not|never|don'?t|without)\b/.test(prefix);
}

/**
 * Returns the first compliance violation found, or null if the text is safe.
 */
export function checkComplianceSafe(text: string): BlockedMatch | null {
  for (const { regex, label } of BLOCKED_PATTERNS) {
    const re = new RegExp(regex.source, regex.flags);
    const match = re.exec(text);
    if (match && !isPrecededByNegation(text, match.index)) {
      return { pattern: label, matched: match[0] };
    }
  }
  return null;
}

/**
 * Throws if text contains a blocked pattern. Used server-side on publish.
 */
export function assertComplianceSafe(text: string, fieldName?: string): void {
  const violation = checkComplianceSafe(text);
  if (violation) {
    const field = fieldName ? ` in field "${fieldName}"` : '';
    throw new Error(
      `Compliance violation${field}: "${violation.matched}" matches blocked pattern (${violation.pattern}).`
    );
  }
}

/** @deprecated Use assertComplianceSafe. Kept for backward compat with AI summary route. */
export function assertSafeEducationalOutput(text: string): true {
  assertComplianceSafe(text);
  return true;
}
