import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Upload, 
  Check, 
  Settings, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Hash, 
  Database,
  RefreshCw,
  AlertTriangle,
  Users,
  Trash2,
  Pencil,
  Camera,
  Plus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Activity,
  UserPlus,
  Lock,
  BookOpen,
  Printer,
  FileText,
  ShieldCheck,
  Building2,
  Wallet,
  UserCheck,
  Search,
  Eye,
  MinusCircle,
  DollarSign,
  Calendar,
  Sparkles,
  QrCode,
  CreditCard,
  MessageSquare,
  Shield,
  ShieldAlert,
  Key,
  Unlock,
  HelpCircle,
  CheckSquare,
  Square,
  Layers,
  Info
} from 'lucide-react';
import { 
  BusinessProfile, 
  BusinessService, 
  Supplier, 
  SupplyTransaction, 
  SalesInvoice, 
  AppUser, 
  EditRequest, 
  OpeningBalances, 
  LetterheadConfigs, 
  LetterheadDocConfig, 
  LetterheadDocType, 
  Shareholder, 
  ShareTransaction, 
  Expense, 
  SalaryDistribution, 
  AccountTransaction, 
  DailyClosing, 
  MeetingNote,
  RolePermissionsConfig,
  TabAccessRule,
  PermissionRulesMap
} from '../types';
import { 
  SYSTEM_MODULES_LIST, 
  getStoredRolePermissionsConfig, 
  saveStoredRolePermissionsConfig,
  DEFAULT_ROLE_PERMISSIONS_CONFIG,
  DEFAULT_SUPER_ADMIN_PERMISSIONS,
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_USER_PERMISSIONS,
  DEFAULT_SHAREHOLDER_PERMISSIONS,
  ALL_MODULE_IDS,
  TabModuleItem
} from '../utils/permissionUtils';
import { CorporateLetterhead } from './CorporateLetterhead';
import { EmailQuotaManagement } from './EmailQuotaManagement';
import { getCurrentBsDate, ensureBsDate, isDateWithinRange, normalizeStandardBsDate } from '../utils/nepaliDate';
import { calculateAccountBalance, normalizeAccountKey, getAccountBucketLabel } from '../utils/accountBalance';
import { NepaliDatePicker } from './NepaliDatePicker';

interface ExportCenterProps {
  profile: BusinessProfile;
  services: BusinessService[];
  suppliers: Supplier[];
  transactions: SupplyTransaction[];
  invoices: SalesInvoice[];
  onUpdateProfile: (profile: BusinessProfile) => void;
  onImportDatabase: (data: any) => void;
  onRestoreDbFile?: (file: File) => Promise<{ success: boolean; message?: string } | any>;
  onResetDatabase: () => void;
  onResetDateRange?: (fromDate: string, toDate: string) => { totalWiped: number; summary: string };
  units: string[];
  onUpdateUnits: (units: string[]) => void;
  users: AppUser[];
  onUpdateUsers: (users: AppUser[]) => void;
  currentUser: AppUser;
  openingBalances: OpeningBalances;
  onUpdateOpeningBalances: (balances: OpeningBalances) => void;
  shareholders?: Shareholder[];
  onUpdateShareholders?: (shareholders: Shareholder[]) => void;
  expenses?: Expense[];
  onAddExpense?: (exp: Omit<Expense, 'id' | 'expenseNo'>) => void;
  salaryDistributions?: SalaryDistribution[];
  accountTransfers?: AccountTransaction[];
  dailyClosings?: DailyClosing[];
  editRequests?: EditRequest[];
  meetingNotes?: MeetingNote[];
  rolePermissionsConfig?: RolePermissionsConfig;
  onUpdateRolePermissionsConfig?: (config: RolePermissionsConfig) => void;
}

