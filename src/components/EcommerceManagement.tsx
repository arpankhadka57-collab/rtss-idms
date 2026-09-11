import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Package,
  Truck,
  Wrench,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Building2,
  FileText,
  Printer,
  ExternalLink,
  ShieldCheck,
  Send,
  MapPin,
  Phone,
  Filter,
  DollarSign,
  Tag,
  Check,
  ArrowRight,
  Receipt,
  Sparkles,
  MessageSquare,
  Reply,
  Ban,
  UserX,
  Upload,
  Image as ImageIcon,
  CheckCheck,
  QrCode,
  HelpCircle,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCcw,
  Headphones,
  ChevronDown,
  Mail,
  KeyRound,
  Copy,
  RefreshCw
} from 'lucide-react';
import {
  EcommerceProduct,
  EcommerceCategory,
  EcommerceDiscountType,
  PermittedMunicipality,
  PERMITTED_MUNICIPALITIES,
  CustomerAccount,
  EcommerceOrder,
  EcommerceOrderItem,
  OrderLifecycleState,
  PaymentFlowMethod,
  EcommerceServiceTicket,
  ServiceTicketLifecycleState,
  ServiceTicketHardwareType,
  ServiceTicketServiceType,
  HardwareTypeOption,
  AppUser,
  SalesInvoice,
  BusinessProfile,
  CustomerInquiryMessage,
  InquiryReply,
  BlockedMessengerRecord,
  InventoryItem
} from '../types';
import { EcommerceOrderReceiptModal } from './EcommerceOrderReceiptModal';
import { ReverseVoucherModal } from './ReverseVoucherModal';

interface EcommerceManagementProps {
  products: EcommerceProduct[];
  orders: EcommerceOrder[];
  serviceTickets: EcommerceServiceTicket[];
  customerAccounts: CustomerAccount[];
  hardwareTypes?: HardwareTypeOption[];
  inventoryStock?: InventoryItem[];
  customerInquiries?: CustomerInquiryMessage[];
  inquiries?: CustomerInquiryMessage[];
  onUpdateInquiries?: React.Dispatch<React.SetStateAction<CustomerInquiryMessage[]>>;
  blockedMessengers?: BlockedMessengerRecord[];
  currentUser: AppUser;
  staffUsers: AppUser[];
  profile: BusinessProfile;
  onAddProduct: (product: EcommerceProduct) => void;
  onEditProduct: (product: EcommerceProduct) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateOrderStatus: (orderId: string, state: OrderLifecycleState, courier?: string, tracking?: string, verifiedBy?: string) => void;
  onUpdateServiceTicket: (ticket: EcommerceServiceTicket) => void;
  onAddHardwareType?: (hw: HardwareTypeOption) => void;
  onEditHardwareType?: (hw: HardwareTypeOption) => void;
  onDeleteHardwareType?: (id: string) => void;
  onConvertToInvoice?: (order: EcommerceOrder, settlementMethod?: 'Cash' | 'Esewa' | 'Sahakari' | 'RBB' | 'Due' | 'Split') => void;
  onCancelOrderWithReverseVoucher?: (order: EcommerceOrder, remarks: string, refundMethod: string, shouldRestock: boolean) => void;
  onReplyInquiry?: (inquiryId: string, replyText: string, staffName: string) => void;
  onForwardInquiryToAdmin?: (inquiryId: string) => void;
  onBlockMessenger?: (inquiryId: string, emailOrPhone: string, reason?: string) => void;
  onUnblockMessenger?: (emailOrPhone: string) => void;
  onVerifyPayment?: (orderId: string, status: 'Verified' | 'Rejected', note?: string) => void;
  onDeleteOrder?: (orderId: string) => void;
  onDeleteServiceTicket?: (ticketId: string) => void;
  onDeleteInquiry?: (inquiryId: string) => void;
  onUpdateCustomer?: (customer: CustomerAccount) => void;
  onDeleteCustomer?: (customerId: string) => void;
  onResetCustomerPassword?: (customerId: string, newPass: string) => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function EcommerceManagement({
  products,
  orders,
  serviceTickets,
  customerAccounts,
  hardwareTypes = [],
  inventoryStock = [],
  customerInquiries = [],
  inquiries,
  onUpdateInquiries,
  blockedMessengers = [],
  currentUser,
  staffUsers,
  profile,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onUpdateServiceTicket,
  onAddHardwareType,
  onEditHardwareType,
  onDeleteHardwareType,
  onConvertToInvoice,
  onCancelOrderWithReverseVoucher,
  onReplyInquiry,
  onForwardInquiryToAdmin,
  onBlockMessenger,
  onUnblockMessenger,
  onVerifyPayment,
  onDeleteOrder,
  onDeleteServiceTicket,
  onDeleteInquiry,
  onUpdateCustomer,
  onDeleteCustomer,
  onResetCustomerPassword,
  onToast
}: EcommerceManagementProps) {
  const activeInquiriesList = inquiries || customerInquiries;
  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'orders' | 'services' | 'customers' | 'hardware-types' | 'messages' | 'tracking'>('inventory');

  // Search and filters for Inventory
  const [invSearch, setInvSearch] = useState('');
  const [invCategory, setInvCategory] = useState<string>('All');
  const [invStatus, setInvStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Add / Edit Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isInventoryDropdownOpen, setIsInventoryDropdownOpen] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<EcommerceCategory>('Stationery');
  const [prodCostPrice, setProdCostPrice] = useState<number>(0);
  const [prodSellingPrice, setProdSellingPrice] = useState<number>(0);
  const [prodDiscountType, setProdDiscountType] = useState<EcommerceDiscountType>('None');
  const [prodDiscountValue, setProdDiscountValue] = useState<number>(0);
  const [prodStock, setProdStock] = useState<number>(10);
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodIsActive, setProdIsActive] = useState(true);
  const [prodFeatured, setProdFeatured] = useState(false);
  const [prodFeaturesText, setProdFeaturesText] = useState('');
  const [prodWarranty, setProdWarranty] = useState('Standard RTSS Warranty');

  // Order Desk State
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<string>('All');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<EcommerceOrder | null>(null);
  const [orderCourierInput, setOrderCourierInput] = useState('');
  const [orderTrackingInput, setOrderTrackingInput] = useState('');
  const [orderStatusSelect, setOrderStatusSelect] = useState<OrderLifecycleState>('Pending Verification');
  const [orderSettlementMethod, setOrderSettlementMethod] = useState<'Cash' | 'Esewa' | 'Sahakari' | 'RBB' | 'Due'>('Cash');

  // Receipt Modal State
  const [receiptModalOrder, setReceiptModalOrder] = useState<EcommerceOrder | null>(null);

  // Cancellation & Reverse Voucher State
  const [cancellingOrder, setCancellingOrder] = useState<EcommerceOrder | null>(null);
  const [cancelRemarks, setCancelRemarks] = useState('');
  const [cancelRefundMethod, setCancelRefundMethod] = useState<'Cash' | 'eSewa' | 'RBB' | 'Sahakari' | 'Institutional Credit Reversal'>('Cash');
  const [cancelRestock, setCancelRestock] = useState<boolean>(true);
  const [reverseVoucherModalOrder, setReverseVoucherModalOrder] = useState<EcommerceOrder | null>(null);

  // Payment Verification Modal State
  const [verifyingOrder, setVerifyingOrder] = useState<EcommerceOrder | null>(null);
  const [paymentVerificationNote, setPaymentVerificationNote] = useState('');
  const [previewProofModal, setPreviewProofModal] = useState<{ title: string; imageUrl: string; orderId: string } | null>(null);

  // Customer Inquiries & Messages State
  const [msgSearch, setMsgSearch] = useState('');
  const [msgStatusFilter, setMsgStatusFilter] = useState<'All' | 'Open' | 'Forwarded to Admin' | 'Replied' | 'Resolved'>('All');
  const [selectedInquiryForReply, setSelectedInquiryForReply] = useState<CustomerInquiryMessage | null>(null);
  const [replyInputText, setReplyInputText] = useState('');
  const [replyStaffName, setReplyStaffName] = useState(currentUser.name || 'Staff');
  const [blockingTarget, setBlockingTarget] = useState<{ inquiry: CustomerInquiryMessage; reason: string } | null>(null);

  // Order Tracking Desk State
  const [trackingSearchInput, setTrackingSearchInput] = useState('');
  const [trackedOrderResult, setTrackedOrderResult] = useState<EcommerceOrder | null>(null);

