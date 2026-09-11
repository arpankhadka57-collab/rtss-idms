import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Activity, 
  Clock, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  TrendingDown, 
  CalendarRange, 
  ShieldCheck, 
  UserCheck, 
  AlertCircle,
  Package,
  ArrowRight,
  Receipt,
  CalendarCheck
} from 'lucide-react';
import { 
  AppUser, 
  EditRequest, 
  SupplyTransaction, 
  InventoryRequest, 
  LeaveRequest, 
  AttendanceRequest, 
  Supplier,
  Expense,
  DailyClosing
} from '../types';

interface StaffRequestsListProps {
  currentUser: AppUser;
  editRequests: EditRequest[];
  onApproveEditRequest: (id: string, remarks?: string) => void;
  onDeclineEditRequest: (id: string, remarks?: string) => void;
  
  transactions: SupplyTransaction[];
  onUpdateTransaction: (tx: SupplyTransaction) => void;
  suppliers: Supplier[];

  inventoryRequests: InventoryRequest[];
  onApproveInventoryRequest: (id: string) => void;
  onDeclineInventoryRequest: (id: string) => void;

  leaveRequests: LeaveRequest[];
  onUpdateLeaveRequest: (id: string, status: 'Approved' | 'Rejected', adminRemarks: string) => void;

  attendanceRequests: AttendanceRequest[];
  onApproveAttendanceRequest: (id: string, remarks?: string) => void;
  onDeclineAttendanceRequest: (id: string, remarks?: string) => void;

  expenses?: Expense[];
  onApproveExpense?: (id: string) => void;
  onDeclineExpense?: (id: string) => void;

  dailyClosings?: DailyClosing[];
  onApproveClosing?: (id: string, status: 'Approved' | 'Rejected', adminRemarks: string, adminName: string) => void;
}

