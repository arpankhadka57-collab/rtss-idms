import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  AlertCircle,
  History,
  CreditCard,
  Printer,
  Download,
  FileText
} from 'lucide-react';
import { Supplier, SupplierPayment, AppUser, BusinessProfile, DailyClosing, PeriodicClosing, OpeningBalances, SalesInvoice, Expense, SupplyTransaction, SalaryDistribution, AccountTransaction } from '../types';
import { getCurrentBsDate } from '../utils/nepaliDate';
import { InteractiveSearchBar } from './InteractiveSearchBar';
import { NepaliDatePicker } from './NepaliDatePicker';
import { checkDateLock } from '../utils/closingLocks';
import { validateAccountBalance, validateSplitAccountBalances, calculateAccountBalance, getAccountBucketLabel } from '../utils/accountBalance';

interface SuppliersListProps {
  suppliers: Supplier[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  onEditSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  supplierPayments: SupplierPayment[];
  onUpdateSupplierPayments: (payments: SupplierPayment[] | ((prev: SupplierPayment[]) => SupplierPayment[])) => void;
  onUpdateSuppliers: (suppliers: Supplier[] | ((prev: Supplier[]) => Supplier[])) => void;
  currentUser: AppUser;
  profile: BusinessProfile;
  onSendEditRequest?: (req: any) => void;
  onAddExpense?: (expense: any) => void;
  onDeleteSupplierPayment?: (id: string) => void;
  dailyClosings?: DailyClosing[];
  periodicClosings?: PeriodicClosing[];
  openingBalances?: OpeningBalances;
  invoices?: SalesInvoice[];
  expenses?: Expense[];
  transactions?: SupplyTransaction[];
  salaryDistributions?: SalaryDistribution[];
  accountTransfers?: AccountTransaction[];
}

export const SuppliersList: React.FC<SuppliersListProps> = ({
  suppliers,
  onAddSupplier,
  onEditSupplier,
  onDeleteSupplier,
  supplierPayments,
  onUpdateSupplierPayments,
  onUpdateSuppliers,
  currentUser,
  profile,
  onSendEditRequest,
  onAddExpense,
  onDeleteSupplierPayment,
  dailyClosings = [],
  periodicClosings = [],
  openingBalances,
  invoices = [],
  expenses = [],
  transactions = [],
  salaryDistributions = [],
  accountTransfers = []
}) => {
  // Filters & Searching
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [creditFilter, setCreditFilter] = useState('All'); // All, Has Dues, No Dues

  // Supplier Add/Edit Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'Active' | 'On Hold' | 'Inactive'>('Active');
  const [creditBalance, setCreditBalance] = useState<number | string>(0);
  const [panNumber, setPanNumber] = useState('');

  // Pay Due Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedSupplierForPay, setSelectedSupplierForPay] = useState<Supplier | null>(null);
  const [paymentType, setPaymentType] = useState<'Full' | 'Partial'>('Full');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentGateway, setPaymentGateway] = useState<string>('Cash');
  const [transactionNumber, setTransactionNumber] = useState<string>('');
  const [paymentRemarks, setPaymentRemarks] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [supplierSplits, setSupplierSplits] = useState<{ Cash: number; Esewa: number; RBB: number; Sahakari: number }>({
    Cash: 0,
    Esewa: 0,
    RBB: 0,
    Sahakari: 0
  });

  // Payment History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedSupplierForHistory, setSelectedSupplierForHistory] = useState<Supplier | null>(null);

  // Print Receipt Modal State
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [recentPaymentDone, setRecentPaymentDone] = useState<SupplierPayment | null>(null);

  // Statistics
  const totalOutstandingDue = suppliers.reduce((sum, s) => sum + s.creditBalance, 0);
  const activeSuppliersCount = suppliers.filter(s => s.status === 'Active').length;
  const totalPaymentsSettled = supplierPayments.reduce((sum, p) => sum + p.amountPaid, 0);

  // Open Handlers
  const openAddForm = () => {
    setEditingSupplier(null);
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setStatus('Active');
    setCreditBalance(0);
    setPanNumber('');
    setIsFormOpen(true);
  };

