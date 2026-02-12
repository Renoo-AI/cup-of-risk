import React, { useEffect, useState } from 'react';
import { Player, Language } from '../types';
import { translations } from '../translations';

interface GameOverScreenProps {
  winner: Player;
  onRestart: () => void;
  language: Language;
}

const ConfettiPiece: React.FC<{ delay: number; color: string; left: number; size: number }> = ({ delay, color, left, size }) => {
  return (
    <div 
      className="absolute top-[-10%] rounded-sm animate-confetti-fall"
      style={{
        backgroundColor: color,
        left: `${left}%`,
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${delay}ms`,
        transform: `rotate(${Math.random() * 360}deg)`,
      }}
    />
  );
};

const GameOverScreen: React.FC<GameOverScreenProps> = ({ winner, onRestart, language }) => {
  const [pieces, setPieces] = useState<{ id: number; delay: number; color: string; left: number; size: number }[]>([]);
  const [fireworks, setFireworks] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);
  const t = translations[language];

  useEffect(() => {
    const colors = ['#fbbf24', '#3b82f6', '#ef4444', '#10b981', '#ffffff'];
    
    const newPieces = Array.from({ length: 150 }, (_, i) => ({
      id: i,
      delay: Math.random() * 4000,
      color: colors[Math.floor(Math.random() * colors.length)],
      left: Math.random() * 100,
      size: 4 + Math.random() * 8,
    }));
    setPieces(newPieces);

    const newFireworks = Array.from({ length: 4 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 20 + Math.random() * 60,
      delay: i * 800,
    }));
    setFireworks(newFireworks);
  }, []);

  return (
    <div className="fixed inset-0 bg-zinc-950/98 z-[100] flex flex-col items-center justify-center p-6 overflow-hidden">
      <style>
        {`
          @keyframes confetti-fall {
            0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
          }
          .animate-confetti-fall { animation: confetti-fall 4s linear infinite; }
          @keyframes trophy-bounce {
            0%, 100% { transform: translateY(0) scale(1) rotate(0deg); }
            50% { transform: translateY(-15px) scale(1.05) rotate(5deg); }
          }
          .animate-trophy { animation: trophy-bounce 2s ease-in-out infinite; }
          @keyframes sunburst-rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-sunburst { animation: sunburst-rotate 20s linear infinite; }
          @keyframes firework-burst {
            0% { transform: scale(0.1); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: scale(2); opacity: 0; }
          }
          .animate-firework-burst div { animation: firework-particle 1s ease-out forwards; animation-delay: inherit; }
          @keyframes firework-particle {
            0% { transform: rotate(var(--rot)) translateY(0); opacity: 1; }
            100% { transform: rotate(var(--rot)) translateY(-60px); opacity: 0; }
          }
          @keyframes text-glow {
            0%, 100% { text-shadow: 0 0 10px rgba(251, 191, 36, 0.4); }
            50% { text-shadow: 0 0 25px rgba(251, 191, 36, 0.7); }
          }
          .animate-glow { animation: text-glow 2s ease-in-out infinite; }
        `}
      </style>

      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none overflow-hidden">
        <div className="w-[300vw] h-[300vw] animate-sunburst" 
             style={{ 
               background: `conic-gradient(from 0deg, transparent 0deg 15deg, white 15deg 30deg, transparent 30deg 45deg, white 45deg 60deg, transparent 60deg 75deg, white 75deg 90deg, transparent 90deg 105deg, white 105deg 120deg, transparent 120deg 135deg, white 135deg 150deg, transparent 150deg 165deg, white 165deg 180deg, transparent 180deg 195deg, white 195deg 210deg, transparent 210deg 225deg, white 225deg 240deg, transparent 240deg 255deg, white 255deg 270deg, transparent 270deg 285deg, white 285deg 300deg, transparent 300deg 315deg, white 315deg 330deg, transparent 330deg 345deg, white 345deg 360deg)`
             }}>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none">
        {pieces.map((p) => (
          <ConfettiPiece key={p.id} delay={p.delay} color={p.color} left={p.left} size={p.size} />
        ))}
        {fireworks.map((f) => (
          <div key={f.id} className="absolute animate-firework-burst" style={{ left: `${f.x}%`, top: `${f.y}%`, animationDelay: `${f.delay}ms` }}>
             {[...Array(10)].map((_, i) => (
               <div key={i} className={`absolute w-1 h-1 rounded-full ${winner.id === 1 ? 'bg-blue-400' : 'bg-red-400'}`} 
                    style={{ '--rot': `${i * 36}deg` } as any} />
             ))}
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center text-center animate-in zoom-in fade-in duration-700 w-full">
        <div className="relative mb-8 sm:mb-12">
          <div className="absolute -top-6 sm:-top-10 -right-6 sm:-right-10 bg-yellow-400 text-black font-game text-xl sm:text-3xl px-4 sm:px-6 py-1 sm:py-2 rounded-full border-2 sm:border-4 border-black rotate-12 animate-bounce shadow-xl">
            {t.victory}
          </div>
          
          <div className="animate-[shake_0.5s_ease-in-out]">
            <div className={`w-32 h-32 sm:w-48 sm:h-48 rounded-[2rem] sm:rounded-[3rem] flex items-center justify-center text-6xl sm:text-9xl shadow-[10px_10px_0_rgba(0,0,0,1)] sm:shadow-[20px_20px_0_rgba(0,0,0,1)] border-4 sm:border-8 border-black animate-trophy ${
              winner.id === 1 ? 'bg-blue-600' : 'bg-red-600'
            }`}>
              🏆
            </div>
          </div>
        </div>

        <h2 className="text-zinc-500 font-game text-2xl sm:text-4xl mb-2 uppercase tracking-[0.2em] sm:tracking-[0.4em]">{t.all_hail}</h2>
        <div className="animate-pulse">
          <h1 className={`text-5xl sm:text-9xl font-game mb-4 drop-shadow-[6px_6px_0_rgba(0,0,0,1)] sm:drop-shadow-[12px_12px_0_rgba(0,0,0,1)] animate-glow ${
            winner.id === 1 ? 'text-blue-500 [text-shadow:0_0_20px_rgba(59,130,246,0.8)]' : 'text-red-500 [text-shadow:0_0_20px_rgba(239,68,68,0.8)]'
          }`}>
            {winner.name.toUpperCase()}
          </h1>
        </div>
        
        <p className="text-white text-xl sm:text-3xl max-w-xs sm:max-w-lg mb-10 sm:mb-16 font-game tracking-widest opacity-80">
          {t.bluffing_legend}
        </p>

        <button 
          onClick={onRestart}
          className="group relative w-full max-w-sm py-6 sm:py-10 bg-white text-black font-game text-3xl sm:text-5xl border-b-[8px] sm:border-b-[12px] border-r-[8px] sm:border-r-[12px] border-zinc-300 active:translate-y-1 active:translate-x-1 transition-all shadow-2xl"
        >
          {t.play_again}
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen;