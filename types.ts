export enum GameState {
  HOME = 'HOME',
  SETTINGS = 'SETTINGS',
  HOW_TO_PLAY = 'HOW_TO_PLAY',
  START = 'START',
  SPLASH = 'SPLASH',
  P1_SETUP = 'P1_SETUP',
  P1_CONFIRM = 'P1_CONFIRM',
  PASS_TO_P2 = 'PASS_TO_P2',
  P2_SETUP = 'P2_SETUP',
  P2_CONFIRM = 'P2_CONFIRM',
  PASS_TO_PLAY = 'PASS_TO_PLAY',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  ACCOUNT_SETTINGS = 'ACCOUNT_SETTINGS'
}

export enum RevealStage {
  HIDDEN = 'HIDDEN',
  HEARTS = 'HEARTS',
  BOMBS = 'BOMBS',
  OPENED = 'OPENED'
}

export type ItemType = 'bomb' | 'heart';
export type Language = 'en' | 'ar';
export type GameMode = 'LOCAL' | 'AI' | 'ONLINE';
export type Difficulty = 'EASY' | 'NORMAL' | 'HARD';

export interface UserStats {
  bombsExploded: number;
  heartsFound: number;
  peakPrideScore: number;
  totalGames: number;
  wins: number;
}

export const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
];

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  country?: string;
  title?: string;
  prideScore: number;
  accountCreatedAt: number;
  stats?: UserStats;
}

export interface Settings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  language: Language;
  country?: string;
}

export interface GameItem {
  type: ItemType;
  owner: 1 | 2;
}

export interface CupData {
  id: number;
  items: GameItem[];
  isOpened: boolean;
  revealStage: RevealStage;
}

export interface Player {
  id: 1 | 2;
  lives: number;
  name: string;
  color: string;
  isAI?: boolean;
  photoURL?: string;
  prideScore?: number;
  inventory: {
    bomb: number;
    heart: number;
  };
}

export interface ResolutionResult {
  hearts: number;
  bombs: number;
  livesAfterHearts: number;
  finalLives: number;
  diedToHearts: boolean;
  diedToBombs: boolean;
}

export const calculateResolution = (items: GameItem[], currentLives: number): ResolutionResult => {
  const hearts = items.filter(i => i.type === 'heart').length;
  const bombs = items.filter(i => i.type === 'bomb').length;
  
  const livesAfterHearts = Math.max(0, currentLives - (hearts * 1));
  let finalLives = livesAfterHearts;
  
  if (livesAfterHearts > 0) {
    finalLives = Math.max(0, livesAfterHearts - (bombs * 2));
  }
  
  return {
    hearts,
    bombs,
    livesAfterHearts,
    finalLives,
    diedToHearts: currentLives > 0 && livesAfterHearts === 0,
    diedToBombs: livesAfterHearts > 0 && finalLives === 0
  };
};

export const COUNTRIES = [
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', lang: 'ar' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', lang: 'ar' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', lang: 'ar' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', lang: 'ar' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', lang: 'ar' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', lang: 'ar' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿', lang: 'ar' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶', lang: 'ar' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴', lang: 'ar' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧', lang: 'ar' },
  { code: 'LY', name: 'Libya', flag: '🇱🇾', lang: 'ar' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', lang: 'ar' },
  { code: 'PS', name: 'Palestine', flag: '🇵🇸', lang: 'ar' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳', lang: 'ar' },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪', lang: 'ar' },
  { code: 'US', name: 'USA', flag: '🇺🇸', lang: 'en' },
  { code: 'GB', name: 'UK', flag: '🇬🇧', lang: 'en' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', lang: 'en' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', lang: 'en' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', lang: 'en' },
  { code: 'FR', name: 'France', flag: '🇫🇷', lang: 'en' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', lang: 'en' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', lang: 'en' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', lang: 'en' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', lang: 'en' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', lang: 'en' },
  { code: 'CN', name: 'China', flag: '🇨🇳', lang: 'en' },
  { code: 'IN', name: 'India', flag: '🇮🇳', lang: 'en' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', lang: 'en' },
  { code: 'KR', name: 'S. Korea', flag: '🇰🇷', lang: 'en' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', lang: 'en' },
];

export const getLanguageByCountry = (countryCode: string): Language => {
  const country = COUNTRIES.find(c => c.code === countryCode);
  return (country?.lang as Language) || 'en';
};
