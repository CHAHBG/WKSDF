import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    ArrowsRightLeftIcon,
    CalendarIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ArrowPathIcon,
    DocumentTextIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const formatCurrency = (val) => new Intl.NumberFormat('fr-FR').format(Math.round(val || 0)) + ' CFA';

export default function Transfers() {
    const { user } = useAuth();
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchTransfers();
        }
    }, [user]);

    const fetchTransfers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('transfers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTransfers(data || []);
        } catch (error) {
            console.error('Error fetching transfers:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch ((status || '').toLowerCase()) {
            case 'completed':
            case 'succes':
                return {
                    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
                    text: 'text-emerald-600',
                    icon: CheckCircleIcon
                };
            case 'pending':
            case 'en attente':
                return {
                    bg: 'bg-amber-50 dark:bg-amber-500/10',
                    text: 'text-amber-600',
                    icon: ClockIcon
                };
            case 'failed':
            case 'echec':
                return {
                    bg: 'bg-rose-50 dark:bg-rose-500/10',
                    text: 'text-rose-600',
                    icon: XCircleIcon
                };
            default:
                return {
                    bg: 'bg-slate-50 dark:bg-slate-500/10',
                    text: 'text-slate-600',
                    icon: ClockIcon
                };
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
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Historique des Transferts</h1>
                    <p className="mt-2 text-slate-500 font-medium">Consultez l&apos;ensemble des mouvements de fonds inter-comptes.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchTransfers}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 transition-all dark:bg-slate-900 dark:border-slate-800"
                    >
                        <ArrowPathIcon className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm font-bold text-sm text-slate-600 dark:text-slate-300">
                        <ArrowsRightLeftIcon className="w-5 h-5 text-indigo-500" />
                        {transfers.length} Opérations
                    </div>
                </div>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="premium-card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Transféré (Mois)</p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {formatCurrency(transfers.reduce((acc, t) => acc + (t.amount || 0), 0)).split(' ')[0]}
                        </span>
                        <span className="text-xs font-bold text-slate-400 mb-1">CFA</span>
                    </div>
                </div>
                <div className="premium-card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Completé</p>
                    <div className="flex items-end gap-2 text-emerald-500">
                        <span className="text-2xl font-black">{transfers.filter(t => t.status?.toLowerCase().includes('succes') || t.status?.toLowerCase().includes('complete')).length}</span>
                        <span className="text-xs font-bold mb-1">Opérations</span>
                    </div>
                </div>
                <div className="premium-card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">En Attente / Échec</p>
                    <div className="flex items-end gap-2 text-rose-500">
                        <span className="text-2xl font-black">{transfers.filter(t => !t.status?.toLowerCase().includes('succes') && !t.status?.toLowerCase().includes('complete')).length}</span>
                        <span className="text-xs font-bold mb-1">Opérations</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="premium-card overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Date & Heure</th>
                                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Type</th>
                                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Désignation</th>
                                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Montant</th>
                                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {transfers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <ArrowsRightLeftIcon className="h-16 w-16 text-slate-100 dark:text-slate-800 mb-4" />
                                            <p className="text-slate-400 font-bold italic">Aucune donnée de transfert disponible.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                transfers.map((t) => {
                                    const statusStyle = getStatusStyle(t.status);
                                    const StatusIcon = statusStyle.icon;
                                    const date = t.created_at || t.date || t.transfer_date;
                                    return (
                                        <tr key={t.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                                                        <span className="text-sm font-black text-slate-900 dark:text-white">
                                                            {new Date(date).toLocaleDateString('fr-FR')}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400 ml-6 uppercase">
                                                        {new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-[10px] font-black text-indigo-600 uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20">
                                                    {t.type || 'Transfert'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                                                        <DocumentTextIcon className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                                        {t.description || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right whitespace-nowrap">
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center gap-1 text-slate-900 dark:text-white">
                                                        <span className="text-lg font-black">{Number(t.amount || 0).toLocaleString()}</span>
                                                        <span className="text-[10px] font-bold opacity-40">CFA</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${statusStyle.bg} ${statusStyle.text} text-[10px] font-black uppercase tracking-widest transition-transform group-hover:scale-105`}>
                                                    <StatusIcon className="w-4 h-4" />
                                                    {t.status || 'pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
