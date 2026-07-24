'use client';

import React, { useState, useRef, useEffect, forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  className?: string;
}

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ClearIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value,
      defaultValue,
      onChange,
      placeholder = 'Select an option',
      label,
      error,
      hint,
      disabled = false,
      fullWidth = true,
      searchable = false,
      clearable = false,
      className = '',
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedValue = value !== undefined ? value : internalValue;
    const selectedOption = options.find((opt) => opt.value === selectedValue);

    const filteredOptions = searchable
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options;

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearchTerm('');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
      if (isOpen && searchable && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isOpen, searchable]);

    const handleSelect = (optionValue: string) => {
      if (value === undefined) {
        setInternalValue(optionValue);
      }
      onChange?.(optionValue);
      setIsOpen(false);
      setSearchTerm('');
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (value === undefined) {
        setInternalValue('');
      }
      onChange?.('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
      } else if (e.key === 'Enter' && !isOpen) {
        setIsOpen(true);
      }
    };

    const widthStyle = fullWidth ? 'w-full' : '';
    const hasError = !!error;

    return (
      <div ref={ref} className={`relative ${widthStyle} ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            {label}
          </label>
        )}

        <div ref={containerRef} className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            className={`
              w-full px-4 py-2.5 text-left
              bg-[var(--color-bg)]
              border rounded-lg
              ${hasError ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
              transition-all duration-200
              flex items-center justify-between gap-2
            `}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className={selectedOption ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}>
              {selectedOption ? (
                <span className="flex items-center gap-2">
                  {selectedOption.icon}
                  {selectedOption.label}
                </span>
              ) : (
                placeholder
              )}
            </span>

            <div className="flex items-center gap-1">
              {clearable && selectedValue && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  aria-label="Clear selection"
                >
                  <ClearIcon />
                </button>
              )}
              <ChevronIcon isOpen={isOpen} />
            </div>
          </button>

          {isOpen && (
            <div
              className={`
                absolute z-50 w-full mt-1
                bg-[var(--color-bg-secondary)]
                border border-[var(--color-border)]
                rounded-lg shadow-lg
                max-h-60 overflow-auto
                animate-fadeIn
              `}
              role="listbox"
            >
              {searchable && (
                <div className="p-2 border-b border-[var(--color-border)]">
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="w-full px-3 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              )}

              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    className={`
                      w-full px-4 py-2.5 text-left
                      flex items-center gap-2
                      ${option.disabled ? 'text-[var(--color-text-muted)] cursor-not-allowed' : 'text-[var(--color-text)] hover:bg-[var(--color-primary-light)]'}
                      ${selectedValue === option.value ? 'bg-[var(--color-primary-light)]' : ''}
                      transition-colors duration-150
                    `}
                    role="option"
                    aria-selected={selectedValue === option.value}
                  >
                    {option.icon}
                    {option.label}
                    {selectedValue === option.value && (
                      <svg className="w-4 h-4 ml-auto text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1 text-sm text-[var(--color-danger)] font-medium" role="alert">
            {error}
          </p>
        )}

        {hint && !error && (
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
