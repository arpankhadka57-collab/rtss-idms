import React, { useMemo } from 'react';
import { getCurrentBsDate, bsToAd, formatBsMonth } from '../utils/nepaliDate';
import { 
  Wrench, 
  Users, 
  DollarSign, 
  ShoppingBag, 
  MapPin, 
  Phone, 
  Mail, 
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Coins,
  CreditCard,
  Building,
  Package,
  CalendarDays,
  Calendar,
  AlertOctagon,
  User
} from 'lucide-react';
import { BusinessService, Supplier, SupplyTransaction, BusinessProfile, SalesInvoice, Expense, InventoryItem, AppUser, AttendanceRecord, AttendanceRequest, PeriodicClosing, AccountTransaction, DailyClosing, EditRequest, OpeningBalances } from '../types';

interface DashboardProps {
  profile: BusinessProfile;
  services: BusinessService[];
  suppliers: Supplier[];
  transactions: SupplyTransaction[];
  invoices: SalesInvoice[];
  expenses: Expense[];
  inventoryStock: InventoryItem[];
  onNavigate: (tab: string) => void;
  currentUser?: AppUser;
  attendanceRecords?: AttendanceRecord[];
  attendanceRequests?: AttendanceRequest[];
  onAddAttendanceRequest?: (req: AttendanceRequest) => void;
  periodicClosings?: PeriodicClosing[];
  openingBalances?: OpeningBalances;
  accountTransfers?: AccountTransaction[];
  dailyClosings?: DailyClosing[];
  editRequests?: EditRequest[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  services,
  suppliers,
  transactions,
  invoices,
  expenses,
  inventoryStock,
  onNavigate,
  currentUser,
  attendanceRecords = [],
  attendanceRequests = [],
  onAddAttendanceRequest,
  periodicClosings = [],
  openingBalances = {},
  accountTransfers = [],
  dailyClosings = [],
  editRequests = []
}) => {
  
  // Time-based greeting helper
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Date Helpers for current day and month (Dynamic Nepal B.S.)
  const targetToday = getCurrentBsDate();
  const targetMonth = targetToday.slice(0, 7); // e.g. "2083-03"

  // Periodic Closing Notifications logic
  const closingNotifications = React.useMemo(() => {
    if (currentUser?.role !== 'Admin' && currentUser?.role !== 'Super Admin') return [];
    
    const notifications: { id: string; type: string; title: string; message: string; duration: string; period: string }[] = [];
    const [currYear, currMonth] = targetToday.split('-').map(x => parseInt(x, 10));
    if (isNaN(currYear) || isNaN(currMonth)) return [];

    const startYear = currMonth >= 4 ? currYear : currYear - 1;
    const fyMonths = [
      { monthNum: 4, year: startYear, monthName: "Shrawan", fyMonthIndex: 1 },
      { monthNum: 5, year: startYear, monthName: "Bhadra", fyMonthIndex: 2 },
      { monthNum: 6, year: startYear, monthName: "Ashwin", fyMonthIndex: 3 },
      { monthNum: 7, year: startYear, monthName: "Kartik", fyMonthIndex: 4 },
      { monthNum: 8, year: startYear, monthName: "Mangsir", fyMonthIndex: 5 },
      { monthNum: 9, year: startYear, monthName: "Poush", fyMonthIndex: 6 },
      { monthNum: 10, year: startYear, monthName: "Magh", fyMonthIndex: 7 },
      { monthNum: 11, year: startYear, monthName: "Falgun", fyMonthIndex: 8 },
      { monthNum: 12, year: startYear, monthName: "Chaitra", fyMonthIndex: 9 },
      { monthNum: 1, year: startYear + 1, monthName: "Baisakh", fyMonthIndex: 10 },
      { monthNum: 2, year: startYear + 1, monthName: "Jestha", fyMonthIndex: 11 },
      { monthNum: 3, year: startYear + 1, monthName: "Ashadh", fyMonthIndex: 12 }
    ];

    const isMonthCompleted = (m: { monthNum: number; year: number }) => {
      if (currYear > m.year) return true;
      if (currYear === m.year && currMonth > m.monthNum) return true;
      return false;
    };

    const isMonthlyClosingApproved = (monthName: string, year: number) => {
      const periodStr = `${monthName} ${year}`;
      return periodicClosings.some(
        c => c.duration === 'Monthly' && c.status === 'Approved' && c.period === periodStr
      );
    };

    // 1. Check Monthly closings for completed months
    for (const m of fyMonths) {
      if (isMonthCompleted(m)) {
        if (!isMonthlyClosingApproved(m.monthName, m.year)) {
          notifications.push({
            id: `monthly-${m.monthName}-${m.year}`,
            type: 'Monthly',
            title: `Monthly Closing Pending (${m.monthName} ${m.year})`,
            message: `The month of ${m.monthName} ${m.year} has completed. Please review and finalize its 5-account balance matrix to close the books.`,
            duration: 'Monthly',
            period: `${m.monthName} ${m.year}`
          });
        }
      }
    }

    const isPeriodClosingApproved = (duration: string, periodContains: string) => {
      return periodicClosings.some(
        c => c.duration === duration && c.status === 'Approved' && c.period.toLowerCase().includes(periodContains.toLowerCase())
      );
    };

    // 2. 3-Month Closing Notification (Ashwin, index 3)
    const ashwinMonth = fyMonths[2];
    if (isMonthCompleted(ashwinMonth)) {
      if (isMonthlyClosingApproved(ashwinMonth.monthName, ashwinMonth.year)) {
        if (!isPeriodClosingApproved('3 Monthly', 'Ashwin') && !isPeriodClosingApproved('3 Monthly', 'Q1')) {
          notifications.push({
            id: `3-monthly-ashwin`,
            type: '3 Monthly',
            title: `1st Quarter (3-Month) Closing Pending`,
            message: `The first 3 months (Shrawan - Ashwin) are completed and Ashwin monthly closing is locked. Please perform the 3-Month Quarterly Closing.`,
            duration: '3 Monthly',
            period: `Shrawan - Ashwin ${startYear}`
          });
        }
      }
    }

    // 3. 6-Month Closing Notification (Poush, index 6)
    const poushMonth = fyMonths[5];
    if (isMonthCompleted(poushMonth)) {
      if (isMonthlyClosingApproved(poushMonth.monthName, poushMonth.year)) {
        if (!isPeriodClosingApproved('6 Monthly', 'Poush') && !isPeriodClosingApproved('6 Monthly', 'Half-Year')) {
          notifications.push({
            id: `6-monthly-poush`,
            type: '6 Monthly',
            title: `Half-Yearly (6-Month) Closing Pending`,
            message: `The first 6 months (Shrawan - Poush) are completed and Poush monthly closing is locked. Please perform the 6-Month Half-Yearly Closing.`,
            duration: '6 Monthly',
            period: `Shrawan - Poush ${startYear}`
          });
        }
      }
    }

    // 4. 9-Month Closing Notification (Chaitra, index 9)
    const chaitraMonth = fyMonths[8];
    if (isMonthCompleted(chaitraMonth)) {
      if (isMonthlyClosingApproved(chaitraMonth.monthName, chaitraMonth.year)) {
        if (!isPeriodClosingApproved('9 Monthly', 'Chaitra')) {
          notifications.push({
            id: `9-monthly-chaitra`,
            type: '9 Monthly',
            title: `9-Month Closing Pending`,
            message: `The first 9 months (Shrawan - Chaitra) are completed and Chaitra monthly closing is locked. Please perform the 9-Month Closing.`,
            duration: '9 Monthly',
            period: `Shrawan - Chaitra ${startYear}/${String(startYear + 1).slice(-2)}`
          });
        }
      }
    }

    // 5. Annual Closing Notification (Ashadh, index 12)
    const ashadhMonth = fyMonths[11];
    if (isMonthCompleted(ashadhMonth)) {
      if (isMonthlyClosingApproved(ashadhMonth.monthName, ashadhMonth.year)) {
        const fyStr = `${startYear}/${String(startYear + 1).slice(-2)}`;
        if (!isPeriodClosingApproved('Annual', fyStr) && !isPeriodClosingApproved('Annual', 'Ashadh')) {
          notifications.push({
            id: `annual-ashadh`,
            type: 'Annual',
            title: `Annual (Year-End) Closing Pending`,
            message: `The Fiscal Year ${fyStr} has completed and Ashadh monthly closing is locked. Please perform the Year-End (Annual) Closing to lock books and rollover stock.`,
            duration: 'Annual',
            period: fyStr
          });
        }
      }
    }

    return notifications;
  }, [currentUser, targetToday, periodicClosings]);

  // Helper to check days ago using B.S. dates translated to A.D.
  const getDaysAgo = (dateStr: string) => {
    if (!dateStr) return 0;
    const current = bsToAd(targetToday) || new Date();
    const target = bsToAd(dateStr) || new Date();
    const diffTime = current.getTime() - target.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  };

  // --- 1. FILTERED METRICS FOR THIS MONTH & TODAY ---
  const invoicesThisMonth = invoices.filter(inv => inv.date.startsWith(targetMonth));
  const invoicesToday = invoices.filter(inv => inv.date === targetToday);

  const expensesThisMonth = expenses.filter(exp => exp.status === 'Approved' && exp.date.startsWith(targetMonth));
  const expensesToday = expenses.filter(exp => exp.status === 'Approved' && exp.date === targetToday);

  // --- 2. TOTAL SALES ---
  const salesThisMonth = invoicesThisMonth.reduce((sum, inv) => sum + inv.finalAmount, 0);
  const salesToday = invoicesToday.reduce((sum, inv) => sum + inv.finalAmount, 0);

  // --- 3. TOTAL INCOME (CASH RECEIVED) ---
  const incomeThisMonth = invoicesThisMonth.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const incomeToday = invoicesToday.reduce((sum, inv) => sum + inv.paidAmount, 0);

  // --- 4. TOTAL EXPENDITURE (APPROVED EXPENSES) ---
  const expenditureThisMonth = expensesThisMonth.reduce((sum, exp) => sum + exp.amount, 0);
  const expenditureToday = expensesToday.reduce((sum, exp) => sum + exp.amount, 0);

  // --- 5. ACCOUNT BALANCES (INCOME RECEIVED - EXPENSES DISBURSED) ---
  const accountsList = ['Cash', 'Esewa', 'Sahakari', 'RBB'] as const;

  const getAccountSummary = (accName: string, scope: 'month' | 'today') => {
    const invList = scope === 'month' ? invoicesThisMonth : invoicesToday;
    const expList = scope === 'month' ? expensesThisMonth : expensesToday;

    const accKey = (accName === 'Cash' ? 'CASH' : accName.toUpperCase()) as 'CASH' | 'ESEWA' | 'SAHAKARI' | 'RBB';

    // 1. Invoice Sales receipts
    const incomeFromInvoices = invList
      .reduce((sum, inv) => {
        const method = inv.paymentMethod === 'Bank' ? 'RBB' : inv.paymentMethod;
        if (method === accName) {
          return sum + inv.paidAmount;
        } else if (inv.paymentMethod === 'Split' && inv.paymentSplits) {
          let key = accName.toLowerCase();
          if (key === 'bank' || key === 'rbb') {
            key = 'rbb';
          }
          const splitAmt = inv.paymentSplits[key as keyof typeof inv.paymentSplits] || 0;
          return sum + splitAmt;
        }
        return sum;
      }, 0);

    // 2. Approved Expenses
    const expenseDisbursed = expList
      .filter(exp => {
        const method = exp.paymentMethod === 'Bank' ? 'RBB' : exp.paymentMethod;
        return method === accName;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);

    // Filter other events based on the date scope
    const filteredTransfers = accountTransfers.filter(tx => {
      if (scope === 'today') {
        return tx.date === targetToday;
      } else {
        return tx.date.startsWith(targetMonth);
      }
    });

    const filteredDailyClosings = dailyClosings.filter(c => {
      if (c.status !== 'Approved') return false;
      if (scope === 'today') {
        return c.date === targetToday;
      } else {
        return c.date.startsWith(targetMonth);
      }
    });

    const filteredEditRequests = editRequests.filter(req => {
      if (req.type !== 'Payment Collection' || req.status !== 'Approved') return false;
      if (scope === 'today') {
        return req.date === targetToday;
      } else {
        return req.date.startsWith(targetMonth);
      }
    });

    // 3. Account transfers (Withdrawals, Deposits, Inter-Account transfers)
    let transfersFlow = 0;
    filteredTransfers.forEach(tx => {
      if (tx.amount <= 0) return;
      const sourceNorm = tx.sourceAccount.toUpperCase() as 'CASH' | 'ESEWA' | 'SAHAKARI' | 'RBB';
      const destNorm = tx.destinationAccount ? tx.destinationAccount.toUpperCase() as 'CASH' | 'ESEWA' | 'SAHAKARI' | 'RBB' : null;

      if (tx.type === 'Transfer') {
        if (sourceNorm === accKey) {
          transfersFlow -= tx.amount;
        }
        if (destNorm === accKey) {
          transfersFlow += tx.amount;
        }
      } else if (tx.type === 'Withdrawal') {
        // Withdrawal from bank account into Cash
        if (sourceNorm === accKey) {
          transfersFlow -= tx.amount;
        }
        if (accKey === 'CASH') {
          transfersFlow += tx.amount;
        }
      } else if (tx.type === 'Deposit') {
        // Deposit cash from Cash vault into bank/wallet account
        if (sourceNorm === accKey) {
          transfersFlow += tx.amount;
        }
        if (accKey === 'CASH') {
          transfersFlow -= tx.amount;
        }
      }
    });

    // 4. Approved Daily Closing deposits
    let closingsFlow = 0;
    filteredDailyClosings.forEach(c => {
      if (c.splitDeposits && c.splitDeposits.length > 0) {
        c.splitDeposits.forEach(s => {
          if (s.amount > 0 && s.targetAccount) {
            const targetNorm = s.targetAccount.toUpperCase() as 'CASH' | 'ESEWA' | 'SAHAKARI' | 'RBB';
            if (accKey === 'CASH') {
              closingsFlow -= s.amount;
            }
            if (targetNorm === accKey) {
              closingsFlow += s.amount;
            }
          }
        });
      } else if (c.depositTarget && c.depositTarget !== 'None' && c.depositTarget !== 'Split' && c.depositAmount > 0) {
        const targetNorm = c.depositTarget.toUpperCase() as 'CASH' | 'ESEWA' | 'SAHAKARI' | 'RBB';
        if (accKey === 'CASH') {
          closingsFlow -= c.depositAmount;
        }
        if (targetNorm === accKey) {
          closingsFlow += c.depositAmount;
        }
      }
    });

    // 5. Approved customer dues payment collections
    let collectionsFlow = 0;
    filteredEditRequests.forEach(req => {
      if (req.paymentDetails && req.paymentDetails.amount > 0) {
        const methodNorm = (req.paymentDetails.method === 'Bank' ? 'RBB' : req.paymentDetails.method).toUpperCase() as 'CASH' | 'ESEWA' | 'SAHAKARI' | 'RBB';
        if (methodNorm === accKey) {
          collectionsFlow += req.paymentDetails.amount;
        }
      }
    });

    return incomeFromInvoices - expenseDisbursed + transfersFlow + closingsFlow + collectionsFlow;
  };

  // Cash only calculation
  const totalCashThisMonth = getAccountSummary('Cash', 'month');
  const totalCashToday = getAccountSummary('Cash', 'today');

  // --- 6. CRITICAL WARNING: ITEMS OUT OF STOCK / LOW STOCK (< 5) ---
  const lowStockItems = inventoryStock.filter(item => item.quantity <= 5);

  // --- 7. CRITICAL WARNING: UNPAID CUSTOMERS DUES FOR 2 OR 3 MONTHS ---
  // 2 months is roughly 60 days, 3 months is roughly 90 days.
  const delinquentCustomers = invoices.filter(inv => {
    if (inv.dueAmount <= 0) return false;
    const daysOld = getDaysAgo(inv.date);
    return daysOld >= 60; // 2 months or more
  }).map(inv => {
    const daysOld = getDaysAgo(inv.date);
    const monthsOld = Math.floor(daysOld / 30);
    return {
      id: inv.id,
      customerName: inv.customerName,
      customerPhone: inv.customerPhone,
      invoiceNo: inv.invoiceNumber,
      amountDue: inv.dueAmount,
      date: inv.date,
      monthsOverdue: monthsOld
    };
  }).sort((a, b) => b.amountDue - a.amountDue);

  // Attendance Status checks for Quick Check-In Notification
  const todayRecord = attendanceRecords.find(r => r.userId === currentUser?.id && r.date === targetToday);
  const isCheckedIn = todayRecord && (todayRecord.status === 'Present' || todayRecord.status === 'Half Day');
  
  const todayRequests = attendanceRequests.filter(r => r.userId === currentUser?.id && r.date === targetToday);
  const checkInReq = todayRequests.find(r => r.type === 'Check-In');

  const handleQuickCheckIn = () => {
    if (!onAddAttendanceRequest || !currentUser) return;
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    const newReq: AttendanceRequest = {
      id: `att-req-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      date: targetToday,
      type: 'Check-In',
      time: strTime,
      status: 'Pending'
    };
    onAddAttendanceRequest(newReq);
  };

  // Helper to build Donut chart SVG path/strokes
  const accountsTodayBreakdown = [
    { name: 'Cash Vault', key: 'Cash', color: '#10b981', bgClass: 'bg-emerald-500', textClass: 'text-emerald-600', lightBg: 'bg-emerald-50' },
    { name: 'Due (Credit)', key: 'Due', color: '#f59e0b', bgClass: 'bg-amber-500', textClass: 'text-amber-600', lightBg: 'bg-amber-50' },
    { name: 'RBB Bank', key: 'RBB', color: '#3b82f6', bgClass: 'bg-blue-500', textClass: 'text-blue-600', lightBg: 'bg-blue-50' },
    { name: 'eSewa Wallet', key: 'Esewa', color: '#14b8a6', bgClass: 'bg-teal-500', textClass: 'text-teal-600', lightBg: 'bg-teal-50' },
    { name: 'Sahakari', key: 'Sahakari', color: '#6366f1', bgClass: 'bg-indigo-500', textClass: 'text-indigo-600', lightBg: 'bg-indigo-50' }
  ].map(acc => {
    let amt = 0;
    invoicesToday.forEach(inv => {
      if (inv.paymentMethod === 'Split' && inv.paymentSplits) {
        amt += inv.paymentSplits[acc.key.toLowerCase() as keyof typeof inv.paymentSplits] || 0;
      } else if (inv.paymentMethod === acc.key || (acc.key === 'RBB' && inv.paymentMethod === 'Bank')) {
        amt += inv.finalAmount;
      }
    });
    const percent = salesToday > 0 ? (amt / salesToday) * 100 : 0;
    return { ...acc, amount: amt, percent };
  });

  // Group invoices of this month by day
  const dailySalesMap: Record<string, number> = {};
  invoicesThisMonth.forEach(inv => {
    const day = inv.date.split('-')[2] || '01';
    dailySalesMap[day] = (dailySalesMap[day] || 0) + inv.finalAmount;
  });

  const currentDayNum = parseInt(targetToday.split('-')[2] || '1', 10);
  const chartData: { day: string; amount: number }[] = [];
  for (let i = 1; i <= Math.max(30, currentDayNum); i++) {
    const dayStr = String(i).padStart(2, '0');
    chartData.push({
      day: dayStr,
      amount: dailySalesMap[dayStr] || 0
    });
  }

  const maxSale = Math.max(...chartData.map(d => d.amount), 5000);

  // Month Expense Breakdown
  const expenseCategoriesMonth = useMemo(() => {
    const map: Record<string, number> = {};
    expensesThisMonth.forEach(e => {
      const cat = e.category || 'General';
      map[cat] = (map[cat] || 0) + e.amount;
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#14b8a6'];
    return Object.entries(map)
      .map(([category, amount], idx) => ({
        category,
        amount,
        percent: total > 0 ? (amount / total) * 100 : 0,
        color: colors[idx % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expensesThisMonth]);

  // Compact Header Component
  const renderHeaderBanner = () => (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-md relative overflow-hidden border border-slate-800/80">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Avatar & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden border border-white/20 shadow bg-white/10 shrink-0 flex items-center justify-center relative">
            {currentUser?.profilePhoto ? (
              <img 
                src={currentUser.profilePhoto} 
                alt={currentUser.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-600/30 text-indigo-200">
                <User size={18} className="text-white" />
              </div>
            )}
            <span className={`absolute bottom-0 inset-x-0 text-[6px] font-black uppercase text-center py-0.2 tracking-wider ${
              isCheckedIn ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}>
              {isCheckedIn ? 'ON' : 'OFF'}
            </span>
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9px] font-semibold bg-white/10 text-indigo-200 border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Fikkal Headquarters Live Workspace
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xs text-slate-300 font-medium">
                Hello, {getTimeGreeting()} <strong className="text-white font-bold">{currentUser?.name || 'Administrator'}</strong>! 👋
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-black font-display text-white">{profile.name}</span>
            </div>
          </div>
        </div>

        {/* Right: Compact Contact Micro-Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-300 font-mono">
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-lg" title="Location">
            <MapPin size={11} className="text-indigo-300 shrink-0" />
            <span className="truncate max-w-[130px]">{profile.location || 'Fikkal Bazaar, Ilam'}</span>
          </div>
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-lg" title="Phone">
            <Phone size={11} className="text-indigo-300 shrink-0" />
            <span>{profile.phone || '+977-27-540123'}</span>
          </div>
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-lg font-sans" title="Email">
            <Mail size={11} className="text-indigo-300 shrink-0" />
            <span className="truncate max-w-[150px]">{profile.email || 'reliabletechss.fikkal@gmail.com'}</span>
          </div>
          <div className="flex items-center gap-1 bg-indigo-500/20 border border-indigo-400/30 px-2 py-1 rounded-lg text-indigo-200 font-bold" title="Tax PAN">
            <span>PAN: {profile.panNumber || '609874512'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // SVG Donut Chart Calculation
  const renderDonutChart = () => {
    const size = 140;
    const strokeWidth = 18;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    let accumulatedAngle = 0;

    const validSegments = accountsTodayBreakdown.filter(a => a.amount > 0);

    return (
      <div className="flex flex-col sm:flex-row items-center gap-5 justify-between">
        {/* SVG Donut */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          {salesToday > 0 && validSegments.length > 0 ? (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
              {/* Background ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth={strokeWidth}
              />
              {/* Segments */}
              {validSegments.map((segment) => {
                const strokeDasharray = `${(segment.percent / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((accumulatedAngle / 100) * circumference);
                accumulatedAngle += segment.percent;

                return (
                  <circle
                    key={segment.key}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={segment.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500 hover:opacity-85 cursor-pointer"
                  >
                    <title>{`${segment.name}: Rs. ${segment.amount.toLocaleString()} (${segment.percent.toFixed(1)}%)`}</title>
                  </circle>
                );
              })}
            </svg>
          ) : (
            <div className="w-32 h-32 rounded-full border-8 border-slate-100 flex items-center justify-center text-slate-300 text-[10px] font-mono text-center p-2">
              No sales today
            </div>
          )}

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[9px] uppercase font-mono font-extrabold text-slate-400">Total Sales</span>
            <span className="text-xs font-black font-mono text-slate-800">
              {salesToday > 0 ? `Rs. ${(salesToday / 1000).toFixed(1)}k` : 'Rs. 0'}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-1.5 text-xs font-sans">
          {accountsTodayBreakdown.map(item => (
            <div key={item.name} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-700 font-medium">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-bold text-slate-900">Rs. {item.amount.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 w-9 text-right">{item.percent.toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard-tab">
      {/* Admin Closing & Audit Notifications */}
      {currentUser?.role === 'Admin' && closingNotifications.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 space-y-3 shadow-xs" id="admin-closing-alerts">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertTriangle className="text-amber-600 shrink-0" size={18} />
            <h3 className="font-extrabold text-xs tracking-tight uppercase font-mono">Pending Financial Closings & Audits</h3>
            <span className="bg-amber-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">
              {closingNotifications.length} Action Required
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {closingNotifications.map((notif) => (
              <div key={notif.id} className="bg-white/90 hover:bg-white border border-amber-100 rounded-xl p-3 flex items-center justify-between gap-3 transition">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-50 text-indigo-700 text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded uppercase font-mono">
                      {notif.type}
                    </span>
                    <span className="text-slate-400 text-[10px] font-mono">{notif.period}</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 truncate">{notif.title}</h4>
                </div>
                <button
                  onClick={() => onNavigate('daily_closing')}
                  className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition active:scale-[0.98] cursor-pointer font-mono"
                >
                  Review &rarr;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check-In Notification Banner */}
      {!isCheckedIn && (
        <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs transition-all duration-300 ${
          checkInReq 
            ? 'bg-amber-50/95 border-amber-200 text-amber-900' 
            : 'bg-rose-50/95 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl shrink-0 ${checkInReq ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
              <Clock size={16} />
            </div>
            <div className="space-y-0.5">
              <p className="font-bold text-xs">
                {checkInReq ? 'Attendance Check-In Request Pending Approval' : 'Attendance Check-In Required for Today'}
              </p>
              <p className="text-[11px] opacity-90">
                {checkInReq 
                  ? `Your check-in request (${targetToday} at ${checkInReq.time}) is awaiting administrative approval.`
                  : `You have not registered attendance for ${targetToday} yet.`
                }
              </p>
            </div>
          </div>
          {!checkInReq && (
            <button
              onClick={handleQuickCheckIn}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-xl transition shadow-xs cursor-pointer whitespace-nowrap active:scale-95"
            >
              ⚡ Punch In Now
            </button>
          )}
        </div>
      )}

      {/* Compact Executive Header Banner */}
      {renderHeaderBanner()}

      {/* --- EXECUTIVE KPI METRICS STRIP --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Today's Sales */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase font-mono tracking-wider">Today Sales</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CalendarDays size={14} />
            </span>
          </div>
          <div>
            <p className="text-lg md:text-xl font-black font-display text-slate-900">
              Rs. {salesToday.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{invoicesToday.length} invoices generated</p>
          </div>
        </div>

        {/* Today's Income */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase font-mono tracking-wider">Cash Received</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Coins size={14} />
            </span>
          </div>
          <div>
            <p className="text-lg md:text-xl font-black font-display text-emerald-600">
              Rs. {incomeToday.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Realized income today</p>
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase font-mono tracking-wider">Today Expenses</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <TrendingDown size={14} />
            </span>
          </div>
          <div>
            <p className="text-lg md:text-xl font-black font-display text-rose-600">
              Rs. {expenditureToday.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{expensesToday.length} approved expenses</p>
          </div>
        </div>

        {/* Month Cumulative Sales */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase font-mono tracking-wider">Month Sales</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp size={14} />
            </span>
          </div>
          <div>
            <p className="text-lg md:text-xl font-black font-display text-indigo-950">
              Rs. {salesThisMonth.toLocaleString()}
            </p>
            <p className="text-[10px] text-indigo-600 font-mono font-bold mt-0.5">{formatBsMonth(targetMonth)}</p>
          </div>
        </div>
      </div>

      {/* --- SECTION 1: CHARTS & VISUAL ANALYTICS (BAR + DONUT) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* MONTHLY DAILY SALES TREND (COMPACT BAR CHART - 7 COLUMNS) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-indigo-600" size={16} />
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">
                  Daily Sales Trend • {formatBsMonth(targetMonth)}
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                Peak: Rs. {Math.max(...chartData.map(d => d.amount)).toLocaleString()}
              </span>
            </div>

            {/* Dynamic SVG bar chart */}
            <div className="h-48 w-full mt-3 flex items-end">
              <svg viewBox="0 0 500 130" className="w-full h-full overflow-visible">
                {/* Grid lines */}
                <line x1="30" y1="15" x2="480" y2="15" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="50" x2="480" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="85" x2="480" y2="85" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="110" x2="480" y2="110" stroke="#e2e8f0" strokeWidth="1" />
                
                {/* Bars */}
                {chartData.map((d, index) => {
                  const x = 30 + (index * (450 / chartData.length));
                  const barHeight = (d.amount / maxSale) * 95;
                  const y = 110 - barHeight;
                  const width = Math.max(3, (450 / chartData.length) - 2);
                  const isCurrentDay = d.day === targetToday.split('-')[2];
                  
                  return (
                    <g key={d.day} className="group">
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={barHeight}
                        fill={isCurrentDay ? '#4f46e5' : d.amount > 0 ? '#818cf8' : '#e2e8f0'}
                        rx="2"
                        className="transition-all duration-200 hover:fill-indigo-500 cursor-pointer"
                      />
                      <title>{`Day ${d.day} (${targetMonth}-${d.day}): Rs. ${d.amount.toLocaleString()}`}</title>
                    </g>
                  );
                })}
                
                {/* X axis labels */}
                {chartData.filter((_, i) => i % 5 === 0 || i === chartData.length - 1).map((d) => {
                  const index = chartData.findIndex(item => item.day === d.day);
                  const x = 30 + (index * (450 / chartData.length)) + ((450 / chartData.length) / 2);
                  return (
                    <text
                      key={d.day}
                      x={x}
                      y="124"
                      fill="#94a3b8"
                      fontSize="8"
                      textAnchor="middle"
                      className="font-mono font-bold"
                    >
                      D{d.day}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 flex justify-between items-center text-[10px] font-mono font-bold text-slate-500">
            <span>Month Revenue: <span className="text-indigo-600 font-extrabold">Rs. {salesThisMonth.toLocaleString()}</span></span>
            <span>Total Invoices: <span className="text-slate-800">{invoicesThisMonth.length} bills</span></span>
          </div>
        </div>

        {/* PAYMENT CHANNELS DONUT / PIE CHART (5 COLUMNS) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Coins className="text-emerald-600" size={16} />
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">
                Today's Inflow Channels (Donut)
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              {targetToday}
            </span>
          </div>

          {/* Donut & Legend Container */}
          <div className="py-1">
            {renderDonutChart()}
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 flex justify-between items-center text-[10px] font-mono font-bold text-slate-500">
            <span>Net Liquid Inflow Today:</span>
            <span className={totalCashToday >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
              Rs. {totalCashToday.toLocaleString()}
            </span>
          </div>
        </div>

      </div>

      {/* --- SECTION 1B: EXPENSES & OPERATIONAL OUTFLOW CATEGORY BREAKDOWN --- */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <TrendingDown className="text-rose-600" size={16} />
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">
              Month Expense Distribution By Category • {formatBsMonth(targetMonth)}
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
            Total: Rs. {expenditureThisMonth.toLocaleString()}
          </span>
        </div>

        {expenseCategoriesMonth.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs italic font-mono">
            No approved office expenses recorded for {formatBsMonth(targetMonth)}.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {expenseCategoriesMonth.slice(0, 8).map(cat => (
              <div key={cat.category} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 truncate max-w-[120px]">{cat.category}</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200">
                    {cat.percent.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.max(4, cat.percent)}%`, backgroundColor: cat.color }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                  <span>Outflow:</span>
                  <span className="font-bold text-slate-900">Rs. {cat.amount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- SECTION 2: COMPARATIVE ACCOUNT MOVEMENTS (TODAY vs THIS MONTH) --- */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Building className="text-indigo-600" size={16} />
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">
              Account-Wise Liquidity Movement Matrix
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Net Inflow - Outflow Ledger Summary</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {accountsList.map(acc => {
            const todayChange = getAccountSummary(acc, 'today');
            const monthChange = getAccountSummary(acc, 'month');

            return (
              <div key={acc} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 font-sans">{acc} Account</span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    todayChange > 0 ? 'bg-emerald-100 text-emerald-800' : todayChange < 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {todayChange > 0 ? 'Inflow' : todayChange < 0 ? 'Outflow' : 'Neutral'}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 font-sans">Today's Net:</span>
                    <span className={`font-mono font-bold ${todayChange > 0 ? 'text-emerald-600' : todayChange < 0 ? 'text-rose-500' : 'text-slate-600'}`}>
                      {todayChange > 0 ? `+Rs. ${todayChange.toLocaleString()}` : `Rs. ${todayChange.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-200/60 pt-1">
                    <span className="text-[10px] text-slate-500 font-sans">Month Net:</span>
                    <span className={`font-mono font-bold text-xs ${monthChange > 0 ? 'text-indigo-600' : monthChange < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                      {monthChange > 0 ? `+Rs. ${monthChange.toLocaleString()}` : `Rs. ${monthChange.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- SECTION 3: OPERATIONAL WARNINGS & AUDITS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* OUT OF STOCK & LOW STOCK HARDWARE WARNINGS */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Package className="text-rose-600" size={16} />
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">Stock Depletion Warnings</h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
              Threshold: &le; 5 units
            </span>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {lowStockItems.slice(0, 8).map(item => {
              const stockPercent = Math.min(100, (item.quantity / 5) * 100);
              const isOutOfStock = item.quantity === 0;

              return (
                <div key={item.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs flex justify-between items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${isOutOfStock ? 'bg-rose-500' : 'bg-amber-500'}`} 
                          style={{ width: `${Math.max(5, stockPercent)}%` }} 
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono">Cost: Rs. {item.costPrice.toLocaleString()}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono shrink-0 ${
                    isOutOfStock ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isOutOfStock ? 'OUT OF STOCK' : `${item.quantity} PCS LEFT`}
                  </span>
                </div>
              );
            })}

            {lowStockItems.length === 0 && (
              <p className="text-center py-8 text-xs text-slate-400 italic">☀️ All inventory stock levels are secure and above safety targets.</p>
            )}
          </div>
        </div>

        {/* DELINQUENT CUSTOMERS WITH OUTSTANDING DUES (2 - 3 MONTHS) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <AlertOctagon className="text-amber-600" size={16} />
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">Dues Outstanding Over 2-3 Months</h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Action Required</span>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {delinquentCustomers.slice(0, 8).map(cust => (
              <div key={cust.id} className="p-3 rounded-xl border border-rose-100 bg-rose-50/30 text-xs flex justify-between items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 truncate">{cust.customerName}</p>
                  <p className="text-[10px] text-slate-500 font-mono">Ph: {cust.customerPhone} | Inv: {cust.invoiceNo}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-rose-600 font-mono">Rs. {cust.amountDue.toLocaleString()}</p>
                  <p className="text-[8px] text-rose-500 font-mono font-bold uppercase">{cust.monthsOverdue} Mo. Overdue</p>
                </div>
              </div>
            ))}

            {delinquentCustomers.length === 0 && (
              <p className="text-center py-8 text-xs text-slate-400 italic">☀️ Wonderful! No customer invoices are outstanding beyond 2 months.</p>
            )}
          </div>
        </div>

      </div>

      {/* --- SECTION 4: QUICK SHORTCUTS & SYSTEM HEALTH --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Quick Navigate panel */}
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 border border-slate-800 flex flex-col justify-between space-y-3">
          <div>
            <h4 className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider font-mono">Operational Shortcuts</h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Fast track to billing counter, expenditure ledger or internal financial transfers.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => onNavigate('sales')}
              className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-bold text-center transition cursor-pointer font-mono"
            >
              ⚡ Sales
            </button>
            <button 
              onClick={() => onNavigate('expenses')}
              className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-bold text-center transition cursor-pointer font-mono"
            >
              💸 Expenses
            </button>
            <button 
              onClick={() => onNavigate('daily_closing')}
              className="px-2.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold text-center transition cursor-pointer font-mono"
            >
              🏛️ Closing
            </button>
          </div>
        </div>

        {/* Catalog distribution brief */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-3xs text-xs space-y-2">
          <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">Services & Catalog</h4>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Cataloged Services:</span>
              <span className="font-mono font-bold text-slate-800">{services.length} items</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Active Offers:</span>
              <span className="font-mono font-bold text-emerald-600">{services.filter(s => s.status === 'Active').length} active</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Under Maintenance:</span>
              <span className="font-mono font-bold text-amber-500">{services.filter(s => s.status === 'Under Maintenance').length} items</span>
            </div>
          </div>
        </div>

        {/* Vendors overview */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-3xs text-xs space-y-2">
          <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">Vendor & Credit Summary</h4>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Enrolled Suppliers:</span>
              <span className="font-mono font-bold text-slate-800">{suppliers.length} vendors</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Credit Dues to Pay:</span>
              <span className="font-mono font-bold text-rose-600">Rs. {suppliers.reduce((sum, s) => sum + s.creditBalance, 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Pending POs:</span>
              <span className="font-mono font-bold text-indigo-600">{transactions.filter(t => t.status !== 'Paid').length} POs</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
