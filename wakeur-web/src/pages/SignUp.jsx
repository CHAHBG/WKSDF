import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import {
    SparklesIcon,
    EnvelopeIcon,
    KeyIcon,
    ArrowRightIcon,
    UserPlusIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

const normalizeEmail = (value) => value.trim().toLowerCase();

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
            setError('Veuillez remplir tous les champs.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email: normalizeEmail(email),
                password,
                options: {
                    data: { role: 'owner' },
                },
            });

            if (signUpError) throw signUpError;

            setSuccess('Compte créé ! Veuillez vérifier votre boîte de réception.');
            setTimeout(() => navigate('/login'), 3500);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 sm:p-12 overflow-hidden selection:bg-indigo-100 selection:text-indigo-600">
            {/* Background Accents (Mirror Login) */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 blur-[120px] rounded-full animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-lg relative z-10 bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up p-12 sm:p-16">
                <div className="text-center mb-12">
                    <div className="h-16 w-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 text-indigo-600 shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-100 dark:ring-indigo-900/50">
                        <UserPlusIcon className="w-8 h-8" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        Lancez votre<br />
                        <span className="text-indigo-600 dark:text-indigo-400">Entreprise.</span>
                    </h2>
                    <p className="mt-4 text-slate-500 font-medium">Rejoignez l&apos;écosystème Wakeur Sokhna dès aujourd&apos;hui.</p>
                </div>

                <form className="space-y-6" onSubmit={handleSignUp}>
                    {error && (
                        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl text-rose-600 text-sm font-bold animate-shake">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl text-emerald-600 text-sm font-bold">
                            {success}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Email de l&apos;Administrateur</label>
                        <div className="relative">
                            <EnvelopeIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            <input
                                type="email"
                                required
                                className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="votre@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Mot de Passe Sécurisé</label>
                        <div className="relative">
                            <KeyIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            <input
                                type="password"
                                required
                                className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Confirmation</label>
                        <div className="relative">
                            <ShieldCheckIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            <input
                                type="password"
                                required
                                className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="Répéter le mot de passe"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-lg shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                    >
                        {loading ? (
                            <div className="h-6 w-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                Créer mon Compte
                                <ArrowRightIcon className="w-5 h-5" />
                            </>
                        )}
                    </button>

                    <div className="text-center pt-8 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                            Déjà membre ? <span className="text-indigo-600 underline">Se connecter</span>
                        </button>
                    </div>
                </form>

                <div className="mt-12 flex items-center justify-center gap-2 opacity-50">
                    <SparklesIcon className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Design Premium Ness UI</span>
                </div>
            </div>
        </div>
    );
}
