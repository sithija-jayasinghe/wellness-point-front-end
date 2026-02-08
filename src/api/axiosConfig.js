import axios from 'axios';
import { getToken } from '../auth/authStorage';
import { triggerLogout, triggerNavigate } from './authBridge';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const { response } = error;
        if (response) {
            if (response.status === 401) {
                // Trigger logout and redirect to /login
                triggerLogout();
                triggerNavigate('/login');
            } else if (response.status === 403) {
                // Redirect to /unauthorized (do NOT logout)
                triggerNavigate('/unauthorized');
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