export const ExportCenter: React.FC<ExportCenterProps> = ({
  profile,
  services,
  suppliers,
  transactions,
  invoices,
  onUpdateProfile,
  onImportDatabase,
  onRestoreDbFile,
  onResetDatabase,
  onResetDateRange,
  units,
  onUpdateUnits,
  users,
  onUpdateUsers,
  currentUser,
  openingBalances,
  onUpdateOpeningBalances,
  shareholders = [],
  onUpdateShareholders,
  expenses = [],
  onAddExpense,
  salaryDistributions = [],
  accountTransfers = [],
  dailyClosings = [],
  editRequests = [],
  meetingNotes = [],
  rolePermissionsConfig,
  onUpdateRolePermissionsConfig
}) => {
  const isMasterAccount = currentUser?.role === 'Super Admin' || currentUser?.username?.toLowerCase() === 'reliableadmin';
  const isReliableAdmin = currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan';
  const isSystemMaster = currentUser?.username?.toLowerCase() === 'reliableadmin';

  // Permissions Matrix Management States (strictly for @reliableadmin)
  const [selectedPermissionTarget, setSelectedPermissionTarget] = useState<string>('role:User');
  const [permissionMatrix, setPermissionMatrix] = useState<Record<string, TabAccessRule>>(() => {
    const stored = getStoredRolePermissionsConfig();
    return { ...(stored['User'] || DEFAULT_USER_PERMISSIONS) };
  });
  const [permissionSuccessMsg, setPermissionSuccessMsg] = useState<string | null>(null);

  // Sync matrix when rolePermissionsConfig prop changes
  React.useEffect(() => {
    if (selectedPermissionTarget.startsWith('role:')) {
      const role = selectedPermissionTarget.replace('role:', '') as 'Super Admin' | 'Admin' | 'User' | 'Shareholder';
      const config = rolePermissionsConfig || getStoredRolePermissionsConfig();
      setPermissionMatrix({ ...(config[role] || DEFAULT_USER_PERMISSIONS) });
    }
  }, [rolePermissionsConfig, selectedPermissionTarget]);

  const handlePermissionTargetChange = (newTarget: string) => {
    setSelectedPermissionTarget(newTarget);
    setPermissionSuccessMsg(null);
    if (newTarget === 'user:reliableadmin') {
      setPermissionMatrix({ ...DEFAULT_SUPER_ADMIN_PERMISSIONS });
      return;
    }
    if (newTarget.startsWith('role:')) {
      const role = newTarget.replace('role:', '') as 'Super Admin' | 'Admin' | 'User' | 'Shareholder';
      const config = rolePermissionsConfig || getStoredRolePermissionsConfig();
      setPermissionMatrix({ ...(config[role] || DEFAULT_USER_PERMISSIONS) });
      return;
    }
    if (newTarget.startsWith('user:')) {
      const uId = newTarget.replace('user:', '');
      const targetUser = users.find(u => u.id === uId || u.username === uId);
      if (targetUser) {
        if (targetUser.granularPermissions) {
          setPermissionMatrix({ ...targetUser.granularPermissions });
        } else if (targetUser.permissions && Array.isArray(targetUser.permissions)) {
          const conv: Record<string, TabAccessRule> = {};
          ALL_MODULE_IDS.forEach(id => {
            const isVis = targetUser.permissions!.includes(id);
            const isElevated = targetUser.role === 'Admin' || targetUser.role === 'Super Admin';
            conv[id] = { visible: isVis, canEdit: isVis && isElevated, canDelete: isVis && isElevated };
          });
          setPermissionMatrix(conv);
        } else {
          const config = rolePermissionsConfig || getStoredRolePermissionsConfig();
          setPermissionMatrix({ ...(config[targetUser.role] || DEFAULT_USER_PERMISSIONS) });
        }
      }
    }
  };

  const handleToggleRowAllAccess = (moduleId: string) => {
    if (selectedPermissionTarget === 'user:reliableadmin') return;
    const current = permissionMatrix[moduleId] || { visible: false, canEdit: false, canDelete: false };
    const allChecked = current.visible && current.canEdit && current.canDelete;
    setPermissionMatrix(prev => ({
      ...prev,
      [moduleId]: {
        visible: !allChecked,
        canEdit: !allChecked,
        canDelete: !allChecked
      }
    }));
  };

  const handleToggleVisible = (moduleId: string) => {
    if (selectedPermissionTarget === 'user:reliableadmin') return;
    const current = permissionMatrix[moduleId] || { visible: false, canEdit: false, canDelete: false };
    const nextVisible = !current.visible;
    setPermissionMatrix(prev => ({
      ...prev,
      [moduleId]: {
        visible: nextVisible,
        canEdit: nextVisible ? current.canEdit : false,
        canDelete: nextVisible ? current.canDelete : false
      }
    }));
  };

  const handleToggleCanEdit = (moduleId: string) => {
    if (selectedPermissionTarget === 'user:reliableadmin') return;
    const current = permissionMatrix[moduleId] || { visible: false, canEdit: false, canDelete: false };
    const nextEdit = !current.canEdit;
    setPermissionMatrix(prev => ({
      ...prev,
      [moduleId]: {
        visible: nextEdit ? true : current.visible,
        canEdit: nextEdit,
        canDelete: nextEdit ? current.canDelete : false
      }
    }));
  };

  const handleToggleCanDelete = (moduleId: string) => {
    if (selectedPermissionTarget === 'user:reliableadmin') return;
    const current = permissionMatrix[moduleId] || { visible: false, canEdit: false, canDelete: false };
    const nextDelete = !current.canDelete;
    setPermissionMatrix(prev => ({
      ...prev,
      [moduleId]: {
        visible: nextDelete ? true : current.visible,
        canEdit: nextDelete ? true : current.canEdit,
        canDelete: nextDelete
      }
    }));
  };

  // Bulk column toggles
  const handleBulkToggleAllAccess = () => {
    if (selectedPermissionTarget === 'user:reliableadmin') return;
    const allAreFull = ALL_MODULE_IDS.every(id => {
      const r = permissionMatrix[id];
      return r?.visible && r?.canEdit && r?.canDelete;
    });
    const nextState = !allAreFull;
    const updated: Record<string, TabAccessRule> = {};
    ALL_MODULE_IDS.forEach(id => {
      updated[id] = { visible: nextState, canEdit: nextState, canDelete: nextState };
    });
    setPermissionMatrix(updated);
  };

  const handleBulkToggleVisible = () => {
    if (selectedPermissionTarget === 'user:reliableadmin') return;
    const allVis = ALL_MODULE_IDS.every(id => permissionMatrix[id]?.visible);
    const nextVis = !allVis;
    const updated: Record<string, TabAccessRule> = {};
    ALL_MODULE_IDS.forEach(id => {
      const cur = permissionMatrix[id] || { visible: false, canEdit: false, canDelete: false };
      updated[id] = {
        visible: nextVis,
        canEdit: nextVis ? cur.canEdit : false,
        canDelete: nextVis ? cur.canDelete : false
      };
    });
    setPermissionMatrix(updated);
  };

  const handleBulkToggleCanEdit = () => {
    if (selectedPermissionTarget === 'user:reliableadmin') return;
    const allEdit = ALL_MODULE_IDS.every(id => permissionMatrix[id]?.canEdit);
    const nextEdit = !allEdit;
    const updated: Record<string, TabAccessRule> = {};
    ALL_MODULE_IDS.forEach(id => {
      const cur = permissionMatrix[id] || { visible: false, canEdit: false, canDelete: false };
      updated[id] = {
        visible: nextEdit ? true : cur.visible,
        canEdit: nextEdit,
        canDelete: nextEdit ? cur.canDelete : false
      };
    });
    setPermissionMatrix(updated);
  };

  const handleBulkToggleCanDelete = () => {
    if (selectedPermissionTarget === 'user:reliableadmin') return;
    const allDel = ALL_MODULE_IDS.every(id => permissionMatrix[id]?.canDelete);
    const nextDel = !allDel;
    const updated: Record<string, TabAccessRule> = {};
    ALL_MODULE_IDS.forEach(id => {
      const cur = permissionMatrix[id] || { visible: false, canEdit: false, canDelete: false };
      updated[id] = {
        visible: nextDel ? true : cur.visible,
        canEdit: nextDel ? true : cur.canEdit,
        canDelete: nextDel
      };
    });
    setPermissionMatrix(updated);
  };

  // Presets
  const handleApplyPresetAllAccess = () => {
    if (selectedPermissionTarget === 'user:reliableadmin') return;
    setPermissionMatrix({ ...DEFAULT_SUPER_ADMIN_PERMISSIONS });
  };

  const handleApplyPresetReadOnly = () => {
    if (selectedPermissionTarget === 'user:reliableadmin') return;
    const updated: Record<string, TabAccessRule> = {};
    ALL_MODULE_IDS.forEach(id => {
      updated[id] = { visible: true, canEdit: false, canDelete: false };
    });
    setPermissionMatrix(updated);
  };

  const handleApplyPresetStaffOps = () => {
    if (selectedPermissionTarget === 'user:reliableadmin') return;
    setPermissionMatrix({ ...DEFAULT_USER_PERMISSIONS });
  };

  const handleApplyPresetRevokeAll = () => {
    if (selectedPermissionTarget === 'user:reliableadmin') return;
    const updated: Record<string, TabAccessRule> = {};
    ALL_MODULE_IDS.forEach(id => {
      updated[id] = { visible: false, canEdit: false, canDelete: false };
    });
    setPermissionMatrix(updated);
  };

  const handleResetToRoleDefaults = () => {
    if (!selectedPermissionTarget.startsWith('user:')) return;
    const uId = selectedPermissionTarget.replace('user:', '');
    const targetUser = users.find(u => u.id === uId || u.username === uId);
    if (targetUser) {
      const config = rolePermissionsConfig || getStoredRolePermissionsConfig();
      setPermissionMatrix({ ...(config[targetUser.role] || DEFAULT_USER_PERMISSIONS) });
    }
  };

  // Save Permissions Handler
  const handleSavePermissions = () => {
    if (selectedPermissionTarget === 'user:reliableadmin') {
      alert("System Master (@reliableadmin) account permanently possesses all permissions and cannot be modified.");
      return;
    }

    if (selectedPermissionTarget.startsWith('role:')) {
      const roleName = selectedPermissionTarget.replace('role:', '') as 'Super Admin' | 'Admin' | 'User' | 'Shareholder';
      const currentConfig = rolePermissionsConfig || getStoredRolePermissionsConfig();
      const updatedConfig: RolePermissionsConfig = {
        ...currentConfig,
        [roleName]: permissionMatrix
      };
      saveStoredRolePermissionsConfig(updatedConfig);
      if (onUpdateRolePermissionsConfig) {
        onUpdateRolePermissionsConfig(updatedConfig);
      }
      window.dispatchEvent(new Event('rtss_permissions_updated'));
      setPermissionSuccessMsg(`✅ Permissions for role "${roleName}" saved successfully! All users under this role will now adhere to these access rules.`);
      setTimeout(() => setPermissionSuccessMsg(null), 6000);
      return;
    }

    if (selectedPermissionTarget.startsWith('user:')) {
      const targetUserId = selectedPermissionTarget.replace('user:', '');
      const visibleTabs = ALL_MODULE_IDS.filter(id => permissionMatrix[id]?.visible);
      const updatedUsers = users.map(u => {
        if (u.id === targetUserId || u.username === targetUserId) {
          return {
            ...u,
            permissions: visibleTabs,
            granularPermissions: permissionMatrix
          };
        }
        return u;
      });
      onUpdateUsers(updatedUsers);
      window.dispatchEvent(new Event('rtss_permissions_updated'));
      const targetUserObj = users.find(u => u.id === targetUserId || u.username === targetUserId);
      setPermissionSuccessMsg(`✅ Custom permissions for user "${targetUserObj?.name || targetUserId}" saved successfully!`);
      setTimeout(() => setPermissionSuccessMsg(null), 6000);
    }
  };

  // Danger Zone Date-Range Wipe State (strictly for reliableadmin / system master)
  const [wipeFromDate, setWipeFromDate] = useState(() => '2082-04-01');
  const [wipeToDate, setWipeToDate] = useState(() => getCurrentBsDate());
  const [wipeSuccessMsg, setWipeSuccessMsg] = useState<string | null>(null);
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [showDemoResetModal, setShowDemoResetModal] = useState(false);

  const previewWipeDetails = useMemo(() => {
    if (!wipeFromDate || !wipeToDate) {
      return { total: 0, invoices: 0, tx: 0, exp: 0, closings: 0, transfers: 0, salaries: 0, notes: 0, reqs: 0 };
    }
    const minD = normalizeStandardBsDate(wipeFromDate <= wipeToDate ? wipeFromDate : wipeToDate);
    const maxD = normalizeStandardBsDate(wipeFromDate <= wipeToDate ? wipeToDate : wipeFromDate);

    const inRange = (d?: string) => {
      return isDateWithinRange(d, minD, maxD);
    };

    const invCount = invoices.filter(i => inRange(i.date)).length;
    const txCount = transactions.filter(t => inRange(t.date)).length;
    const expCount = expenses.filter(e => inRange(e.date)).length;
    const closeCount = dailyClosings.filter(c => inRange(c.date)).length;
    const transferCount = accountTransfers.filter(a => inRange(a.date)).length;
    const salCount = salaryDistributions.filter(s => inRange((s as any).distributionDate || (s as any).date)).length;
    const noteCount = meetingNotes.filter(m => inRange(m.meetingDate)).length;
    const reqCount = editRequests.filter(r => inRange(r.date)).length;
    const total = invCount + txCount + expCount + closeCount + transferCount + salCount + noteCount + reqCount;

    return {
      total,
      invoices: invCount,
      tx: txCount,
      exp: expCount,
      closings: closeCount,
      transfers: transferCount,
      salaries: salCount,
      notes: noteCount,
      reqs: reqCount
    };
  }, [wipeFromDate, wipeToDate, invoices, transactions, expenses, dailyClosings, accountTransfers, salaryDistributions, meetingNotes, editRequests]);

  const previewWipeCount = previewWipeDetails.total;

  // Admin SubTab State
  const [adminSubTab, setAdminSubTab] = useState<'shareholders' | 'users' | 'profile' | 'qr_codes' | 'balances' | 'system' | 'emails'>('shareholders');

  // Shareholder Management States
  const [shareholderSearch, setShareholderSearch] = useState('');
  const [selectedShareholderForLedger, setSelectedShareholderForLedger] = useState<Shareholder | null>(null);

  // Add Shareholder Modal State
  const [addShareModalOpen, setAddShareModalOpen] = useState(false);
  const [addShareOption, setAddShareOption] = useState<'existing' | 'new'>('existing');
  const [addShareholderId, setAddShareholderId] = useState('');
  const [addShareName, setAddShareName] = useState('');
  const [addShareAddress, setAddShareAddress] = useState('');
  const [addShareCitizenship, setAddShareCitizenship] = useState('');
  const [addShareAmount, setAddShareAmount] = useState('');
  const [addSharePayMethod, setAddSharePayMethod] = useState<'Cash' | 'RBB' | 'Esewa' | 'Sahakari'>('RBB');
  const [addShareTxDate, setAddShareTxDate] = useState(() => getCurrentBsDate());
  const [addShareTxIdNo, setAddShareTxIdNo] = useState('');
  const [addShareMeetingNo, setAddShareMeetingNo] = useState('');
  const [addShareMeetingDate, setAddShareMeetingDate] = useState(() => getCurrentBsDate());
  const [addShareDecisionNo, setAddShareDecisionNo] = useState('');
  const [addShareRemarks, setAddShareRemarks] = useState('');

  // Return Share Modal State
  const [returnShareModalOpen, setReturnShareModalOpen] = useState(false);
  const [returnShareholderId, setReturnShareholderId] = useState('');
  const [returnShareType, setReturnShareType] = useState<'partial' | 'full'>('partial');
  const [returnShareAmount, setReturnShareAmount] = useState('');
  const [returnSharePayMethod, setReturnSharePayMethod] = useState<'Cash' | 'RBB' | 'Esewa' | 'Sahakari'>('RBB');
  const [returnShareTxDate, setReturnShareTxDate] = useState(() => getCurrentBsDate());
  const [returnShareTxIdNo, setReturnShareTxIdNo] = useState('');
  const [returnShareMeetingNo, setReturnShareMeetingNo] = useState('');
  const [returnShareMeetingDate, setReturnShareMeetingDate] = useState(() => getCurrentBsDate());
  const [returnShareDecisionNo, setReturnShareDecisionNo] = useState('');
  const [returnShareRemarks, setReturnShareRemarks] = useState('');

  // Statement Image Proof Viewer Modal State (Admins)
  const [selectedStatementProof, setSelectedStatementProof] = useState<{
    account: string;
    imageUrl: string;
    balance?: number;
    date?: string;
  } | null>(null);

  // Auto populate address & citizenship when choosing existing shareholder
  const handleSelectExistingForAdd = (shId: string) => {
    setAddShareholderId(shId);
    if (!shId) return;
    const found = shareholders.find(s => s.id === shId);
    if (found) {
      setAddShareName(found.name);
      setAddShareAddress(found.address || '');
      setAddShareCitizenship(found.citizenshipNumber || '');
    }
  };

  // Add Shareholder Submit
  const handleAddShareholderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReliableAdmin) {
      alert("Action restricted: Only System Master (@reliableadmin) is allowed to add shareholders.");
      return;
    }

    const amt = Number(addShareAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid share addition amount.");
      return;
    }

    let updatedList = [...shareholders];
    let targetSh: Shareholder | undefined;

    if (addShareOption === 'existing' && addShareholderId) {
      targetSh = updatedList.find(s => s.id === addShareholderId);
    } else if (addShareOption === 'new' && addShareName.trim()) {
      targetSh = updatedList.find(s => s.name.trim().toLowerCase() === addShareName.trim().toLowerCase());
    }

    if (!targetSh) {
      const newShName = addShareName.trim() || 'New Shareholder';
      targetSh = {
        id: `sh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: newShName,
        address: addShareAddress.trim(),
        citizenshipNumber: addShareCitizenship.trim(),
        totalShareAmount: 0,
        transactions: [],
        status: 'Active'
      };
      updatedList.push(targetSh);
    }

    const newTx: ShareTransaction = {
      id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      shareholderId: targetSh.id,
      shareholderName: targetSh.name,
      address: addShareAddress.trim() || targetSh.address,
      citizenshipNumber: addShareCitizenship.trim() || targetSh.citizenshipNumber,
      transactionType: 'Addition',
      amount: amt,
      paidAmount: amt,
      paymentMethod: addSharePayMethod,
      transactionDate: addShareTxDate || getCurrentBsDate(),
      transactionIdNo: addShareTxIdNo.trim() || `TXN-${Date.now().toString().slice(-6)}`,
      meetingNumber: addShareMeetingNo.trim(),
      meetingDate: addShareMeetingDate.trim(),
      decisionNumber: addShareDecisionNo.trim(),
      remarks: addShareRemarks.trim() || 'Share addition added via Admin Shareholders subtab',
      status: 'Approved'
    };

    updatedList = updatedList.map(s => {
      if (s.id !== targetSh!.id) return s;
      const existingTxs = s.transactions || [];
      return {
        ...s,
        address: addShareAddress.trim() || s.address,
        citizenshipNumber: addShareCitizenship.trim() || s.citizenshipNumber,
        totalShareAmount: (s.totalShareAmount || 0) + amt,
        transactions: [newTx, ...existingTxs],
        status: 'Active'
      };
    });

    if (onUpdateShareholders) {
      onUpdateShareholders(updatedList);
    }

    setAddShareModalOpen(false);
    // Reset form
    setAddShareholderId('');
    setAddShareName('');
    setAddShareAddress('');
    setAddShareCitizenship('');
    setAddShareAmount('');
    setAddShareTxIdNo('');
    setAddShareMeetingNo('');
    setAddShareDecisionNo('');
    setAddShareRemarks('');
    alert(`Shareholder addition recorded successfully for ${targetSh.name}! Amount Rs. ${amt.toLocaleString()} credited to ${addSharePayMethod} account.`);
  };

  // Return Shareholder Submit
  const handleReturnShareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReliableAdmin) {
      alert("Action restricted: Only System Master (@reliableadmin) is allowed to process share returns.");
      return;
    }

    const targetSh = shareholders.find(s => s.id === returnShareholderId);
    if (!targetSh) {
      alert("Please select a shareholder to process return/refund.");
      return;
    }

    const amt = Number(returnShareAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid share return amount.");
      return;
    }

    if (amt > targetSh.totalShareAmount) {
      alert(`Error: Return amount (Rs. ${amt.toLocaleString()}) cannot exceed current share balance (Rs. ${targetSh.totalShareAmount.toLocaleString()}).`);
      return;
    }

    // Account Balance Validation: Verify target account bucket has sufficient balance
    const normKey = normalizeAccountKey(returnSharePayMethod);
    if (normKey) {
      const availableBal = calculateAccountBalance(normKey, {
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
      });
      if (availableBal < amt) {
        alert(`⚠️ Insufficient Balance in ${getAccountBucketLabel(normKey)} Account Bucket!\n\nAvailable Balance: Rs. ${availableBal.toLocaleString()}\nRequested Share Return: Rs. ${amt.toLocaleString()}\n\nPlease select another payment account bucket or top up the ${getAccountBucketLabel(normKey)} balance first.`);
        return;
      }
    }

    const remaining = targetSh.totalShareAmount - amt;

    const returnTx: ShareTransaction = {
      id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      shareholderId: targetSh.id,
      shareholderName: targetSh.name,
      address: targetSh.address,
      citizenshipNumber: targetSh.citizenshipNumber,
      transactionType: 'Return',
      amount: amt,
      paidAmount: amt,
      remainingBalance: remaining,
      paymentMethod: returnSharePayMethod,
      transactionDate: returnShareTxDate || getCurrentBsDate(),
      transactionIdNo: returnShareTxIdNo.trim() || `RET-${Date.now().toString().slice(-6)}`,
      meetingNumber: returnShareMeetingNo.trim(),
      meetingDate: returnShareMeetingDate.trim(),
      decisionNumber: returnShareDecisionNo.trim(),
      remarks: returnShareRemarks.trim() || 'Partial/split share return processed via Admin Shareholders subtab',
      status: 'Approved'
    };

    const updatedList = shareholders.map(s => {
      if (s.id !== targetSh.id) return s;
      const existingTxs = s.transactions || [];
      return {
        ...s,
        totalShareAmount: remaining,
        transactions: [returnTx, ...existingTxs],
        status: remaining <= 0 ? 'Inactive' : s.status
      };
    });

    if (onUpdateShareholders) {
      onUpdateShareholders(updatedList);
    }

    // Automatically record an Expense entry so it appears in Expenses Tab & Reports without double-counting
    if (onAddExpense) {
      const formattedMethod = (returnSharePayMethod.charAt(0).toUpperCase() + returnSharePayMethod.slice(1).toLowerCase()) as any;
      onAddExpense({
        category: 'Shareholder Payout',
        topic: 'Share Return / Refund',
        title: `Share Capital Return to ${targetSh.name}`,
        amount: amt,
        paymentMethod: formattedMethod,
        date: returnShareTxDate || getCurrentBsDate(),
        remarks: returnShareRemarks.trim() || `Share return processed for ${targetSh.name}`,
        status: 'Approved',
        createdBy: currentUser.name || currentUser.username,
        approvedBy: currentUser.name || currentUser.username,
        referenceId: returnTx.id
      });
    }

    setReturnShareModalOpen(false);
    // Reset form
    setReturnShareholderId('');
    setReturnShareAmount('');
    setReturnShareTxIdNo('');
    setReturnShareMeetingNo('');
    setReturnShareDecisionNo('');
    setReturnShareRemarks('');
    alert(`Share return of Rs. ${amt.toLocaleString()} processed successfully for ${targetSh.name}. Debited from ${returnSharePayMethod} account. Remaining balance: Rs. ${remaining.toLocaleString()}.`);
  };

  // Delete Shareholder from Directory
  const handleDeleteShareholder = (sh: Shareholder) => {
    const isAuthorized = currentUser?.username?.toLowerCase() === 'reliableadmin' || 
                         currentUser?.username?.toLowerCase() === 'arpan' || 
                         currentUser?.role === 'Super Admin' || 
                         currentUser?.role === 'Admin';
    if (!isAuthorized) {
      alert("Action restricted: Only Administrator or System Master (@reliableadmin) is authorized to delete shareholder records.");
      return;
    }

    const activeAmount = sh.totalShareAmount || 0;
    if (activeAmount > 0) {
      const confirmDelete = confirm(
        `⚠️ Warning: Shareholder "${sh.name}" has an active share balance of रु. ${activeAmount.toLocaleString()}!\n\n` +
        `Deleting this shareholder will permanently remove them and all their logged transactions from the directory.\n\n` +
        `Are you sure you want to proceed with deletion?`
      );
      if (!confirmDelete) return;
    } else {
      if (!confirm(`Are you sure you want to delete shareholder "${sh.name}" from the system directory?`)) {
        return;
      }
    }

    if (onUpdateShareholders) {
      const updatedList = shareholders.filter(s => s.id !== sh.id);
      onUpdateShareholders(updatedList);
      if (selectedShareholderForLedger?.id === sh.id) {
        setSelectedShareholderForLedger(null);
      }
      alert(`Shareholder "${sh.name}" deleted successfully.`);
    }
  };

  // Local balances state
  const [localBalances, setLocalBalances] = React.useState<OpeningBalances>(openingBalances);
  const [balancesSaved, setBalancesSaved] = React.useState(false);

  React.useEffect(() => {
    if (openingBalances) {
      setLocalBalances(openingBalances);
    }
  }, [openingBalances]);

  const handleSaveBalances = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateOpeningBalances(localBalances);
    setBalancesSaved(true);
    setTimeout(() => setBalancesSaved(false), 3000);
  };

  const handleFileChange = (account: keyof OpeningBalances, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setLocalBalances(prev => ({
        ...prev,
        [account]: {
          ...prev[account],
          openingBalanceProof: base64String
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  // Profile Form state
  const [name, setName] = useState(profile.name);
  const [companyNameNepali, setCompanyNameNepali] = useState(profile.companyNameNepali || '');
  const [companySubtitle, setCompanySubtitle] = useState(profile.companySubtitle || '');
  const [companySubtitleNepali, setCompanySubtitleNepali] = useState(profile.companySubtitleNepali || '');
  const [location, setLocation] = useState(profile.location);
  const [addressNepali, setAddressNepali] = useState(profile.addressNepali || '');
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [panNumber, setPanNumber] = useState(profile.panNumber);
  const [logoUrl, setLogoUrl] = useState(profile.logoUrl || '');
  const [estdYear, setEstdYear] = useState(profile.estdYear || '');
  const [customerChatQuickReply, setCustomerChatQuickReply] = useState(profile.customerChatQuickReply || 'Namaste! Thank you for messaging ReliableTech Support Desk (Fikkal Bazaar, Ilam • Direct Counter Connect). Our on-duty technical counter staff have received your message and will assist you immediately. For urgent dispatch or on-site queries, feel free to call our hotline at 9852680780.');

  // QR Code Settings states
  const [rbbAccountName, setRbbAccountName] = useState(profile?.paymentQrSettings?.rbbAccountName || 'RELIABLETECH SERVICES AND SUPPLIERS');
  const [rbbAccountNumber, setRbbAccountNumber] = useState(profile?.paymentQrSettings?.rbbAccountNumber || '2030010004523001');
  const [rbbBranch, setRbbBranch] = useState(profile?.paymentQrSettings?.rbbBranch || 'Fikkal Branch, Suryodaya-10, Ilam');
  const [rbbQrCodeUrl, setRbbQrCodeUrl] = useState(profile?.paymentQrSettings?.rbbQrCodeUrl || 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=RBB-RELIABLETECH-2030010004523001');

  const [esewaAccountName, setEsewaAccountName] = useState(profile?.paymentQrSettings?.esewaAccountName || 'RELIABLETECH (OFFICIAL)');
  const [esewaId, setEsewaId] = useState(profile?.paymentQrSettings?.esewaId || '9852680456');
  const [esewaQrCodeUrl, setEsewaQrCodeUrl] = useState(profile?.paymentQrSettings?.esewaQrCodeUrl || 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=ESEWA-9852680456-RELIABLETECH');

  const [sahakariName, setSahakariName] = useState(profile?.paymentQrSettings?.sahakariName || 'Suryodaya Multipurpose Cooperative Ltd.');
  const [sahakariAccountName, setSahakariAccountName] = useState(profile?.paymentQrSettings?.sahakariAccountName || 'RELIABLETECH SS PVT');
  const [sahakariAccountNumber, setSahakariAccountNumber] = useState(profile?.paymentQrSettings?.sahakariAccountNumber || '001-045-88910');
  const [sahakariQrCodeUrl, setSahakariQrCodeUrl] = useState(profile?.paymentQrSettings?.sahakariQrCodeUrl || 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=SAHAKARI-00104588910-SURYODAYA');
  const [qrInstructions, setQrInstructions] = useState(profile?.paymentQrSettings?.instructions || 'Scan the official QR code using mobile banking or digital wallet. Upload payment receipt screenshot during checkout or in order tracking for rapid 5-minute counter verification.');

  React.useEffect(() => {
    if (profile) {
      setName(profile.name);
      setCompanyNameNepali(profile.companyNameNepali || '');
      setCompanySubtitle(profile.companySubtitle || '');
      setCompanySubtitleNepali(profile.companySubtitleNepali || '');
      setLocation(profile.location);
      setAddressNepali(profile.addressNepali || '');
      setPhone(profile.phone);
      setEmail(profile.email);
      setPanNumber(profile.panNumber);
      setLogoUrl(profile.logoUrl || '');
      setEstdYear(profile.estdYear || '');
      setCustomerChatQuickReply(profile.customerChatQuickReply || 'Namaste! Thank you for messaging ReliableTech Support Desk (Fikkal Bazaar, Ilam • Direct Counter Connect). Our on-duty technical counter staff have received your message and will assist you immediately. For urgent dispatch or on-site queries, feel free to call our hotline at 9852680780.');

      if (profile.paymentQrSettings) {
        setRbbAccountName(profile.paymentQrSettings.rbbAccountName || 'RELIABLETECH SERVICES AND SUPPLIERS');
        setRbbAccountNumber(profile.paymentQrSettings.rbbAccountNumber || '2030010004523001');
        setRbbBranch(profile.paymentQrSettings.rbbBranch || 'Fikkal Branch, Suryodaya-10, Ilam');
        setRbbQrCodeUrl(profile.paymentQrSettings.rbbQrCodeUrl || '');

        setEsewaAccountName(profile.paymentQrSettings.esewaAccountName || 'RELIABLETECH (OFFICIAL)');
        setEsewaId(profile.paymentQrSettings.esewaId || '9852680456');
        setEsewaQrCodeUrl(profile.paymentQrSettings.esewaQrCodeUrl || '');

        setSahakariName(profile.paymentQrSettings.sahakariName || 'Suryodaya Multipurpose Cooperative Ltd.');
        setSahakariAccountName(profile.paymentQrSettings.sahakariAccountName || 'RELIABLETECH SS PVT');
        setSahakariAccountNumber(profile.paymentQrSettings.sahakariAccountNumber || '001-045-88910');
        setSahakariQrCodeUrl(profile.paymentQrSettings.sahakariQrCodeUrl || '');
        setQrInstructions(profile.paymentQrSettings.instructions || 'Scan the official QR code using mobile banking or digital wallet. Upload payment receipt screenshot during checkout or in order tracking for rapid 5-minute counter verification.');
      }
    }
  }, [profile]);
  
  const [profileSaved, setProfileSaved] = useState(false);
  const [qrSaved, setQrSaved] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  // Corporate Letterhead Preview states
  const [previewDocType, setPreviewDocType] = useState<LetterheadDocType>('Invoice');
  const [previewIsNepali, setPreviewIsNepali] = useState(false);

  // Custom Units local states
  const [newUnitName, setNewUnitName] = useState('');
  const [unitError, setUnitError] = useState('');

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    setUnitError('');
    const unitText = newUnitName.trim();
    if (!unitText) return;

    if (units.some(u => u.toLowerCase() === unitText.toLowerCase())) {
      setUnitError('This unit is already added.');
      return;
    }

    onUpdateUnits([...units, unitText]);
    setNewUnitName('');
  };

  const handleDeleteUnit = (unitToDelete: string) => {
    const protectedUnits = ['Flat', 'Hourly', 'Monthly', 'Per Unit'];
    if (protectedUnits.includes(unitToDelete)) {
      alert(`Standard system unit '${unitToDelete}' cannot be deleted.`);
      return;
    }
    if (confirm(`Are you sure you want to delete unit '${unitToDelete}'?`)) {
      onUpdateUnits(units.filter(u => u !== unitToDelete));
    }
  };

  // User Management Form states
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRealName, setNewRealName] = useState('');
  const [newNameNepali, setNewNameNepali] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Admin' | 'User' | 'Shareholder'>('User');
  const [newPassword, setNewPassword] = useState('');
  const [newPost, setNewPost] = useState('');
  const [newDesignationNepali, setNewDesignationNepali] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newContactNumber, setNewContactNumber] = useState('');
  const [newCitizenshipNumber, setNewCitizenshipNumber] = useState('');
  const [newIssueDate, setNewIssueDate] = useState('');
  const [newIssueDistrictAndOffice, setNewIssueDistrictAndOffice] = useState('');
  const [newMonthlySalary, setNewMonthlySalary] = useState('');
  const [newStaffId, setNewStaffId] = useState('');
  const [userError, setUserError] = useState('');
  
  // Password Editing States
  const [editingUserPasswordId, setEditingUserPasswordId] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState<string>('');

  // Full User Edit Modal State for @reliableadmin
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserNameNepali, setEditUserNameNepali] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPost, setEditUserPost] = useState('');
  const [editUserDesignationNepali, setEditUserDesignationNepali] = useState('');
  const [editUserUsername, setEditUserUsername] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserRole, setEditUserRole] = useState<'Super Admin' | 'Admin' | 'User' | 'Shareholder'>('User');
  const [editUserStaffId, setEditUserStaffId] = useState('');
  const [editUserContactNumber, setEditUserContactNumber] = useState('');
  const [editUserAddress, setEditUserAddress] = useState('');
  const [editUserCitizenshipNumber, setEditUserCitizenshipNumber] = useState('');
  const [editUserIssueDate, setEditUserIssueDate] = useState('');
  const [editUserIssueDistrictAndOffice, setEditUserIssueDistrictAndOffice] = useState('');
  const [editUserMonthlySalary, setEditUserMonthlySalary] = useState('');
  const [editUserProfilePhoto, setEditUserProfilePhoto] = useState('');
  const [editUserPhotoApproved, setEditUserPhotoApproved] = useState<boolean>(true);

  const handleOpenEditUserModal = (u: AppUser) => {
    setEditingUser(u);
    setEditUserName(u.name || '');
    setEditUserNameNepali(u.nameNepali || '');
    setEditUserEmail(u.email || '');
    setEditUserPost(u.post || '');
    setEditUserDesignationNepali(u.designationNepali || '');
    setEditUserUsername(u.username || '');
    setEditUserPassword(u.password || '');
    setEditUserRole(u.role || 'User');
    setEditUserStaffId(u.staffId || '');
    setEditUserContactNumber(u.contactNumber || '');
    setEditUserAddress(u.address || '');
    setEditUserCitizenshipNumber(u.citizenshipNumber || '');
    setEditUserIssueDate(u.issueDate || '');
    setEditUserIssueDistrictAndOffice(u.issueDistrictAndOffice || '');
    setEditUserMonthlySalary(u.monthlySalary ? String(u.monthlySalary) : '');
    setEditUserProfilePhoto(u.profilePhoto || '');
    setEditUserPhotoApproved(u.photoApproved ?? true);
  };

  const handleEditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('Image size should be less than 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditUserProfilePhoto(reader.result as string);
        setEditUserPhotoApproved(true); // Approved when set by @reliableadmin
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editUserName.trim() || !editUserUsername.trim()) {
      alert('Full Name and Username are required.');
      return;
    }

    const updatedUsers = users.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          name: editUserName.trim(),
          nameNepali: editUserNameNepali.trim(),
          email: editUserEmail.trim(),
          post: editUserPost.trim(),
          designationNepali: editUserDesignationNepali.trim(),
          username: editUserUsername.trim(),
          password: editUserPassword.trim(),
          role: editUserRole,
          staffId: editUserStaffId.trim(),
          contactNumber: editUserContactNumber.trim(),
          address: editUserAddress.trim(),
          citizenshipNumber: editUserCitizenshipNumber.trim(),
          issueDate: editUserIssueDate.trim(),
          issueDistrictAndOffice: editUserIssueDistrictAndOffice.trim(),
          monthlySalary: Number(editUserMonthlySalary) || 0,
          profilePhoto: editUserProfilePhoto,
          photoApproved: editUserProfilePhoto ? editUserPhotoApproved : true
        };
      }
      return u;
    });

    onUpdateUsers(updatedUsers);
    setEditingUser(null);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    if (!newUsername.trim() || !newRealName.trim() || !newPassword.trim() || !newPost.trim() || !newAddress.trim() || !newContactNumber.trim() || !newCitizenshipNumber.trim() || !newIssueDate.trim() || !newIssueDistrictAndOffice.trim() || !newMonthlySalary.trim()) {
      setUserError('All fields (including staff details, username, and password) are required.');
      return;
    }

    const normalizedUsername = newUsername.trim().toLowerCase();
    const exists = users.some(u => u.username.toLowerCase() === normalizedUsername);
    if (exists) {
      setUserError('A user account with this username already exists.');
      return;
    }

    const newUser: AppUser = {
      id: `usr-${Date.now()}`,
      username: newUsername.trim(),
      email: newEmail.trim(),
      name: newRealName.trim(),
      nameNepali: newNameNepali.trim(),
      role: newUserRole,
      password: newPassword.trim(),
      post: newPost.trim(),
      designationNepali: newDesignationNepali.trim(),
      address: newAddress.trim(),
      contactNumber: newContactNumber.trim(),
      citizenshipNumber: newCitizenshipNumber.trim(),
      issueDate: newIssueDate.trim(),
      issueDistrictAndOffice: newIssueDistrictAndOffice.trim(),
      monthlySalary: Number(newMonthlySalary) || 0,
      staffId: newStaffId.trim() || `RT-STAFF-${Math.floor(100 + Math.random() * 900)}`
    };

    onUpdateUsers([...users, newUser]);
    setNewUsername('');
    setNewEmail('');
    setNewRealName('');
    setNewNameNepali('');
    setNewPassword('');
    setNewUserRole('User');
    setNewPost('');
    setNewDesignationNepali('');
    setNewAddress('');
    setNewContactNumber('');
    setNewCitizenshipNumber('');
    setNewIssueDate('');
    setNewIssueDistrictAndOffice('');
    setNewMonthlySalary('');
    setNewStaffId('');
  };

  const handleDeleteUser = (id: string, username: string) => {
    const isSystemMaster = currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin';
    if (!isSystemMaster) {
      alert("Direct deletion of user accounts is allowed for System Master (@reliableadmin) only.");
      return;
    }
    if (username.toLowerCase() === 'reliableadmin' || username.toLowerCase() === 'arpan') {
      alert("The master account 'reliableadmin' cannot be deleted to prevent system lockouts.");
      return;
    }
    if (confirm(`Are you sure you want to delete user account '${username}'?`)) {
      onUpdateUsers(users.filter(u => u.id !== id));
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      name: name.trim(),
      companyNameNepali: companyNameNepali.trim(),
      companySubtitle: companySubtitle.trim(),
      companySubtitleNepali: companySubtitleNepali.trim(),
      location: location.trim(),
      addressNepali: addressNepali.trim(),
      phone: phone.trim(),
      email: email.trim(),
      panNumber: panNumber.trim(),
      logoUrl: logoUrl,
      estdYear: estdYear.trim(),
      customerChatQuickReply: customerChatQuickReply.trim(),
      paymentQrSettings: {
        rbbAccountName: rbbAccountName.trim(),
        rbbAccountNumber: rbbAccountNumber.trim(),
        rbbBranch: rbbBranch.trim(),
        rbbQrCodeUrl: rbbQrCodeUrl.trim(),

        esewaAccountName: esewaAccountName.trim(),
        esewaId: esewaId.trim(),
        esewaQrCodeUrl: esewaQrCodeUrl.trim(),

        sahakariName: sahakariName.trim(),
        sahakariAccountName: sahakariAccountName.trim(),
        sahakariAccountNumber: sahakariAccountNumber.trim(),
        sahakariQrCodeUrl: sahakariQrCodeUrl.trim(),

        instructions: qrInstructions.trim()
      }
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleSavePaymentQrSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      paymentQrSettings: {
        rbbAccountName: rbbAccountName.trim(),
        rbbAccountNumber: rbbAccountNumber.trim(),
        rbbBranch: rbbBranch.trim(),
        rbbQrCodeUrl: rbbQrCodeUrl.trim(),

        esewaAccountName: esewaAccountName.trim(),
        esewaId: esewaId.trim(),
        esewaQrCodeUrl: esewaQrCodeUrl.trim(),

        sahakariName: sahakariName.trim(),
        sahakariAccountName: sahakariAccountName.trim(),
        sahakariAccountNumber: sahakariAccountNumber.trim(),
        sahakariQrCodeUrl: sahakariQrCodeUrl.trim(),

        instructions: qrInstructions.trim()
      }
    });
    setQrSaved(true);
    setTimeout(() => setQrSaved(false), 3000);
  };

  const handleRbbQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Please choose a QR code image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setRbbQrCodeUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEsewaQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Please choose a QR code image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEsewaQrCodeUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSahakariQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Please choose a QR code image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSahakariQrCodeUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 250 * 1024) {
        alert('Please choose a smaller image (under 250KB) to ensure reliable browser persistence.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Export as Full System JSON Backup
  const handleExportJSON = () => {
    const fullBackup = {
      profile,
      services,
      suppliers,
      transactions,
      invoices,
      users,
      units,
      openingBalances,
      exportTimestamp: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `rtssdatabase_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Restore System using rtssdatabase.db or JSON Backup file
  const handleRestoreDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportSuccess(false);
    setImportSuccessMsg('');
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsRestoring(true);

    try {
      const fileNameLower = file.name.toLowerCase();
      const isSqliteDb = fileNameLower.endsWith('.db') || fileNameLower.endsWith('.sqlite') || fileNameLower.endsWith('.sqlite3');

      if (isSqliteDb) {
        // Direct SQLite Database Restore (.db file)
        if (onRestoreDbFile) {
          await onRestoreDbFile(file);
        } else {
          // Fallback direct base64 upload to /api/db/upload
          const base64Str = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              resolve(dataUrl.split(',')[1]);
            };
            reader.onerror = () => reject(new Error('Failed to read file from disk'));
            reader.readAsDataURL(file);
          });

          const res = await fetch('/api/db/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileBase64: base64Str, fileName: file.name })
          });

          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error || 'Failed to mount uploaded database into rtssdatabase.db');
          }

          const result = await res.json();
          if (result.loadedData) {
            onImportDatabase(result.loadedData);
          }
        }

        setImportSuccess(true);
        setImportSuccessMsg(`Database "${file.name}" copied and saved to rtssdatabase.db successfully! All company records, ledgers, and accounts are synchronized.`);
        setTimeout(() => setImportSuccess(false), 7000);
      } else {
        // JSON Backup file restore
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
          onImportDatabase(parsed);
          // Persist to server SQLite backend
          await fetch('/api/db/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed)
          }).catch(err => console.warn('Backend SQLite sync note:', err));

          setImportSuccess(true);
          setImportSuccessMsg(`JSON backup file "${file.name}" imported and saved to rtssdatabase.db successfully!`);
          setTimeout(() => setImportSuccess(false), 7000);
        } else {
          setImportError('Invalid backup file structure. Ensure the file is a valid JSON document.');
        }
      }
    } catch (err: any) {
      console.error('Database restore error:', err);
      setImportError(err?.message || 'Error restoring database file. Please verify the file is a valid rtssdatabase.db or JSON backup.');
    } finally {
      setIsRestoring(false);
      // Reset input value so selecting the same file again works
      e.target.value = '';
    }
  };

  // Legendary "Export Standalone Portable HTML App" generator
  const handleExportHTML = () => {
    const backupData = {
      profile,
      services,
      suppliers,
      transactions,
      invoices
    };

    const standaloneHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${profile.name} - Record Keeping System (Fikkal, Ilam)</title>
  <!-- Tailwind CSS Play CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
  <!-- Lucide Icons Script -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
    }
    .font-display {
      font-family: 'Space Grotesk', sans-serif;
    }
  </style>
