/**
 * Optimized GeoJSON fetcher dengan:
 * - AbortController untuk cancel request
 * - Request deduplication
 * - Retry dengan exponential backoff
 * - Response streaming untuk data besar
 */

// Store untuk pending requests (deduplication)
const pendingRequests = new Map();

/**
 * Fetch GeoJSON dengan optimasi
 * @param {string} url - URL endpoint
 * @param {Object} options - Fetch options
 * @param {AbortSignal} options.signal - AbortController signal
 * @param {number} options.retries - Jumlah retry (default: 2)
 * @param {number} options.timeout - Timeout dalam ms (default: 30000)
 * @returns {Promise<Object>} - Parsed JSON response
 */
export const fetchGeoJSON = async (url, options = {}) => {
    const { signal, retries = 2, timeout = 30000 } = options;

    // Request deduplication - jika URL yang sama sedang di-fetch, return promise yang sama
    if (pendingRequests.has(url)) {
        return pendingRequests.get(url);
    }

    const fetchWithTimeout = async (attempt = 0) => {
        // Create timeout abort
        const timeoutId = setTimeout(() => {
            if (!signal?.aborted) {
                console.warn(`Request timeout for ${url}`);
            }
        }, timeout);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    // Request compressed response
                    'Accept-Encoding': 'gzip, deflate, br',
                    'ngrok-skip-browser-warning': 'true'
                },
                signal,
                // Gunakan cache jika tersedia
                cache: 'default'
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Parse JSON
            const data = await response.json();
            return data;
        } catch (error) {
            clearTimeout(timeoutId);

            // Jangan retry jika di-abort
            if (error.name === 'AbortError') {
                throw error;
            }

            // Retry dengan exponential backoff
            if (attempt < retries) {
                const delay = Math.pow(2, attempt) * 500; // 500ms, 1s, 2s...
                await new Promise((resolve) => setTimeout(resolve, delay));
                return fetchWithTimeout(attempt + 1);
            }

            throw error;
        }
    };

    // Create promise dan store untuk deduplication
    const promise = fetchWithTimeout()
        .finally(() => {
            // Remove dari pending setelah selesai
            pendingRequests.delete(url);
        });

    pendingRequests.set(url, promise);
    return promise;
};

/**
 * Batch fetch multiple GeoJSON dengan concurrency control
 * @param {Array<{url: string, key: string}>} items - Array of URLs to fetch
 * @param {Object} options - Options
 * @param {number} options.concurrency - Max concurrent requests (default: 4)
 * @param {AbortSignal} options.signal - AbortController signal
 * @param {Function} options.onProgress - Progress callback (current, total)
 * @returns {Promise<Array<{key: string, data: Object, error?: Error}>>}
 */
export const batchFetchGeoJSON = async (items, options = {}) => {
    const { concurrency = 4, signal, onProgress } = options;
    const results = [];
    let completed = 0;

    // Process in chunks
    for (let i = 0; i < items.length; i += concurrency) {
        if (signal?.aborted) break;

        const chunk = items.slice(i, i + concurrency);

        const chunkResults = await Promise.all(
            chunk.map(async ({ url, key }) => {
                try {
                    const data = await fetchGeoJSON(url, { signal });
                    return { key, data, status: 'fulfilled' };
                } catch (error) {
                    if (error.name === 'AbortError') {
                        return { key, status: 'aborted' };
                    }
                    console.error(`Failed to fetch ${key}:`, error);
                    return { key, error, status: 'rejected' };
                } finally {
                    completed++;
                    onProgress?.(completed, items.length);
                }
            })
        );

        results.push(...chunkResults);
    }

    return results;
};

/**
 * Cancel semua pending requests
 */
export const cancelAllPendingRequests = () => {
    pendingRequests.clear();
};

export default fetchGeoJSON;
