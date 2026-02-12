import React, { useState } from 'react';
import { Player, CupData, ItemType, Language, GameMode } from '../types';
import Cup from './Cup';
import { translations } from '../translations';
import { triggerHaptic } from '../sounds';

interface SetupScreenProps {
  player: Player;
  cups: CupData[];
  onPlaceItem: (cupId: number, type: ItemType) => void;
  onFinishRequest: () => void;
  isConfirming: boolean;
  onConfirm: () => void;
  onCancelConfirm: () => void;
  language: Language;
  gameMode: GameMode;
  viewerPlayerId?: 1 | 2;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ 
  player, 
  cups, 
  onPlaceItem, 
  onFinishRequest, 
  isConfirming, 
  onConfirm, 
  onCancelConfirm,
  language,
  gameMode,
  viewerPlayerId
}) => {
  const [selectedType, setSelectedType] = useState<ItemType | null>(null);
  const [placedFeedback, setPlacedFeedback] = useState<{ id: number; type: ItemType; x: number; y: number } | null>(null);
  const t = translations[language];
  const isRTL = language === 'ar';

  const totalInventory = player.inventory.bomb + player.inventory.heart;

  const handlePlace = (cupId: number, e: React.MouseEvent | React.TouchEvent) => {
    if (!isConfirming && selectedType && player.inventory[selectedType] > 0) {
      triggerHaptic('medium');
      onPlaceItem(cupId, selectedType);
      
      // Feedback animation coordinates
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setPlacedFeedback({
        id: Date.now(),
        type: selectedType,
        x: rect.left + rect.width / 2,
        y: rect.top
      });
      setTimeout(() => setPlacedFeedback(null), 600);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between py-2 px-2 sm:p-8 bg-zinc-950 animate-in fade-in slide-in-from-bottom duration-300 overflow-hidden">
      {/* Visual Feedback on tap */}
      {placedFeedback && (
        <div 
          className="fixed z-[1000] pointer-events-none animate-float-up text-3xl sm:text-4xl"
          style={{ left: placedFeedback.x - 15, top: placedFeedback.y - 15 }}
        >
          {placedFeedback.type === 'bomb' ? '💣' : '💔'}
        </div>
      )}

      <div className="text-center mt-1 sm:mt-2">
        <h2 className={`text-2xl sm:text-6xl font-game leading-tight ${player.id === 1 ? 'text-blue-500' : 'text-red-500'}`}>
          {isRTL ? `${t.player_turn} ${player.name}` : `${player.name}${t.player_turn}`}
        </h2>
        <p className="text-zinc-500 text-[10px] sm:text-lg uppercase tracking-widest font-black">{t.hide_traps}</p>
      </div>

      <div className={`grid grid-cols-4 gap-1 sm:gap-6 p-2 sm:p-10 bg-zinc-900/40 rounded-[1.5rem] sm:rounded-[3rem] border-2 border-zinc-800/50 shadow-2xl transition-all ${isConfirming ? 'opacity-20 scale-95 blur-sm pointer-events-none' : ''}`}>
        {cups.map((cup) => (
          <div 
            key={cup.id} 
            onClick={(e) => handlePlace(cup.id, e)}
            className="touch-manipulation tap-highlight-none"
          >
            <Cup 
              cup={cup} 
              isSetup={true} 
              viewerPlayerId={viewerPlayerId} 
              canPlace={!isConfirming && !!selectedType && player.inventory[selectedType] > 0}
              gameMode={gameMode}
            />
          </div>
        ))}
      </div>

      <div className={`flex flex-col items-center gap-2 sm:gap-8 w-full max-w-2xl px-2 transition-all ${isConfirming ? 'opacity-20 pointer-events-none' : ''}`}>
        <div className="flex gap-2 sm:gap-6 w-full justify-center">
          <button 
            onClick={() => { triggerHaptic('light'); setSelectedType('bomb'); }}
            disabled={player.inventory.bomb === 0 || isConfirming}
            className={`flex-1 max-w-[120px] sm:max-w-[160px] flex flex-col items-center p-2 sm:p-8 rounded-xl sm:rounded-3xl border-2 sm:border-4 transition-all active:scale-90 ${
              selectedType === 'bomb' 
              ? 'bg-zinc-800 border-yellow-400 scale-105 shadow-xl shadow-yellow-400/20' 
              : 'bg-zinc-900 border-zinc-800 opacity-60'
            } ${player.inventory.bomb === 0 ? 'pointer-events-none opacity-20' : ''}`}
          >
            <span className="text-xl sm:text-6xl mb-0.5">💣</span>
            <span className="font-game text-[9px] sm:text-2xl uppercase whitespace-nowrap">BOMB ({player.inventory.bomb})</span>
          </button>

          <button 
            onClick={() => { triggerHaptic('light'); setSelectedType('heart'); }}
            disabled={player.inventory.heart === 0 || isConfirming}
            className={`flex-1 max-w-[120px] sm:max-w-[160px] flex flex-col items-center p-2 sm:p-8 rounded-xl sm:rounded-3xl border-2 sm:border-4 transition-all active:scale-90 ${
              selectedType === 'heart' 
              ? 'bg-zinc-800 border-red-500 scale-105 shadow-xl shadow-red-500/20' 
              : 'bg-zinc-900 border-zinc-800 opacity-60'
            } ${player.inventory.heart === 0 ? 'pointer-events-none opacity-20' : ''}`}
          >
            <span className="text-xl sm:text-6xl mb-0.5">💔</span>
            <span className="font-game text-[9px] sm:text-2xl uppercase whitespace-nowrap">HEART ({player.inventory.heart})</span>
          </button>
        </div>

        {totalInventory === 0 && (
          <button 
            disabled={isConfirming}
            onClick={() => {
              triggerHaptic('heavy');
              setSelectedType(null);
              onFinishRequest();
            }}
            className="w-full py-3 sm:py-8 bg-yellow-400 text-black font-game text-lg sm:text-4xl rounded-xl sm:rounded-3xl active:scale-95 transition-all shadow-xl border-b-4 sm:border-b-8 border-yellow-600 disabled:opacity-50 mb-2 sm:mb-0"
          >
            {t.done_btn}
          </button>
        )}
      </div>

      {isConfirming && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 animate-in zoom-in duration-200 backdrop-blur-md">
          <div className="bg-zinc-900 border-4 border-yellow-400 p-6 sm:p-12 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_0_50px_rgba(251,191,36,0.3)] text-center max-w-lg w-full">
            <h3 className="text-xl sm:text-4xl font-game text-white mb-2">{t.done_placing}</h3>
            <p className="text-zinc-500 text-[10px] sm:text-xl mb-6 uppercase tracking-widest font-black">{t.ready_hide}</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { triggerHaptic('heavy'); onConfirm(); }}
                className="w-full py-4 sm:py-6 bg-yellow-400 text-black font-game text-xl sm:text-4xl rounded-xl sm:rounded-2xl active:scale-95 transition-all border-b-4 sm:border-b-8 border-yellow-600"
              >
                ✅ {t.done_btn}
              </button>
              <button 
                onClick={() => { triggerHaptic('light'); onCancelConfirm(); }}
                className="w-full py-3 bg-zinc-800 text-zinc-400 font-game text-base rounded-xl active:scale-95 transition-all"
              >
                ✏️ {t.edit_btn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetupScreen;