import React from 'react';
import { Player, CupData, Language, GameMode } from '../types';
import Cup from './Cup';
import { translations } from '../translations';

interface PlayScreenProps {
  players: Player[];
  currentPlayerIdx: number;
  cups: CupData[];
  onOpenCup: (cupId: number) => void;
  isResolving: boolean;
  language: Language;
  gameMode: GameMode;
  viewerPlayerId?: 1 | 2;
}

const PlayScreen: React.FC<PlayScreenProps> = ({ 
  players, 
  currentPlayerIdx, 
  cups, 
  onOpenCup, 
  isResolving, 
  language,
  gameMode,
  viewerPlayerId
}) => {
  const activePlayer = players[currentPlayerIdx];
  const t = translations[language];
  const isRTL = language === 'ar';

  return (
    <div className={`w-full h-full flex flex-col items-center justify-between py-2 px-2 sm:p-8 bg-zinc-950 animate-in fade-in duration-300 ${isResolving ? 'pointer-events-none' : ''}`}>
      {/* HUD Top - Compact for mobile */}
      <div className="w-full flex justify-between items-center max-w-5xl gap-1 sm:gap-2 mt-1 sm:mt-2">
        <div className={`flex flex-col items-center p-1.5 sm:p-6 rounded-xl sm:rounded-[2rem] transition-all border-2 sm:border-4 ${
          currentPlayerIdx === 0 
          ? 'bg-blue-600/20 border-blue-500 scale-105' 
          : 'bg-zinc-900/50 border-zinc-800 opacity-50'
        }`}>
          <span className="font-game text-[9px] sm:text-3xl text-blue-500 mb-0.5">P1</span>
          <div className="flex gap-0.5">
            {[...Array(players[0].lives)].map((_, i) => (
              <span key={i} className="text-xs sm:text-3xl">❤️</span>
            ))}
            {players[0].lives === 0 && <span className="text-xs sm:text-3xl grayscale">💀</span>}
          </div>
        </div>

        <div className="flex-1 text-center px-1">
          <div className={`w-full py-1 sm:py-3 rounded-lg sm:rounded-2xl font-game text-[10px] sm:text-3xl border-2 sm:border-4 transition-all duration-300 ${
            isResolving ? 'bg-zinc-800 border-zinc-700 text-zinc-500' : 
            currentPlayerIdx === 0 ? 'bg-blue-600 border-blue-400 text-white' : 'bg-red-600 border-red-400 text-white'
          }`}>
            {isResolving ? t.resolving : (isRTL ? `${t.player_turn} ${activePlayer.name.toUpperCase()}` : `${activePlayer.name.toUpperCase()}${t.player_turn}`)}
          </div>
        </div>

        <div className={`flex flex-col items-center p-1.5 sm:p-6 rounded-xl sm:rounded-[2rem] transition-all border-2 sm:border-4 ${
          currentPlayerIdx === 1 
          ? 'bg-red-600/20 border-red-500 scale-105' 
          : 'bg-zinc-900/50 border-zinc-800 opacity-50'
        }`}>
          <span className="font-game text-[9px] sm:text-3xl text-red-500 mb-0.5">P2</span>
          <div className="flex gap-0.5">
            {[...Array(players[1].lives)].map((_, i) => (
              <span key={i} className="text-xs sm:text-3xl">❤️</span>
            ))}
            {players[1].lives === 0 && <span className="text-xs sm:text-3xl grayscale">💀</span>}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="relative mt-1 sm:mt-2">
        <div className="grid grid-cols-4 gap-1 sm:gap-6 p-2 sm:p-12 bg-zinc-900/40 rounded-[1.2rem] sm:rounded-[3rem] border-b-4 sm:border-b-[12px] border-zinc-800/50">
          {cups.map((cup) => (
            <div 
              key={cup.id} 
              onClick={() => !isResolving && onOpenCup(cup.id)}
              className="touch-manipulation"
            >
              <Cup 
                cup={cup} 
                language={language} 
                playerLives={activePlayer.lives} 
                gameMode={gameMode}
                viewerPlayerId={viewerPlayerId}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Info Bottom */}
      <div className="text-zinc-600 font-bold text-[9px] sm:text-lg tracking-[0.2em] uppercase text-center mb-2 sm:mb-6">
        {isResolving ? t.calculating_fate : t.tap_to_reveal}
      </div>
    </div>
  );
};

export default PlayScreen;