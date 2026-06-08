/**
 * useProjects.ts
 * Denne Hook håndterer alt der har med "Projekter" at gøre i databasen.
 * Det inkluderer at hente listen, gemme nye, opdatere status og slette.
 */
import { useState, useEffect } from 'react';
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
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ProjectState, OperationType, PartData } from '../types';

export function normalizeProject(p: any): ProjectState {
  const generalResponses = p?.generalResponses || {};
  
  let parts = Array.isArray(p?.parts) ? p.parts : [];
  if (parts.length === 0) {
    parts = [{ responses: {}, images: [] }];
  }
  
  const normalizedParts = parts.map((part: any) => ({
    responses: part?.responses || {},
    images: Array.isArray(part?.images) ? part.images : [],
    cadFile: part?.cadFile || null
  }));

  return {
    ...p,
    projectName: p?.projectName || generalResponses['1.01'] || p?.generalResponses?.['1.01'] || "Untitled Project",
    generalResponses,
    parts: normalizedParts,
    generalImages: Array.isArray(p?.generalImages) ? p.generalImages : [],
    report: p?.report || null,
    status: p?.status || 'draft',
    userId: p?.userId || '',
    isLocked: !!p?.isLocked,
    isFullySpecified: !!p?.isFullySpecified,
    isVerdictVisible: !!p?.isVerdictVisible,
    ownerName: p?.ownerName || 'Unknown',
    ownerCompany: p?.ownerCompany || 'Unknown',
    ownerEmail: p?.ownerEmail || 'Unknown',
    ownerPhone: p?.ownerPhone || 'Unknown'
  };
}

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

