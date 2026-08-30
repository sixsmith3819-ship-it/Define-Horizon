// lib/constants/roles.ts
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  BRANCH_MANAGER: 'branch_manager',
  EMPLOYEE: 'employee',
  AUDITOR: 'auditor',
} as const;

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin: 'Full system access',
  branch_manager: 'Branch-level access',
  employee: 'Standard employee access',
  auditor: 'Read-only audit access',
};
