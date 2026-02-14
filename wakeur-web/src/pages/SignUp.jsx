import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import {
    EnvelopeIcon,
    KeyIcon,
    ArrowRightIcon,
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
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-app)] animate-enter">
            <div className="w-full max-w-md bg-[var(--bg-card)] rounded-2xl shadow-xl p-8 border border-[var(--border)]">
                <div className="text-center mb-8">
                    <div className="h-10 w-10 bg-[var(--bg-subtle)] rounded-lg flex items-center justify-center mx-auto mb-4 text-[var(--primary)] border border-[var(--border)]">
                        <span className="font-serif-display font-bold text-lg">W</span>
                    </div>
                    <h2 className="text-2xl font-bold font-serif-display text-[var(--text-main)]">Créer un compte</h2>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">Rejoignez l'écosystème NESS.</p>
                </div>

                <form className="space-y-5" onSubmit={handleSignUp}>
                    {(error || success) && (
                        <div className={`p-4 rounded-lg text-xs font-medium border ${error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                            {error || success}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--text-main)]">Email Administrateur</label>
                        <div className="relative">
                            <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                            <input
                                type="email"
                                required
                                className="input-modern pl-10 w-full"
                                placeholder="votre@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[var(--text-main)]">Mot de Passe</label>
                            <div className="relative">
                                <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                <input
                                    type="password"
                                    required
                                    className="input-modern pl-10 w-full"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[var(--text-main)]">Confirmation</label>
                            <div className="relative">
                                <ShieldCheckIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                <input
                                    type="password"
                                    required
                                    className="input-modern pl-10 w-full"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 mt-4 group">
                        {loading ? "Création..." : "S'inscrire"}
                        {!loading && <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                    </button>

                    <div className="text-center pt-6 border-t border-[var(--border)]">
                        <button type="button" onClick={() => navigate('/login')} className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
                            Déjà membre ? <span className="text-[var(--primary)] font-semibold">Se connecter</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
