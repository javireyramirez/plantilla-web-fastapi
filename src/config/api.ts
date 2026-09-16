import axios from 'axios';
import qs from 'qs';

const instance = axios.create({
  baseURL: import.meta.env.VITE_BACK_URL + '/api',
  paramsSerializer: {
    serialize: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
  },
  timeout: 10000, //10s
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      error.response?.data instanceof Blob &&
      (error.response.data.type.includes('application/json') ||
        error.response.data.type === '')
    ) {
      try {
        const text = await error.response.data.text();
        error.response.data = JSON.parse(text);
      } catch {
        // Fallback si no es JSON válido
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
