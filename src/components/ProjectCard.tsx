/**
 * ProjectCard.tsx
 * Denne komponent tegner én enkelt firkant/kort på "Dashboard" siden.
 */
import { useState, useEffect } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ShieldCheck, CheckCircle2, Clock, History, Trash2, ChevronRight, User as UserIcon } from 'lucide-react';
import { ProjectState, UserProfile } from '../types';

interface ProjectCardProps {
  key?: string | number | null;
  p: ProjectState;
  profile: UserProfile | null;
  user: any;
  openProject: (p: ProjectState) => void;
  fetchLog: (id: string) => void;
  deleteProject: (p: ProjectState) => void;
  toggleLock: (p: ProjectState) => void;
  takeProject: (p: ProjectState) => void;
  updateStatus: (p: ProjectState, status: ProjectState['status']) => void;
  toggleSpecified: (p: ProjectState) => void;
  toggleInactive: (p: ProjectState) => void;
}

export function ProjectCard({
  p,
  profile,
  user,
  openProject,
  fetchLog,
  deleteProject,
  toggleLock,
  takeProject,
  updateStatus,
  toggleSpecified,
  toggleInactive
}: ProjectCardProps) {
  const [firstImage, setFirstImage] = useState<string | null>(null);

  useEffect(() => {
    if (!p.id) return;
    
    // Hvis projektet allerede har et billede i hukommelsen (f.eks. ved genindlæsning fra oprettelse)
    const firstPartWithImage = p.parts?.find(part => part.images && part.images.length > 0);
    if (firstPartWithImage && firstPartWithImage.images[0]) {
      setFirstImage(firstPartWithImage.images[0]);
      return;
    }

    const fetchFirstImage = async () => {
      try {
        const q = query(collection(db, 'projects', p.id!, 'images'));
        const snap = await getDocs(q);
        const imagesData = snap.docs.map(d => d.data());
        
        if (imagesData.length > 0) {
          // Sorterer i hukommelsen for at undgå behovet for Firebase sammensatte indeks-krav (composite index)
          imagesData.sort((a: any, b: any) => {
            if (a.partIndex !== b.partIndex) {
              return a.partIndex - b.partIndex;
            }
            const t1 = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const t2 = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return t1 - t2;
          });
          setFirstImage(imagesData[0].base64);
        }
      } catch (err) {
        console.error("Failed to fetch first image for card background:", err);
      }
    };

    fetchFirstImage();
  }, [p.id, p.parts]);
  
  // En lille hjælpefunktion internt i komponenten
  const isActuallyEmail = (email: string | null | undefined) => {
    if (!email) return false;
    return email.includes('@') && email.includes('.');
  };

  const formatCreatedAt = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString('da-DK', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      const d = new Date(timestamp);
      return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('da-DK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  /**
   * Tailwind CSS bruges flittigt her (className="..." attributterne).
   * I stedet for at skrive custom CSS i en separat fil, bruger vi "utility classes":
   * f.eks. "bg-white" (hvid baggrund), "p-6" (padding), "rounded-3xl" (meget runde hjørner).
   */
  return (
    <div 
      className={`group relative bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md hover:border-slate-200 transition-all cursor-pointer overflow-hidden flex flex-col h-full ${p.isInactive ? 'opacity-60 border-slate-200' : 'border-slate-100'}`} 
      onClick={() => openProject(p)}
    >
      {/* Udvasket baggrundsbillede hvis der er uploadet et billede til projektet */}
      {firstImage && (
        <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
          <img 
            src={firstImage} 
            alt="" 
            className="w-full h-full object-cover opacity-30 saturate-[0.8] blur-[1px] group-hover:scale-[1.03] transition-all duration-500 ease-out" 
          />
          {/* Udvasknings-gradient der sikrer ekstrem høj læsbarhed af teksten */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-white/40 to-white/70" />
        </div>
      )}

      {/* Indholds-beholder med z-index 10, så det svæver sikkert ovenpå baggrunden */}
      <div className="relative z-10 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-wrap gap-1.5 max-w-[85%]">
              {/* Dynamiske (betingede) klasser: Hvis status er 'submitted', gøres baggrunden blå, ellers grøn eller grå */}
              <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
                p.status === 'submitted' ? 'bg-red-50 text-red-600 border-red-100' : 
                p.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {p.status}
              </span>
              {/* Hvis projektet er låst (isLocked er true), så vis dette badge */}
              {p.isLocked && <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shrink-0"><ShieldCheck className="w-3 h-3" /> Locked</span>}
              {p.isFullySpecified && <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shrink-0"><CheckCircle2 className="w-3 h-3" /> Specified</span>}
              {p.isInactive && <span className="bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shrink-0">Inactive</span>}
            </div>
            <Clock className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
          </div>
          
          <h3 className="font-bold text-lg mb-1">{p.projectName}</h3>
          <div className="mb-4">
            {/* || betyder "OR". Hvis p.ownerName er tom (falsy), vises i stedet 'Unknown Owner' */}
            <p className="text-[11px] text-slate-600 font-bold">{p.ownerName || 'Unknown Owner'}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{p.ownerCompany || 'No Company'}</p>
            {p.ownerEmail && p.ownerEmail !== 'Unknown' ? (
              <p className="text-[9px] text-slate-400 mt-1 italic font-medium">{p.ownerEmail}</p>
            ) : (
              <p className="text-[9px] text-amber-500 mt-1 italic font-bold">Email unknown</p>
            )}
          </div>

          {/* Disse sektioner og knapper vises KUN, hvis brugeren har Admin-rettigheder */}
          {profile?.isAdmin && (
            <div className="mb-4 py-3 px-3 bg-slate-50/80 rounded-xl space-y-1 backdrop-blur-[2px] border border-slate-100/50">
              <p className="text-[10px] text-slate-500 truncate font-bold uppercase tracking-tight">Org: {p.ownerCompany || 'N/A'}</p>
              {p.ownerEmail && isActuallyEmail(p.ownerEmail) && p.ownerEmail !== 'Unknown' ? (
                <p className="text-[10px] text-slate-400 truncate font-medium">Email: {p.ownerEmail}</p>
              ) : (
                <p className="text-[10px] text-slate-400 truncate font-medium">User ID: {p.userId}</p>
              )}
              {p.ownerPhone && p.ownerPhone !== 'Unknown' && (
                <p className="text-[10px] text-slate-400 truncate font-medium">Phone: {p.ownerPhone}</p>
              )}
              <p className="text-[10px] text-slate-400 truncate font-medium">Created: {formatCreatedAt(p.createdAt)}</p>
            </div>
          )}
        </div>

        <div>
          {profile?.isAdmin && (
            <div className="flex flex-wrap gap-2 mb-4 border-t border-slate-100 pt-4">
              <button 
                // e.stopPropagation() sørger for, at "klikket" ikke bobler op 
                // og ved et uheld åbner hele kortet (via onClick på hoved-div'en øverst).
                onClick={(e) => { e.stopPropagation(); toggleLock(p); }}
                disabled={p.status !== 'submitted'}
                className={`text-[9px] font-black uppercase px-2 py-1 rounded border transition-colors ${
                  p.status !== 'submitted' ? 'opacity-30 cursor-not-allowed border-slate-200 text-slate-400' :
                  p.isLocked ? 'bg-amber-600 text-white border-amber-600' : 'text-slate-400 border-slate-200 hover:border-slate-900'
                }`}
                title={p.status !== 'submitted' ? 'You cannot lock a draft project.' : ''}
              >
                {p.isLocked ? 'Unlock' : 'Lock'}
              </button>
              
              {!p.takenBy ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); takeProject(p); }}
                  disabled={p.status !== 'submitted'}
                  className={`text-[9px] font-black uppercase px-2 py-1 rounded border transition-all ${p.status !== 'submitted' ? 'opacity-30 cursor-not-allowed border-slate-200 text-slate-400' : 'border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                >
                  Take Case
                </button>
              ) : (
                <span className="text-[8px] font-bold text-slate-400 px-2 py-1 flex items-center gap-1"><UserIcon className="w-2 h-2" /> {p.takenByName || 'Taken'}</span>
              )}

              <button 
                onClick={(e) => { e.stopPropagation(); updateStatus(p, 'approved'); }}
                className="text-[9px] font-black uppercase px-2 py-1 rounded border border-slate-200 text-slate-400 hover:bg-green-50 hover:text-green-600 hover:border-green-600 transition-colors"
              >
                Approve
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleSpecified(p); }}
                className={`text-[9px] font-black uppercase px-2 py-1 rounded border transition-colors ${p.isFullySpecified ? 'bg-emerald-600 text-white border-emerald-600' : 'text-slate-400 border-slate-200 hover:border-emerald-600'}`}
              >
                {p.isFullySpecified ? 'Unspecify' : 'Approve Spec'}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleInactive(p); }}
                className={`text-[9px] font-black uppercase px-2 py-1 rounded border transition-colors ${p.isInactive ? 'bg-slate-900 text-white border-slate-900' : 'text-slate-400 border-slate-200 hover:border-slate-900'}`}
              >
                {p.isInactive ? 'Activate' : 'Deactivate'}
              </button>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center text-xs text-slate-400 border-t border-slate-100 pt-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span>{p.parts.length} Parts</span>
              <button onClick={(e) => { e.stopPropagation(); fetchLog(p.id!); }} className="hover:text-blue-600 flex items-center gap-1 transition-colors">
                <History className="w-3 h-3" /> History
              </button>
              {(p.userId === user?.uid || profile?.isAdmin) && (
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteProject(p); }} 
                  className="hover:text-red-500 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              )}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); openProject(p); }}
              className="text-blue-600 font-bold flex items-center gap-1 hover:underline sm:ml-auto transition-all"
            >
              {p.isLocked && !profile?.isAdmin ? <ShieldCheck className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {p.isLocked && !profile?.isAdmin ? 'View Data' : 'View Details'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
