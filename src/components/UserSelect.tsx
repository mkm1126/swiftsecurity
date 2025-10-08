import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface User {
  employee_name: string;
  employee_id: string;
  email: string;
  request_id?: string;
}

interface UserSelectProps {
  selectedUser: User | null;
  onUserChange: (user: User | null) => void;
  currentUser?: string;
  currentRequestId?: string;
  formData?: any;
  onUserDetailsLoaded?: (data: {
    userDetails: any;
    roleSelections: any;
    normalizedRoles: any;
  }) => void;
}

export default function UserSelect({
  selectedUser,
  onUserChange,
  currentUser,
  currentRequestId,
  formData,
  onUserDetailsLoaded,
}: UserSelectProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('access_requests')
        .select('employee_name, employee_id, email, id')
        .eq('status', 'approved')
        .order('employee_name');

      if (error) throw error;

      const uniqueUsers = data?.reduce((acc: User[], curr) => {
        const exists = acc.find(u => u.employee_id === curr.employee_id);
        if (!exists && curr.employee_name !== currentUser) {
          acc.push({
            employee_name: curr.employee_name,
            employee_id: curr.employee_id,
            email: curr.email,
            request_id: curr.id,
          });
        }
        return acc;
      }, []) || [];

      setUsers(uniqueUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = async (user: User | null) => {
    onUserChange(user);

    if (!user || !user.request_id || !onUserDetailsLoaded) {
      return;
    }

    setIsLoading(true);
    try {
      const { data: requestData, error } = await supabase
        .from('access_requests')
        .select('*')
        .eq('id', user.request_id)
        .maybeSingle();

      if (error) throw error;
      if (!requestData) {
        toast.error('User request data not found');
        return;
      }

      onUserDetailsLoaded({
        userDetails: requestData,
        roleSelections: requestData,
        normalizedRoles: requestData,
      });
    } catch (error) {
      console.error('Error loading user details:', error);
      toast.error('Failed to load user access details');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Select User to Copy
      </label>
      <div className="relative">
        <input
          type="text"
          placeholder="Search for a user to copy..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        />
        {filteredUsers.length > 0 && searchTerm && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredUsers.map((user) => (
              <button
                key={user.employee_id}
                type="button"
                onClick={() => {
                  handleUserSelect(user);
                  setSearchTerm(user.employee_name);
                }}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
              >
                <div className="font-medium text-gray-900">{user.employee_name}</div>
                <div className="text-sm text-gray-500">
                  {user.employee_id} • {user.email}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {selectedUser && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-blue-900">{selectedUser.employee_name}</div>
              <div className="text-sm text-blue-700">
                {selectedUser.employee_id} • {selectedUser.email}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onUserChange(null);
                setSearchTerm('');
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}
      {isLoading && (
        <div className="text-sm text-gray-500 mt-2">Loading...</div>
      )}
    </div>
  );
}
