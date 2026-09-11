import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  AlertCircle,
  Phone,
  MapPin,
  User,
  PlusCircle,
  Wrench,
  Receipt,
  FileCheck2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ServiceRequest, ServiceRequestItem, AppUser } from '../types';
import { InteractiveSearchBar } from './InteractiveSearchBar';

interface ServiceRequestsListProps {
  serviceRequests: ServiceRequest[];
  onAddServiceRequest: (req: Omit<ServiceRequest, 'id' | 'requestNo' | 'dateCreated'>) => void;
  onEditServiceRequest: (req: ServiceRequest) => void;
  onDeleteServiceRequest: (id: string) => void;
  onBillServiceRequest: (req: ServiceRequest) => void;
  currentUser: AppUser;
}

export const ServiceRequestsList: React.FC<ServiceRequestsListProps> = ({
  serviceRequests,
  onAddServiceRequest,
  onEditServiceRequest,
  onDeleteServiceRequest,
  onBillServiceRequest,
  currentUser
}) => {
  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ServiceRequest | null>(null);

  // Form fields for Service Request
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [status, setStatus] = useState<'On Process' | 'Completed' | 'Delivered' | 'Cancelled'>('On Process');
  
  // Temporary fields for adding service items within form
  const [items, setItems] = useState<ServiceRequestItem[]>([]);
  const [tempItemName, setTempItemName] = useState('');
  const [tempReason, setTempReason] = useState('');
  const [tempSolution, setTempSolution] = useState('');
  const [tempPrice, setTempPrice] = useState<number | string>(0);

  const openAddForm = () => {
    setEditingRequest(null);
    setCustomerName('');
    setCustomerAddress('');
    setCustomerContact('');
    setStatus('On Process');
    setItems([]);
    setTempItemName('');
    setTempReason('');
    setTempSolution('');
    setTempPrice(0);
    setIsFormOpen(true);
  };

  const openEditForm = (req: ServiceRequest) => {
    setEditingRequest(req);
    setCustomerName(req.customerName);
    setCustomerAddress(req.customerAddress);
    setCustomerContact(req.customerContact);
    setStatus(req.status);
    setItems(req.items || []);
    setTempItemName('');
    setTempReason('');
    setTempSolution('');
    setTempPrice(0);
    setIsFormOpen(true);
  };

  const handleAddServiceItem = () => {
    if (!tempItemName.trim()) {
      alert('Please provide an item name.');
      return;
    }
    const numPrice = typeof tempPrice === 'number' ? tempPrice : (parseFloat(tempPrice) || 0);
    const newItem: ServiceRequestItem = {
      itemName: tempItemName.trim(),
      reason: tempReason.trim(),
      solution: tempSolution.trim(),
      price: numPrice
    };
    setItems(prev => [...prev, newItem]);
    // Clear item inputs
    setTempItemName('');
    setTempReason('');
    setTempSolution('');
    setTempPrice(0);
  };

  const handleRemoveServiceItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Please provide customer name.');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one service item to this request.');
      return;
    }

    if (editingRequest) {
      onEditServiceRequest({
        ...editingRequest,
        customerName: customerName.trim(),
        customerAddress: customerAddress.trim(),
        customerContact: customerContact.trim(),
        items,
        status
      });
    } else {
      onAddServiceRequest({
        customerName: customerName.trim(),
        customerAddress: customerAddress.trim(),
        customerContact: customerContact.trim(),
        items,
        status
      });
    }
    setIsFormOpen(false);
  };

  // Filter requests
  const filteredRequests = serviceRequests.filter(req => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      req.requestNo.toLowerCase().includes(term) ||
      req.customerName.toLowerCase().includes(term) ||
      req.customerContact.toLowerCase().includes(term) ||
      req.customerAddress.toLowerCase().includes(term) ||
      req.items.some(it => it.itemName.toLowerCase().includes(term) || it.reason.toLowerCase().includes(term) || it.solution.toLowerCase().includes(term));
    
    const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-display flex items-center gap-2">
            <Wrench className="text-indigo-600" />
            <span>Service Requests Registry</span>
          </h2>
          <p className="text-xs text-slate-500">Track and manage customer devices, service requests, solutions, pricing, and billing statuses.</p>
        </div>
        <button 
          onClick={openAddForm}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition duration-200 shrink-0 cursor-pointer"
          id="btn-add-service-request"
        >
          <Plus size={16} />
          <span>New Service Request</span>
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <InteractiveSearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search request number, customer name, contacts, items, solutions..."
            expandedWidth="w-full max-w-md"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="On Process">On Process</option>
            <option value="Completed">Completed</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Service Requests Table / Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 uppercase font-mono tracking-wider text-[10px]">
                <th className="px-6 py-4 font-bold">Request No</th>
                <th className="px-6 py-4 font-bold">Date Created</th>
                <th className="px-6 py-4 font-bold">Customer Details</th>
                <th className="px-6 py-4 font-bold">Serviced Items</th>
                <th className="px-6 py-4 font-bold text-right">Total Price</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-center">Billing Link</th>
                <th className="px-6 py-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 font-sans">
              {filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(req => {
                const totalAmount = req.items.reduce((sum, item) => sum + item.price, 0);
                
                return (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition duration-150">
                    {/* ID */}
                    <td className="px-6 py-4.5 font-bold font-mono text-indigo-600 text-xs">
                      {req.requestNo}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4.5 text-slate-500 font-mono text-xs">
                      {req.dateCreated}
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4.5 space-y-1 max-w-[200px]">
                      <p className="font-bold text-slate-800 text-sm">{req.customerName}</p>
                      <p className="text-slate-500 flex items-center gap-1">
                        <MapPin size={11} className="text-slate-400" />
                        <span>{req.customerAddress || 'N/A'}</span>
                      </p>
                      <p className="text-slate-500 flex items-center gap-1 font-mono">
                        <Phone size={11} className="text-slate-400" />
                        <span>{req.customerContact || 'N/A'}</span>
                      </p>
                    </td>

                    {/* Serviced items */}
                    <td className="px-6 py-4.5 space-y-2 max-w-[280px]">
                      {req.items.map((it, idx) => (
                        <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] space-y-0.5">
                          <p className="font-bold text-slate-800 flex justify-between">
                            <span>• {it.itemName}</span>
                            <span className="font-mono text-indigo-600 font-semibold">Rs. {it.price.toLocaleString()}</span>
                          </p>
                          {it.reason && (
                            <p className="text-slate-500 text-[10px]">
                              <span className="font-semibold text-slate-400 uppercase text-[9px] font-mono">Problem: </span> 
                              {it.reason}
                            </p>
                          )}
                          {it.solution && (
                            <p className="text-emerald-700 text-[10px]">
                              <span className="font-semibold text-emerald-500 uppercase text-[9px] font-mono">Solution: </span> 
                              {it.solution}
                            </p>
                          )}
                        </div>
                      ))}
                    </td>

                    {/* Total Price */}
                    <td className="px-6 py-4.5 text-right font-extrabold text-slate-850 font-mono text-sm">
                      Rs. {totalAmount.toLocaleString()}
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4.5 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        req.status === 'On Process' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        req.status === 'Completed' ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse' :
                        req.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {req.status === 'On Process' ? '⚡ On Process' :
                         req.status === 'Completed' ? '✅ Completed' :
                         req.status === 'Delivered' ? '📦 Delivered' :
                         '❌ Cancelled'}
                      </span>
                    </td>

                    {/* Billing Actions */}
                    <td className="px-6 py-4.5 text-center whitespace-nowrap">
                      {req.billedInvoiceId ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono">
                            <FileCheck2 size={10} />
                            <span>Billed</span>
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5">ID: {req.billedInvoiceId}</span>
                        </div>
                      ) : req.status === 'Completed' ? (
                        <button
                          onClick={() => onBillServiceRequest(req)}
                          className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg shadow-xs hover:shadow-sm transition cursor-pointer"
                        >
                          <Receipt size={11} />
                          <span>Bill & Dispatch</span>
                        </button>
                      ) : req.status === 'Cancelled' ? (
                        <span className="text-[10px] text-slate-400 italic font-mono">No Billing</span>
                      ) : req.status === 'Delivered' ? (
                        <span className="text-[10px] text-emerald-600 italic font-mono font-bold">Paid & Delivered</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Awaiting completion</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => openEditForm(req)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          title="Edit Service Request"
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
                            if (confirm(`Are you sure you want to delete service request ${req.requestNo}?`)) {
                              onDeleteServiceRequest(req.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title={currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin' ? "Delete Service Request" : "Delete (System Master Only)"}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="text-2xl">🔧</p>
                    <p className="text-xs font-semibold mt-2">No service requests found</p>
                    <p className="text-[10px] text-slate-400 mt-1">Try modifying your search or click "New Service Request" to log a repair job.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredRequests.length > 0 && (
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
                Showing {Math.min(filteredRequests.length, (currentPage - 1) * pageSize + 1)}-{Math.min(currentPage * pageSize, filteredRequests.length)} of {filteredRequests.length} entries
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
                  Page {currentPage} of {Math.ceil(filteredRequests.length / pageSize)}
                </span>
                <button
                  disabled={currentPage >= Math.ceil(filteredRequests.length / pageSize)}
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

      {/* Request Form Dialog Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden animate-scale-in max-h-[calc(100dvh-2rem)] my-auto flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold font-display text-slate-800 text-lg">
                  {editingRequest ? `Edit Service Request: ${editingRequest.requestNo}` : 'New Service Request Log'}
                </h3>
                <p className="text-[11px] text-slate-500">Log client repair, maintenance requirements, and individual solutions.</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 font-sans">
              
              {/* Group 1: Customer Info */}
              <div className="space-y-3 bg-indigo-50/20 border border-indigo-100/20 p-4 rounded-xl">
                <p className="text-[10px] font-mono uppercase tracking-wider text-indigo-700 font-extrabold flex items-center gap-1.5">
                  <User size={12} />
                  <span>Customer Information</span>
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Customer Name *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Shyam Thapa"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Address *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Fikkal Bazar, Ilam"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Contact Number *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. 9852654321"
                      value={customerContact}
                      onChange={(e) => setCustomerContact(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Status */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Job Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="On Process">On Process</option>
                  <option value="Completed">Completed</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <p className="text-[10px] text-slate-400">
                  Changing to <strong className="text-amber-600">Completed</strong> unlocks the instant-billing feature in your list.
                </p>
              </div>

              {/* Group 3: Items Builder */}
              <div className="space-y-3 border border-slate-150 p-4 rounded-xl bg-slate-50/50">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-extrabold flex items-center gap-1.5">
                  <Wrench size={12} />
                  <span>Item and Issue Log</span>
                </p>

                {/* Single Item Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-150 shadow-3xs">
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[11px] font-bold text-slate-600 block">Item Name *</label>
                    <input 
                      type="text"
                      placeholder="e.g. Asus Vivobook Pro Laptop"
                      value={tempItemName}
                      onChange={(e) => setTempItemName(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[11px] font-bold text-slate-600 block">Price / Charge (Rs.)</label>
                    <input 
                      type="number"
                      step="any"
                      min="0"
                      placeholder="e.g. 1500"
                      value={tempPrice !== undefined ? tempPrice : ''}
                      onChange={(e) => setTempPrice(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-hidden font-mono"
                    />
                  </div>

                  <div className="space-y-1 col-span-2">
                    <label className="text-[11px] font-bold text-slate-600 block">Reason / Problem</label>
                    <input 
                      type="text"
                      placeholder="e.g. Keyboard keys not responding & thermal throttling"
                      value={tempReason}
                      onChange={(e) => setTempReason(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1 col-span-2">
                    <label className="text-[11px] font-bold text-slate-600 block">Solution / Action Taken</label>
                    <input 
                      type="text"
                      placeholder="e.g. Replaced original keyboard & applied premium cooling paste"
                      value={tempSolution}
                      onChange={(e) => setTempSolution(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-hidden"
                    />
                  </div>

                  <div className="col-span-2 pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddServiceItem}
                      className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      <PlusCircle size={12} />
                      <span>Add Item to Request</span>
                    </button>
                  </div>
                </div>

                {/* Added Items List */}
                <div className="space-y-2 mt-2">
                  <p className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Logged Request Items ({items.length}):</p>
                  {items.length === 0 ? (
                    <div className="text-center p-4 bg-white/50 rounded-xl border border-dashed border-slate-200 text-[11px] text-slate-400 font-sans">
                      No items logged yet. Please fill the item details above and click "Add Item to Request".
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {items.map((it, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs shadow-3xs">
                          <div className="flex-1 space-y-0.5">
                            <p className="font-bold text-slate-800">
                              <span className="text-slate-400 mr-1">#{idx+1}</span>
                              {it.itemName}
                              <span className="font-mono text-indigo-600 font-semibold ml-2">Rs. {it.price.toLocaleString()}</span>
                            </p>
                            {it.reason && <p className="text-[10px] text-slate-500"><strong className="text-slate-400">Problem:</strong> {it.reason}</p>}
                            {it.solution && <p className="text-[10px] text-slate-500"><strong className="text-emerald-500">Solution:</strong> {it.solution}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveServiceItem(idx)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition shrink-0 cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
                <span className="text-xs font-mono font-bold text-slate-700">
                  Total Request Charge: Rs. {items.reduce((sum, item) => sum + item.price, 0).toLocaleString()}
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4.5 py-2 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Check size={14} />
                    <span>{editingRequest ? 'Update Request' : 'Save Request'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
