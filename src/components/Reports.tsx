import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Printer,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  ShieldCheck,
  Wallet,
  Receipt,
  Building,
  CreditCard
} from 'lucide-react';
import { SalesInvoice, Expense, SupplyTransaction, BusinessService, Supplier, InventoryItem, BusinessProfile, OpeningBalances, AccountTransaction, AssetItem, AppUser, DailyClosing, EditRequest, SalaryDistribution, OfficeUseRequest, Shareholder, OpeningShareDetail, ShareTransaction, MeetingNote } from '../types';
import { getCurrentBsDate, getFormattedPoNumber, adToBs, bsToAd, formatBsDate } from '../utils/nepaliDate';
import { validateAccountBalance, BalanceValidationResult } from '../utils/accountBalance';
import { CorporateLetterhead } from './CorporateLetterhead';
import { NepaliDatePicker } from './NepaliDatePicker';
import { InteractiveSearchBar } from './InteractiveSearchBar';

interface ReportsProps {
  invoices: SalesInvoice[];
  expenses: Expense[];
  transactions: SupplyTransaction[];
  services: BusinessService[];
  suppliers: Supplier[];
  inventoryStock: InventoryItem[];
  assets?: AssetItem[];
  profile: BusinessProfile;
  openingBalances?: OpeningBalances;
  accountTransfers?: AccountTransaction[];
  onUpdateAccountTransfers?: (transfers: AccountTransaction[]) => void;
  currentUser?: AppUser;
  dailyClosings?: DailyClosing[];
  editRequests?: EditRequest[];
  salaryDistributions?: SalaryDistribution[];
  officeUseRequests?: OfficeUseRequest[];
  onTriggerInsufficientBalance?: (validation: BalanceValidationResult) => void;
  shareholders?: Shareholder[];
  onUpdateShareholders?: (shareholders: Shareholder[]) => void;
  meetingNotes?: MeetingNote[];
}

type ReportType = 'income' | 'expenses' | 'income_expenditure' | 'cost_vs_selling' | 'account_ledger' | 'assets_registry' | 'account_summary' | 'office_use' | 'shareholder_share';
type PeriodType = 'day' | 'month' | '3_months' | '6_months' | 'year';

