import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  Printer, 
  Mail,
  FileText, 
  Calendar, 
  UserCheck, 
  FileEdit,
  Building,
  Hash,
  Briefcase,
  Bookmark,
  FolderPlus,
  Sparkles,
  ChevronDown,
  Layers,
  CheckCircle2,
  PenTool
} from 'lucide-react';
import { BusinessLetter, AppUser, BusinessProfile, OfficialLetterFormat } from '../types';
import { getCurrentBsDate, generateLetterDispatchNumber, getNepaleseFiscalYear } from '../utils/nepaliDate';
import { CorporateLetterhead } from './CorporateLetterhead';
import { InteractiveSearchBar } from './InteractiveSearchBar';

interface OfficialLettersProps {
  letters: BusinessLetter[];
  users: AppUser[];
  profile: BusinessProfile;
  currentUser: AppUser;
  periodicClosings?: any[];
  onAddLetter: (letter: Omit<BusinessLetter, 'id'>) => void;
  onEditLetter: (letter: BusinessLetter) => void;
  onDeleteLetter: (id: string) => void;
}

const DEFAULT_OFFICIAL_LETTER_FORMATS: OfficialLetterFormat[] = [
  {
    id: 'fmt-1',
    formatTitle: 'FTTH Broadband Connection Request (इन्टरनेट जडान माग)',
    category: 'Telecom & ISP',
    salutation: 'श्रीमान् शाखा प्रमुख ज्यू,',
    subject: 'FTTH फाइबर इन्टरनेट सेवा जडान गरिदिने सम्बन्धमा।',
    defaultRecipientCompany: 'नेपाल टेलिकम / इन्टरनेसनल आई.एस.पी.',
    defaultRecipientAddress: 'इलाम शाखा, नेपाल',
    body: `महोदय,

उपरोक्त सम्बन्धमा यस रिलायबल टेक एण्ड सप्लायर्सको कार्यालय प्रयोजनका लागि तीव्र गतिको FTTH फाइबर इन्टरनेट सेवा जोड्न आवश्यक परेकोले नियमानुसार प्रक्रिया अगाडि बढाई सेवा जडान गरिदिनुहुन हार्दिक अनुरोध गर्दछौँ।

सम्बन्धित संस्थागत दर्ता प्रमाण-पत्र तथा कागजातहरू यसै पत्र साथ संलग्न राखिएका छन्।

धन्यवाद।`
  },
  {
    id: 'fmt-2',
    formatTitle: 'Institutional Bank Account Opening (बैंक खाता सञ्चालन सिफारिस)',
    category: 'Banking & Finance',
    salutation: 'श्रीमान् शाखा प्रबन्धक ज्यू,',
    subject: 'नयाँ संस्थागत चल्ती/बचत खाता खोलिदिने सम्बन्धमा।',
    defaultRecipientCompany: 'राष्ट्रिय वाणिज्य बैंक लिमिटेड',
    defaultRecipientAddress: 'फिक्कल शाखा, इलाम',
    body: `महोदय,

उपरोक्त सम्बन्धमा यस रिलायबल टेक एण्ड सप्लायर्सको सञ्चालक समितिको निर्णयानुसार तपसिल बमोजिमका आधिकारिक प्रतिनिधिहरूको संयुक्त/एकल दस्तखतबाट सञ्चालन हुने गरी संस्थागत बैंक खाता खोलिदिनुहुन यो आधिकारिक सिफारिस पत्र जारी गरिएको छ।

खाता सञ्चालक सम्बन्धी निर्णय प्रतिलिपि, सञ्चालकहरूको नागरिकता तथा संस्थागत दर्ता प्रमाण-पत्र यसै पत्र साथ संलग्न छ।

धन्यवाद।`
  },
  {
    id: 'fmt-3',
    formatTitle: 'Ward & Tax Clearance Recommendation (वडा/नगरपालिका सिफारिस)',
    category: 'Government & Tax',
    salutation: 'श्रीमान् वडा अध्यक्ष ज्यू,',
    subject: 'व्यावसायिक सिफारिस पत्र उपलब्ध गराइदिने सम्बन्धमा।',
    defaultRecipientCompany: 'सूर्योदय नगरपालिका, वडा नं. १० कार्यालय',
    defaultRecipientAddress: 'फिक्कल, इलाम',
    body: `महोदय,

उपरोक्त सम्बन्धमा यस सूर्योदय नगरपालिका वडा नं. १०, फिक्कलमा दर्ता भई नियमित रूपमा सञ्चालनमा रहेको रिलायबल टेक एण्ड सप्लायर्सको व्यावसायिक कामकाज प्रयोजनका लागि आवश्यक पर्ने आधिकारिक सिफारिस पत्र नियमानुसार उपलब्ध गराइदिनुहुन नम्र अनुरोध गर्दछौँ।

हाम्रो तर्फबाट बुझाउनुपर्ने स्थानीय कर तथा नविकरण दस्तुर बुझाइसकिएको व्यहोरा समेत अनुरोध छ।

धन्यवाद।`
  },
  {
    id: 'fmt-4',
    formatTitle: 'Staff Experience & Recommendation Letter (कर्मचारी सिफारिस पत्र)',
    category: 'Human Resources',
    salutation: 'To Whom It May Concern / जो जससँग सम्बन्ध राख्दछ,',
    subject: 'कर्मचारी अनुभव तथा चरित्र सिफारिस प्रमाण-पत्र।',
    defaultRecipientCompany: 'To Whom It May Concern',
    defaultRecipientAddress: 'Nepal',
    body: `To Whom It May Concern,

This is to certify that Mr./Ms. [Employee Name] has been employed with Reliable Tech & Suppliers as [Designation] from [Start Date] to [End Date].

During their tenure with our organization, we found them to be sincere, hardworking, dedicated, and of good moral character. They played a vital role in our daily technical and management operations.

We wish them success in all their future endeavors.

Sincerely,`
  },
  {
    id: 'fmt-5',
    formatTitle: 'Official Purchase Proposal & Rate Quotation (सामान खरिद प्रस्ताव)',
    category: 'Commercial & Sales',
    salutation: 'To, The Procurement Department,',
    subject: 'Sub: Submission of Formal Quotation for Computer Hardware & Technical Supplies.',
    defaultRecipientCompany: '[Client Organization Name]',
    defaultRecipientAddress: '[Client Address]',
    body: `Dear Sir/Madam,

With reference to your inquiry regarding technical equipment, computing hardware, and office maintenance supplies, we are pleased to submit our competitive corporate proposal on behalf of Reliable Tech & Suppliers.

All items supplied by our organization carry full manufacturer warranties, genuine billing (VAT/PAN), and dedicated local technical support in Fikkal, Ilam.

Please find the itemized rate breakdown attached with this letter for your review and approval.

Thank you for considering Reliable Tech & Suppliers. We look forward to a successful business partnership.

Sincerely,`
  }
];

