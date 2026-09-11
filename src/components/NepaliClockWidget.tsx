import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, Sparkles, Sun, Info, CalendarDays } from 'lucide-react';
import { getFullNepaliPatroInfo, NepaliPatroInfo } from '../utils/nepaliPatroData';

export const NepaliClockWidget: React.FC = () => {
  const [patroInfo, setPatroInfo] = useState<NepaliPatroInfo>(() => getFullNepaliPatroInfo());
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Update live clock every second
    const interval = setInterval(() => {
      setPatroInfo(getFullNepaliPatroInfo());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div 
        onClick={() => setShowModal(true)}
        className="group relative flex items-center justify-between gap-2.5 bg-linear-to-r from-amber-50/70 via-white to-amber-50/40 border border-amber-200/70 hover:border-amber-400 rounded-lg px-2.5 py-1 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer select-none max-w-full"
        title="नेपाली पात्रो तथा घडी विवरण हेर्न क्लिक गर्नुहोस्"
      >
        {/* Left: Nepali Date & Weekday */}
        <div className="flex items-center gap-1.5 text-xs text-slate-800 font-bold shrink-0">
          <Calendar size={12} className="text-amber-600 shrink-0" />
          <span className="font-semibold text-slate-900">{patroInfo.formattedBsNepali}</span>
          <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-1.5 py-0.2 rounded-md border border-amber-200/80">
            {patroInfo.dayOfWeekNepali}
          </span>
        </div>

        {/* Divider */}
        <span className="text-slate-300 text-xs hidden sm:inline">•</span>

        {/* Live Nepali Time */}
        <div className="flex items-center gap-1 font-mono font-bold text-xs text-slate-900 shrink-0">
          <Clock size={12} className="text-indigo-600 animate-pulse shrink-0" />
          <span className="text-indigo-950">{patroInfo.nepaliTimeStr}</span>
        </div>

        {/* Divider */}
        <span className="text-slate-300 text-xs hidden md:inline">•</span>

        {/* Right / Bottom inline: Today's Special Day */}
        <div className="hidden md:flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100/60 border border-amber-200/70 px-2 py-0.5 rounded-full max-w-[260px] lg:max-w-[360px] truncate">
          <Sparkles size={10} className={patroInfo.isHoliday ? 'text-rose-600 shrink-0' : 'text-amber-600 shrink-0'} />
          <span className="text-slate-500 font-semibold shrink-0">विशेष:</span>
          <span className="truncate">{patroInfo.specialEvent}</span>
          {patroInfo.isHoliday && (
            <span className="ml-0.5 bg-rose-600 text-white text-[8px] font-black uppercase px-1 py-0.1 rounded-md shrink-0">
              बिदा
            </span>
          )}
        </div>
      </div>

      {/* POPUP MODAL FOR DETAILED PATRO VIEW */}
      {showModal && createPortal(
        <div 
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full max-h-[88vh] overflow-y-auto p-5 sm:p-6 space-y-4 my-auto animate-in fade-in zoom-in duration-150 scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 sticky top-0 bg-white z-10 pt-1">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500 rounded-xl text-white shadow-xs">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">आजको नेपाली पात्रो (Hamro Patro)</h3>
                  <p className="text-xs text-slate-500">Reliabletech Official Calendar & Clock</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer text-lg font-bold"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Main Calendar Card */}
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-5 rounded-2xl shadow-md text-center space-y-2">
              <p className="text-xs font-semibold text-amber-100 uppercase tracking-widest">{patroInfo.adDateStr}</p>
              <div className="text-4xl font-black font-mono tracking-tight my-1">
                {patroInfo.dayBs} <span className="text-xl font-sans font-bold">{patroInfo.monthBsName}</span>
              </div>
              <p className="text-sm font-bold text-amber-50">
                वि.सं. {patroInfo.yearBs} | {patroInfo.dayOfWeekNepali} ({patroInfo.dayOfWeekEnglish})
              </p>
              <div className="pt-2 border-t border-amber-400/50 flex justify-center items-center gap-2 font-mono text-base font-bold text-amber-100">
                <Clock size={16} />
                <span>{patroInfo.nepaliTimeStr} ({patroInfo.nepaliTimePeriod})</span>
              </div>
            </div>

            {/* Event Info Box */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-500" />
                  आजको पर्व तथा विशेष अवसर
                </span>
                {patroInfo.isHoliday && (
                  <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-black px-2 py-0.5 rounded-full">
                    सार्वजनिक बिदा
                  </span>
                )}
              </div>
              <p className="text-sm font-black text-slate-900 leading-snug">
                {patroInfo.specialEvent}
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(false);
              }}
              className="w-full py-2.5 bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              बन्द गर्नुहोस् (Close)
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
