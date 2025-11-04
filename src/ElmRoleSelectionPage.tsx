// src/ElmRoleSelectionPage.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  BookOpen,
  Users,
  Shield,
  Settings,
  UserCheck,
  Database,
  Copy,
} from 'lucide-react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { toast } from 'sonner';
import Header from './components/Header';
import UserSelect from './components/UserSelect';

interface ElmRoleSelection {
  learningAdministrator: boolean;
  learningCatalogAdministrator: boolean;
  rosterAdministrator: boolean;
  enrollmentAdministrator: boolean;
  maintainApprovals: boolean;
  profileAdministrator: boolean;
  externalLearnerSecurityAdministrator: boolean;
  sandboxAccess: boolean;
  roleJustification: string;
}

type CopyFlowForm = {
  startDate: string;
  employeeName: string;
  employeeId?: string;
  isNonEmployee?: boolean;
  workLocation?: string;
  workPhone?: string;
  email: string;
  agencyName: string;
  agencyCode: string;
  justification?: string;
  submitterName: string;
  submitterEmail: string;
  supervisorName: string;
  supervisorUsername: string;
  securityAdminName: string;
  securityAdminUsername: string;
  elmKeyAdmin?: string;
  elmKeyAdminUsername?: string;
};

interface User {
  employee_name: string;
  employee_id: string;
  email: string;
  request_id?: string;
}

const elmRoles = [
  { id: 'learningAdministrator', title: 'Learning Administrator', description: 'As a lead administrator for your agency, you will request this role. This has expanded menu options in the Enterprise Learning Folder.', icon: Shield, isHighRisk: true },
  { id: 'learningCatalogAdministrator', title: 'Learning Catalog Administrator', description: 'This role provides access to create and manage Learner Groups, create and maintain catalog functions; Manage Programs, Manage Courses, and Manage Classes.', icon: BookOpen, isHighRisk: false },
  { id: 'rosterAdministrator', title: 'Roster Administrator', description: 'This role will allow you to review and administer both Class and Program rosters in the Learner Tasks folder. You will also have the ability to create Ad Hoc announcements in the Notifications folder. This role also give you access to run both delivered and custom ELM reports.', icon: Users, isHighRisk: false },
  { id: 'enrollmentAdministrator', title: 'Enrollment Administrator', description: "This role provides you with the menus to enroll learners in a class. Learners can be enrolled from the Enroll menu as well as directly from the rosters. You will also have access to maintain learning requests and add supplemental learning for your agency's learners. Monitoring and maintaining approvals are also part of the role.", icon: UserCheck, isHighRisk: false },
  { id: 'maintainApprovals', title: 'Maintain Approvals', description: 'This role is generally assigned to Agency Training Coordinators. You will have access to the Learner Task folder to monitor and maintain approvals.', icon: Settings, isHighRisk: false },
  { id: 'profileAdministrator', title: 'Profile Administrator', description: "This role provides access to the User Profiles and Organization folders. You will be able to review internal learners' profiles, and review and add External learner profiles. You will also have the ability to review reporting relationships in your agency.", icon: Users, isHighRisk: false },
  { id: 'externalLearnerSecurityAdministrator', title: 'External Learner Security Administrator', description: 'This role, combined with the External Learner Security role, provides you the ability to create external learners. (M_HR_External_Learner_Security and M_LMLELM_External_Learning_Adm)', icon: Shield, isHighRisk: true },
  { id: 'sandboxAccess', title: 'Sandbox Access', description: 'If this box is checked, the person will need same security roles in ELMUQ in addition to ELMAP. (M_ELM_TRAINING_LINK)', icon: Database, isHighRisk: false, specialNote: 'Note: If this box is checked, the person will need same security roles in ELM92UQ in addition to ELM92AP.' },
];
// --- helpers for Edit hydration ---
const snakeToCamel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const mapSelectionsToForm = (row: any): Partial<ElmRoleSelection> => {
  const out: Partial<ElmRoleSelection> = {};
  // direct mappings
  out.learningAdministrator = !!row.learning_administrator;
  out.learningCatalogAdministrator = !!row.learning_catalog_administrator;
  out.rosterAdministrator = !!row.roster_administrator;
  out.enrollmentAdministrator = !!row.enrollment_administrator;
  out.maintainApprovals = !!row.maintain_approvals;
  out.profileAdministrator = !!row.profile_administrator;
  // external learner requires either flag
  out.externalLearnerSecurityAdministrator = !!(row.m_hr_external_learner_security || row.m_lmlelm_external_learning_adm);
  out.sandboxAccess = !!row.system_backup_access;
  // text
  out.roleJustification = row.role_justification || '';
  return out;
};

