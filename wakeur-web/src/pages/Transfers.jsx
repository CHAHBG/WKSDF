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
            case 'completed': case 'succes': return { color: 'text-[var(--success)] bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30', icon: CheckCircleIcon };
            case 'pending': case 'en attente': return { color: 'text-[var(--warning)] bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30', icon: ClockIcon };
            case 'failed': case 'echec': return { color: 'text-[var(--danger)] bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30', icon: XCircleIcon };
            default: return { color: 'text-[var(--text-muted)] bg-[var(--bg-subtle)] border-[var(--border-subtle)]', icon: ClockIcon };
        }
    };

    return (
        <div className="space-y-8 animate-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-serif-display font-bold text-[var(--text-main)]">Historique des Transferts</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Registre des mouvements de fonds.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchTransfers} className="btn-secondary text-xs">
                        <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="bg-[var(--text-main)] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-[var(--bg-app)] shadow-sm">
                        {transfers.length} Opérations
                    </div>
                </div>
            </div>

            <div className="card-modern overflow-hidden">
                <div className="p-5 border-b border-[var(--border)] bg-[var(--bg-card)]">
                    <h3 className="font-bold text-[var(--text-main)]">Tous les Transferts</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="table-modern w-full">
                        <thead>
                            <tr>
                                <th className="pl-6">Date</th>
                                <th>Description</th>
                                <th className="text-right">Montant</th>
                                <th className="text-center pr-6">Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" className="p-8 text-center text-[var(--text-muted)] italic">Chargement...</td></tr>
                            ) : transfers.length === 0 ? (
                                <tr><td colSpan="4" className="p-8 text-center text-[var(--text-muted)] italic">Aucun transfert enregistré.</td></tr>
                            ) : (
                                transfers.map((t) => {
                                    const { color, icon: StatusIcon } = getStatusStyle(t.status);
                                    const date = t.created_at || t.date;
                                    return (
                                        <tr key={t.id} className="group hover:bg-[var(--bg-subtle)] transition-colors">
                                            <td className="pl-6 py-4 text-sm text-[var(--text-muted)]">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-[var(--text-main)]">{new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                                    <span className="text-[10px]">{new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <span className="text-sm font-medium text-[var(--text-main)] line-clamp-1">{t.description || 'N/A'}</span>
                                            </td>
                                            <td className="py-4 text-right font-bold text-[var(--text-main)]">
                                                {formatCurrency(t.amount)}
                                            </td>
                                            <td className="pr-6 py-4 text-center">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${color} text-[10px] font-bold uppercase tracking-wider`}>
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
        </div >
    );
}
