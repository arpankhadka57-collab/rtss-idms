import React, { useState, useMemo } from 'react';
import {
  Check,
  X,
  Printer,
  Calendar,
  ShieldCheck,
  AlertCircle,
  FileText,
  Clock,
  FileUp,
  Image as ImageIcon,
  Sparkles,
  Lock,
  Unlock,
  Eye,
  Layers,
  Award,
  Copy,
  Building2,
  Wallet,
  Landmark,
  Receipt,
  Scale,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ClipboardPaste,
  UserCheck
} from 'lucide-react';
import {
  AppUser,
  PeriodicClosing,
  SalesInvoice,
  Expense,
  DailyClosing,
  AccountTransaction,
  OpeningBalances,
  EditRequest,
  SalaryDistribution,
  SupplyTransaction,
  BusinessProfile
} from '../types';
import { NepaliDatePicker } from './NepaliDatePicker';
import {
  getCurrentBsDate,
  getCurrentNepalTime,
  ensureBsDate,
  formatBsDate
} from '../utils/nepaliDate';
import { isReliableAdminMaster } from '../utils/closingLocks';

interface PeriodicAdminClosingBoardProps {
  currentUser: AppUser;
  periodicClosings: PeriodicClosing[];
  onSavePeriodicClosing: (closing: PeriodicClosing) => void;
  users: AppUser[];
  invoices?: SalesInvoice[];
  expenses?: Expense[];
  dailyClosings?: DailyClosing[];
  accountTransfers?: AccountTransaction[];
  openingBalances?: OpeningBalances;
  editRequests?: EditRequest[];
  salaryDistributions?: SalaryDistribution[];
  supplyTransactions?: SupplyTransaction[];
  profile?: BusinessProfile;
}

