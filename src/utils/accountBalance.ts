import { OpeningBalances, SalesInvoice, Expense, SupplyTransaction, SalaryDistribution, AccountTransaction, DailyClosing, EditRequest, Shareholder, MeetingNote, ShareTransaction } from '../types';

export function normalizeAccountKey(acc: string): 'RBB' | 'SAHAKARI' | 'ESEWA' | 'CASH' | 'DUE' | null {
  if (!acc) return null;
  const upper = acc.toUpperCase().trim();
  if (upper === 'CASH' || upper === 'CASH IN HAND') return 'CASH';
  if (upper === 'ESEWA' || upper === 'E-SEWA' || upper === 'E-SEWA WALLET') return 'ESEWA';
  if (upper === 'SAHAKARI' || upper === 'SAHAKARI COOPERATIVE' || upper === 'COOPERATIVE') return 'SAHAKARI';
  if (upper === 'RBB' || upper === 'BANK' || upper === 'BANK TRANSFER' || upper === 'RASTRIYA BANIJYA BANK') return 'RBB';
  if (upper === 'DUE' || upper === 'DUES' || upper === 'CREDIT' || upper === 'RECEIVABLE' || upper === 'UNPAID') return 'DUE';
  return null;
}

export function getAccountBucketLabel(accKey: string): string {
  const norm = normalizeAccountKey(accKey);
  switch (norm) {
    case 'RBB': return 'Rastriya Banijya Bank (RBB)';
    case 'SAHAKARI': return 'Sahakari Cooperatives';
    case 'ESEWA': return 'E-Sewa Wallet';
    case 'CASH': return 'Cash in Hand (CASH Vault)';
    case 'DUE': return 'Customer Credit Dues (DUE)';
    default: return accKey || 'Account Bucket';
  }
}

