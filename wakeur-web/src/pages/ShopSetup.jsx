import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    BuildingStorefrontIcon,
    MapPinIcon,
    PhoneIcon,
    EnvelopeIcon,
    ArrowRightIcon,
    ArrowLeftOnRectangleIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

const isMissingRpcError = (error) => {
    if (!error) return false;
    const code = String(error.code || '');
    const message = String(error.message || '');
    return code === '42883' || code === 'PGRST202' || /function .*initialize_owner_shop/i.test(message);
};

const cleanOptional = (value) => {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
};

export default function ShopSetup() {
    const navigate = useNavigate();
    const { user, refreshProfile, signOut } = useAuth();
    const [shopName, setShopName] = useState('');
    const [location, setLocation] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState(user?.email || '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!user) return;
        if (!shopName.trim()) {
            setError('Le nom de la boutique est obligatoire.');
            return;
        }

        setError('');
        setSubmitting(true);

        try {
            const rpcPayload = {
                p_shop_name: shopName.trim(),
                p_location: cleanOptional(location),
                p_phone_number: cleanOptional(phoneNumber),
                p_email: cleanOptional(email),
            };

            const { data: rpcData, error: rpcError } = await supabase.rpc('initialize_owner_shop', rpcPayload);
            let setupCompleted = !rpcError && Boolean((Array.isArray(rpcData) ? rpcData[0] : rpcData)?.shop_id);

            if (!setupCompleted) {
                const { data: existingShop } = await supabase.from('shop_settings').select('id').eq('owner_id', user.id).maybeSingle();
                const shopPayload = { shop_name: shopName.trim(), location: cleanOptional(location), phone_number: cleanOptional(phoneNumber), email: cleanOptional(email), owner_id: user.id };

                let shopId = existingShop?.id;
                if (shopId) {
                    await supabase.from('shop_settings').update(shopPayload).eq('id', shopId);
                } else {
                    const { data: createdShop } = await supabase.from('shop_settings').insert(shopPayload).select('id').single();
                    shopId = createdShop.id;
                }
                await supabase.from('users_profile').update({ shop_id: shopId }).eq('id', user.id).eq('role', 'owner');
            }

            await refreshProfile();
            navigate('/', { replace: true });
        } catch (err) {
            setError('Échec de la configuration. Veuillez vérifier vos permissions SQL.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 sm:p-12 overflow-hidden selection:bg-indigo-100 selection:text-indigo-600">
            {/* Background Accents */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-indigo-500 blur-[150px] rounded-full"></div>
            </div>

            <div className="w-full max-w-4xl relative z-10 flex flex-col md:flex-row bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">

                {/* Branding Sidebar */}
                <div className="md:w-[35%] bg-slate-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-600 opacity-10"></div>
                    <div className="relative">
                        <div className="h-14 w-14 bg-indigo-500 rounded-2xl flex items-center justify-center mb-10 shadow-2xl shadow-indigo-500/30">
                            <BuildingStorefrontIcon className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-black leading-tight">Configuration <br /> Bâtiment.</h1>
                        <p className="mt-6 text-slate-400 font-medium text-sm leading-relaxed">Personnalisez votre espace de travail pour une gestion optimale de vos flux.</p>
                    </div>

                    <div className="relative flex items-center justify-center gap-2 opacity-50 bg-white/5 p-4 rounded-2xl border border-white/10">
                        <SparklesIcon className="w-5 h-5 text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Setup Progress: 90%</span>
                    </div>
                </div>

                {/* Form Section */}
                <div className="md:w-[65%] p-12 sm:p-16">
                    <div className="max-w-md mx-auto">
                        <div className="mb-10">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic">Initialisation Boutique</h2>
                            <p className="mt-2 text-slate-500 font-medium">Définissez l&apos;identité légale de votre point de vente.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl text-rose-600 text-sm font-bold animate-shake">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Raison Sociale / Nom</label>
                                <div className="relative">
                                    <BuildingStorefrontIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="Ex: Boutique Sokhna"
                                        value={shopName}
                                        onChange={(e) => setShopName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Téléphone</label>
                                    <div className="relative">
                                        <PhoneIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input
                                            type="tel"
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="77 123 45 67"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Contact Email</label>
                                    <div className="relative">
                                        <EnvelopeIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input
                                            type="email"
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="contact@boutique.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Localisation Géo</label>
                                <div className="relative">
                                    <MapPinIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <input
                                        type="text"
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="Ville, Quartier, Secteur"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-lg shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {submitting ? <div className="h-6 w-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : (
                                        <>Finaliser <ArrowRightIcon className="w-5 h-5" /></>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => signOut().then(() => navigate('/login'))}
                                    className="px-8 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[1.8rem] font-black flex items-center justify-center gap-2 hover:bg-slate-200 transition-all border border-slate-200 dark:border-slate-700"
                                >
                                    <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
