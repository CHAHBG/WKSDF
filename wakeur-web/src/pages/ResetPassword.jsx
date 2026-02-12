import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const PASSWORD_RULES = [
    { key: 'length', label: '10 caracteres minimum', test: (value) => value.length >= 10 },
    { key: 'upper', label: 'Une lettre majuscule', test: (value) => /[A-Z]/.test(value) },
    { key: 'lower', label: 'Une lettre minuscule', test: (value) => /[a-z]/.test(value) },
    { key: 'digit', label: 'Un chiffre', test: (value) => /\d/.test(value) },
    { key: 'symbol', label: 'Un caractere special', test: (value) => /[^A-Za-z0-9]/.test(value) },
];

const parseRecoveryParams = (urlValue) => {
    try {
        const url = new URL(urlValue);
        const queryParams = new URLSearchParams(url.search);
        const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));

        return {
            code: queryParams.get('code') || hashParams.get('code'),
            accessToken: hashParams.get('access_token') || queryParams.get('access_token'),
            refreshToken: hashParams.get('refresh_token') || queryParams.get('refresh_token'),
        };
    } catch {
        return { code: null, accessToken: null, refreshToken: null };
    }
};

export default function ResetPassword() {
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [checkingLink, setCheckingLink] = useState(true);
    const [hasSession, setHasSession] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    const passwordChecks = useMemo(
        () =>
            PASSWORD_RULES.map((rule) => ({
                ...rule,
                passed: rule.test(password),
            })),
        [password],
    );

    const isPasswordStrongEnough = useMemo(
        () => passwordChecks.every((rule) => rule.passed),
        [passwordChecks],
    );

    useEffect(() => {
        let isMounted = true;

        const applyRecoverySession = async () => {
            const { code, accessToken, refreshToken } = parseRecoveryParams(window.location.href);

            if (code) {
                const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                if (exchangeError) throw exchangeError;
                return;
            }

            if (accessToken && refreshToken) {
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });
                if (sessionError) throw sessionError;
            }
        };

        const init = async () => {
            setCheckingLink(true);
            setError('');

            try {
                await applyRecoverySession();
                const { data: { session } } = await supabase.auth.getSession();
                if (isMounted) {
                    setHasSession(Boolean(session));
                }
            } catch {
                if (isMounted) {
                    setHasSession(false);
                    setError('Lien invalide ou expire. Demandez un nouveau lien de reinitialisation.');
                }
            } finally {
                if (isMounted) {
                    setCheckingLink(false);
                }
            }
        };

        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!isMounted) return;

            if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                setHasSession(Boolean(session));
            }

            if (event === 'SIGNED_OUT') {
                setHasSession(false);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        setError('');
        setInfo('');

        if (!hasSession) {
            setError('Session de reinitialisation absente. Demandez un nouveau lien.');
            return;
        }

        if (!isPasswordStrongEnough) {
            setError('Le mot de passe ne respecte pas toutes les regles de securite.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Les deux mots de passe ne correspondent pas.');
            return;
        }

        setLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) {
                throw updateError;
            }

            setInfo('Mot de passe mis a jour. Redirection vers la connexion...');

            // End the temporary recovery session for a clean login.
            await supabase.auth.signOut();

            window.setTimeout(() => {
                navigate('/login?reset=success', { replace: true });
            }, 900);
        } catch (err) {
            if (/session/i.test(err.message || '')) {
                setError('Session de reinitialisation expiree. Demandez un nouveau lien.');
            } else {
                setError(err.message || 'Impossible de mettre a jour le mot de passe.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950">
            <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-cyan-300/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />

            <div className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center p-4 sm:p-6">
                <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl md:grid-cols-[1fr_1.1fr]">
                    <aside className="hidden bg-slate-900 p-10 text-slate-100 md:block">
                        <p className="inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                            Securite du compte
                        </p>
                        <h1 className="mt-6 text-3xl font-bold leading-tight text-white">
                            Reinitialisation
                            <br />
                            renforcee
                        </h1>
                        <p className="mt-4 text-sm text-slate-300">
                            Choisissez un mot de passe robuste pour proteger les donnees de votre boutique.
                        </p>

                        <div className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-200">
                            Utilisez un mot de passe que vous n utilisez pas sur un autre service.
                        </div>
                    </aside>

                    <main className="p-6 sm:p-10">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-slate-900">Nouveau mot de passe</h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Entrez un mot de passe securise puis confirmez-le.
                            </p>
                        </div>

                        {checkingLink && (
                            <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                                Verification du lien en cours...
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                {error}
                            </div>
                        )}

                        {info && (
                            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                                {info}
                            </div>
                        )}

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                                    Nouveau mot de passe
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        autoComplete="new-password"
                                        disabled={loading || checkingLink || !hasSession}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-20 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                        placeholder="Votre nouveau mot de passe"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((value) => !value)}
                                        className="absolute inset-y-0 right-3 text-xs font-semibold text-slate-500 hover:text-slate-700"
                                    >
                                        {showPassword ? 'Masquer' : 'Voir'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                                    Confirmer le mot de passe
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        autoComplete="new-password"
                                        disabled={loading || checkingLink || !hasSession}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-20 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                        placeholder="Confirmez le mot de passe"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((value) => !value)}
                                        className="absolute inset-y-0 right-3 text-xs font-semibold text-slate-500 hover:text-slate-700"
                                    >
                                        {showConfirmPassword ? 'Masquer' : 'Voir'}
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Regles mot de passe</p>
                                <ul className="space-y-2 text-sm">
                                    {passwordChecks.map((rule) => (
                                        <li key={rule.key} className={rule.passed ? 'text-emerald-700' : 'text-slate-500'}>
                                            {rule.passed ? 'OK' : '...'} {rule.label}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || checkingLink || !hasSession}
                                className="w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? 'Mise a jour...' : 'Mettre a jour le mot de passe'}
                            </button>

                            <div className="border-t border-slate-100 pt-4 text-center">
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => navigate('/login', { replace: true })}
                                    className="text-sm font-semibold text-slate-500 transition hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Retour a la connexion
                                </button>
                            </div>
                        </form>
                    </main>
                </div>
            </div>
        </div>
    );
}