export function calculateAccountBalance(
  accKey: 'RBB' | 'SAHAKARI' | 'ESEWA' | 'CASH' | 'DUE',
  data: {
    openingBalances: OpeningBalances;
    invoices: SalesInvoice[];
    expenses: Expense[];
    transactions: SupplyTransaction[];
    salaryDistributions?: SalaryDistribution[];
    accountTransfers?: AccountTransaction[];
    dailyClosings?: DailyClosing[];
    editRequests?: EditRequest[];
    shareholders?: Shareholder[];
    meetingNotes?: MeetingNote[];
  }
): number {
  let balance = 0;

  // 1. Opening Balance (Initial capital deposited into account)
  const ob = data.openingBalances 
    ? (data.openingBalances[accKey] || (data.openingBalances as any)[accKey.toUpperCase()] || (data.openingBalances as any)[accKey.toLowerCase()])
    : null;
  if (ob && typeof ob.openingBalance === 'number') {
    balance += ob.openingBalance;
  }

  // 2. Sales Invoices (Total Historical Income Received)
  (data.invoices || []).forEach(inv => {
    if (inv.paymentMethod === 'Split' && inv.paymentSplits) {
      const splitKey = accKey.toLowerCase() as 'cash' | 'esewa' | 'rbb' | 'sahakari' | 'due';
      const splitAmt = inv.paymentSplits[splitKey] || 0;
      balance += splitAmt;
    } else {
      const norm = normalizeAccountKey(inv.paymentMethod);
      if (accKey === 'DUE') {
        const dueAmt = inv.dueAmount > 0 ? inv.dueAmount : (inv.paymentMethod === 'Due' ? (inv.finalAmount || inv.totalAmount) : 0);
        balance += dueAmt;
      } else if (norm === accKey) {
        const amt = inv.paidAmount !== undefined && inv.paidAmount !== null 
          ? inv.paidAmount 
          : ((inv as any).amountPaid !== undefined 
            ? (inv as any).amountPaid 
            : (inv.status === 'Paid' ? (inv.finalAmount || inv.totalAmount) : 0));
        if (amt > 0) balance += amt;
      }
    }
  });

  // 3. Approved Expenses (Outflow)
  (data.expenses || []).forEach(exp => {
    if (exp.status === 'Approved' && exp.amount > 0) {
      if (exp.paymentMethod === 'Split' && exp.paymentSplits) {
        const splitKey = accKey.toLowerCase() as 'cash' | 'esewa' | 'rbb' | 'sahakari';
        const splitAmt = (exp.paymentSplits as any)[splitKey] || (exp.paymentSplits as any)[accKey === 'CASH' ? 'Cash' : accKey === 'ESEWA' ? 'Esewa' : accKey === 'RBB' ? 'RBB' : 'Sahakari'] || 0;
        balance -= splitAmt;
      } else {
        const norm = normalizeAccountKey(exp.paymentMethod);
        if (norm === accKey) {
          balance -= exp.amount;
        }
      }
    }
  });

  // 4. Supply Transactions / Purchase Orders (Outflow)
  // Deduct PO payments ONLY if they were not already recorded as an Approved Expense in data.expenses (to prevent double deduction)
  (data.transactions || []).forEach(tx => {
    const amt = tx.amountPaid || 0;
    const pm = (tx as any).paymentMethod || 'CASH';
    if (amt > 0 && tx.status !== 'Rejected') {
      const hasCorrespondingExpense = (data.expenses || []).some(exp => 
        exp.status === 'Approved' && 
        exp.referenceId && 
        (exp.referenceId === tx.id || exp.referenceId.split(',').map(s => s.trim()).includes(tx.id))
      );
      if (!hasCorrespondingExpense) {
        if (tx.paymentMethod === 'Split' && tx.paymentSplits) {
          const splitKey = accKey.toLowerCase() as 'cash' | 'esewa' | 'rbb' | 'sahakari';
          const splitAmt = (tx.paymentSplits as any)[splitKey] || (tx.paymentSplits as any)[accKey === 'CASH' ? 'Cash' : accKey === 'ESEWA' ? 'Esewa' : accKey === 'RBB' ? 'RBB' : 'Sahakari'] || 0;
          balance -= splitAmt;
        } else {
          const norm = normalizeAccountKey(pm);
          if (norm === accKey) {
            balance -= amt;
          }
        }
      }
    }
  });

  // 5. Staff Salary Distributions (Payroll Outflow)
  // Deduct salary payments ONLY if they were not already recorded as an Approved Expense in data.expenses
  (data.salaryDistributions || []).forEach(dist => {
    if (dist.netPaid > 0 && dist.status === 'Paid') {
      const norm = normalizeAccountKey(dist.paymentMethod);
      if (norm === accKey) {
        const hasCorrespondingExpense = (data.expenses || []).some(exp => 
          exp.status === 'Approved' && 
          exp.category === 'Salary' && 
          (exp.referenceId === dist.id || exp.referenceId === dist.userId || (exp.title && exp.title.includes(dist.userName))) && 
          Math.abs(exp.amount - dist.netPaid) < 0.01
        );
        if (!hasCorrespondingExpense) {
          balance -= dist.netPaid;
        }
      }
    }
  });

  // 6. Account Transfers/Withdrawals/Deposits
  (data.accountTransfers || []).forEach(tx => {
    if (tx.amount > 0) {
      const sourceNorm = normalizeAccountKey(tx.sourceAccount);
      const destNorm = tx.destinationAccount ? normalizeAccountKey(tx.destinationAccount) : null;

      if (tx.type === 'Withdrawal') {
        if (sourceNorm === accKey) balance -= tx.amount;
        if (accKey === 'CASH' && sourceNorm !== 'CASH') balance += tx.amount;
      } else if (tx.type === 'Deposit') {
        if (sourceNorm === accKey) balance += tx.amount;
        if (accKey === 'CASH' && sourceNorm !== 'CASH') balance -= tx.amount;
      } else if (tx.type === 'Transfer') {
        if (sourceNorm === accKey) balance -= tx.amount;
        if (destNorm === accKey) balance += tx.amount;
      }
    }
  });

  // 7. Approved Daily Closing Deposits (including multiple split deposits)
  (data.dailyClosings || []).forEach(c => {
    if (c.status === 'Approved') {
      if (c.splitDeposits && c.splitDeposits.length > 0) {
        c.splitDeposits.forEach(s => {
          if (s.amount > 0 && s.targetAccount) {
            const targetNorm = normalizeAccountKey(s.targetAccount);
            if (accKey === 'CASH') balance -= s.amount;
            if (targetNorm === accKey) balance += s.amount;
          }
        });
      } else if (c.depositAmount > 0 && c.depositTarget && c.depositTarget !== 'None' && c.depositTarget !== 'Split') {
        const targetNorm = normalizeAccountKey(c.depositTarget);
        if (accKey === 'CASH') balance -= c.depositAmount;
        if (targetNorm === accKey) balance += c.depositAmount;
      }
    }
  });

  // 8. Approved Dues Payment Collections (Edit Requests)
  (data.editRequests || []).forEach(req => {
    if (req.type === 'Payment Collection' && req.status === 'Approved' && req.paymentDetails && req.paymentDetails.amount > 0) {
      const methodNorm = normalizeAccountKey(req.paymentDetails.method);
      if (accKey === 'DUE') balance -= req.paymentDetails.amount;
      if (methodNorm === accKey) balance += req.paymentDetails.amount;
    }
  });

  // 9. Share Capital Additions (Inflow) and Returns/Refunds (Outflow)
  const allShareTxs: ShareTransaction[] = [];
  (data.shareholders || []).forEach(sh => {
    (sh.transactions || []).forEach(tx => {
      if (tx.status === 'Approved' && (tx.paidAmount > 0 || tx.amount > 0)) {
        allShareTxs.push(tx);
      }
    });
  });
  (data.meetingNotes || []).forEach(m => {
    (m.shareTransactions || []).forEach(tx => {
      if (tx.status === 'Approved' && (tx.paidAmount > 0 || tx.amount > 0) && !allShareTxs.some(t => t.id === tx.id)) {
        allShareTxs.push(tx);
      }
    });
  });

  allShareTxs.forEach(tx => {
    const norm = normalizeAccountKey(tx.paymentMethod);
    if (norm === accKey) {
      const amt = tx.paidAmount || tx.amount || 0;
      if (tx.transactionType === 'Addition') {
        balance += amt;
      } else if (tx.transactionType === 'Return') {
        // Prevent double deduction if an expense with matching referenceId or topic exists
        const hasExpense = (data.expenses || []).some(exp =>
          exp.status === 'Approved' &&
          ((exp.referenceId && exp.referenceId === tx.id) ||
           (exp.topic && exp.topic.includes('Share Return') && Math.abs(exp.amount - amt) < 0.01))
        );
        if (!hasExpense) {
          balance -= amt;
        }
      }
    }
  });

  return balance;
}

