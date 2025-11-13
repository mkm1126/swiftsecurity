// src/HrPayrollRoleSelectionPage.tsx
// --- Patch notes ---
// - Fix stale hasSelectedRoles: now derived from watch() of each role checkbox.
// - Submit guard now re-checks using the submitted form values to avoid false negatives.
// - Payroll Components table now renders THREE columns matching HR layout.
// - Reminder: any checkbox not wired with register(...) and not listed in ROLE_FLAG_KEYS won't count.
// - FIXED: Added copy flow support to handle "Copy Roles" functionality
// -------------------

import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Users, AlertTriangle, Copy } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { toast } from 'sonner';
import Header from './components/Header';
import MultiSelect from './components/MultiSelect';
import UserSelect from './components/UserSelect';
import { agencies } from './lib/agencyData';
import type { User } from './components/UserSelect';

type AccessType = 'agency' | 'department';

interface HrPayrollRoleSelection {
  // access toggles
  addAccessType?: AccessType;
  agencyCodes?: string; // read only string view of selected agencies
  departmentId?: string;
  prohibitedDepartmentIds?: string;

  // optional BU fields
  homeBusinessUnit?: string;
  otherBusinessUnits?: string[]; // we keep this in react-hook-form, but send our own final array

  // HR checkboxes (subset shown in UI below)
  adminTestingAllCorrect?: boolean;
  adminTestingEnrollUpdate?: boolean;
  adminTestingViewOnly?: boolean;
  adminTestingCompanyPropertyCorrect?: boolean;

  emergencyContactUpdate?: boolean;
  emergencyContactView?: boolean;

  employmentDataUpdate?: boolean;

  generalDataCorrect?: boolean;
  generalDataUpdate?: boolean;
  generalDataView?: boolean;

  // Payroll
  adjustmentsRetroPayUpdate?: boolean;
  adjustmentsRetroPayView?: boolean;
  adjustmentsRetroPayViewInquire?: boolean;
  balancesPaycheckView?: boolean;
  businessExpenseUpdate?: boolean;
  businessExpenseView?: boolean;
  businessExpenseViewInquire?: boolean;
  directDepositUpdateCorrect?: boolean;
  directDepositView?: boolean;

  deptTblPayrollView?: boolean;
  expenseTransfersUpdate?: boolean;
  expenseTransfersView?: boolean;
  expenseTransfersViewInquire?: boolean;
  garnishmentView?: boolean;
  laborDistributionUpdate?: boolean;
  laborDistributionView?: boolean;
  leaveUpdate?: boolean;
  leaveView?: boolean;

  massTimeEntryUpdateCorrect?: boolean;
  massTimeEntryView?: boolean;
  payrollDataUpdateCorrect?: boolean;
  payrollDataView?: boolean;
  schedulesUpdate?: boolean;
  schedulesView?: boolean;
  selfServiceTimeEntryAdmin?: boolean;
  selfServiceTimeEntryView?: boolean;

  // Benefits
  adjustmentsBeneAdmBase?: boolean;
  adjustmentsBeneAdmAuto?: boolean;
  adjustmentsBeneBilling?: boolean;
  beneACAEligibilityUpdate?: boolean;
  mnStateCollegeBeneReports?: boolean;

  // Recruiting
  recruitRecruiter?: boolean;
  recruitRecruiterLimited?: boolean;
  recruitAffirmativeAction?: boolean;
  recruitHiringManager?: boolean;

  // HR middle/right column (newly wired)
  healthSafetyView?: boolean;
  jobDataCorrect?: boolean;
  jobDataUpdate?: boolean;
  jobDataView?: boolean;
  laborRelationsUpdate?: boolean;
  laborRelationsView?: boolean;
  manageCompetenciesUpdate?: boolean;
  manageCompetenciesView?: boolean;
  personalDataCorrect?: boolean;
  personalDataUpdate?: boolean;
  personalDataView?: boolean;
  physicalExamsUpdate?: boolean;
  physicalExamsView?: boolean;
  positionDataCorrect?: boolean;
  positionDataUpdate?: boolean;
  positionDataView?: boolean;
  positionFundingCorrect?: boolean;
  positionFundingUpdate?: boolean;
  positionFundingView?: boolean;
  // justification
  roleJustification: string;
}

// Copy flow form type for when copying from existing user
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
  hrDirector?: string;
  hrDirectorEmail?: string;
};

