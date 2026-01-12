import { createContext } from 'react';
import { DEFAULT_GUEST_CAPABILITIES } from '@/constants/Role';

const AuthContext = createContext({
  // Auth actions
  login: () => Promise.resolve({ isSuccess: false, message: '', user: null }),
  logout: () => undefined,
  forgot: () => Promise.resolve({ isSuccess: false, message: '' }),
  reset: () => Promise.resolve({ isSuccess: false, message: '' }),

  // Auth state
  token: JSON.parse(localStorage.getItem('token'))?.data || '',
  user: null,
  isLoading: false,
  isInitialized: false,
  onUnauthorized: () => { },

  // Role & Capabilities state
  capabilities: DEFAULT_GUEST_CAPABILITIES,
  isAdmin: false,
  isOPD: false,
  isGuest: true,
  isAuthenticated: false,

  // Role & Capability check functions
  checkUserRole: () => Promise.resolve({ role: 'guest', capabilities: DEFAULT_GUEST_CAPABILITIES }),
  hasCapability: () => false,
  hasPermission: () => false,
  canAccessDashboard: () => false,
  canAccessMap: () => false,
  canViewMap: () => false,
  canCrudMap: () => false,
  canManageUsers: () => false,
  shouldBlurMap: () => true,
  getRedirectOptions: () => [],
  getRedirectAfterLogin: () => '/auth/login',
  getLoginMessage: () => 'Silakan login untuk melihat peta secara lengkap'
});

export default AuthContext;
