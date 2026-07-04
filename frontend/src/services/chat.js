import axios from 'axios';

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/chat`,
  withCredentials: true,
});

export const sendChatMessage = (message, buggyCode, correctCode, conversationHistory, runId = null) =>
  API.post('/', { message, buggyCode, correctCode, conversationHistory, runId });