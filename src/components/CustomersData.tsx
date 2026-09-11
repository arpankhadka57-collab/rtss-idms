import React, { useState } from 'react';
import { getCurrentBsDate } from '../utils/nepaliDate';
import { 
  Users, 
  Search, 
  DollarSign, 
  Clock, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  ArrowUpRight, 
  Check, 
  X,
  CreditCard,
  User,
  Phone,
  Mail,
  MapPin,
  ListFilter,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit2,
  Edit3,
  Lock,
  Shield,
  Save,
  AlertCircle,
  Printer,
  Download
} from 'lucide-react';
import { SalesInvoice, BusinessService, AppUser, CustomerAccount, BusinessProfile, DailyClosing, PeriodicClosing } from '../types';
import { InteractiveSearchBar } from './InteractiveSearchBar';
import { NepaliDatePicker } from './NepaliDatePicker';
import { checkDateLock } from '../utils/closingLocks';

interface CustomersDataProps {
  invoices: SalesInvoice[];
  services: BusinessService[];
  onUpdateInvoices: (updatedInvoices: SalesInvoice[]) => void;
  currentUserRole?: string;
  currentUser?: AppUser;
  onSendEditRequest?: (request: any) => void;
  customerAccounts?: CustomerAccount[];
  onUpdateCustomerAccounts?: (updatedAccounts: CustomerAccount[]) => void;
  profile?: BusinessProfile;
  dailyClosings?: DailyClosing[];
  periodicClosings?: PeriodicClosing[];
}

interface InvoiceDueEditRow {
  id: string;
  invoiceNumber: string;
  date: string;
  totalAmount: number;
  finalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Cancelled';
}

interface EditPaidDuesModalState {
  customerName: string;
  totalPurchased: number;
  invoices: InvoiceDueEditRow[];
  reason: string;
}

interface EditingCustomerState {
  originalName: string;
  originalPhone?: string;
  accountId?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  invoicesCount: number;
}

