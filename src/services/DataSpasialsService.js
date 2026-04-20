/* eslint-disable no-unused-vars */
import { DataSpasials } from '@/models';
import api from '@/utils/api';

export default class DataSpasialsService {
  /**
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   *  data?: DataSpasials[];
   * }>}
   * */
  static async getAll({ token, ...filters }) {
    const params = Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== null && value !== undefined && value !== ''));
    const response = await api.get('/data_spasial', { token, params });
    if (!response.data) return response;
    return { ...response, data: DataSpasials.fromApiData(response.data) };
  }

  /**
   * @param {DataSpasials} data
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
      body: DataSpasials.toApiData(data),
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
    return await api.post('/data_spasial', options);
  }

  /**
   * @param {number} id
   * @param {DataSpasials} data
   * @param {string} token
   * @returns {Promise<{
   *  code: HTTPStatusCode;
   *  status: boolean;
   *  message: string;
   *  errors?: { [key: string]: string[] };
   * }>}
   */
  static async update(id, data, token, file, onProgress) {
    const options = {
      body: DataSpasials.toApiData(data),
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
    return await api.post(`/data_spasial/${id}`, options);
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
    return await api.delete(`/data_spasial/${id}`, { token });
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
    return await api.delete(`/data_spasial/multi-delete/?ids=${ids.join(',')}`, { token });
  }

  /**
   * Store data spasial dengan file GeoJSON yang sudah di-merge via chunked upload.
   * Mengirim geojson_file_path (string path) bukan file binary.
   *
   * @param {DataSpasials} data - Form data
   * @param {string} token - Auth token
   * @param {string} mergedPath - Path hasil merge dari ChunkedUploadService
   * @param {File|null} iconFile - Icon file (jika tipe point)
   */
  static async storeWithMergedFile(data, token, mergedPath, iconFile) {
    const body = {
      ...DataSpasials.toApiData(data),
      geojson_file_path: mergedPath,
    };

    const options = { body, token };

    if (iconFile) {
      options.file = { icon_titik: iconFile };
    }

    return await api.post('/data_spasial', options);
  }

  /**
   * Update data spasial dengan file GeoJSON yang sudah di-merge via chunked upload.
   *
   * @param {number} id - ID data spasial
   * @param {DataSpasials} data - Form data
   * @param {string} token - Auth token
   * @param {string} mergedPath - Path hasil merge dari ChunkedUploadService
   * @param {File|null} iconFile - Icon file (jika tipe point)
   */
  static async updateWithMergedFile(id, data, token, mergedPath, iconFile) {
    const body = {
      ...DataSpasials.toApiData(data),
      geojson_file_path: mergedPath,
    };

    const options = { body, token };

    if (iconFile) {
      options.file = { icon_titik: iconFile };
    }

    return await api.post(`/data_spasial/${id}`, options);
  }
}
