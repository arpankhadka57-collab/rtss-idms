import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { 
  Printer, 
  Mail,
  Send,
  X, 
  FileText, 
  Layout, 
  Sliders, 
  Check, 
  RotateCcw, 
  Eye, 
  Maximize2, 
  ZoomIn, 
  ZoomOut,
  Building2,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Scissors,
  Layers
} from 'lucide-react';
import { BusinessProfile } from '../types';
import { CorporateLetterhead } from './CorporateLetterhead';
import { numberToWords } from '../utils/nepaliDate';
import { DailyClosingStatementView } from './DailyClosingStatementView';
import { DailyClosingReportDetailedData } from '../utils/dailyClosingReportBuilder';

export interface PrintDocumentItem {
  sn?: number | string;
  name: string;
  description?: string;
  quantity?: number | string;
  unitPrice?: number | string;
  totalPrice?: number | string;
  remarks?: string;
  unitType?: string;
}

export interface PrintDocumentData {
  documentType?: 'Invoice' | 'Purchase Order' | 'Official Letter' | 'Report' | 'Receipt' | 'Daily Closing' | 'Meeting Notes' | 'Asset Register' | 'Expense Voucher' | 'General' | string;
  documentNumber?: string;
  fiscalYear?: string;
  documentDate?: string;
  status?: string;
  profile?: BusinessProfile;
  salutation?: string;
  signeeName?: string;
  signeeRole?: string;
  recipient?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    pan?: string;
    contactPerson?: string;
    department?: string;
  };
  sender?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    pan?: string;
  };
  title?: string;
  subject?: string;
  bodyText?: string;
  bodyHtml?: React.ReactNode;
  items?: PrintDocumentItem[];
  summaryMetrics?: Array<{
    label: string;
    value: string | number;
    highlight?: boolean;
  }>;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  grandTotal?: number;
  amountInWords?: string;
  notes?: string;
  terms?: string[];
  preparedBy?: string;
  approvedBy?: string;
  customComponent?: React.ReactNode;
  dailyClosingData?: DailyClosingReportDetailedData;
}

declare global {
  interface Window {
    openUniversalPrintPreview?: (data: PrintDocumentData) => void;
  }
}

interface GlobalPrintPreviewModalProps {
  profile: BusinessProfile;
}

