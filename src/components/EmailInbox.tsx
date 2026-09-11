import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Mail,
  Send,
  Inbox,
  Star,
  Trash2,
  Paperclip,
  FileText,
  Search,
  RefreshCw,
  Plus,
  X,
  Check,
  AlertCircle,
  Eye,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Maximize2,
  Minimize2,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Building,
  User,
  ShieldAlert,
  HelpCircle,
  Reply,
  Forward,
  Users
} from 'lucide-react';
import {
  EmailMessage,
  EmailFileAttachment,
  SystemReportAttachment,
  AppUser,
  SalesInvoice,
  Expense,
  Supplier,
  CustomerAccount,
  Shareholder,
  BusinessProfile,
  DailyClosing
} from '../types';
import {
  fetchEmailsApi,
  sendEmailApi,
  updateEmailApi,
  deleteEmailApi,
  syncEmailsApi,
  EmailCounts
} from '../utils/gmailClient';
import { NepaliDatePicker } from './NepaliDatePicker';
import { getCurrentBsDate } from '../utils/nepaliDate';
import { generateReportPdf } from '../utils/reportPdfGenerator';
import { generateLetterpadEmailHtml } from '../utils/letterpadEmailTemplate';
import { DailyClosingStatementView } from './DailyClosingStatementView';
import { buildDailyClosingReportData } from '../utils/dailyClosingReportBuilder';

interface EmailInboxProps {
  currentUser: AppUser;
  invoices?: SalesInvoice[];
  expenses?: Expense[];
  suppliers?: Supplier[];
  customers?: CustomerAccount[];
  shareholders?: Shareholder[];
  users?: AppUser[];
  dailyClosings?: DailyClosing[];
  profile?: BusinessProfile;
  initialSelectedEmailId?: string;
}

