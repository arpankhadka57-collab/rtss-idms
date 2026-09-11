import React, { useState, useRef, useEffect } from "react";
import { 
  Send, Bot, User, Sparkles, ShieldAlert, FileText, 
  HelpCircle, RefreshCw, UserCheck, BookOpen, Info, ShieldCheck, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AppUser } from "../types";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

interface HelpDeskProps {
  currentUser: AppUser;
}

export const HelpDesk: React.FC<HelpDeskProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "docs">("chat");
  const [assistantMode, setAssistantMode] = useState<"offline_manual" | "gemini">("offline_manual");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Intelligent Offline Reference Manual Q&A Engine with Multilingual English/Nepali & Romanized Support
  const getOfflineResponse = (query: string, role: "Admin" | "User", name: string): string => {
    const q = query.toLowerCase();

    // Suffix added to every single response
    const developedBySuffix = `\n\n---\n👨‍💻 **Developed by / विकासकर्ता:** Mr. Arpan Khadka\n*For more and other info which is out of help desk scope, please consult the developer **Mr. Arpan Khadka**.*\n*(थप जानकारी र सहयोगका लागि कृपया विकासकर्ता श्री अर्पण खड्कासँग परामर्श गर्नुहोस्।)*`;

    // Strict Authorization check for Standard User attempting to query restricted financial ledgers
    if (role === "User") {
      const isRestricted = [
        "finance", "audit", "closing", "periodic", "profit", "mismatch", "ledger", 
        "balance", "bank", "esewa", "sahakari", "due", "decision", "meeting", 
        "revenue", "loss", "reconciliation", "p&l", "p & l", "margin", "ocr", 
        "freeze", "capital", "consensus", "reconcile",
        "बन्द", "लेजर", "अडिट", "बैंक", "हिसाव", "सहकारी", "नाफा", "घाटा", "राजस्व", "अडिट"
      ].some(word => q.includes(word));

      if (isRestricted) {
        return `Access Denied: Financial auditing and periodic closing operations are restricted to Master Administrators. Staff users are unauthorized to view or query financial ledgers. / पहुँच अस्वीकृत: वित्तीय लेखापरीक्षण र आवधिक बन्द गर्ने कार्यहरू मास्टर प्रशासकहरूमा मात्र सीमित छन्। कर्मचारीहरूलाई वित्तीय लेजरहरू हेर्न वा सोधपुछ गर्न अनुमति छैन।` + developedBySuffix;
      }
    }

    // Admin-specific guides
    if (role === "Admin") {
      if (
        q.includes("periodic") || 
        q.includes("closing") || 
        q.includes("monthly") || 
        q.includes("annual") || 
        q.includes("compute") || 
        q.includes("draft") || 
        q.includes("fiscal") || 
        q.includes("year") || 
        q.includes("rollover") || 
        q.includes("reset") || 
        q.includes("checkout") || 
        q.includes("alert") ||
        q.includes("बन्द") || 
        q.includes("लेजर") || 
        q.includes("मासिक") || 
        q.includes("वार्षिक") || 
        q.includes("रोलओभर") || 
        q.includes("आवधिक") || 
        q.includes("आर्थिक") ||
        ["shrawan", "ashadh", "baisakh", "jestha", "shrawan", "bhadra", "ashwin", "kartik", "mangsir", "poush", "magh", "falgun", "chaitra"].some(m => q.includes(m)) ||
        ["श्रावण", "असार", "बैशाख", "जेठ", "भदौ", "असोज", "कात्तिक", "मंसिर", "पुस", "माघ", "फागुन", "चैत"].some(m => q.includes(m))
      ) {
        return `### 📊 आवधिक बन्द र नेपाली आर्थिक वर्ष / Periodic Closings & Nepalese Fiscal Year (Admin Guide)

#### १. आवधिक बन्द गर्ने प्रक्रिया (Preparing and Computing a Periodic Closing):
1. **Daily Closing** पृष्ठमा जानुहोस् र **Periodic Closings (Admin Only)** ट्याब चयन गर्नुहोस्। *(Go to Daily Closing and select the Periodic Closings tab)*
2. बन्द अवधि (**Monthly**, **3 Monthly**, **6 Monthly**, **9 Monthly**, वा **Annual**) रोज्नुहोस् र अवधि (जस्तै: *Asadh 2083*) राख्नुहोस्। *(Select duration and enter period)*
3. ठीक ५ वटा खाताहरूको बन्द मौज्दात (Closing Balance) प्रविष्ट गर्नुहोस्: *(Fill exact closing balances for the 5 key accounts)*
   - **RBB** (राष्ट्रिय बाणिज्य बैंक)
   - **Cash** (नगद दराज)
   - **eSewa** (ईसेवा वालेट)
   - **Sahakari** (सहकारी बचत)
   - **Due** (बाँकी/उधारो)
4. **Process Draft Closing** मा क्लिक गर्नुहोस्। यसले लेजर, नाफा-नोक्सान र अडिट रेकर्ड गणना गर्दछ। *(Click Process Draft Closing to compute values)*

#### २. कारोबार बन्द र सम्पादन लक सुरक्षा (Automatic Closing & Editing Transaction Locks):
- दैनिक, मासिक वा वार्षिक बन्द (Daily, Monthly, or Yearly closing) स्वीकृत भएपछि, **सो अवधिभित्रको कुनै पनि आम्दानी (Invoices/Sales) वा खर्च (Expenses) सम्पादन, सिर्जना वा हटाउन पूर्ण रूपमा बन्देज (Lock) गरिएको छ।** *(Once a daily, monthly, or yearly closing is approved, editing, creating, or deleting transactions within that period is locked to prevent closing mismatch).*
- यदि बन्द भइसकेको मितिमा कुनै कारोबार गर्नुपरेमा, प्रशासकले पहिले उक्त बन्द भएको विवरण इतिहास (**History Log**) मा गई **Unlock** गर्नुपर्नेछ र सोका लागि स्पष्ट कारण प्रविष्ट गर्नुपर्नेछ। *(To transact on locked dates, an administrator must navigate to history log, click Unlock, and enter a detailed reason to revert).*

#### ३. नेपाली आर्थिक वर्ष र क्रमिक संख्या रिसेट (Nepal Fiscal Year & Sequence Reset):
- नेपाली आर्थिक वर्ष **श्रावण १** मा सुरु भई **असार ३१** मा समाप्त हुन्छ। *(Nepalese FY runs Shrawan 1 to Ashadh 31)*
- नयाँ आर्थिक वर्ष (श्रावण १) देखि बिल (Invoices), खरिद आदेश (POs), खर्च (Expenses), आधिकारिक पत्र (Letters), र सेवा अनुरोध (Service Requests) को नम्बर स्वतः \`001\` मा रिसेट हुन्छ। *(Sequence serial counts reset to 001 on Shrawan 1)*
- यो रिसेट अघिल्लो वर्षको **Annual Closing** स्वीकृत भएपछि मात्र क्रियाशील हुन्छ। *(Reset is locked until the previous FY's Annual Closing is fully approved)*

#### ४. आर्थिक वर्षको मौज्दात स्थानान्तरण (Year-End Stock Rollover):
- प्रशासकले **Annual Closing** स्वीकृत गरेपछि, हालको मौज्दात स्वतः आगामी आर्थिक वर्षको **Opening Stock** को रूपमा स्थानान्तरण हुन्छ। *(Closing stock level copies to Opening Stock for the next FY)*
- यो ओपनिङ स्टक विवरण इन्भेन्टरी (Inventory) सूचीमा हेर्न सकिन्छ। *(Opening stock for the active fiscal year displays directly on the Inventory list)*

#### ५. कर्मचारी स्वतः चेक-आउट (Auto Staff Check-out):
- प्रशासकले दैनिक बन्द (Daily Closing) स्वीकृत गर्दा, सो दिन चेक-आउट गर्न बिर्सेका कर्मचारीहरू स्वतः चेक-आउट हुन्छन् (पूरा दिनको हकमा **०५:०० PM** र आधा दिनको हकमा **०१:०० PM**)। *(Approving Daily Closing auto checks-out employees who forgot to log checkout)*
- यसअघि कर्मचारीले आफैं गरेको म्यानुअल चेक-आउट विवरण यथावत रहनेछ। *(Manual checkout times remain untouched)*` + developedBySuffix;
      }

      if (q.includes("ocr") || q.includes("statement") || q.includes("upload") || q.includes("mismatch") || q.includes("verify") || q.includes("ओसीआर") || q.includes("अपलोड") || q.includes("भेरिफाई") || q.includes("स्टेटमेन्ट")) {
        return `### 🔍 बैंक स्टेटमेन्ट ओसीआर र विसंगतिहरू / Visual Statement OCR & Discrepancies (Admin Guide)

१. राष्ट्रिय बाणिज्य बैंक (RBB), ईसेवा (eSewa), वा सहकारी खाता अन्तर्गत **Upload Statement** मा क्लिक गरी रसिद वा स्टेटमेन्टको फोटो (JPEG/PNG) अपलोड गर्नुहोस्। *(Click Upload Statement under the account segment)*
२. प्रणालीको एआई दृष्टि (Vision Emulator) ले स्वतः रकम पहिचान गर्नेछ। *(The visual engine automatically extracts statement metrics)*
३. यदि प्रणालीको मौज्दात र अपलोड गरिएको स्टेटमेन्टको रकम फरक परेमा रातो चेतावनी (Red Alert) देखा पर्नेछ। *(Discrepancies trigger a prominent red alert warning)*
४. विसंगति सच्याएपछि वा क्लियर गरेपछि मात्र खाता बन्द गर्न सकिनेछ। *(You must reconcile or resolve discrepancies before locking)*` + developedBySuffix;
      }

      if (q.includes("consensus") || q.includes("gate") || q.includes("lock") || q.includes("edit") || q.includes("revision") || q.includes("signoff") || q.includes("sign-off") || q.includes("approve") || q.includes("सहमति") || q.includes("संसोधन") || q.includes("स्वीकृत") || q.includes("सम्पादन") || q.includes("लक")) {
        return `### 🔐 प्रशासक सहमति र सम्पादन लक / Pending Admin Consensus & Editing Locks (Admin Guide)

१. आवधिक बन्द (Closing) भइसकेपछि रेकर्डहरू स्थायी रूपमा लक हुन्छन्। संसोधन गर्न **Brief Remarks** मा कारण लेखी **Request Revision** मा क्लिक गर्नुहोस्। *(Locked closings require entering remarks and requesting a revision)*
२. यसले ड्राफ्टलाई **Pending Admin Consensus** स्थितिमा लैजान्छ। *(Transitions the state to Pending Admin Consensus)*
३. प्रणालीमा दर्ता भएका सम्पूर्ण प्रशासकहरू (100% Admins) ले आ-आफ्नो टर्मिनलबाट लगइन गरी **Signoff Consensus Approval** मा क्लिक गर्नुपर्नेछ। *(All administrators must log in and sign off on consensus)*
४. सबै प्रशासकको स्वीकृति पछि मात्र सम्पादन खुल्नेछ। *(Reconciles the lockout to allow updates)*` + developedBySuffix;
      }

      if (q.includes("freeze") || q.includes("metadata") || q.includes("legal") || q.includes("decision") || q.includes("meeting") || q.includes("माइन्युट") || q.includes("बैठक") || q.includes("निर्णय") || q.includes("सभामुख") || q.includes("फ्रीज")) {
        return `### 🏛️ कानुनी बैठक विवरण र स्थायी लक / Legal Meeting Metadata & Permanent Lock (Admin Guide)

१. आवधिक बन्द (Periodic Closing) ड्राफ्टलाई स्थायी रूपमा फ्रीज गर्नको लागि **Final Meeting Signoff** प्यानलमा जानुहोस्। *(Locate the Final Meeting Signoff panel once draft is pending)*
२. बैठक विवरणहरू प्रविष्ट गर्नुहोस्: *(Enter official legal board details)*
   - **Meeting Date** (बैठक मिति - नेपाली बीएस मिति)
   - **Meeting Number** (बैठक संख्या, जस्तै: *RTSS-M-2083/04*)
   - **Decision Number** (निर्णय नम्बर, जस्तै: *DEC-83-41*)
३. **Freeze Data Permanently (Signoff)** मा क्लिक गर्नुहोस्। यसपछि रेकर्ड कहिल्यै सम्पादन गर्न सकिने छैन। *(Once frozen, editing is blocked forever)*` + developedBySuffix;
      }

      if (q.includes("backup") || q.includes("restore") || q.includes("json") || q.includes("sqlite") || q.includes("db") || q.includes("import") || q.includes("export") || q.includes("database") || q.includes("डेटाबेसेज") || q.includes("ब्याकअप") || q.includes("रिस्टोर") || q.includes("डाउनलोड")) {
        return `### 💾 डाटाबेस ब्याकअप र पुनर्स्थापना / Consolidated Database Management (Admin Guide)

१. **Settings** मेनुमा जानुहोस्। *(Go to the Settings section)*
2. **ब्याकअप (Backup):** **Download Database Backup** मा क्लिक गर्नुहोस्। यसले तपाईंको सम्पूर्ण डेटालाई \`rtssdatabase.db\` र ब्याकअप फाईलको रूपमा डाउनलोड गर्दछ। *(Click Download Database Backup to save localized snapshot)*
३. **पुनर्स्थापना (Restore):** **Connect Database** मा क्लिक गरी \`rtssdatabase.db\` वा JSON फाइल छनोट गर्नुहोस्। यसले सम्पूर्ण रेकर्डहरू तुरुन्तै लोड गर्नेछ। *(Click Connect Database and load SQLite database)*` + developedBySuffix;
      }
    }

    if (q.includes("report") || q.includes("filter") || q.includes("range") || q.includes("date") || q.includes("statement") || q.includes("रिपोर्ट") || q.includes("मिति") || q.includes("फिल्टर")) {
      return `### 📊 प्रणाली रिपोर्टहरू र मिति फिल्टर / Reports and Dynamic Date Range Filters (User Guide)

#### १. नयाँ डाइनामिक क्यालेन्डर मिति फिल्टर (Interactive Calendar Date Picker):
- रिपोर्ट ट्याबमा अब सिधै **इन्टरेक्टिभ क्यालेन्डर डेट पिकर** मार्फत मिति छनोट गर्न सकिन्छ। *(The Reports tab now provides native interactive calendar date pickers to easily select start and end dates with a click).*
- तपाईले क्यालेन्डरमा सामान्य ग्रेगोरियन (AD) मिति रोज्दा प्रणालीले स्वतः नेपाली विक्रम संवत (BS) फारम (\`YYYY-MM-DD\` जस्तै: \`2083-01-01\`) मा रूपान्तरण गरी रेकर्डहरू फिल्टर गर्दछ। *(Selecting a date in the calendar instantly translates it to Bikram Sambat format, keeping the BS database perfectly aligned).*
- प्रणालीले यो मिति दायरा प्रयोग गरेर वास्तविक समयमा सबै रेकर्डहरू फिल्टर गर्छ। *(The system instantly updates and filters all records in real time based on this custom range).*

#### २. रिपोर्टका प्रकारहरू (Available Report Categories):
१. **Income Report Only**: छानिएको अवधिभित्रको कुल बिक्री रसिद तथा बिलिङ आम्दानी।
२. **Expenses Report Only**: स्वीकृत भएका सबै प्रकारका व्यवसायिक खर्चहरू।
३. **Profit and Loss Statement**: वास्तविक आर्जित आम्दानी र कुल स्वीकृत खर्च बीचको फरक (नाफा वा नोक्सान)।
४. **Income and Expenditure Ledger**: सम्पूर्ण आम्दानी र खर्चको विस्तृत खाता विवरण।
५. **Cost Price vs Selling Price Summary (Admin Only)**: सामानको खरिद मूल्य र बिक्री मूल्यको तुलनात्मक विवरण तथा सम्भावित नाफा विश्लेषण।
६. **Multi-Account Balance Ledger Report**: पाँच मुख्य खाताहरूको (Cash, eSewa, Sahakari, RBB) विस्तृत डबल-एन्ट्री कारोबार विवरण।
७. **Office Assets Registry Report**: कार्यालयका स्थिर तथा गैर-स्थिर सम्पत्तिहरूको रेकर्ड।
८. **Account Summary (Double-Entry Financial Statements)**: नेपाली द्वि-अङ्क लेखा प्रणाली (Double-Entry) नियम अनुसार स्वतः तयार हुने वित्तीय विवरणहरू जस्तै:
   - **Income Statement / Profit & Loss Account**
   - **Balance Sheet (As of To Date)**
   - **Cash Flow Statement**
   - **Senior Auditor Advisory Note (Summary Note)**

#### ३. प्रिन्टिङ सुबिधा (Print-Ready Formatting):
- कुनै भी रिपोर्ट प्रिन्ट वा सुरक्षित गर्दा **Print Current Report** बटन थिच्नुहोस्।
- प्रिन्ट ढाँचा स्वचालित रूपमा **A4 साइज**मा मिलाइएको छ र पहिलो पृष्ठ खाली आउने समस्या समाधान गरिएको छ। *(All reports are optimized for clean, blank-free A4 printing).*` + developedBySuffix;
    }

    // E-Commerce & Storefront Guides
    if (
      q.includes("ecommerce") || 
      q.includes("store") || 
      q.includes("storefront") || 
      q.includes("reverse") || 
      q.includes("voucher") || 
      q.includes("dispatch") || 
      q.includes("hardware") || 
      q.includes("zone") || 
      q.includes("courier") ||
      q.includes("inquiry") ||
      q.includes("chat") ||
      q.includes("ईकमर्स") || 
      q.includes("पसल") || 
      q.includes("रिभर्स") || 
      q.includes("भौचर") || 
      q.includes("सोधपुछ")
    ) {
      return `### 🛍️ ई-कमर्स व्यवस्थापन र रिभर्स भौचर / E-Commerce Storefront & Reverse Voucher SOP

#### १. अनलाइन सामान थप्ने प्रक्रिया (Adding Storefront Products):
1. **E-Commerce Management** -> **Products** मा जानुहोस् र **+ Add Store Product** थिच्नुहोस्।
2. **Product Title** लेख्दा इन्भेन्टरी सर्च ड्रपडाउनबाट गोदामको स्टक छनोट गर्न सकिन्छ वा नयाँ सामान सिधै लेख्न सकिन्छ।
3. मूल्य, हार्डवेयर वर्ग, ब्याड्ज (Hot/New/Featured), र विवरण लेखी फोटो अपलोड गर्नुहोस्।
4. **Create Product** थिच्नुहोस्। यो अनलाइन पसलमा देखिनेछ तर गोदामको स्टक घट्दैन।

#### २. अर्डर प्रमाणीकरण र डिस्प्याच (Order Verification & Courier Dispatch):
1. **Orders & Dispatch** मा नयाँ अर्डर हेर्नुहोस्।
2. QR/बैंक ट्रान्सफरको हकमा **Verify Payment Slip** मा क्लिक गरी रसिद जाँचेर भुक्तानी स्वीकृत गर्नुहोस्।
3. **Print Courier Dispatch Slip** थिची डेलिभरी रसिद (Barcode/QR सहित) छाप्नुहोस्।
4. अर्डरलाई **Convert to Official Invoice** गरी आधिकारिक बिक्री बिल बनाउनुहोस्।

#### ३. अर्डर रद्द र रिभर्स भौचर (Order Cancellation & Reverse Voucher Settlement):
1. अर्डरको छेउमा रहेको **Cancel & Reverse Voucher** बटन थिच्नुहोस्।
2. भुक्तानी फिर्ता विधि छान्नुहोस् (Cash, eSewa, RBB, Sahakari, वा Institutional Credit Reversal)।
3. रद्दीकरणको कारण प्रविष्ट गर्नुहोस्।
4. प्रणालीले सम्बन्धित बिल स्वतः रद्द गर्छ र तिरिसकेको रकमको हकमा एकल फिर्ता खर्च (Sales Refund Expense) दर्ता गर्छ। उधारो भएमा बाँकी रकम शून्य बनाउँछ।
5. जारी भएको आधिकारिक **Reverse Voucher** प्रिन्ट गरी ग्राहकलाई दिनुहोस्।` + developedBySuffix;
    }

    // Share Capital & Shareholders
    if (
      q.includes("share") || 
      q.includes("capital") || 
      q.includes("shareholder") || 
      q.includes("सेयर") || 
      q.includes("पूँजी") || 
      q.includes("सेयरधनी")
    ) {
      if (role === "User") {
        return `Access Denied: Shareholder registries and capital ledgers are strictly restricted to Master Administrators.` + developedBySuffix;
      }
      return `### 👥 सेयरधनी दर्ता र पूँजी खाता / Share Capital & Shareholder Ledger (Admin SOP)

१. **Shareholders** ट्याबमा जानुहोस् र नयाँ सेयरधनी दर्ता गर्नुहोस् (नागरिकता, PAN, सेयर संख्या र मूल्य)।
२. **Share Capital Addition**: नयाँ पूँजी थप गर्दा रकम जम्मा हुने खाता (RBB, Cash, eSewa, Sahakari) छान्नुहोस्। यसले सम्बन्धित खातामा रकम थप गर्छ।
३. **Share Return / Refund**: सेयर फिर्ता गर्दा रकम कटौती भई फिर्ता भौचर दर्ता हुन्छ।
४. **Print Share Certificate**: आधिकारिक सेयर प्रमाणपत्र प्रिन्ट गर्नुहोस्।` + developedBySuffix;
    }

    // Official Letters
    if (
      q.includes("letter") || 
      q.includes("official letter") || 
      q.includes("letterhead") || 
      q.includes("पत्र") || 
      q.includes("सिफारिस") || 
      q.includes("कोटेशन")
    ) {
      return `### ✉️ आधिकारिक पत्र लेखन र लेटरहेड / Official Letters & Letterhead Desk

१. **Official Letters** ट्याबमा जानुहोस् र **+ Compose New Letter** थिच्नुहोस्।
२. **Manual Writing** वा **Format Template** (अनुभव पत्र, सिफारिस, सूचना, कोटेशन) छान्नुहोस्।
३. प्रापकको नाम, विषय, र पत्रको व्यहोरा नेपाली वा अंग्रेजीमा लेख्नुहोस्।
४. प्रणालीले चालु आर्थिक वर्षको क्रमिक सिरियल नम्बर (जस्तै: \`RTSS/LTR/2083-001\`) स्वतः प्रदान गर्छ।
५. **Preview & Print Letter** मा क्लिक गरी लेटरहेड, वाटरमार्क, छाप र दस्तखत सहित प्रिन्ट गर्नुहोस्।` + developedBySuffix;
    }

    // Assets Management
    if (
      q.includes("asset") || 
      q.includes("furniture") || 
      q.includes("computer") || 
      q.includes("depreciation") || 
      q.includes("सम्पत्ति") || 
      q.includes("ह्रासकट्टी")
    ) {
      return `### 🏢 कार्यालय सम्पत्ति र ह्रासकट्टी / Office Assets & Depreciation Registry

१. **Office Assets** ट्याबमा जानुहोस् र **+ Register New Asset** थिच्नुहोस्।
२. सम्पत्तिको नाम, वर्ग, खरिद मिति, सिरियल नम्बर, र सुरु लागत (NPR) प्रविष्ट गर्नुहोस्।
३. अवस्था (Operational, Under Repair, Written Off) र जिम्मेवार कर्मचारी तोक्नुहोस्।
४. अडिट प्रयोजनका लागि **Asset Registry Report** प्रिन्ट गर्नुहोस्।` + developedBySuffix;
    }

    // Meeting Minutes
    if (
      q.includes("meeting") || 
      q.includes("minute") || 
      q.includes("board") || 
      q.includes("बैठक") || 
      q.includes("माइन्युट") || 
      q.includes("निर्णय")
    ) {
      return `### 🏛️ बैठक निर्णय र कानुनी माइन्युट / Meeting Minutes & Resolution Records

१. **Meeting & Notes** ट्याबमा जानुहोस् र **+ Record New Meeting** थिच्नुहोस्।
२. बैठक मिति (BS), बैठक संख्या (Meeting No.), अध्यक्ष र उपस्थित सदस्यहरूको नाम लेख्नुहोस्।
३. छलफलका एजेन्डा र पारित भएका बुँदागत निर्णयहरू प्रविष्ट गर्नुहोस्।
४. माइन्युट सुरक्षित गरी **Print Official Minutes** मार्फत भौतिक हस्ताक्षरको लागि प्रिन्ट गर्नुहोस्।` + developedBySuffix;
    }
    if (q.includes("invoice") || q.includes("bill") || q.includes("sale") || q.includes("checkout") || q.includes("customer") || q.includes("client") || q.includes("इनभ्वाइस") || q.includes("बिल") || q.includes("बिक्री") || q.includes("ग्राहक") || q.includes("पैसा")) {
      return `### 🧾 ग्राहक इनभ्वाइस र बिक्री दर्ता / Creating Client Invoices & Logging Sales (Staff Guide)

१. मेनुबाट **Sales & Invoices** मा जानुहोस् र **+ Create New Invoice** मा क्लिक गर्नुहोस्। *(Navigate to Sales & Invoices and click Create New Invoice)*
२. ग्राहक छनोट गर्नुहोस् (नयाँ ग्राहकको लागि **Customers** मा गई विवरण थप्न सकिन्छ)। *(Pick client or add a new customer first)*
३. सूचीबाट सामान वा सेवा थप्नुहोस्, परिमाण र छुट मिलाउनुहोस्, र **Save Invoice** मा क्लिक गर्नुहोस्। *(Add inventory/service items, adjust quantity/discount and save)*
४. इनभ्वाइस सुरक्षित भएपछि रसिद प्रिन्ट गर्न र **Transactions** खातामा विवरण हेर्न सकिनेछ। *(Print receipt or audit records on Transactions page)*` + developedBySuffix;
    }

    if (q.includes("service") || q.includes("booking") || q.includes("track") || q.includes("job") || q.includes("repair") || q.includes("सेवा") || q.includes("बुकिङ") || q.includes("मर्मत") || q.includes("काम")) {
      return `### 🛠️ सेवा बुकिङ र ट्र्याकिङ / Services & Booking Desks (Staff Guide)

१. **Services & Bookings** ट्याबमा जानुहोस् र **+ Add New Booking** मा क्लिक गर्नुहोस्। *(Go to Services & Bookings and create a new task)*
२. मर्मत विवरण लेखी ग्राहक र प्राविधिक असाइन गर्नुहोस्। *(Input task descriptions and assign details)*
३. काम सम्पन्न भएपछि स्थिति (Status) अपडेट गर्नुहोस्। सकिएका बुकिङहरूलाई सोझै चेक-आउट गरी बिल बनाउन सकिन्छ। *(Update task progress and click checkout to bill)*` + developedBySuffix;
    }

    if (q.includes("supplier") || q.includes("vendor") || q.includes("purchase") || q.includes("order") || q.includes("सप्लायर") || q.includes("विक्रेता") || q.includes("खरिद") || q.includes("अर्डर") || q.includes("सामान")) {
      return `### 📦 सप्लायर विवरण र खरिद अर्डर / Supplier Directories & Stock Orders (Staff Guide)

१. **Suppliers** ट्याबमा जानुहोस्। यहाँ विक्रेताहरूको सम्पर्क र उधारो रेकर्ड व्यवस्थापन गर्न सकिन्छ। *(Search vendors and outstanding balances)*
२. नयाँ सामान थप्न **Purchase Orders** प्रविष्ट गर्नुहोस्। यसले मुख्य इन्भेन्टरी (Inventory) मा स्टक स्वतः थप गरिदिन्छ। *(Create purchase orders to replenish stock ledger)*` + developedBySuffix;
    }

    if (q.includes("leave") || q.includes("advance") || q.includes("salary") || q.includes("request") || q.includes("expense") || q.includes("claim") || q.includes("विदा") || q.includes("तलब") || q.includes("पेश्की") || q.includes("दाबी")) {
      return `### 📝 बिदा र खर्च दाबी अनुरोध / Submitting Staff Requests & Claims (Staff Guide)

१. **Staff Requests** पृष्ठमा जानुहोस्। *(Go to the Staff Requests page)*
२. **Submit New Request** मा क्लिक गरी विदा (Leave Application), तलब पेश्की (Salary Advance), वा खर्च दाबी (Expense Claim) रोज्नुहोस्। *(Click Submit New Request and pick category)*
३. विवरण र रकम राखी पेश गर्नुहोस्। प्रशासकको अनुमति पाएपछि यो लागू हुनेछ। *(Fill in description/amounts for admin review)*` + developedBySuffix;
    }

    if (q.includes("attendance") || q.includes("clock") || q.includes("checkin") || q.includes("checkout") || q.includes("check in") || q.includes("check out") || q.includes("हाजिरी") || q.includes("समय") || q.includes("चेकइन") || q.includes("चेकआउट")) {
      return `### ⏰ कर्मचारी हाजिरी र सिफ्ट लग / Attendance & Shift Logging (Staff Guide)

१. **Staff Attendance** ट्याबमा जानुहोस्। *(Navigate to Staff Attendance)*
२. आइपुगेपछि **Check In** मा र जानुअघि **Check Out** मा क्लिक गर्नुहोस्। *(Click Check In on arrival and Check Out on departure)*
३. दैनिक कामको समय प्रणालीले स्वतः हिसाब गरी तलब र हाजिरी प्रतिवेदन तयार गर्दछ। *(System computes shift duration automatically for payroll logs)*` + developedBySuffix;
    }

    // Default manuals menus or fallback out of scope
    if (q.trim().length <= 3 || q === "help" || q === "menu" || q === "सोध्नुहोस्") {
      if (role === "Admin") {
        return `### 🧭 Enterprise Admin Help Desk — Navigation Manual

Greetings! As a **Master Administrator**, you have complete control over Reliabletech's core financial and operational systems. 

Please ask me a question, or try these quick keywords to find help:
* **"periodic closing"** — setup the 5-account ledger matrix
* **"statement ocr"** — visual verification & upload guides
* **"consensus gate"** — revision requests and locking mechanisms
* **"legal metadata"** — freezing entries with Meeting numbers
* **"database json"** — backing up and importing \`rtssdatabase.json\`
* **"billing"** — customer invoicing and sales logs` + developedBySuffix;
      } else {
        return `### 🧭 Operations Staff Help Desk — Navigation Manual

Hello! As a **Standard Staff Member**, you can manage customer logs, bookings, and standard daily retail activities. 

*Note: For security and auditing protection, standard staff accounts cannot query or view periodic financial ledgers.*

Please ask me a question, or try these quick keywords to find help:
* **"invoice"** — issuing sales receipts & checkouts
* **"service booking"** — tracking technical service repairs
* **"supplier"** — monitoring vendors & stock entries
* **"staff request"** — lodging leave or advance salary claims
* **"attendance"** — checking in & out of shifts` + developedBySuffix;
      }
    }

    // Specific Developer query interceptor
    if (
      q.includes("developer") || q.includes("develop") || q.includes("who made") || 
      q.includes("who built") || q.includes("creator") || q.includes("arpan") || 
      q.includes("khadka") || q.includes("विकासकर्ता") || q.includes("बनाएको") || 
      q.includes("अर्पण") || q.includes("खड्का")
    ) {
      return `### 👨‍💻 System Developer / प्रणाली विकासकर्ता
This system (**RTSS-IDMS**) was developed by **Mr. Arpan Khadka (श्री अर्पण खड्का)**.

For advanced customization, operational troubleshooting, API integrations, or inquiries that go beyond the standard Help Desk manual scope, please directly consult the developer **Mr. Arpan Khadka**.

*(यो प्रणाली (**RTSS-IDMS**) श्री **अर्पण खड्का**द्वारा विकास गरिएको हो। थप परिमार्जन, प्रणाली विस्तार, वा हेल्प डेस्कको दायराभन्दा बाहिरका विषयमा थप सोधपुछका लागि कृपया विकासकर्ता श्री **अर्पण खड्का**सँग परामर्श गर्नुहोस्।)*` + developedBySuffix;
    }

    // Unmatched/Out of Scope query fallback
    return `### 🧭 Information / जानकारी
I couldn't find a direct manual entry in our database for that topic. This system was developed by Mr. Arpan Khadka.

Please consult the developer **Mr. Arpan Khadka** for advanced questions, customized system extensions, or inquiries outside the standard help desk scope.

*(माफ गर्नुहोस्, मैले उक्त विषयको लागि हाम्रो डेटाबेसमा सिधा म्यानुअल प्रविष्टि फेला पार्न सकिन। यो प्रणाली श्री अर्पण खड्काद्वारा विकास गरिएको हो। थप जानकारी, प्राविधिक सोधपुछ, वा म्यानुअल बाहिरका जिज्ञासाहरूको लागि कृपया विकासकर्ता **श्री अर्पण खड्का**सँग परामर्श गर्नुहोस्।)*` + developedBySuffix;
  };

  // Quick assist suggestions based on user authorization level
  const quickAssistPrompts = currentUser.role === "Admin" ? [
    { label: "5-Account Closing & Rollover", text: "How do I set up and compute the 5-account periodic closing draft and fiscal rollover?" },
    { label: "E-Commerce & Reverse Vouchers", text: "How do I manage storefront products, dispatch orders, and issue reverse vouchers?" },
    { label: "OCR Vision Verification", text: "Explain how statement OCR vision uploads are verified and how to solve discrepancies." },
    { label: "Admin Consensus Gates", text: "Explain the Pending Admin Consensus gateway and how other admins sign off on an edit." },
    { label: "Legal Minutes & Share Capital", text: "How do I manage official meeting minutes and shareholder capital ledgers?" },
    { label: "Backup & Restore Database", text: "How can I perform a manual backup or import JSON snapshots into the system?" }
  ] : [
    { label: "Create a Client Invoice", text: "How do I create a standard client invoice and record the sales transaction?" },
    { label: "Store Orders & Dispatch", text: "How do I verify customer payment slips and print courier dispatch slips?" },
    { label: "Order Reverse Voucher", text: "How do I cancel an order and issue an official reverse voucher?" },
    { label: "Register Service Bookings", text: "What is the procedure for registering and tracking standard client service bookings?" },
    { label: "Submit Staff Request", text: "How do I submit staff leave requests or salary advance inquiries?" }
  ];

  // Welcome message based on user role
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeText = currentUser.role === "Admin" 
        ? `Greetings, Administrator **${currentUser.name}**! 

Welcome to the **Enterprise Help Desk Command Suite**. You have **FULL ADMIN CLEARANCE** across all corporate ledgers, cash flows, consensus gates, and database structures.

How can I assist you with corporate reconciliations, audit freeze runs, or system operations today?`
        : `Hello **${currentUser.name}**! 

Welcome to the **Staff Help Desk**. You have **STANDARD STAFF CLEARANCE** for CRM, invoicing, and service desks. 

I can assist you with customer records, daily invoicing, or service bookings. Please note that *financial auditing and periodic closings are restricted to Administrators* as per security guidelines. How can I help you today?`;

      setMessages([
        {
          id: "welcome",
          sender: "bot",
          text: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [currentUser]);

  // Scroll to bottom whenever messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    if (assistantMode === "offline_manual") {
      setTimeout(() => {
        const offlineText = getOfflineResponse(textToSend, currentUser.role, currentUser.name);
        const botMsg: Message = {
          id: `msg-${Date.now() + 1}`,
          sender: "bot",
          text: offlineText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
      }, 500);
      return;
    }

    try {
      // Map existing messages to the history format for the API route
      const history = messages.map(m => ({
        role: m.sender === "bot" ? "model" : "user",
        text: m.text
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history,
          role: currentUser.role,
          userName: currentUser.name
        })
      });

      if (!response.ok) {
        throw new Error("Failed to receive assistance payload");
      }

      let data: any = {};
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch {
        data = { text: "⚠️ Unable to parse response from assistant service." };
      }
      
      const botMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: "bot",
        text: data.text || data.error || "I was unable to compile a response. Please check server connection.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.error("Help Desk Chat Error:", error);
      const offlineText = getOfflineResponse(textToSend, currentUser.role, currentUser.name);
      const botMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: "bot",
        text: `⚠️ **Server Offline Fallback Enabled**:\n\n${offlineText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickPromptClick = (text: string) => {
    handleSendMessage(text);
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear your chat assistant history?")) {
      setMessages([]);
    }
  };

  // Safe formatting function to convert markdown style bold, bullet points, and code highlights
  const formatMessageText = (text: string) => {
    return text.split("\n").map((line, i) => {
      let content = line;
      
      // Handle Bold headers or lists
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parsedParts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parsedParts.push(content.substring(lastIndex, match.index));
        }
        parsedParts.push(
          <strong key={match.index} className="font-bold text-slate-900 drop-shadow-xs">
            {match[1]}
          </strong>
        );
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < content.length) {
        parsedParts.push(content.substring(lastIndex));
      }

      // If parts are matched, construct element list
      let element: React.ReactNode = parsedParts.length > 0 ? parsedParts : content;

      // Handle bullet lists starting with * or -
      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        const rawLine = line.replace(/^[\s*-]+/, "").trim();
        return (
          <li key={i} className="list-disc ml-5 mt-1 leading-relaxed text-slate-700">
            {rawLine.split("**").map((part, index) => {
              if (index % 2 === 1) {
                return <strong key={index} className="font-bold text-slate-800">{part}</strong>;
              }
              return part;
            })}
          </li>
        );
      }

      // Handle simple paragraphs
      return (
        <p key={i} className="min-h-[1.25rem] leading-relaxed text-slate-700 font-sans">
          {element}
        </p>
      );
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6" id="reliabletech-help-desk-suite">
      
      {/* Header and Authorization Display */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl border border-slate-800/80 p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-500/20 p-2 rounded-xl border border-indigo-500/30">
              <Sparkles className="text-indigo-400" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight font-display text-white">Reliabletech Operations Help Desk</h2>
              <p className="text-xs text-slate-400">Intelligent user-adaptive business suite &amp; cash auditing copilot</p>
            </div>
          </div>
        </div>

        {/* Access Clearance Stamped Seal */}
        <div className="relative z-10 flex items-center gap-3 bg-slate-950/60 backdrop-blur-md border border-slate-800 px-4 py-2.5 rounded-xl text-xs">
          {currentUser.role === "Admin" ? (
            <>
              <div className="bg-emerald-500/15 p-1.5 rounded-lg border border-emerald-500/30 text-emerald-400">
                <ShieldCheck size={16} />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Clearance Level</div>
                <div className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <span>MASTER ADMINISTRATOR</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-amber-500/15 p-1.5 rounded-lg border border-amber-500/30 text-amber-400">
                <Lock size={16} />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Clearance Level</div>
                <div className="font-mono font-bold text-amber-400 flex items-center gap-1">
                  <span>STANDARD BUSINESS STAFF</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Board Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Side Options Panel (1 Column) */}
        <div className="space-y-6 lg:col-span-1">
          {/* Menu Selector */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen size={12} className="text-indigo-600" />
                <span>Help Workspace</span>
              </span>
            </div>
            <div className="p-2 space-y-1">
              <button
                onClick={() => setActiveTab("chat")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2.5 cursor-pointer ${
                  activeTab === "chat" 
                    ? "bg-indigo-50 text-indigo-700 shadow-xs" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Bot size={15} />
                <span>AI Support Chat</span>
              </button>
              <button
                onClick={() => setActiveTab("docs")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2.5 cursor-pointer ${
                  activeTab === "docs" 
                    ? "bg-indigo-50 text-indigo-700 shadow-xs" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <FileText size={15} />
                <span>Clearance Guidelines</span>
              </button>
            </div>
          </div>

          {/* Authorization Checklist Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <UserCheck size={14} className="text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Clearance Checklist</h3>
            </div>

            <div className="space-y-3 text-[11px] leading-relaxed text-slate-600">
              {currentUser.role === "Admin" ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                    <div>
                      <strong className="text-slate-800">Verify Bank &amp; Wallet balances</strong>
                      <p className="text-slate-400 mt-0.5">Validate statements across RBB, eSewa, Sahakari and Cash drawers.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                    <div>
                      <strong className="text-slate-800">Approve Staff Revision Requests</strong>
                      <p className="text-slate-400 mt-0.5">Audit transaction logs, unlock lockouts, and execute multi-admin consensus sign-off.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                    <div>
                      <strong className="text-slate-800">Legal Stamping &amp; Exports</strong>
                      <p className="text-slate-400 mt-0.5">Commit official meeting minutes, decisions numbers, and print Markdown binders.</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                    <div>
                      <strong className="text-slate-800">Generate Client Invoices</strong>
                      <p className="text-slate-400 mt-0.5">Add, draft, and issue checkout receipts for Reliabletech clients.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                    <div>
                      <strong className="text-slate-800">Log Daily Sales &amp; Orders</strong>
                      <p className="text-slate-400 mt-0.5">Maintain the supplier catalog, and coordinate stock counts offline.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 font-bold mt-0.5">✕</span>
                    <div>
                      <strong className="text-slate-400">Audit Periodic Closings (Locked)</strong>
                      <p className="text-slate-400/80 mt-0.5">Restricted to Administrators. Financial ledgers are permanently sealed.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Interaction Panel (3 Columns) */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            
            {/* Tab: Chat with AI Copilot */}
            {activeTab === "chat" && (
              <motion.div
                key="chat-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col min-h-[580px]"
              >
                {/* Chat Panel Header */}
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/40 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                    <div>
                      <span className="text-xs font-bold text-slate-800">AI Assistant Desk</span>
                      <p className="text-[10px] text-slate-400">Ask about features, navigation, or operational guidelines</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto self-stretch sm:self-auto justify-between sm:justify-end">
                    {/* Assistant Mode Toggle Button */}
                    <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setAssistantMode("offline_manual")}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          assistantMode === "offline_manual"
                            ? "bg-white text-indigo-700 shadow-xs border border-indigo-100"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                        title="Fully offline instant assistance from user manuals"
                      >
                        📴 Offline Manual
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssistantMode("gemini")}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          assistantMode === "gemini"
                            ? "bg-white text-indigo-700 shadow-xs border border-indigo-100"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                        title="Dynamic AI responses (requires active server key)"
                      >
                        ☁️ Cloud Gemini
                      </button>
                    </div>

                    <button
                      onClick={handleClearHistory}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0 border border-slate-200"
                    >
                      <RefreshCw size={11} />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* Messages Frame */}
                <div className="flex-1 p-6 overflow-y-auto max-h-[400px] space-y-4 bg-slate-50/50">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-[85%] ${
                        msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${
                        msg.sender === "user" 
                          ? "bg-slate-900 border-slate-800 text-white" 
                          : "bg-indigo-600 border-indigo-500 text-white"
                      }`}>
                        {msg.sender === "user" ? <User size={14} /> : <Bot size={14} />}
                      </div>

                      {/* Text Bubble */}
                      <div className="space-y-1">
                        <div className={`p-4 rounded-2xl text-xs space-y-2 border shadow-xs ${
                          msg.sender === "user"
                            ? "bg-slate-900 text-slate-100 rounded-tr-none border-slate-800"
                            : msg.text.includes("Access Denied")
                              ? "bg-red-50 text-slate-800 rounded-tl-none border-red-200/80"
                              : "bg-white text-slate-800 rounded-tl-none border-slate-200/80"
                        }`}>
                          {msg.sender === "bot" && msg.text.includes("Access Denied") && (
                            <div className="flex items-center gap-1.5 text-red-700 font-bold border-b border-red-200/60 pb-1.5 mb-1.5 uppercase tracking-wider text-[10px]">
                              <ShieldAlert size={14} />
                              <span>Security Clearance Protocol Active</span>
                            </div>
                          )}
                          {formatMessageText(msg.text)}
                        </div>
                        <span className={`text-[9px] font-bold text-slate-400 block ${
                          msg.sender === "user" ? "text-right" : "text-left"
                        }`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-3 max-w-[80%] mr-auto">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-600 text-white shadow-xs border border-indigo-500 shrink-0">
                        <Bot size={14} />
                      </div>
                      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl rounded-tl-none text-xs flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Assist prompts container */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/30">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5">
                    Suggested Quick Queries ({currentUser.role})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {quickAssistPrompts.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickPromptClick(q.text)}
                        className="text-[10px] font-semibold text-indigo-600 bg-white hover:bg-indigo-50 border border-indigo-100 hover:border-indigo-200 px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Send Prompt Input bar */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(inputMessage);
                  }}
                  className="p-4 border-t border-slate-100 flex gap-2"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type a query for assistance (e.g., 'How do I issue an invoice?')"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isTyping}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 text-white disabled:text-slate-400 font-bold px-4 rounded-xl transition cursor-pointer flex items-center justify-center shadow-md shadow-indigo-600/10 shrink-0"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </motion.div>
            )}

            {/* Tab: Clearance Guidelines */}
            {activeTab === "docs" && (
              <motion.div
                key="docs-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Clearance &amp; Compliance Mandates</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Official administrative rules concerning records operations at Reliabletech.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Ledger Matrix Card */}
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <BookOpen size={14} className="text-indigo-600" />
                      <span>Ledger Operations Matrix</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Reliabletech operates on a strict double-ledger design auditing physical drawers and commercial bank/wallet balances across exactly five nodes (RBB, Cash, eSewa, Sahakari, Due). Submitting daily checkout reports are delegated to standard cashier personnel, but reconciliation audits are strictly restricted.
                    </p>
                  </div>

                  {/* OCR & Statement Verification Card */}
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <ShieldCheck size={14} className="text-indigo-600" />
                      <span>OCR Statement Controls</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      All uploaded banking and wallet statements are processed by a simulated OCR model. Discrepancies between physical inputs and OCR data will flag alerts instantly. Only Administrators possess the required authorization to verify mismatches or manually bypass the consensus gates.
                    </p>
                  </div>

                  {/* Consensus Protocol Card */}
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Lock size={14} className="text-indigo-600" />
                      <span>The Multi-Admin Consensus Locking</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      No computed monthly or annual closing draft can be edited after processing unless a Revision Request is issued. Revisions freeze the state into <strong>Pending Admin Consensus</strong>, requiring 100% of registered system administrators to sign-off to clear the lockout.
                    </p>
                  </div>

                  {/* Legal Freezer Card */}
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Info size={14} className="text-indigo-600" />
                      <span>Legal Document Freezer</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      To lock data permanently, the board meeting decisions must be entered using correct meeting date, meeting numbers, and legal decision identifiers. Stamping freezes all databases instantly, prohibiting future modifications and enabling clean Markdown/PDF operation manuals download.
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50/60 rounded-xl border border-amber-200/50 p-4 flex gap-3 text-xs leading-relaxed text-amber-800">
                  <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={16} />
                  <div>
                    <strong className="font-bold">Compliancy Notice</strong>
                    <p className="mt-0.5 text-[11px] text-amber-700">
                      Any attempt by Standard Staff to circumvent financial ledger matrices, manipulate database imports, or bypass verification gates off-system is logged inside historical audit trials permanently and constitutes a breach of Reliabletech security standards.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
};
