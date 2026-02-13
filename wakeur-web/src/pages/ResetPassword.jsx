import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import {
    ShieldCheckIcon,
    KeyIcon,
    ArrowRightIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const PASSWORD_RULES = [
    { key: 'length', label: '10 caractères minimum', test: (value) => value.length >= 10 },
    { key: 'upper', label: 'Une lettre majuscule', test: (value) => /[A-Z]/.test(value) },
    { key: 'lower', label: 'Une lettre minuscule', test: (value) => /[a-z]/.test(value) },
    { key: 'digit', label: 'Un chiffre', test: (value) => /\d/.test(value) },
    { key: 'symbol', label: 'Un caractère spécial', test: (value) => /[^A-Za-z0-9]/.test(value) },
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
    const [checkingLink, setCheckingLink] = useState(true);
    const [hasSession, setHasSession] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    const passwordChecks = useMemo(() => PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(password) })), [password]);
    const isPasswordStrongEnough = useMemo(() => passwordChecks.every((rule) => rule.passed), [passwordChecks]);

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            setCheckingLink(true); setError('');
            try {
                const { code, accessToken, refreshToken } = parseRecoveryParams(window.location.href);
                if (code) await supabase.auth.exchangeCodeForSession(code);
                else if (accessToken && refreshToken) await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
                const { data: { session } } = await supabase.auth.getSession();
                if (isMounted) setHasSession(Boolean(session));
            } catch {
                if (isMounted) {
                    setHasSession(false);
                    setError('Lien expiré ou corrompu. Veuillez en demander un nouveau.');
                }
            } finally {
                if (isMounted) setCheckingLink(false);
            }
        };
        init();
        return () => { isMounted = false; };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setInfo('');
        if (!isPasswordStrongEnough || password !== confirmPassword) {
            setError('Veuillez corriger les erreurs avant de continuer.');
            return;
        }

        setLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) throw updateError;
            setInfo('Mot de passe sécurisé. Redirection...');
            await supabase.auth.signOut();
            setTimeout(() => navigate('/login?reset=success', { replace: true }), 1500);
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
            </div>

            <div className="w-full max-w-4xl relative z-10 flex flex-col md:flex-row bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">

                {/* Branding Aside */}
                <div className="md:w-[40%] bg-slate-900 p-12 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-600 opacity-10"></div>
                    <div className="relative">
                        <div className="h-12 w-12 bg-indigo-500 rounded-xl flex items-center justify-center mb-10 shadow-xl shadow-indigo-600/30">
                            <KeyIcon className="w-7 h-7" />
                        </div>
                        <h1 className="text-3xl font-black leading-tight">Sécurisation <br />de l&apos;accès.</h1>
                        <p className="mt-6 text-slate-400 font-medium text-sm leading-relaxed">Le renouvellement du mot de passe assure la protection de vos actifs numériques.</p>
                    </div>
                </div>

                {/* Form Side */}
                <div className="md:w-[60%] p-12 sm:p-16">
                    <div className="max-w-md mx-auto">
                        <div className="mb-10">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Caisse Ouverte</h2>
                            <p className="mt-2 text-slate-500 font-medium">Définissez une nouvelle clé d&apos;entrée pour votre compte.</p>
                        </div>

                        {checkingLink && (
                            <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center gap-3 text-slate-400 text-sm font-bold">
                                <ArrowPathIcon className="w-5 h-5 animate-spin" /> Vériﬁcation du jeton...
                            </div>
                        )}

                        {error && (
                            <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl text-rose-600 text-sm font-bold animate-shake flex items-center gap-3">
                                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {info && (
                            <div className="mb-8 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl text-emerald-600 text-sm font-bold flex items-center gap-3">
                                <CheckCircleIcon className="w-5 h-5" /> {info}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Nouveau Mot de Passe</label>
                                <div className="relative">
                                    <ShieldCheckIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        disabled={checkingLink || !hasSession}
                                        className="w-full pl-14 pr-14 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                                        placeholder="Min. 10 caractères"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-slate-300">
                                        {showPassword ? 'Masquer' : 'Voir'}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Confirmation</label>
                                <div className="relative">
                                    <KeyIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <input
                                        type="password"
                                        required
                                        disabled={checkingLink || !hasSession}
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                                        placeholder="Répétez la saisie"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-3">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Exigences de Sécurité</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                                    {passwordChecks.map(rule => (
                                        <div key={rule.key} className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${rule.passed ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                            <span className={`text-[10px] font-bold ${rule.passed ? 'text-emerald-600' : 'text-slate-400'}`}>{rule.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || checkingLink || !hasSession || !isPasswordStrongEnough}
                                className="w-full py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-lg shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:hover:scale-100"
                            >
                                {loading ? <div className="h-6 w-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : (
                                    <>Valider le Changement <ArrowRightIcon className="w-5 h-5" /></>
                                )}
                            </button>

                            <div className="text-center pt-6">
                                <button type="button" onClick={() => navigate('/login')} className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-colors">
                                    Annuler & Retour
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
