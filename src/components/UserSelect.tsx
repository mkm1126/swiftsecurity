import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import SearchableSelect from './SearchableSelect';
import UserRoleDetails from './UserRoleDetails';

/** ===== Debug toggle + helper ===== */
const DEBUG = true; // set to false to silence logs
const log = (...args: any[]) => { if (DEBUG) console.log(...args); };

interface User {
  employee_name: string;
  employee_id: string;
  email: string;
  request_id?: string;
}

interface UserSelectProps {
  selectedUser: User | null;
  onUserChange: (user: User | null) => void;
  error?: string;
  required?: boolean;
  currentUser?: string | null;
  currentRequestId?: string | null;
  formData?: any; // Current form data from parent component
}

/** Utility: camelCase a snake_case key */
function toCamel(key: string) {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/** Utility: map keys to camelCase (1 level is enough for our data) */
function camelizeKeys<T extends Record<string, any>>(obj: T | null | undefined): Record<string, any> {
  if (!obj || typeof obj !== 'object') return {};
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    const ck = toCamel(k);
    out[ck] = v;
  }
  return out;
}

/** Build a normalized roles payload expected by SelectRolesPage.
 *  Prefers role_selection_json if present; falls back to top-level columns.
 *  Ensures camelCase keys and strips non-role metadata.
 */
function normalizeRoles(roleSelections: any): Record<string, any> {
  if (!roleSelections) return {};
  const json = (roleSelections?.role_selection_json && Object.keys(roleSelections.role_selection_json).length > 0)
    ? roleSelections.role_selection_json
    : roleSelections;

  const excluded = new Set([
    'id', 'created_at', 'updated_at', 'request_id',
    'role_justification', 'roleJustification'
  ]);

  const base = camelizeKeys(json);
  for (const k of Object.keys(base)) {
    if (excluded.has(k)) delete base[k];
  }

  // Map the common snake_case fields to the expected camelCase names
  if (roleSelections?.home_business_unit && !base.homeBusinessUnit) {
    base.homeBusinessUnit = roleSelections.home_business_unit;
  }
  if (roleSelections?.other_business_units && !base.otherBusinessUnits) {
    base.otherBusinessUnits = roleSelections.other_business_units;
  }

  return base;
}

/** Try to find the most recent/complete "main form" draft in localStorage. */
function findLatestMainFormDraft(): any | null {
  let best: any = null;
  let bestScore = -1;

  const requiredKeys = [
    'employeeName', 'email', 'agencyCode',
    'submitterName', 'submitterEmail',
    'supervisorName', 'supervisorUsername',
    'securityAdminName', 'securityAdminUsername'
  ];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const val = JSON.parse(raw);
      if (!val || typeof val !== 'object') continue;

      // score how many required fields are present
      const score = requiredKeys.reduce((acc, k) => acc + (val[k] ? 1 : 0), 0);
      if (score > bestScore) {
        best = val;
        bestScore = score;
      }
    } catch {
      // ignore parse errors
    }
  }

  if (best) log('🧭 Chosen main-form draft from localStorage with score', bestScore, best);
  else log('🧭 No usable main-form draft was found in localStorage.');
  return best;
}

/** Merge current formData prop with a discovered draft. Never replaces the
 * "Requested For" person with the copied user's identity. */
