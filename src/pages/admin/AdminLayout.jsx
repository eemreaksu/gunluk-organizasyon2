import React from 'react';
import { Outlet, useLocation, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Star, Users, TrendingUp, LogOut } from 'lucide-react';

export default function AdminLayout() {
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

  const navItems = [
    { path: '/admin/daily', icon: Calendar, label: 'Günün Organizasyonu' },
    { path: '/admin/captain', icon: Star, label: 'Kaptanlık' },
    { path: '/admin/departments', icon: Users, label: 'Departman & Ekip' },
    { path: '/admin/productivity', icon: TrendingUp, label: 'Verimlilik' },
  ];

  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden font-sans">
      {/* Premium Sidebar */}
      <aside className="w-72 bg-[#1e2b6e] text-white flex flex-col shadow-2xl relative z-20">
        {/* Logo Alanı */}
        <div className="p-6">
          <h1 className="text-3xl font-black tracking-tight text-[#c2ff00] skew-x-[-2deg] italic">
            DECATHLON
          </h1>
          <p className="text-sm text-gray-300 font-semibold tracking-wider mt-1 opacity-80 uppercase">
            Portal • Admin
          </p>
        </div>

        {/* Navigasyon Menu */}
        <nav className="flex-1 px-4 mt-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                  isActive
                    ? 'bg-white/10 text-[#c2ff00] shadow-lg shadow-black/10 backdrop-blur-sm'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Kullanıcı Bilgisi ve Çıkış */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between px-2 mb-4">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white truncate max-w-[180px]">
                {userData?.adSoyad || 'Admin'}
              </span>
              <span className="text-xs text-[#c2ff00] capitalize font-medium">
                {userData?.role || 'Yönetici'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-colors duration-300 font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 relative z-10 overflow-y-auto">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
