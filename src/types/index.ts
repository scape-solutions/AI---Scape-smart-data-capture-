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
  // Record<string, any> betyder en "Dictionary" eller "Map",
  // hvor nøglen (key) er en string, og værdien (value) kan være hvad som helst (any).
  responses: Record<string, any>;
  // Et array af strings (f.eks. base64-kodede billeder eller URL'er)
  images: string[];
  // Valgfri 3D CAD-fil gemt som Base64 i Firestore
  cadFile?: { name: string; size: number; type: string; dataUrl: string } | null;
}

export interface ProjectState {
  // id kan enten være en string eller null (hvis projektet ikke er gemt i databasen endnu)
  id: string | null;
  projectName: string;
  generalResponses: Record<string, any>;
  parts: PartData[];
  report: string | null;
  // 'status' kan KUN være en af disse præcise strenge. Det kaldes en "Union Type".
  status: 'draft' | 'submitted' | 'cancelled' | 'approved' | 'rejected';
  userId: string;
  
  // Spørgsmålstegnet (?) betyder, at dette felt er "optional" (valgfrit).
  // Objektet behøver ikke at have dette felt, når det oprettes.
  isLocked?: boolean;
  isFullySpecified?: boolean;
  isInactive?: boolean;
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
  requestedRole?: 'evaluator' | 'external';
}

