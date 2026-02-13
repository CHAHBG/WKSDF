import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    ShieldCheckIcon,
    UserGroupIcon,
    KeyIcon,
    EnvelopeIcon,
    PhoneIcon,
    ArrowRightIcon,
    LifebuoyIcon
} from '@heroicons/react/24/outline';

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_DURATION_MS = 60 * 1000;
const RESET_EMAIL_COOLDOWN_MS = 30 * 1000;
const ADMIN_LOGIN_LOCK_KEY = 'wakeur_admin_login_lock_until';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value) => value.trim().toLowerCase();

const readFutureTimestamp = (storageKey) => {
    try {
        const raw = window.localStorage.getItem(storageKey);
        const parsed = Number(raw);
        return parsed > Date.now() ? parsed : 0;
    } catch {
        return 0;
    }
};

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
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockUntil, setLockUntil] = useState(0);
    const [resetCooldownUntil, setResetCooldownUntil] = useState(0);
    const [nowMs, setNowMs] = useState(Date.now());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    const isLocked = !isAgentLogin && lockUntil > nowMs;
    const lockSecondsRemaining = Math.max(Math.ceil((lockUntil - nowMs) / 1000), 0);
    const isResetCoolingDown = !isAgentLogin && resetCooldownUntil > nowMs;
    const resetCooldownSeconds = Math.max(Math.ceil((resetCooldownUntil - nowMs) / 1000), 0);

    useEffect(() => {
        const storedLockUntil = readFutureTimestamp(ADMIN_LOGIN_LOCK_KEY);
        if (storedLockUntil > 0) setLockUntil(storedLockUntil);

        const params = new URLSearchParams(location.search);
        if (params.get('reset') === 'success') {
            setInfo('Mot de passe mis à jour avec succès.');
        }
    }, [location.search]);

    useEffect(() => {
        if (lockUntil > Date.now() || resetCooldownUntil > Date.now()) {
            const timer = setInterval(() => setNowMs(Date.now()), 1000);
            return () => clearInterval(timer);
        }
    }, [lockUntil, resetCooldownUntil]);

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

            if (isLocked) throw new Error(`Compte verrouillé. Réssayez dans ${lockSecondsRemaining}s.`);

            const { error: loginError } = await supabase.auth.signInWithPassword({
                email: normalizeEmail(email),
                password
            });

            if (loginError) {
                const attempts = failedAttempts + 1;
                if (attempts >= MAX_LOGIN_ATTEMPTS) {
                    const lock = Date.now() + LOGIN_LOCK_DURATION_MS;
                    setLockUntil(lock);
                    window.localStorage.setItem(ADMIN_LOGIN_LOCK_KEY, String(lock));
                    throw new Error('Trop de tentatives. Accès bloqué temporairement.');
                }
                setFailedAttempts(attempts);
                throw new Error('Email ou mot de passe incorrect.');
            }

            window.localStorage.removeItem(ADMIN_LOGIN_LOCK_KEY);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        const normEmail = normalizeEmail(email);
        if (!EMAIL_REGEX.test(normEmail)) {
            setError('Veuillez saisir un email valide.');
            return;
        }
        if (isResetCoolingDown) return;

        setLoading(true);
        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(normEmail, {
                redirectTo: `${window.location.origin}/reset-password`
            });
            if (resetError) throw resetError;
            setResetCooldownUntil(Date.now() + RESET_EMAIL_COOLDOWN_MS);
            setInfo('Lien de réinitialisation envoyé par email.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 sm:p-12 overflow-hidden selection:bg-indigo-100 selection:text-indigo-600">
            {/* Background Accents */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 blur-[120px] rounded-full animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-6xl relative z-10 flex flex-col lg:flex-row bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">

                {/* Brand Side */}
                <div className="lg:w-1/2 p-12 lg:p-20 bg-slate-900 relative overflow-hidden flex flex-col justify-between group">
                    <div className="absolute inset-0 bg-indigo-600 opacity-10 group-hover:opacity-20 transition-opacity duration-700"></div>
                    <div className="relative">
                        <div className="h-14 w-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/50 mb-10">
                            <ShieldCheckIcon className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                            Gérez votre Empire <br />
                            <span className="text-indigo-400">Wakeur Sokhna.</span>
                        </h1>
                        <p className="mt-8 text-slate-400 font-medium text-lg leading-relaxed max-w-md">
                            Plateforme de gestion unifiée pour vos finances, stocks et collaborateurs. Sécurisée, Rapide, Intelligente.
                        </p>
                    </div>

                    <div className="relative mt-20 space-y-6">
                        <div className="flex items-center gap-4 text-slate-300">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 italic font-black">1</div>
                            <span className="text-sm font-bold">Confidentialité de bout en bout</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-300">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 italic font-black">2</div>
                            <span className="text-sm font-bold">Protocoles Bancaires Sécurisés</span>
                        </div>
                    </div>
                </div>

                {/* Form Side */}
                <div className="lg:w-1/2 p-12 lg:p-20">
                    <div className="max-w-md mx-auto">
                        <div className="mb-12 flex items-center justify-between">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Connexion</h2>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                                <button
                                    onClick={() => setIsAgentLogin(false)}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isAgentLogin ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Admin
                                </button>
                                <button
                                    onClick={() => setIsAgentLogin(true)}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isAgentLogin ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Agent
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl text-rose-600 text-sm font-bold animate-shake">
                                    {error}
                                </div>
                            )}

                            {info && (
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl text-emerald-600 text-sm font-bold">
                                    {info}
                                </div>
                            )}

                            {!isAgentLogin ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Email Professionnel</label>
                                        <div className="relative">
                                            <EnvelopeIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                            <input
                                                type="email"
                                                required
                                                className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                placeholder="nom@wakeursokhna.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between px-1">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mot de Passe</label>
                                            <button
                                                type="button"
                                                onClick={handleForgotPassword}
                                                className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors"
                                                disabled={loading || isResetCoolingDown}
                                            >
                                                {isResetCoolingDown ? `Réessayer dans ${resetCooldownSeconds}s` : 'Oublié ?'}
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <KeyIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                className="w-full pl-14 pr-14 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            >
                                                {showPassword ? 'Masquer' : 'Voir'}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Téléphone Agent</label>
                                        <div className="relative">
                                            <PhoneIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                            <input
                                                type="tel"
                                                required
                                                className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                placeholder="77 123 45 67"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Code PIN Secret</label>
                                        <div className="relative">
                                            <ShieldCheckIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                            <input
                                                type="password"
                                                required
                                                maxLength={4}
                                                className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all tracking-[0.5em]"
                                                placeholder="••••"
                                                value={code}
                                                onChange={(e) => setCode(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={loading || isLocked}
                                className="w-full py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-lg shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="h-6 w-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Se Connecter
                                        <ArrowRightIcon className="w-5 h-5" />
                                    </>
                                )}
                            </button>

                            {!isAgentLogin && (
                                <button
                                    type="button"
                                    onClick={() => navigate('/signup')}
                                    className="w-full text-center text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-500 transition-colors py-2"
                                >
                                    Pas d&apos;accès ? <span className="text-indigo-600 underline">Créer un compte</span>
                                </button>
                            )}
                        </form>

                        <div className="mt-20 pt-10 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between opacity-50">
                            <div className="flex items-center gap-2">
                                <LifebuoyIcon className="w-4 h-4 text-slate-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Support Technique</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">v2.4.0</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
