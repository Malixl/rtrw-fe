/* eslint-disable no-unused-vars */
import { IndikasiProgram } from '@/models';
import api from '@/utils/api';

export default class IndikasiProgramService {
  /**
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   *  data?: IndikasiProgram[];
   * }>}
   * */
  static async getAll({ token, ...filters }) {
    const params = Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== null && value !== undefined && value !== ''));
    const response = await api.get('/indikasi_program', { token, params });
    if (!response.data) return response;
    return { ...response, data: IndikasiProgram.fromApiData(response.data) };
  }

  /**
   * @param {DasarHukums} data
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   *  errors?: { [key: string]: string[] };
   * }}
   */
  static async store(data, token, file) {
    const options = { body: IndikasiProgram.toApiData(data), token };
    if (file) options.file = { file_dokumen: file };
    return await api.post('/indikasi_program', options);
  }

  /**
   * @param {number} id
   * @param {IndikasiProgram} data
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   *  errors?: { [key: string]: string[] };
   * }>}
   */
  static async update(id, data, token, file) {
    const options = { body: IndikasiProgram.toApiData(data), token };
    if (file) options.file = { file_dokumen: file };
    return await api.post(`/indikasi_program/${id}`, options);
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
    return await api.delete(`/indikasi_program/${id}`, { token });
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
    return await api.delete(`/indikasi_program/multi-delete?ids=${ids.join(',')}`, { token });
  }
}
