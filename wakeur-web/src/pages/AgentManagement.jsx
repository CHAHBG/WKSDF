import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    UserGroupIcon,
    UserPlusIcon,
    PhoneIcon,
    IdentificationIcon,
    TrashIcon,
    XMarkIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function AgentManagement() {
    const { user, getShopId } = useAuth();
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newAgent, setNewAgent] = useState({ name: '', phone: '', code: '' });

    useEffect(() => {
        if (user) fetchAgents();
    }, [user]);

    const fetchAgents = async () => {
        setLoading(true);
        try {
            const { data } = await supabase.from('agents').select('*').order('name');
            setAgents(data || []);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAgent = async (e) => {
        e.preventDefault();
        const shopId = getShopId();
        if (!shopId) return;

        await supabase.from('agents').insert([{ ...newAgent, shop_id: shopId }]);
        setIsModalOpen(false);
        setNewAgent({ name: '', phone: '', code: '' });
        fetchAgents();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cet agent ?')) return;
        await supabase.from('agents').delete().eq('id', id);
        fetchAgents();
    };

    return (
        <div className="space-y-12 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Gestion des Collaborateurs</h1>
                    <p className="text-zinc-500 font-medium mt-1">Registre et droits d&apos;accès de vos agents de confiance.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-vibrant">
                    <UserPlusIcon className="w-5 h-5" /> Ajouter un Agent
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="metric-card-joy">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 mb-6 font-black border border-teal-100 dark:border-teal-800">
                        <UserGroupIcon className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-1">Total Agents</p>
                    <p className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">{agents.length}</p>
                </div>
            </div>

            <div className="table-container shadow-2xl shadow-teal-900/5">
                <table className="w-full text-left">
                    <thead>
                        <tr className="table-header">
                            <th className="px-8 py-6">Agent</th>
                            <th className="px-6 py-6">Contact</th>
                            <th className="px-6 py-6 text-center">Code PIN</th>
                            <th className="px-6 py-6 text-center">Statut</th>
                            <th className="px-8 py-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {loading ? (
                            <tr><td colSpan="5" className="px-8 py-16 text-center text-zinc-400 italic font-medium">Chargement des collaborateurs...</td></tr>
                        ) : agents.length === 0 ? (
                            <tr><td colSpan="5" className="px-8 py-16 text-center text-zinc-400 italic font-medium">Aucun agent pour le moment.</td></tr>
                        ) : (
                            agents.map((agent) => (
                                <tr key={agent.id} className="table-row group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-teal-50 dark:bg-zinc-800 flex items-center justify-center text-teal-600 font-black border border-teal-100 dark:border-zinc-700 group-hover:rotate-3 transition-transform">
                                                {agent.name?.charAt(0)}
                                            </div>
                                            <span className="font-black text-zinc-900 dark:text-white tracking-tight">{agent.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-2 text-zinc-500 font-bold text-xs">
                                            <PhoneIcon className="w-4 h-4 text-teal-600/50" />
                                            <span>{agent.phone || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <span className="px-3 py-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg font-mono font-black tracking-[0.2em] text-zinc-900 dark:text-white text-sm">
                                            {agent.code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800">
                                            <ShieldCheckIcon className="w-3.5 h-3.5" /> Actif
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button onClick={() => handleDelete(agent.id)} className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:scale-110 transition-transform">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-premium border border-zinc-200 dark:border-zinc-800 p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Nouvel Agent</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddAgent} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Nom Complet</label>
                                <input
                                    type="text"
                                    required
                                    className="input-premium"
                                    value={newAgent.name}
                                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Téléphone</label>
                                <input
                                    type="tel"
                                    className="input-premium"
                                    value={newAgent.phone}
                                    onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Code PIN</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={4}
                                    className="input-premium font-mono tracking-widest text-center !text-lg"
                                    value={newAgent.code}
                                    onChange={(e) => setNewAgent({ ...newAgent, code: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="btn-vibrant w-full !py-4 !text-sm !uppercase !tracking-[0.2em] shadow-lg mt-2">
                                Enregistrer
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
