// NOTE: This access list is now dynamically loaded from Firestore (config/access document)
// and synced in real-time. The lists below are only used as local offline fallbacks.

export const ALLOWED_EVALUATORS = [
  'rde@scapesolutions.eu',
  'jeo@scapesolutions.eu',
  'rkl@scapesolutions.eu',
  'evaluator-scape-solution',
  'rune.k.larsen@scapesolutions.eu'
];

export const SUPERUSERS = [
  'rune.k.larsen@scapesolutions.eu'
];

export const isAllowedEvaluator = (email: string | null | undefined, allowedList?: string[]) => {
  if (!email) return false;
  const list = allowedList || ALLOWED_EVALUATORS;
  return list.map(e => e.toLowerCase()).includes(email.toLowerCase());
};

export const isSuperuser = (email: string | null | undefined, superuserList?: string[]) => {
  if (!email) return false;
  const list = superuserList || SUPERUSERS;
  return list.map(e => e.toLowerCase()).includes(email.toLowerCase());
};
