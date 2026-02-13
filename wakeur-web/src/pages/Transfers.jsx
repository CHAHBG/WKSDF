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
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Historique des Transferts</h1>
                    <p className="mt-1 text-zinc-500 text-sm">Registre des mouvements de fonds inter-comptes.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchTransfers} className="p-2.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                        {transfers.length} Opérations
                    </div>
                </div>
            </div>

            <div className="table-container">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="table-header">
                            <th className="px-6 py-4">Date & Heure</th>
                            <th className="px-6 py-4">Désignation</th>
                            <th className="px-6 py-4 text-right">Montant</th>
                            <th className="px-6 py-4 text-center">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {loading ? (
                            <tr><td colSpan="4" className="px-6 py-12 text-center text-zinc-400 italic">Chargement...</td></tr>
                        ) : transfers.length === 0 ? (
                            <tr><td colSpan="4" className="px-6 py-12 text-center text-zinc-400 italic font-medium">Aucun transfert enregistré.</td></tr>
                        ) : (
                            transfers.map((t) => {
                                const { text, icon: StatusIcon } = getStatusStyle(t.status);
                                const date = t.created_at || t.date;
                                return (
                                    <tr key={t.id} className="table-row">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                                                    {new Date(date).toLocaleDateString('fr-FR')}
                                                </span>
                                                <span className="text-[10px] text-zinc-400">
                                                    {new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-zinc-600 dark:text-zinc-400">{t.description || 'N/A'}</td>
                                        <td className="px-6 py-4 text-right font-bold text-zinc-900 dark:text-white">{formatCurrency(t.amount)}</td>
                                        <td className="px-6 py-4">
                                            <div className={`flex items-center justify-center gap-1.5 ${text} font-bold text-[10px] uppercase tracking-widest`}>
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
        </div>
    );
}
