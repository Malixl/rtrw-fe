/* eslint-disable no-unused-vars */
import { StrukturRuangs } from '@/models';
import api from '@/utils/api';

export default class StrukturRuangsService {
  /**
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   *  data?: StrukturRuangs[];
   * }>}
   * */
  static async getAll({ token, ...filters }) {
    const params = Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== null && value !== undefined && value !== ''));
    const response = await api.get('/struktur_ruang', { token, params });
    if (!response.data) return response;
    return { ...response, data: StrukturRuangs.fromApiData(response.data) };
  }

  /**
   * @param {StrukturRuangs} data
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   *  errors?: { [key: string]: string[] };
   * }}
   */
  static async store(data, token, file) {
    const options = { body: StrukturRuangs.toApiData(data), token };
    if (file) options.file = { geojson_file: file };
    return await api.post('/struktur_ruang', options);
  }

  /**
   * @param {number} id
   * @param {StrukturRuangs} data
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   *  errors?: { [key: string]: string[] };
   * }>}
   */
  static async update(id, data, token, file) {
    const options = { body: StrukturRuangs.toApiData(data), token };
    if (file) options.file = { geojson_file: file };
    return await api.post(`/struktur_ruang/${id}`, options);
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
    return await api.delete(`/struktur_ruang/${id}`, { token });
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
    return await api.delete(`/struktur_ruang/multi-delete?ids=${ids.join(',')}`, { token });
  }
}
