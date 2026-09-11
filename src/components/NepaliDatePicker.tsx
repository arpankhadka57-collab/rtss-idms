import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import NepaliDate from 'nepali-date-converter';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';
import { getCurrentBsDate, formatBsDate, bsToAd, adToBs } from '../utils/nepaliDate';

export const BS_MONTH_NAMES = [
  'Baishakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

export const BS_MONTH_NAMES_NEPALI = [
  'वैशाख (Baishakh)', 'जेठ (Jestha)', 'असार (Ashadh)', 'श्रावण (Shrawan)',
  'भाद्र (Bhadra)', 'आश्विन (Ashwin)', 'कार्तिक (Kartik)', 'मंसिर (Mangsir)',
  'पुष (Poush)', 'माघ (Magh)', 'फागुन (Falgun)', 'चैत (Chaitra)'
];

export const BS_DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Get total number of days in a given BS Year and Month
 */
export function getBsDaysInMonth(year: number, monthIdx: number): number {
  for (let d = 32; d >= 29; d--) {
    try {
      const nd = new NepaliDate(year, monthIdx, d);
      if (nd.getMonth() === monthIdx) {
        return d;
      }
    } catch (e) {}
  }
  return 30;
}

/**
 * Get the day of week for the 1st of a BS Month (0 = Sunday)
 */
export function getBsFirstDayOfWeek(year: number, monthIdx: number): number {
  try {
    const nd = new NepaliDate(year, monthIdx, 1);
    return nd.getDay();
  } catch (e) {
    return 0;
  }
}

interface NepaliDatePickerProps {
  value: string; // BS Date in YYYY-MM-DD or string
  onChange: (dateStr: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  mode?: 'date' | 'period'; // 'date' for YYYY-MM-DD, 'period' for Month Year (e.g., Ashadh 2083)
}

export const NepaliDatePicker: React.FC<NepaliDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'YYYY-MM-DD (BS)',
  className = '',
  id,
  disabled = false,
  required = false,
  mode = 'date'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Today's BS date
  const todayBs = getCurrentBsDate();
  const todayParts = todayBs.split('-').map(p => parseInt(p, 10));

  // State for view year, month, day
  const [viewYear, setViewYear] = useState<number>(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length >= 1 && !isNaN(parseInt(parts[0], 10))) {
        return parseInt(parts[0], 10);
      }
    }
    return todayParts[0] || 2083;
  });

  const [viewMonthIdx, setViewMonthIdx] = useState<number>(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length >= 2 && !isNaN(parseInt(parts[1], 10))) {
        const m = parseInt(parts[1], 10) - 1;
        if (m >= 0 && m < 12) return m;
      }
    }
    return (todayParts[1] ? todayParts[1] - 1 : 2); // Default to Ashadh (idx 2)
  });

  // Sync internal view when value prop changes externally
  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && y >= 2000 && y <= 2100) setViewYear(y);
        if (!isNaN(m) && m >= 0 && m < 12) setViewMonthIdx(m);
      }
    }
  }, [value]);

  // Click outside listener to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle month navigation
  const handlePrevMonth = () => {
    if (viewMonthIdx === 0) {
      setViewMonthIdx(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonthIdx(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonthIdx === 11) {
      setViewMonthIdx(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonthIdx(prev => prev + 1);
    }
  };

  // Select day
  const handleSelectDay = (day: number) => {
    const formattedMonth = String(viewMonthIdx + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const selectedBsDate = `${viewYear}-${formattedMonth}-${formattedDay}`;
    onChange(selectedBsDate);
    setIsOpen(false);
  };

  // Select period/month
  const handleSelectPeriodMonth = (mIdx: number, yr: number) => {
    const monthName = BS_MONTH_NAMES[mIdx];
    const periodString = `${monthName} ${yr}`;
    onChange(periodString);
    setIsOpen(false);
  };

  // Set today
  const handleSelectToday = () => {
    onChange(todayBs);
    const parts = todayBs.split('-').map(p => parseInt(p, 10));
    setViewYear(parts[0]);
    setViewMonthIdx(parts[1] - 1);
    setIsOpen(false);
  };

  // Set first day of month
  const handleSelectFirstOfMonth = () => {
    const formattedMonth = String(viewMonthIdx + 1).padStart(2, '0');
    const firstBsDate = `${viewYear}-${formattedMonth}-01`;
    onChange(firstBsDate);
    setIsOpen(false);
  };

  // Calendar matrix calculation
  const daysInMonth = getBsDaysInMonth(viewYear, viewMonthIdx);
  const firstDayOfWeek = getBsFirstDayOfWeek(viewYear, viewMonthIdx);

  // Generate Year Range options (2070 to 2095 BS)
  const yearOptions: number[] = [];
  for (let y = 2070; y <= 2095; y++) {
    yearOptions.push(y);
  }

  // Parse current selected day from value
  let selectedDayNum: number | null = null;
  if (value) {
    const parts = value.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (y === viewYear && m === viewMonthIdx && !isNaN(d)) {
        selectedDayNum = d;
      }
    }
  }

  return (
    <div className={`relative inline-block w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-bold text-slate-700 block mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Input Trigger */}
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-xl px-3 py-2 pr-9 text-xs font-semibold font-mono text-slate-800 focus:outline-hidden transition shadow-2xs"
        />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-2.5 text-slate-400 hover:text-indigo-600 transition cursor-pointer p-0.5 rounded-md"
          title="Open Bikram Sambat (BS) Calendar"
        >
          <CalendarIcon size={15} />
        </button>
      </div>

      {/* Formatted Date Preview Below */}
      {value && mode === 'date' && (
        <p className="text-[10px] font-mono font-bold text-indigo-600 mt-1 flex items-center gap-1">
          <span>BS Date:</span>
          <span>{formatBsDate(value)}</span>
        </p>
      )}

      {/* Popover BS Calendar Modal - Centered Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-4.5 w-80 max-w-full animate-in fade-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
          
          {/* Header Controls: Month & Year Selectors */}
          <div className="flex items-center justify-between gap-1.5 pb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              title="Previous BS Month"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month Selector */}
              <select
                value={viewMonthIdx}
                onChange={(e) => setViewMonthIdx(parseInt(e.target.value, 10))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 font-mono focus:outline-hidden focus:border-indigo-500 cursor-pointer"
              >
                {BS_MONTH_NAMES_NEPALI.map((mName, idx) => (
                  <option key={idx} value={idx}>
                    {mName}
                  </option>
                ))}
              </select>

              {/* Year Selector */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 font-mono focus:outline-hidden focus:border-indigo-500 cursor-pointer"
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>
                    {y} BS
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              title="Next BS Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Mode Switch: Date Selection vs Period Selection */}
          {mode === 'period' ? (
            <div className="py-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 block uppercase font-mono tracking-wider">
                Select Reporting Month ({viewYear} BS)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {BS_MONTH_NAMES.map((mName, mIdx) => {
                  const isSelected = value.toLowerCase().includes(mName.toLowerCase()) && value.includes(String(viewYear));
                  return (
                    <button
                      key={mIdx}
                      type="button"
                      onClick={() => handleSelectPeriodMonth(mIdx, viewYear)}
                      className={`p-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer border ${
                        isSelected 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                          : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 border-slate-200 hover:border-indigo-200'
                      }`}
                    >
                      {mName}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Day of Week Header */}
              <div className="grid grid-cols-7 gap-1 pt-3 pb-1 text-center font-mono text-[10px] font-bold text-slate-400 uppercase">
                {BS_DAYS_SHORT.map((day, idx) => (
                  <div key={idx} className={idx === 6 ? 'text-rose-500 font-extrabold' : ''}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs font-semibold">
                {/* Empty Cells for First Day Offset */}
                {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-8" />
                ))}

                {/* Day Cells */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const isToday =
                    todayParts[0] === viewYear &&
                    todayParts[1] === viewMonthIdx + 1 &&
                    todayParts[2] === dayNum;

                  const isSelected = selectedDayNum === dayNum;

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => handleSelectDay(dayNum)}
                      className={`h-8 w-8 mx-auto flex items-center justify-center rounded-xl transition cursor-pointer font-bold ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs scale-105'
                          : isToday
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black'
                          : 'hover:bg-indigo-50 text-slate-700 hover:text-indigo-600'
                      }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Quick Preset Action Footer */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[10px] font-mono">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Clock size={12} />
              <span>Today ({todayBs})</span>
            </button>

            {mode === 'date' && (
              <button
                type="button"
                onClick={handleSelectFirstOfMonth}
                className="text-slate-500 hover:text-slate-800 font-semibold hover:underline cursor-pointer"
              >
                1st of Month
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

        </div>
      </div>
      )}
    </div>
  );
};
