import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { generateTimeOptions, calculateNetHours } from '../../utils/helpers';
import { toJpeg } from 'html-to-image';
import { deleteField } from 'firebase/firestore';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Trophy, 
  Trash2,
  Share2,
  Download,
  RotateCcw,
  Search,
  Clock
} from 'lucide-react';

// Import Assets
import quechuaImg from '../../assets/gorsel/quechua.jpg';
import kosuImg from '../../assets/gorsel/kosu.jpg';
import suSporlariImg from '../../assets/gorsel/su.jpg';
import takimSporlariImg from '../../assets/gorsel/takim.jpg';
import btwinImg from '../../assets/gorsel/bisiklet.jpg';
import triathlonImg from '../../assets/gorsel/triathlon.jpg';

const DebouncedInput = ({ value, onChange, isManual, type = 'ciro' }) => {
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const handleBlur = () => {
    if (localVal.toString() !== value.toString()) {
      onChange(localVal.toString());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  const className = type === 'ciro' 
    ? `bg-white/5 border ${isManual ? 'border-[#c2ff00]' : 'border-white/10'} rounded px-2 py-1 text-right w-24 outline-none text-sm font-black ${isManual ? 'text-[#c2ff00]' : 'text-white'}`
    : `bg-white/5 border ${isManual ? 'border-blue-400' : 'border-white/10'} rounded px-2 py-1 text-right w-24 outline-none text-sm font-black ${isManual ? 'text-blue-400' : 'text-[#c2ff00]'}`;

  return (
    <input 
      type="text" 
      value={localVal} 
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className}
    />
  );
};

export default function DailyOrganization() {
  const { 
    users, 
    captainSchedules,
    productivityTargets,
    dailyData, 
    globalStats,
    selectedDate, 
    setSelectedDate, 
    updateDailyData,
    updateCaptainSchedule,
    loadingData 
  } = useData();

  const [localRekor, setLocalRekor] = useState('');
  const [isEditingRekor, setIsEditingRekor] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const printableRef = useRef(null);
  const timeOptions = generateTimeOptions();

  const [supportModalDept, setSupportModalDept] = useState(null);
  const [supportSearch, setSupportSearch] = useState('');

  const triathlonTasks = [
    'Açılış Danışma',
    'Kapanış Danışma',
    'Açılış Kasa',
    'Kapanış Kasa',
    'Kabin'
  ];

  const deptOrder = ['QUECHUA', 'KOŞU/FITNESS', 'SU SPORLARI', 'TAKIM SPORLARI', 'BİSİKLET', 'TRIATHLON//CRL'];
  
  const getDeptImage = (dept) => {
    switch (dept) {
      case 'QUECHUA': return quechuaImg;
      case 'KOŞU/FITNESS': return kosuImg;
      case 'SU SPORLARI': return suSporlariImg;
      case 'TAKIM SPORLARI': return takimSporlariImg;
      case 'BİSİKLET': return btwinImg;
      case 'TRIATHLON//CRL': return triathlonImg;
      default: return null;
    }
  };

  const dayCaptains = captainSchedules[selectedDate] || {};
  const getCaptainName = (id) => users.find(u => u.id === id)?.adSoyad || '-';

  const isAutoUpdating = useRef(false);

  useEffect(() => {
    if (dailyData?.rekor) {
      setLocalRekor(dailyData.rekor);
    } else {
      setLocalRekor('');
    }

    if (!loadingData && dayCaptains && !isAutoUpdating.current) {
      const roles = ['acilis_kaptani', 'acilis_apranti', 'kapanis_kaptani', 'kapanis_apranti'];
      const currentShifts = dailyData?.shifts || {};
      const shiftsToUpdate = {};
      let needsUpdate = false;

      roles.forEach(role => {
        const userId = dayCaptains[role];
        if (userId && !currentShifts[userId]) {
          const user = users.find(u => u.id === userId);
          if (user) {
            shiftsToUpdate[userId] = {
              shiftStart: '09:30',
              shiftEnd: '19:30',
              breakStart: '14:00',
              breakEnd: '15:00',
              dept: user.departman?.toUpperCase() || 'QUECHUA',
              task: ''
            };
            needsUpdate = true;
          }
        }
      });

      if (needsUpdate) {
        isAutoUpdating.current = true;
        updateDailyData(selectedDate, { shifts: shiftsToUpdate }).finally(() => {
          isAutoUpdating.current = false;
        });
      }
    }
  }, [dailyData?.shifts, dayCaptains, loadingData, users, selectedDate]);

  // Rekorun sürekliliğini sağla
  useEffect(() => {
    if (!loadingData) {
      if (dailyData?.rekor) {
        setLocalRekor(dailyData.rekor);
      } else if (globalStats?.rekor) {
        // Eğer bugünün rekoru henüz girilmemişse, genel son rekoru göster
        setLocalRekor(globalStats.rekor);
      } else {
        setLocalRekor('');
      }
    }
  }, [dailyData?.rekor, globalStats?.rekor, loadingData]);

  const handleRekorChange = (val) => {
    let clean = val.replace(/[^0-9]/g, '');
    if (clean.length > 9) clean = clean.slice(0, 9);
    let formatted = clean.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    setLocalRekor(formatted);
  };

  const saveRekor = () => {
    updateDailyData(selectedDate, { rekor: localRekor });
    updateDailyData('LATEST_STATS', { rekor: localRekor });
    setIsEditingRekor(false);
  };

  const handleShiftChange = (userId, field, value) => {
    const currentShifts = dailyData?.shifts || {};
    const userShift = currentShifts[userId] || {};
    let updatedShift = { ...userShift, [field]: value };

    if (field === 'shiftStart' && value) {
      const [h, m] = value.split(':').map(Number);
      const endH = (h + 10) % 24;
      updatedShift.shiftEnd = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    if (field === 'breakStart' && value) {
      const [h, m] = value.split(':').map(Number);
      const endH = (h + 1) % 24;
      updatedShift.breakEnd = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    updateDailyData(selectedDate, {
      shifts: { [userId]: updatedShift } // Sadece bu kullanıcıyı gönder
    });
  };

  const addUserToDay = (userId, deptName) => {
    const currentShifts = dailyData?.shifts || {};
    if (currentShifts[userId]) return;
    updateDailyData(selectedDate, {
      shifts: {
        [userId]: {
          shiftStart: '09:30',
          shiftEnd: '19:30',
          breakStart: '14:00',
          breakEnd: '15:00',
          dept: deptName,
          task: ''
        }
      }
    });
  };

  const removeUserFromDay = (userId) => {
    updateDailyData(selectedDate, {
      shifts: {
        [userId]: deleteField()
      }
    });
  };

  const updateCaptainRole = (userId, newRole) => {
    const roles = ['acilis_kaptani', 'acilis_apranti', 'kapanis_kaptani', 'kapanis_apranti'];
    const updates = {};
    roles.forEach(r => {
      if (dayCaptains[r] === userId) updates[r] = '';
    });
    if (newRole !== 'normal') {
      updates[newRole] = userId;
    }
    updateCaptainSchedule(selectedDate, updates);
  };

  const handleManualTargetChange = (dept, field, value) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    const targets = dailyData?.[field] || {};
    updateDailyData(selectedDate, {
      [field]: { ...targets, [dept]: cleanValue }
    });
  };

  const handleResetDay = () => {
    if (window.confirm('Günün tüm organizasyon verilerini sıfırlamak istediğine emin misin? (Rekor silinmeyecektir)')) {
      updateDailyData(selectedDate, {
        shifts: {},
        manualTargets: {},
        manualAdet: {},
        mvps: []
        // rekor: ''  <-- Rekoru silmiyoruz
      });
    }
  };

  const getAdetMultiplier = (dept) => {
    switch (dept) {
      case 'QUECHUA': return 0.9;
      case 'SU SPORLARI': return 1.5;
      case 'BİSİKLET': return 0.8;
      case 'KOŞU/FITNESS': return 1.3;
      case 'TAKIM SPORLARI': return 1.8;
      case 'TRIATHLON//CRL': return 9;
      default: return 1;
    }
  };

  const handleDownloadImage = async () => {
    if (!printableRef.current) return;
    setIsCapturing(true);
    setTimeout(async () => {
      try {
        const dataUrl = await toJpeg(printableRef.current, {
          quality: 1.0,
          pixelRatio: 2,
          backgroundColor: '#1e2b6e',
          cacheBust: true,
        });
        const link = document.createElement('a');
        link.download = `Gunluk_Organizasyon_${selectedDate}.jpg`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Download Error:', err);
        alert('Resim oluşturulamadı!');
      } finally {
        setIsCapturing(false);
      }
    }, 200);
  };

  if (loadingData) return <div className="p-12 text-center text-[#1e2b6e] font-black">YÜKLENİYOR...</div>;

  const formattedDate = new Date(selectedDate).toLocaleDateString('tr-TR', { 
    day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' 
  }).toUpperCase();

  let totalStoreHours = 0;
  let totalStoreTargetCiro = 0;
  let totalStoreTargetAdet = 0;

  const deptData = deptOrder.map(dept => {
    const assigned = Object.entries(dailyData?.shifts || {})
      .filter(([uid, s]) => {
        const userDept = s.dept?.toUpperCase() || '';
        const targetDept = dept.toUpperCase();
        const isMatch = userDept === targetDept || 
               (targetDept === 'BİSİKLET' && (userDept === 'BTWIN/WILDLIFE' || userDept === 'BİSİKLET')) ||
               (targetDept === 'KOŞU/FITNESS' && userDept.includes('KOSU')) ||
               (targetDept === 'TRIATHLON//CRL' && userDept.includes('TRIATHLON'));
        return isMatch;
      });
    
    let deptHours = 0;
    assigned.forEach(([uid, shift]) => {
      const h = parseFloat(calculateNetHours(shift.shiftStart, shift.shiftEnd, shift.breakStart, shift.breakEnd));
      deptHours += h;
    });

    const getProductivityKey = (d) => {
      if (d === 'QUECHUA') return 'Quechua';
      if (d === 'SU SPORLARI') return 'Su Sporları';
      if (d === 'BİSİKLET') return 'Btwin/Wildlife';
      if (d === 'KOŞU/FITNESS') return 'Kosu/Fitness';
      if (d === 'TAKIM SPORLARI') return 'Takım Sporları';
      if (d === 'TRIATHLON//CRL') return 'Triathlon/CRL';
      return d;
    };
    const targetPerHour = parseFloat(productivityTargets[getProductivityKey(dept)] || 10000);
    const calculatedCiro = deptHours * targetPerHour;
    const manualCiro = dailyData?.manualTargets?.[dept];
    const deptTargetCiro = manualCiro ? parseFloat(manualCiro) : calculatedCiro;

    const multiplier = getAdetMultiplier(dept);
    const calculatedAdet = (deptTargetCiro / 1000) * multiplier;
    const manualAdetValue = dailyData?.manualAdet?.[dept];
    const deptTargetAdet = manualAdetValue ? parseFloat(manualAdetValue) : calculatedAdet;

    totalStoreHours += deptHours;
    totalStoreTargetCiro += deptTargetCiro;
    totalStoreTargetAdet += deptTargetAdet;

    return { 
      name: dept, 
      users: assigned, 
      hours: deptHours, 
      targetCiro: deptTargetCiro, 
      targetAdet: deptTargetAdet,
      isManualCiro: !!manualCiro,
      isManualAdet: !!manualAdetValue
    };
  });

  const shareOnWhatsApp = () => {
    let text = `*GÜNLÜK ORGANİZASYON*\n📅 ${formattedDate}\n\n`;
    text += `🏆 REKOR: ${localRekor} TL\n\n`;
    deptData.forEach(d => {
      if (d.users.length > 0) {
        text += `*${d.name}*\n`;
        d.users.forEach(([uid, s]) => {
          const u = users.find(usr => usr.id === uid);
          text += `• ${u?.adSoyad}: ${s.shiftStart}-${s.shiftEnd}${s.task ? ` (${s.task})` : ''}\n`;
        });
        text += `💰 Ciro: ${d.targetCiro.toLocaleString('tr-TR')} ₺\n`;
        text += `📦 Adet: ${Math.round(d.targetAdet).toLocaleString('tr-TR')} AD\n\n`;
      }
    });
    text += `*TOPLAM MAĞAZA: ${totalStoreTargetCiro.toLocaleString('tr-TR')} ₺ / ${Math.round(totalStoreTargetAdet).toLocaleString('tr-TR')} AD*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 font-sans text-[#1e2b6e]">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Action Bar */}
        <div className="flex flex-wrap justify-between items-center gap-4 no-print bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex gap-2">
            <button onClick={shareOnWhatsApp} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest shadow-md transition-all hover:scale-105 active:scale-95"><Share2 className="w-4 h-4" /> WHATSAPP</button>
            <button onClick={handleDownloadImage} className="flex items-center gap-2 bg-[#1e2b6e] text-white px-5 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest shadow-md transition-all hover:scale-105 active:scale-95"><Download className="w-4 h-4" /> JPG İNDİR</button>
          </div>
          <button onClick={handleResetDay} className="flex items-center gap-2 bg-red-100 text-red-600 hover:bg-red-200 px-5 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest transition-all hover:scale-105 active:scale-95"><RotateCcw className="w-4 h-4" /> SIFIRLA</button>
        </div>

        {/* Main Organization Component */}
        <div ref={printableRef} className={`bg-[#1e2b6e] text-white p-6 md:p-10 space-y-10 shadow-2xl relative overflow-hidden ${isCapturing ? 'rounded-none' : 'rounded-3xl'}`}>
          {!isCapturing && <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-[#c2ff00] rounded-full blur-[150px] opacity-10 pointer-events-none"></div>}
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none text-white">GÜNLÜK ORGANİZASYON</h1>
              <div className="flex items-center gap-2 text-blue-300 font-bold">
                <MapPin className="w-5 h-5 text-[#c2ff00]" /><span className="tracking-widest uppercase text-sm">843 - MERSİN TURKSPORT</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
              <div className="bg-white/10 border border-white/10 px-4 py-2 rounded-lg flex items-center gap-3 shadow-lg">
                <Trophy className="text-[#c2ff00] w-5 h-5" />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">REKOR:</span>
                  {!isCapturing ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={localRekor} 
                        onChange={(e) => handleRekorChange(e.target.value)} 
                        onFocus={() => setIsEditingRekor(true)}
                        className={`bg-transparent text-[#c2ff00] text-xl font-black outline-none transition-all ${isEditingRekor ? 'w-36 bg-white/10 px-2 rounded' : 'w-28'} placeholder:text-white/10`} 
                        placeholder="0 000 000" 
                      />
                      {isEditingRekor && (
                        <button 
                          onClick={saveRekor}
                          className="bg-[#c2ff00] text-[#1e2b6e] text-[10px] font-black px-2 py-1 rounded hover:bg-white transition-colors"
                        >
                          KAYDET
                        </button>
                      )}
                    </div>
                  ) : <span className="text-[#c2ff00] text-xl font-black">{localRekor || '0'}</span>}
                </div>
              </div>
              <div className="bg-white/10 border border-white/10 px-4 py-2 rounded-lg flex items-center gap-3 shadow-lg relative">
                <CalendarIcon className="text-[#c2ff00] w-5 h-5" />
                <span className="text-[#c2ff00] text-sm font-black tracking-widest uppercase">{formattedDate}</span>
                {!isCapturing && <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            {[
              { label: 'AÇILIŞ KAPTANI', id: dayCaptains.acilis_kaptani, color: 'bg-yellow-400' },
              { label: 'AÇILIŞ APRANTİSİ', id: dayCaptains.acilis_apranti, color: 'bg-yellow-200' },
              { label: 'KAPANIŞ KAPTANI', id: dayCaptains.kapanis_kaptani, color: 'bg-blue-400' },
              { label: 'KAPANIŞ APRANTİSİ', id: dayCaptains.kapanis_apranti, color: 'bg-blue-300' }
            ].map((c, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full ${c.color} shadow-[0_0_10px_rgba(255,255,255,0.2)]`}></div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase">{c.label}</p>
                  <p className="font-bold text-sm tracking-tight text-white">{getCaptainName(c.id)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={`bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm shadow-2xl relative z-10 ${isCapturing ? 'overflow-visible' : 'overflow-hidden'}`}>
            <div className={isCapturing ? '' : 'overflow-x-auto'}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/20 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                    <th className="p-4">DEPARTMAN</th>
                    <th className="p-4">TAKIM ARKADAŞI</th>
                    <th className="p-4 text-center">SHIFT</th>
                    <th className="p-4 text-center">MOLA</th>
                    <th className="p-4 text-right text-white">HEDEF CİRO</th>
                    <th className="p-4 text-right text-white">HEDEF ADET</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {deptData.map((dept, dIdx) => {
                    const deptImg = getDeptImage(dept.name);
                    return (
                      <tr key={dIdx} className="hover:bg-white/5 transition-colors relative">
                        <td className="p-4 align-top relative min-w-[180px] overflow-hidden">
                          {deptImg && <div className="absolute inset-0 pointer-events-none opacity-25 bg-cover bg-center grayscale" style={{ backgroundImage: `url(${deptImg})` }}></div>}
                          <div className="relative z-10 space-y-3">
                            <div className="text-xl font-black italic skew-x-[-10deg] text-[#c2ff00] uppercase">{dept.name}</div>
                            
                            {!isCapturing && (
                              <div className="space-y-1">
                                <select 
                                  onChange={(e) => { if (e.target.value) addUserToDay(e.target.value, dept.name); e.target.value = ""; }} 
                                  className="w-full bg-transparent border border-white/10 rounded px-2 py-1.5 text-[10px] font-bold text-gray-400 outline-none hover:border-white/30"
                                >
                                  <option value="">+ EKİP EKLE</option>
                                  {users
                                    .filter(u => {
                                      // Adminleri ve rolü admin olanları listeden çıkar
                                      if (u.role === 'admin') return false;
                                      
                                      const userDept = u.departman?.toUpperCase() || '';
                                      const targetDept = dept.name.toUpperCase();
                                      const isMatch = userDept === targetDept || 
                                                      (targetDept === 'BİSİKLET' && (userDept === 'BTWIN/WILDLIFE' || userDept === 'BİSİKLET')) ||
                                                      (targetDept === 'KOŞU/FITNESS' && userDept.includes('KOSU')) ||
                                                      (targetDept === 'TRIATHLON//CRL' && userDept.includes('TRIATHLON'));
                                      
                                      return isMatch && !dailyData?.shifts?.[u.id] && u.adSoyad;
                                    })
                                    .sort((a, b) => (a.adSoyad || "").localeCompare(b.adSoyad || ""))
                                    .map(u => (
                                      <option key={u.id} value={u.id} className="text-black">
                                        {u.adSoyad}
                                      </option>
                                    ))}
                                </select>
                                <button 
                                  onClick={() => setSupportModalDept(dept.name)}
                                  className="w-full bg-[#c2ff00]/10 text-[#c2ff00] border border-[#c2ff00]/20 rounded px-1 py-1 text-[8px] font-bold outline-none hover:bg-[#c2ff00]/20 transition-colors uppercase tracking-widest"
                                >
                                  + DESTEK EKLE
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-2 align-top text-white">
                          <div className="space-y-0 pt-2">
                            {dept.users.map(([uid, shift]) => {
                              const u = users.find(usr => usr.id === uid);
                              const isAK = dayCaptains.acilis_kaptani === uid;
                              const isKK = dayCaptains.kapanis_kaptani === uid;
                              const isAA = dayCaptains.acilis_apranti === uid;
                              const isKA = dayCaptains.kapanis_apranti === uid;
                              const userDept = u?.departman?.toUpperCase() || '';
                              const targetDept = dept.name.toUpperCase();
                              const isHomeDept = userDept === targetDept || 
                                              (targetDept === 'BİSİKLET' && (userDept === 'BTWIN/WILDLIFE' || userDept === 'BİSİKLET')) ||
                                              (targetDept === 'KOŞU/FITNESS' && userDept.includes('KOSU')) ||
                                              (targetDept === 'TRIATHLON//CRL' && userDept.includes('TRIATHLON'));
                              
                              return (
                                <div key={uid} className="flex flex-col justify-center group h-14 border-b border-white/5 last:border-0 relative px-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 overflow-hidden">
                                      <span className="text-[13px] font-bold tracking-tight truncate">{u?.adSoyad}</span>
                                      {isAK && <span className="text-[9px] bg-[#c2ff00] text-[#1e2b6e] px-1 rounded font-black shrink-0">AK</span>}
                                      {isKK && <span className="text-[9px] bg-blue-500 text-white px-1 rounded font-black shrink-0">KK</span>}
                                      {isAA && <span className="text-[9px] bg-yellow-200 text-[#1e2b6e] px-1 rounded font-black shrink-0">AA</span>}
                                      {isKA && <span className="text-[9px] bg-blue-300 text-[#1e2b6e] px-1 rounded font-black shrink-0">KA</span>}
                                      {!isHomeDept && <span className="text-[8px] bg-[#c2ff00] text-[#1e2b6e] px-1 rounded font-bold shrink-0">DESTEK</span>}
                                    </div>
                                    {!isCapturing && <button onClick={() => removeUserFromDay(uid)} className="opacity-0 group-hover:opacity-100 text-red-500 p-1 absolute right-0 top-0"><Trash2 className="w-3 h-3" /></button>}
                                  </div>

                                  {!isCapturing ? (
                                    <div className="flex gap-1 mt-0.5">
                                      <select 
                                        value={isAK ? 'acilis_kaptani' : isKK ? 'kapanis_kaptani' : isAA ? 'acilis_apranti' : isKA ? 'kapanis_apranti' : 'normal'}
                                        onChange={(e) => updateCaptainRole(uid, e.target.value)}
                                        className={`bg-black/30 text-[9px] ${isAK ? 'text-[#c2ff00]' : isKK ? 'text-blue-500' : isAA ? 'text-yellow-200' : isKA ? 'text-blue-300' : 'text-gray-400'} font-bold border border-white/10 rounded outline-none px-1`}
                                      >
                                        <option value="normal" className="text-black">Rol Yok</option>
                                        <option value="acilis_kaptani" className="text-black">AK</option>
                                        <option value="kapanis_kaptani" className="text-black">KK</option>
                                        <option value="acilis_apranti" className="text-black">AA</option>
                                        <option value="kapanis_apranti" className="text-black">KA</option>
                                      </select>
                                      {dept.name === 'TRIATHLON//CRL' && (
                                        <select 
                                          value={shift.task || ''} 
                                          onChange={(e) => handleShiftChange(uid, 'task', e.target.value)}
                                          className="bg-black/30 text-[9px] text-[#c2ff00] border border-[#c2ff00]/20 rounded outline-none px-1 w-full"
                                        >
                                          <option value="">GÖREV SEÇ</option>
                                          {triathlonTasks.map(t => <option key={t} value={t} className="text-black">{t}</option>)}
                                        </select>
                                      )}
                                    </div>
                                  ) : (
                                    dept.name === 'TRIATHLON//CRL' && shift.task && (
                                      <div className="text-[9px] text-[#c2ff00] font-black uppercase tracking-widest mt-0.5">{shift.task}</div>
                                    )
                                  )}
                                </div>
                              );
                            })}
                            {dept.users.length === 0 && <div className="h-14 flex items-center"><span className="text-xs text-white/20 italic px-1">-</span></div>}
                          </div>
                        </td>
                        <td className="p-2 align-top text-center text-white">
                          <div className="space-y-0 pt-2">
                            {dept.users.map(([uid, shift]) => (
                              <div key={uid} className="flex items-center justify-center gap-1 text-[11px] font-bold h-14 border-b border-white/5 last:border-0">
                                {!isCapturing ? (
                                  <>
                                    <select value={shift.shiftStart} onChange={(e) => handleShiftChange(uid, 'shiftStart', e.target.value)} className="bg-transparent p-0 outline-none">
                                      {timeOptions.map(t => <option key={t} value={t} className="text-black">{t}</option>)}
                                    </select>
                                    <span>-</span>
                                    <select value={shift.shiftEnd} onChange={(e) => handleShiftChange(uid, 'shiftEnd', e.target.value)} className="bg-transparent p-0 outline-none">
                                      {timeOptions.map(t => <option key={t} value={t} className="text-black">{t}</option>)}
                                    </select>
                                  </>
                                ) : <span>{shift.shiftStart} - {shift.shiftEnd}</span>}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-2 align-top text-center text-blue-300">
                          <div className="space-y-0 pt-2">
                            {dept.users.map(([uid, shift]) => (
                              <div key={uid} className="flex items-center justify-center gap-1 text-[11px] font-bold h-14 border-b border-white/5 last:border-0">
                                {!isCapturing ? (
                                  <>
                                    <select value={shift.breakStart} onChange={(e) => handleShiftChange(uid, 'breakStart', e.target.value)} className="bg-transparent p-0 outline-none">
                                      {timeOptions.map(t => <option key={t} value={t} className="text-black">{t}</option>)}
                                    </select>
                                    <span>-</span>
                                    <select value={shift.breakEnd} onChange={(e) => handleShiftChange(uid, 'breakEnd', e.target.value)} className="bg-transparent p-0 outline-none">
                                      {timeOptions.map(t => <option key={t} value={t} className="text-black">{t}</option>)}
                                    </select>
                                  </>
                                ) : <span>{shift.breakStart} - {shift.breakEnd}</span>}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 align-middle text-right bg-black/10 text-white font-black">
                          {!isCapturing ? (
                            <div className="flex flex-col items-end">
                              <DebouncedInput 
                                value={Math.round(dept.targetCiro)} 
                                onChange={(val) => handleManualTargetChange(dept.name, 'manualTargets', val)} 
                                isManual={dept.isManualCiro} 
                                type="ciro" 
                              />
                              <span className="text-[9px] text-gray-500 uppercase mt-1">₺</span>
                            </div>
                          ) : <div className="text-xl">{Math.round(dept.targetCiro).toLocaleString('tr-TR')} ₺</div>}
                        </td>
                        <td className="p-4 align-middle text-right bg-black/20 text-[#c2ff00] font-black">
                          {!isCapturing ? (
                            <div className="flex flex-col items-end">
                              <DebouncedInput 
                                value={Math.round(dept.targetAdet)} 
                                onChange={(val) => handleManualTargetChange(dept.name, 'manualAdet', val)} 
                                isManual={dept.isManualAdet} 
                                type="adet" 
                              />
                              <span className="text-[9px] text-gray-500 uppercase mt-1">ADET</span>
                            </div>
                          ) : (
                            <div className="text-xl">
                              {Math.round(dept.targetAdet).toLocaleString('tr-TR')}
                              <div className="text-[9px] text-gray-500 uppercase">ADET</div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-[#c2ff00] text-[#1e2b6e]">
                  <tr className="font-black italic text-xl">
                    <td colSpan="4" className="p-4 text-right uppercase tracking-tighter">MAĞAZA TOPLAM:</td>
                    <td className="p-4 text-right">{Math.round(totalStoreTargetCiro).toLocaleString('tr-TR')} ₺</td>
                    <td className="p-4 text-right">{Math.round(totalStoreTargetAdet).toLocaleString('tr-TR')} AD</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div className="flex justify-between items-center pt-4 opacity-50 relative z-10">
            <span className="text-xs font-bold tracking-widest text-blue-200 uppercase">Organizasyon Planı Resmi Evraktır</span>
            <span className="text-2xl font-black italic tracking-tighter uppercase text-white">DECATHLON</span>
          </div>
        </div>
      </div>

      {supportModalDept && (
        <div className="fixed inset-0 z-50 bg-[#1e2b6e]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e2b6e] rounded-xl border border-white/10 w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
              <h3 className="text-[#c2ff00] font-black text-lg uppercase flex items-center gap-2">
                <Search className="w-5 h-5" />
                {supportModalDept} DESTEK EKLE
              </h3>
              <button onClick={() => { setSupportModalDept(null); setSupportSearch(''); }} className="text-gray-400 hover:text-white font-bold">Kapat</button>
            </div>
            <div className="p-4 space-y-4">
              <input 
                type="text" 
                placeholder="Personel Adı Ara..." 
                value={supportSearch} 
                onChange={e => setSupportSearch(e.target.value)} 
                autoFocus
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#c2ff00] focus:outline-none"
              />
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {users
                  .filter(u => u.role !== 'admin' && u.adSoyad)
                  .filter(u => !dailyData?.shifts?.[u.id])
                  .filter(u => (u.adSoyad || "").toLowerCase().includes((supportSearch || "").toLowerCase()))
                  .sort((a, b) => (a.adSoyad || "").localeCompare(b.adSoyad || ""))
                  .map(u => (
                    <div key={u.id} className="flex justify-between items-center bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-lg border border-white/5">
                      <div>
                        <div className="text-white text-sm font-bold">{u.adSoyad}</div>
                        <div className="text-gray-400 text-xs">{u.departman}</div>
                      </div>
                      <button 
                        onClick={() => {
                          addUserToDay(u.id, supportModalDept);
                          setSupportModalDept(null);
                          setSupportSearch('');
                        }}
                        className="bg-[#c2ff00] text-[#1e2b6e] px-4 py-2 rounded-lg text-xs font-black hover:bg-[#a1d600] transition-colors"
                      >
                        EKLE
                      </button>
                    </div>
                  ))}
                {users.filter(u => !dailyData?.shifts?.[u.id] && (u.adSoyad || "").toLowerCase().includes((supportSearch || "").toLowerCase())).length === 0 && (
                  <div className="text-gray-400 text-center text-sm py-8 font-medium">Aranan kriterlere uygun personel bulunamadı.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
