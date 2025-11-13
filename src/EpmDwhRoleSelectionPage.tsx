// src/EpmDwhRoleSelectionPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Database, AlertTriangle, Copy } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { toast } from 'sonner';
import Header from './components/Header';
import UserSelect from './components/UserSelect';
import MultiSelect from './components/MultiSelect';
import { agencies, healthLicensingBoards, smartAgencies } from './lib/agencyData';

interface User {
  employee_name: string;
  employee_id: string;
  email: string;
  request_id?: string;
}

type Form = {
  // (we don't require user entry for these; we compute from request)
  homeBusinessUnit?: string;
  otherBusinessUnits?: string[]; // always send null from this page

  // Table 1 - Data Extracts
  dataExtracts?: boolean; // Data Extract (M_EPM_DATA_EXTRACTS)

  // Table 2 - General Warehouse Roles
  gwAgencyCode?: string[]; // Array of 3-character codes for agency-specific roles
  gwBasicReportDev?: boolean;        // Agency Specific Basic Report Developer
  gwAdvancedReportDev?: boolean;     // Agency Specific Advanced Report Developer
  gwDashboardDeveloper?: boolean;    // Agency Specific Dashboard Developer
  gwAgencyAdministrator?: boolean;   // Agency Specific Administrator

  // Table 3 - FMS (Accounting/Procurement)
  fmsLookup?: boolean;                   // M_EPM_FSCM_LOOKUP
  yearEndFinancialReporting?: boolean;   // Year-End Financial Reporting Data

  // Table 4 - ELM Warehouse
  elmWarehouseReport?: boolean;          // M_EPM_ELM_REPORT

  // Table 5 - HR/Payroll (SEMA4)
  hcmLookup?: boolean;                   // M_EPM_HCM_LOOKUP (req if any HR/Payroll roles)
  payrollFundingSalaryFte?: boolean;     // Payroll Funding Salary FTE
  payrollPaycheckInfo?: boolean;         // Payroll Paycheck Information
  hrPrivateByDepartment?: boolean;       // HR Private Data by Department
  payrollSelfServiceData?: boolean;      // Payroll Self Service (SS) Data
  hrStatewideData?: boolean;             // HR Statewide Data
  recruitingSolutionsData?: boolean;     // Recruiting Solutions (RS) Data
  laborDistribution?: boolean;           // Labor Distribution

  // NEW Table 6 - Restricted HR/Payroll Warehouse Roles
  ssnView?: boolean;                     // SSN View
  payrollDeductions?: boolean;           // Payroll Deductions
  hrDataExcludedEmployees?: boolean;     // HR Data for Excluded Employees

  // NEW Table 7 - Reporting & Planning System (RAPS)
  rapsBiAuthor?: boolean;                // BI Author (req for all RAPS users)
  rapsHcmLookup?: boolean;               // M_EPM_HCM_LOOKUP (req for all RAPS users)
  rapsLink?: boolean;                    // M_RAPS_LINK (includes private data)

  // Optional note
  roleJustification?: string;
};

const toSnake = (s: string) => s.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);

const strip2 = (k: string) => k.replace(/^[a-z]{2}_/, "");

