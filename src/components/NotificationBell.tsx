import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Bell, 
  X, 
  TrendingDown, 
  UserCheck, 
  ShieldCheck, 
  Clock, 
  Package, 
  CalendarRange, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShoppingBag,
  Wrench,
  MessageSquare,
  Truck,
  Trash2,
  Sparkles
} from 'lucide-react';
import { 
  AppUser, 
  EditRequest, 
  Expense, 
  LeaveRequest, 
  AttendanceRequest, 
  InventoryRequest, 
  DailyClosing, 
  MeetingNote,
  EcommerceOrder,
  EcommerceServiceTicket,
  CustomerInquiryMessage
} from '../types';
import { getCurrentBsDate } from '../utils/nepaliDate';

export interface NotificationItem {
  id: string;
  type: 'ecommerce' | 'staff_request' | 'daily_closing' | 'meeting' | 'system';
  categoryLabel: string;
  title: string;
  description: string;
  date: string;
  targetTab: string;
  badgeColor: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  priority: 'high' | 'normal';
}

interface NotificationBellProps {
  currentUser: AppUser;
  editRequests?: EditRequest[];
  expenses?: Expense[];
  leaveRequests?: LeaveRequest[];
  attendanceRequests?: AttendanceRequest[];
  inventoryRequests?: InventoryRequest[];
  dailyClosings?: DailyClosing[];
  meetingNotes?: MeetingNote[];
  users?: AppUser[];
  ecommerceOrders?: EcommerceOrder[];
  ecommerceServiceTickets?: EcommerceServiceTicket[];
  customerInquiries?: CustomerInquiryMessage[];
  onNavigate: (tabId: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  currentUser,
  editRequests = [],
  expenses = [],
  leaveRequests = [],
  attendanceRequests = [],
  inventoryRequests = [],
  dailyClosings = [],
  meetingNotes = [],
  users = [],
  ecommerceOrders = [],
  ecommerceServiceTickets = [],
  customerInquiries = [],
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'ecommerce' | 'staff' | 'closing'>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('reliabletech_dismissed_notifications');
      return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });
  const [showNewPopup, setShowNewPopup] = useState(false);
  const prevCountRef = useRef<number | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const saveDismissed = (newSet: Set<string>) => {
    setDismissedIds(newSet);
    try {
      localStorage.setItem('reliabletech_dismissed_notifications', JSON.stringify(Array.from(newSet)));
    } catch (e) {
      console.error(e);
    }
  };

  const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'Super Admin';
  const todayBs = getCurrentBsDate();

  // Aggregate all active pending notifications across system databases
  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];

    // 0. E-Commerce Requests: Pending Orders
    const pendingOrders = ecommerceOrders.filter(
      o => o.order_state === 'Pending Verification' || (o.payment_verification_status === 'Pending Verification' && o.payment_screenshot_url)
    );
    pendingOrders.forEach(ord => {
      const amt = ord.total_amount_npr || ord.grand_total_npr || 0;
      items.push({
        id: `ord-${ord.order_id}`,
        type: 'ecommerce',
        categoryLabel: 'E-Commerce Order',
        title: `Order #${ord.order_id} - NPR ${amt.toLocaleString()}`,
        description: `Customer: ${ord.customer_name || 'Customer'} (${ord.customer_phone || ''}) | ${ord.payment_method} | ${ord.municipality || ''}`,
        date: ord.created_at || todayBs,
        targetTab: 'ecommerce',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: ShoppingBag,
        priority: 'high'
      });
    });

    // E-Commerce: Customer Chat & Inquiries
    const pendingInquiries = customerInquiries.filter(
      i => i.status === 'Open' || (i.status === 'Forwarded to Admin' && isAdmin)
    );
    pendingInquiries.forEach(inq => {
      const custName = inq.customer_name || inq.customerName || 'Customer';
      const msgText = inq.message || inq.initialMessage || '';
      const inqDate = inq.created_at || inq.timestamp || todayBs;
      items.push({
        id: `inq-${inq.id}`,
        type: 'ecommerce',
        categoryLabel: inq.status === 'Forwarded to Admin' ? 'Admin Assistant Escalation' : 'Customer Message',
        title: `${custName}: ${inq.subject || msgText.slice(0, 35)}...`,
        description: msgText,
        date: inqDate,
        targetTab: 'ecommerce',
        badgeColor: inq.status === 'Forwarded to Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: MessageSquare,
        priority: inq.status === 'Forwarded to Admin' ? 'high' : 'normal'
      });
    });

    // E-Commerce: Service Tickets Pending Action
    const pendingServiceTickets = ecommerceServiceTickets.filter(
      t => t.ticket_status === 'Site-Survey Scheduled' || t.ticket_status === 'In-Progress'
    );
    pendingServiceTickets.forEach(st => {
      items.push({
        id: `ticket-${st.ticket_id}`,
        type: 'ecommerce',
        categoryLabel: 'Service Booking',
        title: `Ticket #${st.ticket_id} - ${st.hardware_type}`,
        description: `${st.customer_name} (${st.target_municipality}) - ${st.problem_description.slice(0, 45)}...`,
        date: st.created_at || todayBs,
        targetTab: 'ecommerce',
        badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
        icon: Wrench,
        priority: 'normal'
      });
    });

    // 1. Staff Requests: Pending Expense Requests
    const pendingExpenses = expenses.filter(e => e.status === 'Pending' || e.status === 'Pending Approval');
    pendingExpenses.forEach(exp => {
      items.push({
        id: `exp-${exp.id}`,
        type: 'staff_request',
        categoryLabel: 'Expense Request',
        title: `Rs. ${exp.amount?.toLocaleString()} - ${exp.category}`,
        description: `Requested by ${exp.createdBy || exp.loggedBy || 'Staff'}${exp.remarks ? `: ${exp.remarks}` : ''}`,
        date: exp.date,
        targetTab: 'staff_requests',
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: TrendingDown,
        priority: 'high'
      });
    });

    // 2. Staff Requests: Pending Leave Applications
    const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending');
    pendingLeaves.forEach(lv => {
      items.push({
        id: `leave-${lv.id}`,
        type: 'staff_request',
        categoryLabel: 'Leave Request',
        title: `${lv.staffName || 'Staff'} - ${lv.leaveType} (${lv.durationDays} Days)`,
        description: `Reason: ${lv.reason || 'Personal leave request'}`,
        date: lv.requestDate || lv.startDate,
        targetTab: 'staff_requests',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: UserCheck,
        priority: 'high'
      });
    });

    // 3. Staff Requests: Pending Ledger / Entity Overrides
    const pendingEdits = editRequests.filter(r => r.status === 'Pending');
    pendingEdits.forEach(er => {
      items.push({
        id: `edit-${er.id}`,
        type: 'staff_request',
        categoryLabel: 'Ledger Override',
        title: `${er.type}`,
        description: er.details || 'Staff requested ledger edit override approval',
        date: er.date,
        targetTab: 'staff_requests',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: ShieldCheck,
        priority: 'high'
      });
    });

    // 4. Staff Requests: Pending Attendance Punches
    const pendingAttendance = attendanceRequests.filter(a => a.status === 'Pending');
    pendingAttendance.forEach(att => {
      items.push({
        id: `att-${att.id}`,
        type: 'staff_request',
        categoryLabel: 'Attendance Request',
        title: `${att.staffName} - ${att.correctionType}`,
        description: `Attendance correction for ${att.date}: ${att.reason}`,
        date: att.date,
        targetTab: 'staff_requests',
        badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
        icon: Clock,
        priority: 'normal'
      });
    });

    // 5. Staff Requests: Pending Inventory / Office Stock Requisitions
    const pendingInventoryReqs = inventoryRequests.filter(ir => ir.status === 'Pending');
    pendingInventoryReqs.forEach(req => {
      items.push({
        id: `inv-${req.id}`,
        type: 'staff_request',
        categoryLabel: 'Stock Requisition',
        title: `${req.itemName} (Qty: ${req.quantity})`,
        description: `Requested by ${req.requestedBy || 'Staff'} for ${req.purpose || 'Office usage'}`,
        date: req.date,
        targetTab: 'staff_requests',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: Package,
        priority: 'normal'
      });
    });

    // 6. Staff Photo Pending Approvals (for Super Admin)
    if (currentUser.role === 'Super Admin') {
      const pendingPhotos = users.filter(u => u.profilePhoto && u.photoApproved === false);
      pendingPhotos.forEach(u => {
        items.push({
          id: `photo-${u.id}`,
          type: 'staff_request',
          categoryLabel: 'Photo Approval',
          title: `Profile Photo: ${u.name}`,
          description: `Staff profile photo update pending approval by @reliableadmin`,
          date: todayBs,
          targetTab: 'staff_requests',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: UserCheck,
          priority: 'normal'
        });
      });
    }

    // 7. Daily Closings: Pending Day-End Approvals / Audits
    const pendingClosings = dailyClosings.filter(c => c.status === 'Pending');
    pendingClosings.forEach(cls => {
      items.push({
        id: `close-${cls.id || cls.date}`,
        type: 'daily_closing',
        categoryLabel: 'Daily Closing Audit',
        title: `Closing Audit for BS ${cls.date}`,
        description: `Submitted by ${cls.closedBy || 'Cashier'}. Cash: Rs. ${(cls.cashInDrawer || 0).toLocaleString()} awaiting audit.`,
        date: cls.date,
        targetTab: 'daily_closing',
        badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
        icon: CalendarRange,
        priority: 'high'
      });
    });

    // 8. Daily Closings: Unclosed Today's Books (Admin reminder if after business hours or today is unclosed)
    if (isAdmin) {
      const isTodayClosed = dailyClosings.some(c => c.date === todayBs && (c.status === 'Approved' || c.status === 'Locked' || c.status === 'Closed'));
      if (!isTodayClosed) {
        items.push({
          id: `today-unclosed-${todayBs}`,
          type: 'daily_closing',
          categoryLabel: 'Daily Reconciliation',
          title: `Daily Book Reconciliation Pending`,
          description: `Today's books (BS ${todayBs}) are open. Conduct end-of-day cash count and lock registers.`,
          date: todayBs,
          targetTab: 'daily_closing',
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
          icon: CalendarRange,
          priority: 'normal'
        });
      }
    }

    // 9. Meeting Notes: Pending Meeting Participant Approvals
    const myPendingMeetings = isAdmin
      ? meetingNotes.filter(m => m.status === 'Pending')
      : meetingNotes.filter(m => 
          m.status === 'Scheduled' && 
          m.participants?.includes(currentUser.username) && 
          !m.participantApprovals?.includes(currentUser.username)
        );

    myPendingMeetings.forEach(m => {
      items.push({
        id: `meeting-${m.id}`,
        type: 'meeting',
        categoryLabel: 'Board Meeting',
        title: `${m.meetingNumber || 'Meeting'}: ${m.typeOfMeeting || 'Agenda'}`,
        description: `Venue: ${m.venue || 'Office'}. Status: ${m.status}`,
        date: m.meetingDate || m.date,
        targetTab: 'meeting_mynotes',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: FileText,
        priority: 'normal'
      });
    });

    return items;
  }, [
    currentUser,
    expenses,
    leaveRequests,
    editRequests,
    attendanceRequests,
    inventoryRequests,
    users,
    dailyClosings,
    meetingNotes,
    isAdmin,
    todayBs
  ]);

  // Exclude notifications that the user has cleared/dismissed
  const activeNotifications = useMemo(() => {
    return notifications.filter(n => !dismissedIds.has(n.id));
  }, [notifications, dismissedIds]);

  const totalAlertCount = activeNotifications.length;
  const ecommerceCount = activeNotifications.filter(n => n.type === 'ecommerce').length;
  const staffCount = activeNotifications.filter(n => n.type === 'staff_request').length;
  const closingCount = activeNotifications.filter(n => n.type === 'daily_closing').length;

  // Transient 3-second popup when any new notification arrives so user's eyes are drawn to the bell
  useEffect(() => {
    if (prevCountRef.current !== null && totalAlertCount > prevCountRef.current) {
      setShowNewPopup(true);
      const timer = setTimeout(() => {
        setShowNewPopup(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = totalAlertCount;
  }, [totalAlertCount]);

  const handleClearAll = () => {
    const updated = new Set<string>(dismissedIds);
    notifications.forEach(n => updated.add(n.id));
    saveDismissed(updated);
  };

  const filteredNotifications = useMemo(() => {
    if (selectedFilter === 'ecommerce') {
      return activeNotifications.filter(n => n.type === 'ecommerce');
    }
    if (selectedFilter === 'staff') {
      return activeNotifications.filter(n => n.type === 'staff_request');
    }
    if (selectedFilter === 'closing') {
      return activeNotifications.filter(n => n.type === 'daily_closing');
    }
    return activeNotifications;
  }, [activeNotifications, selectedFilter]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleActionClick = (targetTab: string) => {
    // 3. User Experience Rule: Auto-dismiss dropdown immediately
    setIsOpen(false);
    onNavigate(targetTab);
  };

  return (
    <div className="relative inline-block text-left select-none">
      {/* Embedded hardware-accelerated keyframe animation for continuous periodic attention wiggle */}
      <style>{`
        @keyframes bellAttentionWiggle {
          0%, 86%, 100% {
            transform: rotate(0deg);
          }
          88% {
            transform: rotate(-14deg);
          }
          90% {
            transform: rotate(14deg);
          }
          92% {
            transform: rotate(-10deg);
          }
          94% {
            transform: rotate(10deg);
          }
          96% {
            transform: rotate(-5deg);
          }
          98% {
            transform: rotate(5deg);
          }
        }
        .animate-bell-attention {
          animation: bellAttentionWiggle 12s ease-in-out infinite;
          transform-origin: top center;
          will-change: transform;
        }
      `}</style>

      {/* Bell Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label={`Notifications (${totalAlertCount} active alerts)`}
        aria-expanded={isOpen}
        title={totalAlertCount > 0 ? `${totalAlertCount} pending system alerts` : 'Notifications (All caught up)'}
        className={`relative p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-white border-sky-300 text-sky-900 shadow-sm ring-2 ring-sky-400/20'
            : totalAlertCount > 0
            ? 'bg-white/90 hover:bg-white border-sky-200 text-sky-800 hover:text-sky-950 shadow-2xs'
            : 'bg-white/70 hover:bg-white border-sky-200/70 text-slate-500 hover:text-slate-700 shadow-2xs'
        }`}
      >
        <Bell 
          size={18} 
          className={`transition-colors duration-200 ${
            totalAlertCount > 0 
              ? 'animate-bell-attention text-sky-700' 
              : 'text-slate-400'
          }`} 
        />

        {/* Active Alert State: Vibrant Red Bubble Badge */}
        {totalAlertCount > 0 && (
          <span 
            className="absolute -top-1.5 -right-1.5 min-w-[19px] h-[19px] px-1 bg-rose-600 text-white font-mono font-black text-[10px] rounded-full flex items-center justify-center shadow-xs ring-2 ring-white animate-in zoom-in-50 duration-200"
          >
            {totalAlertCount > 99 ? '99+' : totalAlertCount}
          </span>
        )}
      </button>

      {/* Transient "New notification" popup anchored to bell icon for 3 seconds */}
      {showNewPopup && (
        <div 
          className="absolute top-full right-0 mt-2 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200"
          id="new-notification-bell-popup"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 text-white text-xs font-extrabold rounded-xl shadow-xl ring-2 ring-white whitespace-nowrap animate-bounce">
            <Sparkles size={13} className="text-yellow-200 animate-spin" />
            <span>New notification</span>
          </div>
        </div>
      )}

      {/* Dropdown Panel with Slide & Fade Transition */}
      <div
        ref={dropdownRef}
        className={`absolute right-0 mt-2.5 w-[330px] sm:w-[390px] md:w-[420px] bg-white rounded-2xl border border-slate-200/90 shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all duration-200 ease-out ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/10 backdrop-blur-xs rounded-lg">
                <Bell size={16} className="text-sky-200" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
                  Notification Center
                  {totalAlertCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full">
                      {totalAlertCount} New
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-sky-200/80">Pending audits, approvals & requests</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {totalAlertCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-white/15 hover:bg-white/25 border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Clear all active notifications"
                  id="clear-all-notifications-btn"
                >
                  <Trash2 size={12} />
                  <span>Clear All</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-sky-200 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close notifications"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          {totalAlertCount > 0 && (
            <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-white/10 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedFilter === 'all'
                    ? 'bg-white text-sky-950 shadow-xs'
                    : 'text-sky-100 hover:bg-white/10'
                }`}
              >
                All ({totalAlertCount})
              </button>
              {ecommerceCount > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedFilter('ecommerce')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedFilter === 'ecommerce'
                      ? 'bg-white text-sky-950 shadow-xs'
                      : 'text-sky-100 hover:bg-white/10'
                  }`}
                >
                  E-Commerce ({ecommerceCount})
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedFilter('staff')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedFilter === 'staff'
                    ? 'bg-white text-sky-950 shadow-xs'
                    : 'text-sky-100 hover:bg-white/10'
                }`}
              >
                Staff Requests ({staffCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('closing')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedFilter === 'closing'
                    ? 'bg-white text-sky-950 shadow-xs'
                    : 'text-sky-100 hover:bg-white/10'
                }`}
              >
                Daily Closings ({closingCount})
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Notifications List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 p-1.5">
          {filteredNotifications.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5 border border-emerald-100">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="text-sm font-bold text-slate-800">All Caught Up!</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
                No pending requests, ledger overrides, or unverified daily audits at this moment.
              </p>
            </div>
          ) : (
            filteredNotifications.map(item => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleActionClick(item.targetTab)}
                  className="p-3 hover:bg-sky-50/50 rounded-xl transition-all duration-150 cursor-pointer group flex items-start gap-3 relative"
                >
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 group-hover:border-sky-200 group-hover:bg-white text-slate-600 group-hover:text-sky-600 shrink-0 transition-colors">
                    <ItemIcon size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${item.badgeColor}`}>
                        {item.categoryLabel}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {item.date}
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-slate-900 truncate group-hover:text-sky-900 transition-colors">
                      {item.title}
                    </h5>

                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActionClick(item.targetTab);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 group-hover:text-indigo-700 hover:underline cursor-pointer"
                      >
                        <span>Click to View</span>
                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                      <span className="text-[10px] font-medium text-slate-400">
                        {item.targetTab === 'staff_requests' ? 'Staff Requests & Approvals' : item.targetTab === 'daily_closing' ? 'Daily Closing & Audit' : 'Meeting Notes'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="bg-slate-50 border-t border-slate-100 p-2.5 flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleActionClick('staff_requests')}
            className="flex-1 py-1.5 px-2.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-700 font-semibold text-[11px] text-center transition-colors flex items-center justify-center gap-1 shadow-2xs"
          >
            <span>Staff Requests</span>
            <ChevronRight size={12} />
          </button>
          <button
            type="button"
            onClick={() => handleActionClick('daily_closing')}
            className="flex-1 py-1.5 px-2.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-700 font-semibold text-[11px] text-center transition-colors flex items-center justify-center gap-1 shadow-2xs"
          >
            <span>Daily Closing</span>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
