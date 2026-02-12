import React, { useState } from 'react';
import { Language, Difficulty, UserProfile } from '../types';
import { translations } from '../translations';
import { playSound, triggerHaptic } from '../sounds';

interface HomeScreenProps {
  onPlayLocal: () => void;
  onPlayAI: (difficulty: Difficulty) => void;
  onPlayOnline: () => void;
  onSettings: () => void;
  onHowToPlay: () => void;
  language: Language;
  soundEnabled: boolean;
  user: UserProfile | null;
  onShowLogin: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ 
  onPlayLocal, 
  onPlayAI, 
  onPlayOnline, 
  onSettings, 
  onHowToPlay, 
  language, 
  soundEnabled, 
  user,
  onShowLogin 
}) => {
  const [showAIDifficulty, setShowAIDifficulty] = useState(false);
  const t = translations[language];
  const isRTL = language === 'ar';

  const handleAction = (callback: () => void) => {
    playSound('click', soundEnabled);
    callback();
  };

  const handleOnlineClick = () => {
    triggerHaptic('medium');
    if (!user) {
      onShowLogin();
    } else {
      handleAction(onPlayOnline);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center h-full w-full bg-zinc-950 animate-in fade-in duration-500 overflow-hidden relative ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="absolute inset-0 opacity-5 pointer-events-none select-none overflow-hidden">
        <div className="grid grid-cols-6 gap-20 transform -rotate-12 scale-150">
          {[...Array(30)].map((_, i) => (
             <div key={i} className="text-9xl grayscale filter invert opacity-20">
               {['?', '💣', '💔'][i % 3]}
             </div>
          ))}
        </div>
      </div>

      {/* User Mini Profile */}
      {user && (
        <div className="absolute top-6 left-6 flex items-center gap-3 animate-in slide-in-from-left duration-500">
          <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full border-2 border-yellow-400 shadow-lg" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.pride_score}</span>
            <span className="font-game text-yellow-400 leading-none">{user.prideScore}</span>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center max-w-2xl w-full px-6">
        <div className="relative mb-8 sm:mb-16 text-center animate-[float_4s_ease-in-out_infinite]">
          <div className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white font-game text-lg sm:text-2xl px-4 py-1 border-2 border-black ${isRTL ? 'rotate-[5deg]' : 'rotate-[-5deg]'} shadow-xl z-20 whitespace-nowrap`}>
            {t.high_stakes}
          </div>
          <h1 className="text-6xl sm:text-9xl font-game text-yellow-400 drop-shadow-[0_8px_0_rgba(0,0,0,1)] tracking-tighter leading-none italic transform -rotate-2">
            CUP <span className="text-white">OF</span> RISK
          </h1>
        </div>

        <div className="flex flex-col gap-4 w-full">
          {!showAIDifficulty ? (
            <>
              <button 
                onClick={() => handleAction(onPlayLocal)}
                className="group relative w-full py-5 sm:py-7 bg-gradient-to-br from-white to-zinc-200 text-black font-game text-3xl sm:text-4xl border-b-[8px] border-r-[8px] border-zinc-300 hover:scale-[1.02] active:scale-[0.98] active:translate-y-1 transition-all shadow-xl flex items-center justify-center gap-4 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite]"></div>
                <i className="fa-solid fa-users text-zinc-400 group-hover:text-yellow-600 z-10"></i>
                <span className="z-10">{t.play_local}</span>
              </button>

              <button 
                onClick={handleOnlineClick}
                className="group relative w-full py-5 sm:py-7 bg-gradient-to-br from-yellow-400 to-yellow-600 text-black font-game text-3xl sm:text-4xl border-b-[8px] border-r-[8px] border-yellow-700 hover:scale-[1.02] active:scale-[0.98] active:translate-y-1 transition-all shadow-2xl flex items-center justify-center gap-4 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite]"></div>
                <i className="fa-solid fa-earth-americas z-10"></i>
                <span className="z-10">{t.online}</span>
              </button>

              <button 
                onClick={() => handleAction(() => setShowAIDifficulty(true))}
                className="group relative w-full py-4 bg-zinc-800 text-white font-game text-2xl border-b-[6px] border-r-[6px] border-zinc-950 active:translate-y-1 transition-all shadow-xl flex items-center justify-center gap-4"
              >
                <i className="fa-solid fa-robot text-yellow-400"></i>
                {t.vs_ai}
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3 animate-in slide-in-from-right duration-300">
              <div className="text-center font-game text-2xl text-zinc-500 mb-2 uppercase tracking-widest">{t.difficulty}</div>
              <div className="flex flex-col gap-2">
                <button onClick={() => handleAction(() => onPlayAI('EASY'))} className="w-full py-4 bg-green-600 text-white font-game text-2xl rounded-2xl border-b-8 border-green-800 active:translate-y-1 transition-all">{t.easy}</button>
                <button onClick={() => handleAction(() => onPlayAI('NORMAL'))} className="w-full py-4 bg-yellow-500 text-black font-game text-2xl rounded-2xl border-b-8 border-yellow-700 active:translate-y-1 transition-all">{t.normal}</button>
                <button onClick={() => handleAction(() => onPlayAI('HARD'))} className="w-full py-4 bg-red-600 text-white font-game text-2xl rounded-2xl border-b-8 border-red-800 active:translate-y-1 transition-all">{t.hard}</button>
                <button onClick={() => handleAction(() => setShowAIDifficulty(false))} className="mt-2 w-full py-3 bg-zinc-900 text-zinc-400 font-game text-xl rounded-xl border-2 border-zinc-800">{t.back}</button>
              </div>
            </div>
          )}

          {!showAIDifficulty && (
            <div className="flex gap-4 mt-2">
              <button onClick={() => handleAction(onSettings)} className="flex-1 py-4 bg-zinc-900 text-white font-game text-lg border-b-4 border-r-4 border-zinc-800 active:translate-y-1 transition-all flex items-center justify-center gap-2">
                <i className="fa-solid fa-gear"></i>
                {t.settings}
              </button>
              <button onClick={() => handleAction(onHowToPlay)} className="flex-1 py-4 bg-zinc-900 text-white font-game text-lg border-b-4 border-r-4 border-zinc-800 active:translate-y-1 transition-all flex items-center justify-center gap-2">
                <i className="fa-solid fa-circle-question"></i>
                {t.how_to_play}
              </button>
            </div>
          )}
        </div>

        <div className="mt-12 glass-effect px-4 py-1.5 rounded-full text-zinc-500 font-bold tracking-[0.2em] text-[9px] uppercase border border-white/5 shadow-inner">
          v1.3.1 // ENHANCED EXPERIENCE
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;