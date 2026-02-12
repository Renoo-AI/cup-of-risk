
import React, { useEffect, useState } from 'react';
import { Language } from '../types';
import { translations } from '../translations';

interface GameSplashScreenProps {
  onComplete: () => void;
  language: Language;
}

const GameSplashScreen: React.FC<GameSplashScreenProps> = ({ onComplete, language }) => {
  const [phase, setPhase] = useState(0);
  const t = translations[language];

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase(1), 800);
    const timer2 = setTimeout(() => setPhase(2), 1600);
    const timer3 = setTimeout(() => onComplete(), 2800);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-zinc-950"
        style={{
          backgroundImage: 'repeating-linear-gradient(-45deg, #fbbf24 0, #fbbf24 40px, #000 40px, #000 80px)',
          opacity: 0.15
        }}
      ></div>

      <div className="relative z-10 flex flex-col items-center">
        <div className={`transition-all duration-700 transform ${phase >= 1 ? 'scale-100 opacity-100' : 'scale-150 opacity-0'}`}>
          <div className="bg-white text-black font-game text-9xl px-12 py-4 mb-4 border-8 border-black shadow-[15px_15px_0_rgba(0,0,0,1)] uppercase">
            {t.ready}
          </div>
        </div>
        
        <div className={`transition-all duration-700 delay-300 transform ${phase >= 2 ? 'scale-110 opacity-100' : 'scale-50 opacity-0'}`}>
          <div className="bg-yellow-400 text-black font-game text-7xl px-8 py-2 border-8 border-black shadow-[10px_10px_0_rgba(255,255,255,1)] uppercase">
            {t.fight}
          </div>
        </div>
      </div>

      <div className={`absolute inset-0 bg-yellow-400 transition-transform duration-500 ease-in-out z-20 ${phase === 0 ? 'translate-x-0' : 'translate-x-full'}`}></div>
      <div className={`absolute inset-0 bg-black transition-transform duration-700 ease-in-out z-15 ${phase === 0 ? 'translate-x-0' : 'translate-x-full'}`}></div>
    </div>
  );
};

export default GameSplashScreen;
