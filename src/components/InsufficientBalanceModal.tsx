import React from 'react';
import { AlertTriangle, Wallet, X, ArrowRight, CornerDownRight } from 'lucide-react';
import { BalanceValidationResult } from '../utils/accountBalance';

interface InsufficientBalanceModalProps {
  validation: BalanceValidationResult | null;
  onClose: () => void;
  onNavigateToLedger?: () => void;
}

export const InsufficientBalanceModal: React.FC<InsufficientBalanceModalProps> = ({
  validation,
  onClose,
  onNavigateToLedger
}) => {
  if (!validation || !validation.isInsufficient) return null;

  const shortfall = validation.requiredAmount - validation.currentBalance;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[calc(100dvh-2rem)] overflow-y-auto border border-amber-200 transform transition-all scale-100 my-auto">
        
        {/* Header Alert Bar */}
        <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner">
              <AlertTriangle className="size-6 text-white animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight font-mono uppercase">Empty / Insufficient Bucket Alert</h3>
              <p className="text-xs text-amber-100 font-medium">Transaction blocked due to insufficient account balance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
              <span className="text-xs font-bold text-amber-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Wallet size={14} className="text-amber-600" />
                Target Account Bucket
              </span>
              <span className="text-xs font-black font-mono text-amber-950 bg-amber-200/70 px-2.5 py-0.5 rounded-full">
                {validation.accountKey}
              </span>
            </div>
            <div className="text-sm font-bold text-slate-800">
              {validation.accountLabel}
            </div>
          </div>

          {/* Balance Breakdown Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-150 text-center">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">Available</span>
              <span className="text-sm font-black font-mono text-emerald-600 mt-1 block">
                Rs. {validation.currentBalance.toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-150 text-center">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">Required</span>
              <span className="text-sm font-black font-mono text-slate-900 mt-1 block">
                Rs. {validation.requiredAmount.toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-center">
              <span className="text-[10px] uppercase font-mono font-bold text-rose-600 block">Shortfall</span>
              <span className="text-sm font-black font-mono text-rose-600 mt-1 block">
                - Rs. {shortfall.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <p className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
              <CornerDownRight size={13} className="text-amber-600 shrink-0" />
              Why was this transaction stopped?
            </p>
            The selected payment bucket (<strong>{validation.accountLabel}</strong>) only has <strong>Rs. {validation.currentBalance.toLocaleString()}</strong> available, but the transaction requires <strong>Rs. {validation.requiredAmount.toLocaleString()}</strong>.
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
              <li>Select a different active payment account with sufficient balance.</li>
              <li>Or deposit cash/transfer funds into <strong>{validation.accountKey}</strong> via Account Ledger.</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            {onNavigateToLedger && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToLedger();
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Account Ledger</span>
                <ArrowRight size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition shadow-md shadow-amber-600/20 cursor-pointer"
            >
              Understand & Modify Outflow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
