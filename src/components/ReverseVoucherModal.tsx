import React, { useRef } from 'react';
import {
  X,
  Printer,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Calendar,
  Building2,
  Phone,
  FileText,
  CreditCard,
  Layers
} from 'lucide-react';
import { EcommerceOrder, BusinessProfile } from '../types';

interface ReverseVoucherModalProps {
  order: EcommerceOrder;
  profile?: BusinessProfile;
  onClose: () => void;
}

export function ReverseVoucherModal({ order, profile, onClose }: ReverseVoucherModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const voucherNo = order.reverse_voucher_number || `REV-VCH-${new Date().getFullYear()}-${String(order.order_id).replace(/\D/g, '').slice(-4) || '001'}`;
  const reverseDate = order.reverse_voucher_date || order.cancelled_at?.slice(0, 10) || new Date().toISOString().slice(0, 10);
  const refundAmount = order.refund_amount || order.total_amount_npr;
  const reason = order.cancellation_reason || 'Customer requested order cancellation & refund.';
  const refundMethod = order.refund_method || order.payment_method || 'Original Payment Source';
  const cancelledBy = order.cancelled_by || 'ReliableTech Admin';

  const companyName = profile?.name || 'ReliableTech Services & Suppliers';
  const companyAddress = profile?.location || 'Fikkal Bazaar, Suryodaya-10, Ilam, Nepal';
  const companyPhone = profile?.phone || '9852680780';
  const companyPan = profile?.panNumber || '302482391';

  // Format amount to words helper
  const numberToWordsNepali = (num: number): string => {
    return `NPR ${num.toLocaleString('en-IN')} Only`;
  };

  const qrDataString = `RTSS REVERSE VOUCHER\nVoucher: ${voucherNo}\nOriginal Order: ${order.order_id}\nRefund Amount: NPR ${refundAmount}\nDate: ${reverseDate}\nCustomer: ${order.customer_name}\nStatus: REFUNDED & CANCELLED`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in print:p-0 print:bg-white overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[calc(100dvh-2rem)] print:my-0 print:border-0 print:shadow-none print:max-w-none">
        
        {/* Modal Top Action Bar (Hidden on print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <RotateCcw size={18} />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-100 flex items-center gap-2">
                <span>Official Reverse Sales Voucher &amp; Credit Note</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500 text-white uppercase font-bold">
                  Reversed / Refunded
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Order #{order.order_id} &bull; Voucher: {voucherNo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              id="print-reverse-voucher-button"
            >
              <Printer size={14} />
              <span>Print Reverse Voucher</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Document Body (Printable Area) */}
        <div ref={printRef} className="p-8 sm:p-10 space-y-6 text-xs font-sans text-slate-900 bg-white print:p-4">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start justify-between border-b-2 border-rose-500 pb-5 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black uppercase rounded tracking-wider border border-rose-200">
                  REVERSE SALES VOUCHER (बिक्री फिर्ता भौचर)
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  REFUND CREDIT NOTE
                </span>
              </div>
              <h1 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                {companyName}
              </h1>
              <p className="text-slate-600 font-medium text-[11px]">
                {companyAddress} &bull; Phone: {companyPhone}
              </p>
              <div className="inline-flex items-center gap-2 mt-1">
                <span className="bg-slate-100 text-slate-700 font-mono font-bold text-[10px] px-2 py-0.5 rounded border border-slate-200">
                  PAN: {companyPan}
                </span>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                  Verified Reversal
                </span>
              </div>
            </div>

            {/* QR Code & Voucher Number Box */}
            <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
              <div className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-1 text-center shadow-2xs">
                <QrCode size={40} className="text-slate-800" />
                <span className="text-[8px] font-mono font-bold text-slate-600 tracking-tighter truncate max-w-full">
                  {voucherNo}
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 block font-semibold">VOUCHER NUMBER</span>
                <span className="font-mono font-black text-rose-600 text-sm block">
                  {voucherNo}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                  Date: {reverseDate}
                </span>
              </div>
            </div>
          </div>

          {/* Reference Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Original Order</span>
              <span className="font-mono font-black text-slate-900 text-xs">#{order.order_id}</span>
              <span className="text-slate-500 block text-[10px]">Date: {order.created_at}</span>
            </div>

            {order.invoice_number && (
              <div>
                <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Linked Tax Invoice</span>
                <span className="font-mono font-bold text-indigo-700">{order.invoice_number}</span>
                <span className="text-rose-600 font-semibold block text-[10px]">(Cancelled / Reversed)</span>
              </div>
            )}

            <div>
              <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Customer Details</span>
              <span className="font-bold text-slate-900 block">{order.customer_name}</span>
              <span className="font-mono text-slate-600 block">{order.customer_phone}</span>
              <span className="text-slate-500 text-[10px] block truncate">{order.municipality}, {order.ward}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Refund Settlement Mode</span>
              <span className="font-bold text-slate-900">{refundMethod}</span>
              {order.gateway_ref_token && (
                <span className="text-[9.5px] font-mono text-slate-500 block truncate">
                  Ref: {order.gateway_ref_token}
                </span>
              )}
            </div>

            <div>
              <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Authorized By</span>
              <span className="font-semibold text-slate-800">{cancelledBy}</span>
              <span className="text-[9.5px] text-slate-400 block">Staff / Admin Desk</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Reversal Status</span>
              <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px]">
                <CheckCircle size={11} />
                <span>Sales Reversed &amp; Refunded</span>
              </span>
            </div>
          </div>

          {/* Cancellation Reason / Remarks Callout */}
          <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200/80 text-rose-950 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-rose-600" />
              <span>Cancellation Reason &amp; Refund Remarks (रद्द तथा फिर्ता कैफियत)</span>
            </span>
            <p className="font-semibold text-slate-800 text-xs pl-4 border-l-2 border-rose-400 py-0.5">
              "{reason}"
            </p>
          </div>

          {/* Cancelled Items Table */}
          <div className="space-y-1">
            <span className="font-black text-slate-800 text-xs uppercase tracking-wider block">
              Cancelled / Returned Items Summary
            </span>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[9.5px] border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-2.5">S.N.</th>
                    <th className="px-3.5 py-2.5">Item Description</th>
                    <th className="px-3.5 py-2.5 text-center">Returned Qty</th>
                    <th className="px-3.5 py-2.5 text-right">Unit Rate (NPR)</th>
                    <th className="px-3.5 py-2.5 text-right">Reversed Amount (NPR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-3.5 py-2 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-3.5 py-2 font-bold text-slate-900">
                        {item.product_name}
                      </td>
                      <td className="px-3.5 py-2 text-center font-mono font-semibold">
                        {item.quantity}
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono">
                        {item.final_price_npr.toLocaleString()}
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono font-bold text-rose-700">
                        -{(item.final_price_npr * item.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                  <tr>
                    <td colSpan={4} className="px-3.5 py-2 text-right uppercase text-[10px] text-slate-500">
                      Subtotal Reversed:
                    </td>
                    <td className="px-3.5 py-2 text-right font-mono text-rose-700">
                      -NPR {order.subtotal_npr.toLocaleString()}
                    </td>
                  </tr>
                  {order.discount_npr && order.discount_npr > 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3.5 py-1 text-right uppercase text-[10px] text-slate-500">
                        Discount Adjusted:
                      </td>
                      <td className="px-3.5 py-1 text-right font-mono text-emerald-600">
                        +NPR {order.discount_npr.toLocaleString()}
                      </td>
                    </tr>
                  ) : null}
                  <tr className="bg-rose-50 border-t-2 border-rose-300">
                    <td colSpan={4} className="px-3.5 py-2.5 text-right font-black uppercase text-xs text-rose-900">
                      Total Refunded to Customer (जम्मा फिर्ता रकम):
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-black text-sm text-rose-900">
                      NPR {refundAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Amount In Words */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">In Words:</span>
            <span className="font-bold text-slate-900">{numberToWordsNepali(refundAmount)}</span>
          </div>

          {/* Legal / Signature Disclaimers */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center space-y-1">
              <p className="text-[10px] font-bold text-slate-700">
                “This is a computer generated Reverse Sales Voucher &amp; Credit Note through ReliableTech Services and Suppliers official portal and does not require physical stamp or signature.”
              </p>
              <p className="text-[9px] text-slate-400 font-mono">
                System Voucher Hash: {voucherNo}-{order.order_id}-{reverseDate} &bull; Authorized by {companyName}
              </p>
            </div>

            <div className="flex justify-between items-end pt-4 text-[10px] text-slate-500">
              <div className="text-center">
                <div className="w-32 border-b border-slate-400 mb-1" />
                <span>Customer Signature / Receiver</span>
              </div>
              <div className="text-center">
                <div className="w-36 border-b border-slate-400 mb-1" />
                <span className="font-bold text-slate-700">Authorized Officer / Manager</span>
                <span className="block text-[9px] text-slate-400">{companyName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500">
            Official credit note logged into accounting ledger
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Voucher</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
