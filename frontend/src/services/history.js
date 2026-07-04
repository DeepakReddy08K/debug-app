import axios from 'axios';

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/history`,
  withCredentials: true,
});

export const getHistory = () => API.get('/');
export const getRunDetail = (runId) => API.get(`/${runId}`);