/**
 * scratch/generate_demo_projects.js
 * 
 * Description:
 * This script connects to the Firestore database using the configuration in
 * firebase-applet-config.json, signs in programmatically using the provided credentials,
 * and generates 20 highly realistic, diverse mock projects. Each project is tagged
 * with "isDemo: true" so it can be selectively deleted later.
 * 
 * Usage:
 * node scratch/generate_demo_projects.js <your-login-email> <your-login-password>
 * 
 * Example:
 * node scratch/generate_demo_projects.js rune@scapesolutions.dk mySecretPassword123
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Load config
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
if (!fs.existsSync(configPath)) {
  console.error("Error: firebase-applet-config.json not found in the project root directory.");
  process.exit(1);
}
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Arguments check
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log("Usage: node scratch/generate_demo_projects.js <email> <password>");
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// 20 diverse bin-picking projects
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

function buildDemoReportAndVerdict(p, index, id = "MOCK-ID") {
  const robotNameMap = {
    ur: "Universal Robots (UR5/UR10/UR16/UR20/UR30)",
    fanuc: "Fanuc (M-10i/M-20i/LR Mate Series)",
    abb: "ABB (IRB 1200/IRB 1600/GoFa Series)",
    kuka: "KUKA (KR Cybertech/KR Agilus Series)",
    other: p.robotBrandOther || "Custom Robot Brand"
  };
  const robotBrandName = robotNameMap[p.robotBrand] || p.robotBrand || "Standard Six-Axis Robot";

  const binNameMap = {
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
  p.parts.forEach((part, idx) => {
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
  
  if (p.parts.some(pt => pt.shiny)) {
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
1. **Part Entanglement:** ${p.parts.some(pt => pt.entangled) ? "Yes, there is a risk of interlocking. We recommend integrating a Scape Handling Station or a secondary shaking step to separate parts before insertion." : "Low risk. Parts do not lock together."}
2. **Reflective Surfaces:** ${p.parts.some(pt => pt.shiny) ? "Specular reflections from galvanized or machined steel can create blind spots in standard cameras. The recommended polarized light barrier mitigates this risk." : "No reflective issues anticipated."}
3. **Oil & Gripper Slippage:** ${p.parts.some(pt => pt.oil) ? "Oily surfaces will reduce the friction coefficient. Mechanical gripper jaws with textured contact pads or heavy-duty polyurethane vacuum cups are required." : "Standard suction or picking is suitable."}
`;

  // Create verdict markdown
  let estimatedCycleTime = Math.min(...p.parts.map(pt => pt.cycleTime || 12)) + 1;
  const desiredCycleTime = Math.min(...p.parts.map(pt => pt.cycleTime || 12));
  
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
   * **Type:** ${p.parts.some(pt => pt.specialGripper) ? "Custom Dual-Function Tooling" : "Standard Scape Tooling"}
   * **Actuation:** ${p.parts.some(pt => pt.oil) ? "Pneumatic Clamping / Magnet with rubber lining" : "Pneumatic Vacuum / Magnet"}
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

// Run setup
async function run() {
  try {
    console.log(`Connecting to database and authenticating user ${email}...`);
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userId = cred.user.uid;
    console.log(`Logged in successfully! User ID: ${userId}`);

    const projectsColl = collection(db, 'projects');
    
    console.log(`Starting generation of 20 demo projects...`);
    for (let i = 0; i < demoProfiles.length; i++) {
      const p = demoProfiles[i];
      
      // Generate unique feasibility ID for the report
      const mockId = Math.random().toString(36).substring(2, 10).toUpperCase();
      const { report: generatedReport, finalVerdict: generatedVerdict } = buildDemoReportAndVerdict(p, i, mockId);

      // Determine status distribution
      let status = 'draft';
      let isLocked = false;
      let isVerdictVisible = false;
      let report = null;
      let finalVerdict = null;
      let isFullySpecified = false;

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
        isFullySpecified = true;
        report = generatedReport;
        finalVerdict = generatedVerdict;
      }

      const projectData = {
        projectName: p.projectName,
        userId: userId,
        status: status,
        isDemo: true, // Marked for selective cleanups!
        isLocked: isLocked,
        isVerdictVisible: isVerdictVisible,
        isFullySpecified: isFullySpecified,
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
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(projectsColl, projectData);
      console.log(`[${i+1}/20] Created Project: "${p.projectName}" -> ID: ${docRef.id}`);
    }

    console.log("\nSuccess! 20 demo projects have been generated successfully with 'isDemo: true'.");
    process.exit(0);
  } catch (err) {
    console.error("Error during generation:", err);
    process.exit(1);
  }
}

run();
