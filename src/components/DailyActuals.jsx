import React from 'react';
import { formatCurrency } from '../utils/helpers';
import { Target, Trophy, TrendingUp } from 'lucide-react';

export default function DailyActuals({ dailyData, updateDailyData, users, selectedDate }) {
  const handleCiroChange = (field, value) => {
    // Sadece rakam kalsın
    const numericValue = value.replace(/\D/g, '');
    updateDailyData(selectedDate, {
      [field]: Number(numericValue)
    });
  };

  const handleMvpToggle = (userId) => {
    let newMvps = [...(dailyData?.mvps || [])];
    if (newMvps.includes(userId)) {
      newMvps = newMvps.filter(id => id !== userId);
    } else {
      if (newMvps.length < 3) {
        newMvps.push(userId);
      } else {
        alert("En fazla 3 MVP seçebilirsiniz!");
        return;
      }
    }
    updateDailyData(selectedDate, { mvps: newMvps });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-[#1e2b6e] rounded-xl">
          <TrendingUp className="text-[#c2ff00] w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-[#1e2b6e] uppercase tracking-wide">Günün Gerçekleşenleri</h2>
          <p className="text-sm text-gray-500 font-medium">Hedefler ve takım performans yıldızları</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Hedef Ciro */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase">
            <Target className="w-4 h-4 text-blue-500" />
            Hedef Ciro (₺)
          </label>
          <input
            type="text"
            className="w-full text-2xl font-black text-[#1e2b6e] bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c2ff00] transition-all"
            value={formatCurrency(dailyData?.hedefCiro || 0)}
            onChange={(e) => handleCiroChange('hedefCiro', e.target.value)}
          />
        </div>

        {/* Gerçekleşen Ciro */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Gerçekleşen Ciro (₺)
          </label>
          <input
            type="text"
            className="w-full text-2xl font-black text-[#1e2b6e] bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c2ff00] transition-all"
            value={formatCurrency(dailyData?.gerceklesenCiro || 0)}
            onChange={(e) => handleCiroChange('gerceklesenCiro', e.target.value)}
          />
        </div>
      </div>

      {/* MVP Seçimi */}
      <div>
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-4 uppercase">
          <Trophy className="w-4 h-4 text-yellow-500" />
          Günün MVP'leri (En Fazla 3 Kişi)
        </label>
        <div className="flex flex-wrap gap-3">
          {users.map(user => {
            const isSelected = (dailyData?.mvps || []).includes(user.id);
            return (
              <button
                key={user.id}
                onClick={() => handleMvpToggle(user.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 border ${
                  isSelected 
                    ? 'bg-[#1e2b6e] text-[#c2ff00] border-[#1e2b6e] shadow-md shadow-[#1e2b6e]/20 scale-105'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {isSelected && <Trophy className="w-3.5 h-3.5" />}
                {user.adSoyad}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
}
