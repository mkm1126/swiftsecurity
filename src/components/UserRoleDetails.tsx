
import React from 'react';

type Props = {
  userDetails: any;
  roleSelections: any;
  onEditRoles?: () => void;    // kept for compatibility (not rendered here)
  onCopyRoles?: () => void;    // kept for compatibility (not rendered here)
};

// Pretty label from camelCase/snake_case
function labelize(key: string): string {
  // common friendly names
  const map: Record<string, string> = {
    voucherEntry: 'Voucher Entry',
    apInquiryOnly: 'AP Inquiry Only',
    matchOverride: 'Match Override',
    maintenanceVoucherBuildErrors: 'Maintenance Voucher Build Errors',
  };
  if (map[key]) return map[key];

  const cleaned = key.replace(/^sc_|^ss_|^cg_|^ap_|^ar_|^gl_|^kk_|^po_/, '');
  const words = cleaned
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, r'\1 \2')
    .split(' ')
    .filter(Boolean);
  return words.map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

const UserRoleDetails: React.FC<Props> = ({ userDetails, roleSelections }) => {
  if (!userDetails) return null;

  // Determine data source for role flags
  const source =
    (roleSelections?.role_selection_json && Object.keys(roleSelections.role_selection_json || {}).length > 0)
      ? roleSelections.role_selection_json
      : (roleSelections || {});

  // Collect true booleans (active roles)
  const activeBooleanRoles = Object.entries(source)
    .filter(([_, v]) => typeof v === 'boolean' && v === true)
    .map(([k]) => k);

  // Home BU(s)
  let homeBU: string[] = [];
  const rawHbu = roleSelections?.home_business_unit ?? source?.homeBusinessUnit;
  if (Array.isArray(rawHbu)) {
    homeBU = rawHbu;
  } else if (typeof rawHbu === 'string' && rawHbu.trim()) {
    homeBU = rawHbu.split(',').map(s => s.trim()).filter(Boolean);
  }

  // Security area info (Accounting / Procurement only is shown here)
  const acctArea = Array.isArray(userDetails?.security_areas)
    ? userDetails.security_areas.find((a: any) => a.area_type === 'accounting_procurement')
    : null;

  return (
    <div className="space-y-4">
      {/* Security Areas */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
            Accounting / Procurement
          </span>
        </div>
        <div className="text-sm text-blue-900">
          <div>
            Director:{' '}
            <strong>{acctArea?.director_name || '—'}</strong>
            {acctArea?.director_email && (
              <span className="text-blue-700"> ({acctArea.director_email})</span>
            )}
          </div>
        </div>
      </div>

      {/* Role Selections (no inner buttons) */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-green-900 font-semibold">Role Selections</h4>
        </div>

        <div className="text-sm text-green-900">
          <div className="mb-2">Active Roles:</div>
          {activeBooleanRoles.length === 0 ? (
            <p className="text-green-800">No active roles found.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeBooleanRoles.map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800"
                >
                  {labelize(k)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Business Unit Information */}
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
        <h4 className="text-purple-900 font-semibold mb-2">Business Unit Information</h4>
        <div className="text-sm text-purple-900">
          <div className="mb-1">
            <span className="font-medium">Home Business Unit:</span>{' '}
            {homeBU.length ? homeBU.join(', ') : '—'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRoleDetails;
