import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[] | string; // Array of selected values or single string
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  maxHeight?: string;
  allowCustom?: boolean;
  ariaLabel?: string;
}

function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search options...",
  label,
  required = false,
  error,
  maxHeight = "max-h-60",
  allowCustom = false,
  ariaLabel
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customValue, setCustomValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize value to always be an array
  const normalizedValue = (() => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value) return [value];
    return [];
  })();
  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleOptionToggle = (optionValue: string) => {
    const newValue = normalizedValue.includes(optionValue)
      ? normalizedValue.filter(v => v !== optionValue)
      : [...normalizedValue, optionValue];
    onChange(newValue);
  };

  const handleSelectAll = () => {
    if (normalizedValue.length === filteredOptions.length) {
      // Deselect all filtered options
      const filteredValues = filteredOptions.map(opt => opt.value);
      const newValue = normalizedValue.filter(v => !filteredValues.includes(v));
      onChange(newValue);
    } else {
      // Select all filtered options
      const filteredValues = filteredOptions.map(opt => opt.value);
      const newValue = [...new Set([...normalizedValue, ...filteredValues])];
      onChange(newValue);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const handleAddCustom = () => {
    if (customValue.trim() && !normalizedValue.includes(customValue.trim())) {
      onChange([...normalizedValue, customValue.trim()]);
      setCustomValue('');
    }
  };

  const handleCustomKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustom();
    }
  };

  // Get display text for selected items
  const getDisplayText = () => {
    if (normalizedValue.length === 0) return placeholder;
    if (normalizedValue.length === 1) {
      const option = options.find(opt => opt.value === normalizedValue[0]);
      return option ? option.label : normalizedValue[0];
    }
    return `${normalizedValue.length} business units selected`;
  };

  const allFilteredSelected = filteredOptions.length > 0 && 
    filteredOptions.every(opt => normalizedValue.includes(opt.value));

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Main select button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`relative w-full bg-white border rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:border-blue-500 min-h-[44px] ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || (label ? `${label}, ${normalizedValue.length} selected` : `${normalizedValue.length} items selected`)}
      >
        <span className={`block truncate text-base ${normalizedValue.length === 0 ? 'text-gray-500' : 'text-gray-900'}`}>
          {getDisplayText()}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2">
          {normalizedValue.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear(e);
              }}
              className="mr-2 p-1 hover:bg-gray-100 rounded min-w-[24px] min-h-[24px]"
              title="Clear all selections"
              type="button"
              aria-label="Clear all selections"
            >
              <X className="h-4 w-4 text-gray-600" aria-hidden="true" />
            </button>
          )}
          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </span>
      </button>

      {/* Selected items display */}
      {normalizedValue.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {normalizedValue.map(selectedValue => {
            const option = options.find(opt => opt.value === selectedValue);
            return (
              <span
                key={selectedValue}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {option ? option.label : selectedValue}
                <button
                  onClick={() => handleOptionToggle(selectedValue)}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute z-10 mt-1 w-full bg-white shadow-lg ${maxHeight} rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none`} role="listbox" aria-multiselectable="true">
          {/* Search input */}
          <div className="sticky top-0 bg-white px-3 py-2 border-b border-gray-200">
            <div className="relative">
              <label htmlFor={`multiselect-search-${label}`} className="sr-only">Search options</label>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
              <input
                id={`multiselect-search-${label}`}
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                placeholder={searchPlaceholder}
                aria-label="Search options"
              />
            </div>
          </div>

          {/* Select All option */}
          {filteredOptions.length > 1 && (
            <div className="px-3 py-2 border-b border-gray-100">
              <button
                onClick={handleSelectAll}
                className="w-full text-left px-2 py-1 text-sm hover:bg-blue-50 rounded flex items-center min-h-[44px]"
                type="button"
                aria-label={`${allFilteredSelected ? 'Deselect' : 'Select'} all ${filteredOptions.length} options`}
              >
                <div className={`w-5 h-5 border-2 rounded mr-3 flex items-center justify-center flex-shrink-0 ${
                  allFilteredSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-400'
                }`}>
                  {allFilteredSelected && <Check className="h-4 w-4 text-white" aria-hidden="true" />}
                </div>
                <span className="font-medium text-blue-700 text-base">
                  {allFilteredSelected ? 'Deselect All' : 'Select All'} ({filteredOptions.length})
                </span>
              </button>
            </div>
          )}

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-sm">
                No options found matching "{searchTerm}"
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = normalizedValue.includes(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={() => handleOptionToggle(option.value)}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center min-h-[44px]"
                    role="option"
                    aria-selected={normalizedValue.includes(option.value)}
                  >
                    <div className={`w-5 h-5 border-2 rounded mr-3 flex items-center justify-center flex-shrink-0 ${
                      normalizedValue.includes(option.value) ? 'bg-blue-600 border-blue-600' : 'border-gray-400'
                    }`}>
                      {normalizedValue.includes(option.value) && <Check className="h-4 w-4 text-white" aria-hidden="true" />}
                    </div>
                    <span className={`text-base ${normalizedValue.includes(option.value) ? 'text-blue-900 font-medium' : 'text-gray-900'}`}>
                      {option.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Add custom value section */}
          {allowCustom && (
            <div className="px-3 py-2 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  onKeyPress={handleCustomKeyPress}
                  placeholder="Add custom value..."
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddCustom}
                  disabled={!customValue.trim()}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export default MultiSelect;