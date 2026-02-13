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
    { key: 'length', label: '10 caractères min.', test: (value) => value.length >= 10 },
    { key: 'upper', label: 'Majuscule', test: (value) => /[A-Z]/.test(value) },
    { key: 'lower', label: 'Minuscule', test: (value) => /[a-z]/.test(value) },
    { key: 'digit', label: 'Chiffre', test: (value) => /\d/.test(value) },
    { key: 'symbol', label: 'Spécial', test: (value) => /[^A-Za-z0-9]/.test(value) },
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
    const [checkingLink, setCheckingLink] = useState(true);
    const [hasSession, setHasSession] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    const passwordChecks = useMemo(() => PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(password) })), [password]);
    const isPasswordStrongEnough = useMemo(() => passwordChecks.every((rule) => rule.passed), [passwordChecks]);

    useEffect(() => {
        const init = async () => {
            try {
                const { code, accessToken, refreshToken } = parseRecoveryParams(window.location.href);
                if (code) await supabase.auth.exchangeCodeForSession(code);
                else if (accessToken && refreshToken) await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
                const { data: { session } } = await supabase.auth.getSession();
                setHasSession(Boolean(session));
            } catch {
                setError('Lien expiré ou invalide.');
            } finally {
                setCheckingLink(false);
            }
        };
        init();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) throw updateError;
            setInfo('Réinitialisation réussie.');
            await supabase.auth.signOut();
            setTimeout(() => navigate('/login?reset=success'), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-5xl flex flex-col md:flex-row bg-white dark:bg-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl shadow-teal-900/10 border border-zinc-200/50 dark:border-zinc-800/50">

                <div className="md:w-5/12 bg-zinc-950 p-16 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="h-14 w-14 bg-teal-500 rounded-2xl flex items-center justify-center mb-12 shadow-lg shadow-teal-500/20">
                            <KeyIcon className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter leading-tight">Sécurité de l&apos;accès.</h1>
                        <p className="mt-6 text-zinc-400 font-medium text-lg leading-relaxed">Définissez une nouvelle clé d&apos;entrée pour sécuriser votre compte Wakeur.</p>
                    </div>
                </div>

                <div className="md:w-7/12 p-16 lg:p-20">
                    <div className="max-w-md mx-auto">
                        <div className="mb-12">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-600 mb-2 block">Récupération</span>
                            <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Réinitialisation</h2>
                        </div>

                        {(error || info || checkingLink) && (
                            <div className={`p-5 rounded-2xl text-xs font-black uppercase tracking-widest border mb-10 flex items-center gap-3 animate-fade-in ${checkingLink ? 'bg-zinc-50 text-zinc-400 border-zinc-100' : error ? 'bg-rose-50 text-rose-600 border-rose-100 animate-shake' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                {checkingLink ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : error ? <ExclamationTriangleIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />}
                                {checkingLink ? 'Vériﬁcation du lien...' : error || info}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Nouveau mot de passe</label>
                                <div className="relative group">
                                    <ShieldCheckIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-teal-500 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        disabled={checkingLink || !hasSession}
                                        className="input-premium pl-14 h-14"
                                        placeholder="Min. 10 caractères"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Confirmation</label>
                                <div className="relative group">
                                    <KeyIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-teal-500 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        disabled={checkingLink || !hasSession}
                                        className="input-premium pl-14 h-14"
                                        placeholder="Confirmer votre mot de passe"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-[1.5rem] border border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-3">
                                {passwordChecks.map(rule => (
                                    <div key={rule.key} className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${rule.passed ? 'bg-teal-500 shadow-sm shadow-teal-500/50' : 'bg-zinc-300 dark:bg-zinc-700'}`}></div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${rule.passed ? 'text-teal-600' : 'text-zinc-400'}`}>{rule.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-4 pt-4">
                                <button type="submit" disabled={loading || !isPasswordStrongEnough || !hasSession} className="btn-vibrant w-full h-16 !text-sm !uppercase !tracking-[0.2em]">
                                    {loading ? "Mise à jour..." : "Enregistrer la nouvelle clé"}
                                    {!loading && <ArrowRightIcon className="w-5 h-5 ml-2" />}
                                </button>

                                <button type="button" onClick={() => navigate('/login')} className="w-full text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-teal-600 transition-colors py-2">
                                    Retourner à la connexion
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
