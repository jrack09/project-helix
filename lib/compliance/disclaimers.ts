/**
 * Centralised disclaimer copy for the companion content API.
 *
 * Every public API response embeds a disclaimer object. Viora is required
 * to render the disclaimer text prominently on every companion screen.
 */

const DISCLAIMER_VERSION = '1.0';

export type DisclaimerObject = {
  text: string;
  version: string;
  as_of: string; // ISO date
};

const GLOBAL = [
  'The information provided is for general educational and lifestyle purposes only.',
  'It is not medical advice and should not be treated as such.',
  'Always follow the instructions and dosage prescribed by your healthcare provider.',
  'If you have concerns about your health or medication, consult your prescriber immediately.',
].join(' ');

const FOOD_GUIDANCE = [
  'Dietary suggestions are general in nature and not a prescription diet plan.',
  'Individual nutritional needs vary. Consult a registered dietitian if you have specific dietary requirements.',
].join(' ');

const SIDE_EFFECT = [
  'Side-effect coping strategies are general and informational only.',
  'If you experience severe, persistent, or unexpected symptoms, contact your prescriber or emergency services immediately.',
].join(' ');

const DRUG_OVERRIDES: Record<string, string> = {
  wegovy: [
    GLOBAL,
    'Wegovy (semaglutide) is a prescription medication.',
    'This content does not replace your prescriber\'s instructions or your care plan.',
  ].join(' '),
  ozempic: [
    GLOBAL,
    'Ozempic (semaglutide) is a prescription medication primarily indicated for type 2 diabetes management.',
    'Any weight-related use is off-label; follow your prescriber\'s guidance.',
  ].join(' '),
};

export function globalDisclaimer(): DisclaimerObject {
  return {
    text: GLOBAL,
    version: DISCLAIMER_VERSION,
    as_of: new Date().toISOString().slice(0, 10),
  };
}

export function foodGuidanceDisclaimer(): DisclaimerObject {
  return {
    text: FOOD_GUIDANCE,
    version: DISCLAIMER_VERSION,
    as_of: new Date().toISOString().slice(0, 10),
  };
}

export function sideEffectDisclaimer(): DisclaimerObject {
  return {
    text: SIDE_EFFECT,
    version: DISCLAIMER_VERSION,
    as_of: new Date().toISOString().slice(0, 10),
  };
}

/**
 * Returns the most specific disclaimer for a given drug slug.
 * Falls back to the global disclaimer if no override is defined.
 */
export function drugDisclaimer(slug: string): DisclaimerObject {
  const text = DRUG_OVERRIDES[slug.toLowerCase()] ?? GLOBAL;
  return {
    text,
    version: DISCLAIMER_VERSION,
    as_of: new Date().toISOString().slice(0, 10),
  };
}
