import axios from 'axios';

const API = axios.create({
  baseURL: '/api/chat',
  withCredentials: true,
});

export const sendChatMessage = (message, buggyCode, correctCode, conversationHistory, runId = null) =>
  API.post('/', { message, buggyCode, correctCode, conversationHistory, runId });