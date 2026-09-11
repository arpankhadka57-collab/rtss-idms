import { DailyClosing, PeriodicClosing, AppUser } from '../types';

export function isReliableAdminMaster(user?: AppUser | { username?: string; role?: string; name?: string; email?: string } | null): boolean {
  if (!user) return false;
  const username = (user.username || '').toLowerCase().trim();
  const name = (user.name || '').toLowerCase().trim();
  const email = ((user as any).email || '').toLowerCase().trim();
  const role = user.role;
  return (
    username === 'reliableadmin' ||
    username === 'arpan' ||
    role === 'Super Admin' ||
    name.includes('reliableadmin') ||
    name.includes('arpan') ||
    email === 'arpankhadka57@gmail.com'
  );
}

export function checkDateLock(
  dateStr: string,
  dailyClosings: DailyClosing[] = [],
  periodicClosings: PeriodicClosing[] = [],
  options?: { isDueAction?: boolean }
): { locked: boolean; reason: string; closingType?: string; period?: string } {
  if (!dateStr) return { locked: false, reason: '' };

  const normDate = dateStr.trim();

  // 1. Daily Closing Check - Strict enforcement: When daily closing is done, NO transaction can be performed!
  const daily = dailyClosings.find(c => c.date === normDate);
  if (daily && (daily.status === 'Approved' || daily.status === 'Pending') && !daily.unlocked) {
    return {
      locked: true,
      closingType: 'Daily',
      period: normDate,
      reason: `⚠️ Daily closing has been completed and locked for ${normDate}. No transaction (sales invoice, purchase, expense, due payment, due collection, salary payout, or fund transfer) can be performed for this date until the daily closing is unlocked by @reliableadmin (System Master).`
    };
  }

  // Periodic exception: Due collection (from customers) and due payment (to suppliers) are allowed for periodic locks only
  if (options?.isDueAction) {
    return { locked: false, reason: '' };
  }

  // Parse transaction date parts (YYYY-MM-DD)
  const parts = normDate.split('-');
  if (parts.length < 3) return { locked: false, reason: '' };
  const txYear = parseInt(parts[0], 10);
  const txMonth = parseInt(parts[1], 10);

  // 2. Periodic Closings Check (Monthly, 3 Monthly, 6 Monthly, 9 Monthly, Annual, etc.)
  for (const closing of periodicClosings) {
    // If it is unlocked, skip it!
    if (closing.unlocked) {
      continue;
    }

    // Only lock when status is Approved
    if (closing.status !== 'Approved') {
      continue;
    }

    // A. Check exact date range if fromDate and toDate are available
    if (closing.fromDate && closing.toDate) {
      if (normDate >= closing.fromDate && normDate <= closing.toDate) {
        return {
          locked: true,
          closingType: closing.duration,
          period: closing.period,
          reason: `⚠️ ${closing.duration} closing for "${closing.period}" (${closing.fromDate} to ${closing.toDate}) has been completed and locked. You cannot perform or change transactions for this closed period until it is unlocked by @reliableadmin user account (System Master). Note: Due can be collected and paid.`
        };
      }
    }

    const duration = closing.duration;
    const periodLower = (closing.period || '').toLowerCase();

    // B. Check Monthly by year + month variants
    if (duration === 'Monthly' && !isNaN(txYear) && !isNaN(txMonth)) {
      const yearMatches = periodLower.includes(String(txYear));
      const variants = monthVariants[txMonth] || [];
      const monthMatches = variants.some(v => periodLower.includes(v)) || periodLower.includes(`-${String(txMonth).padStart(2, '0')}`) || periodLower.includes(`/${String(txMonth).padStart(2, '0')}`);

      if (yearMatches && monthMatches) {
        return {
          locked: true,
          closingType: 'Monthly',
          period: closing.period,
          reason: `⚠️ Monthly closing for "${closing.period}" has been completed and locked. Any transaction for this closed month cannot be created or changed until the monthly closing is unlocked by @reliableadmin user account (System Master). Note: Due can be collected and paid.`
        };
      }
    } else if (duration === 'Annual' && !isNaN(txYear)) {
      const yearStr = String(txYear);
      const shortYearStr = String(txYear % 100);
      const yearMatches = periodLower.includes(yearStr) || periodLower.includes(shortYearStr);

      if (yearMatches) {
        return {
          locked: true,
          closingType: 'Annual',
          period: closing.period,
          reason: `⚠️ Annual / Yearly closing for "${closing.period}" has been completed and locked. Transactions for this closed year cannot be created or changed until unlocked by @reliableadmin user account (System Master). Note: Due can be collected and paid.`
        };
      }
    } else if ((duration === '3 Monthly' || duration === '6 Monthly' || duration === '9 Monthly') && !isNaN(txYear) && !isNaN(txMonth)) {
      const yearMatches = periodLower.includes(String(txYear));
      const variants = monthVariants[txMonth] || [];
      const monthMatches = variants.some(v => periodLower.includes(v));

      if (yearMatches && monthMatches) {
        return {
          locked: true,
          closingType: duration,
          period: closing.period,
          reason: `⚠️ ${duration} periodic closing for "${closing.period}" has been completed and locked. Transactions for this closed period cannot be created or changed until unlocked by @reliableadmin user account (System Master). Note: Due can be collected and paid.`
        };
      }
    }
  }

  return { locked: false, reason: '' };
}

const monthVariants: Record<number, string[]> = {
  1: ['baishakh', 'baisakh'],
  2: ['jestha', 'jetha', 'jeth'],
  3: ['ashadh', 'asadh', 'ashad', 'asad'],
  4: ['shrawan', 'sawan', 'shravan'],
  5: ['bhadra', 'bhado', 'bhadau'],
  6: ['ashwin', 'asoj', 'aswin', 'ashvin'],
  7: ['kartik', 'kartikh'],
  8: ['mangsir', 'marg', 'margsir'],
  9: ['poush', 'pus', 'paush'],
  10: ['magh'],
  11: ['falgun', 'phagun'],
  12: ['chaitra', 'chait']
};
