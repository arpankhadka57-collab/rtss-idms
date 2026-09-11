import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  Calendar, 
  Tag, 
  ShoppingCart,
  FileText,
  AlertCircle,
  Package,
  PackageCheck,
  Coins,
  ArrowRight,
  Printer
} from 'lucide-react';
import { SupplyTransaction, Supplier, BusinessService, SupplyTransactionItem, AppUser, EditRequest, BusinessProfile, InventoryItem, AssetItem, DailyClosing, PeriodicClosing, OpeningBalances, SalesInvoice, Expense, SalaryDistribution, AccountTransaction } from '../types';
import { getCurrentBsDate, getFormattedPoNumber } from '../utils/nepaliDate';
import { CorporateLetterhead } from './CorporateLetterhead';
import { InteractiveSearchBar } from './InteractiveSearchBar';
import { validateAccountBalance, validateSplitAccountBalances } from '../utils/accountBalance';

interface TransactionsListProps {
  transactions: SupplyTransaction[];
  suppliers: Supplier[];
  onAddTransaction: (tx: Omit<SupplyTransaction, 'id'>) => void;
  onEditTransaction: (tx: SupplyTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  services?: BusinessService[];
  onUpdateServices?: (services: BusinessService[]) => void;
  inventoryStock?: InventoryItem[];
  onUpdateInventoryStock?: (stock: InventoryItem[]) => void;
  assets?: AssetItem[];
  onAddAsset?: (asset: Omit<AssetItem, 'id' | 'assetCode' | 'status'>) => void;
  onUpdateSuppliers?: (suppliers: Supplier[]) => void;
  currentUser: AppUser;
  onSendEditRequest?: (req: Omit<EditRequest, 'status'> & { status: 'Pending' }) => void;
  profile: BusinessProfile;
  units?: string[];
  isDateLocked?: (date: string) => boolean;
  onAddExpense?: (expense: any) => void;
  dailyClosings?: DailyClosing[];
  periodicClosings?: PeriodicClosing[];
  openingBalances?: OpeningBalances;
  invoices?: SalesInvoice[];
  expenses?: Expense[];
  salaryDistributions?: SalaryDistribution[];
  accountTransfers?: AccountTransaction[];
}

export const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions,
  suppliers,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  services = [],
  onUpdateServices,
  inventoryStock = [],
  onUpdateInventoryStock,
  assets = [],
  onAddAsset,
  onUpdateSuppliers,
  currentUser,
  onSendEditRequest,
  profile,
  units = ['pcs', 'kg', 'ltr', 'box', 'packet'],
  isDateLocked,
  onAddExpense,
  dailyClosings = [],
  periodicClosings = [],
  openingBalances,
  invoices = [],
  expenses = [],
  salaryDistributions = [],
  accountTransfers = []
}) => {
  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form modal (For placing a new Purchase Order or editing one)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<SupplyTransaction | null>(null);

  // Form fields for Purchase Order
  const [date, setDate] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [purchaseType, setPurchaseType] = useState<'Commerce' | 'Official Use'>('Commerce');
  
  // Dynamic order items (Starts with 1 empty item)
  const [orderItems, setOrderItems] = useState<{ name: string; quantity: number; unitType?: string }[]>([
    { name: '', quantity: 1, unitType: 'pcs' }
  ]);

  // Active dropdown index for line item search suggestions
  const [activeItemDropdownIdx, setActiveItemDropdownIdx] = useState<number | null>(null);
  // Custom queries per line item
  const [itemQueries, setItemQueries] = useState<Record<number, string>>({});

  // Receiving state
  const [receivingTx, setReceivingTx] = useState<SupplyTransaction | null>(null);
  const [receivedItems, setReceivedItems] = useState<{ 
    name: string; 
    quantity: number; 
    costPrice: number | string; 
    sellingPrice: number | string; 
    unitType?: string;
    assetType?: 'Durable' | 'Non-Durable';
  }[]>([]);
  const [amountPaid, setAmountPaid] = useState<number | string>(0);
  const [paymentAccount, setPaymentAccount] = useState<'Cash' | 'RBB' | 'Esewa' | 'Sahakari' | 'Split'>('Cash');
  const [poPaymentSplits, setPoPaymentSplits] = useState<{ Cash: number; Esewa: number; RBB: number; Sahakari: number }>({
    Cash: 0,
    Esewa: 0,
    RBB: 0,
    Sahakari: 0
  });
  const [addAllToDue, setAddAllToDue] = useState<boolean>(false);
  const [printingPo, setPrintingPo] = useState<SupplyTransaction | null>(null);

  // Edit Request states for Stock Manager / non-admin
  const [requestingEditTx, setRequestingEditTx] = useState<SupplyTransaction | null>(null);
  const [editRequestMsg, setEditRequestMsg] = useState('');
  const [editRequestSuccess, setEditRequestSuccess] = useState(false);

  const handleRequestPoEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestingEditTx || !onSendEditRequest) return;
    
    onSendEditRequest({
      id: `req-${Date.now()}`,
      type: 'Purchase Order Edit',
      details: `Stock Manager (${currentUser.name}) requested edit on PO #${requestingEditTx.id.replace('tx-', '')}. Proposed Changes: ${editRequestMsg}`,
      date: getCurrentBsDate()
    });
    
    setEditRequestSuccess(true);
    setTimeout(() => {
      setRequestingEditTx(null);
      setEditRequestMsg('');
      setEditRequestSuccess(false);
    }, 2500);
  };

  // Open form for a brand new order
  const openAddForm = () => {
    const todayBs = getCurrentBsDate();
    if (isDateLocked && isDateLocked(todayBs)) {
      alert(`⚠️ Today's transactions are locked (Daily Closing completed). Cannot place Purchase Orders on locked dates.`);
      return;
    }
    setEditingTx(null);
    setDate(todayBs);
    setSupplierId(suppliers[0]?.id || '');
    setRemarks('');
    setOrderItems([{ name: '', quantity: 1, unitType: units?.[0] || 'pcs' }]);
    setPurchaseType('Commerce');
    setActiveItemDropdownIdx(null);
    setItemQueries({});
    setIsFormOpen(true);
  };

  // Open form to edit an existing order
  const openEditForm = (tx: SupplyTransaction) => {
    if (isDateLocked && isDateLocked(tx.date)) {
      alert(`⚠️ Transactions for the date ${tx.date} are locked (Daily Closing completed). Cannot modify Purchase Orders on locked dates.`);
      return;
    }
    setEditingTx(tx);
    setDate(tx.date);
    setSupplierId(tx.supplierId);
    setRemarks(tx.remarks);
    setPurchaseType(tx.purchaseType || 'Commerce');
    
    // Map items or construct from itemsBought if empty
    if (tx.items && tx.items.length > 0) {
      setOrderItems(tx.items.map(item => ({ name: item.name, quantity: item.quantity, unitType: item.unitType || 'pcs' })));
    } else {
      setOrderItems([{ name: tx.itemsBought, quantity: 1, unitType: 'pcs' }]);
    }
    setActiveItemDropdownIdx(null);
    setItemQueries({});
    setIsFormOpen(true);
  };

  // Handle adding a dynamic item row to order
  const handleAddOrderItemRow = () => {
    setOrderItems([...orderItems, { name: '', quantity: 1, unitType: units?.[0] || 'pcs' }]);
  };

  // Handle removing a dynamic item row
  const handleRemoveOrderItemRow = (idx: number) => {
    if (orderItems.length <= 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  // Handle dynamic item field changes
  const handleOrderItemChange = (idx: number, field: 'name' | 'quantity' | 'unitType', val: any) => {
    const updated = [...orderItems];
    if (field === 'name') {
      updated[idx].name = val;
    } else if (field === 'quantity') {
      updated[idx].quantity = Math.max(1, Number(val));
    } else if (field === 'unitType') {
      updated[idx].unitType = val;
    }
    setOrderItems(updated);
  };

  // Submit placing / editing order
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) return;
    if (isDateLocked && isDateLocked(date)) {
      alert(`⚠️ The date ${date} is locked (Daily Closing completed). Cannot create/modify transactions on locked dates.`);
      return;
    }

    // Filter out empty rows
    const validItems = orderItems.filter(item => item.name.trim() !== '');
    if (validItems.length === 0) {
      alert("Please add at least one item description.");
      return;
    }

    // Generate descriptive string for legacy text field search
    const itemsBoughtDesc = validItems.map(it => `${it.quantity} ${it.unitType || 'pcs'} of ${it.name}`).join(', ');

    const txData = {
      date,
      supplierId,
      itemsBought: itemsBoughtDesc,
      items: validItems.map(it => ({
        name: it.name.trim(),
        quantity: it.quantity,
        received: editingTx ? (editingTx.status !== 'Ordered' && editingTx.status !== 'Pending Approval') : false,
        costPrice: 0,
        sellingPrice: 0,
        unitType: it.unitType || 'pcs'
      })),
      amountPaid: editingTx ? editingTx.amountPaid : 0,
      amountDue: editingTx ? editingTx.amountDue : 0,
      status: editingTx ? editingTx.status : 'Pending Approval' as const,
      remarks: remarks.trim(),
      purchaseType: purchaseType
    };

    if (editingTx) {
      onEditTransaction({
        id: editingTx.id,
        ...txData,
        status: editingTx.status // Keep old status when editing order details
      });
    } else {
      onAddTransaction(txData);
    }
    setIsFormOpen(false);
  };

  // Open Receive Order Modal
  const handleOpenReceiveModal = (tx: SupplyTransaction) => {
    setReceivingTx(tx);
    setAmountPaid(0);
    setAddAllToDue(false);
    
    const initialItems = (tx.items || []).map(it => ({
      name: it.name,
      quantity: it.quantity,
      costPrice: it.costPrice || 0,
      sellingPrice: it.sellingPrice || 0,
      unitType: it.unitType || 'pcs',
      assetType: 'Durable' as 'Durable' | 'Non-Durable'
    }));

    if (initialItems.length === 0) {
      initialItems.push({ name: tx.itemsBought, quantity: 1, costPrice: 0, sellingPrice: 0, unitType: 'pcs', assetType: 'Durable' });
    }

    setReceivedItems(initialItems);
  };

  // Handle input changes inside receive modal
  const handleReceiveItemPriceChange = (idx: number, field: 'costPrice' | 'sellingPrice' | 'assetType', val: any) => {
    const updated = [...receivedItems];
    if (field === 'assetType') {
      updated[idx].assetType = val;
    } else {
      updated[idx][field] = val;
    }
    setReceivedItems(updated);
  };

  // Handle final receipt submission (and enter into inventory or assets!)
  const handleConfirmReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingTx) return;
    const todayBs = getCurrentBsDate();
    if (isDateLocked && isDateLocked(todayBs)) {
      alert(`⚠️ Today's transactions are locked (Daily Closing completed). Cannot record stock receipts on locked dates.`);
      return;
    }

    // Calculate total cost from all received items
    const totalCost = receivedItems.reduce((acc, item) => {
      const c = typeof item.costPrice === 'number' ? item.costPrice : (parseFloat(item.costPrice as any) || 0);
      return acc + (item.quantity * c);
    }, 0);
    const numericPaid = typeof amountPaid === 'number' ? amountPaid : (parseFloat(amountPaid as any) || 0);
    const actualPaid = addAllToDue ? 0 : numericPaid;

    // Date Lock Check: When daily closing is completed, no transaction payment can be done
    if (actualPaid > 0 && isDateLocked && isDateLocked(receivingTx.date)) {
      alert(`⚠️ Transactions for the date ${receivingTx.date} are locked (Daily Closing completed). Cannot record payments on locked dates.`);
      return;
    }

    if (paymentAccount === 'Split' && !addAllToDue && actualPaid > 0) {
      const splitSum = Number(poPaymentSplits.Cash || 0) + Number(poPaymentSplits.Esewa || 0) + Number(poPaymentSplits.RBB || 0) + Number(poPaymentSplits.Sahakari || 0);
      if (Math.abs(splitSum - actualPaid) > 0.01) {
        alert(`Split allocation total (Rs. ${splitSum.toLocaleString()}) does not match the actual payment amount (Rs. ${actualPaid.toLocaleString()}). Please adjust the split breakdown values.`);
        return;
      }
    }

    // Payment basket balance check: when basket has no balance, block transaction!
    if (!addAllToDue && actualPaid > 0) {
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

      if (paymentAccount === 'Split') {
        const insufficientSplits = validateSplitAccountBalances(poPaymentSplits, balanceData);
        if (insufficientSplits.length > 0) {
          const item = insufficientSplits[0];
          alert(`Transaction Blocked: Insufficient balance in ${item.accountLabel}!\nAvailable balance: Rs. ${item.currentBalance.toLocaleString()}\nAllocated payment: Rs. ${item.requiredAmount.toLocaleString()}\n\nPlease choose another payment account or fund this account.`);
          return;
        }
      } else {
        const insufficient = validateAccountBalance(paymentAccount, actualPaid, balanceData);
        if (insufficient) {
          alert(`Transaction Blocked: Insufficient balance in ${insufficient.accountLabel}!\nAvailable balance: Rs. ${insufficient.currentBalance.toLocaleString()}\nRequired payment: Rs. ${insufficient.requiredAmount.toLocaleString()}\n\nPlease choose another payment account or fund this account.`);
          return;
        }
      }
    }

    const calculatedDue = addAllToDue ? totalCost : Math.max(0, totalCost - actualPaid);
    
    let finalStatus: 'Paid' | 'Partially Paid' | 'Pending' = 'Paid';
    if (calculatedDue === 0 && actualPaid > 0) {
      finalStatus = 'Paid';
    } else if (actualPaid === 0 && calculatedDue > 0) {
      finalStatus = 'Pending';
    } else {
      finalStatus = 'Partially Paid';
    }

    const isOfficialUse = receivingTx.purchaseType === 'Official Use';

    // 1. Update the transaction state
    const updatedTx: SupplyTransaction = {
      ...receivingTx,
      status: 'Items Received',
      amountPaid: actualPaid,
      amountDue: calculatedDue,
      paymentMethod: paymentAccount,
      paymentSplits: paymentAccount === 'Split' ? poPaymentSplits : undefined,
      items: receivedItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        received: true,
        costPrice: typeof item.costPrice === 'number' ? item.costPrice : (parseFloat(item.costPrice as any) || 0),
        sellingPrice: typeof item.sellingPrice === 'number' ? item.sellingPrice : (parseFloat(item.sellingPrice as any) || 0),
        unitType: item.unitType || 'pcs'
      }))
    };

    onEditTransaction(updatedTx);

    // 2. If Commercial Use, populate inventoryStock
    if (!isOfficialUse && onUpdateInventoryStock) {
      let updatedStock = [...inventoryStock];
      receivedItems.forEach(item => {
        const numericCost = typeof item.costPrice === 'number' ? item.costPrice : (parseFloat(item.costPrice as any) || 0);
        const numericSelling = typeof item.sellingPrice === 'number' ? item.sellingPrice : (parseFloat(item.sellingPrice as any) || 0);
        const existingIdx = updatedStock.findIndex(it => it.name.toLowerCase() === item.name.toLowerCase());
        if (existingIdx !== -1) {
          updatedStock[existingIdx] = {
            ...updatedStock[existingIdx],
            quantity: updatedStock[existingIdx].quantity + item.quantity,
            costPrice: numericCost || updatedStock[existingIdx].costPrice,
            sellingPrice: numericSelling || updatedStock[existingIdx].sellingPrice,
            supplierId: receivingTx.supplierId || updatedStock[existingIdx].supplierId,
            lastReceivedDate: todayBs
          };
        } else {
          updatedStock.unshift({
            id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            name: item.name,
            quantity: item.quantity,
            costPrice: numericCost || 0,
            sellingPrice: numericSelling || 0,
            supplierId: receivingTx.supplierId || '',
            lastReceivedDate: todayBs,
            unitType: item.unitType || 'pcs'
          });
        }
      });
      onUpdateInventoryStock(updatedStock);
    }

    // 3. If Office Use, register as Assets
    if (isOfficialUse && onAddAsset) {
      receivedItems.forEach(item => {
        const numericCost = typeof item.costPrice === 'number' ? item.costPrice : (parseFloat(item.costPrice as any) || 0);
        onAddAsset({
          name: item.name,
          type: item.assetType || 'Durable',
          purchaseOrderId: receivingTx.id,
          purchaseDate: todayBs,
          costPrice: numericCost || 0,
          quantity: item.quantity,
          supplierId: receivingTx.supplierId,
          remarks: `Received via PO #${receivingTx.id.replace('tx-', '')}`
        });
      });
    }

    // 4. Update Supplier Liability Ledger Balance
    if (calculatedDue > 0 && onUpdateSuppliers && receivingTx.supplierId) {
      const updatedSuppliers = suppliers.map(s => {
        if (s.id === receivingTx.supplierId) {
          return {
            ...s,
            creditBalance: (s.creditBalance || 0) + calculatedDue
          };
        }
        return s;
      });
      onUpdateSuppliers(updatedSuppliers);
    }

    // 5. Synchronize or Insert into the Business Services Catalog (Only update existing ones! Do NOT add custom/new items to services)
    if (!isOfficialUse && onUpdateServices) {
      let updatedCatalog = [...services];

      receivedItems.forEach(item => {
        const numericCost = typeof item.costPrice === 'number' ? item.costPrice : (parseFloat(item.costPrice as any) || 0);
        const numericSelling = typeof item.sellingPrice === 'number' ? item.sellingPrice : (parseFloat(item.sellingPrice as any) || 0);
        const existingIdx = updatedCatalog.findIndex(s => s.name.toLowerCase() === item.name.toLowerCase());
        
        if (existingIdx !== -1) {
          updatedCatalog[existingIdx] = {
            ...updatedCatalog[existingIdx],
            costPrice: numericCost,
            priceRate: numericSelling,
            status: 'Active'
          };
        }
      });

      onUpdateServices(updatedCatalog);
    }

    // 6. Automatically record expenditure in Expenses tab (which decreases respective account balance)
    if (actualPaid > 0 && onAddExpense) {
      const supplierName = suppliers.find(s => s.id === receivingTx.supplierId)?.name || 'Supplier';
      onAddExpense({
        category: isOfficialUse ? 'Office Asset' : 'Purchase Order',
        title: `${isOfficialUse ? 'Office Asset Procurement' : 'Procurement Payment'} for PO #${receivingTx.id.replace('tx-', '')} (${supplierName})`,
        amount: actualPaid,
        paymentMethod: paymentAccount,
        paymentSplits: paymentAccount === 'Split' ? poPaymentSplits : undefined,
        date: todayBs,
        remarks: paymentAccount === 'Split'
          ? `Automatic expenditure logged from Receive PO (#${receivingTx.id}) via Split [Cash: Rs. ${poPaymentSplits.Cash}, eSewa: Rs. ${poPaymentSplits.Esewa}, RBB: Rs. ${poPaymentSplits.RBB}, Sahakari: Rs. ${poPaymentSplits.Sahakari}]`
          : `Automatic expenditure logged from Receive PO (#${receivingTx.id}) via ${paymentAccount}`,
        status: 'Approved',
        createdBy: currentUser.name || 'User',
        referenceId: receivingTx.id
      });
    }

    // Reset and close
    setReceivingTx(null);
  };

  // General statistics
  const summaryTotalSpent = transactions.filter(tx => tx.status !== 'Ordered').reduce((sum, tx) => sum + tx.amountPaid + tx.amountDue, 0);
  const summaryTotalPaid = transactions.filter(tx => tx.status !== 'Ordered').reduce((sum, tx) => sum + tx.amountPaid, 0);
  const summaryTotalDue = transactions.filter(tx => tx.status !== 'Ordered').reduce((sum, tx) => sum + tx.amountDue, 0);
  const totalPendingOrders = transactions.filter(tx => tx.status === 'Ordered').length;

  // Filter and sort transactions
  const filteredTransactions = transactions.filter(tx => {
    const supplier = suppliers.find(s => s.id === tx.supplierId);
    const itemNames = tx.items ? tx.items.map(it => it.name).join(' ') : '';
    const textSearch = (tx.itemsBought + ' ' + itemNames + ' ' + (supplier?.name || '') + ' ' + tx.remarks).toLowerCase();
    
    const matchesSearch = textSearch.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || tx.status === statusFilter;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-display">Procurement & Orders</h2>
          <p className="text-xs text-slate-500">Record multi-item purchase orders, receive orders into inventory, and track billing dues.</p>
        </div>
        {(currentUser.role === 'Admin' || currentUser.role === 'Stock Manager' || currentUser.role === 'User' || currentUser.role === 'Staff') && (
          <button 
            onClick={openAddForm}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition duration-200 shrink-0 cursor-pointer"
            id="btn-add-transaction"
            disabled={suppliers.length === 0}
          >
            <Plus size={16} />
            <span>New Purchase Order</span>
          </button>
        )}
      </div>

      {/* Admin & Stock Manager PO Approval Widget - Hidden (Shows in Staff Requests tab only) */}

      {(currentUser.role === 'User' || currentUser.role === 'Staff') && transactions.filter(tx => tx.status === 'Pending Approval').length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-indigo-600 mt-0.5 shrink-0 animate-pulse" />
          <div className="text-xs">
            <p className="font-bold text-slate-800">Pending Purchase Order Approvals ({transactions.filter(tx => tx.status === 'Pending Approval').length})</p>
            <p className="text-slate-500 mt-0.5">Your drafted purchase orders are currently awaiting Admin authorization. Once approved, you can print them and dispatch to vendors.</p>
          </div>
        </div>
      )}

      {suppliers.length === 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-xs text-amber-800">
          <AlertCircle size={18} className="text-amber-600 shrink-0" />
          <div>
            <p className="font-semibold">No suppliers listed yet!</p>
            <p className="mt-0.5">You must add at least one supplier in the &quot;Suppliers Registry&quot; tab before you can order inventory supplies.</p>
          </div>
        </div>
      )}

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Procurement</span>
          <p className="text-xl font-bold font-display mt-1 text-slate-100">Rs. {summaryTotalSpent.toLocaleString()}</p>
          <p className="text-[9px] text-slate-400 mt-1">Received items total value</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Cash Outflow</span>
          <p className="text-xl font-bold font-display mt-1 text-emerald-600">Rs. {summaryTotalPaid.toLocaleString()}</p>
          <p className="text-[9px] text-slate-500 mt-1">Settled payments to suppliers</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Ledger Dues Payable</span>
          <p className="text-xl font-bold font-display mt-1 text-rose-600">Rs. {summaryTotalDue.toLocaleString()}</p>
          <p className="text-[9px] text-slate-500 mt-1">Dues booked under suppliers</p>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-500 font-bold">Pending Orders</span>
          <p className="text-xl font-bold font-display mt-1 text-indigo-700">{totalPendingOrders} POs</p>
          <p className="text-[9px] text-indigo-600 mt-1">Awaiting delivery & receipt</p>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <InteractiveSearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search items, remarks, or vendors..."
            expandedWidth="w-full max-w-md"
          />
        </div>

        {/* Filter dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500 shrink-0 bg-white"
        >
          <option value="All">All Transactions & POs</option>
          <option value="Pending Approval">⏳ Staff Requests (Pending Approval)</option>
          <option value="Ordered">⏳ Pending Delivery (Ordered)</option>
          <option value="Paid">✅ Fully Received & Paid</option>
          <option value="Partially Paid">🟡 Partially Received/Paid</option>
          <option value="Pending">🔴 Received with Outstanding Due</option>
        </select>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-100 shadow-xs rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                <th className="px-6 py-4">Order Date</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Ordered items list</th>
                <th className="px-6 py-4 text-right">Total Cost</th>
                <th className="px-6 py-4 text-right">Cash Paid</th>
                <th className="px-6 py-4 text-right">Outstanding Dues</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 font-sans">
              {filteredTransactions.map(tx => {
                const supplier = suppliers.find(s => s.id === tx.supplierId);
                const itemCost = (tx.status === 'Ordered' || tx.status === 'Pending Approval' || tx.status === 'Approved' || tx.status === 'Rejected') 
                  ? 'Price TBD' 
                  : `Rs. ${(tx.amountPaid + tx.amountDue).toLocaleString()}`;
                
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                    {/* Date */}
                    <td className="px-6 py-4.5 font-mono whitespace-nowrap text-slate-500">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{tx.date}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 block font-mono">
                          {getFormattedPoNumber(tx, transactions)}
                        </span>
                      </div>
                    </td>

                    {/* Supplier */}
                    <td className="px-6 py-4.5 font-medium text-slate-900 whitespace-nowrap">
                      {supplier ? supplier.name : <span className="text-slate-400 italic">Deleted Vendor</span>}
                    </td>

                    {/* Items & Remarks */}
                    <td className="px-6 py-4.5 max-w-sm md:max-w-md">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {tx.purchaseType === 'Official Use' ? (
                            <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-700 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider border border-blue-100">
                              🏢 Official Asset
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 bg-indigo-50 text-indigo-700 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider border border-indigo-100">
                              💼 Commerce Stock
                            </span>
                          )}
                          {tx.items && tx.items.length > 0 ? (
                            tx.items.map((it, idx) => (
                              <span key={idx} className="inline-block bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-md font-medium">
                                {it.quantity}x {it.name} {it.received ? '✓' : '⏳'}
                              </span>
                            ))
                          ) : (
                            <span className="font-medium text-slate-800">{tx.itemsBought}</span>
                          )}
                        </div>
                        {tx.remarks && (
                          <p className="text-[10px] text-slate-400 italic font-mono truncate" title={tx.remarks}>
                            Ref: {tx.remarks}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Total Cost */}
                    <td className="px-6 py-4.5 text-right font-semibold text-slate-800 font-mono">
                      {itemCost}
                    </td>

                    {/* Amount Paid */}
                    <td className="px-6 py-4.5 text-right font-medium text-emerald-600 font-mono">
                      {(tx.status === 'Ordered' || tx.status === 'Pending Approval' || tx.status === 'Approved' || tx.status === 'Rejected') ? '—' : `Rs. ${tx.amountPaid.toLocaleString()}`}
                    </td>

                    {/* Amount Due */}
                    <td className="px-6 py-4.5 text-right font-medium font-mono">
                      {(tx.status === 'Ordered' || tx.status === 'Pending Approval' || tx.status === 'Approved' || tx.status === 'Rejected') ? (
                        <span className="text-slate-400 italic">Order Unreceived</span>
                      ) : (
                        <span className={`${tx.amountDue > 0 ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
                          Rs. {tx.amountDue.toLocaleString()}
                        </span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4.5 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        tx.status === 'Pending Approval' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                        tx.status === 'Approved' ? 'bg-indigo-100 text-indigo-800' :
                        tx.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                        tx.status === 'Ordered' ? 'bg-amber-50 text-amber-700' :
                        tx.status === 'Items Received' ? 'bg-emerald-100 text-emerald-800' :
                        tx.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' :
                        tx.status === 'Partially Paid' ? 'bg-blue-50 text-blue-700' :
                        'bg-rose-50 text-rose-700'
                      }`}>
                        {tx.status === 'Pending Approval' ? '⏳ Pending Approval' :
                         tx.status === 'Approved' ? '✅ Approved PO' :
                         tx.status === 'Rejected' ? '❌ Rejected' :
                         tx.status === 'Ordered' ? '📦 Ordered' : 
                         tx.status === 'Items Received' ? '📥 Items Received' :
                         tx.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {tx.status === 'Pending Approval' && currentUser.role === 'Admin' && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => onEditTransaction({ ...tx, status: 'Approved' })}
                              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
                              title="Approve Purchase Order"
                            >
                              <Check size={11} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => onEditTransaction({ ...tx, status: 'Rejected' })}
                              className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
                              title="Reject Purchase Order"
                            >
                              <X size={11} />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                        {(tx.status === 'Approved' || tx.status === 'Ordered' || tx.status === 'Paid' || tx.status === 'Partially Paid') && (
                          <button
                            onClick={() => {
                              const supplierObj = suppliers.find(s => s.id === tx.supplierId);
                              const lineItems = (tx.items && tx.items.length > 0)
                                ? tx.items.map((it, idx) => ({
                                    sn: idx + 1,
                                    name: it.name,
                                    quantity: it.quantity,
                                    unitType: it.unitType || 'pcs',
                                    unitPrice: it.costPrice || 0,
                                    totalPrice: (it.quantity || 1) * (it.costPrice || 0)
                                  }))
                                : [{
                                    sn: 1,
                                    name: tx.itemsBought || 'Supply Items Order',
                                    quantity: 1,
                                    unitType: 'batch',
                                    unitPrice: tx.amountPaid + tx.amountDue,
                                    totalPrice: tx.amountPaid + tx.amountDue
                                  }];

                              if (window.openUniversalPrintPreview) {
                                window.openUniversalPrintPreview({
                                  documentType: 'Purchase Order',
                                  documentNumber: getFormattedPoNumber(tx, transactions),
                                  documentDate: tx.date,
                                  status: tx.status,
                                  profile: profile,
                                  recipient: {
                                    name: supplierObj?.name || 'Authorized Supplier',
                                    address: supplierObj?.address || '',
                                    phone: supplierObj?.phone || '',
                                    email: supplierObj?.email || '',
                                    pan: supplierObj?.panNumber || ''
                                  },
                                  title: 'Official Purchase Order Statement',
                                  items: lineItems,
                                  subtotal: tx.amountPaid + tx.amountDue,
                                  grandTotal: tx.amountPaid + tx.amountDue,
                                  notes: tx.remarks || `Terms: Delivery & Invoice to ${profile.name}. Amount Paid: Rs. ${tx.amountPaid}. Due: Rs. ${tx.amountDue}.`,
                                  preparedBy: 'Procurement Dept',
                                  approvedBy: `${profile.name} Admin`
                                });
                              } else {
                                setPrintingPo(tx);
                                setTimeout(() => window.print(), 100);
                              }
                            }}
                            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition border border-slate-200/60 cursor-pointer"
                            title="Print Purchase Order"
                          >
                            <Printer size={12} />
                            <span>Print PO</span>
                          </button>
                        )}
                        {(tx.status === 'Ordered' || tx.status === 'Approved') && (
                          <button
                            onClick={() => handleOpenReceiveModal(tx)}
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
                            title={tx.purchaseType === 'Official Use' ? 'Receive Order & Register as Official Asset' : 'Receive Order & Enter Price into Inventory'}
                          >
                            <PackageCheck size={12} />
                            <span>Receive Order</span>
                          </button>
                        )}
                        {currentUser.role === 'Admin' && (
                          <button 
                            onClick={() => openEditForm(tx)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
                            title="Edit Order Details"
                          >
                            <Edit3 size={13} />
                          </button>
                        )}
                        {(currentUser.role === 'Stock Manager' || currentUser.role === 'User' || currentUser.role === 'Staff') && (
                          <button 
                            onClick={() => setRequestingEditTx(tx)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition cursor-pointer"
                            title="Request Edit from Admin"
                          >
                            <Edit3 size={13} className="text-amber-500" />
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            const isSystemMaster = currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin';
                            if (!isSystemMaster) {
                              if (onSendEditRequest) {
                                onSendEditRequest({
                                  id: `req-${Date.now()}`,
                                  type: 'Purchase Order Deletion',
                                  details: `Request to delete Purchase Order (${tx.date}) from supplier. Amount: Rs. ${tx.totalAmount}.`,
                                  targetTransactionId: tx.id,
                                  date: getCurrentBsDate(),
                                  status: 'Pending'
                                });
                                alert('Deletion request submitted. Direct deletion is allowed for System Master (@reliableadmin) only.');
                              } else {
                                alert('Direct deletion is allowed for System Master (@reliableadmin) only.');
                              }
                              return;
                            }
                            if (confirm(`Delete purchase record from ${tx.date}?`)) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer"
                          title={currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin' ? "Delete Purchase Record" : "Request Delete"}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="text-2xl">📑</p>
                    <p className="text-xs font-medium mt-2">No procurement transactions logged</p>
                    <p className="text-[10px] text-slate-400 mt-1">Try matching different query criteria or insert a fresh supply voucher.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Order Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <div>
                <h3 className="font-bold font-display text-slate-800 text-lg">
                  {editingTx ? 'Modify Purchase Order' : 'Place Purchase Order'}
                </h3>
                <p className="text-[11px] text-slate-500">Order multiple items from suppliers without inputting prices initially.</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Purchase Type Toggle/Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Purchase Category *</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPurchaseType('Commerce')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      purchaseType === 'Commerce'
                        ? 'bg-white text-indigo-600 shadow-xs border border-indigo-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <span>💼 Commerce (Inventory Stock)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPurchaseType('Official Use')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      purchaseType === 'Official Use'
                        ? 'bg-white text-indigo-600 shadow-xs border border-indigo-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <span>🏢 Official Use (Assets)</span>
                  </button>
                </div>
              </div>

              {/* Date and Supplier select */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Order Date *</label>
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

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Supplier *</label>
                  <select 
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="" disabled>Select supplier...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.address})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Items Builder */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-xl overflow-visible">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ShoppingCart size={15} className="text-indigo-600" />
                      <span>Purchase Order Items *</span>
                    </label>
                    <p className="text-[11px] font-semibold text-indigo-700 mt-0.5">
                      Select item from the list or type custom item name *
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddOrderItemRow}
                    className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer self-start sm:self-center"
                  >
                    <Plus size={14} />
                    <span>Add Item Line</span>
                  </button>
                </div>

                <div className="space-y-3 overflow-visible">
                  {orderItems.map((item, idx) => (
                    <div key={idx} className={`grid grid-cols-12 gap-2 items-end border border-slate-200/80 p-3 rounded-xl bg-white shadow-3xs relative group ${activeItemDropdownIdx === idx ? 'z-40' : 'z-10'}`}>
                      <div className="col-span-12 sm:col-span-6 space-y-1 relative">
                        <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Item Name / Search List *</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            autoComplete="off"
                            placeholder="Type to search inventory or enter custom name..."
                            value={
                              itemQueries[idx] !== undefined 
                                ? itemQueries[idx] 
                                : (item.name || '')
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              setItemQueries(prev => ({ ...prev, [idx]: val }));
                              setActiveItemDropdownIdx(idx);
                              handleOrderItemChange(idx, 'name', val);
                            }}
                            onFocus={() => {
                              setActiveItemDropdownIdx(idx);
                              setItemQueries(prev => ({ ...prev, [idx]: item.name || '' }));
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setActiveItemDropdownIdx(null);
                              }, 250);
                            }}
                            className="w-full border border-slate-200 rounded-lg p-2 pr-8 text-xs bg-white text-slate-800 focus:outline-hidden focus:border-indigo-500 font-medium shadow-2xs"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none text-slate-400">
                            🔍
                          </span>
                        </div>

                        {/* Search Suggestions Popup */}
                        {activeItemDropdownIdx === idx && (() => {
                          const query = (itemQueries[idx] !== undefined ? itemQueries[idx] : '').toLowerCase().trim();
                          const filteredInventory = inventoryStock.filter(i => 
                            i.name.toLowerCase().includes(query)
                          );
                          const filteredServices = (services || []).filter(s => 
                            s.name.toLowerCase().includes(query) || 
                            (s.category && s.category.toLowerCase().includes(query))
                          );
                          
                          return (
                            <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl divide-y divide-slate-100">
                              {filteredInventory.map(i => (
                                <div
                                  key={i.id}
                                  onMouseDown={() => {
                                    handleOrderItemChange(idx, 'name', i.name);
                                    if (i.unitType) {
                                      handleOrderItemChange(idx, 'unitType', i.unitType);
                                    }
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

                              {filteredServices.map(s => (
                                <div
                                  key={s.id}
                                  onMouseDown={() => {
                                    handleOrderItemChange(idx, 'name', s.name);
                                    if (s.rateType) {
                                      handleOrderItemChange(idx, 'unitType', s.rateType);
                                    }
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
                              
                              <div
                                onMouseDown={() => {
                                  const customVal = query || 'Custom PO Item';
                                  handleOrderItemChange(idx, 'name', customVal);
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
                                <span>Use "{query || 'Custom Item'}" as Custom PO Item</span>
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
                          placeholder="Qty"
                          value={item.quantity || ''}
                          onChange={(e) => handleOrderItemChange(idx, 'quantity', e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-1.5 text-xs bg-white text-center font-mono focus:outline-hidden focus:border-indigo-500 font-medium"
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-3 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Unit</label>
                        <select
                          value={item.unitType || 'pcs'}
                          onChange={(e) => handleOrderItemChange(idx, 'unitType', e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-1.5 text-xs bg-white focus:outline-hidden font-medium"
                        >
                          {(units && units.length > 0 ? units : ['pcs', 'kg', 'ltr', 'box', 'packet', 'Flat', 'Hourly', 'Monthly', 'Per Unit']).map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                          {item.unitType && !(units || []).includes(item.unitType) && (
                            <option value={item.unitType}>{item.unitType}</option>
                          )}
                        </select>
                      </div>

                      <div className="col-span-2 sm:col-span-1 flex justify-end pb-1">
                        <button
                          type="button"
                          onClick={() => handleRemoveOrderItemRow(idx)}
                          disabled={orderItems.length <= 1}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                          title="Remove Line Item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reference remarks */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Internal Reference / Remarks</label>
                <input 
                  type="text"
                  placeholder="e.g. Emergency store replenishment, stock booking"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Actions panel */}
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
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Check size={14} />
                  <span>{editingTx ? 'Update PO' : 'Save & Place PO'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Receive Order & Enter Inventory Pricing / Assets Modal */}
      {receivingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <div>
                <h3 className="font-bold font-display text-slate-800 text-lg flex items-center gap-1.5">
                  <PackageCheck className="text-emerald-600" size={20} />
                  <span>
                    {receivingTx.purchaseType === 'Official Use' 
                      ? 'Receive Order & Register Office Asset' 
                      : 'Receive Order & Price Inventory'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  {receivingTx.purchaseType === 'Official Use'
                    ? 'Specify buying cost & asset classification to add items to Assets and record expenses.'
                    : 'Provide Cost Price & Selling Price to sync items directly into your sales inventory catalog.'}
                </p>
              </div>
              <button 
                onClick={() => setReceivingTx(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmReceipt} className="p-6 space-y-4">
              
              <div className={`p-4 border rounded-xl text-xs space-y-1 ${
                receivingTx.purchaseType === 'Official Use' 
                  ? 'border-blue-200 bg-blue-50/60' 
                  : 'border-indigo-100 bg-indigo-50/40'
              }`}>
                <div className="flex justify-between items-center">
                  <p className="font-bold text-slate-800">Supplier: {suppliers.find(s => s.id === receivingTx.supplierId)?.name || 'Unknown'}</p>
                  {receivingTx.purchaseType === 'Official Use' ? (
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                      🏢 Office Use Asset
                    </span>
                  ) : (
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                      💼 Commercial Stock
                    </span>
                  )}
                </div>
                <p className="text-slate-600 font-mono">Date Ordered: {receivingTx.date}</p>
              </div>

              {/* Items pricing / asset classification lines */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-800">
                  {receivingTx.purchaseType === 'Official Use' ? 'Register Asset Details:' : 'Set Catalog Prices:'}
                </p>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {receivedItems.map((item, idx) => (
                    <div key={idx} className="p-3 border border-slate-150 rounded-xl bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{item.quantity} {item.unitType || 'pcs'} of {item.name}</span>
                        <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase">Pricing TBD</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block uppercase">Cost Price (Rs.) *</label>
                          <input 
                            type="number"
                            step="any"
                            min="0"
                            required
                            placeholder="Our buying cost rate"
                            value={item.costPrice !== undefined ? item.costPrice : ''}
                            onChange={(e) => handleReceiveItemPriceChange(idx, 'costPrice', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white font-semibold font-mono text-rose-600 focus:outline-hidden"
                          />
                        </div>
                        {receivingTx.purchaseType === 'Official Use' ? (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 block uppercase">Asset Type *</label>
                            <select
                              value={item.assetType || 'Durable'}
                              onChange={(e) => handleReceiveItemPriceChange(idx, 'assetType', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white font-semibold text-slate-800 focus:outline-hidden"
                            >
                              <option value="Durable">Durable (Equipment/Furniture)</option>
                              <option value="Non-Durable">Non-Durable (Consumable/Stationery)</option>
                            </select>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 block uppercase">Retail Selling Price (Rs.) *</label>
                            <input 
                              type="number"
                              step="any"
                              min="0"
                              required
                              placeholder="Our retail rate"
                              value={item.sellingPrice !== undefined ? item.sellingPrice : ''}
                              onChange={(e) => handleReceiveItemPriceChange(idx, 'sellingPrice', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white font-semibold font-mono text-emerald-600 focus:outline-hidden"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Ledger Section */}
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Coins size={14} className="text-emerald-600" />
                    <span>Ledger Invoice Accounting</span>
                  </p>
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 cursor-pointer hover:bg-rose-100 transition">
                    <input 
                      type="checkbox"
                      checked={addAllToDue}
                      onChange={(e) => {
                        setAddAllToDue(e.target.checked);
                        if (e.target.checked) setAmountPaid(0);
                      }}
                      className="rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span>Add all to due / Completely Unpaid</span>
                  </label>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Computed Bill</span>
                    <p className="text-sm font-bold font-mono text-slate-800 pt-1">
                      Rs. {receivedItems.reduce((acc, it) => acc + (it.quantity * (typeof it.costPrice === 'number' ? it.costPrice : (parseFloat(it.costPrice as any) || 0))), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">Payment Account *</label>
                    <select
                      disabled={addAllToDue}
                      value={addAllToDue ? 'Due' : paymentAccount}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setPaymentAccount(val);
                        if (val === 'Split') {
                          const num = typeof amountPaid === 'number' ? amountPaid : (parseFloat(amountPaid as any) || 0);
                          setPoPaymentSplits({
                            Cash: num,
                            Esewa: 0,
                            RBB: 0,
                            Sahakari: 0
                          });
                        }
                      }}
                      className={`w-full border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-hidden focus:border-indigo-500 ${addAllToDue ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-800'}`}
                    >
                      <option value="Cash">Cash Account</option>
                      <option value="RBB">RBB Bank</option>
                      <option value="Esewa">eSewa Wallet</option>
                      <option value="Sahakari">Sahakari</option>
                      <option value="Split">Split Payment (बहु-खाता भुक्तानी)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">Amount Paid (Rs.) *</label>
                    <input 
                      type="number"
                      step="any"
                      min="0"
                      disabled={addAllToDue}
                      required={!addAllToDue}
                      placeholder="0"
                      value={addAllToDue ? 0 : (amountPaid !== undefined ? amountPaid : '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAmountPaid(val);
                        if (paymentAccount === 'Split') {
                          const num = parseFloat(val) || 0;
                          setPoPaymentSplits(prev => ({
                            ...prev,
                            Cash: num - (prev.Esewa + prev.RBB + prev.Sahakari) >= 0 ? num - (prev.Esewa + prev.RBB + prev.Sahakari) : 0
                          }));
                        }
                      }}
                      className={`w-full border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold font-mono focus:outline-hidden focus:border-indigo-500 ${addAllToDue ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-emerald-600'}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Computed Due</span>
                    <p className="text-sm font-bold font-mono text-rose-600 pt-1">
                      Rs. {(addAllToDue 
                        ? receivedItems.reduce((acc, it) => acc + (it.quantity * (typeof it.costPrice === 'number' ? it.costPrice : (parseFloat(it.costPrice as any) || 0))), 0)
                        : Math.max(0, receivedItems.reduce((acc, it) => acc + (it.quantity * (typeof it.costPrice === 'number' ? it.costPrice : (parseFloat(it.costPrice as any) || 0))), 0) - (typeof amountPaid === 'number' ? amountPaid : (parseFloat(amountPaid as any) || 0)))
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Split Payment Allocation Box for Purchase Order */}
                {paymentAccount === 'Split' && !addAllToDue && (
                  <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 font-mono uppercase">
                        <span>Split Payment Breakdown (रकम विभाजन)</span>
                      </span>
                      <span className={`text-[11px] font-mono font-bold ${
                        Math.abs(
                          ((poPaymentSplits.Cash || 0) + (poPaymentSplits.Esewa || 0) + (poPaymentSplits.RBB || 0) + (poPaymentSplits.Sahakari || 0)) -
                          (typeof amountPaid === 'number' ? amountPaid : (parseFloat(amountPaid as any) || 0))
                        ) < 0.01
                          ? 'text-emerald-700'
                          : 'text-rose-600'
                      }`}>
                        Allocated: Rs. {((poPaymentSplits.Cash || 0) + (poPaymentSplits.Esewa || 0) + (poPaymentSplits.RBB || 0) + (poPaymentSplits.Sahakari || 0)).toLocaleString()} / Rs. {(typeof amountPaid === 'number' ? amountPaid : (parseFloat(amountPaid as any) || 0)).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">Cash (नगद)</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={poPaymentSplits.Cash || ''}
                          onChange={(e) => setPoPaymentSplits({ ...poPaymentSplits, Cash: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">eSewa (ई-सेवा)</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={poPaymentSplits.Esewa || ''}
                          onChange={(e) => setPoPaymentSplits({ ...poPaymentSplits, Esewa: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-emerald-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">RBB Bank (आरबीबी)</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={poPaymentSplits.RBB || ''}
                          onChange={(e) => setPoPaymentSplits({ ...poPaymentSplits, RBB: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-blue-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">Sahakari (सहकारी)</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={poPaymentSplits.Sahakari || ''}
                          onChange={(e) => setPoPaymentSplits({ ...poPaymentSplits, Sahakari: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-indigo-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions panel */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">
                  {receivingTx.purchaseType === 'Official Use'
                    ? 'Receiving registers assets and logs payment expenditure.'
                    : 'Receiving updates inventory stock and logs payment expenditure.'}
                </span>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setReceivingTx(null)}
                    className="px-4 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Check size={14} />
                    <span>
                      {receivingTx.purchaseType === 'Official Use' ? 'Receive & Add to Assets' : 'Receive & Enter to Inventory'}
                    </span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Print PO Modal */}
      {printingPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-scale-in print:border-none print:shadow-none print:rounded-none">
            {/* Control Header - Hidden in Print mode */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between print:hidden">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Printer className="text-indigo-600" size={16} />
                  <span>Authorized Purchase Order Print Layout</span>
                </h3>
                <p className="text-[11px] text-slate-500">View or dispatch official item requests to your supply vendors.</p>
              </div>
              <button 
                onClick={() => setPrintingPo(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Document Body */}
            <div className="p-4 bg-white" id="po-print-area">
              <CorporateLetterhead
                profile={profile}
                documentType="Purchase Order"
                documentNumber={getFormattedPoNumber(printingPo, transactions)}
                documentDate={printingPo.date}
              >
                <div className="space-y-6 py-2">
                  {/* Vendor & Delivery info */}
                  <div className="grid grid-cols-2 gap-6 text-xs bg-slate-50 p-4 rounded-xl border border-slate-150 print:bg-transparent print:border-none print:p-0">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Vendor Information:</p>
                      <p className="font-bold text-slate-800 text-sm">
                        {suppliers.find(s => s.id === printingPo.supplierId)?.name || 'Unknown supplier'}
                      </p>
                      <p className="text-slate-600">{suppliers.find(s => s.id === printingPo.supplierId)?.address || 'Address: N/A'}</p>
                      <p className="text-slate-600">Ph: {suppliers.find(s => s.id === printingPo.supplierId)?.phone || 'N/A'}</p>
                      <p className="text-slate-600">Email: {suppliers.find(s => s.id === printingPo.supplierId)?.email || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Deliver & Bill To:</p>
                      <p className="font-bold text-slate-800 text-sm">{profile.name}</p>
                      <p className="text-slate-600">{profile.location}</p>
                      <p className="text-slate-600">Phone: {profile.phone}</p>
                      <p className="text-slate-600">Contact: Procurement Dept.</p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">Requested Supply Items:</p>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-300 bg-slate-100 print:bg-transparent">
                          <th className="py-2.5 px-3 font-semibold text-slate-600 w-12 text-center">S.N.</th>
                          <th className="py-2.5 px-3 font-semibold text-slate-600">Item Description</th>
                          <th className="py-2.5 px-3 font-semibold text-slate-600 text-center w-28">Quantity</th>
                          <th className="py-2.5 px-3 font-semibold text-slate-600 text-center w-36">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {printingPo.items && printingPo.items.length > 0 ? (
                          printingPo.items.map((it, idx) => (
                            <tr key={idx}>
                              <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-800">{it.name}</td>
                              <td className="py-2.5 px-3 text-center font-bold font-mono">{it.quantity} {it.unitType || 'pcs'}</td>
                              <td className="py-2.5 px-3 text-center text-slate-400 italic text-[11px]">{it.received ? 'Delivered' : 'Awaiting receipt'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="py-2.5 px-3 text-center text-slate-500 font-mono">1</td>
                            <td className="py-2.5 px-3 font-bold text-slate-800">{printingPo.itemsBought}</td>
                            <td className="py-2.5 px-3 text-center font-bold font-mono">1 batch</td>
                            <td className="py-2.5 px-3 text-center text-slate-400 italic text-[11px]">Awaiting receipt</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Remarks / Footer */}
                  <div className="pt-4 border-t border-slate-150 text-[11px] text-slate-500 space-y-2">
                    <p className="font-bold text-slate-700">Terms & Instructions:</p>
                    <p>1. Please reference the Purchase Order Number above on all delivery notes and packaging.</p>
                    <p>2. Send all invoices to {profile.email} once delivery is made.</p>
                    {printingPo.remarks && (
                      <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 text-slate-600 italic font-sans print:p-0 print:border-none">
                        <strong>Specific Requirements:</strong> {printingPo.remarks}
                      </p>
                    )}
                  </div>

                  {/* Signature section */}
                  <div className="pt-8 flex justify-between items-end">
                    <div className="text-center w-40">
                      <div className="border-b border-slate-400 h-8"></div>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Vendor Seal / Signature</p>
                    </div>
                    <div className="text-center w-48">
                      <p className="text-[11px] font-bold text-slate-800 uppercase italic font-mono mb-1">Approved & Signed</p>
                      <div className="border-b border-slate-900 h-8 font-mono text-[10px] text-indigo-600 font-extrabold flex items-center justify-center">{profile.name} Admin</div>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">Authorized Representative</p>
                    </div>
                  </div>
                </div>
              </CorporateLetterhead>
            </div>

            {/* Print trigger panel - Hidden in Print mode */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex items-center justify-between print:hidden">
              <span className="text-[10px] text-slate-400">Ready for vendor dispatch.</span>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setPrintingPo(null)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer"
                >
                  Close Preview
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    const supplierObj = suppliers.find(s => s.id === printingPo.supplierId);
                    const lineItems = (printingPo.items && printingPo.items.length > 0)
                      ? printingPo.items.map((it, idx) => ({
                          sn: idx + 1,
                          name: it.name,
                          quantity: it.quantity,
                          unitType: it.unitType || 'pcs',
                          unitPrice: it.costPrice || 0,
                          totalPrice: (it.quantity || 1) * (it.costPrice || 0)
                        }))
                      : [{
                          sn: 1,
                          name: printingPo.itemsBought || 'Supply Items Order',
                          quantity: 1,
                          unitType: 'batch',
                          unitPrice: printingPo.amountPaid + printingPo.amountDue,
                          totalPrice: printingPo.amountPaid + printingPo.amountDue
                        }];

                    if (window.openUniversalPrintPreview) {
                      window.openUniversalPrintPreview({
                        documentType: 'Purchase Order',
                        documentNumber: getFormattedPoNumber(printingPo, transactions),
                        documentDate: printingPo.date,
                        status: printingPo.status,
                        profile: profile,
                        recipient: {
                          name: supplierObj?.name || 'Authorized Supplier',
                          address: supplierObj?.address || '',
                          phone: supplierObj?.phone || '',
                          email: supplierObj?.email || '',
                          pan: supplierObj?.panNumber || ''
                        },
                        title: 'Official Purchase Order Statement',
                        items: lineItems,
                        subtotal: printingPo.amountPaid + printingPo.amountDue,
                        grandTotal: printingPo.amountPaid + printingPo.amountDue,
                        notes: printingPo.remarks || `Terms: Delivery & Invoice to ${profile.name}. Amount Paid: Rs. ${printingPo.amountPaid}. Due: Rs. ${printingPo.amountDue}.`,
                        preparedBy: 'Procurement Dept',
                        approvedBy: `${profile.name} Admin`
                      });
                    } else {
                      window.print();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Print Document</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Request PO Edit Modal for Stock Manager */}
      {requestingEditTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-scale-in">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <div>
                <h3 className="font-bold font-display text-slate-800 text-base">Request Purchase Order Modification</h3>
                <p className="text-[10px] text-slate-500">Proposed edits will be sent directly to the Admin Queue for review.</p>
              </div>
              <button 
                onClick={() => setRequestingEditTx(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRequestPoEdit} className="p-6 space-y-4">
              <div className="bg-amber-50 text-amber-900 border border-amber-200 p-3.5 rounded-xl text-xs space-y-1">
                <p className="font-bold">🏷️ Target PO #{requestingEditTx.id.replace('tx-', '')}</p>
                <p className="text-[10px] text-amber-800/90">Stock Managers can suggest updates to item lists, quantities, or suppliers, but direct override rights are restricted to the main system administrator.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block uppercase font-mono">Proposed Modifications & Justification *</label>
                <textarea
                  required
                  rows={4}
                  value={editRequestMsg}
                  onChange={(e) => setEditRequestMsg(e.target.value)}
                  placeholder="e.g. Please change the order quantity of Hammer Drill from 10 to 15, and update the supplier to Dynamic Traders..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-white focus:outline-hidden focus:border-indigo-500 font-sans"
                />
              </div>

              {editRequestSuccess && (
                <div className="text-xs text-emerald-600 font-bold bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-center animate-pulse">
                  ✓ Edit Request sent successfully to Admin!
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setRequestingEditTx(null)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={editRequestSuccess}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer disabled:bg-indigo-400"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
