/**
 * Caching map (URL -> Promise<BlobURL>)
 * Mencegah multiple fetch untuk URL yang sama
 */
const imageCache = new Map();

/**
 * Simple Concurrency Queue
 * Limit 3 requests concurrent (Safe mode)
 */
class RequestQueue {
    constructor(concurrency = 3) {
        this.concurrency = concurrency;
        this.running = 0;
        this.queue = [];
    }

    add(fn) {
        return new Promise((resolve, reject) => {
            this.queue.push({ fn, resolve, reject });
            this.process();
        });
    }

    process() {
        if (this.running >= this.concurrency || this.queue.length === 0) return;

        this.running++;
        const { fn, resolve, reject } = this.queue.shift();

        fn().then(resolve).catch(reject).finally(() => {
            this.running--;
            this.process();
        });
    }
}

// REDUCED CONCURRENCY TO 3 (Safe for slow networks/Ngrok)
const queue = new RequestQueue(3);

export const fetchMarkerImage = async (url) => {
    if (!url) return null;

    // Jika URL adalah data base64 atau blob, return langsung
    if (url.startsWith('data:') || url.startsWith('blob:')) {
        return url;
    }

    // Check memory cache first
    if (imageCache.has(url)) {
        return imageCache.get(url);
    }

    // Wrap in queue
    const fetchPromise = queue.add(async () => {
        // PERSISTENT CACHE CHECK (Browser Cache Storage)
        try {
            const cache = await caches.open('marker-images-v1');
            const cachedResponse = await cache.match(url);

            if (cachedResponse) {
                // Return cached version immediately!
                const blob = await cachedResponse.blob();
                return URL.createObjectURL(blob);
            }
        } catch (e) {
            console.warn('Cache API not supported or failed', e);
        }

        const maxRetries = 5; // Increased retries
        let attempt = 0;

        while (attempt < maxRetries) {
            try {
                // Add progressive delay
                if (attempt > 0) {
                    await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt) + Math.random() * 500));
                }

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'ngrok-skip-browser-warning': 'true'
                        // removed force-cache to allow refreshing if needed
                    }
                });

                if (!response.ok) {
                    if (response.status === 404) throw new Error(`Image not found (404): ${url}`);
                    if (response.status === 429) {
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        throw new Error(`Rate limit (429)`);
                    }
                    throw new Error(`Status: ${response.status}`);
                }

                // SAVE TO PERSISTENT CACHE
                try {
                    const cache = await caches.open('marker-images-v1');
                    await cache.put(url, response.clone());
                } catch (e) {
                    console.warn('Failed to save to cache storage', e);
                }

                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);
                return objectUrl;
            } catch (error) {
                attempt++;
                if (attempt >= maxRetries) {
                    console.error(`Failed to fetch marker after ${maxRetries} attempts:`, url);
                    imageCache.delete(url);
                    return url; // Fallback to original
                }
            }
        }
    });

    // Simpan promise ke memory cache juga
    imageCache.set(url, fetchPromise);

    return fetchPromise;
};


export default fetchMarkerImage;