// list of checkbox keys we actually render, to persist as booleans
const ROLE_FLAG_KEYS: (keyof HrPayrollRoleSelection)[] = [
  // Administer Testing
  'adminTestingAllCorrect',
  'adminTestingEnrollUpdate',
  'adminTestingViewOnly',
  'adminTestingCompanyPropertyCorrect',

  // Emergency Contact
  'emergencyContactUpdate',
  'emergencyContactView',

  // Employment Data
  'employmentDataUpdate',

  // General Data
  'generalDataCorrect',
  'generalDataUpdate',
  'generalDataView',

  // Payroll left column
  'adjustmentsRetroPayUpdate',
  'adjustmentsRetroPayView',
  'adjustmentsRetroPayViewInquire',
  'balancesPaycheckView',
  'businessExpenseUpdate',
  'businessExpenseView',
  'businessExpenseViewInquire',
  'directDepositUpdateCorrect',
  'directDepositView',

  // Payroll middle column
  'deptTblPayrollView',
  'expenseTransfersUpdate',
  'expenseTransfersView',
  'expenseTransfersViewInquire',
  'garnishmentView',
  'laborDistributionUpdate',
  'laborDistributionView',
  'leaveUpdate',
  'leaveView',

  // Payroll right column
  'massTimeEntryUpdateCorrect',
  'massTimeEntryView',
  'payrollDataUpdateCorrect',
  'payrollDataView',
  'schedulesUpdate',
  'schedulesView',
  'selfServiceTimeEntryAdmin',
  'selfServiceTimeEntryView',

  // Benefits
  'adjustmentsBeneAdmBase',
  'adjustmentsBeneAdmAuto',
  'adjustmentsBeneBilling',
  'beneACAEligibilityUpdate',
  'mnStateCollegeBeneReports',

  // Recruiting
  'recruitRecruiter',
  'recruitRecruiterLimited',
  'recruitAffirmativeAction',
  'recruitHiringManager',

  // HR middle/right column (new)
  'healthSafetyView',
  'jobDataCorrect',
  'jobDataUpdate',
  'jobDataView',
  'laborRelationsUpdate',
  'laborRelationsView',
  'manageCompetenciesUpdate',
  'manageCompetenciesView',
  'personalDataCorrect',
  'personalDataUpdate',
  'personalDataView',
  'physicalExamsUpdate',
  'physicalExamsView',
  'positionDataCorrect',
  'positionDataUpdate',
  'positionDataView',
  'positionFundingCorrect',
  'positionFundingUpdate',
  'positionFundingView',
];

const toSnake = (s: string) => s.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);

// ADD: make array-or-CSV → string[] safe and boring
const normalizeCodes = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof v === 'string') {
    return v
      .split(/[,\n]/)                 // commas or new lines
      .flatMap(chunk => chunk.split(/\s+/)) // plus stray whitespace
      .map(s => s.trim())
      .filter(Boolean);
  }
  return [];
};

