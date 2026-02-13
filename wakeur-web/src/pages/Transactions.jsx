import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    ArrowsRightLeftIcon,
    CalendarIcon,
    CreditCardIcon,
    ArrowPathIcon,
    BriefcaseIcon,
    IdentificationIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

const formatCurrency = (val) => new Intl.NumberFormat('fr-FR').format(Math.round(val || 0)) + ' CFA';

const TRANSACTION_DATE_COLUMNS = ['created_at', 'transaction_date', 'date'];
const resolveTransactionDate = (tx) => tx.created_at || tx.transaction_date || tx.date;

export default function Transactions() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchTransactions();
        }
    }, [user]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            let queryResult = null;
            let lastError = null;

            for (const dateColumn of TRANSACTION_DATE_COLUMNS) {
                queryResult = await supabase
                    .from('transactions')
                    .select('*')
                    .order(dateColumn, { ascending: false });

                if (!queryResult.error) break;
                if (queryResult.error.code !== '42703') throw queryResult.error;
                lastError = queryResult.error;
            }

            if (queryResult?.error) {
                if (queryResult.error.code === '42P01') {
                    const { data: mmData, error: mmError } = await supabase
                        .from('mm_transactions')
                        .select('id, transaction_date, operation_type, amount, status, notes')
                        .order('transaction_date', { ascending: false });

                    if (mmError) throw mmError;

                    const normalized = (mmData || []).map((row) => ({
                        id: row.id,
                        transaction_date: row.transaction_date,
                        type: row.operation_type,
                        description: row.notes,
                        amount: row.amount,
                        status: row.status,
                    }));

                    setTransactions(normalized);
                    return;
                }
                throw queryResult.error || lastError;
            }

            setTransactions(queryResult?.data || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
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
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Transactions Globales</h1>
                    <p className="mt-2 text-slate-500 font-medium">Historique consolidé de toutes les opérations financières.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchTransactions}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-indigo-600 transition-all dark:bg-slate-900 dark:border-slate-800"
                    >
                        <ArrowPathIcon className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm font-bold text-sm text-slate-600 dark:text-slate-300">
                        <CreditCardIcon className="w-5 h-5 text-indigo-500" />
                        {transactions.length} Mouvements
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="premium-card overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Type d&apos;Opération</th>
                                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Détails / Notes</th>
                                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Montant Flux</th>
                                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">État</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <ArrowsRightLeftIcon className="h-16 w-16 text-slate-100 dark:text-slate-800 mb-4" />
                                            <p className="text-slate-400 font-bold italic">Aucune transaction enregistrée.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => {
                                    const dateValue = resolveTransactionDate(tx);
                                    const amount = Number(tx.amount || 0);
                                    const status = tx.status || 'COMPLETED';
                                    const isPositive = amount >= 0;

                                    return (
                                        <tr key={tx.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <CalendarIcon className="w-4 h-4 text-slate-300" />
                                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                                        {dateValue ? new Date(dateValue).toLocaleDateString('fr-FR') : '—'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                                                    {tx.type || 'Operation'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-medium text-slate-500 line-clamp-1 max-w-xs">{tx.description || '—'}</p>
                                            </td>
                                            <td className="px-6 py-5 text-right whitespace-nowrap">
                                                <span className={`text-base font-black ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {isPositive ? '+' : ''}{amount.toLocaleString()} <span className="text-[10px] font-bold opacity-60">F</span>
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                                    <CheckCircleIcon className="w-3.5 h-3.5" />
                                                    {status}
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
