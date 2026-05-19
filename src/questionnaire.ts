import { 
  Settings2, 
  Box, 
  Maximize, 
  Zap, 
  Camera
} from 'lucide-react';

export type QuestionType = 'text' | 'number' | 'select' | 'boolean' | 'textarea' | 'media';

export interface Question {
  id: string;
  label: string;
  type: QuestionType;
  placeholder?: string;
  options?: { value: string; label: string; description?: string }[];
  description?: string;
  important?: boolean;
}

export interface Step {
  id: string;
  title: string;
  icon: any;
  scope: 'general' | 'part';
  questions: Question[];
}

export const GENERAL_STEPS: Step[] = [
  {
    id: 'general',
    title: 'General Information',
    icon: Settings2,
    scope: 'general',
    questions: [
      { id: '1.01', label: 'Project Name', type: 'text', placeholder: 'e.g. Billund Automation 2024', important: true },
      { id: '1.03', label: 'Bin type', type: 'select', options: [
        { value: 'eu-pallet', label: 'EU-Pallet', description: 'Standard Euro pallet' },
        { value: 'metal-solid', label: 'Metal Solid', description: 'Solid metal container' },
        { value: 'metal-lattice', label: 'Metal Lattice', description: 'Mesh or lattice cage' },
        { value: 'plastic-box', label: 'Plastic Box', description: 'KLT or similar plastic box' },
        { value: 'table-magnet', label: 'Table (Magnet)', description: 'Picking from a table with magnets' },
        { value: 'other', label: 'Other', description: 'Custom solution' }
      ], important: true },
      { id: '1.04_w', label: 'Bin Width (mm)', type: 'number', placeholder: 'e.g. 800' },
      { id: '1.04_l', label: 'Bin Length (mm)', type: 'number', placeholder: 'e.g. 1200' },
      { id: '1.04_h', label: 'Bin Height (mm)', type: 'number', placeholder: 'e.g. 600' },
      { id: '1.05', label: 'Preferred Robot Brand', type: 'select', options: [
        { value: 'ur', label: 'Universal Robots' },
        { value: 'fanuc', label: 'Fanuc' },
        { value: 'abb', label: 'ABB' },
        { value: 'kuka', label: 'KUKA' },
        { value: 'other', label: 'Other' }
      ] }
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
      { id: '2.14', label: 'Part Material', type: 'text', placeholder: 'e.g. Cast Iron, Plastic', important: true },
      { id: '2.04', label: 'Desired Average Cycle Time (sec)', type: 'number', placeholder: 'e.g. 15', important: true }
    ]
  },
  {
    id: 'surface',
    title: 'Characteristics',
    icon: Zap,
    scope: 'part',
    questions: [
      { id: '2.11', label: 'Is the part very shiny?', type: 'boolean', description: 'Reflectivity affects vision selection.' },
      { id: '2.07', label: 'Any oil/soap/lubrication?', type: 'boolean' },
      { id: '2.09', label: 'Risk of entanglement?', type: 'boolean', description: 'Can parts hook into each other?' },
      { id: '2.13', label: 'Determine which side is up?', type: 'boolean' }
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
