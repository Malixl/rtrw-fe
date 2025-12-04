/* eslint-disable no-unused-vars */
import { KetentuanKhusus } from '@/models';
import api from '@/utils/api';

export default class KetentuanKhususService {
  /**
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   *  data?: KetentuanKhusus[];
   * }>}
   * */
  static async getAll({ token, ...filters }) {
    const params = Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== null && value !== undefined && value !== ''));
    const response = await api.get('/ketentuan_khusus', { token, params });
    if (!response.data) return response;
    return { ...response, data: KetentuanKhusus.fromApiData(response.data) };
  }

  /**
   * @param {KetentuanKhusus} data
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   *  errors?: { [key: string]: string[] };
   * }}
   */
  static async store(data, token, file) {
    const options = { body: KetentuanKhusus.toApiData(data), token };
    if (file) options.file = { geojson_file: file };
    return await api.post('/ketentuan_khusus', options);
  }
  /**
   * @param {number} id
   * @param {KetentuanKhusus} data
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   *  errors?: { [key: string]: string[] };
   * }>}
   */
  static async update(id, data, token, file) {
    const options = { body: KetentuanKhusus.toApiData(data), token };
    if (file) options.file = { geojson_file: file };
    return await api.post(`/ketentuan_khusus/${id}`, options);
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
    return await api.delete(`/ketentuan_khusus/${id}`, { token });
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
    return await api.delete(`/ketentuan_khusus/multi-delete?ids=${ids.join(',')}`, { token });
  }
}
