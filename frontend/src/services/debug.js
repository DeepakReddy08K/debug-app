import axios from 'axios';

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/debug`,
  withCredentials: true,
});

export const runFullPipeline = (buggyCode, correctCode, additionalInfo) =>
  API.post('/run', { buggyCode, correctCode, additionalInfo });

export const runSingleTest = (buggyCode, correctCode, input) =>
  API.post('/run-single', { buggyCode, correctCode, input });