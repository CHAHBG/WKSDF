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
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Transactions Globales</h1>
                    <p className="mt-1 text-zinc-500 text-sm">Registre des flux financiers et opérations consolidées.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchTransactions} className="p-2.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                        {transactions.length} Mouvements
                    </div>
                </div>
            </div>

            <div className="table-container">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="table-header">
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Opération</th>
                            <th className="px-6 py-4">Détails</th>
                            <th className="px-6 py-4 text-right">Montant</th>
                            <th className="px-6 py-4 text-center">État</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-zinc-400 italic">Chargement...</td></tr>
                        ) : transactions.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-zinc-400 italic">Aucune transaction trouvée.</td></tr>
                        ) : (
                            transactions.map((tx) => (
                                <tr key={tx.id} className="table-row">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                            <CalendarIcon className="w-3.5 h-3.5" />
                                            <span className="font-medium">{tx.date ? new Date(tx.date).toLocaleDateString('fr-FR') : '—'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-200 uppercase text-[10px] tracking-widest">{tx.type}</td>
                                    <td className="px-6 py-4 text-zinc-500 line-clamp-1">{tx.description || '—'}</td>
                                    <td className="px-6 py-4 text-right font-bold text-zinc-900 dark:text-white">{formatCurrency(tx.amount)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase tracking-widest">
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
    );
}
