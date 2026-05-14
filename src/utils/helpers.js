/**
 * Net çalışma saatini hesaplar. 
 * @param {string} shiftStart "09:00"
 * @param {string} shiftEnd "18:00"
 * @param {string} breakStart "13:00"
 * @param {string} breakEnd "14:30"
 * @returns {string} Net çalışma süresi, örneğin "7.5"
 */
export const calculateNetHours = (shiftStart, shiftEnd, breakStart, breakEnd) => {
  if (!shiftStart || !shiftEnd) return "0";

  const toMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + minutes;
  };

  let totalShiftMins = toMinutes(shiftEnd) - toMinutes(shiftStart);
  if (totalShiftMins < 0) totalShiftMins += 24 * 60; // Gece vardiyası durumu

  let totalBreakMins = 0;
  if (breakStart && breakEnd) {
    totalBreakMins = toMinutes(breakEnd) - toMinutes(breakStart);
    if (totalBreakMins < 0) totalBreakMins += 24 * 60;
  }

  const netMins = totalShiftMins - totalBreakMins;
  if (netMins <= 0) return "0";

  const netHours = netMins / 60;
  return Number.isInteger(netHours) ? netHours.toString() : netHours.toFixed(2);
};

/**
 * Rakamı boşluklu formata çevirir (150000 -> "150 000")
 * @param {number|string} value 
 * @returns {string}
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined) return "0";
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

/**
 * 00:00 - 23:45 arası 15 dakikalık aralıklarla saat dizisi oluşturur.
 * @returns {string[]}
 */
export const generateTimeOptions = () => {
  const options = [];
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 60; j += 15) {
      const hour = i.toString().padStart(2, '0');
      const minute = j.toString().padStart(2, '0');
      options.push(`${hour}:${minute}`);
    }
  }
  return options;
};