export const Reports: React.FC<ReportsProps> = ({
  invoices,
  expenses,
  transactions,
  services,
  suppliers,
  inventoryStock,
  assets = [],
  profile,
  openingBalances = {
    RBB: { openingBalance: 0, openingBalanceDate: '2083-01-01' },
    ESEWA: { openingBalance: 0, openingBalanceDate: '2083-01-01' },
    SAHAKARI: { openingBalance: 0, openingBalanceDate: '2083-01-01' },
    CASH: { openingBalance: 0, openingBalanceDate: '2083-01-01' },
    DUE: { openingBalance: 0, openingBalanceDate: '2083-01-01' }
  } as OpeningBalances,
  accountTransfers = [],
  onUpdateAccountTransfers,
  currentUser,
  dailyClosings = [],
  editRequests = [],
  salaryDistributions = [],
  officeUseRequests = [],
  onTriggerInsufficientBalance,
  shareholders = [],
  onUpdateShareholders,
  meetingNotes = []
}) => {
  // Shareholder Report States
  const [selectedShareholderId, setSelectedShareholderId] = useState<string | null>(null);
  const [shareholderSearchTerm, setShareholderSearchTerm] = useState('');
  const [openingModalOpen, setOpeningModalOpen] = useState(false);
  const [openingModalShareholder, setOpeningModalShareholder] = useState<Shareholder | null>(null);

  // Opening Share Modal Form State
  const [opAmount, setOpAmount] = useState<number>(0);
  const [opDate, setOpDate] = useState(() => getCurrentBsDate());
  const [opCit, setOpCit] = useState('');
  const [opAddress, setOpAddress] = useState('');
  const [opContact, setOpContact] = useState('');
  const [opPayMethod, setOpPayMethod] = useState('RBB');
  const [opRef, setOpRef] = useState('');
  const [opRemarks, setOpRemarks] = useState('');
  // Office Use Report filters
  const [officeSearchTerm, setOfficeSearchTerm] = useState('');
  const [officeStatusFilter, setOfficeStatusFilter] = useState<'All' | 'Approved' | 'Pending' | 'Rejected'>('All');
  // Date Picker Format Converters
  const bsToAdStr = (bsStr: string): string => {
    const dateObj = bsToAd(bsStr);
    if (!dateObj) return '';
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const adToBsStr = (adStr: string): string => {
    if (!adStr) return '';
    return adToBs(adStr);
  };

  // Report configurations
  const [reportType, setReportType] = useState<ReportType>('income');
  const [fromDate, setFromDate] = useState<string>(() => {
    const today = getCurrentBsDate();
    const parts = today.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-${parts[1]}-01`;
    }
    return today;
  });
  const [toDate, setToDate] = useState<string>(() => {
    return getCurrentBsDate();
  });

  // Account Ledger configuration
  const [activeLedgerAccount, setActiveLedgerAccount] = useState<'RBB' | 'SAHAKARI' | 'ESEWA' | 'CASH' | 'DUE'>('RBB');

  // New transfer/withdrawal form states
  const [txType, setTxType] = useState<'Withdrawal' | 'Deposit' | 'Transfer'>('Withdrawal');
  const [txSource, setTxSource] = useState<'Cash' | 'Esewa' | 'Sahakari' | 'RBB'>('Cash');
  const [txDest, setTxDest] = useState<'Cash' | 'Esewa' | 'Sahakari' | 'RBB'>('RBB');
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txVoucher, setTxVoucher] = useState('');
  const [txRemarks, setTxRemarks] = useState('');
  const [txDate, setTxDate] = useState(() => getCurrentBsDate());
  const [txRecordedBy, setTxRecordedBy] = useState('Admin');
  const [ledgerDisplayMode, setLedgerDisplayMode] = useState<'all' | 'single'>('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Filter logic based on dynamic from/to date range
  const isWithinPeriod = (dateStr: string) => {
    if (!dateStr) return false;
    return dateStr >= fromDate && dateStr <= toDate;
  };

  // Helper to aggregate unique Share Transactions across Meetings and Shareholder records without duplication
  const getUniqueShareTransactions = (): ShareTransaction[] => {
    const txMap = new Map<string, ShareTransaction>();

    // 1. From Meeting Notes
    (meetingNotes || []).forEach(meeting => {
      if (meeting.status !== 'Rejected') {
        (meeting.shareTransactions || []).forEach(tx => {
          if (tx && tx.paidAmount > 0 && tx.status !== 'Rejected') {
            const key = tx.id || `m-${meeting.id}-${tx.shareholderName}-${tx.amount}-${tx.transactionType}-${tx.transactionDate}`;
            txMap.set(key, {
              ...tx,
              meetingNumber: tx.meetingNumber || meeting.meetingNumber
            });
          }
        });
      }
    });

    // 2. From Shareholders list
    (shareholders || []).forEach(sh => {
      (sh.transactions || []).forEach(tx => {
        if (tx && tx.paidAmount > 0 && tx.status !== 'Rejected') {
          const key = tx.id || `sh-${sh.id}-${tx.amount}-${tx.transactionType}-${tx.transactionDate}`;
          if (!txMap.has(key)) {
            txMap.set(key, tx);
          }
        }
      });
    });

    return Array.from(txMap.values());
  };

  const allShareTxs = getUniqueShareTransactions();

  // Filter share additions (Income) and share returns (Expense) within date period
  const filteredShareAdditions = allShareTxs.filter(tx => tx.transactionType === 'Addition' && isWithinPeriod(tx.transactionDate));
  
  const filteredShareReturns = allShareTxs.filter(tx => {
    if (tx.transactionType !== 'Return' || !isWithinPeriod(tx.transactionDate)) return false;
    // Prevent double counting if an expense with matching reference/topic already exists in expenses array
    const existsInExpenses = expenses.some(exp => 
      exp.status === 'Approved' && 
      (exp.referenceId === tx.id || (exp.topic && exp.topic.includes('Share Return') && exp.title && exp.title.includes(tx.shareholderName))) &&
      Math.abs(exp.amount - tx.paidAmount) < 0.01
    );
    return !existsInExpenses;
  });

  const totalShareAdditionIncome = filteredShareAdditions.reduce((sum, tx) => sum + tx.paidAmount, 0);
  const totalShareReturnExpense = filteredShareReturns.reduce((sum, tx) => sum + tx.paidAmount, 0);

  // Filtered records
  const filteredInvoices = invoices.filter(inv => isWithinPeriod(inv.date));
  const filteredExpenses = expenses.filter(exp => exp.status === 'Approved' && isWithinPeriod(exp.date));

  // Totals calculations
  const totalBilledIncome = filteredInvoices.reduce((sum, inv) => sum + inv.finalAmount, 0) + totalShareAdditionIncome;
  const totalReceivedIncome = filteredInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0) + totalShareAdditionIncome;
  const totalDueIncome = filteredInvoices.reduce((sum, inv) => sum + inv.dueAmount, 0);

  const totalExpenditure = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0) + totalShareReturnExpense;

  // Net metrics
  const accrualProfit = totalBilledIncome - totalExpenditure;
  const cashProfit = totalReceivedIncome - totalExpenditure;

  const [filterStockByDate, setFilterStockByDate] = useState(true);

  const filteredStockItems = filterStockByDate 
    ? inventoryStock.filter(item => isWithinPeriod(item.lastReceivedDate))
    : inventoryStock;

  const activeItemsWithPrice = filteredStockItems.filter(item => item.costPrice > 0);

  // Print function
  const handlePrint = () => {
    if (window.openUniversalPrintPreview) {
      let reportTitle = 'Financial & Operational Audit Report';
      let reportItems: any[] = [];
      let grandTotalVal = 0;

      if (reportType === 'income') {
        reportTitle = 'Fiscal Income & Expenditure Statement';
        reportItems = [
          { sn: 1, name: 'Gross Billed Sales Revenue', quantity: 1, totalPrice: totalBilledIncome },
          { sn: 2, name: 'Actual Cash Collections', quantity: 1, totalPrice: totalReceivedIncome },
          { sn: 3, name: 'Total Approved Expenses', quantity: 1, totalPrice: -totalExpenditure },
          { sn: 4, name: 'Net Operating Cash Profit', quantity: 1, totalPrice: cashProfit }
        ];
        grandTotalVal = cashProfit;
      } else if (reportType === 'expenses') {
        reportTitle = 'Approved Expenditures & Cost Ledger';
        reportItems = [
          { sn: 1, name: 'Operational & Overhead Expenses', quantity: 1, totalPrice: totalExpenditure }
        ];
        grandTotalVal = totalExpenditure;
      } else if (reportType === 'cost_vs_selling') {
        reportTitle = 'Cost vs Selling Price Valuation Audit';
        reportItems = activeItemsWithPrice.slice(0, 25).map((item, idx) => ({
          sn: idx + 1,
          name: `${item.name} (${item.category || 'Item'})`,
          quantity: item.stockQuantity || 1,
          unitPrice: item.sellingPrice || 0,
          totalPrice: (item.sellingPrice || 0) * (item.stockQuantity || 1)
        }));
      } else if (reportType === 'income_expenditure') {
        reportTitle = 'Income and Expenditure Account (Official Statement)';
        
        const approvingAdmin = currentUser.role === 'Admin' 
          ? `${currentUser.name} (Admin)` 
          : (profile?.ownerName ? `${profile.ownerName} (Admin)` : 'Authorized Admin');

        // 1. Opening balance items from openingBalances in Settings tab (within selected period)
        const openingBalanceItems: {
          sn: number;
          date: string;
          particular: string;
          account: string;
          amount: number;
          isOpening: boolean;
        }[] = [];

        let incomeSn = 1;
        const obConfig = [
          { key: 'CASH', account: 'cash', label: 'Opening balance (Cash)' },
          { key: 'RBB', account: 'rbb', label: 'Opening balance (RBB Bank)' },
          { key: 'ESEWA', account: 'esewa', label: 'Opening balance (eSewa)' },
          { key: 'SAHAKARI', account: 'sahakari', label: 'Opening balance (Sahakari)' }
        ] as const;

        obConfig.forEach(acc => {
          const ob = openingBalances[acc.key];
          const obDate = ob?.openingBalanceDate || '2083-04-01';
          const obAmount = ob?.openingBalance || 0;
          if (isWithinPeriod(obDate) && obAmount > 0) {
            openingBalanceItems.push({
              sn: incomeSn++,
              date: obDate,
              particular: `Opening balance (${acc.key})`,
              account: acc.account,
              amount: obAmount,
              isOpening: true
            });
          }
        });

        const invoiceIncomeItems: {
          sn: number;
          date: string;
          particular: string;
          account: string;
          amount: number;
          isOpening: boolean;
        }[] = [];

        filteredInvoices.forEach(inv => {
          if (inv.paymentMethod === 'Split' && inv.paymentSplits) {
            (['cash', 'rbb', 'esewa', 'sahakari', 'due'] as const).forEach(acc => {
              const amt = inv.paymentSplits![acc] || 0;
              if (amt > 0) {
                invoiceIncomeItems.push({
                  sn: incomeSn++,
                  date: inv.date,
                  particular: `Income from ${inv.customerName} (${inv.invoiceNumber})`,
                  account: acc,
                  amount: amt,
                  isOpening: false
                });
              }
            });
          } else {
            const acc = (normalizeAccount(inv.paymentMethod) || 'cash').toLowerCase();
            if (inv.paidAmount > 0) {
              invoiceIncomeItems.push({
                sn: incomeSn++,
                date: inv.date,
                particular: `Income from ${inv.customerName} (${inv.invoiceNumber})`,
                account: acc,
                amount: inv.paidAmount,
                isOpening: false
              });
            }
            if (inv.dueAmount > 0) {
              invoiceIncomeItems.push({
                sn: incomeSn++,
                date: inv.date,
                particular: `Income from ${inv.customerName} (${inv.invoiceNumber}) [Due]`,
                account: 'due',
                amount: inv.dueAmount,
                isOpening: false
              });
            }
          }
        });

        filteredShareAdditions.forEach(st => {
          invoiceIncomeItems.push({
            sn: incomeSn++,
            date: st.transactionDate,
            particular: `Share Capital Addition: ${st.shareholderName}${st.meetingNumber ? ` (Meeting: ${st.meetingNumber})` : ''}`,
            account: (normalizeAccount(st.paymentMethod) || 'cash').toLowerCase(),
            amount: st.paidAmount,
            isOpening: false
          });
        });

        const allIncomeItems = [...openingBalanceItems, ...invoiceIncomeItems];
        const totalIncomeAmount = allIncomeItems.reduce((sum, item) => sum + item.amount, 0);

        // Build Expenditure table items (Date filtered)
        let expSn = 1;
        const expenditureItems = filteredExpenses.map(exp => ({
          sn: expSn++,
          date: exp.date,
          particular: exp.title + (exp.topic ? ` (${exp.topic})` : ''),
          account: (normalizeAccount(exp.paymentMethod) || 'cash').toLowerCase(),
          amount: exp.amount
        }));

        filteredShareReturns.forEach(st => {
          expenditureItems.push({
            sn: expSn++,
            date: st.transactionDate,
            particular: `Share Capital Return / Refund: ${st.shareholderName}${st.meetingNumber ? ` (Meeting: ${st.meetingNumber})` : ''}`,
            account: (normalizeAccount(st.paymentMethod) || 'cash').toLowerCase(),
            amount: st.paidAmount
          });
        });

        const totalExpenditureAmount = expenditureItems.reduce((sum, item) => sum + item.amount, 0);

        // Build Summary table (Account-wise - ONLY Liquid Cash/Bank buckets)
        const summaryAccounts = [
          { key: 'cash', name: 'cash', obKey: 'CASH' },
          { key: 'rbb', name: 'rbb', obKey: 'RBB' },
          { key: 'esewa', name: 'esewa', obKey: 'ESEWA' },
          { key: 'sahakari', name: 'sahakari', obKey: 'SAHAKARI' }
        ];

        const summaryRows = summaryAccounts.map((acc, index) => {
          const opening = openingBalanceItems
            .filter(item => item.isOpening && item.account === acc.key)
            .reduce((sum, item) => sum + item.amount, 0);
          const billIncome = allIncomeItems
            .filter(item => !item.isOpening && item.account === acc.key)
            .reduce((sum, item) => sum + item.amount, 0);
          
          const totalIncomeA = opening + billIncome;
          
          const totalExpB = expenditureItems
            .filter(item => item.account === acc.key)
            .reduce((sum, item) => sum + item.amount, 0);

          const currentAmount = totalIncomeA - totalExpB;

          return {
            sn: index + 1,
            account: acc.key,
            accountName: acc.name,
            opening,
            billIncome,
            totalIncomeA,
            totalExpB,
            currentAmount
          };
        }).filter(row => row.totalIncomeA > 0 || row.totalExpB > 0 || row.opening > 0);

        const totalSummaryIncomeA = summaryRows.reduce((sum, r) => sum + r.totalIncomeA, 0);
        const totalSummaryExpB = summaryRows.reduce((sum, r) => sum + r.totalExpB, 0);
        const totalCurrentBalance = summaryRows.reduce((sum, r) => sum + r.currentAmount, 0);

        const dueOpening = openingBalances.DUE?.openingBalance && isWithinPeriod(openingBalances.DUE.openingBalanceDate || '')
          ? openingBalances.DUE.openingBalance 
          : 0;
        const dueBilledIncome = allIncomeItems
          .filter(item => item.account === 'due')
          .reduce((sum, item) => sum + item.amount, 0);
        const dueToBeCollected = dueOpening + dueBilledIncome;

        const dueToBePaidFromTx = transactions
          .filter(tx => tx.status !== 'Rejected' && isWithinPeriod(tx.date))
          .reduce((sum, tx) => {
            const due = typeof tx.amountDue === 'number' && tx.amountDue >= 0 
              ? tx.amountDue 
              : Math.max(0, (tx as any).totalAmount - (tx.amountPaid || 0));
            return sum + due;
          }, 0);
        const supplierCreditDues = suppliers.reduce((sum, s) => sum + (s.creditBalance || 0), 0);
        const dueToBePaid = Math.max(dueToBePaidFromTx, supplierCreditDues);

        const netTotalBalance = totalCurrentBalance + dueToBeCollected - dueToBePaid;

        reportItems = [
          { sn: 1, name: 'Total Liquid Income (Including Period Opening Balances)', quantity: allIncomeItems.length, totalPrice: totalIncomeAmount },
          { sn: 2, name: 'Total Approved Expenditures', quantity: expenditureItems.length, totalPrice: -totalExpenditureAmount },
          { sn: 3, name: 'Net Liquid Cash Position', quantity: 1, totalPrice: totalCurrentBalance },
          { sn: 4, name: 'Receivables Due to be Collected', quantity: 1, totalPrice: dueToBeCollected },
          { sn: 5, name: 'Payables Due to be Paid', quantity: 1, totalPrice: -dueToBePaid },
          { sn: 6, name: 'Net Ecosystem Accounting Balance', quantity: 1, totalPrice: netTotalBalance }
        ];
        grandTotalVal = netTotalBalance;

        const customComponent = (
          <div className="p-4 space-y-6 text-slate-900 font-sans text-xs">
            {/* Header Title */}
            <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                Income and Expenditure Account
              </h2>
              <p className="text-xs font-bold text-slate-700">
                Official Account Statement with Opening Balances from Settings Tab
              </p>
              <p className="text-[11px] font-mono font-bold text-slate-600">
                Audit Period: {fromDate} to {toDate} | Generated on: {getCurrentBsDate()}
              </p>
            </div>

            {/* 1. INCOME TABLE */}
            <div className="space-y-2 break-inside-avoid">
              <div className="flex justify-between items-center bg-emerald-800 text-white px-3 py-1.5 rounded-t-lg font-mono text-xs font-bold">
                <span className="uppercase tracking-wider">1. Income Ledger (Opening Balances & Collections)</span>
                <span className="text-[11px] font-normal">Records: {allIncomeItems.length}</span>
              </div>
              <div className="border border-slate-300 rounded-b-lg overflow-hidden bg-white">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="bg-emerald-50 border-b border-emerald-200 text-[10px] font-bold text-emerald-950 uppercase">
                      <th className="py-1.5 px-2.5 w-10 text-center">S.N.</th>
                      <th className="py-1.5 px-2.5 w-24">Date</th>
                      <th className="py-1.5 px-2.5">Particular / Source Details</th>
                      <th className="py-1.5 px-2.5 w-24 text-center">Account</th>
                      <th className="py-1.5 px-2.5 text-right w-32 text-emerald-800 font-black">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {allIncomeItems.map(item => (
                      <tr key={`inc-${item.sn}-${item.account}`} className={item.isOpening ? 'bg-indigo-50/40 font-semibold' : 'hover:bg-slate-50'}>
                        <td className="py-1.5 px-2.5 text-center text-slate-500 text-[10px]">{item.sn}</td>
                        <td className="py-1.5 px-2.5 whitespace-nowrap text-slate-700">{item.date}</td>
                        <td className="py-1.5 px-2.5 text-slate-900 font-sans">{item.particular}</td>
                        <td className="py-1.5 px-2.5 text-center uppercase text-[10px] font-bold">
                          <span className={`inline-block px-2 py-0.5 rounded ${
                            item.account === 'cash' ? 'bg-amber-100 text-amber-900' :
                            item.account === 'rbb' ? 'bg-blue-100 text-blue-900' :
                            item.account === 'esewa' ? 'bg-emerald-100 text-emerald-900' :
                            item.account === 'sahakari' ? 'bg-purple-100 text-purple-900' :
                            'bg-rose-100 text-rose-900'
                          }`}>
                            {item.account}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-bold text-emerald-700 whitespace-nowrap">
                          Rs. {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-emerald-900 text-white font-bold border-t-2 border-emerald-950 text-[11px]">
                      <td colSpan={4} className="py-2 px-2.5 uppercase font-mono tracking-wider">
                        Total Income (With Opening Balances)
                      </td>
                      <td className="py-2 px-2.5 text-right text-emerald-300 font-black whitespace-nowrap">
                        Rs. {totalIncomeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 2. EXPENDITURE TABLE */}
            <div className="space-y-2 break-inside-avoid">
              <div className="flex justify-between items-center bg-rose-800 text-white px-3 py-1.5 rounded-t-lg font-mono text-xs font-bold">
                <span className="uppercase tracking-wider">2. Expenditure Ledger (Approved Expenses & Returns)</span>
                <span className="text-[11px] font-normal">Records: {expenditureItems.length}</span>
              </div>
              <div className="border border-slate-300 rounded-b-lg overflow-hidden bg-white">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="bg-rose-50 border-b border-rose-200 text-[10px] font-bold text-rose-950 uppercase">
                      <th className="py-1.5 px-2.5 w-10 text-center">S.N.</th>
                      <th className="py-1.5 px-2.5 w-24">Date</th>
                      <th className="py-1.5 px-2.5">Particular / Expense Title</th>
                      <th className="py-1.5 px-2.5 w-24 text-center">Account</th>
                      <th className="py-1.5 px-2.5 text-right w-32 text-rose-800 font-black">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {expenditureItems.map(item => (
                      <tr key={`exp-${item.sn}`} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2.5 text-center text-slate-500 text-[10px]">{item.sn}</td>
                        <td className="py-1.5 px-2.5 whitespace-nowrap text-slate-700">{item.date}</td>
                        <td className="py-1.5 px-2.5 text-slate-900 font-sans">{item.particular}</td>
                        <td className="py-1.5 px-2.5 text-center uppercase text-[10px] font-bold">
                          <span className={`inline-block px-2 py-0.5 rounded ${
                            item.account === 'cash' ? 'bg-amber-100 text-amber-900' :
                            item.account === 'rbb' ? 'bg-blue-100 text-blue-900' :
                            item.account === 'esewa' ? 'bg-emerald-100 text-emerald-900' :
                            item.account === 'sahakari' ? 'bg-purple-100 text-purple-900' :
                            'bg-rose-100 text-rose-900'
                          }`}>
                            {item.account}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-bold text-rose-600 whitespace-nowrap">
                          Rs. {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    {expenditureItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-4 px-2.5 text-center text-slate-400 italic">No expenditures logged in this period.</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-rose-900 text-white font-bold border-t-2 border-rose-950 text-[11px]">
                      <td colSpan={4} className="py-2 px-2.5 uppercase font-mono tracking-wider">
                        Total Approved Expenditure
                      </td>
                      <td className="py-2 px-2.5 text-right text-rose-300 font-black whitespace-nowrap">
                        Rs. {totalExpenditureAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 3. SUMMARY TABLE */}
            <div className="space-y-2 break-inside-avoid border-2 border-slate-900 rounded-xl p-4 bg-slate-50/90 font-mono">
              <div className="flex justify-between items-center border-b border-slate-300 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  3. Account Summary Matrix (Liquid Accounts)
                </h3>
                <span className="text-[10px] font-bold text-slate-600">
                  Period: {fromDate} to {toDate}
                </span>
              </div>

              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-200/80 border-b border-slate-300 text-[10px] font-bold text-slate-700 uppercase">
                    <th className="py-1.5 px-2.5 w-10 text-center">S.N.</th>
                    <th className="py-1.5 px-2.5 uppercase w-28">Account</th>
                    <th className="py-1.5 px-2.5 text-right text-emerald-800">Income (a)</th>
                    <th className="py-1.5 px-2.5 text-right text-rose-800">Expenditure (b)</th>
                    <th className="py-1.5 px-2.5 text-right font-bold text-slate-900">Current Amount (a - b)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {summaryRows.map(row => (
                    <tr key={`sum-${row.account}`}>
                      <td className="py-1.5 px-2.5 text-center text-slate-500">{row.sn}</td>
                      <td className="py-1.5 px-2.5 font-bold uppercase">{row.account}</td>
                      <td className="py-1.5 px-2.5 text-right text-emerald-700">
                        {row.account} opening {row.opening.toLocaleString()} + bill {row.billIncome.toLocaleString()} = <span className="font-bold">Rs. {row.totalIncomeA.toLocaleString()}</span>
                      </td>
                      <td className="py-1.5 px-2.5 text-right text-rose-700">
                        {row.account} expenses Rs. {row.totalExpB.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-black text-slate-900 text-xs">
                        Rs. {row.currentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-bold text-xs">
                    <td colSpan={2} className="py-2 px-2.5 uppercase">Total Liquid Accounts</td>
                    <td className="py-2 px-2.5 text-right text-emerald-300">Rs. {totalSummaryIncomeA.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 px-2.5 text-right text-rose-300">Rs. {totalSummaryExpB.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 px-2.5 text-right font-black text-amber-300 whitespace-nowrap">
                      total current balance = Rs. {totalCurrentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* DUES & OVERALL FINANCIAL POSITION SUMMARY */}
              <div className="mt-3 bg-slate-900 text-white p-4 rounded-lg space-y-2.5 font-mono text-xs border border-slate-800">
                <div className="text-xs font-black text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-1.5 flex justify-between items-center">
                  <span>Balance & Dues Audit Statement</span>
                  <span className="text-[10px] text-emerald-400 font-sans">Real-Time Settings Opening Sync</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-[11px]">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center bg-slate-800/90 px-3 py-2 rounded border border-slate-700">
                      <span className="text-slate-300 font-bold uppercase">total current balance =</span>
                      <span className="text-emerald-400 font-black text-xs">Rs. {totalCurrentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-800/90 px-3 py-2 rounded border border-slate-700">
                      <span className="text-slate-300 font-bold uppercase">due to be collected =</span>
                      <span className="text-amber-400 font-black text-xs">Rs. {dueToBeCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center bg-slate-800/90 px-3 py-2 rounded border border-slate-700">
                      <span className="text-slate-300 font-bold uppercase">due to be paid =</span>
                      <span className="text-rose-400 font-black text-xs">Rs. {dueToBePaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center bg-indigo-950 px-3 py-2 rounded border border-indigo-500/60 shadow-xs">
                      <span className="text-indigo-200 font-extrabold uppercase">total =</span>
                      <span className="text-emerald-300 font-black text-sm">Rs. {netTotalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Prepared By & Approved By Signatures (Can be approved by ANY admin) */}
            <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs font-mono break-inside-avoid">
              <div>
                <div className="border-b border-slate-400 h-10 w-48 mx-auto mb-2"></div>
                <span className="font-bold block text-slate-900">{currentUser.name}</span>
                <span className="text-[10px] text-slate-500">Prepared By (Finance / Operations Incharge)</span>
              </div>
              <div>
                <div className="border-b border-slate-400 h-10 w-48 mx-auto mb-2"></div>
                <span className="font-bold block text-emerald-900">{approvingAdmin}</span>
                <span className="text-[10px] text-slate-500">Approved & Certified (Admin)</span>
              </div>
            </div>
          </div>
        );

        window.openUniversalPrintPreview({
          documentType: 'Report',
          documentNumber: `INC-EXP-${fromDate.replace(/\//g, '')}-${toDate.replace(/\//g, '')}`,
          documentDate: getCurrentBsDate(),
          profile: profile,
          title: reportTitle,
          subject: `Income and Expenditure Account Statement (${fromDate} to ${toDate})`,
          items: reportItems,
          customComponent: customComponent,
          grandTotal: grandTotalVal,
          notes: `Official Income and Expenditure Account statement generated on ${getCurrentBsDate()} by ${currentUser.name} (${currentUser.role}). Incorporates opening balances from Settings tab and synchronized account ledgers. Approved by ${approvingAdmin}.`,
          preparedBy: currentUser.name,
          approvedBy: approvingAdmin
        });
        return;
      } else if (reportType === 'account_ledger' || reportType === 'ledger') {
        reportTitle = 'Multi-Account Balance Ledger Statement (Sequential Master Audit)';
        
        const approvingAdmin = currentUser.role === 'Admin' 
          ? `${currentUser.name} (Admin)` 
          : (profile?.ownerName ? `${profile.ownerName} (Admin)` : 'Authorized Admin');
        
        // 5 Accounts in explicit user requested order: Cash, RBB, eSewa, Sahakari, Credit Due
        const accountConfigs: { key: 'CASH' | 'RBB' | 'ESEWA' | 'SAHAKARI' | 'DUE'; name: string; subtitle: string; bucket: string; themeColor: string }[] = [
          { key: 'CASH', name: '1. Physical Cash in Hand', subtitle: 'Cash Drawer Ledger', bucket: 'CASH', themeColor: 'bg-emerald-800 text-white' },
          { key: 'RBB', name: '2. Rastriya Banijya Bank', subtitle: 'RBB Current Account Ledger', bucket: 'RBB', themeColor: 'bg-blue-800 text-white' },
          { key: 'ESEWA', name: '3. eSewa Digital Wallet', subtitle: 'eSewa Merchant / Wallet Ledger', bucket: 'ESEWA', themeColor: 'bg-teal-900 text-white' },
          { key: 'SAHAKARI', name: '4. Sahakari Cooperative', subtitle: 'Sahakari Savings & Deposit Ledger', bucket: 'SAHAKARI', themeColor: 'bg-amber-900 text-white' },
          { key: 'DUE', name: '5. Customer Credit Due Ledger', subtitle: 'Customer Receivables & Outstanding Dues', bucket: 'DUE', themeColor: 'bg-indigo-900 text-white' }
        ];

        const accountLedgers = accountConfigs.map(acc => {
          const res = getAccountLedger(acc.key, toDate);
          const periodLedger = (res?.ledger || []).filter(e => isWithinPeriod(e.date));
          const totalIn = periodLedger.filter(e => e.type === 'In').reduce((sum, e) => sum + e.amount, 0);
          const totalOut = periodLedger.filter(e => e.type === 'Out').reduce((sum, e) => sum + e.amount, 0);
          return {
            ...acc,
            ledger: periodLedger,
            totalIn,
            totalOut,
            closingBalance: res?.finalBalance || 0
          };
        });

        const totalInflowsAll = accountLedgers.reduce((sum, a) => sum + a.totalIn, 0);
        const totalOutflowsAll = accountLedgers.reduce((sum, a) => sum + a.totalOut, 0);
        const cashBal = accountLedgers.find(a => a.key === 'CASH')?.closingBalance || 0;
        const rbbBal = accountLedgers.find(a => a.key === 'RBB')?.closingBalance || 0;
        const esewaBal = accountLedgers.find(a => a.key === 'ESEWA')?.closingBalance || 0;
        const sahakariBal = accountLedgers.find(a => a.key === 'SAHAKARI')?.closingBalance || 0;
        const dueBal = accountLedgers.find(a => a.key === 'DUE')?.closingBalance || 0;
        const totalLiquidCash = cashBal + rbbBal + esewaBal + sahakariBal;
        const totalEcosystemBalance = totalLiquidCash + dueBal;

        reportItems = accountLedgers.map((acc, idx) => ({
          sn: idx + 1,
          name: `${acc.name} (${acc.subtitle}) - Closing Balance`,
          quantity: acc.ledger.length,
          unitPrice: acc.closingBalance,
          totalPrice: acc.closingBalance,
          remarks: `Inflows: Rs. ${acc.totalIn.toLocaleString()} | Outflows: Rs. ${acc.totalOut.toLocaleString()}`
        }));
        grandTotalVal = totalEcosystemBalance;

        const customComponent = (
          <div className="p-4 space-y-6 text-slate-900 font-sans text-xs">
            {/* Header Title */}
            <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                Multi-Account Balance Ledger (Sequential Audit Report)
              </h2>
              <p className="text-[11px] font-mono font-bold text-slate-600">
                Audit Period: {fromDate} to {toDate} | Generated on: {getCurrentBsDate()}
              </p>
            </div>

            {/* Account Wise Detailed Transactions: 1 after another in table */}
            <div className="space-y-6">
              {accountLedgers.map((acc) => (
                <div key={acc.key} className="space-y-1.5 break-inside-avoid border border-slate-300 rounded-lg overflow-hidden bg-white">
                  <div className={`px-3 py-2 ${acc.themeColor} flex justify-between items-center text-xs font-mono font-bold`}>
                    <div className="flex items-center gap-2">
                      <span className="uppercase">{acc.name}</span>
                      <span className="text-[10px] opacity-80 font-normal">({acc.subtitle})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] opacity-80 mr-1.5 font-normal">Closing Balance:</span>
                      <span className="text-xs font-black">Rs. {acc.closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold text-slate-700 uppercase">
                          <th className="py-1.5 px-2.5 w-10 text-center">S.N.</th>
                          <th className="py-1.5 px-2.5 w-24">Date</th>
                          <th className="py-1.5 px-2.5 w-28">Ref / Voucher</th>
                          <th className="py-1.5 px-2.5">Particulars / Source Details</th>
                          <th className="py-1.5 px-2.5 text-right text-emerald-700 w-28">Deposits (In)</th>
                          <th className="py-1.5 px-2.5 text-right text-rose-600 w-28">Withdrawals (Out)</th>
                          <th className="py-1.5 px-2.5 text-right w-32">Running Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-[11px]">
                        {acc.ledger.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-3 px-2.5 text-center text-slate-400 italic">
                              No transactions recorded for {acc.name} between {fromDate} and {toDate}.
                            </td>
                          </tr>
                        ) : (
                          acc.ledger.map((row, rIdx) => (
                            <tr key={row.id || `${acc.key}-${rIdx}`} className="hover:bg-slate-50">
                              <td className="py-1.5 px-2.5 text-center text-slate-500 text-[10px]">{rIdx + 1}</td>
                              <td className="py-1.5 px-2.5 whitespace-nowrap text-slate-700">{row.date}</td>
                              <td className="py-1.5 px-2.5 font-bold text-slate-800 whitespace-nowrap uppercase">
                                {row.reference?.toLowerCase().startsWith('tx-') ? (() => {
                                  const cleanId = row.reference.toLowerCase();
                                  const matchedTx = transactions.find(t => t.id.toLowerCase() === cleanId || cleanId.includes(t.id.toLowerCase()));
                                  return matchedTx ? getFormattedPoNumber(matchedTx, transactions) : row.reference;
                                })() : row.reference}
                              </td>
                              <td className="py-1.5 px-2.5 text-slate-900 font-sans">{row.description}</td>
                              <td className="py-1.5 px-2.5 text-right font-bold text-emerald-700 whitespace-nowrap">
                                {row.type === 'In' ? `Rs. ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-bold text-rose-600 whitespace-nowrap">
                                {row.type === 'Out' ? `Rs. ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-black text-slate-900 whitespace-nowrap">
                                Rs. {row.runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-[11px] text-slate-900">
                          <td colSpan={4} className="py-2 px-2.5 uppercase font-mono">
                            {acc.name} Subtotal ({acc.ledger.length} Records)
                          </td>
                          <td className="py-2 px-2.5 text-right text-emerald-700 font-black whitespace-nowrap">
                            Rs. {acc.totalIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-2.5 text-right text-rose-700 font-black whitespace-nowrap">
                            Rs. {acc.totalOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-2.5 text-right font-black text-slate-950 whitespace-nowrap">
                            Rs. {acc.closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* Total of all account section */}
            <div className="space-y-2 break-inside-avoid border-2 border-slate-900 rounded-xl p-4 bg-slate-50/90 font-mono">
              <div className="flex justify-between items-center border-b border-slate-300 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  TOTAL OF ALL ACCOUNTS (ECOSYSTEM RECONCILIATION SUMMARY)
                </h3>
                <span className="text-[10px] font-bold text-slate-600">
                  Period: {fromDate} to {toDate}
                </span>
              </div>

              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-200/80 border-b border-slate-300 text-[10px] font-bold text-slate-700 uppercase">
                    <th className="py-1.5 px-3">Account Category</th>
                    <th className="py-1.5 px-3 text-center">Bucket</th>
                    <th className="py-1.5 px-3 text-right text-emerald-800">Inflows in Period</th>
                    <th className="py-1.5 px-3 text-right text-rose-800">Outflows in Period</th>
                    <th className="py-1.5 px-3 text-right font-bold">Closing Balance ({toDate})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  <tr>
                    <td className="py-1.5 px-3 font-bold">1. Physical Cash in Hand</td>
                    <td className="py-1.5 px-3 text-center text-slate-500">CASH</td>
                    <td className="py-1.5 px-3 text-right text-emerald-700">Rs. {accountLedgers[0].totalIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-1.5 px-3 text-right text-rose-700">Rs. {accountLedgers[0].totalOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-1.5 px-3 text-right font-black">Rs. {cashBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-bold">2. Rastriya Banijya Bank Current</td>
                    <td className="py-1.5 px-3 text-center text-slate-500">RBB</td>
                    <td className="py-1.5 px-3 text-right text-emerald-700">Rs. {accountLedgers[1].totalIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-1.5 px-3 text-right text-rose-700">Rs. {accountLedgers[1].totalOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-1.5 px-3 text-right font-black">Rs. {rbbBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-bold">3. eSewa Digital Wallet</td>
                    <td className="py-1.5 px-3 text-center text-slate-500">ESEWA</td>
                    <td className="py-1.5 px-3 text-right text-emerald-700">Rs. {accountLedgers[2].totalIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-1.5 px-3 text-right text-rose-700">Rs. {accountLedgers[2].totalOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-1.5 px-3 text-right font-black">Rs. {esewaBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-bold">4. Sahakari Cooperative Savings</td>
                    <td className="py-1.5 px-3 text-center text-slate-500">SAHAKARI</td>
                    <td className="py-1.5 px-3 text-right text-emerald-700">Rs. {accountLedgers[3].totalIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-1.5 px-3 text-right text-rose-700">Rs. {accountLedgers[3].totalOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-1.5 px-3 text-right font-black">Rs. {sahakariBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-bold text-indigo-900">5. Customer Credit Due (Receivables)</td>
                    <td className="py-1.5 px-3 text-center text-slate-500">DUE</td>
                    <td className="py-1.5 px-3 text-right text-emerald-700">Rs. {accountLedgers[4].totalIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-1.5 px-3 text-right text-rose-700">Rs. {accountLedgers[4].totalOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-1.5 px-3 text-right font-black text-indigo-900">Rs. {dueBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-slate-200 font-bold text-slate-900 border-t-2 border-slate-400 text-xs">
                    <td colSpan={2} className="py-2 px-3 uppercase">Total Liquid Cash & Bank Reserves (1 - 4)</td>
                    <td className="py-2 px-3 text-right text-emerald-800">
                      Rs. {(accountLedgers[0].totalIn + accountLedgers[1].totalIn + accountLedgers[2].totalIn + accountLedgers[3].totalIn).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 text-right text-rose-800">
                      Rs. {(accountLedgers[0].totalOut + accountLedgers[1].totalOut + accountLedgers[2].totalOut + accountLedgers[3].totalOut).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 text-right font-black text-emerald-900">
                      Rs. {totalLiquidCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="bg-slate-900 text-white font-black border-t-2 border-slate-950 text-xs">
                    <td colSpan={2} className="py-2 px-3 uppercase">Grand Total of All 5 Accounts (Ecosystem Position)</td>
                    <td className="py-2 px-3 text-right text-emerald-300">
                      Rs. {totalInflowsAll.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 text-right text-rose-300">
                      Rs. {totalOutflowsAll.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 text-right font-black text-amber-300">
                      Rs. {totalEcosystemBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Prepared By   Approved By Signatures (Can be approved by ANY admin) */}
            <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs font-mono break-inside-avoid">
              <div>
                <div className="border-b border-slate-400 h-10 w-48 mx-auto mb-2"></div>
                <span className="font-bold block text-slate-900">{currentUser.name}</span>
                <span className="text-[10px] text-slate-500">Prepared By (Finance / Operations Incharge)</span>
              </div>
              <div>
                <div className="border-b border-slate-400 h-10 w-48 mx-auto mb-2"></div>
                <span className="font-bold block text-emerald-900">{approvingAdmin}</span>
                <span className="text-[10px] text-slate-500">Approved & Certified (Admin)</span>
              </div>
            </div>
          </div>
        );

        window.openUniversalPrintPreview({
          documentType: 'Report',
          documentNumber: `LEDGER-${fromDate.replace(/\//g, '')}-${toDate.replace(/\//g, '')}`,
          documentDate: getCurrentBsDate(),
          profile: profile,
          title: reportTitle,
          subject: `Multi-Account Audit Period: ${fromDate} to ${toDate}`,
          items: reportItems,
          customComponent: customComponent,
          grandTotal: grandTotalVal,
          notes: `Multi-Account Ledger Report generated on ${getCurrentBsDate()} by ${currentUser.name} (${currentUser.role}). All account transactions sequenced sequentially. Approved by ${approvingAdmin}.`,
          preparedBy: currentUser.name,
          approvedBy: approvingAdmin
        });
        return;
      } else if (reportType === 'office_use') {
        reportTitle = 'Request for Office Use Log (Internal Requisitions)';
        const filteredReqs = officeUseRequests.filter(r => isWithinPeriod(r.date));
        reportItems = filteredReqs.slice(0, 50).map((r, idx) => ({
          sn: idx + 1,
          name: `${r.itemName} (${r.requestNo}) - Req by: ${r.requestedBy} (${r.department || 'Office'})`,
          quantity: r.quantity,
          unitPrice: r.totalCost && r.quantity ? r.totalCost / r.quantity : 0,
          totalPrice: r.totalCost || 0,
          remarks: `Status: ${r.status}${r.approvedBy ? ` (Approved By: ${r.approvedBy})` : ''}`
        }));
        grandTotalVal = filteredReqs.reduce((acc, r) => acc + (r.totalCost || 0), 0);
      } else if (reportType === 'account_summary') {
        reportTitle = 'Current Situation, Financial Statements & Account Balances';
        
        // Income Statement
        const grossRevenue = totalBilledIncome;
        const poExpensesVal = filteredExpenses.filter(e => e.category === 'Purchase Order').reduce((sum, e) => sum + e.amount, 0);
        const officeSuppliesVal = filteredExpenses.filter(e => e.category === 'Office Supplies').reduce((sum, e) => sum + e.amount, 0);
        const poTransactionsVal = transactions
          .filter(tx => tx.status !== 'Rejected' && tx.status !== 'Ordered' && isWithinPeriod(tx.date))
          .reduce((sum, tx) => sum + (tx.amountPaid + tx.amountDue), 0);
        const finalCOGS = poExpensesVal > 0 ? (poExpensesVal + officeSuppliesVal) : (poTransactionsVal + officeSuppliesVal);
        const grossProfitVal = grossRevenue - finalCOGS;
        const rentOPEX = filteredExpenses.filter(e => e.category === 'Rent').reduce((sum, e) => sum + e.amount, 0);
        const salaryOPEX = filteredExpenses.filter(e => e.category === 'Salary').reduce((sum, e) => sum + e.amount, 0);
        const shareholderVal = filteredExpenses.filter(e => e.category === 'Shareholder Payout').reduce((sum, e) => sum + e.amount, 0);
        const utilitiesVal = filteredExpenses.filter(e => e.category === 'Utilities' || e.category === 'Maintenance').reduce((sum, e) => sum + e.amount, 0);
        const otherExpensesVal = filteredExpenses.filter(e => e.category === 'Others').reduce((sum, e) => sum + e.amount, 0);
        const totalOPEX = rentOPEX + salaryOPEX + shareholderVal + utilitiesVal + otherExpensesVal;
        const netOperatingProfit = grossProfitVal - totalOPEX;

        // Account Balances
        const cashBal = getAccountLedger('CASH', toDate).finalBalance;
        const rbbBal = getAccountLedger('RBB', toDate).finalBalance;
        const esewaBal = getAccountLedger('ESEWA', toDate).finalBalance;
        const sahakariBal = getAccountLedger('SAHAKARI', toDate).finalBalance;
        const dueBal = getAccountLedger('DUE', toDate).finalBalance;
        const totalCashBalances = cashBal + rbbBal + esewaBal + sahakariBal;

        const liveCash = getAccountLedger('CASH', '9999/12/31').finalBalance;
        const liveRbb = getAccountLedger('RBB', '9999/12/31').finalBalance;
        const liveEsewa = getAccountLedger('ESEWA', '9999/12/31').finalBalance;
        const liveSahakari = getAccountLedger('SAHAKARI', '9999/12/31').finalBalance;
        const liveDue = getAccountLedger('DUE', '9999/12/31').finalBalance;
        const liveTotalCash = liveCash + liveRbb + liveEsewa + liveSahakari;

        // Balance Sheet
        const accountsReceivable = invoices.filter(inv => inv.date <= toDate).reduce((sum, inv) => sum + inv.dueAmount, 0);
        const inventoryValuationVal = inventoryStock.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0);
        const fixedAssetsVal = (assets || []).filter(a => a.status === 'Active' && a.purchaseDate <= toDate).reduce((sum, a) => sum + (a.costPrice * a.quantity), 0);
        const totalAssetsVal = totalCashBalances + accountsReceivable + inventoryValuationVal + fixedAssetsVal;
        const accountsPayable = transactions.filter(tx => tx.status !== 'Rejected' && tx.status !== 'Ordered' && tx.date <= toDate).reduce((sum, tx) => sum + tx.amountDue, 0);
        const initialCapitalVal = (openingBalances?.CASH?.openingBalance || 0) + (openingBalances?.ESEWA?.openingBalance || 0) + (openingBalances?.SAHAKARI?.openingBalance || 0) + (openingBalances?.RBB?.openingBalance || 0);
        const cumulativeRevenue = invoices.filter(inv => inv.date <= toDate).reduce((sum, inv) => sum + inv.finalAmount, 0);
        const cumulativeExpenses = expenses.filter(exp => exp.status === 'Approved' && exp.date <= toDate).reduce((sum, exp) => sum + exp.amount, 0);
        const retainedEarningsVal = cumulativeRevenue - cumulativeExpenses;

        // Cash Flow
        const getAccountBalanceBeforePeriod = (accKey: 'RBB' | 'ESEWA' | 'SAHAKARI' | 'CASH') => {
          const fullLedger = getAccountLedger(accKey, toDate).ledger;
          const entriesBefore = fullLedger.filter(e => e.date < fromDate);
          if (entriesBefore.length === 0) return 0;
          return entriesBefore[entriesBefore.length - 1].runningBalance;
        };
        const openingCash = getAccountBalanceBeforePeriod('CASH') + getAccountBalanceBeforePeriod('ESEWA') + getAccountBalanceBeforePeriod('SAHAKARI') + getAccountBalanceBeforePeriod('RBB');
        const closingCash = totalCashBalances;

        let totalCashInflow = 0;
        let totalCashOutflow = 0;
        (['CASH', 'ESEWA', 'SAHAKARI', 'RBB'] as const).forEach(acc => {
          const ledgerData = getAccountLedger(acc, toDate).ledger;
          const periodEntries = ledgerData.filter(e => e.date >= fromDate && e.date <= toDate);
          periodEntries.forEach(e => {
            if (e.description.startsWith('Inter-Account Transfer')) return;
            if (e.description.startsWith('Cash Withdrawal') && e.reference === 'OP-BAL') return;
            if (e.type === 'In') {
              if (e.description !== 'Initial Opening Balance (System Setup)') {
                totalCashInflow += e.amount;
              }
            } else {
              totalCashOutflow += e.amount;
            }
          });
        });
        const netCashFlowVal = totalCashInflow - totalCashOutflow;

        // Executive Summary Texts
        const netProfitPct = grossRevenue > 0 ? (netOperatingProfit / grossRevenue) * 100 : 0;
        const simpleProfitStatus = netOperatingProfit > 0 
          ? `Profit: Made Rs. ${netOperatingProfit.toLocaleString()} profit on total sales of Rs. ${grossRevenue.toLocaleString()} (${netProfitPct.toFixed(1)}% margin).`
          : netOperatingProfit < 0 
          ? `Loss: Operational loss of Rs. ${Math.abs(netOperatingProfit).toLocaleString()} on total sales of Rs. ${grossRevenue.toLocaleString()}.`
          : `Break-Even: Total sales were Rs. ${grossRevenue.toLocaleString()} and net profit was Rs. 0.`;

        const simpleCashStatus = `Cash Movement: Inflow Rs. ${totalCashInflow.toLocaleString()} | Outflow Rs. ${totalCashOutflow.toLocaleString()} (Net change: ${netCashFlowVal >= 0 ? '+' : ''}Rs. ${netCashFlowVal.toLocaleString()}). Opening: Rs. ${openingCash.toLocaleString()} -> Closing: Rs. ${closingCash.toLocaleString()}.`;

        const simpleAssetsStatus = `Total Business Wealth (Assets): Rs. ${totalAssetsVal.toLocaleString()} (Includes stock Rs. ${inventoryValuationVal.toLocaleString()} and cash Rs. ${closingCash.toLocaleString()}).`;

        const simpleDebtsStatus = accountsPayable > 0 
          ? (totalCashBalances >= accountsPayable 
            ? `Supplier Debts: Owe Rs. ${accountsPayable.toLocaleString()} to suppliers. Covered by liquid cash Rs. ${totalCashBalances.toLocaleString()}.` 
            : `Supplier Debts Alert: Owe Rs. ${accountsPayable.toLocaleString()} to suppliers vs liquid cash Rs. ${totalCashBalances.toLocaleString()} (Shortfall: Rs. ${(accountsPayable - totalCashBalances).toLocaleString()}).`) 
          : `Supplier Debts: Zero debt!`;

        reportItems = [
          { sn: '1', name: '1. Income Statement - Gross Billed Sales Revenue', quantity: 1, totalPrice: grossRevenue },
          { sn: '2', name: '1. Income Statement - Cost of Goods Sold (COGS)', quantity: 1, totalPrice: -finalCOGS },
          { sn: '3', name: '1. Income Statement - Net Operating Profit', quantity: 1, totalPrice: netOperatingProfit },
          { sn: '4', name: '2. Expense Statement - Total Approved Expenditures', quantity: 1, totalPrice: totalExpenditure },
          { sn: '5', name: '3. Balance Sheet - Total Assets', quantity: 1, totalPrice: totalAssetsVal },
          { sn: '6', name: '3. Balance Sheet - Total Liabilities & Equity', quantity: 1, totalPrice: totalAssetsVal },
          { sn: '7', name: '4. Cash Flow - Net Period Cash Flow', quantity: 1, totalPrice: netCashFlowVal },
          { sn: '8', name: '5. Current Account Balances - Cash Drawer (CASH)', quantity: 1, totalPrice: cashBal },
          { sn: '9', name: '5. Current Account Balances - Banijya Bank (RBB)', quantity: 1, totalPrice: rbbBal },
          { sn: '10', name: '5. Current Account Balances - eSewa Wallet (ESEWA)', quantity: 1, totalPrice: esewaBal },
          { sn: '11', name: '5. Current Account Balances - Sahakari Savings (SAHAKARI)', quantity: 1, totalPrice: sahakariBal },
          { sn: '12', name: '5. Current Account Balances - Total Liquid Cash', quantity: 1, totalPrice: totalCashBalances }
        ];
        grandTotalVal = totalCashBalances;

        const customComponent = (
          <div className="p-4 space-y-5 text-slate-900 font-sans text-xs">
            {/* Header Title */}
            <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                Current Situation, Complete Financial Statements & Account Balances
              </h2>
              <p className="text-[11px] font-mono font-bold text-slate-600">
                Audit Period: {fromDate} to {toDate} | Generated on: {getCurrentBsDate()}
              </p>
            </div>

            {/* Current Situation & Financial Health Overview */}
            <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/80 space-y-2.5">
              <h3 className="font-extrabold text-xs uppercase font-mono text-slate-800 border-b border-slate-200 pb-1 flex items-center justify-between">
                <span>Current Situation & Financial Health Overview</span>
                <span className="text-[10px] text-slate-500 font-normal">Executive Summary</span>
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2 border border-slate-200 rounded bg-white space-y-0.5">
                  <strong className="text-slate-900 block font-mono text-[10px] uppercase text-sky-700">📈 Profit & Loss:</strong>
                  <p className="text-[11px] leading-snug font-medium text-slate-800">{simpleProfitStatus}</p>
                </div>
                <div className="p-2 border border-slate-200 rounded bg-white space-y-0.5">
                  <strong className="text-slate-900 block font-mono text-[10px] uppercase text-indigo-700">💵 Cash Movement:</strong>
                  <p className="text-[11px] leading-snug font-medium text-slate-800">{simpleCashStatus}</p>
                </div>
                <div className="p-2 border border-slate-200 rounded bg-white space-y-0.5">
                  <strong className="text-slate-900 block font-mono text-[10px] uppercase text-purple-700">📦 Business Wealth & Stock:</strong>
                  <p className="text-[11px] leading-snug font-medium text-slate-800">{simpleAssetsStatus}</p>
                </div>
                <div className={`p-2 border rounded space-y-0.5 ${accountsPayable > 0 && totalCashBalances < accountsPayable ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-white border-slate-200 text-slate-800'}`}>
                  <strong className="block font-mono text-[10px] uppercase font-bold text-rose-700">🚨 Supplier Debts & Action Plan:</strong>
                  <p className="text-[11px] leading-snug font-medium">{simpleDebtsStatus}</p>
                </div>
              </div>
            </div>

            {/* Section 1 & Section 2: Income Statement & Expense Statement */}
            <div className="grid grid-cols-2 gap-3">
              {/* 1. Income Statement */}
              <div className="border border-slate-300 rounded-xl p-3 space-y-2 bg-white">
                <h3 className="font-black text-xs font-mono uppercase border-b border-slate-200 pb-1 text-slate-900">
                  1. Income Statement
                </h3>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between py-0.5"><span>Gross Billed Sales Revenue</span><span className="font-mono font-bold">Rs. {grossRevenue.toLocaleString()}</span></div>
                  <div className="flex justify-between py-0.5 text-slate-600"><span>Cost of Goods Sold (COGS)</span><span className="font-mono">Rs. {finalCOGS.toLocaleString()}</span></div>
                  <div className="flex justify-between py-1 font-bold border-t border-slate-200 bg-slate-50 px-1 rounded"><span>Gross Profit</span><span className="font-mono">Rs. {grossProfitVal.toLocaleString()}</span></div>
                  <div className="flex justify-between py-0.5 text-slate-600"><span>Operating Expenses (OPEX)</span><span className="font-mono">Rs. {totalOPEX.toLocaleString()}</span></div>
                  <div className="flex justify-between py-1 font-extrabold text-xs border-t-2 border-slate-900 bg-indigo-50/60 px-1 rounded text-indigo-950">
                    <span>Net Operating Profit</span>
                    <span className="font-mono">Rs. {netOperatingProfit.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 2. Expense Statement */}
              <div className="border border-slate-300 rounded-xl p-3 space-y-2 bg-white">
                <h3 className="font-black text-xs font-mono uppercase border-b border-slate-200 pb-1 text-slate-900 flex justify-between">
                  <span>2. Expense Statement</span>
                  <span className="text-[10px] text-slate-500 font-normal">{filteredExpenses.length} Records</span>
                </h3>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between py-0.5"><span>Rent & Facility Leases</span><span className="font-mono">Rs. {rentOPEX.toLocaleString()}</span></div>
                  <div className="flex justify-between py-0.5"><span>Staff Salaries & Wages</span><span className="font-mono">Rs. {salaryOPEX.toLocaleString()}</span></div>
                  <div className="flex justify-between py-0.5"><span>Purchase Orders & Restock</span><span className="font-mono">Rs. {(poExpensesVal > 0 ? poExpensesVal : poTransactionsVal).toLocaleString()}</span></div>
                  <div className="flex justify-between py-0.5"><span>Office Supplies & Tools</span><span className="font-mono">Rs. {officeSuppliesVal.toLocaleString()}</span></div>
                  <div className="flex justify-between py-0.5"><span>Utilities & Maintenance</span><span className="font-mono">Rs. {utilitiesVal.toLocaleString()}</span></div>
                  <div className="flex justify-between py-0.5"><span>Shareholder Payouts & Misc</span><span className="font-mono">Rs. {(shareholderVal + otherExpensesVal).toLocaleString()}</span></div>
                  <div className="flex justify-between py-1 font-extrabold text-xs border-t-2 border-slate-900 bg-rose-50/60 px-1 rounded text-rose-950">
                    <span>Total Approved Expenses</span>
                    <span className="font-mono">Rs. {totalExpenditure.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 & Section 4: Balance Sheet & Cash Flow Statement */}
            <div className="grid grid-cols-2 gap-3">
              {/* 3. Balance Sheet */}
              <div className="border border-slate-300 rounded-xl p-3 space-y-2 bg-white">
                <h3 className="font-black text-xs font-mono uppercase border-b border-slate-200 pb-1 text-slate-900">
                  3. Balance Sheet
                </h3>
                <div className="space-y-1 text-[11px]">
                  <div className="font-bold text-[10px] uppercase font-mono text-indigo-800 border-b border-indigo-100 pb-0.5">Assets</div>
                  <div className="flex justify-between py-0.5"><span>Liquid Cash & Bank</span><span className="font-mono">Rs. {totalCashBalances.toLocaleString()}</span></div>
                  <div className="flex justify-between py-0.5"><span>Accounts Receivable (Dues)</span><span className="font-mono">Rs. {accountsReceivable.toLocaleString()}</span></div>
                  <div className="flex justify-between py-0.5"><span>Inventory Valuation</span><span className="font-mono">Rs. {inventoryValuationVal.toLocaleString()}</span></div>
                  <div className="flex justify-between py-0.5"><span>Fixed Corporate Assets</span><span className="font-mono">Rs. {fixedAssetsVal.toLocaleString()}</span></div>
                  <div className="flex justify-between py-1 font-bold border-t border-slate-200 bg-slate-50 px-1 rounded"><span>Total Assets</span><span className="font-mono">Rs. {totalAssetsVal.toLocaleString()}</span></div>

                  <div className="font-bold text-[10px] uppercase font-mono text-slate-700 border-b border-slate-200 pb-0.5 pt-1">Liabilities & Equity</div>
                  <div className="flex justify-between py-0.5"><span>Supplier Accounts Payable</span><span className="font-mono">Rs. {accountsPayable.toLocaleString()}</span></div>
                  <div className="flex justify-between py-0.5"><span>Paid-in Owner Capital</span><span className="font-mono">Rs. {initialCapitalVal.toLocaleString()}</span></div>
                  <div className="flex justify-between py-0.5"><span>Retained Earnings</span><span className="font-mono">Rs. {retainedEarningsVal.toLocaleString()}</span></div>
                  <div className="flex justify-between py-1 font-bold border-t border-slate-200 bg-slate-50 px-1 rounded"><span>Total Liabilities & Equity</span><span className="font-mono">Rs. {totalAssetsVal.toLocaleString()}</span></div>
                </div>
              </div>

              {/* 4. Cash Flow Statement */}
              <div className="border border-slate-300 rounded-xl p-3 space-y-2 bg-white">
                <h3 className="font-black text-xs font-mono uppercase border-b border-slate-200 pb-1 text-slate-900">
                  4. Cash Flow Statement
                </h3>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between py-0.5"><span>Operating Cash Receipts (Inflow)</span><span className="font-mono font-bold text-emerald-700">Rs. {totalCashInflow.toLocaleString()}</span></div>
                  <div className="flex justify-between py-0.5"><span>Operating Disbursements (Outflow)</span><span className="font-mono font-bold text-rose-700">Rs. {totalCashOutflow.toLocaleString()}</span></div>
                  <div className="flex justify-between py-1 font-bold border-t border-slate-200 bg-slate-50 px-1 rounded">
                    <span>Net Period Cash Change</span>
                    <span className="font-mono">{netCashFlowVal >= 0 ? '+' : ''}Rs. {netCashFlowVal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-slate-600"><span>Opening Cash ({fromDate})</span><span className="font-mono">Rs. {openingCash.toLocaleString()}</span></div>
                  <div className="flex justify-between py-1 font-extrabold text-xs border-t-2 border-slate-900 bg-indigo-50/60 px-1 rounded text-indigo-950">
                    <span>Closing Cash ({toDate})</span>
                    <span className="font-mono">Rs. {closingCash.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Current Balance in Each Account */}
            <div className="border border-slate-300 rounded-xl p-3 space-y-2 bg-white">
              <h3 className="font-black text-xs font-mono uppercase border-b border-slate-200 pb-1 text-slate-900 flex justify-between items-center">
                <span>5. Current Balance in Each Account</span>
                <span className="text-[10px] text-slate-500 font-normal">Live System Accounts Parity</span>
              </h3>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-100 font-mono text-[10px] text-slate-700">
                    <th className="p-1.5">Account Ledger Name</th>
                    <th className="p-1.5 text-center">Code</th>
                    <th className="p-1.5 text-right">Period Balance ({toDate})</th>
                    <th className="p-1.5 text-right">Live Today Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  <tr>
                    <td className="p-1.5 font-bold">Cash Box / Cash Drawer</td>
                    <td className="p-1.5 text-center font-mono text-slate-500">CASH</td>
                    <td className="p-1.5 text-right font-mono font-bold">Rs. {cashBal.toLocaleString()}</td>
                    <td className="p-1.5 text-right font-mono text-slate-700">Rs. {liveCash.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-bold">Rastriya Banijya Bank</td>
                    <td className="p-1.5 text-center font-mono text-slate-500">RBB</td>
                    <td className="p-1.5 text-right font-mono font-bold">Rs. {rbbBal.toLocaleString()}</td>
                    <td className="p-1.5 text-right font-mono text-slate-700">Rs. {liveRbb.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-bold">eSewa Digital Wallet</td>
                    <td className="p-1.5 text-center font-mono text-slate-500">ESEWA</td>
                    <td className="p-1.5 text-right font-mono font-bold">Rs. {esewaBal.toLocaleString()}</td>
                    <td className="p-1.5 text-right font-mono text-slate-700">Rs. {liveEsewa.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-bold">Sahakari Savings Account</td>
                    <td className="p-1.5 text-center font-mono text-slate-500">SAHAKARI</td>
                    <td className="p-1.5 text-right font-mono font-bold">Rs. {sahakariBal.toLocaleString()}</td>
                    <td className="p-1.5 text-right font-mono text-slate-700">Rs. {liveSahakari.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-bold text-slate-600">Customer Outstanding Credit Dues</td>
                    <td className="p-1.5 text-center font-mono text-slate-500">DUE</td>
                    <td className="p-1.5 text-right font-mono font-bold text-cyan-800">Rs. {dueBal.toLocaleString()}</td>
                    <td className="p-1.5 text-right font-mono text-slate-700">Rs. {liveDue.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-900">
                    <td className="p-1.5 uppercase font-mono text-[10px]" colSpan={2}>Total Combined Liquid Cash & Bank Reserves</td>
                    <td className="p-1.5 text-right font-mono text-xs">Rs. {totalCashBalances.toLocaleString()}</td>
                    <td className="p-1.5 text-right font-mono text-xs text-indigo-900">Rs. {liveTotalCash.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Verification Signatures */}
            <div className="pt-6 flex justify-between items-end text-center text-[11px] text-slate-700">
              <div className="w-36 border-t border-slate-400 pt-1 font-medium">Prepared By</div>
              <div className="w-36 border-t border-slate-400 pt-1 font-medium">Audited By</div>
              <div className="w-36 border-t border-slate-900 pt-1 font-bold">Approved By ({profile?.name || 'Management'})</div>
            </div>
          </div>
        );

        window.openUniversalPrintPreview({
          documentType: 'Report',
          documentNumber: `REP-${fromDate.replace(/\//g, '')}-${toDate.replace(/\//g, '')}`,
          documentDate: getCurrentBsDate(),
          profile: profile,
          title: reportTitle,
          subject: `Audit Period: ${fromDate} to ${toDate}`,
          items: reportItems,
          customComponent: customComponent,
          grandTotal: grandTotalVal,
          notes: `Report generated on ${getCurrentBsDate()} by ${currentUser.name} (${currentUser.role}). Official Audit Record.`,
          preparedBy: currentUser.name,
          approvedBy: `${profile?.name || 'Authorized'} Management`
        });
        return;
      } else {
        reportTitle = 'Financial & Operational Audit Summary';
        reportItems = [
          { sn: 1, name: 'Total Billed Revenue', quantity: 1, totalPrice: totalBilledIncome },
          { sn: 2, name: 'Total Operating Expenses', quantity: 1, totalPrice: totalExpenditure },
          { sn: 3, name: 'Net Cash Profit', quantity: 1, totalPrice: cashProfit }
        ];
        grandTotalVal = cashProfit;
      }

      window.openUniversalPrintPreview({
        documentType: 'Report',
        documentNumber: `REP-${fromDate.replace(/\//g, '')}-${toDate.replace(/\//g, '')}`,
        documentDate: getCurrentBsDate(),
        profile: profile,
        title: reportTitle,
        subject: `Audit Period: ${fromDate} to ${toDate}`,
        items: reportItems,
        grandTotal: grandTotalVal,
        notes: `Report generated on ${getCurrentBsDate()} by ${currentUser.name} (${currentUser.role}). Official Audit Record.`,
        preparedBy: currentUser.name,
        approvedBy: `${profile?.name || 'Authorized'} Management`
      });
    } else {
      window.print();
    }
  };

  // Pagination helpers
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  // Normalization helper
  const normalizeAccount = (acc: string): 'RBB' | 'SAHAKARI' | 'ESEWA' | 'CASH' | 'DUE' | null => {
    if (!acc) return null;
    const upper = acc.toUpperCase().trim();
    if (upper === 'CASH' || upper === 'CASH IN HAND') return 'CASH';
    if (upper === 'ESEWA' || upper === 'E-SEWA' || upper === 'E-SEWA WALLET') return 'ESEWA';
    if (upper === 'SAHAKARI' || upper === 'SAHAKARI COOPERATIVE' || upper === 'COOPERATIVE') return 'SAHAKARI';
    if (upper === 'RBB' || upper === 'BANK' || upper === 'BANK TRANSFER' || upper === 'RASTRIYA BANIJYA BANK') return 'RBB';
    if (upper === 'DUE' || upper === 'DUES' || upper === 'CREDIT' || upper === 'RECEIVABLE' || upper === 'UNPAID') return 'DUE';
    return null;
  };

  const getAccountLedger = (accKey: 'RBB' | 'SAHAKARI' | 'ESEWA' | 'CASH' | 'DUE', customDateLimit?: string) => {
    const limitDate = customDateLimit || toDate;
    
    const isUpToLimitDate = (dateStr: string) => {
      if (!dateStr) return false;
      return dateStr <= limitDate;
    };

    const entries: {
      id: string;
      date: string;
      description: string;
      reference: string;
      type: 'In' | 'Out';
      amount: number;
    }[] = [];

    // 1. Opening Balance
    const ob = openingBalances[accKey];
    if (ob && isUpToLimitDate(ob.openingBalanceDate) && ob.openingBalance > 0) {
      entries.push({
        id: `ob-${accKey}`,
        date: ob.openingBalanceDate,
        description: accKey === 'DUE' ? 'Opening Customer Credit Dues (System Setup)' : 'Initial Account Opening Balance (System Setup)',
        reference: 'OP-BAL',
        type: 'In',
        amount: ob.openingBalance
      });
    }

    // 2. Sales Invoices
    invoices.forEach(inv => {
      if (!isUpToLimitDate(inv.date)) return;

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
      if (exp.status === 'Approved' && exp.amount > 0 && isUpToLimitDate(exp.date)) {
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

    // 4. Supply Transactions / Purchase Orders (Expenses)
    transactions.forEach(tx => {
      if (isUpToLimitDate(tx.date)) {
        const amt = tx.paidAmount || tx.totalCost || tx.amount || 0;
        if (amt > 0) {
          const norm = normalizeAccount(tx.paymentMethod);
          if (norm === accKey) {
            entries.push({
              id: `po-${tx.id}`,
              date: tx.date,
              description: `Purchase Order Outflow: ${tx.supplierName || tx.itemName || 'Vendor'}`,
              reference: getFormattedPoNumber(tx, transactions),
              type: 'Out',
              amount: amt
            });
          }
        }
      }
    });

    // 5. Staff Salary Distributions / Payroll Disbursed (Only if not already logged as an Expense)
    salaryDistributions.forEach(dist => {
      if (dist.netPaid > 0 && isUpToLimitDate(dist.distributionDate)) {
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

    // 6. Internal Transfers/Withdrawals/Deposits
    accountTransfers.forEach(tx => {
      if (isUpToLimitDate(tx.date) && tx.amount > 0) {
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

    // 7. Approved Daily Closing Deposits (including multiple split deposits)
    dailyClosings.forEach(c => {
      if (c.status === 'Approved' && isUpToLimitDate(c.date)) {
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

    // 8. Approved Customer Dues Payment Collections (Edit Requests)
    editRequests.forEach(req => {
      if (req.type === 'Payment Collection' && req.status === 'Approved' && req.paymentDetails && req.paymentDetails.amount > 0 && isUpToLimitDate(req.date)) {
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

    // 9. Share Capital Transactions (Addition -> Money In, Return -> Money Out)
    allShareTxs.forEach(st => {
      if (st.paidAmount > 0 && isUpToLimitDate(st.transactionDate)) {
        const norm = normalizeAccount(st.paymentMethod);
        if (norm === accKey) {
          if (st.transactionType === 'Addition') {
            entries.push({
              id: `st-in-${st.id}`,
              date: st.transactionDate,
              description: `Share Capital Addition: ${st.shareholderName}${st.meetingNumber ? ` (Meeting: ${st.meetingNumber})` : ''}`,
              reference: st.transactionIdNo || st.meetingNumber || 'SHARE-ADD',
              type: 'In',
              amount: st.paidAmount
            });
          } else if (st.transactionType === 'Return') {
            const hasCorrespondingExpense = expenses.some(exp => 
              exp.status === 'Approved' && 
              (exp.referenceId === st.id || (exp.topic && exp.topic.includes('Share Return') && exp.title && exp.title.includes(st.shareholderName))) &&
              Math.abs(exp.amount - st.paidAmount) < 0.01
            );
            if (!hasCorrespondingExpense) {
              entries.push({
                id: `st-out-${st.id}`,
                date: st.transactionDate,
                description: `Share Capital Return / Refund: ${st.shareholderName}${st.meetingNumber ? ` (Meeting: ${st.meetingNumber})` : ''}`,
                reference: st.transactionIdNo || st.meetingNumber || 'SHARE-RET',
                type: 'Out',
                amount: st.paidAmount
              });
            }
          }
        }
      }
    });

    // Sort entries chronologically
    entries.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      if (a.reference === 'OP-BAL') return -1;
      if (b.reference === 'OP-BAL') return 1;
      if (a.type !== b.type) {
        return a.type === 'In' ? -1 : 1;
      }
      return a.id.localeCompare(b.id);
    });

    // Compute running balance
    let running = 0;
    const ledgerWithBalance = entries.map(entry => {
      if (entry.type === 'In') {
        running += entry.amount;
      } else {
        running -= entry.amount;
      }
      return {
        ...entry,
        runningBalance: running
      };
    });

    return {
      ledger: ledgerWithBalance,
      finalBalance: running
    };
  };

  const getAccountReconciliation = () => {
    const accounts: ('CASH' | 'ESEWA' | 'SAHAKARI' | 'RBB')[] = ['CASH', 'ESEWA', 'SAHAKARI', 'RBB'];

    return accounts.map(accKey => {
      let previousBalance = 0;
      let incomeInPeriod = 0;
      let expensesInPeriod = 0;
      let netTransfersInPeriod = 0;

      // 1. Opening balance entered in Settings tab
      const ob = openingBalances[accKey] || openingBalances[accKey.toLowerCase() as keyof OpeningBalances];
      const settingOpeningBalance = (ob && typeof ob.openingBalance === 'number') ? ob.openingBalance : 0;
      previousBalance += settingOpeningBalance;

      // 2. Sales Invoices
      invoices.forEach(inv => {
        let amountForAcc = 0;
        if (inv.paymentMethod === 'Split' && inv.paymentSplits) {
          const splitKey = accKey.toLowerCase() as 'cash' | 'esewa' | 'rbb' | 'sahakari' | 'due';
          amountForAcc = inv.paymentSplits[splitKey] || 0;
        } else if (inv.paidAmount > 0) {
          const norm = normalizeAccount(inv.paymentMethod);
          if (norm === accKey) {
            amountForAcc = inv.paidAmount;
          }
        }

        if (amountForAcc > 0) {
          if (inv.date < fromDate) {
            previousBalance += amountForAcc;
          } else if (inv.date >= fromDate && inv.date <= toDate) {
            incomeInPeriod += amountForAcc;
          }
        }
      });

      // 3. Approved Expenses
      expenses.forEach(exp => {
        if (exp.status === 'Approved' && exp.amount > 0) {
          const norm = normalizeAccount(exp.paymentMethod);
          if (norm === accKey) {
            if (exp.date < fromDate) {
              previousBalance -= exp.amount;
            } else if (exp.date >= fromDate && exp.date <= toDate) {
              expensesInPeriod += exp.amount;
            }
          }
        }
      });

      // 4. Internal Transfers/Withdrawals/Deposits
      accountTransfers.forEach(tx => {
        if (tx.amount > 0) {
          const sourceNorm = normalizeAccount(tx.sourceAccount);
          const destNorm = tx.destinationAccount ? normalizeAccount(tx.destinationAccount) : null;

          let net = 0;
          if (tx.type === 'Withdrawal') {
            if (sourceNorm === accKey) net -= tx.amount;
            if (accKey === 'CASH' && sourceNorm !== 'CASH') net += tx.amount;
          } else if (tx.type === 'Deposit') {
            if (sourceNorm === accKey) net += tx.amount;
            if (accKey === 'CASH' && sourceNorm !== 'CASH') net -= tx.amount;
          } else if (tx.type === 'Transfer') {
            if (sourceNorm === accKey) net -= tx.amount;
            if (destNorm === accKey) net += tx.amount;
          }

          if (net !== 0) {
            if (tx.date < fromDate) {
              previousBalance += net;
            } else if (tx.date >= fromDate && tx.date <= toDate) {
              netTransfersInPeriod += net;
            }
          }
        }
      });

      // 5. Approved Daily Closing Deposits (including multiple split deposits)
      dailyClosings.forEach(c => {
        if (c.status === 'Approved') {
          if (c.splitDeposits && c.splitDeposits.length > 0) {
            c.splitDeposits.forEach(s => {
              if (s.amount > 0 && s.targetAccount) {
                const targetNorm = normalizeAccount(s.targetAccount);
                let net = 0;
                if (accKey === 'CASH') net -= s.amount;
                if (targetNorm === accKey) net += s.amount;

                if (net !== 0) {
                  if (c.date < fromDate) {
                    previousBalance += net;
                  } else if (c.date >= fromDate && c.date <= toDate) {
                    netTransfersInPeriod += net;
                  }
                }
              }
            });
          } else if (c.depositAmount > 0 && c.depositTarget && c.depositTarget !== 'None' && c.depositTarget !== 'Split') {
            const targetNorm = normalizeAccount(c.depositTarget);
            let net = 0;
            if (accKey === 'CASH') net -= c.depositAmount;
            if (targetNorm === accKey) net += c.depositAmount;

            if (net !== 0) {
              if (c.date < fromDate) {
                previousBalance += net;
              } else if (c.date >= fromDate && c.date <= toDate) {
                netTransfersInPeriod += net;
              }
            }
          }
        }
      });

      // 6. Approved Dues Payment Collections (Edit Requests)
      editRequests.forEach(req => {
        if (req.type === 'Payment Collection' && req.status === 'Approved' && req.paymentDetails && req.paymentDetails.amount > 0) {
          const methodNorm = normalizeAccount(req.paymentDetails.method);
          if (methodNorm === accKey) {
            if (req.date < fromDate) {
              previousBalance += req.paymentDetails.amount;
            } else if (req.date >= fromDate && req.date <= toDate) {
              incomeInPeriod += req.paymentDetails.amount;
            }
          }
        }
      });

      // 7. Share Capital Transactions (Additions -> Income, Returns -> Expenses)
      allShareTxs.forEach(st => {
        if (st.paidAmount > 0) {
          const norm = normalizeAccount(st.paymentMethod);
          if (norm === accKey) {
            if (st.transactionType === 'Addition') {
              if (st.transactionDate < fromDate) {
                previousBalance += st.paidAmount;
              } else if (st.transactionDate >= fromDate && st.transactionDate <= toDate) {
                incomeInPeriod += st.paidAmount;
              }
            } else if (st.transactionType === 'Return') {
              const hasCorrespondingExpense = expenses.some(exp => 
                exp.status === 'Approved' && 
                (exp.referenceId === st.id || (exp.topic && exp.topic.includes('Share Return') && exp.title && exp.title.includes(st.shareholderName))) &&
                Math.abs(exp.amount - st.paidAmount) < 0.01
              );
              if (!hasCorrespondingExpense) {
                if (st.transactionDate < fromDate) {
                  previousBalance -= st.paidAmount;
                } else if (st.transactionDate >= fromDate && st.transactionDate <= toDate) {
                  expensesInPeriod += st.paidAmount;
                }
              }
            }
          }
        }
      });

      const accumulatedBeforeExpenses = previousBalance + incomeInPeriod;
      const netBalance = accumulatedBeforeExpenses - expensesInPeriod + netTransfersInPeriod;

      return {
        accKey,
        accountName: accKey === 'CASH' ? 'Cash in Hand (CASH)' :
                     accKey === 'ESEWA' ? 'E-Sewa Wallet (ESEWA)' :
                     accKey === 'SAHAKARI' ? 'Sahakari Cooperative' : 'Rastriya Banijya Bank (RBB)',
        previousBalance,
        incomeInPeriod,
        accumulatedBeforeExpenses,
        expensesInPeriod,
        netTransfersInPeriod,
        netBalance
      };
    });
  };

  return (
    <div className="space-y-6 animate-fade-in print:p-0 print:bg-white" id="reports-tab">
      
      {/* Filter and Control Header (Hidden in Print) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-6 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 font-display flex items-center gap-2">
              <Layers className="text-indigo-600" />
              <span>Statement & Auditor Reports</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">Generate specific accounting summaries for income, approved expenditures, and profit/loss intervals.</p>
          </div>
          <button 
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0"
          >
            <Printer size={14} />
            <span>Print Current Report</span>
          </button>
        </div>

        {/* Filter Selection Panel */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Report Type Selector */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">Report Category *</label>
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value as ReportType);
                setCurrentPage(1);
              }}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500 bg-white"
            >
              <option value="income">Income Report Only</option>
              <option value="expenses">Expenses Report Only</option>
              <option value="income_expenditure">Income and Expenditure Ledger</option>
              {currentUser?.role === 'Admin' && (
                <option value="cost_vs_selling">Cost Price vs Selling Price Summary</option>
              )}
              <option value="account_ledger">Multi-Account Balance Ledger Report</option>
              <option value="shareholder_share">Shareholder & Share Details (सेयरधनी तथा सेयर विवरण)</option>
              <option value="assets_registry">Office Assets Registry Report</option>
              <option value="office_use">Request for Office Use Log (Internal Requisitions)</option>
              <option value="account_summary">Account Summary (Double-Entry Financial Statements)</option>
            </select>
          </div>

          {/* From Date Selector */}
          <div className="space-y-1.5">
            <NepaliDatePicker
              label="From Date (BS Calendar) *"
              value={fromDate}
              onChange={(newBsDate) => {
                if (newBsDate) {
                  setFromDate(newBsDate);
                  setCurrentPage(1);
                }
              }}
              mode="date"
              placeholder="YYYY-MM-DD (BS)"
            />
          </div>

          {/* To Date Selector */}
          <div className="space-y-1.5">
            <NepaliDatePicker
              label="To Date (BS Calendar) *"
              value={toDate}
              onChange={(newBsDate) => {
                if (newBsDate) {
                  setToDate(newBsDate);
                  setCurrentPage(1);
                }
              }}
              mode="date"
              placeholder="YYYY-MM-DD (BS)"
            />
          </div>

        </div>
      </div>

      {/* Report Header for Printing with Official Corporate Letterhead */}
      <div className="hidden print:block mb-6">
        <CorporateLetterhead
          profile={profile}
          documentType={
            reportType === 'income' ? 'Income Statement Report' :
            reportType === 'expenses' ? 'Expenditure Ledger Report' :
            reportType === 'cost_vs_selling' ? 'Cost vs Selling Price Summary' :
            reportType === 'assets_registry' ? 'Office Assets Registry Report' :
            reportType === 'account_summary' ? 'Account Balance Statement' :
            reportType === 'office_use' ? 'Request for Office Use Log' :
            'Income & Expenditure Statement'
          }
          documentNumber={`REP-${fromDate.replace(/[^0-9]/g, '')}`}
          documentDate={`${fromDate} to ${toDate}`}
        >
          <div className="py-2 text-center">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-800 font-mono">
              {reportType === 'income' ? 'Comprehensive Income Audit Report' :
               reportType === 'expenses' ? 'Approved Expenditures & Cost Ledger' :
               reportType === 'cost_vs_selling' ? 'Profit Margin & Valuation Audit' :
               reportType === 'assets_registry' ? 'Fixed Office Assets Registry' :
               reportType === 'account_summary' ? 'Double-Entry Financial Balance Sheet' :
               reportType === 'office_use' ? 'Internal Office Use Stock Requisition Log' :
               'Comprehensive Income & Expenditure Ledger'}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-1">Audit Interval: From {fromDate} to {toDate}</p>
          </div>
        </CorporateLetterhead>
      </div>

      {/* Summary Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Income Block */}
        {(reportType === 'income' || reportType === 'income_expenditure') && (
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-3xs">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Coins size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Billed Income</p>
                <h3 className="text-lg font-extrabold text-slate-800 font-mono">Rs. {totalBilledIncome.toLocaleString()}</h3>
              </div>
            </div>
            
            {/* Break Received vs Due */}
            <div className="mt-4 pt-3 border-t border-slate-50 grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-400 font-mono">Received Cash</p>
                <p className="text-xs font-bold text-emerald-600 font-mono">Rs. {totalReceivedIncome.toLocaleString()}</p>
              </div>
              <div className="border-l border-slate-100">
                <p className="text-[9px] uppercase font-bold text-slate-400 font-mono">Unpaid Due</p>
                <p className="text-xs font-bold text-rose-500 font-mono">Rs. {totalDueIncome.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Expenses Block */}
        {(reportType === 'expenses' || reportType === 'income_expenditure') && (
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-3xs">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <TrendingDown size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Total Approved Expenses</p>
                <h3 className="text-lg font-extrabold text-slate-800 font-mono">Rs. {totalExpenditure.toLocaleString()}</h3>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 leading-relaxed italic">Includes operational rent, wages, office supply hardware, and payouts.</p>
          </div>
        )}

        {/* Net Profit / Position Block */}
        {reportType === 'income_expenditure' && (
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-3xs">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Accrual Profit / Balance</p>
                <h3 className={`text-lg font-extrabold font-mono ${accrualProfit >= 0 ? 'text-indigo-950' : 'text-rose-600'}`}>
                  Rs. {accrualProfit.toLocaleString()}
                </h3>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Cash Realized Profit:</span>
              <span className={`font-mono font-bold ${cashProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                Rs. {cashProfit.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Office Use Summary Block */}
        {reportType === 'office_use' && (() => {
          const filteredReqs = officeUseRequests.filter(r => isWithinPeriod(r.date));
          const totalReqs = filteredReqs.length;
          const approvedReqs = filteredReqs.filter(r => r.status === 'Approved');
          const approvedUnits = approvedReqs.reduce((acc, r) => acc + r.quantity, 0);
          const pendingCount = filteredReqs.filter(r => r.status === 'Pending').length;

          return (
            <>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-3xs">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Coins size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Total Requisitions</p>
                    <h3 className="text-lg font-extrabold text-slate-800 font-mono">{totalReqs} Requests</h3>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-4 leading-relaxed italic">Internal requisitions submitted for office consumption.</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-3xs">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Approved Consumption</p>
                    <h3 className="text-lg font-extrabold text-emerald-600 font-mono">{approvedUnits} Units</h3>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-4 leading-relaxed italic">Stock items deducted from inventory for internal usage.</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-3xs">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <Info size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Pending Requisitions</p>
                    <h3 className="text-lg font-extrabold text-amber-600 font-mono">{pendingCount} Pending</h3>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-4 leading-relaxed italic">Requisitions awaiting admin approval.</p>
              </div>
            </>
          );
        })()}

      </div>

      {/* Notification banner on Due Money vs Received Money */}
      {reportType !== 'expenses' && reportType !== 'cost_vs_selling' && reportType !== 'office_use' && (
        <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 flex items-start gap-3 print:hidden">
          <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-950 space-y-1">
            <p className="font-bold">Accounting Security Standard:</p>
            <p>Receivables and realized cash are tracked separately. The outstanding customer dues of <strong>Rs. {totalDueIncome.toLocaleString()}</strong> are not treated as cash-in-hand as they are not received yet.</p>
          </div>
        </div>
      )}

      {/* INCOME REPORT DATA TABLE */}
      {reportType === 'income' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center print:hidden">
            <h3 className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">Filtered Invoices ({filteredInvoices.length} Records)</h3>
            
            {/* Rows count selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Rows per page:</span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className="border border-slate-200 rounded-lg text-xs py-1 px-1.5 focus:outline-hidden"
              >
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 uppercase font-mono tracking-wider text-[10px]">
                  <th className="px-6 py-4 font-bold">Invoice No</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold">Customer</th>
                  <th className="px-6 py-4 font-bold text-right">Billed Amount</th>
                  <th className="px-6 py-4 font-bold text-right">Received Cash</th>
                  <th className="px-6 py-4 font-bold text-right text-rose-600">Balance Due</th>
                  <th className="px-6 py-4 font-bold text-center">Method</th>
                  <th className="px-6 py-4 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-sans">
                {filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(inv => (
                  <tr key={inv.id}>
                    <td className="px-6 py-3.5 font-bold font-mono text-slate-500">{inv.invoiceNumber}</td>
                    <td className="px-6 py-3.5 font-mono">{inv.date}</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-800">{inv.customerName}</td>
                    <td className="px-6 py-3.5 text-right font-bold font-mono">Rs. {inv.finalAmount.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-emerald-600 font-mono">Rs. {inv.paidAmount.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-rose-500 font-mono">Rs. {inv.dueAmount.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-center uppercase font-mono text-[11px] font-semibold">{inv.paymentMethod}</td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' :
                        inv.status === 'Partially Paid' ? 'bg-amber-50 text-amber-700' :
                        'bg-rose-50 text-rose-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">No income transactions found in this period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredInvoices.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center print:hidden">
              <span className="text-xs text-slate-500">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredInvoices.length)} of {filteredInvoices.length} entries
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-semibold text-slate-700 self-center font-mono">Page {currentPage} of {Math.ceil(filteredInvoices.length / pageSize)}</span>
                <button
                  disabled={currentPage >= Math.ceil(filteredInvoices.length / pageSize)}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EXPENSES REPORT DATA TABLE */}
      {reportType === 'expenses' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center print:hidden">
            <h3 className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">Approved Expenses ({filteredExpenses.length} Records)</h3>
            
            {/* Rows count selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Rows per page:</span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className="border border-slate-200 rounded-lg text-xs py-1 px-1.5 focus:outline-hidden"
              >
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 uppercase font-mono tracking-wider text-[10px]">
                  <th className="px-6 py-4 font-bold">Voucher No</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold">Category</th>
                  <th className="px-6 py-4 font-bold">Title</th>
                  <th className="px-6 py-4 font-bold text-right">Disbursed Amount</th>
                  <th className="px-6 py-4 font-bold text-center">Method</th>
                  <th className="px-6 py-4 font-bold">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-sans">
                {filteredExpenses.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(exp => (
                  <tr key={exp.id}>
                    <td className="px-6 py-3.5 font-bold font-mono text-slate-500">{exp.expenseNo}</td>
                    <td className="px-6 py-3.5 font-mono">{exp.date}</td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600">{exp.category}</span>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-800">{exp.title}</td>
                    <td className="px-6 py-3.5 text-right font-bold font-mono">Rs. {exp.amount.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-center uppercase font-mono text-[11px] font-semibold">{exp.paymentMethod}</td>
                    <td className="px-6 py-3.5 font-mono">{exp.createdBy}</td>
                  </tr>
                ))}

                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">No approved expenditures found in this period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredExpenses.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center print:hidden">
              <span className="text-xs text-slate-500">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredExpenses.length)} of {filteredExpenses.length} entries
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-semibold text-slate-700 self-center font-mono">Page {currentPage} of {Math.ceil(filteredExpenses.length / pageSize)}</span>
                <button
                  disabled={currentPage >= Math.ceil(filteredExpenses.length / pageSize)}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INCOME & EXPENDITURE ACCOUNT REPORT */}
      {reportType === 'income_expenditure' && (() => {
        // Build Income table items
        // 1. Opening balance items from openingBalances in Settings tab (included if date is within selected period)
        const openingBalanceItems: {
          sn: number;
          date: string;
          particular: string;
          account: string;
          amount: number;
          isOpening: boolean;
        }[] = [];

        let incomeSn = 1;

        const obConfig = [
          { key: 'CASH', account: 'cash', label: 'Opening balance (Cash)' },
          { key: 'RBB', account: 'rbb', label: 'Opening balance (RBB Bank)' },
          { key: 'ESEWA', account: 'esewa', label: 'Opening balance (eSewa)' },
          { key: 'SAHAKARI', account: 'sahakari', label: 'Opening balance (Sahakari)' }
        ] as const;

        obConfig.forEach(acc => {
          const ob = openingBalances[acc.key];
          const obDate = ob?.openingBalanceDate || '2083-04-01';
          const obAmount = ob?.openingBalance || 0;
          if (isWithinPeriod(obDate) && obAmount > 0) {
            openingBalanceItems.push({
              sn: incomeSn++,
              date: obDate,
              particular: `Opening balance (${acc.key})`,
              account: acc.account,
              amount: obAmount,
              isOpening: true
            });
          }
        });

        // 2. Invoice Income Items - FILTERED BY SELECTED DATE RANGE
        const invoiceIncomeItems: {
          sn: number;
          date: string;
          particular: string;
          account: string;
          amount: number;
          isOpening: boolean;
        }[] = [];

        const filteredInvoices = invoices.filter(inv => isWithinPeriod(inv.date));

        filteredInvoices.forEach(inv => {
          if (inv.paymentMethod === 'Split' && inv.paymentSplits) {
            (['cash', 'rbb', 'esewa', 'sahakari', 'due'] as const).forEach(acc => {
              const amt = inv.paymentSplits![acc] || 0;
              if (amt > 0) {
                invoiceIncomeItems.push({
                  sn: incomeSn++,
                  date: inv.date,
                  particular: `Income from ${inv.customerName} (${inv.invoiceNumber})`,
                  account: acc,
                  amount: amt,
                  isOpening: false
                });
              }
            });
          } else {
            const acc = (normalizeAccount(inv.paymentMethod) || 'cash').toLowerCase();
            if (inv.paidAmount > 0) {
              invoiceIncomeItems.push({
                sn: incomeSn++,
                date: inv.date,
                particular: `Income from ${inv.customerName} (${inv.invoiceNumber})`,
                account: acc,
                amount: inv.paidAmount,
                isOpening: false
              });
            }
            if (inv.dueAmount > 0) {
              invoiceIncomeItems.push({
                sn: incomeSn++,
                date: inv.date,
                particular: `Income from ${inv.customerName} (${inv.invoiceNumber}) [Due]`,
                account: 'due',
                amount: inv.dueAmount,
                isOpening: false
              });
            }
          }
        });

        filteredShareAdditions.forEach(st => {
          invoiceIncomeItems.push({
            sn: incomeSn++,
            date: st.transactionDate,
            particular: `Share Capital Addition: ${st.shareholderName}${st.meetingNumber ? ` (Meeting: ${st.meetingNumber})` : ''}`,
            account: (normalizeAccount(st.paymentMethod) || 'cash').toLowerCase(),
            amount: st.paidAmount,
            isOpening: false
          });
        });

        const allIncomeItems = [...openingBalanceItems, ...invoiceIncomeItems];
        const totalIncomeAmount = allIncomeItems.reduce((sum, item) => sum + item.amount, 0);

        // Build Expenditure table items - FILTERED BY SELECTED DATE RANGE & APPROVED STATUS
        let expSn = 1;
        const filteredExpenses = expenses.filter(exp => exp.status === 'Approved' && isWithinPeriod(exp.date));
        
        const expenditureItems = filteredExpenses.map(exp => ({
          sn: expSn++,
          date: exp.date,
          particular: exp.title + (exp.topic ? ` (${exp.topic})` : ''),
          account: (normalizeAccount(exp.paymentMethod) || 'cash').toLowerCase(),
          amount: exp.amount
        }));

        filteredShareReturns.forEach(st => {
          expenditureItems.push({
            sn: expSn++,
            date: st.transactionDate,
            particular: `Share Capital Return / Refund: ${st.shareholderName}${st.meetingNumber ? ` (Meeting: ${st.meetingNumber})` : ''}`,
            account: (normalizeAccount(st.paymentMethod) || 'cash').toLowerCase(),
            amount: st.paidAmount
          });
        });

        const totalExpenditureAmount = expenditureItems.reduce((sum, item) => sum + item.amount, 0);

        // Build Summary table (Account-wise - ONLY Liquid Cash/Bank buckets)
        const summaryAccounts = [
          { key: 'cash', name: 'cash', obKey: 'CASH' },
          { key: 'rbb', name: 'rbb', obKey: 'RBB' },
          { key: 'esewa', name: 'esewa', obKey: 'ESEWA' },
          { key: 'sahakari', name: 'sahakari', obKey: 'SAHAKARI' }
        ];

        const summaryRows = summaryAccounts.map((acc, index) => {
          const opening = openingBalanceItems
            .filter(item => item.isOpening && item.account === acc.key)
            .reduce((sum, item) => sum + item.amount, 0);
            
          const billIncome = allIncomeItems
            .filter(item => !item.isOpening && item.account === acc.key)
            .reduce((sum, item) => sum + item.amount, 0);
          
          const totalIncomeA = opening + billIncome;
          
          const totalExpB = expenditureItems
            .filter(item => item.account === acc.key)
            .reduce((sum, item) => sum + item.amount, 0);

          const currentAmount = totalIncomeA - totalExpB;

          return {
            sn: index + 1,
            account: acc.key,
            accountName: acc.name,
            opening,
            billIncome,
            totalIncomeA,
            totalExpB,
            currentAmount
          };
        }).filter(row => row.totalIncomeA > 0 || row.totalExpB > 0 || row.opening > 0);

        const totalSummaryIncomeA = summaryRows.reduce((sum, r) => sum + r.totalIncomeA, 0);
        const totalSummaryExpB = summaryRows.reduce((sum, r) => sum + r.totalExpB, 0);
        
        // 1. Total Current Balance (Liquid Accounts Only)
        const totalCurrentBalance = summaryRows.reduce((sum, r) => sum + r.currentAmount, 0);

        // 2. Due to be collected (Income Generating Tab / Sales Invoice Customer Receivables)
        const dueOpening = openingBalances.DUE?.openingBalance && isWithinPeriod(openingBalances.DUE.openingBalanceDate || '') 
          ? openingBalances.DUE.openingBalance 
          : 0;
        const dueBilledIncome = allIncomeItems
          .filter(item => item.account === 'due')
          .reduce((sum, item) => sum + item.amount, 0);
        const dueToBeCollected = dueOpening + dueBilledIncome;

        // 3. Due to be paid (Purchase Order / Supplier Payables)
        const dueToBePaidFromTx = transactions
          .filter(tx => tx.status !== 'Rejected' && isWithinPeriod(tx.date))
          .reduce((sum, tx) => {
            const due = typeof tx.amountDue === 'number' && tx.amountDue >= 0 
              ? tx.amountDue 
              : Math.max(0, (tx as any).totalAmount - (tx.amountPaid || 0));
            return sum + due;
          }, 0);
        const supplierCreditDues = suppliers.reduce((sum, s) => sum + (s.creditBalance || 0), 0);
        const dueToBePaid = Math.max(dueToBePaidFromTx, supplierCreditDues);

        // 4. Net Total (Liquid Cash + Receivables - Payables)
        const netTotalBalance = totalCurrentBalance + dueToBeCollected - dueToBePaid;

        return (
          <div className="space-y-8 bg-white rounded-2xl border border-slate-100 shadow-xs p-6 font-sans">
            
            {/* Header Title */}
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 font-display">Income and Expenditure Account</h3>
              <p className="text-xs text-slate-500 mt-0.5">Official Account Statement with Opening Balances from Settings Tab</p>
            </div>

            {/* 1. INCOME TABLE */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-emerald-900 text-sm font-mono uppercase tracking-wider flex items-center justify-between border-b-2 border-emerald-500 pb-2">
                <span>Income</span>
                <span className="text-xs font-bold text-emerald-700 font-mono">Total Records: {allIncomeItems.length}</span>
              </h4>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-emerald-50/80 text-emerald-950 uppercase font-mono tracking-wider text-[11px] border-b border-emerald-200">
                      <th className="px-4 py-3 font-bold w-16 text-center">S.N.</th>
                      <th className="px-4 py-3 font-bold w-32 font-mono">Date</th>
                      <th className="px-4 py-3 font-bold">Particular</th>
                      <th className="px-4 py-3 font-bold text-center w-28 uppercase font-mono">Account</th>
                      <th className="px-4 py-3 font-bold text-right w-36 font-mono">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {allIncomeItems.map(item => (
                      <tr key={`inc-${item.sn}-${item.account}`} className={item.isOpening ? 'bg-indigo-50/30 hover:bg-indigo-50/60 font-semibold' : 'hover:bg-slate-50'}>
                        <td className="px-4 py-3 text-center font-mono text-slate-500 font-bold">{item.sn}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{item.date}</td>
                        <td className="px-4 py-3 text-slate-800 font-medium">{item.particular}</td>
                        <td className="px-4 py-3 text-center font-mono uppercase text-xs">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                            item.account === 'cash' ? 'bg-amber-100 text-amber-800' :
                            item.account === 'rbb' ? 'bg-blue-100 text-blue-800' :
                            item.account === 'esewa' ? 'bg-emerald-100 text-emerald-800' :
                            item.account === 'sahakari' ? 'bg-purple-100 text-purple-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {item.account}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                          Rs. {item.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-emerald-900 text-white font-mono font-bold text-xs">
                      <td colSpan={4} className="px-4 py-3 uppercase tracking-wider">Total Income</td>
                      <td className="px-4 py-3 text-right text-emerald-300 text-sm">Rs. {totalIncomeAmount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 2. EXPENDITURE TABLE */}
            <div className="space-y-3 pt-4">
              <h4 className="font-extrabold text-rose-900 text-sm font-mono uppercase tracking-wider flex items-center justify-between border-b-2 border-rose-500 pb-2">
                <span>Expenditure</span>
                <span className="text-xs font-bold text-rose-700 font-mono">Total Records: {expenditureItems.length}</span>
              </h4>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-rose-50/80 text-rose-950 uppercase font-mono tracking-wider text-[11px] border-b border-rose-200">
                      <th className="px-4 py-3 font-bold w-16 text-center">S.N.</th>
                      <th className="px-4 py-3 font-bold w-32 font-mono">Date</th>
                      <th className="px-4 py-3 font-bold">Particular</th>
                      <th className="px-4 py-3 font-bold text-center w-28 uppercase font-mono">Account</th>
                      <th className="px-4 py-3 font-bold text-right w-36 font-mono">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {expenditureItems.map(item => (
                      <tr key={`exp-${item.sn}`} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-center font-mono text-slate-500 font-bold">{item.sn}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{item.date}</td>
                        <td className="px-4 py-3 text-slate-800 font-medium">{item.particular}</td>
                        <td className="px-4 py-3 text-center font-mono uppercase text-xs">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                            item.account === 'cash' ? 'bg-amber-100 text-amber-800' :
                            item.account === 'rbb' ? 'bg-blue-100 text-blue-800' :
                            item.account === 'esewa' ? 'bg-emerald-100 text-emerald-800' :
                            item.account === 'sahakari' ? 'bg-purple-100 text-purple-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {item.account}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                          Rs. {item.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {expenditureItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 italic">No expenditures registered in this period.</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-rose-900 text-white font-mono font-bold text-xs">
                      <td colSpan={4} className="px-4 py-3 uppercase tracking-wider">Total Expenditure</td>
                      <td className="px-4 py-3 text-right text-rose-300 text-sm">Rs. {totalExpenditureAmount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 3. SUMMARY TABLE */}
            <div className="space-y-3 pt-6 border-t-2 border-slate-200">
              <h4 className="font-extrabold text-slate-800 text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                <Coins size={18} className="text-indigo-600" />
                <span>Summary</span>
              </h4>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase font-mono tracking-wider text-[11px] border-b border-slate-200">
                      <th className="px-4 py-3 font-bold w-16 text-center">S.N.</th>
                      <th className="px-4 py-3 font-bold uppercase font-mono w-28">Account</th>
                      <th className="px-4 py-3 font-bold text-right font-mono text-emerald-800 bg-emerald-50/50">Income (a)</th>
                      <th className="px-4 py-3 font-bold text-right font-mono text-rose-800 bg-rose-50/50">Expenditure (b)</th>
                      <th className="px-4 py-3 font-bold text-right font-mono text-indigo-950 bg-indigo-50/50">Current Amount (a - b)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {summaryRows.map(row => (
                      <tr key={`sum-${row.account}`} className="hover:bg-slate-50">
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-500">{row.sn}</td>
                        <td className="px-4 py-3.5 font-bold uppercase font-mono text-slate-800">{row.account}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-semibold text-emerald-700 bg-emerald-50/20">
                          {row.account} opening stock {row.opening.toLocaleString()} + {row.account} bill income {row.billIncome.toLocaleString()} = <span className="font-bold">Rs. {row.totalIncomeA.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-semibold text-rose-600 bg-rose-50/20">
                          {row.account} expenses {row.totalExpB.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-black text-slate-900 bg-indigo-50/20 text-sm">
                          Rs. {row.currentAmount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-mono font-bold text-xs">
                      <td colSpan={2} className="px-4 py-3.5 uppercase tracking-wider">Total Liquid Accounts</td>
                      <td className="px-4 py-3.5 text-right text-emerald-300 font-mono">Rs. {totalSummaryIncomeA.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right text-rose-300 font-mono">Rs. {totalSummaryExpB.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right text-emerald-400 font-mono text-sm font-black">
                        total current balance = Rs. {totalCurrentBalance.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* DUES & OVERALL FINANCIAL POSITION SUMMARY */}
              <div className="mt-4 bg-slate-900 text-white p-5 rounded-xl space-y-3 font-mono text-xs shadow-md border border-slate-800">
                <div className="text-xs font-extrabold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2 flex justify-between items-center">
                  <span>Balance & Dues Audit Statement</span>
                  <span className="text-[10px] text-emerald-400 font-sans font-medium">Real-Time Calculation</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-slate-800/90 px-3.5 py-2.5 rounded-lg border border-slate-700/80">
                      <span className="text-slate-300 font-bold uppercase">total current balance =</span>
                      <span className="text-emerald-400 font-black text-sm">Rs. {totalCurrentBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-800/90 px-3.5 py-2.5 rounded-lg border border-slate-700/80">
                      <span className="text-slate-300 font-bold uppercase">due to be collected =</span>
                      <span className="text-amber-400 font-black text-sm">Rs. {dueToBeCollected.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-slate-800/90 px-3.5 py-2.5 rounded-lg border border-slate-700/80">
                      <span className="text-slate-300 font-bold uppercase">due to be paid =</span>
                      <span className="text-rose-400 font-black text-sm">Rs. {dueToBePaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center bg-indigo-950 px-3.5 py-2.5 rounded-lg border border-indigo-500/60 shadow-xs">
                      <span className="text-indigo-200 font-extrabold uppercase text-xs">total =</span>
                      <span className="text-emerald-300 font-black text-base">Rs. {netTotalBalance.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        );
      })()}

      {/* COST VS SELLING SUMMARY REPORT */}
      {reportType === 'cost_vs_selling' && (
        <div className="space-y-6">
          {/* Date Filter Status Bar */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden">
            <div>
              <p className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Calendar size={14} className="text-indigo-600" />
                <span>Cost Price vs Selling Price Date Filtering</span>
              </p>
              <p className="text-[11px] text-indigo-700/85 mt-0.5">
                {filterStockByDate 
                  ? `Showing catalog items received between "${fromDate}" and "${toDate}"` 
                  : 'Showing complete catalog of all stock ever received regardless of date.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFilterStockByDate(!filterStockByDate)}
              className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg cursor-pointer transition select-none"
            >
              {filterStockByDate ? 'Show All Catalog Stock' : 'Filter by Selected Period'}
            </button>
          </div>

          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Catalog Size</span>
              <span className="text-xl font-extrabold text-slate-800 block mt-1">{filteredStockItems.length} Items</span>
              <p className="text-[10px] text-slate-400 mt-1 italic">Total active inventoried SKUs</p>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Average Markup %</span>
              <span className="text-xl font-extrabold text-indigo-600 block mt-1">
                {activeItemsWithPrice.length > 0 
                  ? ((activeItemsWithPrice.reduce((sum, item) => sum + ((item.sellingPrice - item.costPrice) / item.costPrice), 0) / activeItemsWithPrice.length) * 100).toFixed(1)
                  : '0.0'}%
              </span>
              <p className="text-[10px] text-slate-400 mt-1 italic">Average pricing markup rate</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Valuation at Cost</span>
              <span className="text-xl font-extrabold text-rose-600 font-mono block mt-1">
                Rs. {filteredStockItems.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0).toLocaleString()}
              </span>
              <p className="text-[10px] text-slate-400 mt-1 italic">Invested cost of stock on hand</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Valuation at Retail</span>
              <span className="text-xl font-extrabold text-emerald-600 font-mono block mt-1">
                Rs. {filteredStockItems.reduce((acc, item) => acc + (item.sellingPrice * item.quantity), 0).toLocaleString()}
              </span>
              <p className="text-[10px] text-slate-400 mt-1 italic">Potential retail sales revenue value</p>
            </div>
          </div>

          {/* Potential profit margin callout */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <p className="font-bold text-emerald-950">Potential Inventory Gross Profit:</p>
              <p className="text-slate-600">The maximum expected profit from selling all stock currently held in warehouse storage.</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-emerald-700 font-mono">
                Rs. {Math.max(0, filteredStockItems.reduce((acc, item) => acc + (item.sellingPrice * item.quantity), 0) - filteredStockItems.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0)).toLocaleString()}
              </p>
              <p className="text-[10px] font-mono text-emerald-600">
                ({(filteredStockItems.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0) > 0 
                  ? ((filteredStockItems.reduce((acc, item) => acc + (item.sellingPrice * item.quantity), 0) - filteredStockItems.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0)) / filteredStockItems.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0)) * 100
                  : 0).toFixed(1)}% gross profit margin)
              </p>
            </div>
          </div>

          {/* Data Grid comparing cost price vs selling price */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center print:hidden">
              <h3 className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">Catalog Price Comparisons</h3>
              <span className="text-[10px] font-mono font-bold text-slate-400">{filteredStockItems.length} items logged</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 uppercase font-mono tracking-wider text-[10px]">
                    <th className="px-6 py-4 font-bold">Item Description</th>
                    <th className="px-6 py-4 font-bold text-center">Stock Level</th>
                    <th className="px-6 py-4 font-bold text-right">Cost Price</th>
                    <th className="px-6 py-4 font-bold text-right">Selling Price</th>
                    <th className="px-6 py-4 font-bold text-right text-indigo-600">Gross Profit (unit)</th>
                    <th className="px-6 py-4 font-bold text-right text-indigo-600">Markup %</th>
                    <th className="px-6 py-4 font-bold text-right text-emerald-600">Potential Profit (total)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700 font-sans">
                  {filteredStockItems.map(item => {
                    const unitProfit = item.sellingPrice - item.costPrice;
                    const markupPct = item.costPrice > 0 ? (unitProfit / item.costPrice) * 100 : 0;
                    const totalPotentialProfit = unitProfit * item.quantity;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3.5 font-bold text-slate-800">{item.name}</td>
                        <td className="px-6 py-3.5 text-center font-mono font-semibold text-slate-600">{item.quantity} units</td>
                        <td className="px-6 py-3.5 text-right font-mono text-rose-600 font-medium">Rs. {item.costPrice.toLocaleString()}</td>
                        <td className="px-6 py-3.5 text-right font-mono text-emerald-600 font-medium">Rs. {item.sellingPrice.toLocaleString()}</td>
                        <td className="px-6 py-3.5 text-right font-mono font-bold text-indigo-700">Rs. {unitProfit.toLocaleString()}</td>
                        <td className="px-6 py-3.5 text-right font-mono text-indigo-600 font-semibold">{markupPct.toFixed(1)}%</td>
                        <td className="px-6 py-3.5 text-right font-mono font-bold text-emerald-700">Rs. {totalPotentialProfit.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MULTI-ACCOUNT LEDGER REPORT */}
      {reportType === 'account_ledger' && (() => {
        const cashLedger = getAccountLedger('CASH');
        const esewaLedger = getAccountLedger('ESEWA');
        const sahakariLedger = getAccountLedger('SAHAKARI');
        const rbbLedger = getAccountLedger('RBB');
        const dueLedger = getAccountLedger('DUE');

        const activeLedgerData = activeLedgerAccount === 'CASH' ? cashLedger :
                                 activeLedgerAccount === 'ESEWA' ? esewaLedger :
                                 activeLedgerAccount === 'SAHAKARI' ? sahakariLedger :
                                 activeLedgerAccount === 'RBB' ? rbbLedger :
                                 dueLedger;

        const handleAddInternalTransaction = (e: React.FormEvent) => {
          e.preventDefault();
          if (txAmount <= 0) {
            alert('Please enter an amount greater than zero.');
            return;
          }
          if (txType === 'Transfer' && txSource === txDest) {
            alert('Source and Destination accounts cannot be the same for an inter-account transfer.');
            return;
          }

          // Balance Validation for account outflows
          if (txType === 'Withdrawal' || txType === 'Transfer' || txType === 'Deposit') {
            const val = validateAccountBalance(txSource, txAmount, {
              openingBalances: openingBalances || {
                RBB: { openingBalance: 0, openingBalanceDate: '' },
                ESEWA: { openingBalance: 0, openingBalanceDate: '' },
                SAHAKARI: { openingBalance: 0, openingBalanceDate: '' },
                CASH: { openingBalance: 0, openingBalanceDate: '' },
                DUE: { openingBalance: 0, openingBalanceDate: '' }
              },
              invoices,
              expenses,
              transactions,
              salaryDistributions,
              accountTransfers,
              dailyClosings,
              editRequests
            });

            if (val) {
              if (onTriggerInsufficientBalance) {
                onTriggerInsufficientBalance(val);
              } else {
                alert(`⚠️ Empty / Insufficient Account Bucket Alert!\n\nThe selected source bucket "${val.accountLabel}" currently has Rs. ${val.currentBalance.toLocaleString()} available balance, which is empty/insufficient for this outflow of Rs. ${val.requiredAmount.toLocaleString()}.\n\nTransaction blocked.`);
              }
              return;
            }
          }

          const newTx: AccountTransaction = {
            id: `atx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            date: txDate,
            type: txType,
            sourceAccount: txSource,
            destinationAccount: txType === 'Transfer' ? txDest : undefined,
            amount: txAmount,
            voucherNumber: txVoucher.trim() || `JV-${Math.floor(1000 + Math.random() * 9000)}`,
            remarks: txRemarks.trim() || `${txType} transaction`,
            recordedBy: txRecordedBy
          };

          if (onUpdateAccountTransfers) {
            onUpdateAccountTransfers([...accountTransfers, newTx]);
            alert('Account transaction logged successfully!');
            setTxAmount(0);
            setTxVoucher('');
            setTxRemarks('');
          }
        };

        return (
          <div className="space-y-6 animate-fade-in">
            {/* Account Bento Cards Grid - All 5 Main Buckets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {([
                { key: 'RBB', label: 'RBB Bank (RBB)', ledger: rbbLedger },
                { key: 'SAHAKARI', label: 'Sahakari Cooperative', ledger: sahakariLedger },
                { key: 'ESEWA', label: 'E-Sewa Wallet', ledger: esewaLedger },
                { key: 'CASH', label: 'Cash in Hand', ledger: cashLedger },
                { key: 'DUE', label: 'Customer Credit Dues', ledger: dueLedger }
              ] as const).map(item => {
                const isVerified = !!openingBalances[item.key]?.openingBalanceProof;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveLedgerAccount(item.key)}
                    className={`p-4 rounded-2xl border text-left transition relative overflow-hidden flex flex-col justify-between h-32 cursor-pointer ${
                      activeLedgerAccount === item.key 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                        : 'bg-white border-slate-100 hover:border-slate-300 text-slate-850'
                    }`}
                  >
                    <div>
                      <p className={`text-[10px] uppercase font-bold tracking-wider font-mono ${activeLedgerAccount === item.key ? 'text-slate-400' : 'text-slate-500'}`}>{item.label}</p>
                      <h4 className="text-lg font-black font-mono mt-1.5">Rs. {item.ledger.finalBalance.toLocaleString()}</h4>
                    </div>

                    <div className="flex items-center justify-between w-full mt-2">
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md font-mono ${
                        activeLedgerAccount === item.key ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        As of: {toDate}
                      </span>
                      {isVerified ? (
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="text-[8px] bg-amber-500/10 text-amber-500/90 border border-amber-500/10 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                          No Proof
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Screen Controls & View Mode Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase font-mono">View Mode:</span>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                  <button
                    onClick={() => setLedgerDisplayMode('all')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                      ledgerDisplayMode === 'all' 
                        ? 'bg-slate-900 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All 5 Accounts Detailed Sequence
                  </button>
                  <button
                    onClick={() => setLedgerDisplayMode('single')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                      ledgerDisplayMode === 'single' 
                        ? 'bg-slate-900 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Single Account Tab ({activeLedgerAccount})
                  </button>
                </div>
              </div>

              {ledgerDisplayMode === 'single' && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Select Bucket:</span>
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                    {(['CASH', 'RBB', 'ESEWA', 'SAHAKARI', 'DUE'] as const).map(acc => (
                      <button
                        key={acc}
                        onClick={() => setActiveLedgerAccount(acc)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                          activeLedgerAccount === acc 
                            ? 'bg-white text-slate-900 shadow-xs' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {acc}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Display Mode 1: ALL 5 ACCOUNTS DETAILED SEQUENCE (One after another in table) */}
            <div className={`${ledgerDisplayMode === 'all' ? 'block' : 'hidden print:block'} space-y-6`}>
              {([
                { key: 'CASH', name: '1. Physical Cash in Hand', subtitle: 'Cash Drawer Ledger', bucket: 'CASH', theme: 'bg-emerald-900 text-white', data: cashLedger },
                { key: 'RBB', name: '2. Rastriya Banijya Bank', subtitle: 'RBB Bank Current Account Ledger', bucket: 'RBB', theme: 'bg-blue-900 text-white', data: rbbLedger },
                { key: 'ESEWA', name: '3. eSewa Digital Wallet', subtitle: 'eSewa Merchant / Wallet Ledger', bucket: 'ESEWA', theme: 'bg-teal-950 text-white', data: esewaLedger },
                { key: 'SAHAKARI', name: '4. Sahakari Cooperative', subtitle: 'Sahakari Savings & Deposit Ledger', bucket: 'SAHAKARI', theme: 'bg-amber-950 text-white', data: sahakariLedger },
                { key: 'DUE', name: '5. Customer Credit Due', subtitle: 'Customer Receivables & Outstanding Dues', bucket: 'DUE', theme: 'bg-indigo-950 text-white', data: dueLedger }
              ] as const).map((acc) => {
                const accFiltered = acc.data.ledger.filter(e => isWithinPeriod(e.date));
                const totalIn = accFiltered.filter(e => e.type === 'In').reduce((s, e) => s + e.amount, 0);
                const totalOut = accFiltered.filter(e => e.type === 'Out').reduce((s, e) => s + e.amount, 0);

                return (
                  <div key={acc.key} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden break-inside-avoid">
                    <div className={`p-4 ${acc.theme} flex flex-col sm:flex-row sm:items-center justify-between gap-2`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-black uppercase font-mono tracking-wider">
                            {acc.name}
                          </h3>
                          <span className="text-[10px] opacity-80 font-normal">({acc.subtitle})</span>
                        </div>
                        <p className="text-[10px] opacity-75 font-mono">Bucket: {acc.bucket} | Range: {fromDate} to {toDate}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] opacity-80 block font-mono">Closing Balance ({toDate})</span>
                        <span className="text-sm font-black font-mono">Rs. {acc.data.finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse font-mono">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                            <th className="px-4 py-3 w-10 text-center">S.N.</th>
                            <th className="px-4 py-3 w-24">Date</th>
                            <th className="px-4 py-3 w-28">Ref / Voucher</th>
                            <th className="px-4 py-3">Particulars / Source Details</th>
                            <th className="px-4 py-3 text-right text-emerald-700 w-28">Deposits (In)</th>
                            <th className="px-4 py-3 text-right text-rose-600 w-28">Withdrawals (Out)</th>
                            <th className="px-4 py-3 text-right w-32">Running Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-sans text-xs">
                          {accFiltered.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-6 text-center text-slate-400 italic font-sans">
                                No transactions recorded for {acc.name} between {fromDate} and {toDate}.
                              </td>
                            </tr>
                          ) : (
                            accFiltered.map((row, idx) => (
                              <tr key={row.id || `${acc.key}-${idx}`} className="hover:bg-slate-50/70 transition font-mono">
                                <td className="px-4 py-2 text-center text-slate-400 text-[10px]">{idx + 1}</td>
                                <td className="px-4 py-2 text-slate-600 whitespace-nowrap text-[11px]">{row.date}</td>
                                <td className="px-4 py-2 font-bold text-slate-700 whitespace-nowrap uppercase text-[11px]">
                                  {row.reference?.toLowerCase().startsWith('tx-') ? (() => {
                                    const cleanId = row.reference.toLowerCase();
                                    const matchedTx = transactions.find(t => t.id.toLowerCase() === cleanId || cleanId.includes(t.id.toLowerCase()));
                                    return matchedTx ? getFormattedPoNumber(matchedTx, transactions) : row.reference;
                                  })() : row.reference}
                                </td>
                                <td className="px-4 py-2 text-slate-900 font-sans font-medium text-[11px]">{row.description}</td>
                                <td className="px-4 py-2 text-right font-bold text-emerald-600 whitespace-nowrap text-[11px]">
                                  {row.type === 'In' ? `Rs. ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                                </td>
                                <td className="px-4 py-2 text-right font-bold text-rose-600 whitespace-nowrap text-[11px]">
                                  {row.type === 'Out' ? `Rs. ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                                </td>
                                <td className="px-4 py-2 text-right font-black text-slate-900 whitespace-nowrap text-[11px]">
                                  Rs. {row.runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 font-bold border-t-2 border-slate-200 text-xs text-slate-900 font-mono">
                            <td colSpan={4} className="px-4 py-2.5 uppercase">
                              {acc.name} Subtotal ({accFiltered.length} Entries)
                            </td>
                            <td className="px-4 py-2.5 text-right text-emerald-700 font-black whitespace-nowrap">
                              Rs. {totalIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-2.5 text-right text-rose-700 font-black whitespace-nowrap">
                              Rs. {totalOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-2.5 text-right font-black text-slate-950 whitespace-nowrap">
                              Rs. {acc.data.finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })}

              {/* Total of All Accounts Combined Section */}
              <div className="space-y-2 break-inside-avoid border-2 border-slate-900 rounded-2xl p-5 bg-white shadow-sm font-mono">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      TOTAL OF ALL ACCOUNTS (ECOSYSTEM RECONCILIATION SUMMARY)
                    </h3>
                    <p className="text-[10px] text-slate-500 font-sans">Comprehensive financial position across all 5 liquid reserves & credit receivables.</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 rounded text-slate-700">
                    Period: {fromDate} to {toDate}
                  </span>
                </div>

                <table className="w-full text-left text-xs border-collapse font-mono mt-3">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-700 uppercase">
                      <th className="py-2 px-3">Account Category</th>
                      <th className="py-2 px-3 text-center">Bucket</th>
                      <th className="py-2 px-3 text-right text-emerald-800">Inflows in Period</th>
                      <th className="py-2 px-3 text-right text-rose-800">Outflows in Period</th>
                      <th className="py-2 px-3 text-right font-bold">Closing Balance ({toDate})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    <tr>
                      <td className="py-2 px-3 font-bold">1. Physical Cash in Hand</td>
                      <td className="py-2 px-3 text-center text-slate-500">CASH</td>
                      <td className="py-2 px-3 text-right text-emerald-700">Rs. {cashLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'In').reduce((s, e) => s + e.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-3 text-right text-rose-700">Rs. {cashLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'Out').reduce((s, e) => s + e.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-3 text-right font-black">Rs. {cashLedger.finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold">2. Rastriya Banijya Bank Current</td>
                      <td className="py-2 px-3 text-center text-slate-500">RBB</td>
                      <td className="py-2 px-3 text-right text-emerald-700">Rs. {rbbLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'In').reduce((s, e) => s + e.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-3 text-right text-rose-700">Rs. {rbbLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'Out').reduce((s, e) => s + e.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-3 text-right font-black">Rs. {rbbLedger.finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold">3. eSewa Digital Wallet</td>
                      <td className="py-2 px-3 text-center text-slate-500">ESEWA</td>
                      <td className="py-2 px-3 text-right text-emerald-700">Rs. {esewaLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'In').reduce((s, e) => s + e.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-3 text-right text-rose-700">Rs. {esewaLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'Out').reduce((s, e) => s + e.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-3 text-right font-black">Rs. {esewaLedger.finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold">4. Sahakari Cooperative Savings</td>
                      <td className="py-2 px-3 text-center text-slate-500">SAHAKARI</td>
                      <td className="py-2 px-3 text-right text-emerald-700">Rs. {sahakariLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'In').reduce((s, e) => s + e.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-3 text-right text-rose-700">Rs. {sahakariLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'Out').reduce((s, e) => s + e.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-3 text-right font-black">Rs. {sahakariLedger.finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-indigo-900">5. Customer Credit Due (Receivables)</td>
                      <td className="py-2 px-3 text-center text-slate-500">DUE</td>
                      <td className="py-2 px-3 text-right text-emerald-700">Rs. {dueLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'In').reduce((s, e) => s + e.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-3 text-right text-rose-700">Rs. {dueLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'Out').reduce((s, e) => s + e.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-3 text-right font-black text-indigo-900">Rs. {dueLedger.finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300 text-xs">
                      <td colSpan={2} className="py-2 px-3 uppercase">Total Liquid Reserves (1 - 4)</td>
                      <td className="py-2 px-3 text-right text-emerald-800">
                        Rs. {(
                          cashLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'In').reduce((s, e) => s + e.amount, 0) +
                          rbbLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'In').reduce((s, e) => s + e.amount, 0) +
                          esewaLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'In').reduce((s, e) => s + e.amount, 0) +
                          sahakariLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'In').reduce((s, e) => s + e.amount, 0)
                        ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right text-rose-800">
                        Rs. {(
                          cashLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'Out').reduce((s, e) => s + e.amount, 0) +
                          rbbLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'Out').reduce((s, e) => s + e.amount, 0) +
                          esewaLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'Out').reduce((s, e) => s + e.amount, 0) +
                          sahakariLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'Out').reduce((s, e) => s + e.amount, 0)
                        ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-black text-emerald-900">
                        Rs. {(cashLedger.finalBalance + rbbLedger.finalBalance + esewaLedger.finalBalance + sahakariLedger.finalBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="bg-slate-900 text-white font-black border-t-2 border-slate-950 text-xs">
                      <td colSpan={2} className="py-2.5 px-3 uppercase">Grand Total of All 5 Accounts (Ecosystem Position)</td>
                      <td className="py-2.5 px-3 text-right text-emerald-300">
                        Rs. {(
                          cashLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'In').reduce((s, e) => s + e.amount, 0) +
                          rbbLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'In').reduce((s, e) => s + e.amount, 0) +
                          esewaLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'In').reduce((s, e) => s + e.amount, 0) +
                          sahakariLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'In').reduce((s, e) => s + e.amount, 0) +
                          dueLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'In').reduce((s, e) => s + e.amount, 0)
                        ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-300">
                        Rs. {(
                          cashLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'Out').reduce((s, e) => s + e.amount, 0) +
                          rbbLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'Out').reduce((s, e) => s + e.amount, 0) +
                          esewaLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'Out').reduce((s, e) => s + e.amount, 0) +
                          sahakariLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'Out').reduce((s, e) => s + e.amount, 0) +
                          dueLedger.ledger.filter(e => isWithinPeriod(e.date) && e.type === 'Out').reduce((s, e) => s + e.amount, 0)
                        ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-amber-300">
                        Rs. {(cashLedger.finalBalance + rbbLedger.finalBalance + esewaLedger.finalBalance + sahakariLedger.finalBalance + dueLedger.finalBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Prepared By   Approved By Signatures */}
              <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs font-mono break-inside-avoid">
                <div>
                  <div className="border-b border-slate-400 h-10 w-48 mx-auto mb-2"></div>
                  <span className="font-bold block text-slate-900">{currentUser.name}</span>
                  <span className="text-[10px] text-slate-500">Prepared By (Finance / Operations Incharge)</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 h-10 w-48 mx-auto mb-2"></div>
                  <span className="font-bold block text-emerald-900">@reliableadmin (Arpan Khadka)</span>
                  <span className="text-[10px] text-slate-500">Approved & Certified (@reliableadmin)</span>
                </div>
              </div>
            </div>

            {/* Display Mode 2: SINGLE ACCOUNT TAB DETAILS */}
            {ledgerDisplayMode === 'single' && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden print:hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase font-mono tracking-wider">
                      MULTI-ACCOUNT BALANCE LEDGER: {
                        activeLedgerAccount === 'RBB' ? 'RASTRIYA BANIJYA BANK (RBB)' :
                        activeLedgerAccount === 'SAHAKARI' ? 'SAHAKARI COOPERATIVES' :
                        activeLedgerAccount === 'ESEWA' ? 'ESEWA WALLET' :
                        activeLedgerAccount === 'CASH' ? 'CASH IN HAND' :
                        'CUSTOMER CREDIT DUES (DUE)'
                      }
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-sans">Showing double-entry transaction trails and running balances up to {toDate}.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Active Bucket:</span>
                    <span className="px-2.5 py-1 text-xs font-black bg-slate-900 text-white rounded-lg font-mono">{activeLedgerAccount}</span>
                  </div>
                </div>

                {/* Statement Data Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 uppercase font-mono tracking-wider text-[10px]">
                        <th className="px-6 py-4 font-bold">Transaction Date</th>
                        <th className="px-6 py-4 font-bold font-mono">Reference No</th>
                        <th className="px-6 py-4 font-bold">Particulars / Source Details</th>
                        <th className="px-6 py-4 font-bold text-right text-emerald-700">Deposits (In)</th>
                        <th className="px-6 py-4 font-bold text-right text-rose-600">Withdrawals (Out)</th>
                        <th className="px-6 py-4 font-bold text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700 font-sans">
                      {(() => {
                        const singleFiltered = activeLedgerData.ledger.filter(e => isWithinPeriod(e.date));
                        const totalIn = singleFiltered.filter(e => e.type === 'In').reduce((s, e) => s + e.amount, 0);
                        const totalOut = singleFiltered.filter(e => e.type === 'Out').reduce((s, e) => s + e.amount, 0);

                        if (singleFiltered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">
                                No accounting trail found for {activeLedgerAccount} between {fromDate} and {toDate}.
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <>
                            {singleFiltered.map((row, idx) => (
                              <tr key={row.id} className="hover:bg-slate-50/50 transition">
                                <td className="px-6 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">{row.date}</td>
                                <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-600 whitespace-nowrap uppercase">
                                  {row.reference.toLowerCase().startsWith('tx-') ? (() => {
                                    const cleanId = row.reference.toLowerCase();
                                    const matchedTx = transactions.find(t => t.id.toLowerCase() === cleanId || cleanId.includes(t.id.toLowerCase()));
                                    return matchedTx ? getFormattedPoNumber(matchedTx, transactions) : row.reference;
                                  })() : row.reference}
                                </td>
                                <td className="px-6 py-3.5 text-slate-800 font-medium">{row.description}</td>
                                <td className="px-6 py-3.5 text-right font-mono font-bold text-emerald-600">
                                  {row.type === 'In' ? `Rs. ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                                </td>
                                <td className="px-6 py-3.5 text-right font-mono font-bold text-rose-600">
                                  {row.type === 'Out' ? `Rs. ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                                </td>
                                <td className="px-6 py-3.5 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                                  Rs. {row.runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-slate-50 font-bold border-t-2 border-slate-200 text-xs text-slate-900 font-mono">
                              <td colSpan={3} className="px-6 py-3 uppercase">
                                Total for {activeLedgerAccount} ({singleFiltered.length} Entries in Selected Range)
                              </td>
                              <td className="px-6 py-3 text-right text-emerald-700 font-black whitespace-nowrap">
                                Rs. {totalIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-6 py-3 text-right text-rose-700 font-black whitespace-nowrap">
                                Rs. {totalOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-6 py-3 text-right font-black text-slate-950 whitespace-nowrap">
                                Rs. {activeLedgerData.finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        );
      })()}

      {reportType === 'assets_registry' && (() => {
        const handleDownloadAssetsCSV = () => {
          const headers = [
            'Asset Code',
            'Asset Name',
            'Type',
            'Qty',
            ...(currentUser?.role === 'Admin' ? ['Cost Price (Rs.)', 'Total Cost (Rs.)'] : []),
            'Purchase Date',
            'Status',
            'Release Reference',
            'Release Meeting No',
            'Release Meeting Date',
            'Release Decision No',
            'Release Notes',
            'Release Remarks',
            'Released Date'
          ];

          const rows = assets.map(asset => {
            return [
              asset.assetCode,
              asset.name,
              asset.type,
              asset.quantity,
              ...(currentUser?.role === 'Admin' ? [asset.costPrice, asset.costPrice * asset.quantity] : []),
              asset.purchaseDate,
              asset.status,
              asset.releaseInfo?.referenceNumber || '',
              asset.releaseInfo?.meetingNumber || '',
              asset.releaseInfo?.meetingDate || '',
              asset.releaseInfo?.decisionNumber || '',
              asset.releaseInfo?.note || '',
              asset.releaseInfo?.remarks || '',
              asset.releaseInfo?.releasedAt || ''
            ];
          });

          const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', `RTSS_Assets_Report_${getCurrentBsDate()}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        return (
          <div className="space-y-6 animate-fade-in">
            {/* Header Control banner inside the report */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase font-mono tracking-wider">Office Assets Registry Statement</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 font-sans">Comprehensive list of Durable & Non-Durable corporate items bought for official use and logged releases.</p>
              </div>
              <button
                onClick={handleDownloadAssetsCSV}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer self-start sm:self-center"
              >
                <span>📥 Download Assets CSV Report</span>
              </button>
            </div>

            {/* Assets Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 uppercase font-mono tracking-wider text-[10px]">
                      <th className="px-6 py-4 font-bold">Asset Code</th>
                      <th className="px-6 py-4 font-bold">Asset Name</th>
                      <th className="px-6 py-4 font-bold text-center">Type</th>
                      <th className="px-6 py-4 font-bold text-center">Qty</th>
                      {currentUser?.role === 'Admin' && (
                        <>
                          <th className="px-6 py-4 font-bold text-right">Unit Cost</th>
                          <th className="px-6 py-4 font-bold text-right">Total Cost</th>
                        </>
                      )}
                      <th className="px-6 py-4 font-bold text-center">Purchase Date</th>
                      <th className="px-6 py-4 font-bold text-center">Status</th>
                      <th className="px-6 py-4 font-bold">Release / Reference Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700 font-sans">
                    {assets.length === 0 ? (
                      <tr>
                        <td colSpan={currentUser?.role === 'Admin' ? 9 : 7} className="px-6 py-12 text-center text-slate-400 italic">
                          No corporate assets recorded in the system database.
                        </td>
                      </tr>
                    ) : (
                      assets.map(asset => (
                        <tr key={asset.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-600 whitespace-nowrap">{asset.assetCode}</td>
                          <td className="px-6 py-3.5 font-semibold text-slate-900">{asset.name}</td>
                          <td className="px-6 py-3.5 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                              asset.type === 'Durable' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {asset.type}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-center font-mono font-medium">{asset.quantity}</td>
                          {currentUser?.role === 'Admin' && (
                            <>
                              <td className="px-6 py-3.5 text-right font-mono text-slate-600">Rs. {asset.costPrice.toLocaleString()}</td>
                              <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-900">Rs. {(asset.costPrice * asset.quantity).toLocaleString()}</td>
                            </>
                          )}
                          <td className="px-6 py-3.5 text-center font-mono text-slate-500">{asset.purchaseDate}</td>
                          <td className="px-6 py-3.5 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              asset.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {asset.status}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-xs max-w-xs">
                            {asset.status === 'Released' && asset.releaseInfo ? (
                              <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <p className="font-bold text-slate-800 text-[10px] uppercase tracking-wider font-mono">Ref: {asset.releaseInfo.referenceNumber}</p>
                                <p className="text-[10px] text-slate-500"><strong>Meeting:</strong> #{asset.releaseInfo.meetingNumber} | <strong>Date:</strong> {asset.releaseInfo.meetingDate}</p>
                                <p className="text-[10px] text-slate-500"><strong>Decision:</strong> #{asset.releaseInfo.decisionNumber}</p>
                                <p className="text-[11px] text-slate-700 italic mt-1 font-medium">"{asset.releaseInfo.note}"</p>
                                {asset.releaseInfo.remarks && (
                                  <p className="text-[9px] text-rose-600 font-bold mt-1">Remarks: {asset.releaseInfo.remarks}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Print Friendly Signature Block (Visible in Print Only) */}
            <div className="hidden print:block mt-16 pt-10 border-t border-dashed border-slate-300">
              <div className="grid grid-cols-3 gap-8 text-center text-xs text-slate-600">
                <div>
                  <div className="border-b border-slate-300 h-10 w-44 mx-auto"></div>
                  <p className="mt-2 font-semibold">Prepared By (Inventory Specialist)</p>
                </div>
                <div>
                  <div className="border-b border-slate-300 h-10 w-44 mx-auto"></div>
                  <p className="mt-2 font-semibold">Audited By (Authorized Auditor)</p>
                </div>
                <div>
                  <div className="border-b border-slate-300 h-10 w-44 mx-auto"></div>
                  <p className="mt-2 font-semibold">Approved By (Mr. Arpan Khadka)</p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {reportType === 'account_summary' && (() => {
        // Date range helper
        const getPeriodDateRange = () => {
          return { start: fromDate, end: toDate };
        };

        const { start: pStart, end: pEnd } = getPeriodDateRange();

        // 1. Income Statement calculations
        const grossRevenue = totalBilledIncome;

        // Cost of Goods Sold (COGS)
        const poExpensesVal = filteredExpenses.filter(e => e.category === 'Purchase Order').reduce((sum, e) => sum + e.amount, 0);
        const officeSuppliesVal = filteredExpenses.filter(e => e.category === 'Office Supplies').reduce((sum, e) => sum + e.amount, 0);
        const poTransactionsVal = transactions
          .filter(tx => tx.status !== 'Rejected' && tx.status !== 'Ordered' && isWithinPeriod(tx.date))
          .reduce((sum, tx) => sum + (tx.amountPaid + tx.amountDue), 0);
        const finalCOGS = poExpensesVal > 0 ? (poExpensesVal + officeSuppliesVal) : (poTransactionsVal + officeSuppliesVal);

        // Gross Profit
        const grossProfitVal = grossRevenue - finalCOGS;

        // Operating Expenses (OPEX)
        const rentOPEX = filteredExpenses.filter(e => e.category === 'Rent').reduce((sum, e) => sum + e.amount, 0);
        const salaryOPEX = filteredExpenses.filter(e => e.category === 'Salary').reduce((sum, e) => sum + e.amount, 0);
        const shareholderVal = filteredExpenses.filter(e => e.category === 'Shareholder Payout').reduce((sum, e) => sum + e.amount, 0);
        const utilitiesVal = filteredExpenses.filter(e => e.category === 'Utilities' || e.category === 'Maintenance').reduce((sum, e) => sum + e.amount, 0);
        const otherExpensesVal = filteredExpenses.filter(e => e.category === 'Others').reduce((sum, e) => sum + e.amount, 0);
        const totalOPEX = rentOPEX + salaryOPEX + shareholderVal + utilitiesVal + otherExpensesVal;

        // Net Operating Profit
        const netOperatingProfit = grossProfitVal - totalOPEX;

        // 2. Expense Statement Source Account Disbursements
        const disbursedCash = filteredExpenses.filter(e => e.paymentMethod === 'Cash' || e.account === 'CASH').reduce((sum, e) => sum + e.amount, 0);
        const disbursedRBB = filteredExpenses.filter(e => e.paymentMethod === 'Bank' || e.account === 'RBB').reduce((sum, e) => sum + e.amount, 0);
        const disbursedEsewa = filteredExpenses.filter(e => e.paymentMethod === 'eSewa' || e.account === 'ESEWA').reduce((sum, e) => sum + e.amount, 0);
        const disbursedSahakari = filteredExpenses.filter(e => e.paymentMethod === 'Sahakari' || e.account === 'SAHAKARI').reduce((sum, e) => sum + e.amount, 0);

        // 3. Balance Sheet calculations (As of selected date)
        const cashBal = getAccountLedger('CASH', toDate).finalBalance;
        const esewaBal = getAccountLedger('ESEWA', toDate).finalBalance;
        const sahakariBal = getAccountLedger('SAHAKARI', toDate).finalBalance;
        const rbbBal = getAccountLedger('RBB', toDate).finalBalance;
        const dueBal = getAccountLedger('DUE', toDate).finalBalance;
        const totalCashBalances = cashBal + esewaBal + sahakariBal + rbbBal;

        // Live Current Balances (As of today)
        const liveCash = getAccountLedger('CASH', '9999/12/31').finalBalance;
        const liveRbb = getAccountLedger('RBB', '9999/12/31').finalBalance;
        const liveEsewa = getAccountLedger('ESEWA', '9999/12/31').finalBalance;
        const liveSahakari = getAccountLedger('SAHAKARI', '9999/12/31').finalBalance;
        const liveDue = getAccountLedger('DUE', '9999/12/31').finalBalance;
        const liveTotalCash = liveCash + liveRbb + liveEsewa + liveSahakari;

        // Accounts Receivable
        const accountsReceivable = invoices.filter(inv => inv.date <= toDate).reduce((sum, inv) => sum + inv.dueAmount, 0);

        // Inventory Stock valuation
        const inventoryValuationVal = inventoryStock.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0);

        // Non-Current Assets
        const fixedAssetsVal = (assets || []).filter(a => a.status === 'Active' && a.purchaseDate <= toDate).reduce((sum, a) => sum + (a.costPrice * a.quantity), 0);

        // Total Assets
        const totalAssetsVal = totalCashBalances + accountsReceivable + inventoryValuationVal + fixedAssetsVal;

        // Liabilities
        const accountsPayable = transactions.filter(tx => tx.status !== 'Rejected' && tx.status !== 'Ordered' && tx.date <= toDate).reduce((sum, tx) => sum + tx.amountDue, 0);
        const totalLiabilitiesVal = accountsPayable;

        // Equity
        const totalEquityVal = totalAssetsVal - totalLiabilitiesVal;
        const cumulativeRevenue = invoices.filter(inv => inv.date <= toDate).reduce((sum, inv) => sum + inv.finalAmount, 0);
        const cumulativeExpenses = expenses.filter(exp => exp.status === 'Approved' && exp.date <= toDate).reduce((sum, exp) => sum + exp.amount, 0);
        const retainedEarningsVal = cumulativeRevenue - cumulativeExpenses;
        const initialCapitalVal = (openingBalances?.CASH?.openingBalance || 0) + (openingBalances?.ESEWA?.openingBalance || 0) + (openingBalances?.SAHAKARI?.openingBalance || 0) + (openingBalances?.RBB?.openingBalance || 0);

        // 4. Cash Flow Statement calculations
        const getAccountBalanceBeforePeriod = (accKey: 'RBB' | 'ESEWA' | 'SAHAKARI' | 'CASH') => {
          const fullLedger = getAccountLedger(accKey, toDate).ledger;
          const entriesBefore = fullLedger.filter(e => e.date < pStart);
          if (entriesBefore.length === 0) return 0;
          return entriesBefore[entriesBefore.length - 1].runningBalance;
        };

        const openingCash = getAccountBalanceBeforePeriod('CASH') + getAccountBalanceBeforePeriod('ESEWA') + getAccountBalanceBeforePeriod('SAHAKARI') + getAccountBalanceBeforePeriod('RBB');
        const closingCash = totalCashBalances;

        let totalCashInflow = 0;
        let totalCashOutflow = 0;
        
        (['CASH', 'ESEWA', 'SAHAKARI', 'RBB'] as const).forEach(acc => {
          const ledgerData = getAccountLedger(acc, toDate).ledger;
          const periodEntries = ledgerData.filter(e => e.date >= pStart && e.date <= toDate);
          periodEntries.forEach(e => {
            if (e.description.startsWith('Inter-Account Transfer')) return;
            if (e.description.startsWith('Cash Withdrawal') && e.reference === 'OP-BAL') return;
            
            if (e.type === 'In') {
              if (e.description !== 'Initial Opening Balance (System Setup)') {
                totalCashInflow += e.amount;
              }
            } else {
              totalCashOutflow += e.amount;
            }
          });
        });

        const netCashFlowVal = totalCashInflow - totalCashOutflow;

        // Executive Summary Texts
        const netProfitPct = grossRevenue > 0 ? (netOperatingProfit / grossRevenue) * 100 : 0;
        
        let simpleProfitStatus = '';
        if (netOperatingProfit > 0) {
          simpleProfitStatus = `Profit: Made Rs. ${netOperatingProfit.toLocaleString()} profit on total sales of Rs. ${grossRevenue.toLocaleString()} (${netProfitPct.toFixed(1)}% profit margin).`;
        } else if (netOperatingProfit < 0) {
          simpleProfitStatus = `Loss: Had an operational loss of Rs. ${Math.abs(netOperatingProfit).toLocaleString()} on total sales of Rs. ${grossRevenue.toLocaleString()}.`;
        } else {
          simpleProfitStatus = `Break-Even: Total sales were Rs. ${grossRevenue.toLocaleString()} and net profit was Rs. 0 (neither profit nor loss).`;
        }

        let simpleCashStatus = `Cash Movement: Received Rs. ${totalCashInflow.toLocaleString()} in cash and spent Rs. ${totalCashOutflow.toLocaleString()} on purchases, salaries, and expenses (net cash change: ${netCashFlowVal >= 0 ? '+' : ''}Rs. ${netCashFlowVal.toLocaleString()}). Total cash in hand and bank accounts moved from Rs. ${openingCash.toLocaleString()} to Rs. ${closingCash.toLocaleString()}.`;

        let simpleAssetsStatus = `Total Business Wealth (Assets): Rs. ${totalAssetsVal.toLocaleString()} (includes Rs. ${inventoryValuationVal.toLocaleString()} in stock/inventory and Rs. ${closingCash.toLocaleString()} in liquid cash).`;

        let simpleDebtsStatus = '';
        let debtSeverity: 'good' | 'warning' | 'neutral' = 'neutral';
        if (accountsPayable > 0) {
          if (totalCashBalances >= accountsPayable) {
            debtSeverity = 'good';
            simpleDebtsStatus = `Supplier Debts: You owe Rs. ${accountsPayable.toLocaleString()} to suppliers. You have enough cash (Rs. ${totalCashBalances.toLocaleString()}) to easily pay them off.`;
          } else {
            debtSeverity = 'warning';
            simpleDebtsStatus = `Supplier Debts & Action Needed: You owe Rs. ${accountsPayable.toLocaleString()} to suppliers, but only have Rs. ${totalCashBalances.toLocaleString()} in liquid cash (Shortfall of Rs. ${(accountsPayable - totalCashBalances).toLocaleString()}). Please collect pending customer dues to clear supplier bills on time.`;
          }
        } else {
          debtSeverity = 'good';
          simpleDebtsStatus = `Supplier Debts: Zero debt! You do not owe any money to suppliers.`;
        }

        return (
          <div className="space-y-8 animate-fade-in print:space-y-6">
            
            {/* Executive Summary Note Panel */}
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5 print:bg-white print:text-slate-900 print:border-slate-200 print:p-4 print:shadow-none">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 print:border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg print:bg-slate-100 print:text-emerald-600">
                    <Info size={18} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 print:text-slate-500">Simple Business Summary</h4>
                    <h3 className="text-sm font-black tracking-tight text-white print:text-slate-900">Current Situation & Financial Health Overview</h3>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700 print:hidden font-semibold">
                  Period: {pStart} to {toDate}
                </span>
              </div>

              {/* Quick scannable status grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-1">
                  <div className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                    <span>📈</span> Profit & Loss
                  </div>
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    {simpleProfitStatus}
                  </p>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-1">
                  <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                    <span>💵</span> Cash Movement
                  </div>
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    {simpleCashStatus}
                  </p>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-1">
                  <div className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                    <span>📦</span> Business Wealth & Stock
                  </div>
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    {simpleAssetsStatus}
                  </p>
                </div>

                <div className={`border rounded-xl p-3.5 space-y-1 ${
                  debtSeverity === 'warning' 
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200' 
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-200'
                }`}>
                  <div className={`text-[11px] font-bold flex items-center gap-1.5 ${
                    debtSeverity === 'warning' ? 'text-amber-400 font-black' : 'text-emerald-300'
                  }`}>
                    <span>{debtSeverity === 'warning' ? '🚨' : '✅'}</span> Supplier Debts & Action
                  </div>
                  <p className="text-xs font-medium leading-relaxed">
                    {simpleDebtsStatus}
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 1 & SECTION 2: Income Statement & Expense Statement */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 print:grid-cols-1 print:gap-4">
              
              {/* 1. INCOME STATEMENT */}
              <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-3xs flex flex-col justify-between print:p-4 print:shadow-none print:border-slate-200">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-900 text-sm font-display uppercase tracking-tight">1. Income Statement</h3>
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Sales & Margin Overview</span>
                  </div>

                  <div className="space-y-3 text-xs font-sans">
                    {/* Revenue Section */}
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-500 uppercase tracking-wide font-mono text-[9px]">Revenue</h4>
                      <div className="flex justify-between py-1.5 px-2 hover:bg-slate-50 rounded">
                        <span className="text-slate-700 font-medium">Gross Billed Sales Revenue</span>
                        <span className="font-mono font-bold text-slate-900">Rs. {grossRevenue.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* COGS Section */}
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-500 uppercase tracking-wide font-mono text-[9px]">Cost of Sales</h4>
                      <div className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded pl-4 text-slate-600">
                        <span>Raw Inventory Cost & Purchases</span>
                        <span className="font-mono">Rs. {(poExpensesVal > 0 ? poExpensesVal : poTransactionsVal).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded pl-4 text-slate-600">
                        <span>Office Supplies & Tools Expense</span>
                        <span className="font-mono">Rs. {officeSuppliesVal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1.5 px-2 bg-slate-50 rounded font-bold">
                        <span className="text-slate-800">Total Cost of Goods Sold (COGS)</span>
                        <span className="font-mono text-slate-900">Rs. {finalCOGS.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Gross Profit Callout */}
                    <div className="flex justify-between py-1.5 px-2 bg-indigo-50/40 rounded font-bold border border-indigo-100/50">
                      <span className="text-indigo-900">Gross Profit (Margin)</span>
                      <span className="font-mono text-indigo-900">Rs. {grossProfitVal.toLocaleString()} ({(grossRevenue > 0 ? (grossProfitVal / grossRevenue) * 100 : 0).toFixed(1)}%)</span>
                    </div>

                    {/* OPEX Section */}
                    <div className="space-y-1 pt-1">
                      <h4 className="font-bold text-slate-500 uppercase tracking-wide font-mono text-[9px]">Operating Expenditures (OPEX)</h4>
                      <div className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded pl-4 text-slate-600">
                        <span>Rental Payments & Leases</span>
                        <span className="font-mono">Rs. {rentOPEX.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded pl-4 text-slate-600">
                        <span>Staff Salaries & Allowance Wages</span>
                        <span className="font-mono">Rs. {salaryOPEX.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded pl-4 text-slate-600">
                        <span>Shareholder Payouts & Misc</span>
                        <span className="font-mono">Rs. {(shareholderVal + otherExpensesVal).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1.5 px-2 bg-slate-50 rounded font-bold">
                        <span className="text-slate-800">Total Operating Expenses</span>
                        <span className="font-mono text-slate-900">Rs. {totalOPEX.toLocaleString()}</span>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                  <span className="text-xs font-black text-indigo-900 uppercase">Net Profit / Surplus</span>
                  <span className={`text-sm font-black font-mono ${netOperatingProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    Rs. {netOperatingProfit.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 2. EXPENSE STATEMENT */}
              <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-3xs flex flex-col justify-between print:p-4 print:shadow-none print:border-slate-200">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-sm font-display uppercase tracking-tight">2. Expense Statement</h3>
                      <span className="bg-rose-50 text-rose-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-rose-100">
                        {filteredExpenses.length} Records
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Operating Outflows</span>
                  </div>

                  {/* Category Breakdown */}
                  <div className="space-y-3 text-xs font-sans">
                    <h4 className="font-bold text-slate-500 uppercase tracking-wide font-mono text-[9px]">Expenditure Category Breakdown</h4>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded text-slate-700">
                        <span className="font-medium">Rent & Facility Lease Payments</span>
                        <span className="font-mono font-bold">Rs. {rentOPEX.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded text-slate-700">
                        <span className="font-medium">Staff Salaries, Wages & Allowances</span>
                        <span className="font-mono font-bold">Rs. {salaryOPEX.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded text-slate-700">
                        <span className="font-medium">Purchase Orders & Restock Purchases</span>
                        <span className="font-mono font-bold">Rs. {(poExpensesVal > 0 ? poExpensesVal : poTransactionsVal).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded text-slate-700">
                        <span className="font-medium">Office Supplies, Tools & Maintenance</span>
                        <span className="font-mono font-bold">Rs. {officeSuppliesVal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded text-slate-700">
                        <span className="font-medium">Utilities & Facility Infrastructure</span>
                        <span className="font-mono font-bold">Rs. {utilitiesVal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded text-slate-700">
                        <span className="font-medium">Shareholder Dividend Payouts</span>
                        <span className="font-mono font-bold">Rs. {shareholderVal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded text-slate-700">
                        <span className="font-medium">Other Operating Expenditures</span>
                        <span className="font-mono font-bold">Rs. {otherExpensesVal.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Payment Account Disbursement Summary */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <h4 className="font-bold text-slate-500 uppercase tracking-wide font-mono text-[9px]">Disbursements By Account</h4>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-slate-50 p-2 rounded border border-slate-100 flex justify-between">
                          <span className="text-slate-600 font-medium">Cash Drawer:</span>
                          <span className="font-mono font-bold text-slate-800">Rs. {disbursedCash.toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100 flex justify-between">
                          <span className="text-slate-600 font-medium">RBB Bank:</span>
                          <span className="font-mono font-bold text-slate-800">Rs. {disbursedRBB.toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100 flex justify-between">
                          <span className="text-slate-600 font-medium">eSewa Wallet:</span>
                          <span className="font-mono font-bold text-slate-800">Rs. {disbursedEsewa.toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100 flex justify-between">
                          <span className="text-slate-600 font-medium">Sahakari:</span>
                          <span className="font-mono font-bold text-slate-800">Rs. {disbursedSahakari.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                  <span className="text-xs font-black text-rose-900 uppercase">Total Approved Expenditures</span>
                  <span className="text-sm font-black font-mono text-rose-700">
                    Rs. {totalExpenditure.toLocaleString()}
                  </span>
                </div>
              </div>

            </div>

            {/* SECTION 3 & SECTION 4: Balance Sheet & Cash Flow Statement */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 print:grid-cols-1 print:gap-4">
              
              {/* 3. BALANCE SHEET */}
              <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-3xs flex flex-col justify-between print:p-4 print:shadow-none print:border-slate-200">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-900 text-sm font-display uppercase tracking-tight">3. Balance Sheet</h3>
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Financial Position Snapshot</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                    
                    {/* ASSETS SIDE */}
                    <div className="space-y-3">
                      <h4 className="font-black text-indigo-900 uppercase tracking-wide font-mono text-[9px] border-b border-indigo-100 pb-1">Assets (Dr.)</h4>
                      
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase font-bold text-slate-400 font-mono">Current Assets</span>
                        <div className="flex justify-between py-1 px-1.5 hover:bg-slate-50 rounded pl-2 text-slate-650">
                          <span>Liquid Cash & Bank</span>
                          <span className="font-mono font-semibold">Rs. {totalCashBalances.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1 px-1.5 hover:bg-slate-50 rounded pl-2 text-slate-650">
                          <span>Accounts Receivable</span>
                          <span className="font-mono font-semibold">Rs. {accountsReceivable.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1 px-1.5 hover:bg-slate-50 rounded pl-2 text-slate-650">
                          <span>Inventory Assets</span>
                          <span className="font-mono font-semibold">Rs. {inventoryValuationVal.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase font-bold text-slate-400 font-mono">Non-Current Assets</span>
                        <div className="flex justify-between py-1 px-1.5 hover:bg-slate-50 rounded pl-2 text-slate-650">
                          <span>Office Assets & Equip</span>
                          <span className="font-mono font-semibold">Rs. {fixedAssetsVal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* LIABILITIES & EQUITY SIDE */}
                    <div className="space-y-3 border-l border-slate-100 pl-4 md:border-l print:pl-3">
                      <h4 className="font-black text-slate-800 uppercase tracking-wide font-mono text-[9px] border-b border-slate-200 pb-1">Liabilities & Equity (Cr.)</h4>

                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase font-bold text-slate-400 font-mono">Current Liabilities</span>
                        <div className="flex justify-between py-1 px-1.5 hover:bg-slate-50 rounded pl-2 text-slate-650">
                          <span>Supplier Trade Payables</span>
                          <span className="font-mono font-semibold">Rs. {accountsPayable.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase font-bold text-slate-400 font-mono">Owner's Equity</span>
                        <div className="flex justify-between py-1 px-1.5 hover:bg-slate-50 rounded pl-2 text-slate-650">
                          <span>Paid-in Owner Capital</span>
                          <span className="font-mono font-semibold">Rs. {initialCapitalVal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1 px-1.5 hover:bg-slate-50 rounded pl-2 text-slate-650">
                          <span>Retained Earnings</span>
                          <span className={`font-mono font-semibold ${retainedEarningsVal >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                            Rs. {retainedEarningsVal.toLocaleString()}
                          </span>
                        </div>
                        {totalEquityVal - (initialCapitalVal + retainedEarningsVal) !== 0 && (
                          <div className="flex justify-between py-1 px-1.5 hover:bg-slate-50 rounded pl-2 text-slate-600">
                            <span>Equity Adjustment</span>
                            <span className="font-mono font-semibold text-slate-500">
                              Rs. {(totalEquityVal - (initialCapitalVal + retainedEarningsVal)).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100 font-black text-xs uppercase text-slate-900 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                  <div className="flex justify-between pr-2 border-r border-slate-200">
                    <span>Total Assets</span>
                    <span>Rs. {totalAssetsVal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pl-2">
                    <span>Liabilities & Equity</span>
                    <span>Rs. {totalAssetsVal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 4. CASH FLOW STATEMENT */}
              <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-3xs print:p-4 print:shadow-none print:border-slate-200">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                  <h3 className="font-extrabold text-slate-900 text-sm font-display uppercase tracking-tight">4. Cash Flow Statement</h3>
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Realized Cash Receipts & Outflows</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-sans">
                  
                  {/* Cash Inflow Breakdown */}
                  <div className="space-y-2 bg-emerald-50/20 border border-emerald-100/55 p-4 rounded-xl">
                    <h4 className="font-bold text-emerald-900 uppercase font-mono text-[10px] flex items-center gap-1.5">
                      <ArrowUpRight size={14} className="text-emerald-600" />
                      <span>Operating Cash Receipts (A)</span>
                    </h4>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Realized Customer Sales</span>
                        <span className="font-mono font-bold text-emerald-700">Rs. {totalReceivedIncome.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Internal Capital Deposits</span>
                        <span className="font-mono text-emerald-600">Rs. {Math.max(0, totalCashInflow - totalReceivedIncome).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-emerald-100/60 pt-1.5 font-extrabold text-emerald-950">
                        <span>Total Realized Cash In</span>
                        <span className="font-mono">Rs. {totalCashInflow.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cash Outflow Breakdown */}
                  <div className="space-y-2 bg-rose-50/20 border border-rose-100/55 p-4 rounded-xl">
                    <h4 className="font-bold text-rose-900 uppercase font-mono text-[10px] flex items-center gap-1.5">
                      <ArrowDownLeft size={14} className="text-rose-600" />
                      <span>Operating Cash Outflows (B)</span>
                    </h4>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Approved Expense Outflows</span>
                        <span className="font-mono font-bold text-rose-700">Rs. {totalExpenditure.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Asset & Supplier Cash Out</span>
                        <span className="font-mono text-rose-600">Rs. {Math.max(0, totalCashOutflow - totalExpenditure).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-rose-100/60 pt-1.5 font-extrabold text-rose-950">
                        <span>Total Realized Cash Out</span>
                        <span className="font-mono">Rs. {totalCashOutflow.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Reconciliation Statement */}
                  <div className="space-y-2 bg-indigo-50/20 border border-indigo-100/55 p-4 rounded-xl flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-indigo-900 uppercase font-mono text-[10px]">
                        <span>Cash Reconciliation Summary</span>
                      </h4>
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Opening Cash ({pStart})</span>
                          <span className="font-mono font-semibold text-slate-800">Rs. {openingCash.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 font-semibold text-indigo-950">Net Change in Period</span>
                          <span className={`font-mono font-bold ${netCashFlowVal >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {netCashFlowVal >= 0 ? '+' : ''}Rs. {netCashFlowVal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between border-t border-indigo-150 pt-2 font-black text-indigo-950 uppercase text-[11px] font-mono">
                      <span>Closing Cash ({toDate})</span>
                      <span>Rs. {closingCash.toLocaleString()}</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* SECTION 5: CURRENT BALANCE IN EACH ACCOUNT */}
            <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-3xs print:p-4 print:shadow-none print:border-slate-200 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Wallet size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm font-display uppercase tracking-tight">5. Current Balance in Each Account</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Live balances across cash drawer, bank accounts, digital wallets, and customer credit ledgers</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-mono bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-200 font-bold">
                  Live System Accounts
                </span>
              </div>

              {/* Account Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* CASH DRAWER */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <span>💵</span> Cash Drawer
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">CASH</span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Period End ({toDate}):</div>
                    <div className="text-base font-black font-mono text-slate-900">Rs. {cashBal.toLocaleString()}</div>
                  </div>
                  <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-1.5 flex justify-between font-mono">
                    <span>Live Today:</span>
                    <span className="font-bold text-slate-800">Rs. {liveCash.toLocaleString()}</span>
                  </div>
                </div>

                {/* RBB BANK */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <span>🏛️</span> Banijya Bank
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">RBB</span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Period End ({toDate}):</div>
                    <div className="text-base font-black font-mono text-slate-900">Rs. {rbbBal.toLocaleString()}</div>
                  </div>
                  <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-1.5 flex justify-between font-mono">
                    <span>Live Today:</span>
                    <span className="font-bold text-slate-800">Rs. {liveRbb.toLocaleString()}</span>
                  </div>
                </div>

                {/* ESEWA WALLET */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <span>📱</span> eSewa Wallet
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">ESEWA</span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Period End ({toDate}):</div>
                    <div className="text-base font-black font-mono text-slate-900">Rs. {esewaBal.toLocaleString()}</div>
                  </div>
                  <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-1.5 flex justify-between font-mono">
                    <span>Live Today:</span>
                    <span className="font-bold text-slate-800">Rs. {liveEsewa.toLocaleString()}</span>
                  </div>
                </div>

                {/* SAHAKARI SAVINGS */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <span>🏦</span> Sahakari
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">SAHAKARI</span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Period End ({toDate}):</div>
                    <div className="text-base font-black font-mono text-slate-900">Rs. {sahakariBal.toLocaleString()}</div>
                  </div>
                  <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-1.5 flex justify-between font-mono">
                    <span>Live Today:</span>
                    <span className="font-bold text-slate-800">Rs. {liveSahakari.toLocaleString()}</span>
                  </div>
                </div>

                {/* CUSTOMER DUES */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <span>📋</span> Customer Dues
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded">DUE</span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Period End ({toDate}):</div>
                    <div className="text-base font-black font-mono text-cyan-900">Rs. {dueBal.toLocaleString()}</div>
                  </div>
                  <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-1.5 flex justify-between font-mono">
                    <span>Live Today:</span>
                    <span className="font-bold text-slate-800">Rs. {liveDue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Total Liquid Reserves Summary Footer */}
              <div className="bg-indigo-950 text-white rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-3 border border-indigo-900">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <h4 className="font-bold text-xs uppercase font-mono tracking-wider text-indigo-200">Total Consolidated Liquid Cash & Bank Reserves</h4>
                    <p className="text-[11px] text-indigo-300">Combined liquid funds available across Cash Drawer, Banijya Bank, eSewa Wallet, and Sahakari Savings</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-indigo-300 block">Period Total ({toDate}):</span>
                  <span className="text-xl font-black font-mono text-white">Rs. {totalCashBalances.toLocaleString()}</span>
                </div>
              </div>

            </div>

            {/* Print Friendly Signature Block (Visible in Print Only) */}
            <div className="hidden print:block mt-12 pt-8 border-t border-dashed border-slate-300">
              <div className="grid grid-cols-3 gap-8 text-center text-xs text-slate-600">
                <div>
                  <div className="border-b border-slate-300 h-10 w-44 mx-auto"></div>
                  <p className="mt-2 font-semibold">Prepared By (Finance Incharge)</p>
                </div>
                <div>
                  <div className="border-b border-slate-300 h-10 w-44 mx-auto"></div>
                  <p className="mt-2 font-semibold">Audited By (Authorized Auditor)</p>
                </div>
                <div>
                  <div className="border-b border-slate-300 h-10 w-44 mx-auto"></div>
                  <p className="mt-2 font-semibold">Approved By ({profile?.name || 'Management'})</p>
                </div>
              </div>
            </div>

          </div>
        );
      })()}

      {/* OFFICE USE REQUESTS REPORT TABLE */}
      {reportType === 'office_use' && (() => {
        const filteredReqs = officeUseRequests.filter(r => {
          const matchPeriod = isWithinPeriod(r.date);
          const matchSearch = r.itemName.toLowerCase().includes(officeSearchTerm.toLowerCase()) ||
                              r.requestNo.toLowerCase().includes(officeSearchTerm.toLowerCase()) ||
                              r.requestedBy.toLowerCase().includes(officeSearchTerm.toLowerCase()) ||
                              (r.department && r.department.toLowerCase().includes(officeSearchTerm.toLowerCase()));
          const matchStatus = officeStatusFilter === 'All' || r.status === officeStatusFilter;
          return matchPeriod && matchSearch && matchStatus;
        });

        const handleDownloadCSV = () => {
          const headers = ['Request No', 'Date', 'Item Name', 'Quantity', 'Requested By', 'Department', 'Status', 'Approved By', 'Approval Date', 'Remarks'];
          const rows = filteredReqs.map(r => [
            r.requestNo,
            r.date,
            r.itemName,
            r.quantity,
            r.requestedBy,
            r.department || 'Office Use',
            r.status,
            r.approvedBy || '',
            r.approvalDate || '',
            r.remarks || ''
          ]);

          const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', `Office_Use_Requests_Report_${getCurrentBsDate()}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        return (
          <div className="space-y-6 animate-fade-in">
            {/* Control Banner */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase font-mono tracking-wider">Request for Office Use Log</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 font-sans">Official internal stock requisitions recorded for company operations (Deducts stock from inventory only).</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <InteractiveSearchBar
                  value={officeSearchTerm}
                  onChange={setOfficeSearchTerm}
                  placeholder="Search item, request #, employee..."
                  expandedWidth="w-64 sm:w-72"
                  size="sm"
                />
                <select
                  value={officeStatusFilter}
                  onChange={(e) => setOfficeStatusFilter(e.target.value as any)}
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-white text-slate-700 font-medium"
                >
                  <option value="All">All Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <button
                  onClick={handleDownloadCSV}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition cursor-pointer"
                >
                  <span>📥 Export CSV</span>
                </button>
              </div>
            </div>

            {/* Office Use Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 uppercase font-mono tracking-wider text-[10px]">
                      <th className="px-6 py-4 font-bold">Req #</th>
                      <th className="px-6 py-4 font-bold">Date (BS)</th>
                      <th className="px-6 py-4 font-bold">Item Name</th>
                      <th className="px-6 py-4 font-bold">Requested By</th>
                      <th className="px-6 py-4 font-bold">Department</th>
                      <th className="px-6 py-4 font-bold text-center">Qty Consumed</th>
                      <th className="px-6 py-4 font-bold text-center">Status</th>
                      <th className="px-6 py-4 font-bold">Approval Info</th>
                      <th className="px-6 py-4 font-bold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredReqs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-8 text-center text-slate-400 italic">
                          No office use requests recorded for the selected filter period.
                        </td>
                      </tr>
                    ) : (
                      filteredReqs.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-6 py-3.5 font-bold font-mono text-indigo-900">{req.requestNo}</td>
                          <td className="px-6 py-3.5 font-mono text-slate-600">{req.date}</td>
                          <td className="px-6 py-3.5 font-extrabold text-slate-800">{req.itemName}</td>
                          <td className="px-6 py-3.5 font-medium text-slate-700">{req.requestedBy}</td>
                          <td className="px-6 py-3.5 text-slate-600">{req.department || 'Office Use'}</td>
                          <td className="px-6 py-3.5 text-center font-extrabold font-mono text-slate-900">{req.quantity} units</td>
                          <td className="px-6 py-3.5 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              req.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-slate-600 font-mono text-[11px]">
                            {req.approvedBy ? `${req.approvedBy} (${req.approvalDate || ''})` : '-'}
                          </td>
                          <td className="px-6 py-3.5 text-slate-500 italic max-w-xs truncate">{req.remarks || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SHAREHOLDER AND SHARE DETAILS REPORT */}
      {reportType === 'shareholder_share' && (() => {
        // Master account check
        const isSystemMaster = currentUser?.username?.toLowerCase() === 'reliableadmin';

        // Filter shareholders
        const filteredShareholders = shareholders.filter(sh =>
          sh.name.toLowerCase().includes(shareholderSearchTerm.toLowerCase()) ||
          sh.citizenshipNumber.toLowerCase().includes(shareholderSearchTerm.toLowerCase()) ||
          sh.address.toLowerCase().includes(shareholderSearchTerm.toLowerCase())
        );

        // Calculate aggregate statistics
        const totalShareCapital = shareholders.reduce((sum, s) => sum + s.totalShareAmount, 0);
        const activeShareholdersCount = shareholders.filter(s => s.status === 'Active').length;

        // Total additions and returns from transactions
        let totalAdditions = 0;
        let totalReturns = 0;
        shareholders.forEach(sh => {
          (sh.transactions || []).forEach(tx => {
            if (tx.status === 'Approved') {
              if (tx.transactionType === 'Addition') totalAdditions += tx.paidAmount;
              if (tx.transactionType === 'Return') totalReturns += tx.paidAmount;
            }
          });
        });

        const activeShareholderObj = selectedShareholderId
          ? shareholders.find(s => s.id === selectedShareholderId)
          : null;

        const handleSaveOpeningDetails = (e: React.FormEvent) => {
          e.preventDefault();
          if (!openingModalShareholder || !onUpdateShareholders) return;

          const openingDetail: OpeningShareDetail = {
            openingAmount: Number(opAmount) || 0,
            openingDate: opDate || getCurrentBsDate(),
            citizenshipNumber: opCit.trim() || openingModalShareholder.citizenshipNumber,
            address: opAddress.trim() || openingModalShareholder.address,
            contact: opContact.trim() || openingModalShareholder.contactNumber,
            paymentMethod: opPayMethod,
            referenceNo: opRef.trim(),
            remarks: opRemarks.trim(),
            addedBy: currentUser?.username || 'reliableadmin',
            addedAt: getCurrentBsDate()
          };

          const updatedShareholders = shareholders.map(s => {
            if (s.id !== openingModalShareholder.id) return s;

            // Recalculate total share amount: Opening + Sum(Approved Addition Tx) - Sum(Approved Return Tx)
            let txNet = 0;
            (s.transactions || []).forEach(tx => {
              if (tx.status === 'Approved') {
                if (tx.transactionType === 'Addition') txNet += tx.paidAmount;
                if (tx.transactionType === 'Return') txNet -= tx.paidAmount;
              }
            });

            return {
              ...s,
              citizenshipNumber: openingDetail.citizenshipNumber || s.citizenshipNumber,
              address: openingDetail.address || s.address,
              contactNumber: openingDetail.contact || s.contactNumber,
              openingDetails: openingDetail,
              totalShareAmount: openingDetail.openingAmount + txNet
            };
          });

          onUpdateShareholders(updatedShareholders);
          setOpeningModalOpen(false);
          setOpeningModalShareholder(null);
          alert('Opening shareholder details saved successfully!');
        };

        return (
          <div className="space-y-6 animate-fade-in">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 uppercase">कुल सेयर पुँजी (Total Share Capital)</span>
                <p className="text-2xl font-black text-emerald-700 font-mono mt-1">
                  रु. {totalShareCapital.toLocaleString()}
                </p>
                <span className="text-[11px] text-slate-400 font-medium">Net Shareholder Equity</span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 uppercase">कुल सेयरधनी संख्या (Shareholders)</span>
                <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                  {activeShareholdersCount} जना
                </p>
                <span className="text-[11px] text-emerald-600 font-bold">✓ Active Shareholders</span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 uppercase">थप सेयर पुँजी (Additions)</span>
                <p className="text-2xl font-black text-indigo-700 font-mono mt-1">
                  रु. {totalAdditions.toLocaleString()}
                </p>
                <span className="text-[11px] text-indigo-500 font-medium">Meeting approved deposits</span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 uppercase">फिर्ता सेयर पुँजी (Refunds/Returns)</span>
                <p className="text-2xl font-black text-amber-700 font-mono mt-1">
                  रु. {totalReturns.toLocaleString()}
                </p>
                <span className="text-[11px] text-amber-600 font-medium">Meeting approved refunds</span>
              </div>
            </div>

            {/* If a specific shareholder is selected: View Shareholder Ledger */}
            {activeShareholderObj ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
                  <div>
                    <button
                      onClick={() => setSelectedShareholderId(null)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 mb-2 cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                      <span>← Back to Shareholders List</span>
                    </button>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <span>{activeShareholderObj.name}</span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                        {activeShareholderObj.status}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {activeShareholderObj.address} | Cit No: {activeShareholderObj.citizenshipNumber || 'N/A'} | Contact: {activeShareholderObj.contactNumber || 'N/A'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Net Share</span>
                      <strong className="text-lg font-mono font-bold text-emerald-700">
                        रु. {activeShareholderObj.totalShareAmount.toLocaleString()}
                      </strong>
                    </div>

                    {/* OPENING SHARE DETAILS BUTTON - ACCESSIBLE ONLY FOR SYSTEM MASTER (username === 'reliableadmin') */}
                    {isSystemMaster && (
                      <button
                        onClick={() => {
                          setOpeningModalShareholder(activeShareholderObj);
                          setOpAmount(activeShareholderObj.openingDetails?.openingAmount || activeShareholderObj.totalShareAmount || 0);
                          setOpDate(activeShareholderObj.openingDetails?.openingDate || getCurrentBsDate());
                          setOpCit(activeShareholderObj.citizenshipNumber || '');
                          setOpAddress(activeShareholderObj.address || '');
                          setOpContact(activeShareholderObj.contactNumber || '');
                          setOpPayMethod(activeShareholderObj.openingDetails?.paymentMethod || 'RBB');
                          setOpRef(activeShareholderObj.openingDetails?.referenceNo || '');
                          setOpRemarks(activeShareholderObj.openingDetails?.remarks || '');
                          setOpeningModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                        title="Available for System Master (@reliableadmin) only"
                      >
                        <ShieldCheck size={16} />
                        <span>+ अघिल्लो सेयरधनी ओपनिङ लगत थप (Opening Share Details)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Opening Details Card if added */}
                {activeShareholderObj.openingDetails && (
                  <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-indigo-950">
                      <span>✓ अघिल्लो ओपनिङ लगत विवरण (Opening Balance Details)</span>
                      <span className="text-[11px] text-indigo-700 font-mono">
                        Added By: {activeShareholderObj.openingDetails.addedBy} on {activeShareholderObj.openingDetails.addedAt}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-slate-700">
                      <div><span className="text-slate-500">Opening Amount:</span> <strong className="font-mono text-slate-900">रु. {activeShareholderObj.openingDetails.openingAmount.toLocaleString()}</strong></div>
                      <div><span className="text-slate-500">Date:</span> <strong className="font-mono text-slate-900">{activeShareholderObj.openingDetails.openingDate}</strong></div>
                      <div><span className="text-slate-500">Payment Basket:</span> <strong className="text-slate-900">{activeShareholderObj.openingDetails.paymentMethod || 'RBB'}</strong></div>
                      <div><span className="text-slate-500">Ref No:</span> <strong className="font-mono text-slate-900">{activeShareholderObj.openingDetails.referenceNo || 'OP-BAL'}</strong></div>
                    </div>
                  </div>
                )}

                {/* Shareholder Transactions History Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                    बैठक तथा कारोबार अभिलेख (Transaction History Log)
                  </h4>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <th className="p-3">Date (BS)</th>
                          <th className="p-3">Meeting # / Ref</th>
                          <th className="p-3">Type</th>
                          <th className="p-3 text-right">Amount Paid (रु.)</th>
                          <th className="p-3 text-right">Remaining Balance (रु.)</th>
                          <th className="p-3">Payment Method</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Tx Ref ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {(!activeShareholderObj.transactions || activeShareholderObj.transactions.length === 0) ? (
                          <tr>
                            <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                              No meeting share transactions recorded yet for this shareholder.
                            </td>
                          </tr>
                        ) : (
                          activeShareholderObj.transactions.map((tx, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition">
                              <td className="p-3 font-mono font-medium text-slate-700">{tx.transactionDate}</td>
                              <td className="p-3 font-mono font-bold text-indigo-900">{tx.meetingNumber || tx.meetingId || '-'}</td>
                              <td className="p-3 font-bold">
                                {tx.transactionType === 'Addition' ? (
                                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    + सेयर थप (Addition)
                                  </span>
                                ) : (
                                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                    - सेयर फिर्ता (Return)
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-slate-900">
                                रु. {tx.paidAmount.toLocaleString()}
                              </td>
                              <td className="p-3 text-right font-mono text-amber-800 font-semibold">
                                {tx.remainingBalance && tx.remainingBalance > 0 ? `रु. ${tx.remainingBalance.toLocaleString()}` : '-'}
                              </td>
                              <td className="p-3 font-bold text-slate-800">{tx.paymentMethod}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tx.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                  {tx.status}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-slate-600">{tx.transactionIdNo || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* Shareholder Directory Table */
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      सेयरधनी लगत तथा विवरण सूची (Shareholders Directory)
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      बैठक निर्णय अनुसार अद्यावधिक गरिएको सेयरधनी लगत
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <InteractiveSearchBar
                      value={shareholderSearchTerm}
                      onChange={setShareholderSearchTerm}
                      placeholder="Search shareholder name, citizenship..."
                      expandedWidth="w-full sm:w-64"
                      size="sm"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                        <th className="p-3 text-center">S.N.</th>
                        <th className="p-3">Shareholder Name</th>
                        <th className="p-3">Address</th>
                        <th className="p-3">Citizenship Number</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3 text-right">Total Share Capital (रु.)</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredShareholders.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                            No shareholders found.
                          </td>
                        </tr>
                      ) : (
                        filteredShareholders.map((sh, idx) => (
                          <tr key={sh.id} className="hover:bg-slate-50 transition">
                            <td className="p-3 text-center font-mono font-bold text-slate-600">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-900">{sh.name}</td>
                            <td className="p-3 text-slate-700">{sh.address}</td>
                            <td className="p-3 font-mono text-slate-700">{sh.citizenshipNumber || '-'}</td>
                            <td className="p-3 font-mono text-slate-700">{sh.contactNumber || '-'}</td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-800">
                              रु. {sh.totalShareAmount.toLocaleString()}
                            </td>
                            <td className="p-3 text-center">
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                {sh.status}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => setSelectedShareholderId(sh.id)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-lg transition cursor-pointer"
                              >
                                View Account
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* OPENING SHARE DETAILS MODAL FOR SYSTEM MASTER (@reliableadmin) */}
            {openingModalOpen && openingModalShareholder && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-5 bg-indigo-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={20} className="text-amber-400" />
                      <div>
                        <h3 className="font-bold text-sm">
                          अघिल्लो सेयरधनी ओपनिङ लगत थप (Opening Share Details)
                        </h3>
                        <p className="text-[11px] text-indigo-200 font-mono">
                          Shareholder: {openingModalShareholder.name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setOpeningModalOpen(false)}
                      className="text-indigo-300 hover:text-white p-1 rounded hover:bg-indigo-800"
                    >
                      &times;
                    </button>
                  </div>

                  <form onSubmit={handleSaveOpeningDetails} className="p-5 space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Opening Share Capital Amount (रु.) *</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={opAmount}
                        onChange={(e) => setOpAmount(Number(e.target.value) || 0)}
                        className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Opening Date (BS) *</label>
                        <input
                          type="text"
                          required
                          value={opDate}
                          onChange={(e) => setOpDate(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Payment Basket *</label>
                        <select
                          value={opPayMethod}
                          onChange={(e) => setOpPayMethod(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
                        >
                          <option value="RBB">RBB (राष्ट्रिय वाणिज्य बैंक)</option>
                          <option value="Cash">Cash (नगद)</option>
                          <option value="Esewa">eSewa (ई-सेवा)</option>
                          <option value="Sahakari">Sahakari (सहकारी)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Citizenship Number</label>
                        <input
                          type="text"
                          value={opCit}
                          onChange={(e) => setOpCit(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Contact Number</label>
                        <input
                          type="text"
                          value={opContact}
                          onChange={(e) => setOpContact(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Address</label>
                      <input
                        type="text"
                        value={opAddress}
                        onChange={(e) => setOpAddress(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Reference / Voucher No.</label>
                        <input
                          type="text"
                          placeholder="e.g. OP-SH-001"
                          value={opRef}
                          onChange={(e) => setOpRef(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Remarks</label>
                        <input
                          type="text"
                          placeholder="Opening balance note..."
                          value={opRemarks}
                          onChange={(e) => setOpRemarks(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="pt-3 flex justify-end gap-2 border-t">
                      <button
                        type="button"
                        onClick={() => setOpeningModalOpen(false)}
                        className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                      >
                        Save Opening Details
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      })()}

    </div>
  );
};