  const openEditForm = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setName(supplier.name);
    setContactPerson(supplier.contactPerson);
    setPhone(supplier.phone);
    setEmail(supplier.email);
    setAddress(supplier.address);
    setStatus(supplier.status);
    setCreditBalance(supplier.creditBalance);
    setPanNumber(supplier.panNumber || '');
    setIsFormOpen(true);
  };

  const handleOpenPayModal = (supplier: Supplier) => {
    setSelectedSupplierForPay(supplier);
    setPaymentType('Full');
    setPaymentAmount(supplier.creditBalance.toString());
    setPaymentGateway('Cash');
    setTransactionNumber('');
    setPaymentRemarks('');
    setPaymentDate(getCurrentBsDate());
    setSupplierSplits({
      Cash: supplier.creditBalance,
      Esewa: 0,
      RBB: 0,
      Sahakari: 0
    });
    setIsPayModalOpen(true);
  };

  const handleOpenHistoryModal = (supplier: Supplier) => {
    setSelectedSupplierForHistory(supplier);
    setIsHistoryModalOpen(true);
  };

  // Submit Supplier Form
  const handleSubmitSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numCredit = typeof creditBalance === 'number' ? creditBalance : (parseFloat(creditBalance) || 0);

    if (currentUser.role === 'User') {
      if (editingSupplier) {
        if (onSendEditRequest) {
          onSendEditRequest({
            id: `req-${Date.now()}`,
            type: 'Supplier Edit',
            details: `Proposed Supplier Update for "${editingSupplier.name}" (ID: ${editingSupplier.id}):
• Company Name: ${name.trim()} (was: ${editingSupplier.name})
• Personal Account Number (PAN): ${panNumber.trim() || 'N/A'} (was: ${editingSupplier.panNumber || 'N/A'})
• Contact Person: ${contactPerson.trim()} (was: ${editingSupplier.contactPerson})
• Phone: ${phone.trim()} (was: ${editingSupplier.phone})
• Email: ${email.trim()} (was: ${editingSupplier.email})
• Address: ${address.trim()} (was: ${editingSupplier.address})
• Status: ${status} (was: ${editingSupplier.status})
• Credit Balance: Rs. ${numCredit} (was: Rs. ${editingSupplier.creditBalance})`,
            targetSupplierId: editingSupplier.id,
            supplierData: {
              id: editingSupplier.id,
              name: name.trim(),
              contactPerson: contactPerson.trim(),
              phone: phone.trim(),
              email: email.trim(),
              address: address.trim(),
              productsSupplied: editingSupplier.productsSupplied || '',
              status,
              creditBalance: numCredit,
              rating: editingSupplier.rating || 5,
              panNumber: panNumber.trim()
            },
            date: getCurrentBsDate(),
            status: 'Pending'
          });
          alert("Supplier update request submitted successfully for Admin approval.");
        }
      } else {
        // User adding a supplier directly without approval (only edit and delete require approval)
        onAddSupplier({
          name: name.trim(),
          contactPerson: contactPerson.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          productsSupplied: '',
          status,
          creditBalance: numCredit,
          rating: 5,
          panNumber: panNumber.trim()
        });
        alert("Supplier registered successfully.");
      }
    } else {
      // Admin saves directly
      if (editingSupplier) {
        onEditSupplier({
          id: editingSupplier.id,
          name: name.trim(),
          contactPerson: contactPerson.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          productsSupplied: editingSupplier.productsSupplied || '',
          status,
          creditBalance: numCredit,
          rating: editingSupplier.rating || 5,
          panNumber: panNumber.trim()
        });
      } else {
        onAddSupplier({
          name: name.trim(),
          contactPerson: contactPerson.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          productsSupplied: '',
          status,
          creditBalance: numCredit,
          rating: 5,
          panNumber: panNumber.trim()
        });
      }
    }
    setIsFormOpen(false);
  };

  // Process Supplier Payment
  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForPay) return;

    const currentDue = selectedSupplierForPay.creditBalance;
    const amt = paymentType === 'Full' ? currentDue : Number(paymentAmount);

    if (isNaN(amt) || amt <= 0) {
      alert("Error: Please enter a valid payment amount greater than zero.");
      return;
    }
    if (amt > currentDue) {
      alert(`Error: Payment amount (Rs. ${amt.toLocaleString()}) cannot be greater than the outstanding due (Rs. ${currentDue.toLocaleString()}).`);
      return;
    }

    // 1. Check Date Lock - when daily closing is done, no transactions can be performed!
    const lockCheck = checkDateLock(paymentDate, dailyClosings, periodicClosings);
    if (lockCheck.locked) {
      alert(lockCheck.reason);
      return;
    }

    // 2. Validate Split payment allocations or single gateway
    if (paymentGateway === 'Split') {
      const splitTotal = Number(supplierSplits.Cash || 0) + Number(supplierSplits.Esewa || 0) + Number(supplierSplits.RBB || 0) + Number(supplierSplits.Sahakari || 0);
      if (Math.abs(splitTotal - amt) > 0.01) {
        alert(`Split allocation total (Rs. ${splitTotal.toLocaleString()}) does not match the payment amount (Rs. ${amt.toLocaleString()}). Please adjust the split breakdown values.`);
        return;
      }
    } else if (paymentGateway !== 'Cash' && !transactionNumber.trim()) {
      alert(`Error: Please enter a transaction number/reference for payment made via ${paymentGateway}.`);
      return;
    }

    // 3. Payment Basket Balance Validation: No transaction can be done when basket has no balance
    const balanceData = {
      openingBalances: openingBalances || {
        CASH: { openingBalance: 0, openingBalanceDate: '' },
        ESEWA: { openingBalance: 0, openingBalanceDate: '' },
        RBB: { openingBalance: 0, openingBalanceDate: '' },
        SAHAKARI: { openingBalance: 0, openingBalanceDate: '' },
        DUE: { openingBalance: 0, openingBalanceDate: '' }
      },
      invoices,
      expenses,
      transactions,
      salaryDistributions,
      accountTransfers,
      dailyClosings
    };

    if (paymentGateway === 'Split') {
      const insufficientSplits = validateSplitAccountBalances(supplierSplits, balanceData);
      if (insufficientSplits.length > 0) {
        const item = insufficientSplits[0];
        alert(`Transaction Blocked: Insufficient Balance in ${item.accountLabel}!\nAvailable balance: Rs. ${item.currentBalance.toLocaleString()}\nAllocated amount: Rs. ${item.requiredAmount.toLocaleString()}\n\nPlease choose another payment method or fund this account.`);
        return;
      }
    } else {
      const insufficient = validateAccountBalance(paymentGateway, amt, balanceData);
      if (insufficient) {
        alert(`Transaction Blocked: Insufficient Balance in ${insufficient.accountLabel}!\nAvailable balance: Rs. ${insufficient.currentBalance.toLocaleString()}\nRequired amount: Rs. ${insufficient.requiredAmount.toLocaleString()}\n\nPlease choose another payment method or fund this account.`);
        return;
      }
    }

    const remaining = currentDue - amt;

    const paymentRecord: SupplierPayment = {
      id: `pay-${Date.now()}`,
      supplierId: selectedSupplierForPay.id,
      supplierName: selectedSupplierForPay.name,
      date: paymentDate,
      amountPaid: amt,
      paymentGateway,
      transactionNumber: (paymentGateway === 'Cash' || paymentGateway === 'Split') ? undefined : transactionNumber.trim(),
      previousDue: currentDue,
      remainingDue: remaining,
      remarks: paymentGateway === 'Split'
        ? `Paid via Split [Cash: Rs. ${supplierSplits.Cash}, eSewa: Rs. ${supplierSplits.Esewa}, RBB: Rs. ${supplierSplits.RBB}, Sahakari: Rs. ${supplierSplits.Sahakari}]. ${paymentRemarks.trim() ? `Note: ${paymentRemarks.trim()}` : ''}`.trim()
        : paymentRemarks.trim() || undefined
    };

    // Save payment
    onUpdateSupplierPayments(prev => [paymentRecord, ...prev]);

    // Create corresponding approved expense for account synchronization and reporting
    if (onAddExpense) {
      onAddExpense({
        category: 'Others',
        title: `Supplier Payment: ${selectedSupplierForPay.name}`,
        topic: 'Supplier Due Clearance',
        amount: amt,
        paymentMethod: paymentGateway, // 'Cash' | 'Esewa' | 'Sahakari' | 'RBB' | 'Split'
        paymentSplits: paymentGateway === 'Split' ? supplierSplits : undefined,
        date: paymentDate,
        remarks: paymentGateway === 'Split'
          ? `Supplier credit payment via Split [Cash: Rs. ${supplierSplits.Cash}, eSewa: Rs. ${supplierSplits.Esewa}, RBB: Rs. ${supplierSplits.RBB}, Sahakari: Rs. ${supplierSplits.Sahakari}]. ${paymentRemarks.trim() ? `Remarks: ${paymentRemarks.trim()}` : ''}`.trim()
          : `Supplier credit payment. ${paymentRemarks.trim() ? `Remarks: ${paymentRemarks.trim()}` : ''}`.trim(),
        status: 'Approved',
        referenceId: paymentRecord.id
      });
    }

    // Update supplier outstanding due
    onUpdateSuppliers(prev => prev.map(s => s.id === selectedSupplierForPay.id ? {
      ...s,
      creditBalance: remaining
    } : s));

    setIsPayModalOpen(false);
    
    // Open Receipt immediately for print
    setRecentPaymentDone(paymentRecord);
    setIsReceiptOpen(true);
  };

  // Filter list
  const filteredSuppliers = suppliers.filter(sup => {
    const text = (sup.name + ' ' + sup.contactPerson + ' ' + sup.phone + ' ' + sup.address + ' ' + (sup.panNumber || '')).toLowerCase();
    const matchesSearch = text.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || sup.status === statusFilter;
    
    let matchesCredit = true;
    if (creditFilter === 'Has Dues') {
      matchesCredit = sup.creditBalance > 0;
    } else if (creditFilter === 'No Dues') {
      matchesCredit = sup.creditBalance === 0;
    }

    return matchesSearch && matchesStatus && matchesCredit;
  });

  // Download Due Report (CSV)
  const downloadSuppliersCsv = () => {
    const headers = ["Company Name", "Personal Account Number (PAN)", "Contact Person", "Phone", "Email", "Address", "Status", "Outstanding Due (Rs.)"];
    const rows = filteredSuppliers.map(s => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.panNumber || ''}"`,
      `"${s.contactPerson.replace(/"/g, '""')}"`,
      `"${s.phone}"`,
      `"${s.email}"`,
      `"${s.address.replace(/"/g, '""')}"`,
      s.status,
      s.creditBalance
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Suppliers_Due_Report_${getCurrentBsDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Payments Report (CSV)
  const downloadPaymentsCsv = () => {
    const headers = ["Date", "Supplier Name", "Amount Paid (Rs.)", "Payment Gateway", "Transaction Ref", "Remaining Due (Rs.)", "Remarks"];
    
    // If a supplier history is open, filter by that supplier, otherwise download all payments
    const targetPayments = selectedSupplierForHistory 
      ? supplierPayments.filter(p => p.supplierId === selectedSupplierForHistory.id)
      : supplierPayments;

    const rows = targetPayments.map(p => [
      p.date,
      `"${p.supplierName.replace(/"/g, '""')}"`,
      p.amountPaid,
      p.paymentGateway,
      `"${(p.transactionNumber || '').replace(/"/g, '""')}"`,
      p.remainingDue,
      `"${(p.remarks || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const fileName = selectedSupplierForHistory 
      ? `Payments_Report_${selectedSupplierForHistory.name.replace(/\s+/g, '_')}_${getCurrentBsDate()}.csv`
      : `Supplier_Payments_Ledger_All_${getCurrentBsDate()}.csv`;
      
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPrintReceipt = (paymentRecord?: any) => {
    if (window.openUniversalPrintPreview && selectedSupplierForHistory) {
      window.openUniversalPrintPreview({
        documentType: 'Supplier Voucher',
        documentNumber: `VCH-${paymentRecord?.id || selectedSupplierForHistory.id}`,
        documentDate: paymentRecord?.date || getCurrentBsDate(),
        profile: profile,
        recipient: {
          name: selectedSupplierForHistory.name,
          phone: selectedSupplierForHistory.phone,
          address: selectedSupplierForHistory.address,
          pan: selectedSupplierForHistory.panNumber
        },
        title: 'Supplier Account Payment Disbursement Voucher',
        items: [
          {
            sn: 1,
            name: `Vendor Account Clearance Payment (${selectedSupplierForHistory.name})`,
            description: `Payment Method: ${paymentRecord?.account || 'Cash / Bank Transfer'} | Remarks: ${paymentRecord?.remarks || 'Clearing Due Balance'}`,
            quantity: 1,
            unitPrice: paymentRecord?.amount || selectedSupplierForHistory.totalDues,
            totalPrice: paymentRecord?.amount || selectedSupplierForHistory.totalDues
          }
        ],
        subtotal: paymentRecord?.amount || selectedSupplierForHistory.totalDues,
        grandTotal: paymentRecord?.amount || selectedSupplierForHistory.totalDues,
        notes: `Vendor Dues Paid. Voucher recorded in Reliabletech Ledger.`,
        preparedBy: currentUser.name,
        approvedBy: `${profile.name} Accounts`
      });
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* CSS style wrapper to target print media natively within standard browser frames */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-receipt-section, #print-receipt-section * {
            visibility: visible;
          }
          #print-receipt-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 20px !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-display">Suppliers Registry</h2>
          <p className="text-xs text-slate-500">Track and coordinate procurement contacts, outstanding balances, and ledger settlements.</p>
        </div>
        <button 
          onClick={openAddForm}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition duration-200 cursor-pointer"
          id="btn-add-supplier"
        >
          <Plus size={16} />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-bold">
            <DollarSign size={22} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold">Total Outstanding Due</p>
            <h3 className="text-xl font-bold text-rose-600 font-display">Rs. {totalOutstandingDue.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <User size={22} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold">Active Suppliers</p>
            <h3 className="text-xl font-bold text-slate-800 font-display">{activeSuppliersCount} Registered</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            <History size={20} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold">Total Payments Cleared</p>
            <h3 className="text-xl font-bold text-indigo-600 font-display">Rs. {totalPaymentsSettled.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-3xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 w-full md:flex-1 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <InteractiveSearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search supplier name, contact person, phone, address..."
              expandedWidth="w-full max-w-md"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-40 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Vendors</option>
            <option value="On Hold">On Hold</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select
            value={creditFilter}
            onChange={(e) => setCreditFilter(e.target.value)}
            className="w-full md:w-40 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="All">All Credit Statuses</option>
            <option value="Has Dues">Has Outstanding Due</option>
            <option value="No Dues">No Outstanding Due</option>
          </select>
        </div>

        {/* Action / CSV Downloads */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={downloadSuppliersCsv}
            className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2.5 rounded-xl transition cursor-pointer"
            title="Download Suppliers Due Report"
          >
            <Download size={14} className="text-slate-500" />
            <span>Due Report</span>
          </button>
          <button
            onClick={downloadPaymentsCsv}
            className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2.5 rounded-xl transition cursor-pointer"
            title="Download Payments Ledger Report"
          >
            <Download size={14} className="text-slate-500" />
            <span>Payments Ledger</span>
          </button>
        </div>
      </div>

      {/* Suppliers Table View */}
      <div className="bg-white border border-slate-100 shadow-xs rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                <th className="px-6 py-4">Supplier / Company Name</th>
                <th className="px-6 py-4">Primary Contact Person</th>
                <th className="px-6 py-4 text-right">Outstanding Due</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {filteredSuppliers.map(sup => {
                const hasDue = sup.creditBalance > 0;
                return (
                  <tr key={sup.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-950">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 font-display">{sup.name}</span>
                        <span className="text-[11px] text-slate-400 font-normal flex items-center gap-1 mt-0.5">
                          <MapPin size={11} className="text-slate-400 shrink-0" />
                          {sup.address}
                        </span>
                        {sup.panNumber ? (
                          <span className="text-[10px] text-indigo-700 font-mono font-bold bg-indigo-50 border border-indigo-100/50 px-1.5 py-0.5 rounded w-max mt-1 flex items-center gap-1" title="Personal Account Number">
                            <span className="text-[8px] uppercase tracking-wider text-indigo-400">PAN</span> {sup.panNumber}
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400 italic mt-1 font-mono">No Personal Account Number (PAN) Registered</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <User size={12} className="text-slate-400 shrink-0" />
                          {sup.contactPerson}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Phone size={11} className="text-slate-400 shrink-0" />
                          {sup.phone}
                        </span>
                        {sup.email && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Mail size={11} className="text-slate-400 shrink-0" />
                            {sup.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex flex-col items-end">
                        <span className={`text-sm font-bold font-mono ${hasDue ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg' : 'text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg'}`}>
                          Rs. {sup.creditBalance.toLocaleString()}
                        </span>
                        {hasDue && (
                          <span className="text-[10px] text-rose-500 flex items-center gap-0.5 mt-1 font-semibold animate-pulse">
                            <AlertCircle size={10} />
                            Due Balance
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        sup.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        sup.status === 'On Hold' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {sup.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Pay Due Action */}
                        <button
                          onClick={() => handleOpenPayModal(sup)}
                          disabled={sup.creditBalance <= 0}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            sup.creditBalance > 0
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <CreditCard size={13} />
                          <span>Pay Due</span>
                        </button>

                        {/* History Trigger */}
                        <button
                          onClick={() => handleOpenHistoryModal(sup)}
                          className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 border border-slate-100 transition cursor-pointer"
                          title="Payment History"
                        >
                          <History size={14} />
                        </button>

                        {/* Edit Supplier */}
                        <button
                          onClick={() => openEditForm(sup)}
                          className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 border border-slate-100 transition cursor-pointer"
                          title="Edit Supplier"
                        >
                          <Edit3 size={14} />
                        </button>

                        {/* Delete Supplier */}
                        <button
                          onClick={() => {
                            const isSystemMaster = currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin';
                            if (isSystemMaster) {
                              if (confirm(`Are you sure you want to permanently delete supplier ${sup.name}?`)) {
                                onDeleteSupplier(sup.id);
                              }
                            } else {
                              if (onSendEditRequest) {
                                if (confirm(`Direct deletion is allowed for System Master (@reliableadmin) only. Would you like to submit a deletion request for "${sup.name}"?`)) {
                                  onSendEditRequest({
                                    id: `req-${Date.now()}`,
                                    type: 'Supplier Deletion',
                                    details: `Proposed Supplier Deletion:
• Company Name: ${sup.name}
• PAN: ${sup.panNumber || 'N/A'}
• Contact Person: ${sup.contactPerson}
• Phone: ${sup.phone}
• Current Credit Balance: Rs. ${sup.creditBalance}`,
                                    targetSupplierId: sup.id,
                                    date: getCurrentBsDate(),
                                    status: 'Pending'
                                  });
                                  alert("Supplier deletion request submitted for System Master (@reliableadmin) approval.");
                                }
                              } else {
                                alert("Direct deletion is allowed for System Master (@reliableadmin) only.");
                              }
                            }
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 transition cursor-pointer"
                          title={currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin' ? "Delete Supplier" : "Request Delete"}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={5} className="bg-white py-12 text-center space-y-3">
                    <p className="text-3xl">👥</p>
                    <h4 className="font-bold text-slate-700">No suppliers found</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      No matching records found. Try resetting search strings or filter criteria.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Supplier Add/Edit Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg max-h-[calc(100dvh-2rem)] my-auto overflow-hidden flex flex-col animate-scale-in">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold font-display text-slate-800 text-lg">
                  {editingSupplier ? 'Edit Supplier Contact' : 'New Procurement Supplier'}
                </h3>
                <p className="text-[11px] text-slate-500">Register or update supplier company info and opening outstanding credit books.</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitSupplier} className="p-6 space-y-4">
              
              {/* Supplier Business Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Supplier Company Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Kathmandu Wholesale Security, Mechi Cabling Traders"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Contact Person Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Primary Contact Person *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Dinesh Adhikari"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Contact numbers and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Phone Number *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. 027-520443 or +977-985..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Email Address</label>
                  <input 
                    type="email"
                    placeholder="e.g. sales@vendor.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Physical Address & Personal Account Number (PAN) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Office Address *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Birtamode, Jhapa or Kathmandu, Nepal"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Personal Account Number (PAN)</label>
                  <input 
                    type="text"
                    placeholder="e.g. 601245892"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Status and Credit Balance block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Vendor Status *</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Opening Credit Balance (Rs.)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">Rs.</span>
                    <input 
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0"
                      value={creditBalance !== undefined ? creditBalance : ''}
                      onChange={(e) => setCreditBalance(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Submit panel */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Check size={14} />
                  <span>{editingSupplier ? 'Update Supplier' : 'Save Supplier'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. Process Pay Due Modal */}
      {isPayModalOpen && selectedSupplierForPay && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg max-h-[calc(100dvh-2rem)] my-auto overflow-hidden flex flex-col animate-scale-in">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold font-display text-slate-800 text-lg flex items-center gap-2">
                  <CreditCard className="text-emerald-600" size={18} />
                  <span>Settle Supplier Balance Due</span>
                </h3>
                <p className="text-[11px] text-slate-500">Record a full or partial credit settlement payment made to {selectedSupplierForPay.name}.</p>
              </div>
              <button 
                onClick={() => setIsPayModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
              
              {/* Info block */}
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wide">Outstanding Due Ledger</h4>
                  <p className="text-xs text-rose-700 mt-0.5 font-medium">
                    We currently owe <span className="font-bold font-mono text-sm">Rs. {selectedSupplierForPay.creditBalance.toLocaleString()}</span> to this supplier.
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Payment Date (BS) *</label>
                <NepaliDatePicker 
                  value={paymentDate}
                  onChange={(d) => setPaymentDate(d)}
                  placeholder="YYYY-MM-DD"
                  required
                  id="supplier-pay-due-date-picker"
                />
              </div>

              {/* Payment Type */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Payment Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('Full');
                      setPaymentAmount(selectedSupplierForPay.creditBalance.toString());
                    }}
                    className={`py-2 px-4 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      paymentType === 'Full' 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold' 
                        : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                    }`}
                  >
                    Full Payment (Rs. {selectedSupplierForPay.creditBalance.toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('Partial');
                      setPaymentAmount('');
                    }}
                    className={`py-2 px-4 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      paymentType === 'Partial' 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold' 
                        : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                    }`}
                  >
                    Partial Payment
                  </button>
                </div>
              </div>

              {/* Amount Inputs */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Amount Paid (Rs.) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">Rs.</span>
                  <input 
                    type="number"
                    step="any"
                    required
                    disabled={paymentType === 'Full'}
                    min="0.01"
                    max={selectedSupplierForPay.creditBalance}
                    placeholder="Enter amount to pay"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono bg-white disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>

              {/* Gateway & Transaction Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Payment Gateway / Account *</label>
                  <select 
                    value={paymentGateway}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPaymentGateway(val);
                      if (val === 'Cash' || val === 'Split') {
                        setTransactionNumber('');
                      }
                      if (val === 'Split') {
                        const amt = paymentType === 'Full' ? (selectedSupplierForPay?.creditBalance || 0) : (Number(paymentAmount) || 0);
                        setSupplierSplits({
                          Cash: amt,
                          Esewa: 0,
                          RBB: 0,
                          Sahakari: 0
                        });
                      }
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-medium"
                  >
                    <option value="Cash">💵 Cash in Hand</option>
                    <option value="Esewa">📱 Esewa Wallet</option>
                    <option value="RBB">🏦 Rastriya Banijya Bank (RBB)</option>
                    <option value="Sahakari">🏦 Sahakari Cooperatives</option>
                    <option value="Split">🔀 Split Payment (Cash, eSewa, RBB, Sahakari)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Transaction / Ref Number {(paymentGateway !== 'Cash' && paymentGateway !== 'Split') && ' *'}
                  </label>
                  <input 
                    type="text"
                    required={paymentGateway !== 'Cash' && paymentGateway !== 'Split'}
                    disabled={paymentGateway === 'Cash' || paymentGateway === 'Split'}
                    placeholder={paymentGateway === 'Cash' || paymentGateway === 'Split' ? "Not required" : "e.g. TXN-892341"}
                    value={transactionNumber}
                    onChange={(e) => setTransactionNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono bg-white disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              </div>

              {/* Split Payment Allocation Box */}
              {paymentGateway === 'Split' && (() => {
                const currentBalData = {
                  openingBalances: openingBalances || {
                    CASH: { openingBalance: 0, openingBalanceDate: '' },
                    ESEWA: { openingBalance: 0, openingBalanceDate: '' },
                    RBB: { openingBalance: 0, openingBalanceDate: '' },
                    SAHAKARI: { openingBalance: 0, openingBalanceDate: '' },
                    DUE: { openingBalance: 0, openingBalanceDate: '' }
                  },
                  invoices,
                  expenses,
                  transactions,
                  salaryDistributions,
                  accountTransfers,
                  dailyClosings
                };
                const cashBal = calculateAccountBalance('CASH', currentBalData);
                const esewaBal = calculateAccountBalance('ESEWA', currentBalData);
                const rbbBal = calculateAccountBalance('RBB', currentBalData);
                const sahakariBal = calculateAccountBalance('SAHAKARI', currentBalData);

                const currentAmt = paymentType === 'Full' ? (selectedSupplierForPay?.creditBalance || 0) : (Number(paymentAmount) || 0);
                const splitSum = Number(supplierSplits.Cash || 0) + Number(supplierSplits.Esewa || 0) + Number(supplierSplits.RBB || 0) + Number(supplierSplits.Sahakari || 0);
                const diff = currentAmt - splitSum;

                return (
                  <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                        <span>Split Payment Breakdown (रकम विभाजन)</span>
                      </span>
                      <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                        Math.abs(diff) < 0.01 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        Allocated: Rs. {splitSum.toLocaleString()} / Rs. {currentAmt.toLocaleString()}
                        {Math.abs(diff) >= 0.01 && ` (${diff > 0 ? `Rs. ${diff.toLocaleString()} remaining` : `Rs. ${Math.abs(diff).toLocaleString()} over`})`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-slate-700">💵 Cash</span>
                          <span className={`font-mono ${cashBal < Number(supplierSplits.Cash || 0) ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            Avail: {cashBal.toLocaleString()}
                          </span>
                        </div>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={supplierSplits.Cash !== undefined ? supplierSplits.Cash : ''}
                          onChange={(e) => setSupplierSplits(prev => ({ ...prev, Cash: parseFloat(e.target.value) || 0 }))}
                          className={`w-full border rounded-lg p-2 text-xs font-mono font-bold bg-white focus:outline-hidden ${
                            cashBal < Number(supplierSplits.Cash || 0) ? 'border-rose-400 text-rose-700 bg-rose-50/40' : 'border-slate-200'
                          }`}
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-slate-700">📱 eSewa</span>
                          <span className={`font-mono ${esewaBal < Number(supplierSplits.Esewa || 0) ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            Avail: {esewaBal.toLocaleString()}
                          </span>
                        </div>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={supplierSplits.Esewa !== undefined ? supplierSplits.Esewa : ''}
                          onChange={(e) => setSupplierSplits(prev => ({ ...prev, Esewa: parseFloat(e.target.value) || 0 }))}
                          className={`w-full border rounded-lg p-2 text-xs font-mono font-bold bg-white focus:outline-hidden ${
                            esewaBal < Number(supplierSplits.Esewa || 0) ? 'border-rose-400 text-rose-700 bg-rose-50/40' : 'border-slate-200'
                          }`}
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-slate-700">🏦 RBB Bank</span>
                          <span className={`font-mono ${rbbBal < Number(supplierSplits.RBB || 0) ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            Avail: {rbbBal.toLocaleString()}
                          </span>
                        </div>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={supplierSplits.RBB !== undefined ? supplierSplits.RBB : ''}
                          onChange={(e) => setSupplierSplits(prev => ({ ...prev, RBB: parseFloat(e.target.value) || 0 }))}
                          className={`w-full border rounded-lg p-2 text-xs font-mono font-bold bg-white focus:outline-hidden ${
                            rbbBal < Number(supplierSplits.RBB || 0) ? 'border-rose-400 text-rose-700 bg-rose-50/40' : 'border-slate-200'
                          }`}
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-slate-700">🏦 Sahakari</span>
                          <span className={`font-mono ${sahakariBal < Number(supplierSplits.Sahakari || 0) ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            Avail: {sahakariBal.toLocaleString()}
                          </span>
                        </div>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={supplierSplits.Sahakari !== undefined ? supplierSplits.Sahakari : ''}
                          onChange={(e) => setSupplierSplits(prev => ({ ...prev, Sahakari: parseFloat(e.target.value) || 0 }))}
                          className={`w-full border rounded-lg p-2 text-xs font-mono font-bold bg-white focus:outline-hidden ${
                            sahakariBal < Number(supplierSplits.Sahakari || 0) ? 'border-rose-400 text-rose-700 bg-rose-50/40' : 'border-slate-200'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Remaining balance preview */}
              {selectedSupplierForPay && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex justify-between items-center text-xs font-medium">
                  <span className="text-slate-500">Remaining Balance Due (To Pay Later):</span>
                  <span className="text-sm font-bold font-mono text-slate-800">
                    Rs. {(selectedSupplierForPay.creditBalance - (Number(paymentAmount) || 0)).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Remarks */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Payment Remarks / Notes</label>
                <input 
                  type="text"
                  placeholder="e.g. Cleared hardware PO balance"
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Check size={14} />
                  <span>Confirm Settlement</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 3. Payment Receipt Dialog (Print view) */}
      {isReceiptOpen && recentPaymentDone && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:block animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[calc(100dvh-2rem)] my-auto overflow-y-auto animate-scale-in print:border-none print:shadow-none print:rounded-none print:max-w-full print:w-full">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between no-print shrink-0">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                Payment Completed Successfully!
              </span>
              <button 
                onClick={() => {
                  setIsReceiptOpen(false);
                  setRecentPaymentDone(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Printable Receipt Paper */}
            <div className="p-6 bg-white" id="print-receipt-section">
              <div className="border border-slate-200 p-6 rounded-2xl space-y-6 bg-white text-slate-900 shadow-sm print:border-0 print:shadow-none print:p-0">
                
                {/* Company / Brand Details */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-md font-bold text-slate-900 font-display uppercase tracking-wide">
                      {profile.companyName || "Reliabletech Enterprise Suite"}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">{profile.address || "Birtamode, Jhapa, Nepal"}</p>
                    <p className="text-[11px] text-slate-400 font-mono">Tel: {profile.phone || "+977-023-540000"}</p>
                  </div>
                  <div className="text-right">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Debit Payment Voucher</h4>
                    <span className="text-sm font-bold text-emerald-600 font-mono block mt-1">
                      PV-{recentPaymentDone.id.split('-')[1]}
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">Date: {recentPaymentDone.date}</p>
                  </div>
                </div>

                {/* Recipient Vendor info */}
                <div className="space-y-1">
                  <p className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Paid To Supplier (Payee)</p>
                  <p className="font-bold text-slate-900 font-display text-sm">{recentPaymentDone.supplierName}</p>
                  <p className="text-[11px] text-slate-500">
                    Settle account for credit transactions and procurement order invoices.
                  </p>
                </div>

                {/* Ledger Details Table */}
                <div className="border border-slate-150 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-mono uppercase text-[9px] tracking-wider">
                        <th className="px-3.5 py-2.5">Transaction Description</th>
                        <th className="px-3.5 py-2.5 text-right">Outstanding (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      <tr>
                        <td className="px-3.5 py-2.5">
                          <p className="font-semibold text-slate-800">Supplier Credit Settlement</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Settled via <span className="font-bold text-indigo-600">{recentPaymentDone.paymentGateway}</span>
                            {recentPaymentDone.transactionNumber && ` (Ref: ${recentPaymentDone.transactionNumber})`}
                          </p>
                          {recentPaymentDone.remarks && (
                            <p className="text-[10px] text-slate-400 italic mt-0.5">Note: "{recentPaymentDone.remarks}"</p>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-slate-600">
                          Rs. {recentPaymentDone.previousDue.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="bg-emerald-50/20 font-bold text-emerald-700">
                        <td className="px-3.5 py-2.5 text-right">Amount Settled & Cleared (Dr.):</td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-emerald-600 text-xs">
                          - Rs. {recentPaymentDone.amountPaid.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="bg-slate-50 font-bold text-slate-800">
                        <td className="px-3.5 py-2.5 text-right">Remaining Balance Outstanding Due:</td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-slate-900 text-xs">
                          Rs. {recentPaymentDone.remainingDue.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-10 pt-10 text-[10px] font-mono">
                  <div className="border-t border-dashed border-slate-200 text-center text-slate-400 pt-2">
                    Prepared By ({currentUser.name})
                  </div>
                  <div className="border-t border-dashed border-slate-200 text-center text-slate-400 pt-2">
                    Authorized Payee Signature
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Controls */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex items-center justify-end gap-3 no-print">
              <button 
                type="button"
                onClick={() => {
                  setIsReceiptOpen(false);
                  setRecentPaymentDone(null);
                }}
                className="px-4 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer"
              >
                Close Receipt
              </button>
              <button 
                type="button"
                onClick={triggerPrintReceipt}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Printer size={14} />
                <span>Print Payment Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Payment History Ledger Modal */}
      {isHistoryModalOpen && selectedSupplierForHistory && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[calc(100dvh-2rem)] my-auto overflow-hidden flex flex-col animate-scale-in">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold font-display text-slate-800 text-lg flex items-center gap-2">
                  <History className="text-indigo-600" size={18} />
                  <span>Payment Log History</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Reviewing history logs of all settled credit installments for <span className="font-bold text-slate-700">{selectedSupplierForHistory.name}</span>.
                </p>
              </div>
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Toolbar */}
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider font-mono">
                  Settle Record entries
                </span>
                <button
                  onClick={downloadPaymentsCsv}
                  disabled={supplierPayments.filter(p => p.supplierId === selectedSupplierForHistory.id).length === 0}
                  className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={13} className="text-slate-500" />
                  <span>Download Ledger CSV</span>
                </button>
              </div>

              {/* Table */}
              <div className="border border-slate-150 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-semibold font-mono text-[10px] uppercase tracking-wider">
                      <th className="px-4 py-3">Settlement Date</th>
                      <th className="px-4 py-3 text-right">Paid Amount</th>
                      <th className="px-4 py-3">Payment Gateway</th>
                      <th className="px-4 py-3">Transaction / Ref</th>
                      <th className="px-4 py-3 text-right">Remaining Due</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {supplierPayments
                      .filter(p => p.supplierId === selectedSupplierForHistory.id)
                      .map(pay => (
                        <tr key={pay.id} className="hover:bg-slate-50/40 transition">
                          <td className="px-4 py-3 font-semibold font-mono text-slate-800">{pay.date}</td>
                          <td className="px-4 py-3 text-right text-emerald-600 font-bold font-mono">
                            Rs. {pay.amountPaid.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                              {pay.paymentGateway}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                            {pay.transactionNumber || <span className="text-slate-400 italic">None (Cash)</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-600">
                            Rs. {pay.remainingDue.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setRecentPaymentDone(pay);
                                  setIsReceiptOpen(true);
                                }}
                                className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition cursor-pointer"
                                title="Print Receipt Bill"
                              >
                                <Printer size={13} />
                              </button>
                              {onDeleteSupplierPayment && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const isSystemMaster = currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin';
                                    if (!isSystemMaster) {
                                      alert("Direct deletion is allowed for System Master (@reliableadmin) only.");
                                      return;
                                    }
                                    if (confirm(`Are you sure you want to delete this payment record of Rs. ${pay.amountPaid.toLocaleString()}? This will restore the supplier's credit due balance and remove the corresponding expense.`)) {
                                      onDeleteSupplierPayment(pay.id);
                                    }
                                  }}
                                  className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                                  title={currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin' ? "Delete Payment Record" : "Delete (System Master Only)"}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}

                    {supplierPayments.filter(p => p.supplierId === selectedSupplierForHistory.id).length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-400 font-normal">
                          No previous payments found for this supplier. Press 'Pay Due' to log a new settlement transaction.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex items-center justify-end">
              <button 
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-5 py-2.5 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition cursor-pointer"
              >
                Close History Logs
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
