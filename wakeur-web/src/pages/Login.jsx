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
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6 sm:p-12 animate-fade-in">
            <div className="w-full max-w-5xl flex flex-col lg:flex-row bg-white dark:bg-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl shadow-teal-900/10 border border-zinc-200/50 dark:border-zinc-800/50">

                {/* Visual Side - Matte Joyful */}
                <div className="lg:w-5/12 p-16 lg:p-20 bg-zinc-950 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full -mr-40 -mt-40 blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="h-16 w-16 bg-white text-zinc-950 rounded-2xl flex items-center justify-center mb-12 shadow-xl shadow-white/5">
                            <span className="text-2xl font-black tracking-tighter">W</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter leading-tight">
                            Wakeur <span className="text-teal-400">Sokhna</span>.
                        </h1>
                        <p className="mt-8 text-zinc-400 font-medium text-lg leading-relaxed max-w-xs">
                            Votre écosystème intelligent pour la gestion de point de vente et mobile money.
                        </p>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4 text-zinc-500 font-black text-[10px] uppercase tracking-[0.3em]">
                            <ShieldCheckIcon className="w-5 h-5 text-teal-500" />
                            <span>Opérations Sécurisées</span>
                        </div>
                    </div>
                </div>

                {/* Form Side */}
                <div className="lg:w-7/12 p-16 lg:p-20">
                    <div className="max-w-md mx-auto">
                        <div className="flex items-center justify-between mb-12">
                            <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Connexion</h2>
                            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl">
                                <button
                                    onClick={() => setIsAgentLogin(false)}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isAgentLogin ? 'bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white shadow-premium' : 'text-zinc-500 hover:text-zinc-700'}`}
                                >
                                    Admin
                                </button>
                                <button
                                    onClick={() => setIsAgentLogin(true)}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isAgentLogin ? 'bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white shadow-premium' : 'text-zinc-500 hover:text-zinc-700'}`}
                                >
                                    Agent
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-8">
                            {(error || info) && (
                                <div className={`p-5 rounded-2xl text-xs font-black uppercase tracking-widest border animate-shake ${error ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                    {error || info}
                                </div>
                            )}

                            {!isAgentLogin ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Identifiant Email</label>
                                        <div className="relative group">
                                            <EnvelopeIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-teal-500 transition-colors" />
                                            <input
                                                type="email"
                                                required
                                                className="input-premium pl-14 h-14"
                                                placeholder="votre@email.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Mot de Passe</label>
                                        <div className="relative group">
                                            <KeyIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-teal-500 transition-colors" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                className="input-premium pl-14 pr-16 h-14"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-teal-600 transition-colors"
                                            >
                                                {showPassword ? 'Cacher' : 'Voir'}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Téléphone Agent</label>
                                        <div className="relative group">
                                            <PhoneIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-teal-500 transition-colors" />
                                            <input
                                                type="tel"
                                                required
                                                className="input-premium pl-14 h-14"
                                                placeholder="77 000 00 00"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Code PIN Sécurisé</label>
                                        <input
                                            type="password"
                                            required
                                            maxLength={4}
                                            className="input-premium text-center tracking-[0.8em] !text-2xl font-black h-16"
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
                                className="btn-vibrant w-full h-16 !text-sm !uppercase !tracking-[0.2em]"
                            >
                                {loading ? "Authentification..." : "Accéder à l'espace"}
                                {!loading && <ArrowRightIcon className="w-5 h-5 ml-2" />}
                            </button>

                            <div className="pt-6 flex flex-col items-center">
                                {!isAgentLogin && (
                                    <button
                                        type="button"
                                        onClick={() => navigate('/signup')}
                                        className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-teal-600 transition-colors"
                                    >
                                        Ouvrir mon compte commerce
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
