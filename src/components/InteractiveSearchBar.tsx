import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export interface InteractiveSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  inputClassName?: string;
  expandedWidth?: string;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  disabled?: boolean;
}

export const InteractiveSearchBar: React.FC<InteractiveSearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  id,
  className = '',
  inputClassName = '',
  expandedWidth = 'w-64 sm:w-80 md:w-96',
  size = 'md',
  title = 'Click or hover to search',
  disabled = false,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isManuallyExpanded, setIsManuallyExpanded] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasValue = Boolean(value && value.trim().length > 0);
  const isExpanded = isHovered || isFocused || isManuallyExpanded || hasValue;

  // Auto-focus input when expanding via click
  const handleContainerClick = () => {
    if (disabled) return;
    setIsManuallyExpanded(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsManuallyExpanded(false);
    setIsFocused(false);
    setIsHovered(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onChange('');
      setIsManuallyExpanded(false);
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  // Close when clicking outside if input is empty
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (!hasValue) {
          setIsManuallyExpanded(false);
          setIsFocused(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [hasValue]);

  // Size styles
  const heightClass = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-11' : 'h-9.5';
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
  const collapsedWidth = size === 'sm' ? 'w-8' : size === 'lg' ? 'w-11' : 'w-9.5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-xs sm:text-sm';

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => !disabled && setIsHovered(false)}
      onClick={handleContainerClick}
      title={!isExpanded ? title : undefined}
      className={`relative inline-flex items-center transition-all duration-300 ease-in-out select-none ${
        isExpanded ? `${expandedWidth} shadow-xs` : `${collapsedWidth} shadow-xs`
      } ${className}`}
    >
      <div
        className={`w-full ${heightClass} rounded-xl flex items-center border transition-all duration-300 overflow-hidden ${
          isExpanded
            ? 'bg-white border-indigo-400 ring-2 ring-indigo-400/20'
            : 'bg-slate-50 hover:bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-xs cursor-pointer'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {/* Search Icon Button / Indicator */}
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            handleContainerClick();
          }}
          className={`shrink-0 flex items-center justify-center transition-colors ${
            size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-9.5 h-9.5'
          } ${
            isExpanded
              ? 'text-indigo-600'
              : 'text-slate-400 hover:text-indigo-600'
          }`}
          aria-label="Search"
        >
          <Search size={iconSize} className="transition-transform duration-200" />
        </button>

        {/* Expandable Text Input */}
        <input
          ref={inputRef}
          type="text"
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={isExpanded ? placeholder : ''}
          disabled={disabled}
          className={`w-full h-full bg-transparent border-none outline-none font-medium text-slate-800 placeholder:text-slate-400 pr-2 ${textSize} transition-opacity duration-200 ${
            isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none w-0'
          } ${inputClassName}`}
        />

        {/* Clear & Collapse Button ("X") */}
        {isExpanded && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 p-1 mr-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
            title="Clear and collapse search"
            aria-label="Clear search"
          >
            <X size={size === 'sm' ? 12 : 14} />
          </button>
        )}
      </div>
    </div>
  );
};
