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
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Gestion des Agents</h1>
                    <p className="mt-1 text-zinc-500 text-sm">Registre et droits d&apos;accès de vos collaborateurs.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-vibrant !text-xs !uppercase !tracking-widest">
                    <UserPlusIcon className="w-4 h-4" /> Ajouter un Agent
                </button>
            </div>

            <div className="table-container">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="table-header">
                            <th className="px-6 py-4">Agent</th>
                            <th className="px-6 py-4">Contact</th>
                            <th className="px-6 py-4 text-center">Code PIN</th>
                            <th className="px-6 py-4 text-center">Statut</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-zinc-400 italic">Chargement...</td></tr>
                        ) : agents.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-zinc-400 italic">Aucun agent enregistré.</td></tr>
                        ) : (
                            agents.map((agent) => (
                                <tr key={agent.id} className="table-row">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-xs uppercase">
                                                {agent.name?.charAt(0)}
                                            </div>
                                            <span className="font-semibold text-zinc-900 dark:text-zinc-200">{agent.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-zinc-500">
                                            <PhoneIcon className="w-3.5 h-3.5" />
                                            <span>{agent.phone || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-mono font-bold tracking-widest text-zinc-900 dark:text-white">{agent.code}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase tracking-widest">
                                            <ShieldCheckIcon className="w-3.5 h-3.5" /> Actif
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleDelete(agent.id)} className="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors">
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
