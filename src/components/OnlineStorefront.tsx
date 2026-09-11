import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  ShoppingCart,
  User,
  LogIn,
  LogOut,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  Truck,
  Wrench,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Minus,
  ChevronRight,
  Filter,
  Eye,
  FileText,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  Store,
  Tag,
  Package,
  Layers,
  Check,
  Send,
  HelpCircle,
  CreditCard,
  QrCode,
  FileCheck,
  PhoneCall,
  Globe,
  CheckCheck,
  Building,
  Info,
  Headphones,
  MessageSquare,
  Image as ImageIcon,
  Stamp as StampIcon,
  FileSpreadsheet,
  Upload,
  Users,
  Copy,
  Maximize2,
  ExternalLink
} from 'lucide-react';
import {
  EcommerceProduct,
  EcommerceCategory,
  PermittedMunicipality,
  PERMITTED_MUNICIPALITIES,
  CustomerAccount,
  CustomerAccountCategory,
  EcommerceOrder,
  EcommerceOrderItem,
  PaymentFlowMethod,
  EcommerceServiceTicket,
  ServiceTicketHardwareType,
  ServiceTicketServiceType,
  HardwareTypeOption,
  BusinessProfile,
  CustomerInquiryMessage,
  AppUser
} from '../types';
import { INITIAL_HARDWARE_TYPES } from '../initialData';
import { getCurrentBsDate } from '../utils/nepaliDate';
import { CustomerOrderTrackerModal } from './CustomerOrderTrackerModal';
import { EcommerceOrderReceiptModal } from './EcommerceOrderReceiptModal';
import { OfficialTaxInvoiceModal } from './OfficialTaxInvoiceModal';
import { CustomerChatWidget } from './CustomerChatWidget';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { CustomerRegistrationWizard } from './CustomerRegistrationWizard';

// Geographic Areas Constants for Quick Selection & Service Boundaries
const SURYODAYA_AREAS = [
  'All Suryodaya Area',
  'Fikkal Bazaar',
  'Harkatte',
  'Kanyam',
  'Pashupatinagar',
  'Shree Antu',
  'Chhipitar',
  'Gorkhe',
  'Aitabare',
  'Samalbung',
  'Laxmipur',
  'Tindobato'
];

const RONG_AREAS = [
  'Highway Corridor (Harkatte to Jor Kalas)',
  'Kolbung Highway Section',
  'Hanspokhari',
  'Kutidanda',
  'Barhaghare',
  'Irong Highway Area',
  'Bhaise'
];

const ILAM_AREAS = [
  'Fikkal to Mai Khola & Ilam Bazaar Corridor',
  'Ilam Bazaar',
  'Singhabahini',
  'Golakharka',
  'Singfrin',
  'Tilkeni',
  'Barbote',
  'Narayansthan',
  'Biblante'
];

