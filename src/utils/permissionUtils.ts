import { AppUser, TabAccessRule, PermissionRulesMap, RolePermissionsConfig } from '../types';

export interface TabModuleItem {
  id: string;
  label: string;
  labelNepali: string;
  description: string;
  category: string;
  isParent?: boolean;
  parentId?: string;
}

export const SYSTEM_MODULES_LIST: TabModuleItem[] = [
  // Standalone Top Tabs
  {
    id: 'dashboard',
    label: 'Dashboard',
    labelNepali: 'ड्यासबोर्ड (समग्र अवलोकन)',
    description: 'Main system summary, revenue charts, live indicators, and quick stats',
    category: 'Overview'
  },
  {
    id: 'ecommerce',
    label: 'E-Commerce Online Store',
    labelNepali: 'ई-कमर्स अनलाइन स्टोर',
    description: 'Online store products, catalog inventory, orders, and customer service tickets',
    category: 'Overview'
  },

  // Front Desk & Sales
  {
    id: 'sales',
    label: 'Sales & Billing',
    labelNepali: 'बिक्री तथा बिलिङ (इन्भ्वाइस)',
    description: 'Point of sale billing, invoice creation, receipts, and customer dues',
    category: 'Front Desk & Sales'
  },
  {
    id: 'services',
    label: 'Service Job Requests',
    labelNepali: 'मर्मत सेवा अनुरोध (Repair Job Cards)',
    description: 'Device repair tracking, service cards, job status, and service rates',
    category: 'Front Desk & Sales'
  },
  {
    id: 'customers',
    label: 'Customers Data',
    labelNepali: 'ग्राहक विवरण तथा लेजर (Customers)',
    description: 'Customer profiles, contact directory, address book, and transaction records',
    category: 'Front Desk & Sales'
  },

  // Accounting & Records
  {
    id: 'reports',
    label: 'Reports & Ledger',
    labelNepali: 'वित्तीय प्रतिवेदन तथा लेजर',
    description: 'Financial reports, balance sheet, profit & loss statement, and audit ledgers',
    category: 'Accounting & Records'
  },
  {
    id: 'daily_closing',
    label: 'Daily Closing & Audit',
    labelNepali: 'दैनिक क्लोजिङ तथा अडिट',
    description: 'Day-end cash counting, vault handover, bank deposits, and manager sign-off',
    category: 'Accounting & Records'
  },
  {
    id: 'transactions',
    label: 'Purchase Ledger',
    labelNepali: 'खरिद खाता (Purchase Orders)',
    description: 'Supplier purchase bills, stock procurement, and intake accounting',
    category: 'Accounting & Records'
  },
  {
    id: 'expenses',
    label: 'Expenses Ledger',
    labelNepali: 'खर्च खाता (Expenses & Vouchers)',
    description: 'Operational expenses, cash vouchers, category spending, and receipts',
    category: 'Accounting & Records'
  },

  // Inventory & Assets
  {
    id: 'inventory',
    label: 'Inventory Stock',
    labelNepali: 'स्टक मौज्दात सूची (Inventory)',
    description: 'Live stock inventory, reorder level alerts, and internal parts issue',
    category: 'Inventory & Assets'
  },
  {
    id: 'assets_management',
    label: 'Assets Management',
    labelNepali: 'सम्पत्ति व्यवस्थापन (Fixed Assets)',
    description: 'Fixed company equipment, asset codes, serial numbers, and maintenance',
    category: 'Inventory & Assets'
  },
  {
    id: 'suppliers',
    label: 'Suppliers Registry',
    labelNepali: 'आपूर्तिकर्ता खाता (Vendors)',
    description: 'Vendor directory, credit balance monitoring, and supplier payments',
    category: 'Inventory & Assets'
  },

  // Staff & HR
  {
    id: 'staff_attendance',
    label: 'Staff Attendance & Payroll',
    labelNepali: 'कर्मचारी हाजिरी तथा तलब',
    description: 'Daily clock-in/clock-out, monthly salary slips, and payroll distribution',
    category: 'Staff & HR'
  },
  {
    id: 'staff_requests',
    label: 'Staff Requests & Approvals',
    labelNepali: 'कर्मचारी माग तथा बिदा',
    description: 'Leave applications, attendance corrections, and edit request approvals',
    category: 'Staff & HR'
  },

  // Gmail App
  {
    id: 'email_inbox',
    label: 'Gmail Webmail App',
    labelNepali: 'जिमेल एप (ईमेल व्यवस्थापन)',
    description: 'Official email client, compose, attachments, and customer correspondence',
    category: 'Communication'
  },

  // Office & Setup
  {
    id: 'letters',
    label: 'Official Letters',
    labelNepali: 'दर्ता तथा चलानी पत्रहरू',
    description: 'Dispatch & receiving registers, official correspondence, and letterhead',
    category: 'Office & Setup'
  },
  {
    id: 'meeting_mynotes',
    label: 'Meeting & My Notes',
    labelNepali: 'बैठक निर्णय तथा व्यक्तिगत नोट',
    description: 'Board meetings, agendas, resolutions, and personal scratchpad notes',
    category: 'Office & Setup'
  },
  {
    id: 'settings',
    label: 'Settings & System Setup',
    labelNepali: 'सिस्टम सेटिङ तथा ब्याकअप',
    description: 'Business profile, user permissions, database file mount, opening balances',
    category: 'Office & Setup'
  }
];

