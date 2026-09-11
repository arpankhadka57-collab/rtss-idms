// @ts-ignore
import NepaliDate from 'nepali-date-converter';
import { toNepaliDigits } from './nepaliDate';

export interface NepaliPatroInfo {
  bsDateStr: string; // "2083-04-25"
  formattedBsNepali: string; // "विसं २०८३ साउन २५ गते"
  formattedBsFull: string; // "विसं २०८३ साउन २५, सोमबार"
  yearBs: string; // "२०८३"
  monthBsName: string; // "साउन"
  dayBs: string; // "२५"
  dayOfWeekNepali: string; // "सोमबार"
  dayOfWeekEnglish: string; // "Monday"
  adDateStr: string; // "10 August 2026"
  nepaliTimeStr: string; // "१०:४५:१२ AM"
  nepaliTimePeriod: string; // "बिहान १०:४५ बजे"
  specialEvent: string; // "आजको विशेष: ..."
  isHoliday: boolean; // true if public holiday or Saturday
  holidayType?: 'saturday' | 'festival' | 'none';
}

export const NEPALI_MONTHS_NP = [
  'वैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज',
  'कात्तिक', 'मङ्सीर', 'पुस', 'माघ', 'फागुन', 'चैत'
];

export const DAYS_OF_WEEK_NP = [
  'आइतबार', 'सोमबार', 'मङ्गलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'
];

export const DAYS_OF_WEEK_EN = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export const AD_MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const AD_MONTHS_NP = [
  'जनवरी', 'फेब्रुअरी', 'मार्च', 'अप्रिल', 'मे', 'जुन',
  'जुलाई', 'अगस्ट', 'सेप्टेम्बर', 'अक्टोबर', 'नोभेम्बर', 'डिसेम्बर'
];

// Fixed Annual BS Events (Month-Day MM-DD)
const FIXED_BS_EVENTS: Record<string, { name: string; isHoliday?: boolean }> = {
  '01-01': { name: 'नयाँ वर्ष वि.सं. (New Year\'s Day) / सिरुवा पर्व / विश्वकर्मा दिवस', isHoliday: true },
  '01-11': { name: 'लोकतन्त्र दिवस (Loktantra Diwas)', isHoliday: true },
  '01-18': { name: 'अन्तर्राष्ट्रिय श्रमिक दिवस (Labour Day / May Day)', isHoliday: true },
  '02-15': { name: 'गणतन्त्र दिवस (Republic Day)', isHoliday: true },
  '03-15': { name: 'राष्ट्रिय धान दिवस / असार १५ दही चिउरा खाने दिन (National Paddy Day)', isHoliday: false },
  '04-01': { name: 'साउने सङ्क्रान्ति / साउन १ (Saune Sankranti)', isHoliday: false },
  '05-01': { name: 'सिंह सङ्क्रान्ति (Simha Sankranti)', isHoliday: false },
  '05-22': { name: 'निजामती सेवा दिवस (Civil Service Day)', isHoliday: false },
  '06-01': { name: 'कन्या सङ्क्रान्ति / विश्वकर्मा पूजा (Vishwakarma Puja)', isHoliday: false },
  '06-03': { name: 'संविधान दिवस (National Constitution Day)', isHoliday: true },
  '07-01': { name: 'तुला सङ्क्रान्ति (Tula Sankranti)', isHoliday: false },
  '07-25': { name: 'राष्ट्रिय कर दिवस (National Tax Day)', isHoliday: false },
  '08-01': { name: 'वृश्चिक सङ्क्रान्ति (Vrischika Sankranti)', isHoliday: false },
  '09-01': { name: 'धनु सङ्क्रान्ति (Dhanu Sankranti)', isHoliday: false },
  '09-15': { name: 'तमु ल्होसार (Tamu Lhosar)', isHoliday: true },
  '09-27': { name: 'राष्ट्रिय एकता दिवस / पृथ्वी जयन्ती (Prithvi Jayanti)', isHoliday: true },
  '10-01': { name: 'माघे सङ्क्रान्ति / मकर सङ्क्रान्ति / माघी पर्व (Maghe Sankranti)', isHoliday: true },
  '10-16': { name: 'शहीद दिवस (Martyrs\' Day)', isHoliday: false },
  '11-01': { name: 'कुम्भ सङ्क्रान्ति (Kumbha Sankranti)', isHoliday: false },
  '11-07': { name: 'राष्ट्रिय प्रजातन्त्र दिवस (Democracy Day)', isHoliday: true },
  '11-24': { name: 'अन्तर्राष्ट्रिय महिला दिवस (International Women\'s Day)', isHoliday: true },
  '12-01': { name: 'मीन सङ्क्रान्ति (Meen Sankranti)', isHoliday: false },
};

