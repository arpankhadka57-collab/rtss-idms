import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Search, 
  FileText, 
  Lock, 
  Users, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  Printer,
  ChevronRight,
  ShoppingCart,
  ShoppingBag,
  RotateCcw,
  Wrench,
  Package,
  Layers,
  MessageSquare,
  DollarSign,
  Briefcase,
  ShieldCheck,
  Award,
  Clock,
  Send,
  Database,
  Building,
  CreditCard,
  QrCode,
  Tag,
  Truck
} from 'lucide-react';
import { AppUser } from '../types';
import { InteractiveSearchBar } from './InteractiveSearchBar';

interface OperationsManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
}

export type ManualCategory = 
  | 'ALL'
  | 'BILLING_CRM'
  | 'INVENTORY_PO'
  | 'ECOMMERCE_STORE'
  | 'SERVICES'
  | 'CLOSING_AUDIT'
  | 'REPORTS_FINANCE'
  | 'STAFF_HR'
  | 'LEGAL_ASSETS'
  | 'SYSTEM_ADMIN';

export const OperationsManualModal: React.FC<OperationsManualModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ManualCategory>('ALL');
  const [viewRole, setViewRole] = useState<'Admin' | 'Staff'>(currentUser.role === 'Admin' ? 'Admin' : 'Staff');
  
  if (!isOpen) return null;

  const isAdminUser = currentUser.role === 'Admin';

  // Comprehensive Manual Items encompassing EVERY module, operation, and detail
  const allManualItems = [
    // 1. BILLING & CRM
    {
      id: 'billing',
      category: 'BILLING_CRM' as ManualCategory,
      forRole: 'Both',
      icon: <FileText className="text-indigo-500" size={18} />,
      title: '🧾 ग्राहक इनभ्वाइस र बिक्री बिलिङ (Sales Invoicing & VAT/PAN Receipts)',
      nepali: 'मेनुबाट "Sales & Invoices" मा गई "+ Create New Invoice" थिच्नुहोस्। ग्राहक छनोट गर्नुहोस्, स्टकबाट सामान वा म्यानुअल सेवा थप्नुहोस्, छुट र भुक्तानी माध्यम (नगद, eSewa, RBB, सहकारी, Split वा बाँकी) रोजेर सुरक्षित गर्नुहोस् र रसिद/भ्याट बिल प्रिन्ट गर्नुहोस्।',
      english: 'Create sales invoices by selecting customer, picking stock items or entering custom charges, applying discounts, choosing payment methods (Cash, eSewa, RBB, Sahakari, Split, or Credit Due), and generating instant VAT/PAN receipts.',
      steps: [
        'Navigate to "Sales & Invoices" tab in the lateral sidebar and click "+ Create New Invoice".',
        'Select an existing client from the dropdown or register a new customer with PAN/VAT and phone details.',
        'Add items from warehouse stock (with live stock counts) or custom service descriptions, adjusting quantity, unit price, and discount percentage.',
        'Choose Payment Method: Cash, eSewa, Sahakari, RBB Bank, Split (multi-account allocation), or Credit Due.',
        'Click "Save Invoice" to deduct warehouse inventory in real time and launch the Universal Print Preview.'
      ]
    },
    {
      id: 'customer_dues',
      category: 'BILLING_CRM' as ManualCategory,
      forRole: 'Both',
      icon: <CreditCard className="text-cyan-500" size={18} />,
      title: '💳 ग्राहक बाँकी हिसाब र भुक्तानी सङ्कलन (Customer Receivables & Dues Recovery)',
      nepali: 'उधारोमा बिक्री गर्दा ग्राहकको बाँकी खातामा जम्मा हुन्छ। "Customers" मेनुमा गई ग्राहकको "Receive Payment" बटन थिची नगद, eSewa वा बैंक मार्फत भुक्तानी दाखिला गर्नुहोस्। ग्राहकको स्टेटमेन्ट प्रिन्ट गरी दिन सकिन्छ।',
      english: 'Track and collect customer outstanding balances. Use "Receive Payment" to log cash, eSewa, or bank receipts against dues, update receivables instantly, and print customer ledger statements.',
      steps: [
        'Open the "Customers" tab to view the customer directory, credit limits, and total outstanding dues.',
        'Find the target client and click the green "Receive Payment" button.',
        'Enter the collected payment amount and choose the receiving account (Cash Drawer, RBB Bank, eSewa, Sahakari).',
        'Add reference receipt or transaction ID notes and click "Confirm Payment Receipt". The balance updates immediately.',
        'Click "Print Statement" or "Ledger Report" to issue a complete statement of account to the client.'
      ]
    },

    // 2. INVENTORY & PROCUREMENT
    {
      id: 'inventory',
      category: 'INVENTORY_PO' as ManualCategory,
      forRole: 'Both',
      icon: <Package className="text-amber-500" size={18} />,
      title: '📦 इन्भेन्टरी र गोदाम स्टक व्यवस्थापन (Inventory & Warehouse Management)',
      nepali: 'सामानको स्टक थप्न "Inventory" मा जानुहोस्। सामानको नाम, SKU/बारकोड, खरिद मूल्य, बिक्री मूल्य, न्यूनतम अलर्ट सीमा र ओपनिङ स्टक प्रविष्ट गर्नुहोस्। स्टक सकिन लागेमा रातो अलर्ट देखा पर्दछ।',
      english: 'Manage warehouse inventory with real-time stock levels, SKU/barcode tracking, cost vs selling prices, low-stock threshold alerts, and manual inventory adjustments.',
      steps: [
        'Go to "Inventory" tab and click "+ Add New Item" to register a product.',
        'Fill in Item Code/SKU, Item Name, Category, Unit (Pcs, Box, Kg), Cost Price, Selling Price, and Low Stock Threshold.',
        'Enter initial stock quantity (which automatically becomes the active Opening Stock).',
        'Use "Adjust Stock" to record damaged goods, shrinkage, or physical audit adjustments with required audit remarks.',
        'Items with quantities below the threshold will automatically trigger amber/red re-order flags in the dashboard.'
      ]
    },
    {
      id: 'suppliers_po',
      category: 'INVENTORY_PO' as ManualCategory,
      forRole: 'Both',
      icon: <Truck className="text-emerald-500" size={18} />,
      title: '🚚 सप्लायर दर्ता र खरिद अर्डर (Suppliers & Purchase Orders Workflow)',
      nepali: 'सामान खरिद गर्न "Suppliers" मा गई नयाँ विक्रेता दर्ता गर्नुहोस्। "+ Create Purchase Order" थिची आवश्यक सामानहरूको अर्डर बनाउनुहोस्। सामान गोदाममा आइपुगेपछि "Mark Stock Received" गर्दा स्टक स्वतः बढ्छ।',
      english: 'Register vendors, formulate Purchase Orders (PO), manage supplier credit payables, and mark shipments received to automatically increment warehouse inventory quantities.',
      steps: [
        'Open "Suppliers" tab and click "+ Add New Supplier" with PAN, address, and credit terms.',
        'Switch to "Purchase Orders" sub-tab and click "+ Create Purchase Order (PO)".',
        'Select the vendor, add items to purchase with expected delivery date and agreed cost prices, and submit the draft PO.',
        'Upon administrative approval and delivery arrival, click "Mark Stock Received" on the PO.',
        'The system automatically increments the warehouse inventory stock and updates supplier payable ledgers.'
      ]
    },

    // 3. E-COMMERCE & STOREFRONT
    {
      id: 'ecommerce_products',
      category: 'ECOMMERCE_STORE' as ManualCategory,
      forRole: 'Both',
      icon: <ShoppingCart className="text-sky-500" size={18} />,
      title: '🛍️ अनलाइन स्टोर क्याटलग व्यवस्थापन (E-Commerce Storefront Product Catalog)',
      nepali: '"E-Commerce Management" को "Products" ट्याबमा गई अनलाइन पसलमा देखिने सामानहरू थप्नुहोस्। सामानको नाम लेख्दा गोदामको स्टकबाट छनोट गर्न सकिन्छ वा नयाँ सामान लेख्न सकिन्छ। फोटो, ब्याड्ज (Hot/New), प्राविधिक विवरण, र हार्डवेयर वर्ग छान्नुहोस्।',
      english: 'Curate your digital storefront catalog. Use the searchable stock picker to select existing inventory or type custom items, upload product photos, assign badges, technical specifications, and hardware categories.',
      steps: [
        'Go to "E-Commerce Management" and select the "Products" sub-tab.',
        'Click "+ Add Store Product" to open the storefront creation modal.',
        'Type in the "Product Title" or select from the live searchable dropdown to pick existing warehouse stock (showing available stock & price).',
        'Set Store Price (NPR), Category, Hardware Type, Promotional Badge (Hot Deal, Featured, Best Seller), and Detailed Specifications.',
        'Upload clear product photos and click "Create Product". Toggle "Published" on/off at any time to control visibility on the customer storefront.'
      ]
    },
    {
      id: 'ecommerce_orders',
      category: 'ECOMMERCE_STORE' as ManualCategory,
      forRole: 'Both',
      icon: <ShoppingBag className="text-emerald-600" size={18} />,
      title: '📦 अनलाइन अर्डर, भुक्तानी प्रमाणीकरण र डिस्प्याच (Order Processing & Dispatch)',
      nepali: 'ग्राहकले अनलाइन पसलबाट अर्डर गर्दा "Orders & Dispatch" मा सूचीकृत हुन्छ। QR/बैंक ट्रान्सफरको भुक्तानी रसिद (Payment Slip) हेरी स्वीकृत गर्नुहोस्। "Print Dispatch Slip" मार्फत कुरियर ट्र्याकिङ रसिद छाप्नुहोस् र स्थिति "Dispatched" मा बदल्नुहोस्।',
      english: 'Process online customer orders through verification and courier delivery. Inspect customer payment QR/bank slips, approve payment, print courier dispatch slips with tracking numbers, and convert to invoice.',
      steps: [
        'Open "E-Commerce Management" -> "Orders & Dispatch" sub-tab.',
        'Review incoming orders across status filters: Pending, Processing, Verified, Dispatched, Delivered, or Cancelled.',
        'For Bank Transfer / eSewa QR orders, click "Verify Payment Slip" to visually review the uploaded receipt and approve.',
        'Click "Print Courier Dispatch Slip" to generate a standardized dispatch delivery memo with shipping barcode and QR code.',
        'Click "Convert to Official Invoice" to formally register the order as a finalized sales billing document.'
      ]
    },
    {
      id: 'reverse_voucher',
      category: 'ECOMMERCE_STORE' as ManualCategory,
      forRole: 'Both',
      icon: <RotateCcw className="text-rose-500" size={18} />,
      title: '🔄 अर्डर रद्द र रिभर्स भौचर जारी (Order Cancellation & Reverse Voucher Settlement)',
      nepali: 'कुनै अर्डर रद्द गर्नुपर्दा "Cancel & Reverse Voucher" थिच्नुहोस्। प्रणालीले आधिकारिक "Reverse Voucher" जारी गर्दछ। यदि ग्राहकले पहिले नै रकम तिरिसकेको भए फिर्ता खर्च (Sales Refund Expense) दर्ता हुन्छ; यदि उधारो भए बाँकी हिसाब स्वतः रद्द हुन्छ।',
      english: 'Handle order returns and cancellations with full accounting integrity. Issue official Reverse Vouchers with QR codes, cancel associated invoices, and log single refund expenses for paid orders or clear receivables for credit orders.',
      steps: [
        'Locate the order in "Orders & Dispatch" and click "Cancel & Reverse Voucher".',
        'Select the Refund Settlement Method (Cash Drawer, eSewa, RBB Bank, Sahakari, or Institutional Credit Reversal).',
        'Enter the cancellation reason (e.g., Customer return, out of stock, courier defect) and submit.',
        'The system automatically marks the linked sales invoice as "Cancelled", clears customer debt, and logs a single refund expense for paid transactions.',
        'The official "Reverse Voucher" modal opens with verified QR authentication ready to print and hand to the client.'
      ]
    },
    {
      id: 'customer_inquiries',
      category: 'ECOMMERCE_STORE' as ManualCategory,
      forRole: 'Both',
      icon: <MessageSquare className="text-violet-500" size={18} />,
      title: '💬 ग्राहक सोधपुछ मेसेन्जर र स्प्याम नियन्त्रण (Customer Inquiries, Chat & Anti-Spam)',
      nepali: 'अनलाइन ग्राहकले सोधेका प्रश्नहरू "Inquiries & Chat" मा आउँछन्। कर्मचारीले सिधै जवाफ दिन सक्छन् वा प्रशासकलाई फरवार्ड गर्न सक्छन्। अनावश्यक वा स्प्याम पठाउने नम्बरलाई प्रशासकले "Block User" गर्न सक्नेछ।',
      english: 'Engage with customers via the live inquiry chatboard. Staff can reply directly or forward complex cases to Admin. Administrators can block abusive/spam messengers.',
      steps: [
        'Open "E-Commerce Management" -> "Inquiries & Chat" sub-tab.',
        'Click "Reply" on any pending customer inquiry to chat directly with the customer.',
        'Use "Forward to Admin" if the request involves legal, warranty, or executive pricing decisions.',
        'If a user sends abusive content or spam, Administrators can click "Block Messenger" to blacklist the phone/device ID permanently.',
        'Blocked users can be viewed and unblocked under the "Blocked Messengers" sub-panel.'
      ]
    },

    // 4. SERVICES & REPAIRS
    {
      id: 'service_desk',
      category: 'SERVICES' as ManualCategory,
      forRole: 'Both',
      icon: <Wrench className="text-amber-600" size={18} />,
      title: '🛠️ मर्मत सेवा र प्राविधिक टिकट (Repair Service Desks & Job Tracking)',
      nepali: 'मर्मतका लागि ल्याइएका कम्प्युटर/उपकरणहरू "Services & Bookings" मा दर्ता गर्नुहोस्। समस्या विवरण, प्राविधिक कर्मचारी र अनुमानित लागत राख्नुहोस्। मर्मत सकिएपछि सोझै चेक-आउट गरी बिल बनाउनुहोस्।',
      english: 'Register repair jobs and warranty service tickets. Assign lead technicians, diagnose hardware issues, track progress stages (Initiated -> In Progress -> Completed -> Delivered), and convert to billing.',
      steps: [
        'Go to "Services & Bookings" and click "+ Add New Booking".',
        'Enter Customer Info, Device Brand/Model, Serial Number, Accessories Received, and Reported Faults.',
        'Assign a lead technician and enter an initial estimated cost and delivery commitment date.',
        'Update status as repair progresses: Pending Inspection -> In Repair -> Testing -> Completed.',
        'Click "Checkout Service" on completed jobs to compile labor charges and replaced spare parts directly into a final sales invoice.'
      ]
    },

    // 5. CLOSING & AUDITING (ADMIN)
    {
      id: 'daily_closing',
      category: 'CLOSING_AUDIT' as ManualCategory,
      forRole: 'Admin',
      icon: <Lock className="text-amber-500" size={18} />,
      title: '📊 दैनिक ५-खाता बन्द र स्टेटमेन्ट ओसीआर (Daily Closing Matrix & Statement OCR)',
      nepali: 'दैनिक कारोबारको अन्त्यमा ५ वटा मुख्य खाता (RBB, Cash, eSewa, Sahakari, Due) को वास्तविक मौज्दात प्रविष्ट गर्नुहोस्। बैंक वा ईसेवाको स्टेटमेन्ट फोटो अपलोड गर्दा एआई ओसीआरले रकम जाँच्नेछ। विसंगति नभएपछि बन्द स्वीकृत गर्नुहोस्।',
      english: 'Reconcile daily physical balances across the 5 core accounts (RBB Bank, Cash Drawer, eSewa Wallet, Sahakari Savings, and Customer Receivables). Upload bank/eSewa statement photos to run simulated AI OCR verification.',
      steps: [
        'Go to "Daily Closing" tab at the end of each business day.',
        'Enter actual closing counts for Cash Drawer, RBB Bank, eSewa, Sahakari, and Customer Receivables.',
        'Click "Upload Statement" on bank/eSewa panels to upload digital photos (JPEG/PNG) of official bank slips or e-statements.',
        'The vision engine extracts balances and compares them with digital logs. Any variance triggers a prominent Red Alert.',
        'Resolve discrepancies, review automatic staff check-out logs (5:00 PM full day / 1:00 PM half day), and click "Approve Daily Closing".'
      ]
    },
    {
      id: 'periodic_closing',
      category: 'CLOSING_AUDIT' as ManualCategory,
      forRole: 'Admin',
      icon: <TrendingUp className="text-indigo-600" size={18} />,
      title: '📈 आवधिक बन्द र प्रशासक सहमति लक (Periodic Closings & 100% Consensus Gate)',
      nepali: 'मासिक, ३-मासिक, वा वार्षिक बन्द "Periodic Closings (Admin Only)" बाट गरिन्छ। यसले नाफा-नोक्सान हिसाब गरी अवधिलाई स्थायी रूपमा लक गर्छ। परिमार्जन गर्न "Request Revision" गर्नुपर्छ जहाँ सबै प्रशासकको १००% सहमति अनिवार्य हुन्छ।',
      english: 'Execute Monthly, Quarterly, Semi-Annual, and Annual financial closings. Once approved, transaction editing is frozen. Unlocking requires a Revision Request with 100% consensus sign-off from all registered system administrators.',
      steps: [
        'Navigate to "Daily Closing" -> "Periodic Closings (Admin Only)".',
        'Choose duration span (Monthly, 3-Monthly, 6-Monthly, Annual) and period name (e.g., Ashadh 2083).',
        'Enter closing balances for the 5 accounts and click "Process Draft Closing" to compute automated P&L statements.',
        'To revise locked historical transactions, click "Request Revision" and provide a detailed operational justification.',
        'All registered administrators must log into their accounts and click "Signoff Consensus Approval" before editing is unlocked.'
      ]
    },
    {
      id: 'fiscal_rollover',
      category: 'CLOSING_AUDIT' as ManualCategory,
      forRole: 'Admin',
      icon: <Calendar className="text-emerald-600" size={18} />,
      title: '🇳🇵 नेपाली आर्थिक वर्ष रिसेट र स्टक रोलओभर (Nepali Fiscal Year & Sequence Reset)',
      nepali: 'नेपाली आर्थिक वर्ष (श्रावण १ देखि असार ३१) अनुसार काम हुन्छ। वार्षिक बन्द (Annual Closing) स्वीकृत भएपछि असार ३१ को अन्तिम मौज्दात श्रावण १ को "Opening Stock" मा परिणत हुन्छ र बिल, खरिद, खर्च, र पत्रको नम्बर "001" मा रिसेट हुन्छ।',
      english: 'Operating on the Nepalese Fiscal Year (Shrawan 1 to Ashadh 31), completing the Year-End Annual Closing automatically transitions closing inventory into Shrawan 1 Opening Stock and resets transaction serials to 001.',
      steps: [
        'Ensure all year-end accounts and invoices up to Ashadh 31 are settled and audited.',
        'Execute the Year-End "Annual Closing" draft with complete multi-admin consensus.',
        'Upon final sign-off, closing stock levels automatically rollover as the "Opening Stock" for the new fiscal year starting Shrawan 1.',
        'All sequential document numbers (Invoices, POs, Expenses, Official Letters, Service Tickets) seamlessly reset to 001.'
      ]
    },

    // 6. REPORTS & FINANCIAL STATEMENTS
    {
      id: 'financial_reports',
      category: 'REPORTS_FINANCE' as ManualCategory,
      forRole: 'Both',
      icon: <TrendingUp className="text-teal-600" size={18} />,
      title: '📑 वित्तीय प्रतिवेदन र क्यालेन्डर मिति फिल्टर (Dynamic Calendar & Financial Reports)',
      nepali: '"Reports" मेनुमा नयाँ क्यालेन्डर मिति पिकर मार्फत नेपाली मिति (BS) अनुसार तुरुन्तै फिल्टर गर्नुहोस्। नाफा-नोक्सान, आय-व्यय खाता, ५-खाता लेजर, ब्यालेन्स सिट, र अडिटर सारांश A4 ढाँचामा प्रिन्ट गर्नुहोस्।',
      english: 'Generate real-time double-entry financial statements. Use the interactive calendar date range picker with automatic AD-to-BS conversion to view Income Statements, Balance Sheets, Cash Flow, and Auditor Advisory Notes.',
      steps: [
        'Open the "Reports" tab.',
        'Use the interactive Calendar Date Picker to choose start and end dates (automatically converts to Bikram Sambat YYYY-MM-DD).',
        'Select report type: Income Report, Expense Report, Profit & Loss, Income & Expenditure Ledger, Cost vs Selling Price, Multi-Account Ledger, or Account Summary (Double-Entry Balance Sheet & Cash Flow).',
        'Review Senior Auditor Notes with automated double-entry verification indicators.',
        'Click "Print Current Report" for standardized, blank-free A4 output.'
      ]
    },
    {
      id: 'expenses_tracker',
      category: 'REPORTS_FINANCE' as ManualCategory,
      forRole: 'Both',
      icon: <DollarSign className="text-amber-600" size={18} />,
      title: '💸 दैनिक सञ्चालन खर्च दर्ता र स्वीकृति (Operational Expenses & Approvals)',
      nepali: 'घरभाडा, बिजुली, चिया/खाजा, ढुवानी वा मर्मत खर्च "Expenses" मा दर्ता गर्नुहोस्। भुक्तानी भएको खाता छान्नुहोस् र रसिद नम्बर लेख्नुहोस्। प्रशासकले स्वीकृत गरेपछि यो मुख्य खातामा घट्छ।',
      english: 'Log company operational costs (rent, utilities, hospitality, logistics, maintenance). Assign funding account, attach receipt notes, and submit for administrative approval.',
      steps: [
        'Go to "Expenses" tab and click "+ Add New Expense".',
        'Select Expense Category (Rent, Electricity, Office Tea/Food, Logistics, Hardware Parts, etc.).',
        'Enter Date, Amount (NPR), Payment Source Account (Cash, RBB, eSewa, Sahakari), and Receipt/Bill Number.',
        'Administrators review pending expenses and click "Approve Expense" to debit the respective account balance.'
      ]
    },

    // 7. STAFF & HR MANAGEMENT
    {
      id: 'attendance_hr',
      category: 'STAFF_HR' as ManualCategory,
      forRole: 'Both',
      icon: <Clock className="text-rose-500" size={18} />,
      title: '⏰ कर्मचारी हाजिरी, सिफ्ट र तलब गणना (Staff Attendance & Payroll Shifts)',
      nepali: 'कार्यालय आइपुग्दा "Check In" र जाँदा "Check Out" गर्नुहोस्। प्रणालीले दैनिक कार्य घण्टा स्वतः हिसाब गर्छ। दैनिक बन्द गर्दा चेक-आउट बिर्सेका कर्मचारी स्वतः चेक-आउट (५:०० PM / १:०० PM) हुन्छन्।',
      english: 'Log daily attendance with morning Check In and evening Check Out. System calculates working hours and overtime. Unclosed shifts auto checkout during Daily Closing (5:00 PM full day, 1:00 PM half day).',
      steps: [
        'Open "Staff Attendance" tab from the sidebar.',
        'Click green "Check In" upon arrival at the office in the morning.',
        'At the end of your shift, click amber "Check Out" and add brief notes on your daily tasks.',
        'View total active hours, overtime hours, and monthly payroll summary directly in the attendance table.'
      ]
    },
    {
      id: 'staff_requests',
      category: 'STAFF_HR' as ManualCategory,
      forRole: 'Both',
      icon: <Send className="text-blue-500" size={18} />,
      title: '📝 बिदा, तलब पेश्की र खर्च दाबी अनुरोध (Staff Requests, Leaves & Salary Advances)',
      nepali: 'कर्मचारीले बिदा (Leave), तलब पेश्की (Salary Advance), वा खर्च दाबी (Expense Claim) "Staff Requests" बाट पेश गर्न सक्नेछन्। प्रशासकले सो अनुरोध हेरी स्वीकृत वा अस्वीकृत गर्न सक्नेछन्।',
      english: 'Staff can submit formal requests for Leave, Salary Advances, or Expense Reimbursements. Administrators review, attach remarks, and grant approval or rejection.',
      steps: [
        'Go to "Staff Requests" tab and click "+ Submit New Request".',
        'Choose Request Type: Leave Application, Salary Advance, or Expense Claim.',
        'Provide reason, amount/dates, and supporting details.',
        'Administrators view pending items in their dashboard and click "Approve" or "Reject" with recorded review remarks.'
      ]
    },

    // 8. LEGAL, ASSETS & GOVERNANCE
    {
      id: 'official_letters',
      category: 'LEGAL_ASSETS' as ManualCategory,
      forRole: 'Both',
      icon: <FileText className="text-teal-600" size={18} />,
      title: '✉️ आधिकारिक पत्र लेखन र लेटरहेड इन्जिन (Official Letters & Letterhead Engine)',
      nepali: 'आधिकारिक पत्रहरू "Official Letters" मा लेख्नुहोस्। म्यानुअल वा टेम्प्लेट (अनुभव पत्र, सिफारिस, कोटेशन, सूचना) छानी स्वचालित आर्थिक वर्ष सिरियल नम्बर र वाटरमार्क सहित लेटरहेड प्रिन्ट गर्नुहोस्।',
      english: 'Compose formal corporate correspondence with automated fiscal sequential numbering. Choose between manual composition or pre-formatted templates (Experience, Recommendation, Quotation, Notice, Termination).',
      steps: [
        'Navigate to "Official Letters" tab and click "+ Compose New Letter".',
        'Select "Manual Composition" or choose a pre-formatted template.',
        'Enter Recipient, Subject, and Letter Body in Nepali or English with dynamic tags.',
        'The system automatically assigns an official fiscal sequence number (e.g., RTSS/LTR/2083-001).',
        'Click "Preview & Print Letter" to print on official letterhead with optional watermark, seal, and signature lines.'
      ]
    },
    {
      id: 'shareholders',
      category: 'LEGAL_ASSETS' as ManualCategory,
      forRole: 'Admin',
      icon: <Award className="text-purple-600" size={18} />,
      title: '👥 सेयरधनी दर्ता र पूँजी खाता (Shareholder Registry & Capital Ledger)',
      nepali: 'कम्पनीका सेयरधनीहरूको नामावली "Shareholders" मा व्यवस्थापन गर्नुहोस्। थप सेयर पूँजी जम्मा गर्दा खातामा रकम थपिन्छ र सेयर फिर्ता गर्दा खर्च रेकर्ड भई सेयर प्रमाणपत्र जारी गर्न सकिन्छ।',
      english: 'Manage shareholder profiles, share distribution units, capital additions (with automatic account deposits), and capital returns/refunds with official share certificates.',
      steps: [
        'Open "Shareholders" tab (Admin Only).',
        'Register shareholders with Citizenship/PAN, Share Units, and Face Value.',
        'Record "Share Capital Addition" to credit the designated bank/cash account and update total investment.',
        'Record "Share Return / Refund" to debit capital and log a corresponding accounting return voucher.',
        'Click "Print Share Certificate" to generate an official decorative ownership certificate.'
      ]
    },
    {
      id: 'office_assets',
      category: 'LEGAL_ASSETS' as ManualCategory,
      forRole: 'Both',
      icon: <Building className="text-slate-600" size={18} />,
      title: '🏢 कार्यालय सम्पत्ति र ह्रासकट्टी खाता (Office Assets & Depreciation Registry)',
      nepali: 'कम्पनीका स्थायी तथा चालु सम्पत्तिहरू (कम्प्युटर, मेसिन, फर्निचर, गाडी) दर्ता गर्नुहोस्। खरिद मूल्य, मिति, अवस्था (Active/Damaged) र वार्षिक ह्रासकट्टी (Depreciation) ट्र्याक गर्नुहोस्।',
      english: 'Catalog physical company assets (computers, repair equipment, furniture, vehicles). Track purchase value, serial numbers, active condition, and annual depreciation schedules.',
      steps: [
        'Navigate to "Office Assets" tab and click "+ Register New Asset".',
        'Enter Asset Name, Category, Serial/Asset Tag, Purchase Date, and Initial Cost (NPR).',
        'Set Condition (Operational, Under Repair, Written Off) and Assigned Staff/Location.',
        'Generate official Asset Registry Reports for company audit documentation.'
      ]
    },
    {
      id: 'meeting_minutes',
      category: 'LEGAL_ASSETS' as ManualCategory,
      forRole: 'Both',
      icon: <Briefcase className="text-indigo-700" size={18} />,
      title: '🏛️ बैठक निर्णय र कानुनी माइन्युट (Meeting Minutes & Resolution Desks)',
      nepali: 'बोर्ड तथा स्टाफ बैठकका निर्णयहरू "Meeting & Notes" मा सुरक्षित गर्नुहोस्। बैठक मिति, संख्या, उपस्थित सदस्य र पारित निर्णयहरू लेखी प्रिन्ट वा कानुनी अभिलेखमा सुरक्षित गर्नुहोस्।',
      english: 'Record executive board decisions, staff meeting minutes, attendee registries, and legal resolutions with permanent decision number tags.',
      steps: [
        'Open "Meeting & Notes" tab and click "+ Record New Meeting".',
        'Enter Meeting Date, Meeting Number (e.g. RTSS-M-2083/02), Chairperson, and Attendees.',
        'Document Agenda topics and bulleted Resolution Decisions.',
        'Save the minute and click "Print Official Minutes" for physical signature archiving.'
      ]
    },

    // 9. SYSTEM, BACKUPS & SECURITY
    {
      id: 'backups_security',
      category: 'SYSTEM_ADMIN' as ManualCategory,
      forRole: 'Admin',
      icon: <Database className="text-emerald-700" size={18} />,
      title: '💾 डाटा ब्याकअप, रिस्टोर र प्रयोगकर्ता खाता (Full Backups, JSON Restore & Users)',
      nepali: '"Export & Backup Center" बाट "Download Full JSON Backup" मार्फत सम्पूर्ण डाटा सुरक्षित गर्नुहोस्। नयाँ कम्प्युटरमा सो फाइल लोड गरी रिस्टोर गर्न सकिन्छ। यहाँबाट नयाँ कर्मचारी खाता खोल्ने र प्रोफाइल फोटो स्वीकृत गर्ने काम गरिन्छ।',
      english: 'Download complete system snapshots via "Download Complete Data Backup (JSON)" or restore previous states. Manage user accounts (Admin vs Staff) and approve employee profile photos.',
      steps: [
        'Open "Export & Backup Center" in the sidebar.',
        'Click "Download Complete Data Backup (JSON)" to save a full local snapshot file on your computer.',
        'To restore on another machine, click "Select Backup File", select the .json snapshot, and confirm restoration.',
        'Scroll down to "User Accounts Management" to create new staff accounts or edit roles.',
        'Review and click "Approve Photo" for employee profile pictures before they display on the system badges.'
      ]
    },
    {
      id: 'universal_printer',
      category: 'SYSTEM_ADMIN' as ManualCategory,
      forRole: 'Both',
      icon: <Printer className="text-slate-700" size={18} />,
      title: '🖨️ युनिभर्सल प्रिन्ट इन्जिन र वाटरमार्क (Universal Print Engine & Watermark Settings)',
      nepali: 'कुनै पनि बिल, प्रतिवेदन, वा पत्र प्रिन्ट गर्दा ग्लोबल प्रिन्ट मोडल खुल्छ। यहाँ मार्जिन (Tight, Normal, Compact), रङ (Color/Monochrome) र "Background Watermark" चेकबक्स अन गरी पानाको मध्यभागमा वाटरमार्क राख्न सकिन्छ।',
      english: 'Standardized printing across all modules. Customize layout margins, color vs monochrome output, and toggle the centered 2.5% opacity company watermark overlay.',
      steps: [
        'Click "Print" on any invoice, voucher, letter, or report to launch the Universal Print Engine modal.',
        'Use the left control sidebar to choose margin density (Tight, Normal, Compact) and color mode.',
        'Tick the "Background Watermark" checkbox if you wish to overlay the soft centered company logo.',
        'Click "Print Document" (or press Ctrl+P). The document is formatted for clean A4 printing without blank pages.'
      ]
    }
  ];

  const categories: { key: ManualCategory; label: string; icon: React.ReactNode }[] = [
    { key: 'ALL', label: 'All Chapters', icon: <BookOpen size={14} /> },
    { key: 'BILLING_CRM', label: 'Billing & CRM', icon: <FileText size={14} /> },
    { key: 'INVENTORY_PO', label: 'Inventory & PO', icon: <Package size={14} /> },
    { key: 'ECOMMERCE_STORE', label: 'E-Commerce Store', icon: <ShoppingCart size={14} /> },
    { key: 'SERVICES', label: 'Repair Services', icon: <Wrench size={14} /> },
    { key: 'CLOSING_AUDIT', label: 'Daily & Periodic Closing', icon: <Lock size={14} /> },
    { key: 'REPORTS_FINANCE', label: 'Reports & Expenses', icon: <TrendingUp size={14} /> },
    { key: 'STAFF_HR', label: 'Staff & HR', icon: <Clock size={14} /> },
    { key: 'LEGAL_ASSETS', label: 'Legal, Assets & Meetings', icon: <Briefcase size={14} /> },
    { key: 'SYSTEM_ADMIN', label: 'System & Backups', icon: <Database size={14} /> }
  ];

  const filteredItems = allManualItems.filter(item => {
    // Role filter
    if (viewRole === 'Staff' && item.forRole === 'Admin') return false;

    // Category filter
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;

    // Search query filter
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(search) ||
      item.nepali.toLowerCase().includes(search) ||
      item.english.toLowerCase().includes(search) ||
      item.steps.some(step => step.toLowerCase().includes(search))
    );
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:block animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[calc(100dvh-2rem)] print:max-h-none print:shadow-none print:border-none print:my-0 print:overflow-visible">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shadow-sm shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-xl border border-indigo-500/30 text-indigo-300">
              <BookOpen size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold font-display text-base tracking-tight text-white">
                  Reliabletech IDMS Complete Operations Manual
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold border border-indigo-500/30 uppercase">
                  v3.5.0
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono tracking-wide">
                Comprehensive step-by-step procedures, business rules &amp; accounting workflows
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isAdminUser && (
              <div className="bg-slate-800/80 p-0.5 rounded-xl border border-slate-700 flex text-xs">
                <button
                  type="button"
                  onClick={() => setViewRole('Admin')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                    viewRole === 'Admin' 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Admin View
                </button>
                <button
                  type="button"
                  onClick={() => setViewRole('Staff')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                    viewRole === 'Staff' 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Staff View
                </button>
              </div>
            )}

            <button 
              onClick={handlePrint}
              className="text-white hover:text-indigo-100 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer"
              title="Print operations handbook"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print Manual</span>
            </button>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white bg-white/15 hover:bg-white/25 p-1.5 rounded-xl flex items-center justify-center font-bold text-xs cursor-pointer transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col gap-3 shrink-0 print:hidden">
          <div className="flex items-center justify-between gap-3">
            <InteractiveSearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by keyword, module, Nepali or English description, steps..."
              expandedWidth="w-full"
              size="sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold px-2 py-1 bg-slate-200 rounded-lg shrink-0 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  selectedCategory === cat.key
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50 font-sans" id="manual-print-area">
          
          {/* Welcome Header Badge */}
          <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                📖
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-slate-900 text-sm">
                  Operational Handbook &amp; Standard Operating Procedures (SOP)
                </h4>
                <p className="text-xs text-slate-600 leading-normal">
                  Logged in as <strong>{currentUser.name}</strong> ({viewRole === 'Admin' ? 'Master Administrator' : 'Standard Staff'}). This manual provides exact, concise step-by-step instructions for every feature and business rule.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0 hidden sm:block">
              <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-100/80 px-2.5 py-1 rounded-full font-mono">
                {filteredItems.length} Operational Chapters
              </span>
            </div>
          </div>

          {/* Chapters List */}
          <div className="space-y-4">
            {filteredItems.map((item, idx) => (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 hover:shadow-md transition duration-200 space-y-4"
              >
                {/* Chapter Title & Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 shrink-0 mt-0.5 text-slate-800">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-indigo-600 font-bold font-mono uppercase bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          CHAPTER {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono uppercase">
                          • {item.category.replace('_', ' ')}
                        </span>
                        {item.forRole === 'Admin' && (
                          <span className="text-[10px] text-amber-700 font-bold font-mono uppercase bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                            <Lock size={10} /> Admin Clearance Only
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bilingual Summaries */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 border-t border-slate-100 pt-3.5 text-xs leading-relaxed">
                  <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                    <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] font-mono flex items-center gap-1">
                      <span>🇳🇵</span> <span>नेपाली म्यानुअल (Nepalese Overview)</span>
                    </p>
                    <p className="text-slate-700 font-medium leading-relaxed">{item.nepali}</p>
                  </div>
                  <div className="space-y-1 bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-100/70">
                    <p className="font-bold text-indigo-600 uppercase tracking-wider text-[10px] font-mono flex items-center gap-1">
                      <span>🇬🇧</span> <span>English Guidelines</span>
                    </p>
                    <p className="text-slate-700 leading-relaxed">{item.english}</p>
                  </div>
                </div>

                {/* Step-by-Step Procedures */}
                <div className="bg-slate-50/60 rounded-xl p-4 border border-slate-200/60 space-y-2.5">
                  <p className="font-bold text-slate-900 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-emerald-600" />
                    <span>Exact Action Steps &amp; Procedures:</span>
                  </p>
                  <ol className="space-y-2 text-xs text-slate-700">
                    {item.steps.map((step, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2.5">
                        <span className="font-bold text-indigo-700 shrink-0 w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-[11px] mt-0.5 border border-indigo-200">
                          {sIdx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="bg-white py-16 text-center rounded-2xl border border-slate-200 space-y-3">
                <p className="text-4xl">🔍</p>
                <h4 className="font-bold text-slate-800 text-sm">No handbook entries found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try searching for general keywords like &apos;invoice&apos;, &apos;reverse voucher&apos;, &apos;closing&apos;, &apos;inventory&apos;, &apos;attendance&apos;, or &apos;backup&apos;.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('ALL');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>

          {/* System Developer / Contact Footer */}
          <div className="bg-slate-900 text-slate-300 rounded-2xl p-6 border border-slate-800 space-y-3 text-center shadow-lg">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold uppercase">
              <Award size={12} />
              <span>System Architect &amp; Software Engineer</span>
            </div>
            <h5 className="text-white text-base font-bold font-display">Mr. Arpan Khadka (श्री अर्पण खड्का)</h5>
            <p className="text-xs text-slate-400">Suryodaya-7, Fikkal Bazaar, Ilam, Nepal</p>
            <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
              For database restoration assistance, source code exports, custom business modules, or external API integrations, please consult the software developer <strong>Mr. Arpan Khadka</strong> directly.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Reliabletech IDMS • All Rights Reserved</span>
          </div>
          <button 
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer shadow-xs active:scale-95"
          >
            Close Manual
          </button>
        </div>

      </div>
    </div>
  );
};
