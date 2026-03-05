/* eslint-disable no-unused-vars */
import { Dokumen } from '@/models';
import api from '@/utils/api';

export default class DokumenService {
    /**
     * @param {string} token
     * @returns {Promise<{
     *  code: HTTPStatusCode;
     *  status: boolean;
     *  message: string;
     *  data?: Dokumen[];
     * }>}
     * */
    static async getAll({ token, ...filters }) {
        const params = Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== null && value !== undefined && value !== ''));
        const response = await api.get('/dokumen', { token, params });
        if (!response.data) return response;
        return { ...response, data: Dokumen.fromApiData(response.data) };
    }

    /**
     * @param {Dokumen} data
     * @param {string} token
     * @returns {Promise<{
     *  code: HTTPStatusCode;
     *  status: boolean;
     *  message: string;
     *  errors?: { [key: string]: string[] };
     * }}
     */
    static async store(data, token, file) {
        const options = { body: Dokumen.toApiData(data), token };
        if (file) options.file = { file_dokumen: file };
        return await api.post('/dokumen', options);
    }

    /**
     * @param {number} id
     * @param {Dokumen} data
     * @param {string} token
     * @returns {Promise<{
     *  code: HTTPStatusCode;
     *  status: boolean;
     *  message: string;
     *  errors?: { [key: string]: string[] };
     * }>}
     */
    static async update(id, data, token, file) {
        const options = { body: Dokumen.toApiData(data), token };
        if (file) options.file = { file_dokumen: file };
        return await api.post(`/dokumen/${id}`, options);
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
        return await api.delete(`/dokumen/${id}`, { token });
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
        return await api.delete(`/dokumen/multi-delete?ids=${ids.join(',')}`, { token });
    }
}
