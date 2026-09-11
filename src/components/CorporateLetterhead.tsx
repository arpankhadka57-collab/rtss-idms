import React from 'react';
import { MapPin, Phone, Mail, FileText, Calendar, Building2 } from 'lucide-react';
import { BusinessProfile, LetterheadDocType } from '../types';

export interface CorporateLetterheadProps {
  profile: BusinessProfile;
  children?: React.ReactNode;
  documentType?: LetterheadDocType | 'General';
  isNepali?: boolean;
  className?: string;
  id?: string;
  hideHeader?: boolean;
  hideFooter?: boolean;
  showWatermark?: boolean;
  paddingMargin?: string;
}

export const CorporateLetterhead: React.FC<CorporateLetterheadProps> = ({
  profile,
  children,
  documentType = 'General',
  isNepali = false,
  className = '',
  id,
  hideHeader = false,
  hideFooter = false,
  showWatermark = false,
  paddingMargin = '12mm',
}) => {
  // Extract details directly from company profile (Settings tab)
  const companyName = profile?.name?.trim() || 'RELIABLETECH';
  const companyNameNepali = profile?.companyNameNepali?.trim() || '';
  const headerSubtitle = profile?.companySubtitle?.trim() || 'Services and Suppliers';
  const footerTagline = 'ReliableTech - Solutions You Can Count On, Services You can Trust.';
  const location = profile?.location?.trim() || '';
  const addressNepali = profile?.addressNepali?.trim() || '';
  const companyLogo = profile?.logoUrl?.trim() || '';
  const panNumber = profile?.panNumber?.trim() || '';
  const phone = profile?.phone?.trim() || '';
  const email = profile?.email?.trim() || '';
  const estdYear = profile?.estdYear?.trim() || '';

  return (
    <div
      id={id || 'corporate-letterhead-printable'}
      data-printable="true"
      className={`corporate-letterhead-outer-wrapper relative bg-white text-slate-900 flex flex-col justify-between shadow-sm border border-slate-200 rounded-lg overflow-hidden ${className}`}
      style={{
        maxWidth: '100%',
        boxSizing: 'border-box',
        fontFamily: "'Mukta', 'Inter', 'Kalimati', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        lineHeight: 1.4,
        width: '100%',
        minHeight: '1050px', // Standard proportion for print layout
      }}
    >
      <style>{`
        @media print {
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .corporate-letterhead-outer-wrapper,
          [data-printable="true"] {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            visibility: visible !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            min-height: 100vh !important;
            height: auto !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            background-color: #ffffff !important;
          }
          .corporate-letterhead-outer-wrapper *,
          [data-printable="true"] * {
            visibility: visible !important;
          }
          .corporate-letterhead-header,
          .corporate-letterhead-main,
          .corporate-letterhead-footer {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          .no-print, .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>

      {/* BACKGROUND WATERMARK LOGO */}
      {showWatermark && (
        <div 
          className="watermark-container corporate-watermark absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 0,
            overflow: 'hidden'
          }}
          aria-hidden="true"
        >
          {companyLogo ? (
            <img
              src={companyLogo}
              alt="Company Watermark"
              className="w-[380px] max-w-[50%] max-h-[380px] object-contain select-none pointer-events-none m-auto"
              style={{
                opacity: 0.025,
                filter: 'grayscale(20%)',
                mixBlendMode: 'multiply'
              }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div 
              className="text-center text-[#0A2540] font-black uppercase tracking-widest text-6xl rotate-[-25deg] select-none font-display m-auto"
              style={{ opacity: 0.022 }}
            >
              {companyName}
            </div>
          )}
        </div>
      )}

      {/* TOP DECORATIVE CORNER ACCENT BANNER (SWOOPS) */}
      {!hideHeader && (
        <div className="w-full relative pointer-events-none z-10 select-none">
          <svg viewBox="0 0 1000 45" className="w-full h-auto block" preserveAspectRatio="none">
            {/* Top Left Swoop: Navy & Red/Orange */}
            <path d="M 0,0 L 450,0 C 380,35 250,42 0,42 Z" fill="#0A2540" />
            <path d="M 0,0 L 480,0 C 460,12 420,38 340,38 C 180,38 90,22 0,22 Z" fill="#E53935" opacity="0.9" />
            
            {/* Top Right Swoop */}
            <path d="M 1000,0 L 820,0 C 880,18 940,24 1000,24 Z" fill="#E53935" />
            <path d="M 1000,0 L 880,0 C 930,12 970,16 1000,16 Z" fill="#0A2540" />
          </svg>
        </div>
      )}

      <div 
        className="w-full flex-1 flex flex-col justify-between relative z-10"
        style={{ padding: paddingMargin }}
      >
        
        {/* OFFICIAL LETTERPAD HEADER CONTAINER */}
        {!hideHeader && (
          <div className="corporate-letterhead-header w-full border-b-2 border-[#0A2540] pb-3 mb-4 relative">
          <div className="grid grid-cols-12 gap-2 items-center">
            
            {/* Col 1: Company Logo (Uploaded in Settings) */}
            <div className="col-span-2 flex justify-start items-center">
              {companyLogo ? (
                <div className="relative">
                  <img
                    src={companyLogo}
                    alt="Company Logo"
                    className="max-h-24 max-w-[125px] w-auto h-auto object-contain drop-shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                  <Building2 size={24} className="text-[#0A2540]" />
                </div>
              )}
            </div>

            {/* Col 2: Brand Title, Subtitles & Dual Addresses */}
            <div className="col-span-6 flex flex-col items-center text-center space-y-1">
              
              {/* Main Brand Title */}
              {companyName && (
                <div className="flex items-center justify-center gap-1.5">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display leading-none text-[#0A2540] uppercase">
                    {companyName}
                  </h1>
                </div>
              )}

              {/* English Subtitle line with dashes */}
              {headerSubtitle && (
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-slate-700 tracking-wide">
                  <span className="h-[1.5px] w-6 bg-[#0A2540]/40 inline-block"></span>
                  <span>{headerSubtitle}</span>
                  <span className="h-[1.5px] w-6 bg-[#0A2540]/40 inline-block"></span>
                </div>
              )}

              {/* Nepali Company Name */}
              {companyNameNepali && (
                <div className="text-xs sm:text-base font-bold text-[#E53935] leading-tight pt-0.5">
                  {companyNameNepali}
                </div>
              )}

              {/* Address Block - English */}
              {location && (
                <div className="pt-0.5 flex flex-col items-center text-[10px] sm:text-[11px] leading-snug text-slate-800">
                  <div className="flex items-start justify-center gap-1 font-semibold">
                    <MapPin size={13} className="text-[#0A2540] shrink-0 mt-0.5" fill="#0A2540" stroke="#FFFFFF" />
                    <span>{location}</span>
                  </div>
                </div>
              )}

              {/* Address Block - Nepali */}
              {addressNepali && (
                <div className="flex flex-col items-center text-[10px] sm:text-[11px] leading-snug text-slate-800">
                  <div className="flex items-start justify-center gap-1 font-semibold">
                    <MapPin size={13} className="text-[#0A2540] shrink-0 mt-0.5" fill="#0A2540" stroke="#FFFFFF" />
                    <span>{addressNepali}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Col 3: Right Side Company Credentials Box */}
            <div className="col-span-4 flex justify-end items-center">
              {(panNumber || estdYear || phone || email) && (
                <div className="w-full max-w-[260px] border border-slate-300 rounded-lg p-2 sm:p-2.5 bg-slate-50/70 text-xs font-semibold text-slate-800 space-y-1.5 shadow-2xs">
                  
                  {panNumber && (
                    <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1">
                      <div className="w-5 h-5 rounded-md bg-[#0A2540] text-white flex items-center justify-center shrink-0">
                        <FileText size={11} />
                      </div>
                      <div className="flex items-center justify-between w-full font-mono text-[11px]">
                        <span className="text-slate-600 font-sans text-[10px] uppercase font-bold">PAN No. :</span>
                        <span className="font-extrabold text-slate-900">{panNumber}</span>
                      </div>
                    </div>
                  )}

                  {estdYear && (
                    <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1">
                      <div className="w-5 h-5 rounded-md bg-[#0A2540] text-white flex items-center justify-center shrink-0">
                        <Calendar size={11} />
                      </div>
                      <div className="flex items-center justify-between w-full font-mono text-[11px]">
                        <span className="text-slate-600 font-sans text-[10px] uppercase font-bold">ESTD :</span>
                        <span className="font-extrabold text-slate-900">{estdYear}</span>
                      </div>
                    </div>
                  )}

                  {phone && (
                    <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1">
                      <div className="w-5 h-5 rounded-md bg-[#0A2540] text-white flex items-center justify-center shrink-0">
                        <Phone size={11} />
                      </div>
                      <div className="text-[10.5px] font-mono text-slate-900 truncate">
                        {phone}
                      </div>
                    </div>
                  )}

                  {email && (
                    <div className="flex items-center gap-1.5 pt-0.5 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-[#0A2540] text-white flex items-center justify-center shrink-0">
                        <Mail size={11} />
                      </div>
                      <div className="text-[9px] sm:text-[9.5px] text-slate-900 font-medium font-mono leading-tight break-all" title={email}>
                        {email}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

          </div>

          {/* Solid Bottom Slash Accent on Header */}
          <div className="absolute -bottom-[6px] right-0 flex items-center">
            <div className="w-16 h-1.5 bg-[#E53935] transform skew-x-[-30deg] rounded-xs"></div>
          </div>
        </div>
        )}

        {/* PRINTABLE DOCUMENT BODY CONTENT CONTAINER */}
        <div className="corporate-letterhead-main w-full flex-1 my-2 relative z-10">
          {children}
        </div>

        {/* OFFICIAL LETTERPAD FOOTER CONTAINER */}
        {!hideFooter && (
          <div className="corporate-letterhead-footer w-full mt-auto pt-4 relative z-10">
            
            {/* Slogan with Orange Diamond Rule */}
            {footerTagline && (
              <div className="w-full flex items-center justify-center gap-3 my-2 text-center text-xs font-serif font-bold italic text-[#0A2540]">
                <div className="flex-1 flex items-center justify-end gap-1">
                  <div className="h-[1.5px] w-full max-w-[120px] bg-gradient-to-r from-transparent to-[#E53935]"></div>
                  <div className="w-1.5 h-1.5 rotate-45 bg-[#E53935] shrink-0"></div>
                </div>
                <span className="px-2 text-slate-800">
                  {footerTagline}
                </span>
                <div className="flex-1 flex items-center justify-start gap-1">
                  <div className="w-1.5 h-1.5 rotate-45 bg-[#E53935] shrink-0"></div>
                  <div className="h-[1.5px] w-full max-w-[120px] bg-gradient-to-l from-transparent to-[#E53935]"></div>
                </div>
              </div>
            )}

            {/* Bottom Geometric Graphic Band */}
            <div className="w-full relative h-3 select-none pointer-events-none mt-1">
              <svg viewBox="0 0 1000 20" className="w-full h-full block" preserveAspectRatio="none">
                <path d="M 0,20 L 250,20 C 200,5 120,0 0,0 Z" fill="#0A2540" />
                <path d="M 0,20 L 290,20 C 270,12 210,5 150,5 Z" fill="#E53935" />
                <path d="M 0,16 L 1000,16 L 1000,20 L 0,20 Z" fill="#0A2540" />
              </svg>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
