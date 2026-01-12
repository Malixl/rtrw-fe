import { HttpStatusCode } from '@/constants';
import Role, { DEFAULT_GUEST_CAPABILITIES } from '@/constants/Role';
import { AuthContext } from '@/context';
import { useLocalStorage, useService } from '@/hooks';
import User from '@/models/User';
import { AuthService } from '@/services';
import env from '@/utils/env';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * @typedef {{
 *  isSuccess: boolean;
 *  message: string;
 *  user?: import('@/models/User').default | null;
 * }} Response
 */

/**
 * @type {React.Context<{
 *  login: (email: string, password: string) => Promise<Response>;
 *  logout: () => void;
 *  forgot: (email: string) => Promise<Response>;
 *  reset: (token: string, password: string) => Promise<Response>;
 *  token: string;
 *  user: import('@/models/User').default | null;
 *  isLoading: boolean;
 *  onUnauthorized: () => void;
 *  capabilities: import('@/constants/Role').Capabilities;
 *  isAdmin: boolean;
 *  isOPD: boolean;
 *  isGuest: boolean;
 *  isAuthenticated: boolean;
 *  checkUserRole: () => Promise<{ role: string, capabilities: import('@/constants/Role').Capabilities }>;
 *  hasCapability: (capability: string) => boolean;
 *  canAccessDashboard: () => boolean;
 *  canAccessMap: () => boolean;
 *  canCrudMap: () => boolean;
 *  canManageUsers: () => boolean;
 *  getRedirectOptions: () => string[];
 * }>}
 */

