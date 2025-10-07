// src/MNITDetailsPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Settings2, Info, Copy as CopyIcon, Check as CheckIcon, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from './lib/supabase';
import Header from './components/Header';
import MultiSelect from './components/MultiSelect';
import { findBusinessUnitByCode } from './lib/businessUnitData';

type LocationState = { state?: { requestId?: string } };

// RPC payload types
type RpcSelectedRole = {
  flag_key: string;
  role_code: string | null;
  role_name: string;
};

type RpcRouteControl = {
  flag_key: string;
  role_code: string | null;
  role_name: string;
  control_key: string;
  label: string;
  type?: string | null;          // "multiselect" | "array" | "text" | etc.
  options?: any;                 // array or null
  value?: any;                   // array, string, null
  required?: boolean;
  pattern?: string | null;
  hint?: string | null;
  placeholder?: string | null;
};

type SelectionRow = Record<string, unknown> & { request_id: string };

const toStringArray = (v: any): string[] => {
  if (Array.isArray(v)) return v.map((x) => String(x ?? '')).filter(Boolean);
  if (v === null || v === undefined || v === '') return [];
  return [String(v)];
};
const toOptionsStringArray = (v: any): string[] =>
  Array.isArray(v) ? v.map((x) => String(x ?? '')).filter(Boolean) : [];
const looksLikeFiveDigitPattern = (p?: string | null) => Boolean(p && /\d{5}/.test(p));
const normalizeType = (t?: string | null) => {
  const x = (t || '').toLowerCase();
  return x === 'array' ? 'multiselect' : x || 'text';
};

