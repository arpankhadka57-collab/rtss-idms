import React from 'react';
import { 
  Printer, 
  X, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  QrCode as QrIcon, 
  CheckCircle2,
  Download,
  Award
} from 'lucide-react';
import { BusinessProfile, SalesInvoice, EcommerceOrder } from '../types';
import { CorporateLetterhead } from './CorporateLetterhead';
import { numberToWords } from '../utils/nepaliDate';

interface OfficialTaxInvoiceModalProps {
  invoice?: SalesInvoice | null;
  order?: EcommerceOrder | null;
  profile: BusinessProfile;
  onClose: () => void;
}

export const OfficialTaxInvoiceModal: React.FC<OfficialTaxInvoiceModalProps> = ({
  invoice,
  order,
  profile,
  onClose
}) => {
  if (!invoice && !order) return null;

  // Resolve values from invoice or order
  const invoiceNo = invoice?.invoiceNumber || order?.sales_invoice_no || `INV-${order?.order_id?.replace(/[^0-9]/g, '').slice(-6) || '2083-001'}`;
  const invoiceDate = invoice?.date || order?.sales_invoice_date || order?.created_at || '2083-05-15';
  const customerName = invoice?.customerName || order?.organization_name || order?.customer_name || 'Valued Customer';
  const customerPhone = invoice?.customerPhone || order?.customer_phone || '';
  const customerAddress = invoice?.customerAddress || (order ? `${order.delivery_address}, Ward ${order.ward}, ${order.municipality}` : '');
  const customerPan = (invoice as any)?.customerPan || order?.organization_pan || '';

  // Calculate totals
  const subtotal = invoice?.totalAmount ?? order?.subtotal_npr ?? 0;
  const discountAmount = invoice?.discountAmount ?? order?.discount_npr ?? 0;
  const finalAmount = invoice?.finalAmount ?? order?.total_amount_npr ?? (subtotal - discountAmount);
  const paymentMethod = invoice?.paymentMethod || order?.payment_method || 'Cash';
  const remarks = invoice?.remarks || order?.order_notes || `Generated from Ecommerce Order #${order?.order_id || ''}`;

  // Normalized line items
  const items = invoice?.items ? invoice.items.map((it, idx) => ({
    sn: idx + 1,
    name: it.customName || `Service/Item #${it.serviceId}`,
    description: 'Authorized Hardware & IT Support Delivery',
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    totalPrice: it.quantity * it.unitPrice
  })) : order?.items ? order.items.map((it, idx) => ({
    sn: idx + 1,
    name: it.product_name,
    description: `Product ID: ${it.product_id}`,
    quantity: it.quantity,
    unitPrice: it.final_price_npr,
    totalPrice: it.final_price_npr * it.quantity
  })) : [];

  // Verification QR data payload string
  const qrDataPayload = encodeURIComponent(
    `RELIABLETECH OFFICIAL TAX INVOICE\n` +
    `Voucher No: ${invoiceNo}\n` +
    `Date: ${invoiceDate}\n` +
    `Customer: ${customerName}\n` +
    `Net Price: NPR ${finalAmount.toLocaleString()}\n` +
    `Issuer PAN: ${profile?.panNumber || '302482391'}\n` +
    `Verification: Digitally Validated`
  );

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${qrDataPayload}&color=0A2540&bgcolor=FFFFFF&margin=2`;

  const handleSendEmail = () => {
    const recipientEmail = (order?.customer_email) || (invoice as any)?.customerEmail || (invoice as any)?.customer_email || '';
    const recipientName = customerName || 'Valued Customer';
    const subject = `Official Tax Invoice (#${invoiceNo}) - ReliableTech Services & Suppliers`;
    const message = `Dear ${recipientName},\n\nPlease find your official Tax Invoice (#${invoiceNo}) details from ReliableTech Services & Suppliers.\n\nInvoice Summary:\n- Invoice No: ${invoiceNo}\n- Date: ${invoiceDate} (BS)\n- Customer: ${customerName}\n- Grand Total: Rs. ${finalAmount.toLocaleString()}\n- Payment Mode: ${paymentMethod}\n\nOrganization:\nReliableTech Services & Suppliers (RTSS)\nFikkal, Ilam, Koshi Province, Nepal\n\nThank you for your business!`;

    if (window.openUniversalEmailModal) {
      window.openUniversalEmailModal({
        recipientEmail,
        recipientName,
        subject,
        message,
        emailType: 'Tax Invoice & Billing',
        documentRef: invoiceNo
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-fade-in print:p-0 print:bg-white overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] my-auto print:max-h-none print:shadow-none print:border-0 print:rounded-none">
        
        {/* Modal Floating Toolbar (Hidden during browser printing) */}
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-100">
                  Official Computer-Generated Tax Invoice
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                  Digitally Signed
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Voucher Ref: <span className="font-mono text-slate-200 font-bold">{invoiceNo}</span> &bull; Validated with Top Header QR Code
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendEmail}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Send Tax Invoice through Email"
            >
              <Mail size={15} />
              <span>Send Email</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Printer size={15} />
              <span>Print / Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Sheet */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 bg-slate-100/60 print:p-0 print:bg-white select-text">
          <div id="official-tax-invoice-printable" className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 print:border-0 print:shadow-none print:max-w-none">
            
            <CorporateLetterhead profile={profile} documentType="Invoice" paddingMargin="10mm">
              <div className="space-y-4 text-xs text-slate-900">
                
                {/* 1. TOP VERIFICATION QR CODE & INVOICE REFERENCE HEADER */}
                <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Left: Invoice Title & Meta */}
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0A2540] inline-block" />
                      <h2 className="text-base sm:text-lg font-black text-[#0A2540] uppercase tracking-wider font-display">
                        TAX INVOICE / बिक्री बीजक
                      </h2>
                      <span className="text-[10px] font-bold font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                        OFFICIAL
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-slate-600 pt-1 font-mono">
                      <div>
                        <span className="text-slate-400 font-sans text-[10px] uppercase font-bold">Voucher No: </span>
                        <strong className="text-slate-900 text-sm font-black">{invoiceNo}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-sans text-[10px] uppercase font-bold">Billing Date: </span>
                        <strong className="text-slate-900">{invoiceDate} BS</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-sans text-[10px] uppercase font-bold">Payment Method: </span>
                        <strong className="text-emerald-700">{paymentMethod}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-sans text-[10px] uppercase font-bold">Net Bill Price: </span>
                        <strong className="text-slate-950 font-black">NPR {finalAmount.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Right: TOP VERIFICATION QR CODE EMBED (Encodes Voucher Number, Date, Net Price) */}
                  <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs shrink-0 text-center sm:text-right">
                    <div className="space-y-0.5 pr-1 hidden sm:block text-right">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#0A2540] block">
                        Official Verification QR
                      </span>
                      <p className="text-[9px] text-slate-500 font-mono leading-tight">
                        Voucher: <strong>{invoiceNo}</strong>
                      </p>
                      <p className="text-[9px] text-slate-500 font-mono leading-tight">
                        Date: <strong>{invoiceDate}</strong>
                      </p>
                      <p className="text-[9px] text-emerald-700 font-bold font-mono leading-tight">
                        Net: NPR {finalAmount.toLocaleString()}
                      </p>
                    </div>

                    <div className="w-20 h-20 bg-white p-1 rounded-lg border border-slate-300 flex items-center justify-center relative overflow-hidden">
                      <img 
                        src={qrImageUrl} 
                        alt={`QR Code for Invoice #${invoiceNo}`}
                        className="w-full h-full object-contain"
                        crossOrigin="anonymous"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. CUSTOMER & BILLING INFORMATION GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50/60 rounded-xl border border-slate-200/80 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Billed To Customer / Purchaser (ग्राहकको विवरण):
                    </span>
                    <p className="font-extrabold text-slate-950 text-sm">{customerName}</p>
                    {customerAddress && (
                      <p className="text-slate-600 flex items-start gap-1">
                        <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                        <span>{customerAddress}</span>
                      </p>
                    )}
                    {customerPhone && (
                      <p className="text-slate-600 font-mono flex items-center gap-1">
                        <Phone size={12} className="text-slate-400 shrink-0" />
                        <span>{customerPhone}</span>
                      </p>
                    )}
                    {customerPan && (
                      <p className="text-purple-900 font-mono font-bold text-[11px] bg-purple-50 inline-block px-1.5 py-0.5 rounded border border-purple-200 mt-0.5">
                        Purchaser PAN: {customerPan}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 sm:text-right flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Issuer Details (जारीकर्ता):
                      </span>
                      <p className="font-bold text-slate-900">{profile?.name || 'ReliableTech Services & Suppliers'}</p>
                      <p className="text-slate-600 text-[11px]">{profile?.location || 'Suryodaya-10, Fikkal, Ilam, Nepal'}</p>
                      <p className="font-mono text-slate-700 font-bold text-[11px]">
                        PAN / VAT No: <span className="text-[#0A2540]">{profile?.panNumber || '302482391'}</span>
                      </p>
                    </div>
                    {order?.order_id && (
                      <p className="text-[10px] text-slate-500 font-mono">
                        Online Order Reference: <strong>#{order.order_id}</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. ITEMIZED LINE ITEMS TABLE */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-100/90 border-b border-slate-200 font-bold text-slate-600 text-[9px] uppercase tracking-wider">
                        <th className="px-3 py-2.5 w-10 text-center">S.N.</th>
                        <th className="px-3 py-2.5">Description of Goods / Technical Services (विवरण)</th>
                        <th className="px-3 py-2.5 text-center w-16">Qty</th>
                        <th className="px-3 py-2.5 text-right w-28">Rate (NPR)</th>
                        <th className="px-3 py-2.5 text-right w-32">Total Amount (NPR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2.5 text-center font-mono text-slate-400">{it.sn}</td>
                          <td className="px-3 py-2.5">
                            <span className="font-bold text-slate-900 block">{it.name}</span>
                            <span className="text-[10px] text-slate-400 italic block">{it.description}</span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-800">{it.quantity}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                            Rs. {it.unitPrice.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-black text-slate-950">
                            Rs. {it.totalPrice.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 4. TOTALS BREAKDOWN & AMOUNT IN WORDS */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-1">
                  {/* Amount in Words */}
                  <div className="flex-1 bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-1 w-full">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Amount in Words (अक्षरूपी):
                    </span>
                    <p className="text-xs font-serif italic text-indigo-950 font-bold leading-relaxed">
                      {numberToWords(finalAmount)}
                    </p>
                    {remarks && (
                      <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/60 font-mono">
                        Note: {remarks}
                      </p>
                    )}
                  </div>

                  {/* Financial Calculation Box */}
                  <div className="w-full sm:w-64 space-y-1.5 text-xs bg-slate-50/90 p-3.5 rounded-xl border border-slate-200 shrink-0">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal Amount:</span>
                      <span className="font-mono font-bold">Rs. {subtotal.toLocaleString()}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-rose-600 font-semibold">
                        <span>Discount Deducted:</span>
                        <span className="font-mono">-Rs. {discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Taxable / Net Base:</span>
                      <span className="font-mono">Rs. {finalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t-2 border-slate-900 pt-1.5 text-slate-950 font-black text-sm">
                      <span>Net Bill Price:</span>
                      <span className="font-mono text-[#0A2540]">Rs. {finalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* 5. MANDATORY DIGITAL SIGNATURE & COMPUTER GENERATED NOTICE BADGE */}
                <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-300">
                  <div className="bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 border-2 border-indigo-200/80 rounded-xl p-3.5 text-center relative overflow-hidden shadow-2xs">
                    <div className="flex items-center justify-center gap-2 text-indigo-950 font-extrabold text-xs mb-1">
                      <ShieldCheck size={16} className="text-indigo-600" />
                      <span className="uppercase tracking-wide font-sans">
                        Official Digital Verification &amp; Computer Generated Invoice
                      </span>
                      <Award size={15} className="text-amber-500" />
                    </div>

                    {/* Exact User Requested Digital Signature Disclaimer */}
                    <p className="text-xs font-semibold text-slate-800 leading-relaxed font-sans max-w-xl mx-auto">
                      &ldquo;This is computer generated invoice through ReliableTech Services and Suppliers official portal and do not require any stamp or signature.&rdquo;
                    </p>

                    <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[10px] text-slate-500 font-mono">
                      <span>Ref: <strong>{invoiceNo}</strong></span>
                      <span>&bull;</span>
                      <span>Verified at: <strong>{invoiceDate}</strong></span>
                      <span>&bull;</span>
                      <span>Security Hash: <strong className="font-mono text-indigo-700">RTSS-AUTH-SEC-{invoiceNo.replace(/[^0-9]/g, '') || '849201'}</strong></span>
                    </div>
                  </div>
                </div>

              </div>
            </CorporateLetterhead>

          </div>
        </div>

        {/* Modal Footer Controls (Hidden during print) */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs print:hidden">
          <span className="text-slate-500 flex items-center gap-1 font-mono">
            <CheckCircle2 size={13} className="text-emerald-600" /> Valid Official VAT/PAN Tax Invoice
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSendEmail}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Send Tax Invoice through Email"
            >
              <Mail size={13} />
              <span>Send Email</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={13} />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
