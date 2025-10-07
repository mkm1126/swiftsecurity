// RoleSelectionsSummary.tsx (v2 - tolerant)
// Shows ALL selected roles for a request, even if catalog rows are missing or inactive.
// - No is_active filter (we fetch entire catalog, then order)
// - Truthiness handles booleans and common string forms ("true","1","t","yes","on")
// - Fallback: any truthy selection key without a catalog match is still shown with a title-cased label
// - Groups by domain; unknown keys are grouped under "Other"

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';

type RoleCatalog = {
  flag_key: string;
  name: string;
  domain: string;
  display_order: number | null;
  requires_route_controls: boolean | null;
  control_spec: any;
  is_active?: boolean | null;
};

type Props = {
  requestId: string;
  title?: string;
  className?: string;
};

function snakeToCamel(s: string) {
  return s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function titleCase(s: string) {
  return s.replace(/[_\-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

// Treats common stringy booleans as true
function isTruthy(v: any): boolean {
  if (v === true) return true;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') {
    const n = v.trim().toLowerCase();
    return n === 'true' || n === 't' || n === '1' || n === 'yes' || n === 'y' || n === 'on';
  }
  return false;
}

const RoleSelectionsSummary: React.FC<Props> = ({ requestId, title = 'Role Selections', className = '' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<Record<string, any> | null>(null);
  const [catalog, setCatalog] = useState<RoleCatalog[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Selection row (all columns)
        const { data: sel, error: selErr } = await supabase
          .from('security_role_selections')
          .select('*')
          .eq('request_id', requestId)
          .maybeSingle();
        if (selErr) throw selErr;
        if (!isMounted) return;
        setSelection(sel ?? null);

        // Full role catalog (no is_active filter); order by domain + display_order
        const { data: rc, error: rcErr } = await supabase
          .from('role_catalog')
          .select('flag_key, name, domain, display_order, requires_route_controls, control_spec, is_active')
          .order('domain', { ascending: true })
          .order('display_order', { ascending: true, nullsFirst: true });
        if (rcErr) throw rcErr;
        if (!isMounted) return;
        setCatalog(rc ?? []);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message ?? String(e));
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [requestId]);

  const derived = useMemo(() => {
    const pickedFromCatalog: RoleCatalog[] = [];
    const fallbackKeys: string[] = [];

    if (!selection) return { pickedFromCatalog, fallbackKeys, grouped: [] as Array<[string, RoleCatalog[]]>, total: 0 };

    console.log('🔍 RoleSelectionsSummary - catalog length:', catalog.length);
    console.log('🔍 RoleSelectionsSummary - roles with requires_route_controls:',
      catalog.filter(r => r.requires_route_controls).map(r => r.flag_key));

    const seen = new Set<string>();
    // 1) walk catalog to find selected roles
    for (const rc of catalog) {
      const snake = rc.flag_key;
      const camel = snakeToCamel(snake);
      const vSnake = selection[snake];
      const vCamel = selection[camel];
      const isSelected = isTruthy(vSnake) || isTruthy(vCamel);
      if (isSelected) {
        console.log(`🔍 Selected role: ${rc.flag_key}, requires_route_controls: ${rc.requires_route_controls}, control_spec:`, rc.control_spec);
        pickedFromCatalog.push(rc);
        seen.add(snake);
        seen.add(camel);
      }
    }

    // 2) fallback for any truthy keys that weren't in the catalog
    for (const [key, value] of Object.entries(selection)) {
      if (seen.has(key)) continue;
      if (!isTruthy(value)) continue;
      // Skip obvious non-role fields by heuristic
      if (['id','request_id','created_at','updated_at','role_justification','home_business_unit','other_business_units'].includes(key)) continue;

      fallbackKeys.push(key);
      pickedFromCatalog.push({
        flag_key: key,
        name: titleCase(key),
        domain: 'other',
        display_order: null,
        requires_route_controls: false,
        control_spec: null,
        is_active: null,
      });
    }

    // 3) group by domain
    const byDomain = new Map<string, RoleCatalog[]>();
    for (const r of pickedFromCatalog) {
      const arr = byDomain.get(r.domain) ?? [];
      arr.push(r);
      byDomain.set(r.domain, arr);
    }
    const grouped = Array.from(byDomain.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    return { pickedFromCatalog, fallbackKeys, grouped, total: pickedFromCatalog.length };
  }, [selection, catalog]);

  if (loading) {
    return (
      <div className={`rounded-md border border-gray-200 bg-white p-4 ${className}`}>
        <div className="text-sm text-gray-500">Loading {title}…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-md border border-red-200 bg-red-50 p-4 ${className}`}>
        <div className="text-sm text-red-700">Error loading {title}: {error}</div>
      </div>
    );
  }

  if (!selection || derived.total === 0) {
    return (
      <div className={`rounded-md border border-yellow-200 bg-yellow-50 p-4 ${className}`}>
        <div className="text-sm text-yellow-800">No roles selected.</div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-gray-200 bg-white ${className}`}>
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-xs text-gray-500">
          Showing all selected roles with their routing details. Items with routing controls are marked with <span className="font-semibold text-blue-600">•</span>.
        </p>
        {derived.fallbackKeys.length > 0 && (
          <p className="mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-block">
            {derived.fallbackKeys.length} role key{derived.fallbackKeys.length > 1 ? 's' : ''} not found in role catalog:
            {' '}{derived.fallbackKeys.slice(0,6).join(', ')}{derived.fallbackKeys.length > 6 ? '…' : ''}
          </p>
        )}
      </div>

      <div className="p-4 space-y-4">
        {derived.grouped.map(([domain, roles]) => (
          <div key={domain}>
            <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
              {titleCase(domain)}
            </div>
            <ul className="space-y-2">
              {roles.map((r) => {
                // Get route control values for this role
                const routeControls: Array<{ label: string; value: any }> = [];
                if (r.requires_route_controls && r.control_spec) {
                  console.log(`🔍 Processing route controls for role: ${r.flag_key}`);
                  try {
                    const spec = typeof r.control_spec === 'string'
                      ? JSON.parse(r.control_spec)
                      : r.control_spec;
                    console.log(`🔍 Parsed spec for ${r.flag_key}:`, spec);
                    const controls = Array.isArray(spec?.controls) ? spec.controls : [];
                    console.log(`🔍 Controls array for ${r.flag_key}:`, controls);

                    for (const ctrl of controls) {
                      const colName = ctrl.column;
                      const value = selection?.[colName];
                      console.log(`🔍 Checking column ${colName} for ${r.flag_key}, value:`, value);
                      if (value !== null && value !== undefined && value !== '' && value !== false) {
                        // Format the value nicely
                        let displayValue = value;
                        if (Array.isArray(value)) {
                          displayValue = value.join(', ');
                        } else if (typeof value === 'string' && value.includes('\n')) {
                          displayValue = value.split('\n').filter(Boolean).join(', ');
                        }
                        routeControls.push({
                          label: ctrl.label || colName,
                          value: displayValue
                        });
                      }
                    }
                  } catch (err) {
                    console.error('Error parsing control_spec for', r.flag_key, ':', err);
                  }
                }

                return (
                  <li key={r.flag_key} className="text-sm">
                    <div className="text-gray-800 font-medium">
                      {r.name}
                      {r.requires_route_controls && <span title="Has routing details" className="ml-1 text-blue-600">•</span>}
                    </div>
                    {routeControls.length > 0 && (
                      <div className="ml-4 mt-1 space-y-1">
                        {routeControls.map((rc, idx) => (
                          <div key={idx} className="text-xs text-gray-600">
                            <span className="font-medium">{rc.label}:</span>{' '}
                            <span className="text-gray-700">{rc.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoleSelectionsSummary;
