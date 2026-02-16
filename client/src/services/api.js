import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Proxy is set in package.json to localhost:5000
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to attach the token if it exists
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Assuming standard token storage
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
