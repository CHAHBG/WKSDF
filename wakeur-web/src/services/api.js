import axios from 'axios';
import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            return Promise.reject(new Error('Reseau indisponible. Verifiez votre connexion.'));
        }

        return Promise.reject(error);
    },
);

export default api;
