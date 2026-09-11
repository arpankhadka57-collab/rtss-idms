import { BusinessProfile, SystemReportAttachment, EmailFileAttachment } from '../types';

export interface LetterpadEmailOptions {
  recipientName?: string;
  recipientEmail: string;
  subject: string;
  message: string;
  bsDate?: string;
  refNo?: string;
  systemReports?: SystemReportAttachment[];
  fileAttachments?: EmailFileAttachment[];
  profile?: BusinessProfile;
  senderTitle?: string;
}

/**
 * Generates an official, beautifully rendered HTML email in RTSS Corporate Letterhead stationery.
 */
export function generateLetterpadEmailHtml({
  recipientName,
  recipientEmail,
  subject,
  message,
  bsDate,
  refNo,
  systemReports = [],
  fileAttachments = [],
  profile,
  senderTitle = 'RTSS Administrative Department'
}: LetterpadEmailOptions): string {
  const companyNameEn = profile?.name || 'RELIABLETECH SERVICES & SUPPLIERS';
  const companyNameNp = profile?.companyNameNepali || 'रिलायबलटेक सर्भिसेज एण्ड सप्लायर्स';
  const subtitle = profile?.companySubtitle || 'Complete IT, Networking, Hardware & Security Solutions';
  const location = profile?.location || 'Fikkal-10, Suryodaya Municipality, Ilam, Nepal';
  const pan = profile?.panNumber || '302819405';
  const phone = profile?.phone || '+977-9852681554 / 027-540123';
  const email = profile?.email || 'reliabletechss.fikkal@gmail.com';
  const tagline = 'Solutions You Can Count On, Services You can Trust.';

  const dispatchRef = refNo || `RTSS/DISP/${Date.now().toString().slice(-6)}`;
  const dateFormatted = bsDate ? `${bsDate} BS (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} AD)` : new Date().toLocaleDateString();

  // Ensure closing never displays generic (User), but instead displays the user's specific designation
  const displaySenderTitle = (senderTitle || 'RTSS Administrative Department')
    .replace(/\(User\)/gi, '(Technical Staff / Officer)')
    .replace(/\bUser\b/g, 'Staff Officer');

  // Escape HTML characters in user message
  const formattedMessage = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n\n/g, '</p><p style="margin: 0 0 14px 0; line-height: 1.7; color: #1e293b; font-size: 14.5px;">')
    .replace(/\n/g, '<br/>');

  // Attached System Reports HTML
  let reportsHtml = '';
  if (systemReports && systemReports.length > 0) {
    reportsHtml = `
      <div style="margin: 24px 0; padding: 18px; background: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: 12px;">
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 11px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">
            Attached System Reports &amp; Verified Invoices (Generated as Full Detailed PDF)
          </span>
        </div>
        ${systemReports
          .map(
            (rep) => `
          <div style="padding: 12px 14px; margin-bottom: 10px; background: #ffffff; border: 1px solid #e0f2fe; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <span style="font-size: 10px; font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">
                  ${rep.category || 'Official Document'}
                </span>
                <h4 style="margin: 6px 0 3px 0; font-size: 14px; font-weight: 700; color: #0f172a;">
                  ${rep.title}
                </h4>
                <p style="margin: 0; font-size: 12px; color: #64748b;">
                  Ref / Bill No: <strong style="color: #334155;">${rep.referenceNo || 'N/A'}</strong> | Date: <strong>${rep.reportDate || ''}</strong>
                </p>
              </div>
              ${
                rep.amount !== undefined
                  ? `
                <div style="text-align: right;">
                  <span style="font-size: 13px; font-weight: 800; color: #059669; font-family: monospace;">
                    NPR ${Number(rep.amount).toLocaleString('en-IN')}
                  </span>
                </div>
              `
                  : ''
              }
            </div>
            ${
              rep.summary
                ? `
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #475569; font-style: italic; background: #f8fafc; padding: 6px 10px; border-radius: 6px;">
                ${rep.summary}
              </p>
            `
                : ''
            }
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #e2e8f0; font-size: 11px; color: #0284c7; font-weight: 600;">
              📄 Attached as downloadable high-resolution PDF document.
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  // Attached Files HTML
  let filesHtml = '';
  if (fileAttachments && fileAttachments.length > 0) {
    filesHtml = `
      <div style="margin: 20px 0; padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
        <span style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">
          Attached Files (${fileAttachments.length})
        </span>
        <ul style="margin: 0; padding-left: 20px; font-size: 12.5px; color: #334155;">
          ${fileAttachments
            .map(
              (f) => `
            <li style="margin-bottom: 4px;">
              <strong>${f.name}</strong> <span style="color: #94a3b8; font-size: 11px;">(${Math.round(f.size / 1024)} KB)</span>
            </li>
          `
            )
            .join('')}
        </ul>
      </div>
    `;
  }

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
  </head>
  <body style="margin: 0; padding: 16px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">

      <!-- TOP CORPORATE ACCENT BARS (Matching Corporate Letterhead) -->
      <div style="height: 5px; background-color: #b91c1c; width: 100%;"></div>
      <div style="height: 3px; background-color: #0284c7; width: 100%;"></div>

      <!-- LETTERHEAD HEADER -->
      <div style="padding: 26px 32px 18px 32px; border-bottom: 2px solid #e2e8f0; background: #ffffff; text-align: center;">
        
        <!-- BILINGUAL COMPANY NAME -->
        <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; text-transform: uppercase;">
          ${companyNameEn}
        </h1>
        <h2 style="margin: 2px 0 6px 0; font-size: 15px; font-weight: 700; color: #b91c1c;">
          ${companyNameNp}
        </h2>
        <p style="margin: 0 0 6px 0; font-size: 12px; color: #475569; font-weight: 500;">
          ${subtitle}
        </p>

        <!-- ADDRESS & REGISTRATION BAR -->
        <div style="font-size: 11.5px; color: #64748b; margin-top: 6px; padding-top: 6px; border-top: 1px solid #f1f5f9;">
          <span>${location}</span>
          <span style="margin: 0 6px; color: #cbd5e1;">•</span>
          <span style="font-weight: 700; color: #0284c7;">PAN: ${pan}</span>
        </div>

        <div style="font-size: 11px; color: #64748b; margin-top: 3px;">
          <span>Phone: <strong>${phone}</strong></span>
          <span style="margin: 0 6px; color: #cbd5e1;">•</span>
          <span>Email: <strong>${email}</strong></span>
        </div>
      </div>

      <!-- DISPATCH REFERENCE & DATE BAR -->
      <div style="padding: 10px 32px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11.5px; color: #475569;">
        <div>
          <span style="color: #64748b;">Ref No / Dispatch:</span>
          <strong style="color: #0f172a; font-family: monospace;">${dispatchRef}</strong>
        </div>
        <div style="text-align: right;">
          <span style="color: #64748b;">Date:</span>
          <strong style="color: #0f172a;">${dateFormatted}</strong>
        </div>
      </div>

      <!-- LETTERHEAD BODY -->
      <div style="padding: 28px 32px 32px 32px; background: #ffffff;">

        <!-- RECIPIENT SALUTATION -->
        <div style="margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px dashed #e2e8f0;">
          <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #0f172a;">
            To: ${recipientName || recipientEmail}
          </p>
          <p style="margin: 0; font-size: 12px; color: #64748b;">
            &lt;${recipientEmail}&gt;
          </p>
        </div>

        <!-- SUBJECT BANNER -->
        <div style="margin-bottom: 22px; padding: 12px 16px; background-color: #f8fafc; border-left: 4px solid #0284c7; border-radius: 0 8px 8px 0;">
          <span style="font-size: 11px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 2px;">
            Subject / विषय:
          </span>
          <h3 style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a; line-height: 1.4;">
            ${subject}
          </h3>
        </div>

        <!-- OFFICIAL MESSAGE CONTENT -->
        <div style="margin-bottom: 24px;">
          <p style="margin: 0 0 14px 0; line-height: 1.7; color: #1e293b; font-size: 14.5px;">
            ${formattedMessage}
          </p>
        </div>

        <!-- ATTACHED SYSTEM REPORTS / INVOICES (PDFs) -->
        ${reportsHtml}

        <!-- ATTACHED FILES -->
        ${filesHtml}

        <!-- OFFICIAL SIGNATORY / CLOSING -->
        <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b;">Sincerely,</p>
            <p style="margin: 0; font-size: 15px; font-weight: 800; color: #0284c7;">
              ${companyNameEn}
            </p>
            <p style="margin: 2px 0 0 0; font-size: 12px; color: #475569; font-weight: 600;">
              ${displaySenderTitle}
            </p>
          </div>

          <!-- OFFICIAL SEAL EMBLEM -->
          <div style="text-align: center; border: 1.5px solid #0284c7; border-radius: 8px; padding: 6px 14px; background: #f0f9ff;">
            <span style="font-size: 9px; font-weight: 800; color: #0369a1; text-transform: uppercase; display: block;">Official System Verified</span>
            <span style="font-size: 11px; font-weight: 900; color: #0284c7; letter-spacing: 1px;">★ RTSS SEAL ★</span>
            <span style="font-size: 8.5px; color: #64748b; display: block;">Fikkal, Ilam</span>
          </div>
        </div>

      </div>

      <!-- OFFICIAL FOOTER (Matching Corporate Letterhead) -->
      <div style="padding: 16px 32px; background-color: #f8fafc; border-top: 2px solid #e2e8f0; text-align: center;">
        <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #0f172a; font-style: italic;">
          "${tagline}"
        </p>
        <p style="margin: 0; font-size: 10.5px; color: #94a3b8;">
          This official communication was generated by the ReliableTech Official Management System. 
          Confidential and intended solely for the recipient.
        </p>
      </div>

    </div>
  </body>
  </html>
  `;
}
