/**
 * questionnaire.ts
 * 
 * Denne fil definerer det overordnede spørgeskemaskema (schema) for hele applikationen.
 * Spørgeskemaet er opdelt i to hovedområder:
 * 
 * 1. GENERAL_STEPS ("Project & Cell Info"):
 *    - Indsamler generelle stamdata om selve projektet, kassetype (bin), kassestørrelse og foretrukne robotter.
 *    - Data gemmes direkte under `currentProject.generalResponses` med de tilsvarende id'er.
 * 
 * 2. PART_STEPS (Emne-detaljer):
 *    - Indsamler detaljeret information for hvert enkelt emne (part), f.eks. emnenavn, vægt, dimensioner og billeder.
 *    - Data gemmes under hvert enkelt emne-objekt i `currentProject.parts[index].responses` med de tilsvarende id'er.
 *    - Billeder gemmes under `currentProject.parts[index].images`.
 */

import { 
  Settings2, 
  Box, 
  Maximize, 
  Zap, 
  Camera
} from 'lucide-react';

// Understøttede spørgsmålstyper i UI-generatoren
export type QuestionType = 'text' | 'number' | 'select' | 'boolean' | 'textarea' | 'media';

// Interface for et enkelt spørgsmål i skemaet
export interface Question {
  id: string;          // Unikt ID (f.eks. '1.01' eller '2.01') der svarer til databasenøglen
  label: string;       // Overskrift eller label vist til brugeren
  type: QuestionType;  // Input-type (f.eks. select, text, boolean)
  placeholder?: string;// Valgfri hjælpetekst i feltet
  options?: { value: string; label: string; description?: string }[]; // Valgmuligheder hvis type === 'select'
  description?: string;// Uddybende hjælpetekst under feltet
  important?: boolean; // Angiver om feltet er påkrævet/skal fremhæves
  condition?: (responses: Record<string, any>) => boolean; // Valgfri betingelse for visning af spørgsmålet
}

// Interface for et trin (step / fane) i spørgeskemaet
export interface Step {
  id: string;
  title: string;       // Navn på fanen (f.eks. 'Project & Cell Info' eller 'Part Dimensions')
  icon: any;           // Lucide-react ikon tilknyttet fanen i sidebaren
  scope: 'general' | 'part'; // Omfang (stamdata eller delvist emne-data)
  questions: Question[]; // Liste af spørgsmål under dette trin
}

export const GENERAL_STEPS: Step[] = [
  {
    id: 'general',
    title: 'Project & Cell Info',
    icon: Settings2,
    scope: 'general',
    questions: [
      { id: '1.01', label: 'Project Name', type: 'text', placeholder: 'e.g. Billund Automation 2024', important: true },
      { 
        id: '1.02', 
        label: 'Total of different parts in project', 
        type: 'number', 
        placeholder: 'e.g. 1', 
        important: true,
        description: 'If parts belong to the same part family and are very similar, only describe the smallest and largest parts + attach overview document. Example: 2 unique parts + 1 family with 20 size variants = enter 4 (Part 1, Part 2, Smallest Part 3, Largest Part 3).'
      },
      { 
        id: '1.03', 
        label: 'Bin type', 
        type: 'select', 
        options: [
          { value: 'eu-pallet', label: 'EU-Pallet', description: 'Standard Euro pallet (half or full)' },
          { value: 'metal-solid', label: 'Metal Solid', description: 'Solid metal container' },
          { value: 'metal-lattice', label: 'Metal Lattice', description: 'Mesh or lattice cage' },
          { value: 'plastic-box', label: 'Plastic Box', description: 'KLT or similar plastic box' },
          { value: 'cardboard-box', label: 'Cardboard Box', description: 'Corrugated or solid cardboard container' },
          { value: 'table-magnet', label: 'Table (Magnet)', description: 'Picking from a table with magnets' },
          { value: 'other', label: 'Other', description: 'Custom container or pallet' }
        ], 
        important: true, 
        description: 'The container format determines camera setup, reach, and collision zones. Describe bottom details (flat, lattice, wavy) if needed.' 
      },
      { 
        id: '1.03_other', 
        label: 'Specify bin type and bottom details', 
        type: 'text', 
        placeholder: 'e.g. Wire mesh basket with wavy bottom profile', 
        condition: (res) => res['1.03'] === 'other' 
      },
      { 
        id: '1.04', 
        label: 'Bin Outer Dimensions (mm)', 
        type: 'text', 
        placeholder: 'e.g. 1200x800x600 (LxWxH mm)', 
        important: true,
        description: 'Outer dimensions of the container (Length x Width x Height in mm). AI standardizes the format.' 
      },
      { 
        id: '1.04_image', 
        label: 'Upload Photo of Bin / Container (with parts if possible)', 
        type: 'media', 
        description: 'Upload a photo showing the bin container, rims, and bottom profile with parts inside if available.' 
      },
      { id: '1.05', label: 'Preferred Robot Brand', type: 'select', options: [
        { value: 'ur', label: 'Universal Robots' },
        { value: 'fanuc', label: 'Fanuc' },
        { value: 'abb', label: 'ABB' },
        { value: 'kuka', label: 'KUKA' },
        { value: 'other', label: 'Other' }
      ] },
      { id: '1.05_other', label: 'Specify Robot Brand and Model', type: 'text', placeholder: 'e.g. Kawasaki RS007L', important: true, condition: (res) => res['1.05'] === 'other' },
      { id: '1.06', label: 'Additional Project Notes / Info', type: 'textarea', placeholder: 'e.g. Summarized extra info, ambient light conditions, or cell space limits...' },
      { id: 'generalImages', label: 'Upload Cell & Environmental Photos', type: 'media', description: 'Please upload photos of the robot installation area, ceiling (to check for sunlight interference), overall surroundings, or any other relevant environmental conditions.' }
    ]
  }
];