// Specific Year Lunar / Dynamic Festival Calendar (2081, 2082, 2083, 2084, 2085)
const SPECIFIC_YEAR_EVENTS: Record<string, { name: string; isHoliday?: boolean }> = {
  // 2083 BS Events
  '2083-01-19': { name: 'उभौली पर्व / चण्डी पूर्णिमा / बुद्ध जयन्ती (Buddha Jayanti / Ubhauli)', isHoliday: true },
  '2083-03-16': { name: 'गुरु पूर्णिमा (Guru Purnima)', isHoliday: false },
  '2083-04-12': { name: 'नाग पञ्चमी (Naag Panchami)', isHoliday: false },
  '2083-04-25': { name: 'जनैपूर्णिमाको अघिल्लो दिन / साउन शुक्ल चतुर्दशी', isHoliday: false },
  '2083-04-26': { name: 'जनैपूर्णिमा / रक्षाबन्धन / ऋषि तर्पणी / क्वाँटी खाने दिन (Janai Purnima / Rakshabandhan)', isHoliday: true },
  '2083-04-27': { name: 'गाईजात्रा / सापारु (Gai Jatra)', isHoliday: true },
  '2083-05-03': { name: 'श्रीकृष्ण जन्माष्टमी (Krishna Janmashtami)', isHoliday: true },
  '2083-05-18': { name: 'हरितालिका तीज (Teej - Women Holiday)', isHoliday: true },
  '2083-05-19': { name: 'गणेश चतुर्थी (Ganesh Chaturthi)', isHoliday: false },
  '2083-05-20': { name: 'ऋषि पञ्चमी (Rishi Panchami)', isHoliday: false },
  '2083-05-21': { name: 'गौरा पर्व (Gaura Parva)', isHoliday: true },
  '2083-06-25': { name: 'बडादशैँ घटस्थापना (Dashain Ghatasthapana)', isHoliday: true },
  '2083-07-01': { name: 'फूलपाती (Fulpati)', isHoliday: true },
  '2083-07-02': { name: 'महाअष्टमी (Maha Ashtami)', isHoliday: true },
  '2083-07-03': { name: 'महानवमी (Maha Navami)', isHoliday: true },
  '2083-07-04': { name: 'विजया दशमी (Vijaya Dashami - Bada Dashain Tika)', isHoliday: true },
  '2083-07-05': { name: 'एकादशी (Dashain Tika Continuation)', isHoliday: true },
  '2083-07-09': { name: 'कोजाग्रत पूर्णिमा (Kojagrat Purnima)', isHoliday: false },
  '2083-07-23': { name: 'काग तिहार (Kag Tihar)', isHoliday: false },
  '2083-07-24': { name: 'कुकुर तिहार / लक्ष्मी पूजा (Kukur Tihar & Laxmi Puja)', isHoliday: true },
  '2083-07-25': { name: 'गाई पूजा / गोवर्धन पूजा / म्ह पूजा / नेपाल संवत् ११४७ (Nepal Sambat 1147)', isHoliday: true },
  '2083-07-26': { name: 'भाइटीका (Bhai Tika)', isHoliday: true },
  '2083-07-29': { name: 'छठ पर्व (Chhath Parva)', isHoliday: true },
  '2083-08-05': { name: 'हरिबोधिनी एकादशी / तुलसी विवाह (Haribodhini Ekadashi)', isHoliday: false },
  '2083-08-18': { name: 'उधौली पर्व / धान्य पूर्णिमा / यमरी पुन्हि (Udhauli Parva / Yomari Punhi)', isHoliday: true },
  '2083-10-12': { name: 'श्रीपञ्चमी / सरस्वती पूजा (Saraswati Puja / Shree Panchami)', isHoliday: false },
  '2083-10-26': { name: 'सोनाम ल्होसार (Sonam Lhosar)', isHoliday: true },
  '2083-11-22': { name: 'महाशिवरात्रि (Maha Shivaratri)', isHoliday: true },
  '2083-11-27': { name: 'ग्याल्पो ल्होसार (Gyalpo Lhosar)', isHoliday: true },
  '2083-12-08': { name: 'फागु पूर्णिमा - होली पहाड (Holi Festival - Hills)', isHoliday: true },
  '2083-12-09': { name: 'फागु पूर्णिमा - होली तराई (Holi Festival - Terai)', isHoliday: true },
  '2083-12-22': { name: 'घोडे जात्रा (Ghode Jatra)', isHoliday: true },
  '2083-12-29': { name: 'राम नवमी / चैते दशैँ (Ram Navami / Chaite Dashain)', isHoliday: true },

  // 2082 BS Events
  '2082-01-29': { name: 'बुद्ध जयन्ती / उभौली पर्व', isHoliday: true },
  '2082-04-24': { name: 'नाग पञ्चमी', isHoliday: false },
  '2082-05-03': { name: 'जनैपूर्णिमा / रक्षाबन्धन', isHoliday: true },
  '2082-05-04': { name: 'गाईजात्रा', isHoliday: true },
  '2082-05-10': { name: 'श्रीकृष्ण जन्माष्टमी', isHoliday: true },
  '2082-05-21': { name: 'हरितालिका तीज', isHoliday: true },
  '2082-06-13': { name: 'घटस्थापना', isHoliday: true },
  '2082-06-19': { name: 'फूलपाती', isHoliday: true },
  '2082-06-20': { name: 'महाअष्टमी', isHoliday: true },
  '2082-06-21': { name: 'महानवमी', isHoliday: true },
  '2082-06-22': { name: 'विजया दशमी (दशैँ टीका)', isHoliday: true },
  '2082-07-04': { name: 'लक्ष्मी पूजा (तिहार)', isHoliday: true },
  '2082-07-06': { name: 'भाइटीका', isHoliday: true },
  '2082-07-09': { name: 'छठ पर्व', isHoliday: true },
  '2082-11-14': { name: 'महाशिवरात्रि', isHoliday: true },
  '2082-11-29': { name: 'होली (फागु पूर्णिमा)', isHoliday: true },

  // 2084 BS Events
  '2084-01-28': { name: 'बुद्ध जयन्ती / उभौली पर्व', isHoliday: true },
  '2084-05-01': { name: 'जनैपूर्णिमा / रक्षाबन्धन', isHoliday: true },
  '2084-05-15': { name: 'हरितालिका तीज', isHoliday: true },
  '2084-07-02': { name: 'विजया दशमी', isHoliday: true },
  '2084-07-22': { name: 'लक्ष्मी पूजा', isHoliday: true },
  '2084-07-24': { name: 'भाइटीका', isHoliday: true },
};

