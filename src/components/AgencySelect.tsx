import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { agencies } from '../lib/agencyData';

interface AgencySelectProps {
  value: string;
  onChange: (name: string, code: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function AgencySelect({
  value,
  onChange,
  error,
  required = false,
  disabled = false,
}: AgencySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAgencies = agencies.filter(agency =>
    agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agency.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (agency: { name: string; code: string }) => {
    onChange(agency.name, agency.code);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="space-y-1" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700">
        Agency
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-3 py-2 text-left bg-white border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center justify-between">
            <span className={value ? 'text-gray-900' : 'text-gray-500'}>
              {value || 'Select an agency...'}
            </span>
            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search agencies..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto">
              {filteredAgencies.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">No agencies found</div>
              ) : (
                filteredAgencies.map((agency) => (
                  <button
                    key={agency.code}
                    type="button"
                    onClick={() => handleSelect(agency)}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                  >
                    <div className="text-sm text-gray-900">{agency.name}</div>
                    <div className="text-xs text-gray-500">{agency.code}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
