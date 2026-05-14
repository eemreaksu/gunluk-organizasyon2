import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { db } from '../../firebase/config';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { Star, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { toJpeg } from 'html-to-image';

export default function CaptainOrganization() {
  const { users, loadingData } = useData();
  const [schedules, setSchedules] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCapturing, setIsCapturing] = useState(false);
  const printableRef = useRef(null);

  const captains = users.filter(u => u.gorev?.toLowerCase() === 'kaptan');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'captainSchedules'), (snapshot) => {
      const data = {};
      snapshot.docs.forEach(doc => {
        data[doc.id] = doc.data();
      });
      setSchedules(data);
    });
    return () => unsubscribe();
  }, []);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(year, month, i + 1);
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
      return {
        date: d,
        dateString: dateString,
        dayName: d.toLocaleDateString('tr-TR', { weekday: 'long' })
      };
    });
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const days = getDaysInMonth(currentMonth);
  const todayStr = new Date().toISOString().split('T')[0];

  const handleDownloadImage = async () => {
    if (!printableRef.current) return;
    setIsCapturing(true);
    
    setTimeout(async () => {
      try {
        const dataUrl = await toJpeg(printableRef.current, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: '#1e2b6e',
        });
        
        const link = document.createElement('a');
        const monthLabel = currentMonth.toLocaleDateString('tr-TR', { month: 'long' });
        link.download = `Kaptan_Organizasyon_${monthLabel}_${currentMonth.getFullYear()}.jpg`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Download Error:', err);
        alert('Resim oluşturulamadı! Lütfen tekrar deneyin.');
      } finally {
        setIsCapturing(false);
      }
    }, 100);
  };

  const handleSelectChange = async (dateString, role, userId) => {
    try {
      const dayData = schedules[dateString] || {};
      const updatedData = { ...dayData, [role]: userId };
      await setDoc(doc(db, 'captainSchedules', dateString), updatedData, { merge: true });
    } catch (error) {
      console.error("Görev güncellenirken hata:", error);
      alert("Görev güncellenemedi!");
    }
  };

  const roles = [
    { key: 'acilis_kaptani', label: 'Açılış Kaptanı' },
    { key: 'acilis_apranti', label: 'Açılış Apranti' },
    { key: 'kapanis_kaptani', label: 'Kapanış Kaptanı' },
    { key: 'kapanis_apranti', label: 'Kapanış Apranti' }
  ];

  if (loadingData) return <div className="p-12 text-center text-[#1e2b6e] font-black italic">YÜKLENİYOR...</div>;

  const monthName = currentMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Actions Bar */}
        {!isCapturing && (
          <div className="flex justify-end no-print">
            <button 
              onClick={handleDownloadImage}
              className="bg-[#1e2b6e] text-[#c2ff00] px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-xl"
            >
              <Download className="w-5 h-5" /> JPG OLARAK İNDİR
            </button>
          </div>
        )}

        {/* Unified Dark Component */}
        <div 
          ref={printableRef}
          className={`bg-[#1e2b6e] text-white p-6 md:p-10 space-y-8 shadow-2xl relative overflow-hidden ${isCapturing ? 'rounded-none' : 'rounded-3xl'}`}
        >
          {/* Background Glow */}
          {!isCapturing && (
            <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-[#c2ff00] rounded-full blur-[150px] opacity-10 pointer-events-none"></div>
          )}

          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                <Star className="text-[#c2ff00] w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
                  AYLIK KAPTANLIK ORGANİZASYONU
                </h1>
                <p className="text-blue-300 font-bold text-sm mt-2 tracking-wide uppercase opacity-70">
                  {monthName} DÖNEMİ GÖREVLENDİRMELERİ
                </p>
              </div>
            </div>

            {/* Month Navigation */}
            {!isCapturing && (
              <div className="flex items-center gap-2 bg-white/10 p-2 rounded-2xl border border-white/10 backdrop-blur-md no-print">
                <button 
                  onClick={prevMonth}
                  className="p-3 hover:bg-white/10 rounded-xl transition-all text-[#c2ff00]"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="px-6 font-black text-white uppercase tracking-widest text-sm border-x border-white/10">
                  {monthName}
                </span>
                <button 
                  onClick={nextMonth}
                  className="p-3 hover:bg-white/10 rounded-xl transition-all text-[#c2ff00]"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>

          {/* Table Section */}
          <div className={`bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm shadow-2xl relative z-10 ${isCapturing ? 'overflow-visible' : 'overflow-hidden'}`}>
            <div className={isCapturing ? '' : 'overflow-x-auto'}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/20 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                    <th className="p-5">TARİH / GÜN</th>
                    {roles.map(r => (
                      <th key={r.key} className="p-5">{r.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {days.map(({ date, dateString, dayName }) => {
                    const dayData = schedules[dateString] || {};
                    const selectedUserIds = Object.values(dayData).filter(Boolean);
                    const isToday = dateString === todayStr;

                    return (
                      <tr 
                        key={dateString} 
                        className={`transition-colors ${isToday ? 'bg-white/10' : 'hover:bg-white/5'}`}
                      >
                        <td className="p-5 whitespace-nowrap">
                          <div className={`text-lg font-black italic skew-x-[-10deg] ${isToday ? 'text-[#c2ff00]' : 'text-white'}`}>
                            {date.getDate()} {date.toLocaleDateString('tr-TR', { month: 'long' }).toUpperCase()}
                            {isToday && <span className="ml-3 bg-[#c2ff00] text-[#1e2b6e] text-[9px] px-2 py-1 rounded-full font-black uppercase not-italic inline-block align-middle">BUGÜN</span>}
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{dayName}</div>
                        </td>
                        
                        {roles.map(role => {
                          const currentValue = dayData[role.key] || '';
                          const captainName = users.find(u => u.id === currentValue)?.adSoyad || '';
                          return (
                            <td key={role.key} className="p-5 min-w-[220px]">
                              {!isCapturing ? (
                                <div className="relative group">
                                  <select
                                    value={currentValue}
                                    onChange={(e) => handleSelectChange(dateString, role.key, e.target.value)}
                                    className={`w-full bg-white/5 border text-xs rounded-xl px-4 py-3 outline-none font-bold transition-all appearance-none cursor-pointer hover:bg-white/10 ${
                                      currentValue 
                                        ? 'border-[#c2ff00]/50 text-[#c2ff00]' 
                                        : 'border-white/10 text-gray-400'
                                    }`}
                                  >
                                    <option value="" className="text-black">-- SEÇİNİZ --</option>
                                    {captains.map(captain => {
                                      const isSelectedElsewhere = selectedUserIds.includes(captain.id) && currentValue !== captain.id;
                                      if (isSelectedElsewhere) return null;
                                      return (
                                        <option key={captain.id} value={captain.id} className="text-black">
                                          {captain.adSoyad.toUpperCase()}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                    <ChevronRight className="w-4 h-4 rotate-90" />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[#c2ff00] font-black uppercase text-xs">
                                  {captainName || '-'}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end opacity-50 pt-4">
            <span className="text-2xl font-black italic tracking-tighter uppercase text-white">DECATHLON</span>
          </div>
        </div>
      </div>
    </div>
  );
}
