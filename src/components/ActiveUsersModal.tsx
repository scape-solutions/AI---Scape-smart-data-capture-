import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { X, RefreshCw, Users, Shield, Clock, Landmark, Loader2, Ban, CheckCircle, FlaskConical, Filter } from 'lucide-react';
import { UserProfile } from '../types';

interface ActiveUsersModalProps {
  show: boolean;
  onClose: () => void;
}

export function ActiveUsersModal({ show, onClose }: ActiveUsersModalProps) {
  const [users, setUsers] = useState<(UserProfile & { id?: string; isSuspended?: boolean; isTestUser?: boolean })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filter & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [testUserFilter, setTestUserFilter] = useState<'all' | 'hide-test' | 'only-test'>('all');
  const [onlyActive, setOnlyActive] = useState(false);
  const [sortBy, setSortBy] = useState<string>('active-desc');

  useEffect(() => {
    if (!show) return;
    setIsLoading(true);

    const unsubscribe = onSnapshot(collection(db, 'users'), (snap) => {
      const list: (UserProfile & { id?: string; isSuspended?: boolean; isTestUser?: boolean })[] = [];
      snap.forEach(docSnap => {
        list.push({
          id: docSnap.id,
          ...docSnap.data() as UserProfile
        });
      });
      setUsers(list);
      setIsLoading(false);
    }, (err) => {
      console.error("Failed to subscribe to active users:", err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [show]);

  const handleToggleSuspendUser = async (userId: string | undefined, userEmail: string, currentlySuspended: boolean | undefined) => {
    if (!userId) return;
    const actionText = currentlySuspended ? "reactivate" : "suspend";
    if (!confirm(`Are you sure you want to ${actionText} access for user "${userEmail}"?`)) return;
    
    setUpdatingId(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        isSuspended: !currentlySuspended
      });
    } catch (e: any) {
      console.error("Failed to update user status:", e);
      alert(`Failed to ${actionText} user: ` + (e.message || String(e)));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleTestUser = async (userId: string | undefined, currentlyTestUser: boolean | undefined) => {
    if (!userId) return;
    setUpdatingId(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        isTestUser: !currentlyTestUser
      });
    } catch (e: any) {
      console.error("Failed to toggle test user:", e);
      alert("Failed to toggle test user: " + (e.message || String(e)));
    } finally {
      setUpdatingId(null);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Helper to determine if user is active (last 3 minutes)
  const isUserActiveNow = (lastActiveAt: string | undefined) => {
    if (!lastActiveAt) return false;
    const diff = new Date().getTime() - new Date(lastActiveAt).getTime();
    return diff >= 0 && diff < 3 * 60 * 1000;
  };

  // Helper to determine if user is a test user
  const isAccountTestUser = (user: UserProfile & { isTestUser?: boolean }) => {
    if (user.isTestUser !== undefined) return user.isTestUser;
    return (user.email || '').toLowerCase().includes('+test') || (user.email || '').toLowerCase().startsWith('test');
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
        color: 'text-emerald-700 border-emerald-200 bg-emerald-50 font-bold', 
        dot: 'bg-emerald-500 animate-pulse' 
      };
    }

    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 3) {
      return { 
        text: 'Active Now', 
        color: 'text-emerald-700 border-emerald-200 bg-emerald-50 font-black', 
        dot: 'bg-emerald-500 animate-pulse' 
      };
    } else if (diffMins < 60) {
      return { 
        text: `${diffMins}m ago`, 
        color: 'text-slate-700 border-slate-200 bg-slate-50 font-semibold', 
        dot: 'bg-slate-400' 
      };
    } else if (diffMins < 24 * 60) {
      const hours = Math.floor(diffMins / 60);
      return { 
        text: `${hours}h ago`, 
        color: 'text-slate-700 border-slate-200 bg-slate-50 font-medium', 
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

  const activeNowCount = users.filter(u => isUserActiveNow(u.lastActiveAt) && !u.isSuspended).length;
  const testUsersCount = users.filter(u => isAccountTestUser(u)).length;

  // Perform client-side filtering and sorting
  const filteredAndSortedUsers = users
    .filter(user => {
      const isTest = isAccountTestUser(user);

      // 1. Search Query
      const queryStr = searchQuery.toLowerCase().trim();
      const nameMatch = (user.name || '').toLowerCase().includes(queryStr);
      const emailMatch = (user.email || '').toLowerCase().includes(queryStr);
      const companyMatch = (user.company || '').toLowerCase().includes(queryStr);
      const campaignMatch = (user.registeredViaCampaign || '').toLowerCase().includes(queryStr);
      const searchMatch = !queryStr || nameMatch || emailMatch || companyMatch || campaignMatch;
      
      // 2. Test User Filter
      let testMatch = true;
      if (testUserFilter === 'hide-test') {
        testMatch = !isTest;
      } else if (testUserFilter === 'only-test') {
        testMatch = isTest;
      }

      // 3. Role Filter
      let roleMatch = true;
      if (roleFilter === 'superuser') {
        roleMatch = user.requestedRole === 'superuser';
      } else if (roleFilter === 'evaluator') {
        roleMatch = user.requestedRole === 'evaluator' || user.isAdmin === true;
      } else if (roleFilter === 'integrator') {
        roleMatch = user.role === 'integrator';
      } else if (roleFilter === 'enduser') {
        roleMatch = user.role === 'enduser';
      } else if (roleFilter === 'user') {
        roleMatch = user.requestedRole === 'user' || !user.requestedRole;
      } else if (roleFilter === 'suspended') {
        roleMatch = user.isSuspended === true;
      }
      
      // 4. Status Filter (Only Active Now)
      const activeMatch = !onlyActive || isUserActiveNow(user.lastActiveAt);
      
      return searchMatch && testMatch && roleMatch && activeMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'active-desc') {
        const timeA = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
        const timeB = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
        return timeB - timeA;
      }
      if (sortBy === 'name-asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'company-asc') {
        return (a.company || '').localeCompare(b.company || '');
      }
      if (sortBy === 'email-asc') {
        return (a.email || '').localeCompare(b.email || '');
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
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-slate-800 leading-tight">User Activity Dashboard</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-black flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{activeNowCount} online now</span>
                </span>
                {testUsersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 border border-purple-200 text-purple-800 text-[10px] font-black flex items-center gap-1">
                    <FlaskConical className="w-2.5 h-2.5" />
                    <span>{testUsersCount} test accounts</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                {users.length} registered accounts in Firestore
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
              placeholder="Search by Name, Email, Company, or Campaign Tag..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all font-semibold text-slate-800"
            />
          </div>

          {/* Test User Filter */}
          <div className="w-full sm:w-auto">
            <select
              value={testUserFilter}
              onChange={e => setTestUserFilter(e.target.value as any)}
              className="bg-white border border-purple-200/80 rounded-xl px-3 py-2 text-xs font-bold text-purple-800 focus:outline-none focus:border-purple-500 cursor-pointer shadow-2xs"
            >
              <option value="all">All Accounts ({users.length})</option>
              <option value="hide-test">Hide Test Accounts ({users.length - testUsersCount})</option>
              <option value="only-test">Test Accounts Only ({testUsersCount})</option>
            </select>
          </div>

          {/* Role Filter Dropdown */}
          <div className="w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="superuser">Superusers</option>
              <option value="evaluator">Evaluators / Staff</option>
              <option value="integrator">Integrators</option>
              <option value="enduser">End-users</option>
              <option value="user">Standard Users</option>
              <option value="suspended">Suspended Accounts</option>
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
              <option value="email-asc">Sort: Email (A-Z)</option>
              <option value="company-asc">Sort: Company (A-Z)</option>
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
                Only Active Now ({activeNowCount})
              </span>
            </label>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-4 min-h-0 bg-slate-50/30">
          {isLoading && users.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <span className="text-xs text-slate-400 font-bold">Connecting real-time user stream...</span>
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
                const isTest = isAccountTestUser(userProfile);
                
                return (
                  <div 
                    key={userProfile.id || userProfile.email}
                    className={`p-4 bg-white border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-xs ${
                      userProfile.isSuspended 
                        ? 'border-red-200 bg-red-50/30' 
                        : isTest
                        ? 'border-purple-200/70 bg-purple-50/15 hover:border-purple-300'
                        : 'border-slate-100 hover:border-slate-200/80'
                    }`}
                  >
                    {/* User profile identifier */}
                    <div className="flex items-center gap-3.5 text-left min-w-0">
                      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center font-black text-xs shrink-0 select-none relative ${
                        userProfile.isSuspended 
                          ? 'bg-red-100 border-red-200 text-red-700' 
                          : isTest
                          ? 'bg-purple-100 border-purple-200 text-purple-800'
                          : 'bg-slate-100 border-slate-200/50 text-slate-600'
                      }`}>
                        {getInitials(userProfile.name || userProfile.email)}
                        {/* Glowing active/inactive dot */}
                        <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${
                          userProfile.isSuspended ? 'bg-red-500' : status.dot
                        }`} />
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
                          {userProfile.role && userProfile.role !== 'other' && (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[9px] uppercase tracking-wider select-none">
                              {userProfile.role}
                            </span>
                          )}
                          {isTest && (
                            <span className="px-1.5 py-0.5 rounded-md bg-purple-100 border border-purple-200 text-purple-800 font-black text-[9px] uppercase tracking-wider flex items-center gap-1 select-none" title="Test User Account">
                              <FlaskConical className="w-2.5 h-2.5 text-purple-600" />
                              <span>Test Account</span>
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
                    <div className="flex items-center gap-3 sm:self-center justify-between sm:justify-end flex-wrap">
                      {/* Company/Organization */}
                      <div className="hidden md:flex flex-col text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 justify-end">
                          <Landmark className="w-3 h-3 text-slate-400/80" />
                          Company
                        </span>
                        <span className="text-xs font-bold text-slate-700 max-w-[130px] truncate" title={userProfile.company || userProfile.organization}>
                          {userProfile.company || userProfile.organization || 'Not Specified'}
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
                        <span className="px-2 py-1 text-[10px] font-black border rounded-xl shadow-xs select-none bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
                          <Ban className="w-3 h-3" />
                          <span>Suspended</span>
                        </span>
                      ) : (
                        <span className={`px-2 py-1 text-[10px] font-bold border rounded-xl shadow-xs select-none ${status.color}`}>
                          {status.text}
                        </span>
                      )}

                      {/* Actions: Test User Toggle & Suspend/Reactivate */}
                      <div className="flex items-center gap-1.5">
                        {/* Toggle Test User button */}
                        <button
                          onClick={() => handleToggleTestUser(userProfile.id, isTest)}
                          disabled={updatingId === userProfile.id}
                          className={`px-2 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 border shrink-0 ${
                            isTest
                              ? 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200'
                          }`}
                          title={isTest ? "Unmark as test user" : "Mark as test user"}
                        >
                          <FlaskConical className="w-3 h-3" />
                          <span>{isTest ? 'Test' : 'Mark Test'}</span>
                        </button>

                        {/* Suspend / Reactivate User Button */}
                        {!isSuper && (
                          <button
                            onClick={() => handleToggleSuspendUser(userProfile.id, userProfile.email, userProfile.isSuspended)}
                            disabled={updatingId === userProfile.id}
                            className={`px-2 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 border shrink-0 ${
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
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-semibold">
            Showing {filteredAndSortedUsers.length} of {users.length} users
          </span>
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
