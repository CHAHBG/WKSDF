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
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-app)] animate-enter">
            <div className="w-full max-w-4xl grid md:grid-cols-2 bg-[var(--bg-card)] rounded-2xl shadow-xl overflow-hidden border border-[var(--border)]">

                {/* Visual Side */}
                <div className="hidden md:flex flex-col justify-between p-12 bg-[var(--sidebar-bg)] text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="h-12 w-12 bg-white/10 rounded-lg flex items-center justify-center mb-8 backdrop-blur-sm border border-white/20">
                            <KeyIcon className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-serif-display font-bold mb-4 leading-tight">Sécurité de l'accès.</h1>
                        <p className="text-[var(--text-muted)] text-sm leading-relaxed max-w-sm">
                            Définissez une nouvelle clé d'entrée pour sécuriser votre compte NESS.
                        </p>
                    </div>
                </div>

                {/* Form Side */}
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                    <div className="mb-8">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-2 block">Récupération</span>
                        <h2 className="text-2xl font-bold font-serif-display text-[var(--text-main)]">Réinitialisation</h2>
                    </div>

                    {(error || info || checkingLink) && (
                        <div className={`p-4 rounded-lg text-xs font-medium border mb-8 flex items-center gap-3 animate-fade-in ${checkingLink ? 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border)]' : error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                            {checkingLink ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : error ? <ExclamationTriangleIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />}
                            {checkingLink ? 'Vériﬁcation du lien...' : error || info}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[var(--text-main)]">Nouveau mot de passe</label>
                            <div className="relative">
                                <ShieldCheckIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                <input
                                    type="password"
                                    required
                                    disabled={checkingLink || !hasSession}
                                    className="input-modern pl-10 w-full"
                                    placeholder="Min. 10 caractères"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[var(--text-main)]">Confirmation</label>
                            <div className="relative">
                                <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                <input
                                    type="password"
                                    required
                                    disabled={checkingLink || !hasSession}
                                    className="input-modern pl-10 w-full"
                                    placeholder="Confirmer votre mot de passe"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border)] grid grid-cols-2 gap-2">
                            {passwordChecks.map(rule => (
                                <div key={rule.key} className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${rule.passed ? 'bg-[var(--success)] shadow-sm' : 'bg-[var(--text-muted)]/30'}`}></div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${rule.passed ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>{rule.label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-4 pt-2">
                            <button type="submit" disabled={loading || !isPasswordStrongEnough || !hasSession} className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 group">
                                {loading ? "Mise à jour..." : "Enregistrer la nouvelle clé"}
                                {!loading && <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                            </button>

                            <button type="button" onClick={() => navigate('/login')} className="w-full text-center text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors py-2">
                                Retourner à la connexion
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
