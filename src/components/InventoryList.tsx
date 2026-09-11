import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Check, 
  X, 
  Package, 
  Calendar, 
  AlertCircle, 
  Coins, 
  ShieldCheck, 
  Tag, 
  TrendingUp,
  FileText,
  BadgeAlert,
  ArrowUpRight,
  PackageCheck,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  FileSpreadsheet,
  Edit
} from 'lucide-react';
import { InventoryItem, InventoryRequest, OfficeUseRequest, SupplyTransaction, Supplier, BusinessService, AppUser } from '../types';
import { getCurrentBsDate, getNepaleseFiscalYear } from '../utils/nepaliDate';
import { InteractiveSearchBar } from './InteractiveSearchBar';

interface InventoryListProps {
  inventoryStock: InventoryItem[];
  inventoryRequests: InventoryRequest[];
  officeUseRequests?: OfficeUseRequest[];
  transactions: SupplyTransaction[];
  suppliers: Supplier[];
  onUpdateSuppliers?: (suppliers: Supplier[]) => void;
  currentUser: AppUser;
  onAddInventoryRequest: (req: Omit<InventoryRequest, 'id' | 'status'>) => void;
  onApproveInventoryRequest: (id: string) => void;
  onDeclineInventoryRequest: (id: string) => void;
  onAddOfficeUseRequest?: (req: Omit<OfficeUseRequest, 'id' | 'status'>) => void;
  onApproveOfficeUseRequest?: (id: string) => void;
  onRejectOfficeUseRequest?: (id: string) => void;
  onDeleteStockItem: (id: string) => void;
  onUpdateInventoryStock: (stock: InventoryItem[]) => void;
  units?: string[];
}

