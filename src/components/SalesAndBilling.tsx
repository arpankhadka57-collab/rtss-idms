import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  Calendar, 
  Tag, 
  DollarSign, 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  Printer, 
  Percent,
  CheckCircle2,
  AlertCircle,
  Hash,
  ShoppingBag,
  Send,
  ChevronLeft,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { SalesInvoice, BusinessService, BusinessProfile, InvoiceItem, InventoryItem, PeriodicClosing, AppUser } from '../types';
import { getCurrentBsDate, generateInvoiceNumber, numberToWords, isDateWithinRange, normalizeStandardBsDate } from '../utils/nepaliDate';
import { CorporateLetterhead } from './CorporateLetterhead';
import { InteractiveSearchBar } from './InteractiveSearchBar';
import { NepaliDatePicker } from './NepaliDatePicker';

interface SalesAndBillingProps {
  invoices: SalesInvoice[];
  services: BusinessService[];
  profile: BusinessProfile;
  onAddInvoice: (inv: Omit<SalesInvoice, 'id'>) => void;
  onEditInvoice: (inv: SalesInvoice) => void;
  onDeleteInvoice: (id: string) => void;
  currentUserRole: string;
  currentUser?: AppUser;
  onSendEditRequest?: (request: any) => void;
  prepopulatedInvoiceData?: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    items: { itemName: string; price: number }[];
    serviceRequestId: string;
  } | null;
  onClearPrepopulatedInvoiceData?: () => void;
  isDateLocked?: (date: string) => boolean;
  inventoryStock?: InventoryItem[];
  periodicClosings?: PeriodicClosing[];
}

