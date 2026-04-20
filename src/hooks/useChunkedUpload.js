import { useCallback, useRef, useState } from 'react';
import ChunkedUploadService from '@/services/ChunkedUploadService';

/**
 * CHUNK_SIZE: 5MB per potongan
 *
 * Alasan 5MB:
 * - Cukup kecil agar setiap request selesai dalam <5 detik (bahkan di koneksi lambat)
 * - Cukup besar agar file 500MB hanya butuh 100 request (bukan 1000)
 * - Nginx client_max_body_size cukup di-set 10MB
 */
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Threshold di mana upload otomatis beralih ke chunked mode.
 * File di bawah ini tetap menggunakan upload biasa (1 request).
 */
export const CHUNKED_UPLOAD_THRESHOLD = 10 * 1024 * 1024; // 10MB

/**
 * Key prefix untuk localStorage
 */
const STORAGE_KEY_PREFIX = 'chunked_upload_';

/**
 * useChunkedUpload
 *
 * Custom hook yang mengelola seluruh lifecycle resumable chunked upload.
 * Meniru perilaku YouTube: slice → upload sequential → resume → merge.
 *
 * @returns {{
 *   startUpload: (file: File, token: string) => Promise<string|null>,
 *   retry: (file: File, token: string) => Promise<string|null>,
 *   cancel: () => void,
 *   progress: { percent: number, uploadedChunks: number, totalChunks: number, phase: string, phaseText: string },
 *   isUploading: boolean,
 *   error: string|null,
 * }}
 */
