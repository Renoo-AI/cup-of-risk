import React from 'react';
import { Language } from '../types';
import { translations } from '../translations';

interface MatchmakingScreenProps {
  language: Language;
  onCancel: () => void;
  status: 'searching' | 'found';
}

const MatchmakingScreen: React.FC<MatchmakingScreenProps> = ({ language, onCancel, status }) => {
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-[1000] bg-zinc-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        <div className="grid grid-cols-6 gap-20 transform -rotate-12 scale-150">
          {[...Array(30)].map((_, i) => (
             <div key={i} className="text-9xl grayscale filter invert opacity-20 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>?</div>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        <div className="w-32 h-32 mb-12 relative">
          <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20"></div>
          <div className="absolute inset-4 bg-yellow-400 rounded-full animate-pulse flex items-center justify-center">
             <i className="fa-solid fa-earth-americas text-black text-5xl"></i>
          </div>
        </div>

        <h2 className="text-4xl font-game text-white mb-4 animate-bounce">
          {status === 'searching' ? t.searching : t.opponent_found}
        </h2>

        <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-xs mb-12">
          {status === 'searching' ? 'WAITING IN THE ARENA' : t.match_ready}
        </p>

        {status === 'searching' && (
          <button
            onClick={onCancel}
            className="w-full py-4 bg-zinc-900 text-white font-game text-lg rounded-2xl border-2 border-zinc-800 active:scale-95 transition-all"
          >
            {t.back}
          </button>
        )}
      </div>
    </div>
  );
};

export default MatchmakingScreen;