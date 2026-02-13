import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    CalendarIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ArrowPathIcon,
    ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';

const formatCurrency = (val) => new Intl.NumberFormat('fr-FR').format(Math.round(val || 0)) + ' F';

export default function Transfers() {
    const { user } = useAuth();
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchTransfers();
    }, [user]);

    const fetchTransfers = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('transfers')
                .select('*')
                .order('created_at', { ascending: false });
            setTransfers(data || []);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch ((status || '').toLowerCase()) {
            case 'completed': case 'succes': return { text: 'text-emerald-600', icon: CheckCircleIcon };
            case 'pending': case 'en attente': return { text: 'text-amber-600', icon: ClockIcon };
            case 'failed': case 'echec': return { text: 'text-rose-600', icon: XCircleIcon };
            default: return { text: 'text-zinc-500', icon: ClockIcon };
        }
    };

    return (
        <div className="space-y-12 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Historique des Transferts</h1>
                    <p className="text-zinc-500 font-medium mt-1">Registre des mouvements de fonds inter-comptes.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={fetchTransfers} className="p-3 text-teal-600 bg-teal-50 dark:bg-teal-900/20 rounded-2xl border border-teal-100 dark:border-teal-800 transition-all active:scale-95">
                        <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="bg-zinc-950 dark:bg-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white dark:text-zinc-950">
                        {transfers.length} Opérations
                    </div>
                </div>
            </div>

            <div className="table-container shadow-2xl shadow-teal-900/5">
                <table className="w-full text-left">
                    <thead>
                        <tr className="table-header">
                            <th className="px-8 py-6">Date & Heure</th>
                            <th className="px-6 py-6">Désignation</th>
                            <th className="px-6 py-6 text-right">Montant</th>
                            <th className="px-8 py-6 text-center">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {loading ? (
                            <tr><td colSpan="4" className="px-8 py-16 text-center text-zinc-400 italic font-medium">Récupération des données...</td></tr>
                        ) : transfers.length === 0 ? (
                            <tr><td colSpan="4" className="px-8 py-16 text-center text-zinc-400 italic font-medium">Aucun transfert enregistré.</td></tr>
                        ) : (
                            transfers.map((t) => {
                                const { text, icon: StatusIcon } = getStatusStyle(t.status);
                                const date = t.created_at || t.date;
                                return (
                                    <tr key={t.id} className="table-row group">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-black text-sm mb-1 tracking-tight">
                                                    <CalendarIcon className="w-4 h-4 text-teal-600/50" />
                                                    {new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-6">
                                                    {new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="text-sm font-medium text-zinc-500 line-clamp-1">{t.description || 'N/A'}</span>
                                        </td>
                                        <td className="px-6 py-6 text-right font-black text-zinc-900 dark:text-white">{formatCurrency(t.amount)}</td>
                                        <td className="px-8 py-6 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg ${text.includes('emerald') ? 'bg-emerald-50' : text.includes('amber') ? 'bg-amber-50' : 'bg-rose-50'} ${text} font-black text-[10px] uppercase tracking-widest border border-current opacity-80`}>
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                {t.status || 'pending'}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div >
    );
}
