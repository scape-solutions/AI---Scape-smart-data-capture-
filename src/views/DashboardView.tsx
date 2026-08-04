/**
 * DashboardView.tsx
 * Dette View viser oversigten over alle projekter.
 * Den modtager en masse data ("projects") og funktioner fra App.tsx som props.
 */
import { useState } from 'react';
import { PlusCircle, LayoutDashboard, SlidersHorizontal, Sparkles, Trash2, Loader2, Upload, Download, CheckCircle, Settings, Bot, PencilLine, X, Users } from 'lucide-react';
import { ProjectCard } from '../components/ProjectCard';
import { PromptsEditorModal } from '../components/PromptsEditorModal';
import { ActiveUsersModal } from '../components/ActiveUsersModal';
import { ProjectState, UserProfile } from '../types';

interface DashboardViewProps {
  projects: ProjectState[];
  profile: UserProfile | null;
  user: any;
  sortBy: string;
  setSortBy: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  filterOrg: string;
  setFilterOrg: (val: string) => void;
  filterUser: string;
  setFilterUser: (val: string) => void;
  showInactive: boolean;
  setShowInactive: (val: boolean) => void;
  createNewProject: (withAI?: boolean) => void;
  openProject: (p: ProjectState) => void;
  fetchLog: (id: string) => void;
  deleteProject: (p: ProjectState) => void;
  restoreProject: (p: ProjectState) => void;
  toggleLock: (p: ProjectState) => void;
  takeProject: (p: ProjectState) => void;
  updateStatus: (p: ProjectState, status: ProjectState['status']) => void;
  toggleInactive: (p: ProjectState) => void;
  isGeneratingDemo: boolean;
  isCleaningDemo: boolean;
  generateDemoProjects: () => Promise<void>;
  cleanDemoProjects: () => Promise<void>;
  acceptProject: (id: string) => void;
  acceptAllPendingProjects: () => void;
  importProjectsFromJson: (arr: any[]) => void;
  fetchProjectImages: (p: ProjectState) => Promise<ProjectState>;
  setGlobalSuccess: (msg: string | null) => void;
}