export const ALL_MODULE_IDS = SYSTEM_MODULES_LIST.map(m => m.id);

export const DEFAULT_SUPER_ADMIN_PERMISSIONS: PermissionRulesMap = ALL_MODULE_IDS.reduce((acc, id) => {
  acc[id] = { visible: true, canEdit: true, canDelete: true };
  return acc;
}, {} as PermissionRulesMap);

export const DEFAULT_ADMIN_PERMISSIONS: PermissionRulesMap = ALL_MODULE_IDS.reduce((acc, id) => {
  acc[id] = { visible: true, canEdit: true, canDelete: true };
  return acc;
}, {} as PermissionRulesMap);

export const DEFAULT_USER_PERMISSIONS: PermissionRulesMap = ALL_MODULE_IDS.reduce((acc, id) => {
  // Staff users can view and edit operational modules, but cannot delete records or access financial reports/settings by default
  const isExcluded = id === 'reports' || id === 'settings';
  acc[id] = {
    visible: !isExcluded,
    canEdit: !isExcluded,
    canDelete: false
  };
  return acc;
}, {} as PermissionRulesMap);

export const DEFAULT_SHAREHOLDER_PERMISSIONS: PermissionRulesMap = ALL_MODULE_IDS.reduce((acc, id) => {
  // Shareholders have read-only view access to reports, meeting notes, and emails
  const isAllowed = id === 'reports' || id === 'meeting_mynotes' || id === 'email_inbox';
  acc[id] = {
    visible: isAllowed,
    canEdit: false,
    canDelete: false
  };
  return acc;
}, {} as PermissionRulesMap);

export const DEFAULT_ROLE_PERMISSIONS_CONFIG: RolePermissionsConfig = {
  'Super Admin': DEFAULT_SUPER_ADMIN_PERMISSIONS,
  'Admin': DEFAULT_ADMIN_PERMISSIONS,
  'User': DEFAULT_USER_PERMISSIONS,
  'Shareholder': DEFAULT_SHAREHOLDER_PERMISSIONS
};

const ROLE_PERMISSIONS_STORAGE_KEY = 'reliabletech_role_permissions_v1';

