import { useState, useEffect } from 'react';
import { Participant } from '@packages/types/src';
import { authService } from '../services/auth';

export function useAuth() {
  const [user, setUser] = useState<Participant | null>(authService.getCurrentUser());

  const login = async (identifier: string) => {
    const res = await authService.login(identifier);
    setUser(res);
    return res;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return { user, login, logout, isAuthenticated: Boolean(user) };
}
