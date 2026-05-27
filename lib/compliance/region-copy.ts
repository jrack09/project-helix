/** Informational regional notes — not legal classification. */

const REGION_MESSAGES: Record<string, string> = {
  AU:
    'Product and peptide regulatory status differs by jurisdiction. Nothing here addresses Australian TGA scheduling or import rules.',
  US: 'FDA regulatory status of peptides varies; this platform does not classify compounds or legal availability.',
  EU: 'Marketing and prescription rules differ across EU member states; verify local regulations independently.',
  UK: 'MHRA and misuse of drugs frameworks may apply to certain peptides; consult official guidance.',
  DEFAULT:
    'Laws and regulatory treatment of research peptides vary widely by region; verify your local rules through official channels.',
};

export function getRegionNotice(regionCode: string | null | undefined): string {
  const key = regionCode?.toUpperCase().trim();
  if (key && REGION_MESSAGES[key]) {
    return REGION_MESSAGES[key];
  }
  return REGION_MESSAGES.DEFAULT;
}
