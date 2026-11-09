import { useCallback, useEffect, useState } from 'react';
import {
  getCurrentUser,
  login as authenticate,
  logout as endSession,
  register as createAccount,
} from '../api/auth';
import { AuthContext } from './authContext';

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    let active = true;

    getCurrentUser().then(({ user }) => {
      if (!active) return;
      setAccount(user);
      setIsDemo(false);
    }).catch(() => {
      // The public dashboard preview remains available when the API is offline.
    });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    await authenticate(username, password);
    const { user } = await getCurrentUser();
    setAccount(user);
    setIsDemo(false);
    return user;
  }, []);

  const register = useCallback((username, password) => {
    return createAccount(username, password);
  }, []);

  const logout = useCallback(async () => {
    try {
      await endSession();
    } finally {
      setAccount(null);
      setIsDemo(true);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ account, isDemo, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}