/**
 * Get Hamro Patro / Nepali Patro event detail for a BS date and weekday
 */
export function getNepaliPatroEvent(bsDateStr: string, jsDate: Date): { eventName: string; isHoliday: boolean; holidayType: 'saturday' | 'festival' | 'none' } {
  const isSaturday = jsDate.getDay() === 0; // 0 = Sunday, 6 = Saturday in JS
  // Wait, in JS Date.getDay(): 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday.
  const dayOfWeekIdx = jsDate.getDay();
  const isSat = dayOfWeekIdx === 6;

  // 1. Check specific year calendar
  if (SPECIFIC_YEAR_EVENTS[bsDateStr]) {
    const ev = SPECIFIC_YEAR_EVENTS[bsDateStr];
    return {
      eventName: ev.name,
      isHoliday: isSat || !!ev.isHoliday,
      holidayType: ev.isHoliday ? 'festival' : (isSat ? 'saturday' : 'none')
    };
  }

  // 2. Check month-day fixed calendar (e.g. "04-01" for Shrawan 1)
  const parts = bsDateStr.split('-');
  if (parts.length === 3) {
    const mmdd = `${parts[1]}-${parts[2]}`;
    if (FIXED_BS_EVENTS[mmdd]) {
      const ev = FIXED_BS_EVENTS[mmdd];
      return {
        eventName: ev.name,
        isHoliday: isSat || !!ev.isHoliday,
        holidayType: ev.isHoliday ? 'festival' : (isSat ? 'saturday' : 'none')
      };
    }
  }

  // 3. Saturday
  if (isSat) {
    return {
      eventName: 'सार्वजनिक बिदा (शनिबार / Weekly Holiday)',
      isHoliday: true,
      holidayType: 'saturday'
    };
  }

  // 4. Regular Day
  return {
    eventName: 'साधारण कार्यदिन (Regular Working Day)',
    isHoliday: false,
    holidayType: 'none'
  };
}

