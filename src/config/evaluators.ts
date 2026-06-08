export const ALLOWED_EVALUATORS = [
  'rde@scapesolutions.eu',
  'jeo@scapesolutions.eu',
  'rkl@scapesolutions.eu',
  'evaluator-scape-solution', // Special ID or name? User said "evaluator-scape-solution"
  'rune.k.larsen@scapesolutions.eu' // Adding current user just in case for testing
];

export const SUPERUSERS = [
  'rune.k.larsen@scapesolutions.eu'
];

export const isAllowedEvaluator = (email: string | null | undefined) => {
  if (!email) return false;
  return ALLOWED_EVALUATORS.includes(email.toLowerCase());
};

export const isSuperuser = (email: string | null | undefined) => {
  if (!email) return false;
  return SUPERUSERS.includes(email.toLowerCase());
};