interface OnlineStorefrontProps {
  products: EcommerceProduct[];
  customerAccounts: CustomerAccount[];
  orders: EcommerceOrder[];
  serviceTickets: EcommerceServiceTicket[];
  hardwareTypes?: HardwareTypeOption[];
  users?: AppUser[];
  profile: BusinessProfile;
  activeCustomer: CustomerAccount | null;
  inquiries?: CustomerInquiryMessage[];
  onSendMessage?: (inquiry: Omit<CustomerInquiryMessage, 'id' | 'created_at' | 'status'>) => void;
  onSendReply?: (inquiryId: string, replyText: string, senderName: string) => void;
  onCustomerLogin: (customer: CustomerAccount) => void;
  onCustomerLogout: () => void;
  onCustomerRegister: (customer: CustomerAccount) => void;
  onCreateOrder: (order: EcommerceOrder) => void;
  onCreateServiceTicket: (ticket: EcommerceServiceTicket) => void;
  onOpenStaffLogin: () => void;
  onResetCustomerPassword?: (customerId: string, newPassword: string) => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function OnlineStorefront({
  products,
  customerAccounts,
  orders,
  serviceTickets,
  hardwareTypes = INITIAL_HARDWARE_TYPES,
  users = [],
  profile,
  activeCustomer,
  inquiries = [],
  onSendMessage,
  onSendReply,
  onCustomerLogin,
  onCustomerLogout,
  onCustomerRegister,
  onCreateOrder,
  onCreateServiceTicket,
  onOpenStaffLogin,
  onResetCustomerPassword,
  onToast
}: OnlineStorefrontProps) {
  // Language State: 'ENG' | 'NEP'
  const [lang, setLang] = useState<'ENG' | 'NEP'>('ENG');

  // State for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [quickFilter, setQuickFilter] = useState<'all' | 'discounted' | 'featured' | 'in_stock'>('all');

  // Cart state
  const [cart, setCart] = useState<{ product: EcommerceProduct; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isCustomerPortalOpen, setIsCustomerPortalOpen] = useState(false);
  const [customerPortalTab, setCustomerPortalTab] = useState<'orders' | 'services' | 'profile'>('orders');
  const [selectedProductForModal, setSelectedProductForModal] = useState<EcommerceProduct | null>(null);
  const [isDeveloperInfoOpen, setIsDeveloperInfoOpen] = useState(false);

  // Customer Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Customer Register Form State (Expanded)
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAltPhone, setRegAltPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regMunicipality, setRegMunicipality] = useState<PermittedMunicipality>('Suryodaya Municipality');
  const [regWard, setRegWard] = useState('Ward 10');
  const [regToleArea, setRegToleArea] = useState('Fikkal Bazaar');
  const [regLandmark, setRegLandmark] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCategory, setRegCategory] = useState<CustomerAccountCategory>('Individual');
  const [regIsInstitutional, setRegIsInstitutional] = useState(false);
  const [regOrgName, setRegOrgName] = useState('');
  const [regOrgPan, setRegOrgPan] = useState('');
  const [regDesignation, setRegDesignation] = useState('');
  const [regPreferredLanguage, setRegPreferredLanguage] = useState<'ENG' | 'NEP'>('ENG');
  const [regError, setRegError] = useState('');

  // Checkout Form State
  const [checkoutMunicipality, setCheckoutMunicipality] = useState<PermittedMunicipality>(
    activeCustomer?.municipality || 'Suryodaya Municipality'
  );
  const [checkoutWard, setCheckoutWard] = useState(activeCustomer?.ward || 'Ward 10');
  const [checkoutAddress, setCheckoutAddress] = useState(activeCustomer?.detailed_address || '');
  const [checkoutPhone, setCheckoutPhone] = useState(activeCustomer?.phone || '');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<PaymentFlowMethod>('COD');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [gatewayRefToken, setGatewayRefToken] = useState('');
  const [rbbVoucherUrl, setRbbVoucherUrl] = useState('');
  const [coopTxnId, setCoopTxnId] = useState('');
  const [orgName, setOrgName] = useState(activeCustomer?.organization_name || '');
  const [orgPan, setOrgPan] = useState(activeCustomer?.organization_pan || '');
  const [orgAddress, setOrgAddress] = useState(activeCustomer?.detailed_address || '');
  const [hasOldId, setHasOldId] = useState(false);
  const [oldCustomerId, setOldCustomerId] = useState('');
  const [poDocUrl, setPoDocUrl] = useState('');
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const [placedOrderSuccess, setPlacedOrderSuccess] = useState<EcommerceOrder | null>(null);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [receiptModalOrder, setReceiptModalOrder] = useState<EcommerceOrder | null>(null);
  const [invoiceModalOrder, setInvoiceModalOrder] = useState<EcommerceOrder | null>(null);
  const [paymentScreenshotFile, setPaymentScreenshotFile] = useState<string>('');

  // Service Booking Form State (Expanded for Hardware Repair, Flex Banner Printing & Official Stamp)
  const [srvCategory, setSrvCategory] = useState<'hardware' | 'flex' | 'stamp'>('hardware');
  const [srvHardwareType, setSrvHardwareType] = useState<string>('Desktop PC / Workstation');
  const [srvIsCustomHardware, setSrvIsCustomHardware] = useState(false);
  const [srvCustomHardwareName, setSrvCustomHardwareName] = useState('');
  const [srvServiceType, setSrvServiceType] = useState<ServiceTicketServiceType>('Fikkal Shop Drop-off');
  const [srvMunicipality, setSrvMunicipality] = useState<PermittedMunicipality>(
    activeCustomer?.municipality || 'Suryodaya Municipality'
  );
  const [srvSpecificArea, setSrvSpecificArea] = useState('Fikkal Bazaar');
  const [srvLandmark, setSrvLandmark] = useState('');
  const [srvAddress, setSrvAddress] = useState(activeCustomer?.detailed_address || '');
  const [srvPhone, setSrvPhone] = useState(activeCustomer?.phone || '');
  const [srvAltPhone, setSrvAltPhone] = useState('');
  const [srvCustomerName, setSrvCustomerName] = useState(activeCustomer?.name || '');
  const [srvProblem, setSrvProblem] = useState('');
  const [srvPreferredDate, setSrvPreferredDate] = useState('');

  // Specialized Flex Banner Form States
  const [flexSize, setFlexSize] = useState('6x3 ft');
  const [flexCustomSize, setFlexCustomSize] = useState('');
  const [flexOrgName, setFlexOrgName] = useState(activeCustomer?.organization_name || activeCustomer?.name || '');
  const [flexAddress, setFlexAddress] = useState(activeCustomer?.detailed_address || '');
  const [flexProgramName, setFlexProgramName] = useState('');
  const [flexDateFrom, setFlexDateFrom] = useState('');
  const [flexDateTo, setFlexDateTo] = useState('');
  const [flexRequirements, setFlexRequirements] = useState('');

  // Specialized Stamp Creation Form States
  const [stampShape, setStampShape] = useState<'Round' | 'Rectangle' | 'Oval'>('Round');
  const [stampOrgName, setStampOrgName] = useState(activeCustomer?.organization_name || activeCustomer?.name || '');
  const [stampAddress, setStampAddress] = useState(activeCustomer?.detailed_address || '');
  const [stampEstdDate, setStampEstdDate] = useState('');
  const [stampImagePreview, setStampImagePreview] = useState('');
  const [stampRequirements, setStampRequirements] = useState('');

  // Payment QR Code Modal & Copy Feedback States
  const [zoomedQrData, setZoomedQrData] = useState<{ title: string; qrUrl: string; subtext: string; accountNo?: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string>('');

  const handleCopyText = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(''), 2000);
    onToast(`Copied ${text} to clipboard!`, 'info');
  };

  // Payment QR Code Settings
  const qrSettings = profile?.paymentQrSettings;

  // eSewa Details
  const esewaId = qrSettings?.esewaId || '9852680456';
  const esewaAccountName = qrSettings?.esewaAccountName || 'RELIABLETECH (OFFICIAL)';
  const esewaQrCodeUrl = qrSettings?.esewaQrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=ESEWA-${esewaId}-RELIABLETECH`;

  // RBB Details
  const rbbAccountNumber = qrSettings?.rbbAccountNumber || '2030010004523001';
  const rbbAccountName = qrSettings?.rbbAccountName || 'RELIABLETECH SERVICES AND SUPPLIERS';
  const rbbBranch = qrSettings?.rbbBranch || 'Fikkal Branch, Suryodaya-10, Ilam';
  const rbbQrCodeUrl = qrSettings?.rbbQrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=RBB-RELIABLETECH-${rbbAccountNumber}`;

  // Sahakari Details
  const sahakariName = qrSettings?.sahakariName || 'Suryodaya Multipurpose Cooperative Ltd.';
  const sahakariAccountName = qrSettings?.sahakariAccountName || 'RELIABLETECH SS PVT';
  const sahakariAccountNumber = qrSettings?.sahakariAccountNumber || '001-045-88910';
  const sahakariQrCodeUrl = qrSettings?.sahakariQrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=SAHAKARI-${sahakariAccountNumber}-SURYODAYA`;

  // Developer Photo (taken from @reliableadmin ID staff profile photo)
  const reliableAdminUser = useMemo(() => {
    return users.find(u => u.username?.toLowerCase() === 'reliableadmin') || users.find(u => u.username?.toLowerCase() === 'arpan');
  }, [users]);
  const developerPhoto = reliableAdminUser?.profilePhoto || '';

  // Synchronize customer profile info when active customer changes
  React.useEffect(() => {
    if (activeCustomer) {
      setCheckoutMunicipality(activeCustomer.municipality);
      setCheckoutWard(activeCustomer.ward);
      setCheckoutAddress(activeCustomer.detailed_address);
      setCheckoutPhone(activeCustomer.phone);
      if (activeCustomer.organization_name) setOrgName(activeCustomer.organization_name);
      if (activeCustomer.organization_pan) setOrgPan(activeCustomer.organization_pan);
      setSrvCustomerName(activeCustomer.name);
      setSrvPhone(activeCustomer.phone);
      setSrvMunicipality(activeCustomer.municipality);
      setSrvAddress(activeCustomer.detailed_address);
    }
  }, [activeCustomer]);

  // Calculate final discounted price for a product
  const getProductPricing = (product: EcommerceProduct) => {
    const original = product.selling_price_npr;
    let discount = 0;
    if (product.discount_type === 'Percentage' && product.discount_value > 0) {
      discount = Math.round((original * product.discount_value) / 100);
    } else if (product.discount_type === 'Fixed_Amount' && product.discount_value > 0) {
      discount = product.discount_value;
    }
    const finalPrice = Math.max(0, original - discount);
    return { original, discount, finalPrice };
  };

  // Filtered products list (only active products displayed on frontend)
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      if (!item.is_active) return false;
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.product_name.toLowerCase().includes(query);
        const matchesBrand = item.brand?.toLowerCase().includes(query) || false;
        const matchesDesc = item.description?.toLowerCase().includes(query) || false;
        const matchesCat = item.category.toLowerCase().includes(query);
        if (!matchesName && !matchesBrand && !matchesDesc && !matchesCat) return false;
      }
      if (quickFilter === 'discounted') {
        const { discount } = getProductPricing(item);
        if (discount <= 0) return false;
      } else if (quickFilter === 'featured') {
        if (!item.featured) return false;
      } else if (quickFilter === 'in_stock') {
        if (item.stock_count <= 0) return false;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery, quickFilter]);

  // Cart operations
  const addToCart = (product: EcommerceProduct, quantity = 1) => {
    if (product.stock_count <= 0) {
      onToast('Sorry, this product is currently out of stock.', 'error');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.product.product_id === product.product_id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stock_count);
        return prev.map((i) =>
          i.product.product_id === product.product_id ? { ...i, quantity: newQty } : i
        );
      } else {
        return [...prev, { product, quantity: Math.min(quantity, product.stock_count) }];
      }
    });
    onToast(`Added "${product.product_name}" to your cart.`, 'success');
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.product_id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return { ...item, quantity: Math.min(newQty, item.product.stock_count) };
          }
          return item;
        })
        .filter(Boolean) as { product: EcommerceProduct; quantity: number }[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.product_id !== productId));
  };

  const totalCartItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  const cartCalculations = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    cart.forEach(({ product, quantity }) => {
      const { original, discount } = getProductPricing(product);
      subtotal += original * quantity;
      totalDiscount += discount * quantity;
    });
    const deliveryFee = checkoutMunicipality === 'Suryodaya Municipality' ? 0 : 100;
    const finalTotal = Math.max(0, subtotal - totalDiscount + deliveryFee);
    return { subtotal, totalDiscount, deliveryFee, finalTotal };
  }, [cart, checkoutMunicipality]);

  // Handle Checkout Action
  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      onToast('Your cart is empty!', 'error');
      return;
    }
    if (!activeCustomer) {
      setIsCartOpen(false);
      setAuthMode('login');
      setIsAuthModalOpen(true);
      onToast('Please log in or register your customer account to place an order.', 'info');
      return;
    }
    setIsCartOpen(false);
    setCheckoutStep(1);
    setPlacedOrderSuccess(null);
    setIsCheckoutOpen(true);
  };

  // Submit Order Logic with Strict Geographic & Payment Validation
  const handleSubmitOrder = () => {
    if (!activeCustomer) {
      onToast('Please log in to place an order.', 'error');
      return;
    }

    // 1. Geographic Validation
    if (!PERMITTED_MUNICIPALITIES.includes(checkoutMunicipality)) {
      onToast('Error: Service outside operational boundaries (Suryodaya, Rong, & Ilam only).', 'error');
      return;
    }

    if (!checkoutAddress.trim()) {
      onToast('Please enter your detailed delivery address / landmark.', 'error');
      return;
    }

    if (!checkoutPhone.trim()) {
      onToast('Please provide a valid contact phone number for delivery confirmation.', 'error');
      return;
    }

    // 2. Payment Specific Validation
    if (checkoutPaymentMethod === 'ESEWA') {
      if (!gatewayRefToken.trim()) {
        onToast('Please enter the eSewa transaction reference token.', 'error');
        return;
      }
      if (!paymentScreenshotFile) {
        onToast('Payment slip or screenshot proof is mandatory for eSewa payment verification.', 'error');
        return;
      }
    }
    if (checkoutPaymentMethod === 'RBB_TRANSFER') {
      if (!rbbVoucherUrl.trim()) {
        onToast('Please enter the Rastriya Banijya Bank deposit/transfer voucher reference.', 'error');
        return;
      }
      if (!paymentScreenshotFile) {
        onToast('Bank deposit slip or mobile banking screenshot proof is mandatory for RBB payment verification.', 'error');
        return;
      }
    }
    if (checkoutPaymentMethod === 'COOP_QR') {
      if (!coopTxnId.trim()) {
        onToast('Please enter the Sahakari/Cooperative QR transaction ID.', 'error');
        return;
      }
      if (!paymentScreenshotFile) {
        onToast('Payment slip or screenshot proof is mandatory for Sahakari cooperative QR payments.', 'error');
        return;
      }
    }
    if (checkoutPaymentMethod === 'INSTITUTIONAL_CREDIT') {
      if (!orgName.trim() || !orgPan.trim() || !orgAddress.trim()) {
        onToast('Institutional orders require Organization Name, Address, and 9-digit PAN.', 'error');
        return;
      }
      if (!/^\d{9}$/.test(orgPan.trim())) {
        onToast('PAN must be exactly 9 digits numeric.', 'error');
        return;
      }
      if (hasOldId && !oldCustomerId.trim()) {
        onToast('Please enter your Old Customer ID / Previous Account Number.', 'error');
        return;
      }
    }

    // 3. Construct Order Items
    const orderItems: EcommerceOrderItem[] = cart.map(({ product, quantity }) => {
      const { original, discount, finalPrice } = getProductPricing(product);
      return {
        product_id: product.product_id,
        product_name: product.product_name,
        quantity,
        unit_price_npr: original,
        discount_amount_npr: discount,
        final_price_npr: finalPrice,
        image_url: product.image_url,
        category: product.category
      };
    });

    const bsDateClean = getCurrentBsDate().replace(/[^0-9]/g, '');
    const seqNum = String((orders?.length || 0) + 1).padStart(3, '0');
    const newOrderId = `RTSS-ECOM-${bsDateClean}${seqNum}`;
    const initialState = checkoutPaymentMethod === 'COD' ? 'Processing/Packing' : 'Pending Verification';

    const newOrder: EcommerceOrder = {
      order_id: newOrderId,
      user_id: activeCustomer.customer_id,
      customer_name: activeCustomer.name,
      customer_phone: checkoutPhone,
      customer_email: activeCustomer.email,
      municipality: checkoutMunicipality,
      ward: checkoutWard,
      delivery_address: checkoutAddress,
      items: orderItems,
      subtotal_npr: cartCalculations.subtotal,
      discount_npr: cartCalculations.totalDiscount,
      delivery_charge_npr: cartCalculations.deliveryFee,
      total_amount_npr: cartCalculations.finalTotal,
      payment_method: checkoutPaymentMethod,
      order_state: initialState,
      gateway_ref_token: gatewayRefToken.trim() || undefined,
      rbb_voucher_url: rbbVoucherUrl.trim() || undefined,
      coop_txn_id: coopTxnId.trim() || undefined,
      payment_screenshot_url: paymentScreenshotFile || (rbbVoucherUrl.startsWith('data:image') || rbbVoucherUrl.startsWith('http') ? rbbVoucherUrl.trim() : undefined),
      organization_name: checkoutPaymentMethod === 'INSTITUTIONAL_CREDIT' ? orgName.trim() : undefined,
      organization_pan: checkoutPaymentMethod === 'INSTITUTIONAL_CREDIT' ? orgPan.trim() : undefined,
      organization_address: checkoutPaymentMethod === 'INSTITUTIONAL_CREDIT' ? orgAddress.trim() : undefined,
      has_old_id: checkoutPaymentMethod === 'INSTITUTIONAL_CREDIT' ? hasOldId : undefined,
      old_customer_id: checkoutPaymentMethod === 'INSTITUTIONAL_CREDIT' && hasOldId ? oldCustomerId.trim() : undefined,
      purchase_order_document_url: poDocUrl.trim() || undefined,
      order_notes: checkoutNotes.trim() || undefined,
      created_at: new Date().toISOString().split('T')[0]
    };

    onCreateOrder(newOrder);
    setPlacedOrderSuccess(newOrder);
    setCart([]);
    onToast(`🎉 Order #${newOrderId} placed successfully!`, 'success');
  };

  // Submit Service Ticket
  const handleSubmitServiceTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer) {
      onToast('Please log in to book a service ticket or custom order.', 'error');
      setIsAuthModalOpen(true);
      return;
    }
    if (!PERMITTED_MUNICIPALITIES.includes(srvMunicipality)) {
      onToast('Service & dispatch requests are only available in Suryodaya, Rong, and Ilam Municipalities.', 'error');
      return;
    }

    let finalHwType = srvHardwareType;
    let formattedProblemDescription = srvProblem.trim();
    let estimatedCost = 1500;

    if (srvCategory === 'flex') {
      if (!flexOrgName.trim()) {
        onToast('Please provide the Organization Name for the flex banner.', 'error');
        return;
      }
      if (!flexProgramName.trim()) {
        onToast('Please provide the Program / Event Name for the banner.', 'error');
        return;
      }
      const actualSize = flexSize === 'Custom' ? (flexCustomSize.trim() || 'Custom Size') : flexSize;
      finalHwType = 'Flex Banner Printing';
      estimatedCost = 800;
      formattedProblemDescription = [
        `[FLEX BANNER PRINTING SPECIFICATIONS]`,
        `• Flex Banner Size: ${actualSize}`,
        `• Organization Name: ${flexOrgName.trim()}`,
        `• Address / Location: ${flexAddress.trim() || srvAddress.trim()}`,
        `• Program / Event Name: ${flexProgramName.trim()}`,
        `• Program Date (From - To): ${flexDateFrom || 'N/A'} to ${flexDateTo || 'N/A'}`,
        `• Special Requirements: ${flexRequirements.trim() || 'High-res flex with metal eyelets'}`
      ].join('\n');
    } else if (srvCategory === 'stamp') {
      if (!stampOrgName.trim()) {
        onToast('Please provide the Organization Name for the official stamp.', 'error');
        return;
      }
      finalHwType = 'Official Stamp Creation';
      estimatedCost = 1200;
      formattedProblemDescription = [
        `[OFFICIAL RUBBER / SELF-INK STAMP SPECIFICATIONS]`,
        `• Stamp Shape: ${stampShape}`,
        `• Organization Name: ${stampOrgName.trim()}`,
        `• Address: ${stampAddress.trim() || srvAddress.trim()}`,
        `• Estd. Date (स्थापना मिति): ${stampEstdDate.trim() || 'N/A'}`,
        `• Logo / Sketch Upload: ${stampImagePreview ? 'Custom logo/image attached' : 'Standard Emblem/Text only'}`,
        `• Special Requirements: ${stampRequirements.trim() || 'Official quality ink & durable mount'}`
      ].join('\n');
    } else {
      // Standard Hardware
      if (srvIsCustomHardware && !srvCustomHardwareName.trim()) {
        onToast('Please type your custom hardware or equipment name.', 'error');
        return;
      }
      if (!srvProblem.trim()) {
        onToast('Please describe the problem with your device/system.', 'error');
        return;
      }
      finalHwType = srvIsCustomHardware ? srvCustomHardwareName.trim() : srvHardwareType;
      estimatedCost = finalHwType.toLowerCase().includes('cctv') ? 3500 : 1500;
    }

    const newTicketId = `RTSS-SRV-${Date.now().toString().slice(-4)}`;
    const newTicket: EcommerceServiceTicket = {
      ticket_id: newTicketId,
      customer_id: activeCustomer.customer_id,
      customer_name: srvCustomerName.trim() || activeCustomer.name,
      customer_phone: srvPhone.trim() || activeCustomer.phone,
      alt_phone: srvAltPhone.trim() || undefined,
      customer_address: srvAddress.trim() || activeCustomer.detailed_address,
      hardware_type: finalHwType,
      is_custom_hardware: srvCategory === 'hardware' ? srvIsCustomHardware : false,
      custom_hardware_name: srvCategory === 'hardware' && srvIsCustomHardware ? srvCustomHardwareName.trim() : undefined,
      service_type: srvServiceType,
      target_municipality: srvMunicipality,
      specific_area: srvSpecificArea.trim() || undefined,
      landmark: srvLandmark.trim() || undefined,
      problem_description: formattedProblemDescription,
      assigned_technician: 'Arpan Khadka',
      ticket_status: 'Site-Survey Scheduled',
      estimated_cost_npr: estimatedCost,
      created_at: new Date().toISOString().split('T')[0],
      preferred_date: srvPreferredDate || undefined
    };

    onCreateServiceTicket(newTicket);
    setIsServiceModalOpen(false);
    setSrvProblem('');
    setFlexProgramName('');
    setFlexRequirements('');
    setStampRequirements('');
    onToast(`🛠️ Service Ticket #${newTicketId} registered! Our team will contact you promptly.`, 'success');
  };

  // Customer Login Handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const found = customerAccounts.find(
      (c) =>
        (c.phone === loginIdentifier.trim() || c.email.toLowerCase() === loginIdentifier.trim().toLowerCase()) &&
        c.password === loginPassword
    );
    if (found) {
      onCustomerLogin(found);
      setIsAuthModalOpen(false);
      setLoginIdentifier('');
      setLoginPassword('');
      onToast(`Welcome back, ${found.name}!`, 'success');
    } else {
      setLoginError('Invalid phone/email or password. Please try again.');
    }
  };

  // Customer Register Handler
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regName.trim() || !regPhone.trim() || !regPassword.trim() || !regAddress.trim()) {
      setRegError('Please fill in all mandatory fields.');
      return;
    }
    const isCorp = regCategory !== 'Individual' || regIsInstitutional;
    if (isCorp) {
      if (!regOrgName.trim() || !regOrgPan.trim()) {
        setRegError('Corporate / Institutional accounts require Organization Name and 9-digit PAN.');
        return;
      }
      if (!/^\d{9}$/.test(regOrgPan.trim())) {
        setRegError('PAN number must be exactly 9 digits numeric.');
        return;
      }
    }
    const existing = customerAccounts.find(
      (c) => c.phone === regPhone.trim() || (regEmail && c.email.toLowerCase() === regEmail.trim().toLowerCase())
    );
    if (existing) {
      setRegError('An account with this phone number or email already exists.');
      return;
    }

    const newCustomer: CustomerAccount = {
      customer_id: `RTSS-CUST-${Date.now().toString().slice(-4)}`,
      name: regName.trim(),
      phone: regPhone.trim(),
      alt_phone: regAltPhone.trim() || undefined,
      email: regEmail.trim() || `${regPhone.trim()}@reliabletech.com.np`,
      password: regPassword,
      account_category: regCategory,
      designation: regDesignation.trim() || undefined,
      municipality: regMunicipality,
      ward: regWard,
      tole_area: regToleArea.trim() || undefined,
      landmark: regLandmark.trim() || undefined,
      detailed_address: regAddress.trim(),
      is_institutional: isCorp,
      organization_name: isCorp ? regOrgName.trim() : undefined,
      organization_pan: isCorp ? regOrgPan.trim() : undefined,
      preferred_language: regPreferredLanguage,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Active'
    };

    onCustomerRegister(newCustomer);
    onCustomerLogin(newCustomer);
    setIsAuthModalOpen(false);
    setRegName('');
    setRegPhone('');
    setRegAltPhone('');
    setRegEmail('');
    setRegPassword('');
    setRegAddress('');
    setRegLandmark('');
    setRegOrgName('');
    setRegOrgPan('');
    setRegDesignation('');
    onToast(`Welcome to RTSS, ${newCustomer.name}! Your account is ready.`, 'success');
  };

  // Customer's own orders & tickets
  const myOrders = useMemo(() => {
    if (!activeCustomer) return [];
    return orders.filter((o) => o.user_id === activeCustomer.customer_id);
  }, [orders, activeCustomer]);

  const myTickets = useMemo(() => {
    if (!activeCustomer) return [];
    return serviceTickets.filter((t) => t.customer_id === activeCustomer.customer_id);
  }, [serviceTickets, activeCustomer]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 text-white text-xs py-2 px-4 border-b border-sky-800/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse">
              {lang === 'NEP' ? 'आधिकारिक स्टोर' : 'Official Store'}
            </span>
            <span className="text-sky-200">
              {lang === 'NEP'
                ? 'रिलायबलटेक सर्भिसेज एण्ड सप्लायर्स • सूर्योदय, रोङ र इलाम नगरपालिका क्षेत्रमा द्रुत डेलिभरी'
                : 'ReliableTech Services & Suppliers • Fast Delivery across Suryodaya, Rong, & Ilam Municipalities'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-300 text-xs">
            {/* Language Toggle Switcher */}
            <div className="flex items-center bg-slate-900/90 border border-slate-700 rounded-lg p-0.5 shadow-2xs">
              <button
                onClick={() => setLang('ENG')}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition ${
                  lang === 'ENG'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Switch to English"
              >
                ENG
              </button>
              <button
                onClick={() => setLang('NEP')}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition ${
                  lang === 'NEP'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="नेपाली भाषामा हेर्नुहोस्"
              >
                नेपाली
              </button>
            </div>

            <span className="text-slate-700">|</span>

            <div className="flex items-center gap-1">
              <Phone size={13} className="text-emerald-400" />
              <span>{profile.phone || '9852620100'}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1">
              <Clock size={13} className="text-amber-400" />
              <span>{lang === 'NEP' ? 'आइत - शुक्र: ८:०० - १९:००' : 'Sun - Fri: 8:00 AM - 7:00 PM'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN STOREFRONT NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Left: Store Branding */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {profile.logoUrl ? (
                <img
                  src={profile.logoUrl}
                  alt={profile.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs"
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                  <Store size={18} className="sm:w-5 sm:h-5" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm sm:text-lg md:text-xl text-slate-900 tracking-tight font-display line-clamp-1">
                    {profile.name || 'ReliableTech Services & Suppliers'}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:flex items-center gap-1 font-medium">
                  <MapPin size={11} className="text-sky-600" />
                  <span>
                    {lang === 'NEP'
                      ? 'फिक्कल, इलाम • कम्प्युटर, सीसीटीभी तथा स्टेशनरी केन्द्र'
                      : 'Fikkal, Ilam, Nepal • Computer, CCTV & Stationery Center'}
                  </span>
                </p>
              </div>
            </div>

            {/* Middle: Search Box (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder={
                    lang === 'NEP'
                      ? 'A4 पेपर, SSD, Hikvision सीसीटीभी, RAM, प्रिन्टर खोज्नुहोस्...'
                      : 'Search A4 paper, SSDs, Hikvision CCTV, RAM, printers...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100/80 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                />
                <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Right: Desktop Actions */}
            <div className="hidden md:flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Track Order Shortcut Button */}
              <button
                onClick={() => setIsOrderTrackerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer shadow-2xs"
                title="Track order status, delivery rider & view complete receipt"
                id="header-track-order-button"
              >
                <Truck size={14} className="text-emerald-600" />
                <span>{lang === 'NEP' ? 'अर्डर ट्र्याक' : 'Track Order'}</span>
              </button>

              {/* Technical Service Shortcut */}
              <button
                onClick={() => {
                  setSrvCategory('hardware');
                  setIsServiceModalOpen(true);
                }}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition cursor-pointer"
                title="Book PC repair, CCTV install, Flex banner, Stamp, or printer service"
                id="header-book-service-button"
              >
                <Wrench size={14} className="text-sky-600" />
                <span>{lang === 'NEP' ? 'मर्मत सेवा / फ्लेक्स' : 'Book Service'}</span>
              </button>

              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition cursor-pointer"
                id="store-cart-button"
              >
                <ShoppingCart size={16} />
                <span>{lang === 'NEP' ? 'झोला' : 'Cart'}</span>
                {totalCartItems > 0 && (
                  <span className="bg-emerald-500 text-slate-950 text-[11px] font-black px-1.5 py-0.2 rounded-full shadow-2xs">
                    {totalCartItems}
                  </span>
                )}
              </button>

              {/* Customer Account Button */}
              {activeCustomer ? (
                <div className="relative group">
                  <button
                    onClick={() => setIsCustomerPortalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition cursor-pointer"
                  >
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {activeCustomer.name.charAt(0)}
                    </div>
                    <span className="max-w-[100px] truncate">{activeCustomer.name}</span>
                    <ChevronRight size={12} className="text-slate-400" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
                  id="customer-login-button"
                >
                  <User size={15} />
                  <span>{lang === 'NEP' ? 'ग्राहक लगइन' : 'Customer Login'}</span>
                </button>
              )}

              {/* Staff Portal Login Button */}
              <button
                onClick={onOpenStaffLogin}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-900 bg-gradient-to-r from-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 border border-amber-300 rounded-xl shadow-2xs transition cursor-pointer"
                title="Log into internal RTSS Management Dashboard"
                id="staff-login-portal-button"
              >
                <LogIn size={14} className="text-amber-800" />
                <span>{lang === 'NEP' ? 'कर्मचारी लगइन' : 'Staff Login'}</span>
              </button>
            </div>
          </div>

          {/* Dedicated Clean, Attractive Mobile Action Toolbar */}
          <div className="md:hidden mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-4 gap-1.5 items-center">
            {/* 1. Mobile Track Order */}
            <button
              onClick={() => setIsOrderTrackerOpen(true)}
              className="flex flex-col items-center justify-center py-1.5 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition cursor-pointer text-[10.5px] font-bold shadow-2xs active:scale-95"
              id="mobile-track-order-btn"
            >
              <Truck size={15} className="text-emerald-600 mb-0.5" />
              <span className="truncate leading-tight">{lang === 'NEP' ? 'ट्र्याक' : 'Track'}</span>
            </button>

            {/* 2. Mobile Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex flex-col items-center justify-center py-1.5 px-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition cursor-pointer text-[10.5px] font-bold shadow-2xs active:scale-95"
              id="mobile-cart-btn"
            >
              <ShoppingCart size={15} className="mb-0.5 text-slate-200" />
              <span className="truncate leading-tight">{lang === 'NEP' ? 'झोला' : 'Cart'}</span>
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-slate-950 text-[9.5px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                  {totalCartItems}
                </span>
              )}
            </button>

            {/* 3. Mobile Customer Login / Profile */}
            {activeCustomer ? (
              <button
                onClick={() => setIsCustomerPortalOpen(true)}
                className="flex flex-col items-center justify-center py-1.5 px-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl transition cursor-pointer text-[10.5px] font-bold shadow-2xs active:scale-95"
                id="mobile-customer-portal-btn"
              >
                <div className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center text-[9px] font-bold mb-0.5">
                  {activeCustomer.name.charAt(0)}
                </div>
                <span className="truncate max-w-[65px] leading-tight">{activeCustomer.name.split(' ')[0]}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="flex flex-col items-center justify-center py-1.5 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl transition cursor-pointer text-[10.5px] font-bold shadow-2xs active:scale-95"
                id="mobile-customer-login-btn"
              >
                <User size={15} className="text-slate-600 mb-0.5" />
                <span className="truncate leading-tight">{lang === 'NEP' ? 'ग्राहक' : 'Customer'}</span>
              </button>
            )}

            {/* 4. Mobile Staff Login */}
            <button
              onClick={onOpenStaffLogin}
              className="flex flex-col items-center justify-center py-1.5 px-1 bg-gradient-to-r from-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 text-amber-900 border border-amber-300 rounded-xl transition cursor-pointer text-[10.5px] font-black shadow-2xs active:scale-95"
              id="mobile-staff-login-btn"
            >
              <LogIn size={15} className="text-amber-800 mb-0.5" />
              <span className="truncate leading-tight">{lang === 'NEP' ? 'स्टाफ' : 'Staff'}</span>
            </button>
          </div>

          {/* Mobile Search Bar */}
          <div className="mt-2 md:hidden">
            <div className="relative w-full">
              <input
                type="text"
                placeholder={
                  lang === 'NEP'
                    ? 'इलाम स्टोरमा सामान तथा पार्टस् खोज्नुहोस्...'
                    : 'Search products & parts in Ilam store...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
              <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 3. HERO / STORE HIGHLIGHTS & RADIUS PROMISE - ONLY SHOWN WHEN SEARCH IS EMPTY */}
      {searchQuery.trim() === '' ? (
        <section className="bg-gradient-to-b from-sky-50 via-slate-50 to-slate-100/60 border-b border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Headline & High-Impact First Time in Ilam Badge */}
              <div className="lg:col-span-8 space-y-3">
                {/* Special Highlight: First Time in Ilam District */}
                <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-emerald-500/10 border border-amber-300/80 text-slate-900 rounded-full text-xs font-bold shadow-xs">
                  <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded-full tracking-wider shadow-2xs">
                    {lang === 'NEP' ? 'इलाममा पहिलो पटक' : 'FIRST TIME IN ILAM'}
                  </span>
                  <Sparkles size={14} className="text-amber-600 shrink-0" />
                  <span className="font-extrabold text-amber-950">
                    {lang === 'NEP'
                      ? 'इलाम जिल्लामै पहिलो पटक, रिलायबलटेकद्वारा अत्याधुनिक ई-कमर्स'
                      : 'First time in Ilam, E-commerce by ReliableTech'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display leading-tight">
                  {lang === 'NEP'
                    ? 'इलाममा स्थानीय डेलिभरी सहित गुणस्तरीय कम्प्युटर हार्डवेयर, सीसीटीभी र कार्यालय स्टेशनरी'
                    : 'Quality Computer Hardware, CCTV & Office Stationery with Local Dispatch in Ilam'}
                </h1>
                <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                  {lang === 'NEP'
                    ? 'फिक्कल बजारबाट प्रत्यक्ष खरिद। क्यास अन डेलिभरी, सहकारी क्युआर र चिया बगान, विद्यालय तथा पालिकाका लागि ३० दिने संस्थागत उधारो।'
                    : 'Direct procurement from Fikkal Bazaar. Instant cash on delivery, cooperative QR, and 30-day corporate credit for tea estates, schools & municipalities.'}
                </p>

                {/* Service Badges & Interactive Quick Launchers */}
                <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-700">
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                    <Truck size={14} className="text-sky-600" />
                    <span>
                      {lang === 'NEP'
                        ? 'सेवा क्षेत्र (सूर्योदय, रोङ, इलाम)'
                        : 'Service Area (Suryodaya, Rong, Ilam)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>
                      {lang === 'NEP' ? '१००% सक्कली ब्रान्ड र वारेन्टी' : '100% Genuine Brands & Warranty'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                    <Building2 size={14} className="text-indigo-600" />
                    <span>
                      {lang === 'NEP'
                        ? 'संस्थागत उधारो र भ्याट/प्यान बिलिङ'
                        : 'Institutional Credit & VAT/PAN Invoicing'}
                    </span>
                  </div>
                  
                  {/* Quick direct chat trigger in hero */}
                  <button
                    onClick={() => {
                      const chatToggleBtn = document.getElementById('rtss-chat-toggle-btn');
                      if (chatToggleBtn) chatToggleBtn.click();
                    }}
                    className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg shadow-xs transition font-bold cursor-pointer"
                  >
                    <Headphones size={14} />
                    <span>{lang === 'NEP' ? 'प्रत्यक्ष काउन्टर च्याट' : 'Direct Counter Connect'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Service Banner Card */}
              <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-sky-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-sky-50 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                    <Wrench size={13} className="text-sky-600" />
                    <span>{lang === 'NEP' ? 'प्राविधिक तथा छपाई सेवा' : 'Technical & Custom Desk'}</span>
                  </span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">
                  {lang === 'NEP'
                    ? 'मर्मत, फ्लेक्स ब्यानर वा छाप बनाउनु पर्यो?'
                    : 'PC Repair, Flex Banner or Official Stamp?'}
                </h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  {lang === 'NEP'
                    ? 'कम्प्युटर मर्मत, फ्लेक्स ब्यानर डिजाइन, तथा सरकारी/निजी छाप सिधै अनलाइन अर्डर गर्नुहोस्।'
                    : 'Book PC/CCTV repair, order custom Flex Banners with program dates, or order official stamps online.'}
                </p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    onClick={() => {
                      setSrvCategory('hardware');
                      setIsServiceModalOpen(true);
                    }}
                    className="p-2 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl text-center transition cursor-pointer"
                  >
                    <Wrench size={14} className="mx-auto text-sky-600 mb-1" />
                    <span className="text-[10px] font-bold text-slate-700 block">Repair</span>
                  </button>
                  <button
                    onClick={() => {
                      setSrvCategory('flex');
                      setIsServiceModalOpen(true);
                    }}
                    className="p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-center transition cursor-pointer"
                  >
                    <Layers size={14} className="mx-auto text-indigo-600 mb-1" />
                    <span className="text-[10px] font-bold text-slate-700 block">Flex</span>
                  </button>
                  <button
                    onClick={() => {
                      setSrvCategory('stamp');
                      setIsServiceModalOpen(true);
                    }}
                    className="p-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-center transition cursor-pointer"
                  >
                    <StampIcon size={14} className="mx-auto text-emerald-600 mb-1" />
                    <span className="text-[10px] font-bold text-slate-700 block">Stamp</span>
                  </button>
                </div>
                <button
                  onClick={() => setIsServiceModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Wrench size={14} />
                  <span>{lang === 'NEP' ? 'सेवा तथा अर्डर फारम खोल्नुहोस्' : 'Open Service & Order Form'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* SEARCH ACTIVE HEADER BAR */
        <div className="bg-sky-50 border-b border-sky-200 py-3.5 px-4 sm:px-6 lg:px-8 animate-fade-in">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <Search size={15} className="text-sky-600 shrink-0" />
              <span className="text-slate-700">
                {lang === 'NEP' ? 'खोजी परिणाम:' : 'Search results for:'}{' '}
                <strong className="text-slate-900 font-bold">&quot;{searchQuery}&quot;</strong>
              </span>
              <span className="bg-sky-200 text-sky-900 font-bold text-[11px] px-2 py-0.5 rounded-full ml-1">
                {filteredProducts.length} {lang === 'NEP' ? 'सामान फेला पर्यो' : 'items found'}
              </span>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900 bg-white border border-sky-300 px-3 py-1 rounded-lg shadow-2xs transition cursor-pointer"
            >
              <X size={13} />
              <span>{lang === 'NEP' ? 'खोजी रद्द गर्नुहोस्' : 'Clear Search'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. PRODUCT CATALOG CONTROLS & FILTER TABS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Category Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-2">
            {(['All', 'Stationery', 'Computer Parts', 'CCTV & Security'] as const).map((cat) => {
              const count =
                cat === 'All'
                  ? products.filter((p) => p.is_active).length
                  : products.filter((p) => p.is_active && p.category === cat).length;
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      isActive ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs font-medium text-slate-600">
            <button
              onClick={() => setQuickFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                quickFilter === 'all' ? 'bg-slate-900 text-white font-bold' : 'hover:text-slate-900'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setQuickFilter('featured')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                quickFilter === 'featured' ? 'bg-sky-600 text-white font-bold' : 'hover:text-slate-900'
              }`}
            >
              ⭐ Featured
            </button>
            <button
              onClick={() => setQuickFilter('discounted')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                quickFilter === 'discounted' ? 'bg-emerald-600 text-white font-bold' : 'hover:text-slate-900'
              }`}
            >
              🏷️ On Sale
            </button>
            <button
              onClick={() => setQuickFilter('in_stock')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                quickFilter === 'in_stock' ? 'bg-indigo-600 text-white font-bold' : 'hover:text-slate-900'
              }`}
            >
              📦 In Stock
            </button>
          </div>
        </div>

        {/* 5. PRODUCT GRID */}
        <div className="mt-8">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <Package size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-800">No products found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                We couldn&apos;t find any active items matching your search or category filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setQuickFilter('all');
                }}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-3.5">
              {filteredProducts.map((product) => {
                const { original, discount, finalPrice } = getProductPricing(product);
                const hasDiscount = discount > 0;
                const inCart = cart.find((i) => i.product.product_id === product.product_id);

                return (
                  <div
                    key={product.product_id}
                    className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group"
                    id={`product-card-${product.product_id}`}
                  >
                    {/* Compact Product Image Stage */}
                    <div
                      className="relative h-28 sm:h-32 bg-slate-50 overflow-hidden cursor-pointer flex items-center justify-center p-1.5"
                      onClick={() => setSelectedProductForModal(product)}
                    >
                      <img
                        src={product.image_url}
                        alt={product.product_name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Category Badge */}
                      <span className="absolute top-1.5 left-1.5 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.2 rounded-sm uppercase tracking-wider">
                        {product.category.split(' ')[0]}
                      </span>

                      {/* Discount Badge */}
                      {hasDiscount && (
                        <span className="absolute top-1.5 right-1.5 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-sm shadow-2xs">
                          {product.discount_type === 'Percentage'
                            ? `-${product.discount_value}%`
                            : `Save ${product.discount_value}`}
                        </span>
                      )}

                      {/* Stock Status Badge */}
                      <div className="absolute bottom-1.5 left-1.5">
                        {product.stock_count > 5 ? (
                          <span className="bg-emerald-50/90 text-emerald-800 text-[8.5px] font-bold px-1 py-0.2 rounded-sm border border-emerald-200 backdrop-blur-xs">
                            In Stock
                          </span>
                        ) : product.stock_count > 0 ? (
                          <span className="bg-amber-50/90 text-amber-800 text-[8.5px] font-bold px-1 py-0.2 rounded-sm border border-amber-200 backdrop-blur-xs">
                            {product.stock_count} left
                          </span>
                        ) : (
                          <span className="bg-rose-50/90 text-rose-800 text-[8.5px] font-bold px-1 py-0.2 rounded-sm border border-rose-200 backdrop-blur-xs">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        {product.brand && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-sky-700 block">
                            {product.brand}
                          </span>
                        )}
                        <h4
                          onClick={() => setSelectedProductForModal(product)}
                          className="font-bold text-slate-900 text-xs hover:text-sky-600 transition cursor-pointer line-clamp-2 leading-tight min-h-[2rem]"
                          title={product.product_name}
                        >
                          {product.product_name}
                        </h4>
                      </div>

                      {/* Price & Action Row */}
                      <div className="pt-1.5 border-t border-slate-100 flex flex-col gap-1.5">
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                            NPR {finalPrice.toLocaleString()}
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] text-slate-400 line-through">
                              {original.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Add to Cart / Stepper */}
                        {product.stock_count > 0 ? (
                          inCart ? (
                            <div className="flex items-center justify-between bg-sky-50 border border-sky-300 rounded-lg p-0.5 w-full">
                              <button
                                onClick={() => updateCartQty(product.product_id, -1)}
                                className="w-5 h-5 rounded-sm bg-white text-slate-700 hover:bg-sky-100 flex items-center justify-center transition cursor-pointer shadow-2xs"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="text-xs font-black text-sky-900 px-1">
                                {inCart.quantity}
                              </span>
                              <button
                                onClick={() => updateCartQty(product.product_id, 1)}
                                className="w-5 h-5 rounded-sm bg-white text-slate-700 hover:bg-sky-100 flex items-center justify-center transition cursor-pointer shadow-2xs"
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(product, 1)}
                              className="w-full py-1 px-2 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                              id={`add-to-cart-${product.product_id}`}
                            >
                              <ShoppingCart size={11} />
                              <span>Add</span>
                            </button>
                          )
                        ) : (
                          <button
                            disabled
                            className="w-full py-1 px-2 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-lg cursor-not-allowed text-center"
                          >
                            Sold Out
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* 6. MUNICIPALITY LOGISTICS NOTICE FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-10 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Quick Links / Staff Login */}
            <div className="space-y-2">
              <span className="font-bold text-slate-100 text-xs uppercase tracking-wider block">
                🏢 System Administration
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Staff and directors can log in to manage inventory, sales ledger, and fulfill dispatch orders.
              </p>
              <button
                onClick={onOpenStaffLogin}
                className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                <LogIn size={13} />
                <span>Open Staff Portal</span>
              </button>
            </div>

            {/* Operational Boundary */}
            <div className="space-y-2">
              <span className="font-bold text-slate-100 text-xs uppercase tracking-wider block">
                🚚 Service Area &amp; Delivery Boundary
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Suryodaya Municipality</strong>: All Area (Fikkal, Harkatte, Kanyam, Pashupatinagar, Shree Antu, etc.)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Rong Municipality</strong>: Highway Corridor from Harkatte to Jor Kalas (Kolbong, Kutidanda, Hanspokhari)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Ilam Municipality</strong>: Corridor from Fikkal to Mai Khola &amp; Ilam Bazaar (Golakharka, Singfrin)</span>
                </li>
              </ul>
            </div>

            {/* Payment Methods */}
            <div className="space-y-2">
              <span className="font-bold text-slate-100 text-xs uppercase tracking-wider block">
                💳 Accepted Payment
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cash on Delivery (COD), eSewa QR Digital Gateway, Rastriya Banijya Bank (RBB) Transfer, Sahakari / Cooperative QR, and 30-Day Institutional Credit.
              </p>
            </div>

            {/* At last right side: ReliableTech Info & Our Team Button */}
            <div className="space-y-2">
              <span className="font-extrabold text-slate-100 text-sm tracking-tight block">
                {profile.name || 'ReliableTech'}
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                The premier IT hardware, CCTV surveillance, and office stationery supplier in Fikkal, Ilam, serving educational institutions, tea factories, and individuals.
              </p>
              <div className="text-[11px] text-slate-400 font-mono font-semibold">
                PAN: {profile.panNumber || '609874512'}
              </div>
              <div className="pt-1.5">
                <button
                  type="button"
                  onClick={() => setIsDeveloperInfoOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 hover:text-sky-300 border border-sky-500/30 text-xs font-bold transition cursor-pointer shadow-xs"
                  id="our-team-footer-btn"
                  title="Click to view Our Team and System Architecture & Credits"
                >
                  <Users size={14} className="text-sky-400" />
                  <span>Our Team</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">
                All rights reserved, Reliabletech Services and suppliers
              </span>
              <button
                onClick={() => setIsDeveloperInfoOpen(true)}
                className="w-5 h-5 rounded-full bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 border border-sky-400/40 font-serif italic font-bold text-xs flex items-center justify-center transition cursor-pointer shadow-2xs"
                title="Software Designer & Developer Credits"
                id="developer-info-footer-btn"
              >
                i
              </button>
            </div>
            <span className="text-[11px] text-slate-500">Fikkal-10, Suryodaya, Ilam, Koshi Province, Nepal</span>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 7. SLIDE-OVER CART DRAWER */}
      {/* ========================================================================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[9999] overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-sky-600" />
                <h3 className="font-extrabold text-base text-slate-900">Your Shopping Cart</h3>
                <span className="bg-sky-100 text-sky-800 text-xs font-black px-2 py-0.5 rounded-full">
                  {totalCartItems} items
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <ShoppingCart size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Your cart is empty</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Browse our stationery, computer parts, and CCTV security kits to add items.
                  </p>
                </div>
              ) : (
                cart.map(({ product, quantity }) => {
                  const { original, discount, finalPrice } = getProductPricing(product);
                  return (
                    <div
                      key={product.product_id}
                      className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex gap-3 items-center"
                    >
                      <img
                        src={product.image_url}
                        alt={product.product_name}
                        className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0 bg-white"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-xs text-slate-900 truncate">
                          {product.product_name}
                        </h5>
                        <div className="text-xs text-slate-600 mt-0.5">
                          <span className="font-bold text-slate-900">
                            NPR {finalPrice.toLocaleString()}
                          </span>
                          {discount > 0 && (
                            <span className="text-[10px] text-slate-400 line-through ml-1.5">
                              NPR {original.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                            <button
                              onClick={() => updateCartQty(product.product_id, -1)}
                              className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="text-xs font-bold px-1.5">{quantity}</span>
                            <button
                              onClick={() => updateCartQty(product.product_id, 1)}
                              className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100"
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(product.product_id)}
                            className="text-[10px] text-rose-600 hover:underline font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-slate-900">
                          NPR {(finalPrice * quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Cart Footer / Checkout Button */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>NPR {cartCalculations.subtotal.toLocaleString()}</span>
                  </div>
                  {cartCalculations.totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Total Savings</span>
                      <span>- NPR {cartCalculations.totalDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Estimated Delivery (Suryodaya)</span>
                    <span className="text-emerald-600 font-bold">Free in Fikkal</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                    <span>Total Amount</span>
                    <span>NPR {cartCalculations.finalTotal.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={handleProceedToCheckout}
                  className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  id="checkout-trigger-button"
                >
                  <CheckCircle2 size={16} />
                  <span>Proceed to Checkout</span>
                </button>

                {!activeCustomer && (
                  <p className="text-[11px] text-center text-slate-500">
                    🔒 Customer account required for delivery tracking &amp; official invoice.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. CUSTOMER AUTH MODAL (LOGIN / MULTI-STEP REGISTER WIZARD) */}
      {/* ========================================================================= */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className={`bg-white w-full ${authMode === 'register' ? 'max-w-2xl my-6' : 'max-w-md'} rounded-2xl shadow-2xl border border-slate-200 overflow-hidden`}>
            {/* Header Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  setAuthMode('login');
                  setLoginError('');
                }}
                className={`flex-1 py-3.5 text-xs font-bold text-center transition border-b-2 cursor-pointer ${
                  authMode === 'login'
                    ? 'border-sky-600 text-sky-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Customer Sign In
              </button>
              <button
                onClick={() => {
                  setAuthMode('register');
                  setRegError('');
                }}
                className={`flex-1 py-3.5 text-xs font-bold text-center transition border-b-2 cursor-pointer ${
                  authMode === 'register'
                    ? 'border-sky-600 text-sky-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Create Account (Step-by-Step)
              </button>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="p-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Stage */}
            {authMode === 'login' ? (
              <div className="p-6">
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">Welcome Back</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Log in with your registered phone number or email address.
                    </p>
                  </div>

                  {loginError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Phone Number or Email</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9842650123 or name@gmail.com"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Password</label>
                      <button
                        type="button"
                        onClick={() => setIsForgotPasswordOpen(true)}
                        className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                  >
                    Sign In &amp; Continue
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-4 sm:p-5 max-h-[82vh] overflow-y-auto">
                <CustomerRegistrationWizard
                  customerAccounts={customerAccounts}
                  onRegisterSuccess={(newCustomer) => {
                    onCustomerRegister(newCustomer);
                    onCustomerLogin(newCustomer);
                    setIsAuthModalOpen(false);
                    onToast(`🎉 Welcome, ${newCustomer.name}! Your RTSS account has been successfully created.`, 'success');
                  }}
                  onCancel={() => {
                    setAuthMode('login');
                  }}
                  onToast={onToast}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. CHECKOUT DESK MODAL */}
      {/* ========================================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-emerald-400" />
                <h3 className="font-bold text-base">RTSS Online Checkout Desk</h3>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Stepper Progress */}
            {!placedOrderSuccess && (
              <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex items-center justify-between text-xs font-bold">
                <div
                  className={`flex items-center gap-1.5 ${
                    checkoutStep >= 1 ? 'text-sky-700' : 'text-slate-400'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Delivery Address</span>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
                <div
                  className={`flex items-center gap-1.5 ${
                    checkoutStep >= 2 ? 'text-sky-700' : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      checkoutStep >= 2 ? 'bg-sky-600 text-white' : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    2
                  </span>
                  <span>Payment Gateway</span>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
                <div
                  className={`flex items-center gap-1.5 ${
                    checkoutStep === 3 ? 'text-sky-700' : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      checkoutStep === 3 ? 'bg-sky-600 text-white' : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    3
                  </span>
                  <span>Final Review</span>
                </div>
              </div>
            )}

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {placedOrderSuccess ? (
                /* SUCCESS STATE */
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 size={36} />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Order Placed Successfully!
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Your Order ID is{' '}
                      <strong className="text-slate-900 font-mono text-sm">
                        {placedOrderSuccess.order_id}
                      </strong>
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs max-w-md mx-auto space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customer:</span>
                      <span className="font-bold text-slate-900">{placedOrderSuccess.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Destination:</span>
                      <span className="font-bold text-slate-900">
                        {placedOrderSuccess.municipality} ({placedOrderSuccess.ward})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Flow:</span>
                      <span className="font-bold text-sky-700">{placedOrderSuccess.payment_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Initial State:</span>
                      <span className="font-bold text-amber-700">{placedOrderSuccess.order_state}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black">
                      <span>Total Amount:</span>
                      <span>NPR {placedOrderSuccess.total_amount_npr.toLocaleString()}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Your official order receipt with complete equipment details and 1-Year Free Maintenance &amp; Technical Support Certificate is ready.
                  </p>

                  <div className="flex flex-col sm:flex-row justify-center items-center gap-2.5 pt-2">
                    <button
                      onClick={() => setReceiptModalOrder(placedOrderSuccess)}
                      className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileText size={15} />
                      <span>View &amp; Print Order Receipt</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsCheckoutOpen(false);
                        setIsOrderTrackerOpen(true);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Truck size={15} className="text-sky-400" />
                      <span>Track Live Delivery</span>
                    </button>
                    <button
                      onClick={() => setIsCheckoutOpen(false)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              ) : checkoutStep === 1 ? (
                /* STEP 1: GEOGRAPHIC VALIDATION & ADDRESS */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        1. Service Area &amp; Delivery Destination in Ilam
                      </h4>
                      <p className="text-xs text-slate-500">
                        ReliableTech serves Suryodaya (all area), Rong &amp; Ilam (highway corridors).
                      </p>
                    </div>

                    {activeCustomer && (
                      <button
                        type="button"
                        onClick={() => {
                          setCheckoutMunicipality(activeCustomer.municipality);
                          setCheckoutWard(activeCustomer.ward || 'Ward 10');
                          setCheckoutAddress(activeCustomer.detailed_address || '');
                          setCheckoutPhone(activeCustomer.phone || '');
                          onToast('✓ Autofilled address from your account profile!', 'success');
                        }}
                        className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-xl border border-sky-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Check size={14} className="text-emerald-600" />
                        <span>Use Saved Profile Location</span>
                      </button>
                    )}
                  </div>

                  {/* Quick Service Area Selector */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      📍 Quick Select Service Zone:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCheckoutMunicipality('Suryodaya Municipality');
                          setCheckoutWard('Ward 10');
                          if (!checkoutAddress) setCheckoutAddress('Fikkal Bazaar, Suryodaya');
                        }}
                        className={`p-2 rounded-lg text-left text-xs transition border cursor-pointer ${
                          checkoutMunicipality === 'Suryodaya Municipality'
                            ? 'bg-sky-100 border-sky-400 font-bold text-sky-950 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="block font-bold">Suryodaya Municipality</span>
                        <span className="text-[10px] text-slate-500 block">All Area (Fikkal, Kanyam, Pashupatinagar, Shree Antu)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCheckoutMunicipality('Rong Municipality');
                          setCheckoutWard('Ward 3');
                          if (!checkoutAddress) setCheckoutAddress('Kolbong Highway Section, Rong');
                        }}
                        className={`p-2 rounded-lg text-left text-xs transition border cursor-pointer ${
                          checkoutMunicipality === 'Rong Municipality'
                            ? 'bg-sky-100 border-sky-400 font-bold text-sky-950 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="block font-bold">Rong Municipality</span>
                        <span className="text-[10px] text-slate-500 block">Harkatte to Jor Kalas Highway (Kolbong, Kutidanda)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCheckoutMunicipality('Ilam Municipality');
                          setCheckoutWard('Ward 7');
                          if (!checkoutAddress) setCheckoutAddress('Ilam Bazaar, Ilam');
                        }}
                        className={`p-2 rounded-lg text-left text-xs transition border cursor-pointer ${
                          checkoutMunicipality === 'Ilam Municipality'
                            ? 'bg-sky-100 border-sky-400 font-bold text-sky-950 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="block font-bold">Ilam Municipality</span>
                        <span className="text-[10px] text-slate-500 block">Fikkal to Mai Khola &amp; Ilam Bazaar (Golakharka, Singfrin)</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Municipality *</label>
                      <select
                        value={checkoutMunicipality}
                        onChange={(e) => setCheckoutMunicipality(e.target.value as PermittedMunicipality)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-semibold"
                      >
                        {PERMITTED_MUNICIPALITIES.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Ward Number *</label>
                      <input
                        type="text"
                        required
                        value={checkoutWard}
                        onChange={(e) => setCheckoutWard(e.target.value)}
                        placeholder="Ward 10"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Street Address, Chowk &amp; Landmarks *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={checkoutAddress}
                      onChange={(e) => setCheckoutAddress(e.target.value)}
                      placeholder="e.g. Fikkal Chowk, near State Bank / High School"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Recipient Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={checkoutPhone}
                      onChange={(e) => setCheckoutPhone(e.target.value)}
                      placeholder="98XXXXXXXX"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Special Delivery Instructions (Optional)
                    </label>
                    <input
                      type="text"
                      value={checkoutNotes}
                      onChange={(e) => setCheckoutNotes(e.target.value)}
                      placeholder="e.g. Call before dispatch, deliver between 1 PM - 4 PM"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (!checkoutAddress.trim() || !checkoutPhone.trim()) {
                          onToast('Please enter your full address and contact number.', 'error');
                          return;
                        }
                        setCheckoutStep(2);
                      }}
                      className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Proceed to Payment</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ) : checkoutStep === 2 ? (
                /* STEP 2: PAYMENT METHOD VALIDATION */
                <div className="space-y-4">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      2. Select Payment Flow
                    </h4>
                    <p className="text-xs text-slate-500">
                      Choose from our 5 supported local settlement methods.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* COD */}
                    <label
                      className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                        checkoutPaymentMethod === 'COD'
                          ? 'border-sky-600 bg-sky-50/60 ring-2 ring-sky-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={checkoutPaymentMethod === 'COD'}
                        onChange={() => setCheckoutPaymentMethod('COD')}
                        className="mt-0.5 text-sky-600"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">
                          💵 Cash on Delivery (COD)
                        </span>
                        <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                          Pay directly upon physical delivery in Ilam. Sets order to &ldquo;Processing/Packing&rdquo;.
                        </span>
                      </div>
                    </label>

                    {/* eSewa */}
                    <label
                      className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                        checkoutPaymentMethod === 'ESEWA'
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={checkoutPaymentMethod === 'ESEWA'}
                        onChange={() => setCheckoutPaymentMethod('ESEWA')}
                        className="mt-0.5 text-emerald-600"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">
                          🟢 eSewa Digital Gateway
                        </span>
                        <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                          Instant mobile transfer to RTSS eSewa ID: <strong>9852620100</strong>.
                        </span>
                      </div>
                    </label>

                    {/* RBB Bank Transfer */}
                    <label
                      className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                        checkoutPaymentMethod === 'RBB_TRANSFER'
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={checkoutPaymentMethod === 'RBB_TRANSFER'}
                        onChange={() => setCheckoutPaymentMethod('RBB_TRANSFER')}
                        className="mt-0.5 text-indigo-600"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">
                          🏛️ Rastriya Banijya Bank (RBB)
                        </span>
                        <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                          Bank deposit / mobile banking transfer. Attach voucher reference.
                        </span>
                      </div>
                    </label>

                    {/* Sahakari QR */}
                    <label
                      className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                        checkoutPaymentMethod === 'COOP_QR'
                          ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={checkoutPaymentMethod === 'COOP_QR'}
                        onChange={() => setCheckoutPaymentMethod('COOP_QR')}
                        className="mt-0.5 text-amber-600"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">
                          🤝 Sahakari / Cooperative QR
                        </span>
                        <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                          Scan local cooperative QR code &amp; submit transaction ID.
                        </span>
                      </div>
                    </label>

                    {/* Institutional Credit */}
                    <label
                      className={`col-span-1 sm:col-span-2 p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                        checkoutPaymentMethod === 'INSTITUTIONAL_CREDIT'
                          ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={checkoutPaymentMethod === 'INSTITUTIONAL_CREDIT'}
                        onChange={() => setCheckoutPaymentMethod('INSTITUTIONAL_CREDIT')}
                        className="mt-0.5 text-purple-600"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">
                          🏢 Institutional 30-Day Credit (Tea Estates, Schools &amp; Municipalities)
                        </span>
                        <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                          Requires 9-digit PAN verification &amp; Purchase Order (PO) document reference.
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Conditional Payment Gateway Proof & QR Code Presentation */}
                  {checkoutPaymentMethod === 'ESEWA' && (
                    <div className="p-4 bg-gradient-to-br from-emerald-50/90 via-emerald-50/50 to-teal-50/80 border border-emerald-300 rounded-2xl space-y-3.5 shadow-xs animate-fade-in">
                      <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="font-extrabold text-xs text-emerald-950">
                            Official eSewa Merchant QR &amp; Gateway
                          </span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full shadow-2xs">
                          Instant Scan
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
                        {/* QR Code Container */}
                        <div
                          className="relative group shrink-0 cursor-pointer text-center"
                          onClick={() =>
                            setZoomedQrData({
                              title: 'eSewa Merchant QR Code',
                              qrUrl: esewaQrCodeUrl,
                              subtext: `${esewaAccountName} • ID: ${esewaId}`,
                              accountNo: esewaId
                            })
                          }
                        >
                          <div className="w-32 h-32 p-1.5 bg-white rounded-xl border-2 border-emerald-400 shadow-sm flex items-center justify-center relative overflow-hidden ring-4 ring-emerald-50">
                            <img
                              src={esewaQrCodeUrl}
                              alt="eSewa QR Code"
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-emerald-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1 rounded-lg">
                              <Maximize2 size={18} />
                              <span>Click to Zoom</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-emerald-700 font-bold block mt-1 hover:underline">
                            🔍 Click to enlarge QR
                          </span>
                        </div>

                        {/* Gateway Details */}
                        <div className="flex-1 min-w-0 space-y-2 text-xs w-full">
                          <div className="flex items-center justify-between border-b border-emerald-100 pb-1.5">
                            <span className="text-slate-500 font-semibold text-[11px]">Pay Total:</span>
                            <span className="font-black text-emerald-700 text-sm">
                              NPR {cartCalculations.finalTotal.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-semibold text-[11px]">Merchant Name:</span>
                            <span className="font-bold text-slate-800 truncate text-[11px]">
                              {esewaAccountName}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-slate-500 font-semibold text-[11px]">eSewa ID:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-emerald-900 text-xs bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-300">
                                {esewaId}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(esewaId, 'esewa')}
                                className="p-1.5 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100 rounded-md transition cursor-pointer border border-emerald-200"
                                title="Copy eSewa ID"
                              >
                                {copiedField === 'esewa' ? (
                                  <Check size={13} className="text-emerald-600 font-bold" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight pt-1">
                            Scan with your eSewa App or transfer to ID <strong>{esewaId}</strong>, then enter your transaction token below.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                          <span>eSewa Transaction Reference Token *</span>
                          <span className="text-[10px] text-emerald-700 font-medium">Found in eSewa payment receipt</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={gatewayRefToken}
                          onChange={(e) => setGatewayRefToken(e.target.value)}
                          placeholder="e.g. ESW-TXN-998241029 or 7-digit txn code"
                          className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-400 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {checkoutPaymentMethod === 'RBB_TRANSFER' && (
                    <div className="p-4 bg-gradient-to-br from-indigo-50/90 via-indigo-50/50 to-blue-50/80 border border-indigo-300 rounded-2xl space-y-3.5 shadow-xs animate-fade-in">
                      <div className="flex items-center justify-between border-b border-indigo-200/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                          <span className="font-extrabold text-xs text-indigo-950">
                            Rastriya Banijya Bank (RBB) Official QR &amp; Deposit
                          </span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-300 px-2 py-0.5 rounded-full shadow-2xs">
                          Fonepay / Mobile Bank
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-indigo-200 shadow-2xs">
                        {/* QR Code Container */}
                        <div
                          className="relative group shrink-0 cursor-pointer text-center"
                          onClick={() =>
                            setZoomedQrData({
                              title: 'Rastriya Banijya Bank (RBB) QR Code',
                              qrUrl: rbbQrCodeUrl,
                              subtext: `${rbbAccountName} • A/C: ${rbbAccountNumber}`,
                              accountNo: rbbAccountNumber
                            })
                          }
                        >
                          <div className="w-32 h-32 p-1.5 bg-white rounded-xl border-2 border-indigo-400 shadow-sm flex items-center justify-center relative overflow-hidden ring-4 ring-indigo-50">
                            <img
                              src={rbbQrCodeUrl}
                              alt="RBB Bank QR Code"
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-indigo-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1 rounded-lg">
                              <Maximize2 size={18} />
                              <span>Click to Zoom</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-indigo-700 font-bold block mt-1 hover:underline">
                            🔍 Click to enlarge QR
                          </span>
                        </div>

                        {/* Gateway Details */}
                        <div className="flex-1 min-w-0 space-y-2 text-xs w-full">
                          <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5">
                            <span className="text-slate-500 font-semibold text-[11px]">Pay Total:</span>
                            <span className="font-black text-indigo-800 text-sm">
                              NPR {cartCalculations.finalTotal.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-semibold text-[11px]">Account Name:</span>
                            <span className="font-bold text-slate-800 truncate text-[11px]">
                              {rbbAccountName}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-slate-500 font-semibold text-[11px]">Account No.:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-indigo-900 text-xs bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-300">
                                {rbbAccountNumber}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(rbbAccountNumber, 'rbb')}
                                className="p-1.5 text-indigo-700 hover:text-indigo-950 hover:bg-indigo-100 rounded-md transition cursor-pointer border border-indigo-200"
                                title="Copy RBB Account Number"
                              >
                                {copiedField === 'rbb' ? (
                                  <Check size={13} className="text-indigo-600 font-bold" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-semibold text-[11px]">Bank Branch:</span>
                            <span className="font-semibold text-slate-700 text-[11px] truncate">
                              {rbbBranch}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                          <span>Bank Voucher No. / Deposit Reference *</span>
                          <span className="text-[10px] text-indigo-700 font-medium">Mobile banking txn or voucher reference</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={rbbVoucherUrl}
                          onChange={(e) => setRbbVoucherUrl(e.target.value)}
                          placeholder="e.g. RBB-DEP-847291 or Mobile Banking Txn ID"
                          className="w-full px-3 py-2 text-xs bg-white border border-indigo-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-400 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {checkoutPaymentMethod === 'COOP_QR' && (
                    <div className="p-4 bg-gradient-to-br from-amber-50/90 via-amber-50/50 to-orange-50/80 border border-amber-300 rounded-2xl space-y-3.5 shadow-xs animate-fade-in">
                      <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-pulse"></span>
                          <span className="font-extrabold text-xs text-amber-950">
                            Sahakari / Cooperative Unified QR
                          </span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full shadow-2xs">
                          Cooperative mBank
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs">
                        {/* QR Code Container */}
                        <div
                          className="relative group shrink-0 cursor-pointer text-center"
                          onClick={() =>
                            setZoomedQrData({
                              title: 'Sahakari Cooperative QR Code',
                              qrUrl: sahakariQrCodeUrl,
                              subtext: `${sahakariName} • A/C: ${sahakariAccountNumber}`,
                              accountNo: sahakariAccountNumber
                            })
                          }
                        >
                          <div className="w-32 h-32 p-1.5 bg-white rounded-xl border-2 border-amber-400 shadow-sm flex items-center justify-center relative overflow-hidden ring-4 ring-amber-50">
                            <img
                              src={sahakariQrCodeUrl}
                              alt="Sahakari QR Code"
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-amber-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1 rounded-lg">
                              <Maximize2 size={18} />
                              <span>Click to Zoom</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-amber-700 font-bold block mt-1 hover:underline">
                            🔍 Click to enlarge QR
                          </span>
                        </div>

                        {/* Gateway Details */}
                        <div className="flex-1 min-w-0 space-y-2 text-xs w-full">
                          <div className="flex items-center justify-between border-b border-amber-100 pb-1.5">
                            <span className="text-slate-500 font-semibold text-[11px]">Pay Total:</span>
                            <span className="font-black text-amber-800 text-sm">
                              NPR {cartCalculations.finalTotal.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-semibold text-[11px]">Cooperative:</span>
                            <span className="font-bold text-slate-800 truncate text-[11px]">
                              {sahakariName}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-semibold text-[11px]">Account Name:</span>
                            <span className="font-semibold text-slate-700 truncate text-[11px]">
                              {sahakariAccountName}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-slate-500 font-semibold text-[11px]">Account No.:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-amber-900 text-xs bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300">
                                {sahakariAccountNumber}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(sahakariAccountNumber, 'sahakari')}
                                className="p-1.5 text-amber-700 hover:text-amber-950 hover:bg-amber-100 rounded-md transition cursor-pointer border border-amber-200"
                                title="Copy Sahakari Account Number"
                              >
                                {copiedField === 'sahakari' ? (
                                  <Check size={13} className="text-amber-600 font-bold" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                          <span>Cooperative App Transaction ID *</span>
                          <span className="text-[10px] text-amber-700 font-medium">Suryodaya Smart / mBank txn ID</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={coopTxnId}
                          onChange={(e) => setCoopTxnId(e.target.value)}
                          placeholder="e.g. COOP-TXN-382910"
                          className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl font-mono focus:ring-2 focus:ring-amber-400 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Screenshot / Slip Upload for Digital Payments */}
                  {checkoutPaymentMethod !== 'COD' && checkoutPaymentMethod !== 'INSTITUTIONAL_CREDIT' && (
                    <div className="p-3.5 bg-gradient-to-r from-slate-50 to-sky-50/50 border border-sky-200 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <QrCode size={14} className="text-sky-600" />
                          <span>Attach Payment Slip / Screenshot Proof <strong className="text-rose-600 font-black">* (Mandatory)</strong></span>
                        </label>
                        {paymentScreenshotFile && (
                          <button
                            type="button"
                            onClick={() => setPaymentScreenshotFile('')}
                            className="text-[10px] text-rose-600 hover:underline font-bold"
                          >
                            Remove / Retake
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Please upload your transaction confirmation slip or screenshot for verification by RTSS counter staff.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          required
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 3.5 * 1024 * 1024) {
                                onToast('Image size exceeds 3.5MB limit', 'error');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (loadEvt) => {
                                setPaymentScreenshotFile(loadEvt.target?.result as string);
                                onToast('Payment screenshot attached successfully!', 'success');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-600 file:text-white hover:file:bg-sky-700 cursor-pointer"
                        />
                        {paymentScreenshotFile ? (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300">
                            <Check size={13} /> Screenshot attached
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                            <AlertCircle size={12} /> Required before placing order
                          </span>
                        )}
                      </div>

                      {paymentScreenshotFile && (
                        <div className="mt-2 relative w-28 h-28 rounded-xl overflow-hidden border-2 border-emerald-400 bg-white shadow-xs">
                          <img
                            src={paymentScreenshotFile}
                            alt="Slip preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {checkoutPaymentMethod === 'INSTITUTIONAL_CREDIT' && (
                    <div className="p-4 bg-purple-50/90 border border-purple-300 rounded-2xl space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-purple-700" />
                          <span className="text-xs font-extrabold text-purple-950">
                            Institutional Credit Verification
                          </span>
                        </div>
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md border border-purple-300">
                          30-Day Billing Cycle
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">Organization Name *</label>
                          <input
                            type="text"
                            required
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            placeholder="e.g. Kanyam Tea Estate / Shree High School"
                            className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">9-Digit PAN Number *</label>
                          <input
                            type="text"
                            maxLength={9}
                            required
                            value={orgPan}
                            onChange={(e) => setOrgPan(e.target.value)}
                            placeholder="302819405"
                            className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-400 outline-none"
                          />
                        </div>
                      </div>

                      {/* Required Address for Institutional Credit */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Organization Full Address * (Required)</label>
                        <input
                          type="text"
                          required
                          value={orgAddress}
                          onChange={(e) => setOrgAddress(e.target.value)}
                          placeholder="e.g. Suryodaya-7, Kanyam, Ilam, Nepal"
                          className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
                        />
                      </div>

                      {/* Has Old ID Checkbox Toggle */}
                      <div className="p-2.5 bg-white rounded-xl border border-purple-200 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={hasOldId}
                            onChange={(e) => setHasOldId(e.target.checked)}
                            className="w-4 h-4 text-purple-600 rounded-md border-purple-300 focus:ring-purple-500"
                          />
                          <span className="text-xs font-bold text-purple-950">
                            Has Old ID / Existing RTSS Customer Account Code
                          </span>
                        </label>

                        {hasOldId && (
                          <div className="pt-1.5 border-t border-purple-100 space-y-1 animate-fade-in">
                            <label className="text-[11px] font-bold text-slate-700">
                              Old Customer ID / Previous Client Code *
                            </label>
                            <input
                              type="text"
                              required={hasOldId}
                              value={oldCustomerId}
                              onChange={(e) => setOldCustomerId(e.target.value)}
                              placeholder="e.g. CUST-2081-089 or RTSS-INST-442"
                              className="w-full px-3 py-2 text-xs bg-purple-50/50 border border-purple-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-400 outline-none"
                            />
                            <p className="text-[10px] text-slate-500">
                              Enables automatic linking to your past credit history and enterprise ledger.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">
                          Purchase Order (PO) Number / Document Reference (Optional)
                        </label>
                        <input
                          type="text"
                          value={poDocUrl}
                          onChange={(e) => setPoDocUrl(e.target.value)}
                          placeholder="e.g. PO-2083-44 or Dispatch Letter Ref"
                          className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep(1)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Back to Address
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckoutStep(3)}
                      className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Review &amp; Place Order</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                /* STEP 3: FINAL REVIEW & SUBMIT */
                <div className="space-y-4">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      3. Confirm &amp; Submit Order
                    </h4>
                    <p className="text-xs text-slate-500">
                      Please verify your items, destination, and payment before placing.
                    </p>
                  </div>

                  {/* Summary Details */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Deliver To:</span>
                      <span className="font-bold text-slate-900">
                        {activeCustomer?.name} &bull; {checkoutPhone}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Address:</span>
                      <span className="font-bold text-slate-900">
                        {checkoutAddress}, {checkoutWard}, {checkoutMunicipality}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment:</span>
                      <span className="font-bold text-sky-700">
                        {checkoutPaymentMethod === 'ESEWA' && '🟢 eSewa Digital Gateway'}
                        {checkoutPaymentMethod === 'RBB_TRANSFER' && '🏛️ Rastriya Banijya Bank (RBB)'}
                        {checkoutPaymentMethod === 'COOP_QR' && '🤝 Sahakari / Cooperative QR'}
                        {checkoutPaymentMethod === 'INSTITUTIONAL_CREDIT' && '🏢 Institutional 30-Day Credit'}
                        {checkoutPaymentMethod === 'COD' && '💵 Cash on Delivery (COD)'}
                      </span>
                    </div>
                  </div>

                  {/* Items Mini List */}
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {cart.map(({ product, quantity }) => {
                      const { finalPrice } = getProductPricing(product);
                      return (
                        <div
                          key={product.product_id}
                          className="flex justify-between items-center text-xs py-1 border-b border-slate-100"
                        >
                          <span className="truncate max-w-[280px]">
                            {quantity}x {product.product_name}
                          </span>
                          <span className="font-bold shrink-0">
                            NPR {(finalPrice * quantity).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Price Totals */}
                  <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span>NPR {cartCalculations.subtotal.toLocaleString()}</span>
                    </div>
                    {cartCalculations.totalDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>Discount</span>
                        <span>- NPR {cartCalculations.totalDiscount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1 border-t border-slate-200">
                      <span>Total Amount</span>
                      <span>NPR {cartCalculations.finalTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep(2)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitOrder}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={14} />
                      <span>Confirm &amp; Place Order</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
          {/* ========================================================================= */}
      {/* 10. BOOK TECHNICAL SERVICE & CUSTOM FABRICATION MODAL (HARDWARE, FLEX, STAMP) */}
      {/* ========================================================================= */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-sky-800 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {srvCategory === 'hardware' && <Wrench size={18} className="text-sky-300" />}
                {srvCategory === 'flex' && <Layers size={18} className="text-indigo-300" />}
                {srvCategory === 'stamp' && <StampIcon size={18} className="text-emerald-300" />}
                <div>
                  <h3 className="font-bold text-base">
                    {srvCategory === 'hardware' && (lang === 'NEP' ? 'कम्प्युटर, सीसीटीभी तथा प्रिन्टर मर्मत' : 'Hardware & CCTV Repair Service')}
                    {srvCategory === 'flex' && (lang === 'NEP' ? 'फ्लेक्स ब्यानर छपाई अर्डर' : 'Custom Flex Banner Printing')}
                    {srvCategory === 'stamp' && (lang === 'NEP' ? 'आधिकारिक रबर / सेल्फ-इङ्क छाप अर्डर' : 'Official Rubber & Self-Ink Stamp Creation')}
                  </h3>
                  <p className="text-[11px] text-sky-200">
                    ReliableTech Fikkal, Ilam • Direct Counter & Dispatch Desk
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Service Category Switcher Tabs */}
            <div className="grid grid-cols-3 p-1.5 bg-slate-100 border-b border-slate-200 gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSrvCategory('hardware')}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  srvCategory === 'hardware'
                    ? 'bg-white text-sky-700 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Wrench size={14} />
                <span>{lang === 'NEP' ? 'मर्मत सेवा' : 'Hardware Repair'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSrvCategory('flex')}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  srvCategory === 'flex'
                    ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Layers size={14} />
                <span>{lang === 'NEP' ? 'फ्लेक्स ब्यानर' : 'Create Flex'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSrvCategory('stamp')}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  srvCategory === 'stamp'
                    ? 'bg-white text-emerald-700 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <StampIcon size={14} />
                <span>{lang === 'NEP' ? 'छाप / स्ट्याम्प' : 'Create Stamp'}</span>
              </button>
            </div>

            <form onSubmit={handleSubmitServiceTicket} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {activeCustomer && (
                <div className="flex items-center justify-between p-2.5 bg-sky-50 border border-sky-200 rounded-xl">
                  <div className="text-xs text-sky-900">
                    Logged in as <strong>{activeCustomer.name}</strong> ({activeCustomer.municipality})
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSrvCustomerName(activeCustomer.name);
                      setSrvPhone(activeCustomer.phone || '');
                      setSrvAddress(activeCustomer.detailed_address || '');
                      setSrvMunicipality(activeCustomer.municipality);
                      if (activeCustomer.organization_name) {
                        setFlexOrgName(activeCustomer.organization_name);
                        setStampOrgName(activeCustomer.organization_name);
                      }
                      onToast('✓ Autofilled profile information!', 'success');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-lg border border-sky-300 transition flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Check size={12} className="text-emerald-600" />
                    <span>Autofill Profile</span>
                  </button>
                </div>
              )}

              {/* 1. HARDWARE REPAIR FORM */}
              {srvCategory === 'hardware' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Hardware / System Type *</label>
                      <select
                        value={srvIsCustomHardware ? 'Custom' : srvHardwareType}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'Custom') {
                            setSrvIsCustomHardware(true);
                          } else {
                            setSrvIsCustomHardware(false);
                            setSrvHardwareType(val);
                          }
                        }}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-semibold"
                      >
                        {hardwareTypes && hardwareTypes.length > 0 ? (
                          hardwareTypes
                            .filter((ht) => ht.isActive || ht.is_active)
                            .map((ht) => (
                              <option key={ht.id || ht.type_id} value={ht.name}>
                                {ht.name} ({ht.estimatedTurnaround || ht.estimated_turnaround || 'Standard'})
                              </option>
                            ))
                        ) : (
                          <>
                            <option value="PC">Desktop PC / Laptop</option>
                            <option value="Printer">Epson/Canon InkTank Printer</option>
                            <option value="CCTV System">CCTV Surveillance Cameras</option>
                            <option value="Networking / Other">LAN / Wi-Fi Networking</option>
                          </>
                        )}
                        <option value="Custom">➕ Custom / Other Hardware (Write in)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Service Mode *</label>
                      <select
                        value={srvServiceType}
                        onChange={(e) => setSrvServiceType(e.target.value as ServiceTicketServiceType)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-semibold"
                      >
                        <option value="Fikkal Shop Drop-off">🏬 Fikkal Shop Drop-off</option>
                        <option value="Technician Home Visit">🛵 Technician On-Site Visit</option>
                      </select>
                    </div>
                  </div>

                  {srvIsCustomHardware && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                      <label className="text-xs font-bold text-amber-900">
                        Specify Your Custom Hardware / Device Name *
                      </label>
                      <input
                        type="text"
                        required={srvIsCustomHardware}
                        value={srvCustomHardwareName}
                        onChange={(e) => setSrvCustomHardwareName(e.target.value)}
                        placeholder="e.g. Hikvision 8-CH DVR with 4TB HDD, Zebra Barcode Printer"
                        className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:outline-hidden"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Issue / Problem Description *</label>
                    <textarea
                      rows={3}
                      required={srvCategory === 'hardware'}
                      value={srvProblem}
                      onChange={(e) => setSrvProblem(e.target.value)}
                      placeholder="Describe the issue (e.g. Laptop overheating/blue screen, Canon printer feeder jammed, Hikvision camera 3 offline)"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Preferred Visit / Drop-off Date</label>
                    <input
                      type="date"
                      value={srvPreferredDate}
                      onChange={(e) => setSrvPreferredDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* 2. CREATE FLEX BANNER FORM */}
              {srvCategory === 'flex' && (
                <div className="space-y-4 animate-fade-in bg-indigo-50/40 p-4 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold border-b border-indigo-200 pb-2">
                    <Layers size={15} className="text-indigo-600" />
                    <span>Flex Banner Specifications &amp; Event Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Size of Flex *</label>
                      <select
                        value={flexSize}
                        onChange={(e) => setFlexSize(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-semibold"
                      >
                        <option value="6x3 ft">6 ft × 3 ft (Standard Welcome Banner)</option>
                        <option value="8x4 ft">8 ft × 4 ft (Medium Stage Backdrop)</option>
                        <option value="10x5 ft">10 ft × 5 ft (Large Event Backdrop)</option>
                        <option value="12x6 ft">12 ft × 6 ft (Auditorium Stage Banner)</option>
                        <option value="4x2 ft">4 ft × 2 ft (Small Gate / Notice Banner)</option>
                        <option value="Custom">Custom Dimensions (Specify in feet)</option>
                      </select>
                    </div>

                    {flexSize === 'Custom' && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-indigo-900">Specify Custom Size (Width × Height) *</label>
                        <input
                          type="text"
                          required={flexSize === 'Custom'}
                          value={flexCustomSize}
                          onChange={(e) => setFlexCustomSize(e.target.value)}
                          placeholder="e.g. 15 ft x 8 ft or 20 ft x 10 ft"
                          className="w-full px-3 py-2 text-xs bg-white border border-indigo-300 rounded-xl"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Name of Organization / Host *</label>
                      <input
                        type="text"
                        required={srvCategory === 'flex'}
                        value={flexOrgName}
                        onChange={(e) => setFlexOrgName(e.target.value)}
                        placeholder="e.g. Suryodaya Mun Ward 7, Kanyam Youth Club, Lions Club"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Name of Program / Event *</label>
                    <input
                      type="text"
                      required={srvCategory === 'flex'}
                      value={flexProgramName}
                      onChange={(e) => setFlexProgramName(e.target.value)}
                      placeholder="e.g. 5th Annual General Assembly & Tea Tourism Festival 2081"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Calendar size={12} className="text-indigo-600" />
                        <span>Program Date From (Optional)</span>
                      </label>
                      <input
                        type="date"
                        value={flexDateFrom}
                        onChange={(e) => setFlexDateFrom(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Calendar size={12} className="text-indigo-600" />
                        <span>Program Date To (Optional)</span>
                      </label>
                      <input
                        type="date"
                        value={flexDateTo}
                        onChange={(e) => setFlexDateTo(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Special Requirements &amp; Design Notes</label>
                    <textarea
                      rows={2}
                      value={flexRequirements}
                      onChange={(e) => setFlexRequirements(e.target.value)}
                      placeholder="e.g. Include Chief Guest photo, add corner brass eyelets, Star Flex finish, urgently required by Friday afternoon"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* 3. CREATE STAMP FORM */}
              {srvCategory === 'stamp' && (
                <div className="space-y-4 animate-fade-in bg-emerald-50/40 p-4 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold border-b border-emerald-200 pb-2">
                    <StampIcon size={15} className="text-emerald-600" />
                    <span>Official Stamp &amp; Seal Specifications</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Shape of Stamp *</label>
                      <select
                        value={stampShape}
                        onChange={(e) => setStampShape(e.target.value as 'Round' | 'Rectangle' | 'Oval')}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 font-semibold"
                      >
                        <option value="Round">🔘 Round / Circular (गोलो - Official Seal)</option>
                        <option value="Rectangle">⬛ Rectangle (आयाताकार - Designation / Address)</option>
                        <option value="Oval">⬭ Oval (अण्डाकार - Institutional Stamp)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Name of Organization / Business *</label>
                      <input
                        type="text"
                        required={srvCategory === 'stamp'}
                        value={stampOrgName}
                        onChange={(e) => setStampOrgName(e.target.value)}
                        placeholder="e.g. ReliableTech Services, Suryodaya Sahakari Ltd."
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Official Established Date (Estd. Date)</label>
                      <input
                        type="text"
                        value={stampEstdDate}
                        onChange={(e) => setStampEstdDate(e.target.value)}
                        placeholder="e.g. २०७८ बि.सं. / 2021 A.D."
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Upload size={12} className="text-emerald-600" />
                        <span>Upload Logo / Reference Sketch (If any)</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setStampImagePreview(reader.result as string);
                              onToast('✓ Logo / reference image attached!', 'success');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full px-2 py-1 text-[11px] bg-white border border-slate-200 rounded-xl file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                      />
                    </div>
                  </div>

                  {stampImagePreview && (
                    <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-emerald-200">
                      <img
                        src={stampImagePreview}
                        alt="Stamp Logo"
                        className="w-12 h-12 object-contain rounded-lg border border-slate-200 bg-slate-50"
                      />
                      <div className="flex-1 text-[11px]">
                        <span className="font-bold text-emerald-800 block">Logo Attachment Ready</span>
                        <span className="text-slate-500">Will be integrated into your stamp casing</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStampImagePreview('')}
                        className="text-red-500 hover:text-red-700 text-xs font-bold p-1"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Special Requirements &amp; Stamp Type</label>
                    <textarea
                      rows={2}
                      value={stampRequirements}
                      onChange={(e) => setStampRequirements(e.target.value)}
                      placeholder="e.g. Trodat Self-Inking Automatic (Blue Ink), Include Reg. No: 12345/078, Wooden handle, D-Pocket stamp"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* COMMON CONTACT & LOCATION FIELDS */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Contact Person Name *</label>
                    <input
                      type="text"
                      required
                      value={srvCustomerName}
                      onChange={(e) => setSrvCustomerName(e.target.value)}
                      placeholder="Customer Name"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={srvPhone}
                      onChange={(e) => setSrvPhone(e.target.value)}
                      placeholder="98XXXXXXXX"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Service Municipality *</label>
                    <select
                      value={srvMunicipality}
                      onChange={(e) => {
                        const m = e.target.value as PermittedMunicipality;
                        setSrvMunicipality(m);
                        if (m === 'Suryodaya Municipality') {
                          setSrvSpecificArea('Fikkal Bazaar');
                        } else if (m === 'Rong Municipality') {
                          setSrvSpecificArea('Highway Corridor (Harkatte to Jor Kalas)');
                        } else {
                          setSrvSpecificArea('Fikkal to Mai Khola & Ilam Bazaar Corridor');
                        }
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-semibold"
                    >
                      {PERMITTED_MUNICIPALITIES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {srvMunicipality === 'Suryodaya Municipality'
                        ? 'Suryodaya Specific Settlement *'
                        : 'Highway / Corridor Area *'}
                    </label>
                    {srvMunicipality === 'Suryodaya Municipality' ? (
                      <select
                        value={srvSpecificArea}
                        onChange={(e) => setSrvSpecificArea(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-semibold"
                      >
                        <option value="Fikkal Bazaar">Fikkal Bazaar (Central)</option>
                        <option value="Harkatte">Harkatte Area</option>
                        <option value="Kanyam">Kanyam Tea Garden Area</option>
                        <option value="Pashupatinagar">Pashupatinagar Border Area</option>
                        <option value="Shree Antu">Shree Antu / Antu Danda</option>
                        <option value="Gorkhe">Gorkhe Bazaar</option>
                        <option value="Aitabare">Aitabare / Samalbung</option>
                        <option value="Chhipitar">Chhipitar</option>
                        <option value="Laxmipur">Laxmipur</option>
                        <option value="Tindobato">Tindobato</option>
                        <option value="Custom Area">➕ Other / Custom Settlement</option>
                      </select>
                    ) : srvMunicipality === 'Rong Municipality' ? (
                      <select
                        value={srvSpecificArea}
                        onChange={(e) => setSrvSpecificArea(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-semibold"
                      >
                        <option value="Highway Corridor (Harkatte to Jor Kalas)">Highway Corridor (Harkatte to Jor Kalas)</option>
                        <option value="Kolbung Highway Section">Kolbung Highway Section</option>
                        <option value="Hanspokhari">Hanspokhari</option>
                        <option value="Kutidanda">Kutidanda</option>
                        <option value="Barhaghare">Barhaghare</option>
                        <option value="Bhaise">Bhaise</option>
                        <option value="Custom Area">➕ Other / Custom Rong Settlement</option>
                      </select>
                    ) : (
                      <select
                        value={srvSpecificArea}
                        onChange={(e) => setSrvSpecificArea(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-semibold"
                      >
                        <option value="Fikkal to Mai Khola & Ilam Bazaar Corridor">Fikkal to Mai Khola &amp; Ilam Corridor</option>
                        <option value="Ilam Bazaar">Ilam Bazaar (Central Area)</option>
                        <option value="Golakharka">Golakharka Area</option>
                        <option value="Singfrin">Singfrin Area</option>
                        <option value="Singhabahini">Singhabahini Area</option>
                        <option value="Biblante">Biblante Highway Route</option>
                        <option value="Custom Area">➕ Other / Custom Ilam Settlement</option>
                      </select>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Detailed Address &amp; Delivery/Service Landmark *</label>
                  <input
                    type="text"
                    required
                    value={srvAddress}
                    onChange={(e) => setSrvAddress(e.target.value)}
                    placeholder="e.g. Near Fikkal Chowk / Ward 10 Office / Hospital Road"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={13} />
                  <span>
                    {srvCategory === 'hardware' && 'Register Service Ticket'}
                    {srvCategory === 'flex' && 'Submit Flex Banner Order'}
                    {srvCategory === 'stamp' && 'Submit Stamp Order'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. CUSTOMER PORTAL MODAL (MY ORDERS / TICKETS / PROFILE) */}
      {/* ========================================================================= */}
      {isCustomerPortalOpen && activeCustomer && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-sm">
                  {activeCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">{activeCustomer.name}</h3>
                  <p className="text-[11px] text-slate-400">
                    {activeCustomer.municipality} &bull; {activeCustomer.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onCustomerLogout();
                    setIsCustomerPortalOpen(false);
                    onToast('Logged out of customer account.', 'info');
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <LogOut size={12} />
                  <span>Log Out</span>
                </button>
                <button
                  onClick={() => setIsCustomerPortalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Navigation Sub-Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 shrink-0">
              <button
                onClick={() => setCustomerPortalTab('orders')}
                className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  customerPortalTab === 'orders'
                    ? 'border-sky-600 text-sky-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Package size={14} />
                <span>My Orders ({myOrders.length})</span>
              </button>
              <button
                onClick={() => setCustomerPortalTab('services')}
                className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  customerPortalTab === 'services'
                    ? 'border-sky-600 text-sky-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Wrench size={14} />
                <span>My Service Tickets ({myTickets.length})</span>
              </button>
              <button
                onClick={() => setCustomerPortalTab('profile')}
                className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  customerPortalTab === 'profile'
                    ? 'border-sky-600 text-sky-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <User size={14} />
                <span>Account Profile</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {customerPortalTab === 'orders' && (
                <div>
                  {myOrders.length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                      <Package size={32} className="mx-auto text-slate-300" />
                      <p className="text-xs font-bold text-slate-700">No orders placed yet</p>
                      <p className="text-[11px] text-slate-500">
                        Your online orders and delivery tracking will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myOrders.map((order) => (
                        <div
                          key={order.order_id}
                          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-slate-900">
                                  {order.order_id}
                                </span>
                                <span
                                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    order.order_state === 'Delivered & Closed'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : order.order_state === 'Dispatched via Courier'
                                      ? 'bg-sky-100 text-sky-800'
                                      : order.order_state === 'Processing/Packing'
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {order.order_state}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                Placed on {order.created_at} &bull; Payment: {order.payment_method}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="font-extrabold text-sm text-slate-900">
                                NPR {order.total_amount_npr.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Items */}
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between text-xs text-slate-600"
                              >
                                <span>
                                  {item.quantity}x {item.product_name}
                                </span>
                                <span className="font-medium text-slate-900">
                                  NPR {(item.final_price_npr * item.quantity).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Dispatch / Delivery Info */}
                          {order.assigned_courier && (
                            <div className="p-2.5 bg-sky-50 rounded-lg border border-sky-200 text-xs text-sky-900 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Truck size={14} className="text-sky-600 shrink-0" />
                                <span>
                                  Rider: <strong>{order.assigned_courier}</strong>
                                </span>
                              </div>
                              {order.tracking_number && (
                                <span className="font-mono text-[10px] text-sky-700">
                                  Tracking: {order.tracking_number}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Order Actions: Receipt, Track & Download Official Invoice */}
                          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomerPortalOpen(false);
                                setReceiptModalOrder(order);
                              }}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <FileText size={12} />
                              <span>View Receipt</span>
                            </button>

                            <div className="flex items-center gap-2">
                              {(order.sales_invoice_no || order.sales_invoice_id || order.order_state === 'Delivered & Closed') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInvoiceModalOrder(order);
                                  }}
                                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                  title="Download or Print Computer Generated Tax Invoice with QR Code"
                                >
                                  <QrCode size={12} />
                                  <span>Print Tax Invoice</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {customerPortalTab === 'services' && (
                <div>
                  {myTickets.length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                      <Wrench size={32} className="mx-auto text-slate-300" />
                      <p className="text-xs font-bold text-slate-700">No service tickets registered</p>
                      <button
                        onClick={() => {
                          setIsCustomerPortalOpen(false);
                          setIsServiceModalOpen(true);
                        }}
                        className="mt-2 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition"
                      >
                        Book a Technical Service
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myTickets.map((ticket) => (
                        <div
                          key={ticket.ticket_id}
                          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-slate-900">
                                {ticket.ticket_id}
                              </span>
                              <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {ticket.hardware_type} &bull; {ticket.service_type}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                ticket.ticket_status === 'Completed - Awaiting Invoice Payment'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {ticket.ticket_status}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 font-medium">
                            {ticket.problem_description}
                          </p>

                          {ticket.technician_notes && (
                            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                              <strong className="text-slate-900">Technician Note:</strong>{' '}
                              {ticket.technician_notes}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span>Technician: {ticket.assigned_technician}</span>
                            {ticket.estimated_cost_npr && (
                              <span className="font-bold text-slate-800">
                                Est. NPR {ticket.estimated_cost_npr.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {customerPortalTab === 'profile' && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400 block">Full Name</span>
                      <span className="font-bold text-slate-900 text-sm">{activeCustomer.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Phone Number</span>
                      <span className="font-bold text-slate-900 text-sm">{activeCustomer.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Email Address</span>
                      <span className="font-semibold text-slate-800">{activeCustomer.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Primary Municipality</span>
                      <span className="font-semibold text-slate-800">{activeCustomer.municipality}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block">Delivery Address</span>
                      <span className="font-semibold text-slate-800">
                        {activeCustomer.detailed_address} ({activeCustomer.ward})
                      </span>
                    </div>
                    {activeCustomer.is_institutional && (
                      <div className="col-span-2 p-3 bg-sky-50 rounded-xl border border-sky-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                          Verified Institution
                        </span>
                        <div className="font-bold text-slate-900 mt-1">
                          {activeCustomer.organization_name}
                        </div>
                        <div className="text-xs text-slate-600 font-mono">
                          PAN: {activeCustomer.organization_pan}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. PRODUCT QUICK VIEW MODAL */}
      {/* ========================================================================= */}
      {selectedProductForModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="relative aspect-16/9 bg-slate-100 overflow-hidden">
              <img
                src={selectedProductForModal.image_url}
                alt={selectedProductForModal.product_name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProductForModal(null)}
                className="absolute top-3 right-3 p-1.5 bg-slate-950/60 hover:bg-slate-950 text-white rounded-full transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                  {selectedProductForModal.category} &bull; {selectedProductForModal.brand || 'RTSS Verified'}
                </span>
                <h3 className="font-bold text-slate-900 text-lg mt-0.5">
                  {selectedProductForModal.product_name}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {selectedProductForModal.description}
                </p>
              </div>

              {selectedProductForModal.features && selectedProductForModal.features.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-800 block">Key Specifications &amp; Features:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {selectedProductForModal.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        <Check size={13} className="text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Price & Add to Cart */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div>
                  {(() => {
                    const { original, discount, finalPrice } = getProductPricing(selectedProductForModal);
                    return (
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-black text-xl text-slate-900">
                            NPR {finalPrice.toLocaleString()}
                          </span>
                          {discount > 0 && (
                            <span className="text-xs text-slate-400 line-through">
                              NPR {original.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Warranty: {selectedProductForModal.warranty || 'Standard'} &bull; Fikkal Stock: {selectedProductForModal.stock_count}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <button
                  onClick={() => {
                    addToCart(selectedProductForModal, 1);
                    setSelectedProductForModal(null);
                  }}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <ShoppingCart size={15} />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13. CUSTOMER ORDER TRACKER & LIVE STATUS MODAL */}
      {/* ========================================================================= */}
      {isOrderTrackerOpen && (
        <CustomerOrderTrackerModal
          orders={orders}
          companyProfile={profile}
          onClose={() => setIsOrderTrackerOpen(false)}
          onViewReceipt={(order) => setReceiptModalOrder(order)}
        />
      )}

      {/* ========================================================================= */}
      {/* 14. OFFICIAL ORDER RECEIPT & 1-YEAR MAINTENANCE CERTIFICATE MODAL */}
      {/* ========================================================================= */}
      {receiptModalOrder && (
        <EcommerceOrderReceiptModal
          order={receiptModalOrder}
          companyProfile={profile}
          onClose={() => setReceiptModalOrder(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* 14.5 OFFICIAL TAX INVOICE MODAL (COMPUTER-GENERATED WITH QR CODE) */}
      {/* ========================================================================= */}
      {invoiceModalOrder && (
        <OfficialTaxInvoiceModal
          order={invoiceModalOrder}
          profile={profile}
          onClose={() => setInvoiceModalOrder(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* 15. DEVELOPER & SYSTEM CREDITS MODAL */}
      {/* ========================================================================= */}
      {isDeveloperInfoOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
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
                onClick={() => setIsDeveloperInfoOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-center overflow-y-auto">
              {developerPhoto ? (
                <div className="relative w-20 h-20 mx-auto">
                  <img
                    src={developerPhoto}
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

              <button
                onClick={() => setIsDeveloperInfoOpen(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 15.5 ENLARGED PAYMENT QR LIGHTBOX MODAL */}
      {/* ========================================================================= */}
      {zoomedQrData && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-center p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="text-left">
                <h4 className="font-extrabold text-sm text-slate-900">{zoomedQrData.title}</h4>
                <p className="text-[11px] text-slate-500 truncate max-w-[240px]">{zoomedQrData.subtext}</p>
              </div>
              <button
                onClick={() => setZoomedQrData(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <img
                src={zoomedQrData.qrUrl}
                alt={zoomedQrData.title}
                className="w-64 h-64 object-contain rounded-xl bg-white p-2 shadow-xs"
              />
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div className="bg-sky-50 border border-sky-200 p-2 rounded-xl">
                <p className="font-black text-sky-900 text-xs">
                  Pay Amount: NPR {cartCalculations.finalTotal.toLocaleString()}
                </p>
                {zoomedQrData.accountNo && (
                  <p className="text-[11px] text-sky-700 font-mono mt-0.5 font-bold">
                    Ref A/C / ID: {zoomedQrData.accountNo}
                  </p>
                )}
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                Scan this QR directly from your mobile banking or wallet application.
              </p>
            </div>

            <button
              onClick={() => setZoomedQrData(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Done / Return to Checkout Desk
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 16. LIVE CUSTOMER COUNTER CONNECT SUPPORT DESK (FLOATING WIDGET) */}
      {/* ========================================================================= */}
      {onSendMessage && onSendReply && (
        <CustomerChatWidget
          profile={profile}
          currentCustomer={activeCustomer}
          inquiries={inquiries}
          onSendMessage={onSendMessage}
          onSendReply={onSendReply}
        />
      )}

      {/* Customer Forgot Password Reset Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        accountType="customer"
        customerAccounts={customerAccounts}
        onResetCustomerPassword={onResetCustomerPassword}
        isDarkTheme={false}
      />
    </div>
  );
}