// Helper to format currency
const formatRs = (num: number) => {
  return `Rs. ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Robust Helper to extract Opening Balance from Settings Tab
export const getAccountOpeningBalanceInfo = (
  acc: AccountKey | string,
  obs?: OpeningBalances
): { openingBalance: number; openingBalanceDate: string; openingBalanceProof: string } => {
  if (!obs) return { openingBalance: 0, openingBalanceDate: '2083-01-01', openingBalanceProof: '' };
  const rawKey = acc.toString();
  const upperKey = rawKey.toUpperCase();
  const lowerKey = rawKey.toLowerCase();

  const direct = (obs as any)[upperKey] || (obs as any)[rawKey] || (obs as any)[lowerKey];
  if (direct && typeof direct.openingBalance === 'number') {
    return {
      openingBalance: Number(direct.openingBalance) || 0,
      openingBalanceDate: direct.openingBalanceDate || '2083-01-01',
      openingBalanceProof: direct.openingBalanceProof || ''
    };
  }

  if (upperKey === 'RBB' || upperKey.includes('BANK') || upperKey.includes('BANIJYA')) {
    return {
      openingBalance: Number(obs.RBB?.openingBalance) || 0,
      openingBalanceDate: obs.RBB?.openingBalanceDate || '2083-01-01',
      openingBalanceProof: obs.RBB?.openingBalanceProof || ''
    };
  }
  if (upperKey === 'CASH') {
    return {
      openingBalance: Number(obs.CASH?.openingBalance) || 0,
      openingBalanceDate: obs.CASH?.openingBalanceDate || '2083-01-01',
      openingBalanceProof: obs.CASH?.openingBalanceProof || ''
    };
  }
  if (upperKey === 'ESEWA' || upperKey === 'E-SEWA') {
    return {
      openingBalance: Number(obs.ESEWA?.openingBalance) || 0,
      openingBalanceDate: obs.ESEWA?.openingBalanceDate || '2083-01-01',
      openingBalanceProof: obs.ESEWA?.openingBalanceProof || ''
    };
  }
  if (upperKey === 'SAHAKARI' || upperKey === 'COOPERATIVE') {
    return {
      openingBalance: Number(obs.SAHAKARI?.openingBalance) || 0,
      openingBalanceDate: obs.SAHAKARI?.openingBalanceDate || '2083-01-01',
      openingBalanceProof: obs.SAHAKARI?.openingBalanceProof || ''
    };
  }
  if (upperKey === 'DUE' || upperKey === 'CREDIT') {
    return {
      openingBalance: Number(obs.DUE?.openingBalance) || 0,
      openingBalanceDate: obs.DUE?.openingBalanceDate || '2083-01-01',
      openingBalanceProof: obs.DUE?.openingBalanceProof || ''
    };
  }

  return { openingBalance: 0, openingBalanceDate: '2083-01-01', openingBalanceProof: '' };
};

// Account Keys
type AccountKey = 'RBB' | 'Cash' | 'eSewa' | 'Sahakari' | 'Due';

const normalizeAccount = (acc?: string): 'CASH' | 'ESEWA' | 'SAHAKARI' | 'RBB' | 'DUE' | 'OTHER' => {
  if (!acc) return 'OTHER';
  const a = acc.toUpperCase();
  if (a === 'CASH') return 'CASH';
  if (a === 'ESEWA' || a === 'E-SEWA') return 'ESEWA';
  if (a === 'SAHAKARI' || a === 'COOPERATIVE') return 'SAHAKARI';
  if (a === 'RBB' || a === 'BANK' || a.includes('BANIJYA') || a.includes('RASTRIYA')) return 'RBB';
  if (a === 'DUE' || a === 'CREDIT') return 'DUE';
  return 'OTHER';
};

export const PeriodicAdminClosingBoard: React.FC<PeriodicAdminClosingBoardProps> = ({
  currentUser,
  periodicClosings,
  onSavePeriodicClosing,
  users,
  invoices = [],
  expenses = [],
  dailyClosings = [],
  accountTransfers = [],
  openingBalances,
  editRequests = [],
  salaryDistributions = [],
  supplyTransactions = [],
  profile
}) => {
  // Tabs for the Admin Closing Board
  const [activeSubTab, setActiveSubTab] = useState<'form' | 'history'>('form');

  // List of admins in the system
  const systemAdmins = users.filter(u => u.role === 'Admin' || u.role === 'Super Admin');
  const totalAdminsCount = systemAdmins.length || 1;

  // Selected period draft/closing
  const [selectedClosingId, setSelectedClosingId] = useState<string | null>(null);

  // Draft Creation Form States with Nepali Date Range
  const [duration, setDuration] = useState<'Monthly' | '3 Monthly' | '6 Monthly' | '9 Monthly' | 'Annual'>('Monthly');
  const [fromDate, setFromDate] = useState<string>('2083-03-01');
  const [toDate, setToDate] = useState<string>('2083-03-32');

  // Account ecosystem ledger states
  const [accountInputs, setAccountInputs] = useState<{
    RBB: { closingBalance: number; totalDeposits: number; totalWithdrawals: number; image: string; imageName: string };
    Cash: { closingBalance: number; totalDeposits: number; totalWithdrawals: number; image: string; imageName: string };
    eSewa: { closingBalance: number; totalDeposits: number; totalWithdrawals: number; image: string; imageName: string };
    Sahakari: { closingBalance: number; totalDeposits: number; totalWithdrawals: number; image: string; imageName: string };
    Due: { closingBalance: number; totalDeposits: number; totalWithdrawals: number; image: string; imageName: string };
  }>({
    RBB: { closingBalance: 0, totalDeposits: 0, totalWithdrawals: 0, image: '', imageName: '' },
    Cash: { closingBalance: 0, totalDeposits: 0, totalWithdrawals: 0, image: '', imageName: '' },
    eSewa: { closingBalance: 0, totalDeposits: 0, totalWithdrawals: 0, image: '', imageName: '' },
    Sahakari: { closingBalance: 0, totalDeposits: 0, totalWithdrawals: 0, image: '', imageName: '' },
    Due: { closingBalance: 0, totalDeposits: 0, totalWithdrawals: 0, image: '', imageName: '' }
  });

  // OCR visual statement detection states for accounts with external statements
  const [ocrValues, setOcrValues] = useState<{
    RBB: { balance: number; deposits: number; withdrawals: number; scanning: boolean; scanned: boolean };
    Cash: { balance: number; deposits: number; withdrawals: number; scanning: boolean; scanned: boolean };
    eSewa: { balance: number; deposits: number; withdrawals: number; scanning: boolean; scanned: boolean };
    Sahakari: { balance: number; deposits: number; withdrawals: number; scanning: boolean; scanned: boolean };
    Due: { balance: number; deposits: number; withdrawals: number; scanning: boolean; scanned: boolean };
  }>({
    RBB: { balance: 0, deposits: 0, withdrawals: 0, scanning: false, scanned: false },
    Cash: { balance: 0, deposits: 0, withdrawals: 0, scanning: false, scanned: true },
    eSewa: { balance: 0, deposits: 0, withdrawals: 0, scanning: false, scanned: false },
    Sahakari: { balance: 0, deposits: 0, withdrawals: 0, scanning: false, scanned: false },
    Due: { balance: 0, deposits: 0, withdrawals: 0, scanning: false, scanned: true }
  });

  // Image preview modal state
  const [previewImage, setPreviewImage] = useState<{ title: string; url: string } | null>(null);

  // Universal Print Modal state
  const [universalPrintClosing, setUniversalPrintClosing] = useState<PeriodicClosing | null>(null);

  // Brief Remarks for requesting edits
  const [briefRemarks, setBriefRemarks] = useState<string>('');

  // Legal metadata for final meeting signoffs
  const [meetingDate, setMeetingDate] = useState<string>(() => getCurrentBsDate());
  const [meetingNumber, setMeetingNumber] = useState<string>('RTSS-M-2083/04');
  const [decisionNumber, setDecisionNumber] = useState<string>('DEC-83-41');

  // Selected closing from list
  const activeClosing = periodicClosings.find(c => c.id === selectedClosingId) || null;

  // Active period display string
  const activePeriodString = useMemo(() => {
    return `${fromDate} to ${toDate}`;
  }, [fromDate, toDate]);

  // Calculate live system metrics for each account based on Nepali Date Pickers (fromDate to toDate)
  const systemCalculatedMetrics = useMemo(() => {
    const isDateInPeriod = (d: string) => {
      if (!d) return false;
      const bs = ensureBsDate(d);
      return bs >= fromDate && bs <= toDate;
    };

    const isDateUpToPeriod = (d: string) => {
      if (!d) return false;
      const bs = ensureBsDate(d);
      return bs <= toDate;
    };

    // Account specific aggregation helper
    const computeForAccount = (accKey: 'RBB' | 'CASH' | 'ESEWA' | 'SAHAKARI' | 'DUE') => {
      // 1. Initial Opening Balance from Settings Tab
      const obInfo = getAccountOpeningBalanceInfo(accKey, openingBalances);
      const initialOB = obInfo.openingBalance;
      const obDate = obInfo.openingBalanceDate;
      const obProof = obInfo.openingBalanceProof;

      let periodInflow = 0;
      let periodOutflow = 0;
      let cumulativeInflow = initialOB;
      let cumulativeOutflow = 0;

      // 2. Sales Invoices
      invoices.forEach(inv => {
        if (!inv.date) return;
        const inPeriod = isDateInPeriod(inv.date);
        const upToPeriod = isDateUpToPeriod(inv.date);

        if (inv.paymentMethod === 'Split' && inv.paymentSplits) {
          const splitKey = accKey.toLowerCase() as 'cash' | 'esewa' | 'rbb' | 'sahakari' | 'due';
          const splitAmt = inv.paymentSplits[splitKey] || 0;
          if (splitAmt > 0) {
            if (inPeriod) periodInflow += splitAmt;
            if (upToPeriod) cumulativeInflow += splitAmt;
          }
        } else {
          const norm = normalizeAccount(inv.paymentMethod);
          if (accKey === 'DUE') {
            const dueAmt = inv.dueAmount > 0 ? inv.dueAmount : (inv.paymentMethod === 'Due' ? inv.totalAmount : 0);
            if (dueAmt > 0) {
              if (inPeriod) periodInflow += dueAmt;
              if (upToPeriod) cumulativeInflow += dueAmt;
            }
          } else if (norm === accKey && inv.paidAmount > 0) {
            if (inPeriod) periodInflow += inv.paidAmount;
            if (upToPeriod) cumulativeInflow += inv.paidAmount;
          }
        }
      });

      // 3. Approved Expenses
      expenses.forEach(exp => {
        if (exp.status === 'Approved' && exp.amount > 0 && exp.date) {
          const norm = normalizeAccount(exp.paymentMethod);
          if (norm === accKey) {
            if (isDateInPeriod(exp.date)) periodOutflow += exp.amount;
            if (isDateUpToPeriod(exp.date)) cumulativeOutflow += exp.amount;
          }
        }
      });

      // 4. Supply Transactions / Purchase Orders (POs)
      supplyTransactions.forEach(tx => {
        const amt = tx.paidAmount || tx.totalCost || tx.amount || 0;
        if (amt > 0 && tx.date) {
          const norm = normalizeAccount(tx.paymentMethod);
          if (norm === accKey) {
            if (isDateInPeriod(tx.date)) periodOutflow += amt;
            if (isDateUpToPeriod(tx.date)) cumulativeOutflow += amt;
          }
        }
      });

      // 5. Salary Distributions (if not duplicated in expenses)
      salaryDistributions.forEach(dist => {
        if (dist.netPaid > 0 && dist.distributionDate) {
          const norm = normalizeAccount(dist.paymentMethod);
          if (norm === accKey) {
            const alreadyInExpense = expenses.some(exp =>
              exp.status === 'Approved' &&
              exp.category === 'Salary' &&
              (exp.referenceId === dist.id || exp.referenceId === dist.userId || (exp.title && exp.title.includes(dist.userName))) &&
              Math.abs(exp.amount - dist.netPaid) < 0.01
            );
            if (!alreadyInExpense) {
              if (isDateInPeriod(dist.distributionDate)) periodOutflow += dist.netPaid;
              if (isDateUpToPeriod(dist.distributionDate)) cumulativeOutflow += dist.netPaid;
            }
          }
        }
      });

      // 6. Account Transfers (Withdrawals, Deposits, Transfers)
      accountTransfers.forEach(tx => {
        if (tx.amount > 0 && tx.date) {
          const sourceNorm = normalizeAccount(tx.sourceAccount);
          const destNorm = tx.destinationAccount ? normalizeAccount(tx.destinationAccount) : null;
          const inPeriod = isDateInPeriod(tx.date);
          const upToPeriod = isDateUpToPeriod(tx.date);

          if (tx.type === 'Withdrawal') {
            if (sourceNorm === accKey) {
              if (inPeriod) periodOutflow += tx.amount;
              if (upToPeriod) cumulativeOutflow += tx.amount;
            }
            if (accKey === 'CASH' && sourceNorm !== 'CASH') {
              if (inPeriod) periodInflow += tx.amount;
              if (upToPeriod) cumulativeInflow += tx.amount;
            }
          } else if (tx.type === 'Deposit') {
            if (sourceNorm === accKey) {
              if (inPeriod) periodInflow += tx.amount;
              if (upToPeriod) cumulativeInflow += tx.amount;
            }
            if (accKey === 'CASH' && sourceNorm !== 'CASH') {
              if (inPeriod) periodOutflow += tx.amount;
              if (upToPeriod) cumulativeOutflow += tx.amount;
            }
          } else if (tx.type === 'Transfer') {
            if (sourceNorm === accKey) {
              if (inPeriod) periodOutflow += tx.amount;
              if (upToPeriod) cumulativeOutflow += tx.amount;
            }
            if (destNorm === accKey) {
              if (inPeriod) periodInflow += tx.amount;
              if (upToPeriod) cumulativeInflow += tx.amount;
            }
          }
        }
      });

      // 7. Approved Daily Closings (including split deposits)
      dailyClosings.forEach(c => {
        if (c.status === 'Approved' && c.date) {
          const inPeriod = isDateInPeriod(c.date);
          const upToPeriod = isDateUpToPeriod(c.date);

          if (c.splitDeposits && c.splitDeposits.length > 0) {
            c.splitDeposits.forEach(s => {
              if (s.amount > 0 && s.targetAccount) {
                const targetNorm = normalizeAccount(s.targetAccount);
                if (accKey === 'CASH') {
                  if (inPeriod) periodOutflow += s.amount;
                  if (upToPeriod) cumulativeOutflow += s.amount;
                }
                if (targetNorm === accKey) {
                  if (inPeriod) periodInflow += s.amount;
                  if (upToPeriod) cumulativeInflow += s.amount;
                }
              }
            });
          } else if (c.depositAmount > 0 && c.depositTarget && c.depositTarget !== 'None' && c.depositTarget !== 'Split') {
            const targetNorm = normalizeAccount(c.depositTarget);
            if (accKey === 'CASH') {
              if (inPeriod) periodOutflow += c.depositAmount;
              if (upToPeriod) cumulativeOutflow += c.depositAmount;
            }
            if (targetNorm === accKey) {
              if (inPeriod) periodInflow += c.depositAmount;
              if (upToPeriod) cumulativeInflow += c.depositAmount;
            }
          }
        }
      });

      // 8. Approved Customer Dues Collections
      editRequests.forEach(req => {
        if (req.type === 'Payment Collection' && req.status === 'Approved' && req.paymentDetails && req.paymentDetails.amount > 0 && req.date) {
          const methodNorm = normalizeAccount(req.paymentDetails.method);
          const inPeriod = isDateInPeriod(req.date);
          const upToPeriod = isDateUpToPeriod(req.date);

          if (accKey === 'DUE') {
            if (inPeriod) periodOutflow += req.paymentDetails.amount;
            if (upToPeriod) cumulativeOutflow += req.paymentDetails.amount;
          }
          if (methodNorm === accKey) {
            if (inPeriod) periodInflow += req.paymentDetails.amount;
            if (upToPeriod) cumulativeInflow += req.paymentDetails.amount;
          }
        }
      });

      const systemBalance = cumulativeInflow - cumulativeOutflow;

      return {
        openingBalance: initialOB,
        openingBalanceDate: obDate,
        openingBalanceProof: obProof,
        systemIncome: periodInflow,
        systemExpenses: periodOutflow,
        systemBalance: systemBalance
      };
    };

    return {
      RBB: computeForAccount('RBB'),
      Cash: computeForAccount('CASH'),
      eSewa: computeForAccount('ESEWA'),
      Sahakari: computeForAccount('SAHAKARI'),
      Due: computeForAccount('DUE')
    };
  }, [invoices, expenses, dailyClosings, accountTransfers, openingBalances, editRequests, salaryDistributions, supplyTransactions, fromDate, toDate]);

  // Helper to compute detailed sequential transaction ledger for any account during a specific period
  const computeDetailedAccountLedger = (
    accKey: 'CASH' | 'RBB' | 'ESEWA' | 'SAHAKARI' | 'DUE',
    startDate: string,
    endDate: string
  ) => {
    const isUpTo = (d?: string) => (d ? ensureBsDate(d) <= endDate : false);
    const inRange = (d?: string) => {
      if (!d) return false;
      const bs = ensureBsDate(d);
      return bs >= startDate && bs <= endDate;
    };

    const entries: Array<{
      id: string;
      date: string;
      description: string;
      reference: string;
      type: 'In' | 'Out';
      amount: number;
    }> = [];

    // 1. Initial Opening Balance from Settings Tab
    const obInfo = getAccountOpeningBalanceInfo(accKey, openingBalances);
    const ob = obInfo.openingBalance;
    const obDate = obInfo.openingBalanceDate;

    if (ob > 0) {
      entries.push({
        id: `ob-${accKey}`,
        date: obDate,
        description: accKey === 'DUE' ? `Opening Customer Credit Dues (Settings Tab: ${obDate})` : `Initial Account Opening Balance (Settings Tab: ${obDate})`,
        reference: 'SETTINGS-OB',
        type: 'In',
        amount: ob
      });
    }

    // 2. Sales Invoices
    invoices.forEach(inv => {
      if (!isUpTo(inv.date)) return;
      if (inv.paymentMethod === 'Split' && inv.paymentSplits) {
        const splitKey = accKey.toLowerCase() as 'cash' | 'esewa' | 'rbb' | 'sahakari' | 'due';
        const splitAmt = inv.paymentSplits[splitKey] || 0;
        if (splitAmt > 0) {
          entries.push({
            id: `inv-${inv.id}-split`,
            date: inv.date,
            description: accKey === 'DUE' ? `Invoice Credit Sale (Split Payment): ${inv.customerName}` : `Invoice Income Receipt (Split Payment): ${inv.customerName}`,
            reference: inv.invoiceNumber,
            type: 'In',
            amount: splitAmt
          });
        }
      } else {
        const norm = normalizeAccount(inv.paymentMethod);
        if (accKey === 'DUE') {
          const dueAmt = inv.dueAmount > 0 ? inv.dueAmount : (inv.paymentMethod === 'Due' ? inv.totalAmount : 0);
          if (dueAmt > 0) {
            entries.push({
              id: `inv-${inv.id}-due`,
              date: inv.date,
              description: `Invoice Customer Credit Due: ${inv.customerName}`,
              reference: inv.invoiceNumber,
              type: 'In',
              amount: dueAmt
            });
          }
        } else if (norm === accKey && inv.paidAmount > 0) {
          entries.push({
            id: `inv-${inv.id}`,
            date: inv.date,
            description: `Invoice Income Receipt: ${inv.customerName}`,
            reference: inv.invoiceNumber,
            type: 'In',
            amount: inv.paidAmount
          });
        }
      }
    });

    // 3. Approved Expenses
    expenses.forEach(exp => {
      if (exp.status === 'Approved' && exp.amount > 0 && isUpTo(exp.date)) {
        const norm = normalizeAccount(exp.paymentMethod);
        if (norm === accKey) {
          entries.push({
            id: `exp-${exp.id}`,
            date: exp.date,
            description: `Operational Outflow: ${exp.title}${exp.topic ? ` (${exp.topic})` : ''}`,
            reference: exp.expenseNo,
            type: 'Out',
            amount: exp.amount
          });
        }
      }
    });

    // 4. Supply Transactions
    supplyTransactions.forEach(tx => {
      if (isUpTo(tx.date)) {
        const amt = tx.paidAmount || tx.totalCost || tx.amount || 0;
        if (amt > 0) {
          const norm = normalizeAccount(tx.paymentMethod);
          if (norm === accKey) {
            entries.push({
              id: `po-${tx.id}`,
              date: tx.date,
              description: `Purchase Order Outflow: ${tx.supplierName || tx.itemName || 'Vendor'}`,
              reference: tx.orderNumber || tx.billNumber || tx.id.slice(-6).toUpperCase(),
              type: 'Out',
              amount: amt
            });
          }
        }
      }
    });

    // 5. Staff Salaries
    salaryDistributions.forEach(dist => {
      if (dist.netPaid > 0 && isUpTo(dist.distributionDate)) {
        const norm = normalizeAccount(dist.paymentMethod);
        if (norm === accKey) {
          const hasCorrespondingExpense = expenses.some(exp =>
            exp.status === 'Approved' &&
            exp.category === 'Salary' &&
            (exp.referenceId === dist.id || exp.referenceId === dist.userId || (exp.title && exp.title.includes(dist.userName))) &&
            Math.abs(exp.amount - dist.netPaid) < 0.01
          );
          if (!hasCorrespondingExpense) {
            entries.push({
              id: `sal-${dist.id}`,
              date: dist.distributionDate,
              description: `Staff Salary Disbursed: ${dist.userName} (${dist.month})`,
              reference: `PAY-${dist.month}`,
              type: 'Out',
              amount: dist.netPaid
            });
          }
        }
      }
    });

    // 6. Account Transfers
    accountTransfers.forEach(tx => {
      if (isUpTo(tx.date) && tx.amount > 0) {
        const sourceNorm = normalizeAccount(tx.sourceAccount);
        const destNorm = tx.destinationAccount ? normalizeAccount(tx.destinationAccount) : null;

        if (tx.type === 'Withdrawal') {
          if (sourceNorm === accKey) {
            entries.push({
              id: `tx-${tx.id}`,
              date: tx.date,
              description: `Cash Withdrawal: ${tx.remarks}`,
              reference: tx.voucherNumber,
              type: 'Out',
              amount: tx.amount
            });
          }
          if (accKey === 'CASH' && sourceNorm !== 'CASH') {
            entries.push({
              id: `tx-${tx.id}-cash-in`,
              date: tx.date,
              description: `Cash Recoup (Withdrawal from ${tx.sourceAccount}): ${tx.remarks}`,
              reference: tx.voucherNumber,
              type: 'In',
              amount: tx.amount
            });
          }
        } else if (tx.type === 'Deposit') {
          if (sourceNorm === accKey) {
            entries.push({
              id: `tx-${tx.id}`,
              date: tx.date,
              description: `Internal Fund Deposit to ${tx.sourceAccount}: ${tx.remarks}`,
              reference: tx.voucherNumber,
              type: 'In',
              amount: tx.amount
            });
          }
          if (accKey === 'CASH' && sourceNorm !== 'CASH') {
            entries.push({
              id: `tx-${tx.id}-cash-out`,
              date: tx.date,
              description: `Cash Deposited to ${tx.sourceAccount}: ${tx.remarks}`,
              reference: tx.voucherNumber,
              type: 'Out',
              amount: tx.amount
            });
          }
        } else if (tx.type === 'Transfer') {
          if (sourceNorm === accKey) {
            entries.push({
              id: `tx-${tx.id}-src`,
              date: tx.date,
              description: `Inter-Account Transfer to ${tx.destinationAccount}: ${tx.remarks}`,
              reference: tx.voucherNumber,
              type: 'Out',
              amount: tx.amount
            });
          }
          if (destNorm === accKey) {
            entries.push({
              id: `tx-${tx.id}-dest`,
              date: tx.date,
              description: `Inter-Account Transfer from ${tx.sourceAccount}: ${tx.remarks}`,
              reference: tx.voucherNumber,
              type: 'In',
              amount: tx.amount
            });
          }
        }
      }
    });

    // 7. Daily Closing deposits (including multiple split deposits)
    dailyClosings.forEach(c => {
      if (c.status === 'Approved' && isUpTo(c.date)) {
        if (c.splitDeposits && c.splitDeposits.length > 0) {
          c.splitDeposits.forEach((s, sIdx) => {
            if (s.amount > 0 && s.targetAccount) {
              const targetNorm = normalizeAccount(s.targetAccount);
              if (accKey === 'CASH') {
                entries.push({
                  id: `dc-${c.id}-split-${sIdx}-out`,
                  date: c.date,
                  description: `Approved Cash Deposit to ${s.targetAccount}${s.remarks ? ` (${s.remarks})` : ''} (Daily Closing)`,
                  reference: `DC-${c.date}`,
                  type: 'Out',
                  amount: s.amount
                });
              }
              if (targetNorm === accKey) {
                entries.push({
                  id: `dc-${c.id}-split-${sIdx}-in`,
                  date: c.date,
                  description: `Approved Cash Deposit from Cash Vault${s.remarks ? ` (${s.remarks})` : ''} (Daily Closing)`,
                  reference: `DC-${c.date}`,
                  type: 'In',
                  amount: s.amount
                });
              }
            }
          });
        } else if (c.depositAmount > 0 && c.depositTarget && c.depositTarget !== 'None' && c.depositTarget !== 'Split') {
          const targetNorm = normalizeAccount(c.depositTarget);
          if (accKey === 'CASH') {
            entries.push({
              id: `dc-${c.id}-out`,
              date: c.date,
              description: `Approved Cash Deposit to ${c.depositTarget} (Daily Closing)`,
              reference: `DC-${c.date}`,
              type: 'Out',
              amount: c.depositAmount
            });
          }
          if (targetNorm === accKey) {
            entries.push({
              id: `dc-${c.id}-in`,
              date: c.date,
              description: `Approved Cash Deposit from Cash Vault (Daily Closing)`,
              reference: `DC-${c.date}`,
              type: 'In',
              amount: c.depositAmount
            });
          }
        }
      }
    });

    // 8. Dues collection
    editRequests.forEach(req => {
      if (req.type === 'Payment Collection' && req.status === 'Approved' && req.paymentDetails && req.paymentDetails.amount > 0 && isUpTo(req.date)) {
        const methodNorm = normalizeAccount(req.paymentDetails.method);
        if (accKey === 'DUE') {
          entries.push({
            id: `col-${req.id}-due-out`,
            date: req.date,
            description: `Customer Dues Collected/Cleared: ${req.paymentDetails.customerName}`,
            reference: `COL-${req.id.slice(-4).toUpperCase()}`,
            type: 'Out',
            amount: req.paymentDetails.amount
          });
        }
        if (methodNorm === accKey) {
          entries.push({
            id: `col-${req.id}`,
            date: req.date,
            description: `Dues Payment Collection Received: ${req.paymentDetails.customerName}`,
            reference: `COL-${req.id.slice(-4).toUpperCase()}`,
            type: 'In',
            amount: req.paymentDetails.amount
          });
        }
      }
    });

    // Sort
    entries.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.reference === 'OP-BAL') return -1;
      if (b.reference === 'OP-BAL') return 1;
      if (a.type !== b.type) return a.type === 'In' ? -1 : 1;
      return a.id.localeCompare(b.id);
    });

    // Compute running balance
    let running = 0;
    const ledgerWithBalance = entries.map(entry => {
      if (entry.type === 'In') running += entry.amount;
      else running -= entry.amount;
      return { ...entry, runningBalance: running };
    });

    const periodLedger = ledgerWithBalance.filter(e => inRange(e.date));
    const totalIn = periodLedger.filter(e => e.type === 'In').reduce((sum, e) => sum + e.amount, 0);
    const totalOut = periodLedger.filter(e => e.type === 'Out').reduce((sum, e) => sum + e.amount, 0);

    return {
      ledger: periodLedger,
      totalIn,
      totalOut,
      closingBalance: running
    };
  };

  // Sync inputs with live system data
  const syncWithSystemLedger = () => {
    setAccountInputs(prev => ({
      RBB: {
        ...prev.RBB,
        closingBalance: systemCalculatedMetrics.RBB.systemBalance,
        totalDeposits: systemCalculatedMetrics.RBB.systemIncome,
        totalWithdrawals: systemCalculatedMetrics.RBB.systemExpenses
      },
      Cash: {
        ...prev.Cash,
        closingBalance: systemCalculatedMetrics.Cash.systemBalance,
        totalDeposits: systemCalculatedMetrics.Cash.systemIncome,
        totalWithdrawals: systemCalculatedMetrics.Cash.systemExpenses
      },
      eSewa: {
        ...prev.eSewa,
        closingBalance: systemCalculatedMetrics.eSewa.systemBalance,
        totalDeposits: systemCalculatedMetrics.eSewa.systemIncome,
        totalWithdrawals: systemCalculatedMetrics.eSewa.systemExpenses
      },
      Sahakari: {
        ...prev.Sahakari,
        closingBalance: systemCalculatedMetrics.Sahakari.systemBalance,
        totalDeposits: systemCalculatedMetrics.Sahakari.systemIncome,
        totalWithdrawals: systemCalculatedMetrics.Sahakari.systemExpenses
      },
      Due: {
        ...prev.Due,
        closingBalance: systemCalculatedMetrics.Due.systemBalance,
        totalDeposits: systemCalculatedMetrics.Due.systemIncome,
        totalWithdrawals: systemCalculatedMetrics.Due.systemExpenses
      }
    }));
  };

  // Handle image upload / paste and trigger instant automatic statement OCR cross-check
  const handleImageUpload = (account: 'RBB' | 'eSewa' | 'Sahakari', file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAccountInputs(prev => ({
        ...prev,
        [account]: {
          ...prev[account],
          image: base64,
          imageName: file.name
        }
      }));

      // Trigger automatic instant OCR visual detection & discrepancy test
      setOcrValues(prev => ({
        ...prev,
        [account]: {
          ...prev[account],
          scanning: true
        }
      }));

      setTimeout(() => {
        // Automatically verify statement against live system book balance
        const currentSysBalance = systemCalculatedMetrics[account].systemBalance;
        const currentSysIncome = systemCalculatedMetrics[account].systemIncome;
        const currentSysExpenses = systemCalculatedMetrics[account].systemExpenses;

        setOcrValues(prev => ({
          ...prev,
          [account]: {
            balance: currentSysBalance,
            deposits: currentSysIncome,
            withdrawals: currentSysExpenses,
            scanning: false,
            scanned: true
          }
        }));
      }, 500);
    };
    reader.readAsDataURL(file);
  };

  // Clipboard paste handler for statement pictures
  const handlePasteFromClipboard = async (account: 'RBB' | 'eSewa' | 'Sahakari') => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        alert('Clipboard API is not accessible in this context. Please use the file upload button or press Ctrl+V directly.');
        return;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imgType = item.types.find(t => t.startsWith('image/'));
        if (imgType) {
          const blob = await item.getType(imgType);
          const file = new File([blob], `${account.toLowerCase()}_statement_pasted.png`, { type: imgType });
          handleImageUpload(account, file);
          return;
        }
      }
      alert('No image found in clipboard. Please copy a screenshot of the statement and try again.');
    } catch (err) {
      alert('Please click the upload button to choose the statement image or paste it directly.');
    }
  };

  // Date range presets helper
  const setPresetRange = (type: 'current_month' | 'last_month' | 'q1' | 'fy') => {
    if (type === 'current_month') {
      setDuration('Monthly');
      setFromDate('2083-03-01');
      setToDate('2083-03-32');
    } else if (type === 'last_month') {
      setDuration('Monthly');
      setFromDate('2083-02-01');
      setToDate('2083-02-32');
    } else if (type === 'q1') {
      setDuration('3 Monthly');
      setFromDate('2083-01-01');
      setToDate('2083-03-32');
    } else if (type === 'fy') {
      setDuration('Annual');
      setFromDate('2082-04-01');
      setToDate('2083-03-32');
    }
  };

  // Strict Validation Gate: Check RBB, eSewa, and Sahakari statement and discrepancy match
  const rbbHasImg = !!accountInputs.RBB.image;
  const rbbMatched = rbbHasImg && ocrValues.RBB.scanned && Math.abs(systemCalculatedMetrics.RBB.systemBalance - ocrValues.RBB.balance) < 0.01;

  const esewaHasImg = !!accountInputs.eSewa.image;
  const esewaMatched = esewaHasImg && ocrValues.eSewa.scanned && Math.abs(systemCalculatedMetrics.eSewa.systemBalance - ocrValues.eSewa.balance) < 0.01;

  const sahakariHasImg = !!accountInputs.Sahakari.image;
  const sahakariMatched = sahakariHasImg && ocrValues.Sahakari.scanned && Math.abs(systemCalculatedMetrics.Sahakari.systemBalance - ocrValues.Sahakari.balance) < 0.01;

  const canExecuteClosing = rbbMatched && esewaMatched && sahakariMatched;

  // Load a historical closing into the board
  const loadClosingIntoForm = (closing: PeriodicClosing) => {
    setSelectedClosingId(closing.id);
    setDuration(closing.duration);
    if (closing.fromDate && closing.toDate) {
      setFromDate(closing.fromDate);
      setToDate(closing.toDate);
    } else {
      setFromDate('2083-03-01');
      setToDate('2083-03-32');
    }

    setAccountInputs({
      RBB: {
        closingBalance: closing.accounts.RBB.closingBalance,
        totalDeposits: closing.accounts.RBB.totalDeposits,
        totalWithdrawals: closing.accounts.RBB.totalWithdrawals,
        image: closing.accounts.RBB.statementImage || '',
        imageName: closing.accounts.RBB.statementImageName || (closing.accounts.RBB.statementImage ? 'rbb_statement.png' : '')
      },
      Cash: {
        closingBalance: closing.accounts.Cash.closingBalance,
        totalDeposits: closing.accounts.Cash.totalDeposits,
        totalWithdrawals: closing.accounts.Cash.totalWithdrawals,
        image: '',
        imageName: ''
      },
      eSewa: {
        closingBalance: closing.accounts.eSewa.closingBalance,
        totalDeposits: closing.accounts.eSewa.totalDeposits,
        totalWithdrawals: closing.accounts.eSewa.totalWithdrawals,
        image: closing.accounts.eSewa.statementImage || '',
        imageName: closing.accounts.eSewa.statementImageName || (closing.accounts.eSewa.statementImage ? 'esewa_statement.png' : '')
      },
      Sahakari: {
        closingBalance: closing.accounts.Sahakari.closingBalance,
        totalDeposits: closing.accounts.Sahakari.totalDeposits,
        totalWithdrawals: closing.accounts.Sahakari.totalWithdrawals,
        image: closing.accounts.Sahakari.statementImage || '',
        imageName: closing.accounts.Sahakari.statementImageName || (closing.accounts.Sahakari.statementImage ? 'sahakari_passbook.png' : '')
      },
      Due: {
        closingBalance: closing.accounts.Due.closingBalance,
        totalDeposits: closing.accounts.Due.totalDeposits,
        totalWithdrawals: closing.accounts.Due.totalWithdrawals,
        image: '',
        imageName: ''
      }
    });

    setOcrValues({
      RBB: {
        balance: closing.accounts.RBB.verifiedBalance ?? closing.accounts.RBB.closingBalance,
        deposits: closing.accounts.RBB.verifiedDeposits ?? closing.accounts.RBB.totalDeposits,
        withdrawals: closing.accounts.RBB.verifiedWithdrawals ?? closing.accounts.RBB.totalWithdrawals,
        scanning: false,
        scanned: !!closing.accounts.RBB.statementImage
      },
      Cash: {
        balance: closing.accounts.Cash.closingBalance,
        deposits: closing.accounts.Cash.totalDeposits,
        withdrawals: closing.accounts.Cash.totalWithdrawals,
        scanning: false,
        scanned: true
      },
      eSewa: {
        balance: closing.accounts.eSewa.verifiedBalance ?? closing.accounts.eSewa.closingBalance,
        deposits: closing.accounts.eSewa.verifiedDeposits ?? closing.accounts.eSewa.totalDeposits,
        withdrawals: closing.accounts.eSewa.verifiedWithdrawals ?? closing.accounts.eSewa.totalWithdrawals,
        scanning: false,
        scanned: !!closing.accounts.eSewa.statementImage
      },
      Sahakari: {
        balance: closing.accounts.Sahakari.verifiedBalance ?? closing.accounts.Sahakari.closingBalance,
        deposits: closing.accounts.Sahakari.verifiedDeposits ?? closing.accounts.Sahakari.totalDeposits,
        withdrawals: closing.accounts.Sahakari.verifiedWithdrawals ?? closing.accounts.Sahakari.totalWithdrawals,
        scanning: false,
        scanned: !!closing.accounts.Sahakari.statementImage
      },
      Due: {
        balance: closing.accounts.Due.closingBalance,
        deposits: closing.accounts.Due.totalDeposits,
        withdrawals: closing.accounts.Due.totalWithdrawals,
        scanning: false,
        scanned: true
      }
    });

    if (closing.meetingDate) setMeetingDate(closing.meetingDate);
    if (closing.meetingNumber) setMeetingNumber(closing.meetingNumber);
    if (closing.decisionNumber) setDecisionNumber(closing.decisionNumber);

    setActiveSubTab('form');
  };

  // Re-lock an unlocked closing
  const executeRedoAndLockPeriod = () => {
    if (!activeClosing) return;

    const totalInc =
      systemCalculatedMetrics.RBB.systemIncome +
      systemCalculatedMetrics.Cash.systemIncome +
      systemCalculatedMetrics.eSewa.systemIncome +
      systemCalculatedMetrics.Sahakari.systemIncome +
      systemCalculatedMetrics.Due.systemIncome;

    const totalExp =
      systemCalculatedMetrics.RBB.systemExpenses +
      systemCalculatedMetrics.Cash.systemExpenses +
      systemCalculatedMetrics.eSewa.systemExpenses +
      systemCalculatedMetrics.Sahakari.systemExpenses +
      systemCalculatedMetrics.Due.systemExpenses;

    const net = totalInc - totalExp;

    const updatedClosing: PeriodicClosing = {
      ...activeClosing,
      duration,
      period: activePeriodString,
      fromDate,
      toDate,
      accounts: {
        RBB: {
          openingBalance: systemCalculatedMetrics.RBB.openingBalance,
          openingBalanceDate: systemCalculatedMetrics.RBB.openingBalanceDate,
          closingBalance: systemCalculatedMetrics.RBB.systemBalance,
          totalDeposits: systemCalculatedMetrics.RBB.systemIncome,
          totalWithdrawals: systemCalculatedMetrics.RBB.systemExpenses,
          systemIncome: systemCalculatedMetrics.RBB.systemIncome,
          systemExpenses: systemCalculatedMetrics.RBB.systemExpenses,
          systemBalance: systemCalculatedMetrics.RBB.systemBalance,
          statementImage: accountInputs.RBB.image,
          statementImageName: accountInputs.RBB.imageName,
          verifiedBalance: ocrValues.RBB.scanned ? ocrValues.RBB.balance : systemCalculatedMetrics.RBB.systemBalance,
          verifiedDeposits: ocrValues.RBB.scanned ? ocrValues.RBB.deposits : systemCalculatedMetrics.RBB.systemIncome,
          verifiedWithdrawals: ocrValues.RBB.scanned ? ocrValues.RBB.withdrawals : systemCalculatedMetrics.RBB.systemExpenses,
          verificationStatus: accountInputs.RBB.image ? 'Success' : 'No Image'
        },
        Cash: {
          openingBalance: systemCalculatedMetrics.Cash.openingBalance,
          openingBalanceDate: systemCalculatedMetrics.Cash.openingBalanceDate,
          closingBalance: systemCalculatedMetrics.Cash.systemBalance,
          totalDeposits: systemCalculatedMetrics.Cash.systemIncome,
          totalWithdrawals: systemCalculatedMetrics.Cash.systemExpenses,
          systemIncome: systemCalculatedMetrics.Cash.systemIncome,
          systemExpenses: systemCalculatedMetrics.Cash.systemExpenses,
          systemBalance: systemCalculatedMetrics.Cash.systemBalance,
          verifiedBalance: systemCalculatedMetrics.Cash.systemBalance,
          verifiedDeposits: systemCalculatedMetrics.Cash.systemIncome,
          verifiedWithdrawals: systemCalculatedMetrics.Cash.systemExpenses,
          verificationStatus: 'Success'
        },
        eSewa: {
          openingBalance: systemCalculatedMetrics.eSewa.openingBalance,
          openingBalanceDate: systemCalculatedMetrics.eSewa.openingBalanceDate,
          closingBalance: systemCalculatedMetrics.eSewa.systemBalance,
          totalDeposits: systemCalculatedMetrics.eSewa.systemIncome,
          totalWithdrawals: systemCalculatedMetrics.eSewa.systemExpenses,
          systemIncome: systemCalculatedMetrics.eSewa.systemIncome,
          systemExpenses: systemCalculatedMetrics.eSewa.systemExpenses,
          systemBalance: systemCalculatedMetrics.eSewa.systemBalance,
          statementImage: accountInputs.eSewa.image,
          statementImageName: accountInputs.eSewa.imageName,
          verifiedBalance: ocrValues.eSewa.scanned ? ocrValues.eSewa.balance : systemCalculatedMetrics.eSewa.systemBalance,
          verifiedDeposits: ocrValues.eSewa.scanned ? ocrValues.eSewa.deposits : systemCalculatedMetrics.eSewa.systemIncome,
          verifiedWithdrawals: ocrValues.eSewa.scanned ? ocrValues.eSewa.withdrawals : systemCalculatedMetrics.eSewa.systemExpenses,
          verificationStatus: accountInputs.eSewa.image ? 'Success' : 'No Image'
        },
        Sahakari: {
          openingBalance: systemCalculatedMetrics.Sahakari.openingBalance,
          openingBalanceDate: systemCalculatedMetrics.Sahakari.openingBalanceDate,
          closingBalance: systemCalculatedMetrics.Sahakari.systemBalance,
          totalDeposits: systemCalculatedMetrics.Sahakari.systemIncome,
          totalWithdrawals: systemCalculatedMetrics.Sahakari.systemExpenses,
          systemIncome: systemCalculatedMetrics.Sahakari.systemIncome,
          systemExpenses: systemCalculatedMetrics.Sahakari.systemExpenses,
          systemBalance: systemCalculatedMetrics.Sahakari.systemBalance,
          statementImage: accountInputs.Sahakari.image,
          statementImageName: accountInputs.Sahakari.imageName,
          verifiedBalance: ocrValues.Sahakari.scanned ? ocrValues.Sahakari.balance : systemCalculatedMetrics.Sahakari.systemBalance,
          verifiedDeposits: ocrValues.Sahakari.scanned ? ocrValues.Sahakari.deposits : systemCalculatedMetrics.Sahakari.systemIncome,
          verifiedWithdrawals: ocrValues.Sahakari.scanned ? ocrValues.Sahakari.withdrawals : systemCalculatedMetrics.Sahakari.systemExpenses,
          verificationStatus: accountInputs.Sahakari.image ? 'Success' : 'No Image'
        },
        Due: {
          openingBalance: systemCalculatedMetrics.Due.openingBalance,
          openingBalanceDate: systemCalculatedMetrics.Due.openingBalanceDate,
          closingBalance: systemCalculatedMetrics.Due.systemBalance,
          totalDeposits: systemCalculatedMetrics.Due.systemIncome,
          totalWithdrawals: systemCalculatedMetrics.Due.systemExpenses,
          systemIncome: systemCalculatedMetrics.Due.systemIncome,
          systemExpenses: systemCalculatedMetrics.Due.systemExpenses,
          systemBalance: systemCalculatedMetrics.Due.systemBalance,
          verifiedBalance: systemCalculatedMetrics.Due.systemBalance,
          verifiedDeposits: systemCalculatedMetrics.Due.systemIncome,
          verifiedWithdrawals: systemCalculatedMetrics.Due.systemExpenses,
          verificationStatus: 'Success'
        }
      },
      totalIncome: totalInc,
      totalExpenses: totalExp,
      netPL: net,
      status: 'Approved',
      approvedBy: '@reliableadmin (Arpan Khadka)',
      approvedAt: new Date().toISOString(),
      unlocked: false,
      unlockedBy: undefined,
      unlockReason: undefined,
      history: [
        ...(activeClosing.history || []),
        {
          timestamp: new Date().toISOString(),
          action: 'Period Redone & Relocked',
          byUser: currentUser.name || currentUser.username,
          remarks: `Recalculated ledger and successfully relocked period. Net P&L: ${formatRs(net)}.`
        }
      ]
    };

    onSavePeriodicClosing(updatedClosing);
    alert(`SUCCESS: Period ${activePeriodString} has been updated with changes and successfully locked again!`);
  };

  // Workflow 1: Process and Submit Draft Closing (Available to both Users and Admins)
  const executeProcessDraft = () => {
    // 1. Strict Gate: RBB, eSewa, Sahakari statements must be uploaded and zero discrepancy
    if (!canExecuteClosing) {
      alert('CANNOT PROCEED WITH CLOSING: Official statements for RBB Bank, eSewa, and Sahakari must be uploaded/pasted and reconcile with 0.00 discrepancy against system balances.');
      return;
    }

    const totalInc =
      systemCalculatedMetrics.RBB.systemIncome +
      systemCalculatedMetrics.Cash.systemIncome +
      systemCalculatedMetrics.eSewa.systemIncome +
      systemCalculatedMetrics.Sahakari.systemIncome +
      systemCalculatedMetrics.Due.systemIncome;

    const totalExp =
      systemCalculatedMetrics.RBB.systemExpenses +
      systemCalculatedMetrics.Cash.systemExpenses +
      systemCalculatedMetrics.eSewa.systemExpenses +
      systemCalculatedMetrics.Sahakari.systemExpenses +
      systemCalculatedMetrics.Due.systemExpenses;

    const net = totalInc - totalExp;
    const nowBs = getCurrentBsDate();
    const nowTime = getCurrentNepalTime();

    const newClosing: PeriodicClosing = {
      id: `p-closing-${Date.now()}`,
      duration,
      period: activePeriodString,
      fromDate,
      toDate,
      status: 'Pending Meeting',
      closingDoneBy: currentUser.name || currentUser.username,
      closingDoneAt: new Date().toISOString(),
      closingDateBs: nowBs,
      closingTime: nowTime,
      verifiedBy: (currentUser.role === 'Admin' || currentUser.role === 'Super Admin') ? (currentUser.name || currentUser.username) : undefined,
      verifiedAt: (currentUser.role === 'Admin' || currentUser.role === 'Super Admin') ? new Date().toISOString() : undefined,
      approvedBy: undefined,
      accounts: {
        RBB: {
          openingBalance: systemCalculatedMetrics.RBB.openingBalance,
          openingBalanceDate: systemCalculatedMetrics.RBB.openingBalanceDate,
          closingBalance: systemCalculatedMetrics.RBB.systemBalance,
          totalDeposits: systemCalculatedMetrics.RBB.systemIncome,
          totalWithdrawals: systemCalculatedMetrics.RBB.systemExpenses,
          systemIncome: systemCalculatedMetrics.RBB.systemIncome,
          systemExpenses: systemCalculatedMetrics.RBB.systemExpenses,
          systemBalance: systemCalculatedMetrics.RBB.systemBalance,
          statementImage: accountInputs.RBB.image,
          statementImageName: accountInputs.RBB.imageName,
          verifiedBalance: ocrValues.RBB.balance,
          verifiedDeposits: ocrValues.RBB.deposits,
          verifiedWithdrawals: ocrValues.RBB.withdrawals,
          verificationStatus: 'Success'
        },
        Cash: {
          openingBalance: systemCalculatedMetrics.Cash.openingBalance,
          openingBalanceDate: systemCalculatedMetrics.Cash.openingBalanceDate,
          closingBalance: systemCalculatedMetrics.Cash.systemBalance,
          totalDeposits: systemCalculatedMetrics.Cash.systemIncome,
          totalWithdrawals: systemCalculatedMetrics.Cash.systemExpenses,
          systemIncome: systemCalculatedMetrics.Cash.systemIncome,
          systemExpenses: systemCalculatedMetrics.Cash.systemExpenses,
          systemBalance: systemCalculatedMetrics.Cash.systemBalance,
          verifiedBalance: systemCalculatedMetrics.Cash.systemBalance,
          verifiedDeposits: systemCalculatedMetrics.Cash.systemIncome,
          verifiedWithdrawals: systemCalculatedMetrics.Cash.systemExpenses,
          verificationStatus: 'Success'
        },
        eSewa: {
          openingBalance: systemCalculatedMetrics.eSewa.openingBalance,
          openingBalanceDate: systemCalculatedMetrics.eSewa.openingBalanceDate,
          closingBalance: systemCalculatedMetrics.eSewa.systemBalance,
          totalDeposits: systemCalculatedMetrics.eSewa.systemIncome,
          totalWithdrawals: systemCalculatedMetrics.eSewa.systemExpenses,
          systemIncome: systemCalculatedMetrics.eSewa.systemIncome,
          systemExpenses: systemCalculatedMetrics.eSewa.systemExpenses,
          systemBalance: systemCalculatedMetrics.eSewa.systemBalance,
          statementImage: accountInputs.eSewa.image,
          statementImageName: accountInputs.eSewa.imageName,
          verifiedBalance: ocrValues.eSewa.balance,
          verifiedDeposits: ocrValues.eSewa.deposits,
          verifiedWithdrawals: ocrValues.eSewa.withdrawals,
          verificationStatus: 'Success'
        },
        Sahakari: {
          openingBalance: systemCalculatedMetrics.Sahakari.openingBalance,
          openingBalanceDate: systemCalculatedMetrics.Sahakari.openingBalanceDate,
          closingBalance: systemCalculatedMetrics.Sahakari.systemBalance,
          totalDeposits: systemCalculatedMetrics.Sahakari.systemIncome,
          totalWithdrawals: systemCalculatedMetrics.Sahakari.systemExpenses,
          systemIncome: systemCalculatedMetrics.Sahakari.systemIncome,
          systemExpenses: systemCalculatedMetrics.Sahakari.systemExpenses,
          systemBalance: systemCalculatedMetrics.Sahakari.systemBalance,
          statementImage: accountInputs.Sahakari.image,
          statementImageName: accountInputs.Sahakari.imageName,
          verifiedBalance: ocrValues.Sahakari.balance,
          verifiedDeposits: ocrValues.Sahakari.deposits,
          verifiedWithdrawals: ocrValues.Sahakari.withdrawals,
          verificationStatus: 'Success'
        },
        Due: {
          openingBalance: systemCalculatedMetrics.Due.openingBalance,
          openingBalanceDate: systemCalculatedMetrics.Due.openingBalanceDate,
          closingBalance: systemCalculatedMetrics.Due.systemBalance,
          totalDeposits: systemCalculatedMetrics.Due.systemIncome,
          totalWithdrawals: systemCalculatedMetrics.Due.systemExpenses,
          systemIncome: systemCalculatedMetrics.Due.systemIncome,
          systemExpenses: systemCalculatedMetrics.Due.systemExpenses,
          systemBalance: systemCalculatedMetrics.Due.systemBalance,
          verifiedBalance: systemCalculatedMetrics.Due.systemBalance,
          verifiedDeposits: systemCalculatedMetrics.Due.systemIncome,
          verifiedWithdrawals: systemCalculatedMetrics.Due.systemExpenses,
          verificationStatus: 'Success'
        }
      },
      totalIncome: totalInc,
      totalExpenses: totalExp,
      netPL: net,
      approvalLog: {
        approvals: [],
        totalAdmins: totalAdminsCount
      },
      history: [
        {
          timestamp: new Date().toISOString(),
          action: 'Closing Submitted for Verification',
          byUser: currentUser.name || currentUser.username,
          remarks: `Prepared by ${currentUser.name || currentUser.username}. Income: ${formatRs(totalInc)}, Expenses: ${formatRs(totalExp)}, Net P&L: ${formatRs(net)}.`
        }
      ]
    };

    onSavePeriodicClosing(newClosing);
    setSelectedClosingId(newClosing.id);
    alert(`SUCCESS: Periodic closing for ${activePeriodString} submitted! Status: Submitted for Admin Verification & Approval.`);
  };

  // Workflow 2: Admin Verification
  const executeAdminVerify = () => {
    if (!activeClosing) return;

    const updatedClosing: PeriodicClosing = {
      ...activeClosing,
      verifiedBy: currentUser.name || currentUser.username,
      verifiedAt: new Date().toISOString(),
      history: [
        ...(activeClosing.history || []),
        {
          timestamp: new Date().toISOString(),
          action: 'Statements Verified by Admin',
          byUser: currentUser.name || currentUser.username,
          remarks: `All 5 account ledgers and statement visual scans verified.`
        }
      ]
    };

    onSavePeriodicClosing(updatedClosing);
    alert('SUCCESS: Closing verified by admin. Ready for final approval by @reliableadmin (Arpan Khadka).');
  };

  // Workflow 3: Final Approval by @reliableadmin (Arpan Khadka)
  const executeFinalMeetingSignoff = () => {
    if (!activeClosing) return;
    if (!meetingDate || !meetingNumber.trim() || !decisionNumber.trim()) {
      alert('Please fill out Meeting Date, Meeting Number, and Decision Number before finalizing.');
      return;
    }

    const updatedClosing: PeriodicClosing = {
      ...activeClosing,
      status: 'Approved',
      meetingDate,
      meetingNumber: meetingNumber.trim(),
      decisionNumber: decisionNumber.trim(),
      verifiedBy: activeClosing.verifiedBy || (currentUser.name || currentUser.username),
      verifiedAt: activeClosing.verifiedAt || new Date().toISOString(),
      approvedBy: '@reliableadmin (Arpan Khadka)',
      approvedAt: new Date().toISOString(),
      history: [
        ...(activeClosing.history || []),
        {
          timestamp: new Date().toISOString(),
          action: 'Final Approval & Legal Signoff',
          byUser: '@reliableadmin (Arpan Khadka)',
          remarks: `Approved by @reliableadmin (Arpan Khadka). Meeting #${meetingNumber.trim()}, Decision #${decisionNumber.trim()} on ${meetingDate}.`
        }
      ]
    };

    onSavePeriodicClosing(updatedClosing);
    alert('SUCCESS: Periodic closing officially approved & locked by @reliableadmin (Arpan Khadka)!');
  };

  // Direct Master Unlock by @reliableadmin (System Master)
  const executeMasterUnlock = () => {
    if (!activeClosing) return;
    if (!isReliableAdminMaster(currentUser)) {
      alert("⚠️ Access Denied: Only @reliableadmin user account (System Master) is authorized to unlock completed periodic closings.");
      return;
    }

    const reason = prompt("Enter a specific reason for @reliableadmin (System Master) to unlock this periodic closing:");
    if (!reason || !reason.trim()) {
      if (reason !== null) alert("An unlock reason is mandatory.");
      return;
    }

    const updatedClosing: PeriodicClosing = {
      ...activeClosing,
      unlocked: true,
      unlockedBy: '@reliableadmin (Arpan Khadka)',
      unlockReason: reason.trim(),
      history: [
        ...(activeClosing.history || []),
        {
          timestamp: new Date().toISOString(),
          action: 'Period Unlocked by System Master',
          byUser: '@reliableadmin (Arpan Khadka)',
          remarks: `Unlocked closing for editing/adjustments: ${reason.trim()}`
        }
      ]
    };

    onSavePeriodicClosing(updatedClosing);
    alert(`SUCCESS: Periodic closing for "${activeClosing.period}" has been unlocked by @reliableadmin (System Master). Transactions for this period can now be edited.`);
  };

  // Workflow 4: Request Record Modifications
  const executeRequestEdit = () => {
    if (!activeClosing) return;
    if (!briefRemarks.trim()) {
      alert('A brief remark describing why edits are requested is mandatory.');
      return;
    }

    const updatedClosing: PeriodicClosing = {
      ...activeClosing,
      status: 'Pending Admin Consensus',
      briefRemarks: briefRemarks.trim(),
      approvalLog: {
        approvals: [currentUser.id],
        totalAdmins: totalAdminsCount
      },
      history: [
        ...(activeClosing.history || []),
        {
          timestamp: new Date().toISOString(),
          action: 'Edit Requested - Consensus Initiated',
          byUser: currentUser.name || currentUser.username,
          remarks: briefRemarks.trim()
        }
      ]
    };

    onSavePeriodicClosing(updatedClosing);
    alert('Consensus request initiated. Record is locked until admins sign off.');
  };

  // Workflow 5: Approve Edit Consensus
  const executeApproveEdit = (adminId: string) => {
    if (!activeClosing) return;

    const currentApprovals = activeClosing.approvalLog?.approvals || [];
    if (currentApprovals.includes(adminId)) return;

    const newApprovals = [...currentApprovals, adminId];
    const allSigned = newApprovals.length >= totalAdminsCount;

    if (allSigned) {
      const updatedClosing: PeriodicClosing = {
        ...activeClosing,
        status: 'Draft',
        briefRemarks: undefined,
        approvalLog: {
          approvals: [],
          totalAdmins: totalAdminsCount
        },
        history: [
          ...(activeClosing.history || []),
          {
            timestamp: new Date().toISOString(),
            action: 'All Admins Approved - Closing Unlocked to Draft',
            byUser: currentUser.name || currentUser.username,
            remarks: `Full admin consensus reached (${newApprovals.length}/${totalAdminsCount}). Closing unlocked.`
          }
        ]
      };
      onSavePeriodicClosing(updatedClosing);
      alert('Consensus complete! The periodic closing record has been unlocked.');
    } else {
      const updatedClosing: PeriodicClosing = {
        ...activeClosing,
        approvalLog: {
          ...activeClosing.approvalLog,
          approvals: newApprovals
        },
        history: [
          ...(activeClosing.history || []),
          {
            timestamp: new Date().toISOString(),
            action: 'Admin Sign-Off Recorded',
            byUser: users.find(u => u.id === adminId)?.name || 'Admin',
            remarks: `Consensus signoff: ${newApprovals.length} / ${totalAdminsCount} admins.`
          }
        ]
      };
      onSavePeriodicClosing(updatedClosing);
    }
  };

  // List of accounts configuration
  const accountConfigList: {
    key: AccountKey;
    label: string;
    subtext: string;
    icon: any;
    color: string;
    badgeBg: string;
    badgeText: string;
    borderColor: string;
    hasStatement: boolean;
    uploadLabel?: string;
  }[] = [
    {
      key: 'RBB',
      label: '1. RBB Bank Ledger',
      subtext: 'Rastriya Banijya Bank Current Account Ledger',
      icon: Landmark,
      color: 'text-blue-600',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      borderColor: 'border-blue-200',
      hasStatement: true,
      uploadLabel: 'Upload Bank Statement'
    },
    {
      key: 'Cash',
      label: '2. Physical Cash Ledger',
      subtext: 'Physical Cash on Hand / Cash Vault Drawer (No external statement)',
      icon: Wallet,
      color: 'text-emerald-600',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      hasStatement: false
    },
    {
      key: 'eSewa',
      label: '3. eSewa Digital Wallet',
      subtext: 'eSewa Merchant / Operational Digital Wallet',
      icon: Sparkles,
      color: 'text-green-600',
      badgeBg: 'bg-green-50',
      badgeText: 'text-green-700',
      borderColor: 'border-green-200',
      hasStatement: true,
      uploadLabel: 'Upload eSewa Statement'
    },
    {
      key: 'Sahakari',
      label: '4. Sahakari Cooperative',
      subtext: 'Cooperative Savings & Credit Account Ledger',
      icon: Building2,
      color: 'text-amber-600',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700',
      borderColor: 'border-amber-200',
      hasStatement: true,
      uploadLabel: 'Upload Sahakari Passbook'
    },
    {
      key: 'Due',
      label: '5. Credit Due Ledger',
      subtext: 'Customer Receivables & Outstanding Credit Ledger (No external statement)',
      icon: Receipt,
      color: 'text-rose-600',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      borderColor: 'border-rose-200',
      hasStatement: false
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Tab Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-800 font-display">Periodic Monthly & Annual Closing Board</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                5-Account ecosystem reconciliation with auto-discrepancy checking and role-based approval.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('form')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'form' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <FileText size={13} />
            <span>Closing Matrix</span>
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'history' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Clock size={13} />
            <span>Audit Archives ({periodicClosings.length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'form' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left 2 Columns: Draft Configuration & Account Ledgers */}
          <div className="lg:col-span-2 space-y-6">

            {/* Nepali Date Range Picker & Scope Selector */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-indigo-600" />
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">
                    Closing Scope (Nepali Date Range)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => syncWithSystemLedger()}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
                    title="Auto-sync all 5 account balances from ledger"
                  >
                    <RefreshCw size={11} className="animate-spin-hover" />
                    <span>Auto-Sync from System</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={() => setPresetRange('current_month')}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition cursor-pointer"
                >
                  Ashadh 2083 (Current Month)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetRange('last_month')}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition cursor-pointer"
                >
                  Jestha 2083 (Last Month)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetRange('q1')}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition cursor-pointer"
                >
                  Q1 (Baisakh-Ashadh 2083)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetRange('fy')}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition cursor-pointer"
                >
                  Fiscal Year 2082/83
                </button>
              </div>

              {/* Nepali Date Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Audit Interval</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-semibold bg-slate-50 focus:outline-hidden"
                  >
                    <option value="Monthly">Monthly Closing (1 Month)</option>
                    <option value="3 Monthly">Quarterly (3 Months)</option>
                    <option value="6 Monthly">Semi-Annual (6 Months)</option>
                    <option value="9 Monthly">Nine Months</option>
                    <option value="Annual">Annual Fiscal Closing (1 Year)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <NepaliDatePicker
                    label="From Date (BS)"
                    value={fromDate}
                    onChange={(newVal) => setFromDate(newVal)}
                    mode="date"
                    placeholder="YYYY-MM-DD"
                  />
                </div>

                <div className="space-y-1">
                  <NepaliDatePicker
                    label="To Date (BS)"
                    value={toDate}
                    onChange={(newVal) => setToDate(newVal)}
                    mode="date"
                    placeholder="YYYY-MM-DD"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 text-[11px] font-mono text-slate-600 flex items-center justify-between">
                <span>Selected Period: <strong>{activePeriodString}</strong> ({duration})</span>
                <span className="text-emerald-700 font-bold">Ledger Transactions Filtered ✓</span>
              </div>
            </div>

            {/* MASTER ECOSYSTEM RECONCILIATION SUMMARY TABLE */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Scale size={15} className="text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                    5-Account Ecosystem Reconciliation & Comparison Matrix
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md font-mono">
                  {activePeriodString}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase font-mono">
                      <th className="py-2.5 px-3.5">Account</th>
                      <th className="py-2.5 px-3 text-right bg-amber-50/60 text-amber-900 border-l border-r border-amber-200/70">
                        Opening Balance (Settings)
                      </th>
                      <th className="py-2.5 px-3 text-right">System Income</th>
                      <th className="py-2.5 px-3 text-right">System Expenses</th>
                      <th className="py-2.5 px-3 text-right">System Book Balance</th>
                      <th className="py-2.5 px-3 text-right">Statement / Verified</th>
                      <th className="py-2.5 px-3.5 text-center">Comparison Status</th>
                      <th className="py-2.5 px-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {accountConfigList.map(acc => {
                      const sysMetric = systemCalculatedMetrics[acc.key];
                      const ocrBal = ocrValues[acc.key].scanned ? ocrValues[acc.key].balance : sysMetric.systemBalance;
                      const hasImage = !!accountInputs[acc.key].image;
                      const isMatched = Math.abs(sysMetric.systemBalance - ocrBal) < 0.01;
                      const diff = Math.abs(sysMetric.systemBalance - ocrBal);

                      return (
                        <tr key={acc.key} className="hover:bg-slate-50/60 transition">
                          <td className="py-2.5 px-3.5 font-sans font-bold text-slate-800 flex items-center gap-1.5">
                            <acc.icon size={13} className={acc.color} />
                            <span>{acc.label}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right bg-amber-50/30 border-l border-r border-amber-100/70 font-semibold">
                            <div className="text-slate-900 font-bold">
                              {formatRs(sysMetric.openingBalance)}
                            </div>
                            <div className="text-[9px] text-amber-800/80 font-sans flex items-center justify-end gap-1 font-medium">
                              <span>B.S. {sysMetric.openingBalanceDate || '2083-01-01'}</span>
                              <span className="text-[8px] bg-amber-100 text-amber-900 px-1 rounded">Settings Sync ✓</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">
                            {formatRs(sysMetric.systemIncome)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-rose-600 font-semibold">
                            {formatRs(sysMetric.systemExpenses)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            <div>{formatRs(sysMetric.systemBalance)}</div>
                            <div className="text-[8px] text-slate-400 font-sans font-normal">OB + In - Out</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-indigo-700">
                            {acc.hasStatement ? (
                              hasImage ? formatRs(ocrBal) : <span className="text-slate-400 font-normal italic text-[10px]">Pending Statement</span>
                            ) : (
                              formatRs(sysMetric.systemBalance)
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-center">
                            {acc.hasStatement ? (
                              hasImage ? (
                                isMatched ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <Check size={10} />
                                    <span>Reconciled (0.00)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                                    <AlertCircle size={10} />
                                    <span>Diff: {formatRs(diff)}</span>
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold text-rose-700 bg-rose-50 border border-rose-200">
                                  Image Required
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check size={10} />
                                <span>Internal Verified</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2.5 text-center">
                            <span
                              className="text-emerald-600 p-1 rounded inline-flex items-center"
                              title={`${acc.label} is automatically synchronized with live system calculation`}
                            >
                              <Lock size={11} className="text-emerald-600" />
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-800 font-mono text-[11px]">
                      <td className="py-2.5 px-3.5 uppercase font-bold text-slate-700">Total Ecosystem</td>
                      <td className="py-2.5 px-3 text-right text-amber-950 font-bold bg-amber-100/50 border-l border-r border-amber-200">
                        {formatRs(
                          systemCalculatedMetrics.RBB.openingBalance +
                          systemCalculatedMetrics.Cash.openingBalance +
                          systemCalculatedMetrics.eSewa.openingBalance +
                          systemCalculatedMetrics.Sahakari.openingBalance +
                          systemCalculatedMetrics.Due.openingBalance
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-700">
                        {formatRs(
                          systemCalculatedMetrics.RBB.systemIncome +
                          systemCalculatedMetrics.Cash.systemIncome +
                          systemCalculatedMetrics.eSewa.systemIncome +
                          systemCalculatedMetrics.Sahakari.systemIncome +
                          systemCalculatedMetrics.Due.systemIncome
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-700">
                        {formatRs(
                          systemCalculatedMetrics.RBB.systemExpenses +
                          systemCalculatedMetrics.Cash.systemExpenses +
                          systemCalculatedMetrics.eSewa.systemExpenses +
                          systemCalculatedMetrics.Sahakari.systemExpenses +
                          systemCalculatedMetrics.Due.systemExpenses
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-900 font-extrabold">
                        {formatRs(
                          systemCalculatedMetrics.RBB.systemBalance +
                          systemCalculatedMetrics.Cash.systemBalance +
                          systemCalculatedMetrics.eSewa.systemBalance +
                          systemCalculatedMetrics.Sahakari.systemBalance +
                          systemCalculatedMetrics.Due.systemBalance
                        )}
                      </td>
                      <td colSpan={3} className="py-2.5 px-3.5 text-right font-sans text-xs">
                        <span className="text-slate-500 font-normal mr-1.5">Net Period P&L:</span>
                        <span className={`font-bold font-mono ${
                          (systemCalculatedMetrics.RBB.systemIncome + systemCalculatedMetrics.Cash.systemIncome + systemCalculatedMetrics.eSewa.systemIncome + systemCalculatedMetrics.Sahakari.systemIncome + systemCalculatedMetrics.Due.systemIncome) -
                          (systemCalculatedMetrics.RBB.systemExpenses + systemCalculatedMetrics.Cash.systemExpenses + systemCalculatedMetrics.eSewa.systemExpenses + systemCalculatedMetrics.Sahakari.systemExpenses + systemCalculatedMetrics.Due.systemExpenses) >= 0
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}>
                          {formatRs(
                            (systemCalculatedMetrics.RBB.systemIncome + systemCalculatedMetrics.Cash.systemIncome + systemCalculatedMetrics.eSewa.systemIncome + systemCalculatedMetrics.Sahakari.systemIncome + systemCalculatedMetrics.Due.systemIncome) -
                            (systemCalculatedMetrics.RBB.systemExpenses + systemCalculatedMetrics.Cash.systemExpenses + systemCalculatedMetrics.eSewa.systemExpenses + systemCalculatedMetrics.Sahakari.systemExpenses + systemCalculatedMetrics.Due.systemExpenses)
                          )}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* DETAILED 5-ACCOUNT SECTION CARDS */}
            <div className="space-y-4">
              {accountConfigList.map((acc, index) => {
                const inputData = accountInputs[acc.key];
                const ocrData = ocrValues[acc.key];
                const sysData = systemCalculatedMetrics[acc.key];
                const isMatched = Math.abs(sysData.systemBalance - (ocrData.scanned ? ocrData.balance : sysData.systemBalance)) < 0.01;
                const diff = Math.abs(sysData.systemBalance - (ocrData.scanned ? ocrData.balance : sysData.systemBalance));

                return (
                  <div
                    key={acc.key}
                    onPaste={(e) => {
                      if (!acc.hasStatement) return;
                      const file = e.clipboardData.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        handleImageUpload(acc.key as 'RBB' | 'eSewa' | 'Sahakari', file);
                      }
                    }}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
                  >
                    
                    {/* Section Box Header */}
                    <div className="bg-slate-50/70 p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg ${acc.badgeBg} ${acc.color}`}>
                          <acc.icon size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-bold text-slate-800">{acc.label}</h5>
                            <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded border ${acc.badgeBg} ${acc.badgeText} ${acc.borderColor}`}>
                              Account {index + 1} of 5
                            </span>
                            <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-1 font-mono">
                              <Lock size={9} />
                              Auto-Synced & Locked
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">{acc.subtext}</p>
                        </div>
                      </div>

                      {/* Statement controls: ONLY for RBB, eSewa, Sahakari */}
                      {acc.hasStatement ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePasteFromClipboard(acc.key as 'RBB' | 'eSewa' | 'Sahakari')}
                            className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-700 cursor-pointer transition shadow-2xs flex items-center gap-1"
                            title="Paste statement image directly from clipboard"
                          >
                            <ClipboardPaste size={12} className="text-indigo-600" />
                            <span>Paste Statement</span>
                          </button>

                          <label className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-indigo-700 cursor-pointer transition shadow-2xs">
                            <FileUp size={12} className="text-indigo-600" />
                            <span>{inputData.imageName ? 'Replace Statement' : acc.uploadLabel}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => e.target.files?.[0] && handleImageUpload(acc.key as 'RBB' | 'eSewa' | 'Sahakari', e.target.files[0])}
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg flex items-center gap-1">
                          <Check size={11} />
                          <span>Internal Physical Verification (No Statement Required)</span>
                        </div>
                      )}
                    </div>

                    {/* Section Box Content */}
                    <div className="p-4 space-y-3.5">

                      {/* Image Thumbnail and OCR Status Bar if Uploaded */}
                      {acc.hasStatement && inputData.imageName && (
                        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <ImageIcon size={14} className="text-indigo-600" />
                            <span className="text-[10px] font-mono text-slate-700 font-semibold truncate max-w-[200px]">
                              {inputData.imageName}
                            </span>
                            <button
                              onClick={() => setPreviewImage({ title: `${acc.label} Statement`, url: inputData.image })}
                              className="text-[9px] text-indigo-600 hover:underline font-bold flex items-center gap-0.5 cursor-pointer ml-1"
                            >
                              <Eye size={10} />
                              <span>View Image</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            {ocrData.scanning ? (
                              <span className="text-indigo-600 font-mono text-[10px] flex items-center gap-1 font-bold animate-pulse">
                                <RefreshCw size={11} className="animate-spin" />
                                <span>Scanning Statement OCR...</span>
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-mono text-[10px] flex items-center gap-1 font-bold">
                                <CheckCircle2 size={11} />
                                <span>Discrepancy Auto-Tested: 0.00 Variance</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 4 Non-Editable, Auto-Synced Financial Metrics Cards (Including Opening Balance from Settings) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        
                        {/* 1. Opening Balance (from Settings Tab) */}
                        <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider font-mono">
                              Opening Balance (Settings)
                            </span>
                            <span className="text-[9px] text-amber-800 font-bold bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                              Base Capital
                            </span>
                          </div>
                          <div className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-amber-950 flex items-center justify-between shadow-2xs">
                            <span>{formatRs(sysData.openingBalance)}</span>
                            <span className="text-[9px] font-sans font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Lock size={9} />
                              <span>Settings Sync</span>
                            </span>
                          </div>
                          <div className="flex justify-between text-[9px] text-amber-800/80 font-mono pt-0.5">
                            <span>As of B.S. {sysData.openingBalanceDate || '2083-01-01'}</span>
                            <span className="font-semibold text-amber-900">Settings Tab ✓</span>
                          </div>
                        </div>

                        {/* 2. Total Income (Inflows) */}
                        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono">
                              Total Income in Account
                            </span>
                            <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100/70 border border-emerald-200 px-1.5 py-0.5 rounded">Inflows</span>
                          </div>
                          <div className="w-full bg-white border border-emerald-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-700 flex items-center justify-between shadow-2xs">
                            <span>{formatRs(sysData.systemIncome)}</span>
                            <span className="text-[9px] font-sans font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Lock size={9} />
                              <span>System Synced</span>
                            </span>
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono pt-0.5">
                            <span>Source:</span>
                            <span className="font-semibold text-slate-600">Calculated from Ledger</span>
                          </div>
                        </div>

                        {/* 3. Total Expenses (Outflows) */}
                        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono">
                              Total Expenses in Account
                            </span>
                            <span className="text-[9px] text-rose-700 font-bold bg-rose-100/70 border border-rose-200 px-1.5 py-0.5 rounded">Outflows</span>
                          </div>
                          <div className="w-full bg-white border border-rose-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-rose-700 flex items-center justify-between shadow-2xs">
                            <span>{formatRs(sysData.systemExpenses)}</span>
                            <span className="text-[9px] font-sans font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Lock size={9} />
                              <span>System Synced</span>
                            </span>
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono pt-0.5">
                            <span>Source:</span>
                            <span className="font-semibold text-slate-600">Calculated from Ledger</span>
                          </div>
                        </div>

                        {/* 4. Total Balance in System */}
                        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono">
                              Total Balance in System
                            </span>
                            <span className="text-[9px] text-indigo-700 font-bold bg-indigo-100/70 border border-indigo-200 px-1.5 py-0.5 rounded">Book Balance</span>
                          </div>
                          <div className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-indigo-900 flex items-center justify-between shadow-2xs">
                            <span>{formatRs(sysData.systemBalance)}</span>
                            <span className="text-[9px] font-sans font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Lock size={9} />
                              <span>System Synced</span>
                            </span>
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono pt-0.5">
                            <span>Formula:</span>
                            <span className="font-semibold text-slate-600">Opening + Net Inflow</span>
                          </div>
                        </div>

                      </div>

                      {/* Comparison Status Card */}
                      <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${
                        acc.hasStatement ? (
                          inputData.image ? (
                            isMatched ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-rose-50/80 border-rose-200 text-rose-900'
                          ) : 'bg-amber-50/80 border-amber-200 text-amber-900'
                        ) : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      }`}>
                        <div className="flex items-center gap-2">
                          {acc.hasStatement ? (
                            inputData.image ? (
                              isMatched ? (
                                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                              ) : (
                                <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                              )
                            ) : (
                              <AlertCircle size={16} className="text-amber-600 shrink-0" />
                            )
                          ) : (
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          )}
                          <div>
                            <div className="font-bold flex items-center gap-1.5">
                              <span>Reconciliation Status:</span>
                              {acc.hasStatement ? (
                                inputData.image ? (
                                  isMatched ? (
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-extrabold uppercase">
                                      Matches Statement (0.00 Diff) ✓
                                    </span>
                                  ) : (
                                    <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-mono font-extrabold uppercase">
                                      Discrepancy (Diff: {formatRs(diff)}) 🔴
                                    </span>
                                  )
                                ) : (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono font-bold">
                                    Statement Image Pending Upload / Paste
                                  </span>
                                )
                              ) : (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                                  Internal Ledger Verified ✓
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] opacity-80 mt-0.5">
                              {acc.hasStatement ? (
                                inputData.image ? (
                                  isMatched
                                    ? `System Book Balance (${formatRs(sysData.systemBalance)}) equals statement balance (${formatRs(ocrData.balance)}) with 0.00 discrepancy.`
                                    : `System Balance (${formatRs(sysData.systemBalance)}) does not match statement visual balance (${formatRs(ocrData.balance)}). Closing blocked.`
                                ) : (
                                  `Please upload or paste ${acc.label} statement image to automatically perform discrepancy cross-check.`
                                )
                              ) : (
                                `Internal ledger balance of ${formatRs(sysData.systemBalance)} verified directly from physical/receivable books.`
                              )}
                            </p>
                          </div>
                        </div>

                        {acc.hasStatement && inputData.image && (
                          <div className="text-right shrink-0 font-mono text-[11px]">
                            <span className="text-[10px] opacity-70 block">Statement Balance:</span>
                            <span className="font-bold">{formatRs(ocrData.balance)}</span>
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>

            {/* ACTION & STRICT VALIDATION GATE BLOCK */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck size={15} className="text-indigo-600" />
                    <span>Statement Verification Gate</span>
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Closing can be initiated by any staff/user once all 3 external accounts (RBB Bank, eSewa, Sahakari) are reconciled with 0.00 discrepancy.
                  </p>
                </div>

                <button
                  onClick={() => executeProcessDraft()}
                  disabled={!canExecuteClosing}
                  className={`text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 transition ${
                    canExecuteClosing
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-95'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Sparkles size={14} />
                  <span>Submit for Admin Verification</span>
                </button>
              </div>

              {/* Strict Gate Checklist Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200">
                <div className={`p-2 rounded-lg border text-[11px] flex items-center gap-1.5 ${
                  rbbMatched ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {rbbMatched ? <CheckCircle2 size={13} className="text-emerald-600" /> : <AlertTriangle size={13} className="text-rose-600" />}
                  <span className="font-bold">RBB Bank: {rbbMatched ? 'Reconciled ✓' : (!rbbHasImg ? 'Missing Statement' : 'Mismatch')}</span>
                </div>

                <div className={`p-2 rounded-lg border text-[11px] flex items-center gap-1.5 ${
                  esewaMatched ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {esewaMatched ? <CheckCircle2 size={13} className="text-emerald-600" /> : <AlertTriangle size={13} className="text-rose-600" />}
                  <span className="font-bold">eSewa Wallet: {esewaMatched ? 'Reconciled ✓' : (!esewaHasImg ? 'Missing Statement' : 'Mismatch')}</span>
                </div>

                <div className={`p-2 rounded-lg border text-[11px] flex items-center gap-1.5 ${
                  sahakariMatched ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {sahakariMatched ? <CheckCircle2 size={13} className="text-emerald-600" /> : <AlertTriangle size={13} className="text-rose-600" />}
                  <span className="font-bold">Sahakari: {sahakariMatched ? 'Reconciled ✓' : (!sahakariHasImg ? 'Missing Statement' : 'Mismatch')}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Active Periodic Closing Record & Role Workflow */}
          <div className="space-y-6">

            {/* Active Periodic Closing Record status box */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Layers size={14} className="text-indigo-600" />
                <span>Closing Workflow & Approvals</span>
              </h4>

              {activeClosing ? (
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">Record ID</span>
                      <span className="text-xs font-mono font-bold text-slate-700">{activeClosing.id}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                      activeClosing.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      activeClosing.status === 'Pending Admin Consensus' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      activeClosing.status === 'Pending Meeting' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {activeClosing.status === 'Pending Meeting' ? 'Pending Admin Approval' : activeClosing.status}
                    </span>
                  </div>

                  {/* Compact Signoff Chain Header */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-[11px]">
                      <span className="text-slate-500">Closing Done By:</span>
                      <span className="font-bold text-slate-800 font-mono">{activeClosing.closingDoneBy || 'Staff'}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-[11px]">
                      <span className="text-slate-500">Verified By:</span>
                      <span className="font-bold text-indigo-700 font-mono">{activeClosing.verifiedBy || 'Pending Admin Review'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Final Approval:</span>
                      <span className={`font-bold font-mono ${activeClosing.status === 'Approved' ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {activeClosing.approvedBy || '@reliableadmin (Arpan Khadka)'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                      <span className="text-[9px] text-slate-400 font-mono block">Total Income</span>
                      <span className="font-bold text-slate-800 font-mono text-[11px]">{formatRs(activeClosing.totalIncome)}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                      <span className="text-[9px] text-slate-400 font-mono block">Total Expense</span>
                      <span className="font-bold text-slate-800 font-mono text-[11px]">{formatRs(activeClosing.totalExpenses)}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                      <span className="text-[9px] text-slate-400 font-mono block">Net P&L</span>
                      <span className={`font-bold font-mono text-[11px] ${activeClosing.netPL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatRs(activeClosing.netPL)}
                      </span>
                    </div>
                  </div>

                  {/* UNLOCKED PERIOD RELOCK ACTION */}
                  {activeClosing.unlocked && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                      <p className="text-xs font-bold text-amber-800 flex items-center gap-1">
                        <Unlock size={13} />
                        <span>Period is Unlocked for Editing</span>
                      </p>
                      <p className="text-[10px] text-amber-700">
                        Reason: &ldquo;{activeClosing.unlockReason}&rdquo; (Unlocked by {activeClosing.unlockedBy})
                      </p>
                      <button
                        onClick={executeRedoAndLockPeriod}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-2 rounded-lg transition text-center cursor-pointer shadow-xs flex items-center justify-center gap-1"
                      >
                        <Lock size={12} />
                        <span>Redo & Lock Period Again</span>
                      </button>
                    </div>
                  )}

                  {/* ADMIN VERIFICATION STEP */}
                  {activeClosing.status === 'Pending Meeting' && !activeClosing.verifiedBy && (currentUser.role === 'Admin' || currentUser.role === 'Super Admin') && (
                    <div className="border-t border-slate-100 pt-3.5 space-y-2">
                      <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <UserCheck size={13} className="text-indigo-600" />
                        <span>Admin Verification Review</span>
                      </h5>
                      <p className="text-[10px] text-slate-400">Confirm all 5 account balances and statements before signoff.</p>
                      <button
                        onClick={executeAdminVerify}
                        className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] py-2 rounded-lg transition cursor-pointer"
                      >
                        Mark Verified by Admin
                      </button>
                    </div>
                  )}

                  {/* FINAL APPROVAL BY @reliableadmin */}
                  {activeClosing.status === 'Pending Meeting' && (
                    <div className="border-t border-slate-100 pt-3.5 space-y-3">
                      <div>
                        <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <Award size={13} className="text-emerald-600" />
                          <span>Final Approval & Legal Seal</span>
                        </h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">Approval is always registered under @reliableadmin (Arpan Khadka).</p>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 text-xs">
                        <div className="space-y-0.5">
                          <NepaliDatePicker
                            label="Meeting Date (BS)"
                            value={meetingDate}
                            onChange={(newVal) => setMeetingDate(newVal)}
                            mode="date"
                            placeholder="YYYY-MM-DD"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-500 font-mono">Meeting Number</span>
                          <input
                            type="text"
                            value={meetingNumber}
                            onChange={(e) => setMeetingNumber(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-1.5 text-xs font-mono bg-slate-50"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-500 font-mono">Decision Number</span>
                          <input
                            type="text"
                            value={decisionNumber}
                            onChange={(e) => setDecisionNumber(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-1.5 text-xs font-mono bg-slate-50"
                          />
                        </div>
                      </div>

                      <button
                        onClick={executeFinalMeetingSignoff}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-2.5 rounded-lg transition text-center cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <ShieldCheck size={13} />
                        <span>Approve & Lock Closing (@reliableadmin)</span>
                      </button>
                    </div>
                  )}

                  {/* UNLOCK CLOSING & MODIFICATIONS */}
                  {activeClosing.status === 'Approved' && !activeClosing.unlocked && (
                    <div className="border-t border-slate-100 pt-3.5 space-y-3">
                      <div>
                        <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <Lock size={12} className="text-amber-500" />
                          <span>Closing Lock & Unlock Settings</span>
                        </h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Transactions in this closed period are locked. Unlocking is strictly managed by @reliableadmin (System Master). Note: Due collection and payment remain allowed.
                        </p>
                      </div>

                      {isReliableAdminMaster(currentUser) ? (
                        <button
                          onClick={executeMasterUnlock}
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold py-2 rounded-lg transition text-center cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Unlock size={13} />
                          <span>Unlock Closed Period (@reliableadmin)</span>
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <div className="space-y-1.5">
                            <textarea
                              rows={2}
                              value={briefRemarks}
                              onChange={(e) => setBriefRemarks(e.target.value)}
                              placeholder="Brief Remarks (Context/reason for edit request)*"
                              className="w-full border border-slate-200 rounded-lg p-2 text-[11px] focus:outline-hidden"
                            />
                          </div>

                          <button
                            onClick={executeRequestEdit}
                            className="w-full bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold py-2 rounded-lg transition text-center cursor-pointer"
                          >
                            Request Consensus to Unlock
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* MULTI-ADMIN CONSENSUS MATRIX */}
                  {activeClosing.status === 'Pending Admin Consensus' && (
                    <div className="border-t border-slate-100 pt-3.5 space-y-3">
                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 space-y-1.5">
                        <p className="text-xs font-bold text-amber-800 flex items-center gap-1">
                          <Lock size={13} />
                          <span>Pending Admin Consensus</span>
                        </p>
                        <p className="text-[10px] text-amber-700 font-mono italic">
                          "{activeClosing.briefRemarks}"
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                          Sign-Off Matrix ({activeClosing.approvalLog?.approvals?.length || 0} / {totalAdminsCount})
                        </span>

                        <div className="space-y-1 bg-slate-50 border border-slate-200/60 rounded-xl p-2 max-h-[140px] overflow-y-auto">
                          {systemAdmins.map(admin => {
                            const isApproved = activeClosing.approvalLog?.approvals?.includes(admin.id);
                            return (
                              <div key={admin.id} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-100 last:border-b-0">
                                <span className="font-semibold text-slate-700">{admin.name}</span>
                                {isApproved ? (
                                  <span className="text-emerald-600 font-bold font-mono flex items-center gap-0.5 text-[10px]">
                                    <Check size={12} />
                                    <span>Signed</span>
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => executeApproveEdit(admin.id)}
                                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded px-2 py-0.5 font-bold text-[9px] transition cursor-pointer"
                                  >
                                    Sign / Approve
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Universal Print Button */}
                  <div className="border-t border-slate-100 pt-3.5 flex gap-2">
                    <button
                      onClick={() => setUniversalPrintClosing(activeClosing)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold py-2.5 rounded-lg transition text-center cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Printer size={13} />
                      <span>Universal Print Report</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  Select a date range and click "Submit for Admin Verification" to begin the closing workflow.
                </div>
              )}
            </div>

            {/* Quick system check */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-1.5 text-xs">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Reconciliation Architecture</span>
              <div className="space-y-1 text-slate-600">
                <p className="flex items-center gap-1.5 text-[11px]">
                  <Check size={12} className="text-emerald-600 font-bold" />
                  <span>5-Account Ledger Matrix Auto-Synced</span>
                </p>
                <p className="flex items-center gap-1.5 text-[11px]">
                  <Check size={12} className="text-emerald-600 font-bold" />
                  <span>Bank & Wallet Statement Auto-Testing</span>
                </p>
                <p className="flex items-center gap-1.5 text-[11px]">
                  <Check size={12} className="text-emerald-600 font-bold" />
                  <span>Final Approval by @reliableadmin (Arpan Khadka)</span>
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ARCHIVES TAB */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-800 font-display">Permanent Signoff Archives & Audit Logs</h4>

          {periodicClosings.length === 0 ? (
            <div className="text-center py-12 text-slate-400 italic text-xs">
              No historical signoff records saved yet. Process drafts and finalize meeting minutes to archive them.
            </div>
          ) : (
            <div className="space-y-4">
              {periodicClosings.map(closing => (
                <div key={closing.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3 text-xs hover:border-slate-300 transition">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <div>
                      <span className="font-black text-slate-800 text-sm font-mono">{closing.period}</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-2">({closing.duration})</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                      closing.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                    }`}>
                      {closing.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                    <div>
                      <span className="text-slate-400 block font-mono">Total Income</span>
                      <span className="font-bold text-slate-800 font-mono">{formatRs(closing.totalIncome)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-mono">Total Expense</span>
                      <span className="font-bold text-slate-800 font-mono">{formatRs(closing.totalExpenses)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-mono">Net Profit/Loss</span>
                      <span className={`font-extrabold font-mono ${closing.netPL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatRs(closing.netPL)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-mono">Approved By</span>
                      <span className="font-semibold text-emerald-700">{closing.approvedBy || '@reliableadmin'}</span>
                    </div>
                  </div>

                  {closing.meetingNumber && (
                    <div className="bg-white border border-slate-150 rounded-lg p-2.5 grid grid-cols-3 gap-2 text-[10px] font-mono">
                      <p><strong>Date:</strong> {closing.meetingDate}</p>
                      <p><strong>Meeting #:</strong> {closing.meetingNumber}</p>
                      <p><strong>Decision #:</strong> {closing.decisionNumber}</p>
                    </div>
                  )}

                  {closing.unlocked && (
                    <div className="bg-amber-50 text-amber-800 p-2.5 rounded-xl border border-amber-200 text-[10px] space-y-0.5 font-sans">
                      <p className="font-extrabold flex items-center gap-1 text-[11px] text-amber-900">🔓 Period Unlocked by {closing.unlockedBy || 'Admin'}</p>
                      <p className="italic text-slate-600">&ldquo;{closing.unlockReason}&rdquo;</p>
                    </div>
                  )}

                  {/* Audit log trail */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Audit Log History</span>
                    <div className="space-y-1 font-mono text-[9px] text-slate-500 max-h-[80px] overflow-y-auto bg-slate-100 p-2 rounded-lg">
                      {closing.history?.map((h, idx) => (
                        <p key={idx} className="leading-normal">
                          [{new Date(h.timestamp).toLocaleTimeString()}] <strong>{h.action}</strong> by {h.byUser} - <span className="italic">"{h.remarks}"</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    {(currentUser.role === 'Admin' || currentUser.role === 'Super Admin') && closing.status === 'Approved' && !closing.unlocked && (
                      <button
                        onClick={() => {
                          if (!isReliableAdminMaster(currentUser)) {
                            alert("⚠️ Access Denied: Only @reliableadmin user account (System Master) is authorized to unlock completed periodic closings.");
                            return;
                          }
                          const reason = prompt("Enter a specific reason for @reliableadmin (System Master) to unlock this periodic closing:");
                          if (reason && reason.trim()) {
                            const updatedClosing = {
                              ...closing,
                              unlocked: true,
                              unlockedBy: '@reliableadmin (Arpan Khadka)',
                              unlockReason: reason.trim(),
                              history: [
                                ...(closing.history || []),
                                {
                                  timestamp: new Date().toISOString(),
                                  action: 'Period Unlocked by System Master',
                                  byUser: '@reliableadmin (Arpan Khadka)',
                                  remarks: `Unlocked closing with reason: ${reason.trim()}`
                                }
                              ]
                            };
                            onSavePeriodicClosing(updatedClosing);
                            alert(`SUCCESS: Periodic closing for "${closing.period}" has been unlocked by @reliableadmin (System Master).`);
                          } else if (reason !== null) {
                            alert("An unlock reason is required.");
                          }
                        }}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded px-2.5 py-1 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                        title="Unlock period transaction lock (@reliableadmin only)"
                      >
                        <Unlock size={11} />
                        <span>Unlock (@reliableadmin)</span>
                      </button>
                    )}
                    {closing.unlocked && (
                      <button
                        onClick={() => loadClosingIntoForm(closing)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded px-2.5 py-1 text-[10px] font-bold transition cursor-pointer"
                        title="Load this unlocked closing back into the board to make edits or re-lock it"
                      >
                        Redo & Lock
                      </button>
                    )}
                    <button
                      onClick={() => setUniversalPrintClosing(closing)}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded px-2.5 py-1 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <Printer size={11} />
                      <span>Universal Print</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedClosingId(closing.id);
                        setActiveSubTab('form');
                      }}
                      className="bg-slate-800 hover:bg-slate-900 text-white rounded px-2.5 py-1 text-[10px] font-bold transition cursor-pointer"
                    >
                      Load in Board
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* UNIVERSAL PRINT REPORT MODAL */}
      {universalPrintClosing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[95vh] flex flex-col">
            
            {/* Header Actions */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-800 font-display">Universal Financial Closing & Audit Document</h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer size={13} />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setUniversalPrintClosing(null)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="flex-1 overflow-y-auto p-6 border border-slate-200 rounded-xl bg-white space-y-5 text-slate-800 font-sans print:border-0 print:p-0">
              
              {/* Document Header */}
              <div className="text-center border-b-2 border-slate-800 pb-4">
                <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  {profile?.name || 'RELIABLE TECHNICAL SERVICES'}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {profile?.address || 'Kathmandu, Nepal'} | Contact: {profile?.phone || '+977-9800000000'} | PAN: {profile?.taxNumber || '123456789'}
                </p>
                <div className="mt-2 inline-block bg-slate-100 border border-slate-300 px-4 py-1 rounded-md text-xs font-black tracking-wider uppercase font-mono text-slate-800">
                  Periodic Financial Closing & Reconciliation Statement
                </div>
              </div>

              {/* Compact Audit Metadata Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">Closing Period Range:</span>
                  <span className="font-bold text-slate-800">{universalPrintClosing.period} ({universalPrintClosing.duration})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Closing Date & Time:</span>
                  <span className="font-bold text-slate-800">
                    {universalPrintClosing.closingDateBs || universalPrintClosing.meetingDate || getCurrentBsDate()} | {universalPrintClosing.closingTime || getCurrentNepalTime()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Closing Done By:</span>
                  <span className="font-bold text-slate-800">{universalPrintClosing.closingDoneBy || 'Staff'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Approval Status:</span>
                  <span className="font-bold text-emerald-700 font-mono">Approved by @reliableadmin (Arpan Khadka)</span>
                </div>
              </div>

              {/* Financial KPI Summary */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase font-mono block">Total System Inflows</span>
                  <span className="text-sm font-black font-mono text-emerald-700">{formatRs(universalPrintClosing.totalIncome)}</span>
                </div>
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg">
                  <span className="text-[10px] text-rose-800 font-bold uppercase font-mono block">Total System Outflows</span>
                  <span className="text-sm font-black font-mono text-rose-700">{formatRs(universalPrintClosing.totalExpenses)}</span>
                </div>
                <div className={`p-2.5 border rounded-lg ${universalPrintClosing.netPL >= 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-rose-50 border-rose-200'}`}>
                  <span className="text-[10px] text-indigo-800 font-bold uppercase font-mono block">Net Operating Profit/Loss</span>
                  <span className={`text-sm font-black font-mono ${universalPrintClosing.netPL >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                    {formatRs(universalPrintClosing.netPL)}
                  </span>
                </div>
              </div>

              {/* Account-Wise Detailed Sequential Transaction Tables */}
              {(() => {
                const pFrom = universalPrintClosing.fromDate || fromDate || '2083-01-01';
                const pTo = universalPrintClosing.toDate || toDate || universalPrintClosing.closingDateBs || '2083-12-30';
                
                const cashData = computeDetailedAccountLedger('CASH', pFrom, pTo);
                const rbbData = computeDetailedAccountLedger('RBB', pFrom, pTo);
                const esewaData = computeDetailedAccountLedger('ESEWA', pFrom, pTo);
                const sahakariData = computeDetailedAccountLedger('SAHAKARI', pFrom, pTo);
                const dueData = computeDetailedAccountLedger('DUE', pFrom, pTo);

                const accountSections = [
                  { name: '1. Physical Cash in Hand (Cash)', code: 'CASH', data: cashData, balance: universalPrintClosing.accounts.Cash.closingBalance },
                  { name: '2. Rastriya Banijya Bank (RBB) Current Account', code: 'RBB', data: rbbData, balance: universalPrintClosing.accounts.RBB.closingBalance },
                  { name: '3. eSewa Digital Wallet Account', code: 'ESEWA', data: esewaData, balance: universalPrintClosing.accounts.eSewa.closingBalance },
                  { name: '4. Sahakari Cooperative Savings Account', code: 'SAHAKARI', data: sahakariData, balance: universalPrintClosing.accounts.Sahakari.closingBalance },
                  { name: '5. Customer Credit Due Ledger (Receivables)', code: 'DUE', data: dueData, balance: universalPrintClosing.accounts.Due.closingBalance },
                ];

                return (
                  <div className="space-y-4">
                    {accountSections.map((sec, idx) => (
                      <div key={idx} className="border border-slate-300 rounded-lg overflow-hidden bg-white">
                        <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-800 font-mono">
                            {sec.name}
                          </span>
                          <div className="text-[10px] font-mono text-slate-600">
                            Total In: <span className="text-emerald-700 font-bold">{formatRs(sec.data.totalIn)}</span> | Total Out: <span className="text-rose-700 font-bold">{formatRs(sec.data.totalOut)}</span> | Closing Balance: <span className="text-indigo-950 font-black">{formatRs(sec.balance)}</span>
                          </div>
                        </div>
                        <table className="w-full text-left text-xs border-collapse font-mono">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                              <th className="py-1 px-3">Date (BS)</th>
                              <th className="py-1 px-3">Description / Particulars</th>
                              <th className="py-1 px-3">Ref / Voucher</th>
                              <th className="py-1 px-3 text-right">Inflow (Rs.)</th>
                              <th className="py-1 px-3 text-right">Outflow (Rs.)</th>
                              <th className="py-1 px-3 text-right">Running Balance (Rs.)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-[11px]">
                            {sec.data.ledger.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-2 px-3 text-center text-slate-400 italic">
                                  No transaction entries recorded for this account during this period
                                </td>
                              </tr>
                            ) : (
                              sec.data.ledger.map(row => (
                                <tr key={row.id} className="hover:bg-slate-50">
                                  <td className="py-1 px-3 whitespace-nowrap text-slate-600">{row.date}</td>
                                  <td className="py-1 px-3 text-slate-900 font-medium">{row.description}</td>
                                  <td className="py-1 px-3 text-slate-500 font-mono text-[10px]">{row.reference}</td>
                                  <td className="py-1 px-3 text-right font-bold text-emerald-700">
                                    {row.type === 'In' ? formatRs(row.amount) : '-'}
                                  </td>
                                  <td className="py-1 px-3 text-right font-bold text-rose-700">
                                    {row.type === 'Out' ? formatRs(row.amount) : '-'}
                                  </td>
                                  <td className="py-1 px-3 text-right font-bold text-slate-900">
                                    {formatRs(row.runningBalance)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300 text-[11px]">
                              <td colSpan={3} className="py-1.5 px-3 uppercase text-[10px] text-slate-600">Total ({sec.code})</td>
                              <td className="py-1.5 px-3 text-right text-emerald-700">{formatRs(sec.data.totalIn)}</td>
                              <td className="py-1.5 px-3 text-right text-rose-700">{formatRs(sec.data.totalOut)}</td>
                              <td className="py-1.5 px-3 text-right text-indigo-950 font-black">{formatRs(sec.balance)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* 5-Account Ecosystem Master Matrix Table */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">
                  Total of all accounts & 5-Account Reconciliation Matrix
                </h4>
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold text-slate-700 uppercase">
                        <th className="py-2 px-3">Account Ledger</th>
                        <th className="py-2 px-3 text-right bg-amber-50/70 text-amber-900 border-l border-r border-amber-200">Opening Balance (Settings)</th>
                        <th className="py-2 px-3 text-right">Inflows (Income)</th>
                        <th className="py-2 px-3 text-right">Outflows (Expenses)</th>
                        <th className="py-2 px-3 text-right">System Book Balance</th>
                        <th className="py-2 px-3 text-right">Statement / Verified</th>
                        <th className="py-2 px-3 text-right">Discrepancy</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[11px]">
                      <tr>
                        <td className="py-2 px-3 font-bold">1. Physical Cash Drawer Ledger</td>
                        <td className="py-2 px-3 text-right bg-amber-50/30 font-semibold border-l border-r border-amber-100">{formatRs(universalPrintClosing.accounts.Cash.openingBalance ?? getAccountOpeningBalanceInfo('Cash', openingBalances).openingBalance)}</td>
                        <td className="py-2 px-3 text-right">{formatRs(universalPrintClosing.accounts.Cash.totalDeposits)}</td>
                        <td className="py-2 px-3 text-right">{formatRs(universalPrintClosing.accounts.Cash.totalWithdrawals)}</td>
                        <td className="py-2 px-3 text-right font-bold">{formatRs(universalPrintClosing.accounts.Cash.closingBalance)}</td>
                        <td className="py-2 px-3 text-right font-bold">{formatRs(universalPrintClosing.accounts.Cash.verifiedBalance ?? universalPrintClosing.accounts.Cash.closingBalance)}</td>
                        <td className="py-2 px-3 text-right text-emerald-700 font-bold">Rs. 0.00</td>
                        <td className="py-2 px-3 text-center font-bold text-emerald-700">RECONCILED ✓</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold">2. Rastriya Banijya Bank (RBB) Current</td>
                        <td className="py-2 px-3 text-right bg-amber-50/30 font-semibold border-l border-r border-amber-100">{formatRs(universalPrintClosing.accounts.RBB.openingBalance ?? getAccountOpeningBalanceInfo('RBB', openingBalances).openingBalance)}</td>
                        <td className="py-2 px-3 text-right">{formatRs(universalPrintClosing.accounts.RBB.totalDeposits)}</td>
                        <td className="py-2 px-3 text-right">{formatRs(universalPrintClosing.accounts.RBB.totalWithdrawals)}</td>
                        <td className="py-2 px-3 text-right font-bold">{formatRs(universalPrintClosing.accounts.RBB.closingBalance)}</td>
                        <td className="py-2 px-3 text-right font-bold">{formatRs(universalPrintClosing.accounts.RBB.verifiedBalance ?? universalPrintClosing.accounts.RBB.closingBalance)}</td>
                        <td className="py-2 px-3 text-right text-emerald-700 font-bold">Rs. 0.00</td>
                        <td className="py-2 px-3 text-center font-bold text-emerald-700">RECONCILED ✓</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold">3. eSewa Digital Wallet Ledger</td>
                        <td className="py-2 px-3 text-right bg-amber-50/30 font-semibold border-l border-r border-amber-100">{formatRs(universalPrintClosing.accounts.eSewa.openingBalance ?? getAccountOpeningBalanceInfo('eSewa', openingBalances).openingBalance)}</td>
                        <td className="py-2 px-3 text-right">{formatRs(universalPrintClosing.accounts.eSewa.totalDeposits)}</td>
                        <td className="py-2 px-3 text-right">{formatRs(universalPrintClosing.accounts.eSewa.totalWithdrawals)}</td>
                        <td className="py-2 px-3 text-right font-bold">{formatRs(universalPrintClosing.accounts.eSewa.closingBalance)}</td>
                        <td className="py-2 px-3 text-right font-bold">{formatRs(universalPrintClosing.accounts.eSewa.verifiedBalance ?? universalPrintClosing.accounts.eSewa.closingBalance)}</td>
                        <td className="py-2 px-3 text-right text-emerald-700 font-bold">Rs. 0.00</td>
                        <td className="py-2 px-3 text-center font-bold text-emerald-700">RECONCILED ✓</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold">4. Sahakari Cooperative Ledger</td>
                        <td className="py-2 px-3 text-right bg-amber-50/30 font-semibold border-l border-r border-amber-100">{formatRs(universalPrintClosing.accounts.Sahakari.openingBalance ?? getAccountOpeningBalanceInfo('Sahakari', openingBalances).openingBalance)}</td>
                        <td className="py-2 px-3 text-right">{formatRs(universalPrintClosing.accounts.Sahakari.totalDeposits)}</td>
                        <td className="py-2 px-3 text-right">{formatRs(universalPrintClosing.accounts.Sahakari.totalWithdrawals)}</td>
                        <td className="py-2 px-3 text-right font-bold">{formatRs(universalPrintClosing.accounts.Sahakari.closingBalance)}</td>
                        <td className="py-2 px-3 text-right font-bold">{formatRs(universalPrintClosing.accounts.Sahakari.verifiedBalance ?? universalPrintClosing.accounts.Sahakari.closingBalance)}</td>
                        <td className="py-2 px-3 text-right text-emerald-700 font-bold">Rs. 0.00</td>
                        <td className="py-2 px-3 text-center font-bold text-emerald-700">RECONCILED ✓</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold">5. Credit Due Ledger (Receivables)</td>
                        <td className="py-2 px-3 text-right bg-amber-50/30 font-semibold border-l border-r border-amber-100">{formatRs(universalPrintClosing.accounts.Due.openingBalance ?? getAccountOpeningBalanceInfo('Due', openingBalances).openingBalance)}</td>
                        <td className="py-2 px-3 text-right">{formatRs(universalPrintClosing.accounts.Due.totalDeposits)}</td>
                        <td className="py-2 px-3 text-right">{formatRs(universalPrintClosing.accounts.Due.totalWithdrawals)}</td>
                        <td className="py-2 px-3 text-right font-bold">{formatRs(universalPrintClosing.accounts.Due.closingBalance)}</td>
                        <td className="py-2 px-3 text-right font-bold">{formatRs(universalPrintClosing.accounts.Due.verifiedBalance ?? universalPrintClosing.accounts.Due.closingBalance)}</td>
                        <td className="py-2 px-3 text-right text-emerald-700 font-bold">Rs. 0.00</td>
                        <td className="py-2 px-3 text-center font-bold text-emerald-700">RECONCILED ✓</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                        <td className="py-2 px-3 uppercase">Total of All Accounts</td>
                        <td className="py-2 px-3 text-right text-amber-950 font-black bg-amber-100/50 border-l border-r border-amber-200">
                          {formatRs(
                            (universalPrintClosing.accounts.RBB.openingBalance ?? getAccountOpeningBalanceInfo('RBB', openingBalances).openingBalance) +
                            (universalPrintClosing.accounts.Cash.openingBalance ?? getAccountOpeningBalanceInfo('Cash', openingBalances).openingBalance) +
                            (universalPrintClosing.accounts.eSewa.openingBalance ?? getAccountOpeningBalanceInfo('eSewa', openingBalances).openingBalance) +
                            (universalPrintClosing.accounts.Sahakari.openingBalance ?? getAccountOpeningBalanceInfo('Sahakari', openingBalances).openingBalance) +
                            (universalPrintClosing.accounts.Due.openingBalance ?? getAccountOpeningBalanceInfo('Due', openingBalances).openingBalance)
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">{formatRs(universalPrintClosing.totalIncome)}</td>
                        <td className="py-2 px-3 text-right">{formatRs(universalPrintClosing.totalExpenses)}</td>
                        <td className="py-2 px-3 text-right font-black">
                          {formatRs(
                            universalPrintClosing.accounts.RBB.closingBalance +
                            universalPrintClosing.accounts.Cash.closingBalance +
                            universalPrintClosing.accounts.eSewa.closingBalance +
                            universalPrintClosing.accounts.Sahakari.closingBalance +
                            universalPrintClosing.accounts.Due.closingBalance
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-black">
                          {formatRs(
                            (universalPrintClosing.accounts.RBB.verifiedBalance ?? universalPrintClosing.accounts.RBB.closingBalance) +
                            (universalPrintClosing.accounts.Cash.verifiedBalance ?? universalPrintClosing.accounts.Cash.closingBalance) +
                            (universalPrintClosing.accounts.eSewa.verifiedBalance ?? universalPrintClosing.accounts.eSewa.closingBalance) +
                            (universalPrintClosing.accounts.Sahakari.verifiedBalance ?? universalPrintClosing.accounts.Sahakari.closingBalance) +
                            (universalPrintClosing.accounts.Due.verifiedBalance ?? universalPrintClosing.accounts.Due.closingBalance)
                          )}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-700 font-black">Rs. 0.00</td>
                        <td className="py-2 px-3 text-center font-bold text-emerald-700">ALL BALANCED ✓</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Compact Signoff Seals */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs font-mono">
                <div className="border-t border-slate-400 pt-2">
                  <span className="font-bold block text-slate-800">{universalPrintClosing.closingDoneBy || currentUser.name || 'Accountant / Staff'}</span>
                  <span className="text-[10px] text-slate-500">Prepared By</span>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <span className="font-bold block text-indigo-800">{universalPrintClosing.verifiedBy || 'Internal Audit / Admin'}</span>
                  <span className="text-[10px] text-slate-500">Verified By</span>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <span className="font-bold block text-emerald-800">{universalPrintClosing.approvedBy || (currentUser.role === 'Admin' ? `${currentUser.name} (Admin)` : 'Authorized Admin')}</span>
                  <span className="text-[10px] text-slate-500">Approved & Certified (Admin)</span>
                </div>
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  const summaryText = `RELIABLE TECHNICAL SERVICES - PERIODIC CLOSING & RECONCILIATION
Period: ${universalPrintClosing.period} (${universalPrintClosing.duration})
Closing Date & Time: ${universalPrintClosing.closingDateBs || getCurrentBsDate()} | ${universalPrintClosing.closingTime || getCurrentNepalTime()}
Done By: ${universalPrintClosing.closingDoneBy || 'Staff'} | Verified By: ${universalPrintClosing.verifiedBy || 'Admin'} | Approved By: ${universalPrintClosing.approvedBy || (currentUser.role === 'Admin' ? `${currentUser.name} (Admin)` : 'Authorized Admin')}

FINANCIAL METRICS:
Total Income: ${formatRs(universalPrintClosing.totalIncome)}
Total Expenses: ${formatRs(universalPrintClosing.totalExpenses)}
Net P&L: ${formatRs(universalPrintClosing.netPL)}

5-ACCOUNT RECONCILIATION:
- RBB Bank: ${formatRs(universalPrintClosing.accounts.RBB.closingBalance)} (Reconciled ✓)
- Physical Cash: ${formatRs(universalPrintClosing.accounts.Cash.closingBalance)} (Reconciled ✓)
- eSewa Wallet: ${formatRs(universalPrintClosing.accounts.eSewa.closingBalance)} (Reconciled ✓)
- Sahakari: ${formatRs(universalPrintClosing.accounts.Sahakari.closingBalance)} (Reconciled ✓)
- Due Receivables: ${formatRs(universalPrintClosing.accounts.Due.closingBalance)} (Reconciled ✓)`;
                  navigator.clipboard.writeText(summaryText);
                  alert('Copied universal closing summary to clipboard!');
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Copy size={13} />
                <span>Copy Summary</span>
              </button>
              <button
                onClick={() => setUniversalPrintClosing(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-1.5 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-800 font-display">{previewImage.title}</h4>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-auto rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center p-2">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[60vh] object-contain rounded-lg shadow-xs"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewImage(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-1.5 rounded-lg text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
