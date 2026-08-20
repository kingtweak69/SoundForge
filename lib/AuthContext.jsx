import React, { createContext, useContext } from 'react';
import { db } from '@/lib/localdb';

/* Local-only auth. The app runs standalone, so there is nobody to sign in as
 * beyond the person at the keyboard — this keeps the same context shape the
 * rest of the app consumes, with every gate open. */

const AuthContext = createContext(null);

const LOCAL_USER = { id: 'local', full_name: 'Local User', email: 'local@soundforge', role: 'owner' };

export const AuthProvider = ({ children }) => {
  const value = {
    user: LOCAL_USER,
    isAuthenticated: true,
    isLoadingAuth: false,
    isLoadingPublicSettings: false,
    authError: null,
    appPublicSettings: { public_settings: {} },
    login: db.auth.login,
    logout: db.auth.logout,
    navigateToLogin: () => {},
    refreshUser: async () => LOCAL_USER,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export default AuthContext;
