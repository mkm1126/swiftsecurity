// src/RequestListPage.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Plus,
  List,
  Share2,
  RefreshCw,
  Trash2,
  X,
  AlertTriangle,
  Filter as FilterIcon,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { format } from 'date-fns';
import { toast } from 'sonner';
import clsx from 'clsx';
import Header from './components/Header';

interface SecurityArea {
  area_type: 'accounting_procurement' | 'hr_payroll' | 'epm_data_warehouse' | 'elm';
}

interface Request {
  id: string;
  created_at: string;
  submitter_name: string;
  employee_name: string;
  status: string;
  security_areas: SecurityArea[];
  agency_name?: string | null;
  agency_code?: string | null;
  request_approvals: {
    id: string;
    step: string;
    status: string;
  }[];
}

const areaLabels: Record<SecurityArea['area_type'], string> = {
  accounting_procurement: 'Accounting / Procurement',
  hr_payroll: 'HR / Payroll',
  epm_data_warehouse: 'EPM / Data Warehouse',
  elm: 'ELM',
};

const areaAbbreviations: Record<SecurityArea['area_type'], string> = {
  accounting_procurement: 'SWIFT',
  hr_payroll: 'HR',
  epm_data_warehouse: 'EPM',
  elm: 'ELM',
};

const getAgencyDisplay = (r: Pick<Request, 'agency_name' | 'agency_code'>) => {
  const name = r.agency_name || '';
  const code = r.agency_code || '';
  return name && code ? `${name} (${code})` : name || code || '';
};

// ---------- Utilities for closing dropdowns on outside click ----------
function useOutsideClick<T extends HTMLElement>(onClickOutside: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClickOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClickOutside]);
  return ref;
}

// ---------- Column filter: multi-select with search ----------
type MultiFilterProps = {
  label: string;
  options: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  className?: string;
};