export function getStoredRolePermissionsConfig(): RolePermissionsConfig {
  try {
    const raw = localStorage.getItem(ROLE_PERMISSIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        'Super Admin': { ...DEFAULT_SUPER_ADMIN_PERMISSIONS, ...(parsed['Super Admin'] || {}) },
        'Admin': { ...DEFAULT_ADMIN_PERMISSIONS, ...(parsed['Admin'] || {}) },
        'User': { ...DEFAULT_USER_PERMISSIONS, ...(parsed['User'] || {}) },
        'Shareholder': { ...DEFAULT_SHAREHOLDER_PERMISSIONS, ...(parsed['Shareholder'] || {}) },
      };
    }
  } catch (e) {
    console.warn('Failed to load stored role permissions', e);
  }
  return DEFAULT_ROLE_PERMISSIONS_CONFIG;
}

export function saveStoredRolePermissionsConfig(config: RolePermissionsConfig): void {
  try {
    localStorage.setItem(ROLE_PERMISSIONS_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save role permissions config to localStorage', e);
  }
}

/**
 * Evaluates the full access rule for a user on a given tab or subtab.
 * @param user The current active user
 * @param tabId The tab/subtab identifier
 * @param customRoleConfig Optional current role permissions configuration
 */
export function getUserTabAccess(
  user: AppUser | null | undefined,
  tabId: string,
  customRoleConfig?: RolePermissionsConfig
): TabAccessRule {
  // Master Account @reliableadmin ALWAYS has full access to everything
  if (user?.username?.toLowerCase() === 'reliableadmin') {
    return { visible: true, canEdit: true, canDelete: true };
  }

  if (!user) {
    return { visible: false, canEdit: false, canDelete: false };
  }

  // 1. Check user's granular custom permissions if set
  if (user.granularPermissions && user.granularPermissions[tabId] !== undefined) {
    const perm = user.granularPermissions[tabId];
    return {
      visible: Boolean(perm.visible),
      canEdit: Boolean(perm.canEdit),
      canDelete: Boolean(perm.canDelete)
    };
  }

  // 2. Check backward-compatible permissions array
  if (user.permissions && Array.isArray(user.permissions)) {
    const isVisible = user.permissions.includes(tabId);
    const isElevated = user.role === 'Admin' || user.role === 'Super Admin';
    return {
      visible: isVisible,
      canEdit: isVisible && isElevated,
      canDelete: isVisible && isElevated
    };
  }

  // 3. Fallback to role-level configuration
  const roleConfig = customRoleConfig || getStoredRolePermissionsConfig();
  const roleRules = roleConfig[user.role] || roleConfig['User'] || DEFAULT_USER_PERMISSIONS;
  
  if (roleRules && roleRules[tabId]) {
    return {
      visible: Boolean(roleRules[tabId].visible),
      canEdit: Boolean(roleRules[tabId].canEdit),
      canDelete: Boolean(roleRules[tabId].canDelete)
    };
  }

  return { visible: false, canEdit: false, canDelete: false };
}

/**
 * Returns all tab/subtab IDs that are visible to the user.
 */
export function getUserVisibleTabsList(
  user: AppUser | null | undefined,
  customRoleConfig?: RolePermissionsConfig
): string[] {
  if (user?.username?.toLowerCase() === 'reliableadmin') {
    return ALL_MODULE_IDS;
  }
  return ALL_MODULE_IDS.filter(id => getUserTabAccess(user, id, customRoleConfig).visible);
}

/**
 * Helper to check if a user can edit data in a tab.
 */
export function canUserEditTab(
  user: AppUser | null | undefined,
  tabId: string,
  customRoleConfig?: RolePermissionsConfig
): boolean {
  return getUserTabAccess(user, tabId, customRoleConfig).canEdit;
}

/**
 * Helper to check if a user can delete data in a tab.
 */
export function canUserDeleteInTab(
  user: AppUser | null | undefined,
  tabId: string,
  customRoleConfig?: RolePermissionsConfig
): boolean {
  return getUserTabAccess(user, tabId, customRoleConfig).canDelete;
}