export default function useChunkedUpload() {
  const [progress, setProgress] = useState({
    percent: 0,
    uploadedChunks: 0,
    totalChunks: 0,
    phase: 'idle', // 'idle' | 'checking' | 'uploading' | 'merging' | 'done' | 'error'
    phaseText: '',
  });

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  // AbortController ref agar bisa cancel dari luar
  const abortRef = useRef(null);
  // Simpan session info untuk retry
  const sessionRef = useRef(null);

  /**
   * Cari session upload sebelumnya di localStorage berdasarkan nama & ukuran file.
   * Ini memungkinkan cross-session resume: browser tutup → buka lagi → pilih file sama → lanjutkan.
   */
  const findExistingSession = useCallback((fileName, fileSize) => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(STORAGE_KEY_PREFIX)) continue;

        const session = JSON.parse(localStorage.getItem(key));
        // Cocokkan berdasarkan nama + ukuran file (cukup akurat untuk identifikasi)
        if (session.fileName === fileName && session.fileSize === fileSize) {
          return session;
        }
      }
    } catch {
      // localStorage error, abaikan
    }
    return null;
  }, []);

  /**
   * Simpan session upload ke localStorage untuk cross-session resume.
   */
  const saveSession = useCallback((sessionData) => {
    try {
      const key = STORAGE_KEY_PREFIX + sessionData.fileId;
      localStorage.setItem(key, JSON.stringify(sessionData));
    } catch {
      // localStorage penuh atau error, abaikan (upload tetap jalan)
    }
  }, []);

  /**
   * Hapus session dari localStorage setelah upload selesai/dibatalkan.
   */
  const clearSession = useCallback((fileId) => {
    try {
      localStorage.removeItem(STORAGE_KEY_PREFIX + fileId);
    } catch {
      // abaikan
    }
  }, []);

  /**
   * Eksekusi upload: cek status → upload chunk yang hilang → merge.
   * Ini adalah fungsi inti yang dijalankan oleh startUpload() dan retry().
   *
   * @param {File} file - File yang akan diupload
   * @param {string} fileId - UUID session
   * @param {string} token - Auth token
   * @returns {Promise<string|null>} merged_path jika berhasil, null jika gagal
   */
  const executeUpload = useCallback(async (file, fileId, token) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    // Setup abort controller
    const abortController = new AbortController();
    abortRef.current = abortController;

    // Simpan session info untuk retry
    sessionRef.current = { file, fileId, token, totalChunks };

    // Simpan ke localStorage untuk cross-session resume
    saveSession({
      fileId,
      fileName: file.name,
      fileSize: file.size,
      totalChunks,
      startedAt: new Date().toISOString(),
    });

    try {
      setIsUploading(true);
      setError(null);

      // ============================================
      // PHASE 1: Cek status — chunk mana yang sudah ada
      // ============================================
      setProgress({
        percent: 0,
        uploadedChunks: 0,
        totalChunks,
        phase: 'checking',
        phaseText: 'Mengecek status upload sebelumnya...',
      });

      const statusResponse = await ChunkedUploadService.checkStatus(fileId, token);
      const uploadedChunks = new Set(statusResponse?.data?.uploaded_chunks ?? []);

      // ============================================
      // PHASE 2: Upload chunk yang belum ada (sequential!)
      // ============================================
      let completedCount = uploadedChunks.size;

      for (let i = 0; i < totalChunks; i++) {
        // Cek apakah user membatalkan
        if (abortController.signal.aborted) {
          throw new Error('Upload dibatalkan oleh pengguna');
        }

        // Skip chunk yang sudah ada di server (resume logic)
        if (uploadedChunks.has(i)) {
          continue;
        }

        // Potong file menggunakan Blob.slice()
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunkBlob = file.slice(start, end);

        // Update progress sebelum upload
        setProgress({
          percent: Math.round((completedCount / totalChunks) * 100),
          uploadedChunks: completedCount,
          totalChunks,
          phase: 'uploading',
          phaseText: `Mengupload chunk ${completedCount + 1}/${totalChunks}`,
        });

        // Upload chunk — sequential, satu per satu
        // JANGAN paralel, ini krusial untuk mencegah Nginx rate-limiting
        const chunkResponse = await ChunkedUploadService.uploadChunk(
          fileId,
          i,
          chunkBlob,
          token,
          abortController.signal
        );

        if (!chunkResponse.status) {
          throw new Error(chunkResponse.message || `Gagal upload chunk ${i}`);
        }

        completedCount++;

        // Update progress setelah chunk berhasil
        setProgress({
          percent: Math.round((completedCount / totalChunks) * 100),
          uploadedChunks: completedCount,
          totalChunks,
          phase: 'uploading',
          phaseText: `Mengupload chunk ${Math.min(completedCount + 1, totalChunks)}/${totalChunks}`,
        });
      }

      // ============================================
      // PHASE 3: Merge semua chunk di server
      // ============================================
      setProgress({
        percent: 100,
        uploadedChunks: totalChunks,
        totalChunks,
        phase: 'merging',
        phaseText: 'Menggabungkan file di server...',
      });

      const mergeResponse = await ChunkedUploadService.mergeChunks(
        fileId,
        totalChunks,
        file.name,
        token
      );

      if (!mergeResponse.status) {
        throw new Error(mergeResponse.message || 'Gagal menggabungkan file');
      }

      const mergedPath = mergeResponse.data?.merged_path;

      // ============================================
      // PHASE 4: Selesai — bersihkan state
      // ============================================
      setProgress({
        percent: 100,
        uploadedChunks: totalChunks,
        totalChunks,
        phase: 'done',
        phaseText: 'Upload selesai!',
      });

      // Hapus session dari localStorage (sudah tidak perlu resume)
      clearSession(fileId);
      sessionRef.current = null;

      return mergedPath;
    } catch (err) {
      // Jangan tampilkan error jika user sendiri yang cancel
      if (err.message === 'Upload dibatalkan oleh pengguna') {
        setProgress((prev) => ({ ...prev, phase: 'idle', phaseText: '' }));
        setIsUploading(false);
        return null;
      }

      setError(err.message || 'Terjadi kesalahan saat upload');
      setProgress((prev) => ({
        ...prev,
        phase: 'error',
        phaseText: `Error: ${err.message}`,
      }));
      return null;
    } finally {
      setIsUploading(false);
      abortRef.current = null;
    }
  }, [saveSession, clearSession]);

  /**
   * Mulai upload file baru, atau lanjutkan upload sebelumnya jika ada session yang cocok.
   *
   * @param {File} file - File GeoJSON yang akan diupload
   * @param {string} token - Auth token
   * @returns {Promise<string|null>} merged_path jika berhasil, null jika gagal
   */
  const startUpload = useCallback(async (file, token) => {
    // Cek apakah ada session sebelumnya untuk file ini (cross-session resume)
    const existingSession = findExistingSession(file.name, file.size);

    let fileId;
    if (existingSession) {
      // Resume session yang ada
      fileId = existingSession.fileId;
      console.log(`[ChunkedUpload] Resuming session ${fileId} for ${file.name}`);
    } else {
      // Session baru
      fileId = crypto.randomUUID();
      console.log(`[ChunkedUpload] Starting new session ${fileId} for ${file.name}`);
    }

    return executeUpload(file, fileId, token);
  }, [findExistingSession, executeUpload]);

  /**
   * Retry upload setelah error — cek status terakhir dan lanjutkan.
   * Menggunakan session info yang tersimpan di ref.
   *
   * @param {File} [file] - File yang sama (opsional, gunakan dari session jika tersedia)
   * @param {string} [token] - Auth token (opsional, gunakan dari session jika tersedia)
   * @returns {Promise<string|null>}
   */
  const retry = useCallback(async (file, token) => {
    const session = sessionRef.current;
    if (!session && !file) {
      setError('Tidak ada session upload untuk di-retry');
      return null;
    }

    const retryFile = file || session?.file;
    const retryToken = token || session?.token;
    const retryFileId = session?.fileId || crypto.randomUUID();

    return executeUpload(retryFile, retryFileId, retryToken);
  }, [executeUpload]);

  /**
   * Batalkan upload yang sedang berjalan dan bersihkan state.
   */
  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }

    if (sessionRef.current?.fileId) {
      clearSession(sessionRef.current.fileId);
    }

    sessionRef.current = null;
    setIsUploading(false);
    setError(null);
    setProgress({
      percent: 0,
      uploadedChunks: 0,
      totalChunks: 0,
      phase: 'idle',
      phaseText: '',
    });
  }, [clearSession]);

  return {
    startUpload,
    retry,
    cancel,
    progress,
    isUploading,
    error,
  };
}
