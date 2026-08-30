// lib/utils/branch-filter.ts
import { AuthUser } from '@/lib/auth/types';

export function getBranchFilterForUser(user: AuthUser) {
  if (user.role === 'super_admin') {
    return null; // No filter
  }
  return user.branch_id;
}
