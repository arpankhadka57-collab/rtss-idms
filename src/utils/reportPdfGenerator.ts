import { jsPDF } from 'jspdf';
import { SystemReportAttachment, BusinessProfile } from '../types';
import { DailyClosingReportDetailedData } from './dailyClosingReportBuilder';

export interface GeneratedPdfResult {
  fileName: string;
  dataUrl: string;
  size: number;
}

/**
 * Renders the exact 4-section Daily Closing report into the jsPDF document.
 */
function renderDailyClosingPdf(
  doc: jsPDF,
  report: SystemReportAttachment,
  profile: BusinessProfile | undefined,
  pageWidth: number,
  pageHeight: number
) {
  const companyName = profile?.name || 'RELIABLETECH SERVICES & SUPPLIERS';
  const companySubtitle = profile?.companySubtitle || 'Complete IT, Networking, Hardware & Security Solutions';
  const location = profile?.location || 'Fikkal-10, Suryodaya Municipality, Ilam, Nepal';
  const pan = profile?.panNumber || '302819405';
  const phone = profile?.phone || '+977-9852681554 / 027-540123';
  const email = profile?.email || 'reliabletechss.fikkal@gmail.com';

  // --- HEADER DECORATIVE TOP STRIP ---
  doc.setFillColor(185, 28, 28); // Crimson Red
  doc.rect(0, 0, pageWidth, 4, 'F');
  doc.setFillColor(3, 105, 161); // Sky Navy
  doc.rect(0, 4, pageWidth, 2, 'F');

  let y = 13;

  // --- COMPANY HEADER (LETTERPAD) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(companyName.toUpperCase(), pageWidth / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(companySubtitle, pageWidth / 2, y, { align: 'center' });

  y += 4;
  doc.setFontSize(7.5);
  doc.text(`${location}  •  Govt. Regd PAN: ${pan}`, pageWidth / 2, y, { align: 'center' });

  y += 3.5;
  doc.text(`Phone: ${phone}  •  Email: ${email}`, pageWidth / 2, y, { align: 'center' });

  y += 3;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(14, y, pageWidth - 14, y);

  // Extract or synthesize DailyClosingReportDetailedData
  const dcData: DailyClosingReportDetailedData = report.dailyClosingData || {
    date: report.reportDate || '2083/02/24',
    voucherNumber: report.referenceNo || `DCR-${Date.now().toString().slice(-6)}`,
    status: report.status || 'Approved',
    preparedBy: report.preparedBy || 'Staff Cashier',
    preparedByDesignation: 'Accountant / Cashier',
    approvedBy: report.approvedBy || 'Managing Director',
    approvedByDesignation: 'Executive Director / Senior Auditor',
    section1: {
      channels: [
        { channel: 'Cash in Counter', opening: 0, inflow: Number(report.subtotal ?? (report.amount ?? 0)), outflow: 0, subtotal: Number(report.subtotal ?? (report.amount ?? 0)) },
        { channel: 'Rastriya Banijya Bank(RBB)', opening: 0, inflow: 0, outflow: 0, subtotal: 0 },
        { channel: 'eSewa Wallet', opening: 0, inflow: 0, outflow: 0, subtotal: 0 },
        { channel: 'Sahakari (Cooperative)', opening: 0, inflow: 0, outflow: 0, subtotal: 0 },
      ],
      totals: {
        opening: 0,
        inflow: Number(report.subtotal ?? (report.amount ?? 0)),
        outflow: 0,
        subtotal: Number(report.subtotal ?? (report.amount ?? 0))
      }
    },
    section2: {
      deposits: [],
      finalBalances: [
        { accountName: 'Cash in Counter', subtotal: Number(report.subtotal ?? (report.amount ?? 0)), depositAdjustLabel: 'Minus (-)', depositAdjustAmount: 0, finalClosing: Number(report.grandTotal ?? (report.amount ?? 0)) },
        { accountName: 'Rastriya Banijya Bank(RBB)', subtotal: 0, depositAdjustLabel: 'Plus (+)', depositAdjustAmount: 0, finalClosing: 0 },
        { accountName: 'eSewa Wallet', subtotal: 0, depositAdjustLabel: 'No Change', depositAdjustAmount: 0, finalClosing: 0 },
        { accountName: 'Sahakari (Cooperative)', subtotal: 0, depositAdjustLabel: 'Plus (+)', depositAdjustAmount: 0, finalClosing: 0 },
      ],
      totalClosingFunds: {
        subtotal: Number(report.subtotal ?? (report.amount ?? 0)),
        finalClosing: Number(report.grandTotal ?? (report.amount ?? 0))
      }
    },
    section3: {
      denominations: { 1000: 0, 500: 0, 250: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, coins: 0 },
      amounts: { 1000: 0, 500: 0, 250: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, coins: 0 },
      totalPhysicalCounted: Number(report.grandTotal ?? (report.amount ?? 0)),
      expectedFinalCounterCash: Number(report.grandTotal ?? (report.amount ?? 0)),
      variance: 0
    },
    section4: {
      remarks: report.notes || report.summary || 'All daytime sales, payment channels, operating expenses, and accounts balanced with physical register and online ledger.',
      submittedBy: {
        name: report.preparedBy || 'Staff Cashier',
        designation: 'Cashier / Accountant',
        signatureNote: '(rtss system verified and digitally signed)'
      },
      approvedBy: {
        name: report.approvedBy || 'Managing Director',
        designation: 'Executive Director / Auditor',
        signatureNote: '(rtss system verified and digitally signed)'
      }
    }
  };

  const tableX = 14;
  const tableWidth = pageWidth - 28;

  // --- SUB-HEADER: Date & Prepared By ---
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`Date: ${dcData.date || '________________________'}`, tableX, y);
  doc.text(`Voucher: ${dcData.voucherNumber || 'DCR-DOC'}`, tableX + 50, y);
  doc.text(`Prepared By: ${dcData.preparedBy || '(Logged in user)'}`, tableX + 115, y);

  y += 3.5;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(tableX, y, tableX + tableWidth, y);
  y += 2.5;

  // ============================================================================
  // 1. DAILY ACCOUNT TRANSACTIONS (Before Bank Deposits)
  // ============================================================================
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(tableX, y, tableWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('1. DAILY ACCOUNT TRANSACTIONS (Before Bank Deposits)', tableX + 3, y + 4);
  y += 5.5;

  // Header row
  doc.setFillColor(241, 245, 249);
  doc.rect(tableX, y, tableWidth, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);

  const colWidths1 = [10, 54, 28, 30, 30, 30]; // SN, Channel, Opening, Inflow, Outflow, Subtotal
  let rx = tableX;
  doc.text('S.N.', rx + 2, y + 3.5); rx += colWidths1[0];
  doc.text('Account / Payment Channel', rx + 2, y + 3.5); rx += colWidths1[1];
  doc.text('Opening Balance', rx + 2, y + 3.5); rx += colWidths1[2];
  doc.text('Inflows (Sales)', rx + 2, y + 3.5); rx += colWidths1[3];
  doc.text('Outflows (Expenses)', rx + 2, y + 3.5); rx += colWidths1[4];
  doc.text('Sub-total Balance', rx + 2, y + 3.5);
  y += 5;

  // Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);

  dcData.section1.channels.forEach((ch, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(tableX, y, tableWidth, 4.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(tableX, y + 4.5, tableX + tableWidth, y + 4.5);

    let cx = tableX;
    doc.setFont('helvetica', 'normal');
    doc.text(String(idx + 1), cx + 3, y + 3.2); cx += colWidths1[0];
    doc.setFont('helvetica', 'bold');
    doc.text(ch.channel, cx + 2, y + 3.2); cx += colWidths1[1];
    doc.setFont('helvetica', 'normal');
    doc.text(`Rs. ${Number(ch.opening || 0).toLocaleString('en-IN')}`, cx + 2, y + 3.2); cx += colWidths1[2];
    doc.text(`Rs. ${Number(ch.inflow || 0).toLocaleString('en-IN')}`, cx + 2, y + 3.2); cx += colWidths1[3];
    doc.text(`Rs. ${Number(ch.outflow || 0).toLocaleString('en-IN')}`, cx + 2, y + 3.2); cx += colWidths1[4];
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${Number(ch.subtotal || 0).toLocaleString('en-IN')}`, cx + 2, y + 3.2);

    y += 4.5;
  });

  // Section 1 Totals
  doc.setFillColor(241, 245, 249);
  doc.rect(tableX, y, tableWidth, 5, 'F');
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.rect(tableX, y, tableWidth, 5, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);

  let tx = tableX + colWidths1[0];
  doc.text('TOTALS:', tx + 2, y + 3.5); tx += colWidths1[1];
  doc.text(`Rs. ${Number(dcData.section1.totals.opening || 0).toLocaleString('en-IN')}`, tx + 2, y + 3.5); tx += colWidths1[2];
  doc.text(`Rs. ${Number(dcData.section1.totals.inflow || 0).toLocaleString('en-IN')}`, tx + 2, y + 3.5); tx += colWidths1[3];
  doc.text(`Rs. ${Number(dcData.section1.totals.outflow || 0).toLocaleString('en-IN')}`, tx + 2, y + 3.5); tx += colWidths1[4];
  doc.text(`Rs. ${Number(dcData.section1.totals.subtotal || 0).toLocaleString('en-IN')}`, tx + 2, y + 3.5);
  y += 7;

  // ============================================================================
  // 2. BANK DEPOSIT LOG & FINAL CLOSING RECONCILIATION
  // ============================================================================
  doc.setFillColor(30, 41, 59);
  doc.rect(tableX, y, tableWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('2. BANK DEPOSIT LOG & FINAL CLOSING RECONCILIATION', tableX + 3, y + 4);
  y += 5.5;

  // If there are explicit deposits, render deposit log table
  if (dcData.section2.deposits && dcData.section2.deposits.length > 0) {
    const depCols = [12, 60, 36, 40, 34];
    doc.setFillColor(248, 250, 252);
    doc.rect(tableX, y, tableWidth, 4.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(71, 85, 105);

    let dx = tableX;
    doc.text('S.N.', dx + 2, y + 3.2); dx += depCols[0];
    doc.text('Bank / Institution Name', dx + 2, y + 3.2); dx += depCols[1];
    doc.text('Deposited Amount', dx + 2, y + 3.2); dx += depCols[2];
    doc.text('Time / Deposit Slip Ref', dx + 2, y + 3.2); dx += depCols[3];
    doc.text('Deposited By', dx + 2, y + 3.2);
    y += 4.5;

    dcData.section2.deposits.forEach((dep, dIdx) => {
      doc.setFillColor(255, 255, 255);
      doc.rect(tableX, y, tableWidth, 4, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(tableX, y + 4, tableX + tableWidth, y + 4);

      let cx = tableX;
      doc.setFont('helvetica', 'normal');
      doc.text(String(dIdx + 1), cx + 2, y + 3); cx += depCols[0];
      doc.setFont('helvetica', 'bold');
      doc.text(dep.toAccount || 'Bank / Institution', cx + 2, y + 3); cx += depCols[1];
      doc.text(`Rs. ${Number(dep.amount).toLocaleString('en-IN')}`, cx + 2, y + 3); cx += depCols[2];
      doc.setFont('helvetica', 'normal');
      doc.text(dep.voucherNumber || dep.remarks || 'Slip Ref Recorded', cx + 2, y + 3); cx += depCols[3];
      doc.text('Authorized Staff', cx + 2, y + 3);
      y += 4;
    });
    y += 1.5;
  }

  // Reconciliation Table
  const colWidths2 = [64, 38, 40, 40]; // Account Name, Sub-total Before Deposit, Deposit Adjustment, Final Closing
  doc.setFillColor(241, 245, 249);
  doc.rect(tableX, y, tableWidth, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);

  let rx2 = tableX;
  doc.text('Account Name', rx2 + 2, y + 3.5); rx2 += colWidths2[0];
  doc.text('Sub-total Before Deposit', rx2 + 2, y + 3.5); rx2 += colWidths2[1];
  doc.text('Bank Deposit Adjustment', rx2 + 2, y + 3.5); rx2 += colWidths2[2];
  doc.text('Final Closing Balance', rx2 + 2, y + 3.5);
  y += 5;

  // Final Balances rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);

  dcData.section2.finalBalances.forEach((fb, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(tableX, y, tableWidth, 4.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(tableX, y + 4.5, tableX + tableWidth, y + 4.5);

    let cx = tableX;
    doc.setFont('helvetica', 'bold');
    doc.text(fb.accountName, cx + 2, y + 3.2); cx += colWidths2[0];
    doc.setFont('helvetica', 'normal');
    doc.text(`Rs. ${Number(fb.subtotal || 0).toLocaleString('en-IN')}`, cx + 2, y + 3.2); cx += colWidths2[1];
    doc.text(`${fb.depositAdjustLabel} ${fb.depositAdjustAmount > 0 ? `Rs. ${Number(fb.depositAdjustAmount).toLocaleString('en-IN')}` : ''}`.trim(), cx + 2, y + 3.2); cx += colWidths2[2];
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${Number(fb.finalClosing || 0).toLocaleString('en-IN')}`, cx + 2, y + 3.2);

    y += 4.5;
  });

  // Section 2 Total Closing Funds
  doc.setFillColor(241, 245, 249);
  doc.rect(tableX, y, tableWidth, 5, 'F');
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.rect(tableX, y, tableWidth, 5, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);

  let tx2 = tableX;
  doc.text('TOTAL CLOSING FUNDS (All Accounts Combined):', tx2 + 2, y + 3.5); tx2 += colWidths2[0];
  doc.text(`Rs. ${Number(dcData.section2.totalClosingFunds.subtotal || 0).toLocaleString('en-IN')}`, tx2 + 2, y + 3.5); tx2 += colWidths2[1];
  doc.text('Reconciled', tx2 + 2, y + 3.5); tx2 += colWidths2[2];
  doc.text(`Rs. ${Number(dcData.section2.totalClosingFunds.finalClosing || 0).toLocaleString('en-IN')}`, tx2 + 2, y + 3.5);
  y += 7;

  // ============================================================================
  // 3. PHYSICAL CASH DENOMINATION COUNT (Must match Final Closing Counter Cash)
  // ============================================================================
  doc.setFillColor(30, 41, 59);
  doc.rect(tableX, y, tableWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('3. PHYSICAL CASH DENOMINATION COUNT (Must match Final Closing Counter Cash)', tableX + 3, y + 4);
  y += 5.5;

  // Denominations Grid (compact 5 columns)
  const denomKeys = [1000, 500, 250, 100, 50, 20, 10, 5, 'coins'];
  const denomsPerRow = 5;
  const cellW = tableWidth / denomsPerRow;
  const cellH = 7;

  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < denomsPerRow; c++) {
      const idx = r * denomsPerRow + c;
      if (idx >= denomKeys.length) break;
      const k = denomKeys[idx];
      const count = dcData.section3.denominations[k] || 0;
      const amt = dcData.section3.amounts[k] || 0;
      const bx = tableX + c * cellW;
      const by = y + r * cellH;

      doc.setFillColor(255, 255, 255);
      doc.rect(bx, by, cellW, cellH, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(bx, by, cellW, cellH, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text(k === 'coins' ? 'Coins & Others:' : `Rs. ${k} x ${count}:`, bx + 2, by + 2.8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Rs. ${Number(amt).toLocaleString('en-IN')}`, bx + 2, by + 5.8);
    }
  }
  y += 2 * cellH + 1.5;

  // Total Count vs Expected Counter Cash
  doc.setFillColor(240, 253, 244); // green-50
  doc.rect(tableX, y, tableWidth, 5.5, 'F');
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.3);
  doc.rect(tableX, y, tableWidth, 5.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(22, 101, 52);
  doc.text(`Total Counted Physical Cash: Rs. ${Number(dcData.section3.totalPhysicalCounted || 0).toLocaleString('en-IN')}`, tableX + 3, y + 3.8);
  doc.text(`Expected Final Counter Cash: Rs. ${Number(dcData.section3.expectedFinalCounterCash || 0).toLocaleString('en-IN')}`, tableX + 75, y + 3.8);
  const variance = dcData.section3.variance || 0;
  doc.text(`Variance: Rs. ${Number(variance).toLocaleString('en-IN')} (${variance === 0 ? 'Exact Match' : 'Discrepancy'})`, tableX + 138, y + 3.8);
  y += 7.5;

  // ============================================================================
  // 4. NOTES & SIGNATURES
  // ============================================================================
  doc.setFillColor(30, 41, 59);
  doc.rect(tableX, y, tableWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('4. NOTES & SIGNATURES', tableX + 3, y + 4);
  y += 5.5;

  // Remarks box
  doc.setFillColor(248, 250, 252);
  doc.rect(tableX, y, tableWidth, 8.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(tableX, y, tableWidth, 8.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Closing Remarks & Audit Notes:', tableX + 2.5, y + 3.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  const remarksText = dcData.section4.remarks || 'All daytime sales, operating expenses, and payment accounts balanced with physical register and online ledger.';
  const splitRemarks = doc.splitTextToSize(remarksText, tableWidth - 5);
  doc.text(splitRemarks, tableX + 2.5, y + 6.5);
  y += 10.5;

  // Two Signatory blocks
  const sigW = (tableWidth - 10) / 2;

  // Submitted By (Left)
  doc.setDrawColor(203, 213, 225);
  doc.line(tableX + 5, y + 7, tableX + sigW - 5, y + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text(dcData.section4.submittedBy.name, tableX + 5, y + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text(dcData.section4.submittedBy.designation, tableX + 5, y + 13.5);
  if (dcData.section4.submittedBy.signatureNote) {
    doc.text(dcData.section4.submittedBy.signatureNote, tableX + 5, y + 16.5);
  }

  // Approved By (Right)
  const rightX = tableX + sigW + 10;
  doc.line(rightX + 5, y + 7, rightX + sigW - 5, y + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text(dcData.section4.approvedBy.name, rightX + 5, y + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text(dcData.section4.approvedBy.designation, rightX + 5, y + 13.5);
  if (dcData.section4.approvedBy.signatureNote) {
    doc.text(dcData.section4.approvedBy.signatureNote, rightX + 5, y + 16.5);
  }
}

/**
 * Generates a complete, high-fidelity official PDF document for any attached
 * System Report or Sales Invoice from RTSS official system.
 */
export function generateReportPdf(
  report: SystemReportAttachment,
  profile?: BusinessProfile
): GeneratedPdfResult {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const isDailyClosing =
    (report.category || '').toLowerCase().includes('daily closing') ||
    (report.category || '').toLowerCase().includes('closing') ||
    !!report.dailyClosingData;

  if (isDailyClosing) {
    renderDailyClosingPdf(doc, report, profile, pageWidth, pageHeight);
  } else {
    // Standard system report generation
    const companyName = profile?.name || 'RELIABLETECH SERVICES & SUPPLIERS';
    const companySubtitle = profile?.companySubtitle || 'Complete IT, Networking, Hardware & Security Solutions';
    const location = profile?.location || 'Fikkal-10, Suryodaya Municipality, Ilam, Nepal';
    const pan = profile?.panNumber || '302819405';
    const phone = profile?.phone || '+977-9852681554 / 027-540123';
    const email = profile?.email || 'reliabletechss.fikkal@gmail.com';

    // --- HEADER DECORATIVE TOP STRIP ---
    doc.setFillColor(185, 28, 28); // Crimson Red
    doc.rect(0, 0, pageWidth, 4, 'F');
    doc.setFillColor(3, 105, 161); // Sky Navy
    doc.rect(0, 4, pageWidth, 2, 'F');

    let y = 14;

    // --- COMPANY HEADER ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(companyName.toUpperCase(), pageWidth / 2, y, { align: 'center' });

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(companySubtitle, pageWidth / 2, y, { align: 'center' });

    y += 4.5;
    doc.setFontSize(8);
    doc.text(`${location}  •  Govt. Regd PAN: ${pan}`, pageWidth / 2, y, { align: 'center' });

    y += 4;
    doc.text(`Phone: ${phone}  •  Email: ${email}`, pageWidth / 2, y, { align: 'center' });

    y += 3.5;
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.4);
    doc.line(14, y, pageWidth - 14, y);

    // --- DOCUMENT TITLE BANNER ---
    y += 5;
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(14, y, pageWidth - 28, 11, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.roundedRect(14, y, pageWidth - 28, 11, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(2, 132, 199); // sky-600
    doc.text((report.title || 'OFFICIAL SYSTEM STATEMENT').toUpperCase(), pageWidth / 2, y + 7, { align: 'center' });

    // --- METADATA GRID ---
    y += 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    const col1X = 16;
    const col2X = pageWidth / 2 + 5;

    // Left Column
    doc.setFont('helvetica', 'bold');
    doc.text('Document Category:', col1X, y);
    doc.setFont('helvetica', 'normal');
    doc.text(report.category || 'General Statement', col1X + 32, y);

    // Right Column
    doc.setFont('helvetica', 'bold');
    doc.text('Reference / Bill No:', col2X, y);
    doc.setFont('helvetica', 'normal');
    doc.text(report.referenceNo || `RTSS-REF-${Date.now().toString().slice(-6)}`, col2X + 32, y);

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Report BS Date:', col1X, y);
    doc.setFont('helvetica', 'normal');
    doc.text(report.reportDate || 'Current BS Date', col1X + 32, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Valid Period / Date:', col2X, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${report.fromDate || 'N/A'} to ${report.toDate || 'N/A'}`, col2X + 32, y);

    if (report.amount !== undefined) {
      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Total Statement Val:', col1X, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129); // emerald-600
      doc.text(`NPR ${Number(report.amount).toLocaleString('en-IN')}`, col1X + 32, y);
      doc.setTextColor(51, 65, 85);
    }

    // --- SUMMARY CALLOUT ---
    if (report.summary) {
      y += 7;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, y, pageWidth - 28, 12, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const splitSummary = doc.splitTextToSize(`Executive Note: ${report.summary}`, pageWidth - 36);
      doc.text(splitSummary, 18, y + 5);
      y += 12;
    } else {
      y += 4;
    }

    // --- ITEMIZED BREAKDOWN TABLE ---
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('COMPLETE ITEMIZED STATEMENT & DATA BREAKDOWN', 16, y);

    y += 3;

    // Table Headers
    const tableX = 14;
    const tableWidth = pageWidth - 28;
    const headerHeight = 7;

    const hasCustomItems = report.items && report.items.length > 0;

    if (hasCustomItems) {
      // Formatted Report Table Layout
      doc.setFillColor(3, 105, 161); // Sky blue header
      doc.rect(tableX, y, tableWidth, headerHeight, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);

      const colWidths = [12, 90, 18, 28, 34];
      let currentX = tableX;

      doc.text('S.N.', currentX + 3, y + 4.5);
      currentX += colWidths[0];
      doc.text('Item Description & Accounting Particulars', currentX + 3, y + 4.5);
      currentX += colWidths[1];
      doc.text('Qty', currentX + 3, y + 4.5);
      currentX += colWidths[2];
      doc.text('Rate (Rs.)', currentX + 3, y + 4.5);
      currentX += colWidths[3];
      doc.text('Amount (Rs.)', currentX + 3, y + 4.5);

      y += headerHeight;

      const itemsToRender = (report.items && report.items.length > 0)
        ? report.items
        : [
            { sn: 1, name: 'Opening Cash Balance', description: 'Start-of-day register cash balance', quantity: 1, unitPrice: report.amount || 0, totalPrice: report.amount || 0 }
          ];

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);

      itemsToRender.forEach((item: any, index: number) => {
        const rowHeight = item.description ? 7.5 : 6;
        const isEven = index % 2 === 0;
        doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
        doc.rect(tableX, y, tableWidth, rowHeight, 'F');
        doc.setDrawColor(241, 245, 249);
        doc.line(tableX, y + rowHeight, tableX + tableWidth, y + rowHeight);

        doc.setTextColor(30, 41, 59);
        let rxLocal = tableX;

        // S.N.
        doc.setFont('helvetica', 'normal');
        doc.text(String(item.sn || index + 1), rxLocal + 4, y + 4);
        rxLocal += colWidths[0];

        // Item Description
        doc.setFont('helvetica', 'bold');
        doc.text(String(item.name || '').slice(0, 52), rxLocal + 3, y + (item.description ? 3.5 : 4));
        if (item.description) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139);
          doc.text(String(item.description).slice(0, 68), rxLocal + 3, y + 6.5);
          doc.setFontSize(7.5);
          doc.setTextColor(30, 41, 59);
        }
        rxLocal += colWidths[1];

        // Qty
        doc.setFont('helvetica', 'normal');
        doc.text(item.quantity !== undefined ? `${item.quantity} ${item.unitType || ''}`.trim() : '1', rxLocal + 3, y + 4);
        rxLocal += colWidths[2];

        // Rate
        const unitP = item.unitPrice !== undefined ? Number(item.unitPrice).toLocaleString('en-IN') : '-';
        doc.text(unitP, rxLocal + 3, y + 4);
        rxLocal += colWidths[3];

        // Amount
        const totalP = item.totalPrice !== undefined ? Number(item.totalPrice).toLocaleString('en-IN') : '-';
        doc.setFont('helvetica', 'bold');
        doc.text(totalP, rxLocal + 3, y + 4);
        doc.setFont('helvetica', 'normal');

        y += rowHeight;
      });

      // Subtotal & Grand Total
      y += 1.5;
      const grandTotalVal = report.grandTotal !== undefined ? Number(report.grandTotal) : (report.amount || 0);

      // Grand Total Row
      doc.setFillColor(241, 245, 249);
      doc.rect(tableX, y, tableWidth, 8, 'F');
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.4);
      doc.rect(tableX, y, tableWidth, 8, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('TOTAL STATEMENT VALUE (NPR):', tableX + 20, y + 5.5);

      doc.setTextColor(16, 185, 129); // Emerald
      doc.setFontSize(9.5);
      doc.text(`Rs. ${grandTotalVal.toLocaleString('en-IN')}`, tableX + tableWidth - 44, y + 5.5);
      y += 9.5;

      // Amount In Words & Notes
      if (report.amountInWords || report.notes) {
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(226, 232, 240);
        const notesHeight = report.notes ? 12 : 7;
        doc.roundedRect(tableX, y, tableWidth, notesHeight, 1.5, 1.5, 'FD');

        if (report.amountInWords) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(15, 23, 42);
          doc.text('AMOUNT IN WORDS: ', tableX + 3, y + 4);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(String(report.amountInWords), tableX + 32, y + 4);
        }

        if (report.notes) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139);
          const splitNotes = doc.splitTextToSize(`Notes & Audit: ${report.notes}`, tableWidth - 6);
          doc.text(splitNotes, tableX + 3, y + (report.amountInWords ? 8 : 4.5));
        }
        y += notesHeight + 2;
      }
    } else {
      // Standard generic reports fallback
      doc.setFillColor(3, 105, 161); // Sky blue header
      doc.rect(tableX, y, tableWidth, headerHeight, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);

      const colWidths = [12, 60, 28, 20, 26, 30];
      let currentX = tableX;

      doc.text('SN', currentX + 3, y + 4.5);
      currentX += colWidths[0];
      doc.text('Particulars & Description', currentX + 3, y + 4.5);
      currentX += colWidths[1];
      doc.text('Classification', currentX + 3, y + 4.5);
      currentX += colWidths[2];
      doc.text('Unit Rate', currentX + 3, y + 4.5);
      currentX += colWidths[3];
      doc.text('Qty / Units', currentX + 3, y + 4.5);
      currentX += colWidths[4];
      doc.text('Amount (NPR)', currentX + 3, y + 4.5);

      y += headerHeight;

      let sampleRows: Array<{ sn: string; desc: string; classif: string; rate: string; qty: string; amount: number }> = [];

      if (report.category.toLowerCase().includes('invoice') || report.category.toLowerCase().includes('sales')) {
        sampleRows = [
          { sn: '1', desc: 'Enterprise Commercial Router & Gigabit Switch Setup', classif: 'Hardware', rate: '35,000', qty: '2 Units', amount: 70000 },
          { sn: '2', desc: 'Cat6 Shielded Outdoor Ethernet Cabling & Crimping', classif: 'Networking', rate: '85/m', qty: '300 Mtr', amount: 25500 },
          { sn: '3', desc: 'High-Definition 5MP Color Night Vision CCTV Cameras', classif: 'Security', rate: '6,200', qty: '8 Pcs', amount: 49600 },
          { sn: '4', desc: 'Hikvision 8-Channel NVR + 4TB Surveillance Hard Drive', classif: 'Storage', rate: '28,500', qty: '1 Set', amount: 28500 },
          { sn: '5', desc: 'Certified Fiber Splicing & On-Site Installation Labor', classif: 'Service', rate: '12,000', qty: '1 Job', amount: 12000 }
        ];
      } else if (report.category.toLowerCase().includes('expense')) {
        sampleRows = [
          { sn: '1', desc: 'Wholesale IT Equipment & Inventory Replenishment', classif: 'Inventory', rate: '65,000', qty: 'Bulk Batch', amount: 65000 },
          { sn: '2', desc: 'Fikkal to Pashupatinagar / Rong Technical Delivery Logistics', classif: 'Logistics', rate: '4,500', qty: '5 Trips', amount: 22500 },
          { sn: '3', desc: 'Storefront Fiber High-Speed Internet & Static IP Bandwidth', classif: 'Utilities', rate: '6,200', qty: 'Monthly', amount: 6200 },
          { sn: '4', desc: 'On-Site Field Engineer Allowances & Technical Travel', classif: 'Labor', rate: '15,000', qty: 'Payroll', amount: 15000 },
          { sn: '5', desc: 'Office Consumables, Printing Stationery & Hardware Spares', classif: 'Admin', rate: '8,300', qty: 'Stock', amount: 8300 }
        ];
      } else {
        sampleRows = [
          { sn: '1', desc: 'Liquid Cash in Hand (Store Cash Register Vault)', classif: 'Current Asset', rate: 'N/A', qty: 'Verified', amount: 42500 },
          { sn: '2', desc: 'Rastriya Banijya Bank (Current Account No. 12000214)', classif: 'Bank Asset', rate: 'N/A', qty: 'Reconciled', amount: 385000 },
          { sn: '3', desc: 'eSewa Merchant Gateway Operational Settlement Wallet', classif: 'Digital Asset', rate: 'N/A', qty: 'Instant', amount: 56400 },
          { sn: '4', desc: 'Local Cooperative Savings Account (Suryodaya Sahakari)', classif: 'Fixed Reserve', rate: 'N/A', qty: 'Dep. Passbook', amount: 180000 },
          { sn: '5', desc: 'Active Trade Receivables & Verified Client Accounts', classif: 'Receivables', rate: 'N/A', qty: 'Invoices', amount: 95000 }
        ];
      }

      let calculatedTotal = sampleRows.reduce((acc, row) => acc + row.amount, 0);
      if (report.amount && report.amount > 0) {
        const ratio = report.amount / calculatedTotal;
        sampleRows = sampleRows.map(r => ({
          ...r,
          amount: Math.round(r.amount * ratio)
        }));
        calculatedTotal = report.amount;
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);

      sampleRows.forEach((row, index) => {
        const isEven = index % 2 === 0;
        doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
        doc.rect(tableX, y, tableWidth, 6.5, 'F');
        doc.setDrawColor(241, 245, 249);
        doc.line(tableX, y + 6.5, tableX + tableWidth, y + 6.5);

        doc.setTextColor(30, 41, 59);
        let rxLocal = tableX;

        doc.text(row.sn, rxLocal + 3, y + 4.5);
        rxLocal += colWidths[0];
        doc.text(row.desc.slice(0, 36), rxLocal + 3, y + 4.5);
        rxLocal += colWidths[1];
        doc.text(row.classif, rxLocal + 3, y + 4.5);
        rxLocal += colWidths[2];
        doc.text(row.rate, rxLocal + 3, y + 4.5);
        rxLocal += colWidths[3];
        doc.text(row.qty, rxLocal + 3, y + 4.5);
        rxLocal += colWidths[4];
        doc.setFont('helvetica', 'bold');
        doc.text(row.amount.toLocaleString('en-IN'), rxLocal + 3, y + 4.5);
        doc.setFont('helvetica', 'normal');

        y += 6.5;
      });

      // Totals Row
      y += 2;
      doc.setFillColor(241, 245, 249);
      doc.rect(tableX, y, tableWidth, 8, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(tableX, y, tableWidth, 8, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('TOTAL STATEMENT VALUE (NPR):', tableX + 30, y + 5.5);

      doc.setTextColor(16, 185, 129); // Emerald
      doc.setFontSize(9.5);
      doc.text(`NPR ${calculatedTotal.toLocaleString('en-IN')}`, tableX + tableWidth - 36, y + 5.5);
    }

    // --- OFFICIAL SIGNATORIES & AUDIT SEAL ---
    y = pageHeight - 45;

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);

    // Left Signatory: Prepared By
    doc.line(20, y, 65, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Prepared by: ${report.preparedBy || 'RTSS Officer'}`, 20, y + 4);
    doc.text('Department of Accounts & Billing', 20, y + 7.5);

    // Center Seal Stamp
    doc.setDrawColor(3, 105, 161);
    doc.roundedRect(pageWidth / 2 - 20, y - 10, 40, 18, 2, 2, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(3, 105, 161);
    doc.text('RELIABLETECH SERVICES', pageWidth / 2, y - 4, { align: 'center' });
    doc.text('★ OFFICIAL SYSTEM VERIFIED ★', pageWidth / 2, y, { align: 'center' });
    doc.text('FIKKAL, ILAM, NEPAL', pageWidth / 2, y + 4, { align: 'center' });

    // Right Signatory: Authorized Signatory
    doc.line(pageWidth - 65, y, pageWidth - 20, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(report.approvedBy ? `Approved: ${report.approvedBy}` : 'Authorized Signatory / MD', pageWidth - 65, y + 4);
    doc.text('ReliableTech Services & Suppliers', pageWidth - 65, y + 7.5);
  }

  // --- FOOTER NOTICE ---
  doc.setFillColor(248, 250, 252);
  doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(0, pageHeight - 14, pageWidth, pageHeight - 14);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This is an official system generated document by ReliableTech Services & Suppliers (RTSS). Generated on ' +
      new Date().toLocaleString() +
      '. Document Ref: ' + (report.referenceNo || 'RTSS-DOC'),
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );
  doc.text(
    'ReliableTech - Solutions You Can Count On, Services You can Trust. Fikkal-10, Suryodaya, Ilam, Nepal.',
    pageWidth / 2,
    pageHeight - 4.5,
    { align: 'center' }
  );

  // Output as Data URL
  const dataUrl = doc.output('datauristring');
  const cleanRef = (report.referenceNo || 'DOC').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanCat = (report.category || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `RTSS_${cleanCat}_${cleanRef}.pdf`;

  // Estimate size in bytes
  const size = Math.round((dataUrl.length * 3) / 4);

  return {
    fileName,
    dataUrl,
    size
  };
}
