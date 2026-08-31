/**
 * useProjects.ts
 * Denne Hook håndterer alt der har med "Projekter" at gøre i databasen.
 * Det inkluderer at hente listen, gemme nye, opdatere status og slette.
 */
import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  getDocs,
  query,
  where,
  deleteDoc,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ProjectState, OperationType, PartData } from '../types';
import { GENERAL_STEPS, PART_STEPS } from '../questionnaire';

const FIELD_LABEL_MAP: Record<string, string> = {};
[...GENERAL_STEPS, ...PART_STEPS].forEach(step => {
  step.questions.forEach(q => {
    FIELD_LABEL_MAP[q.id] = q.label;
  });
});

const getFieldNumber = (key: string): string => {
  if (key.match(/^\d+\.\d+_\w+$/)) {
    return key.split('_')[0];
  }
  if (key.match(/^\d+\.\d+$/)) {
    return key;
  }
  if (key === 'projectName') return '1.01';
  if (key === 'cadFile') return '2.06';
  if (key === 'placementImages') return '2.12';
  if (key === 'images') return 'images';
  if (key === 'generalImages') return 'generalImages';
  return key;
};

const getProjectDiffAction = (oldProj: ProjectState, newProj: ProjectState, newStatus: string): string[] => {
  const changes: string[] = [];

  // 1. Status change
  if (newStatus !== oldProj.status) {
    changes.push(`Status updated to ${newStatus}`);
  }

  // 2. Parts count change
  const oldPartsLen = oldProj.parts?.length || 0;
  const newPartsLen = newProj.parts?.length || 0;
  if (newPartsLen > oldPartsLen) {
    changes.push(`Added Part ${newPartsLen}`);
  } else if (newPartsLen < oldPartsLen) {
    changes.push(`Deleted a Part`);
  }

  // 3. General Responses Diffing
  const generalFieldChanges = new Set<string>();
  
  // Project name change
  const oldName = oldProj.projectName || oldProj.generalResponses?.['1.01'];
  const newName = newProj.projectName || newProj.generalResponses?.['1.01'];
  if (newName && oldName && newName !== oldName) {
    generalFieldChanges.add('1.01');
  }

  const allGenKeys = new Set([
    ...Object.keys(oldProj.generalResponses || {}),
    ...Object.keys(newProj.generalResponses || {})
  ]);
  allGenKeys.forEach(key => {
    const oldVal = oldProj.generalResponses?.[key];
    const newVal = newProj.generalResponses?.[key];
    if (String(oldVal || '').trim() !== String(newVal || '').trim()) {
      generalFieldChanges.add(getFieldNumber(key));
    }
  });

  if (generalFieldChanges.size > 0) {
    const sortedFields = Array.from(generalFieldChanges).sort();
    changes.push(`Project: Updated field(s): ${sortedFields.join(', ')}`);
  }

  // 4. Part Responses and Files Diffing
  const minParts = Math.min(oldPartsLen, newPartsLen);
  for (let i = 0; i < minParts; i++) {
    const oldPart = oldProj.parts[i];
    const newPart = newProj.parts[i];
    if (!oldPart || !newPart) continue;

    const partFieldChanges = new Set<string>();
    
    // Compare responses
    const allPartKeys = new Set([
      ...Object.keys(oldPart.responses || {}),
      ...Object.keys(newPart.responses || {})
    ]);
    allPartKeys.forEach(key => {
      const oldVal = oldPart.responses?.[key];
      const newVal = newPart.responses?.[key];
      if (String(oldVal || '').trim() !== String(newVal || '').trim()) {
        partFieldChanges.add(getFieldNumber(key));
      }
    });

    // Compare CAD
    const oldCadName = oldPart.cadFile?.name;
    const newCadName = newPart.cadFile?.name;
    if (newCadName !== oldCadName) {
      partFieldChanges.add('2.06');
    }

    // Compare images count
    const oldImagesCount = oldPart.images?.length || oldPart.imageCount || 0;
    const newImagesCount = newPart.images?.length || newPart.imageCount || 0;
    if (newImagesCount !== oldImagesCount) {
      partFieldChanges.add('images');
    }

    // Compare placement images
    const oldPlacementCount = oldPart.placementImages?.length || 0;
    const newPlacementCount = newPart.placementImages?.length || 0;
    if (newPlacementCount !== oldPlacementCount) {
      partFieldChanges.add('2.12');
    }

    if (partFieldChanges.size > 0) {
      const sortedFields = Array.from(partFieldChanges).sort();
      changes.push(`Part ${i + 1}: Updated field(s): ${sortedFields.join(', ')}`);
    }
  }

  // 5. General/Environmental Images
  const oldGenImgCount = oldProj.generalImages?.length || 0;
  const newGenImgCount = newProj.generalImages?.length || 0;
  if (newGenImgCount !== oldGenImgCount) {
    changes.push(`Project: Updated field(s): generalImages`);
  }

  return changes;
};

export function sanitizeParts(parts: any[]): any[] {
  const arr = Array.isArray(parts) ? parts : [];
  if (arr.length === 0) {
    return [{ responses: {}, images: [], placementImages: [], cadFile: null }];
  }
  return arr.map((part: any) => ({
    responses: part?.responses || {},
    images: Array.isArray(part?.images) ? part.images : [],
    placementImages: Array.isArray(part?.placementImages) ? part.placementImages : [],
    cadFile: part?.cadFile || null
  }));
}

export function normalizeProject(p: any): ProjectState {
  const generalResponses = p?.generalResponses || {};
  
  let parts = Array.isArray(p?.parts) ? p.parts : [];
  if (parts.length === 0) {
    parts = [{ responses: {}, images: [] }];
  }
  
  const normalizedParts = parts.map((part: any) => ({
    responses: part?.responses || {},
    images: Array.isArray(part?.images) ? part.images : [],
    placementImages: Array.isArray(part?.placementImages) ? part.placementImages : [],
    cadFile: part?.cadFile || null
  }));

  return {
    ...p,
    projectName: p?.projectName || generalResponses['1.01'] || p?.generalResponses?.['1.01'] || "Untitled Project",
    generalResponses,
    parts: normalizedParts,
    generalImages: Array.isArray(p?.generalImages) ? p.generalImages : [],
    report: p?.report || null,
    userSubmittedReport: p?.userSubmittedReport || null,
    userSubmittedObservations: p?.userSubmittedObservations || null,
    userSubmittedAdviceTimestamp: p?.userSubmittedAdviceTimestamp || null,
    evaluatorDraft: p?.evaluatorDraft || null,
    finalVerdict: p?.finalVerdict || null,
    fieldObservations: p?.fieldObservations || null,
    status: p?.status || 'draft',
    userId: p?.userId || '',
    isLocked: !!p?.isLocked,
    isVerdictVisible: !!p?.isVerdictVisible,
    ownerName: p?.ownerName || 'Unknown',
    ownerCompany: p?.ownerCompany || 'Unknown',
    ownerEmail: p?.ownerEmail || 'Unknown',
    ownerPhone: p?.ownerPhone || 'Unknown',
    takenBy: p?.takenBy || null,
    takenByName: p?.takenByName || null,
    isInactive: !!p?.isInactive,
    isDeleted: !!p?.isDeleted,
    isDemo: !!p?.isDemo,
    isImportPending: !!p?.isImportPending,
    editRequestPending: !!p?.editRequestPending,
    editRequestReason: p?.editRequestReason || ''
  };
}

