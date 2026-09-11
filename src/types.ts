export interface BusinessService {
  id: string;
  name: string;
  category: string;
  priceRate: number;
  rateType: string; // supports custom units (kg, ltr, etc)
  description: string;
  status: 'Active' | 'Discontinued' | 'Under Maintenance';
  dateAdded: string;
  costPrice?: number; // Cost price of hardware/inventory
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  productsSupplied: string; // Comma separated list
  status: 'Active' | 'On Hold' | 'Inactive';
  creditBalance: number;
  rating: number; // 1 to 5
  panNumber?: string;
}

export interface SupplyTransactionItem {
  name: string;
  quantity: number;
  received: boolean;
  costPrice?: number;
  sellingPrice?: number;
  unitType?: string;
}

export interface SupplyTransaction {
  id: string;
  date: string;
  supplierId: string;
  itemsBought: string;
  items?: SupplyTransactionItem[]; // itemized purchase order
  amountPaid: number;
  amountDue: number;
  status: 'Paid' | 'Pending' | 'Partially Paid' | 'Ordered' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Items Received';
  remarks: string;
  purchaseType?: 'Commerce' | 'Official Use';
  paymentMethod?: 'Cash' | 'Esewa' | 'Sahakari' | 'RBB' | 'Split';
  paymentSplits?: {
    Cash?: number;
    Esewa?: number;
    Sahakari?: number;
    RBB?: number;
    cash?: number;
    esewa?: number;
    sahakari?: number;
    rbb?: number;
  };
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number; // current stock quantity
  costPrice: number;
  sellingPrice: number;
  supplierId: string;
  lastReceivedDate: string;
  unitType?: string;
  openingStockForFY?: { [fy: string]: number }; // opening stock by fiscal year
}

export interface InventoryRequest {
  id: string;
  purchaseOrderId: string;
  date: string;
  supplierId: string;
  items: {
    name: string;
    quantity: number;
    costPrice: number;
    sellingPrice: number;
    notReceived?: boolean;
    unitType?: string;
  }[];
  amountPaid: number;
  status: 'Pending' | 'Approved' | 'Declined';
  remarks?: string;
}

export interface OfficeUseRequest {
  id: string;
  requestNo: string;
  date: string;
  itemId: string;
  itemName: string;
  quantity: number;
  requestedBy: string;
  department?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  totalCost?: number;
  approvedBy?: string;
  approvalDate?: string;
  remarks?: string;
}

export type PageSize = 'A4' | 'Letter' | 'Legal' | 'A5' | 'A3';
export type PageOrientation = 'portrait' | 'landscape';

export type LetterheadDocType = 
  | 'Invoice'
  | 'Official Letter'
  | 'Report'
  | 'Purchase Order'
  | 'Invitation'
  | 'Meeting Minute'
  | 'Staff Pay Slip'
  | 'Daily Closing'
  | 'Statement'
  | 'Expense Voucher';

export interface LetterheadDocConfig {
  headerImageUrl?: string;
  footerImageUrl?: string;
  enabled: boolean; // if false, Exclusion Rule is ACTIVE (letterhead hidden)
  headerHeightPx?: number; // custom container height in pixels e.g. 140
  footerHeightPx?: number; // custom container height in pixels e.g. 90
  objectFit?: 'contain' | 'cover' | 'fill';
  alignment?: 'center' | 'left' | 'right';
  pageSize?: PageSize;
  orientation?: PageOrientation;
}

export type LetterheadConfigs = {
  [key in LetterheadDocType]?: LetterheadDocConfig;
};

export interface PaymentQrSettings {
  rbbAccountName?: string;
  rbbAccountNumber?: string;
  rbbBranch?: string;
  rbbQrCodeUrl?: string;

  esewaAccountName?: string;
  esewaId?: string;
  esewaQrCodeUrl?: string;

  sahakariName?: string;
  sahakariAccountName?: string;
  sahakariAccountNumber?: string;
  sahakariQrCodeUrl?: string;

  instructions?: string;
}

export interface BusinessProfile {
  name: string;
  companyNameNepali?: string;
  companySubtitle?: string;
  companySubtitleNepali?: string;
  location: string;
  address?: string; // alias
  addressNepali?: string;
  phone: string;
  email: string;
  panNumber: string;
  logoUrl?: string;
  headerImageUrl?: string;
  footerImageUrl?: string;
  letterheadConfigs?: LetterheadConfigs;
  estdYear?: string;
  paymentQrSettings?: PaymentQrSettings;
  customerChatQuickReply?: string; // Quick automated instant reply message for ReliableTech Support Desk
}

