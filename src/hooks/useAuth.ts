import { Capabilities } from '@/constants/Role';
import { AuthContext } from '@/context';
import User from '@/models/User';
import { useContext } from 'react';

/**
 * Response type for auth operations
 */
export interface AuthResponse {
  isSuccess: boolean;
  message: string;
  user?: User | null;
}

/**
 * Role check response type
 */
export interface RoleCheckResponse {
  role: string;
  capabilities: Capabilities;
}

/**
 * Auth context type definition
 */
export interface AuthContextType {
  // Auth actions
  login: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  forgot: (email: string) => Promise<AuthResponse>;
  reset: (token: string, password: string, confirmPassword: string) => Promise<AuthResponse>;
  onUnauthorized: () => void;

  // Auth state
  token: string;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Role & Capabilities state
  capabilities: Capabilities;
  isAdmin: boolean;
  isOPD: boolean;
  isGuest: boolean;
  isAuthenticated: boolean;

  // Role & Capability check functions
  checkUserRole: () => Promise<RoleCheckResponse>;
  hasCapability: (capability: keyof Capabilities) => boolean;
  hasPermission: (permission: string) => boolean;
  canAccessDashboard: () => boolean;
  canAccessMap: () => boolean;
  canViewMap: () => boolean;
  canCrudMap: () => boolean;
  canManageUsers: () => boolean;
  shouldBlurMap: () => boolean;
  getRedirectOptions: () => string[];
  getRedirectAfterLogin: () => string;
  getLoginMessage: () => string;
}

/**
 * Custom hook to access auth context
 * @returns Auth context with user state and authentication methods
 */
export default function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context as unknown as AuthContextType;
}
