import axios from 'axios';

const API = axios.create({
  baseURL: '/api/auth',
  withCredentials: true,
});
//login
export const loginUser = (email, password) =>
  API.post('/login', { email, password });

//sign up
export const registerUser = (name, email, password) =>
  API.post('/register', { name, email, password });