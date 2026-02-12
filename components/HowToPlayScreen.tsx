import React from 'react';
import { Language } from '../types';
import { translations } from '../translations';
import { triggerHaptic } from '../sounds';

interface HowToPlayScreenProps {
  language: Language;
  onBack: () => void;
}

const HowToPlayScreen: React.FC<HowToPlayScreenProps> = ({ language, onBack }) => {
  const t = translations[language];
  const isRTL = language === 'ar';

  const handleBack = () => {
    triggerHaptic('light');
    onBack();
  };

  return (
    <div className={`flex flex-col items-center w-full h-full bg-zinc-950 px-5 py-4 sm:p-8 animate-in fade-in duration-300 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Compact Header */}
      <h2 className="text-3xl sm:text-7xl font-game text-yellow-400 mt-2 mb-4 sm:my-12 drop-shadow-[0_4px_0_rgba(0,0,0,1)] text-center">
        {t.how_to_play}
      </h2>

      {/* Rules Container - Optimized for Mobile Fit */}
      <div className="w-full max-w-2xl bg-zinc-900/60 p-4 sm:p-10 rounded-[1.5rem] sm:rounded-[3rem] border-2 border-zinc-800 shadow-2xl flex flex-col gap-3 sm:gap-8 overflow-y-auto no-scrollbar backdrop-blur-md flex-1 mb-4">
        <h3 className="font-game text-xl sm:text-4xl text-white border-b-2 border-yellow-400 pb-0.5 inline-block self-start">
          {t.rules_title}
        </h3>
        
        <div className="flex flex-col gap-3 sm:gap-6 text-[13px] sm:text-xl text-zinc-300 font-bold leading-tight sm:leading-relaxed">
          <p className="flex items-center gap-3">
            <span className="text-lg sm:text-3xl shrink-0">👥</span>
            {t.rules_p1}
          </p>
          <p className="flex items-center gap-3">
            <span className="text-lg sm:text-3xl shrink-0">📦</span>
            {t.rules_p2}
          </p>
          <p className="flex items-center gap-3">
            <span className="text-lg sm:text-3xl shrink-0">🎭</span>
            {t.rules_p3}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 my-1">
             <div className="bg-zinc-800/40 p-3 sm:p-6 rounded-xl border border-red-500/10 flex items-center gap-3">
               <span className="text-xl sm:text-4xl">💔</span>
               <span className="text-[11px] sm:text-base leading-none">{t.rules_p4.split('.')[0]}</span>
             </div>
             <div className="bg-zinc-800/40 p-3 sm:p-6 rounded-xl border border-yellow-400/10 flex items-center gap-3">
               <span className="text-xl sm:text-4xl">💣</span>
               <span className="text-[11px] sm:text-base leading-none">{t.rules_p4.split('.')[1]}</span>
             </div>
          </div>

          <p className="flex items-center gap-3">
            <span className="text-lg sm:text-3xl shrink-0">💀</span>
            {t.rules_p5}
          </p>
          <p className="flex items-center gap-3 text-yellow-400/90 italic">
            <span className="text-lg sm:text-3xl shrink-0">⚖️</span>
            {t.rules_p6}
          </p>
        </div>
      </div>

      {/* Large Back Button - Bottom Anchored */}
      <button 
        onClick={handleBack}
        className="w-full max-w-md py-4 sm:py-6 bg-white text-black font-game text-2xl sm:text-4xl rounded-xl sm:rounded-2xl border-b-4 sm:border-b-8 border-r-4 sm:border-r-8 border-zinc-300 hover:bg-yellow-400 active:translate-y-1 transition-all shadow-xl tap-highlight-none"
      >
        {t.back}
      </button>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default HowToPlayScreen;