export const CustomersData: React.FC<CustomersDataProps> = ({
  invoices,
  services,
  onUpdateInvoices,
  currentUserRole,
  currentUser,
  onSendEditRequest,
  customerAccounts = [],
  onUpdateCustomerAccounts,
  profile,
  dailyClosings = [],
  periodicClosings = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dueFilter, setDueFilter] = useState<'All' | 'WithDue' | 'PaidOnly'>('All');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Selected customer for history view
  const [selectedCustomerName, setSelectedCustomerName] = useState<string | null>(null);

  // Selected customer for comprehensive printable statement & invoice summary
  const [statementCustomer, setStatementCustomer] = useState<{
    name: string;
    phone: string;
    email: string;
    address: string;
    totalPurchased: number;
    totalPaid: number;
    totalDue: number;
    lastTxDate: string;
    invoices: SalesInvoice[];
    accountId?: string;
  } | null>(null);
  
  // Due payment modal state
  const [paymentCustomer, setPaymentCustomer] = useState<{ name: string; outstanding: number } | null>(null);
  const [payAmount, setPayAmount] = useState<number | string>(0);
  const [payDate, setPayDate] = useState<string>(getCurrentBsDate());
  const [payMethod, setPayMethod] = useState<'Cash' | 'Esewa' | 'Sahakari' | 'RBB' | 'Split'>('Cash');
  const [paySplits, setPaySplits] = useState<{ Cash: number; Esewa: number; RBB: number; Sahakari: number }>({
    Cash: 0,
    Esewa: 0,
    RBB: 0,
    Sahakari: 0
  });
  const [payRemarks, setPayRemarks] = useState('');

  // Customer Edit details modal state
  const [editingCustomer, setEditingCustomer] = useState<EditingCustomerState | null>(null);
  const [editError, setEditError] = useState('');
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

  // ReliableAdmin authorization check
  const isReliableAdmin = currentUser?.username?.trim().toLowerCase() === 'reliableadmin';
  const [editingPaidDues, setEditingPaidDues] = useState<EditPaidDuesModalState | null>(null);

  // Aggregate customer accounts dynamically from invoices & registered accounts
  const customerMap: { [key: string]: {
    name: string;
    phone: string;
    email: string;
    address: string;
    totalPurchased: number;
    totalPaid: number;
    totalDue: number;
    lastTxDate: string;
    invoices: SalesInvoice[];
    accountId?: string;
  }} = {};

  invoices.forEach(inv => {
    const key = inv.customerName.trim().toLowerCase();
    const invEmail = (inv as any).customerEmail || (inv as any).customer_email || '';
    if (!customerMap[key]) {
      const matchingAccount = customerAccounts?.find(ca => 
        ca.name.trim().toLowerCase() === key || 
        (inv.customerPhone && ca.phone === inv.customerPhone)
      );

      customerMap[key] = {
        name: inv.customerName,
        phone: (inv.customerPhone && inv.customerPhone !== 'N/A') ? inv.customerPhone : (matchingAccount?.phone || 'N/A'),
        email: invEmail || matchingAccount?.email || '',
        address: (inv.customerAddress && inv.customerAddress !== 'N/A') ? inv.customerAddress : (matchingAccount?.detailed_address || 'N/A'),
        totalPurchased: 0,
        totalPaid: 0,
        totalDue: 0,
        lastTxDate: inv.date,
        invoices: [],
        accountId: matchingAccount?.customer_id
      };
    }

    const cust = customerMap[key];
    cust.totalPurchased += inv.finalAmount;
    cust.totalPaid += inv.paidAmount;
    cust.totalDue += inv.dueAmount;
    cust.invoices.push(inv);

    if (invEmail && !cust.email) {
      cust.email = invEmail;
    }

    // Track the latest invoice date & contact info
    if (inv.date >= cust.lastTxDate) {
      cust.lastTxDate = inv.date;
      if (inv.customerPhone && inv.customerPhone !== 'N/A') cust.phone = inv.customerPhone;
      if (inv.customerAddress && inv.customerAddress !== 'N/A') cust.address = inv.customerAddress;
      if (invEmail) cust.email = invEmail;
    }
  });

  // Also include registered customer accounts who might not have invoices yet, or enrich missing fields
  if (customerAccounts && Array.isArray(customerAccounts)) {
    customerAccounts.forEach(ca => {
      const key = ca.name.trim().toLowerCase();
      if (!customerMap[key]) {
        customerMap[key] = {
          name: ca.name,
          phone: ca.phone || 'N/A',
          email: ca.email || '',
          address: ca.detailed_address || `${ca.municipality || ''} ${ca.ward ? 'Ward ' + ca.ward : ''}`.trim() || 'N/A',
          totalPurchased: 0,
          totalPaid: 0,
          totalDue: 0,
          lastTxDate: ca.createdAt || 'N/A',
          invoices: [],
          accountId: ca.customer_id
        };
      } else {
        if (!customerMap[key].email && ca.email) {
          customerMap[key].email = ca.email;
        }
        if ((!customerMap[key].address || customerMap[key].address === 'N/A') && ca.detailed_address) {
          customerMap[key].address = ca.detailed_address;
        }
        if ((!customerMap[key].phone || customerMap[key].phone === 'N/A') && ca.phone) {
          customerMap[key].phone = ca.phone;
        }
        if (!customerMap[key].accountId) {
          customerMap[key].accountId = ca.customer_id;
        }
      }
    });
  }

  const customers = Object.values(customerMap).filter(c => {
    const searchTarget = (c.name + ' ' + c.phone + ' ' + c.email + ' ' + c.address).toLowerCase();
    const matchesSearch = searchTarget.includes(searchTerm.toLowerCase());
    
    if (dueFilter === 'WithDue') {
      return matchesSearch && c.totalDue > 0;
    } else if (dueFilter === 'PaidOnly') {
      return matchesSearch && c.totalDue === 0;
    }
    return matchesSearch;
  }).sort((a, b) => b.totalDue - a.totalDue); // Show highest due first

  // Open Edit Customer Modal
  const handleOpenEditModal = (cust: { name: string; phone: string; email?: string; address: string; invoices: SalesInvoice[]; accountId?: string }) => {
    setEditError('');
    setEditingCustomer({
      originalName: cust.name,
      originalPhone: cust.phone === 'N/A' ? '' : cust.phone,
      accountId: cust.accountId,
      name: cust.name,
      phone: cust.phone === 'N/A' ? '' : cust.phone,
      email: cust.email || '',
      address: cust.address === 'N/A' ? '' : cust.address,
      invoicesCount: cust.invoices.length
    });
  };

  // Save Customer Details (Name, Contact Number, Email Id, Address)
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');

    if (!editingCustomer) return;
    const newName = editingCustomer.name.trim();
    const newPhone = editingCustomer.phone.trim();
    const newEmail = editingCustomer.email.trim();
    const newAddress = editingCustomer.address.trim();

    if (!newName) {
      setEditError('Customer Name is required / ग्राहकको नाम अनिवार्य छ');
      return;
    }
    if (!newPhone) {
      setEditError('Contact Number is required / सम्पर्क फोन नम्बर अनिवार्य छ');
      return;
    }
    if (newEmail && !newEmail.includes('@')) {
      setEditError('Please enter a valid Email Id containing "@" / कृपया मान्य इमेल प्रविष्ट गर्नुहोस्');
      return;
    }

    const oldKey = editingCustomer.originalName.trim().toLowerCase();
    const newKey = newName.toLowerCase();

    // Confirm merge if renaming to another distinct customer who already exists
    if (oldKey !== newKey && customerMap[newKey]) {
      const confirmMerge = window.confirm(
        `A customer with the name "${newName}" already exists in the records.\nDo you want to combine these records under "${newName}"?`
      );
      if (!confirmMerge) return;
    }

    // 1. Update all matching SalesInvoices
    let updatedCount = 0;
    const updatedInvoices = invoices.map(inv => {
      if (inv.customerName.trim().toLowerCase() === oldKey) {
        updatedCount++;
        return {
          ...inv,
          customerName: newName,
          customerPhone: newPhone || inv.customerPhone,
          customerEmail: newEmail,
          customerAddress: newAddress || inv.customerAddress
        };
      }
      return inv;
    });

    onUpdateInvoices(updatedInvoices);

    // 2. Update matching CustomerAccount in customerAccounts if available
    if (onUpdateCustomerAccounts && customerAccounts) {
      const existingAccIndex = customerAccounts.findIndex(
        ca => ca.name.trim().toLowerCase() === oldKey || 
        (editingCustomer.originalPhone && ca.phone === editingCustomer.originalPhone) ||
        (editingCustomer.accountId && ca.customer_id === editingCustomer.accountId)
      );

      let updatedAccounts: CustomerAccount[];
      if (existingAccIndex >= 0) {
        updatedAccounts = customerAccounts.map((ca, idx) => {
          if (idx === existingAccIndex) {
            return {
              ...ca,
              name: newName,
              full_name: newName,
              phone: newPhone,
              phone_primary: newPhone,
              email: newEmail || ca.email,
              detailed_address: newAddress || ca.detailed_address
            };
          }
          return ca;
        });
      } else {
        const newAccount: CustomerAccount = {
          customer_id: editingCustomer.accountId || `CUST-${Date.now().toString().slice(-4)}`,
          name: newName,
          full_name: newName,
          phone: newPhone,
          phone_primary: newPhone,
          email: newEmail,
          detailed_address: newAddress,
          municipality: 'Suryodaya Municipality',
          ward: '4',
          is_institutional: false,
          createdAt: getCurrentBsDate(),
          status: 'Active'
        };
        updatedAccounts = [...customerAccounts, newAccount];
      }
      onUpdateCustomerAccounts(updatedAccounts);
    }

    // If drawer is currently showing this customer, update drawer name
    if (selectedCustomerName && selectedCustomerName.trim().toLowerCase() === oldKey) {
      setSelectedCustomerName(newName);
    }

    setEditSuccessMsg(`Customer "${newName}" details updated successfully! Synchronized across ${updatedCount} sales invoice(s) and client accounts.`);
    setTimeout(() => setEditSuccessMsg(''), 6000);
    setEditingCustomer(null);
  };

  // Handlers for Editing Paid Dues (Restricted strictly to reliableadmin)
  const handleOpenEditPaidDues = (targetCustomer: { name: string; invoices: SalesInvoice[]; totalPurchased?: number }) => {
    if (!isReliableAdmin) {
      alert("Access Denied: Only user 'reliableadmin' has authorization to edit customer paid dues. Other users cannot edit it.");
      return;
    }
    const invoiceRows: InvoiceDueEditRow[] = (targetCustomer.invoices || []).map(inv => {
      const netAmt = inv.finalAmount !== undefined ? inv.finalAmount : inv.totalAmount;
      const paid = inv.paidAmount !== undefined ? inv.paidAmount : (inv.status === 'Paid' ? netAmt : 0);
      const due = inv.dueAmount !== undefined ? inv.dueAmount : Math.max(0, netAmt - paid);
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.date,
        totalAmount: inv.totalAmount,
        finalAmount: netAmt,
        paidAmount: paid,
        dueAmount: due,
        status: inv.status
      };
    });

    setEditingPaidDues({
      customerName: targetCustomer.name,
      totalPurchased: targetCustomer.totalPurchased || invoiceRows.reduce((sum, r) => sum + r.finalAmount, 0),
      invoices: invoiceRows,
      reason: ''
    });
  };

  const handleUpdateDueRowPaid = (rowId: string, newPaidStr: string) => {
    if (!editingPaidDues) return;
    const newPaid = Math.max(0, parseFloat(newPaidStr) || 0);
    setEditingPaidDues({
      ...editingPaidDues,
      invoices: editingPaidDues.invoices.map(r => {
        if (r.id === rowId) {
          const due = Math.max(0, r.finalAmount - newPaid);
          const st: 'Paid' | 'Partially Paid' | 'Unpaid' = 
            newPaid >= r.finalAmount ? 'Paid' : newPaid > 0 ? 'Partially Paid' : 'Unpaid';
          return {
            ...r,
            paidAmount: newPaid,
            dueAmount: due,
            status: st
          };
        }
        return r;
      })
    });
  };

  const handleUpdateDueRowDue = (rowId: string, newDueStr: string) => {
    if (!editingPaidDues) return;
    const newDue = Math.max(0, parseFloat(newDueStr) || 0);
    setEditingPaidDues({
      ...editingPaidDues,
      invoices: editingPaidDues.invoices.map(r => {
        if (r.id === rowId) {
          const paid = Math.max(0, r.finalAmount - newDue);
          const st: 'Paid' | 'Partially Paid' | 'Unpaid' = 
            newDue === 0 ? 'Paid' : newDue < r.finalAmount ? 'Partially Paid' : 'Unpaid';
          return {
            ...r,
            paidAmount: paid,
            dueAmount: newDue,
            status: st
          };
        }
        return r;
      })
    });
  };

  const handleQuickSetAllPaid = () => {
    if (!editingPaidDues) return;
    setEditingPaidDues({
      ...editingPaidDues,
      invoices: editingPaidDues.invoices.map(r => ({
        ...r,
        paidAmount: r.finalAmount,
        dueAmount: 0,
        status: 'Paid'
      }))
    });
  };

  const handleQuickSetAllUnpaid = () => {
    if (!editingPaidDues) return;
    setEditingPaidDues({
      ...editingPaidDues,
      invoices: editingPaidDues.invoices.map(r => ({
        ...r,
        paidAmount: 0,
        dueAmount: r.finalAmount,
        status: 'Unpaid'
      }))
    });
  };

  const handleSavePaidDues = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReliableAdmin) {
      alert("Access Denied: Only user 'reliableadmin' has authorization to edit customer paid dues. Other users cannot edit it.");
      return;
    }
    if (!editingPaidDues) return;

    const rowMap = new Map<string, InvoiceDueEditRow>(editingPaidDues.invoices.map(r => [r.id, r]));
    const updatedInvoices = invoices.map(inv => {
      const editRow = rowMap.get(inv.id);
      if (editRow) {
        const auditNote = `[Paid Dues Edited by reliableadmin on ${getCurrentBsDate()}]: Paid: Rs. ${editRow.paidAmount}, Due: Rs. ${editRow.dueAmount}${editingPaidDues.reason ? ` (${editingPaidDues.reason})` : ''}`;
        return {
          ...inv,
          paidAmount: editRow.paidAmount,
          dueAmount: editRow.dueAmount,
          status: editRow.status,
          notes: inv.notes ? `${inv.notes}\n${auditNote}` : auditNote
        };
      }
      return inv;
    });

    onUpdateInvoices(updatedInvoices);
    setEditSuccessMsg(`Paid dues for customer "${editingPaidDues.customerName}" successfully updated and saved by reliableadmin.`);
    setTimeout(() => setEditSuccessMsg(''), 6000);
    setEditingPaidDues(null);
  };

  // Pay Off Due Amount logic
  const handlePayDueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = typeof payAmount === 'number' ? payAmount : (parseFloat(payAmount) || 0);
    if (!paymentCustomer || numAmount <= 0) return;

    // Daily closing check: when daily closing is done, no transactions can be performed
    const lockCheck = checkDateLock(payDate, dailyClosings, periodicClosings);
    if (lockCheck.locked) {
      alert(lockCheck.reason);
      return;
    }

    if (payMethod === 'Split') {
      const splitTotal = Number(paySplits.Cash || 0) + Number(paySplits.Esewa || 0) + Number(paySplits.RBB || 0) + Number(paySplits.Sahakari || 0);
      if (Math.abs(splitTotal - numAmount) > 0.01) {
        alert(`Split allocation total (Rs. ${splitTotal.toLocaleString()}) does not match the total payment amount (Rs. ${numAmount.toLocaleString()}). Please adjust the split breakdown values.`);
        return;
      }
    }

    const paymentMethodText = payMethod === 'Split'
      ? `Split [Cash: Rs. ${Number(paySplits.Cash || 0)}, eSewa: Rs. ${Number(paySplits.Esewa || 0)}, RBB: Rs. ${Number(paySplits.RBB || 0)}, Sahakari: Rs. ${Number(paySplits.Sahakari || 0)}]`
      : payMethod;

    // Permissions check for Staff
    if (currentUserRole === 'Staff') {
      if (onSendEditRequest) {
        onSendEditRequest({
          id: `req-${Date.now()}`,
          type: 'Payment Collection',
          details: `Collection of Rs. ${numAmount} via ${paymentMethodText} on ${payDate} for ${paymentCustomer.name}. Remarks: ${payRemarks}`,
          targetCustomerId: paymentCustomer.name,
          paymentDetails: {
            customerName: paymentCustomer.name,
            amount: numAmount,
            method: payMethod,
            splits: payMethod === 'Split' ? paySplits : undefined,
            remarks: payRemarks,
            date: payDate
          },
          date: payDate,
          status: 'Pending'
        });
        alert('Edit request has been submitted to Admin for approval. Staff cannot directly modify ledger records.');
        setPaymentCustomer(null);
        return;
      } else {
        alert('Staff does not have authorization to modify transaction ledger records.');
        return;
      }
    }

    let remainingPayment = numAmount;
    
    // Sort customer's invoices oldest to newest to clear oldest dues first
    const updatedInvoices = invoices.map(inv => {
      if (inv.customerName.trim().toLowerCase() === paymentCustomer.name.trim().toLowerCase() && inv.dueAmount > 0) {
        if (remainingPayment <= 0) return inv;

        const originalDue = inv.dueAmount;
        const paymentApplied = Math.min(remainingPayment, originalDue);
        remainingPayment -= paymentApplied;

        const newPaid = inv.paidAmount + paymentApplied;
        const newDue = originalDue - paymentApplied;
        
        // Auto status determination
        let newStatus: 'Paid' | 'Partially Paid' | 'Unpaid' = inv.status;
        if (newDue === 0) {
          newStatus = 'Paid';
        } else if (newPaid > 0) {
          newStatus = 'Partially Paid';
        }

        return {
          ...inv,
          paidAmount: newPaid,
          dueAmount: newDue,
          status: newStatus,
          remarks: inv.remarks ? `${inv.remarks} (Paid Rs. ${paymentApplied} via ${paymentMethodText} on ${payDate})` : `Paid Rs. ${paymentApplied} via ${paymentMethodText} on ${payDate}`
        };
      }
      return inv;
    });

    onUpdateInvoices(updatedInvoices);
    setPaymentCustomer(null);
  };

  const triggerPrintCustomerStatement = (targetCust: typeof statementCustomer) => {
    if (!targetCust) return;

    if (window.openUniversalPrintPreview) {
      const statementItems = (targetCust.invoices || []).map((inv, idx) => {
        const itemNames = (inv.items || []).map(it => {
          const s = services.find(srv => srv.id === it.serviceId);
          return `${s?.name || (it as any).customName || 'Item'} (x${it.quantity} @ Rs. ${it.unitPrice})`;
        }).join(', ');

        const paymentDetail = inv.paymentMethod === 'Split' && inv.paymentSplits
          ? `Paid: Rs. ${inv.paidAmount} via Split (Cash: ${inv.paymentSplits.cash || 0}, eSewa: ${inv.paymentSplits.esewa || 0}, RBB: ${inv.paymentSplits.rbb || 0}, Sahakari: ${inv.paymentSplits.sahakari || 0})`
          : `Paid: Rs. ${inv.paidAmount} via ${inv.paymentMethod}`;

        return {
          sn: idx + 1,
          name: `Invoice #${inv.invoiceNumber} (${inv.date}) - ${itemNames || 'Goods/Services'}`,
          description: `Gross: Rs. ${inv.totalAmount.toLocaleString()} | Disc: Rs. ${inv.discountAmount.toLocaleString()} | Net: Rs. ${inv.finalAmount.toLocaleString()} | ${paymentDetail} | Due: Rs. ${inv.dueAmount.toLocaleString()} [${inv.status}] ${inv.remarks ? `| Note: ${inv.remarks}` : ''}`,
          quantity: 1,
          unitPrice: inv.finalAmount || inv.totalAmount,
          totalPrice: inv.finalAmount || inv.totalAmount
        };
      });

      window.openUniversalPrintPreview({
        documentType: 'Statement',
        documentNumber: `STMT-${targetCust.accountId || targetCust.name.replace(/\s+/g, '-').slice(0, 10)}`,
        documentDate: getCurrentBsDate(),
        profile: profile,
        recipient: {
          name: targetCust.name,
          phone: targetCust.phone,
          email: targetCust.email,
          address: targetCust.address
        },
        title: `Customer Account Statement & Summary (${targetCust.name})`,
        items: statementItems,
        subtotal: targetCust.totalPurchased,
        grandTotal: targetCust.totalPurchased,
        notes: `Customer Total Net Invoiced: Rs. ${targetCust.totalPurchased.toLocaleString()} | Total Paid: Rs. ${targetCust.totalPaid.toLocaleString()} | Outstanding Due: Rs. ${targetCust.totalDue.toLocaleString()}.`,
        preparedBy: currentUser?.name || 'Accountant',
        approvedBy: profile?.name || 'ReliableTech Services'
      });
    } else {
      window.print();
    }
  };

  // Calculations for KPI blocks
  const totalReceivables = Object.values(customerMap).reduce((sum, c) => sum + c.totalDue, 0);
  const dueCustomersCount = Object.values(customerMap).filter(c => c.totalDue > 0).length;

  return (
    <div className="space-y-6 animate-fade-in" id="customers-data-tab">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-display">Client Ledger & Receivables</h2>
          <p className="text-xs text-slate-500">Record payments, track credit history, and manage customer due balances with full transaction trails.</p>
        </div>
      </div>

      {/* KPI Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Credit Outstanding</span>
          <p className="text-2xl font-bold font-display mt-1 text-rose-400">Rs. {totalReceivables.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-2">Aggregate of all accounts receivable</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Active Debtors</span>
          <p className="text-2xl font-bold font-display mt-1 text-amber-600">{dueCustomersCount} Customers</p>
          <p className="text-[10px] text-slate-500 mt-2">Clients with non-zero dues</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Registered Customers</span>
          <p className="text-2xl font-bold font-display mt-1 text-indigo-600">{Object.keys(customerMap).length} Profiles</p>
          <p className="text-[10px] text-slate-500 mt-2">Dynamic records in billing suite</p>
        </div>
      </div>

      {/* Feedback Banner */}
      {editSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span className="font-medium">{editSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setEditSuccessMsg('')} 
            className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <InteractiveSearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search customers by name, phone, email, address..."
            expandedWidth="w-full max-w-md"
          />
        </div>

        {/* Filter */}
        <div className="flex w-full md:w-auto gap-3">
          <select
            value={dueFilter}
            onChange={(e) => setDueFilter(e.target.value as any)}
            className="w-full md:w-56 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="All">All Customer Accounts</option>
            <option value="WithDue">Only Outstanding Dues (Due &gt; 0)</option>
            <option value="PaidOnly">Fully Cleared Accounts</option>
          </select>
        </div>
      </div>

      {/* Customer Ledger Table */}
      <div className="bg-white border border-slate-100 shadow-xs rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                <th className="px-5 py-4">Customer Name</th>
                <th className="px-5 py-4">Contact Number</th>
                <th className="px-5 py-4">Email Id</th>
                <th className="px-5 py-4">Address / Hub</th>
                <th className="px-5 py-4 text-right">Cumulative Purchases</th>
                <th className="px-5 py-4 text-right">Total Paid</th>
                <th className="px-5 py-4 text-right">Outstanding Dues</th>
                <th className="px-5 py-4 text-center">Last Transaction</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 font-sans">
              {customers.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(c => {
                return (
                  <tr key={c.name} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-tight">{c.name}</div>
                          {c.accountId && (
                            <span className="text-[10px] font-mono text-slate-400 font-normal">ID: {c.accountId}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-400 shrink-0" />
                        <span>{c.phone}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                      {c.email ? (
                        <div className="flex items-center gap-1.5 text-blue-600 font-mono text-[11px]">
                          <Mail size={12} className="text-blue-400 shrink-0" />
                          <span>{c.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 italic text-[11px]">Not provided</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="max-w-[160px] truncate" title={c.address}>{c.address}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold font-mono text-slate-800 whitespace-nowrap">
                      Rs. {c.totalPurchased.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold font-mono text-emerald-600 whitespace-nowrap">
                      Rs. {c.totalPaid.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right font-bold font-mono whitespace-nowrap">
                      <span className={c.totalDue > 0 ? 'text-rose-600 font-black' : 'text-slate-400 font-medium'}>
                        Rs. {c.totalDue.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center font-mono text-slate-500 whitespace-nowrap">
                      {c.lastTxDate}
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => handleOpenEditModal(c)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-[10px] font-bold text-indigo-700 transition flex items-center gap-1 cursor-pointer"
                          title="Edit Customer Details (Name, Contact Number, Email Id, Address)"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>

                        <button 
                          onClick={() => setStatementCustomer(c)}
                          className="px-2.5 py-1.5 rounded-lg border border-sky-200 hover:border-sky-300 bg-sky-50/70 hover:bg-sky-100 text-[10px] font-bold text-sky-800 transition flex items-center gap-1 cursor-pointer"
                          title="View Customer Summary Invoice & Print Statement"
                        >
                          <FileText size={12} className="text-sky-600" />
                          <span>Statement</span>
                        </button>

                        <button 
                          onClick={() => setSelectedCustomerName(c.name)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-[10px] font-bold text-slate-600 transition cursor-pointer"
                        >
                          Invoices ({c.invoices.length})
                        </button>
                        
                        {c.totalDue > 0 && (
                          <button 
                            onClick={() => {
                              setPaymentCustomer({ name: c.name, outstanding: c.totalDue });
                              setPayAmount(c.totalDue);
                              setPayDate(getCurrentBsDate());
                              setPayMethod('Cash');
                              setPayRemarks('');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition shadow-xs cursor-pointer"
                          >
                            Pay Dues
                          </button>
                        )}

                        {/* Edit Paid Dues Button - ReliableAdmin Only */}
                        <button
                          onClick={() => handleOpenEditPaidDues(c)}
                          title={isReliableAdmin ? "Edit Paid Dues & Invoices (@reliableadmin Authorized)" : "Edit Paid Dues (Restricted: reliableadmin only)"}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                            isReliableAdmin
                              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {isReliableAdmin ? <Edit3 size={11} /> : <Lock size={11} className="text-slate-400" />}
                          <span>Edit Paid Dues</span>
                        </button>

                        <button
                          onClick={() => {
                            const isSystemMaster = currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin' || currentUserRole === 'Super Admin';
                            if (!isSystemMaster) {
                              alert('Direct deletion is allowed for System Master (@reliableadmin) only.');
                              return;
                            }
                            if (confirm(`Are you sure you want to delete customer ${c.name} and all their associated invoice records?`)) {
                              const remainingInvoices = invoices.filter(inv => inv.customerName.toLowerCase() !== c.name.toLowerCase());
                              onUpdateInvoices(remainingInvoices);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title={currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin' ? "Delete Customer Profile & Invoices" : "Delete (System Master Only)"}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {customers.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <p className="text-2xl">👥</p>
                    <p className="text-xs font-medium mt-2">No customers found</p>
                    <p className="text-[10px] text-slate-400 mt-1">Accounts are generated automatically from invoices containing payment records.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {customers.length > 0 && (
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
                Showing {Math.min(customers.length, (currentPage - 1) * pageSize + 1)}-{Math.min(currentPage * pageSize, customers.length)} of {customers.length} entries
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
                  Page {currentPage} of {Math.ceil(customers.length / pageSize)}
                </span>
                <button
                  disabled={currentPage >= Math.ceil(customers.length / pageSize)}
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

      {/* EDIT CUSTOMER MODAL */}
      {editingCustomer && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-in">
            <div className="px-6 py-4.5 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                  <Edit2 size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">Edit Customer Details</h3>
                  <p className="text-[11px] text-indigo-200">ग्राहकको विवरण सम्पादन गर्नुहोस्</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingCustomer(null)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-600" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <User size={14} className="text-slate-400" />
                  <span>Customer Name <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">(ग्राहकको नाम)</span>
                </label>
                <input 
                  type="text"
                  required
                  value={editingCustomer.name}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  placeholder="e.g. Shyam Sundar Shrestha"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Phone size={14} className="text-slate-400" />
                  <span>Contact Number <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">(सम्पर्क फोन नम्बर)</span>
                </label>
                <input 
                  type="text"
                  required
                  value={editingCustomer.phone}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                  placeholder="e.g. 9842600000 / 027-520000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Mail size={14} className="text-slate-400" />
                  <span>Email Id</span>
                  <span className="text-[10px] text-slate-400 font-normal">(इमेल ठेगाना)</span>
                </label>
                <input 
                  type="email"
                  value={editingCustomer.email}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                  placeholder="e.g. customer@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" />
                  <span>Address / Hub Location</span>
                  <span className="text-[10px] text-slate-400 font-normal">(ठेगाना)</span>
                </label>
                <input 
                  type="text"
                  value={editingCustomer.address}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                  placeholder="e.g. Suryodaya-4, Fikkal, Ilam"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition"
                />
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 leading-relaxed">
                <p className="font-semibold flex items-center gap-1.5 text-indigo-950">
                  <CheckCircle2 size={13} className="text-indigo-600" />
                  System-Wide Synchronization
                </p>
                <p className="mt-0.5 text-indigo-800">
                  Saving will update {editingCustomer.invoicesCount} related invoice(s), ledger records, and customer profile details in the database.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button 
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Paid Dues Modal - Restricted to reliableadmin */}
      {editingPaidDues && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-200 w-full max-w-3xl max-h-[calc(100dvh-2rem)] my-auto overflow-hidden flex flex-col animate-scale-in">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                  <Shield size={22} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black font-display text-white text-base sm:text-lg">
                      Edit Customer Paid Dues
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-200 font-mono text-[10px] font-bold border border-amber-300/40">
                      @reliableadmin Only
                    </span>
                  </div>
                  <p className="text-xs text-amber-100 font-medium">
                    Direct ledger modification of paid balances and dues for: <strong className="text-white underline">{editingPaidDues.customerName}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setEditingPaidDues(null)}
                className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleSavePaidDues} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
              {/* Permission Banner */}
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3">
                <Shield size={18} className="text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950 leading-relaxed">
                  <strong>Restricted Administrative Feature:</strong> Only user <code className="bg-amber-150 px-1.5 py-0.5 rounded font-bold font-mono text-amber-900">reliableadmin</code> has permission to alter customer invoice paid and due amounts. Every change will be stamped with an audit trail and timestamped in the system.
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Total Invoiced</span>
                  <span className="text-base font-black font-mono text-slate-900">
                    Rs. {editingPaidDues.invoices.reduce((sum, r) => sum + r.finalAmount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <span className="text-[10px] font-mono text-emerald-700 uppercase block font-bold">Total Paid (Adjusted)</span>
                  <span className="text-base font-black font-mono text-emerald-800">
                    Rs. {editingPaidDues.invoices.reduce((sum, r) => sum + r.paidAmount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                  <span className="text-[10px] font-mono text-rose-700 uppercase block font-bold">Outstanding Due (Remaining)</span>
                  <span className="text-base font-black font-mono text-rose-800">
                    Rs. {editingPaidDues.invoices.reduce((sum, r) => sum + r.dueAmount, 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100/70 p-2.5 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Edit3 size={14} className="text-amber-600" />
                  <span>Invoice-by-Invoice Paid Dues Adjustment:</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleQuickSetAllPaid}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition shadow-2xs cursor-pointer"
                  >
                    ✓ Mark All Invoices Fully Paid
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickSetAllUnpaid}
                    className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                  >
                    ↺ Reset All to Unpaid
                  </button>
                </div>
              </div>

              {/* Invoices List Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 font-bold text-slate-700 text-[11px] z-10">
                      <tr>
                        <th className="py-2.5 px-3">Invoice # &amp; Date</th>
                        <th className="py-2.5 px-3 text-right">Net Bill (Rs.)</th>
                        <th className="py-2.5 px-3 w-36">Paid Amount (Rs.)</th>
                        <th className="py-2.5 px-3 w-36">Due Amount (Rs.)</th>
                        <th className="py-2.5 px-3 text-center w-24">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editingPaidDues.invoices.map((row, idx) => (
                        <tr key={row.id || idx} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3">
                            <div className="font-mono font-bold text-slate-900">{row.invoiceNumber}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{row.date} BS</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                            {row.finalAmount.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min="0"
                              max={row.finalAmount}
                              step="any"
                              value={row.paidAmount}
                              onChange={(e) => handleUpdateDueRowPaid(row.id, e.target.value)}
                              className="w-full font-mono font-bold text-emerald-800 bg-emerald-50/60 border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min="0"
                              max={row.finalAmount}
                              step="any"
                              value={row.dueAmount}
                              onChange={(e) => handleUpdateDueRowDue(row.id, e.target.value)}
                              className="w-full font-mono font-bold text-rose-800 bg-rose-50/60 border border-rose-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : row.status === 'Partially Paid'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Reason Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Audit Remarks / Reason for Dues Modification <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ledger reconciliation, corrected previous cash payment entry..."
                  value={editingPaidDues.reason}
                  onChange={(e) => setEditingPaidDues({ ...editingPaidDues, reason: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPaidDues(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isReliableAdmin}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={14} />
                  <span>Save Paid Dues (ReliableAdmin)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Due Payment Modal */}
      {paymentCustomer && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md max-h-[calc(100dvh-2rem)] my-auto overflow-hidden flex flex-col animate-scale-in">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold font-display text-slate-800 text-base">Receive Due Payment</h3>
                <p className="text-[10px] text-slate-500">Apply a recovery payment against unpaid invoices of {paymentCustomer.name}.</p>
              </div>
              <button 
                onClick={() => setPaymentCustomer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePayDueSubmit} className="p-6 space-y-4">
              <div className="bg-rose-50 p-4 rounded-xl border border-rose-100/50 flex justify-between items-center">
                <span className="text-xs font-semibold text-rose-800">Cumulative Dues Owned:</span>
                <span className="font-mono font-black text-rose-700 text-base">Rs. {paymentCustomer.outstanding.toLocaleString()}</span>
              </div>

              {currentUserRole === 'Staff' && (
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-[10px] text-amber-800 leading-relaxed font-semibold">
                  ⚠️ Note: As a Staff user, submitting this payment will send a &quot;Payment approval request&quot; to the Admin. It will not immediately clear the dues until approved.
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Payment Amount (Rs.) *</label>
                <input 
                  type="number"
                  step="any"
                  min="0.01"
                  max={paymentCustomer.outstanding}
                  required
                  value={payAmount !== undefined ? payAmount : ''}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono font-bold text-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Payment Date (BS) *</label>
                <NepaliDatePicker 
                  value={payDate}
                  onChange={(d) => setPayDate(d)}
                  placeholder="YYYY-MM-DD"
                  required
                  id="pay-due-bs-date-input"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Payment Mode *</label>
                <select 
                  value={payMethod}
                  onChange={(e) => {
                    const mode = e.target.value as any;
                    setPayMethod(mode);
                    if (mode === 'Split') {
                      const num = typeof payAmount === 'number' ? payAmount : (parseFloat(payAmount) || 0);
                      setPaySplits({
                        Cash: num,
                        Esewa: 0,
                        RBB: 0,
                        Sahakari: 0
                      });
                    }
                  }}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="Cash">Cash (नगद)</option>
                  <option value="Esewa">Esewa (इ-सेवा)</option>
                  <option value="Sahakari">Sahakari (सहकारी)</option>
                  <option value="RBB">RBB (राष्ट्रिय वाणिज्य बैंक)</option>
                  <option value="Split">Split Payment (बहु-खाता भुक्तानी)</option>
                </select>
              </div>

              {payMethod === 'Split' && (
                <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-900">Split Payment Allocation:</span>
                    <span className="font-mono text-[11px] text-slate-600">
                      Total Due Paid: Rs. {Number(payAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Cash (नगद)</label>
                      <input 
                        type="number"
                        step="any"
                        min="0"
                        value={paySplits.Cash || ''}
                        onChange={(e) => setPaySplits(prev => ({ ...prev, Cash: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">eSewa (इ-सेवा)</label>
                      <input 
                        type="number"
                        step="any"
                        min="0"
                        value={paySplits.Esewa || ''}
                        onChange={(e) => setPaySplits(prev => ({ ...prev, Esewa: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">RBB Bank</label>
                      <input 
                        type="number"
                        step="any"
                        min="0"
                        value={paySplits.RBB || ''}
                        onChange={(e) => setPaySplits(prev => ({ ...prev, RBB: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Sahakari</label>
                      <input 
                        type="number"
                        step="any"
                        min="0"
                        value={paySplits.Sahakari || ''}
                        onChange={(e) => setPaySplits(prev => ({ ...prev, Sahakari: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {(() => {
                    const splitSum = Number(paySplits.Cash || 0) + Number(paySplits.Esewa || 0) + Number(paySplits.RBB || 0) + Number(paySplits.Sahakari || 0);
                    const target = Number(payAmount || 0);
                    const diff = target - splitSum;
                    const isValid = Math.abs(diff) < 0.01;

                    return (
                      <div className={`p-2 rounded-lg text-xs font-mono flex items-center justify-between ${
                        isValid ? 'bg-emerald-100/70 text-emerald-800' : 'bg-rose-100/70 text-rose-800'
                      }`}>
                        <span>Allocated: Rs. {splitSum.toLocaleString()}</span>
                        <span>{isValid ? 'Balanced ✓' : `Difference: Rs. ${diff > 0 ? '+' : ''}${diff.toLocaleString()}`}</span>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Remarks / Reference</label>
                <input 
                  type="text"
                  placeholder="e.g. Receipt no, collected at tea factory"
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setPaymentCustomer(null)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
                >
                  {currentUserRole === 'Staff' ? 'Submit Edit Request' : 'Confirm Recoupment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction History / Invoice Drawer Modal */}
      {selectedCustomerName && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[calc(100dvh-2rem)] my-auto overflow-hidden animate-scale-in flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold font-display text-slate-800 text-base">Ledger Activity: {selectedCustomerName}</h3>
                  {customerMap[selectedCustomerName.trim().toLowerCase()] && (
                    <>
                      <button
                        onClick={() => handleOpenEditModal(customerMap[selectedCustomerName.trim().toLowerCase()])}
                        className="px-2 py-0.5 rounded-md border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-[10px] font-bold text-indigo-700 transition flex items-center gap-1 cursor-pointer"
                        title="Edit Customer Details"
                      >
                        <Edit2 size={11} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          const c = customerMap[selectedCustomerName.trim().toLowerCase()];
                          if (c) setStatementCustomer(c);
                        }}
                        className="px-2 py-0.5 rounded-md border border-sky-200 bg-sky-50 hover:bg-sky-100 text-[10px] font-bold text-sky-700 transition flex items-center gap-1 cursor-pointer"
                        title="View & Print Customer Statement"
                      >
                        <FileText size={11} />
                        <span>Print Statement</span>
                      </button>
                      <button
                        onClick={() => {
                          const c = customerMap[selectedCustomerName.trim().toLowerCase()];
                          if (c) handleOpenEditPaidDues(c);
                        }}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                          isReliableAdmin
                            ? 'border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800'
                            : 'border border-slate-200 bg-slate-100 text-slate-500'
                        }`}
                        title={isReliableAdmin ? "Edit Customer Paid Dues (@reliableadmin Authorized)" : "Edit Customer Paid Dues (Restricted to reliableadmin)"}
                      >
                        {isReliableAdmin ? <Edit3 size={11} className="text-amber-600" /> : <Lock size={11} className="text-slate-400" />}
                        <span>Edit Paid Dues</span>
                      </button>
                    </>
                  )}
                </div>
                {customerMap[selectedCustomerName.trim().toLowerCase()] && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone size={11} className="text-slate-400" />
                      {customerMap[selectedCustomerName.trim().toLowerCase()].phone}
                    </span>
                    {customerMap[selectedCustomerName.trim().toLowerCase()].email && (
                      <span className="flex items-center gap-1 font-mono text-blue-600">
                        <Mail size={11} className="text-blue-400" />
                        {customerMap[selectedCustomerName.trim().toLowerCase()].email}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-slate-400" />
                      {customerMap[selectedCustomerName.trim().toLowerCase()].address}
                    </span>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setSelectedCustomerName(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {invoices
                .filter(inv => inv.customerName.trim().toLowerCase() === selectedCustomerName.trim().toLowerCase())
                .sort((a, b) => b.date.localeCompare(a.date))
                .map(inv => {
                  return (
                    <div key={inv.id} className="border border-slate-100 rounded-xl p-4 space-y-3 shadow-xs bg-slate-50/30">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-600">{inv.invoiceNumber}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({inv.date})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-500 text-[9px] font-mono uppercase">
                            {inv.paymentMethod}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' :
                            inv.status === 'Partially Paid' ? 'bg-amber-50 text-amber-700' :
                            'bg-rose-50 text-rose-700'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                      </div>

                      {/* Item list */}
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Items Purchased</p>
                        <div className="space-y-1">
                          {(inv.items || []).map((item, idx) => {
                            const s = services.find(srv => srv.id === item.serviceId);
                            return (
                              <div key={idx} className="flex justify-between text-xs">
                                <span className="text-slate-700 font-medium">{s?.name || 'Technical Support Service'} (x{item.quantity})</span>
                                <span className="font-mono text-slate-500">Rs. {(item.quantity * item.unitPrice).toLocaleString()}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-500">
                        <div>
                          <span>Discount: </span>
                          <span className="font-bold text-slate-700">Rs. {inv.discountAmount.toLocaleString()}</span>
                        </div>
                        <div className="text-center">
                          <span>Paid: </span>
                          <span className="font-bold text-emerald-600">Rs. {inv.paidAmount.toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <span>Due: </span>
                          <span className={`font-bold ${inv.dueAmount > 0 ? 'text-rose-600 font-black' : 'text-slate-700'}`}>
                            Rs. {inv.dueAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {inv.remarks && (
                        <p className="text-[10px] text-slate-400 leading-relaxed italic bg-white p-2 rounded-lg border border-slate-100">
                          Note: {inv.remarks}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedCustomerName(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Statement & Summary Invoice Modal */}
      {statementCustomer && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static print:inset-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[calc(100dvh-2rem)] my-auto overflow-hidden animate-scale-in flex flex-col print:shadow-none print:border-none print:max-w-none print:max-h-none print:rounded-none">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold font-display text-base text-white">Customer Statement & Summary Invoice</h3>
                  <p className="text-xs text-slate-400">Official statement for {statementCustomer.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleOpenEditPaidDues(statementCustomer)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isReliableAdmin
                      ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-300 border border-slate-700'
                  }`}
                  title={isReliableAdmin ? "Edit Paid Dues for Customer (@reliableadmin Authorized)" : "Edit Paid Dues (Restricted to reliableadmin)"}
                >
                  {isReliableAdmin ? <Edit3 size={13} /> : <Lock size={13} />}
                  <span>Edit Paid Dues</span>
                </button>
                <button 
                  onClick={() => triggerPrintCustomerStatement(statementCustomer)}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Open Universal Letterpad Print Preview with PDF Export"
                >
                  <Printer size={14} />
                  <span>Universal Print / PDF</span>
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  title="Direct A4 Print"
                >
                  <Printer size={14} />
                  <span>Print A4</span>
                </button>
                <button 
                  onClick={() => setStatementCustomer(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Statement Content */}
            <div id="customer-statement-printable" className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 bg-white print:p-0 print:overflow-visible">
              {/* Corporate Letterhead */}
              <div className="border-b-2 border-slate-800 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight uppercase">
                      {profile?.name || 'RELIABLETECH SERVICES & SUPPLIERS'}
                    </h1>
                    <p className="text-xs font-medium text-slate-600">
                      {profile?.companySubtitle || 'Complete IT, Networking, Hardware & Security Solutions'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {profile?.location || 'Damak, Jhapa, Koshi Province, Nepal'} {profile?.phone ? `• Tel: ${profile.phone}` : ''}
                    </p>
                    {profile?.panNumber && (
                      <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">
                        VAT / PAN No: {profile.panNumber}
                      </p>
                    )}
                  </div>
                  <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-100 text-slate-800 font-black text-xs uppercase tracking-wider font-mono border border-slate-300">
                      ACCOUNT STATEMENT (हिसाब विवरण)
                    </span>
                    <p className="text-xs font-mono text-slate-600 mt-2">
                      Statement Date: <strong className="text-slate-900">{getCurrentBsDate()} BS</strong>
                    </p>
                    <p className="text-[11px] font-mono text-slate-400">
                      Statement ID: STMT-{(statementCustomer.accountId || statementCustomer.name.replace(/\s+/g, '-')).slice(0, 12)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Profile Grid */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2.5 font-mono">
                  CUSTOMER DETAILS (ग्राहकको विवरण)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Customer Name:</span>
                    <span className="font-bold text-slate-900 text-sm">{statementCustomer.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact Number:</span>
                    <span className="font-semibold text-slate-800 font-mono">{statementCustomer.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email Address:</span>
                    <span className="font-semibold text-slate-800 font-mono">{statementCustomer.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Address:</span>
                    <span className="font-semibold text-slate-800">{statementCustomer.address || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Financial KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">Total Invoiced</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-slate-900">
                    Rs. {(statementCustomer.invoices || []).reduce((acc, i) => acc + (i.totalAmount || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">Total Discount</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-amber-700">
                    Rs. {(statementCustomer.invoices || []).reduce((acc, i) => acc + (i.discountAmount || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">Net Billed</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-indigo-700">
                    Rs. {statementCustomer.totalPurchased.toLocaleString()}
                  </span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <span className="text-[10px] font-mono uppercase text-emerald-700 block">Total Paid</span>
                  <span className="text-sm sm:text-base font-black font-mono text-emerald-800">
                    Rs. {statementCustomer.totalPaid.toLocaleString()}
                  </span>
                </div>
                <div className={`rounded-xl p-3 border ${
                  statementCustomer.totalDue > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-[10px] font-mono uppercase block ${
                    statementCustomer.totalDue > 0 ? 'text-rose-700' : 'text-slate-500'
                  }`}>
                    Outstanding Due
                  </span>
                  <span className={`text-sm sm:text-base font-black font-mono ${
                    statementCustomer.totalDue > 0 ? 'text-rose-700' : 'text-slate-800'
                  }`}>
                    Rs. {statementCustomer.totalDue.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Complete Items & Purchases Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 font-mono">
                    PURCHASE &amp; TRANSACTION LEDGER BREAKDOWN (खरिद तथा हिसाब किताब तालिका)
                  </h4>
                  <span className="text-xs font-mono text-slate-500">
                    Total Invoices: {statementCustomer.invoices.length}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                        <th className="py-2.5 px-3 font-mono text-center w-10">S.N.</th>
                        <th className="py-2.5 px-3 font-mono">Date (BS)</th>
                        <th className="py-2.5 px-3 font-mono">Invoice #</th>
                        <th className="py-2.5 px-3">Items Purchased Details</th>
                        <th className="py-2.5 px-3 text-right font-mono">Gross (Rs.)</th>
                        <th className="py-2.5 px-3 text-right font-mono">Disc (Rs.)</th>
                        <th className="py-2.5 px-3 text-right font-mono">Net (Rs.)</th>
                        <th className="py-2.5 px-3 font-mono">Paid &amp; Mode</th>
                        <th className="py-2.5 px-3 text-right font-mono">Due (Rs.)</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {statementCustomer.invoices
                        .slice()
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((inv, idx) => {
                          const paymentModeDisplay = inv.paymentMethod === 'Split' && inv.paymentSplits
                            ? `Split (Cash: ${inv.paymentSplits.cash || 0}, eSewa: ${inv.paymentSplits.esewa || 0}, RBB: ${inv.paymentSplits.rbb || 0}, Sahakari: ${inv.paymentSplits.sahakari || 0})`
                            : inv.paymentMethod;

                          return (
                            <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                              <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                              <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">{inv.date}</td>
                              <td className="py-3 px-3 font-mono font-bold text-indigo-600 whitespace-nowrap">{inv.invoiceNumber}</td>
                              <td className="py-3 px-3">
                                <div className="space-y-1 max-w-xs sm:max-w-md">
                                  {(inv.items || []).map((it, iIdx) => {
                                    const s = services.find(srv => srv.id === it.serviceId);
                                    return (
                                      <div key={iIdx} className="flex justify-between gap-2 text-[11px] text-slate-700">
                                        <span className="font-medium truncate">{s?.name || (it as any).customName || 'Product / Service'}</span>
                                        <span className="font-mono text-slate-500 shrink-0">
                                          {it.quantity} × Rs. {it.unitPrice.toLocaleString()} = Rs. {(it.quantity * it.unitPrice).toLocaleString()}
                                        </span>
                                      </div>
                                    );
                                  })}
                                  {inv.remarks && (
                                    <div className="text-[10px] text-slate-500 italic mt-0.5 bg-slate-50 p-1 rounded-sm border border-slate-100">
                                      Notes: {inv.remarks}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                                {inv.totalAmount.toLocaleString()}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-amber-700 whitespace-nowrap">
                                {inv.discountAmount > 0 ? inv.discountAmount.toLocaleString() : '-'}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                {inv.finalAmount.toLocaleString()}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <div className="font-mono font-bold text-emerald-700">
                                  Rs. {inv.paidAmount.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-slate-500 font-sans truncate max-w-[140px]" title={paymentModeDisplay}>
                                  via {paymentModeDisplay}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                                <span className={inv.dueAmount > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                                  {inv.dueAmount > 0 ? `Rs. ${inv.dueAmount.toLocaleString()}` : '0.00'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  inv.status === 'Partially Paid' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                  'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {inv.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-[11px] text-slate-900">
                        <td colSpan={4} className="py-3 px-3 text-right uppercase font-mono tracking-wider">
                          Statement Total (कुल जम्मा):
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          Rs. {(statementCustomer.invoices || []).reduce((acc, i) => acc + (i.totalAmount || 0), 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-amber-800">
                          Rs. {(statementCustomer.invoices || []).reduce((acc, i) => acc + (i.discountAmount || 0), 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-indigo-900">
                          Rs. {statementCustomer.totalPurchased.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-left font-mono text-emerald-800">
                          Rs. {statementCustomer.totalPaid.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-rose-700">
                          Rs. {statementCustomer.totalDue.toLocaleString()}
                        </td>
                        <td className="py-3 px-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Signatures & Terms Footer */}
              <div className="pt-6 border-t border-slate-200 mt-8 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 w-44 mx-auto mb-1.5 h-10"></div>
                  <p className="font-bold text-slate-800">Customer's Signature</p>
                  <p className="text-[10px] text-slate-400">Received &amp; Acknowledged</p>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-44 mx-auto mb-1.5 h-10"></div>
                  <p className="font-bold text-slate-800">Authorized Signature</p>
                  <p className="text-[10px] text-slate-400">{profile?.name || 'ReliableTech Services & Suppliers'}</p>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
              <div className="text-xs text-slate-500">
                Customer statement accurately generated from transaction ledgers.
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => triggerPrintCustomerStatement(statementCustomer)}
                  className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Universal Print / PDF</span>
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Direct A4 Print</span>
                </button>
                <button 
                  onClick={() => setStatementCustomer(null)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