function buildCompleteFormData(formDataProp: any, draft: any, userDetails: any) {
  const f = formDataProp || {};
  const d = draft || {};

  // NOTE: Do *not* overwrite the new request's "Requested For" with the copied user.
  // Keep the current/new employee from the main form (f/d), only use userDetails to
  // fill innocuous defaults like startDate when missing.
  const start = f.startDate || d.startDate || userDetails?.start_date || new Date().toISOString().split('T')[0];

  const merged = {
    // --- Requested For (new request target) ---
    startDate: start,
    employeeName: f.employeeName ?? d.employeeName ?? '',   // KEEP the new user
    employeeId:   f.employeeId   ?? d.employeeId   ?? '',
    email:        f.email        ?? d.email        ?? '',
    isNonEmployee: f.isNonEmployee ?? d.isNonEmployee ?? false,
    workLocation: f.workLocation ?? d.workLocation ?? '',
    workPhone:    f.workPhone    ?? d.workPhone    ?? '',
    agencyName:   f.agencyName   ?? d.agencyName   ?? '',
    agencyCode:   f.agencyCode   ?? d.agencyCode   ?? userDetails?.agency_code ?? '',

    // --- Submitted By (requestor) ---
    submitterName:  f.submitterName  ?? d.submitterName  ?? '',
    submitterEmail: f.submitterEmail ?? d.submitterEmail ?? '',

    // --- Supervisor ---
    supervisorName:     f.supervisorName     ?? d.supervisorName     ?? '',
    supervisorUsername: f.supervisorUsername ?? d.supervisorUsername ?? '',

    // --- Security Admin ---
    securityAdminName:     f.securityAdminName     ?? d.securityAdminName     ?? '',
    securityAdminUsername: f.securityAdminUsername ?? d.securityAdminUsername ?? '',

    // --- Area directors (can come from the copied request for convenience) ---
    elmKeyAdmin:           f.elmKeyAdmin           ?? d.elmKeyAdmin           ?? (userDetails?.security_areas?.find((a: any) => a.area_type === 'elm')?.director_name || ''),
    elmKeyAdminUsername:   f.elmKeyAdminUsername   ?? d.elmKeyAdminUsername   ?? (userDetails?.security_areas?.find((a: any) => a.area_type === 'elm')?.director_email || ''),
    hrDirector:            f.hrDirector            ?? d.hrDirector            ?? (userDetails?.security_areas?.find((a: any) => a.area_type === 'hr_payroll')?.director_name || ''),
    hrDirectorEmail:       f.hrDirectorEmail       ?? d.hrDirectorEmail       ?? (userDetails?.security_areas?.find((a: any) => a.area_type === 'hr_payroll')?.director_email || ''),
    accountingDirector:    f.accountingDirector    ?? d.accountingDirector    ?? (userDetails?.security_areas?.find((a: any) => a.area_type === 'accounting_procurement')?.director_name || ''),
    accountingDirectorUsername: f.accountingDirectorUsername ?? d.accountingDirectorUsername ?? (userDetails?.security_areas?.find((a: any) => a.area_type === 'accounting_procurement')?.director_email || ''),

    // --- HR bits (if they exist on your main form) ---
    hrMainframeLogonId: f.hrMainframeLogonId ?? d.hrMainframeLogonId ?? '',
    hrViewStatewide:    f.hrViewStatewide    ?? d.hrViewStatewide    ?? false,
  };

  log('🧩 buildCompleteFormData ->', merged);
  return merged;
}

