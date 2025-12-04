/* eslint-disable no-unused-vars */
import { Rtrws } from '@/models';
import api from '@/utils/api';

export default class RtrwsService {
  /**
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   *  data?: Rtrws[];
   * }>}
   * */
  static async getAll({ token = null, ...filters } = {}) {
    const params = Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== null && value !== undefined && value !== ''));
    const response = await api.get('/rtrw', { token, params });
    if (!response.data) return response;
    return { ...response, data: Rtrws.fromApiData(response.data) };
  }

  /**
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   *  data?: Rtrws[];
   * }>}
   * */
  static async getAllKlasifikasisByRtrw({ idRtrw, ...filters }) {
    const params = Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== null && value !== undefined && value !== ''));
    const response = await api.get(`/rtrw/${idRtrw}/klasifikasi`, { params });
    if (!response.data) return response;
    return { ...response, data: response.data };
  }

  /**
   * @param {Rtrws} data
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   *  errors?: { [key: string]: string[] };
   * }}
   */
  static async store(data, token) {
    const payload = {
      body: Rtrws.toApiData(data),
      token
    };
    return await api.post('/rtrw', { ...payload });
  }

  /**
   * @param {number} id
   * @param {Rtrws} data
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   *  errors?: { [key: string]: string[] };
   * }>}
   */
  static async update(id, data, token) {
    return await api.put(`/rtrw/${id}`, { body: Rtrws.toApiData(data), token });
  }

  /**
   * @param {number} id
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   * }>}
   */
  static async delete(id, token) {
    return await api.delete(`/rtrw/${id}`, { token });
  }

  /**
   * @param {number[]} ids
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   * }>}
   */
  static async deleteBatch(ids, token) {
    return await api.delete(`/rtrw/multi-delete?ids=${ids.join(',')}`, { token });
  }
}