export interface InvoiceItem {
  serviceId: string;
  quantity: number;
  unitPrice: number;
  customName?: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail?: string;
  items: InvoiceItem[];
  totalAmount: number; // Subtotal before discount
  discountAmount: number;
  finalAmount: number; // Subtotal after discount
  paidAmount: number;
  dueAmount: number;
  status: 'Paid' | 'Unpaid' | 'Partially Paid' | 'Cancelled';
  paymentMethod: 'Cash' | 'Esewa' | 'Sahakari' | 'RBB' | 'Due' | 'Split';
  remarks: string;
  paymentSplits?: {
    cash?: number;
    esewa?: number;
    rbb?: number;
    sahakari?: number;
    due?: number;
  };
}

export interface AppUser {
  id: string;
  name: string; // name of staff
  fullName?: string; // alias
  nameNepali?: string; // name of staff in Nepali (e.g. श्री अर्पण खड्का)
  post?: string; // post of staff in English
  designationNepali?: string; // post/designation of staff in Nepali (e.g. अध्यक्ष (प्रबन्ध निर्देशक))
  address?: string;
  contactNumber?: string;
  email?: string; // User/Staff email address for system OTP logins & notifications
  citizenshipNumber?: string;
  issueDate?: string;
  issueDistrictAndOffice?: string;
  monthlySalary?: number;
  username: string; // system username
  password?: string; // system password
  role: 'Super Admin' | 'Admin' | 'User' | 'Shareholder';
  bloodGroup?: string;
  maritalStatus?: string;
  fatherName?: string;
  motherName?: string;
  dateOfBirth?: string;
  spouseName?: string; // wife or husband name if married
  profilePhoto?: string; // Passport size photo (base64 URL)
  photoApproved?: boolean; // Whether the passport photo is approved by @reliableadmin
  staffId?: string; // Staff ID Number (e.g. RT-EMP-001) - strictly editable only by @reliableadmin
  permissions?: string[]; // Allowed tab IDs for this user (if specified, overrides default role tabs)
  granularPermissions?: Record<string, TabAccessRule>; // Granular permissions: visible, canEdit, canDelete per tab/subtab
}

export interface TabAccessRule {
  visible: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export type PermissionRulesMap = Record<string, TabAccessRule>;

export interface RolePermissionsConfig {
  'Super Admin': PermissionRulesMap;
  'Admin': PermissionRulesMap;
  'User': PermissionRulesMap;
  'Shareholder': PermissionRulesMap;
}

export interface EditRequest {
  id: string;
  type: 'Invoice Edit' | 'Invoice Deletion' | 'Payment Collection' | 'Purchase Order Edit' | 'Asset Edit' | 'Asset Deletion' | 'Supplier Edit' | 'Supplier Deletion';
  details: string;
  targetInvoiceId?: string;
  targetAssetId?: string;
  targetSupplierId?: string;
  invoiceData?: any; // Proposed updated invoice details
  assetData?: any; // Proposed updated asset details
  supplierData?: any; // Proposed updated supplier details
  paymentDetails?: any; // Proposed due payment collections
  date: string;
  status: 'Pending' | 'Approved' | 'Declined';
  remarks?: string; // Admin remarks on approval/refusal
}

export interface CashDenomination {
  1000: number;
  500: number;
  100: number;
  50: number;
  20: number;
  10: number;
  5: number;
  2: number;
  1: number;
}

export interface SplitDepositItem {
  id?: string;
  targetAccount: 'Esewa' | 'RBB' | 'Sahakari';
  amount: number;
  remarks?: string;
}

export interface DailyClosing {
  id: string;
  date: string;
  // Summary of transactions of that day
  totalSales: number;
  cashSales: number;
  esewaSales: number;
  bankSales: number; // RBB
  sahakariSales: number;
  dueSales: number; // Outstanding due recorded separately
  duesCollected: number; // Cumulative dues collected today
  duesCollectedDetails: { customerName: string; amount: number; method: string }[];
  