export default function MNITDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation() as LocationState;
  const { id: routeId } = useParams<{ id: string }>();

  // Determine where the user came from for dynamic back navigation
  const fromSource = (location.state as any)?.from;
  const getBackLink = (requestId: string | null) => {
    if (fromSource === 'requestList') {
      return { to: '/requests', text: 'Back to Request List' };
    } else if (fromSource === 'requestDetails' && requestId) {
      return { to: `/requests/${requestId}`, text: 'Back to Request Details' };
    } else {
      return { to: '/', text: 'Back to Main Form' };
    }
  };

  const [requestId, setRequestId] = useState<string | null>(null);
  const [who, setWho] = useState<{ employee?: string; agency?: string }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Core data from RPC
  const [selectedRoles, setSelectedRoles] = useState<RpcSelectedRole[]>([]);
  const [routeControls, setRouteControls] = useState<RpcRouteControl[]>([]);
  const [selectionRow, setSelectionRow] = useState<SelectionRow | null>(null);

  // Edits keyed by flag_key::control_key
  const [edits, setEdits] = useState<Record<string, string[] | string>>({});

  // Fallback debug info when no roles found
  const [debug, setDebug] = useState<{
    trueFlags: string[];
    activeCatalogFlags: string[];
    intersection: string[];
  } | null>(null);

  // Compute back link based on source and requestId
  const backLink = useMemo(() => getBackLink(requestId), [fromSource, requestId]);

  // ID source of truth (route param first, then state)
  useEffect(() => {
    const idFromState = (location as any)?.state?.requestId as string | undefined;
    const id = routeId || idFromState;
    if (!id) {
      toast.error('Missing request id.');
      navigate('/');
      return;
    }
    setRequestId(id);
  }, [routeId, location, navigate]);

  // Load "who" and payload
  useEffect(() => {
    if (!requestId) return;
    (async () => {
      setLoading(true);
      setDebug(null);

      // Who
      const whoQ = await supabase
        .from('security_role_requests')
        .select('employee_name, agency_name')
        .eq('id', requestId)
        .single();
      if (whoQ.data) setWho({ employee: whoQ.data.employee_name, agency: whoQ.data.agency_name });

      // Load existing route control values from security_role_selections
      const { data: selectionData, error: selectionError } = await supabase
        .from('security_role_selections')
        .select('*')
        .eq('request_id', requestId)
        .single();

      if (selectionError) {
        console.error('Error loading selection data:', selectionError);
        toast.error('Failed to load existing route control values');
        setLoading(false);
        return;
      }

      // Debug: Log all the selection data to see what columns exist
      console.log('🔍 Full selection data from security_role_selections:', selectionData);
      console.log('🔍 Available columns:', Object.keys(selectionData || {}));
      
      // Check for voucher approver columns specifically
      const voucherColumns = Object.keys(selectionData || {}).filter(key => 
        key.toLowerCase().includes('voucher') && key.toLowerCase().includes('approver')
      );
      console.log('🔍 Voucher approver columns found:', voucherColumns);
      // Try RPC first (preferred)
      const rpc = await supabase.rpc('mnit_details_payload', { p_request_id: requestId });
      if (!rpc.error && rpc.data) {
        const roles = Array.isArray(rpc.data.selectedRoles) ? (rpc.data.selectedRoles as RpcSelectedRole[]) : [];
        const controls = Array.isArray(rpc.data.routeControls) ? (rpc.data.routeControls as RpcRouteControl[]) : [];

        // Override route control values with data from security_role_selections
        const enhancedControls = controls.map(rc => {
          // Try multiple possible column names for voucher approver route controls
          let columnValue = selectionData?.[rc.control_key];
          
          // If not found, try alternative column names
          if (!columnValue && rc.control_key === 'voucher_approver_1') {
            columnValue = selectionData?.['ap_voucher_approver_1_route_controls'] ||
                         selectionData?.['voucher_approver_1'] ||
                         selectionData?.['ap_voucher_approver_1_route_control'] ||
                         selectionData?.['voucher_approver_1_route_controls'];
          }
          
          console.log(`🔍 Loading existing value for ${rc.control_key}:`, {
            directLookup: selectionData?.[rc.control_key],
            finalValue: columnValue,
            allVoucherKeys: Object.keys(selectionData || {}).filter(k => k.includes('voucher'))
          });
          
          return {
            ...rc,
            value: columnValue || rc.value
          };
        });

        setSelectedRoles(roles);
        setRouteControls(enhancedControls);

        // Initialize edits from existing values (treat "array" like multiselect)
        const init: Record<string, string[] | string> = {};
        for (const rc of enhancedControls) {
          const k = `${rc.flag_key}::${rc.control_key}`;
          const t = normalizeType(rc.type);
          console.log(`🔍 Initializing edit for ${k} with value:`, rc.value);
          if (t === 'multiselect') {
            init[k] = toStringArray(rc.value);
          } else {
            init[k] = Array.isArray(rc.value) ? (rc.value[0] ? String(rc.value[0]) : '') : (rc.value ?? '');
          }
        }
        console.log('🔍 Initialized edits:', init);
        setEdits(init);
        setLoading(false);
        return;
      }

      // Fallback: view-based approach (older flow)
      const { data: roleRows, error: roleErr } = await supabase
        .from('active_roles_for_request')
        .select('request_id, flag_key, role_code, name, description, requires_route_controls, control_spec, domain, display_order')
        .eq('request_id', requestId)
        .order('domain', { ascending: true })
        .order('display_order', { ascending: true });

      if (roleErr) {
        toast.error('Could not load role metadata.');
        setLoading(false);
        return;
      }

      // Selection row to hydrate values
      const { data: selectionRow, error: selErr } = await supabase
        .from('security_role_selections')
        .select('*')
        .eq('request_id', requestId)
        .single();

      if (selErr || !selectionRow) {
        toast.error('Could not load your current selections.');
        setLoading(false);
        return;
      }

      // Store selection row for business units display
      setSelectionRow(selectionRow);

      // Build "selectedRoles"
      const sr: RpcSelectedRole[] = (roleRows || []).map((r: any) => ({
        flag_key: r.flag_key,
        role_code: r.role_code,
        role_name: r.name,
      }));

      // Build "routeControls" by expanding control_spec.controls for requires_route_controls
      const rcList: RpcRouteControl[] = [];
      for (const r of roleRows || []) {
        if (!r.requires_route_controls) continue;
        const spec = typeof r.control_spec === 'string'
          ? safeJsonParse(r.control_spec, { controls: [] as any[] })
          : (r.control_spec || { controls: [] });
        const controls = Array.isArray(spec.controls) ? spec.controls : [];
        for (const c of controls) {
          rcList.push({
            flag_key: r.flag_key,
            role_code: r.role_code,
            role_name: r.name,
            control_key: String(c.column),
            label: String(c.label ?? c.column),
            type: normalizeType(c.type),
            options: Array.isArray(c.options) ? c.options : [],
            value: selectionRow ? (selectionRow as any)[c.column] ?? null : null,
            required: Boolean(c.required),
            pattern: c.pattern ?? null,
            hint: c.hint ?? null,
            placeholder: c.placeholder ?? null,
          });
        }
      }

      setSelectedRoles(sr);
      setRouteControls(rcList);

      // Initialize edits from existing values
      const init: Record<string, string[] | string> = {};
      for (const rc of rcList) {
        const k = `${rc.flag_key}::${rc.control_key}`;
        const t = normalizeType(rc.type);
        if (t === 'multiselect') {
          init[k] = toStringArray(rc.value);
        } else {
          init[k] = Array.isArray(rc.value) ? (rc.value[0] ? String(rc.value[0]) : '') : (rc.value ?? '');
        }
      }
      setEdits(init);

      // Helpful debug if nothing shows
      if ((sr?.length ?? 0) === 0) {
        const trueFlags = Object.entries(selectionRow as SelectionRow)
          .filter(([k, v]) => typeof v === 'boolean' && v === true)
          .map(([k]) => k)
          .sort();

        const { data: catalog } = await supabase
          .from('role_catalog')
          .select('flag_key, is_active');

        const activeCatalogFlags = (catalog || [])
          .filter((r: any) => r.is_active)
          .map((r: any) => r.flag_key)
          .sort();

        const activeSet = new Set(activeCatalogFlags);
        const intersection = trueFlags.filter((k) => activeSet.has(k));

        setDebug({ trueFlags, activeCatalogFlags, intersection });
      }

      setLoading(false);
    })();
  }, [requestId]);

  const controlsByRole = useMemo(() => {
    const map: Record<string, RpcRouteControl[]> = {};
    for (const rc of routeControls) {
      if (!map[rc.flag_key]) map[rc.flag_key] = [];
      map[rc.flag_key].push(rc);
    }
    return map;
  }, [routeControls]);

  const rolesWithControls = useMemo(
    () => selectedRoles.filter((r) => (controlsByRole[r.flag_key]?.length ?? 0) > 0),
    [selectedRoles, controlsByRole]
  );

  const updateMulti = (flag: string, key: string, values: string[], pattern?: string | null) => {
    const fiveDigit = looksLikeFiveDigitPattern(pattern);
    const normed = values
      .map((v) => String(v ?? ''))
      .map((v) => (fiveDigit ? v.replace(/\D/g, '') : v.trim().toUpperCase()))
      .filter(Boolean);
    const deduped = Array.from(new Set(normed));
    setEdits((prev) => ({ ...prev, [`${flag}::${key}`]: deduped }));
  };

  const updateText = (flag: string, key: string, value: string, pattern?: string | null) => {
    const fiveDigit = looksLikeFiveDigitPattern(pattern);
    const normed = fiveDigit ? value.replace(/\D/g, '') : value.trim();
    setEdits((prev) => ({ ...prev, [`${flag}::${key}`]: normed }));
  };

  function validateBeforeSave(): { ok: boolean; message?: string } {
    for (const r of selectedRoles) {
      const fields = controlsByRole[r.flag_key] || [];
      for (const f of fields) {
        const k = `${f.flag_key}::${f.control_key}`;
        const t = normalizeType(f.type);
        const isMulti = t === 'multiselect';
        const val = edits[k];
        const arr = isMulti ? (toStringArray(val) as string[]) : [String(val ?? '')];

        if (f.required && arr.length === 0) {
          return { ok: false, message: `${r.role_name}: ${f.label} is required` };
        }
        if (f.pattern) {
          let rx: RegExp | null = null;
          try { rx = new RegExp(f.pattern); } catch { rx = null; }
          if (rx && arr.some((v) => !rx!.test(v))) {
            return { ok: false, message: `${r.role_name}: ${f.label} has invalid entries` };
          }
        }
      }
    }
    return { ok: true };
  }

  async function handleSave() {
    if (!requestId) return;

    const check = validateBeforeSave();
    if (!check.ok) {
      toast.error(check.message || 'Validation failed.');
      return;
    }

    setSaving(true);

    // Try preferred path: upsert into request_route_control_values
    let usedRpcUpsert = false;
    try {
      for (const r of selectedRoles) {
        const fields = controlsByRole[r.flag_key] || [];
        for (const f of fields) {
          const k = `${f.flag_key}::${f.control_key}`;
          const t = normalizeType(f.type);
          const isMulti = t === 'multiselect';
          const val = edits[k];

          const payloadValue = isMulti ? toStringArray(val) : (val == null ? '' : String(val));

          const { error: upErr } = await supabase.rpc('upsert_route_control_value', {
            p_request_id: requestId,
            p_flag_key: f.flag_key,
            p_control_key: f.control_key,
            p_value: payloadValue as any,
          });
          if (upErr) throw upErr;
        }
      }
      usedRpcUpsert = true;
    } catch (_e) {
      // Fallback to updating array columns on security_role_selections
      try {
        const sel = await supabase
          .from('security_role_selections')
          .select('*')
          .eq('request_id', requestId)
          .single();

        if (!sel.error && sel.data) {
          const selectionColumns = new Set(Object.keys(sel.data as SelectionRow));
          const updatePayload: Record<string, string[] | null> = {};

          for (const r of selectedRoles) {
            const fields = controlsByRole[r.flag_key] || [];
            for (const f of fields) {
              const k = `${f.flag_key}::${f.control_key}`;
              const t = normalizeType(f.type);
              if (!selectionColumns.has(f.control_key)) continue;
              if (t !== 'multiselect') continue; // parity with earlier approach

              const vals = toStringArray(edits[k]);
              updatePayload[f.control_key] = vals.length ? vals : null;
            }
          }

          if (Object.keys(updatePayload).length > 0) {
            const { error: updErr } = await supabase
              .from('security_role_selections')
              .update(updatePayload)
              .eq('request_id', requestId);
            if (updErr) throw updErr;
          }
        } else {
          throw sel.error || new Error('selection row not found');
        }
      } catch (fallbackErr) {
        setSaving(false);
        toast.error('Failed to save MNIT route controls.');
        console.error('MNIT save error', fallbackErr);
        return;
      }
    }

    setSaving(false);
    toast.success(usedRpcUpsert ? 'MNIT route controls saved.' : 'MNIT route controls saved (fallback).');
    navigate('/success', { state: { requestId } });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="MNIT Details" subtitle="Provide route controls required for the roles you selected" />

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Link to={backLink.to} className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backLink.text}
            </Link>
            {requestId && <CopyIdPill idText={requestId} />}
          </div>

          {/* Home Business Units */}
          {selectionRow?.home_business_unit && (() => {
            const hbu = selectionRow.home_business_unit;
            let businessUnitCodes: string[] = [];

            // Parse home_business_unit based on format
            if (Array.isArray(hbu)) {
              businessUnitCodes = hbu;
            } else if (typeof hbu === 'string' && hbu) {
              const trimmed = hbu.trim();
              // Skip empty array representations
              if (trimmed !== '[]' && trimmed !== '{}' && trimmed !== '') {
                businessUnitCodes = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
              }
            }

            if (businessUnitCodes.length === 0) return null;

            return (
              <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Home Business Units</h2>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-2">
                    {businessUnitCodes.map((code, index) => {
                      const bu = findBusinessUnitByCode(code);
                      return (
                        <div key={index} className="flex items-start">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                            {code}
                          </span>
                          {bu && (
                            <span className="ml-2 text-sm text-gray-600">
                              {bu.description}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex items-center">
              <Settings2 className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Active Roles for this Request</h2>
                {who.employee && (
                  <p className="mt-1 text-sm text-blue-700">
                    For <strong>{who.employee}</strong>{who.agency ? ` at ${who.agency}` : ''}
                  </p>
                )}
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded px-2 py-1"
                >
                  {showDebug ? 'Hide' : 'Show'} Debug
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {loading && <div className="text-sm text-gray-600">Loading role details…</div>}

              {!loading && selectedRoles.length === 0 && (
                <div className="space-y-3">
                  <div className="flex items-start p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
                    <Info className="h-5 w-5 mr-2 mt-0.5" />
                    <div className="text-sm">
                      No active roles found for this request.<br />
                      Return to the role selection pages to choose roles, or ensure <code>role_catalog</code> has the matching <em>flag_key</em> rows.
                    </div>
                  </div>
                  {debug && (
                    <div className="p-3 border rounded bg-gray-50 text-xs text-gray-700">
                      <div className="font-semibold mb-1">Why empty?</div>
                      <div>Request ID: <span className="font-mono">{requestId}</span></div>
                      <div className="mt-1">Booleans TRUE in selection: {debug.trueFlags.length}</div>
                      <div className="mt-1">Active catalog flags: {debug.activeCatalogFlags.length}</div>
                      <div className="mt-1">Intersection (should render): {debug.intersection.length}</div>
                    </div>
                  )}
                </div>
              )}

              {!loading && selectedRoles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedRoles.map((r) => (
                    <a
                      key={r.flag_key}
                      href={`#role-${r.flag_key}`}
                      className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs hover:bg-gray-200"
                      title={`${r.role_name} [${r.role_code ?? '—'}]`}
                    >
                      {r.role_name}
                      {r.role_code ? (
                        <CodePill code={r.role_code} />
                      ) : (
                        <span className="ml-1 text-[10px] rounded bg-yellow-50 text-yellow-800 px-1.5 py-0.5">
                          No code (catalog?)
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              )}

              {/* Role cards */}
              {!loading &&
                selectedRoles.map((r) => {
                  const fields = controlsByRole[r.flag_key] || [];
                 console.log(`🔍 Role ${r.flag_key} has ${fields.length} fields:`, fields);
                  return (
                    <div key={r.flag_key} id={`role-${r.flag_key}`} className="rounded-lg border border-gray-200 shadow-sm">
                      <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold truncate">{r.role_name}</div>
                            {r.role_code ? (
                              <CodePill code={r.role_code} />
                            ) : (
                              <span className="text-[10px] rounded bg-gray-100 text-gray-500 px-1.5 py-0.5">No code</span>
                            )}
                          </div>
                        </div>
                        {fields.length > 0 ? (
                          <span className="text-xs rounded-full bg-blue-50 text-blue-700 px-2 py-0.5">Route controls</span>
                        ) : (
                          <span className="text-xs rounded-full bg-gray-100 text-gray-500 px-2 py-0.5">No inputs</span>
                        )}
                      </div>

                      {fields.length > 0 && (
                        <div className="p-4 space-y-5">
                          {fields.map((f) => {
                           console.log(`🔍 Rendering field:`, f);
                            const k = `${f.flag_key}::${f.control_key}`;
                            const t = normalizeType(f.type);
                            const isMulti = t === 'multiselect';

                            // Tiny guard: ensure selected values appear as options too
                            const valArr = toStringArray(edits[k]);
                            const optsMerged = Array.from(
                              new Set([
                                ...toOptionsStringArray(f.options || []),
                                ...valArr,
                              ])
                            );

                           console.log(`🔍 Field ${k}: type=${t}, isMulti=${isMulti}, valArr=`, valArr, 'optsMerged=', optsMerged);
                            return (
                              <div key={k} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                {showDebug && (
                                  <div className="mb-2 text-xs text-gray-500 font-mono">
                                    Debug: {k} | Type: {t} | Required: {f.required ? 'Yes' : 'No'}
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <label className="block text-sm font-medium text-gray-700">{f.label}</label>
                                  {f.required && <span className="text-red-500">*</span>}
                                </div>

                                {isMulti ? (
                                  <div className="mt-1">
                                    {showDebug && <div className="text-xs text-blue-600">Multi-select field (array type)</div>}
                                      <textarea
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows={3}
                                        value={valArr.join('\n')}
                                        onChange={(e) => {
                                          const lines = e.target.value.split('\n').map(line => line.trim()).filter(Boolean);
                                          console.log(`🔍 Updating ${k} with lines:`, lines);
                                          updateMulti(f.flag_key, f.control_key, lines, f.pattern);
                                        }}
                                        placeholder={f.placeholder ?? 'Enter department IDs (one per line)...'}
                                        aria-label={`${r.role_name}: ${f.label}`}
                                      />
                                    <div className="text-xs text-gray-500">
                                      {showDebug ? (
                                        <>Enter one department ID per line. Current values: {valArr.length}</>
                                      ) : (
                                        <>Enter one department ID per line</>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-1">
                                    {showDebug && <div className="text-xs text-blue-600 mb-1">Text field (single value)</div>}
                                    <input
                                      type="text"
                                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      value={
                                        typeof edits[k] === 'string'
                                          ? (edits[k] as string)
                                          : Array.isArray(edits[k])
                                          ? ((edits[k] as string[])[0] ?? '')
                                          : ''
                                      }
                                      onChange={(e) => updateText(f.flag_key, f.control_key, e.target.value, f.pattern)}
                                      placeholder={f.placeholder ?? 'Enter value...'}
                                      aria-label={`${r.role_name}: ${f.label}`}
                                    />
                                  </div>
                                )}

                                <div className="mt-1 flex items-center justify-between">
                                  {f.hint ? (
                                    <p className="text-xs text-gray-500">{f.hint}</p>
                                  ) : (
                                    <span className="text-xs text-gray-400">{f.required ? 'Required' : 'Optional'}</span>
                                  )}
                                  {f.pattern && (
                                    <span className="text-[10px] font-mono text-gray-400" title="Validation pattern">
                                      Pattern: {f.pattern}
                                    </span>
                                  )}
                                </div>
                                {showDebug && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    Debug: Raw value from DB: {JSON.stringify(f.value)}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2">
                {showDebug ? (
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Selected roles are listed above with their codes. Only the route-control fields shown are saved.</div>
                    <div className="text-gray-400">
                      Debug: {selectedRoles.length} roles, {routeControls.length} route controls, {rolesWithControls.length} roles with controls
                    </div>
                    <div className="text-gray-400 font-mono text-[10px]">
                      Route controls data: {JSON.stringify(routeControls.slice(0, 2), null, 2)}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    Selected roles are listed above with their codes. Only the route-control fields shown are saved.
                  </div>
                )}
                <div className="flex space-x-3">
                  <Link
                    to={backLink.to}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Cancel
                  </Link>
                  <button
                    type="button"
                    disabled={saving || loading || routeControls.length === 0}
                    onClick={handleSave}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      saving || loading || routeControls.length === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving…' : 'Save MNIT Details'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            Tip: add or change role metadata in <code>role_catalog</code>. This page renders dynamically from that table or the RPC payload.
          </div>
        </div>
      </div>
    </div>
  );
}

/** Small pill that shows [ROLE_CODE] with copy-to-clipboard */
function CodePill({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
      toast.success('Role code copied');
    } catch {
      toast.error('Could not copy code');
    }
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono rounded bg-gray-100 text-gray-700 px-1.5 py-0.5">
      <Hash className="w-3 h-3 opacity-70" />
      [{code}]
      <button type="button" onClick={copy} className="ml-0.5 inline-flex items-center" aria-label="Copy role code" title="Copy role code">
        {copied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
      </button>
    </span>
  );
}

/** Tiny "Copy ID" pill for the page header */
function CopyIdPill({ idText }: { idText: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(idText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {/* ignore */}
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 text-[11px] font-mono rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 border border-gray-200"
      title="Copy Request ID"
    >
      ID:{' '}
      <span className="max-w-[180px] truncate">{idText}</span>
      {copied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
    </button>
  );
}

// Local helper for safe JSON parse used in fallback
function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}