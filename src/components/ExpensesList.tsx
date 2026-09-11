import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  AlertCircle,
  FileText,
  DollarSign,
  TrendingDown,
  Building,
  UserCheck,
  Package,
  Clock,
  Printer,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FileCheck2,
  Lock
} from 'lucide-react';
import { Expense, ExpenseCategory, AppUser, SupplyTransaction, Supplier, BusinessProfile, Shareholder, MeetingNote, ShareTransaction, OpeningBalances, SalesInvoice, DailyClosing, SalaryDistribution, AccountTransaction, EditRequest } from '../types';
import { getCurrentBsDate, getFormattedPoNumber } from '../utils/nepaliDate';
import { InteractiveSearchBar } from './InteractiveSearchBar';
import { validateAccountBalance, validateSplitAccountBalances, BalanceValidationResult } from '../utils/accountBalance';

interface ExpensesListProps {
  expenses: Expense[];
  supplyTransactions: SupplyTransaction[];
  suppliers: Supplier[];
  onAddExpense: (exp: Omit<Expense, 'id' | 'expenseNo'>) => void;
  onEditExpense: (exp: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onApproveExpense: (id: string, adminName: string) => void;
  onDeclineExpense: (id: string, adminName: string) => void;
  currentUser: AppUser;
  profile: BusinessProfile;
  isDateLocked?: (date: string) => boolean;
  shareholders?: Shareholder[];
  meetingNotes?: MeetingNote[];
  openingBalances?: OpeningBalances;
  invoices?: SalesInvoice[];
  dailyClosings?: DailyClosing[];
  salaryDistributions?: SalaryDistribution[];
  accountTransfers?: AccountTransaction[];
  editRequests?: EditRequest[];
  onTriggerInsufficientBalance?: (val: BalanceValidationResult) => void;
}

export const ExpensesList: React.FC<ExpensesListProps> = ({
  expenses,
  supplyTransactions,
  suppliers,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onApproveExpense,
  onDeclineExpense,
  currentUser,
  profile,
  isDateLocked,
  shareholders = [],
  meetingNotes = [],
  openingBalances,
  invoices,
  dailyClosings,
  salaryDistributions,
  accountTransfers,
  editRequests,
  onTriggerInsufficientBalance
}) => {
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modal form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form states
  const [category, setCategory] = useState<ExpenseCategory>('Rent');
  const [topic, setTopic] = useState(''); // Custom topic for Others
  const [selectedPoIds, setSelectedPoIds] = useState<string[]>([]); // Selected purchase orders
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | string>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Esewa' | 'Sahakari' | 'RBB' | 'Split'>('Cash');
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitEsewa, setSplitEsewa] = useState<number>(0);
  const [splitRbb, setSplitRbb] = useState<number>(0);
  const [splitSahakari, setSplitSahakari] = useState<number>(0);
  const [date, setDate] = useState(getCurrentBsDate());
  const [remarks, setRemarks] = useState('');
  const [referenceId, setReferenceId] = useState('');

  // Active Voucher Print state
  const [printingVoucher, setPrintingVoucher] = useState<Expense | null>(null);

  // Merge Share Returns into displayExpenses dynamically to guarantee visibility in Expenses tab without double-counting
  const displayExpenses = React.useMemo(() => {
    const list = [...expenses];
    const allShareReturnTxs: ShareTransaction[] = [];
    
    (shareholders || []).forEach(sh => {
      (sh.transactions || []).forEach(tx => {
        if (tx.transactionType === 'Return' && tx.status === 'Approved' && tx.paidAmount > 0) {
          allShareReturnTxs.push(tx);
        }
      });
    });

    (meetingNotes || []).forEach(m => {
      (m.shareTransactions || []).forEach(tx => {
        if (tx.transactionType === 'Return' && tx.status === 'Approved' && tx.paidAmount > 0 && !allShareReturnTxs.some(t => t.id === tx.id)) {
          allShareReturnTxs.push(tx);
        }
      });
    });

    allShareReturnTxs.forEach(st => {
      const alreadyLogged = list.some(e => 
        e.referenceId === st.id || 
        (e.category === 'Shareholder Payout' && e.title.includes(st.shareholderName) && Math.abs(e.amount - st.paidAmount) < 0.01 && e.date === st.transactionDate)
      );
      if (!alreadyLogged) {
        list.push({
          id: `exp-st-${st.id}`,
          expenseNo: st.transactionIdNo || `RET-${st.id.slice(-6)}`,
          category: 'Shareholder Payout',
          topic: 'Share Return / Refund',
          title: `Share Capital Return to ${st.shareholderName}`,
          amount: st.paidAmount,
          paymentMethod: (st.paymentMethod.charAt(0).toUpperCase() + st.paymentMethod.slice(1).toLowerCase()) as any,
          date: st.transactionDate,
          remarks: st.remarks || 'Share capital return transaction',
          status: 'Approved',
          createdBy: 'System',
          approvedBy: 'Admin',
          referenceId: st.id
        });
      }
    });

    return list;
  }, [expenses, shareholders, meetingNotes]);

