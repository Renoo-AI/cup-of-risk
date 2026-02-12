import React, { useState } from 'react';
import { UserProfile, Language, COUNTRIES } from '../types';
import { translations } from '../translations';
import { playSound, triggerHaptic } from '../sounds';

interface AccountSettingsProps {
  user: UserProfile;
  language: Language;
  onBack: () => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onForfeit: () => Promise<void>;
  onSignOut: () => Promise<void>;
  soundEnabled: boolean;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({
  user,
  language,
  onBack,
  onUpdateProfile,
  onForfeit,
  onSignOut,
  soundEnabled
}) => {
  const t = translations[language];
  const [displayName, setDisplayName] = useState(user.displayName);
  const [country, setCountry] = useState(user.country || '');
  const [title, setTitle] = useState(user.title || '');
  const [isSaving, setIsSaving] = useState(false);

  const TITLES = [
    { id: 'silent_gambler', label: t.silent_gambler },
    { id: 'bomb_enemy', label: t.bomb_enemy },
    { id: 'risk_taker', label: t.risk_taker },
    { id: 'legend', label: t.legend },
  ];

  const handleSave = async () => {
    playSound('click', soundEnabled);
    setIsSaving(true);
    await onUpdateProfile({ displayName, country, title });
    setIsSaving(false);
    triggerHaptic('heavy');
  };

  const stats = user.stats || {
    bombsExploded: 0,
    heartsFound: 0,
    peakPrideScore: user.prideScore,
    totalGames: 0,
    wins: 0
  };

  const winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;

  return (
    <div className="flex flex-col items-center h-full w-full bg-zinc-950 p-6 overflow-y-auto animate-in fade-in slide-in-from-bottom duration-500">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => { playSound('click', soundEnabled); onBack(); }} className="text-zinc-500 hover:text-white transition-colors">
            <i className="fa-solid fa-arrow-left text-2xl"></i>
          </button>
          <h1 className="text-2xl font-game text-white uppercase tracking-widest">{t.account_settings}</h1>
          <div className="w-8"></div>
        </div>

        {/* Profile Card */}
        <div className="bg-zinc-900 border-2 border-zinc-800 rounded-[2.5rem] p-8 mb-8 flex flex-col items-center relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400 opacity-50"></div>
           <img src={user.photoURL} alt="" className="w-24 h-24 rounded-full border-4 border-yellow-400 shadow-xl mb-4" />
           <div className="text-center">
             <div className="text-xs font-game text-yellow-400 mb-1 uppercase tracking-widest">{title ? t[title as keyof typeof t] : 'WARRIOR'}</div>
             <div className="text-3xl font-game text-white leading-none mb-2">{user.displayName}</div>
             <div className="flex items-center justify-center gap-2">
               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">{t.pride_score}</span>
               <span className="text-xl font-game text-yellow-400">{user.prideScore}</span>
             </div>
           </div>
        </div>

        {/* Identity Section */}
        <div className="mb-8">
          <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
            <i className="fa-solid fa-id-card text-yellow-400"></i> {t.identity}
          </h2>
          <div className="flex flex-col gap-4">
            <div className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-transparent text-white font-bold outline-none border-none placeholder-zinc-700"
                placeholder="DISPLAY NAME"
              />
            </div>
          </div>
        </div>

        {/* Titles Section */}
        <div className="mb-8">
          <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
            <i className="fa-solid fa-crown text-yellow-400"></i> {t.titles}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {TITLES.map((tit) => (
              <button
                key={tit.id}
                onClick={() => { playSound('click', soundEnabled); setTitle(tit.id); }}
                className={`py-3 px-4 rounded-xl border-2 transition-all font-game text-[10px] uppercase ${
                  title === tit.id ? 'bg-yellow-400 border-yellow-500 text-black' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}
              >
                {tit.label}
              </button>
            ))}
          </div>
        </div>

        {/* National Pride */}
        <div className="mb-8">
          <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
            <i className="fa-solid fa-flag text-yellow-400"></i> {t.national_pride}
          </h2>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 text-white font-bold outline-none"
          >
            <option value="">{t.select_country}</option>
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            ))}
          </select>
        </div>

        {/* Stats Grid */}
        <div className="mb-12">
          <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
            <i className="fa-solid fa-chart-simple text-yellow-400"></i> {t.battle_stats}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 border-2 border-zinc-800 rounded-3xl p-6">
              <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">{t.bombs_exploded}</div>
              <div className="text-2xl font-game text-white">{stats.bombsExploded}</div>
            </div>
            <div className="bg-zinc-900/50 border-2 border-zinc-800 rounded-3xl p-6">
              <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">{t.hearts_found}</div>
              <div className="text-2xl font-game text-white">{stats.heartsFound}</div>
            </div>
            <div className="bg-zinc-900/50 border-2 border-zinc-800 rounded-3xl p-6">
              <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">{t.peak_pride}</div>
              <div className="text-2xl font-game text-yellow-400">{stats.peakPrideScore}</div>
            </div>
            <div className="bg-zinc-900/50 border-2 border-zinc-800 rounded-3xl p-6">
              <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">{t.win_rate}</div>
              <div className="text-2xl font-game text-green-400">{winRate}%</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 mb-20">
          <button
            onClick={() => { playSound('click', soundEnabled); onSignOut(); }}
            className="w-full py-4 bg-zinc-800 text-zinc-400 font-game text-lg rounded-2xl active:bg-zinc-700 transition-all border-2 border-zinc-700 mb-4"
          >
            🚪 {t.sign_out}
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-6 bg-white text-black font-game text-2xl rounded-2xl border-b-8 border-zinc-300 active:translate-y-1 transition-all shadow-xl disabled:opacity-50"
          >
            {isSaving ? <i className="fa-solid fa-circle-notch animate-spin"></i> : t.save_btn}
          </button>

          <button
            onClick={() => { triggerHaptic('heavy'); onForfeit(); }}
            className="w-full py-4 text-red-600 font-game text-lg uppercase tracking-widest border-2 border-red-900/30 rounded-2xl active:bg-red-950/20 transition-all"
          >
            {t.forfeit}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;