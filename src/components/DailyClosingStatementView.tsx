import React from 'react';
import { DailyClosingReportDetailedData } from '../utils/dailyClosingReportBuilder';
import { BusinessProfile } from '../types';
import { CorporateLetterhead } from './CorporateLetterhead';

interface DailyClosingStatementViewProps {
  data: DailyClosingReportDetailedData;
  profile?: BusinessProfile;
  showHeader?: boolean;
}

export const DailyClosingStatementView: React.FC<DailyClosingStatementViewProps> = ({
  data,
  profile,
  showHeader = true
}) => {
  return (
    <div className="w-full bg-white text-slate-900 font-sans text-xs leading-normal">
      {/* Optional Corporate Letterhead (Letterpad if checked) */}
      {showHeader && profile && (
        <div className="border-b border-slate-300 pb-2 mb-3">
          <CorporateLetterhead profile={profile} />
        </div>
      )}

      {/* Header Metadata Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b-2 border-slate-900 mb-3 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900">Date:</span>
          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-300 font-bold">
            {data.date}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600 font-mono text-[11px]">Voucher: {data.voucherNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Prepared By:</span>
          <span className="font-bold text-slate-900">
            {data.preparedBy} {data.preparedByDesignation ? `(${data.preparedByDesignation})` : ''}
          </span>
        </div>
      </div>

      {/* -------------------------------------------------------------------------------- */}
      {/* 1. DAILY ACCOUNT TRANSACTIONS (Before Bank Deposits) */}
      {/* -------------------------------------------------------------------------------- */}
      <div className="mb-4">
        <div className="bg-slate-800 text-white px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase flex items-center justify-between">
          <span>1. DAILY ACCOUNT TRANSACTIONS (Before Bank Deposits)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300 text-[11px]">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                <th className="border border-slate-300 py-1.5 px-2 text-left w-[36%]">Payment Channel</th>
                <th className="border border-slate-300 py-1.5 px-2 text-right w-[16%]">Opening</th>
                <th className="border border-slate-300 py-1.5 px-2 text-right w-[16%] text-emerald-800">Day Inflow(+)</th>
                <th className="border border-slate-300 py-1.5 px-2 text-right w-[16%] text-rose-800">Day Outflow(-)</th>
                <th className="border border-slate-300 py-1.5 px-2 text-right w-[16%] text-slate-900">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {data.section1.channels.map((ch, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="border border-slate-300 py-1 px-2 font-medium text-slate-900">
                    {ch.channel}
                  </td>
                  <td className="border border-slate-300 py-1 px-2 text-right font-mono">
                    Rs. {ch.opening.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="border border-slate-300 py-1 px-2 text-right font-mono text-emerald-700 font-medium">
                    Rs. {ch.inflow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="border border-slate-300 py-1 px-2 text-right font-mono text-rose-700 font-medium">
                    Rs. {ch.outflow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="border border-slate-300 py-1 px-2 text-right font-mono font-bold text-slate-900">
                    Rs. {ch.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-200 border-t-2 border-slate-800 font-bold text-slate-950">
                <td className="border border-slate-300 py-1.5 px-2 uppercase tracking-wide">TOTALS</td>
                <td className="border border-slate-300 py-1.5 px-2 text-right font-mono">
                  Rs. {data.section1.totals.opening.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-emerald-900">
                  Rs. {data.section1.totals.inflow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-rose-900">
                  Rs. {data.section1.totals.outflow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="border border-slate-300 py-1.5 px-2 text-right font-mono font-black text-slate-950">
                  Rs. {data.section1.totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-[10px] text-slate-600 mt-1 italic">
          *Subtotal calculation formula: [Opening] + [Day Inflow] - [Day Outflow] = [Subtotal]
        </p>
      </div>

      {/* -------------------------------------------------------------------------------- */}
      {/* 2. BANK DEPOSIT LOG & FINAL CLOSING RECONCILIATION */}
      {/* -------------------------------------------------------------------------------- */}
      <div className="mb-4">
        <div className="bg-slate-800 text-white px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase">
          2. BANK DEPOSIT LOG &amp; FINAL CLOSING RECONCILIATION
        </div>
        <div className="p-2 border border-slate-300 bg-slate-50/50 text-[11px] space-y-1.5">
          <p className="text-[10px] text-slate-600">
            Use this section to record cash taken out of the Counter and put into the Bank/Sahakari.
            This dynamically updates final day-end balances.
          </p>
          <div className="space-y-1 pl-2 border-l-2 border-indigo-400">
            {data.section2.deposits.length > 0 ? (
              data.section2.deposits.map((dep, idx) => (
                <div key={idx} className="font-mono font-medium text-slate-800 text-[11px]">
                  * CASH DEPOSIT #{dep.depositNumber}:{' '}
                  <span className="font-bold text-slate-950">
                    Rs. {dep.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>{' '}
                  moved from <span className="font-semibold text-slate-700">[{dep.fromAccount}]</span> to{' '}
                  <span className="font-bold text-indigo-700">[{dep.toAccount}]</span>
                  {dep.remarks ? ` - (${dep.remarks})` : ''}
                </div>
              ))
            ) : (
              <div className="font-mono text-slate-600 text-[11px] italic">
                * No cash deposit was moved to Bank/Sahakari today (All cash retained in counter cash drawer).
              </div>
            )}
          </div>
        </div>

        <div className="mt-2 overflow-x-auto">
          <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-1">
            FINAL DAY-END BALANCES (After Deposits):
          </div>
          <table className="w-full border-collapse border border-slate-300 text-[11px]">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                <th className="border border-slate-300 py-1.5 px-2 text-left w-[36%]">Account Name</th>
                <th className="border border-slate-300 py-1.5 px-2 text-right w-[20%]">Subtotal (Sec 1)</th>
                <th className="border border-slate-300 py-1.5 px-2 text-center w-[22%]">Deposit Adjust</th>
                <th className="border border-slate-300 py-1.5 px-2 text-right w-[22%] font-black text-slate-900">Final Closing</th>
              </tr>
            </thead>
            <tbody>
              {data.section2.finalBalances.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="border border-slate-300 py-1 px-2 font-medium text-slate-900">
                    {row.accountName}
                  </td>
                  <td className="border border-slate-300 py-1 px-2 text-right font-mono">
                    Rs. {row.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="border border-slate-300 py-1 px-2 text-center font-mono text-[10px] font-semibold text-slate-700">
                    {row.depositAdjustLabel}
                  </td>
                  <td className="border border-slate-300 py-1 px-2 text-right font-mono font-bold text-slate-950">
                    Rs. {row.finalClosing.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-200 border-t-2 border-slate-800 font-bold text-slate-950">
                <td className="border border-slate-300 py-1.5 px-2 uppercase tracking-wide">TOTAL CLOSING FUNDS</td>
                <td className="border border-slate-300 py-1.5 px-2 text-right font-mono font-bold">
                  Rs. {data.section2.totalClosingFunds.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="border border-slate-300 py-1.5 px-2 text-center text-slate-500 font-mono text-xs">-</td>
                <td className="border border-slate-300 py-1.5 px-2 text-right font-mono font-black text-indigo-950 text-xs">
                  Rs. {data.section2.totalClosingFunds.finalClosing.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* -------------------------------------------------------------------------------- */}
      {/* 3. PHYSICAL CASH DENOMINATION COUNT (Must match Final Closing Counter Cash) */}
      {/* -------------------------------------------------------------------------------- */}
      <div className="mb-4">
        <div className="bg-slate-800 text-white px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase">
          3. PHYSICAL CASH DENOMINATION COUNT (Must match Final Closing Counter Cash)
        </div>
        <div className="border border-slate-300 p-2.5 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 font-mono text-[11px]">
            {/* Left Column */}
            <div className="space-y-1">
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span>Rs. 1000 x <strong className="text-slate-900">{data.section3.denominations[1000]}</strong></span>
                <span className="font-bold">Rs. {data.section3.amounts[1000].toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span>Rs. 500  x <strong className="text-slate-900">{data.section3.denominations[500]}</strong></span>
                <span className="font-bold">Rs. {data.section3.amounts[500].toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span>Rs. 250  x <strong className="text-slate-900">{data.section3.denominations[250]}</strong></span>
                <span className="font-bold">Rs. {data.section3.amounts[250].toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span>Rs. 100  x <strong className="text-slate-900">{data.section3.denominations[100]}</strong></span>
                <span className="font-bold">Rs. {data.section3.amounts[100].toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-1">
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span>Rs. 50   x <strong className="text-slate-900">{data.section3.denominations[50]}</strong></span>
                <span className="font-bold">Rs. {data.section3.amounts[50].toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span>Rs. 20   x <strong className="text-slate-900">{data.section3.denominations[20]}</strong></span>
                <span className="font-bold">Rs. {data.section3.amounts[20].toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span>Rs. 10   x <strong className="text-slate-900">{data.section3.denominations[10]}</strong></span>
                <span className="font-bold">Rs. {data.section3.amounts[10].toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span>Rs. 5 / Coins <strong className="text-slate-900">({data.section3.denominations[5]} pcs + coins)</strong></span>
                <span className="font-bold">Rs. {(data.section3.amounts[5] + data.section3.amounts.coins).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t-2 border-slate-300 space-y-1 font-mono text-[11px]">
            <div className="flex justify-between text-slate-800">
              <span className="font-bold">TOTAL PHYSICAL CASH COUNTED:</span>
              <span className="font-black text-slate-950">Rs. {data.section3.totalPhysicalCounted.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-800">
              <span className="font-bold">EXPECTED FINAL COUNTER CASH (From Sec 2 Final Closing):</span>
              <span className="font-black text-indigo-900">Rs. {data.section3.expectedFinalCounterCash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200">
              <span className="font-bold text-slate-900">VARIANCE (Shortage / Cash+):</span>
              <span className={`font-black px-2 py-0.5 rounded text-xs ${
                data.section3.variance === 0
                  ? 'bg-emerald-100 text-emerald-900'
                  : data.section3.variance > 0
                  ? 'bg-blue-100 text-blue-900'
                  : 'bg-rose-100 text-rose-900'
              }`}>
                {data.section3.variance === 0 
                  ? 'Rs. 0.00 (Balanced - Exact Match)' 
                  : `Rs. ${data.section3.variance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${data.section3.variance > 0 ? '(Cash Surplus)' : '(Cash Shortage)'}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------------------- */}
      {/* 4. NOTES & SIGNATURES */}
      {/* -------------------------------------------------------------------------------- */}
      <div className="mb-2">
        <div className="bg-slate-800 text-white px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase">
          4. NOTES &amp; SIGNATURES
        </div>
        <div className="border border-slate-300 p-2.5 bg-white text-[11px]">
          <div className="mb-6">
            <span className="font-bold text-slate-800 block mb-1">
              Remarks / Bank Deposit Voucher Numbers / Online Transfer IDs:
            </span>
            <div className="min-h-[40px] p-2 bg-slate-50 border border-slate-200 rounded text-slate-700 whitespace-pre-wrap font-sans">
              {data.section4.remarks || 'Reconciled and verified without any audit discrepancies.'}
            </div>
          </div>

          <div className="pt-4 grid grid-cols-2 gap-8 text-center text-slate-800">
            {/* Submitted By */}
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Submitted by</p>
              <div className="pt-6 border-b border-slate-400"></div>
              <p className="font-bold text-slate-900 text-xs mt-1">({data.section4.submittedBy.name})</p>
              <p className="text-[10px] text-slate-600 font-medium">({data.section4.submittedBy.designation})</p>
              <p className="text-[9px] text-indigo-700 font-mono font-bold tracking-tight">
                {data.section4.submittedBy.signatureNote}
              </p>
            </div>

            {/* Approved By */}
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Approved by:</p>
              <div className="pt-6 border-b border-slate-400"></div>
              <p className="font-bold text-slate-900 text-xs mt-1">({data.section4.approvedBy.name})</p>
              <p className="text-[10px] text-slate-600 font-medium">({data.section4.approvedBy.designation})</p>
              <p className="text-[9px] text-indigo-700 font-mono font-bold tracking-tight">
                {data.section4.approvedBy.signatureNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