export default function EpmDwhRoleSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { requestId?: string } };
  const { id: idParam } = useParams();

  const [saving, setSaving] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<{
    employee_name?: string;
    agency_name?: string;
    agency_code?: string;
  } | null>(null);
  const [isEditingCopiedRoles, setIsEditingCopiedRoles] = useState(false);
  const [showCopySection, setShowCopySection] = useState(false);
  const [selectedCopyUser, setSelectedCopyUser] = useState<User | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
  } = useForm<Form>({
    defaultValues: {
      dataExtracts: false,
      gwBasicReportDev: false,
      gwAdvancedReportDev: false,
      gwDashboardDeveloper: false,
      gwAgencyAdministrator: false,
      gwAgencyCode: [],

      fmsLookup: false,
      yearEndFinancialReporting: false,

      elmWarehouseReport: false,

      hcmLookup: false,
      payrollFundingSalaryFte: false,
      payrollPaycheckInfo: false,
      hrPrivateByDepartment: false,
      payrollSelfServiceData: false,
      hrStatewideData: false,
      recruitingSolutionsData: false,
      laborDistribution: false,

      // NEW tables defaults
      ssnView: false,
      payrollDeductions: false,
      hrDataExcludedEmployees: false,
      rapsBiAuthor: true,   // required for all RAPS users
      rapsHcmLookup: true,  // required for all RAPS users
      rapsLink: false
    }
  });

  const gwAgencyCode = watch('gwAgencyCode');

  // any selection?
  const hasAnyRole = useMemo(() => {
    const v = watch();
    return !!(
      v.dataExtracts ||
      v.gwBasicReportDev ||
      v.gwAdvancedReportDev ||
      v.gwDashboardDeveloper ||
      v.gwAgencyAdministrator ||
      v.fmsLookup ||
      v.yearEndFinancialReporting ||
      v.elmWarehouseReport ||
      v.hcmLookup ||
      v.payrollFundingSalaryFte ||
      v.payrollPaycheckInfo ||
      v.hrPrivateByDepartment ||
      v.payrollSelfServiceData ||
      v.hrStatewideData ||
      v.recruitingSolutionsData ||
      v.laborDistribution ||
      v.ssnView ||
      v.payrollDeductions ||
      v.hrDataExcludedEmployees ||
      v.rapsBiAuthor ||
      v.rapsHcmLookup ||
      v.rapsLink
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);

  // any HR/Payroll (Table 5) roles selected?
  const anyHrPayrollRoles = useMemo(() => {
    const v = watch();
    return !!(
      v.payrollFundingSalaryFte ||
      v.payrollPaycheckInfo ||
      v.hrPrivateByDepartment ||
      v.payrollSelfServiceData ||
      v.hrStatewideData ||
      v.recruitingSolutionsData ||
      v.laborDistribution
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

  // Simple form persistence - save form data when it changes
  useEffect(() => {
    if (!requestDetails) return;

    const timeoutId = setTimeout(() => {
      const formData = watch();
      if (Object.keys(formData).length === 0) return;

      const storageKey = `epmDwhRoles_${requestDetails.employee_name}_${requestDetails.agency_name}`.replace(/[^a-zA-Z0-9]/g, '_');
      localStorage.setItem(storageKey, JSON.stringify(formData));
      console.log('💾 Auto-saving EPM DWH form data:', { storageKey, formData });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watch(), requestDetails]);

  // Handler for when user details are loaded from UserSelect component
  const handleUserDetailsLoaded = (data: { userDetails: any; roleSelections: any; normalizedRoles: any }) => {
    console.log('📥 User details loaded for copy:', data);
    const { roleSelections } = data;

    if (roleSelections) {
      // Map database fields to form fields for EPM DWH roles
      const mappings: Record<string, keyof Form> = {
        data_extracts: 'dataExtracts',
        basic_report_dev: 'gwBasicReportDev',  // Fixed: removed gw_ prefix
        advanced_report_dev: 'gwAdvancedReportDev',  // Fixed: removed gw_ prefix
        dashboard_developer: 'gwDashboardDeveloper',  // Fixed: removed gw_ prefix
        agency_administrator: 'gwAgencyAdministrator',  // Fixed: removed gw_ prefix
        gw_agency_code: 'gwAgencyCode',
        fms_lookup: 'fmsLookup',
        year_end_financial_reporting: 'yearEndFinancialReporting',
        elm_warehouse_report: 'elmWarehouseReport',
        hcm_lookup: 'hcmLookup',
        payroll_funding_salary_fte: 'payrollFundingSalaryFte',
        payroll_paycheck_info: 'payrollPaycheckInfo',
        private_by_department: 'hrPrivateByDepartment',
        payroll_self_service_data: 'payrollSelfServiceData',
        statewide_data: 'hrStatewideData',
        recruiting_solutions_data: 'recruitingSolutionsData',
        labor_distribution: 'laborDistribution',
        ssn_view: 'ssnView',
        payroll_deductions: 'payrollDeductions',
        data_excluded_employees: 'hrDataExcludedEmployees',
        raps_bi_author: 'rapsBiAuthor',
        raps_hcm_lookup: 'rapsHcmLookup',
        raps_link: 'rapsLink',
        role_justification: 'roleJustification'
      };

      Object.entries(mappings).forEach(([dbField, formField]) => {
        if (roleSelections[dbField] !== undefined) {
          // Handle gw_agency_code specially - convert to array if needed
          if (dbField === 'gw_agency_code') {
            const value = roleSelections[dbField];
            if (Array.isArray(value)) {
              setValue(formField, value, { shouldDirty: true });
            } else if (typeof value === 'string' && value.trim()) {
              // Legacy single value - convert to array
              setValue(formField, [value], { shouldDirty: true });
            } else {
              setValue(formField, [], { shouldDirty: true });
            }
          } else {
            setValue(formField, roleSelections[dbField], { shouldDirty: true });
          }
        }
      });

      toast.success('Roles copied successfully! Review and modify as needed.');
    }
  };

  useEffect(() => {
    const isCopyFlow = localStorage.getItem('editingCopiedRoles') === 'true';

    if (isCopyFlow) {
      setIsEditingCopiedRoles(true);
      const pendingFormData = localStorage.getItem('pendingFormData');
      const copiedRoleSelections = localStorage.getItem('copiedRoleSelections');
      const copiedUserDetails = localStorage.getItem('copiedUserDetails');

      if (pendingFormData && copiedRoleSelections && copiedUserDetails) {
        try {
          const formData = JSON.parse(pendingFormData);
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
                setValue(key as keyof Form, value as any, { shouldDirty: false });
              } else if (typeof value === 'string' && value.trim()) {
                setValue(key as keyof Form, value as any, { shouldDirty: false });
              }
            });
          }
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
      const effectiveId = stateRequestId || idParam;
      
      if (!effectiveId) {
        toast.error('Please complete the main form first before selecting EPM Data Warehouse roles.');
        navigate('/');
        return;
      }
      
      setRequestId(effectiveId);
      fetchRequestDetails(effectiveId);
    }
  }, [location.state, navigate, idParam]);

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

    const storageKey = `epmDwhRoles_${requestDetails.employee_name}_${requestDetails.agency_name}`.replace(/[^a-zA-Z0-9]/g, '_');
    const savedData = localStorage.getItem(storageKey);

    console.log('🔍 Checking for saved EPM DWH form data:', { storageKey, hasSavedData: !!savedData });

    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log('📥 Restoring saved EPM DWH form data:', parsedData);

        Object.entries(parsedData).forEach(([key, value]) => {
          setValue(key as keyof Form, value as any, { shouldDirty: false });
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

  async function fetchRequestDetails(id: string) {
    try {
      const { data, error } = await supabase
        .from('security_role_requests')
        .select('employee_name, agency_name, agency_code')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error('Request not found. Please start from the main form.');
        navigate('/');
        return;
      }

      console.log('📋 Request details fetched:', data);
      setRequestDetails(data);

      if (data.agency_code) {
        setValue('homeBusinessUnit', data.agency_code);
        setValue('gwAgencyCode', [data.agency_code]);
      }
    } catch (err) {
      console.error('Error fetching request details:', err);
      toast.error('Failed to load request details. Redirecting to main form.');
      navigate('/');
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
      const mappings: Record<string, keyof Form> = {
        data_extracts: 'dataExtracts',
        basic_report_dev: 'gwBasicReportDev',  // Fixed: removed gw_ prefix
        advanced_report_dev: 'gwAdvancedReportDev',  // Fixed: removed gw_ prefix
        dashboard_developer: 'gwDashboardDeveloper',  // Fixed: removed gw_ prefix
        agency_administrator: 'gwAgencyAdministrator',  // Fixed: removed gw_ prefix
        gw_agency_code: 'gwAgencyCode',
        fms_lookup: 'fmsLookup',
        year_end_financial_reporting: 'yearEndFinancialReporting',
        elm_warehouse_report: 'elmWarehouseReport',
        hcm_lookup: 'hcmLookup',
        payroll_funding_salary_fte: 'payrollFundingSalaryFte',
        payroll_paycheck_info: 'payrollPaycheckInfo',
        private_by_department: 'hrPrivateByDepartment',
        payroll_self_service_data: 'payrollSelfServiceData',
        statewide_data: 'hrStatewideData',
        recruiting_solutions_data: 'recruitingSolutionsData',
        labor_distribution: 'laborDistribution',
        ssn_view: 'ssnView',
        payroll_deductions: 'payrollDeductions',
        data_excluded_employees: 'hrDataExcludedEmployees',
        raps_bi_author: 'rapsBiAuthor',
        raps_hcm_lookup: 'rapsHcmLookup',
        raps_link: 'rapsLink',
        role_justification: 'roleJustification'
      };

      Object.entries(mappings).forEach(([dbField, formField]) => {
        if (data[dbField] !== undefined) {
          // Handle gw_agency_code specially - convert to array if needed
          if (dbField === 'gw_agency_code') {
            const value = data[dbField];
            if (Array.isArray(value)) {
              setValue(formField, value, { shouldDirty: false });
            } else if (typeof value === 'string' && value.trim()) {
              // Legacy single value - convert to array
              setValue(formField, [value], { shouldDirty: false });
            } else {
              setValue(formField, [], { shouldDirty: false });
            }
          } else {
            setValue(formField, data[dbField], { shouldDirty: false });
          }
        }
      });
    } catch (e) {
      console.error('Failed to fetch existing EPM DWH role selections:', e);
    }
  }

  // Save flags defensively (ignore missing columns)
  const applyFlags = async (rid: string, form: Form) => {
    const flags: Record<string, any> = {};

    ([
      'dataExtracts',
      'gwBasicReportDev',
      'gwAdvancedReportDev',
      'gwDashboardDeveloper',
      'gwAgencyAdministrator',
      'fmsLookup',
      'yearEndFinancialReporting',
      'elmWarehouseReport',
      'hcmLookup',
      'payrollFundingSalaryFte',
      'payrollPaycheckInfo',
      'hrPrivateByDepartment',
      'payrollSelfServiceData',
      'hrStatewideData',
      'recruitingSolutionsData',
      'laborDistribution',
      // NEW tables
      'ssnView',
      'payrollDeductions',
      'hrDataExcludedEmployees',
      'rapsBiAuthor',
      'rapsHcmLookup',
      'rapsLink'
    ] as (keyof Form)[]).forEach(k => {
      if (form[k]) {
      const clean = strip2(toSnake(k as string));
      flags[clean] = true;
    }
    });

    if (form.gwAgencyCode && form.gwAgencyCode.length > 0) {
      flags['gw_agency_code'] = form.gwAgencyCode.map(code => code.trim().toUpperCase().slice(0, 3));
    }

    if (form.roleJustification && form.roleJustification.trim()) {
      flags['role_justification'] = form.roleJustification.trim();
    }

    if (Object.keys(flags).length === 0) return;

    const { error } = await supabase
      .from('security_role_selections')
      .update(flags)
      .eq('request_id', rid);

    if (error) {
      console.warn('One or more role columns are missing. Base row saved; flags best-effort.', error);
    }
  };

  const onSubmit = async (form: Form) => {
    if (!requestId) {
      toast.error('No request found. Please start from the main form.');
      navigate('/');
      return;
    }

    // Auto-add HCM_LOOKUP for Table 5 HR/Payroll roles
    if (anyHrPayrollRoles && !form.hcmLookup) {
      setValue('hcmLookup', true);
      form.hcmLookup = true;
      toast.info('M_EPM_HCM_LOOKUP has been added automatically (required for HR/Payroll data).');
    }

    setSaving(true);
    try {
      const homeBU = (form.homeBusinessUnit || requestDetails?.agency_code || '000')
        .padEnd(5, '0')
        .substring(0, 5);

      const baseRow = {
        request_id: requestId,
        home_business_unit: [homeBU],                   // TEXT[] expects an array
        other_business_units: null as string[] | null,  // send null or an array
        role_justification: form.roleJustification?.trim() || null
      };

      const { error: upsertErr } = await supabase
        .from('security_role_selections')
        .upsert(baseRow, { onConflict: 'request_id' });

      if (upsertErr) throw upsertErr;

      await applyFlags(requestId, form);

      // Save to localStorage for future visits
      if (requestDetails) {
        const storageKey = `epmDwhRoles_${requestDetails.employee_name}_${requestDetails.agency_name}`.replace(/[^a-zA-Z0-9]/g, '_');
        localStorage.setItem(storageKey, JSON.stringify(form));
        console.log('💾 Saving EPM DWH form data for future visits:', { storageKey, form });
      }

      toast.success('EPM Data Warehouse selections saved.');
      navigate('/success', { state: { requestId } });
    } catch (err: any) {
      console.error('EPM DWH save failed:', err);
      let msg = 'Failed to save EPM Data Warehouse selections. Please try again.';
      if (err?.code === '22P02') {
        msg = 'A list field was sent in an unexpected format. This page now sends arrays (or null) to array columns.';
      }
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="EPM Data Warehouse Role Selection"
        subtitle="Select roles and permissions for the EPM Data Warehouse"
      />

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
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
                <Database className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">EPM Data Warehouse Role Selection</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose the applicable data extracts and general or subject-area roles.
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
              {/* TABLE 1: DATA EXTRACTS */}
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-green-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        DATA EXTRACTS (from warehouse tables)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4">
                        <label className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            {...register('dataExtracts')}
                            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            <span className="font-medium">Data Extract</span>{' '}
                            <span className="text-gray-600">
                              (M_EPM_DATA_EXTRACTS) - staging tables only; not available in OBIEE
                            </span>
                          </span>
                        </label>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* TABLE 2: GENERAL WAREHOUSE ROLES */}
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-green-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        GENERAL WAREHOUSE ROLES
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        All users of the EPM Data Warehouse must be assigned one or more General Warehouse Roles.
                      </td>
                    </tr>

                    <tr>
                      <td className="px-6 py-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Agency Codes
                        </label>
                        <MultiSelect
                          options={[
                            ...agencies
                              .filter(a => a.code !== 'HLB' && a.code !== 'SMT')
                              .map(a => ({ value: a.code, label: `${a.name} (${a.code})` })),
                            ...healthLicensingBoards.map(b => ({ value: b.code, label: `${b.name} (${b.code})` })),
                            ...smartAgencies.map(s => ({ value: s.code, label: `${s.name} (${s.code})` }))
                          ]}
                          value={gwAgencyCode || []}
                          onChange={(selectedCodes) => setValue('gwAgencyCode', selectedCodes, { shouldDirty: true })}
                          placeholder="Select one or more agencies..."
                        />
                        <p className="mt-2 text-xs text-gray-500">
                          Select one or more agency codes for agency-specific roles.
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td className="px-6 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <label className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              {...register('gwBasicReportDev')}
                              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              <span className="font-medium">Agency Specific Basic Report Developer</span>
                            </span>
                          </label>

                          <label className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              {...register('gwAdvancedReportDev')}
                              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              <span className="font-medium">Agency Specific Advanced Report Developer</span>
                            </span>
                          </label>

                          <label className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              {...register('gwDashboardDeveloper')}
                              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                              <span className="text-sm text-gray-700">
                              <span className="font-medium">Agency Specific Dashboard Developer</span>
                            </span>
                          </label>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td className="px-6 py-4">
                        <label className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            {...register('gwAgencyAdministrator')}
                            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            <span className="font-medium">Agency Specific Administrator</span>{' '}
                            <span className="text-gray-600">
                              (M_EPM_XXX_AGY_ADMINISTRATOR + M_EPM_AGY_ADMINISTRATOR)
                            </span>
                          </span>
                        </label>
                      </td>
                    </tr>

                    <tr>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          <p className="mb-2">
                            * The agency code entered under General Warehouse Roles is used only to assign the
                            user to the appropriate agency dashboard in OBIEE. It does not affect access to
                            detail-level data in the warehouse. The user's chartfield security role
                            (M_FS_CF_SEC_xxxxxx) for the Financial Management System controls access to accounting
                            and procurement data in the EPM Data Warehouse. The user's row security permission
                            list (agency or department ID access) for SEMA4 controls access to SEMA4-related data
                            in the warehouse. A user cannot have access in the warehouse that is different from
                            access in the source FMS and SEMA4 systems.
                          </p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* TABLE 3: ACCESS TO ACCOUNTING/PROCUREMENT DATA (FMS) */}
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-green-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        ACCESS TO ACCOUNTING/PROCUREMENT DATA (COMES FROM FMS)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        There are no separate roles for financial and procurement data in the OBIEE
                        warehouse. Access is based on the Inquiry roles selected in the Accounting and
                        Procurement sections above.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('fmsLookup')}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            <span className="font-medium">M_EPM_FSCM_LOOKUP</span> (required if the user
                            will access FMS data in the warehouse)
                          </span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('yearEndFinancialReporting')}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Year-End Financial Reporting Data (staging tables only; not available in OBIEE)
                          </span>
                        </label>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* TABLE 4: ELM WAREHOUSE ROLES */}
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-green-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        ELM WAREHOUSE ROLES
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('elmWarehouseReport')}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            <span className="font-medium">M_EPM_ELM_REPORT</span>
                          </span>
                        </label>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* TABLE 5: ACCESS TO HR/PAYROLL DATA (SEMA4) */}
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-green-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        ACCESS TO HR/PAYROLL DATA (COMES FROM SEMA4)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('hcmLookup')}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            <span className="font-medium">M_EPM_HCM_LOOKUP</span> (required if any of the
                            HR/Payroll data roles are selected)
                          </span>
                        </label>
                      </td>
                    </tr>

                    <tr>
                      <td className="px-6 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('payrollFundingSalaryFte')}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              Payroll Funding Salary FTE (Salary Projections/FTE)
                            </span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('payrollPaycheckInfo')}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Payroll Paycheck Information</span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('hrPrivateByDepartment')}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">HR Private Data by Department</span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('payrollSelfServiceData')}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Payroll Self Service (SS) Data</span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('hrStatewideData')}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">HR Statewide Data</span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('recruitingSolutionsData')}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Recruiting Solutions (RS) Data</span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('laborDistribution')}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Labor Distribution</span>
                          </label>
                        </div>

                        {anyHrPayrollRoles && !watch('hcmLookup') && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                            <AlertTriangle className="inline h-4 w-4 mr-1" />
                            You selected HR/Payroll roles. <strong>M_EPM_HCM_LOOKUP</strong> is required and
                            will be added for you on submit.
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ===== NEW TABLE 6: RESTRICTED HR/PAYROLL WAREHOUSE ROLES (SEMA4) ===== */}
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-green-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        RESTRICTED HR/PAYROLL WAREHOUSE ROLES (DATA COMES FROM SEMA4)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        Because of the risks involved and the sensitive nature of the information, access to
                        SSN, Payroll Deductions, and excluded employee data is strictly limited. Payroll
                        Deductions information can disclose private benefit and tax data. Excluded employees
                        are undercover law enforcement officers and others for whom all employment information
                        is - by law - confidential. The role is applicable only to users in the very small number
                        of agencies that have such employees. When requesting one of these roles, the Human
                        Resources Director of the agency must attach a written statement explaining why the role
                        is essential to the user's job duties. The statement must also indicate why
                        warehouse reporting is necessary (i.e., why access to individual records in SEMA4 is
                        insufficient and the user requires broad warehouse reporting across many or all agency
                        employees) and - in the case of SSN - why identification of employees by name and employee
                        ID cannot meet the user's needs.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('ssnView')}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">SSN View</span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('payrollDeductions')}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Payroll Deductions</span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('hrDataExcludedEmployees')}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">HR Data for Excluded Employees</span>
                          </label>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ===== NEW TABLE 7: REPORTING AND PLANNING SYSTEM (RAPS) ===== */}
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-green-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        REPORTING AND PLANNING SYSTEM (RAPS; DATA COMES FROM SEMA4 VIA DATA WAREHOUSE)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        RAPS provides audit reports that help agencies verify the HR data entered into SEMA4
                        during a selected range of action dates.
                      </td>
                    </tr>

                    <tr>
                      <td className="px-6 py-4 space-y-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('rapsBiAuthor')}
                            disabled
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            <strong>BI Author</strong> (required for all RAPS users)
                          </span>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('rapsHcmLookup')}
                            disabled
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            <strong>M_EPM_HCM_LOOKUP</strong> (required for all RAPS users)
                          </span>
                        </div>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('rapsLink')}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            <strong>M_RAPS_LINK</strong> (includes private data)
                          </span>
                        </label>
                      </td>
                    </tr>

                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <p className="mb-0">
                          <strong>Agency/department access:</strong> If the user is already authorized for
                          SEMA4 Production or private HR/payroll data in OBIEE (e.g., the role HR Private Data
                          by Department), the user will have access to the same agency or department code(s)
                          in RAPS. If the user is new, ensure the needed SEMA4 agency or department code(s) are
                          provided to the RAPS team.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Notes / Justification */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Notes / Justification (optional)
                </label>
                <textarea
                  {...register('roleJustification')}
                  rows={3}
                  placeholder="Add any context for these EPM Data Warehouse selections (optional)"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {hasAnyRole ? 'At least one role selected.' : 'No roles selected yet.'}
                </div>
                <div className="flex space-x-3">
                  <Link
                    to="/"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      saving
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving…' : 'Submit EPM DWH Selections'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}