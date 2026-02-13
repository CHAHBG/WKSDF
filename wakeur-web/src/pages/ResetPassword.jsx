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
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
            <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-premium">

                <div className="md:w-5/12 bg-zinc-900 p-12 text-white flex flex-col justify-between">
                    <div>
                        <div className="h-10 w-10 bg-white text-zinc-950 rounded-lg flex items-center justify-center mb-10">
                            <KeyIcon className="w-5 h-5" />
                        </div>
                        <h1 className="text-2xl font-bold">Sécurité de l&apos;accès.</h1>
                        <p className="mt-4 text-zinc-400 text-sm leading-relaxed max-w-xs">Définissez une nouvelle clé d&apos;entrée pour sécuriser votre compte administrateur.</p>
                    </div>
                </div>

                <div className="md:w-7/12 p-12">
                    <div className="max-w-md mx-auto">
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Réinitialiser</h2>
                        </div>

                        {(error || info || checkingLink) && (
                            <div className={`p-4 rounded-lg text-xs font-bold mb-6 flex items-center gap-2 ${checkingLink ? 'bg-zinc-50 text-zinc-400' : error ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {checkingLink ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : error ? <ExclamationTriangleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                                {checkingLink ? 'Vériﬁcation...' : error || info}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Nouveau mot de passe</label>
                                <div className="relative">
                                    <ShieldCheckIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <input
                                        type="password"
                                        required
                                        disabled={checkingLink || !hasSession}
                                        className="input-premium pl-11 !text-sm"
                                        placeholder="Min. 10 caractères"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Confirmation</label>
                                <div className="relative">
                                    <KeyIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <input
                                        type="password"
                                        required
                                        disabled={checkingLink || !hasSession}
                                        className="input-premium pl-11 !text-sm"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg grid grid-cols-2 gap-2">
                                {passwordChecks.map(rule => (
                                    <div key={rule.key} className="flex items-center gap-2">
                                        <div className={`w-1 h-1 rounded-full ${rule.passed ? 'bg-emerald-500' : 'bg-zinc-300'}`}></div>
                                        <span className={`text-[9px] font-bold ${rule.passed ? 'text-emerald-600' : 'text-zinc-400'}`}>{rule.label}</span>
                                    </div>
                                ))}
                            </div>

                            <button type="submit" disabled={loading || !isPasswordStrongEnough || !hasSession} className="btn-vibrant w-full !py-4 !text-sm !uppercase !tracking-[0.2em] shadow-lg">
                                {loading ? "Mise à jour..." : "Enregistrer"}
                                {!loading && <ArrowRightIcon className="w-4 h-4 ml-1" />}
                            </button>

                            <button type="button" onClick={() => navigate('/login')} className="w-full text-center text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-950 transition-colors">
                                Annuler
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