/**
 * Get comprehensive Nepali Patro details for current or given date
 */
export function getFullNepaliPatroInfo(nowDate: Date = new Date()): NepaliPatroInfo {
  // Convert JS date to Nepal time (+5:45)
  const utc = nowDate.getTime() + (nowDate.getTimezoneOffset() * 60000);
  const nepalOffset = 5.75 * 3600000;
  const nepalJsDate = new Date(utc + nepalOffset);

  const nepaliDateObj = new NepaliDate(nepalJsDate);
  const yearBsNum = nepaliDateObj.getYear(); // e.g. 2083
  const monthBsIdx = nepaliDateObj.getMonth(); // 0-11
  const dateBsNum = nepaliDateObj.getDate(); // 1-32
  const dayOfWeekIdx = nepalJsDate.getDay(); // 0 = Sun, ..., 6 = Sat

  const yearBs = toNepaliDigits(yearBsNum);
  const monthBsName = NEPALI_MONTHS_NP[monthBsIdx] || '';
  const dayBs = toNepaliDigits(dateBsNum);
  const dayOfWeekNepali = DAYS_OF_WEEK_NP[dayOfWeekIdx] || '';
  const dayOfWeekEnglish = DAYS_OF_WEEK_EN[dayOfWeekIdx] || '';

  const monthBsPad = String(monthBsIdx + 1).padStart(2, '0');
  const dateBsPad = String(dateBsNum).padStart(2, '0');
  const bsDateStr = `${yearBsNum}-${monthBsPad}-${dateBsPad}`;

  // Formatted BS Nepali: "विसं २०८३ साउन २५ गते"
  const formattedBsNepali = `वि.सं. ${yearBs} ${monthBsName} ${dayBs} गते`;
  const formattedBsFull = `वि.सं. ${yearBs} ${monthBsName} ${dayBs}, ${dayOfWeekNepali}`;

  // AD Date Str
  const adYear = nepalJsDate.getFullYear();
  const adMonthName = AD_MONTHS_EN[nepalJsDate.getMonth()];
  const adMonthNp = AD_MONTHS_NP[nepalJsDate.getMonth()];
  const adDay = nepalJsDate.getDate();
  const adDateStr = `${adDay} ${adMonthName} ${adYear}`;

  // Nepali Time Format
  let hours = nepalJsDate.getHours();
  const mins = nepalJsDate.getMinutes();
  const secs = nepalJsDate.getSeconds();

  const ampm = hours >= 12 ? 'PM' : 'AM';
  let hours12 = hours % 12;
  hours12 = hours12 ? hours12 : 12;

  const hhNp = toNepaliDigits(String(hours12).padStart(2, '0'));
  const mmNp = toNepaliDigits(String(mins).padStart(2, '0'));
  const ssNp = toNepaliDigits(String(secs).padStart(2, '0'));

  let periodNp = 'बिहान';
  if (hours >= 12 && hours < 16) periodNp = 'दिउँसो';
  else if (hours >= 16 && hours < 20) periodNp = 'साँझ';
  else if (hours >= 20 || hours < 4) periodNp = 'राती';

  const nepaliTimeStr = `${hhNp}:${mmNp}:${ssNp} ${ampm}`;
  const nepaliTimePeriod = `${periodNp} ${hhNp}:${mmNp} बजे`;

  // Event & Holiday
  const eventData = getNepaliPatroEvent(bsDateStr, nepalJsDate);

  return {
    bsDateStr,
    formattedBsNepali,
    formattedBsFull,
    yearBs,
    monthBsName,
    dayBs,
    dayOfWeekNepali,
    dayOfWeekEnglish,
    adDateStr: `${adDay} ${adMonthName} ${adYear} (${adMonthNp})`,
    nepaliTimeStr,
    nepaliTimePeriod,
    specialEvent: eventData.eventName,
    isHoliday: eventData.isHoliday,
    holidayType: eventData.holidayType
  };
}
