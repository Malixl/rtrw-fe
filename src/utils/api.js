import { PAGINATION_ALL } from '@/constants';

const baseUrl = import.meta.env.VITE_BASE_URL;
export const BASE_URL = `${baseUrl}/api`;

const controllers = {};

/**
 * @param {string} endpoint
 * @param {'GET' | 'POST' | 'PATCH' | 'DELETE'} method
 * @param {object} body
 * @param {string} token
 * @param {object} file
 * @param {AbortController} abortController
 * @returns {Promise<{
 *  code: number;
 *  status: boolean;
 *  message: string;
 *  data: any;
 * }>}
 */
async function customFetch(endpoint, method, body, token, file, abortController) {
  const formData = new FormData();
  for (const key in body) {
    if (file && key in file) continue;

    // Handle color picker objects (convert to hex string)
    let value = body[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // If it's a color picker object, extract the hex value
      if (value.toHexString) {
        value = value.toHexString();
      } else if (value.hex) {
        value = value.hex;
      } else if (value.value) {
        value = value.value;
      } else {
        // If it's an unknown object, stringify it
        value = JSON.stringify(value);
      }
    }

    formData.append(key, value);
  }

  for (const key in file) {
    if (!file[key]) continue;
    formData.append(key, file[key], file[key].name);
  }

  const options = {
    method,
    headers: {
      Authorization: token ? `Bearer ${token}` : ''
    }
  };

  if (file) {
    options.body = formData;
  } else if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  if (abortController) options.signal = abortController.signal;
  else if (controllers[endpoint]) options.signal = controllers[endpoint].signal;

  const response = await fetch(BASE_URL + endpoint, options);

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
 * }) => ReturnType<typeof customFetch>}
 */
function createCustomFetch(method) {
  return (endpoint, { body, token, file, page, perPage = 10, params, abortController } = {}) => {
    const cleanEndpoint = endpoint.split('?')[0];
    if (!abortController) {
      if (controllers[cleanEndpoint]) controllers[cleanEndpoint].abort();
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
    return customFetch(concatenatedEndpoint, method, body, token, file, abortController);
  };
}

export default {
  get: createCustomFetch('GET'),
  post: createCustomFetch('POST'),
  patch: createCustomFetch('PATCH'),
  put: createCustomFetch('PUT'),
  delete: createCustomFetch('DELETE')
};
