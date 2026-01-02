/* eslint-disable no-unused-vars */
import { BatasAdministrasi } from '@/models';
import api from '@/utils/api';

export default class BatasAdministrasiService {
  /**
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   *  data?: BatasAdministrasi[];
   * }>}
   * */
  static async getAll({ token, ...filters } = {}) {
    const params = Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== null && value !== undefined && value !== ''));
    const response = await api.get('/batas_administrasi', { token, params });
    if (!response.data) return response;
    return { ...response, data: BatasAdministrasi.fromApiData(response.data) };
  }

  /**
   * @param {BatasAdministrasi} data
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   *  errors?: { [key: string]: string[] };
   * }}
   */
  static async store(data, token, file) {
    return await api.post('/batas_administrasi', { body: BatasAdministrasi.toApiData(data), token, file: { geojson_file: file } });
  }

  /**
   * @param {number} id
   * @param {BatasAdministrasi} data
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   *  errors?: { [key: string]: string[] };
   * }>}
   */
  static async update(id, data, token, file) {
    return await api.post(`/batas_administrasi/${id}`, { body: BatasAdministrasi.toApiData(data), token, file: { geojson_file: file } });
  }

  /**
   * Ambil GeoJSON untuk batas administrasi (raw feature collection)
   * @param {number} id
   * @param {string} token
   * @returns {Promise<any>} GeoJSON object
   */
  static async getGeoJson(id, token) {
    const response = await api.get(`/batas_administrasi/${id}/geojson`, { token });
    return response.data;
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
    return await api.delete(`/batas_administrasi/${id}`, { token });
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
    return await api.delete(`/batas_administrasi/multi-delete?ids=${ids.join(',')}`, { token });
  }
}
