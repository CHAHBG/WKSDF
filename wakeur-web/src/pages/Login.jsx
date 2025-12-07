import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
    const { loginAsAgent } = useAuth();
    const [isAgentLogin, setIsAgentLogin] = useState(false);

    // Admin State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Agent State
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isAgentLogin) {
                // Agent Login
                if (!phone || !code) {
                    throw new Error('Veuillez saisir le téléphone et le code PIN');
                }
                const result = await loginAsAgent(phone, code);
                if (!result.success) throw new Error(result.error);
                navigate('/');
            } else {
                // Admin Login
                if (!email || !password) {
                    throw new Error('Veuillez saisir l\'email et le mot de passe');
                }
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate('/');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl border border-gray-100 animate-scale-up">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-bold text-gray-900 mb-2">
                        Ness<span className="font-light italic text-blue-600">Shop</span>
                    </h2>
                    <p className="text-gray-500 text-lg">
                        {isAgentLogin ? 'Espace Agent' : 'Espace Administration'}
                    </p>
                </div>

                {/* Toggle Switch */}
                <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
                    <button
                        type="button"
                        onClick={() => setIsAgentLogin(false)}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isAgentLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Administration
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsAgentLogin(true)}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isAgentLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Agent
                    </button>
                </div>

                <form className="space-y-6" onSubmit={handleLogin}>
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {!isAgentLogin ? (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="admin@ness.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                        Mot de passe
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                        Téléphone
                                    </label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="77 123 45 67"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                        Code PIN
                                    </label>
                                    <input
                                        type="password"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono tracking-widest"
                                        placeholder="••••"
                                        maxLength={4}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Connexion...</span>
                                </>
                            ) : (
                                'Se connecter'
                            )}
                        </button>
                    </div>

                    {!isAgentLogin && (
                        <div className="text-center pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => navigate('/signup')}
                                className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors"
                            >
                                Pas encore de compte ? Créer un compte
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
