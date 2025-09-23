// src/SelectRolesPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, AlertTriangle, Users, Copy } from 'lucide-react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { toast } from 'sonner';
import { SecurityRoleSelection } from './types';
import Header from './components/Header';
import MultiSelect from './components/MultiSelect';
import UserSelect from './components/UserSelect';
import { businessUnits } from './lib/businessUnitData';

interface User {
  employee_name: string;
  employee_id: string;
  email: string;
  request_id?: string;
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
  accountingDirector?: string;
  accountingDirectorUsername?: string;
};

// Group roles by category for better organization
const rolesByCategory = accountingProcurementRoles.reduce((acc, role) => {
  if (!acc[role.category]) {
    acc[role.category] = [];
  }
  acc[role.category].push(role);
  return acc;
}, {} as Record<string, typeof accountingProcurementRoles>);

// Simple form persistence - save form data when it changes
const useFormPersistence = (requestDetails: any, watch: any) => {
  useEffect(() => {
    if (!requestDetails) return;

    const timeoutId = setTimeout(() => {
      const formData = watch();
      if (Object.keys(formData).length === 0) return;

      const storageKey = `selectRoles_${requestDetails.employee_name}_${requestDetails.agency_name}`.replace(/[^a-zA-Z0-9]/g, '_');
      localStorage.setItem(storageKey, JSON.stringify(formData));
      console.log('💾 Auto-saving Select Roles form data:', { storageKey, formData });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watch(), requestDetails]);
};

function SelectRolesPage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { requestId?: string } };
  const { id: idParam } = useParams();

  const [saving, setSaving] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<any>(null);
  const [loadingExistingData, setLoadingExistingData] = useState(false);
  const [availableBusinessUnits, setAvailableBusinessUnits] = useState<any[]>([]);
  const [hasExistingDbSelections, setHasExistingDbSelections] = useState(false);
  const [restoredFromLocalStorage, setRestoredFromLocalStorage] = useState(false);
  const [isEditingCopiedRoles, setIsEditingCopiedRoles] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const homeBusinessUnitRef = useRef<HTMLDivElement | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SecurityRoleSelection>({
    defaultValues: {
      homeBusinessUnit: '',
      otherBusinessUnits: '',
      voucherEntry: false,
      maintenanceVoucherBuildErrors: false,
      matchOverride: false,
      apInquiryOnly: false,
      apWorkflowApprover: false,
      cashMaintenance: false,
      receivableSpecialist: false,
      receivableSupervisor: false,
      billingCreate: false,
      billingSpecialist: false,
      billingSupervisor: false,
      customerMaintenanceSpecialist: false,
      arBillingSetup: false,
      arBillingInquiryOnly: false,
      cashManagementInquiryOnly: false,
      budgetJournalEntryOnline: false,
      budgetJournalLoad: false,
      journalApprover: false,
      budgetTransferEntryOnline: false,
      transferApprover: false,
      budgetInquiryOnly: false,
      journalEntryOnline: false,
      journalLoad: false,
      agencyChartfieldMaintenance: false,
      glAgencyApprover: false,
      generalLedgerInquiryOnly: false,
      nvisionReportingAgencyUser: false,
      awardDataEntry: false,
      grantFiscalManager: false,
      programManager: false,
      gmAgencySetup: false,
      grantsInquiryOnly: false,
      federalProjectInitiator: false,
      oimInitiator: false,
      projectInitiator: false,
      projectManager: false,
      capitalProgramsOffice: false,
      projectCostAccountant: false,
      projectFixedAsset: false,
      categorySubcategoryManager: false,
      projectControlDates: false,
      projectAccountingSystems: false,
      mndotProjectsInquiry: false,
      projectsInquiryOnly: false,
      mndotProjectApprover: false,
      costAllocationInquiryOnly: false,
      financialAccountantAssets: false,
      assetManagementInquiryOnly: false,
      physicalInventoryApproval1: false,
      physicalInventoryApproval2: false,
      inventoryExpressIssue: false,
      inventoryAdjustmentApprover: false,
      inventoryReplenishmentBuyer: false,
      inventoryControlWorker: false,
      inventoryExpressPutaway: false,
      inventoryFulfillmentSpecialist: false,
      inventoryPoReceiver: false,
      inventoryReturnsReceiver: false,
      inventoryCostAdjustment: false,
      inventoryMaterialsManager: false,
      inventoryDelivery: false,
      inventoryInquiryOnly: false,
      inventoryConfigurationAgency: false,
      inventoryPickPlanReportDistribution: false,
      poApprover: false,
      poApprover2: false,
      poApprover3: false,
      apVoucherApprover1: false,
      apVoucherApprover2: false,
      apVoucherApprover3: false,
      supervisorApproval: false,
    }
  });

  // Use form persistence hook
  useFormPersistence(requestDetails, watch);

  const selectedRoles = watch();
  const hasSelectedRoles = Object.values(selectedRoles).some(value => value === true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // --- mount flow -----------------------------------------------------------
  
  // On mount: prefer URL param for a stable ID; load DB first, then overlay local draft.
  useEffect(() => {
    (async () => {
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
            setRequestDetails({ 
              employee_name: formData.employeeName, 
              agency_name: formData.agencyName, 
              agency_code: formData.agencyCode 
            });
            
            // Map copied role data to form fields
            if (roleData) {
              Object.entries(roleData).forEach(([key, value]) => {
                if (typeof value === 'boolean' && value === true) {
                  setValue(key as keyof SecurityRoleSelection, value as any, { shouldDirty: false });
                } else if (typeof value === 'string' && value.trim()) {
                  setValue(key as keyof SecurityRoleSelection, value as any, { shouldDirty: false });
                }
              });
            }
            
            // Mark hydration as complete
            setTimeout(() => {
              isHydratingRef.current = false;
            }, 0);
            return;
          } catch (e) {
            console.error('Error loading copy-flow data:', e);
            toast.error('Error loading copied user data');
          }
        } else {
          localStorage.removeItem('editingCopiedRoles');
          toast.error('Copy flow data is incomplete. Please try again.');
          navigate('/');
          return;
        }
      }

      const stateRequestId = (location as any)?.state?.requestId;
      const effectiveId = stateRequestId || (idParam as string | null);

      if (!effectiveId) {
        toast.error('Please complete the main form first before selecting roles.');
        navigate('/');
        return;
      }

      setRequestId(effectiveId);
      await fetchRequestDetails(effectiveId);
      await fetchBusinessUnits();

      // Load existing DB data first
      setLoadingExistingData(true);
      const existingData = await fetchExistingSelections(effectiveId);
      if (existingData) {
        setHasExistingDbSelections(true);
        console.log('📋 Existing selections fetched from Supabase:', existingData);
        
        // Map database fields to form fields
        Object.entries(existingData).forEach(([key, value]) => {
          if (typeof value === 'boolean') {
            setValue(key as keyof SecurityRoleSelection, value as any, { shouldDirty: false });
          } else if (typeof value === 'string' && value.trim()) {
            setValue(key as keyof SecurityRoleSelection, value as any, { shouldDirty: false });
          }
        });
      }
      setLoadingExistingData(false);

      // Then overlay local draft if it exists
      const localData = getLocalDraft(effectiveId);
      if (localData) {
        setRestoredFromLocalStorage(true);
        console.log('📥 Restoring saved Select Roles form data:', localData);
        
        Object.entries(localData).forEach(([key, value]) => {
          setValue(key as keyof SecurityRoleSelection, value as any, { shouldDirty: false });
        });
        
        toast.success('Previous selections restored');
      }

      // Mark hydration as complete
      setTimeout(() => {
        isHydratingRef.current = false;
      }, 0);
    })();
  }, [location.state, navigate, idParam, setValue]);

  useEffect(() => {
    fetchBusinessUnits();
  }, []);

  async function fetchBusinessUnits() {
    try {
      const { data, error } = await supabase
        .from('agency_business_units')
        .select('business_unit_code, business_unit_name')
        .order('business_unit_name');

      if (error) throw error;
      setAvailableBusinessUnits(data || []);
    } catch (error) {
      console.error('Error fetching business units:', error);
      setAvailableBusinessUnits(businessUnits.map(bu => ({
        business_unit_code: bu.businessUnit,
        business_unit_name: bu.description
      })));
    }
  }

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

  async function fetchExistingSelections(id: string) {
    try {
      const { data, error } = await supabase
        .from('security_role_selections')
        .select('*')
        .eq('request_id', id)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return;

      console.log('📋 Existing selections fetched from Supabase:', data);
      
      // Map database fields to form fields
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          setValue(key as keyof SecurityRoleSelection, value as any, { shouldDirty: false });
        } else if (typeof value === 'string' && value.trim()) {
          setValue(key as keyof SecurityRoleSelection, value as any, { shouldDirty: false });
        }
      });
    } catch (e) {
      console.error('Failed to fetch existing role selections:', e);
    }
  }

  const onSubmit = async (data: SecurityRoleSelection) => {
    // Require at least one BU
    const homeVal: any = (data as any).homeBusinessUnit;
    if (!homeVal || (Array.isArray(homeVal) && homeVal.length === 0)) {
      setError('homeBusinessUnit' as any, {
        type: 'manual',
        message: 'Home Business Unit is required. Please select at least one business unit.',
      });
      toast.error('Please select at least one Home Business Unit.');
      homeBusinessUnitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Require at least one role selected
    const anyRole = Object.entries((data as any) || {}).some(
      ([, value]) => typeof value === 'boolean' && value === true
    );
    if (!anyRole) {
      toast.error('Please select at least one role.');
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
          email: d.email || 'placeholder@example.com',
          agency_name: d.agencyName,
          agency_code: d.agencyCode,
          justification: d.justification || null,
          submitter_name: d.submitterName || 'Unknown Submitter',
          submitter_email: d.submitterEmail || 'submitter@example.com',
          supervisor_name: d.supervisorName || 'Unknown Supervisor',
          supervisor_email: d.supervisorUsername || 'supervisor@example.com',
          security_admin_name: d.securityAdminName || 'Unknown Security Admin',
          security_admin_email: d.securityAdminUsername || 'security@example.com',
          status: 'pending',
          poc_user: pocUser,
        };

        const { data: newRequest, error: requestError } = await supabase
          .from('security_role_requests')
          .insert(requestPayload)
          .select()
          .single();

        if (requestError) throw requestError;

        const { error: areasError } = await supabase
          .from('security_areas')
          .insert({
            request_id: newRequest.id,
            area_type: 'accounting_procurement',
            director_name: d.accountingDirector || null,
            director_email: d.accountingDirectorUsername || null,
          });

        if (areasError) throw areasError;

        const rawPayload = buildRoleSelectionData(newRequest.id, data, {
          homeBusinessUnitIsArray: HOME_BU_IS_ARRAY,
        });

        const cleaned = coerceBooleansDeep(rawPayload);
        const normalized = normalizeRoleFlagsTrueOnly(cleaned);

        const { error: selectionsError } = await supabase
          .from('security_role_selections')
          .insert(normalized);

        if (selectionsError) throw selectionsError;

        localStorage.removeItem('pendingFormData');
        localStorage.removeItem('editingCopiedRoles');
        localStorage.removeItem('copiedRoleSelections');
        localStorage.removeItem('copiedUserDetails');

        toast.success('Role selections saved successfully!');
        navigate('/success', { state: { requestId: newRequest.id } });
      } else {
        if (!requestId) {
          toast.error('No request found. Please start from the main form.');
          navigate('/');
          return;
        }

        // Build payload with arrays parsed for TEXT[] columns
        const rawPayload = buildRoleSelectionData(requestId, data, {
          homeBusinessUnitIsArray: HOME_BU_IS_ARRAY,
        });

        // Coerce any sneaky "on"/["on","on"] values → booleans
        const cleaned = coerceBooleansDeep(rawPayload);
        const normalized = normalizeRoleFlagsTrueOnly(cleaned);

        const { error } = await supabase
          .from('security_role_selections')
          .upsert(normalized, { onConflict: 'request_id' });

        if (error) throw error;

        // ✅ Clear local draft on successful save
        try {
          localStorage.removeItem(draftKey(requestId));
        } catch {}

        toast.success('Role selections saved successfully!');
        navigate('/success', { state: { requestId } });
      }
    } catch (error: any) {
      console.error('Error saving role selections:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      toast.error(`Failed to save role selections: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUserChange = (user: User | null) => {
    setSelectedUser(user);
  };

  const ssTemplateRows = ['Business unit template', 'Department template', 'Personal template'];
  const ssActions = ['Create', 'Update', 'Delete'];

  const businessUnitOptions = availableBusinessUnits.map(unit => ({
    value: unit.business_unit_code,
    label: `${unit.business_unit_name} (${unit.business_unit_code})`
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Accounting / Procurement Role Selection"
        subtitle="Select specific roles and permissions for accounting and procurement access"
      />

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
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
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Accounting / Procurement Role Selection
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Select specific roles and permissions for accounting and procurement access
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
              {/* Copy User Section */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Copy className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-blue-800">
                      Copy Existing User Access (Optional)
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        You can copy role selections from an existing user who has similar job responsibilities.
                        This will pre-populate the form with their current access permissions.
                      </p>
                    </div>
                    <div className="mt-4">
                      <UserSelect
                        selectedUser={selectedUser}
                        onUserChange={handleUserChange}
                        formData={watch()}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Unit Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Business Unit Information</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Home Business Unit <span className="text-red-500">*</span>
                    </label>
                    <MultiSelect
                      options={businessUnitOptions}
                      value={watch('homeBusinessUnit') || []}
                      onChange={(values) => setValue('homeBusinessUnit', values)}
                      placeholder="Select business units..."
                      searchPlaceholder="Search business units..."
                      allowCustom={true}
                      ariaLabel="Home Business Unit selection"
                    />
                    {errors.homeBusinessUnit && (
                      <p className="mt-1 text-sm text-red-600">{errors.homeBusinessUnit.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Other Business Units
                    </label>
                    <textarea
                      {...register('otherBusinessUnits')}
                      rows={3}
                      placeholder="Enter additional business unit codes if needed..."
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Optional: List any additional business units that require access
                    </p>
                  </div>
                </div>
              </div>

              {/* Role Selection Tables */}
              {Object.entries(rolesByCategory).map(([category, roles]) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{category}</h3>
                  
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Technical Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {roles.map((role) => (
                          <tr key={role.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  {...register(role.id)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm font-medium text-gray-900">
                                  {role.formDescription}
                                </span>
                              </label>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                              {role.roleName}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {role.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {/* Role Justification */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Justification</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Role Justification <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('roleJustification', {
                      required: 'Please provide justification for the requested roles',
                    })}
                    rows={4}
                    placeholder="Please explain why these roles are necessary for your job responsibilities..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.roleJustification && (
                    <p className="mt-1 text-sm text-red-600">{errors.roleJustification.message}</p>
                  )}
                </div>
              </div>

              {/* Supervisor Approval */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Approval</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Supervisor Approval Required</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Your supervisor must approve this request before it can be processed. Please ensure
                          they are aware of this request and the roles you are requesting.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('supervisorApproval', {
                        required: 'Supervisor approval acknowledgment is required',
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      I acknowledge that my supervisor must approve this request
                    </span>
                  </label>
                  {errors.supervisorApproval && (
                    <p className="mt-1 text-sm text-red-600">{errors.supervisorApproval.message}</p>
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
                  {saving ? 'Saving...' : 'Submit Role Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelectRolesPage;