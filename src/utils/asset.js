const baseUrl = import.meta.env.VITE_BASE_URL;

// OPTIMIZED: Gunakan Storage Proxy via API agar mendapat header CORS & Gzip yang benar
// Sebelumnya: baseUrl + '/storage/' (Langsung ke file statis -> Kena block Ngrok/CORS)
export const BASE_URL = baseUrl + '/api/storage-proxy/';

export default function asset(url) {
  if (!url) return null;
  // Hapus slash di depan jika ada agar path valid (storage-proxy/{filename})
  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  return BASE_URL + cleanUrl;
}
