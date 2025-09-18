import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Database, FileText, Users, Shield, AlertTriangle, Edit } from 'lucide-react';

interface UserRoleDetailsProps {
  userDetails: any;
  roleSelections: any;
  onEditRoles?: () => void; // Callback to handle role editing
}

/** ===== Debug toggle + helper ===== */
const DEBUG = true; // set to false to silence logs (or use process.env.NODE_ENV === 'development')
const debugLog = (...args: any[]) => {
  if (DEBUG) console.log(...args);
};

function UserRoleDetails({ userDetails, roleSelections, onEditRoles }: UserRoleDetailsProps) {
  const navigate = useNavigate();

  // Copies this user's roles into localStorage then navigates to the Select Roles page
  const handleCopyRoles = () => {
    // Pick the best source of role fields
    const rolesSource =
      (roleSelections?.role_selection_json &&
        Object.keys(roleSelections.role_selection_json).length > 0 &&
        roleSelections.role_selection_json) ||
      roleSelections ||
      {};

    // Basic info for the target form header
    localStorage.setItem(
      'pendingFormData',
      JSON.stringify({
        employeeName: userDetails?.employee_name || '',
        agencyName: userDetails?.agency_name || '',
        agencyCode: userDetails?.agency_code || '',
      })
    );

    // Flag the “copy roles” flow
    localStorage.setItem('editingCopiedRoles', 'true');

    // The roles payload to preload (can be your DB row as-is)
    localStorage.setItem('copiedRoleSelections', JSON.stringify(rolesSource));

    // Optional: include who we copied from
    localStorage.setItem(
      'copiedUserDetails',
      JSON.stringify({
        id: userDetails?.id ?? null,
        email: userDetails?.email ?? null,
      })
    );

    // Go to the role selection page
    navigate('/select-roles');
  };

  if (!userDetails) return null;

  debugLog('🔍 UserRoleDetails received userDetails:', userDetails);
  debugLog('🔍 UserRoleDetails received roleSelections:', roleSelections);

  // Security area type labels
  const securityAreaLabels: Record<string, string> = {
    'accounting_procurement': 'Accounting / Procurement',
    'hr_payroll': 'HR / Payroll',
    'epm_data_warehouse': 'EPM / Data Warehouse',
    'elm': 'ELM',
  };

  // Function to convert camelCase or snake_case to readable text
  const formatFieldName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Get all boolean fields that are true
  const getActiveBooleanRoles = () => {
    if (!roleSelections) {
      debugLog('🔍 No role selections found');
      return [];
    }

    debugLog('🔍 Processing role selections:', roleSelections);

    // Check if role_selection_json exists and has data
    const hasJsonData =
      roleSelections.role_selection_json &&
      typeof roleSelections.role_selection_json === 'object' &&
      Object.keys(roleSelections.role_selection_json).length > 0;

    debugLog('🔍 role_selection_json exists:', !!roleSelections.role_selection_json);
    debugLog('🔍 role_selection_json has data:', hasJsonData);
    debugLog('🔍 role_selection_json content:', roleSelections.role_selection_json);

    // Use role_selection_json if it has data, otherwise use top-level fields
    const dataSource = hasJsonData ? roleSelections.role_selection_json : roleSelections;
    debugLog('🔍 Using data source:', dataSource);
    debugLog('🔍 Data source keys:', Object.keys(dataSource));

    // Get all boolean entries
    const booleanEntries = Object.entries(dataSource).filter(
      ([, value]) => typeof value === 'boolean'
    );
    debugLog('🔍 All boolean entries:', booleanEntries);

    // Get true boolean entries
    const trueBooleanEntries = booleanEntries.filter(([, value]) => value === true);
    debugLog('🔍 True boolean entries:', trueBooleanEntries);

    // Filter out excluded keys
    const excludedKeys = [
      'created_at',
      'updated_at',
      'id',
      'request_id',
      'supervisorApproval',
      'supervisor_approval',
    ];

    const filteredEntries = trueBooleanEntries.filter(([key]) => !excludedKeys.includes(key));
    debugLog('🔍 Filtered boolean entries:', filteredEntries);

    return filteredEntries.map(([key]) => key);
  };

  // Get all string fields that have values
  const getStringFieldValues = () => {
    if (!roleSelections) return [];

    // Check if role_selection_json exists and has data
    const hasJsonData =
      roleSelections.role_selection_json &&
      typeof roleSelections.role_selection_json === 'object' &&
      Object.keys(roleSelections.role_selection_json).length > 0;

    // Use role_selection_json if it has data, otherwise use top-level fields
    const dataSource = hasJsonData ? roleSelections.role_selection_json : roleSelections;
    debugLog('🔍 String fields - using data source:', dataSource);

    const excludedStringKeys = [
      'created_at',
      'updated_at',
      'id',
      'request_id',
      'role_justification',
      'roleJustification',
      'homeBusinessUnit',
      'otherBusinessUnits',
      'home_business_unit',
      'other_business_units',
    ];

    const stringEntries = Object.entries(dataSource).filter(
      ([key, value]) =>
        typeof value === 'string' &&
        value !== '' &&
        value !== null &&
        !excludedStringKeys.includes(key)
    );

    debugLog('🔍 String field entries:', stringEntries);
    return stringEntries;
  };

  const activeBooleanRoles = getActiveBooleanRoles();
  const stringFieldValues = getStringFieldValues();
  debugLog('🔍 Final active boolean roles:', activeBooleanRoles);
  debugLog('🔍 Final string field values:', stringFieldValues);

  return (
    <div className="space-y-6">
      {/* Security Areas */}
      {userDetails.security_areas && userDetails.security_areas.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-medium text-blue-800 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security Areas
          </h3>
          <div className="mt-3 space-y-3">
            {userDetails.security_areas.map((area: any, index: number) => (
              <div key={index} className="bg-white p-3 rounded border">
                <div className="flex items-center mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {securityAreaLabels[area.area_type] || area.area_type}
                  </span>
                </div>
                {area.director_name && (
                  <div className="text-sm">
                    <span className="text-gray-600">Director:</span>
                    <span className="ml-1 font-medium">{area.director_name}</span>
                    {area.director_email && (
                      <span className="ml-2 text-gray-500">({area.director_email})</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Selections */}
      {roleSelections ? (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-green-800 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Role Selections
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={onEditRoles}
                className="inline-flex items-center px-3 py-1 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit Roles
              </button>

              <button
                onClick={handleCopyRoles}
                className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Copy these roles to a new request"
              >
                <Users className="h-4 w-4 mr-1" />
                Copy Roles
              </button>
            </div>
          </div>

          {activeBooleanRoles.length > 0 ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-gray-600 mb-2">Active Roles:</p>
              <div className="flex flex-wrap gap-2">
                {activeBooleanRoles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    {formatFieldName(role)}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">No Active Roles Found</h3>
                    <p className="mt-2 text-sm text-yellow-700">
                      This request has a role selection record but no specific roles are currently set
                      to active. This may indicate that the role selection process was not completed or
                      the roles were not properly saved.
                    </p>
                  </div>
                </div>
              </div>

              {/* Enhanced debugging section */}
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700 mb-2">
                  Debug Info (click to expand)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded font-mono text-xs space-y-2">
                  <div>
                    <strong>roleSelections exists:</strong> {roleSelections ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>role_selection_json exists:</strong>{' '}
                    {roleSelections?.role_selection_json ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Active boolean roles count:</strong> {activeBooleanRoles.length}
                  </div>
                  <div>
                    <strong>String field values count:</strong> {stringFieldValues.length}
                  </div>
                  <div>
                    <strong>Sample of boolean fields (first 10):</strong>
                    <div className="ml-2 mt-1 max-h-32 overflow-y-auto">
                      {roleSelections
                        ? Object.entries(roleSelections)
                            .filter(([, value]) => typeof value === 'boolean')
                            .slice(0, 10)
                            .map(([key, value]) => (
                              <div key={key} className={value ? 'text-green-600' : 'text-gray-400'}>
                                {key}: {value ? 'true' : 'false'}
                              </div>
                            ))
                        : 'No data'}
                    </div>
                  </div>
                  <div>
                    <strong>Total boolean fields:</strong>{' '}
                    {roleSelections
                      ? Object.entries(roleSelections).filter(([, value]) => typeof value === 'boolean')
                          .length
                      : 0}
                  </div>
                  <div>
                    <strong>True boolean fields:</strong>{' '}
                    {roleSelections
                      ? Object.entries(roleSelections).filter(
                          ([, value]) => typeof value === 'boolean' && value === true
                        ).length
                      : 0}
                  </div>
                </div>
              </details>
            </div>
          )}

          {stringFieldValues.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Additional Settings:</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {stringFieldValues.map(([key, value]) => (
                  <div key={key} className="bg-white p-2 rounded border">
                    <p className="text-xs text-gray-500 font-medium">{formatFieldName(key)}:</p>
                    <p className="text-sm text-gray-900 mt-1">{value as string}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show role justification from either location */}
          {(roleSelections.role_selection_json?.roleJustification ||
            roleSelections.role_justification) && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Role Justification:</p>
              <div className="bg-white p-3 rounded border">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {roleSelections.role_selection_json?.roleJustification ||
                    roleSelections.role_justification}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">No Role Selections Found</h3>
              <p className="mt-2 text-sm text-yellow-700">
                This user doesn't have any specific role selections defined in the system.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Business Unit Information */}
      {(roleSelections?.home_business_unit || roleSelections?.role_selection_json?.homeBusinessUnit) && (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="text-lg font-medium text-purple-800 flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Business Unit Information
          </h3>
          <div className="mt-2">
            <p className="text-sm text-gray-600">Home Business Unit:</p>
            <p className="text-sm font-medium">
              {roleSelections.home_business_unit || roleSelections.role_selection_json?.homeBusinessUnit}
            </p>

            {(roleSelections.other_business_units ||
              roleSelections.role_selection_json?.otherBusinessUnits) && (
              <>
                <p className="text-sm text-gray-600 mt-2">Other Business Units:</p>
                <p className="text-sm font-medium">
                  {roleSelections.other_business_units ||
                    roleSelections.role_selection_json?.otherBusinessUnits}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserRoleDetails;
