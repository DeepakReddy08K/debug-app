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
//forgot password
export const forgotPasswordUser = (email) =>
  API.post('/forgot-password', { email });
//verify otp
export const verifyOTPUser = (email, otp) =>
  API.post('/verify-otp', { email, otp });
//reset-password
export const resetPasswordUser = (email, password, resetToken) =>
  API.post('/reset-password', { email, password, resetToken });