import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    UserGroupIcon,
    UserPlusIcon,
    PhoneIcon,
    IdentificationIcon,
    TrashIcon,
    PencilIcon,
    XMarkIcon,
    EllipsisHorizontalIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function AgentManagement() {
    const { user, getShopId } = useAuth();
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newAgent, setNewAgent] = useState({
        name: '',
        phone: '',
        code: ''
    });

    useEffect(() => {
        if (user) {
            fetchAgents();
        }
    }, [user]);

    const fetchAgents = async () => {
        try {
            const { data, error } = await supabase
                .from('agents')
                .select('*')
                .order('name');

            if (error) throw error;
            setAgents(data || []);
        } catch (error) {
            console.error('Error fetching agents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAgent = async (e) => {
        e.preventDefault();
        try {
            const shopId = getShopId();
            if (!shopId) {
                alert("Erreur: Impossible de récupérer l'ID de la boutique.");
                return;
            }

            const { error } = await supabase
                .from('agents')
                .insert([{
                    ...newAgent,
                    shop_id: shopId
                }]);

            if (error) throw error;

            setIsModalOpen(false);
            setNewAgent({ name: '', phone: '', code: '' });
            fetchAgents();
        } catch (error) {
            console.error('Error adding agent:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cet agent ?')) return;
        try {
            await supabase.from('agents').delete().eq('id', id);
            fetchAgents();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    if (loading) return (
        <div className="flex h-96 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
    );

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Gestion des Agents</h1>
                    <p className="mt-2 text-slate-500 font-medium">Administrez les membres de votre équipe et leurs codes d&apos;accès.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 font-bold text-sm"
                >
                    <UserPlusIcon className="w-5 h-5" />
                    Ajouter un Agent
                </button>
            </div>

            {/* List */}
            <div className="premium-card overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Liste des Collaborateurs</h3>
                        <p className="text-xs font-medium text-slate-500">Registre actif du personnel.</p>
                    </div>
                    <UserGroupIcon className="w-6 h-6 text-slate-300" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Agent</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Contact</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Code PIN</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Statut</th>
                                <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {agents.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center text-slate-400 italic">
                                        Aucun agent n&apos;a encore été créé.
                                    </td>
                                </tr>
                            ) : (
                                agents.map((agent) => (
                                    <tr key={agent.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-sm ring-1 ring-indigo-100 dark:ring-indigo-500/20">
                                                    {agent.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900 dark:text-white">{agent.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Collaborateur</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <PhoneIcon className="w-4 h-4 text-slate-300" />
                                                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{agent.phone || 'Non renseigné'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                <IdentificationIcon className="w-4 h-4 text-indigo-500" />
                                                <span className="text-sm font-black text-slate-700 dark:text-slate-200 font-mono tracking-widest">{agent.code}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                                <ShieldCheckIcon className="w-3.5 h-3.5" />
                                                Actif
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(agent.id)}
                                                    className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up p-10">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Nouvel Agent</h2>
                            <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddAgent} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Nom Complet</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Moussa Diop"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900 dark:text-white"
                                    value={newAgent.name}
                                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Téléphone</label>
                                <input
                                    type="tel"
                                    placeholder="Ex: 77 123 45 67"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900 dark:text-white"
                                    value={newAgent.phone}
                                    onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Code PIN d&apos;accès</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: 1234"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-slate-900 dark:text-white font-mono tracking-widest"
                                    value={newAgent.code}
                                    onChange={(e) => setNewAgent({ ...newAgent, code: e.target.value })}
                                />
                                <p className="text-[10px] text-slate-400 font-medium px-1 italic">Ce code servira à l&apos;agent pour valider ses opérations.</p>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
                            >
                                Enregistrer l&apos;Agent
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
