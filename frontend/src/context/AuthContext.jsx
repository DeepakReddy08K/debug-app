// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [plan, setPlan]       = useState(null);   // { slug, name, monthlyLimit }
  const [usage, setUsage]     = useState(null);   // { used, limit, remaining }
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPlan = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/subscription/me`, { withCredentials: true });
      setPlan(res.data.plan);
      setUsage(res.data.usage);
    } catch {
      // silently fail — not critical
    }
  }, []);

  useEffect(() => {
    axios.get(`${API_URL}/api/auth/me`, { withCredentials: true })
      .then(res => {
        setUser(res.data.user);
        fetchPlan(); // fetch plan after confirming logged in
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [fetchPlan]);

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setPlan(null);
      setUsage(null);
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, plan, usage, fetchPlan, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);