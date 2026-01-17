/**
 * Hook untuk menggunakan Web Worker GeoJSON processing
 * Memproses GeoJSON di background thread agar tidak blocking UI
 */

import { useRef, useCallback, useEffect } from 'react';

let workerInstance = null;
let pendingRequests = new Map();
let requestId = 0;

// Singleton worker untuk efisiensi
const getWorker = () => {
    if (!workerInstance) {
        workerInstance = new Worker(new URL('../utils/geojsonWorker.js', import.meta.url), {
            type: 'module'
        });

        workerInstance.onmessage = (e) => {
            const { type, id, data, error } = e.data;
            const pending = pendingRequests.get(id);

            if (pending) {
                if (type === 'ERROR') {
                    pending.reject(new Error(error));
                } else {
                    pending.resolve(data);
                }
                pendingRequests.delete(id);
            }
        };

        workerInstance.onerror = (error) => {
            console.error('GeoJSON Worker error:', error);
        };
    }
    return workerInstance;
};

/**
 * Hook untuk memproses GeoJSON di Web Worker
 * @returns {Object} - processGeoJSON dan processBatch functions
 */
export const useGeoJSONWorker = () => {
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    /**
     * Process single GeoJSON
     * @param {Object} json - Raw GeoJSON data
     * @param {Object} options - Processing options (warna, tipe_garis, dll)
     * @returns {Promise<Object>} - Processed GeoJSON
     */
    const processGeoJSON = useCallback((json, options = {}) => {
        return new Promise((resolve, reject) => {
            const worker = getWorker();
            const id = ++requestId;

            pendingRequests.set(id, { resolve, reject });

            worker.postMessage({
                type: 'PROCESS_GEOJSON',
                id,
                payload: { json, options }
            });
        });
    }, []);

    /**
     * Process batch of GeoJSON items
     * @param {Array} items - Array of { key, json, options }
     * @returns {Promise<Array>} - Array of { key, data }
     */
    const processBatch = useCallback((items) => {
        return new Promise((resolve, reject) => {
            const worker = getWorker();
            const id = ++requestId;

            pendingRequests.set(id, { resolve, reject });

            worker.postMessage({
                type: 'BATCH_PROCESS',
                id,
                payload: { items }
            });
        });
    }, []);

    return { processGeoJSON, processBatch };
};

export default useGeoJSONWorker;