</head>
<body class="min-h-screen flex flex-col pb-12">

  <!-- Header Banner -->
  <header class="bg-slate-900 text-white border-b border-slate-800 shadow-md">
    <div class="max-w-7xl mx-auto px-4 py-5 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Standalone Local Storage Edition</span>
        </div>
        <h1 class="text-2xl font-bold font-display tracking-tight" id="header-business-name">${profile.name}</h1>
        <p class="text-xs text-slate-400">📍 <span id="header-location">${profile.location}</span> | 📞 <span id="header-phone">${profile.phone}</span></p>
      </div>
      <div class="flex flex-wrap gap-2.5">
        <button onclick="switchTab('dashboard')" class="tab-btn px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700" id="tab-dashboard-btn">Dashboard</button>
        <button onclick="switchTab('services')" class="tab-btn px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 transition hover:bg-slate-700" id="tab-services-btn">Services</button>
        <button onclick="switchTab('suppliers')" class="tab-btn px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 transition hover:bg-slate-700" id="tab-suppliers-btn">Suppliers</button>
        <button onclick="switchTab('transactions')" class="tab-btn px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 transition hover:bg-slate-700" id="tab-transactions-btn">Purchase Ledger</button>
      </div>
    </div>
  </header>

  <!-- Main Workspace -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
    
    <!-- DASHBOARD VIEW -->
    <section id="view-dashboard" class="view-panel space-y-8">
      <div class="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-6 shadow-md">
        <h2 class="text-xl font-bold font-display">Business Record Dashboard</h2>
        <p class="text-xs text-slate-300 mt-1">This is a portable, independent, offline HTML document. Changes you make below persist locally inside your current web browser storage.</p>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div class="bg-white/5 p-4 rounded-lg border border-white/10">
            <span class="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">Total Services</span>
            <span id="stat-services-val" class="text-2xl font-bold font-display mt-1 block">0</span>
          </div>
          <div class="bg-white/5 p-4 rounded-lg border border-white/10">
            <span class="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">Total Suppliers</span>
            <span id="stat-suppliers-val" class="text-2xl font-bold font-display mt-1 block">0</span>
          </div>
          <div class="bg-white/5 p-4 rounded-lg border border-white/10">
            <span class="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">Total Credit Due</span>
            <span id="stat-dues-val" class="text-2xl font-bold font-display mt-1 block">Rs. 0</span>
          </div>
          <div class="bg-white/5 p-4 rounded-lg border border-white/10">
            <span class="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">Logged Purchases</span>
            <span id="stat-orders-val" class="text-2xl font-bold font-display mt-1 block">0</span>
          </div>
        </div>
      </div>

      <!-- Quick Metadata Details -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white border border-slate-200 rounded-xl p-6">
          <h3 class="font-bold font-display text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
            <i data-lucide="info" class="w-4 h-4 text-indigo-500"></i>
            <span>Reliabletech Profile Information</span>
          </h3>
          <div class="space-y-2.5 text-xs text-slate-600 mt-4">
            <p><strong>Business Name:</strong> <span id="profile-name"></span></p>
            <p><strong>Physical Address:</strong> <span id="profile-location"></span></p>
            <p><strong>Phone Contact:</strong> <span id="profile-phone"></span></p>
            <p><strong>Email Address:</strong> <span id="profile-email"></span></p>
            <p><strong>PAN registration:</strong> <span id="profile-pan"></span></p>
          </div>
        </div>

        <div class="bg-emerald-50/50 border border-emerald-100 rounded-xl p-6 flex gap-4 items-start">
          <div class="p-3 bg-emerald-500 text-white rounded-full"><i data-lucide="award"></i></div>
          <div class="space-y-1">
            <h4 class="font-bold text-emerald-950 font-display">Offline Portable Tool</h4>
            <p class="text-xs text-emerald-850 leading-relaxed">
              This standalone document contains all your data. You can email it, copy it to a flash drive, and double click it anywhere without internet. It uses browser <strong class="text-emerald-900">localStorage</strong> to save any updates you input while offline.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- SERVICES VIEW -->
    <section id="view-services" class="view-panel hidden space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold font-display text-slate-800">Services Catalog</h2>
        <div class="bg-slate-200 text-slate-700 px-3 py-1 rounded-lg text-xs font-semibold">Offline Viewer</div>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-4 flex gap-4">
        <input type="text" id="service-search" oninput="renderServices()" placeholder="Search services..." class="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500">
      </div>
      <div id="services-grid" class="grid grid-cols-1 md:grid-cols-3 gap-6"></div>
    </section>

    <!-- SUPPLIERS VIEW -->
    <section id="view-suppliers" class="view-panel hidden space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold font-display text-slate-800">Suppliers Directory</h2>
        <div class="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg text-xs font-semibold">Offline Viewer</div>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-4 flex gap-4">
        <input type="text" id="supplier-search" oninput="renderSuppliers()" placeholder="Search suppliers..." class="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500">
      </div>
      <div id="suppliers-grid" class="grid grid-cols-1 md:grid-cols-3 gap-6"></div>
    </section>

    <!-- TRANSACTIONS VIEW -->
    <section id="view-transactions" class="view-panel hidden space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold font-display text-slate-800">Procurement Ledger</h2>
        <div class="bg-slate-200 text-slate-700 px-3 py-1 rounded-lg text-xs font-semibold">Offline Ledger</div>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider font-mono text-[10px]">
              <th class="px-6 py-3.5">Date</th>
              <th class="px-6 py-3.5">Supplier</th>
              <th class="px-6 py-3.5">Items Purchased</th>
              <th class="px-6 py-3.5 text-right">Amt Paid</th>
              <th class="px-6 py-3.5 text-right">Amt Due</th>
              <th class="px-6 py-3.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody id="transactions-body" class="divide-y divide-slate-100"></tbody>
        </table>
      </div>
    </section>

  </main>

  <footer class="text-center text-slate-400 text-[10px] mt-12 font-mono">
    Generated from Reliabletech Online workspace on ${new Date().toLocaleDateString()}. Fikkal, Ilam.
  </footer>

  <!-- DATABASE EMBED -->
  <script>
    // Embedded Data fallback if localStorage is empty
    const DEFAULT_DB = ${JSON.stringify(backupData)};

    // Database Initialization
    function getDB() {
      const stored = localStorage.getItem('reliabletech_standalone_db');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch(e) {
          return DEFAULT_DB;
        }
      }
      localStorage.setItem('reliabletech_standalone_db', JSON.stringify(DEFAULT_DB));
      return DEFAULT_DB;
    }

    const db = getDB();

    // Tab switcher
    function switchTab(tabId) {
      document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));
      document.getElementById('view-' + tabId).classList.remove('hidden');

      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('bg-indigo-600', 'text-white');
        b.classList.add('bg-slate-800', 'text-slate-300');
      });
      const activeBtn = document.getElementById('tab-' + tabId + '-btn');
      activeBtn.classList.remove('bg-slate-800', 'text-slate-300');
      activeBtn.classList.add('bg-indigo-600', 'text-white');
    }

    // Render Stats
    function updateStats() {
      document.getElementById('stat-services-val').innerText = db.services.length;
      document.getElementById('stat-suppliers-val').innerText = db.suppliers.length;
      
      const totalDue = db.suppliers.reduce((sum, s) => sum + Number(s.creditBalance || 0), 0);
      document.getElementById('stat-dues-val').innerText = 'Rs. ' + totalDue.toLocaleString();
      document.getElementById('stat-orders-val').innerText = db.transactions.length;

      // Header Profile Sync
      document.getElementById('header-business-name').innerText = db.profile.name;
      document.getElementById('header-location').innerText = db.profile.location;
      document.getElementById('header-phone').innerText = db.profile.phone;
      
      // Profile Info Card Sync
      document.getElementById('profile-name').innerText = db.profile.name;
      document.getElementById('profile-location').innerText = db.profile.location;
      document.getElementById('profile-phone').innerText = db.profile.phone;
      document.getElementById('profile-email').innerText = db.profile.email;
      document.getElementById('profile-pan').innerText = db.profile.panNumber;
    }

    // Render Services
    function renderServices() {
      const query = document.getElementById('service-search').value.toLowerCase();
      const grid = document.getElementById('services-grid');
      grid.innerHTML = '';

      db.services.forEach(srv => {
        if (!srv.name.toLowerCase().includes(query) && !srv.description.toLowerCase().includes(query)) return;

        const card = document.createElement('div');
        card.className = "bg-white border border-slate-200 rounded-xl overflow-hidden p-5 space-y-3";
        card.innerHTML = \`
          <div class="flex justify-between items-center">
            <span class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">\${srv.category}</span>
            <span class="text-[10px] font-semibold text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-50">\${srv.status}</span>
          </div>
          <h4 class="font-bold text-slate-800 text-sm">\${srv.name}</h4>
          <p class="text-xs text-slate-500 line-clamp-3 leading-relaxed">\${srv.description}</p>
          <div class="border-t border-slate-100 pt-3 flex justify-between items-baseline">
            <span class="text-[10px] uppercase font-mono text-slate-400">Rate / Price</span>
            <div>
              <span class="font-bold text-slate-900 text-sm">Rs. \${srv.priceRate.toLocaleString()}</span>
              <span class="text-[10px] text-slate-500"> / \${srv.rateType}</span>
            </div>
          </div>
        \`;
        grid.appendChild(card);
      });
    }

    // Render Suppliers
    function renderSuppliers() {
      const query = document.getElementById('supplier-search').value.toLowerCase();
      const grid = document.getElementById('suppliers-grid');
      grid.innerHTML = '';

      db.suppliers.forEach(sup => {
        if (!sup.name.toLowerCase().includes(query) && !sup.productsSupplied.toLowerCase().includes(query)) return;

        const card = document.createElement('div');
        card.className = "bg-white border border-slate-200 rounded-xl overflow-hidden p-5 flex flex-col justify-between h-full";
        
        let stars = '';
        for (let i = 0; i < 5; i++) {
          stars += \`<i data-lucide="star" class="w-3 h-3 \${i < sup.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}"></i>\`;
        }

        card.innerHTML = \`
          <div class="space-y-3.5">
            <div class="flex justify-between items-start">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 uppercase">\${sup.status}</span>
              <div class="flex gap-0.5">\${stars}</div>
            </div>
            <h4 class="font-bold text-slate-800 text-sm font-display">\${sup.name}</h4>
            <div class="space-y-1.5 text-xs text-slate-600">
              <p>📍 \${sup.address}</p>
              <p>📞 \${sup.phone}</p>
              <p>👤 \${sup.contactPerson}</p>
            </div>
            <div class="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span class="text-[9px] uppercase font-mono text-slate-400 tracking-wider">Supplies Inventory</span>
              <p class="text-[11px] text-slate-700 font-medium truncate">\${sup.productsSupplied}</p>
            </div>
          </div>
          <div class="border-t border-slate-100 pt-3.5 mt-4 flex justify-between items-center">
            <span class="text-[9px] uppercase font-mono text-slate-400">Credit Balance</span>
            <span class="text-xs font-bold font-mono \${sup.creditBalance > 0 ? 'text-rose-600' : 'text-slate-700'}">Rs. \${Number(sup.creditBalance || 0).toLocaleString()}</span>
          </div>
        \`;
        grid.appendChild(card);
      });
      lucide.createIcons();
    }

    // Render Ledger
    function renderTransactions() {
      const tbody = document.getElementById('transactions-body');
      tbody.innerHTML = '';

      db.transactions.forEach(tx => {
        const supplier = db.suppliers.find(s => s.id === tx.supplierId);
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50";
        tr.innerHTML = \`
          <td class="px-6 py-4 font-mono text-slate-500 whitespace-nowrap">\${tx.date}</td>
          <td class="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">\${supplier ? supplier.name : 'Unknown Vendor'}</td>
          <td class="px-6 py-4 max-w-sm"><p class="font-medium text-slate-800 line-clamp-1">\${tx.itemsBought}</p></td>
          <td class="px-6 py-4 text-right font-mono text-emerald-600">Rs. \${tx.amountPaid.toLocaleString()}</td>
          <td class="px-6 py-4 text-right font-mono text-rose-600 font-medium">Rs. \${tx.amountDue.toLocaleString()}</td>
          <td class="px-6 py-4 text-center whitespace-nowrap">
            <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold \${
              tx.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }">\${tx.status}</span>
          </td>
        \`;
        tbody.appendChild(tr);
      });
    }

    // Bootloader
    window.onload = () => {
      updateStats();
      renderServices();
      renderSuppliers();
      renderTransactions();
      lucide.createIcons();
    };
  </script>
</body>
</html>`;

    const blob = new Blob([standaloneHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `reliabletech_portable_${new Date().toISOString().split('T')[0]}.html`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadManual = (role: 'Admin' | 'User') => {
    const isAdmin = role === 'Admin';
    const manualTitle = isAdmin ? 'Reliabletech Enterprise - Administrator Operations Manual' : 'Reliabletech Enterprise - Staff Operations Manual';
    
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${manualTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;500&display=swap');
    
    * {
      box-sizing: border-box;
    }
    body {
      font-family: "Inter", -apple-system, sans-serif;
      color: #1e293b;
      position: relative;
    }
    .watermark-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 10000;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      align-items: center;
      opacity: 0.025;
      user-select: none;
    }
    .watermark-text {
      font-size: 42px;
      font-weight: 800;
      font-family: 'Space Grotesk', sans-serif;
      color: #0f172a;
      transform: rotate(-30deg);
      white-space: nowrap;
      margin: 120px 0;
      letter-spacing: 2px;
    }
      line-height: 1.6;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .no-print-bar {
      background-color: #0f172a;
      color: #f8fafc;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }
    .btn-print {
      background-color: #6366f1;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background-color 0.2s;
    }
    .btn-print:hover {
      background-color: #4f46e5;
    }
    .manual-container {
      max-width: 850px;
      margin: 40px auto;
      background-color: #ffffff;
      padding: 60px 80px;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      border-radius: 16px;
      border: 1px solid #e2e8f0;
    }
    
    /* Cover Page */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 900px;
      page-break-after: always;
      padding-bottom: 40px;
    }
    .cover-header {
      border-left: 5px solid #4f46e5;
      padding-left: 24px;
      margin-top: 100px;
    }
    .company-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #4f46e5;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 2px;
      margin: 0;
    }
    .main-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 42px;
      line-height: 1.1;
      font-weight: 700;
      color: #0f172a;
      margin: 12px 0 20px 0;
    }
    .subtitle {
      font-size: 16px;
      color: #64748b;
      max-width: 500px;
      margin: 0;
    }
    .cover-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .meta-item {
      font-size: 11px;
      color: #94a3b8;
    }
    .meta-item strong {
      color: #475569;
      display: block;
      font-size: 12px;
      margin-bottom: 2px;
    }
    
    /* Document elements */
    h1, h2, h3, h4 {
      font-family: 'Space Grotesk', sans-serif;
      color: #0f172a;
    }
    h1 {
      font-size: 24px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 12px;
      margin-top: 48px;
      margin-bottom: 24px;
      page-break-before: always;
    }
    h2 {
      font-size: 18px;
      color: #1e293b;
      margin-top: 32px;
      margin-bottom: 16px;
    }
    h3 {
      font-size: 15px;
      color: #334155;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    p {
      font-size: 14px;
      color: #334155;
      margin-top: 0;
      margin-bottom: 16px;
      text-align: justify;
    }
    ol, ul {
      margin-top: 0;
      margin-bottom: 16px;
      padding-left: 24px;
    }
    li {
      font-size: 14px;
      color: #334155;
      margin-bottom: 8px;
    }
    .toc-title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 40px;
      margin-bottom: 20px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
    }
    .toc-list {
      list-style: none;
      padding: 0;
    }
    .toc-item {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 12px;
      font-size: 14px;
    }
    .toc-name {
      font-weight: 600;
      color: #1e293b;
    }
    .toc-dots {
      flex: 1;
      border-bottom: 1px dotted #cbd5e1;
      margin: 0 12px;
    }
    .toc-page {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 500;
      color: #64748b;
    }
    .callout {
      background-color: #f1f5f9;
      border-left: 4px solid #64748b;
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
      margin: 20px 0;
    }
    .callout-info {
      background-color: #eef2ff;
      border-left: 4px solid #4f46e5;
    }
    .callout-warning {
      background-color: #fffbeb;
      border-left: 4px solid #d97706;
    }
    .callout-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #1e293b;
      margin-top: 0;
      margin-bottom: 6px;
    }
    .table-container {
      overflow-x: auto;
      margin: 24px 0;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background-color: #f8fafc;
      font-weight: 600;
      color: #1e293b;
    }
    
    /* Print Styles */
    @media print {
      body {
        background-color: #ffffff;
        color: #000000;
      }
      .no-print-bar {
        display: none !important;
      }
      .manual-container {
        max-width: 100%;
        margin: 0;
        padding: 0;
        box-shadow: none;
        border: none;
        border-radius: 0;
      }
      @page {
        size: A4;
        margin: 20mm;
      }
      .watermark-container {
        display: flex !important;
        opacity: 0.04 !important;
      }
    }
  </style>
</head>
<body>
  <div class="watermark-container">
    <div class="watermark-text">RTSS-IDMS developed by Arpan Khadka (अर्पण खड्का)</div>
    <div class="watermark-text">RTSS-IDMS developed by Arpan Khadka (अर्पण खड्का)</div>
    <div class="watermark-text">RTSS-IDMS developed by Arpan Khadka (अर्पण खड्का)</div>
    <div class="watermark-text">RTSS-IDMS developed by Arpan Khadka (अर्पण खड्का)</div>
    <div class="watermark-text">RTSS-IDMS developed by Arpan Khadka (अर्पण खड्का)</div>
    <div class="watermark-text">RTSS-IDMS developed by Arpan Khadka (अर्पण खड्का)</div>
  </div>
  <div class="no-print-bar">
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 18px;">📘</span>
      <span style="font-weight: 700; font-family: 'Space Grotesk', sans-serif;">Reliabletech Manual Delivery Desk</span>
    </div>
    <button class="btn-print" onclick="window.print()">
      <span>🖨️</span>
      <span>Save as PDF or Print Manual</span>
    </button>
  </div>
  
  <div class="manual-container">
    <div class="cover-page">
      <div class="cover-header">
        <p class="company-tag">${profile.name || 'Reliabletech Services'}</p>
        <h1 class="main-title" style="border:none; padding:0; margin: 12px 0 20px 0; page-break-before: avoid;">${isAdmin ? 'Systems & Operations<br>Administrator Manual' : 'Business Suite & CRM<br>Staff Operations Manual'}</h1>
        <p class="subtitle">Complete, step-by-step corporate guide to operating, audit-logging, and maintaining the Reliabletech Enterprise ledger system.</p>
      </div>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; font-size: 13px;">
        <strong style="color: #0f172a; display: block; margin-bottom: 6px;">📄 System Notice:</strong>
        This document has been dynamically compiled from your active business settings on <strong style="font-family: 'JetBrains Mono', monospace;">2026-07-08</strong>. Keep a physical copy filed at your front desk for internal employee auditing and training reference.
      </div>
      
      <div class="cover-footer">
        <div>
          <span class="meta-item"><strong>AUTHORIZED BY</strong>${profile.name || 'Reliabletech Services'} Board of Directors</span>
        </div>
        <div>
          <span class="meta-item"><strong>VAT/PERSONAL ACCOUNT NUMBER (PAN)</strong>${profile.panNumber || '612345678'}</span>
        </div>
        <div>
          <span class="meta-item"><strong>DOCUMENT CLASSIFICATION</strong>INTERNAL COMPLIANCE ONLY</span>
        </div>
      </div>
    </div>
    
    <!-- Table of Contents -->
    <div style="page-break-after: always; padding-top: 40px;">
      <div class="toc-title">Table of Contents</div>
      <ul class="toc-list">
        ${isAdmin ? `
        <li class="toc-item">
          <span class="toc-name">Chapter 1: Admin System Initialization &amp; Onboarding</span>
          <span class="toc-dots"></span>
          <span class="toc-page">Page 2</span>
        </li>
        <li class="toc-item">
          <span class="toc-name">Chapter 2: Financial Ledger Audit &amp; Security Control</span>
          <span class="toc-dots"></span>
          <span class="toc-page">Page 3</span>
        </li>
        <li class="toc-item">
          <span class="toc-name">Chapter 3: Daily Closing Operations &amp; Approval Gate</span>
          <span class="toc-dots"></span>
          <span class="toc-page">Page 4</span>
        </li>
        <li class="toc-item">
          <span class="toc-name">Chapter 4: Supplier Directory &amp; Purchase Orders (PO)</span>
          <span class="toc-dots"></span>
          <span class="toc-page">Page 5</span>
        </li>
        <li class="toc-item">
          <span class="toc-name">Chapter 5: Staff Attendance &amp; Salary Payroll Settlement</span>
          <span class="toc-dots"></span>
          <span class="toc-page">Page 6</span>
        </li>
        <li class="toc-item">
          <span class="toc-name">Chapter 6: Backup Records &amp; Portable HTML Exporting</span>
          <span class="toc-dots"></span>
          <span class="toc-page">Page 7</span>
        </li>
        <li class="toc-item">
          <span class="toc-name">Chapter 7: Fixed Assets Registry &amp; Depreciation Tracking</span>
          <span class="toc-dots"></span>
          <span class="toc-page">Page 8</span>
        </li>
        <li class="toc-item">
          <span class="toc-name">Chapter 8: Universal Print Engine &amp; Watermark Customization</span>
          <span class="toc-dots"></span>
          <span class="toc-page">Page 9</span>
        </li>
        ` : `
        <li class="toc-item">
          <span class="toc-name">Chapter 1: Staff Account Access &amp; Secure Dashboard</span>
          <span class="toc-dots"></span>
          <span class="toc-page">Page 2</span>
        </li>
        <li class="toc-item">
          <span class="toc-name">Chapter 2: Sales, Billing, &amp; Tax Invoice Creation</span>
          <span class="toc-dots"></span>
          <span class="toc-page">Page 3</span>
        </li>
        <li class="toc-item">
          <span class="toc-name">Chapter 3: Managing Customer Accounts &amp; Outstanding Dues</span>
          <span class="toc-dots"></span>
          <span class="toc-page">Page 4</span>
        </li>
        <li class="toc-item">
          <span class="toc-name">Chapter 4: Inventory Records &amp; Replenishment Requests</span>
          <span class="toc-dots"></span>
          <span class="toc-page">Page 5</span>
        </li>
        <li class="toc-item">
          <span class="toc-name">Chapter 5: Official Letters &amp; Communications Desk</span>
          <span class="toc-dots"></span>
          <span class="toc-page">Page 6</span>
        </li>
        <li class="toc-item">
          <span class="toc-name">Chapter 6: Attendance Logs, Leaves, &amp; Monthly Payslips</span>
          <span class="toc-dots"></span>
          <span class="toc-page">Page 7</span>
        </li>
        <li class="toc-item">
          <span class="toc-name">Chapter 7: Universal Print Engine &amp; Background Watermarks</span>
          <span class="toc-dots"></span>
          <span class="toc-page">Page 8</span>
        </li>
        `}
      </ul>

      <!-- System Creator Credit Block -->
      <div style="margin-top: 100px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #faf5ff;">
        <p style="margin: 0; font-weight: 700; color: #581c87; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-family: 'Space Grotesk', sans-serif;">💻 Software Engineering Credit Notice</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #3b0764; line-height: 1.5; text-align: justify;">
          This business automation suite, digital ledger engine, and database exporter application have been designed, architected, and fully developed by <strong>Arpan Khadka</strong>. For active support, custom technical expansions, or API upgrades, please reference these developer credentials during corporate board inquiries.
        </p>
      </div>
    </div>
    
    <!-- Chapters Content -->
    ${isAdmin ? `
    <!-- ADMIN MANUAL CONTENT -->
    
    <h1>Chapter 1: Admin System Initialization &amp; Onboarding</h1>
    <p>As the primary corporate Administrator of Reliabletech Services, your dashboard governs the primary configurations of the CRM and Ledger suite. Before delegating duties to counters, complete the initial setup parameters to ensure compliance with corporate accounting policies.</p>
    
    <h2>1.1 Customizing the Business Profile</h2>
    <p>To establish the official company attributes stamped onto all generated tax invoices, salary slip cards, and official communications, follow these points step by step:</p>
    <ol>
      <li>Navigate to the left-side sidebar navigation drawer and select the <strong>Settings</strong> tab.</li>
      <li>Locate the <strong>Business Profile &amp; Settings</strong> input form layout.</li>
      <li>In the <strong>Registered Name</strong> input field, enter the official registered name of your company (e.g., Reliabletech Services).</li>
      <li>In the <strong>Physical Location</strong> field, enter your complete physical postal address. This will be stamped onto letterheads and invoice headers.</li>
      <li>In the <strong>Helpline Phone</strong> and <strong>Email Address</strong> fields, enter your corporate contact details for client query resolutions.</li>
      <li>In the <strong>VAT/Personal Account Number (PAN)</strong> field, enter your governmental 9-digit registration sequence exactly. Double check to ensure it matches tax certificates.</li>
      <li>In the <strong>ESTD Year</strong> field, record the establishment year.</li>
      <li>To configure the <strong>Company Logo Asset</strong>, upload a small file (under 250KB PNG/JPEG) using the file select component, or assign a secure web-hosted image URL in the designated text input.</li>
      <li>Click the <strong>Save Profile Details</strong> button at the bottom of the form. The system will propagate these details globally immediately.</li>
    </ol>
    
    <div class="callout callout-info">
      <div class="callout-title">Onboarding Rule of Thumb</div>
      Company settings are globally reactive. Any modification to logo assets or Personal Account Numbers (PAN) instantly propagates to every active billing session, ensuring seamless operation.
    </div>
    
    <h2>1.2 Opening Balances Configurations</h2>
    <p>To adhere strictly to local bookkeeping standards, you must record the baseline opening balances when first adopting this platform. To configure your cash reserve indicators, follow these points step by step:</p>
    <ol>
      <li>Navigate to the <strong>Settings</strong> panel and locate the <strong>Opening Balances Configuration</strong> card.</li>
      <li>Under <strong>Rastriya Banijya Bank (RBB)</strong>, type your commercial bank ledger base balance count.</li>
      <li>Under <strong>E-Sewa Wallet</strong>, record your digital payment gateway reserve count.</li>
      <li>Under <strong>Sahakari Cooperatives</strong>, record cooperative savings/credit balance sheets.</li>
      <li>Under <strong>Cash in Hand</strong>, enter the physical drawer safe vault count.</li>
      <li>Enter the exact verification <strong>Date</strong> in the calendar picker to match your physical ledger statement confirmation.</li>
      <li>Click the image upload area to upload a statement statement photo or passbook scan to act as immutable administrative proof.</li>
      <li>Click <strong>Verify &amp; Set Opening Balances</strong>. The financial metrics immediately sync up across all widgets.</li>
    </ol>
    
    <h2>1.3 Employee Registration &amp; Password Administration</h2>
    <p>Staff members operate on limited, secure logins to perform daily tasks without accessing sensitive profit-and-loss files. To onboard an employee, follow these points step by step:</p>
    <ol>
      <li>Navigate to the <strong>Settings</strong> panel and scroll down to the <strong>Staff Directory &amp; Access Control</strong> widget.</li>
      <li>Click the <strong>Register New Staff Member</strong> button.</li>
      <li>Enter a unique, system-wide <strong>Username</strong> and secure starting <strong>Password</strong> for the employee.</li>
      <li>Record the employee's <strong>Official Name</strong>, <strong>Post/Designation</strong> (e.g., Senior Network Engineer), and <strong>Physical Address</strong>.</li>
      <li>Specify their monthly <strong>Basic Salary</strong> rate. This value acts as the baseline when calculating payroll sheets.</li>
      <li>Record the employee's <strong>Government Citizenship details</strong>: enter the Citizenship Card Number, B.S. Issue Date, and Issuing Authority Office.</li>
      <li>Click <strong>Register Employee</strong>. The new user is immediately appended to the registry and is authorized to sign into counter stations.</li>
      <li>To override or reset an employee's password, locate their card in the directory list, click <strong>Reset Password</strong>, type a new sequence, and click save.</li>
    </ol>
    
    
    <h1>Chapter 2: Financial Ledger Audit &amp; Security Control</h1>
    <p>To shield sensitive business data from counter operators, the system enforces strict architectural boundaries on access. This chapter describes how to maintain tight security over business intelligence.</p>
    
    <h2>2.1 Restricting Non-Admin Access</h2>
    <p>Counter operators and field personnel have no visibility into the company's financial indicators, preventing internal leaks and maintaining administrative privacy:</p>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Dashboard Widget or Tool</th>
            <th>Staff Account Visibility</th>
            <th>Admin Account Visibility</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Today's Sales Breakdown</strong> (Cash, Due, RBB, eSewa, Sahakari)</td>
            <td style="color: #16a34a; font-weight: 600;">Visible (Operations Allowed)</td>
            <td style="color: #16a34a; font-weight: 600;">Visible</td>
          </tr>
          <tr>
            <td><strong>Critical Low Stock Items</strong></td>
            <td style="color: #dc2626; font-weight: 600;">Hidden for Security</td>
            <td style="color: #16a34a; font-weight: 600;">Visible</td>
          </tr>
          <tr>
            <td><strong>Monthly Profit &amp; Loss Chart</strong></td>
            <td style="color: #dc2626; font-weight: 600;">Hidden for Security</td>
            <td style="color: #16a34a; font-weight: 600;">Visible</td>
          </tr>
          <tr>
            <td><strong>Cumulative Ledger Net Margins</strong></td>
            <td style="color: #dc2626; font-weight: 600;">Hidden for Security</td>
            <td style="color: #16a34a; font-weight: 600;">Visible</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <h2>2.2 Performing Transaction Ledgers Audits</h2>
    <p>To audit capital flow and verify double-entry bookkeeping records, follow these points step by step:</p>
    <ol>
      <li>Go to the main menu and select the <strong>Transactions &amp; Ledger</strong> panel.</li>
      <li>Review the comprehensive, chronological master list displaying client pay-ins, inventory restocking costs, and payroll outputs.</li>
      <li>Use the <strong>Account Filter</strong> dropdown to filter entries specifically for RBB Bank, eSewa, Sahakari, or Cash in Hand.</li>
      <li>To review a specific range, click the <strong>Date Filter</strong> fields, enter your Start Date and End Date, and click apply.</li>
      <li>To search for a specific receipt or ledger entity, type the invoice number or company name into the search box.</li>
      <li>To verify transaction metadata, click on a transaction line to inspect cash receipts or associated payment proofs.</li>
    </ol>
    
    
    <h1>Chapter 3: Daily Closing Operations &amp; Approval Gate</h1>
    <p>The system enforces a rigid Cash Reconciliation loop to block revenue leakage at the end of daily counters.</p>
    
    <h2>3.1 Understanding the Closing Request Workflow</h2>
    <ol>
      <li>At the close of business daily, the counter staff counts the remaining safe cash and inputs a structured <strong>Daily Closing Report</strong>.</li>
      <li>The staff registers the ending RBB, eSewa, and Sahakari balances, and breaks down physical cash into exact denomination counts (from Rs. 1000 down to Rs. 1 notes).</li>
      <li>Once submitted, the system locks that date's financial records, preventing staff from making late alterations.</li>
      <li>The report enters a "Submitted" state, visible on the Admin's Daily Closing terminal.</li>
    </ol>
    
    <h2>3.2 Auditing and Signing Off Daily Closings</h2>
    <p>To audit, approve, or reject day-end cash reconciliation logs submitted by counter staff, follow these points step by step:</p>
    <ol>
      <li>Navigate to the <strong>Daily Closing</strong> tab.</li>
      <li>Locate the "Pending Approval" logs submitted by counter operators.</li>
      <li>Click <strong>View Details</strong> to expand the denomination count worksheet (Rs. 1000, 500, 100 down to Rs. 1 coins).</li>
      <li>Review the expected system billing total alongside the physical counted sum reported by the employee.</li>
      <li>If the counts align exactly, click the <strong>Approve Closing</strong> button. The system will permanently lock that day's financial books and stamp a verified approval icon.</li>
      <li>If there is a cash mismatch or error, click the <strong>Decline &amp; Unlock</strong> button. Enter feedback explaining the error so the employee can review, fix entries, and resubmit.</li>
    </ol>
    
    <h2>3.3 Periodic Admin Closings &amp; Consensus Approval Desk</h2>
    <p>To audit global cash flows, verify multi-ledger alignments, and ensure robust corporate integrity, administrators must use the <strong>Periodic Closing Board</strong>. This module operates on a strict multi-admin consensus model across exactly five corporate accounts.</p>
    
    <h3>3.3.1 Accessing the Periodic Board</h3>
    <ol>
      <li>Go to the left-side sidebar navigation drawer and select the <strong>Daily Closing</strong> tab.</li>
      <li>In the top horizontal sub-tab bar, select <strong>Periodic Closings (Admin Only)</strong>. This workspace is strictly restricted to administrator users. Standard staff accounts have zero access or involvement.</li>
    </ol>
    
    <h3>3.3.2 Setting Up the 5-Account Ledger Matrix</h3>
    <p>The system computes and tracks assets across exactly five accounts. When preparing a draft periodic closing, you must specify closing values for:</p>
    <ul>
      <li><strong>RBB:</strong> Commercial Rastriya Banijya Bank ledger reserves.</li>
      <li><strong>Cash:</strong> Physical secure drawer coin and paper currency holdings.</li>
      <li><strong>eSewa:</strong> Digital mobile-wallet gateway receipts.</li>
      <li><strong>Sahakari:</strong> Cooperative Credit/Savings Union ledger balances.</li>
      <li><strong>Due:</strong> Outstanding client/vendor receivables and credit liabilities.</li>
    </ul>
    
    <h3>3.3.3 Visual Statement OCR Verification</h3>
    <p>For the bank and digital accounts (RBB, eSewa, Sahakari), the platform enforces visual image verification before finalization:</p>
    <ol>
      <li>Under the respective account, click the <strong>Upload Statement</strong> file select component.</li>
      <li>Select a statement screenshot or digital passbook photograph (JPEG, PNG under 2MB).</li>
      <li>Once uploaded, the embedded backend vision OCR simulation model parses the document content.</li>
      <li>Verify that the OCR-detected values match your ledger inputs exactly. If there is a discrepancy (e.g. statement balance does not match input balance), the system will flag the account with a red alert notice. Reconcile the ledger figures or clear discrepancies before proceeding.</li>
    </ol>
    
    <h3>3.3.4 Computing and Submitting the Draft Closing</h3>
    <ol>
      <li>Select the closing duration in the draft panel: <strong>Monthly</strong>, <strong>3 Monthly</strong>, <strong>6 Monthly</strong>, <strong>9 Monthly</strong>, or <strong>Annual</strong>.</li>
      <li>Enter the Reporting Period title (e.g., Asadh 2083).</li>
      <li>Click the <strong>Process Draft Closing</strong> button. The ledger engine will automatically aggregate inputs, evaluate profit-and-loss margins, record historical audit markers, and shift the draft state to <strong>Pending Meeting</strong>.</li>
    </ol>
    
    <h3>3.3.5 Enforcing Restrictive Editing &amp; Multi-Admin Approval Desk</h3>
    <p>No finalized or pending periodic closing can be changed directly. To safeguard audits, edits must pass a consensus gateway:</p>
    <ol>
      <li>Locate the active closing details card and locate the <strong>Consensus Gating</strong> panel.</li>
      <li>To request an edit, type an explicit reason under the <strong>Brief Remarks</strong> input field, explaining what adjustments are necessary (e.g., "Adjusting Sahakari interest accrual mismatch").</li>
      <li>Click <strong>Request Revision</strong>. The system locks the closing state into <strong>Pending Admin Consensus</strong> and registers an active consensus matrix.</li>
      <li><strong>Consensus Signoff:</strong> Every administrator registered in the system must review the revision remarks and explicitly sign-off. To approve, other admins must log in, click the <strong>Signoff Consensus Approval</strong> button.</li>
      <li>Once 100% of the active system administrators have logged their approval, the revision lock is successfully cleared, and the draft transitions back to <strong>Pending Meeting</strong>, unlocking fields for the requesting administrator to apply correction edits.</li>
    </ol>
    
    <h3>3.3.6 Recording Legal Metadata &amp; Permanent Signoff</h3>
    <p>To freeze the periodic report permanently and archive it, you must stamp the official board details:</p>
    <ol>
      <li>With the draft in <strong>Pending Meeting</strong> status, go to the <strong>Final Meeting Signoff</strong> input fields.</li>
      <li>Enter the official <strong>Meeting Date</strong>, <strong>Meeting Number</strong> (e.g., RTSS-M-2083/04), and board <strong>Decision Number</strong> (e.g., DEC-83-41) recorded in the company logs.</li>
      <li>Click the <strong>Freeze Data Permanently (Signoff)</strong> button. The closing record state changes permanently to <strong>Approved</strong>. The metrics are permanently frozen, and all related editing fields are disabled forever.</li>
      <li>Click <strong>Print Markdown</strong> or <strong>Show Print-Ready Data</strong> to render formatted report summaries. You can copy the generated Markdown output or print the report directly for administrative binders.</li>
    </ol>
    
    <h2>3.4 Nepalese Fiscal Year (FY), Rollovers &amp; Stock Continuity</h2>
    <p>To comply with standard Nepalese tax and corporate auditing guidelines, the system operates on a precise fiscal calendar and sequence control model:</p>
    
    <h3>3.4.1 Nepalese Fiscal Year Calendar</h3>
    <p>The Nepalese Fiscal Year begins on <strong>Shrawan 1</strong> and ends on <strong>Ashadh 31</strong> of the following year (e.g., Fiscal Year 2082/83 starts on Shrawan 1, 2082 and ends on Ashadh 31, 2083). All accounting books, tax balances, and sequence counts are bound by this calendar.</p>
    
    <h3>3.4.2 Automatic Serial Sequence Resets</h3>
    <p>To support clean yearly tax audits, the system's core generators for serial identifiers reset to <code>001</code> at the start of each new fiscal year (Shrawan 1) for the following entities:</p>
    <ul>
      <li><strong>Sales Invoices:</strong> Formatted as <code>RTSS-INV-[FY]-[Seq]</code></li>
      <li><strong>Purchase Orders (POs):</strong> Formatted as <code>RTSS-PO-[FY]-[Seq]</code></li>
      <li><strong>Expenses:</strong> Formatted as <code>RTSS-EXP-[FY]-[Seq]</code></li>
      <li><strong>Official Letter Dispatches:</strong> Formatted as <code>RTSS-LETTER-[FY]-[Seq]</code></li>
      <li><strong>Service Requests:</strong> Formatted as <code>RTSS-SERV-[FY]-[Seq]</code></li>
      <li><strong>Inventory Arrivals/Requests:</strong> Formatted as <code>RTSS-INVENTORY-[FY]-[Seq]</code></li>
      <li><strong>Durable &amp; Non-Durable Items (Assets):</strong> Formatted as <code>RTSS-ASSETS-DU-[FY]-[Seq]</code> and <code>RTSS-ASSETS-NONDU-[FY]-[Seq]</code></li>
    </ul>
    
    <div class="callout callout-info">
      <div class="callout-title">Sequence Reset Gating Rule</div>
      The automatic sequence reset ONLY triggers if the immediate previous Fiscal Year's <strong>Annual Closing</strong> has been officially completed and approved by the Administrators. If the Year-End (Annual) Closing is still in Draft or Pending states, the sequence numbers will continue consecutively into the new year. This prevents premature sequence resetting before financial balances are formally signed off.
    </div>
    
    <h3>3.4.3 Year-End Stock Rollover &amp; Opening Stock</h3>
    <p>When the corporate board reviews and the Admin permanently approves the <strong>Annual Closing</strong> for a completed fiscal year, the system performs an automated roll-over of all stock assets:</p>
    <ol>
      <li>The closing stock quantities of all items are captured.</li>
      <li>These figures are recorded as the official <strong>Opening Stock</strong> for the next fiscal year.</li>
      <li>This allows the system to preserve a distinct yearly record of stock assets, safeguarding historical audit paths and preventing backdated inventory drift.</li>
      <li>The Opening Stock for the current fiscal year is displayed directly in the Inventory stock list under the in-stock quantities for easy administrative reference.</li>
    </ol>
    
    <h3>3.4.4 Dynamic Audit &amp; Closing Alerts</h3>
    <p>The primary Admin Dashboard features a real-time audit scanner that monitors completed months and quarters based on the Nepali calendar. If a completed month's Monthly closing is not yet approved, or if a quarterly closing (3-Monthly, 6-Monthly, 9-Monthly, or Annual) is due, the dashboard displays prominent alert notifications directing the Administrator to perform the required closing.</p>
    
    <h3>3.4.5 End-of-Day Staff Automatic Check-Out</h3>
    <p>To resolve situations where counter employees forget to log out of their shift, the system implements an automatic check-out gate:</p>
    <ul>
      <li>When an Administrator reviews and clicks <strong>Approve Closing</strong> for a specific date's Daily Closing, the system scans that date's staff attendance.</li>
      <li>Any checked-in employee who has not yet registered a checkout time will be automatically checked out.</li>
      <li>Employees with <code>Present</code> status are checked out automatically at <strong>05:00 PM</strong>.</li>
      <li>Employees with <code>Half Day</code> status are checked out automatically at <strong>01:00 PM</strong>.</li>
      <li>The record is stamped with a notice: <em>(Auto checked-out upon Daily Closing approval)</em> in the attendance remarks list.</li>
      <li>If the employee checked out manually prior to the Daily Closing approval, their manual time is preserved.</li>
    </ul>
    
    
    <h1>Chapter 4: Supplier Directory &amp; Purchase Orders (PO)</h1>
    <p>Replenishing your commercial inventory requires robust recordkeeping to maintain clean accounts with external vendors.</p>
    
    <h2>4.1 Supplier Accounts Registry</h2>
    <p>To register and audit suppliers to preserve healthy supply-chain pathways, follow these points step by step:</p>
    <ol>
      <li>Navigate to the <strong>Suppliers &amp; Vendors</strong> tab.</li>
      <li>Review registered suppliers, including phone numbers, physical addresses, and active payable balances.</li>
      <li>To register a new vendor partner, click <strong>Register New Supplier</strong>.</li>
      <li>Enter their official Supplier/Company Name, Address, contact Phone, and PAN/VAT Number.</li>
      <li>Click <strong>Save Vendor Profile</strong>. This supplier is now available inside purchase order drop-down selectors.</li>
    </ol>
    
    <h2>4.2 Drafting, Authorizing, and Printing Purchase Orders (PO)</h2>
    <p>To draft, issue, and print formal procurement purchase orders, follow these points step by step:</p>
    <ol>
      <li>Go to the <strong>Suppliers &amp; Vendors</strong> tab.</li>
      <li>Locate your preferred vendor in the master list and click the <strong>Draft Purchase Order</strong> button.</li>
      <li>Select the destination Supplier from the drop-down list.</li>
      <li>Click the <strong>Add Restock Item</strong> button to append purchase line items.</li>
      <li>In the item name input, type the item description (e.g., Cat6 Network Cable, Gigabit Switch).</li>
      <li>Enter the required <strong>Quantity</strong> and the agreed wholesale unit rate <strong>Rate (Rs.)</strong>. The system will calculate totals in real-time.</li>
      <li>Select the payment account mode: Cash, RBB, eSewa, Sahakari, or Credit.</li>
      <li>Review the cumulative PO value. Click the <strong>Authorize &amp; Issue PO</strong> button.</li>
      <li>In the PO ledger list below, locate your issued PO and click the <strong>Print Document</strong> icon. This will launch a single-page, beautifully structured PO receipt containing your VAT and company seals. Choose "Save as PDF" or dispatch directly to physical printers.</li>
    </ol>
    
    
    <h1>Chapter 5: Staff Attendance &amp; Salary Payroll Settlement</h1>
    <p>Managing your workforce includes maintaining a clear audit log of employee attendance and monthly salary disbursements.</p>
    
    <h2>5.1 Auditing Attendance Logs, Leaves, & Corrections</h2>
    <p>To review timesheets, approve leave proposals, or resolve missed check-ins, follow these points step by step:</p>
    <ol>
      <li>Navigate to the <strong>Staff Request Desk</strong> or <strong>Attendance &amp; Payroll</strong> tab.</li>
      <li>Under <strong>Timesheet Audits</strong>, select the target month to inspect daily clock-in/out timestamps, hours worked, and overtime counts.</li>
      <li>To review leave applications, go to the <strong>Leave Requests</strong> panel. Read the employee's justification notes and requested dates. Click <strong>Approve</strong> to automatically log their vacation days or <strong>Decline</strong> with custom feedback.</li>
      <li>To resolve missed check-ins, check the <strong>Attendance Correction Requests</strong> panel. Inspect the employee's suggested clock-in/out stamps. Click <strong>Approve Correction</strong> to update the master timesheet registry instantly.</li>
    </ol>
    
    <h2>5.2 Generating Verified Salary Payslips</h2>
    <p>To compile shift logs, calculate net pays, and dispatch signed salary vouchers, follow these points step by step:</p>
    <ol>
      <li>Go to the <strong>Attendance &amp; Payroll</strong> panel.</li>
      <li>Select the target Employee from the roster and click the <strong>Initiate Monthly Payslip</strong> button.</li>
      <li>Review the automatically calculated hours, standard basic pay, and overtime allowances based on their shift logs.</li>
      <li>In the <strong>Allowances</strong> field, input any custom additions (e.g., fuel allowance, travel bonus).</li>
      <li>In the <strong>Deductions</strong> field, input any custom pay subtractions (e.g., advance cash withdrawals, unpaid absences).</li>
      <li>Review the final calculated Net Salary. Click <strong>Settle &amp; Verify Payroll</strong>.</li>
      <li>In the payroll logs list, click the <strong>Print Slip</strong> icon. The system will output a professional salary slip card featuring a verified seal. Save as PDF or print.</li>
    </ol>
    
    
    <h1>Chapter 6: Backup Records &amp; Portable HTML Exporting</h1>
    <p>To secure your enterprise against internet downtime or device failures, the platform features robust local data backup utilities.</p>
    
    <h2>6.1 Generating a Standalone Offline-Ready HTML Package</h2>
    <p>To download a portable, fully operational version of your CRM that runs offline, follow these points step by step:</p>
    <ol>
      <li>Navigate to the <strong>Settings</strong> or <strong>Backup &amp; Export</strong> tab.</li>
      <li>Locate the <strong>💎 Standalone HTML Exporter</strong> widget.</li>
      <li>Read the system instructions regarding offline-ready features.</li>
      <li>Click the <strong>Export Portable HTML</strong> button.</li>
      <li>The system will compile all database models, settings, company structures, and the entire CRM user interface into a single '.html' file.</li>
      <li>Save this file to a USB flash drive, email it, or archive it locally. You can open it in any browser (Chrome, Edge, Safari) without an internet connection, and use it as a complete read-write ledger backup.</li>
    </ol>
    
    <h2>6.2 JSON Database Exporter and Restorer</h2>
    <p>To export or restore raw JSON database dumps, follow these points step by step:</p>
    <ol>
      <li>Go to the <strong>Backup &amp; Export</strong> settings area.</li>
      <li>Click the <strong>Download Database JSON</strong> button. A raw data dump containing all records is saved to your computer.</li>
      <li>To restore data, locate the <strong>Restore from JSON Backup</strong> file uploader.</li>
      <li>Click to browse or drag-and-drop your previously saved '.json' file.</li>
      <li>Click <strong>Process &amp; Restore Database</strong>. The application will immediately parse records, wipe outdated records, and reload the database. All widgets update immediately.</li>
    </ol>
    
    
    <h1>Chapter 7: Fixed Assets Registry &amp; Depreciation Tracking</h1>
    <p>Managing capital hardware investments, office furniture, tools, and infrastructure assets ensures total balance sheet accuracy.</p>
    
    <h2>7.1 Registering Capital Assets</h2>
    <p>To record a new company asset (laptops, fiber splicers, servers, office furniture), follow these points step by step:</p>
    <ol>
      <li>Navigate to the <strong>Assets Management</strong> panel.</li>
      <li>Click <strong>+ Add Fixed Asset</strong>.</li>
      <li>Enter Asset Name, Category, Acquisition Date, Purchase Price, and Serial Number.</li>
      <li>Link the Supplier from your vendor list to track warranty sources.</li>
      <li>Specify physical location (e.g. Server Room, Counter 1).</li>
      <li>Click <strong>Save Asset Entry</strong>.</li>
    </ol>

    <h2>7.2 Depreciation &amp; Disposal</h2>
    <p>Track annual asset value reductions automatically:</p>
    <ol>
      <li>Set useful asset lifespan years and salvage value.</li>
      <li>The system computes straight-line annual depreciation, updating total asset net book values on the Balance Sheet.</li>
      <li>When retiring or selling an asset, click <strong>Mark Disposed</strong> and input final recovery amount.</li>
    </ol>


    <h1>Chapter 8: Universal Print Engine &amp; Watermark Customization</h1>
    <p>The system features a central print engine for invoices, reports, letters, and payslips.</p>

    <h2>8.1 Global Print Preview Controls</h2>
    <p>Whenever you click Print anywhere in the application, the Universal Print Modal launches:</p>
    <ol>
      <li><strong>Margin Presets:</strong> Choose between Tight (3mm), Normal (10mm), Compact (5mm), or Custom margins.</li>
      <li><strong>Color Mode:</strong> Toggle between Color and Monochrome (grayscale) to optimize printer ink usage.</li>
      <li><strong>Header/Footer Controls:</strong> Toggle official company letterhead and footer contact info on or off.</li>
    </ol>

    <h2>8.2 Background Watermark Configuration</h2>
    <p>The background company watermark features refined printing rules:</p>
    <ol>
      <li><strong>Default Off:</strong> The watermark checkbox is unticked by default so clean white pages print without unnecessary ink consumption.</li>
      <li><strong>Ultra-Dim &amp; Centered:</strong> When you manually tick the "Background Watermark" box, a soft, high-clarity logo watermark is centered perfectly on the document canvas at 2.5% opacity (0.025), ensuring text remains 100% sharp and readable.</li>
    </ol>
    
    ` : `
    <!-- STAFF MANUAL CONTENT -->
    
    <h1>Chapter 1: Staff Account Access &amp; Secure Dashboard</h1>
    <p>Welcome to the Reliabletech CRM &amp; Business Suite. Your profile operates under restricted security permissions designed to protect corporate financial intelligence while providing a high-performance workspace for your daily client service duties.</p>
    
    <h2>1.1 Counter Login Procedures</h2>
    <p>To access your designated workstation at the counter terminal, follow these points step by step:</p>
    <ol>
      <li>Open the Reliabletech login screen in your web browser.</li>
      <li>Input your assigned employee <strong>Username</strong> and secret <strong>Password</strong> into the inputs.</li>
      <li>Click the <strong>Authorize Login</strong> button.</li>
      <li>Once authorized, verify your profile greeting (displaying your Post, e.g., Senior Network Engineer) in the top menu.</li>
      <li><strong>Security Rule:</strong> To protect cash drawer balances and prevent un-audited counter entries, click <strong>Logout</strong> whenever you step away from the physical cash desk.</li>
    </ol>
    
    <h2>1.2 Operating Your Clean Operations Dashboard</h2>
    <p>Your dashboard is tailored to show you exactly what is relevant to cash-register management and daily operations, keeping your interface simple and uncluttered:</p>
    <ul>
      <li><strong>Today's Active Sales:</strong> Monitors cash register sales logged during today's shift.</li>
      <li><strong>Cash in Hand:</strong> Tracks physical currency accumulated inside the counter cash drawer.</li>
      <li><strong>Digital and Bank Safe balances:</strong> Real-time overview of payments received via <strong>Rastriya Banijya Bank (RBB)</strong>, <strong>eSewa digital wallet</strong>, and <strong>Sahakari Cooperatives</strong>.</li>
      <li><strong>Outstanding Dues:</strong> Monitors today's sales booked on credit terms.</li>
    </ul>
    
    <div class="callout callout-warning">
      <div class="callout-title">⚠️ Security Notice</div>
      Corporate indicators like Profit &amp; Loss records, business asset sheets, payroll details, and detailed administrative reports are hidden from staff logins. Contact the Admin for high-level inquiries.
    </div>
    
    
    <h1>Chapter 2: Sales, Billing, &amp; Tax Invoice Creation</h1>
    <p>Creating customer invoices is your primary duty. Follow these steps to log sales, calculate tax components, and print clear receipts.</p>
    
    <h2>2.1 Initiating an Invoice</h2>
    <p>To launch and prepare a client invoice form, follow these points step by step:</p>
    <ol>
      <li>Navigate to the <strong>Sales &amp; Billing</strong> panel in the main menu.</li>
      <li>Click the <strong>Create Customer Invoice</strong> button. The system will auto-populate the invoice ID and date.</li>
      <li>In the <strong>Customer Name</strong> field, start typing to search your client directory.</li>
      <li>If the customer is registered, select their name from the autocomplete dropdown list to auto-populate their phone and address.</li>
      <li>If they are a new client, type their full name into the search bar, then click the **Register New Customer** button. Enter their phone number and physical address.</li>
    </ol>
    
    <h2>2.2 Adding Service Line Items</h2>
    <p>To attach services, hardware, or customized charges, follow these points step by step:</p>
    <ol>
      <li>Click the <strong>Add Another Service Line Item</strong> button. A new entry block will render.</li>
      <li>Click inside the <strong>Service Search</strong> autocomplete box and type the item name (e.g., Fiber Router, Server Maintenance).</li>
      <li>Select the matched catalog item from the dropdown list. The price rate will fill in automatically.</li>
      <li>If you need to charge a non-catalog or custom service, scroll down the autocomplete list and select <strong>"Use Manual Custom Charge"</strong>.</li>
      <li>Type your custom description (e.g., "Wall Mount brackets") directly, enter the required <strong>Quantity</strong>, and specify the customized <strong>Unit Rate (Rs.)</strong>.</li>
    </ol>
    
    <h2>2.3 Payment Method &amp; Tax Calculations</h2>
    <p>To select the transaction mode and finalize invoices, follow these points step by step:</p>
    <ol>
      <li>Under <strong>Payment Method</strong>, choose the payment account: Cash, RBB Bank, eSewa, Sahakari, or Due (Credit terms).</li>
      <li>If the customer makes a partial payment, enter the amount received in the <strong>Amount Paid (Rs.)</strong> field. The remaining balance will be booked as credit debt under their name.</li>
      <li>Review the automatically calculated Subtotal, custom Discount percentage, VAT (13% or 0%), and Grand Total.</li>
      <li>Verify all fields and click the <strong>Save &amp; Authorize Invoice</strong> button. The invoice is permanently logged.</li>
    </ol>
    
    <h2>2.4 Single-Copy Receipt Printing</h2>
    <p>To print physical or digital copies of receipts for clients without paper waste, follow these points step by step:</p>
    <ol>
      <li>Locate the saved invoice card in the sales history log list.</li>
      <li>Click the <strong>Print Receipt</strong> icon. A optimized, borderless print dialog will open.</li>
      <li><strong>Note:</strong> To protect environmental resources, invoices are formatted to fit as a single space-saving copy.</li>
      <li>Select your target receipt printer, set the page layout, and click <strong>Print</strong> (or select "Save as PDF" to email to the customer).</li>
    </ol>
    
    
    <h1>Chapter 3: Managing Customer Accounts &amp; Outstanding Dues</h1>
    <p>Maintaining clear records of client outstanding debt is critical for corporate cash flow. Learn how to search profiles, view outstanding due ledgers, and register payment collections.</p>
    
    <h2>3.1 Client Directory &amp; Outstanding Logs</h2>
    <p>To inspect client dues and check ledger metrics, follow these points step by step:</p>
    <ol>
      <li>Navigate to the <strong>Client Directory</strong> tab.</li>
      <li>Review the master directory list displaying customer names, contact numbers, and total active outstanding debt.</li>
      <li>Type a customer's name into the search box to locate their record instantly.</li>
      <li>Inspect the red due badge to identify customers with overdue payments.</li>
    </ol>
    
    <h2>3.2 Recording Client Due Payments</h2>
    <p>To register a cash or bank pay-in to clear a customer's outstanding balance, follow these points step by step:</p>
    <ol>
      <li>Navigate to the <strong>Sales &amp; Billing</strong> panel.</li>
      <li>Locate the customer's unpaid invoice in the history log list (or search by their name).</li>
      <li>Click the **Edit/Pay-In** button on the invoice card.</li>
      <li>In the <strong>Add Pay-in Amount</strong> field, enter the exact sum paid by the customer.</li>
      <li>Select the pay-in account: Cash, RBB, eSewa, or Sahakari.</li>
      <li>Click <strong>Save Pay-In Transaction</strong>. The client's due balance and the system cash accounts update instantly.</li>
    </ol>
    
    
    <h1>Chapter 4: Inventory Records &amp; Replenishment Requests</h1>
    <p>Checking hardware reserves and raising restocking requests ensures smooth, uninterrupted customer support services.</p>
    
    <h2>4.1 Shelf Stock Auditing</h2>
    <p>To inspect active inventory quantities in real-time, follow these points step by step:</p>
    <ol>
      <li>Navigate to the <strong>Inventory &amp; Spares</strong> panel in the main menu.</li>
      <li>Review the chronological inventory card registry detailing item names, serial categories, and units on shelf.</li>
      <li>Look for red "Out of Stock" alerts indicating depletion.</li>
      <li>Use the search box to check specific equipment (e.g., Cat6 cable, ONT router).</li>
    </ol>
    
    <h2>4.2 Creating Replenishment Proposals</h2>
    <p>To request a restock from the Administrator, follow these points step by step:</p>
    <ol>
      <li>Go to the <strong>Inventory &amp; Spares</strong> panel.</li>
      <li>Click the <strong>Create Replenishment Request</strong> button.</li>
      <li>In the popup form, select the target inventory Item from the dropdown list.</li>
      <li>Enter the required <strong>Quantity</strong> needed for counter operations.</li>
      <li>In the <strong>Justification Note</strong> field, enter a brief reason (e.g., "Critical stock low due to active fiber network expansion").</li>
      <li>Click <strong>Submit Proposal</strong>. The request is instantly sent to the Administrator's desk for PO authorization.</li>
    </ol>
    
    
    <h1>Chapter 5: Official Letters &amp; Communications Desk</h1>
    <p>The office terminal features an official letter designer to construct standard corporate letters for customers, utility providers, or state bodies.</p>
    
    <h2>5.1 Selecting and Initializing Letter Templates</h2>
    <p>To draft official corporate communications, follow these points step by step:</p>
    <ol>
      <li>Navigate to the <strong>Official Documents</strong> or <strong>Letters</strong> tab in the main sidebar.</li>
      <li>Review the directory of professional corporate letter templates: Service Proposals, Credit Invoice Reminders, warning notices, etc.</li>
      <li>Select your preferred language layout: **English** or **Nepali**.</li>
      <li>Click on the chosen letter type card to load it into the editor.</li>
    </ol>
    
    <h2>5.2 Editing, Reviewing, and Printing Official Letters</h2>
    <p>To edit and print official documents with professional styling, follow these points step by step:</p>
    <ol>
      <li>In the letter editor form, fill in the metadata: enter the Reference Number, Date, Subject Line, and Recipient's Address.</li>
      <li>Modify the body paragraphs directly in the editing text block. Double check to ensure it meets corporate standards.</li>
      <li>Click the <strong>Generate Official Letter</strong> button. A live layout featuring a watermark logo will render.</li>
      <li>Click the **Print Letter** button to launch the print preview.</li>
      <li>Ensure "Print Background Graphics" is enabled in printer settings to render the background logos and watermark seals beautifully, then click print.</li>
    </ol>
    
    
    <h1>Chapter 6: Attendance Logs, Leaves, &amp; Monthly Payslips</h1>
    <p>Use the attendance module to submit hours, log punch-ins, and print monthly payslips.</p>
    
    <h2>6.1 Daily Check-in &amp; Out Punching</h2>
    <p>To record daily counter attendance shifts, follow these points step by step:</p>
    <ol>
      <li>Navigate to the <strong>Attendance &amp; Payroll</strong> panel in the main menu.</li>
      <li>When arriving for your morning shift, click the green <strong>Punch In</strong> button. The system registers your start time.</li>
      <li>When leaving at shift-end, click the red <strong>Punch Out</strong> button to log your departure.</li>
    </ol>
    
    <h2>6.2 Attendance Corrections &amp; Leaves Submission</h2>
    <p>To request missed attendance stamps or register sick/vacation leave requests, follow these points step by step:</p>
    <ol>
      <li>Go to the <strong>Attendance &amp; Payroll</strong> panel.</li>
      <li>To correct a missed punch, scroll down to the **Attendance Correction Requests** form.</li>
      <li>Select the Date, input the correct arrival time and departure time, write a brief explanation, and click **Submit Request**.</li>
      <li>To request time off, locate the **Leave Request Application** form.</li>
      <li>Enter the start date, end date, leave category (Sick, Casual, Festive), and write a description. Click **Submit Application**. Both requests are sent to the Admin for approval.</li>
    </ol>
    
    <h2>6.3 Printing Your Monthly Salary Payslips</h2>
    <p>To review and print your salary slips after Admin approval, follow these points step by step:</p>
    <ol>
      <li>Open the <strong>Attendance &amp; Payroll</strong> panel.</li>
      <li>Scroll to the "My Payslips &amp; Earnings Logs" section.</li>
      <li>Identify the verified cycle in the table, showing basic salary, allowances, overtime, and deductions.</li>
      <li>Click the **Print Slip** icon. A beautifully designed employee salary voucher will appear. Print or save as PDF.</li>
    </ol>


    <h1>Chapter 7: Universal Print Engine &amp; Background Watermarks</h1>
    <p>When printing customer invoices, service tickets, or official documents, the Universal Print Engine provides complete layout customization.</p>

    <h2>7.1 Print Dialog Options</h2>
    <ol>
      <li><strong>Margins:</strong> Select Tight, Normal, or Compact to fit invoices cleanly on single sheets.</li>
      <li><strong>Background Watermark:</strong> The watermark checkbox is unchecked by default. If you want to print an official document with the company background logo, manually tick "Background Watermark". It displays an ultra-soft (2.5% opacity) centered background watermark.</li>
      <li><strong>Print Mode:</strong> Choose Color for client-facing receipts or Monochrome for internal records.</li>
    </ol>
    
    `}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = isAdmin ? 'Reliabletech_Admin_Operations_Manual.html' : 'Reliabletech_Staff_Operations_Manual.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Admin Title & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display flex items-center gap-2">
            <ShieldCheck className="text-indigo-600" size={22} />
            <span>एड्मिनिस्ट्रेटिभ तथा सेयरधनी व्यवस्थापन (Admin & Shareholders)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage shareholder directories, share transactions, user permissions, business profile, and system setups.</p>
        </div>

        {/* Master Account Badge */}
        {isReliableAdmin ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>System Master (@reliableadmin) Authorized</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
            <Lock size={13} className="text-slate-400" />
            <span>Admin Read-Only Access</span>
          </div>
        )}
      </div>

      {/* ADMIN SUBTAB NAVIGATION BAR */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setAdminSubTab('shareholders')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            adminSubTab === 'shareholders'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Users size={15} />
          <span>सेयरधनीहरू (Shareholders)</span>
        </button>

        {isSystemMaster && (
          <button
            type="button"
            onClick={() => setAdminSubTab('users')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              adminSubTab === 'users'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <UserCheck size={15} />
            <span>User Accounts & Permissions</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setAdminSubTab('profile')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            adminSubTab === 'profile'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Building2 size={15} />
          <span>Company Profile & Letterhead</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminSubTab('qr_codes')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            adminSubTab === 'qr_codes'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
          id="admin-subtab-qrcodes"
        >
          <QrCode size={15} />
          <span>Company Payment QR Codes</span>
        </button>

        {(isMasterAccount || isReliableAdmin || currentUser?.role === 'Admin') && (
          <button
            type="button"
            onClick={() => setAdminSubTab('balances')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              adminSubTab === 'balances'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Wallet size={15} />
            <span>Account Opening Balances</span>
          </button>
        )}

        {(isMasterAccount || isReliableAdmin) && (
          <button
            type="button"
            onClick={() => setAdminSubTab('system')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              adminSubTab === 'system'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Database size={15} />
            <span>System Backup & Units</span>
          </button>
        )}

        {(isMasterAccount || isReliableAdmin || currentUser?.role === 'Admin') && (
          <button
            type="button"
            onClick={() => setAdminSubTab('emails')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              adminSubTab === 'emails'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Mail size={15} />
            <span>Email Engine & Quotas</span>
          </button>
        )}
      </div>

      {/* 1. SHAREHOLDERS SUBTAB VIEW */}
      {adminSubTab === 'shareholders' && (() => {
        const filteredShareholders = shareholders.filter(sh =>
          sh.name.toLowerCase().includes(shareholderSearch.toLowerCase()) ||
          (sh.address || '').toLowerCase().includes(shareholderSearch.toLowerCase()) ||
          (sh.citizenshipNumber || '').toLowerCase().includes(shareholderSearch.toLowerCase())
        );

        const totalShareCapital = shareholders.reduce((sum, s) => sum + (s.totalShareAmount || 0), 0);
        const activeCount = shareholders.filter(s => s.status === 'Active' || (s.totalShareAmount || 0) > 0).length;

        // Calculate total additions and returns from transactions
        let totalAdditionsAmt = 0;
        let totalReturnsAmt = 0;
        shareholders.forEach(sh => {
          (sh.transactions || []).forEach(tx => {
            if (tx.status === 'Approved') {
              if (tx.transactionType === 'Addition') totalAdditionsAmt += (tx.paidAmount || tx.amount || 0);
              if (tx.transactionType === 'Return') totalReturnsAmt += (tx.paidAmount || tx.amount || 0);
            }
          });
        });

        return (
          <div className="space-y-6">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">कुल सेयर पुँजी (Total Share Capital)</span>
                <span className="text-2xl font-bold font-mono text-indigo-700 mt-1 block">रु. {totalShareCapital.toLocaleString()}</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Total Net Share Equity</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">सेयरधनी संख्या (Shareholders)</span>
                <span className="text-2xl font-bold font-mono text-slate-800 mt-1 block">{activeCount} जना</span>
                <span className="text-[10px] text-emerald-600 font-medium mt-1 block">✓ Active Shareholders</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">कुल सेयर थप (Total Additions)</span>
                <span className="text-2xl font-bold font-mono text-emerald-600 mt-1 block">+ रु. {totalAdditionsAmt.toLocaleString()}</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Credited to Accounts</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">कुल सेयर फिर्ता (Total Returns)</span>
                <span className="text-2xl font-bold font-mono text-rose-600 mt-1 block">- रु. {totalReturnsAmt.toLocaleString()}</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Debited from Accounts</span>
              </div>
            </div>

            {/* Action Header & Search Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="खोज्नुहोस्: सेयरधनीको नाम, ठेगाना, नागरिकता नं..."
                  value={shareholderSearch}
                  onChange={(e) => setShareholderSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* ACTION BUTTONS (RESTRICTED TO @reliableadmin) */}
              <div className="flex flex-wrap items-center gap-2">
                {isReliableAdmin ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setAddShareModalOpen(true);
                        setAddShareOption('existing');
                        setAddShareholderId('');
                        setAddShareName('');
                        setAddShareAddress('');
                        setAddShareCitizenship('');
                        setAddShareAmount('');
                        setAddShareTxIdNo('');
                        setAddShareMeetingNo('');
                        setAddShareDecisionNo('');
                        setAddShareRemarks('');
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <Plus size={16} />
                      <span>+ सेयरधनी थप गर्नुहोस् (Add Shareholder)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setReturnShareModalOpen(true);
                        setReturnShareholderId('');
                        setReturnShareAmount('');
                        setReturnShareTxIdNo('');
                        setReturnShareMeetingNo('');
                        setReturnShareDecisionNo('');
                        setReturnShareRemarks('');
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <MinusCircle size={16} />
                      <span>- सेयर फिर्ता / कटौटी (Return Share)</span>
                    </button>
                  </>
                ) : (
                  <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
                    <Lock size={14} className="text-amber-600" />
                    <span>Action buttons (Add/Return Share) are allowed for <strong>@reliableadmin</strong> user account only.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Shareholders Directory Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Users size={16} className="text-indigo-600" />
                  <span>सेयरधनी लगत सूची (Shareholders Directory)</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">Total: {filteredShareholders.length}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100 text-[10px] font-bold">
                    <tr>
                      <th className="p-3.5">क्र.सं.</th>
                      <th className="p-3.5">सेयरधनीको नाम (Shareholder Name)</th>
                      <th className="p-3.5">ठेगाना (Address)</th>
                      <th className="p-3.5">नागरिकता नं. (Citizenship No)</th>
                      <th className="p-3.5 text-right">कुल सेयर रकम (Total Share Capital)</th>
                      <th className="p-3.5 text-center">अवस्था (Status)</th>
                      <th className="p-3.5 text-right">कार्य (Action)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredShareholders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          कुनै पनि सेयरधनी भेटिएन।
                        </td>
                      </tr>
                    ) : (
                      filteredShareholders.map((sh, idx) => (
                        <tr key={sh.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-3.5 font-bold text-slate-800">{sh.name}</td>
                          <td className="p-3.5">{sh.address || '-'}</td>
                          <td className="p-3.5 font-mono">{sh.citizenshipNumber || '-'}</td>
                          <td className="p-3.5 text-right font-mono font-bold text-indigo-700">
                            रु. {(sh.totalShareAmount || 0).toLocaleString()}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              sh.status === 'Active' || (sh.totalShareAmount || 0) > 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              {sh.status || 'Active'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedShareholderForLedger(sh)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition cursor-pointer"
                              >
                                <Eye size={13} />
                                <span>लेजर (Ledger)</span>
                              </button>

                              {isReliableAdmin && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddShareModalOpen(true);
                                      setAddShareOption('existing');
                                      handleSelectExistingForAdd(sh.id);
                                    }}
                                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition cursor-pointer"
                                    title="Add Share"
                                  >
                                    <Plus size={14} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReturnShareModalOpen(true);
                                      setReturnShareholderId(sh.id);
                                    }}
                                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition cursor-pointer"
                                    title="Return Share"
                                  >
                                    <MinusCircle size={14} />
                                  </button>
                                </>
                              )}

                              {(isMasterAccount || isReliableAdmin || currentUser?.role === 'Admin') && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteShareholder(sh)}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-[11px] font-bold transition cursor-pointer"
                                  title={`Delete Shareholder ${sh.name}`}
                                  id={`btn-delete-shareholder-${sh.id}`}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 2. PROFILE & LETTERHEAD SUBTAB */}
      {adminSubTab === 'profile' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Edit Profile Settings */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-100 shadow-xs space-y-6">
          <h3 className="text-lg font-bold text-slate-800 font-display border-b border-slate-100 pb-3 flex items-center gap-2">
            <User size={18} className="text-indigo-500" />
            <span>Company Business Settings</span>
          </h3>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Registered Name (English) *</label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Company Name in Nepali (संस्थाको नाम - नेपालीमा)</label>
                <input 
                  type="text"
                  placeholder="e.g. सूर्योदय बहुउद्देश्यीय सहकारी संस्था लि."
                  value={companyNameNepali}
                  onChange={(e) => setCompanyNameNepali(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Company Subtitle / Tagline (English)</label>
                <input 
                  type="text"
                  placeholder="e.g. ReliableTech - Solutions You Can Count On, Services You can Trust."
                  value={companySubtitle}
                  onChange={(e) => setCompanySubtitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Company Subtitle in Nepali (उप-शीर्षक / ट्यागलाइन - नेपालीमा)</label>
                <input 
                  type="text"
                  placeholder="e.g. सर्भिसेज एण्ड सप्लायर्स"
                  value={companySubtitleNepali}
                  onChange={(e) => setCompanySubtitleNepali(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Physical Location (English) *</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Address in Nepali (ठेगाना - नेपालीमा)</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="e.g. सूर्योदय न.पा.-१०, फिक्कल बजार, इलाम"
                    value={addressNepali}
                    onChange={(e) => setAddressNepali(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Phone Helpline *</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Contact Email *</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">VAT / Personal Account Number (PAN) Registration No. *</label>
                <div className="relative">
                  <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    required
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Established Year (ESTD) *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. 2075 B.S. or 2018 A.D."
                  value={estdYear}
                  onChange={(e) => setEstdYear(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Company Logo Section */}
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Company Logo Asset</span>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Logo Preview */}
                <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Company Logo" className="object-contain w-full h-full" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold uppercase">No Logo</span>
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  <p className="text-[11px] text-slate-600">Upload an image file (PNG/JPEG under 250KB) or paste a custom image web URL. This logo appears on all printed invoices, reports, and official letter templates.</p>
                  <div className="flex flex-wrap gap-2">
                    <label className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer inline-flex items-center gap-1.5 transition">
                      <Upload size={12} />
                      <span>Upload Image</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleLogoUpload} 
                      />
                    </label>
                    {logoUrl && (
                      <button 
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-1.5">
                <label className="text-[10px] font-bold text-slate-500 block uppercase font-mono">Or Paste Logo Image URL</label>
                <input 
                  type="text"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl.startsWith('data:') ? '' : logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Support Desk Instant Quick Reply Text Configuration */}
            <div className="bg-sky-50/60 border border-sky-200/80 rounded-xl p-4 space-y-3" id="quick-reply-settings-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-sky-600 text-white rounded-lg shadow-2xs">
                    <MessageSquare size={15} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Support Desk Quick Reply Text (Instant Automated Response)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Reliabletech Support Desk &bull; Fikkal Bazaar, Ilam &bull; Direct Counter Connect
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomerChatQuickReply("Namaste! Thank you for messaging ReliableTech Support Desk (Fikkal Bazaar, Ilam • Direct Counter Connect). Our on-duty technical counter staff have received your message and will assist you immediately. For urgent dispatch or on-site queries, feel free to call our hotline at 9852680780.")}
                  className="text-[10px] font-bold text-sky-700 hover:text-sky-900 bg-sky-100 hover:bg-sky-200 px-2 py-1 rounded transition cursor-pointer"
                >
                  Reset Default
                </button>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                This instant reply is automatically dispatched to any customer who sends a message through the <strong>Reliabletech Support Desk (Fikkal Bazaar, Ilam • Direct Counter Connect)</strong> widget or E-commerce message desk.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Quick Reply Message Template *
                </label>
                <textarea
                  rows={3}
                  value={customerChatQuickReply}
                  onChange={(e) => setCustomerChatQuickReply(e.target.value)}
                  placeholder="Enter instant automated greeting and contact details..."
                  className="w-full border border-slate-200 bg-white rounded-xl p-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800 leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">Updates sync to active dashboard widgets immediately.</span>
              {isMasterAccount && (
                <button 
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  {profileSaved ? <Check size={14} /> : null}
                  <span>{profileSaved ? 'Profile Saved' : 'Save Details'}</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Corporate Letterhead Live Preview & Test Console */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
                  <FileText size={18} className="text-[#002D62]" />
                  <span>System Corporate Letterhead & Print Preview</span>
                </h3>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">
                  System Master Only
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure custom header & footer images, shape dimensions, cropping/fit, and active/inactive exclusion rules per document type.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewIsNepali(!previewIsNepali)}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition border cursor-pointer ${
                  previewIsNepali ? 'bg-[#FF6600] text-white border-[#FF6600]' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {previewIsNepali ? 'Language: Nepali (नेपाली)' : 'Language: English'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.openUniversalEmailModal) {
                    window.openUniversalEmailModal({
                      recipientName: profile?.name || 'Valued Recipient',
                      subject: `Official Export Document - ReliableTech Services & Suppliers`,
                      message: `Dear Sir/Madam,\n\nPlease find the attached/enclosed official export and audit document from ReliableTech Services & Suppliers.\n\nGenerated on: ${new Date().toLocaleDateString()}\nOrganization: ${profile?.name || 'ReliableTech Services & Suppliers'}\n\nThank you,\nRTSS Administrative Team`,
                      emailType: 'Official Statement / Audit'
                    });
                  }
                }}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs cursor-pointer"
                title="Send Document through Email"
              >
                <Mail size={13} />
                <span>Send Email</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 bg-[#002D62] hover:bg-[#002147] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs cursor-pointer"
              >
                <Printer size={13} />
                <span>Print Document</span>
              </button>
            </div>
          </div>

          {/* Unified System Letterpad Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="text-emerald-600 shrink-0" size={18} />
                  <span>Standard Official Letterpad ({profile?.name || 'Company Profile'})</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  All system documents automatically use the official letterpad with complete company credentials ({profile?.panNumber ? `PAN: ${profile.panNumber}, ` : ''}{profile?.estdYear ? `ESTD: ${profile.estdYear}, ` : ''}Address & Contact Details). Select a document below to preview how your data fits into the letterpad.
                </p>
              </div>

              {/* Document Type Selector Tabs for Live Preview */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['Invoice', 'Official Letter', 'Report', 'Purchase Order', 'Meeting Minute', 'Staff Pay Slip', 'Statement', 'Expense Voucher'] as LetterheadDocType[]).map(docType => (
                  <button
                    key={docType}
                    type="button"
                    onClick={() => setPreviewDocType(docType)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                      previewDocType === docType
                        ? 'bg-[#002D62] text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{docType}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Letterhead Preview Render Box */}
          <div className="border border-slate-200 rounded-2xl p-2 bg-slate-50 shadow-inner overflow-hidden">
            <CorporateLetterhead
              profile={{
                ...profile,
                name: name.trim() || profile.name,
                companyNameNepali: companyNameNepali.trim() || profile.companyNameNepali,
                companySubtitle: companySubtitle.trim() || profile.companySubtitle,
                companySubtitleNepali: companySubtitleNepali.trim() || profile.companySubtitleNepali,
                location: location.trim() || profile.location,
                addressNepali: addressNepali.trim() || profile.addressNepali,
                phone: phone.trim() || profile.phone,
                email: email.trim() || profile.email,
                panNumber: panNumber.trim() || profile.panNumber,
                logoUrl: logoUrl || profile.logoUrl,
              }}
              documentType={previewDocType}
              isNepali={previewIsNepali}
              id="corporate-letterhead-system-preview"
            >
              <div className="space-y-6">
                {/* Sample Document Body Content based on previewDocType */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#002D62] uppercase tracking-wide">
                      {previewIsNepali
                        ? (previewDocType === 'Invoice' ? 'कर बिजक / बिक्री बिजक' :
                           previewDocType === 'Official Letter' ? 'आधिकारिक पत्राचार' :
                           previewDocType === 'Report' ? 'प्रगति तथा आर्थिक प्रतिवेदन' :
                           previewDocType === 'Purchase Order' ? 'खरिद आदेश (Purchase Order)' :
                           previewDocType === 'Invitation' ? 'निमन्त्रणा पत्र (Invitation)' :
                           previewDocType === 'Staff Pay Slip' ? 'कर्मचारी तलब भुक्तानी भौचर (Pay Slip)' :
                           previewDocType === 'Daily Closing' ? 'दैनिक काउन्टर तथा नगद बन्द (Daily Closing)' :
                           previewDocType === 'Statement' ? 'खाता विवरण (Customer Statement)' :
                           previewDocType === 'Expense Voucher' ? 'खर्च भौचर (Expense Voucher)' :
                           'बैठक निर्णय पुस्तिका (माइन्युट)')
                        : `${previewDocType} Document`}
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Ref No: {previewDocType.toUpperCase().slice(0, 3)}-2082/83-0492
                    </p>
                  </div>
                  <div className="text-right font-mono text-xs text-slate-600">
                    <p>Date: 2082-11-20 B.S.</p>
                    <p className="text-[10px] text-slate-400">Fiscal Year: 2082/83</p>
                  </div>
                </div>

                {previewDocType === 'Meeting Minute' ? (
                  <div className="space-y-4 text-xs text-slate-800">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2 mb-2">
                        बैठक निर्णय न. ०४/२०८२ (Board Meeting Resolution)
                      </h3>
                      <p className="leading-relaxed">
                        आज मिति २०८२ साल फागुन २० गतेका दिन संस्थाको केन्द्रीय कार्यालयमा सञ्चालक समितिको विशेष बैठक सम्पन्न भयो।
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900">उपस्थिति (Attended By):</h4>
                      <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        <li>श्री रामप्रसाद शर्मा - अध्यक्ष</li>
                        <li>श्री सीता श्रेष्ठ - सचिव</li>
                        <li>श्री हरिबहादुर थापा - कोषाध्यक्ष</li>
                      </ul>
                    </div>
                    <div className="space-y-2 pt-2">
                      <h4 className="font-bold text-slate-900">निर्णयहरू (Passed Decisions):</h4>
                      <p className="leading-relaxed text-slate-700">
                        १. संस्थाको वार्षिक लेखापरीक्षण प्रतिवेदन सर्वसम्मतिले स्वीकृत गरियो।<br />
                        २. नयाँ सफ्टवेयर तथा डिजिटलाइजेशन प्रणाली कार्यान्वयन गर्ने निर्णय गरियो।
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Customer & Transaction Info */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">Client / Recipient Details:</p>
                        <p className="font-bold text-slate-800 mt-0.5">Alpine Enterprises Pvt. Ltd.</p>
                        <p className="text-slate-500">New Road, Pokhara-08, Kaski, Nepal</p>
                        <p className="text-slate-500 font-mono">Contact: +977-9856012345 | PAN: 601298433</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">Service Status:</p>
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                          Authorized & Verified
                        </span>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-100 font-bold text-slate-600 text-[9.5px] uppercase tracking-wider border-b border-slate-200">
                            <th className="px-4 py-2.5">Item / Service Description</th>
                            <th className="px-4 py-2.5 text-center">Qty</th>
                            <th className="px-4 py-2.5 text-right">Unit Rate</th>
                            <th className="px-4 py-2.5 text-right">Total Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-slate-800">Enterprise Cloud Backup & Security Audit</span>
                              <p className="text-[10px] text-slate-400">Quarterly full data backup & security scan</p>
                            </td>
                            <td className="px-4 py-3 text-center font-mono">1</td>
                            <td className="px-4 py-3 text-right font-mono">Rs. 45,000.00</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">Rs. 45,000.00</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-slate-800">Hardware Repair & Maintenance Support</span>
                              <p className="text-[10px] text-slate-400">On-site troubleshooting and component replacement</p>
                            </td>
                            <td className="px-4 py-3 text-center font-mono">2</td>
                            <td className="px-4 py-3 text-right font-mono">Rs. 7,500.00</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">Rs. 15,000.00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-between items-end text-xs">
                      <div className="flex-1 max-w-sm bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Amount in Words:</p>
                        <p className="font-serif italic font-bold text-[#002D62] text-xs mt-0.5">
                          Sixty Thousand Nepalese Rupees Only.
                        </p>
                      </div>
                      <div className="text-right space-y-1 font-mono text-xs min-w-[180px]">
                        <div className="flex justify-between text-slate-500">
                          <span>Subtotal:</span>
                          <span>Rs. 60,000.00</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                          <span>Total Amount:</span>
                          <span className="text-[#002D62] text-sm font-extrabold">Rs. 60,000.00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CorporateLetterhead>
          </div>
        </div>
      </div>
      )}

      {/* QR CODES SUBTAB */}
      {adminSubTab === 'qr_codes' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <QrCode size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">
                    Company Official Payment QR Codes &amp; Bank Accounts
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure official payment gateways (RBB Bank, eSewa, Sahakari). These QR codes and account numbers will appear automatically during customer storefront checkout, invoice settlement, and payment vouchers.
                  </p>
                </div>
              </div>
            </div>

            {isMasterAccount && (
              <button
                type="button"
                onClick={handleSavePaymentQrSettings}
                className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
              >
                {qrSaved ? <Check size={14} /> : <CheckCircle2 size={14} />}
                <span>{qrSaved ? 'QR Settings Saved!' : 'Save QR Configurations'}</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSavePaymentQrSettings} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* 1. RASTRIYA BANIJYA BANK (RBB) */}
              <div className="border border-sky-200/80 bg-gradient-to-b from-sky-50/40 to-white rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-sky-150 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-sky-600 text-white font-bold flex items-center justify-center text-xs">
                        RBB
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-sky-950">Rastriya Banijya Bank</h4>
                        <span className="text-[10px] font-medium text-sky-700">Official Government/Commercial Banking</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 font-mono">
                      Active
                    </span>
                  </div>

                  {/* QR Image Preview & Upload */}
                  <div className="flex flex-col items-center p-3 bg-white border border-sky-200/80 rounded-xl space-y-2.5">
                    <div className="w-36 h-36 bg-slate-50 border border-dashed border-sky-300 rounded-xl overflow-hidden flex items-center justify-center p-1.5 relative group">
                      {rbbQrCodeUrl ? (
                        <img src={rbbQrCodeUrl} alt="RBB QR Code" className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-center p-2">
                          <QrCode size={32} className="mx-auto text-sky-400 opacity-60 mb-1" />
                          <span className="text-[10px] text-slate-400 block font-medium">No QR Attached</span>
                        </div>
                      )}
                    </div>

                    <div className="w-full space-y-1.5">
                      <label className="block text-center text-[11px] font-bold text-sky-700 hover:text-sky-900 cursor-pointer bg-sky-50 hover:bg-sky-100 py-1.5 px-3 rounded-lg border border-sky-200 transition">
                        <Upload size={12} className="inline mr-1" />
                        <span>Upload RBB QR Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleRbbQrUpload}
                          className="hidden"
                          disabled={!isMasterAccount}
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="Or paste QR image URL..."
                        value={rbbQrCodeUrl.startsWith('data:') ? '' : rbbQrCodeUrl}
                        onChange={(e) => setRbbQrCodeUrl(e.target.value)}
                        disabled={!isMasterAccount}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {/* Account Details Form */}
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 font-mono">Account Holder Title</label>
                      <input
                        type="text"
                        value={rbbAccountName}
                        onChange={(e) => setRbbAccountName(e.target.value)}
                        disabled={!isMasterAccount}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-hidden focus:border-sky-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 font-mono">Account Number</label>
                      <input
                        type="text"
                        value={rbbAccountNumber}
                        onChange={(e) => setRbbAccountNumber(e.target.value)}
                        disabled={!isMasterAccount}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-hidden focus:border-sky-500 font-mono font-bold text-sky-950"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 font-mono">Bank Branch / Location</label>
                      <input
                        type="text"
                        value={rbbBranch}
                        onChange={(e) => setRbbBranch(e.target.value)}
                        disabled={!isMasterAccount}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-hidden focus:border-sky-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. ESEWA DIGITAL WALLET */}
              <div className="border border-emerald-200/80 bg-gradient-to-b from-emerald-50/40 to-white rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-150 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#60BB46] text-white font-bold flex items-center justify-center text-xs">
                        eSewa
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-950">eSewa Mobile Wallet</h4>
                        <span className="text-[10px] font-medium text-emerald-700">Instant Fonepay / QR Gateway</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 font-mono">
                      Active
                    </span>
                  </div>

                  {/* QR Image Preview & Upload */}
                  <div className="flex flex-col items-center p-3 bg-white border border-emerald-200/80 rounded-xl space-y-2.5">
                    <div className="w-36 h-36 bg-slate-50 border border-dashed border-emerald-300 rounded-xl overflow-hidden flex items-center justify-center p-1.5 relative group">
                      {esewaQrCodeUrl ? (
                        <img src={esewaQrCodeUrl} alt="eSewa QR Code" className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-center p-2">
                          <QrCode size={32} className="mx-auto text-emerald-400 opacity-60 mb-1" />
                          <span className="text-[10px] text-slate-400 block font-medium">No QR Attached</span>
                        </div>
                      )}
                    </div>

                    <div className="w-full space-y-1.5">
                      <label className="block text-center text-[11px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer bg-emerald-50 hover:bg-emerald-100 py-1.5 px-3 rounded-lg border border-emerald-200 transition">
                        <Upload size={12} className="inline mr-1" />
                        <span>Upload eSewa QR Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEsewaQrUpload}
                          className="hidden"
                          disabled={!isMasterAccount}
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="Or paste QR image URL..."
                        value={esewaQrCodeUrl.startsWith('data:') ? '' : esewaQrCodeUrl}
                        onChange={(e) => setEsewaQrCodeUrl(e.target.value)}
                        disabled={!isMasterAccount}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Account Details Form */}
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 font-mono">eSewa Merchant / Name</label>
                      <input
                        type="text"
                        value={esewaAccountName}
                        onChange={(e) => setEsewaAccountName(e.target.value)}
                        disabled={!isMasterAccount}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-hidden focus:border-emerald-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 font-mono">eSewa ID / Mobile Number</label>
                      <input
                        type="text"
                        value={esewaId}
                        onChange={(e) => setEsewaId(e.target.value)}
                        disabled={!isMasterAccount}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-hidden focus:border-emerald-500 font-mono font-bold text-emerald-950"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. SAHAKARI / COOPERATIVE */}
              <div className="border border-purple-200/80 bg-gradient-to-b from-purple-50/40 to-white rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-purple-150 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-700 text-white font-bold flex items-center justify-center text-xs">
                        सहकारी
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-purple-950">Sahakari / Cooperative</h4>
                        <span className="text-[10px] font-medium text-purple-700">Suryodaya Cooperative QR &amp; Account</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 font-mono">
                      Active
                    </span>
                  </div>

                  {/* QR Image Preview & Upload */}
                  <div className="flex flex-col items-center p-3 bg-white border border-purple-200/80 rounded-xl space-y-2.5">
                    <div className="w-36 h-36 bg-slate-50 border border-dashed border-purple-300 rounded-xl overflow-hidden flex items-center justify-center p-1.5 relative group">
                      {sahakariQrCodeUrl ? (
                        <img src={sahakariQrCodeUrl} alt="Sahakari QR Code" className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-center p-2">
                          <QrCode size={32} className="mx-auto text-purple-400 opacity-60 mb-1" />
                          <span className="text-[10px] text-slate-400 block font-medium">No QR Attached</span>
                        </div>
                      )}
                    </div>

                    <div className="w-full space-y-1.5">
                      <label className="block text-center text-[11px] font-bold text-purple-700 hover:text-purple-900 cursor-pointer bg-purple-50 hover:bg-purple-100 py-1.5 px-3 rounded-lg border border-purple-200 transition">
                        <Upload size={12} className="inline mr-1" />
                        <span>Upload Sahakari QR Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSahakariQrUpload}
                          className="hidden"
                          disabled={!isMasterAccount}
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="Or paste QR image URL..."
                        value={sahakariQrCodeUrl.startsWith('data:') ? '' : sahakariQrCodeUrl}
                        onChange={(e) => setSahakariQrCodeUrl(e.target.value)}
                        disabled={!isMasterAccount}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Account Details Form */}
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 font-mono">Cooperative Institution Name</label>
                      <input
                        type="text"
                        value={sahakariName}
                        onChange={(e) => setSahakariName(e.target.value)}
                        disabled={!isMasterAccount}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-hidden focus:border-purple-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 font-mono">Account Holder Title</label>
                      <input
                        type="text"
                        value={sahakariAccountName}
                        onChange={(e) => setSahakariAccountName(e.target.value)}
                        disabled={!isMasterAccount}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-hidden focus:border-purple-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 font-mono">Account Number</label>
                      <input
                        type="text"
                        value={sahakariAccountNumber}
                        onChange={(e) => setSahakariAccountNumber(e.target.value)}
                        disabled={!isMasterAccount}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-hidden focus:border-purple-500 font-mono font-bold text-purple-950"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Instruction Notice for Storefront Checkout & Counter Desk */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Payment Verification Notice &amp; Instructions shown to Customers:
              </label>
              <textarea
                value={qrInstructions}
                onChange={(e) => setQrInstructions(e.target.value)}
                disabled={!isMasterAccount}
                rows={2}
                className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-white focus:outline-hidden focus:border-indigo-500 text-slate-700"
                placeholder="Write instructions for customers to upload payment screenshot for 5-minute counter verification..."
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">QR codes immediately reflect across customer checkout and order dispatch terminals.</span>
              {isMasterAccount && (
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  {qrSaved ? <Check size={14} /> : null}
                  <span>{qrSaved ? 'Settings Saved' : 'Save Payment QR Settings'}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* 3. ACCOUNT OPENING BALANCES SUBTAB */}
      {adminSubTab === 'balances' && (
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-xs space-y-6">
          <h3 className="text-lg font-bold text-slate-800 font-display border-b border-slate-100 pb-3 flex items-center gap-2">
            <Settings size={18} className="text-emerald-600" />
            <span>Account Opening Balances (System Setup)</span>
          </h3>
            <p className="text-xs text-slate-500 leading-normal">
              Configure the opening balances for each account when first adopting this suite. To comply with local bookkeeping laws, you must upload a picture of the statement/passbook from the same date to serve as administrative proof.
            </p>

            <form onSubmit={handleSaveBalances} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(['RBB', 'SAHAKARI', 'ESEWA', 'CASH', 'DUE'] as const).map(account => {
                  const accountDetails = localBalances?.[account] || { openingBalance: 0, openingBalanceDate: '2083-01-01' };
                  const label = account === 'RBB' ? 'Rastriya Banijya Bank (RBB)' :
                                account === 'SAHAKARI' ? 'Sahakari Cooperatives' :
                                account === 'ESEWA' ? 'E-Sewa Wallet' :
                                account === 'CASH' ? 'Cash in Hand' :
                                'Customer Credit Dues (DUE)';
                  return (
                    <div key={account} className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 space-y-3.5 relative overflow-hidden">
                      <div className="flex items-center justify-between border-b border-slate-150/70 pb-2">
                        <span className="text-xs font-bold text-slate-800 font-display flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          {label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Opening Amt (Rs.)</label>
                          <input 
                            type="number"
                            step="any"
                            required
                            value={accountDetails.openingBalance}
                            onChange={(e) => setLocalBalances(prev => ({
                              ...prev,
                              [account]: {
                                ...prev[account],
                                openingBalance: parseFloat(e.target.value) || 0
                              }
                            }))}
                            className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white font-mono font-bold"
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Opening Date (B.S.)</label>
                          <input 
                            type="text"
                            required
                            value={accountDetails.openingBalanceDate}
                            onChange={(e) => setLocalBalances(prev => ({
                              ...prev,
                              [account]: {
                                ...prev[account],
                                openingBalanceDate: e.target.value
                              }
                            }))}
                            className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white font-mono"
                            placeholder="2083-01-01"
                          />
                        </div>
                      </div>

                      {/* Proof Upload Area */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Statement Proof Image *</label>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="w-full flex flex-col items-center justify-center border border-dashed border-slate-300 hover:border-emerald-500 rounded-lg py-2 px-3 bg-white text-center cursor-pointer transition">
                              <span className="text-[10px] font-bold text-slate-500">Upload Statement Pic</span>
                              <span className="text-[8px] text-slate-400">JPEG/PNG under 100KB</span>
                              <input 
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.size > 204800) {
                                      alert('Error: Image file size must be less than 200KB to fit in database.');
                                      return;
                                    }
                                    handleFileChange(account, file);
                                  }
                                }}
                              />
                            </label>
                          </div>

                          {/* Miniature base64 preview and Statement View option */}
                          {accountDetails.openingBalanceProof && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedStatementProof({
                                  account,
                                  imageUrl: accountDetails.openingBalanceProof!,
                                  balance: accountDetails.openingBalance,
                                  date: accountDetails.openingBalanceDate
                                })}
                                className="relative w-12 h-12 rounded-lg border border-slate-200 overflow-hidden group shrink-0 bg-white shadow-3xs cursor-pointer focus:ring-2 focus:ring-indigo-500"
                                title="Click to view full bank statement image"
                              >
                                <img 
                                  src={accountDetails.openingBalanceProof} 
                                  alt="Proof preview" 
                                  className="w-full h-full object-cover group-hover:scale-105 transition"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
                                  <Eye size={16} />
                                </div>
                              </button>

                              <div className="flex flex-col gap-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedStatementProof({
                                    account,
                                    imageUrl: accountDetails.openingBalanceProof!,
                                    balance: accountDetails.openingBalance,
                                    date: accountDetails.openingBalanceDate
                                  })}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg transition flex items-center gap-1 cursor-pointer"
                                  title="View Bank Statement Image"
                                >
                                  <Eye size={12} />
                                  <span>View Statement</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setLocalBalances(prev => ({
                                    ...prev,
                                    [account]: {
                                      ...prev[account],
                                      openingBalanceProof: undefined
                                    }
                                  }))}
                                  className="px-2 py-0.5 text-rose-600 hover:bg-rose-50 text-[10px] font-bold rounded transition text-left cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-150 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Opening balances establish initial equity for all bank ledgers.</span>
                <button 
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  {balancesSaved ? <CheckCircle2 size={14} /> : null}
                  <span>{balancesSaved ? 'Balances Saved' : 'Save Opening Balances'}</span>
                </button>
              </div>
            </form>
          </div>
      )}

      {/* 4. USER ACCOUNTS & PERMISSIONS SUBTAB */}
      {adminSubTab === 'users' && (
        !isSystemMaster ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center shadow-xs max-w-xl mx-auto space-y-4 my-8">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mx-auto">
              <ShieldAlert size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Access Restricted • System Master Only</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              The User Accounts & Permissions management console is strictly restricted to the System Master account (<code className="bg-slate-100 text-rose-700 px-1.5 py-0.5 rounded font-mono font-bold">@reliableadmin</code>). Other accounts cannot access this tab or modify system permissions.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setAdminSubTab('shareholders')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Return to Shareholders Directory
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* PERMISSIONS MATRIX MANAGEMENT SECTION */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-150">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Key size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 font-display">
                        Granular Permission Matrix (ट्याब तथा कार्य अनुमति व्यवस्थापन)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Configure full access, visibility, editing, and deletion rights per user type or specific account.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSavePermissions}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <ShieldCheck size={15} />
                    <span>Save Permissions</span>
                  </button>
                </div>
              </div>

              {/* Success Notification */}
              {permissionSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{permissionSuccessMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPermissionSuccessMsg(null)}
                    className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-0.5"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Target Account Dropdown & Presets Toolbar */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1 flex-1 max-w-xl">
                    <label className="text-[11px] font-bold text-slate-700 uppercase font-mono flex items-center gap-1.5">
                      <UserCheck size={14} className="text-indigo-600" />
                      <span>Select User Account or Role to Configure (प्रयोगकर्ता वा भूमिका चयन गर्नुहोस्):</span>
                    </label>
                    <select
                      value={selectedPermissionTarget}
                      onChange={(e) => handlePermissionTargetChange(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <optgroup label="Standard System User Roles (भूमिका अनुसारको पूर्वनिर्धारित अनुमति)">
                        <option value="role:User">Role: Standard User / Staff (क्यासियर तथा कर्मचारी)</option>
                        <option value="role:Admin">Role: Administrator (व्यवस्थापक)</option>
                        <option value="role:Shareholder">Role: Shareholder (सेयरधनी प्रतिनिधि)</option>
                        <option value="role:Super Admin">Role: Super Admin (अध्यक्ष / प्रबन्ध निर्देशक)</option>
                      </optgroup>
                      <optgroup label="Individual User Overrides (व्यक्तिगत खाता अनुसार)">
                        <option value="user:reliableadmin">
                          🔒 Master Administrator (@reliableadmin) • ALL ACCESS (LOCKED)
                        </option>
                        {users.map(u => (
                          <option key={u.id} value={`user:${u.id}`}>
                            {u.name} (@{u.username}) — Role: {u.role} {u.staffId ? `• [${u.staffId}]` : ''}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Quick Action Presets */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Quick Presets:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        disabled={selectedPermissionTarget === 'user:reliableadmin'}
                        onClick={handleApplyPresetAllAccess}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        All Access
                      </button>
                      <button
                        type="button"
                        disabled={selectedPermissionTarget === 'user:reliableadmin'}
                        onClick={handleApplyPresetReadOnly}
                        className="px-2.5 py-1 bg-white hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Read-Only View
                      </button>
                      <button
                        type="button"
                        disabled={selectedPermissionTarget === 'user:reliableadmin'}
                        onClick={handleApplyPresetStaffOps}
                        className="px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Staff Standard
                      </button>
                      <button
                        type="button"
                        disabled={selectedPermissionTarget === 'user:reliableadmin'}
                        onClick={handleApplyPresetRevokeAll}
                        className="px-2.5 py-1 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Revoke All
                      </button>
                      {selectedPermissionTarget.startsWith('user:') && selectedPermissionTarget !== 'user:reliableadmin' && (
                        <button
                          type="button"
                          onClick={handleResetToRoleDefaults}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        >
                          Reset to Role Defaults
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Note when Master Account is selected */}
                {selectedPermissionTarget === 'user:reliableadmin' && (
                  <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                    <Lock size={15} className="text-amber-700 shrink-0" />
                    <span>
                      <strong>System Master Account (@reliableadmin):</strong> Irrevocably holds 100% full access to all tabs, subtabs, editing, and deletion actions. These rights are protected and cannot be modified or revoked.
                    </span>
                  </div>
                )}
              </div>

              {/* PERMISSION TABLE */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 text-xs uppercase font-mono tracking-wider font-bold">
                        <th className="py-3 px-4 w-72">Tabs and Subtabs (ट्याब तथा मड्युल)</th>
                        <th className="py-3 px-3 text-center w-28">
                          <button
                            type="button"
                            disabled={selectedPermissionTarget === 'user:reliableadmin'}
                            onClick={handleBulkToggleAllAccess}
                            className="inline-flex items-center gap-1 hover:text-indigo-600 cursor-pointer disabled:cursor-not-allowed"
                            title="Toggle All Access for all modules"
                          >
                            <span>All Access</span>
                          </button>
                        </th>
                        <th className="py-3 px-3 text-center w-28">
                          <button
                            type="button"
                            disabled={selectedPermissionTarget === 'user:reliableadmin'}
                            onClick={handleBulkToggleVisible}
                            className="inline-flex items-center gap-1 hover:text-indigo-600 cursor-pointer disabled:cursor-not-allowed"
                            title="Toggle Visibility for all modules"
                          >
                            <span>Visible</span>
                          </button>
                        </th>
                        <th className="py-3 px-3 text-center w-28">
                          <button
                            type="button"
                            disabled={selectedPermissionTarget === 'user:reliableadmin'}
                            onClick={handleBulkToggleCanEdit}
                            className="inline-flex items-center gap-1 hover:text-indigo-600 cursor-pointer disabled:cursor-not-allowed"
                            title="Toggle Edit rights for all modules"
                          >
                            <span>Edit Data</span>
                          </button>
                        </th>
                        <th className="py-3 px-3 text-center w-28">
                          <button
                            type="button"
                            disabled={selectedPermissionTarget === 'user:reliableadmin'}
                            onClick={handleBulkToggleCanDelete}
                            className="inline-flex items-center gap-1 hover:text-indigo-600 cursor-pointer disabled:cursor-not-allowed"
                            title="Toggle Delete rights for all modules"
                          >
                            <span>Delete Data</span>
                          </button>
                        </th>
                        <th className="py-3 px-3 text-center w-28">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-xs">
                      {Array.from(new Set(SYSTEM_MODULES_LIST.map(m => m.category))).map(category => {
                        const categoryModules = SYSTEM_MODULES_LIST.filter(m => m.category === category);
                        const enabledCount = categoryModules.filter(m => permissionMatrix[m.id]?.visible).length;

                        return (
                          <React.Fragment key={category}>
                            {/* Category Header Row */}
                            <tr className="bg-slate-50/70 border-y border-slate-200">
                              <td colSpan={6} className="py-2 px-4">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    {category}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {enabledCount} of {categoryModules.length} visible
                                  </span>
                                </div>
                              </td>
                            </tr>

                            {/* Category Module Rows */}
                            {categoryModules.map(mod => {
                              const rule = permissionMatrix[mod.id] || { visible: false, canEdit: false, canDelete: false };
                              const isAllAccess = rule.visible && rule.canEdit && rule.canDelete;
                              const isLockedMaster = selectedPermissionTarget === 'user:reliableadmin';

                              let statusLabel = 'Denied';
                              let statusBadgeClass = 'bg-slate-100 text-slate-400 border-slate-200';

                              if (isAllAccess) {
                                statusLabel = 'All Access';
                                statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                              } else if (rule.visible && rule.canEdit) {
                                statusLabel = 'View + Edit';
                                statusBadgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                              } else if (rule.visible) {
                                statusLabel = 'Read Only';
                                statusBadgeClass = 'bg-sky-50 text-sky-700 border-sky-200';
                              }

                              return (
                                <tr
                                  key={mod.id}
                                  className={`transition-colors hover:bg-slate-50/80 ${
                                    rule.visible ? 'bg-white' : 'bg-slate-50/30 opacity-75'
                                  }`}
                                >
                                  {/* Tab / Subtab Name */}
                                  <td className="py-2.5 px-4">
                                    <div className="flex items-start gap-2.5">
                                      <div className={`mt-0.5 shrink-0 ${mod.parentId ? 'ml-4' : ''}`}>
                                        {mod.id === 'dashboard' && <Activity size={15} className="text-sky-600" />}
                                        {mod.id === 'ecommerce' && <Sparkles size={15} className="text-indigo-600" />}
                                        {mod.id === 'sales' && <CreditCard size={15} className="text-emerald-600" />}
                                        {mod.id === 'services' && <Settings size={15} className="text-amber-600" />}
                                        {mod.id === 'customers' && <Users size={15} className="text-blue-600" />}
                                        {mod.id === 'reports' && <FileText size={15} className="text-indigo-600" />}
                                        {mod.id === 'daily_closing' && <Calendar size={15} className="text-violet-600" />}
                                        {mod.id === 'expenses' && <DollarSign size={15} className="text-rose-600" />}
                                        {mod.id === 'suppliers' && <Building2 size={15} className="text-orange-600" />}
                                        {mod.id === 'transactions' && <Wallet size={15} className="text-teal-600" />}
                                        {mod.id === 'inventory' && <Database size={15} className="text-amber-600" />}
                                        {mod.id === 'assets_management' && <ShieldCheck size={15} className="text-emerald-600" />}
                                        {mod.id === 'staff_attendance' && <Clock size={15} className="text-sky-600" />}
                                        {mod.id === 'staff_requests' && <AlertCircle size={15} className="text-purple-600" />}
                                        {mod.id === 'email_inbox' && <Mail size={15} className="text-cyan-600" />}
                                        {mod.id === 'letters' && <BookOpen size={15} className="text-blue-600" />}
                                        {mod.id === 'meeting_mynotes' && <MessageSquare size={15} className="text-amber-600" />}
                                        {mod.id === 'settings' && <Settings size={15} className="text-indigo-600" />}
                                      </div>

                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-bold text-slate-800 text-xs">{mod.label}</span>
                                          <span className="text-[11px] text-indigo-700 font-medium">({mod.labelNepali})</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-normal line-clamp-1">{mod.description}</p>
                                      </div>
                                    </div>
                                  </td>

                                  {/* All Access Checkbox */}
                                  <td className="py-2.5 px-3 text-center">
                                    <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                      <input
                                        type="checkbox"
                                        disabled={isLockedMaster}
                                        checked={isAllAccess}
                                        onChange={() => handleToggleRowAllAccess(mod.id)}
                                        className="w-4 h-4 rounded-md text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                                      />
                                    </label>
                                  </td>

                                  {/* Visible Checkbox */}
                                  <td className="py-2.5 px-3 text-center">
                                    <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                      <input
                                        type="checkbox"
                                        disabled={isLockedMaster}
                                        checked={!!rule.visible}
                                        onChange={() => handleToggleVisible(mod.id)}
                                        className="w-4 h-4 rounded-md text-sky-600 border-slate-300 focus:ring-sky-500 cursor-pointer disabled:cursor-not-allowed"
                                      />
                                    </label>
                                  </td>

                                  {/* Edit Data Checkbox */}
                                  <td className="py-2.5 px-3 text-center">
                                    <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                      <input
                                        type="checkbox"
                                        disabled={isLockedMaster}
                                        checked={!!rule.canEdit}
                                        onChange={() => handleToggleCanEdit(mod.id)}
                                        className="w-4 h-4 rounded-md text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer disabled:cursor-not-allowed"
                                      />
                                    </label>
                                  </td>

                                  {/* Delete Data Checkbox */}
                                  <td className="py-2.5 px-3 text-center">
                                    <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                      <input
                                        type="checkbox"
                                        disabled={isLockedMaster}
                                        checked={!!rule.canDelete}
                                        onChange={() => handleToggleCanDelete(mod.id)}
                                        className="w-4 h-4 rounded-md text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer disabled:cursor-not-allowed"
                                      />
                                    </label>
                                  </td>

                                  {/* Status Pill */}
                                  <td className="py-2.5 px-3 text-center">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border font-mono ${statusBadgeClass}`}>
                                      {statusLabel}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Save Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-150">
                <span className="text-[11px] text-slate-500">
                  ⚡ When you click <strong>Save Permissions</strong>, changes take effect immediately across all active workspaces.
                </span>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  <ShieldCheck size={16} />
                  <span>Save Permissions Configuration</span>
                </button>
              </div>
            </div>

            {/* REGISTERED USER ACCOUNTS & PROFILES DIRECTORY */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
              <h3 className="text-base font-bold text-slate-900 font-display border-b border-slate-150 pb-3 flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                <span>Registered User Accounts Directory (दर्ता गरिएका प्रयोगकर्ता खाताहरू)</span>
              </h3>

              {/* Add User Form */}
              {isMasterAccount && (
                <form onSubmit={handleAddUser} className="space-y-3.5 bg-slate-50/50 p-4 rounded-xl border border-slate-150/60">
                  <span className="text-[10px] font-bold text-slate-500 font-mono flex items-center gap-1 uppercase">
                    <UserPlus size={11} />
                    <span>Register New User Account</span>
                  </span>

                  <div className="space-y-3 bg-white p-3.5 rounded-lg border border-slate-100">
                    <p className="text-[9px] font-mono text-indigo-600 uppercase font-bold tracking-wider">1. Account Credentials</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600 block">Username / ID *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. ram_fikkal"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value.trim().toLowerCase())}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600 block">Email Address (for OTP & Reset)</label>
                    <input 
                      type="email"
                      placeholder="e.g. staff@reliabletech.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value.trim().toLowerCase())}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600 block">Password *</label>
                    <input 
                      type="text"
                      required
                      placeholder="Enter login password..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600 block">Access Role *</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                    >
                      <option value="User">User (Staff)</option>
                      <option value="Admin">Admin</option>
                      <option value="Shareholder">Shareholder Account</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-white p-3.5 rounded-lg border border-slate-100">
                <p className="text-[9px] font-mono text-indigo-600 uppercase font-bold tracking-wider">2. Staff Profile & Salary</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-amber-900 block">Staff ID Number (कर्मचारी परिचय पत्र नं.)</label>
                    <input 
                      type="text"
                      placeholder="e.g. RT-EMP-001 (Leave empty for auto-generated)"
                      value={newStaffId}
                      onChange={(e) => setNewStaffId(e.target.value)}
                      className="w-full border border-amber-300 rounded-lg p-2 text-xs bg-amber-50/50 focus:outline-hidden focus:border-indigo-500 font-mono font-bold text-amber-950"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600 block">Full Name of Staff (English) *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Ramesh Bhandari"
                      value={newRealName}
                      onChange={(e) => setNewRealName(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600 block">Name in Nepali (नाम नेपालीमा)</label>
                    <input 
                      type="text"
                      placeholder="e.g. श्री अर्पण खड्का"
                      value={newNameNepali}
                      onChange={(e) => setNewNameNepali(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600 block">Post / Designation (English) *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Senior Tech, Accountant, Chairman"
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600 block">Designation in Nepali (पद नेपालीमा)</label>
                    <input 
                      type="text"
                      placeholder="e.g. अध्यक्ष (प्रबन्ध निर्देशक)"
                      value={newDesignationNepali}
                      onChange={(e) => setNewDesignationNepali(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600 block">Monthly Salary (Rs.) *</label>
                    <input 
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 25000"
                      value={newMonthlySalary}
                      onChange={(e) => setNewMonthlySalary(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden font-mono text-emerald-600 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600 block">Contact Number *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. +977-985..."
                      value={newContactNumber}
                      onChange={(e) => setNewContactNumber(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600 block">Residential Address *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Fikkal Bazar, Ilam"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-white p-3.5 rounded-lg border border-slate-100">
                <p className="text-[9px] font-mono text-indigo-600 uppercase font-bold tracking-wider">3. Government Citizenship Identity Verification</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600 block">Citizenship Number *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. 10-02-76-12345"
                      value={newCitizenshipNumber}
                      onChange={(e) => setNewCitizenshipNumber(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600 block">Issue Date (B.S.) *</label>
                    <input 
                      type="text"
                      required
                      placeholder="YYYY-MM-DD"
                      value={newIssueDate}
                      onChange={(e) => setNewIssueDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600 block">Issue District & Office *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. DAO Ilam"
                      value={newIssueDistrictAndOffice}
                      onChange={(e) => setNewIssueDistrictAndOffice(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 h-9 mt-1"
              >
                <Plus size={14} />
                <span>Register New User</span>
              </button>

              {userError && (
                <div className="text-[10px] text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-100">{userError}</div>
              )}
            </form>
          )}

          {/* User accounts list */}
          <div className="divide-y divide-slate-100">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  {/* PP Size Photo Thumbnail */}
                  <div className="w-10 h-12 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden relative shrink-0">
                    {u.profilePhoto ? (
                      <>
                        <img src={u.profilePhoto} alt={u.name} className="w-full h-full object-cover" />
                        {u.photoApproved === false && (
                          <span className="absolute top-0 right-0 bg-amber-500 text-white text-[6px] font-black px-0.5 rounded-bl-sm">
                            ⏳
                          </span>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <User size={16} />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-xs">{u.name}</span>
                      {u.nameNepali && <span className="text-xs text-indigo-700 font-semibold font-sans">({u.nameNepali})</span>}
                      <span className="text-[10px] text-slate-400 font-mono">@{u.username}</span>
                      {u.staffId && (
                        <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded-md">
                          ID: {u.staffId}
                        </span>
                      )}
                      {u.profilePhoto && u.photoApproved === false && (
                        <span className="text-[9px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded-md">
                          ⏳ Pending Photo Approval
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                      <p>
                        Role: <span className={`font-semibold ${u.role === 'Admin' ? 'text-indigo-600 font-bold' : 'text-slate-600'}`}>{u.role}</span>
                      </p>
                      <span>•</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>Password:</span>
                        {editingUserPasswordId === u.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={newPasswordValue}
                              onChange={(e) => setNewPasswordValue(e.target.value)}
                              className="px-1.5 py-0.5 bg-white border border-slate-250 rounded-md text-[10px] font-mono w-28 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 font-semibold"
                              placeholder="New password..."
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (newPasswordValue.trim()) {
                                    onUpdateUsers(users.map(user => user.id === u.id ? { ...user, password: newPasswordValue.trim() } : user));
                                    setEditingUserPasswordId(null);
                                    setNewPasswordValue('');
                                  }
                                } else if (e.key === 'Escape') {
                                  setEditingUserPasswordId(null);
                                  setNewPasswordValue('');
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!newPasswordValue.trim()) return;
                                onUpdateUsers(users.map(user => user.id === u.id ? { ...user, password: newPasswordValue.trim() } : user));
                                setEditingUserPasswordId(null);
                                setNewPasswordValue('');
                              }}
                              className="px-1.5 py-0.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-md text-[9px] font-bold transition active:scale-95 cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUserPasswordId(null);
                                setNewPasswordValue('');
                              }}
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-md text-[9px] font-bold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <span className="font-mono bg-indigo-50 text-indigo-950 px-1.5 py-0.5 rounded-md font-semibold text-slate-750">{u.password || 'adminpassword'}</span>
                            {isMasterAccount && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUserPasswordId(u.id);
                                  setNewPasswordValue(u.password || '');
                                }}
                                className="text-[9px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                              >
                                [Change]
                              </button>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    {u.post && (
                      <div className="mt-1.5 flex flex-wrap gap-1 text-[9px] font-mono">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">Post: {u.post}{u.designationNepali ? ` (${u.designationNepali})` : ''}</span>
                        {u.email && <span className="bg-sky-50 border border-sky-200 text-sky-800 px-2 py-0.5 rounded-full font-bold">Email: {u.email}</span>}
                        <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Salary: Rs. {u.monthlySalary?.toLocaleString()}</span>
                        {u.contactNumber && <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Contact: {u.contactNumber}</span>}
                        {u.citizenshipNumber && <span className="bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Citizenship: {u.citizenshipNumber} (Issued {u.issueDate} @ {u.issueDistrictAndOffice})</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* EDIT USER BUTTON FOR @reliableadmin */}
                  {isMasterAccount && (
                    <button 
                      type="button"
                      onClick={() => handleOpenEditUserModal(u)}
                      className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                      title="Edit User Details & Staff Profile"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                  {u.username !== 'reliableadmin' && isMasterAccount ? (
                    <button 
                      type="button"
                      onClick={() => handleDeleteUser(u.id, u.username)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Remove User Account"
                    >
                      <Trash2 size={13} />
                    </button>
                  ) : u.username === 'reliableadmin' ? (
                    <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold border border-indigo-100">System Master</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  )}

      {/* EDIT USER MODAL FOR @reliableadmin */}
      {editingUser && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 my-auto animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 sticky top-0 bg-white z-10 pt-1">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Edit User Account & Staff Details</h3>
                  <p className="text-[10px] text-slate-500 font-mono">Editing profile for @{editingUser.username}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-4">
              {/* Photo Upload & Approval in Edit Modal */}
              <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 flex items-center gap-4">
                <div className="w-14 h-16 rounded-lg border-2 border-dashed border-sky-300 bg-white overflow-hidden relative shrink-0">
                  {editUserProfilePhoto ? (
                    <img src={editUserProfilePhoto} alt="PP" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <User size={20} />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-sky-950 uppercase font-mono">Passport Size Photo (PP)</label>
                    {editUserProfilePhoto && (
                      <button
                        type="button"
                        onClick={() => setEditUserProfilePhoto('')}
                        className="text-[9px] text-rose-600 hover:underline font-bold"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="bg-white border border-sky-300 hover:bg-sky-50 text-sky-900 text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer">
                      Upload / Replace Photo
                      <input type="file" accept="image/*" onChange={handleEditPhotoUpload} className="hidden" />
                    </label>
                    {editUserProfilePhoto && (
                      <button
                        type="button"
                        onClick={() => setEditUserPhotoApproved(!editUserPhotoApproved)}
                        className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg border cursor-pointer ${
                          editUserPhotoApproved 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                            : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                        }`}
                      >
                        {editUserPhotoApproved ? '✅ Photo Approved' : '⏳ Photo Pending Approval (Click to Approve)'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">Full Name (English) *</label>
                  <input 
                    type="text"
                    required
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">Full Name (Nepali)</label>
                  <input 
                    type="text"
                    value={editUserNameNepali}
                    onChange={(e) => setEditUserNameNepali(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-indigo-700 block font-mono">Username *</label>
                  <input 
                    type="text"
                    required
                    disabled={editingUser.username === 'reliableadmin'}
                    value={editUserUsername}
                    onChange={(e) => setEditUserUsername(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold bg-white disabled:bg-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-indigo-700 block font-mono">Email Address (for OTP & Reset)</label>
                  <input 
                    type="email"
                    placeholder="e.g. staff@reliabletech.com"
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value.trim().toLowerCase())}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono bg-white font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">System Password *</label>
                  <input 
                    type="text"
                    required
                    value={editUserPassword}
                    onChange={(e) => setEditUserPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono bg-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-amber-900 block font-mono">Staff ID Number (कर्मचारी नं.)</label>
                  <input 
                    type="text"
                    value={editUserStaffId}
                    onChange={(e) => setEditUserStaffId(e.target.value)}
                    className="w-full border border-amber-300 rounded-lg p-2 text-xs font-mono font-bold bg-amber-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">System Role *</label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white font-bold"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                    <option value="Shareholder">Shareholder</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">Post / Designation (English)</label>
                  <input 
                    type="text"
                    value={editUserPost}
                    onChange={(e) => setEditUserPost(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">Post / Designation (Nepali)</label>
                  <input 
                    type="text"
                    value={editUserDesignationNepali}
                    onChange={(e) => setEditUserDesignationNepali(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">Contact Number</label>
                  <input 
                    type="text"
                    value={editUserContactNumber}
                    onChange={(e) => setEditUserContactNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">Monthly Salary (NPR)</label>
                  <input 
                    type="number"
                    value={editUserMonthlySalary}
                    onChange={(e) => setEditUserMonthlySalary(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white font-mono font-bold"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-700 block">Address</label>
                  <input 
                    type="text"
                    value={editUserAddress}
                    onChange={(e) => setEditUserAddress(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">Citizenship Number</label>
                  <input 
                    type="text"
                    value={editUserCitizenshipNumber}
                    onChange={(e) => setEditUserCitizenshipNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">Issue District & Office</label>
                  <input 
                    type="text"
                    value={editUserIssueDistrictAndOffice}
                    onChange={(e) => setEditUserIssueDistrictAndOffice(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
                >
                  Save User Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. SYSTEM BACKUP & UNITS CATALOG SUBTAB */}
      {adminSubTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Custom Units Section */}
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-xs space-y-6">
              <h3 className="text-lg font-bold text-slate-800 font-display border-b border-slate-100 pb-3 flex items-center gap-2">
                <Settings size={18} className="text-indigo-500" />
                <span>Units of Measurement Catalog</span>
              </h3>

              <form onSubmit={handleAddUnit} className="flex gap-2 items-end p-4 border border-slate-150/60 rounded-xl bg-slate-50/20">
                <div className="space-y-1 flex-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase font-mono">New Custom Unit *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. kg, ltr, pcs, bag, box, packet..."
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg shrink-0 transition cursor-pointer flex items-center justify-center h-9"
                  title="Add Unit"
                >
                  <Plus size={14} />
                </button>
              </form>
              {unitError && (
                <p className="text-xs text-rose-600 font-bold px-1">{unitError}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {units.map(unit => {
                  const isProtected = ['Flat', 'Hourly', 'Monthly', 'Per Unit'].includes(unit);
                  return (
                    <div key={unit} className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 font-mono">
                      <span>{unit}</span>
                      {!isProtected && (
                        <button 
                          type="button" 
                          onClick={() => handleDeleteUnit(unit)}
                          className="text-slate-400 hover:text-rose-600 transition cursor-pointer font-bold pl-1 text-sm leading-none"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 1 Column: Standalone Exporter & Reset options */}
          <div className="space-y-6">
          
          {/* System Operations Manual Card - STRICTLY ADMIN ONLY */}
          {currentUser.role === 'Admin' && (
            <div className="bg-white rounded-xl p-5 border border-slate-150 shadow-xs space-y-4">
              <h4 className="font-bold font-display text-sm text-slate-800 flex items-center gap-2">
                <BookOpen className="text-indigo-600" size={16} />
                <span>System Operations Manuals</span>
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                As an Administrator, download comprehensive operational handbooks. You can print them or save as PDFs. Admin manual covers financial ledgers audit and daily closing gates. Staff manual covers client invoicing and checkout operations. Provide staff members their manual document manually off-system.
              </p>
              
              <div className="space-y-2 pt-1">
                <button 
                  onClick={() => handleDownloadManual('Admin')}
                  className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer active:scale-98 shadow-sm"
                >
                  <Download size={14} />
                  <span>Download Administrator Manual</span>
                </button>
                
                <button 
                  onClick={() => handleDownloadManual('User')}
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer active:scale-98"
                >
                  <Download size={14} className="text-slate-500" />
                  <span>Download Staff/User Manual</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Standing Legend Generator */}
          <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 space-y-4">
            <h4 className="font-bold font-display text-sm text-slate-100 flex items-center gap-2">
              <span>💎 Standalone HTML Exporter</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compile your entire Reliabletech database into a <strong className="text-indigo-300">portable single-file offline application</strong>. Ideal for backup, USB-stick storage, or run-from-desktop offline operations.
            </p>
            <button 
              onClick={handleExportHTML}
              className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-3 px-4 rounded-xl transition cursor-pointer shadow-md"
            >
              <Download size={14} />
              <span>Export Portable HTML (.html)</span>
            </button>
          </div>

          {/* Backup Options */}
          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm">System Database Connector</h4>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active: rtssdatabase.db
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Your system reads and writes directly to single-file SQLite database <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-bold">rtssdatabase.db</code> on disk automatically without delay. You can download the live database or upload an <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-bold">rtssdatabase.db</code> file to restore the entire system.
            </p>
            <div className="space-y-3">
              {/* Direct SQLite DB File Download */}
              <a 
                href="/api/db/download"
                download="rtssdatabase.db"
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer shadow-xs"
              >
                <Database size={14} className="text-indigo-400" />
                <span>Download SQLite Database (rtssdatabase.db)</span>
              </a>

              {/* Export JSON / DB Snapshot */}
              <button 
                onClick={handleExportJSON}
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                <Download size={14} className="text-slate-400" />
                <span>Download JSON Backup Snapshot (.json)</span>
              </button>

              {/* Import & Restore .db / .json - Super Admin Only */}
              {isMasterAccount && (
                <div className="relative pt-1 space-y-1.5">
                  <input 
                    type="file"
                    accept=".db,.sqlite,.sqlite3,.json"
                    onChange={handleRestoreDatabase}
                    disabled={isRestoring}
                    className="hidden"
                    id="import-database-file"
                  />
                  <label 
                    htmlFor="import-database-file"
                    className={`w-full inline-flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer border shadow-3xs ${
                      isRestoring
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                    }`}
                  >
                    {isRestoring ? (
                      <>
                        <RefreshCw size={14} className="text-indigo-500 animate-spin" />
                        <span>Restoring & Linking rtssdatabase.db...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} className="text-indigo-500" />
                        <span>Restore & Import into SQLite DB (.db / .json)</span>
                      </>
                    )}
                  </label>
                  <p className="text-[10px] text-slate-500 text-center leading-tight">
                    Upload an <code className="font-mono text-indigo-700 font-bold">rtssdatabase.db</code> file to replace and sync system data, or a JSON backup.
                  </p>
                </div>
              )}

              {/* Status messages */}
              {importError && (
                <div className="text-[11px] text-rose-700 leading-normal bg-rose-50 p-3 rounded-xl border border-rose-200 flex items-start gap-2">
                  <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Restore Error:</span>
                    <span>{importError}</span>
                  </div>
                </div>
              )}
              {importSuccess && (
                <div className="text-[11px] text-emerald-800 leading-normal bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Restore Successful:</span>
                    <span>{importSuccessMsg || 'Database restored and written to rtssdatabase.db successfully!'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone Block - Super Admin / System Master Only */}
          {isMasterAccount && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-rose-600" />
                <span>Danger Zone</span>
              </h4>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Critical maintenance operations. Actions performed here permanently affect recorded system data.
              </p>

              {/* Date-Range Wipe & Reset System - Restricted ONLY to reliableadmin (System Master) */}
              {isReliableAdmin && (
                <div className="bg-white p-4 rounded-xl border border-rose-200 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                    <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                      <Trash2 size={14} className="text-rose-600" />
                      मिति अनुसार डाटा मेटाउने (Wipe Entries by Date Range)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 uppercase tracking-wider">
                      @reliableadmin Master Only
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    छानिएको मिति दायरा भित्र प्रणालीका सम्पूर्ण ट्याबहरू (बिलिङ, खरिद, खर्च, दैनिक हिसाब, तलब, बैंक ट्रान्सफर, स्टाफ अनुरोधहरू) मा प्रविष्टि गरिएका सम्पूर्ण रेकर्डहरू पूर्ण रूपमा मेटिनेछ।
                  </p>

                  {/* Quick Date Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">छिटो छनोट (Presets):</span>
                    <button
                      type="button"
                      onClick={() => {
                        setWipeFromDate('2080-01-01');
                        setWipeToDate('2085-12-30');
                        setWipeSuccessMsg(null);
                      }}
                      className="text-[10px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded transition cursor-pointer"
                    >
                      सबै रेकर्डहरू (All)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWipeFromDate('2082-04-01');
                        setWipeToDate('2083-03-32');
                        setWipeSuccessMsg(null);
                      }}
                      className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded transition cursor-pointer"
                    >
                      आ.व. २०८२/८३
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWipeFromDate('2083-04-01');
                        setWipeToDate('2084-03-32');
                        setWipeSuccessMsg(null);
                      }}
                      className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded transition cursor-pointer"
                    >
                      आ.व. २०८३/८४
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const today = getCurrentBsDate();
                        setWipeFromDate(today);
                        setWipeToDate(today);
                        setWipeSuccessMsg(null);
                      }}
                      className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded transition cursor-pointer"
                    >
                      आज मात्र (Today)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">From Date (सुरु मिति)</label>
                      <NepaliDatePicker
                        value={wipeFromDate}
                        onChange={(val) => {
                          setWipeFromDate(val);
                          setWipeSuccessMsg(null);
                        }}
                        className="w-full text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">To Date (अन्तिम मिति)</label>
                      <NepaliDatePicker
                        value={wipeToDate}
                        onChange={(val) => {
                          setWipeToDate(val);
                          setWipeSuccessMsg(null);
                        }}
                        className="w-full text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] bg-rose-50/70 p-2.5 rounded-lg border border-rose-100">
                    <span className="text-slate-700">Selected Date Range Matches:</span>
                    <span className="font-bold text-rose-700">{previewWipeCount} records found</span>
                  </div>

                  {wipeSuccessMsg && (
                    <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span>{wipeSuccessMsg}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (!wipeFromDate || !wipeToDate) {
                        alert('Please choose both From and To dates.');
                        return;
                      }
                      setShowWipeModal(true);
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition cursor-pointer shadow-xs"
                  >
                    <Trash2 size={13} />
                    <span>मिती दायरा भित्रका सम्पूर्ण डाटा मेटाउनुहोस् (Wipe Date Range Entries)</span>
                  </button>
                </div>
              )}

              <div className="pt-2 border-t border-rose-200/80">
                <button 
                  type="button"
                  onClick={() => setShowDemoResetModal(true)}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold py-2 px-4 rounded-xl transition cursor-pointer"
                >
                  <RefreshCw size={13} />
                  <span>Restore Demo State</span>
                </button>
              </div>
            </div>
          )}

          {/* In-App Confirmation Modal: Date Range Wipe */}
          {showWipeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl max-w-lg w-full border border-rose-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-rose-600 text-white px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertTriangle size={18} className="text-amber-300" />
                    <span>डाटा मेटाउने निश्चितता (Permanent Wipe Confirmation)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowWipeModal(false)}
                    className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-rose-700 transition"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">छानिएको मिति दायरा (Date Range):</span>
                      <span className="font-bold text-rose-950 font-mono bg-rose-100 px-2 py-0.5 rounded">
                        {wipeFromDate} देखि {wipeToDate} सम्म
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-rose-200/70">
                      <span className="text-slate-600 font-medium">कूल मेटिने रेकर्ड संख्या (Total Records):</span>
                      <span className="font-black text-rose-700 text-sm">
                        {previewWipeCount} वटा
                      </span>
                    </div>
                  </div>

                  {/* Details Breakdown */}
                  {previewWipeCount > 0 ? (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-700 block">मेटिने रेकर्डहरूको वर्गीकरण (Category Breakdown):</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                          <span className="text-slate-500 block text-[10px]">बिलिङ</span>
                          <span className="font-bold text-slate-800">{previewWipeDetails.invoices}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                          <span className="text-slate-500 block text-[10px]">सामान खरिद</span>
                          <span className="font-bold text-slate-800">{previewWipeDetails.tx}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                          <span className="text-slate-500 block text-[10px]">खर्चहरू</span>
                          <span className="font-bold text-slate-800">{previewWipeDetails.exp}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                          <span className="text-slate-500 block text-[10px]">दैनिक हिसाब</span>
                          <span className="font-bold text-slate-800">{previewWipeDetails.closings}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                          <span className="text-slate-500 block text-[10px]">बैंक ट्रान्सफर</span>
                          <span className="font-bold text-slate-800">{previewWipeDetails.transfers}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                          <span className="text-slate-500 block text-[10px]">तलब सिट</span>
                          <span className="font-bold text-slate-800">{previewWipeDetails.salaries}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                          <span className="text-slate-500 block text-[10px]">मिटिङ नोट</span>
                          <span className="font-bold text-slate-800">{previewWipeDetails.notes}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                          <span className="text-slate-500 block text-[10px]">स्टाफ अनुरोध</span>
                          <span className="font-bold text-slate-800">{previewWipeDetails.reqs}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                      ⚠️ छानिएको मिति ({wipeFromDate} देखि {wipeToDate}) भित्र कुनै पनि रेकर्ड भेटिएन। यदि पुराना रेकर्डहरू मेटाउन चाहनुहुन्छ भने माथिको <strong>"सबै रेकर्डहरू (All)"</strong> वा उपयुक्त मिति छान्नुहोस्।
                    </div>
                  )}

                  <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    ⚠️ <strong>चेतावनी:</strong> यो प्रक्रिया सम्पन्न भएपछि छानिएको मिति दायरा भित्रका सम्पूर्ण रेकर्डहरू प्रणालीको डेटाबेसबाट स्थायी रूपमा मेटिनेछ। कुनै पनि ट्याबमा यो मितिका डाटा बाँकी रहने छैन।
                  </p>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      disabled={isWiping}
                      onClick={() => setShowWipeModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      रद्द गर्नुहोस् (Cancel)
                    </button>
                    <button
                      type="button"
                      disabled={isWiping}
                      onClick={() => {
                        setIsWiping(true);
                        try {
                          if (onResetDateRange) {
                            const result = onResetDateRange(wipeFromDate, wipeToDate);
                            setWipeSuccessMsg(
                              `सफलतापूर्वक ${result.totalWiped} रेकर्डहरू पूर्ण रूपमा मेटाइयो (${wipeFromDate} देखि ${wipeToDate})। विवरण: ${result.summary}`
                            );
                          }
                          setShowWipeModal(false);
                        } catch (err: any) {
                          alert(err?.message || 'Failed to wipe data');
                        } finally {
                          setIsWiping(false);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition cursor-pointer shadow-sm"
                    >
                      <Trash2 size={14} />
                      <span>{isWiping ? 'मेटाउँदै... (Wiping...)' : `हो, सम्पूर्ण डाटा मेटाउनुहोस् (Confirm & Wipe)`}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* In-App Confirmation Modal: Demo State Reset */}
          {showDemoResetModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl max-w-md w-full border border-rose-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-rose-600 text-white px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <RefreshCw size={18} className="text-amber-300" />
                    <span>डेमो डाटा रिसेट (Restore Demo State)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDemoResetModal(false)}
                    className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-rose-700 transition"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-5 space-y-4 text-xs text-slate-600">
                  <p className="leading-relaxed">
                    CRITICAL WARNING: This will permanently wipe all current custom entries, catalog items, and ledger transactions, restoring the default Fikkal pilot data records.
                  </p>
                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setShowDemoResetModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDemoResetModal(false);
                        onResetDatabase();
                      }}
                      className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer shadow-sm"
                    >
                      Yes, Restore Demo State
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
      )}

      {/* 6. DEDICATED EMAIL ENGINE & QUOTAS SUBTAB */}
      {adminSubTab === 'emails' && (
        <EmailQuotaManagement currentUserRole={currentUser.role} />
      )}

      {/* =========================================
          MODAL DIALOGS FOR SHAREHOLDER MANAGEMENT
         ========================================= */}

      {/* 1. ADD SHAREHOLDER MODAL */}
      {addShareModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-xl w-full p-6 space-y-5 animate-scale-up my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Plus className="text-indigo-600" size={18} />
                <span>सेयरधनी थप फारम (Add Shareholder / Increase Share)</span>
              </h3>
              <button
                type="button"
                onClick={() => setAddShareModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddShareholderSubmit} className="space-y-4">
              {/* Option: Existing or New */}
              <div className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="radio"
                    name="addOption"
                    value="existing"
                    checked={addShareOption === 'existing'}
                    onChange={() => setAddShareOption('existing')}
                    className="accent-indigo-600"
                  />
                  <span>पुराना/विद्यमान सेयरधनी चयन (Select Existing Shareholder)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="radio"
                    name="addOption"
                    value="new"
                    checked={addShareOption === 'new'}
                    onChange={() => setAddShareOption('new')}
                    className="accent-indigo-600"
                  />
                  <span>नयाँ सेयरधनी (Add New Shareholder)</span>
                </label>
              </div>

              {addShareOption === 'existing' ? (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">सेयरधनी चयन गर्नुहोस् (Select Shareholder) *</label>
                  <select
                    value={addShareholderId}
                    onChange={(e) => handleSelectExistingForAdd(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-800"
                  >
                    <option value="">-- सेयरधनी छान्नुहोस् (Select) --</option>
                    {shareholders.map(sh => (
                      <option key={sh.id} value={sh.id}>
                        {sh.name} {sh.address ? `(${sh.address})` : ''} - (हालको सेयर: रु. {(sh.totalShareAmount || 0).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {/* Shareholder Info Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">सेयरधनीको नाम (Name) *</label>
                  <input
                    type="text"
                    required
                    value={addShareName}
                    onChange={(e) => setAddShareName(e.target.value)}
                    placeholder="e.g. राम प्रसाद सुवेदी"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">ठेगाना (Address)</label>
                  <input
                    type="text"
                    value={addShareAddress}
                    onChange={(e) => setAddShareAddress(e.target.value)}
                    placeholder="e.g. फिक्कल, इलाम"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">नागरिकता नं. (Citizenship No)</label>
                  <input
                    type="text"
                    value={addShareCitizenship}
                    onChange={(e) => setAddShareCitizenship(e.target.value)}
                    placeholder="e.g. 10-01-75-01234"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Amount and Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-800 block">सेयर रकम (Amount in Rs.) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    value={addShareAmount}
                    onChange={(e) => setAddShareAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-700 bg-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-800 block">भुक्तानी खाता (Payment Account) *</label>
                  <select
                    value={addSharePayMethod}
                    onChange={(e) => setAddSharePayMethod(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="Cash">CASH (नगद खाता)</option>
                    <option value="RBB">RBB (राष्ट्रिय वाणिज्य बैंक)</option>
                    <option value="Esewa">ESEWA (ई-सेवा)</option>
                    <option value="Sahakari">SAHAKARI (सहकारी खाता)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-800 block">कारोबार मिति (Transaction Date B.S.) *</label>
                  <input
                    type="text"
                    required
                    value={addShareTxDate}
                    onChange={(e) => setAddShareTxDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono bg-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Meeting & Decision Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-indigo-900 block">कारोबार ID / भौचर नं (Tx ID)</label>
                  <input
                    type="text"
                    value={addShareTxIdNo}
                    onChange={(e) => setAddShareTxIdNo(e.target.value)}
                    placeholder="e.g. SH-TX-101"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-indigo-900 block">बैठक नं. (Meeting No)</label>
                  <input
                    type="text"
                    value={addShareMeetingNo}
                    onChange={(e) => setAddShareMeetingNo(e.target.value)}
                    placeholder="e.g. बैठक नं. १२"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-indigo-900 block">बैठक मिति (Meeting Date)</label>
                  <input
                    type="text"
                    value={addShareMeetingDate}
                    onChange={(e) => setAddShareMeetingDate(e.target.value)}
                    placeholder="2082-11-05"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <label className="text-xs font-bold text-indigo-900 block">निर्णय नं. (Decision No)</label>
                  <input
                    type="text"
                    value={addShareDecisionNo}
                    onChange={(e) => setAddShareDecisionNo(e.target.value)}
                    placeholder="e.g. निर्णय नं. ३"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-indigo-900 block">कैफियत (Remarks)</label>
                  <input
                    type="text"
                    value={addShareRemarks}
                    onChange={(e) => setAddShareRemarks(e.target.value)}
                    placeholder="e.g. नयाँ सेयर खरिद बापत रकम प्राप्त"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddShareModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  रद्द गर्नुहोस् (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>सेयर थप सुरक्षित गर्नुहोस् (Save Share)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. RETURN SHARE MODAL */}
      {returnShareModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-xl w-full p-6 space-y-5 animate-scale-up my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-rose-800 flex items-center gap-2">
                <MinusCircle className="text-rose-600" size={18} />
                <span>सेयर रकम फिर्ता / कटौटी फारम (Return / Partial Share Withdrawal)</span>
              </h3>
              <button
                type="button"
                onClick={() => setReturnShareModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleReturnShareSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">सेयरधनी चयन गर्नुहोस् (Select Shareholder) *</label>
                <select
                  value={returnShareholderId}
                  onChange={(e) => setReturnShareholderId(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-rose-500 font-bold text-slate-800"
                >
                  <option value="">-- सेयरधनी छान्नुहोस् (Select) --</option>
                  {shareholders.map(sh => (
                    <option key={sh.id} value={sh.id}>
                      {sh.name} {sh.address ? `(${sh.address})` : ''} - (हालको कुल सेयर: रु. {(sh.totalShareAmount || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Shareholder Current Info */}
              {returnShareholderId && (() => {
                const targetSh = shareholders.find(s => s.id === returnShareholderId);
                if (!targetSh) return null;
                return (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex justify-between items-center">
                    <div>
                      <span className="font-bold block">{targetSh.name}</span>
                      <span className="text-[10px] text-amber-700">नागरिकता नं: {targetSh.citizenshipNumber || '-'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-amber-700 uppercase font-bold block">हालको सेयर रकम:</span>
                      <span className="text-base font-mono font-bold text-rose-700">रु. {(targetSh.totalShareAmount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Return Amount & Account */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-rose-900 block">फिर्ता रकम (Return Amt in Rs.) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    value={returnShareAmount}
                    onChange={(e) => setReturnShareAmount(e.target.value)}
                    placeholder="e.g. 20000"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-rose-700 bg-white focus:outline-hidden focus:border-rose-500"
                  />
                  <span className="text-[9px] text-slate-500 block">आंशिक वा पूर्ण रकम दिन सकिन्छ।</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-rose-900 block">भुक्तानी दिएको खाता (Deduct From) *</label>
                  <select
                    value={returnSharePayMethod}
                    onChange={(e) => setReturnSharePayMethod(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:outline-hidden focus:border-rose-500"
                  >
                    <option value="Cash">CASH (नगद खाता)</option>
                    <option value="RBB">RBB (राष्ट्रिय वाणिज्य बैंक)</option>
                    <option value="Esewa">ESEWA (ई-सेवा)</option>
                    <option value="Sahakari">SAHAKARI (सहकारी खाता)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-rose-900 block">फिर्ता मिति (Return Date B.S.) *</label>
                  <input
                    type="text"
                    required
                    value={returnShareTxDate}
                    onChange={(e) => setReturnShareTxDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono bg-white focus:outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Meeting & Decision Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">कारोबार ID / भौचर नं</label>
                  <input
                    type="text"
                    value={returnShareTxIdNo}
                    onChange={(e) => setReturnShareTxIdNo(e.target.value)}
                    placeholder="e.g. RET-SH-201"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">बैठक नं. (Meeting No)</label>
                  <input
                    type="text"
                    value={returnShareMeetingNo}
                    onChange={(e) => setReturnShareMeetingNo(e.target.value)}
                    placeholder="e.g. बैठक नं. १५"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">बैठक मिति (Meeting Date)</label>
                  <input
                    type="text"
                    value={returnShareMeetingDate}
                    onChange={(e) => setReturnShareMeetingDate(e.target.value)}
                    placeholder="2082-11-05"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-700 block">निर्णय नं. (Decision No)</label>
                  <input
                    type="text"
                    value={returnShareDecisionNo}
                    onChange={(e) => setReturnShareDecisionNo(e.target.value)}
                    placeholder="e.g. निर्णय नं. ५"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">कैफियत (Remarks)</label>
                  <input
                    type="text"
                    value={returnShareRemarks}
                    onChange={(e) => setReturnShareRemarks(e.target.value)}
                    placeholder="e.g. सेयर आंशिक फिर्ता फछ्र्यौट"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReturnShareModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  रद्द गर्नुहोस् (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <MinusCircle size={15} />
                  <span>सेयर रकम फिर्ता भुक्तानी गर्नुहोस् (Confirm Return)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. SHAREHOLDER LEDGER MODAL */}
      {selectedShareholderForLedger && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-3xl w-full p-6 space-y-5 animate-scale-up my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Eye className="text-indigo-600" size={18} />
                  <span>सेयरधनी व्यक्तिगत लेजर र कारोबार विवरण (Shareholder Statement)</span>
                </h3>
                <p className="text-xs text-slate-500">{selectedShareholderForLedger.name} - {selectedShareholderForLedger.address || 'फिक्कल, इलाम'}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (window.openUniversalEmailModal) {
                      window.openUniversalEmailModal({
                        recipientEmail: selectedShareholderForLedger.email || '',
                        recipientName: selectedShareholderForLedger.name || 'Shareholder',
                        subject: `Shareholder Account Statement - ${selectedShareholderForLedger.name}`,
                        message: `Dear ${selectedShareholderForLedger.name},\n\nPlease find your official Shareholder Ledger & Investment Statement summary from ReliableTech Services & Suppliers.\n\nShareholder Details:\n- Name: ${selectedShareholderForLedger.name}\n- Address: ${selectedShareholderForLedger.address || 'Fikkal, Ilam'}\n- Date: ${new Date().toLocaleDateString()}\n\nReliableTech Services & Suppliers\nFikkal, Ilam, Nepal`,
                        emailType: 'Shareholder Statement'
                      });
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Send Statement via Email"
                >
                  <Mail size={14} />
                  <span>इमेल (Email)</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={14} />
                  <span>प्रिन्ट (Print)</span>
                </button>
                {(isMasterAccount || isReliableAdmin || currentUser?.role === 'Admin') && (
                  <button
                    type="button"
                    onClick={() => handleDeleteShareholder(selectedShareholderForLedger)}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Delete Shareholder"
                    id={`modal-delete-shareholder-${selectedShareholderForLedger.id}`}
                  >
                    <Trash2 size={14} />
                    <span>हटाउनुहोस् (Delete)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedShareholderForLedger(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-lg leading-none cursor-pointer"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Profile Summary Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">नागरिकता नं (Citizenship No):</span>
                <span className="font-mono font-bold text-slate-800">{selectedShareholderForLedger.citizenshipNumber || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">अवस्था (Status):</span>
                <span className="font-bold text-emerald-700">{selectedShareholderForLedger.status || 'Active'}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">कुल सेयर रकम (Total Net Share):</span>
                <span className="font-mono font-bold text-indigo-700 text-base">रु. {(selectedShareholderForLedger.totalShareAmount || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">मिती (Date)</th>
                    <th className="p-3">प्रकार (Type)</th>
                    <th className="p-3">भुक्तानी खाता (Payment Method)</th>
                    <th className="p-3">बैठक / निर्णय नं</th>
                    <th className="p-3 text-right">रकम (Amount)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(selectedShareholderForLedger.transactions || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        कुनै पनि कारोबार भेटिएन।
                      </td>
                    </tr>
                  ) : (
                    selectedShareholderForLedger.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono">{tx.transactionDate}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.transactionType === 'Addition'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {tx.transactionType === 'Addition' ? '+ सेयर थप' : '- सेयर फिर्ता'}
                          </span>
                        </td>
                        <td className="p-3 font-bold font-mono">{tx.paymentMethod}</td>
                        <td className="p-3 text-[11px]">
                          {tx.meetingNumber || tx.decisionNumber ? (
                            <span>{tx.meetingNumber || ''} {tx.decisionNumber ? `(${tx.decisionNumber})` : ''}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className={`p-3 text-right font-mono font-bold ${
                          tx.transactionType === 'Addition' ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {tx.transactionType === 'Addition' ? '+' : '-'} रु. {(tx.paidAmount || tx.amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedShareholderForLedger(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                बन्द गर्नुहोस् (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statement Proof Viewer Lightbox Modal (For Admins) */}
      {selectedStatementProof && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedStatementProof(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-700/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileText size={18} className="text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm">
                    Bank Statement Proof: {selectedStatementProof.account.toUpperCase()}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedStatementProof.balance !== undefined && (
                      <span className="mr-3">Opening: NPR {selectedStatementProof.balance.toLocaleString()}</span>
                    )}
                    {selectedStatementProof.date && (
                      <span>Effective Date: {selectedStatementProof.date}</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStatementProof(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Image Preview Container */}
            <div className="p-4 bg-slate-950/90 flex-1 overflow-auto flex items-center justify-center min-h-[300px]">
              <img 
                src={selectedStatementProof.imageUrl} 
                alt={`${selectedStatementProof.account} Statement Proof`}
                className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-lg border border-slate-800"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Verified Bank Statement / Passbook Image
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedStatementProof.imageUrl}
                  download={`statement-proof-${selectedStatementProof.account}.jpg`}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedStatementProof(null)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
