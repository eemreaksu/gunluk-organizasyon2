import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { db, auth } from '../../firebase/config';
import { collection, addDoc, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Users, Building2, UserPlus, Trash2, Shield, Plus, Edit2, X, Check } from 'lucide-react';

export default function DepartmentsUsers() {
  const { users, departments, loadingData } = useData();
  const [userLoading, setUserLoading] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const [newUser, setNewUser] = useState({
    adSoyad: '',
    departman: '',
    calismaTipi: 'Full-Time',
    gorev: 'Takım Arkadası'
  });

  // Yeni Kullanıcı Ekleme
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.adSoyad || !newUser.departman) {
      alert("Lütfen ad soyad ve takım alanlarını doldurun.");
      return;
    }

    setUserLoading(true);
    try {
      await addDoc(collection(db, 'users'), {
        adSoyad: newUser.adSoyad,
        role: 'user',
        departman: newUser.departman,
        calismaTipi: newUser.calismaTipi,
        gorev: newUser.gorev
      });
      alert("Personel başarıyla eklendi!");
      setNewUser({
        ...newUser,
        adSoyad: ''
      });
    } catch (error) {
      console.error("Personel eklenirken hata:", error);
      alert("Personel eklenemedi: " + error.message);
    } finally {
      setUserLoading(false);
    }
  };

  // Personel Güncelleme
  const handleUpdateUser = async () => {
    if (!editUser.adSoyad || !editUser.departman) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }

    setUserLoading(true);
    try {
      const userRef = doc(db, 'users', editUser.id);
      await updateDoc(userRef, {
        adSoyad: editUser.adSoyad,
        departman: editUser.departman,
        calismaTipi: editUser.calismaTipi,
        gorev: editUser.gorev
      });
      alert("Personel bilgileri güncellendi!");
      setEditUser(null);
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      alert("Güncellenemedi: " + error.message);
    } finally {
      setUserLoading(false);
    }
  };

  // Personel Silme
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Bu personeli silmek istediğine emin misin?")) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      alert("Personel silindi.");
    } catch (error) {
      console.error("Silme hatası:", error);
    }
  };


  const deptOrder = ['QUECHUA', 'KOŞU/FITNESS', 'SU SPORLARI', 'TAKIM SPORLARI', 'BİSİKLET', 'TRIATHLON//CRL'];
  
  const normalizeDept = (d) => {
    if (!d) return 'Diğer';
    const upper = d.toUpperCase();
    if (upper.includes('KOSU') || upper.includes('KOŞU')) return 'KOŞU/FITNESS';
    if (upper.includes('BTWIN') || upper.includes('BİSİKLET') || upper.includes('WILDLIFE')) return 'BİSİKLET';
    if (upper.includes('TRIATHLON')) return 'TRIATHLON//CRL';
    if (upper.includes('QUECHUA')) return 'QUECHUA';
    if (upper.includes('SU SPORLARI')) return 'SU SPORLARI';
    if (upper.includes('TAKIM SPORLARI')) return 'TAKIM SPORLARI';
    return 'Diğer';
  };

  const groupedUsers = users.reduce((acc, user) => {
    const dept = normalizeDept(user.departman);
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(user);
    return acc;
  }, {});

  deptOrder.forEach(dept => { if (!groupedUsers[dept]) groupedUsers[dept] = []; });

  const sortedDepts = Object.keys(groupedUsers)
    .filter(dept => deptOrder.includes(dept))
    .sort((a, b) => deptOrder.indexOf(a) - deptOrder.indexOf(b));

  const deptImages = {
    'QUECHUA': 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=800',
    'SU SPORLARI': 'https://images.unsplash.com/photo-1544158586-137b77ab4ee8?auto=format&fit=crop&q=80&w=800',
    'BİSİKLET': 'https://images.unsplash.com/photo-1471506480208-91b3a4cc78be?auto=format&fit=crop&q=80&w=800',
    'KOŞU/FITNESS': 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&q=80&w=800',
    'TAKIM SPORLARI': 'https://images.unsplash.com/photo-1519861531473-920026076284?auto=format&fit=crop&q=80&w=800',
    'TRIATHLON//CRL': 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&q=80&w=800',
    'Diğer': 'https://images.unsplash.com/photo-1517260911058-0fcfd7337c2f?auto=format&fit=crop&q=80&w=800'
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 relative">
      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#1e2b6e] p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-black italic uppercase tracking-widest">Personel Düzenle</h3>
              <button onClick={() => setEditUser(null)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Ad Soyad</label>
                <input 
                  type="text" 
                  value={editUser.adSoyad} 
                  onChange={(e) => setEditUser({...editUser, adSoyad: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 font-bold text-[#1e2b6e] outline-none focus:border-[#1e2b6e] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Takım</label>
                <select 
                  value={editUser.departman} 
                  onChange={(e) => setEditUser({...editUser, departman: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 font-bold text-[#1e2b6e] outline-none focus:border-[#1e2b6e] transition-all"
                >
                  {deptOrder.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Görev</label>
                  <select 
                    value={editUser.gorev} 
                    onChange={(e) => setEditUser({...editUser, gorev: e.target.value})}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 font-bold text-[#1e2b6e] outline-none focus:border-[#1e2b6e] transition-all"
                  >
                    <option value="Takım Arkadası">Takım Arkadası</option>
                    <option value="Kaptan">Kaptan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tip</label>
                  <select 
                    value={editUser.calismaTipi} 
                    onChange={(e) => setEditUser({...editUser, calismaTipi: e.target.value})}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 font-bold text-[#1e2b6e] outline-none focus:border-[#1e2b6e] transition-all"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  onClick={handleUpdateUser}
                  className="flex-1 bg-[#1e2b6e] text-[#c2ff00] py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" /> GÜNCELLE
                </button>
                <button 
                  onClick={() => handleDeleteUser(editUser.id)}
                  className="bg-red-50 text-red-500 px-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#1e2b6e] rounded-xl shadow-inner">
            <Users className="text-[#c2ff00] w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#1e2b6e] uppercase tracking-wide">Departman & Ekip</h1>
            <p className="text-gray-500 font-medium text-sm mt-1">Mağaza organizasyon yapısını yönetin</p>
          </div>
        </div>

      </div>

      {/* Yeni Personel Ekleme Formu */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-black text-[#1e2b6e] uppercase tracking-wider mb-6 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-500" /> Yeni Personel Ekle
        </h2>
        <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ad Soyad</label>
            <input type="text" placeholder="Ad Soyad" value={newUser.adSoyad} onChange={(e) => setNewUser({...newUser, adSoyad: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 outline-none font-medium transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Takım</label>
            <select value={newUser.departman} onChange={(e) => setNewUser({...newUser, departman: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 outline-none font-medium transition-all">
              <option value="">-- Takım Seçiniz --</option>
              {deptOrder.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Görev</label>
            <select value={newUser.gorev} onChange={(e) => setNewUser({...newUser, gorev: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-xl px-3 py-2.5 outline-none font-medium transition-all">
              <option value="Takım Arkadası">Takım Arkadası</option>
              <option value="Kaptan">Kaptan</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Çalışma Tipi</label>
            <select value={newUser.calismaTipi} onChange={(e) => setNewUser({...newUser, calismaTipi: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-xl px-3 py-2.5 outline-none font-medium transition-all">
              <option value="Part-Time">Part-Time</option>
              <option value="Full-Time">Full-Time</option>
            </select>
          </div>
          <button type="submit" disabled={userLoading} className="bg-[#1e2b6e] text-[#c2ff00] py-2.5 rounded-xl font-bold uppercase tracking-wider hover:bg-[#152059] transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> Personel Ekle
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-[#1e2b6e] uppercase tracking-wider flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" /> Sistemdeki Kullanıcılar
          </h2>
          <span className="bg-[#1e2b6e] text-[#c2ff00] px-3 py-1 rounded-full text-xs font-bold shadow-sm">Toplam: {users.length}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedDepts.map(dept => (
            <div key={dept} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="relative h-24 flex items-end p-4 flex-shrink-0" style={{ backgroundImage: `url('${deptImages[dept]}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="relative z-10 flex justify-between items-center w-full">
                  <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 drop-shadow-md">
                    <Users className="w-4 h-4 text-[#c2ff00]" /> <span className="truncate max-w-[140px]">{dept}</span>
                  </h3>
                  <span className="bg-[#1e2b6e]/90 text-[#c2ff00] text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border border-white/10">{groupedUsers[dept].length} Kişi</span>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 max-h-[350px] custom-scrollbar">
                {groupedUsers[dept].length === 0 ? (
                  <div className="py-6 text-center text-gray-400 italic text-xs">Takımda personel yok.</div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <tbody className="divide-y divide-gray-50">
                      {groupedUsers[dept].map(user => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="p-3 font-bold text-gray-800 flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] flex-shrink-0 shadow-sm ${user.role === 'admin' ? 'bg-[#1e2b6e] text-[#c2ff00]' : 'bg-gray-100 text-gray-400'}`}>
                              {user.adSoyad?.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 leading-tight">
                                <span className="truncate max-w-[100px] block" title={user.adSoyad}>{user.adSoyad}</span>
                                {user.role === 'admin' && <Shield className="w-3 h-3 text-blue-500" />}
                              </div>
                              <span className="text-[10px] text-gray-400 font-medium block mt-0.5">{user.calismaTipi === 'Full-Time' ? 'Full-Time' : 'Part-Time'}</span>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${user.gorev === 'Kaptan' ? 'bg-[#c2ff00] text-[#1e2b6e]' : 'bg-gray-100 text-gray-500'}`}>
                                {user.gorev === 'Kaptan' ? 'KAPTAN' : 'T. ARK.'}
                              </span>
                              <button 
                                onClick={() => setEditUser(user)}
                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-[#1e2b6e] hover:text-[#c2ff00] rounded-lg transition-all text-gray-400"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
