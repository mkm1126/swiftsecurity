import React from 'react';
import { CheckCircle, Shield } from 'lucide-react';

type RoleSelections = Record<string, any> | null | undefined;

interface UserRoleDetailsProps {
  userDetails: any;
  roleSelections: RoleSelections;
  onEditRoles?: () => void;   // kept for compatibility (not rendered here)
  onCopyRoles?: () => void;   // kept for compatibility (not rendered here)
}

/** Safe title case without regex backreferences or escape sequences */
function titleCase(input: string): string {
  if (!input) return '';
  const cleaned = String(input)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  const words = cleaned.split(' ');
  return words.map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
}

/** Collect boolean true fields as "active roles" */
function getActiveBooleanRoles(src: Record<string, any>) {
  const entries = Object.entries(src).filter(([key, val]) => typeof val === 'boolean' && val === true);
  // Exclude obvious non-role keys
  const exclude = new Set([
    'id','created_at','updated_at','request_id','roleJustification','role_justification',
    'homeBusinessUnit','home_business_unit','otherBusinessUnits','other_business_units'
  ]);
  return entries
    .filter(([k]) => !exclude.has(k))
    .map(([k]) => k);
}

/** Prefer role_selection_json when present with data; fall back to top-level columns */
function pickRoleSource(roleSelections: RoleSelections): Record<string, any> {
  if (!roleSelections) return {};
  const json = (roleSelections as any).role_selection_json;
  if (json && typeof json === 'object' && Object.keys(json).length > 0) return json as Record<string, any>;
  return roleSelections as Record<string, any>;
}

const UserRoleDetails: React.FC<UserRoleDetailsProps> = ({ userDetails, roleSelections }) => {
  const source = pickRoleSource(roleSelections);
  const activeRoles = getActiveBooleanRoles(source);
  const rawHomeBU = (source as any).homeBusinessUnit || (source as any).home_business_unit || '';

  // Format business units: if it's an array, join with commas; if string, split by known prefixes and join
  let homeBU = '';
  if (Array.isArray(rawHomeBU)) {
    homeBU = rawHomeBU.join(', ');
  } else if (typeof rawHomeBU === 'string' && rawHomeBU) {
    // Split concatenated codes like "G0201G0202G0203" into "G0201, G0202, G0203"
    const matches = rawHomeBU.match(/[A-Z]\d{4}/g);
    homeBU = matches ? matches.join(', ') : rawHomeBU;
  }

  return (
    <div className="space-y-4">
      {/* Security Areas */}
      <div className="border rounded-md p-4 bg-blue-50">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-blue-600" />
          <h5 className="font-semibold text-blue-900">Security Areas</h5>
        </div>
        {(userDetails?.security_areas || [])
          .filter((a: any) => a?.area_type === 'accounting_procurement')
          .map((a: any, idx: number) => (
            <div key={idx} className="rounded-md bg-white border px-3 py-2 text-sm">
              <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 mr-2">
                Accounting / Procurement
              </span>
              <span className="text-gray-700">
                <strong>Director:</strong> {a?.director_name || '—'}
                {a?.director_email ? (
                  <span className="text-gray-500"> ({a.director_email})</span>
                ) : null}
              </span>
            </div>
        ))}
      </div>

      {/* Role Selections */}
      <div className="border rounded-md p-4 bg-green-50">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h5 className="font-semibold text-green-900">Role Selections</h5>
        </div>
        {activeRoles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {activeRoles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 border border-green-200"
              >
                <span>✓</span>
                {titleCase(role)}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-green-900/70">No active roles were found for this user.</p>
        )}
      </div>

      {/* Business Unit */}
      <div className="border rounded-md p-4 bg-purple-50">
        <h5 className="font-semibold text-purple-900 mb-2">Business Unit Information</h5>
        <div className="text-sm">
          <div className="text-gray-600">Home Business Unit:</div>
          <div className="font-mono text-purple-900">{homeBU || '—'}</div>
        </div>
      </div>
    </div>
  );
};

export default UserRoleDetails;
