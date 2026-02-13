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
    ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';

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
                const shopPayload = { shop_name: shopName.trim(), location: cleanOptional(location), phone_number: cleanOptional(phoneNumber), email: cleanOptional(email), owner_id: user.id };
                const { data: createdShop } = await supabase.from('shop_settings').insert(shopPayload).select('id').single();
                await supabase.from('users_profile').update({ shop_id: createdShop.id }).eq('id', user.id).eq('role', 'owner');
            }

            await refreshProfile();
            navigate('/', { replace: true });
        } catch (err) {
            setError('Échec de la configuration.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-5xl flex flex-col md:flex-row bg-white dark:bg-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl shadow-teal-900/10 border border-zinc-200/50 dark:border-zinc-800/50">

                <div className="md:w-5/12 bg-zinc-950 p-16 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="h-14 w-14 bg-teal-500 rounded-2xl flex items-center justify-center mb-12 shadow-lg shadow-teal-500/20">
                            <BuildingStorefrontIcon className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter leading-tight">Configuration de votre commerce.</h1>
                        <p className="mt-6 text-zinc-400 font-medium text-lg leading-relaxed">Activez la puissance de Wakeur en définissant l&apos;identité fondamentale de votre boutique.</p>
                    </div>
                </div>

                <div className="md:w-7/12 p-16 lg:p-20">
                    <div className="max-w-md mx-auto">
                        <div className="mb-12">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-600 mb-2 block">Étape Finale</span>
                            <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Initialisation d&apos;activité</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {error && (
                                <div className="p-5 bg-rose-50 text-rose-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-rose-100 animate-shake">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Nom de l&apos;établissement</label>
                                <div className="relative group">
                                    <BuildingStorefrontIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-teal-500 transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        className="input-premium pl-14 h-14"
                                        placeholder="Ex: Boutique Sokhna"
                                        value={shopName}
                                        onChange={(e) => setShopName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Téléphone</label>
                                    <input
                                        type="tel"
                                        className="input-premium h-14"
                                        value={phoneNumber}
                                        placeholder="+221 ..."
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Email PRO</label>
                                    <input
                                        type="email"
                                        className="input-premium h-14"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Localisation précise</label>
                                <div className="relative group">
                                    <MapPinIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-teal-500 transition-colors" />
                                    <input
                                        type="text"
                                        className="input-premium pl-14 h-14"
                                        placeholder="Ville, Quartier, Rue"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button type="submit" disabled={submitting} className="btn-vibrant flex-1 h-16 !text-sm !uppercase !tracking-[0.2em]">
                                    {submitting ? "Finalisation..." : "Activer mon commerce"}
                                </button>
                                <button type="button" onClick={() => signOut().then(() => navigate('/login'))} className="h-16 w-16 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95 text-zinc-400 hover:text-rose-500">
                                    <ArrowLeftOnRectangleIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
