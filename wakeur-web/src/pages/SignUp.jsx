import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import {
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
        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email: normalizeEmail(email),
                password,
                options: { data: { role: 'owner' } },
            });

            if (signUpError) throw signUpError;
            setSuccess('Compte créé ! Vérifiez vos emails.');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/5 rounded-full -ml-48 -mb-48 blur-3xl"></div>

            <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[3rem] shadow-2xl shadow-teal-900/10 p-12 lg:p-16 relative z-10">
                <div className="text-center mb-12">
                    <div className="h-16 w-16 bg-teal-50 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center mx-auto mb-8 text-teal-600 shadow-sm">
                        <UserPlusIcon className="w-8 h-8" />
                    </div>
                    <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Ouvrir un compte</h2>
                    <p className="mt-4 text-zinc-500 font-medium">Commencez l&apos;aventure avec Wakeur Sokhna.</p>
                </div>

                <form className="space-y-8" onSubmit={handleSignUp}>
                    {(error || success) && (
                        <div className={`p-5 rounded-2xl text-xs font-black uppercase tracking-widest border animate-shake ${error ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                            {error || success}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Email Administrateur</label>
                        <div className="relative group">
                            <EnvelopeIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-teal-500 transition-colors" />
                            <input
                                type="email"
                                required
                                className="input-premium pl-14 h-14"
                                placeholder="votre@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Mot de Passe</label>
                            <div className="relative group">
                                <KeyIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-teal-500 transition-colors" />
                                <input
                                    type="password"
                                    required
                                    className="input-premium pl-14 h-14"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Confirmation</label>
                            <div className="relative group">
                                <ShieldCheckIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-teal-500 transition-colors" />
                                <input
                                    type="password"
                                    required
                                    className="input-premium pl-14 h-14"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-vibrant w-full h-16 !text-sm !uppercase !tracking-[0.2em]">
                        {loading ? "Création en cours..." : "Créer mon espace"}
                        {!loading && <ArrowRightIcon className="w-5 h-5 ml-2" />}
                    </button>

                    <div className="text-center pt-8 border-t border-zinc-100 dark:border-zinc-800">
                        <button type="button" onClick={() => navigate('/login')} className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-teal-600 transition-colors">
                            Déjà membre ? <span className="text-teal-600 dark:text-teal-400 underline underline-offset-4 decoration-2">Se connecter</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
