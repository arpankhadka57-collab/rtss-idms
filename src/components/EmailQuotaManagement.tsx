import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send,
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Search, 
  Download, 
  User, 
  Activity,
  Zap,
  Lock,
  Save,
  SlidersHorizontal,
  KeyRound,
  Check,
  CheckCircle
} from 'lucide-react';
import { 
  fetchEmailQuotaStatus, 
  fetchEmailDispatchLogs, 
  dispatchSystemTestEmail,
  fetchEmailConfig,
  saveEmailConfigApi,
  EmailQuotaStatusResponse, 
  EmailDispatchLogItem,
  EmailConfigData
} from '../utils/otpAuth';

interface EmailQuotaManagementProps {
  currentUserRole?: string;
  onToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const EmailQuotaManagement: React.FC<EmailQuotaManagementProps> = ({ 
  currentUserRole,
  onToast 
}) => {
  const [activeTab, setActiveTab] = useState<'quotas' | 'test' | 'config'>('quotas');
  const [quotaData, setQuotaData] = useState<EmailQuotaStatusResponse | null>(null);
  const [logs, setLogs] = useState<EmailDispatchLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  
  // Search and filter state for logs
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [senderFilter, setSenderFilter] = useState<string>('all');

  // Configuration State (No passwords stored/inputted here — strictly loaded from .env)
  const [primaryEmailInput, setPrimaryEmailInput] = useState('donotreply.rtss@gmail.com');
  const [secondaryEmailInput, setSecondaryEmailInput] = useState('reliabletechss.fikkal@gmail.com');
  const [hasPrimaryPass, setHasPrimaryPass] = useState(false);
  const [hasSecondaryPass, setHasSecondaryPass] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'auto' | 'primary' | 'secondary'>('auto');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSaveSuccess, setConfigSaveSuccess] = useState(false);

  // Test Email state
  const [testEmail, setTestEmail] = useState('');
  const [testName, setTestName] = useState('');
  const [testSubject, setTestSubject] = useState('RTSS Email System Diagnostic Test');
  const [testMessage, setTestMessage] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; sender?: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [quotaRes, logsRes, configRes] = await Promise.all([
        fetchEmailQuotaStatus(),
        fetchEmailDispatchLogs(400),
        fetchEmailConfig()
      ]);
      if (quotaRes) {
        setQuotaData(quotaRes);
      }
      if (logsRes) {
        setLogs(logsRes);
      }
      if (configRes && configRes.config) {
        setPrimaryEmailInput(configRes.config.primaryEmail || 'donotreply.rtss@gmail.com');
        setSecondaryEmailInput(configRes.config.secondaryEmail || 'reliabletechss.fikkal@gmail.com');
        setHasPrimaryPass(Boolean(configRes.config.hasPrimaryPass));
        setHasSecondaryPass(Boolean(configRes.config.hasSecondaryPass));
        setSelectedMode(configRes.config.mode || 'auto');
      }
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error loading email quota data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigSaveSuccess(false);