export const SalesAndBilling: React.FC<SalesAndBillingProps> = ({
  invoices,
  services,
  profile,
  onAddInvoice,
  onEditInvoice,
  onDeleteInvoice,
  currentUserRole,
  currentUser,
  onSendEditRequest,
  prepopulatedInvoiceData,
  onClearPrepopulatedInvoiceData,
  isDateLocked,
  inventoryStock = [],
  periodicClosings = []
}) => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [filterInvoiceNo, setFilterInvoiceNo] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Helper to resolve any service or inventory stock item
  const getItemDetails = (id: string) => {
    if (id === 'misc') return null;
    const s = services.find(srv => srv.id === id);
    if (s) return { name: s.name, price: s.priceRate, type: 'Service', rateType: s.rateType, category: s.category };
    const inv = inventoryStock?.find(i => i.id === id);
    if (inv) return { name: inv.name, price: inv.sellingPrice, type: 'Product', rateType: inv.unitType || 'pcs', category: 'Inventory' };
    return null;
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInv, setEditingInv] = useState<SalesInvoice | null>(null);

  // Invoice view details modal state (Print/Receipt modal)
  const [activeReceipt, setActiveReceipt] = useState<SalesInvoice | null>(null);

  // Form fields state
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  
  // Multi-item lines state
  const [formItems, setFormItems] = useState<InvoiceItem[]>([
    { serviceId: '', quantity: 1, unitPrice: 0 }
  ]);
  
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [status, setStatus] = useState<'Paid' | 'Unpaid' | 'Partially Paid'>('Paid');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Esewa' | 'Sahakari' | 'RBB' | 'Due' | 'Split'>('Cash');
  
  // Split payment state variables
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitEsewa, setSplitEsewa] = useState<number>(0);
  const [splitRbb, setSplitRbb] = useState<number>(0);
  const [splitSahakari, setSplitSahakari] = useState<number>(0);
  const [splitDue, setSplitDue] = useState<number>(0);

  const [remarks, setRemarks] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);


  // Active dropdown index for line item search suggestions
  const [activeItemDropdownIdx, setActiveItemDropdownIdx] = useState<number | null>(null);
  // Custom queries per line item
  const [itemQueries, setItemQueries] = useState<Record<number, string>>({});

  // Extract unique customers from invoices
  const uniqueCustomers = React.useMemo(() => {
    const custMap: Record<string, { name: string; phone: string; address: string; totalDue: number }> = {};
    invoices.forEach(inv => {
      const nameKey = inv.customerName.trim();
      if (!nameKey) return;
      
      if (!custMap[nameKey]) {
        custMap[nameKey] = {
          name: inv.customerName,
          phone: inv.customerPhone || '',
          address: inv.customerAddress || '',
          totalDue: 0
        };
      }
      if (inv.customerPhone && !custMap[nameKey].phone) {
        custMap[nameKey].phone = inv.customerPhone;
      }
      if (inv.customerAddress && !custMap[nameKey].address) {
        custMap[nameKey].address = inv.customerAddress;
      }
      custMap[nameKey].totalDue += (inv.dueAmount || 0);
    });
    return Object.values(custMap);
  }, [invoices]);

  const matchedCustomer = React.useMemo(() => {
    return uniqueCustomers.find(c => c.name.trim().toLowerCase() === customerName.trim().toLowerCase());
  }, [uniqueCustomers, customerName]);

  const filteredCustomers = React.useMemo(() => {
    if (!customerName.trim()) return uniqueCustomers;
    return uniqueCustomers.filter(c => 
      c.name.toLowerCase().includes(customerName.toLowerCase())
    );
  }, [uniqueCustomers, customerName]);

  // Auto-populate from Service Request when initiated
  useEffect(() => {
    if (prepopulatedInvoiceData) {
      setEditingInv(null);
      const todayBs = getCurrentBsDate();
      setInvoiceNumber(generateInvoiceNumber(todayBs, invoices, periodicClosings));
      setDate(todayBs);
      setCustomerName(prepopulatedInvoiceData.customerName);
      setCustomerPhone(prepopulatedInvoiceData.customerPhone);
      setCustomerAddress(prepopulatedInvoiceData.customerAddress);
      
      // Load prepopulated items
      const mappedItems = prepopulatedInvoiceData.items.map(it => {
        const matchingSrv = services.find(s => s.name.toLowerCase() === it.itemName.toLowerCase()) || 
                            inventoryStock.find(i => i.name.toLowerCase() === it.itemName.toLowerCase());
        return {
          serviceId: matchingSrv ? matchingSrv.id : '',
          quantity: 1,
          unitPrice: it.price
        };
      });

      setFormItems(mappedItems.length > 0 ? mappedItems : [{ serviceId: '', quantity: 1, unitPrice: 0 }]);
      setDiscountAmount(0);
      
      const totalCost = prepopulatedInvoiceData.items.reduce((sum, item) => sum + item.price, 0);
      setPaidAmount(totalCost);
      setStatus('Paid');
      setPaymentMethod('Cash');
      setRemarks(`Service Bill for request #${prepopulatedInvoiceData.serviceRequestId}`);
      
      setIsFormOpen(true);
      
      if (onClearPrepopulatedInvoiceData) {
        onClearPrepopulatedInvoiceData();
      }
    }
  }, [prepopulatedInvoiceData, services, invoices, onClearPrepopulatedInvoiceData]);

  // Computations of totals
  const subtotal = formItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const finalAmount = Math.max(0, subtotal - discountAmount);
  const dueAmount = Math.max(0, finalAmount - paidAmount);

  // Synchronize paid amount, due, and status when split payment details change
  useEffect(() => {
    if (paymentMethod === 'Split') {
      const computedPaid = splitCash + splitEsewa + splitRbb + splitSahakari;
      setPaidAmount(computedPaid);
      const computedDue = Math.max(0, finalAmount - computedPaid);
      setSplitDue(computedDue);
      
      if (computedDue === 0 && finalAmount > 0) {
        setStatus('Paid');
      } else if (computedPaid === 0 && finalAmount > 0) {
        setStatus('Unpaid');
      } else if (computedPaid > 0 && computedDue > 0) {
        setStatus('Partially Paid');
      }
    }
  }, [paymentMethod, splitCash, splitEsewa, splitRbb, splitSahakari, finalAmount]);

  const openAddForm = () => {
    const todayBs = getCurrentBsDate();
    if (isDateLocked && isDateLocked(todayBs)) {
      alert(`⚠️ Today's transactions are locked (Daily Closing completed). New invoice entries are not allowed unless unlocked by an Admin.`);
      return;
    }
    setEditingInv(null);
    setInvoiceNumber(generateInvoiceNumber(todayBs, invoices, periodicClosings));
    setDate(todayBs);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    
    setFormItems([
      { 
        serviceId: '', 
        quantity: 1, 
        unitPrice: 0 
      }
    ]);
    setDiscountAmount(0);
    setPaidAmount(0);
    setStatus('Unpaid');
    setPaymentMethod('Cash');
    
    // Reset splits
    setSplitCash(0);
    setSplitEsewa(0);
    setSplitRbb(0);
    setSplitSahakari(0);
    setSplitDue(0);

    setRemarks('');
    
    setIsFormOpen(true);
  };

  const openEditForm = (inv: SalesInvoice) => {
    if (isDateLocked && isDateLocked(inv.date)) {
      alert(`⚠️ Transactions for the date ${inv.date} are locked (Daily Closing completed). Direct edits are blocked.`);
      return;
    }
    setEditingInv(inv);
    setInvoiceNumber(inv.invoiceNumber);
    setDate(inv.date);
    setCustomerName(inv.customerName);
    setCustomerPhone(inv.customerPhone);
    setCustomerAddress(inv.customerAddress);
    
    // Load existing items or build fallback for older single-item invoices
    if (inv.items && inv.items.length > 0) {
      setFormItems(inv.items);
    } else {
      // Backward compatibility fallback (using old properties if they exist)
      const oldSrvId = (inv as any).serviceId || services[0]?.id || '';
      const oldQty = (inv as any).quantity || 1;
      const oldPrice = (inv as any).unitPrice || 0;
      setFormItems([
        { serviceId: oldSrvId, quantity: oldQty, unitPrice: oldPrice }
      ]);
    }
    
    setDiscountAmount(inv.discountAmount);
    setPaidAmount(inv.paidAmount);
    setStatus(inv.status);
    setPaymentMethod(inv.paymentMethod);
    setRemarks(inv.remarks);

    // Populate split payment details
    if (inv.paymentSplits) {
      setSplitCash(inv.paymentSplits.cash || 0);
      setSplitEsewa(inv.paymentSplits.esewa || 0);
      setSplitRbb(inv.paymentSplits.rbb || 0);
      setSplitSahakari(inv.paymentSplits.sahakari || 0);
      setSplitDue(inv.paymentSplits.due || 0);
    } else {
      setSplitCash(inv.paymentMethod === 'Cash' ? inv.paidAmount : 0);
      setSplitEsewa(inv.paymentMethod === 'Esewa' ? inv.paidAmount : 0);
      setSplitRbb(inv.paymentMethod === 'RBB' ? inv.paidAmount : 0);
      setSplitSahakari(inv.paymentMethod === 'Sahakari' ? inv.paidAmount : 0);
      setSplitDue(inv.paymentMethod === 'Due' ? inv.dueAmount : (inv.status === 'Partially Paid' || inv.status === 'Unpaid' ? inv.dueAmount : 0));
    }

    setIsFormOpen(true);
  };

  // Handle service drop-down selection inside form item
  const handleItemServiceChange = (index: number, srvId: string) => {
    const updated = [...formItems];
    if (srvId === 'misc') {
      updated[index] = {
        ...updated[index],
        serviceId: srvId,
        unitPrice: 0,
        customName: ''
      };
    } else {
      const chosenService = services.find(s => s.id === srvId);
      const chosenInventory = !chosenService ? inventoryStock.find(i => i.id === srvId) : null;
      updated[index] = {
        ...updated[index],
        serviceId: srvId,
        unitPrice: chosenService ? chosenService.priceRate : (chosenInventory ? chosenInventory.sellingPrice : 0),
        customName: undefined
      };
    }
    setFormItems(updated);
    recalculatePaidDue(updated, discountAmount, paidAmount);
  };

  const handleItemCustomNameChange = (index: number, name: string) => {
    const updated = [...formItems];
    updated[index] = {
      ...updated[index],
      customName: name
    };
    setFormItems(updated);
  };

  const handleItemQuantityChange = (index: number, qty: number) => {
    const updated = [...formItems];
    updated[index] = {
      ...updated[index],
      quantity: Math.max(1, qty)
    };
    setFormItems(updated);
    recalculatePaidDue(updated, discountAmount, paidAmount);
  };

  const handleItemPriceChange = (index: number, rate: number) => {
    const updated = [...formItems];
    updated[index] = {
      ...updated[index],
      unitPrice: Math.max(0, rate)
    };
    setFormItems(updated);
    recalculatePaidDue(updated, discountAmount, paidAmount);
  };

  // Automatically adjust status and paid amount if payment method is "Due" or "Split"
  const handlePaymentMethodChange = (method: 'Cash' | 'Esewa' | 'Sahakari' | 'RBB' | 'Due' | 'Split') => {
    setPaymentMethod(method);
    if (method === 'Due') {
      setPaidAmount(0);
      setStatus('Unpaid');
    } else if (method === 'Split') {
      // Synchronize initial splits
      const computedPaid = splitCash + splitEsewa + splitRbb + splitSahakari;
      setPaidAmount(computedPaid);
    }
  };

  // Helper recalculate paid/due when items list or inputs change
  const recalculatePaidDue = (items: InvoiceItem[], discount: number, paid: number) => {
    const calcSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const calcFinal = Math.max(0, calcSubtotal - discount);
    const calcDue = Math.max(0, calcFinal - paid);

    if (calcDue === 0 && calcFinal > 0) {
      setStatus('Paid');
    } else if (paid === 0 && calcDue > 0) {
      setStatus('Unpaid');
    } else if (paid > 0 && calcDue > 0) {
      setStatus('Partially Paid');
    }
  };

  const handleFinancialChange = (
    field: 'discount' | 'paid',
    value: number
  ) => {
    let currentDiscount = discountAmount;
    let currentPaid = paidAmount;

    if (field === 'discount') {
      currentDiscount = Math.max(0, value);
      setDiscountAmount(currentDiscount);
    } else if (field === 'paid') {
      currentPaid = Math.max(0, value);
      setPaidAmount(currentPaid);
    }

    recalculatePaidDue(formItems, currentDiscount, currentPaid);
  };

  // Submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDateLocked && isDateLocked(date)) {
      alert(`⚠️ The date ${date} is locked (Daily Closing completed). Cannot record transactions on a locked date.`);
      return;
    }
    if (!customerName.trim() || formItems.length === 0) return;

    // Filter out any line items with empty service IDs
    const validItems = formItems.filter(item => item.serviceId !== '');
    if (validItems.length === 0) {
      alert("Please add at least one valid service line item.");
      return;
    }

    const computedSubtotal = validItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    if (computedSubtotal <= 0) {
      alert("Total bill amount must be greater than Rs. 0.");
      return;
    }

    if (discountAmount > computedSubtotal) {
      alert(`Discount amount (Rs. ${discountAmount.toLocaleString('en-IN')}) cannot exceed subtotal amount (Rs. ${computedSubtotal.toLocaleString('en-IN')}).`);
      return;
    }

    const computedFinal = Math.max(0, computedSubtotal - discountAmount);
    
    let computedPaid = 0;
    if (paymentMethod === 'Due') {
      computedPaid = 0;
    } else if (paymentMethod === 'Split') {
      if (splitCash < 0 || splitEsewa < 0 || splitRbb < 0 || splitSahakari < 0) {
        alert("Split payment values cannot be negative.");
        return;
      }
      computedPaid = splitCash + splitEsewa + splitRbb + splitSahakari;
    } else {
      computedPaid = Math.max(0, paidAmount);
    }

    if (computedPaid > computedFinal) {
      alert(`Balance validation error: Paid amount (Rs. ${computedPaid.toLocaleString('en-IN')}) exceeds net final bill amount (Rs. ${computedFinal.toLocaleString('en-IN')}). Overpayment is not permitted.`);
      return;
    }
    
    const computedDue = Math.max(0, computedFinal - computedPaid);

    const splitsObj = paymentMethod === 'Split' ? {
      cash: splitCash,
      esewa: splitEsewa,
      rbb: splitRbb,
      sahakari: splitSahakari,
      due: computedDue
    } : {
      cash: paymentMethod === 'Cash' ? computedPaid : 0,
      esewa: paymentMethod === 'Esewa' ? computedPaid : 0,
      rbb: paymentMethod === 'RBB' ? computedPaid : 0,
      sahakari: paymentMethod === 'Sahakari' ? computedPaid : 0,
      due: computedDue
    };

    const computedStatus = computedDue === 0 ? 'Paid' : (computedPaid === 0 ? 'Unpaid' : 'Partially Paid');

    const invoiceData = {
      invoiceNumber: invoiceNumber.trim() || generateInvoiceNumber(date || getCurrentBsDate(), invoices, periodicClosings),
      date,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      items: validItems,
      totalAmount: computedSubtotal,
      discountAmount,
      finalAmount: computedFinal,
      paidAmount: computedPaid,
      dueAmount: computedDue,
      status: computedStatus,
      paymentMethod,
      remarks: remarks.trim(),
      paymentSplits: splitsObj
    };

    if (editingInv) {
      // Role Permissions Check: Staff can only send edit requests, they cannot modify existing invoices directly!
      if (currentUserRole !== 'Admin') {
        if (onSendEditRequest) {
          onSendEditRequest({
            id: `req-${Date.now()}`,
            type: 'Invoice Edit',
            details: `Proposal to edit invoice ${editingInv.invoiceNumber} (${editingInv.customerName}). Proposed total: Rs. ${computedFinal}`,
            targetInvoiceId: editingInv.id,
            invoiceData: {
              id: editingInv.id,
              ...invoiceData
            },
            date: getCurrentBsDate(),
            status: 'Pending'
          });
          alert('Edit request submitted successfully to Admin! Staff cannot directly update financial transactions.');
        } else {
          alert('Staff user accounts do not have authorization to directly modify transaction ledgers.');
        }
      } else {
        // Admin can directly edit
        onEditInvoice({
          id: editingInv.id,
          ...invoiceData
        });
      }
    } else {
      // Staff and Admin can both issue new invoices (creates are fine)
      onAddInvoice(invoiceData);
    }
    setIsFormOpen(false);
  };

  // Financial Summaries for Sales
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.finalAmount, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.dueAmount, 0);

  // Filtering Logic
  const filteredInvoices = invoices.filter(inv => {
    // 1. Invoice Number Filter
    if (filterInvoiceNo.trim()) {
      const q = filterInvoiceNo.trim().toLowerCase();
      if (!inv.invoiceNumber.toLowerCase().includes(q)) return false;
    }

    // 2. Date Filter (From Date and To Date)
    if (filterFromDate || filterToDate) {
      const invDate = inv.date;
      if (filterFromDate && filterToDate) {
        if (!isDateWithinRange(invDate, filterFromDate, filterToDate)) return false;
      } else if (filterFromDate) {
        const normInv = normalizeStandardBsDate(invDate);
        const normFrom = normalizeStandardBsDate(filterFromDate);
        if (normInv < normFrom) return false;
      } else if (filterToDate) {
        const normInv = normalizeStandardBsDate(invDate);
        const normTo = normalizeStandardBsDate(filterToDate);
        if (normInv > normTo) return false;
      }
    }

    // 3. Amount Filter (Min Amount and Max Amount on final bill amount)
    const billAmount = Number(inv.finalAmount !== undefined ? inv.finalAmount : inv.totalAmount) || 0;
    if (filterMinAmount !== '') {
      const minVal = parseFloat(filterMinAmount);
      if (!isNaN(minVal) && billAmount < minVal) return false;
    }
    if (filterMaxAmount !== '') {
      const maxVal = parseFloat(filterMaxAmount);
      if (!isNaN(maxVal) && billAmount > maxVal) return false;
    }

    // 4. Status Filter
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    if (!matchesStatus) return false;

    // 5. Payment Filter
    const matchesPayment = paymentFilter === 'All' || inv.paymentMethod === paymentFilter;
    if (!matchesPayment) return false;

    // 6. Search Term Filter
    if (searchTerm.trim()) {
      const matchingServices = (inv.items || []).map(item => 
        item.serviceId === 'misc' 
          ? (item.customName || 'Misc Item') 
          : (getItemDetails(item.serviceId)?.name || '')
      );
      const serviceString = matchingServices.join(' ');
      const searchTarget = (
        inv.customerName + ' ' + 
        inv.invoiceNumber + ' ' + 
        serviceString + ' ' + 
        inv.remarks + ' ' + 
        inv.customerAddress
      ).toLowerCase();
      if (!searchTarget.includes(searchTerm.toLowerCase())) return false;
    }

    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    statusFilter !== 'All' ||
    paymentFilter !== 'All' ||
    filterInvoiceNo.trim() ||
    filterFromDate ||
    filterToDate ||
    filterMinAmount !== '' ||
    filterMaxAmount !== ''
  );

  const activeFilterCount = [
    Boolean(searchTerm.trim()),
    statusFilter !== 'All',
    paymentFilter !== 'All',
    Boolean(filterInvoiceNo.trim()),
    Boolean(filterFromDate || filterToDate),
    Boolean(filterMinAmount !== '' || filterMaxAmount !== '')
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setPaymentFilter('All');
    setFilterInvoiceNo('');
    setFilterFromDate('');
    setFilterToDate('');
    setFilterMinAmount('');
    setFilterMaxAmount('');
  };

  return (
    <div className="space-y-6 animate-fade-in" id="sales-and-billing-tab">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-display">Sales & Billing Center</h2>
          <p className="text-xs text-slate-500">Generate bills, track client receivables, register service sales, and print elegant invoices.</p>
        </div>
        <button 
          onClick={openAddForm}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition duration-200 shrink-0 cursor-pointer"
          id="btn-create-invoice"
          disabled={services.length === 0 && inventoryStock.length === 0}
        >
          <Plus size={16} />
          <span>Create New Invoice</span>
        </button>
      </div>

      {services.length === 0 && inventoryStock.length === 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-xs text-amber-800">
          <AlertCircle size={18} className="text-amber-600 shrink-0" />
          <div>
            <p className="font-semibold">No services or inventory items in registry!</p>
            <p className="mt-0.5">Please add at least one business support service in the &quot;Services Registry&quot; or upload inventory stock items to configure invoice line items.</p>
          </div>
        </div>
      )}

      {/* Sales Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Billed Revenue</span>
          <p className="text-2xl font-bold font-display mt-1 text-indigo-400" id="stat-billed-revenue">Rs. {totalInvoiced.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-2">Aggregate of all finalized services</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Cash Collected</span>
          <p className="text-2xl font-bold font-display mt-1 text-emerald-600" id="stat-cash-collected">Rs. {totalCollected.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 mt-2">Cash inflows realized in accounts</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Accounts Receivable (Dues)</span>
          <p className="text-2xl font-bold font-display mt-1 text-rose-600" id="stat-accounts-receivable">Rs. {totalOutstanding.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 mt-2">Outstanding customer payment dues</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <InteractiveSearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search invoice number, client name, services, location..."
              expandedWidth="w-full max-w-md"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex w-full md:w-auto gap-2 flex-wrap items-center">
            {/* Invoice Number Filter Input */}
            <div className="relative min-w-[150px] flex-1 sm:flex-initial">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 font-mono text-xs">
                #
              </span>
              <input
                type="text"
                value={filterInvoiceNo}
                onChange={(e) => setFilterInvoiceNo(e.target.value)}
                placeholder="Invoice No..."
                className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                title="Filter by Invoice Number"
              />
              {filterInvoiceNo && (
                <button
                  type="button"
                  onClick={() => setFilterInvoiceNo('')}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-hidden focus:border-indigo-500"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Fully Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Unpaid">Unpaid / Dues</option>
            </select>

            {/* Payment Dropdown */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-hidden focus:border-indigo-500"
            >
              <option value="All">All Pay Modes</option>
              <option value="Cash">Cash</option>
              <option value="Esewa">Esewa</option>
              <option value="Sahakari">Sahakari</option>
              <option value="RBB">RBB</option>
              <option value="Due">Due / Credit</option>
            </select>

            {/* Toggle Advanced Filters Button */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`inline-flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                showAdvancedFilters || filterFromDate || filterToDate || filterMinAmount || filterMaxAmount
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>More Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-0.5 bg-indigo-600 text-white text-[10px] w-4 h-4 rounded-full inline-flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 py-2 px-2.5 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                title="Clear all applied filters"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Expandable Advanced Date and Amount Filters */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/70 p-3 rounded-xl">
            {/* From Date Filter */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 flex items-center gap-1">
                <Calendar size={11} className="text-slate-400" />
                From Date (सुरु मिति)
              </label>
              <NepaliDatePicker
                value={filterFromDate}
                onChange={setFilterFromDate}
                className="w-full text-xs"
              />
            </div>

            {/* To Date Filter */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 flex items-center gap-1">
                <Calendar size={11} className="text-slate-400" />
                To Date (अन्तिम मिति)
              </label>
              <NepaliDatePicker
                value={filterToDate}
                onChange={setFilterToDate}
                className="w-full text-xs"
              />
            </div>

            {/* Min Amount Filter */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 flex items-center gap-1">
                <DollarSign size={11} className="text-slate-400" />
                Min Amount (न्यूनतम रु.)
              </label>
              <input
                type="number"
                value={filterMinAmount}
                onChange={(e) => setFilterMinAmount(e.target.value)}
                placeholder="Min Rs."
                min="0"
                className="w-full py-1.5 px-2.5 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-700 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Max Amount Filter */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 flex items-center gap-1">
                <DollarSign size={11} className="text-slate-400" />
                Max Amount (अधिकतम रु.)
              </label>
              <input
                type="number"
                value={filterMaxAmount}
                onChange={(e) => setFilterMaxAmount(e.target.value)}
                placeholder="Max Rs."
                min="0"
                className="w-full py-1.5 px-2.5 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-700 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Quick Date Presets */}
            <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-medium text-slate-500">Quick Date Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    const today = getCurrentBsDate();
                    setFilterFromDate(today);
                    setFilterToDate(today);
                  }}
                  className="text-[10px] font-medium bg-white hover:bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 transition cursor-pointer"
                >
                  आज (Today)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = getCurrentBsDate();
                    const parts = today.split('-');
                    if (parts.length === 3) {
                      setFilterFromDate(`${parts[0]}-${parts[1]}-01`);
                      setFilterToDate(today);
                    }
                  }}
                  className="text-[10px] font-medium bg-white hover:bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 transition cursor-pointer"
                >
                  यो महिना (This Month)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterFromDate('');
                    setFilterToDate('');
                  }}
                  className="text-[10px] font-medium bg-white hover:bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 transition cursor-pointer"
                >
                  सबै मिति (All Dates)
                </button>
              </div>

              <div className="text-[11px] font-medium text-slate-500">
                Found <span className="font-bold text-slate-800">{filteredInvoices.length}</span> bills
                {filteredInvoices.length !== invoices.length && (
                  <span> (filtered from {invoices.length})</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Ledger Table */}
      <div className="bg-white border border-slate-100 shadow-xs rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                <th className="px-6 py-4">Invoice No</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Client Name & Address</th>
                <th className="px-6 py-4">Service Lines Listed</th>
                <th className="px-6 py-4 text-right">Net Bill</th>
                <th className="px-6 py-4 text-right">Collected</th>
                <th className="px-6 py-4 text-right">Receivable</th>
                <th className="px-6 py-4 text-center">Pay Mode</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 font-sans">
              {filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(inv => {
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                    
                    {/* Invoice ID / Number */}
                    <td className="px-6 py-4.5 font-mono font-bold text-indigo-600 whitespace-nowrap">
                      <button 
                        onClick={() => {
                          const lineItems = (inv.items || []).map((it, idx) => {
                            const sName = it.customName || services.find(s => s.id === it.serviceId)?.name || 'Service / Product Item';
                            return {
                              sn: idx + 1,
                              name: sName,
                              quantity: it.quantity,
                              unitPrice: it.unitPrice,
                              totalPrice: it.quantity * it.unitPrice
                            };
                          });
                          if (window.openUniversalPrintPreview) {
                            window.openUniversalPrintPreview({
                              documentType: 'Invoice',
                              documentNumber: inv.invoiceNumber,
                              documentDate: inv.date,
                              status: inv.status,
                              profile: profile,
                              recipient: {
                                name: inv.customerName,
                                phone: inv.customerPhone,
                                address: inv.customerAddress,
                                pan: inv.customerPan
                              },
                              title: 'INVOICE',
                              items: lineItems,
                              subtotal: inv.totalAmount,
                              taxAmount: (inv as any).vatAmount || 0,
                              discountAmount: inv.discountAmount,
                              grandTotal: inv.finalAmount,
                              amountInWords: numberToWords(inv.finalAmount),
                              notes: inv.remarks || undefined
                            });
                          } else {
                            setActiveReceipt(inv);
                          }
                        }}
                        className="hover:underline text-left cursor-pointer focus:outline-hidden"
                        title="Click to view print preview"
                      >
                        {inv.invoiceNumber}
                      </button>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4.5 font-mono whitespace-nowrap text-slate-500">
                      {inv.date}
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-950">{inv.customerName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{inv.customerAddress || 'N/A'}</div>
                    </td>

                    {/* Service Name list */}
                    <td className="px-6 py-4.5 max-w-[200px] truncate">
                      <div className="space-y-1">
                        {inv.items && inv.items.length > 0 ? (
                          inv.items.map((item, index) => {
                            const isMisc = item.serviceId === 'misc';
                            const detail = isMisc ? null : getItemDetails(item.serviceId);
                            return (
                              <div key={index} className="text-[11px] font-semibold text-slate-800">
                                • {isMisc ? (item.customName || 'Misc Item') : (detail ? detail.name : <span className="text-slate-400 italic">Discontinued Service</span>)}{' '}
                                <span className="text-slate-400 font-mono font-normal">x{item.quantity}</span>
                              </div>
                            );
                          })
                        ) : (
                          // Fallback for backward compatibility
                          <div className="text-[11px] font-semibold text-slate-800">
                            • {getItemDetails((inv as any).serviceId)?.name || <span className="text-slate-400 italic">Discontinued Service</span>}{' '}
                            <span className="text-slate-400 font-mono font-normal">x{(inv as any).quantity || 1}</span>
                          </div>
                        )}
                        {inv.remarks && (
                          <div className="text-[9px] text-slate-400 truncate mt-0.5" title={inv.remarks}>
                            Ref: {inv.remarks}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Net Bill */}
                    <td className="px-6 py-4.5 text-right font-semibold text-slate-900 font-mono">
                      Rs. {inv.finalAmount.toLocaleString()}
                    </td>

                    {/* Collected */}
                    <td className="px-6 py-4.5 text-right font-medium text-emerald-600 font-mono">
                      Rs. {inv.paidAmount.toLocaleString()}
                    </td>

                    {/* Receivable */}
                    <td className="px-6 py-4.5 text-right font-medium font-mono">
                      <span className={inv.dueAmount > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                        Rs. {inv.dueAmount.toLocaleString()}
                      </span>
                    </td>

                    {/* Pay Mode */}
                    <td className="px-6 py-4.5 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-mono">
                        {inv.paymentMethod}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4.5 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' :
                        inv.status === 'Partially Paid' ? 'bg-amber-50 text-amber-700' :
                        'bg-rose-50 text-rose-700'
                      }`}>
                        {inv.status === 'Paid' ? 'Fully Paid' : inv.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => {
                            const lineItems = (inv.items || []).map((it, idx) => {
                              const sName = it.customName || services.find(s => s.id === it.serviceId)?.name || 'Service / Product Item';
                              return {
                                sn: idx + 1,
                                name: sName,
                                quantity: it.quantity,
                                unitPrice: it.unitPrice,
                                totalPrice: it.quantity * it.unitPrice
                              };
                            });
                            if (window.openUniversalPrintPreview) {
                              window.openUniversalPrintPreview({
                                documentType: 'Invoice',
                                documentNumber: inv.invoiceNumber,
                                documentDate: inv.date,
                                status: inv.status,
                                profile: profile,
                                recipient: {
                                  name: inv.customerName,
                                  phone: inv.customerPhone,
                                  address: inv.customerAddress,
                                  pan: inv.customerPan
                                },
                                title: 'INVOICE',
                                items: lineItems,
                                subtotal: inv.totalAmount,
                                taxAmount: (inv as any).vatAmount || 0,
                                discountAmount: inv.discountAmount,
                                grandTotal: inv.finalAmount,
                                amountInWords: numberToWords(inv.finalAmount),
                                notes: inv.remarks || undefined
                              });
                            } else {
                              setActiveReceipt(inv);
                              setTimeout(() => window.print(), 100);
                            }
                          }}
                          className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition cursor-pointer"
                          title="Print Receipt"
                        >
                          <Printer size={13} />
                        </button>
                        <button 
                          onClick={() => openEditForm(inv)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
                          title={currentUserRole !== 'Super Admin' ? "Submit Edit Request" : "Edit Bill"}
                        >
                          <Edit3 size={13} />
                        </button>
                        <button 
                          onClick={() => {
                            const isSystemMaster = currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan';
                            if (!isSystemMaster) {
                              if (onSendEditRequest) {
                                onSendEditRequest({
                                  id: `req-${Date.now()}`,
                                  type: 'Invoice Deletion',
                                  details: `Request to delete invoice ${inv.invoiceNumber} for Rs. ${inv.finalAmount} issued to ${inv.customerName}. Requires System Master (@reliableadmin) approval.`,
                                  targetInvoiceId: inv.id,
                                  date: getCurrentBsDate(),
                                  status: 'Pending'
                                });
                                alert('Deletion request submitted to System Master (@reliableadmin) for approval. Direct invoice deletion is allowed for reliableadmin only.');
                              } else {
                                alert('Direct invoice deletion is allowed for System Master (@reliableadmin) only.');
                              }
                            } else {
                              // System Master (reliableadmin) can delete directly without anyone's approval
                              if (confirm(`Are you sure you want to delete invoice ${inv.invoiceNumber} for ${inv.customerName}?`)) {
                                onDeleteInvoice(inv.id);
                              }
                            }
                          }}
                          className="p-1.5 rounded-md transition cursor-pointer text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                          title={currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' ? "Delete Bill (System Master: @reliableadmin)" : "Request Bill Deletion (Requires @reliableadmin Approval)"}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <p className="text-2xl">💸</p>
                    <p className="text-xs font-medium mt-2">No matching customer invoices found</p>
                    <p className="text-[10px] text-slate-400 mt-1">Please try modifying your filter criteria or generate a new client billing record.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredInvoices.length > 0 && (
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
                Showing {Math.min(filteredInvoices.length, (currentPage - 1) * pageSize + 1)}-{Math.min(currentPage * pageSize, filteredInvoices.length)} of {filteredInvoices.length} entries
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
                  Page {currentPage} of {Math.ceil(filteredInvoices.length / pageSize)}
                </span>
                <button
                  disabled={currentPage >= Math.ceil(filteredInvoices.length / pageSize)}
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

      {/* Bill / Invoice Creator and Editor Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-scale-in max-h-[calc(100dvh-2rem)] my-auto flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold font-display text-slate-800 text-lg">
                  {editingInv 
                    ? (currentUserRole === 'Staff' ? 'Propose Invoice Changes (Staff)' : 'Edit Client Invoice') 
                    : 'Create Customer Invoice'}
                </h3>
                <p className="text-[11px] text-slate-500">Record billable client sales, calculate taxes/discounts, and log pay-ins.</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              
              {currentUserRole === 'Staff' && editingInv && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800 leading-relaxed font-semibold flex gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>Note: As a Staff user, modifying this invoice will submit a proposed change request to the Admin. It will not immediately overwrite the active ledger until approved.</span>
                </div>
              )}

              {/* Group 1: Invoice Identifier & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Invoice Number *</label>
                  <div className="relative">
                    <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      required
                      placeholder="e.g. RTSS-INV-2083/84-001"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Billing Date *</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      required
                      placeholder="YYYY-MM-DD (B.S.)"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Client Demographics */}
              <div className="space-y-3 p-4 bg-indigo-50/20 border border-indigo-100/30 rounded-xl">
                <p className="text-[10px] font-mono uppercase tracking-wider text-indigo-700 font-bold">Client Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Client Name *</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        required
                        placeholder="Search or enter client name..."
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          setShowCustomerDropdown(true);
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        onBlur={() => {
                          setTimeout(() => setShowCustomerDropdown(false), 200);
                        }}
                        className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        autoComplete="off"
                      />

                      {showCustomerDropdown && filteredCustomers.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl divide-y divide-slate-100">
                          {filteredCustomers.map((cust) => (
                            <div
                              key={cust.name}
                              onMouseDown={() => {
                                setCustomerName(cust.name);
                                setCustomerPhone(cust.phone);
                                setCustomerAddress(cust.address);
                                setShowCustomerDropdown(false);
                              }}
                              className="px-4 py-2 hover:bg-indigo-50/50 cursor-pointer text-left text-xs transition flex justify-between items-center"
                            >
                              <div>
                                <p className="font-bold text-slate-800">{cust.name}</p>
                                {cust.phone && <p className="text-[10px] text-slate-500 font-mono">{cust.phone}</p>}
                              </div>
                              {cust.totalDue > 0 ? (
                                <span className="text-[10px] bg-rose-50 border border-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold font-mono">
                                  Due: Rs. {cust.totalDue}
                                </span>
                              ) : (
                                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                                  Clear
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {matchedCustomer && matchedCustomer.totalDue > 0 && (
                      <div className="mt-1.5 text-xs text-rose-600 font-bold bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>Previous Outstanding Due: Rs. {matchedCustomer.totalDue}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Contact Phone</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="e.g. +977-985..."
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Client Address</label>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="e.g. Fikkal Bazar, Ilam"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* Group 3: Multi-item lines builder */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Invoiced Service Line Items</p>
                  <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                    {formItems.length} {formItems.length === 1 ? 'Line' : 'Lines'}
                  </span>
                </div>

                <div className="space-y-2 pr-1">
                  {formItems.map((item, idx) => (
                    <div key={idx} className={`grid grid-cols-12 gap-2 items-end border border-slate-200/60 p-3 rounded-xl bg-white shadow-3xs relative group ${activeItemDropdownIdx === idx ? 'z-30' : 'z-10'}`}>
                      <div className="col-span-12 sm:col-span-6 space-y-1 relative">
                        <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Select item from the list or type custom item name *</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            autoComplete="off"
                            placeholder="Type to search from the list or enter a custom name..."
                            value={
                              itemQueries[idx] !== undefined 
                                ? itemQueries[idx] 
                                : (item.serviceId === 'misc' 
                                    ? (item.customName || '') 
                                    : (getItemDetails(item.serviceId)?.name || '')
                                  )
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              setItemQueries(prev => ({ ...prev, [idx]: val }));
                              setActiveItemDropdownIdx(idx);
                              
                              // Check if there is an exact match to automatically bind the ID
                              const exactMatch = services.find(s => s.name.toLowerCase() === val.toLowerCase().trim()) ||
                                                 inventoryStock.find(i => i.name.toLowerCase() === val.toLowerCase().trim());
                              if (exactMatch) {
                                handleItemServiceChange(idx, exactMatch.id);
                              } else {
                                // If they type a custom manual name, handle it via customName
                                if (item.serviceId === 'misc') {
                                  handleItemCustomNameChange(idx, val);
                                }
                              }
                            }}
                            onFocus={() => {
                              setActiveItemDropdownIdx(idx);
                              const currentVal = item.serviceId === 'misc' 
                                ? (item.customName || '') 
                                : (getItemDetails(item.serviceId)?.name || '');
                              setItemQueries(prev => ({ ...prev, [idx]: currentVal }));
                            }}
                            onBlur={() => {
                              // Small timeout to allow onMouseDown event to trigger on suggestions list
                              setTimeout(() => {
                                setActiveItemDropdownIdx(null);
                              }, 250);
                            }}
                            className="w-full border border-slate-200 rounded-lg p-1.5 pr-8 text-xs bg-white text-slate-700 focus:outline-hidden focus:border-indigo-500 font-medium"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none text-slate-400">
                            {item.serviceId === 'misc' ? '⚙️' : '🔍'}
                          </span>
                        </div>

                        {/* Search Suggestions Popup */}
                        {activeItemDropdownIdx === idx && (() => {
                          const query = (itemQueries[idx] !== undefined ? itemQueries[idx] : '').toLowerCase().trim();
                          const filteredServices = services.filter(s => 
                            s.name.toLowerCase().includes(query) || 
                            (s.category && s.category.toLowerCase().includes(query))
                          );
                          const filteredInventory = inventoryStock.filter(i => 
                            i.name.toLowerCase().includes(query)
                          );
                          
                          return (
                            <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl divide-y divide-slate-100">
                              {filteredServices.map(s => (
                                <div
                                  key={s.id}
                                  onMouseDown={() => {
                                    handleItemServiceChange(idx, s.id);
                                    // Remove local input query to fallback to service name
                                    setItemQueries(prev => {
                                      const updated = { ...prev };
                                      delete updated[idx];
                                      return updated;
                                    });
                                    setActiveItemDropdownIdx(null);
                                  }}
                                  className="px-3 py-2 hover:bg-indigo-50/50 cursor-pointer text-left text-xs transition flex justify-between items-center"
                                >
                                  <div>
                                    <p className="font-bold text-slate-800">{s.name}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded uppercase">Service</span>
                                      {s.category && <p className="text-[10px] text-slate-400 font-mono">{s.category}</p>}
                                    </div>
                                  </div>
                                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold font-mono">
                                    Rs. {s.priceRate} / {s.rateType}
                                  </span>
                                </div>
                              ))}

                              {filteredInventory.map(i => (
                                <div
                                  key={i.id}
                                  onMouseDown={() => {
                                    handleItemServiceChange(idx, i.id);
                                    // Remove local input query to fallback to item name
                                    setItemQueries(prev => {
                                      const updated = { ...prev };
                                      delete updated[idx];
                                      return updated;
                                    });
                                    setActiveItemDropdownIdx(null);
                                  }}
                                  className="px-3 py-2 hover:bg-emerald-50/50 cursor-pointer text-left text-xs transition flex justify-between items-center"
                                >
                                  <div>
                                    <p className="font-bold text-slate-800">{i.name}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded uppercase">Product</span>
                                      <p className="text-[10px] text-slate-400 font-mono">Stock: {i.quantity} {i.unitType || 'pcs'}</p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold font-mono">
                                    Rs. {i.sellingPrice} / {i.unitType || 'pcs'}
                                  </span>
                                </div>
                              ))}
                              
                              <div
                                onMouseDown={() => {
                                  const customVal = query || 'Custom Charge';
                                  const updatedItems = [...formItems];
                                  updatedItems[idx] = {
                                    ...updatedItems[idx],
                                    serviceId: 'misc',
                                    customName: customVal,
                                    unitPrice: updatedItems[idx].unitPrice || 0
                                  };
                                  setFormItems(updatedItems);
                                  setItemQueries(prev => {
                                    const updated = { ...prev };
                                    delete updated[idx];
                                    return updated;
                                  });
                                  setActiveItemDropdownIdx(null);
                                }}
                                className="px-3 py-2 hover:bg-amber-50 cursor-pointer text-left text-xs font-semibold text-amber-700 flex items-center gap-1.5"
                              >
                                <span>⚙️</span>
                                <span>Use "{query || 'Custom Item'}" as Manual Custom Charge</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="col-span-4 sm:col-span-2 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider text-center">Qty</label>
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemQuantityChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-full border border-slate-200 rounded-lg p-1.5 text-xs text-center font-mono focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider text-right">Rate (Rs.)</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          required
                          value={item.unitPrice !== undefined ? item.unitPrice : ''}
                          onChange={(e) => handleItemPriceChange(idx, Number(e.target.value))}
                          className="w-full border border-slate-200 rounded-lg p-1.5 text-xs text-right font-mono focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2 flex items-center justify-between pb-1.5 pl-1.5">
                        <div className="text-right flex-1 pr-2">
                          <span className="text-[10px] font-mono font-bold text-slate-600 block">Rs.</span>
                          <span className="text-xs font-mono font-bold text-slate-800">
                            {(item.quantity * item.unitPrice).toLocaleString()}
                          </span>
                        </div>
                        {formItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formItems.filter((_, i) => i !== idx);
                              setFormItems(updated);
                              recalculatePaidDue(updated, discountAmount, paidAmount);
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Remove Line Item"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setFormItems([...formItems, { serviceId: services[0]?.id || '', quantity: 1, unitPrice: services[0]?.priceRate || 0 }])}
                  className="w-full py-2 border border-dashed border-indigo-200 text-indigo-600 hover:text-indigo-700 text-xs font-semibold rounded-xl hover:bg-indigo-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Another Service Line Item</span>
                </button>
              </div>

              {/* Group 4: Finance Calculation Area */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Calculation Breakdown</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  
                  {/* Read-Only Items subtotal */}
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-semibold text-slate-500 block">Items Subtotal (Rs.)</label>
                    <div className="w-full border border-slate-150 rounded-xl px-3 py-2 text-xs bg-slate-100/50 font-mono text-slate-600 font-semibold flex items-center justify-between">
                      <span>Rs.</span>
                      <span>{subtotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Discount input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600 block">Discount (Rs.)</label>
                    <div className="relative">
                      <Percent size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="number"
                        step="any"
                        min="0"
                        value={discountAmount || ''}
                        placeholder="0"
                        onChange={(e) => handleFinancialChange('discount', parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-xl pl-7 pr-2 py-2 text-xs bg-white focus:outline-hidden focus:border-indigo-500 font-mono text-rose-600 font-semibold"
                      />
                    </div>
                  </div>

                  {/* Net Bill (ReadOnly) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-indigo-700 block">Net Final Bill (Rs.)</label>
                    <div className="w-full border border-transparent rounded-xl px-3 py-2 text-xs bg-indigo-100/50 font-mono text-indigo-700 font-bold flex items-center justify-between">
                      <span>Rs.</span>
                      <span>{finalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                </div>

                {paymentMethod === 'Split' ? (
                  <div className="space-y-3 pt-2 border-t border-slate-200/50">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono">Split Payment Allocation</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Cash Split */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-700 block">Cash Portion (Rs.)</label>
                        <input 
                          type="number"
                          step="any"
                          min="0"
                          value={splitCash || ''}
                          placeholder="0"
                          onChange={(e) => setSplitCash(parseFloat(e.target.value) || 0)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-white focus:outline-hidden focus:border-indigo-500 font-mono text-slate-700 font-semibold"
                        />
                      </div>
                      
                      {/* Esewa Split */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-700 block">Esewa Portion (Rs.)</label>
                        <input 
                          type="number"
                          step="any"
                          min="0"
                          value={splitEsewa || ''}
                          placeholder="0"
                          onChange={(e) => setSplitEsewa(parseFloat(e.target.value) || 0)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-white focus:outline-hidden focus:border-indigo-500 font-mono text-slate-700 font-semibold"
                        />
                      </div>

                      {/* RBB Split */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-700 block">RBB Portion (Rs.)</label>
                        <input 
                          type="number"
                          step="any"
                          min="0"
                          value={splitRbb || ''}
                          placeholder="0"
                          onChange={(e) => setSplitRbb(parseFloat(e.target.value) || 0)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-white focus:outline-hidden focus:border-indigo-500 font-mono text-slate-700 font-semibold"
                        />
                      </div>

                      {/* Sahakari Split */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-700 block">Sahakari Portion (Rs.)</label>
                        <input 
                          type="number"
                          step="any"
                          min="0"
                          value={splitSahakari || ''}
                          placeholder="0"
                          onChange={(e) => setSplitSahakari(parseFloat(e.target.value) || 0)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-white focus:outline-hidden focus:border-indigo-500 font-mono text-slate-700 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[9px] font-semibold text-emerald-700 block uppercase tracking-wider">Total Split Paid</span>
                        <span className="text-xs font-bold font-mono text-emerald-600">Rs. {paidAmount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-semibold text-rose-700 block uppercase tracking-wider">Remaining Due Split</span>
                        <span className="text-xs font-bold font-mono text-rose-600">Rs. {splitDue.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-semibold text-slate-600 block uppercase tracking-wider">Computed Invoice Status</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                          status === 'Partially Paid' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>{status}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200/50">
                    {/* Amount Paid input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-emerald-700 block uppercase tracking-wider">Cash Paid Now (Rs.)</label>
                      <input 
                        type="number"
                        step="any"
                        min="0"
                        disabled={paymentMethod === 'Due'}
                        value={paymentMethod === 'Due' ? 0 : (paidAmount || '')}
                        placeholder="0"
                        onChange={(e) => handleFinancialChange('paid', parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:outline-hidden focus:border-indigo-500 font-mono text-emerald-600 font-bold"
                      />
                    </div>

                    {/* Amount Due (ReadOnly) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-rose-700 block uppercase tracking-wider">Remaining Due (Rs.)</label>
                      <div className="w-full border border-transparent rounded-xl px-3 py-2 text-xs bg-rose-50 font-mono text-rose-700 font-bold flex items-center justify-between">
                        <span>Rs.</span>
                        <span>{dueAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Status selection override */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 block uppercase tracking-wider">Manual Status Override</label>
                      <select
                        value={status}
                        disabled={paymentMethod === 'Due'}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-xl px-2 py-1.5 text-xs bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-700"
                      >
                        <option value="Paid">Fully Paid</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Unpaid">Unpaid / Credit Due</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Group 5: Payment Details & Remarks */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Payment Instrument / Mode *</label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => handlePaymentMethodChange(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Cash">Cash Handover</option>
                    <option value="Esewa">Esewa</option>
                    <option value="Sahakari">Sahakari</option>
                    <option value="RBB">RBB</option>
                    <option value="Due">Due / Credit Booking</option>
                    <option value="Split">🔀 Split Payment (eSewa, Cash, RBB, Sahakari, Due)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Internal Remarks / Notes</label>
                  <input 
                    type="text"
                    placeholder="e.g. CCTV setup complete, pending warranty cert"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Actions panel */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                  id="btn-save-invoice"
                >
                  {currentUserRole === 'Staff' && editingInv ? (
                    <>
                      <Send size={14} />
                      <span>Submit Edit Request</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>{editingInv ? 'Save Changes' : 'Issue Invoice'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Interactive Printable Invoice Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:block animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[calc(100dvh-2rem)] my-auto overflow-y-auto animate-scale-in print:border-none print:shadow-none print:rounded-none print:max-w-full print:w-full print:max-h-none">
            
            {/* Control panel at top */}
            <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between sticky top-0 z-20">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Voucher Print Console</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    const lineItems = (activeReceipt.items || []).map((it, idx) => {
                      const sName = it.customName || services.find(s => s.id === it.serviceId)?.name || 'Service / Product Item';
                      return {
                        sn: idx + 1,
                        name: sName,
                        quantity: it.quantity,
                        unitPrice: it.unitPrice,
                        totalPrice: it.quantity * it.unitPrice
                      };
                    });
                    if (window.openUniversalPrintPreview) {
                      window.openUniversalPrintPreview({
                        documentType: 'Invoice',
                        documentNumber: activeReceipt.invoiceNumber,
                        documentDate: activeReceipt.date,
                        status: activeReceipt.status,
                        profile: profile,
                        recipient: {
                          name: activeReceipt.customerName,
                          phone: activeReceipt.customerPhone,
                          address: activeReceipt.customerAddress,
                          pan: activeReceipt.customerPan
                        },
                        title: 'INVOICE',
                        items: lineItems,
                        subtotal: activeReceipt.totalAmount,
                        taxAmount: (activeReceipt as any).vatAmount || 0,
                        discountAmount: activeReceipt.discountAmount,
                        grandTotal: activeReceipt.finalAmount,
                        amountInWords: numberToWords(activeReceipt.finalAmount),
                        notes: activeReceipt.remarks || undefined
                      });
                    } else {
                      window.print();
                    }
                  }}
                  className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-md shadow-xs cursor-pointer"
                >
                  <Printer size={12} />
                  <span>Print Receipt</span>
                </button>
                <button 
                  onClick={() => setActiveReceipt(null)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Printable Receipt Area */}
            <div id="printable-area-receipt" className="select-text">
              <CorporateLetterhead profile={profile} documentType="Invoice">
                <div className="space-y-5">
                  {/* Document Title & Reference Header */}
                  <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                    <div>
                      <h2 className="text-base font-bold text-[#002D62] uppercase tracking-wide">Invoice</h2>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">Voucher Ref: {activeReceipt.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-slate-800">Date: {activeReceipt.date}</p>
                    </div>
                  </div>

                  {/* Customer details info */}
                  <div className="text-xs">
                    <div>
                      <p className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">Bill To Client:</p>
                      <p className="font-bold text-slate-800 mt-0.5">{activeReceipt.customerName}</p>
                      {activeReceipt.customerAddress && <p className="text-slate-500">{activeReceipt.customerAddress}</p>}
                      {activeReceipt.customerPhone && <p className="text-slate-500 font-mono">Ph: {activeReceipt.customerPhone}</p>}
                    </div>
                  </div>

                  {/* Itemized Table */}
                  <div className="border border-slate-100 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 text-[9px] uppercase tracking-wider">
                          <th className="px-4 py-2.5">Scope of Business Service</th>
                          <th className="px-4 py-2.5 text-center">Qty</th>
                          <th className="px-4 py-2.5 text-right">Unit Price</th>
                          <th className="px-4 py-2.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeReceipt.items && activeReceipt.items.length > 0 ? (
                          activeReceipt.items.map((item, idx) => {
                            const isMisc = item.serviceId === 'misc';
                            const detail = isMisc ? null : getItemDetails(item.serviceId);
                            return (
                              <tr key={idx} className="border-b border-slate-100 text-slate-700">
                                <td className="px-4 py-3 font-semibold">
                                  {isMisc ? (item.customName || 'Misc Charge') : (detail?.name || 'Technical Support Service')}
                                  <p className="text-[10px] font-normal text-slate-400 italic mt-0.5">
                                    {isMisc ? 'Miscellaneous manually added item/charge.' : (detail?.type === 'Product' ? 'Inventory Product Sales' : 'Standard reliable service delivery.')}
                                  </p>
                                </td>
                                <td className="px-4 py-3 text-center font-mono">{item.quantity}</td>
                                <td className="px-4 py-3 text-right font-mono">Rs. {item.unitPrice.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right font-mono font-semibold">Rs. {(item.quantity * item.unitPrice).toLocaleString()}</td>
                              </tr>
                            );
                          })
                        ) : (
                          // Fallback for older legacy bills
                          <tr className="border-b border-slate-100 text-slate-700">
                            <td className="px-4 py-3 font-semibold">
                              {getItemDetails((activeReceipt as any).serviceId)?.name || 'Technical Support Service'}
                              <p className="text-[10px] font-normal text-slate-400 italic mt-0.5">
                                {getItemDetails((activeReceipt as any).serviceId)?.type === 'Product' ? 'Inventory Product Sales' : 'Standard reliable service delivery.'}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-center font-mono">{(activeReceipt as any).quantity || 1}</td>
                            <td className="px-4 py-3 text-right font-mono">Rs. {((activeReceipt as any).unitPrice || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-mono font-semibold">Rs. {activeReceipt.totalAmount.toLocaleString()}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals Breakdown and Amount in Words */}
                  <div className="flex flex-col sm:flex-row justify-between items-stretch gap-4 pt-1">
                    <div className="flex-1 bg-slate-50/70 border border-slate-100/80 rounded-xl p-3 flex flex-col justify-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-sans">Amount in Words:</p>
                      <p className="text-xs font-serif italic text-indigo-950 font-bold leading-relaxed">
                        {numberToWords(activeReceipt.finalAmount)}
                      </p>
                    </div>

                    <div className="w-full sm:w-56 text-xs space-y-1 shrink-0 self-start">
                      <div className="flex justify-between text-slate-500">
                        <span>Subtotal:</span>
                        <span className="font-mono">Rs. {activeReceipt.totalAmount.toLocaleString()}</span>
                      </div>
                      {activeReceipt.discountAmount > 0 && (
                        <div className="flex justify-between text-rose-600 font-medium">
                          <span>Discount:</span>
                          <span className="font-mono">-Rs. {activeReceipt.discountAmount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-slate-100 pt-1 text-slate-800 font-bold">
                        <span>Net Bill Amount:</span>
                        <span className="font-mono text-slate-950">Rs. {activeReceipt.finalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CorporateLetterhead>
            </div>

            {/* Back to records */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setActiveReceipt(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition cursor-pointer"
              >
                Close Invoice View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