export const InventoryList: React.FC<InventoryListProps> = ({
  inventoryStock,
  inventoryRequests,
  officeUseRequests = [],
  transactions,
  suppliers,
  onUpdateSuppliers,
  currentUser,
  onAddInventoryRequest,
  onApproveInventoryRequest,
  onDeclineInventoryRequest,
  onAddOfficeUseRequest,
  onApproveOfficeUseRequest,
  onRejectOfficeUseRequest,
  onDeleteStockItem,
  onUpdateInventoryStock,
  units
}) => {
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Add Inventory Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [invAmountPaid, setInvAmountPaid] = useState<number | string>(0);
  const [invAddAllToDue, setInvAddAllToDue] = useState<boolean>(false);
  const [itemsToReceive, setItemsToReceive] = useState<{
    name: string;
    quantity: number;
    costPrice: number | string;
    sellingPrice: number | string;
    notReceived?: boolean;
  }[]>([]);

  // Excel CSV Import States
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvParsedItems, setCsvParsedItems] = useState<{
    name: string;
    quantity: number;
    costPrice: number;
    sellingPrice: number;
    unitType: string;
    supplierName: string;
    supplierId: string;
    isValid: boolean;
  }[]>([]);
  const [csvMergeStrategy, setCsvMergeStrategy] = useState<'merge' | 'overwrite' | 'replace'>('merge');
  const [csvImportError, setCsvImportError] = useState('');

  // Edit Inventory Item States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState<number | string>(0);
  const [editCostPrice, setEditCostPrice] = useState<number | string>(0);
  const [editSellingPrice, setEditSellingPrice] = useState<number | string>(0);
  const [editUnitType, setEditUnitType] = useState('');
  const [editSupplierId, setEditSupplierId] = useState('');

  // Office Use Requisition Modal States
  const [isOfficeUseModalOpen, setIsOfficeUseModalOpen] = useState(false);
  const [officeUseDate, setOfficeUseDate] = useState(getCurrentBsDate());
  const [officeUseItemId, setOfficeUseItemId] = useState('');
  const [officeUseQuantity, setOfficeUseQuantity] = useState<number>(1);
  const [officeUseRemarks, setOfficeUseRemarks] = useState('');

  const handleOfficeUseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officeUseItemId) {
      alert("Please select an item from the stock catalog.");
      return;
    }
    const item = inventoryStock.find(i => i.id === officeUseItemId);
    if (!item) return;

    if (officeUseQuantity <= 0) {
      alert("Please enter a valid positive quantity.");
      return;
    }

    if (onAddOfficeUseRequest) {
      onAddOfficeUseRequest({
        requestNo: `REQ-OFF-${Math.floor(1000 + Math.random() * 9000)}`,
        date: officeUseDate || getCurrentBsDate(),
        itemId: item.id,
        itemName: item.name,
        quantity: officeUseQuantity,
        requestedBy: currentUser.name || 'Staff',
        department: 'Office Use',
        remarks: officeUseRemarks
      });
      setIsOfficeUseModalOpen(false);
      setOfficeUseItemId('');
      setOfficeUseQuantity(1);
      setOfficeUseRemarks('');
      alert(`Office use requisition for ${officeUseQuantity}x ${item.name} submitted for Admin approval.`);
    }
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditQuantity(item.quantity);
    setEditCostPrice(item.costPrice);
    setEditSellingPrice(item.sellingPrice);
    setEditUnitType(item.unitType || '');
    setEditSupplierId(item.supplierId || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const updatedItem: InventoryItem = {
      ...editingItem,
      name: editName.trim(),
      quantity: Number(editQuantity),
      costPrice: Number(editCostPrice),
      sellingPrice: Number(editSellingPrice),
      unitType: editUnitType.trim(),
      supplierId: editSupplierId,
      openingStockForFY: {
        ...(editingItem.openingStockForFY || {}),
        [getNepaleseFiscalYear(getCurrentBsDate())]: Number(editQuantity)
      }
    };

    const updatedStock = inventoryStock.map(it => it.id === editingItem.id ? updatedItem : it);
    onUpdateInventoryStock(updatedStock);
    setIsEditModalOpen(false);
    setEditingItem(null);
    alert('Inventory stock item corrected successfully!');
  };

  // CSV Row splitting regex-respecting helper
  const parseCsvRow = (row: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result.map(col => col.replace(/^"(.*)"$/, '$1').trim());
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvImportError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setCsvImportError('Could not read file or file is empty.');
        return;
      }

      try {
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) {
          setCsvImportError('CSV file must contain a header and at least one data row.');
          return;
        }

        const headersLine = lines[0];
        const headers = parseCsvRow(headersLine).map(h => h.trim().toLowerCase());

        // Locate indices
        const nameIdx = headers.findIndex(h => h.includes('item') || h.includes('name') || h.includes('desc') || h.includes('title') || h.includes('product'));
        const quantityIdx = headers.findIndex(h => h.includes('qty') || h.includes('quantity') || h.includes('stock') || h.includes('volume') || h.includes('count') || h.includes('piece') || h.includes('units'));
        const costIdx = headers.findIndex(h => h.includes('cost') || h.includes('buy') || h.includes('purchase') || h.includes('rate') || h.includes('costprice'));
        const sellingIdx = headers.findIndex(h => h.includes('sell') || h.includes('retail') || h.includes('sale') || h.includes('mrp') || h.includes('sellingprice') || (h.includes('price') && !h.includes('cost') && !h.includes('buy') && !h.includes('purchase')));
        const unitIdx = headers.findIndex(h => h.includes('unit') || h.includes('pack') || h.includes('type') || h.includes('unittype'));
        const supplierIdx = headers.findIndex(h => h.includes('supplier') || h.includes('vendor') || h.includes('suppliername'));

        if (nameIdx === -1) {
          setCsvImportError('Could not identify "Item Name" column. Your CSV header must contain "Item Name", "Name", "Product" or "Description".');
          return;
        }

        const parsedItems: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const cols = parseCsvRow(line);
          if (cols.length === 0) continue;

          const name = cols[nameIdx]?.trim() || '';
          if (!name) continue;

          const quantityStr = quantityIdx !== -1 ? cols[quantityIdx]?.trim() : '0';
          const quantity = Math.max(0, parseFloat(quantityStr) || 0);

          const costPriceStr = costIdx !== -1 ? cols[costIdx]?.trim() : '0';
          const costPrice = Math.max(0, parseFloat(costPriceStr) || 0);

          const sellingPriceStr = sellingIdx !== -1 ? cols[sellingIdx]?.trim() : '0';
          const sellingPrice = Math.max(0, parseFloat(sellingPriceStr) || 0);

          const unitType = unitIdx !== -1 ? cols[unitIdx]?.trim() || 'pcs' : 'pcs';
          
          const parsedSupplier = supplierIdx !== -1 ? cols[supplierIdx]?.trim() || '' : '';
          
          let supplierId = '';
          if (parsedSupplier) {
            const matchedSupplier = suppliers.find(s => s.name.toLowerCase() === parsedSupplier.toLowerCase() || s.id === parsedSupplier);
            if (matchedSupplier) {
              supplierId = matchedSupplier.id;
            }
          }

          parsedItems.push({
            name,
            quantity,
            costPrice,
            sellingPrice,
            unitType,
            supplierName: parsedSupplier,
            supplierId,
            isValid: true
          });
        }

        if (parsedItems.length === 0) {
          setCsvImportError('No valid items found in the CSV. Make sure data rows are populated.');
          return;
        }

        setCsvParsedItems(parsedItems);
      } catch (err: any) {
        console.error("Error parsing CSV:", err);
        setCsvImportError(`Error parsing CSV file: ${err.message || 'unknown error'}`);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (csvParsedItems.length === 0) return;

    let updatedStock = [...inventoryStock];
    const today = getCurrentBsDate();

    if (csvMergeStrategy === 'replace') {
      updatedStock = csvParsedItems.map((item, index) => ({
        id: `imported-${Date.now().toString(36)}-${index}-${Math.random().toString(36).substring(2, 5)}`,
        name: item.name,
        quantity: item.quantity,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        unitType: item.unitType,
        supplierId: item.supplierId || '',
        lastReceivedDate: today
      }));
    } else if (csvMergeStrategy === 'overwrite') {
      csvParsedItems.forEach((item, index) => {
        const existingIdx = updatedStock.findIndex(it => it.name.toLowerCase() === item.name.toLowerCase());
        if (existingIdx !== -1) {
          updatedStock[existingIdx] = {
            ...updatedStock[existingIdx],
            quantity: item.quantity,
            costPrice: item.costPrice > 0 ? item.costPrice : updatedStock[existingIdx].costPrice,
            sellingPrice: item.sellingPrice > 0 ? item.sellingPrice : updatedStock[existingIdx].sellingPrice,
            unitType: item.unitType || updatedStock[existingIdx].unitType,
            supplierId: item.supplierId || updatedStock[existingIdx].supplierId,
            lastReceivedDate: today
          };
        } else {
          updatedStock.push({
            id: `imported-${Date.now().toString(36)}-${index}-${Math.random().toString(36).substring(2, 5)}`,
            name: item.name,
            quantity: item.quantity,
            costPrice: item.costPrice,
            sellingPrice: item.sellingPrice,
            unitType: item.unitType,
            supplierId: item.supplierId || '',
            lastReceivedDate: today
          });
        }
      });
    } else {
      csvParsedItems.forEach((item, index) => {
        const existingIdx = updatedStock.findIndex(it => it.name.toLowerCase() === item.name.toLowerCase());
        if (existingIdx !== -1) {
          updatedStock[existingIdx] = {
            ...updatedStock[existingIdx],
            quantity: updatedStock[existingIdx].quantity + item.quantity,
            costPrice: item.costPrice > 0 ? item.costPrice : updatedStock[existingIdx].costPrice,
            sellingPrice: item.sellingPrice > 0 ? item.sellingPrice : updatedStock[existingIdx].sellingPrice,
            unitType: item.unitType || updatedStock[existingIdx].unitType,
            supplierId: item.supplierId || updatedStock[existingIdx].supplierId,
            lastReceivedDate: today
          };
        } else {
          updatedStock.push({
            id: `imported-${Date.now().toString(36)}-${index}-${Math.random().toString(36).substring(2, 5)}`,
            name: item.name,
            quantity: item.quantity,
            costPrice: item.costPrice,
            sellingPrice: item.sellingPrice,
            unitType: item.unitType,
            supplierId: item.supplierId || '',
            lastReceivedDate: today
          });
        }
      });
    }

    onUpdateInventoryStock(updatedStock);
    setIsCsvModalOpen(false);
    setCsvParsedItems([]);
    setCsvImportError('');
    alert(`Successfully imported ${csvParsedItems.length} items to the catalog!`);
  };

  const downloadTemplate = () => {
    const headers = "Item Name,Quantity,Cost Price,Selling Price,Unit Type,Supplier Name\n";
    const exampleRow = "Wire roll 1.5mm,50,1200,1500,roll,Cable Supplier Ltd\n";
    const exampleRow2 = "Switch Socket 15A,100,250,350,pcs,Reliable Suppliers\n";
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + exampleRow + exampleRow2);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "inventory_import_template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Find approved POs available for reception (status is 'Approved' or 'Ordered', purchaseType is 'Commerce')
  const availablePOs = transactions.filter(tx => 
    (tx.status === 'Approved' || tx.status === 'Ordered') && 
    (tx.purchaseType !== 'Official Use')
  );

  // Load items when a Purchase Order is selected in modal
  const handlePoChange = (poId: string) => {
    setSelectedPoId(poId);
    const po = transactions.find(t => t.id === poId);
    if (po) {
      // Find all previously approved inventory requests for this PO to subtract already received quantities
      const pastApprovedRequests = inventoryRequests.filter(r => r.purchaseOrderId === poId && r.status === 'Approved');
      const receivedQtyMap: Record<string, number> = {};
      
      pastApprovedRequests.forEach(req => {
        req.items.forEach(it => {
          if (!it.notReceived) {
            receivedQtyMap[it.name] = (receivedQtyMap[it.name] || 0) + it.quantity;
          }
        });
      });

      const initialItems = (po.items || [])
        .map(it => {
          const receivedQty = receivedQtyMap[it.name] || 0;
          const remainingQty = it.quantity - receivedQty;
          return {
            name: it.name,
            quantity: remainingQty,
            costPrice: it.costPrice || 0,
            sellingPrice: it.sellingPrice || 0,
            notReceived: false
          };
        })
        .filter(it => it.quantity > 0); // Only show items with positive quantity left to receive

      // Fallback to legacy string field parsing if itemized is empty
      if (initialItems.length === 0 && po.itemsBought) {
        initialItems.push({
          name: po.itemsBought,
          quantity: 1,
          costPrice: 0,
          sellingPrice: 0,
          notReceived: false
        });
      }
      setItemsToReceive(initialItems);
    } else {
      setItemsToReceive([]);
    }
  };

  const handlePriceChange = (idx: number, field: 'costPrice' | 'sellingPrice', val: string | number) => {
    const updated = [...itemsToReceive];
    updated[idx][field] = val;
    setItemsToReceive(updated);
  };

  const handleToggleNotReceived = (idx: number) => {
    const updated = [...itemsToReceive];
    updated[idx].notReceived = !updated[idx].notReceived;
    setItemsToReceive(updated);
  };

  // Submit Inventory Receive Request
  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoId) return;

    const selectedPo = transactions.find(t => t.id === selectedPoId);
    if (!selectedPo) return;

    // Validate that prices are positive for received items
    const invalidPrices = itemsToReceive.some(it => {
      if (it.notReceived) return false;
      const c = typeof it.costPrice === 'number' ? it.costPrice : (parseFloat(it.costPrice as any) || 0);
      const s = typeof it.sellingPrice === 'number' ? it.sellingPrice : (parseFloat(it.sellingPrice as any) || 0);
      return c <= 0 || s <= 0;
    });

    if (invalidPrices) {
      alert("Please provide valid, non-zero cost and selling prices for all received items.");
      return;
    }

    // Also check if at least one item is marked as received
    const allNotReceived = itemsToReceive.every(it => it.notReceived);
    if (allNotReceived) {
      alert("Please mark at least one item as received. If none are received, close this modal or modify your selections.");
      return;
    }

    // Prepare clean data, zeroing out non-received items
    const cleanedItems = itemsToReceive.map(it => {
      const c = typeof it.costPrice === 'number' ? it.costPrice : (parseFloat(it.costPrice as any) || 0);
      const s = typeof it.sellingPrice === 'number' ? it.sellingPrice : (parseFloat(it.sellingPrice as any) || 0);
      return {
        name: it.name,
        quantity: typeof it.quantity === 'number' ? it.quantity : (parseFloat(it.quantity as any) || 0),
        costPrice: it.notReceived ? 0 : c,
        sellingPrice: it.notReceived ? 0 : s,
        notReceived: it.notReceived
      };
    });

    const numericPaid = typeof invAmountPaid === 'number' ? invAmountPaid : (parseFloat(invAmountPaid as any) || 0);
    const totalBill = cleanedItems.reduce((sum, it) => sum + (it.notReceived ? 0 : it.quantity * it.costPrice), 0);
    const actualPaid = invAddAllToDue ? 0 : numericPaid;
    const computedDue = invAddAllToDue ? totalBill : Math.max(0, totalBill - actualPaid);

    onAddInventoryRequest({
      purchaseOrderId: selectedPoId,
      date: getCurrentBsDate(),
      supplierId: selectedPo.supplierId,
      items: cleanedItems,
      amountPaid: actualPaid,
      remarks: remarks.trim()
    });

    // Automatically update supplier credit liability balance if due exists
    if (computedDue > 0 && onUpdateSuppliers && selectedPo.supplierId) {
      const updatedSuppliers = suppliers.map(s => {
        if (s.id === selectedPo.supplierId) {
          return {
            ...s,
            creditBalance: (s.creditBalance || 0) + computedDue
          };
        }
        return s;
      });
      onUpdateSuppliers(updatedSuppliers);
    }

    // Close and reset
    setIsModalOpen(false);
    setSelectedPoId('');
    setRemarks('');
    setInvAmountPaid(0);
    setInvAddAllToDue(false);
    setItemsToReceive([]);
    alert("Receive Request saved and submitted to Administrator for approval.");
  };

  // Calculations for dashboard indicators
  const totalValuation = inventoryStock.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
  const totalUniqueItems = inventoryStock.length;
  const totalQuantity = inventoryStock.reduce((sum, item) => sum + item.quantity, 0);
  const pendingApprovalsCount = inventoryRequests.filter(r => r.status === 'Pending').length;

  // Filtered Stock Items
  const filteredStock = inventoryStock.filter(item => {
    const supplier = suppliers.find(s => s.id === item.supplierId);
    const searchString = `${item.name} ${supplier?.name || ''}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-display">Inventory Stock</h2>
          <p className="text-xs text-slate-500">Track current items in stock, receive ordered stock shipments, and manage retail product catalog syncs.</p>
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          {(currentUser.role === 'Admin' || currentUser.role === 'Super Admin') && (
            <button 
              onClick={() => {
                setIsCsvModalOpen(true);
                setCsvParsedItems([]);
                setCsvImportError('');
              }}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition duration-200 shrink-0 cursor-pointer"
              id="btn-import-csv"
            >
              <FileSpreadsheet size={16} />
              <span>Import Excel CSV</span>
            </button>
          )}

          <button 
            onClick={() => {
              setIsOfficeUseModalOpen(true);
              setOfficeUseDate(getCurrentBsDate());
              setOfficeUseItemId('');
              setOfficeUseQuantity(1);
              setOfficeUseRemarks('');
            }}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition duration-200 shrink-0 cursor-pointer"
            id="btn-request-office-use"
          >
            <PackageCheck size={16} />
            <span>Request for Office Use</span>
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition duration-200 shrink-0 cursor-pointer"
            id="btn-add-inventory"
          >
            <Plus size={16} />
            <span>Add Inventory Stock</span>
          </button>
        </div>
      </div>

      {/* Admin Verification & Approval Section for Pending Office Use Requests */}
      {(currentUser.role === 'Admin' || currentUser.role === 'Super Admin') && officeUseRequests.filter(r => r.status === 'Pending').length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <BadgeAlert size={18} className="text-blue-600" />
              <span>Pending Office Use Requisitions ({officeUseRequests.filter(r => r.status === 'Pending').length})</span>
            </div>
            <span className="text-xs text-blue-700 font-medium">Approval automatically deducts stock & logs expense to Office Supplies</span>
          </div>

          <div className="space-y-3">
            {officeUseRequests.filter(r => r.status === 'Pending').map(req => {
              const item = inventoryStock.find(i => i.id === req.itemId || i.name.toLowerCase() === req.itemName.toLowerCase());
              const costPrice = item?.costPrice || 0;
              const totalEstCost = costPrice * req.quantity;

              return (
                <div key={req.id} className="bg-white rounded-xl p-4 border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-800 font-mono">{req.requestNo || req.id}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600">Requested By: <strong>{req.requestedBy || 'Staff'}</strong></span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 font-mono">{req.date}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-md">
                        {req.itemName}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        Qty: <strong>{req.quantity}</strong> {item?.unitType || 'units'}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        (Est. Cost: Rs. {totalEstCost.toLocaleString()})
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        (item?.quantity || 0) >= req.quantity ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        Current Stock: {item?.quantity || 0}
                      </span>
                    </div>
                    {req.remarks && (
                      <p className="text-[11px] text-slate-500 italic mt-1">Remarks: "{req.remarks}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        if (onApproveOfficeUseRequest) {
                          onApproveOfficeUseRequest(req.id);
                        }
                      }}
                      className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition cursor-pointer"
                    >
                      <Check size={14} />
                      <span>Approve & Deduct Stock</span>
                    </button>
                    <button
                      onClick={() => {
                        if (onRejectOfficeUseRequest) {
                          onRejectOfficeUseRequest(req.id);
                        }
                      }}
                      className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-2 rounded-lg transition cursor-pointer"
                    >
                      <X size={14} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin Verification & Approval Section for Pending Inventory Requests */}
      {(currentUser.role === 'Admin' || currentUser.role === 'Super Admin') && inventoryRequests.filter(r => r.status === 'Pending').length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
              <BadgeAlert size={18} className="text-amber-600" />
              <span>Pending Inventory Approvals ({inventoryRequests.filter(r => r.status === 'Pending').length})</span>
            </div>
            <span className="text-xs text-amber-700 font-medium">Verify received items & cost rates before stock entry</span>
          </div>

          <div className="space-y-3">
            {inventoryRequests.filter(r => r.status === 'Pending').map(req => {
              const po = transactions.find(t => t.id === req.purchaseOrderId);
              const sup = suppliers.find(s => s.id === req.supplierId);
              return (
                <div key={req.id} className="bg-white rounded-xl p-4 border border-amber-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-800 font-mono">REQ #{req.id}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600">PO Ref: <strong>{req.purchaseOrderId}</strong></span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600">Supplier: <strong>{sup?.name || 'N/A'}</strong></span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 font-mono">{req.date}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {req.items.map((it, idx) => (
                        <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-700 text-[11px] px-2 py-0.5 rounded-md font-semibold">
                          {it.name}: <strong>{it.quantity} qty</strong> @ Rs. {it.costPrice} cost / Rs. {it.sellingPrice} sell
                        </span>
                      ))}
                    </div>
                    {req.remarks && (
                      <p className="text-[11px] text-slate-500 italic mt-1">Remarks: "{req.remarks}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onApproveInventoryRequest(req.id);
                        alert(`Inventory request #${req.id} verified and added to active stock!`);
                      }}
                      className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      <Check size={14} />
                      <span>Verify & Approve</span>
                    </button>
                    <button
                      onClick={() => {
                        onDeclineInventoryRequest(req.id);
                      }}
                      className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      <X size={14} />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin Approvals Widget - Hidden (Shows in Staff Requests tab only) */}

      {/* Staff Pending Approvals Tracker */}
      {currentUser.role === 'User' && inventoryRequests.filter(r => r.status === 'Pending').length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
          <BadgeAlert size={18} className="text-indigo-600 mt-0.5 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-slate-800">Pending Inventory Approval Requests ({inventoryRequests.filter(r => r.status === 'Pending').length})</p>
            <p className="text-slate-500 mt-0.5">Your received stock records are awaiting Administrator verification before loading into the active catalog.</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className={`grid grid-cols-1 ${(currentUser.role === 'Admin' || currentUser.role === 'Super Admin') ? 'sm:grid-cols-4' : 'sm:grid-cols-2'} gap-4`}>
        {(currentUser.role === 'Admin' || currentUser.role === 'Super Admin') && (
          <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-900 shadow-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Inventory Valuation (Cost)</span>
            <p className="text-2xl font-bold font-display mt-1 text-slate-50">Rs. {totalValuation.toLocaleString()}</p>
            <p className="text-[9px] text-slate-400 mt-1">Capital invested in physical stock</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Total Catalog Items</span>
          <p className="text-2xl font-bold font-display mt-1 text-indigo-600">{totalUniqueItems}</p>
          <p className="text-[9px] text-slate-500 mt-1">Unique products currently tracked</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Total Stock Volume</span>
          <p className="text-2xl font-bold font-display mt-1 text-slate-800">{totalQuantity} units</p>
          <p className="text-[9px] text-slate-500 mt-1">Aggregate physical unit count</p>
        </div>

        {(currentUser.role === 'Admin' || currentUser.role === 'Super Admin') && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 font-bold block">Valuation Gain (Sales Potential)</span>
            <p className="text-2xl font-bold font-display mt-1 text-emerald-700">
              Rs. {inventoryStock.reduce((sum, item) => sum + (item.quantity * (item.sellingPrice - item.costPrice)), 0).toLocaleString()}
            </p>
            <p className="text-[9px] text-emerald-600 mt-1">Estimated profit margin at retail</p>
          </div>
        )}
      </div>

      {/* Search & Action Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <InteractiveSearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search active stock items by description, supplier..."
            expandedWidth="w-full max-w-md"
          />
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white border border-slate-100 shadow-xs rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4 text-center">In-Stock Quantity</th>
                {(currentUser.role === 'Admin' || currentUser.role === 'Super Admin') && <th className="px-6 py-4 text-right">Cost Price</th>}
                <th className="px-6 py-4 text-right">Retail Selling Price</th>
                {(currentUser.role === 'Admin' || currentUser.role === 'Super Admin') && <th className="px-6 py-4 text-right">Total Cost Value</th>}
                <th className="px-6 py-4 text-center">Last Stocked</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {filteredStock.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(item => {
                const supplier = suppliers.find(s => s.id === item.supplierId);
                const isLowStock = item.quantity <= 3;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isLowStock ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} title={isLowStock ? 'Low Stock' : 'Good Stock'} />
                      <span>{item.name}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      {supplier ? supplier.name : <span className="text-slate-400 italic">Unknown vendor</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isLowStock ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.quantity} units {isLowStock && '⚠️'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Opening FY: {item.openingStockForFY?.[getNepaleseFiscalYear(getCurrentBsDate())] !== undefined ? item.openingStockForFY[getNepaleseFiscalYear(getCurrentBsDate())] : item.quantity}
                        </span>
                      </div>
                    </td>
                    {(currentUser.role === 'Admin' || currentUser.role === 'Super Admin') && (
                      <td className="px-6 py-4 text-right font-mono font-semibold text-rose-600">
                        Rs. {item.costPrice.toLocaleString()}
                      </td>
                    )}
                    <td className="px-6 py-4 text-right font-mono font-semibold text-emerald-600">
                      Rs. {item.sellingPrice.toLocaleString()}
                    </td>
                    {(currentUser.role === 'Admin' || currentUser.role === 'Super Admin') && (
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                        Rs. {(item.quantity * item.costPrice).toLocaleString()}
                      </td>
                    )}
                    <td className="px-6 py-4 text-center font-mono text-slate-500 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        <span>{item.lastReceivedDate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                          title="Edit/Correct Stock"
                        >
                          <Edit size={12} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            const isSystemMaster = currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin';
                            if (!isSystemMaster) {
                              alert('Direct deletion is allowed for System Master (@reliableadmin) only.');
                              return;
                            }
                            if (confirm(`Remove ${item.name} from stock catalog?`)) {
                              onDeleteStockItem(item.id);
                            }
                          }}
                          className="text-rose-600 hover:text-rose-800 font-semibold hover:underline cursor-pointer"
                          title={currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin' ? "Delete Stock Entry" : "Delete (System Master Only)"}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredStock.length === 0 && (
                <tr>
                  <td colSpan={(currentUser.role === 'Admin' || currentUser.role === 'Super Admin') ? 8 : 6} className="py-16 text-center text-slate-400">
                    <Package size={32} className="mx-auto text-slate-300" />
                    <p className="text-sm font-semibold mt-2 text-slate-600">No stock items found</p>
                    <p className="text-[11px] text-slate-400 mt-1">Receive Approved Purchase Orders to populate your stock catalog.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredStock.length > 0 && (
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
                Showing {Math.min(filteredStock.length, (currentPage - 1) * pageSize + 1)}-{Math.min(currentPage * pageSize, filteredStock.length)} of {filteredStock.length} entries
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
                  Page {currentPage} of {Math.ceil(filteredStock.length / pageSize)}
                </span>
                <button
                  disabled={currentPage >= Math.ceil(filteredStock.length / pageSize)}
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

      {/* Add Received Inventory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl max-h-[calc(100dvh-2rem)] my-auto overflow-hidden flex flex-col animate-scale-in">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold font-display text-slate-800 text-lg flex items-center gap-2">
                  <PackageCheck className="text-indigo-600" size={20} />
                  <span>Receive Purchase Order & Record Prices</span>
                </h3>
                <p className="text-[11px] text-slate-500">Provide the Cost Price & Retail Selling Price to sync items directly into your catalog upon Admin approval.</p>
              </div>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedPoId('');
                  setItemsToReceive([]);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
              
              {/* Select Purchase Order */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Select Approved Purchase Order *</label>
                <select 
                  required
                  value={selectedPoId}
                  onChange={(e) => handlePoChange(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="" disabled>Select approved PO to receive...</option>
                  {availablePOs.map(po => {
                    const sup = suppliers.find(s => s.id === po.supplierId);
                    return (
                      <option key={po.id} value={po.id}>
                        PO #{po.id.replace('tx-', '')} ({po.date}) - {sup ? sup.name : 'Unknown Vendor'} [{po.itemsBought}]
                      </option>
                    );
                  })}
                </select>
                {availablePOs.length === 0 && (
                  <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle size={12} />
                    <span>No approved purchase orders are currently pending receipt. Ensure POs are approved by the Admin first!</span>
                  </p>
                )}
              </div>

              {/* Populated items pricing */}
              {selectedPoId && itemsToReceive.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                    <Tag size={13} className="text-indigo-500" />
                    <span>Set Catalog Pricing for Received Items</span>
                  </p>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {itemsToReceive.map((item, idx) => (
                      <div key={idx} className={`p-3.5 border rounded-xl transition ${
                        item.notReceived 
                          ? 'border-rose-200/60 bg-rose-50/30 opacity-70' 
                          : 'border-slate-150 bg-slate-50/50'
                      } space-y-3`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${item.notReceived ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                            {item.quantity}x {item.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleNotReceived(idx)}
                            className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                              item.notReceived
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {item.notReceived ? '🚫 Not Received' : '📦 Mark as Not Received'}
                          </button>
                        </div>
                        
                        {!item.notReceived ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 block uppercase font-mono">Cost Price (Rs.) *</label>
                              <input 
                                type="number"
                                step="any"
                                min="0.01"
                                required
                                placeholder="Our cost"
                                value={item.costPrice !== undefined ? item.costPrice : ''}
                                onChange={(e) => handlePriceChange(idx, 'costPrice', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white font-semibold font-mono text-rose-600 focus:outline-hidden focus:border-indigo-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 block uppercase font-mono">Selling Price (Rs.) *</label>
                              <input 
                                type="number"
                                step="any"
                                min="0.01"
                                required
                                placeholder="Retail selling rate"
                                value={item.sellingPrice !== undefined ? item.sellingPrice : ''}
                                onChange={(e) => handlePriceChange(idx, 'sellingPrice', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white font-semibold font-mono text-emerald-600 focus:outline-hidden focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-rose-600 font-bold bg-rose-50/50 border border-rose-100/40 p-2 rounded-lg text-center font-mono">
                            🚫 Excluded from current arrival. This item will not be added to active inventory stock.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Ledger Invoice Accounting Section */}
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Coins size={14} className="text-emerald-600" />
                        <span>Ledger Invoice Accounting</span>
                      </p>
                      <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 cursor-pointer hover:bg-rose-100 transition">
                        <input 
                          type="checkbox"
                          checked={invAddAllToDue}
                          onChange={(e) => {
                            setInvAddAllToDue(e.target.checked);
                            if (e.target.checked) setInvAmountPaid(0);
                          }}
                          className="rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                        />
                        <span>Add all to due / Completely Unpaid</span>
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Computed Bill</span>
                        <p className="text-sm font-bold font-mono text-slate-800 pt-1">
                          Rs. {itemsToReceive.reduce((sum, it) => sum + (it.notReceived ? 0 : it.quantity * (typeof it.costPrice === 'number' ? it.costPrice : (parseFloat(it.costPrice as any) || 0))), 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block uppercase">Cash Paid (Rs.) *</label>
                        <input 
                          type="number"
                          step="any"
                          min="0"
                          disabled={invAddAllToDue}
                          required={!invAddAllToDue}
                          placeholder="0"
                          value={invAddAllToDue ? 0 : (invAmountPaid !== undefined ? invAmountPaid : '')}
                          onChange={(e) => setInvAmountPaid(e.target.value)}
                          className={`w-full border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold font-mono focus:outline-hidden focus:border-indigo-500 ${invAddAllToDue ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-emerald-600'}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Computed Due</span>
                        <p className="text-sm font-bold font-mono text-rose-600 pt-1">
                          Rs. {(invAddAllToDue 
                            ? itemsToReceive.reduce((sum, it) => sum + (it.notReceived ? 0 : it.quantity * (typeof it.costPrice === 'number' ? it.costPrice : (parseFloat(it.costPrice as any) || 0))), 0)
                            : Math.max(0, itemsToReceive.reduce((sum, it) => sum + (it.notReceived ? 0 : it.quantity * (typeof it.costPrice === 'number' ? it.costPrice : (parseFloat(it.costPrice as any) || 0))), 0) - (typeof invAmountPaid === 'number' ? invAmountPaid : (parseFloat(invAmountPaid as any) || 0)))
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reference remarks */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Verification Remarks</label>
                <input 
                  type="text"
                  placeholder="e.g. Received in pristine condition, verified by storekeeper"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Actions panel */}
              <div className="pt-4 border-t border-slate-150 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedPoId('');
                    setItemsToReceive([]);
                  }}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!selectedPoId}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-4.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Check size={14} />
                  <span>Submit for Admin Approval</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Excel CSV Import Modal - Only Admin */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[calc(100dvh-2rem)] my-auto overflow-hidden flex flex-col animate-scale-in">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold font-display text-slate-800 text-lg flex items-center gap-2">
                  <FileSpreadsheet className="text-emerald-600" size={20} />
                  <span>Import Inventory Stock from Excel CSV</span>
                </h3>
                <p className="text-[11px] text-slate-500">Quickly upload large lists of items from Excel sheets into the active inventory stock catalog.</p>
              </div>
              <button 
                onClick={() => {
                  setIsCsvModalOpen(false);
                  setCsvParsedItems([]);
                  setCsvImportError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Instructions and Download section */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-slate-700">Required CSV Columns:</p>
                    <p className="text-slate-500 font-mono text-[10px]">
                      Item Name, Quantity, Cost Price, Selling Price, Unit Type, Supplier Name
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition shadow-3xs cursor-pointer shrink-0"
                  >
                    <Download size={13} className="text-slate-500" />
                    <span>Download CSV Template</span>
                  </button>
                </div>
              </div>

              {/* Upload Drop Area */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Upload CSV File *</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl hover:border-emerald-500 transition-colors p-6 text-center bg-slate-50/40 relative">
                  <input 
                    type="file" 
                    accept=".csv"
                    onChange={handleCsvFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <div className="mx-auto w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center animate-bounce">
                      <Upload size={18} />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">Click to choose or Drag & Drop your `.csv` file here</p>
                    <p className="text-[10px] text-slate-400">Excel files must be exported or saved as Comma-Separated Values (.csv)</p>
                  </div>
                </div>
              </div>

              {/* Merge Strategy Config */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Catalog Merge Strategy *</label>
                <select
                  value={csvMergeStrategy}
                  onChange={(e) => setCsvMergeStrategy(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white text-slate-700 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="merge">➕ Add & Merge (Sums quantities together if item already exists by name)</option>
                  <option value="overwrite">✏️ Overwrite Duplicate Stock (Replaces quantities of existing names)</option>
                  <option value="replace">🚨 Replace Entire Stock Catalog (Clears current catalog and imports fresh)</option>
                </select>
              </div>

              {/* Error messages */}
              {csvImportError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex items-start gap-2 animate-pulse">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <p>{csvImportError}</p>
                </div>
              )}

              {/* Preview table of parsed values */}
              {csvParsedItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                      Parsed Items Preview ({csvParsedItems.length} rows detected)
                    </p>
                    <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                      Status: Valid
                    </span>
                  </div>

                  <div className="border border-slate-150 rounded-xl overflow-hidden max-h-48 overflow-y-auto shadow-3xs">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                          <th className="px-3 py-2">Item Name</th>
                          <th className="px-3 py-2 text-center">Qty</th>
                          <th className="px-3 py-2 text-right">Cost (Rs.)</th>
                          <th className="px-3 py-2 text-right">Selling (Rs.)</th>
                          <th className="px-3 py-2">Supplier Sync</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {csvParsedItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition">
                            <td className="px-3 py-2 font-semibold text-slate-800">{item.name}</td>
                            <td className="px-3 py-2 text-center text-slate-600 font-mono">{item.quantity} {item.unitType}</td>
                            <td className="px-3 py-2 text-right text-slate-600 font-mono">Rs. {item.costPrice.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right text-indigo-600 font-mono">Rs. {item.sellingPrice.toLocaleString()}</td>
                            <td className="px-3 py-2">
                              {item.supplierId ? (
                                <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md text-[9px] font-bold">
                                  {suppliers.find(s => s.id === item.supplierId)?.name}
                                </span>
                              ) : (
                                <span className="text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md text-[9px]">
                                  {item.supplierName || 'None'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={() => {
                  setIsCsvModalOpen(false);
                  setCsvParsedItems([]);
                  setCsvImportError('');
                }}
                className="px-4 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleConfirmImport}
                disabled={csvParsedItems.length === 0}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-4.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Check size={14} />
                <span>Confirm & Import Stock</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Correct Inventory Stock Modal - Only Admin */}
      {isEditModalOpen && editingItem && (currentUser.role === 'Admin' || currentUser.role === 'Super Admin') && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg max-h-[calc(100dvh-2rem)] my-auto overflow-hidden flex flex-col animate-scale-in">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold font-display text-slate-800 text-lg flex items-center gap-2">
                  <Edit className="text-indigo-600" size={20} />
                  <span>Correct / Edit Stock Item</span>
                </h3>
                <p className="text-[11px] text-slate-500">Correct details for {editingItem.name}. Updates will propagate immediately.</p>
              </div>
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingItem(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {/* Item Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Item Name *</label>
                <input 
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  placeholder="e.g. Wire roll 1.5mm"
                />
              </div>

              {/* Grid for Quantity and Unit Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">In-Stock Quantity *</label>
                  <input 
                    type="number"
                    step="any"
                    required
                    min="0"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Unit Type</label>
                  <select
                    value={editUnitType}
                    onChange={(e) => setEditUnitType(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="">-- Select Unit from Catalog --</option>
                    {(units && units.length > 0 ? units : ['pcs', 'kg', 'ltr', 'box', 'packet', 'Flat', 'Hourly', 'Monthly', 'Per Unit']).map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                    {editUnitType && !(units || []).includes(editUnitType) && (
                      <option value={editUnitType}>{editUnitType}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Grid for Cost Price and Selling Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Cost Price (Rs.) *</label>
                  <input 
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={editCostPrice}
                    onChange={(e) => setEditCostPrice(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Retail Selling Price (Rs.) *</label>
                  <input 
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={editSellingPrice}
                    onChange={(e) => setEditSellingPrice(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Supplier Selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Supplier / Vendor *</label>
                <select 
                  required
                  value={editSupplierId}
                  onChange={(e) => setEditSupplierId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="" disabled>Select supplier...</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Save Stock Correction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Office Use Requisition Modal */}
      {isOfficeUseModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[calc(100dvh-2rem)] my-auto overflow-hidden flex flex-col border border-slate-100 animate-scale-in">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <PackageCheck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Request for Office Use</h3>
                  <p className="text-xs text-slate-400">Requisition internal supplies from inventory stock</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOfficeUseModalOpen(false)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleOfficeUseSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Requisition Date *
                </label>
                <input 
                  type="text"
                  value={officeUseDate}
                  onChange={(e) => setOfficeUseDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Name (Select from Inventory Stock) *
                </label>
                <select
                  value={officeUseItemId}
                  onChange={(e) => setOfficeUseItemId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:border-indigo-500 bg-white"
                  required
                >
                  <option value="">-- Choose Item from Stock --</option>
                  {inventoryStock.map(item => (
                    <option key={item.id} value={item.id} disabled={item.quantity <= 0}>
                      {item.name} ({item.quantity} {item.unitType || 'pcs'} in stock @ Rs. {item.costPrice} cost)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity Required *
                </label>
                <input 
                  type="number"
                  step="any"
                  min="0.01"
                  value={officeUseQuantity}
                  onChange={(e) => setOfficeUseQuantity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks / Purpose
                </label>
                <textarea 
                  rows={2}
                  value={officeUseRemarks}
                  onChange={(e) => setOfficeUseRemarks(e.target.value)}
                  placeholder="e.g., Internal office installation / maintenance supply"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOfficeUseModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Submit Requisition</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