export const GlobalPrintPreviewModal: React.FC<GlobalPrintPreviewModalProps> = ({ profile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [docData, setDocData] = useState<PrintDocumentData | null>(null);

  // Print Layout Customization States
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'Legal' | 'A5'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [marginPreset, setMarginPreset] = useState<'normal' | 'tight' | 'compact' | 'wide' | 'none' | 'custom'>('tight');
  const [customMarginValue, setCustomMarginValue] = useState<string>('3');
  const [showHeader, setShowHeader] = useState(true);
  const [showWatermark, setShowWatermark] = useState(false);
  const [showFooter, setShowFooter] = useState(true);
  const [colorMode, setColorMode] = useState<'color' | 'monochrome'>('color');

  // Pages Per Sheet State
  const [pagesPerSheet, setPagesPerSheet] = useState<number>(1);
  const [customPagesInput, setCustomPagesInput] = useState<string>('2');

  const effectivePagesPerSheet = useMemo(() => {
    if (pagesPerSheet === -1) {
      const parsed = parseInt(customPagesInput, 10);
      return !isNaN(parsed) && parsed >= 1 ? Math.min(16, parsed) : 1;
    }
    return pagesPerSheet;
  }, [pagesPerSheet, customPagesInput]);

  // Auto-Scale / Fit to Screen state
  const [autoFit, setAutoFit] = useState(true);
  const [zoomScale, setZoomScale] = useState(1);
  const [calculatedScale, setCalculatedScale] = useState(1);

  const canvasRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  // Setup Global Trigger Handlers
  useEffect(() => {
    const handleOpen = (data: PrintDocumentData) => {
      setDocData(data);
      setIsOpen(true);
      setAutoFit(true);
      setZoomScale(1);
    };

    window.openUniversalPrintPreview = handleOpen;

    const handleCustomEvent = (e: CustomEvent<PrintDocumentData>) => {
      if (e.detail) {
        handleOpen(e.detail);
      }
    };

    window.addEventListener('rtss-open-print-preview', handleCustomEvent as EventListener);

    return () => {
      delete window.openUniversalPrintPreview;
      window.removeEventListener('rtss-open-print-preview', handleCustomEvent as EventListener);
    };
  }, []);

  // Compute paper physical aspect ratio and pixel size for rendering
  const getPaperDimensions = () => {
    let baseW = 794; // A4 @ 96 DPI portrait width ~210mm
    let baseH = 1123; // A4 @ 96 DPI portrait height ~297mm

    if (pageSize === 'Letter') {
      baseW = 816; // 8.5"
      baseH = 1056; // 11"
    } else if (pageSize === 'Legal') {
      baseW = 816; // 8.5"
      baseH = 1344; // 14"
    } else if (pageSize === 'A5') {
      baseW = 559; // 148mm
      baseH = 794; // 210mm
    }

    if (orientation === 'landscape') {
      return { width: baseH, height: baseW };
    }
    return { width: baseW, height: baseH };
  };

  const paperDimensions = getPaperDimensions();

  // Auto-scale calculation engine to guarantee zero-scroll viewport fitting
  useLayoutEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const updateScale = () => {
      if (!canvasRef.current) return;
      const canvasWidth = canvasRef.current.clientWidth - 48; // padding margin
      const canvasHeight = canvasRef.current.clientHeight - 48;

      if (canvasWidth <= 0 || canvasHeight <= 0) return;

      const scaleX = canvasWidth / paperDimensions.width;
      const scaleY = canvasHeight / paperDimensions.height;
      
      const fitScale = Math.min(scaleX, scaleY);
      // Bound fit scale between 0.35 and 1.25 for crisp rendering
      const boundedScale = Math.max(0.35, Math.min(1.25, fitScale));
      
      setCalculatedScale(boundedScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [isOpen, pageSize, orientation, paperDimensions.width, paperDimensions.height]);

  const activeScale = autoFit ? calculatedScale : zoomScale;

  // Margin values
  const getMarginStyle = () => {
    if (marginPreset === 'custom') {
      const num = parseFloat(customMarginValue);
      if (isNaN(num) || num < 0) return '0mm';
      return `${num}mm`;
    }
    switch (marginPreset) {
      case 'tight': return '3mm';
      case 'compact': return '6mm';
      case 'wide': return '20mm';
      case 'none': return '0mm';
      case 'normal': return '12mm';
      default: return '3mm';
    }
  };

  const marginVal = getMarginStyle();

  if (!isOpen || !docData) return null;

  const currentProfile = docData.profile || profile;

  const handleSendByEmail = () => {
    if (!docData) return;
    const recipientName = docData.partyName || docData.customerName || docData.recipientName || '';
    const recipientEmail = docData.customerEmail || docData.recipientEmail || '';
    const docTitle = docData.title || 'Official Document';
    const docNo = docData.voucherNo || docData.invoiceNo || docData.documentNo || '';
    const subject = `${docTitle} ${docNo ? `(#${docNo})` : ''} - ReliableTech Services & Suppliers`;

    let itemsText = '';
    if (docData.items && docData.items.length > 0) {
      itemsText = `\nItems / Breakdown:\n` + docData.items.map((it, idx) => ` ${idx + 1}. ${it.name || it.description} - Qty: ${it.quantity || 1} x Rs. ${it.rate || it.unitPrice || 0} = Rs. ${it.total || it.amount || 0}`).join('\n');
    }

    const message = `Dear ${recipientName || 'Valued Recipient'},\n\nPlease find the document details below regarding ${docTitle}${docNo ? ` (#${docNo})` : ''}.\n\nDocument Summary:\n- Document: ${docTitle}\n- Reference No: ${docNo || 'N/A'}\n- Date: ${docData.date || new Date().toISOString().split('T')[0]}\n- Total Amount: Rs. ${(docData.totalAmount || docData.netTotal || docData.grandTotal || 0).toLocaleString()}\n${itemsText}\n\nOrganization: ReliableTech Services & Suppliers (RTSS)\nFikkal, Ilam, Nepal\n\nThank you for choosing ReliableTech Services & Suppliers!`;

    if (window.openUniversalEmailModal) {
      window.openUniversalEmailModal({
        recipientEmail,
        recipientName,
        subject,
        message,
        emailType: docTitle || 'Official Document Dispatch',
        documentRef: docNo
      });
    }
  };

  const handlePrint = () => {
    // 1. Grab only the isolated invoice element
    const printElement = document.getElementById('universal-print-paper-content');
    if (!printElement) {
      console.error("Print content element not found");
      return;
    }

    // 2. Create a hidden iframe element
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // 3. Collect all current stylesheets on the page to preserve invoice fonts/styles
    const styleElements = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    // 4. Inject a clean, standalone HTML page containing ONLY the invoice
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Document</title>
          ${styleElements}
          <style>
            @page {
              size: ${pageSize} ${orientation};
              margin: 0mm !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              width: 210mm;
              height: 297mm;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #universal-print-paper-content {
              width: 210mm !important;
              height: 297mm !important;
              box-sizing: border-box !important;
              margin: 0 !important;
              padding: ${marginVal} !important; /* Matches custom layout margin */
              box-shadow: none !important;
              filter: ${colorMode === 'monochrome' ? 'grayscale(100%) contrast(125%)' : 'none'} !important;
            }
          </style>
        </head>
        <body>
          <div id="universal-print-paper-content">
            ${printElement.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // 5. Trigger the print dialog safely after styles load
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      // Clean up the DOM element after printing triggers
      document.body.removeChild(iframe);
    }, 800);
  };

  return (
    <div 
      id="global-print-preview-modal" 
      className="fixed inset-0 z-[999999] bg-slate-950 text-slate-100 flex flex-col h-screen w-screen overflow-hidden font-sans select-none"
    >
      {/* Inject Dynamic CSS Custom Properties and Print Rule Override */}
      <style>{`
        :root {
          --print-page-size: ${pageSize};
          --print-orientation: ${orientation};
          --print-margin-val: ${marginVal};
        }

        /* Screen Preview Toggles for Header, Watermark, Footer */
        ${!showHeader ? `
          #universal-print-paper-content .corporate-letterhead-header,
          #universal-print-paper-content .print-header,
          #universal-print-paper-content header {
            display: none !important;
          }
        ` : ''}

        ${!showWatermark ? `
          #universal-print-paper-content .watermark-container,
          #universal-print-paper-content [alt*="Watermark"],
          #universal-print-paper-content [alt*="watermark"],
          #universal-print-paper-content .corporate-watermark {
            display: none !important;
          }
        ` : `
          #universal-print-paper-content .watermark-container,
          #universal-print-paper-content .corporate-watermark {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            position: absolute !important;
            inset: 0 !important;
            pointer-events: none !important;
          }
          #universal-print-paper-content .watermark-container img,
          #universal-print-paper-content .corporate-watermark img {
            opacity: 0.025 !important;
            mix-blend-mode: multiply !important;
            margin: auto !important;
          }
        `}

        ${!showFooter ? `
          #universal-print-paper-content .corporate-letterhead-footer,
          #universal-print-paper-content .print-footer,
          #universal-print-paper-content footer {
            display: none !important;
          }
        ` : ''}

        @media print {
          @page {
            size: ${pageSize} ${orientation} !important;
            margin: ${marginVal} !important;
          }

          /* Step 1: Forcefully remove every element in the app except the modal wrapper and paper content */
          body > *:not(#root),
          #root > *:not(#global-print-preview-modal),
          .universal-print-preview-engine-sidebar,
          .print-settings-panel,
          .print-controls-panel,
          .print-top-bar,
          .no-print,
          [no-print],
          .print-hidden,
          .print\:hidden,
          header, 
          nav, 
          footer {
            display: none !important;
          }

          /* Step 2: Clear all document wrappers to let the printable container take full control */
          html, body, #root, #global-print-preview-modal, .print-preview-canvas-container {
            background: #fff !important;
            color: #000 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            display: block !important;
            position: static !important;
            box-shadow: none !important;
          }

          /* Intermediate flex/scaled wrappers inside modal canvas */
          #global-print-preview-modal > div,
          #global-print-preview-modal .print-preview-canvas-container > div {
            display: block !important;
            height: auto !important;
            width: 100% !important;
            position: static !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
            box-shadow: none !important;
          }

          /* Step 3: Completely isolate the invoice container to render alone */
          #universal-print-paper-content {
            display: block !important;
            position: static !important; /* Prevents absolute positioning clipping breaks */
            width: 210mm !important; /* Perfect A4 width */
            max-width: 100% !important;
            max-height: 297mm !important; /* Tight upper limit for single page execution */
            margin: 0 auto !important;
            padding: 10mm !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            transform: none !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            filter: ${colorMode === 'monochrome' ? 'grayscale(100%) contrast(125%)' : 'none'} !important;
          }

          #universal-print-paper-content .custom-doc-padding-wrapper,
          #universal-print-paper-content .corporate-letterhead-content-container {
            padding: 0 !important;
          }

          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>

      {/* TOP BAR TOOLBAR */}
      <div className="print-top-bar no-print h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Printer className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold tracking-wide text-white uppercase font-mono">
                Universal Print Preview Engine
              </h2>
              <span className="bg-indigo-950 text-indigo-300 border border-indigo-800/60 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                WYSIWYG Mode
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Document: <span className="text-slate-200 font-semibold">{docData.documentType || 'Official Document'}</span> {docData.documentNumber ? `(#${docData.documentNumber})` : ''}
            </p>
          </div>
        </div>

        {/* Zoom & Quick Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => {
                setAutoFit(false);
                setZoomScale(prev => Math.max(0.4, prev - 0.1));
              }}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold px-2 text-slate-300 min-w-[52px] text-center">
              {Math.round(activeScale * 100)}%
            </span>
            <button
              onClick={() => {
                setAutoFit(false);
                setZoomScale(prev => Math.min(1.5, prev + 0.1));
              }}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setAutoFit(!autoFit);
                if (!autoFit) setZoomScale(1);
              }}
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition cursor-pointer ${
                autoFit ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Auto Fit to Viewport"
            >
              Fit Screen
            </button>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer border border-slate-700/60"
            title="Close Preview (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MAIN BODY: 2-COLUMN SPLIT CONTAINER (320px SIDEBAR + PREVIEW CANVAS) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT CONTROL PANEL (320px WIDE FIXED) */}
        <div className="print-controls-panel no-print w-[320px] bg-slate-900 border-r border-slate-800/80 p-5 flex flex-col justify-between overflow-y-auto shrink-0 select-none shadow-xl z-10">
          <div className="space-y-6">
            
            {/* Panel Title */}
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Page & Layout Settings
              </h3>
            </div>

            {/* Page Size Select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Paper Size
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="A4">A4 (210 × 297 mm) [Default Standard]</option>
                <option value="Letter">US Letter (8.5 × 11 in)</option>
                <option value="Legal">US Legal (8.5 × 14 in)</option>
                <option value="A5">A5 Statement (148 × 210 mm)</option>
              </select>
            </div>

            {/* Orientation Segmented Toggle */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-slate-400" />
                Orientation
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    orientation === 'portrait'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-2.5 h-3.5 border border-current rounded-xs inline-block"></span>
                  Portrait
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    orientation === 'landscape'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-3.5 h-2.5 border border-current rounded-xs inline-block"></span>
                  Landscape
                </button>
              </div>
            </div>

            {/* Margins Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-slate-400" />
                Print Margins
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'tight', label: 'Universal (3mm)', val: '3' },
                  { key: 'compact', label: 'Compact (6mm)', val: '6' },
                  { key: 'normal', label: 'Normal (12mm)', val: '12' },
                  { key: 'wide', label: 'Wide (20mm)', val: '20' },
                  { key: 'none', label: 'Zero (0mm)', val: '0' }
                ].map(m => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => {
                      setMarginPreset(m.key as any);
                      setCustomMarginValue(m.val);
                    }}
                    className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border text-left transition cursor-pointer ${
                      marginPreset === m.key
                        ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Custom Margin Input Box */}
              <div className="pt-1.5">
                <div className={`flex items-center justify-between gap-2 p-2 rounded-lg border transition ${
                  marginPreset === 'custom'
                    ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}>
                  <label className="text-[11px] font-bold text-slate-300 shrink-0">Custom Margin:</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={customMarginValue}
                      onChange={(e) => {
                        setCustomMarginValue(e.target.value);
                        setMarginPreset('custom');
                      }}
                      onFocus={() => setMarginPreset('custom')}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs font-mono font-bold text-indigo-300 focus:outline-none focus:border-indigo-500 text-center"
                      placeholder="e.g. 15"
                    />
                    <span className="text-xs font-bold text-slate-400">mm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pages Per Sheet Option */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Pages Per Sheet
                </span>
                <span className="text-[10px] text-indigo-300 font-mono font-bold bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-800/60">
                  {effectivePagesPerSheet} {effectivePagesPerSheet === 1 ? 'Page' : 'Pages'}
                </span>
              </label>
              
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { val: 1, label: '1 Up (Full)' },
                  { val: 2, label: '2 Up' },
                  { val: 4, label: '4 Up (2x2)' },
                  { val: 6, label: '6 Up (3x2)' },
                  { val: 9, label: '9 Up (3x3)' },
                  { val: -1, label: 'Custom' }
                ].map(p => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setPagesPerSheet(p.val)}
                    className={`py-1.5 px-1.5 text-[10.5px] font-bold rounded-lg border text-center transition cursor-pointer ${
                      pagesPerSheet === p.val
                        ? 'bg-indigo-950/90 border-indigo-500 text-indigo-200 font-extrabold shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {pagesPerSheet === -1 && (
                <div className="pt-1.5">
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-indigo-950/80 border-indigo-500 text-indigo-200">
                    <label className="text-[11px] font-bold shrink-0">Custom Pages / Sheet:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="16"
                        step="1"
                        value={customPagesInput}
                        onChange={(e) => setCustomPagesInput(e.target.value)}
                        className="w-16 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs font-mono font-bold text-indigo-300 focus:outline-none focus:border-indigo-500 text-center"
                        placeholder="e.g. 2"
                      />
                      <span className="text-xs font-bold text-slate-400">Pages</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Toggles & Display Options */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Branding & Display
              </span>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer hover:text-white">
                <span>Corporate Header</span>
                <input
                  type="checkbox"
                  checked={showHeader}
                  onChange={(e) => setShowHeader(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer hover:text-white">
                <span>Background Watermark</span>
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer hover:text-white">
                <span>Corporate Footer & Page #</span>
                <input
                  type="checkbox"
                  checked={showFooter}
                  onChange={(e) => setShowFooter(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>
            </div>

            {/* Color Mode Toggle */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Output Color Mode
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setColorMode('color')}
                  className={`py-1.5 rounded-md transition cursor-pointer ${
                    colorMode === 'color' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Full Color
                </button>
                <button
                  type="button"
                  onClick={() => setColorMode('monochrome')}
                  className={`py-1.5 rounded-md transition cursor-pointer ${
                    colorMode === 'monochrome' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Monochrome
                </button>
              </div>
            </div>

          </div>

          {/* BOTTOM ACTION BUTTONS */}
          <div className="pt-6 border-t border-slate-800 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSendByEmail}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 px-3 rounded-xl shadow-lg flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider transition cursor-pointer active:scale-[0.98]"
                title="Dispatch document directly to recipient via RTSS Email Engine"
              >
                <Mail className="w-4 h-4" />
                <span>Email Doc</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold py-3 px-3 rounded-xl shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider transition cursor-pointer active:scale-[0.98]"
              >
                <Printer className="w-4 h-4" />
                <span>Print Doc</span>
              </button>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 px-4 rounded-xl text-xs transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* RIGHT PREVIEW CANVAS WORKSPACE */}
        <div 
          ref={canvasRef}
          className="print-preview-canvas-container flex-1 h-full bg-slate-950/90 flex items-center justify-center overflow-auto p-4 md:p-8 relative"
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        >
          {/* RENDERED PAPER SHEET (AUTOSCALED) */}
          <div
            ref={paperRef}
            className="transition-transform duration-150 ease-out flex justify-center items-center"
            style={{
              transform: `scale(${activeScale})`,
              transformOrigin: 'center center',
              width: `${paperDimensions.width}px`,
              height: `${paperDimensions.height}px`,
              minWidth: `${paperDimensions.width}px`,
              minHeight: `${paperDimensions.height}px`,
            }}
          >
            <div
              id="universal-print-paper-content"
              className="bg-white text-slate-900 shadow-2xl relative overflow-hidden flex flex-col justify-between"
              style={{
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                filter: colorMode === 'monochrome' ? 'grayscale(100%) contrast(125%)' : 'none'
              }}
            >
              {/* PAPER CONTENT (1-UP OR N-UP PAGES PER SHEET) */}
              {(() => {
                const renderSingleDocumentContent = (pageIdx: number) => {
                  if (docData.customComponent) {
                    return (
                      <div 
                        className="w-full h-full overflow-y-auto print:overflow-visible custom-doc-padding-wrapper"
                        style={{ padding: marginVal, boxSizing: 'border-box' }}
                      >
                        {docData.customComponent}
                      </div>
                    );
                  }

                  return (
                    <CorporateLetterhead
                      profile={currentProfile}
                      documentType={(docData.documentType as any) || 'General'}
                      documentNumber={docData.documentNumber}
                      documentDate={docData.documentDate}
                      hideHeader={!showHeader}
                      hideFooter={!showFooter}
                      showWatermark={showWatermark}
                      paddingMargin={marginVal}
                      className="w-full h-full border-none shadow-none rounded-none"
                    >
                      {docData.documentType === 'Official Letter' ? (
                        <div className="space-y-6 py-2 text-xs text-slate-900 font-sans">
                          {/* Fiscal Year & Ref No (Left) | Date BS (Right) */}
                          <div className="flex justify-between items-start text-xs border-b border-slate-200 pb-3">
                            <div className="space-y-1 font-medium text-slate-800">
                              <p>Fiscal Year/आर्थिक वर्ष : <span className="font-bold font-mono text-slate-900">{docData.fiscalYear || '2083/84'}</span></p>
                              <p>Ref. No. /चलानी नम्बर: <span className="font-bold font-mono text-slate-900">{docData.documentNumber?.replace(/^REF\s*#?\s*(RTSS-LETTER-[\d\/]+-)?/i, '') || docData.documentNumber || '002'}</span></p>
                            </div>
                            <div className="text-right font-medium text-slate-800 font-mono">
                              <p>Miti / मिति: <span className="font-bold text-slate-900">{docData.documentDate || ''}</span></p>
                            </div>
                          </div>

                          {/* Salutation, Recipient Name / Company Name, Recipient Full Address */}
                          <div className="pt-2 text-xs space-y-1">
                            <p className="font-bold text-slate-900">{docData.salutation || 'To,'}</p>
                            {docData.recipient?.name && (
                              <div className="text-xs sm:text-sm font-bold text-slate-900 whitespace-pre-wrap leading-relaxed">{docData.recipient.name}</div>
                            )}
                            {docData.recipient?.address && (
                              <p className="text-slate-700 italic">{docData.recipient.address}</p>
                            )}
                          </div>

                          {/* Center aligned: Subject / Theme of Communication */}
                          {(docData.subject || docData.title) && (
                            <div className="pt-3 text-center">
                              <h2 className="inline-block border-b-2 border-[#002D62] pb-1 font-extrabold text-sm uppercase tracking-wide text-[#002D62]">
                                Subject / विषय: {docData.subject || docData.title}
                              </h2>
                            </div>
                          )}

                          {/* Text Justified: Letter Body */}
                          <div className="pt-4 text-xs leading-relaxed text-justify text-slate-900 font-normal whitespace-pre-wrap">
                            {docData.bodyText}
                          </div>

                          {/* Little gap (2 or 3 times enter), Right aligned: Signee Name and Designation ONLY */}
                          <div className="pt-16 flex justify-end items-end text-xs">
                            <div className="text-right space-y-1 min-w-[200px]">
                              <p className="font-bold text-sm text-slate-900">
                                {docData.signeeName || docData.preparedBy || docData.approvedBy?.replace(/\(.*?\)/g, '').trim() || currentProfile.name}
                              </p>
                              <p className="text-xs text-slate-700 font-medium">
                                {docData.signeeRole || 'Authorized Representative'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 py-2 text-xs text-slate-800">
                          
                          {/* DOCUMENT META HEADER CARD (EXCLUDING DAILY CLOSING WHICH HAS ITS OWN PRECISE SPEC HEADER) */}
                          {docData.documentType !== 'Daily Closing' && (
                            <div className="flex justify-between items-start bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-mono">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Record</p>
                                <h2 className="text-sm font-black text-slate-900 uppercase font-sans tracking-tight">
                                  {docData.title || docData.documentType || 'Official Statement'}
                                </h2>
                                {docData.subject && (
                                  <p className="text-xs text-indigo-700 font-bold font-sans mt-0.5">Re: {docData.subject}</p>
                                )}
                              </div>
                              <div className="text-right space-y-1">
                                {docData.documentNumber && (
                                  <p className="text-xs font-bold text-slate-900">
                                    Ref #: <span className="text-indigo-600">{docData.documentNumber}</span>
                                  </p>
                                )}
                                {docData.documentDate && (
                                  <p className="text-[11px] text-slate-600">Date: {docData.documentDate}</p>
                                )}
                                {docData.status && docData.documentType !== 'Invoice' && docData.documentType !== 'Receipt' && (
                                  <span className="inline-block bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">
                                    {docData.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* RECIPIENT & SENDER BLOCKS (IF PROVIDED, EXCLUDING DAILY CLOSING) */}
                          {docData.documentType !== 'Daily Closing' && (docData.recipient || docData.sender) && (
                            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/60 p-3 rounded-lg border border-slate-200">
                              {docData.recipient && (
                                <div className="space-y-0.5">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">To / Recipient:</p>
                                  <p className="font-extrabold text-slate-900">{docData.recipient.name || 'N/A'}</p>
                                  {docData.recipient.address && <p className="text-slate-600 text-[11px]">{docData.recipient.address}</p>}
                                  {docData.recipient.phone && <p className="text-slate-600 text-[11px]">Phone: {docData.recipient.phone}</p>}
                                  {docData.recipient.pan && <p className="text-slate-600 text-[11px]">PAN: {docData.recipient.pan}</p>}
                                </div>
                              )}
                              {docData.sender && (
                                <div className="space-y-0.5 text-right">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">From / Organization:</p>
                                  <p className="font-extrabold text-slate-900">{docData.sender.name || currentProfile.name}</p>
                                  {docData.sender.address && <p className="text-slate-600 text-[11px]">{docData.sender.address}</p>}
                                  {docData.sender.phone && <p className="text-slate-600 text-[11px]">Phone: {docData.sender.phone}</p>}
                                </div>
                              )}
                            </div>
                          )}

                          {/* SUMMARY METRICS BADGES / SUMMARY CARDS (IF PROVIDED, EXCLUDING DAILY CLOSING) */}
                          {docData.documentType !== 'Daily Closing' && docData.summaryMetrics && docData.summaryMetrics.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 my-2 font-mono text-[11px]">
                              {docData.summaryMetrics.map((sm, idx) => (
                                <div key={idx} className={`p-2 rounded-lg border ${sm.highlight ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                                  <span className="text-[9px] uppercase text-slate-500 font-bold block tracking-wider">{sm.label}</span>
                                  <span className="text-xs font-black block mt-0.5">{typeof sm.value === 'number' ? `Rs. ${sm.value.toLocaleString()}` : sm.value}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* BODY TEXT / PARAGRAPHS */}
                          {docData.bodyText && (
                            <div className="text-xs text-slate-800 leading-relaxed space-y-2 whitespace-pre-wrap py-1">
                              {docData.bodyText}
                            </div>
                          )}

                          {docData.documentType === 'Daily Closing' ? (
                            /* EXACT 4-SECTION DAILY CLOSING STATEMENT (NO LOW STOCK, PERFECT FIT) */
                            <div className="w-full pt-1 font-sans">
                              <DailyClosingStatementView
                                data={
                                  docData.dailyClosingData || {
                                    date: docData.documentDate || '2083/02/24',
                                    voucherNumber: docData.documentNumber || `DCR-${Date.now().toString().slice(-6)}`,
                                    status: docData.status || 'Approved',
                                    preparedBy: docData.preparedBy || 'Staff Cashier',
                                    preparedByDesignation: 'Cashier / Accountant',
                                    approvedBy: docData.approvedBy || docData.signeeName || 'Managing Director',
                                    approvedByDesignation: docData.signeeRole || 'Executive Director / Auditor',
                                    section1: {
                                      channels: [
                                        { channel: 'Cash in Counter', opening: 0, inflow: docData.subtotal ?? (docData.grandTotal ?? 0), outflow: 0, subtotal: docData.subtotal ?? (docData.grandTotal ?? 0) },
                                        { channel: 'Rastriya Banijya Bank(RBB)', opening: 0, inflow: 0, outflow: 0, subtotal: 0 },
                                        { channel: 'eSewa Wallet', opening: 0, inflow: 0, outflow: 0, subtotal: 0 },
                                        { channel: 'Sahakari (Cooperative)', opening: 0, inflow: 0, outflow: 0, subtotal: 0 },
                                      ],
                                      totals: {
                                        opening: 0,
                                        inflow: docData.subtotal ?? (docData.grandTotal ?? 0),
                                        outflow: 0,
                                        subtotal: docData.subtotal ?? (docData.grandTotal ?? 0)
                                      }
                                    },
                                    section2: {
                                      deposits: [],
                                      finalBalances: [
                                        { accountName: 'Cash in Counter', subtotal: docData.subtotal ?? (docData.grandTotal ?? 0), depositAdjustLabel: 'Minus (-)', depositAdjustAmount: 0, finalClosing: docData.grandTotal ?? (docData.subtotal ?? 0) },
                                        { accountName: 'Rastriya Banijya Bank(RBB)', subtotal: 0, depositAdjustLabel: 'Plus (+)', depositAdjustAmount: 0, finalClosing: 0 },
                                        { accountName: 'eSewa Wallet', subtotal: 0, depositAdjustLabel: 'No Change', depositAdjustAmount: 0, finalClosing: 0 },
                                        { accountName: 'Sahakari (Cooperative)', subtotal: 0, depositAdjustLabel: 'Plus (+)', depositAdjustAmount: 0, finalClosing: 0 },
                                      ],
                                      totalClosingFunds: {
                                        subtotal: docData.subtotal ?? (docData.grandTotal ?? 0),
                                        finalClosing: docData.grandTotal ?? (docData.subtotal ?? 0)
                                      }
                                    },
                                    section3: {
                                      denominations: { 1000: 0, 500: 0, 250: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, coins: 0 },
                                      amounts: { 1000: 0, 500: 0, 250: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, coins: 0 },
                                      totalPhysicalCounted: docData.grandTotal ?? (docData.subtotal ?? 0),
                                      expectedFinalCounterCash: docData.grandTotal ?? (docData.subtotal ?? 0),
                                      variance: 0
                                    },
                                    section4: {
                                      remarks: docData.notes || 'All daytime sales, payment channels, operating expenses, and accounts balanced with system records.',
                                      submittedBy: {
                                        name: docData.preparedBy || 'Staff Cashier',
                                        designation: 'Cashier / Accountant',
                                        signatureNote: '(rtss system verified and digitally signed)'
                                      },
                                      approvedBy: {
                                        name: docData.approvedBy || docData.signeeName || 'Managing Director',
                                        designation: docData.signeeRole || 'Executive Director / Auditor',
                                        signatureNote: '(rtss system verified and digitally signed)'
                                      }
                                    }
                                  }
                                }
                                profile={currentProfile}
                                showHeader={false}
                              />
                            </div>
                          ) : (
                            <>
                              {docData.bodyHtml && (
                                <div className="py-1">
                                  {docData.bodyHtml}
                                </div>
                              )}

                              {/* LINE ITEMS TABLE (IF PROVIDED) */}
                              {docData.items && docData.items.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="border-b-2 border-slate-900 bg-slate-100">
                                        <th className="py-2 px-2.5 font-bold text-slate-700 w-10 text-center">S.N.</th>
                                        <th className="py-2 px-2.5 font-bold text-slate-700">Item Description</th>
                                        <th className="py-2 px-2.5 font-bold text-slate-700 text-center w-20">Qty</th>
                                        <th className="py-2 px-2.5 font-bold text-slate-700 text-right w-24">Rate (Rs.)</th>
                                        <th className="py-2 px-2.5 font-bold text-slate-700 text-right w-28">Amount (Rs.)</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                      {docData.items.map((it, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                          <td className="py-2 px-2.5 text-center text-slate-500 font-mono text-[11px]">
                                            {it.sn || idx + 1}
                                          </td>
                                          <td className="py-2 px-2.5 font-bold text-slate-900">
                                            {it.name}
                                            {it.description && <p className="text-[10px] text-slate-500 font-normal">{it.description}</p>}
                                          </td>
                                          <td className="py-2 px-2.5 text-center font-mono font-semibold">
                                            {it.quantity ?? 1} {it.unitType || ''}
                                          </td>
                                          <td className="py-2 px-2.5 text-right font-mono">
                                            {it.unitPrice !== undefined ? Number(it.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                                          </td>
                                          <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                                            {it.totalPrice !== undefined ? Number(it.totalPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {/* TOTALS & SUMMARY METRICS */}
                              {(docData.grandTotal !== undefined || docData.subtotal !== undefined || docData.summaryMetrics) && (
                                <div className="flex justify-between items-start pt-2 border-t border-slate-200">
                                  <div className="space-y-1 max-w-[60%]">
                                    {(docData.amountInWords || docData.grandTotal !== undefined || docData.subtotal !== undefined) && (
                                      <p className="text-[11px] font-medium text-slate-800 italic">
                                        <span className="font-bold text-slate-900 uppercase text-[10px] not-italic block font-mono">Amount In Words:</span>
                                        {docData.amountInWords || numberToWords(docData.grandTotal ?? docData.subtotal ?? 0)}
                                      </p>
                                    )}
                                    {docData.notes && (
                                      <p className="text-[10px] text-slate-500 mt-1">
                                        <strong>Notes:</strong> {docData.notes}
                                      </p>
                                    )}
                                  </div>

                                  <div className="w-56 space-y-1.5 text-xs font-mono">
                                    {docData.subtotal !== undefined && (
                                      <div className="flex justify-between text-slate-600">
                                        <span>Subtotal:</span>
                                        <span>Rs. {Number(docData.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                      </div>
                                    )}
                                    {docData.discountAmount !== undefined && docData.discountAmount > 0 && (
                                      <div className="flex justify-between text-emerald-700">
                                        <span>Discount:</span>
                                        <span>- Rs. {Number(docData.discountAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                      </div>
                                    )}
                                    {docData.taxAmount !== undefined && docData.taxAmount > 0 && (
                                      <div className="flex justify-between text-slate-600">
                                        <span>VAT (13%):</span>
                                        <span>Rs. {Number(docData.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                      </div>
                                    )}
                                    {docData.grandTotal !== undefined && (
                                      <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t-2 border-slate-900">
                                        <span>Grand Total:</span>
                                        <span>Rs. {Number(docData.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* AUTHORIZATION SIGNATURE BLOCKS */}
                              <div className="pt-8 flex justify-between items-end text-center text-slate-600 font-sans">
                                <div className="w-36">
                                  <div className="border-b border-slate-400 h-8"></div>
                                  <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">
                                    {(docData.documentType === 'Invoice' || docData.title?.toUpperCase().includes('INVOICE'))
                                      ? 'Recipient Signature'
                                      : (docData.preparedBy ? `${docData.preparedBy}` : 'Prepared By')}
                                  </p>
                                </div>
                                <div className="w-44">
                                  <p className="text-[10px] font-extrabold text-indigo-700 uppercase font-mono tracking-wider mb-0.5">
                                    Reliabletech Verified
                                  </p>
                                  <div className="border-b-2 border-slate-900 h-7 text-[10px] font-bold text-slate-800 flex items-center justify-center">
                                    {docData.signeeName || docData.approvedBy?.replace(/\(.*?\)/g, '').trim() || currentProfile.name}
                                  </div>
                                  <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">
                                    {docData.signeeRole || 'Authorized Signature'}
                                  </p>
                                </div>
                              </div>
                            </>
                          )}

                        </div>
                      )}
                    </CorporateLetterhead>
                  );
                };

                if (effectivePagesPerSheet <= 1) {
                  return renderSingleDocumentContent(1);
                }

                const gridCols = effectivePagesPerSheet <= 2 
                  ? (orientation === 'landscape' ? 2 : 1) 
                  : Math.min(4, Math.ceil(Math.sqrt(effectivePagesPerSheet)));

                return (
                  <div 
                    className="w-full h-full p-2 bg-slate-100/80 grid gap-2 overflow-auto"
                    style={{
                      gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                      boxSizing: 'border-box'
                    }}
                  >
                    {Array.from({ length: effectivePagesPerSheet }).map((_, idx) => (
                      <div 
                        key={idx}
                        className="bg-white border border-slate-300 rounded shadow-sm relative flex flex-col justify-between overflow-hidden p-1 min-h-0 text-[0.88em]"
                      >
                        <div className="absolute top-1 right-1 z-30 bg-indigo-950 text-indigo-200 border border-indigo-700/60 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs print:hidden">
                          Page {idx + 1} / {effectivePagesPerSheet}
                        </div>
                        <div className="w-full h-full overflow-hidden flex flex-col justify-between">
                          {renderSingleDocumentContent(idx + 1)}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
