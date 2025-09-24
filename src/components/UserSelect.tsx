import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SyntheticEvent } from "react";
// ⬇️ Adjust this import to match your project
import { supabase } from "../supabaseClient";

type RequestRow = {
  id: string;
  employee_name: string;
  employee_id: string;
  email: string | null;
  start_date?: string | null;
  work_location?: string | null;
  agency?: string | null;
  created_at?: string;
  updated_at?: string;
  // other request fields…
};

type RoleRow = {
  id: string;
  request_id: string;
  created_at?: string;
  updated_at?: string;
  // boolean flags
  voucher_entry?: boolean | null;
  maintenance_voucher_build_errors?: boolean | null;
  ap_inquiry_only?: boolean | null;
  match_override?: boolean | null;
  // the big JSON payload if present
  role_selection_json?: any | null;
};

type CopyPayload = {
  requestId: string;
  userDetails: {
    employeeName: string;
    employeeId: string;
    email?: string | null;
    workLocation?: string | null;
    agency?: string | null;
    startDate?: string | null;
  };
  roleSelections: Record<string, any>;
};

type Props = {
  /** Called after we have loaded the request + roles and staged the copy payload */
  onResolved?: (payload: CopyPayload) => void;
  /** Optional label for the dropdown */
  label?: string;
  /** Optional: current agency filter */
  agencyFilter?: string | null;
};

function normalizeRoleSelections(role: RoleRow | null): Record<string, any> {
  if (!role) return {};
  // Prefer JSON payload when present; otherwise fall back to DB booleans we know about.
  const json = (role.role_selection_json && typeof role.role_selection_json === "object")
    ? role.role_selection_json
    : null;

  const fromDbBooleans = {
    voucherEntry: !!role.voucher_entry,
    maintenanceVoucherBuildErrors: !!role.maintenance_voucher_build_errors,
    apInquiryOnly: !!role.ap_inquiry_only,
    matchOverride: !!role.match_override,
  };

  const merged = { ...(json ?? {}), ...fromDbBooleans };
  return merged;
}

export default function UserSelect({ onResolved, label = "Copy Existing User Access", agencyFilter = null }: Props) {
  const [allUsers, setAllUsers] = useState<RequestRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");
  const navigate = useNavigate();

  // Fetch a list of request rows that are eligible to copy from (approved/completed).
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        // ⚠️ Adjust table + filter logic to match your DB
        const { data, error } = await supabase
          .from("security_access_requests")
          .select("id, employee_name, employee_id, email, start_date, work_location, agency, created_at, updated_at, status")
          .in("status", ["approved", "completed"])
          .order("updated_at", { ascending: false });

        if (error) throw error;
        const rows = (data ?? []) as any[];
        const filtered = agencyFilter
          ? rows.filter(r => (r.agency ?? null) === agencyFilter)
          : rows;

        if (isMounted) {
          console.log("UserSelect.tsx:211 All users fetched from approved/completed requests:", filtered);
          setAllUsers(filtered);
        }
      } catch (e: any) {
        console.error("UserSelect: failed to fetch copyable users", e);
        if (isMounted) setError(e?.message ?? "Failed to fetch users");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [agencyFilter]);

  const onDropdownChange = async (e: SyntheticEvent<HTMLSelectElement>) => {
    const id = (e.currentTarget.value || "").trim();
    setSelectedRequestId(id);
    if (!id) return;

    const picked = allUsers.find(u => u.id === id);
    if (!picked) return;

    console.log(`UserSelect.tsx:277 🔧 UserSelect handleUserChange called with: ${picked.employee_name} (${picked.employee_id})`);
    console.log("UserSelect.tsx:286 🔧 Found user:", {
      employee_name: picked.employee_name,
      employee_id: picked.employee_id,
      email: picked.email,
      request_id: picked.id,
    });
    console.log("UserSelect.tsx:287 🔧 Calling onUserChange with user:", {
      employee_name: picked.employee_name,
      employee_id: picked.employee_id,
      email: picked.email,
      request_id: picked.id,
    });

    await fetchAndStageCopy(picked.id);
  };

  async function fetchAndStageCopy(requestId: string) {
    console.log("UserSelect.tsx:238 Fetching user details for request ID:", requestId);
    try {
      // ⚠️ Adjust table names/columns to match your schema
      const [{ data: requestRows, error: reqErr }, { data: roleRows, error: roleErr }] = await Promise.all([
        supabase.from("security_access_requests")
          .select("*")
          .eq("id", requestId)
          .maybeSingle(),
        supabase.from("security_access_roles")
          .select("*")
          .eq("request_id", requestId)
          .maybeSingle(),
      ]);

      if (reqErr) throw reqErr;
      if (roleErr) throw roleErr;

      const request = (requestRows as any) as RequestRow;
      const role    = (roleRows as any) as RoleRow | null;

      console.log("UserSelect.tsx:255 Request data fetched:", request);
      console.log("UserSelect.tsx:266 Role data fetched:", role);

      // Build payload
      const roleSelections = normalizeRoleSelections(role);
      const userDetails = {
        employeeName: request?.employee_name ?? "",
        employeeId: request?.employee_id ?? "",
        email: request?.email ?? null,
        workLocation: request?.work_location ?? null,
        agency: request?.agency ?? null,
        startDate: request?.start_date ?? null,
      };
      const payload: CopyPayload = {
        requestId,
        userDetails,
        roleSelections,
      };

      // Write to localStorage for SelectRolesPage to hydrate (Option A glue)
      try {
        localStorage.setItem("pendingFormData", "roles");
        localStorage.setItem("copiedRoleSelections", JSON.stringify(roleSelections));
        localStorage.setItem("copiedUserDetails", JSON.stringify(userDetails));
        localStorage.setItem("editingCopiedRoles", "true");
      } catch (e) {
        console.warn("UserSelect: failed to write to localStorage (continuing)", e);
      }

      // Fire a CustomEvent so listeners can hydrate immediately without navigation if desired
      try {
        window.dispatchEvent(new CustomEvent("copyUser:resolved", { detail: payload }));
      } catch { /* no-op */ }

      // Bubble to parent if they passed a callback
      onResolved?.(payload);

      // Navigate to roles route carrying state for immediate hydration as a fallback
      navigate("/roles", {
        replace: false,
        state: {
          fromCopyUser: true,
          requestId,
          copiedRoleSelections: payload.roleSelections,
          copiedUserDetails: payload.userDetails,
        },
      });
    } catch (e: any) {
      console.error("UserSelect: failed to fetch/stage copy payload", e);
      alert("Failed to load selection details for copy.");
    }
  }

  const options = useMemo(() => {
    return allUsers.map(u => (
      <option key={u.id} value={u.id}>
        {u.employee_name} ({u.employee_id})
      </option>
    ));
  }, [allUsers]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        className="w-full rounded border border-gray-300 p-2"
        value={selectedRequestId}
        onChange={onDropdownChange}
        disabled={isLoading || !!error}
      >
        <option value="">— Select a user —</option>
        {options}
      </select>
      {isLoading && <p className="text-sm text-gray-500">Loading users…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
