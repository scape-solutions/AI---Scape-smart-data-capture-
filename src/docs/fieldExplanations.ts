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
    short: 'The number of distinct part variants in this cell. For similar part families, only describe smallest & largest parts + attach overview. Example: 2 unique parts + 1 family with 20 sizes = enter 4.',
    long: 'The total part count determines cell complexity, recipe switching, and tool-changer requirements. If parts belong to the same part family and are very similar, you only need to provide full descriptions and 3D CAD files for the smallest and largest parts, accompanied by an overview document listing all variant dimensions. Example: If you have 2 unique parts plus 1 part family with 20 size variants, enter 4 in this field (Part 1, Part 2, Smallest Part 3, and Largest Part 3).'
  },
  '1.03': {
    fieldId: '1.03',
    fieldLabel: 'Bin type',
    short: 'The format and material of the container holding the parts (e.g. EU-Pallet, Plastic Box, Cardboard Box). Describe bottom profile if wavy or mesh.',
    long: 'Container geometry directly influences vision sensor selection, camera mounting height, and robot collision avoidance. Deep or lattice bins require longer gripper extension tubes to reach bottom corners without hitting bin walls. Translucent or metallic bins may create reflections that affect optical 3D scanners.'
  },
  '1.03_other': {
    fieldId: '1.03_other',
    fieldLabel: 'Specify bin type and bottom details',
    short: 'Custom container description including bottom geometry (flat, lattice, wavy).',
    long: 'Provides engineering details for custom containers, such as corrugated bottoms, welded grid meshes, or custom pallet frames.'
  },
  '1.04': {
    fieldId: '1.04',
    fieldLabel: 'Bin Outer Dimensions (mm)',
    short: 'Outer dimensions of the container (Length x Width x Height in mm, e.g. 1200x800x600).',
    long: 'Outer dimensions define the scanning volume and maximum robot reach required to empty the container. Scape software automatically accounts for wall thickness and calculates corner collision clearance.'
  },
  '1.04_image': {
    fieldId: '1.04_image',
    fieldLabel: 'Upload Photo of Bin / Container (with parts if possible)',
    short: 'Photo of the container showing rim height, wall profile, and bottom geometry with parts inside.',
    long: 'Allows Scape engineers to inspect bin rim thickness, mesh spacing, corrugated bottom ribs, and part nesting depth before vision selection.'
  },
  '1.04_w': {
    fieldId: '1.04_w',
    fieldLabel: 'Bin Width (mm)',
    short: 'Outer width of the bin container in millimeters.',
    long: 'Bin width defines the required Field of View (FOV) for the 3D vision scanner at the top of the bin, as well as the minimum robot arm reach needed to access outer edges.'
  },
  '1.04_l': {
    fieldId: '1.04_l',
    fieldLabel: 'Bin Length (mm)',
    short: 'Outer length of the bin container in millimeters.',
    long: 'Together with width, bin length dictates the 3D vision scanning area. Larger bins (e.g. 1200mm Euro-pallets) require wider scanner coverage or slide-gantry mounting.'
  },
  '1.04_h': {
    fieldId: '1.04_h',
    fieldLabel: 'Bin Height (mm)',
    short: 'Total depth/height of the bin container from top rim to bottom in millimeters.',
    long: 'Bin height determines the vertical stroke requirement for the robot arm and gripper tooling.'
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
    fieldLabel: 'Desired Cycle Time (sec)',
    short: 'Target picking cycle time per part in seconds.',
    long: 'Cycle time dictates required robot motion speed, vision processing speed, and potential need for dual-gripper tooling (picking two parts per bin entry) or multi-robot cell configurations.'
  },
  '2.05': {
    fieldId: '2.05',
    fieldLabel: 'The above cycle time is an average measured over how many cycles (or 1 if it is every single cycle)?',
    short: 'If every part must be delivered at a specific time with no buffer, enter 1 cycle. Otherwise, specify the number of cycles over which the average should be measured (e.g., a specific number of cycles, a full bin, or a full shift).',
    long: 'Clarifies whether the cycle time is an absolute mandatory limit for line sync (1 cycle) or an average measured across multiple cycles, a full bin, or a full shift. In robotic bin-picking, bin-emptying speed varies slightly between top layers (fast) and bottom layers/corners (re-scans), so buffer capacity and cycle measurement basis determine feasibility.'
  },
  '2.05_custom': {
    fieldId: '2.05_custom',
    fieldLabel: 'Specify number of cycles or custom buffer requirement',
    short: 'Custom cycle count or station buffer specification.',
    long: 'Used by Scape engineers to calculate line pacing, buffer station size, and maximum allowed latency during bin corners.'
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
    fieldLabel: 'Determine part orientation / which side is up?',
    short: 'Flat parts may have a small feature on one side that determines its correct orientation. Rotationally symmetric parts may have a small feature that breaks the apparent symmetry.',
    long: 'Regarding orientation: Some parts appear identical on both sides (for instance, a flat part with a small inscription on only one side), but it is important that they are delivered with the correct side facing up. For rotationally symmetric parts (like a ring), there may be a small feature (such as a hole) that breaks the symmetry. In these cases, it is important to place the part so that this feature is in a well-defined position.'
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
