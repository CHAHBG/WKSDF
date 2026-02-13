import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    ShieldCheckIcon,
    KeyIcon,
    EnvelopeIcon,
    PhoneIcon,
    ArrowRightIcon
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
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6 sm:p-12">
            <div className="w-full max-w-5xl flex flex-col lg:flex-row bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-premium">

                {/* Visual Side - Dark & Solid */}
                <div className="lg:w-5/12 p-12 lg:p-16 bg-zinc-900 flex flex-col justify-between text-white">
                    <div>
                        <div className="h-10 w-10 bg-white text-zinc-950 rounded-lg flex items-center justify-center mb-10">
                            <span className="font-bold">W</span>
                        </div>
                        <h1 className="text-3xl font-bold leading-tight">
                            Wakeur Sokhna.
                            <br />
                            <span className="text-zinc-500 font-medium text-lg">Système de Gestion</span>
                        </h1>
                        <p className="mt-6 text-zinc-400 text-sm leading-relaxed max-w-xs">
                            Accédez à votre espace sécurisé pour gérer vos opérations, stocks et rapports en temps réel.
                        </p>
                    </div>

                    <div className="space-y-4 opacity-50">
                        <div className="flex items-center gap-3">
                            <ShieldCheckIcon className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Opérations Sécurisées</span>
                        </div>
                    </div>
                </div>

                {/* Form Side */}
                <div className="lg:w-7/12 p-12 lg:p-16">
                    <div className="max-w-md mx-auto">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Connexion</h2>
                            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                                <button
                                    onClick={() => setIsAgentLogin(false)}
                                    className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${!isAgentLogin ? 'bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                                >
                                    Admin
                                </button>
                                <button
                                    onClick={() => setIsAgentLogin(true)}
                                    className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${isAgentLogin ? 'bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                                >
                                    Agent
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            {(error || info) && (
                                <div className={`p-4 rounded-lg text-xs font-bold ${error ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {error || info}
                                </div>
                            )}

                            {!isAgentLogin ? (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Email</label>
                                        <div className="relative">
                                            <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                            <input
                                                type="email"
                                                required
                                                className="input-premium pl-11 !text-sm"
                                                placeholder="votre@email.com"
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
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                className="input-premium pl-11 pr-12 !text-sm"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 hover:text-zinc-600"
                                            >
                                                {showPassword ? 'Cacher' : 'Voir'}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Téléphone Agent</label>
                                        <div className="relative">
                                            <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                            <input
                                                type="tel"
                                                required
                                                className="input-premium pl-11 !text-sm"
                                                placeholder="77 000 00 00"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Code PIN</label>
                                        <input
                                            type="password"
                                            required
                                            maxLength={4}
                                            className="input-premium text-center tracking-[0.5em] !text-lg font-bold"
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
                                className="btn-vibrant w-full !py-4 !text-sm !uppercase !tracking-[0.2em] shadow-lg"
                            >
                                {loading ? "Connexion..." : "Se connecter"}
                                {!loading && <ArrowRightIcon className="w-4 h-4 ml-1" />}
                            </button>

                            <div className="pt-4 flex flex-col gap-3">
                                {!isAgentLogin && (
                                    <button
                                        type="button"
                                        onClick={() => navigate('/signup')}
                                        className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-950 transition-colors"
                                    >
                                        Créer mon commerce
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
