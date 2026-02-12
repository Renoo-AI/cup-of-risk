
import React from 'react';
import { Language } from '../types';
import { translations } from '../translations';

interface StartScreenProps {
  onStart: () => void;
  language: Language;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, language }) => {
  const t = translations[language];

  return (
    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
      <div className="relative mb-12">
        <h1 className="text-8xl font-game text-yellow-400 drop-shadow-[0_10px_0_rgba(0,0,0,1)] tracking-wider">
          CUP OF RISK
        </h1>
        <div className="absolute -top-4 -right-4 w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-bold border-4 border-black text-xl">
          ?
        </div>
      </div>
      
      <p className="text-zinc-500 text-xl font-medium mb-12 max-w-md text-center uppercase tracking-widest">
        {t.bluffing_game}
      </p>
      
      <button 
        onClick={onStart}
        className="group relative px-16 py-8 bg-white text-black font-game text-5xl border-b-8 border-r-8 border-zinc-300 hover:border-zinc-400 active:border-none active:translate-y-2 active:translate-x-2 transition-all shadow-2xl"
      >
        <span className="relative z-10">{t.start_game}</span>
        <div className="absolute inset-0 bg-yellow-400 opacity-0 group-hover:opacity-10 transition-opacity"></div>
      </button>

      <div className="mt-20 flex gap-16">
        <div className="flex flex-col items-center gap-2 bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
          <span className="text-4xl">💣</span>
          <span className="text-sm font-bold text-zinc-400">{t.bombs_desc}</span>
        </div>
        <div className="flex flex-col items-center gap-2 bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
          <span className="text-4xl text-red-500">💔</span>
          <span className="text-sm font-bold text-zinc-400">{t.hearts_desc}</span>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