export const OfficialLetters: React.FC<OfficialLettersProps> = ({
  letters,
  users,
  profile,
  currentUser,
  periodicClosings = [],
  onAddLetter,
  onEditLetter,
  onDeleteLetter
}) => {
  // Search and state management
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLetter, setEditingLetter] = useState<BusinessLetter | null>(null);
  const [printingLetter, setPrintingLetter] = useState<BusinessLetter | null>(null);

  // Formats State (Persisted in LocalStorage)
  const [formats, setFormats] = useState<OfficialLetterFormat[]>(() => {
    const saved = localStorage.getItem('reliabletech_official_letter_formats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_OFFICIAL_LETTER_FORMATS;
  });

  const saveFormatsToStorage = (updatedFormats: OfficialLetterFormat[]) => {
    setFormats(updatedFormats);
    localStorage.setItem('reliabletech_official_letter_formats', JSON.stringify(updatedFormats));
  };

  // Format Manager Modal States
  const [isFormatManagerOpen, setIsFormatManagerOpen] = useState(false);
  const [editingFormat, setEditingFormat] = useState<OfficialLetterFormat | null>(null);
  const [formatTitle, setFormatTitle] = useState('');
  const [formatCategory, setFormatCategory] = useState('General Corporate');
  const [formatSalutation, setFormatSalutation] = useState('To,');
  const [formatSubject, setFormatSubject] = useState('');
  const [formatBody, setFormatBody] = useState('');
  const [formatDefaultCompany, setFormatDefaultCompany] = useState('');
  const [formatDefaultAddress, setFormatDefaultAddress] = useState('');
  const [formatSearchTerm, setFormatSearchTerm] = useState('');

  // Compose Letter States
  const [composeMode, setComposeMode] = useState<'selection' | 'manual' | 'format'>('selection');
  const [selectedFormatId, setSelectedFormatId] = useState<string>('');
  const [formatDropdownSearch, setFormatDropdownSearch] = useState('');
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
  const [appliedFormatTitle, setAppliedFormatTitle] = useState<string>('');

  // Form states for letter
  const [fiscalYear, setFiscalYear] = useState('');
  const [dispatchNumber, setDispatchNumber] = useState('');
  const [date, setDate] = useState(() => getCurrentBsDate());
  const [salutation, setSalutation] = useState('To,');
  const [recipientCompany, setRecipientCompany] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [senderName, setSenderName] = useState(currentUser.name);
  const [selectedSigneeId, setSelectedSigneeId] = useState('');

  // Open "Create a Format" manager modal directly
  const handleOpenFormatManager = (targetFormat?: OfficialLetterFormat) => {
    if (targetFormat) {
      setEditingFormat(targetFormat);
      setFormatTitle(targetFormat.formatTitle);
      setFormatCategory(targetFormat.category || 'General Corporate');
      setFormatSalutation(targetFormat.salutation);
      setFormatSubject(targetFormat.subject);
      setFormatBody(targetFormat.body);
      setFormatDefaultCompany(targetFormat.defaultRecipientCompany || '');
      setFormatDefaultAddress(targetFormat.defaultRecipientAddress || '');
    } else {
      setEditingFormat(null);
      setFormatTitle('');
      setFormatCategory('General Corporate');
      setFormatSalutation('श्रीमान् शाखा प्रमुख ज्यू,');
      setFormatSubject('');
      setFormatBody('');
      setFormatDefaultCompany('');
      setFormatDefaultAddress('');
    }
    setIsFormatManagerOpen(true);
  };

  // Handle saving format
  const handleSaveFormat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formatTitle.trim() || !formatSubject.trim() || !formatBody.trim()) {
      alert('Please fill in the Format Title, Subject, and Body template.');
      return;
    }

    if (editingFormat) {
      const updated = formats.map(f => f.id === editingFormat.id ? {
        ...f,
        formatTitle,
        category: formatCategory,
        salutation: formatSalutation,
        subject: formatSubject,
        body: formatBody,
        defaultRecipientCompany: formatDefaultCompany,
        defaultRecipientAddress: formatDefaultAddress
      } : f);
      saveFormatsToStorage(updated);
      alert('Letter Format updated successfully!');
    } else {
      const newFmt: OfficialLetterFormat = {
        id: `fmt-${Date.now()}`,
        formatTitle,
        category: formatCategory,
        salutation: formatSalutation,
        subject: formatSubject,
        body: formatBody,
        defaultRecipientCompany: formatDefaultCompany,
        defaultRecipientAddress: formatDefaultAddress,
        createdAt: getCurrentBsDate()
      };
      saveFormatsToStorage([newFmt, ...formats]);
      alert('New Letter Format saved successfully!');
    }

    // Reset form inputs for format
    setEditingFormat(null);
    setFormatTitle('');
    setFormatSubject('');
    setFormatBody('');
    setFormatDefaultCompany('');
    setFormatDefaultAddress('');
  };

  // Handle delete format
  const handleDeleteFormat = (fmtId: string) => {
    if (window.confirm('Are you sure you want to delete this letter format template?')) {
      const updated = formats.filter(f => f.id !== fmtId);
      saveFormatsToStorage(updated);
    }
  };

  // Apply chosen format template to the current letter form
  const handleApplyFormat = (fmt: OfficialLetterFormat) => {
    setSalutation(fmt.salutation || 'To,');
    setSubject(fmt.subject || '');
    setBody(fmt.body || '');
    if (fmt.defaultRecipientCompany) setRecipientCompany(fmt.defaultRecipientCompany);
    if (fmt.defaultRecipientAddress) setRecipientAddress(fmt.defaultRecipientAddress);
    setSelectedFormatId(fmt.id);
    setAppliedFormatTitle(fmt.formatTitle);
    setIsFormatDropdownOpen(false);
    setComposeMode('manual'); // Switch to editor mode so user can customize fields
  };

  // Handle open form for new letter
  const handleNewLetter = () => {
    const todayBs = getCurrentBsDate();
    const nepFiscalYear = getNepaleseFiscalYear(todayBs);
    const computedDispatchNo = generateLetterDispatchNumber(todayBs, letters, periodicClosings);

    setFiscalYear(nepFiscalYear);
    setDispatchNumber(computedDispatchNo);
    setDate(todayBs);
    setSalutation('To,');
    setRecipientCompany('');
    setRecipientAddress('');
    setSubject('');
    setBody('');
    setSenderName(currentUser.name);
    setAppliedFormatTitle('');
    setSelectedFormatId('');
    
    // Default signee to current user if they are admin/manager, otherwise first admin/manager found
    const authSignees = users.filter(u => u.role === 'Admin' || u.role === 'Finance Manager' || u.role === 'Stock Manager');
    const isAuthorizedSignee = currentUser.role === 'Admin' || currentUser.role === 'Finance Manager' || currentUser.role === 'Stock Manager';
    if (isAuthorizedSignee) {
      setSelectedSigneeId(currentUser.id);
    } else if (authSignees.length > 0) {
      setSelectedSigneeId(authSignees[0].id);
    } else {
      setSelectedSigneeId('');
    }

    setEditingLetter(null);
    setComposeMode('selection'); // Show initial selection option (Manual vs From Format)
    setIsFormOpen(true);
  };

  // Handle open form for editing
  const handleEditClick = (letter: BusinessLetter) => {
    setEditingLetter(letter);
    setFiscalYear(letter.fiscalYear);
    setDispatchNumber(letter.dispatchNumber);
    setDate(letter.date);
    setSalutation(letter.salutation);
    setRecipientCompany(letter.recipientCompany);
    setRecipientAddress(letter.recipientAddress);
    setSubject(letter.subject);
    setBody(letter.body);
    setSenderName(letter.senderName);
    setSelectedSigneeId(letter.signeeId);
    setComposeMode('manual');
    setIsFormOpen(true);
  };

  // Handle delete letter
  const handleDeleteClick = (id: string) => {
    const isSystemMaster = currentUser?.username?.toLowerCase() === 'reliableadmin' || currentUser?.username?.toLowerCase() === 'arpan' || currentUser?.role === 'Super Admin';
    if (!isSystemMaster) {
      alert('Direct deletion is allowed for System Master (@reliableadmin) only.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this official record? This action cannot be undone.')) {
      onDeleteLetter(id);
    }
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const signee = users.find(u => u.id === selectedSigneeId) || currentUser;

    const letterData = {
      fiscalYear,
      dispatchNumber,
      date,
      salutation,
      recipientCompany,
      recipientAddress,
      subject,
      body,
      senderName,
      signeeId: signee.id,
      signeeName: signee.name,
      signeeRole: signee.role
    };

    if (editingLetter) {
      onEditLetter({
        ...editingLetter,
        ...letterData
      });
    } else {
      onAddLetter(letterData);
    }

    setIsFormOpen(false);
  };

  // Filter letters
  const filteredLetters = letters.filter(l => 
    l.recipientCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.dispatchNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter formats for dropdown / manager
  const filteredFormatsDropdown = formats.filter(f => 
    f.formatTitle.toLowerCase().includes(formatDropdownSearch.toLowerCase()) ||
    f.subject.toLowerCase().includes(formatDropdownSearch.toLowerCase()) ||
    (f.category && f.category.toLowerCase().includes(formatDropdownSearch.toLowerCase()))
  );

  const filteredFormatsManager = formats.filter(f => 
    f.formatTitle.toLowerCase().includes(formatSearchTerm.toLowerCase()) ||
    f.subject.toLowerCase().includes(formatSearchTerm.toLowerCase()) ||
    (f.category && f.category.toLowerCase().includes(formatSearchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6" id="official-letters-container">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs print:hidden">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="text-indigo-600" size={22} />
            <span>Nepali Style Letter Dispatch</span>
          </h2>
          <p className="text-xs text-slate-500">Draft, edit, and print official letters formatted specifically for corporate Nepal.</p>
        </div>

        {/* Action Buttons: Create a Format & Write Official Letter */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => handleOpenFormatManager()}
            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs transition cursor-pointer active:scale-95"
            title="Create and manage letter templates/formats for easy future reuse"
          >
            <Bookmark size={14} />
            <span>Create a Format</span>
          </button>
          <button 
            onClick={handleNewLetter}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs transition cursor-pointer active:scale-95"
          >
            <Plus size={14} />
            <span>Write Official Letter</span>
          </button>
        </div>
      </div>

      {/* SEARCH AND GRID SUMMARY */}
      <div className="flex flex-wrap gap-4 items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <InteractiveSearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search letters by recipient, subject, dispatch #..."
            expandedWidth="w-72 sm:w-80 md:w-96"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Showing {filteredLetters.length} of {letters.length} dispatched letters
        </div>
      </div>

      {/* LETTERS LEDGER TABLE */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 uppercase font-mono tracking-wider text-[10px]">
                <th className="px-6 py-4 font-bold">Dispatch No</th>
                <th className="px-6 py-4 font-bold">Fiscal Year</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Recipient Name & Company</th>
                <th className="px-6 py-4 font-bold">Subject</th>
                <th className="px-6 py-4 font-bold">Authorized Signatory</th>
                <th className="px-6 py-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 font-sans">
              {filteredLetters.map((letObj) => (
                <tr key={letObj.id} className="hover:bg-slate-50/40">
                  <td className="px-6 py-4 font-bold font-mono text-indigo-600">{letObj.dispatchNumber}</td>
                  <td className="px-6 py-4 font-mono text-slate-500">{letObj.fiscalYear}</td>
                  <td className="px-6 py-4 font-mono">{letObj.date}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{letObj.recipientCompany}</div>
                    <div className="text-[10px] text-slate-400 italic mt-0.5">{letObj.recipientAddress}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700 max-w-xs truncate">{letObj.subject}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{letObj.signeeName}</div>
                    <div className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium inline-block mt-1 font-mono uppercase">{letObj.signeeRole}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => {
                          if (window.openUniversalPrintPreview) {
                            window.openUniversalPrintPreview({
                              documentType: 'Official Letter',
                              documentNumber: letObj.dispatchNumber,
                              fiscalYear: letObj.fiscalYear,
                              documentDate: letObj.date,
                              profile: profile,
                              salutation: letObj.salutation,
                              recipient: {
                                name: letObj.recipientCompany,
                                address: letObj.recipientAddress
                              },
                              title: letObj.subject,
                              subject: letObj.subject,
                              bodyText: letObj.body,
                              signeeName: letObj.signeeName,
                              signeeRole: letObj.signeeRole
                            });
                          } else {
                            setPrintingLetter(letObj);
                            setTimeout(() => window.print(), 100);
                          }
                        }}
                        title="Print Letter"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      >
                        <Printer size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.openUniversalEmailModal) {
                            window.openUniversalEmailModal({
                              recipientName: letObj.recipientName || 'Valued Recipient',
                              subject: `${letObj.subject || 'Official Letter'} (#${letObj.refNo || 'N/A'}) - ReliableTech Services & Suppliers`,
                              message: `Dear ${letObj.recipientName || 'Sir/Madam'},\n\nPlease find the details regarding official letter (Ref: ${letObj.refNo || 'N/A'}).\n\nSubject: ${letObj.subject}\nDate: ${letObj.dateBs} BS\n\n${letObj.body}\n\nSincerely,\n${letObj.signeeName || 'ReliableTech Services & Suppliers'}\n${letObj.signeeRole || ''}`,
                              emailType: 'Official Letter',
                              documentRef: letObj.refNo
                            });
                          }
                        }}
                        title="Send Letter through Email"
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      >
                        <Mail size={14} />
                      </button>
                      <button 
                        onClick={() => handleEditClick(letObj)}
                        title="Edit Record"
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(letObj.id)}
                        title="Delete Record"
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredLetters.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText size={28} className="text-slate-300" />
                      <span>No letters drafted in this record. Click 'Write Official Letter' to begin.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT LETTER FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between sticky top-0 bg-slate-50 z-10">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <FileEdit className="text-indigo-600" size={16} />
                  <span>{editingLetter ? 'Modify Dispatched Letter' : 'Compose Official Corporate Letter'}</span>
                </h3>
                <p className="text-[11px] text-slate-500">Draft legal and formal corporate communications matching Nepali organizational design.</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* SELECTION CHOICE VIEW: Option 1: Manual vs Option 2: Select from Format */}
            {composeMode === 'selection' && !editingLetter ? (
              <div className="p-8 space-y-6 text-center">
                <div>
                  <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-mono font-bold rounded-full mb-2 uppercase tracking-wider">
                    Compose Method / पत्र लेखन विधि
                  </span>
                  <h4 className="text-lg font-extrabold text-slate-800">How would you like to write this official letter?</h4>
                  <p className="text-xs text-slate-500 mt-1">Choose between drafting manually from scratch or selecting a pre-formatted template.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto">
                  {/* Option 1: Manual */}
                  <button
                    type="button"
                    onClick={() => setComposeMode('manual')}
                    className="p-3.5 rounded-xl border-2 border-slate-200 hover:border-indigo-500 bg-white hover:bg-indigo-50/30 text-left transition duration-200 group cursor-pointer shadow-2xs hover:shadow-xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-indigo-600 text-slate-600 group-hover:text-white flex items-center justify-center transition mb-2">
                      <PenTool size={16} />
                    </div>
                    <div className="font-bold text-slate-800 text-xs group-hover:text-indigo-600 transition flex items-center justify-between">
                      <span>1. Manual Mode</span>
                      <span className="text-[9px] text-slate-400 font-mono">Option 1</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Write a custom letter from scratch with blank fields.
                    </p>
                  </button>

                  {/* Option 2: Select from Format */}
                  <button
                    type="button"
                    onClick={() => setComposeMode('format')}
                    className="p-3.5 rounded-xl border-2 border-amber-300 hover:border-amber-500 bg-amber-50/40 hover:bg-amber-50/80 text-left transition duration-200 group cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center transition mb-2 shadow-2xs">
                      <Bookmark size={16} />
                    </div>
                    <div className="font-bold text-amber-900 text-xs group-hover:text-amber-700 transition flex items-center justify-between">
                      <span>2. Select from Format</span>
                      <span className="text-[9px] bg-amber-200 text-amber-800 font-mono font-bold px-1 py-0.2 rounded">Option 2</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      Pick from saved templates (FTTH, Bank, Ward, etc.).
                    </p>
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenFormatManager()}
                    className="inline-flex items-center gap-1.5 text-xs text-amber-600 font-bold hover:underline cursor-pointer"
                  >
                    <FolderPlus size={14} />
                    <span>Manage / Create New Letter Formats</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Modal Form */
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Format Selection Toolbar */}
                <div className="p-3 border border-indigo-100 rounded-xl bg-indigo-50/40 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-indigo-900 uppercase font-mono text-[10px] tracking-wider flex items-center gap-1">
                        <Bookmark size={13} className="text-indigo-600" />
                        <span>Mode:</span>
                      </span>

                      <div className="inline-flex p-0.5 bg-white rounded-lg border border-indigo-200 text-xs font-bold shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setComposeMode('manual')}
                          className={`px-3 py-1 rounded-md transition cursor-pointer text-[11px] ${
                            composeMode === 'manual' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Manual
                        </button>
                        <button
                          type="button"
                          onClick={() => setComposeMode('format')}
                          className={`px-3 py-1 rounded-md transition cursor-pointer text-[11px] ${
                            composeMode === 'format' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Select from Format
                        </button>
                      </div>

                      {appliedFormatTitle && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <CheckCircle2 size={11} className="text-emerald-600" />
                          <span>Template: {appliedFormatTitle}</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenFormatManager()}
                      className="text-[11px] font-bold text-amber-600 hover:text-amber-700 underline cursor-pointer flex items-center gap-1"
                    >
                      <FolderPlus size={12} />
                      <span>Create New Format</span>
                    </button>
                  </div>

                  {/* SEARCHABLE FORMAT DROPDOWN */}
                  {composeMode === 'format' && (
                    <div className="relative pt-1 animate-fadeIn">
                      <label className="text-[10px] font-bold text-amber-900 uppercase font-mono block mb-1">
                        Search & Select Letter Format / ढाँचा खोज्नुहोस्:
                      </label>
                      
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input
                          type="text"
                          placeholder="Type to search format (e.g. FTTH, Bank, Ward, Staff, Proposal)..."
                          value={formatDropdownSearch}
                          onChange={(e) => {
                            setFormatDropdownSearch(e.target.value);
                            setIsFormatDropdownOpen(true);
                          }}
                          onFocus={() => setIsFormatDropdownOpen(true)}
                          className="w-full bg-white border border-amber-300 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        >
                          <ChevronDown size={14} className={isFormatDropdownOpen ? 'rotate-180 transition' : 'transition'} />
                        </button>
                      </div>

                      {/* Dropdown Options List */}
                      {isFormatDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto p-1.5 space-y-1 animate-scale-in">
                          {filteredFormatsDropdown.map(fmt => (
                            <button
                              key={fmt.id}
                              type="button"
                              onClick={() => handleApplyFormat(fmt)}
                              className={`w-full text-left p-2.5 rounded-xl border transition cursor-pointer flex flex-col gap-1 ${
                                selectedFormatId === fmt.id
                                  ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                                  : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-xs text-slate-900">{fmt.formatTitle}</span>
                                {fmt.category && (
                                  <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                    {fmt.category}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate font-mono">
                                <span className="font-bold text-slate-700">Subject:</span> {fmt.subject}
                              </div>
                            </button>
                          ))}

                          {filteredFormatsDropdown.length === 0 && (
                            <div className="p-4 text-center text-xs text-slate-400 italic">
                              No matching letter formats found. You can click 'Create New Format' above to add one.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Header Info Banner */}
                <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-bold text-slate-400 block uppercase text-[9px] font-mono">Letterhead Org:</span>
                    <span className="font-extrabold text-slate-800 text-sm">{profile.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-400 block uppercase text-[9px] font-mono">PAN / Registration:</span>
                    <span className="font-bold text-slate-600">{profile.panNumber || 'N/A'}</span>
                  </div>
                </div>

                {/* Grid 1: Meta fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase font-mono flex items-center gap-1">
                      <Calendar size={12} className="text-slate-400" />
                      <span>Fiscal Year *</span>
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. 2083/84"
                      value={fiscalYear}
                      onChange={(e) => setFiscalYear(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase font-mono flex items-center gap-1">
                      <Hash size={12} className="text-slate-400" />
                      <span>Dispatch Number *</span>
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. RT-1042"
                      value={dispatchNumber}
                      onChange={(e) => setDispatchNumber(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase font-mono flex items-center gap-1">
                      <Calendar size={12} className="text-slate-400" />
                      <span>Letter Date *</span>
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="YYYY-MM-DD (B.S.)"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {/* Section 2: Recipient Information */}
                <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/20 space-y-3">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Recipient Information</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase">Salutation</label>
                      <input 
                        type="text"
                        placeholder="To, / Respected Sir,"
                        value={salutation}
                        onChange={(e) => setSalutation(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase">Recipient Name / Company Name *</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Nepal Telecom Office"
                        value={recipientCompany}
                        onChange={(e) => setRecipientCompany(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase">Recipient Full Address *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Fikkal Bazaar, Ilam, Nepal"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Section 3: Subject & Content */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">Subject / Theme of Communication *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Request for FTTH Fiber Broadband Migration"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500 text-center"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">Letter Body (Nepali or English - Text Justified) *</label>
                    <textarea 
                      rows={6}
                      required
                      placeholder="Write the full justified content of the official letter..."
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-justify"
                    />
                  </div>
                </div>

                {/* Section 4: Authorized Signatories */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase flex items-center gap-1">
                      <UserCheck size={12} className="text-slate-400" />
                      <span>Who is going to Sign? (Authorized Representative) *</span>
                    </label>
                    <select 
                      required
                      value={selectedSigneeId}
                      onChange={(e) => setSelectedSigneeId(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-indigo-500 bg-white"
                    >
                      <option value="" disabled>-- Select Signee --</option>
                      {users
                        .filter(u => u.role === 'Admin' || u.role === 'Super Admin' || u.role === 'Finance Manager' || u.role === 'Stock Manager')
                        .map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role === 'Super Admin' ? 'Super Admin' : u.role === 'Admin' ? 'Master Admin' : u.role})
                          </option>
                        ))}
                    </select>
                    <p className="text-[10px] text-slate-400 italic">Select an authorized signatory (Master Admin or Manager).</p>
                  </div>
                </div>

                {/* Form Controls */}
                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-3 py-1.5 text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button 
                    type="submit"
                    className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs transition cursor-pointer active:scale-95"
                  >
                    <Check size={14} />
                    <span>{editingLetter ? 'Apply Changes' : 'Publish & Dispatch'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CREATE & MANAGE FORMATS MODAL */}
      {isFormatManagerOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[calc(100dvh-2rem)] my-auto overflow-y-auto animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-amber-500 text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Bookmark size={20} />
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight">Official Letter Formats & Templates (ढाँचा व्यवस्थापन)</h3>
                  <p className="text-[11px] text-amber-100">Create, edit, and organize reusable letter formats for future quick dispatch.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsFormatManagerOpen(false)}
                className="p-1.5 rounded-lg text-amber-100 hover:text-white hover:bg-amber-600 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form to Create/Edit Format */}
              <div className="lg:col-span-6 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-150 pb-6 lg:pb-0 lg:pr-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    <span>{editingFormat ? 'Edit Letter Format' : 'Create New Format Template'}</span>
                  </h4>
                  {editingFormat && (
                    <button
                      type="button"
                      onClick={() => handleOpenFormatManager()}
                      className="text-[11px] text-slate-500 underline font-bold hover:text-slate-800"
                    >
                      Clear / New
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveFormat} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">Format Title / ढाँचा नाम *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. FTTH Broadband Connection Request"
                      value={formatTitle}
                      onChange={(e) => setFormatTitle(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase">Category</label>
                      <select 
                        value={formatCategory}
                        onChange={(e) => setFormatCategory(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-hidden focus:border-amber-500 bg-white"
                      >
                        <option value="General Corporate">General Corporate</option>
                        <option value="Telecom & ISP">Telecom & ISP</option>
                        <option value="Banking & Finance">Banking & Finance</option>
                        <option value="Government & Tax">Government & Tax</option>
                        <option value="Human Resources">Human Resources</option>
                        <option value="Commercial & Sales">Commercial & Sales</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase">Salutation</label>
                      <input 
                        type="text"
                        placeholder="e.g. श्रीमान् शाखा प्रमुख ज्यू,"
                        value={formatSalutation}
                        onChange={(e) => setFormatSalutation(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">Default Subject / विषय *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. FTTH फाइबर इन्टरनेट सेवा जडान गरिदिने सम्बन्धमा।"
                      value={formatSubject}
                      onChange={(e) => setFormatSubject(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">Body Template / पत्र ढाँचा सामग्री *</label>
                    <textarea 
                      rows={5}
                      required
                      placeholder="Write the letter template body text..."
                      value={formatBody}
                      onChange={(e) => setFormatBody(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs leading-relaxed focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block uppercase">Default Recipient Org (Optional)</label>
                      <input 
                        type="text"
                        placeholder="e.g. Nepal Telecom"
                        value={formatDefaultCompany}
                        onChange={(e) => setFormatDefaultCompany(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block uppercase">Default Address (Optional)</label>
                      <input 
                        type="text"
                        placeholder="e.g. Fikkal, Ilam"
                        value={formatDefaultAddress}
                        onChange={(e) => setFormatDefaultAddress(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs transition cursor-pointer active:scale-95"
                    >
                      <Check size={14} />
                      <span>{editingFormat ? 'Update Format' : 'Save Format Template'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Existing Saved Formats List */}
              <div className="lg:col-span-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase font-mono tracking-wider">
                    Saved Letter Formats ({formats.length})
                  </h4>
                  <div className="relative w-44">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input 
                      type="text"
                      placeholder="Search formats..."
                      value={formatSearchTerm}
                      onChange={(e) => setFormatSearchTerm(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg pl-8 pr-2 py-1 text-[11px] font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {filteredFormatsManager.map(fmt => (
                    <div 
                      key={fmt.id} 
                      className="p-3 bg-slate-50/70 border border-slate-150 rounded-xl hover:bg-white hover:border-amber-300 transition space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{fmt.formatTitle}</div>
                          {fmt.category && (
                            <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded inline-block mt-0.5">
                              {fmt.category}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenFormatManager(fmt)}
                            title="Edit Format"
                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition cursor-pointer"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFormat(fmt.id)}
                            title="Delete Format"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 line-clamp-1 font-mono">
                        <span className="font-bold text-slate-700">Subject:</span> {fmt.subject}
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 italic">Salutation: {fmt.salutation}</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleApplyFormat(fmt);
                            setIsFormatManagerOpen(false);
                            setIsFormOpen(true);
                          }}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold transition cursor-pointer"
                        >
                          Use This Format
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredFormatsManager.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-400 italic">
                      No format templates found.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsFormatManagerOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition cursor-pointer"
              >
                Close Manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT PREVIEW MODAL */}
      {printingLetter && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[calc(100dvh-2rem)] my-auto overflow-y-auto animate-scale-in print:border-none print:shadow-none print:rounded-none print:max-h-none">
            {/* Control Header - Hidden in Print */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between print:hidden sticky top-0 bg-slate-50 z-10 shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Printer className="text-indigo-600" size={16} />
                  <span>Official Letterhead Print Preview</span>
                </h3>
                <p className="text-[11px] text-slate-500">Perfect formatting aligned with institutional standards in Nepal.</p>
              </div>
              <button 
                onClick={() => setPrintingLetter(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Document Body (Nepali formatting style wrapped in CorporateLetterhead) */}
            <div id="nepali-letter-print-content">
              <CorporateLetterhead profile={profile} documentType="Official Letter">
                <div className="space-y-6">
                  {/* Fiscal Year/आर्थिक वर्ष (Left) & Ref No / चलानी नम्बर | Date BS (Right) */}
                  <div className="flex justify-between items-start text-xs font-medium border-b border-slate-100 pb-3">
                    <div className="space-y-1 font-mono">
                      <p>Fiscal Year/आर्थिक वर्ष : <span className="font-bold">{printingLetter.fiscalYear}</span></p>
                      <p>Ref. No. /चलानी नम्बर: <span className="font-bold">{printingLetter.dispatchNumber}</span></p>
                    </div>
                    <div className="text-right font-mono">
                      <p>Miti / मिति: <span className="font-bold">{printingLetter.date}</span></p>
                    </div>
                  </div>

                  {/* Salutation, Name of company, address (Left) */}
                  <div className="pt-2 text-xs space-y-1">
                    <p className="font-semibold">{printingLetter.salutation || 'To,'}</p>
                    {printingLetter.recipientCompany && (
                      <div className="text-xs sm:text-sm font-bold text-slate-900 whitespace-pre-wrap leading-relaxed">{printingLetter.recipientCompany}</div>
                    )}
                    {printingLetter.recipientAddress && (
                      <p className="text-slate-700 italic">{printingLetter.recipientAddress}</p>
                    )}
                  </div>

                  {/* Subject: in center */}
                  <div className="pt-3 text-center">
                    <h2 className="inline-block border-b-2 border-[#002D62] pb-1 font-bold text-sm uppercase tracking-wide text-[#002D62]">
                      Subject / विषय: {printingLetter.subject}
                    </h2>
                  </div>

                  {/* Body (Justify) */}
                  <div className="pt-4 text-xs leading-relaxed text-justify text-slate-900 font-normal whitespace-pre-wrap">
                    {printingLetter.body}
                  </div>

                  {/* Little gap (2 or 3 times enter), right align: Who is going to Sign? (Name and Designation ONLY) */}
                  <div className="pt-16 flex justify-end items-end text-xs">
                    <div className="text-right space-y-1 min-w-[200px]">
                      <p className="font-bold text-sm text-slate-900">{printingLetter.signeeName}</p>
                      <p className="text-xs text-slate-700 font-medium">{printingLetter.signeeRole || 'Authorized Representative'}</p>
                    </div>
                  </div>
                </div>
              </CorporateLetterhead>
            </div>

            {/* Print trigger panel - Hidden in Print mode */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-150 flex items-center justify-between print:hidden">
              <span className="text-[10px] text-slate-400 font-mono">Ready for official paper print.</span>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setPrintingLetter(null)}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition cursor-pointer"
                >
                  Close Preview
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (window.openUniversalPrintPreview) {
                      window.openUniversalPrintPreview({
                        documentType: 'Official Letter',
                        documentNumber: printingLetter.dispatchNumber,
                        fiscalYear: printingLetter.fiscalYear,
                        documentDate: printingLetter.date,
                        profile: profile,
                        salutation: printingLetter.salutation,
                        recipient: {
                          name: printingLetter.recipientCompany,
                          address: printingLetter.recipientAddress
                        },
                        title: printingLetter.subject,
                        subject: printingLetter.subject,
                        bodyText: printingLetter.body,
                        signeeName: printingLetter.signeeName,
                        signeeRole: printingLetter.signeeRole
                      });
                    } else {
                      window.print();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs transition cursor-pointer active:scale-95"
                >
                  <Printer size={14} />
                  <span>Print Letter</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!printingLetter) return;
                    if (window.openUniversalEmailModal) {
                      window.openUniversalEmailModal({
                        recipientName: printingLetter.recipientName || printingLetter.recipientCompany || 'Valued Recipient',
                        subject: `${printingLetter.subject || 'Official Letter'} (#${printingLetter.refNo || 'N/A'}) - ReliableTech Services & Suppliers`,
                        message: `Dear ${printingLetter.recipientName || 'Sir/Madam'},\n\nPlease find the details regarding official letter (Ref: ${printingLetter.refNo || 'N/A'}).\n\nSubject: ${printingLetter.subject}\nDate: ${printingLetter.dateBs} BS\n\n${printingLetter.body}\n\nSincerely,\n${printingLetter.signeeName || 'ReliableTech Services & Suppliers'}\n${printingLetter.signeeRole || ''}`,
                        emailType: 'Official Letter',
                        documentRef: printingLetter.refNo
                      });
                    }
                  }}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs transition cursor-pointer active:scale-95"
                  title="Send Letter via Email"
                >
                  <Mail size={14} />
                  <span>Send Email</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default OfficialLetters;
