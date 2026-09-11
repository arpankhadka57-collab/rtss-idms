import React, { useState } from 'react';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  FileText,
  X,
  AlertCircle,
  ShieldCheck,
  Printer,
  ChevronRight,
  ExternalLink,
  Receipt,
  Download,
  History,
  QrCode
} from 'lucide-react';
import { EcommerceOrder, BusinessProfile } from '../types';
import { OfficialTaxInvoiceModal } from './OfficialTaxInvoiceModal';

interface CustomerOrderTrackerModalProps {
  orders: EcommerceOrder[];
  profile?: BusinessProfile;
  companyProfile?: BusinessProfile;
  initialOrderId?: string;
  onClose: () => void;
  onViewReceipt: (order: EcommerceOrder) => void;
  onViewInvoice?: (order: EcommerceOrder) => void;
}

export function CustomerOrderTrackerModal({
  orders,
  profile,
  companyProfile,
  initialOrderId = '',
  onClose,
  onViewReceipt,
  onViewInvoice
}: CustomerOrderTrackerModalProps) {
  const activeProfile = companyProfile || profile || {
    name: 'Reliable Computers & Technical Institute',
    location: 'Suryodaya-10, Fikkal, Ilam, Nepal',
    phone: '9852680780',
    email: 'info@reliabletech.com.np',
    panNumber: '302482391'
  };

  const [searchQuery, setSearchQuery] = useState(initialOrderId);
  const [selectedOrder, setSelectedOrder] = useState<EcommerceOrder | null>(
    orders.find((o) => o.order_id.toLowerCase() === initialOrderId.toLowerCase()) || (orders.length > 0 ? orders[0] : null)
  );
  const [searchError, setSearchError] = useState('');
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<EcommerceOrder | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchError('Please enter an Order ID or Phone number.');
      return;
    }

    const found = orders.find(
      (o) =>
        o.order_id.toLowerCase() === query ||
        o.order_id.toLowerCase().includes(query) ||
        o.customer_phone.includes(query) ||
        (o.tracking_number && o.tracking_number.toLowerCase().includes(query)) ||
        (o.sales_invoice_no && o.sales_invoice_no.toLowerCase().includes(query))
    );

    if (found) {
      setSelectedOrder(found);
    } else {
      setSelectedOrder(null);
      setSearchError(`No order found matching "${searchQuery}". Please check your order reference number.`);
    }
  };

  // Helper to determine step index based on state
  const getStepIndex = (state: string) => {
    switch (state) {
      case 'Pending Verification':
        return 1;
      case 'Processing/Packing':
        return 2;
      case 'Dispatched via Courier':
        return 3;
      case 'Delivered & Closed':
        return 4;
      case 'Cancelled':
        return -1;
      default:
        return 1;
    }
  };

  const steps = [
    { label: 'Order Received', desc: 'Order logged into ReliableTech dispatch system' },
    { label: 'Payment & Verification', desc: 'Payment verified or Cash-on-Delivery confirmed' },
    { label: 'Packaging & QC Test', desc: 'Items checked and sealed at Fikkal Service Hub' },
    { label: 'Dispatched with Courier', desc: 'Handed over for regional delivery' },
    { label: 'Delivered & Closed', desc: 'Delivered to customer destination & Sales Invoice issued' }
  ];

  const handleOpenInvoice = (order: EcommerceOrder) => {
    if (onViewInvoice) {
      onViewInvoice(order);
    } else {
      setActiveInvoiceOrder(order);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] my-auto">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-sky-800 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-sky-300" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">Track Your Order &amp; Delivery</h3>
              <p className="text-[11px] text-sky-200">Real-time status tracker, Order History &amp; Official Tax Invoice download</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Search Box */}
          <form onSubmit={handleSearch} className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Enter Order ID, Phone Number or Invoice Ref:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. RTSS-ECOM-2083001, 98526XXXXX, or INV-2083-0001"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 font-semibold"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Track</span>
                <ChevronRight size={14} />
              </button>
            </div>
            {searchError && (
              <p className="text-xs font-medium text-rose-600 flex items-center gap-1">
                <AlertCircle size={13} /> {searchError}
              </p>
            )}
          </form>

          {/* Quick Order History Pill Selector */}
          {orders && orders.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold flex items-center gap-1">
                  <History size={13} className="text-sky-600" />
                  <span>Your Order History ({orders.length} orders recorded):</span>
                </span>
                <span className="text-[10px] text-slate-400">Click any order to inspect</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {orders.map((ord) => {
                  const isSelected = selectedOrder?.order_id === ord.order_id;
                  const hasInvoice = !!(ord.sales_invoice_no || ord.sales_invoice_id || ord.order_state === 'Delivered & Closed');
                  return (
                    <button
                      key={ord.order_id}
                      type="button"
                      onClick={() => {
                        setSelectedOrder(ord);
                        setSearchQuery(ord.order_id);
                        setSearchError('');
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium shrink-0 transition flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-sky-900 text-white border-sky-950 shadow-xs'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <span className="font-mono font-bold">#{ord.order_id}</span>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                        ord.order_state === 'Delivered & Closed'
                          ? isSelected ? 'bg-emerald-400 text-emerald-950' : 'bg-emerald-100 text-emerald-800'
                          : ord.order_state === 'Cancelled'
                          ? isSelected ? 'bg-rose-400 text-rose-950' : 'bg-rose-100 text-rose-800'
                          : isSelected ? 'bg-amber-400 text-amber-950' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.order_state === 'Delivered & Closed' ? 'Delivered' : ord.order_state}
                      </span>
                      {hasInvoice && (
                        <span className="text-[9px] bg-indigo-500/20 text-indigo-200 px-1 rounded font-mono" title="Sales Invoice Generated">
                          INV
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* If Order is Selected */}
          {selectedOrder ? (
            <div className="space-y-5 animate-fade-in">
              
              {/* Order Status Badge & Top Bar */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-slate-900">
                      #{selectedOrder.order_id}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                        selectedOrder.order_state === 'Delivered & Closed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedOrder.order_state === 'Dispatched via Courier'
                          ? 'bg-sky-100 text-sky-800'
                          : selectedOrder.order_state === 'Processing/Packing'
                          ? 'bg-indigo-100 text-indigo-800'
                          : selectedOrder.order_state === 'Cancelled'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}
                    >
                      {selectedOrder.order_state}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Placed on {selectedOrder.created_at} &bull; Destination: {selectedOrder.municipality} ({selectedOrder.ward})
                  </p>
                  {selectedOrder.sales_invoice_no && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-indigo-800 font-bold">
                      <Receipt size={13} className="text-indigo-600" />
                      <span>Official Sales Invoice Ref: <strong className="font-mono">{selectedOrder.sales_invoice_no}</strong> ({selectedOrder.sales_invoice_date || 'BS'})</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onViewReceipt(selectedOrder)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <FileText size={13} />
                    <span>Order Receipt</span>
                  </button>

                  {/* PROMINENT OFFICIAL TAX INVOICE DOWNLOAD & PRINT (When staff converted to invoice or delivered) */}
                  {(selectedOrder.sales_invoice_no || selectedOrder.sales_invoice_id || selectedOrder.order_state === 'Delivered & Closed') && (
                    <button
                      type="button"
                      onClick={() => handleOpenInvoice(selectedOrder)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-sky-700 hover:from-indigo-700 hover:to-sky-800 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer animate-pulse"
                      title="Download or Print Computer Generated Tax Invoice with QR Code"
                    >
                      <Printer size={13} />
                      <span>Download Official Invoice</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Cancellation & Reverse Voucher Alert (If Order Cancelled) */}
              {selectedOrder.order_state === 'Cancelled' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs text-rose-950">
                  <div className="flex items-center gap-2 font-bold text-rose-900">
                    <AlertCircle size={16} className="text-rose-600 shrink-0" />
                    <span>Order Cancelled &amp; Settlement Recorded</span>
                  </div>
                  {selectedOrder.cancellation_remarks && (
                    <p className="text-rose-800 bg-white/70 p-2.5 rounded-lg border border-rose-100">
                      <strong>Cancellation Remarks:</strong> {selectedOrder.cancellation_remarks}
                    </p>
                  )}
                  {selectedOrder.is_refunded && (
                    <div className="p-2.5 bg-white rounded-lg border border-rose-200 font-mono text-[11px] text-rose-900 space-y-1">
                      <div className="flex justify-between">
                        <span>Reverse Voucher / Refund Ref:</span>
                        <strong>{selectedOrder.refund_transaction_id || 'REV-VOUCHER'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Refund Amount:</span>
                        <strong className="text-emerald-700">NPR {(selectedOrder.refund_amount || selectedOrder.total_amount_npr).toLocaleString()}</strong>
                      </div>
                      {selectedOrder.refund_payment_method && (
                        <div className="flex justify-between">
                          <span>Refund Settlement Mode:</span>
                          <strong>{selectedOrder.refund_payment_method}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Progress Steps Timeline */}
              {selectedOrder.order_state !== 'Cancelled' && (
                <div className="py-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-4">
                    Fulfillment &amp; Delivery Progress
                  </span>
                  
                  <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
                    {steps.map((step, idx) => {
                      const currentStepIdx = getStepIndex(selectedOrder.order_state);
                      const isCompleted = currentStepIdx >= idx;
                      const isCurrent = currentStepIdx === idx;

                      return (
                        <div key={idx} className="relative pl-6">
                          {/* Dot */}
                          <div
                            className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              isCompleted
                                ? 'bg-emerald-500 border-emerald-600 text-white'
                                : 'bg-white border-slate-300 text-slate-300'
                            }`}
                          >
                            {isCompleted ? <CheckCircle2 size={10} /> : <div className="w-1 h-1 rounded-full bg-slate-300" />}
                          </div>

                          <div>
                            <span
                              className={`text-xs font-bold block ${
                                isCurrent
                                  ? 'text-sky-700'
                                  : isCompleted
                                  ? 'text-slate-900'
                                  : 'text-slate-400'
                              }`}
                            >
                              {step.label}
                            </span>
                            <span className="text-[11px] text-slate-500 block leading-tight">
                              {step.desc}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Courier Information (if dispatched) */}
              {selectedOrder.assigned_courier && (
                <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200 flex items-center justify-between text-xs text-sky-950">
                  <div className="flex items-center gap-2">
                    <Truck size={16} className="text-sky-600 shrink-0" />
                    <div>
                      <span className="font-bold block">Assigned Delivery Rider:</span>
                      <span className="font-semibold">{selectedOrder.assigned_courier}</span>
                    </div>
                  </div>
                  {selectedOrder.tracking_number && (
                    <div className="text-right">
                      <span className="text-[10px] text-sky-600 block uppercase font-bold">Courier Waybill No</span>
                      <span className="font-mono font-bold text-sky-900">{selectedOrder.tracking_number}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Items Summary */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Ordered Items ({selectedOrder.items.length})
                </span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="p-3 flex justify-between items-center bg-white hover:bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-900 block">{item.product_name}</span>
                        <span className="text-[11px] text-slate-500">Qty: {item.quantity} units</span>
                      </div>
                      <span className="font-bold font-mono text-slate-900">
                        NPR {(item.final_price_npr * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="p-3 bg-slate-50 flex justify-between items-center font-bold text-xs">
                    <span>Grand Total (Including Delivery):</span>
                    <span className="text-sm font-mono text-sky-700">
                      NPR {(selectedOrder.total_amount_npr || selectedOrder.grand_total_npr || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Official Tax Invoice Download Banner */}
              {(selectedOrder.sales_invoice_no || selectedOrder.sales_invoice_id || selectedOrder.order_state === 'Delivered & Closed') && (
                <div className="p-4 bg-gradient-to-r from-indigo-50 via-sky-50 to-indigo-50 rounded-xl border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <QrCode size={20} />
                    </div>
                    <div>
                      <span className="font-black text-indigo-950 block">Official Computer-Generated Tax Invoice Available</span>
                      <p className="text-[11px] text-slate-600">
                        Includes header QR verification, PAN breakdown, digital signature disclaimer &amp; no physical stamp required.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenInvoice(selectedOrder)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                  >
                    <Download size={14} />
                    <span>Download Invoice</span>
                  </button>
                </div>
              )}

              {/* Maintenance & Support Banner */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-950">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
                  <span>Includes ReliableTech 1-Year Hardware Warranty &amp; Fikkal Service Support</span>
                </div>
                <button
                  type="button"
                  onClick={() => onViewReceipt(selectedOrder)}
                  className="font-bold text-emerald-700 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Printer size={12} />
                  <span>Print Receipt</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="text-center py-10 space-y-2 text-slate-500">
              <Package size={36} className="mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-700">No Order Selected</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Enter your order number or phone number above to see real-time dispatch and delivery progress.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Phone size={12} className="text-slate-400" /> Helpline: {activeProfile.phone || '+977-9852680456'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      {/* Embedded Official Tax Invoice Modal */}
      {activeInvoiceOrder && (
        <OfficialTaxInvoiceModal
          order={activeInvoiceOrder}
          profile={activeProfile}
          onClose={() => setActiveInvoiceOrder(null)}
        />
      )}
    </div>
  );
}
