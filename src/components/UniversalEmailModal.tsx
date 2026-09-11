import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles, 
  User, 
  FileText,
  Building2,
  ChevronDown
} from 'lucide-react';
import { dispatchCustomEmail, SendCustomEmailParams, fetchEmailQuotaStatus, EmailQuotaStatusResponse } from '../utils/otpAuth';

export interface UniversalEmailData {
  recipientEmail?: string;
  recipientName?: string;
  subject?: string;
  message?: string;
  htmlContent?: string;
  emailType?: string;
  senderChoice?: 'auto' | 'primary' | 'secondary' | string;
  documentRef?: string;
}

declare global {
  interface Window {
    openUniversalEmailModal?: (data: UniversalEmailData) => void;
  }
}

interface UniversalEmailModalProps {
  onSuccess?: (msg: string) => void;
  onError?: (err: string) => void;
}

export const UniversalEmailModal: React.FC<UniversalEmailModalProps> = ({ onSuccess, onError }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [emailData, setEmailData] = useState<UniversalEmailData>({
    recipientEmail: '',
    recipientName: '',
    subject: '',
    message: '',
    emailType: 'Official Document Dispatch',
    senderChoice: 'auto'
  });
  
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string; sender?: string } | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<EmailQuotaStatusResponse | null>(null);

  useEffect(() => {
    const handleOpen = (data: UniversalEmailData) => {
      setEmailData({
        recipientEmail: data.recipientEmail || '',
        recipientName: data.recipientName || '',
        subject: data.subject || 'Document Dispatch from ReliableTech Services & Suppliers',
        message: data.message || '',
        htmlContent: data.htmlContent || '',
        emailType: data.emailType || 'Official Document Dispatch',
        senderChoice: data.senderChoice || 'auto',
        documentRef: data.documentRef || ''
      });
      setStatusMessage(null);
      setIsOpen(true);
      fetchEmailQuotaStatus().then(res => {
        if (res) setQuotaInfo(res);
      });
    };

    window.openUniversalEmailModal = handleOpen;
    return () => {
      delete window.openUniversalEmailModal;
    };
  }, []);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailData.recipientEmail || !emailData.recipientEmail.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid recipient email address.' });
      return;
    }
    if (!emailData.subject?.trim()) {
      setStatusMessage({ type: 'error', text: 'Subject line is required.' });
      return;
    }
    if (!emailData.message?.trim()) {
      setStatusMessage({ type: 'error', text: 'Message content is required.' });
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      const res = await dispatchCustomEmail({
        recipientEmail: emailData.recipientEmail.trim(),
        recipientName: emailData.recipientName?.trim() || 'Valued Recipient',
        subject: emailData.subject.trim(),
        message: emailData.message.trim(),
        htmlContent: emailData.htmlContent,
        emailType: emailData.emailType || 'Official Document Dispatch',
        senderChoice: emailData.senderChoice || 'auto'
      });

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Email successfully sent to ${res.recipient} via ${res.sender}`,
          sender: res.sender
        });
        if (onSuccess) onSuccess(`✓ Email dispatched via ${res.sender}`);
        setTimeout(() => {
          setIsOpen(false);
        }, 2200);
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Failed to dispatch email. Check SMTP server configuration.'
        });
        if (onError) onError(res.error || 'Email dispatch failed');
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Network error dispatching email.'
      });
      if (onError) onError(err.message || 'Error dispatching email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/80 text-white rounded-xl">
              <Mail size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Send Document by Email</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  RTSS Dispatch Engine
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Dispatches branded document directly to recipient and logs in quota countdown.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSend} className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Sender Account Choice */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
              Select Sending Account (Dispatched From)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setEmailData({ ...emailData, senderChoice: 'auto' })}
                className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                  emailData.senderChoice === 'auto'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-1 ring-indigo-500 font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold">Automatic Quota Rule</span>
                </div>
                <p className="text-[10px] text-slate-500 font-normal mt-0.5 truncate">
                  Primary 1-400, then Failover
                </p>
              </button>

              <button
                type="button"
                onClick={() => setEmailData({ ...emailData, senderChoice: 'primary' })}
                className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                  emailData.senderChoice === 'primary'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-1 ring-indigo-500 font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold">donotreply.rtss</span>
                </div>
                <p className="text-[10px] text-slate-500 font-normal mt-0.5 truncate">
                  Priority 1 Official System
                </p>
              </button>

              <button
                type="button"
                onClick={() => setEmailData({ ...emailData, senderChoice: 'secondary' })}
                className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                  emailData.senderChoice === 'secondary'
                    ? 'border-purple-600 bg-purple-50/80 text-purple-950 ring-1 ring-purple-500 font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold">reliabletechss</span>
                </div>
                <p className="text-[10px] text-slate-500 font-normal mt-0.5 truncate">
                  Priority 2 Department
                </p>
              </button>
            </div>
          </div>

          {/* Recipient Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Recipient Email ID *
              </label>
              <input
                type="email"
                required
                placeholder="customer@example.com"
                value={emailData.recipientEmail || ''}
                onChange={(e) => setEmailData({ ...emailData, recipientEmail: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-900 focus:outline-hidden focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Recipient Name / Client
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe / Prime Tech Enterprises"
                value={emailData.recipientName || ''}
                onChange={(e) => setEmailData({ ...emailData, recipientName: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-900 focus:outline-hidden focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Document Type & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Email Category / Type
              </label>
              <select
                value={emailData.emailType || 'Official Document Dispatch'}
                onChange={(e) => setEmailData({ ...emailData, emailType: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-900 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="Sales Invoice / Tax Bill">Sales Invoice / Tax Bill</option>
                <option value="Payment Receipt">Payment Receipt</option>
                <option value="Quotation / Estimate">Quotation / Estimate</option>
                <option value="Official Letter">Official Letter</option>
                <option value="Accounting Statement">Accounting Statement</option>
                <option value="Expense Voucher">Expense Voucher</option>
                <option value="Service Order">Service Order</option>
                <option value="Meeting Minutes">Meeting Minutes</option>
                <option value="Custom Email">Custom Email</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Subject Line *
              </label>
              <input
                type="text"
                required
                placeholder="Document Subject"
                value={emailData.subject || ''}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-900 focus:outline-hidden focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Message Content */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Message Content / Document Summary *
            </label>
            <textarea
              rows={6}
              required
              placeholder="Enter message details or document text to deliver..."
              value={emailData.message || ''}
              onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-white text-slate-900 focus:outline-hidden focus:border-indigo-500 font-mono leading-relaxed"
            />
          </div>

          {/* Feedback Status */}
          {statusMessage && (
            <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">{statusMessage.text}</p>
                {statusMessage.sender && (
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Counted in daily 400-quota tracking for {statusMessage.sender}.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium">
              Passwords loaded securely via <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">.env</code>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm active:scale-98"
              >
                {isSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                <span>{isSending ? 'Sending...' : 'Send Email Now'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