export interface BalanceValidationResult {
  isInsufficient: boolean;
  currentBalance: number;
  requiredAmount: number;
  accountLabel: string;
  accountKey: string;
}

export function validateAccountBalance(
  paymentMethodStr: string,
  outflowAmount: number,
  data: {
    openingBalances: OpeningBalances;
    invoices: SalesInvoice[];
    expenses: Expense[];
    transactions: SupplyTransaction[];
    salaryDistributions?: SalaryDistribution[];
    accountTransfers?: AccountTransaction[];
    dailyClosings?: DailyClosing[];
    editRequests?: EditRequest[];
    shareholders?: Shareholder[];
    meetingNotes?: MeetingNote[];
  }
): BalanceValidationResult | null {
  const normKey = normalizeAccountKey(paymentMethodStr);
  if (!normKey || normKey === 'DUE') return null; // Credit due is not a liquid cash outflow account bucket

  const currentBalance = calculateAccountBalance(normKey, data);
  if (currentBalance < outflowAmount) {
    return {
      isInsufficient: true,
      currentBalance,
      requiredAmount: outflowAmount,
      accountLabel: getAccountBucketLabel(normKey),
      accountKey: normKey
    };
  }
  return null;
}

export function validateSplitAccountBalances(
  splits: { Cash?: number; Esewa?: number; RBB?: number; Sahakari?: number; cash?: number; esewa?: number; rbb?: number; sahakari?: number } | undefined | null,
  data: {
    openingBalances: OpeningBalances;
    invoices: SalesInvoice[];
    expenses: Expense[];
    transactions: SupplyTransaction[];
    salaryDistributions?: SalaryDistribution[];
    accountTransfers?: AccountTransaction[];
    dailyClosings?: DailyClosing[];
    editRequests?: EditRequest[];
    shareholders?: Shareholder[];
    meetingNotes?: MeetingNote[];
  }
): BalanceValidationResult[] {
  if (!splits) return [];
  const insufficientList: BalanceValidationResult[] = [];
  const entries: ['CASH' | 'ESEWA' | 'RBB' | 'SAHAKARI', number][] = [
    ['CASH', Number(splits.Cash ?? splits.cash ?? 0)],
    ['ESEWA', Number(splits.Esewa ?? splits.esewa ?? 0)],
    ['RBB', Number(splits.RBB ?? splits.rbb ?? 0)],
    ['SAHAKARI', Number(splits.Sahakari ?? splits.sahakari ?? 0)]
  ];

  for (const [key, requiredAmt] of entries) {
    if (requiredAmt > 0) {
      const bal = calculateAccountBalance(key, data);
      if (bal < requiredAmt) {
        insufficientList.push({
          isInsufficient: true,
          currentBalance: bal,
          requiredAmount: requiredAmt,
          accountLabel: getAccountBucketLabel(key),
          accountKey: key
        });
      }
    }
  }

  return insufficientList;
}

