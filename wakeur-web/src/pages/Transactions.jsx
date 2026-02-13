import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    CalendarIcon,
    CreditCardIcon,
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
        <div className="space-y-12 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Transactions Globales</h1>
                    <p className="text-zinc-500 font-medium mt-1">Registre des flux financiers et opérations consolidées.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={fetchTransactions} className="p-3 text-teal-600 bg-teal-50 dark:bg-teal-900/20 rounded-2xl border border-teal-100 dark:border-teal-800 transition-all active:scale-95">
                        <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="bg-zinc-950 dark:bg-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white dark:text-zinc-950">
                        {transactions.length} Mouvements
                    </div>
                </div>
            </div>

            <div className="table-container shadow-2xl shadow-teal-900/5">
                <table className="w-full text-left">
                    <thead>
                        <tr className="table-header">
                            <th className="px-8 py-6">Date</th>
                            <th className="px-6 py-6">Opération</th>
                            <th className="px-6 py-6">Détails</th>
                            <th className="px-6 py-6 text-right">Montant</th>
                            <th className="px-8 py-6 text-center">État</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {loading ? (
                            <tr><td colSpan="5" className="px-8 py-16 text-center text-zinc-400 italic font-medium">Récupération de l&apos;historique...</td></tr>
                        ) : transactions.length === 0 ? (
                            <tr><td colSpan="5" className="px-8 py-16 text-center text-zinc-400 italic font-medium">Aucune transaction trouvée.</td></tr>
                        ) : (
                            transactions.map((tx) => (
                                <tr key={tx.id} className="table-row group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-zinc-500 font-bold text-xs">
                                            <CalendarIcon className="w-4 h-4 text-teal-600/50" />
                                            <span>{tx.date ? new Date(tx.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <span className="px-3 py-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 text-sm font-medium text-zinc-500 truncate max-w-[300px]">{tx.description || '—'}</td>
                                    <td className="px-6 py-6 text-right font-black text-zinc-900 dark:text-white">{formatCurrency(tx.amount)}</td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="inline-flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                                            <CheckCircleIcon className="w-4 h-4" /> {tx.status || 'COMPLETED'}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