export const PART_STEPS: Step[] = [
  {
    id: 'part-basics',
    title: 'Part Dimensions',
    icon: Box,
    scope: 'part',
    questions: [
      { id: '2.01', label: 'Part Name / Number', type: 'text', important: true },
      { id: '2.02', label: 'Part Dimensions (mm)', type: 'text', placeholder: 'e.g. 100x150x50', important: true },
      { id: '2.03', label: 'Part Weight (kg)', type: 'number', placeholder: 'e.g. 1.5', important: true },
      { id: '2.03_material', label: 'Part Material', type: 'text', placeholder: 'e.g. Cast Iron, Plastic', important: true },
      { id: '2.04', label: 'Desired Cycle Time (sec)', type: 'number', placeholder: 'e.g. 15', important: true },
      { 
        id: '2.05', 
        label: 'The above cycle time is an average measured over how many cycles (or 1 if it is every single cycle)?', 
        type: 'select', 
        options: [
          { value: '1-cycle-absolute', label: '1 cycle (Absolute line sync — no buffer)', description: 'Every single part must be delivered at this exact pace with no line buffer.' },
          { value: 'full-bin', label: '1 full bin container (Average across full bin)', description: 'Average calculated time per part across a full container including occasional rescans.' },
          { value: 'full-shift', label: '1 shift target (Average over 8 hours)', description: 'Calculated average over an 8-hour production shift with buffer.' },
          { value: 'custom-cycles', label: 'Specific number of cycles (e.g. 5, 10, 50 cycles)', description: 'Specify custom number of cycles.' },
          { value: 'other', label: 'Other cycle requirement', description: 'Custom cycle time requirement basis.' }
        ],
        description: 'If every part must be delivered at a specific time with no buffer, enter 1 cycle. Otherwise, specify the number of cycles over which the average should be measured (e.g., a specific number of cycles, a full bin, or a full shift).'
      },
      { 
        id: '2.05_custom', 
        label: 'Specify number of cycles or custom buffer requirement', 
        type: 'text', 
        placeholder: 'e.g. 25 cycles, or 30 sec buffer before station', 
        condition: (res) => res['2.05'] === 'custom-cycles' || res['2.05'] === 'other' 
      },
      { id: '2.06', label: 'CAD file available for the part?', type: 'boolean', description: 'Preferred format is STL (~0.01 mm accuracy). Other formats (STP/STEP, IGS/IGES) can be converted (no DWG/DXF).' }
    ]
  },
  {
    id: 'surface',
    title: 'Characteristics',
    icon: Zap,
    scope: 'part',
    questions: [
      { id: '2.07', label: 'Any oil/soap/lubrication?', type: 'boolean' },
      { id: '2.08', label: 'Are the parts separated by a slip sheet?', type: 'boolean', description: 'Check YES if layers of parts are separated by sheets.' },
      { id: '2.09', label: 'Risk of entanglement?', type: 'boolean', description: 'Can parts hook into each other?' },
      { id: '2.10', label: 'Any temperature issues?', type: 'boolean', description: 'High temperatures (>50°C) can influence the choice of gripper.' },
      { id: '2.10_temp', label: 'Expected Temperature (°C)', type: 'number', placeholder: 'e.g. 80', condition: (res) => res['2.10'] === true },
      { id: '2.11', label: 'Is the part very shiny?', type: 'boolean', description: 'Reflectivity affects vision selection.' },
      { id: '2.12', label: 'Short description of place requirements', type: 'textarea', placeholder: 'e.g. Must be placed in a welding fixture with 0.5mm tolerance.' },
      { 
        id: '2.13', 
        label: 'Determine part orientation / which side is up?', 
        type: 'boolean',
        description: 'Flat parts may have a small feature determining orientation; rotationally symmetric parts may have a feature breaking symmetry.'
      },
      { id: '2.14', label: 'Any special gripper requirements?', type: 'boolean', description: 'Check YES if a specific gripper is required to hold or place the part.' },
      { id: '2.14_desc', label: 'Specify gripper requirements', type: 'textarea', placeholder: 'e.g. Suction cup size 40mm or specific magnetic gripper...', condition: (res) => res['2.14'] === true },
      { id: '2.15', label: 'Additional Part Notes / Info', type: 'textarea', placeholder: 'e.g. Summarized extra info about part variants, surface conditions, or special handling...' }
    ]
  },
  {
    id: 'media',
    title: 'Visual evidence',
    icon: Camera,
    scope: 'part',
    questions: [
      { id: 'images', label: 'Upload Part Images', type: 'media', description: 'High-res photos from multiple angles.' }
    ]
  }
];