const demoProfiles = [
  {
    projectName: "Auto Bracket Feeder",
    binType: "eu-pallet",
    binW: 800, binL: 1200, binH: 600,
    robotBrand: "ur",
    additionalNotes: "Picking heavy galvanized brackets from standard EU-pallets. High ambient sunlight near the main factory window may cause optical noise on standard sensors, so polarizers or shielding might be necessary.",
    ownerName: "Sven Larsson",
    ownerCompany: "Nordic Automation",
    ownerEmail: "sven@nordicauto.se",
    ownerPhone: "+46 8 123 4567",
    parts: [
      {
        name: "L-Bracket 120x80",
        dims: "120x80x40",
        weight: 0.35,
        material: "Galvanized Steel",
        cycleTime: 12,
        cycleTimeBasedOn: "Continuous 3-shift production",
        cadFileAvailable: true,
        shiny: true,
        oil: false,
        entangled: true,
        specialGripper: true,
        placeReqs: "Place flat on delivery conveyor belts with +/-1.0mm orientation accuracy.",
        partNotes: "Outer zinc-plated surface is cosmetically critical; avoid metal-on-metal scraping during gripper actuation."
      },
      {
        name: "U-Bracket 80x80",
        dims: "80x80x40",
        weight: 0.28,
        material: "Galvanized Steel",
        cycleTime: 12,
        cycleTimeBasedOn: "Continuous 3-shift production",
        cadFileAvailable: true,
        shiny: true,
        oil: false,
        entangled: true,
        specialGripper: true,
        placeReqs: "Place flat on delivery conveyor belts.",
        partNotes: "U-brackets interlock heavily in the bin. A separator station or vibration unit is recommended to untangle parts."
      }
    ]
  },
  {
    projectName: "Gearbox Pin Insertion",
    binType: "plastic-box",
    binW: 400, binL: 600, binH: 300,
    robotBrand: "fanuc",
    additionalNotes: "Small steel pins. Requires high accuracy insertion and secondary orientation checks using an optical sensor before placing.",
    ownerName: "Hans Müller",
    ownerCompany: "TechDrive GmbH",
    ownerEmail: "hans.mueller@techdrive.de",
    ownerPhone: "+49 89 9876543",
    parts: [
      {
        name: "Cylindrical Shaft Pin",
        dims: "15x80",
        weight: 0.18,
        material: "Hardened Steel",
        cycleTime: 6,
        cycleTimeBasedOn: "Takt time for line insertion",
        cadFileAvailable: true,
        shiny: false,
        oil: true,
        entangled: false,
        specialGripper: false,
        placeReqs: "Insert with 0.1mm tolerance into housing sleeve.",
        partNotes: "Parts are shipped with a heavy protective oil coating to prevent oxidation. Gripper must be oil-tolerant."
      },
      {
        name: "Grooved Pin 12x60",
        dims: "12x60",
        weight: 0.12,
        material: "Hardened Steel",
        cycleTime: 6,
        cycleTimeBasedOn: "Takt time for line insertion",
        cadFileAvailable: true,
        shiny: false,
        oil: true,
        entangled: false,
        specialGripper: false,
        placeReqs: "Insert with 0.1mm tolerance into gear hub.",
        partNotes: "Oily pins. Need optical check to determine grooved end before insertion."
      }
    ]
  },
  {
    projectName: "Plastic Valve Sorting",
    binType: "metal-solid",
    binW: 600, binL: 800, binH: 500,
    robotBrand: "abb",
    additionalNotes: "Sorting lightweight valves. Ambient dust is present in the area. ABB GoFa cobot preferred for workspace safety.",
    ownerName: "Marie Dupont",
    ownerCompany: "PlastikCorp",
    ownerEmail: "marie.dupont@plastikcorp.fr",
    ownerPhone: "+33 1 4567 8910",
    parts: [
      {
        name: "Asymmetric Valve Housing",
        dims: "60x60x50",
        weight: 0.08,
        material: "Polypropylene",
        cycleTime: 8,
        cycleTimeBasedOn: "Sorting batch run (10,000 units)",
        cadFileAvailable: true,
        shiny: false,
        oil: false,
        entangled: false,
        specialGripper: true,
        placeReqs: "Drop into designated sorting bin compartments.",
        partNotes: "Static charge causes parts to attract dust. High-flow vacuum cup with integrated blow-off is recommended."
      }
    ]
  },
  {
    projectName: "Engine Block Spacer Cell",
    binType: "metal-lattice",
    binW: 800, binL: 1200, binH: 800,
    robotBrand: "kuka",
    additionalNotes: "Heavy cast steel spacer rings. High payload robot (KR 30 or similar) and magnetic or heavy pneumatic gripper required.",
    ownerName: "Giovanni Rossi",
    ownerCompany: "MotorWorks SpA",
    ownerEmail: "giovanni.rossi@motorworks.it",
    ownerPhone: "+39 02 123456",
    parts: [
      {
        name: "Cast Iron Spacer Ring",
        dims: "180x180x30",
        weight: 1.2,
        material: "Cast Iron",
        cycleTime: 18,
        cycleTimeBasedOn: "24/7 assembly line cycle",
        cadFileAvailable: true,
        shiny: false,
        oil: true,
        entangled: false,
        specialGripper: true,
        placeReqs: "Place on index table pegs.",
        partNotes: "Oily cast surfaces. Spacer rings are hot when arriving from the previous machining stage (~65°C).",
        tempIssues: true,
        tempValue: 65
      }
    ]
  },
  {
    projectName: "Battery Terminal Picker",
    binType: "plastic-box",
    binW: 300, binL: 400, binH: 200,
    robotBrand: "ur",
    additionalNotes: "Delicate copper connectors. A lightweight vacuum array gripper is preferred to prevent bending or deformation of thin tabs.",
    ownerName: "John Smith",
    ownerCompany: "VoltEnergy",
    ownerEmail: "jsmith@voltenergy.com",
    ownerPhone: "+1 617 555 0199",
    parts: [
      {
        name: "Copper Connector Strap",
        dims: "80x25x2",
        weight: 0.04,
        material: "Copper Sheet",
        cycleTime: 5,
        cycleTimeBasedOn: "High-speed pack line (12 picks/min)",
        cadFileAvailable: true,
        shiny: true,
        oil: false,
        entangled: true,
        specialGripper: true,
        placeReqs: "Stack neatly inside thermoformed packaging tray.",
        partNotes: "Very thin copper sheet. High specular reflections. Delicate tabs bend easily; suction cup landing force must be monitored."
      }
    ]
  },
  {
    projectName: "Brake Disc De-palletizing",
    binType: "eu-pallet",
    binW: 800, binL: 1200, binH: 450,
    robotBrand: "kuka",
    additionalNotes: "Heavy brake rotors. Parts are arranged in neat layers separated by heavy wooden slip sheets.",
    ownerName: "Jens Hansen",
    ownerCompany: "SafeStop A/S",
    ownerEmail: "jens@safestop.dk",
    ownerPhone: "+45 4012 3456",
    parts: [
      {
        name: "Cast Steel Brake Rotor",
        dims: "280x280x60",
        weight: 6.2,
        material: "Cast Steel",
        cycleTime: 22,
        cycleTimeBasedOn: "CNC lathe machining speed",
        cadFileAvailable: true,
        shiny: false,
        oil: false,
        entangled: false,
        specialGripper: true,
        placeReqs: "Load centering spindle on CNC lathe.",
        partNotes: "Heavy lifting required. Robot must detect when a layer is empty and use a secondary gripper to remove the wooden slip sheet.",
        slipSheet: true
      }
    ]
  },
  {
    projectName: "Piston Rod Assembly Line",
    binType: "metal-solid",
    binW: 600, binL: 800, binH: 400,
    robotBrand: "other",
    robotBrandOther: "Yaskawa GP8",
    additionalNotes: "Prefer Yaskawa GP8 robot. High throughput cell requiring fast motion and precise path planning to avoid bin walls.",
    ownerName: "William Brown",
    ownerCompany: "PrecisionEng Ltd",
    ownerEmail: "w.brown@precisioneng.co.uk",
    ownerPhone: "+44 20 7946 0192",
    parts: [
      {
        name: "Steel Piston Rod 220mm",
        dims: "25x220",
        weight: 0.48,
        material: "Steel alloy",
        cycleTime: 14,
        cycleTimeBasedOn: "Assembly conveyor line takt",
        cadFileAvailable: true,
        shiny: true,
        oil: true,
        entangled: true,
        specialGripper: false,
        placeReqs: "Lay down horizontally in assembly groove.",
        partNotes: "Highly polished shaft. Grip only on non-machined portions or use non-marking polyurethane suction cups to prevent surface blemishes."
      }
    ]
  },
  {
    projectName: "Electrical Box Assembly",
    binType: "plastic-box",
    binW: 400, binL: 600, binH: 400,
    robotBrand: "ur",
    additionalNotes: "Picking terminal boxes. Smooth flat surfaces on top facilitate vacuum suction. Uses UR5e for human-robot collaboration.",
    ownerName: "Sarah Jenkins",
    ownerCompany: "ElectroConnect",
    ownerEmail: "sjenkins@electroconnect.com",
    ownerPhone: "+1 312 555 0143",
    parts: [
      {
        name: "Assembled Terminal Box",
        dims: "150x100x60",
        weight: 0.25,
        material: "ABS Plastic",
        cycleTime: 9,
        cycleTimeBasedOn: "Collaborative assembly takt",
        cadFileAvailable: true,
        shiny: false,
        oil: false,
        entangled: false,
        specialGripper: false,
        placeReqs: "Align and mount onto cabinet DIN rails.",
        partNotes: "Terminal box features fragile snap latches. Robot gripper must clamp gently without breaking plastic clips."
      },
      {
        name: "Plastic Cover Plate",
        dims: "150x100x10",
        weight: 0.08,
        material: "ABS Plastic",
        cycleTime: 6,
        cycleTimeBasedOn: "Collaborative assembly takt",
        cadFileAvailable: true,
        shiny: false,
        oil: false,
        entangled: false,
        specialGripper: false,
        placeReqs: "Place on assembly stack.",
        partNotes: "Flat cover plate. Highly suited for vacuum picking from above."
      }
    ]
  },
  {
    projectName: "Cast Aluminum Pipe Elbows",
    binType: "metal-lattice",
    binW: 800, binL: 1200, binH: 700,
    robotBrand: "abb",
    additionalNotes: "Curved metal elbows. Sand leftovers might be present on parts from the sand-casting process. Dust protection needed.",
    ownerName: "Lars Berg",
    ownerCompany: "AluFoundry",
    ownerEmail: "lars.berg@alufoundry.no",
    ownerPhone: "+47 22 34 56 78",
    parts: [
      {
        name: "Aluminum Tube Elbow 90deg",
        dims: "110x110x50",
        weight: 0.55,
        material: "Cast Aluminum",
        cycleTime: 15,
        cycleTimeBasedOn: "Furnace feed rate",
        cadFileAvailable: true,
        shiny: false,
        oil: false,
        entangled: true,
        specialGripper: true,
        placeReqs: "Place on transfer belt nest.",
        partNotes: "Cast surface is rough. Sand residue will damage standard rubber suction cups. Recommend custom mechanical fingers or high-flow grippers."
      }
    ]
  },
  {
    projectName: "Spark Plug Loader",
    binType: "plastic-box",
    binW: 300, binL: 400, binH: 150,
    robotBrand: "fanuc",
    additionalNotes: "Threaded spark plugs. High speed picking. Preferred robot is Fanuc LR Mate 200iD for its fast cycle time.",
    ownerName: "Yuki Tanaka",
    ownerCompany: "IgniteParts Co",
    ownerEmail: "tanaka.y@igniteparts.co.jp",
    ownerPhone: "+81 3 5555 0123",
    parts: [
      {
        name: "Threaded Spark Plug",
        dims: "20x85",
        weight: 0.065,
        material: "Steel / Ceramic",
        cycleTime: 4,
        cycleTimeBasedOn: "Tester carousel speed",
        cadFileAvailable: true,
        shiny: true,
        oil: false,
        entangled: false,
        specialGripper: false,
        placeReqs: "Insert thread-first into testing carousel socket.",
        partNotes: "Do not grip on the ceramic insulator sleeve to prevent micro-cracks. Clamping force must be carefully restricted to the metal nut hex."
      }
    ]
  },
  {
    projectName: "Bearing Ring Bin Picker",
    binType: "plastic-box",
    binW: 400, binL: 600, binH: 250,
    robotBrand: "ur",
    additionalNotes: "Symmetric bearing rings. Highly oily surfaces. UR5e cobot preferred. Dual gripper recommended.",
    ownerName: "Axel Nielsen",
    ownerCompany: "Rotax Bearings",
    ownerEmail: "axel@rotaxbearings.dk",
    ownerPhone: "+45 2030 4050",
    parts: [
      {
        name: "Steel Bearing Race Ring",
        dims: "85x85x15",
        weight: 0.15,
        material: "Steel",
        cycleTime: 7,
        cycleTimeBasedOn: "Grinding machine feeder speed",
        cadFileAvailable: true,
        shiny: true,
        oil: true,
        entangled: false,
        specialGripper: true,
        placeReqs: "Place on precision shaft assembly peg.",
        partNotes: "High reflection from polished surfaces. Use internal ID expansion gripper to avoid slipping on the oily outer diameter."
      }
    ]
  },
  {
    projectName: "Pump Impeller Sorting Cell",
    binType: "metal-solid",
    binW: 600, binL: 800, binH: 400,
    robotBrand: "abb",
    additionalNotes: "Brass impeller wheels. Robot options: ABB GoFa or ABB IRB 1200. Focus on path planning due to bin-edge proximity.",
    ownerName: "Pierre Martin",
    ownerCompany: "FluidTech SA",
    ownerEmail: "p.martin@fluidtech.be",
    ownerPhone: "+32 2 555 0144",
    parts: [
      {
        name: "Brass Impeller Wheel",
        dims: "120x120x35",
        weight: 0.4,
        material: "Brass",
        cycleTime: 11,
        cycleTimeBasedOn: "Impeller machining block feed",
        cadFileAvailable: true,
        shiny: false,
        oil: false,
        entangled: true,
        specialGripper: true,
        placeReqs: "Insert onto pump center shaft with flat alignment key.",
        partNotes: "Vanes hook easily, forming clusters. A secondary shake station is highly recommended to singulate parts."
      }
    ]
  },
  {
    projectName: "Oil Filter Assembly Picker",
    binType: "eu-pallet",
    binW: 800, binL: 1200, binH: 600,
    robotBrand: "kuka",
    additionalNotes: "Smooth cylindrical filters. Vacuum suction cups are ideal for top-face pickup. Dust protection required for scanner lens.",
    ownerName: "Anna Nowak",
    ownerCompany: "LubeFilter Sp. z o.o.",
    ownerEmail: "a.nowak@lubefilter.pl",
    ownerPhone: "+48 22 123 45 67",
    parts: [
      {
        name: "Cylindrical Canister Filter",
        dims: "90x90x140",
        weight: 0.32,
        material: "Sheet Metal",
        cycleTime: 10,
        cycleTimeBasedOn: "Packaging line speed (60 filters/min)",
        cadFileAvailable: true,
        shiny: false,
        oil: false,
        entangled: false,
        specialGripper: false,
        placeReqs: "Orient vertically and place on box packaging feed.",
        partNotes: "The flat top surface of the canister is perfect for vacuum suction cup. Rationale: high speed, low mechanical stress."
      }
    ]
  },
  {
    projectName: "Car Door Hinge Loader",
    binType: "metal-solid",
    binW: 800, binL: 1200, binH: 500,
    robotBrand: "ur",
    additionalNotes: "Heavy stamped steel hinge assemblies. High nesting/entanglement risk. Robot is UR10e with high payload capability.",
    ownerName: "Carlos Gomez",
    ownerCompany: "AutomotivePlus",
    ownerEmail: "c.gomez@autoplus.es",
    ownerPhone: "+34 91 123 4567",
    parts: [
      {
        name: "Stamped Steel Door Hinge",
        dims: "150x90x40",
        weight: 0.75,
        material: "High-Strength Steel",
        cycleTime: 13,
        cycleTimeBasedOn: "Welding cell duty cycle",
        cadFileAvailable: true,
        shiny: false,
        oil: true,
        entangled: true,
        specialGripper: true,
        placeReqs: "Load into welding clamp pegs.",
        partNotes: "Hinges can hook together. Dual gripper configuration (suction for flat picking + mechanical claws for orientation) recommended."
      }
    ]
  },
  {
    projectName: "Compressor Valve Plates",
    binType: "plastic-box",
    binW: 300, binL: 400, binH: 200,
    robotBrand: "fanuc",
    additionalNotes: "Flat plates. Sticky thin oil film makes them stick together. Magnetic separation/fanning required to pick singular plates.",
    ownerName: "Marco Veen",
    ownerCompany: "AirFlow Systems",
    ownerEmail: "m.veen@airflowsystems.nl",
    ownerPhone: "+31 20 123 4567",
    parts: [
      {
        name: "Flat Carbon Steel Plate",
        dims: "130x70x4",
        weight: 0.11,
        material: "Carbon Steel",
        cycleTime: 8,
        cycleTimeBasedOn: "Packaging line exit rate",
        cadFileAvailable: true,
        shiny: false,
        oil: true,
        entangled: false,
        specialGripper: false,
        placeReqs: "Stack flat inside shipping carton bins.",
        partNotes: "Oil surface tension is strong. Magnets can pre-separate parts. Scanner must detect double-picked plates using height validation."
      }
    ]
  },
  {
    projectName: "Shaft Coupling Feeder",
    binType: "metal-solid",
    binW: 600, binL: 800, binH: 500,
    robotBrand: "ur",
    additionalNotes: "Split collar shaft couplings. Universal Robots UR10e preferred. The oil level is thick, requiring specialized grippers.",
    ownerName: "Erik de Jong",
    ownerCompany: "FlexLink B.V.",
    ownerEmail: "e.dejong@flexlink.nl",
    ownerPhone: "+31 30 987 6543",
    parts: [
      {
        name: "Steel Split Collar Coupling",
        dims: "95x95x60",
        weight: 0.9,
        material: "Mild Steel",
        cycleTime: 16,
        cycleTimeBasedOn: "Keyway assembly line cycle",
        cadFileAvailable: true,
        shiny: false,
        oil: true,
        entangled: false,
        specialGripper: true,
        placeReqs: "Place on keyway shaft and slide in.",
        partNotes: "Heavy grease. Vacuum cup is not feasible due to oil and internal bore. Internal expanding clamp is required."
      }
    ]
  },
  {
    projectName: "Thermostat Housing Picker",
    binType: "metal-solid",
    binW: 600, binL: 800, binH: 450,
    robotBrand: "abb",
    additionalNotes: "Aluminum thermostat housings. Complex geometry with open outlets. Highly structured cell with ABB IRB 1600.",
    ownerName: "David Miller",
    ownerCompany: "ThermalControl Inc",
    ownerEmail: "dmiller@thermalcontrol.com",
    ownerPhone: "+1 416 555 0188",
    parts: [
      {
        name: "Cast Aluminum Housing",
        dims: "140x110x70",
        weight: 0.42,
        material: "Cast Aluminum",
        cycleTime: 12,
        cycleTimeBasedOn: "Leak testing machine feed",
        cadFileAvailable: true,
        shiny: false,
        oil: false,
        entangled: true,
        specialGripper: true,
        placeReqs: "Orient outlet pipes downwards and mount on inspection pins.",
        partNotes: "Aluminum cast parts can have complex gravity centers. Standard mechanical clamp gripper with 3D finder offset correction is recommended."
      }
    ]
  },
  {
    projectName: "Steering Knuckle Picking",
    binType: "eu-pallet",
    binW: 800, binL: 1200, binH: 700,
    robotBrand: "other",
    robotBrandOther: "Kawasaki CX210L",
    additionalNotes: "Heavy forged steering knuckles. Raw forged surface with scaling. Requires a heavy-duty robot brand like Kawasaki CX210L.",
    ownerName: "Dieter Schmidt",
    ownerCompany: "AutoSteer GmbH",
    ownerEmail: "d.schmidt@autosteer.de",
    ownerPhone: "+49 711 12345",
    parts: [
      {
        name: "Forged Steel Steering Knuckle",
        dims: "310x240x150",
        weight: 3.8,
        material: "Forged Steel",
        cycleTime: 25,
        cycleTimeBasedOn: "CNC machining center feed cycle",
        cadFileAvailable: true,
        shiny: false,
        oil: false,
        entangled: true,
        specialGripper: true,
        placeReqs: "Load CNC machining center fixture clamps with +/-0.5mm tolerance.",
        partNotes: "Heavy part. Gripper needs high force and mechanical safety locking pins to prevent drop in case of pneumatic loss."
      }
    ]
  },
  {
    projectName: "Plastic Bottle Cap Feeder",
    binType: "plastic-box",
    binW: 300, binL: 400, binH: 250,
    robotBrand: "ur",
    additionalNotes: "Extremely fast cycle times needed for small caps. UR3e with high-frequency vacuum nozzle.",
    ownerName: "Lisa Green",
    ownerCompany: "PackGlobal Ltd",
    ownerEmail: "lisa.green@packglobal.co.uk",
    ownerPhone: "+44 161 555 0177",
    parts: [
      {
        name: "Threaded Bottle Cap",
        dims: "30x30x12",
        weight: 0.005,
        material: "HDPE Plastic",
        cycleTime: 3,
        cycleTimeBasedOn: "Capping machine hopper feed rate",
        cadFileAvailable: true,
        shiny: false,
        oil: false,
        entangled: false,
        specialGripper: false,
        placeReqs: "Drop into capping hopper chute.",
        partNotes: "Very light parts. Standard cup with vacuum blow-off to prevent sticking on ejection."
      }
    ]
  },
  {
    projectName: "Manifold Plug Insertion",
    binType: "plastic-box",
    binW: 400, binL: 600, binH: 300,
    robotBrand: "ur",
    additionalNotes: "Hexagonal brass plugs. Pick and place using UR5e with force control to thread plugs correctly into manifold.",
    ownerName: "Robert Taylor",
    ownerCompany: "EngineTech Corp",
    ownerEmail: "rtaylor@enginetech.ca",
    ownerPhone: "+1 604 555 0111",
    parts: [
      {
        name: "Hexagonal Brass Plug",
        dims: "40x40x25",
        weight: 0.09,
        material: "Brass",
        cycleTime: 9,
        cycleTimeBasedOn: "Manifold threading cycle time",
        cadFileAvailable: true,
        shiny: true,
        oil: false,
        entangled: false,
        specialGripper: false,
        placeReqs: "Place threaded head inside manifold tap hole.",
        partNotes: "Polished brass causes specular reflections. Opt for polarized lighting. Force control required during thread start."
      }
    ]
  }
];

