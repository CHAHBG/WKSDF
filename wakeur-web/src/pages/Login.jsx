import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

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
        if (!Number.isFinite(parsed)) return 0;
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
    const [showCode, setShowCode] = useState(false);

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
        if (storedLockUntil > 0) {
            setLockUntil(storedLockUntil);
        }
    }, []);

    useEffect(() => {
        const hasCountdown = lockUntil > Date.now() || resetCooldownUntil > Date.now();
        if (!hasCountdown) return undefined;

        const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [lockUntil, resetCooldownUntil]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('reset') === 'success') {
            setInfo('Mot de passe mis a jour. Connectez-vous avec le nouveau mot de passe.');
        }
    }, [location.search]);

    const switchMode = (agentMode) => {
        setIsAgentLogin(agentMode);
        setError('');
        setInfo('');
    };

    const registerFailedAdminAttempt = () => {
        const attempts = failedAttempts + 1;
        if (attempts >= MAX_LOGIN_ATTEMPTS) {
            const nextLockUntil = Date.now() + LOGIN_LOCK_DURATION_MS;
            setFailedAttempts(0);
            setLockUntil(nextLockUntil);
            window.localStorage.setItem(ADMIN_LOGIN_LOCK_KEY, String(nextLockUntil));
            throw new Error(`Trop de tentatives. Reessayez dans ${Math.ceil(LOGIN_LOCK_DURATION_MS / 1000)} secondes.`);
        }

        setFailedAttempts(attempts);
        throw new Error('Email ou mot de passe incorrect.');
    };

    const handleLogin = async (event) => {
        event.preventDefault();
        if (loading) return;

        setError('');
        setInfo('');
        setLoading(true);

        try {
            if (isAgentLogin) {
                const sanitizedPhone = phone.replace(/\D/g, '');
                const sanitizedCode = code.replace(/\D/g, '');

                if (!sanitizedPhone || !sanitizedCode) {
                    throw new Error('Veuillez saisir le telephone et le code PIN.');
                }

                const result = await loginAsAgent(sanitizedPhone, sanitizedCode);
                if (!result.success) {
                    throw new Error(result.error || 'Connexion agent impossible.');
                }

                navigate('/');
                return;
            }

            if (isLocked) {
                throw new Error(`Compte temporairement bloque. Reessayez dans ${lockSecondsRemaining} secondes.`);
            }

            const normalizedEmail = normalizeEmail(email);
            if (!EMAIL_REGEX.test(normalizedEmail) || !password) {
                throw new Error('Veuillez saisir un email valide et un mot de passe.');
            }

            const { error: loginError } = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password,
            });

            if (loginError) {
                if (/invalid login credentials/i.test(loginError.message || '')) {
                    registerFailedAdminAttempt();
                }
                throw new Error(loginError.message || 'Connexion impossible.');
            }

            setFailedAttempts(0);
            setLockUntil(0);
            window.localStorage.removeItem(ADMIN_LOGIN_LOCK_KEY);
            navigate('/');
        } catch (loginFlowError) {
            setError(loginFlowError.message || 'Connexion impossible.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (loading) return;

        setError('');
        setInfo('');

        const normalizedEmail = normalizeEmail(email);
        if (!EMAIL_REGEX.test(normalizedEmail)) {
            setError('Veuillez saisir un email valide puis cliquer sur "Mot de passe oublie ?".');
            return;
        }

        if (isResetCoolingDown) {
            setInfo(`Veuillez patienter ${resetCooldownSeconds} secondes avant une nouvelle demande.`);
            return;
        }

        setLoading(true);
        try {
            const redirectTo = `${window.location.origin}/reset-password`;
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });

            if (resetError) {
                if (/rate limit/i.test(resetError.message || '')) {
                    throw new Error('Trop de demandes de reinitialisation. Veuillez patienter un peu.');
                }
                throw new Error('Impossible d envoyer l email de reinitialisation pour le moment.');
            }

            setResetCooldownUntil(Date.now() + RESET_EMAIL_COOLDOWN_MS);
            setInfo('Si un compte existe pour cet email, un lien de reinitialisation a ete envoye.');
        } catch (resetFlowError) {
            setError(resetFlowError.message || 'Erreur lors de la demande de reinitialisation.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-100">
            <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center p-4 sm:p-6">
                <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl md:grid-cols-[1.1fr_1fr]">
                    <aside className="hidden bg-white p-10 text-slate-900 border-r border-slate-200 md:flex md:flex-col md:justify-between">
                        <div>
                            <p className="inline-flex items-center rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                Wakeur Sokhna
                            </p>
                            <h1 className="mt-6 text-4xl font-bold leading-tight">
                                Gestion securisee
                                <br />
                                pour votre boutique
                            </h1>
                            <p className="mt-4 text-sm text-slate-600">
                                Connexion admin et agent, recuperation de mot de passe par email, et flux de connexion renforce.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bonnes pratiques</p>
                            <ul className="mt-3 space-y-2 text-sm text-slate-700">
                                <li>Utilisez un mot de passe unique et robuste.</li>
                                <li>Ne partagez jamais votre code PIN agent.</li>
                                <li>Demandez un nouveau lien si l ancien a expire.</li>
                            </ul>
                        </div>
                    </aside>

                    <main className="p-6 sm:p-10">
                        <div className="mb-8 text-center md:text-left">
                            <h2 className="text-3xl font-bold text-slate-900">Connexion</h2>
                            <p className="mt-2 text-sm text-slate-500">
                                {isAgentLogin ? 'Espace agent' : 'Espace administration'}
                            </p>
                        </div>

                        <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
                            <button
                                type="button"
                                onClick={() => switchMode(false)}
                                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                    !isAgentLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Administration
                            </button>
                            <button
                                type="button"
                                onClick={() => switchMode(true)}
                                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                    isAgentLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Agent
                            </button>
                        </div>

                        <form className="space-y-5" onSubmit={handleLogin}>
                            {error && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                    {error}
                                </div>
                            )}

                            {info && (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                                    {info}
                                </div>
                            )}

                            {isLocked && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                                    Trop de tentatives de connexion. Reessayez dans {lockSecondsRemaining} secondes.
                                </div>
                            )}

                            {!isAgentLogin ? (
                                <>
                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            autoComplete="email"
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                            placeholder="admin@wakeur.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                                            Mot de passe
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                autoComplete="current-password"
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-20 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                                placeholder="Votre mot de passe"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((value) => !value)}
                                                className="absolute inset-y-0 right-3 text-xs font-semibold text-slate-500 hover:text-slate-700"
                                            >
                                                {showPassword ? 'Masquer' : 'Voir'}
                                            </button>
                                        </div>

                                        <div className="mt-2 flex items-center justify-between">
                                            <button
                                                type="button"
                                                disabled={loading}
                                                onClick={handleForgotPassword}
                                                className="text-sm font-semibold text-slate-500 transition hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                Mot de passe oublie ?
                                            </button>
                                            {isResetCoolingDown && (
                                                <span className="text-xs font-semibold text-slate-400">
                                                    Nouvelle demande dans {resetCooldownSeconds}s
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                                            Telephone
                                        </label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            autoComplete="tel"
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                            placeholder="77 123 45 67"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                                            Code PIN
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showCode ? 'text' : 'password'}
                                                value={code}
                                                autoComplete="one-time-code"
                                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                                className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-20 text-sm font-semibold tracking-[0.35em] text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                                placeholder="0000"
                                                maxLength={4}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCode((value) => !value)}
                                                className="absolute inset-y-0 right-3 text-xs font-semibold text-slate-500 hover:text-slate-700"
                                            >
                                                {showCode ? 'Masquer' : 'Voir'}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={loading || isLocked}
                                className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? 'Connexion en cours...' : 'Se connecter'}
                            </button>

                            {!isAgentLogin && (
                                <div className="border-t border-slate-100 pt-4 text-center">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/signup')}
                                        className="text-sm font-semibold text-slate-500 transition hover:text-slate-800"
                                    >
                                        Pas encore de compte ? Creer un compte
                                    </button>
                                </div>
                            )}
                        </form>
                    </main>
                </div>
            </div>
        </div>
    );
}


