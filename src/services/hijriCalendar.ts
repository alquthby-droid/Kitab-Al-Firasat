// Hijri Calendar Converter & Formatter for Kitab Al-Firasat
// Provides accurate Islamic Hijri dates for analysis records and reports

const HIJRI_MONTHS_ID = [
  'Muharram',
  'Safar',
  'Rabi\'ul Awwal',
  'Rabi\'ul Akhir',
  'Jumadil Ula',
  'Jumadil Akhirah',
  'Rajab',
  'Sya\'ban',
  'Ramadhan',
  'Syawwal',
  'Dzulqa\'dah',
  'Dzulhijjah'
];

const HIJRI_MONTHS_AR = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة'
];

export interface HijriDateInfo {
  day: number;
  monthIndex: number;
  monthName: string;
  monthNameAr: string;
  year: number;
  formatted: string;
  formattedWithDay: string;
  formattedArabic: string;
}

/**
 * Convert a Gregorian Date or ISO String to Islamic Hijri Calendar
 */
export function toHijri(dateInput: Date | string | number): HijriDateInfo {
  const d = new Date(dateInput);
  const validDate = isNaN(d.getTime()) ? new Date() : d;

  // Try modern browser Intl Islamic Umm al-Qura Calendar
  try {
    const formatter = new Intl.DateTimeFormat('id-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
    const parts = formatter.formatToParts(validDate);
    let day = 1;
    let month = 1;
    let year = 1448;

    for (const part of parts) {
      if (part.type === 'day') day = parseInt(part.value, 10);
      if (part.type === 'month') month = parseInt(part.value, 10);
      if (part.type === 'year') year = parseInt(part.value, 10);
    }

    const monthIndex = Math.max(0, Math.min(11, month - 1));
    const monthName = HIJRI_MONTHS_ID[monthIndex] || `Bulan ke-${month}`;
    const monthNameAr = HIJRI_MONTHS_AR[monthIndex] || '';

    // Indonesian Day name
    const dayNames = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = dayNames[validDate.getDay()];

    return {
      day,
      monthIndex,
      monthName,
      monthNameAr,
      year,
      formatted: `${day} ${monthName} ${year} H`,
      formattedWithDay: `${dayName}, ${day} ${monthName} ${year} H`,
      formattedArabic: `${day} ${monthNameAr} ${year} هـ`
    };
  } catch (err) {
    // Fallback algorithmic Kuwaiti / Umm al-Qura approximation
    return algorithmicHijri(validDate);
  }
}

/**
 * Fallback algorithmic conversion if Intl islamic calendar is not fully supported
 */
function algorithmicHijri(date: Date): HijriDateInfo {
  let day = date.getDate();
  let month = date.getMonth();
  let year = date.getFullYear();

  let m = month + 1;
  let y = year;
  if (m < 3) {
    y -= 1;
    m += 12;
  }

  let a = Math.floor(y / 100);
  let b = 2 - a + Math.floor(a / 4);
  if (y < 1583) b = 0;
  if (y === 1582) {
    if (m > 10) b = -10;
    if (m === 10) {
      b = 0;
      if (day > 4) b = -10;
    }
  }

  let jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;
  b = 0;
  if (jd > 2299160) {
    a = Math.floor((jd - 1867216.25) / 36524.25);
    b = 1 + a - Math.floor(a / 4);
  }
  let bb = jd + b + 1524;
  let cc = Math.floor((bb - 122.1) / 365.25);
  let dd = Math.floor(365.25 * cc);
  let ee = Math.floor((bb - dd) / 30.6001);
  day = bb - dd - Math.floor(30.6001 * ee);
  month = ee - 1;
  if (ee > 13) {
    cc += 1;
    month = ee - 13;
  }
  year = cc - 4716;

  let iyear = 10631 / 30;
  let epochastro = 1948084;
  let shift1 = 8.01 / 60;

  let z = jd - epochastro;
  let cyc = Math.floor(z / 10631);
  z = z - 10631 * cyc;
  let j = Math.floor((z - shift1) / iyear);
  let iy = 30 * cyc + j;
  z = z - Math.floor(j * iyear + shift1);
  let im = Math.floor((z + 28.5001) / 29.5);
  if (im === 13) im = 12;
  let id = z - Math.floor(29.5001 * im - 29);

  const monthIdx = Math.max(0, Math.min(11, im - 1));
  const hDay = Math.max(1, Math.min(30, id));
  const hYear = iy;
  const monthName = HIJRI_MONTHS_ID[monthIdx] || 'Bulan Hijriah';
  const monthNameAr = HIJRI_MONTHS_AR[monthIdx] || '';

  const dayNames = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayName = dayNames[date.getDay()];

  return {
    day: hDay,
    monthIndex: monthIdx,
    monthName,
    monthNameAr,
    year: hYear,
    formatted: `${hDay} ${monthName} ${hYear} H`,
    formattedWithDay: `${dayName}, ${hDay} ${monthName} ${hYear} H`,
    formattedArabic: `${hDay} ${monthNameAr} ${hYear} هـ`
  };
}
