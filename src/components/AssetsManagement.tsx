import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Check, 
  X, 
  Briefcase, 
  Calendar, 
  AlertCircle, 
  Coins, 
  ShieldCheck, 
  Tag, 
  FileText, 
  Download, 
  Trash2, 
  Edit3, 
  Printer, 
  Archive,
  RefreshCw,
  Eye
} from 'lucide-react';
import { AssetItem, SupplyTransaction, Supplier, AppUser, EditRequest, BusinessProfile } from '../types';
import { getCurrentBsDate } from '../utils/nepaliDate';
import { InteractiveSearchBar } from './InteractiveSearchBar';

interface AssetsManagementProps {
  assets: AssetItem[];
  onAddAsset: (asset: Omit<AssetItem, 'id' | 'assetCode' | 'status'>) => void;
  onUpdateAsset: (asset: AssetItem) => void;
  onDeleteAsset: (id: string) => void;
  transactions: SupplyTransaction[];
  suppliers: Supplier[];
  currentUser: AppUser;
  onSendEditRequest?: (req: Omit<EditRequest, 'status'>) => void;
  profile?: BusinessProfile;
}

export const AssetsManagement: React.FC<AssetsManagementProps> = ({
  assets,
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset,
  transactions,
  suppliers,
  currentUser,
  onSendEditRequest,
  profile
}) => {
  const isAdmin = currentUser.role === 'Admin';

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Durable' | 'Non-Durable'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Released'>('All');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modal States
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isReceivePoModalOpen, setIsReceivePoModalOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Manual Add Form States
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'Durable' | 'Non-Durable'>('Durable');
  const [newPurchaseDate, setNewPurchaseDate] = useState(getCurrentBsDate());
  const [newCostPrice, setNewCostPrice] = useState<number | string>(0);
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [newSupplierId, setNewSupplierId] = useState('');
  const [newRemarks, setNewRemarks] = useState('');

  // Receive PO Form States
  const [selectedPoId, setSelectedPoId] = useState('');
  const [itemsToReceive, setItemsToReceive] = useState<{
    name: string;
    quantity: number;
    costPrice: number | string;
    type: 'Durable' | 'Non-Durable';
  }[]>([]);

  // Release Asset Form States
  const [releasingAsset, setReleasingAsset] = useState<AssetItem | null>(null);
  const [releaseNote, setReleaseNote] = useState('');
  const [releaseMeetingDate, setReleaseMeetingDate] = useState(getCurrentBsDate());
  const [releaseDecisionNo, setReleaseDecisionNo] = useState('');
  const [releaseMeetingNumber, setReleaseMeetingNumber] = useState('');
  const [releaseRemarks, setReleaseRemarks] = useState('');

  // Edit Form States (Both direct edit for Admin and proposal edit for Staff)
  const [editingAsset, setEditingAsset] = useState<AssetItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'Durable' | 'Non-Durable'>('Durable');
  const [editPurchaseDate, setEditPurchaseDate] = useState('');
  const [editCostPrice, setEditCostPrice] = useState<number | string>(0);
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editSupplierId, setEditSupplierId] = useState('');
  const [editRemarks, setEditRemarks] = useState('');

  // Printable release slips
  const [printingAsset, setPrintingAsset] = useState<AssetItem | null>(null);

  // Search filter
  const filteredAssets = assets.filter(asset => {
    const supplier = suppliers.find(s => s.id === asset.supplierId);
    const matchesSearch = (asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           asset.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (supplier?.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'All' || asset.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || asset.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Approved POs with official use category that haven't been received yet
  const officialPOs = transactions.filter(tx => 
    tx.purchaseType === 'Official Use' && 
    (tx.status === 'Approved' || tx.status === 'Ordered')
  );

  // Reset Manual Form
  const resetManualForm = () => {
    setNewName('');
    setNewType('Durable');
    setNewPurchaseDate(getCurrentBsDate());
    setNewCostPrice(0);
    setNewQuantity(1);
    setNewSupplierId(suppliers[0]?.id || '');
    setNewRemarks('');
  };

  // Submit Manual Form
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const numCost = typeof newCostPrice === 'number' ? newCostPrice : (parseFloat(newCostPrice) || 0);

    onAddAsset({
      name: newName.trim(),
      type: newType,
      purchaseDate: newPurchaseDate,
      costPrice: numCost,
      quantity: newQuantity,
      supplierId: newSupplierId || undefined,
      remarks: newRemarks.trim() || undefined
    });

    setIsManualModalOpen(false);
    resetManualForm();
    alert("Asset successfully registered into system registry.");
  };

  // Prepare PO Items when a PO is selected
  const handlePoSelectionChange = (poId: string) => {
    setSelectedPoId(poId);
    const po = transactions.find(t => t.id === poId);
    if (po) {
      if (po.items && po.items.length > 0) {
        setItemsToReceive(po.items.map(it => ({
          name: it.name,
          quantity: it.quantity,
          costPrice: it.costPrice || 0,
          type: 'Durable'
        })));
      } else {
        setItemsToReceive([{
          name: po.itemsBought,
          quantity: 1,
          costPrice: po.amountPaid + po.amountDue,
          type: 'Durable'
        }]);
      }
    } else {
      setItemsToReceive([]);
    }
  };

  // Toggle item type in receiving list
  const handleReceiveItemTypeChange = (idx: number, type: 'Durable' | 'Non-Durable') => {
    const updated = [...itemsToReceive];
    updated[idx].type = type;
    setItemsToReceive(updated);
  };

  // Update cost price in receiving list
  const handleReceiveItemCostChange = (idx: number, cost: number | string) => {
    const updated = [...itemsToReceive];
    updated[idx].costPrice = cost;
    setItemsToReceive(updated);
  };

  // Submit Received PO Items
  const handlePoReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoId) return;

    const po = transactions.find(t => t.id === selectedPoId);
    if (!po) return;

    // Create asset for each item in the PO
    itemsToReceive.forEach(it => {
      const c = typeof it.costPrice === 'number' ? it.costPrice : (parseFloat(it.costPrice as any) || 0);
      onAddAsset({
        name: it.name,
        type: it.type,
        purchaseDate: po.date,
        costPrice: c,
        quantity: it.quantity,
        supplierId: po.supplierId,
        purchaseOrderId: po.id,
        remarks: `Received via PO #${po.id.replace('tx-', '')}`
      });
    });

    // Mark PO as fully Received (Paid/Pending depending on financials)
    // Legacy mapping: update PO status to Paid if no due, or Pending if due
    const nextStatus = po.amountDue > 0 ? 'Pending' : 'Paid';
    onUpdateAsset && onUpdateAsset({} as any); // Trick app to save
    po.status = nextStatus;

    setIsReceivePoModalOpen(false);
    setSelectedPoId('');
    setItemsToReceive([]);
    alert(`Successfully processed PO #${po.id.replace('tx-', '')} into Asset Management!`);
  };

  // Trigger Edit Form
  const handleOpenEdit = (asset: AssetItem) => {
    setEditingAsset(asset);
    setEditName(asset.name);
    setEditType(asset.type);
    setEditPurchaseDate(asset.purchaseDate);
    setEditCostPrice(asset.costPrice);
    setEditQuantity(asset.quantity);
    setEditSupplierId(asset.supplierId || '');
    setEditRemarks(asset.remarks || '');
    setIsEditModalOpen(true);
  };

  // Submit Edit Asset
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;

    const numCost = typeof editCostPrice === 'number' ? editCostPrice : (parseFloat(editCostPrice) || 0);

    const updatedData = {
      ...editingAsset,
      name: editName.trim(),
      type: editType,
      purchaseDate: editPurchaseDate,
      costPrice: numCost,
      quantity: editQuantity,
      supplierId: editSupplierId || undefined,
      remarks: editRemarks.trim() || undefined
    };

    if (isAdmin) {
      onUpdateAsset(updatedData);
      setIsEditModalOpen(false);
      setEditingAsset(null);
      alert("Asset details modified successfully.");
    } else {
      // Staff edit request
      if (onSendEditRequest) {
        onSendEditRequest({
          id: `req-${Date.now()}`,
          type: 'Asset Edit',
          details: `Staff (${currentUser.name}) requested changes for asset ${editingAsset.assetCode}. Changes: name=${editName}, cost=${editCostPrice}, qty=${editQuantity}`,
          targetAssetId: editingAsset.id,
          assetData: updatedData,
          date: getCurrentBsDate()
        });
        setIsEditModalOpen(false);
        setEditingAsset(null);
        alert("Asset modification request submitted to Admin for authorization.");
      } else {
        alert("Action denied: Request service is offline.");
      }
    }
  };

  // Submit Delete request / Delete directly
  const handleDeleteTrigger = (asset: AssetItem) => {
    const isSystemMaster = currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin';
    if (isSystemMaster) {
      if (confirm(`Are you absolutely sure you want to delete asset ${asset.name} (${asset.assetCode})? This action is irreversible.`)) {
        onDeleteAsset(asset.id);
        alert("Asset purged from database successfully.");
      }
    } else {
      if (onSendEditRequest) {
        onSendEditRequest({
          id: `req-${Date.now()}`,
          type: 'Asset Deletion',
          details: `Staff (${currentUser.name}) requested DELETION of asset ${asset.name} (${asset.assetCode}).`,
          targetAssetId: asset.id,
          date: getCurrentBsDate()
        });
        alert("Asset deletion request submitted for authorization. Direct deletion is allowed for System Master (@reliableadmin) only.");
      } else {
        alert("Direct deletion is allowed for System Master (@reliableadmin) only.");
      }
    }
  };

  // Helper to generate next reference number for release
  const getNextReleaseReferenceNumber = () => {
    const releasedCount = assets.filter(a => a.status === 'Released' && a.releaseInfo?.referenceNumber).length;
    return `RTSS-ASSETSRELEASE-${String(releasedCount + 1).padStart(4, '0')}`;
  };

  // Submit Release Asset Form (Only Admin)
  const handleReleaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!releasingAsset || !releaseNote.trim()) return;

    const refNum = getNextReleaseReferenceNumber();

    const updatedAsset: AssetItem = {
      ...releasingAsset,
      status: 'Released',
      releaseInfo: {
        referenceNumber: refNum,
        note: releaseNote.trim(),
        meetingNumber: releaseMeetingNumber.trim(),
        meetingDate: releaseMeetingDate,
        decisionNumber: releaseDecisionNo.trim(),
        remarks: releaseRemarks.trim(),
        releasedAt: getCurrentBsDate()
      }
    };

    onUpdateAsset(updatedAsset);
    setIsReleaseModalOpen(false);
    setReleasingAsset(null);
    setReleaseNote('');
    setReleaseDecisionNo('');
    setReleaseMeetingNumber('');
    setReleaseRemarks('');
    alert(`Asset successfully marked as Released with reference number ${refNum}.`);
  };

  // CSV Export Download
  const handleExportCSV = () => {
    const headers = ['Asset Code', 'Name', 'Category', 'Purchase Date', 'Cost Price (Rs.)', 'Quantity', 'Supplier/Vendor', 'Status', 'Release Note', 'Meeting Date', 'Decision No'];
    const rows = filteredAssets.map(a => {
      const supplier = suppliers.find(s => s.id === a.supplierId);
      return [
        a.assetCode,
        a.name,
        a.type,
        a.purchaseDate,
        a.costPrice,
        a.quantity,
        supplier ? supplier.name : 'N/A',
        a.status,
        a.releaseInfo?.note || '',
        a.releaseInfo?.meetingDate || '',
        a.releaseInfo?.decisionNumber || ''
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RTSS_Assets_Register_${getCurrentBsDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPI Calculations
  const totalAssetsValuation = assets.reduce((sum, a) => sum + (a.status === 'Active' ? a.costPrice * a.quantity : 0), 0);
  const activeAssetsCount = assets.filter(a => a.status === 'Active').length;
  const releasedAssetsCount = assets.filter(a => a.status === 'Released').length;

  return (
    <div className="space-y-6 animate-fade-in" id="assets-management-tab">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-display">Assets Management</h2>
          <p className="text-xs text-slate-500">Log, audit, classify (durable vs non-durable) and manage company assets with full lifecycle tracking and release oversight.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 transition cursor-pointer"
            id="btn-export-assets-csv"
          >
            <Download size={14} />
            <span>Export Register</span>
          </button>

          <button 
            onClick={() => {
              setIsReceivePoModalOpen(true);
              setSelectedPoId('');
              setItemsToReceive([]);
            }}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            id="btn-receive-po-assets"
          >
            <Archive size={14} />
            <span>Receive from official PO ({officialPOs.length})</span>
          </button>
          
          <button 
            onClick={() => {
              setIsManualModalOpen(true);
              resetManualForm();
            }}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            id="btn-add-asset-manual"
          >
            <Plus size={14} />
            <span>Register Asset</span>
          </button>
        </div>
      </div>

      {/* KPI Overviews */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-5`}>
        {isAdmin && (
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Active Valuation</span>
            <p className="text-2xl font-bold font-display mt-1 text-indigo-300">Rs. {totalAssetsValuation.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 mt-2">Aggregate company cost for active assets</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Active Asset Records</span>
          <p className="text-2xl font-bold font-display mt-1 text-emerald-600">{activeAssetsCount} Items</p>
          <p className="text-[10px] text-slate-500 mt-2">Currently cataloged durable & non-durable goods</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Released / Destroyed Records</span>
          <p className="text-2xl font-bold font-display mt-1 text-rose-600">{releasedAssetsCount} Items</p>
          <p className="text-[10px] text-slate-500 mt-2">Assets written-off via general board decisions</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <InteractiveSearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search assets by description, asset code, supplier name..."
            expandedWidth="w-full max-w-md"
          />
        </div>

        <div className="flex flex-wrap w-full md:w-auto gap-2.5">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="All">All Categories</option>
            <option value="Durable">Durable Assets</option>
            <option value="Non-Durable">Non-Durable Assets</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="All">All Lifecycles</option>
            <option value="Active">Active Assets</option>
            <option value="Released">Released / Written-off</option>
          </select>
        </div>
      </div>

      {/* Main Asset Registry Ledger Table */}
      <div className="bg-white border border-slate-100 shadow-xs rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                <th className="px-6 py-4">Asset Code</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-center">Qty</th>
                {isAdmin && <th className="px-6 py-4 text-right">Unit Cost</th>}
                {isAdmin && <th className="px-6 py-4 text-right">Total Cost</th>}
                <th className="px-6 py-4 text-center">Purchase Date</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 font-sans">
              {filteredAssets.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(asset => {
                const supplier = suppliers.find(s => s.id === asset.supplierId);
                return (
                  <tr key={asset.id} className={`hover:bg-slate-50/50 transition ${asset.status === 'Released' ? 'bg-slate-50/30 text-slate-400' : ''}`}>
                    {/* Code */}
                    <td className="px-6 py-4 font-mono font-bold text-slate-600 whitespace-nowrap">
                      {asset.assetCode}
                    </td>

                    {/* Desc */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-800">{asset.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{supplier ? supplier.name : 'Manual Registration'}</p>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                        asset.type === 'Durable' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {asset.type}
                      </span>
                    </td>

                    {/* Qty */}
                    <td className="px-6 py-4 text-center font-bold">
                      {asset.quantity}
                    </td>

                    {/* Unit Cost */}
                    {isAdmin && (
                      <td className="px-6 py-4 text-right font-mono font-bold text-rose-600">
                        Rs. {asset.costPrice.toLocaleString()}
                      </td>
                    )}

                    {/* Total Cost */}
                    {isAdmin && (
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                        Rs. {(asset.costPrice * asset.quantity).toLocaleString()}
                      </td>
                    )}

                    {/* Purchase Date */}
                    <td className="px-6 py-4 text-center font-mono whitespace-nowrap">
                      {asset.purchaseDate}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        asset.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {asset.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {asset.status === 'Active' ? (
                          <>
                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEdit(asset)}
                              className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                              title={isAdmin ? "Edit Asset" : "Request Edit"}
                            >
                              <Edit3 size={14} />
                            </button>

                            {/* Release (Only admin) */}
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setReleasingAsset(asset);
                                  setReleaseNote('');
                                  setReleaseDecisionNo('');
                                  setIsReleaseModalOpen(true);
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                                title="Release Asset (Disposed/Destroyed)"
                              >
                                <Archive size={14} />
                              </button>
                            )}

                          </>
                        ) : (
                          <>
                            {/* Print Release Receipt */}
                            <button
                              onClick={() => {
                                if (window.openUniversalPrintPreview) {
                                  window.openUniversalPrintPreview({
                                    documentType: 'Asset Register',
                                    documentNumber: asset.releaseInfo?.releaseNo || `AST-${asset.id}`,
                                    documentDate: asset.releaseInfo?.releaseDate || getCurrentBsDate(),
                                    profile: profile,
                                    title: 'Official Fixed Asset Disposal & Release Certificate',
                                    items: [
                                      {
                                        sn: 1,
                                        name: asset.name,
                                        description: `Code: ${asset.assetCode} | Serial: ${asset.serialNumber || 'N/A'} | Condition: ${asset.releaseInfo?.conditionAtRelease || 'Good'}`,
                                        quantity: 1,
                                        unitPrice: asset.costValue,
                                        totalPrice: asset.releaseInfo?.salePrice || asset.costValue
                                      }
                                    ],
                                    subtotal: asset.costValue,
                                    grandTotal: asset.releaseInfo?.salePrice || asset.costValue,
                                    notes: `Released To: ${asset.releaseInfo?.releasedTo || 'N/A'}. Reason: ${asset.releaseInfo?.reason || 'Asset Decommission'}. Authorized handover.`,
                                    preparedBy: asset.releaseInfo?.releasedBy || currentUser.name,
                                    approvedBy: `${profile?.name || 'Authorized'} Custodian`
                                  });
                                } else {
                                  setPrintingAsset(asset);
                                }
                              }}
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 border border-amber-100 transition cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                              title="Print Asset Release Slip"
                            >
                              <Printer size={12} />
                              <span>Release slip</span>
                            </button>
                          </>
                        )}

                        {/* Delete Asset */}
                        <button
                          onClick={() => handleDeleteTrigger(asset)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title={currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin' ? "Delete Asset" : "Request Delete"}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400 bg-slate-50/20">
                    <Briefcase size={36} className="mx-auto text-slate-200" />
                    <p className="text-xs font-semibold mt-2 text-slate-600">No assets matching criteria</p>
                    <p className="text-[10px] text-slate-400 mt-1">Add manual asset records or sync assets from approved official Purchase Orders.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MANUAL REGISTER ASSET MODAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-scale-in">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <div>
                <h3 className="font-bold font-display text-slate-800 text-base">Register Asset</h3>
                <p className="text-[10px] text-slate-500 font-mono">Generates RTSS-ASSETS-DU/NONDU incremented codes.</p>
              </div>
              <button onClick={() => setIsManualModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Asset Description / Name *</label>
                <input 
                  type="text" required placeholder="e.g. Dell Vostro 3520 Laptop" value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Category *</label>
                  <select value={newType} onChange={(e) => setNewType(e.target.value as any)} className="w-full border border-slate-200 rounded-xl p-2 bg-white">
                    <option value="Durable">Durable (DU)</option>
                    <option value="Non-Durable">Non-Durable (NONDU)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Purchase Date *</label>
                  <input type="text" required placeholder="YYYY-MM-DD" value={newPurchaseDate} onChange={(e) => setNewPurchaseDate(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-center font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Cost Price (Rs.) *</label>
                  <input type="number" step="any" required min="0" value={newCostPrice !== undefined ? newCostPrice : ''} onChange={(e) => setNewCostPrice(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-right font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Quantity *</label>
                  <input type="number" required min="1" value={newQuantity} onChange={(e) => setNewQuantity(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl p-2 text-center font-mono" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Vendor / Supplier</label>
                <select value={newSupplierId} onChange={(e) => setNewSupplierId(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 bg-white">
                  <option value="">Manual / Local Supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Internal Reference / Location</label>
                <input type="text" placeholder="e.g. IT Department, server rack room" value={newRemarks} onChange={(e) => setNewRemarks(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2" />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setIsManualModalOpen(false)} className="px-3.5 py-2 border rounded-xl text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold">Save Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIVE PO MODAL */}
      {isReceivePoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-xl overflow-hidden animate-scale-in">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <div>
                <h3 className="font-bold font-display text-slate-800 text-base">Receive Asset Shipment from PO</h3>
                <p className="text-[10px] text-slate-500">Processes official use approved Purchase Orders into asset stocks.</p>
              </div>
              <button onClick={() => setIsReceivePoModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>

            <form onSubmit={handlePoReceiveSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Select Approved Official PO *</label>
                <select 
                  required value={selectedPoId} onChange={(e) => handlePoSelectionChange(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-white font-mono"
                >
                  <option value="" disabled>Select approved official PO...</option>
                  {officialPOs.map(po => {
                    const vendor = suppliers.find(s => s.id === po.supplierId);
                    return (
                      <option key={po.id} value={po.id}>
                        PO #{po.id.replace('tx-', '')} ({po.date}) - {vendor?.name || 'Local'} [{po.itemsBought}]
                      </option>
                    );
                  })}
                </select>
                {officialPOs.length === 0 && (
                  <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle size={12} />
                    <span>No approved "Official Use" Purchase Orders pending reception.</span>
                  </p>
                )}
              </div>

              {selectedPoId && itemsToReceive.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="font-bold text-slate-800 border-b pb-1">Configure Asset Parameters</p>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {itemsToReceive.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
                        <p className="font-bold text-slate-800">{item.quantity}x {item.name}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block uppercase font-mono">Category *</label>
                            <select value={item.type} onChange={(e) => handleReceiveItemTypeChange(idx, e.target.value as any)} className="w-full border rounded-lg p-1.5 bg-white">
                              <option value="Durable">Durable (DU)</option>
                              <option value="Non-Durable">Non-Durable (NONDU)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block uppercase font-mono">Unit Cost (Rs.) *</label>
                            <input 
                              type="number" step="any" required min="0.01" value={item.costPrice !== undefined ? item.costPrice : ''} onChange={(e) => handleReceiveItemCostChange(idx, e.target.value)}
                              className="w-full border rounded-lg p-1.5 text-right font-mono text-rose-600 font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setIsReceivePoModalOpen(false)} className="px-3.5 py-2 border rounded-xl text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={!selectedPoId} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold disabled:opacity-40">Complete Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-scale-in">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <div>
                <h3 className="font-bold font-display text-slate-800 text-base">{isAdmin ? "Edit Asset Parameters" : "Propose Asset Modification"}</h3>
                <p className="text-[10px] text-slate-500">{isAdmin ? "Admin direct modification mode." : "Proposed changes will go to Admin staff request center."}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Asset Description / Name *</label>
                <input 
                  type="text" required placeholder="e.g. Laptop" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Category *</label>
                  <select value={editType} onChange={(e) => setEditType(e.target.value as any)} className="w-full border border-slate-200 rounded-xl p-2 bg-white">
                    <option value="Durable">Durable (DU)</option>
                    <option value="Non-Durable">Non-Durable (NONDU)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Purchase Date *</label>
                  <input type="text" required placeholder="YYYY-MM-DD" value={editPurchaseDate} onChange={(e) => setEditPurchaseDate(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-center font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Cost Price (Rs.) *</label>
                  <input type="number" step="any" required min="0" value={editCostPrice !== undefined ? editCostPrice : ''} onChange={(e) => setEditCostPrice(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-right font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Quantity *</label>
                  <input type="number" required min="1" value={editQuantity} onChange={(e) => setEditQuantity(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl p-2 text-center font-mono" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Vendor / Supplier</label>
                <select value={editSupplierId} onChange={(e) => setEditSupplierId(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 bg-white">
                  <option value="">Manual / Local Supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Internal Reference / Location</label>
                <input type="text" placeholder="Location reference" value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2" />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-3.5 py-2 border rounded-xl text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold">{isAdmin ? "Apply Changes" : "Submit Proposal"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RELEASE ASSET MODAL (Admin only) */}
      {isReleaseModalOpen && releasingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-scale-in">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <div>
                <h3 className="font-bold font-display text-slate-800 text-base">Release of Company Assets</h3>
                <p className="text-[10px] text-rose-600 font-mono">Disposing, write-off, or destruction audit trail</p>
              </div>
              <button onClick={() => {
                setIsReleaseModalOpen(false);
                setReleasingAsset(null);
              }} className="p-1 text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>

            <form onSubmit={handleReleaseSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-rose-800">
                <p className="font-bold">Releasing: {releasingAsset.name} ({releasingAsset.assetCode})</p>
                <p className="text-[10px] mt-1">This marks the asset as completely retired, written-off, or decommissioned. The decision record cannot be altered.</p>
              </div>

              <div className="p-2.5 bg-slate-100 rounded-lg font-mono text-[11px] text-slate-700 flex justify-between items-center">
                <span className="font-bold uppercase text-slate-500">Release Ref No:</span>
                <span className="font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">{getNextReleaseReferenceNumber()}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Board Meeting Date *</label>
                  <input type="text" required placeholder="YYYY-MM-DD" value={releaseMeetingDate} onChange={(e) => setReleaseMeetingDate(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-center font-mono focus:ring-1 focus:ring-rose-500 bg-white" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Board Decision No. *</label>
                  <input type="text" required placeholder="e.g. RTSS-DEC-2083/14" value={releaseDecisionNo} onChange={(e) => setReleaseDecisionNo(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-center font-mono focus:ring-1 focus:ring-rose-500 bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Board Meeting Number *</label>
                  <input type="text" required placeholder="e.g. Meeting No. 42" value={releaseMeetingNumber} onChange={(e) => setReleaseMeetingNumber(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 focus:ring-1 focus:ring-rose-500 bg-white" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Release / Disposal Note *</label>
                <textarea 
                  required rows={2} placeholder="Provide reasons (e.g. hardware fused, unrecoverable mainboard)"
                  value={releaseNote} onChange={(e) => setReleaseNote(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:ring-1 focus:ring-rose-500 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Remarks</label>
                <input type="text" placeholder="e.g. Handed over to local waste recycler" value={releaseRemarks} onChange={(e) => setReleaseRemarks(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 focus:ring-1 focus:ring-rose-500 bg-white" />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => {
                  setIsReleaseModalOpen(false);
                  setReleasingAsset(null);
                }} className="px-3.5 py-2 border rounded-xl text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold">Decommission Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE SLIP MODAL */}
      {printingAsset && printingAsset.releaseInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static print:block">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden animate-scale-in print:border-none print:shadow-none print:rounded-none print:max-w-full print:w-full">
            <div className="px-6 py-4 bg-slate-50 border-b flex items-center justify-between no-print">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">Asset Release Audit Certificate</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    if (window.openUniversalPrintPreview) {
                      window.openUniversalPrintPreview({
                        documentType: 'Asset Register',
                        documentNumber: printingAsset.releaseInfo?.releaseNo || `AST-${printingAsset.id}`,
                        documentDate: printingAsset.releaseInfo?.releaseDate || getCurrentBsDate(),
                        profile: profile,
                        title: 'Official Fixed Asset Disposal & Release Certificate',
                        items: [
                          {
                            sn: 1,
                            name: printingAsset.name,
                            description: `Code: ${printingAsset.assetCode} | Serial: ${printingAsset.serialNumber || 'N/A'} | Condition: ${printingAsset.releaseInfo?.conditionAtRelease || 'Good'}`,
                            quantity: 1,
                            unitPrice: printingAsset.costValue,
                            totalPrice: printingAsset.releaseInfo?.salePrice || printingAsset.costValue
                          }
                        ],
                        subtotal: printingAsset.costValue,
                        grandTotal: printingAsset.releaseInfo?.salePrice || printingAsset.costValue,
                        notes: `Released To: ${printingAsset.releaseInfo?.releasedTo || 'N/A'}. Reason: ${printingAsset.releaseInfo?.reason || 'Asset Decommission'}. Authorized handover.`,
                        preparedBy: printingAsset.releaseInfo?.releasedBy || currentUser.name,
                        approvedBy: `${profile?.name || 'Authorized'} Custodian`
                      });
                    } else {
                      window.print();
                    }
                  }}
                  className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  <Printer size={12} />
                  <span>Print Slip</span>
                </button>
                <button onClick={() => setPrintingAsset(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X size={15} /></button>
              </div>
            </div>

            {/* Printable Area */}
            <div className="p-8 space-y-6 text-slate-800" id="printable-release-slip">
              {/* Header */}
              <div className="text-center space-y-1 border-b pb-4">
                <h1 className="text-lg font-extrabold uppercase font-display tracking-tight text-slate-900">Reliabletech Security Solution</h1>
                <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Asset Retirement & Release Certificate</p>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-2">
                  <span>Ref No: <strong className="text-indigo-700 font-bold">{printingAsset.releaseInfo.referenceNumber || 'N/A'}</strong></span>
                  <span>Date of Disposal: {printingAsset.releaseInfo.releasedAt}</span>
                </div>
              </div>

              {/* Asset Information Block */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider border-b pb-1">1. Decommissioned Asset details</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-400 font-mono text-[10px] uppercase">Asset Name</p>
                    <p className="font-bold text-slate-900">{printingAsset.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-mono text-[10px] uppercase">Official Asset Code</p>
                    <p className="font-mono font-bold text-slate-900">{printingAsset.assetCode}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-mono text-[10px] uppercase">Classification Category</p>
                    <p className="font-semibold text-slate-800">{printingAsset.type}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-mono text-[10px] uppercase">Purchase Date / Cost</p>
                    <p className="font-mono text-slate-800">{printingAsset.purchaseDate} {isAdmin ? `(Rs. ${printingAsset.costPrice.toLocaleString()})` : ''}</p>
                  </div>
                </div>
              </div>

              {/* Administrative Authority Block */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider border-b pb-1">2. Board Decision & Audit logs</h3>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="text-slate-400 font-mono text-[10px] uppercase">Meeting Date (B.S.)</p>
                    <p className="font-mono font-bold text-slate-800">{printingAsset.releaseInfo.meetingDate}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-mono text-[10px] uppercase">Meeting Number</p>
                    <p className="font-mono font-bold text-slate-800">{printingAsset.releaseInfo.meetingNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-mono text-[10px] uppercase">Official Decision No.</p>
                    <p className="font-mono font-bold text-indigo-700">{printingAsset.releaseInfo.decisionNumber}</p>
                  </div>
                </div>
                <div className="text-xs bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                  <div>
                    <p className="text-slate-400 font-mono text-[10px] uppercase">Official Disposal Reason Note</p>
                    <p className="mt-1 italic text-slate-700 leading-relaxed font-serif">"{printingAsset.releaseInfo.note}"</p>
                  </div>
                  {printingAsset.releaseInfo.remarks && (
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-slate-400 font-mono text-[10px] uppercase">Remarks</p>
                      <p className="mt-0.5 text-slate-700 font-mono text-[10px]">{printingAsset.releaseInfo.remarks}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs">
                <div className="space-y-10">
                  <div className="border-t border-slate-300 w-44 mx-auto pt-1 text-slate-500 font-mono text-[10px]">
                    PREPARED BY
                  </div>
                </div>
                <div className="space-y-10">
                  <div className="border-t border-slate-300 w-44 mx-auto pt-1 text-slate-500 font-mono text-[10px]">
                    ADMINISTRATOR SIGNATURE
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
