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
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-app)] animate-enter">
            <div className="w-full max-w-5xl grid md:grid-cols-2 bg-[var(--bg-card)] rounded-2xl shadow-xl overflow-hidden border border-[var(--border)]">

                {/* Visual Side */}
                <div className="hidden md:flex flex-col justify-between p-12 bg-[var(--sidebar-bg)] text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="h-12 w-12 bg-white/10 rounded-lg flex items-center justify-center mb-8 backdrop-blur-sm border border-white/20">
                            <BuildingStorefrontIcon className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-serif-display font-bold mb-4 leading-tight">Configuration de votre commerce.</h1>
                        <p className="text-[var(--text-muted)] text-sm leading-relaxed max-w-sm">
                            Activez la puissance de Wakeur en définissant l'identité fondamentale de votre boutique.
                        </p>
                    </div>
                    {/* Decorative */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--accent)]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                </div>

                {/* Form Side */}
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                    <div className="mb-8">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-2 block">Dernière Étape</span>
                        <h2 className="text-2xl font-bold font-serif-display text-[var(--text-main)]">Initialisation</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-100 animate-shake">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[var(--text-main)]">Nom de l'établissement</label>
                            <div className="relative">
                                <BuildingStorefrontIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    required
                                    className="input-modern pl-10 w-full"
                                    placeholder="Ex: Boutique Sokhna"
                                    value={shopName}
                                    onChange={(e) => setShopName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[var(--text-main)]">Téléphone</label>
                                <div className="relative">
                                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                    <input
                                        type="tel"
                                        className="input-modern pl-10 w-full"
                                        value={phoneNumber}
                                        placeholder="+221 ..."
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[var(--text-main)]">Email PRO</label>
                                <div className="relative">
                                    <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                    <input
                                        type="email"
                                        className="input-modern pl-10 w-full"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[var(--text-main)]">Localisation précise</label>
                            <div className="relative">
                                <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    className="input-modern pl-10 w-full"
                                    placeholder="Ville, Quartier, Rue"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2 group">
                                {submitting ? "Finalisation..." : "Activer mon commerce"}
                                {!submitting && <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => signOut().then(() => navigate('/login'))}
                                className="px-4 border border-[var(--border)] rounded-lg flex items-center justify-center hover:bg-[var(--bg-subtle)] transition-colors text-[var(--text-muted)] hover:text-[var(--danger)]"
                                title="Se déconnecter"
                            >
                                <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