  // Service Desk State
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceStatusFilter, setServiceStatusFilter] = useState<string>('All');
  const [selectedTicketForModal, setSelectedTicketForModal] = useState<EcommerceServiceTicket | null>(null);
  const [ticketStatusSelect, setTicketStatusSelect] = useState<ServiceTicketLifecycleState>('Site-Survey Scheduled');
  const [ticketTechSelect, setTicketTechSelect] = useState('');
  const [ticketNotesInput, setTicketNotesInput] = useState('');
  const [ticketActualCostInput, setTicketActualCostInput] = useState<number>(0);

  // Dispatch Slip Print Preview State
  const [printingOrder, setPrintingOrder] = useState<EcommerceOrder | null>(null);

  // Hardware Type State
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [editingHardwareId, setEditingHardwareId] = useState<string | null>(null);
  const [hwName, setHwName] = useState('');
  const [hwNameNepali, setHwNameNepali] = useState('');
  const [hwCategoryHint, setHwCategoryHint] = useState('');
  const [hwTurnaround, setHwTurnaround] = useState('24-48 Hours');
  const [hwDescription, setHwDescription] = useState('');
  const [hwIsActive, setHwIsActive] = useState(true);

  // Customer Directory State
  const [custSearch, setCustSearch] = useState('');
  const [custCategoryFilter, setCustCategoryFilter] = useState('All');
  const [custStatusFilter, setCustStatusFilter] = useState('All');
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerAccount | null>(null);
  const [showCustPassword, setShowCustPassword] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [resetEmailSuccessMsg, setResetEmailSuccessMsg] = useState('');
  const [generatedResetLink, setGeneratedResetLink] = useState('');

  const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'Super Admin';

  const handleOpenEditCustomer = (customer: CustomerAccount) => {
    setEditingCustomer({ ...customer });
    setShowCustPassword(false);
    setResetEmailSuccessMsg('');
    setGeneratedResetLink('');
    setIsEditCustomerModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    if (!editingCustomer.name.trim() || !editingCustomer.phone.trim() || !editingCustomer.detailed_address.trim()) {
      onToast('Please fill in all mandatory customer fields.', 'error');
      return;
    }

    if (editingCustomer.is_institutional && (!editingCustomer.organization_name?.trim() || !editingCustomer.organization_pan?.trim())) {
      onToast('Institutional accounts require Organization Name and 9-digit PAN.', 'error');
      return;
    }

    if (onUpdateCustomer) {
      onUpdateCustomer(editingCustomer);
    }
    setIsEditCustomerModalOpen(false);
    onToast(`✅ Customer details for ${editingCustomer.name} updated successfully!`, 'success');
  };

  const handleToggleBlockCustomer = (customer: CustomerAccount) => {
    const isCurrentlyBlocked = customer.status === 'Blocked';
    const newStatus: 'Active' | 'Blocked' = isCurrentlyBlocked ? 'Active' : 'Blocked';
    const updated: CustomerAccount = { ...customer, status: newStatus };
    if (onUpdateCustomer) {
      onUpdateCustomer(updated);
    }
    if (isCurrentlyBlocked) {
      onToast(`🛡️ Customer ${customer.name} has been Unblocked and set to Active.`, 'success');
    } else {
      onToast(`🚫 Customer ${customer.name} has been Blocked from accessing the storefront.`, 'info');
    }
  };

  const handleDeleteCustomer = (customer: CustomerAccount) => {
    if (!isAdmin) {
      onToast('⚠️ Only System Administrators have permission to delete customer accounts.', 'error');
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete customer account "${customer.name}" (${customer.customer_id})?\n\nThis action cannot be undone.`
    );
    if (confirmed) {
      if (onDeleteCustomer) {
        onDeleteCustomer(customer.customer_id);
      }
      onToast(`🗑️ Customer ${customer.name} (${customer.customer_id}) deleted.`, 'info');
    }
  };

  const handleSendResetPasswordEmail = async (customer: CustomerAccount) => {
    if (!customer.email || !customer.email.includes('@')) {
      onToast('This customer does not have a valid email address configured.', 'error');
      return;
    }

    setIsSendingResetEmail(true);
    setResetEmailSuccessMsg('');

    try {
      const origin = window.location.origin;
      const resetUrl = `${origin}/?action=reset_password&email=${encodeURIComponent(customer.email)}`;
      setGeneratedResetLink(resetUrl);

      const response = await fetch('/api/auth/send-customer-reset-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: customer.email,
          customerName: customer.name,
          resetUrl
        })
      });

      let data: any = {};
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch {
        data = { error: `Server returned HTTP ${response.status}` };
      }

      if (response.ok && data.success) {
        setResetEmailSuccessMsg(`Reset email dispatched to ${customer.email} from ${data.sender || 'RTSS Auth'}`);
        onToast(`📧 Password reset email sent to ${customer.email}!`, 'success');
      } else {
        onToast(data.error || 'Failed to dispatch reset email.', 'error');
      }
    } catch (err: any) {
      console.error('Password reset email error:', err);
      onToast('Network error while dispatching reset email.', 'error');
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  const handleOpenAddHardware = () => {
    setEditingHardwareId(null);
    setHwName('');
    setHwNameNepali('');
    setHwCategoryHint('IT & Computer');
    setHwTurnaround('24-48 Hours');
    setHwDescription('');
    setHwIsActive(true);
    setIsHardwareModalOpen(true);
  };

  const handleOpenEditHardware = (hw: HardwareTypeOption) => {
    setEditingHardwareId(hw.id);
    setHwName(hw.name);
    setHwNameNepali(hw.name_nepali || '');
    setHwCategoryHint(hw.category_hint || '');
    setHwTurnaround(hw.turnaround_estimate || '24-48 Hours');
    setHwDescription(hw.description || '');
    setHwIsActive(hw.is_active);
    setIsHardwareModalOpen(true);
  };

  const handleSaveHardware = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwName.trim()) {
      onToast('Please enter hardware system name.', 'error');
      return;
    }
    const hwObj: HardwareTypeOption = {
      id: editingHardwareId || `HW-${Date.now().toString().slice(-4)}`,
      name: hwName.trim(),
      name_nepali: hwNameNepali.trim() || undefined,
      category_hint: hwCategoryHint.trim() || undefined,
      turnaround_estimate: hwTurnaround.trim() || undefined,
      description: hwDescription.trim() || undefined,
      is_active: hwIsActive
    };

    if (editingHardwareId && onEditHardwareType) {
      onEditHardwareType(hwObj);
    } else if (onAddHardwareType) {
      onAddHardwareType(hwObj);
    }
    setIsHardwareModalOpen(false);
  };

  const handleToggleHardwareActive = (hw: HardwareTypeOption) => {
    if (onEditHardwareType) {
      onEditHardwareType({
        ...hw,
        is_active: !hw.is_active
      });
      onToast(`Hardware option "${hw.name}" is now ${!hw.is_active ? 'Active' : 'Hidden'}.`, 'info');
    }
  };

  // Filtered Products for Sub-Tab 1
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      if (invCategory !== 'All' && item.category !== invCategory) return false;
      if (invStatus === 'active' && !item.is_active) return false;
      if (invStatus === 'inactive' && item.is_active) return false;
      if (invSearch.trim()) {
        const q = invSearch.toLowerCase();
        const matchesName = item.product_name.toLowerCase().includes(q);
        const matchesId = item.product_id.toLowerCase().includes(q);
        const matchesBrand = item.brand?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesId && !matchesBrand) return false;
      }
      return true;
    });
  }, [products, invCategory, invStatus, invSearch]);

  // Filtered Orders for Sub-Tab 2
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderStatusFilter !== 'All' && o.order_state !== orderStatusFilter) return false;
      if (orderPaymentFilter !== 'All' && o.payment_method !== orderPaymentFilter) return false;
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        const matchesId = o.order_id.toLowerCase().includes(q);
        const matchesCust = o.customer_name.toLowerCase().includes(q);
        const matchesPhone = o.customer_phone.includes(q);
        const matchesMun = o.municipality.toLowerCase().includes(q);
        if (!matchesId && !matchesCust && !matchesPhone && !matchesMun) return false;
      }
      return true;
    });
  }, [orders, orderStatusFilter, orderPaymentFilter, orderSearch]);

  // Filtered Service Tickets for Sub-Tab 3
  const filteredServiceTickets = useMemo(() => {
    return serviceTickets.filter((t) => {
      if (serviceStatusFilter !== 'All' && t.ticket_status !== serviceStatusFilter) return false;
      if (serviceSearch.trim()) {
        const q = serviceSearch.toLowerCase();
        const matchesId = t.ticket_id.toLowerCase().includes(q);
        const matchesCust = t.customer_name.toLowerCase().includes(q);
        const matchesPhone = t.customer_phone.includes(q);
        const matchesHw = t.hardware_type.toLowerCase().includes(q);
        if (!matchesId && !matchesCust && !matchesPhone && !matchesHw) return false;
      }
      return true;
    });
  }, [serviceTickets, serviceStatusFilter, serviceSearch]);

  // Product Pricing calculation
  const getProductPricing = (product: EcommerceProduct) => {
    const original = product.selling_price_npr;
    let discount = 0;
    if (product.discount_type === 'Percentage' && product.discount_value > 0) {
      discount = Math.round((original * product.discount_value) / 100);
    } else if (product.discount_type === 'Fixed_Amount' && product.discount_value > 0) {
      discount = product.discount_value;
    }
    const finalPrice = Math.max(0, original - discount);
    const profitMargin = finalPrice - product.cost_price_npr;
    const marginPercent = product.cost_price_npr > 0 ? Math.round((profitMargin / product.cost_price_npr) * 100) : 0;
    return { original, discount, finalPrice, profitMargin, marginPercent };
  };

  // Open Add Product Modal
  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    setProdName('');
    setIsInventoryDropdownOpen(false);
    setProdCategory('Stationery');
    setProdCostPrice(0);
    setProdSellingPrice(0);
    setProdDiscountType('None');
    setProdDiscountValue(0);
    setProdStock(10);
    setProdImageUrl('https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&auto=format&fit=crop&q=80');
    setProdDescription('');
    setProdBrand('');
    setProdIsActive(true);
    setProdFeatured(false);
    setProdFeaturesText('');
    setProdWarranty('Standard RTSS Warranty');
    setIsProductModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (product: EcommerceProduct) => {
    setEditingProductId(product.product_id);
    setProdName(product.product_name);
    setIsInventoryDropdownOpen(false);
    setProdCategory(product.category);
    setProdCostPrice(product.cost_price_npr);
    setProdSellingPrice(product.selling_price_npr);
    setProdDiscountType(product.discount_type);
    setProdDiscountValue(product.discount_value);
    setProdStock(product.stock_count);
    setProdImageUrl(product.image_url);
    setProdDescription(product.description || '');
    setProdBrand(product.brand || '');
    setProdIsActive(product.is_active);
    setProdFeatured(product.featured || false);
    setProdFeaturesText((product.features || []).join('\n'));
    setProdWarranty(product.warranty || 'Standard RTSS Warranty');
    setIsProductModalOpen(true);
  };

  // Save Product (Add or Edit)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      onToast('Product name is required.', 'error');
      return;
    }
    if (prodSellingPrice <= 0) {
      onToast('Selling price must be greater than 0.', 'error');
      return;
    }

    const featuresList = prodFeaturesText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    if (editingProductId) {
      const updated: EcommerceProduct = {
        product_id: editingProductId,
        product_name: prodName.trim(),
        category: prodCategory,
        cost_price_npr: Number(prodCostPrice) || 0,
        selling_price_npr: Number(prodSellingPrice) || 0,
        discount_type: prodDiscountType,
        discount_value: Number(prodDiscountValue) || 0,
        stock_count: Number(prodStock) || 0,
        image_url: prodImageUrl.trim() || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&auto=format&fit=crop&q=80',
        description: prodDescription.trim() || undefined,
        brand: prodBrand.trim() || undefined,
        is_active: prodIsActive,
        featured: prodFeatured,
        features: featuresList.length > 0 ? featuresList : undefined,
        warranty: prodWarranty.trim() || undefined
      };
      onEditProduct(updated);
      onToast(`Updated product "${updated.product_name}".`, 'success');
    } else {
      const catCode = prodCategory === 'Stationery' ? 'STN' : prodCategory === 'Computer Parts' ? 'CMP' : 'CTV';
      const newId = `RTSS-${catCode}-${Date.now().toString().slice(-4)}`;
      const newProduct: EcommerceProduct = {
        product_id: newId,
        product_name: prodName.trim(),
        category: prodCategory,
        cost_price_npr: Number(prodCostPrice) || 0,
        selling_price_npr: Number(prodSellingPrice) || 0,
        discount_type: prodDiscountType,
        discount_value: Number(prodDiscountValue) || 0,
        stock_count: Number(prodStock) || 0,
        image_url: prodImageUrl.trim() || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&auto=format&fit=crop&q=80',
        description: prodDescription.trim() || undefined,
        brand: prodBrand.trim() || undefined,
        is_active: prodIsActive,
        featured: prodFeatured,
        features: featuresList.length > 0 ? featuresList : undefined,
        warranty: prodWarranty.trim() || undefined,
        date_added: new Date().toISOString().split('T')[0]
      };
      onAddProduct(newProduct);
      onToast(`Added new product "${newProduct.product_name}".`, 'success');
    }
    setIsProductModalOpen(false);
  };

  // Quick Stock Modifier
  const handleQuickStockAdjust = (product: EcommerceProduct, delta: number) => {
    const newStock = Math.max(0, product.stock_count + delta);
    onEditProduct({ ...product, stock_count: newStock });
    onToast(`Updated ${product.product_name} stock to ${newStock}.`, 'info');
  };

  // Toggle Product Active/Inactive
  const handleToggleActive = (product: EcommerceProduct) => {
    const updated = { ...product, is_active: !product.is_active };
    onEditProduct(updated);
    onToast(
      updated.is_active
        ? `"${product.product_name}" is now visible on storefront.`
        : `"${product.product_name}" is hidden from storefront.`,
      'info'
    );
  };

  // Open Order Inspection Modal
  const handleOpenOrderModal = (order: EcommerceOrder) => {
    setSelectedOrderForModal(order);
    setOrderStatusSelect(order.order_state);
    const initialRider = order.assigned_courier || (staffUsers && staffUsers.length > 0 ? `${staffUsers[0].name} (${staffUsers[0].post || staffUsers[0].role})` : currentUser.name);
    setOrderCourierInput(initialRider);
    setOrderTrackingInput(order.tracking_number || `TRK-ILAM-${Date.now().toString().slice(-4)}`);
  };

  // Save Order Status Update
  const handleSaveOrderStatus = () => {
    if (!selectedOrderForModal) return;
    onUpdateOrderStatus(
      selectedOrderForModal.order_id,
      orderStatusSelect,
      orderCourierInput.trim() || undefined,
      orderTrackingInput.trim() || undefined,
      currentUser.username
    );
    setSelectedOrderForModal(null);
    onToast(`Updated Order #${selectedOrderForModal.order_id} to "${orderStatusSelect}".`, 'success');
  };

  // Initiate Order Cancellation with Reverse Voucher
  const handleInitiateCancel = (order: EcommerceOrder) => {
    setCancellingOrder(order);
    setCancelRemarks('');
    let method: 'Cash' | 'eSewa' | 'RBB' | 'Sahakari' | 'Institutional Credit Reversal' = 'Cash';
    if (order.payment_method === 'ESEWA') method = 'eSewa';
    else if (order.payment_method === 'RBB_TRANSFER') method = 'RBB';
    else if (order.payment_method === 'COOP_QR') method = 'Sahakari';
    else if (order.payment_method === 'INSTITUTIONAL_CREDIT') method = 'Institutional Credit Reversal';
    setCancelRefundMethod(method);
    setCancelRestock(true);
  };

  // Confirm Order Cancellation & Reverse Voucher Settlement
  const handleConfirmCancelWithReverseVoucher = () => {
    if (!cancellingOrder) return;
    if (!cancelRemarks.trim()) {
      onToast('Please enter cancellation reason & refund remarks.', 'error');
      return;
    }

    const reverseVoucherNo = `REV-VCH-${new Date().getFullYear()}-${String(cancellingOrder.order_id).replace(/\D/g, '').slice(-4) || '001'}`;
    const cancelDate = new Date().toISOString().slice(0, 10);

    if (onCancelOrderWithReverseVoucher) {
      onCancelOrderWithReverseVoucher(cancellingOrder, cancelRemarks.trim(), cancelRefundMethod, cancelRestock);
    } else {
      onUpdateOrderStatus(
        cancellingOrder.order_id,
        'Cancelled',
        cancellingOrder.assigned_courier,
        cancellingOrder.tracking_number,
        currentUser.name
      );
    }

    const simulatedReversedOrder: EcommerceOrder = {
      ...cancellingOrder,
      order_state: 'Cancelled',
      cancellation_reason: cancelRemarks.trim(),
      cancelled_by: currentUser.name,
      cancelled_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
      refund_status: 'Refunded',
      refund_amount: cancellingOrder.total_amount_npr,
      refund_method: cancelRefundMethod,
      reverse_voucher_number: reverseVoucherNo,
      reverse_voucher_date: cancelDate
    };

    setCancellingOrder(null);
    setSelectedOrderForModal(null);
    setReverseVoucherModalOrder(simulatedReversedOrder);
    onToast(`Order #${cancellingOrder.order_id} cancelled & reverse voucher issued.`, 'success');
  };

  // Open Service Ticket Inspection Modal
  const handleOpenTicketModal = (ticket: EcommerceServiceTicket) => {
    setSelectedTicketForModal(ticket);
    setTicketStatusSelect(ticket.ticket_status);
    setTicketTechSelect(ticket.assigned_technician || 'Arpan Khadka');
    setTicketNotesInput(ticket.technician_notes || '');
    setTicketActualCostInput(ticket.actual_cost_npr || ticket.estimated_cost_npr || 0);
  };

  // Save Service Ticket Update
  const handleSaveTicketUpdate = () => {
    if (!selectedTicketForModal) return;
    const updated: EcommerceServiceTicket = {
      ...selectedTicketForModal,
      ticket_status: ticketStatusSelect,
      assigned_technician: ticketTechSelect,
      technician_notes: ticketNotesInput.trim() || undefined,
      actual_cost_npr: Number(ticketActualCostInput) || undefined,
      updated_at: new Date().toISOString().split('T')[0]
    };
    onUpdateServiceTicket(updated);
    setSelectedTicketForModal(null);
    onToast(`Updated Service Ticket #${updated.ticket_id} to "${ticketStatusSelect}".`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER - CLEAN & FOCUSED */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-2xs">
            <ShoppingBag size={18} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              E-Commerce Management
            </h2>
          </div>
        </div>

        {/* Action: Add Store Product */}
        <button
          onClick={handleOpenAddProduct}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
          id="admin-add-product-button"
        >
          <Plus size={15} />
          <span>Add Store Product</span>
        </button>
      </div>

      {/* 2. SUB-TAB NAVIGATION BAR - MULTI-ROW (FLEX WRAP) WITH SHORT CRISP LABELS */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'inventory'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
          id="subtab-inventory"
        >
          <Package size={13} />
          <span>Products</span>
          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
            activeSubTab === 'inventory' ? 'bg-white/25 text-white' : 'bg-sky-100 text-sky-800'
          }`}>
            {products.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('orders')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'orders'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
          id="subtab-orders"
        >
          <Truck size={13} />
          <span>Orders</span>
          {orders.filter((o) => o.order_state === 'Pending Verification' || o.order_state === 'Processing/Packing').length > 0 && (
            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
              activeSubTab === 'orders' ? 'bg-white/25 text-white' : 'bg-amber-500 text-white animate-pulse'
            }`}>
              {orders.filter((o) => o.order_state === 'Pending Verification' || o.order_state === 'Processing/Packing').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('services')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'services'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
          id="subtab-services"
        >
          <Wrench size={13} />
          <span>Services</span>
          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
            activeSubTab === 'services' ? 'bg-white/25 text-white' : 'bg-indigo-100 text-indigo-800'
          }`}>
            {serviceTickets.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('customers')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'customers'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
          id="subtab-customers"
        >
          <Users size={13} />
          <span>Customers</span>
          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
            activeSubTab === 'customers' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {customerAccounts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('hardware-types')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'hardware-types'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
          id="subtab-hardware-types"
        >
          <Sparkles size={13} />
          <span>Hardware</span>
          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
            activeSubTab === 'hardware-types' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {hardwareTypes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('messages')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'messages'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
          id="subtab-messages"
        >
          <Headphones size={13} />
          <span>Support</span>
          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
            activeInquiriesList.filter(i => i.status === 'Open' || i.status === 'Forwarded to Admin').length > 0
              ? (activeSubTab === 'messages' ? 'bg-rose-500 text-white animate-pulse' : 'bg-rose-100 text-rose-800 animate-pulse')
              : (activeSubTab === 'messages' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700')
          }`}>
            {activeInquiriesList.filter(i => i.status === 'Open' || i.status === 'Forwarded to Admin').length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('tracking')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'tracking'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
          id="subtab-tracking"
        >
          <Search size={13} />
          <span>Tracking</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: INVENTORY & CATALOG CONTROLLER */}
      {/* ========================================================================= */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search product name, ID, brand..."
                  value={invSearch}
                  onChange={(e) => setInvSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
                <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
              </div>

              {/* Category Select */}
              <select
                value={invCategory}
                onChange={(e) => setInvCategory(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700"
              >
                <option value="All">All Categories</option>
                <option value="Stationery">Stationery</option>
                <option value="Computer Parts">Computer Parts</option>
                <option value="CCTV & Security">CCTV &amp; Security</option>
              </select>

              {/* Status Select */}
              <select
                value={invStatus}
                onChange={(e) => setInvStatus(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700"
              >
                <option value="all">All Visibility</option>
                <option value="active">Active on Store</option>
                <option value="inactive">Hidden</option>
              </select>
            </div>

            <span className="text-xs text-slate-500 font-medium self-end sm:self-center">
              Showing <strong>{filteredProducts.length}</strong> items
            </span>
          </div>

          {/* Product Data Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Product / ID</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3 text-right">Cost (NPR)</th>
                    <th className="px-3 py-3 text-right">Selling Rate</th>
                    <th className="px-3 py-3 text-right">Final Retail</th>
                    <th className="px-3 py-3 text-center">Fikkal Stock</th>
                    <th className="px-3 py-3 text-center">Storefront</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No products match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const { original, discount, finalPrice, profitMargin, marginPercent } = getProductPricing(p);
                      return (
                        <tr key={p.product_id} className="hover:bg-slate-50/80 transition">
                          {/* Product Info */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.image_url}
                                alt={p.product_name}
                                className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0 bg-white"
                              />
                              <div className="min-w-0 max-w-xs">
                                <span className="font-bold text-slate-900 block truncate" title={p.product_name}>
                                  {p.product_name}
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                                  <span>{p.product_id}</span>
                                  {p.brand && <span>&bull; {p.brand}</span>}
                                  {p.featured && (
                                    <span className="text-amber-600 font-bold bg-amber-50 px-1 rounded">
                                      ⭐ Featured
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-3 py-3">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md font-semibold text-[11px]">
                              {p.category}
                            </span>
                          </td>

                          {/* Cost Price */}
                          <td className="px-3 py-3 text-right font-mono text-slate-500">
                            NPR {p.cost_price_npr.toLocaleString()}
                          </td>

                          {/* Base Selling Rate */}
                          <td className="px-3 py-3 text-right font-mono font-medium text-slate-700">
                            NPR {p.selling_price_npr.toLocaleString()}
                            {discount > 0 && (
                              <span className="block text-[9.5px] text-emerald-600 font-bold">
                                -{p.discount_type === 'Percentage' ? `${p.discount_value}%` : `NPR ${p.discount_value}`}
                              </span>
                            )}
                          </td>

                          {/* Final Retail Price & Margin */}
                          <td className="px-3 py-3 text-right">
                            <span className="font-mono font-bold text-slate-900 block">
                              NPR {finalPrice.toLocaleString()}
                            </span>
                            <span className="text-[9.5px] text-emerald-700 font-semibold block">
                              +{marginPercent}% margin
                            </span>
                          </td>

                          {/* Stock Counter */}
                          <td className="px-3 py-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleQuickStockAdjust(p, -5)}
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
                                title="Subtract 5"
                              >
                                -
                              </button>
                              <span
                                className={`px-2 py-0.5 rounded-md font-mono font-bold text-xs ${
                                  p.stock_count > 5
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : p.stock_count > 0
                                    ? 'bg-amber-50 text-amber-800'
                                    : 'bg-rose-50 text-rose-800'
                                }`}
                              >
                                {p.stock_count}
                              </span>
                              <button
                                onClick={() => handleQuickStockAdjust(p, 5)}
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
                                title="Add 5"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          {/* Visibility Toggle */}
                          <td className="px-3 py-3 text-center">
                            <button
                              onClick={() => handleToggleActive(p)}
                              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto cursor-pointer ${
                                p.is_active
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                              title={p.is_active ? 'Visible on Storefront (Click to Hide)' : 'Hidden (Click to Show)'}
                            >
                              {p.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
                              <span className="text-[10px]">{p.is_active ? 'Live' : 'Hidden'}</span>
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditProduct(p)}
                                className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition"
                                title="Edit Product"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete "${p.product_name}"?`)) {
                                    onDeleteProduct(p.product_id);
                                  }
                                }}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Delete Product"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: ONLINE ORDER DISPATCH DESK */}
      {/* ========================================================================= */}
      {activeSubTab === 'orders' && (
        <div className="space-y-4">
          {/* Order Search & Pipeline Status Filter */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search Order ID, customer, phone..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
                <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
              </div>

              {/* Status Filter */}
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700"
              >
                <option value="All">All Order States</option>
                <option value="Pending Verification">Pending Verification</option>
                <option value="Processing/Packing">Processing/Packing</option>
                <option value="Dispatched via Courier">Dispatched via Courier</option>
                <option value="Delivered & Closed">Delivered &amp; Closed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              {/* Payment Filter */}
              <select
                value={orderPaymentFilter}
                onChange={(e) => setOrderPaymentFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700"
              >
                <option value="All">All Payment Flows</option>
                <option value="COD">Cash on Delivery (COD)</option>
                <option value="ESEWA">eSewa Gateway</option>
                <option value="RBB_TRANSFER">RBB Bank Voucher</option>
                <option value="COOP_QR">Sahakari QR</option>
                <option value="INSTITUTIONAL_CREDIT">Institutional Credit (PAN)</option>
              </select>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Total <strong>{filteredOrders.length}</strong> online orders
            </span>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Order ID / Date</th>
                    <th className="px-3 py-3">Customer &amp; Phone</th>
                    <th className="px-3 py-3">Delivery Zone (Ilam)</th>
                    <th className="px-3 py-3">Payment Method</th>
                    <th className="px-3 py-3 text-right">Total (NPR)</th>
                    <th className="px-3 py-3 text-center">Lifecycle Status</th>
                    <th className="px-4 py-3 text-right">Inspect / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No online orders found in this queue.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => (
                      <tr key={ord.order_id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-slate-900 block">
                            {ord.order_id}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {ord.created_at}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <span className="font-bold text-slate-800 block">
                            {ord.customer_name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {ord.customer_phone}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <span className="font-semibold text-slate-800 block">
                            {ord.municipality}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[180px]">
                            {ord.delivery_address} ({ord.ward})
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] ${
                              ord.payment_method === 'COD'
                                ? 'bg-slate-100 text-slate-800'
                                : ord.payment_method === 'ESEWA'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.payment_method === 'RBB_TRANSFER'
                                ? 'bg-indigo-100 text-indigo-800'
                                : ord.payment_method === 'COOP_QR'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {ord.payment_method}
                          </span>
                          {ord.gateway_ref_token && (
                            <span className="block text-[9px] text-slate-400 font-mono truncate max-w-[120px]">
                              {ord.gateway_ref_token}
                            </span>
                          )}
                          {ord.organization_pan && (
                            <span className="block text-[9px] text-purple-700 font-mono font-bold">
                              PAN: {ord.organization_pan}
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3 text-right font-mono font-black text-slate-900">
                          NPR {ord.total_amount_npr.toLocaleString()}
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase tracking-wider ${
                              ord.order_state === 'Delivered & Closed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.order_state === 'Dispatched via Courier'
                                ? 'bg-sky-100 text-sky-800'
                                : ord.order_state === 'Processing/Packing'
                                ? 'bg-indigo-100 text-indigo-800'
                                : ord.order_state === 'Cancelled'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}
                          >
                            {ord.order_state}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {ord.payment_screenshot_url && (
                              <button
                                onClick={() => {
                                  setVerifyingOrder(ord);
                                  setPaymentVerificationNote(ord.payment_verification_note || '');
                                }}
                                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer ${
                                  ord.payment_verification_status === 'Verified'
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                    : ord.payment_verification_status === 'Rejected'
                                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                    : 'bg-amber-100 text-amber-900 hover:bg-amber-200 animate-pulse'
                                }`}
                                title="Inspect & Verify Uploaded Payment Slip"
                              >
                                <QrCode size={12} />
                                <span>{ord.payment_verification_status || 'Verify Slip'}</span>
                              </button>
                            )}

                            <button
                              onClick={() => setReceiptModalOrder(ord)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer"
                              title="Print Official Order Receipt & Maintenance Certificate"
                            >
                              <Receipt size={13} />
                              <span>Receipt</span>
                            </button>

                            {ord.order_state === 'Cancelled' ? (
                              <button
                                onClick={() => setReverseVoucherModalOrder(ord)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer"
                                title="View & Print Reverse Voucher / Credit Note"
                              >
                                <RotateCcw size={13} />
                                <span>Voucher</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleInitiateCancel(ord)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer"
                                title="Cancel Order & Issue Reverse Voucher (Refund)"
                              >
                                <RotateCcw size={13} />
                                <span>Cancel / Reverse</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenOrderModal(ord)}
                              className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer"
                            >
                              <Eye size={13} />
                              <span>Inspect</span>
                            </button>
                            <button
                              onClick={() => setPrintingOrder(ord)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
                              title="Print Dispatch Slip"
                            >
                              <Printer size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (window.openUniversalEmailModal) {
                                  window.openUniversalEmailModal({
                                    recipientEmail: ord.customer_email || '',
                                    recipientName: ord.customer_name || 'Valued Customer',
                                    subject: `Order Dispatch Notification (#${ord.order_number}) - RTSS`,
                                    message: `Dear ${ord.customer_name},\n\nYour order #${ord.order_number} is being processed for dispatch by ReliableTech Services & Suppliers.\n\nOrder Details:\n- Order ID: ${ord.order_number}\n- Date: ${ord.order_date_bs || ord.order_date}\n- Status: ${ord.order_state}\n- Total: NPR ${(ord.total_amount_npr || ord.grand_total_npr || 0).toLocaleString()}\n\nReliableTech Services & Suppliers\nFikkal, Ilam, Nepal`,
                                    emailType: 'Order Notification',
                                    documentRef: ord.order_number
                                  });
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-emerald-600 rounded-lg transition cursor-pointer"
                              title="Send Order Details through Email"
                            >
                              <Mail size={14} />
                            </button>

                            {onDeleteOrder && (
                              <button
                                onClick={() => {
                                  if (currentUser?.username !== '@reliableadmin' && currentUser?.role !== 'Admin' && currentUser?.role !== 'Super Admin') {
                                    alert('Direct deletion is allowed for System Master (@reliableadmin) only.');
                                    return;
                                  }
                                  if (confirm(`Are you sure you want to permanently delete Order #${ord.order_id} for ${ord.customer_name}? This action cannot be undone.`)) {
                                    onDeleteOrder(ord.order_id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete Order (@reliableadmin only)"
                              >
                                <Trash2 size={13} />
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
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: SERVICE & INSTALLATION TICKETS DESK */}
      {/* ========================================================================= */}
      {activeSubTab === 'services' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search ticket ID, customer, hardware..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
                <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
              </div>

              <select
                value={serviceStatusFilter}
                onChange={(e) => setServiceStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700"
              >
                <option value="All">All Ticket States</option>
                <option value="Site-Survey Scheduled">Site-Survey Scheduled</option>
                <option value="In-Progress">In-Progress</option>
                <option value="Awaiting Parts">Awaiting Parts</option>
                <option value="Completed - Awaiting Invoice Payment">Completed - Awaiting Invoice Payment</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Total <strong>{filteredServiceTickets.length}</strong> service tickets
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Ticket / Date</th>
                    <th className="px-3 py-3">Customer &amp; Location</th>
                    <th className="px-3 py-3">Hardware / Mode</th>
                    <th className="px-3 py-3">Problem Description</th>
                    <th className="px-3 py-3">Assigned Technician</th>
                    <th className="px-3 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredServiceTickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No service tickets in this view.
                      </td>
                    </tr>
                  ) : (
                    filteredServiceTickets.map((t) => (
                      <tr key={t.ticket_id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-slate-900 block">
                            {t.ticket_id}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {t.created_at}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <span className="font-bold text-slate-800 block">
                            {t.customer_name}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {t.target_municipality} &bull; {t.customer_phone}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <span className="px-2 py-0.5 bg-sky-50 text-sky-800 font-bold rounded-md text-[10px] block w-fit">
                            {t.hardware_type}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {t.service_type}
                          </span>
                        </td>

                        <td className="px-3 py-3 max-w-xs">
                          <p className="text-slate-700 truncate font-medium" title={t.problem_description}>
                            {t.problem_description}
                          </p>
                        </td>

                        <td className="px-3 py-3">
                          <span className="font-semibold text-slate-800 block">
                            {t.assigned_technician || 'Unassigned'}
                          </span>
                          {t.estimated_cost_npr && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              Est: NPR {t.estimated_cost_npr.toLocaleString()}
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase ${
                              t.ticket_status === 'Completed - Awaiting Invoice Payment'
                                ? 'bg-emerald-100 text-emerald-800'
                                : t.ticket_status === 'In-Progress'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {t.ticket_status}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenTicketModal(t)}
                              className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-lg transition cursor-pointer"
                            >
                              Manage
                            </button>
                            {onDeleteServiceTicket && (
                              <button
                                onClick={() => {
                                  if (currentUser?.username !== '@reliableadmin' && currentUser?.role !== 'Admin' && currentUser?.role !== 'Super Admin') {
                                    alert('Direct deletion is allowed for System Master (@reliableadmin) only.');
                                    return;
                                  }
                                  if (confirm(`Are you sure you want to permanently delete Service Ticket #${t.ticket_id} for ${t.customer_name}? This action cannot be undone.`)) {
                                    onDeleteServiceTicket(t.ticket_id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete Service Ticket (@reliableadmin only)"
                              >
                                <Trash2 size={13} />
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
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: CUSTOMER ACCOUNTS & RADIUS CONTROLLER */}
      {/* ========================================================================= */}
      {activeSubTab === 'customers' && (
        <div className="space-y-6">
          {/* Municipal Boundaries Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PERMITTED_MUNICIPALITIES.map((mun) => {
              const custCount = customerAccounts.filter((c) => c.municipality === mun).length;
              const ordCount = orders.filter((o) => o.municipality === mun).length;
              return (
                <div key={mun} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900">{mun}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                      Service Area
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Registered Users</span>
                      <span className="font-bold text-slate-800 text-base">{custCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Online Orders</span>
                      <span className="font-bold text-slate-800 text-base">{ordCount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Registered Customers Table & Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50">
              <div>
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Users size={15} className="text-sky-600" />
                  <span>Registered Storefront Customer Directory</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Manage accounts, edit profile info, block storefront access, send password reset emails, or remove accounts.
                </p>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[220px]">
                  <input
                    type="text"
                    placeholder="Search name, phone, email, PAN..."
                    value={custSearch}
                    onChange={(e) => setCustSearch(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                  <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                  {custSearch && (
                    <button
                      onClick={() => setCustSearch('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <select
                  value={custCategoryFilter}
                  onChange={(e) => setCustCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                >
                  <option value="All">All Categories</option>
                  <option value="Individual">Individual</option>
                  <option value="School / College">School / College</option>
                  <option value="Tea Estate / Factory">Tea Estate / Factory</option>
                  <option value="Hotel / Resort / Homestay">Hotel / Resort</option>
                  <option value="Cooperative / Sahakari">Cooperative</option>
                  <option value="Government / Ward Office">Government / Ward</option>
                  <option value="Commercial Business">Commercial Business</option>
                </select>

                <select
                  value={custStatusFilter}
                  onChange={(e) => setCustStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active Only</option>
                  <option value="Blocked">Blocked Only</option>
                  <option value="Suspended">Suspended Only</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 uppercase font-black text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Customer ID &amp; Name</th>
                    <th className="px-3 py-3">Contact Details</th>
                    <th className="px-3 py-3">Municipality &amp; Location</th>
                    <th className="px-3 py-3">Detailed Address</th>
                    <th className="px-3 py-3">Account Type &amp; PAN</th>
                    <th className="px-3 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Directory Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerAccounts
                    .filter((c) => {
                      if (custCategoryFilter !== 'All') {
                        const cat = c.account_category || (c.is_institutional ? 'Institutional' : 'Individual');
                        if (cat !== custCategoryFilter) return false;
                      }
                      if (custStatusFilter !== 'All') {
                        const st = c.status || 'Active';
                        if (st !== custStatusFilter) return false;
                      }
                      if (custSearch.trim()) {
                        const q = custSearch.toLowerCase();
                        const matchName = c.name.toLowerCase().includes(q);
                        const matchPhone = c.phone.includes(q) || (c.alt_phone && c.alt_phone.includes(q));
                        const matchEmail = (c.email || '').toLowerCase().includes(q);
                        const matchId = c.customer_id.toLowerCase().includes(q);
                        const matchPan = (c.organization_pan || '').includes(q);
                        const matchOrg = (c.organization_name || '').toLowerCase().includes(q);
                        const matchMun = (c.municipality || '').toLowerCase().includes(q);
                        if (!matchName && !matchPhone && !matchEmail && !matchId && !matchPan && !matchOrg && !matchMun) {
                          return false;
                        }
                      }
                      return true;
                    })
                    .map((c) => {
                      const isBlocked = c.status === 'Blocked';
                      return (
                        <tr key={c.customer_id} className={`hover:bg-slate-50/90 transition ${isBlocked ? 'bg-rose-50/30' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${isBlocked ? 'bg-rose-500' : 'bg-sky-600'}`}>
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block leading-tight">{c.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{c.customer_id}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3 font-mono font-medium text-slate-700">
                            <div className="flex items-center gap-1">
                              <Phone size={11} className="text-slate-400" />
                              <span>{c.phone}</span>
                            </div>
                            {c.alt_phone && (
                              <div className="text-[10px] text-slate-400">Alt: {c.alt_phone}</div>
                            )}
                            {c.email && (
                              <div className="text-[10.5px] text-sky-700 font-sans truncate max-w-[170px] mt-0.5 flex items-center gap-1">
                                <Mail size={10} className="text-slate-400 shrink-0" />
                                <span className="truncate">{c.email}</span>
                              </div>
                            )}
                          </td>

                          <td className="px-3 py-3">
                            <span className="font-semibold text-slate-800 block">{c.municipality}</span>
                            <span className="text-[10px] text-slate-500 block">{c.ward} {c.tole_area ? `• ${c.tole_area}` : ''}</span>
                            {c.landmark && (
                              <span className="text-[9.5px] text-amber-700 font-semibold block truncate max-w-[140px]">📍 {c.landmark}</span>
                            )}
                          </td>

                          <td className="px-3 py-3 text-slate-600 max-w-xs">
                            <p className="truncate font-medium text-xs">{c.detailed_address}</p>
                            <span className="text-[10px] text-slate-400 font-mono">Reg: {c.createdAt}</span>
                          </td>

                          <td className="px-3 py-3">
                            {c.is_institutional || c.account_category ? (
                              <div>
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-md block w-fit">
                                  {c.account_category || 'Corporate / School'}
                                </span>
                                {c.organization_name && (
                                  <span className="text-[10.5px] text-slate-800 font-bold block truncate max-w-[160px] mt-0.5">
                                    {c.organization_name}
                                  </span>
                                )}
                                {c.organization_pan && (
                                  <span className="text-[10px] text-slate-500 font-mono block">
                                    PAN: {c.organization_pan}
                                  </span>
                                )}
                                {c.designation && (
                                  <span className="text-[9.5px] text-slate-400 block">{c.designation}</span>
                                )}
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md">
                                Individual Account
                              </span>
                            )}
                          </td>

                          <td className="px-3 py-3 text-center">
                            {isBlocked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-700 font-bold text-[10px] rounded-full border border-rose-200">
                                <Ban size={10} />
                                <span>Blocked</span>
                              </span>
                            ) : c.status === 'Suspended' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-full border border-amber-200">
                                <AlertTriangle size={10} />
                                <span>Suspended</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full border border-emerald-200">
                                <CheckCircle2 size={10} />
                                <span>Active</span>
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Customer Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditCustomer(c)}
                                className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition border border-sky-200 cursor-pointer shadow-2xs"
                                title="Edit Customer Profile & Details"
                                id={`edit-customer-btn-${c.customer_id}`}
                              >
                                <Edit2 size={13} />
                              </button>

                              {/* Block / Unblock Customer Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleBlockCustomer(c)}
                                className={`p-1.5 rounded-lg transition border cursor-pointer shadow-2xs ${
                                  isBlocked
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                }`}
                                title={isBlocked ? 'Unblock Customer Account' : 'Block Customer Account from Storefront'}
                                id={`block-customer-btn-${c.customer_id}`}
                              >
                                {isBlocked ? <Unlock size={13} /> : <Ban size={13} />}
                              </button>

                              {/* Delete Customer Button - ACTIVE ONLY FOR ADMIN */}
                              {isAdmin ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomer(c)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition border border-rose-200 cursor-pointer shadow-2xs"
                                  title="Delete Customer Account (Admin Only)"
                                  id={`delete-customer-btn-${c.customer_id}`}
                                >
                                  <Trash2 size={13} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="p-1.5 bg-slate-100 text-slate-400 rounded-lg border border-slate-200 cursor-not-allowed opacity-50 flex items-center justify-center"
                                  title="Admin privilege required to delete customer accounts"
                                  id={`delete-customer-btn-disabled-${c.customer_id}`}
                                >
                                  <Lock size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: SERVICE HARDWARE SYSTEMS CONFIGURATION */}
      {/* ========================================================================= */}
      {activeSubTab === 'hardware-types' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-600" />
                <span>Service Hardware System Types Configurator</span>
              </h3>
              <p className="text-xs text-slate-500">
                Staff-configured hardware options shown in customer service booking &amp; ticket desk
              </p>
            </div>
            <button
              onClick={handleOpenAddHardware}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
              id="admin-add-hardware-type-button"
            >
              <Plus size={14} />
              <span>Add Hardware Option</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Hardware ID / System Name</th>
                    <th className="px-3 py-3">Nepali Translation</th>
                    <th className="px-3 py-3">Category Tag</th>
                    <th className="px-3 py-3">Turnaround Estimate</th>
                    <th className="px-3 py-3">Description &amp; Common Issues</th>
                    <th className="px-3 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hardwareTypes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No hardware types configured yet.
                      </td>
                    </tr>
                  ) : (
                    hardwareTypes.map((hw) => (
                      <tr key={hw.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{hw.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{hw.id}</span>
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-800">
                          {hw.name_nepali || '—'}
                        </td>
                        <td className="px-3 py-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded-md text-[10px]">
                            {hw.category_hint || 'General'}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-mono font-medium text-slate-600">
                          {hw.turnaround_estimate || '24-48 Hours'}
                        </td>
                        <td className="px-3 py-3 max-w-xs truncate text-slate-600">
                          {hw.description || '—'}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => handleToggleHardwareActive(hw)}
                            className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase transition cursor-pointer ${
                              hw.is_active
                                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                                : 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                            }`}
                            title="Click to toggle visibility in public storefront"
                          >
                            {hw.is_active ? 'Active' : 'Hidden'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditHardware(hw)}
                              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                              title="Edit Hardware Type"
                            >
                              <Edit2 size={13} />
                            </button>
                            {onDeleteHardwareType && (
                              <button
                                onClick={() => {
                                  if (confirm(`Remove hardware option "${hw.name}"?`)) {
                                    onDeleteHardwareType(hw.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete Hardware Type"
                              >
                                <Trash2 size={13} />
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
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 6: RELIABLETECH SUPPORT DESK & CUSTOMER MESSAGES */}
      {/* ========================================================================= */}
      {activeSubTab === 'messages' && (
        <div className="space-y-4 animate-fade-in">
          {/* Header Banner: Reliabletech Support Desk */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-sky-950 p-5 rounded-2xl text-white shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border border-white/10" id="reliabletech-support-desk-banner">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-sky-300 border border-white/15 shrink-0 shadow-xs">
                <Headphones size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white tracking-tight">Reliabletech Support Desk</h3>
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Direct Counter Connect
                  </span>
                </div>
                <p className="text-xs text-sky-200/90 font-medium mt-0.5 flex items-center gap-1.5">
                  <MapPin size={12} className="text-sky-400" />
                  <span>Fikkal Bazaar, Ilam • Live Counter Inquiries &amp; Customer Support</span>
                </p>
              </div>
            </div>

            {/* Quick Reply Preview Pill */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-3 max-w-lg w-full text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <span className="text-[10px] font-mono font-bold uppercase text-sky-200 flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-300" />
                  Instant Quick Reply Auto-Response
                </span>
                <span className="text-[10px] text-sky-200/80">Configured in Settings</span>
              </div>
              <p className="text-[11px] text-white/95 line-clamp-2 italic mt-1 font-sans leading-relaxed">
                &ldquo;{profile?.customerChatQuickReply || "Namaste! Thank you for messaging ReliableTech Support Desk (Fikkal Bazaar, Ilam • Direct Counter Connect). Our on-duty technical counter staff have received your message and will assist you immediately."}&rdquo;
              </p>
            </div>
          </div>

          {/* Top Bar: Search, Status Filter & Blocked Messengers Count */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search customer name, phone, message..."
                  value={msgSearch}
                  onChange={(e) => setMsgSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
                <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
              </div>

              <select
                value={msgStatusFilter}
                onChange={(e) => setMsgStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700"
              >
                <option value="All">All Inquiries ({customerInquiries.length})</option>
                <option value="Open">Pending / Open ({customerInquiries.filter(i => i.status === 'Open').length})</option>
                <option value="Forwarded to Admin">⚠️ Forwarded to Admin ({customerInquiries.filter(i => i.status === 'Forwarded to Admin').length})</option>
                <option value="Replied">Replied ({customerInquiries.filter(i => i.status === 'Replied').length})</option>
                <option value="Resolved">Resolved ({customerInquiries.filter(i => i.status === 'Resolved').length})</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {blockedMessengers.length > 0 && (
                <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-bold rounded-lg flex items-center gap-1">
                  <Ban size={12} />
                  <span>{blockedMessengers.length} Blocked Messengers</span>
                </span>
              )}
              <span className="text-slate-500 font-medium">
                Total <strong>{customerInquiries.length}</strong> inquiries logged
              </span>
            </div>
          </div>

          {/* Blocked Messengers Quick Registry (if any exist) */}
          {blockedMessengers.length > 0 && (
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-900 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-rose-600" />
                  <span>Blocked Messengers Registry ({blockedMessengers.length})</span>
                </span>
                <span className="text-[11px] text-rose-700">Blocked users cannot post new chat messages</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {blockedMessengers.map((b, idx) => (
                  <div key={idx} className="bg-white border border-rose-200 rounded-lg px-2.5 py-1.5 flex items-center gap-2 shadow-2xs">
                    <div>
                      <span className="font-bold text-slate-800">{b.target_phone_or_email}</span>
                      <span className="text-[10px] text-slate-400 block">{b.reason || 'Spam / Policy violation'}</span>
                    </div>
                    {onUnblockMessenger && (currentUser.role === 'Super Admin' || currentUser.role === 'Admin') && (
                      <button
                        onClick={() => onUnblockMessenger(b.target_phone_or_email)}
                        className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded transition cursor-pointer"
                        title="Unblock this user"
                      >
                        Unblock
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inquiries Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Customer Details</th>
                    <th className="px-3 py-3">Subject / Query</th>
                    <th className="px-3 py-3">Message Snippet</th>
                    <th className="px-3 py-3">Staff Replies</th>
                    <th className="px-3 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeInquiriesList
                    .filter((inq) => {
                      if (msgStatusFilter !== 'All' && inq.status !== msgStatusFilter) return false;
                      if (!msgSearch) return true;
                      const q = msgSearch.toLowerCase();
                      const cName = inq.customer_name || inq.customerName || '';
                      const cPhone = inq.customer_phone || inq.customerPhone || '';
                      const cEmail = inq.customer_email || inq.customerEmail || '';
                      const cSub = inq.subject || '';
                      const cMsg = inq.message || inq.initialMessage || '';
                      return (
                        cName.toLowerCase().includes(q) ||
                        cPhone.toLowerCase().includes(q) ||
                        cEmail.toLowerCase().includes(q) ||
                        cSub.toLowerCase().includes(q) ||
                        cMsg.toLowerCase().includes(q)
                      );
                    })
                    .map((inq) => {
                      const inqId = inq.inquiry_id || inq.id || '';
                      const cName = inq.customer_name || inq.customerName || 'Customer';
                      const cPhone = inq.customer_phone || inq.customerPhone || '';
                      const cEmail = inq.customer_email || inq.customerEmail || '';
                      const isBlocked = blockedMessengers.some(
                        (b) => (cPhone && b.target_phone_or_email === cPhone) || (cEmail && b.target_phone_or_email === cEmail)
                      );

                      return (
                        <tr key={inqId} className={`hover:bg-slate-50/80 transition ${inq.status === 'Forwarded to Admin' ? 'bg-purple-50/40' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {cName.charAt(0) || 'C'}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block flex items-center gap-1">
                                  {cName}
                                  {isBlocked && (
                                    <span className="px-1.5 py-0.2 text-[9px] bg-rose-100 text-rose-800 rounded font-black">
                                      BLOCKED
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {cPhone} {cEmail ? `• ${cEmail}` : ''}
                                </span>
                                <span className="text-[9px] text-slate-400 block font-mono">
                                  {inq.created_at || inq.timestamp}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <span className="font-semibold text-slate-800 block">{inq.subject || 'General Inquiry'}</span>
                            {inq.associated_order_id && (
                              <span className="text-[10px] font-mono text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                                Order #{inq.associated_order_id}
                              </span>
                            )}
                          </td>

                          <td className="px-3 py-3 max-w-xs">
                            <p className="line-clamp-2 text-slate-600 italic">
                              "{inq.message}"
                            </p>
                          </td>

                          <td className="px-3 py-3">
                            {inq.replies && inq.replies.length > 0 ? (
                              <div>
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md text-[10px] border border-emerald-200 inline-flex items-center gap-1">
                                  <CheckCheck size={11} />
                                  <span>{inq.replies.length} staff response(s)</span>
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                                  Latest by: {inq.replies[inq.replies.length - 1].staff_name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">No replies yet</span>
                            )}
                          </td>

                          <td className="px-3 py-3 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase tracking-wider ${
                                inq.status === 'Resolved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : inq.status === 'Replied'
                                  ? 'bg-sky-100 text-sky-800'
                                  : inq.status === 'Forwarded to Admin'
                                  ? 'bg-purple-100 text-purple-800 font-black animate-pulse'
                                  : 'bg-amber-100 text-amber-800 animate-pulse'
                              }`}
                            >
                              {inq.status}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* 1. Reply Button */}
                              <button
                                onClick={() => {
                                  setSelectedInquiryForReply(inq);
                                  setReplyInputText('');
                                }}
                                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Open chat reply composer"
                              >
                                <Reply size={12} />
                                <span>Reply</span>
                              </button>

                              {/* 2. Admin Assistant / Forward to Admin Button */}
                              {inq.status !== 'Forwarded to Admin' && onForwardInquiryToAdmin && (
                                <button
                                  onClick={() => {
                                    onForwardInquiryToAdmin(inq.inquiry_id || inq.id || '');
                                    onToast('Inquiry escalated to Admin Assistant successfully', 'info');
                                  }}
                                  className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] rounded-lg transition flex items-center gap-1 cursor-pointer"
                                  title="Forward this customer inquiry to Super Admin / Admin for decision"
                                >
                                  <Sparkles size={11} />
                                  <span>Forward to Admin</span>
                                </button>
                              )}

                              {/* 3. Block Messenger / User Button (Admins only) */}
                              {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin') && !isBlocked && (
                                <button
                                  onClick={() => setBlockingTarget({ inquiry: inq, reason: 'Inappropriate message / spam' })}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Block this messenger from chatting"
                                >
                                  <UserX size={14} />
                                </button>
                              )}

                              {/* 4. Delete Inquiry Button (@reliableadmin only) */}
                              {onDeleteInquiry && (
                                <button
                                  onClick={() => {
                                    if (currentUser?.username !== '@reliableadmin' && currentUser?.role !== 'Admin' && currentUser?.role !== 'Super Admin') {
                                      alert('Direct deletion is allowed for System Master (@reliableadmin) only.');
                                      return;
                                    }
                                    if (confirm(`Are you sure you want to permanently delete customer inquiry #${inqId} from ${cName}? This action cannot be undone.`)) {
                                      onDeleteInquiry(inqId);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Delete Inquiry (@reliableadmin only)"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {activeInquiriesList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        <MessageSquare size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-sm">No customer inquiries logged yet</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Messages sent via the Reliabletech floating chat widget on storefront will appear here.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 7: TRACK ORDERS & RECEIPTS DESK */}
      {/* ========================================================================= */}
      {activeSubTab === 'tracking' && (
        <div className="space-y-4 animate-fade-in">
          {/* Tracking Search Form */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Search size={18} className="text-sky-600" />
              <h3 className="font-bold text-sm text-slate-800">
                Live Order &amp; Delivery Tracking Desk (Ilam Network)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Enter an Order ID (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">ORD-8384-9021</code>), customer phone number, or tracking code to verify live fulfillment status and print official receipts.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Order ID or Customer Phone (e.g. 9842600000)..."
                value={trackingSearchInput}
                onChange={(e) => setTrackingSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const q = trackingSearchInput.trim().toLowerCase();
                    const found = orders.find(
                      o => o.order_id.toLowerCase() === q || o.customer_phone.toLowerCase().includes(q) || (o.tracking_number && o.tracking_number.toLowerCase() === q)
                    );
                    if (found) {
                      setTrackedOrderResult(found);
                    } else {
                      onToast('No order matching that ID or phone number was found', 'error');
                    }
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  const q = trackingSearchInput.trim().toLowerCase();
                  const found = orders.find(
                    o => o.order_id.toLowerCase() === q || o.customer_phone.toLowerCase().includes(q) || (o.tracking_number && o.tracking_number.toLowerCase() === q)
                  );
                  if (found) {
                    setTrackedOrderResult(found);
                  } else {
                    onToast('No order matching that ID or phone number was found', 'error');
                  }
                }}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Search size={14} />
                <span>Track Order</span>
              </button>
            </div>
          </div>

          {/* Tracked Order Result View */}
          {trackedOrderResult ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-sky-700">TRACKING ORDER</span>
                  <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                    <span>#{trackedOrderResult.order_id}</span>
                    <span className="text-xs px-2.5 py-0.5 bg-sky-100 text-sky-800 rounded-full font-bold">
                      {trackedOrderResult.order_state}
                    </span>
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Placed on {trackedOrderResult.created_at_bs || '2083-04-01'} &bull; Customer: <strong>{trackedOrderResult.customer_name}</strong> ({trackedOrderResult.customer_phone})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReceiptModalOrder(trackedOrderResult)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Receipt size={14} />
                    <span>Print Order Receipt &amp; Maintenance</span>
                  </button>
                  <button
                    onClick={() => setTrackedOrderResult(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Visual 5-Step Order Lifecycle Tracker */}
              <div className="py-2">
                <span className="text-xs font-bold text-slate-700 block mb-4">Fulfillment &amp; Dispatch Timeline:</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                  {[
                    { title: '1. Placed', desc: 'Order Logged', state: 'Pending Verification', isDone: true },
                    { 
                      title: '2. Verified', 
                      desc: trackedOrderResult.payment_verification_status === 'Verified' ? 'Payment Approved' : 'Payment Review', 
                      state: 'Verified',
                      isDone: trackedOrderResult.payment_verification_status === 'Verified' || trackedOrderResult.order_state !== 'Pending Verification'
                    },
                    { 
                      title: '3. Packed', 
                      desc: 'Ready at Store', 
                      state: 'Processing/Packing',
                      isDone: ['Processing/Packing', 'Dispatched via Courier', 'Delivered & Closed'].includes(trackedOrderResult.order_state)
                    },
                    { 
                      title: '4. Dispatched', 
                      desc: trackedOrderResult.assigned_courier_rider || 'In Transit', 
                      state: 'Dispatched via Courier',
                      isDone: ['Dispatched via Courier', 'Delivered & Closed'].includes(trackedOrderResult.order_state)
                    },
                    { 
                      title: '5. Delivered', 
                      desc: 'Closed in Ilam', 
                      state: 'Delivered & Closed',
                      isDone: trackedOrderResult.order_state === 'Delivered & Closed'
                    }
                  ].map((step, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border transition ${step.isDone ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      <div className={`w-6 h-6 mx-auto mb-1.5 rounded-full flex items-center justify-center font-bold text-xs ${step.isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {step.isDone ? <Check size={12} /> : idx + 1}
                      </div>
                      <span className="font-bold text-xs block">{step.title}</span>
                      <span className="text-[10px] block opacity-80 mt-0.5">{step.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Destination */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <MapPin size={13} className="text-sky-600" />
                    <span>Destination (Ilam District)</span>
                  </span>
                  <p className="font-extrabold text-slate-900 text-sm">
                    {trackedOrderResult.municipality} ({trackedOrderResult.ward})
                  </p>
                  <p className="text-slate-600">{trackedOrderResult.delivery_address}</p>
                </div>

                {/* Payment */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <CreditCard size={13} className="text-emerald-600" />
                    <span>Payment Information</span>
                  </span>
                  <p className="font-extrabold text-slate-900 text-sm">
                    {trackedOrderResult.payment_method} &bull; NPR {trackedOrderResult.total_amount_npr.toLocaleString()}
                  </p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                    trackedOrderResult.payment_verification_status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    Status: {trackedOrderResult.payment_verification_status || 'Under Review'}
                  </span>
                </div>

                {/* Courier Rider */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Truck size={13} className="text-indigo-600" />
                    <span>Courier &amp; Tracking Code</span>
                  </span>
                  <p className="font-extrabold text-slate-900 text-sm">
                    {trackedOrderResult.assigned_courier_rider || 'RTSS Express Courier'}
                  </p>
                  <p className="text-slate-500 font-mono text-[11px]">
                    Tracking Ref: {trackedOrderResult.tracking_number || `TRK-${trackedOrderResult.order_id}`}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700">Order Items &amp; Warranty:</span>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2 text-xs">
                  {trackedOrderResult.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-200 last:border-0">
                      <div>
                        <span className="font-bold text-slate-900">{item.product_name}</span>
                        <span className="text-slate-500 font-mono block text-[10px]">
                          Qty: {item.quantity} &bull; Warranty: {item.warranty_duration || '1 Year Standard'} &bull; 1-Year Free Maintenance
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        NPR {(item.final_price_npr * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 text-center text-slate-400 space-y-2">
              <Search size={36} className="mx-auto text-slate-300" />
              <p className="font-bold text-sm text-slate-700">No active tracking search loaded</p>
              <p className="text-xs text-slate-400">
                Use the search bar above or choose an order from the Dispatch Desk to review live courier status.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ADD / EDIT PRODUCT MODAL */}
      {/* ========================================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] my-auto">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-sky-400" />
                <h3 className="font-bold text-base">
                  {editingProductId ? 'Edit Store Product' : 'Add New Store Product'}
                </h3>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2 sm:col-span-1 relative">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">Product Title *</label>
                    <span className="text-[10px] text-slate-400 font-semibold">Select inventory or type new</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={prodName}
                      onFocus={() => setIsInventoryDropdownOpen(true)}
                      onChange={(e) => {
                        setProdName(e.target.value);
                        setIsInventoryDropdownOpen(true);
                      }}
                      placeholder="Type name or select from inventory stock..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white pr-8 font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setIsInventoryDropdownOpen((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                      title="Toggle inventory stock list"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  {/* Searchable Inventory Stock Popover */}
                  {isInventoryDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs animate-scale-in">
                      <div className="p-2 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-bold sticky top-0 z-10 border-b border-slate-100">
                        <span>Inventory Stock Items ({inventoryStock.length})</span>
                        <button
                          type="button"
                          onClick={() => setIsInventoryDropdownOpen(false)}
                          className="text-slate-400 hover:text-slate-700 text-[10px] font-bold cursor-pointer"
                        >
                          ✕ Close
                        </button>
                      </div>

                      {/* Custom Item Option */}
                      {prodName.trim() && (
                        <button
                          type="button"
                          onClick={() => setIsInventoryDropdownOpen(false)}
                          className="w-full text-left p-2.5 hover:bg-sky-50 transition flex items-center gap-1.5 text-sky-800 font-bold bg-sky-50/40 cursor-pointer"
                        >
                          <Plus size={13} className="text-sky-600 shrink-0" />
                          <span className="truncate">Use "{prodName}" as new custom item (Not linked to inventory stock)</span>
                        </button>
                      )}

                      {/* Filtered Inventory Items */}
                      {inventoryStock
                        .filter((item) => !prodName || item.name.toLowerCase().includes(prodName.toLowerCase()))
                        .map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setProdName(item.name);
                              if (item.costPrice > 0) setProdCostPrice(item.costPrice);
                              if (item.sellingPrice > 0) setProdSellingPrice(item.sellingPrice);
                              if (item.quantity !== undefined) setProdStock(item.quantity);
                              setIsInventoryDropdownOpen(false);
                              onToast(`Selected inventory item "${item.name}" (Stock: ${item.quantity} ${item.unitType || 'Pcs'})`, 'info');
                            }}
                            className="w-full text-left p-2.5 hover:bg-slate-50 transition flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-slate-800 truncate">{item.name}</div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                                <span>Cost: Rs. {item.costPrice.toLocaleString()}</span>
                                <span>&bull;</span>
                                <span>Selling: Rs. {item.sellingPrice.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                                item.quantity > 5
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.quantity > 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                Stock: {item.quantity} {item.unitType || 'Pcs'}
                              </span>
                            </div>
                          </button>
                        ))}

                      {inventoryStock.filter((item) => !prodName || item.name.toLowerCase().includes(prodName.toLowerCase())).length === 0 && (
                        <div className="p-3 text-center text-slate-400 text-[11px]">
                          No matching inventory items. Type a custom name to add as a standalone store product.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Category *</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value as EcommerceCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-semibold"
                  >
                    <option value="Stationery">Stationery</option>
                    <option value="Computer Parts">Computer Parts</option>
                    <option value="CCTV & Security">CCTV &amp; Security</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Cost Price (NPR)</label>
                  <input
                    type="number"
                    min="0"
                    value={prodCostPrice}
                    onChange={(e) => setProdCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Base Selling Price (NPR) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={prodSellingPrice}
                    onChange={(e) => setProdSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono font-bold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Physical Stock Count *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* Discount Settings */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Discount Scheme</label>
                  <select
                    value={prodDiscountType}
                    onChange={(e) => setProdDiscountType(e.target.value as EcommerceDiscountType)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="None">No Discount</option>
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Fixed_Amount">Fixed Amount (NPR)</option>
                  </select>
                </div>

                {prodDiscountType !== 'None' && (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">
                      Discount Value ({prodDiscountType === 'Percentage' ? '%' : 'NPR'})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={prodDiscountValue}
                      onChange={(e) => setProdDiscountValue(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-emerald-700"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Brand Name</label>
                  <input
                    type="text"
                    value={prodBrand}
                    onChange={(e) => setProdBrand(e.target.value)}
                    placeholder="e.g. Hikvision, Kingston, Casio"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Warranty Coverage</label>
                  <input
                    type="text"
                    value={prodWarranty}
                    onChange={(e) => setProdWarranty(e.target.value)}
                    placeholder="e.g. 1 Year Replacement"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-sky-600" />
                    <span>Product Image (URL or Upload Image File)</span>
                  </label>
                  <label className="px-2.5 py-1 bg-sky-100 hover:bg-sky-200 text-sky-800 text-[11px] font-bold rounded-lg cursor-pointer transition flex items-center gap-1">
                    <Upload size={12} />
                    <span>Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2.5 * 1024 * 1024) {
                            onToast('Please upload an image smaller than 2.5MB', 'error');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (loadEvent) => {
                            if (loadEvent.target?.result) {
                              setProdImageUrl(loadEvent.target.result as string);
                              onToast('Product image uploaded successfully', 'success');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={prodImageUrl}
                    onChange={(e) => setProdImageUrl(e.target.value)}
                    placeholder="Enter https:// image URL or click Upload Image above..."
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl focus:bg-white font-mono text-xs"
                  />
                  {prodImageUrl && (
                    <button
                      type="button"
                      onClick={() => setProdImageUrl('')}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      title="Clear image"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {prodImageUrl && (
                  <div className="flex items-center gap-3 pt-1">
                    <img
                      src={prodImageUrl}
                      alt="Product Preview"
                      className="w-16 h-16 object-cover rounded-lg border border-slate-200 bg-white"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-[11px] text-slate-500">
                      <span className="font-bold text-emerald-700 block">✓ Image Attached</span>
                      <span>Will display in public store catalog &amp; customer receipt</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="Short description for customer storefront..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Key Features / Bullets (One per line)</label>
                <textarea
                  rows={3}
                  value={prodFeaturesText}
                  onChange={(e) => setProdFeaturesText(e.target.value)}
                  placeholder="Pure copper wiring&#10;1080P Full HD&#10;Mobile remote viewing"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodIsActive}
                    onChange={(e) => setProdIsActive(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span className="font-bold text-slate-800">Publish on Storefront (Active)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodFeatured}
                    onChange={(e) => setProdFeatured(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-bold text-slate-800">⭐ Mark as Featured Item</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ORDER INSPECTION & DISPATCH MODAL */}
      {/* ========================================================================= */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] my-auto">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-emerald-400" />
                <h3 className="font-bold text-base">
                  Dispatch Inspector: Order #{selectedOrderForModal.order_id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Customer & Location */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px]">Customer Name</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedOrderForModal.customer_name}
                  </span>
                  <span className="text-slate-500 font-mono block">
                    {selectedOrderForModal.customer_phone}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Destination (Ilam)</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedOrderForModal.municipality}
                  </span>
                  <span className="text-slate-600 block">
                    {selectedOrderForModal.delivery_address} ({selectedOrderForModal.ward})
                  </span>
                </div>
              </div>

              {/* Payment Proof Verification Block */}
              <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-900">
                    Payment Method: {selectedOrderForModal.payment_method}
                  </span>
                  <span className="font-mono font-black text-slate-900">
                    NPR {selectedOrderForModal.total_amount_npr.toLocaleString()}
                  </span>
                </div>

                {selectedOrderForModal.gateway_ref_token && (
                  <div className="flex items-center justify-between gap-2 text-emerald-800 font-mono bg-white p-2.5 rounded-lg border border-emerald-200">
                    <div>
                      <strong>eSewa Ref Token:</strong> {selectedOrderForModal.gateway_ref_token}
                    </div>
                    {selectedOrderForModal.payment_screenshot_url && (
                      <button
                        type="button"
                        onClick={() => setPreviewProofModal({
                          title: `eSewa Payment Proof (Ref: ${selectedOrderForModal.gateway_ref_token})`,
                          imageUrl: selectedOrderForModal.payment_screenshot_url!,
                          orderId: selectedOrderForModal.order_id
                        })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-sans font-bold text-[11px] rounded-md transition cursor-pointer shrink-0 border border-emerald-200"
                        title="View uploaded payment receipt screenshot"
                      >
                        <Eye size={12} />
                        <span>View Transaction Proof</span>
                      </button>
                    )}
                  </div>
                )}

                {selectedOrderForModal.rbb_voucher_url && (
                  <div className="flex items-center justify-between gap-2 text-indigo-800 font-mono bg-white p-2.5 rounded-lg border border-indigo-200">
                    <div>
                      <strong>RBB Voucher Link / Ref:</strong> {selectedOrderForModal.rbb_voucher_url}
                    </div>
                    {(selectedOrderForModal.payment_screenshot_url || selectedOrderForModal.rbb_voucher_url.startsWith('data:') || selectedOrderForModal.rbb_voucher_url.startsWith('http')) && (
                      <button
                        type="button"
                        onClick={() => setPreviewProofModal({
                          title: `RBB Bank Voucher Proof`,
                          imageUrl: selectedOrderForModal.payment_screenshot_url || selectedOrderForModal.rbb_voucher_url!,
                          orderId: selectedOrderForModal.order_id
                        })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-sans font-bold text-[11px] rounded-md transition cursor-pointer shrink-0 border border-indigo-200"
                        title="View uploaded voucher image"
                      >
                        <Eye size={12} />
                        <span>View Transaction Proof</span>
                      </button>
                    )}
                  </div>
                )}

                {(selectedOrderForModal.coop_txn_id || (selectedOrderForModal as any).coopTxnId) && (
                  <div className="flex items-center justify-between gap-2 text-amber-800 font-mono bg-white p-2.5 rounded-lg border border-amber-200">
                    <div>
                      <strong>Cooperative QR Txn ID:</strong> {selectedOrderForModal.coop_txn_id || (selectedOrderForModal as any).coopTxnId}
                    </div>
                    {selectedOrderForModal.payment_screenshot_url && (
                      <button
                        type="button"
                        onClick={() => setPreviewProofModal({
                          title: `Cooperative QR Payment Proof`,
                          imageUrl: selectedOrderForModal.payment_screenshot_url!,
                          orderId: selectedOrderForModal.order_id
                        })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-sans font-bold text-[11px] rounded-md transition cursor-pointer shrink-0 border border-amber-200"
                        title="View uploaded QR payment screenshot"
                      >
                        <Eye size={12} />
                        <span>View Transaction Proof</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Generic / QR Payment Screenshot upload if present */}
                {selectedOrderForModal.payment_screenshot_url && !selectedOrderForModal.gateway_ref_token && !selectedOrderForModal.rbb_voucher_url && !(selectedOrderForModal as any).coopTxnId && !selectedOrderForModal.coop_txn_id && (
                  <div className="flex items-center justify-between gap-2 text-sky-900 font-mono bg-white p-2.5 rounded-lg border border-sky-200">
                    <div>
                      <strong>QR Payment Screenshot Uploaded</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewProofModal({
                        title: `QR Transaction Proof (Order #${selectedOrderForModal.order_id})`,
                        imageUrl: selectedOrderForModal.payment_screenshot_url!,
                        orderId: selectedOrderForModal.order_id
                      })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 font-sans font-bold text-[11px] rounded-md transition cursor-pointer shrink-0 border border-sky-200"
                      title="View uploaded payment receipt screenshot"
                    >
                      <Eye size={12} />
                      <span>View Transaction Proof</span>
                    </button>
                  </div>
                )}

                {selectedOrderForModal.organization_pan && (
                  <div className="text-purple-800 font-mono bg-white p-2.5 rounded-lg border border-purple-200">
                    <strong>Institutional PAN:</strong> {selectedOrderForModal.organization_pan} &bull;{' '}
                    {selectedOrderForModal.organization_name}
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-800 block">Order Items:</span>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                  {selectedOrderForModal.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                      <span>
                        {item.quantity}x <strong>{item.product_name}</strong>
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        NPR {(item.final_price_npr * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reverse Voucher Banner for Cancelled Orders */}
              {selectedOrderForModal.order_state === 'Cancelled' && (
                <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-rose-900 text-xs flex items-center gap-1.5">
                      <RotateCcw size={14} className="text-rose-600" />
                      <span>Order Cancelled &amp; Reverse Voucher Issued</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setReverseVoucherModalOrder(selectedOrderForModal)}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Printer size={12} />
                      <span>Print Reverse Voucher</span>
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-700 space-y-0.5">
                    {selectedOrderForModal.reverse_voucher_number && (
                      <div><strong>Reverse Voucher No:</strong> <span className="font-mono">{selectedOrderForModal.reverse_voucher_number}</span></div>
                    )}
                    {selectedOrderForModal.cancellation_reason && (
                      <div><strong>Reason:</strong> {selectedOrderForModal.cancellation_reason}</div>
                    )}
                    {selectedOrderForModal.refund_amount && (
                      <div><strong>Refund Amount:</strong> NPR {selectedOrderForModal.refund_amount.toLocaleString()} ({selectedOrderForModal.refund_method || 'Refunded'})</div>
                    )}
                  </div>
                </div>
              )}

              {/* Status & Courier Update */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Update Order State</label>
                  <select
                    value={orderStatusSelect}
                    onChange={(e) => setOrderStatusSelect(e.target.value as OrderLifecycleState)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bold"
                  >
                    <option value="Pending Verification">Pending Verification</option>
                    <option value="Processing/Packing">Processing/Packing</option>
                    <option value="Dispatched via Courier">Dispatched via Courier</option>
                    <option value="Delivered & Closed">Delivered &amp; Closed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center justify-between text-xs">
                    <span>Assigned Delivery Rider (Staff Member)</span>
                    <span className="text-[10px] text-sky-600 font-semibold bg-sky-50 px-1.5 py-0.5 rounded-md border border-sky-200">
                      From User Accounts
                    </span>
                  </label>
                  <div className="space-y-1.5">
                    <select
                      value={
                        staffUsers?.some(u => `${u.name} (${u.post || u.role})` === orderCourierInput || u.name === orderCourierInput)
                          ? (staffUsers.find(u => `${u.name} (${u.post || u.role})` === orderCourierInput)?.name
                              ? `${staffUsers.find(u => `${u.name} (${u.post || u.role})` === orderCourierInput)!.name} (${staffUsers.find(u => `${u.name} (${u.post || u.role})` === orderCourierInput)!.post || staffUsers.find(u => `${u.name} (${u.post || u.role})` === orderCourierInput)!.role})`
                              : orderCourierInput)
                          : (orderCourierInput ? '__CUSTOM__' : '')
                      }
                      onChange={(e) => {
                        if (e.target.value === '__CUSTOM__') {
                          setOrderCourierInput('');
                        } else {
                          setOrderCourierInput(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-semibold"
                    >
                      <option value="">-- Select Staff User / Admin as Delivery Rider --</option>
                      {staffUsers?.map(staff => {
                        const val = `${staff.name} (${staff.post || staff.role})`;
                        return (
                          <option key={staff.id} value={val}>
                            👤 {staff.name} — {staff.post || staff.designationNepali || staff.role} {staff.staffId ? `[ID: ${staff.staffId}]` : `(@${staff.username})`}
                          </option>
                        );
                      })}
                      <option value="__CUSTOM__">➕ Enter Custom / External Courier</option>
                    </select>

                    {(!staffUsers?.some(u => `${u.name} (${u.post || u.role})` === orderCourierInput || u.name === orderCourierInput) || !orderCourierInput) && (
                      <input
                        type="text"
                        value={orderCourierInput}
                        onChange={(e) => setOrderCourierInput(e.target.value)}
                        placeholder="Or type custom rider / courier partner name..."
                        className="w-full px-3 py-1.5 bg-sky-50/50 border border-sky-200 rounded-xl focus:bg-white text-xs font-medium"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {onConvertToInvoice && selectedOrderForModal.order_state !== 'Cancelled' && (
                    <button
                      type="button"
                      onClick={() => {
                        onConvertToInvoice(selectedOrderForModal);
                        setSelectedOrderForModal(null);
                      }}
                      className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs"
                    >
                      <Receipt size={14} />
                      <span>Create Sales Invoice</span>
                    </button>
                  )}

                  {selectedOrderForModal.order_state !== 'Cancelled' && (
                    <button
                      type="button"
                      onClick={() => handleInitiateCancel(selectedOrderForModal)}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs"
                    >
                      <RotateCcw size={14} />
                      <span>Cancel &amp; Issue Reverse Voucher</span>
                    </button>
                  )}

                  {onDeleteOrder && (
                    <button
                      type="button"
                      onClick={() => {
                        if (currentUser?.username !== '@reliableadmin' && currentUser?.role !== 'Admin' && currentUser?.role !== 'Super Admin') {
                          alert('Direct deletion is allowed for System Master (@reliableadmin) only.');
                          return;
                        }
                        if (confirm(`Are you sure you want to permanently delete Order #${selectedOrderForModal.order_id} for ${selectedOrderForModal.customer_name}? This action cannot be undone.`)) {
                          onDeleteOrder(selectedOrderForModal.order_id);
                          setSelectedOrderForModal(null);
                        }
                      }}
                      className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs shadow-xs"
                      title="Permanently Delete Order (@reliableadmin only)"
                    >
                      <Trash2 size={14} />
                      <span>Delete Order</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer text-xs"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveOrderStatus}
                    className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer text-xs"
                  >
                    Save Status Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SERVICE TICKET INSPECTION MODAL */}
      {/* ========================================================================= */}
      {selectedTicketForModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] my-auto">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Wrench size={18} className="text-sky-400" />
                <h3 className="font-bold text-base">
                  Service Ticket #{selectedTicketForModal.ticket_id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicketForModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-900">{selectedTicketForModal.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hardware &amp; Mode:</span>
                  <span className="font-bold text-slate-900">
                    {selectedTicketForModal.hardware_type} ({selectedTicketForModal.service_type})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-bold text-slate-900">
                    {selectedTicketForModal.target_municipality} &bull; {selectedTicketForModal.customer_phone}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Problem Description</label>
                <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800">
                  {selectedTicketForModal.problem_description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Ticket Status</label>
                  <select
                    value={ticketStatusSelect}
                    onChange={(e) => setTicketStatusSelect(e.target.value as ServiceTicketLifecycleState)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bold"
                  >
                    <option value="Site-Survey Scheduled">Site-Survey Scheduled</option>
                    <option value="In-Progress">In-Progress</option>
                    <option value="Awaiting Parts">Awaiting Parts</option>
                    <option value="Completed - Awaiting Invoice Payment">
                      Completed - Awaiting Invoice Payment
                    </option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Assigned Technician</label>
                  <select
                    value={ticketTechSelect}
                    onChange={(e) => setTicketTechSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-semibold"
                  >
                    {staffUsers.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Actual Cost (NPR)</label>
                <input
                  type="number"
                  min="0"
                  value={ticketActualCostInput}
                  onChange={(e) => setTicketActualCostInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Technician Diagnostic Notes</label>
                <textarea
                  rows={3}
                  value={ticketNotesInput}
                  onChange={(e) => setTicketNotesInput(e.target.value)}
                  placeholder="Record parts replaced, test results, resolution notes..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="pt-4 flex items-center justify-between gap-2 border-t border-slate-100">
                {onDeleteServiceTicket && (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentUser?.username !== '@reliableadmin' && currentUser?.role !== 'Admin' && currentUser?.role !== 'Super Admin') {
                        alert('Direct deletion is allowed for System Master (@reliableadmin) only.');
                        return;
                      }
                      if (confirm(`Are you sure you want to permanently delete Service Ticket #${selectedTicketForModal.ticket_id} for ${selectedTicketForModal.customer_name}? This action cannot be undone.`)) {
                        onDeleteServiceTicket(selectedTicketForModal.ticket_id);
                        setSelectedTicketForModal(null);
                      }
                    }}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs shadow-xs"
                    title="Permanently Delete Service Ticket (@reliableadmin only)"
                  >
                    <Trash2 size={14} />
                    <span>Delete Ticket</span>
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedTicketForModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTicketUpdate}
                    className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer text-xs"
                  >
                    Save Ticket Updates
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. DISPATCH SLIP PRINT PREVIEW MODAL */}
      {/* ========================================================================= */}
      {printingOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fade-in print:p-0 print:bg-white">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] my-auto print:max-h-none print:shadow-none print:border-0">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden shrink-0">
              <span className="font-bold text-sm">Courier Delivery Dispatch Memo</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!printingOrder) return;
                    if (window.openUniversalEmailModal) {
                      window.openUniversalEmailModal({
                        recipientEmail: printingOrder.customer_email || '',
                        recipientName: printingOrder.customer_name || 'Valued Customer',
                        subject: `Courier Delivery Dispatch Memo (#${printingOrder.order_number}) - RTSS`,
                        message: `Dear ${printingOrder.customer_name},\n\nYour courier delivery dispatch slip is ready for order #${printingOrder.order_number}.\n\nCourier/Shipping Details:\n- Customer: ${printingOrder.customer_name}\n- Phone: ${printingOrder.customer_phone}\n- Address: ${printingOrder.shipping_address}\n- Order Value: NPR ${(printingOrder.total_amount_npr || printingOrder.grand_total_npr || 0).toLocaleString()}\n\nReliableTech Services & Suppliers\nFikkal, Ilam, Nepal`,
                        emailType: 'Courier Dispatch Slip',
                        documentRef: printingOrder.order_number
                      });
                    }
                  }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer"
                  title="Send Dispatch Slip through Email"
                >
                  <Mail size={13} />
                  <span>Send Email</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Printer size={13} />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setPrintingOrder(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-4 text-xs font-sans text-slate-900 print:p-4">
              {/* Header */}
              <div className="text-center border-b pb-3 space-y-1">
                <h2 className="text-base font-black uppercase tracking-tight">
                  {profile.name || 'ReliableTech Services & Suppliers'}
                </h2>
                <p className="text-[10px] text-slate-600">
                  Fikkal-10, Suryodaya, Ilam, Nepal &bull; Phone: {profile.phone || '9852620100'}
                </p>
                <span className="inline-block bg-slate-100 text-slate-800 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-slate-300">
                  COURIER DISPATCH &amp; DELIVERY SLIP
                </span>
              </div>

              {/* Order Meta */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Order Number:</span>
                  <span className="font-mono font-bold text-slate-900">{printingOrder.order_id}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Date of Order:</span>
                  <span className="font-mono font-bold">{printingOrder.created_at}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Recipient Customer:</span>
                  <span className="font-bold">{printingOrder.customer_name}</span>
                  <span className="block font-mono text-slate-600">{printingOrder.customer_phone}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Delivery Address:</span>
                  <span className="font-bold">{printingOrder.municipality}</span>
                  <span className="block text-slate-600">
                    {printingOrder.delivery_address} ({printingOrder.ward})
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full border-t border-b border-slate-300 text-left text-[11px] my-3">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-1.5">Item Description</th>
                    <th className="py-1.5 text-center">Qty</th>
                    <th className="py-1.5 text-right">Amount (NPR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {printingOrder.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-1 font-medium">{it.product_name}</td>
                      <td className="py-1 text-center font-mono">{it.quantity}</td>
                      <td className="py-1 text-right font-mono font-bold">
                        {(it.final_price_npr * it.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="space-y-1 text-right text-[11px]">
                <div className="flex justify-between">
                  <span>Payment Settlement:</span>
                  <span className="font-bold font-mono text-slate-900">{printingOrder.payment_method}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span>NPR {printingOrder.total_amount_npr.toLocaleString()}</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-[10px] text-center">
                <div className="border-t border-slate-400 pt-1">
                  <span>Dispatched By (RTSS Staff)</span>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <span>Received in Good Condition (Customer)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. ADD / EDIT HARDWARE TYPE MODAL */}
      {/* ========================================================================= */}
      {isHardwareModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] my-auto">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-400" />
                <h3 className="font-bold text-base">
                  {editingHardwareId ? 'Edit Hardware System Option' : 'Add New Hardware System Option'}
                </h3>
              </div>
              <button
                onClick={() => setIsHardwareModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveHardware} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Hardware System Name (English) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CCTV Surveillance / NVR / DVR"
                  value={hwName}
                  onChange={(e) => setHwName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Hardware System Name (Nepali / देवनागरी)</label>
                <input
                  type="text"
                  placeholder="e.g. सीसीटीभी क्यामरा तथा एनभीआर/डीभीआर"
                  value={hwNameNepali}
                  onChange={(e) => setHwNameNepali(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Category Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Security, IT, Printing"
                    value={hwCategoryHint}
                    onChange={(e) => setHwCategoryHint(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Estimated Turnaround</label>
                  <input
                    type="text"
                    placeholder="e.g. 24-48 Hours, Same Day"
                    value={hwTurnaround}
                    onChange={(e) => setHwTurnaround(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description &amp; Supported Brands / Faults</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Hikvision, Dahua, CP Plus, wiring issues, hard drive failure, mobile view configuration..."
                  value={hwDescription}
                  onChange={(e) => setHwDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Active on Public Storefront</span>
                  <span className="text-[11px] text-slate-500">Allow customers to choose this in the service booking form</span>
                </div>
                <input
                  type="checkbox"
                  checked={hwIsActive}
                  onChange={(e) => setHwIsActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsHardwareModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  {editingHardwareId ? 'Save Changes' : 'Create Hardware Option'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. CUSTOMER INQUIRY REPLY MODAL */}
      {/* ========================================================================= */}
      {selectedInquiryForReply && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] my-auto">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-sky-400" />
                <div>
                  <h3 className="font-bold text-sm">Customer Inquiry Thread</h3>
                  <span className="text-[10px] text-slate-400">
                    With {selectedInquiryForReply.customer_name} ({selectedInquiryForReply.customer_phone})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedInquiryForReply(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Original Message Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span className="font-bold text-slate-700">{selectedInquiryForReply.customer_name} (Customer)</span>
                  <span>{selectedInquiryForReply.created_at}</span>
                </div>
                <div className="font-semibold text-slate-800 text-xs">
                  {selectedInquiryForReply.subject || 'Customer Message'}
                </div>
                <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100 italic">
                  "{selectedInquiryForReply.message}"
                </p>
              </div>

              {/* Existing Replies List */}
              {selectedInquiryForReply.replies && selectedInquiryForReply.replies.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-600 block text-[11px]">Previous Staff Responses:</span>
                  <div className="space-y-2">
                    {selectedInquiryForReply.replies.map((r, idx) => (
                      <div key={idx} className="p-2.5 bg-sky-50 rounded-xl border border-sky-100 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-sky-800 font-semibold">
                          <span>{r.staff_name}</span>
                          <span className="font-mono text-slate-400">{r.created_at}</span>
                        </div>
                        <p className="text-slate-800">{r.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply Input Form */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Compose Staff Reply:</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Logged as {currentUser.name || currentUser.username}
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={replyInputText}
                  onChange={(e) => setReplyInputText(e.target.value)}
                  placeholder="Type your response to the customer..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-1.5">
                {onForwardInquiryToAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      onForwardInquiryToAdmin(selectedInquiryForReply.inquiry_id || selectedInquiryForReply.id);
                      onToast('Escalated to Admin Assistant', 'info');
                      setSelectedInquiryForReply(null);
                    }}
                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={13} />
                    <span>Forward to Admin</span>
                  </button>
                )}

                {onDeleteInquiry && (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentUser?.username !== '@reliableadmin' && currentUser?.role !== 'Admin' && currentUser?.role !== 'Super Admin') {
                        alert('Direct deletion is allowed for System Master (@reliableadmin) only.');
                        return;
                      }
                      const inqId = selectedInquiryForReply.inquiry_id || selectedInquiryForReply.id;
                      if (confirm(`Are you sure you want to permanently delete customer inquiry #${inqId} from ${selectedInquiryForReply.customer_name}?`)) {
                        onDeleteInquiry(inqId);
                        setSelectedInquiryForReply(null);
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                    title="Permanently Delete Inquiry (@reliableadmin only)"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setSelectedInquiryForReply(null)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!replyInputText.trim()) {
                      onToast('Please write a message to send', 'error');
                      return;
                    }
                    if (onReplyInquiry) {
                      onReplyInquiry(
                        selectedInquiryForReply.inquiry_id || selectedInquiryForReply.id,
                        replyInputText.trim(),
                        currentUser.name || currentUser.username || 'Staff User'
                      );
                    }
                    onToast('Reply dispatched to customer message thread', 'success');
                    setSelectedInquiryForReply(null);
                  }}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <Send size={13} />
                  <span>Send Response</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. BLOCK MESSENGER / USER MODAL (ADMIN ONLY) */}
      {/* ========================================================================= */}
      {blockingTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] my-auto text-xs">
            <div className="p-4 bg-rose-950 text-rose-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <UserX size={18} className="text-rose-400" />
                <h3 className="font-bold text-sm">Block Customer Messenger</h3>
              </div>
              <button
                onClick={() => setBlockingTarget(null)}
                className="p-1.5 text-rose-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-rose-900">
                <span className="font-bold block">Target User Information:</span>
                <p>Name: <strong>{blockingTarget.inquiry.customer_name}</strong></p>
                <p>Phone: <strong className="font-mono">{blockingTarget.inquiry.customer_phone}</strong></p>
                {blockingTarget.inquiry.customer_email && (
                  <p>Email: <strong className="font-mono">{blockingTarget.inquiry.customer_email}</strong></p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Reason for Restriction / Block:</label>
                <input
                  type="text"
                  value={blockingTarget.reason}
                  onChange={(e) => setBlockingTarget({ ...blockingTarget, reason: e.target.value })}
                  placeholder="e.g. Inappropriate messages, spam, harassment"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <p className="text-slate-500 text-[11px]">
                Once blocked, this customer will be prevented from sending new live messages through the Reliabletech store chat widget.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setBlockingTarget(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onBlockMessenger) {
                    onBlockMessenger(
                      blockingTarget.inquiry.customer_phone || '',
                      blockingTarget.reason,
                      currentUser.name || currentUser.username || 'Admin'
                    );
                  }
                  onToast(`Blocked messenger ${blockingTarget.inquiry.customer_phone}`, 'success');
                  setBlockingTarget(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Ban size={14} />
                <span>Confirm Block User</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. PAYMENT SLIP VERIFICATION MODAL */}
      {/* ========================================================================= */}
      {verifyingOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] my-auto text-xs">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <QrCode size={18} className="text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Payment Proof &amp; Verification Desk</h3>
                  <span className="text-[10px] text-slate-400">
                    Order #{verifyingOrder.order_id} &bull; NPR {verifyingOrder.total_amount_npr.toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setVerifyingOrder(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">Customer Name:</span>
                  <span className="font-bold text-slate-900">{verifyingOrder.customer_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Phone Number:</span>
                  <span className="font-mono font-bold text-slate-900">{verifyingOrder.customer_phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Payment Method:</span>
                  <span className="font-bold text-emerald-700">{verifyingOrder.payment_method}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Bank / Transaction Ref:</span>
                  <span className="font-mono text-slate-900 font-bold">{verifyingOrder.gateway_ref_token || 'N/A'}</span>
                </div>
              </div>

              {/* Screenshot Preview */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-800 block">Customer Uploaded Payment Proof:</span>
                {verifyingOrder.payment_screenshot_url ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 text-center p-2">
                    <img
                      src={verifyingOrder.payment_screenshot_url}
                      alt="Payment Receipt Slip"
                      className="max-h-72 mx-auto object-contain rounded-lg shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400">
                    <FileText size={32} className="mx-auto text-slate-300 mb-1" />
                    <span>No screenshot uploaded for this order</span>
                  </div>
                )}
              </div>

              {/* Staff Verification Note */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Staff Verification Note / Bank Match Remarks:</label>
                <input
                  type="text"
                  value={paymentVerificationNote}
                  onChange={(e) => setPaymentVerificationNote(e.target.value)}
                  placeholder="e.g. Verified in Nabil Bank mobile app by Ramesh"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => setVerifyingOrder(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onVerifyPayment) {
                      onVerifyPayment(
                        verifyingOrder.order_id,
                        'Rejected',
                        paymentVerificationNote || 'Payment not credited or unverified slip'
                      );
                    }
                    onToast('Order payment marked as Rejected', 'error');
                    setVerifyingOrder(null);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <X size={14} />
                  <span>Reject Payment</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onVerifyPayment) {
                      onVerifyPayment(
                        verifyingOrder.order_id,
                        'Verified',
                        paymentVerificationNote || 'Verified by staff'
                      );
                    }
                    onToast('Payment approved & order verified for dispatch!', 'success');
                    setVerifyingOrder(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 size={14} />
                  <span>Approve &amp; Verify Payment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. OFFICIAL ORDER RECEIPT & MAINTENANCE CERTIFICATE MODAL */}
      {/* ========================================================================= */}
      {receiptModalOrder && (
        <EcommerceOrderReceiptModal
          order={receiptModalOrder}
          profile={profile}
          onClose={() => setReceiptModalOrder(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* 11. CANCEL ORDER & ISSUE REVERSE VOUCHER CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] my-auto">
            <div className="p-4 bg-gradient-to-r from-rose-900 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    Cancel Order &amp; Issue Reverse Voucher
                  </h3>
                  <p className="text-xs text-rose-200">
                    Order #{cancellingOrder.order_id} &bull; Customer: {cancellingOrder.customer_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCancellingOrder(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-rose-950">
                <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
                  <AlertTriangle size={16} className="text-rose-600" />
                  <span>Financial &amp; Stock Reversal Notice</span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-slate-700">
                  Cancelling this order will mark the transaction as <strong>Cancelled</strong>, issue an official 
                  <strong> Reverse Sales Voucher &amp; Credit Note</strong>, reverse accounting entries, and optionally restock the inventory.
                </p>
              </div>

              {/* Order Summary Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Refund Amount</span>
                  <span className="font-mono font-black text-rose-600 text-base">
                    NPR {cancellingOrder.total_amount_npr.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Original Payment Method</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {cancellingOrder.payment_method}
                  </span>
                </div>
              </div>

              {/* Reason / Remarks (Mandatory) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Cancellation &amp; Refund Reason (कैफियत) *</span>
                  <span className="text-rose-600 text-[11px] font-normal">Mandatory</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Customer requested refund / unwanted item, or wrong item ordered..."
                  value={cancelRemarks}
                  onChange={(e) => setCancelRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-xs font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />

                {/* Quick preset tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'Customer requested money back / return',
                    'Customer changed mind / item not needed',
                    'Defective / Damaged goods returned for refund',
                    'Delivery address outside coverage area',
                    'Duplicate order placed by mistake'
                  ].map((tag, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCancelRemarks(tag)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-[10.5px] rounded-lg transition border border-slate-200 cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Settlement / Refund Mode */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">Refund Settlement Mode</label>
                <select
                  value={cancelRefundMethod}
                  onChange={(e) => setCancelRefundMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-bold"
                >
                  <option value="Cash">Cash Handover / Counter Refund</option>
                  <option value="eSewa">eSewa Wallet Refund Transfer</option>
                  <option value="RBB">Rastriya Banijya Bank (RBB) Transfer</option>
                  <option value="Sahakari">Sahakari / Cooperative Account Credit</option>
                  <option value="Institutional Credit Reversal">Institutional Credit Account Note</option>
                </select>
              </div>

              {/* Restock Toggle */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-950 block">Return Items to Inventory Stock</span>
                  <span className="text-[11px] text-emerald-700">
                    Automatically increments available stock for all {cancellingOrder.items.length} items
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={cancelRestock}
                  onChange={(e) => setCancelRestock(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition cursor-pointer text-xs"
              >
                Keep Order Active
              </button>

              <button
                type="button"
                onClick={handleConfirmCancelWithReverseVoucher}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer text-xs active:scale-95"
              >
                <RotateCcw size={14} />
                <span>Confirm Cancellation &amp; Issue Reverse Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. OFFICIAL REVERSE VOUCHER & REFUND NOTE MODAL */}
      {/* ========================================================================= */}
      {reverseVoucherModalOrder && (
        <ReverseVoucherModal
          order={reverseVoucherModalOrder}
          profile={profile}
          onClose={() => setReverseVoucherModalOrder(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* 13. TRANSACTION PROOF PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewProofModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] my-auto">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <QrCode size={18} className="text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">{previewProofModal.title}</h3>
                  <span className="text-[10px] text-slate-400">Order #{previewProofModal.orderId} &bull; Official Payment Receipt Proof</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewProofModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-100 flex-1 overflow-y-auto flex flex-col items-center justify-center min-h-[300px]">
              <img
                src={previewProofModal.imageUrl}
                alt="Transaction Payment Proof"
                className="max-h-[60vh] w-auto max-w-full object-contain rounded-xl shadow-md border border-slate-300 bg-white"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-500 font-medium">Customer uploaded QR/Bank voucher snapshot</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewProofModal(null)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 14. EDIT CUSTOMER DETAILS & PASSWORD MANAGEMENT MODAL */}
      {/* ========================================================================= */}
      {isEditCustomerModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] my-auto">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-500/20 text-sky-300 rounded-xl border border-sky-400/30">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <span>Edit Customer Profile</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 bg-sky-800 text-sky-200 rounded-md">
                      {editingCustomer.customer_id}
                    </span>
                  </h3>
                  <p className="text-xs text-sky-200">
                    Modify profile details, address, institutional parameters, or reset storefront password.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditCustomerModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveCustomer} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
                
                {/* 1. Basic Account & Identity */}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                    <Users size={15} className="text-sky-600" />
                    <span>Customer Identity &amp; Contact Details</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Customer Full Name *</label>
                      <input
                        type="text"
                        required
                        value={editingCustomer.name}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-xs font-semibold focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={editingCustomer.email || ''}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                        placeholder="customer@example.com"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-xs font-semibold focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Primary Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={editingCustomer.phone}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-xs font-semibold font-mono focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Alternate Phone (Optional)</label>
                      <input
                        type="tel"
                        value={editingCustomer.alt_phone || ''}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, alt_phone: e.target.value })}
                        placeholder="Secondary contact"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-xs font-semibold font-mono focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Geographic Service Location */}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                    <MapPin size={15} className="text-emerald-600" />
                    <span>Delivery Location &amp; Local Area (Ilam Service Zone)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Municipality *</label>
                      <select
                        value={editingCustomer.municipality}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, municipality: e.target.value as PermittedMunicipality })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-xs font-bold"
                      >
                        {PERMITTED_MUNICIPALITIES.map((mun) => (
                          <option key={mun} value={mun}>{mun}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Ward Number *</label>
                      <input
                        type="text"
                        value={editingCustomer.ward}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, ward: e.target.value })}
                        placeholder="e.g. Ward 10"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Tole / Village / Chowk</label>
                      <input
                        type="text"
                        value={editingCustomer.tole_area || ''}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, tole_area: e.target.value })}
                        placeholder="e.g. Fikkal Bazaar, Kanyam"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-xs font-semibold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-800 block mb-1">Detailed Street Address *</label>
                      <input
                        type="text"
                        required
                        value={editingCustomer.detailed_address}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, detailed_address: e.target.value })}
                        placeholder="House no., street name, office gate..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Prominent Landmark</label>
                      <input
                        type="text"
                        value={editingCustomer.landmark || ''}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, landmark: e.target.value })}
                        placeholder="e.g. Near Tea Garden Chowk"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Account Category & Corporate Details */}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                    <Building2 size={15} className="text-purple-600" />
                    <span>Account Category &amp; Institutional Profile</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Account Category</label>
                      <select
                        value={editingCustomer.account_category || 'Individual'}
                        onChange={(e) => {
                          const cat = e.target.value as any;
                          const isCorp = cat !== 'Individual';
                          setEditingCustomer({
                            ...editingCustomer,
                            account_category: cat,
                            is_institutional: isCorp
                          });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-xs font-bold"
                      >
                        <option value="Individual">Individual Consumer</option>
                        <option value="School / College">School / College</option>
                        <option value="Tea Estate / Factory">Tea Estate / Factory</option>
                        <option value="Hotel / Resort / Homestay">Hotel / Resort / Homestay</option>
                        <option value="Cooperative / Sahakari">Cooperative / Sahakari</option>
                        <option value="Government / Ward Office">Government / Ward Office</option>
                        <option value="Commercial Business">Commercial Business</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Account Status</label>
                      <select
                        value={editingCustomer.status || 'Active'}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, status: e.target.value as any })}
                        className={`w-full px-3 py-2 border rounded-xl text-xs font-bold ${
                          editingCustomer.status === 'Blocked'
                            ? 'bg-rose-50 border-rose-300 text-rose-800'
                            : editingCustomer.status === 'Suspended'
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        }`}
                      >
                        <option value="Active">Active (Full Storefront Access)</option>
                        <option value="Blocked">Blocked (Access Restricted)</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Preferred Language</label>
                      <select
                        value={editingCustomer.preferred_language || 'ENG'}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, preferred_language: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-xs font-bold"
                      >
                        <option value="ENG">English (ENG)</option>
                        <option value="NEP">नेपाली (NEP)</option>
                      </select>
                    </div>
                  </div>

                  {/* Institutional parameters if selected */}
                  {(editingCustomer.is_institutional || editingCustomer.account_category !== 'Individual') && (
                    <div className="mt-3.5 p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3">
                      <span className="font-bold text-purple-900 text-xs block">Corporate / Organization Billing Parameters</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-bold text-slate-800 block mb-1">Organization Name *</label>
                          <input
                            type="text"
                            value={editingCustomer.organization_name || ''}
                            onChange={(e) => setEditingCustomer({ ...editingCustomer, organization_name: e.target.value })}
                            placeholder="e.g. Kanyam Tea Estate Pvt Ltd"
                            className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-bold text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-800 block mb-1">Organization PAN (9 digits) *</label>
                          <input
                            type="text"
                            maxLength={9}
                            value={editingCustomer.organization_pan || ''}
                            onChange={(e) => setEditingCustomer({ ...editingCustomer, organization_pan: e.target.value })}
                            placeholder="e.g. 601234567"
                            className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-800 block mb-1">Contact Person Designation</label>
                          <input
                            type="text"
                            value={editingCustomer.designation || ''}
                            onChange={(e) => setEditingCustomer({ ...editingCustomer, designation: e.target.value })}
                            placeholder="e.g. Principal / Manager"
                            className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-semibold text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Password Management & Reset Flow */}
                <div className="p-4 bg-slate-100/80 border border-slate-300 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <KeyRound size={15} className="text-amber-600" />
                        <span>Security &amp; Password Management</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Directly modify customer password or dispatch official reset link email.
                      </p>
                    </div>

                    {/* Reset Password Email Dispatch Button */}
                    <button
                      type="button"
                      disabled={isSendingResetEmail}
                      onClick={() => handleSendResetPasswordEmail(editingCustomer)}
                      className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl font-bold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50 text-xs active:scale-95"
                      id="customer-send-reset-password-email-btn"
                    >
                      {isSendingResetEmail ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Dispatching Email...</span>
                        </>
                      ) : (
                        <>
                          <Mail size={13} />
                          <span>Reset Password (Send Email)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {resetEmailSuccessMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-emerald-950 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>{resetEmailSuccessMsg}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        The customer has received the official RTSS password reset email with the 30-minute security link.
                      </p>
                      {generatedResetLink && (
                        <div className="mt-2 pt-2 border-t border-emerald-200 flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-slate-200">
                          <span className="font-mono text-[10px] text-slate-600 truncate max-w-md">
                            {generatedResetLink}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedResetLink);
                              onToast('📋 Password reset link copied to clipboard!', 'success');
                            }}
                            className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded text-[10px] font-bold shrink-0 transition"
                          >
                            Copy Link
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Direct Password Edit Field */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        Current Storefront Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCustPassword ? 'text' : 'password'}
                          value={editingCustomer.password || ''}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, password: e.target.value })}
                          className="w-full px-3 py-2 pr-9 bg-white border border-slate-300 rounded-xl focus:bg-white text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCustPassword(!showCustPassword)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showCustPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          const generated = `Rtss#${Math.floor(1000 + Math.random() * 9000)}!`;
                          setEditingCustomer({ ...editingCustomer, password: generated });
                          setShowCustPassword(true);
                          onToast(`Generated random secure password: ${generated}`, 'info');
                        }}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles size={13} className="text-amber-600" />
                        <span>Generate Random Password</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditCustomerModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition cursor-pointer text-xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer text-xs active:scale-95"
                >
                  <Check size={14} />
                  <span>Save Customer Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
