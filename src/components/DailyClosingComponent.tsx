import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  X, 
  Printer, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Users, 
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileText,
  Clock,
  Briefcase,
  HelpCircle,
  Eye,
  AlertTriangle,
  Package,
  ShoppingBag,
  Plus,
  Trash2,
  CalendarRange,
  ArrowRightLeft,
  Layers,
  Sparkles,
  CheckCircle2,
  Building2,
  Wallet,
  Banknote,
  ListFilter,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { 
  DailyClosing, 
  SalesInvoice, 
  AppUser, 
  CashDenomination, 
  EditRequest, 
  PeriodicClosing, 
  AccountTransaction, 
  Expense, 
  BusinessProfile, 
  InventoryItem, 
  Supplier, 
  OpeningBalances, 
  SalaryDistribution, 
  SupplyTransaction, 
  Shareholder, 
  MeetingNote,
  SplitDepositItem
} from '../types';
import { getCurrentBsDate, bsToAd, adToBs, formatBsDate } from '../utils/nepaliDate';
import { PeriodicAdminClosingBoard } from './PeriodicAdminClosingBoard';
import { NepaliDatePicker } from './NepaliDatePicker';
import { isReliableAdminMaster, checkDateLock } from '../utils/closingLocks';
import { InterAccountFTTab } from './InterAccountFTTab';
import { buildDailyClosingReportData } from '../utils/dailyClosingReportBuilder';

interface DailyClosingComponentProps {
  invoices: SalesInvoice[];
  currentUser: AppUser;
  dailyClosings: DailyClosing[];
  onSaveClosing: (closing: DailyClosing) => void;
  onApproveClosing: (id: string, status: 'Approved' | 'Rejected', adminRemarks: string, adminName: string) => void;
  onUnlockClosing?: (id: string, reason: string, adminName: string) => void;
  editRequests: EditRequest[];
  periodicClosings: PeriodicClosing[];
  onSavePeriodicClosing: (closing: PeriodicClosing) => void;
  users: AppUser[];
  expenses: Expense[];
  profile: BusinessProfile;
  accountTransfers?: AccountTransaction[];
  onUpdateAccountTransfers?: (transfers: AccountTransaction[]) => void;
  inventoryStock?: InventoryItem[];
  suppliers?: Supplier[];
  openingBalances?: OpeningBalances;
  salaryDistributions?: SalaryDistribution[];
  supplyTransactions?: SupplyTransaction[];
  shareholders?: Shareholder[];
  meetingNotes?: MeetingNote[];
}

