// Dynamically loaded from Firestore (config/access document) in real-time.
export const ALLOWED_EVALUATORS: string[] = [];

export const SUPERUSERS: string[] = [];

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
