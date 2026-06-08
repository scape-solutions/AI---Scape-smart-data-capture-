/**
 * ProjectCard.tsx
 * Denne komponent tegner én enkelt firkant/kort på "Dashboard" siden.
 */
import { useState, useEffect } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ShieldCheck, CheckCircle2, Clock, History, Trash2, ChevronRight, User as UserIcon, RotateCcw, Download, FileText, Check, XCircle } from 'lucide-react';
import { ProjectState, UserProfile } from '../types';
import { GENERAL_STEPS, PART_STEPS } from '../questionnaire';
import { generateProjectPdf } from '../utils/pdfGenerator';

interface ProjectCardProps {
  key?: string | number | null;
  p: ProjectState;
  profile: UserProfile | null;
  user: any;
  openProject: (p: ProjectState) => void;
  fetchLog: (id: string) => void;
  deleteProject: (p: ProjectState) => void;
  restoreProject: (p: ProjectState) => void;
  toggleLock: (p: ProjectState) => void;
  takeProject: (p: ProjectState) => void;
  updateStatus: (p: ProjectState, status: ProjectState['status']) => void;
  toggleSpecified: (p: ProjectState) => void;
  toggleInactive: (p: ProjectState) => void;
  acceptProject: (id: string) => void;
  fetchProjectImages: (p: ProjectState) => Promise<ProjectState>;
}

