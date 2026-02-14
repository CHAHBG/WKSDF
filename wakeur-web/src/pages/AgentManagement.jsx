import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    UserGroupIcon,
    UserPlusIcon,
    PhoneIcon,
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
        <div className="space-y-8 animate-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-serif-display font-bold text-[var(--text-main)]">Gestion des Collaborateurs</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Registre et droits d'accès de vos agents.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary text-xs flex items-center gap-2"
                >
                    <UserPlusIcon className="w-4 h-4" /> Ajouter un Agent
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-modern p-5 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Total Agents</p>
                        <p className="text-2xl font-bold text-[var(--text-main)] mt-1">{agents.length}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--bg-subtle)] text-[var(--primary)]">
                        <UserGroupIcon className="w-6 h-6" />
                    </div>
                </div>
            </div>

            <div className="card-modern overflow-hidden">
                <div className="p-5 border-b border-[var(--border)] bg-[var(--bg-card)]">
                    <h3 className="font-bold text-[var(--text-main)]">Liste des Agents</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="table-modern w-full">
                        <thead>
                            <tr>
                                <th className="pl-6">Agent</th>
                                <th>Contact</th>
                                <th className="text-center">Code PIN</th>
                                <th className="text-center">Statut</th>
                                <th className="pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-[var(--text-muted)] italic">Chargement des collaborateurs...</td></tr>
                            ) : agents.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-[var(--text-muted)] italic">Aucun agent pour le moment.</td></tr>
                            ) : (
                                agents.map((agent) => (
                                    <tr key={agent.id} className="group hover:bg-[var(--bg-subtle)] transition-colors">
                                        <td className="pl-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--primary)] font-bold text-xs border border-[var(--border)]">
                                                    {agent.name?.charAt(0)}
                                                </div>
                                                <span className="font-medium text-[var(--text-main)]">{agent.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                                <PhoneIcon className="w-4 h-4" />
                                                <span>{agent.phone || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-center">
                                            <span className="px-2 py-1 rounded bg-[var(--bg-subtle)] font-mono text-xs font-bold text-[var(--text-main)] tracking-widest border border-[var(--border)]">
                                                {agent.code}
                                            </span>
                                        </td>
                                        <td className="py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-100 dark:border-emerald-800">
                                                <ShieldCheckIcon className="w-3 h-3" /> Actif
                                            </div>
                                        </td>
                                        <td className="pr-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(agent.id)}
                                                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--bg-subtle)] transition-colors"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-[var(--bg-card)] rounded-xl shadow-2xl p-6 border border-[var(--border)] animate-enter">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-[var(--text-main)] font-serif-display">Nouvel Agent</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddAgent} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[var(--text-main)]">Nom Complet</label>
                                <input
                                    type="text"
                                    required
                                    className="input-modern w-full"
                                    value={newAgent.name}
                                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[var(--text-main)]">Téléphone</label>
                                <input
                                    type="tel"
                                    className="input-modern w-full"
                                    value={newAgent.phone}
                                    onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[var(--text-main)]">Code PIN</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={4}
                                    className="input-modern w-full font-mono tracking-widest text-center"
                                    value={newAgent.code}
                                    onChange={(e) => setNewAgent({ ...newAgent, code: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] transition-colors"
                                >
                                    Annuler
                                </button>
                                <button type="submit" className="btn-primary text-sm px-6 py-2">
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
