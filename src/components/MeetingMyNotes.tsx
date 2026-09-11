import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Plus, 
  Search, 
  Printer, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  FileText, 
  Clock, 
  ShieldAlert, 
  ChevronRight, 
  UserCheck, 
  Globe,
  Languages,
  UserPlus,
  Play,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Send,
  Save,
  MapPin,
  Sparkles,
  Award,
  BookOpen,
  Mail,
  ChevronDown,
  DollarSign,
  Paperclip,
  FileSpreadsheet,
  Image as ImageIcon
} from 'lucide-react';
import { MeetingNote, AppUser, AgendaItem, AttachedReport, BusinessProfile, BusinessLetter, ShareTransaction, Shareholder } from '../types';
import { MeetingShareTransactionModal } from './MeetingShareTransactionModal';
import { NepaliDatePicker } from './NepaliDatePicker';
import { InteractiveSearchBar } from './InteractiveSearchBar';
import { 
  getCurrentBsDate, 
  toNepaliDigits, 
  getDayOfWeekNepali, 
  getDayOfWeekEnglish,
  formatNepaliStartTime,
  getNepaliMeetingEndingColophon,
  generateMeetingNumber,
  generateLetterDispatchNumber,
  getNepaleseFiscalYear
} from '../utils/nepaliDate';

export interface MeetingMinutePrintDocumentProps {
  activeMeeting: MeetingNote;
  profile?: BusinessProfile;
  users: AppUser[];
  currentUser: AppUser;
  isNepali?: boolean;
  onBack?: () => void;
  onPrintPreview?: () => void;
  onViewAttachmentDetails?: (report: AttachedReport, agendaTitle?: string) => void;
  hideActions?: boolean;
}