function MultiSelectFilter({ label, options, selected, onChange, className }: MultiFilterProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const containerRef = useOutsideClick<HTMLDivElement>(() => setOpen(false));
  const isActive = selected.size > 0;

  const filteredOpts = useMemo(() => {
    if (!q.trim()) return options;
    const s = q.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(s));
  }, [options, q]);

  const toggleAll = (allChecked: boolean) => {
    onChange(allChecked ? new Set(options) : new Set());
  };

  const toggleOne = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(next);
  };

  return (
    <div className={clsx('relative inline-block', className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'inline-flex items-center text-xs font-medium rounded px-2 py-1 border',
          isActive
            ? 'bg-blue-50 text-blue-700 border-blue-300'
            : 'bg-white text-gray-600 border-gray-300',
          'hover:bg-gray-50'
        )}
        title={`Filter ${label}`}
      >
        <FilterIcon className="h-3.5 w-3.5 mr-1" />
        {isActive ? 'Filtered' : 'Filter'}
        {open ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <div className="text-xs font-semibold text-gray-700 mb-1">{label}</div>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <div className="p-2 max-h-56 overflow-auto">
            <label className="flex items-center text-sm mb-2">
              <input
                type="checkbox"
                className="mr-2"
                checked={selected.size === options.length && options.length > 0}
                onChange={(e) => toggleAll(e.target.checked)}
              />
              Select all
            </label>
            {filteredOpts.length === 0 ? (
              <div className="text-xs text-gray-500 py-2">No matches</div>
            ) : (
              filteredOpts.map((opt) => (
                <label key={opt} className="flex items-center text-sm py-1">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={selected.has(opt)}
                    onChange={() => toggleOne(opt)}
                  />
                  <span className="truncate">{opt}</span>
                </label>
              ))
            )}
          </div>
          <div className="px-2 py-2 border-t border-gray-100 flex justify-end">
            <button
              className="text-xs text-gray-600 hover:text-gray-800"
              onClick={() => {
                onChange(new Set());
                setQ('');
                setOpen(false);
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Column filter: date range ----------
type DateFilterProps = {
  label: string;
  after: string;
  before: string;
  onChange: (nextAfter: string, nextBefore: string) => void;
  className?: string;
};

function DateRangeFilter({ label, after, before, onChange, className }: DateFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useOutsideClick<HTMLDivElement>(() => setOpen(false));
  const isActive = Boolean(after || before);

  return (
    <div className={clsx('relative inline-block', className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'inline-flex items-center text-xs font-medium rounded px-2 py-1 border',
          isActive
            ? 'bg-blue-50 text-blue-700 border-blue-300'
            : 'bg-white text-gray-600 border-gray-300',
          'hover:bg-gray-50'
        )}
        title={`Filter ${label}`}
      >
        <FilterIcon className="h-3.5 w-3.5 mr-1" />
        {isActive ? 'Filtered' : 'Filter'}
        {open ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-72 bg-white border border-gray-200 rounded-md shadow-lg p-3">
          <div className="text-xs font-semibold text-gray-700 mb-2">{label}</div>
          <div className="grid grid-cols-1 gap-2">
            <label className="text-xs text-gray-600">
              After / On
              <input
                type="date"
                className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 rounded"
                value={after}
                onChange={(e) => onChange(e.target.value, before)}
              />
            </label>
            <label className="text-xs text-gray-600">
              Before / On
              <input
                type="date"
                className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 rounded"
                value={before}
                onChange={(e) => onChange(after, e.target.value)}
              />
            </label>
          </div>
          <div className="mt-2 flex justify-end">
            <button
              className="text-xs text-gray-600 hover:text-gray-800"
              onClick={() => {
                onChange('', '');
                setOpen(false);
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Component to display areas with condensed view
function AreasDisplay({ areas, requestId }: { areas: SecurityArea[]; requestId: string }) {
  const [showAll, setShowAll] = useState(false);
  const maxVisible = 2;
  
  if (areas.length === 0) {
    return <span className="text-gray-400 text-xs">No areas selected</span>;
  }
  
  const visibleAreas = showAll ? areas : areas.slice(0, maxVisible);
  const hiddenCount = areas.length - maxVisible;
  
  return (
    <div className="flex flex-wrap gap-1 items-center">
      {visibleAreas.map((area, index) => (
        <span
          key={`${requestId}-${area.area_type}-${index}`}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
          title={areaLabels[area.area_type]} // Show full name on hover
        >
          {areaAbbreviations[area.area_type]}
        </span>
      ))}
      
      {!showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          title={`Show ${hiddenCount} more area${hiddenCount > 1 ? 's' : ''}: ${areas.slice(maxVisible).map(a => areaLabels[a.area_type]).join(', ')}`}
        >
          +{hiddenCount} more
        </button>
      )}
      
      {showAll && areas.length > maxVisible && (
        <button
          onClick={() => setShowAll(false)}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          title="Show less"
        >
          Show less
        </button>
      )}
    </div>
  );
}

function RequestListPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalRequestsCount, setTotalRequestsCount] = useState(0);

  const handleUserChange = (userName: string | null) => {
    console.log('🔍 User changed in RequestListPage:', userName);
    setCurrentUser(userName);
  };

  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<Request | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Column filter state
  const [employeeFilter, setEmployeeFilter] = useState<Set<string>>(new Set());
  const [submitterFilter, setSubmitterFilter] = useState<Set<string>>(new Set());
  const [agencyFilter, setAgencyFilter] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [areaFilter, setAreaFilter] = useState<Set<string>>(new Set());
  const [dateAfter, setDateAfter] = useState<string>(''); // yyyy-mm-dd
  const [dateBefore, setDateBefore] = useState<string>(''); // yyyy-mm-dd

  // Options per column (computed from current page data)
  const employeeOptions = useMemo(() => {
    const s = new Set(requests.map((r) => r.employee_name).filter(Boolean));
    return Array.from(s).sort();
  }, [requests]);

  const submitterOptions = useMemo(() => {
    const s = new Set(requests.map((r) => r.submitter_name).filter(Boolean));
    return Array.from(s).sort();
  }, [requests]);

  const agencyOptions = useMemo(() => {
    const s = new Set(requests.map(getAgencyDisplay).filter(Boolean));
    return Array.from(s).sort();
  }, [requests]);

  const statusOptions = useMemo(() => {
    const known = ['pending', 'approved', 'completed', 'rejected'];
    const present = Array.from(new Set(requests.map((r) => r.status))).filter(Boolean);
    return Array.from(new Set([...known, ...present])).sort((a, b) => a.localeCompare(b));
  }, [requests]);

  const areaOptions = useMemo(() => {
    const s = new Set<string>();
    requests.forEach((r) => {
      (r.security_areas || []).forEach((a) => s.add(areaLabels[a.area_type]));
    });
    return Array.from(s).sort();
  }, [requests]);

  // Calculate pagination values
  const totalPages = Math.ceil(totalRequestsCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalRequestsCount);

  // Fetch requests when component mounts or filters change
  useEffect(() => {
    fetchRequests(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, employeeFilter, submitterFilter, agencyFilter, statusFilter, areaFilter, dateAfter, dateBefore]);

  // Refresh data when returning from edit page
  useEffect(() => {
    if ((location.state as any)?.refreshData) {
      fetchRequests(currentPage);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, currentPage]);

  async function fetchRequests(page: number = 1) {
    try {
      setLoading(true);
      
      console.log('🔍 Fetching requests with params:', {
        page,
        itemsPerPage,
        filters: {
          employee: employeeFilter.size,
          submitter: submitterFilter.size,
          agency: agencyFilter.size,
          status: statusFilter.size,
          area: areaFilter.size,
          dateAfter,
          dateBefore
        }
      });

      let query = supabase
        .from('security_role_requests')
        .select(
          `
          *,
          security_areas (
            area_type
          ),
          request_approvals (
            id,
            step,
            status
          )
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false }); // Always show newest first

      // Apply column filters
      if (employeeFilter.size > 0) {
        query = query.in('employee_name', Array.from(employeeFilter));
      }
      if (submitterFilter.size > 0) {
        query = query.in('submitter_name', Array.from(submitterFilter));
      }
      if (statusFilter.size > 0) {
        query = query.in('status', Array.from(statusFilter));
      }
      if (dateAfter) {
        query = query.gte('created_at', `${dateAfter}T00:00:00`);
      }
      if (dateBefore) {
        query = query.lte('created_at', `${dateBefore}T23:59:59`);
      }

      // Apply pagination
      const startIdx = (page - 1) * itemsPerPage;
      const endIdx = startIdx + itemsPerPage - 1;
      query = query.range(startIdx, endIdx);

      const { data, error, count } = await query;
      if (error) throw error;

      console.log('🔍 Query results:', { 
        dataCount: data?.length || 0, 
        totalCount: count || 0,
        sampleData: data?.slice(0, 5).map(r => ({ 
          id: r.id.slice(0, 8), 
          employee_name: r.employee_name, 
          created_at: r.created_at,
          poc_user: r.poc_user,
          status: r.status
        }))
      });

      const processedData = (data || []).map((request) => ({
        ...request,
        security_areas: request.security_areas || [],
      }));

      let filteredData = processedData;

      // Apply agency filter (post-processing)
      if (agencyFilter.size > 0) {
        filteredData = filteredData.filter((r) => agencyFilter.has(getAgencyDisplay(r)));
      }

      // Apply area filter (post-processing)
      if (areaFilter.size > 0) {
        filteredData = filteredData.filter((r) => {
          const labels = (r.security_areas || []).map((a) => areaLabels[a.area_type]);
          return labels.some((l) => areaFilter.has(l));
        });
      }

      setRequests(filteredData as Request[]);
      setTotalRequestsCount(count || 0);
      
      console.log('🔍 Final results:', { 
        displayedCount: filteredData.length, 
        totalCount: count || 0,
      });
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const getNextPendingApproval = (request: Request) =>
    request.request_approvals.find((approval) => approval.status === 'pending');

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRequests(currentPage);
    toast.success('Requests refreshed');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = () => {
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  // Update filter change handlers to reset pagination
  const handleEmployeeFilterChange = (newFilter: Set<string>) => {
    setEmployeeFilter(newFilter);
    handleFilterChange();
  };

  const handleSubmitterFilterChange = (newFilter: Set<string>) => {
    setSubmitterFilter(newFilter);
    handleFilterChange();
  };

  const handleAgencyFilterChange = (newFilter: Set<string>) => {
    setAgencyFilter(newFilter);
    handleFilterChange();
  };

  const handleStatusFilterChange = (newFilter: Set<string>) => {
    setStatusFilter(newFilter);
    handleFilterChange();
  };

  const handleAreaFilterChange = (newFilter: Set<string>) => {
    setAreaFilter(newFilter);
    handleFilterChange();
  };

  const handleDateFilterChange = (after: string, before: string) => {
    setDateAfter(after);
    setDateBefore(before);
    handleFilterChange();
  };

  const handleNewRequest = () => {
    localStorage.setItem('testMode', 'false');
    window.dispatchEvent(new StorageEvent('storage', { key: 'testMode', newValue: 'false', oldValue: 'true' }));
    navigate('/');
  };

  const handleDeleteClick = (request: Request) => {
    setRequestToDelete(request);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!requestToDelete) return;
    setDeletingRequestId(requestToDelete.id);
    try {
      const { error } = await supabase.from('security_role_requests').delete().eq('id', requestToDelete.id);
      if (error) throw error;

      toast.success(`Request for ${requestToDelete.employee_name} has been deleted`);
      setRequests((prev) => prev.filter((r) => r.id !== requestToDelete.id));
      setShowDeleteModal(false);
      setRequestToDelete(null);
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Failed to delete request. Please try again.');
    } finally {
      setDeletingRequestId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setRequestToDelete(null);
  };

  // Apply all filters (OR within a column, AND across columns)
  const filteredRequests = useMemo(() => {
    let list = [...requests];

    if (employeeFilter.size) {
      list = list.filter((r) => employeeFilter.has(r.employee_name));
    }
    if (submitterFilter.size) {
      list = list.filter((r) => submitterFilter.has(r.submitter_name));
    }
    if (agencyFilter.size) {
      list = list.filter((r) => agencyFilter.has(getAgencyDisplay(r)));
    }
    if (statusFilter.size) {
      list = list.filter((r) => statusFilter.has(r.status));
    }
    if (areaFilter.size) {
      list = list.filter((r) => {
        const labels = (r.security_areas || []).map((a) => areaLabels[a.area_type]);
        return labels.some((l) => areaFilter.has(l));
      });
    }
    if (dateAfter) {
      const afterTs = new Date(dateAfter + 'T00:00:00').getTime();
      list = list.filter((r) => new Date(r.created_at).getTime() >= afterTs);
    }
    if (dateBefore) {
      const beforeTs = new Date(dateBefore + 'T23:59:59').getTime();
      list = list.filter((r) => new Date(r.created_at).getTime() <= beforeTs);
    }

    return list;
  }, [requests, employeeFilter, submitterFilter, agencyFilter, statusFilter, areaFilter, dateAfter, dateBefore]);

  const anyFilterActive =
    employeeFilter.size > 0 ||
    submitterFilter.size > 0 ||
    agencyFilter.size > 0 ||
    statusFilter.size > 0 ||
    areaFilter.size > 0 ||
    !!dateAfter ||
    !!dateBefore;

  const clearAllFilters = () => {
    setEmployeeFilter(new Set());
    setSubmitterFilter(new Set());
    setAgencyFilter(new Set());
    setStatusFilter(new Set());
    setAreaFilter(new Set());
    setDateAfter('');
    setDateBefore('');
    setCurrentPage(1);
  };

  // ---------- Top horizontal scrollbar syncing ----------
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableInnerRef = useRef<HTMLTableElement>(null);
  const [ghostWidth, setGhostWidth] = useState(0);
  const isSyncingRef = useRef(false);

  const onTopScroll = () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (tableScrollRef.current && topScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
    isSyncingRef.current = false;
  };

  const onTableScroll = () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (tableScrollRef.current && topScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
    isSyncingRef.current = false;
  };

  useEffect(() => {
    const measure = () => {
      if (!tableInnerRef.current) return;
      setGhostWidth(tableInnerRef.current.scrollWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (tableInnerRef.current) ro.observe(tableInnerRef.current);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      ro.disconnect();
    };
  }, [requests.length]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Security Role Requests"
        subtitle="Manage and review security role requests"
      />

      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top actions */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              {/* Pagination info */}
              <div className="text-sm text-gray-600">
                {totalRequestsCount > 0 ? (
                  <>
                    Showing {startIndex}-{endIndex} of {totalRequestsCount} requests
                    {anyFilterActive && ' (filtered)'}
                  </>
                ) : (
                  'No requests found'
                )}
              </div>
              {anyFilterActive && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear all filters
                </button>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={handleNewRequest}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <List className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {anyFilterActive ? 'No matching requests' : 'No requests'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {anyFilterActive
                  ? 'No requests matched the selected column filters.'
                  : 'Get started by creating a new security role request.'}
              </p>
              <div className="mt-6 flex justify-center space-x-4">
                {anyFilterActive && (
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Clear Filters
                  </button>
                )}
                <button
                  onClick={handleNewRequest}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white shadow rounded-md">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Page {currentPage} of {totalPages}
                    {anyFilterActive && ' (filtered)'}
                  </span>
                  {anyFilterActive && (
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {/* TOP HORIZONTAL SCROLLBAR (mirrors the table) */}
                <div className="relative border-b border-gray-200">
                  <div
                    ref={topScrollRef}
                    onScroll={onTopScroll}
                    className="overflow-x-auto overflow-y-hidden h-4"
                    aria-hidden="true"
                  >
                    <div style={{ width: ghostWidth || '100%' }} className="h-4" />
                  </div>
                </div>

                {/* MAIN TABLE SCROLLER */}
                <div ref={tableScrollRef} onScroll={onTableScroll} className="relative overflow-x-auto">
                  <table ref={tableInnerRef} className="min-w-full w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider align-top">
                          <div className="flex flex-col gap-1">
                            <span>Submitted By</span>
                            <MultiSelectFilter
                              label="Submitted By"
                              options={submitterOptions}
                              selected={submitterFilter}
                              onChange={handleSubmitterFilterChange}
                            />
                          </div>
                        </th>

                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider align-top">
                          <div className="flex flex-col gap-1">
                            <span>Requested For</span>
                            <MultiSelectFilter
                              label="Requested For"
                              options={employeeOptions}
                              selected={employeeFilter}
                              onChange={handleEmployeeFilterChange}
                            />
                          </div>
                        </th>

                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider align-top">
                          <div className="flex flex-col gap-1">
                            <span>Agency</span>
                            <MultiSelectFilter
                              label="Agency"
                              options={agencyOptions}
                              selected={agencyFilter}
                              onChange={handleAgencyFilterChange}
                            />
                          </div>
                        </th>

                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider align-top">
                          <div className="flex flex-col gap-1">
                            <span>Areas Requested</span>
                            <MultiSelectFilter
                              label="Areas Requested"
                              options={areaOptions}
                              selected={areaFilter}
                              onChange={handleAreaFilterChange}
                            />
                          </div>
                        </th>

                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider align-top">
                          <div className="flex flex-col gap-1">
                            <span>Status</span>
                            <MultiSelectFilter
                              label="Status"
                              options={statusOptions}
                              selected={statusFilter}
                              onChange={handleStatusFilterChange}
                            />
                          </div>
                        </th>

                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider align-top">
                          <div className="flex flex-col gap-1">
                            <span>Submitted Date</span>
                            <DateRangeFilter
                              label="Submitted Date"
                              after={dateAfter}
                              before={dateBefore}
                              onChange={handleDateFilterChange}
                            />
                          </div>
                        </th>

                        <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                      {requests.map((request) => {
                        const nextApproval = getNextPendingApproval(request);
                        const areas = request.security_areas || [];
                        return (
                          <tr key={request.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {request.submitter_name}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {request.employee_name}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {request.agency_code || <span className="text-gray-400">—</span>}
                            </td>

                            <td className="px-6 py-4 text-sm text-gray-700">
                              <AreasDisplay areas={areas} requestId={request.id} />
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={clsx(
                                  'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                                  {
                                    'bg-yellow-100 text-yellow-800': request.status === 'pending',
                                    'bg-green-100 text-green-800': request.status === 'approved',
                                    'bg-blue-100 text-blue-800': request.status === 'completed',
                                    'bg-gray-100 text-gray-800': request.status === 'rejected',
                                  }
                                )}
                              >
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {format(new Date(request.created_at), 'MM/dd/yy')}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-3">
                                  <Link
                                    to={`/requests/${request.id}`}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">View Details</span>
                                  </Link>
                                {nextApproval && (
                                  <button
                                    onClick={() => {
                                      const reviewUrl = `${window.location.origin}/signature/${request.id}/${nextApproval.id}?mode=review`;
                                      navigator.clipboard.writeText(reviewUrl);
                                      toast.success('Review link copied to clipboard!');
                                    }}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Copy Review Link"
                                  >
                                    <Share2 className="h-4 w-4" />
                                    <span className="sr-only">Copy Review Link</span>
                                  </button>
                                )}

                                {/* ✅ MNIT Details direct link — pass id as param AND state */}
                                <Link
                                  to={`/mnit/${request.id}`}
                                  state={{ requestId: request.id, from: 'requestList' }}
                                  className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                                  title="Open MNIT Provisioning Details"
                                >
                                  <List className="h-4 w-4" />
                                  <span className="sr-only">MNIT Details</span>
                                </Link>

                                <button
                                  onClick={() => handleDeleteClick(request)}
                                  disabled={deletingRequestId === request.id}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Delete Request"
                                >
                                  {deletingRequestId === request.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">Delete Request</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      {/* Mobile pagination */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{startIndex}</span> to{' '}
                          <span className="font-medium">{endIndex}</span> of{' '}
                          <span className="font-medium">{totalRequestsCount}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          {/* Previous button */}
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>

                          {/* Page numbers */}
                          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 7) {
                              pageNum = i + 1;
                            } else if (currentPage <= 4) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 3) {
                              pageNum = totalPages - 6 + i;
                            } else {
                              pageNum = currentPage - 3 + i;
                            }

                            const isCurrentPage = pageNum === currentPage;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  isCurrentPage
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}

                          {/* Next button */}
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Delete Confirmation Modal */}
              {showDeleteModal && requestToDelete && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                  <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Confirm Delete Request</h3>
                      </div>
                      <button onClick={handleDeleteCancel} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="mb-6">
                      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                        <p className="text-sm text-red-800">
                          <strong>Warning:</strong> This action cannot be undone. This will permanently delete the
                          security role request and all associated data including approvals and role selections.
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Request Details:</h4>
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 text-sm">
                          <div>
                            <dt className="font-medium text-gray-500">Employee Name:</dt>
                            <dd className="text-gray-900">{requestToDelete.employee_name}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-500">Submitted By:</dt>
                            <dd className="text-gray-900">{requestToDelete.submitter_name}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-500">Status:</dt>
                            <dd>
                              <span
                                className={clsx('px-2 inline-flex text-xs leading-5 font-semibold rounded-full', {
                                  'bg-yellow-100 text-yellow-800': requestToDelete.status === 'pending',
                                  'bg-green-100 text-green-800': requestToDelete.status === 'approved',
                                  'bg-blue-100 text-blue-800': requestToDelete.status === 'completed',
                                  'bg-gray-100 text-gray-800': requestToDelete.status === 'rejected',
                                })}
                              >
                                {requestToDelete.status.charAt(0).toUpperCase() + requestToDelete.status.slice(1)}
                              </span>
                            </dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-500">Submitted Date:</dt>
                            <dd className="text-gray-900">
                              {format(new Date(requestToDelete.created_at), 'MMM d, yyyy')}
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="font-medium text-gray-500">Security Areas:</dt>
                            <dd className="mt-1">
                              <div className="flex flex-wrap gap-1">
                                {requestToDelete.security_areas && requestToDelete.security_areas.length > 0 ? (
                                  requestToDelete.security_areas.map((area, index) => (
                                    <span
                                      key={`${requestToDelete.id}-${area.area_type}-${index}`}
                                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                      {areaLabels[area.area_type]}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-gray-400 text-xs">No areas selected</span>
                                )}
                              </div>
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="font-medium text-gray-500">Request ID:</dt>
                            <dd className="text-gray-900 font-mono text-xs">{requestToDelete.id}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={handleDeleteCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteConfirm}
                        disabled={deletingRequestId === requestToDelete.id}
                        className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingRequestId === requestToDelete.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                            Deleting...
                          </>
                        ) : (
                          'Confirm Delete'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RequestListPage;