/* eslint-disable no-unused-vars */
import { Polaruangs } from '@/models';
import api from '@/utils/api';

export default class PolaruangsService {
  /**
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   *  data?: Polaruangs[];
   * }>}
   * */
  static async getAll({ token, ...filters }) {
    const params = Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== null && value !== undefined && value !== ''));
    const response = await api.get('/polaruang', { token, params });
    if (!response.data) return response;
    return { ...response, data: Polaruangs.fromApiData(response.data) };
  }

  /**
   * @param {Polaruangs} data
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   *  errors?: { [key: string]: string[] };
   * }}
   */
  static async store(data, token, file) {
    const options = { body: Polaruangs.toApiData(data), token };
    if (file) options.file = { geojson_file: file };
    return await api.post('/polaruang', options);
  }

  /**
   * @param {number} id
   * @param {Polaruangs} data
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   *  errors?: { [key: string]: string[] };
   * }>}
   */
  static async update(id, data, token, file) {
    const options = { body: Polaruangs.toApiData(data), token };
    if (file) options.file = { geojson_file: file };
    return await api.post(`/polaruang/${id}`, options);
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
    return await api.delete(`/polaruang/${id}`, { token });
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
    return await api.delete(`/polaruang/multi-delete?ids=${ids.join(',')}`, { token });
  }
}
