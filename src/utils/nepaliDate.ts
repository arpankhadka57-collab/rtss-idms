// @ts-ignore
import NepaliDate from 'nepali-date-converter';

/**
 * Convert an AD Date (string, Date object, or timestamp) to a BS date string (YYYY-MM-DD)
 */
export function adToBs(adDate: string | Date | number): string {
  if (!adDate) return '';
  try {
    const jsDate = new Date(adDate);
    if (isNaN(jsDate.getTime())) return String(adDate);
    const nepali = new NepaliDate(jsDate);
    return nepali.format('YYYY-MM-DD');
  } catch (e) {
    return String(adDate);
  }
}

/**
 * Convert a BS date string (YYYY-MM-DD) to an AD Date object
 */
export function bsToAd(bsDateStr: string): Date | null {
  if (!bsDateStr) return null;
  try {
    // Expected format: YYYY-MM-DD or YYYY/MM/DD
    const parts = bsDateStr.replace(/\//g, '-').split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed in NepaliDate
    const date = parseInt(parts[2], 10);
    
    const nepali = new NepaliDate(year, month, date);
    return nepali.toJsDate();
  } catch (e) {
    return null;
  }
}

/**
 * Get the current date in BS (Bikram Sambat) format (YYYY-MM-DD)
 */
export function getCurrentBsDate(): string {
  const nepali = new NepaliDate();
  return nepali.format('YYYY-MM-DD');
}

/**
 * Format a BS date string (YYYY-MM-DD) into a human-readable Nepali date string
 * e.g., "2083-03-19" -> "19 Ashadh 2083"
 */
export function formatBsDate(bsDateStr: string): string {
  if (!bsDateStr) return '';
  const months = [
    'Baishakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
    'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
  ];
  try {
    const parts = bsDateStr.replace(/\//g, '-').split('-');
    if (parts.length !== 3) return bsDateStr;
    const year = parseInt(parts[0], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const date = parseInt(parts[2], 10);
    
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${date} ${months[monthIdx]} ${year}`;
    }
    return bsDateStr;
  } catch (e) {
    return bsDateStr;
  }
}

/**
 * Convert any saved date in the system to standard BS (YYYY-MM-DD). If the saved date is already in BS format (after 2050),
 * pad and return it. Otherwise, assume it's in AD and convert it.
 */
export function normalizeStandardBsDate(dateStr: any): string {
  if (!dateStr) return '';
  const clean = String(dateStr).trim().replace(/[/.]/g, '-');
  const parts = clean.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parts[1].padStart(2, '0');
    const d = parts[2].padStart(2, '0');
    if (!isNaN(y) && y > 2050) {
      return `${y}-${m}-${d}`;
    }
    // AD date, convert to BS
    try {
      const bs = adToBs(`${y}-${m}-${d}`);
      if (bs && bs.includes('-')) {
        const bsParts = bs.split('-');
        return `${bsParts[0].padStart(4, '0')}-${bsParts[1].padStart(2, '0')}-${bsParts[2].padStart(2, '0')}`;
      }
    } catch {
      // ignore
    }
  }
  return clean.slice(0, 10);
}

/**
 * Check if a date falls inclusively between fromDate and toDate in BS calendar
 */
export function isDateWithinRange(targetDate: any, fromDate: any, toDate: any): boolean {
  if (!targetDate || !fromDate || !toDate) return false;
  const target = normalizeStandardBsDate(targetDate);
  const from = normalizeStandardBsDate(fromDate);
  const to = normalizeStandardBsDate(toDate);
  const min = from <= to ? from : to;
  const max = from <= to ? to : from;
  if (!target || !min || !max) return false;
  return target >= min && target <= max;
}

/**
 * Convert any saved date in the system to BS. If the saved date is already in BS format (after 2050),
 * return it. Otherwise, assume it's in AD and convert it.
 */
export function ensureBsDate(dateStr: string): string {
  if (!dateStr) return '';
  return normalizeStandardBsDate(dateStr);
}

/**
 * Get the current time in Nepal format
 */
export function getCurrentNepalTime(): string {
  const now = new Date();
  // Get Nepal Time (+5:45)
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const nepalOffset = 5.75 * 3600000;
  const nepalDate = new Date(utc + nepalOffset);
  
  let hours = nepalDate.getHours();
  const minutes = nepalDate.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minStr} ${ampm}`;
}

/**
 * Format a BS year-month prefix (YYYY-MM) to a human-readable month and year
 * e.g. "2083-03" -> "Ashadh 2083"
 */
export function formatBsMonth(bsMonthStr: string): string {
  if (!bsMonthStr) return '';
  const months = [
    'Baishakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
    'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
  ];
  try {
    const parts = bsMonthStr.split('-');
    if (parts.length < 2) return bsMonthStr;
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${months[monthIdx]} ${year}`;
    }
    return bsMonthStr;
  } catch (e) {
    return bsMonthStr;
  }
}

/**
 * Get the BS year of a date string
 */
export function getBsYear(dateStr: string): string {
  const bsDate = ensureBsDate(dateStr);
  return bsDate.split('-')[0] || '';
}

/**
 * Get the Nepalese Fiscal Year (e.g. "2082/83") for a given Nepali date string (YYYY-MM-DD)
 */
export function getNepaleseFiscalYear(dateStr: string): string {
  const bsDate = ensureBsDate(dateStr);
  const parts = bsDate.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  
  if (isNaN(year) || isNaN(month)) return '';
  
  const startYear = month >= 4 ? year : year - 1;
  const endYear = startYear + 1;
  const endYearShort = String(endYear).slice(-2);
  
  return `${startYear}/${endYearShort}`;
}

/**
 * Parse the starting year of a fiscal year string (e.g. "2082/83" -> 2082)
 */
export function parseFYStartYear(fyStr: string): number {
  const match = fyStr.match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Calculate the sequence number for a given date, resetting on Shrawan 1
 * ONLY if the previous fiscal year's Annual closing is approved.
 */
export function getSequenceNumber(
  date: string,
  existingItems: { date: string; dateCreated?: string }[],
  periodicClosings: { duration: string; status: string; period: string }[] = [],
  useDateCreated: boolean = false
): number {
  const currentFY = getNepaleseFiscalYear(date);
  const currentFYStart = parseFYStartYear(currentFY);
  
  // Find all approved Annual closings
  const approvedAnnuals = periodicClosings.filter(
    c => c.duration === 'Annual' && c.status === 'Approved'
  );
  
  // Find the latest closed fiscal year start year
  let maxClosedFYStart = 0;
  for (const c of approvedAnnuals) {
    const closedStart = parseFYStartYear(c.period);
    if (closedStart > maxClosedFYStart) {
      maxClosedFYStart = closedStart;
    }
  }
  
  // If the immediate previous fiscal year is closed (meaning we reset):
  if (currentFYStart > maxClosedFYStart && maxClosedFYStart === currentFYStart - 1) {
    // Previous year is closed. Reset and count only current year items.
    const count = existingItems.filter(item => {
      const d = useDateCreated ? (item.dateCreated || date) : item.date;
      return getNepaleseFiscalYear(d) === currentFY;
    }).length;
    return count + 1;
  } else {
    // Previous year not closed. Do not reset.
    // Count all items whose fiscal year start is > maxClosedFYStart.
    const count = existingItems.filter(item => {
      const d = useDateCreated ? (item.dateCreated || date) : item.date;
      const itemFY = getNepaleseFiscalYear(d);
      const itemFYStart = parseFYStartYear(itemFY);
      return itemFYStart > maxClosedFYStart;
    }).length;
    return count + 1;
  }
}

/**
 * Generate serial number for Invoices resetting in Shrawan 1 (Nepali Fiscal Year)
 * e.g., RTSS-INVOICE-2082/83-001
 */
export function generateInvoiceNumber(
  date: string,
  existingInvoices: { date: string }[],
  periodicClosings: any[] = []
): string {
  const seq = getSequenceNumber(date, existingInvoices, periodicClosings);
  const fiscalYear = getNepaleseFiscalYear(date);
  return `RTSS-INV-${fiscalYear}-${String(seq).padStart(3, '0')}`;
}

/**
 * Convert any decimal or integer number to verbal English currency words (Rupees and Paisa)
 * adhering to the South Asian / Nepalese numbering layout (Lakh, Crore, etc.).
 */
export function numberToWords(numInput: number | string): string {
  const numStr = String(numInput).trim();
  const num = parseFloat(numStr) || 0;
  if (num === 0) return "Nepali Rupees Zero Only";
  
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", 
                "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  function convertLessThanOneThousand(n: number): string {
    let str = "";
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + " ";
    }
    return str.trim();
  }
  
  const integerPart = Math.floor(num);
  
  let decimalPart = 0;
  if (numStr.includes(".")) {
    const decStr = numStr.split(".")[1] || "";
    if (decStr.length > 0) {
      const paddedDecStr = decStr.length === 1 ? decStr + "0" : decStr.slice(0, 2);
      decimalPart = parseInt(paddedDecStr, 10) || 0;
    }
  } else {
    decimalPart = Math.round((num - integerPart) * 100);
  }
  
  let words = "";
  let tempInt = integerPart;
  
  if (tempInt >= 10000000) { // Crore
    const crore = Math.floor(tempInt / 10000000);
    words += convertLessThanOneThousand(crore) + " Crore ";
    tempInt %= 10000000;
  }
  if (tempInt >= 100000) { // Lakh
    const lakh = Math.floor(tempInt / 100000);
    words += convertLessThanOneThousand(lakh) + " Lakh ";
    tempInt %= 100000;
  }
  if (tempInt >= 1000) { // Thousand
    const thousand = Math.floor(tempInt / 1000);
    words += convertLessThanOneThousand(thousand) + " Thousand ";
    tempInt %= 1000;
  }
  if (tempInt > 0) {
    words += convertLessThanOneThousand(tempInt);
  }
  
  let decimalWords = "";
  if (decimalPart > 0) {
    let tempDec = decimalPart;
    if (tempDec >= 20) {
      decimalWords += tens[Math.floor(tempDec / 10)] + " ";
      tempDec %= 10;
    }
    if (tempDec > 0) {
      decimalWords += ones[tempDec] + " ";
    }
  }
  
  let result = "";
  const mainWords = words.trim();
  const decWords = decimalWords.trim();
  
  if (mainWords) {
    result = "Nepali Rupees " + mainWords;
    if (decWords) {
      result += " and " + decWords + " Paisa";
    }
  } else if (decWords) {
    result = "Nepali Rupees " + decWords + " Paisa";
  } else {
    result = "Nepali Rupees Zero";
  }
  
  return result + " Only";
}

/**
 * Generate serial number for Purchase Orders (Supply Transactions) resetting in Shrawan 1
 */
export function generatePoNumber(
  date: string,
  existingTransactions: { date: string }[],
  periodicClosings: any[] = []
): string {
  const seq = getSequenceNumber(date, existingTransactions, periodicClosings);
  const fiscalYear = getNepaleseFiscalYear(date);
  return `RTSS-PO-${fiscalYear}-${String(seq).padStart(3, '0')}`;
}

/**
 * Generate serial number for Official Letters dispatch resetting in Shrawan 1
 */
export function generateLetterDispatchNumber(
  date: string,
  existingLetters: { date: string }[],
  periodicClosings: any[] = []
): string {
  const seq = getSequenceNumber(date, existingLetters, periodicClosings);
  const fiscalYear = getNepaleseFiscalYear(date);
  return `RTSS-LETTER-${fiscalYear}-${String(seq).padStart(3, '0')}`;
}

/**
 * Generate serial number for Inventory Requests resetting in Shrawan 1
 */
export function generateInventoryNo(
  date: string,
  existingRequests: { date: string }[],
  periodicClosings: any[] = []
): string {
  const seq = getSequenceNumber(date, existingRequests, periodicClosings);
  const fiscalYear = getNepaleseFiscalYear(date);
  return `RTSS-INVENTORY-${fiscalYear}-${String(seq).padStart(3, '0')}`;
}

/**
 * Generate serial number for Expenses resetting in Shrawan 1
 */
export function generateExpenseNo(
  date: string,
  existingExpenses: { date: string }[],
  periodicClosings: any[] = []
): string {
  const seq = getSequenceNumber(date, existingExpenses, periodicClosings);
  const fiscalYear = getNepaleseFiscalYear(date);
  return `RTSS-EXP-${fiscalYear}-${String(seq).padStart(3, '0')}`;
}

/**
 * Generate serial number for Meeting Minutes resetting in Shrawan 1 (Nepali Fiscal Year)
 * e.g., RTSS-2082/83-0001
 */
export function generateMeetingNumber(
  date: string,
  existingMeetings: { meetingDate?: string; date?: string }[],
  periodicClosings: any[] = []
): string {
  const mapped = existingMeetings.map(m => ({ date: m.meetingDate || m.date || getCurrentBsDate() }));
  const seq = getSequenceNumber(date, mapped, periodicClosings);
  const fiscalYear = getNepaleseFiscalYear(date);
  return `RTSS-${fiscalYear}-${String(seq).padStart(4, '0')}`;
}

/**
 * Generate serial number for Service Requests resetting in Shrawan 1
 */
export function generateServiceRequestNo(
  date: string,
  existingRequests: { dateCreated: string }[],
  periodicClosings: any[] = []
): string {
  // Map dateCreated to date field for generic sequence helper
  const mapped = existingRequests.map(r => ({ date: r.dateCreated }));
  const seq = getSequenceNumber(date, mapped, periodicClosings);
  const fiscalYear = getNepaleseFiscalYear(date);
  return `RTSS-SERV-${fiscalYear}-${String(seq).padStart(3, '0')}`;
}

/**
 * Formats a transaction into the standard PO number: RTSS-PO-[FY]-[Seq]
 */
export function getFormattedPoNumber(
  tx: { id: string; date: string },
  transactions: { id: string; date: string }[]
): string {
  if (!tx) return '';
  const sortedTx = [...transactions]
    .filter(t => t.date <= tx.date)
    .sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.id.localeCompare(b.id);
    });
  
  const index = sortedTx.findIndex(t => t.id === tx.id);
  const seq = index >= 0 ? index + 1 : 1;
  const fiscalYear = getNepaleseFiscalYear(tx.date) || '2082/83';
  return `RTSS-PO-${fiscalYear}-${String(seq).padStart(3, '0')}`;
}

/**
 * Convert ASCII numbers to Nepali digits (0-9 -> ०-९)
 */
export function toNepaliDigits(numStr: string | number): string {
  if (numStr === undefined || numStr === null) return '';
  const map: { [k: string]: string } = {
    '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
    '5': '५', '6': '६', '7': '७', '8': '८', '9': '९'
  };
  return String(numStr).replace(/[0-9]/g, m => map[m] || m);
}

/**
 * Get day of week in Nepali for a given BS date
 */
export function getDayOfWeekNepali(bsDateStr: string): string {
  const jsDate = bsToAd(bsDateStr);
  if (!jsDate) return 'सोमबार';
  const days = ['आइतबार', 'सोमबार', 'मङ्गलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'];
  return days[jsDate.getDay()];
}

/**
 * Get day of week in English for a given BS date
 */
export function getDayOfWeekEnglish(bsDateStr: string): string {
  const jsDate = bsToAd(bsDateStr);
  if (!jsDate) return 'Monday';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[jsDate.getDay()];
}

/**
 * Formats start time for Nepali meeting minutes according to Nepali periods:
 * - Before 10:00 AM (3:00 AM to 9:59 AM): बिहान HH:MM बजे
 * - 10:00 AM to 4:00 PM: दिउँसो HH:MM बजे
 * - After 4:00 PM till 10:00 PM: साँझ HH:MM बजे
 * - After 10:00 PM till 3:00 AM: राती HH:MM बजे
 */
export function formatNepaliStartTime(startTimeStr: string): string {
  if (!startTimeStr || !startTimeStr.trim()) return 'बिहान १०:०० बजे';

  const str = startTimeStr.trim();
  const isPM = /pm/i.test(str);
  const isAM = /am/i.test(str);

  // Extract digits
  const timeOnly = str.replace(/[^\d:]/g, '');
  const parts = timeOnly.split(':');
  if (parts.length < 1 || !parts[0]) return 'बिहान १०:०० बजे';

  let rawHour = parseInt(parts[0], 10);
  let rawMin = parts[1] ? parseInt(parts[1], 10) : 0;
  if (isNaN(rawHour)) rawHour = 10;
  if (isNaN(rawMin)) rawMin = 0;

  // Convert to 24-hour hour
  let hour24 = rawHour;
  if (isPM && rawHour < 12) {
    hour24 = rawHour + 12;
  } else if (isAM && rawHour === 12) {
    hour24 = 0;
  }

  // Total minutes from midnight
  const totalMins = hour24 * 60 + rawMin;

  // Periods:
  // Before 10:00 AM (3:00 AM / 180 mins to 9:59 AM / 599 mins): बिहान
  // 10:00 AM to 4:00 PM (600 mins to 960 mins): दिउँसो
  // After 4:00 PM till 10:00 PM (961 mins to 1320 mins): साँझ
  // After 10:00 PM till 3:00 AM (1321 mins to 179 mins): राती
  let prefix = 'बिहान';
  if (totalMins >= 600 && totalMins <= 960) {
    prefix = 'दिउँसो';
  } else if (totalMins > 960 && totalMins <= 1320) {
    prefix = 'साँझ';
  } else if (totalMins > 1320 || totalMins < 180) {
    prefix = 'राती';
  } else {
    prefix = 'बिहान';
  }

  // Calculate 12-hour display hour
  let displayHour = hour24 % 12;
  if (displayHour === 0) displayHour = 12;

  const hh = toNepaliDigits(String(displayHour).padStart(2, '0'));
  const mm = toNepaliDigits(String(rawMin).padStart(2, '0'));

  return `${prefix} ${hh}:${mm} बजे`;
}

/**
 * Generate formal closing statement for Nepali meeting minutes:
 * e.g. "इति सम्बत् २०८३ साल साउन महिना ७ गते रोज ४ (बुधबार) शुभम् ।"
 */
export function getNepaliMeetingEndingColophon(bsDateStr: string): string {
  if (!bsDateStr) return 'इति सम्बत् २०८३ साल साउन महिना ७ गते रोज ४ (बुधबार) शुभम् ।';
  try {
    const parts = bsDateStr.replace(/\//g, '-').split('-');
    if (parts.length !== 3) return `इति सम्बत् ${toNepaliDigits(bsDateStr)} शुभम् ।`;

    const yearBs = toNepaliDigits(parts[0]);
    const monthNum = parseInt(parts[1], 10);
    const dayBs = toNepaliDigits(parseInt(parts[2], 10));

    const nepaliMonths = [
      'वैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज',
      'कात्तिक', 'मङ्सीर', 'पुस', 'माघ', 'फागुन', 'चैत'
    ];
    const monthName = nepaliMonths[monthNum - 1] || 'महिना';

    const jsDate = bsToAd(bsDateStr);
    let dayCount = 1;
    let dayName = 'आइतबार';

    if (jsDate) {
      const dayIdx = jsDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
      dayCount = dayIdx + 1; // 1 = Sun, 2 = Mon, 3 = Tue, 4 = Wed, 5 = Thu, 6 = Fri, 7 = Sat
      const nepaliDays = ['आइतबार', 'सोमबार', 'मङ्गलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'];
      dayName = nepaliDays[dayIdx];
    }

    const dayCountNepali = toNepaliDigits(dayCount);

    return `इति सम्बत् ${yearBs} साल ${monthName} महिना ${dayBs} गते रोज ${dayCountNepali} (${dayName}) शुभम् ।`;
  } catch (e) {
    return 'इति सम्बत् ... शुभम् ।';
  }
}



