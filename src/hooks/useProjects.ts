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
      let data = snap.docs.map(d => normalizeProject({ id: d.id, ...(d.data() as any) }));
      
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
  const saveProjectImages = async (projectId: string) => {
    if (!currentProject) return;
    const imagesSnap = await getDocs(collection(db, 'projects', projectId, 'images'));
    await Promise.all(imagesSnap.docs.map(doc => deleteDoc(doc.ref)));

    const writePromises: Promise<any>[] = [];
    currentProject.parts.forEach((part, partIndex) => {
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
      
      return {
        ...normalized,
        parts
      };
    } catch (e) {
      console.error("Failed to fetch images from sub-collection:", e);
      return normalized;
    }
  };

  // Både Opretter og Opdaterer projekter
  const saveProject = async (status: 'draft' | 'submitted' | 'cancelled' | 'approved' | 'rejected' = 'draft') => {
    if (!user || !currentProject) return null;

    // Hvis projektet er låst (f.eks. Submitted), og man ikke er Admin, forhindrer vi gem.
    if (currentProject.isLocked && !profile?.isAdmin && currentProject.id) {
      return currentProject;
    }

    const email = getEffectiveEmail();
    
    // Forhindr at gemme de store base64 billeder direkte i hoved-dokumentet (så vi undgår 1MB grænsen!)
    const partsWithoutImages = currentProject.parts.map(p => ({
      ...p,
      imageCount: p.images ? p.images.length : (p.imageCount || 0),
      images: [] // Hoveddokumentet skal ikke have base64 data
    }));

    // Vi bygger det data-objekt, vi vil sende til databasen
    const data = {
      ...currentProject,
      parts: partsWithoutImages,
      status,
      isLocked: !!currentProject.isLocked,
      updatedAt: serverTimestamp(),
      projectName: currentProject.generalResponses['1.01'] || "Untitled Project",
      ownerName: currentProject.ownerName && currentProject.ownerName !== 'Unknown' ? currentProject.ownerName : (profile?.name || user?.displayName || 'Unknown'),
      ownerCompany: currentProject.ownerCompany && currentProject.ownerCompany !== 'Unknown' ? currentProject.ownerCompany : (profile?.company || 'Unknown'),
      ownerEmail: currentProject.ownerEmail && currentProject.ownerEmail !== 'Unknown' ? currentProject.ownerEmail : (email || 'Unknown'),
      ownerPhone: currentProject.ownerPhone && currentProject.ownerPhone !== 'Unknown' ? currentProject.ownerPhone : (profile?.phone || 'Unknown')
    };
    
    try {
      if (!currentProject.id) {
        // Hvis der ikke er noget ID, opretter vi et NYT dokument (addDoc)
        const docRef = await addDoc(collection(db, 'projects'), { ...data, createdAt: serverTimestamp() });
        await saveProjectImages(docRef.id);
        const updated = { ...currentProject, id: docRef.id };
        setCurrentProject(updated);
        await logChange(docRef.id, "Created Project");
        fetchProjects(profile?.isAdmin);
        return updated;
      } else {
        // Hvis ID findes, overskriver vi det EKSISTERENDE dokument (updateDoc)
        await updateDoc(doc(db, 'projects', currentProject.id), data);
        await saveProjectImages(currentProject.id);
        await logChange(currentProject.id, `Status updated to ${status}`);
        fetchProjects(profile?.isAdmin);
        
        // Returner det fulde projekt med billederne bevaret i hukommelsen
        return { ...currentProject };
      }
    } catch (e) {
      handleAppError(e, OperationType.WRITE, currentProject.id ? `projects/${currentProject.id}` : 'projects');
      return null;
    }
  };

  // Sletter et projekt fuldstændigt
  const deleteProject = async (p: ProjectState) => {
    try {
      await deleteDoc(doc(db, 'projects', p.id!));
      setGlobalSuccess(`Project "${p.projectName}" deleted successfully.`);
      setTimeout(() => setGlobalSuccess(null), 5000);
      await fetchProjects(profile?.isAdmin);
    } catch (e: any) {
      handleAppError(e, OperationType.DELETE, `projects/${p.id}`);
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
    deleteProject,
    fetchLog,
    changelog,
    showLog,
    setShowLog,
    updateProjectField,
    logChange,
    fetchProjectImages
  };
}
