import React from 'react';
import { CupData, RevealStage, Language, GameMode } from '../types';
import { translations } from '../translations';
import { triggerHaptic } from '../sounds';

interface CupProps {
  cup: CupData;
  isSetup?: boolean;
  viewerPlayerId?: 1 | 2;
  canPlace?: boolean;
  language?: Language;
  playerLives?: number;
  gameMode?: GameMode;
}

const Cup: React.FC<CupProps> = ({ 
  cup, 
  isSetup = false, 
  viewerPlayerId, 
  canPlace = false, 
  language = 'en', 
  playerLives,
  gameMode = 'LOCAL'
}) => {
  const t = translations[language];

  const getVisibleItems = () => {
    if (cup.revealStage === RevealStage.HEARTS) {
      const hearts = cup.items.filter(i => i.type === 'heart');
      return playerLives !== undefined ? hearts.slice(0, playerLives) : hearts;
    }
    
    if (cup.revealStage === RevealStage.BOMBS || cup.isOpened || cup.revealStage === RevealStage.OPENED) {
      return cup.items;
    }

    if (gameMode === 'LOCAL') return [];

    if ((gameMode === 'AI' || gameMode === 'ONLINE') && viewerPlayerId) {
      return cup.items.filter(i => i.owner === viewerPlayerId);
    }
    
    return [];
  };

  const visibleItems = getVisibleItems();
  const isCupLifted = (cup.revealStage !== undefined && cup.revealStage !== RevealStage.HIDDEN) || cup.isOpened;
  const isPlayable = !isSetup && !cup.isOpened && (cup.revealStage === undefined || cup.revealStage === RevealStage.HIDDEN);
  
  const isXRayActive = (gameMode === 'AI' || gameMode === 'ONLINE') && 
                       viewerPlayerId !== undefined && 
                       cup.items.some(i => i.owner === viewerPlayerId) && 
                       !isCupLifted;

  return (
    <div className="relative w-[19vw] h-[22vw] max-w-[95px] max-h-[110px] group transition-all tap-highlight-none drop-shadow-2xl">
      {/* Items Layer - Elevated during X-Ray */}
      <div className={`
        absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none transition-all duration-300
        ${isXRayActive ? 'z-20 -translate-y-4 scale-110' : 'z-0'}
      `}>
        {visibleItems.length > 0 ? (
          <div className={`
            flex flex-wrap items-center justify-center gap-1 animate-in zoom-in fade-in duration-300
            ${isXRayActive ? 'drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] opacity-100' : ''}
          `}>
            {visibleItems.map((item, idx) => (
              <span 
                key={`${item.type}-${idx}`} 
                className={`text-2xl sm:text-4xl drop-shadow-xl transition-transform duration-300 ${
                  cup.revealStage === RevealStage.BOMBS && item.type === 'bomb' ? 'scale-150 animate-bounce' : ''
                } ${isXRayActive ? 'animate-pulse' : ''}`}
              >
                {item.type === 'bomb' ? '💣' : '💔'}
              </span>
            ))}
          </div>
        ) : (
          cup.isOpened && <span className="text-zinc-800 text-[10px] font-black uppercase tracking-widest">{t.empty}</span>
        )}
      </div>

      {/* Cup Layer */}
      <div className={`
        absolute inset-0 z-10 
        transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
        ${isCupLifted ? '-translate-y-24 opacity-0 pointer-events-none rotate-12 scale-90' : ''}
        ${canPlace ? 'active:-translate-y-4 active:scale-115 active:rotate-1' : ''}
        ${isPlayable ? 'active:-translate-y-4 active:scale-120 active:rotate-[-2deg]' : ''}
      `}>
        {/* Shake Wrapper to prevent transform conflicts */}
        <div className={`h-full w-full ${isCupLifted ? 'animate-[shake_0.4s_ease-in-out_forwards]' : ''}`}>
        {/* The Actual Cup Body */}
        <div className={`
          relative h-full w-full rounded-t-[1.5rem] sm:rounded-t-[2.8rem] border-x-2 sm:border-x-4 border-t-2 sm:border-t-4 
          cup-shadow-tactile transition-all duration-300 overflow-hidden
          ${isPlayable ? 'cursor-pointer active:shadow-[0_0_30px_rgba(251,191,36,0.9)]' : ''}
          ${isSetup ? 'bg-zinc-800 border-zinc-700' : 'bg-yellow-500 border-yellow-400'}
          ${isXRayActive ? 'opacity-20 border-blue-500/40 ring-2 ring-blue-500/20' : 'opacity-100'}
        `}>
          {/* Subtle Glow for X-Ray */}
          {isXRayActive && (
             <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
          )}

          {/* Static Shine Line (Normal Mode Only) */}
          {!isXRayActive && <div className="absolute top-1/2 inset-x-0 h-1 bg-black/10"></div>}

          {/* Dynamic Shine Effect */}
          {!isSetup && !isXRayActive && !isCupLifted && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shine_3s_infinite] pointer-events-none"></div>
          )}
          
          {/* Setup Badge */}
          {isSetup && visibleItems.length > 0 && (
            <div className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[9px] sm:text-xs font-black w-5 h-5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 border-black shadow-xl z-30 animate-in zoom-in">
              {visibleItems.length}
            </div>
          )}
        </div>
        </div>
        
        {/* Cup Rim Base */}
        <div className={`
          absolute -bottom-1 inset-x-[-3px] sm:inset-x-[-6px] h-3 sm:h-6 rounded-full border-2 sm:border-4
          ${isSetup ? 'bg-zinc-700 border-zinc-600' : 'bg-yellow-400 border-yellow-300'}
          ${isXRayActive ? 'opacity-10' : 'opacity-100'}
        `}></div>
      </div>

      {/* Ground Shadow */}
      <div className={`
        absolute -bottom-3 inset-x-3 h-4 bg-black/50 rounded-full blur-md transition-all duration-500
        ${isCupLifted ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}
      `}></div>
    </div>
  );
};

export default Cup;