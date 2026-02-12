import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, CupData, Player, ItemType, RevealStage, calculateResolution, Settings, Language, GameMode, Difficulty, UserProfile, getLanguageByCountry } from './types';
import SetupScreen from './components/SetupScreen';
import PlayScreen from './components/PlayScreen';
import StartScreen from './components/StartScreen';
import TransitionScreen from './components/TransitionScreen';
import GameOverScreen from './components/GameOverScreen';
import GameSplashScreen from './components/GameSplashScreen';
import HomeScreen from './components/HomeScreen';
import SettingsScreen from './components/SettingsScreen';
import HowToPlayScreen from './components/HowToPlayScreen';
import LoginModal from './components/LoginModal';
import { translations } from './translations';
import { playSound, enableMusic, setMusicMuted, triggerHaptic } from './sounds';
import { auth } from './firebase';
import { onAuthStateChanged, User } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const INITIAL_LIVES = 2;
const INITIAL_INVENTORY = { bomb: 1, heart: 2 };
const SETTINGS_KEY = 'cup_of_risk_settings_v2';
const USER_KEY = 'cup_of_risk_user_v1';

const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return JSON.parse(saved);
    
    // Initial default
    return {
      soundEnabled: true,
      musicEnabled: true,
      language: 'en' as Language,
      country: undefined
    };
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [gameState, setGameState] = useState<GameState>(GameState.HOME);
  const [gameMode, setGameMode] = useState<GameMode>('LOCAL');
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');
  const [showLogin, setShowLogin] = useState(false);
  
  const [cups, setCups] = useState<CupData[]>(
    Array.from({ length: 16 }, (_, i) => ({ 
      id: i, 
      items: [], 
      isOpened: false, 
      revealStage: RevealStage.HIDDEN 
    }))
  );
  
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: 'Player 1', lives: INITIAL_LIVES, color: 'blue', inventory: { ...INITIAL_INVENTORY } },
    { id: 2, name: 'Player 2', lives: INITIAL_LIVES, color: 'red', inventory: { ...INITIAL_INVENTORY } },
  ]);

  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [isResolving, setIsResolving] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [scoreChange, setScoreChange] = useState<number | null>(null);

  const viewerPlayerId: 1 | 2 | undefined = (gameMode === 'AI' || gameMode === 'ONLINE') ? 1 : undefined;
  const aiActionTimeout = useRef<number | null>(null);

  // Auto-detect country via IP
  useEffect(() => {
    const detectIP = async () => {
      if (settings.country) return; // Don't override user choice
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_code) {
          const detectedLang = getLanguageByCountry(data.country_code);
          setSettings(prev => ({
            ...prev,
            country: data.country_code,
            language: detectedLang
          }));
        }
      } catch (e) {
        console.debug('IP Detection failed, defaulting to EN', e);
      }
    };
    detectIP();
  }, [settings.country]);

  // Sync settings
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setMusicMuted(!settings.musicEnabled);
  }, [settings]);

  // Sync Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        const profile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || 'Warrior',
          photoURL: user.photoURL || 'https://via.placeholder.com/150',
          prideScore: currentUser?.prideScore || 100,
          accountCreatedAt: currentUser?.accountCreatedAt || Date.now()
        };
        setCurrentUser(profile);
        localStorage.setItem(USER_KEY, JSON.stringify(profile));
      }
    });
    return () => unsubscribe();
  }, [currentUser?.prideScore]);

  useEffect(() => {
    const handleFirstClick = () => {
      if (settings.musicEnabled) enableMusic();
      window.removeEventListener('click', handleFirstClick);
    };
    window.addEventListener('click', handleFirstClick);
    return () => window.removeEventListener('click', handleFirstClick);
  }, [settings.musicEnabled]);

  useEffect(() => {
    if (gameState === GameState.PLAYING && (gameMode === 'AI' || gameMode === 'ONLINE') && currentPlayerIdx === 1 && !isResolving && !winner) {
      aiActionTimeout.current = window.setTimeout(() => handleAITurn(), 1500);
    }
    return () => { if (aiActionTimeout.current) clearTimeout(aiActionTimeout.current); };
  }, [gameState, currentPlayerIdx, isResolving, winner, gameMode, cups]);

  const handleAITurn = () => {
    const unopenedCups = cups.filter(c => !c.isOpened);
    if (unopenedCups.length === 0) return;
    let targetCupId: number;
    if (difficulty === 'EASY') {
      targetCupId = unopenedCups[Math.floor(Math.random() * unopenedCups.length)].id;
    } else {
      const safeUnopenedCups = unopenedCups.filter(c => !c.items.some(i => i.owner === 2));
      const selection = safeUnopenedCups.length > 0 ? safeUnopenedCups : unopenedCups;
      targetCupId = selection[Math.floor(Math.random() * selection.length)].id;
    }
    openCup(targetCupId);
  };

  const startGame = (mode: GameMode, diff: Difficulty = 'NORMAL') => {
    playSound('click', settings.soundEnabled);
    setGameMode(mode);
    setDifficulty(diff);
    
    const p1Name = (mode === 'ONLINE' && currentUser) ? currentUser.displayName : 'Player 1';
    const p1Photo = (mode === 'ONLINE' && currentUser) ? currentUser.photoURL : undefined;
    const p1Pride = (mode === 'ONLINE' && currentUser) ? currentUser.prideScore : undefined;

    setPlayers([
      { 
        id: 1, name: p1Name, lives: INITIAL_LIVES, color: 'blue', 
        photoURL: p1Photo, prideScore: p1Pride, inventory: { ...INITIAL_INVENTORY } 
      },
      { 
        id: 2, 
        name: mode === 'AI' ? `CPU (${diff})` : (mode === 'ONLINE' ? 'Challenger' : 'Player 2'), 
        lives: INITIAL_LIVES, color: 'red', isAI: mode === 'AI', 
        inventory: { ...INITIAL_INVENTORY } 
      },
    ]);

    setGameState(GameState.START);
  };

  const handleOnlineMatch = () => {
    if (!currentUser) {
      setShowLogin(true);
    } else {
      startGame('ONLINE');
    }
  };

  const handleLoginSuccess = (user: any) => {
    setShowLogin(false);
    triggerHaptic('heavy');
    const profile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL,
      prideScore: 100,
      accountCreatedAt: Date.now()
    };
    setCurrentUser(profile);
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
  };

  const resetGame = useCallback(() => {
    playSound('click', settings.soundEnabled);
    setCups(Array.from({ length: 16 }, (_, i) => ({ id: i, items: [], isOpened: false, revealStage: RevealStage.HIDDEN })));
    setCurrentPlayerIdx(0);
    setGameState(GameState.HOME);
    setWinner(null);
    setScoreChange(null);
    setIsResolving(false);
  }, [settings.soundEnabled]);

  const placeItem = (cupId: number, type: ItemType) => {
    if ((gameState === GameState.P1_SETUP && currentPlayerIdx !== 0) || (gameState === GameState.P2_SETUP && currentPlayerIdx !== 1)) return;
    const player = players[currentPlayerIdx];
    if (player.inventory[type] <= 0) return;
    playSound('click', settings.soundEnabled);
    setPlayers(prev => prev.map((p, idx) => idx !== currentPlayerIdx ? p : { ...p, inventory: { ...p.inventory, [type]: p.inventory[type] - 1 } }));
    setCups(prev => prev.map((cup, idx) => idx !== cupId ? cup : { ...cup, items: [...cup.items, { type, owner: player.id }] }));
  };

  const confirmFinishSetup = () => {
    playSound('click', settings.soundEnabled);
    if (gameState === GameState.P1_CONFIRM) {
      if (gameMode === 'AI' || gameMode === 'ONLINE') {
        performAISetup();
        setGameState(GameState.PLAYING);
        setCurrentPlayerIdx(0);
      } else {
        setGameState(GameState.PASS_TO_P2);
      }
    } else if (gameState === GameState.P2_CONFIRM) {
      setGameState(GameState.PASS_TO_PLAY);
    }
  };

  const performAISetup = () => {
    const indices = Array.from({ length: 16 }, (_, i) => i).sort(() => Math.random() - 0.5);
    setCups(prev => prev.map((cup, idx) => {
      let newItems = [...cup.items];
      if (idx === indices[0]) newItems.push({ type: 'bomb', owner: 2 });
      if (idx === indices[1]) newItems.push({ type: 'heart', owner: 2 });
      if (idx === indices[2]) newItems.push({ type: 'heart', owner: 2 });
      return { ...cup, items: newItems };
    }));
  };

  const openCup = async (cupId: number) => {
    if (gameState !== GameState.PLAYING || isResolving) return;
    const cup = cups[cupId];
    if (cup.isOpened) return;
    setIsResolving(true);
    playSound('click', settings.soundEnabled);
    const player = players[currentPlayerIdx];
    const res = calculateResolution(cup.items, player.lives);
    setCups(prev => prev.map((c, idx) => idx === cupId ? { ...c, revealStage: RevealStage.HEARTS } : c));
    await new Promise(r => setTimeout(r, 1000));
    if (res.diedToHearts) playSound('heart_die', settings.soundEnabled);
    else if (res.hearts > 0) playSound('heart_survive', settings.soundEnabled);
    setPlayers(prev => {
      const newPlayers = [...prev];
      newPlayers[currentPlayerIdx] = { ...newPlayers[currentPlayerIdx], lives: res.livesAfterHearts };
      return newPlayers;
    });
    if (res.diedToHearts) { finishResolution(cupId, currentPlayerIdx === 0 ? 1 : 0); return; }
    if (res.bombs > 0) {
      setCups(prev => prev.map((c, idx) => idx === cupId ? { ...c, revealStage: RevealStage.BOMBS } : c));
      await new Promise(r => setTimeout(r, 1000));
      playSound('bomb', settings.soundEnabled);
      setPlayers(prev => {
        const newPlayers = [...prev];
        newPlayers[currentPlayerIdx] = { ...newPlayers[currentPlayerIdx], lives: res.finalLives };
        return newPlayers;
      });
      if (res.diedToBombs) { finishResolution(cupId, currentPlayerIdx === 0 ? 1 : 0); return; }
    }
    finishResolution(cupId, null);
  };

  const finishResolution = (cupId: number, winnerIdx: number | null) => {
    setCups(prev => prev.map((c, idx) => idx === cupId ? { ...c, isOpened: true, revealStage: RevealStage.OPENED } : c));
    if (winnerIdx !== null) {
      const gameWinner = players[winnerIdx];
      setWinner(gameWinner);

      if (gameMode === 'ONLINE' && currentUser) {
        const isWin = gameWinner.id === 1;
        const change = isWin ? 15 : -10;
        setScoreChange(change);

        const newPrideScore = Math.max(0, (currentUser.prideScore || 100) + change);
        const updatedUser = { ...currentUser, prideScore: newPrideScore };
        setCurrentUser(updatedUser);
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      }

      playSound('click', settings.soundEnabled);
      setGameState(GameState.GAME_OVER);
    } else {
      setCurrentPlayerIdx(prev => (prev === 0 ? 1 : 0));
    }
    setIsResolving(false);
  };

  const t = translations[settings.language];

  return (
    <div className={`w-full h-[100dvh] flex flex-col items-center justify-center bg-zinc-950 text-white overflow-hidden select-none`} dir={settings.language === 'ar' ? 'rtl' : 'ltr'}>
      {gameState === GameState.HOME && (
        <HomeScreen 
          onPlayLocal={() => startGame('LOCAL')} 
          onPlayAI={(diff) => startGame('AI', diff)}
          onPlayOnline={handleOnlineMatch}
          onSettings={() => setGameState(GameState.SETTINGS)}
          onHowToPlay={() => setGameState(GameState.HOW_TO_PLAY)}
          language={settings.language}
          soundEnabled={settings.soundEnabled}
          user={currentUser}
          onShowLogin={() => setShowLogin(true)}
        />
      )}

      {showLogin && (
        <LoginModal 
          language={settings.language} 
          onSuccess={handleLoginSuccess} 
          onClose={() => setShowLogin(false)} 
        />
      )}

      {gameState === GameState.SETTINGS && (
        <SettingsScreen settings={settings} onUpdateSettings={setSettings} onBack={() => setGameState(GameState.HOME)} />
      )}

      {gameState === GameState.HOW_TO_PLAY && (
        <HowToPlayScreen language={settings.language} onBack={() => setGameState(GameState.HOME)} />
      )}

      {gameState === GameState.START && <StartScreen onStart={() => setGameState(GameState.SPLASH)} language={settings.language} />}
      {gameState === GameState.SPLASH && <GameSplashScreen onComplete={() => setGameState(GameState.P1_SETUP)} language={settings.language} />}

      {(gameState === GameState.P1_SETUP || gameState === GameState.P2_SETUP || gameState === GameState.P1_CONFIRM || gameState === GameState.P2_CONFIRM) && (
        <SetupScreen 
          player={players[currentPlayerIdx]} cups={cups} onPlaceItem={placeItem} 
          onFinishRequest={() => setGameState(currentPlayerIdx === 0 ? GameState.P1_CONFIRM : GameState.P2_CONFIRM)}
          isConfirming={gameState === GameState.P1_CONFIRM || gameState === GameState.P2_CONFIRM}
          onConfirm={confirmFinishSetup}
          onCancelConfirm={() => setGameState(currentPlayerIdx === 0 ? GameState.P1_SETUP : GameState.P2_SETUP)}
          language={settings.language} gameMode={gameMode} viewerPlayerId={viewerPlayerId}
        />
      )}

      {(gameState === GameState.PASS_TO_P2 || gameState === GameState.PASS_TO_PLAY) && (
        <TransitionScreen 
          message={gameState === GameState.PASS_TO_P2 ? `${t.pass_device} PLAYER 2` : `${t.pass_device} PLAYER 1`} 
          onConfirm={() => {
            if (gameState === GameState.PASS_TO_P2) { setCurrentPlayerIdx(1); setGameState(GameState.P2_SETUP); }
            else { setCurrentPlayerIdx(0); setGameState(GameState.PLAYING); }
          }} 
          language={settings.language}
        />
      )}

      {gameState === GameState.PLAYING && (
        <PlayScreen players={players} currentPlayerIdx={currentPlayerIdx} cups={cups} onOpenCup={openCup} isResolving={isResolving} language={settings.language} gameMode={gameMode} viewerPlayerId={viewerPlayerId} />
      )}

      {gameState === GameState.GAME_OVER && winner && (
        <GameOverScreen
          winner={winner}
          onRestart={resetGame}
          language={settings.language}
          scoreChange={scoreChange}
          newScore={currentUser?.prideScore}
        />
      )}
    </div>
  );
};

export default App;