import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    ArrowsRightLeftIcon,
    CalendarIcon,
    CreditCardIcon
} from '@heroicons/react/24/outline';

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
        try {
            let queryResult = null;
            let lastError = null;

            for (const dateColumn of TRANSACTION_DATE_COLUMNS) {
                queryResult = await supabase
                    .from('transactions')
                    .select('*')
                    .order(dateColumn, { ascending: false });

                if (!queryResult.error) {
                    break;
                }

                if (queryResult.error.code !== '42703') {
                    throw queryResult.error;
                }

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
        <div className="flex min-h-screen items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-transparent"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="mb-2 text-3xl font-bold text-slate-900">Transactions</h1>
                    <p className="text-lg text-slate-500">Historique complet des operations</p>
                </div>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm">
                    <ArrowsRightLeftIcon className="mr-2 h-5 w-5" />
                    {transactions.length} Operations
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Description</th>
                                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Montant</th>
                                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                        <CreditCardIcon className="mx-auto mb-3 h-12 w-12 text-slate-200" />
                                        <p>Aucune transaction trouvee</p>
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => {
                                    const dateValue = resolveTransactionDate(tx);
                                    const amount = Number(tx.amount || 0);
                                    const status = tx.status || 'COMPLETED';

                                    return (
                                        <tr key={tx.id} className="transition-colors hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="flex items-center text-sm text-slate-600">
                                                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                                                    {dateValue ? new Date(dateValue).toLocaleDateString('fr-FR') : '-'}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">
                                                    {tx.type || 'Operation'}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                                {tx.description || '-'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right">
                                                <span className={`font-mono text-sm font-bold ${amount < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                                    {amount > 0 ? '+' : ''}{amount.toLocaleString()} F
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-center">
                                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold capitalize text-emerald-700">
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
