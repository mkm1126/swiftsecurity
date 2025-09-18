import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { isAfter, startOfToday } from 'date-fns';
import { ClipboardList, AlertCircle, ArrowLeft, Save } from 'lucide-react';
import { SecurityRoleRequest } from './types';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { toast } from 'sonner';
import Header from './components/Header';
import AgencySelect from './components/AgencySelect';

async function copyExistingUserRoles(newRequestId: string, copyFromEmployeeId: string) {
  try {
    console.log('Looking for existing user with employee ID:', copyFromEmployeeId);
    
    // Find the most recent completed request for the user we want to copy from
    const { data: existingRequest, error: requestError } = await supabase
      .from('security_role_requests')
      .select('id')
      .eq('employee_id', copyFromEmployeeId)
      .eq('status', 'completed') // Only copy from completed requests
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (requestError) {
      console.error('Error finding existing request:', requestError);
      return;
    }

    if (!existingRequest) {
      console.log('No completed request found for employee ID:', copyFromEmployeeId);
      return;
    }

    console.log('Found existing request to copy from:', existingRequest.id);

    // Get the role selections from the existing user
    const { data: existingRoles, error: rolesError } = await supabase
      .from('security_role_selections')
      .select('*')
      .eq('request_id', existingRequest.id)
      .maybeSingle();

    if (rolesError) {
      console.error('Error fetching existing roles:', rolesError);
      return;
    }

    if (!existingRoles) {
      console.log('No role selections found for existing request');
      return;
    }

    console.log('Found existing roles to copy:', existingRoles);

    // Delete existing role selections for this request first
    await supabase
      .from('security_role_selections')
      .delete()
      .eq('request_id', newRequestId);

    // Create a copy of the role selections for the new request
    const newRoleSelections = {
      ...existingRoles,
      id: undefined, // Remove the ID so a new one is generated
      request_id: newRequestId, // Set to the new request ID
      created_at: undefined, // Let the database set the timestamp
      updated_at: undefined,
      role_justification: existingRoles.role_justification || 'Copied from existing user access'
    };

    // Insert the copied role selections
    const { error: insertError } = await supabase
      .from('security_role_selections')
      .insert(newRoleSelections);

    if (insertError) {
      console.error('Error copying role selections:', insertError);
      return;
    }

    console.log('Successfully copied role selections to new request');

  } catch (error) {
    console.error('Error in copyExistingUserRoles:', error);
  }
}

interface SecurityArea {
  area_type: string;
  director_name: string | null;
  director_email: string | null;
}

interface CopyUserDetails {
  copy_user_name: string;
  copy_user_employee_id: string;
  copy_user_sema4_id: string | null;
}

interface RequestData {
  id: string;
  start_date: string;
  employee_name: string;
  employee_id: string | null;
  is_non_employee: boolean;
  work_location: string | null;
  work_phone: string | null;
  email: string;
  agency_name: string;
  agency_code: string;
  justification: string | null;
  submitter_name: string;
  submitter_email: string;
  supervisor_name: string;
  supervisor_email: string;
  security_admin_name: string;
  security_admin_email: string;
  status: string;
  security_areas: SecurityArea[];
  copy_user_details: CopyUserDetails | null;
}

function EditRequestPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'copy' | 'select' | null>(null);
  const [requestData, setRequestData] = useState<RequestData | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const [isTestMode, setIsTestMode] = useState(() => {
    return localStorage.getItem('testMode') === 'true';
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SecurityRoleRequest>();

  const [isTestModeInitialized, setIsTestModeInitialized] = useState(() => {
    return localStorage.getItem('testMode') === 'true';
  });

  // Auto-fill test data when test mode is enabled
  useEffect(() => {
    if (isTestMode && currentUser && !loading) {
      // Generate unique test data with regular names
      const firstNames = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Robert', 'Ashley', 'William', 'Amanda'];
      const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
      
      const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
      const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
      const randomNumber = Math.floor(Math.random() * 999) + 1;
      const uniqueId = randomNumber.toString().padStart(3, '0');
      
      // Calculate a date 7 days from now
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      // Generate unique test data
      const testData = {
        startDate: futureDateString,
        employeeName: `${randomFirst} ${randomLast}`,
        employeeId: `EMP${uniqueId}`,
        isNonEmployee: false,
        workLocation: `${Math.floor(Math.random() * 999) + 1} Main Street, Minneapolis, MN`,
        workPhone: `612555${uniqueId.padStart(4, '0')}`,
        email: `${randomFirst.toLowerCase()}.${randomLast.toLowerCase()}@state.mn.us`,
        agencyName: 'Administration',
        agencyCode: 'G02',
        justification: `Access needed for daily work responsibilities and system administration tasks.`,
        submitterName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        submitterEmail: `${firstNames[Math.floor(Math.random() * firstNames.length)].toLowerCase()}.${lastNames[Math.floor(Math.random() * lastNames.length)].toLowerCase()}@state.mn.us`,
        supervisorName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        supervisorUsername: `${firstNames[Math.floor(Math.random() * firstNames.length)].toLowerCase()}.${lastNames[Math.floor(Math.random() * lastNames.length)].toLowerCase()}@state.mn.us`,
        securityAdminName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        securityAdminUsername: `${firstNames[Math.floor(Math.random() * firstNames.length)].toLowerCase()}.${lastNames[Math.floor(Math.random() * lastNames.length)].toLowerCase()}@state.mn.us`,
        securityArea: 'accounting_procurement' as const,
        accountingDirector: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        accountingDirectorUsername: `${firstNames[Math.floor(Math.random() * firstNames.length)].toLowerCase()}.${lastNames[Math.floor(Math.random() * lastNames.length)].toLowerCase()}@state.mn.us`
      };
      
      // Set form values
      Object.entries(testData).forEach(([key, value]) => {
        setValue(key as keyof SecurityRoleRequest, value);
      });
      
      console.log('Edit page test data auto-filled for:', testData.employeeName);
    }
  }, [isTestMode, currentUser, loading, setValue]);

  const handleUserChange = (userName: string | null) => {
    setCurrentUser(userName);
  };

  // Watch for security area selection
  const selectedSecurityArea = watch('securityArea');
  const isNonEmployee = watch('isNonEmployee');

  // Check if a security area is selected
  const hasSelectedSecurityArea = !!selectedSecurityArea;

  useEffect(() => {
    if (id) {
      fetchRequestData();
    }
  }, [id]);

  // Handle security area selection - navigate to specific role selection if needed
  useEffect(() => {
    if (selectedSecurityArea === 'elm' && id) {
      navigate('/elm-roles', { state: { requestId: id } });
    }
  }, [selectedSecurityArea, id, navigate]);

  const handleAgencyChange = (agencyName: string, agencyCode: string) => {
    setValue('agencyName', agencyName);
    setValue('agencyCode', agencyCode);
  };

  const fetchRequestData = async () => {
    try {
      if (!id) return;

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
        .eq('id', id)
        .single();

      if (requestError) throw requestError;

      // Check if request can be edited (only pending requests)
      if (requestData.status !== 'pending') {
        toast.error('This request cannot be edited as it has already been processed.');
        navigate(`/requests/${id}`);
        return;
      }

      // Fetch copy user details
      const { data: copyUserData, error: copyUserError } = await supabase
        .from('copy_user_details')
        .select('*')
        .eq('request_id', id)
        .maybeSingle();

      if (copyUserError) throw copyUserError;

      const formattedData: RequestData = {
        ...requestData,
        security_areas: requestData.security_areas || [],
        copy_user_details: copyUserData
      };

      setRequestData(formattedData);

      // Extract username from email addresses
      const extractUsername = (email: string) => {
        return email;
      };

      // Determine the selected security area (take the first one since we now only allow one)
      const primarySecurityArea = formattedData.security_areas[0]?.area_type as SecurityRoleRequest['securityArea'];

      // Set form values
      reset({
        startDate: formattedData.start_date,
        employeeName: formattedData.employee_name,
        employeeId: formattedData.employee_id || '',
        isNonEmployee: formattedData.is_non_employee,
        workLocation: formattedData.work_location || '',
        workPhone: formattedData.work_phone || '',
        email: formattedData.email,
        agencyName: formattedData.agency_name,
        agencyCode: formattedData.agency_code,
        justification: formattedData.justification || '',
        submitterName: formattedData.submitter_name,
        submitterEmail: formattedData.submitter_email,
        supervisorName: formattedData.supervisor_name,
        supervisorUsername: extractUsername(formattedData.supervisor_email),
        securityAdminName: formattedData.security_admin_name,
        securityAdminUsername: extractUsername(formattedData.security_admin_email),
        securityArea: primarySecurityArea,
        accountingDirector: formattedData.security_areas.find(area => area.area_type === 'accounting_procurement')?.director_name || '',
        accountingDirectorUsername: extractUsername(formattedData.security_areas.find(area => area.area_type === 'accounting_procurement')?.director_email || ''),
        hrMainframeLogonId: formattedData.security_areas.find(area => area.area_type === 'hr_payroll')?.director_name || '',
        hrViewStatewide: formattedData.security_areas.find(area => area.area_type === 'hr_payroll')?.director_email?.includes('statewide') || false,
        elmKeyAdmin: formattedData.security_areas.find(area => area.area_type === 'elm')?.director_name || '',
        elmKeyAdminUsername: extractUsername(formattedData.security_areas.find(area => area.area_type === 'elm')?.director_email || ''),
        copyUserName: formattedData.copy_user_details?.copy_user_name || '',
        copyUserEmployeeId: formattedData.copy_user_details?.copy_user_employee_id || '',
        copyUserSema4Id: formattedData.copy_user_details?.copy_user_sema4_id || ''
      });

      // Set the selected option based on existing data
      if (formattedData.copy_user_details) {
        setSelectedOption('copy');
      } else {
        setSelectedOption('select');
      }

    } catch (error) {
      console.error('Error fetching request data:', error);
      toast.error('Failed to load request data');
      navigate('/requests');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SecurityRoleRequest) => {
    if (!hasSelectedSecurityArea) {
      return;
    }

    setSaving(true);

    try {
      if (!id) throw new Error('No request ID found');

      console.log('Starting update process for request:', id);
      console.log('Form data:', data);

      // Format phone number
      const formattedPhone = data.workPhone ? data.workPhone.replace(/\D/g, '') : null;

      // Update the main request
      const { error: requestError } = await supabase
        .from('security_role_requests')
        .update({
          start_date: data.startDate,
          employee_name: data.employeeName,
          employee_id: data.employeeId,
          is_non_employee: data.isNonEmployee,
          work_location: data.workLocation,
          work_phone: formattedPhone,
          email: data.email,
          agency_name: data.agencyName,
          agency_code: data.agencyCode,
          justification: data.justification,
          submitter_name: data.submitterName,
          submitter_email: data.submitterEmail,
          supervisor_name: data.supervisorName,
          supervisor_email: data.supervisorUsername,
          security_admin_name: data.securityAdminName,
          security_admin_email: data.securityAdminUsername,
        })
        .eq('id', id);

      if (requestError) throw requestError;
      console.log('Main request updated successfully');

      // Prepare new security area data
      const securityAreas = [];
      if (data.securityArea === 'accounting_procurement') {
        securityAreas.push({
          area_type: 'accounting_procurement',
          director_name: data.accountingDirector,
          director_email: data.accountingDirectorUsername,
        });
      } else if (data.securityArea === 'hr_payroll') {
        securityAreas.push({
          area_type: 'hr_payroll',
          director_name: data.hrMainframeLogonId,
          director_email: data.hrViewStatewide ? 'hr_statewide_access@state.mn.us' : 'hr_standard_access@state.mn.us',
        });
      } else if (data.securityArea === 'epm_data_warehouse') {
        securityAreas.push({
          area_type: 'epm_data_warehouse',
        });
      } else if (data.securityArea === 'elm') {
        securityAreas.push({
          area_type: 'elm',
          director_name: data.elmKeyAdmin,
          director_email: data.elmKeyAdminUsername,
        });
      }

      // Check if the selected security area type is the same as existing
      const existingSecurityArea = requestData?.security_areas[0];
      const newSecurityArea = securityAreas[0];

      if (existingSecurityArea && newSecurityArea && existingSecurityArea.area_type === newSecurityArea.area_type) {
        // Update existing security area
        console.log('Updating existing security area:', newSecurityArea);
        const { error: updateAreaError } = await supabase
          .from('security_areas')
          .update(newSecurityArea)
          .eq('request_id', id)
          .eq('area_type', newSecurityArea.area_type);

        if (updateAreaError) throw updateAreaError;
        console.log('Security area updated successfully');
      } else {
        // Security area type has changed or doesn't exist - delete and insert
        console.log('Security area type changed, replacing with:', newSecurityArea);
        
        // Delete existing security areas
        const { error: deleteAreasError } = await supabase
          .from('security_areas')
          .delete()
          .eq('request_id', id);

        if (deleteAreasError) throw deleteAreasError;
        console.log('Existing security areas deleted');

        // Delete existing area-specific approvals to prevent orphaned approvals
        const { error: deleteApprovalsError } = await supabase
          .from('request_approvals')
          .delete()
          .eq('request_id', id)
          .in('step', ['accounting_director_approval', 'hr_director_approval', 'elm_admin_approval']);

        if (deleteApprovalsError) throw deleteApprovalsError;
        console.log('Existing area-specific approvals deleted');

        // Insert the new security area (this will trigger the approval creation via triggers)
        if (securityAreas.length > 0) {
          const securityAreaWithRequestId = {
            ...newSecurityArea,
            request_id: id
          };
          
          const { error: areasError } = await supabase
            .from('security_areas')
            .insert(securityAreaWithRequestId);

          if (areasError) throw areasError;
          console.log('New security area inserted successfully');
        }
      }

      // Handle copy user details
      if (selectedOption === 'copy') {
        // Delete existing copy user details
        await supabase
          .from('copy_user_details')
          .delete()
          .eq('request_id', id);

        // Insert updated copy user details
        const { error: copyError } = await supabase
          .from('copy_user_details')
          .insert({
            request_id: id,
            copy_user_name: data.copyUserName,
            copy_user_employee_id: data.copyUserEmployeeId,
            copy_user_sema4_id: data.copyUserSema4Id,
          });

        if (copyError) throw copyError;
        console.log('Copy user details updated');
      } else {
        // Delete copy user details if switching to select option
        await supabase
          .from('copy_user_details')
          .delete()
          .eq('request_id', id);
        console.log('Copy user details removed');
      }

      // Delete existing security role selections to start fresh
      await supabase
        .from('security_role_selections')
        .delete()
        .eq('request_id', id);
      console.log('Existing security role selections deleted');

      // Reset any remaining approvals to pending (except user signature)
      const { error: resetApprovalsError } = await supabase
        .from('request_approvals')
        .update({
          status: 'pending',
          signature_data: null,
          approved_at: null
        })
        .eq('request_id', id)
        .neq('step', 'user_signature');

      if (resetApprovalsError) throw resetApprovalsError;
      console.log('Remaining approvals reset to pending');

      toast.success('Request updated successfully!');
      
      if (selectedOption === 'copy') {
        // Navigate back to requests list with refresh flag
        navigate('/requests', { state: { refreshData: true } });
      } else {
        navigate('/select-roles', { state: { requestId: id, fromEdit: true } });
      }

    } catch (error) {
      console.error('Error updating request:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to update request. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('home_business_unit') && error.message.includes('not-null')) {
          errorMessage = 'Business Unit is required. Please enter your Home Business Unit code (5 characters) and try again.';
        } else if (error.message.includes('not-null constraint')) {
          errorMessage = 'A required field is missing. Please check that all required fields are filled out and try again.';
        } else if (error.message.includes('violates') && error.message.includes('constraint')) {
          errorMessage = 'There was a data validation error. Please check your entries and try again.';
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!requestData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Request not found</h3>
            <Link
              to="/requests"
              className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Requests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Edit Security Role Request"
        subtitle="Modify your security role access request"
        onUserChange={handleUserChange}
      />
      
      {!currentUser ? (
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">User Identification Required</h3>
              <p className="text-blue-700">
                Please identify yourself to edit requests.
              </p>
            </div>
          </div>
        </div>
      ) : (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link
              to={`/requests/${id}`}
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Request Details
            </Link>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-8 rounded-lg shadow">
            {/* Section 1: Employee Details */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Employee Details</h3>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date of Access*</label>
                  <input
                    type="date"
                    {...register('startDate', {
                      required: 'Start date is required',
                      validate: value => 
                        isAfter(new Date(value), startOfToday()) || 'Start date must be in the future'
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee Name*</label>
                  <input
                    type="text"
                    {...register('employeeName', { required: 'Employee name is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.employeeName && (
                    <p className="mt-1 text-sm text-red-600">{errors.employeeName.message}</p>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                  <div className="flex items-center mt-1">
                    <input
                      type="text"
                      {...register('employeeId', {
                        required: isNonEmployee ? false : 'Employee ID is required'
                      })}
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
                  {errors.employeeId && (
                    <p className="mt-1 text-sm text-red-600">{errors.employeeId.message}</p>
                  )}
                </div>

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
                        message: 'Please enter a valid 10-digit phone number or leave empty'
                      }
                    })}
                    placeholder="1234567890"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.workPhone && (
                    <p className="mt-1 text-sm text-red-600">{errors.workPhone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address*</label>
                  <input
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <AgencySelect
                    value={watch('agencyName') || ''}
                    onChange={handleAgencyChange}
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
                      maxLength: {
                        value: 3,
                        message: 'Agency code must be 3 characters'
                      },
                      minLength: {
                        value: 3,
                        message: 'Agency code must be 3 characters'
                      }
                    })}
                    readOnly
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                  />
                  {errors.agencyCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.agencyCode.message}</p>
                  )}
                </div>
              </div>

            </div>

            {/* Section 2: Submitter Details */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Submitter Details</h3>
              
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
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.submitterEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.submitterEmail.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Approver Details */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Approver Details</h3>
              
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
                  <label className="block text-sm font-medium text-gray-700">Supervisor Username*</label>
                  <input
                    type="email"
                    {...register('supervisorUsername', {
                      required: 'Supervisor email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Please enter a valid email address'
                      }
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
                  <label className="block text-sm font-medium text-gray-700">Security Administrator Username*</label>
                  <input
                    type="email"
                    {...register('securityAdminUsername', {
                      required: 'Security admin email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Please enter a valid email address'
                      }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="admin@example.com"
                  />
                  {errors.securityAdminUsername && (
                    <p className="mt-1 text-sm text-red-600">{errors.securityAdminUsername.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Security Details */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Security Details</h3>
              
              <p className="text-sm text-gray-700">Please select the security area you need access to</p>

              {!hasSelectedSecurityArea && (
                <div className="rounded-md bg-yellow-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Required Selection
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Please select a security area to proceed.
                        </p>
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

                  {selectedSecurityArea === 'accounting_procurement' && (
                    <div className="ml-6 mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Accounting Director/CFO*</label>
                        <input
                          type="text"
                          {...register('accountingDirector', { required: 'Accounting Director is required' })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.accountingDirector && (
                          <p className="mt-1 text-sm text-red-600">{errors.accountingDirector.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Director Username*</label>
                        <input
                          type="email"
                          {...register('accountingDirectorUsername', {
                            required: 'Director email is required',
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Please enter a valid email address'
                            }
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="director@example.com"
                        />
                        {errors.accountingDirectorUsername && (
                          <p className="mt-1 text-sm text-red-600">{errors.accountingDirectorUsername.message}</p>
                        )}
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

                  {selectedSecurityArea === 'hr_payroll' && (
                    <div className="ml-6 mt-2 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Enter mainframe logon ID—required until further notice:*
                        </label>
                        <input
                          type="text"
                          {...register('hrMainframeLogonId', { required: 'Mainframe logon ID is required' })}
                          placeholder="Enter mainframe logon ID"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.hrMainframeLogonId && (
                          <p className="mt-1 text-sm text-red-600">{errors.hrMainframeLogonId.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="inline-flex items-start">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            If this person is responsible for HR activities/transactions and has an ongoing business need to view HR data pages for employees across department boundaries (HR View Statewide), check here:
                          </span>
                        </label>
                      </div>

                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-yellow-400" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              Important Note
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>
                                The mainframe logon ID is required until further notice for all HR/Payroll access requests.
                              </p>
                            </div>
                          </div>
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
                    DON'T SELECT ELM unless you are seeking access privileges for administrative functions. All staff automatically have access to ELM courses.
                  </p>

                  {selectedSecurityArea === 'elm' && (
                    <div className="ml-6 mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ELM Key Administrator*</label>
                        <input
                          type="text"
                          {...register('elmKeyAdmin', { required: 'ELM Key Administrator is required' })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.elmKeyAdmin && (
                          <p className="mt-1 text-sm text-red-600">{errors.elmKeyAdmin.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Administrator Username*</label>
                        <input
                          type="email"
                          {...register('elmKeyAdminUsername', {
                            required: 'Administrator email is required',
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Please enter a valid email address'
                            }
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="admin@example.com"
                        />
                        {errors.elmKeyAdminUsername && (
                          <p className="mt-1 text-sm text-red-600">{errors.elmKeyAdminUsername.message}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {errors.securityArea && (
                <p className="mt-1 text-sm text-red-600">{errors.securityArea.message}</p>
              )}
            </div>

            {/* Role Selection Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Role Selection Method</h3>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">
                  Please choose how you would like to set up the security roles for this request:
                </p>
                
                <div className="space-y-6">
                  <div className="flex flex-col space-y-4">
                    <button
                      type="button"
                      onClick={() => setSelectedOption('copy')}
                      className={`p-4 text-left rounded-lg border-2 transition-colors ${
                        selectedOption === 'copy'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">Copy Existing User Access</h4>
                          <p className="mt-1 text-sm text-gray-500">
                            Grant the same roles, agency codes, and workflows as an existing user.
                            Choose this if you want to replicate another user's access permissions.
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedOption('select')}
                      className={`p-4 text-left rounded-lg border-2 transition-colors ${
                        selectedOption === 'select'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">Select Individual Roles</h4>
                          <p className="mt-1 text-sm text-gray-500">
                            Choose specific roles and permissions from a comprehensive list.
                            Best for customized access requirements.
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>

                  {selectedOption === 'copy' && (
                    <div className="mt-6 space-y-4 bg-white p-6 rounded-lg border border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name of user to be copied*</label>
                        <input
                          type="text"
                          {...register('copyUserName', { required: 'User name is required' })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.copyUserName && (
                          <p className="mt-1 text-sm text-red-600">{errors.copyUserName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Employee ID*</label>
                        <input
                          type="text"
                          {...register('copyUserEmployeeId', { required: 'Employee ID is required' })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.copyUserEmployeeId && (
                          <p className="mt-1 text-sm text-red-600">{errors.copyUserEmployeeId.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">SEMA4 ID</label>
                        <input
                          type="text"
                          {...register('copyUserSema4Id')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!hasSelectedSecurityArea || saving}
                        className={`w-full mt-4 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                          hasSelectedSecurityArea && !saving
                            ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}

                  {selectedOption === 'select' && (
                    <div className="mt-6">
                      <button
                        type="submit"
                        disabled={!hasSelectedSecurityArea || saving}
                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                          hasSelectedSecurityArea && !saving
                            ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save & Continue to Role Selection'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      )}
    </div>
  );
}

export default EditRequestPage;