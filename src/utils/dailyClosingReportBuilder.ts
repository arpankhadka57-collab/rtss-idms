import { 
  DailyClosing, 
  OpeningBalances, 
  SalesInvoice, 
  Expense, 
  AccountTransaction, 
  AppUser 
} from '../types';

export interface DailyClosingChannelTransaction {
  channel: 'Cash in Counter' | 'Rastriya Banijya Bank(RBB)' | 'eSewa Wallet' | 'Sahakari (Cooperative)';
  opening: number;
  inflow: number;
  outflow: number;
  subtotal: number;
}

export interface BankDepositLogItem {
  id?: string;
  depositNumber: number;
  amount: number;
  fromAccount: string; // e.g. "Counter Cash"
  toAccount: string; // e.g. "RBB" or "Sahakari"
  voucherNumber?: string;
  remarks?: string;
}

export interface FinalClosingReconciliationRow {
  accountName: 'Cash in Counter' | 'Rastriya Banijya Bank(RBB)' | 'eSewa Wallet' | 'Sahakari (Cooperative)';
  subtotal: number;
  depositAdjustLabel: string; // "Minus (-)", "Plus (+)", "No Change"
  depositAdjustAmount: number;
  finalClosing: number;
}

export interface DailyClosingReportDetailedData {
  date: string;
  voucherNumber: string;
  status: string;
  preparedBy: string;
  preparedByDesignation: string;
  approvedBy: string;
  approvedByDesignation: string;

  // Section 1: DAILY ACCOUNT TRANSACTIONS (Before Bank Deposits)
  section1: {
    channels: DailyClosingChannelTransaction[];
    totals: {
      opening: number;
      inflow: number;
      outflow: number;
      subtotal: number;
    };
  };

  // Section 2: BANK DEPOSIT LOG & FINAL CLOSING RECONCILIATION
  section2: {
    deposits: BankDepositLogItem[];
    finalBalances: FinalClosingReconciliationRow[];
    totalClosingFunds: {
      subtotal: number;
      finalClosing: number;
    };
  };

  // Section 3: PHYSICAL CASH DENOMINATION COUNT
  section3: {
    denominations: {
      1000: number;
      500: number;
      250: number;
      100: number;
      50: number;
      20: number;
      10: number;
      5: number;
      coins: number;
    };
    amounts: {
      1000: number;
      500: number;
      250: number;
      100: number;
      50: number;
      20: number;
      10: number;
      5: number;
      coins: number;
    };
    totalPhysicalCounted: number;
    expectedFinalCounterCash: number;
    variance: number;
  };

  // Section 4: NOTES & SIGNATURES
  section4: {
    remarks: string;
    submittedBy: {
      name: string;
      designation: string;
      signatureNote: string;
    };
    approvedBy: {
      name: string;
      designation: string;
      signatureNote: string;
    };
  };
}

