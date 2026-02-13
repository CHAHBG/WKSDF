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
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
            <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-premium p-10 sm:p-12">
                <div className="text-center mb-10">
                    <div className="h-12 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-6 text-zinc-900 dark:text-white">
                        <UserPlusIcon className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Créer mon compte</h2>
                    <p className="mt-2 text-zinc-500 text-sm">Commencez à gérer votre commerce avec Wakeur Sokhna.</p>
                </div>

                <form className="space-y-6" onSubmit={handleSignUp}>
                    {(error || success) && (
                        <div className={`p-4 rounded-lg text-xs font-bold ${error ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {error || success}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Email Administrateur</label>
                        <div className="relative">
                            <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="email"
                                required
                                className="input-premium pl-11 !text-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Mot de Passe</label>
                        <div className="relative">
                            <KeyIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="password"
                                required
                                className="input-premium pl-11 !text-sm"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Confirmation</label>
                        <div className="relative">
                            <ShieldCheckIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="password"
                                required
                                className="input-premium pl-11 !text-sm"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-vibrant w-full !py-4 !text-sm !uppercase !tracking-[0.2em] shadow-lg">
                        {loading ? "Création..." : "Créer mon compte"}
                        {!loading && <ArrowRightIcon className="w-4 h-4 ml-1" />}
                    </button>

                    <div className="text-center pt-8 border-t border-zinc-100 dark:border-zinc-800">
                        <button type="button" onClick={() => navigate('/login')} className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-950 transition-colors">
                            Déjà membre ? <span className="underline">Se connecter</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
