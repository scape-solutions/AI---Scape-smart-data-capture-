import { Bot, Sparkles, Fingerprint, QrCode, Play } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { QRCodeView } from './QRCodeView';
import { IntroVideoModal } from './IntroVideoModal';

interface SplashScreenProps {
  onClose: () => void;
}

export function SplashScreen({ onClose }: SplashScreenProps) {
  const [isFading, setIsFading] = useState(false);
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false);

  const handleDismiss = () => {
    setIsFading(true);
    setTimeout(onClose, 500); // match transition duration
  };

  useEffect(() => {
    // Also allow dismiss on pressing any key
    const handleKeyDown = () => {
      handleDismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white select-none transition-all duration-500 overflow-hidden ${
        isFading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Sleek animated background elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      {/* Ambient radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-4000" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse duration-6000" />

      {/* Main Content Card (The Interactive Window) */}
      <div 
        onClick={handleDismiss}
        onTouchStart={handleDismiss}
        className="relative z-10 flex flex-col items-center text-center px-8 sm:px-10 py-12 sm:py-14 max-w-xl bg-slate-900/50 border border-slate-800/80 rounded-[2.5rem] backdrop-blur-xl shadow-2xl hover:scale-[1.01] hover:border-slate-700/80 hover:bg-slate-900/60 transition-all duration-500 cursor-pointer mx-4"
      >
        {/* Scape Logo and QR Code side by side */}
        <div className="flex flex-row items-center justify-center gap-3 sm:gap-5 mb-8 max-w-full">
          {/* Glowing Scape Logo Mark */}
          <div className="relative group">
            {/* Backlight Glow */}
            <div className="absolute inset-0 bg-red-600/20 rounded-[2rem] blur-2xl group-hover:bg-red-600/30 transition-all duration-500" />
            
            <div className="relative bg-white border border-slate-100 px-4 sm:px-6 py-4 rounded-3xl shadow-2xl flex items-center justify-center min-w-[160px] sm:min-w-[200px] h-[126px]">
              <img 
                src="/scape-logo.jpg" 
                alt="Scape Logo" 
                className="h-10 sm:h-12 w-auto object-contain" 
              />
            </div>
          </div>

          {/* QR Code Card */}
          <div className="relative group">
            {/* Backlight Glow */}
            <div className="absolute inset-0 bg-indigo-600/20 rounded-[2rem] blur-2xl group-hover:bg-indigo-600/30 transition-all duration-500" />

            <div className="relative bg-white border border-slate-100 p-2 rounded-3xl shadow-2xl flex flex-col items-center justify-center w-[126px] h-[126px] shrink-0">
              <QRCodeView url={typeof window !== 'undefined' ? `${window.location.origin}/?event=Open` : "https://scape-bin-picker-projects.web.app/?event=Open"} size={90} />
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-800 mt-1">
                Scan QR to Open
              </span>
            </div>
          </div>
        </div>

        {/* Brand/Subtitle */}
        <div className="flex items-center gap-2 mb-3 bg-red-950/40 border border-red-900/50 px-4 py-1.5 rounded-full backdrop-blur-xs">
          <Sparkles className="w-3.5 h-3.5 text-red-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-red-400 font-mono">
            Scape Solutions
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-slate-400">
          Scape Bin-Picker Projects
          <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-indigo-400">
            Project Information
          </span>
        </h1>

        <p className="mt-6 text-xs md:text-sm text-slate-400 font-medium max-w-sm leading-relaxed">
          Optimizing robotic vision, part identification, and bin-picking feasibility assessments with AI intelligence.
        </p>

        {/* Watch Intro & Guide Button */}
        <div className="mt-8 flex items-center justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsIntroModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-red-950/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/10"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>App Storyboard & Guide (6 Steps)</span>
          </button>
        </div>

        {/* Call to action */}
        <div className="mt-8 flex flex-col items-center gap-3 text-slate-500 hover:text-slate-300 transition-colors">
          <div className="w-10 h-10 rounded-full border border-slate-800 bg-slate-900/50 flex items-center justify-center animate-bounce duration-1000 shadow-lg">
            <Fingerprint className="w-5 h-5 text-red-500/80 animate-pulse" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
            Click window or press any key to start
          </span>
        </div>
      </div>

      {/* Intro & Guide Modal */}
      <IntroVideoModal 
        isOpen={isIntroModalOpen} 
        onClose={() => setIsIntroModalOpen(false)} 
      />

      {/* Footer Info */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center z-10 text-[10px] font-bold text-slate-600 font-mono">
        <span>SCAPE SOLUTIONS A/S</span>
      </div>
    </div>
  );
}