export const DailyClosingComponent: React.FC<DailyClosingComponentProps> = ({
  invoices,
  currentUser,
  dailyClosings,
  onSaveClosing,
  onApproveClosing,
  onUnlockClosing,
  editRequests,
  periodicClosings,
  onSavePeriodicClosing,
  users,
  expenses,
  profile,
  accountTransfers = [],
  onUpdateAccountTransfers,
  inventoryStock = [],
  suppliers = [],
  openingBalances,
  salaryDistributions = [],
  supplyTransactions = [],
  shareholders = [],
  meetingNotes = []
}) => {
  const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'Super Admin';
  const isReliableAdmin = isReliableAdminMaster(currentUser) || currentUser.username === '@reliableadmin' || isAdmin;

  // Tabs: daily register, periodic admin closing, or inter-account transfer
  const [closingTab, setClosingTab] = useState<'daily' | 'periodic' | 'transfers'>('daily');

  // Daily Mode: single date vs bulk date range (for @reliableadmin)
  const [closingMode, setClosingMode] = useState<'single' | 'range'>('single');

  // Single Date Selection
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return getCurrentBsDate();
  });

  // Range Date Selection for @reliableadmin bulk closing
  const [rangeFromDate, setRangeFromDate] = useState<string>(() => {
    const today = getCurrentBsDate();
    // Default to start of month or 7 days prior
    const parts = today.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-${parts[1]}-01`;
    }
    return today;
  });
  const [rangeToDate, setRangeToDate] = useState<string>(() => {
    return getCurrentBsDate();
  });

  // Current Closing Form state
  const [openingCashToday, setOpeningCashToday] = useState<number | string>(0);
  const [remarks, setRemarks] = useState<string>('');

  // Multiple Split Deposits state
  const [splitDeposits, setSplitDeposits] = useState<Array<{ id: string; targetAccount: 'RBB' | 'Esewa' | 'Sahakari'; amount: number | string; remarks?: string }>>([]);

  // Cash Denominations
  const [denominations, setDenominations] = useState<CashDenomination>({
    1000: 0,
    500: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    2: 0,
    1: 0
  });

  // Admin approval remarks
  const [adminRemarks, setAdminRemarks] = useState<string>('');
  const [selectedClosingToView, setSelectedClosingToView] = useState<DailyClosing | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState<boolean>(false);

  // Extract past approved closing to pre-fill opening cash for single date
  useEffect(() => {
    const approvedClosings = dailyClosings
      .filter(c => c.status === 'Approved' && c.date < selectedDate)
      .sort((a, b) => b.date.localeCompare(a.date));
    
    if (approvedClosings.length > 0) {
      setOpeningCashToday(approvedClosings[0].remainingCash);
    } else {
      setOpeningCashToday(0);
    }
  }, [selectedDate, dailyClosings]);

  // Denominations Total Calculation
  const getDenominationTotal = (denValues: CashDenomination) => {
    return (
      (denValues[1000] || 0) * 1000 +
      (denValues[500] || 0) * 500 +
      (denValues[100] || 0) * 100 +
      (denValues[50] || 0) * 50 +
      (denValues[20] || 0) * 20 +
      (denValues[10] || 0) * 10 +
      (denValues[5] || 0) * 5 +
      (denValues[2] || 0) * 2 +
      (denValues[1] || 0) * 1
    );
  };

  // Calculate Single Date's Transactions & Inter-Account Transfers
  const getTransactionsForDate = (date: string) => {
    // 1. Invoices created on this date
    const dayInvoices = invoices.filter(inv => inv.date === date);

    let cashSales = 0;
    let esewaSales = 0;
    let bankSales = 0; // RBB
    let sahakariSales = 0;
    let dueSales = 0;

    dayInvoices.forEach(inv => {
      if (inv.paymentSplits) {
        cashSales += inv.paymentSplits.cash || 0;
        esewaSales += inv.paymentSplits.esewa || 0;
        bankSales += inv.paymentSplits.rbb || 0;
        sahakariSales += inv.paymentSplits.sahakari || 0;
        dueSales += inv.paymentSplits.due || 0;
      } else {
        if (inv.dueAmount > 0) {
          dueSales += inv.dueAmount;
        }
        const amt = inv.paidAmount;
        if (amt > 0) {
          if (inv.paymentMethod === 'Cash') cashSales += amt;
          else if (inv.paymentMethod === 'Esewa') esewaSales += amt;
          else if (inv.paymentMethod === 'RBB') bankSales += amt;
          else if (inv.paymentMethod === 'Sahakari') sahakariSales += amt;
          else if (inv.paymentMethod === 'Due') dueSales += amt;
        }
      }
    });

    // 2. Today's Dues Collected (recouped payments)
    const duesCollectedDetails: { customerName: string; amount: number; method: string }[] = [];
    let duesCollected = 0;

    invoices.forEach(inv => {
      if (inv.date !== date && inv.remarks) {
        const regex = /Paid Rs\.\s*(\d+(\.\d+)?)\s*via\s*([a-zA-Z0-9]+)\s*on\s*([\d-]+)/gi;
        let match;
        while ((match = regex.exec(inv.remarks)) !== null) {
          const amt = parseFloat(match[1]);
          const method = match[3];
          const matchDate = match[4];
          if (matchDate === date) {
            duesCollected += amt;
            duesCollectedDetails.push({
              customerName: inv.customerName,
              amount: amt,
              method: method
            });
          }
        }
      }
    });

    editRequests.forEach(req => {
      if (req.type === 'Payment Collection' && req.status === 'Approved' && req.date === date && req.paymentDetails) {
        const exists = duesCollectedDetails.some(
          d => d.customerName === req.paymentDetails.customerName && d.amount === req.paymentDetails.amount
        );
        if (!exists) {
          duesCollected += req.paymentDetails.amount;
          duesCollectedDetails.push({
            customerName: req.paymentDetails.customerName,
            amount: req.paymentDetails.amount,
            method: req.paymentDetails.method
          });
        }
      }
    });

    // 3. Today's Approved Expenditures (Expenses)
    const dayExpenses = expenses.filter(exp => exp.date === date && exp.status === 'Approved');
    let cashExpenses = 0;
    let esewaExpenses = 0;
    let bankExpenses = 0; // RBB
    let sahakariExpenses = 0;

    dayExpenses.forEach(exp => {
      const amt = exp.amount;
      if (exp.paymentMethod === 'Cash') cashExpenses += amt;
      else if (exp.paymentMethod === 'Esewa') esewaExpenses += amt;
      else if (exp.paymentMethod === 'RBB' || exp.paymentMethod === 'Bank') bankExpenses += amt;
      else if (exp.paymentMethod === 'Sahakari') sahakariExpenses += amt;
    });

    // 4. Inter-Account Fund Transfers on this date
    // Transfers to/from Cash affect physical drawer balance without duplicating sales or expense
    const dayTransfers = accountTransfers.filter(tx => tx.date === date);
    let cashTransfersIn = 0;
    const cashTransfersInDetails: { source: string; amount: number; voucher: string; remarks: string }[] = [];
    let cashTransfersOut = 0;
    const cashTransfersOutDetails: { destination: string; amount: number; voucher: string; remarks: string }[] = [];
    const nonCashTransfers: AccountTransaction[] = [];
    const transfersSummary: any[] = [];

    dayTransfers.forEach(tx => {
      const amt = tx.amount || 0;
      if (amt <= 0) return;
      const src = tx.sourceAccount;
      const dst = tx.destinationAccount;

      transfersSummary.push({
        id: tx.id,
        date: tx.date,
        type: tx.type,
        sourceAccount: tx.sourceAccount,
        destinationAccount: tx.destinationAccount,
        amount: tx.amount,
        voucherNumber: tx.voucherNumber,
        remarks: tx.remarks
      });

      if (tx.type === 'Withdrawal') {
        // Bank withdrawal brings physical cash into the drawer
        if (src !== 'Cash') {
          cashTransfersIn += amt;
          cashTransfersInDetails.push({ source: src, amount: amt, voucher: tx.voucherNumber, remarks: tx.remarks });
        }
      } else if (tx.type === 'Deposit') {
        // Bank deposit takes physical cash from the drawer
        if (src !== 'Cash') {
          cashTransfersOut += amt;
          cashTransfersOutDetails.push({ destination: src, amount: amt, voucher: tx.voucherNumber, remarks: tx.remarks });
        }
      } else if (tx.type === 'Transfer') {
        if (src === 'Cash' && dst !== 'Cash') {
          cashTransfersOut += amt;
          cashTransfersOutDetails.push({ destination: dst || 'Bank', amount: amt, voucher: tx.voucherNumber, remarks: tx.remarks });
        } else if (dst === 'Cash' && src !== 'Cash') {
          cashTransfersIn += amt;
          cashTransfersInDetails.push({ source: src, amount: amt, voucher: tx.voucherNumber, remarks: tx.remarks });
        } else {
          nonCashTransfers.push(tx);
        }
      }
    });

    const totalSales = cashSales + esewaSales + bankSales + sahakariSales + dueSales;
    const totalExpenses = cashExpenses + esewaExpenses + bankExpenses + sahakariExpenses;

    return {
      dayInvoices,
      totalSales,
      cashSales,
      esewaSales,
      bankSales,
      sahakariSales,
      dueSales,
      duesCollected,
      duesCollectedDetails,
      dayExpenses,
      cashExpenses,
      esewaExpenses,
      bankExpenses,
      sahakariExpenses,
      totalExpenses,
      dayTransfers,
      cashTransfersIn,
      cashTransfersInDetails,
      cashTransfersOut,
      cashTransfersOutDetails,
      nonCashTransfers,
      transfersSummary
    };
  };

  const dayStats = getTransactionsForDate(selectedDate);

  // Today's cash receipts = Cash sales + Dues collected in cash today + Cash transfers in
  const cashFromDues = dayStats.duesCollectedDetails
    .filter(d => d.method.toLowerCase() === 'cash')
    .reduce((sum, d) => sum + d.amount, 0);

  const totalCashReceivedToday = dayStats.cashSales + cashFromDues + dayStats.cashTransfersIn;
  const totalCashDisbursedToday = (dayStats.cashExpenses || 0) + dayStats.cashTransfersOut;
  const numOpeningCash = parseFloat(String(openingCashToday)) || 0;
  const totalCashAvailable = Math.max(0, numOpeningCash + totalCashReceivedToday - totalCashDisbursedToday);

  // Total Split Deposit Amount
  const totalSplitDeposited = splitDeposits.reduce((sum, s) => sum + (parseFloat(String(s.amount)) || 0), 0);
  const remainingCash = Math.max(0, totalCashAvailable - totalSplitDeposited);
  const denominationTotal = getDenominationTotal(denominations);
  const isDenominationValid = remainingCash === 0 || denominationTotal === remainingCash;

  // Split deposit management helpers
  const handleAddSplitDeposit = (targetAccount: 'RBB' | 'Esewa' | 'Sahakari' = 'RBB', initialAmount: number = 0) => {
    setSplitDeposits(prev => [
      ...prev,
      {
        id: `split-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        targetAccount,
        amount: initialAmount > 0 ? initialAmount : '',
        remarks: ''
      }
    ]);
  };

  const handleRemoveSplitDeposit = (id: string) => {
    setSplitDeposits(prev => prev.filter(s => s.id !== id));
  };

  const handleUpdateSplitDeposit = (id: string, updates: Partial<{ targetAccount: 'RBB' | 'Esewa' | 'Sahakari'; amount: number | string; remarks: string }>) => {
    setSplitDeposits(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleDepositAllToAccount = (targetAccount: 'RBB' | 'Esewa' | 'Sahakari') => {
    setSplitDeposits([
      {
        id: `split-${Date.now()}`,
        targetAccount,
        amount: totalCashAvailable,
        remarks: `Full 100% Cash Deposit to ${targetAccount}`
      }
    ]);
  };

  const handleSplitEqually = () => {
    if (totalCashAvailable <= 0) return;
    const third = Math.floor(totalCashAvailable / 3);
    const remainder = totalCashAvailable - (third * 2);
    setSplitDeposits([
      { id: `split-rbb-${Date.now()}`, targetAccount: 'RBB', amount: remainder, remarks: 'Equal Split' },
      { id: `split-esewa-${Date.now() + 1}`, targetAccount: 'Esewa', amount: third, remarks: 'Equal Split' },
      { id: `split-sahakari-${Date.now() + 2}`, targetAccount: 'Sahakari', amount: third, remarks: 'Equal Split' }
    ]);
  };

  const handleClearDeposits = () => {
    setSplitDeposits([]);
  };

  // Submit Daily Closing Request (Single Date)
  const handleSubmitClosing = (e: React.FormEvent) => {
    e.preventDefault();

    const existingClosing = dailyClosings.find(c => c.date === selectedDate);
    if (existingClosing && !existingClosing.unlocked) {
      alert(`A Daily Closing has already been submitted for ${selectedDate} with status: ${existingClosing.status}. Duplicate entries are not allowed.`);
      return;
    }

    if (totalSplitDeposited > totalCashAvailable) {
      alert(`Total deposit amount (Rs. ${totalSplitDeposited.toLocaleString()}) cannot exceed the total cash available (Rs. ${totalCashAvailable.toLocaleString()}).`);
      return;
    }

    if (remainingCash > 0 && denominationTotal !== remainingCash) {
      alert(`Denomination total (Rs. ${denominationTotal.toLocaleString()}) must exactly match the remaining cash in hand (Rs. ${remainingCash.toLocaleString()}).`);
      return;
    }

    const isRedoing = existingClosing?.unlocked;

    // Determine legacy depositTarget for backward compatibility
    let legacyDepositTarget: 'Esewa' | 'RBB' | 'Sahakari' | 'None' | 'Split' = 'None';
    if (splitDeposits.length === 1) {
      legacyDepositTarget = splitDeposits[0].targetAccount;
    } else if (splitDeposits.length > 1) {
      legacyDepositTarget = 'Split';
    }

    const formattedSplitDeposits: SplitDepositItem[] = splitDeposits
      .filter(s => (parseFloat(String(s.amount)) || 0) > 0)
      .map(s => ({
        id: s.id,
        targetAccount: s.targetAccount,
        amount: parseFloat(String(s.amount)) || 0,
        remarks: s.remarks
      }));

    const newClosing: DailyClosing = {
      id: existingClosing ? existingClosing.id : `closing-${Date.now()}`,
      date: selectedDate,
      totalSales: dayStats.totalSales,
      cashSales: dayStats.cashSales,
      esewaSales: dayStats.esewaSales,
      bankSales: dayStats.bankSales,
      sahakariSales: dayStats.sahakariSales,
      dueSales: dayStats.dueSales,
      duesCollected: dayStats.duesCollected,
      duesCollectedDetails: dayStats.duesCollectedDetails,
      totalCashAvailable,
      depositTarget: legacyDepositTarget,
      depositAmount: totalSplitDeposited,
      splitDeposits: formattedSplitDeposits,
      remainingCash,
      denominations: remainingCash > 0 ? denominations : {
        1000: 0, 500: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0
      },
      openingCashForTomorrow: remainingCash,
      openingCashToday: numOpeningCash,
      status: (existingClosing && isAdmin && !existingClosing.unlocked)
        ? existingClosing.status 
        : (isAdmin ? 'Approved' : 'Pending'),
      submittedBy: existingClosing ? existingClosing.submittedBy : currentUser.name,
      approvedBy: (existingClosing && isAdmin && !existingClosing.unlocked)
        ? existingClosing.approvedBy 
        : (isAdmin ? currentUser.name : undefined),
      adminRemarks: remarks || (existingClosing ? existingClosing.adminRemarks : ''),
      unlocked: false,
      unlockedBy: undefined,
      unlockReason: undefined,
      
      // Expenditures
      totalExpenses: dayStats.totalExpenses,
      cashExpenses: dayStats.cashExpenses,
      esewaExpenses: dayStats.esewaExpenses,
      bankExpenses: dayStats.bankExpenses,
      sahakariExpenses: dayStats.sahakariExpenses,

      // Inter-Account Transfers
      cashTransfersIn: dayStats.cashTransfersIn,
      cashTransfersOut: dayStats.cashTransfersOut,
      transfersSummary: dayStats.transfersSummary
    };

    onSaveClosing(newClosing);
    alert(isRedoing 
      ? (isAdmin
          ? `Daily Closing for ${selectedDate} has been successfully updated, recalculated, and locked again.`
          : `Daily Closing for ${selectedDate} has been updated and submitted for Admin approval again.`
        )
      : (isAdmin
          ? `Daily Closing for ${selectedDate} has been processed and locked successfully.`
          : `Daily Closing for ${selectedDate} submitted successfully for Admin approval.`
        )
    );
    
    // Reset Form
    setSplitDeposits([]);
    setRemarks('');
    setDenominations({
      1000: 0, 500: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0
    });
  };

  // Instant Redo & Relock handler
  const handleInstantRedoAndLock = (closing: DailyClosing) => {
    const stats = getTransactionsForDate(closing.date);
    
    const cashFromDuesRec = stats.duesCollectedDetails
      .filter(d => d.method.toLowerCase() === 'cash')
      .reduce((sum, d) => sum + d.amount, 0);

    const totalCashReceived = stats.cashSales + cashFromDuesRec + stats.cashTransfersIn;
    const totalCashDisbursed = (stats.cashExpenses || 0) + stats.cashTransfersOut;
    const totalCashAvailableRec = Math.max(0, (closing.openingCashToday || 0) + totalCashReceived - totalCashDisbursed);
    
    let depAmt = closing.depositAmount || 0;
    if (depAmt > totalCashAvailableRec) {
      depAmt = totalCashAvailableRec;
    }
    
    const remCash = Math.max(0, totalCashAvailableRec - depAmt);
    
    const currentDenomTotal = getDenominationTotal(closing.denominations || {
      1000: 0, 500: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0
    });
    if (remCash > 0 && currentDenomTotal !== remCash) {
      setSelectedDate(closing.date);
      setClosingMode('single');
      alert(`The actual cash on hand for ${closing.date} has changed to Rs. ${remCash.toLocaleString()} due to transaction edits. Since physical cash count (Rs. ${currentDenomTotal.toLocaleString()}) does not match, the settlement form has been opened below. Please adjust denominations and click "Redo, Lock & Save Changes" to relock.`);
      return;
    }

    const updatedClosing: DailyClosing = {
      ...closing,
      totalSales: stats.totalSales,
      cashSales: stats.cashSales,
      esewaSales: stats.esewaSales,
      bankSales: stats.bankSales,
      sahakariSales: stats.sahakariSales,
      dueSales: stats.dueSales,
      duesCollected: stats.duesCollected,
      duesCollectedDetails: stats.duesCollectedDetails,
      totalCashAvailable: totalCashAvailableRec,
      depositAmount: depAmt,
      remainingCash: remCash,
      openingCashForTomorrow: remCash,
      status: 'Approved',
      unlocked: false,
      unlockedBy: undefined,
      unlockReason: undefined,
      
      // Expenditures
      totalExpenses: stats.totalExpenses,
      cashExpenses: stats.cashExpenses,
      esewaExpenses: stats.esewaExpenses,
      bankExpenses: stats.bankExpenses,
      sahakariExpenses: stats.sahakariExpenses,

      // Inter-account transfers
      cashTransfersIn: stats.cashTransfersIn,
      cashTransfersOut: stats.cashTransfersOut,
      transfersSummary: stats.transfersSummary
    };

    onSaveClosing(updatedClosing);
    alert(`SUCCESS: Daily Closing for ${closing.date} has been automatically recalculated with new transaction data and relocked.`);
  };

  // Bulk Date Range Calculation for @reliableadmin
  const getTransactionsForRange = (fromBs: string, toBs: string) => {
    const [startBs, endBs] = fromBs <= toBs ? [fromBs, toBs] : [toBs, fromBs];
    
    // Invoices in range
    const rangeInvoices = invoices.filter(inv => inv.date >= startBs && inv.date <= endBs);
    
    let cashSales = 0;
    let esewaSales = 0;
    let bankSales = 0;
    let sahakariSales = 0;
    let dueSales = 0;

    rangeInvoices.forEach(inv => {
      if (inv.paymentSplits) {
        cashSales += inv.paymentSplits.cash || 0;
        esewaSales += inv.paymentSplits.esewa || 0;
        bankSales += inv.paymentSplits.rbb || 0;
        sahakariSales += inv.paymentSplits.sahakari || 0;
        dueSales += inv.paymentSplits.due || 0;
      } else {
        if (inv.dueAmount > 0) dueSales += inv.dueAmount;
        const amt = inv.paidAmount;
        if (amt > 0) {
          if (inv.paymentMethod === 'Cash') cashSales += amt;
          else if (inv.paymentMethod === 'Esewa') esewaSales += amt;
          else if (inv.paymentMethod === 'RBB') bankSales += amt;
          else if (inv.paymentMethod === 'Sahakari') sahakariSales += amt;
          else if (inv.paymentMethod === 'Due') dueSales += amt;
        }
      }
    });

    // Dues collected in range
    const duesCollectedDetails: { customerName: string; amount: number; method: string; date: string }[] = [];
    let duesCollected = 0;
    let cashFromDuesRange = 0;

    invoices.forEach(inv => {
      if (inv.remarks) {
        const regex = /Paid Rs\.\s*(\d+(\.\d+)?)\s*via\s*([a-zA-Z0-9]+)\s*on\s*([\d-]+)/gi;
        let match;
        while ((match = regex.exec(inv.remarks)) !== null) {
          const amt = parseFloat(match[1]);
          const method = match[3];
          const matchDate = match[4];
          if (matchDate >= startBs && matchDate <= endBs) {
            duesCollected += amt;
            if (method.toLowerCase() === 'cash') cashFromDuesRange += amt;
            duesCollectedDetails.push({
              customerName: inv.customerName,
              amount: amt,
              method: method,
              date: matchDate
            });
          }
        }
      }
    });

    editRequests.forEach(req => {
      if (req.type === 'Payment Collection' && req.status === 'Approved' && req.date >= startBs && req.date <= endBs && req.paymentDetails) {
        const exists = duesCollectedDetails.some(
          d => d.customerName === req.paymentDetails.customerName && d.amount === req.paymentDetails.amount && d.date === req.date
        );
        if (!exists) {
          duesCollected += req.paymentDetails.amount;
          if (req.paymentDetails.method.toLowerCase() === 'cash') cashFromDuesRange += req.paymentDetails.amount;
          duesCollectedDetails.push({
            customerName: req.paymentDetails.customerName,
            amount: req.paymentDetails.amount,
            method: req.paymentDetails.method,
            date: req.date
          });
        }
      }
    });

    // Expenses in range
    const rangeExpenses = expenses.filter(exp => exp.date >= startBs && exp.date <= endBs && exp.status === 'Approved');
    let cashExpenses = 0;
    let esewaExpenses = 0;
    let bankExpenses = 0;
    let sahakariExpenses = 0;

    rangeExpenses.forEach(exp => {
      const amt = exp.amount;
      if (exp.paymentMethod === 'Cash') cashExpenses += amt;
      else if (exp.paymentMethod === 'Esewa') esewaExpenses += amt;
      else if (exp.paymentMethod === 'RBB' || exp.paymentMethod === 'Bank') bankExpenses += amt;
      else if (exp.paymentMethod === 'Sahakari') sahakariExpenses += amt;
    });

    // Transfers in range
    const rangeTransfers = accountTransfers.filter(tx => tx.date >= startBs && tx.date <= endBs);
    let cashTransfersIn = 0;
    let cashTransfersOut = 0;
    const transfersSummary: any[] = [];

    rangeTransfers.forEach(tx => {
      const amt = tx.amount || 0;
      if (amt <= 0) return;
      transfersSummary.push(tx);
      if (tx.type === 'Withdrawal' && tx.sourceAccount !== 'Cash') {
        cashTransfersIn += amt;
      } else if (tx.type === 'Deposit' && tx.sourceAccount !== 'Cash') {
        cashTransfersOut += amt;
      } else if (tx.type === 'Transfer') {
        if (tx.sourceAccount === 'Cash' && tx.destinationAccount !== 'Cash') cashTransfersOut += amt;
        else if (tx.destinationAccount === 'Cash' && tx.sourceAccount !== 'Cash') cashTransfersIn += amt;
      }
    });

    // Opening cash as of startBs
    const approvedBefore = dailyClosings
      .filter(c => c.status === 'Approved' && c.date < startBs)
      .sort((a, b) => b.date.localeCompare(a.date));
    const rangeOpeningCash = approvedBefore.length > 0 ? approvedBefore[0].remainingCash : 0;

    // Collect all dates that have any activity or closings
    const uniqueDatesSet = new Set<string>();
    rangeInvoices.forEach(inv => uniqueDatesSet.add(inv.date));
    duesCollectedDetails.forEach(d => uniqueDatesSet.add(d.date));
    rangeExpenses.forEach(exp => uniqueDatesSet.add(exp.date));
    rangeTransfers.forEach(tx => uniqueDatesSet.add(tx.date));
    dailyClosings.filter(c => c.date >= startBs && c.date <= endBs).forEach(c => uniqueDatesSet.add(c.date));

    // Also include start and end dates
    uniqueDatesSet.add(startBs);
    uniqueDatesSet.add(endBs);

    const allDates = Array.from(uniqueDatesSet).sort();

    const dayByDay = allDates.map(date => {
      const stats = getTransactionsForDate(date);
      const closing = dailyClosings.find(c => c.date === date);
      const isApproved = !!closing && closing.status === 'Approved' && !closing.unlocked;
      const isPending = !!closing && closing.status === 'Pending';
      return {
        date,
        stats,
        closing,
        isApproved,
        isPending,
        status: closing ? (closing.unlocked ? 'Unlocked' : closing.status) : 'Not Closed'
      };
    });

    const totalSales = cashSales + esewaSales + bankSales + sahakariSales + dueSales;
    const totalExpenses = cashExpenses + esewaExpenses + bankExpenses + sahakariExpenses;
    const totalCashReceived = cashSales + cashFromDuesRange + cashTransfersIn;
    const totalCashDisbursed = cashExpenses + cashTransfersOut;
    const totalCashAvailableRange = Math.max(0, rangeOpeningCash + totalCashReceived - totalCashDisbursed);

    return {
      startBs,
      endBs,
      rangeInvoices,
      totalSales,
      cashSales,
      esewaSales,
      bankSales,
      sahakariSales,
      dueSales,
      duesCollected,
      cashFromDues: cashFromDuesRange,
      duesCollectedDetails,
      rangeExpenses,
      cashExpenses,
      esewaExpenses,
      bankExpenses,
      sahakariExpenses,
      totalExpenses,
      rangeTransfers,
      cashTransfersIn,
      cashTransfersOut,
      transfersSummary,
      rangeOpeningCash,
      totalCashReceived,
      totalCashDisbursed,
      totalCashAvailable: totalCashAvailableRange,
      dayByDay
    };
  };

  const rangeStats = getTransactionsForRange(rangeFromDate, rangeToDate);

  // Bulk Process and Close All Open Days in Date Range for @reliableadmin
  const handleBulkCloseAllDays = () => {
    if (!isReliableAdmin) {
      alert("⚠️ Only @reliableadmin (System Master) or Admin has permission to perform bulk closings across date ranges.");
      return;
    }

    const openDays = rangeStats.dayByDay.filter(d => !d.isApproved);
    if (openDays.length === 0) {
      alert(`All ${rangeStats.dayByDay.length} days in range (${rangeFromDate} to ${rangeToDate}) are already approved and locked.`);
      return;
    }

    const confirmMsg = `Are you sure you want to bulk-close and authorize ${openDays.length} open day(s) from ${rangeFromDate} to ${rangeToDate}?\n\n` +
      `• Total Range Sales: Rs. ${rangeStats.totalSales.toLocaleString()}\n` +
      `• Total Range Incomes: Rs. ${(rangeStats.totalSales + rangeStats.duesCollected).toLocaleString()}\n` +
      `• Total Range Expenditures: Rs. ${rangeStats.totalExpenses.toLocaleString()}\n` +
      `• Inter-Account Transfers: Net Rs. ${(rangeStats.cashTransfersIn - rangeStats.cashTransfersOut).toLocaleString()}\n` +
      `• Total Available Cash: Rs. ${rangeStats.totalCashAvailable.toLocaleString()}\n\n` +
      `Click OK to proceed with chronological settlement and lock.`;

    if (!window.confirm(confirmMsg)) return;

    setBulkProcessing(true);

    try {
      let runningOpeningCash = rangeStats.rangeOpeningCash;
      let closedCount = 0;

      // Sort chronological
      const sortedDays = [...openDays].sort((a, b) => a.date.localeCompare(b.date));

      sortedDays.forEach((day, idx) => {
        const stats = day.stats;
        const dayCashDues = stats.duesCollectedDetails
          .filter(d => d.method.toLowerCase() === 'cash')
          .reduce((sum, d) => sum + d.amount, 0);

        const dayCashRec = stats.cashSales + dayCashDues + stats.cashTransfersIn;
        const dayCashDis = (stats.cashExpenses || 0) + stats.cashTransfersOut;
        const dayCashAvail = Math.max(0, runningOpeningCash + dayCashRec - dayCashDis);

        // If user defined split deposits and it's the last day, or deposit everything on final day
        let dayDepAmt = 0;
        let daySplit: SplitDepositItem[] = [];
        let dayDepTarget: 'Esewa' | 'RBB' | 'Sahakari' | 'None' | 'Split' = 'None';

        if (idx === sortedDays.length - 1 && splitDeposits.length > 0) {
          dayDepAmt = Math.min(totalSplitDeposited, dayCashAvail);
          daySplit = splitDeposits.map(s => ({
            id: s.id,
            targetAccount: s.targetAccount,
            amount: parseFloat(String(s.amount)) || 0,
            remarks: s.remarks
          }));
          dayDepTarget = daySplit.length === 1 ? daySplit[0].targetAccount : (daySplit.length > 1 ? 'Split' : 'None');
        }

        const dayRemaining = Math.max(0, dayCashAvail - dayDepAmt);

        const existing = dailyClosings.find(c => c.date === day.date);

        const closingRecord: DailyClosing = {
          id: existing ? existing.id : `closing-${Date.now()}-${idx}`,
          date: day.date,
          totalSales: stats.totalSales,
          cashSales: stats.cashSales,
          esewaSales: stats.esewaSales,
          bankSales: stats.bankSales,
          sahakariSales: stats.sahakariSales,
          dueSales: stats.dueSales,
          duesCollected: stats.duesCollected,
          duesCollectedDetails: stats.duesCollectedDetails,
          totalCashAvailable: dayCashAvail,
          depositTarget: dayDepTarget,
          depositAmount: dayDepAmt,
          splitDeposits: daySplit,
          remainingCash: dayRemaining,
          denominations: { 1000: 0, 500: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0 },
          openingCashForTomorrow: dayRemaining,
          openingCashToday: runningOpeningCash,
          status: 'Approved',
          submittedBy: currentUser.name,
          approvedBy: `@reliableadmin (${currentUser.name})`,
          adminRemarks: remarks || `Bulk Date Range Closing processed by @reliableadmin for period ${rangeFromDate} to ${rangeToDate}`,
          unlocked: false,
          
          totalExpenses: stats.totalExpenses,
          cashExpenses: stats.cashExpenses,
          esewaExpenses: stats.esewaExpenses,
          bankExpenses: stats.bankExpenses,
          sahakariExpenses: stats.sahakariExpenses,

          cashTransfersIn: stats.cashTransfersIn,
          cashTransfersOut: stats.cashTransfersOut,
          transfersSummary: stats.transfersSummary
        };

        onSaveClosing(closingRecord);
        runningOpeningCash = dayRemaining;
        closedCount++;
      });

      alert(`✅ SUCCESS: Successfully bulk-closed, verified, and locked ${closedCount} day(s) from ${rangeFromDate} to ${rangeToDate}. Final cash in hand: Rs. ${runningOpeningCash.toLocaleString()}`);
    } catch (err: any) {
      alert(`Error during bulk closing: ${err?.message || 'Unknown error'}`);
    } finally {
      setBulkProcessing(false);
    }
  };

  // Check if a closing exists for selected single date
  const activeClosingForDate = dailyClosings.find(c => c.date === selectedDate);

  // Handle printing of daily closing report in Universal Print Preview
  const handlePrint = (closing: DailyClosing) => {
    const openingCash = closing.openingCashToday || 0;
    const totalIncomes = (closing.totalSales || 0) + (closing.duesCollected || 0) + (closing.cashTransfersIn || 0);
    const totalExpenses = closing.totalExpenses || closing.cashExpenses || 0;
    const depositAmount = closing.depositAmount || 0;
    
    let depositTargetText = 'No Deposit (Kept in Register)';
    if (closing.splitDeposits && closing.splitDeposits.length > 0) {
      depositTargetText = closing.splitDeposits.map(s => `${s.targetAccount}: Rs. ${s.amount.toLocaleString()}`).join(', ');
    } else if (closing.depositTarget && closing.depositTarget !== 'None') {
      depositTargetText = `${closing.depositTarget}: Rs. ${depositAmount.toLocaleString()}`;
    }

    const denEntries = Object.entries(closing.denominations || {})
      .filter(([_, count]) => count > 0)
      .map(([val, count]) => `Rs. ${val}×${count}`);
    const denomText = denEntries.length > 0 ? denEntries.join(', ') : 'None counted';

    const urgentStockItems = (inventoryStock || []).filter(item => item.quantity < 3);

    const urgentStockHtml = (
      <div className="border border-rose-200 bg-rose-50/60 rounded-xl p-2.5 space-y-2 text-xs">
        <div className="border-b border-rose-200 pb-1.5 space-y-0.5">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-rose-900 uppercase font-mono flex items-center gap-1">
              <span>⚠️ Urgent Re-order Alert</span>
            </h4>
            <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-rose-600 text-white">
              {urgentStockItems.length} Items
            </span>
          </div>
          <p className="text-[9px] text-slate-500">Stock &lt; 3 units requiring re-order:</p>
        </div>

        {urgentStockItems.length === 0 ? (
          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[10px] text-emerald-800 font-medium">
            ✓ All inventory stock items are healthy (3+ units).
          </div>
        ) : (
          <div className="space-y-1.5">
            {urgentStockItems.map((item, idx) => {
              const supplierName = suppliers?.find(s => s.id === item.supplierId)?.name;
              const isOut = item.quantity <= 0;

              return (
                <div 
                  key={idx} 
                  className={`p-2 rounded border space-y-1 text-[10px] ${
                    isOut 
                      ? 'bg-rose-100/80 border-rose-300 text-rose-950' 
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="font-bold text-slate-900 leading-tight">
                    {item.name}
                  </div>
                  
                  <div className="flex items-center justify-between font-mono text-[9px] pt-0.5 border-t border-black/5">
                    <span className="text-slate-600 truncate max-w-[80px]">
                      {supplierName ? supplierName : `Rs. ${item.sellingPrice?.toLocaleString() || 0}`}
                    </span>
                    <span className={`font-black px-1.5 py-0.2 rounded text-[9px] shrink-0 ${
                      isOut ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {item.quantity} {item.unitType || 'pcs'} {isOut ? 'OUT' : 'LOW'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );

    const detailedReportData = buildDailyClosingReportData(closing, {
      openingBalances,
      invoices,
      expenses,
      accountTransfers,
      users,
      currentUser
    });

    if (window.openUniversalPrintPreview) {
      window.openUniversalPrintPreview({
        documentType: 'Daily Closing',
        documentNumber: detailedReportData.voucherNumber,
        documentDate: closing.date,
        status: closing.status,
        profile: profile,
        title: 'Daily Cash & Sales Closing Voucher',
        dailyClosingData: detailedReportData,
        bodyHtml: undefined,
        items: [
          {
            sn: 1,
            name: 'Opening Cash Balance',
            description: 'Start-of-day cash drawer register balance',
            quantity: 1,
            unitPrice: openingCash,
            totalPrice: openingCash
          },
          {
            sn: 2,
            name: 'Cash Sales Receipts',
            description: 'Physical cash received from invoice sales',
            quantity: 1,
            unitPrice: closing.cashSales || 0,
            totalPrice: closing.cashSales || 0
          },
          {
            sn: 3,
            name: 'eSewa Online Wallet Sales',
            description: 'Digital payments collected via eSewa QR/Wallet',
            quantity: 1,
            unitPrice: closing.esewaSales || 0,
            totalPrice: closing.esewaSales || 0
          },
          {
            sn: 4,
            name: 'Rastriya Banijya Bank (RBB) Sales',
            description: 'Direct bank transfer payments for sales',
            quantity: 1,
            unitPrice: closing.bankSales || 0,
            totalPrice: closing.bankSales || 0
          },
          {
            sn: 5,
            name: 'Sahakari Cooperative Sales',
            description: 'Cooperative account payments received',
            quantity: 1,
            unitPrice: closing.sahakariSales || 0,
            totalPrice: closing.sahakariSales || 0
          },
          {
            sn: 6,
            name: 'Credit Due Sales (Outstanding)',
            description: 'Uncollected credit invoice sales issued today',
            quantity: 1,
            unitPrice: closing.dueSales || 0,
            totalPrice: closing.dueSales || 0
          },
          ...(closing.duesCollected && closing.duesCollected > 0 ? [{
            sn: 7,
            name: 'Past Dues Recouped Today',
            description: `Recouped from previous credit customers (${(closing.duesCollectedDetails || []).map(d => `${d.customerName} [${d.method}]`).join(', ')})`,
            quantity: 1,
            unitPrice: closing.duesCollected,
            totalPrice: closing.duesCollected
          }] : []),
          ...(closing.cashTransfersIn && closing.cashTransfersIn > 0 ? [{
            sn: 8,
            name: 'Inter-Account Cash Inflow',
            description: 'Transfers or Bank Withdrawals received into Cash Drawer',
            quantity: 1,
            unitPrice: closing.cashTransfersIn,
            totalPrice: closing.cashTransfersIn
          }] : []),
          {
            sn: 9,
            name: 'Approved Cash Expenditures',
            description: 'Operating expenses disbursed from physical cash drawer',
            quantity: 1,
            unitPrice: closing.cashExpenses || 0,
            totalPrice: closing.cashExpenses || 0
          },
          ...(closing.cashTransfersOut && closing.cashTransfersOut > 0 ? [{
            sn: 10,
            name: 'Inter-Account Cash Outflow',
            description: 'Cash Drawer funds transferred/deposited into Bank/Wallets',
            quantity: 1,
            unitPrice: closing.cashTransfersOut,
            totalPrice: closing.cashTransfersOut
          }] : []),
          ...(depositAmount > 0 ? [{
            sn: 11,
            name: `Closing Bank Deposit (${depositTargetText})`,
            description: `Cash deposited from drawer during daily closing`,
            quantity: 1,
            unitPrice: depositAmount,
            totalPrice: depositAmount
          }] : []),
          {
            sn: 12,
            name: 'Net Handover Cash (In Drawer)',
            description: `Opening Cash for Tomorrow. Denominations Count: ${denomText}`,
            quantity: 1,
            unitPrice: closing.remainingCash,
            totalPrice: closing.remainingCash
          }
        ],
        subtotal: totalIncomes,
        grandTotal: closing.remainingCash,
        amountInWords: `Net Handover Cash: Rs. ${closing.remainingCash.toLocaleString('en-IN')}`,
        notes: `Opening Cash: Rs. ${openingCash.toLocaleString()} | Deposits: ${depositTargetText}.\nPhysical Denomination Breakdown: ${denomText}.\nTotal Incomes: Rs. ${totalIncomes.toLocaleString()} | Total Expenses: Rs. ${totalExpenses.toLocaleString()}${urgentStockItems.length > 0 ? `\nLow Stock Alert: ${urgentStockItems.length} item(s) below 3 units.` : ''}${closing.adminRemarks ? `\nAudit Remarks: ${closing.adminRemarks}` : ''}`,
        preparedBy: closing.submittedBy,
        approvedBy: closing.approvedBy || `${profile?.name || 'Authorized'} Manager`
      });
      return;
    }

    // Fallback print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Daily Closing Report - ${closing.date}</title>
          <style>
            body { font-family: monospace; padding: 20px; color: #333; max-width: 450px; margin: 0 auto; line-height: 1.4; }
            h2, h3 { text-align: center; margin: 5px 0; }
            .divider { border-bottom: 2px double #333; margin: 15px 0; }
            .flex-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
            .font-bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <h3>${(profile?.name || 'RELIABLETECH SERVICES').toUpperCase()}</h3>
          <div style="text-align: center; font-size: 11px;">DAILY CLOSING REPORT - ${closing.date}</div>
          <div class="divider"></div>
          <div class="flex-row"><span>Opening Cash:</span><span>Rs. ${openingCash.toLocaleString()}</span></div>
          <div class="flex-row"><span>Total Sales:</span><span>Rs. ${closing.totalSales.toLocaleString()}</span></div>
          <div class="flex-row"><span>Dues Recouped:</span><span>Rs. ${closing.duesCollected.toLocaleString()}</span></div>
          <div class="flex-row"><span>Cash Expenses:</span><span>Rs. ${(closing.cashExpenses || 0).toLocaleString()}</span></div>
          <div class="flex-row"><span>Bank Deposits:</span><span>${depositTargetText}</span></div>
          <div class="divider"></div>
          <div class="flex-row font-bold"><span>Net Handover Cash:</span><span>Rs. ${closing.remainingCash.toLocaleString()}</span></div>
          <div style="font-size: 10px; margin-top: 10px;">Denominations: ${denomText}</div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Handle printing bulk date range summary
  const handlePrintRangeReport = () => {
    if (window.openUniversalPrintPreview) {
      window.openUniversalPrintPreview({
        documentType: 'Bulk Closing Report',
        documentNumber: `BULK-${rangeFromDate.replace(/\//g, '')}-${rangeToDate.replace(/\//g, '')}`,
        documentDate: `${rangeFromDate} to ${rangeToDate}`,
        status: 'Approved',
        profile: profile,
        title: `Consolidated Range Closing (${rangeFromDate} to ${rangeToDate})`,
        items: [
          {
            sn: 1,
            name: 'Initial Opening Cash Balance',
            description: `Cash balance at beginning of ${rangeFromDate}`,
            quantity: 1,
            unitPrice: rangeStats.rangeOpeningCash,
            totalPrice: rangeStats.rangeOpeningCash
          },
          {
            sn: 2,
            name: 'Total Cash Sales Receipts',
            description: 'Cash received from invoices in period',
            quantity: 1,
            unitPrice: rangeStats.cashSales,
            totalPrice: rangeStats.cashSales
          },
          {
            sn: 3,
            name: 'Total eSewa Sales Receipts',
            description: 'Digital payments via eSewa in period',
            quantity: 1,
            unitPrice: rangeStats.esewaSales,
            totalPrice: rangeStats.esewaSales
          },
          {
            sn: 4,
            name: 'Total RBB Bank Sales Receipts',
            description: 'Direct bank sales via RBB in period',
            quantity: 1,
            unitPrice: rangeStats.bankSales,
            totalPrice: rangeStats.bankSales
          },
          {
            sn: 5,
            name: 'Total Sahakari Sales Receipts',
            description: 'Cooperative account sales in period',
            quantity: 1,
            unitPrice: rangeStats.sahakariSales,
            totalPrice: rangeStats.sahakariSales
          },
          {
            sn: 6,
            name: 'Total Credit Due Sales Issued',
            description: 'Outstanding uncollected sales in period',
            quantity: 1,
            unitPrice: rangeStats.dueSales,
            totalPrice: rangeStats.dueSales
          },
          ...(rangeStats.duesCollected > 0 ? [{
            sn: 7,
            name: 'Past Dues Recouped in Period',
            description: `Recouped from credit customers (${rangeStats.duesCollectedDetails.length} payments)`,
            quantity: 1,
            unitPrice: rangeStats.duesCollected,
            totalPrice: rangeStats.duesCollected
          }] : []),
          ...(rangeStats.cashTransfersIn > 0 ? [{
            sn: 8,
            name: 'Inter-Account Cash Inflow Transfers',
            description: 'Fund transfers / Bank withdrawals to Cash drawer',
            quantity: 1,
            unitPrice: rangeStats.cashTransfersIn,
            totalPrice: rangeStats.cashTransfersIn
          }] : []),
          {
            sn: 9,
            name: 'Total Operating Expenditures Disbursed',
            description: `Operating expenses approved during range (Cash: Rs. ${rangeStats.cashExpenses.toLocaleString()})`,
            quantity: 1,
            unitPrice: rangeStats.totalExpenses,
            totalPrice: rangeStats.totalExpenses
          },
          ...(rangeStats.cashTransfersOut > 0 ? [{
            sn: 10,
            name: 'Inter-Account Cash Outflow Transfers',
            description: 'Fund transfers / Bank deposits from Cash drawer',
            quantity: 1,
            unitPrice: rangeStats.cashTransfersOut,
            totalPrice: rangeStats.cashTransfersOut
          }] : []),
          {
            sn: 11,
            name: 'Net Available Liquid Cash at Range Close',
            description: 'Total liquid drawer cash available at close',
            quantity: 1,
            unitPrice: rangeStats.totalCashAvailable,
            totalPrice: rangeStats.totalCashAvailable
          }
        ],
        subtotal: rangeStats.totalSales + rangeStats.duesCollected,
        grandTotal: rangeStats.totalCashAvailable,
        amountInWords: `Total Liquid Cash: Rs. ${rangeStats.totalCashAvailable.toLocaleString('en-IN')}`,
        notes: `Bulk Closing Summary covering ${rangeStats.dayByDay.length} day(s) from ${rangeFromDate} to ${rangeToDate}.\nProcessed by @reliableadmin (System Master).`,
        preparedBy: currentUser.name,
        approvedBy: `@reliableadmin (${currentUser.name})`
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="daily-closing-tab">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-display flex items-center gap-2">
            <span>Daily Closing & Multi-Account Settlement</span>
            {isReliableAdmin && (
              <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={11} className="text-amber-600" />
                @reliableadmin Master
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Reconcile daily cash flows, multiple split account deposits, inter-account transfers, and bulk date range closing.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setClosingTab('daily')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              closingTab === 'daily' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📝 Daily Closing Register</span>
          </button>
          <button
            onClick={() => setClosingTab('transfers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              closingTab === 'transfers' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🔄 Inter-Account FT</span>
            {accountTransfers && accountTransfers.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                closingTab === 'transfers' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {accountTransfers.length}
              </span>
            )}
          </button>
          {currentUser.role === 'Admin' && (
            <button
              onClick={() => setClosingTab('periodic')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                closingTab === 'periodic' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🏛️ Admin Closing Matrix</span>
            </button>
          )}
        </div>
      </div>

      {closingTab === 'transfers' ? (
        <InterAccountFTTab
          accountTransfers={accountTransfers}
          onUpdateAccountTransfers={onUpdateAccountTransfers}
          currentUser={currentUser}
          profile={profile}
          dailyClosings={dailyClosings}
          periodicClosings={periodicClosings}
          defaultDate={selectedDate}
          openingBalances={openingBalances}
          invoices={invoices}
          expenses={expenses}
          transactions={supplyTransactions}
          salaryDistributions={salaryDistributions}
          editRequests={editRequests}
          shareholders={shareholders}
          meetingNotes={meetingNotes}
        />
      ) : closingTab === 'periodic' && currentUser.role === 'Admin' ? (
        <PeriodicAdminClosingBoard 
          currentUser={currentUser}
          periodicClosings={periodicClosings}
          onSavePeriodicClosing={onSavePeriodicClosing}
          users={users}
          invoices={invoices}
          expenses={expenses}
          dailyClosings={dailyClosings}
          accountTransfers={accountTransfers}
          openingBalances={openingBalances}
          editRequests={editRequests}
          salaryDistributions={salaryDistributions}
          supplyTransactions={supplyTransactions}
          profile={profile}
          shareholders={shareholders}
          meetingNotes={meetingNotes}
        />
      ) : (
        <>
          {/* Mode Switcher for @reliableadmin / Admins */}
          {isReliableAdmin && (
            <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-slate-50 border border-indigo-150 rounded-2xl p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                  <SlidersHorizontal size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Settlement Mode Control</h4>
                  <p className="text-[10px] text-slate-500">Switch between individual day audit and bulk date range closing.</p>
                </div>
              </div>

              <div className="flex items-center bg-white/80 p-1 rounded-xl border border-indigo-200/80 shadow-2xs gap-1">
                <button
                  type="button"
                  onClick={() => setClosingMode('single')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    closingMode === 'single'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Calendar size={13} />
                  <span>Single Day Audit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setClosingMode('range')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    closingMode === 'range'
                      ? 'bg-gradient-to-r from-amber-600 to-indigo-600 text-white shadow-xs'
                      : 'text-amber-900 hover:bg-amber-100/60 font-semibold'
                  }`}
                >
                  <CalendarRange size={13} />
                  <span>📅 Bulk Date Range Closing</span>
                  <span className="text-[9px] bg-amber-200/60 text-amber-950 px-1.5 py-0.2 rounded font-mono font-bold">@reliableadmin</span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Audit & Closing Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ===================== MODE A: SINGLE DAY AUDIT ===================== */}
          {closingMode === 'single' && (
            <>
              {/* Select Date and Information Card */}
              <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 block">Select Audit Date</span>
                    <span className="text-xs font-mono font-bold text-indigo-600">{selectedDate} ({formatBsDate(selectedDate)})</span>
                  </div>
                </div>
                <div className="w-full sm:w-auto min-w-[220px]">
                  <NepaliDatePicker
                    value={selectedDate}
                    onChange={(newDate) => {
                      setSelectedDate(newDate);
                      setSelectedClosingToView(null);
                    }}
                    mode="date"
                    placeholder="YYYY-MM-DD (BS)"
                  />
                </div>
              </div>

              {/* Today's Transactions Overview */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-6">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-2">
                    <TrendingUp size={16} className="text-indigo-500" />
                    <span>Today's Cash & Inflow Ledger Details</span>
                  </h3>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase">
                    {dayStats.dayInvoices.length} Invoices
                  </span>
                </div>

                {/* Sales Revenue Breakdown Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden text-[11px] font-mono shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 font-bold text-slate-600 uppercase text-[9px] tracking-wider">
                        <th className="px-4 py-2.5">Sales Payment Channel</th>
                        <th className="px-4 py-2.5 text-center">Type</th>
                        <th className="px-4 py-2.5 text-right">Revenue Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      <tr className="hover:bg-slate-50 transition">
                        <td className="px-4 py-2.5 font-semibold text-slate-800">1. Cash Sales Receipts</td>
                        <td className="px-4 py-2.5 text-center"><span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[9px] font-bold">CASH</span></td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">Rs. {dayStats.cashSales.toLocaleString()}</td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition">
                        <td className="px-4 py-2.5 font-semibold text-slate-800">2. eSewa Online Wallet Sales</td>
                        <td className="px-4 py-2.5 text-center"><span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[9px] font-bold">DIGITAL</span></td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">Rs. {dayStats.esewaSales.toLocaleString()}</td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition">
                        <td className="px-4 py-2.5 font-semibold text-slate-800">3. Rastriya Banijya Bank (RBB) Sales</td>
                        <td className="px-4 py-2.5 text-center"><span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[9px] font-bold">BANK</span></td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">Rs. {dayStats.bankSales.toLocaleString()}</td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition">
                        <td className="px-4 py-2.5 font-semibold text-slate-800">4. Sahakari Cooperative Sales</td>
                        <td className="px-4 py-2.5 text-center"><span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[9px] font-bold">COOPERATIVE</span></td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">Rs. {dayStats.sahakariSales.toLocaleString()}</td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition bg-orange-50/20 text-orange-950">
                        <td className="px-4 py-2.5 font-semibold">5. Credit Due Sales (Outstanding)</td>
                        <td className="px-4 py-2.5 text-center"><span className="bg-orange-100 text-orange-800 border border-orange-200 px-2 py-0.5 rounded text-[9px] font-bold">CREDIT</span></td>
                        <td className="px-4 py-2.5 text-right font-bold text-orange-700">Rs. {dayStats.dueSales.toLocaleString()}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-900 text-white font-bold">
                        <td className="px-4 py-2.5" colSpan={2}>Total Gross Invoice Sales Today</td>
                        <td className="px-4 py-2.5 text-right font-black text-emerald-400">Rs. {dayStats.totalSales.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Dues Collected Details (Recorded Separately) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 font-display flex items-center justify-between">
                    <span>Dues Recouped Today</span>
                    {dayStats.duesCollected > 0 && (
                      <span className="text-[10px] font-mono text-emerald-700 font-bold">Total: Rs. {dayStats.duesCollected.toLocaleString()}</span>
                    )}
                  </h4>
                  {dayStats.duesCollectedDetails.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                      No customer due payments recollected today.
                    </p>
                  ) : (
                    <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-50 text-[11px]">
                      <div className="bg-slate-50/70 px-4 py-2 flex justify-between font-semibold text-slate-500 uppercase font-mono text-[9px]">
                        <span>Debtor Client</span>
                        <div className="flex gap-8">
                          <span>Method</span>
                          <span className="w-24 text-right">Recouped</span>
                        </div>
                      </div>
                      {dayStats.duesCollectedDetails.map((item, idx) => (
                        <div key={idx} className="px-4 py-2.5 flex justify-between items-center bg-white hover:bg-slate-50/50 transition">
                          <span className="font-bold text-slate-800">{item.customerName}</span>
                          <div className="flex gap-8 items-center font-mono">
                            <span className="text-indigo-600 font-semibold uppercase text-[9px] bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                              {item.method}
                            </span>
                            <span className="w-24 text-right font-bold text-emerald-600">Rs. {item.amount.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Inter-Account Fund Transfers Integration Section */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 font-display flex items-center gap-1.5">
                      <ArrowRightLeft size={14} className="text-indigo-600" />
                      <span>Inter-Account Fund Transfers Today</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      In: +Rs. {dayStats.cashTransfersIn.toLocaleString()} | Out: -Rs. {dayStats.cashTransfersOut.toLocaleString()}
                    </span>
                  </div>

                  {dayStats.dayTransfers.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                      No inter-account fund transfers recorded on this date.
                    </p>
                  ) : (
                    <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-50 text-[11px]">
                      <div className="bg-slate-50/70 px-4 py-2 flex justify-between font-semibold text-slate-500 uppercase font-mono text-[9px]">
                        <span>Transfer Voucher / Description</span>
                        <div className="flex gap-4">
                          <span>Impact on Drawer</span>
                          <span className="w-24 text-right">Amount</span>
                        </div>
                      </div>
                      {dayStats.dayTransfers.map((tx, idx) => {
                        const isCashIn = (tx.type === 'Withdrawal' && tx.sourceAccount !== 'Cash') || (tx.type === 'Transfer' && tx.destinationAccount === 'Cash');
                        const isCashOut = (tx.type === 'Deposit' && tx.sourceAccount !== 'Cash') || (tx.type === 'Transfer' && tx.sourceAccount === 'Cash' && tx.destinationAccount !== 'Cash');

                        return (
                          <div key={idx} className="px-4 py-2.5 flex justify-between items-center bg-white hover:bg-slate-50/50 transition">
                            <div className="space-y-0.5">
                              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                <span className="font-mono text-indigo-600 text-[10px]">{tx.voucherNumber || 'FT-TX'}</span>
                                <span>{tx.sourceAccount} → {tx.destinationAccount || (tx.type === 'Withdrawal' ? 'Cash Vault' : 'Account')}</span>
                              </div>
                              {tx.remarks && <p className="text-[10px] text-slate-400 italic">{tx.remarks}</p>}
                            </div>
                            <div className="flex gap-4 items-center font-mono">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                                isCashIn ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                isCashOut ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                'bg-slate-50 text-slate-600 border-slate-200'
                              }`}>
                                {isCashIn ? '+ Cash Inflow' : isCashOut ? '- Cash Outflow' : 'Non-Cash'}
                              </span>
                              <span className={`w-24 text-right font-bold ${
                                isCashIn ? 'text-emerald-600' : isCashOut ? 'text-rose-600' : 'text-slate-700'
                              }`}>
                                Rs. {tx.amount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Today's Approved Expenditures */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 font-display">Approved Expenditures Today</h4>
                    <span className="text-[10px] text-rose-700 font-mono font-bold">Total: Rs. {dayStats.totalExpenses.toLocaleString()}</span>
                  </div>
                  {dayStats.dayExpenses.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                      No approved expenditures recorded today.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-50 text-[11px]">
                        <div className="bg-slate-50/70 px-4 py-2 flex justify-between font-semibold text-slate-500 uppercase font-mono text-[9px]">
                          <span>Disbursed Reason / Description</span>
                          <div className="flex gap-8">
                            <span>Method</span>
                            <span className="w-24 text-right">Amount</span>
                          </div>
                        </div>
                        {dayStats.dayExpenses.map((exp, idx) => (
                          <div key={idx} className="px-4 py-2.5 flex justify-between items-center bg-white hover:bg-slate-50/50 transition">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{exp.title}</span>
                              <span className="text-[9px] text-slate-400 font-mono">Category: {exp.category}</span>
                            </div>
                            <div className="flex gap-8 items-center font-mono">
                              <span className="text-rose-600 font-semibold uppercase text-[9px] bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-md">
                                {exp.paymentMethod}
                              </span>
                              <span className="w-24 text-right font-bold text-rose-600">Rs. {exp.amount.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Account decrease summaries */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-rose-50/20 p-3 rounded-xl border border-rose-100/40">
                        <div className="text-center sm:text-left">
                          <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Cash Decreased</span>
                          <span className="text-xs font-bold font-mono text-rose-600">- Rs. {dayStats.cashExpenses.toLocaleString()}</span>
                        </div>
                        <div className="text-center sm:text-left">
                          <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">eSewa Decreased</span>
                          <span className="text-xs font-bold font-mono text-rose-600">- Rs. {dayStats.esewaExpenses.toLocaleString()}</span>
                        </div>
                        <div className="text-center sm:text-left">
                          <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">RBB Decreased</span>
                          <span className="text-xs font-bold font-mono text-rose-600">- Rs. {dayStats.bankExpenses.toLocaleString()}</span>
                        </div>
                        <div className="text-center sm:text-left">
                          <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Sahakari Decreased</span>
                          <span className="text-xs font-bold font-mono text-rose-600">- Rs. {dayStats.sahakariExpenses.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Closing State Banner */}
              {activeClosingForDate && (
                <div className={`rounded-xl border p-5 flex gap-4 items-start ${
                  activeClosingForDate.status === 'Approved' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-950' :
                  activeClosingForDate.status === 'Rejected' ? 'bg-rose-50/50 border-rose-100 text-rose-950' :
                  'bg-amber-50/50 border-amber-100 text-amber-950'
                }`}>
                  <div className={`p-2.5 rounded-xl text-white ${
                    activeClosingForDate.status === 'Approved' ? 'bg-emerald-600' :
                    activeClosingForDate.status === 'Rejected' ? 'bg-rose-600' :
                    'bg-amber-600'
                  }`}>
                    <ShieldCheck size={18} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm font-display">Daily Closing Recorded ({activeClosingForDate.status})</h4>
                      <span className="text-[10px] font-mono font-bold bg-white/75 px-2 py-0.5 rounded-md shadow-2xs">
                        Submitted by {activeClosingForDate.submittedBy}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      A daily closing request for {selectedDate} was saved and holds status <strong className="uppercase">{activeClosingForDate.status}</strong>.
                      {activeClosingForDate.approvedBy && (
                        <span> Action taken by <strong className="text-slate-800">{activeClosingForDate.approvedBy}</strong>.</span>
                      )}
                    </p>
                    {activeClosingForDate.adminRemarks && (
                      <p className="text-[11px] bg-white/40 border border-slate-150 p-2 rounded-lg mt-2 text-slate-700 font-mono italic">
                        <strong>Remarks:</strong> "{activeClosingForDate.adminRemarks}"
                      </p>
                    )}
                    
                    <div className="pt-2 flex gap-2 flex-wrap">
                      <button
                        onClick={() => handlePrint(activeClosingForDate)}
                        className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3.5 py-2 rounded-xl transition cursor-pointer shadow-xs"
                      >
                        <Printer size={13} />
                        <span>Print WYSIWYG Preview</span>
                      </button>
                      {currentUser.role === 'Admin' && activeClosingForDate.status === 'Pending' && (
                        <button
                          onClick={() => setSelectedClosingToView(activeClosingForDate)}
                          className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-3.5 py-2 rounded-xl transition cursor-pointer"
                        >
                          <ShieldCheck size={13} />
                          <span>Review & Authorize</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Settlement Form (Only when no active closing, if rejected, or if unlocked) */}
              {(!activeClosingForDate || activeClosingForDate.status === 'Rejected' || activeClosingForDate.unlocked) && (
                <form onSubmit={handleSubmitClosing} className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-6">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-2">
                        <DollarSign size={16} className="text-indigo-500" />
                        <span>Audit & Cash Settlement Form</span>
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1">Multi-account split deposits, inter-account transfers, and physical cash counting.</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                      {selectedDate}
                    </span>
                  </div>

                  {/* Cash Reconciliation Summary Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block">1. Opening Cash</span>
                      <p className="text-base font-bold font-mono text-slate-800">Rs. {numOpeningCash.toLocaleString()}</p>
                      <span className="text-[9px] text-slate-400">Start of Day</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-emerald-700 font-mono uppercase font-bold block">2. Incomes Today</span>
                      <p className="text-base font-bold font-mono text-emerald-700">+ Rs. {(dayStats.totalSales + dayStats.duesCollected + dayStats.cashTransfersIn).toLocaleString()}</p>
                      <span className="text-[9px] text-emerald-600">Sales + Dues + FT In</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-rose-700 font-mono uppercase font-bold block">3. Disbursed Today</span>
                      <p className="text-base font-bold font-mono text-rose-700">- Rs. {(dayStats.totalExpenses + dayStats.cashTransfersOut).toLocaleString()}</p>
                      <span className="text-[9px] text-rose-600">Expenses + FT Out</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-blue-700 font-mono uppercase font-bold block">4. Split Deposited</span>
                      <p className="text-base font-bold font-mono text-blue-700">- Rs. {totalSplitDeposited.toLocaleString()}</p>
                      <span className="text-[9px] text-blue-600 truncate block">
                        {splitDeposits.length === 0 ? 'No Deposit' : `${splitDeposits.length} Target Account(s)`}
                      </span>
                    </div>
                    <div className="space-y-0.5 border-t sm:border-t-0 sm:border-l border-slate-300 pt-2 sm:pt-0 sm:pl-3 col-span-2 sm:col-span-1 bg-slate-900 text-white p-2.5 rounded-lg">
                      <span className="text-[10px] text-indigo-300 font-mono font-bold uppercase block">5. Net Drawer Cash</span>
                      <p className="text-lg font-black font-mono text-emerald-400">Rs. {remainingCash.toLocaleString()}</p>
                      <span className="text-[9px] text-slate-300">Tomorrow Opening</span>
                    </div>
                  </div>

                  {/* Multi-Split Deposit Option with + and Delete Symbol */}
                  <div className="space-y-4 border-t border-slate-100 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 font-display flex items-center gap-1.5">
                          <Building2 size={14} className="text-indigo-600" />
                          <span>Deposit Cash into Bank / Account (Multi-Split Deposit)</span>
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          Add multiple deposit splits to RBB, eSewa, Sahakari or keep remaining cash in the register for tomorrow.
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleAddSplitDeposit('RBB')}
                          className="inline-flex items-center gap-1 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          <Plus size={13} />
                          <span>+ Add Split Deposit</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                      <span className="text-slate-400 font-medium">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={handleClearDeposits}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold cursor-pointer"
                      >
                        Keep 100% in Register (No Deposit)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDepositAllToAccount('RBB')}
                        className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md font-semibold cursor-pointer"
                      >
                        Deposit All to RBB
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDepositAllToAccount('Esewa')}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md font-semibold cursor-pointer"
                      >
                        Deposit All to eSewa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDepositAllToAccount('Sahakari')}
                        className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-md font-semibold cursor-pointer"
                      >
                        Deposit All to Sahakari
                      </button>
                      <button
                        type="button"
                        onClick={handleSplitEqually}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md font-semibold cursor-pointer"
                      >
                        Split 3-Way Evenly
                      </button>
                    </div>

                    {/* Multi-Split Rows List */}
                    {splitDeposits.length === 0 ? (
                      <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-xl p-4 text-center space-y-2">
                        <p className="text-xs text-slate-500">No bank deposits configured. 100% of cash (Rs. {totalCashAvailable.toLocaleString()}) will be kept in the register as opening cash for tomorrow.</p>
                        <button
                          type="button"
                          onClick={() => handleAddSplitDeposit('RBB')}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-indigo-50 cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>Add Deposit Target Account</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5 bg-slate-50/40 p-3 rounded-xl border border-slate-200">
                        {splitDeposits.map((split, index) => (
                          <div key={split.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
                            <div className="sm:col-span-4 space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Target Account #{index + 1}</label>
                              <select
                                value={split.targetAccount}
                                onChange={(e) => handleUpdateSplitDeposit(split.id, { targetAccount: e.target.value as any })}
                                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
                              >
                                <option value="RBB">🏛️ Rastriya Banijya Bank (RBB)</option>
                                <option value="Esewa">📱 eSewa Digital Wallet</option>
                                <option value="Sahakari">🤝 Sahakari Cooperative</option>
                              </select>
                            </div>

                            <div className="sm:col-span-4 space-y-1">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Deposit Amount</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const otherSum = splitDeposits
                                      .filter(s => s.id !== split.id)
                                      .reduce((sum, s) => sum + (parseFloat(String(s.amount)) || 0), 0);
                                    const maxAvail = Math.max(0, totalCashAvailable - otherSum);
                                    handleUpdateSplitDeposit(split.id, { amount: maxAvail });
                                  }}
                                  className="text-[9px] text-indigo-600 hover:underline font-mono"
                                >
                                  Max Remainder
                                </button>
                              </div>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-bold">Rs.</span>
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  max={totalCashAvailable}
                                  value={split.amount !== undefined ? split.amount : ''}
                                  placeholder="0.00"
                                  onChange={(e) => handleUpdateSplitDeposit(split.id, { amount: e.target.value })}
                                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-3 space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Voucher / Remarks</label>
                              <input
                                type="text"
                                value={split.remarks || ''}
                                placeholder="e.g. Voucher #102"
                                onChange={(e) => handleUpdateSplitDeposit(split.id, { remarks: e.target.value })}
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:border-indigo-500"
                              />
                            </div>

                            <div className="sm:col-span-1 flex justify-end sm:pt-4">
                              <button
                                type="button"
                                onClick={() => handleRemoveSplitDeposit(split.id)}
                                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete this split deposit"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}

                        <div className="flex justify-between items-center pt-2 px-1 text-xs">
                          <button
                            type="button"
                            onClick={() => handleAddSplitDeposit('RBB')}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                          >
                            <Plus size={13} />
                            <span>+ Add another split deposit</span>
                          </button>

                          <div className="font-mono text-right">
                            <span className="text-slate-500 text-[11px] mr-2">Total Split Deposits:</span>
                            <span className="font-bold text-indigo-700 text-sm">Rs. {totalSplitDeposited.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Physical Cash Denominations (Required if remaining cash > 0) */}
                  {remainingCash > 0 && (
                    <div className="space-y-4 border-t border-slate-100 pt-4 bg-slate-50/30 p-4 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-xs font-bold text-slate-700 font-display">Remaining Physical Cash Denominations</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Count the physical currency notes left in drawer (Rs. {remainingCash.toLocaleString()}).</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-slate-400">Total Counted</span>
                          <p className={`text-sm font-black font-mono ${isDenominationValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                            Rs. {denominationTotal.toLocaleString()} / Rs. {remainingCash.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[1000, 500, 100, 50, 20, 10, 5, 2, 1].map(val => (
                          <div key={val} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/80">
                            <span className="text-xs font-bold font-mono text-slate-700 w-12 text-right">Rs. {val}</span>
                            <span className="text-slate-400 text-xs">&times;</span>
                            <input
                              type="number"
                              min="0"
                              value={denominations[val as keyof CashDenomination] || ''}
                              placeholder="0"
                              onChange={(e) => {
                                const count = parseInt(e.target.value, 10) || 0;
                                setDenominations(prev => ({
                                  ...prev,
                                  [val]: count
                                }));
                              }}
                              className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-semibold focus:outline-hidden focus:border-indigo-500 text-right"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Remarks Input */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-4">
                    <label className="text-xs font-semibold text-slate-700 block">Closing Settlement Remarks / Notes</label>
                    <textarea
                      rows={2}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Add any specific notes on drawer cash handover or bank deposits..."
                      className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  {/* Submission Action */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={!isDenominationValid}
                      className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer ${
                        isDenominationValid
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                          : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Check size={16} />
                      <span>{isAdmin ? 'Audit, Settle & Relock Day' : 'Submit Settlement for Admin Approval'}</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ===================== MODE B: BULK DATE RANGE CLOSING (@reliableadmin) ===================== */}
          {closingMode === 'range' && (
            <div className="space-y-6">
              
              {/* Range Date Pickers Header */}
              <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-indigo-600 text-white rounded-xl shadow-xs">
                      <CalendarRange size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 font-display">Bulk Date Range Closing</h3>
                      <p className="text-xs text-slate-500">Audit all transactions up to the chosen date and perform bulk settlement.</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-300">
                    {rangeStats.dayByDay.length} Days in Span
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>From Date (BS)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Start of bulk closing span</span>
                    </label>
                    <NepaliDatePicker
                      value={rangeFromDate}
                      onChange={(newDate) => setRangeFromDate(newDate)}
                      mode="date"
                      placeholder="YYYY-MM-DD (BS)"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>To Date (BS)</span>
                      <span className="text-[10px] text-slate-400 font-normal">End of bulk closing span</span>
                    </label>
                    <NepaliDatePicker
                      value={rangeToDate}
                      onChange={(newDate) => setRangeToDate(newDate)}
                      mode="date"
                      placeholder="YYYY-MM-DD (BS)"
                    />
                  </div>
                </div>
              </div>

              {/* Range Cumulative Ledger Summary Matrix */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 font-display">
                      Range Transaction Totals ({rangeFromDate} to {rangeToDate})
                    </h4>
                    <p className="text-[10px] text-slate-400">Grand totals of all invoices, dues, expenditures, and fund transfers in selected range.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePrintRangeReport}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition cursor-pointer"
                  >
                    <Printer size={13} />
                    <span>Print Range Voucher</span>
                  </button>
                </div>

                {/* Range Key Metrics Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block">1. Start Opening Cash</span>
                    <p className="text-base font-bold font-mono text-slate-800">Rs. {rangeStats.rangeOpeningCash.toLocaleString()}</p>
                    <span className="text-[9px] text-slate-400">As of {rangeFromDate}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-emerald-700 font-mono uppercase font-bold block">2. Range Incomes</span>
                    <p className="text-base font-bold font-mono text-emerald-700">+ Rs. {(rangeStats.totalSales + rangeStats.duesCollected + rangeStats.cashTransfersIn).toLocaleString()}</p>
                    <span className="text-[9px] text-emerald-600">Sales + Dues + FT In</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-rose-700 font-mono uppercase font-bold block">3. Range Disbursed</span>
                    <p className="text-base font-bold font-mono text-rose-700">- Rs. {(rangeStats.totalExpenses + rangeStats.cashTransfersOut).toLocaleString()}</p>
                    <span className="text-[9px] text-rose-600">Expenses + FT Out</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-blue-700 font-mono uppercase font-bold block">4. Split Deposited</span>
                    <p className="text-base font-bold font-mono text-blue-700">- Rs. {totalSplitDeposited.toLocaleString()}</p>
                    <span className="text-[9px] text-blue-600">{splitDeposits.length} Target(s)</span>
                  </div>
                  <div className="space-y-0.5 border-t sm:border-t-0 sm:border-l border-slate-300 pt-2 sm:pt-0 sm:pl-3 col-span-2 sm:col-span-1 bg-slate-900 text-white p-2.5 rounded-lg">
                    <span className="text-[10px] text-indigo-300 font-mono font-bold uppercase block">5. Final Net Cash</span>
                    <p className="text-lg font-black font-mono text-emerald-400">Rs. {Math.max(0, rangeStats.totalCashAvailable - totalSplitDeposited).toLocaleString()}</p>
                    <span className="text-[9px] text-slate-300">Closing Cash</span>
                  </div>
                </div>

                {/* Range Channel Sales Breakdown */}
                <div className="border border-slate-200 rounded-xl overflow-hidden text-[11px] font-mono shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 font-bold text-slate-600 uppercase text-[9px]">
                        <th className="px-4 py-2">Channel</th>
                        <th className="px-4 py-2 text-right">Sales Receipts</th>
                        <th className="px-4 py-2 text-right">Dues Recouped</th>
                        <th className="px-4 py-2 text-right">Expenditures</th>
                        <th className="px-4 py-2 text-right">Net Flow</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      <tr>
                        <td className="px-4 py-2 font-bold text-slate-800">Cash Drawer / Vault</td>
                        <td className="px-4 py-2 text-right text-emerald-700 font-bold">Rs. {rangeStats.cashSales.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right text-emerald-700">Rs. {rangeStats.cashFromDues.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right text-rose-600 font-bold">- Rs. {rangeStats.cashExpenses.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right font-black text-slate-900">
                          Rs. {(rangeStats.cashSales + rangeStats.cashFromDues - rangeStats.cashExpenses).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-bold text-slate-800">eSewa Digital Wallet</td>
                        <td className="px-4 py-2 text-right text-indigo-700 font-bold">Rs. {rangeStats.esewaSales.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right text-slate-400">-</td>
                        <td className="px-4 py-2 text-right text-rose-600">- Rs. {rangeStats.esewaExpenses.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right font-black text-slate-900">
                          Rs. {(rangeStats.esewaSales - rangeStats.esewaExpenses).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-bold text-slate-800">RBB Bank Account</td>
                        <td className="px-4 py-2 text-right text-blue-700 font-bold">Rs. {rangeStats.bankSales.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right text-slate-400">-</td>
                        <td className="px-4 py-2 text-right text-rose-600">- Rs. {rangeStats.bankExpenses.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right font-black text-slate-900">
                          Rs. {(rangeStats.bankSales - rangeStats.bankExpenses).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-bold text-slate-800">Sahakari Cooperative</td>
                        <td className="px-4 py-2 text-right text-purple-700 font-bold">Rs. {rangeStats.sahakariSales.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right text-slate-400">-</td>
                        <td className="px-4 py-2 text-right text-rose-600">- Rs. {rangeStats.sahakariExpenses.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right font-black text-slate-900">
                          Rs. {(rangeStats.sahakariSales - rangeStats.sahakariExpenses).toLocaleString()}
                        </td>
                      </tr>
                      <tr className="bg-orange-50/30">
                        <td className="px-4 py-2 font-bold text-orange-900">Outstanding Credit Dues</td>
                        <td className="px-4 py-2 text-right text-orange-700 font-bold">Rs. {rangeStats.dueSales.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right text-emerald-700 font-bold">+ Rs. {rangeStats.duesCollected.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right text-slate-400">-</td>
                        <td className="px-4 py-2 text-right font-bold text-orange-800">
                          Rs. {(rangeStats.dueSales - rangeStats.duesCollected).toLocaleString()} (Net Due Growth)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Day-by-Day Audit Timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 font-display flex items-center justify-between">
                    <span>Day-by-Day Activity & Settlement Timeline</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {rangeStats.dayByDay.filter(d => d.isApproved).length} Closed / {rangeStats.dayByDay.length} Total Days
                    </span>
                  </h4>

                  <div className="border border-slate-200 rounded-xl overflow-hidden text-[11px] font-mono">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100/80 border-b border-slate-200 font-bold text-slate-600 uppercase text-[9px]">
                          <th className="px-3 py-2">Date (BS)</th>
                          <th className="px-3 py-2 text-right">Invoices</th>
                          <th className="px-3 py-2 text-right">Sales</th>
                          <th className="px-3 py-2 text-right">Dues Rec.</th>
                          <th className="px-3 py-2 text-right">Expenses</th>
                          <th className="px-3 py-2 text-right">FT Impact</th>
                          <th className="px-3 py-2 text-center">Status</th>
                          <th className="px-3 py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {rangeStats.dayByDay.map(day => {
                          const netFt = day.stats.cashTransfersIn - day.stats.cashTransfersOut;
                          return (
                            <tr key={day.date} className="hover:bg-slate-50 transition">
                              <td className="px-3 py-2 font-bold text-indigo-600">{day.date}</td>
                              <td className="px-3 py-2 text-right">{day.stats.dayInvoices.length}</td>
                              <td className="px-3 py-2 text-right font-bold text-slate-900">Rs. {day.stats.totalSales.toLocaleString()}</td>
                              <td className="px-3 py-2 text-right text-emerald-600">Rs. {day.stats.duesCollected.toLocaleString()}</td>
                              <td className="px-3 py-2 text-right text-rose-600">Rs. {day.stats.totalExpenses.toLocaleString()}</td>
                              <td className={`px-3 py-2 text-right font-bold ${netFt > 0 ? 'text-emerald-600' : netFt < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                {netFt > 0 ? `+Rs. ${netFt.toLocaleString()}` : netFt < 0 ? `-Rs. ${Math.abs(netFt).toLocaleString()}` : '-'}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                  day.isApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                  day.isPending ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                  'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                  {day.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDate(day.date);
                                    setClosingMode('single');
                                  }}
                                  className="text-[10px] text-indigo-600 hover:underline font-bold"
                                >
                                  Open Day ↗
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bulk Action Controls */}
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 font-display flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-600" />
                      <span>@reliableadmin Bulk Settlement Actions</span>
                    </h4>
                    <p className="text-[10px] text-amber-800 mt-0.5">
                      Bulk-close and lock all open days in this span chronologically with proper continuous cash carryover.
                    </p>
                  </div>

                  <div className="flex gap-3 flex-wrap items-center">
                    <button
                      type="button"
                      disabled={bulkProcessing}
                      onClick={handleBulkCloseAllDays}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer transition"
                    >
                      {bulkProcessing ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                      <span>Bulk Close & Authorize All Open Days</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrintRangeReport}
                      className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                    >
                      <Printer size={13} />
                      <span>Print Consolidated Voucher</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Right 1 Column: Summary, History & Admin Reviews */}
        <div className="space-y-6">
          
          {/* Urgent Stock Alert (< 3 Units) */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-5 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-500" />
                <span>Urgent Re-order Alerts</span>
              </h4>
              <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded-full">
                {(inventoryStock || []).filter(item => item.quantity < 3).length} Items
              </span>
            </div>

            {(() => {
              const lowStockItems = (inventoryStock || []).filter(item => item.quantity < 3);

              if (lowStockItems.length === 0) {
                return (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-center">
                    <p className="text-xs text-emerald-800 font-semibold">✓ All stock levels healthy</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">No products below 3 units threshold.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {lowStockItems.map((item, idx) => {
                    const isOut = item.quantity <= 0;
                    return (
                      <div key={idx} className={`p-2.5 rounded-xl border flex justify-between items-center text-xs ${
                        isOut ? 'bg-rose-50/70 border-rose-200' : 'bg-amber-50/60 border-amber-200'
                      }`}>
                        <div className="space-y-0.5 truncate pr-2">
                          <p className="font-bold text-slate-800 truncate">{item.name}</p>
                          <p className="text-[10px] font-mono text-slate-500">Selling: Rs. {item.sellingPrice?.toLocaleString() || 0}</p>
                        </div>
                        <span className={`text-[9px] font-mono font-bold px-2 py-1 rounded-md text-white shrink-0 ${
                          isOut ? 'bg-rose-600' : 'bg-amber-600'
                        }`}>
                          {item.quantity} {item.unitType || 'pcs'} {isOut ? 'OUT' : 'LOW'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
          
          {/* Admin Action Box for Selected Closing */}
          {selectedClosingToView && currentUser.role === 'Admin' && (
            <div className="bg-white border-2 border-indigo-500 rounded-xl p-5 shadow-md space-y-4">
              <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">Authorize Daily Closing</h4>
                  <p className="text-[10px] text-indigo-600 font-semibold">{selectedClosingToView.date}</p>
                </div>
                <button 
                  onClick={() => setSelectedClosingToView(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="text-xs text-slate-600 space-y-2 leading-relaxed bg-slate-50 p-3 rounded-lg">
                <p><strong>Prepared By:</strong> {selectedClosingToView.submittedBy}</p>
                <p><strong>Total Sales:</strong> Rs. {selectedClosingToView.totalSales.toLocaleString()}</p>
                <p><strong>Split Deposits:</strong> {
                  selectedClosingToView.splitDeposits && selectedClosingToView.splitDeposits.length > 0
                    ? selectedClosingToView.splitDeposits.map(s => `${s.targetAccount}: Rs. ${s.amount.toLocaleString()}`).join(', ')
                    : (selectedClosingToView.depositTarget !== 'None' ? `Rs. ${selectedClosingToView.depositAmount.toLocaleString()} to ${selectedClosingToView.depositTarget}` : 'No Deposit')
                }</p>
                <p><strong>Tomorrow Opening Cash:</strong> Rs. {selectedClosingToView.openingCashForTomorrow.toLocaleString()}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 block uppercase">Review Remarks / Notes *</label>
                <textarea 
                  rows={2}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="Enter remarks, approval check result..."
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-hidden"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!adminRemarks.trim()) {
                      alert('Please provide some remarks/notes for authorization verification.');
                      return;
                    }
                    onApproveClosing(selectedClosingToView.id, 'Approved', adminRemarks.trim(), currentUser.name);
                    setSelectedClosingToView(null);
                    setAdminRemarks('');
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-2 rounded-xl transition cursor-pointer text-center"
                >
                  Approve & Lock
                </button>
                <button
                  onClick={() => {
                    if (!adminRemarks.trim()) {
                      alert('Please provide some remarks/notes stating the rejection reason.');
                      return;
                    }
                    onApproveClosing(selectedClosingToView.id, 'Rejected', adminRemarks.trim(), currentUser.name);
                    setSelectedClosingToView(null);
                    setAdminRemarks('');
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold py-2 rounded-xl transition cursor-pointer text-center"
                >
                  Refuse & Return
                </button>
              </div>
            </div>
          )}

          {/* Daily Closings Historical Queue */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-800 text-sm font-display flex items-center gap-1.5">
                <Clock size={16} className="text-indigo-500" />
                <span>Closing History & Settlements</span>
              </h4>
              <span className="text-[10px] font-mono text-slate-400">{dailyClosings.length} Recorded</span>
            </div>
            
            {dailyClosings.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No historical records logged yet.</p>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {dailyClosings.map(c => (
                  <div key={c.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50/40 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold font-mono text-indigo-600">{c.date}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        c.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        c.status === 'Rejected' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {c.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-1 text-[10px] text-slate-500 font-mono">
                      <span>Sales: Rs. {c.totalSales.toLocaleString()}</span>
                      <span>Dues Rec: Rs. {c.duesCollected.toLocaleString()}</span>
                      <span>Tomorrow Cash: Rs. {c.openingCashForTomorrow.toLocaleString()}</span>
                      <span className="truncate">
                        Deposit: {
                          c.splitDeposits && c.splitDeposits.length > 0
                            ? `Rs. ${c.depositAmount.toLocaleString()} (Split ${c.splitDeposits.length})`
                            : (c.depositTarget !== 'None' ? `Rs. ${c.depositAmount.toLocaleString()}` : 'None')
                        }
                      </span>
                    </div>

                    {c.unlocked && (
                      <div className="mt-1 bg-amber-50 text-amber-800 p-2 rounded-lg border border-amber-150 text-[10px] space-y-0.5">
                        <p className="font-extrabold flex items-center gap-1">🔓 Ledger Unlocked by {c.unlockedBy || 'Admin'}</p>
                        <p className="italic font-sans">&ldquo;{c.unlockReason}&rdquo;</p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex gap-2 justify-end flex-wrap">
                      {c.unlocked && (
                        <>
                          {currentUser.role === 'Admin' && (
                            <button
                              onClick={() => handleInstantRedoAndLock(c)}
                              className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded font-bold transition cursor-pointer"
                              title="Instant calculation & lock based on current invoice values"
                            >
                              Redo & Lock (Auto)
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedDate(c.date);
                              setClosingMode('single');
                              alert(currentUser.role === 'Admin'
                                ? `Daily closing for ${c.date} has been loaded into the Audit & Cash Settlement form. Adjust split deposits or cash denominations, then click "Audit, Settle & Relock Day" to save.`
                                : `Daily closing for ${c.date} has been loaded into the form. Adjust split deposits or denominations, then click "Submit Settlement for Admin Approval".`
                              );
                            }}
                            className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded font-bold transition cursor-pointer"
                            title="Load closing in editor form to manually adjust"
                          >
                            {currentUser.role === 'Admin' ? "Redo & Lock (Form)" : "Redo & Submit (Form)"}
                          </button>
                        </>
                      )}
                      {currentUser.role === 'Admin' && (c.status === 'Approved' || c.status === 'Pending') && !c.unlocked && (
                        <button
                          onClick={() => {
                            if (!isReliableAdminMaster(currentUser)) {
                              alert("⚠️ Access Denied: Only @reliableadmin user account (System Master) is authorized to unlock completed daily closings.");
                              return;
                            }
                            const reason = prompt("Enter a specific reason for @reliableadmin (System Master) to unlock this date's transaction lock:");
                            if (reason && reason.trim()) {
                              onUnlockClosing?.(c.id, reason.trim(), '@reliableadmin (Arpan Khadka)');
                              alert(`SUCCESS: Daily closing for ${c.date} has been unlocked by @reliableadmin (System Master).`);
                            } else if (reason !== null) {
                              alert("An unlock reason is required.");
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded font-bold transition cursor-pointer"
                          title="Unlock today's transaction entry lock (@reliableadmin only)"
                        >
                          Unlock (@reliableadmin)
                        </button>
                      )}
                      <button
                        onClick={() => handlePrint(c)}
                        className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-md font-bold transition cursor-pointer"
                        title="Print / Preview Closing Voucher"
                      >
                        <Printer size={12} />
                        <span>Print Preview</span>
                      </button>
                      {currentUser.role === 'Admin' && c.status === 'Pending' && (
                        <button
                          onClick={() => setSelectedClosingToView(c)}
                          className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded font-bold cursor-pointer"
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
      </>
      )}

    </div>
  );
};
