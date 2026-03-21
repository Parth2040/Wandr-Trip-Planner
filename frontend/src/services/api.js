import axios from 'axios';

// WANDR CHANGE [1] — keep API client stateless after removing auth/token flow.
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});

export default api;
