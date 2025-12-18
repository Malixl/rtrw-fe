import api from '@/utils/api';
import { User } from '@/models';

/**
 * Service untuk manajemen user (Admin only)
 */
export default class UserService {
  /**
   * Get all users with pagination
   * @param {object} params
   * @param {string} params.token
   * @param {number} [params.page=1]
   * @param {number} [params.perPage=10]
   * @param {string} [params.search]
   * @param {string} [params.role]
   * @returns {Promise<{
   *   code: number,
   *   status: boolean,
   *   message: string,
   *   data?: {
   *     data: User[],
   *     current_page: number,
   *     last_page: number,
   *     per_page: number,
   *     total: number
   *   }
   * }>}
   */
  static async getAll({ token, page = 1, perPage = 10, search, role } = {}) {
    const params = {};
    if (search) params.search = search;
    if (role) params.role = role;

    const response = await api.get('/admin/users', {
      token,
      page,
      perPage,
      params
    });

    if (!response.data) return response;

    // Map user data ke User instance
    const users = response.data.data?.map((user) => User.fromApiData(user, token)) || [];

    // Return with data as array directly (same pattern as other services)
    // and pagination info separately
    return {
      ...response,
      data: users,
      pagination: {
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total
      }
    };
  }

  /**
   * Get user by ID
   * @param {number} id
   * @param {string} token
   * @returns {Promise<{
   *   code: number,
   *   status: boolean,
   *   message: string,
   *   data?: User
   * }>}
   */
  static async getById(id, token) {
    const response = await api.get(`/admin/users/${id}`, { token });

    if (!response.data) return response;

    return {
      ...response,
      data: User.fromApiData(response.data, token)
    };
  }

  /**
   * Create new user
   * @param {object} data
   * @param {string} data.name
   * @param {string} data.email
   * @param {string} data.password
   * @param {string} data.password_confirmation
   * @param {string} data.role - 'admin' | 'opd'
   * @param {string} token
   * @returns {Promise<{
   *   code: number,
   *   status: boolean,
   *   message: string,
   *   data?: User
   * }>}
   */
  static async create(data, token) {
    const response = await api.post('/admin/users', {
      token,
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
        role: data.role
      }
    });

    if (!response.data) return response;

    return {
      ...response,
      data: User.fromApiData(response.data, token)
    };
  }

  /**
   * Update user
   * @param {number} id
   * @param {object} data
   * @param {string} [data.name]
   * @param {string} [data.email]
   * @param {string} [data.password] - Optional, only if changing password
   * @param {string} [data.password_confirmation] - Required if password is provided
   * @param {string} [data.role]
   * @param {string} token
   * @returns {Promise<{
   *   code: number,
   *   status: boolean,
   *   message: string,
   *   data?: User
   * }>}
   */
  static async update(id, data, token) {
    const body = {};
    if (data.name) body.name = data.name;
    if (data.email) body.email = data.email;
    if (data.role) body.role = data.role;
    if (data.password) {
      body.password = data.password;
      body.password_confirmation = data.password_confirmation;
    }

    const response = await api.put(`/admin/users/${id}`, {
      token,
      body
    });

    if (!response.data) return response;

    return {
      ...response,
      data: User.fromApiData(response.data, token)
    };
  }

  /**
   * Delete user
   * @param {number} id
   * @param {string} token
   * @returns {Promise<{
   *   code: number,
   *   status: boolean,
   *   message: string
   * }>}
   */
  static async delete(id, token) {
    return await api.delete(`/admin/users/${id}`, { token });
  }

  /**
   * Delete multiple users
   * @param {number[]} ids
   * @param {string} token
   * @returns {Promise<{
   *   code: number,
   *   status: boolean,
   *   message: string
   * }>}
   */
  static async multiDelete(ids, token) {
    return await api.delete(`/admin/users/multi-delete`, {
      token,
      body: { ids: ids }
    });
  }

  /**
   * Get available roles for user creation
   * @returns {Array<{value: string, label: string}>}
   */
  static getAvailableRoles() {
    return [
      { value: 'admin', label: 'Admin' },
      { value: 'opd', label: 'OPD' }
    ];
  }
}