export default function AuthProvider({ children }) {
  const { execute: loginService, isLoading: loginIsLoading } = useService(AuthService.login);
  const { execute: logoutService, isLoading: logoutIsLoading } = useService(AuthService.logout);
  const { execute: forgotService, isLoading: forgotIsLoading } = useService(AuthService.forgot);
  const { execute: resetService, isLoading: resetIsLoading } = useService(AuthService.reset);
  const { execute: checkRoleService } = useService(AuthService.checkRole);
  const { execute: getGuestCapabilitiesService } = useService(AuthService.getGuestCapabilities);

  const [token, setToken] = useLocalStorage('token', '');
  const [user, setUser] = useState(null);
  const [capabilities, setCapabilities] = useState(DEFAULT_GUEST_CAPABILITIES);
  const [isInitialized, setIsInitialized] = useState(false);

  // Computed role states
  const isAuthenticated = useMemo(() => !!token && !!user, [token, user]);
  const isAdmin = useMemo(() => user?.role === Role.ADMIN, [user]);
  const isOPD = useMemo(() => user?.role === Role.OPD, [user]);
  const isGuest = useMemo(() => !isAuthenticated || user?.role === Role.GUEST, [isAuthenticated, user]);

  const mapToUserInstance = useCallback(
    (rawUser) => {
      if (!rawUser) return null;
      if (rawUser instanceof User) return rawUser;
      return User.fromApiData(rawUser, token);
    },
    [token]
  );

  env.dev(() => {
    window.token = token;
    window.user = user;
    window.capabilities = capabilities;
  });

  // Load guest capabilities on init (when no token)
  useEffect(() => {
    if (!token) {
      const loadGuestCapabilities = async () => {
        const { data } = await getGuestCapabilitiesService();
        if (data?.capabilities) {
          setCapabilities(data.capabilities);
        }
      };
      loadGuestCapabilities();
    }
  }, [token, getGuestCapabilitiesService]);

  // Fetch user data when token exists
  useEffect(() => {
    console.log('[AUTH] useEffect start, token exists:', !!token);

    if (!token) {
      console.log('[AUTH] No token, setting initialized=true');
      setUser(null);
      setIsInitialized(true);
      return;
    }

    console.log('[AUTH] Token exists, fetching user...');

    AuthService.me(token)
      .then((response) => {
        console.log('[AUTH] Response received:', response);
        const { code, data, status: isSuccess } = response;

        if (!isSuccess || !data || code === HttpStatusCode.UNAUTHORIZED) {
          console.log('[AUTH] Invalid response, clearing token');
          setToken('');
          setUser(null);
          setCapabilities(DEFAULT_GUEST_CAPABILITIES);
        } else {
          console.log('[AUTH] Valid response, setting user');
          const userInstance = mapToUserInstance(data);
          setUser(userInstance);
          if (userInstance?.capabilities) {
            setCapabilities(userInstance.capabilities);
          }
        }
      })
      .catch((error) => {
        console.log('[AUTH] Error:', error);
        if (!(error instanceof Error && error.name === 'AbortError')) {
          setToken('');
          setUser(null);
          setCapabilities(DEFAULT_GUEST_CAPABILITIES);
        }
      })
      .finally(() => {
        console.log('[AUTH] Finally block, setting isInitialized=true');
        setIsInitialized(true);
      });
  }, [mapToUserInstance, setToken, token]);

  useEffect(() => {
    console.log('[AUTH] isInitialized changed:', isInitialized);
    console.log('[AUTH] Loading states - login:', loginIsLoading, 'logout:', logoutIsLoading, 'forgot:', forgotIsLoading, 'reset:', resetIsLoading);
    console.log('[AUTH] isLoading:', !isInitialized || loginIsLoading || logoutIsLoading || forgotIsLoading || resetIsLoading);
  }, [isInitialized, loginIsLoading, logoutIsLoading, forgotIsLoading, resetIsLoading]);

  // Check user role and capabilities
  const checkUserRole = useCallback(async () => {
    if (!token) {
      return { role: Role.GUEST, capabilities: DEFAULT_GUEST_CAPABILITIES };
    }

    try {
      const { data } = await checkRoleService(token);
      if (data) {
        setCapabilities(data.capabilities);
        return data;
      }
    } catch (error) {
      console.error('Error checking role:', error);
    }

    return { role: user?.role || Role.GUEST, capabilities };
  }, [token, checkRoleService, user, capabilities]);

  // Capability check helpers
  const hasCapability = useCallback(
    (capability) => {
      if (!capabilities) return false;
      const value = capabilities[capability];
      return typeof value === 'boolean' ? value : !!value;
    },
    [capabilities]
  );

  const canAccessDashboard = useCallback(() => capabilities?.can_access_dashboard ?? false, [capabilities]);
  const canAccessMap = useCallback(() => capabilities?.can_access_map ?? false, [capabilities]);
  const canViewMap = useCallback(() => capabilities?.can_view_map ?? false, [capabilities]);
  const canCrudMap = useCallback(() => capabilities?.can_crud_map ?? false, [capabilities]);
  const canManageUsers = useCallback(() => capabilities?.can_manage_users ?? false, [capabilities]);
  const shouldBlurMap = useCallback(() => capabilities?.show_blur_map ?? true, [capabilities]);
  const getRedirectOptions = useCallback(() => capabilities?.redirect_options ?? [], [capabilities]);
  const getRedirectAfterLogin = useCallback(() => {
    // Jika sudah login, redirect berdasarkan role
    if (isAuthenticated && user) {
      if (user.role === Role.ADMIN) return '/dashboard';
      if (user.role === Role.OPD) return '/map';
    }
    // Default redirect setelah login
    return capabilities?.redirect_after_login ?? '/map';
  }, [capabilities, isAuthenticated, user]);
  const getLoginMessage = useCallback(() => capabilities?.login_message ?? 'Silakan login untuk melihat peta secara lengkap', [capabilities]);

  // Permission check (untuk backward compatibility dengan spatie permissions)
  const hasPermission = useCallback(
    (permission) => {
      if (!user?.permissions) return false;
      return user.permissions.includes(permission);
    },
    [user]
  );

  const login = useCallback(
    /**
     * @param {string} username
     * @param {string} password
     * @returns {Promise<Response>}
     */
    async (username, password) => {
      const { message, isSuccess, data } = await loginService(username, password);
      if (!isSuccess) return { message, isSuccess, user: null };

      const { token: newToken, user: userData } = data;
      setToken(newToken);

      const userInstance = mapToUserInstance(userData);
      setUser(userInstance);

      if (userInstance?.capabilities) {
        setCapabilities(userInstance.capabilities);
      }

      return {
        isSuccess,
        message: 'Login berhasil',
        user: userInstance
      };
    },
    [loginService, setToken, mapToUserInstance]
  );

  const forgot = useCallback(
    /**
     * @param {string} email
     * @returns {Promise<Response>}
     */
    async (email) => {
      const { message, isSuccess } = await forgotService(email);
      if (!isSuccess) return { message, isSuccess };

      return {
        isSuccess,
        message: 'Email reset kata sandi telah dikirim'
      };
    },
    [forgotService]
  );

  const reset = useCallback(
    /**
     * @param {string} token
     * @param {string} password
     * @param {string} confirmPassword
     * @returns {Promise<Response>}
     */
    async (token, password, confirmPassword) => {
      const { message, isSuccess } = await resetService(token, password, confirmPassword);
      if (!isSuccess) return { message, isSuccess };

      return {
        isSuccess,
        message: 'Kata Sandi berhasil direset'
      };
    },
    [resetService]
  );

  const logout = useCallback(() => {
    logoutService(token);
    setUser(null);
    setToken('');
    setCapabilities(DEFAULT_GUEST_CAPABILITIES);
  }, [logoutService, setToken, token]);

  const onUnauthorized = useCallback(() => logout(), [logout]);

  return (
    <AuthContext.Provider
      value={{
        // Auth actions
        login,
        logout,
        forgot,
        reset,
        onUnauthorized,

        // Auth state
        token,
        user,
        isInitialized,
        isLoading: !isInitialized || loginIsLoading || logoutIsLoading || forgotIsLoading || resetIsLoading,

        // Role & Capabilities state
        capabilities,
        isAdmin,
        isOPD,
        isGuest,
        isAuthenticated,

        // Role & Capability check functions
        checkUserRole,
        hasCapability,
        hasPermission,
        canAccessDashboard,
        canAccessMap,
        canViewMap,
        canCrudMap,
        canManageUsers,
        shouldBlurMap,
        getRedirectOptions,
        getRedirectAfterLogin,
        getLoginMessage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};
