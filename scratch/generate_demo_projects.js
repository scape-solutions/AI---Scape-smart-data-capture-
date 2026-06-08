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
    additionalNotes: "Picking L-brackets from standard EU-pallets. High ambient sunlight near the window.",
    ownerName: "Sven Larsson",
    ownerCompany: "Nordic Automation",
    ownerEmail: "sven@nordicauto.se",
    parts: [
      {
        name: "L-Bracket 120x80",
        dims: "120x80x40",
        weight: 0.35,
        material: "Galvanized Steel",
        cycleTime: 12,
        shiny: true,
        oil: false,
        entangled: true,
        specialGripper: true,
        placeReqs: "Place flat on delivery conveyor belts."
      }
    ]
  },
  {
    projectName: "Gearbox Pin Insertion",
    binType: "plastic-box",
    binW: 400, binL: 600, binH: 300,
    robotBrand: "fanuc",
    additionalNotes: "Small steel pins. Need careful alignment and orientation verification before placement.",
    ownerName: "Hans Müller",
    ownerCompany: "TechDrive GmbH",
    ownerEmail: "hans.mueller@techdrive.de",
    parts: [
      {
        name: "Cylindrical Shaft Pin",
        dims: "15x80",
        weight: 0.18,
        material: "Hardened Steel",
        cycleTime: 6,
        shiny: false,
        oil: true,
        entangled: false,
        specialGripper: false,
        placeReqs: "Insert with 0.1mm tolerance into housing sleeve."
      }
    ]
  },
  {
    projectName: "Plastic Valve Sorting",
    binType: "metal-solid",
    binW: 600, binL: 800, binH: 500,
    robotBrand: "abb",
    additionalNotes: "Sorting lightweight valves. Ambient dust is present. ABB GoFa cobot preferred.",
    ownerName: "Marie Dupont",
    ownerCompany: "PlastikCorp",
    ownerEmail: "marie.dupont@plastikcorp.fr",
    parts: [
      {
        name: "Asymmetric Valve Housing",
        dims: "60x60x50",
        weight: 0.08,
        material: "Polypropylene",
        cycleTime: 8,
        shiny: false,
        oil: false,
        entangled: false,
        specialGripper: true,
        placeReqs: "Drop into designated sorting bin compartments."
      }
    ]
  },
  {
    projectName: "Engine Block Spacer Cell",
    binType: "metal-lattice",
    binW: 800, binL: 1200, binH: 800,
    robotBrand: "kuka",
    additionalNotes: "Heavy cast steel rings. Requires high payload robot and magnetic gripper.",
    ownerName: "Giovanni Rossi",
    ownerCompany: "MotorWorks SpA",
    ownerEmail: "giovanni.rossi@motorworks.it",
    parts: [
      {
        name: "Cast Iron Spacer Ring",
        dims: "180x180x30",
        weight: 1.2,
        material: "Cast Iron",
        cycleTime: 18,
        shiny: false,
        oil: true,
        entangled: false,
        specialGripper: true,
        placeReqs: "Place on index table pegs."
      }
    ]
  },
  {
    projectName: "Battery Terminal Picker",
    binType: "plastic-box",
    binW: 300, binL: 400, binH: 200,
    robotBrand: "ur",
    additionalNotes: "Delicate copper connectors. Vacuum array gripper is highly preferred to prevent bending.",
    ownerName: "John Smith",
    ownerCompany: "VoltEnergy",
    ownerEmail: "jsmith@voltenergy.com",
    parts: [
      {
        name: "Copper Connector Strap",
        dims: "80x25x2",
        weight: 0.04,
        material: "Copper Sheet",
        cycleTime: 5,
        shiny: true,
        oil: false,
        entangled: true,
        specialGripper: true,
        placeReqs: "Stack neatly inside thermoformed packaging tray."
      }
    ]
  },
  {
    projectName: "Brake Disc De-palletizing",
    binType: "eu-pallet",
    binW: 800, binL: 1200, binH: 450,
    robotBrand: "kuka",
    additionalNotes: "Heavy brake rotors. Layered arrangement separated by heavy wooden slipsheets.",
    ownerName: "Jens Hansen",
    ownerCompany: "SafeStop A/S",
    ownerEmail: "jens@safestop.dk",
    parts: [
      {
        name: "Cast Steel Brake Rotor",
        dims: "280x280x60",
        weight: 6.2,
        material: "Cast Steel",
        cycleTime: 22,
        shiny: false,
        oil: false,
        entangled: false,
        specialGripper: true,
        placeReqs: "Load centering spindle on cnc lathe."
      }
    ]
  },
  {
    projectName: "Piston Rod Assembly Line",
    binType: "metal-solid",
    binW: 600, binL: 800, binH: 400,
    robotBrand: "other",
    additionalNotes: "Prefer Yaskawa GP8 robot. High throughput cell.",
    ownerName: "William Brown",
    ownerCompany: "PrecisionEng Ltd",
    ownerEmail: "w.brown@precisioneng.co.uk",
    parts: [
      {
        name: "Steel Piston Rod 220mm",
        dims: "25x220",
        weight: 0.48,
        material: "Steel alloy",
        cycleTime: 14,
        shiny: true,
        oil: true,
        entangled: true,
        specialGripper: false,
        placeReqs: "Lay down horizontally in assembly groove."
      }
    ]
  },
  {
    projectName: "Electrical Box Assembly",
    binType: "plastic-box",
    binW: 400, binL: 600, binH: 400,
    robotBrand: "ur",
    additionalNotes: "Picking terminal boxes. Smooth flat surfaces on top facilitate vacuum suction.",
    ownerName: "Sarah Jenkins",
    ownerCompany: "ElectroConnect",
    ownerEmail: "sjenkins@electroconnect.com",
    parts: [
      {
        name: "Assembled Terminal Box",
        dims: "150x100x60",
        weight: 0.25,
        material: "ABS Plastic",
        cycleTime: 9,
        shiny: false,
        oil: false,
        entangled: false,
        specialGripper: false,
        placeReqs: "Align and mount onto cabinet DIN rails."
      }
    ]
  },
  {
    projectName: "Cast Aluminum Pipe Elbows",
    binType: "metal-lattice",
    binW: 800, binL: 1200, binH: 700,
    robotBrand: "abb",
    additionalNotes: "Curved metal elbows. Sand leftovers might be present on parts.",
    ownerName: "Lars Berg",
    ownerCompany: "AluFoundry",
    ownerEmail: "lars.berg@alufoundry.no",
    parts: [
      {
        name: "Aluminum Tube Elbow 90deg",
        dims: "110x110x50",
        weight: 0.55,
        material: "Cast Aluminum",
        cycleTime: 15,
        shiny: false,
        oil: false,
        entangled: true,
        specialGripper: true,
        placeReqs: "Place on transfer belt nest."
      }
    ]
  },
  {
    projectName: "Spark Plug Loader",
    binType: "plastic-box",
    binW: 300, binL: 400, binH: 150,
    robotBrand: "fanuc",
    additionalNotes: "Threaded spark plugs. High speed picking. Preferred robot: Fanuc LR Mate.",
    ownerName: "Yuki Tanaka",
    ownerCompany: "IgniteParts Co",
    ownerEmail: "tanaka.y@igniteparts.co.jp",
    parts: [
      {
        name: "Threaded Spark Plug",
        dims: "20x85",
        weight: 0.065,
        material: "Steel / Ceramic",
        cycleTime: 4,
        shiny: true,
        oil: false,
        entangled: false,
        specialGripper: false,
        placeReqs: "Insert thread-first into testing carousel socket."
      }
    ]
  },
  {
    projectName: "Bearing Ring Bin Picker",
    binType: "plastic-box",
    binW: 400, binL: 600, binH: 250,
    robotBrand: "ur",
    additionalNotes: "Symmetric bearing rings. Oily surfaces. UR5e preferred.",
    ownerName: "Axel Nielsen",
    ownerCompany: "Rotax Bearings",
    ownerEmail: "axel@rotaxbearings.dk",
    parts: [
      {
        name: "Steel Bearing Race Ring",
        dims: "85x85x15",
        weight: 0.15,
        material: "Steel",
        cycleTime: 7,
        shiny: true,
        oil: true,
        entangled: false,
        specialGripper: true,
        placeReqs: "Place on precision shaft assembly peg."
      }
    ]
  },
  {
    projectName: "Pump Impeller Sorting Cell",
    binType: "metal-solid",
    binW: 600, binL: 800, binH: 400,
    robotBrand: "abb",
    additionalNotes: "Brass impeller wheels. GoFa or ABB IRB 1200.",
    ownerName: "Pierre Martin",
    ownerCompany: "FluidTech SA",
    ownerEmail: "p.martin@fluidtech.be",
    parts: [
      {
        name: "Brass Impeller Wheel",
        dims: "120x120x35",
        weight: 0.4,
        material: "Brass",
        cycleTime: 11,
        shiny: false,
        oil: false,
        entangled: true,
        specialGripper: true,
        placeReqs: "Insert onto pump center shaft."
      }
    ]
  },
  {
    projectName: "Oil Filter Assembly Picker",
    binType: "eu-pallet",
    binW: 800, binL: 1200, binH: 600,
    robotBrand: "kuka",
    additionalNotes: "Smooth cylindrical filters. Vacuum suction cups are ideal for top-face pickup.",
    ownerName: "Anna Nowak",
    ownerCompany: "LubeFilter Sp. z o.o.",
    ownerEmail: "a.nowak@lubefilter.pl",
    parts: [
      {
        name: "Cylindrical Canister Filter",
        dims: "90x90x140",
        weight: 0.32,
        material: "Sheet Metal",
        cycleTime: 10,
        shiny: false,
        oil: false,
        entangled: false,
        specialGripper: false,
        placeReqs: "Orient vertically and place on box packaging feed."
      }
    ]
  },
  {
    projectName: "Car Door Hinge Loader",
    binType: "metal-solid",
    binW: 800, binL: 1200, binH: 500,
    robotBrand: "ur",
    additionalNotes: "Heavy stamped steel hinge assemblies. High nesting/entanglement risk.",
    ownerName: "Carlos Gomez",
    ownerCompany: "AutomotivePlus",
    ownerEmail: "c.gomez@autoplus.es",
    parts: [
      {
        name: "Stamped Steel Door Hinge",
        dims: "150x90x40",
        weight: 0.75,
        material: "High-Strength Steel",
        cycleTime: 13,
        shiny: false,
        oil: true,
        entangled: true,
        specialGripper: true,
        placeReqs: "Load into welding clamp pegs."
      }
    ]
  },
  {
    projectName: "Compressor Valve Plates",
    binType: "plastic-box",
    binW: 300, binL: 400, binH: 200,
    robotBrand: "fanuc",
    additionalNotes: "Flat plates. Sticky thin oil film makes them stick together. Magnetic separation required.",
    ownerName: "Marco Veen",
    ownerCompany: "AirFlow Systems",
    ownerEmail: "m.veen@airflowsystems.nl",
    parts: [
      {
        name: "Flat Carbon Steel Plate",
        dims: "130x70x4",
        weight: 0.11,
        material: "Carbon Steel",
        cycleTime: 8,
        shiny: false,
        oil: true,
        entangled: false,
        specialGripper: false,
        placeReqs: "Stack flat inside shipping carton bins."
      }
    ]
  },
  {
    projectName: "Shaft Coupling Feeder",
    binType: "metal-solid",
    binW: 600, binL: 800, binH: 500,
    robotBrand: "ur",
    additionalNotes: "Split collar shaft couplings. Universal Robots UR10e preferred.",
    ownerName: "Erik de Jong",
    ownerCompany: "FlexLink B.V.",
    ownerEmail: "e.dejong@flexlink.nl",
    parts: [
      {
        name: "Steel Split Collar Coupling",
        dims: "95x95x60",
        weight: 0.9,
        material: "Mild Steel",
        cycleTime: 16,
        shiny: false,
        oil: true,
        entangled: false,
        specialGripper: true,
        placeReqs: "Place on keyway shaft and slide in."
      }
    ]
  },
  {
    projectName: "Thermostat Housing Picker",
    binType: "metal-solid",
    binW: 600, binL: 800, binH: 450,
    robotBrand: "abb",
    additionalNotes: "Aluminum thermostat housings. Complex geometry with open outlets.",
    ownerName: "David Miller",
    ownerCompany: "ThermalControl Inc",
    ownerEmail: "dmiller@thermalcontrol.com",
    parts: [
      {
        name: "Cast Aluminum Housing",
        dims: "140x110x70",
        weight: 0.42,
        material: "Cast Aluminum",
        cycleTime: 12,
        shiny: false,
        oil: false,
        entangled: true,
        specialGripper: true,
        placeReqs: "Orient outlet pipes downwards and mount on inspection pins."
      }
    ]
  },
  {
    projectName: "Steering Knuckle Picking",
    binType: "eu-pallet",
    binW: 800, binL: 1200, binH: 700,
    robotBrand: "other",
    additionalNotes: "Heavy forged knuckles. Preferred robot brand is Yaskawa GP25.",
    ownerName: "Dieter Schmidt",
    ownerCompany: "AutoSteer GmbH",
    ownerEmail: "d.schmidt@autosteer.de",
    parts: [
      {
        name: "Forged Steel Steering Knuckle",
        dims: "310x240x150",
        weight: 3.8,
        material: "Forged Steel",
        cycleTime: 25,
        shiny: false,
        oil: false,
        entangled: true,
        specialGripper: true,
        placeReqs: "Load CNC machining center fixture clamps."
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
    parts: [
      {
        name: "Threaded Bottle Cap",
        dims: "30x30x12",
        weight: 0.005,
        material: "HDPE Plastic",
        cycleTime: 3,
        shiny: false,
        oil: false,
        entangled: false,
        specialGripper: false,
        placeReqs: "Drop into capping hopper chute."
      }
    ]
  },
  {
    projectName: "Manifold Plug Insertion",
    binType: "plastic-box",
    binW: 400, binL: 600, binH: 300,
    robotBrand: "ur",
    additionalNotes: "Hexagonal brass plugs. Pick and place using UR5e.",
    ownerName: "Robert Taylor",
    ownerCompany: "EngineTech Corp",
    ownerEmail: "rtaylor@enginetech.ca",
    parts: [
      {
        name: "Hexagonal Brass Plug",
        dims: "40x40x25",
        weight: 0.09,
        material: "Brass",
        cycleTime: 9,
        shiny: true,
        oil: false,
        entangled: false,
        specialGripper: false,
        placeReqs: "Place threaded head inside manifold tap hole."
      }
    ]
  }
];

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
        report = `### Data Capture Feasibility Analysis\n- Bin dimensions matches part sizes.\n- Robot brand choice is compatible.\n- Gripping strategy needs validation due to part shiny surfaces.`;
      } else if (i >= 9 && i < 15) {
        status = 'submitted';
        isLocked = true;
        report = `### Data Capture Feasibility Analysis\n- Scape grid cameras suggested.\n- Part dimensions fits standard bin layouts.`;
      } else if (i >= 15) {
        status = 'submitted';
        isLocked = true;
        isVerdictVisible = true;
        isFullySpecified = true;
        report = `### Data Capture Feasibility Analysis\n- Grid scanner is fully feasible.`;
        finalVerdict = `### Scape Technical Feasibility Conclusion\n**Feasible** - This application has been thoroughly evaluated by Scape Solutions.\n- **Recommended Camera**: Scape Grid Scanner.\n- **Recommended Gripper**: Magnetic/mechanical combination.\n- **Cycle Time**: Estimated average of ${p.parts[0].cycleTime} seconds is achievable.`;
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
        ownerPhone: "+45 88888888",
        generalResponses: {
          "1.01": p.projectName,
          "1.02": p.parts.length,
          "1.03": p.binType,
          "1.04_w": p.binW,
          "1.04_l": p.binL,
          "1.04_h": p.binH,
          "1.05": p.robotBrand,
          "1.06": p.additionalNotes
        },
        parts: p.parts.map(part => ({
          responses: {
            "2.01": part.name,
            "2.02": part.dims,
            "2.03": part.weight,
            "2.03_material": part.material,
            "2.04": part.cycleTime,
            "2.05": "Continuous production line shift",
            "2.06": true,
            "2.11": part.shiny,
            "2.07": part.oil,
            "2.08": false,
            "2.09": part.entangled,
            "2.10": false,
            "2.13": true,
            "2.14": part.specialGripper,
            "2.12": part.placeReqs
          },
          images: [],
          imageCount: 0
        })),
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
