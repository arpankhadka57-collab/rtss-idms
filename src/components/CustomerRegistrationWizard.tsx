import React, { useState, useEffect } from 'react';
import {
  User,
  Building2,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Camera,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Compass,
  FileText,
  Sparkles,
  Upload,
  X,
  RefreshCw,
  Clock,
  Languages
} from 'lucide-react';
import {
  CustomerAccount,
  CustomerAccountCategory,
  PermittedMunicipality
} from '../types';
import { requestOtpCode, verifyOtpCodeOnline, maskEmailAddress } from '../utils/otpAuth';
import { IlamDistrictMapPicker, DeliveryLocationData } from './IlamDistrictMapPicker';

interface CustomerRegistrationWizardProps {
  customerAccounts: CustomerAccount[];
  onRegisterSuccess: (account: CustomerAccount) => void;
  onCancel: () => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const ACCOUNT_CATEGORIES_LOCALIZED: Record<
  'ENG' | 'NEP',
  { label: CustomerAccountCategory; icon: string; title: string; desc: string }[]
> = {
  ENG: [
    { label: 'Individual / Household', icon: '👤', title: 'Individual / Household', desc: 'Personal household, individual buyer' },
    { label: 'Tea Estate / Factory', icon: '🍃', title: 'Tea Estate / Factory', desc: 'Tea processing factory, garden, estate' },
    { label: 'School / College / Campus', icon: '🎓', title: 'School / College / Campus', desc: 'Educational institution, campus, school' },
    { label: 'Government / Municipality / Ward', icon: '🏛️', title: 'Government / Municipality / Ward', desc: 'Ward office, municipality, public sector' },
    { label: 'Cooperative / Microfinance', icon: '🏦', title: 'Cooperative / Microfinance', desc: 'Sahakari, financial cooperative' },
    { label: 'Commercial Business / Retail', icon: '🏢', title: 'Commercial Business / Retail', desc: 'Retail store, wholesale vendor, company' },
    { label: 'Hotel / Resort / Homestay', icon: '🏨', title: 'Hotel / Resort / Homestay', desc: 'Hospitality, homestay, resort in Ilam' }
  ],
  NEP: [
    { label: 'Individual / Household', icon: '👤', title: 'व्यक्तिगत / घरायसी', desc: 'व्यक्तिगत प्रयोग, घरायसी सामान खरिदकर्ता' },
    { label: 'Tea Estate / Factory', icon: '🍃', title: 'चिया कमान / फ्याक्ट्री', desc: 'चिया प्रशोधन कारखाना, बगान वा स्टेट' },
    { label: 'School / College / Campus', icon: '🎓', title: 'विद्यालय / कलेज / क्याम्पस', desc: 'शैक्षिक संस्था, विद्यालय, क्याम्पस' },
    { label: 'Government / Municipality / Ward', icon: '🏛️', title: 'सरकारी / नगरपालिका / वडा', desc: 'वडा कार्यालय, नगरपालिका, सरकारी निकाय' },
    { label: 'Cooperative / Microfinance', icon: '🏦', title: 'सहकारी / लघुवित्त संस्था', desc: 'सहकारी संस्था, वित्तीय कारोबार' },
    { label: 'Commercial Business / Retail', icon: '🏢', title: 'व्यापारिक फर्म / पसल / व्यवसाय', desc: 'खुद्रा तथा थोक पसल, व्यावसायिक कम्पनी' },
    { label: 'Hotel / Resort / Homestay', icon: '🏨', title: 'होटल / रिसोर्ट / होमस्टे', desc: 'पर्यटकीय होटल, रिसोर्ट, होमस्टे' }
  ]
};

const T = {
  ENG: {
    // Top banner in Step 1
    langTitle: 'Choose Registration Language',
    langSubtitle: 'Select English or Nepali so you can fill every detail with total understanding.',
    // Step indicators
    stepOf: (cur: number) => `Step ${cur} of 6`,
    stepNames: [
      'Account Category & Name',
      'Contact & Email',
      'Email OTP Security',
      'Credentials & Avatar',
      'Delivery Area & Map',
      'Corporate PAN Invoicing'
    ],
    stepPills: ['Identity', 'Contact', 'Verify', 'Login', 'Delivery', 'Billing'],
    // Step 1
    step1Title: 'Select Your Account Category & Name',
    step1Desc: 'Please choose how you will be using RTSS services and provide your complete official address.',
    accountCategoryLabel: 'Account Category',
    fullNameLabel: 'Full Name / Primary Contact Person',
    fullNamePlaceholder: 'e.g. Suresh Pradhan / Anup Thapa',
    fullAddressLabel: 'Full Address',
    fullAddressPlaceholder: 'e.g. Ward No. 10, Fikkal Bazaar, Suryodaya, Ilam, Nepal (Near Old Bus Park)',
    cancelBtn: 'Cancel',
    nextStep2Btn: 'Next: Contact Details',
    // Step 2
    step2Title: 'Contact Numbers & Email Address',
    step2Desc: 'Your primary contact number and email are used for dispatch updates, security OTP, and order tracking.',
    phoneLabel: 'Contact Number (Mandatory Mobile)',
    phonePlaceholder: 'e.g. 9852681554',
    phoneNote: '10-digit Nepal mobile number.',
    altPhoneLabel: 'Secondary Contact Number',
    altPhoneOptional: '(Optional alternative or landline)',
    altPhonePlaceholder: 'e.g. 027-540123 or 9801234567',
    emailLabel: 'Email ID',
    emailMandatoryNote: '(Mandatory for OTP Verification)',
    emailPlaceholder: 'e.g. customer@gmail.com',
    emailHelper: 'We will send a one-time verification code to this email in the next step.',
    backBtn: 'Back',
    nextStep3Btn: 'Next: Email OTP Verification',
    // Step 3
    step3Title: 'Verify Your Email Address',
    expiresIn: 'Expires in',
    resendCode: 'Resend Code',
    sendingCode: 'Sending...',
    backChangeEmail: 'Back (Change Email)',
    verifyingCode: 'Verifying Code...',
    verifyCodeBtn: 'Verify Code & Continue',
    // Step 4
    step4Title: 'Choose Username, Password & Profile Picture',
    step4Desc: 'Set up your login credentials so you can log into RTSS Storefront and view previous orders.',
    profilePicLabel: 'Profile Picture',
    optionalTag: '(Optional)',
    uploadImage: 'Upload Image',
    orPick: 'or pick:',
    usernameLabel: 'Choose Username',
    usernameQuickLogin: '(For quick login)',
    usernamePlaceholder: 'e.g. suresh_fikkal / anup_rtss',
    usernameNote: 'Lowercase letters, numbers, and underscores.',
    passwordLabel: 'Choose Password',
    passwordPlaceholder: 'Minimum 4 characters',
    confirmPasswordLabel: 'Confirm Password',
    confirmPasswordPlaceholder: 'Re-type your password',
    nextStep5Btn: 'Next: Delivery Area & Map',
    // Step 5
    step5Title: 'Select Your Delivery Area',
    step5Desc: 'Choose your delivery location either through the interactive live map of Ilam district or using the form.',
    liveMapToggle: 'Live Map',
    formToggle: 'Form',
    mapMunicipality: 'Municipality:',
    mapWard: 'Ward No:',
    mapLandmark: 'Tole / Bazaar Landmark:',
    mapLandmarkPlaceholder: 'Specific Tole or Nearby Shop',
    formMunicipalityLabel: 'Municipality in Ilam',
    suryodayaOption: 'Suryodaya Municipality (Fikkal / Kanyam / Pashupatinagar / Antu)',
    rongOption: 'Rong Municipality (Kolbung / Harkatte / Kutidanda)',
    ilamOption: 'Ilam Municipality (District HQ / Barbote / Singhabahini)',
    formWardLabel: 'Ward Number',
    wardPrefix: 'Ward No.',
    formToleLabel: 'Tole / Bazaar / Village',
    formTolePlaceholder: 'e.g. Fikkal Bazaar, Kanyam Chowk, Harkatte, Antu Danda',
    formLandmarkLabel: 'Landmark / Proximity Note',
    formLandmarkPlaceholder: 'e.g. Near Old Bus Stand, Opposite RBB Bank, Near Tea Factory Gate',
    nextStep6Btn: 'Next: Institutional Invoicing',
    // Step 6
    step6Title: 'Institutional / Corporate Billing & Credit (PAN Invoicing)',
    step6Desc: 'Optionally enable corporate billing with registered PAN number to receive formal tax invoices, VAT bills, and credit facilities.',
    corporateToggleTitle: 'Enable Institutional / Corporate Billing & Credit PAN Invoicing',
    b2bTag: 'B2B Tax Credit',
    corporateToggleDesc: 'Check this if you represent a Tea Factory, Business, School, Cooperative, or Public Entity that requires verified PAN/VAT Invoices and monthly credit invoicing.',
    orgNameLabel: 'Registered Organization / Business Name',
    orgNamePlaceholder: 'e.g. Kanyam Organic Tea Estate Pvt. Ltd.',
    orgPanLabel: '9-Digit PAN Number',
    orgPanHelper: 'Government of Nepal registered 9-digit PAN/VAT.',
    orgPanPlaceholder: 'e.g. 302819405',
    designationLabel: 'Your Designation in Organization',
    designationPlaceholder: 'e.g. Managing Director / Accountant',
    orgAddressLabel: 'Registered Tax Office Address',
    orgAddressPlaceholder: 'e.g. Suryodaya-10, Ilam',
    reviewLabel: 'Account Review:',
    submitBtn: 'Create Account & Start Shopping',
    // Validation messages
    valNameRequired: 'Please enter your Full Name.',
    valAddressRequired: 'Please provide your Full Address.',
    valPhoneRequired: 'Primary Contact Number is mandatory.',
    valPhoneDigits: 'Please enter a valid 10-digit mobile number (e.g. 98XXXXXXXX).',
    valEmailRequired: 'Email address is mandatory for account verification and security.',
    valEmailInvalid: 'Please enter a valid email address.',
    valPhoneExists: 'An account with this contact number already exists.',
    valEmailExists: 'An account with this email address already exists.',
    valOtpEmpty: 'Please enter the 6-digit verification code.',
    valOtpInvalid: 'Invalid verification code. Please check your email or request a new code.',
    valUsernameRequired: 'Please choose a username.',
    valUsernameMin: 'Username must be at least 3 characters long.',
    valUsernameTaken: 'This username is already taken. Please choose another.',
    valPasswordRequired: 'Please enter a password.',
    valPasswordMin: 'Password should be at least 4 characters long.',
    valPasswordMismatch: 'Passwords do not match.',
    valMunicipalityRequired: 'Please select your delivery municipality.',
    valWardRequired: 'Please specify your delivery ward.',
    valOrgNameRequired: 'Please provide the Organization / Business Name.',
    valOrgPanRequired: 'Please enter your 9-digit PAN Number for institutional credit/tax billing.',
    valOrgPanDigits: 'PAN number must be exactly 9 digits numeric.'
  },
  NEP: {
    // Top banner in Step 1
    langTitle: 'दर्ता फारमको भाषा छान्नुहोस्',
    langSubtitle: 'सबै विवरणहरू स्पष्ट बुझेर भर्नका लागि अंग्रेजी वा नेपाली भाषा छान्नुहोस्।',
    // Step indicators
    stepOf: (cur: number) => `चरण ${cur} / ६`,
    stepNames: [
      'खाताको प्रकार र नाम',
      'सम्पर्क नम्बर र इमेल',
      'इमेल ओटिपी प्रमाणीकरण',
      'लगइन विवरण र प्रोफाइल तस्बिर',
      'डेलिभरी क्षेत्र र नक्सा',
      'संस्थागत प्यान (PAN) बिलिङ'
    ],
    stepPills: ['परिचय', 'सम्पर्क', 'प्रमाणीकरण', 'लगइन', 'डेलिभरी', 'बिलिङ'],
    // Step 1
    step1Title: 'आफ्नो खाताको प्रकार र नाम छान्नुहोस्',
    step1Desc: 'कृपया तपाईंले RTSS सेवाहरू कसरी प्रयोग गर्नुहुनेछ सो छान्नुहोस् र आफ्नो पूरा ठेगाना प्रविष्ट गर्नुहोस्।',
    accountCategoryLabel: 'खाताको प्रकार (Category)',
    fullNameLabel: 'पूरा नाम / मुख्य सम्पर्क व्यक्तिको नाम',
    fullNamePlaceholder: 'उदा: सुरेश प्रधान / अनुप थापा',
    fullAddressLabel: 'पूरा ठेगाना',
    fullAddressPlaceholder: 'उदा: वडा नं. १०, फिक्कल बजार, सूर्योदय, इलाम, नेपाल (पुरानो बसपार्क नजिक)',
    cancelBtn: 'रद्द गर्नुहोस्',
    nextStep2Btn: 'अगाडि: सम्पर्क विवरण',
    // Step 2
    step2Title: 'सम्पर्क नम्बर तथा इमेल ठेगाना',
    step2Desc: 'तपाईंको मुख्य सम्पर्क नम्बर र इमेल अर्डर अपडेट, सुरक्षा ओटिपी (OTP) र डेलिभरी ट्र्याकिङका लागि प्रयोग गरिन्छ।',
    phoneLabel: 'मोबाइल नम्बर (अनिवार्य)',
    phonePlaceholder: 'उदा: ९८५२६८१५५४',
    phoneNote: '१० अंकको नेपालको मोबाइल नम्बर।',
    altPhoneLabel: 'दोस्रो सम्पर्क नम्बर',
    altPhoneOptional: '(वैकल्पिक वा ल्याण्डलाइन नम्बर)',
    altPhonePlaceholder: 'उदा: ०२७-५४०१२३ वा ९८०१२३४५६७',
    emailLabel: 'इमेल ठेगाना',
    emailMandatoryNote: '(सुरक्षा ओटिपी प्रमाणीकरणका लागि अनिवार्य)',
    emailPlaceholder: 'उदा: customer@gmail.com',
    emailHelper: 'अर्को चरणमा हामी यस इमेलमा एकपटकको प्रमाणीकरण कोड (OTP) पठाउनेछौं।',
    backBtn: 'पछाडि',
    nextStep3Btn: 'अगाडि: इमेल ओटिपी प्रमाणीकरण',
    // Step 3
    step3Title: 'तपाईंको इमेल ठेगाना प्रमाणीकरण गर्नुहोस्',
    expiresIn: 'म्याद बाँकी',
    resendCode: 'पुन: कोड पठाउनुहोस्',
    sendingCode: 'पठाउँदैछ...',
    backChangeEmail: 'पछाडि (इमेल सच्याउनुहोस्)',
    verifyingCode: 'प्रमाणीकरण हुँदैछ...',
    verifyCodeBtn: 'कोड प्रमाणीकरण गरी अगाडि बढ्नुहोस्',
    // Step 4
    step4Title: 'प्रयोगकर्ता नाम (Username), पासवर्ड र प्रोफाइल तस्बिर छान्नुहोस्',
    step4Desc: 'तपाईंको लगइन विवरण सेट गर्नुहोस् जसबाट RTSS स्टोरमा लगइन गरी पुराना अर्डरहरू हेर्न सक्नुहुन्छ।',
    profilePicLabel: 'प्रोफाइल तस्बिर',
    optionalTag: '(वैकल्पिक)',
    uploadImage: 'तस्बिर अपलोड',
    orPick: 'वा छान्नुहोस्:',
    usernameLabel: 'प्रयोगकर्ता नाम (Username)',
    usernameQuickLogin: '(छिटो लगइनका लागि)',
    usernamePlaceholder: 'उदा: suresh_fikkal / anup_rtss',
    usernameNote: 'साना अंग्रेजी अक्षरहरू, अंकहरू र अन्डरस्कोर मात्र।',
    passwordLabel: 'पासवर्ड छान्नुहोस्',
    passwordPlaceholder: 'कम्तिमा ४ अक्षर वा अंक',
    confirmPasswordLabel: 'पासवर्ड पुन: पुष्टि गर्नुहोस्',
    confirmPasswordPlaceholder: 'आफ्नो पासवर्ड पुन: टाइप गर्नुहोस्',
    nextStep5Btn: 'अगाडि: डेलिभरी क्षेत्र र नक्सा',
    // Step 5
    step5Title: 'तपाईंको डेलिभरी क्षेत्र छान्नुहोस्',
    step5Desc: 'इलाम जिल्लाको प्रत्यक्ष नक्सा वा फारम प्रयोग गरेर आफ्नो डेलिभरी स्थान छान्नुहोस्।',
    liveMapToggle: 'प्रत्यक्ष नक्सा',
    formToggle: 'फारम (Form)',
    mapMunicipality: 'नगरपालिका / पालिका:',
    mapWard: 'वडा नं:',
    mapLandmark: 'टोल / बजार / ल्याण्डमार्क:',
    mapLandmarkPlaceholder: 'नजिकको पसल वा चोकको नाम',
    formMunicipalityLabel: 'इलामको पालिका छान्नुहोस्',
    suryodayaOption: 'सूर्योदय नगरपालिका (फिक्कल / कन्याम / पशुपतिनगर / अन्तु)',
    rongOption: 'रोङ गाउँपालिका (कोलबुङ / हर्कटे / कुटीडाँडा)',
    ilamOption: 'इलाम नगरपालिका (सदरमुकाम / बरबोटे / सिंहबाहिनी)',
    formWardLabel: 'वडा नम्बर',
    wardPrefix: 'वडा नं.',
    formToleLabel: 'टोल / बजार / गाउँ',
    formTolePlaceholder: 'उदा: फिक्कल बजार, कन्याम चोक, हर्कटे, अन्तु डाँडा',
    formLandmarkLabel: 'नजिकको चिनारी / ल्याण्डमार्क नोट',
    formLandmarkPlaceholder: 'उदा: पुरानो बसपार्क नजिक, राष्ट्रिय वाणिज्य बैंक अगाडि, चिया फ्याक्ट्री गेट',
    nextStep6Btn: 'अगाडि: संस्थागत बिलिङ विवरण',
    // Step 6
    step6Title: 'संस्थागत / व्यावसायिक बिलिङ र प्यान (PAN) बिजक',
    step6Desc: 'औपचारिक कर बिजक (VAT/Tax Invoice) र उधारो सुविधा प्राप्त गर्न दर्ता भएको प्यान नम्बर खुलाउनुहोस्।',
    corporateToggleTitle: 'संस्थागत / व्यावसायिक बिलिङ तथा प्यान बिजक सक्षम गर्नुहोस्',
    b2bTag: 'कर बिजक / क्रेडिट',
    corporateToggleDesc: 'यदि तपाईं चिया कमान, पसल/व्यवसाय, विद्यालय, सहकारी वा सरकारी निकायबाट हुनुहुन्छ र प्यान बिल आवश्यक पर्दछ भने यसलाई सक्षम गर्नुहोस्।',
    orgNameLabel: 'दर्ता भएको संस्था वा व्यवसायको नाम',
    orgNamePlaceholder: 'उदा: कन्याम अर्गानिक टी स्टेट प्रा. लि.',
    orgPanLabel: '९ अंकको प्यान (PAN) नम्बर',
    orgPanHelper: 'नेपाल सरकार आन्तरिक राजस्व विभागमा दर्ता भएको ९ अंकको प्यान/भ्याट नम्बर।',
    orgPanPlaceholder: 'उदा: ३०२८१९४०५',
    designationLabel: 'संस्थामा तपाईंको पद',
    designationPlaceholder: 'उदा: प्रबन्ध निर्देशक / लेखापाल / अधिकृत',
    orgAddressLabel: 'दर्ता भएको कर कार्यालय ठेगाना',
    orgAddressPlaceholder: 'उदा: सूर्योदय-१०, इलाम',
    reviewLabel: 'खाता विवरण समीक्षा:',
    submitBtn: 'खाता सिर्जना गर्नुहोस् र किनमेल सुरु गर्नुहोस्',
    // Validation messages
    valNameRequired: 'कृपया आफ्नो पूरा नाम प्रविष्ट गर्नुहोस्।',
    valAddressRequired: 'कृपया आफ्नो पूरा ठेगाना प्रविष्ट गर्नुहोस्।',
    valPhoneRequired: 'सम्पर्क मोबाइल नम्बर अनिवार्य छ।',
    valPhoneDigits: 'कृपया १० अंकको मान्य मोबाइल नम्बर प्रविष्ट गर्नुहोस् (उदा: ९८xxxxxxxx)।',
    valEmailRequired: 'सुरक्षा र प्रमाणीकरणका लागि इमेल ठेगाना अनिवार्य छ।',
    valEmailInvalid: 'कृपया मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस्।',
    valPhoneExists: 'यस मोबाइल नम्बरबाट पहिले नै खाता दर्ता भइसकेको छ।',
    valEmailExists: 'यस इमेलबाट पहिले नै खाता दर्ता भइसकेको छ।',
    valOtpEmpty: 'कृपया ६ अंकको प्रमाणीकरण कोड प्रविष्ट गर्नुहोस्।',
    valOtpInvalid: 'प्रमाणीकरण कोड अमान्य भयो। कृपया आफ्नो इमेल जाँच्नुहोस् वा नयाँ कोड माग्नुहोस्।',
    valUsernameRequired: 'कृपया प्रयोगकर्ता नाम (Username) छान्नुहोस्।',
    valUsernameMin: 'प्रयोगकर्ता नाम कम्तिमा ३ अक्षरको हुनुपर्छ।',
    valUsernameTaken: 'यो प्रयोगकर्ता नाम पहिले नै प्रयोगमा छ। कृपया अर्को छान्नुहोस्।',
    valPasswordRequired: 'कृपया पासवर्ड प्रविष्ट गर्नुहोस्।',
    valPasswordMin: 'पासवर्ड कम्तिमा ४ अक्षर वा अंकको हुनुपर्छ।',
    valPasswordMismatch: 'पासवर्डहरू मिलेनन्।',
    valMunicipalityRequired: 'कृपया डेलिभरी हुने पालिका छान्नुहोस्।',
    valWardRequired: 'कृपया डेलिभरी वडा खुलाउनुहोस्।',
    valOrgNameRequired: 'कृपया संस्था वा व्यवसायको नाम खुलाउनुहोस्।',
    valOrgPanRequired: 'संस्थागत कर बिलिङका लागि ९ अंकको प्यान नम्बर प्रविष्ट गर्नुहोस्।',
    valOrgPanDigits: 'प्यान नम्बर ठ्याक्कै ९ अंकको हुनुपर्छ।'
  }
};

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
];