export const EmailInbox: React.FC<EmailInboxProps> = ({
  currentUser,
  invoices = [],
  expenses = [],
  suppliers = [],
  customers = [],
  shareholders = [],
  users = [],
  dailyClosings = [],
  profile,
  initialSelectedEmailId
}) => {
  // Navigation & Filtering
  const [activeAccount, setActiveAccount] = useState<'all' | 'primary' | 'secondary'>('all');
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'starred' | 'trash'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Email State
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [counts, setCounts] = useState<EmailCounts>({
    total: 0,
    primary: 0,
    secondary: 0,
    inbox: 0,
    sent: 0,
    starred: 0,
    unreadPrimary: 0,
    unreadSecondary: 0,
    unreadTotal: 0
  });
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isComposeMaximized, setIsComposeMaximized] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [composeFrom, setComposeFrom] = useState<'auto' | 'primary' | 'secondary'>('auto');
  const [composeTo, setComposeTo] = useState('');
  const [composeToName, setComposeToName] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [composeBcc, setComposeBcc] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeType, setComposeType] = useState('Official Business Dispatch');
  const [composeMessage, setComposeMessage] = useState('');

  // Multi-Recipient Compose State
  const [composeRecipients, setComposeRecipients] = useState<Array<{ email: string; name?: string; category?: string }>>([]);
  const [recipientInput, setRecipientInput] = useState('');

  // Letterhead design toggle & preview
  const [useLetterpadDesign, setUseLetterpadDesign] = useState<boolean>(true);
  const [showLetterpadPreview, setShowLetterpadPreview] = useState<boolean>(false);

  // Attachments in Compose
  const [composeFiles, setComposeFiles] = useState<EmailFileAttachment[]>([]);
  const [composeReports, setComposeReports] = useState<SystemReportAttachment[]>([]);

  // System Report / Invoice Picker Modal
  const [showReportPicker, setShowReportPicker] = useState(false);
  const [reportFormData, setReportFormData] = useState<SystemReportAttachment>({
    id: `rep_${Date.now()}`,
    category: 'Sales Bill / Invoice',
    title: 'Official Sales Invoice & Billing Statement',
    referenceNo: '',
    reportDate: getCurrentBsDate(),
    fromDate: getCurrentBsDate(),
    toDate: getCurrentBsDate(),
    amount: undefined,
    summary: ''
  });

  // Preview Modals
  const [previewFile, setPreviewFile] = useState<EmailFileAttachment | null>(null);
  const [previewReport, setPreviewReport] = useState<SystemReportAttachment | null>(null);

  // Accounts Configuration
  const primaryAccountEmail = 'donotreply.rtss@gmail.com';
  const secondaryAccountEmail = 'reliabletechss.fikkal@gmail.com';

  // Load Emails
  const loadEmails = async (showRefreshAnimation = false) => {
    if (showRefreshAnimation) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      let accParam: string | undefined = undefined;
      if (activeAccount === 'primary') accParam = primaryAccountEmail;
      else if (activeAccount === 'secondary') accParam = secondaryAccountEmail;

      const folderParam = activeFolder === 'starred' ? undefined : activeFolder;
      const starredParam = activeFolder === 'starred' ? true : undefined;

      const res = await fetchEmailsApi({
        account: accParam,
        folder: folderParam,
        starred: starredParam,
        search: searchQuery.trim() || undefined
      });

      if (res.success) {
        const normalized = (res.emails || []).map((eml, eIdx) => ({
          ...eml,
          id: eml.id || `eml_${eIdx}_${Date.now()}`,
          systemReports: (eml.systemReports || []).map((rep, rIdx) => ({
            ...rep,
            id: rep.id || `rep_${eml.id || eIdx}_${rIdx}_${rep.referenceNo || rep.title || 'item'}`
          })),
          fileAttachments: (eml.fileAttachments || []).map((file, fIdx) => ({
            ...file,
            id: file.id || `file_${eml.id || eIdx}_${fIdx}_${file.name || 'item'}`
          }))
        }));
        setEmails(normalized);
        setCounts(res.counts);

        // Keep selected email synced if present
        if (selectedEmail) {
          const updated = normalized.find(e => e.id === selectedEmail.id);
          if (updated) setSelectedEmail(updated);
        } else if (initialSelectedEmailId) {
          const matched = normalized.find(e => e.id === initialSelectedEmailId);
          if (matched) setSelectedEmail(matched);
        }
      }
    } catch (err) {
      console.error('Failed to load emails:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Sync state for direct Gmail integration
  const [isSyncing, setIsSyncing] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());

  // Direct manual Gmail Sync across both accounts
  const handleDirectGmailSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncEmailsApi();
      if (res.success) {
        showNotice(res.message || 'Direct sync with both Gmail accounts completed.');
        await loadEmails(true);
      } else {
        showNotice(res.message || 'Gmail sync attempt finished.', 'error');
      }
    } catch (err: any) {
      showNotice(err?.message || 'Sync failed.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync every minute when system is idle
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    const interval = setInterval(async () => {
      const idleTime = Date.now() - lastActivityRef.current;
      // When system is idle for at least 45 seconds, sync directly with Gmail every minute
      if (idleTime >= 45000 && !isSyncing) {
        try {
          await syncEmailsApi();
          loadEmails(false);
        } catch (e) {
          console.debug('Background idle Gmail sync error:', e);
        }
      }
    }, 60000); // 1 minute interval

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearInterval(interval);
    };
  }, [isSyncing]);

  useEffect(() => {
    loadEmails();
  }, [activeAccount, activeFolder, searchQuery]);

  // Helper to populate exact real daily closing data matching Daily Closing & Audit tab (without low stock)
  const populateDailyClosing = (selectedDateOrId: string) => {
    const dc = dailyClosings.find(d => d.id === selectedDateOrId || d.date === selectedDateOrId);
    if (!dc) return;

    const openingCash = dc.openingCashToday || 0;
    const totalIncomes = (dc.totalSales || 0) + (dc.duesCollected || 0) + (dc.cashTransfersIn || 0);
    const totalExpenses = dc.totalExpenses || dc.cashExpenses || 0;
    const depositAmount = dc.depositAmount || 0;

    let depositTargetText = 'No Deposit (Kept in Register)';
    if (dc.splitDeposits && dc.splitDeposits.length > 0) {
      depositTargetText = dc.splitDeposits.map(s => `${s.targetAccount}: Rs. ${s.amount.toLocaleString()}`).join(', ');
    } else if (dc.depositTarget && dc.depositTarget !== 'None') {
      depositTargetText = `${dc.depositTarget}: Rs. ${depositAmount.toLocaleString()}`;
    }

    const denEntries = Object.entries(dc.denominations || {})
      .filter(([_, count]) => (Number(count) || 0) > 0)
      .map(([val, count]) => `Rs. ${val}×${count}`);
    const denomText = denEntries.length > 0 ? denEntries.join(', ') : 'None counted';

    // Exact 12 line items matching DailyClosingComponent.tsx handlePrint (WITHOUT LOW STOCK)
    const exactItems = [
      {
        sn: 1,
        name: 'Opening Cash Balance',
        description: 'Start-of-day cash drawer register balance',
        quantity: 1,
        unitPrice: openingCash,
        totalPrice: openingCash
      },
      {
        sn: 2,
        name: 'Cash Sales Receipts',
        description: 'Physical cash received from invoice sales',
        quantity: 1,
        unitPrice: dc.cashSales || 0,
        totalPrice: dc.cashSales || 0
      },
      {
        sn: 3,
        name: 'eSewa Online Wallet Sales',
        description: 'Digital payments collected via eSewa QR/Wallet',
        quantity: 1,
        unitPrice: dc.esewaSales || 0,
        totalPrice: dc.esewaSales || 0
      },
      {
        sn: 4,
        name: 'Rastriya Banijya Bank (RBB) Sales',
        description: 'Direct bank transfer payments for sales',
        quantity: 1,
        unitPrice: dc.bankSales || 0,
        totalPrice: dc.bankSales || 0
      },
      {
        sn: 5,
        name: 'Sahakari Cooperative Sales',
        description: 'Cooperative account payments received',
        quantity: 1,
        unitPrice: dc.sahakariSales || 0,
        totalPrice: dc.sahakariSales || 0
      },
      {
        sn: 6,
        name: 'Credit Due Sales (Outstanding)',
        description: 'Uncollected credit invoice sales issued today',
        quantity: 1,
        unitPrice: dc.dueSales || 0,
        totalPrice: dc.dueSales || 0
      },
      ...(dc.duesCollected && dc.duesCollected > 0 ? [{
        sn: 7,
        name: 'Past Dues Recouped Today',
        description: `Recouped from previous credit customers (${(dc.duesCollectedDetails || []).map(d => `${d.customerName} [${d.method}]`).join(', ')})`,
        quantity: 1,
        unitPrice: dc.duesCollected,
        totalPrice: dc.duesCollected
      }] : []),
      ...(dc.cashTransfersIn && dc.cashTransfersIn > 0 ? [{
        sn: 8,
        name: 'Inter-Account Cash Inflow',
        description: 'Transfers or Bank Withdrawals received into Cash Drawer',
        quantity: 1,
        unitPrice: dc.cashTransfersIn,
        totalPrice: dc.cashTransfersIn
      }] : []),
      {
        sn: 9,
        name: 'Approved Cash Expenditures',
        description: 'Operating expenses disbursed from physical cash drawer',
        quantity: 1,
        unitPrice: dc.cashExpenses || 0,
        totalPrice: dc.cashExpenses || 0
      },
      ...(dc.cashTransfersOut && dc.cashTransfersOut > 0 ? [{
        sn: 10,
        name: 'Inter-Account Cash Outflow',
        description: 'Cash Drawer funds transferred/deposited into Bank/Wallets',
        quantity: 1,
        unitPrice: dc.cashTransfersOut,
        totalPrice: dc.cashTransfersOut
      }] : []),
      ...(depositAmount > 0 ? [{
        sn: 11,
        name: `Closing Bank Deposit (${depositTargetText})`,
        description: `Cash deposited from drawer during daily closing`,
        quantity: 1,
        unitPrice: depositAmount,
        totalPrice: depositAmount
      }] : []),
      {
        sn: 12,
        name: 'Net Handover Cash (In Drawer)',
        description: `Opening Cash for Tomorrow. Denominations Count: ${denomText}`,
        quantity: 1,
        unitPrice: dc.remainingCash,
        totalPrice: dc.remainingCash
      }
    ];

    const exactNotes = `Opening Cash: Rs. ${openingCash.toLocaleString()} | Deposits: ${depositTargetText}.\nPhysical Denomination Breakdown: ${denomText}.\nTotal Incomes: Rs. ${totalIncomes.toLocaleString()} | Total Expenses: Rs. ${totalExpenses.toLocaleString()}${dc.adminRemarks ? `\nAudit Remarks: ${dc.adminRemarks}` : ''}`;
    const exactWords = `Net Handover Cash: Rs. ${dc.remainingCash.toLocaleString('en-IN')}`;

    const detailedReport = buildDailyClosingReportData(dc, {
      invoices,
      expenses,
      users,
      currentUser
    });

    setReportFormData(prev => ({
      ...prev,
      category: 'Daily Closing',
      title: 'Daily Cash & Sales Closing Voucher',
      referenceNo: detailedReport.voucherNumber,
      reportDate: dc.date,
      fromDate: dc.date,
      toDate: dc.date,
      amount: dc.remainingCash,
      subtotal: totalIncomes,
      grandTotal: dc.remainingCash,
      amountInWords: exactWords,
      notes: exactNotes,
      preparedBy: dc.submittedBy,
      approvedBy: dc.approvedBy || `${profile?.name || 'Authorized'} Manager`,
      status: dc.status || 'Verified',
      items: exactItems,
      summary: exactNotes,
      closingData: dc,
      dailyClosingData: detailedReport
    }));
  };

  // Notice helper
  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setActionNotice({ type, message });
    setTimeout(() => {
      setActionNotice(null);
    }, 4500);
  };

  // Toggle Star
  const handleToggleStar = async (email: EmailMessage, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStarred = !email.isStarred;
    setEmails(prev => prev.map(item => item.id === email.id ? { ...item, isStarred: newStarred } : item));
    if (selectedEmail?.id === email.id) {
      setSelectedEmail(prev => prev ? { ...prev, isStarred: newStarred } : null);
    }
    await updateEmailApi(email.id, { isStarred: newStarred });
  };

  // Toggle Read
  const handleToggleRead = async (email: EmailMessage, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newRead = !email.isRead;
    setEmails(prev => prev.map(item => item.id === email.id ? { ...item, isRead: newRead } : item));
    if (selectedEmail?.id === email.id) {
      setSelectedEmail(prev => prev ? { ...prev, isRead: newRead } : null);
    }
    await updateEmailApi(email.id, { isRead: newRead });
  };

  // Open Email
  const handleOpenEmail = async (email: EmailMessage) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      setEmails(prev => prev.map(item => item.id === email.id ? { ...item, isRead: true } : item));
      await updateEmailApi(email.id, { isRead: true });
    }
  };

  // Delete Email
  const handleDeleteEmail = async (email: EmailMessage, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isTrash = email.folder === 'trash';
    const confirmDelete = isTrash 
      ? window.confirm('Permanently delete this email?') 
      : window.confirm('Move email to trash?');
    
    if (!confirmDelete) return;

    if (isTrash) {
      setEmails(prev => prev.filter(item => item.id !== email.id));
      if (selectedEmail?.id === email.id) setSelectedEmail(null);
      await deleteEmailApi(email.id, true);
      showNotice('Email permanently deleted.');
    } else {
      setEmails(prev => prev.map(item => item.id === email.id ? { ...item, folder: 'trash' } : item));
      if (selectedEmail?.id === email.id) setSelectedEmail(null);
      await updateEmailApi(email.id, { folder: 'trash' });
      showNotice('Email moved to trash.');
    }
    loadEmails();
  };

  // Reply and Forward handlers
  const handleReplyEmail = (email: EmailMessage) => {
    const replySubject = email.subject.toLowerCase().startsWith('re:') ? email.subject : `Re: ${email.subject}`;
    setComposeTo(email.senderEmail || '');
    setComposeToName(email.senderName || '');
    setComposeRecipients([{ email: email.senderEmail, name: email.senderName }]);
    setComposeCc(email.cc || '');
    setComposeSubject(replySubject);
    setComposeType(email.emailType || 'Official Business Dispatch');
    
    const quoteHeader = `\n\n\n---------- Original Message ----------\nFrom: ${email.senderName || ''} <${email.senderEmail}>\nDate: ${email.dateFormatted || new Date(email.timestamp).toLocaleString()}\nSubject: ${email.subject}\nTo: ${email.recipientEmail}\n\n`;
    const cleanBody = (email.body || '').replace(/<[^>]*>?/gm, '');
    setComposeMessage(quoteHeader + cleanBody);
    setIsComposeOpen(true);
  };

  const handleForwardEmail = (email: EmailMessage) => {
    const fwdSubject = email.subject.toLowerCase().startsWith('fwd:') ? email.subject : `Fwd: ${email.subject}`;
    setComposeTo('');
    setComposeToName('');
    setComposeRecipients([]);
    setComposeSubject(fwdSubject);
    setComposeType(email.emailType || 'Official Business Dispatch');

    const quoteHeader = `\n\n\n---------- Forwarded message ----------\nFrom: ${email.senderName || ''} <${email.senderEmail}>\nDate: ${email.dateFormatted || new Date(email.timestamp).toLocaleString()}\nSubject: ${email.subject}\nTo: ${email.recipientEmail}\n\n`;
    const cleanBody = (email.body || '').replace(/<[^>]*>?/gm, '');
    setComposeMessage(quoteHeader + cleanBody);

    // Carry forward attachments
    if (email.fileAttachments && email.fileAttachments.length > 0) {
      setComposeFiles([...email.fileAttachments]);
    } else {
      setComposeFiles([]);
    }
    if (email.systemReports && email.systemReports.length > 0) {
      setComposeReports([...email.systemReports]);
    } else {
      setComposeReports([]);
    }
    setIsComposeOpen(true);
  };

  // File Upload Handlers (Supports any file type up to 25MB)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (file.size > 25 * 1024 * 1024) {
        showNotice(`File "${file.name}" exceeds 25MB limit. Please attach smaller files.`, 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvt) => {
        const dataUrl = uploadEvt.target?.result as string;
        const newAttachment: EmailFileAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl
        };
        setComposeFiles(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeComposeFile = (id: string) => {
    setComposeFiles(prev => prev.filter(f => f.id !== id));
  };

  const removeComposeReport = (id: string) => {
    const repToRemove = composeReports.find(r => r.id === id);
    if (repToRemove?.fileName) {
      setComposeFiles(prev => prev.filter(f => f.name !== repToRemove.fileName));
    }
    setComposeReports(prev => prev.filter(r => r.id !== id));
  };

  // Multi-Recipient helper methods
  const addRecipient = (emailStr: string, name?: string, category?: string) => {
    const clean = emailStr.trim().toLowerCase();
    if (!clean || !clean.includes('@')) return;
    if (composeRecipients.some(r => r.email.toLowerCase() === clean)) return;
    setComposeRecipients(prev => [...prev, { email: clean, name, category }]);
    setRecipientInput('');
  };

  const removeRecipient = (emailToRemove: string) => {
    setComposeRecipients(prev => prev.filter(r => r.email.toLowerCase() !== emailToRemove.toLowerCase()));
  };

  const handleRecipientInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault();
      if (recipientInput.trim()) {
        const parts = recipientInput.split(/[,;\s]+/).map(p => p.trim()).filter(Boolean);
        parts.forEach(p => {
          if (p.includes('@')) addRecipient(p);
        });
      }
    }
  };

  // Dispatch Email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    // Collect all recipients from chips, recipientInput, and composeTo
    let finalRecipients = [...composeRecipients];
    if (recipientInput.trim()) {
      const parts = recipientInput.split(/[,;\s]+/).map(p => p.trim()).filter(Boolean);
      parts.forEach(p => {
        if (p.includes('@') && !finalRecipients.some(r => r.email.toLowerCase() === p.toLowerCase())) {
          finalRecipients.push({ email: p.toLowerCase() });
        }
      });
    }
    if (composeTo.trim()) {
      const parts = composeTo.split(/[,;\s]+/).map(p => p.trim()).filter(Boolean);
      parts.forEach(p => {
        if (p.includes('@') && !finalRecipients.some(r => r.email.toLowerCase() === p.toLowerCase())) {
          finalRecipients.push({ email: p.toLowerCase(), name: composeToName || undefined });
        }
      });
    }

    if (finalRecipients.length === 0) {
      showNotice('Please add at least one valid recipient email address.', 'error');
      return;
    }
    if (!composeSubject.trim()) {
      showNotice('Please enter an email subject.', 'error');
      return;
    }

    const allEmails = finalRecipients.map(r => r.email);
    const allEmailsStr = allEmails.join(', ');
    const allNamesStr = finalRecipients.map(r => r.name || r.email).join(', ');

    // Generate official letterhead HTML if enabled
    let htmlContent: string | undefined = undefined;
    if (useLetterpadDesign) {
      const userDesignation = currentUser?.post 
        || (currentUser as any)?.designation 
        || currentUser?.designationNepali 
        || (currentUser?.role === 'Super Admin' 
            ? 'System Master / Managing Director' 
            : currentUser?.role === 'Admin' 
            ? 'Administrator' 
            : currentUser?.role === 'Shareholder'
            ? 'Shareholder'
            : 'Technical Staff / Officer');

      htmlContent = generateLetterpadEmailHtml({
        recipientName: allNamesStr,
        recipientEmail: allEmailsStr,
        subject: composeSubject.trim(),
        message: composeMessage.trim(),
        bsDate: getCurrentBsDate(),
        systemReports: composeReports,
        fileAttachments: composeFiles,
        profile,
        senderTitle: currentUser?.name ? `${currentUser.name} (${userDesignation})` : userDesignation
      });
    }

    setIsSending(true);
    try {
      const res = await sendEmailApi({
        recipientEmail: allEmailsStr,
        recipientName: allNamesStr || undefined,
        cc: composeCc.trim() || undefined,
        bcc: composeBcc.trim() || undefined,
        subject: composeSubject.trim(),
        message: composeMessage.trim(),
        htmlContent: htmlContent,
        emailType: composeType,
        senderChoice: composeFrom,
        fileAttachments: composeFiles,
        systemReports: composeReports,
        bsDate: getCurrentBsDate()
      });

      if (res.success) {
        showNotice(`✓ Email dispatched to ${finalRecipients.length} recipient${finalRecipients.length > 1 ? 's' : ''} via ${res.email?.sender || 'RTSS'}`);
        setIsComposeOpen(false);
        // Reset form
        setComposeRecipients([]);
        setRecipientInput('');
        setComposeTo('');
        setComposeToName('');
        setComposeCc('');
        setComposeBcc('');
        setComposeSubject('');
        setComposeMessage('');
        setComposeFiles([]);
        setComposeReports([]);
        loadEmails(true);
      } else {
        showNotice(res.error || 'Failed to dispatch email.', 'error');
      }
    } catch (err: any) {
      showNotice(err.message || 'Error dispatching email.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Contacts Autocomplete Suggestions (combining users, customers, suppliers, shareholders)
  const contactSuggestions = useMemo(() => {
    const list: Array<{ name: string; email: string; category: string }> = [];
    customers.forEach(c => {
      if (c.email && c.email.includes('@')) {
        list.push({ name: c.name, email: c.email, category: 'Customer' });
      }
    });
    suppliers.forEach(s => {
      if (s.email && s.email.includes('@')) {
        list.push({ name: s.name, email: s.email, category: 'Supplier' });
      }
    });
    users.forEach(u => {
      if (u.email && u.email.includes('@')) {
        list.push({ name: u.name, email: u.email, category: 'Staff' });
      }
    });
    shareholders.forEach(sh => {
      if (sh.email && sh.email.includes('@')) {
        list.push({ name: sh.name, email: sh.email, category: 'Shareholder' });
      }
    });
    return list;
  }, [customers, suppliers, users, shareholders]);

  // All system users with an email (Admin, System Master, User/Staff, Shareholders)
  // Accounts whose email id is NOT added will not appear.
  const allUserContactsWithEmail = useMemo(() => {
    const map = new Map<string, { name: string; email: string; category: string }>();

    const defaultUserEmails: { [username: string]: string } = {
      'Arpan': 'arpankhadka57@gmail.com',
      'reliableadmin': 'reliabletechss.fikkal@gmail.com',
      'reliableuser': 'reliableuser.rtss@gmail.com',
      'shareholder': 'shareholder.rtss@gmail.com'
    };

    // 1. All user accounts in users table: Admin, System Master (Super Admin), Staff/User
    users.forEach(u => {
      let email = u.email?.trim();
      if (!email || !email.includes('@')) {
        email = defaultUserEmails[u.username] || `${u.username.toLowerCase()}@reliabletech.com.np`;
      }
      if (email && email.includes('@')) {
        const roleLabel = u.role === 'Super Admin' ? 'System Master' : u.role;
        map.set(email.toLowerCase(), {
          name: u.name || u.username,
          email: email,
          category: roleLabel
        });
      }
    });

    // 2. Shareholder accounts having an email address
    shareholders.forEach(sh => {
      const email = (sh.email || sh.emailId)?.trim();
      if (email && email.includes('@')) {
        if (!map.has(email.toLowerCase())) {
          map.set(email.toLowerCase(), {
            name: sh.name,
            email: email,
            category: 'Shareholder'
          });
        }
      }
    });

    return Array.from(map.values());
  }, [users, shareholders]);

  const isAllUsersSelected = useMemo(() => {
    if (allUserContactsWithEmail.length === 0) return false;
    return allUserContactsWithEmail.every(u => 
      composeRecipients.some(r => r.email.toLowerCase() === u.email.toLowerCase())
    );
  }, [allUserContactsWithEmail, composeRecipients]);

  const handleToggleAllUsers = () => {
    if (allUserContactsWithEmail.length === 0) {
      alert("No user accounts found with registered email addresses.");
      return;
    }

    if (isAllUsersSelected) {
      // Deselect / remove all user accounts from recipients
      const userEmailSet = new Set(allUserContactsWithEmail.map(u => u.email.toLowerCase()));
      setComposeRecipients(prev => prev.filter(r => !userEmailSet.has(r.email.toLowerCase())));
    } else {
      // Add all user accounts that are not already present
      const existingLower = new Set(composeRecipients.map(r => r.email.toLowerCase()));
      const toAdd = allUserContactsWithEmail
        .filter(u => !existingLower.has(u.email.toLowerCase()))
        .map(u => ({ email: u.email, name: u.name, category: u.category }));
      
      setComposeRecipients(prev => [...prev, ...toAdd]);
    }
  };

  // Filtered emails based on selected category tag
  const filteredEmails = useMemo(() => {
    if (selectedTag === 'all') return emails;
    if (selectedTag === 'attachments') return emails.filter(e => e.hasAttachments);
    if (selectedTag === 'invoices') {
      return emails.filter(e => 
        (e.systemReports && e.systemReports.some(r => r.category.toLowerCase().includes('invoice') || r.category.toLowerCase().includes('bill'))) ||
        e.subject.toLowerCase().includes('invoice') || e.subject.toLowerCase().includes('bill')
      );
    }
    if (selectedTag === 'reports') {
      return emails.filter(e => 
        (e.systemReports && e.systemReports.length > 0) ||
        e.subject.toLowerCase().includes('report') || e.subject.toLowerCase().includes('ledger')
      );
    }
    if (selectedTag === 'security') {
      return emails.filter(e => e.emailType?.toLowerCase().includes('otp') || e.subject.toLowerCase().includes('otp') || e.subject.toLowerCase().includes('security'));
    }
    return emails;
  }, [emails, selectedTag]);

  // Format File Size
  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper for file icon
  const getFileIcon = (fileName: string, mimeType?: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || mimeType?.includes('pdf')) return <FileText className="text-rose-600" size={18} />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '') || mimeType?.includes('image')) return <ImageIcon className="text-sky-600" size={18} />;
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return <FileSpreadsheet className="text-emerald-600" size={18} />;
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return <FileArchive className="text-amber-600" size={18} />;
    return <Paperclip className="text-slate-600" size={18} />;
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-4">
      {/* ACTION NOTICE TOAST */}
      {actionNotice && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-sm font-semibold animate-fade-in ${
          actionNotice.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-rose-50 text-rose-900 border-rose-300'
        }`}>
          {actionNotice.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> : <AlertCircle size={18} className="text-rose-600 shrink-0" />}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* TOP HEADER: DUAL-ACCOUNT GMAIL APP BAR */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-red-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
            <Mail size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Gmail Webmail Client</h1>
              <span className="bg-sky-100 text-sky-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-sky-200">
                Dual Accounts
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Unified inbox for <strong>donotreply.rtss@gmail.com</strong> &amp; <strong>reliabletechss.fikkal@gmail.com</strong>
            </p>
          </div>
        </div>

        {/* ACCOUNT SELECTOR TABS */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200 w-full md:w-auto">
          <button
            type="button"
            onClick={() => { setActiveAccount('all'); setSelectedEmail(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeAccount === 'all'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={14} className="text-slate-500" />
            <span>Both Accounts ({counts.total})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveAccount('primary'); setSelectedEmail(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeAccount === 'primary'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-700 hover:bg-blue-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>donotreply.rtss ({counts.primary})</span>
            {counts.unreadPrimary > 0 && (
              <span className="text-[10px] bg-blue-700 text-white px-1.5 py-0.2 rounded-full font-mono">
                {counts.unreadPrimary}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setActiveAccount('secondary'); setSelectedEmail(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeAccount === 'secondary'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>reliabletechss.fikkal ({counts.secondary})</span>
            {counts.unreadSecondary > 0 && (
              <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.2 rounded-full font-mono">
                {counts.unreadSecondary}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* MAIN DUAL PANE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT SIDEBAR: FOLDERS, QUOTA & COMPOSE BUTTON */}
        <div className="lg:col-span-3 space-y-3">
          {/* PRIMARY ACTION: COMPOSE EMAIL */}
          <button
            type="button"
            onClick={() => setIsComposeOpen(true)}
            className="w-full py-3 px-4 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer text-sm"
          >
            <Plus size={20} className="stroke-[2.5]" />
            <span>Compose Email</span>
          </button>

          {/* FOLDERS LIST */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-2.5 space-y-1">
            <button
              type="button"
              onClick={() => { setActiveFolder('inbox'); setSelectedEmail(null); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFolder === 'inbox' ? 'bg-sky-100 text-sky-950 font-extrabold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox size={17} className={activeFolder === 'inbox' ? 'text-sky-700' : 'text-slate-500'} />
                <span>Inbox</span>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {counts.inbox}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveFolder('starred'); setSelectedEmail(null); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFolder === 'starred' ? 'bg-amber-100 text-amber-950 font-extrabold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star size={17} className={activeFolder === 'starred' ? 'text-amber-500 fill-amber-500' : 'text-slate-500'} />
                <span>Starred</span>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {counts.starred}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveFolder('sent'); setSelectedEmail(null); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFolder === 'sent' ? 'bg-emerald-100 text-emerald-950 font-extrabold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Send size={17} className={activeFolder === 'sent' ? 'text-emerald-700' : 'text-slate-500'} />
                <span>Sent Mail</span>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {counts.sent}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveFolder('trash'); setSelectedEmail(null); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFolder === 'trash' ? 'bg-rose-100 text-rose-950 font-extrabold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Trash2 size={17} className={activeFolder === 'trash' ? 'text-rose-700' : 'text-slate-500'} />
                <span>Trash</span>
              </div>
            </button>
          </div>

          {/* QUICK FILTER TAGS */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3 space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">Quick Filters</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedTag('all')}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  selectedTag === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Messages
              </button>
              <button
                type="button"
                onClick={() => setSelectedTag('attachments')}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                  selectedTag === 'attachments' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <Paperclip size={12} />
                <span>Has Files</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTag('invoices')}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                  selectedTag === 'invoices' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <FileText size={12} />
                <span>Invoices</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTag('reports')}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                  selectedTag === 'reports' ? 'bg-sky-600 text-white' : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                }`}
              >
                <Layers size={12} />
                <span>Reports</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTag('security')}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                  selectedTag === 'security' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                <ShieldAlert size={12} />
                <span>Security / OTP</span>
              </button>
            </div>
          </div>

          {/* DUAL 400 QUOTA MONITOR */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-sm border border-slate-700 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-sky-400 flex items-center gap-1.5">
                <Clock size={13} />
                <span>400-Email Quota Engine</span>
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                Active
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 truncate max-w-[150px]" title="donotreply.rtss@gmail.com">
                  1. donotreply.rtss
                </span>
                <span className="font-mono text-emerald-400 font-bold">Healthy (400 limit)</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-sky-400 h-full w-[12%]"></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 truncate max-w-[150px]" title="reliabletechss.fikkal@gmail.com">
                  2. reliabletechss.fikkal
                </span>
                <span className="font-mono text-emerald-400 font-bold">Failover Ready</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-[8%]"></div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-tight pt-1">
              Emails auto-switch to account 2 if primary reaches 400 dispatches in 24h.
            </p>
          </div>
        </div>

        {/* RIGHT MAIN AREA: INBOX LIST OR EMAIL READER */}
        <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col min-h-[640px]">
          {/* SEARCH & CONTROLS TOOLBAR */}
          <div className="p-3 sm:p-4 border-b border-slate-200/90 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              {selectedEmail && (
                <button
                  type="button"
                  onClick={() => setSelectedEmail(null)}
                  className="p-2 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                  title="Back to inbox list"
                >
                  <ChevronLeft size={18} />
                  <span className="hidden sm:inline">Back</span>
                </button>
              )}

              {/* SEARCH BAR */}
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search mail by subject, sender, customer, invoice or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs font-medium focus:outline-hidden focus:border-sky-500 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT BUTTONS: REFRESH, DIRECT GMAIL SYNC & COUNT */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
                {filteredEmails.length} message{filteredEmails.length !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={handleDirectGmailSync}
                disabled={isSyncing}
                className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
                title="Direct live IMAP sync with Gmail accounts (both donotreply.rtss & reliabletechss.fikkal)"
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Syncing Gmail...' : 'Sync with Gmail'}</span>
              </button>
              <button
                type="button"
                onClick={() => loadEmails(true)}
                disabled={isRefreshing || isSyncing}
                className="p-2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition cursor-pointer"
                title="Refresh mailbox"
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-sky-600' : ''} />
              </button>
            </div>
          </div>

          {/* MAIN VIEWPORT: LIST VIEW OR DETAILED EMAIL VIEW */}
          {selectedEmail ? (
            /* ============================================================ */
            /* SINGLE EMAIL READING PANE                                   */
            /* ============================================================ */
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
              {/* HEADER ACTIONS */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      selectedEmail.account.includes('donotreply')
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      via {selectedEmail.account}
                    </span>
                    {selectedEmail.emailType && (
                      <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                        {selectedEmail.emailType}
                      </span>
                    )}
                    {selectedEmail.bsDate && (
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        BS: {selectedEmail.bsDate}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    {selectedEmail.subject}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleToggleStar(selectedEmail, e)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                    title={selectedEmail.isStarred ? 'Unstar' : 'Star'}
                  >
                    <Star
                      size={18}
                      className={selectedEmail.isStarred ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                    title="Print Email"
                  >
                    <Printer size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteEmail(selectedEmail, e)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                    title="Delete Email"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* SENDER & RECIPIENT CARD */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {(selectedEmail.senderName || selectedEmail.senderEmail || 'R')[0].toUpperCase()}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {selectedEmail.senderName || selectedEmail.senderEmail}
                      </span>
                      <span className="text-xs text-slate-500">&lt;{selectedEmail.senderEmail}&gt;</span>
                    </div>
                    <div className="text-xs text-slate-600">
                      <span>to: <strong>{selectedEmail.recipientName || selectedEmail.recipientEmail}</strong> &lt;{selectedEmail.recipientEmail}&gt;</span>
                      {selectedEmail.cc && <span className="ml-2 text-slate-400">cc: {selectedEmail.cc}</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-500 font-medium shrink-0">
                  <div>{selectedEmail.dateFormatted || new Date(selectedEmail.timestamp).toLocaleString()}</div>
                  {selectedEmail.messageId && (
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-[180px]" title={selectedEmail.messageId}>
                      ID: {selectedEmail.messageId}
                    </div>
                  )}
                </div>
              </div>

              {/* EMAIL BODY CONTENT */}
              <div className="prose prose-sm max-w-none text-slate-800 leading-relaxed font-sans bg-white p-2">
                {selectedEmail.htmlContent ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }} />
                ) : (
                  <div className="whitespace-pre-wrap font-sans text-sm text-slate-800">
                    {selectedEmail.body}
                  </div>
                )}
              </div>

              {/* ATTACHED SYSTEM REPORTS & INVOICES */}
              {selectedEmail.systemReports && selectedEmail.systemReports.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700">
                    <FileText size={16} className="text-indigo-600" />
                    <span>Attached System Reports &amp; Invoices ({selectedEmail.systemReports.length})</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedEmail.systemReports.map((report, rIdx) => (
                      <div
                        key={report.id || `selected_rep_${report.referenceNo || report.title || rIdx}`}
                        className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5 space-y-2 hover:bg-indigo-50 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-indigo-200/80 text-indigo-900 rounded">
                            {report.category}
                          </span>
                          {report.amount !== undefined && (
                            <span className="text-xs font-extrabold font-mono text-emerald-700">
                              NPR {Number(report.amount).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm text-slate-900 leading-snug">
                          {report.title}
                        </h4>

                        <div className="text-xs text-slate-600 space-y-0.5 font-medium">
                          {report.referenceNo && (
                            <p><strong>Ref / Bill No:</strong> <span className="font-mono">{report.referenceNo}</span></p>
                          )}
                          {report.reportDate && (
                            <p><strong>Interval / Date:</strong> <span>{report.reportDate} (BS)</span></p>
                          )}
                        </div>

                        {report.summary && (
                          <p className="text-xs text-slate-600 bg-white/80 p-2 rounded-lg border border-indigo-100 italic">
                            {report.summary}
                          </p>
                        )}

                        <div className="pt-2 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => setPreviewReport(report)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                          >
                            <Eye size={14} />
                            <span>View &amp; Print Document</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ATTACHED UPLOADED FILES */}
              {selectedEmail.fileAttachments && selectedEmail.fileAttachments.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700">
                    <Paperclip size={16} className="text-sky-600" />
                    <span>Attached Files ({selectedEmail.fileAttachments.length})</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedEmail.fileAttachments.map((file, fIdx) => (
                      <div
                        key={file.id || `selected_file_${file.name || fIdx}_${fIdx}`}
                        className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2 hover:border-sky-300 hover:shadow-xs transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                            {getFileIcon(file.name, file.type)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {file.dataUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewFile(file)}
                              className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                              title="Preview"
                            >
                              <Eye size={15} />
                            </button>
                          )}
                          {file.dataUrl && (
                            <a
                              href={file.dataUrl}
                              download={file.name}
                              className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              title="Download"
                            >
                              <Download size={15} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* REPLY & FORWARD ACTIONS AT LAST RIGHT SIDE */}
              <div className="pt-6 pb-2 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => handleReplyEmail(selectedEmail)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  id="email-reply-action-btn"
                  title="Reply to sender"
                >
                  <Reply size={15} />
                  <span>Reply</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleForwardEmail(selectedEmail)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  id="email-forward-action-btn"
                  title="Forward message to others"
                >
                  <Forward size={15} />
                  <span>Forward</span>
                </button>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* INBOX EMAIL LIST VIEW                                       */
            /* ============================================================ */
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {isLoading ? (
                <div className="p-12 text-center text-slate-500 space-y-3">
                  <RefreshCw size={28} className="animate-spin text-sky-600 mx-auto" />
                  <p className="text-xs font-bold">Synchronizing mailbox messages...</p>
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="p-16 text-center text-slate-400 space-y-3">
                  <Inbox size={40} className="mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-600">No emails found in this view</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {searchQuery
                      ? `No messages matched "${searchQuery}". Try a different keyword.`
                      : 'There are no messages in this category.'}
                  </p>
                </div>
              ) : (
                filteredEmails.map((email, eIdx) => {
                  const isPrimary = email.account.toLowerCase().includes('donotreply');
                  const hasReports = email.systemReports && email.systemReports.length > 0;
                  const hasFiles = email.fileAttachments && email.fileAttachments.length > 0;

                  return (
                    <div
                      key={email.id || `filtered_email_${eIdx}`}
                      onClick={() => handleOpenEmail(email)}
                      className={`flex items-center gap-3 px-3 sm:px-4 py-3 hover:bg-slate-50/90 transition cursor-pointer group ${
                        !email.isRead ? 'bg-sky-50/40 font-bold' : 'bg-white'
                      }`}
                    >
                      {/* STAR BUTTON */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleStar(email, e)}
                        className="text-slate-300 hover:text-amber-500 transition p-1 rounded cursor-pointer shrink-0"
                      >
                        <Star
                          size={16}
                          className={email.isStarred ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}
                        />
                      </button>

                      {/* ACCOUNT BADGE INDICATOR */}
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          isPrimary ? 'bg-blue-500 ring-2 ring-blue-100' : 'bg-emerald-500 ring-2 ring-emerald-100'
                        }`}
                        title={`Account: ${email.account}`}
                      />

                      {/* SENDER INITIALS AVATAR */}
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                        {(email.senderName || email.senderEmail || 'R')[0].toUpperCase()}
                      </div>

                      {/* SENDER NAME */}
                      <div className="w-32 sm:w-44 truncate shrink-0">
                        <span className={`text-xs ${!email.isRead ? 'text-slate-900 font-extrabold' : 'text-slate-700'}`}>
                          {email.senderName || email.senderEmail.split('@')[0]}
                        </span>
                      </div>

                      {/* SUBJECT & SNIPPET */}
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className={`text-xs truncate ${!email.isRead ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                          {email.subject}
                        </span>
                        <span className="text-xs text-slate-400 font-normal truncate hidden md:inline">
                          — {email.body ? email.body.replace(/\s+/g, ' ').slice(0, 80) : ''}
                        </span>
                      </div>

                      {/* ATTACHMENT BADGES */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasReports && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                            <FileText size={11} />
                            <span>Report</span>
                          </span>
                        )}
                        {hasFiles && (
                          <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                            <Paperclip size={11} />
                            <span>{email.fileAttachments?.length}</span>
                          </span>
                        )}
                      </div>

                      {/* DATE */}
                      <div className="text-right text-[11px] text-slate-500 font-medium shrink-0 min-w-[70px]">
                        {email.bsDate || email.dateFormatted?.split(',')[0] || 'Recent'}
                      </div>

                      {/* HOVER DELETE BUTTON */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteEmail(email, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-600 text-slate-400 rounded transition cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* GMAIL-STYLE COMPOSE EMAIL POPUP MODAL                         */}
      {/* ============================================================ */}
      {isComposeOpen && (
        <div className={`fixed z-[9999] bg-white border border-slate-300 shadow-2xl rounded-2xl flex flex-col overflow-hidden transition-all duration-200 font-sans ${
          isComposeMaximized
            ? 'inset-2 sm:inset-6'
            : 'bottom-4 right-4 w-[95vw] sm:w-[580px] md:w-[650px] max-h-[88vh] h-[640px]'
        }`}>
          {/* COMPOSE HEADER */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-rose-400" />
              <span className="text-xs font-black tracking-wide uppercase">New Message • RTSS Webmail</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsComposeMaximized(!isComposeMaximized)}
                className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
                title={isComposeMaximized ? 'Minimize' : 'Maximize'}
              >
                {isComposeMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* COMPOSE FORM BODY */}
          <form onSubmit={handleSendEmail} className="flex-1 flex flex-col overflow-y-auto p-4 space-y-3">
            {/* FROM SENDER ACCOUNT SELECTOR */}
            <div className="flex items-center gap-2 text-xs border-b pb-2">
              <span className="font-bold text-slate-500 w-16 shrink-0">From:</span>
              <select
                value={composeFrom}
                onChange={(e) => setComposeFrom(e.target.value as any)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-sky-500"
              >
                <option value="auto">⚡ Auto (Smart 400-Quota Failover: Primary &rarr; Secondary)</option>
                <option value="primary">🔵 Primary: donotreply.rtss@gmail.com (RTSS Official System)</option>
                <option value="secondary">🟢 Secondary: reliabletechss.fikkal@gmail.com (ReliableTech Services)</option>
              </select>
            </div>

            {/* TO RECIPIENTS (MULTI-RECIPIENT SUPPORT) */}
            <div className="space-y-1.5 border-b pb-2.5">
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl focus-within:bg-white focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition">
                <span className="text-xs font-bold text-slate-600 shrink-0 flex items-center gap-1 mr-1">
                  <Mail size={13} className="text-sky-600" />
                  <span>To:</span>
                </span>

                {/* Selected Recipient Chips */}
                {composeRecipients.map((rec, rIdx) => (
                  <span
                    key={`compose_rec_${rec.email}_${rIdx}`}
                    className="inline-flex items-center gap-1 bg-white border border-sky-300 text-sky-950 text-xs px-2.5 py-1 rounded-full shadow-2xs font-medium"
                  >
                    <User size={11} className="text-sky-600 shrink-0" />
                    <span>{rec.name ? `${rec.name} (${rec.email})` : rec.email}</span>
                    <button
                      type="button"
                      onClick={() => removeRecipient(rec.email)}
                      className="text-slate-400 hover:text-rose-600 ml-0.5 p-0.5 rounded-full cursor-pointer transition"
                      title="Remove recipient"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}

                <input
                  type="text"
                  placeholder={
                    composeRecipients.length === 0
                      ? "Recipient email (type or paste multiple, press Enter or comma)..."
                      : "Add another recipient..."
                  }
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  onKeyDown={handleRecipientInputKeyDown}
                  onBlur={() => {
                    if (recipientInput.trim() && recipientInput.includes('@')) {
                      addRecipient(recipientInput.trim());
                    }
                  }}
                  className="flex-1 min-w-[200px] text-xs bg-transparent py-1 px-1 font-medium text-slate-900 focus:outline-hidden"
                />

                {recipientInput.trim().includes('@') && (
                  <button
                    type="button"
                    onClick={() => addRecipient(recipientInput.trim())}
                    className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition"
                  >
                    + Add
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowCcBcc(!showCcBcc)}
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-800 px-2 py-0.5 rounded cursor-pointer ml-auto"
                >
                  {showCcBcc ? 'Hide Cc/Bcc' : 'Cc / Bcc'}
                </button>
              </div>

              {/* Quick Contacts Suggestion Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-[11px]">
                <span className="text-slate-400 text-[10px] uppercase font-bold shrink-0">Quick Add:</span>

                {/* "All User" Option: Automatically selects all users */}
                <button
                  type="button"
                  onClick={handleToggleAllUsers}
                  title={`Select all ${allUserContactsWithEmail.length} user accounts with email addresses (Admin, System Master, Staff, Shareholders)`}
                  className={`shrink-0 px-2.5 py-1 rounded-full border text-[11px] font-bold cursor-pointer transition flex items-center gap-1.5 shadow-2xs ${
                    isAllUsersSelected
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                  }`}
                >
                  <Users size={12} className={isAllUsersSelected ? 'text-white' : 'text-indigo-600'} />
                  <span>All Users ({allUserContactsWithEmail.length})</span>
                  {isAllUsersSelected ? <Check size={11} className="text-white stroke-[3]" /> : <Plus size={11} />}
                </button>

                  {contactSuggestions.slice(0, 8).map((contact, idx) => {
                    const isAdded = composeRecipients.some(r => r.email.toLowerCase() === contact.email.toLowerCase());
                    return (
                      <button
                        key={`contact_sug_${contact.email}_${idx}`}
                        type="button"
                        onClick={() => {
                          if (isAdded) {
                            removeRecipient(contact.email);
                          } else {
                            addRecipient(contact.email, contact.name, contact.category);
                          }
                        }}
                        className={`shrink-0 px-2 py-0.5 rounded-full border text-[11px] font-semibold cursor-pointer transition flex items-center gap-1 ${
                          isAdded
                            ? 'bg-sky-100 border-sky-300 text-sky-800'
                            : 'bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isAdded ? <Check size={10} className="text-sky-700" /> : <Plus size={10} />}
                        <span>{contact.name}</span>
                        <span className="text-[9px] text-slate-400">({contact.category})</span>
                      </button>
                    );
                  })}
                  {composeRecipients.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setComposeRecipients([])}
                      className="shrink-0 text-[10px] text-rose-600 hover:underline font-bold px-1.5 py-0.5 cursor-pointer ml-auto"
                    >
                      Clear All ({composeRecipients.length})
                    </button>
                  )}
                </div>
            </div>

            {/* CC / BCC OPTIONAL FIELDS */}
            {showCcBcc && (
              <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 animate-fade-in text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 w-14 shrink-0">Cc:</span>
                  <input
                    type="text"
                    placeholder="Cc recipients separated by commas"
                    value={composeCc}
                    onChange={(e) => setComposeCc(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:outline-hidden"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 w-14 shrink-0">Bcc:</span>
                  <input
                    type="text"
                    placeholder="Bcc recipients separated by commas"
                    value={composeBcc}
                    onChange={(e) => setComposeBcc(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            {/* SUBJECT */}
            <div className="flex items-center gap-2 text-xs border-b pb-2">
              <span className="font-bold text-slate-500 w-16 shrink-0">Subject:</span>
              <input
                type="text"
                required
                placeholder="Email Subject..."
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                className="flex-1 px-2 py-1 text-xs font-bold text-slate-900 focus:outline-hidden"
              />
            </div>

            {/* MESSAGE BODY */}
            <div className="flex-1 min-h-[160px] flex flex-col">
              <textarea
                required
                rows={8}
                placeholder="Write your email message here..."
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
                className="w-full flex-1 p-2 text-xs font-medium text-slate-800 focus:outline-hidden resize-none leading-relaxed"
              />
            </div>

            {/* ATTACHED ITEMS TRAY */}
            {(composeReports.length > 0 || composeFiles.length > 0) && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Attached to this email ({composeReports.length + composeFiles.length} item{composeReports.length + composeFiles.length !== 1 ? 's' : ''})
                </span>

                {/* SYSTEM REPORTS ATTACHMENTS (RENDERED AS DETAILED PDF) */}
                {composeReports.map((rep, rIdx) => (
                  <div key={rep.id || `compose_rep_${rep.referenceNo || rIdx}`} className="flex items-center justify-between bg-indigo-50/90 border border-indigo-200 px-3 py-2 rounded-xl text-xs shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={16} className="text-indigo-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-indigo-950 truncate">{rep.title}</span>
                          <span className="text-[10px] bg-indigo-200/80 text-indigo-800 px-1.5 py-0.2 rounded font-bold shrink-0">
                            {rep.category}
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded font-bold shrink-0 flex items-center gap-0.5">
                            <CheckCircle2 size={10} />
                            <span>PDF Document Attached</span>
                          </span>
                          {rep.amount && (
                            <span className="text-[10px] font-mono text-emerald-700 font-bold shrink-0">
                              Rs. {Number(rep.amount).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        {rep.fileName && (
                          <p className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
                            {rep.fileName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {rep.fileUrl && (
                        <a
                          href={rep.fileUrl}
                          download={rep.fileName || 'Report.pdf'}
                          className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-lg cursor-pointer transition"
                          title="Download Generated PDF"
                        >
                          <Download size={14} />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => removeComposeReport(rep.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg cursor-pointer transition"
                        title="Remove Report"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* UPLOADED FILES */}
                {composeFiles.filter(f => !composeReports.some(r => r.fileName === f.name)).map((file, fIdx) => (
                  <div key={file.id || `compose_file_${file.name || fIdx}_${fIdx}`} className="flex items-center justify-between bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {getFileIcon(file.name, file.type)}
                      <span className="font-medium text-slate-800 truncate">{file.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">({formatFileSize(file.size)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeComposeFile(file.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* COMPOSE FOOTER CONTROLS */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-extrabold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer text-xs disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Sending Dispatch...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Send Dispatch</span>
                    </>
                  )}
                </button>

                {/* FILE UPLOAD BUTTON */}
                <label className="p-2 hover:bg-slate-100 text-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-slate-200">
                  <Paperclip size={16} className="text-slate-600" />
                  <span>Attach File</span>
                  <input
                    type="file"
                    multiple
                    accept="*/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* ATTACH SYSTEM REPORT / INVOICE BUTTON */}
                <button
                  type="button"
                  onClick={() => setShowReportPicker(true)}
                  className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-indigo-200"
                >
                  <FileText size={16} />
                  <span>Attach System Report / Invoice (PDF)</span>
                </button>

                {/* OFFICIAL LETTERHEAD DESIGN TOGGLE */}
                <label className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100/80 text-amber-900 rounded-xl transition cursor-pointer text-xs font-bold border border-amber-200 select-none">
                  <input
                    type="checkbox"
                    checked={useLetterpadDesign}
                    onChange={(e) => setUseLetterpadDesign(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span>📜 Letterhead Design</span>
                </label>

                {useLetterpadDesign && (
                  <button
                    type="button"
                    onClick={() => setShowLetterpadPreview(true)}
                    className="px-2.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer border border-amber-300"
                    title="Preview Letterhead Design"
                  >
                    <Eye size={14} />
                    <span>Preview</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Discard this draft?')) {
                    setIsComposeOpen(false);
                    setComposeRecipients([]);
                    setRecipientInput('');
                    setComposeFiles([]);
                    setComposeReports([]);
                  }
                }}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
                title="Discard Draft"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* ATTACH REPORT / SYSTEM INVOICE MODAL (Directly from System)  */}
      {/* ============================================================ */}
      {showReportPicker && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-[10000] overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Attach Report, Invoice or Ledger Record
                  </h3>
                  <p className="text-xs text-slate-500">
                    Attach any category statement, sales bill, purchase order, income, expenses, or auditor ledger.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReportPicker(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* QUICK PRESETS FROM AUDITOR REPORTS */}
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                ⚡ Quick Presets from System &amp; Auditor Reports:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const fromD = getCurrentBsDate();
                    setReportFormData({
                      ...reportFormData,
                      category: 'Daily Closing',
                      fromDate: fromD,
                      toDate: fromD,
                      reportDate: fromD,
                      title: `Daily Closing Statement (${fromD})`,
                      referenceNo: `DC-${fromD.replace(/[^0-9]/g, '')}`,
                      amount: undefined,
                      summary: `Comprehensive daily closing ledger statement for ${fromD}.`
                    });
                  }}
                  className="text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  🌅 Daily Closing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fromD = getCurrentBsDate();
                    setReportFormData({
                      ...reportFormData,
                      category: 'Income Report Only',
                      fromDate: fromD,
                      toDate: fromD,
                      reportDate: fromD,
                      title: 'Income Statement & Audit Report',
                      referenceNo: `REP-INC-${fromD.replace(/[^0-9]/g, '')}`,
                      amount: 385000,
                      summary: 'Total Sales & Service Revenue collection audit statement.'
                    });
                  }}
                  className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  📈 Income Report Only
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fromD = getCurrentBsDate();
                    setReportFormData({
                      ...reportFormData,
                      category: 'Expenses Report Only',
                      fromDate: fromD,
                      toDate: fromD,
                      reportDate: fromD,
                      title: 'Expenses & Approved Expenditures Report',
                      referenceNo: `REP-EXP-${fromD.replace(/[^0-9]/g, '')}`,
                      amount: 142000,
                      summary: 'Operating expenses, utility bills & logistics expenditure audit.'
                    });
                  }}
                  className="text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  💸 Expenses Report Only
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fromD = getCurrentBsDate();
                    setReportFormData({
                      ...reportFormData,
                      category: 'Income and Expenditure Ledger',
                      fromDate: fromD,
                      toDate: fromD,
                      reportDate: fromD,
                      title: 'Income and Expenditure Ledger Statement',
                      referenceNo: `REP-INCEXP-${fromD.replace(/[^0-9]/g, '')}`,
                      amount: 243000,
                      summary: 'Comprehensive Income & Expenditure balance audit statement.'
                    });
                  }}
                  className="text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  ⚖️ Income &amp; Expenditure Ledger
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fromD = getCurrentBsDate();
                    setReportFormData({
                      ...reportFormData,
                      category: 'Account Summary (Double-Entry Financial Statements)',
                      fromDate: fromD,
                      toDate: fromD,
                      reportDate: fromD,
                      title: 'Account Summary (Double-Entry Balance Sheet)',
                      referenceNo: `REP-ACCT-${fromD.replace(/[^0-9]/g, '')}`,
                      amount: 850000,
                      summary: 'Double-Entry financial trial balance and multi-account asset statement.'
                    });
                  }}
                  className="text-[11px] bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  🏛️ Double-Entry Balance Sheet
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fromD = getCurrentBsDate();
                    setReportFormData({
                      ...reportFormData,
                      category: 'Senior Auditor Advisory Note',
                      fromDate: fromD,
                      toDate: fromD,
                      reportDate: fromD,
                      title: 'Senior Auditor Advisory Note & Executive Summary',
                      referenceNo: `AUDIT-NOTE-${fromD.replace(/[^0-9]/g, '')}`,
                      amount: undefined,
                      summary: 'Executive audit remarks, compliance checks, and financial governance notes.'
                    });
                  }}
                  className="text-[11px] bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  📋 Senior Auditor Note
                </button>
              </div>
            </div>

            {/* DIRECT INVOICE PICKER (Real invoices from props) */}
            {invoices.length > 0 && (
              <div className="bg-sky-50/80 p-3 rounded-xl border border-sky-200 space-y-1.5">
                <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <FileText size={14} className="text-sky-700" />
                  <span>Attach Real Sales Invoice From System:</span>
                </span>
                <select
                  onChange={(e) => {
                    const inv = invoices.find(i => i.id === e.target.value);
                    if (inv) {
                      setReportFormData({
                        ...reportFormData,
                        category: 'Sales Bill / Invoice',
                        title: `Tax Invoice ${inv.invoiceNumber} - ${inv.customerName}`,
                        referenceNo: inv.invoiceNumber,
                        reportDate: inv.date,
                        amount: inv.finalAmount || inv.totalAmount,
                        summary: `Invoice for ${inv.customerName} (${inv.customerPhone || 'N/A'}). Items: ${inv.items?.length || 0}. Status: ${inv.status}, Payment Method: ${inv.paymentMethod}.`
                      });
                    }
                  }}
                  className="w-full bg-white border border-sky-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-hidden"
                >
                  <option value="">-- Choose from existing system invoices --</option>
                  {invoices.slice(0, 20).map((inv, invIdx) => (
                    <option key={inv.id || `picker_inv_${inv.invoiceNumber || invIdx}`} value={inv.id}>
                      #{inv.invoiceNumber} - {inv.customerName} (Rs. {Number(inv.finalAmount || inv.totalAmount).toLocaleString('en-IN')}) • {inv.date}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* DIRECT DAILY CLOSING PICKER (Real daily closings from props) */}
            {dailyClosings && dailyClosings.length > 0 && (
              <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 space-y-2">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-700" />
                  <span>Attach Real Daily Closing From System:</span>
                </span>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      populateDailyClosing(e.target.value);
                    }
                  }}
                  className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-hidden"
                >
                  <option value="">-- Choose from recorded daily closings --</option>
                  {dailyClosings.slice(0, 25).map((dc, dcIdx) => (
                    <option key={dc.id || `picker_dc_${dc.date || dcIdx}`} value={dc.id || dc.date}>
                      Daily Closing: {dc.date} ({dc.status || 'Closed'}) • Net Handover: Rs. {Number(dc.remainingCash ?? dc.openingCashForTomorrow ?? 0).toLocaleString()} • Done by {dc.submittedBy || dc.closingDoneBy || 'Staff'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* FORM FIELDS */}
            <div className="space-y-4 text-xs">
              {/* CATEGORY */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Report Category (प्रतिवेदन श्रेणी) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reportFormData.category}
                  onChange={(e) => setReportFormData({ ...reportFormData, category: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 font-semibold bg-white focus:outline-hidden"
                >
                  <optgroup label="📋 Financial & Auditor Statements">
                    <option value="Daily Closing">🌅 Daily Closing Report (दैनिक खाता बन्द प्रतिवेदन)</option>
                    <option value="Sales Bill / Invoice">📊 Sales Bill / Invoice (बिक्री बिल / बिजक)</option>
                    <option value="Income Report Only">📈 Income Report Only (आम्दानी विवरण प्रतिवेदन)</option>
                    <option value="Expenses Report Only">💸 Expenses Report Only (खर्च विवरण प्रतिवेदन)</option>
                    <option value="Income and Expenditure Ledger">⚖️ Income and Expenditure Ledger (आम्दानी तथा खर्च खाता)</option>
                    <option value="Cost Price vs Selling Price Summary">📊 Cost Price vs Selling Price Summary (लागत र बिक्री मूल्य)</option>
                    <option value="Account Summary (Double-Entry Financial Statements)">🏛️ Account Summary (Double-Entry Balance Sheet)</option>
                    <option value="Senior Auditor Advisory Note">📋 Senior Auditor Advisory Note (लेखापरीक्षक टिप्पणी)</option>
                  </optgroup>
                  <optgroup label="📦 Operations & Registry">
                    <option value="Purchase Order">📦 Purchase Order / Supply (खरिद आदेश)</option>
                    <option value="Expense Voucher">💸 Expense Voucher (खर्च भौचर)</option>
                    <option value="Staff Payroll">👥 Staff Payroll &amp; Attendance (तलब तथा उपस्थिति)</option>
                    <option value="Office Assets Registry Report">🏢 Office Assets Registry (सम्पत्ति रजिष्टर)</option>
                    <option value="Custom Category">📝 Custom Category / Other Report</option>
                  </optgroup>
                </select>
              </div>

              {/* DATE INTERVAL SELECTOR */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar size={14} className="text-indigo-600" />
                  <span>Nepali BS Date Interval (अवधि छनोट):</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <NepaliDatePicker
                    label="From Date (देखि मिति)"
                    value={reportFormData.fromDate || getCurrentBsDate()}
                    onChange={(d) => {
                      if (reportFormData.category === 'Daily Closing') {
                        populateDailyClosing(d);
                      } else {
                        setReportFormData({ ...reportFormData, fromDate: d, reportDate: `${d} to ${reportFormData.toDate || d}` });
                      }
                    }}
                    mode="date"
                  />
                  <NepaliDatePicker
                    label="To Date (सम्म मिति)"
                    value={reportFormData.toDate || getCurrentBsDate()}
                    onChange={(d) => {
                      if (reportFormData.category === 'Daily Closing') {
                        populateDailyClosing(d);
                      } else {
                        setReportFormData({ ...reportFormData, toDate: d, reportDate: `${reportFormData.fromDate || d} to ${d}` });
                      }
                    }}
                    mode="date"
                  />
                </div>
              </div>

              {/* DOCUMENT TITLE */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Report / Document Title (प्रतिवेदन शीर्षक) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Invoice #RTSS-2083-0042"
                  value={reportFormData.title}
                  onChange={(e) => setReportFormData({ ...reportFormData, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 font-bold bg-white focus:outline-hidden"
                />
              </div>

              {/* REF NO & AMOUNT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reference / Bill No.</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-1002"
                    value={reportFormData.referenceNo || ''}
                    onChange={(e) => setReportFormData({ ...reportFormData, referenceNo: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Associated Amount (Rs.)</label>
                  <input
                    type="number"
                    placeholder="e.g. 45000"
                    value={reportFormData.amount !== undefined ? reportFormData.amount : ''}
                    onChange={(e) => setReportFormData({ ...reportFormData, amount: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* SUMMARY */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Document Summary / Key Printable Details
                </label>
                <textarea
                  rows={2}
                  placeholder="Key metrics, breakdown notes, or invoice items to include..."
                  value={reportFormData.summary || ''}
                  onChange={(e) => setReportFormData({ ...reportFormData, summary: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 font-medium bg-white focus:outline-hidden"
                />
              </div>

              {/* LIVE WYSIWYG DAILY CLOSING STATEMENT (EXACT 4-SECTION LAYOUT WITHOUT LOW STOCK) */}
              {reportFormData.category === 'Daily Closing' && (
                <div className="border-2 border-indigo-300 bg-white rounded-xl p-3.5 space-y-3 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200 pb-2">
                    <div className="flex items-center gap-1.5">
                      <FileText size={15} className="text-indigo-700" />
                      <span className="font-bold text-xs text-indigo-950">
                        WYSIWYG Daily Closing Preview (Complete 4 Sections • No Cuts or Scrollbars)
                      </span>
                    </div>
                    {typeof window !== 'undefined' && (window as any).openUniversalPrintPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          (window as any).openUniversalPrintPreview({
                            documentType: 'Daily Closing',
                            documentNumber: reportFormData.referenceNo || `DCR-${(reportFormData.reportDate || '').replace(/\//g, '')}`,
                            documentDate: reportFormData.reportDate,
                            status: reportFormData.status || 'Verified',
                            profile: profile,
                            title: reportFormData.title || 'Daily Cash & Sales Closing Voucher',
                            dailyClosingData: reportFormData.dailyClosingData,
                            items: reportFormData.items,
                            subtotal: reportFormData.subtotal,
                            grandTotal: reportFormData.grandTotal,
                            amountInWords: reportFormData.amountInWords,
                            notes: reportFormData.notes,
                            preparedBy: reportFormData.preparedBy,
                            approvedBy: reportFormData.approvedBy
                          });
                        }}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                      >
                        <Printer size={12} />
                        <span>Open Full Print Preview</span>
                      </button>
                    )}
                  </div>

                  {/* Complete WYSIWYG View */}
                  <div className="bg-white rounded-lg border border-slate-200 p-3">
                    {reportFormData.dailyClosingData ? (
                      <DailyClosingStatementView
                        data={reportFormData.dailyClosingData}
                        profile={profile}
                        showHeader={false}
                      />
                    ) : (
                      <div className="text-xs text-slate-500 py-4 text-center">
                        Select a recorded daily closing above to load the detailed 4-section statement.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-3 border-t flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowReportPicker(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!reportFormData.title.trim()) {
                    alert('Please enter a document title');
                    return;
                  }
                  const repId = `rep_${Date.now()}`;
                  const repObj: SystemReportAttachment = {
                    ...reportFormData,
                    id: repId
                  };

                  // Generate complete high-fidelity PDF document with all detailed data
                  const pdfRes = generateReportPdf(repObj, profile);
                  const pdfFile: EmailFileAttachment = {
                    id: `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    name: pdfRes.fileName,
                    size: pdfRes.size,
                    type: 'application/pdf',
                    dataUrl: pdfRes.dataUrl
                  };

                  setComposeReports(prev => [
                    ...prev,
                    {
                      ...repObj,
                      fileName: pdfRes.fileName,
                      fileUrl: pdfRes.dataUrl,
                      fileType: 'application/pdf'
                    }
                  ]);
                  setComposeFiles(prev => [...prev, pdfFile]);
                  showNotice(`📄 "${repObj.title}" rendered as PDF with complete detailed data & attached.`);
                  setShowReportPicker(false);
                }}
                className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Download size={14} />
                <span>Generate PDF &amp; Attach to Email</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* LETTERHEAD EMAIL PREVIEW MODAL                                */}
      {/* ============================================================ */}
      {showLetterpadPreview && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-[10000] overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Official Letterhead Email Preview (पत्रशीर्ष ढाँचा पूर्वावलोकन)
                  </h3>
                  <p className="text-xs text-slate-500">
                    This is how the email body and corporate letterpad will be delivered to recipients.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLetterpadPreview(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 p-2 sm:p-4">
              <iframe
                title="Letterhead Preview"
                srcDoc={generateLetterpadEmailHtml({
                  recipientName: composeRecipients.map(r => r.name || r.email).join(', ') || 'Valued Recipient',
                  recipientEmail: composeRecipients.map(r => r.email).join(', ') || 'recipient@domain.com',
                  subject: composeSubject || 'Official Communication',
                  message: composeMessage || 'Your message content will appear here in the official letterhead format with complete details.',
                  bsDate: getCurrentBsDate(),
                  systemReports: composeReports,
                  fileAttachments: composeFiles,
                  profile,
                  senderTitle: currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Reliable Tech Solutions & Services'
                })}
                className="w-full h-[65vh] rounded-lg bg-white border border-slate-200 shadow-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t text-xs">
              <span className="text-slate-500 font-medium">
                Includes official company header, gold gradient divider, verified QR/security footer, and report attachments summary.
              </span>
              <button
                type="button"
                onClick={() => setShowLetterpadPreview(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold cursor-pointer transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* FILE PREVIEW MODAL                                           */}
      {/* ============================================================ */}
      {previewFile && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-[10000] overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                {getFileIcon(previewFile.name, previewFile.type)}
                <div>
                  <h3 className="font-bold text-sm text-slate-900 truncate max-w-md">{previewFile.name}</h3>
                  <p className="text-xs text-slate-500">{formatFileSize(previewFile.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {previewFile.dataUrl && (
                  <a
                    href={previewFile.dataUrl}
                    download={previewFile.name}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-slate-50 rounded-xl border border-slate-200 min-h-[300px]">
              {previewFile.type.includes('image') ? (
                <img
                  src={previewFile.dataUrl}
                  alt={previewFile.name}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg"
                />
              ) : previewFile.type.includes('pdf') ? (
                <iframe
                  src={previewFile.dataUrl}
                  title={previewFile.name}
                  className="w-full h-[60vh] rounded-lg border-0"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileText size={48} className="mx-auto text-slate-400" />
                  <p className="text-sm font-bold text-slate-700">{previewFile.name}</p>
                  <p className="text-xs text-slate-500">Binary document preview not available directly in browser.</p>
                  {previewFile.dataUrl && (
                    <a
                      href={previewFile.dataUrl}
                      download={previewFile.name}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white font-bold rounded-xl text-xs"
                    >
                      <Download size={15} />
                      <span>Download File to View</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SYSTEM REPORT / INVOICE PREVIEW & PRINT MODAL                */}
      {/* ============================================================ */}
      {previewReport && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-[10000] overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">System Document Preview</h3>
              </div>
              <div className="flex items-center gap-2">
                {typeof window !== 'undefined' && (window as any).openUniversalPrintPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      (window as any).openUniversalPrintPreview({
                        documentType: previewReport.category === 'Daily Closing' ? 'Daily Closing' : 'Report',
                        documentNumber: previewReport.referenceNo || `DCR-${(previewReport.reportDate || '').replace(/\//g, '')}`,
                        documentDate: previewReport.reportDate || '',
                        status: previewReport.status || 'Verified',
                        profile: profile,
                        title: previewReport.title || 'Daily Cash & Sales Closing Voucher',
                        items: previewReport.items,
                        subtotal: previewReport.subtotal,
                        grandTotal: previewReport.grandTotal ?? previewReport.amount,
                        amountInWords: previewReport.amountInWords,
                        notes: previewReport.notes || previewReport.summary,
                        preparedBy: previewReport.preparedBy,
                        approvedBy: previewReport.approvedBy
                      });
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <FileText size={14} />
                    <span>WYSIWYG Print Preview</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewReport(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* OFFICIAL DOCUMENT PRINTABLE CONTAINER */}
            <div className="border border-slate-200 rounded-xl p-6 bg-white space-y-4">
              <div className="text-center border-b pb-4 space-y-1">
                <h2 className="text-lg font-black text-slate-900">
                  {profile?.companyName || 'ReliableTech Services & Suppliers'}
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  {profile?.address || 'Fikkal Bazaar, Suryodaya-10, Ilam, Nepal'} • Tel: {profile?.phone || '9852680780'}
                </p>
                <span className="inline-block mt-2 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-900 text-xs font-bold uppercase">
                  {previewReport.category}
                </span>
              </div>

              {previewReport.items && previewReport.items.length > 0 ? (
                /* EXACT WYSIWYG DAILY CLOSING / SYSTEM STATEMENT TABLE */
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-600">Document No: </span>
                      <span className="font-mono font-bold text-slate-900">{previewReport.referenceNo || 'DCR-N/A'}</span>
                    </div>
                    {previewReport.reportDate && (
                      <div>
                        <span className="font-bold text-slate-600">BS Date: </span>
                        <span className="font-mono font-bold text-slate-900">{previewReport.reportDate}</span>
                      </div>
                    )}
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                        {previewReport.status || 'Verified / Approved'}
                      </span>
                    </div>
                  </div>

                  {/* LINE ITEMS TABLE */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b-2 border-slate-300 text-slate-800 font-bold text-[11px]">
                          <th className="py-2 px-3 text-center w-10 font-mono">S.N.</th>
                          <th className="py-2 px-3">Item Description &amp; Particulars</th>
                          <th className="py-2 px-3 text-center w-12 font-mono">Qty</th>
                          <th className="py-2 px-3 text-right w-24 font-mono">Rate (Rs.)</th>
                          <th className="py-2 px-3 text-right w-28 font-mono">Amount (Rs.)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewReport.items.map((item, idx) => (
                          <tr key={`prev_item_${item.sn || idx}`} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 text-center font-mono text-slate-400">{item.sn || idx + 1}</td>
                            <td className="py-1.5 px-3">
                              <span className="font-bold text-slate-900">{item.name}</span>
                              {item.description && (
                                <p className="text-[11px] text-slate-500 italic mt-0.5">{item.description}</p>
                              )}
                            </td>
                            <td className="py-1.5 px-3 text-center font-mono text-slate-700">{item.quantity}</td>
                            <td className="py-1.5 px-3 text-right font-mono text-slate-700">
                              {Number(item.unitPrice || 0).toLocaleString()}
                            </td>
                            <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                              {Number(item.totalPrice || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t-2 border-slate-300 bg-slate-50 text-xs font-bold">
                        {previewReport.subtotal !== undefined && (
                          <tr>
                            <td colSpan={4} className="py-2 px-3 text-right text-slate-700 uppercase font-bold">
                              Subtotal (Total Incomes):
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-900">
                              Rs. {Number(previewReport.subtotal).toLocaleString()}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-emerald-50 text-emerald-950 text-sm">
                          <td colSpan={4} className="py-2.5 px-3 text-right uppercase font-black">
                            Net Handover Cash:
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-800">
                            Rs. {Number(previewReport.grandTotal ?? previewReport.amount ?? 0).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {previewReport.amountInWords && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-serif text-slate-700">
                      <strong>Amount in Words: </strong>
                      <span className="italic">{previewReport.amountInWords}</span>
                    </div>
                  )}

                  {(previewReport.notes || previewReport.summary) && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                      <strong className="text-slate-800 block text-[11px] uppercase tracking-wider">
                        Denominations Breakdown &amp; Audit Notes:
                      </strong>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
                        {previewReport.notes || previewReport.summary}
                      </p>
                    </div>
                  )}

                  {/* SIGNATORIES */}
                  <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
                    <div>
                      <div className="border-b border-slate-400 w-44 mx-auto mb-1.5 h-10"></div>
                      <p className="font-bold text-slate-800">{previewReport.preparedBy || 'Prepared By (Cashier)'}</p>
                      <p className="text-[10px] text-slate-400">Account Submission</p>
                    </div>
                    <div>
                      <div className="border-b border-slate-400 w-44 mx-auto mb-1.5 h-10"></div>
                      <p className="font-bold text-slate-800">{previewReport.approvedBy || 'Authorized Manager / Admin'}</p>
                      <p className="text-[10px] text-slate-400">{profile?.companyName || 'ReliableTech'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* DEFAULT GENERIC SUMMARY VIEW */
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-600">Document Title:</span>
                    <span className="font-extrabold text-slate-900">{previewReport.title}</span>
                  </div>
                  {previewReport.referenceNo && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-600">Reference / Bill No:</span>
                      <span className="font-mono font-bold text-slate-800">{previewReport.referenceNo}</span>
                    </div>
                  )}
                  {previewReport.reportDate && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-600">BS Date / Interval:</span>
                      <span className="font-mono font-bold text-slate-800">{previewReport.reportDate}</span>
                    </div>
                  )}
                  {previewReport.amount !== undefined && (
                    <div className="flex justify-between items-center text-xs bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      <span className="font-bold text-emerald-900">Associated Amount:</span>
                      <span className="font-mono font-black text-emerald-800 text-sm">
                        NPR {Number(previewReport.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {previewReport.summary && (
                    <div className="pt-2">
                      <span className="text-xs font-bold text-slate-700 block mb-1">Summary &amp; Financial Breakdown:</span>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {previewReport.summary}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-6 border-t flex items-center justify-between text-[11px] text-slate-500">
                <div>
                  <p className="font-semibold text-slate-700">Verified System Record</p>
                  <p>ReliableTech Official System Hub</p>
                </div>
                <div className="text-right">
                  <p className="font-mono">{new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
