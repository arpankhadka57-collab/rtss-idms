import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  Tag, 
  DollarSign, 
  PlusCircle, 
  Info,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { BusinessService, AppUser } from '../types';
import { getCurrentBsDate } from '../utils/nepaliDate';
import { InteractiveSearchBar } from './InteractiveSearchBar';

interface ServicesListProps {
  services: BusinessService[];
  onAddService: (service: Omit<BusinessService, 'id'>) => void;
  onEditService: (service: BusinessService) => void;
  onDeleteService: (id: string) => void;
  units?: string[];
  currentUser?: AppUser;
}

export const ServicesList: React.FC<ServicesListProps> = ({
  services,
  onAddService,
  onEditService,
  onDeleteService,
  units,
  currentUser
}) => {
  // State managers
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<BusinessService | null>(null);

  // Form Fields state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Networking');
  const [customCategory, setCustomCategory] = useState('');
  const [priceRate, setPriceRate] = useState<number | string>(0);
  const [rateType, setRateType] = useState<string>('Flat');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Discontinued' | 'Under Maintenance'>('Active');

  // Available categories preset
  const presetCategories = Array.from(new Set(['Security', 'Networking', 'Hardware', 'Software', 'Maintenance', ...services.map(s => s.category)]));

  const openAddForm = () => {
    setEditingService(null);
    setName('');
    setCategory('Networking');
    setCustomCategory('');
    setPriceRate(0);
    setRateType('Flat');
    setDescription('');
    setStatus('Active');
    setIsFormOpen(true);
  };

  const openEditForm = (service: BusinessService) => {
    setEditingService(service);
    setName(service.name);
    if (presetCategories.includes(service.category)) {
      setCategory(service.category);
      setCustomCategory('');
    } else {
      setCategory('Other');
      setCustomCategory(service.category);
    }
    setPriceRate(service.priceRate);
    setRateType(service.rateType);
    setDescription(service.description);
    setStatus(service.status);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory = category === 'Other' ? (customCategory.trim() || 'General') : category;
    const numPrice = typeof priceRate === 'number' ? priceRate : (parseFloat(priceRate) || 0);

    if (editingService) {
      onEditService({
        id: editingService.id,
        name: name.trim(),
        category: finalCategory,
        priceRate: numPrice,
        rateType,
        description: description.trim(),
        status,
        dateAdded: editingService.dateAdded
      });
    } else {
      onAddService({
        name: name.trim(),
        category: finalCategory,
        priceRate: numPrice,
        rateType,
        description: description.trim(),
        status,
        dateAdded: getCurrentBsDate()
      });
    }
    setIsFormOpen(false);
  };

  // Filter services
  const filteredServices = services.filter(srv => {
    const matchesSearch = srv.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          srv.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || srv.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || srv.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-display">Services Catalog</h2>
          <p className="text-xs text-slate-500">Add, edit, or discontinue technology solutions offered by Reliabletech.</p>
        </div>
        <button 
          onClick={openAddForm}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition duration-200 shrink-0 cursor-pointer"
          id="btn-add-service"
        >
          <Plus size={16} />
          <span>New Service Rate</span>
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <InteractiveSearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search service names, catalog details..."
            expandedWidth="w-full max-w-md"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Layers size={14} className="text-slate-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-40 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="All">All Categories</option>
              {presetCategories.filter(c => c !== 'Other').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <SlidersHorizontal size={14} className="text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-40 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Discontinued">Discontinued</option>
            </select>
          </div>
        </div>
      </div>

      {/* Services List / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(srv => (
          <div 
            key={srv.id} 
            className="bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group"
            id={`service-card-${srv.id}`}
          >
            {/* Top accent */}
            <div className={`h-1.5 w-full ${
              srv.status === 'Active' ? 'bg-emerald-500' :
              srv.status === 'Under Maintenance' ? 'bg-amber-400' : 'bg-slate-400'
            }`}></div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                {/* Category and Status Pill */}
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium bg-slate-50 text-slate-600 border border-slate-100">
                    <Tag size={10} />
                    {srv.category}
                  </span>
                  
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold ${
                    srv.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                    srv.status === 'Under Maintenance' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {srv.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 font-display text-lg group-hover:text-indigo-600 transition duration-150">
                  {srv.name}
                </h3>
                
                <p className="text-xs text-slate-500 leading-relaxed min-h-[48px] line-clamp-3">
                  {srv.description}
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                {/* Rate details */}
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Rate / Price</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-900 font-display">Rs. {srv.priceRate.toLocaleString()}</span>
                    <span className="text-xs text-slate-500"> / {srv.rateType}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400 font-mono text-[10px]">Added: {srv.dateAdded}</span>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openEditForm(srv)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                      title="Edit Service"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      onClick={() => {
                        const isSystemMaster = currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin';
                        if (!isSystemMaster) {
                          alert('Direct deletion is allowed for System Master (@reliableadmin) only.');
                          return;
                        }
                        if (confirm(`Are you sure you want to delete ${srv.name}?`)) {
                          onDeleteService(srv.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title={currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin' ? "Delete Service" : "Delete (System Master Only)"}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredServices.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border border-slate-100 p-12 text-center space-y-3">
            <p className="text-3xl">📭</p>
            <h4 className="font-bold text-slate-700">No services match your filters</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try adjusting your text search, resetting filters, or add a brand new service rate category.
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {filteredServices.length > 0 && (
        <div className="p-4 border border-slate-100 bg-white rounded-xl shadow-2xs flex flex-col sm:flex-row justify-between items-center gap-4">
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
              Showing {Math.min(filteredServices.length, (currentPage - 1) * pageSize + 1)}-{Math.min(currentPage * pageSize, filteredServices.length)} of {filteredServices.length} entries
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
                Page {currentPage} of {Math.ceil(filteredServices.length / pageSize)}
              </span>
              <button
                disabled={currentPage >= Math.ceil(filteredServices.length / pageSize)}
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

      {/* Form Dialog Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg max-h-[calc(100dvh-2rem)] my-auto overflow-hidden flex flex-col animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold font-display text-slate-800 text-lg">
                  {editingService ? 'Edit Service Rate' : 'New Service Offering'}
                </h3>
                <p className="text-[11px] text-slate-500">Provide rates and operational category details.</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Service Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Service Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. CCTV Security Installation, Server Maintenance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Category selector */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Category *</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Networking">Networking</option>
                    <option value="Security">Security</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Other">Other / Custom</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Pricing Structure *</label>
                  <select 
                    value={rateType}
                    onChange={(e) => setRateType(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    {(units && units.length > 0 ? units : ['Flat', 'Hourly', 'Monthly', 'Per Unit', 'kg', 'ltr', 'pcs', 'box', 'packet']).map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                    {rateType && !(units || []).includes(rateType) && (
                      <option value={rateType}>{rateType}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Custom category if "Other" */}
              {category === 'Other' && (
                <div className="space-y-1 animate-fade-in">
                  <label className="text-xs font-semibold text-slate-700 block">Specify Category *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Consulting, Printing, Training"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Price rate and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Standard Rate (Rs.) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">Rs.</span>
                    <input 
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder="Price"
                      value={priceRate !== undefined ? priceRate : ''}
                      onChange={(e) => setPriceRate(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Catalog Status *</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Service Description</label>
                <textarea 
                  rows={3}
                  placeholder="Describe the details, requirements, or inclusions for this technical service catalog item..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Modal Actions */}
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
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Check size={14} />
                  <span>{editingService ? 'Update Service' : 'Save Service'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
