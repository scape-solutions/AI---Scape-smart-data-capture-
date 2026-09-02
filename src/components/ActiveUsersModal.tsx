import React, { useState, useEffect } from 'react';
import { collection, getDocs, getDocsFromServer, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { X, RefreshCw, Users, Shield, Clock, Landmark, Loader2, Ban, CheckCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface ActiveUsersModalProps {
  show: boolean;
  onClose: () => void;
}

export function ActiveUsersModal({ show, onClose }: ActiveUsersModalProps) {
  const [users, setUsers] = useState<(UserProfile & { id?: string; isSuspended?: boolean })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filter & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [onlyActive, setOnlyActive] = useState(false);
  const [sortBy, setSortBy] = useState<string>('active-desc');

  useEffect(() => {
    if (show) {
      fetchUsers();
    }
  }, [show]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Force fetching from server directly to bypass client-side offline cache
      const snap = await getDocsFromServer(collection(db, 'users'));
      const list: (UserProfile & { id?: string; isSuspended?: boolean })[] = [];
      snap.forEach(docSnap => {
        list.push({
          id: docSnap.id,
          ...docSnap.data() as UserProfile
        });
      });
      setUsers(list);
    } catch (e) {
      console.error("Failed to fetch fresh users from server, falling back to local cache:", e);
      try {
        const fallbackSnap = await getDocs(collection(db, 'users'));
        const list: (UserProfile & { id?: string; isSuspended?: boolean })[] = [];
        fallbackSnap.forEach(docSnap => {
          list.push({
            id: docSnap.id,
            ...docSnap.data() as UserProfile
          });
        });
        setUsers(list);
      } catch (fallbackErr) {
        console.error("Fallback cached fetch also failed:", fallbackErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSuspendUser = async (userId: string | undefined, userEmail: string, currentlySuspended: boolean | undefined) => {
    if (!userId) return;
    const actionText = currentlySuspended ? "reactivate" : "suspend";
    if (!confirm(`Are you sure you want to ${actionText} access for user "${userEmail}"?`)) return;
    
    setUpdatingId(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        isSuspended: !currentlySuspended
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: !currentlySuspended } : u));
    } catch (e: any) {
      console.error("Failed to update user status:", e);
      alert(`Failed to ${actionText} user: ` + (e.message || String(e)));
    } finally {
      setUpdatingId(null);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Helper to determine if user is active (last 5 minutes)
  const isUserActiveNow = (lastActiveAt: string | undefined) => {
    if (!lastActiveAt) return false;
    const diff = new Date().getTime() - new Date(lastActiveAt).getTime();
    return diff >= 0 && diff < 5 * 60 * 1000;
  };

  const getActiveStatus = (lastActiveAt: string | undefined) => {
    if (!lastActiveAt) {
      return { 
        text: 'Never Active', 
        color: 'text-slate-400 border-slate-200 bg-slate-50', 
        dot: 'bg-slate-300' 
      };
    }
    
    const lastActive = new Date(lastActiveAt);
    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();
    
    // Safety check for skewed clocks
    if (diffMs < 0) {
      return { 
        text: 'Active Now', 
        color: 'text-emerald-600 border-emerald-100 bg-emerald-50', 
        dot: 'bg-emerald-500 animate-pulse' 
      };
    }

    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 5) {
      return { 
        text: 'Active Now', 
        color: 'text-emerald-600 border-emerald-100 bg-emerald-50 font-black', 
        dot: 'bg-emerald-500 animate-pulse' 
      };
    } else if (diffMins < 60) {
      return { 
        text: `${diffMins}m ago`, 
        color: 'text-slate-700 border-slate-200 bg-slate-50', 
        dot: 'bg-slate-400' 
      };
    } else if (diffMins < 24 * 60) {
      const hours = Math.floor(diffMins / 60);
      return { 
        text: `${hours}h ago`, 
        color: 'text-slate-700 border-slate-200 bg-slate-50', 
        dot: 'bg-slate-400' 
      };
    } else {
      const days = Math.floor(diffMins / (60 * 24));
      return { 
        text: `${days}d ago`, 
        color: 'text-slate-500 border-slate-100 bg-slate-50/50', 
        dot: 'bg-slate-300' 
      };
    }
  };

  const formatExactTime = (isoString: string | undefined) => {
    if (!isoString) return 'No activity recorded';
    try {
      return new Date(isoString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (e) {
      return isoString;
    }
  };

  // Perform client-side filtering and sorting
  const filteredAndSortedUsers = users
    .filter(user => {
      // 1. Search Query
      const queryStr = searchQuery.toLowerCase().trim();
      const nameMatch = user.name.toLowerCase().includes(queryStr);
      const emailMatch = user.email.toLowerCase().includes(queryStr);
      const companyMatch = (user.company || '').toLowerCase().includes(queryStr);
      const searchMatch = !queryStr || nameMatch || emailMatch || companyMatch;
      
      // 2. Role Filter
      const roleMatch = roleFilter === 'all' || user.role === roleFilter;
      
      // 3. Status Filter (Only Active Now)
      const activeMatch = !onlyActive || isUserActiveNow(user.lastActiveAt);
      
      return searchMatch && roleMatch && activeMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'active-desc') {
        const timeA = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
        const timeB = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
        return timeB - timeA;
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'company-asc') {
        return (a.company || '').localeCompare(b.company || '');
      }
      if (sortBy === 'role-asc') {
        return (a.role || '').localeCompare(b.role || '');
      }
      return 0;
    });

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      {/* Modal Box */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-amber-500/10">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-black text-slate-800 leading-tight">User Activity Dashboard</h2>
              <p className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">Real-time registered users & session tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="Refresh user list"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters and Sorting Bar */}
        <div className="px-8 py-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 min-w-[200px]">
            <input 
              type="text" 
              placeholder="Search by Name, Email, or Company..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all font-semibold text-slate-800"
            />
          </div>

          {/* Role Filter Dropdown */}
          <div className="w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="integrator">Integrators</option>
              <option value="enduser">End-users</option>
              <option value="other">Other Roles</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="active-desc">Sort: Last Active</option>
              <option value="name-asc">Sort: Name (A-Z)</option>
              <option value="company-asc">Sort: Company (A-Z)</option>
              <option value="role-asc">Sort: Role</option>
            </select>
          </div>

          {/* Only Active Toggle */}
          <div className="flex items-center gap-2 select-none shrink-0 ml-auto">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={onlyActive} 
                onChange={(e) => setOnlyActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
              <span className="ml-2 text-xs font-bold text-slate-600">
                Only Active Now
              </span>
            </label>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-4 min-h-0 bg-slate-50/30">
          {isLoading && users.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <span className="text-xs text-slate-400 font-bold">Loading active users...</span>
            </div>
          ) : filteredAndSortedUsers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400 italic bg-white border border-slate-100 rounded-2xl">
              No matching users found
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredAndSortedUsers.map((userProfile) => {
                const status = getActiveStatus(userProfile.lastActiveAt);
                const isSuper = userProfile.requestedRole === 'superuser';
                const isEval = userProfile.requestedRole === 'evaluator';
                
                return (
                  <div 
                    key={userProfile.email}
                    className="p-4 bg-white border border-slate-100 hover:border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-xs"
                  >
                    {/* User profile identifier */}
                    <div className="flex items-center gap-3.5 text-left min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/50 flex items-center justify-center font-black text-slate-600 text-xs shrink-0 select-none relative">
                        {getInitials(userProfile.name)}
                        {/* Glowing active/inactive dot */}
                        <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${status.dot}`} />
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]" title={userProfile.name}>
                            {userProfile.name || 'Anonymous User'}
                          </span>
                          
                          {/* Role Badges */}
                          {isSuper && (
                            <span className="px-1.5 py-0.5 rounded-md bg-rose-50 border border-rose-100 text-rose-600 font-black text-[9px] uppercase tracking-wider flex items-center gap-0.5 select-none">
                              <Shield className="w-2.5 h-2.5" />
                              <span>Superuser</span>
                            </span>
                          )}
                          {isEval && !isSuper && (
                            <span className="px-1.5 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-blue-600 font-black text-[9px] uppercase tracking-wider select-none">
                              Evaluator
                            </span>
                          )}
                          {userProfile.isAdmin && !isSuper && !isEval && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-100 text-amber-600 font-black text-[9px] uppercase tracking-wider select-none">
                              Admin
                            </span>
                          )}
                          {userProfile.registeredViaCampaign && (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[9px] flex items-center gap-1 select-none" title={`Registered via campaign: ${userProfile.registeredViaCampaign}`}>
                              <span>🎟️</span>
                              <span>{userProfile.registeredViaCampaign}</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium truncate max-w-[280px]" title={userProfile.email}>
                          {userProfile.email}
                        </span>
                      </div>
                    </div>

                    {/* Meta info & Active stats */}
                    <div className="flex items-center gap-4 sm:self-center justify-between sm:justify-end">
                      {/* Company/Organization */}
                      <div className="hidden md:flex flex-col text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 justify-end">
                          <Landmark className="w-3 h-3 text-slate-400/80" />
                          Company
                        </span>
                        <span className="text-xs font-bold text-slate-700 max-w-[150px] truncate" title={userProfile.company}>
                          {userProfile.company || 'Not Specified'}
                        </span>
                      </div>

                      {/* Last Activity Time */}
                      <div className="flex flex-col text-left sm:text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 sm:justify-end">
                          <Clock className="w-3 h-3 text-slate-400/80" />
                          Last Active
                        </span>
                        <span className="text-xs font-bold text-slate-700" title={formatExactTime(userProfile.lastActiveAt)}>
                          {formatExactTime(userProfile.lastActiveAt)}
                        </span>
                      </div>

                      {/* Suspended or Active indicator badge */}
                      {userProfile.isSuspended ? (
                        <span className="px-2.5 py-1 text-[10px] font-bold border rounded-xl shadow-xs select-none bg-red-50 text-red-700 border-red-200">
                          Suspended
                        </span>
                      ) : (
                        <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-xl shadow-xs select-none ${status.color}`}>
                          {status.text}
                        </span>
                      )}

                      {/* Suspend / Reactivate User Button */}
                      {!isSuper && (
                        <button
                          onClick={() => handleToggleSuspendUser(userProfile.id, userProfile.email, userProfile.isSuspended)}
                          disabled={updatingId === userProfile.id}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 border shrink-0 ${
                            userProfile.isSuspended
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                          }`}
                          title={userProfile.isSuspended ? "Reactivate account" : "Suspend account (block login and AI access without deleting data)"}
                        >
                          {updatingId === userProfile.id ? (
                            <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
                          ) : userProfile.isSuspended ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Reactivate</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-3 h-3 text-slate-400" />
                              <span>Suspend</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-100 text-slate-600 transition-all select-none cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