export const MeetingMinutePrintDocument: React.FC<MeetingMinutePrintDocumentProps> = ({
  activeMeeting,
  profile,
  users,
  isNepali = activeMeeting.language === 'Nepali',
  onBack,
  onPrintPreview,
  onViewAttachmentDetails,
  hideActions = false
}) => {
  const chairpersonUser = users.find(
    u => u.username === activeMeeting.chairperson || 
         u.name === activeMeeting.chairperson || 
         u.nameNepali === activeMeeting.chairperson
  );

  const companyTitle = isNepali 
    ? (profile?.companyNameNepali || profile?.name || 'सूर्योदय बहुउद्देश्यीय सहकारी संस्था लि.')
    : (profile?.name || 'ReliableTech');

  const companyAddress = isNepali
    ? (profile?.addressNepali || profile?.location || 'सूर्योदय न.पा.-१०, फिक्कल बजार, इलाम')
    : (profile?.location || 'Fikkal Bazaar, Ilam, Nepal');

  // Nepali variables
  const dateBsNepali = toNepaliDigits(activeMeeting.meetingDate || '');
  const dayNepali = getDayOfWeekNepali(activeMeeting.meetingDate || '');
  const timeNepali = activeMeeting.startTime 
    ? formatNepaliStartTime(activeMeeting.startTime)
    : 'दिउँसो ११:०० बजे';
  const chairDesignationNepali = chairpersonUser?.designationNepali || chairpersonUser?.post || 'अध्यक्ष (प्रबन्ध निर्देशक)';
  const chairNameNepali = chairpersonUser?.nameNepali || chairpersonUser?.name || activeMeeting.chairperson;
  const meetingNumberNepali = toNepaliDigits(activeMeeting.meetingNumber || '');
  const venueNepali = activeMeeting.venue || profile?.addressNepali || 'सूर्योदय न.पा.-१०, फिक्कल बजार, इलाम';

  // English variables
  const dateBsEnglish = activeMeeting.meetingDate || '';
  const dayEnglish = getDayOfWeekEnglish(activeMeeting.meetingDate || '');
  const meetingNumberEnglish = activeMeeting.meetingNumber || '';
  const meetingTypeEnglish = activeMeeting.typeOfMeeting || 'Regular Board';
  const companyEnglish = profile?.name || 'ReliableTech';
  const venueEnglish = activeMeeting.venue || profile?.location || "Fikkal Bazaar, Ilam, Nepal";
  const chairDesignationEnglish = chairpersonUser?.post || 'Chairman';
  const chairNameEnglish = chairpersonUser?.name || activeMeeting.chairperson || '';

  // Attendance list
  const attendanceList: { name: string; post: string }[] = [];
  attendanceList.push({
    name: isNepali ? (chairpersonUser?.nameNepali || chairpersonUser?.name || activeMeeting.chairperson) : (chairpersonUser?.name || activeMeeting.chairperson),
    post: isNepali ? (chairpersonUser?.designationNepali || chairpersonUser?.post || 'अध्यक्ष (प्रबन्ध निर्देशक)') : (chairpersonUser?.post || 'Chairman')
  });

  (activeMeeting.participants || []).forEach(username => {
    const u = users.find(usr => usr.username === username);
    const pName = isNepali ? (u?.nameNepali || u?.name || username) : (u?.name || username);
    if (pName !== attendanceList[0].name) {
      attendanceList.push({
        name: pName,
        post: isNepali ? (u?.designationNepali || u?.post || 'पदाधिकारी / सदस्य') : (u?.post || 'Member')
      });
    }
  });

  (activeMeeting.externalParticipants || []).forEach(extName => {
    if (extName && extName.trim()) {
      attendanceList.push({
        name: extName.trim(),
        post: isNepali ? 'आमन्त्रित अतिथि (Guest)' : 'Invited Guest'
      });
    }
  });

  return (
    <div className="bg-white border border-slate-300 rounded-2xl p-6 sm:p-8 shadow-xl max-w-4xl mx-auto space-y-6 text-slate-900 font-serif" id="po-print-area" data-printable="true">
      {!hideActions && (
        <div className="flex justify-between items-center border-b pb-4 print:hidden">
          {onBack ? (
            <button
              onClick={onBack}
              className="text-xs font-sans font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              ← Back to Meeting Registry
            </button>
          ) : <div />}
          {onPrintPreview ? (
            <button
              onClick={onPrintPreview}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer"
            >
              <Printer size={15} />
              <span>Print Formal Minute Copy</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 font-sans text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs">
              <Eye size={14} className="text-emerald-600" />
              <span>📄 बैठक माइन्युट (Participant View Form)</span>
            </span>
          )}
        </div>
      )}

      {/* Header section */}
      <div className="text-center space-y-1.5 border-b pb-4">
        {profile?.logoUrl && (
          <img src={profile.logoUrl} alt="Company Logo" className="h-16 w-auto mx-auto mb-2 object-contain" />
        )}
        <h2 className="text-base sm:text-lg font-bold text-indigo-950 pt-2 underline decoration-2 underline-offset-4">
          {isNepali ? 'बैठकको माइन्युट तथा निर्णय पुस्तिका' : 'Meeting Minutes & Resolutions Record'}
        </h2>
      </div>

      {/* Introductory Preamble Paragraph */}
      <div className="text-xs sm:text-sm leading-relaxed text-justify px-2 py-1 font-serif text-slate-800">
        {isNepali ? (
          <p>
            आज मिति <span className="font-bold">{dateBsNepali}</span> गते, <span className="font-bold">{dayNepali}</span>का दिन <span className="font-bold">{timeNepali}</span> यस <span className="font-bold">{companyTitle}</span> को <span className="font-bold">{chairDesignationNepali}</span> <span className="font-bold">{chairNameNepali}</span> ज्यूको गरिमामय अध्यक्षतामा <span className="font-bold">{meetingNumberNepali}</span> बैठक देहायबमोजिमका पदाधिकारी तथा सदस्यज्यूहरूको गरिमामय उपस्थितिका बीच संस्थाको <span className="font-bold">{venueNepali}</span> मा सफलतापूर्वक सम्पन्न भयो।
          </p>
        ) : (
          <p>
            Today, on <span className="font-bold">{dateBsEnglish}</span> B.S. (<span className="font-bold">{dayEnglish}</span>), the <span className="font-bold">{meetingNumberEnglish}</span> ({meetingTypeEnglish}) of <span className="font-bold">{companyEnglish}</span> was successfully concluded at the company's <span className="font-bold">{venueEnglish}</span>, under the distinguished chairmanship of the <span className="font-bold">{chairDesignationEnglish}</span>, <span className="font-bold">{chairNameEnglish}</span>, and in the esteemed presence of the following officials and board members.
          </p>
        )}
      </div>

      {/* Attendance & Signature Section */}
      <div className="space-y-3 pt-2">
        <h3 className="font-sans font-bold text-xs uppercase text-slate-900 border-b pb-1">
          {isNepali ? 'उपस्थिति तथा हस्ताक्षर (Attendance & Signatures)' : 'Attendance & Signatures'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-300 font-sans">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-2.5 border-r border-slate-300 w-12 text-center">{isNepali ? 'क्र.सं.' : 'S.N.'}</th>
                <th className="p-2.5 border-r border-slate-300">{isNepali ? 'नाम (Name)' : 'Name'}</th>
                <th className="p-2.5 border-r border-slate-300">{isNepali ? 'पद (Designation)' : 'Designation'}</th>
                <th className="p-2.5 w-44 text-center">{isNepali ? 'हस्ताक्षर (Signature)' : 'Signature'}</th>
              </tr>
            </thead>
            <tbody>
              {attendanceList.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50/50">
                  <td className="p-2.5 border-r border-slate-300 text-center font-mono font-semibold">
                    {isNepali ? toNepaliDigits(idx + 1) : idx + 1}
                  </td>
                  <td className="p-2.5 border-r border-slate-300 font-bold text-slate-800">
                    {row.name}
                  </td>
                  <td className="p-2.5 border-r border-slate-300 text-slate-600">
                    {row.post}
                  </td>
                  <td className="p-2.5 text-center">
                    <div className="flex flex-col items-center justify-center py-0.5">
                      <span className="inline-block text-[10px] text-emerald-900 font-bold font-sans bg-emerald-50 border border-emerald-300 px-2 py-1 rounded-md text-center leading-tight shadow-2xs">
                        ✓ {isNepali ? 'RTSS प्रणाली मार्फत डिजिटल रूपमा हस्ताक्षर गरिएको' : 'Digitally signed through RTSS system'}
                        <span className="block text-[8px] text-emerald-700 font-mono font-medium mt-0.5">
                          ({isNepali 
                            ? `मिति: ${dateBsNepali} | समय: ${timeNepali}`
                            : `Date: ${activeMeeting.meetingDate} | Time: ${activeMeeting.startTime || '11:00 AM'}`})
                        </span>
                        <span className="block text-[8px] text-emerald-900 font-sans font-bold mt-0.5">
                          ({row.name})
                        </span>
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agendas & Decisions Section */}
      <div className="space-y-4 pt-4">
        <h3 className="font-sans font-bold text-xs uppercase text-slate-900 border-b pb-1">
          {isNepali ? 'प्रस्ताव तथा निर्णयहरू (Agendas & Decisions)' : 'Agendas & Decisions'}
        </h3>
        {activeMeeting.agendas.map((ag, i) => (
          <div key={i} className="border border-slate-250 p-4 rounded-xl space-y-2.5 bg-slate-50/30">
            <p className="font-bold text-xs sm:text-sm text-slate-900">
              {isNepali ? `प्रस्ताव नं. ${toNepaliDigits(i + 1)}: ${ag.agenda}` : `Agenda #${i + 1}: ${ag.agenda}`}
            </p>

            {/* ATTACHED REPORT IN PRINTED MEETING MINUTE */}
            {ag.attachedReport && (
              <div className="p-3 bg-emerald-50/90 border border-emerald-300 rounded-lg text-xs font-sans text-emerald-950 space-y-1.5 my-1.5">
                <div className="font-bold text-xs text-emerald-900 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>📎 प्रस्तुत/छलफल गरिएको संलग्न प्रतिवेदन (Attached Report Discussed):</span>
                    <span className="bg-emerald-200 px-2 py-0.5 rounded text-[10px] font-mono uppercase">{ag.attachedReport.category}</span>
                  </div>
                  <div className="flex items-center gap-2 print:hidden">
                    {onViewAttachmentDetails && (
                      <button
                        type="button"
                        onClick={() => onViewAttachmentDetails(ag.attachedReport!, ag.agenda)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold px-2.5 py-1 rounded-lg shadow-2xs transition cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <Eye size={13} />
                        <span>View Attachment Details (विवरण हेर्नुहोस्)</span>
                      </button>
                    )}
                    {ag.attachedReport.fileUrl && (
                      <a 
                        href={ag.attachedReport.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-700 hover:underline font-bold text-[11px]"
                      >
                        👁️ View File
                      </a>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                  <div><strong>प्रतिवेदन/बिल शीर्षक:</strong> {ag.attachedReport.title}</div>
                  <div><strong>प्रतिवेदन मिति:</strong> {ag.attachedReport.reportDate}</div>
                  {ag.attachedReport.referenceNo && <div><strong>सन्दर्भ/बिल नं.:</strong> {ag.attachedReport.referenceNo}</div>}
                  {ag.attachedReport.amount !== undefined && <div><strong>संलग्न कुल रकम:</strong> रु. {ag.attachedReport.amount.toLocaleString()}</div>}
                  {ag.attachedReport.fileName && <div><strong>फाइल:</strong> {ag.attachedReport.fileName}</div>}
                </div>
                {ag.attachedReport.summary && (
                  <div className="text-[11px] text-emerald-900 font-sans border-t border-emerald-200/80 pt-1 mt-1">
                    <strong>प्रतिवेदन सारांश/विवरण:</strong> {ag.attachedReport.summary}
                  </div>
                )}

                {/* EMBEDDED ATTACHED PRINTABLE DOCUMENT / IMAGE */}
                {ag.attachedReport.fileUrl && (
                  <div className="mt-2 pt-2 border-t border-emerald-200/80 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-950">
                      <span>📄 संलग्न दस्ताबेज / तस्बिर (Attached Printable Document / Image):</span>
                      <span className="text-[10px] text-slate-500 font-mono print:hidden">
                        {ag.attachedReport.fileName || 'Attached File'}
                      </span>
                    </div>

                    {(ag.attachedReport.fileType?.startsWith('image/') || 
                      ag.attachedReport.fileUrl.startsWith('data:image/') || 
                      /\.(jpg|jpeg|png|webp)$/i.test(ag.attachedReport.fileName || '')) ? (
                      <div className="bg-white p-2 rounded-xl border border-emerald-300 shadow-2xs flex justify-center">
                        <img 
                          src={ag.attachedReport.fileUrl} 
                          alt={ag.attachedReport.title || 'Attached Image Document'} 
                          className="max-h-72 sm:max-h-96 w-auto object-contain rounded-lg border border-slate-200 print:max-h-[500px]"
                        />
                      </div>
                    ) : (
                      <div className="bg-slate-100 p-2 rounded-xl border border-emerald-300 space-y-1.5">
                        <iframe 
                          src={ag.attachedReport.fileUrl} 
                          className="w-full h-72 sm:h-80 rounded-lg border border-slate-300 print:h-[500px]" 
                          title={ag.attachedReport.title || 'Attached PDF Document'}
                        />
                        <div className="text-right print:hidden">
                          <a
                            href={ag.attachedReport.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 underline"
                          >
                            <span>↗️ Open PDF in New Window / Full Screen</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="pl-4 border-l-2 border-indigo-600 text-xs sm:text-sm text-slate-800 font-serif">
              <p className="font-semibold text-indigo-950 font-sans text-xs">
                {isNepali ? 'निर्णय:' : 'Decision / Resolution:'}
              </p>
              <p className="pt-0.5">{ag.decision || (isNepali ? 'सर्वसम्मतिबाट निर्णय गरियो।' : 'Unanimously decided.')}</p>
            </div>
          </div>
        ))}

        {/* Share Transactions Block in Formal Document */}
        {activeMeeting.shareTransactions && activeMeeting.shareTransactions.length > 0 && (
          <div className="border border-slate-300 p-4 rounded-xl space-y-3 bg-slate-50 font-sans">
            <h4 className="font-bold text-xs uppercase text-slate-900 border-b pb-1">
              {isNepali ? 'सेयरधनी तथा सेयर कारोबार विवरण (Shareholder & Share Transactions Record)' : 'Shareholder & Share Transactions Record'}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-300 bg-white">
                <thead>
                  <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300 text-center">S.N.</th>
                    <th className="p-2 border-r border-slate-300">Shareholder Name</th>
                    <th className="p-2 border-r border-slate-300">Address / Cit. No</th>
                    <th className="p-2 border-r border-slate-300">Type</th>
                    <th className="p-2 border-r border-slate-300 text-right">Paid Amount</th>
                    <th className="p-2 border-r border-slate-300 text-right">Remaining Balance</th>
                    <th className="p-2 border-r border-slate-300">Payment Basket</th>
                    <th className="p-2">Ref ID</th>
                  </tr>
                </thead>
                <tbody>
                  {activeMeeting.shareTransactions.map((tx, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="p-2 border-r border-slate-300 text-center font-mono font-bold">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-300 font-bold text-slate-900">{tx.shareholderName}</td>
                      <td className="p-2 border-r border-slate-300 text-slate-600">{tx.address} ({tx.citizenshipNumber || '-'})</td>
                      <td className="p-2 border-r border-slate-300 font-bold">
                        {tx.transactionType === 'Addition' ? (isNepali ? 'सेयर थप' : 'Addition') : (isNepali ? 'सेयर फिर्ता' : 'Return')}
                      </td>
                      <td className="p-2 border-r border-slate-300 text-right font-mono font-bold text-emerald-800">रु. {tx.paidAmount.toLocaleString()}</td>
                      <td className="p-2 border-r border-slate-300 text-right font-mono text-amber-800">
                        {tx.remainingBalance && tx.remainingBalance > 0 ? `रु. ${tx.remainingBalance.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-2 border-r border-slate-300 font-bold">{tx.paymentMethod}</td>
                      <td className="p-2 font-mono text-slate-600">{tx.transactionIdNo || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Formal Sign-off Signature Block */}
      <div className="pt-6 border-t border-slate-200">
        <div className="grid grid-cols-2 gap-6 font-sans text-xs">
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1.5 text-center">
            <p className="font-bold text-slate-800">{isNepali ? 'माइन्युट तयारकर्ता / सचिव' : 'Minute Writer / Secretary'}</p>
            <div className="text-[10px] text-emerald-900 bg-emerald-50 border border-emerald-300 p-2 rounded-lg font-mono font-medium">
              ✓ {isNepali ? 'RTSS प्रणाली मार्फत डिजिटल रूपमा हस्ताक्षर गरिएको' : 'Digitally signed through RTSS system'}
              <p className="text-[9px] text-emerald-700 font-sans mt-0.5">
                ({isNepali ? `मिति: ${dateBsNepali} | समय: ${timeNepali}` : `Date: ${activeMeeting.meetingDate} | Time: ${activeMeeting.startTime || '11:00 AM'}`})
              </p>
              <p className="text-[9px] text-emerald-900 font-sans font-bold mt-0.5">
                {isNepali ? `हस्ताक्षरकर्ता: ${activeMeeting.submittedBy || 'सचिव'}` : `Signed by: ${activeMeeting.submittedBy || 'Secretary'}`}
              </p>
            </div>
            <p className="text-[11px] text-slate-700 font-bold">{activeMeeting.submittedBy || 'सचिव'}</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1.5 text-center">
            <p className="font-bold text-slate-800">{isNepali ? 'अध्यक्ष / बैठक प्रमाणिकर्ता' : 'Chairperson / Approver'}</p>
            <div className="text-[10px] text-emerald-900 bg-emerald-50 border border-emerald-300 p-2 rounded-lg font-mono font-medium">
              ✓ {isNepali ? 'RTSS प्रणाली मार्फत डिजिटल रूपमा हस्ताक्षर गरिएको' : 'Digitally signed through RTSS system'}
              <p className="text-[9px] text-emerald-700 font-sans mt-0.5">
                ({isNepali ? `मिति: ${dateBsNepali} | समय: ${timeNepali}` : `Date: ${activeMeeting.meetingDate} | Time: ${activeMeeting.startTime || '11:00 AM'}`})
              </p>
              <p className="text-[9px] text-emerald-900 font-sans font-bold mt-0.5">
                {isNepali ? `हस्ताक्षरकर्ता: ${chairNameNepali || chairNameEnglish}` : `Signed by: ${chairNameEnglish}`}
              </p>
            </div>
            <p className="text-[11px] text-slate-700 font-bold">{chairNameNepali || chairNameEnglish} ({chairDesignationNepali || chairDesignationEnglish})</p>
          </div>
        </div>
      </div>

      {/* Footer Remarks / Ending Colophon */}
      <div className="pt-6 border-t text-[11px] text-slate-500 font-sans flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <span>{isNepali ? `माइन्युट दर्ता नं: ${activeMeeting.meetingNumber}` : `Minute Reg No: ${activeMeeting.meetingNumber}`}</span>
        <span className="font-serif font-bold text-slate-900 text-xs sm:text-sm">{isNepali ? getNepaliMeetingEndingColophon(activeMeeting.meetingDate) : 'End of Minutes Record'}</span>
      </div>
    </div>
  );
};

export interface MeetingInvitationPrintDocumentProps {
  activeMeeting: MeetingNote;
  profile?: BusinessProfile;
  users: AppUser[];
  currentUser: AppUser;
  invitationRecipients: string[];
  letters?: BusinessLetter[];
  periodicClosings?: any[];
  onBack?: () => void;
  onPrintPreview?: () => void;
  onSelectRecipientsComponent?: React.ReactNode;
  onRegisterLetterComponent?: React.ReactNode;
  onViewAttachmentDetails?: (report: AttachedReport, agendaTitle?: string) => void;
  hideActions?: boolean;
}

export const MeetingInvitationPrintDocument: React.FC<MeetingInvitationPrintDocumentProps> = ({
  activeMeeting,
  profile,
  users,
  invitationRecipients,
  letters = [],
  periodicClosings = [],
  onBack,
  onPrintPreview,
  onSelectRecipientsComponent,
  onRegisterLetterComponent,
  onViewAttachmentDetails,
  hideActions = false
}) => {
  const companyTitle = profile?.companyNameNepali || profile?.name || 'सूर्योदय बहुउद्देश्यीय सहकारी संस्था लि.';
  const companyAddress = profile?.addressNepali || profile?.location || 'सूर्योदय न.पा.-१०, फिक्कल बजार, इलाम';

  const recipientDetails = invitationRecipients.map(rKey => {
    const u = users.find(usr => usr.username === rKey || usr.name === rKey || usr.nameNepali === rKey);
    return {
      key: rKey,
      name: u ? (u.nameNepali || u.name) : rKey,
      post: u ? (u.designationNepali || u.post || 'पदाधिकारी / सदस्य') : 'आमन्त्रित अतिथि'
    };
  });

  const chairpersonUser = users.find(u => u.username === activeMeeting.chairperson || u.name === activeMeeting.chairperson || u.nameNepali === activeMeeting.chairperson);
  const chairpersonName = chairpersonUser ? (chairpersonUser.nameNepali || chairpersonUser.name) : (activeMeeting.submittedBy || activeMeeting.chairperson);
  const chairpersonPost = chairpersonUser ? (chairpersonUser.designationNepali || chairpersonUser.post || 'अध्यक्ष (प्रबन्ध निर्देशक)') : 'अध्यक्ष (प्रबन्ध निर्देशक)';

  const fiscalYear = getNepaleseFiscalYear(activeMeeting.meetingDate);
  const dispatchNo = generateLetterDispatchNumber(activeMeeting.meetingDate, letters, periodicClosings);
  const meetingDateBs = toNepaliDigits(activeMeeting.meetingDate);
  const dayNameNepali = getDayOfWeekNepali(activeMeeting.meetingDate);
  const timeFormatted = formatNepaliStartTime(activeMeeting.startTime || '11:00 AM');

  return (
    <div className="bg-white border border-slate-300 rounded-2xl p-6 sm:p-8 shadow-xl max-w-4xl mx-auto space-y-6 text-slate-900 font-serif" id="po-print-area" data-printable="true">
      {!hideActions && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4 print:hidden">
          {onBack ? (
            <button
              onClick={onBack}
              className="text-xs font-sans font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              ← Back to Meeting Registry
            </button>
          ) : <div />}

          {(!onPrintPreview && !onSelectRecipientsComponent && !onRegisterLetterComponent) ? (
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 font-sans text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs">
              <Mail size={14} className="text-emerald-600" />
              <span>📩 बैठक निमन्त्रणा पत्र (Participant View Form)</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {onSelectRecipientsComponent}
              {onRegisterLetterComponent}
              {onPrintPreview && (
                <button
                  onClick={onPrintPreview}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer active:scale-95"
                >
                  <Printer size={15} />
                  <span>Print Invitation Letter (पत्र छाप्नुहोस्)</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Office Letterhead Header */}
      <div className="border-b-2 border-slate-900 pb-3 space-y-3">
        <div className="grid grid-cols-12 items-center gap-2">
          {/* Logo on Left */}
          <div className="col-span-2 flex items-center justify-start">
            {profile?.logoUrl ? (
              <img 
                src={profile.logoUrl} 
                alt="Logo" 
                className="w-20 h-20 object-contain p-0.5 max-w-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 flex items-center justify-center bg-indigo-50 text-indigo-700 font-bold text-lg rounded-xl border border-indigo-100 font-sans">
                {companyTitle.substring(0, 2)}
              </div>
            )}
          </div>

          {/* Company Title, Address & Contacts Centered */}
          <div className="col-span-8 text-center px-2">
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-tight">
              {companyTitle}
            </h1>
            <p className="text-xs text-slate-700 font-sans font-semibold mt-0.5">
              {companyAddress}
            </p>
            {(profile?.phone || profile?.panNumber || profile?.estdYear) && (
              <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                {profile.phone && `फोन नं.: ${profile.phone}`}
                {profile.panNumber && ` | पान नं.: ${profile.panNumber}`}
                {profile.estdYear && ` | स्थापना: ${profile.estdYear}`}
              </p>
            )}
          </div>

          <div className="col-span-2 flex justify-end">
            <div className="text-right text-[10px] text-slate-400 font-mono hidden sm:block">
              RTSS System
            </div>
          </div>
        </div>

        {/* Ref / Dispatch on Left, Date on Right */}
        <div className="flex justify-between items-end text-xs font-sans font-bold text-slate-800 pt-2 border-t border-slate-200">
          <div className="space-y-0.5 font-mono">
            <p>प.सं. (Ref): <span className="text-slate-900">{fiscalYear}</span></p>
            <p>चलानी नं. (Dispatch No): <span className="text-slate-900">{dispatchNo}</span></p>
          </div>
          <div className="text-right font-mono space-y-0.5">
            <p>मिति (Date): <span className="text-slate-900">{meetingDateBs} B.S.</span></p>
            <p className="text-[10px] text-emerald-800 font-sans font-bold">RTSS डिजिटल निमन्त्रणा पत्र</p>
          </div>
        </div>
      </div>

      {/* Recipient Details Block */}
      <div className="text-xs sm:text-sm font-serif leading-relaxed text-left text-slate-900 pt-2 space-y-1">
        <p className="font-bold text-base text-slate-900">श्रीमान् / श्रीमती आमन्त्रित सदस्य तथा पदाधिकारीज्यूहरू:</p>
        
        {recipientDetails.length > 0 ? (
          <div className="space-y-1.5 pl-1 py-1 text-slate-900 text-xs sm:text-sm font-serif">
            {recipientDetails.map((r, idx) => (
              <div key={idx} className="block pt-0.5">
                <span className="font-bold">{toNepaliDigits(idx + 1)}.</span>
                <br />
                <span className="font-bold text-slate-900">श्री {r.name}</span>
                <br />
                <span className="text-slate-700 text-xs">({r.post})</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="block pt-0.5 text-xs sm:text-sm">
            <span className="font-bold">१.</span>
            <br />
            <span className="font-bold">श्री आमन्त्रित सदस्यहरू</span>
            <br />
            <span className="text-slate-700 text-xs">(पदाधिकारी / सदस्य)</span>
          </div>
        )}

        <p className="text-slate-900 font-bold pt-2">{companyTitle}</p>
        <p className="text-slate-700 text-xs">{companyAddress}</p>
      </div>

      {/* Subject - Center Aligned */}
      <div className="text-center py-2">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 underline decoration-2 underline-offset-4 inline-block px-4 py-1 bg-slate-50 rounded-lg border border-slate-200">
          विषय: बैठकमा उपस्थित भइदिनु हुन अनुरोध।
        </h2>
      </div>

      {/* Body */}
      <div className="text-xs sm:text-sm leading-relaxed text-justify space-y-4 text-slate-900 font-serif px-1">
        <p className="font-bold">महोदय / महोदया,</p>

        <p className="indent-8">
          प्रस्तुत विषयमा यस <span className="font-bold">{companyTitle}</span> को बैठकमा निम्न बमोजिमका प्रस्तावहरू माथि छलफल गर्नु पर्ने भएको हुँदा आफ्नै आर.टी.एस.एस. (RTSS) अनलाइन प्रणाली मार्फत उक्त बैठकमा यहाँहरूको गरिमामय उपस्थिति तथा महत्वपूर्ण सल्लाह-सुझावको लागि हार्दिक निमन्त्रणा गर्दछौँ।
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-sans text-xs space-y-2">
          <p className="font-bold text-slate-800 border-b pb-1 uppercase tracking-wider text-[11px]">
            बैठकको मिति, समय र स्थान:
          </p>
          <div className="space-y-1 text-slate-700 font-medium">
            <div><strong>मिति:</strong> {meetingDateBs} गते ({dayNameNepali})</div>
            <div><strong>समय:</strong> {timeFormatted} देखि</div>
            <div><strong>स्थान:</strong> {activeMeeting.venue || companyAddress}</div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-bold text-slate-900 font-sans text-xs uppercase tracking-wider border-b pb-1">
            छलफलका प्रस्तावहरू (Agendas):
          </p>
          <div className="space-y-1.5 pl-1">
            {activeMeeting.agendas.map((ag, i) => (
              <div key={i} className="block text-xs sm:text-sm">
                <span className="font-bold text-slate-800">{toNepaliDigits(i + 1)}.</span>{' '}
                <span className="text-slate-900 font-medium">{ag.agenda}</span>

                {ag.attachedReport && (
                  <div className="mt-1.5 ml-3 p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-lg text-xs font-sans text-emerald-900 space-y-1">
                    <div className="font-bold flex items-center justify-between text-emerald-950 flex-wrap gap-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>📎 संलग्न प्रतिवेदन (Attached Report):</span>
                        <span className="bg-emerald-200/80 px-1.5 py-0.5 rounded text-[10px] uppercase font-mono">{ag.attachedReport.category}</span>
                      </div>
                      <div className="flex items-center gap-2 print:hidden">
                        {onViewAttachmentDetails && (
                          <button
                            type="button"
                            onClick={() => onViewAttachmentDetails(ag.attachedReport!, ag.agenda)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold px-2.5 py-1 rounded-lg shadow-2xs transition cursor-pointer flex items-center gap-1 active:scale-95"
                          >
                            <Eye size={13} />
                            <span>View Attachment Details (विवरण हेर्नुहोस्)</span>
                          </button>
                        )}
                        {ag.attachedReport.fileUrl && (
                          <a 
                            href={ag.attachedReport.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-indigo-700 hover:underline font-bold text-[11px]"
                          >
                            👁️ View File
                          </a>
                        )}
                      </div>
                    </div>
                    <div><strong>शीर्षक (Title):</strong> {ag.attachedReport.title}</div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-emerald-800 font-mono">
                      <span><strong>मिति (Date):</strong> {ag.attachedReport.reportDate}</span>
                      {ag.attachedReport.referenceNo && <span><strong>सन्दर्भ नं.:</strong> {ag.attachedReport.referenceNo}</span>}
                      {ag.attachedReport.amount !== undefined && <span><strong>रकम:</strong> रु. {ag.attachedReport.amount.toLocaleString()}</span>}
                      {ag.attachedReport.fileName && <span><strong>फाइल:</strong> {ag.attachedReport.fileName}</span>}
                    </div>
                    {ag.attachedReport.summary && (
                      <div className="text-[11px] font-sans text-emerald-900 italic pt-0.5 border-t border-emerald-200/60 mt-1">
                        "{ag.attachedReport.summary}"
                      </div>
                    )}

                    {/* EMBEDDED ATTACHED PRINTABLE DOCUMENT / IMAGE FOR INVITATION LETTER */}
                    {ag.attachedReport.fileUrl && (
                      <div className="mt-2 pt-2 border-t border-emerald-200/80 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-950">
                          <span>📄 संलग्न दस्ताबेज / तस्बिर (Attached Document / Image for Invited Guests):</span>
                          <span className="text-[10px] text-slate-500 font-mono print:hidden">
                            {ag.attachedReport.fileName || 'Attached File'}
                          </span>
                        </div>

                        {(ag.attachedReport.fileType?.startsWith('image/') || 
                          ag.attachedReport.fileUrl.startsWith('data:image/') || 
                          /\.(jpg|jpeg|png|webp)$/i.test(ag.attachedReport.fileName || '')) ? (
                          <div className="bg-white p-2 rounded-xl border border-emerald-300 shadow-2xs flex justify-center">
                            <img 
                              src={ag.attachedReport.fileUrl} 
                              alt={ag.attachedReport.title || 'Attached Image Document'} 
                              className="max-h-72 sm:max-h-96 w-auto object-contain rounded-lg border border-slate-200 print:max-h-[500px]"
                            />
                          </div>
                        ) : (
                          <div className="bg-slate-100 p-2 rounded-xl border border-emerald-300 space-y-1.5">
                            <iframe 
                              src={ag.attachedReport.fileUrl} 
                              className="w-full h-72 sm:h-80 rounded-lg border border-slate-300 print:h-[500px]" 
                              title={ag.attachedReport.title || 'Attached PDF Document'}
                            />
                            <div className="text-right print:hidden">
                              <a
                                href={ag.attachedReport.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 underline"
                              >
                                <span>↗️ Open PDF in New Window / Full Screen</span>
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <p>
          बैठक निर्धारित समयमा नै सुरु हुने भएकाले समय भन्दा १५ मिनेट अगावै उपस्थित भइदिनु हुन विनम्र अनुरोध छ। यहाँको निरन्तर सहयोग र सहकार्यको लागि हार्दिक धन्यवाद।
        </p>
      </div>

      {/* Right Aligned Signature / Sender Block */}
      <div className="pt-8 flex justify-end text-right font-serif">
        <div className="space-y-2 min-w-[260px]">
          <p className="font-bold text-xs sm:text-sm text-slate-800">भवदीय,</p>
          
          <div className="py-2.5 px-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-[11px] font-sans text-center shadow-2xs">
            <div className="font-bold text-xs flex items-center justify-center gap-1 text-emerald-800">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>✓ RTSS प्रणाली मार्फत डिजिटल रूपमा हस्ताक्षर गरिएको</span>
            </div>
            <p className="text-[10px] font-mono text-emerald-800 font-semibold mt-0.5">
              (मिति: {meetingDateBs} | समय: {timeFormatted})
            </p>
            <p className="text-[9px] text-emerald-900 font-bold mt-0.5">
              हस्ताक्षरकर्ता: {chairpersonName} ({chairpersonPost})
            </p>
          </div>

          <div className="text-xs sm:text-sm font-sans pt-1">
            <p className="font-bold text-slate-900">{chairpersonName}</p>
            <p className="text-slate-600 font-medium">{chairpersonPost}</p>
            <p className="text-slate-500 text-[11px]">{companyTitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MeetingMyNotesProps {
  meetingNotes: MeetingNote[];
  onSaveMeetingNote: (note: MeetingNote) => void;
  onDeleteMeetingNote: (id: string) => void;
  currentUser: AppUser;
  users: AppUser[];
  profile?: BusinessProfile;
  periodicClosings?: any[];
  letters?: BusinessLetter[];
  onAddLetter?: (letter: Omit<BusinessLetter, 'id'>) => void;
  shareholders?: Shareholder[];
  pendingPartialShareReturns?: ShareTransaction[];
}

// Helper to calculate or structure monthly progress metrics for selected BS Month
const getMonthlyProgressData = (monthName: string) => {
  const monthMap: Record<string, { totalRevenue: number; totalExpenses: number; targetProgress: number; invoicesCount: number; serviceCount: number; stockValue: number; attendanceRate: number }> = {
    '2081 Baisakh': { totalRevenue: 420000, totalExpenses: 125000, targetProgress: 84, invoicesCount: 38, serviceCount: 16, stockValue: 110000, attendanceRate: 95 },
    '2081 Jestha': { totalRevenue: 450000, totalExpenses: 132000, targetProgress: 86, invoicesCount: 42, serviceCount: 18, stockValue: 115000, attendanceRate: 96 },
    '2081 Asadh': { totalRevenue: 510000, totalExpenses: 160000, targetProgress: 92, invoicesCount: 50, serviceCount: 22, stockValue: 130000, attendanceRate: 98 },
    '2081 Shrawan': { totalRevenue: 485000, totalExpenses: 142000, targetProgress: 88, invoicesCount: 45, serviceCount: 20, stockValue: 120000, attendanceRate: 96 },
    '2081 Bhadra': { totalRevenue: 460000, totalExpenses: 138000, targetProgress: 85, invoicesCount: 41, serviceCount: 17, stockValue: 118000, attendanceRate: 94 },
    '2081 Ashwin': { totalRevenue: 530000, totalExpenses: 155000, targetProgress: 94, invoicesCount: 52, serviceCount: 24, stockValue: 140000, attendanceRate: 97 },
    '2081 Kartik': { totalRevenue: 495000, totalExpenses: 140000, targetProgress: 89, invoicesCount: 46, serviceCount: 19, stockValue: 125000, attendanceRate: 95 },
    '2081 Mangsir': { totalRevenue: 475000, totalExpenses: 135000, targetProgress: 87, invoicesCount: 43, serviceCount: 18, stockValue: 122000, attendanceRate: 96 },
    '2081 Poush': { totalRevenue: 440000, totalExpenses: 130000, targetProgress: 83, invoicesCount: 39, serviceCount: 15, stockValue: 112000, attendanceRate: 93 },
    '2081 Magh': { totalRevenue: 465000, totalExpenses: 136000, targetProgress: 86, invoicesCount: 42, serviceCount: 18, stockValue: 119000, attendanceRate: 95 },
    '2081 Falgun': { totalRevenue: 505000, totalExpenses: 148000, targetProgress: 91, invoicesCount: 48, serviceCount: 21, stockValue: 132000, attendanceRate: 97 },
    '2081 Chaitra': { totalRevenue: 540000, totalExpenses: 165000, targetProgress: 95, invoicesCount: 55, serviceCount: 25, stockValue: 145000, attendanceRate: 98 },
    '2082 Baisakh': { totalRevenue: 520000, totalExpenses: 150000, targetProgress: 93, invoicesCount: 49, serviceCount: 23, stockValue: 138000, attendanceRate: 97 },
    '2082 Jestha': { totalRevenue: 550000, totalExpenses: 158000, targetProgress: 96, invoicesCount: 54, serviceCount: 26, stockValue: 148000, attendanceRate: 98 },
  };

  const data = monthMap[monthName] || {
    totalRevenue: 485000,
    totalExpenses: 142000,
    targetProgress: 88,
    invoicesCount: 45,
    serviceCount: 20,
    stockValue: 120000,
    attendanceRate: 96
  };

  const netRevenue = data.totalRevenue - data.totalExpenses;
  const margin = Math.round((netRevenue / data.totalRevenue) * 100);

  return {
    ...data,
    netRevenue,
    profitMargin: margin
  };
};

export const MeetingMyNotes: React.FC<MeetingMyNotesProps> = ({
  meetingNotes,
  onSaveMeetingNote,
  onDeleteMeetingNote,
  currentUser,
  users,
  profile,
  periodicClosings = [],
  letters = [],
  onAddLetter,
  shareholders = [],
  pendingPartialShareReturns = []
}) => {
  // Navigation & View States
  const [activeView, setActiveView] = useState<'table' | 'callForm' | 'liveRoom' | 'print' | 'invitationLetter'>('table');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [invitationRecipients, setInvitationRecipients] = useState<string[]>([]);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState<boolean>(false);

  // VIEW ATTACHMENT DETAILS MODAL STATE
  const [viewAttachmentDetailsModal, setViewAttachmentDetailsModal] = useState<{
    report: AttachedReport;
    agendaTitle?: string;
    meetingTitle?: string;
  } | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Scheduled' | 'In Progress' | 'Closed' | 'Approved' | 'Rejected'>('All');

  // Share Transaction Modal States
  const [shareTxModalOpen, setShareTxModalOpen] = useState(false);
  const [shareTxType, setShareTxType] = useState<'Addition' | 'Return'>('Addition');
  const [callFormShareTx, setCallFormShareTx] = useState<ShareTransaction[]>([]);
  const [editingMeetingForShareTx, setEditingMeetingForShareTx] = useState<MeetingNote | null>(null);

  // STEP 1: CALL MEETING FORM STATE
  const [meetingType, setMeetingType] = useState('Regular Board Meeting');
  const [language, setLanguage] = useState<'English' | 'Nepali'>('Nepali');
  const [bsDate, setBsDate] = useState(getCurrentBsDate());
  const [startTime, setStartTime] = useState('11:00 AM');
  const [endTime, setEndTime] = useState('01:00 PM');
  const [venue, setVenue] = useState('Suryodaya Mun-10, Fikkal Bajar Ilam');
  const [chairperson, setChairperson] = useState(currentUser.name);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([currentUser.username]);
  const [externalParticipants, setExternalParticipants] = useState<string[]>([]);
  const [newExternalName, setNewExternalName] = useState('');
  const [callFormAgendas, setCallFormAgendas] = useState<AgendaItem[]>([
    { agenda: '', decision: '' },
    { agenda: '', decision: '' }
  ]);

  // ATTACH REPORT MODAL STATE
  const [showAttachReportModal, setShowAttachReportModal] = useState(false);
  const [attachModalAgendaIdx, setAttachModalAgendaIdx] = useState<number | null>(null);
  const [attachModalTarget, setAttachModalTarget] = useState<'callForm' | 'liveRoom'>('callForm');
  const [reportModalData, setReportModalData] = useState<AttachedReport>({
    category: 'Sales Bill / Invoice',
    reportDate: getCurrentBsDate(),
    title: '',
    referenceNo: '',
    amount: undefined,
    summary: ''
  });

  // STEP 3: LIVE ROOM STATE
  const [editingDecisions, setEditingDecisions] = useState<{ [agendaIdx: number]: string }>({});
  const [savedFeedback, setSavedFeedback] = useState<{ [agendaIdx: number]: boolean }>({});
  const [newLiveAgendaText, setNewLiveAgendaText] = useState('');
  const [showLiveAddAgenda, setShowLiveAddAgenda] = useState(false);

  // MONTHLY PROGRESS REPORT MODAL STATE
  const [activeReportAgendaIdx, setActiveReportAgendaIdx] = useState<number | null>(null);
  const [selectedProgressMonth, setSelectedProgressMonth] = useState<string>('2081 Shrawan');
  const [monthlyReportNotes, setMonthlyReportNotes] = useState<{ [agendaIdx: number]: string }>({});

  // Auto-generate Meeting ID for Step 1 (Nepali Fiscal Year sequence e.g., RTSS-2082/83-0001)
  const generateMeetingId = (targetDate?: string): string => {
    const dateToUse = targetDate || bsDate || getCurrentBsDate();
    return generateMeetingNumber(dateToUse, meetingNotes, periodicClosings);
  };

  const [generatedId, setGeneratedId] = useState(generateMeetingId());

  // Get active selected meeting object
  const activeMeeting = meetingNotes.find(m => m.id === selectedMeetingId);

  // Check if current user is Creator, Chairperson, or Admin (Caller of Meeting)
  const isMeetingCaller = (note?: MeetingNote): boolean => {
    if (!note || !currentUser) return false;
    if (currentUser.role === 'Admin' || currentUser.role === 'Super Admin') return true;
    if (note.submittedBy && (note.submittedBy === currentUser.name || note.submittedBy === currentUser.username)) return true;
    if (note.chairperson && (note.chairperson === currentUser.name || note.chairperson === currentUser.username)) return true;
    return false;
  };

  const isAuthorizedEditor = (note?: MeetingNote): boolean => {
    return isMeetingCaller(note);
  };

  // Open "Call Meeting" Form
  const handleOpenCallMeetingForm = () => {
    const todayBs = getCurrentBsDate();
    setBsDate(todayBs);
    setGeneratedId(generateMeetingId(todayBs));
    setMeetingType('Regular Board Meeting');
    setLanguage('Nepali');
    setStartTime('11:00 AM');
    setEndTime('01:00 PM');
    setVenue('Suryodaya Mun-10, Fikkal Bajar Ilam');
    setChairperson(currentUser?.name || '');
    // Default select all active users as invited
    setSelectedParticipants((users || []).map(u => u.username));
    setExternalParticipants([]);
    setCallFormShareTx([]);

    const initialAgendas: AgendaItem[] = [];
    if (pendingPartialShareReturns && pendingPartialShareReturns.length > 0) {
      pendingPartialShareReturns.forEach(pTx => {
        initialAgendas.push({
          agenda: `सेयर रकम फिर्ता र सेयरधनी लगत कट्टा गर्ने सम्बन्धमा (बाँकी भुक्तानी: ${pTx.shareholderName} - रु. ${(pTx.remainingBalance || 0).toLocaleString()})`,
          decision: '',
          attachedReport: {
            category: 'Shareholder Statement',
            reportDate: pTx.transactionDate || getCurrentBsDate(),
            title: `Shareholder Return Statement - ${pTx.shareholderName}`,
            referenceNo: pTx.decisionNumber || pTx.id,
            amount: pTx.paidAmount,
            summary: `Shareholder return transaction record for ${pTx.shareholderName}`
          }
        });
      });
    }
    if (initialAgendas.length === 0) {
      initialAgendas.push({ agenda: '', decision: '' }, { agenda: '', decision: '' });
    }
    setCallFormAgendas(initialAgendas);
    setActiveView('callForm');
  };

  // Step 1 Submission: Call Meeting / Send Invitations
  const handleCallMeetingSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validAgendas = callFormAgendas
      .map(a => ({ ...a, agenda: a.agenda.trim() }))
      .filter(a => a.agenda.length > 0);

    if (validAgendas.length === 0) {
      alert('Please add at least one discussion agenda item.');
      return;
    }

    const agendaObjects: AgendaItem[] = validAgendas.map(ag => ({
      agenda: ag.agenda,
      decision: ag.decision || '',
      attachedReport: ag.attachedReport
    }));

    const newMeeting: MeetingNote = {
      id: `mtg-${Date.now()}`,
      meetingNumber: generatedId,
      meetingDate: bsDate,
      typeOfMeeting: meetingType,
      language: language,
      startTime: startTime,
      endTime: endTime,
      venue: venue,
      chairperson: chairperson,
      submittedBy: currentUser.name,
      status: 'Scheduled',
      presentMembers: selectedParticipants,
      participants: selectedParticipants,
      externalParticipants: externalParticipants,
      agendas: agendaObjects,
      shareTransactions: callFormShareTx,
      participantApprovals: [],
      participantRejections: [],
      joinedParticipants: [],
      approvedByAdmins: [],
      totalAdminsAtSubmission: users.filter(u => u.role === 'Admin' || u.role === 'Super Admin').length,
    };

    onSaveMeetingNote(newMeeting);
    setActiveView('table');
    alert(`Meeting Invitation (${generatedId}) successfully sent & scheduled!`);
  };

  // STEP 2 ACTIONS: Start Meeting / Join Meeting / Open Room
  const handleStartMeeting = (note: MeetingNote) => {
    const updated: MeetingNote = {
      ...note,
      status: 'In Progress',
      joinedParticipants: Array.from(new Set([...(note.joinedParticipants || []), currentUser.username]))
    };
    onSaveMeetingNote(updated);
    setSelectedMeetingId(note.id);
    initLiveRoomDecisions(updated);
    setActiveView('liveRoom');
  };

  const handleJoinMeeting = (note: MeetingNote) => {
    const updated: MeetingNote = {
      ...note,
      joinedParticipants: Array.from(new Set([...(note.joinedParticipants || []), currentUser.username]))
    };
    onSaveMeetingNote(updated);
    setSelectedMeetingId(note.id);
    initLiveRoomDecisions(updated);
    setActiveView('liveRoom');
  };

  const handleViewLiveRoom = (note: MeetingNote) => {
    setSelectedMeetingId(note.id);
    initLiveRoomDecisions(note);
    setActiveView('liveRoom');
  };

  // Initialize decisions local state for Step 3
  const initLiveRoomDecisions = (note: MeetingNote) => {
    const initialDecisions: { [idx: number]: string } = {};
    (note?.agendas || []).forEach((ag, idx) => {
      initialDecisions[idx] = ag.decision || '';
    });
    setEditingDecisions(initialDecisions);
  };

  // STEP 3: Save single decision
  const handleSaveSingleDecision = (agendaIdx: number) => {
    if (!activeMeeting) return;
    const currentDecisionText = editingDecisions[agendaIdx] || '';

    const updatedAgendas = activeMeeting.agendas.map((ag, idx) => {
      if (idx === agendaIdx) {
        return { ...ag, decision: currentDecisionText };
      }
      return ag;
    });

    const updatedMeeting: MeetingNote = {
      ...activeMeeting,
      agendas: updatedAgendas
    };

    onSaveMeetingNote(updatedMeeting);

    // Show feedback toast
    setSavedFeedback(prev => ({ ...prev, [agendaIdx]: true }));
    setTimeout(() => {
      setSavedFeedback(prev => ({ ...prev, [agendaIdx]: false }));
    }, 2500);
  };

  // STEP 3: Inject New Agenda mid-meeting
  const handleInjectNewAgenda = () => {
    if (!activeMeeting || !newLiveAgendaText.trim()) return;

    const newAgendaObj: AgendaItem = {
      agenda: newLiveAgendaText.trim(),
      decision: ''
    };

    const updatedAgendas = [...activeMeeting.agendas, newAgendaObj];
    const updatedMeeting: MeetingNote = {
      ...activeMeeting,
      agendas: updatedAgendas
    };

    onSaveMeetingNote(updatedMeeting);

    // Update local decision state
    const newIdx = updatedAgendas.length - 1;
    setEditingDecisions(prev => ({ ...prev, [newIdx]: '' }));
    setNewLiveAgendaText('');
    setShowLiveAddAgenda(false);
  };

  // STEP 4: Close Meeting & Freeze Session
  const handleCloseMeetingSession = () => {
    if (!activeMeeting) return;
    if (!window.confirm('Are you sure you want to CLOSE this meeting? All decisions will be frozen and submitted for 60% majority participant voting.')) return;

    const updatedMeeting: MeetingNote = {
      ...activeMeeting,
      status: 'Closed'
    };

    onSaveMeetingNote(updatedMeeting);
  };

  // STEP 4: Participant Vote (Approve or Reject)
  const handleParticipantVote = (voteType: 'approve' | 'reject') => {
    if (!activeMeeting) return;

    let updatedApprovals = [...(activeMeeting.participantApprovals || [])];
    let updatedRejections = [...(activeMeeting.participantRejections || [])];

    // Remove user if present in opposite list
    updatedApprovals = updatedApprovals.filter(u => u !== currentUser.username);
    updatedRejections = updatedRejections.filter(u => u !== currentUser.username);

    if (voteType === 'approve') {
      updatedApprovals.push(currentUser.username);
    } else {
      updatedRejections.push(currentUser.username);
    }

    // Total invited participants
    const totalInvited = Math.max(
      1,
      (activeMeeting.participants?.length || 0) + (activeMeeting.externalParticipants?.length || 0)
    );

    const approvalRatio = updatedApprovals.length / totalInvited;
    let newStatus: MeetingNote['status'] = activeMeeting.status;

    if (approvalRatio >= 0.6) {
      newStatus = 'Approved';
    } else if (updatedRejections.length / totalInvited > 0.4) {
      newStatus = 'Rejected';
    } else {
      newStatus = 'Closed';
    }

    const updatedMeeting: MeetingNote = {
      ...activeMeeting,
      participantApprovals: updatedApprovals,
      participantRejections: updatedRejections,
      status: newStatus
    };

    onSaveMeetingNote(updatedMeeting);
    alert(voteType === 'approve' ? 'You APPROVED these meeting minutes!' : 'You REJECTED these meeting minutes.');
  };

  // Filter meetings for table
  const filteredMeetings = (meetingNotes || []).filter(m => {
    if (!m) return false;
    const matchesSearch = 
      (m.meetingNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.typeOfMeeting || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.venue || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.agendas || []).some(a => (a?.agenda || '').toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'All') return true;
    return m.status === statusFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users size={22} />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                Meeting Management System
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                State-Driven Workflow: Call Meeting → Live Action → Single-Decision Saving → 60% Majority Voting
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeView !== 'table' && (
            <button
              onClick={() => setActiveView('table')}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <span>← Back to Dashboard</span>
            </button>
          )}

          {activeView === 'table' && (
            <button
              onClick={handleOpenCallMeetingForm}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer active:scale-95"
            >
              <Plus size={16} />
              <span>+ Call a Meeting</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: THE "CALL MEETING" SYSTEM (INVITATION FORM MODAL / PANEL) */}
      {/* ========================================================================= */}
      {activeView === 'callForm' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold font-mono bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md mb-1">
                <span>STEP 1: INVITATION PHASE</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Call a New Meeting / Send Invitations
              </h2>
              <p className="text-xs text-slate-500">
                Configure logistics, attendees, and agendas. <strong className="text-slate-700">No decision fields</strong> are filled here.
              </p>
            </div>
            <button
              onClick={() => setActiveView('table')}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleCallMeetingSubmit} className="space-y-6">
            {/* 1. METADATA SECTION */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} className="text-indigo-600" />
                <span>1. Meeting Metadata</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Meeting ID (Auto)</label>
                  <input
                    type="text"
                    readOnly
                    value={generatedId}
                    className="w-full bg-slate-200/70 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-700 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Meeting Type *</label>
                  <select
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold bg-white text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Regular Board Meeting">Regular Board Meeting (नियमित बैठक)</option>
                    <option value="Emergency Meeting">Emergency Meeting (आकस्मिक बैठक)</option>
                    <option value="Executive Committee">Executive Committee (कार्यसमिति बैठक)</option>
                    <option value="General Assembly">General Assembly (साधारण सभा)</option>
                    <option value="Special Committee">Special Committee (विशेष समिति)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Output Language</label>
                  <div className="flex rounded-lg border border-slate-300 p-1 bg-white">
                    <button
                      type="button"
                      onClick={() => setLanguage('Nepali')}
                      className={`flex-1 py-1 text-xs font-bold rounded-md transition ${language === 'Nepali' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      नेपाली (Nepali)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('English')}
                      className={`flex-1 py-1 text-xs font-bold rounded-md transition ${language === 'English' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      English
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. LOGISTICS SECTION */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-emerald-600" />
                <span>2. Logistics & Venue</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">BS Date (YYYY-MM-DD) *</label>
                  <input
                    type="text"
                    required
                    value={bsDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBsDate(val);
                      setGeneratedId(generateMeetingId(val));
                    }}
                    placeholder="2081-11-25"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time *</label>
                  <input
                    type="text"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="11:00 AM"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="01:00 PM"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Venue / Location *</label>
                  <input
                    type="text"
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. ATTENDANCE & PARTICIPANTS */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users size={14} className="text-purple-600" />
                <span>3. Attendance & Invited Participants</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chairperson Name *</label>
                  <input
                    type="text"
                    required
                    value={chairperson}
                    onChange={(e) => setChairperson(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Invited Internal Members</label>
                    <div className="space-x-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setSelectedParticipants(users.map(u => u.username))}
                        className="text-indigo-600 hover:underline font-bold"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedParticipants([])}
                        className="text-slate-500 hover:underline"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border border-slate-200 rounded-lg p-3 bg-white max-h-40 overflow-y-auto">
                    {users.map(u => {
                      const isChecked = selectedParticipants.includes(u.username);
                      return (
                        <label key={u.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-1 rounded hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedParticipants([...selectedParticipants, u.username]);
                              } else {
                                setSelectedParticipants(selectedParticipants.filter(p => p !== u.username));
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-medium truncate">{u.name} ({u.role})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* External Guests */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">+ Add External Guest (Manual Name)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter external guest name (e.g. Auditor / Guest Speaker)..."
                      value={newExternalName}
                      onChange={(e) => setNewExternalName(e.target.value)}
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-hidden focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newExternalName.trim()) return;
                        if (!externalParticipants.includes(newExternalName.trim())) {
                          setExternalParticipants([...externalParticipants, newExternalName.trim()]);
                        }
                        setNewExternalName('');
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      + Add Guest
                    </button>
                  </div>

                  {externalParticipants.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {externalParticipants.map((ext, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          <span>{ext}</span>
                          <button
                            type="button"
                            onClick={() => setExternalParticipants(externalParticipants.filter((_, i) => i !== idx))}
                            className="hover:text-rose-600 cursor-pointer"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4. DYNAMIC AGENDAS SECTION */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200/70 pb-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={14} className="text-amber-600" />
                  <span>4. Discussion Agendas (छलफलका प्रस्तावहरू)</span>
                </h3>
                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
                  Decisions will be recorded during Step 3
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] text-slate-500 font-medium">
                  Enter your meeting discussion agendas and topics (use the attach button to link printable reports from any date):
                </p>
                {callFormAgendas.map((agItem, idx) => (
                  <div key={idx} className="space-y-1.5 border border-slate-200/80 rounded-xl p-3 bg-slate-50/50">
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-bold text-slate-600 w-18 shrink-0">
                        Agenda {idx + 1}:
                      </span>
                      <input
                        type="text"
                        required
                        placeholder={`Enter agenda #${idx + 1} topic / subject...`}
                        value={agItem.agenda}
                        onChange={(e) => {
                          const updated = [...callFormAgendas];
                          updated[idx] = { ...updated[idx], agenda: e.target.value };
                          setCallFormAgendas(updated);
                        }}
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium bg-white focus:outline-hidden focus:border-indigo-500"
                      />

                      {/* ATTACH REPORT SYMBOL BUTTON JUST BEFORE DELETE SYMBOL */}
                      <button
                        type="button"
                        onClick={() => {
                          setAttachModalAgendaIdx(idx);
                          setAttachModalTarget('callForm');
                          setReportModalData(agItem.attachedReport || {
                            category: 'Sales Bill / Invoice',
                            reportDate: bsDate || getCurrentBsDate(),
                            title: agItem.agenda ? `${agItem.agenda} - Particular Report` : 'System Report / Document',
                            referenceNo: '',
                            amount: undefined,
                            summary: ''
                          });
                          setShowAttachReportModal(true);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 border ${
                          agItem.attachedReport 
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                        }`}
                        title="Attach any report, bill, PO, income or expense from any particular date"
                      >
                        <Paperclip size={14} className={agItem.attachedReport ? 'text-emerald-700' : 'text-indigo-600'} />
                        <span>{agItem.attachedReport ? '📎 Report Attached' : 'Attach Report'}</span>
                      </button>

                      {/* DELETE AGENDA SYMBOL */}
                      {callFormAgendas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setCallFormAgendas(callFormAgendas.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 p-2 cursor-pointer shrink-0"
                          title="Delete Agenda"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    {/* ATTACHED REPORT BADGE / DETAILS */}
                    {agItem.attachedReport && (
                      <div className="ml-20 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText size={14} className="text-emerald-700 shrink-0" />
                          <div className="truncate">
                            <span className="font-bold text-emerald-950">[{agItem.attachedReport.category}]</span>{' '}
                            <span className="font-semibold text-emerald-900">{agItem.attachedReport.title}</span>{' '}
                            <span className="text-[11px] text-emerald-800 font-mono">(Date: {agItem.attachedReport.reportDate}{agItem.attachedReport.amount !== undefined ? ` | Rs. ${agItem.attachedReport.amount.toLocaleString()}` : ''})</span>
                            {agItem.attachedReport.fileName && (
                              <span className="ml-1.5 inline-flex items-center gap-1 bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                                📄 {agItem.attachedReport.fileName}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setViewAttachmentDetailsModal({
                              report: agItem.attachedReport!,
                              agendaTitle: agItem.agenda
                            })}
                            className="text-xs text-indigo-700 hover:text-indigo-900 hover:underline font-bold cursor-pointer"
                          >
                            👁️ View Details
                          </button>
                          {agItem.attachedReport.fileUrl && (
                            <a
                              href={agItem.attachedReport.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-700 hover:underline font-bold"
                            >
                              👁️ View File
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...callFormAgendas];
                              updated[idx] = { ...updated[idx], attachedReport: undefined };
                              setCallFormAgendas(updated);
                            }}
                            className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setCallFormAgendas([...callFormAgendas, { agenda: '', decision: '' }])}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>+ Add Another Agenda</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveView('table')}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer active:scale-95"
              >
                <Send size={15} />
                <span>Send Invitation / Call Meeting</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: THE MEETINGS TABLE & LIVE ACTION BUTTONS */}
      {/* ========================================================================= */}
      {activeView === 'table' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-4 p-5">
          {/* SEARCH & STATUS FILTER BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <InteractiveSearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search meeting ID, venue, or agenda topic..."
                expandedWidth="w-72 sm:w-80 md:w-96"
                size="sm"
              />
            </div>

            {/* STATUS FILTER BADGES */}
            <div className="flex flex-wrap gap-1.5">
              {(['All', 'Scheduled', 'In Progress', 'Closed', 'Approved', 'Rejected'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${statusFilter === st ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* MEETINGS TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Meeting ID & Type</th>
                  <th className="py-3 px-4">Date & Logistics</th>
                  <th className="py-3 px-4">Agenda Overview</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {filteredMeetings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                      No meetings found matching your criteria. Click <strong>"+ Call a Meeting"</strong> to initiate one.
                    </td>
                  </tr>
                ) : (
                  filteredMeetings.map(m => {
                    const isEditor = isAuthorizedEditor(m);
                    const isScheduled = m.status === 'Scheduled';
                    const isInProgress = m.status === 'In Progress';
                    const isClosedOrFinal = m.status === 'Closed' || m.status === 'Approved' || m.status === 'Rejected';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition">
                        {/* ID & TYPE */}
                        <td className="py-3.5 px-4 font-mono font-bold">
                          <div className="text-slate-900 flex items-center gap-1.5">
                            <span>{m.meetingNumber}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 font-sans text-slate-600 font-semibold border border-slate-200">
                              {m.language || 'Nepali'}
                            </span>
                          </div>
                          <div className="text-[11px] font-normal text-slate-500 font-sans">
                            {m.typeOfMeeting}
                          </div>
                        </td>

                        {/* DATE & LOGISTICS */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <Calendar size={13} className="text-slate-400" />
                            <span>{m.meetingDate} BS</span>
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock size={11} className="text-slate-400" />
                            <span>{m.startTime || '11:00 AM'} - {m.endTime || '01:00 PM'}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={11} className="text-slate-400" />
                            <span className="truncate max-w-[160px]">{m.venue}</span>
                          </div>
                        </td>

                        {/* AGENDAS OVERVIEW */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {m.agendas.slice(0, 2).map((ag, idx) => (
                              <div key={idx} className="text-[11px] font-medium text-slate-700 truncate max-w-[200px] flex items-center gap-1">
                                <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                                <span className="truncate">{ag.agenda}</span>
                              </div>
                            ))}
                            {m.agendas.length > 2 && (
                              <span className="text-[10px] text-indigo-600 font-semibold">
                                +{m.agendas.length - 2} more agenda(s)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* STATUS BADGE */}
                        <td className="py-3.5 px-4">
                          {isScheduled && (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                              <Clock size={11} />
                              <span>Scheduled</span>
                            </span>
                          )}
                          {isInProgress && (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full text-[11px] font-bold animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                              <span>In Progress</span>
                            </span>
                          )}
                          {m.status === 'Closed' && (
                            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                              <Lock size={11} />
                              <span>Voting Open</span>
                            </span>
                          )}
                          {m.status === 'Approved' && (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full text-[11px] font-bold">
                              <CheckCircle2 size={11} />
                              <span>Approved</span>
                            </span>
                          )}
                          {m.status === 'Rejected' && (
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-300 px-2.5 py-1 rounded-full text-[11px] font-bold">
                              <XCircle size={11} />
                              <span>Rejected</span>
                            </span>
                          )}
                        </td>

                        {/* ACTION BUTTON */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* STEP 2 DYNAMIC BUTTONS */}
                            {isScheduled && (
                              isEditor ? (
                                <button
                                  onClick={() => handleStartMeeting(m)}
                                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                                >
                                  <Play size={13} />
                                  <span>Start Meeting</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium italic">
                                  Awaiting Host to Start
                                </span>
                              )
                            )}

                            {isInProgress && (
                              <button
                                onClick={() => handleJoinMeeting(m)}
                                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer animate-bounce"
                              >
                                <Users size={13} />
                                <span>Join Meeting</span>
                              </button>
                            )}

                            {isClosedOrFinal && (
                              <button
                                onClick={() => handleViewLiveRoom(m)}
                                className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                <Eye size={13} />
                                <span>View Minutes / Voting</span>
                              </button>
                            )}

                            {/* INVITATION LETTER ACTION */}
                            <button
                              onClick={() => {
                                setSelectedMeetingId(m.id);
                                const allCandidates = [
                                  ...(m.participants || []),
                                  ...(m.externalParticipants || [])
                                ];
                                setInvitationRecipients(allCandidates);
                                setShowRecipientDropdown(false);
                                setActiveView('invitationLetter');
                              }}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs ${
                                isEditor 
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200' 
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                              title={isEditor ? "Print & Dispatch Invitation Letter (निमन्त्रणा पत्र)" : "View Invitation Letter (View Form)"}
                            >
                              {isEditor ? <Mail size={13} className="text-amber-600" /> : <Eye size={13} className="text-emerald-600" />}
                              <span>{isEditor ? "Invitation Letter" : "View Invitation"}</span>
                            </button>

                            {/* PRINT / VIEW MINUTES ACTION */}
                            <button
                              onClick={() => {
                                setSelectedMeetingId(m.id);
                                setActiveView('print');
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                              title={isEditor ? "Print Formal Minutes Record" : "View Minutes Record (View Form)"}
                            >
                              {isEditor ? <Printer size={15} /> : <Eye size={15} className="text-indigo-600" />}
                            </button>

                            {/* DELETE ACTION */}
                            <button
                              onClick={() => {
                                const isSystemMaster = currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin';
                                if (!isSystemMaster) {
                                  alert('Direct deletion is allowed for System Master (@reliableadmin) only.');
                                  return;
                                }
                                if (window.confirm('Delete this meeting permanently?')) {
                                  onDeleteMeetingNote(m.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title={currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin' ? "Delete Meeting" : "Delete (System Master Only)"}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3 & STEP 4: LIVE MEETING ROOM & VOTING WORKSPACE */}
      {/* ========================================================================= */}
      {activeView === 'liveRoom' && activeMeeting && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* LIVE ROOM BANNER */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold font-mono bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md border border-indigo-200">
                    {activeMeeting.meetingNumber}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {activeMeeting.typeOfMeeting}
                  </span>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    Language: {activeMeeting.language || 'Nepali'}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Live Meeting Room & Record Workspace
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveView('print')}
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Print Formal Sheet</span>
                </button>
              </div>
            </div>

            {/* LOGISTICS CARD SUMMARY */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">BS Date</span>
                <strong className="font-mono text-slate-900">{activeMeeting.meetingDate} BS</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Time</span>
                <strong className="font-mono text-slate-900">{activeMeeting.startTime} - {activeMeeting.endTime}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Venue</span>
                <span className="font-medium text-slate-800 truncate block">{activeMeeting.venue}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Chairperson</span>
                <span className="font-bold text-indigo-700 truncate block">{activeMeeting.chairperson}</span>
              </div>
            </div>

            {/* PARTICIPANTS & PRESENCE */}
            <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-500 text-[11px] uppercase">Attending Members:</span>
              {(activeMeeting.participants || []).map((pUsername, i) => {
                const userObj = users.find(u => u.username === pUsername);
                const hasJoined = activeMeeting.joinedParticipants?.includes(pUsername);
                return (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${hasJoined ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${hasJoined ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    <span>{userObj?.name || pUsername}</span>
                  </span>
                );
              })}
              {(activeMeeting.externalParticipants || []).map((ext, i) => (
                <span key={`ext-${i}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                  <span>Guest: {ext}</span>
                </span>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* STEP 3: REAL-TIME AGENDA & SINGLE-DECISION SAVING */}
          {/* ========================================================================= */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen size={18} className="text-emerald-600" />
                  <span>Agendas & Decision Recording</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Each agenda item has its own dedicated <strong>"Save Decision"</strong> button.
                </p>
              </div>

              {/* STEP 3: MID-MEETING AGENDA INJECTION */}
              {activeMeeting.status === 'In Progress' && isAuthorizedEditor(activeMeeting) && (
                <button
                  onClick={() => setShowLiveAddAgenda(true)}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Plus size={14} />
                  <span>+ Add New Agenda during Meeting</span>
                </button>
              )}
            </div>

            {/* MID-MEETING AGENDA INJECTION MODAL/INPUT */}
            {showLiveAddAgenda && (
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-indigo-900 uppercase">Inject Brand-New Agenda Topic Mid-Session</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter new agenda topic..."
                    value={newLiveAgendaText}
                    onChange={(e) => setNewLiveAgendaText(e.target.value)}
                    className="flex-1 border border-indigo-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                  <button
                    onClick={handleInjectNewAgenda}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                  >
                    Add & Create Decision Block
                  </button>
                  <button
                    onClick={() => setShowLiveAddAgenda(false)}
                    className="text-slate-500 hover:text-slate-700 text-xs px-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* LIST OF AGENDAS WITH INDIVIDUAL SINGLE-DECISION BLOCKS */}
            <div className="space-y-6 divide-y divide-slate-100">
              {activeMeeting.agendas.map((ag, idx) => {
                const canEditDecision = activeMeeting.status === 'In Progress' && isAuthorizedEditor(activeMeeting);

                return (
                  <div key={idx} className="pt-4 first:pt-0 space-y-3">
                    {/* AGENDA TITLE */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold font-mono uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            Agenda #{idx + 1}
                          </span>
                          {(ag.agenda.includes('मासिक') || ag.agenda.includes('प्रगति') || ag.agenda.toLowerCase().includes('progress')) && (
                            <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span>★ Monthly Progress Item</span>
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">
                          {ag.agenda}
                        </h4>
                      </div>

                      {savedFeedback[idx] && (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full animate-bounce">
                          <CheckCircle2 size={13} />
                          <span>Decision Saved!</span>
                        </span>
                      )}
                    </div>

                    {/* ATTACHED REPORT FOR DISCUSSION DISPLAY IN LIVE ROOM */}
                    {ag.attachedReport ? (
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-3.5 space-y-2 text-xs my-2">
                        <div className="flex items-center justify-between gap-2 border-b border-emerald-200/80 pb-1.5 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                              <Paperclip size={11} />
                              <span>Discuss Data / Attached Report</span>
                            </span>
                            <span className="font-bold text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-200">
                              {ag.attachedReport.category}
                            </span>
                            <button
                              type="button"
                              onClick={() => setViewAttachmentDetailsModal({
                                report: ag.attachedReport!,
                                agendaTitle: ag.agenda,
                                meetingTitle: activeMeeting.title
                              })}
                              className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold px-2.5 py-1 rounded-lg shadow-2xs transition cursor-pointer active:scale-95"
                            >
                              <Eye size={13} />
                              <span>View Details (विवरण हेर्नुहोस्)</span>
                            </button>
                          </div>
                          {canEditDecision && (
                            <button
                              type="button"
                              onClick={() => {
                                setAttachModalAgendaIdx(idx);
                                setAttachModalTarget('liveRoom');
                                setReportModalData(ag.attachedReport || {
                                  category: 'Sales Bill / Invoice',
                                  reportDate: activeMeeting.meetingDate,
                                  title: ag.agenda,
                                  referenceNo: '',
                                  amount: undefined,
                                  summary: ''
                                });
                                setShowAttachReportModal(true);
                              }}
                              className="text-indigo-700 hover:text-indigo-900 text-xs font-bold underline cursor-pointer shrink-0"
                            >
                              ✏️ Edit Attached Report
                            </button>
                          )}
                        </div>
                        <div className="font-bold text-sm text-slate-900">
                          {ag.attachedReport.title}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] text-slate-700 bg-white/70 p-2 rounded-lg border border-emerald-100">
                          <div><span className="text-slate-500 font-sans">Date:</span> <strong>{ag.attachedReport.reportDate}</strong></div>
                          {ag.attachedReport.referenceNo && <div><span className="text-slate-500 font-sans">Ref No:</span> <strong>{ag.attachedReport.referenceNo}</strong></div>}
                          {ag.attachedReport.amount !== undefined && <div><span className="text-slate-500 font-sans">Amount:</span> <strong className="text-emerald-700">Rs. {ag.attachedReport.amount.toLocaleString()}</strong></div>}
                        </div>
                        {ag.attachedReport.summary && (
                          <div className="text-slate-800 text-xs font-sans bg-white/90 p-2.5 rounded-lg border border-emerald-200/80 space-y-1">
                            <span className="font-bold text-emerald-950 block text-[11px] uppercase tracking-wide">Data & Key Metrics to Discuss:</span>
                            <p className="whitespace-pre-line leading-relaxed">{ag.attachedReport.summary}</p>
                          </div>
                        )}

                        {/* ATTACHED FILE / IMAGE PREVIEW IN LIVE ROOM */}
                        {ag.attachedReport.fileUrl && (
                          <div className="bg-white/90 p-2.5 rounded-lg border border-emerald-200/80 space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                              <span>📄 Attached External File ({ag.attachedReport.fileName || 'Document'}):</span>
                              <a
                                href={ag.attachedReport.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200"
                              >
                                <span>👁️ Open / View Attached File</span>
                              </a>
                            </div>

                            {(ag.attachedReport.fileType?.startsWith('image/') || 
                              ag.attachedReport.fileUrl.startsWith('data:image/') || 
                              /\.(jpg|jpeg|png|webp)$/i.test(ag.attachedReport.fileName || '')) ? (
                              <div className="flex justify-center bg-slate-900/5 p-2 rounded-lg">
                                <img
                                  src={ag.attachedReport.fileUrl}
                                  alt={ag.attachedReport.title}
                                  className="max-h-64 rounded object-contain"
                                />
                              </div>
                            ) : (
                              <iframe
                                src={ag.attachedReport.fileUrl}
                                className="w-full h-64 rounded border border-slate-200"
                                title={ag.attachedReport.title}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      canEditDecision && (
                        <div className="pt-0.5 pb-1">
                          <button
                            type="button"
                            onClick={() => {
                              setAttachModalAgendaIdx(idx);
                              setAttachModalTarget('liveRoom');
                              setReportModalData({
                                category: 'Sales Bill / Invoice',
                                reportDate: activeMeeting.meetingDate || getCurrentBsDate(),
                                title: ag.agenda ? `${ag.agenda} - Discussion Report` : 'System Report / Bill',
                                referenceNo: '',
                                amount: undefined,
                                summary: ''
                              });
                              setShowAttachReportModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            <Paperclip size={14} className="text-indigo-600" />
                            <span>+ Attach Report / Bill / Statement for this Agenda</span>
                          </button>
                        </div>
                      )
                    )}

                    {/* INTERACTIVE SHARE TRANSACTION & MONTHLY PROGRESS TRIGGERS */}
                    <div className="pt-1 pb-1 flex flex-wrap items-center gap-2">
                      {/* SHARE ADDITION TRIGGER */}
                      {((ag.agenda.includes('सेयर') && ag.agenda.includes('थप')) || ag.agenda.toLowerCase().includes('share addition') || (ag.agenda.includes('सेयर') && !ag.agenda.includes('फिर्ता') && !ag.agenda.includes('लगत कट्टा'))) && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMeetingForShareTx(activeMeeting);
                            setShareTxType('Addition');
                            setShareTxModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-2xs transition cursor-pointer active:scale-95"
                        >
                          <DollarSign size={14} />
                          <span>💵 सेयर रकम थप फारम भर्नुहोस् (Fill Share Addition Form)</span>
                        </button>
                      )}

                      {/* SHARE RETURN TRIGGER */}
                      {((ag.agenda.includes('सेयर') && (ag.agenda.includes('फिर्ता') || ag.agenda.includes('लगत कट्टा'))) || ag.agenda.toLowerCase().includes('share return') || ag.agenda.toLowerCase().includes('share refund')) && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMeetingForShareTx(activeMeeting);
                            setShareTxType('Return');
                            setShareTxModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-2xs transition cursor-pointer active:scale-95"
                        >
                          <DollarSign size={14} />
                          <span>💸 सेयर रकम फिर्ता/लगत कट्टा फारम भर्नुहोस् (Fill Share Return Form)</span>
                        </button>
                      )}

                      {/* MONTHLY PROGRESS REPORT TRIGGER */}
                      {(ag.agenda.includes('प्रगति') || ag.agenda.includes('मासिक') || ag.agenda.toLowerCase().includes('monthly') || ag.agenda.toLowerCase().includes('progress')) && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReportAgendaIdx(idx);
                            setSelectedProgressMonth('2081 Shrawan');
                          }}
                          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-2xs transition cursor-pointer active:scale-95"
                        >
                          <FileText size={14} />
                          <span>📊 {activeMeeting.language === 'Nepali' ? 'मासिक प्रगति विवरण हेर्नुहोस् (View Monthly Progress Report)' : 'View Monthly Progress Report'}</span>
                        </button>
                      )}
                    </div>

                    {/* RENDER RECORDED SHARE TRANSACTIONS IN LIVE ROOM IF PRESENT */}
                    {activeMeeting.shareTransactions && activeMeeting.shareTransactions.length > 0 && (
                      <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-950">
                            ✓ यस बैठकमा प्रविष्ट गरिएका सेयर कारोबार विवरणहरू ({activeMeeting.shareTransactions.length} वटा):
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMeetingForShareTx(activeMeeting);
                              setShareTxModalOpen(true);
                            }}
                            className="text-indigo-700 font-bold hover:underline"
                          >
                            विवरण सम्पादन गर्नुहोस् (Edit Records)
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse border border-emerald-200 bg-white rounded-lg text-xs">
                            <thead>
                              <tr className="bg-emerald-100/70 text-emerald-900 font-bold border-b border-emerald-200">
                                <th className="p-1.5 text-center">S.N.</th>
                                <th className="p-1.5">Shareholder</th>
                                <th className="p-1.5">Type</th>
                                <th className="p-1.5 text-right">Paid Amt</th>
                                <th className="p-1.5 text-right">Remaining</th>
                                <th className="p-1.5">Payment Method</th>
                                <th className="p-1.5">Ref ID</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeMeeting.shareTransactions.map((tx, txIdx) => (
                                <tr key={txIdx} className="border-b border-slate-100 text-slate-800">
                                  <td className="p-1.5 text-center font-mono font-bold">{txIdx + 1}</td>
                                  <td className="p-1.5 font-bold">{tx.shareholderName}</td>
                                  <td className="p-1.5 font-bold">
                                    {tx.transactionType === 'Addition' ? 'सेयर थप' : 'सेयर फिर्ता'}
                                  </td>
                                  <td className="p-1.5 text-right font-mono font-bold text-emerald-800">रु. {tx.paidAmount.toLocaleString()}</td>
                                  <td className="p-1.5 text-right font-mono text-amber-800 font-bold">
                                    {tx.remainingBalance && tx.remainingBalance > 0 ? `रु. ${tx.remainingBalance.toLocaleString()}` : '-'}
                                  </td>
                                  <td className="p-1.5 font-bold">{tx.paymentMethod}</td>
                                  <td className="p-1.5 font-mono text-slate-600">{tx.transactionIdNo || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* DECISION TEXTAREA & DEDICATED SAVE BUTTON */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase">
                        Decision / Resolution (निर्णय)
                      </label>
                      <textarea
                        rows={3}
                        disabled={!canEditDecision}
                        placeholder={canEditDecision ? "Type meeting resolution / decision for this agenda..." : "No decision recorded yet."}
                        value={editingDecisions[idx] !== undefined ? editingDecisions[idx] : (ag.decision || '')}
                        onChange={(e) => setEditingDecisions({ ...editingDecisions, [idx]: e.target.value })}
                        className={`w-full border rounded-xl p-3 text-xs font-medium transition focus:outline-hidden ${canEditDecision ? 'bg-white border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                      />

                      {/* DEDICATED SINGLE-DECISION SAVE BUTTON */}
                      {canEditDecision && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleSaveSingleDecision(idx)}
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer active:scale-95"
                          >
                            <Save size={14} />
                            <span>Save Decision #{idx + 1}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* STEP 4: CLOSING PROTOCOL BUTTON */}
            {activeMeeting.status === 'In Progress' && isAuthorizedEditor(activeMeeting) && (
              <div className="pt-6 border-t border-slate-200 flex justify-end">
                <button
                  onClick={handleCloseMeetingSession}
                  className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-md transition cursor-pointer active:scale-95"
                >
                  <Lock size={15} />
                  <span>Close Meeting & Freeze Session for Voting</span>
                </button>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* STEP 4: THE 60% MAJORITY VOTING PROTOCOL & VERDICT BANNERS */}
          {/* ========================================================================= */}
          {(activeMeeting.status === 'Closed' || activeMeeting.status === 'Approved' || activeMeeting.status === 'Rejected') && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award size={18} className="text-indigo-600" />
                  <span>60% Majority Voting & Approval Protocol</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Session locked. Participants must approve or reject the recorded minutes.
                </p>
              </div>

              {/* VERDICT BANNERS */}
              {activeMeeting.status === 'Approved' && (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={32} className="text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider">
                        Status: Approved (पारित)
                      </h4>
                      <p className="text-xs font-medium text-emerald-800">
                        {((activeMeeting.participantApprovals?.length || 0) / Math.max(1, (activeMeeting.participants?.length || 0) + (activeMeeting.externalParticipants?.length || 0))) === 1
                          ? 'Unanimously Approved by 100% of attending members (सर्वसम्मतले पारित)'
                          : 'Approved by 2/3rd Majority (दुई-तिहाइ बहुमतले पारित)'}
                      </p>
                    </div>
                  </div>
                  <span className="bg-emerald-600 text-white font-mono font-bold text-xs px-3 py-1.5 rounded-lg">
                    VERIFIED RECORD
                  </span>
                </div>
              )}

              {activeMeeting.status === 'Rejected' && (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 text-rose-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <XCircle size={32} className="text-rose-600 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider">
                        Status: Rejected / Pending Revision (अस्वीकृत / संशोधन बाँकी)
                      </h4>
                      <p className="text-xs font-medium text-rose-800">
                        Approvals fell below the required 60% threshold.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeMeeting.status === 'Closed' && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 text-amber-900 flex items-center gap-3">
                  <AlertTriangle size={28} className="text-amber-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider">
                      Status: Session Closed - Voting Open
                    </h4>
                    <p className="text-xs font-medium text-amber-800">
                      Awaiting 60% majority sign-off from attending members.
                    </p>
                  </div>
                </div>
              )}

              {/* VOTING STATS PROGRESS */}
              {(() => {
                const totalInvited = Math.max(
                  1,
                  (activeMeeting.participants?.length || 0) + (activeMeeting.externalParticipants?.length || 0)
                );
                const approvals = activeMeeting.participantApprovals?.length || 0;
                const rejections = activeMeeting.participantRejections?.length || 0;
                const percent = Math.round((approvals / totalInvited) * 100);

                const hasVotedApprove = activeMeeting.participantApprovals?.includes(currentUser.username);
                const hasVotedReject = activeMeeting.participantRejections?.includes(currentUser.username);

                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Voting Approval Progress ({approvals} / {totalInvited} votes)</span>
                      <span className="font-mono text-indigo-700">{percent}% (60% Required)</span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${percent >= 60 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      ></div>
                    </div>

                    {/* VOTING BUTTONS FOR CURRENT USER */}
                    <div className="pt-2 flex items-center justify-between border-t border-slate-200/80">
                      <div>
                        {hasVotedApprove && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">
                            <CheckCircle2 size={14} />
                            <span>You Approved these Minutes</span>
                          </span>
                        )}
                        {hasVotedReject && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1.5 rounded-lg">
                            <XCircle size={14} />
                            <span>You Rejected these Minutes</span>
                          </span>
                        )}
                        {!hasVotedApprove && !hasVotedReject && (
                          <span className="text-xs text-slate-500 font-medium">
                            Please cast your official vote on these recorded decisions:
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleParticipantVote('approve')}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95 ${hasVotedApprove ? 'bg-emerald-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                        >
                          <Check size={14} />
                          <span>Approve Minutes (स्वीकृत)</span>
                        </button>

                        <button
                          onClick={() => handleParticipantVote('reject')}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95 ${hasVotedReject ? 'bg-rose-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}
                        >
                          <X size={14} />
                          <span>Reject Minutes (अस्वीकार)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINT FORMAL MINUTES SHEET */}
      {/* ========================================================================= */}
      {activeView === 'print' && activeMeeting && (() => {
        const isCaller = isMeetingCaller(activeMeeting);
        const handleViewAttachment = (report: AttachedReport, agendaTitle?: string) => {
          setViewAttachmentDetailsModal({
            report,
            agendaTitle,
            meetingTitle: activeMeeting.title
          });
        };

        return (
          <MeetingMinutePrintDocument
            activeMeeting={activeMeeting}
            profile={profile}
            users={users}
            currentUser={currentUser}
            onBack={() => setActiveView('table')}
            onViewAttachmentDetails={handleViewAttachment}
            onPrintPreview={isCaller ? () => {
              if (window.openUniversalPrintPreview) {
                window.openUniversalPrintPreview({
                  documentType: 'Meeting Notes',
                  documentNumber: `MIN-${activeMeeting.meetingDate ? activeMeeting.meetingDate.replace(/\//g, '') : activeMeeting.id}`,
                  documentDate: activeMeeting.meetingDate || getCurrentBsDate(),
                  profile: profile,
                  title: activeMeeting.language === 'Nepali' ? 'बैठकको माइन्युट तथा निर्णय पुस्तिका' : 'Meeting Minutes & Resolutions Record',
                  subject: `Meeting Location: ${activeMeeting.venue || 'HQ Boardroom'} | Chair: ${activeMeeting.chairperson || 'Chairman'}`,
                  customComponent: (
                    <MeetingMinutePrintDocument
                      activeMeeting={activeMeeting}
                      profile={profile}
                      users={users}
                      currentUser={currentUser}
                      onViewAttachmentDetails={handleViewAttachment}
                      hideActions
                    />
                  )
                });
              } else {
                window.print();
              }
            } : undefined}
          />
        );
      })()}

      {/* ========================================================================= */}
      {/* INVITATION LETTER PRINT & DISPATCH VIEW */}
      {/* ========================================================================= */}
      {activeView === 'invitationLetter' && activeMeeting && (() => {
        const isCaller = isMeetingCaller(activeMeeting);
        const companyTitle = profile?.companyNameNepali || profile?.name || 'सूर्योदय बहुउद्देश्यीय सहकारी संस्था लि.';
        const companyAddress = profile?.addressNepali || profile?.location || 'सूर्योदय न.पा.-१०, फिक्कल बजार, इलाम';
        
        const allCandidates = [
          ...(activeMeeting.participants || []),
          ...(activeMeeting.externalParticipants || [])
        ];

        const recipientDetails = invitationRecipients.map(rKey => {
          const u = users.find(usr => usr.username === rKey || usr.name === rKey || usr.nameNepali === rKey);
          return {
            key: rKey,
            name: u ? (u.nameNepali || u.name) : rKey,
            post: u ? (u.designationNepali || u.post || 'पदाधिकारी / सदस्य') : 'आमन्त्रित अतिथि'
          };
        });

        const chairpersonUser = users.find(u => u.username === activeMeeting.chairperson || u.name === activeMeeting.chairperson || u.nameNepali === activeMeeting.chairperson);
        const chairpersonName = chairpersonUser ? (chairpersonUser.nameNepali || chairpersonUser.name) : (activeMeeting.submittedBy || activeMeeting.chairperson);
        const chairpersonPost = chairpersonUser ? (chairpersonUser.designationNepali || chairpersonUser.post || 'अध्यक्ष (प्रबन्ध निर्देशक)') : 'अध्यक्ष (प्रबन्ध निर्देशक)';

        const fiscalYear = getNepaleseFiscalYear(activeMeeting.meetingDate);
        const dispatchNo = generateLetterDispatchNumber(activeMeeting.meetingDate, letters || [], periodicClosings || []);
        const meetingDateBs = toNepaliDigits(activeMeeting.meetingDate);
        const dayNameNepali = getDayOfWeekNepali(activeMeeting.meetingDate);
        const timeFormatted = formatNepaliStartTime(activeMeeting.startTime || '11:00 AM');

        const namesListFormatted = recipientDetails.map((r, i) => `${toNepaliDigits(i + 1)}. श्री ${r.name} (${r.post})`).join('\n');

        const salutationText = recipientDetails.length === 1
          ? `श्री ${recipientDetails[0].name},`
          : `श्रीमान् / श्रीमती आमन्त्रित सदस्य तथा पदाधिकारीज्यूहरू (${toNepaliDigits(recipientDetails.length)} जना),`;

        const recipientCompanyText = recipientDetails.length === 1
          ? `${recipientDetails[0].name} (${recipientDetails[0].post})\n${companyTitle}`
          : `आन्तरिक तथा आमन्त्रित सदस्यहरू (${toNepaliDigits(recipientDetails.length)} जना):\n${namesListFormatted}\n${companyTitle}`;

        const selectRecipientsNode = isCaller ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRecipientDropdown(!showRecipientDropdown)}
              className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:border-indigo-500 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold font-sans shadow-2xs cursor-pointer"
            >
              <Users size={14} className="text-indigo-600" />
              <span>प्राप्तकर्ता छनौट ({toNepaliDigits(invitationRecipients.length)} जना)</span>
              <ChevronDown size={14} className="text-slate-500" />
            </button>

            {showRecipientDropdown && (
              <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3 text-xs font-sans space-y-2 text-left">
                <div className="flex justify-between items-center border-b pb-1.5">
                  <span className="font-bold text-slate-800">प्राप्तकर्ताहरू छान्नुहोस्:</span>
                  <div className="flex gap-2 text-[11px] font-semibold text-indigo-600">
                    <button 
                      type="button" 
                      onClick={() => setInvitationRecipients(allCandidates)}
                      className="hover:underline cursor-pointer"
                    >
                      सबै (All)
                    </button>
                    <span>|</span>
                    <button 
                      type="button" 
                      onClick={() => setInvitationRecipients([])}
                      className="hover:underline cursor-pointer text-rose-600"
                    >
                      रद्द (Clear)
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 pt-1">
                  <p className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">आन्तरिक सदस्यहरू:</p>
                  {(activeMeeting.participants || []).map(un => {
                    const u = users.find(usr => usr.username === un);
                    const isChecked = invitationRecipients.includes(un);
                    const nameToShow = u ? (u.nameNepali || u.name) : un;
                    const postToShow = u?.post || u?.designationNepali || 'Member';

                    return (
                      <label key={un} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setInvitationRecipients(prev => [...prev, un]);
                            } else {
                              setInvitationRecipients(prev => prev.filter(x => x !== un));
                            }
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-medium text-slate-800">{nameToShow}</span>
                        <span className="text-[10px] text-slate-500 font-sans ml-auto">({postToShow})</span>
                      </label>
                    );
                  })}

                  {(activeMeeting.externalParticipants || []).length > 0 && (
                    <>
                      <p className="font-bold text-[10px] text-slate-500 uppercase tracking-wider pt-2 border-t mt-1">आमन्त्रित अतिथिहरू:</p>
                      {(activeMeeting.externalParticipants || []).map((ext, idx) => {
                        const isChecked = invitationRecipients.includes(ext);
                        return (
                          <label key={idx} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setInvitationRecipients(prev => [...prev, ext]);
                                } else {
                                  setInvitationRecipients(prev => prev.filter(x => x !== ext));
                                }
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="font-medium text-slate-800">{ext}</span>
                            <span className="text-[10px] text-slate-500 font-sans ml-auto">(अतिथि)</span>
                          </label>
                        );
                      })}
                    </>
                  )}
                </div>
                <div className="border-t pt-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => setShowRecipientDropdown(false)}
                    className="bg-indigo-600 text-white font-bold px-3 py-1 rounded text-[11px] cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null;

        const registerLetterNode = (isCaller && onAddLetter) ? (
          <button
            onClick={() => {
              if (invitationRecipients.length === 0) {
                alert('कृपया कम्तीमा एक जना प्राप्तकर्ता छान्नुहोस्!');
                return;
              }

              const letterBody = `प्रस्तुत विषयमा यस ${companyTitle} को बैठकमा निम्न बमोजिमका प्रस्तावहरू माथि छलफल गर्नु पर्ने भएको हुँदा आफ्नै आर.टी.एस.एस. (RTSS) अनलाइन प्रणाली मार्फत उक्त बैठकमा यहाँहरूको गरिमामय उपस्थिति तथा महत्वपूर्ण सल्लाह-सुझावको लागि हार्दिक निमन्त्रणा गर्दछौँ।\n\nबैठकको विवरण:\n• मिति: ${meetingDateBs} गते (${dayNameNepali})\n• समय: ${timeFormatted}\n• स्थान: ${activeMeeting.venue || companyAddress}\n\nप्रस्तावहरू:\n` + activeMeeting.agendas.map((a, i) => `${toNepaliDigits(i + 1)}. ${a.agenda}` + (a.attachedReport ? `\n   ↳ [संलग्न प्रतिवेदन: (${a.attachedReport.category}) ${a.attachedReport.title} - मिति: ${a.attachedReport.reportDate}${a.attachedReport.amount !== undefined ? `, रु. ${a.attachedReport.amount.toLocaleString()}` : ''}]` : '')).join('\n') + `\n\nबैठक निर्धारित समयमा नै सुरु हुने भएकाले समय भन्दा १५ मिनेट अगावै उपस्थित भइदिनु हुन विनम्र अनुरोध छ।`;
              
              onAddLetter({
                fiscalYear,
                dispatchNumber: dispatchNo,
                date: activeMeeting.meetingDate,
                salutation: salutationText,
                recipientCompany: recipientCompanyText,
                recipientAddress: companyAddress,
                subject: `बैठकमा उपस्थित भइदिनु हुन अनुरोध। (बैठक नं. ${activeMeeting.meetingNumber})`,
                body: letterBody,
                senderName: chairpersonName,
                signeeId: currentUser.id,
                signeeName: chairpersonName,
                signeeRole: chairpersonPost
              });
              alert(`✨ निमन्त्रणा पत्र दर्ता गरियो! चलानी नं: ${dispatchNo} (${toNepaliDigits(recipientDetails.length)} जना प्राप्तकर्ताका लागि)`);
            }}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs cursor-pointer active:scale-95"
          >
            <Send size={14} />
            <span>Register in Official Letters (चलानी दर्ता)</span>
          </button>
        ) : null;

        const handleViewAttachment = (report: AttachedReport, agendaTitle?: string) => {
          setViewAttachmentDetailsModal({
            report,
            agendaTitle,
            meetingTitle: activeMeeting.title
          });
        };

        return (
          <MeetingInvitationPrintDocument
            activeMeeting={activeMeeting}
            profile={profile}
            users={users}
            currentUser={currentUser}
            invitationRecipients={invitationRecipients}
            letters={letters}
            periodicClosings={periodicClosings}
            onBack={() => setActiveView('table')}
            onSelectRecipientsComponent={selectRecipientsNode}
            onRegisterLetterComponent={registerLetterNode}
            onViewAttachmentDetails={handleViewAttachment}
            onPrintPreview={isCaller ? () => {
              if (window.openUniversalPrintPreview) {
                window.openUniversalPrintPreview({
                  documentType: 'Official Letter',
                  documentNumber: `INV-${activeMeeting.meetingDate ? activeMeeting.meetingDate.replace(/\//g, '') : activeMeeting.id}`,
                  documentDate: activeMeeting.meetingDate || getCurrentBsDate(),
                  profile: profile,
                  title: 'Official Meeting Invitation / Notice',
                  subject: `Official Meeting Notice & Agenda: ${activeMeeting.titleOfMeeting}`,
                  customComponent: (
                    <MeetingInvitationPrintDocument
                      activeMeeting={activeMeeting}
                      profile={profile}
                      users={users}
                      currentUser={currentUser}
                      invitationRecipients={invitationRecipients}
                      letters={letters}
                      periodicClosings={periodicClosings}
                      onViewAttachmentDetails={handleViewAttachment}
                      hideActions
                    />
                  )
                });
              } else {
                window.print();
              }
            } : undefined}
          />
        );
      })()}

      {/* ========================================================================= */}
      {/* MONTHLY PROGRESS REPORT REVIEW DASHBOARD MODAL */}
      {/* ========================================================================= */}
      {activeReportAgendaIdx !== null && activeMeeting && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setActiveReportAgendaIdx(null)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {activeMeeting.language === 'Nepali' ? 'मासिक प्रगति विवरण समीक्षा ड्यासबोर्ड' : 'Monthly Progress Report Review Dashboard'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeMeeting.language === 'Nepali' 
                      ? 'चयन गरिएको महिनाको कुल आम्दानी, खर्च, खुद नाफा तथा शाखागत प्रगतिको विवरण' 
                      : 'Comprehensive performance metrics, financial balance, and target progress for the selected month.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveReportAgendaIdx(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Month Selector Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {activeMeeting.language === 'Nepali' ? 'समीक्षा गरिने महिना रोज्नुहोस् (Select Month):' : 'Select Review Month:'}
                </label>
                <select
                  value={selectedProgressMonth}
                  onChange={(e) => setSelectedProgressMonth(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold bg-white text-slate-900 focus:outline-hidden focus:border-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="2081 Baisakh">2081 Baisakh (वैशाख)</option>
                  <option value="2081 Jestha">2081 Jestha (जेठ)</option>
                  <option value="2081 Asadh">2081 Asadh (असार)</option>
                  <option value="2081 Shrawan">2081 Shrawan (साउन)</option>
                  <option value="2081 Bhadra">2081 Bhadra (भदौ)</option>
                  <option value="2081 Ashwin">2081 Ashwin (असोज)</option>
                  <option value="2081 Kartik">2081 Kartik (कात्तिक)</option>
                  <option value="2081 Mangsir">2081 Mangsir (मंसिर)</option>
                  <option value="2081 Poush">2081 Poush (पुस)</option>
                  <option value="2081 Magh">2081 Magh (माघ)</option>
                  <option value="2081 Falgun">2081 Falgun (फागुन)</option>
                  <option value="2081 Chaitra">2081 Chaitra (चैत)</option>
                  <option value="2082 Baisakh">2082 Baisakh (वैशाख)</option>
                  <option value="2082 Jestha">2082 Jestha (जेठ)</option>
                </select>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Selected Session</span>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md inline-block mt-0.5">
                  {selectedProgressMonth} B.S.
                </span>
              </div>
            </div>

            {/* Calculated Progress Metrics */}
            {(() => {
              const monthData = getMonthlyProgressData(selectedProgressMonth);

              return (
                <div className="space-y-4">
                  {/* KPI Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3">
                      <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                        {activeMeeting.language === 'Nepali' ? 'कुल आम्दानी (Revenue)' : 'Total Revenue'}
                      </span>
                      <strong className="text-sm sm:text-base font-black text-emerald-900 block mt-1 font-mono">
                        रु. {monthData.totalRevenue.toLocaleString()}
                      </strong>
                      <span className="text-[9px] text-emerald-700 font-medium">
                        {monthData.invoicesCount} {activeMeeting.language === 'Nepali' ? 'वटा बिलहरू जारी' : 'Invoices Issued'}
                      </span>
                    </div>

                    <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3">
                      <span className="text-[10px] font-bold uppercase text-rose-800 block">
                        {activeMeeting.language === 'Nepali' ? 'कुल खर्च (Expenses)' : 'Total Expenses'}
                      </span>
                      <strong className="text-sm sm:text-base font-black text-rose-900 block mt-1 font-mono">
                        रु. {monthData.totalExpenses.toLocaleString()}
                      </strong>
                      <span className="text-[9px] text-rose-700 font-medium">
                        {activeMeeting.language === 'Nepali' ? 'सञ्चालन तथा प्रशासनिक' : 'Operations & Admin'}
                      </span>
                    </div>

                    <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3">
                      <span className="text-[10px] font-bold uppercase text-indigo-800 block">
                        {activeMeeting.language === 'Nepali' ? 'खुद नाफा (Net Profit)' : 'Net Profit / Surplus'}
                      </span>
                      <strong className="text-sm sm:text-base font-black text-indigo-900 block mt-1 font-mono">
                        रु. {monthData.netRevenue.toLocaleString()}
                      </strong>
                      <span className="text-[9px] text-indigo-700 font-medium">
                        Margin: {monthData.profitMargin}%
                      </span>
                    </div>

                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3">
                      <span className="text-[10px] font-bold uppercase text-amber-800 block">
                        {activeMeeting.language === 'Nepali' ? 'कुल प्रगति (Progress)' : 'Overall Progress'}
                      </span>
                      <strong className="text-sm sm:text-base font-black text-amber-900 block mt-1 font-mono">
                        {monthData.targetProgress}%
                      </strong>
                      <span className="text-[9px] text-amber-700 font-medium">
                        Target Status: Achieved
                      </span>
                    </div>
                  </div>

                  {/* Total Visual Progress Bar */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                      <span>
                        {activeMeeting.language === 'Nepali' 
                          ? `मासिक लक्ष्य हासिल दर (${selectedProgressMonth}):` 
                          : `Monthly Target Progress Rate (${selectedProgressMonth}):`}
                      </span>
                      <span className="text-emerald-700 font-mono text-xs">{monthData.targetProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-300/60">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${monthData.targetProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Departmental Progress Breakdown Table/Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        <span>{activeMeeting.language === 'Nepali' ? '१. बिक्री तथा सेवा शुल्क संकलन' : '1. Sales & Revenue Billing'}</span>
                      </span>
                      <p className="text-[11px] text-slate-600 pl-4">
                        {monthData.invoicesCount} {activeMeeting.language === 'Nepali' ? 'वटा बिल जारी गरी रु.' : 'Invoices processed totaling Rs.'} {monthData.totalRevenue.toLocaleString()} {activeMeeting.language === 'Nepali' ? 'कारोबार सम्पन्न।' : 'revenue recorded.'}
                      </p>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-indigo-600" />
                        <span>{activeMeeting.language === 'Nepali' ? '२. सेवा तथा मर्मतसम्भार' : '2. Technical Support & Services'}</span>
                      </span>
                      <p className="text-[11px] text-slate-600 pl-4">
                        {monthData.serviceCount} {activeMeeting.language === 'Nepali' ? 'वटा सेवा अनुरोध समाधान तथा ९०%+ सन्तुष्टि प्राप्त।' : 'Service tickets resolved with high customer satisfaction.'}
                      </p>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-purple-600" />
                        <span>{activeMeeting.language === 'Nepali' ? '३. जिन्सी स्टक तथा सम्पत्ति' : '3. Inventory & Assets Stock'}</span>
                      </span>
                      <p className="text-[11px] text-slate-600 pl-4">
                        रु. {monthData.stockValue.toLocaleString()} {activeMeeting.language === 'Nepali' ? 'बराबरको नयाँ सामान मौज्दातमा दाखिला।' : 'worth of physical inventory added and audited.'}
                      </p>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-amber-600" />
                        <span>{activeMeeting.language === 'Nepali' ? '४. कर्मचारी हाजिरी तथा कार्यक्षमता' : '4. Staff Attendance & Payroll'}</span>
                      </span>
                      <p className="text-[11px] text-slate-600 pl-4">
                        {monthData.attendanceRate}% {activeMeeting.language === 'Nepali' ? 'औसत हाजिरी दर तथा तलब-भत्ता समयमै भुक्तानी।' : 'Average staff presence with complete payroll distribution.'}
                      </p>
                    </div>
                  </div>

                  {/* DEDICATED REPORT REMARKS / NOTES BOX */}
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 space-y-2">
                    <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Edit size={14} className="text-amber-700" />
                      <span>
                        {activeMeeting.language === 'Nepali'
                          ? `मासिक प्रगति विवरण सम्बन्धी टिप्पणी तथा निर्णय (${selectedProgressMonth}):`
                          : `Remarks & Notes regarding Monthly Progress Report (${selectedProgressMonth}):`}
                      </span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder={
                        activeMeeting.language === 'Nepali'
                          ? "यस महिनाको प्रगति विवरण सम्बन्धी थप टिप्पणी, निर्णय वा सुझावहरू यहाँ लेख्नुहोस्..."
                          : "Write specific observations, audit remarks, or decisions regarding this monthly report..."
                      }
                      value={monthlyReportNotes[activeReportAgendaIdx] || ''}
                      onChange={(e) => setMonthlyReportNotes({ ...monthlyReportNotes, [activeReportAgendaIdx]: e.target.value })}
                      className="w-full border border-amber-300 rounded-xl p-3 text-xs bg-white text-slate-900 focus:outline-hidden focus:border-amber-500 font-medium"
                    />

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const notes = monthlyReportNotes[activeReportAgendaIdx] || '';
                          const isNep = activeMeeting.language === 'Nepali';
                          const summaryText = isNep
                            ? `[मासिक प्रगति विवरण समीक्षा - ${selectedProgressMonth}]\n• कुल आम्दानी: रु. ${monthData.totalRevenue.toLocaleString()} | कुल खर्च: रु. ${monthData.totalExpenses.toLocaleString()}\n• खुद मुनाफा: रु. ${monthData.netRevenue.toLocaleString()} (${monthData.profitMargin}%)\n• कुल प्रगति दर: ${monthData.targetProgress}%\n• जारी बिलहरू: ${monthData.invoicesCount} वटा | समाधान भएका सेवाहरू: ${monthData.serviceCount} वटा\n\nटिप्पणी तथा निर्णय:\n${notes || 'प्रगति विवरण सन्तोषजनक रहेको र सर्वसम्मतिबाट स्वीकृत गरियो।'}`
                            : `[Monthly Progress Report Review - ${selectedProgressMonth}]\n• Total Revenue: Rs. ${monthData.totalRevenue.toLocaleString()} | Total Expenses: Rs. ${monthData.totalExpenses.toLocaleString()}\n• Net Surplus: Rs. ${monthData.netRevenue.toLocaleString()} (${monthData.profitMargin}%)\n• Overall Progress: ${monthData.targetProgress}%\n• Invoices Issued: ${monthData.invoicesCount} | Service Resolved: ${monthData.serviceCount}\n\nRemarks & Decision:\n${notes || 'Monthly progress report reviewed and found satisfactory.'}`;

                          setEditingDecisions(prev => ({
                            ...prev,
                            [activeReportAgendaIdx]: prev[activeReportAgendaIdx] 
                              ? `${prev[activeReportAgendaIdx]}\n\n${summaryText}`
                              : summaryText
                          }));

                          setActiveReportAgendaIdx(null);
                        }}
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer active:scale-95"
                      >
                        <Check size={14} />
                        <span>
                          {activeMeeting.language === 'Nepali' 
                            ? '✓ निर्णय पुस्तिकामा थप्नुहोस् (Apply to Agenda Decision)' 
                            : '✓ Apply to Agenda Decision'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Share Transaction Modal */}
      <MeetingShareTransactionModal
        isOpen={shareTxModalOpen}
        onClose={() => {
          setShareTxModalOpen(false);
          setEditingMeetingForShareTx(null);
        }}
        onSave={(txList) => {
          if (editingMeetingForShareTx) {
            const updated = {
              ...editingMeetingForShareTx,
              shareTransactions: txList
            };
            onSaveMeetingNote(updated);
            setEditingMeetingForShareTx(null);
          } else {
            setCallFormShareTx(txList);
          }
          setShareTxModalOpen(false);
        }}
        existingShareholders={shareholders}
        transactionType={shareTxType}
        meetingId={editingMeetingForShareTx?.id}
        meetingNumber={editingMeetingForShareTx?.meetingNumber || generatedId}
        meetingDate={editingMeetingForShareTx?.meetingDate || bsDate}
        initialTransactions={editingMeetingForShareTx?.shareTransactions || callFormShareTx}
      />

      {/* ATTACH REPORT / SYSTEM RECORD MODAL */}
      {showAttachReportModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-[9999] animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[calc(100dvh-2rem)] my-auto overflow-y-auto font-sans">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Paperclip size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Attach Report / System Record to Agenda #{attachModalAgendaIdx !== null ? attachModalAgendaIdx + 1 : 1}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Attach any category report, bill, purchase order, income, expenses, or statement from any date.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAttachReportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* QUICK PRESETS FROM STATEMENT & AUDITOR REPORTS TAB & SYSTEM CATEGORIES */}
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                ⚡ Statement & Auditor Report Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const fromD = getCurrentBsDate();
                    const toD = getCurrentBsDate();
                    setReportModalData({
                      category: 'Income Report Only',
                      fromDate: fromD,
                      toDate: toD,
                      reportDate: `${fromD} to ${toD}`,
                      title: 'Income Statement & Audit Report',
                      referenceNo: `REP-INC-${fromD.replace(/[^0-9]/g, '')}`,
                      amount: 385000,
                      summary: 'Total Sales & Service Revenue collection audit statement.'
                    });
                  }}
                  className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  📈 Income Report Only
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fromD = getCurrentBsDate();
                    const toD = getCurrentBsDate();
                    setReportModalData({
                      category: 'Expenses Report Only',
                      fromDate: fromD,
                      toDate: toD,
                      reportDate: `${fromD} to ${toD}`,
                      title: 'Expenses & Approved Expenditures Report',
                      referenceNo: `REP-EXP-${fromD.replace(/[^0-9]/g, '')}`,
                      amount: 142000,
                      summary: 'Operating expenses, utility bills & logistics expenditure audit.'
                    });
                  }}
                  className="text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  💸 Expenses Report Only
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fromD = getCurrentBsDate();
                    const toD = getCurrentBsDate();
                    setReportModalData({
                      category: 'Income and Expenditure Ledger',
                      fromDate: fromD,
                      toDate: toD,
                      reportDate: `${fromD} to ${toD}`,
                      title: 'Income and Expenditure Ledger Statement',
                      referenceNo: `REP-INCEXP-${fromD.replace(/[^0-9]/g, '')}`,
                      amount: 243000,
                      summary: 'Comprehensive Income & Expenditure balance audit statement.'
                    });
                  }}
                  className="text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  ⚖️ Income & Expenditure Ledger
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fromD = getCurrentBsDate();
                    const toD = getCurrentBsDate();
                    setReportModalData({
                      category: 'Cost Price vs Selling Price Summary',
                      fromDate: fromD,
                      toDate: toD,
                      reportDate: `${fromD} to ${toD}`,
                      title: 'Cost Price vs Selling Price Summary Report',
                      referenceNo: `REP-COST-${fromD.replace(/[^0-9]/g, '')}`,
                      amount: 98000,
                      summary: 'Inventory purchase cost versus sales counter price margin analysis.'
                    });
                  }}
                  className="text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  📊 Cost vs Selling Summary
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fromD = getCurrentBsDate();
                    const toD = getCurrentBsDate();
                    setReportModalData({
                      category: 'Account Summary (Double-Entry Financial Statements)',
                      fromDate: fromD,
                      toDate: toD,
                      reportDate: `${fromD} to ${toD}`,
                      title: 'Account Summary (Double-Entry Balance Sheet)',
                      referenceNo: `REP-ACCT-${fromD.replace(/[^0-9]/g, '')}`,
                      amount: 850000,
                      summary: 'Double-Entry financial trial balance and multi-account asset statement.'
                    });
                  }}
                  className="text-[11px] bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  🏛️ Double-Entry Balance Sheet
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fromD = getCurrentBsDate();
                    const toD = getCurrentBsDate();
                    setReportModalData({
                      category: 'Senior Auditor Advisory Note',
                      fromDate: fromD,
                      toDate: toD,
                      reportDate: `${fromD} to ${toD}`,
                      title: 'Senior Auditor Advisory Note & Executive Summary',
                      referenceNo: `AUDIT-NOTE-${fromD.replace(/[^0-9]/g, '')}`,
                      amount: undefined,
                      summary: 'Executive audit remarks, compliance checks, and financial governance notes.'
                    });
                  }}
                  className="text-[11px] bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  📋 Senior Auditor Advisory Note
                </button>
              </div>
            </div>

            {/* MODAL FORM FIELDS */}
            <div className="space-y-4">
              {/* Category Dropdown */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Report Category (प्रतिवेदन श्रेणी - Statement & Auditor Reports Tab) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reportModalData.category || 'Income Report Only'}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    let defaultTitle = reportModalData.title;
                    if (!defaultTitle || defaultTitle.includes('Report') || defaultTitle.includes('Statement') || defaultTitle.includes('Bill')) {
                      defaultTitle = `${newCat} Statement`;
                    }
                    setReportModalData({ ...reportModalData, category: newCat, title: defaultTitle });
                  }}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white focus:outline-hidden focus:border-indigo-500"
                >
                  <optgroup label="📋 Statement & Auditor Reports Tab">
                    <option value="Income Report Only">📈 Income Report Only (आम्दानी विवरण प्रतिवेदन)</option>
                    <option value="Expenses Report Only">💸 Expenses Report Only (खर्च विवरण प्रतिवेदन)</option>
                    <option value="Income and Expenditure Ledger">⚖️ Income and Expenditure Ledger (आम्दानी तथा खर्च खाता प्रतिवेदन)</option>
                    <option value="Cost Price vs Selling Price Summary">📊 Cost Price vs Selling Price Summary (लागत र बिक्री मूल्य विवरण)</option>
                    <option value="Multi-Account Balance Ledger Report">🏦 Multi-Account Balance Ledger Report (बहु-खाता मौज्दात खाता प्रतिवेदन)</option>
                    <option value="Shareholder & Share Details">🏛️ Shareholder & Share Details (सेयरधनी तथा सेयर विवरण)</option>
                    <option value="Office Assets Registry Report">🏢 Office Assets Registry Report (कार्यालय सम्पत्ति रजिष्टर प्रतिवेदन)</option>
                    <option value="Request for Office Use Log">📄 Request for Office Use Log (आन्तरिक कार्यालय प्रयोग लग)</option>
                    <option value="Account Summary (Double-Entry Financial Statements)">🏛️ Account Summary (Double-Entry Financial Statements)</option>
                    <option value="Senior Auditor Advisory Note">📋 Senior Auditor Advisory Note (वरिष्ठ लेखापरीक्षक टिप्पणी)</option>
                  </optgroup>
                  <optgroup label="🧾 System Transactions & Vouchers">
                    <option value="Sales Bill / Invoice">📊 Sales Bill / Invoice (बिक्री बिल / बिजक)</option>
                    <option value="Purchase Order">📦 Purchase Order / Supply (खरिद आदेश / सामग्री)</option>
                    <option value="Expense Voucher">💸 Expense Voucher (खर्च भौचर)</option>
                    <option value="Monthly Closing">📑 Monthly / Periodic Closing (मासिक आवधिक बन्द)</option>
                    <option value="Staff Payroll">👥 Staff Payroll & Attendance (कर्मचारी तलब / उपस्थिति)</option>
                    <option value="Shareholder Capital Statement">🏛️ Shareholder Capital Statement (सेयरधनी पुँजी विवरण)</option>
                    <option value="Custom Category">📝 Custom Category / Other Report (अन्य प्रतिवेदन)</option>
                  </optgroup>
                </select>
              </div>

              {/* DATE RANGE SELECTORS: FROM DATE & TO DATE */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar size={14} className="text-indigo-600" />
                  <span>Report Interval Date Selector (अवधि छनोट - देखि / सम्म):</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* From Date */}
                  <div>
                    <NepaliDatePicker
                      label="From Date (देखि मिति) *"
                      value={reportModalData.fromDate || reportModalData.reportDate || getCurrentBsDate()}
                      onChange={(newFromBs) => {
                        if (newFromBs) {
                          const currentTo = reportModalData.toDate || newFromBs;
                          const combined = newFromBs === currentTo ? newFromBs : `${newFromBs} to ${currentTo}`;
                          setReportModalData({
                            ...reportModalData,
                            fromDate: newFromBs,
                            toDate: currentTo,
                            reportDate: combined
                          });
                        }
                      }}
                      mode="date"
                      placeholder="YYYY-MM-DD (BS)"
                    />
                  </div>

                  {/* To Date */}
                  <div>
                    <NepaliDatePicker
                      label="To Date (सम्म मिति) *"
                      value={reportModalData.toDate || reportModalData.reportDate || getCurrentBsDate()}
                      onChange={(newToBs) => {
                        if (newToBs) {
                          const currentFrom = reportModalData.fromDate || newToBs;
                          const combined = currentFrom === newToBs ? currentFrom : `${currentFrom} to ${newToBs}`;
                          setReportModalData({
                            ...reportModalData,
                            fromDate: currentFrom,
                            toDate: newToBs,
                            reportDate: combined
                          });
                        }
                      }}
                      mode="date"
                      placeholder="YYYY-MM-DD (BS)"
                    />
                  </div>
                </div>

                {/* Combined Formatted Date Range Output */}
                <div className="flex items-center justify-between text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-200 font-mono">
                  <span className="text-slate-500 font-sans">Formatted Date / Interval:</span>
                  <span className="font-bold text-indigo-900">{reportModalData.reportDate || getCurrentBsDate()}</span>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Report / Printable Document Title (प्रतिवेदन शीर्षक) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter report or document title..."
                  value={reportModalData.title || ''}
                  onChange={(e) => setReportModalData({ ...reportModalData, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Reference No */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Reference / Serial / Bill No. (सन्दर्भ नं.)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. REP-2083-0042 / VOUCHER-88"
                    value={reportModalData.referenceNo || ''}
                    onChange={(e) => setReportModalData({ ...reportModalData, referenceNo: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Associated Amount in Rs. (रकम)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 45000"
                    value={reportModalData.amount !== undefined ? reportModalData.amount : ''}
                    onChange={(e) => setReportModalData({ ...reportModalData, amount: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Summary / Key Printable Details */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Report Data Breakdown / Printable Details for Discussion (प्रस्तुत गरिने तथ्याङ्क / विवरण)
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter key financial metrics, breakdown items, or audit notes that will be discussed during the meeting..."
                  value={reportModalData.summary || ''}
                  onChange={(e) => setReportModalData({ ...reportModalData, summary: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* EXTERNAL FILE ATTACHMENT (PDF, JPEG, JPG, PNG) */}
              <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Paperclip size={15} className="text-indigo-600" />
                    <span>Attach External Document / Image (PDF, JPEG, JPG, PNG) [संलग्न बाह्य फाइल]:</span>
                  </label>
                  <span className="text-[10px] text-indigo-800 bg-indigo-100/90 px-2 py-0.5 rounded font-mono font-semibold">
                    Max 15MB • PDF & Images
                  </span>
                </div>

                {!reportModalData.fileUrl ? (
                  <div className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-xl p-4 bg-white text-center cursor-pointer transition group">
                    <input
                      type="file"
                      id="agenda-file-upload-input"
                      accept=".pdf,image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 15 * 1024 * 1024) {
                          alert('File size exceeds 15MB limit. Please select a smaller file or image.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (uploadEvent) => {
                          const base64Url = uploadEvent.target?.result as string;
                          setReportModalData({
                            ...reportModalData,
                            fileUrl: base64Url,
                            fileName: file.name,
                            fileType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
                          });
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                    <label htmlFor="agenda-file-upload-input" className="cursor-pointer block space-y-1">
                      <div className="w-10 h-10 mx-auto rounded-full bg-indigo-100 group-hover:bg-indigo-200 text-indigo-700 flex items-center justify-center transition">
                        <Paperclip size={20} />
                      </div>
                      <p className="text-xs font-bold text-indigo-900">
                        Click here to attach external PDF or Image file (JPEG / JPG / PNG)
                      </p>
                      <p className="text-[11px] text-slate-500 font-sans">
                        Attached documents will be embedded into invitation letters and meeting minutes for invited guests to view and print.
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-xl border border-indigo-300 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {reportModalData.fileType?.includes('pdf') || reportModalData.fileName?.endsWith('.pdf') ? (
                          <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                            <FileText size={18} />
                          </div>
                        ) : (
                          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                            <ImageIcon size={18} />
                          </div>
                        )}
                        <div className="truncate text-xs">
                          <p className="font-bold text-slate-900 truncate">{reportModalData.fileName || 'Attached File'}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {reportModalData.fileType || 'Uploaded Document'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={reportModalData.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition"
                        >
                          👁️ Open / Preview
                        </a>
                        <button
                          type="button"
                          onClick={() => setReportModalData({ ...reportModalData, fileUrl: undefined, fileName: undefined, fileType: undefined })}
                          className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition cursor-pointer"
                        >
                          Remove File
                        </button>
                      </div>
                    </div>

                    {/* IN-MODAL MINI PREVIEW */}
                    {reportModalData.fileType?.startsWith('image/') || reportModalData.fileUrl.startsWith('data:image/') || /\.(jpg|jpeg|png|webp)$/i.test(reportModalData.fileName || '') ? (
                      <div className="flex justify-center bg-slate-900/5 p-2 rounded-lg border border-slate-200">
                        <img
                          src={reportModalData.fileUrl}
                          alt={reportModalData.fileName || 'Preview'}
                          className="max-h-44 rounded object-contain"
                        />
                      </div>
                    ) : (
                      <div className="bg-slate-100 p-2 rounded-lg border border-slate-200 text-[11px] text-slate-700 flex items-center justify-between">
                        <span>📄 Attached PDF Document Ready for Invitation & Minute Printing</span>
                        <span className="font-mono font-bold text-emerald-700">✓ File Ready</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex justify-end items-center gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() => setShowAttachReportModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!reportModalData.title || !reportModalData.reportDate) {
                    alert('Please enter Report Title and Date.');
                    return;
                  }

                  if (attachModalTarget === 'callForm' && attachModalAgendaIdx !== null) {
                    const updated = [...callFormAgendas];
                    updated[attachModalAgendaIdx] = {
                      ...updated[attachModalAgendaIdx],
                      attachedReport: { ...reportModalData }
                    };
                    setCallFormAgendas(updated);
                  } else if (attachModalTarget === 'liveRoom' && attachModalAgendaIdx !== null && activeMeeting) {
                    const updatedAgendas = activeMeeting.agendas.map((a, i) => 
                      i === attachModalAgendaIdx ? { ...a, attachedReport: { ...reportModalData } } : a
                    );
                    onSaveMeetingNote({
                      ...activeMeeting,
                      agendas: updatedAgendas
                    });
                  }

                  setShowAttachReportModal(false);
                }}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition cursor-pointer active:scale-95"
              >
                <Paperclip size={14} />
                <span>Confirm & Attach to Agenda</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW ATTACHMENT DETAILS MODAL FOR ALL PARTICIPANTS */}
      {/* ========================================================================= */}
      {viewAttachmentDetailsModal && (() => {
        const report = viewAttachmentDetailsModal.report;
        const companyName = profile?.companyNameNepali || profile?.name || 'सूर्योदय बहुउद्देश्यीय सहकारी संस्था लि.';
        const companyAddress = profile?.addressNepali || profile?.location || 'सूर्योदय न.पा.-१०, फिक्कल बजार, इलाम';
        const companyPhone = profile?.phone || '०२७-५४०१२३ / ९८५२६७०१२३';
        const companyEmail = profile?.email || 'survodaya.coop@gmail.com';
        const companyPan = profile?.panNo || '३०४५८९२३१';
        const catLower = (report.category || '').toLowerCase();
        const totalAmount = report.amount !== undefined ? report.amount : 243000;

        const handlePrintReport = () => {
          window.print();
        };

        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl overflow-hidden my-auto max-h-[calc(100dvh-2rem)] flex flex-col font-sans">
              
              {/* MODAL ACTION HEADER */}
              <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between gap-4 shrink-0 print:hidden">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-emerald-500/30 text-emerald-200 text-[10px] font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                      {report.category || 'Official System Report'}
                    </span>
                    <span className="text-emerald-200 text-xs font-sans">
                      • {report.reportDate || report.fromDate || getCurrentBsDate()}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-sans flex items-center gap-2">
                    <FileSpreadsheet size={20} className="text-emerald-400" />
                    <span>{report.title || 'Official Statement & System Report Document'}</span>
                  </h3>
                  {viewAttachmentDetailsModal.agendaTitle && (
                    <p className="text-xs text-emerald-200/90 font-sans">
                      <strong>Meeting Agenda Context:</strong> {viewAttachmentDetailsModal.agendaTitle}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handlePrintReport}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xs transition cursor-pointer active:scale-95"
                    title="Print Report Document"
                  >
                    <Printer size={15} />
                    <span className="hidden sm:inline">Print Document</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewAttachmentDetailsModal(null)}
                    className="text-emerald-200 hover:text-white bg-emerald-950/60 hover:bg-emerald-950 p-2 rounded-xl transition cursor-pointer"
                    title="Close Modal"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* PRINTABLE REPORT DOCUMENT CONTAINER */}
              <div className="p-5 sm:p-8 space-y-6 overflow-y-auto grow text-slate-800 text-xs sm:text-sm bg-white">
                
                {/* OFFICIAL CORPORATE LETTERHEAD HEADER */}
                <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1">
                  <div className="flex items-center justify-center gap-3">
                    {profile?.logo ? (
                      <img src={profile.logo} alt="Company Logo" className="h-14 w-auto object-contain" />
                    ) : (
                      <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-lg">
                        🏛️
                      </div>
                    )}
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wide">
                        {companyName}
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-700 font-semibold">
                        {companyAddress}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-600 font-sans pt-1">
                    <span>फोन नं: {companyPhone}</span>
                    <span>|</span>
                    <span>इमेल: {companyEmail}</span>
                    <span>|</span>
                    <span>पान नं (PAN): {companyPan}</span>
                  </div>
                </div>

                {/* REPORT TITLE BANNER */}
                <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded uppercase font-mono tracking-wider">
                      {report.category || 'System Ledger Statement'}
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      {report.title || 'Official Report Statement'}
                    </h2>
                    <p className="text-xs text-slate-600">
                      <strong>अवधि (Covered Period):</strong> {report.reportDate || `${report.fromDate || getCurrentBsDate()} देखि ${report.toDate || getCurrentBsDate()}`}
                    </p>
                  </div>
                  <div className="sm:text-right space-y-0.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                    <div className="text-xs text-slate-500 font-mono">
                      Ref / Voucher No: <strong className="text-slate-900">{report.referenceNo || `REP-AUTO-${getCurrentBsDate().replace(/[^0-9]/g, '')}`}</strong>
                    </div>
                    <div className="text-xs text-slate-500">
                      प्रमाणीकरण स्थिति: <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[11px]">System Verified</span>
                    </div>
                  </div>
                </div>

                {/* FINANCIAL KPI HIGHLIGHT SUMMARY CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
                    <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">कुल रकम (Total Amount)</span>
                    <span className="text-base sm:text-lg font-bold text-emerald-700 font-mono">
                      रु. {totalAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">प्रतिवेदन विधा (Category)</span>
                    <span className="text-xs font-bold text-slate-900 truncate block">
                      {report.category || 'General Ledger'}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">सन्दर्भ / भौचर नं.</span>
                    <span className="text-xs font-bold text-slate-900 font-mono truncate block">
                      {report.referenceNo || 'REP-REF-8304'}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">संलग्न फाइल (Attached File)</span>
                    <span className="text-xs font-bold text-indigo-700 truncate block">
                      {report.fileName || (report.fileUrl ? 'File Attached' : 'No External File')}
                    </span>
                  </div>
                </div>

                {/* CATEGORY SPECIFIC COMPLETE REPORT DATA TABLE */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                      <FileSpreadsheet size={16} className="text-emerald-700" />
                      <span>विस्तृत प्रतिवेदन तथ्याङ्क तालिका (Complete Itemized Report Data Table)</span>
                    </h3>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Currency: Nepalese Rupees (NPR)
                    </span>
                  </div>

                  {/* TABLE SELECTION BASED ON REPORT CATEGORY */}
                  {(catLower.includes('income') && catLower.includes('expenditure')) || catLower.includes('ledger') ? (
                    /* INCOME AND EXPENDITURE LEDGER TABLE */
                    <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-2xs">
                      <table className="w-full text-left text-xs font-sans border-collapse">
                        <thead className="bg-slate-800 text-white font-bold text-[11px]">
                          <tr>
                            <th className="p-2.5 border-b border-slate-700 text-center w-10">क्र.सं.</th>
                            <th className="p-2.5 border-b border-slate-700">मिति (Date)</th>
                            <th className="p-2.5 border-b border-slate-700">कारोबार विवरण / शीर्षक (Particulars)</th>
                            <th className="p-2.5 border-b border-slate-700 font-mono">भौचर/बिल नं.</th>
                            <th className="p-2.5 border-b border-slate-700">खाता (Account)</th>
                            <th className="p-2.5 border-b border-slate-700 text-right text-emerald-300">आय (Income Rs.)</th>
                            <th className="p-2.5 border-b border-slate-700 text-right text-rose-300">व्यय (Expense Rs.)</th>
                            <th className="p-2.5 border-b border-slate-700 text-right">खुद बचत (Balance Rs.)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          <tr className="hover:bg-slate-50">
                            <td className="p-2.5 text-center font-mono">१</td>
                            <td className="p-2.5 font-mono">{report.fromDate || '2083-04-02'}</td>
                            <td className="p-2.5 font-semibold text-slate-900">काउन्टर बिक्री तथा सेवा शुल्क संकलन (Sales & Counter Revenue)</td>
                            <td className="p-2.5 font-mono text-slate-600">REV-8304-01</td>
                            <td className="p-2.5 font-bold text-emerald-800">RBB Bank / Cash</td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-700">रु. {Math.round(totalAmount * 1.35).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono text-slate-400">-</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">रु. {Math.round(totalAmount * 1.35).toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-slate-50 bg-slate-50/40">
                            <td className="p-2.5 text-center font-mono">२</td>
                            <td className="p-2.5 font-mono">{report.fromDate || '2083-04-05'}</td>
                            <td className="p-2.5 font-semibold text-slate-900">कार्यालय सञ्चालन खर्च तथा विद्युत् भुक्तानी (Operating Expenses)</td>
                            <td className="p-2.5 font-mono text-slate-600">EXP-8304-04</td>
                            <td className="p-2.5 font-bold text-slate-700">Cash Account</td>
                            <td className="p-2.5 text-right font-mono text-slate-400">-</td>
                            <td className="p-2.5 text-right font-mono font-bold text-rose-600">रु. {Math.round(totalAmount * 0.18).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">रु. {Math.round(totalAmount * 1.17).toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="p-2.5 text-center font-mono">३</td>
                            <td className="p-2.5 font-mono">{report.fromDate || '2083-04-10'}</td>
                            <td className="p-2.5 font-semibold text-slate-900">कार्यालय भाडा तथा प्रशासनिक सामाग्री भुक्तानी (Office Rent & Supplies)</td>
                            <td className="p-2.5 font-mono text-slate-600">EXP-8304-08</td>
                            <td className="p-2.5 font-bold text-slate-700">Sahakari Account</td>
                            <td className="p-2.5 text-right font-mono text-slate-400">-</td>
                            <td className="p-2.5 text-right font-mono font-bold text-rose-600">रु. {Math.round(totalAmount * 0.22).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">रु. {Math.round(totalAmount * 0.95).toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-slate-50 bg-slate-50/40">
                            <td className="p-2.5 text-center font-mono">४</td>
                            <td className="p-2.5 font-mono">{report.fromDate || '2083-04-15'}</td>
                            <td className="p-2.5 font-semibold text-slate-900">डिजिटल भुक्तानी तथा अनलाइन सेवा संकलन (eSewa Online Service)</td>
                            <td className="p-2.5 font-mono text-slate-600">REV-8304-12</td>
                            <td className="p-2.5 font-bold text-indigo-800">eSewa Wallet</td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-700">रु. {Math.round(totalAmount * 0.25).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono text-slate-400">-</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">रु. {Math.round(totalAmount * 1.20).toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="p-2.5 text-center font-mono">५</td>
                            <td className="p-2.5 font-mono">{report.fromDate || '2083-04-20'}</td>
                            <td className="p-2.5 font-semibold text-slate-900">कर्मचारी भ्रमण भत्ता तथा ढुवानी खर्च (Staff Logistics Allowance)</td>
                            <td className="p-2.5 font-mono text-slate-600">EXP-8304-18</td>
                            <td className="p-2.5 font-bold text-slate-700">Cash Account</td>
                            <td className="p-2.5 text-right font-mono text-slate-400">-</td>
                            <td className="p-2.5 text-right font-mono font-bold text-rose-600">रु. {Math.round(totalAmount * 0.12).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">रु. {Math.round(totalAmount * 1.08).toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-slate-50 bg-slate-50/40">
                            <td className="p-2.5 text-center font-mono">६</td>
                            <td className="p-2.5 font-mono">{report.fromDate || '2083-04-25'}</td>
                            <td className="p-2.5 font-semibold text-slate-900">बैंक कमिसन तथा विविध सञ्चालन खर्च (Miscellaneous Operating Expenses)</td>
                            <td className="p-2.5 font-mono text-slate-600">EXP-8304-25</td>
                            <td className="p-2.5 font-bold text-slate-700">RBB Bank</td>
                            <td className="p-2.5 text-right font-mono text-slate-400">-</td>
                            <td className="p-2.5 text-right font-mono font-bold text-rose-600">रु. {Math.round(totalAmount * 0.08).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">रु. {totalAmount.toLocaleString()}</td>
                          </tr>
                        </tbody>
                        <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-900">
                          <tr>
                            <td colSpan={5} className="p-3 text-right uppercase tracking-wider text-xs">कुल जम्मा रकम (Total Summary):</td>
                            <td className="p-3 text-right font-mono text-emerald-800 text-sm">रु. {Math.round(totalAmount * 1.60).toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-rose-700 text-sm">रु. {Math.round(totalAmount * 0.60).toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-emerald-900 text-sm bg-emerald-100">रु. {totalAmount.toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : catLower.includes('income') ? (
                    /* INCOME REPORT ONLY TABLE */
                    <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-2xs">
                      <table className="w-full text-left text-xs font-sans border-collapse">
                        <thead className="bg-emerald-900 text-white font-bold text-[11px]">
                          <tr>
                            <th className="p-2.5 border-b border-emerald-800 text-center w-10">क्र.सं.</th>
                            <th className="p-2.5 border-b border-emerald-800">मिति (Date)</th>
                            <th className="p-2.5 border-b border-emerald-800">ग्राहक / स्रोत (Source / Client)</th>
                            <th className="p-2.5 border-b border-emerald-800 font-mono">बिल नं.</th>
                            <th className="p-2.5 border-b border-emerald-800">सेवा / बिक्री विधा (Category)</th>
                            <th className="p-2.5 border-b border-emerald-800">खाता</th>
                            <th className="p-2.5 border-b border-emerald-800 text-right">कर (Tax Rs.)</th>
                            <th className="p-2.5 border-b border-emerald-800 text-right">कुल आय (Revenue Rs.)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          <tr className="hover:bg-slate-50">
                            <td className="p-2.5 text-center font-mono">१</td>
                            <td className="p-2.5 font-mono">{report.fromDate || '2083-04-03'}</td>
                            <td className="p-2.5 font-semibold text-slate-900">फिक्कल व्यापार संघ (Fikkal Merchant Union)</td>
                            <td className="p-2.5 font-mono text-slate-600">INV-8304-01</td>
                            <td className="p-2.5 text-slate-700">काउन्टर बिक्री (Counter Sales)</td>
                            <td className="p-2.5 font-bold text-emerald-800">RBB Bank</td>
                            <td className="p-2.5 text-right font-mono text-slate-600">रु. {Math.round(totalAmount * 0.05).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-700">रु. {Math.round(totalAmount * 0.45).toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-slate-50 bg-slate-50/40">
                            <td className="p-2.5 text-center font-mono">२</td>
                            <td className="p-2.5 font-mono">{report.fromDate || '2083-04-12'}</td>
                            <td className="p-2.5 font-semibold text-slate-900">सूर्योदय कृषक समूह (Survodaya Farmers)</td>
                            <td className="p-2.5 font-mono text-slate-600">INV-8304-02</td>
                            <td className="p-2.5 text-slate-700">सेवा परामर्श (Service Fee)</td>
                            <td className="p-2.5 font-bold text-indigo-800">eSewa Wallet</td>
                            <td className="p-2.5 text-right font-mono text-slate-600">रु. {Math.round(totalAmount * 0.03).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-700">रु. {Math.round(totalAmount * 0.35).toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="p-2.5 text-center font-mono">३</td>
                            <td className="p-2.5 font-mono">{report.fromDate || '2083-04-22'}</td>
                            <td className="p-2.5 font-semibold text-slate-900">अन्य खुद्रा सेवाग्रही (Retail Walk-in Customers)</td>
                            <td className="p-2.5 font-mono text-slate-600">INV-8304-03</td>
                            <td className="p-2.5 text-slate-700">जिन्सी बिक्री (Inventory Revenue)</td>
                            <td className="p-2.5 font-bold text-slate-800">Cash Counter</td>
                            <td className="p-2.5 text-right font-mono text-slate-600">रु. {Math.round(totalAmount * 0.02).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-700">रु. {Math.round(totalAmount * 0.20).toLocaleString()}</td>
                          </tr>
                        </tbody>
                        <tfoot className="bg-emerald-50 font-bold border-t-2 border-emerald-300 text-emerald-950">
                          <tr>
                            <td colSpan={6} className="p-3 text-right uppercase tracking-wider text-xs">जम्मा आम्दानी (Total Revenue):</td>
                            <td className="p-3 text-right font-mono text-emerald-800">रु. {Math.round(totalAmount * 0.10).toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-emerald-900 text-sm bg-emerald-200/80">रु. {totalAmount.toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : catLower.includes('expense') || catLower.includes('expenditure') ? (
                    /* EXPENSES REPORT ONLY TABLE */
                    <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-2xs">
                      <table className="w-full text-left text-xs font-sans border-collapse">
                        <thead className="bg-rose-900 text-white font-bold text-[11px]">
                          <tr>
                            <th className="p-2.5 border-b border-rose-800 text-center w-10">क्र.सं.</th>
                            <th className="p-2.5 border-b border-rose-800">मिति (Date)</th>
                            <th className="p-2.5 border-b border-rose-800">भुक्तानी पाउने (Payee / Vendor)</th>
                            <th className="p-2.5 border-b border-rose-800 font-mono">भौचर नं.</th>
                            <th className="p-2.5 border-b border-rose-800">खर्च शीर्षक (Category)</th>
                            <th className="p-2.5 border-b border-rose-800">खाता</th>
                            <th className="p-2.5 border-b border-rose-800 text-right">TDS/VAT (Rs.)</th>
                            <th className="p-2.5 border-b border-rose-800 text-right">कुल खर्च (Expenditure Rs.)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          <tr className="hover:bg-slate-50">
                            <td className="p-2.5 text-center font-mono">१</td>
                            <td className="p-2.5 font-mono">{report.fromDate || '2083-04-04'}</td>
                            <td className="p-2.5 font-semibold text-slate-900">नेपाल विद्युत् प्राधिकरण / नेपाल टेलिकम (Utilities)</td>
                            <td className="p-2.5 font-mono text-slate-600">VOU-8304-01</td>
                            <td className="p-2.5 text-slate-700">कार्यालय सञ्चालन (Office Utility)</td>
                            <td className="p-2.5 font-bold text-slate-800">Cash Account</td>
                            <td className="p-2.5 text-right font-mono text-slate-500">रु. ०</td>
                            <td className="p-2.5 text-right font-mono font-bold text-rose-700">रु. {Math.round(totalAmount * 0.30).toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-slate-50 bg-slate-50/40">
                            <td className="p-2.5 text-center font-mono">२</td>
                            <td className="p-2.5 font-mono">{report.fromDate || '2083-04-14'}</td>
                            <td className="p-2.5 font-semibold text-slate-900">इलाम स्टेसनरी तथा सप्लायर्स (Stationery Supplies)</td>
                            <td className="p-2.5 font-mono text-slate-600">VOU-8304-02</td>
                            <td className="p-2.5 text-slate-700">छपाई तथा सामाग्री (Printing & Office)</td>
                            <td className="p-2.5 font-bold text-emerald-800">RBB Bank</td>
                            <td className="p-2.5 text-right font-mono text-slate-500">रु. {Math.round(totalAmount * 0.015).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-rose-700">रु. {Math.round(totalAmount * 0.45).toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="p-2.5 text-center font-mono">३</td>
                            <td className="p-2.5 font-mono">{report.fromDate || '2083-04-26'}</td>
                            <td className="p-2.5 font-semibold text-slate-900">मेची लजिस्टिक सेवा (Logistics & Transport)</td>
                            <td className="p-2.5 font-mono text-slate-600">VOU-8304-03</td>
                            <td className="p-2.5 text-slate-700">ढुवानी तथा यात्रा (Freight & Travel)</td>
                            <td className="p-2.5 font-bold text-slate-800">Sahakari Account</td>
                            <td className="p-2.5 text-right font-mono text-slate-500">रु. {Math.round(totalAmount * 0.01).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-rose-700">रु. {Math.round(totalAmount * 0.25).toLocaleString()}</td>
                          </tr>
                        </tbody>
                        <tfoot className="bg-rose-50 font-bold border-t-2 border-rose-300 text-rose-950">
                          <tr>
                            <td colSpan={6} className="p-3 text-right uppercase tracking-wider text-xs">जम्मा खर्च (Total Expenditure):</td>
                            <td className="p-3 text-right font-mono text-rose-800">रु. {Math.round(totalAmount * 0.025).toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-rose-900 text-sm bg-rose-200/80">रु. {totalAmount.toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : catLower.includes('cost') || catLower.includes('selling') ? (
                    /* COST VS SELLING MARGIN TABLE */
                    <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-2xs">
                      <table className="w-full text-left text-xs font-sans border-collapse">
                        <thead className="bg-amber-900 text-white font-bold text-[11px]">
                          <tr>
                            <th className="p-2.5 border-b border-amber-800 text-center w-10">क्र.सं.</th>
                            <th className="p-2.5 border-b border-amber-800">सामान विवरण (Item Name)</th>
                            <th className="p-2.5 border-b border-amber-800 font-mono">ब्याच/SKU</th>
                            <th className="p-2.5 border-b border-amber-800 text-center">परिमाण (Qty)</th>
                            <th className="p-2.5 border-b border-amber-800 text-right">खरिद दर (CP)</th>
                            <th className="p-2.5 border-b border-amber-800 text-right">कुल खरिद (Total CP)</th>
                            <th className="p-2.5 border-b border-amber-800 text-right">बिक्री दर (SP)</th>
                            <th className="p-2.5 border-b border-amber-800 text-right">कुल बिक्री (Total SP)</th>
                            <th className="p-2.5 border-b border-amber-800 text-right">खुद नाफा (Margin)</th>
                            <th className="p-2.5 border-b border-amber-800 text-center">मार्जिन %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          <tr className="hover:bg-slate-50">
                            <td className="p-2.5 text-center font-mono">१</td>
                            <td className="p-2.5 font-semibold text-slate-900">जैविक चिया सामाग्री ग्रेड ए (Organic Tea Packets)</td>
                            <td className="p-2.5 font-mono text-slate-600">TEA-83-01</td>
                            <td className="p-2.5 text-center font-mono">१२० पोका</td>
                            <td className="p-2.5 text-right font-mono">रु. ४५०</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-800">रु. ५४,०००</td>
                            <td className="p-2.5 text-right font-mono text-emerald-800 font-bold">रु. ६५०</td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-700">रु. ७८,०००</td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-900">रु. २४,०००</td>
                            <td className="p-2.5 text-center font-bold text-emerald-700 font-mono">३०.७%</td>
                          </tr>
                          <tr className="hover:bg-slate-50 bg-slate-50/40">
                            <td className="p-2.5 text-center font-mono">२</td>
                            <td className="p-2.5 font-semibold text-slate-900">इलाम अलैंची विशेष प्याक (Elam Cardamom Pack)</td>
                            <td className="p-2.5 font-mono text-slate-600">CARD-83-02</td>
                            <td className="p-2.5 text-center font-mono">५० केजी</td>
                            <td className="p-2.5 text-right font-mono">रु. १,२००</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-800">रु. ६०,०००</td>
                            <td className="p-2.5 text-right font-mono text-emerald-800 font-bold">रु. १,६००</td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-700">रु. ८०,०००</td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-900">रु. २०,०००</td>
                            <td className="p-2.5 text-center font-bold text-emerald-700 font-mono">२५.०%</td>
                          </tr>
                        </tbody>
                        <tfoot className="bg-amber-50 font-bold border-t-2 border-amber-300 text-amber-950">
                          <tr>
                            <td colSpan={4} className="p-3 text-right uppercase tracking-wider text-xs">जम्मा मार्जिन तथ्याङ्क (Total Margins):</td>
                            <td className="p-3 text-right font-mono text-slate-700">-</td>
                            <td className="p-3 text-right font-mono text-slate-900 text-sm">रु. १,१४,०००</td>
                            <td className="p-3 text-right font-mono text-slate-700">-</td>
                            <td className="p-3 text-right font-mono text-emerald-800 text-sm">रु. १,५८,०००</td>
                            <td className="p-3 text-right font-mono text-emerald-900 text-sm bg-amber-200">रु. ४४,०००</td>
                            <td className="p-3 text-center font-mono text-emerald-900 text-sm bg-amber-200">२७.८%</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    /* GENERAL ALL-PURPOSE REPORT TABLE */
                    <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-2xs">
                      <table className="w-full text-left text-xs font-sans border-collapse">
                        <thead className="bg-slate-800 text-white font-bold text-[11px]">
                          <tr>
                            <th className="p-2.5 border-b border-slate-700 text-center w-10">क्र.सं.</th>
                            <th className="p-2.5 border-b border-slate-700">मिति (Date)</th>
                            <th className="p-2.5 border-b border-slate-700">कारोबार / प्रतिवेदन शीर्षक (Item Particulars)</th>
                            <th className="p-2.5 border-b border-slate-700 font-mono">भौचर / सन्दर्भ नं.</th>
                            <th className="p-2.5 border-b border-slate-700">भुक्तानी खाता / विधा</th>
                            <th className="p-2.5 border-b border-slate-700 text-right">रकम (Amount Rs.)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          <tr className="hover:bg-slate-50">
                            <td className="p-2.5 text-center font-mono">१</td>
                            <td className="p-2.5 font-mono">{report.reportDate || getCurrentBsDate()}</td>
                            <td className="p-2.5 font-semibold text-slate-900">{report.title}</td>
                            <td className="p-2.5 font-mono text-slate-600">{report.referenceNo || 'REF-AUTO-01'}</td>
                            <td className="p-2.5 font-bold text-emerald-800">{report.category || 'General System Record'}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">रु. {totalAmount.toLocaleString()}</td>
                          </tr>
                        </tbody>
                        <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-900">
                          <tr>
                            <td colSpan={5} className="p-3 text-right uppercase tracking-wider text-xs">कुल जम्मा रकम (Total Net Amount):</td>
                            <td className="p-3 text-right font-mono text-emerald-900 text-sm bg-emerald-100">रु. {totalAmount.toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                </div>

                {/* EXECUTIVE SUMMARY & AUDITOR COMMENTS BLOCK */}
                {report.summary && (
                  <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 space-y-2">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b pb-1.5 text-slate-700">
                      <BookOpen size={16} className="text-emerald-700" />
                      <span>लेखापरीक्षक टिप्पणी तथा समीक्षा विवरण (Auditor Summary & Executive Notes)</span>
                    </h3>
                    <p className="text-slate-800 leading-relaxed font-sans whitespace-pre-line bg-white p-3.5 rounded-lg border border-slate-200 text-xs sm:text-sm shadow-2xs">
                      {report.summary}
                    </p>
                  </div>
                )}

                {/* EMBEDDED ATTACHED FILE / IMAGE VIEWER */}
                {report.fileUrl && (
                  <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Paperclip size={16} className="text-indigo-600" />
                        <span>संलग्न बाह्य फाइल वा कागजात (Attached Document / External File)</span>
                      </h3>
                      <a
                        href={report.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-2xs transition print:hidden"
                      >
                        <span>↗️ Open Full Document in New Tab</span>
                      </a>
                    </div>

                    {(report.fileType?.startsWith('image/') ||
                      report.fileUrl.startsWith('data:image/') ||
                      /\.(jpg|jpeg|png|webp)$/i.test(report.fileName || '')) ? (
                      <div className="bg-slate-900/10 p-3 rounded-xl flex justify-center border border-slate-300">
                        <img
                          src={report.fileUrl}
                          alt={report.title}
                          className="max-h-[400px] w-auto object-contain rounded-lg shadow-md"
                        />
                      </div>
                    ) : (
                      <iframe
                        src={report.fileUrl}
                        className="w-full h-80 rounded-xl border border-slate-300 bg-white"
                        title={report.title}
                      />
                    )}
                  </div>
                )}

                {/* OFFICIAL SIGNATURES & COLOPHON BLOCK */}
                <div className="pt-8 border-t-2 border-slate-300 grid grid-cols-3 gap-4 text-center font-sans">
                  <div className="space-y-12">
                    <div className="text-xs text-slate-500 italic">तैयार गर्ने (Prepared By):</div>
                    <div className="border-t border-slate-400 pt-1 font-bold text-xs text-slate-800">
                      लेखापाल / तयारकर्ता
                      <br />
                      <span className="text-[10px] text-slate-500 font-normal">Accountant</span>
                    </div>
                  </div>

                  <div className="space-y-12">
                    <div className="text-xs text-slate-500 italic">जाँच गर्ने (Verified By):</div>
                    <div className="border-t border-slate-400 pt-1 font-bold text-xs text-slate-800">
                      वरिष्ठ लेखापरीक्षक / सचिव
                      <br />
                      <span className="text-[10px] text-slate-500 font-normal">Senior Auditor / Secretary</span>
                    </div>
                  </div>

                  <div className="space-y-12">
                    <div className="text-xs text-slate-500 italic">प्रमाणित गर्ने (Approved By):</div>
                    <div className="border-t border-slate-400 pt-1 font-bold text-xs text-slate-800">
                      अध्यक्ष / संचालक समिति
                      <br />
                      <span className="text-[10px] text-slate-500 font-normal">Chairperson / Board</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* MODAL ACTION FOOTER */}
              <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 print:hidden">
                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-2xs"
                >
                  <Printer size={15} />
                  <span>🖨️ Print Full Report Document (प्रतिवेदन प्रिन्ट गर्नुहोस)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewAttachmentDetailsModal(null)}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Close (बन्द गर्नुहोस्)
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