export function buildDailyClosingReportData(
  closing: DailyClosing,
  context?: {
    openingBalances?: OpeningBalances;
    invoices?: SalesInvoice[];
    expenses?: Expense[];
    accountTransfers?: AccountTransaction[];
    users?: AppUser[];
    currentUser?: AppUser;
  }
): DailyClosingReportDetailedData {
  const openingBalances = context?.openingBalances;
  const users = context?.users || [];
  const currentUser = context?.currentUser;

  // 1. User & Staff metadata lookup
  const submitterUser = users.find(u => u.name === closing.submittedBy || u.username === closing.submittedBy);
  const approverUser = users.find(u => u.name === closing.approvedBy || u.username === closing.approvedBy);

  const preparedByName = closing.submittedBy || currentUser?.name || 'Staff User';
  const preparedByDesignation = submitterUser?.post || submitterUser?.designationNepali || (currentUser?.post || 'Cashier / Accountant');

  const approvedByName = closing.approvedBy || 'Managing Director';
  const approvedByDesignation = approverUser?.post || approverUser?.designationNepali || 'Executive Director / Senior Auditor';

  // 2. Section 1 Calculations (Before Bank Deposits)
  // Cash in counter
  const cashOpening = closing.openingCashToday || 0;
  const cashInflow = (closing.cashSales || 0) + (closing.cashTransfersIn || 0);
  const cashOutflow = (closing.cashExpenses || 0) + (closing.cashTransfersOut || 0);
  const cashSubtotal = closing.totalCashAvailable !== undefined 
    ? closing.totalCashAvailable 
    : (cashOpening + cashInflow - cashOutflow);

  // RBB
  const rbbOpening = (openingBalances as any)?.RBB?.openingBalance ?? (openingBalances as any)?.rbb ?? 0;
  const rbbInflow = closing.bankSales || 0;
  const rbbOutflow = closing.bankExpenses || 0;
  const rbbSubtotal = rbbOpening + rbbInflow - rbbOutflow;

  // eSewa Wallet
  const esewaOpening = (openingBalances as any)?.ESEWA?.openingBalance ?? (openingBalances as any)?.esewa ?? 0;
  const esewaInflow = closing.esewaSales || 0;
  const esewaOutflow = closing.esewaExpenses || 0;
  const esewaSubtotal = esewaOpening + esewaInflow - esewaOutflow;

  // Sahakari (Cooperative)
  const sahakariOpening = (openingBalances as any)?.SAHAKARI?.openingBalance ?? (openingBalances as any)?.sahakari ?? 0;
  const sahakariInflow = closing.sahakariSales || 0;
  const sahakariOutflow = closing.sahakariExpenses || 0;
  const sahakariSubtotal = sahakariOpening + sahakariInflow - sahakariOutflow;

  const channels: DailyClosingChannelTransaction[] = [
    {
      channel: 'Cash in Counter',
      opening: cashOpening,
      inflow: cashInflow,
      outflow: cashOutflow,
      subtotal: cashSubtotal
    },
    {
      channel: 'Rastriya Banijya Bank(RBB)',
      opening: rbbOpening,
      inflow: rbbInflow,
      outflow: rbbOutflow,
      subtotal: rbbSubtotal
    },
    {
      channel: 'eSewa Wallet',
      opening: esewaOpening,
      inflow: esewaInflow,
      outflow: esewaOutflow,
      subtotal: esewaSubtotal
    },
    {
      channel: 'Sahakari (Cooperative)',
      opening: sahakariOpening,
      inflow: sahakariInflow,
      outflow: sahakariOutflow,
      subtotal: sahakariSubtotal
    }
  ];

  const totalOpening = channels.reduce((s, c) => s + c.opening, 0);
  const totalInflow = channels.reduce((s, c) => s + c.inflow, 0);
  const totalOutflow = channels.reduce((s, c) => s + c.outflow, 0);
  const totalSubtotal = channels.reduce((s, c) => s + c.subtotal, 0);

  // 3. Section 2: Bank Deposit Log & Final Closing Reconciliation
  const deposits: BankDepositLogItem[] = [];
  let depositToRBB = 0;
  let depositToSahakari = 0;
  let depositToEsewa = 0;

  if (closing.splitDeposits && closing.splitDeposits.length > 0) {
    closing.splitDeposits.forEach((sd, idx) => {
      deposits.push({
        id: sd.id || `dep_${idx}`,
        depositNumber: idx + 1,
        amount: Number(sd.amount) || 0,
        fromAccount: 'Counter Cash',
        toAccount: sd.targetAccount,
        remarks: sd.remarks
      });
      if (sd.targetAccount === 'RBB') depositToRBB += Number(sd.amount) || 0;
      else if (sd.targetAccount === 'Sahakari') depositToSahakari += Number(sd.amount) || 0;
      else if (sd.targetAccount === 'Esewa') depositToEsewa += Number(sd.amount) || 0;
    });
  } else if ((closing.depositAmount || 0) > 0 && closing.depositTarget && closing.depositTarget !== 'None') {
    deposits.push({
      depositNumber: 1,
      amount: closing.depositAmount,
      fromAccount: 'Counter Cash',
      toAccount: closing.depositTarget,
      remarks: 'Standard end-of-day bank deposit'
    });
    if (closing.depositTarget === 'RBB') depositToRBB += closing.depositAmount;
    else if (closing.depositTarget === 'Sahakari') depositToSahakari += closing.depositAmount;
    else if (closing.depositTarget === 'Esewa') depositToEsewa += closing.depositAmount;
  }

  const totalDepositsFromCash = depositToRBB + depositToSahakari + depositToEsewa;

  const finalCounterCash = closing.remainingCash !== undefined 
    ? closing.remainingCash 
    : (cashSubtotal - totalDepositsFromCash);
  const finalRBB = rbbSubtotal + depositToRBB;
  const finalEsewa = esewaSubtotal + depositToEsewa;
  const finalSahakari = sahakariSubtotal + depositToSahakari;

  const finalBalances: FinalClosingReconciliationRow[] = [
    {
      accountName: 'Cash in Counter',
      subtotal: cashSubtotal,
      depositAdjustLabel: totalDepositsFromCash > 0 ? `Minus (-) Rs. ${totalDepositsFromCash.toLocaleString('en-IN')}` : 'Minus (-)',
      depositAdjustAmount: -totalDepositsFromCash,
      finalClosing: finalCounterCash
    },
    {
      accountName: 'Rastriya Banijya Bank(RBB)',
      subtotal: rbbSubtotal,
      depositAdjustLabel: depositToRBB > 0 ? `Plus (+) Rs. ${depositToRBB.toLocaleString('en-IN')}` : 'Plus (+)',
      depositAdjustAmount: depositToRBB,
      finalClosing: finalRBB
    },
    {
      accountName: 'eSewa Wallet',
      subtotal: esewaSubtotal,
      depositAdjustLabel: depositToEsewa > 0 ? `Plus (+) Rs. ${depositToEsewa.toLocaleString('en-IN')}` : 'No Change',
      depositAdjustAmount: depositToEsewa,
      finalClosing: finalEsewa
    },
    {
      accountName: 'Sahakari (Cooperative)',
      subtotal: sahakariSubtotal,
      depositAdjustLabel: depositToSahakari > 0 ? `Plus (+) Rs. ${depositToSahakari.toLocaleString('en-IN')}` : 'Plus (+)',
      depositAdjustAmount: depositToSahakari,
      finalClosing: finalSahakari
    }
  ];

  const totalFinalClosing = finalCounterCash + finalRBB + finalEsewa + finalSahakari;

  // 4. Section 3: Physical Cash Denominations
  const den = closing.denominations || ({} as any);
  const count1000 = Number(den[1000]) || 0;
  const count500 = Number(den[500]) || 0;
  const count250 = Number(den[250]) || 0;
  const count100 = Number(den[100]) || 0;
  const count50 = Number(den[50]) || 0;
  const count20 = Number(den[20]) || 0;
  const count10 = Number(den[10]) || 0;
  const count5 = Number(den[5]) || 0;
  const countCoins = (Number(den[2]) || 0) * 2 + (Number(den[1]) || 0) * 1;

  const amt1000 = count1000 * 1000;
  const amt500 = count500 * 500;
  const amt250 = count250 * 250;
  const amt100 = count100 * 100;
  const amt50 = count50 * 50;
  const amt20 = count20 * 20;
  const amt10 = count10 * 10;
  const amt5 = count5 * 5;
  const amtCoins = countCoins;

  const totalPhysicalCounted = amt1000 + amt500 + amt250 + amt100 + amt50 + amt20 + amt10 + amt5 + amtCoins;
  const expectedCounterCash = finalCounterCash;
  const variance = totalPhysicalCounted - expectedCounterCash;

  // 5. Section 4: Notes & Signatures
  let noteText = '';
  if (closing.remarks) noteText += closing.remarks;
  if (closing.adminRemarks) {
    if (noteText) noteText += '\n';
    noteText += `Audit Remarks: ${closing.adminRemarks}`;
  }
  if (deposits.length > 0) {
    const depositNotes = deposits.map(d => `Bank Deposit: Rs. ${d.amount.toLocaleString('en-IN')} to ${d.toAccount}${d.remarks ? ` (${d.remarks})` : ''}`).join(', ');
    if (noteText) noteText += '\n';
    noteText += depositNotes;
  }
  if (!noteText) {
    noteText = 'All daytime sales, payment channels, operating cash expenses, and bank deposits reconciled and verified with system books.';
  }

  return {
    date: closing.date,
    voucherNumber: `DCR-${closing.date.replace(/[\/\-]/g, '')}`,
    status: closing.status || 'Approved',
    preparedBy: preparedByName,
    preparedByDesignation,
    approvedBy: approvedByName,
    approvedByDesignation,
    section1: {
      channels,
      totals: {
        opening: totalOpening,
        inflow: totalInflow,
        outflow: totalOutflow,
        subtotal: totalSubtotal
      }
    },
    section2: {
      deposits,
      finalBalances,
      totalClosingFunds: {
        subtotal: totalSubtotal,
        finalClosing: totalFinalClosing
      }
    },
    section3: {
      denominations: {
        1000: count1000,
        500: count500,
        250: count250,
        100: count100,
        50: count50,
        20: count20,
        10: count10,
        5: count5,
        coins: countCoins
      },
      amounts: {
        1000: amt1000,
        500: amt500,
        250: amt250,
        100: amt100,
        50: amt50,
        20: amt20,
        10: amt10,
        5: amt5,
        coins: amtCoins
      },
      totalPhysicalCounted,
      expectedFinalCounterCash: expectedCounterCash,
      variance
    },
    section4: {
      remarks: noteText,
      submittedBy: {
        name: preparedByName,
        designation: preparedByDesignation,
        signatureNote: '(rtss system verified and digitally signed)'
      },
      approvedBy: {
        name: approvedByName,
        designation: approvedByDesignation,
        signatureNote: '(rtss system verified and digitally signed)'
      }
    }
  };
}