  // Deposit options
  totalCashAvailable: number; // cashSales + cashDuesCollected (+ opening cash + transfersIn - transfersOut)
  depositTarget: 'Esewa' | 'RBB' | 'Sahakari' | 'None' | 'Split';
  depositAmount: number; // Amount deposited from cash available
  splitDeposits?: SplitDepositItem[]; // Multiple split deposit breakdown
  
  // Remaining cash after deposit
  remainingCash: number; // totalCashAvailable - depositAmount
  denominations: CashDenomination; // breakdown of remaining cash
  openingCashForTomorrow: number; // should match remainingCash
  openingCashToday: number; // cash in hand from previous day
  
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedBy: string;
  approvedBy?: string;
  remarks?: string; // cashier/staff closing remarks
  adminRemarks?: string; // admin remarks on approval/refusal
  unlocked?: boolean;
  unlockReason?: string;
  unlockedBy?: string;

  // Expenditures tracking fields
  totalExpenses?: number;
  cashExpenses?: number;
  esewaExpenses?: number;
  bankExpenses?: number; // RBB
  sahakariExpenses?: number;

  // Inter-account fund transfers tracking
  cashTransfersIn?: number;
  cashTransfersOut?: number;
  transfersSummary?: {
    id: string;
    date?: string;
    type: string;
    sourceAccount: string;
    destinationAccount?: string;
    amount: number;
    voucherNumber: string;
    remarks: string;
  }[];
}

export interface ServiceRequestItem {
  itemName: string;
  reason: string;
  solution: string;
  price: number;
}

export interface ServiceRequest {
  id: string;
  requestNo: string;
  customerName: string;
  customerAddress: string;
  customerContact: string;
  items: ServiceRequestItem[];
  status: 'On Process' | 'Completed' | 'Delivered' | 'Cancelled';
  dateCreated: string;
  billedInvoiceId?: string; // Links to the invoice created for billing
}

export type ExpenseCategory = 'Purchase Order' | 'Rent' | 'Salary' | 'Office Supplies' | 'Shareholder Payout' | 'Sales Return / Refund' | 'Others';

export interface Expense {
  id: string;
  expenseNo: string;
  category: ExpenseCategory;
  title: string;
  topic?: string; // Custom topic for others/miscellaneous
  amount: number;
  paymentMethod: 'Cash' | 'Esewa' | 'Sahakari' | 'RBB' | 'Split';
  paymentSplits?: {
    Cash?: number;
    Esewa?: number;
    Sahakari?: number;
    RBB?: number;
    cash?: number;
    esewa?: number;
    sahakari?: number;
    rbb?: number;
  };
  date: string;
  remarks: string;
  status: 'Pending Approval' | 'Approved' | 'Declined';
  createdBy: string;
  approvedBy?: string;
  referenceId?: string; // links to Purchase Order ID, employee ID, shareholder name, etc.
}

export interface BusinessLetter {
  id: string;
  fiscalYear: string;
  dispatchNumber: string;
  date: string;
  salutation: string;
  recipientCompany: string;
  recipientAddress: string;
  subject: string;
  body: string;
  senderName: string;
  signeeId: string;
  signeeName: string;
  signeeRole: string;
}

export interface OfficialLetterFormat {
  id: string;
  formatTitle: string;
  category?: string;
  salutation: string;
  subject: string;
  body: string;
  defaultRecipientCompany?: string;
  defaultRecipientAddress?: string;
  createdAt?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string; // BS Date YYYY-MM-DD
  status: 'Present' | 'Absent' | 'On Leave' | 'Half Day';
  checkInTime?: string;
  checkOutTime?: string;
  remarks?: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  startDate: string; // BS Date
  endDate: string; // BS Date
  leaveType: 'Casual' | 'Sick' | 'Maternity/Paternity' | 'Other';
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  remarks?: string; // admin remarks
  dateCreated: string;
}

export interface SalaryDistribution {
  id: string;
  userId: string;
  userName: string;
  post: string;
  month: string; // YYYY-MM in BS
  baseSalary: number;
  allowances: number;
  bonusReason?: string; // What the bonus/allowance is about (e.g. Service charge, New year bonus, Festival bonus)
  deductions: number;
  netPaid: number;
  paymentMethod: string;
  paymentSplits?: { [key: string]: number };
  distributionDate: string; // BS Date
  status: 'Paid' | 'Pending Approval';
  approvedBy?: string;
  remarks?: string;
}

export interface AttendanceRequest {
  id: string;
  userId: string;
  userName: string;
  date: string; // BS Date YYYY-MM-DD
  type: 'Check-In' | 'Check-Out';
  time: string; // HH:MM AM/PM
  status: 'Pending' | 'Approved' | 'Declined';
  remarks?: string;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string; // BS Date
  amountPaid: number;
  paymentGateway: string; // Cash, Esewa, Khalti, Bank Transfer, etc.
  transactionNumber?: string;
  previousDue: number;
  remainingDue: number;
  remarks?: string;
}

export interface AssetItem {
  id: string;
  assetCode: string; // RTSS-ASSETS-DU-0001 or RTSS-ASSETS-NONDU-0001
  name: string;
  type: 'Durable' | 'Non-Durable';
  purchaseOrderId?: string;
  purchaseDate: string; // BS Date
  costPrice: number;
  quantity: number;
  supplierId?: string;
  remarks?: string;
  status: 'Active' | 'Released';
  releaseInfo?: {
    referenceNumber: string; // RTSS-ASSETSRELEASE-0001
    note: string;
    meetingNumber: string;
    meetingDate: string;
    decisionNumber: string;
    remarks: string;
    releasedAt: string; // BS Date
  };
}
export interface AccountOpeningBalance {
  openingBalance: number;
  openingBalanceDate: string;
  openingBalanceProof?: string; // Base64 picture string
}

export interface OpeningBalances {
  RBB: AccountOpeningBalance;
  ESEWA: AccountOpeningBalance;
  SAHAKARI: AccountOpeningBalance;
  CASH: AccountOpeningBalance;
  DUE: AccountOpeningBalance;
}

export interface AccountTransaction {
  id: string;
  date: string; // BS Date
  type: 'Withdrawal' | 'Deposit' | 'Transfer';
  sourceAccount: 'Cash' | 'Esewa' | 'Sahakari' | 'RBB' | 'Bank';
  destinationAccount?: 'Cash' | 'Esewa' | 'Sahakari' | 'RBB' | 'Bank'; // defined if transfer
  amount: number;
  voucherNumber: string; // or bill number
  remarks: string;
  recordedBy: string;
}

export interface PeriodicAccountSubLedger {
  openingBalance?: number;
  openingBalanceDate?: string;
  closingBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  systemIncome?: number;
  systemExpenses?: number;
  systemBalance?: number;
  statementImage?: string; // base64 representation of the statement
  statementImageName?: string;
  verifiedBalance?: number;
  verifiedDeposits?: number;
  verifiedWithdrawals?: number;
  verificationStatus: 'Pending' | 'Success' | 'Mismatch' | 'No Image';
  discrepancyAmount?: number;
}

export interface PeriodicClosing {
  id: string;
  duration: 'Monthly' | '3 Monthly' | '6 Monthly' | '9 Monthly' | 'Annual';
  period: string; // Specific Month/Year or Date Range
  fromDate?: string; // BS Start Date
  toDate?: string; // BS End Date
  status: 'Draft' | 'Pending Meeting' | 'Pending Admin Consensus' | 'Approved';
  closingDoneBy?: string;
  closingDoneAt?: string;
  closingDateBs?: string;
  closingTime?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  accounts: {
    RBB: PeriodicAccountSubLedger;
    Cash: PeriodicAccountSubLedger;
    eSewa: PeriodicAccountSubLedger;
    Sahakari: PeriodicAccountSubLedger;
    Due: PeriodicAccountSubLedger;
  };
  totalIncome: number;
  totalExpenses: number;
  netPL: number;
  briefRemarks?: string;
  approvalLog: {
    approvals: string[]; // List of admin user IDs who approved
    totalAdmins: number;
  };
  meetingDate?: string;
  meetingNumber?: string;
  decisionNumber?: string;
  unlocked?: boolean;
  unlockReason?: string;
  unlockedBy?: string;
  history: {
    timestamp: string;
    action: string;
    byUser: string;
    remarks?: string;
  }[];
}

export interface AttachedReport {
  id?: string;
  category: string; // Report category from Statement & Auditor Reports tab or system transactions
  reportDate: string; // BS Date or Date Range (e.g. 2083-04-01 to 2083-04-30)
  fromDate?: string; // BS From Date
  toDate?: string; // BS To Date
  title: string;
  referenceNo?: string;
  amount?: number;
  summary?: string;
  details?: string;
  fileUrl?: string; // Base64 data URL or URL for external PDF/JPEG/JPG/PNG file
  fileName?: string; // Original filename
  fileType?: string; // File MIME type e.g. 'application/pdf', 'image/jpeg', 'image/png'
}

export interface AgendaItem {
  agenda: string;
  decision: string;
  attachedReport?: AttachedReport;
}

export interface AttendanceItem {
  name: string;
  role: string;
  status: string; // Signature/Status
}

export interface ShareTransaction {
  id: string;
  sn?: number;
  meetingId?: string;
  meetingNumber?: string;
  meetingDate?: string;
  decisionNumber?: string;
  shareholderId: string;
  shareholderName: string;
  address: string;
  citizenshipNumber: string;
  transactionType: 'Addition' | 'Return'; // Addition (सेयर रकम थप) or Return (सेयर रकम फिर्ता)
  amount: number; // total amount requested/agreed
  paidAmount: number; // actual amount paid in this transaction
  remainingBalance?: number; // if return was partial
  paymentMethod: 'Cash' | 'RBB' | 'Esewa' | 'Sahakari' | 'Split';
  paymentSplits?: { Cash?: number; Esewa?: number; RBB?: number; Sahakari?: number; cash?: number; esewa?: number; rbb?: number; sahakari?: number };
  transactionDate: string; // BS date
  transactionIdNo?: string;
  remarks?: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected';
}

export interface OpeningShareDetail {
  openingAmount: number;
  openingDate: string; // BS date
  citizenshipNumber?: string;
  address?: string;
  contact?: string;
  paymentMethod?: string;
  referenceNo?: string;
  remarks?: string;
  addedBy: string; // username e.g. 'reliableadmin'
  addedAt: string;
}

export interface Shareholder {
  id: string;
  name: string;
  address: string;
  citizenshipNumber: string;
  contactNumber?: string;
  email?: string;
  emailId?: string;
  totalShareAmount: number; // current net share balance
  openingDetails?: OpeningShareDetail;
  transactions?: ShareTransaction[];
  status: 'Active' | 'Inactive' | 'Removed';
}

export interface MeetingNote {
  id: string;
  meetingDate: string; // BS Date
  adDate?: string;      // AD Date
  meetingNumber: string;
  typeOfMeeting: string; // e.g. Regular, Emergency
  presentMembers: string[]; // Present members names (legacy or quick access)
  attendance?: AttendanceItem[]; // Detailed attendance list
  agendas: AgendaItem[];
  shareTransactions?: ShareTransaction[]; // Shareholder addition or return transactions
  status: 'Pending' | 'Scheduled' | 'In Progress' | 'Closed' | 'Approved' | 'Rejected';
  submittedBy: string; // Name of submitter
  approvedByAdmins: string[]; // Admin user IDs who have approved
  totalAdminsAtSubmission: number; // For tracking 60% rule
  language?: 'English' | 'Nepali';
  startTime?: string;
  endTime?: string;
  venue?: string;
  chairperson?: string;
  meetingTime?: string;
  participants?: string[]; // Username or User IDs
  externalParticipants?: string[]; // Manual external participant names
  participantApprovals?: string[]; // Username or User IDs who have signed off
  participantRejections?: string[]; // Username or User IDs who clicked Reject
  joinedParticipants?: string[]; // Username or User IDs who clicked Join Meeting
}

// ==========================================
// RTSS E-COMMERCE TYPES & INTERFACES
// ==========================================

export type EcommerceCategory = 'Stationery' | 'Computer Parts' | 'CCTV & Security';

export type EcommerceDiscountType = 'Percentage' | 'Fixed_Amount' | 'None';

export type PermittedMunicipality = 
  | 'Suryodaya Municipality'
  | 'Rong Municipality'
  | 'Ilam Municipality';

export const PERMITTED_MUNICIPALITIES: PermittedMunicipality[] = [
  'Suryodaya Municipality',
  'Rong Municipality',
  'Ilam Municipality'
];

export interface EcommerceProduct {
  product_id: string;
  product_name: string;
  category: EcommerceCategory;
  cost_price_npr: number; // Hidden from customers (Staff/Admin only)
  selling_price_npr: number; // Base rate on frontend
  discount_type: EcommerceDiscountType;
  discount_value: number;
  stock_count: number; // Physical count in Fikkal Store
  image_url: string;
  description?: string;
  brand?: string;
  is_active: boolean; // Controls storefront visibility
  featured?: boolean;
  features?: string[];
  specifications?: Record<string, string>;
  warranty?: string;
  date_added?: string;
}

export type CustomerAccountCategory = 
  | 'Individual / Household'
  | 'School / College / Campus'
  | 'Tea Estate / Factory'
  | 'Hotel / Resort / Homestay'
  | 'Cooperative / Microfinance'
  | 'Government / Municipality / Ward'
  | 'Commercial Business / Retail';

export interface CustomerAccount {
  customer_id: string;
  name: string;
  full_name?: string; // alias
  username?: string; // custom chosen customer username
  profilePicture?: string; // base64 or photo URL
  phone: string;
  phone_primary?: string; // alias
  alt_phone?: string;
  email: string;
  password?: string;
  account_category?: CustomerAccountCategory;
  municipality: PermittedMunicipality;
  ward: string;
  tole_area?: string;
  landmark?: string;
  detailed_address: string;
  mapCoordinates?: { lat: number; lng: number };
  is_institutional: boolean;
  organization_name?: string;
  organization_pan?: string; // 9-digit numeric string
  contact_designation?: string;
  designation?: string; // alias
  preferred_language?: 'ENG' | 'NEP';
  createdAt: string;
  status: 'Active' | 'Suspended' | 'Blocked';
}

export interface HardwareTypeOption {
  id: string;
  type_id?: string; // alias
  name: string;
  nameNepali?: string;
  name_nepali?: string; // alias
  categoryHint?: string;
  category_hint?: string; // alias
  estimatedTurnaround?: string;
  estimated_turnaround?: string; // alias
  turnaround_estimate?: string; // alias
  description?: string;
  isActive?: boolean;
  is_active?: boolean; // alias
}

export interface EcommerceOrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price_npr: number;
  discount_amount_npr: number;
  final_price_npr: number;
  image_url?: string;
  category?: EcommerceCategory;
}

