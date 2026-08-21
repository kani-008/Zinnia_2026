import { useAdmin } from './useAdmin';
import { AdminRole } from '@packages/types/src';

export function usePermissions() {
  const { role } = useAdmin();

  const canAccess = (allowedRoles: AdminRole[]) => {
    return allowedRoles.includes(role);
  };

  return { role, canAccess };
}
