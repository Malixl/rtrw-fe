/* eslint-disable no-unused-vars */
import { KawasanStrategiProvinsi } from '@/models';
import api from '@/utils/api';

export default class KawasanStrategiProvinsiService {
    /**
     * @param {string} token
     * @returns {Promise<{
     *  code: HTTPStatusCode;
     *  status: boolean;
     *  message: string;
     *  data?: KawasanStrategiProvinsi[];
     * }>}
     * */
    static async getAll({ token, ...filters }) {
        const params = Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== null && value !== undefined && value !== ''));
        const response = await api.get('/kawasan_strategi_provinsi', { token, params });
        if (!response.data) return response;
        return { ...response, data: KawasanStrategiProvinsi.fromApiData(response.data) };
    }

    /**
     * @param {KawasanStrategiProvinsi} data
     * @param {string} token
     * @returns {Promise<{
     *  code: HTTPStatusCode;
     *  status: boolean;
     *  message: string;
     *  errors?: { [key: string]: string[] };
     * }}
     */
    static async store(data, token, file, onProgress) {
        const options = {
            body: KawasanStrategiProvinsi.toApiData(data),
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
        if (onProgress) options.onProgress = onProgress;
        return await api.post('/kawasan_strategi_provinsi', options);
    }

    /**
     * @param {number} id
     * @param {KawasanStrategiProvinsi} data
     * @param {string} token
     * @param {{ geojson_file?: File, icon_titik?: File }} file
     */
    static async update(id, data, token, file, onProgress) {
        const options = {
            body: KawasanStrategiProvinsi.toApiData(data),
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
        if (onProgress) options.onProgress = onProgress;
        return await api.post(`/kawasan_strategi_provinsi/${id}`, options);
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
        return await api.delete(`/kawasan_strategi_provinsi/${id}`, { token });
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
        return await api.delete(`/kawasan_strategi_provinsi/multi-delete?ids=${ids.join(',')}`, { token });
    }
}
