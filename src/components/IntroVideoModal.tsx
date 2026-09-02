import React, { useState, useEffect } from 'react';
import { X, Sparkles, BookOpen, Layers, Bot, CheckCircle2, Lightbulb, Compass, PlusCircle, CheckCircle, Search } from 'lucide-react';

interface IntroVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'storyboard' | 'guide';
}

export function IntroVideoModal({ isOpen, onClose, defaultTab = 'storyboard' }: IntroVideoModalProps) {
  const [activeTab, setActiveTab] = useState<'storyboard' | 'guide'>(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const slides = [
    {
      step: "01",
      badge: "The Challenge",
      badgeColor: "bg-red-50 text-red-700 border-red-200",
      title: "1. The Handling Challenge in Production",
      description: "How do you specify parts that need picking out of bins and fed into the production line? Unstructured specifications cause weeks of guesswork and email delays.",
      image: "/onboarding/story_panel_1.jpg",
      icon: Compass,
      points: [
        "Capture bin dimensions, part geometry & placement fixtures directly on site",
        "Clear distinction between Average & Maximum cycle time requirements",
        "Eliminate guesswork and establish clear project parameters from day one"
      ]
    },
    {
      step: "02",
      badge: "Fast Start",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      title: "2. Launch App & Create New Project",
      description: "Access SCAPE PICK-PILOT from any smartphone or browser. Click '+ Create New Project' to open your private, structured engineering workspace in seconds.",
      image: "/onboarding/story_panel_2.jpg",
      icon: PlusCircle,
      points: [
        "Scan the QR code on the splash screen for instant mobile access",
        "Clean single-click project creation with full data isolation",
        "Accessible on shop floor tablets, laptops, and smartphones"
      ]
    },
    {
      step: "03",
      badge: "AI Data Capture",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      title: "3. Type, Dictate or Attach CAD & Photos",
      description: "Type, dictate on your smartphone, or upload CAD models and cell photos. The Scape AI Assistant structures your specifications automatically into the questionnaire.",
      image: "/onboarding/story_panel_3.jpg",
      icon: Bot,
      points: [
        "Dictate or type cell specifications with instant review before sending",
        "Upload CAD files (.step, .stl) or multi-angle 3D screenshots",
        "Review editable proposal cards and apply values with a single click"
      ]
    },
    {
      step: "04",
      badge: "AI Quality Check",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      title: "4. Project Information Advice & Submit",
      description: "Run 'Project Information Advice' to get an instant AI quality evaluation of your specifications. When all parameters are verified and green, submit your project with one tap.",
      image: "/onboarding/story_panel_4.jpg",
      icon: CheckCircle,
      points: [
        "Automated pre-screening audit of bin dimensions, part weight & reach",
        "Instant confirmation of qualified specification readiness",
        "Submit to lock your project and notify Scape engineering"
      ]
    },
    {
      step: "05",
      badge: "Scape Investigation",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      title: "5. Scape Engineering & Sales Review with AI",
      description: "Scape sales and robotics engineers investigate your project specifications using advanced AI simulation tools to determine vision sensor placement, gripper reach, and cycle times.",
      image: "/onboarding/story_panel_5.jpg",
      icon: Search,
      points: [
        "Technical verification of camera field-of-view and lighting conditions",
        "Gripper collision and clearance analysis inside your exact bin",
        "Direct communication between customer and dedicated Scape specialists"
      ]
    },
    {
      step: "06",
      badge: "Verified Result",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      title: "6. Feasibility Report & Tailored Implementation",
      description: "Receive your verified Scape Feasibility Report with guaranteed performance metrics, system component matching, and a clear proposal for full cell implementation.",
      image: "/onboarding/story_panel_6.jpg",
      icon: CheckCircle2,
      points: [
        "Guaranteed picking cycle time & feasibility score",
        "Preserved submission snapshot ensures full requirement traceability",
        "Fast turnaround from inquiry to tailored quotation and tested implementation"
      ]
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-3xl w-full relative overflow-hidden animate-scaleIn text-left max-h-[92svh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Accent Gradient */}
        <div className="h-2 bg-gradient-to-r from-red-600 via-indigo-600 to-amber-500 shrink-0" />

        {/* Header Bar */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-900 leading-tight">
                SCAPE PICK-PILOT
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                App Storyboard, Vision & Step-by-Step Guide
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-all border border-slate-100 cursor-pointer"
            title="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 bg-slate-50/70 border-b border-slate-100 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('storyboard')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'storyboard'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Visual Storyboard (6 Steps)</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>Quick Instructions & Tips</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 text-slate-700 space-y-6">
          {/* TAB 1: CONTINUOUS SCROLLABLE STORYBOARD SERIES */}
          {activeTab === 'storyboard' && (
            <div className="space-y-8">
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-950 flex items-center justify-between">
                <span className="font-semibold">
                  Scroll down through the 6 visual steps to see how Scape automates bin-picking evaluation:
                </span>
                <span className="text-[10px] font-mono font-black uppercase text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-indigo-200 shrink-0 ml-2">
                  6 Steps
                </span>
              </div>

              {slides.map((s, idx) => {
                const IconComponent = s.icon;
                return (
                  <div 
                    key={idx}
                    className="p-6 md:p-8 bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-slate-200/80 shadow-xs relative"
                  >
                    {/* Illustration Graphic */}
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 mb-6 shadow-sm">
                      <img 
                        src={s.image} 
                        alt={s.title} 
                        className="w-full h-full object-cover" 
                        loading="lazy"
                      />
                    </div>

                    {/* Step Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${s.badgeColor}`}>
                        {s.badge}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        Step {s.step} of 06
                      </span>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 text-slate-800">
                        <IconComponent className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                          {s.title}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed mb-5">
                          {s.description}
                        </p>

                        <div className="space-y-2">
                          {s.points.map((pt, pIdx) => (
                            <div key={pIdx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>{pt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: SPECIFIC INSTRUCTIONS & CHEAT SHEET */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <div className="p-4 bg-amber-50/70 border border-amber-200/70 rounded-2xl">
                <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>Key Tips for Highest Accuracy:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-amber-950/80 font-medium">
                  <li><strong>CAD Files:</strong> Upload <code>.STEP</code> or <code>.STL</code> files up to 200 KB, or attach 3D perspective screenshots for large models.</li>
                  <li><strong>Voice Dictation:</strong> Use your phone's built-in speech-to-text directly in the text field to dictate specifications and review before sending.</li>
                  <li><strong>Cycle Time:</strong> Select whether your cycle time is an average across a full bin or an absolute line-sync limit.</li>
                </ul>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <span className="font-mono font-bold text-slate-400 mt-0.5">[1.0]</span>
                  <div>
                    <h5 className="font-bold text-slate-900">Project Information</h5>
                    <p className="text-slate-500">Robot brand/model, bin dimensions (approximate toggle), and target cycle time.</p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <span className="font-mono font-bold text-slate-400 mt-0.5">[2.0]</span>
                  <div>
                    <h5 className="font-bold text-slate-900">Parts & Pick/Place Requirements</h5>
                    <p className="text-slate-500">Weight, surface reflections, CAD models, and destination fixture photos.</p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <span className="font-mono font-bold text-slate-400 mt-0.5">[3.0]</span>
                  <div>
                    <h5 className="font-bold text-slate-900">Business Case & Submit</h5>
                    <p className="text-slate-500">Shifts, human operators saved, and instant submission to Scape evaluation team.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="font-mono text-[10px] text-slate-400 font-bold">SCAPE SOLUTIONS A/S</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all cursor-pointer"
          >
            Got it, Let's Start
          </button>
        </div>
      </div>
    </div>
  );
}