export function ProjectCard({
  p,
  profile,
  user,
  openProject,
  fetchLog,
  deleteProject,
  restoreProject,
  toggleLock,
  takeProject,
  updateStatus,
  toggleSpecified,
  toggleInactive,
  acceptProject,
  fetchProjectImages
}: ProjectCardProps) {
  const [firstImage, setFirstImage] = useState<string | null>(null);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

  const getStepProgress = (step: any, responses: Record<string, any>, part?: any) => {
    let filled = 0;
    let total = 0;

    step.questions.forEach((q: any) => {
      if (q.dependsOn) {
        const val = responses[q.dependsOn];
        if (q.dependsOnValue && val !== q.dependsOnValue) return;
        if (!q.dependsOnValue && !val) return;
      }
      total++;
      if (responses[q.id] !== undefined && responses[q.id] !== '') {
        filled++;
      } else if (q.type === 'file' && part && part.cadFile && q.id === '3.01') {
        filled++;
      }
    });

    return { filled, total };
  };

  const calculateTotalProgress = () => {
    let totalFilled = 0;
    let totalQuestions = 0;

    const generalProgress = getStepProgress(GENERAL_STEPS[0], p.generalResponses || {});
    totalFilled += generalProgress.filled;
    totalQuestions += generalProgress.total;

    p.parts?.forEach(part => {
      PART_STEPS.forEach(step => {
        const partProgress = getStepProgress(step, part.responses || {}, part);
        totalFilled += partProgress.filled;
        totalQuestions += partProgress.total;
      });
    });

    return { totalFilled, totalQuestions, percentage: totalQuestions > 0 ? Math.round((totalFilled / totalQuestions) * 100) : 0 };
  };

  const progress = calculateTotalProgress();

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
      className={`group relative bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border shadow-[4px_10px_24px_-2px_rgba(15,23,42,0.18),_2px_4px_8px_-1px_rgba(15,23,42,0.12)] hover:shadow-[10px_22px_40px_-5px_rgba(15,23,42,0.28),_3px_6px_14px_-2px_rgba(15,23,42,0.18)] hover:-translate-y-1.5 transition-all duration-300 ease-out cursor-pointer flex flex-col h-full ${
        p.isImportPending ? 'border-dashed border-amber-400 bg-amber-50/10 hover:border-amber-500' : 'border-slate-300/85 hover:border-blue-600/50'
      } ${p.isInactive || p.isDeleted ? 'opacity-60 border-slate-300 shadow-xs' : ''}`} 
      onClick={() => !p.isImportPending && openProject(p)}
    >
      {/* Udvasket baggrundsbillede hvis der er uploadet et billede til projektet (rounded-3xl fixes corner bleed) */}
      {firstImage && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden rounded-2xl md:rounded-3xl"
          style={{
            isolation: 'isolate',
            WebkitMaskImage: '-webkit-radial-gradient(white, black)'
          }}
        >
          <img 
            src={firstImage} 
            alt="" 
            className="w-full h-full object-cover opacity-30 saturate-[0.8] blur-[1px] group-hover:scale-[1.05] transition-all duration-500 ease-out" 
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
              {/* Dynamiske (betingede) klasser: Hvis status er 'submitted', gøres baggrunden rød/blå, ellers grøn, rose eller grå */}
              <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
                p.status === 'submitted' ? 'bg-red-50 text-red-600 border-red-100' : 
                p.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                p.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                'bg-slate-100 text-slate-500 border-slate-200'
              }`}>

                {p.status}
              </span>
              {/* Hvis projektet er staged for import, vis denne badge */}
              {p.isImportPending && (
                <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shrink-0 animate-pulse">
                  <Clock className="w-3 h-3 animate-spin" /> Import Pending
                </span>
              )}
              {/* Hvis projektet er låst (isLocked er true), så vis dette badge */}
              {p.isLocked && <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shrink-0"><ShieldCheck className="w-3 h-3" /> Locked</span>}
              {p.isFullySpecified && <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shrink-0"><CheckCircle2 className="w-3 h-3" /> Specified</span>}
              {p.isInactive && !p.isDeleted && <span className="bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shrink-0">Inactive</span>}
              {p.isDeleted && <span className="bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shrink-0 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Deleted</span>}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl shrink-0 select-none shadow-3xs" title={`Last updated: ${formatCreatedAt(p.updatedAt || p.createdAt)}`}>
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{formatCreatedAt(p.updatedAt || p.createdAt)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-lg text-slate-900 leading-tight">{p.projectName}</h3>
            {p.id && (
              <span 
                className="text-[9px] font-mono font-black text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded select-all shadow-3xs" 
                title={`Full Case ID: ${p.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                #{p.id.substring(0, 6).toUpperCase()}
              </span>
            )}
          </div>
          <div className="mb-4 space-y-0.5">
            {/* || betyder "OR". Hvis p.ownerName er tom (falsy), vises i stedet 'Unknown Owner' */}
            <p className="text-[13px] text-slate-700 font-extrabold">{p.ownerName || 'Unknown Owner'}</p>
            <p className="text-xs text-slate-500 font-bold">{p.ownerCompany || 'No Company'}</p>
            {p.ownerEmail && p.ownerEmail !== 'Unknown' ? (
              <p className="text-[11px] text-slate-400 italic font-semibold">{p.ownerEmail}</p>
            ) : (
              <p className="text-[11px] text-amber-500 italic font-bold">Email unknown</p>
            )}
          </div>

          {/* Disse sektioner og knapper vises KUN, hvis brugeren har Admin-rettigheder */}
          {profile?.isAdmin && !p.isImportPending && (
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
          {profile?.isAdmin && !p.isImportPending && (
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

              {p.status !== 'approved' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); updateStatus(p, 'approved'); }}
                  className="text-[9px] font-black uppercase px-2 py-1 rounded border border-slate-200 text-slate-400 hover:bg-green-50 hover:text-green-600 hover:border-green-600 transition-colors"
                >
                  Approve
                </button>
              )}
              {p.status !== 'rejected' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); updateStatus(p, 'rejected'); }}
                  className="text-[9px] font-black uppercase px-2 py-1 rounded border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-600 transition-colors"
                >
                  Reject
                </button>
              )}
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
            {p.isImportPending ? (
              <div className="flex gap-2 w-full justify-between items-center select-none" onClick={(e) => e.stopPropagation()}>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 flex items-center gap-1 font-bold">
                  Staged Import
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (p.id) acceptProject(p.id); 
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <Check className="w-3 h-3" /> Accept
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      deleteProject(p); 
                    }}
                    className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                  >
                    <XCircle className="w-3 h-3" /> Discard
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="font-bold text-slate-500">{p.parts.length} Part{p.parts.length !== 1 ? 's' : ''}</span>
                  <div className="flex items-center gap-1.5" title={`${progress.totalFilled}/${progress.totalQuestions} questions answered`}>
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${progress.percentage === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progress.percentage}%` }} />
                    </div>
                    <span className="text-[10px] font-bold">{progress.percentage}%</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); fetchLog(p.id!); }} className="hover:text-blue-600 flex items-center gap-1 transition-colors">
                    <History className="w-3 h-3" /> History
                  </button>

                  {(profile?.isAdmin || profile?.requestedRole === 'superuser') && (
                    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          setExportDropdownOpen(!exportDropdownOpen); 
                        }} 
                        className="hover:text-blue-600 flex items-center gap-1 transition-colors select-none cursor-pointer"
                      >
                        <Download className="w-3 h-3" /> Export
                      </button>
                      {exportDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setExportDropdownOpen(false)} />
                          <div className="absolute left-0 bottom-full mb-2 w-36 rounded-xl bg-white border border-slate-200 shadow-xl z-50 p-1.5 animate-fadeIn">
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                setExportDropdownOpen(false);
                                setIsExporting(true);
                                try {
                                  const full = await fetchProjectImages(p);
                                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(full, null, 2));
                                  const dl = document.createElement('a');
                                  dl.href = dataStr;
                                  dl.download = `scape_project_${(p.projectName || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '_')}.json`;
                                  document.body.appendChild(dl);
                                  dl.click();
                                  document.body.removeChild(dl);
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setIsExporting(false);
                                }
                              }}
                              disabled={isExporting}
                              className="w-full text-left p-2 hover:bg-slate-50 rounded-lg text-[10px] font-black uppercase text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-1.5 select-none cursor-pointer disabled:opacity-50"
                            >
                              <Download className="w-3.5 h-3.5" /> JSON Format
                            </button>
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                setExportDropdownOpen(false);
                                setIsExporting(true);
                                try {
                                  const full = await fetchProjectImages(p);
                                  generateProjectPdf(full);
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setIsExporting(false);
                                }
                              }}
                              disabled={isExporting}
                              className="w-full text-left p-2 hover:bg-slate-50 rounded-lg text-[10px] font-black uppercase text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-1.5 select-none cursor-pointer disabled:opacity-50"
                            >
                              <FileText className="w-3.5 h-3.5" /> PDF Report
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {(p.userId === user?.uid || profile?.isAdmin) && (
                    <>
                      {p.isDeleted && profile?.isAdmin && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); restoreProject(p); }} 
                          className="hover:text-emerald-500 text-emerald-600 font-bold flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" /> Restore
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteProject(p); }} 
                        className="hover:text-red-500 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> {p.isDeleted ? 'Final Delete' : 'Delete'}
                      </button>
                    </>
                  )}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); openProject(p); }}
                  className="text-blue-600 font-bold flex items-center gap-1 hover:underline sm:ml-auto transition-all"
                >
                  {p.isLocked && !profile?.isAdmin ? <ShieldCheck className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  {p.isLocked && !profile?.isAdmin ? 'View Data' : 'View Details'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
