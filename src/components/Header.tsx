import React from 'react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onUserChange?: (user: { employee_name: string; employee_id: string; email: string }) => void;
}

export default function Header({ title, subtitle, onUserChange }: HeaderProps) {
  return (
    <div className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <img
            src="/mmb-homepage-logo3-01_tcm1059-264925_tcm1059-264925.png"
            alt="MMB Logo"
            className="h-12 w-auto mr-4"
          />
          <div className="flex-1">
            {title && <h1 className="text-3xl font-bold text-gray-900">{title}</h1>}
            {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
