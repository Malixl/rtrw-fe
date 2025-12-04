import { User } from '@/models';
import api from '@/utils/api';
import { DEFAULT_GUEST_CAPABILITIES } from '@/constants/Role';

export default class AuthService {
  /**
   * Logs in a user with the provided email and password.
   * @param {string} email - The email of the user.
   * @param {string} password - The password of the user.
   * @returns {Promise<{
   *   code: HTTPStatusCode,
   *   status: boolean,
   *   message: string,
   *   data?: { token: string, user: User }
   * }>} - A promise that resolves to an object containing the HTTP status code, status, message, token, and user data with capabilities.
   */
  static async login(email, password) {
    const response = await api.post('/auth/login', { body: { email, password } });
    if (!response.data) return response;

    const { token, user } = response.data;

    return {
      ...response,
      data: {
        token,
        user: User.fromApiData(user, token)
      }
    };
  }

  /**
   * @param {string} token
   * @returns {Promise<Promise<{
   *   code: HTTPStatusCode,
   *   status: boolean,
   *   message: string,
   *   data?: User
   * }>}
   */
  static async me(token) {
    const response = await api.get('/auth/me', { token });
    if (!response.data) return response;
    return { ...response, data: User.fromApiData(response.data, token) };
  }

  /**
   * Check current user's role and capabilities
   * @param {string} token
   * @returns {Promise<{
   *   code: HTTPStatusCode,
   *   status: boolean,
   *   message: string,
   *   data?: { role: string, capabilities: import('@/constants/Role').Capabilities }
   * }>}
   */
  static async checkRole(token) {
    const response = await api.get('/role/check', { token });
    if (!response.data) return response;
    return {
      ...response,
      data: {
        role: response.data.role,
        capabilities: response.data.capabilities
      }
    };
  }

  /**
   * Get guest capabilities (for unauthenticated users)
   * @returns {Promise<{
   *   code: HTTPStatusCode,
   *   status: boolean,
   *   message: string,
   *   data?: { role: string, capabilities: import('@/constants/Role').Capabilities }
   * }>}
   */
  static async getGuestCapabilities() {
    try {
      const response = await api.get('/role/guest');
      if (!response.data) {
        return {
          ...response,
          data: {
            role: 'guest',
            capabilities: DEFAULT_GUEST_CAPABILITIES
          }
        };
      }
      return {
        ...response,
        data: {
          role: response.data.role || 'guest',
          capabilities: response.data.capabilities || DEFAULT_GUEST_CAPABILITIES
        }
      };
    } catch {
      return {
        isSuccess: true,
        data: {
          role: 'guest',
          capabilities: DEFAULT_GUEST_CAPABILITIES
        }
      };
    }
  }

  /**
   * Logout user and clear session
   * @param {string} token
   * @returns {Promise<{
   *   code: HTTPStatusCode,
   *   status: boolean,
   *   message: string
   * }>}
   */
  static async logout(token) {
    return await api.post('/auth/logout', { token });
  }

  static async forgot(email) {
    return await api.post('/auth/forgot-password', { body: { email } });
  }

  static async reset(token, password, password_confirmation) {
    return await api.post('/auth/reset-password', { body: { password, password_confirmation, token } });
  }

  static async changeProfile(token, data) {
    return await api.put('/auth/change-profile', { body: data, token });
  }

  static async changePassword(token, data) {
    return await api.post('/auth/change-password', { body: data, token });
  }

  /**
   * Get all role capabilities (Admin only)
   * @param {string} token
   * @returns {Promise<{
   *   code: HTTPStatusCode,
   *   status: boolean,
   *   message: string,
   *   data?: Record<string, import('@/constants/Role').Capabilities>
   * }>}
   */
  static async getAllCapabilities(token) {
    return await api.get('/role/all-capabilities', { token });
  }
}