/** Strict payload builder: keep keys intact; include all booleans so unchecking clears in DB */
function buildBooleanFlags(obj: Record<string, boolean>) {
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = !!v; // persist true/false explicitly
  return out;
}

/** strict initial payload (string home BU, other BUs = null). Only true booleans are sent. */

function buildSelections(
  requestId: string,
  homeAgencyCode: string | undefined,
  form: ElmRoleSelection
) {
  const homeBU = (homeAgencyCode?.padEnd(5, '0') || '00000').substring(0, 5);

  // Full map of DB boolean columns for ELM
  const bools: Record<string, boolean> = {
    learning_administrator: !!form.learningAdministrator,
    learning_catalog_administrator: !!form.learningCatalogAdministrator,
    roster_administrator: !!form.rosterAdministrator,
    enrollment_administrator: !!form.enrollmentAdministrator,
    maintain_approvals: !!form.maintainApprovals,
    profile_administrator: !!form.profileAdministrator,
    m_hr_external_learner_security: !!form.externalLearnerSecurityAdministrator,
    m_lmlelm_external_learning_adm: !!form.externalLearnerSecurityAdministrator,
    system_backup_access: !!form.sandboxAccess,
  };

  return {
    request_id: requestId,
    home_business_unit: homeBU,
    other_business_units: null as string[] | null,
    ...buildBooleanFlags(bools),
    role_justification: (form.roleJustification ?? '').trim(),
  };
}


/** If DB says 22P02 (array expected), coerce potential array fields then return a new payload */
function coerceArraysIfNeeded(payload: any) {
  const fixed = { ...payload };
  const maybeArrayKeys = ['home_business_unit', 'other_business_units'];
  for (const k of maybeArrayKeys) {
    const v = fixed[k];
    if (v == null) continue;                 // null is valid for array columns
    if (Array.isArray(v)) continue;
    // wrap single value as one-element array
    fixed[k] = [String(v)];
  }
  return fixed;
}

function isArrayFormatError(err: any) {
  return err?.code === '22P02' &&
    (String(err?.message || '').includes('Array value must start with') ||
     String(err?.message || '').includes('malformed array literal'));
}

function ElmRoleSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { requestId?: string } };
  const { id: idParam } = useParams();

  const [saving, setSaving] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<{ employee_name?: string; agency_name?: string; agency_code?: string } | null>(null);
  const [isEditingCopiedRoles, setIsEditingCopiedRoles] = useState(false);
  const [selectedCopyUser, setSelectedCopyUser] = useState<User | null>(null);
  const [showCopySection, setShowCopySection] = useState(false);

  const { register, handleSubmit, watch, setValue, setError, formState: { errors } } = useForm<ElmRoleSelection>();
  const selectedRoles = watch();
  const hasHighRiskRoles = elmRoles.filter(r => r.isHighRisk).some(r => !!selectedRoles?.[r.id as keyof ElmRoleSelection]);
  const hasSelectedRoles = elmRoles.some(r => !!selectedRoles?.[r.id as keyof ElmRoleSelection]);

  // Handler for when user details are loaded from UserSelect component
  const handleUserDetailsLoaded = (data: { userDetails: any; roleSelections: any; normalizedRoles: any }) => {
    console.log('📥 User details loaded for copy:', data);
    const { roleSelections, normalizedRoles } = data;

    if (roleSelections) {
      // Map database fields to form fields for ELM roles
      setValue('learningAdministrator', !!roleSelections.learning_administrator, { shouldDirty: true });
      setValue('learningCatalogAdministrator', !!roleSelections.learning_catalog_administrator, { shouldDirty: true });
      setValue('rosterAdministrator', !!roleSelections.roster_administrator, { shouldDirty: true });
      setValue('enrollmentAdministrator', !!roleSelections.enrollment_administrator, { shouldDirty: true });
      setValue('maintainApprovals', !!roleSelections.maintain_approvals, { shouldDirty: true });
      setValue('profileAdministrator', !!roleSelections.profile_administrator, { shouldDirty: true });

      // External learner security administrator requires either flag
      const externalLearner = !!(roleSelections.m_hr_external_learner_security || roleSelections.m_lmlelm_external_learning_adm);
      setValue('externalLearnerSecurityAdministrator', externalLearner, { shouldDirty: true });

      setValue('sandboxAccess', !!roleSelections.system_backup_access, { shouldDirty: true });
      setValue('roleJustification', roleSelections.role_justification || '', { shouldDirty: true });

      toast.success('Roles copied successfully! Review and modify as needed.');
    }
  };

  // Simple form persistence - save form data when it changes
  useEffect(() => {
    if (!requestDetails) return;

    const timeoutId = setTimeout(() => {
      const formData = watch();
      if (Object.keys(formData).length === 0) return;

      const storageKey = `elmRoles_${requestDetails.employee_name}_${requestDetails.agency_name}`.replace(/[^a-zA-Z0-9]/g, '_');
      localStorage.setItem(storageKey, JSON.stringify(formData));
      console.log('💾 Auto-saving ELM form data:', { storageKey, formData });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watch(), requestDetails]);

  useEffect(() => {
    const isCopyFlow = localStorage.getItem('editingCopiedRoles') === 'true';

    if (isCopyFlow) {
      const pendingFormData = localStorage.getItem('pendingFormData');
      const copiedRoleSelections = localStorage.getItem('copiedRoleSelections');
      const copiedUserDetails = localStorage.getItem('copiedUserDetails');

      if (pendingFormData && copiedRoleSelections && copiedUserDetails) {
        setIsEditingCopiedRoles(true);
        try {
          const formData: CopyFlowForm = JSON.parse(pendingFormData);
          const roleData = JSON.parse(copiedRoleSelections);
          setRequestDetails({ employee_name: formData.employeeName, agency_name: formData.agencyName, agency_code: formData.agencyCode });

          // Map copied role data using both camelCase (normalized) and snake_case (raw) field names
          setValue('learningAdministrator', !!(roleData?.learningAdministrator || roleData?.learning_administrator), { shouldDirty: false });
          setValue('learningCatalogAdministrator', !!(roleData?.learningCatalogAdministrator || roleData?.learning_catalog_administrator), { shouldDirty: false });
          setValue('rosterAdministrator', !!(roleData?.rosterAdministrator || roleData?.roster_administrator), { shouldDirty: false });
          setValue('enrollmentAdministrator', !!(roleData?.enrollmentAdministrator || roleData?.enrollment_administrator), { shouldDirty: false });
          setValue('maintainApprovals', !!(roleData?.maintainApprovals || roleData?.maintain_approvals), { shouldDirty: false });
          setValue('profileAdministrator', !!(roleData?.profileAdministrator || roleData?.profile_administrator), { shouldDirty: false });

          // External learner security administrator requires either flag
          const externalLearner = !!(
            roleData?.externalLearnerSecurityAdministrator ||
            roleData?.m_hr_external_learner_security ||
            roleData?.m_lmlelm_external_learning_adm
          );
          setValue('externalLearnerSecurityAdministrator', externalLearner, { shouldDirty: false });

          setValue('sandboxAccess', !!(roleData?.sandboxAccess || roleData?.system_backup_access), { shouldDirty: false });
          setValue('roleJustification', roleData?.roleJustification || roleData?.role_justification || '', { shouldDirty: false });

          console.log('✅ Copy flow data loaded successfully for ELM roles');
        } catch (e) {
          console.error('Error loading copy-flow data:', e);
          toast.error('Error loading copied user data');
        }
      } else {
        // Missing copy flow data, clean up and redirect
        localStorage.removeItem('editingCopiedRoles');
        toast.error('Copy flow data is incomplete. Please try again.');
        navigate('/');
      }
    } else {
      const stateRequestId = location.state?.requestId;
      const effectiveId = stateRequestId || (idParam as string | undefined);
      if (effectiveId) {
        setRequestId(effectiveId);
        fetchRequestDetails(effectiveId);
        fetchExistingSelections(effectiveId);
      } else {
        toast.error('Please complete the main form first before selecting ELM roles.');
        navigate('/');
      }
    }
  }, [location.state, navigate, setValue]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

  async function fetchRequestDetails(id: string) {
    try {
      const { data, error } = await supabase
        .from('security_role_requests')
        .select('employee_name, agency_name, agency_code')
        .eq('id', id)
        .single();
      if (error) throw error;
      setRequestDetails(data || null);
    } catch (error) {
      console.error('Error fetching request details:', error);
      toast.error('Failed to load request details');
    }
  }

  // Try to restore saved form data after request details are loaded
  useEffect(() => {
    if (!requestDetails) return;

    // Check if we should hydrate from database (e.g., from Edit Roles button)
    const shouldHydrateFromDb = location.state?.hydrateFromDb;

    if (shouldHydrateFromDb) {
      console.log('📡 Edit mode: Fetching existing selections from Supabase');
      if (requestId) {
        fetchExistingSelections(requestId);
      }
      return;
    }

    const storageKey = `elmRoles_${requestDetails.employee_name}_${requestDetails.agency_name}`.replace(/[^a-zA-Z0-9]/g, '_');
    const savedData = localStorage.getItem(storageKey);

    console.log('🔍 Checking for saved ELM form data:', { storageKey, hasSavedData: !!savedData });

    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log('📥 Restoring saved ELM form data:', parsedData);

        Object.entries(parsedData).forEach(([key, value]) => {
          setValue(key as keyof ElmRoleSelection, value as any, { shouldDirty: false });
        });

        toast.success('Previous selections restored from draft');
      } catch (e) {
        console.error('Error parsing saved data:', e);
        localStorage.removeItem(storageKey);
      }
    } else {
      console.log('📡 No saved data found, fetching existing selections from Supabase');
      if (requestId) {
        fetchExistingSelections(requestId);
      }
    }
  }, [requestDetails, setValue, requestId, location.state]);

  
  async function fetchExistingSelections(id: string) {
    try {
      const { data, error } = await supabase
        .from('security_role_selections')
        .select('*')
        .eq('request_id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return;
      const mapped = mapSelectionsToForm(data);
      // Apply to form
      for (const [k, v] of Object.entries(mapped)) {
        // @ts-ignore
        setValue(k as keyof ElmRoleSelection, v as any, { shouldDirty: false });
      }
    } catch (e) {
      console.error('Failed to fetch existing ELM role selections:', e);
      toast.error('Failed to load previously saved ELM selections.');
    }
  }
// ---- core write helpers with retry on 22P02 ----
  async function upsertSelections(initialPayload: any) {
    // attempt 1
    let { error } = await supabase
      .from('security_role_selections')
      .upsert(initialPayload, { onConflict: 'request_id' });
    if (!error) return;

    // retry if array-format error
    if (isArrayFormatError(error)) {
      console.warn('Array format error; retrying with array-coerced fields...', error);
      const retryPayload = coerceArraysIfNeeded(initialPayload);
      const retry = await supabase
        .from('security_role_selections')
        .upsert(retryPayload, { onConflict: 'request_id' });
      if (!retry.error) return;
      throw retry.error;
    }
    throw error;
  }

  async function insertSelections(initialPayload: any) {
    // attempt 1
    let { error } = await supabase
      .from('security_role_selections')
      .insert(initialPayload);
    if (!error) return;

    // retry if array-format error
    if (isArrayFormatError(error)) {
      console.warn('Array format error; retrying with array-coerced fields (insert)...', error);
      const retryPayload = coerceArraysIfNeeded(initialPayload);
      const retry = await supabase.from('security_role_selections').insert(retryPayload);
      if (!retry.error) return;
      throw retry.error;
    }
    throw error;
  }

  const onSubmit = async (form: ElmRoleSelection) => {
    if (!hasSelectedRoles) {
      toast.error('Please select at least one ELM role.');
      return;
    }

    setSaving(true);
    try {
      if (isEditingCopiedRoles) {
        const pendingFormData = localStorage.getItem('pendingFormData');
        if (!pendingFormData) throw new Error('No pending form data found');

        const d: CopyFlowForm = JSON.parse(pendingFormData);
        const pocUser = localStorage.getItem('pocUserName');

        const requestPayload = {
          start_date: d.startDate,
          employee_name: d.employeeName,
          employee_id: d.employeeId || null,
          is_non_employee: !!d.isNonEmployee,
          work_location: d.workLocation || null,
          work_phone: d.workPhone ? d.workPhone.replace(/\D/g, '') : null,
          email: d.email,
          agency_name: d.agencyName,
          agency_code: d.agencyCode,
          justification: d.justification || null,
          submitter_name: d.submitterName,
          submitter_email: d.submitterEmail,
          supervisor_name: d.supervisorName,
          supervisor_email: d.supervisorUsername,
          security_admin_name: d.securityAdminName,
          security_admin_email: d.securityAdminUsername,
          status: 'pending',
          poc_user: pocUser,
        };

        const { data: newReq, error: requestError } = await supabase
          .from('security_role_requests')
          .insert(requestPayload)
          .select()
          .single();
        if (requestError) throw requestError;

        const { error: areasError } = await supabase.from('security_areas').insert({
          request_id: newReq.id,
          area_type: 'elm',
          director_name: d.elmKeyAdmin || null,
          director_email: d.elmKeyAdminUsername || null,
        });
        if (areasError) throw areasError;

        const selections = buildSelections(newReq.id, d.agencyCode, form);
        await insertSelections(selections);

        // Save to localStorage for future visits
        if (requestDetails) {
          const storageKey = `elmRoles_${requestDetails.employee_name}_${requestDetails.agency_name}`.replace(/[^a-zA-Z0-9]/g, '_');
          localStorage.setItem(storageKey, JSON.stringify(form));
          console.log('💾 Saving ELM form data for future visits:', { storageKey, form });
        }

        localStorage.removeItem('pendingFormData');
        localStorage.removeItem('editingCopiedRoles');
        localStorage.removeItem('copiedRoleSelections');
        localStorage.removeItem('copiedUserDetails');

        toast.success('ELM role selections saved successfully!');
        navigate('/success', { state: { requestId: newReq.id } });
      } else {
        if (!requestId) {
          toast.error('No request found. Please start from the main form.');
          navigate('/');
          return;
        }
        const selections = buildSelections(requestId, requestDetails?.agency_code, form);
        await upsertSelections(selections);

        // Save to localStorage for future visits
        if (requestDetails) {
          const storageKey = `elmRoles_${requestDetails.employee_name}_${requestDetails.agency_name}`.replace(/[^a-zA-Z0-9]/g, '_');
          localStorage.setItem(storageKey, JSON.stringify(form));
          console.log('💾 Saving ELM form data for future visits:', { storageKey, form });
        }

        toast.success('ELM role selections saved successfully!');
        navigate('/success', { state: { requestId } });
      }
    } catch (err: any) {
      console.error('ELM role save failed:', {
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        message: err?.message,
        err,
      });
      let msg = 'Failed to save ELM role selections. Please try again.';
      if (isArrayFormatError(err)) {
        msg =
          'A list field was sent in an unexpected format. This page now sends arrays (or null) to array columns. We retried automatically—if the error persists, please contact support.';
      } else if (err instanceof Error) {
        const m = err.message || '';
        if (m.includes('home_business_unit') && m.includes('not-null')) {
          msg =
            'Business Unit is required. Please ensure your agency information is properly configured.';
        } else if (m.includes('not-null constraint')) {
          msg = 'A required field is missing. Please check your entries.';
        } else if (m.includes('violates') && m.includes('constraint')) {
          msg = 'There was a data validation error. Please check your entries.';
        }
      }
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Enterprise Learning Management (ELM) Role Selection"
        subtitle="Select specific administrative roles and permissions for ELM access"
      />

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Main Form
            </Link>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Enterprise Learning Management (ELM) Role Selection
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Select specific administrative roles and permissions for ELM access
                  </p>
                  {requestDetails && (
                    <p className="mt-2 text-sm text-blue-600">
                      Request for: <strong>{requestDetails.employee_name}</strong> at{' '}
                      <strong>{requestDetails.agency_name}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
              {/* Copy Existing User Access Section */}
              {!isEditingCopiedRoles && requestId && (
                <div className="border-b border-gray-200 pb-6">
                  <button
                    type="button"
                    onClick={() => setShowCopySection(!showCopySection)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <div className="flex items-center">
                      <Copy className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="text-lg font-medium text-gray-900">
                        Copy Existing User Access (Optional)
                      </h3>
                    </div>
                    <span className="text-sm text-gray-500">
                      {showCopySection ? 'Hide' : 'Show'}
                    </span>
                  </button>

                  {showCopySection && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-4">
                        You can copy role selections from an existing user who has similar job responsibilities.
                        This will pre-populate the form with their current access permissions.
                      </p>
                      <UserSelect
                        selectedUser={selectedCopyUser}
                        onUserChange={setSelectedCopyUser}
                        currentUser={requestDetails?.employee_name}
                        currentRequestId={requestId}
                        formData={undefined}
                        onUserDetailsLoaded={handleUserDetailsLoaded}
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Descriptions of the Enterprise Learning Management Roles
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        The definitions provided below will help determine the Administrative access that
                        you will allow in your agencies. The Administrative roles do need to be
                        specifically requested.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  ELM Administrative Roles
                </h3>
                <p className="text-sm text-gray-600">
                  Select the ELM roles that match your job responsibilities. Each role provides specific
                  permissions and access levels.
                </p>

                <div className="grid grid-cols-1 gap-6">
                  {elmRoles.map(role => {
                    const IconComponent = role.icon;
                    const checked = !!selectedRoles?.[role.id as keyof ElmRoleSelection];
                    return (
                      <div
                        key={role.id}
                        className={`border rounded-lg p-4 ${
                          checked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              type="checkbox"
                              {...register(role.id as keyof ElmRoleSelection)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center">
                              <IconComponent
                                className={`h-5 w-5 mr-2 ${role.isHighRisk ? 'text-red-600' : 'text-blue-600'}`}
                              />
                              <label className="text-sm font-medium text-gray-900">
                                {role.title}
                                {role.isHighRisk && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    High-Level Access
                                  </span>
                                )}
                              </label>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">{role.description}</p>
                            {role.specialNote && (
                              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                <p className="text-xs text-yellow-800">
                                  <strong>Important:</strong> {role.specialNote}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {hasHighRiskRoles && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">High-Level Access Selected</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>
                            You have selected roles that provide extensive access to ELM. Additional
                            security review and approval may be required. Please ensure these roles are
                            necessary for your job responsibilities.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Justification</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role Justification*</label>
                  <textarea
                    {...register('roleJustification', {
                      required: 'Please provide justification for the requested ELM roles',
                    })}
                    rows={4}
                    placeholder="Please explain why these ELM administrative roles are necessary for your job responsibilities. Include specific tasks, responsibilities, and how these roles will be used..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.roleJustification && (
                    <p className="mt-1 text-sm text-red-600">{errors.roleJustification.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving || !hasSelectedRoles}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    saving || !hasSelectedRoles
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Submit ELM Role Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ElmRoleSelectionPage;
