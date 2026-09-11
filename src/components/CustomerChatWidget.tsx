import React, { useState } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Phone, 
  User, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  ShieldCheck, 
  MessageCircle,
  Headphones,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { CustomerInquiryMessage, CustomerAccount, BusinessProfile, PERMITTED_MUNICIPALITIES } from '../types';

interface CustomerChatWidgetProps {
  currentCustomer?: CustomerAccount | null;
  profile: BusinessProfile;
  inquiries: CustomerInquiryMessage[];
  onSendMessage: (inquiry: Omit<CustomerInquiryMessage, 'id' | 'created_at' | 'status'>) => void;
  onSendReply: (inquiryId: string, replyText: string, senderName: string) => void;
}

export function CustomerChatWidget({
  currentCustomer,
  profile,
  inquiries,
  onSendMessage,
  onSendReply
}: CustomerChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<'form' | 'threads' | 'chat'>('form');
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState(currentCustomer?.full_name || '');
  const [phone, setPhone] = useState(currentCustomer?.phone_primary || '');
  const [email, setEmail] = useState(currentCustomer?.email || '');
  const [municipality, setMunicipality] = useState(currentCustomer?.municipality || 'Suryodaya Municipality');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Follow-up chat reply input
  const [chatReplyInput, setChatReplyInput] = useState('');

  // Filter inquiries for this customer (by phone or ID)
  const myInquiries = inquiries.filter(inq => {
    if (currentCustomer?.customer_id && inq.customer_id === currentCustomer.customer_id) return true;
    if (phone && inq.customer_phone === phone) return true;
    return false;
  });

  const selectedInquiry = inquiries.find(inq => inq.id === selectedInquiryId);

  const handleSubmitNewInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      alert('Please fill in your name, contact phone, and message.');
      return;
    }

    onSendMessage({
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_email: email.trim() || undefined,
      customer_id: currentCustomer?.customer_id,
      municipality: municipality,
      subject: subject.trim() || 'General Customer Inquiry & Technical Support',
      message: message.trim(),
      priority: priority,
      replies: []
    });

    setMessage('');
    setSubject('');
    setSubmittedSuccess(true);
    setTimeout(() => {
      setSubmittedSuccess(false);
      setActiveView('threads');
    }, 1800);
  };

  const handleSendChatReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiryId || !chatReplyInput.trim()) return;

    const senderName = currentCustomer?.full_name || name || 'Customer';
    onSendReply(selectedInquiryId, chatReplyInput.trim(), senderName);
    setChatReplyInput('');
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white px-4.5 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer border border-white/20"
          id="btn-message-reliabletech"
          title="Message Reliabletech Support & Staff"
        >
          <div className="relative">
            <MessageSquare size={20} className="text-white group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-700 animate-pulse" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold font-display block leading-tight">Message Reliabletech</span>
            <span className="text-[10px] text-indigo-100/90 leading-none">Live Staff Help Desk</span>
          </div>
        </button>
      )}

      {/* Floating Chat & Inquiry Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[540px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-scale-in">
          
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-indigo-950 p-4 text-white shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 backdrop-blur-xs rounded-xl text-sky-200">
                  <Headphones size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Reliabletech Support Desk</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                  </h3>
                  <p className="text-[11px] text-sky-200/80">Fikkal Bazaar, Ilam • Direct Counter Connect</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-sky-200 hover:text-white hover:bg-white/10 rounded-lg transition"
                aria-label="Close Chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => { setActiveView('form'); setSelectedInquiryId(null); }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeView === 'form'
                    ? 'bg-white text-indigo-950 shadow-xs'
                    : 'text-sky-200 hover:bg-white/10'
                }`}
              >
                New Message
              </button>
              <button
                type="button"
                onClick={() => setActiveView('threads')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeView === 'threads' || activeView === 'chat'
                    ? 'bg-white text-indigo-950 shadow-xs'
                    : 'text-sky-200 hover:bg-white/10'
                }`}
              >
                <span>My Messages</span>
                {myInquiries.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
                    {myInquiries.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Main Body */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
            
            {/* 1. NEW MESSAGE FORM */}
            {activeView === 'form' && (
              <form onSubmit={handleSubmitNewInquiry} className="space-y-3">
                {submittedSuccess ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                      <CheckCircle2 size={32} />
                    </div>
                    <h4 className="text-base font-bold text-slate-800">Message Delivered!</h4>
                    <p className="text-xs text-slate-600 max-w-xs mx-auto">
                      Your inquiry has been sent to our staff notification desk. We will respond promptly.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-900 space-y-1">
                      <p className="font-semibold flex items-center gap-1.5">
                        <Sparkles size={14} className="text-sky-600" />
                        Direct Message to Staff &amp; Management
                      </p>
                      <p className="text-[11px] text-sky-800/80">
                        Ask about CCTV, hardware repair, order delivery, maintenance warranties, or custom quotations.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-600">Your Full Name *</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Ramesh Karki"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-hidden focus:border-indigo-500 shadow-2xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-600">Phone Number *</label>
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="98XXXXXXXX"
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-hidden focus:border-indigo-500 shadow-2xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-600">Municipality</label>
                          <select
                            value={municipality}
                            onChange={(e) => setMunicipality(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs bg-white focus:outline-hidden focus:border-indigo-500 shadow-2xs"
                          >
                            {PERMITTED_MUNICIPALITIES.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-600">Subject / Topic</label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="e.g. Order Tracking #ORD-8821 / CCTV Installation"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-hidden focus:border-indigo-500 shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-600">Message / Inquiry Details *</label>
                        <textarea
                          required
                          rows={3}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Write your question, request, or hardware maintenance inquiry here..."
                          className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-white focus:outline-hidden focus:border-indigo-500 shadow-2xs resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-500">Urgency:</span>
                        <div className="flex items-center gap-1.5">
                          {(['Normal', 'High', 'Urgent'] as const).map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setPriority(p)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                priority === p
                                  ? p === 'Urgent' ? 'bg-rose-600 text-white' : p === 'High' ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-3 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition cursor-pointer"
                    >
                      <Send size={14} />
                      <span>Send Message to Reliabletech</span>
                    </button>
                  </>
                )}
              </form>
            )}

            {/* 2. INQUIRIES LIST / THREADS */}
            {activeView === 'threads' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">Your Communication History</h4>
                  <span className="text-[11px] text-slate-500">Phone: {phone || 'Enter above'}</span>
                </div>

                {myInquiries.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <MessageCircle size={36} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-700">No previous messages found</p>
                    <p className="text-[11px] text-slate-500">
                      Submit a new message in the "New Message" tab to start a conversation with our staff.
                    </p>
                  </div>
                ) : (
                  myInquiries.map(inq => {
                    const hasReplies = inq.replies && inq.replies.length > 0;
                    return (
                      <div
                        key={inq.id}
                        onClick={() => {
                          setSelectedInquiryId(inq.id);
                          setActiveView('chat');
                        }}
                        className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-xs transition cursor-pointer space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-xs font-bold text-slate-800 line-clamp-1">{inq.subject}</h5>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            inq.status === 'Replied' ? 'bg-emerald-100 text-emerald-800' :
                            inq.status === 'Forwarded to Admin' ? 'bg-purple-100 text-purple-800' :
                            inq.status === 'Resolved' ? 'bg-blue-100 text-blue-800' :
                            inq.status === 'Blocked' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {inq.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2">{inq.message}</p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                          <span>{inq.created_at}</span>
                          <span className="text-indigo-600 font-semibold flex items-center gap-1">
                            {hasReplies ? `${inq.replies?.length} replies` : 'Awaiting staff reply'} &rarr;
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* 3. CHAT THREAD VIEW */}
            {activeView === 'chat' && selectedInquiry && (
              <div className="flex flex-col h-full space-y-3">
                <button
                  type="button"
                  onClick={() => setActiveView('threads')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  <ArrowLeft size={13} />
                  <span>Back to all messages</span>
                </button>

                <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-600 font-mono">#{selectedInquiry.id}</span>
                    <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                      selectedInquiry.status === 'Replied' ? 'bg-emerald-100 text-emerald-800' :
                      selectedInquiry.status === 'Forwarded to Admin' ? 'bg-purple-100 text-purple-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedInquiry.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{selectedInquiry.subject}</h4>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[220px] p-1">
                  {/* Original Customer Message */}
                  <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl rounded-tr-xs p-3 text-xs text-slate-800 ml-4 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-indigo-700 font-semibold">
                      <span>You ({selectedInquiry.customer_name})</span>
                      <span>{selectedInquiry.created_at}</span>
                    </div>
                    <p className="leading-relaxed">{selectedInquiry.message}</p>
                  </div>

                  {/* Staff / Admin Replies */}
                  {(selectedInquiry.replies || []).map(r => {
                    const isStaff = r.sender === 'Staff' || r.sender_role === 'Staff' || (!r.sender_role && !r.sender);
                    const senderLabel = (r as any).staff_name || (r as any).senderName || (r as any).sender_name || (isStaff ? 'Reliabletech Staff' : 'Customer');
                    const roleLabel = isStaff ? 'Support Staff' : 'Customer';
                    const msgContent = r.message || (r as any).reply_text || '';

                    return (
                      <div
                        key={r.id}
                        className={`p-3 rounded-2xl text-xs space-y-1 border ${
                          !isStaff
                            ? 'bg-indigo-50 border-indigo-100 rounded-tr-xs ml-4'
                            : 'bg-white border-slate-200 rounded-tl-xs mr-4 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                          <span className={isStaff ? 'text-emerald-700 font-bold' : 'text-indigo-700'}>
                            {senderLabel} ({roleLabel})
                          </span>
                          <span>{r.timestamp || (r as any).created_at}</span>
                        </div>
                        <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{msgContent}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendChatReply} className="pt-2 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={chatReplyInput}
                    onChange={(e) => setChatReplyInput(e.target.value)}
                    placeholder="Type follow-up reply..."
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            )}

          </div>

          {/* Footer Call Desk Note */}
          <div className="bg-slate-100 border-t border-slate-200 px-4 py-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Phone size={11} className="text-indigo-600" />
              <span>Direct Support Hotline: +977-9852680456</span>
            </span>
            <span className="font-mono text-[10px]">Reliabletech v2.4</span>
          </div>

        </div>
      )}
    </div>
  );
}
