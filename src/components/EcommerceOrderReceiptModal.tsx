import React from 'react';
import { 
  Printer, 
  Mail,
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Wrench, 
  MapPin, 
  Phone, 
  Building2, 
  Calendar, 
  Package, 
  FileText,
  Clock,
  Sparkles,
  QrCode
} from 'lucide-react';
import { EcommerceOrder, BusinessProfile } from '../types';

interface EcommerceOrderReceiptModalProps {
  order: EcommerceOrder;
  profile?: BusinessProfile;
  companyProfile?: BusinessProfile;
  onClose: () => void;
}

// Convert numbers into simple English currency words
function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  }

  const rounded = Math.round(num);
  return inWords(rounded) + ' Rupees Only';
}

export function EcommerceOrderReceiptModal({
  order,
  profile,
  companyProfile,
  onClose
}: EcommerceOrderReceiptModalProps) {
  const activeProfile = companyProfile || profile || {
    name: 'Reliable Computers & Technical Institute',
    location: 'Suryodaya-10, Fikkal, Ilam, Nepal',
    address: 'Suryodaya-10, Fikkal, Ilam, Nepal',
    phone: '9852680780',
    email: 'info@reliabletech.com.np',
    panNumber: '302482391'
  };
  const isVerified = order.payment_verification_status === 'Verified' || order.payment_verification_status === 'Approved' || order.order_state === 'Delivered & Closed';
  const totalAmount = order.total_amount_npr || order.grand_total_npr || 0;

  const handleSendEmail = () => {
    const recipientEmail = order.customer_email || '';
    const recipientName = order.customer_name || 'Valued Customer';
    const orderNumber = order.order_id || (order as any).order_number || 'N/A';
    const orderDate = (order as any).order_date_bs || (order as any).sales_invoice_date || (order as any).created_at || new Date().toISOString().split('T')[0];
    const subject = `Official Order Receipt (#${orderNumber}) - ReliableTech Services & Suppliers`;
    const message = `Dear ${recipientName},\n\nThank you for your order with ReliableTech Services & Suppliers. Here are your official order receipt details:\n\nOrder Summary:\n- Order Number: ${orderNumber}\n- Date: ${orderDate}\n- Status: ${order.order_state || 'Processing'}\n- Grand Total: NPR ${totalAmount.toLocaleString()}\n- Payment Method: ${order.payment_method || 'Standard'}\n\nOrganization: ReliableTech Services & Suppliers (RTSS)\nFikkal, Ilam, Nepal\n\nThank you for your business!`;

    if (window.openUniversalEmailModal) {
      window.openUniversalEmailModal({
        recipientEmail,
        recipientName,
        subject,
        message,
        emailType: 'Order Notification & Receipt',
        documentRef: orderNumber
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in print:p-0 print:bg-white overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] my-auto print:max-h-none print:shadow-none print:border-0 print:rounded-none">
        
        {/* Top Floating Controls (Hidden in Print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-emerald-400" />
            <h3 className="font-bold text-sm">Official Order Receipt &amp; Maintenance Certificate</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendEmail}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Send Order Receipt through Email"
            >
              <Mail size={14} />
              <span>Send Email</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Official Receipt</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-5 text-slate-900 font-sans print:p-4 text-xs">
          
          {/* Header Section */}
          <div className="border-b-2 border-slate-900 pb-4 text-center relative">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-950">
                {activeProfile.name || 'ReliableTech Services & Suppliers'}
              </h1>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            </div>
            
            <p className="text-[11px] text-slate-600 font-medium">
              {activeProfile.address || activeProfile.location || 'Suryodaya-10, Fikkal Bazaar, Ilam, Nepal'} &bull; PAN: <strong>{activeProfile.panNumber || '611582910'}</strong>
            </p>
            <p className="text-[10px] text-slate-500">
              Phone: {activeProfile.phone || '+977-9852680456'} &bull; Email: {activeProfile.email || 'contact@reliabletech.com.np'}
            </p>

            <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-300">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">
                OFFICIAL ORDER INVOICE &amp; MAINTENANCE CERTIFICATE
              </span>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Order Reference</span>
              <span className="font-mono font-black text-slate-900 text-sm">#{order.order_id}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Date of Order</span>
              <span className="font-semibold text-slate-900">{order.created_at}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Order Status</span>
              <span className="font-bold text-indigo-700">{order.order_state}</span>
            </div>

            <div className="sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Billed / Delivered To</span>
              <span className="font-bold text-slate-950 block">{order.customer_name}</span>
              <span className="text-[11px] text-slate-600">
                {order.delivery_address}, {order.ward}, {order.municipality}
              </span>
              <span className="text-[11px] text-slate-500 block font-mono">Contact: {order.customer_phone}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Payment Method</span>
              <span className="font-bold text-slate-900 block">{order.payment_method}</span>
              {order.gateway_ref_token && (
                <span className="text-[10px] text-slate-500 font-mono block">Ref: {order.gateway_ref_token}</span>
              )}
              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded mt-1">
                  <CheckCircle2 size={11} /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded mt-1">
                  <Clock size={11} /> Verification Pending
                </span>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold text-[11px]">
                <tr>
                  <th className="py-2 px-3 w-8 text-center">S.N.</th>
                  <th className="py-2 px-3">Item Description &amp; Specifications</th>
                  <th className="py-2 px-3 text-right">Unit Rate</th>
                  <th className="py-2 px-3 text-center">Qty</th>
                  <th className="py-2 px-3 text-right">Line Total (NPR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <span className="font-bold text-slate-900 block">{it.product_name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Product ID: {it.product_id}</span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      NPR {it.final_price_npr.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold">
                      {it.quantity}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      NPR {(it.final_price_npr * it.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pt-1">
            <div className="space-y-1 max-w-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Amount in Words:</span>
              <p className="text-xs font-semibold italic text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-200">
                {numberToWords(totalAmount)}
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-bold">NPR {totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Regional Delivery Fee ({order.municipality}):</span>
                <span className="font-bold text-emerald-700 font-mono">Included / Free</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-950 pt-2 border-t-2 border-slate-900">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-700">NPR {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Maintenance & Warranty Entitlements Box */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
              <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
              <span>Comprehensive Maintenance &amp; Warranty Coverage Terms</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-emerald-950">
              <div className="flex items-start gap-1.5">
                <Wrench size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>1-Year Hardware Warranty:</strong> Full support on electronic components and repair replacement.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <Sparkles size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Free Routine Servicing:</strong> Free diagnostic &amp; dusting servicing at our Fikkal Counter for 12 months.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <Phone size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Hotline Remote Support:</strong> Priority troubleshooting for CCTV remote viewing, driver setups, and network links.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <MapPin size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>On-Site Technician:</strong> Quick dispatch available across Suryodaya, Rong, and Ilam Municipalities.</span>
              </div>
            </div>
          </div>

          {/* Authorized Signatures & Stamp */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-[11px] text-center">
            <div className="border-t border-slate-400 pt-2">
              <span className="font-bold text-slate-800 block">Customer Acceptance</span>
              <span className="text-[10px] text-slate-500">Received Goods in Sealed Condition</span>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <span className="font-bold text-slate-900 block">For: {activeProfile.name || 'ReliableTech Services & Suppliers'}</span>
              <span className="text-[10px] text-slate-500">Authorized Signature &amp; Official Stamp</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
