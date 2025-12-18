/* eslint-disable no-unused-vars */
import { Pkkprl } from '@/models';
import api from '@/utils/api';

export default class PkkprlService {
  /**
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   *  data?: Pkkprl[];
   * }>}
   * */
  static async getAll({ token, ...filters }) {
    const params = Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== null && value !== undefined && value !== ''));
    const response = await api.get('/pkkprl', { token, params });
    if (!response.data) return response;
    return { ...response, data: Pkkprl.fromApiData(response.data) };
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
    const options = {
      body: Pkkprl.toApiData(data),
      token
    };

    if (file?.geojson_file || file?.icon_titik) {
      options.file = {};
    }

    if (file?.geojson_file) {
      options.file.geojson_file = file.geojson_file;
    }

    if (file?.icon_titik) {
      options.file.icon_titik = file.icon_titik;
    }
    return await api.post('/pkkprl', options);
  }

  /**
   * @param {number} id
   * @param {Pkkprl} data
   * @param {string} token
   * @param {{ geojson_file?: File, icon_titik?: File }} file
   */
  static async update(id, data, token, file) {
    const options = {
      body: Pkkprl.toApiData(data),
      token
    };

    if (file?.geojson_file || file?.icon_titik) {
      options.file = {};
    }

    if (file?.geojson_file) {
      options.file.geojson_file = file.geojson_file;
    }

    if (file?.icon_titik) {
      options.file.icon_titik = file.icon_titik;
    }
    return await api.post(`/pkkprl/${id}`, options);
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
    return await api.delete(`/pkkprl/${id}`, { token });
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
    return await api.delete(`/pkkprl/multi-delete?ids=${ids.join(',')}`, { token });
  }
}
