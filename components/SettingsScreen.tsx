import React from 'react';
import { Settings, Language, COUNTRIES, getLanguageByCountry } from '../types';
import { translations } from '../translations';
import { playSound, triggerHaptic } from '../sounds';

interface SettingsScreenProps {
  settings: Settings;
  onUpdateSettings: (newSettings: Settings) => void;
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, onUpdateSettings, onBack }) => {
  const t = translations[settings.language];
  const isRTL = settings.language === 'ar';

  const handleToggle = (newSettings: Settings) => {
    playSound('click', newSettings.soundEnabled);
    onUpdateSettings(newSettings);
  };

  const toggleSound = () => handleToggle({ ...settings, soundEnabled: !settings.soundEnabled });
  const toggleMusic = () => handleToggle({ ...settings, musicEnabled: !settings.musicEnabled });
  const setLanguage = (lang: Language) => handleToggle({ ...settings, language: lang });
  const setCountry = (code: string) => {
    triggerHaptic('light');
    // BROOO IT AUTOMATICALLY CHANGES LANGUAGE NOW!
    const autoLang = getLanguageByCountry(code);
    handleToggle({ ...settings, country: code, language: autoLang });
  };

  return (
    <div className={`flex flex-col items-center justify-center w-full h-full bg-zinc-950 p-6 sm:p-8 animate-in fade-in duration-300`} dir={isRTL ? 'rtl' : 'ltr'}>
      <h2 className="text-4xl sm:text-7xl font-game text-yellow-400 mb-6 sm:mb-12 drop-shadow-[0_4px_0_rgba(0,0,0,1)] text-center">
        {t.settings}
      </h2>

      <div className="w-full max-w-2xl flex flex-col gap-4 sm:gap-6 overflow-y-auto max-h-[80vh] px-2 no-scrollbar custom-scrollbar">
        {/* Country Selection - Scrollable Grid */}
        <div className="flex flex-col gap-4 bg-zinc-900/50 p-5 sm:p-6 rounded-3xl border-2 border-zinc-800 shadow-xl">
          <span className="font-game text-xl sm:text-2xl text-white">{t.country}</span>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                onClick={() => setCountry(c.code)}
                title={c.name}
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-2xl rounded-xl border-2 transition-all ${
                  settings.country === c.code ? 'border-yellow-400 bg-zinc-800 scale-110 shadow-lg' : 'border-zinc-800 bg-transparent opacity-40 hover:opacity-100'
                }`}
              >
                {c.flag}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between bg-zinc-900/50 p-6 rounded-3xl border-2 border-zinc-800 shadow-xl">
            <span className="font-game text-lg sm:text-xl text-white">{t.sound}</span>
            <button 
              onClick={toggleSound}
              className={`px-6 py-2 rounded-xl font-game text-lg transition-all ${
                settings.soundEnabled ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {settings.soundEnabled ? t.on : t.off}
            </button>
          </div>

          <div className="flex items-center justify-between bg-zinc-900/50 p-6 rounded-3xl border-2 border-zinc-800 shadow-xl">
            <span className="font-game text-lg sm:text-xl text-white">{t.music}</span>
            <button 
              onClick={toggleMusic}
              className={`px-6 py-2 rounded-xl font-game text-lg transition-all ${
                settings.musicEnabled ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {settings.musicEnabled ? t.on : t.off}
            </button>
          </div>
        </div>

        {/* Language Selection */}
        <div className="flex flex-col gap-3 bg-zinc-900/50 p-6 rounded-3xl border-2 border-zinc-800 shadow-xl">
          <span className="font-game text-xl text-white">{t.language}</span>
          <div className="flex gap-2">
            <button 
              onClick={() => setLanguage('en')}
              className={`flex-1 py-3 rounded-xl font-game text-lg border-2 transition-all ${
                settings.language === 'en' ? 'border-yellow-400 bg-zinc-800 text-yellow-400' : 'border-transparent bg-zinc-800/50 text-zinc-500'
              }`}
            >
              ENGLISH
            </button>
            <button 
              onClick={() => setLanguage('ar')}
              className={`flex-1 py-3 rounded-xl font-game text-lg border-2 transition-all ${
                settings.language === 'ar' ? 'border-yellow-400 bg-zinc-800 text-yellow-400' : 'border-transparent bg-zinc-800/50 text-zinc-500'
              }`}
            >
              العربية
            </button>
          </div>
        </div>

        {/* Back Button */}
        <button 
          onClick={() => {
            playSound('click', settings.soundEnabled);
            onBack();
          }}
          className="mt-4 w-full py-6 bg-white text-black font-game text-3xl rounded-2xl border-b-8 border-r-8 border-zinc-300 active:translate-y-1 shadow-lg"
        >
          {t.back}
        </button>
      </div>
    </div>
  );
};

export default SettingsScreen;