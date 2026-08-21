import { useState } from 'react';
import { adminAuthService } from '../services/auth';
import { AdminRole } from '@packages/types/src';

export function useAdmin() {
  const [role, setRoleState] = useState<AdminRole>(adminAuthService.getRole());

  const setRole = (newRole: AdminRole) => {
    adminAuthService.setRole(newRole);
    setRoleState(newRole);
  };

  return { role, setRole };
}
