// frontend/src/services/subscription.js
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

export const getPlans = async () => {
  const res = await axios.get(`${API}/api/subscription/plans`, { withCredentials: true });
  return res.data.plans;
};

export const getMyPlan = async () => {
  const res = await axios.get(`${API}/api/subscription/me`, { withCredentials: true });
  return res.data;
};

export const createOrder = async (planSlug) => {
  const res = await axios.post(
    `${API}/api/subscription/create-order`,
    { planSlug },
    { withCredentials: true }
  );
  return res.data;
};

export const verifyPayment = async (payload) => {
  const res = await axios.post(
    `${API}/api/subscription/verify-payment`,
    payload,
    { withCredentials: true }
  );
  return res.data;
};