export function DashboardView({
  projects,
  profile,
  user,
  sortBy,
  setSortBy,
  filterStatus,
  setFilterStatus,
  filterOrg,
  setFilterOrg,
  filterUser,
  setFilterUser,
  showInactive,
  setShowInactive,
  createNewProject,
  openProject,
  fetchLog,
  deleteProject,
  restoreProject,
  toggleLock,
  takeProject,
  updateStatus,
  toggleInactive,
  isGeneratingDemo,
  isCleaningDemo,
  generateDemoProjects,
  cleanDemoProjects,
  acceptProject,
  acceptAllPendingProjects,
  importProjectsFromJson,
  fetchProjectImages,
  setGlobalSuccess
}: DashboardViewProps) {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [isExportingBulk, setIsExportingBulk] = useState(false);
  const [showPromptsModal, setShowPromptsModal] = useState(false);
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);

  const handleExportFiltered = async () => {
    if (filteredProjects.length === 0) return;
    setIsExportingBulk(true);
    try {
      const fullProjects = await Promise.all(
        filteredProjects.map(p => fetchProjectImages(p))
      );

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullProjects, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `scape_projects_export_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
    } catch (err) {
      console.error("Failed to export projects:", err);
    } finally {
      setIsExportingBulk(false);
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const projectsArray = Array.isArray(parsed) ? parsed : [parsed];
        importProjectsFromJson(projectsArray);
      } catch (err) {
        console.error("Failed to parse imported JSON file:", err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const hasActiveFilters = !!(filterOrg || filterUser || filterStatus !== 'all' || sortBy !== 'date' || showInactive);

  // Extract unique contacts from the current projects list for suggestions
  const uniqueContacts = Array.from(
    new Map(
      projects
        .filter(p => (p.ownerName && p.ownerName !== 'Unknown') || (p.ownerEmail && p.ownerEmail !== 'Unknown'))
        .map(p => {
          const email = p.ownerEmail && p.ownerEmail !== 'Unknown' ? p.ownerEmail : '';
          const name = p.ownerName && p.ownerName !== 'Unknown' ? p.ownerName : (email || 'Unknown');
          const key = email || name;
          return [
            key.toLowerCase(), 
            { name, company: p.ownerCompany && p.ownerCompany !== 'Unknown' ? p.ownerCompany : '', email }
          ];
        })
    ).values()
  );

  const filteredContacts = uniqueContacts.filter(c => 
    c.name.toLowerCase().includes(filterUser.toLowerCase()) ||
    c.email.toLowerCase().includes(filterUser.toLowerCase()) ||
    c.company.toLowerCase().includes(filterUser.toLowerCase())
  );

  /**
   * Filtrering af arrays i JavaScript:
   * .filter() løber hele listen af 'projects' igennem. For hvert projekt 'p', 
   * returnerer vi enten 'true' (behold den) eller 'false' (skjul den).
   * Det er meget mere effektivt og nemmere at læse end gamle for-loops.
   */
  const filteredProjects = projects.filter(p => {
    // Hvis brugeren har valgt IKKE at se inaktive projekter, og projektet er inaktivt, skjul det.
    if (!showInactive && p.isInactive && filterStatus !== 'inactive') return false;
    
    // Hvis dropdown-menuen ikke står på 'all' (Alle)
    if (filterStatus === 'deleted') {
      if (!p.isDeleted) return false;
    } else {
      if (p.isDeleted) return false;
      if (filterStatus !== 'all') {
        if (filterStatus === 'inactive' && !p.isInactive) return false;
        if (filterStatus !== 'inactive' && p.status !== filterStatus) return false;
      }
    }
    
    // Global search checking Company, Project Name, Owner Name, Owner Email, or ID
    if (filterOrg && 
        !p.ownerCompany?.toLowerCase().includes(filterOrg.toLowerCase()) && 
        !p.projectName?.toLowerCase().includes(filterOrg.toLowerCase()) &&
        !p.ownerName?.toLowerCase().includes(filterOrg.toLowerCase()) &&
        !p.ownerEmail?.toLowerCase().includes(filterOrg.toLowerCase()) &&
        !(p.id && p.id.toLowerCase().includes(filterOrg.toLowerCase()))
    ) return false;
    
    if (filterUser && 
        !p.ownerEmail?.toLowerCase().includes(filterUser.toLowerCase()) &&
        !p.ownerName?.toLowerCase().includes(filterUser.toLowerCase())
    ) return false;
    
    return true; // Bestod alle checks, så behold projektet!
  });

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-slate-100/40 overflow-hidden">
      {/* Permanent Fixed Dashboard Header & Filters */}
      <div className="p-4 md:p-10 pb-0 md:pb-0 w-full shrink-0 border-b border-slate-200/5 bg-slate-100/10 backdrop-blur-xs z-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex justify-between items-center gap-3 w-full">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-7 h-7 md:w-9 md:h-9 text-slate-900 shrink-0" />
                  <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-900 leading-none">Dashboard</h1>
                </div>
                <p className="text-[11px] md:text-sm text-slate-400 font-semibold mt-1 hidden sm:block">
                  {profile?.isAdmin ? "Administrative Dashboard" : "Manage your Scape bin-picking evaluations"}
                </p>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                {/* Sleek Filters Toggle Button */}
                <button 
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)} 
                  className={`px-3 md:px-4 py-2 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all select-none active:scale-[0.97] cursor-pointer shadow-xs ${
                    isFilterExpanded 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">{isFilterExpanded ? 'Hide Filters' : 'Filters'}</span>
                  {hasActiveFilters && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
                  )}
                </button>

                {profile?.requestedRole !== 'evaluator' && profile?.requestedRole !== 'superuser' && (
                  <button 
                    onClick={() => setShowCreationModal(true)} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 select-none cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>New<span className="hidden sm:inline"> Project</span></span>
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-bold block sm:hidden">
              {profile?.isAdmin ? "Administrative Dashboard" : "Manage your Scape bin-picking evaluations"}
            </p>

            {/* Super User Tools Panel */}
            {profile?.requestedRole === 'superuser' && (
              <div className="bg-amber-50/40 p-4 md:p-5 rounded-[2rem] border border-amber-200/60 shadow-xs flex flex-wrap gap-3 items-center animate-fadeIn mt-2 select-none">
                <div className="flex flex-col text-left mr-auto">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">Super User Tools</span>
                  <span className="text-[11px] text-slate-400 font-semibold mt-0.5">Manage data imports/exports and demo seeds</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={handleExportFiltered}
                    disabled={filteredProjects.length === 0 || isExportingBulk}
                    className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-900/50 text-white px-3 md:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed animate-all"
                    title="Export filtered project list as JSON"
                  >
                    {isExportingBulk ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    ) : (
                      <Download className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{isExportingBulk ? 'Exporting...' : 'Export Filtered (JSON)'}</span>
                  </button>

                  <label className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 select-none cursor-pointer">
                    <Upload className="w-3.5 h-3.5 shrink-0" />
                    <span>Import JSON</span>
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={handleImportJson} 
                      className="hidden" 
                    />
                  </label>

                  {projects.some(p => p.isImportPending) && (
                    <button 
                      onClick={acceptAllPendingProjects}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-3 md:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 select-none cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Accept All Staged</span>
                    </button>
                  )}

                  <button 
                    onClick={generateDemoProjects}
                    disabled={isGeneratingDemo || isCleaningDemo}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white px-3 md:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingDemo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{isGeneratingDemo ? 'Generating...' : 'Generate Demo'}</span>
                  </button>

                  <button 
                    onClick={cleanDemoProjects}
                    disabled={isGeneratingDemo || isCleaningDemo}
                    className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/50 text-white px-3 md:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCleaningDemo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{isCleaningDemo ? 'Cleaning...' : 'Clean Demo'}</span>
                  </button>

                  <button 
                    onClick={() => setShowUsersModal(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-3 md:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 select-none cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>Active Users</span>
                  </button>

                  <button 
                    onClick={() => setShowPromptsModal(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-3 md:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 select-none cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 shrink-0" />
                    <span>Edit AI Prompts</span>
                  </button>
                </div>
              </div>
            )}

            {isFilterExpanded && (
              <div className="bg-blue-50/40 p-5 rounded-[2rem] border border-blue-100/60 shadow-xs flex flex-wrap gap-3 items-center animate-fadeIn mt-2">
                <div className="flex-1 min-w-[200px]">
                  <input 
                    type="text" 
                    placeholder="Search Project, Org, or ID..." 
                    className="w-full bg-white border border-slate-200/80 rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none transition-all font-semibold text-slate-800"
                    value={filterOrg}
                    onChange={e => setFilterOrg(e.target.value)}
                  />
                </div>
                <div className="flex-1 min-w-[200px] relative">
                  <input 
                    type="text" 
                    placeholder="Search Contact..." 
                    className="w-full bg-white border border-slate-200/80 rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none transition-all font-semibold text-slate-800"
                    value={filterUser}
                    onChange={e => {
                      setFilterUser(e.target.value);
                      setShowUserSuggestions(true);
                    }}
                    onFocus={() => setShowUserSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowUserSuggestions(false), 200)}
                  />
                  {showUserSuggestions && filterUser && filteredContacts.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-[999] max-h-48 overflow-y-auto p-1.5 animate-fadeIn">
                      {filteredContacts.map((c, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            setFilterUser(c.email || c.name);
                            setShowUserSuggestions(false);
                          }}
                          className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                        >
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-bold text-slate-800">{c.name}</span>
                            {c.company && (
                              <span className="text-[10px] text-slate-400 font-semibold">{c.company}</span>
                            )}
                          </div>
                          {c.email && c.email !== 'Unknown' && (
                            <span className="text-[9px] text-slate-400 font-mono italic">{c.email}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-full sm:w-44">
                  <select 
                    className="w-full bg-white border border-slate-200/80 rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none transition-all font-bold text-slate-700"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                  >
                    <option value="all">Status: All</option>
                    <option value="draft">Status: Draft</option>
                    <option value="submitted">Status: Submitted</option>
                    <option value="approved">Status: Approved</option>
                    <option value="rejected">Status: Rejected</option>
                    <option value="inactive">Status: Inactive Only</option>
                    {profile?.isAdmin && <option value="deleted">Status: Trash</option>}
                  </select>
                </div>
                <div className="w-full sm:w-44">
                  <select 
                    value={sortBy} 
                    onChange={e => setSortBy(e.target.value)}
                    className="w-full bg-white border border-slate-200/80 rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none transition-all font-bold text-slate-700"
                  >
                    <option value="date">Sort: Date</option>
                    <option value="org">Sort: Org</option>
                    <option value="user">Sort: User</option>
                  </select>
                </div>
                <div className="w-full sm:w-auto shrink-0">
                  <button 
                    onClick={() => setShowInactive(!showInactive)}
                    className={`w-full px-5 py-3 rounded-xl text-xs font-bold transition-all border ${showInactive ? 'bg-blue-600 text-white border-blue-600 shadow-sm hover:bg-blue-700' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                  >
                    {showInactive ? "Hide Inactive" : "Show Inactive"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Project Cards Grid Container */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 pt-6 md:pt-6 w-full z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* .map() bruges i React til at generere HTML ud fra et Array. */}
            {filteredProjects.map((p, i) => (
              <ProjectCard 
                key={p.id || `project-${i}`}
                p={p}
                profile={profile}
                user={user}
                openProject={openProject}
                fetchLog={fetchLog}
                deleteProject={deleteProject}
                restoreProject={restoreProject}
                toggleLock={toggleLock}
                takeProject={takeProject}
                updateStatus={updateStatus}
                toggleInactive={toggleInactive}
                acceptProject={acceptProject}
                fetchProjectImages={fetchProjectImages}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {showPromptsModal && (
        <PromptsEditorModal 
          show={showPromptsModal} 
          onClose={() => setShowPromptsModal(false)} 
          setGlobalSuccess={setGlobalSuccess}
        />
      )}

      {showUsersModal && (
        <ActiveUsersModal 
          show={showUsersModal} 
          onClose={() => setShowUsersModal(false)} 
        />
      )}

      {/* Creation Modal */}
      {showCreationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-slideUp border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">Create New Project</h2>
              <button onClick={() => setShowCreationModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col md:flex-row gap-4">
              {/* Start with AI Option */}
              <button 
                onClick={() => { setShowCreationModal(false); createNewProject(true); }}
                className="flex-1 text-left p-6 rounded-2xl border-2 border-blue-100 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 transition-all group flex flex-col gap-3 relative overflow-hidden cursor-pointer active:scale-[0.98]"
              >
                <div className="absolute -right-4 -top-4 text-blue-500/10 group-hover:text-blue-500/20 transition-colors">
                  <Bot className="w-32 h-32" />
                </div>
                <div className="p-3 bg-blue-600 text-white rounded-xl w-fit shadow-md shadow-blue-600/20 z-10">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="z-10 mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-black text-slate-900">Start with AI</h3>
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Fastest</span>
                  </div>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Chat with our AI assistant or upload your requirements to automatically build your project structure.
                  </p>
                </div>
              </button>

              {/* Start Manually Option */}
              <button 
                onClick={() => { setShowCreationModal(false); createNewProject(false); }}
                className="flex-1 text-left p-6 rounded-2xl border-2 border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all group flex flex-col gap-3 relative overflow-hidden cursor-pointer active:scale-[0.98]"
              >
                 <div className="p-3 bg-slate-100 text-slate-600 rounded-xl w-fit group-hover:bg-slate-200 transition-colors z-10">
                  <PencilLine className="w-6 h-6" />
                </div>
                <div className="z-10 mt-2">
                  <h3 className="text-lg font-black text-slate-900 mb-1">Start Manually</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Start with a blank canvas and fill out the questionnaire step-by-step yourself.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
