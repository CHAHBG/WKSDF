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
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
            <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-premium">

                <div className="md:w-5/12 bg-zinc-900 p-12 text-white flex flex-col justify-between">
                    <div>
                        <div className="h-10 w-10 bg-white text-zinc-950 rounded-lg flex items-center justify-center mb-10">
                            <BuildingStorefrontIcon className="w-5 h-5" />
                        </div>
                        <h1 className="text-2xl font-bold">Identité du Commerce.</h1>
                        <p className="mt-4 text-zinc-400 text-sm leading-relaxed max-w-xs">Définissez les informations fondamentales de votre point de vente pour activer les fonctionnalités de gestion.</p>
                    </div>
                </div>

                <div className="md:w-7/12 p-12 lg:p-16">
                    <div className="max-w-md mx-auto">
                        <div className="mb-10">
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Initialisation</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Nom du commerce</label>
                                <div className="relative">
                                    <BuildingStorefrontIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <input
                                        type="text"
                                        required
                                        className="input-premium pl-11 !text-sm"
                                        placeholder="Ex: Boutique Sokhna"
                                        value={shopName}
                                        onChange={(e) => setShopName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Téléphone</label>
                                    <input
                                        type="tel"
                                        className="input-premium !text-sm"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Email</label>
                                    <input
                                        type="email"
                                        className="input-premium !text-sm"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Localisation</label>
                                <div className="relative">
                                    <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <input
                                        type="text"
                                        className="input-premium pl-11 !text-sm"
                                        placeholder="Ville, Quartier"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="submit" disabled={submitting} className="btn-vibrant flex-1 !py-4 !text-sm !uppercase !tracking-[0.2em]">
                                    {submitting ? "Configuration..." : "Finaliser"}
                                </button>
                                <button type="button" onClick={() => signOut().then(() => navigate('/login'))} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                    <ArrowLeftOnRectangleIcon className="w-5 h-5 text-zinc-400" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