function UserSelect({ 
  selectedUser, 
  onUserChange, 
  error, 
  required = false, 
  currentUser, 
  currentRequestId,
  formData 
}: UserSelectProps) {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [roleSelections, setRoleSelections] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const goToCorrectArea = (details: any) => {
    const securityAreas = details?.security_areas || [];
    if (securityAreas.some((a: any) => a.area_type === 'elm')) return '/elm-roles';
    if (securityAreas.some((a: any) => a.area_type === 'epm_data_warehouse')) return '/epm-dwh-roles';
    if (securityAreas.some((a: any) => a.area_type === 'hr_payroll')) return '/hr-payroll-roles';
    return '/select-roles';
  };

    const persistCopyContext = (payload: {
    pendingFormData: any,
    roleSelections: any,
    userDetails: any,
    mode: 'copy' | 'editCopied'
  }) => {
    const { pendingFormData, roleSelections, userDetails, mode } = payload;
    const normalizedRoles = normalizeRoles(roleSelections);

    // ✨ Use sessionStorage so a refresh/new tab doesn't carry stale data
    const S = window.sessionStorage;

    // Flags
    S.setItem('isCopyFlow', 'true');
    S.setItem('editingCopiedRoles', mode === 'editCopied' ? 'true' : 'true');

    // Payloads (save both raw + normalized to be future-proof)
    S.setItem('pendingFormData', JSON.stringify(pendingFormData));
    S.setItem('pendingFormDataRaw', JSON.stringify(pendingFormData));
    S.setItem('copiedRoleSelectionsRaw', JSON.stringify(roleSelections || {}));
    S.setItem('copiedRoleSelections', JSON.stringify(normalizedRoles));

    // Minimal user details (source of copy)
    S.setItem('copiedUserDetails', JSON.stringify({
      id: userDetails?.id ?? null,
      email: userDetails?.email ?? null,
      employee_name: userDetails?.employee_name ?? null,
      employee_id: userDetails?.employee_id ?? null,
    }));

    S.setItem('copyFlowSource', JSON.stringify({
      createdFromRequestId: userDetails?.id ?? null,
      createdAt: new Date().toISOString()
    }));

    log('📦 Copy/Edit flow context saved:', {
      pendingFormData,
      normalizedRolesKeys: Object.keys(normalizedRoles),
      mode
    });

    return { normalizedRoles };
  };
  
  const handleEditRoles = () => {
    if (!selectedUser || !userDetails) {
      console.error('No user selected or user details not loaded');
      return;
    }
    const mainDraft = findLatestMainFormDraft();
    const currentFormData = buildCompleteFormData(formData, mainDraft, userDetails);
    const { normalizedRoles } = persistCopyContext({
      pendingFormData: currentFormData,
      roleSelections,
      userDetails,
      mode: 'editCopied'
    });
    log('✍️ Edit roles for copied user - normalized roles:', normalizedRoles);
    navigate(goToCorrectArea(userDetails));
  };

  // Copies this user's roles into localStorage then navigates to the area page
  const handleCopyRoles = () => {
    if (!userDetails) {
      toast.error('User details not loaded. Please try again.');
      return;
    }

    // Merge prop formData with the latest main-form draft
    const mainDraft = findLatestMainFormDraft();
    const completeFormData = buildCompleteFormData(formData, mainDraft, userDetails);

    const { normalizedRoles } = persistCopyContext({
      pendingFormData: completeFormData,
      roleSelections,
      userDetails,
      mode: 'copy'
    });

    log('✅ Copy flow initiatied - normalized roles keys:', Object.keys(normalizedRoles));
    toast.success('Roles copied. Opening role selection…');
    navigate(goToCorrectArea(userDetails));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser?.request_id) {
      fetchUserDetails(selectedUser.request_id);
    } else {
      setUserDetails(null);
      setRoleSelections(null);
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('security_role_requests')
        .select(`
          id,
          employee_name, 
          employee_id, 
          email,
          security_areas (
            area_type,
            director_name,
            director_email
          )
        `)
        .in('status', ['approved', 'completed'])
        .not('employee_name', 'is', null)
        .not('employee_id', 'is', null)
        .order('employee_name');

      if (error) throw error;

      log('All users fetched from approved/completed requests:', data);

      // Dedup by employee_id
      const uniqueUsers = data.reduce((acc: User[], current: any) => {
        const exists = acc.find(u => u.employee_id === current.employee_id);
        if (!exists) {
          acc.push({
            employee_name: current.employee_name,
            employee_id: current.employee_id || '',
            email: current.email,
            request_id: current.id
          });
        }
        return acc;
      }, []);

      setUsers(uniqueUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (requestId: string) => {
    setLoadingDetails(true);
    try {
      log('Fetching user details for request ID:', requestId);

      // Fetch request details with security areas
      const { data: requestData, error: requestError } = await supabase
        .from('security_role_requests')
        .select(`
          *,
          security_areas (
            area_type,
            director_name,
            director_email
          )
        `)
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;
      log('Request data fetched:', requestData);
      setUserDetails(requestData);

      // Fetch role selections
      const { data: roleData, error: roleError } = await supabase
        .from('security_role_selections')
        .select('*')
        .eq('request_id', requestId)
        .maybeSingle();

      if (roleError) throw roleError;
      log('Role data fetched:', roleData);
      setRoleSelections(roleData);

    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUserChange = (selectedValue: string) => {
    log('🔧 UserSelect handleUserChange called with:', selectedValue);

    if (!selectedValue) {
      log('🔧 No value selected, calling onUserChange with null');
      onUserChange(null);
      return;
    }

    const user = users.find(u => `${u.employee_name} (${u.employee_id})` === selectedValue);
    log('🔧 Found user:', user);
    log('🔧 Calling onUserChange with user:', user);
    onUserChange(user || null);
  };

  // Convert users to options format for SearchableSelect
  const userOptions = users.map(user => ({
    value: `${user.employee_name} (${user.employee_id})`,
    label: `${user.employee_name} (${user.employee_id})`
  }));

  const selectedValue = selectedUser ? `${selectedUser.employee_name} (${selectedUser.employee_id})` : '';

  return (
    <div>
      <SearchableSelect
        options={userOptions}
        value={selectedValue}
        onChange={handleUserChange}
        placeholder={loading ? "Loading users..." : "Search for a user to copy..."}
        label={`Select User to Copy${required ? '*' : ''}`}
        required={required}
        error={error}
        searchPlaceholder="Type to search users..."
      />
      {selectedUser && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Selected:</strong> {selectedUser.employee_name} ({selectedUser.employee_id})
          </p>
          <p className="text-sm text-blue-600">
            Email: {selectedUser.email}
          </p>
        </div>
      )}

      {/* Show selected user details */}
      {selectedUser && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Access Details to be Copied</h4>
          {loadingDetails ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <UserRoleDetails 
                userDetails={userDetails} 
                roleSelections={roleSelections}
                // no mid-card buttons; use the bottom buttons instead
              />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleCopyRoles}
                  className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Copy These Roles
                </button>
                <button
                  onClick={handleEditRoles}
                  className="inline-flex items-center px-3 py-1 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Edit Before Copying
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 

export default UserSelect;
