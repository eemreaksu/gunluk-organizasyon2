import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function UserLayout() {
  const location = useLocation();
  const { logout, userData } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Çıkış yapılırken hata:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans flex flex-col">
      {/* Premium Navbar */}
      <header className="bg-[#1e2b6e] text-white shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            <div className="flex items-center gap-8">
              {/* Logo */}
              <div 
                className="flex-shrink-0 flex flex-col justify-center cursor-pointer"
                onClick={() => navigate('/user')}
              >
                <h1 className="text-3xl font-black tracking-tight text-[#c2ff00] skew-x-[-2deg] italic">
                  DECATHLON
                </h1>
                <p className="text-[10px] text-gray-300 font-bold tracking-[0.2em] opacity-90 uppercase mt-0.5">
                  Günlük Organizasyon
                </p>
              </div>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/5 shadow-inner">
                  <UserIcon className="w-5 h-5 text-[#c2ff00]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">{userData?.adSoyad || 'Kullanıcı'}</span>
                  <span className="text-xs text-[#c2ff00] capitalize font-medium">
                    {userData?.departman || 'Ekip Üyesi'}
                  </span>
                </div>
              </div>

              <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/20 rounded-xl transition-all duration-300 text-sm font-bold text-gray-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Çıkış Yap</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 relative z-10 overflow-y-auto">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="h-full"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
