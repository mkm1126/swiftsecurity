import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { List, Shield } from 'lucide-react';
import UserSession from './UserSession';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onUserChange?: (userName: string | null) => void;
}

function Header({ title, subtitle, onUserChange }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMainPage = location.pathname === '/';
  const isRequestsPage = location.pathname === '/requests';
  
  const [isTestMode, setIsTestMode] = React.useState(() => {
    return localStorage.getItem('testMode') === 'true';
  });

  // Reset test mode when navigating to main page
  React.useEffect(() => {
    if (isMainPage) {
      setIsTestMode(false);
      localStorage.setItem('testMode', 'false');
      
      // Dispatch a storage event to notify other components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'testMode',
        newValue: 'false',
        oldValue: 'true'
      }));
    }
  }, [isMainPage]);

  const toggleTestMode = () => {
    const newTestMode = !isTestMode;
    setIsTestMode(newTestMode);
    localStorage.setItem('testMode', newTestMode.toString());
    
    // Clear test data when disabling test mode
    if (!newTestMode) {
      // Clear any stored form data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('formData_') || 
          key.startsWith('requestId_') ||
          key.startsWith('testData_')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear session storage as well
      sessionStorage.clear();
      
      // Force a page reload to clear any form state
      if (isMainPage) {
        window.location.reload();
      }
    }
    
    // Dispatch a storage event to notify other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'testMode',
      newValue: newTestMode.toString(),
      oldValue: (!newTestMode).toString()
    }));
  };

  // Listen for storage changes from other tabs/components
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'testMode') {
        setIsTestMode(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const handleNewRequest = () => {
    // Disable test mode when creating a new request
    setIsTestMode(false);
    localStorage.setItem('testMode', 'false');
    
    // Comprehensive clearing of all form-related data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('formData_') || 
        key.startsWith('requestId_') ||
        key.startsWith('testData_') ||
        key.startsWith('selectRoles_') || 
        key.startsWith('elmRoles_') ||
        key.startsWith('epmDwhRoles_') ||
        key.startsWith('hrPayrollRoles_') ||
        key === 'pendingMainFormData' ||
        key === 'pendingFormData' ||
        key === 'copiedRoleSelections' ||
        key === 'copiedUserDetails' ||
        key === 'editingCopiedRoles'
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear session storage as well
    sessionStorage.clear();
    
    // Dispatch a storage event to notify other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'testMode',
      newValue: 'false',
      oldValue: 'true'
    }));
    
    // Navigate to home page
    navigate('/');
  };
  
  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={handleNewRequest}
              className="flex items-center hover:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
              aria-label="Return to home page and start new request"
            >
              <img
                src="/mmb-homepage-logo3-01_tcm1059-264925_tcm1059-264925.png"
                alt="Minnesota Management & Budget Logo"
                className="h-12 w-auto"
              />
            </button>
            <div className="flex-1" />
            {onUserChange && (
              <UserSession onUserChange={onUserChange} />
            )}
          </div>
        </div>
      </header>
      
      {/* Centered Title Section */}
      {title && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="mt-2 text-base sm:text-lg text-gray-600">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      )} 
      
      {/* Action Buttons Section - Only show on main page */}
      {isMainPage && (
        <nav className="bg-gray-50 border-b border-gray-200" aria-label="Primary navigation">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={toggleTestMode}
                className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md min-h-[44px] ${
                  isTestMode
                    ? 'border-orange-400 text-orange-800 bg-orange-50 hover:bg-orange-100'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                aria-pressed={isTestMode}
                aria-label={isTestMode ? 'Disable test mode' : 'Enable test mode'}
              >
                <Shield className="h-4 w-4 mr-2" aria-hidden="true" />
                {isTestMode ? 'Disable Test Mode' : 'Enable Test Mode'}
              </button>
              <Link
                to="/requests"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px]"
                aria-label="View all requests"
              >
                <List className="h-4 w-4 mr-2" aria-hidden="true" />
                View Requests
              </Link>
            </div>
          </div>
        </nav>
      )}
      
      {/* Non-main page action buttons */}
      {!isMainPage && !isRequestsPage && (
        <nav className="bg-gray-50 border-b border-gray-200" aria-label="Secondary navigation">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col items-center">
              {onUserChange && (
                <div className="mb-2">
                  <UserSession onUserChange={onUserChange} />
                </div>
              )}
              <div className="flex items-center gap-4 flex-wrap">
                {!isMainPage && (
                  <button
                    onClick={toggleTestMode}
                    className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md min-h-[44px] ${
                      isTestMode
                        ? 'border-orange-400 text-orange-800 bg-orange-50 hover:bg-orange-100'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    aria-pressed={isTestMode}
                    aria-label={isTestMode ? 'Disable test mode' : 'Enable test mode'}
                  >
                    <Shield className="h-4 w-4 mr-2" aria-hidden="true" />
                    {isTestMode ? 'Disable Test Mode' : 'Enable Test Mode'}
                  </button>
                )}
                <Link
                  to="/requests"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px]"
                  aria-label="View all requests"
                >
                  <List className="h-4 w-4 mr-2" aria-hidden="true" />
                  View Requests
                </Link>
              </div>
            </div>
          </div>
        </nav>

      )} 
      
      <div className="mb-8" />
    </>
  );
}

export default Header;