import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    KeyIcon,
    EnvelopeIcon,
    PhoneIcon,
    ArrowRightIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

const normalizeEmail = (value) => value.trim().toLowerCase();

export default function Login() {
    const { loginAsAgent } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [isAgentLogin, setIsAgentLogin] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('reset') === 'success') {
            setInfo('Mot de passe mis à jour avec succès.');
        }
    }, [location.search]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); setInfo(''); setLoading(true);

        try {
            if (isAgentLogin) {
                const res = await loginAsAgent(phone.replace(/\D/g, ''), code.replace(/\D/g, ''));
                if (!res.success) throw new Error(res.error || 'Identifiants agent incorrects.');
                navigate('/');
                return;
            }

            const { error: loginError } = await supabase.auth.signInWithPassword({
                email: normalizeEmail(email),
                password
            });

            if (loginError) throw new Error('Email ou mot de passe incorrect.');
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-app)] animate-enter">
            <div className="w-full max-w-4xl grid lg:grid-cols-2 bg-[var(--bg-card)] rounded-2xl shadow-2xl overflow-hidden border border-[var(--border)]">

                {/* Visual Side */}
                <div className="hidden lg:flex flex-col justify-between p-12 bg-[var(--sidebar-bg)] text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="h-12 w-12 bg-white/10 rounded-lg flex items-center justify-center mb-8 backdrop-blur-sm border border-white/20">
                            <span className="text-xl font-serif-display font-bold">W</span>
                        </div>
                        <h1 className="text-4xl font-serif-display font-bold mb-4 leading-tight">
                            Wakeur Sokhna.
                        </h1>
                        <p className="text-[var(--text-muted)] text-sm leading-relaxed max-w-xs">
                            Plateforme de gestion unifiée pour point de vente et services financiers.
                        </p>
                    </div>
                    <div className="relative z-10 flex items-center gap-3 text-xs font-semibold text-[var(--accent)] tracking-wider uppercase">
                        <ShieldCheckIcon className="w-4 h-4" />
                        <span>Accès Sécurisé</span>
                    </div>
                    {/* Subtle decorative circle */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                </div>

                {/* Form Side */}
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold font-serif-display text-[var(--text-main)] mb-2">Bienvenue</h2>
                        <p className="text-sm text-[var(--text-muted)]">Connectez-vous pour accéder à votre espace.</p>
                    </div>

                    <div className="flex bg-[var(--bg-subtle)] p-1 rounded-lg mb-8">
                        <button
                            onClick={() => setIsAgentLogin(false)}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${!isAgentLogin ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                        >
                            Admin
                        </button>
                        <button
                            onClick={() => setIsAgentLogin(true)}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${isAgentLogin ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                        >
                            Agent
                        </button>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {(error || info) && (
                            <div className={`p-4 rounded-lg text-xs font-medium border ${error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                {error || info}
                            </div>
                        )}

                        {!isAgentLogin ? (
                            <>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-[var(--text-main)]">Email</label>
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

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-[var(--text-main)]">Mot de Passe</label>
                                    <div className="relative">
                                        <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            className="input-modern pl-10 pr-12 w-full"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                                        >
                                            {showPassword ? 'Cacher' : 'Voir'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-[var(--text-main)]">Téléphone Agent</label>
                                    <div className="relative">
                                        <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                        <input
                                            type="tel"
                                            required
                                            className="input-modern pl-10 w-full"
                                            placeholder="77 000 00 00"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-[var(--text-main)]">Code PIN</label>
                                    <input
                                        type="password"
                                        required
                                        maxLength={4}
                                        className="input-modern w-full text-center tracking-[0.5em] font-mono text-lg"
                                        placeholder="••••"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 group"
                        >
                            {loading ? "Chargement..." : "Se Connecter"}
                            {!loading && <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                        </button>

                        {!isAgentLogin && (
                            <div className="text-center pt-4">
                                <button
                                    type="button"
                                    onClick={() => navigate('/signup')}
                                    className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                                >
                                    Créer un compte commerce
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
