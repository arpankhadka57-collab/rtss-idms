import React, { useState } from 'react';
import { Plus, Trash2, X, Check, Save, DollarSign, UserPlus, AlertCircle } from 'lucide-react';
import { ShareTransaction, Shareholder } from '../types';
import { getCurrentBsDate } from '../utils/nepaliDate';

interface MeetingShareTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactions: ShareTransaction[]) => void;
  existingShareholders: Shareholder[];
  transactionType: 'Addition' | 'Return';
  meetingId?: string;
  meetingNumber?: string;
  meetingDate?: string;
  initialTransactions?: ShareTransaction[];
}

interface FormRow {
  id: string;
  shareholderId: string; // 'new' or existing id
  shareholderName: string;
  address: string;
  citizenshipNumber: string;
  totalAmount: number; // total amount
  paidAmount: number; // amount paid now
  remainingBalance: number; // remaining
  paymentMethod: 'Cash' | 'RBB' | 'Esewa' | 'Sahakari' | 'Split';
  transactionDate: string;
  transactionIdNo: string;
  remarks: string;
}

export const MeetingShareTransactionModal: React.FC<MeetingShareTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingShareholders,
  transactionType,
  meetingId = '',
  meetingNumber = '',
  meetingDate = getCurrentBsDate(),
  initialTransactions = []
}) => {
  if (!isOpen) return null;

  const defaultDate = meetingDate || getCurrentBsDate();

  const [rows, setRows] = useState<FormRow[]>(() => {
    if (initialTransactions && initialTransactions.length > 0) {
      return initialTransactions.map((tx, idx) => ({
        id: tx.id || `row-${Date.now()}-${idx}`,
        shareholderId: tx.shareholderId || 'new',
        shareholderName: tx.shareholderName || '',
        address: tx.address || '',
        citizenshipNumber: tx.citizenshipNumber || '',
        totalAmount: tx.amount || 0,
        paidAmount: tx.paidAmount || tx.amount || 0,
        remainingBalance: tx.remainingBalance || 0,
        paymentMethod: tx.paymentMethod || 'RBB',
        transactionDate: tx.transactionDate || defaultDate,
        transactionIdNo: tx.transactionIdNo || '',
        remarks: tx.remarks || ''
      }));
    }

    const firstSh = existingShareholders.length > 0 ? existingShareholders[0] : null;
    return [
      {
        id: `row-${Date.now()}-0`,
        shareholderId: firstSh ? firstSh.id : 'new',
        shareholderName: firstSh ? firstSh.name : '',
        address: firstSh ? firstSh.address : '',
        citizenshipNumber: firstSh ? firstSh.citizenshipNumber : '',
        totalAmount: 0,
        paidAmount: 0,
        remainingBalance: 0,
        paymentMethod: 'RBB',
        transactionDate: defaultDate,
        transactionIdNo: '',
        remarks: ''
      }
    ];
  });

  const handleSelectShareholder = (rowId: string, shId: string) => {
    if (shId === 'new') {
      setRows(prev =>
        prev.map(r =>
          r.id === rowId
            ? { ...r, shareholderId: 'new', shareholderName: '', address: '', citizenshipNumber: '' }
            : r
        )
      );
    } else {
      const sh = existingShareholders.find(s => s.id === shId);
      if (sh) {
        setRows(prev =>
          prev.map(r =>
            r.id === rowId
              ? {
                  ...r,
                  shareholderId: sh.id,
                  shareholderName: sh.name,
                  address: sh.address,
                  citizenshipNumber: sh.citizenshipNumber
                }
              : r
          )
        );
      }
    }
  };

  const handleRowChange = (rowId: string, field: keyof FormRow, value: any) => {
    setRows(prev =>
      prev.map(r => {
        if (r.id !== rowId) return r;

        const updated = { ...r, [field]: value };

        if (field === 'totalAmount' || field === 'paidAmount') {
          const tot = field === 'totalAmount' ? Number(value) || 0 : r.totalAmount;
          const paid = field === 'paidAmount' ? Number(value) || 0 : r.paidAmount;

          if (transactionType === 'Addition') {
            updated.paidAmount = tot;
            updated.remainingBalance = 0;
          } else {
            updated.remainingBalance = Math.max(0, tot - paid);
          }
        }

        return updated;
      })
    );
  };

  const handleAddNextRow = () => {
    const firstSh = existingShareholders.length > 0 ? existingShareholders[0] : null;
    const newRow: FormRow = {
      id: `row-${Date.now()}-${rows.length}`,
      shareholderId: firstSh ? firstSh.id : 'new',
      shareholderName: firstSh ? firstSh.name : '',
      address: firstSh ? firstSh.address : '',
      citizenshipNumber: firstSh ? firstSh.citizenshipNumber : '',
      totalAmount: 0,
      paidAmount: 0,
      remainingBalance: 0,
      paymentMethod: 'RBB',
      transactionDate: defaultDate,
      transactionIdNo: '',
      remarks: ''
    };
    setRows(prev => [...prev, newRow]);
  };

  const handleDeleteRow = (rowId: string) => {
    if (rows.length === 1) {
      alert('At least one transaction record is required.');
      return;
    }
    setRows(prev => prev.filter(r => r.id !== rowId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate rows
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.shareholderName.trim()) {
        alert(`Row ${i + 1}: Shareholder name is required.`);
        return;
      }
      if (!r.paidAmount || r.paidAmount <= 0) {
        alert(`Row ${i + 1}: Paid amount must be greater than 0.`);
        return;
      }
    }

    const txList: ShareTransaction[] = rows.map((r, idx) => ({
      id: r.id.startsWith('row-') ? `sh-tx-${Date.now()}-${idx}` : r.id,
      sn: idx + 1,
      meetingId,
      meetingNumber,
      shareholderId: r.shareholderId === 'new' ? `sh-new-${Date.now()}-${idx}` : r.shareholderId,
      shareholderName: r.shareholderName.trim(),
      address: r.address.trim(),
      citizenshipNumber: r.citizenshipNumber.trim(),
      transactionType,
      amount: transactionType === 'Addition' ? r.paidAmount : (r.totalAmount || r.paidAmount),
      paidAmount: r.paidAmount,
      remainingBalance: transactionType === 'Return' ? (r.remainingBalance || 0) : 0,
      paymentMethod: r.paymentMethod,
      transactionDate: r.transactionDate || defaultDate,
      transactionIdNo: r.transactionIdNo.trim(),
      remarks: r.remarks.trim(),
      status: 'Pending Approval'
    }));

    onSave(txList);
    onClose();
  };

  const isAddition = transactionType === 'Addition';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-5xl my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`p-5 flex items-center justify-between border-b ${isAddition ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl font-bold text-white shadow-xs ${isAddition ? 'bg-emerald-600' : 'bg-amber-600'}`}>
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {isAddition ? 'सेयर रकम थप फारम (Addition of Share Amount)' : 'सेयर रकम फिर्ता तथा लगत कट्टा फारम (Return of Share Amount)'}
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                {isAddition
                  ? 'बैठक निर्णय अनुसार सेयरधनीबाट नयाँ सेयर खरिद वा थप रकम दाखिला फारम'
                  : 'बैठक निर्णय अनुसार सेयरधनीलाई सेयर फिर्ता (आंशिक/पूर्ण भुक्तानी) फारम'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 flex items-start gap-2.5">
            <AlertCircle size={18} className="text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-slate-800">
                नोट (Note):
              </p>
              <p>
                उक्त प्रविष्टि बैठक <strong className="text-indigo-900 font-mono font-bold">६०% वा १००% बहुमतले स्वीकृत (Approved)</strong> भएपछि मात्र सम्बन्धित भुक्तानी टोकरी (Cash, RBB, eSewa, Sahakari) र सेयरधनीको खातामा स्वत: अपडेट हुनेछ।
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <th className="p-2.5 w-10 text-center">S.N.</th>
                  <th className="p-2.5 w-56">Name of Shareholder</th>
                  <th className="p-2.5 w-40">Address</th>
                  <th className="p-2.5 w-36">Citizenship No.</th>
                  {!isAddition && <th className="p-2.5 w-28 text-right">Total Return (रु.)</th>}
                  <th className="p-2.5 w-28 text-right">{isAddition ? 'Amount (रु.)' : 'Paid Now (रु.)'}</th>
                  {!isAddition && <th className="p-2.5 w-28 text-right">Remaining (रु.)</th>}
                  <th className="p-2.5 w-32">Payment Method</th>
                  <th className="p-2.5 w-28">Date (BS)</th>
                  <th className="p-2.5 w-32">Tx Ref ID No.</th>
                  <th className="p-2.5 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {rows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-2 text-center font-mono font-bold text-slate-600">
                      {idx + 1}
                    </td>

                    {/* Shareholder Dropdown / Name */}
                    <td className="p-2">
                      <div className="space-y-1">
                        <select
                          value={row.shareholderId}
                          onChange={(e) => handleSelectShareholder(row.id, e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
                        >
                          {existingShareholders.map(sh => (
                            <option key={sh.id} value={sh.id}>
                              {sh.name} ({sh.citizenshipNumber || 'No Cit.'})
                            </option>
                          ))}
                          <option value="new">+ नयाँ सेयरधनी थप्नुहोस् (Add New Shareholder)</option>
                        </select>

                        {row.shareholderId === 'new' && (
                          <input
                            type="text"
                            required
                            placeholder="Enter new shareholder full name..."
                            value={row.shareholderName}
                            onChange={(e) => handleRowChange(row.id, 'shareholderName', e.target.value)}
                            className="w-full border border-emerald-400 bg-emerald-50/40 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 focus:outline-hidden"
                          />
                        )}
                      </div>
                    </td>

                    {/* Address */}
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Address..."
                        value={row.address}
                        onChange={(e) => handleRowChange(row.id, 'address', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
                      />
                    </td>

                    {/* Citizenship Number */}
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Citizenship No..."
                        value={row.citizenshipNumber}
                        onChange={(e) => handleRowChange(row.id, 'citizenshipNumber', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
                      />
                    </td>

                    {/* If Return: Total Return Amount Requested */}
                    {!isAddition && (
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          placeholder="Total"
                          value={row.totalAmount || ''}
                          onChange={(e) => handleRowChange(row.id, 'totalAmount', e.target.value)}
                          className="w-full text-right border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                        />
                      </td>
                    )}

                    {/* Paid Amount / Amount */}
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="Amount"
                        value={row.paidAmount || (isAddition ? row.totalAmount : '') || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (isAddition) {
                            handleRowChange(row.id, 'totalAmount', val);
                            handleRowChange(row.id, 'paidAmount', val);
                          } else {
                            handleRowChange(row.id, 'paidAmount', val);
                          }
                        }}
                        className="w-full text-right border border-emerald-400 bg-emerald-50/30 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-emerald-900 focus:outline-hidden focus:border-emerald-600"
                      />
                    </td>

                    {/* If Return: Remaining Balance */}
                    {!isAddition && (
                      <td className="p-2 text-right font-mono font-bold text-amber-700 bg-amber-50/50 rounded-lg p-2">
                        रु. {(row.remainingBalance || 0).toLocaleString()}
                      </td>
                    )}

                    {/* Payment Method */}
                    <td className="p-2">
                      <select
                        value={row.paymentMethod}
                        onChange={(e) => handleRowChange(row.id, 'paymentMethod', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
                      >
                        <option value="Cash">Cash (नगद)</option>
                        <option value="RBB">RBB (राष्ट्रिय वाणिज्य बैंक)</option>
                        <option value="Esewa">eSewa (ई-सेवा)</option>
                        <option value="Sahakari">Sahakari (सहकारी)</option>
                      </select>
                    </td>

                    {/* Transaction Date */}
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="YYYY-MM-DD"
                        value={row.transactionDate}
                        onChange={(e) => handleRowChange(row.id, 'transactionDate', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
                      />
                    </td>

                    {/* Transaction ID / Ref No */}
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Tx ID / Voucher..."
                        value={row.transactionIdNo}
                        onChange={(e) => handleRowChange(row.id, 'transactionIdNo', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
                      />
                    </td>

                    {/* Delete Row */}
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(row.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete Row"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleAddNextRow}
              className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Plus size={15} />
              <span>+ Add Next (अर्को थप्नुहोस्)</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`inline-flex items-center gap-2 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-md transition cursor-pointer active:scale-95 ${
                  isAddition ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                <Save size={16} />
                <span>Save Share Details ({rows.length} Records)</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
