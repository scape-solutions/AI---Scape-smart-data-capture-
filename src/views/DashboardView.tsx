/**
 * DashboardView.tsx
 * Dette View viser oversigten over alle projekter.
 * Den modtager en masse data ("projects") og funktioner fra App.tsx som props.
 */
import { PlusCircle, LayoutDashboard } from 'lucide-react';
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
    <div className="flex-1 p-4 md:p-10 overflow-y-auto max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-6 mb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-2 flex items-center gap-2.5">
              <LayoutDashboard className="w-8 h-8 md:w-9 md:h-9 text-slate-900" />
              <span>Dashboard</span>
            </h1>
            <p className="text-sm md:text-base text-slate-500">{profile?.isAdmin ? "Administrative Dashboard" : "Manage your Scape bin-picking evaluations"}</p>
          </div>
          <button onClick={createNewProject} className="w-full sm:w-auto justify-center bg-blue-600 text-white px-6 md:px-8 py-3.5 md:py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:scale-[1.02] transition-all shrink-0">
            <PlusCircle className="w-5 h-5" /> New Project
          </button>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Search Project / Org / ID</p>
              {/* Her ser du "To-vejs databinding" i React:
                  - 'value' læser data fra state
                  - 'onChange' skriver ny data til state (hver gang man trykker på en tast) */}
              <input 
                type="text" 
                placeholder="e.g. Billund Automation" 
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600"
                value={filterOrg}
                onChange={e => setFilterOrg(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Search User</p>
              <input 
                type="text" 
                placeholder="Name or UID" 
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600"
                value={filterUser}
                onChange={e => setFilterUser(e.target.value)}
              />
            </div>
            <div className="w-48">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Status</p>
              <select 
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
            <div className="w-48">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Sort By</p>
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600"
              >
                <option value="date">Date</option>
                <option value="org">Organization</option>
                <option value="user">User</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <button 
                onClick={() => setShowInactive(!showInactive)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${showInactive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
              >
                {showInactive ? "Hide Inactive" : "Show Inactive"}
              </button>
            </div>
          </div>
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
  );
}