function HrPayrollRoleSelectionPage() {
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // agency multiselect local state. Do not pre-populate.
  const [selectedAgencyCodes, setSelectedAgencyCodes] = useState<string[]>([]);

  const handleUserChange = (user: User | null) => setSelectedUser(user);

  const handleUserDetailsLoaded = (data: { userDetails: any; roleSelections: any; normalizedRoles: any }) => {
    const { normalizedRoles } = data;

    console.log('📥 Auto-populating HR/Payroll form with copied user data:', normalizedRoles);
    toast.success('Form populated with selected user\'s access permissions');

    const toArray = (val: any): string[] => {
      if (Array.isArray(val)) return val.map(String).filter(Boolean);
      if (typeof val === 'string') {
        return val.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
      }
      return [];
    };

    if (normalizedRoles && typeof normalizedRoles === 'object') {
      for (const [key, value] of Object.entries(normalizedRoles)) {
        if (['id', 'created_at', 'updated_at', 'request_id'].includes(key)) continue;

        if (typeof value === 'boolean' && value === true) {
          setValue(key as keyof HrPayrollRoleSelection, true as any, { shouldDirty: true });
        }
        else if (typeof value === 'string' && value.trim()) {
          setValue(key as keyof HrPayrollRoleSelection, value as any, { shouldDirty: true });
        }
      }

      const homeBusinessUnit = normalizedRoles.homeBusinessUnit || normalizedRoles.home_business_unit;
      if (homeBusinessUnit) {
        const homeBusinessUnitStr = typeof homeBusinessUnit === 'string' ? homeBusinessUnit : String(homeBusinessUnit || '');
        setValue('homeBusinessUnit' as any, homeBusinessUnitStr, { shouldDirty: true });
      }

      if (normalizedRoles.otherBusinessUnits) {
        const otherBU = toArray(normalizedRoles.otherBusinessUnits);
        setValue('otherBusinessUnits' as any, otherBU, { shouldDirty: true });
      }

      if (normalizedRoles.agencyCodes) {
        const agencyCodes = toArray(normalizedRoles.agencyCodes);
        setSelectedAgencyCodes(agencyCodes);
      }
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<HrPayrollRoleSelection>({
    defaultValues: {
      addAccessType: undefined,
      otherBusinessUnits: [],
      roleJustification: '',
    },
  });

  const addAccessType = watch('addAccessType');
  const roleJustification = watch('roleJustification');

  // derived: at least one role checkbox selected (reactive)
  // Watch all role flags individually so this recomputes when any box changes
  const watchedFlags = ROLE_FLAG_KEYS.map(k => watch(k));
  const hasSelectedRoles = watchedFlags.some(Boolean);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Simple form persistence - save form data when it changes
  useEffect(() => {
    if (!requestDetails) return;

    const timeoutId = setTimeout(() => {
      const formData = watch();
      if (Object.keys(formData).length === 0) return;

      const storageKey = `hrPayrollRoles_${requestDetails.employee_name}_${requestDetails.agency_name}`.replace(/[^a-zA-Z0-9]/g, '_');
      localStorage.setItem(storageKey, JSON.stringify(formData));
      console.log('💾 Auto-saving HR/Payroll form data:', { storageKey, formData });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watch(), requestDetails]);

  useEffect(() => {
    const isCopyFlow = localStorage.getItem('editingCopiedRoles') === 'true';

    if (isCopyFlow) {
      setIsEditingCopiedRoles(true);
      const pendingFormData = localStorage.getItem('pendingFormData');
      const copiedRoleSelections = localStorage.getItem('copiedRoleSelections');
      const copiedUserDetails = localStorage.getItem('copiedUserDetails');

      if (pendingFormData && copiedRoleSelections && copiedUserDetails) {
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
            // Map database fields to form fields
            const mappings: Record<string, keyof HrPayrollRoleSelection> = {
              admin_testing_all_correct: 'adminTestingAllCorrect',
              admin_testing_enroll_update: 'adminTestingEnrollUpdate',
              admin_testing_view_only: 'adminTestingViewOnly',
              admin_testing_company_property_correct: 'adminTestingCompanyPropertyCorrect',
              emergency_contact_update: 'emergencyContactUpdate',
              emergency_contact_view: 'emergencyContactView',
              employment_data_update: 'employmentDataUpdate',
              general_data_correct: 'generalDataCorrect',
              general_data_update: 'generalDataUpdate',
              general_data_view: 'generalDataView',
              adjustments_retro_pay_update: 'adjustmentsRetroPayUpdate',
              adjustments_retro_pay_view: 'adjustmentsRetroPayView',
              adjustments_retro_pay_view_inquire: 'adjustmentsRetroPayViewInquire',
              balances_paycheck_view: 'balancesPaycheckView',
              business_expense_update: 'businessExpenseUpdate',
              business_expense_view: 'businessExpenseView',
              business_expense_view_inquire: 'businessExpenseViewInquire',
              direct_deposit_update_correct: 'directDepositUpdateCorrect',
              direct_deposit_view: 'directDepositView',
              dept_tbl_payroll_view: 'deptTblPayrollView',
              expense_transfers_update: 'expenseTransfersUpdate',
              expense_transfers_view: 'expenseTransfersView',
              expense_transfers_view_inquire: 'expenseTransfersViewInquire',
              garnishment_view: 'garnishmentView',
              labor_distribution_update: 'laborDistributionUpdate',
              labor_distribution_view: 'laborDistributionView',
              leave_update: 'leaveUpdate',
              leave_view: 'leaveView',
              mass_time_entry_update_correct: 'massTimeEntryUpdateCorrect',
              mass_time_entry_view: 'massTimeEntryView',
              payroll_data_update_correct: 'payrollDataUpdateCorrect',
              payroll_data_view: 'payrollDataView',
              schedules_update: 'schedulesUpdate',
              schedules_view: 'schedulesView',
              self_service_time_entry_admin: 'selfServiceTimeEntryAdmin',
              self_service_time_entry_view: 'selfServiceTimeEntryView',
              adjustments_bene_adm_base: 'adjustmentsBeneAdmBase',
              adjustments_bene_adm_auto: 'adjustmentsBeneAdmAuto',
              adjustments_bene_billing: 'adjustmentsBeneBilling',
              bene_aca_eligibility_update: 'beneACAEligibilityUpdate',
              mn_state_college_bene_reports: 'mnStateCollegeBeneReports',
              recruit_recruiter: 'recruitRecruiter',
              recruit_recruiter_limited: 'recruitRecruiterLimited',
              recruit_affirmative_action: 'recruitAffirmativeAction',
              recruit_hiring_manager: 'recruitHiringManager',
              health_safety_view: 'healthSafetyView',
              job_data_correct: 'jobDataCorrect',
              job_data_update: 'jobDataUpdate',
              job_data_view: 'jobDataView',
              labor_relations_update: 'laborRelationsUpdate',
              labor_relations_view: 'laborRelationsView',
              manage_competencies_update: 'manageCompetenciesUpdate',
              manage_competencies_view: 'manageCompetenciesView',
              personal_data_correct: 'personalDataCorrect',
              personal_data_update: 'personalDataUpdate',
              personal_data_view: 'personalDataView',
              physical_exams_update: 'physicalExamsUpdate',
              physical_exams_view: 'physicalExamsView',
              position_data_correct: 'positionDataCorrect',
              position_data_update: 'positionDataUpdate',
              position_data_view: 'positionDataView',
              position_funding_correct: 'positionFundingCorrect',
              position_funding_update: 'positionFundingUpdate',
              position_funding_view: 'positionFundingView',
              add_access_type: 'addAccessType',
              agency_codes: 'agencyCodes',
              department_id: 'departmentId',
              prohibited_department_ids: 'prohibitedDepartmentIds',
              role_justification: 'roleJustification'
            };

            Object.entries(mappings).forEach(([dbField, formField]) => {
              if (roleData[dbField] !== undefined) {
                setValue(formField, roleData[dbField], { shouldDirty: false });
              }
            });

            // Handle agency codes if present
            const fromArray = normalizeCodes(roleData.other_business_units);
            const fromCsv = normalizeCodes(roleData.agency_codes);
            const codes = fromArray.length ? fromArray : fromCsv;
            
            if (codes.length) {
              setSelectedAgencyCodes(codes);
              setValue('agencyCodes', codes.join(', '), { shouldDirty: false });
              setValue('otherBusinessUnits', codes, { shouldDirty: false });
              setValue('addAccessType', 'agency', { shouldDirty: false });
            }

            // Set role justification
            setValue('roleJustification', roleData.role_justification || '', { shouldDirty: false });
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
      return;
    }

    // Normal flow - not copying roles
    const stateRequestId = location.state?.requestId;
    const effectiveId = stateRequestId || idParam;
    if (effectiveId) {
      setRequestId(effectiveId);
      fetchRequestDetails(effectiveId);
    } else {
      toast.error('Please complete the main form first before selecting HR or Payroll roles.');
      navigate('/');
    }
  }, [location.state, navigate, idParam, setValue]);

  // Try to restore saved form data after request details are loaded
  useEffect(() => {
    if (!requestDetails || isEditingCopiedRoles) return;

    // Check if we should hydrate from database (e.g., from Edit Roles button)
    const shouldHydrateFromDb = location.state?.hydrateFromDb;

    if (shouldHydrateFromDb) {
      console.log('📡 Edit mode: Fetching existing selections from Supabase');
      if (requestId) {
        fetchExistingSelections(requestId);
      }
      return;
    }

    const storageKey = `hrPayrollRoles_${requestDetails.employee_name}_${requestDetails.agency_name}`.replace(/[^a-zA-Z0-9]/g, '_');
    const savedData = localStorage.getItem(storageKey);

    console.log('🔍 Checking for saved HR/Payroll form data:', { storageKey, hasSavedData: !!savedData });

    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log('📥 Restoring saved HR/Payroll form data:', parsedData);

        Object.entries(parsedData).forEach(([key, value]) => {
          setValue(key as keyof HrPayrollRoleSelection, value as any, { shouldDirty: false });
        });

        // ✅ ADD: hydrate MultiSelect + keep RHF in sync if "By Agency" was used
        const savedCodes = normalizeCodes(parsedData.otherBusinessUnits ?? parsedData.agencyCodes);
        const savedType  = parsedData.addAccessType as AccessType | undefined;

        if ((savedType ?? 'agency') === 'agency' && savedCodes.length) {
          setSelectedAgencyCodes(savedCodes);
          setValue('agencyCodes', savedCodes.join(', '), { shouldDirty: false });
          setValue('otherBusinessUnits', savedCodes, { shouldDirty: false });
          setValue('addAccessType', 'agency', { shouldDirty: false });
        }

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
  }, [requestDetails, setValue, requestId, isEditingCopiedRoles, location.state]);

  // Load minimal request details, but do not auto-select agencies in the UI
  const fetchRequestDetails = async (id: string) => {
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

      setRequestDetails(data);

      // if you keep a hidden Home BU field, reflect the agency code there for default padding, but do not touch the MultiSelect
      if (data.agency_code) {
        setValue('homeBusinessUnit', data.agency_code);
      }
    } catch (err) {
      console.error('Error fetching request details:', err);
      toast.error('Failed to load request details. Redirecting to main form.');
      navigate('/');
    }
  };

  async function fetchExistingSelections(id: string) {
    try {
      const { data, error } = await supabase
        .from('security_role_selections')
        .select('*')
        .eq('request_id', id)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return;

      console.log('📋 Existing HR/Payroll selections fetched from Supabase:', data);
      
      // Map database fields to form fields
      const mappings: Record<string, keyof HrPayrollRoleSelection> = {
        admin_testing_all_correct: 'adminTestingAllCorrect',
        admin_testing_enroll_update: 'adminTestingEnrollUpdate',
        admin_testing_view_only: 'adminTestingViewOnly',
        admin_testing_company_property_correct: 'adminTestingCompanyPropertyCorrect',
        emergency_contact_update: 'emergencyContactUpdate',
        emergency_contact_view: 'emergencyContactView',
        employment_data_update: 'employmentDataUpdate',
        general_data_correct: 'generalDataCorrect',
        general_data_update: 'generalDataUpdate',
        general_data_view: 'generalDataView',
        adjustments_retro_pay_update: 'adjustmentsRetroPayUpdate',
        adjustments_retro_pay_view: 'adjustmentsRetroPayView',
        adjustments_retro_pay_view_inquire: 'adjustmentsRetroPayViewInquire',
        balances_paycheck_view: 'balancesPaycheckView',
        business_expense_update: 'businessExpenseUpdate',
        business_expense_view: 'businessExpenseView',
        business_expense_view_inquire: 'businessExpenseViewInquire',
        direct_deposit_update_correct: 'directDepositUpdateCorrect',
        direct_deposit_view: 'directDepositView',
        dept_tbl_payroll_view: 'deptTblPayrollView',
        expense_transfers_update: 'expenseTransfersUpdate',
        expense_transfers_view: 'expenseTransfersView',
        expense_transfers_view_inquire: 'expenseTransfersViewInquire',
        garnishment_view: 'garnishmentView',
        labor_distribution_update: 'laborDistributionUpdate',
        labor_distribution_view: 'laborDistributionView',
        leave_update: 'leaveUpdate',
        leave_view: 'leaveView',
        mass_time_entry_update_correct: 'massTimeEntryUpdateCorrect',
        mass_time_entry_view: 'massTimeEntryView',
        payroll_data_update_correct: 'payrollDataUpdateCorrect',
        payroll_data_view: 'payrollDataView',
        schedules_update: 'schedulesUpdate',
        schedules_view: 'schedulesView',
        self_service_time_entry_admin: 'selfServiceTimeEntryAdmin',
        self_service_time_entry_view: 'selfServiceTimeEntryView',
        adjustments_bene_adm_base: 'adjustmentsBeneAdmBase',
        adjustments_bene_adm_auto: 'adjustmentsBeneAdmAuto',
        adjustments_bene_billing: 'adjustmentsBeneBilling',
        bene_aca_eligibility_update: 'beneACAEligibilityUpdate',
        mn_state_college_bene_reports: 'mnStateCollegeBeneReports',
        recruit_recruiter: 'recruitRecruiter',
        recruit_recruiter_limited: 'recruitRecruiterLimited',
        recruit_affirmative_action: 'recruitAffirmativeAction',
        recruit_hiring_manager: 'recruitHiringManager',
        health_safety_view: 'healthSafetyView',
        job_data_correct: 'jobDataCorrect',
        job_data_update: 'jobDataUpdate',
        job_data_view: 'jobDataView',
        labor_relations_update: 'laborRelationsUpdate',
        labor_relations_view: 'laborRelationsView',
        manage_competencies_update: 'manageCompetenciesUpdate',
        manage_competencies_view: 'manageCompetenciesView',
        personal_data_correct: 'personalDataCorrect',
        personal_data_update: 'personalDataUpdate',
        personal_data_view: 'personalDataView',
        physical_exams_update: 'physicalExamsUpdate',
        physical_exams_view: 'physicalExamsView',
        position_data_correct: 'positionDataCorrect',
        position_data_update: 'positionDataUpdate',
        position_data_view: 'positionDataView',
        position_funding_correct: 'positionFundingCorrect',
        position_funding_update: 'positionFundingUpdate',
        position_funding_view: 'positionFundingView',
        add_access_type: 'addAccessType',
        agency_codes: 'agencyCodes',
        department_id: 'departmentId',
        prohibited_department_ids: 'prohibitedDepartmentIds',
        role_justification: 'roleJustification'
      };

      Object.entries(mappings).forEach(([dbField, formField]) => {
        if ((data as any)[dbField] !== undefined) {
          setValue(formField, (data as any)[dbField], { shouldDirty: false });
        }
      });

      // ADD: hydrate MultiSelect from DB (prefer array, fall back to CSV)
      const fromArray = normalizeCodes((data as any).other_business_units);
      const fromCsv   = normalizeCodes((data as any).agency_codes);
      const codes     = fromArray.length ? fromArray : fromCsv;
      
      if (codes.length) {
        setSelectedAgencyCodes(codes);
        setValue('agencyCodes', codes.join(', '), { shouldDirty: false });
        setValue('otherBusinessUnits', codes, { shouldDirty: false });
      
        // If no stored type but we have codes, assume agency access
        const storedType = (data as any).add_access_type as AccessType | undefined;
        if (!storedType) setValue('addAccessType', 'agency', { shouldDirty: false });
      }
            
    } catch (e) {
      console.error('Failed to fetch existing HR/Payroll role selections:', e);
    }
  }

  const handleAgencyCodesChange = (codes: string[]) => {
    // visible read-only string for convenience
    setValue('agencyCodes', codes.join(', '));
    setSelectedAgencyCodes(codes);
    if (addAccessType === 'agency') {
      setValue('otherBusinessUnits', codes);
    }
  };

  // ADD: if "By Agency" is selected, keep form values tied to local state
  useEffect(() => {
    if (addAccessType === 'agency') {
      setValue('otherBusinessUnits', selectedAgencyCodes, { shouldDirty: true });
      setValue('agencyCodes', selectedAgencyCodes.join(', '), { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addAccessType, selectedAgencyCodes]);  

  // HR high risk banner example. You can wire this to actual flags you consider high risk.
  const hasHighRiskRoles = false;

  // Try to apply role flags after base upsert. If some columns do not exist, keep going.
  const applyRoleFlags = async (rid: string, form: HrPayrollRoleSelection) => {
    const flags: Record<string, any> = {};
    for (const key of ROLE_FLAG_KEYS) {
      if ((form as any)[key]) {
        const snakeKey = toSnake(key as string);
        flags[snakeKey] = true;
      }
    }

    if (form.addAccessType) {
      flags['add_access_type'] = form.addAccessType;
    }

    // prefer agencyCodes; else derive from otherBusinessUnits
    const agencyCodesCsv =
      (form.agencyCodes && form.agencyCodes.trim())
        ? form.agencyCodes.trim()
        : (form.otherBusinessUnits?.length ? form.otherBusinessUnits.join(', ') : '');
    
    if (agencyCodesCsv) {
      flags['agency_codes'] = agencyCodesCsv;
    }

    if (form.departmentId && form.departmentId.trim()) {
      flags['department_id'] = form.departmentId.trim();
    }

    if (form.prohibitedDepartmentIds && form.prohibitedDepartmentIds.trim()) {
      flags['prohibited_department_ids'] = form.prohibitedDepartmentIds.trim();
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

  const onSubmit = async (form: HrPayrollRoleSelection) => {
    // Re-check using the submitted form values to avoid false negatives
    const actuallyHasRoles = ROLE_FLAG_KEYS.some(key => !!(form as any)[key]);
    if (!actuallyHasRoles) {
      toast.error('Please select at least one HR/Payroll role.');
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
          area_type: 'hr_payroll',
          director_name: d.hrDirector || null,
          director_email: d.hrDirectorEmail || null,
        });
        if (areasError) throw areasError;

        const homeBU = (form.homeBusinessUnit || d.agencyCode || '000')
          .padEnd(5, '0')
          .substring(0, 5);

        const baseRow = {
          request_id: newReq.id,
          home_business_unit: [homeBU],
          other_business_units: form.otherBusinessUnits?.length ? form.otherBusinessUnits : null,
          role_justification: form.roleJustification?.trim() || null,
        };

        const { error: upsertErr } = await supabase
          .from('security_role_selections')
          .upsert(baseRow, { onConflict: 'request_id' });

        if (upsertErr) throw upsertErr;

        await applyRoleFlags(newReq.id, form);

        // Save to localStorage for future visits
        if (requestDetails) {
          const storageKey = `hrPayrollRoles_${requestDetails.employee_name}_${requestDetails.agency_name}`.replace(/[^a-zA-Z0-9]/g, '_');
          localStorage.setItem(storageKey, JSON.stringify(form));
          console.log('💾 Saving HR/Payroll form data for future visits:', { storageKey, form });
        }

        localStorage.removeItem('pendingFormData');
        localStorage.removeItem('editingCopiedRoles');
        localStorage.removeItem('copiedRoleSelections');
        localStorage.removeItem('copiedUserDetails');

        toast.success('HR/Payroll role selections saved successfully!');
        navigate('/success', { state: { requestId: newReq.id } });
      } else {
        if (!requestId) {
          toast.error('No request found. Please start from the main form.');
          navigate('/');
          return;
        }

        const homeBU = (form.homeBusinessUnit || requestDetails?.agency_code || '000')
          .padEnd(5, '0')
          .substring(0, 5);

        const baseRow = {
          request_id: requestId,
          home_business_unit: [homeBU],
          other_business_units: form.otherBusinessUnits?.length ? form.otherBusinessUnits : null,
          role_justification: form.roleJustification?.trim() || null,
        };

        const { error: upsertErr } = await supabase
          .from('security_role_selections')
          .upsert(baseRow, { onConflict: 'request_id' });

        if (upsertErr) throw upsertErr;

        await applyRoleFlags(requestId, form);

        // Save to localStorage for future visits
        if (requestDetails) {
          const storageKey = `hrPayrollRoles_${requestDetails.employee_name}_${requestDetails.agency_name}`.replace(/[^a-zA-Z0-9]/g, '_');
          localStorage.setItem(storageKey, JSON.stringify(form));
          console.log('💾 Saving HR/Payroll form data for future visits:', { storageKey, form });
        }

        toast.success('HR/Payroll role selections saved.');
        navigate('/success', { state: { requestId } });
      }
    } catch (err: any) {
      console.error('HR/Payroll save failed:', err);
      toast.error('Failed to save HR/Payroll role selections. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="HR / Payroll Role Selection"
        subtitle="Select specific roles and permissions for HR and Payroll access"
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
                  <h2 className="text-2xl font-bold text-gray-900">HR / Payroll Role Selection</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Select specific roles and permissions for HR and Payroll system access
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
                        onUserDetailsLoaded={handleUserDetailsLoaded}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Agency / Department ID Access */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Agency / Department ID Access
                </h3>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Add Access</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        You may grant access to all employees within an agency or limit access to specific
                        Department IDs. Selecting neither is allowed.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* By Agency */}
                  <div>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        {...register('addAccessType')}
                        value="agency"
                        className="border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">By Agency</span>
                    </label>
                    <p className="ml-6 mt-1 text-sm text-gray-500">
                      Select one or more agencies to allow access to all employees within those agencies.
                    </p>

                    {addAccessType === 'agency' && (
                      <div className="ml-6 mt-2 space-y-3">
                        <MultiSelect
                          options={agencies.map(a => ({
                            value: a.code,
                            label: `${a.name} (${a.code})`,
                          }))}
                          value={selectedAgencyCodes}
                          onChange={handleAgencyCodesChange}
                          placeholder="Select agencies..."
                          searchPlaceholder="Search agencies..."
                          label="Select Agencies"
                          required={addAccessType === 'agency'}
                          error={errors.agencyCodes?.message}
                        />

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Agency Codes
                          </label>
                          <input
                            type="text"
                            value={selectedAgencyCodes.join(', ')}
                            readOnly
                            className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Selected agency codes will appear here"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-center text-sm font-medium text-gray-500">OR</div>

                  {/* By Department */}
                  <div>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        {...register('addAccessType')}
                        value="department"
                        className="border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">By Department ID</span>
                    </label>
                    <p className="ml-6 mt-1 text-sm text-gray-500">
                      List the Department ID highest in your structure that the user will access. The user
                      will have access to that Department ID and all those reporting to it.
                    </p>

                    {addAccessType === 'department' && (
                      <div className="ml-6 mt-2 space-y-3">
                        <input
                          type="text"
                          {...register('departmentId')}
                          placeholder="Enter Department ID"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            To prohibit access to individual lower level Department IDs included above, list each ID here.
                          </label>
                          <input
                            type="text"
                            {...register('prohibitedDepartmentIds')}
                            placeholder="Enter prohibited Department IDs, comma separated"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Human Resources Components */}
              <div id="human-resources" className="space-y-6">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead style={{ backgroundColor: '#003865' }}>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Human Resources Components
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"></th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"></th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="bg-yellow-50">
                        <td colSpan={3} className="px-4 py-3 text-sm text-gray-700">
                          * Requires agency or department ID code. <br />
                          ** Only assign to users with non managerial job codes. No agency or department ID codes required. User ID for this role is the employee ID number.
                        </td>
                      </tr>

                      <tr>
                        {/* Column 1 */}
                        <td className="px-4 py-3 align-top">
                          <div className="space-y-6">
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Administer Testing</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('adminTestingAllCorrect')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">All Correct</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('adminTestingEnrollUpdate')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Enroll Update</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('adminTestingViewOnly')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View only</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('adminTestingCompanyPropertyCorrect')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Company Property Table Correct</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Emergency Contact</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('emergencyContactUpdate')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Update</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('emergencyContactView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Employment Data</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('employmentDataUpdate')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Update</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-bold text-sm text-gray-900">General Data</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('generalDataCorrect')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Correct</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('generalDataUpdate')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Update</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('generalDataView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Column 2 */}
                        <td className="px-4 py-3 align-top">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Health and Safety</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('healthSafetyView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Job Data*</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('jobDataCorrect')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Correct*</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('jobDataUpdate')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Update*</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('jobDataView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Labor Relations</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('laborRelationsUpdate')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Update</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('laborRelationsView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Manage Competencies</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('manageCompetenciesUpdate')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Update</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('manageCompetenciesView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Column 3 */}
                        <td className="px-4 py-3 align-top">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Personal Data*</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('personalDataCorrect')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Correct*</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('personalDataUpdate')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Update*</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('personalDataView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Physical Exams</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('physicalExamsUpdate')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Update</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('physicalExamsView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Position Data</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('positionDataCorrect')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Correct</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('positionDataUpdate')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Update</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('positionDataView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Position Funding</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('positionFundingCorrect')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Correct</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('positionFundingUpdate')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Update</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('positionFundingView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payroll Components */}
              <div className="space-y-6">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead style={{ backgroundColor: '#003865' }}>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Payroll Components
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"></th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="bg-yellow-50">
                        <td colSpan={3} className="px-4 py-3 text-sm text-gray-700">
                          * Requires agency or department ID code. <br />
                          ** Only assign to users with non managerial job codes. No agency or department ID codes required. User ID is the employee ID number.
                        </td>
                      </tr>
                      <tr>
                        {/* Left column */}
                        <td className="px-4 py-3 align-top">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Adjustments or RetroPay*</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('adjustmentsRetroPayUpdate')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Update*</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('adjustmentsRetroPayView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('adjustmentsRetroPayViewInquire')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View Inquire only</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('balancesPaycheckView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Balances or Paycheck View only</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Business Expense*</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('businessExpenseUpdate')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Update*</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('businessExpenseView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('businessExpenseViewInquire')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View Inquire only</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Direct Deposit*</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('directDepositUpdateCorrect')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Update or Correct*</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('directDepositView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Middle column */}
                        <td className="px-4 py-3 align-top">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">DeptTbl Payroll Access</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('deptTblPayrollView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View only</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Expense Transfers</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('expenseTransfersUpdate')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Update</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('expenseTransfersView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('expenseTransfersViewInquire')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View Inquire only</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('garnishmentView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Garnishment View only</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Labor Distribution</h4>
                              <div className="flex space-x-4 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('laborDistributionUpdate')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Update</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('laborDistributionView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Leave</h4>
                              <div className="flex space-x-4 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('leaveUpdate')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Update</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('leaveView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Right column */}
                        <td className="px-4 py-3 align-top">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Mass Time Entry*</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('massTimeEntryUpdateCorrect')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Update or Correct*</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('massTimeEntryView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Payroll Data</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('payrollDataUpdateCorrect')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Update or Correct</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('payrollDataView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Schedules</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('schedulesUpdate')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Update</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('schedulesView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Self Service Time Entry</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('selfServiceTimeEntryAdmin')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Administrator, Update</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('selfServiceTimeEntryView')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Benefits Components */}
              <div className="space-y-6">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead style={{ backgroundColor: '#003865' }}>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Benefits Components
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"></th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3 align-top">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">All Benefits Pages</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('adjustmentsBeneAdmBase')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Administrator Base Benefits</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('adjustmentsBeneAdmAuto')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Administrator Automated Benefits</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('adjustmentsBeneBilling')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Administrator Benefits Billings</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Benefits ACA Eligibility</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('beneACAEligibilityUpdate')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Update or Correct</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">MN State Universities and Colleges Only</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input type="checkbox" {...register('mnStateCollegeBeneReports')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">Benefits Reports</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recruiting Solutions */}
              <div className="space-y-6">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead style={{ backgroundColor: '#003865' }}>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Recruiting Solutions
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"></th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="bg-yellow-50">
                        <td colSpan={3} className="px-4 py-3 text-sm text-gray-700">
                          * Requires agency or department ID code. <br />
                          ** Only assign to users with non managerial job codes. No agency or department ID codes required. User ID is the employee ID number.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 align-top">
                          <div className="space-y-4">
                            <div className="space-y-1 mt-1">
                              <label className="flex items-center">
                                <input type="checkbox" {...register('recruitRecruiter')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <span className="ml-2 text-sm text-gray-700">Recruiter*</span>
                              </label>
                              <label className="flex items-center">
                                <input type="checkbox" {...register('recruitRecruiterLimited')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <span className="ml-2 text-sm text-gray-700">Recruiter Limited*</span>
                              </label>
                              <label className="flex items-center">
                                <input type="checkbox" {...register('recruitAffirmativeAction')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <span className="ml-2 text-sm text-gray-700">Affirmative Action Officer*</span>
                              </label>
                              <label className="flex items-center">
                                <input type="checkbox" {...register('recruitHiringManager')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <span className="ml-2 text-sm text-gray-700">Hiring Manager Proxy**</span>
                              </label>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top"></td>
                        <td className="px-4 py-3 align-top"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Role Justification */}
              <div id="justification" className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Role Justification</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provide justification for the selected HR or Payroll roles <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('roleJustification', {
                      required: 'Role justification is required',
                    })}
                    rows={4}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Explain why these roles are needed for this user's job responsibilities"
                  />
                  {errors.roleJustification && (
                    <p className="mt-1 text-sm text-red-600">{errors.roleJustification.message}</p>
                  )}
                </div>
              </div>

              {/* High Risk Warning */}
              {hasHighRiskRoles && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">High Risk Roles Selected</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>
                          You selected roles that provide elevated access to sensitive HR or Payroll data.
                          These selections will receive additional review from HR leadership.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end space-x-3">
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}   // ⟵ remove the hasSelectedRoles gate
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    saving
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Submit HR or Payroll Role Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HrPayrollRoleSelectionPage;