import { HttpStatusCode } from '@/constants';
import { AuthContext } from '@/context';
import { useLocalStorage, useService } from '@/hooks';
import User from '@/models/User';
import { AuthService } from '@/services';
import env from '@/utils/env';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useState } from 'react';

/**
 * @typedef {{
 *  isSuccess: boolean;
 *  message: string;
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
 * }>}
 */

export default function AuthProvider({ children }) {
  const { execute: loginService, isLoading: loginIsLoading } = useService(AuthService.login);
  const { execute: logoutService, isLoading: logoutIsLoading } = useService(AuthService.logout);
  const { execute: forgotService, isLoading: forgotIsLoading } = useService(AuthService.forgot);
  const { execute: resetService, isLoading: resetIsLoading } = useService(AuthService.reset);
  const { execute: getUser, isLoading: getUserIsLoading } = useService(AuthService.me);
  const [token, setToken] = useLocalStorage('token', '');
  const [user, setUser] = useState(null);

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
  });

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    const fetchUser = async () => {
      try {
        const { code, data } = await getUser(token);
        if (code === HttpStatusCode.UNAUTHORIZED) {
          setToken('');
          return;
        }
        setUser(mapToUserInstance(data));
      } catch (error) {
        console.error('Error fetching user:', error);
        setToken('');
      }
    };

    fetchUser();
  }, [getUser, mapToUserInstance, setToken, token]);

  const login = useCallback(
    /**
     * @param {string} username
     * @param {string} password
     * @returns {Promise<Response>}
     */
    async (username, password) => {
      const { message, isSuccess, data: token } = await loginService(username, password);
      if (!isSuccess) return { message, isSuccess };

      setToken(token);
      return {
        isSuccess,
        message: 'Login berhasil'
      };
    },
    [loginService, setToken]
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
    setUser(null);
    setToken('');
    logoutService(token);
  }, [logoutService, setToken, token]);

  const onUnauthorized = useCallback(() => logout(), [logout]);

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        forgot,
        reset,
        token,
        user,
        isLoading: loginIsLoading || logoutIsLoading || getUserIsLoading || forgotIsLoading || resetIsLoading,
        onUnauthorized
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};
