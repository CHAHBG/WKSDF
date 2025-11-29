import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!email || !password || !confirmPassword) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setError(error.message);
        } else {
            setSuccess('Compte créé ! Veuillez vérifier votre email.');
            setTimeout(() => navigate('/login'), 3000);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl border border-gray-100 animate-scale-up">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold text-gray-900 mb-2">
                        Rejoindre<br /><span className="font-light italic text-blue-600">Wakeur Sokhna</span>
                    </h2>
                    <p className="text-gray-500 text-lg">
                        Créez votre espace de gestion.
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSignUp}>
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-xl text-sm font-medium">
                            {success}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="votre@email.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                Mot de passe
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                Confirmer le mot de passe
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
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
                                    <span>Création...</span>
                                </>
                            ) : (
                                'Créer un compte'
                            )}
                        </button>
                    </div>

                    <div className="text-center pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors"
                        >
                            Déjà un compte ? Se connecter
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
