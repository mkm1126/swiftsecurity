import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { isAfter, startOfToday } from 'date-fns';
import { ClipboardList } from 'lucide-react';
import { SecurityRoleRequest } from './types';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { toast } from 'sonner';
import Header from './components/Header';
import AgencySelect from './components/AgencySelect';
import { routes, roleRouteByArea, toRolePath } from './lib/routes';

const REQUESTS_TABLE = 'security_role_requests';

// Utilities
const snakeToCamel = (s: string) => s.replace(/_([a-z])/g, (_: any, c: string) => c.toUpperCase());
const mapAreaTypeToRadio = (t: string | null | undefined) => {
  const v = String(t || '').toLowerCase();
  if (!v) return '';
  if (v === 'elm' || v.includes('elm')) return 'elm';
  if (v === 'accounting_procurement' || v.includes('account') || v.includes('procure') || v === 'ap') return 'accounting_procurement';
  if (v === 'hr_payroll' || v.includes('payroll') || v.startsWith('hr')) return 'hr_payroll';
  if (v === 'epm_data_warehouse' || v.startsWith('epm') || v.includes('warehouse') || v === 'dw') return 'epm_data_warehouse';
  return v;
};

// Optional helper to keep around (only call this when you *explicitly* want to nuke drafts)
function clearRoleDraftsFromLocalStorage() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.startsWith('selectRoles_') ||
        key.startsWith('elmRoles_') ||
        key.startsWith('epmDwhRoles_') ||
        key.startsWith('hrPayrollRoles_'))
    ) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: paramId } = useParams();
  const stateId = (location.state as any)?.requestId as string | undefined;
  const effectiveId = (stateId || (paramId as any)) as string | undefined;
  const ctaLabel = effectiveId ? 'Save and Verify Role Selection' : 'Select or Copy Individual Roles';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<SecurityRoleRequest>();

  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(() => localStorage.getItem('testMode') === 'true');
  const [submitting, setSubmitting] = useState(false);
  const [hasRestoredData, setHasRestoredData] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const selectedSecurityArea = watch('securityArea');
  const hasSelectedSecurityArea = !!selectedSecurityArea;
  const isNonEmployee = watch('isNonEmployee');

  // Listen for user selection in header
  const handleUserChange = (userName: string | null) => setCurrentUser(userName);

  // Test mode toggles
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'testMode') setIsTestMode(e.newValue === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Clear form when leaving test mode (not during edit)
  useEffect(() => {
    if (!isTestMode) {
      if (effectiveId) return;
      reset({ startDate: '', employeeName: '', employeeId: '' } as any);
    }
  }, [isTestMode, reset, effectiveId]);

  /**
   * Restore main-form data ONLY when explicitly asked to (location.state.restoreMain === true).
   * Also: on a hard reload or a "fresh" entry to this page, clear any leftover main-form cache
   * so the form starts clean.
   */
  useEffect(() => {
    // Detect a hard reload / fresh entry (no navigation state)
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const isReload = nav?.type === 'reload';
    const freshEntry = !location.state && (isReload || location.key === 'default');

    if (freshEntry) {
      // Start clean — don't auto-restore old main-form data on a fresh load
      localStorage.removeItem('pendingMainFormData');
      return;
    }

    // Only restore if a caller explicitly set restoreMain === true in navigation state
    const shouldRestore = Boolean((location.state as any)?.restoreMain === true);
    if (!shouldRestore || effectiveId || hasRestoredData) return;

    const savedFormData = localStorage.getItem('pendingMainFormData');
    if (!savedFormData) return;

    try {
      const parsedData = JSON.parse(savedFormData);
      console.log('Restoring form data (explicit):', parsedData);
      reset(parsedData);
      setHasRestoredData(true);
    } catch (error) {
      console.error('Error restoring form data:', error);
    } finally {
      // Either way, drop the cache so it doesn’t linger
      localStorage.removeItem('pendingMainFormData');
    }
  }, [effectiveId, hasRestoredData, reset, location.state, location.key]);

  // Mark as initialized after first render to prevent cascading effects
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Autofill test data (skip during edit or after restore)
  useEffect(() => {
    if (!isInitialized) return;
    if (effectiveId || hasRestoredData) return;
    if (!(isTestMode && currentUser)) return;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const futureDateString = futureDate.toISOString().split('T')[0];

    // Generate unique identifiers for this test session
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const uniqueId = `${timestamp.toString().slice(-6)}${randomSuffix}`;
    
    const testData: any = {
      startDate: futureDateString,
      employeeName: `Test User ${uniqueId}`,
      employeeId: `EMP${uniqueId}`,
      isNonEmployee: false,
      workLocation: `${100 + Math.floor(Math.random() * 900)} Main Street, Saint Paul, MN 55101`,
      workPhone: `651555${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      email: `test.user.${uniqueId}@state.mn.us`,
      agencyName: 'Administration',
      agencyCode: 'G02',
      justification: 'Access required for pilot testing.',
      submitterName: `Submitter ${uniqueId}`,
      submitterEmail: `submitter.${uniqueId}@state.mn.us`,
      supervisorName: 'Supervisor Example',
      supervisorUsername: 'supervisor@state.mn.us',
      securityAdminName: 'Security Admin',
      securityAdminUsername: 'admin@state.mn.us',
      securityArea: 'accounting_procurement',
    };

    Object.entries(testData).forEach(([k, v]) => setValue(k as any, v as any));
  }, [isTestMode, currentUser, setValue, effectiveId, hasRestoredData]);

  // Separate effect to handle security area-specific test data
  useEffect(() => {
    if (!isInitialized) return;
    if (effectiveId || hasRestoredData) return;
    if (!(isTestMode && currentUser && selectedSecurityArea)) return;

    // Generate unique identifiers for this test session
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const uniqueId = `${timestamp.toString().slice(-6)}${randomSuffix}`;

    // First, clear all security area-specific fields to remove data from previously selected areas
    const allAreaFields = [
      'accountingDirector',
      'accountingDirectorUsername',
      'hrDirector', 
      'hrDirectorEmail',
      'hrMainframeLogonId',
      'elmDirector',
      'elmDirectorEmail',
      'elmKeyAdmin',
      'elmKeyAdminUsername'
    ];
    
    allAreaFields.forEach(field => {
      setValue(field as any, '', { shouldDirty: false });
    });
    // Only set director data for the selected security area
    const areaSpecificData: any = {};

    if (selectedSecurityArea === 'accounting_procurement') {
      areaSpecificData.accountingDirector = 'Accounting Director Test';
      areaSpecificData.accountingDirectorUsername = 'Accounting.Director@state.mn.us';
    } else if (selectedSecurityArea === 'hr_payroll') {
      areaSpecificData.hrDirector = 'HR Director Test';
      areaSpecificData.hrDirectorEmail = 'HR.Director@state.mn.us';
      areaSpecificData.hrMainframeLogonId = `HRTEST${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    } else if (selectedSecurityArea === 'elm') {
      areaSpecificData.elmDirector = 'ELM Director Test';
      areaSpecificData.elmDirectorEmail = 'ELM.Director@state.mn.us';
      areaSpecificData.elmKeyAdmin = 'ELM Director Test';
      areaSpecificData.elmKeyAdminUsername = 'ELM.Director@state.mn.us';
    }
    // Note: EPM Data Warehouse doesn't have specific director fields

    Object.entries(areaSpecificData).forEach(([k, v]) => setValue(k as any, v as any));
  }, [isTestMode, currentUser, selectedSecurityArea, setValue, effectiveId, hasRestoredData]);

  // Hydrate when editing
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!effectiveId) return;
      setIsTestMode(false);
      try {
        const { data: req, error } = await supabase
          .from('security_role_requests')
          .select('*')
          .eq('id', effectiveId)
          .maybeSingle();
        if (error || !req) {
          console.error('Failed to fetch request for edit (check table exposure):', error);
          return;
        }
        const mapped: any = {};
        for (const [k, v] of Object.entries(req)) {
          if (['id', 'created_at', 'updated_at'].includes(k)) continue;
          mapped[snakeToCamel(k)] = Array.isArray(v) ? v : (v ?? (typeof v === 'boolean' ? v : ''));
        }
        if (mounted) reset(mapped);
        if ((req as any)?.supervisor_email != null)
          setValue('supervisorUsername' as any, (req as any).supervisor_email as any, { shouldDirty: false });
        if (mounted && (req as any)?.security_admin_email != null)
          setValue('securityAdminUsername' as any, (req as any).security_admin_email as any, { shouldDirty: false });

        // Fetch security areas and populate director fields
        const { data: areas } = await supabase
          .from('security_areas')
          .select('area_type, director_name, director_email')
          .eq('request_id', effectiveId);
        if (areas && areas.length > 0) {
          const firstArea = areas[0] as any;
          const radio = mapAreaTypeToRadio(firstArea?.area_type);
          if (radio) setValue('securityArea' as any, radio as any, { shouldDirty: false });

          for (const area of areas) {
            const areaType = (area as any).area_type;
            const directorName = (area as any).director_name;
            const directorEmail = (area as any).director_email;

            if (areaType === 'elm') {
              if (directorName) setValue('elmDirector' as any, directorName as any, { shouldDirty: false });
              if (directorEmail) setValue('elmDirectorEmail' as any, directorEmail as any, { shouldDirty: false });
            } else if (areaType === 'hr_payroll') {
              if (directorName) setValue('hrDirector' as any, directorName as any, { shouldDirty: false });
              if (directorEmail) setValue('hrDirectorEmail' as any, directorEmail as any, { shouldDirty: false });
            } else if (areaType === 'accounting_procurement') {
              if (directorName) setValue('accountingDirector' as any, directorName as any, { shouldDirty: false });
              if (directorEmail) setValue('accountingDirectorUsername' as any, directorEmail as any, { shouldDirty: false });
            }
          }
        }
      } catch (e) {
        console.error('Hydration error:', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [effectiveId, reset, setValue]);

  const onSubmit = async (data: SecurityRoleRequest) => {
    if (!hasSelectedSecurityArea) {
      toast.error('Please select a security area before continuing.');
      return;
    }

    try {
      setSubmitting(true);

      // Check if table is accessible
      const { error: tableCheckError } = await supabase.from('security_role_requests').select('id').limit(1);

      if (tableCheckError) {
        console.error('Table access error:', tableCheckError);
        if (tableCheckError.code === 'PGRST116' || tableCheckError.message?.includes('not found')) {
          toast.error('Database table not accessible. Please check Supabase configuration.');
          return;
        }
      }

      const isEditing = Boolean(effectiveId);
      const formattedPhone = data.workPhone ? data.workPhone.replace(/\D/g, '') : null;
      const pocUser = localStorage.getItem('pocUserName');

      const requestData = {
        start_date: data.startDate || null,
        employee_name: data.employeeName || null,
        employee_id: data.employeeId || null,
        is_non_employee: data.isNonEmployee || false,
        work_location: data.workLocation || null,
        work_phone: formattedPhone,
        email: data.email || null,
        agency_name: data.agencyName || null,
        agency_code: data.agencyCode || null,
        justification: data.justification || null,
        submitter_name: data.submitterName || currentUser || 'Submitter Example',
        submitter_email: data.submitterEmail || 'submitter@state.mn.us',
        supervisor_name: data.supervisorName || null,
        supervisor_email: data.supervisorUsername || null,
        security_admin_name: data.securityAdminName || null,
        security_admin_email: data.securityAdminUsername || null,
        hr_mainframe_logon_id: data.hrMainframeLogonId || null,
      };

      let requestId = effectiveId as string | undefined;

      if (isEditing) {
        const { data: updated, error } = await supabase
          .from('security_role_requests')
          .update(requestData)
          .eq('id', effectiveId)
          .select()
          .maybeSingle();
        if (error) throw error;
        requestId = (updated?.id || effectiveId) as string;
      } else {
        const { data: created, error } = await supabase.from('security_role_requests').insert(requestData).select().single();
        if (error) throw error;
        requestId = created.id as string;
      }

      // Upsert security area
      // First, remove any existing security areas that don't match the current selection
      if (requestId) {
        try {
          const { error: deleteError } = await supabase
            .from('security_areas')
            .delete()
            .eq('request_id', requestId)
            .neq('area_type', data.securityArea);
          
          if (deleteError) {
            console.warn('Warning: Could not clean up old security areas:', deleteError);
          }
        } catch (cleanupError) {
          console.warn('Non-fatal: Security area cleanup failed:', cleanupError);
        }
      }

      // Now upsert the current security area
      const areas: any[] = [];
      if (data.securityArea === 'accounting_procurement') {
        areas.push({
          request_id: requestId,
          area_type: 'accounting_procurement',
          director_name: data.accountingDirector || 'Accounting Director',
          director_email:
            data.accountingDirectorUsername || data.supervisorUsername || data.submitterEmail,
        });
      } else if (data.securityArea === 'hr_payroll') {
        areas.push({
          request_id: requestId,
          area_type: 'hr_payroll',
          director_name: data.hrDirector || 'HR Director',
          director_email: data.hrDirectorEmail || data.supervisorUsername || data.submitterEmail,
        });
      } else if (data.securityArea === 'epm_data_warehouse') {
        areas.push({
          request_id: requestId,
          area_type: 'epm_data_warehouse',
          director_name: 'EPM Director',
          director_email: data.supervisorUsername || data.submitterEmail,
        });
      } else if (data.securityArea === 'elm') {
        areas.push({
          request_id: requestId,
          area_type: 'elm',
          director_name: data.elmKeyAdmin || 'ELM Key Admin',
          director_email: data.elmKeyAdminUsername || data.supervisorUsername || data.submitterEmail,
        });
      }
      if (areas.length) {
        for (const area of areas) {
          try {
            const { data: existing, error: selectError } = await supabase
              .from('security_areas')
              .select('id')
              .eq('request_id', area.request_id)
              .eq('area_type', area.area_type)
              .maybeSingle();

            if (selectError) {
              console.warn('Error checking existing security area:', selectError);
            }

            if (existing) {
              const { error: updateError } = await supabase
                .from('security_areas')
                .update({
                  director_name: area.director_name,
                  director_email: area.director_email,
                })
                .eq('id', existing.id);

              if (updateError) {
                console.warn('Error updating security area:', updateError);
              }
            } else {
              const { error: insertError } = await supabase.from('security_areas').insert(area);

              if (insertError) {
                if ((insertError as any).code === '23505') {
                  console.warn('Security area already exists, continuing...');
                } else {
                  throw insertError;
                }
              }
            }
          } catch (areaError: any) {
            if (areaError.code === '23505') {
              console.warn('Security area already exists, continuing...');
            } else {
              console.error('Error handling security area:', areaError);
            }
          }
        }
      }

      // Ensure selections row exists so roles can hydrate (only for new requests)
      // When editing, we don't touch role selections - those are managed on the role selection page
      if (!isEditing) {
        try {
          await supabase
            .from('security_role_selections')
            .insert({
              request_id: requestId,
              // Don't set home_business_unit - it will be set on role selection page
            });
        } catch (e) {
          // Ignore errors - row might already exist
          console.warn('Non-fatal: insert role selections failed', e);
        }
      }

      // Create approval records if this is a new request
      if (!isEditing && requestId) {
        try {
          const approvals = [
            {
              request_id: requestId,
              step: 'user_signature',
              approver_email: data.submitterEmail,
              status: 'pending'
            },
            {
              request_id: requestId,
              step: 'supervisor_approval',
              approver_email: data.supervisorUsername || data.submitterEmail,
              status: 'pending'
            }
          ];

          // Add area-specific approvals
          if (data.securityArea === 'accounting_procurement') {
            approvals.push({
              request_id: requestId,
              step: 'accounting_director_approval',
              approver_email: data.accountingDirectorUsername || data.supervisorUsername || data.submitterEmail,
              status: 'pending'
            });
          } else if (data.securityArea === 'hr_payroll') {
            approvals.push({
              request_id: requestId,
              step: 'hr_director_approval',
              approver_email: data.hrDirectorEmail || data.supervisorUsername || data.submitterEmail,
              status: 'pending'
            });
          } else if (data.securityArea === 'elm') {
            approvals.push({
              request_id: requestId,
              step: 'elm_admin_approval',
              approver_email: data.elmKeyAdminUsername || data.supervisorUsername || data.submitterEmail,
              status: 'pending'
            });
          }

          // Always add security admin as final approval
          approvals.push({
            request_id: requestId,
            step: 'security_admin_approval',
            approver_email: 'security.admin@state.mn.us',
            status: 'pending'
          });

          const { error: approvalError } = await supabase
            .from('request_approvals')
            .insert(approvals);

          if (approvalError) {
            console.warn('Warning: Could not create approval records:', approvalError);
          }
        } catch (approvalError) {
          console.warn('Non-fatal: Approval creation failed:', approvalError);
        }
      }

      // Navigate to the appropriate role selection page based on security area
      let targetRoute = '/select-roles'; // default to accounting/procurement
      if (data.securityArea === 'elm') {
        targetRoute = '/elm-roles';
      } else if (data.securityArea === 'hr_payroll') {
        targetRoute = '/hr-payroll-roles';
      } else if (data.securityArea === 'epm_data_warehouse') {
        targetRoute = '/epm-dwh-roles';
      }
      // When editing, pass hydrateFromDb flag to load existing roles from database
      navigate(`${targetRoute}/${requestId}`, {
        state: {
          requestId,
          hydrateFromDb: isEditing // Load existing roles when editing
        }
      });
    } catch (error: any) {
      console.error('Submit error (strict security_role_requests):', error);

      const msg = String(error?.message || '');
      if (error?.code === 'PGRST116' || /relation.*does not exist/i.test(msg) || /not found/i.test(msg)) {
        toast.error("Database table 'security_role_requests' is not accessible. Please check your Supabase setup.");
        console.error('Database table access error. Please ensure:');
        console.error('1. The table exists in your Supabase database');
        console.error('2. RLS policies allow public access for insert/select operations');
        console.error('3. The table is in the public schema');
      } else if (/home_business_unit/i.test(msg) || /violates not-null/i.test(msg)) {
        setError('agencyCode', {
          type: 'manual',
          message: 'Business Unit is required. Please ensure your agency is properly selected.',
        });
      } else {
        setError('root', { type: 'manual', message: msg || 'Unexpected error.' });
        toast.error('Could not create/update the request. See console for details.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Request for Access to SWIFT Statewide Systems"
        subtitle="Complete this form to request security role access"
        onUserChange={handleUserChange}
      />

      <main id="main-content" className="py-8 px-4 sm:px-6 lg:px-8">
        {!currentUser && !effectiveId ? (
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6" role="alert" aria-live="polite">
              <h2 className="text-lg font-medium text-blue-900 mb-2">User Identification Required</h2>
              <p className="text-blue-700">Please identify yourself to begin creating requests.</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow" noValidate aria-label="Security role access request form">
              {/* Employee Details */}
              <fieldset className="space-y-6">
                <legend className="flex items-center text-xl font-semibold text-gray-900">
                  <ClipboardList className="h-6 w-6 text-blue-600 mr-2" aria-hidden="true" />
                  <span>Employee Details</span>
                </legend>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      Start Date of Access<span className="text-red-600" aria-label="required">*</span>
                    </label>
                    <input
                      id="startDate"
                      type="date"
                      {...register('startDate', {
                        required: 'Start date is required',
                        validate: (value) => isAfter(new Date(value), startOfToday()) || 'Start date must be in the future',
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      aria-invalid={errors.startDate ? 'true' : 'false'}
                      aria-describedby={errors.startDate ? 'startDate-error' : undefined}
                    />
                    {errors.startDate && <p id="startDate-error" className="mt-1 text-sm text-red-600" role="alert">{errors.startDate.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700">
                      Employee Name<span className="text-red-600" aria-label="required">*</span>
                    </label>
                    <input
                      id="employeeName"
                      type="text"
                      {...register('employeeName', { required: 'Employee name is required' })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      aria-invalid={errors.employeeName ? 'true' : 'false'}
                      aria-describedby={errors.employeeName ? 'employeeName-error' : undefined}
                    />
                    {errors.employeeName && (
                      <p id="employeeName-error" className="mt-1 text-sm text-red-600" role="alert">{errors.employeeName.message}</p>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                    <div className="flex items-center mt-1">
                      <input
                        type="text"
                        {...register('employeeId', { required: false })}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            {...register('isNonEmployee')}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-600">Non-Employee</span>
                        </label>
                      </div>
                    </div>
                    {errors.employeeId && <p className="mt-1 text-sm text-red-600">{errors.employeeId.message}</p>}
                  </div>

                  {isNonEmployee && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Non-Employee Type*</label>
                        <select
                          {...register('nonEmployeeType', { required: isNonEmployee ? 'Non-employee type is required' : false })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="">Select type...</option>
                          <option value="contractor">Contractor</option>
                          <option value="consultant">Consultant</option>
                          <option value="vendor">Vendor</option>
                          <option value="temporary">Temporary Worker</option>
                          <option value="intern">Intern</option>
                          <option value="other">Other</option>
                        </select>
                        {errors.nonEmployeeType && <p className="mt-1 text-sm text-red-600">{errors.nonEmployeeType.message}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Access End Date*</label>
                        <input
                          type="date"
                          {...register('accessEndDate', {
                            required: isNonEmployee ? 'Access end date is required for non-employees' : false,
                            validate: (value) => {
                              if (!isNonEmployee || !value) return true;
                              const startDate = watch('startDate');
                              if (!startDate) return true;
                              return new Date(value) > new Date(startDate) || 'End date must be after start date';
                            }
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.accessEndDate && <p className="mt-1 text-sm text-red-600">{errors.accessEndDate.message}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Security Measures*</label>
                        <textarea
                          {...register('securityMeasures', { required: isNonEmployee ? 'Security measures description is required' : false })}
                          rows={3}
                          placeholder="Describe security measures and oversight for non-employee access..."
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.securityMeasures && <p className="mt-1 text-sm text-red-600">{errors.securityMeasures.message}</p>}
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Work Location</label>
                    <input
                      type="text"
                      {...register('workLocation')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Work Phone</label>
                    <input
                      type="tel"
                      {...register('workPhone', {
                        pattern: {
                          value: /^(\d{10})?$/,
                          message: 'Please enter a valid 10-digit phone number || leave empty',
                        },
                      })}
                      placeholder="1234567890"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.workPhone && <p className="mt-1 text-sm text-red-600">{errors.workPhone.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address*</label>
                    <input
                      type="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                  </div>

                  <div>
                    <AgencySelect
                      value={watch('agencyName') || ''}
                      onChange={(n: string, c: string) => {
                        setValue('agencyName', n);
                        setValue('agencyCode', c);
                      }}
                      error={errors.agencyName?.message}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Agency Code*</label>
                    <input
                      type="text"
                      {...register('agencyCode', {
                        required: 'Agency code is required',
                        maxLength: { value: 3, message: 'Agency code must be 3 characters' },
                        minLength: { value: 3, message: 'Agency code must be 3 characters' },
                      })}
                      readOnly
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                    />
                    {errors.agencyCode && <p className="mt-1 text-sm text-red-600">{errors.agencyCode.message}</p>}
                  </div>
                </div>

                {errors.root && (
                  <div className="rounded-md bg-red-50 p-4" role="alert" aria-live="assertive">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Form Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{errors.root.message}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Request Justification</label>
                  <textarea
                    {...register('justification')}
                    rows={3}
                    placeholder="Please provide justification for this access request..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Please enter additional specifications or comments on why the person needs access or why a change is needed.
                  </p>
                </div>
              </fieldset>

              {/* Submitter Details */}
              <fieldset className="space-y-6">
                <legend className="text-xl font-semibold text-gray-900 border-b pb-2 w-full">Submitter Details</legend>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Submitter Name*</label>
                    <input
                      type="text"
                      {...register('submitterName', { required: 'Submitter name is required' })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.submitterName && (
                      <p className="mt-1 text-sm text-red-600">{errors.submitterName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Submitter Email*</label>
                    <input
                      type="email"
                      {...register('submitterEmail', {
                        required: 'Submitter email is required',
                        pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' },
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.submitterEmail && (
                      <p className="mt-1 text-sm text-red-600">{errors.submitterEmail.message}</p>
                    )}
                  </div>
                </div>
              </fieldset>

              {/* Approver Details */}
              <fieldset className="space-y-6">
                <legend className="text-xl font-semibold text-gray-900 border-b pb-2 w-full">Approver Details</legend>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employee's Supervisor*</label>
                    <input
                      type="text"
                      {...register('supervisorName', { required: 'Supervisor name is required' })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.supervisorName && (
                      <p className="mt-1 text-sm text-red-600">{errors.supervisorName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Supervisor Email*</label>
                    <input
                      type="email"
                      {...register('supervisorUsername', {
                        required: 'Supervisor email is required',
                        pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Please enter a valid email address' },
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="supervisor@example.com"
                    />
                    {errors.supervisorUsername && (
                      <p className="mt-1 text-sm text-red-600">{errors.supervisorUsername.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Agency Security Administrator*</label>
                    <input
                      type="text"
                      {...register('securityAdminName', { required: 'Security admin name is required' })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.securityAdminName && (
                      <p className="mt-1 text-sm text-red-600">{errors.securityAdminName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Security Administrator Email*</label>
                    <input
                      type="email"
                      {...register('securityAdminUsername', {
                        required: 'Security admin email is required',
                        pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Please enter a valid email address' },
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="admin@example.com"
                    />
                    {errors.securityAdminUsername && (
                      <p className="mt-1 text-sm text-red-600">{errors.securityAdminUsername.message}</p>
                    )}
                  </div>
                </div>
              </fieldset>

              {/* Security Details + CTA */}
              <fieldset className="space-y-6">
                <legend className="text-xl font-semibold text-gray-900 border-b pb-2 w-full">Security Details</legend>
                <p className="text-sm text-gray-700">Please select the security area you need access to</p>

                {!hasSelectedSecurityArea && (
                  <div className="rounded-md bg-yellow-50 p-4" role="alert" aria-live="polite">
                    <div className="flex">
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-yellow-800">Required Selection</h4>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>Please select a security area to proceed.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        {...register('securityArea', { required: 'Please select a security area' })}
                        value="accounting_procurement"
                        className="border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Accounting / Procurement</span>
                    </label>

                    {/* Accounting Director fields - show when Accounting/Procurement is selected */}
                    {selectedSecurityArea === 'accounting_procurement' && (
                      <div className="ml-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="text-sm font-medium text-green-800 mb-4">Accounting Director Information</h4>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Accounting Director*</label>
                            <input
                              type="text"
                              {...register('accountingDirector', {
                                required:
                                  selectedSecurityArea === 'accounting_procurement'
                                    ? 'Accounting Director is required'
                                    : false,
                              })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Enter Accounting Director name"
                            />
                            {errors.accountingDirector && (
                              <p className="mt-1 text-sm text-red-600">{errors.accountingDirector.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Director Email*</label>
                            <input
                              type="email"
                              {...register('accountingDirectorUsername', {
                                required:
                                  selectedSecurityArea === 'accounting_procurement'
                                    ? 'Director email is required'
                                    : false,
                                pattern: {
                                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                  message: 'Please enter a valid email address',
                                },
                              })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder="director@state.mn.us"
                            />
                            {errors.accountingDirectorUsername && (
                              <p className="mt-1 text-sm text-red-600">{errors.accountingDirectorUsername.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        {...register('securityArea')}
                        value="hr_payroll"
                        className="border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">HR / Payroll</span>
                    </label>

                    {/* HR Director fields - show when HR/Payroll is selected */}
                    {selectedSecurityArea === 'hr_payroll' && (
                      <div className="ml-6 mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <h4 className="text-sm font-medium text-purple-800 mb-4">HR Director Information</h4>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">HR Director*</label>
                            <input
                              type="text"
                              {...register('hrDirector', {
                                required: selectedSecurityArea === 'hr_payroll' ? 'HR Director is required' : false,
                              })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Enter HR Director name"
                            />
                            {errors.hrDirector && (
                              <p className="mt-1 text-sm text-red-600">{errors.hrDirector.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Director Email*</label>
                            <input
                              type="email"
                              {...register('hrDirectorEmail', {
                                required:
                                  selectedSecurityArea === 'hr_payroll' ? 'Director email is required' : false,
                                pattern: {
                                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                  message: 'Please enter a valid email address',
                                },
                              })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder="director@state.mn.us"
                            />
                            {errors.hrDirectorEmail && (
                              <p className="mt-1 text-sm text-red-600">{errors.hrDirectorEmail.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Mainframe Logon ID*</label>
                            <input
                              type="text"
                              {...register('hrMainframeLogonId', {
                                required: selectedSecurityArea === 'hr_payroll' ? 'Mainframe Logon ID is required' : false,
                              })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Enter mainframe logon ID"
                            />
                            {errors.hrMainframeLogonId && (
                              <p className="mt-1 text-sm text-red-600">{errors.hrMainframeLogonId.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        {...register('securityArea')}
                        value="epm_data_warehouse"
                        className="border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">EPM / Data Warehouse</span>
                    </label>
                  </div>

                  <div>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        {...register('securityArea')}
                        value="elm"
                        className="border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">ELM</span>
                    </label>
                    <p className="ml-6 mt-1 text-sm text-gray-500">
                      DON'T SELECT ELM unless you are seeking access privileges for administrative functions. All active employees have learner access to ELM.
                    </p>

                    {/* ELM Director fields - show when ELM is selected */}
                    {selectedSecurityArea === 'elm' && (
                      <div className="ml-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-800 mb-4">ELM Director Information</h4>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">ELM Director*</label>
                            <input
                              type="text"
                              {...register('elmDirector', {
                                required: selectedSecurityArea === 'elm' ? 'ELM Director is required' : false,
                              })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Enter ELM Director name"
                            />
                            {errors.elmDirector && (
                              <p className="mt-1 text-sm text-red-600">{errors.elmDirector.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Director Email*</label>
                            <input
                              type="email"
                              {...register('elmDirectorEmail', {
                                required: selectedSecurityArea === 'elm' ? 'Director email is required' : false,
                                pattern: {
                                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                  message: 'Please enter a valid email address',
                                },
                              })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder="director@state.mn.us"
                            />
                            {errors.elmDirectorEmail && (
                              <p className="mt-1 text-sm text-red-600">{errors.elmDirectorEmail.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Continue to Role Selection */}
                <div className="bg-gray-50 p-6 rounded-lg mt-6">
                  <button
                    type="submit"
                    disabled={submitting || !hasSelectedSecurityArea}
                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                      !submitting && hasSelectedSecurityArea
                        ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    aria-disabled={submitting || !hasSelectedSecurityArea}
                  >
                    {submitting ? 'Saving…' : ctaLabel}
                  </button>
                  <p className="mt-2 text-center text-sm text-gray-600">
                    You can select individual roles or copy from an existing user on the next page
                  </p>
                </div>
              </fieldset>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
