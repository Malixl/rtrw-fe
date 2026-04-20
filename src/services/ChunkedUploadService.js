import { BASE_URL } from '@/utils/api';

/**
 * ChunkedUploadService
 *
 * Service layer untuk 3 endpoint chunked upload.
 * Menggunakan XMLHttpRequest untuk uploadChunk (agar bisa track progress per-chunk),
 * dan fetch biasa untuk checkStatus dan mergeChunks.
 */
export default class ChunkedUploadService {
  /**
   * Upload satu chunk ke server.
   * Menggunakan XMLHttpRequest agar bisa melacak progress upload per-chunk.
   *
   * @param {string} fileId - UUID identifier upload session
   * @param {number} chunkIndex - Index chunk (0-based)
   * @param {Blob} chunkBlob - Potongan file (hasil Blob.slice)
   * @param {string} token - Auth token
   * @param {AbortSignal} [signal] - Optional abort signal untuk cancel
   * @returns {Promise<{code: number, status: boolean, message: string, data: any}>}
   */
  static uploadChunk(fileId, chunkIndex, chunkBlob, token, signal) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      const formData = new FormData();
      formData.append('file_id', fileId);
      formData.append('chunk_index', chunkIndex);
      formData.append('chunk_file', chunkBlob, `chunk_${chunkIndex}`);

      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch {
          reject(new Error('Gagal memproses respons server'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error — koneksi terputus'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload dibatalkan'));
      });

      // Handle abort signal dari luar (untuk cancel button)
      if (signal) {
        signal.addEventListener('abort', () => xhr.abort());
      }

      xhr.open('POST', `${BASE_URL}/upload-chunk`);
      xhr.setRequestHeader('Authorization', token ? `Bearer ${token}` : '');
      xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
      xhr.setRequestHeader('bypass-tunnel-reminder', 'true');
      xhr.send(formData);
    });
  }

  /**
   * Cek status upload — chunk mana saja yang sudah tersimpan di server.
   * Frontend WAJIB memanggil ini sebelum mulai upload (untuk resume).
   *
   * @param {string} fileId - UUID identifier upload session
   * @param {string} token - Auth token
   * @returns {Promise<{code: number, status: boolean, data: {uploaded_chunks: number[]}}>}
   */
  static async checkStatus(fileId, token) {
    const response = await fetch(`${BASE_URL}/upload-status?file_id=${fileId}`, {
      method: 'GET',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'ngrok-skip-browser-warning': 'true',
        'bypass-tunnel-reminder': 'true',
      },
    });
    return await response.json();
  }

  /**
   * Minta server untuk merge semua chunk menjadi satu file final.
   *
   * @param {string} fileId - UUID identifier upload session
   * @param {number} totalChunks - Jumlah total chunk yang diexpect
   * @param {string} originalName - Nama file asli (untuk menentukan ekstensi)
   * @param {string} token - Auth token
   * @returns {Promise<{code: number, status: boolean, data: {merged_path: string}}>}
   */
  static async mergeChunks(fileId, totalChunks, originalName, token) {
    const response = await fetch(`${BASE_URL}/merge-chunks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
        'ngrok-skip-browser-warning': 'true',
        'bypass-tunnel-reminder': 'true',
      },
      body: JSON.stringify({
        file_id: fileId,
        total_chunks: totalChunks,
        original_name: originalName,
      }),
    });
    return await response.json();
  }
}