export type PaymentFlowMethod = 
  | 'COD' 
  | 'ESEWA' 
  | 'RBB_TRANSFER' 
  | 'COOP_QR' 
  | 'INSTITUTIONAL_CREDIT';

export type OrderLifecycleState = 
  | 'Pending Verification' 
  | 'Processing/Packing' 
  | 'Dispatched via Courier' 
  | 'Delivered & Closed'
  | 'Cancelled';

export interface EcommerceOrder {
  order_id: string;
  user_id: string; // Customer account ID (Anonymous checkout prohibited)
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  municipality: PermittedMunicipality;
  ward: string;
  delivery_address: string;
  items: EcommerceOrderItem[];
  subtotal_npr: number;
  discount_npr: number;
  delivery_charge_npr: number;
  total_amount_npr: number;
  grand_total_npr?: number; // alias
  payment_method: PaymentFlowMethod;
  order_state: OrderLifecycleState;
  
  // Payment Verification Fields
  gateway_ref_token?: string; // For eSewa
  rbb_voucher_url?: string; // For RBB bank voucher
  coop_txn_id?: string; // For Sahakari / Cooperative QR
  payment_screenshot_url?: string; // Screenshot proof of QR payment
  payment_verified_at?: string;
  payment_verification_status?: 'Pending Verification' | 'Approved' | 'Verified' | 'Rejected';
  payment_verification_notes?: string;
  payment_rejection_reason?: string;
  organization_name?: string; // For Institutional Credit
  organization_pan?: string; // 9-digit PAN string
  organization_address?: string; // Institutional registered address
  has_old_id?: boolean; // Has old customer/institutional account ID
  old_customer_id?: string; // Old customer reference ID
  purchase_order_document_url?: string; // PO document URL / path

