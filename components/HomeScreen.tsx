import React, { useState, useEffect } from 'react';
import { Language, Difficulty, UserProfile } from '../types';
import { translations } from '../translations';
import { playSound, triggerHaptic } from '../sounds';
import { getLeaderboard } from '../firebase';

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
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
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

  useEffect(() => {
    getLeaderboard(3).then(setLeaderboard).catch(e => console.error('Leaderboard load failed', e));
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center h-full w-full bg-zinc-950 animate-in fade-in duration-500 overflow-hidden relative ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="absolute inset-0 opacity-5 pointer-events-none select-none overflow-hidden">
        <div className="grid grid-cols-6 gap-20 transform -rotate-12 scale-150">
          {[...Array(30)].map((_, i) => (
             <div key={i} className="text-9xl grayscale filter invert opacity-20">?</div>
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
        <div className="relative mb-8 sm:mb-16 text-center">
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
                className="group relative w-full py-5 sm:py-7 bg-white text-black font-game text-3xl sm:text-4xl border-b-[8px] border-r-[8px] border-zinc-300 active:translate-y-1 transition-all shadow-xl flex items-center justify-center gap-4"
              >
                <i className="fa-solid fa-users text-zinc-400 group-hover:text-yellow-600"></i>
                {t.play_local}
              </button>

              <button 
                onClick={handleOnlineClick}
                className="group relative w-full py-5 sm:py-7 bg-yellow-400 text-black font-game text-3xl sm:text-4xl border-b-[8px] border-r-[8px] border-yellow-600 active:translate-y-1 transition-all shadow-xl flex items-center justify-center gap-4"
              >
                <i className="fa-solid fa-earth-americas"></i>
                {t.online}
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

        {/* Leaderboard */}
        {!showAIDifficulty && leaderboard.length > 0 && (
          <div className="mt-12 w-full bg-zinc-900/50 border-2 border-zinc-800 rounded-3xl p-6 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 text-center">{t.top_warriors}</div>
            <div className="flex flex-col gap-3">
              {leaderboard.map((entry, i) => (
                <div key={entry.uid} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-game ${i === 0 ? 'text-yellow-400' : 'text-zinc-500'}`}>#{i+1}</span>
                    <img src={entry.photoURL} alt="" className="w-6 h-6 rounded-full border border-zinc-700" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider truncate max-w-[100px]">{entry.displayName}</span>
                  </div>
                  <span className="text-xs font-game text-yellow-400">{entry.prideScore}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-zinc-700 font-bold tracking-[0.3em] text-[10px] uppercase">
          v1.3.0 // ONLINE & PRIDE
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;