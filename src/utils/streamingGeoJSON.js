/**
 * Streaming GeoJSON Fetcher
 * 
 * Menggunakan oboe.js untuk streaming JSON parsing.
 * Fitur:
 * - Progressive loading: render fitur sambil download
 * - Callback per-feature untuk update UI real-time
 * - Support abort untuk cancel request
 * - Fallback ke fetchGeoJSON biasa jika streaming gagal
 */

import oboe from 'oboe';

/**
 * Fetch GeoJSON dengan streaming - render fitur satu per satu
 * 
 * @param {string} url - URL file GeoJSON
 * @param {Object} options - Opsi fetch
 * @param {Function} options.onFeature - Callback dipanggil setiap fitur diterima
 * @param {Function} options.onProgress - Callback progress (loaded, total)
 * @param {Function} options.onComplete - Callback setelah semua fitur selesai
 * @param {Function} options.onError - Callback jika error
 * @param {AbortSignal} options.signal - AbortController signal
 * @returns {Promise<Object>} - Complete GeoJSON object
 */
export const streamGeoJSON = (url, options = {}) => {
    const { onFeature, onProgress, onComplete, onError, signal } = options;

    return new Promise((resolve, reject) => {
        // Kumpulkan semua features
        const features = [];
        let metadata = null;
        let aborted = false;

        // Handle abort
        if (signal) {
            signal.addEventListener('abort', () => {
                aborted = true;
                stream.abort();
                reject(new DOMException('Aborted', 'AbortError'));
            });
        }

        const stream = oboe({
            url: url,
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate, br',
                'ngrok-skip-browser-warning': 'true'
            },
            withCredentials: false
        });

        // Capture metadata (type, crs, name, dll)
        stream.node('!.type', (type) => {
            if (!metadata) metadata = {};
            metadata.type = type;
            return oboe.drop; // Don't store in final JSON
        });

        stream.node('!.name', (name) => {
            if (!metadata) metadata = {};
            metadata.name = name;
            return oboe.drop;
        });

        stream.node('!.crs', (crs) => {
            if (!metadata) metadata = {};
            metadata.crs = crs;
            return oboe.drop;
        });

        // Stream setiap feature
        stream.node('features[*]', (feature, path, ancestors) => {
            if (aborted) return oboe.drop;

            features.push(feature);

            // Callback per feature untuk progressive rendering
            if (onFeature) {
                try {
                    onFeature(feature, features.length);
                } catch (e) {
                    console.warn('onFeature callback error:', e);
                }
            }

            // Progress callback
            if (onProgress) {
                onProgress(features.length, null); // Total unknown saat streaming
            }

            // Return drop untuk hemat memory (feature sudah disimpan di array)
            return oboe.drop;
        });

        // Ketika selesai
        stream.done((finalJson) => {
            if (aborted) return;

            // Rebuild complete GeoJSON object
            const completeGeoJSON = {
                type: metadata?.type || 'FeatureCollection',
                ...(metadata?.name && { name: metadata.name }),
                ...(metadata?.crs && { crs: metadata.crs }),
                features: features
            };

            if (onComplete) {
                onComplete(completeGeoJSON, features.length);
            }

            resolve(completeGeoJSON);
        });

        // Error handling
        stream.fail((error) => {
            if (aborted) return;

            console.error('Streaming GeoJSON error:', error);

            if (onError) {
                onError(error);
            }

            reject(error);
        });
    });
};

/**
 * Fetch GeoJSON dengan streaming + fallback
 * Mencoba streaming dulu, fallback ke fetch biasa jika gagal
 * 
 * @param {string} url - URL file GeoJSON
 * @param {Object} options - Opsi
 * @returns {Promise<Object>} - GeoJSON object
 */
export const fetchGeoJSONStreaming = async (url, options = {}) => {
    const { onFeature, onProgress, onComplete, signal, fallbackToNormal = true } = options;

    try {
        // Coba streaming
        const result = await streamGeoJSON(url, {
            onFeature,
            onProgress,
            onComplete,
            signal
        });

        return result;
    } catch (error) {
        // Jika di-abort, lempar error
        if (error.name === 'AbortError') {
            throw error;
        }

        // Fallback ke fetch biasa jika streaming gagal
        if (fallbackToNormal) {
            console.warn('Streaming failed, falling back to normal fetch:', error.message);
            const { fetchGeoJSON } = await import('./fetchGeoJSON');
            return fetchGeoJSON(url, { signal });
        }

        throw error;
    }
};

export default streamGeoJSON;
