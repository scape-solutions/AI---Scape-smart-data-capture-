import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, ShieldCheck, Box, UserCheck, Phone, Building2, Mail } from 'lucide-react';
import { UserProfile } from '../types';

interface OnboardingModalProps {
  show: boolean;
  user: any;
  profile: UserProfile | null;
  readOnly?: boolean;
  onClose?: () => void;
  onAccept?: (data: { name: string; company: string; phone: string; role: 'enduser' | 'integrator' }) => void;
}

export function OnboardingModal({
  show,
  user,
  profile,
  readOnly = false,
  onClose,
  onAccept
}: OnboardingModalProps) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'enduser' | 'integrator' | ''>('');
  const [tosAccepted, setTosAccepted] = useState(false);

  // Prefill state from profile/user when modal opens
  useEffect(() => {
    if (show && profile) {
      setName(profile.name || user?.displayName || '');
      setCompany(profile.company || profile.organization || '');
      setPhone(profile.phone || '');
      setRole(profile.role === 'enduser' || profile.role === 'integrator' ? profile.role : '');
      setTosAccepted(!!profile.tosAcceptedAt);
    }
  }, [show, profile, user]);

  const isValid = name.trim() && company.trim() && phone.trim() && role && (readOnly || tosAccepted);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && onAccept && !readOnly) {
      onAccept({
        name: name.trim(),
        company: company.trim(),
        phone: phone.trim(),
        role: role as 'enduser' | 'integrator'
      });
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50 shrink-0">
              <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  {readOnly ? "Terms of Service (ToS)" : "Terms of Service & Onboarding"}
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  {readOnly ? "Scape Bin-Picker Projects Terms of Service" : "Confirm your information and accept our terms"}
                </p>
              </div>
            </div>

            {/* Content Area - Scrollable */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 text-slate-700">
              
              {/* Profile setup fields - only shown if not readOnly */}
              {!readOnly && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-slate-500" />
                    Profile Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Full Name</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Rune Larsen"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                        />
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Email (Locked / Read-only)</label>
                      <div className="relative">
                        <input
                          type="email"
                          disabled
                          value={user?.email || profile?.email || ''}
                          className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-400 cursor-not-allowed"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    {/* Company */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Company</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="e.g. Scape Solutions A/S"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                        />
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Phone Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +45 12345678"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Your Role</label>
                      <select
                        required
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                        className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
                      >
                        <option value="">Select your role...</option>
                        <option value="enduser">End-user</option>
                        <option value="integrator">Integrator</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Terms of Service Scrollable Box */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-500" />
                  Terms of Service & Guidelines (ToS)
                </h4>

                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 text-xs font-semibold leading-relaxed space-y-4 max-h-48 md:max-h-60 overflow-y-auto text-slate-600">
                  <div>
                    <h5 className="font-bold text-slate-800 mb-1">1. Confidentiality, Data Security & Usage</h5>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>All entered information, CAD files, and uploaded images are treated as strictly confidential and stored securely in our private cloud databases.</li>
                      <li>Data is protected against unauthorized access and is accessed solely by authorized personnel from Scape Solutions A/S and the project's designated end-user/integrator.</li>
                      <li>Anonymized data may be used to train and optimize our vision and evaluation algorithms, ensuring it can never be traced back to a specific client or project.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-800 mb-1">2. Disclaimer & AI Usage</h5>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>This application is provided by Scape Solutions A/S as a data collection and guidance tool. Usage of this app is free of commitment or liability for Scape Solutions.</li>
                      <li>
                        <strong>AI Assistant Notice:</strong> The integrated AI Chat Assistant is designed exclusively to facilitate data collection and provide early technical guidance. The AI may produce errors ("AI run-aways") or incorrect estimates.
                      </li>
                      <li>
                        <strong>Important:</strong> Official, binding feasibility responses, performance guarantees, and technical quotes are <strong>always and exclusively</strong> provided in writing by an authorized Scape Solutions engineer after a thorough manual review.
                      </li>
                    </ul>
                  </div>

                  <div className="text-[10px] text-slate-400 italic">
                    By using this application, you acknowledge that you have read and agreed to the above Terms of Service. The application is provided without further commitment from Scape Solutions A/S.
                  </div>
                </div>
              </div>

              {/* Accept Checkbox - only shown if not readOnly */}
              {!readOnly && (
                <label className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-150 rounded-2xl cursor-pointer select-none hover:bg-slate-100/70 transition-all">
                  <input
                    type="checkbox"
                    checked={tosAccepted}
                    onChange={(e) => setTosAccepted(e.target.checked)}
                    className="mt-0.5 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-700 block">I accept the terms of service (ToS)</span>
                    <span className="text-slate-400 font-semibold text-[10px]">I confirm that my profile information is correct and approve Scape Solutions' ToS.</span>
                  </div>
                </label>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-6 md:p-8 border-t border-slate-100 flex gap-3 bg-slate-50/50 shrink-0">
              {readOnly ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-4 bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all text-xs cursor-pointer"
                >
                  Close
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!isValid}
                  className={`w-full py-4 text-white rounded-2xl font-bold shadow-lg transition-all text-xs cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] ${
                    isValid 
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' 
                      : 'bg-slate-300 shadow-none cursor-not-allowed'
                  }`}
                >
                  Accept & Continue
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