export function useProjects(
  user: any, 
  profile: any, 
  sortBy: string, 
  handleAppError: (e: any, op?: OperationType, path?: string) => void,
  setGlobalSuccess: (msg: string | null) => void,
  getEffectiveEmail: () => string | null
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
    if (!user) return;
    setIsLoadingProjects(true);
    try {
      let q;
      // Hvis brugeren er Admin, henter vi ALLE projekter i kollektionen 'projects'.
      // Hvis ikke, henter vi KUN dem, hvor 'userId' matcher brugerens eget ID.
      if (isAdmin) {
        q = query(collection(db, 'projects'));
      } else {
        q = query(collection(db, 'projects'), where('userId', '==', user.uid));
      }
      
      // Hent dokumenterne fra databasen
      const snap = await getDocs(q);
      
      // 'snap.docs' indeholder de rå data fra Firebase. Vi mapper (konverterer) 
      // dem til vores eget ProjectState format med robust skema-normalisering.
      // Sørg for at 'id: d.id' kommer EFTER d.data(), så eventuelle forældede 'id: null' i dokumentfelterne ikke overskriver det ægte ID!
      let data = snap.docs.map(d => {
        const rawData = d.data() as any;
        if (rawData && 'id' in rawData) {
          console.warn(`[Firestore ID Audit] Document "${d.id}" ("${rawData.projectName || 'Untitled'}") contains a polluted internal 'id' field!`);
        }
        return normalizeProject({ ...rawData, id: d.id });
      });
      
      // Sortering af data. Først efter dato (nyeste først).
      data.sort((a: any, b: any) => {
        const t1 = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0);
        const t2 = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0);
        return t2 - t1; // Et positivt tal betyder at b kommer før a.
      });

      // Hvis brugeren har valgt at sortere efter 'org' eller 'user' via UI'et
      if (sortBy === 'org') {
        data.sort((a, b) => (a.ownerCompany || '').localeCompare(b.ownerCompany || ''));
      } else if (sortBy === 'user') {
        data.sort((a, b) => (a.userId || '').localeCompare(b.userId || ''));
      }
      
      setProjects(data);
    } catch (e) {
      handleAppError(e, OperationType.LIST, 'projects');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Kør fetchProjects automatisk, hvis admin-status eller sort-valg ændrer sig
  useEffect(() => {
    fetchProjects(profile?.isAdmin);
  }, [profile?.isAdmin, sortBy, user]);

  // Gemmer en handling i projektets historik (f.eks. "Projekt låst" eller "Projekt oprettet")
  const logChange = async (projectId: string, action: string) => {
    try {
      // Vi lægger en under-kollektion ('changelog') ind under selve projektet
      await addDoc(collection(db, 'projects', projectId, 'changelog'), {
        action,
        userId: user!.uid,
        userName: profile?.name || user?.displayName || 'Unknown',
        timestamp: serverTimestamp() // Beder Firebase's server om at sætte præcis tid på
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
          .filter((img: any) => img.partIndex === index)
          .sort((a: any, b: any) => {
            const t1 = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const t2 = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return t1 - t2;
          })
          .map((img: any) => img.base64);
        return {
          ...part,
          images: partImages,
          imageCount: partImages.length
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

    // Hvis projektet er låst (f.eks. Submitted), og man ikke er Admin, forhindrer vi gem.
    if (project.isLocked && !profile?.isAdmin && project.id) {
      return project;
    }

    const email = getEffectiveEmail();
    
    // Forhindr at gemme de store base64 billeder direkte i hoved-dokumentet (så vi undgår 1MB grænsen!)
    const partsWithoutImages = project.parts.map(p => ({
      ...p,
      imageCount: p.images ? p.images.length : (p.imageCount || 0),
      images: [] // Hoveddokumentet skal ikke have base64 data
    }));

    // Vi bygger det data-objekt, vi vil sende til databasen.
    // Vi trækker 'id' ud så vi ALDRIG gemmer et forældet 'id: null' eller database-ID som et felt i Firestore dokumentet!
    const { id, generalImages, ...projectDataWithoutId } = project;
    const nextLocked = status === 'draft' ? false : !!project.isLocked;
    const data = {
      ...projectDataWithoutId,
      parts: partsWithoutImages,
      generalImages: [], // Hoveddokumentet skal ikke have base64 data
      generalImageCount: project.generalImages ? project.generalImages.length : 0,
      status,
      isLocked: nextLocked,
      updatedAt: serverTimestamp(),
      projectName: project.generalResponses['1.01'] || "Untitled Project",
      ownerName: project.ownerName && project.ownerName !== 'Unknown' ? project.ownerName : (profile?.name || user?.displayName || 'Unknown'),
      ownerCompany: project.ownerCompany && project.ownerCompany !== 'Unknown' ? project.ownerCompany : (profile?.company || 'Unknown'),
      ownerEmail: project.ownerEmail && project.ownerEmail !== 'Unknown' ? project.ownerEmail : (email || 'Unknown'),
      ownerPhone: project.ownerPhone && project.ownerPhone !== 'Unknown' ? project.ownerPhone : (profile?.phone || 'Unknown')
    };
    
    try {
      if (!project.id) {
        // Hvis der ikke er noget ID, opretter vi et NYT dokument (addDoc)
        const docRef = await addDoc(collection(db, 'projects'), { ...data, createdAt: serverTimestamp() });
        await saveProjectImages(docRef.id, project);
        const updated = { 
          ...project, 
          id: docRef.id,
          status,
          isLocked: nextLocked,
          generalImages: project.generalImages || [],
          projectName: data.projectName,
          ownerName: data.ownerName,
          ownerCompany: data.ownerCompany,
          ownerEmail: data.ownerEmail,
          ownerPhone: data.ownerPhone
        };
        setCurrentProject(updated);
        await logChange(docRef.id, "Created Project");
        fetchProjects(profile?.isAdmin);
        return updated;
      } else {
        // Hvis ID findes, overskriver vi det EKSISTERENDE dokument (updateDoc)
        await updateDoc(doc(db, 'projects', project.id), data);
        await saveProjectImages(project.id, project);
        await logChange(project.id, `Status updated to ${status}`);
        
        // Update local React state to make sure it contains the applied data
        const updated = { 
          ...project, 
          status, 
          isLocked: nextLocked,
          generalImages: project.generalImages || [],
          projectName: data.projectName,
          ownerName: data.ownerName,
          ownerCompany: data.ownerCompany,
          ownerEmail: data.ownerEmail,
          ownerPhone: data.ownerPhone
        };
        setCurrentProject(updated);
        
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
        
        let status: 'draft' | 'submitted' | 'cancelled' | 'approved' | 'rejected' = 'draft';
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
          userId: user.uid,
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
      // Firkantede parenteser [field] betyder at vi bruger variabel-navnet som nøgle (key).
      await updateDoc(doc(db, 'projects', p.id), { [field]: value });
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
    cleanDemoProjects
  };
}