  // Official Sales Invoice Linkage
  sales_invoice_id?: string; // Linked SalesInvoice.id
  sales_invoice_no?: string; // Linked SalesInvoice.invoiceNumber (e.g. INV-2083-0001)
  invoice_number?: string; // alias for sales_invoice_no
  sales_invoice_date?: string; // Date of invoice generation

  // Admin Cancellation & Reverse Voucher / Refund Fields
  cancellation_remarks?: string; // Detailed cancellation justification
  cancellation_reason?: string; // alias for cancellation_remarks
  cancelled_by?: string; // Admin username who executed cancellation
  cancelled_at?: string; // Timestamp / BS date of cancellation
  is_refunded?: boolean; // Whether money was refunded / voucher reversed
  refund_status?: 'Refunded' | 'Pending Refund' | 'No Refund Required';
  refund_amount?: number; // Total refunded sum (NPR)
  refund_remarks?: string; // Specific refund remarks / reasons
  refund_transaction_id?: string; // Linked reverse voucher transaction ID
  refund_method?: string;
  refund_payment_method?: 'Cash' | 'Esewa' | 'Sahakari' | 'RBB' | 'Due';
  reverse_voucher_number?: string;
  reverse_voucher_date?: string;

  order_notes?: string;
  created_at: string;
  updated_at?: string;
  assigned_courier?: string;
  tracking_number?: string;
  verified_by?: string;
}

