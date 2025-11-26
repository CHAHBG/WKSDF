import axios from 'axios';

// Use localhost for web since it's running on the same machine usually, 
// or the specific IP if accessing from another device on network.
// For local dev, localhost is fine.
const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