    try {
      const payload: Partial<EmailConfigData> = {
        primaryEmail: primaryEmailInput.trim() || 'donotreply.rtss@gmail.com',
        secondaryEmail: secondaryEmailInput.trim() || 'reliabletechss.fikkal@gmail.com',
        mode: selectedMode
      };

      const res = await saveEmailConfigApi(payload);

      if (res.success) {
        setConfigSaveSuccess(true);
        if (onToast) onToast('✓ Email dispatcher routing saved successfully! Primary and Standby accounts updated.', 'success');
        if (res.quotaStatus) {
          setQuotaData(res.quotaStatus);
        }
        await loadData();
        setTimeout(() => setConfigSaveSuccess(false), 4000);
      } else {
        if (onToast) onToast(res.error || 'Failed to save email configuration', 'error');
      }
    } catch (err: any) {
      if (onToast) onToast(err.message || 'Error saving email configuration', 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes('@')) {
      if (onToast) onToast('Please enter a valid recipient email address.', 'error');
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await dispatchSystemTestEmail(
        testEmail.trim(),
        testName.trim() || 'Administrator',
        testSubject.trim(),
        testMessage.trim()
      );

      if (res.success) {
        setTestResult({
          success: true,
          message: res.message || `Test email successfully dispatched to ${testEmail}!`,
          sender: res.sender
        });
        if (onToast) onToast(`✓ Email successfully sent to ${testEmail} via ${res.sender}`, 'success');
        await loadData();
      } else {
        setTestResult({
          success: false,
          message: res.error || 'Failed to dispatch test email. Check SMTP credentials in .env file.'
        });
        if (onToast) onToast(res.error || 'Email dispatch failed', 'error');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error sending test email.'
      });
      if (onToast) onToast(err.message || 'Error sending email', 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  // Export logs to CSV
  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Date & Time', 'Sender Account', 'Recipient Name', 'Recipient Email', 'Email Type', 'Subject', 'Status', 'Message ID / Error'];
    const rows = logs.map(l => [
      `"${l.dateFormatted || new Date(l.timestamp).toLocaleString()}"`,
      `"${l.sender}"`,
      `"${(l.recipientName || '').replace(/"/g, '""')}"`,
      `"${l.recipientEmail}"`,
      `"${(l.emailType || '').replace(/"/g, '""')}"`,
      `"${(l.subject || '').replace(/"/g, '""')}"`,
      `"${l.success ? 'Success' : 'Failed'}"`,
      `"${(l.messageId || l.error || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RTSS_Email_Dispatch_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logs
  const filteredLogs = logs.filter(item => {
    const matchesSearch = 
      (item.recipientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.recipientEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sender || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.emailType || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || 
      (item.emailType || '').toLowerCase().includes(typeFilter.toLowerCase());

    const matchesSender = senderFilter === 'all' || 
      (item.sender || '').toLowerCase().includes(senderFilter.toLowerCase());

    return matchesSearch && matchesType && matchesSender;
  });

  const primary = quotaData?.primaryAccount || {
    email: primaryEmailInput || 'donotreply.rtss@gmail.com',
    name: 'RTSS Official System (Priority 1)',
    maxLimit: 400,
    sentToday: 0,
    remainingToday: 400,
    percentageUsed: 0,
    isActive: true,
    status: 'Active (Dispatching Priority 1 Emails 1-400)',
    statusBadge: 'ACTIVE' as const
  };

  const secondary = quotaData?.secondaryAccount || {
    email: secondaryEmailInput || 'reliabletechss.fikkal@gmail.com',
    name: 'ReliableTech Services & Suppliers (Priority 2)',
    maxLimit: 400,
    sentToday: 0,
    remainingToday: 400,
    percentageUsed: 0,
    isActive: false,
    status: 'Standby (Will activate when donotreply reaches 400)',
    statusBadge: 'STANDBY' as const
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & NAVIGATION TABS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-sky-600 rounded-2xl text-white shadow-md shadow-indigo-500/20">
              <Mail size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight font-display">
                  Automated Email Dispatch Engine & Quotas
                </h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Quota Rule: 400 Primary + 400 Standby
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                <strong>Strict Quota Hierarchy:</strong> <code className="text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">{primary.email}</code> is used first up to <strong>400 emails</strong>. Once it reaches 400 in 24 hours, <code className="text-purple-600 font-semibold bg-purple-50 px-1.5 py-0.5 rounded">{secondary.email}</code> takes over automatically.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer active:scale-98 border border-slate-200"
              title="Refresh Quotas & Logs"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin text-indigo-600' : 'text-slate-500'} />
              <span>{isLoading ? 'Updating...' : 'Sync Live Quota'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-4 pt-1 overflow-x-auto pb-1 border-b border-slate-150">
          <button
            type="button"
            onClick={() => setActiveTab('quotas')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              activeTab === 'quotas'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Activity size={15} />
            <span>Live Quota Status &amp; Countdowns</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('test')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              activeTab === 'test'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck size={15} />
            <span>Diagnostic SMTP Test</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              activeTab === 'config'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal size={15} />
            <span>Routing Policy &amp; Security</span>
          </button>
        </div>

        {/* 2. TAB: LIVE QUOTAS COUNTDOWN */}
        {activeTab === 'quotas' && (
          <div className="mt-5 space-y-5 animate-fade-in">
            {/* The Two Dual Email Account Countdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* PRIORITY 1 CARD: donotreply.rtss@gmail.com */}
              <div className={`relative rounded-2xl p-5 border-2 transition-all ${
                primary.isActive 
                  ? 'bg-gradient-to-br from-white to-indigo-50/40 border-indigo-500 shadow-md shadow-indigo-500/5' 
                  : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-mono">
                        Priority 1 • Primary Dispatcher
                      </span>
                      {primary.sentToday < 400 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          ACTIVE NOW
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          QUOTA REACHED (400/400)
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mt-2 font-mono flex items-center gap-1.5">
                      <Mail size={16} className="text-indigo-600" />
                      <span>{primary.email}</span>
                    </h4>
                    <p className="text-xs text-slate-500">Official RTSS OTPs, Customer Password Resets, Invoices &amp; Dispatches</p>
                  </div>

                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-indigo-700 font-mono tracking-tight">
                      {primary.remainingToday}
                    </span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining Today</p>
                  </div>
                </div>

                {/* Quota Progress Bar */}
                <div className="mt-4 pt-3 border-t border-slate-150">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-600">Dispatches Today: <strong className="text-slate-900 font-mono font-bold">{primary.sentToday} / 400</strong></span>
                    <span className="text-indigo-700 font-bold font-mono">{primary.percentageUsed}% used</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        primary.sentToday >= 400 
                          ? 'bg-rose-500' 
                          : primary.sentToday > 300 
                            ? 'bg-amber-500' 
                            : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(100, (primary.sentToday / 400) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50/80 p-2.5 rounded-xl border border-slate-150">
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Handles Emails #1 through #400</span>
                  </span>
                  <span className="font-semibold text-slate-700 font-mono">
                    {primary.sentToday < 400 ? `${400 - primary.sentToday} slots until failover` : 'Failover Activated'}
                  </span>
                </div>
              </div>

              {/* PRIORITY 2 CARD: reliabletechss.fikkal@gmail.com */}
              <div className={`relative rounded-2xl p-5 border-2 transition-all ${
                secondary.isActive 
                  ? 'bg-gradient-to-br from-white to-purple-50/40 border-purple-500 shadow-md shadow-purple-500/5' 
                  : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-mono">
                        Priority 2 • Failover Standby
                      </span>
                      {primary.sentToday < 400 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Clock size={12} />
                          STANDBY (Activates after 400)
                        </span>
                      ) : secondary.sentToday < 400 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          ACTIVE (Priority 1 Reached 400)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          QUOTA COMPLETED (400/400)
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mt-2 font-mono flex items-center gap-1.5">
                      <Mail size={16} className="text-purple-600" />
                      <span>{secondary.email}</span>
                    </h4>
                    <p className="text-xs text-slate-500">Secondary Department Account for Automatic Daily Failover</p>
                  </div>

                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-purple-700 font-mono tracking-tight">
                      {secondary.remainingToday}
                    </span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining Today</p>
                  </div>
                </div>

                {/* Quota Progress Bar */}
                <div className="mt-4 pt-3 border-t border-slate-150">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-600">Dispatches Today: <strong className="text-slate-900 font-mono font-bold">{secondary.sentToday} / 400</strong></span>
                    <span className="text-purple-700 font-bold font-mono">{secondary.percentageUsed}% used</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        secondary.sentToday >= 400 
                          ? 'bg-rose-500' 
                          : secondary.sentToday > 300 
                            ? 'bg-amber-500' 
                            : 'bg-purple-600'
                      }`}
                      style={{ width: `${Math.min(100, (secondary.sentToday / 400) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50/80 p-2.5 rounded-xl border border-slate-150">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Zap size={14} className="text-amber-500" />
                    <span>Handles Emails #401 through #800</span>
                  </span>
                  <span className="font-semibold text-slate-700 font-mono">
                    {primary.sentToday < 400 ? 'On Standby until Primary reaches 400' : `${secondary.remainingToday} slots remaining`}
                  </span>
                </div>
              </div>

            </div>

            {/* Total Statistics Footer */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Current Active Sender Account</p>
                  <p className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    {quotaData?.activeDispatcher || primary.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-center sm:text-right">
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Total Sent Today</p>
                  <p className="text-xl font-bold font-mono text-white">
                    {quotaData?.totalSentToday || (primary.sentToday + secondary.sentToday)} <span className="text-xs text-slate-400 font-normal">/ 800</span>
                  </p>
                </div>
                <div className="border-l border-slate-800 pl-6">
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Total Remaining</p>
                  <p className="text-xl font-bold font-mono text-indigo-300">
                    {quotaData?.totalRemainingToday || (primary.remainingToday + secondary.remainingToday)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. TAB: DIAGNOSTIC SMTP TEST */}
        {activeTab === 'test' && (
          <div className="mt-5 p-5 bg-slate-50/50 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-indigo-600" />
                  <span>Live SMTP Diagnostic Test (Send Verified Test Email)</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Verify SMTP connectivity and account dispatch hierarchy.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Will route via: <strong className="text-indigo-600">{quotaData?.activeDispatcher || primary.email}</strong>
              </span>
            </div>

            <form onSubmit={handleSendTestEmail} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Recipient Email ID *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. yourname@gmail.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-white text-slate-900 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Recipient Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. System Administrator"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-white text-slate-900 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Subject Line</label>
                <input
                  type="text"
                  placeholder="RTSS Email System Diagnostic Test"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-white text-slate-900 focus:outline-hidden focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Optional Message / Diagnostic Note</label>
                <textarea
                  rows={2}
                  placeholder="Diagnostic note to include in the email body..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-white text-slate-900 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {testResult && (
                <div className={`p-3.5 rounded-xl text-xs font-medium border flex items-start gap-2 ${
                  testResult.success 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {testResult.success ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-bold">{testResult.message}</p>
                    {testResult.sender && (
                      <p className="text-[11px] text-emerald-700 mt-0.5">Dispatched from verified account: {testResult.sender}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSendingTest}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm active:scale-98"
                >
                  {isSendingTest ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>{isSendingTest ? 'Dispatching Test Email...' : 'Send Live Test Email'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 5. TAB: ROUTING POLICY & CREDENTIALS SECURITY NOTICE */}
        {activeTab === 'config' && (
          <div className="mt-5 p-5 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border-2 border-indigo-200 shadow-sm space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                  <KeyRound size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Dispatcher Policy &amp; Security Architecture
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Configure dispatcher accounts and routing policy. App Passwords are strictly loaded from the <code className="font-bold text-indigo-700">.env</code> file.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200">
                Secured in .env
              </span>
            </div>

            {/* Strict .env Security Notice Card */}
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-emerald-950">
                <Lock size={15} className="text-emerald-700" />
                <span>Password Security Enforced</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                As requested, Google App Passwords are <strong>strictly maintained within the server environment (<code className="font-semibold">.env</code> file)</strong> and are not displayed or editable in the client-side user interface. This guarantees full protection against browser exposure.
              </p>
              <div className="pt-1 flex items-center gap-4 text-[11px] font-mono">
                <span className="flex items-center gap-1">
                  <Check size={12} className="text-emerald-600 font-bold" />
                  Primary Status: {hasPrimaryPass ? <strong className="text-emerald-700">Configured in .env (EMAIL_APP_PASS_2)</strong> : <strong className="text-amber-700">Checking .env</strong>}
                </span>
                <span className="flex items-center gap-1">
                  <Check size={12} className="text-emerald-600 font-bold" />
                  Standby Status: {hasSecondaryPass ? <strong className="text-emerald-700">Configured in .env (EMAIL_APP_PASS_1)</strong> : <strong className="text-slate-600">Shared/Fallback</strong>}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveEmailConfig} className="space-y-4">
              {/* Dispatch Mode Selector */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Automated / Manual Routing Policy
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                    selectedMode === 'auto'
                      ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}>
                    <input
                      type="radio"
                      name="emailMode"
                      value="auto"
                      checked={selectedMode === 'auto'}
                      onChange={() => setSelectedMode('auto')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">Automatic 400-Quota Rule (Default)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Uses <code className="text-indigo-600 font-semibold">{primaryEmailInput}</code> for first 400 emails, then automatically switches to <code className="text-purple-600 font-semibold">{secondaryEmailInput}</code>.
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                    selectedMode === 'primary'
                      ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}>
                    <input
                      type="radio"
                      name="emailMode"
                      value="primary"
                      checked={selectedMode === 'primary'}
                      onChange={() => setSelectedMode('primary')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">Manual: Force Priority 1</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Strictly uses <code className="text-indigo-600 font-semibold">{primaryEmailInput}</code> as primary until 400 emails.
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                    selectedMode === 'secondary'
                      ? 'border-purple-600 bg-purple-50/60 ring-1 ring-purple-500'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}>
                    <input
                      type="radio"
                      name="emailMode"
                      value="secondary"
                      checked={selectedMode === 'secondary'}
                      onChange={() => setSelectedMode('secondary')}
                      className="mt-0.5 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">Manual: Switch to Standby</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Manually routes first via <code className="text-purple-600 font-semibold">{secondaryEmailInput}</code> until 400 emails.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Account Address Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Primary Account Settings */}
                <div className="p-4 bg-white rounded-xl border border-indigo-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      Priority 1 Account (First 400 Daily Emails)
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Check size={10} /> Password in .env
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Primary Email Address</label>
                    <input
                      type="email"
                      required
                      value={primaryEmailInput}
                      onChange={(e) => setPrimaryEmailInput(e.target.value)}
                      placeholder="donotreply.rtss@gmail.com"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-900 font-mono focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Secondary Account Settings */}
                <div className="p-4 bg-white rounded-xl border border-purple-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                      Priority 2 Account (Standby / Failover 401-800)
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Check size={10} /> Password in .env
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Standby Email Address</label>
                    <input
                      type="email"
                      required
                      value={secondaryEmailInput}
                      onChange={(e) => setSecondaryEmailInput(e.target.value)}
                      placeholder="reliabletechss.fikkal@gmail.com"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-900 font-mono focus:outline-hidden focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {configSaveSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Configuration saved and applied in database! Primary email set to {primaryEmailInput}.</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm active:scale-98"
                >
                  {isSavingConfig ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{isSavingConfig ? 'Saving Settings...' : 'Save Routing Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 6. REAL-TIME EMAIL DISPATCH & RECIPIENT AUDIT LOG */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <Mail size={18} className="text-indigo-600" />
              <span>Real-Time Email Dispatches & Recipient Audit Log</span>
            </h4>
            <p className="text-xs text-slate-500">
              Live record of all email dispatches showing recipient names, email IDs, dispatch types, sender accounts, and delivery status.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={logs.length === 0}
              className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              title="Export Log to CSV"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search recipient name, email, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Email Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 font-medium focus:outline-hidden focus:border-indigo-500"
            >
              <option value="all">All Email Types & Purposes</option>
              <option value="Custom">Custom Communications</option>
              <option value="Tax Invoice">Tax Invoices & Billing</option>
              <option value="Quotation">Quotations & Estimates</option>
              <option value="Payment">Payment Receipts</option>
              <option value="Official Letter">Official Letters</option>
              <option value="OTP">OTP Verification Codes</option>
              <option value="Staff">Staff / Admin Login OTPs</option>
              <option value="Customer">Customer OTP & Password Resets</option>
              <option value="Order">Order Notifications</option>
              <option value="Diagnostic">Diagnostic Tests</option>
            </select>
          </div>

          {/* Sender Filter */}
          <div>
            <select
              value={senderFilter}
              onChange={(e) => setSenderFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 font-medium focus:outline-hidden focus:border-indigo-500 font-mono"
            >
              <option value="all">All Senders (Priority 1 & 2)</option>
              <option value="donotreply">donotreply.rtss@gmail.com (Priority 1)</option>
              <option value="reliabletechss">reliabletechss.fikkal@gmail.com (Priority 2)</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3.5">Time / Date</th>
                <th className="py-3 px-3.5">Dispatched Via (Sender)</th>
                <th className="py-3 px-3.5">Recipient Details</th>
                <th className="py-3 px-3.5">Email Purpose / Type</th>
                <th className="py-3 px-3.5">Subject</th>
                <th className="py-3 px-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <Mail size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold">No email dispatch records found.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Dispatches from Custom Emails, OTP verification, order updates, invoices, and diagnostic tests will appear here automatically.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isPrimary = log.sender.toLowerCase().includes('donotreply');
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {log.dateFormatted || new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold ${
                          isPrimary 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPrimary ? 'bg-indigo-600' : 'bg-purple-600'}`}></span>
                          {log.sender}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 flex items-center gap-1">
                            <User size={12} className="text-slate-400" />
                            {log.recipientName || 'Valued User'}
                          </span>
                          <span className="text-[11px] text-slate-600 font-mono">
                            {log.recipientEmail}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.emailType.includes('OTP') || log.emailType.includes('Staff')
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : log.emailType.includes('Order')
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : log.emailType.includes('Reset')
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : log.emailType.includes('Custom')
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {log.emailType}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 max-w-[240px] truncate text-slate-700 font-medium" title={log.subject}>
                        {log.subject}
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        {log.success ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200" title={`Message ID: ${log.messageId || 'Delivered'}`}>
                            <CheckCircle2 size={12} />
                            Delivered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200" title={log.error || 'Dispatch Failed'}>
                            <AlertCircle size={12} />
                            Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          <span>Showing {filteredLogs.length} of {logs.length} logged email dispatches</span>
          <span>Last live sync: {lastRefreshed.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};