export type ServiceTicketHardwareType = string;
export type ServiceTicketServiceType = 'Fikkal Shop Drop-off' | 'Technician Home Visit';
export type ServiceTicketLifecycleState = 
  | 'Site-Survey Scheduled' 
  | 'In-Progress' 
  | 'Awaiting Parts' 
  | 'Completed - Awaiting Invoice Payment'
  | 'Cancelled';

export interface EcommerceServiceTicket {
  ticket_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  alt_phone?: string;
  customer_address?: string;
  hardware_type: string; // configured from staff or custom
  is_custom_hardware?: boolean;
  custom_hardware_name?: string;
  service_type: ServiceTicketServiceType;
  service_category?: string;
  target_municipality: PermittedMunicipality;
  specific_area?: string;
  landmark?: string;
  problem_description: string;
  assigned_technician: string;
  ticket_status: ServiceTicketLifecycleState;
  estimated_cost_npr?: number;
  actual_cost_npr?: number;
  technician_notes?: string;
  created_at: string;
  updated_at?: string;
  preferred_date?: string;
}

// ==========================================
// CUSTOMER MESSAGES & INQUIRIES (CHATBOX)
// ==========================================

export interface BlockedMessengerRecord {
  blocked_id: string;
  target_phone_or_email: string;
  blocked_by: string;
  reason?: string;
  blocked_at: string;
}

