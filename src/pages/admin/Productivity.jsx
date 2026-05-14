import React, { useState, useEffect } from 'react';
import { TrendingUp, Save, CheckCircle2, Users, AlertCircle } from 'lucide-react';
import { db } from '../../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { useData } from '../../context/DataContext';

export default function Productivity() {
  const { 
    productivityTargets, 
    latestProductivity, 
    selectedDate, 
    setSelectedDate, 
    loadingData 
  } = useData();
  
  const [localTargets, setLocalTargets] = useState({});
  const [isUsingLatest, setIsUsingLatest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  const departments = ['Quechua', 'Su Sporları', 'Btwin/Wildlife', 'Kosu/Fitness', 'Takım Sporları', 'Triathlon/CRL'];

  useEffect(() => {
    if (productivityTargets && Object.keys(productivityTargets).length > 0) {
      setLocalTargets(productivityTargets);
      setIsUsingLatest(false);
    } else if (latestProductivity && Object.keys(latestProductivity).length > 0) {
      setLocalTargets(latestProductivity);
      setIsUsingLatest(true);
    } else {
      setLocalTargets({});
      setIsUsingLatest(false);
    }
  }, [productivityTargets, latestProductivity]);

  const handleInputChange = (dept, value) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    setLocalTargets(prev => ({
      ...prev,
      [dept]: cleanValue
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'productivity', selectedDate), localTargets);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error("Kaydetme hatası:", error);
      alert("Hata oluştu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#1e2b6e] rounded-xl shadow-inner">
            <TrendingUp className="text-[#c2ff00] w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#1e2b6e] uppercase tracking-wide">Verimlilik Hedefleri</h1>
            <p className="text-gray-500 font-medium text-sm mt-1">Departman bazlı saatlik ciro (Ciro/Saat) hedefleri</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-[#1e2b6e] font-bold"
          />
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-[#1e2b6e] text-[#c2ff00] px-6 py-2.5 rounded-xl font-black uppercase tracking-wider hover:bg-[#152059] transition-all shadow-md disabled:opacity-50"
          >
            {saveStatus === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {saveStatus === 'success' ? 'Kaydedildi' : (loading ? 'Kaydediliyor...' : 'Kaydet')}
          </button>
        </div>
      </div>

      {isUsingLatest && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-700 animate-pulse">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-bold uppercase tracking-tight">
            Şu an en son kaydedilen verimlilik hedefleri gösteriliyor. Bu tarihe özel kaydetmek için "Kaydet" butonuna basınız.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group hover:border-[#1e2b6e]/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-[#1e2b6e] uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                {dept}
              </h3>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">HEDEF</span>
            </div>
            
            <div className="relative">
              <input 
                type="text"
                placeholder="10000"
                value={localTargets[dept] || ''}
                onChange={(e) => handleInputChange(dept, e.target.value)}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#1e2b6e]/20 focus:bg-white text-3xl font-black text-[#1e2b6e] p-4 rounded-xl outline-none transition-all placeholder:text-gray-200"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none">
                TL/SAAT
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500 font-medium italic opacity-0 group-hover:opacity-100 transition-opacity">
              Bu departman için saatlik ciro hedefini girin.
            </p>
          </div>
        ))}
      </div>

      <div className="bg-[#1e2b6e] rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-[#c2ff00] rounded-full blur-[120px] opacity-10"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
            <TrendingUp className="w-12 h-12 text-[#c2ff00]" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight mb-2">Verimlilik Hesaplama</h2>
            <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
              Buraya girdiğiniz veriler Günlük Organizasyon sayfasındaki planlamada kullanılacaktır. 
              Hedeflenen verimlilik, toplam personel saati ile çarpılarak o günkü ciro potansiyeli hesaplanır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
