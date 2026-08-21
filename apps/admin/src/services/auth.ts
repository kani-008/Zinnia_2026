import { store } from '../../../src/services/store';
import { AdminRole } from '@packages/types/src';

export const adminAuthService = {
  getRole: (): AdminRole => store.getAdminRole(),
  setRole: (role: AdminRole) => store.setAdminRole(role)
};
