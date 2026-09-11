import React, { useState } from 'react';
import { 
  Check, 
  X, 
  UserCheck, 
  UserX, 
  Calendar, 
  Clock, 
  DollarSign, 
  FileText, 
  Plus, 
  Users, 
  ChevronRight, 
  Printer,
  FileSpreadsheet,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { AppUser, AttendanceRecord, LeaveRequest, SalaryDistribution, Expense, AttendanceRequest, DailyClosing, PeriodicClosing, OpeningBalances, SalesInvoice, SupplyTransaction, AccountTransaction } from '../types';
import { getCurrentBsDate, formatBsMonth } from '../utils/nepaliDate';
import { checkDateLock } from '../utils/closingLocks';
import { validateAccountBalance, validateSplitAccountBalances, calculateAccountBalance } from '../utils/accountBalance';

interface StaffAttendanceProps {
  currentUser: AppUser;
  users: AppUser[];
  onUpdateUsers: (users: AppUser[]) => void;
  attendanceRecords: AttendanceRecord[];
  onSaveAttendance: (record: AttendanceRecord) => void;
  leaveRequests: LeaveRequest[];
  onAddLeaveRequest: (req: LeaveRequest) => void;
  onUpdateLeaveRequest: (id: string, status: 'Approved' | 'Rejected', adminRemarks: string) => void;
  salaryDistributions: SalaryDistribution[];
  onDistributeSalary: (dist: SalaryDistribution) => void;
  onDeleteSalaryDistribution?: (id: string) => void;
  onAddExpense: (exp: Omit<Expense, 'id' | 'expenseNo'>) => void;
  profile: any;
  attendanceRequests: AttendanceRequest[];
  onAddAttendanceRequest: (req: AttendanceRequest) => void;
  dailyClosings?: DailyClosing[];
  periodicClosings?: PeriodicClosing[];
  openingBalances?: OpeningBalances;
  invoices?: SalesInvoice[];
  expenses?: Expense[];
  transactions?: SupplyTransaction[];
  accountTransfers?: AccountTransaction[];
}

export const StaffAttendance: React.FC<StaffAttendanceProps> = ({
  currentUser,
  users,
  onUpdateUsers,
  attendanceRecords,
  onSaveAttendance,
  leaveRequests,
  onAddLeaveRequest,
  onUpdateLeaveRequest,
  salaryDistributions,
  onDistributeSalary,
  onDeleteSalaryDistribution,
  onAddExpense,
  profile,
  attendanceRequests,
  onAddAttendanceRequest,
  dailyClosings = [],
  periodicClosings = [],
  openingBalances,
  invoices = [],
  expenses = [],
  transactions = [],
  accountTransfers = []
}) => {
  const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'Super Admin';
  const today = getCurrentBsDate();

  // Component States
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'leaves' | 'salary' | 'reports'>(
    isAdmin ? 'attendance' : 'attendance'
  );

  // Leave Form State (for Staff)
  const [leaveStartDate, setLeaveStartDate] = useState(today);
  const [leaveEndDate, setLeaveEndDate] = useState(today);
  const [leaveType, setLeaveType] = useState<'Casual' | 'Sick' | 'Maternity/Paternity' | 'Other'>('Casual');
  const [leaveReason, setLeaveReason] = useState('');

  // Admin Leave Approval State
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);

  // Salary Distribution Form State (for Admin)
  const [selectedStaffForSalary, setSelectedStaffForSalary] = useState<AppUser | null>(null);
  const [salaryMonth, setSalaryMonth] = useState(() => {
    const parts = today.split('-');
    return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : today.substring(0, 7);
  });
  const [dispatchSalaryMonth, setDispatchSalaryMonth] = useState<string>('');
  const [disbursalDate, setDisbursalDate] = useState<string>(today);
  const [baseSalary, setBaseSalary] = useState<number | string>(0);
  const [allowances, setAllowances] = useState<number | string>(0);
  const [bonusReason, setBonusReason] = useState<string>('');
  const [deductions, setDeductions] = useState<number | string>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [salaryRemarks, setSalaryRemarks] = useState<string>('');
  const [salarySplits, setSalarySplits] = useState<{ Cash: number; Esewa: number; RBB: number; Sahakari: number }>({
    Cash: 0,
    Esewa: 0,
    RBB: 0,
    Sahakari: 0
  });

  // Print Salary Payslip State
  const [printingPayslip, setPrintingPayslip] = useState<SalaryDistribution | null>(null);

  // Filter values
  const [filterMonth, setFilterMonth] = useState(() => {
    const parts = today.split('-');
    return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : today.substring(0, 7);
  });

  // Filter values for detailed attendance logs
  const [filterStaffId, setFilterStaffId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [printingAttendanceList, setPrintingAttendanceList] = useState<any[] | null>(null);

  // Handle saving attendance record (Admin)
  const handleMarkAttendance = (userId: string, status: AttendanceRecord['status'], remarks = '') => {
    const staffUser = users.find(u => u.id === userId);
    if (!staffUser) return;

    const existing = attendanceRecords.find(r => r.userId === userId && r.date === selectedDate);
    const updatedRecord: AttendanceRecord = {
      id: existing ? existing.id : `att-${Date.now()}-${userId}`,
      userId,
      userName: staffUser.name,
      date: selectedDate,
      status,
      checkInTime: status === 'Present' || status === 'Half Day' ? '09:00 AM' : undefined,
      checkOutTime: status === 'Present' ? '05:00 PM' : status === 'Half Day' ? '01:00 PM' : undefined,
      remarks: remarks || undefined
    };

    onSaveAttendance(updatedRecord);
  };

  const handleRequestAttendance = (type: 'Check-In' | 'Check-Out') => {
    // Current local time
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    const newReq: AttendanceRequest = {
      id: `att-req-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      date: today,
      type,
      time: strTime,
      status: 'Pending'
    };
    onAddAttendanceRequest(newReq);
    alert(`Successfully submitted ${type} request for today (${today} at ${strTime}) to Admin for approval.`);
  };

  // Handle submitting a leave request (Staff)
  const handleRequestLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) {
      alert("Please provide a reason for the leave request.");
      return;
    }

    const newRequest: LeaveRequest = {
      id: `leave-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      leaveType,
      reason: leaveReason.trim(),
      status: 'Pending',
      dateCreated: today
    };

    onAddLeaveRequest(newRequest);
    setLeaveReason('');
    alert("Leave request submitted successfully for Administrator review.");
  };

  // Handle salary distribution submit (Admin only)
  const handleDistributeSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForSalary) return;

    if (!dispatchSalaryMonth.trim()) {
      alert("Please select or enter the salary month being dispatched.");
      return;
    }

    // Check if salary already distributed to this staff for this month
    const alreadyDistributed = salaryDistributions.some(
      sd => sd.userId === selectedStaffForSalary.id && sd.month === dispatchSalaryMonth && sd.status === 'Paid'
    );
    if (alreadyDistributed) {
      alert(`Salary for ${formatBsMonth(dispatchSalaryMonth)} has already been distributed to ${selectedStaffForSalary.name}.`);
      return;
    }

    const numBase = typeof baseSalary === 'number' ? baseSalary : (parseFloat(baseSalary) || 0);
    const numAllowances = typeof allowances === 'number' ? allowances : (parseFloat(allowances) || 0);
    const numDeductions = typeof deductions === 'number' ? deductions : (parseFloat(deductions) || 0);

    const netPaid = numBase + numAllowances - numDeductions;
    if (netPaid <= 0) {
      alert("Net payable amount must be greater than zero.");
      return;
    }

    // 1. Check Date Lock - when daily closing is done, no transactions can be performed!
    const txDate = disbursalDate || today;
    if (dailyClosings) {
      const lock = checkDateLock(txDate, dailyClosings, periodicClosings);
      if (lock.locked) {
        alert(lock.reason);
        return;
      }
    }

    // 2. Validate Split payment allocations or single gateway
    if (paymentMethod === 'Split') {
      const splitTotal = Number(salarySplits.Cash || 0) + Number(salarySplits.Esewa || 0) + Number(salarySplits.RBB || 0) + Number(salarySplits.Sahakari || 0);
      if (Math.abs(splitTotal - netPaid) > 0.01) {
        alert(`Split allocation total (Rs. ${splitTotal.toLocaleString()}) does not match the net salary (Rs. ${netPaid.toLocaleString()}). Please adjust the split breakdown values.`);
        return;
      }
    }

    // 3. Payment Basket Balance Validation: No transaction can be done when basket has no balance
    const balanceData = {
      openingBalances: openingBalances || {
        CASH: { openingBalance: 0, openingBalanceDate: '' },
        ESEWA: { openingBalance: 0, openingBalanceDate: '' },
        RBB: { openingBalance: 0, openingBalanceDate: '' },
        SAHAKARI: { openingBalance: 0, openingBalanceDate: '' },
        DUE: { openingBalance: 0, openingBalanceDate: '' }
      },
      invoices,
      expenses,
      transactions,
      salaryDistributions,
      accountTransfers,
      dailyClosings
    };

    if (paymentMethod === 'Split') {
      const insufficientSplits = validateSplitAccountBalances(salarySplits, balanceData);
      if (insufficientSplits.length > 0) {
        const item = insufficientSplits[0];
        alert(`Transaction Blocked: Insufficient Balance in ${item.accountLabel}!\nAvailable balance: Rs. ${item.currentBalance.toLocaleString()}\nAllocated amount: Rs. ${item.requiredAmount.toLocaleString()}\n\nPlease choose another payment method or fund this account.`);
        return;
      }
    } else {
      const insufficient = validateAccountBalance(paymentMethod, netPaid, balanceData);
      if (insufficient) {
        alert(`Transaction Blocked: Insufficient Balance in ${insufficient.accountLabel}!\nAvailable balance: Rs. ${insufficient.currentBalance.toLocaleString()}\nRequired amount: Rs. ${insufficient.requiredAmount.toLocaleString()}\n\nPlease choose another payment method or fund this account.`);
        return;
      }
    }

    const newDistribution: SalaryDistribution = {
      id: `sal-${Date.now()}`,
      userId: selectedStaffForSalary.id,
      userName: selectedStaffForSalary.name,
      post: selectedStaffForSalary.post || 'Staff',
      month: dispatchSalaryMonth,
      baseSalary: numBase,
      allowances: numAllowances,
      bonusReason: numAllowances > 0 ? bonusReason.trim() : undefined,
      deductions: numDeductions,
      netPaid,
      paymentMethod,
      paymentSplits: paymentMethod === 'Split' ? salarySplits : undefined,
      distributionDate: disbursalDate || today,
      status: 'Paid',
      approvedBy: currentUser.name,
      remarks: salaryRemarks.trim()
    };

    // Save distribution
    onDistributeSalary(newDistribution);

    // Build title and narration for expense
    let expTitle = `Salary Disbursed - ${selectedStaffForSalary.name} (${formatBsMonth(dispatchSalaryMonth)})`;
    if (allowances > 0 && bonusReason.trim()) {
      expTitle += ` [Bonus: ${bonusReason.trim()}]`;
    }

    let expRemarks = `Base Salary: Rs. ${baseSalary}`;
    if (allowances > 0) {
      expRemarks += `, Bonus/Allowance: Rs. ${allowances}${bonusReason.trim() ? ` (${bonusReason.trim()})` : ''}`;
    }
    if (deductions > 0) {
      expRemarks += `, Deductions: Rs. ${deductions}`;
    }
    if (paymentMethod === 'Split') {
      expRemarks += `, Split [Cash: Rs. ${salarySplits.Cash}, eSewa: Rs. ${salarySplits.Esewa}, RBB: Rs. ${salarySplits.RBB}, Sahakari: Rs. ${salarySplits.Sahakari}]`;
    }
    if (salaryRemarks.trim()) {
      expRemarks += `. Ref: ${salaryRemarks.trim()}`;
    }

    // Track as system expense automatically
    onAddExpense({
      category: 'Salary',
      title: expTitle,
      amount: netPaid,
      paymentMethod: paymentMethod as any,
      paymentSplits: paymentMethod === 'Split' ? salarySplits : undefined,
      date: disbursalDate || today,
      remarks: expRemarks,
      status: 'Approved',
      createdBy: currentUser.name,
      referenceId: newDistribution.id
    });

    alert(`Successfully disbursed Rs. ${netPaid.toLocaleString()} salary for ${formatBsMonth(dispatchSalaryMonth)} to ${selectedStaffForSalary.name}. Expense logged automatically.`);
    setSelectedStaffForSalary(null);
    setAllowances(0);
    setBonusReason('');
    setDeductions(0);
    setSalaryRemarks('');
  };

  // Open salary distribution modal and pre-fill salary
  const openSalaryModal = (staff: AppUser) => {
    setSelectedStaffForSalary(staff);
    setBaseSalary(staff.monthlySalary || 0);
    setAllowances(0);
    setBonusReason('');
    setDeductions(0);
    setDispatchSalaryMonth(salaryMonth);
    setDisbursalDate(today);
    setSalaryRemarks('');
  };

  // Print Salary Statement/Receipt handler
  const handlePrintStatement = (payslip: SalaryDistribution) => {
    if (window.openUniversalPrintPreview) {
      window.openUniversalPrintPreview({
        documentType: 'Staff Pay Slip',
        documentNumber: `PAY-${payslip.id}`,
        documentDate: payslip.distributionDate || getCurrentBsDate(),
        profile: profile,
        recipient: {
          name: payslip.userName,
          department: payslip.post
        },
        title: 'Staff Salary & Remuneration Disbursement Slip',
        items: [
          { sn: 1, name: `Base Basic Salary (${payslip.month})`, quantity: 1, unitPrice: payslip.baseSalary, totalPrice: payslip.baseSalary },
          { sn: 2, name: payslip.bonusReason ? `Allowance / Bonus (${payslip.bonusReason})` : 'Attendance Allowance / Overtime Bonus', quantity: 1, unitPrice: payslip.allowances || 0, totalPrice: payslip.allowances || 0 },
          { sn: 3, name: 'Deductions (Unpaid Leaves / Advance)', quantity: 1, unitPrice: -(payslip.deductions || 0), totalPrice: -(payslip.deductions || 0) }
        ],
        subtotal: payslip.netPaid,
        grandTotal: payslip.netPaid,
        notes: `Paid via ${payslip.paymentMethod} account. Month: ${payslip.month}. Remarks: ${payslip.remarks || 'Salary Disbursed'}.`,
        preparedBy: payslip.approvedBy || currentUser.name,
        approvedBy: `${profile?.name || 'Authorized'} HR`
      });
    } else {
      setPrintingPayslip(payslip);
      setTimeout(() => {
        window.print();
      }, 300);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="staff-attendance-tab">
      
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-display">Staff & Attendance Management</h2>
          <p className="text-xs text-slate-500">
            {isAdmin 
              ? "Oversee employee registries, record daily attendance, approve leaves, distribute salary payouts, and log automatically linked expenses."
              : "Track your personal attendance logs, submit leave requests to administrators, and generate verified salary statements."
            }
          </p>
        </div>
        
        {/* Navigation pill tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl self-start">
          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeSubTab === 'attendance' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            Attendance Board
          </button>
          <button
            onClick={() => setActiveSubTab('leaves')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeSubTab === 'leaves' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            Leaves {isAdmin && leaveRequests.filter(r => r.status === 'Pending').length > 0 && (
              <span className="ml-1 bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">
                {leaveRequests.filter(r => r.status === 'Pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('salary')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeSubTab === 'salary' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            {isAdmin ? 'Salary Distribution' : 'My Salary Logs'}
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveSubTab('reports')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                activeSubTab === 'reports' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-indigo-600'
              }`}
            >
              Report Cards
            </button>
          )}
        </div>
      </div>

      {/* SUB TAB 1: ATTENDANCE BOARD */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-6">
          {isAdmin ? (
            /* ADMIN VIEW: Daily Attendance logger */
            <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Record Daily Attendance</h3>
                    <p className="text-[10px] text-slate-400">Mark staff present, absent, on-leave, or half-day for the selected date.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Date (BS):</span>
                  <input 
                    type="text"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-indigo-600 focus:outline-hidden w-28 text-center"
                  />
                </div>
              </div>

              {/* Staff table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-100">
                      <th className="py-3 px-4 font-bold">Staff Member</th>
                      <th className="py-3 px-4 font-bold">Post / Department</th>
                      <th className="py-3 px-4 font-bold text-center">Date Status</th>
                      <th className="py-3 px-4 font-bold text-center">Check In/Out</th>
                      <th className="py-3 px-4 font-bold text-right">Attendance Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map(staff => {
                      const record = attendanceRecords.find(r => r.userId === staff.id && r.date === selectedDate);
                      return (
                        <tr key={staff.id} className="hover:bg-slate-55/30 transition">
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-800">{staff.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">@{staff.username} • {staff.contactNumber || 'No Contact'}</div>
                          </td>
                          <td className="py-4 px-4 font-medium text-slate-600">
                            {staff.post || <span className="text-slate-350 italic text-[11px]">Not assigned</span>}
                          </td>
                          <td className="py-4 px-4 text-center">
                            {record ? (
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide font-mono ${
                                record.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                record.status === 'Absent' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                record.status === 'On Leave' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              }`}>
                                {record.status}
                              </span>
                            ) : (
                              <span className="text-slate-350 italic font-mono text-[10px]">Unmarked</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center font-mono text-[11px] text-slate-500">
                            {record && record.status === 'Present' && (
                              <span>{record.checkInTime} - {record.checkOutTime}</span>
                            )}
                            {record && record.status === 'Half Day' && (
                              <span>{record.checkInTime} - {record.checkOutTime}</span>
                            )}
                            {(!record || (record.status !== 'Present' && record.status !== 'Half Day')) && (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="inline-flex gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-150">
                              <button
                                onClick={() => handleMarkAttendance(staff.id, 'Present')}
                                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition ${
                                  record?.status === 'Present' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-600'
                                }`}
                                title="Mark Present"
                              >
                                Present
                              </button>
                              <button
                                onClick={() => handleMarkAttendance(staff.id, 'Half Day')}
                                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition ${
                                  record?.status === 'Half Day' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'
                                }`}
                                title="Mark Half Day"
                              >
                                Half Day
                              </button>
                              <button
                                onClick={() => handleMarkAttendance(staff.id, 'On Leave')}
                                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition ${
                                  record?.status === 'On Leave' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-amber-500'
                                }`}
                                title="Mark On Leave"
                              >
                                Leave
                              </button>
                              <button
                                onClick={() => handleMarkAttendance(staff.id, 'Absent')}
                                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition ${
                                  record?.status === 'Absent' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-rose-600'
                                }`}
                                title="Mark Absent"
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* STAFF (USER) VIEW: Personal Attendance logs */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left 1 Column: Today's Action & Summary Card */}
              <div className="space-y-6 h-fit">
                {/* Today's Attendance Checklist Card */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-5 space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Clock size={20} className="animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Today's Attendance</h3>
                      <p className="text-[10px] text-slate-400">Click to record coming & leaving times.</p>
                    </div>
                  </div>

                  {(() => {
                    const todayRequests = attendanceRequests.filter(r => r.userId === currentUser.id && r.date === today);
                    const checkInReq = todayRequests.find(r => r.type === 'Check-In');
                    const checkOutReq = todayRequests.find(r => r.type === 'Check-Out');
                    const todayRecord = attendanceRecords.find(r => r.userId === currentUser.id && r.date === today);
                    const isCheckedIn = todayRecord && (todayRecord.status === 'Present' || todayRecord.status === 'Half Day');
                    const isCheckedOut = todayRecord && todayRecord.checkOutTime !== undefined && todayRecord.checkOutTime !== '';

                    return (
                      <div className="space-y-4 text-xs">
                        <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-lg flex items-center justify-between">
                          <span className="font-bold text-slate-600">Today's Date:</span>
                          <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{today}</span>
                        </div>

                        {/* Check-In Row */}
                        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-700 block">1. Check In (Coming)</span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {isCheckedIn 
                                ? `Approved at ${todayRecord?.checkInTime}` 
                                : checkInReq 
                                  ? `Requested: ${checkInReq.time}` 
                                  : 'Not requested'}
                            </span>
                          </div>

                          {isCheckedIn ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase font-mono bg-emerald-50 text-emerald-700 border border-emerald-100">
                              Logged
                            </span>
                          ) : checkInReq ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase font-mono bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                              Pending
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRequestAttendance('Check-In')}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
                            >
                              Check In
                            </button>
                          )}
                        </div>

                        {/* Check-Out Row */}
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-700 block">2. Check Out (Leaving)</span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {isCheckedOut 
                                ? `Approved at ${todayRecord?.checkOutTime}` 
                                : checkOutReq 
                                  ? `Requested: ${checkOutReq.time}` 
                                  : 'Not requested'}
                            </span>
                          </div>

                          {!isCheckedIn ? (
                            <span className="text-slate-350 italic text-[10px] font-mono">
                              Await Check-In
                            </span>
                          ) : isCheckedOut ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase font-mono bg-emerald-50 text-emerald-700 border border-emerald-100">
                              Logged
                            </span>
                          ) : checkOutReq ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase font-mono bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                              Pending
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRequestAttendance('Check-Out')}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
                            >
                              Check Out
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Summary Card */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-5 space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                      <UserCheck size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Attendance Summary</h3>
                      <p className="text-[10px] text-slate-400">Review your logs for this month.</p>
                    </div>
                  </div>

                  {/* Filter for Month */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 block">Select Month (BS)</label>
                    <input
                      type="text"
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      placeholder="YYYY-MM"
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden font-mono font-bold text-indigo-600 text-center"
                    />
                  </div>

                  {/* Calculate Stats */}
                  {(() => {
                    const myLogs = attendanceRecords.filter(
                      r => r.userId === currentUser.id && r.date.startsWith(filterMonth)
                    );
                    const present = myLogs.filter(l => l.status === 'Present').length;
                    const halfDay = myLogs.filter(l => l.status === 'Half Day').length;
                    const onLeave = myLogs.filter(l => l.status === 'On Leave').length;
                    const absent = myLogs.filter(l => l.status === 'Absent').length;

                    return (
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center text-xs border-b border-slate-50 py-1.5">
                          <span className="text-slate-500 font-medium">Days Present</span>
                          <span className="font-mono font-bold text-emerald-600">{present} days</span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-b border-slate-50 py-1.5">
                          <span className="text-slate-500 font-medium">Half Days</span>
                          <span className="font-mono font-bold text-indigo-600">{halfDay} days</span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-b border-slate-50 py-1.5">
                          <span className="text-slate-500 font-medium">Approved Leaves</span>
                          <span className="font-mono font-bold text-amber-600">{onLeave} days</span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-b border-slate-50 py-1.5">
                          <span className="text-slate-500 font-medium">Days Absent</span>
                          <span className="font-mono font-bold text-rose-600">{absent} days</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] text-slate-500 font-mono text-center">
                          Attendance Rate: {myLogs.length > 0 ? `${Math.round(((present + halfDay * 0.5) / myLogs.length) * 100)}%` : '0%'}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Right 2 Columns: History Logs List */}
              <div className="md:col-span-2 bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                  My Attendance Records for {formatBsMonth(filterMonth)}
                </h3>
                
                {attendanceRecords.filter(r => r.userId === currentUser.id && r.date.startsWith(filterMonth)).length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-12">No attendance logs found for this month.</p>
                ) : (
                  <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto pr-1">
                    {attendanceRecords
                      .filter(r => r.userId === currentUser.id && r.date.startsWith(filterMonth))
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map(record => (
                        <div key={record.id} className="py-2.5 flex justify-between items-center text-xs">
                          <div className="space-y-0.5">
                            <p className="font-mono font-bold text-slate-700">{record.date}</p>
                            {record.checkInTime && (
                              <p className="text-[10px] text-slate-400 font-mono">
                                Timing: {record.checkInTime} - {record.checkOutTime || 'N/A'}
                              </p>
                            )}
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase font-mono ${
                            record.status === 'Present' ? 'bg-emerald-50 text-emerald-700' :
                            record.status === 'Absent' ? 'bg-rose-50 text-rose-700' :
                            record.status === 'On Leave' ? 'bg-amber-50 text-amber-700' :
                            'bg-indigo-50 text-indigo-700'
                          }`}>
                            {record.status}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 2: LEAVES */}
      {activeSubTab === 'leaves' && (
        <div className="space-y-6">
          {isAdmin ? (
            /* ADMIN LEAVE VIEW: Review, Approve, decline staff leaves */
            <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                <span>🛡️ Staff Leave Request Approvals Queue</span>
                {leaveRequests.filter(r => r.status === 'Pending').length > 0 && (
                  <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black">
                    Action Required
                  </span>
                )}
              </h3>

              {leaveRequests.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-12">No leave requests submitted in the system.</p>
              ) : (
                <div className="space-y-4">
                  {leaveRequests.map(req => (
                    <div key={req.id} className="border border-slate-100 rounded-xl p-4.5 bg-slate-50/30 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800 text-sm">{req.userName}</span>
                          <span className="ml-2 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-black font-mono">
                            {req.leaveType}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide font-mono ${
                          req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          req.status === 'Rejected' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {req.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500">
                        <p>Dates: <strong className="text-slate-700 font-mono">{req.startDate}</strong> to <strong className="text-slate-700 font-mono">{req.endDate}</strong></p>
                        <p className="sm:text-right">Requested on: <span className="font-mono">{req.dateCreated}</span></p>
                      </div>

                      <div className="bg-white border border-slate-100 rounded-lg p-3 text-xs text-slate-700">
                        <p className="font-semibold text-slate-400 text-[10px] uppercase font-mono tracking-wider">Leave Justification:</p>
                        <p className="mt-1 italic">&ldquo;{req.reason}&rdquo;</p>
                      </div>

                      {req.remarks && (
                        <p className="text-[10px] text-slate-400 italic">Admin remarks: {req.remarks}</p>
                      )}

                      {req.status === 'Pending' && (
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                          <input 
                            type="text"
                            placeholder="Optional Admin remarks/feedback..."
                            value={selectedLeaveId === req.id ? approvalRemarks : ''}
                            onChange={(e) => {
                              setSelectedLeaveId(req.id);
                              setApprovalRemarks(e.target.value);
                            }}
                            className="flex-1 min-w-[200px] border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                onUpdateLeaveRequest(req.id, 'Rejected', approvalRemarks);
                                setApprovalRemarks('');
                                setSelectedLeaveId(null);
                                alert("Leave request declined.");
                              }}
                              className="inline-flex items-center gap-1 border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                            >
                              <X size={12} />
                              <span>Decline</span>
                            </button>
                            <button
                              onClick={() => {
                                onUpdateLeaveRequest(req.id, 'Approved', approvalRemarks);
                                setApprovalRemarks('');
                                setSelectedLeaveId(null);
                                alert("Leave request approved. This date status will reflect On Leave.");
                              }}
                              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
                            >
                              <Check size={12} />
                              <span>Approve</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* STAFF VIEW: Submit Leave, view history */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Request Form */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-5 space-y-4 h-fit">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Plus size={18} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Ask for Leave</h3>
                </div>

                <form onSubmit={handleRequestLeaveSubmit} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 block">Start Date (BS) *</label>
                    <input 
                      type="text"
                      required
                      value={leaveStartDate}
                      onChange={(e) => setLeaveStartDate(e.target.value)}
                      placeholder="YYYY-MM-DD"
                      className="w-full border border-slate-200 rounded-lg p-2 font-mono text-center focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 block">End Date (BS) *</label>
                    <input 
                      type="text"
                      required
                      value={leaveEndDate}
                      onChange={(e) => setLeaveEndDate(e.target.value)}
                      placeholder="YYYY-MM-DD"
                      className="w-full border border-slate-200 rounded-lg p-2 font-mono text-center focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 block">Leave Type *</label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value as any)}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white focus:outline-hidden"
                    >
                      <option value="Casual">Casual Leave</option>
                      <option value="Sick">Sick Leave</option>
                      <option value="Maternity/Paternity">Maternity/Paternity</option>
                      <option value="Other">Other Leave</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 block">Reason & Justification *</label>
                    <textarea 
                      required
                      rows={3}
                      placeholder="Provide specific reason for leave application..."
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-xl transition cursor-pointer"
                  >
                    Submit Leave Application
                  </button>
                </form>
              </div>

              {/* Leave History list */}
              <div className="md:col-span-2 bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                  My Leave Applications History
                </h3>

                {leaveRequests.filter(r => r.userId === currentUser.id).length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-12">No leave applications lodged yet.</p>
                ) : (
                  <div className="space-y-3">
                    {leaveRequests
                      .filter(r => r.userId === currentUser.id)
                      .sort((a, b) => b.id.localeCompare(a.id))
                      .map(req => (
                        <div key={req.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50/20 text-xs space-y-2">
                          <div className="flex justify-between items-center font-mono">
                            <span className="font-bold text-slate-700 font-sans">{req.leaveType} Leave</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                              req.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                          <p className="text-slate-500 font-mono text-[10px]">
                            Duration: {req.startDate} to {req.endDate}
                          </p>
                          <p className="italic text-slate-600">&ldquo;{req.reason}&rdquo;</p>
                          {req.remarks && (
                            <p className="bg-white border border-slate-100 p-2 rounded text-[10px] text-slate-400 italic font-sans">
                              <strong>Remarks:</strong> {req.remarks}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 3: SALARY DISTRIBUTION */}
      {activeSubTab === 'salary' && (
        <div className="space-y-6">
          {isAdmin ? (
            /* ADMIN VIEW: Salary payout form and logs */
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Distribute Monthly Salary</h3>
                    <p className="text-[10px] text-slate-400">Distribute monthly salary to registered staff and automatically log linked system expenses.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">BS Month:</span>
                    <input 
                      type="text"
                      value={salaryMonth}
                      onChange={(e) => setSalaryMonth(e.target.value)}
                      placeholder="YYYY-MM"
                      className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-indigo-600 focus:outline-hidden w-24 text-center"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-100">
                        <th className="py-3 px-4 font-bold">Staff Member</th>
                        <th className="py-3 px-4 font-bold">Post</th>
                        <th className="py-3 px-4 font-bold">Monthly Salary Rate</th>
                        <th className="py-3 px-4 font-bold text-center">Status ({formatBsMonth(salaryMonth)})</th>
                        <th className="py-3 px-4 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {users.map(staff => {
                        const payout = salaryDistributions.find(
                          sd => sd.userId === staff.id && sd.month === salaryMonth && sd.status === 'Paid'
                        );
                        return (
                          <tr key={staff.id} className="hover:bg-slate-55/30 transition">
                            <td className="py-4 px-4">
                              <span className="font-bold text-slate-800">{staff.name}</span>
                              <p className="text-[10px] text-slate-400 font-mono">@{staff.username}</p>
                            </td>
                            <td className="py-4 px-4 font-medium text-slate-600">{staff.post || 'Staff'}</td>
                            <td className="py-4 px-4 font-mono font-semibold text-slate-800">
                              Rs. {(staff.monthlySalary || 0).toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-center">
                              {payout ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                                  Paid (Rs. {payout.netPaid.toLocaleString()})
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200 font-mono">
                                  Unpaid
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right">
                              {payout ? (
                                <button
                                  onClick={() => handlePrintStatement(payout)}
                                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold px-3 py-1.5 rounded-lg transition border border-slate-200/50 cursor-pointer"
                                >
                                  <Printer size={12} />
                                  <span>Payslip</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => openSalaryModal(staff)}
                                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer animate-pulse"
                                >
                                  <DollarSign size={12} />
                                  <span>Distribute</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Salary distribution modal */}
              {selectedStaffForSalary && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                  <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden my-6">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold font-display text-slate-800 text-lg">Disburse Salary Payout</h3>
                        <p className="text-[11px] text-slate-500">Calculate net payout for {selectedStaffForSalary.name}</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSelectedStaffForSalary(null)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <form onSubmit={handleDistributeSalarySubmit} className="p-6 space-y-4 text-xs">
                      {/* Employee Info card */}
                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Employee Name</p>
                          <p className="font-bold text-slate-800 mt-0.5">{selectedStaffForSalary.name}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Designated Post</p>
                          <p className="font-semibold text-slate-600 mt-0.5">{selectedStaffForSalary.post || 'Staff'}</p>
                        </div>
                      </div>

                      {/* Dispatched Salary Month Picker */}
                      <div className="space-y-1.5 bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-100/70">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-indigo-900 block">
                            Month of Salary Being Dispatched (BS) *
                          </label>
                          <span className="text-[10.5px] font-mono font-extrabold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200/80 shadow-xs">
                            {formatBsMonth(dispatchSalaryMonth)}
                          </span>
                        </div>
                        <input 
                          type="text"
                          required
                          value={dispatchSalaryMonth}
                          onChange={(e) => setDispatchSalaryMonth(e.target.value)}
                          placeholder="YYYY-MM (e.g. 2083-03)"
                          className="w-full border border-slate-200 rounded-lg p-2 font-mono font-bold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                          <span className="text-[9.5px] font-medium text-slate-500">Quick Select:</span>
                          {(() => {
                            const parts = today.split('-');
                            const curM = parts.length >= 2 ? `${parts[0]}-${parts[1]}` : today.substring(0, 7);
                            let pYear = parseInt(parts[0], 10);
                            let pMonth = parseInt(parts[1], 10) - 1;
                            if (pMonth < 1) { pMonth = 12; pYear -= 1; }
                            const prevM = `${pYear}-${String(pMonth).padStart(2, '0')}`;
                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setDispatchSalaryMonth(prevM)}
                                  className={`text-[9.5px] px-2.5 py-1 rounded-md font-bold transition border cursor-pointer ${
                                    dispatchSalaryMonth === prevM
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  Previous Month ({formatBsMonth(prevM)})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDispatchSalaryMonth(curM)}
                                  className={`text-[9.5px] px-2.5 py-1 rounded-md font-bold transition border cursor-pointer ${
                                    dispatchSalaryMonth === curM
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  Current Month ({formatBsMonth(curM)})
                                </button>
                              </>
                            );
                          })()}
                        </div>
                        <p className="text-[9.5px] text-slate-500 italic">
                          Select whether you are dispatching salary for the previous month, current month, or another month.
                        </p>
                      </div>

                      {/* Base Salary & Disbursal Date */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 block">Base Salary (Rate/Month) *</label>
                          <input 
                            type="number"
                            step="any"
                            required
                            value={baseSalary !== undefined ? baseSalary : ''}
                            onChange={(e) => setBaseSalary(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 font-mono font-bold text-slate-800 focus:outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 block">Disbursal Date (BS)</label>
                          <input 
                            type="text"
                            value={disbursalDate}
                            onChange={(e) => setDisbursalDate(e.target.value)}
                            placeholder="YYYY-MM-DD"
                            className="w-full border border-slate-200 rounded-lg p-2 font-mono font-bold text-slate-800 text-center focus:outline-hidden"
                          />
                        </div>
                      </div>

                      {/* Allowances & Bonus Reason Box */}
                      <div className="space-y-2 bg-emerald-50/30 p-3.5 rounded-xl border border-emerald-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-emerald-900 block">Allowances / Bonuses (Rs.)</label>
                            <input 
                              type="number"
                              step="any"
                              min="0"
                              value={allowances !== undefined ? allowances : ''}
                              onChange={(e) => setAllowances(e.target.value)}
                              placeholder="Rs. 0"
                              className="w-full border border-emerald-200 rounded-lg p-2 bg-white font-mono text-emerald-700 font-bold focus:outline-hidden"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-700 block">
                              What is the Bonus about?
                            </label>
                            <input 
                              type="text"
                              value={bonusReason}
                              onChange={(e) => setBonusReason(e.target.value)}
                              placeholder="e.g. Service charge, Festival bonus..."
                              className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs focus:outline-hidden"
                            />
                          </div>
                        </div>

                        {/* Presets for Bonus Purpose */}
                        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                          <span className="text-[9.5px] font-medium text-slate-500">Bonus Purpose Examples:</span>
                          {['Service charge', 'New year bonus', 'Festival bonus', 'Dashain bonus', 'Performance bonus', 'Overtime'].map(preset => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                setBonusReason(preset);
                              }}
                              className={`text-[9.5px] px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                                bonusReason === preset
                                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                                  : 'bg-white text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              + {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Deductions & Payment Method */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 block">Deductions / Absences (Rs.)</label>
                          <input 
                            type="number"
                            step="any"
                            min="0"
                            value={deductions !== undefined ? deductions : ''}
                            onChange={(e) => setDeductions(e.target.value)}
                            placeholder="Rs. 0"
                            className="w-full border border-slate-200 rounded-lg p-2 font-mono text-rose-600 font-semibold focus:outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 block">Payment Channel</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPaymentMethod(val);
                              if (val === 'Split') {
                                const numBase = typeof baseSalary === 'number' ? baseSalary : (parseFloat(baseSalary) || 0);
                                const numAllowances = typeof allowances === 'number' ? allowances : (parseFloat(allowances) || 0);
                                const numDeductions = typeof deductions === 'number' ? deductions : (parseFloat(deductions) || 0);
                                const net = Math.max(0, numBase + numAllowances - numDeductions);
                                setSalarySplits({
                                  Cash: net,
                                  Esewa: 0,
                                  RBB: 0,
                                  Sahakari: 0
                                });
                              }
                            }}
                            className="w-full border border-slate-200 rounded-lg p-2 bg-white focus:outline-hidden font-medium"
                          >
                            <option value="Cash">💵 Cash in Hand</option>
                            <option value="Esewa">📱 eSewa Wallet</option>
                            <option value="RBB">🏦 Rastriya Banijya Bank (RBB)</option>
                            <option value="Sahakari">🏦 Sahakari Cooperatives</option>
                            <option value="Split">🔀 Split Payment (Cash, eSewa, RBB, Sahakari)</option>
                          </select>
                        </div>
                      </div>

                      {/* Split Breakdown */}
                      {paymentMethod === 'Split' && (() => {
                        const currentBalData = {
                          openingBalances: openingBalances || {
                            CASH: { openingBalance: 0, openingBalanceDate: '' },
                            ESEWA: { openingBalance: 0, openingBalanceDate: '' },
                            RBB: { openingBalance: 0, openingBalanceDate: '' },
                            SAHAKARI: { openingBalance: 0, openingBalanceDate: '' },
                            DUE: { openingBalance: 0, openingBalanceDate: '' }
                          },
                          invoices,
                          expenses,
                          transactions,
                          salaryDistributions,
                          accountTransfers,
                          dailyClosings
                        };
                        const cashBal = calculateAccountBalance('CASH', currentBalData);
                        const esewaBal = calculateAccountBalance('ESEWA', currentBalData);
                        const rbbBal = calculateAccountBalance('RBB', currentBalData);
                        const sahakariBal = calculateAccountBalance('SAHAKARI', currentBalData);

                        const numBase = typeof baseSalary === 'number' ? baseSalary : (parseFloat(baseSalary) || 0);
                        const numAllowances = typeof allowances === 'number' ? allowances : (parseFloat(allowances) || 0);
                        const numDeductions = typeof deductions === 'number' ? deductions : (parseFloat(deductions) || 0);
                        const netPayable = Math.max(0, numBase + numAllowances - numDeductions);

                        const splitSum = Number(salarySplits.Cash || 0) + Number(salarySplits.Esewa || 0) + Number(salarySplits.RBB || 0) + Number(salarySplits.Sahakari || 0);
                        const diff = netPayable - splitSum;

                        return (
                          <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-indigo-950 font-mono uppercase">
                                Salary Split Breakdown
                              </span>
                              <span className={`text-[10.5px] font-bold font-mono px-2 py-0.5 rounded-md ${
                                Math.abs(diff) < 0.01 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                Allocated: Rs. {splitSum.toLocaleString()} / Rs. {netPayable.toLocaleString()}
                                {Math.abs(diff) >= 0.01 && ` (${diff > 0 ? `Rs. ${diff.toLocaleString()} remaining` : `Rs. ${Math.abs(diff).toLocaleString()} over`})`}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="font-bold text-slate-700">💵 Cash</span>
                                  <span className={`font-mono ${cashBal < Number(salarySplits.Cash || 0) ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                                    Avail: {cashBal.toLocaleString()}
                                  </span>
                                </div>
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={salarySplits.Cash !== undefined ? salarySplits.Cash : ''}
                                  onChange={(e) => setSalarySplits(prev => ({ ...prev, Cash: parseFloat(e.target.value) || 0 }))}
                                  className={`w-full border rounded-lg p-1.5 text-xs font-mono font-bold bg-white focus:outline-hidden ${
                                    cashBal < Number(salarySplits.Cash || 0) ? 'border-rose-400 text-rose-700 bg-rose-50/40' : 'border-slate-200'
                                  }`}
                                />
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="font-bold text-slate-700">📱 eSewa</span>
                                  <span className={`font-mono ${esewaBal < Number(salarySplits.Esewa || 0) ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                                    Avail: {esewaBal.toLocaleString()}
                                  </span>
                                </div>
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={salarySplits.Esewa !== undefined ? salarySplits.Esewa : ''}
                                  onChange={(e) => setSalarySplits(prev => ({ ...prev, Esewa: parseFloat(e.target.value) || 0 }))}
                                  className={`w-full border rounded-lg p-1.5 text-xs font-mono font-bold bg-white focus:outline-hidden ${
                                    esewaBal < Number(salarySplits.Esewa || 0) ? 'border-rose-400 text-rose-700 bg-rose-50/40' : 'border-slate-200'
                                  }`}
                                />
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="font-bold text-slate-700">🏦 RBB Bank</span>
                                  <span className={`font-mono ${rbbBal < Number(salarySplits.RBB || 0) ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                                    Avail: {rbbBal.toLocaleString()}
                                  </span>
                                </div>
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={salarySplits.RBB !== undefined ? salarySplits.RBB : ''}
                                  onChange={(e) => setSalarySplits(prev => ({ ...prev, RBB: parseFloat(e.target.value) || 0 }))}
                                  className={`w-full border rounded-lg p-1.5 text-xs font-mono font-bold bg-white focus:outline-hidden ${
                                    rbbBal < Number(salarySplits.RBB || 0) ? 'border-rose-400 text-rose-700 bg-rose-50/40' : 'border-slate-200'
                                  }`}
                                />
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="font-bold text-slate-700">🏦 Sahakari</span>
                                  <span className={`font-mono ${sahakariBal < Number(salarySplits.Sahakari || 0) ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                                    Avail: {sahakariBal.toLocaleString()}
                                  </span>
                                </div>
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={salarySplits.Sahakari !== undefined ? salarySplits.Sahakari : ''}
                                  onChange={(e) => setSalarySplits(prev => ({ ...prev, Sahakari: parseFloat(e.target.value) || 0 }))}
                                  className={`w-full border rounded-lg p-1.5 text-xs font-mono font-bold bg-white focus:outline-hidden ${
                                    sahakariBal < Number(salarySplits.Sahakari || 0) ? 'border-rose-400 text-rose-700 bg-rose-50/40' : 'border-slate-200'
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">Internal Remarks / Narration</label>
                        <input 
                          type="text"
                          placeholder="e.g. Salary disbursed with festive allowance"
                          value={salaryRemarks}
                          onChange={(e) => setSalaryRemarks(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 focus:outline-hidden"
                        />
                      </div>

                      {/* Net Total display */}
                      <div className="bg-indigo-50/60 rounded-xl p-3.5 border border-indigo-100 flex justify-between items-center text-xs font-mono">
                        <span className="font-bold text-indigo-900">Net Disbursed Take-home Salary:</span>
                        <span className="font-black text-indigo-950 text-base">Rs. {(baseSalary + allowances - deductions).toLocaleString()}</span>
                      </div>

                      <div className="pt-2 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedStaffForSalary(null)}
                          className="w-1/3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-2.5 rounded-xl transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition cursor-pointer shadow-xs"
                        >
                          Confirm & Disburse Salary
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Admin Disbursed Salary History Logs */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Disbursed Salary History & Payout Logs</h3>
                    <p className="text-[10px] text-slate-400">All historical salary distributions recorded in the system.</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">
                    Total Logs: {salaryDistributions.length}
                  </span>
                </div>

                {salaryDistributions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-8">No salary payouts disbursed yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-100">
                          <th className="py-3 px-4 font-bold">Staff Member</th>
                          <th className="py-3 px-4 font-bold">Dispatched Month</th>
                          <th className="py-3 px-4 font-bold">Payout Date</th>
                          <th className="py-3 px-4 font-bold">Base Rate</th>
                          <th className="py-3 px-4 font-bold">Bonus / Allowances</th>
                          <th className="py-3 px-4 font-bold font-mono">Net Paid</th>
                          <th className="py-3 px-4 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {[...salaryDistributions]
                          .sort((a, b) => b.distributionDate.localeCompare(a.distributionDate) || b.month.localeCompare(a.month))
                          .map(sd => (
                            <tr key={sd.id} className="hover:bg-slate-55/30 transition">
                              <td className="py-3.5 px-4">
                                <span className="font-bold text-slate-800">{sd.userName}</span>
                                <p className="text-[10px] text-slate-400">{sd.post}</p>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-indigo-600 font-mono">
                                {formatBsMonth(sd.month)}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                                {sd.distributionDate}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-700">
                                Rs. {sd.baseSalary.toLocaleString()}
                              </td>
                              <td className="py-3.5 px-4 font-mono">
                                {sd.allowances > 0 ? (
                                  <div>
                                    <span className="text-emerald-600 font-bold">+Rs. {sd.allowances.toLocaleString()}</span>
                                    {sd.bonusReason && (
                                      <p className="text-[9.5px] font-sans text-slate-500 font-medium">
                                        ({sd.bonusReason})
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                                Rs. {sd.netPaid.toLocaleString()}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handlePrintStatement(sd)}
                                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition border border-slate-200/50 cursor-pointer"
                                  >
                                    <Printer size={11} />
                                    <span>Payslip</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const isSystemMaster = currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin';
                                      if (!isSystemMaster) {
                                        alert('Direct deletion is allowed for System Master (@reliableadmin) only.');
                                        return;
                                      }
                                      if (confirm(`Delete salary distribution record for ${sd.staffName} (${sd.month})?`)) {
                                        if (onDeleteSalaryDistribution) {
                                          onDeleteSalaryDistribution(sd.id);
                                        }
                                      }
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                    title={currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin' ? "Delete Record" : "Delete (System Master Only)"}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* STAFF VIEW: View personal salary logs and print payslip */
            <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                My Monthly Salary Statement Logs
              </h3>

              {salaryDistributions.filter(r => r.userId === currentUser.id).length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-12">No salary distribution records registered yet for your profile.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-100">
                        <th className="py-3 px-4 font-bold">Month (BS)</th>
                        <th className="py-3 px-4 font-bold">Base Rate</th>
                        <th className="py-3 px-4 font-bold text-center">Allowances / Deductions</th>
                        <th className="py-3 px-4 font-bold text-center font-mono">Net Received</th>
                        <th className="py-3 px-4 font-bold text-center">Payout Date</th>
                        <th className="py-3 px-4 font-bold text-right">Certificate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-mono text-slate-600">
                      {salaryDistributions
                        .filter(r => r.userId === currentUser.id)
                        .sort((a, b) => b.month.localeCompare(a.month))
                        .map(sd => (
                          <tr key={sd.id} className="hover:bg-slate-55/30 transition">
                            <td className="py-3.5 px-4 font-bold text-indigo-600 font-sans">{formatBsMonth(sd.month)}</td>
                            <td className="py-3.5 px-4">Rs. {sd.baseSalary.toLocaleString()}</td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="text-emerald-600 font-semibold">
                                +Rs. {sd.allowances}
                                {sd.bonusReason && (
                                  <span className="ml-1 text-[10px] text-slate-500 font-normal">({sd.bonusReason})</span>
                                )}
                              </span> 
                              {' / '} 
                              <span className="text-rose-600 font-semibold">-Rs. {sd.deductions}</span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-slate-800 text-sm">Rs. {sd.netPaid.toLocaleString()}</td>
                            <td className="py-3.5 px-4 text-center font-sans text-xs text-slate-500">{sd.distributionDate}</td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handlePrintStatement(sd)}
                                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200/50 transition font-sans cursor-pointer"
                              >
                                <Printer size={11} />
                                <span>Generate Statement</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 4: REPORTS */}
      {activeSubTab === 'reports' && isAdmin && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Generate Staff Performance Reports</h3>
              <p className="text-[10px] text-slate-400">Generate monthly attendance sheets and payroll distribution reports.</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-500">Report Month (BS):</span>
              <input 
                type="text"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                placeholder="YYYY-MM"
                className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-indigo-600 focus:outline-hidden w-24 text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Active Staff Count</span>
              <span className="text-xl font-extrabold text-slate-800 block mt-1">{users.length} Active Employees</span>
            </div>
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Total Payroll Disbursed</span>
              <span className="text-xl font-extrabold text-indigo-600 block mt-1">
                Rs. {salaryDistributions
                  .filter(sd => sd.month === filterMonth)
                  .reduce((sum, sd) => sum + sd.netPaid, 0)
                  .toLocaleString()
                }
              </span>
            </div>
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Leaves Approved</span>
              <span className="text-xl font-extrabold text-amber-600 block mt-1">
                {leaveRequests.filter(l => l.status === 'Approved' && l.startDate.startsWith(filterMonth)).length} Leaves
              </span>
            </div>
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Unpaid Staff</span>
              <span className="text-xl font-extrabold text-rose-600 block mt-1">
                {users.length - salaryDistributions.filter(sd => sd.month === filterMonth).length} Staff
              </span>
            </div>
          </div>

          {/* Full overview list */}
          <div className="border border-slate-150 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
            <div className="bg-slate-50/80 px-4 py-2 flex justify-between font-bold text-[10px] text-slate-500 font-mono uppercase">
              <span>Staff Name</span>
              <div className="flex gap-16">
                <span className="w-28 text-center">Month Attendance</span>
                <span className="w-24 text-right">Payout Received</span>
              </div>
            </div>

            {users.map(staff => {
              const myLogs = attendanceRecords.filter(r => r.userId === staff.id && r.date.startsWith(filterMonth));
              const present = myLogs.filter(l => l.status === 'Present').length;
              const half = myLogs.filter(l => l.status === 'Half Day').length;
              const leaves = myLogs.filter(l => l.status === 'On Leave').length;
              const absent = myLogs.filter(l => l.status === 'Absent').length;

              const salary = salaryDistributions.find(sd => sd.userId === staff.id && sd.month === filterMonth);

              return (
                <div key={staff.id} className="px-4 py-3 flex justify-between items-center hover:bg-slate-50/30 transition">
                  <div>
                    <span className="font-bold text-slate-800 text-sm">{staff.name}</span>
                    <p className="text-[10px] text-slate-500 font-mono">{staff.post || 'Staff'}</p>
                  </div>
                  <div className="flex gap-16 items-center">
                    <div className="w-28 text-center font-mono font-bold text-[10.5px]">
                      <span className="text-emerald-600" title="Present">{present}P</span> • <span className="text-indigo-600" title="Half Day">{half}H</span> • <span className="text-amber-500" title="Leave">{leaves}L</span> • <span className="text-rose-600" title="Absent">{absent}A</span>
                    </div>
                    <div className="w-24 text-right font-mono font-black text-slate-700">
                      {salary ? `Rs. ${salary.netPaid.toLocaleString()}` : <span className="text-rose-500 font-bold uppercase text-[9px]">Unpaid</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Daily Attendance Records with Filters */}
          <div className="border border-slate-100 rounded-xl p-5 space-y-4 bg-slate-50/20">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3 flex-wrap gap-4">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Detailed Daily Attendance Log</h4>
                <p className="text-[10px] text-slate-400">Filter individual employee logs and print certified records.</p>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap text-xs">
                {/* Employee Filter Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-500">Employee:</span>
                  <select
                    value={filterStaffId}
                    onChange={(e) => setFilterStaffId(e.target.value)}
                    className="border border-slate-200 bg-white rounded-lg px-2.5 py-1 text-xs focus:outline-hidden cursor-pointer"
                  >
                    <option value="">All Employees</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-500">Status:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-slate-200 bg-white rounded-lg px-2.5 py-1 text-xs focus:outline-hidden cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    <option value="Present">Present</option>
                    <option value="Half Day">Half Day</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>

                {/* Print Button */}
                <button
                  type="button"
                  onClick={() => {
                    const filtered = attendanceRecords.filter(record => {
                      if (filterMonth && !record.date.startsWith(filterMonth)) return false;
                      if (filterStaffId && record.userId !== filterStaffId) return false;
                      if (filterStatus && record.status !== filterStatus) return false;
                      return true;
                    }).map(record => {
                      const staff = users.find(u => u.id === record.userId);
                      return {
                        ...record,
                        userName: staff ? staff.name : record.userName,
                        post: staff ? staff.post : 'Staff'
                      };
                    }).sort((a, b) => b.date.localeCompare(a.date));

                    setPrintingAttendanceList(filtered);
                    if (window.openUniversalPrintPreview) {
                      window.openUniversalPrintPreview({
                        documentType: 'Attendance Audit',
                        documentNumber: `ATT-${filterMonth || 'ALL'}`,
                        documentDate: getCurrentBsDate(),
                        profile: profile,
                        title: 'Official Staff Attendance & Leave Registry',
                        notes: `Total Records: ${filtered.length}. Filter Month: ${filterMonth || 'All Months'}. Generated by ${currentUser.name}.`,
                        preparedBy: currentUser.name,
                        approvedBy: `${profile?.name || 'Authorized'} HR`
                      });
                    } else {
                      setTimeout(() => {
                        window.print();
                      }, 300);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10.5px] font-bold px-3.5 py-1.5 rounded-lg shadow-xs hover:shadow-md transition cursor-pointer"
                >
                  <Printer size={12} />
                  <span>Print Record</span>
                </button>
              </div>
            </div>

            {/* Daily logs list table */}
            <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Employee Name</th>
                      <th className="px-4 py-3">Position</th>
                      <th className="px-4 py-3 text-center">Time-In</th>
                      <th className="px-4 py-3 text-center">Time-Out</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Approval Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {(() => {
                      const filtered = attendanceRecords.filter(record => {
                        if (filterMonth && !record.date.startsWith(filterMonth)) return false;
                        if (filterStaffId && record.userId !== filterStaffId) return false;
                        if (filterStatus && record.status !== filterStatus) return false;
                        return true;
                      }).sort((a, b) => b.date.localeCompare(a.date));

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                              No matching daily attendance logs found for this filter criteria.
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map(record => {
                        const staff = users.find(u => u.id === record.userId);
                        return (
                          <tr key={record.id} className="hover:bg-slate-50/50 transition">
                            <td className="px-4 py-3 font-mono font-bold text-slate-600">{record.date}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800">{staff ? staff.name : record.userName}</td>
                            <td className="px-4 py-3 text-slate-500 font-mono text-[10.5px]">{staff ? staff.post : 'Staff'}</td>
                            <td className="px-4 py-3 text-center font-mono">{record.timeIn || '—'}</td>
                            <td className="px-4 py-3 text-center font-mono">{record.timeOut || '—'}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                record.status === 'Present' ? 'bg-emerald-100 text-emerald-800' :
                                record.status === 'Half Day' ? 'bg-indigo-100 text-indigo-800' :
                                record.status === 'On Leave' ? 'bg-amber-100 text-amber-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-semibold">
                              {record.approvedByAdmin ? (
                                <span className="text-emerald-600 text-[10.5px] flex items-center justify-center gap-1">
                                  <Check size={11} strokeWidth={3} />
                                  <span>Verified</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10.5px]">Auto-logged</span>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY AREA FOR STAFF ATTENDANCE RECORD SHEET */}
      {printingAttendanceList && (
        <div className="hidden print:block fixed inset-0 bg-white p-10 font-sans text-xs text-slate-800 space-y-8" id="po-print-area">
          {/* Header Letterhead */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
            <div className="flex items-start gap-3">
              {profile.logoUrl && (
                <img 
                  src={profile.logoUrl} 
                  alt="Logo" 
                  className="w-12 h-12 rounded-lg object-contain border border-slate-100 p-0.5 bg-white shrink-0" 
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="space-y-1">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">{profile.name}</h1>
                <p className="text-xs text-slate-500">{profile.location}</p>
                <p className="text-[11px] text-slate-500 font-mono">Phone: {profile.phone} | Email: {profile.email}</p>
                <p className="text-[11px] text-slate-500 font-mono">PAN: {profile.panNumber}</p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <span className="inline-block bg-slate-100 border border-slate-300 text-slate-850 text-[10px] font-extrabold px-3 py-1 rounded-sm uppercase tracking-wider">Attendance Register</span>
              <p className="text-xs font-bold text-slate-850 font-mono mt-1">Generated: {getCurrentBsDate()}</p>
              <p className="text-[11px] text-slate-500">Report Month: <span className="font-mono font-bold">{formatBsMonth(filterMonth)}</span></p>
              {filterStaffId && (
                <p className="text-[11px] text-slate-500">Employee: <span className="font-bold">{users.find(u => u.id === filterStaffId)?.name || 'Staff'}</span></p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black border-b border-slate-300 pb-1 uppercase tracking-wide text-slate-900">
              {filterStaffId 
                ? `Attendance Ledger - ${users.find(u => u.id === filterStaffId)?.name}` 
                : "Staff Daily Attendance Summary Ledger"
              }
            </h3>

            {/* Attendance list table */}
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-100 font-bold">
                  <th className="py-2 px-3 text-slate-700">Date</th>
                  <th className="py-2 px-3 text-slate-700">Employee Name</th>
                  <th className="py-2 px-3 text-slate-700">Designation</th>
                  <th className="py-2 px-3 text-slate-700 text-center">Time-In</th>
                  <th className="py-2 px-3 text-slate-700 text-center">Time-Out</th>
                  <th className="py-2 px-3 text-slate-700 text-center">Status</th>
                  <th className="py-2 px-3 text-slate-700 text-center">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-mono text-[11px]">
                {printingAttendanceList.map(record => (
                  <tr key={record.id} className="text-slate-800">
                    <td className="py-2.5 px-3 font-bold">{record.date}</td>
                    <td className="py-2.5 px-3 font-sans font-semibold">{record.userName}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600">{record.post}</td>
                    <td className="py-2.5 px-3 text-center">{record.timeIn || '—'}</td>
                    <td className="py-2.5 px-3 text-center">{record.timeOut || '—'}</td>
                    <td className="py-2.5 px-3 text-center font-sans font-bold">
                      {record.status}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      {record.approvedByAdmin ? "Verified" : "Auto-logged"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Attendance statistics footer summary */}
            <div className="bg-slate-50 border border-slate-300 p-4 rounded-lg flex justify-between items-center text-xs font-bold text-slate-700 flex-wrap gap-4 font-mono">
              <span>Total Logs: {printingAttendanceList.length}</span>
              <span>Present: {printingAttendanceList.filter(l => l.status === 'Present').length}</span>
              <span>Half Day: {printingAttendanceList.filter(l => l.status === 'Half Day').length}</span>
              <span>On Leave: {printingAttendanceList.filter(l => l.status === 'On Leave').length}</span>
              <span>Absent: {printingAttendanceList.filter(l => l.status === 'Absent').length}</span>
            </div>
          </div>

          {/* Official Signatures */}
          <div className="pt-24 flex justify-between items-end">
            <div className="text-center w-40">
              <div className="border-b border-slate-400 h-8"></div>
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Prepared By</p>
            </div>
            <div className="text-center w-48">
              <div className="border-b border-slate-900 h-8"></div>
              <p className="text-[10px] text-slate-800 mt-1 uppercase font-black tracking-wider">Authorized Seal / Sign</p>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY AREA FOR SALARY PAYSLIP STATEMENT */}
      {printingPayslip && (
        <div className="hidden print:block fixed inset-0 bg-white p-10 font-sans text-xs text-slate-800 space-y-8" id="po-print-area">
          {/* Header Letterhead */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
            <div className="flex items-start gap-3">
              {profile.logoUrl && (
                <img 
                  src={profile.logoUrl} 
                  alt="Logo" 
                  className="w-12 h-12 rounded-lg object-contain border border-slate-100 p-0.5 bg-white shrink-0" 
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="space-y-1">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">{profile.name}</h1>
                <p className="text-xs text-slate-500">{profile.location}</p>
                <p className="text-[11px] text-slate-500 font-mono">Phone: {profile.phone} | Email: {profile.email}</p>
                <p className="text-[11px] text-slate-500 font-mono">PAN: {profile.panNumber}</p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <span className="inline-block bg-slate-100 border border-slate-300 text-slate-850 text-[10px] font-extrabold px-3 py-1 rounded-sm uppercase tracking-wider">Salary Payslip</span>
              <p className="text-xs font-bold text-slate-850 font-mono mt-1">Voucher #: {printingPayslip.id.toUpperCase()}</p>
              <p className="text-[11px] text-slate-500">Month: <span className="font-mono font-bold">{formatBsMonth(printingPayslip.month)}</span></p>
              <p className="text-[11px] text-slate-500">Date Disbursed: <span className="font-mono">{printingPayslip.distributionDate}</span></p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-black border-b border-slate-300 pb-1 uppercase tracking-wide">Employee Statement Details:</h3>
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <p><span className="text-slate-500">Employee Name:</span> <strong className="text-slate-900">{printingPayslip.userName}</strong></p>
              <p><span className="text-slate-500">Post / Designation:</span> <strong className="text-slate-900">{printingPayslip.post}</strong></p>
              <p><span className="text-slate-500">Payment Channel:</span> <strong className="text-slate-900 uppercase font-mono">{printingPayslip.paymentMethod}</strong></p>
              <p><span className="text-slate-500">Disbursal Status:</span> <strong className="text-emerald-700 uppercase">Fully Disbursed & Settled</strong></p>
            </div>
          </div>

          {/* Salary breakdown table */}
          <div className="space-y-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-100">
                  <th className="py-2 px-3 font-semibold text-slate-600">Earnings & Allowances</th>
                  <th className="py-2 px-3 font-semibold text-slate-600 text-right">Amount (Rs.)</th>
                  <th className="py-2 px-3 font-semibold text-slate-600">Deductions & Offsets</th>
                  <th className="py-2 px-3 font-semibold text-slate-600 text-right">Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-mono">
                <tr>
                  <td className="py-2 px-3 font-sans">Basic Salary Rate</td>
                  <td className="py-2 px-3 text-right">Rs. {printingPayslip.baseSalary.toLocaleString()}</td>
                  <td className="py-2 px-3 font-sans">Absence / Fine Deduction</td>
                  <td className="py-2 px-3 text-right text-rose-600">Rs. {printingPayslip.deductions.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans">
                    Bonus / Allowance
                    {printingPayslip.bonusReason && (
                      <span className="font-bold text-slate-800"> ({printingPayslip.bonusReason})</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right text-emerald-600">Rs. {printingPayslip.allowances.toLocaleString()}</td>
                  <td className="py-2 px-3 font-sans">-</td>
                  <td className="py-2 px-3 text-right">-</td>
                </tr>
                <tr className="border-t border-slate-900 font-bold font-sans bg-slate-50 font-mono">
                  <td className="py-2.5 px-3">Gross Earnings</td>
                  <td className="py-2.5 px-3 text-right">Rs. {(printingPayslip.baseSalary + printingPayslip.allowances).toLocaleString()}</td>
                  <td className="py-2.5 px-3">Total Deductions</td>
                  <td className="py-2.5 px-3 text-right">Rs. {printingPayslip.deductions.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Net Pay Box */}
          <div className="bg-slate-100 p-4 rounded-lg flex justify-between items-center text-xs font-bold border border-slate-300">
            <span className="text-slate-700 uppercase tracking-wide">Net Disbursed Take-home Salary:</span>
            <span className="text-sm font-mono font-black text-slate-900">Rs. {printingPayslip.netPaid.toLocaleString()}</span>
          </div>

          {printingPayslip.remarks && (
            <p className="bg-slate-50 p-2 border border-slate-200 text-[11px] text-slate-600 italic">
              <strong>Narration:</strong> {printingPayslip.remarks}
            </p>
          )}

          {/* Official Signatures */}
          <div className="pt-20 flex justify-between items-end">
            <div className="text-center w-40">
              <div className="border-b border-slate-400 h-8"></div>
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Employee Signature</p>
            </div>
            <div className="text-center w-48">
              <div className="border-b border-slate-900 font-mono text-[10px] font-bold pb-1 text-slate-900">
                {printingPayslip.approvedBy || 'ADMINISTRATOR'}
              </div>
              <p className="text-[10px] text-slate-800 mt-1 uppercase font-black tracking-wider">Authorized Seal / Sign</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