export interface InquiryReply {
  id: string;
  sender: 'Customer' | 'Staff' | 'Admin';
  senderName?: string;
  sender_name?: string; // alias
  senderRole?: string;
  sender_role?: string; // alias
  staff_name?: string; // alias
  message?: string;
  reply_text?: string; // alias
  timestamp?: string;
  created_at?: string; // alias
}

export interface CustomerInquiryMessage {
  id: string;
  inquiry_id?: string; // alias
  customerId?: string;
  customer_id?: string; // alias
  customerName?: string;
  customer_name?: string; // alias
  customerPhone?: string;
  customer_phone?: string; // alias
  customerEmail?: string;
  customer_email?: string; // alias
  municipality?: string;
  subject?: string;
  initialMessage?: string;
  message?: string; // alias
  timestamp?: string;
  created_at?: string; // alias
  status: 'Open' | 'Replied' | 'Forwarded to Admin' | 'Closed' | 'Blocked' | 'Resolved';
  isBlocked?: boolean;
  blockedAt?: string;
  blockedBy?: string;
  forwardedToAdminAt?: string;
  forwardedBy?: string;
  adminNotes?: string;
  associated_order_id?: string;
  priority?: string;
  replies: InquiryReply[];
}

export interface SystemReportAttachment {
  id?: string;
  type: 'report' | 'invoice';
  category: string;
  title: string;
  referenceNo?: string;
  reportDate: string;
  amount?: number;
  summary?: string;
  items?: any[];
  fromDate?: string;
  toDate?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  subtotal?: number;
  grandTotal?: number;
  amountInWords?: string;
  notes?: string;
  preparedBy?: string;
  approvedBy?: string;
  status?: string;
  closingData?: any;
  dailyClosingData?: any;
}

export interface EmailFileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}

export interface EmailMessage {
  id: string;
  threadId?: string;
  account: 'donotreply.rtss@gmail.com' | 'reliabletechss.fikkal@gmail.com' | string;
  sender: string;
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  recipientName: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  htmlContent?: string;
  folder: 'inbox' | 'sent' | 'starred' | 'trash' | 'drafts';
  emailType?: string;
  timestamp: number;
  dateFormatted: string;
  bsDate?: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  fileAttachments?: EmailFileAttachment[];
  systemReports?: SystemReportAttachment[];
  success?: boolean;
  error?: string;
  messageId?: string;
}

