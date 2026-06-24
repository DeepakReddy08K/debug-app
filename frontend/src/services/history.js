import axios from 'axios';

const API = axios.create({
  baseURL: '/api/history',
  withCredentials: true,
});

export const getHistory = () => API.get('/');
export const getRunDetail = (runId) => API.get(`/${runId}`);