
import React from 'react';
import { Language } from '../types';
import { translations } from '../translations';

interface TransitionScreenProps {
  message: string;
  onConfirm: () => void;
  language: Language;
}

const TransitionScreen: React.FC<TransitionScreenProps> = ({ message, onConfirm, language }) => {
  const t = translations[language];

  return (
    <div className="fixed inset-0 bg-black z-[1000] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
      <div className="max-w-xl">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-12 mx-auto border-4 border-zinc-800 animate-pulse">
           <i className="fa-solid fa-mobile-screen-button text-5xl text-zinc-500"></i>
        </div>
        
        <h2 className="text-6xl font-game text-white mb-8 leading-tight tracking-wider">
          {message}
        </h2>
        
        <p className="text-zinc-500 text-2xl mb-20 uppercase font-bold tracking-widest">
          {t.no_peeking}
        </p>
        
        <button 
          onClick={onConfirm}
          className="group relative px-20 py-8 bg-white text-black font-game text-5xl border-b-8 border-r-8 border-zinc-300 hover:bg-yellow-400 hover:border-yellow-600 active:translate-y-2 active:translate-x-2 transition-all shadow-[0_20px_60px_rgba(255,255,255,0.1)]"
        >
          {t.confirm}
        </button>
      </div>
    </div>
  );
};

export default TransitionScreen;
