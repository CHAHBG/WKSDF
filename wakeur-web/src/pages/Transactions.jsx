import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    CalendarIcon,
    ArrowPathIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

const formatCurrency = (val) => new Intl.NumberFormat('fr-FR').format(Math.round(val || 0)) + ' F';

export default function Transactions() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchTransactions();
    }, [user]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('mm_transactions')
                .select('id, transaction_date, operation_type, amount, status, notes')
                .order('transaction_date', { ascending: false });

            const normalized = (data || []).map((row) => ({
                id: row.id,
                date: row.transaction_date,
                type: row.operation_type,
                description: row.notes,
                amount: row.amount,
                status: row.status,
            }));

            setTransactions(normalized);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-serif-display font-bold text-[var(--text-main)]">Transactions Globales</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Registre des flux financiers et opérations consolidées.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchTransactions} className="btn-secondary text-xs">
                        <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="bg-[var(--text-main)] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-[var(--bg-app)] shadow-sm">
                        {transactions.length} Mouvements
                    </div>
                </div>
            </div>

            <div className="card-modern overflow-hidden">
                <div className="p-5 border-b border-[var(--border)] bg-[var(--bg-card)]">
                    <h3 className="font-bold text-[var(--text-main)]">Historique des Flux Consolides</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="table-modern w-full">
                        <thead>
                            <tr>
                                <th className="pl-6">Date</th>
                                <th>Opération</th>
                                <th>Détails</th>
                                <th className="text-right">Montant</th>
                                <th className="pr-6 text-center">État</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-[var(--text-muted)] italic">Récupération de l'historique...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-[var(--text-muted)] italic">Aucune transaction trouvée.</td></tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="group hover:bg-[var(--bg-subtle)] transition-colors">
                                        <td className="pl-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                                <CalendarIcon className="w-4 h-4" />
                                                <span>{tx.date ? new Date(tx.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <span className="px-2.5 py-1 bg-[var(--bg-subtle)] rounded-md text-xs font-medium text-[var(--text-main)] border border-[var(--border)] uppercase tracking-wide">
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className="py-4 text-sm font-medium text-[var(--text-muted)] truncate max-w-[300px]">{tx.description || '—'}</td>
                                        <td className="py-4 text-right font-bold text-[var(--text-main)]">{formatCurrency(tx.amount)}</td>
                                        <td className="pr-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 text-[var(--success)] font-bold text-[10px] uppercase tracking-wider">
                                                <CheckCircleIcon className="w-3.5 h-3.5" /> {tx.status || 'COMPLETED'}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
