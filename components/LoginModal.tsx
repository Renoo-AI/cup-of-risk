import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../translations';
import { triggerHaptic } from '../sounds';
import { signInWithGoogle } from '../firebase';

interface LoginModalProps {
  language: Language;
  onSuccess: (user: any) => void;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ language, onSuccess, onClose }) => {
  const t = translations[language];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    triggerHaptic('medium');
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        onSuccess(user);
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError(language === 'ar' 
          ? "النطاق غير مصرح به. يرجى إضافة هذا النطاق إلى قائمة النطاقات المصرح بها في Firebase Console."
          : "Unauthorized Domain. Please add this domain to the 'Authorized Domains' list in your Firebase Console.");
      } else {
        setError(language === 'ar' ? "فشل تسجيل الدخول. يرجى المحاولة لاحقاً." : "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-zinc-900 border-2 border-yellow-400/30 p-8 sm:p-12 rounded-[2.5rem] shadow-[0_0_100px_rgba(251,191,36,0.15)] text-center flex flex-col items-center">
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-600 hover:text-white transition-colors">
          <i className="fa-solid fa-xmark text-2xl"></i>
        </button>

        <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(251,191,36,0.5)] animate-pulse">
          <i className="fa-solid fa-shield-halved text-black text-5xl"></i>
        </div>

        <h2 className="text-3xl sm:text-4xl font-game text-white mb-4 leading-tight">
          {t.auth_title}
        </h2>

        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-6 leading-relaxed max-w-[280px]">
          {t.auth_desc}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs font-bold leading-tight">
            <i className="fa-solid fa-circle-exclamation mr-2"></i>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-5 bg-white text-black font-game text-xl rounded-2xl flex items-center justify-center gap-4 hover:bg-yellow-400 active:scale-95 transition-all shadow-xl disabled:opacity-50"
        >
          {loading ? (
            <i className="fa-solid fa-circle-notch animate-spin"></i>
          ) : (
            <>
              <i className="fa-brands fa-google text-2xl"></i>
              {t.auth_google}
            </>
          )}
        </button>

        <p className="mt-8 text-yellow-400/50 text-[10px] font-black uppercase tracking-[0.2em] italic">
          {t.pride_warning}
        </p>
      </div>
    </div>
  );
};

export default LoginModal;