export const StaffRequestsList: React.FC<StaffRequestsListProps> = ({
  currentUser,
  editRequests,
  onApproveEditRequest,
  onDeclineEditRequest,
  transactions,
  onUpdateTransaction,
  suppliers,
  inventoryRequests,
  onApproveInventoryRequest,
  onDeclineInventoryRequest,
  leaveRequests,
  onUpdateLeaveRequest,
  attendanceRequests,
  onApproveAttendanceRequest,
  onDeclineAttendanceRequest,
  expenses = [],
  onApproveExpense,
  onDeclineExpense,
  dailyClosings = [],
  onApproveClosing
}) => {
  const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'Super Admin';
  
  // Current active sub-queue
  const [activeTab, setActiveTab] = useState<'ledger' | 'po' | 'inventory' | 'expenses' | 'closings' | 'leaves' | 'attendance'>('ledger');
  
  // Decision remarks inputs per request ID
  const [decisionRemarks, setDecisionRemarks] = useState<{ [id: string]: string }>({});

  const handleRemarksChange = (id: string, val: string) => {
    setDecisionRemarks(prev => ({ ...prev, [id]: val }));
  };

  // Helper count providers
  const pendingLedgerCount = editRequests.filter(r => r.status === 'Pending').length;
  const pendingPoCount = transactions.filter(t => t.status === 'Pending Approval').length;
  const pendingInventoryCount = inventoryRequests.filter(r => r.status === 'Pending').length;
  const pendingExpensesCount = expenses.filter(e => e.status === 'Pending Approval' || (e.status as string) === 'Pending').length;
  const pendingClosingsCount = dailyClosings.filter(c => c.status === 'Pending').length;
  const pendingLeavesCount = leaveRequests.filter(r => r.status === 'Pending').length;
  const pendingAttendanceCount = attendanceRequests.filter(r => r.status === 'Pending').length;

  const totalPendingCount = pendingLedgerCount + pendingPoCount + pendingInventoryCount + pendingExpensesCount + pendingClosingsCount + pendingLeavesCount + pendingAttendanceCount;

  return (
    <div className="space-y-8 animate-fade-in" id="staff-requests-tab">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-display flex items-center gap-2">
            <span>Staff Requests & Approval Center</span>
            {totalPendingCount > 0 && (
              <span className="bg-rose-500 text-white text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                {totalPendingCount} Pending
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin 
              ? 'Centralized command center to review, verify, and approve all administrative, inventory, expense, closing, leave, and attendance requests.'
              : 'Track the real-time status of your submitted ledger overrides, expenses, daily closings, leaves, and attendance requests.'}
          </p>
        </div>
      </div>

      {/* Sub-Tabs Grid Selector */}
      <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'ledger' 
              ? 'bg-white text-indigo-600 shadow-xs' 
              : 'text-slate-600 hover:text-indigo-600'
          }`}
        >
          <Activity size={14} />
          <span>Ledger Overrides</span>
          {pendingLedgerCount > 0 && (
            <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full font-mono">{pendingLedgerCount}</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('po')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'po' 
              ? 'bg-white text-indigo-600 shadow-xs' 
              : 'text-slate-600 hover:text-indigo-600'
          }`}
        >
          <TrendingDown size={14} />
          <span>Purchase Orders</span>
          {pendingPoCount > 0 && (
            <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full font-mono">{pendingPoCount}</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'inventory' 
              ? 'bg-white text-indigo-600 shadow-xs' 
              : 'text-slate-600 hover:text-indigo-600'
          }`}
        >
          <Package size={14} />
          <span>Stock Arrivals</span>
          {pendingInventoryCount > 0 && (
            <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full font-mono">{pendingInventoryCount}</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'expenses' 
              ? 'bg-white text-indigo-600 shadow-xs' 
              : 'text-slate-600 hover:text-indigo-600'
          }`}
        >
          <Receipt size={14} />
          <span>Expense Requests</span>
          {pendingExpensesCount > 0 && (
            <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full font-mono">{pendingExpensesCount}</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('closings')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'closings' 
              ? 'bg-white text-indigo-600 shadow-xs' 
              : 'text-slate-600 hover:text-indigo-600'
          }`}
        >
          <CalendarCheck size={14} />
          <span>Daily Closings</span>
          {pendingClosingsCount > 0 && (
            <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full font-mono">{pendingClosingsCount}</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'leaves' 
              ? 'bg-white text-indigo-600 shadow-xs' 
              : 'text-slate-600 hover:text-indigo-600'
          }`}
        >
          <CalendarRange size={14} />
          <span>Leave Requests</span>
          {pendingLeavesCount > 0 && (
            <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full font-mono">{pendingLeavesCount}</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'attendance' 
              ? 'bg-white text-indigo-600 shadow-xs' 
              : 'text-slate-600 hover:text-indigo-600'
          }`}
        >
          <UserCheck size={14} />
          <span>Attendance (In/Out)</span>
          {pendingAttendanceCount > 0 && (
            <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full font-mono">{pendingAttendanceCount}</span>
          )}
        </button>
      </div>

      {/* RENDER QUEUES BASED ON SELECTED TAB */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
        
        {/* TAB 1: LEDGER OVERRIDES */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Bill & Payment Modifications Queue</h3>
              <p className="text-[10px] text-slate-400">Ledger edit, deletion or override requests triggered by staff invoices.</p>
            </div>

            {editRequests.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <span>📥 No override requests logged</span>
              </div>
            ) : (
              <div className="space-y-4">
                {editRequests.map(req => (
                  <div key={req.id} className="border border-slate-100 p-4.5 rounded-xl bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        req.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                        req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {req.status}
                      </span>
                      <span className="text-slate-400 font-mono">{req.date}</span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{req.type}</h4>
                      <p className="text-xs text-slate-600 mt-1 bg-white p-3 rounded-lg border border-slate-100 font-mono whitespace-pre-wrap">
                        {req.details}
                      </p>
                    </div>

                    {req.remarks && (
                      <p className="text-[10px] bg-slate-100 p-2 rounded text-slate-600 font-mono">
                        <strong>Remarks:</strong> {req.remarks}
                      </p>
                    )}

                    {req.status === 'Pending' && (
                      <div className="space-y-3 pt-2 border-t border-slate-150">
                        {(() => {
                          const isMasterAdmin = currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan';
                          const isInvoiceDeletion = req.type === 'Invoice Deletion';

                          if (isInvoiceDeletion && !isMasterAdmin) {
                            return (
                              <div className="text-xs font-semibold text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                                🔒 This invoice deletion request requires approval specifically by System Master (@reliableadmin).
                              </div>
                            );
                          }

                          if (isAdmin || isMasterAdmin) {
                            return (
                              <>
                                <input 
                                  type="text"
                                  value={decisionRemarks[req.id] || ''}
                                  onChange={(e) => handleRemarksChange(req.id, e.target.value)}
                                  placeholder="Enter decision remarks..."
                                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      onApproveEditRequest(req.id, decisionRemarks[req.id]);
                                      handleRemarksChange(req.id, '');
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                                  >
                                    Approve Request
                                  </button>
                                  <button
                                    onClick={() => {
                                      onDeclineEditRequest(req.id, decisionRemarks[req.id]);
                                      handleRemarksChange(req.id, '');
                                    }}
                                    className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                                  >
                                    Decline Request
                                  </button>
                                </div>
                              </>
                            );
                          }

                          return (
                            <span className="text-[10px] text-slate-400 italic">Awaiting Admin decision.</span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PURCHASE ORDERS */}
        {activeTab === 'po' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Supply Purchase Order Approvals</h3>
              <p className="text-[10px] text-slate-400">Review and authorize purchase orders requested to suppliers/vendors.</p>
            </div>

            {transactions.filter(t => t.status === 'Pending Approval').length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <span>📥 No pending purchase orders</span>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.filter(t => t.status === 'Pending Approval').map(tx => {
                  const supplier = suppliers.find(s => s.id === tx.supplierId);
                  return (
                    <div key={tx.id} className="border border-slate-100 p-4.5 rounded-xl bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 font-mono">PO #{tx.id.replace('tx-', '')}</span>
                        <span className="text-slate-400 font-mono">{tx.date}</span>
                      </div>

                      <div className="text-xs text-slate-700 space-y-1">
                        <p>Supplier/Vendor: <strong className="text-slate-900">{supplier ? supplier.name : 'Procurement Partner'}</strong></p>
                        <p>Total Cost Rate: <strong className="text-indigo-600">{(tx.amountPaid + tx.amountDue) > 0 ? `Rs. ${(tx.amountPaid + tx.amountDue).toLocaleString()}` : 'Price TBD'}</strong></p>
                      </div>

                      {/* Items block */}
                      <div className="bg-white p-3 rounded-lg border border-slate-100 text-[11px] space-y-1.5">
                        <p className="font-bold text-slate-400 font-mono uppercase text-[9px] tracking-wider">Requested Supplies:</p>
                        {tx.items && tx.items.length > 0 ? (
                          tx.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between font-mono text-slate-600">
                              <span>• {it.name}</span>
                              <span>{it.quantity} {it.unitType || 'pcs'}</span>
                            </div>
                          ))
                        ) : (
                          <p>{tx.itemsBought}</p>
                        )}
                      </div>

                      {isAdmin ? (
                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => onUpdateTransaction({ ...tx, status: 'Approved' })}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                          >
                            Approve & Authorize
                          </button>
                          <button
                            onClick={() => onUpdateTransaction({ ...tx, status: 'Rejected' })}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                          >
                            Reject PO
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Awaiting Admin approval.</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INVENTORY ARRIVALS */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Stock Arrival & Receipt Approvals</h3>
              <p className="text-[10px] text-slate-400">Authorize incoming materials and increment warehouse counts.</p>
            </div>

            {inventoryRequests.filter(r => r.status === 'Pending').length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <span>📥 No pending stock arrivals</span>
              </div>
            ) : (
              <div className="space-y-4">
                {inventoryRequests.filter(r => r.status === 'Pending').map(req => {
                  const supplier = suppliers.find(s => s.id === req.supplierId);
                  return (
                    <div key={req.id} className="border border-slate-100 p-4.5 rounded-xl bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 font-mono">Arrival REQ #{req.id.replace('inv-req-', '')}</span>
                        <span className="text-slate-400 font-mono">{req.date}</span>
                      </div>

                      <div className="text-xs text-slate-700">
                        <p>Vendor: <strong className="text-slate-900">{supplier ? supplier.name : 'Unknown Vendor'}</strong></p>
                      </div>

                      {/* Items */}
                      <div className="bg-white p-3 rounded-lg border border-slate-100 text-[11px] space-y-2">
                        <p className="font-bold text-slate-400 font-mono uppercase text-[9px] tracking-wider">Incoming Line Items:</p>
                        {req.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-slate-600">
                            <span>{it.quantity}x {it.name}</span>
                            <span className="font-mono text-[10px]">
                              Cost: <span className="text-rose-600 font-semibold">Rs.{it.costPrice}</span> • Sale: <span className="text-emerald-600 font-semibold">Rs.{it.sellingPrice}</span>
                            </span>
                          </div>
                        ))}
                      </div>

                      {isAdmin ? (
                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => onApproveInventoryRequest(req.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                          >
                            Approve & Inject Stock
                          </button>
                          <button
                            onClick={() => onDeclineInventoryRequest(req.id)}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                          >
                            Decline Arrival
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Awaiting Admin approval.</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EXPENSES QUEUE */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Business Expense Approvals</h3>
              <p className="text-[10px] text-slate-400">Review and authorize operational and voucher expenses submitted by staff.</p>
            </div>

            {expenses.filter(e => e.status === 'Pending Approval' || (e.status as string) === 'Pending').length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <span>📥 No pending expense approval requests</span>
              </div>
            ) : (
              <div className="space-y-4">
                {expenses.filter(e => e.status === 'Pending Approval' || (e.status as string) === 'Pending').map(exp => (
                  <div key={exp.id} className="border border-slate-100 p-4.5 rounded-xl bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 font-mono">{exp.category || 'General Expense'}</span>
                        {exp.expenseNo && <span className="text-slate-400 font-mono text-[10px] ml-2">({exp.expenseNo})</span>}
                      </div>
                      <span className="text-slate-400 font-mono">{exp.date}</span>
                    </div>

                    <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-100 space-y-1">
                      <p>Title/Purpose: <strong className="text-slate-900">{exp.title}</strong></p>
                      {exp.topic && <p>Topic: <span className="font-medium text-slate-800">{exp.topic}</span></p>}
                      <p>Amount: <strong className="text-rose-600 font-mono font-bold">Rs. {exp.amount.toLocaleString()}</strong></p>
                      <p>Payment Source: <span className="font-medium text-slate-800">{exp.paymentMethod || 'Cash'}</span></p>
                      {exp.remarks && <p className="text-slate-500 italic mt-1 font-mono">" {exp.remarks} "</p>}
                      {exp.createdBy && <p className="text-[10px] text-slate-400 mt-1">Submitted by: {exp.createdBy}</p>}
                    </div>

                    {isAdmin ? (
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        {onApproveExpense && (
                          <button
                            onClick={() => onApproveExpense(exp.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            Approve Expense
                          </button>
                        )}
                        {onDeclineExpense && (
                          <button
                            onClick={() => onDeclineExpense(exp.id)}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            Decline Expense
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Awaiting Admin approval.</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: DAILY CLOSINGS QUEUE */}
        {activeTab === 'closings' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Daily & Periodic Closing Approvals</h3>
              <p className="text-[10px] text-slate-400">Review register closing balance audits and locks submitted by staff.</p>
            </div>

            {dailyClosings.filter(c => c.status === 'Pending').length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <span>📥 No pending register closing approvals</span>
              </div>
            ) : (
              <div className="space-y-4">
                {dailyClosings.filter(c => c.status === 'Pending').map(closing => (
                  <div key={closing.id} className="border border-slate-100 p-4.5 rounded-xl bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 font-mono">Closing Date: {closing.date}</span>
                      <span className="text-slate-400 font-mono text-[10px]">Staff: {closing.closedBy || 'Staff'}</span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-xs grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-mono">System Cash:</span>
                        <p className="font-bold text-slate-800 font-mono">Rs. {closing.systemCalculatedCash.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-mono">Physical Cash:</span>
                        <p className="font-bold text-emerald-600 font-mono">Rs. {closing.physicalCashCount.toLocaleString()}</p>
                      </div>
                      <div className="col-span-2 border-t border-slate-100 pt-1.5 flex justify-between">
                        <span className="text-slate-500 text-[10px]">Difference / Shortage:</span>
                        <span className={`font-bold font-mono ${closing.cashDifference < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          Rs. {closing.cashDifference.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {isAdmin ? (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <input
                          type="text"
                          value={decisionRemarks[closing.id] || ''}
                          onChange={(e) => handleRemarksChange(closing.id, e.target.value)}
                          placeholder="Remarks/notes for closing approval..."
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden"
                        />
                        <div className="flex gap-2">
                          {onApproveClosing && (
                            <>
                              <button
                                onClick={() => {
                                  onApproveClosing(closing.id, 'Approved', decisionRemarks[closing.id] || '', currentUser.name);
                                  handleRemarksChange(closing.id, '');
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                              >
                                Approve Register Closing
                              </button>
                              <button
                                onClick={() => {
                                  onApproveClosing(closing.id, 'Rejected', decisionRemarks[closing.id] || '', currentUser.name);
                                  handleRemarksChange(closing.id, '');
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                              >
                                Decline Closing
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Awaiting Admin approval.</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: LEAVE REQUESTS */}
        {activeTab === 'leaves' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Staff Leave & Holiday Authorizations</h3>
              <p className="text-[10px] text-slate-400">Review leave days requested by your staff members.</p>
            </div>

            {leaveRequests.filter(r => r.status === 'Pending').length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <span>📥 No pending leave requests</span>
              </div>
            ) : (
              <div className="space-y-4">
                {leaveRequests.filter(r => r.status === 'Pending').map(req => (
                  <div key={req.id} className="border border-slate-100 p-4.5 rounded-xl bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{req.userName}</span>
                      <span className="text-slate-400 font-mono">{req.dateCreated}</span>
                    </div>

                    <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-100 space-y-1">
                      <p><strong>Duration:</strong> <span className="font-mono text-indigo-600 font-semibold">{req.startDate} to {req.endDate}</span></p>
                      <p><strong>Leave Type:</strong> <span className="bg-slate-100 px-2 py-0.5 rounded font-bold font-mono text-[10px]">{req.leaveType}</span></p>
                      <p className="mt-1 text-slate-500 italic">" {req.reason} "</p>
                    </div>

                    {isAdmin ? (
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <input 
                          type="text"
                          value={decisionRemarks[req.id] || ''}
                          onChange={(e) => handleRemarksChange(req.id, e.target.value)}
                          placeholder="Enter approval/rejection notes..."
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              onUpdateLeaveRequest(req.id, 'Approved', decisionRemarks[req.id] || '');
                              handleRemarksChange(req.id, '');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                          >
                            Approve Leave
                          </button>
                          <button
                            onClick={() => {
                              onUpdateLeaveRequest(req.id, 'Rejected', decisionRemarks[req.id] || '');
                              handleRemarksChange(req.id, '');
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                          >
                            Decline Leave
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Awaiting Admin review.</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: ATTENDANCE CHECK-IN/OUT */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Attendance Check-In & Check-Out Approvals</h3>
              <p className="text-[10px] text-slate-400">Approve staff coming and leaving times to secure attendance metrics.</p>
            </div>

            {attendanceRequests.filter(r => r.status === 'Pending').length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <span>📥 No pending attendance check-in/outs</span>
              </div>
            ) : (
              <div className="space-y-4">
                {attendanceRequests.filter(r => r.status === 'Pending').map(req => (
                  <div key={req.id} className="border border-slate-100 p-4.5 rounded-xl bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-800">{req.userName}</strong>
                        <span className="text-slate-400 font-mono text-[10px] ml-2 font-semibold">({req.date})</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[9px] uppercase ${
                        req.type === 'Check-In' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.type}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-100 flex items-center gap-3 text-xs">
                      <Clock size={16} className="text-indigo-500 shrink-0" />
                      <div>
                        <span className="text-slate-500 font-medium">Logged Time:</span>
                        <strong className="text-slate-800 font-mono font-bold ml-1">{req.time}</strong>
                      </div>
                    </div>

                    {isAdmin ? (
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <input 
                          type="text"
                          value={decisionRemarks[req.id] || ''}
                          onChange={(e) => handleRemarksChange(req.id, e.target.value)}
                          placeholder="Remarks/notes (optional)..."
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              onApproveAttendanceRequest(req.id, decisionRemarks[req.id]);
                              handleRemarksChange(req.id, '');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                          >
                            Approve Attendance
                          </button>
                          <button
                            onClick={() => {
                              onDeclineAttendanceRequest(req.id, decisionRemarks[req.id]);
                              handleRemarksChange(req.id, '');
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                          >
                            Decline Attendance
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Awaiting Admin approval.</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
