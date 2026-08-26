/**
 * fieldExplanations.ts
 * 
 * Central repository of technical explanations for every questionnaire field in the 
 * Scape Bin-Picker Evaluator application.
 * 
 * Each field includes:
 * - short: A concise 1-2 sentence guidance summary shown in the primary info tooltip.
 * - long: A comprehensive technical explanation detailing why the parameter matters,
 *   its impact on vision sensor selection, robot reach, gripper choice, cycle time,
 *   and feasibility analysis.
 * 
 * This file also serves as the knowledge base for the upcoming Help AI system.
 */

export interface FieldExplanation {
  fieldId: string;
  fieldLabel: string;
  short: string;
  long: string;
}

export const FIELD_EXPLANATIONS: Record<string, FieldExplanation> = {
  // --- GENERAL PROJECT & CELL FIELDS ---
  '1.01': {
    fieldId: '1.01',
    fieldLabel: 'Project Name',
    short: 'Unique descriptive title identifying the customer installation or automation project.',
    long: 'The Project Name is used throughout Scape Solutions to track evaluation files, CAD models, and technical reports. Providing a clear name (including customer or location name) ensures fast identification and avoids project misassignment in multi-part studies.'
  },
  '1.02': {
    fieldId: '1.02',
    fieldLabel: 'Total of different parts in project',
    short: 'The number of distinct part variants that will be picked in this robotic cell.',
    long: 'The total part count determines cell complexity and tool-changer requirements. Handling multiple part geometries in a single cell may require modular grippers, multi-recipe vision software, or automatic tool changers. Specifying this number allows the application to automatically generate dedicated specification tabs for each part variant.'
  },
  '1.03': {
    fieldId: '1.03',
    fieldLabel: 'Bin type',
    short: 'The format and material of the container holding the parts (e.g. EU-Pallet, Plastic Box, Cardboard Box).',
    long: 'Container geometry directly influences vision sensor selection, camera mounting height, and robot collision avoidance. Deep or lattice bins require longer gripper extension tubes to reach bottom corners without hitting bin walls. Translucent or metallic bins may create reflections that affect optical 3D scanners.'
  },
  '1.04_w': {
    fieldId: '1.04_w',
    fieldLabel: 'Bin Width (mm)',
    short: 'Outer or inner width of the bin container in millimeters.',
    long: 'Bin width defines the required Field of View (FOV) for the 3D vision scanner at the top of the bin, as well as the minimum robot arm reach needed to access outer edges without colliding with the surrounding cell structure.'
  },
  '1.04_l': {
    fieldId: '1.04_l',
    fieldLabel: 'Bin Length (mm)',
    short: 'Outer or inner length of the bin container in millimeters.',
    long: 'Together with width, bin length dictates the 3D vision scanning area. Larger bins (e.g. 1200mm Euro-pallets) require wider scanner coverage or slide-gantry mounting to maintain high 3D point cloud resolution across all corners.'
  },
  '1.04_h': {
    fieldId: '1.04_h',
    fieldLabel: 'Bin Height (mm)',
    short: 'Total depth/height of the bin container from top rim to bottom in millimeters.',
    long: 'Bin height determines the vertical stroke requirement for the robot arm and gripper tooling. Deep bins (e.g. >600mm) increase the risk of collision between the robot wrist and the top bin edges when picking parts near the bottom floor, necessitating slim gripper shafts or collision-aware motion planning.'
  },
  '1.05': {
    fieldId: '1.05',
    fieldLabel: 'Preferred Robot Brand',
    short: 'The preferred industrial robot manufacturer for integration (e.g. Universal Robots, Fanuc, ABB, KUKA).',
    long: 'Robot brand selection determines controller interface protocols, payload capacities, motion execution speeds, and software driver compatibility with Scape Orientator and Bin-Picker software packages.'
  },
  '1.05_other': {
    fieldId: '1.05_other',
    fieldLabel: 'Specify Robot Brand and Model',
    short: 'Exact model designation if using a non-standard or custom robot brand.',
    long: 'Detailed robot model numbers (e.g. Kawasaki RS007L or Yaskawa GP8) allow Scape engineers to verify reach envelopes, maximum wrist payload, payload inertia limits, and communication interfaces.'
  },
  '1.06': {
    fieldId: '1.06',
    fieldLabel: 'Additional Project Notes / Info',
    short: 'General ambient conditions, cell layout constraints, safety requirements, or customer preferences.',
    long: 'Captures ambient lighting (e.g. direct sunlight near windows), floor space limits, safety fence boundaries, or special customer operating environments that impact cell feasibility but do not fit standard schema fields.'
  },
  'generalImages': {
    fieldId: 'generalImages',
    fieldLabel: 'Upload Cell & Environmental Photos',
    short: 'Overview photos of the cell installation site, ceiling lighting, and container placement.',
    long: 'Environmental photos allow Scape vision engineers to evaluate ambient lighting hazards (sunlight, overhead mercury lamps), physical access obstructions, overhead clearance for vision sensor towers, and bin feeding mechanism layouts.'
  },

  // --- PART SPECIFIC FIELDS ---
  '2.01': {
    fieldId: '2.01',
    fieldLabel: 'Part Name / Number',
    short: 'Component name or internal part ID number.',
    long: 'Distinguishes individual part variants within multi-part projects. Used to organize CAD models, 3D recognition training recipes, and gripper configuration files.'
  },
  '2.02': {
    fieldId: '2.02',
    fieldLabel: 'Part Dimensions (mm)',
    short: 'Bounding box dimensions of the part (Length × Width × Height in mm).',
    long: 'Part size determines the required camera resolution and point cloud density. Small parts (<20mm) require high-resolution 3D sensors with short focal lengths, while large parts require high payload grippers and wider camera fields of view.'
  },
  '2.03': {
    fieldId: '2.03',
    fieldLabel: 'Part Weight (kg)',
    short: 'Mass of a single individual part in kilograms.',
    long: 'Part weight specifies the required robot payload capacity and gripper holding force. Total payload calculations must account for the combined weight of the part, gripper tooling, sensors, and safety margin under maximum robot acceleration.'
  },
  '2.03_material': {
    fieldId: '2.03_material',
    fieldLabel: 'Part Material',
    short: 'Composition material of the part (e.g. Cast Iron, Stainless Steel, Aluminum, Plastic).',
    long: 'Material properties determine gripper mechanism feasibility (magnetic grippers require ferromagnetic metals like iron/steel; vacuum cups require smooth non-porous surfaces) and 3D optical scanning performance.'
  },
  '2.04': {
    fieldId: '2.04',
    fieldLabel: 'Desired Average Cycle Time (sec)',
    short: 'Target picking cycle time per part in seconds.',
    long: 'Cycle time dictates required robot motion speed, vision processing speed, and potential need for dual-gripper tooling (picking two parts per bin entry) or multi-robot cell configurations.'
  },
  '2.05': {
    fieldId: '2.05',
    fieldLabel: 'Average Cycle Time Based On',
    short: 'Operating basis for the cycle time requirement (e.g. 1 bin, 1 shift, or peak line rate).',
    long: 'Clarifies whether the cycle time is an absolute mandatory limit for production line synchronization or an average calculated across a full bin. Average cycle times account for occasional re-scanning when bins become nearly empty.'
  },
  '2.06': {
    fieldId: '2.06',
    fieldLabel: 'CAD file available for the part?',
    short: 'Availability of 3D CAD files (STL, STEP/STP, IGS/IGES) for model-based recognition.',
    long: 'Scape 3D recognition relies on 3D CAD models to generate point-cloud matching templates. Providing accurate STL (~0.01mm accuracy) or STEP files eliminates manual part teaching and guarantees precise picking pose calculations.'
  },
  '2.11': {
    fieldId: '2.11',
    fieldLabel: 'Is the part very shiny?',
    short: 'High surface reflectivity, polished metal, or chrome finish.',
    long: 'Highly reflective or mirror-like surfaces scatter optical 3D scanner light, creating specular highlights or missing point cloud areas. Identifying shiny parts ensures selection of specialized laser or structured-light scanners equipped with anti-reflection algorithms.'
  },
  '2.07': {
    fieldId: '2.07',
    fieldLabel: 'Any oil/soap/lubrication?',
    short: 'Presence of oil, machining coolant, wash fluid, or wet lubricants on the part surface.',
    long: 'Surface fluids affect suction cup adhesion and mechanical friction. Wet or oily parts can cause vacuum cup slippage, requiring specialized oil-resistant suction cups, contoured mechanical jaws, or magnetic grippers.'
  },
  '2.08': {
    fieldId: '2.08',
    fieldLabel: 'Are the parts separated by a slip sheet?',
    short: 'Cardboard, plastic, or paper layer sheets separating part layers in the bin.',
    long: 'Layer sheets require dedicated slip-sheet removal routines or secondary suction cups on the gripper so the robot can remove the sheet when a layer is emptied before continuing to pick parts underneath.'
  },
  '2.09': {
    fieldId: '2.09',
    fieldLabel: 'Risk of entanglement?',
    short: 'Tendency of parts to hook, interlock, or nest together in the container.',
    long: 'Entangled parts (e.g. springs, hooks, stamped brackets) can cause multiple parts to lift simultaneously. Identifying entanglement risk prompts specialized shaking, orientation verification, or force-sensing release routines.'
  },
  '2.10': {
    fieldId: '2.10',
    fieldLabel: 'Any temperature issues?',
    short: 'Elevated part or environment temperatures (>50°C).',
    long: 'Hot parts (e.g. fresh from forging, casting, or heat treatment) degrade standard rubber suction cups and electronic sensors. High temperatures require heat-resistant fluoroelastomer/silicone cups or cooled mechanical grippers.'
  },
  '2.10_temp': {
    fieldId: '2.10_temp',
    fieldLabel: 'Expected Temperature (°C)',
    short: 'Approximate part temperature in degrees Celsius.',
    long: 'Specific temperature values dictate material selection for gripper seals, vacuum tubing, and pneumatic actuators to prevent thermal degradation during continuous production.'
  },
  '2.13': {
    fieldId: '2.13',
    fieldLabel: 'Determine which side is up?',
    short: 'Requirement to identify orientation or specific face (top vs bottom) before placement.',
    long: 'When parts must be placed in a machine in a specific orientation, Scape software uses 3D pose estimation or a secondary Scape Orientator station to re-orient parts mid-flight if picked upside down.'
  },
  '2.14': {
    fieldId: '2.14',
    fieldLabel: 'Any special gripper requirements?',
    short: 'Forbidden contact zones, precision tolerances, or customer-mandated gripper brands.',
    long: 'Identifies non-standard gripping conditions such as delicate polished surfaces, restricted clamping areas, or required vacuum monitor sensors.'
  },
  '2.14_desc': {
    fieldId: '2.14_desc',
    fieldLabel: 'Specify gripper requirements',
    short: 'Detailed description of forbidden surfaces, clamping locations, or gripper specifications.',
    long: 'Provides exact engineering instructions for tool designers, specifying allowed jaw touchpoints, suction cup diameters, or forbidden surface contact zones.'
  },
  '2.12': {
    fieldId: '2.12',
    fieldLabel: 'Short description of place requirements',
    short: 'Destination specification (e.g. CNC chuck, conveyor belt, assembly fixture tolerance).',
    long: 'Placement criteria define required placement precision (e.g. ±0.5mm into a fixture vs rough drop on a conveyor). High precision placement may require secondary mechanical alignment or fine-positioning sensors.'
  },
  '2.15': {
    fieldId: '2.15',
    fieldLabel: 'Additional Part Notes / Info',
    short: 'Extra information regarding part variants, surface coatings, or handling exceptions.',
    long: 'Captures specialized part knowledge such as fragile features, surface treatment sensitivity, or batch variations that influence gripper design and vision algorithms.'
  },
  'images': {
    fieldId: 'images',
    fieldLabel: 'Upload Part Images',
    short: 'Clear high-resolution photos of the part from multiple angles.',
    long: 'Real photos allow Scape vision engineers to inspect surface texture, chamfers, holes, reflectivity, and potential gripping locations prior to CAD matching tests.'
  }
};

/**
 * Helper to retrieve short and long explanations for any field ID.
 * Falls back to default guidance if a field ID is not specifically mapped.
 */
export function getFieldExplanation(fieldId: string, fallbackLabel?: string, fallbackDesc?: string): FieldExplanation {
  if (FIELD_EXPLANATIONS[fieldId]) {
    return FIELD_EXPLANATIONS[fieldId];
  }
  return {
    fieldId,
    fieldLabel: fallbackLabel || `Field ${fieldId}`,
    short: fallbackDesc || 'Provide parameter details to complete the evaluation profile.',
    long: fallbackDesc 
      ? `${fallbackDesc} This parameter is used by Scape engineers to evaluate robotic cell feasibility and select optimal vision sensors.` 
      : 'This parameter is used by Scape engineers to evaluate robotic cell feasibility, calculate cycle times, and select optimal vision sensors and gripper tooling.'
  };
}