export const CustomerRegistrationWizard: React.FC<CustomerRegistrationWizardProps> = ({
  customerAccounts,
  onRegisterSuccess,
  onCancel,
  onToast
}) => {
  // Wizard current step: 1 to 6
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Language selection: ENG or NEP (Selected in Step 1)
  const [regLanguage, setRegLanguage] = useState<'ENG' | 'NEP'>('ENG');
  const t = T[regLanguage];

  // STEP 1: Account Category, Full Name, Full Address
  const [accountCategory, setAccountCategory] = useState<CustomerAccountCategory>('Individual / Household');
  const [fullName, setFullName] = useState<string>('');
  const [fullAddress, setFullAddress] = useState<string>('');

  // STEP 2: Contact Number (mandatory), Secondary Contact (optional), Email ID (mandatory)
  const [phone, setPhone] = useState<string>('');
  const [altPhone, setAltPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // STEP 3: OTP Verification
  const [otpCode, setOtpCode] = useState<string>('');
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [otpCountdown, setOtpCountdown] = useState<number>(300);
  const [maskedEmail, setMaskedEmail] = useState<string>('');

  // STEP 4: Choose Username, Password, Profile Picture
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [profilePicture, setProfilePicture] = useState<string>('');

  // STEP 5: Delivery Area (Form OR Maps of Ilam District)
  const [deliveryMethod, setDeliveryMethod] = useState<'form' | 'map'>('map');
  const [municipality, setMunicipality] = useState<PermittedMunicipality>('Suryodaya Municipality');
  const [ward, setWard] = useState<string>('10');
  const [toleArea, setToleArea] = useState<string>('Fikkal Bazaar');
  const [landmark, setLandmark] = useState<string>('Near Chowk / RTSS Hub');
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number }>({
    lat: 26.8997,
    lng: 88.0844
  });

  // STEP 6: Institutional / Corporate Billing & Credit PAN Invoicing
  const [isInstitutional, setIsInstitutional] = useState<boolean>(false);
  const [orgName, setOrgName] = useState<string>('');
  const [orgPan, setOrgPan] = useState<string>('');
  const [designation, setDesignation] = useState<string>('');
  const [orgAddress, setOrgAddress] = useState<string>('');

  // Countdown timer for OTP
  useEffect(() => {
    let timer: any;
    if (isOtpSent && otpCountdown > 0 && !isEmailVerified) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOtpSent, otpCountdown, isEmailVerified]);

  // When step 1 category changes to a business or school, auto-suggest institutional billing
  useEffect(() => {
    if (accountCategory !== 'Individual') {
      setIsInstitutional(true);
    }
  }, [accountCategory]);

  // ----------------------------------------------------
  // NAVIGATION & VALIDATION
  // ----------------------------------------------------

  const handleNextFromStep1 = () => {
    setErrorMessage('');
    if (!fullName.trim()) {
      setErrorMessage(t.valNameRequired);
      return;
    }
    if (!fullAddress.trim()) {
      setErrorMessage(t.valAddressRequired);
      return;
    }
    setCurrentStep(2);
  };

  const handleNextFromStep2 = async () => {
    setErrorMessage('');
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();

    if (!cleanPhone) {
      setErrorMessage(t.valPhoneRequired);
      return;
    }
    if (!/^\d{10}$/.test(cleanPhone)) {
      setErrorMessage(t.valPhoneDigits);
      return;
    }
    if (!cleanEmail) {
      setErrorMessage(t.valEmailRequired);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage(t.valEmailInvalid);
      return;
    }

    // Check uniqueness
    const existingPhone = customerAccounts.find((c) => c.phone === cleanPhone);
    if (existingPhone) {
      setErrorMessage(t.valPhoneExists);
      return;
    }
    const existingEmail = customerAccounts.find((c) => c.email?.toLowerCase() === cleanEmail.toLowerCase());
    if (existingEmail) {
      setErrorMessage(t.valEmailExists);
      return;
    }

    // Proceed to OTP step & trigger OTP automatically
    setCurrentStep(3);
    if (!isEmailVerified && !isOtpSent) {
      await handleSendOtp();
    }
  };

  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    setErrorMessage('');
    try {
      const res = await requestOtpCode(email.trim(), 'Customer Registration', fullName.trim());
      setIsSendingOtp(false);
      if (res.success) {
        setIsOtpSent(true);
        setOtpCountdown(300);
        setMaskedEmail(res.emailMasked || maskEmailAddress(email.trim()));
        onToast(`Verification code sent to ${maskEmailAddress(email.trim())}`, 'success');
      } else {
        // Even if email failed, user can still proceed using test code or retry
        setIsOtpSent(true);
        setMaskedEmail(maskEmailAddress(email.trim()));
      }
    } catch (err: any) {
      setIsSendingOtp(false);
      setIsOtpSent(true);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setErrorMessage(t.valOtpEmpty);
      return;
    }
    setIsVerifyingOtp(true);
    setErrorMessage('');

    try {
      const res = await verifyOtpCodeOnline(email.trim(), otpCode.trim(), 'Customer Registration');
      setIsVerifyingOtp(false);

      if (res.verified) {
        setIsEmailVerified(true);
        onToast('Email verified successfully!', 'success');
        // Auto-generate a default username suggestion if empty
        if (!username) {
          const baseUser = fullName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15);
          const randSuffix = Math.floor(100 + Math.random() * 900);
          setUsername(`${baseUser}_${randSuffix}`);
        }
        // Proceed to Step 4
        setCurrentStep(4);
      } else {
        setErrorMessage(res.error || t.valOtpInvalid);
      }
    } catch (err: any) {
      setIsVerifyingOtp(false);
      setErrorMessage(err.message || 'Error verifying OTP code.');
    }
  };

  const handleNextFromStep4 = () => {
    setErrorMessage('');
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setErrorMessage(t.valUsernameRequired);
      return;
    }
    if (cleanUsername.length < 3) {
      setErrorMessage(t.valUsernameMin);
      return;
    }
    const existingUser = customerAccounts.find(
      (c) => c.username?.toLowerCase() === cleanUsername
    );
    if (existingUser) {
      setErrorMessage(t.valUsernameTaken);
      return;
    }

    if (!password) {
      setErrorMessage(t.valPasswordRequired);
      return;
    }
    if (password.length < 4) {
      setErrorMessage(t.valPasswordMin);
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      setErrorMessage(t.valPasswordMismatch);
      return;
    }

    setCurrentStep(5);
  };

  const handleNextFromStep5 = () => {
    setErrorMessage('');
    if (!municipality) {
      setErrorMessage(t.valMunicipalityRequired);
      return;
    }
    if (!ward) {
      setErrorMessage(t.valWardRequired);
      return;
    }
    setCurrentStep(6);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isInstitutional) {
      if (!orgName.trim()) {
        setErrorMessage(t.valOrgNameRequired);
        return;
      }
      if (!orgPan.trim()) {
        setErrorMessage(t.valOrgPanRequired);
        return;
      }
      if (!/^\d{9}$/.test(orgPan.trim())) {
        setErrorMessage(t.valOrgPanDigits);
        return;
      }
    }

    const newCust: CustomerAccount = {
      customer_id: `RTSS-CUST-${Date.now().toString().slice(-4)}`,
      name: fullName.trim(),
      full_name: fullName.trim(),
      username: username.trim().toLowerCase(),
      profilePicture: profilePicture || undefined,
      phone: phone.trim(),
      phone_primary: phone.trim(),
      alt_phone: altPhone.trim() || undefined,
      email: email.trim().toLowerCase(),
      password: password,
      account_category: accountCategory,
      municipality,
      ward,
      tole_area: toleArea.trim() || undefined,
      landmark: landmark.trim() || undefined,
      detailed_address: fullAddress.trim(),
      mapCoordinates,
      is_institutional: isInstitutional,
      organization_name: isInstitutional ? orgName.trim() : undefined,
      organization_pan: isInstitutional ? orgPan.trim() : undefined,
      contact_designation: isInstitutional ? designation.trim() || undefined : undefined,
      preferred_language: regLanguage,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Active'
    };

    onRegisterSuccess(newCust);
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      onToast('Profile picture must be under 2MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePicture(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ----------------------------------------------------
  // RENDER STEP CONTENT
  // ----------------------------------------------------

  const renderStepIndicator = () => (
    <div className="pb-4 border-b border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black uppercase tracking-wider text-sky-700">
          {t.stepOf(currentStep, 6)}
        </span>
        <span className="text-xs font-extrabold text-slate-500">
          {currentStep === 1 && t.step1Title}
          {currentStep === 2 && t.step2Title}
          {currentStep === 3 && t.step3Title}
          {currentStep === 4 && t.step4Title}
          {currentStep === 5 && t.step5Title}
          {currentStep === 6 && t.step6Title}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-sky-600 to-indigo-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / 6) * 100}%` }}
        />
      </div>

      {/* Steps Pills */}
      <div className="grid grid-cols-6 gap-1 mt-3">
        {[
          { num: 1, label: t.pillIdentity },
          { num: 2, label: t.pillContact },
          { num: 3, label: t.pillVerify },
          { num: 4, label: t.pillLogin },
          { num: 5, label: t.pillDelivery },
          { num: 6, label: t.pillBilling }
        ].map((s) => (
          <div
            key={s.num}
            className={`text-center py-1 px-1 rounded-md text-[10px] font-bold truncate ${
              s.num === currentStep
                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                : s.num < currentStep
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-50 text-slate-400'
            }`}
          >
            {s.num < currentStep ? `✓ ${s.label}` : `${s.num}. ${s.label}`}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5 sm:p-7 max-w-2xl w-full mx-auto font-sans">
      {renderStepIndicator()}

      {errorMessage && (
        <div className="my-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 1: CATEGORY, FULL NAME, FULL ADDRESS                    */}
      {/* ============================================================ */}
      {currentStep === 1 && (
        <div className="space-y-4 py-3">
          {/* Prominent Language Selector Banner (Step 1 only) */}
          <div className="p-3.5 bg-gradient-to-r from-sky-50 via-indigo-50/70 to-emerald-50/80 rounded-2xl border border-sky-200/90 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Languages size={19} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      {t.selectLanguage}
                    </span>
                    <span className="text-[10px] bg-sky-200 text-sky-800 font-black px-1.5 py-0.5 rounded">
                      Step 1
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {t.langHelp}
                  </p>
                </div>
              </div>

              {/* Language Switch Pills */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setRegLanguage('ENG')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    regLanguage === 'ENG'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-sm">🇬🇧</span>
                  <span>English</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRegLanguage('NEP')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    regLanguage === 'NEP'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-sm">🇳🇵</span>
                  <span>नेपाली</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {t.step1Title}
            </h3>
            <p className="text-xs text-slate-500">
              {t.step1Desc}
            </p>
          </div>

          {/* Account Category Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t.accountCategoryLabel} <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ACCOUNT_CATEGORIES_LOCALIZED[regLanguage].map((cat) => {
                const isSelected = accountCategory === cat.label;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setAccountCategory(cat.label)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-sky-50 border-sky-600 ring-2 ring-sky-600/20 text-sky-950'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-xl mb-1">{cat.icon}</div>
                    <span className="text-xs font-bold leading-tight">{cat.title}</span>
                    <span className="text-[10px] text-slate-400 truncate mt-0.5">{cat.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.fullNameLabel} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                placeholder={t.fullNamePlaceholder}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Full Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.fullAddressLabel} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
              <textarea
                required
                rows={3}
                placeholder={t.fullAddressPlaceholder}
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={handleNextFromStep1}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <span>{t.nextContact}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 2: CONTACT DETAILS & EMAIL                              */}
      {/* ============================================================ */}
      {currentStep === 2 && (
        <div className="space-y-4 py-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {t.step2Title}
            </h3>
            <p className="text-xs text-slate-500">
              {t.step2Desc}
            </p>
          </div>

          {/* Primary Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.primaryPhoneLabel} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="tel"
                required
                maxLength={10}
                placeholder={t.primaryPhonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{t.primaryPhoneHelp}</p>
          </div>

          {/* Secondary Phone (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.secondaryPhoneLabel} <span className="text-slate-400 font-normal">{regLanguage === 'NEP' ? '(ऐच्छिक वा ल्याण्डलाइन)' : '(Optional alternative or landline)'}</span>
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="tel"
                placeholder={t.secondaryPhonePlaceholder}
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
              />
            </div>
          </div>

          {/* Email ID (Mandatory) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.emailLabel} <span className="text-rose-500">* ({regLanguage === 'NEP' ? 'OTP प्रमाणीकरणको लागि अनिवार्य' : 'Mandatory for OTP Verification'})</span>
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {t.emailHelp}
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-200">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>{t.back}</span>
            </button>
            <button
              type="button"
              onClick={handleNextFromStep2}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <span>{t.nextOtp}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 3: EMAIL OTP VERIFICATION                               */}
      {/* ============================================================ */}
      {currentStep === 3 && (
        <div className="space-y-4 py-3 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200 shadow-xs">
            <ShieldCheck size={28} />
          </div>

          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {t.step3Title}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {regLanguage === 'NEP' ? (
                <>हामीले <strong className="text-slate-800">{maskedEmail || email}</strong> मा ६-अङ्कको प्रमाणीकरण सुरक्षा कोड पठाएका छौँ। कृपया तल कोड प्रविष्ट गर्नुहोस्।</>
              ) : (
                <>We sent a 6-digit verification security code to <strong className="text-slate-800">{maskedEmail || email}</strong>. Please enter the code below.</>
              )}
            </p>
          </div>

          {/* OTP INPUT */}
          <div className="max-w-xs mx-auto space-y-2">
            <input
              type="text"
              maxLength={6}
              autoFocus
              placeholder="• • • • • •"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\s/g, ''))}
              className="w-full text-center text-2xl font-mono tracking-widest py-3 px-4 bg-slate-50 border-2 border-sky-300 rounded-xl font-black text-sky-950 focus:bg-white focus:outline-hidden focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20"
            />

            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                <span>
                  {t.expiresIn(Math.floor(otpCountdown / 60), (otpCountdown % 60).toString().padStart(2, '0'))}
                </span>
              </span>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp}
                className="text-sky-600 hover:text-sky-800 font-bold cursor-pointer transition disabled:opacity-50"
              >
                {isSendingOtp ? t.sending : t.resendCode}
              </button>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-200 text-left">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>{t.backChangeEmail}</span>
            </button>

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={isVerifyingOtp || !otpCode.trim()}
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isVerifyingOtp ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>{t.verifyingCode}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>{t.verifyCodeBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 4: CHOOSE USERNAME, PASSWORD, PROFILE PICTURE           */}
      {/* ============================================================ */}
      {currentStep === 4 && (
        <div className="space-y-4 py-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {t.step4Title}
            </h3>
            <p className="text-xs text-slate-500">
              {t.step4Desc}
            </p>
          </div>

          {/* Profile Picture (Optional) */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-4">
            <div className="relative shrink-0">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-sky-500 shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-extrabold text-xl border-2 border-dashed border-sky-300">
                  {fullName ? fullName[0].toUpperCase() : 'U'}
                </div>
              )}
              {profilePicture && (
                <button
                  type="button"
                  onClick={() => setProfilePicture('')}
                  className="absolute -top-1 -right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 cursor-pointer shadow-xs"
                  title="Remove picture"
                >
                  <X size={11} />
                </button>
              )}
            </div>

            <div className="space-y-1.5 min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-800 block">
                {t.profilePicLabel} <span className="text-slate-400 font-normal">({t.optional})</span>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <label className="px-3 py-1.5 bg-white border border-slate-200 hover:border-sky-300 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs">
                  <Camera size={13} className="text-sky-600" />
                  <span>{t.uploadImage}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                    className="hidden"
                  />
                </label>

                {/* Preset Avatars */}
                <span className="text-[11px] text-slate-400 font-medium">{t.orPickAvatar}:</span>
                <div className="flex items-center gap-1">
                  {PRESET_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setProfilePicture(url)}
                      className={`w-7 h-7 rounded-full overflow-hidden border transition cursor-pointer ${
                        profilePicture === url ? 'ring-2 ring-sky-500 border-white' : 'border-slate-300'
                      }`}
                    >
                      <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.usernameLabel} <span className="text-rose-500">* ({regLanguage === 'NEP' ? 'द्रुत लगइनको लागि' : 'For quick login'})</span>
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                placeholder={t.usernamePlaceholder}
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{t.usernameHelp}</p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.passwordLabel} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.confirmPasswordLabel}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={t.confirmPasswordPlaceholder}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-200">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>{t.back}</span>
            </button>
            <button
              type="button"
              onClick={handleNextFromStep4}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <span>{t.nextDelivery}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 5: SELECT DELIVERY AREA (FORM OR LIVE MAP OF ILAM)      */}
      {/* ============================================================ */}
      {currentStep === 5 && (
        <div className="space-y-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {t.step5Title}
              </h3>
              <p className="text-xs text-slate-500">
                {t.step5Desc}
              </p>
            </div>

            {/* TOGGLE: MAP vs FORM */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setDeliveryMethod('map')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  deliveryMethod === 'map'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Compass size={13} />
                <span>{t.liveMap}</span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod('form')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  deliveryMethod === 'form'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText size={13} />
                <span>{t.form}</span>
              </button>
            </div>
          </div>

          {/* METHOD 1: LIVE MAP OF ILAM DISTRICT */}
          {deliveryMethod === 'map' ? (
            <div className="space-y-3">
              <IlamDistrictMapPicker
                selectedLocation={mapCoordinates}
                currentMunicipality={municipality}
                currentWard={ward}
                currentTole={toleArea}
                onLocationSelect={(data: DeliveryLocationData) => {
                  setMapCoordinates({ lat: data.lat, lng: data.lng });
                  setMunicipality(data.municipality);
                  if (data.ward) setWard(data.ward);
                  if (data.toleArea) setToleArea(data.toleArea);
                  if (data.landmark) setLandmark(data.landmark);
                }}
              />

              {/* Editable summary of picked location */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">{t.municipalityLabel}:</span>
                  <span className="font-bold text-slate-800">{municipality}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">{t.wardLabel}:</span>
                  <span className="font-bold text-slate-800">{regLanguage === 'NEP' ? `वडा नं. ${ward}` : `Ward ${ward}`}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">{t.toleLabel} / {t.landmarkLabel}:</span>
                  <input
                    type="text"
                    value={toleArea}
                    onChange={(e) => setToleArea(e.target.value)}
                    placeholder={t.tolePlaceholder}
                    className="w-full mt-0.5 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* METHOD 2: FORM SELECTOR */
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {/* Municipality */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.municipalityLabel} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value as PermittedMunicipality)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-sky-500"
                >
                  <option value="Suryodaya Municipality">Suryodaya Municipality (Fikkal / Kanyam / Pashupatinagar / Antu)</option>
                  <option value="Rong Municipality">Rong Municipality (Kolbung / Harkatte / Kutidanda)</option>
                  <option value="Ilam Municipality">Ilam Municipality (District HQ / Barbote / Singhabahini)</option>
                </select>
              </div>

              {/* Ward Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.wardLabel} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-sky-500"
                >
                  {Array.from({ length: 14 }, (_, i) => (i + 1).toString()).map((w) => (
                    <option key={w} value={w}>
                      {regLanguage === 'NEP' ? `वडा नं. ${w}` : `Ward No. ${w}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tole / Area / Bazaar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.toleLabel} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.tolePlaceholder}
                  value={toleArea}
                  onChange={(e) => setToleArea(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-sky-500"
                />
              </div>

              {/* Landmark */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.landmarkLabel}
                </label>
                <input
                  type="text"
                  placeholder={t.landmarkPlaceholder}
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-sky-500"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-200">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>{t.back}</span>
            </button>
            <button
              type="button"
              onClick={handleNextFromStep5}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <span>{t.nextBilling}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 6: INSTITUTIONAL / CORPORATE BILLING & PAN INVOICING    */}
      {/* ============================================================ */}
      {currentStep === 6 && (
        <form onSubmit={handleFinalSubmit} className="space-y-4 py-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {t.step6Title}
            </h3>
            <p className="text-xs text-slate-500">
              {t.step6Desc}
            </p>
          </div>

          {/* TOGGLE CARD */}
          <div
            onClick={() => setIsInstitutional(!isInstitutional)}
            className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-start gap-3.5 ${
              isInstitutional
                ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-600/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="checkbox"
              checked={isInstitutional}
              onChange={(e) => setIsInstitutional(e.target.checked)}
              className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900">
                  {t.enableInstitutional}
                </span>
                <span className="text-[10px] bg-indigo-200 text-indigo-800 font-extrabold px-1.5 py-0.5 rounded">
                  {t.b2bBadge}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t.institutionalDesc}
              </p>
            </div>
          </div>

          {/* INSTITUTIONAL FIELDS (If enabled) */}
          {isInstitutional && (
            <div className="space-y-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-200">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {t.orgNameLabel} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required={isInstitutional}
                    placeholder={t.orgNamePlaceholder}
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {t.orgPanLabel} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required={isInstitutional}
                  maxLength={9}
                  placeholder={t.orgPanPlaceholder}
                  value={orgPan}
                  onChange={(e) => setOrgPan(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono text-indigo-950 focus:outline-hidden focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">{t.orgPanHelp}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {t.designationLabel}
                  </label>
                  <input
                    type="text"
                    placeholder={t.designationPlaceholder}
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {t.orgAddressLabel}
                  </label>
                  <input
                    type="text"
                    placeholder={t.orgAddressPlaceholder}
                    value={orgAddress}
                    onChange={(e) => setOrgAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* FINAL ACCOUNT SUMMARY CARD */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {t.accountReview}:
            </span>
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span>{fullName} (@{username})</span>
              <span className="text-sky-700">
                {regLanguage === 'NEP'
                  ? ACCOUNT_CATEGORIES_LOCALIZED.NEP.find((c) => c.label === accountCategory)?.title || accountCategory
                  : accountCategory}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {phone} • {email} • {municipality}, {regLanguage === 'NEP' ? `वडा नं. ${ward}` : `Ward ${ward}`}
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-200">
            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>{t.back}</span>
            </button>
            <button
              type="submit"
              className="px-7 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-md transform active:scale-98"
            >
              <CheckCircle2 size={16} />
              <span>{t.createAccountBtn}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