  // Computations
  const approvedExpenses = displayExpenses.filter(e => e.status === 'Approved');
  const pendingExpenses = displayExpenses.filter(e => e.status === 'Pending Approval');
  
  const totalApprovedAmount = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPendingAmount = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Category summary for analytics
  const categoryTotals = displayExpenses.reduce((acc, e) => {
    if (e.status === 'Approved') {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
    }
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  // Supply Transactions that can be paid off
  const openPurchaseOrders = supplyTransactions.filter(po => {
    // Show orders that aren't fully paid yet
    return po.status !== 'Paid' && po.status !== 'Rejected';
  });

  const handleOpenAdd = () => {
    const today = getCurrentBsDate();
    if (isDateLocked && isDateLocked(today)) {
      alert(`⚠️ Transactions are locked for today due to Daily/Monthly/Yearly Closing. Action blocked.`);
      return;
    }
    setEditingExpense(null);
    setCategory('Rent');
    setTopic('');
    setSelectedPoIds([]);
    setTitle('');
    setAmount(0);
    setPaymentMethod('Cash');
    setSplitCash(0);
    setSplitEsewa(0);
    setSplitRbb(0);
    setSplitSahakari(0);
    setDate(getCurrentBsDate());
    setRemarks('');
    setReferenceId('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    if (isDateLocked && isDateLocked(exp.date)) {
      alert(`⚠️ This expense falls in a locked/closed period (${exp.date}). Direct editing is blocked.`);
      return;
    }
    setEditingExpense(exp);
    setCategory(exp.category);
    setTopic(exp.topic || '');
    const poIds = exp.referenceId ? exp.referenceId.split(',').map(s => s.trim()).filter(Boolean) : [];
    setSelectedPoIds(poIds);
    setTitle(exp.title);
    setAmount(exp.amount);
    setPaymentMethod(exp.paymentMethod);
    if (exp.paymentMethod === 'Split' && exp.paymentSplits) {
      setSplitCash(exp.paymentSplits.Cash || (exp.paymentSplits as any).cash || 0);
      setSplitEsewa(exp.paymentSplits.Esewa || (exp.paymentSplits as any).esewa || 0);
      setSplitRbb(exp.paymentSplits.RBB || (exp.paymentSplits as any).rbb || 0);
      setSplitSahakari(exp.paymentSplits.Sahakari || (exp.paymentSplits as any).sahakari || 0);
    } else {
      setSplitCash(exp.amount || 0);
      setSplitEsewa(0);
      setSplitRbb(0);
      setSplitSahakari(0);
    }
    setDate(exp.date);
    setRemarks(exp.remarks);
    setReferenceId(exp.referenceId || '');
    setIsFormOpen(true);
  };

  const handleTogglePo = (poId: string) => {
    setSelectedPoIds(prev => {
      let next: string[];
      if (prev.includes(poId)) {
        next = prev.filter(id => id !== poId);
      } else {
        next = [...prev, poId];
      }
      
      const joinedRef = next.join(',');
      setReferenceId(joinedRef);
      
      if (next.length > 0) {
        const poLabels = next.map(id => {
          const found = supplyTransactions.find(t => t.id === id);
          return found ? getFormattedPoNumber(found, supplyTransactions) : id.toUpperCase();
        });
        setTitle(`Multi-PO Payment for: ${poLabels.join(', ')}`);
        
        const sumDues = next.reduce((sum, id) => {
          const po = supplyTransactions.find(t => t.id === id);
          return sum + (po ? po.amountDue : 0);
        }, 0);
        setAmount(sumDues);
      } else {
        setTitle('');
        setAmount(0);
      }
      
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a description or title.');
      return;
    }
    if (amount <= 0) {
      alert('Please enter an amount greater than zero.');
      return;
    }
    if (category === 'Others' && !topic.trim()) {
      alert('Please enter a topic for this miscellaneous expense.');
      return;
    }
    if (isDateLocked && isDateLocked(date)) {
      alert(`⚠️ Action blocked. The selected date (${date}) falls within a completed Daily/Monthly/Yearly closing period.`);
      return;
    }

  const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'Super Admin';

  const creatorName = currentUser.name || currentUser.username;
  const defaultStatus = isAdmin ? 'Approved' : 'Pending Approval';

    const numericAmount = typeof amount === 'number' ? amount : (parseFloat(amount) || 0);

    if (paymentMethod === 'Split') {
      const splitSum = Number(splitCash || 0) + Number(splitEsewa || 0) + Number(splitRbb || 0) + Number(splitSahakari || 0);
      if (Math.abs(splitSum - numericAmount) > 0.01) {
        alert(`Split payment total (Rs. ${splitSum.toLocaleString()}) does not match the total expense amount (Rs. ${numericAmount.toLocaleString()}). Please adjust the split allocation.`);
        return;
      }
    }

    const paymentSplitsData = paymentMethod === 'Split' ? {
      Cash: Number(splitCash || 0),
      Esewa: Number(splitEsewa || 0),
      RBB: Number(splitRbb || 0),
      Sahakari: Number(splitSahakari || 0)
    } : undefined;

    // Account Balance Validation (no transaction allowed if payment basket has no/insufficient balance)
    const balanceData = {
      openingBalances: openingBalances || {} as any,
      invoices: invoices || [],
      expenses: expenses || [],
      transactions: supplyTransactions || [],
      salaryDistributions: salaryDistributions || [],
      accountTransfers: accountTransfers || [],
      dailyClosings: dailyClosings || [],
      editRequests: editRequests || [],
      shareholders: shareholders || [],
      meetingNotes: meetingNotes || []
    };

    if (paymentMethod === 'Split') {
      const insufficientSplits = validateSplitAccountBalances(paymentSplitsData, balanceData);
      if (insufficientSplits.length > 0) {
        const item = insufficientSplits[0];
        if (onTriggerInsufficientBalance) onTriggerInsufficientBalance(item);
        alert(`Transaction Blocked: Insufficient Balance in ${item.accountLabel}!\nAvailable balance: Rs. ${item.currentBalance.toLocaleString()}\nAllocated amount: Rs. ${item.requiredAmount.toLocaleString()}\n\nNo expense transaction can be completed without sufficient funds in the selected account.`);
        return;
      }
    } else {
      const insufficient = validateAccountBalance(paymentMethod, numericAmount, balanceData);
      if (insufficient) {
        if (onTriggerInsufficientBalance) onTriggerInsufficientBalance(insufficient);
        alert(`Transaction Blocked: Insufficient Balance in ${insufficient.accountLabel}!\nAvailable balance: Rs. ${insufficient.currentBalance.toLocaleString()}\nRequired amount: Rs. ${insufficient.requiredAmount.toLocaleString()}\n\nNo expense transaction can be completed without sufficient funds in the selected account.`);
        return;
      }
    }

    if (editingExpense) {
      onEditExpense({
        ...editingExpense,
        category,
        topic: category === 'Others' ? topic.trim() : undefined,
        title: title.trim(),
        amount: numericAmount,
        paymentMethod,
        paymentSplits: paymentSplitsData,
        date,
        remarks: remarks.trim(),
        referenceId: referenceId || undefined,
        // Keep status if editing, unless a staff changes it which drops it back to pending
        status: isAdmin ? editingExpense.status : 'Pending Approval'
      });
    } else {
      onAddExpense({
        category,
        topic: category === 'Others' ? topic.trim() : undefined,
        title: title.trim(),
        amount: numericAmount,
        paymentMethod,
        paymentSplits: paymentSplitsData,
        date,
        remarks: remarks.trim(),
        referenceId: referenceId || undefined,
        status: defaultStatus,
        createdBy: creatorName,
        approvedBy: isAdmin ? creatorName : undefined
      });
    }

    setIsFormOpen(false);
  };

  // Filter
  const filteredExpenses = displayExpenses.filter(exp => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      exp.expenseNo.toLowerCase().includes(term) ||
      exp.title.toLowerCase().includes(term) ||
      exp.remarks.toLowerCase().includes(term) ||
      exp.createdBy.toLowerCase().includes(term) ||
      (exp.referenceId && exp.referenceId.toLowerCase().includes(term));
    
    const matchesCategory = categoryFilter === 'All' || exp.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || exp.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-display flex items-center gap-2">
            <TrendingDown className="text-rose-600" />
            <span>Office Expenses & Payments Ledger</span>
          </h2>
          <p className="text-xs text-slate-500">Record rents, staff salaries, purchase order payouts, shareholder dividends, and utilities with administrative audit safeguards.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>Record New Expense</span>
        </button>
      </div>

      {/* Metrics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Approved Outflow */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-3xs flex items-center gap-4">
          <div className="p-3.5 bg-rose-50 text-rose-600 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Approved Disbursements</p>
            <h3 className="text-xl font-extrabold text-slate-800 font-mono mt-0.5">Rs. {totalApprovedAmount.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{approvedExpenses.length} fully signed payouts</p>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-3xs flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl animate-pulse">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Pending Board Approval</p>
            <h3 className="text-xl font-extrabold text-slate-800 font-mono mt-0.5">Rs. {totalPendingAmount.toLocaleString()}</h3>
            <p className="text-[10px] text-amber-600 font-semibold mt-0.5">{pendingExpenses.length} awaiting authorization</p>
          </div>
        </div>

        {/* Rent & Salary Outlay */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-3xs flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Building size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Rent & Salary Paid</p>
            <h3 className="text-xl font-extrabold text-slate-800 font-mono mt-0.5">
              Rs. {((categoryTotals['Rent'] || 0) + (categoryTotals['Salary'] || 0)).toLocaleString()}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Fikkal HQ operational costs</p>
          </div>
        </div>

        {/* Shareholder Payouts */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-3xs flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Shareholder Payouts</p>
            <h3 className="text-xl font-extrabold text-slate-800 font-mono mt-0.5">
              Rs. {(categoryTotals['Shareholder Payout'] || 0).toLocaleString()}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Authorized equity dividends</p>
          </div>
        </div>
      </div>

      {/* Mini Visual Chart Distribution - Horizontal Progress bars */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-3xs space-y-4">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Approved Category Breakdown</h4>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {(['Rent', 'Salary', 'Purchase Order', 'Office Supplies', 'Shareholder Payout', 'Others'] as ExpenseCategory[]).map(cat => {
            const amount = categoryTotals[cat] || 0;
            const percentage = totalApprovedAmount > 0 ? (amount / totalApprovedAmount) * 100 : 0;
            
            let barColor = 'bg-slate-400';
            if (cat === 'Rent') barColor = 'bg-blue-500';
            else if (cat === 'Salary') barColor = 'bg-indigo-500';
            else if (cat === 'Purchase Order') barColor = 'bg-rose-500';
            else if (cat === 'Office Supplies') barColor = 'bg-amber-500';
            else if (cat === 'Shareholder Payout') barColor = 'bg-emerald-500';

            return (
              <div key={cat} className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100/50">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                  <span className="truncate">{cat}</span>
                  <span className="font-mono">{percentage.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full ${barColor}`} style={{ width: `${percentage}%` }}></div>
                </div>
                <p className="text-[11px] font-extrabold text-slate-700 font-mono">Rs. {amount.toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <InteractiveSearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search expenses description, voucher no, logged by, remarks..."
            expandedWidth="w-full max-w-md"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full md:w-44 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-rose-500"
          >
            <option value="All">All Categories</option>
            <option value="Rent">Rent</option>
            <option value="Salary">Salary</option>
            <option value="Purchase Order">Purchase Order</option>
            <option value="Office Supplies">Office Supplies</option>
            <option value="Shareholder Payout">Shareholder Payout</option>
            <option value="Others">Others</option>
          </select>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-40 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-rose-500"
          >
            <option value="All">All Statuses</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Declined">Declined</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 uppercase font-mono tracking-wider text-[10px]">
                <th className="px-6 py-4 font-bold">Voucher No</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Category</th>
                <th className="px-6 py-4 font-bold">Expense Details</th>
                <th className="px-6 py-4 font-bold text-right">Amount</th>
                <th className="px-6 py-4 font-bold text-center">Payment</th>
                <th className="px-6 py-4 font-bold text-center">Audit Status</th>
                <th className="px-6 py-4 font-bold text-center">Authorized By</th>
                <th className="px-6 py-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-750 font-sans">
              {filteredExpenses.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50/50 transition duration-150">
                  
                  {/* Voucher No */}
                  <td className="px-6 py-4.5 font-bold font-mono text-slate-500 text-xs">
                    {exp.expenseNo}
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4.5 text-slate-500 font-mono text-xs whitespace-nowrap">
                    {exp.date}
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4.5 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        exp.category === 'Rent' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        exp.category === 'Salary' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        exp.category === 'Purchase Order' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        exp.category === 'Office Supplies' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
                        exp.category === 'Shareholder Payout' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {exp.category}
                      </span>
                      {exp.category === 'Others' && exp.topic && (
                        <span className="inline-block text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          {exp.topic}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Details */}
                  <td className="px-6 py-4.5 max-w-xs">
                    <p className="font-bold text-slate-800 text-sm">{exp.title}</p>
                    {exp.remarks && <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">{exp.remarks}</p>}
                    {exp.referenceId && (
                      <span className="inline-block mt-1 text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        Link Ref: {exp.referenceId.split(',').map(id => {
                          const found = supplyTransactions.find(t => t.id === id);
                          return found ? getFormattedPoNumber(found, supplyTransactions) : id.toUpperCase();
                        }).join(', ')}
                      </span>
                    )}
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-4.5 text-right font-extrabold text-slate-850 font-mono text-sm whitespace-nowrap">
                    Rs. {exp.amount.toLocaleString()}
                  </td>

                  {/* Payment Method */}
                  <td className="px-6 py-4.5 text-center font-mono text-[11px] whitespace-nowrap">
                    {exp.paymentMethod === 'Split' ? (
                      <div className="flex flex-col items-center">
                        <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          Split
                        </span>
                        {exp.paymentSplits && (
                          <span className="text-[9px] text-slate-400 font-sans mt-0.5 max-w-[130px] truncate" title={`Cash: ${exp.paymentSplits.Cash || (exp.paymentSplits as any).cash || 0}, eSewa: ${exp.paymentSplits.Esewa || (exp.paymentSplits as any).esewa || 0}, RBB: ${exp.paymentSplits.RBB || (exp.paymentSplits as any).rbb || 0}, Sahakari: ${exp.paymentSplits.Sahakari || (exp.paymentSplits as any).sahakari || 0}`}>
                            C:{exp.paymentSplits.Cash || (exp.paymentSplits as any).cash || 0} | E:{exp.paymentSplits.Esewa || (exp.paymentSplits as any).esewa || 0} | R:{exp.paymentSplits.RBB || (exp.paymentSplits as any).rbb || 0} | S:{exp.paymentSplits.Sahakari || (exp.paymentSplits as any).sahakari || 0}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-600 font-semibold uppercase">
                        {exp.paymentMethod}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4.5 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      exp.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      exp.status === 'Pending Approval' ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse' :
                      'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {exp.status === 'Approved' ? '✓ Approved' :
                       exp.status === 'Pending Approval' ? '⚡ Pending Sign' :
                       '✗ Declined'}
                    </span>
                  </td>

                  {/* Author / Creator details */}
                  <td className="px-6 py-4.5 space-y-0.5 max-w-[120px] truncate text-[11px]">
                    <p className="text-slate-500"><span className="text-[9px] text-slate-400 uppercase font-bold font-mono">Logged:</span> {exp.createdBy}</p>
                    {exp.approvedBy && (
                      <p className="text-emerald-700 font-medium">
                        <span className="text-[9px] text-slate-400 uppercase font-bold font-mono">Signed:</span> {exp.approvedBy}
                      </p>
                    )}
                  </td>

                  {/* Actions / Admin audits */}
                  <td className="px-6 py-4.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {/* Admin Audit Actions */}
                      {(currentUser.role === 'Admin' || currentUser.role === 'Super Admin') && exp.status === 'Pending Approval' && (
                        <>
                          <button
                            onClick={() => onApproveExpense(exp.id, currentUser.name || currentUser.username)}
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition cursor-pointer"
                            title="Sign & Approve Expense"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => onDeclineExpense(exp.id, currentUser.name || currentUser.username)}
                            className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                            title="Decline Expense"
                          >
                            <X size={13} />
                          </button>
                        </>
                      )}

                      {/* Print Voucher */}
                      {exp.status === 'Approved' && (
                        <button
                          onClick={() => {
                            if (window.openUniversalPrintPreview) {
                              window.openUniversalPrintPreview({
                                documentType: 'Expense Voucher',
                                documentNumber: exp.expenseNo,
                                documentDate: exp.date,
                                profile: profile,
                                title: 'Official Payment / Expense Disbursement Voucher',
                                items: [
                                  {
                                    sn: 1,
                                    name: exp.title,
                                    description: `Category: ${exp.category} | Payment Account: ${exp.paymentMethod}`,
                                    quantity: 1,
                                    unitPrice: exp.amount,
                                    totalPrice: exp.amount
                                  }
                                ],
                                subtotal: exp.amount,
                                grandTotal: exp.amount,
                                notes: exp.remarks ? `Remarks: ${exp.remarks}` : `Paid via ${exp.paymentMethod} account. Verified entry.`,
                                preparedBy: exp.recordedBy || currentUser.name,
                                approvedBy: `${profile.name} Accounts`
                              });
                            } else {
                              setPrintingVoucher(exp);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Print Voucher Receipt"
                        >
                          <Printer size={13} />
                        </button>
                      )}

                      {/* Regular Edit/Delete (Only allowed for pending, or full Admin edit) */}
                      {(currentUser.role === 'Admin' || currentUser.role === 'Super Admin' || exp.status === 'Pending Approval') && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(exp)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => {
                              const isSystemMaster = currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin';
                              if (!isSystemMaster) {
                                alert('Direct deletion is allowed for System Master (@reliableadmin) only.');
                                return;
                              }
                              if (confirm(`Delete expense record ${exp.expenseNo}?`)) {
                                onDeleteExpense(exp.id);
                              }
                            }}
                            className="p-1.5 rounded-lg transition cursor-pointer text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title={currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin' ? "Delete Record" : "Delete (System Master Only)"}
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>

                </tr>
              ))}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <p className="text-2xl">💸</p>
                    <p className="text-xs font-semibold mt-2">No expenses logged in this registry</p>
                    <p className="text-[10px] text-slate-400 mt-1">Try relaxing filters or click "Record New Expense" to ledger an outbound payment.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredExpenses.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-slate-200 bg-white rounded-lg text-xs py-1 px-1.5 focus:outline-hidden cursor-pointer"
              >
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500 font-medium font-mono">
                Showing {Math.min(filteredExpenses.length, (currentPage - 1) * pageSize + 1)}-{Math.min(currentPage * pageSize, filteredExpenses.length)} of {filteredExpenses.length} entries
              </span>
              <div className="flex gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition"
                  title="Previous Page"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-semibold text-slate-700 self-center font-mono">
                  Page {currentPage} of {Math.ceil(filteredExpenses.length / pageSize)}
                </span>
                <button
                  disabled={currentPage >= Math.ceil(filteredExpenses.length / pageSize)}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition"
                  title="Next Page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expense Creator Dialog Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg max-h-[calc(100dvh-2rem)] my-auto overflow-hidden animate-scale-in flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold font-display text-slate-800 text-lg">
                  {editingExpense ? `Edit Ledger Voucher: ${editingExpense.expenseNo}` : 'Record Outbound Payment / Expense'}
                </h3>
                <p className="text-[11px] text-slate-500">Record cash/bank operational payouts. Staff entries will require administrative signature.</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              
              {/* Category selector */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Outflow Category *</label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value as ExpenseCategory);
                      if (e.target.value !== 'Purchase Order') {
                        setReferenceId('');
                      }
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                  >
                    <option value="Rent">Rent Payment</option>
                    <option value="Salary">Salary Disbursement</option>
                    <option value="Purchase Order">Purchase Order Payment</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Shareholder Payout">Shareholder Dividend</option>
                    <option value="Others">Others / Miscellaneous</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Date of Payment *</label>
                  <input 
                    type="text"
                    required
                    placeholder="YYYY-MM-DD (B.S.)"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-rose-500 focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              {/* Purchase Order selection drawer inside the form */}
              {category === 'Purchase Order' && (
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-150/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase font-mono font-bold text-indigo-700">Link Outstanding Purchase Orders *</p>
                    <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                      {selectedPoIds.length} Selected
                    </span>
                  </div>
                  {openPurchaseOrders.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic">No pending or partially paid Purchase Orders are currently registered in your system.</p>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1 border border-indigo-100 rounded-lg p-2 bg-white">
                      {openPurchaseOrders.map(po => {
                        const supplier = suppliers.find(s => s.id === po.supplierId);
                        const isChecked = selectedPoIds.includes(po.id);
                        return (
                          <label key={po.id} className="flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs select-none transition">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePo(po.id)}
                              className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="flex-1">
                              <p className="font-bold text-slate-800 font-mono text-[11px]">
                                {getFormattedPoNumber(po, supplyTransactions)}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {supplier ? supplier.name : 'Supplier'} • <span className="font-semibold text-rose-600">Due: Rs. {po.amountDue.toLocaleString()}</span>
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-[9px] text-slate-400">Selecting multiple orders distributes payment sequentially (waterfall) in a single transaction voucher.</p>
                </div>
              )}

              {/* Topic for Others / Miscellaneous */}
              {category === 'Others' && (
                <div className="space-y-1 bg-amber-50/50 p-3 rounded-xl border border-amber-150/40 animate-fade-in">
                  <label className="text-xs font-bold text-slate-700 block">Expense Topic / Particular *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Fuel, Staff Lunch, Internet renewal, Cleaning..."
                    value={topic}
                    onChange={(e) => {
                      setTopic(e.target.value);
                      setTitle(`Miscellaneous Expense: ${e.target.value}`);
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-semibold"
                  />
                  <p className="text-[9px] text-slate-500">Specify the topic or purpose for this miscellaneous business outflow.</p>
                </div>
              )}

              {/* Title / Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Voucher Description *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Office Space Rent - Fikkal HQ"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>

              {/* Amount and Payment method */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Amount (Rs.) *</label>
                  <input 
                    type="number"
                    step="any"
                    required
                    min="0.01"
                    placeholder="e.g. 15000"
                    value={amount !== undefined ? amount : ''}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-rose-500 focus:border-rose-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Disbursed Via *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setPaymentMethod(val);
                      if (val === 'Split') {
                        const num = typeof amount === 'number' ? amount : (parseFloat(amount as any) || 0);
                        setSplitCash(num);
                        setSplitEsewa(0);
                        setSplitRbb(0);
                        setSplitSahakari(0);
                      }
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-hidden"
                  >
                    <option value="Cash">Cash Account</option>
                    <option value="Esewa">E-Sewa wallet</option>
                    <option value="Sahakari">Sahakari Cooperatives</option>
                    <option value="RBB">Rastriya Banijya Bank (RBB)</option>
                    <option value="Split">Split Payment (बहु-खाता विभाजन)</option>
                  </select>
                </div>
              </div>

              {/* Split Payment Allocation Box for Expenses */}
              {paymentMethod === 'Split' && (
                <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5 font-mono uppercase">
                      <span>Split Payment Breakdown (खर्च रकम विभाजन)</span>
                    </span>
                    <span className={`text-[11px] font-mono font-bold ${
                      Math.abs(
                        (Number(splitCash || 0) + Number(splitEsewa || 0) + Number(splitRbb || 0) + Number(splitSahakari || 0)) -
                        (typeof amount === 'number' ? amount : (parseFloat(amount as any) || 0))
                      ) < 0.01
                        ? 'text-emerald-700'
                        : 'text-rose-600'
                    }`}>
                      Allocated: Rs. {(Number(splitCash || 0) + Number(splitEsewa || 0) + Number(splitRbb || 0) + Number(splitSahakari || 0)).toLocaleString()} / Rs. {(typeof amount === 'number' ? amount : (parseFloat(amount as any) || 0)).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">Cash (नगद)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={splitCash || ''}
                        onChange={(e) => setSplitCash(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">eSewa (ई-सेवा)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={splitEsewa || ''}
                        onChange={(e) => setSplitEsewa(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-emerald-700 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">RBB Bank (आरबीबी)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={splitRbb || ''}
                        onChange={(e) => setSplitRbb(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-blue-700 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">Sahakari (सहकारी)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={splitSahakari || ''}
                        onChange={(e) => setSplitSahakari(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-indigo-700 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Shareholder specific check note */}
              {category === 'Shareholder Payout' && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-150/40 text-[10px] space-y-1">
                  <p className="font-bold uppercase tracking-wider font-mono">⚠️ Shareholder Audit Guard:</p>
                  <p>Logging dividend distributions directly impacts retained company assets. Please state the shareholder's PAN card or meeting decision date in the remarks below for board transparency.</p>
                </div>
              )}

              {/* Remarks */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Auditing Remarks & Notes</label>
                <textarea 
                  rows={2}
                  placeholder="State voucher details, reference names, approval board decisions or hardware serials..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>

              {/* Safety notice for Staff */}
              {currentUser.role === 'Staff' && (
                <div className="p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-150 text-[11px] flex gap-2">
                  <Lock size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Staff Entry Constraint:</span> This expense will be submitted as <strong className="text-amber-900">Pending Approval</strong>. It requires an Administrative signature before appearing in active accounting ledgers.
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4.5 py-2 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Check size={14} />
                  <span>
                    {editingExpense ? 'Save Changes' : currentUser.role === 'Admin' ? 'Approve & Save' : 'Request Signature'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT EXPENSE VOUCHER MODAL */}
      {printingVoucher && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl max-h-[calc(100dvh-2rem)] my-auto overflow-y-auto animate-scale-in print:border-none print:shadow-none print:rounded-none print:max-h-none">
            {/* Control Header - Hidden in Print */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between print:hidden shrink-0 sticky top-0 bg-slate-50 z-10">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Printer className="text-rose-600" size={16} />
                  <span>Cash Payment Disbursement Voucher</span>
                </h3>
                <p className="text-[11px] text-slate-500">Official cash / digital disbursement ledger voucher for auditing.</p>
              </div>
              <button 
                onClick={() => setPrintingVoucher(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Voucher Body */}
            <div className="p-8 space-y-6 bg-white" id="po-print-area">
              {/* Header Letterhead */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                <div className="flex items-start gap-3">
                  {profile.logoUrl && (
                    <img 
                      src={profile.logoUrl} 
                      alt="Logo" 
                      className="w-12 h-12 rounded-lg object-contain border border-slate-100 p-0.5 bg-white shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="space-y-1">
                    <h1 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">{profile.name}</h1>
                    <p className="text-xs text-slate-500">{profile.location}</p>
                    <p className="text-[11px] text-slate-500">Phone: {profile.phone} | Email: {profile.email}</p>
                    <p className="text-[11px] text-slate-500 font-mono">PAN: {profile.panNumber}</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <span className="inline-block bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-extrabold px-3 py-1 rounded-sm uppercase tracking-wider">Debit Voucher</span>
                  <p className="text-xs font-bold text-slate-800 font-mono mt-1">Voucher #: {printingVoucher.expenseNo}</p>
                  <p className="text-[11px] text-slate-500">Date: <span className="font-mono">{printingVoucher.date}</span></p>
                  <p className="text-[11px] text-slate-500">Status: <span className="font-mono font-semibold text-emerald-600 uppercase">AUDITED & APPROVED</span></p>
                </div>
              </div>

              {/* Transaction details */}
              <div className="space-y-3.5 text-xs">
                <div className="grid grid-cols-3 py-2 border-b border-slate-100">
                  <span className="text-slate-400 uppercase font-bold font-mono text-[10px]">Payment Category:</span>
                  <span className="col-span-2 font-bold text-slate-800 text-sm">{printingVoucher.category}</span>
                </div>

                <div className="grid grid-cols-3 py-2 border-b border-slate-100">
                  <span className="text-slate-400 uppercase font-bold font-mono text-[10px]">Paid To / Description:</span>
                  <span className="col-span-2 font-semibold text-slate-800 text-sm">{printingVoucher.title}</span>
                </div>

                <div className="grid grid-cols-3 py-2 border-b border-slate-100">
                  <span className="text-slate-400 uppercase font-bold font-mono text-[10px]">Disbursement Amount:</span>
                  <span className="col-span-2 font-extrabold text-rose-700 text-base font-mono">Rs. {printingVoucher.amount.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-3 py-2 border-b border-slate-100">
                  <span className="text-slate-400 uppercase font-bold font-mono text-[10px]">Method of Payment:</span>
                  <span className="col-span-2 font-semibold text-slate-800 uppercase font-mono">{printingVoucher.paymentMethod}</span>
                </div>

                {printingVoucher.remarks && (
                  <div className="grid grid-cols-3 py-2 border-b border-slate-100">
                    <span className="text-slate-400 uppercase font-bold font-mono text-[10px]">Audit Notes & Remarks:</span>
                    <span className="col-span-2 text-slate-600 italic leading-relaxed">{printingVoucher.remarks}</span>
                  </div>
                )}
              </div>

              {/* Terms and Signatures */}
              <div className="pt-6 border-t border-slate-150 text-[10px] text-slate-400 space-y-1">
                <p className="font-bold text-slate-600">Verification Certificate:</p>
                <p>This voucher certifies that the amount of Rs. {printingVoucher.amount.toLocaleString()} was officially released from the company accounts for the purposes stated above. It has been signed off in accordance with internal corporate procurement guidelines.</p>
              </div>

              {/* Signatures */}
              <div className="pt-10 flex justify-between items-end">
                <div className="text-center w-36">
                  <p className="text-[11px] font-bold text-slate-600 font-mono mb-1">{printingVoucher.createdBy}</p>
                  <div className="border-b border-slate-400 h-6"></div>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase font-semibold">Prepared By</p>
                </div>
                <div className="text-center w-36">
                  <div className="border-b border-slate-400 h-6"></div>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase font-semibold">Receiver's Signature</p>
                </div>
                <div className="text-center w-40">
                  <p className="text-[11px] font-bold text-indigo-600 uppercase italic font-mono mb-1">Signed & Audited</p>
                  <div className="border-b border-slate-900 h-6 font-mono text-[9px] text-slate-800 font-bold flex items-center justify-center">
                    {printingVoucher.approvedBy || 'Reliabletech Admin'}
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1 uppercase font-semibold">Authorized Signatory</p>
                </div>
              </div>
            </div>

            {/* Print controls - Hidden in Print */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex items-center justify-between print:hidden">
              <span className="text-[10px] text-slate-400">Ready for debit archive.</span>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setPrintingVoucher(null)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer"
                >
                  Close Preview
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (window.openUniversalPrintPreview) {
                      window.openUniversalPrintPreview({
                        documentType: 'Expense Voucher',
                        documentNumber: printingVoucher.expenseNo,
                        documentDate: printingVoucher.date,
                        profile: profile,
                        title: 'Official Payment / Expense Disbursement Voucher',
                        items: [
                          {
                            sn: 1,
                            name: printingVoucher.title,
                            description: `Category: ${printingVoucher.category} | Payment Account: ${printingVoucher.paymentMethod}`,
                            quantity: 1,
                            unitPrice: printingVoucher.amount,
                            totalPrice: printingVoucher.amount
                          }
                        ],
                        subtotal: printingVoucher.amount,
                        grandTotal: printingVoucher.amount,
                        notes: printingVoucher.remarks ? `Remarks: ${printingVoucher.remarks}` : `Paid via ${printingVoucher.paymentMethod} account. Verified entry.`,
                        preparedBy: printingVoucher.recordedBy || currentUser.name,
                        approvedBy: `${profile.name} Accounts`
                      });
                    } else {
                      window.print();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Print Voucher</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
