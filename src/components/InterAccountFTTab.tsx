import React, { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Trash2, 
  Coins, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  Wallet, 
  CreditCard,
  PlusCircle,
  X,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { AccountTransaction, AppUser, BusinessProfile, DailyClosing, PeriodicClosing, OpeningBalances, SalesInvoice, Expense, SupplyTransaction, SalaryDistribution, EditRequest, Shareholder, MeetingNote } from '../types';
import { checkDateLock } from '../utils/closingLocks';
import { NepaliDatePicker } from './NepaliDatePicker';
import { validateAccountBalance, calculateAccountBalance, getAccountBucketLabel } from '../utils/accountBalance';
import { InteractiveSearchBar } from './InteractiveSearchBar';

interface InterAccountFTTabProps {
  accountTransfers: AccountTransaction[];
  onUpdateAccountTransfers?: (transfers: AccountTransaction[]) => void;
  currentUser: AppUser;
  profile: BusinessProfile;
  dailyClosings?: DailyClosing[];
  periodicClosings?: PeriodicClosing[];
  defaultDate?: string;
  openingBalances?: OpeningBalances;
  invoices?: SalesInvoice[];
  expenses?: Expense[];
  transactions?: SupplyTransaction[];
  salaryDistributions?: SalaryDistribution[];
  editRequests?: EditRequest[];
  shareholders?: Shareholder[];
  meetingNotes?: MeetingNote[];
  onTriggerInsufficientBalance?: (validation: any) => void;
}

export const InterAccountFTTab: React.FC<InterAccountFTTabProps> = ({
  accountTransfers = [],
  onUpdateAccountTransfers,
  currentUser,
  profile,
  dailyClosings = [],
  periodicClosings = [],
  defaultDate,
  openingBalances = {},
  invoices = [],
  expenses = [],
  transactions = [],
  salaryDistributions = [],
  editRequests = [],
  shareholders = [],
  meetingNotes = [],
  onTriggerInsufficientBalance
}) => {
  const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'Super Admin';

  // Form State
  const [txType, setTxType] = useState<'Withdrawal' | 'Deposit' | 'Transfer'>('Transfer');
  const [txSource, setTxSource] = useState<'Cash' | 'Esewa' | 'Sahakari' | 'RBB'>('Cash');
  const [txDest, setTxDest] = useState<'Cash' | 'Esewa' | 'Sahakari' | 'RBB'>('RBB');
  const [txRecordedBy, setTxRecordedBy] = useState<string>(currentUser.name || 'Admin');
  const [txAmount, setTxAmount] = useState<number | string>('');
  const [txVoucher, setTxVoucher] = useState<string>('');
  const [txDate, setTxDate] = useState<string>(defaultDate || new Date().toISOString().split('T')[0]);
  const [txRemarks, setTxRemarks] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(true);
  const [insufficientError, setInsufficientError] = useState<string | null>(null);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const itemsPerPage = 15;

  // Selected Voucher for JV Print Modal
  const [selectedVoucher, setSelectedVoucher] = useState<AccountTransaction | null>(null);

  // Calculate live balances of buckets
  const balanceContext = useMemo(() => ({
    openingBalances,
    invoices,
    expenses,
    transactions,
    salaryDistributions,
    accountTransfers,
    dailyClosings,
    editRequests,
    shareholders,
    meetingNotes
  }), [openingBalances, invoices, expenses, transactions, salaryDistributions, accountTransfers, dailyClosings, editRequests, shareholders, meetingNotes]);

  const cashBalance = useMemo(() => calculateAccountBalance('CASH', balanceContext), [balanceContext]);
  const rbbBalance = useMemo(() => calculateAccountBalance('RBB', balanceContext), [balanceContext]);
  const esewaBalance = useMemo(() => calculateAccountBalance('ESEWA', balanceContext), [balanceContext]);
  const sahakariBalance = useMemo(() => calculateAccountBalance('SAHAKARI', balanceContext), [balanceContext]);

  const getBucketBalance = (acc: string) => {
    const upper = acc.toUpperCase();
    if (upper === 'CASH') return cashBalance;
    if (upper === 'RBB' || upper === 'BANK') return rbbBalance;
    if (upper === 'ESEWA') return esewaBalance;
    if (upper === 'SAHAKARI') return sahakariBalance;
    return 0;
  };

  // Handle Form Submit
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setInsufficientError(null);

    const lockCheck = checkDateLock(txDate, dailyClosings, periodicClosings);
    if (lockCheck.locked) {
      alert(lockCheck.reason);
      return;
    }

    const numAmount = typeof txAmount === 'number' ? txAmount : (parseFloat(txAmount) || 0);
    if (numAmount <= 0) {
      alert('Please enter an amount greater than zero.');
      return;
    }

    if (txType === 'Transfer' && txSource === txDest) {
      alert('Source and Destination accounts cannot be identical for an inter-account transfer.');
      return;
    }

    // Strict Account Balance Validation: If balance is insufficient, DO NOT ALLOW
    const validation = validateAccountBalance(txSource, numAmount, balanceContext);
    if (validation && validation.isInsufficient) {
      const msg = `⚠️ Insufficient Balance in ${validation.accountLabel}!\n\nAvailable Balance: Rs. ${validation.currentBalance.toLocaleString()}\nRequested ${txType} Amount: Rs. ${validation.requiredAmount.toLocaleString()}\nShortfall: Rs. ${(validation.requiredAmount - validation.currentBalance).toLocaleString()}\n\nTransaction cannot proceed due to insufficient funds.`;
      setInsufficientError(`Cannot complete ${txType}: ${validation.accountLabel} only has Rs. ${validation.currentBalance.toLocaleString()} available, which is insufficient for Rs. ${validation.requiredAmount.toLocaleString()}.`);
      if (onTriggerInsufficientBalance) {
        onTriggerInsufficientBalance(validation);
      } else {
        alert(msg);
      }
      return;
    }

    const newTx: AccountTransaction = {
      id: `atx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: txDate,
      type: txType,
      sourceAccount: txSource,
      destinationAccount: txType === 'Transfer' ? txDest : undefined,
      amount: numAmount,
      voucherNumber: txVoucher.trim() || `JV-${Math.floor(1000 + Math.random() * 9000)}`,
      remarks: txRemarks.trim() || `${txType} transaction`,
      recordedBy: txRecordedBy.trim() || currentUser.name || 'Staff'
    };

    if (onUpdateAccountTransfers) {
      onUpdateAccountTransfers([newTx, ...accountTransfers]);
      alert(`✅ Inter-Account FT (${txType}) of Rs. ${numAmount.toLocaleString()} logged successfully!`);
      setTxAmount('');
      setTxVoucher('');
      setTxRemarks('');
      setInsufficientError(null);
    }
  };

  // Handle Delete
  const handleDelete = (id: string) => {
    if (!isAdmin) {
      alert('Only administrators are authorized to delete recorded fund transfers.');
      return;
    }
    if (!window.confirm('Are you sure you want to remove this financial transfer record? This action will adjust account ledgers.')) {
      return;
    }
    const updated = accountTransfers.filter(t => t.id !== id);
    if (onUpdateAccountTransfers) {
      onUpdateAccountTransfers(updated);
    }
  };

  // Extract unique months for filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    accountTransfers.forEach(t => {
      if (t.date && t.date.length >= 7) {
        months.add(t.date.substring(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [accountTransfers]);

  // Filtered list
  const filteredList = useMemo(() => {
    return accountTransfers.filter(item => {
      // Type match
      if (filterType !== 'all' && item.type !== filterType) return false;

      // Account match
      if (filterAccount !== 'all') {
        const accNorm = filterAccount.toLowerCase();
        const srcNorm = (item.sourceAccount || '').toLowerCase();
        const destNorm = (item.destinationAccount || '').toLowerCase();
        if (srcNorm !== accNorm && destNorm !== accNorm) return false;
      }

      // Month match
      if (filterMonth !== 'all' && (!item.date || !item.date.startsWith(filterMonth))) {
        return false;
      }

      // Search match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchVoucher = (item.voucherNumber || '').toLowerCase().includes(query);
        const matchRemarks = (item.remarks || '').toLowerCase().includes(query);
        const matchUser = (item.recordedBy || '').toLowerCase().includes(query);
        const matchSource = (item.sourceAccount || '').toLowerCase().includes(query);
        const matchDest = (item.destinationAccount || '').toLowerCase().includes(query);
        const matchDate = (item.date || '').toLowerCase().includes(query);
        const matchAmt = String(item.amount).includes(query);
        return matchVoucher || matchRemarks || matchUser || matchSource || matchDest || matchDate || matchAmt;
      }

      return true;
    });
  }, [accountTransfers, filterType, filterAccount, filterMonth, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, page]);

  // Aggregate Stats
  const totalVolume = useMemo(() => accountTransfers.reduce((sum, t) => sum + (t.amount || 0), 0), [accountTransfers]);
  const transfersVolume = useMemo(() => accountTransfers.filter(t => t.type === 'Transfer').reduce((sum, t) => sum + (t.amount || 0), 0), [accountTransfers]);
  const depositsVolume = useMemo(() => accountTransfers.filter(t => t.type === 'Deposit').reduce((sum, t) => sum + (t.amount || 0), 0), [accountTransfers]);
  const withdrawalsVolume = useMemo(() => accountTransfers.filter(t => t.type === 'Withdrawal').reduce((sum, t) => sum + (t.amount || 0), 0), [accountTransfers]);

  // Export CSV
  const exportToCSV = () => {
    if (filteredList.length === 0) {
      alert('No transfer records to export.');
      return;
    }
    const headers = ['S.N.', 'Date (B.S.)', 'Voucher No', 'Type', 'Source Account', 'Destination Account', 'Amount (Rs.)', 'Particulars / Remarks', 'Recorded By'];
    const rows = filteredList.map((t, idx) => [
      idx + 1,
      t.date,
      t.voucherNumber || 'N/A',
      t.type,
      t.sourceAccount,
      t.destinationAccount || 'N/A',
      t.amount,
      `"${(t.remarks || '').replace(/"/g, '""')}"`,
      `"${(t.recordedBy || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inter_Account_FT_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for Account Badges
  const getAccountBadge = (acc: string) => {
    const a = (acc || '').toUpperCase();
    if (a.includes('CASH')) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">💵 Cash Vault</span>;
    }
    if (a.includes('RBB') || a.includes('BANK')) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">🏛️ RBB Bank</span>;
    }
    if (a.includes('ESEWA')) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">📱 eSewa</span>;
    }
    if (a.includes('SAHAKARI')) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">🤝 Sahakari</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{acc}</span>;
  };

  const getTypeBadge = (type: string) => {
    if (type === 'Transfer') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono uppercase">Inter-Transfer</span>;
    }
    if (type === 'Deposit') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono uppercase">Deposit (In)</span>;
    }
    if (type === 'Withdrawal') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 font-mono uppercase">Withdrawal (Out)</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{type}</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase font-mono tracking-wider">Total FT Volume</span>
            <Coins size={15} className="text-indigo-500" />
          </div>
          <p className="text-lg md:text-xl font-black font-display text-slate-900">
            Rs. {totalVolume.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">{accountTransfers.length} registered operations</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase font-mono tracking-wider">Inter-Transfers</span>
            <ArrowLeftRight size={15} className="text-indigo-500" />
          </div>
          <p className="text-lg md:text-xl font-black font-display text-indigo-600">
            Rs. {transfersVolume.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">{accountTransfers.filter(t => t.type === 'Transfer').length} inter-relocations</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase font-mono tracking-wider">Bank Deposits</span>
            <TrendingUp size={15} className="text-emerald-500" />
          </div>
          <p className="text-lg md:text-xl font-black font-display text-emerald-600">
            Rs. {depositsVolume.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">{accountTransfers.filter(t => t.type === 'Deposit').length} cash deposits</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase font-mono tracking-wider">Bank Withdrawals</span>
            <TrendingDown size={15} className="text-rose-500" />
          </div>
          <p className="text-lg md:text-xl font-black font-display text-rose-600">
            Rs. {withdrawalsVolume.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">{accountTransfers.filter(t => t.type === 'Withdrawal').length} cash withdrawals</p>
        </div>
      </div>

      {/* Log Form Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Coins className="text-indigo-600" size={18} />
            <div>
              <h3 className="font-bold text-slate-800 text-sm font-display">
                Log Account Withdrawal, Deposit or Inter-Transfer (Inter-Account FT)
              </h3>
              <p className="text-[11px] text-slate-500">
                Document bank ATM cash withdrawals, vault deposits, or liquid funds reallocation across Cash, RBB, eSewa, and Sahakari.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
          >
            {showForm ? 'Hide Form' : '+ New Entry'}
          </button>
        </div>

        {insufficientError && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-2.5 text-rose-800 text-xs">
            <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Insufficient Account Balance</p>
              <p className="text-slate-600 font-sans">{insufficientError}</p>
            </div>
          </div>
        )}

        {/* Live Account Balances Quick Pill Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-xs font-mono">
          <div className="flex items-center justify-between px-2 py-1 bg-white rounded-lg border border-slate-200/70">
            <span className="text-slate-500 text-[10px]">Cash Vault:</span>
            <span className={`font-bold text-[11px] ${cashBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>Rs. {cashBalance.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1 bg-white rounded-lg border border-slate-200/70">
            <span className="text-slate-500 text-[10px]">RBB Bank:</span>
            <span className={`font-bold text-[11px] ${rbbBalance >= 0 ? 'text-blue-700' : 'text-rose-600'}`}>Rs. {rbbBalance.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1 bg-white rounded-lg border border-slate-200/70">
            <span className="text-slate-500 text-[10px]">eSewa:</span>
            <span className={`font-bold text-[11px] ${esewaBalance >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>Rs. {esewaBalance.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1 bg-white rounded-lg border border-slate-200/70">
            <span className="text-slate-500 text-[10px]">Sahakari:</span>
            <span className={`font-bold text-[11px] ${sahakariBalance >= 0 ? 'text-indigo-700' : 'text-rose-600'}`}>Rs. {sahakariBalance.toLocaleString()}</span>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end pt-1">
            {/* Transaction Type */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block uppercase font-mono">Action Type *</label>
              <select
                value={txType}
                onChange={(e) => {
                  setTxType(e.target.value as any);
                  setInsufficientError(null);
                }}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 font-medium focus:bg-white focus:outline-hidden focus:border-indigo-500"
              >
                <option value="Transfer">Inter-Account Transfer (Source &rarr; Dest)</option>
                <option value="Deposit">Deposit (Cash &rarr; Bank/Wallet)</option>
                <option value="Withdrawal">Withdrawal (Bank/Wallet &rarr; Cash)</option>
              </select>
            </div>

            {/* Source Account */}
            <div className="md:col-span-3 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 block uppercase font-mono">
                  {txType === 'Transfer' ? 'Source Account *' : txType === 'Deposit' ? 'Deposit From (Cash) *' : 'Withdraw From *'}
                </label>
                <span className="text-[9px] font-mono font-bold text-indigo-600">
                  Avail: Rs. {getBucketBalance(txSource).toLocaleString()}
                </span>
              </div>
              <select
                value={txSource}
                onChange={(e) => {
                  setTxSource(e.target.value as any);
                  setInsufficientError(null);
                }}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 font-medium focus:bg-white focus:outline-hidden focus:border-indigo-500"
              >
                <option value="Cash">Cash Vault</option>
                <option value="RBB">Rastriya Banijya Bank (RBB)</option>
                <option value="Esewa">e-Sewa Digital Wallet</option>
                <option value="Sahakari">Sahakari Cooperatives</option>
              </select>
            </div>

            {/* Destination Account (if transfer) */}
            {txType === 'Transfer' ? (
              <div className="md:col-span-3 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase font-mono">Destination Account *</label>
                  <span className="text-[9px] font-mono font-bold text-slate-500">
                    Curr: Rs. {getBucketBalance(txDest).toLocaleString()}
                  </span>
                </div>
                <select
                  value={txDest}
                  onChange={(e) => setTxDest(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 font-medium focus:bg-white focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="RBB">Rastriya Banijya Bank (RBB)</option>
                  <option value="Cash">Cash Vault</option>
                  <option value="Esewa">e-Sewa Digital Wallet</option>
                  <option value="Sahakari">Sahakari Cooperatives</option>
                </select>
              </div>
            ) : (
              <div className="md:col-span-3 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block uppercase font-mono">Recorded By</label>
                <input
                  type="text"
                  required
                  value={txRecordedBy}
                  onChange={(e) => setTxRecordedBy(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 font-medium focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  placeholder="Staff / Admin Name"
                />
              </div>
            )}

            {/* Amount */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block uppercase font-mono">Amount (Rs.) *</label>
              <input
                type="number"
                step="any"
                required
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 font-mono font-bold focus:bg-white focus:outline-hidden focus:border-indigo-500"
                placeholder="0.00"
              />
            </div>

            {/* Voucher No */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block uppercase font-mono">Voucher / JV Ref No *</label>
              <input
                type="text"
                required
                placeholder="e.g. JV-2083-001"
                value={txVoucher}
                onChange={(e) => setTxVoucher(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 font-mono focus:bg-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Transaction Date */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block uppercase font-mono">Date (B.S.) *</label>
              <NepaliDatePicker
                value={txDate}
                onChange={(d) => setTxDate(d)}
                mode="date"
                placeholder="YYYY-MM-DD"
              />
            </div>

            {/* Particulars / Remarks */}
            <div className="md:col-span-4 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block uppercase font-mono">Particulars / Reason *</label>
              <input
                type="text"
                required
                placeholder="e.g. Relocated cash to RBB for supplier cheque clearing"
                value={txRemarks}
                onChange={(e) => setTxRemarks(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold p-2.5 rounded-xl cursor-pointer transition shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <PlusCircle size={15} />
                <span>Save Transfer</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Universal Table Design Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
        
        {/* Search & Filter Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          
          {/* Search box */}
          <div className="flex items-center gap-2">
            <InteractiveSearchBar
              value={searchTerm}
              onChange={(val) => {
                setSearchTerm(val);
                setPage(1);
              }}
              placeholder="Search voucher, reason, staff..."
              expandedWidth="w-72 sm:w-80"
              size="sm"
            />
          </div>

          {/* Filters & Export Options */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            
            {/* Filter by Type */}
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Action Types</option>
              <option value="Transfer">Inter-Transfers</option>
              <option value="Deposit">Bank Deposits</option>
              <option value="Withdrawal">Bank Withdrawals</option>
            </select>

            {/* Filter by Account */}
            <select
              value={filterAccount}
              onChange={(e) => {
                setFilterAccount(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Accounts</option>
              <option value="Cash">Cash Vault</option>
              <option value="RBB">RBB Bank</option>
              <option value="Esewa">eSewa</option>
              <option value="Sahakari">Sahakari</option>
            </select>

            {/* Filter by Month */}
            {availableMonths.length > 0 && (
              <select
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-700 focus:outline-hidden"
              >
                <option value="all">All Months</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}

            {/* Export CSV button */}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Export filtered records to CSV"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Universal Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                <th className="py-3 px-3.5 text-center w-12 font-bold">S.N.</th>
                <th className="py-3 px-3.5 font-bold">Date (B.S.)</th>
                <th className="py-3 px-3.5 font-bold">Voucher No</th>
                <th className="py-3 px-3.5 font-bold">Action Type</th>
                <th className="py-3 px-3.5 font-bold">Account Flow Route</th>
                <th className="py-3 px-3.5 font-bold">Particulars / Reason</th>
                <th className="py-3 px-3.5 text-right font-bold">Amount (Rs.)</th>
                <th className="py-3 px-3.5 font-bold">Recorded By</th>
                <th className="py-3 px-3.5 text-center font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedList.map((item, index) => {
                const sn = (page - 1) * itemsPerPage + index + 1;
                return (
                  <tr key={item.id || index} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3.5 text-center font-mono text-slate-400 font-bold">{sn}</td>
                    <td className="py-3 px-3.5 font-mono font-medium text-slate-700 whitespace-nowrap">{item.date}</td>
                    <td className="py-3 px-3.5 font-mono font-bold text-indigo-700 whitespace-nowrap">
                      <span className="bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100/60">
                        {item.voucherNumber || 'JV-AUTO'}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {getTypeBadge(item.type)}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {getAccountBadge(item.sourceAccount)}
                        {item.destinationAccount && (
                          <>
                            <ArrowRight size={12} className="text-slate-400" />
                            {getAccountBadge(item.destinationAccount)}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-slate-700 max-w-xs truncate" title={item.remarks}>
                      {item.remarks || 'Inter-account fund transaction'}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                      Rs. {item.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 font-medium whitespace-nowrap">
                      {item.recordedBy || 'Admin'}
                    </td>
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedVoucher(item)}
                          className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg transition cursor-pointer"
                          title="Print JV Voucher Slip"
                        >
                          <Printer size={13} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                            title="Delete Entry"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedList.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs italic">
                    No inter-account transfer records found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Universal Table Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs text-slate-500 font-mono">
            <span>Showing {paginatedList.length} of {filteredList.length} records</span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-bold transition cursor-pointer"
              >
                &larr; Prev
              </button>
              <span className="px-3 py-1 font-bold text-slate-700">Page {page} of {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-bold transition cursor-pointer"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Individual JV Voucher Print Slip Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm font-display">Inter-Account Journal Voucher (JV)</h4>
                <p className="text-[10px] text-slate-400 font-mono">Ref: {selectedVoucher.voucherNumber}</p>
              </div>
              <button
                onClick={() => setSelectedVoucher(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Printable Slip Content */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-4 bg-slate-50/50 text-xs font-mono" id="voucher-print-area">
              <div className="text-center space-y-0.5 border-b border-slate-200 pb-3">
                <h3 className="font-black text-sm text-slate-900 font-display">{profile.name}</h3>
                <p className="text-[10px] text-slate-500 font-sans">{profile.location} | Ph: {profile.phone}</p>
                <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest pt-1">
                  OFFICIAL INTER-ACCOUNT JOURNAL VOUCHER
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">Voucher Number:</span>
                  <span className="font-bold text-slate-800">{selectedVoucher.voucherNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[9px] uppercase">Transaction Date:</span>
                  <span className="font-bold text-slate-800">{selectedVoucher.date} (B.S.)</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-[9px] uppercase">
                      <th className="p-2">Particulars / Account Ledger</th>
                      <th className="p-2 text-right">Debit (Rs.)</th>
                      <th className="p-2 text-right">Credit (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2 font-bold text-slate-800">
                        {selectedVoucher.destinationAccount ? `${selectedVoucher.destinationAccount} Account` : `${selectedVoucher.sourceAccount} Account`} (Received)
                      </td>
                      <td className="p-2 text-right font-bold text-slate-900">
                        {selectedVoucher.amount.toLocaleString()}
                      </td>
                      <td className="p-2 text-right text-slate-400">-</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-800">
                        To {selectedVoucher.sourceAccount} Account (Disbursed)
                      </td>
                      <td className="p-2 text-right text-slate-400">-</td>
                      <td className="p-2 text-right font-bold text-slate-900">
                        {selectedVoucher.amount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-1 text-[10px] font-sans">
                <span className="font-bold text-slate-600">Narration / Purpose:</span>
                <p className="text-slate-700 bg-white p-2 rounded border border-slate-200 italic">
                  {selectedVoucher.remarks}
                </p>
              </div>

              <div className="flex justify-between pt-6 border-t border-slate-200 text-[10px] font-sans text-slate-500">
                <div className="text-center">
                  <div className="border-t border-slate-400 w-24 pt-1 font-bold">{selectedVoucher.recordedBy || 'Prepared By'}</div>
                  <span>Prepared By</span>
                </div>
                <div className="text-center">
                  <div className="border-t border-slate-400 w-24 pt-1 font-bold">Authorized Admin</div>
                  <span>Approved By</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedVoucher(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer flex items-center gap-1.5"
              >
                <Printer size={14} />
                <span>Print JV Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
