/**
 * TypeScript (TS) giver os mulighed for at definere "Typer".
 * Da JavaScript normalt ikke ved, om en variabel er en string, et tal eller et objekt,
 * bruger vi TS til at bygge "skabeloner" for vores data. Det fanger fejl,
 * før vi kører koden, fordi editoren advarer os, hvis vi glemmer en egenskab.
 */

/**
 * En 'enum' (enumeration) er en måde at give venlige navne til et sæt af faste værdier.
 * Her bruger vi det til at definere, hvilke typer database-operationer vi udfører.
 */
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

/**
 * En 'interface' beskriver formen på et objekt.
 * Det svarer lidt til en struct i C, hvor vi definerer præcis,
 * hvilke felter objektet skal have, og hvilke datatyper de er.
 */
export interface PartData {
  responses: Record<string, any>;
  images: string[];
  imageCount?: number; // Cached image count stored in main doc (images are stored separately)
  cadFile?: { name: string; size: number; type: string; dataUrl: string } | null;
  placementImages?: string[];
}

export interface ProjectState {
  // id kan enten være en string eller null (hvis projektet ikke er gemt i databasen endnu)
  id: string | null;
  projectName: string;
  generalResponses: Record<string, any>;
  parts: PartData[];
  generalImages?: string[];
  report: string | null;
  evaluatorDraft?: string | null;
  finalVerdict?: string | null;
  chatHistory?: { role: 'user' | 'model'; text: string; images?: string[] }[];
  /** Structured field-level observations extracted from the Project Information Advice.
   *  Keys are questionnaire field IDs (e.g. "1.03", "2.04").
   *  Populated automatically after advice is generated. */
  fieldObservations?: Record<string, { severity: 'warning' | 'critical'; text: string }> | null;
  /** Snapshot of responses taken when AI advice was last generated */
  lastAdviceResponsesSnapshot?: { general: Record<string, any>; parts: Record<string, any>[] } | null;
  lastAdviceTimestamp?: string | null;
  /** Frozen snapshot of the user's Project Information Advice report at submission time */
  userSubmittedReport?: string | null;
  /** Frozen snapshot of the field observations at submission time */
  userSubmittedObservations?: Record<string, { severity: 'warning' | 'critical'; text: string }> | null;
  /** Timestamp when the submitted advice snapshot was generated */
  userSubmittedAdviceTimestamp?: string | null;
  userSubmissionNotes?: string;
  lastActiveStep?: number;
  lastActivePartIndex?: number;
  lastActiveCustomSection?: 'business-case' | 'additional-opportunities' | 'scape-review' | null;
  lastIsReviewing?: boolean;
  // 'status' kan KUN være en af disse præcise strenge. Det kaldes en "Union Type".
  status: 'draft' | 'submitted' | 'cancelled' | 'approved' | 'rejected';
  userId: string;
  
  // Spørgsmålstegnet (?) betyder, at dette felt er "optional" (valgfrit).
  // Objektet behøver ikke at have dette felt, når det oprettes.
  isLocked?: boolean;
  isInactive?: boolean;
  isDeleted?: boolean;
  isDemo?: boolean;
  isImportPending?: boolean;
  isSplitScreen?: boolean; // True if the project was created via AI Onboarding
  editRequestPending?: boolean;
  editRequestReason?: string;
  takenBy?: string;
  takenByName?: string;
  isVerdictVisible?: boolean;
  ownerName?: string;
  ownerCompany?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  
  // 'any' betyder, at vi slår type-kontrollen fra her. 
  // Her forventer vi et Firebase Timestamp objekt.
  updatedAt?: any;
  createdAt?: any;
}

export interface UserProfile {
  name: string;
  company: string;
  organization?: string;
  role: 'enduser' | 'integrator' | 'other';
  email: string;
  phone?: string;
  isAdmin?: boolean;
  requestedRole?: 'evaluator' | 'user' | 'superuser';
  userModePreferred?: boolean;
  tosAcceptedAt?: any;
  lastActiveAt?: string;
}