function buildDemoReportAndVerdict(p: any, index: number, id: string = "MOCK-ID") {
  const robotNameMap: Record<string, string> = {
    ur: "Universal Robots (UR5/UR10/UR16/UR20/UR30)",
    fanuc: "Fanuc (M-10i/M-20i/LR Mate Series)",
    abb: "ABB (IRB 1200/IRB 1600/GoFa Series)",
    kuka: "KUKA (KR Cybertech/KR Agilus Series)",
    other: p.robotBrandOther || "Custom Robot Brand"
  };
  const robotBrandName = robotNameMap[p.robotBrand] || p.robotBrand || "Standard Six-Axis Robot";

  const binNameMap: Record<string, string> = {
    "eu-pallet": "Standard EU-Pallet (1200x800 mm)",
    "metal-solid": "Solid Steel Container",
    "metal-lattice": "Metal Lattice Cage (Gitterbox)",
    "plastic-box": "KLT / Euro-container Plastic Box",
    "table-magnet": "Magnetic Presentation Table",
    "other": "Custom Container / Feed Area"
  };
  const binTypeName = binNameMap[p.binType] || p.binType || "Standard Container";

  // Generate part descriptions
  let partsAnalysis = "";
  p.parts.forEach((part: any, idx: number) => {
    const reflectiveAnalysis = part.shiny 
      ? "High specular reflectivity. Needs polarized filtering on the light source to avoid sensor saturation." 
      : "Low reflectivity, matte surface. Excellent for structured light 3D scanning.";
    
    const oilAnalysis = part.oil 
      ? "Presence of oily lubrication film. Standard suction cups may slip. Recommend oil-resistant NBR/Polyurethane cups or mechanical gripper claws." 
      : "Dry, clean surface. Suitable for standard suction cups or magnetic gripping.";

    const entanglementAnalysis = part.entangled 
      ? "Severe interlocking risk due to open recesses or hooks. Path planning must include secondary shakes or separator nests." 
      : "No interlocking geometry. Parts can be picked individually without separating steps.";

    const gripperAnalysis = part.specialGripper 
      ? `Requires custom gripper design (${part.placeReqs || "specific requirements"}).` 
      : "Standard Scape multi-gripper or single suction pad is sufficient.";

    const cadAnalysis = part.cadFileAvailable !== false
      ? "3D CAD model (STL/STEP) is available. Highly accurate 3D model matching can be performed."
      : "No CAD file provided. Part registration will require scanning a physical part to create a point cloud template.";

    partsAnalysis += `
### Part #${idx + 1}: ${part.name}
* **Dimensions & Weight:** ${part.dims} mm | ${part.weight} kg
* **Material:** ${part.material}
* **Target Cycle Time:** ${part.cycleTime} seconds (Based on: ${part.cycleTimeBasedOn || "Continuous shift"})
* **Visual Characteristics:**
  * Reflectivity: ${part.shiny ? "Highly Reflective" : "Matte / Normal"} (${reflectiveAnalysis})
  * CAD Availability: ${part.cadFileAvailable !== false ? "Yes" : "No"} (${cadAnalysis})
* **Handling Characteristics:**
  * Oily / Lubricated: ${part.oil ? "Yes" : "No"} (${oilAnalysis})
  * Entanglement Risk: ${part.entangled ? "Yes" : "No"} (${entanglementAnalysis})
  * High Temperature: ${part.tempIssues ? `Yes (${part.tempValue || 50}°C)` : "No"}
  * Special Gripper Required: ${part.specialGripper ? "Yes" : "No"} (${gripperAnalysis})
* **Placement Requirements:** ${part.placeReqs || "Standard drop/placement."}
* **Part Notes:** ${part.partNotes || "None provided."}
`;
  });

  // Camera selection based on bin size and part shine
  let recommendedCamera = "Scape Grid Scanner (Standard)";
  let mountingType = "Stationary (mounted on cell frame)";
  let scanDistance = "1200 - 1600";
  
  const maxBinDim = Math.max(p.binW || 0, p.binL || 0);
  if (maxBinDim > 1000) {
    recommendedCamera = "Scape Pro Scanner (High Resolution)";
    mountingType = "Stationary (mounted on gantry)";
    scanDistance = "1600 - 2200";
  } else if (maxBinDim <= 500) {
    recommendedCamera = "Scape Mini Scanner";
    mountingType = "Robot-Mounted (for flexible viewing angles)";
    scanDistance = "600 - 800";
  }
  
  if (p.parts.some((pt: any) => pt.shiny)) {
    recommendedCamera += " with Anti-Reflection Filtering";
  }

  // Create report markdown
  const report = `# Feasibility Evaluation Report: ${p.projectName}
**Client:** ${p.ownerCompany} | **Contact:** ${p.ownerName} (${p.ownerEmail} / ${p.ownerPhone || "+45 88888888"})
**Feasibility ID:** FEAS-${id.substring(0, 8).toUpperCase()}
**Evaluation Status:** Preliminary Feasibility Analysis Completed

---

## 1. Executive Summary
Scape Technologies has evaluated the **${p.projectName}** bin-picking application. The goal is to pick **${p.parts.length}** unique part type(s) from a **${binTypeName}** container and place them according to specifications.

Based on our initial mathematical modeling and comparison against similar historical installations, the project is **FEASIBLE** with specific recommendations outlined below.

---

## 2. Cell Configuration & Boundary Conditions
* **Preferred Robot Brand:** ${robotBrandName}
* **Bin Dimensions:** ${p.binW} mm (W) x ${p.binL} mm (L) x ${p.binH} mm (H)
* **Working Environment Notes:** ${p.additionalNotes || "Standard indoor automation environment."}

---

## 3. Part Characterization & Technical Analysis
The details for the parts under evaluation are summarized below:
${partsAnalysis}

---

## 4. Vision System & Camera Recommendations
* **Recommended Scanner:** **${recommendedCamera}**
* **Mounting Configuration:** **${mountingType}**
* **Optimal Working Distance:** **${scanDistance} mm**
* **Rationale:** The bin volume matches the field-of-view of the ${recommendedCamera}. For parts with surface features of this size, this configuration guarantees a point cloud resolution of under 0.5mm, ensuring reliable part detection even at the bottom of the container.

---

## 5. Risk Assessment & Mitigations
1. **Part Entanglement:** ${p.parts.some((pt: any) => pt.entangled) ? "Yes, there is a risk of interlocking. We recommend integrating a Scape Handling Station or a secondary shaking step to separate parts before insertion." : "Low risk. Parts do not lock together."}
2. **Reflective Surfaces:** ${p.parts.some((pt: any) => pt.shiny) ? "Specular reflections from galvanized or machined steel can create blind spots in standard cameras. The recommended polarized light barrier mitigates this risk." : "No reflective issues anticipated."}
3. **Oil & Gripper Slippage:** ${p.parts.some((pt: any) => pt.oil) ? "Oily surfaces will reduce the friction coefficient. Mechanical gripper jaws with textured contact pads or heavy-duty polyurethane vacuum cups are required." : "Standard suction or picking is suitable."}
`;

  // Create verdict markdown
  let estimatedCycleTime = Math.min(...p.parts.map((pt: any) => pt.cycleTime || 12)) + 1;
  const desiredCycleTime = Math.min(...p.parts.map((pt: any) => pt.cycleTime || 12));
  
  const isAchievable = estimatedCycleTime <= desiredCycleTime ? "Achievable" : "Challenging but Achievable (with dual gripper)";

  const finalVerdict = `# Scape Technical Feasibility Conclusion
**Application Verdict:** **FEASIBLE & APPROVED** (Pending lab verification)

We have finalized the feasibility study for the **${p.projectName}** project. The application is well within the capabilities of the Scape Bin-Picking system.

### Recommended System Specifications:
1. **Scape 3D Vision System:**
   * **Scanner Model:** ${recommendedCamera}
   * **Mount Configuration:** ${mountingType}
   * **Target Scan Cycle Time:** ~1.8 seconds (background scanning supported)
2. **End-of-Arm Tooling (EOAT) Recommendation:**
   * **Type:** ${p.parts.some((pt: any) => pt.specialGripper) ? "Custom Dual-Function Tooling" : "Standard Scape Tooling"}
   * **Actuation:** ${p.parts.some((pt: any) => pt.oil) ? "Pneumatic Clamping / Magnet with rubber lining" : "Pneumatic Vacuum / Magnet"}
   * **Mechanical Safety:** Collision detection software module (Scape Tool Manager) must be active.
3. **Cycle Time Analysis:**
   * Desired Average Cycle Time: **${desiredCycleTime}s**
   * Estimated Achievable: **${estimatedCycleTime}s**
   * Status: **${isAchievable}**
4. **Software & Features:**
   * **Scape 3D Finder** (Part pose calculation)
   * **Scape Tool Manager** (Path planning, collision avoidance, and trajectory optimization)

### Recommended Next Steps:
* Submit physical parts and a container to the Scape Laboratory in Odense, Denmark.
* Perform a 100-pick verification cycle test to fine-tune gripping coordinates and confirm cycle times.
`;

  return { report, finalVerdict };
}

