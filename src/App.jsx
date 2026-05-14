import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import AdminLayout from './pages/admin/AdminLayout';
import DailyOrganization from './pages/admin/DailyOrganization';
import UserOrganization from './pages/user/UserOrganization';
import CaptainOrganization from './pages/admin/CaptainOrganization';
import DepartmentsUsers from './pages/admin/DepartmentsUsers';
import Productivity from './pages/admin/Productivity';

import UserLayout from './pages/user/UserLayout';

import Login from './pages/Login';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[#f8f9fa]">Yükleniyor...</div>;

  if (!currentUser) return <Navigate to="/login" replace />;

  if (allowedRoles && userData && !allowedRoles.includes(userData.role)) {
    // Eğer kullanıcının rolü hiç yoksa veya geçersizse
    const validRole = ['admin', 'user'].includes(userData.role) ? userData.role : 'user';
    const targetRoute = validRole === 'admin' ? '/admin' : '/user';

    // Sonsuz döngüden kaçınmak için mevcut rotayı kontrol et
    if (location.pathname.startsWith(targetRoute) && !['admin', 'user'].includes(userData.role)) {
      return (
        <div className="h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
          <p className="text-red-500 font-bold">Geçersiz yetki seviyesi.</p>
          <button onClick={() => window.location.href='/login'} className="bg-blue-600 text-white px-4 py-2 rounded">Çıkış Yap</button>
        </div>
      );
    }
    return <Navigate to={targetRoute} replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="daily" replace />} />
        <Route path="daily" element={<DailyOrganization />} />
        <Route path="captain" element={<CaptainOrganization />} />
        <Route path="departments" element={<DepartmentsUsers />} />
        <Route path="productivity" element={<Productivity />} />
      </Route>

      {/* User Routes */}
      <Route path="/user" element={<ProtectedRoute allowedRoles={['user']}><UserLayout /></ProtectedRoute>}>
        <Route index element={<UserOrganization />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
