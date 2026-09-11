import React, { useState, useEffect, useRef } from 'react';
import { 
  Wrench, 
  Users, 
  ShoppingBag, 
  Settings, 
  LayoutDashboard,
  MapPin,
  Clock,
  Receipt,
  BarChart3,
  Truck,
  ShieldAlert,
  Package,
  TrendingDown,
  ShieldCheck,
  CalendarRange,
  Lock,
  FileText,
  UserCheck,
  User,
  Briefcase,
  Sparkles,
  BookOpen,
  HelpCircle,
  Tag,
  Gauge,
  Wallet,
  Folder,
  Grid,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  Layers3,
  Palette,
  Sidebar,
  PanelTop,
  LayoutGrid,
  Rocket,
  TrendingUp,
  ShoppingCart,
  Monitor,
  Mail,
  X,
  Check
} from 'lucide-react';

import { validateAccountBalance, validateSplitAccountBalances, BalanceValidationResult } from './utils/accountBalance';
import { InsufficientBalanceModal } from './components/InsufficientBalanceModal';

import { 
  BusinessService, 
  Supplier, 
  SupplyTransaction, 
  BusinessProfile, 
  SalesInvoice, 
  AppUser, 
  EditRequest, 
  InventoryItem, 
  InventoryRequest,
  OfficeUseRequest, 
  ServiceRequest, 
  Expense, 
  DailyClosing, 
  PeriodicClosing,
  BusinessLetter,
  AttendanceRecord,
  LeaveRequest,
  SalaryDistribution,
  AttendanceRequest,
  SupplierPayment,
  OpeningBalances,
  AccountTransaction,
  AssetItem,
  MeetingNote,
  Shareholder,
  ShareTransaction,
  BlockedMessengerRecord
} from './types';
import { getCurrentBsDate, ensureBsDate, generateServiceRequestNo, generateExpenseNo, generateInventoryNo, getNepaleseFiscalYear, isDateWithinRange, normalizeStandardBsDate } from './utils/nepaliDate';
import { NepaliClockWidget } from './components/NepaliClockWidget';
import { checkDateLock } from './utils/closingLocks';
import { 
  INITIAL_PROFILE, 
  INITIAL_SERVICES, 
  INITIAL_SUPPLIERS, 
  INITIAL_TRANSACTIONS,
  INITIAL_INVOICES,
  INITIAL_INVENTORY_STOCK,
  INITIAL_INVENTORY_REQUESTS,
  INITIAL_SERVICE_REQUESTS,
  INITIAL_EXPENSES,
  INITIAL_OFFICE_USE_REQUESTS,
  INITIAL_SHAREHOLDERS,
  INITIAL_ECOMMERCE_PRODUCTS,
  INITIAL_CUSTOMER_ACCOUNTS,
  INITIAL_ECOMMERCE_ORDERS,
  INITIAL_SERVICE_TICKETS,
  INITIAL_HARDWARE_TYPES,
  INITIAL_CUSTOMER_INQUIRIES
} from './initialData';

import { Dashboard } from './components/Dashboard';
import { ServiceRequestsList } from './components/ServiceRequestsList';
import { ServicesList } from './components/ServicesList';
import { SuppliersList } from './components/SuppliersList';
import { TransactionsList } from './components/TransactionsList';
import { SalesAndBilling } from './components/SalesAndBilling';
import { Reports } from './components/Reports';
import { ExportCenter } from './components/ExportCenter';
import { ExpensesList } from './components/ExpensesList';

import { CustomersData } from './components/CustomersData';
import { InventoryList } from './components/InventoryList';
import { DailyClosingComponent } from './components/DailyClosingComponent';
import { StaffRequestsList } from './components/StaffRequestsList';
import { OfficialLetters } from './components/OfficialLetters';
import { Login } from './components/Login';
import { StaffAttendance } from './components/StaffAttendance';
import { AssetsManagement } from './components/AssetsManagement';
import { MeetingMyNotes } from './components/MeetingMyNotes';
import { OperationsManualModal } from './components/OperationsManualModal';
import { UserProfileModal, TabInterfaceMode, AppTheme } from './components/UserProfileModal';
import { GlobalPrintPreviewModal } from './components/GlobalPrintPreviewModal';
import { UniversalEmailModal } from './components/UniversalEmailModal';
import { NotificationBell } from './components/NotificationBell';
import { EcommerceManagement } from './components/EcommerceManagement';
import { OnlineStorefront } from './components/OnlineStorefront';
import { EmailInbox } from './components/EmailInbox';
import { 
  EcommerceProduct, 
  CustomerAccount, 
  EcommerceOrder, 
  EcommerceServiceTicket, 
  HardwareTypeOption,
  OrderLifecycleState,
  CustomerInquiryMessage,
  RolePermissionsConfig
} from './types';
import { 
  getStoredRolePermissionsConfig, 
  getUserVisibleTabsList, 
  canUserEditTab, 
  canUserDeleteInTab 
} from './utils/permissionUtils';

const ALLOWED_TABS: Record<'Super Admin' | 'Admin' | 'User' | 'Shareholder', string[]> = {
  'Super Admin': ['dashboard', 'ecommerce', 'services', 'sales', 'customers', 'suppliers', 'transactions', 'inventory', 'assets_management', 'reports', 'expenses', 'daily_closing', 'letters', 'staff_requests', 'staff_attendance', 'email_inbox', 'settings', 'meeting_mynotes'],
  'Admin': ['dashboard', 'ecommerce', 'services', 'sales', 'customers', 'suppliers', 'transactions', 'inventory', 'assets_management', 'reports', 'expenses', 'daily_closing', 'letters', 'staff_requests', 'staff_attendance', 'email_inbox', 'settings', 'meeting_mynotes'],
  'User': ['dashboard', 'ecommerce', 'services', 'sales', 'customers', 'suppliers', 'transactions', 'inventory', 'assets_management', 'expenses', 'daily_closing', 'letters', 'staff_requests', 'staff_attendance', 'email_inbox', 'meeting_mynotes'],
  'Shareholder': ['reports', 'meeting_mynotes', 'email_inbox']
};

export const getUserAllowedTabs = (user?: AppUser | null, roleConfig?: RolePermissionsConfig): string[] => {
  if (!user) return ALLOWED_TABS['User'];
  if (user.username?.toLowerCase() === 'reliableadmin') {
    return ALLOWED_TABS['Super Admin'];
  }
  return getUserVisibleTabsList(user, roleConfig);
};

// File System Access API IndexedDB helper functions
const DB_NAME = 'RTSS_FileAccess_DB';
const STORE_NAME = 'file_handles';
const KEY_NAME = 'db_handle';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getStoredHandle(): Promise<any> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(KEY_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to get stored handle from IndexedDB', e);
    return null;
  }
}

async function setStoredHandle(handle: any): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(handle, KEY_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to store handle in IndexedDB', e);
  }
}

async function verifyPermission(fileHandle: any, readWrite: boolean): Promise<boolean> {
  const options: any = {};
  if (readWrite) {
    options.mode = 'readwrite';
  }
  try {
    if ((await fileHandle.queryPermission(options)) === 'granted') {
      return true;
    }
    if ((await fileHandle.requestPermission(options)) === 'granted') {
      return true;
    }
  } catch (err) {
    console.error('Permission verification failed', err);
  }
  return false;
}