export function useProjects(
  user: any, 
  profile: any, 
  sortBy: string, 
  handleAppError: (e: any, op?: OperationType, path?: string) => void,
  setGlobalSuccess: (msg: string | null) => void,
  userEmail: string | null
) {
  // En liste (array) af ProjectState objekter. Starter som en tom liste [].
  const [projects, setProjects] = useState<ProjectState[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  
  // Det projekt brugeren pt. kigger på eller redigerer
  const [currentProject, setCurrentProject] = useState<ProjectState | null>(null);

  // Changelog = Historikken over handlinger på et specifikt projekt
  const [changelog, setChangelog] = useState<any[]>([]);
  const [showLog, setShowLog] = useState(false);

  // Henter alle projekter fra Firestore-databasen
  const fetchProjects = async (isAdmin: boolean = false) => {
    // Stubbed since the real-time listener (onSnapshot) handles updates automatically.
  };

  // Real-time listener for the projects list
  useEffect(() => {
    if (!user) return;
    setIsLoadingProjects(true);
    let q;
    if (profile?.isAdmin) {
      q = query(collection(db, 'projects'));
    } else {
      q = query(collection(db, 'projects'), where('userId', '==', user.uid));
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      let data = snap.docs.map(d => {
        const rawData = d.data() as any;
        return normalizeProject({ ...rawData, id: d.id });
      });

      // Filter out pending imports for non-superusers
      if (profile?.requestedRole !== 'superuser') {
        data = data.filter(p => !p.isImportPending);
      }

      // If user is in user mode or not an admin, show only their own cards (matching their email),
      // and do not show demo projects or other generated/imported projects.
      if (profile?.requestedRole === 'user' || profile?.requestedRole === 'external' || !profile?.isAdmin) {
        const normalizedEmail = userEmail?.toLowerCase();
        if (normalizedEmail) {
          data = data.filter(p => p.ownerEmail?.toLowerCase() === normalizedEmail);
        }
      }

      // Sortering af data. Først efter dato (nyeste først).
      data.sort((a: any, b: any) => {
        const t1 = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0);
        const t2 = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0);
        return t2 - t1;
      });

      if (sortBy === 'org') {
        data.sort((a, b) => (a.ownerCompany || '').localeCompare(b.ownerCompany || ''));
      } else if (sortBy === 'user') {
        data.sort((a, b) => (a.userId || '').localeCompare(b.userId || ''));
      }

      setProjects(data);
      setIsLoadingProjects(false);
    }, (e) => {
      handleAppError(e, OperationType.LIST, 'projects');
      setIsLoadingProjects(false);
    });

    return () => unsubscribe();
  }, [user, profile?.isAdmin, profile?.requestedRole, sortBy, userEmail]);

  // Sync active project state from database in real time without overwriting local typing/unsaved edits
  const lastSyncedProjectRef = useRef<ProjectState | null>(null);

  useEffect(() => {
    if (currentProject && currentProject.id) {
      // If we switched projects, reset the ref to avoid stale comparisons
      if (lastSyncedProjectRef.current?.id !== currentProject.id) {
        lastSyncedProjectRef.current = null;
      }

      const updated = projects.find(p => p.id === currentProject.id);
      if (updated) {
        const lastSynced = lastSyncedProjectRef.current;

        const hasStatusChange = !lastSynced || updated.status !== lastSynced.status;
        const hasLockChange = !lastSynced || updated.isLocked !== lastSynced.isLocked;
        const hasReportChange = !lastSynced || updated.report !== lastSynced.report;
        const hasDraftChange = !lastSynced || updated.evaluatorDraft !== lastSynced.evaluatorDraft;
        const hasVerdictVisChange = !lastSynced || updated.isVerdictVisible !== lastSynced.isVerdictVisible;
        const hasFinalVerdictChange = !lastSynced || updated.finalVerdict !== lastSynced.finalVerdict;
        const hasTakenByChange = !lastSynced || updated.takenBy !== lastSynced.takenBy;
        const hasTakenByNameChange = !lastSynced || updated.takenByName !== lastSynced.takenByName;
        const hasSpecRequestChange = !lastSynced || 
          updated.editRequestPending !== lastSynced.editRequestPending || 
          updated.editRequestReason !== lastSynced.editRequestReason;

        const lastGenStr = lastSynced ? JSON.stringify(lastSynced.generalResponses || {}) : '';
        const updatedGenStr = JSON.stringify(updated.generalResponses || {});
        const hasGenResponsesChange = !lastSynced || lastGenStr !== updatedGenStr;

        const lastPartsResStr = lastSynced ? JSON.stringify(lastSynced.parts?.map(p => p.responses) || []) : '';
        const updatedPartsResStr = JSON.stringify(updated.parts?.map(p => p.responses) || []);
        const hasPartsResponsesChange = !lastSynced || lastPartsResStr !== updatedPartsResStr;

        const lastChatHistoryStr = lastSynced ? JSON.stringify(lastSynced.chatHistory || []) : '';
        const updatedChatHistoryStr = JSON.stringify(updated.chatHistory || []);
        const hasChatHistoryChange = !lastSynced || lastChatHistoryStr !== updatedChatHistoryStr;

        if (
          hasStatusChange || hasLockChange || hasReportChange || 
          hasDraftChange || hasVerdictVisChange || hasFinalVerdictChange || 
          hasTakenByChange || hasTakenByNameChange || hasGenResponsesChange || 
          hasPartsResponsesChange || hasChatHistoryChange || hasSpecRequestChange
        ) {
          lastSyncedProjectRef.current = updated;

          setCurrentProject(prev => {
            if (!prev) return null;
            
            // Sync general responses and parts responses, but preserve local parts' images/cadFiles
            const mergedParts = updated.parts.map((up: any, idx: number) => {
              const prevPart = prev.parts?.[idx];
              return {
                ...up,
                // Retain local base64 images and cadFile if they exist locally but not in the root db doc
                images: (prevPart?.images && prevPart.images.length > 0) ? prevPart.images : (up.images || []),
                placementImages: (prevPart?.placementImages && prevPart.placementImages.length > 0) ? prevPart.placementImages : (up.placementImages || []),
                cadFile: prevPart?.cadFile || up.cadFile || null
              };
            });

            return {
              ...prev,
              generalResponses: updated.generalResponses,
              parts: mergedParts,
              chatHistory: updated.chatHistory || [],
              status: updated.status,
              isLocked: updated.isLocked,
              report: updated.report,
              evaluatorDraft: updated.evaluatorDraft,
              isVerdictVisible: updated.isVerdictVisible,
              finalVerdict: updated.finalVerdict,
              editRequestPending: updated.editRequestPending,
              editRequestReason: updated.editRequestReason,
              takenBy: updated.takenBy,
              takenByName: updated.takenByName
            };
          });
        }
      }
    } else {
      lastSyncedProjectRef.current = null;
    }
  }, [projects, currentProject]);

  const lastSavedProjectRef = useRef<ProjectState | null>(null);

  useEffect(() => {
    if (currentProject && currentProject.id) {
      if (lastSavedProjectRef.current?.id !== currentProject.id) {
        lastSavedProjectRef.current = JSON.parse(JSON.stringify(currentProject));
      }
    } else if (!currentProject) {
      lastSavedProjectRef.current = null;
    }
  }, [currentProject?.id]);

  // Gemmer en handling i projektets historik (f.eks. "Projekt låst" eller "Projekt oprettet")
  const logChange = async (projectId: string, action: string) => {
    try {
      let roleString = 'User';
      if (profile?.isAdmin) {
        roleString = 'Evaluator';
      } else if (profile?.role === 'enduser') {
        roleString = 'End-user';
      } else if (profile?.role === 'integrator') {
        roleString = 'Integrator';
      } else if (profile?.role) {
        roleString = profile.role.charAt(0).toUpperCase() + profile.role.slice(1);
      }

      await addDoc(collection(db, 'projects', projectId, 'changelog'), {
        action,
        userId: user!.uid,
        userName: profile?.name || user?.displayName || 'Unknown',
        userRole: roleString,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      handleAppError(e);
    }
  };

  // Gemmer billeder i sub-kollektionen for at undgå 1MB Firestore grænsen
  const saveProjectImages = async (projectId: string, projectToSave?: ProjectState) => {
    const project = projectToSave || currentProject;
    if (!project) return;
    const imagesSnap = await getDocs(collection(db, 'projects', projectId, 'images'));
    await Promise.all(imagesSnap.docs.map(doc => deleteDoc(doc.ref)));

    const writePromises: Promise<any>[] = [];
    project.parts.forEach((part, partIndex) => {
      if (part.images && part.images.length > 0) {
        part.images.forEach(base64 => {
          writePromises.push(
            addDoc(collection(db, 'projects', projectId, 'images'), {
              partIndex,
              base64,
              createdAt: serverTimestamp()
            })
          );
        });
      }
      if (part.placementImages && part.placementImages.length > 0) {
        part.placementImages.forEach(base64 => {
          writePromises.push(
            addDoc(collection(db, 'projects', projectId, 'images'), {
              partIndex,
              base64,
              isPlacement: true,
              createdAt: serverTimestamp()
            })
          );
        });
      }
    });

    if (project.generalImages && project.generalImages.length > 0) {
      project.generalImages.forEach(base64 => {
        writePromises.push(
          addDoc(collection(db, 'projects', projectId, 'images'), {
            partIndex: -1,
            base64,
            createdAt: serverTimestamp()
          })
        );
      });
    }

    await Promise.all(writePromises);
  };

  // Henter billeder fra sub-kollektionen for et givent projekt
  const fetchProjectImages = async (p: ProjectState): Promise<ProjectState> => {
    const normalized = normalizeProject(p);
    if (!normalized.id) return normalized;
    try {
      const snap = await getDocs(collection(db, 'projects', normalized.id, 'images'));
      const imagesData = snap.docs.map(d => d.data());
      
      const parts = normalized.parts.map((part, index) => {
        const partImages = imagesData
          .filter((img: any) => img.partIndex === index && !img.isPlacement)
          .sort((a: any, b: any) => {
            const t1 = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const t2 = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return t1 - t2;
          })
          .map((img: any) => img.base64);

        const placementImages = imagesData
          .filter((img: any) => img.partIndex === index && img.isPlacement)
          .sort((a: any, b: any) => {
            const t1 = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const t2 = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return t1 - t2;
          })
          .map((img: any) => img.base64);

        return {
          ...part,
          images: partImages,
          imageCount: partImages.length,
          placementImages
        };
      });

      const generalImages = imagesData
        .filter((img: any) => img.partIndex === -1)
        .sort((a: any, b: any) => {
          const t1 = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const t2 = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return t1 - t2;
        })
        .map((img: any) => img.base64);
      
      return {
        ...normalized,
        parts,
        generalImages
      };
    } catch (e) {
      console.error("Failed to fetch images from sub-collection:", e);
      return normalized;
    }
  };

  // Både Opretter og Opdaterer projekter
  const saveProject = async (
    status: 'draft' | 'submitted' | 'cancelled' | 'approved' | 'rejected' = 'draft',
    projectToSave?: ProjectState
  ) => {
    if (!user) return null;
    const project = projectToSave || currentProject;
    if (!project) return null;
    project.parts = sanitizeParts(project.parts);

    // Hvis projektet er låst (f.eks. Submitted), og man ikke er Admin, forhindrer vi gem.
    if (project.isLocked && !profile?.isAdmin && project.id) {
      return project;
    }

    const email = userEmail;
    
    // Forhindr at gemme de store base64 billeder direkte i hoved-dokumentet (så vi undgår 1MB grænsen!)
    const partsWithoutImages = project.parts.map(p => ({
      ...p,
      imageCount: p.images ? p.images.length : (p.imageCount || 0),
      images: [], // Hoveddokumentet skal ikke have base64 data
      placementImages: [] // Hoveddokumentet skal ikke have base64 data
    }));

    // Vi bygger det data-objekt, vi vil sende til databasen.
    // Vi trækker 'id' ud så vi ALDRIG gemmer et forældet 'id: null' eller database-ID som et felt i Firestore dokumentet!
    const userSubmittedReport = project.userSubmittedReport || (status === 'submitted' ? (project.report || null) : null);
    const userSubmittedObservations = project.userSubmittedObservations || (status === 'submitted' ? (project.fieldObservations || null) : null);
    const userSubmittedAdviceTimestamp = project.userSubmittedAdviceTimestamp || (status === 'submitted' ? (project.lastAdviceTimestamp || new Date().toLocaleString()) : null);

    const data = {
      ...projectDataWithoutId,
      parts: partsWithoutImages,
      generalImages: [], // Hoveddokumentet skal ikke have base64 data
      generalImageCount: project.generalImages ? project.generalImages.length : 0,
      status,
      isLocked: nextLocked,
      userSubmittedReport,
      userSubmittedObservations,
      userSubmittedAdviceTimestamp,
      updatedAt: serverTimestamp(),
      projectName: project.generalResponses['1.01'] || "Untitled Project",
      ownerName: project.ownerName && project.ownerName !== 'Unknown' ? project.ownerName : (profile?.name || user?.displayName || 'Unknown'),
      ownerCompany: project.ownerCompany && project.ownerCompany !== 'Unknown' ? project.ownerCompany : (profile?.company || 'Unknown'),
      ownerEmail: project.ownerEmail && project.ownerEmail !== 'Unknown' ? project.ownerEmail : (email || 'Unknown'),
      ownerPhone: project.ownerPhone && project.ownerPhone !== 'Unknown' ? project.ownerPhone : (profile?.phone || 'Unknown')
    };
    
    // Ensure no undefined fields are passed to Firestore
    const cleanData = { ...data };
    Object.keys(cleanData).forEach(key => {
      if ((cleanData as any)[key] === undefined) {
        delete (cleanData as any)[key];
      }
    });

    try {
      if (!project.id) {
        // Hvis der ikke er noget ID, opretter vi et NYT dokument (addDoc)
        const docRef = await addDoc(collection(db, 'projects'), { ...cleanData, createdAt: serverTimestamp() });
        await saveProjectImages(docRef.id, project);
        const updated = { 
          ...project, 
          id: docRef.id,
          status,
          isLocked: nextLocked,
          userSubmittedReport,
          userSubmittedObservations,
          userSubmittedAdviceTimestamp,
          generalImages: project.generalImages || [],
          projectName: data.projectName,
          ownerName: data.ownerName,
          ownerCompany: data.ownerCompany,
          ownerEmail: data.ownerEmail,
          ownerPhone: data.ownerPhone
        };
        setCurrentProject(updated);
        lastSavedProjectRef.current = JSON.parse(JSON.stringify(updated));
        await logChange(docRef.id, "Created Project");
        fetchProjects(profile?.isAdmin);
        return updated;
      } else {
        // Hvis ID findes, overskriver vi det EKSISTERENDE dokument (updateDoc)
        const oldProject = lastSavedProjectRef.current?.id === project.id 
          ? lastSavedProjectRef.current 
          : projects.find(p => p.id === project.id);

        if (oldProject) {
          const changes = getProjectDiffAction(oldProject, project, status);
          for (const change of changes) {
            await logChange(project.id, change);
          }
        } else {
          const projectStatus = project.status || 'draft';
          if (status !== projectStatus) {
            await logChange(project.id, `Status updated to ${status}`);
          }
        }

        await updateDoc(doc(db, 'projects', project.id), cleanData);
        await saveProjectImages(project.id, project);
        
        // Update local React state to make sure it contains the applied data
        const updated = { 
          ...project, 
          status, 
          isLocked: nextLocked,
          userSubmittedReport,
          userSubmittedObservations,
          userSubmittedAdviceTimestamp,
          generalImages: project.generalImages || [],
          projectName: data.projectName,
          ownerName: data.ownerName,
          ownerCompany: data.ownerCompany,
          ownerEmail: data.ownerEmail,
          ownerPhone: data.ownerPhone
        };
        setCurrentProject(updated);
        lastSavedProjectRef.current = JSON.parse(JSON.stringify(updated));
        
        fetchProjects(profile?.isAdmin);
        
        // Returner det fulde projekt med billederne bevaret i hukommelsen
        return updated;
      }
    } catch (e) {
      handleAppError(e, OperationType.WRITE, currentProject?.id ? `projects/${currentProject.id}` : 'projects');
      return null;
    }
  };

  // Sletter et projekt (soft delete eller hard delete afhængig af parameter)
  const deleteProject = async (p: ProjectState, finalDelete: boolean = false) => {
    try {
      if (finalDelete) {
        await deleteDoc(doc(db, 'projects', p.id!));
        setGlobalSuccess(`Project "${p.projectName}" permanently deleted.`);
      } else {
        await updateDoc(doc(db, 'projects', p.id!), { isDeleted: true });
        await logChange(p.id!, "Project moved to trash");
        setGlobalSuccess(`Project "${p.projectName}" moved to trash.`);
      }
      setTimeout(() => setGlobalSuccess(null), 5000);
      await fetchProjects(profile?.isAdmin);
    } catch (e: any) {
      handleAppError(e, OperationType.DELETE, `projects/${p.id}`);
      throw e;
    }
  };

  const restoreProject = async (p: ProjectState) => {
    try {
      await updateDoc(doc(db, 'projects', p.id!), { isDeleted: false });
      await logChange(p.id!, "Project restored from trash");
      setGlobalSuccess(`Project "${p.projectName}" restored.`);
      setTimeout(() => setGlobalSuccess(null), 5000);
      await fetchProjects(profile?.isAdmin);
    } catch (e: any) {
      handleAppError(e, OperationType.WRITE, `projects/${p.id}`);
      throw e;
    }
  };

  // Henter historikken for et specifikt projekt
  const fetchLog = async (id: string) => {
    const path = `projects/${id}/changelog`;
    try {
      const snap = await getDocs(query(collection(db, 'projects', id, 'changelog'), orderBy('timestamp', 'desc')));
      setChangelog(snap.docs.map(d => d.data()));
      setShowLog(true);
    } catch (e) {
      handleAppError(e, OperationType.LIST, path);
    }
  };

  // En smart "hjælpefunktion" til hurtigt at opdatere ét enkelt felt på et projekt 
  // (f.eks. at skifte 'isLocked' fra true til false)
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  const [isCleaningDemo, setIsCleaningDemo] = useState(false);

  const generateDemoProjects = async () => {
    if (!user) return;
    setIsGeneratingDemo(true);
    try {
      const projectsColl = collection(db, 'projects');
      for (let i = 0; i < demoProfiles.length; i++) {
        const p = demoProfiles[i];
        
        // Generate unique feasibility ID for the report
        const mockId = Math.random().toString(36).substring(2, 10).toUpperCase();
        const { report: generatedReport, finalVerdict: generatedVerdict } = buildDemoReportAndVerdict(p, i, mockId);

        let status: 'draft' | 'submitted' | 'cancelled' | 'approved' | 'rejected' = 'draft';
        let isLocked = false;
        let isVerdictVisible = false;
        let report = null;
        let finalVerdict = null;

        if (i >= 4 && i < 9) {
          status = 'submitted';
          isLocked = false;
          report = generatedReport;
        } else if (i >= 9 && i < 15) {
          status = 'submitted';
          isLocked = true;
          report = generatedReport;
        } else if (i >= 15) {
          status = 'submitted';
          isLocked = true;
          isVerdictVisible = true;
          report = generatedReport;
          finalVerdict = generatedVerdict;
        }

        const projectData = {
          projectName: p.projectName,
          userId: user.uid,
          status: status,
          isDemo: true, // Marked for selective cleanups!
          isLocked: isLocked,
          isVerdictVisible: isVerdictVisible,
          report: report,
          finalVerdict: finalVerdict,
          ownerName: p.ownerName,
          ownerCompany: p.ownerCompany,
          ownerEmail: p.ownerEmail,
          ownerPhone: p.ownerPhone || "+45 88888888",
          generalResponses: {
            "1.01": p.projectName,
            "1.02": p.parts.length,
            "1.03": p.binType,
            "1.04_w": p.binW,
            "1.04_l": p.binL,
            "1.04_h": p.binH,
            "1.05": p.robotBrand,
            "1.05_other": p.robotBrand === 'other' ? (p.robotBrandOther || 'Kawasaki RS007L') : '',
            "1.06": p.additionalNotes
          },
          parts: p.parts.map(part => {
            const partResponses = {
              "2.01": part.name,
              "2.02": part.dims,
              "2.03": part.weight,
              "2.03_material": part.material,
              "2.04": part.cycleTime,
              "2.05": part.cycleTimeBasedOn || "Continuous production line shift",
              "2.06": part.cadFileAvailable !== false,
              "2.11": !!part.shiny,
              "2.07": !!part.oil,
              "2.08": !!part.slipSheet,
              "2.09": !!part.entangled,
              "2.10": !!part.tempIssues,
              "2.10_temp": part.tempValue || null,
              "2.13": part.sideUp !== false,
              "2.14": !!part.specialGripper,
              "2.12": part.placeReqs || "",
              "2.15": part.partNotes || ""
            };
            
            const cadFile = part.cadFileAvailable !== false ? {
              name: `${part.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.stl`,
              size: Math.floor(Math.random() * 120 + 20) * 1024,
              type: "application/octet-stream",
              dataUrl: "data:application/octet-stream;base64,TW9jayBDQUQgRmlsZSBEYXRhIHByb3ZpZGVkIGJ5IFNjYXBlIEV2YWx1YXRvci4="
            } : null;

            return {
              responses: partResponses,
              images: [],
              imageCount: 0,
              cadFile: cadFile
            };
          }),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await addDoc(projectsColl, projectData);
      }
      
      setGlobalSuccess("Successfully generated 20 demo projects!");
      setTimeout(() => setGlobalSuccess(null), 5000);
      await fetchProjects(profile?.isAdmin);
    } catch (e) {
      handleAppError(e, OperationType.WRITE, 'projects');
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  const cleanDemoProjects = async () => {
    if (!user) return;
    setIsCleaningDemo(true);
    try {
      const projectsColl = collection(db, 'projects');
      let demoQuery;
      if (profile?.isAdmin) {
        demoQuery = query(projectsColl, where('isDemo', '==', true));
      } else {
        demoQuery = query(projectsColl, where('isDemo', '==', true), where('userId', '==', user.uid));
      }
      
      const snapshot = await getDocs(demoQuery);
      if (snapshot.empty) {
        setGlobalSuccess("No demo projects found to delete.");
        setTimeout(() => setGlobalSuccess(null), 5000);
        return;
      }

      let deletedCount = 0;
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, 'projects', docSnap.id));
        deletedCount++;
      }
      
      setGlobalSuccess(`Successfully cleaned up ${deletedCount} demo projects.`);
      setTimeout(() => setGlobalSuccess(null), 5000);
      await fetchProjects(profile?.isAdmin);
    } catch (e) {
      handleAppError(e, OperationType.DELETE, 'projects');
    } finally {
      setIsCleaningDemo(false);
    }
  };

  const updateProjectField = async (p: ProjectState, field: string, value: any, logMessage: string) => {
    if (!p.id) return;
    try {
      let finalValue = value;
      if (field === 'parts' && Array.isArray(value)) {
        finalValue = sanitizeParts(value);
      }
      // Firkantede parenteser [field] betyder at vi bruger variabel-navnet som nøgle (key).
      await updateDoc(doc(db, 'projects', p.id), { [field]: finalValue });
      await logChange(p.id, logMessage);
      
      // Opdater også den lokale visning, hvis man er inde på projektet lige nu
      if (currentProject?.id === p.id) {
        setCurrentProject(prev => prev ? ({ ...prev, [field]: value }) : null);
      }
      
      fetchProjects(profile?.isAdmin);
    } catch (e) {
      handleAppError(e);
    }
  };

  const acceptProject = async (projectId: string) => {
    try {
      await updateDoc(doc(db, 'projects', projectId), { isImportPending: false });
      await logChange(projectId, "Project Import Accepted");
      
      if (currentProject?.id === projectId) {
        setCurrentProject(prev => prev ? ({ ...prev, isImportPending: false }) : null);
      }
      
      setGlobalSuccess("Project successfully accepted.");
      setTimeout(() => setGlobalSuccess(null), 5000);
      await fetchProjects(profile?.isAdmin);
    } catch (e) {
      handleAppError(e);
    }
  };

  const acceptAllPendingProjects = async () => {
    const pending = projects.filter(p => p.isImportPending);
    if (pending.length === 0) return;
    
    try {
      await Promise.all(pending.map(async (p) => {
        if (!p.id) return;
        await updateDoc(doc(db, 'projects', p.id), { isImportPending: false });
        await logChange(p.id, "Project Import Accepted (Bulk)");
      }));
      
      setGlobalSuccess(`Successfully accepted and activated ${pending.length} projects.`);
      setTimeout(() => setGlobalSuccess(null), 5000);
      await fetchProjects(profile?.isAdmin);
    } catch (e) {
      handleAppError(e);
    }
  };

  const importProjectsFromJson = async (projectsArray: any[]) => {
    if (!Array.isArray(projectsArray)) {
      handleAppError(new Error("Invalid import format. Expected an array of projects."));
      return;
    }

    try {
      let importedCount = 0;
      for (const p of projectsArray) {
        const projectData = {
          projectName: p.projectName || "Imported Project",
          generalResponses: p.generalResponses || {},
          parts: (p.parts || []).map((part: any) => ({
            responses: part.responses || {},
            images: [],
            imageCount: Array.isArray(part.images) ? part.images.length : 0,
            cadFile: part.cadFile || null
          })),
          generalImages: [],
          report: p.report || null,
          evaluatorDraft: p.evaluatorDraft || null,
          finalVerdict: p.finalVerdict || null,
          fieldObservations: p.fieldObservations || null,
          status: p.status || 'draft',
          userId: p.userId || user?.uid,
          ownerName: p.ownerName || 'Unknown Owner',
          ownerCompany: p.ownerCompany || 'No Company',
          ownerEmail: p.ownerEmail || 'Unknown Email',
          ownerPhone: p.ownerPhone || 'Unknown Phone',
          isLocked: !!p.isLocked,
          isInactive: !!p.isInactive,
          isDeleted: !!p.isDeleted,
          isDemo: !!p.isDemo,
          isImportPending: true,
          takenBy: p.takenBy || null,
          takenByName: p.takenByName || null,
          isVerdictVisible: !!p.isVerdictVisible,
          editRequestPending: !!p.editRequestPending,
          editRequestReason: p.editRequestReason || ''
        };

        const docRef = await addDoc(collection(db, 'projects'), {
          ...projectData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        const projectWithImages = {
          ...projectData,
          generalImages: p.generalImages || [],
          parts: (p.parts || []).map((part: any) => ({
            ...part,
            images: part.images || []
          }))
        } as unknown as ProjectState;

        await saveProjectImages(docRef.id, projectWithImages);
        await logChange(docRef.id, "Project Imported from JSON");
        importedCount++;
      }

      setGlobalSuccess(`Successfully imported ${importedCount} projects. They are pending acceptance.`);
      setTimeout(() => setGlobalSuccess(null), 5000);
      await fetchProjects(profile?.isAdmin);
    } catch (e) {
      handleAppError(e);
    }
  };

  return {
    projects,
    isLoadingProjects,
    currentProject,
    setCurrentProject,
    fetchProjects,
    saveProject,
    saveProjectImages,
    deleteProject,
    restoreProject,
    fetchLog,
    changelog,
    showLog,
    setShowLog,
    updateProjectField,
    logChange,
    fetchProjectImages,
    isGeneratingDemo,
    isCleaningDemo,
    generateDemoProjects,
    cleanDemoProjects,
    acceptProject,
    acceptAllPendingProjects,
    importProjectsFromJson
  };
}
