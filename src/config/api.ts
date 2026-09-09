import axios from 'axios';
import qs from 'qs';

const instance = axios.create({
  baseURL: import.meta.env.VITE_BACK_URL + '/api/v1',
  paramsSerializer: {
    serialize: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
  },
  timeout: 10000, //10s
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default instance;
