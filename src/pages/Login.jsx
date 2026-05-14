import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [lockoutTime, setLockoutTime] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(() => {
    return parseInt(localStorage.getItem('login_attempts') || '0');
  });

  // Zaten giriş yapmışsa, rolüne göre yönlendir
  useEffect(() => {
    if (currentUser && userData) {
      navigate(userData.role === 'admin' ? '/admin/daily' : '/user');
    }
  }, [currentUser, userData, navigate]);

  // Check lockout on mount and every second
  useEffect(() => {
    const checkLockout = () => {
      const storedLockout = parseInt(localStorage.getItem('lockout_until') || '0');
      const now = Date.now();
      if (storedLockout > now) {
        setLockoutTime(Math.ceil((storedLockout - now) / 1000));
      } else {
        setLockoutTime(0);
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockoutTime > 0) return;

    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      // Başarılı girişte sayaçları sıfırla
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('lockout_until');
      setFailedAttempts(0);
    } catch (err) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      localStorage.setItem('login_attempts', newAttempts.toString());

      if (newAttempts >= 7) {
        // 7. hatada 3 dk, sonrakilerde 10 dk
        const waitTime = newAttempts === 7 ? 3 * 60 * 1000 : 10 * 60 * 1000;
        const until = Date.now() + waitTime;
        localStorage.setItem('lockout_until', until.toString());
        setLockoutTime(waitTime / 1000);
        setError(`Çok fazla hatalı giriş! ${newAttempts === 7 ? '3' : '10'} dakika beklemeniz gerekiyor.`);
      } else {
        setError(`E-posta veya şifre hatalı. Kalan hak: ${7 - newAttempts}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };


  return (
    <div className="min-h-screen flex w-full bg-[#f8f9fa] font-sans">
      
      {/* Sol Taraf - Marka & Tasarım Alanı (Mobil'de gizli) */}
      <div className="hidden lg:flex flex-1 bg-[#1e2b6e] relative overflow-hidden items-center justify-center">
        {/* Dekoratif Arka Plan Efektleri */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#c2ff00] rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 text-center px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl font-black text-white tracking-tighter mb-4">
              DECATHLON
              <span className="block text-[#c2ff00] skew-x-[-5deg] italic mt-2 text-7xl">PORTAL</span>
            </h1>
            <p className="text-gray-300 text-lg font-medium max-w-md mx-auto leading-relaxed">
              Mağaza içi günlük organizasyon, takım yönetimi ve performans takibi için dijital çözümünüz.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Sağ Taraf - Login Formu */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10 bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.05)]">
        
        {/* Sadece Mobilde Görünen Logo */}
        <div className="lg:hidden text-center mb-12">
          <h1 className="text-4xl font-black text-[#1e2b6e] tracking-tighter">
            DECATHLON
          </h1>
          <h2 className="text-2xl font-black text-[#c2ff00] skew-x-[-2deg] italic bg-[#1e2b6e] inline-block px-3 py-1 shadow-lg transform -rotate-1 mt-1">
            PORTAL
          </h2>
        </div>

        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-3xl font-black text-gray-900 mb-2">Hoş Geldiniz</h2>
            <p className="text-gray-500 font-medium mb-8">Lütfen hesabınıza giriş yapın.</p>

            {error && (
              <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-xl mb-6 text-sm font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">E-Posta Adresi</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e2b6e] focus:bg-white transition-all font-medium text-gray-900 outline-none"
                    placeholder="ornek@decathlon.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Şifre</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e2b6e] focus:bg-white transition-all font-medium text-gray-900 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || lockoutTime > 0}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black uppercase tracking-widest transition-all duration-300 shadow-lg hover:shadow-xl mt-4 group ${
                  lockoutTime > 0 
                    ? 'bg-red-100 text-red-500 cursor-not-allowed shadow-none' 
                    : 'bg-[#1e2b6e] text-white hover:bg-[#152059] hover:-translate-y-0.5'
                } disabled:opacity-70`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : lockoutTime > 0 ? (
                  <>
                    <AlertCircle className="w-5 h-5" />
                    KİLİTLENDİ ({formatTime(lockoutTime)})
                  </>
                ) : (
                  <>
                    Giriş Yap
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
            
            
            <p className="text-center text-xs text-gray-400 mt-8 font-medium">
              Sisteme erişim sorunu yaşıyorsanız yöneticinizle iletişime geçin.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
