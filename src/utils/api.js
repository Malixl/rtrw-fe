import { PAGINATION_ALL } from '@/constants';

const baseUrl = import.meta.env.VITE_BASE_URL;
export const BASE_URL = `${baseUrl}/api`;

const controllers = {};

// Token key constant - must match AuthProvider
const TOKEN_KEY = 'token';

/**
 * Handle 401 Unauthorized response - clear token and redirect to login
 */
function handleUnauthorized() {
  // Clear token from localStorage
  localStorage.removeItem(TOKEN_KEY);

  // Only redirect if not already on login page
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
}

/**
 * Build FormData from body and file objects
 */
function buildFormData(body, file) {
  const formData = new FormData();
  for (const key in body) {
    if (file && key in file) continue;

    // Handle color picker objects (convert to hex string)
    let value = body[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (value.toHexString) {
        value = value.toHexString();
      } else if (value.hex) {
        value = value.hex;
      } else if (value.value) {
        value = value.value;
      } else {
        value = JSON.stringify(value);
      }
    }

    formData.append(key, value);
  }

  for (const key in file) {
    if (!file[key]) continue;
    formData.append(key, file[key], file[key].name);
  }

  return formData;
}

/**
 * Upload file with progress tracking using XMLHttpRequest
 * @param {string} url - Full URL to upload to
 * @param {FormData} formData - Form data with file
 * @param {string} token - Auth token
 * @param {(progress: { percent: number, loaded: number, total: number }) => void} onProgress
 * @returns {Promise<object>} - Parsed JSON response
 */
function uploadWithProgress(url, formData, token, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          percent: Math.round((event.loaded / event.total) * 100),
          loaded: event.loaded,
          total: event.total
        });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 401) {
        handleUnauthorized();
        resolve({
          code: 401,
          status: false,
          message: 'Unauthorized - Session expired',
          data: null
        });
        return;
      }

      try {
        const response = JSON.parse(xhr.responseText);
        resolve(response);
      } catch {
        reject(new Error('Failed to parse response'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed - network error'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', token ? `Bearer ${token}` : '');
    xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
    xhr.setRequestHeader('bypass-tunnel-reminder', 'true');
    xhr.send(formData);
  });
}

/**
 * @param {string} endpoint
 * @param {'GET' | 'POST' | 'PATCH' | 'DELETE'} method
 * @param {object} body
 * @param {string} token
 * @param {object} file
 * @param {AbortController} abortController
 * @param {Function} onProgress
 * @returns {Promise<{
 *  code: number;
 *  status: boolean;
 *  message: string;
 *  data: any;
 * }>}
 */
async function customFetch(endpoint, method, body, token, file, abortController, onProgress) {
  const formData = buildFormData(body, file);

  // Use XMLHttpRequest for file uploads with progress tracking
  if (file && onProgress) {
    return uploadWithProgress(BASE_URL + endpoint, formData, token, onProgress);
  }

  const options = {
    method,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'ngrok-skip-browser-warning': 'true',
      'bypass-tunnel-reminder': 'true'
    }
  };

  if (file) {
    options.body = formData;
  } else if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  if (abortController) {
    options.signal = abortController.signal;
  }

  const response = await fetch(BASE_URL + endpoint, options);

  if (response.status === 401) {
    handleUnauthorized();
    return {
      code: 401,
      status: false,
      message: 'Unauthorized - Session expired',
      data: null
    };
  }

  return await response.json();
}

/**
 * @param {'GET' | 'POST' | 'PATCH' | 'DELETE'} method
 * @returns {(endpoint: string, options?: {
 *  body?: object;
 *  token?: string;
 *  file?: object;
 *  page?: number;
 *  perPage?: number;
 *  params?: Record<string, string | number>;
 *  abortController?: AbortController;
 *  onProgress?: (progress: { percent: number, loaded: number, total: number }) => void;
 * }) => ReturnType<typeof customFetch>}
 */
function createCustomFetch(method) {
  return (endpoint, { body, token, file, page, perPage = 10, params, abortController, onProgress } = {}) => {
    const shouldUseAbort = method !== 'GET' && !abortController;

    if (shouldUseAbort) {
      const cleanEndpoint = endpoint.split('?')[0];
      if (controllers[cleanEndpoint]) {
        controllers[cleanEndpoint].abort();
      }
      controllers[cleanEndpoint] = new AbortController();
    }

    const searchParams = {};
    if (params) for (const key in params) searchParams[key] = params[key];

    if (page) {
      searchParams.page = page;
      if (perPage === PAGINATION_ALL) searchParams.per_page = 'all';
      else searchParams.per_page = perPage;
    }

    const searchParamsString = Object.entries(searchParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    const hasSearchParams = endpoint.includes('?');
    let concatenatedEndpoint = endpoint;
    if (searchParamsString !== '') {
      if (hasSearchParams) concatenatedEndpoint += '&';
      else concatenatedEndpoint += '?';
      concatenatedEndpoint += searchParamsString;
    }
    return customFetch(concatenatedEndpoint, method, body, token, file, abortController, onProgress);
  };
}

export default {
  get: createCustomFetch('GET'),
  post: createCustomFetch('POST'),
  patch: createCustomFetch('PATCH'),
  put: createCustomFetch('PUT'),
  delete: createCustomFetch('DELETE')
};
