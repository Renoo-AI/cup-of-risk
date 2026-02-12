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
import AccountSettings from './components/AccountSettings';
import LoginModal from './components/LoginModal';
import MatchmakingScreen from './components/MatchmakingScreen';
import { translations } from './translations';
import { playSound, enableMusic, setMusicMuted, triggerHaptic } from './sounds';
import { auth, syncUserProfile, updateScore, updateUserProfile, forfeitAccount, findOrCreateRoom, updateRoom, listenToRoom, leaveRoom, arrayUnion, signOutUser } from './firebase';
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
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    // Initialize stats if missing
    if (!parsed.stats) {
      parsed.stats = { bombsExploded: 0, heartsFound: 0, peakPrideScore: parsed.prideScore, totalGames: 0, wins: 0 };
    }
    return parsed;
  });

  const [gameState, setGameState] = useState<GameState>(GameState.HOME);
  const [gameMode, setGameMode] = useState<GameMode>('LOCAL');
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');
  const [showLogin, setShowLogin] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [myPlayerIdx, setMyPlayerIdx] = useState<number | null>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
  const hasUpdatedScore = useRef(false);

  const viewerPlayerId: 1 | 2 | undefined = gameMode === 'ONLINE'
    ? (myPlayerIdx !== null ? (myPlayerIdx + 1) as 1 | 2 : undefined)
    : (gameMode === 'AI' ? 1 : undefined);

  const aiActionTimeout = useRef<number | null>(null);
  const roomUnsubscribe = useRef<(() => void) | null>(null);

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
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        try {
          const cloudData = await syncUserProfile(user, currentUser?.prideScore);
          const profile: UserProfile = {
            uid: user.uid,
            displayName: cloudData.displayName || user.displayName || 'Warrior',
            photoURL: cloudData.photoURL || user.photoURL || 'https://via.placeholder.com/150',
            prideScore: cloudData.prideScore || 100,
            country: cloudData.country || '',
            title: cloudData.title || '',
            stats: cloudData.stats || { bombsExploded: 0, heartsFound: 0, peakPrideScore: cloudData.prideScore || 100, totalGames: 0, wins: 0 },
            accountCreatedAt: cloudData.createdAt?.toMillis?.() || Date.now()
          };
          setCurrentUser(profile);
          localStorage.setItem(USER_KEY, JSON.stringify(profile));
        } catch (e) {
          console.error('Firestore sync failed', e);
          // Fallback to local if sync fails
          const profile: UserProfile = {
            uid: user.uid,
            displayName: user.displayName || 'Warrior',
            photoURL: user.photoURL || 'https://via.placeholder.com/150',
            prideScore: currentUser?.prideScore || 100,
            accountCreatedAt: currentUser?.accountCreatedAt || Date.now()
          };
          setCurrentUser(profile);
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem(USER_KEY);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleFirstClick = () => {
      if (settings.musicEnabled) enableMusic();
      window.removeEventListener('click', handleFirstClick);
    };
    window.addEventListener('click', handleFirstClick);
    return () => window.removeEventListener('click', handleFirstClick);
  }, [settings.musicEnabled]);

  useEffect(() => {
    if (gameState === GameState.PLAYING && gameMode === 'AI' && currentPlayerIdx === 1 && !isResolving && !winner) {
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

  const handleOnlineMatch = async () => {
    if (!currentUser) {
      setShowLogin(true);
      return;
    }

    setIsSearching(true);
    playSound('click', settings.soundEnabled);

    try {
      const { roomId, playerIdx } = await findOrCreateRoom(currentUser);
      setRoomId(roomId);
      setMyPlayerIdx(playerIdx);

      roomUnsubscribe.current = listenToRoom(roomId, (data) => {
        setRoomData(data);
      });
    } catch (e: any) {
      console.error("Matchmaking failed", e);
      setError(e.message || "Matchmaking failed. Please try again.");
      setTimeout(() => setError(null), 5000);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (gameMode === 'ONLINE' && roomData === null && roomId && !isSearching) {
      // Room was deleted or opponent left
      setError("Opponent left the match");
      setTimeout(() => setError(null), 3000);
      resetGame();
      return;
    }

    if ((gameMode === 'ONLINE' || isSearching) && roomData) {
      // Sync State from Room
      if (roomData.status === 'playing' && isSearching) {
        setIsSearching(false);
        setGameMode('ONLINE');

        const p1 = roomData.players[0];
        const p2 = roomData.players[1];

        setPlayers([
          {
            id: 1, name: p1.displayName, lives: INITIAL_LIVES, color: 'blue',
            photoURL: p1.photoURL, prideScore: p1.prideScore, inventory: { ...INITIAL_INVENTORY }
          },
          {
            id: 2, name: p2.displayName, lives: INITIAL_LIVES, color: 'red',
            photoURL: p2.photoURL, prideScore: p2.prideScore, inventory: { ...INITIAL_INVENTORY }
          },
        ]);
        setGameState(GameState.START);
      }

      // Sync Setup Readiness
      if (gameState === GameState.P1_SETUP || gameState === GameState.P2_SETUP || gameState === GameState.P1_CONFIRM || gameState === GameState.P2_CONFIRM) {
        if (roomData.readyPlayers.length === 2 && gameState !== GameState.PLAYING) {
          setGameState(GameState.PLAYING);
          setCurrentPlayerIdx(roomData.currentPlayerIdx);
        }
      }

      // Sync Gameplay
      if (gameState === GameState.PLAYING || (gameState === GameState.GAME_OVER && gameMode === 'ONLINE')) {
        // Merge traps from both players
        const mergedCups = cups.map(cup => {
          const p1Items = roomData.p1Traps?.[cup.id] || [];
          const p2Items = roomData.p2Traps?.[cup.id] || [];
          const isOpened = roomData.openedCups?.includes(cup.id) || false;

          return {
            ...cup,
            items: [...p1Items, ...p2Items],
            isOpened,
            revealStage: isOpened ? RevealStage.OPENED : cup.revealStage
          };
        });
        setCups(mergedCups);
      } else if (gameMode === 'ONLINE' && myPlayerIdx !== null) {
        // During setup, only show local player's traps to prevent peeking
        const localTrapsKey = `p${myPlayerIdx + 1}Traps`;
        const myTraps = roomData[localTrapsKey] || {};
        const mergedCups = cups.map(cup => ({
          ...cup,
          items: myTraps[cup.id] || [],
          isOpened: false,
          revealStage: RevealStage.HIDDEN
        }));
        setCups(mergedCups);
      }

      if (roomData.currentPlayerIdx !== undefined) setCurrentPlayerIdx(roomData.currentPlayerIdx);

      // Check for winner
        if (roomData.winner && !winner && !hasUpdatedScore.current) {
          const gameWinner = roomData.winner;
          setWinner(gameWinner);
          setGameState(GameState.GAME_OVER);

          if (currentUser && myPlayerIdx !== null) {
            hasUpdatedScore.current = true;
            const isWin = gameWinner.id === (myPlayerIdx + 1);
            const change = isWin ? 15 : -10;
            setScoreChange(change);

            const newPrideScore = Math.max(0, (currentUser.prideScore || 100) + change);
            const updatedStats = {
              ...currentUser.stats!,
              totalGames: (currentUser.stats?.totalGames || 0) + 1,
              wins: (currentUser.stats?.wins || 0) + (isWin ? 1 : 0),
              peakPrideScore: Math.max(currentUser.stats?.peakPrideScore || 0, newPrideScore)
            };

            const updatedUser = { ...currentUser, prideScore: newPrideScore, stats: updatedStats };
            setCurrentUser(updatedUser);
            localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));

            updateUserProfile(currentUser.uid, { prideScore: newPrideScore, stats: updatedStats })
              .catch(e => console.error('Failed to update cloud profile', e));
          }
        }
      }
  }, [roomData, gameMode, isSearching, gameState, winner, currentUser, myPlayerIdx]);

  const cancelMatchmaking = () => {
    if (roomId) leaveRoom(roomId);
    setIsSearching(false);
    setRoomId(null);
    setMyPlayerIdx(null);
    if (roomUnsubscribe.current) roomUnsubscribe.current();
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
    if (gameMode === 'ONLINE' && roomId) leaveRoom(roomId);
    if (roomUnsubscribe.current) roomUnsubscribe.current();

    setCups(Array.from({ length: 16 }, (_, i) => ({ id: i, items: [], isOpened: false, revealStage: RevealStage.HIDDEN })));
    setCurrentPlayerIdx(0);
    setGameState(GameState.HOME);
    setGameMode('LOCAL');
    setWinner(null);
    setScoreChange(null);
    setIsResolving(false);
    setRoomId(null);
    setMyPlayerIdx(null);
    setRoomData(null);
    hasUpdatedScore.current = false;
  }, [settings.soundEnabled, gameMode, roomId]);

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      await updateUserProfile(currentUser.uid, updates);
      const updated = { ...currentUser, ...updates };
      setCurrentUser(updated);
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update profile', e);
    }
  };

  const handleForfeit = async () => {
    if (!currentUser) return;
    try {
      await forfeitAccount(currentUser.uid);
      const updated = { ...currentUser, prideScore: 0, title: '', country: '' };
      setCurrentUser(updated);
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      setGameState(GameState.HOME);
    } catch (e) {
      console.error('Failed to forfeit', e);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setGameState(GameState.HOME);
    } catch (e) {
      console.error('Failed to sign out', e);
    }
  };

  const placeItem = (cupId: number, type: ItemType) => {
    if (gameMode === 'ONLINE') {
      if (myPlayerIdx === null) return;
      const player = players[myPlayerIdx];
      if (player.inventory[type] <= 0) return;

      playSound('click', settings.soundEnabled);
      const newCups = cups.map((cup, idx) => idx !== cupId ? cup : { ...cup, items: [...cup.items, { type, owner: player.id as 1|2 }] });
      const newInventory = { ...player.inventory, [type]: player.inventory[type] - 1 };

      setPlayers(prev => prev.map((p, idx) => idx !== myPlayerIdx ? p : { ...p, inventory: newInventory }));
      setCups(newCups);

      if (roomId) {
        updateRoom(roomId, {
          [`p${myPlayerIdx + 1}Traps.${cupId}`]: arrayUnion({ type, owner: player.id })
        });
      }
      return;
    }

    if ((gameState === GameState.P1_SETUP && currentPlayerIdx !== 0) || (gameState === GameState.P2_SETUP && currentPlayerIdx !== 1)) return;
    const player = players[currentPlayerIdx];
    if (player.inventory[type] <= 0) return;
    playSound('click', settings.soundEnabled);
    setPlayers(prev => prev.map((p, idx) => idx !== currentPlayerIdx ? p : { ...p, inventory: { ...p.inventory, [type]: p.inventory[type] - 1 } }));
    setCups(prev => prev.map((cup, idx) => idx !== cupId ? cup : { ...cup, items: [...cup.items, { type, owner: player.id }] }));
  };

  const confirmFinishSetup = () => {
    playSound('click', settings.soundEnabled);

    if (gameMode === 'ONLINE') {
      if (roomId && myPlayerIdx !== null) {
        updateRoom(roomId, { readyPlayers: arrayUnion(myPlayerIdx) });
      }
      return;
    }

    if (gameState === GameState.P1_CONFIRM) {
      if (gameMode === 'AI') {
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
    if (gameMode === 'ONLINE' && currentPlayerIdx !== myPlayerIdx) return;

    const cup = cups[cupId];
    if (cup.isOpened) return;
    setIsResolving(true);
    playSound('click', settings.soundEnabled);
    const player = players[currentPlayerIdx];
    const res = calculateResolution(cup.items, player.lives);
    setCups(prev => prev.map((c, idx) => idx === cupId ? { ...c, revealStage: RevealStage.HEARTS } : c));
    await new Promise(r => setTimeout(r, 1000));
    if (res.diedToHearts) playSound('heart_die', settings.soundEnabled);
    else if (res.hearts > 0) {
      playSound('heart_survive', settings.soundEnabled);
      if (gameMode === 'ONLINE' && currentUser && currentPlayerIdx === 0) {
        handleUpdateProfile({
          stats: {
            ...currentUser.stats!,
            heartsFound: currentUser.stats!.heartsFound + res.hearts
          }
        });
      }
    }
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
      if (gameMode === 'ONLINE' && currentUser && currentPlayerIdx === 0) {
        handleUpdateProfile({
          stats: {
            ...currentUser.stats!,
            bombsExploded: currentUser.stats!.bombsExploded + res.bombs
          }
        });
      }
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
    const nextCups = cups.map((c, idx) => idx === cupId ? { ...c, isOpened: true, revealStage: RevealStage.OPENED } : c);
    const nextPlayerIdx = (currentPlayerIdx === 0 ? 1 : 0);

    if (gameMode === 'ONLINE' && roomId && myPlayerIdx === currentPlayerIdx) {
      if (winnerIdx !== null) {
        const gameWinner = players[winnerIdx];
        updateRoom(roomId, {
          openedCups: arrayUnion(cupId),
          winner: gameWinner,
          status: "finished"
        });
      } else {
        updateRoom(roomId, {
          openedCups: arrayUnion(cupId),
          currentPlayerIdx: nextPlayerIdx
        });
      }
    }

    setCups(nextCups);
    if (winnerIdx !== null) {
      const gameWinner = players[winnerIdx];
      setWinner(gameWinner);
      playSound('click', settings.soundEnabled);
      setGameState(GameState.GAME_OVER);

      // Local score update for non-online modes
      if (gameMode !== 'ONLINE') {
        // No score for local/AI usually, or handle differently
      }
    } else {
      setCurrentPlayerIdx(nextPlayerIdx);
    }
    setIsResolving(false);
  };

  const t = translations[settings.language];

  return (
    <div className={`w-full h-[100dvh] flex flex-col items-center justify-center bg-zinc-950 text-white overflow-hidden select-none`} dir={settings.language === 'ar' ? 'rtl' : 'ltr'}>
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[2000] px-6 py-3 bg-red-600 text-white font-game text-sm rounded-full shadow-2xl animate-in fade-in slide-in-from-top duration-300">
          ⚠️ {error}
        </div>
      )}

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
          onAccountSettings={() => setGameState(GameState.ACCOUNT_SETTINGS)}
        />
      )}

      {showLogin && (
        <LoginModal 
          language={settings.language} 
          onSuccess={handleLoginSuccess} 
          onClose={() => setShowLogin(false)} 
        />
      )}

      {isSearching && (
        <MatchmakingScreen
          language={settings.language}
          onCancel={cancelMatchmaking}
          status={roomData?.status === 'playing' ? 'found' : 'searching'}
        />
      )}

      {gameState === GameState.SETTINGS && (
        <SettingsScreen settings={settings} onUpdateSettings={setSettings} onBack={() => setGameState(GameState.HOME)} />
      )}

      {gameState === GameState.HOW_TO_PLAY && (
        <HowToPlayScreen language={settings.language} onBack={() => setGameState(GameState.HOME)} />
      )}

      {gameState === GameState.ACCOUNT_SETTINGS && currentUser && (
        <AccountSettings
          user={currentUser}
          language={settings.language}
          onBack={() => setGameState(GameState.HOME)}
          onUpdateProfile={handleUpdateProfile}
          onForfeit={handleForfeit}
          onSignOut={handleSignOut}
          soundEnabled={settings.soundEnabled}
        />
      )}

      {gameState === GameState.START && <StartScreen onStart={() => setGameState(GameState.SPLASH)} language={settings.language} />}
      {gameState === GameState.SPLASH && <GameSplashScreen onComplete={() => {
        if (gameMode === 'ONLINE') {
          setGameState(myPlayerIdx === 0 ? GameState.P1_SETUP : GameState.P2_SETUP);
        } else {
          setGameState(GameState.P1_SETUP);
        }
      }} language={settings.language} />}

      {(gameState === GameState.P1_SETUP || gameState === GameState.P2_SETUP || gameState === GameState.P1_CONFIRM || gameState === GameState.P2_CONFIRM) && (
        <SetupScreen 
          player={players[gameMode === 'ONLINE' ? myPlayerIdx || 0 : currentPlayerIdx]} cups={cups} onPlaceItem={placeItem}
          onFinishRequest={() => {
            if (gameMode === 'ONLINE') {
              setGameState(myPlayerIdx === 0 ? GameState.P1_CONFIRM : GameState.P2_CONFIRM);
            } else {
              setGameState(currentPlayerIdx === 0 ? GameState.P1_CONFIRM : GameState.P2_CONFIRM);
            }
          }}
          isConfirming={gameState === GameState.P1_CONFIRM || gameState === GameState.P2_CONFIRM || (gameMode === 'ONLINE' && myPlayerIdx !== null && (roomData?.readyPlayers || []).includes(myPlayerIdx))}
          onConfirm={confirmFinishSetup}
          onCancelConfirm={() => {
            if (gameMode === 'ONLINE') {
              setGameState(myPlayerIdx === 0 ? GameState.P1_SETUP : GameState.P2_SETUP);
            } else {
              setGameState(currentPlayerIdx === 0 ? GameState.P1_SETUP : GameState.P2_SETUP);
            }
          }}
          language={settings.language} gameMode={gameMode} viewerPlayerId={viewerPlayerId}
          onlineOpponentReady={gameMode === 'ONLINE' ? (roomData?.readyPlayers || []).includes(myPlayerIdx === 0 ? 1 : 0) : undefined}
          amIReady={gameMode === 'ONLINE' ? (roomData?.readyPlayers || []).includes(myPlayerIdx) : undefined}
        />
      )}

      {(gameState === GameState.PASS_TO_P2 || gameState === GameState.PASS_TO_PLAY) && (
        <TransitionScreen 
          message={gameState === GameState.PASS_TO_P2 ? `${t.pass_device} PLAYER 2` : `${t.pass_device} PLAYER 1`} 
          onConfirm={() => {
            if (gameState === GameState.PASS_TO_P2) {
              setCurrentPlayerIdx(1);
              setGameState(GameState.P2_SETUP);
            }
            else {
              setCurrentPlayerIdx(0);
              setGameState(GameState.PLAYING);
            }
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