/**
 * DashboardView.tsx
 * Dette View viser oversigten over alle projekter.
 * Den modtager en masse data ("projects") og funktioner fra App.tsx som props.
 */
import { useState } from 'react';
import { PlusCircle, LayoutDashboard, SlidersHorizontal } from 'lucide-react';
import { ProjectCard } from '../components/ProjectCard';
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
  createNewProject: () => void;
  openProject: (p: ProjectState) => void;
  fetchLog: (id: string) => void;
  deleteProject: (p: ProjectState) => void;
  toggleLock: (p: ProjectState) => void;
  takeProject: (p: ProjectState) => void;
  updateStatus: (p: ProjectState, status: ProjectState['status']) => void;
  toggleSpecified: (p: ProjectState) => void;
  toggleInactive: (p: ProjectState) => void;
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
  toggleLock,
  takeProject,
  updateStatus,
  toggleSpecified,
  toggleInactive
}: DashboardViewProps) {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const hasActiveFilters = !!(filterOrg || filterUser || filterStatus !== 'all' || sortBy !== 'date' || showInactive);

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
    if (filterStatus !== 'all') {
      if (filterStatus === 'inactive' && !p.isInactive) return false;
      if (filterStatus !== 'inactive' && p.status !== filterStatus) return false;
    }
    
    // Fritekst-søgning: tjekker om den indtastede tekst findes i firmanavnet, projektnavnet eller ID.
    if (filterOrg && 
        !p.ownerCompany?.toLowerCase().includes(filterOrg.toLowerCase()) && 
        !p.projectName?.toLowerCase().includes(filterOrg.toLowerCase()) &&
        !(p.id && p.id.toLowerCase().includes(filterOrg.toLowerCase()))
    ) return false;
    
    if (filterUser && !p.ownerName?.toLowerCase().includes(filterUser.toLowerCase()) && !p.userId.toLowerCase().includes(filterUser.toLowerCase())) return false;
    
    return true; // Bestod alle checks, så behold projektet!
  });

  return (
    <div className="flex-1 p-4 md:p-10 overflow-y-auto w-full bg-slate-50/50">
      <div className="max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 mb-8">
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

            <button 
              onClick={createNewProject} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 select-none cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
              <span>New<span className="hidden sm:inline"> Project</span></span>
            </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 font-bold block sm:hidden">
          {profile?.isAdmin ? "Administrative Dashboard" : "Manage your Scape bin-picking evaluations"}
        </p>

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
            <div className="flex-1 min-w-[200px]">
              <input 
                type="text" 
                placeholder="Search Contact..." 
                className="w-full bg-white border border-slate-200/80 rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none transition-all font-semibold text-slate-800"
                value={filterUser}
                onChange={e => setFilterUser(e.target.value)}
              />
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* .map() bruges i React til at generere HTML ud fra et Array. 
            Det tager hvert objekt ('p') i 'filteredProjects' og omdanner det til en <ProjectCard /> komponent.
            Husk at React kræver en unik 'key' på elementer i en liste (derfor key={p.id}). */}
        {filteredProjects.map((p, i) => (
          <ProjectCard 
            key={p.id || `project-${i}`}
            p={p}
            profile={profile}
            user={user}
            openProject={openProject}
            fetchLog={fetchLog}
            deleteProject={deleteProject}
            toggleLock={toggleLock}
            takeProject={takeProject}
            updateStatus={updateStatus}
            toggleSpecified={toggleSpecified}
            toggleInactive={toggleInactive}
          />
        ))}
      </div>
      </div>
    </div>
  );
}
