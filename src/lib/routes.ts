// Centralized route helpers based on your exact Router paths.
// /requests/:id/RequestDetailsPage
// /requests/:id/SelectRolesPage
// /requests/:id/HrPayrollRoleSelectionPage
// /requests/:id/EpmDwhRoleSelectionPage
// /requests/:id/ElmRoleSelectionPage

export type SecurityArea =
  | 'accounting_procurement'
  | 'hr_payroll'
  | 'epm_data_warehouse'
  | 'elm';

export const routes = {
  detailsEdit: (id: string) => `/requests/${id}/RequestDetailsPage`,

  // Role-selection pages by area
  acctRoles: (id: string) => `/requests/${id}/SelectRolesPage`,
  hrRoles: (id: string) => `/requests/${id}/HrPayrollRoleSelectionPage`,
  epmRoles: (id: string) => `/requests/${id}/EpmDwhRoleSelectionPage`,
  elmRoles: (id: string) => `/requests/${id}/ElmRoleSelectionPage`,
} as const;

export const roleRouteByArea: Record<SecurityArea, (id: string) => string> = {
  accounting_procurement: routes.acctRoles,
  hr_payroll: routes.hrRoles,
  epm_data_warehouse: routes.epmRoles,
  elm: routes.elmRoles,
};

export function toRolePath(area: SecurityArea, id: string): string {
  return roleRouteByArea[area](id);
}