export default function App() {
  // Global States
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [unreadEmailCount, setUnreadEmailCount] = useState<number>(0);
  const [insufficientBalanceValidation, setInsufficientBalanceValidation] = useState<BalanceValidationResult | null>(null);
  
  // Sync unread emails badge for Gmail tab
  useEffect(() => {
    fetch('/api/emails?limit=1')
      .then(res => res.json())
      .then(data => {
        if (data?.counts?.unreadTotal !== undefined) {
          setUnreadEmailCount(data.counts.unreadTotal);
        }
      })
      .catch(() => {});
  }, [activeTab]);
  
  const [profile, setProfile] = useState<BusinessProfile>(() => INITIAL_PROFILE);

  const [services, setServices] = useState<BusinessService[]>(() => {
    return INITIAL_SERVICES.map((s: any) => ({ ...s, dateAdded: ensureBsDate(s.dateAdded) }));
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => INITIAL_SUPPLIERS);

  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>(() => []);

  const [transactions, setTransactions] = useState<SupplyTransaction[]>(() => {
    return INITIAL_TRANSACTIONS.map((t: any) => ({ ...t, date: ensureBsDate(t.date) }));
  });

  const [invoices, setInvoices] = useState<SalesInvoice[]>(() => {
    return INITIAL_INVOICES.map((inv: any) => ({ ...inv, date: ensureBsDate(inv.date) }));
  });

  const [users, setUsers] = useState<AppUser[]>(() => {
    const defaultUserEmails: { [username: string]: string } = {
      'Arpan': 'arpankhadka57@gmail.com',
      'reliableadmin': 'reliabletechss.fikkal@gmail.com',
      'reliableuser': 'reliableuser.rtss@gmail.com',
      'shareholder': 'shareholder.rtss@gmail.com'
    };

    const saved = localStorage.getItem('reliabletech_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((u: any) => ({
            ...u,
            email: u.email || defaultUserEmails[u.username] || `${u.username.toLowerCase()}@reliabletech.com.np`
          }));
        }
      } catch (e) {
        console.error('Failed to parse saved users:', e);
      }
    }
    return [
      { id: 'usr-super', name: 'Arpan Khadka', nameNepali: 'श्री अर्पण खड्का', post: 'Chairman', designationNepali: 'अध्यक्ष (प्रबन्ध निर्देशक)', username: 'Arpan', role: 'Super Admin', password: 'Arpan@2057', staffId: 'RT-EMP-001', email: 'arpankhadka57@gmail.com' },
      { id: 'usr-1', name: 'Master Administrator', nameNepali: 'मुख्य प्रशासक', post: 'Manager', designationNepali: 'व्यवस्थापक', username: 'reliableadmin', role: 'Admin', password: 'adminpassword', staffId: 'RT-ADMIN-000', email: 'reliabletechss.fikkal@gmail.com' },
      { id: 'usr-2', name: 'Standard Cashier', nameNepali: 'नगदपाल', post: 'Cashier', designationNepali: 'खजाञ्ची / क्यासियर', username: 'reliableuser', role: 'User', password: 'userpassword', staffId: 'RT-EMP-002', email: 'reliableuser.rtss@gmail.com' },
      { id: 'usr-3', name: 'Shareholder Contact', nameNepali: 'शेयरधनी प्रतिनिधि', post: 'Board Member', designationNepali: 'संचालक सदस्य', username: 'shareholder', role: 'Shareholder', password: 'shareholderpassword', staffId: 'RT-SH-001', email: 'shareholder.rtss@gmail.com' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('reliabletech_users', JSON.stringify(users));
  }, [users]);

  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    const saved = localStorage.getItem('reliabletech_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (e) {
        // Fallback
      }
    }
    return { id: 'usr-super', name: 'Arpan Khadka', username: 'Arpan', role: 'Super Admin', password: 'Arpan@2057' };
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Active layout mode is permanently set to left side bar
  const tabInterfaceMode: TabInterfaceMode = 'sidebar';
  const appTheme: AppTheme = 'light';
  const activeAccentColor = '#0284C7'; // Sky Blue Accent

  const [rolePermissionsConfig, setRolePermissionsConfig] = useState<RolePermissionsConfig>(() => getStoredRolePermissionsConfig());

  // Listen for real-time permission configuration updates across tabs/windows
  useEffect(() => {
    const handlePermChange = () => {
      setRolePermissionsConfig(getStoredRolePermissionsConfig());
    };
    window.addEventListener('rtss_permissions_updated', handlePermChange);
    return () => window.removeEventListener('rtss_permissions_updated', handlePermChange);
  }, []);

  const handleUpdateUser = (updatedUser: AppUser) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem('reliabletech_current_user', JSON.stringify(updatedUser));
    }
  };

  // Guard against navigating to or viewing unauthorized tabs
  useEffect(() => {
    const allowed = getUserAllowedTabs(currentUser, rolePermissionsConfig);
    if (allowed && allowed.length > 0 && !allowed.includes(activeTab)) {
      const fallback = allowed.includes('dashboard') ? 'dashboard' : allowed[0];
      setActiveTab(fallback);
    }
  }, [currentUser, activeTab, rolePermissionsConfig]);

  const [units, setUnits] = useState<string[]>(() => {
    const saved = localStorage.getItem('reliabletech_units');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved units:', e);
      }
    }
    return ['Flat', 'Hourly', 'Monthly', 'Per Unit', 'kg', 'ltr', 'pcs', 'box', 'packet'];
  });

  useEffect(() => {
    localStorage.setItem('reliabletech_units', JSON.stringify(units));
  }, [units]);

  const [servicesSubTab, setServicesSubTab] = useState<'requests' | 'catalog'>('requests');

  const [editRequests, setEditRequests] = useState<EditRequest[]>(() => []);

  const [inventoryStock, setInventoryStock] = useState<InventoryItem[]>(() => INITIAL_INVENTORY_STOCK);

  const [inventoryRequests, setInventoryRequests] = useState<InventoryRequest[]>(() => {
    return INITIAL_INVENTORY_REQUESTS.map((r: any) => ({ ...r, date: ensureBsDate(r.date) }));
  });

  const [officeUseRequests, setOfficeUseRequests] = useState<OfficeUseRequest[]>(() => INITIAL_OFFICE_USE_REQUESTS);

  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(() => {
    return INITIAL_SERVICE_REQUESTS.map((r: any) => ({ ...r, dateCreated: ensureBsDate(r.dateCreated) }));
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    return INITIAL_EXPENSES.map((e: any) => ({ ...e, date: ensureBsDate(e.date) }));
  });

  const [dailyClosings, setDailyClosings] = useState<DailyClosing[]>(() => []);

  const [periodicClosings, setPeriodicClosings] = useState<PeriodicClosing[]>(() => []);

  const [letters, setLetters] = useState<BusinessLetter[]>(() => []);

  // Attendance, Leave & Salary States
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => []);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => []);

  const [salaryDistributions, setSalaryDistributions] = useState<SalaryDistribution[]>(() => []);

  const [attendanceRequests, setAttendanceRequests] = useState<AttendanceRequest[]>(() => []);

  const [openingBalances, setOpeningBalances] = useState<OpeningBalances>(() => {
    return {
      RBB: { openingBalance: 0, openingBalanceDate: '2083-01-01' },
      ESEWA: { openingBalance: 0, openingBalanceDate: '2083-01-01' },
      SAHAKARI: { openingBalance: 0, openingBalanceDate: '2083-01-01' },
      CASH: { openingBalance: 0, openingBalanceDate: '2083-01-01' },
      DUE: { openingBalance: 0, openingBalanceDate: '2083-01-01' }
    };
  });

  const [accountTransfers, setAccountTransfers] = useState<AccountTransaction[]>(() => []);

  const [assets, setAssets] = useState<AssetItem[]>(() => []);

  const [shareholders, setShareholders] = useState<Shareholder[]>(() => {
    const saved = localStorage.getItem('reliabletech_shareholders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_SHAREHOLDERS;
  });

  useEffect(() => {
    localStorage.setItem('reliabletech_shareholders', JSON.stringify(shareholders));
  }, [shareholders]);

  const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>(() => {
    const saved = localStorage.getItem('reliabletech_meeting_notes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'meeting-initial-1',
        meetingDate: '2083-03-15',
        meetingNumber: 'RTSS-2082/83-0001',
        typeOfMeeting: 'Regular Board',
        presentMembers: ['Arpan Khadka', 'Kiran Sharma', 'Ramesh Dahal'],
        agendas: [
          { agenda: 'Review Q1 Cash flow and bank deposit alignment', decision: 'Verified eSewa and RBB statements. Discrepancies resolved.' },
          { agenda: 'Purchase of new durable asset (Air Conditioner)', decision: 'Approved budget of Rs. 45,000 for purchasing AC.' }
        ],
        status: 'Approved',
        submittedBy: 'Arpan Khadka',
        approvedByAdmins: ['usr-1'],
        totalAdminsAtSubmission: 2
      },
      {
        id: 'meeting-initial-2',
        meetingDate: '2083-04-10',
        meetingNumber: 'RTSS-2083/84-0001',
        typeOfMeeting: 'Emergency Board',
        presentMembers: ['Arpan Khadka', 'Kiran Sharma', 'Sita Devkota'],
        agendas: [
          { agenda: 'Audit of unlocked daily closing ledger on June 15', decision: 'Found entry clerical error. Allowed user to update and resubmit.' }
        ],
        status: 'Pending',
        submittedBy: 'Kiran Sharma',
        approvedByAdmins: ['usr-1'],
        totalAdminsAtSubmission: 2
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('reliabletech_meeting_notes', JSON.stringify(meetingNotes));
  }, [meetingNotes]);

  // E-Commerce & Online Storefront States
  const [ecommerceProducts, setEcommerceProducts] = useState<EcommerceProduct[]>(() => {
    const saved = localStorage.getItem('reliabletech_ecommerce_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_ECOMMERCE_PRODUCTS;
  });

  useEffect(() => {
    localStorage.setItem('reliabletech_ecommerce_products', JSON.stringify(ecommerceProducts));
  }, [ecommerceProducts]);

  const [customerAccounts, setCustomerAccounts] = useState<CustomerAccount[]>(() => {
    const saved = localStorage.getItem('reliabletech_customer_accounts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_CUSTOMER_ACCOUNTS;
  });

  useEffect(() => {
    localStorage.setItem('reliabletech_customer_accounts', JSON.stringify(customerAccounts));
  }, [customerAccounts]);

  const [ecommerceOrders, setEcommerceOrders] = useState<EcommerceOrder[]>(() => {
    const saved = localStorage.getItem('reliabletech_ecommerce_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_ECOMMERCE_ORDERS;
  });

  useEffect(() => {
    localStorage.setItem('reliabletech_ecommerce_orders', JSON.stringify(ecommerceOrders));
  }, [ecommerceOrders]);

  const [ecommerceServiceTickets, setEcommerceServiceTickets] = useState<EcommerceServiceTicket[]>(() => {
    const saved = localStorage.getItem('reliabletech_ecommerce_service_tickets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_SERVICE_TICKETS;
  });

  useEffect(() => {
    localStorage.setItem('reliabletech_ecommerce_service_tickets', JSON.stringify(ecommerceServiceTickets));
  }, [ecommerceServiceTickets]);

  const [hardwareTypes, setHardwareTypes] = useState<HardwareTypeOption[]>(() => {
    const saved = localStorage.getItem('reliabletech_hardware_types');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_HARDWARE_TYPES;
  });

  useEffect(() => {
    localStorage.setItem('reliabletech_hardware_types', JSON.stringify(hardwareTypes));
  }, [hardwareTypes]);

  const [currentCustomer, setCurrentCustomer] = useState<CustomerAccount | null>(() => {
    const saved = localStorage.getItem('reliabletech_current_customer');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  const [customerInquiries, setCustomerInquiries] = useState<CustomerInquiryMessage[]>(() => {
    const saved = localStorage.getItem('reliabletech_customer_inquiries');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_CUSTOMER_INQUIRIES;
  });

  useEffect(() => {
    localStorage.setItem('reliabletech_customer_inquiries', JSON.stringify(customerInquiries));
  }, [customerInquiries]);

  const [blockedMessengers, setBlockedMessengers] = useState<BlockedMessengerRecord[]>(() => {
    const saved = localStorage.getItem('reliabletech_blocked_messengers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('reliabletech_blocked_messengers', JSON.stringify(blockedMessengers));
  }, [blockedMessengers]);

  const handleSendCustomerMessage = (newInq: Omit<CustomerInquiryMessage, 'id' | 'created_at' | 'status'>) => {
    // Check if user or phone is blocked
    const isBlocked = blockedMessengers.some(
      b => (newInq.customer_phone && b.target_phone_or_email === newInq.customer_phone) || 
           (newInq.customer_email && b.target_phone_or_email === newInq.customer_email)
    );
    if (isBlocked) {
      showToast('This contact is currently blocked from sending messages.', 'error');
      return;
    }

    const newId = `INQ-${Date.now().toString().slice(-4)}`;
    const quickReplyMessage = profile?.customerChatQuickReply || "Namaste! Thank you for messaging ReliableTech Support Desk (Fikkal Bazaar, Ilam • Direct Counter Connect). Our on-duty technical counter staff have received your message and will assist you immediately. For urgent dispatch or on-site queries, feel free to call our hotline at 9852680780.";

    const initialReplies: any[] = [
      {
        id: `rep-${Date.now()}`,
        sender: 'Customer',
        sender_role: 'Customer',
        senderName: newInq.customer_name || 'Customer',
        message: newInq.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    if (quickReplyMessage && quickReplyMessage.trim()) {
      initialReplies.push({
        id: `rep-auto-${Date.now() + 1}`,
        sender: 'Staff',
        sender_role: 'Staff',
        senderName: 'Reliabletech Support Desk (Counter Connect)',
        staff_name: 'Reliabletech Support Desk (Counter Connect)',
        message: quickReplyMessage.trim(),
        reply_text: quickReplyMessage.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        created_at: new Date().toISOString().replace('T', ' ').slice(0, 16)
      });
    }

    const createdInquiry: CustomerInquiryMessage = {
      ...newInq,
      id: newId,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'Open',
      replies: initialReplies
    };
    setCustomerInquiries(prev => [createdInquiry, ...prev]);
    showToast('Your message has been sent to ReliableTech Support Desk!', 'success');
  };

  const handleSendInquiryReply = (inquiryId: string, replyText: string, senderName: string) => {
    setCustomerInquiries(prev => prev.map(inq => {
      const match = (inq.id === inquiryId || inq.inquiry_id === inquiryId);
      if (match) {
        const newReplies = [
          ...(inq.replies || []),
          {
            id: `rep-${Date.now()}`,
            sender: 'Customer' as const,
            senderName: senderName || inq.customer_name || 'Customer',
            message: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ];
        return {
          ...inq,
          replies: newReplies,
          status: inq.status === 'Closed' ? 'Open' : inq.status
        };
      }
      return inq;
    }));
  };

  const handleStaffReplyInquiry = (inquiryId: string, replyText: string, staffName: string) => {
    setCustomerInquiries(prev => prev.map(inq => {
      const match = (inq.id === inquiryId || inq.inquiry_id === inquiryId);
      if (match) {
        const newReplies = [
          ...(inq.replies || []),
          {
            id: `rep-${Date.now()}`,
            sender: 'Staff' as const,
            senderName: staffName || currentUser.name || 'ReliableTech Staff',
            staff_name: staffName || currentUser.name || 'ReliableTech Staff',
            message: replyText,
            reply_text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            created_at: new Date().toISOString().replace('T', ' ').slice(0, 16)
          }
        ];
        return {
          ...inq,
          replies: newReplies,
          status: 'Replied' as const
        };
      }
      return inq;
    }));
    showToast('Reply dispatched to customer chat successfully!', 'success');
  };

  const handleForwardInquiryToAdmin = (inquiryId: string) => {
    setCustomerInquiries(prev => prev.map(inq => {
      const match = (inq.id === inquiryId || inq.inquiry_id === inquiryId);
      if (match) {
        return {
          ...inq,
          status: 'Forwarded to Admin' as const
        };
      }
      return inq;
    }));
    showToast('Customer inquiry escalated to Admin Assistant for review!', 'info');
  };

  const handleBlockMessenger = (inquiryId: string, emailOrPhone: string, reason?: string) => {
    const newRecord: BlockedMessengerRecord = {
      blocked_id: `BLK-${Date.now().toString().slice(-4)}`,
      target_phone_or_email: emailOrPhone,
      blocked_by: currentUser.name,
      reason: reason || 'Spam / Policy violation',
      blocked_at: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setBlockedMessengers(prev => [newRecord, ...prev.filter(b => b.target_phone_or_email !== emailOrPhone)]);
    setCustomerInquiries(prev => prev.map(inq => {
      const match = (inq.id === inquiryId || inq.inquiry_id === inquiryId);
      if (match) {
        return { ...inq, status: 'Closed' as const };
      }
      return inq;
    }));
    showToast(`Messenger "${emailOrPhone}" has been blocked from chatting.`, 'error');
  };

  const handleUnblockMessenger = (emailOrPhone: string) => {
    setBlockedMessengers(prev => prev.filter(b => b.target_phone_or_email !== emailOrPhone));
    showToast(`Contact "${emailOrPhone}" unblocked successfully.`, 'success');
  };

  const handleVerifyOrderPayment = (orderId: string, status: 'Verified' | 'Rejected', note?: string) => {
    setEcommerceOrders(prev => prev.map(ord => {
      if (ord.order_id === orderId) {
        return {
          ...ord,
          payment_verification_status: status,
          payment_verification_notes: note || (status === 'Verified' ? 'Verified by staff' : 'Payment rejected'),
          order_state: status === 'Verified' && ord.order_state === 'Pending Verification' ? 'Processing/Packing' : ord.order_state
        };
      }
      return ord;
    }));
    showToast(`Order #${orderId} payment status updated to ${status}.`, status === 'Verified' ? 'success' : 'error');
  };

  const [showStaffLoginScreen, setShowStaffLoginScreen] = useState<boolean>(false);
  const [isStorefrontPreviewOpen, setIsStorefrontPreviewOpen] = useState<boolean>(false);

  // Database mounting & Scanning states (.exe local drive integration)
  const [dbFileMounted, setDbFileMounted] = useState<boolean>(false);
  const [dbBootSearching, setDbBootSearching] = useState<boolean>(false);
  const [simulatedPath, setSimulatedPath] = useState<string>('rtssdatabase.db');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [dbConnected, setDbConnected] = useState<boolean>(false);
  const [isCheckingDb, setIsCheckingDb] = useState<boolean>(false);

  // Check live connection status against SQLite backend
  const checkDbConnection = async (): Promise<boolean> => {
    setIsCheckingDb(true);
    try {
      const res = await fetch('/api/db/status');
      if (res.ok) {
        const statusData = await res.json().catch(() => ({ connected: false }));
        if (statusData.connected) {
          setDbConnected(true);
          return true;
        }
      }
      setDbConnected(false);
      return false;
    } catch (err) {
      console.error("SQLite connection status check failed:", err);
      setDbConnected(false);
      return false;
    } finally {
      setIsCheckingDb(false);
    }
  };

  // Re-establish connection & refresh data from rtssdatabase.db
  const handleConnectDb = async (): Promise<void> => {
    setIsCheckingDb(true);
    try {
      const isOk = await checkDbConnection();
      if (isOk) {
        const res = await fetch('/api/db/load');
        if (res.ok) {
          const dbData = await res.json().catch(() => null);
          if (dbData && Object.keys(dbData).length > 0) {
            loadConsolidatedDatabase(dbData);
          }
          setDbConnected(true);
          setDbFileMounted(true);
          showToast(`✨ Connected to rtssdatabase.db (SQLite 3)`, 'success');
        } else {
          setDbConnected(false);
          showToast(`❌ Failed to load rtssdatabase.db`, 'error');
        }
      } else {
        setDbConnected(false);
        showToast(`❌ Connection to rtssdatabase.db offline`, 'error');
      }
    } catch (err: any) {
      setDbConnected(false);
      showToast(`❌ Connection error: ${err.message || 'Server unreachable'}`, 'error');
    } finally {
      setIsCheckingDb(false);
    }
  };

  // Handle direct file selection (.db or .json) from Login page, Settings, or ExportCenter
  const handleUploadDbFile = (file: File): Promise<{ success: boolean; message?: string }> => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("No file provided"));
        return;
      }
      setIsCheckingDb(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const dataUrl = e.target?.result as string;
          const base64Str = dataUrl.split(',')[1];
          const res = await fetch('/api/db/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileBase64: base64Str, fileName: file.name })
          });
          if (res.ok) {
            const result = await res.json().catch(() => ({ loadedData: null }));
            if (result.loadedData && Object.keys(result.loadedData).length > 0) {
              loadConsolidatedDatabase(result.loadedData);
            }
            setSimulatedPath('rtssdatabase.db');
            setDbConnected(true);
            setDbFileMounted(true);
            showToast(`✨ Selected & mounted ${file.name} directly into rtssdatabase.db!`, 'success');
            resolve({ success: true, message: `Successfully connected and mounted ${file.name} into SQLite 3` });
          } else {
            const errJson = await res.json().catch(() => ({}));
            const errMsg = errJson.error || 'Failed to mount database file into rtssdatabase.db';
            showToast(`❌ ${errMsg}`, 'error');
            reject(new Error(errMsg));
          }
        } catch (err: any) {
          console.error("Error uploading database file:", err);
          showToast(`❌ Connection error: ${err.message}`, 'error');
          reject(err);
        } finally {
          setIsCheckingDb(false);
        }
      };
      reader.onerror = () => {
        setIsCheckingDb(false);
        reject(new Error("Failed to read file from disk"));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSelectDbFile = async (fileInput?: File) => {
    if (fileInput) {
      handleUploadDbFile(fileInput);
      return;
    }

    if (typeof window !== 'undefined' && 'showOpenFilePicker' in window) {
      try {
        setIsCheckingDb(true);
        const [handle] = await (window as any).showOpenFilePicker({
          types: [{
            description: 'SQLite Database (*.db, *.sqlite)',
            accept: {
              'application/x-sqlite3': ['.db', '.sqlite', '.sqlite3']
            }
          }],
          multiple: false
        });

        if (handle) {
          const permOptions = { mode: 'readwrite' };
          let perm = await handle.queryPermission(permOptions);
          if (perm !== 'granted') {
            perm = await handle.requestPermission(permOptions);
          }
          if (perm === 'granted') {
            fileHandleRef.current = handle;
            await setStoredHandle(handle);
            const file = await handle.getFile();
            handleUploadDbFile(file);
          } else {
            showToast("⚠️ Permission denied for rtssdatabase.db local file.", "warning");
            jsonFileInputRef.current?.click();
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("File System Access API error:", err);
          jsonFileInputRef.current?.click();
        }
        setIsCheckingDb(false);
      }
    } else {
      jsonFileInputRef.current?.click();
    }
  };

  const fileHandleRef = useRef<any>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const isDbLoadingRef = useRef<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadDbFile(file);
    }
  };

  // Restore and initialize SQLite database connector (rtssdatabase.db) on startup
  useEffect(() => {
    let isMounted = true;
    const initializeSQLiteConnection = async () => {
      try {
        setDbBootSearching(true);
        const res = await fetch('/api/db/load');
        if (res.ok && isMounted) {
          const dbData = await res.json();
          if (dbData && Object.keys(dbData).length > 0) {
            loadConsolidatedDatabase(dbData);
          } else {
            // Seed initial state into rtssdatabase.db if database is empty on first boot
            const initialData = getConsolidatedData();
            await saveToSQLite(initialData);
          }
          setSimulatedPath('rtssdatabase.db');
          setDbFileMounted(true);
          setDbConnected(true);
        }
      } catch (err) {
        console.error("Error connecting SQLite database on boot:", err);
      } finally {
        if (isMounted) {
          setDbBootSearching(false);
        }
      }
    };

    initializeSQLiteConnection();
  }, []);

  // Toast notifications state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('reliabletech_is_authenticated') === 'true';
  });

  const [prepopulatedInvoiceData, setPrepopulatedInvoiceData] = useState<{

    customerName: string;
    customerPhone: string;
    customerAddress: string;
    items: { itemName: string; price: number }[];
    serviceRequestId: string;
  } | null>(null);

  // User switching password confirmation modal states
  const [pendingUserToSwitch, setPendingUserToSwitch] = useState<AppUser | null>(null);
  const [enteredPassword, setEnteredPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Keep localStorage sync'd
  // Bind window.alert to custom Toast component
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg: string) => {
      if (msg.toLowerCase().includes('success') || msg.toLowerCase().includes('approved') || msg.toLowerCase().includes('connected')) {
        showToast(msg, 'success');
      } else if (msg.toLowerCase().includes('error') || msg.toLowerCase().includes('fail') || msg.toLowerCase().includes('invalid')) {
        showToast(msg, 'error');
      } else if (msg.toLowerCase().includes('warning') || msg.toLowerCase().includes('lock') || msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('missing')) {
        showToast(msg, 'warning');
      } else {
        showToast(msg, 'info');
      }
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  // Consolidated database loader
  const loadConsolidatedDatabase = (db: any) => {
    isDbLoadingRef.current = true;
    if (db.profile) setProfile(db.profile);
    if (db.services) setServices(db.services);
    if (db.suppliers) setSuppliers(db.suppliers);
    if (db.supplierPayments) setSupplierPayments(db.supplierPayments);
    if (db.transactions) setTransactions(db.transactions);
    if (db.invoices) setInvoices(db.invoices);
    if (db.users) setUsers(db.users);
    if (db.units) setUnits(db.units);
    if (db.editRequests) setEditRequests(db.editRequests);
    if (db.inventoryStock) setInventoryStock(db.inventoryStock);
    if (db.inventoryRequests) setInventoryRequests(db.inventoryRequests);
    if (db.officeUseRequests) setOfficeUseRequests(db.officeUseRequests);
    else if (db.pendingRequests) setOfficeUseRequests(db.pendingRequests);
    if (db.serviceRequests) setServiceRequests(db.serviceRequests);
    if (db.expenses) setExpenses(db.expenses);
    if (db.dailyClosings) setDailyClosings(db.dailyClosings);
    if (db.periodicClosings) setPeriodicClosings(db.periodicClosings);
    if (db.letters) setLetters(db.letters);
    if (db.attendanceRecords) setAttendanceRecords(db.attendanceRecords);
    if (db.leaveRequests) setLeaveRequests(db.leaveRequests);
    if (db.salaryDistributions) setSalaryDistributions(db.salaryDistributions);
    if (db.attendanceRequests) setAttendanceRequests(db.attendanceRequests);
    if (db.openingBalances) setOpeningBalances(db.openingBalances);
    if (db.accountTransfers) setAccountTransfers(db.accountTransfers);
    if (db.assets) setAssets(db.assets);
    if (db.meetingNotes) setMeetingNotes(db.meetingNotes);
    if (db.shareholders) setShareholders(db.shareholders);
    if (db.ecommerceProducts) setEcommerceProducts(db.ecommerceProducts);
    if (db.customerAccounts) setCustomerAccounts(db.customerAccounts);
    if (db.ecommerceOrders) setEcommerceOrders(db.ecommerceOrders);
    if (db.ecommerceServiceTickets) setEcommerceServiceTickets(db.ecommerceServiceTickets);
    
    setTimeout(() => {
      isDbLoadingRef.current = false;
      setHasUnsavedChanges(false);
    }, 150);
  };

  // Helper to package entire system data into one JSON representation
  const getConsolidatedData = () => {
    return {
      profile,
      services,
      suppliers,
      supplierPayments,
      transactions,
      invoices,
      users,
      units,
      editRequests,
      inventoryStock,
      inventoryRequests,
      officeUseRequests,
      pendingRequests: officeUseRequests,
      serviceRequests,
      expenses,
      dailyClosings,
      periodicClosings,
      letters,
      attendanceRecords,
      leaveRequests,
      salaryDistributions,
      attendanceRequests,
      openingBalances,
      accountTransfers,
      assets,
      meetingNotes,
      shareholders,
      ecommerceProducts,
      customerAccounts,
      ecommerceOrders,
      ecommerceServiceTickets
    };
  };

  // Background asynchronous writer directly to SQLite database (rtssdatabase.db)
  const saveToSQLite = async (data: any) => {
    try {
      setIsSaving(true);
      // 1. Write to server-side SQLite database file (rtssdatabase.db)
      const res = await fetch('/api/db/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setHasUnsavedChanges(false);
        const isOk = await checkDbConnection();
        if (!isOk) {
          setDbConnected(false);
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.error("Failed to auto-write database to rtssdatabase.db:", errJson);
        setDbConnected(false);
      }

      // 2. Write directly to local file system handle if permission granted
      if (fileHandleRef.current) {
        try {
          const perm = await fileHandleRef.current.queryPermission({ mode: 'readwrite' });
          if (perm === 'granted') {
            const writable = await fileHandleRef.current.createWritable();
            await writable.write(JSON.stringify(data, null, 2));
            await writable.close();
          }
        } catch (localErr) {
          console.warn("Direct file write skipped/warning:", localErr);
        }
      }
    } catch (err: any) {
      console.error("Failed to auto-write database to rtssdatabase.db:", err);
      setDbConnected(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save to SQLite database (rtssdatabase.db) whenever any state changes
  useEffect(() => {
    if (dbFileMounted && !isDbLoadingRef.current) {
      setHasUnsavedChanges(true);
      const data = getConsolidatedData();
      saveToSQLite(data);
    }
  }, [
    profile, services, suppliers, supplierPayments, transactions, invoices, users, units, 
    editRequests, inventoryStock, inventoryRequests, officeUseRequests, serviceRequests, 
    expenses, dailyClosings, periodicClosings, letters, attendanceRecords, leaveRequests, 
    salaryDistributions, attendanceRequests, dbFileMounted, openingBalances, accountTransfers, assets, meetingNotes,
    ecommerceProducts, customerAccounts, ecommerceOrders, ecommerceServiceTickets
  ]);

  // Prevent accidental tab closure if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "⚠️ You have unsaved changes in Reliabletech Enterprise Suite! Please wait for background autosave to complete, or export data manually.";
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);


  // Redirect users to permitted tab if they switch away or somehow land on unpermitted tabs
  useEffect(() => {
    const allowed = getUserAllowedTabs(currentUser, rolePermissionsConfig);
    if (!allowed.includes(activeTab)) {
      setActiveTab(allowed[0] || 'dashboard');
    }
  }, [currentUser, activeTab, rolePermissionsConfig]);

  // CRUD actions for Services
  const handleAddService = (newSrv: Omit<BusinessService, 'id'>) => {
    const srv: BusinessService = {
      ...newSrv,
      id: `srv-${Date.now()}`
    };
    setServices(prev => [srv, ...prev]);
  };

  const handleEditService = (updatedSrv: BusinessService) => {
    setServices(prev => prev.map(s => s.id === updatedSrv.id ? updatedSrv : s));
  };

  const handleDeleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  // CRUD actions for Official Letters
  const handleAddLetter = (newLet: Omit<BusinessLetter, 'id'>) => {
    const letter: BusinessLetter = {
      ...newLet,
      id: `let-${Date.now()}`
    };
    setLetters(prev => [letter, ...prev]);
  };

  const handleEditLetter = (updatedLet: BusinessLetter) => {
    setLetters(prev => prev.map(l => l.id === updatedLet.id ? updatedLet : l));
  };

  const handleDeleteLetter = (id: string) => {
    setLetters(prev => prev.filter(l => l.id !== id));
  };

  // CRUD actions for Suppliers
  const handleAddSupplier = (newSup: Omit<Supplier, 'id'>) => {
    const sup: Supplier = {
      ...newSup,
      id: `sup-${Date.now()}`
    };
    setSuppliers(prev => [sup, ...prev]);
  };

  const handleEditSupplier = (updatedSup: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === updatedSup.id ? updatedSup : s));
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    // Also mark related transactions as having unknown supplier
  };

  const handleDeleteSupplierPayment = (paymentId: string) => {
    const payment = supplierPayments.find(p => p.id === paymentId);
    if (!payment) return;

    // Check date lock
    const lockCheck = checkDateLock(payment.date, dailyClosings, periodicClosings);
    if (lockCheck.locked) {
      alert(`Delete blocked. This payment date (${payment.date}) falls in a locked/closed period: ${lockCheck.reason}`);
      return;
    }

    // 1. Remove the payment record
    setSupplierPayments(prev => prev.filter(p => p.id !== paymentId));

    // 2. Restore supplier's creditBalance
    setSuppliers(prev => prev.map(s => {
      if (s.id === payment.supplierId) {
        return {
          ...s,
          creditBalance: s.creditBalance + payment.amountPaid
        };
      }
      return s;
    }));

    // 3. Find and delete corresponding expense
    const corrExpense = expenses.find(e => e.referenceId === paymentId);
    if (corrExpense) {
      setExpenses(prev => prev.filter(e => e.id !== corrExpense.id));
    }
    
    alert(`Supplier payment record deleted successfully. Outstanding due increased by Rs. ${payment.amountPaid.toLocaleString()}.`);
  };

  // CRUD actions for Procurement Ledger
  const handleAddTransaction = (newTx: Omit<SupplyTransaction, 'id'>) => {
    const lockCheck = checkDateLock(newTx.date, dailyClosings, periodicClosings);
    if (lockCheck.locked) {
      alert(lockCheck.reason);
      return;
    }

    const paidAmt = newTx.amountPaid || 0;
    const paymentMethod = (newTx as any).paymentMethod;
    if (paidAmt > 0 && paymentMethod) {
      const v = validateAccountBalance(paymentMethod, paidAmt, {
        openingBalances,
        invoices,
        expenses,
        transactions,
        salaryDistributions,
        accountTransfers,
        dailyClosings,
        editRequests
      });
      if (v) {
        setInsufficientBalanceValidation(v);
        return;
      }
    }

    const tx: SupplyTransaction = {
      ...newTx,
      id: `tx-${Date.now()}`
    };
    setTransactions(prev => [tx, ...prev]);

    // OPTIONAL: Automatically adjust the supplier's creditBalance for real-time ledger accounting!
    if (newTx.amountDue > 0) {
      setSuppliers(prev => prev.map(sup => {
        if (sup.id === newTx.supplierId) {
          return {
            ...sup,
            creditBalance: sup.creditBalance + newTx.amountDue
          };
        }
        return sup;
      }));
    }
  };

  const handleEditTransaction = (updatedTx: SupplyTransaction) => {
    const lockCheck = checkDateLock(updatedTx.date, dailyClosings, periodicClosings);
    if (lockCheck.locked) {
      alert(lockCheck.reason);
      return;
    }

    // Find original transaction to adjust supplier credit balance diff
    const originalTx = transactions.find(t => t.id === updatedTx.id);
    if (originalTx) {
      const oldLockCheck = checkDateLock(originalTx.date, dailyClosings, periodicClosings);
      if (oldLockCheck.locked) {
        alert(`Direct edit is blocked. Old transaction date (${originalTx.date}) falls in a locked/closed period: ${oldLockCheck.reason}`);
        return;
      }
    }

    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));

    if (originalTx) {
      const balanceDiff = updatedTx.amountDue - originalTx.amountDue;
      if (balanceDiff !== 0) {
        setSuppliers(prev => prev.map(sup => {
          if (sup.id === updatedTx.supplierId) {
            return {
              ...sup,
              creditBalance: Math.max(0, sup.creditBalance + balanceDiff)
            };
          }
          return sup;
        }));
      }
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const originalTx = transactions.find(t => t.id === id);
    if (originalTx) {
      const lockCheck = checkDateLock(originalTx.date, dailyClosings, periodicClosings);
      if (lockCheck.locked) {
        alert(lockCheck.reason);
        return;
      }
    }

    setTransactions(prev => prev.filter(t => t.id !== id));

    // Reverse the credit balance applied to the supplier
    if (originalTx && originalTx.amountDue > 0) {
      setSuppliers(prev => prev.map(sup => {
        if (sup.id === originalTx.supplierId) {
          return {
            ...sup,
            creditBalance: Math.max(0, sup.creditBalance - originalTx.amountDue)
          };
        }
        return sup;
      }));
    }
  };

  // CRUD actions for Asset Management
  const handleAddAsset = (newAsset: Omit<AssetItem, 'id' | 'assetCode' | 'status'>) => {
    setAssets(prev => {
      const fiscalYear = getNepaleseFiscalYear(newAsset.purchaseDate || getCurrentBsDate());
      const prefix = newAsset.type === 'Durable' 
        ? `RTSS-ASSETS-DU-${fiscalYear}-` 
        : `RTSS-ASSETS-NONDU-${fiscalYear}-`;
      const filtered = prev.filter(a => a.assetCode.startsWith(prefix));
      let maxNum = 0;
      filtered.forEach(a => {
        const numPart = a.assetCode.replace(prefix, '');
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      });
      const nextCode = `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
      const asset: AssetItem = {
        ...newAsset,
        id: `asset-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        assetCode: nextCode,
        status: 'Active'
      };
      return [asset, ...prev];
    });
  };

  const handleEditAsset = (updatedAsset: AssetItem) => {
    setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
  };

  const handleDeleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  // CRUD actions for Sales & Billing
  const handleAddInvoice = (newInv: Omit<SalesInvoice, 'id'>) => {
    const lockCheck = checkDateLock(newInv.date, dailyClosings, periodicClosings);
    if (lockCheck.locked) {
      alert(lockCheck.reason);
      return;
    }

    const invId = `inv-${Date.now()}`;
    const inv: SalesInvoice = {
      ...newInv,
      id: invId
    };
    setInvoices(prev => [inv, ...prev]);

    // Adjust inventory stock on invoice addition
    if (inv.items && inv.items.length > 0) {
      setInventoryStock(prevStock => {
        return prevStock.map(stockItem => {
          const matchedItem = inv.items.find(it => it.serviceId === stockItem.id);
          if (matchedItem) {
            return {
              ...stockItem,
              quantity: Math.max(0, stockItem.quantity - matchedItem.quantity)
            };
          }
          return stockItem;
        });
      });
    }

    // Link service request status
    if (prepopulatedInvoiceData) {
      setServiceRequests(prevRequests => prevRequests.map(r => {
        if (r.id === prepopulatedInvoiceData.serviceRequestId) {
          return {
            ...r,
            billedInvoiceId: inv.invoiceNumber,
            status: inv.status === 'Paid' ? 'Delivered' : 'Completed'
          };
        }
        return r;
      }));
    }
  };

  const handleEditInvoice = (updatedInv: SalesInvoice) => {
    const lockCheck = checkDateLock(updatedInv.date, dailyClosings, periodicClosings);
    if (lockCheck.locked) {
      alert(lockCheck.reason);
      return;
    }

    const oldInv = invoices.find(i => i.id === updatedInv.id);
    if (oldInv) {
      const oldLockCheck = checkDateLock(oldInv.date, dailyClosings, periodicClosings);
      if (oldLockCheck.locked) {
        alert(`Direct edit is blocked. Old transaction date (${oldInv.date}) falls in a locked/closed period: ${oldLockCheck.reason}`);
        return;
      }
    }

    setInvoices(prev => prev.map(inv => inv.id === updatedInv.id ? updatedInv : inv));

    // Revert old inventory stock deduction, then apply the new one
    setInventoryStock(prevStock => {
      let tempStock = [...prevStock];
      
      // 1. Add back the old invoice items quantities
      if (oldInv && oldInv.items && oldInv.items.length > 0) {
        tempStock = tempStock.map(stockItem => {
          const matchedItem = oldInv.items.find(it => it.serviceId === stockItem.id);
          if (matchedItem) {
            return {
              ...stockItem,
              quantity: stockItem.quantity + matchedItem.quantity
            };
          }
          return stockItem;
        });
      }

      // 2. Subtract the new invoice items quantities
      if (updatedInv && updatedInv.items && updatedInv.items.length > 0) {
        tempStock = tempStock.map(stockItem => {
          const matchedItem = updatedInv.items.find(it => it.serviceId === stockItem.id);
          if (matchedItem) {
            return {
              ...stockItem,
              quantity: Math.max(0, stockItem.quantity - matchedItem.quantity)
            };
          }
          return stockItem;
        });
      }

      return tempStock;
    });

    // If an invoice remarks mentions a service request id, update that request's status!
    if (updatedInv.remarks && updatedInv.remarks.includes('Service Bill for request #')) {
      const match = updatedInv.remarks.match(/Service Bill for request #(sr-[0-9]+)/);
      if (match && match[1]) {
        const serviceRequestId = match[1];
        setServiceRequests(prevRequests => prevRequests.map(r => {
          if (r.id === serviceRequestId) {
            return {
              ...r,
              status: updatedInv.status === 'Paid' ? 'Delivered' : 'Completed'
            };
          }
          return r;
        }));
      }
    }
  };

  const handleDeleteInvoice = (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (inv) {
      const lockCheck = checkDateLock(inv.date, dailyClosings, periodicClosings);
      if (lockCheck.locked) {
        alert(lockCheck.reason);
        return;
      }
    }

    if (inv && inv.items && inv.items.length > 0) {
      setInventoryStock(prevStock => {
        return prevStock.map(stockItem => {
          const matchedItem = inv.items.find(it => it.serviceId === stockItem.id);
          if (matchedItem) {
            return {
              ...stockItem,
              quantity: stockItem.quantity + matchedItem.quantity
            };
          }
          return stockItem;
        });
      });
    }
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  // Attendance & Staff Management Handlers
  const handleSaveAttendance = (record: AttendanceRecord) => {
    setAttendanceRecords(prev => {
      const idx = prev.findIndex(r => r.userId === record.userId && r.date === record.date);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = record;
        return copy;
      }
      return [record, ...prev];
    });
  };

  const handleAddLeaveRequest = (req: LeaveRequest) => {
    setLeaveRequests(prev => [req, ...prev]);
  };

  const handleUpdateLeaveRequest = (id: string, status: 'Approved' | 'Rejected', adminRemarks: string) => {
    setLeaveRequests(prev => prev.map(req => {
      if (req.id === id) {
        if (status === 'Approved') {
          // Auto-mark attendance record for this leave span as 'On Leave'
          const newRecord: AttendanceRecord = {
            id: `att-leave-${Date.now()}-${req.id}`,
            userId: req.userId,
            userName: req.userName,
            date: req.startDate,
            status: 'On Leave',
            remarks: `Leave: ${req.leaveType}. Note: ${adminRemarks || 'None'}`
          };
          handleSaveAttendance(newRecord);
        }
        return { ...req, status, remarks: adminRemarks };
      }
      return req;
    }));
    showToast(`Leave request ${status.toLowerCase()} successfully.`, 'success');
  };

  const handleDistributeSalary = (dist: SalaryDistribution) => {
    const lockCheck = checkDateLock(dist.distributionDate, dailyClosings, periodicClosings);
    if (lockCheck.locked) {
      alert(lockCheck.reason);
      return;
    }
    setSalaryDistributions(prev => [dist, ...prev]);
  };

  const handleAddAttendanceRequest = (req: AttendanceRequest) => {
    setAttendanceRequests(prev => [req, ...prev]);
  };

  const handleApproveAttendanceRequest = (id: string, remarks?: string) => {
    setAttendanceRequests(prev => prev.map(req => {
      if (req.id === id) {
        setAttendanceRecords(current => {
          const idx = current.findIndex(r => r.userId === req.userId && r.date === req.date);
          if (idx !== -1) {
            const updated = [...current];
            const rec = updated[idx];
            if (req.type === 'Check-In') {
              updated[idx] = {
                ...rec,
                checkInTime: req.time,
                status: 'Present'
              };
            } else {
              updated[idx] = {
                ...rec,
                checkOutTime: req.time
              };
            }
            return updated;
          } else {
            const newRecord: AttendanceRecord = {
              id: `att-${Date.now()}-${req.userId}`,
              userId: req.userId,
              userName: req.userName,
              date: req.date,
              status: req.type === 'Check-In' ? 'Present' : 'Absent',
              checkInTime: req.type === 'Check-In' ? req.time : undefined,
              checkOutTime: req.type === 'Check-Out' ? req.time : undefined,
              remarks: remarks || undefined
            };
            return [newRecord, ...current];
          }
        });
        return { ...req, status: 'Approved' as const, remarks };
      }
      return req;
    }));
    showToast("Attendance request approved successfully.", "success");
  };

  const handleDeclineAttendanceRequest = (id: string, remarks?: string) => {
    setAttendanceRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'Declined' as const, remarks } : req));
    showToast("Attendance request declined.", "warning");
  };

  // CRUD actions for Service Requests
  const handleAddServiceRequest = (newReq: Omit<ServiceRequest, 'id' | 'requestNo' | 'dateCreated'>) => {
    const todayBs = getCurrentBsDate();
    const reqNo = generateServiceRequestNo(todayBs, serviceRequests, periodicClosings);
    const req: ServiceRequest = {
      ...newReq,
      id: `sr-${Date.now()}`,
      requestNo: reqNo,
      dateCreated: todayBs
    };
    setServiceRequests(prev => [req, ...prev]);
  };

  const handleEditServiceRequest = (updatedReq: ServiceRequest) => {
    setServiceRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
  };

  const handleDeleteServiceRequest = (id: string) => {
    setServiceRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleBillServiceRequest = (req: ServiceRequest) => {
    const currentServices = [...services];
    let servicesUpdated = false;

    const mappedItems = req.items.map((item, index) => {
      let matchingSrv = currentServices.find(s => s.name.toLowerCase() === item.itemName.toLowerCase());
      
      if (!matchingSrv) {
        matchingSrv = {
          id: `srv-req-item-${Date.now()}-${index}`,
          name: item.itemName,
          category: 'Service Job',
          priceRate: item.price,
          rateType: 'Flat',
          description: `Service item from request ${req.requestNo}`,
          status: 'Active',
          dateAdded: getCurrentBsDate()
        };
        currentServices.unshift(matchingSrv);
        servicesUpdated = true;
      }

      return {
        itemName: item.itemName,
        price: item.price
      };
    });

    if (servicesUpdated) {
      setServices(currentServices);
    }

    setPrepopulatedInvoiceData({
      customerName: req.customerName,
      customerPhone: req.customerContact,
      customerAddress: req.customerAddress,
      items: mappedItems,
      serviceRequestId: req.id
    });

    setActiveTab('sales');
  };

  // CRUD actions for Expenses
  const applyExpenseToPurchaseOrder = (poIdsStr: string, amount: number) => {
    const poIds = poIdsStr.split(',').map(s => s.trim()).filter(Boolean);
    if (poIds.length <= 1) {
      const targetId = poIds[0] || poIdsStr;
      setTransactions(prev => prev.map(po => {
        if (po.id === targetId) {
          const newPaid = Math.max(0, po.amountPaid + amount);
          const newDue = Math.max(0, po.amountDue - amount);
          let newStatus: 'Paid' | 'Partially Paid' | 'Ordered' | 'Approved' = po.status;
          if (newDue <= 0) {
            newStatus = 'Paid';
          } else if (newPaid > 0) {
            newStatus = 'Partially Paid';
          }
          return {
            ...po,
            amountPaid: newPaid,
            amountDue: newDue,
            status: newStatus
          };
        }
        return po;
      }));
      return;
    }

    // Multiple POs path (sequential waterfall distribution)
    if (amount >= 0) {
      let remainingAmount = amount;
      setTransactions(prev => {
        return prev.map(po => {
          if (poIds.includes(po.id)) {
            const payable = po.amountDue;
            const paymentForThisPo = Math.min(remainingAmount, payable);
            remainingAmount -= paymentForThisPo;

            const newPaid = po.amountPaid + paymentForThisPo;
            const newDue = po.amountDue - paymentForThisPo;
            let newStatus = po.status;
            if (newDue <= 0) {
              newStatus = 'Paid';
            } else if (newPaid > 0) {
              newStatus = 'Partially Paid';
            }
            return {
              ...po,
              amountPaid: newPaid,
              amountDue: newDue,
              status: newStatus
            };
          }
          return po;
        });
      });
    } else {
      // Reversing/negative amount (e.g., when deleting or rejecting an expense)
      let remainingRefund = Math.abs(amount);
      setTransactions(prev => {
        return prev.map(po => {
          if (poIds.includes(po.id)) {
            const refundable = po.amountPaid;
            const refundForThisPo = Math.min(remainingRefund, refundable);
            remainingRefund -= refundForThisPo;

            const newPaid = Math.max(0, po.amountPaid - refundForThisPo);
            const newDue = po.amountDue + refundForThisPo;
            let newStatus = po.status;
            if (newDue <= 0) {
              newStatus = 'Paid';
            } else if (newPaid > 0) {
              newStatus = 'Partially Paid';
            } else {
              newStatus = 'Ordered';
            }
            return {
              ...po,
              amountPaid: newPaid,
              amountDue: newDue,
              status: newStatus
            };
          }
          return po;
        });
      });
    }
  };

  const handleAddExpense = (newExp: Omit<Expense, 'id' | 'expenseNo'>) => {
    const lockCheck = checkDateLock(newExp.date, dailyClosings, periodicClosings);
    if (lockCheck.locked) {
      alert(lockCheck.reason);
      return;
    }

    if (newExp.status === 'Approved' && newExp.amount > 0 && newExp.paymentMethod) {
      const balanceData = {
        openingBalances,
        invoices,
        expenses,
        transactions,
        salaryDistributions,
        accountTransfers,
        dailyClosings,
        editRequests,
        shareholders,
        meetingNotes
      };
      if (newExp.paymentMethod === 'Split' && newExp.paymentSplits) {
        const insSplits = validateSplitAccountBalances(newExp.paymentSplits, balanceData);
        if (insSplits.length > 0) {
          setInsufficientBalanceValidation(insSplits[0]);
          return;
        }
      } else {
        const v = validateAccountBalance(newExp.paymentMethod, newExp.amount, balanceData);
        if (v) {
          setInsufficientBalanceValidation(v);
          return;
        }
      }
    }

    const expenseNo = generateExpenseNo(newExp.date, expenses, periodicClosings);
    const exp: Expense = {
      ...newExp,
      id: `exp-${Date.now()}`,
      expenseNo
    };
    setExpenses(prev => [exp, ...prev]);

    // If approved on creation (by admin) and category is 'Purchase Order', pay off the order
    if (exp.status === 'Approved' && exp.category === 'Purchase Order' && exp.referenceId) {
      applyExpenseToPurchaseOrder(exp.referenceId, exp.amount);
    }
  };

  const handleEditExpense = (updatedExp: Expense) => {
    const lockCheck = checkDateLock(updatedExp.date, dailyClosings, periodicClosings);
    if (lockCheck.locked) {
      alert(lockCheck.reason);
      return;
    }

    // Check if status changed to approved, or if amount changed for an already approved expense
    const original = expenses.find(e => e.id === updatedExp.id);
    if (original) {
      const oldLockCheck = checkDateLock(original.date, dailyClosings, periodicClosings);
      if (oldLockCheck.locked) {
        alert(`Direct edit is blocked. Old transaction date (${original.date}) falls in a locked/closed period: ${oldLockCheck.reason}`);
        return;
      }
    }

    if (updatedExp.status === 'Approved' && updatedExp.amount > 0 && updatedExp.paymentMethod) {
      const balanceData = {
        openingBalances,
        invoices,
        expenses,
        transactions,
        salaryDistributions,
        accountTransfers,
        dailyClosings,
        editRequests,
        shareholders,
        meetingNotes
      };
      if (updatedExp.paymentMethod === 'Split' && updatedExp.paymentSplits) {
        const insSplits = validateSplitAccountBalances(updatedExp.paymentSplits, balanceData);
        if (insSplits.length > 0) {
          setInsufficientBalanceValidation(insSplits[0]);
          return;
        }
      } else {
        const v = validateAccountBalance(updatedExp.paymentMethod, updatedExp.amount, balanceData);
        if (v) {
          setInsufficientBalanceValidation(v);
          return;
        }
      }
    }

    setExpenses(prev => prev.map(e => e.id === updatedExp.id ? updatedExp : e));

    if (updatedExp.status === 'Approved' && updatedExp.category === 'Purchase Order' && updatedExp.referenceId) {
      const originalAmount = original?.status === 'Approved' ? original.amount : 0;
      const diff = updatedExp.amount - originalAmount;
      if (diff !== 0) {
        applyExpenseToPurchaseOrder(updatedExp.referenceId, diff);
      }
    }
  };

  const handleDeleteExpense = (id: string) => {
    const original = expenses.find(e => e.id === id);
    if (original) {
      const lockCheck = checkDateLock(original.date, dailyClosings, periodicClosings);
      if (lockCheck.locked) {
        alert(lockCheck.reason);
        return;
      }
    }

    setExpenses(prev => prev.filter(e => e.id !== id));

    // If was approved, reverse purchase order amount
    if (original?.status === 'Approved' && original.category === 'Purchase Order' && original.referenceId) {
      applyExpenseToPurchaseOrder(original.referenceId, -original.amount);
    }
  };

  const handleApproveExpense = (id: string, adminName: string) => {
    const target = expenses.find(e => e.id === id);
    if (!target) return;

    const lockCheck = checkDateLock(target.date, dailyClosings, periodicClosings);
    if (lockCheck.locked) {
      alert(`Approval blocked. Transaction date (${target.date}) is locked: ${lockCheck.reason}`);
      return;
    }

    const balanceData = {
      openingBalances,
      invoices,
      expenses,
      transactions,
      salaryDistributions,
      accountTransfers,
      dailyClosings,
      editRequests,
      shareholders,
      meetingNotes
    };

    if (target.paymentMethod === 'Split' && target.paymentSplits) {
      const insSplits = validateSplitAccountBalances(target.paymentSplits, balanceData);
      if (insSplits.length > 0) {
        setInsufficientBalanceValidation(insSplits[0]);
        return;
      }
    } else {
      const v = validateAccountBalance(target.paymentMethod, target.amount, balanceData);
      if (v) {
        setInsufficientBalanceValidation(v);
        return;
      }
    }

    setExpenses(prev => prev.map(e => {
      if (e.id === id) {
        const approved = { ...e, status: 'Approved' as const, approvedBy: adminName };
        if (approved.category === 'Purchase Order' && approved.referenceId) {
          applyExpenseToPurchaseOrder(approved.referenceId, approved.amount);
        }
        return approved;
      }
      return e;
    }));
  };

  const handleDeclineExpense = (id: string, adminName: string) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'Declined' as const, approvedBy: adminName } : e));
  };

  // Staff Edit Requests Authorization Actions
  const handleSendEditRequest = (req: Omit<EditRequest, 'status'> & { status: 'Pending' }) => {
    setEditRequests(prev => [req as EditRequest, ...prev]);
  };

  const handleApproveEditRequest = (id: string, remarks?: string) => {
    setEditRequests(prev => prev.map(req => {
      if (req.id === id) {
        // Apply changes based on request type
        if (req.type === 'Invoice Edit' && req.invoiceData) {
          setInvoices(current => current.map(inv => inv.id === req.invoiceData.id ? req.invoiceData : inv));
        } else if (req.type === 'Invoice Deletion' && req.targetInvoiceId) {
          setInvoices(current => current.filter(inv => inv.id !== req.targetInvoiceId));
        } else if (req.type === 'Payment Collection' && req.paymentDetails) {
          // Dynamic payment distribution starting from oldest dues
          const { customerName, amount, method } = req.paymentDetails;
          let remainingPayment = amount;
          
          setInvoices(current => {
            return current.map(inv => {
              if (inv.customerName.trim().toLowerCase() === customerName.trim().toLowerCase() && inv.dueAmount > 0) {
                if (remainingPayment <= 0) return inv;
                
                const originalDue = inv.dueAmount;
                const paymentApplied = Math.min(remainingPayment, originalDue);
                remainingPayment -= paymentApplied;
                
                const newPaid = inv.paidAmount + paymentApplied;
                const newDue = originalDue - paymentApplied;
                
                let newStatus: 'Paid' | 'Partially Paid' | 'Unpaid' = inv.status;
                if (newDue === 0) newStatus = 'Paid';
                else if (newPaid > 0) newStatus = 'Partially Paid';

                return {
                  ...inv,
                  paidAmount: newPaid,
                  dueAmount: newDue,
                  status: newStatus,
                  remarks: inv.remarks 
                    ? `${inv.remarks} (Recouped Rs. ${paymentApplied} via ${method} on approval)` 
                    : `Recouped Rs. ${paymentApplied} via ${method} on approval`
                };
              }
              return inv;
            });
          });
        } else if (req.type === 'Asset Edit' && req.assetData) {
          setAssets(current => current.map(asset => asset.id === req.assetData.id ? req.assetData : asset));
        } else if (req.type === 'Asset Deletion' && req.targetAssetId) {
          setAssets(current => current.filter(asset => asset.id !== req.targetAssetId));
        } else if (req.type === 'Supplier Edit' && req.supplierData) {
          setSuppliers(current => {
            const exists = current.some(sup => sup.id === req.supplierData.id);
            if (exists) {
              return current.map(sup => sup.id === req.supplierData.id ? req.supplierData : sup);
            } else {
              return [req.supplierData, ...current];
            }
          });
        } else if (req.type === 'Supplier Deletion' && req.targetSupplierId) {
          setSuppliers(current => current.filter(sup => sup.id !== req.targetSupplierId));
        }
        return { ...req, status: 'Approved' as const, remarks };
      }
      return req;
    }));
  };

  const handleDeclineEditRequest = (id: string, remarks?: string) => {
    setEditRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'Declined' as const, remarks } : req));
  };

  // Daily Closing Handlers
  const handleSaveClosing = (closing: DailyClosing) => {
    setDailyClosings(prev => {
      const exists = prev.some(c => c.id === closing.id);
      if (exists) {
        return prev.map(c => c.id === closing.id ? closing : c);
      }
      return [closing, ...prev];
    });
  };

  const handleApproveClosing = (id: string, status: 'Approved' | 'Rejected', adminRemarks: string, adminName: string) => {
    const targetClosing = dailyClosings.find(c => c.id === id);
    if (status === 'Approved' && targetClosing) {
      const closingDate = targetClosing.date;
      setAttendanceRecords(current => 
        current.map(record => {
          if (record.date === closingDate && record.checkInTime && (!record.checkOutTime || record.checkOutTime.trim() === '')) {
            const autoTime = record.status === 'Half Day' ? '01:00 PM' : '05:00 PM';
            return {
              ...record,
              checkOutTime: autoTime,
              remarks: record.remarks 
                ? `${record.remarks} (Auto checked-out upon Daily Closing approval)`
                : 'Auto checked-out upon Daily Closing approval'
            };
          }
          return record;
        })
      );
    }

    setDailyClosings(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status,
          adminRemarks,
          approvedBy: adminName
        };
      }
      return c;
    }));
  };

  const handleUnlockClosing = (id: string, reason: string, adminName: string) => {
    setDailyClosings(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          unlocked: true,
          unlockReason: reason,
          unlockedBy: adminName
        };
      }
      return c;
    }));
  };

  // Inventory Approval & Stock Management Handlers
  const handleAddInventoryRequest = (req: Omit<InventoryRequest, 'id' | 'status'>) => {
    const nextNo = generateInventoryNo(req.date, inventoryRequests, periodicClosings);
    const newReq: InventoryRequest = {
      ...req,
      id: nextNo,
      status: 'Pending'
    };
    setInventoryRequests(prev => [newReq, ...prev]);
  };

  const handleApproveInventoryRequest = (id: string) => {
    const req = inventoryRequests.find(r => r.id === id);
    if (!req) return;

    // 1. Update the request status
    setInventoryRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' as const } : r));

    // 2. Update the inventory stock count
    setInventoryStock(prevStock => {
      const updatedStock = [...prevStock];
      req.items.forEach(reqItem => {
        if (reqItem.notReceived) return; // Skip items marked as not received
        const existingIdx = updatedStock.findIndex(it => it.name.toLowerCase() === reqItem.name.toLowerCase() && it.supplierId === req.supplierId);
        if (existingIdx !== -1) {
          updatedStock[existingIdx] = {
            ...updatedStock[existingIdx],
            quantity: updatedStock[existingIdx].quantity + reqItem.quantity,
            costPrice: reqItem.costPrice,
            sellingPrice: reqItem.sellingPrice,
            lastReceivedDate: req.date
          };
        } else {
          updatedStock.push({
            id: `inv-stock-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: reqItem.name,
            quantity: reqItem.quantity,
            costPrice: reqItem.costPrice,
            sellingPrice: reqItem.sellingPrice,
            supplierId: req.supplierId,
            lastReceivedDate: req.date
          });
        }
      });
      return updatedStock;
    });

    // 3. Sync or insert into the Business Services Catalog (Only update rates for existing catalog services; custom items remain custom)
    setServices(prevServices => {
      const updatedServices = [...prevServices];
      
      req.items.forEach(reqItem => {
        if (reqItem.notReceived) return; // Skip items marked as not received
        const existingIdx = updatedServices.findIndex(s => s.name.toLowerCase() === reqItem.name.toLowerCase());
        if (existingIdx !== -1) {
          updatedServices[existingIdx] = {
            ...updatedServices[existingIdx],
            costPrice: reqItem.costPrice,
            priceRate: reqItem.sellingPrice,
            status: 'Active'
          };
        }
      });
      return updatedServices;
    });

    // 4. Update the corresponding Purchase Order status and set items as received
    setTransactions(prevTxs => prevTxs.map(tx => {
      if (tx.id === req.purchaseOrderId) {
        const updatedItems = (tx.items || []).map(item => {
          const reqItem = req.items.find(ri => ri.name.toLowerCase() === item.name.toLowerCase());
          if (reqItem && !reqItem.notReceived) {
            return {
              ...item,
              received: true,
              costPrice: reqItem.costPrice,
              sellingPrice: reqItem.sellingPrice
            };
          }
          return item;
        });

        const allReceived = updatedItems.every(it => it.received);

        // Calculate and update final payment balance on the transaction
        let finalStatus: 'Paid' | 'Partially Paid' | 'Pending' | 'Ordered' = 'Paid';
        const totalCost = req.items.reduce((acc, item) => acc + (item.notReceived ? 0 : item.quantity * item.costPrice), 0);
        const amountDue = Math.max(0, totalCost - tx.amountPaid);
        if (!allReceived) {
          finalStatus = 'Ordered';
        } else {
          if (amountDue === 0 && tx.amountPaid > 0) {
            finalStatus = 'Paid';
          } else if (tx.amountPaid === 0 && amountDue > 0) {
            finalStatus = 'Pending';
          } else {
            finalStatus = 'Partially Paid';
          }
        }

        return {
          ...tx,
          status: finalStatus as any,
          amountDue: amountDue,
          items: updatedItems
        };
      }
      return tx;
    }));

    // 5. Update supplier due balance with sum of cost price minus amount paid
    if (req.supplierId) {
      const totalCost = req.items.reduce((acc, item) => acc + (item.notReceived ? 0 : item.quantity * item.costPrice), 0);
      const netDueAdded = Math.max(0, totalCost - req.amountPaid);
      if (netDueAdded > 0) {
        setSuppliers(prevSup => prevSup.map(sup => sup.id === req.supplierId ? {
          ...sup,
          creditBalance: sup.creditBalance + netDueAdded
        } : sup));
      }
    }
  };

  const handleDeclineInventoryRequest = (id: string) => {
    setInventoryRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'Declined' as const } : req));
  };

  const handleDeleteStockItem = (id: string) => {
    setInventoryStock(prev => prev.filter(it => it.id !== id));
  };

  // Office Use Requisition Handlers
  const handleAddOfficeUseRequest = (req: Omit<OfficeUseRequest, 'id' | 'status'>) => {
    const newReq: OfficeUseRequest = {
      ...req,
      id: `off-req-${Date.now()}`,
      requestNo: `REQ-OFF-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Pending'
    };
    setOfficeUseRequests(prev => [newReq, ...prev]);
  };

  const handleApproveOfficeUseRequest = (id: string) => {
    const req = officeUseRequests.find(r => r.id === id);
    if (!req) return;

    const item = inventoryStock.find(i => i.id === req.itemId || i.name.toLowerCase() === req.itemName.toLowerCase());
    if (!item) {
      alert(`Stock item "${req.itemName}" not found in inventory.`);
      return;
    }

    if (item.quantity < req.quantity) {
      alert(`Insufficient stock for "${req.itemName}". Current stock: ${item.quantity} units, Requested: ${req.quantity} units.`);
      return;
    }

    const unitCost = item.costPrice || 0;
    const totalCost = unitCost * req.quantity;

    // 1. Deduct quantity from inventory stock (does NOT decrease any financial account)
    setInventoryStock(prev => prev.map(it => {
      if (it.id === item.id) {
        return { ...it, quantity: Math.max(0, it.quantity - req.quantity) };
      }
      return it;
    }));

    // 2. Update request status
    setOfficeUseRequests(prev => prev.map(r => r.id === id ? {
      ...r,
      status: 'Approved' as const,
      totalCost,
      approvedBy: currentUser.name,
      approvalDate: getCurrentBsDate()
    } : r));
  };

  const handleRejectOfficeUseRequest = (id: string) => {
    setOfficeUseRequests(prev => prev.map(r => r.id === id ? {
      ...r,
      status: 'Rejected' as const,
      approvedBy: currentUser.name,
      approvalDate: getCurrentBsDate()
    } : r));
  };

  // Database backups configuration - Full System Restore
  const handleImportDatabase = (imported: any) => {
    if (imported) {
      loadConsolidatedDatabase(imported);
      saveToSQLite(imported);
      showToast("✨ Full system database restored successfully! All company data, opening cash, and user accounts updated.", "success");
    }
  };

  const handleConfirmUserSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUserToSwitch) return;
    
    const user = users.find(u => u.id === pendingUserToSwitch.id);
    const correctPassword = user?.password || (user?.role === 'Admin' ? 'adminpassword' : 'staffpassword');
    
    if (enteredPassword === correctPassword) {
      setCurrentUser(pendingUserToSwitch);
      setPendingUserToSwitch(null);
      setEnteredPassword('');
      setAuthError('');
    } else {
      setAuthError('Incorrect password. Please try again.');
    }
  };

  const handleResetDatabase = () => {
    setProfile(INITIAL_PROFILE);
    setServices(INITIAL_SERVICES);
    setSuppliers(INITIAL_SUPPLIERS);
    setTransactions(INITIAL_TRANSACTIONS);
    setInvoices(INITIAL_INVOICES);
    setActiveTab('dashboard');
  };

  const handleResetDateRange = (fromDate: string, toDate: string): { totalWiped: number; summary: string } => {
    if (!fromDate || !toDate) {
      throw new Error("Both Start Date and End Date are required.");
    }
    const minDate = normalizeStandardBsDate(fromDate <= toDate ? fromDate : toDate);
    const maxDate = normalizeStandardBsDate(fromDate <= toDate ? toDate : fromDate);

    const isWithinRange = (d?: string) => {
      return isDateWithinRange(d, minDate, maxDate);
    };

    const filteredInvoices = invoices.filter(item => !isWithinRange(item.date));
    const countInvoices = invoices.length - filteredInvoices.length;
    setInvoices(filteredInvoices);

    const filteredTransactions = transactions.filter(item => !isWithinRange(item.date));
    const countTx = transactions.length - filteredTransactions.length;
    setTransactions(filteredTransactions);

    const filteredExpenses = expenses.filter(item => !isWithinRange(item.date));
    const countExp = expenses.length - filteredExpenses.length;
    setExpenses(filteredExpenses);

    const filteredDailyClosings = dailyClosings.filter(item => !isWithinRange(item.date));
    const countClosings = dailyClosings.length - filteredDailyClosings.length;
    setDailyClosings(filteredDailyClosings);

    const filteredPeriodicClosings = periodicClosings.filter(item => 
      !(isWithinRange(item.fromDate) || isWithinRange(item.toDate) || isWithinRange((item as any).closingDate))
    );
    const countPeriodic = periodicClosings.length - filteredPeriodicClosings.length;
    setPeriodicClosings(filteredPeriodicClosings);

    const filteredAccountTransfers = accountTransfers.filter(item => !isWithinRange(item.date));
    const countTransfers = accountTransfers.length - filteredAccountTransfers.length;
    setAccountTransfers(filteredAccountTransfers);

    const filteredSalaryDistributions = salaryDistributions.filter(item => 
      !(isWithinRange((item as any).distributionDate) || isWithinRange((item as any).date))
    );
    const countSalaries = salaryDistributions.length - filteredSalaryDistributions.length;
    setSalaryDistributions(filteredSalaryDistributions);

    const filteredAttendanceRecords = attendanceRecords.filter(item => !isWithinRange(item.date));
    const countAttendance = attendanceRecords.length - filteredAttendanceRecords.length;
    setAttendanceRecords(filteredAttendanceRecords);

    const filteredAttendanceRequests = attendanceRequests.filter(item => !isWithinRange(item.date));
    const countAttReq = attendanceRequests.length - filteredAttendanceRequests.length;
    setAttendanceRequests(filteredAttendanceRequests);

    const filteredLeaveRequests = leaveRequests.filter(item => 
      !(isWithinRange(item.startDate) || isWithinRange(item.endDate) || isWithinRange((item as any).date))
    );
    const countLeaves = leaveRequests.length - filteredLeaveRequests.length;
    setLeaveRequests(filteredLeaveRequests);

    const filteredMeetingNotes = meetingNotes.filter(item => !isWithinRange(item.meetingDate));
    const countMeetings = meetingNotes.length - filteredMeetingNotes.length;
    setMeetingNotes(filteredMeetingNotes);
    localStorage.setItem('reliabletech_meeting_notes', JSON.stringify(filteredMeetingNotes));

    const filteredServiceRequests = serviceRequests.filter(item => 
      !(isWithinRange(item.dateCreated) || isWithinRange((item as any).date))
    );
    const countServiceReq = serviceRequests.length - filteredServiceRequests.length;
    setServiceRequests(filteredServiceRequests);

    const filteredOfficeUseRequests = officeUseRequests.filter(item => 
      !(isWithinRange(item.dateCreated) || isWithinRange((item as any).date))
    );
    const countOfficeUse = officeUseRequests.length - filteredOfficeUseRequests.length;
    setOfficeUseRequests(filteredOfficeUseRequests);

    const filteredEcommerceOrders = ecommerceOrders.filter(item => 
      !(isWithinRange(item.orderDate) || isWithinRange((item as any).date) || isWithinRange((item as any).createdAt))
    );
    const countOrders = ecommerceOrders.length - filteredEcommerceOrders.length;
    setEcommerceOrders(filteredEcommerceOrders);
    localStorage.setItem('reliabletech_ecommerce_orders', JSON.stringify(filteredEcommerceOrders));

    const filteredCustomerInquiries = customerInquiries.filter(item => 
      !(isWithinRange((item as any).created_at) || isWithinRange((item as any).date))
    );
    const countInquiries = customerInquiries.length - filteredCustomerInquiries.length;
    setCustomerInquiries(filteredCustomerInquiries);
    localStorage.setItem('reliabletech_customer_inquiries', JSON.stringify(filteredCustomerInquiries));

    const filteredInventoryRequests = inventoryRequests.filter(item => !isWithinRange((item as any).date));
    const countInventoryReq = inventoryRequests.length - filteredInventoryRequests.length;
    setInventoryRequests(filteredInventoryRequests);

    const filteredEditRequests = editRequests.filter(item => !isWithinRange(item.date));
    const countEditReq = editRequests.length - filteredEditRequests.length;
    setEditRequests(filteredEditRequests);

    const filteredSupplierPayments = supplierPayments.filter(item => !isWithinRange(item.date));
    const countSupplierPay = supplierPayments.length - filteredSupplierPayments.length;
    setSupplierPayments(filteredSupplierPayments);

    const filteredLetters = letters.filter(item => !isWithinRange(item.date));
    const countLetters = letters.length - filteredLetters.length;
    setLetters(filteredLetters);

    const totalWiped = countInvoices + countTx + countExp + countClosings + countPeriodic + 
                       countTransfers + countSalaries + countAttendance + countAttReq + countLeaves + 
                       countMeetings + countServiceReq + countOfficeUse + countOrders + countInquiries + 
                       countInventoryReq + countEditReq + countSupplierPay + countLetters;

    const summaryParts: string[] = [];
    if (countInvoices > 0) summaryParts.push(`${countInvoices} invoices`);
    if (countTx > 0) summaryParts.push(`${countTx} purchase tx`);
    if (countExp > 0) summaryParts.push(`${countExp} expenses`);
    if (countClosings > 0) summaryParts.push(`${countClosings} daily closings`);
    if (countPeriodic > 0) summaryParts.push(`${countPeriodic} periodic closings`);
    if (countTransfers > 0) summaryParts.push(`${countTransfers} transfers`);
    if (countSalaries > 0) summaryParts.push(`${countSalaries} salary slips`);
    if (countMeetings > 0) summaryParts.push(`${countMeetings} meeting notes`);
    if (countOrders > 0) summaryParts.push(`${countOrders} orders`);
    if (countInventoryReq > 0) summaryParts.push(`${countInventoryReq} inventory req`);
    if (countEditReq > 0) summaryParts.push(`${countEditReq} staff requests`);
    if (countAttendance > 0) summaryParts.push(`${countAttendance} attendance`);

    const summary = summaryParts.length > 0 ? summaryParts.join(', ') : 'No matched entries';

    // Immediately persist directly to SQLite database rtssdatabase.db
    const consolidatedPayload = {
      profile,
      services,
      suppliers,
      supplierPayments: filteredSupplierPayments,
      transactions: filteredTransactions,
      invoices: filteredInvoices,
      users,
      units,
      editRequests: filteredEditRequests,
      inventoryStock,
      inventoryRequests: filteredInventoryRequests,
      officeUseRequests: filteredOfficeUseRequests,
      pendingRequests: filteredOfficeUseRequests,
      serviceRequests: filteredServiceRequests,
      expenses: filteredExpenses,
      dailyClosings: filteredDailyClosings,
      periodicClosings: filteredPeriodicClosings,
      letters: filteredLetters,
      attendanceRecords: filteredAttendanceRecords,
      leaveRequests: filteredLeaveRequests,
      salaryDistributions: filteredSalaryDistributions,
      attendanceRequests: filteredAttendanceRequests,
      openingBalances,
      accountTransfers: filteredAccountTransfers,
      assets,
      meetingNotes: filteredMeetingNotes,
      shareholders,
      ecommerceProducts,
      customerAccounts,
      ecommerceOrders: filteredEcommerceOrders,
      ecommerceServiceTickets
    };
    saveToSQLite(consolidatedPayload);

    showToast(`मिति ${minDate} देखि ${maxDate} सम्मका ${totalWiped} रेकर्डहरू पूर्ण रूपमा मेटाइयो। (${summary})`, 'success');

    return { totalWiped, summary };
  };

  const connectDatabase = async () => {
    if (window.self !== window.top) {
      showToast("⚠️ File system access is not available in the preview. Please open the application in a new tab to use file database operations.", "error");
      return;
    }
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'Reliabletech Database (rtssdatabase.json)',
            accept: {
              'application/json': ['.json']
            }
          }
        ],
        multiple: false
      });
      
      const hasPermission = await verifyPermission(handle, true);
      if (!hasPermission) {
        showToast("⚠️ Write permission is required for automatic database updates.", "warning");
        return;
      }

      const file = await handle.getFile();
      const text = await file.text();
      const parsed = JSON.parse(text);

      loadConsolidatedDatabase(parsed);
      
      fileHandleRef.current = handle;
      await setStoredHandle(handle);
      
      setSimulatedPath(handle.name);
      setDbFileMounted(true);
      showToast(`✨ Connected successfully to database file: ${handle.name}`, 'success');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Error connecting file:", err);
        showToast(`❌ Error connecting file: ${err.message || 'unknown error'}`, 'error');
      }
    }
  };

  const authorizeStoredDatabase = async () => {
    if (!fileHandleRef.current) return;
    try {
      const handle = fileHandleRef.current;
      const hasPermission = await verifyPermission(handle, true);
      if (hasPermission) {
        const file = await handle.getFile();
        const text = await file.text();
        const parsed = JSON.parse(text);

        loadConsolidatedDatabase(parsed);
        setSimulatedPath(handle.name);
        setDbFileMounted(true);
        showToast(`✨ Database connection restored: ${handle.name}`, 'success');
      } else {
        showToast("⚠️ Permission denied. Please grant access permission or manually select a file.", "warning");
      }
    } catch (err: any) {
      console.error("Error authorizing stored file:", err);
      showToast(`❌ Failed to authorize database file: ${err.message || 'unknown error'}`, 'error');
    }
  };

  const initializeNewDatabase = async () => {
    try {
      const initialSeed = {
        profile,
        services,
        suppliers,
        transactions,
        invoices,
        users,
        units,
        editRequests,
        inventoryStock,
        inventoryRequests,
        serviceRequests,
        expenses,
        dailyClosings,
        letters,
        attendanceRecords: [],
        leaveRequests: [],
        salaryDistributions: [],
        attendanceRequests: []
      };

      let handle: any;
      if (typeof window !== 'undefined' && 'showSaveFilePicker' in window && window.self === window.top) {
        handle = await (window as any).showSaveFilePicker({
          suggestedName: 'rtssdatabase.json',
          types: [
            {
              description: 'Reliabletech Database (rtssdatabase.json)',
              accept: {
                'application/json': ['.json']
              }
            }
          ]
        });
      } else {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(initialSeed, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href",     dataStr);
        downloadAnchor.setAttribute("download", "rtssdatabase.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast("✨ Generated and downloaded rtssdatabase.json! Save it, then click 'Connect Database' to select it.", 'info');
        return;
      }

      if (handle) {
        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(initialSeed, null, 2));
        await writable.close();

        fileHandleRef.current = handle;
        await setStoredHandle(handle);
        loadConsolidatedDatabase(initialSeed);
        setSimulatedPath(handle.name);
        setDbFileMounted(true);
        showToast("✨ Successfully initialized and connected to new rtssdatabase.json!", "success");
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Failed to initialize new database file:", err);
        showToast(`❌ Initialization failed: ${err.message || 'unknown error'}`, 'error');
      }
    }
  };

  // E-Commerce Management Handlers
  const handleAddEcommerceProduct = (product: EcommerceProduct) => {
    setEcommerceProducts(prev => [product, ...prev]);
    showToast(`Product "${product.product_name}" added to catalog.`, 'success');
  };

  const handleEditEcommerceProduct = (product: EcommerceProduct) => {
    setEcommerceProducts(prev => prev.map(p => p.product_id === product.product_id ? product : p));
    showToast(`Product "${product.product_name}" updated.`, 'success');
  };

  const handleDeleteEcommerceProduct = (productId: string) => {
    setEcommerceProducts(prev => prev.filter(p => p.product_id !== productId));
    showToast(`Product removed from catalog.`, 'info');
  };

  const handleUpdateEcommerceOrderStatus = (
    orderId: string, 
    state: OrderLifecycleState, 
    courier?: string, 
    tracking?: string, 
    verifiedBy?: string
  ) => {
    setEcommerceOrders(prev => prev.map(order => {
      if (order.order_id === orderId) {
        return {
          ...order,
          order_state: state,
          assigned_courier: courier !== undefined ? courier : order.assigned_courier,
          gateway_ref_token: tracking !== undefined ? tracking : order.gateway_ref_token,
          verified_by: verifiedBy !== undefined ? verifiedBy : order.verified_by
        };
      }
      return order;
    }));
    showToast(`Order #${orderId} status updated to: ${state}`, 'success');
  };

  const handleUpdateEcommerceServiceTicket = (ticket: EcommerceServiceTicket) => {
    setEcommerceServiceTickets(prev => {
      const exists = prev.some(t => t.ticket_id === ticket.ticket_id);
      if (exists) {
        return prev.map(t => t.ticket_id === ticket.ticket_id ? ticket : t);
      }
      return [ticket, ...prev];
    });
    showToast(`Service ticket #${ticket.ticket_id} updated.`, 'success');
  };

  const handleAddHardwareType = (hw: HardwareTypeOption) => {
    setHardwareTypes(prev => [...prev, hw]);
    showToast(`Added hardware option "${hw.name}".`, 'success');
  };

  const handleEditHardwareType = (hw: HardwareTypeOption) => {
    setHardwareTypes(prev => prev.map(item => item.id === hw.id ? hw : item));
    showToast(`Updated hardware option "${hw.name}".`, 'success');
  };

  const handleDeleteHardwareType = (id: string) => {
    setHardwareTypes(prev => prev.filter(item => item.id !== id));
    showToast('Hardware option removed.', 'info');
  };

  const handleConvertEcommerceOrderToInvoice = (
    order: EcommerceOrder,
    settlementMethod?: 'Cash' | 'Esewa' | 'Sahakari' | 'RBB' | 'Due' | 'Split'
  ) => {
    const newInvoiceNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`;
    const invoiceItems = order.items.map(item => ({
      serviceId: item.product_id,
      quantity: item.quantity,
      unitPrice: item.unit_price_npr,
      customName: item.product_name
    }));

    let paymentMethodMapped: 'Cash' | 'Esewa' | 'Sahakari' | 'RBB' | 'Due' | 'Split' = settlementMethod || 'Cash';
    if (!settlementMethod) {
      if (order.payment_method === 'ESEWA') paymentMethodMapped = 'Esewa';
      else if (order.payment_method === 'RBB_TRANSFER') paymentMethodMapped = 'RBB';
      else if (order.payment_method === 'COOP_QR') paymentMethodMapped = 'Sahakari';
      else if (order.payment_method === 'INSTITUTIONAL_CREDIT') paymentMethodMapped = 'Due';
      else paymentMethodMapped = 'Cash';
    }

    const isCredit = paymentMethodMapped === 'Due';
    const newInvoice: SalesInvoice = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      invoiceNumber: newInvoiceNumber,
      date: getCurrentBsDate(),
      customerName: order.organization_name || order.customer_name,
      customerPhone: order.customer_phone,
      customerAddress: `${order.municipality}, ${order.ward}, ${order.delivery_address}`,
      items: invoiceItems,
      totalAmount: order.subtotal_npr,
      discountAmount: order.discount_npr || 0,
      finalAmount: order.total_amount_npr,
      paidAmount: isCredit ? 0 : order.total_amount_npr,
      dueAmount: isCredit ? order.total_amount_npr : 0,
      status: isCredit ? 'Unpaid' : 'Paid',
      paymentMethod: paymentMethodMapped,
      remarks: `Generated from Online Storefront Order #${order.order_id} (${order.assigned_courier || 'Delivery'}). ${order.order_notes || ''}`
    };

    setInvoices(prev => [newInvoice, ...prev]);
    handleUpdateEcommerceOrderStatus(order.order_id, 'Delivered & Closed', order.assigned_courier, order.gateway_ref_token, currentUser?.username || 'Staff');
    showToast(`Order #${order.order_id} delivered! Invoice #${newInvoiceNumber} recorded into ${paymentMethodMapped} account ledger.`, 'success');
  };

  const handleCancelEcommerceOrderWithReverseVoucher = (
    order: EcommerceOrder,
    remarks: string,
    refundMethod: string,
    shouldRestock: boolean
  ) => {
    const reverseVoucherNo = `REV-VCH-${new Date().getFullYear()}-${String(order.order_id).replace(/\D/g, '').slice(-4) || '001'}`;
    const cancelDate = getCurrentBsDate();

    // 1. Update Ecommerce Order status and reverse voucher data
    setEcommerceOrders(prev => prev.map(o => {
      if (o.order_id === order.order_id) {
        return {
          ...o,
          order_state: 'Cancelled' as OrderLifecycleState,
          cancellation_reason: remarks,
          cancelled_by: currentUser.name || 'Admin',
          cancelled_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
          refund_status: 'Refunded',
          refund_amount: o.total_amount_npr,
          refund_method: refundMethod,
          reverse_voucher_number: reverseVoucherNo,
          reverse_voucher_date: cancelDate
        };
      }
      return o;
    }));

    // 2. Restock products if requested
    if (shouldRestock && order.items?.length) {
      setEcommerceProducts(prev => prev.map(p => {
        const item = order.items.find(i => i.product_id === p.product_id);
        if (item) {
          return { ...p, stock_count: p.stock_count + item.quantity };
        }
        return p;
      }));
    }

    // 3. Check for linked invoice synchronously to avoid race conditions or double deductions
    const linkedInvoice = invoices.find(inv => 
      inv.remarks?.includes(`Order #${order.order_id}`) || 
      inv.remarks?.includes(order.order_id) ||
      (inv.customerName === (order.organization_name || order.customer_name) && Math.abs(inv.finalAmount - order.total_amount_npr) < 0.01)
    );

    const isCreditReversal = 
      refundMethod === 'Institutional Credit Reversal' || 
      order.payment_method === 'INSTITUTIONAL_CREDIT' ||
      (linkedInvoice && linkedInvoice.paidAmount === 0);

    // Reconcile Sales Invoices & Customer Due (Safeguard against double deduction)
    setInvoices(prev => prev.map(inv => {
      const isLinked = 
        inv.id === linkedInvoice?.id ||
        inv.remarks?.includes(`Order #${order.order_id}`) || 
        inv.remarks?.includes(order.order_id) ||
        (inv.customerName === (order.organization_name || order.customer_name) && Math.abs(inv.finalAmount - order.total_amount_npr) < 0.01);

      if (isLinked) {
        return {
          ...inv,
          status: 'Cancelled' as const,
          dueAmount: 0, // Clears customer due immediately
          remarks: `${inv.remarks || ''} [CANCELLED & REVERSED via Reverse Voucher #${reverseVoucherNo} on ${cancelDate}. Customer: ${order.customer_name}. Reason: ${remarks}. Due cleared.]`
        };
      }
      return inv;
    }));

    // 4. Financial Balancing: Only deduct cash/bank outflow IF real money was collected & is being refunded
    if (!isCreditReversal) {
      const mappedPaymentMethod: 'Cash' | 'Esewa' | 'Sahakari' | 'RBB' = 
        refundMethod === 'eSewa' ? 'Esewa' : 
        refundMethod === 'RBB' ? 'RBB' : 
        refundMethod === 'Sahakari' ? 'Sahakari' : 'Cash';

      const newExpenseNo = `EXP-REV-${Date.now().toString().slice(-6)}`;
      const newRefundExpense: Expense = {
        id: `EXP-REV-${Date.now()}`,
        expenseNo: newExpenseNo,
        category: 'Sales Return / Refund',
        title: `Sales Reversal: ${order.customer_name}`,
        topic: `Reverse Voucher #${reverseVoucherNo}`,
        amount: order.total_amount_npr,
        paymentMethod: mappedPaymentMethod,
        date: cancelDate,
        remarks: `Sales Reversal & Customer Refund for Order #${order.order_id}. Reverse Voucher No: ${reverseVoucherNo}. Customer: ${order.customer_name}. Reason: ${remarks}. Refund Settled via ${refundMethod}. Amount: NPR ${order.total_amount_npr}.`,
        status: 'Approved',
        createdBy: currentUser?.name || 'Admin',
        approvedBy: currentUser?.name || 'Admin',
        referenceId: reverseVoucherNo
      };

      setExpenses(prev => {
        // Prevent duplicate expense injection if one with this reverse voucher reference already exists
        if (prev.some(e => e.referenceId === reverseVoucherNo || e.topic?.includes(reverseVoucherNo))) {
          return prev;
        }
        return [newRefundExpense, ...prev];
      });
    }

    showToast(
      `Reverse Voucher #${reverseVoucherNo} issued! Order #${order.order_id} reversed.${isCreditReversal ? ` Customer credit due cleared.` : ` NPR ${order.total_amount_npr.toLocaleString()} refunded via ${refundMethod}.`} Reason: ${remarks}`,
      'success'
    );
  };

  const handleDeleteEcommerceOrder = (orderId: string) => {
    setEcommerceOrders(prev => prev.filter(o => o.order_id !== orderId));
    showToast(`Order #${orderId} permanently deleted.`, 'info');
  };

  const handleDeleteEcommerceServiceTicket = (ticketId: string) => {
    setEcommerceServiceTickets(prev => prev.filter(t => t.ticket_id !== ticketId));
    showToast(`Service ticket #${ticketId} permanently deleted.`, 'info');
  };

  const handleDeleteCustomerInquiry = (inquiryId: string) => {
    setCustomerInquiries(prev => prev.filter(inq => (inq.inquiry_id || inq.id) !== inquiryId));
    showToast(`Customer inquiry permanently deleted.`, 'info');
  };

  const handleUpdateCustomerAccount = (customer: CustomerAccount) => {
    setCustomerAccounts(prev => prev.map(c => c.customer_id === customer.customer_id ? customer : c));
    if (currentCustomer && currentCustomer.customer_id === customer.customer_id) {
      setCurrentCustomer(customer);
    }
  };

  const handleDeleteCustomerAccount = (customerId: string) => {
    setCustomerAccounts(prev => prev.filter(c => c.customer_id !== customerId));
    if (currentCustomer && currentCustomer.customer_id === customerId) {
      setCurrentCustomer(null);
    }
  };

  const handleResetCustomerPassword = (customerId: string, newPass: string) => {
    setCustomerAccounts(prev => prev.map(c => c.customer_id === customerId ? { ...c, password: newPass } : c));
    if (currentCustomer && currentCustomer.customer_id === customerId) {
      setCurrentCustomer(prev => prev ? { ...prev, password: newPass } : null);
    }
  };

  if (dbBootSearching) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center relative overflow-hidden font-sans" id="rtss-boot-loader">
        {/* Ambient Glowing Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative flex flex-col items-center justify-center space-y-8 z-10">
          {/* Centered Rotating Ring & Branding Block */}
          <div className="relative flex items-center justify-center w-48 h-48">
            {/* Spinning Circle Outer */}
            <div className="absolute inset-0 rounded-full border-[3px] border-indigo-500/10 border-t-indigo-500 border-r-indigo-500/40 animate-spin" />
            
            {/* Slow Spinning Circle Inner (counter-clockwise) */}
            <div className="absolute inset-4 rounded-full border border-emerald-500/5 border-b-emerald-500/40 border-l-emerald-500/20 animate-[spin_3s_linear_infinite_reverse]" />
            
            {/* Inner Static Branding Accent */}
            <div className="absolute inset-8 bg-slate-900/60 rounded-full border border-slate-800/80 shadow-inner flex items-center justify-center backdrop-blur-xs">
              <div className="flex flex-col items-center justify-center select-none">
                <span className="text-4xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400 font-display drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  RTSS
                </span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                  Enterprise
                </span>
              </div>
            </div>
          </div>

          {/* Subtitle / Status Display */}
          <div className="text-center space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-400/80 font-mono animate-pulse">
              System Initializing
            </h3>
            <p className="text-[11px] text-slate-500 font-mono max-w-xs mx-auto leading-relaxed">
              Mounting local ledger systems &amp; loading ledger assets...
            </p>
          </div>

          {/* Minimal Loader Bar */}
          <div className="w-40 h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800/60 relative">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full absolute left-0 top-0 animate-pulse" style={{ width: '100%', animation: 'loading-bar 2s ease-in-out infinite' }} />
          </div>
        </div>

        {/* Custom Loading Animation Style */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}} />
      </div>
    );
  }

  // PUBLIC ONLINE STOREFRONT (Entry Screen for Customers & Visitors)
  if (!isAuthenticated) {
    if (showStaffLoginScreen) {
      return (
        <Login 
          users={users} 
          profile={profile} 
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsAuthenticated(true);
            setShowStaffLoginScreen(false);
            sessionStorage.setItem('reliabletech_is_authenticated', 'true');
            localStorage.setItem('reliabletech_current_user', JSON.stringify(user));
          }} 
          onBackToStorefront={() => setShowStaffLoginScreen(false)}
          onResetStaffPassword={(userId, newPass) => {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPass } : u));
            showToast('Staff password updated successfully!', 'success');
          }}
        />
      );
    }

    return (
      <OnlineStorefront
        products={ecommerceProducts}
        customerAccounts={customerAccounts}
        orders={ecommerceOrders}
        serviceTickets={ecommerceServiceTickets}
        hardwareTypes={hardwareTypes}
        users={users}
        profile={profile}
        activeCustomer={currentCustomer}
        inquiries={customerInquiries}
        onSendMessage={handleSendCustomerMessage}
        onSendReply={handleSendInquiryReply}
        onCustomerLogin={(cust) => {
          setCurrentCustomer(cust);
          localStorage.setItem('reliabletech_current_customer', JSON.stringify(cust));
          showToast(`Welcome back, ${cust.name}!`, 'success');
        }}
        onCustomerLogout={() => {
          setCurrentCustomer(null);
          localStorage.removeItem('reliabletech_current_customer');
          showToast('You have been logged out.', 'info');
        }}
        onCustomerRegister={(newCust) => {
          setCustomerAccounts(prev => [newCust, ...prev]);
          setCurrentCustomer(newCust);
          localStorage.setItem('reliabletech_current_customer', JSON.stringify(newCust));
          showToast(`Account registered successfully! Welcome, ${newCust.name}.`, 'success');
        }}
        onResetCustomerPassword={(customerId, newPass) => {
          setCustomerAccounts(prev => prev.map(c => c.customer_id === customerId ? { ...c, password: newPass } : c));
          showToast('Password updated successfully! You can now log in with your new password.', 'success');
        }}
        onCreateOrder={(order) => {
          setEcommerceOrders(prev => [order, ...prev]);
          setEcommerceProducts(prev => prev.map(prod => {
            const item = order.items.find(i => i.product_id === prod.product_id);
            if (item) {
              return { ...prod, stock_count: Math.max(0, prod.stock_count - item.quantity) };
            }
            return prod;
          }));
          showToast(`Order #${order.order_id} placed successfully! RTSS Team will verify shortly.`, 'success');
        }}
        onCreateServiceTicket={(ticket) => {
          setEcommerceServiceTickets(prev => [ticket, ...prev]);
          showToast(`Service ticket #${ticket.ticket_id} booked successfully!`, 'success');
        }}
        onOpenStaffLogin={() => setShowStaffLoginScreen(true)}
        onToast={showToast}
      />
    );
  }

  const isDateLocked = (dateStr: string) => {
    return checkDateLock(dateStr, dailyClosings, periodicClosings).locked;
  };

  // Calculate pending meeting count for badge indicator
  const pendingMeetingCount = (currentUser.role === 'Admin' || currentUser.role === 'Super Admin')
    ? meetingNotes.filter(m => m.status === 'Pending').length
    : meetingNotes.filter(m => 
        m.status === 'Scheduled' && 
        m.participants?.includes(currentUser.username) && 
        !m.participantApprovals?.includes(currentUser.username)
      ).length;

  // Top-Level Main Navigation Categories & Subtabs Structure
  const pendingOrdersCount = ecommerceOrders.filter(o => o.order_state === 'Pending Verification' || o.order_state === 'Processing/Packing').length;
  const pendingTicketsCount = ecommerceServiceTickets.filter(t => t.ticket_state === 'Submitted / Pending' || t.ticket_state === 'In Progress').length;
  const ecommerceTotalBadge = pendingOrdersCount + pendingTicketsCount;

  const topNavStructure = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      elementId: 'tab-dashboard',
      badge: 0,
      hasSubtabs: false,
    },
    {
      id: 'ecommerce',
      label: 'E-Commerce',
      icon: ShoppingBag,
      elementId: 'tab-ecommerce',
      badge: ecommerceTotalBadge,
      hasSubtabs: false,
    },
    {
      id: 'front_desk',
      label: 'Front Desk & Sales',
      icon: Rocket,
      badge: 0,
      hasSubtabs: true,
      subtabs: [
        { id: 'sales', label: 'Sales & Billing', icon: Receipt, elementId: 'tab-sales-billing', description: 'Create sales invoices, print receipts, and manage customer credit' },
        { id: 'services', label: 'Service Job Requests', icon: Wrench, elementId: 'tab-service-requests', description: 'Customer device repairs, job cards, service status, and rate card' },
        { id: 'customers', label: 'Customers Data', icon: User, elementId: 'tab-customers-data', description: 'Customer profiles, contact numbers, address, and billing history' },
      ]
    },
    {
      id: 'accounting',
      label: 'Accounting & Records',
      icon: TrendingUp,
      badge: 0,
      hasSubtabs: true,
      subtabs: [
        { id: 'reports', label: 'Reports & Ledger', icon: BarChart3, elementId: 'tab-reports', description: 'Financial reports, P&L, multi-account ledger, and audit history' },
        { id: 'daily_closing', label: 'Daily Closing & Audit', icon: CalendarRange, elementId: 'tab-daily-closing', description: 'Daily cash reconciliation, vault deposits, and day-end approvals' },
        { id: 'transactions', label: 'Purchase Ledger', icon: ShoppingCart, elementId: 'tab-purchase-ledger', description: 'Procurement orders, vendor bills, and stock intake accounting' },
        { id: 'expenses', label: 'Expenses Ledger', icon: TrendingDown, elementId: 'tab-expenses', description: 'Operational expense entry, expense approvals, and category tracking' },
      ]
    },
    {
      id: 'inventory_group',
      label: 'Inventory & Assets',
      icon: Package,
      badge: 0,
      hasSubtabs: true,
      subtabs: [
        { id: 'inventory', label: 'Inventory Stock', icon: Package, elementId: 'tab-inventory-stock', description: 'Stock levels, reorder alerts, parts issuing, and inventory audit' },
        { id: 'assets_management', label: 'Assets Management', icon: Monitor, elementId: 'tab-assets-management', description: 'Fixed equipment, asset codes, serial numbers, and maintenance' },
        { id: 'suppliers', label: 'Suppliers Registry', icon: Truck, elementId: 'tab-suppliers-registry', description: 'Vendor directory, credit balance tracking, and payment history' },
      ]
    },
    {
      id: 'hr_staff',
      label: 'Staff & HR',
      icon: Users,
      badge: attendanceRequests.filter(r => r.status === 'Pending').length + leaveRequests.filter(l => l.status === 'Pending').length,
      hasSubtabs: true,
      subtabs: [
        { id: 'staff_attendance', label: 'Staff Attendance & Payroll', icon: UserCheck, elementId: 'tab-staff-attendance', description: 'Daily clock-in/out, leave logs, monthly payroll, and salary payouts' },
        { id: 'staff_requests', label: 'Staff Requests', icon: Mail, elementId: 'tab-staff-requests', badge: attendanceRequests.filter(r => r.status === 'Pending').length + leaveRequests.filter(l => l.status === 'Pending').length, description: 'Attendance corrections, leave applications, and edit approvals' },
      ]
    },
    {
      id: 'email_inbox',
      label: 'Gmail App',
      icon: Mail,
      badge: unreadEmailCount,
      elementId: 'tab-email-inbox',
      description: 'Gmail Webmail App: dual accounts, view/compose emails, upload files, attach invoices & reports'
    },
    {
      id: 'office_group',
      label: 'Office & Setup',
      icon: Settings,
      badge: pendingMeetingCount,
      hasSubtabs: true,
      subtabs: [
        { id: 'letters', label: 'Official Letters', icon: FileText, elementId: 'tab-official-letters', description: 'Dispatch & receiving letters, official letterhead printer' },
        { id: 'meeting_mynotes', label: 'Meeting & My Notes', icon: BookOpen, elementId: 'tab-meeting-mynotes', badge: pendingMeetingCount, description: 'Board meetings, agendas, staff memos, and quick note scratchpad' },
        { id: 'settings', label: 'Settings & System Setup', icon: Settings, elementId: 'tab-settings', description: 'System setup, user permissions, database file mount, and account opening balances' },
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200 antialiased font-sans bg-slate-50/70 text-[#1A1D20]">
      
      {/* Top Header Navigation Bar - Sky Blue Light Theme */}
      <header className="sticky top-0 z-40 w-full border-b border-sky-200/80 bg-gradient-to-r from-sky-100 via-sky-50 to-blue-100 text-sky-950 shadow-xs backdrop-blur-md">
        <div className="w-full px-4 sm:px-6 py-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 min-h-[48px]">
            {/* Logo / Identity */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="p-2 rounded-xl text-white shadow-xs bg-sky-600">
                <Wrench size={18} />
              </div>
              <div>
                <span className="font-black font-display tracking-tight text-base sm:text-lg text-sky-950">Reliabletech</span>
                <div className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-sky-700">
                  <MapPin size={9} />
                  <span>Fikkal, Ilam</span>
                </div>
              </div>
            </div>

            {/* Middle: Live Nepali Date, Time & Today's Special Day (Hamro Patro / Nepali Patro) */}
            <div className="flex-1 flex justify-center w-full sm:w-auto my-0.5 sm:my-0">
              <NepaliClockWidget />
            </div>

            {/* Right: Active User Session */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Dynamic System Notification Bell */}
              <NotificationBell
                currentUser={currentUser}
                editRequests={editRequests}
                expenses={expenses}
                leaveRequests={leaveRequests}
                attendanceRequests={attendanceRequests}
                inventoryRequests={inventoryRequests}
                dailyClosings={dailyClosings}
                meetingNotes={meetingNotes}
                users={users}
                ecommerceOrders={ecommerceOrders}
                ecommerceServiceTickets={ecommerceServiceTickets}
                customerInquiries={customerInquiries}
                onNavigate={(tabId) => setActiveTab(tabId)}
              />

              {currentUser?.profilePhoto && (
                <div className={`w-7 h-9 rounded-lg overflow-hidden border-2 ${currentUser.photoApproved === false ? 'border-amber-400 ring-2 ring-amber-300/50' : 'border-sky-400'} shadow-2xs shrink-0 hidden sm:block relative`} title={currentUser.photoApproved === false ? "Photo Pending Approval by @reliableadmin" : currentUser.name}>
                  <img src={currentUser.profilePhoto} alt={currentUser.name} className="w-full h-full object-cover" />
                  {currentUser.photoApproved === false && (
                    <span className="absolute inset-x-0 bottom-0 bg-amber-500/90 text-white text-[6px] font-black uppercase text-center leading-tight py-0.2">
                      PENDING
                    </span>
                  )}
                </div>
              )}
              <div className="text-right hidden md:block">
                <div className="text-xs font-extrabold text-sky-950 leading-none">{currentUser?.name || 'User'}</div>
                <div className="text-[9px] font-mono font-black uppercase tracking-wider mt-0.5 text-sky-600">{currentUser?.role || 'User'} Account</div>
              </div>

              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-200/80 bg-white/90 hover:bg-white text-sky-900 cursor-pointer transition-all duration-200 text-xs font-bold shadow-2xs"
                title="View & Edit My Profile"
              >
                {currentUser?.profilePhoto ? (
                  <img src={currentUser.profilePhoto} alt="PP" className={`w-5 h-6 rounded-md object-cover border shrink-0 ${currentUser.photoApproved === false ? 'border-amber-400' : 'border-sky-400'}`} />
                ) : (
                  <User size={13} className="text-sky-600" />
                )}
                <span className="hidden sm:inline">My Profile</span>
              </button>

              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  sessionStorage.removeItem('reliabletech_is_authenticated');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer transition-all duration-200 text-xs font-bold shadow-2xs"
                title="Log Out of system"
              >
                <Lock size={12} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Top Main Navigation Tabs Bar */}
      <nav aria-label="Main system navigation" className="sticky top-[57px] z-30 bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none">
            {topNavStructure.map((tab) => {
              const userAllowedTabs = getUserAllowedTabs(currentUser, rolePermissionsConfig);
              const visibleSubtabs = tab.subtabs?.filter(s => userAllowedTabs.includes(s.id)) || [];
              
              if (!tab.hasSubtabs && !userAllowedTabs.includes(tab.id)) return null;
              if (tab.hasSubtabs && visibleSubtabs.length === 0) return null;

              const isDirectlyActive = activeTab === tab.id;
              const isChildActive = tab.hasSubtabs && visibleSubtabs.some(s => s.id === activeTab);
              const isTabActive = isDirectlyActive || isChildActive;
              const TabIcon = tab.icon;

              const subtabsBadgeSum = visibleSubtabs.reduce((sum, s) => sum + (s.badge || 0), 0);
              const displayBadge = (tab.badge || 0) + subtabsBadgeSum;

              return (
                <button
                  key={tab.id}
                  id={tab.elementId || `nav-tab-${tab.id}`}
                  onClick={() => {
                    if (!tab.hasSubtabs) {
                      setActiveTab(tab.id);
                    } else if (visibleSubtabs.length > 0) {
                      if (!visibleSubtabs.some(s => s.id === activeTab)) {
                        setActiveTab(visibleSubtabs[0].id);
                      }
                    }
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 shrink-0 cursor-pointer relative select-none ${
                    isTabActive
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <TabIcon size={15} className={isTabActive ? 'text-white' : 'text-slate-500'} />
                  <span>{tab.label}</span>
                  {displayBadge > 0 && (
                    <span
                      className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full leading-tight shadow-2xs ${
                        isTabActive
                          ? 'bg-white text-sky-600'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {displayBadge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Beautiful Subtabs Bar (Rendered when the active parent has subtabs) */}
        {(() => {
          const userAllowedTabs = getUserAllowedTabs(currentUser, rolePermissionsConfig);
          const currentParent = topNavStructure.find(tab => 
            tab.hasSubtabs && tab.subtabs?.some(s => s.id === activeTab && userAllowedTabs.includes(s.id))
          );

          if (!currentParent || !currentParent.subtabs) return null;

          const visibleSubtabs = currentParent.subtabs.filter(s => userAllowedTabs.includes(s.id));
          if (visibleSubtabs.length === 0) return null;

          return (
            <div className="bg-slate-50/95 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8 py-1.5 backdrop-blur-xs">
              <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                  {currentParent.label}:
                </span>
                {visibleSubtabs.map((sub) => {
                  const isSubActive = activeTab === sub.id;
                  const SubIcon = sub.icon;

                  return (
                    <button
                      key={sub.id}
                      id={sub.elementId || `subtab-${sub.id}`}
                      onClick={() => setActiveTab(sub.id)}
                      title={sub.description}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 shrink-0 cursor-pointer ${
                        isSubActive
                          ? 'bg-white text-sky-950 font-bold border border-sky-200/90 shadow-xs ring-1 ring-sky-500/20'
                          : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <SubIcon
                        size={14}
                        className={isSubActive ? 'text-sky-600' : 'text-slate-400'}
                      />
                      <span>{sub.label}</span>
                      {sub.badge && sub.badge > 0 ? (
                        <span className="text-[10px] font-mono font-bold bg-rose-500 text-white px-1.5 py-0.2 rounded-full leading-tight">
                          {sub.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </nav>

      {/* Main Workspace */}
      <div className="flex-1 flex min-h-[calc(100vh-110px)] relative">
        {/* Main Area Wrapper */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Company Background Watermark - Faint, Centered & Non-Intrusive */}
          {profile?.logoUrl && (
            <div
              id="company-background-watermark"
              aria-hidden="true"
              className="fixed inset-0 pointer-events-none select-none z-0 flex items-center justify-center overflow-hidden print:hidden"
              style={{
                pointerEvents: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
            >
              <div
                className="w-full h-full max-w-[500px] max-h-[500px] bg-center bg-no-repeat bg-contain opacity-[0.035] transition-opacity duration-500 pointer-events-none select-none"
                style={{
                  backgroundImage: `url("${profile.logoUrl}")`,
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: 'contain',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
              />
            </div>
          )}

          {/* Main Content Workspace Stage */}
          <main className="flex-1 min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            
            {/* Permission Security Check */}
            {!getUserAllowedTabs(currentUser, rolePermissionsConfig).includes(activeTab) && (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-600 mb-4">
                  <Lock size={28} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Access Restricted</h2>
                <p className="text-sm text-slate-500 max-w-md mb-6">
                  You do not have permission to view or access this module ({activeTab}). Please contact an administrator if you require access.
                </p>
                <button
                  onClick={() => {
                    const allowed = getUserAllowedTabs(currentUser, rolePermissionsConfig);
                    setActiveTab(allowed.includes('dashboard') ? 'dashboard' : allowed[0] || 'dashboard');
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Return to Allowed Workspace
                </button>
              </div>
            )}

            {getUserAllowedTabs(currentUser, rolePermissionsConfig).includes(activeTab) && (
              <>
                {activeTab === 'dashboard' && (
                  <Dashboard 
                    profile={profile}
                    services={services}
                    suppliers={suppliers}
                    transactions={transactions}
                    invoices={invoices}
                    expenses={expenses}
                    inventoryStock={inventoryStock}
                    onNavigate={(tab) => setActiveTab(tab)}
                    currentUser={currentUser}
                    attendanceRecords={attendanceRecords}
                    attendanceRequests={attendanceRequests}
                    onAddAttendanceRequest={handleAddAttendanceRequest}
                    periodicClosings={periodicClosings}
                    openingBalances={openingBalances}
                    accountTransfers={accountTransfers}
                    dailyClosings={dailyClosings}
                    editRequests={editRequests}
                  />
                )}

        {activeTab === 'ecommerce' && (
          <EcommerceManagement
            products={ecommerceProducts}
            orders={ecommerceOrders}
            serviceTickets={ecommerceServiceTickets}
            customerAccounts={customerAccounts}
            hardwareTypes={hardwareTypes}
            inventoryStock={inventoryStock}
            inquiries={customerInquiries}
            onUpdateInquiries={setCustomerInquiries}
            blockedMessengers={blockedMessengers}
            currentUser={currentUser}
            staffUsers={users}
            profile={profile}
            onAddProduct={handleAddEcommerceProduct}
            onEditProduct={handleEditEcommerceProduct}
            onDeleteProduct={handleDeleteEcommerceProduct}
            onUpdateOrderStatus={handleUpdateEcommerceOrderStatus}
            onUpdateServiceTicket={handleUpdateEcommerceServiceTicket}
            onAddHardwareType={handleAddHardwareType}
            onEditHardwareType={handleEditHardwareType}
            onDeleteHardwareType={handleDeleteHardwareType}
            onConvertToInvoice={handleConvertEcommerceOrderToInvoice}
            onCancelOrderWithReverseVoucher={handleCancelEcommerceOrderWithReverseVoucher}
            onReplyInquiry={handleStaffReplyInquiry}
            onForwardInquiryToAdmin={handleForwardInquiryToAdmin}
            onBlockMessenger={handleBlockMessenger}
            onUnblockMessenger={handleUnblockMessenger}
            onVerifyPayment={handleVerifyOrderPayment}
            onDeleteOrder={handleDeleteEcommerceOrder}
            onDeleteServiceTicket={handleDeleteEcommerceServiceTicket}
            onDeleteInquiry={handleDeleteCustomerInquiry}
            onUpdateCustomer={handleUpdateCustomerAccount}
            onDeleteCustomer={handleDeleteCustomerAccount}
            onResetCustomerPassword={handleResetCustomerPassword}
            onToast={showToast}
          />
        )}

        {activeTab === 'services' && (
          <div className="space-y-4">
            <div className="flex border-b border-slate-200 gap-4 bg-white px-4 pt-2.5 rounded-xl shadow-xs">
              <button
                onClick={() => setServicesSubTab('requests')}
                className={`pb-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  servicesSubTab === 'requests'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Wrench size={14} />
                <span>Service Job Requests</span>
              </button>
              <button
                onClick={() => setServicesSubTab('catalog')}
                className={`pb-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  servicesSubTab === 'catalog'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Tag size={14} />
                <span>Services & Rates Catalog</span>
              </button>
            </div>

            {servicesSubTab === 'requests' ? (
              <ServiceRequestsList 
                serviceRequests={serviceRequests}
                onAddServiceRequest={handleAddServiceRequest}
                onEditServiceRequest={handleEditServiceRequest}
                onDeleteServiceRequest={handleDeleteServiceRequest}
                onBillServiceRequest={handleBillServiceRequest}
                currentUser={currentUser}
              />
            ) : (
              <ServicesList 
                services={services}
                onAddService={handleAddService}
                onEditService={handleEditService}
                onDeleteService={handleDeleteService}
                units={units}
                currentUser={currentUser}
              />
            )}
          </div>
        )}

        {activeTab === 'sales' && (
          <SalesAndBilling 
            invoices={invoices}
            services={services}
            profile={profile}
            onAddInvoice={handleAddInvoice}
            onEditInvoice={handleEditInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            currentUserRole={currentUser.role}
            onSendEditRequest={handleSendEditRequest}
            prepopulatedInvoiceData={prepopulatedInvoiceData}
            onClearPrepopulatedInvoiceData={() => setPrepopulatedInvoiceData(null)}
            inventoryStock={inventoryStock}
            periodicClosings={periodicClosings}
            isDateLocked={isDateLocked}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersData 
            invoices={invoices}
            services={services}
            onUpdateInvoices={setInvoices}
            currentUserRole={currentUser.role}
            currentUser={currentUser}
            onSendEditRequest={handleSendEditRequest}
            customerAccounts={customerAccounts}
            onUpdateCustomerAccounts={setCustomerAccounts}
            profile={profile}
          />
        )}

        {activeTab === 'suppliers' && (
          <SuppliersList 
            suppliers={suppliers}
            onAddSupplier={handleAddSupplier}
            onEditSupplier={handleEditSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            supplierPayments={supplierPayments}
            onUpdateSupplierPayments={setSupplierPayments}
            onUpdateSuppliers={setSuppliers}
            currentUser={currentUser}
            profile={profile}
            onSendEditRequest={handleSendEditRequest}
            onAddExpense={handleAddExpense}
            onDeleteSupplierPayment={handleDeleteSupplierPayment}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsList 
            transactions={transactions}
            suppliers={suppliers}
            onAddTransaction={handleAddTransaction}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            services={services}
            onUpdateServices={setServices}
            inventoryStock={inventoryStock}
            onUpdateInventoryStock={setInventoryStock}
            assets={assets}
            onAddAsset={handleAddAsset}
            onUpdateSuppliers={setSuppliers}
            currentUser={currentUser}
            onSendEditRequest={handleSendEditRequest}
            profile={profile}
            units={units}
            isDateLocked={isDateLocked}
            onAddExpense={handleAddExpense}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryList 
            inventoryStock={inventoryStock}
            inventoryRequests={inventoryRequests}
            officeUseRequests={officeUseRequests}
            transactions={transactions}
            suppliers={suppliers}
            onUpdateSuppliers={setSuppliers}
            currentUser={currentUser}
            onAddInventoryRequest={handleAddInventoryRequest}
            onApproveInventoryRequest={handleApproveInventoryRequest}
            onDeclineInventoryRequest={handleDeclineInventoryRequest}
            onAddOfficeUseRequest={handleAddOfficeUseRequest}
            onApproveOfficeUseRequest={handleApproveOfficeUseRequest}
            onRejectOfficeUseRequest={handleRejectOfficeUseRequest}
            onDeleteStockItem={handleDeleteStockItem}
            onUpdateInventoryStock={setInventoryStock}
            units={units}
          />
        )}

        {activeTab === 'assets_management' && (
          <AssetsManagement 
            assets={assets}
            onAddAsset={handleAddAsset}
            onUpdateAsset={handleEditAsset}
            onDeleteAsset={handleDeleteAsset}
            transactions={transactions}
            suppliers={suppliers}
            currentUser={currentUser}
            onSendEditRequest={(req) => handleSendEditRequest({ ...req, status: 'Pending' })}
          />
        )}

        {activeTab === 'reports' && (
          <Reports 
            invoices={invoices}
            expenses={expenses}
            transactions={transactions}
            services={services}
            suppliers={suppliers}
            inventoryStock={inventoryStock}
            assets={assets}
            profile={profile}
            openingBalances={openingBalances}
            accountTransfers={accountTransfers}
            onUpdateAccountTransfers={setAccountTransfers}
            dailyClosings={dailyClosings}
            currentUser={currentUser}
            editRequests={editRequests}
            salaryDistributions={salaryDistributions}
            officeUseRequests={officeUseRequests}
            onTriggerInsufficientBalance={(val) => setInsufficientBalanceValidation(val)}
            shareholders={shareholders}
            onUpdateShareholders={setShareholders}
            meetingNotes={meetingNotes}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesList 
            expenses={expenses}
            supplyTransactions={transactions}
            suppliers={suppliers}
            openingBalances={openingBalances}
            invoices={invoices}
            dailyClosings={dailyClosings}
            salaryDistributions={salaryDistributions}
            accountTransfers={accountTransfers}
            editRequests={editRequests}
            onTriggerInsufficientBalance={(val) => setInsufficientBalanceValidation(val)}
            onAddExpense={handleAddExpense}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
            onApproveExpense={handleApproveExpense}
            onDeclineExpense={handleDeclineExpense}
            currentUser={currentUser}
            profile={profile}
            isDateLocked={isDateLocked}
            shareholders={shareholders}
            meetingNotes={meetingNotes}
          />
        )}

        {activeTab === 'letters' && (
          <OfficialLetters 
            letters={letters}
            users={users}
            profile={profile}
            currentUser={currentUser}
            periodicClosings={periodicClosings}
            onAddLetter={handleAddLetter}
            onEditLetter={handleEditLetter}
            onDeleteLetter={handleDeleteLetter}
          />
        )}

         {activeTab === 'settings' && (
          <ExportCenter 
            profile={profile}
            services={services}
            suppliers={suppliers}
            transactions={transactions}
            invoices={invoices}
            onUpdateProfile={setProfile}
            onImportDatabase={handleImportDatabase}
            onRestoreDbFile={handleUploadDbFile}
            onResetDatabase={handleResetDatabase}
            onResetDateRange={handleResetDateRange}
            units={units}
            onUpdateUnits={setUnits}
            users={users}
            onUpdateUsers={setUsers}
            currentUser={currentUser}
            rolePermissionsConfig={rolePermissionsConfig}
            onUpdateRolePermissionsConfig={setRolePermissionsConfig}
            openingBalances={openingBalances}
            onUpdateOpeningBalances={setOpeningBalances}
            shareholders={shareholders}
            onUpdateShareholders={setShareholders}
            expenses={expenses}
            onAddExpense={handleAddExpense}
            salaryDistributions={salaryDistributions}
            accountTransfers={accountTransfers}
            dailyClosings={dailyClosings}
            editRequests={editRequests}
            meetingNotes={meetingNotes}
          />
        )}

        {activeTab === 'daily_closing' && (
          <DailyClosingComponent 
            invoices={invoices}
            dailyClosings={dailyClosings}
            onSaveClosing={handleSaveClosing}
            onApproveClosing={handleApproveClosing}
            onUnlockClosing={handleUnlockClosing}
            currentUser={currentUser}
            editRequests={editRequests}
            periodicClosings={periodicClosings}
            expenses={expenses}
            profile={profile}
            onSavePeriodicClosing={(closing) => {
              setPeriodicClosings(prev => {
                const exists = prev.some(c => c.id === closing.id);
                const isNewApproval = !exists 
                  ? (closing.status === 'Approved') 
                  : (closing.status === 'Approved' && prev.find(c => c.id === closing.id)?.status !== 'Approved');

                if (isNewApproval && closing.duration === 'Annual') {
                  // Admin approved the yearly closing!
                  // Let's parse the fiscal year closed
                  const closedFY = closing.period; // e.g. "2082/83"
                  const closedStart = parseInt(closedFY.split('/')[0], 10);
                  if (!isNaN(closedStart)) {
                    const nextFYStart = closedStart + 1;
                    const nextFYEndShort = String(nextFYStart + 1).slice(-2);
                    const nextFY = `${nextFYStart}/${nextFYEndShort}`;
                    
                    // Propagate current stock as opening stock for nextFY
                    setInventoryStock(currentStock => 
                      currentStock.map(item => {
                        const openingStockForFY = { ...(item.openingStockForFY || {}) };
                        openingStockForFY[nextFY] = item.quantity;
                        return {
                          ...item,
                          openingStockForFY
                        };
                      })
                    );
                    setTimeout(() => {
                      showToast(`Yearly Closing Approved for FY ${closedFY}! Next FY ${nextFY} opening stock set.`, "success");
                    }, 100);
                  }
                }

                if (exists) {
                  return prev.map(c => c.id === closing.id ? closing : c);
                }
                return [closing, ...prev];
              });
            }}
            users={users}
            accountTransfers={accountTransfers}
            onUpdateAccountTransfers={setAccountTransfers}
            inventoryStock={inventoryStock}
            suppliers={suppliers}
            openingBalances={openingBalances}
            salaryDistributions={salaryDistributions}
            supplyTransactions={transactions}
            shareholders={shareholders}
            meetingNotes={meetingNotes}
          />
        )}

        {activeTab === 'staff_requests' && (
          <StaffRequestsList 
            currentUser={currentUser}
            editRequests={editRequests}
            onApproveEditRequest={handleApproveEditRequest}
            onDeclineEditRequest={handleDeclineEditRequest}
            transactions={transactions}
            onUpdateTransaction={handleEditTransaction}
            suppliers={suppliers}
            inventoryRequests={inventoryRequests}
            onApproveInventoryRequest={handleApproveInventoryRequest}
            onDeclineInventoryRequest={handleDeclineInventoryRequest}
            leaveRequests={leaveRequests}
            onUpdateLeaveRequest={handleUpdateLeaveRequest}
            attendanceRequests={attendanceRequests}
            onApproveAttendanceRequest={handleApproveAttendanceRequest}
            onDeclineAttendanceRequest={handleDeclineAttendanceRequest}
            expenses={expenses}
            onApproveExpense={handleApproveExpense}
            onDeclineExpense={handleDeclineExpense}
            dailyClosings={dailyClosings}
            onApproveClosing={handleApproveClosing}
          />
        )}

        {activeTab === 'staff_attendance' && (
          <StaffAttendance
            currentUser={currentUser}
            users={users}
            onUpdateUsers={setUsers}
            attendanceRecords={attendanceRecords}
            onSaveAttendance={handleSaveAttendance}
            leaveRequests={leaveRequests}
            onAddLeaveRequest={handleAddLeaveRequest}
            onUpdateLeaveRequest={handleUpdateLeaveRequest}
            salaryDistributions={salaryDistributions}
            onDistributeSalary={handleDistributeSalary}
            onDeleteSalaryDistribution={(id) => setSalaryDistributions(prev => prev.filter(s => s.id !== id))}
            onAddExpense={handleAddExpense}
            profile={profile}
            attendanceRequests={attendanceRequests}
            onAddAttendanceRequest={handleAddAttendanceRequest}
          />
        )}

        {activeTab === 'email_inbox' && (
          <EmailInbox
            currentUser={currentUser}
            invoices={invoices}
            expenses={expenses}
            suppliers={suppliers}
            customers={customerAccounts}
            shareholders={shareholders}
            users={users}
            profile={profile}
            dailyClosings={dailyClosings}
          />
        )}

        {activeTab === 'meeting_mynotes' && (
          <MeetingMyNotes 
            meetingNotes={meetingNotes}
            onSaveMeetingNote={(note) => {
              setMeetingNotes(prev => {
                const exists = prev.some(n => n.id === note.id);
                if (exists) {
                  return prev.map(n => n.id === note.id ? note : n);
                } else {
                  return [note, ...prev];
                }
              });

              if (note.shareTransactions && note.shareTransactions.length > 0) {
                setShareholders(prevShareholders => {
                  let updatedShList = [...prevShareholders];
                  note.shareTransactions?.forEach(tx => {
                    const shIndex = updatedShList.findIndex(s => s.id === tx.shareholderId || (s.name && s.name.toLowerCase() === tx.shareholderName.toLowerCase()));
                    if (shIndex >= 0) {
                      const sh = updatedShList[shIndex];
                      const existingTxs = sh.transactions || [];
                      const txExists = existingTxs.some(t => t.id === tx.id);
                      const updatedTxs = txExists ? existingTxs.map(t => t.id === tx.id ? tx : t) : [...existingTxs, tx];
                      
                      let netTotal = sh.openingDetails?.openingAmount || sh.totalShareAmount || 0;
                      updatedTxs.forEach(t => {
                        if (t.status === 'Approved' || note.status === 'Approved' || note.status === 'In Progress' || note.status === 'Scheduled' || note.status === 'Closed') {
                          if (t.transactionType === 'Addition') netTotal += t.paidAmount;
                          if (t.transactionType === 'Return') netTotal -= t.paidAmount;
                        }
                      });
                      
                      updatedShList[shIndex] = {
                        ...sh,
                        transactions: updatedTxs,
                        totalShareAmount: netTotal
                      };
                    } else {
                      const newSh: Shareholder = {
                        id: tx.shareholderId || `sh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                        name: tx.shareholderName,
                        address: tx.address || 'Local',
                        citizenshipNumber: tx.citizenshipNumber || '',
                        totalShareAmount: tx.transactionType === 'Addition' ? tx.paidAmount : -tx.paidAmount,
                        status: 'Active',
                        transactions: [tx]
                      };
                      updatedShList.push(newSh);
                    }
                  });
                  return updatedShList;
                });
              }
            }}
            onDeleteMeetingNote={(id) => {
              setMeetingNotes(prev => prev.filter(n => n.id !== id));
            }}
            currentUser={currentUser}
            users={users}
            profile={profile}
            periodicClosings={periodicClosings}
            letters={letters}
            onAddLetter={handleAddLetter}
            shareholders={shareholders}
          />
        )}
              </>
            )}

      </main>
      </div>
      </div>

      {/* Persistent Page Footer */}
      <footer className="w-full bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; {new Date().getFullYear()} Reliabletech Services. All records preserved in local storage.</span>
          <div className="flex items-center gap-2">
            <span>Fikkal Bazaar, Ilam, Nepal</span>
            <span>•</span>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
              <span className="text-indigo-500 font-bold">Offline Ready</span>
              <button 
                onClick={() => setShowManualModal(true)} 
                className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg font-bold text-[11px] font-sans border border-indigo-200 cursor-pointer transition active:scale-95 flex items-center gap-1 shrink-0"
                title={`${currentUser.role === 'Admin' ? 'Admin' : 'User'} Operations Manual`}
              >
                <BookOpen size={11} className="text-indigo-500" />
                <span>Manual</span>
              </button>
              <button 
                onClick={() => setShowInfoModal(true)} 
                className="text-indigo-600 hover:text-indigo-800 bg-indigo-100/60 hover:bg-indigo-150 p-0.5 rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold text-[11px] font-sans border border-indigo-200 cursor-pointer transition active:scale-95 shrink-0"
                title="System Information & Credits"
              >
                i
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* User Switch Password Modal */}
      {pendingUserToSwitch && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto animate-scale-in my-auto">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 sticky top-0 bg-slate-50 z-10">
              <h3 className="font-bold font-display text-slate-800 text-base">Security Verification</h3>
              <p className="text-xs text-slate-500">Authentication is required to switch roles.</p>
            </div>
            
            <form onSubmit={handleConfirmUserSwitch} className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-600">
                  Please enter the password for <strong className="text-slate-800">{pendingUserToSwitch.name}</strong> (@{pendingUserToSwitch.username}):
                </p>
                <input 
                  type="password"
                  required
                  autoFocus
                  placeholder="Enter password..."
                  value={enteredPassword}
                  onChange={(e) => setEnteredPassword(e.target.value)}
                  className="w-full mt-2 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                {authError && (
                  <p className="text-xs text-rose-600 font-bold mt-1.5">{authError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setPendingUserToSwitch(null);
                    setEnteredPassword('');
                    setAuthError('');
                  }}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer h-9"
                >
                  Verify & Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* System Info & Credits Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-150 w-full max-w-md max-h-[calc(100dvh-2rem)] flex flex-col animate-scale-in my-auto overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-400 font-serif italic font-bold flex items-center justify-center text-sm">
                  i
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">System Architecture &amp; Credits</h3>
                  <p className="text-[10px] text-slate-400">ReliableTech Services &amp; Suppliers Management Suite</p>
                </div>
              </div>
              <button 
                onClick={() => setShowInfoModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 space-y-4 text-center overflow-y-auto text-slate-600 text-xs leading-relaxed">
              {(() => {
                const reliableAdminUser = users.find(u => u.username?.toLowerCase() === 'reliableadmin') || users.find(u => u.role === 'Super Admin') || users.find(u => u.username?.toLowerCase() === 'arpan');
                const devPhoto = reliableAdminUser?.profilePhoto || '';
                return (
                  <>
                    {devPhoto ? (
                      <div className="relative w-20 h-20 mx-auto">
                        <img
                          src={devPhoto}
                          alt="Arpan Khadka"
                          className="w-20 h-20 rounded-full object-cover border-2 border-sky-400 shadow-md ring-4 ring-sky-100"
                        />
                        <div
                          className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-2xs"
                          title="Verified Lead Developer"
                        >
                          <Check size={12} strokeWidth={3} />
                        </div>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-sky-600 via-sky-700 to-indigo-700 text-white border-2 border-sky-300 flex items-center justify-center mx-auto shadow-md text-xl font-black ring-4 ring-sky-100">
                        AK
                      </div>
                    )}

                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-medium">Platform Engineering &amp; Design</p>
                      <h4 className="text-base font-extrabold text-slate-900">
                        Software is fully designed and developed by
                      </h4>
                      <div className="text-sm font-black text-sky-700">
                        Arpan Khadka
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold text-[11px] w-16 shrink-0">Address:</span>
                        <span className="font-semibold text-slate-900">Suryodaya Mun - 7, Kanyam, Ilam, Nepal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold text-[11px] w-16 shrink-0">Email:</span>
                        <a
                          href="mailto:arpankhadka2057@gmail.com"
                          className="font-semibold text-sky-600 hover:underline truncate"
                        >
                          arpankhadka2057@gmail.com
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold text-[11px] w-16 shrink-0">Edition:</span>
                        <span className="font-mono text-emerald-700 font-bold">ReliableTech Enterprise ERP v4.8</span>
                      </div>
                    </div>

                    {/* Our Team Section */}
                    <div className="pt-2 text-left space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                        <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <Users size={14} className="text-sky-600" />
                          <span>Our Team</span>
                        </h5>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          {users.length} Members
                        </span>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {users.length === 0 ? (
                          <p className="text-xs text-slate-400 italic text-center py-2">No team members registered</p>
                        ) : (
                          users.map((member) => (
                            <div
                              key={member.id}
                              className="p-2 bg-slate-50/80 hover:bg-sky-50/60 rounded-xl border border-slate-200/80 flex items-center gap-3 transition"
                            >
                              {member.profilePhoto ? (
                                <img
                                  src={member.profilePhoto}
                                  alt={member.name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-sky-300 shadow-2xs shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-700 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 border border-sky-400/40 shadow-2xs">
                                  {member.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-extrabold text-slate-900 leading-snug">
                                    {member.name}
                                  </span>
                                  {member.staffId && (
                                    <span className="text-[9px] font-mono bg-white border border-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-bold shrink-0">
                                      {member.staffId}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-sky-700 font-semibold truncate mt-0.5">
                                  <span>{member.post || member.designationNepali || member.role}</span>
                                  {member.nameNepali && member.nameNepali !== member.name && (
                                    <span className="text-slate-500 font-normal text-[10px]">({member.nameNepali})</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-end">
              <button 
                onClick={() => setShowInfoModal(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2 rounded-xl transition cursor-pointer shadow-md active:scale-95"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile & Security Modal */}
      <UserProfileModal 
        currentUser={currentUser}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdateUser={handleUpdateUser}
        onLogout={() => {
          setIsAuthenticated(false);
          sessionStorage.removeItem('reliabletech_is_authenticated');
        }}
        tabMode={tabInterfaceMode}
        onTabModeChange={() => {}}
        theme={appTheme}
        onThemeChange={() => {}}
      />

      {/* Operations Role-Based Manual Modal */}
      <OperationsManualModal 
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        currentUser={currentUser}
      />

      {/* Account Insufficient Balance Modal */}
      <InsufficientBalanceModal 
        validation={insufficientBalanceValidation}
        onClose={() => setInsufficientBalanceValidation(null)}
        onNavigateToOpeningBalance={() => {
          setInsufficientBalanceValidation(null);
          setActiveTab('settings');
        }}
        onNavigateToInternalTransfer={() => {
          setInsufficientBalanceValidation(null);
          setActiveTab('reports');
        }}
      />

      {/* Toast Notifications Container */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 pointer-events-none max-w-sm w-full">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`pointer-events-auto p-4 rounded-xl shadow-lg border flex items-start gap-3 animate-fade-in text-xs font-medium text-white ${
              t.type === 'success' ? 'bg-emerald-600 border-emerald-500' :
              t.type === 'error' ? 'bg-rose-600 border-rose-500' :
              t.type === 'warning' ? 'bg-amber-600 border-amber-500' :
              'bg-slate-800 border-slate-700'
            }`}
          >
            <span className="text-sm shrink-0">
              {t.type === 'success' ? '✅' :
               t.type === 'error' ? '❌' :
               t.type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <div className="space-y-0.5">
              <p>{t.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Universal Print Preview Modal Engine */}
      <GlobalPrintPreviewModal profile={profile} />

      {/* Universal Email Dispatch Modal Engine */}
      <UniversalEmailModal 
        onSuccess={(msg) => showToast(msg, 'success')} 
        onError={(err) => showToast(err, 'error')} 
      />

      {/* Hidden File Input for database file uploading */}
      <input
        type="file"
        ref={jsonFileInputRef}
        accept=".db,.sqlite,.sqlite3"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
