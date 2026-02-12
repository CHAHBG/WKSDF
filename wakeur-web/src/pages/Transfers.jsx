import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    ArrowsRightLeftIcon,
    CalendarIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

const TRANSFER_DATE_COLUMNS = ['created_at', 'date', 'transfer_date'];

const resolveTransferDate = (transfer) => transfer.created_at || transfer.date || transfer.transfer_date;

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
        try {
            let queryResult = null;
            let lastError = null;

            for (const dateColumn of TRANSFER_DATE_COLUMNS) {
                queryResult = await supabase
                    .from('transfers')
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
                throw queryResult.error || lastError;
            }

            setTransfers(queryResult?.data || []);
        } catch (error) {
            console.error('Error fetching transfers:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch ((status || '').toLowerCase()) {
            case 'completed':
            case 'succes':
                return 'bg-emerald-100 text-emerald-800';
            case 'pending':
            case 'en attente':
                return 'bg-amber-100 text-amber-800';
            case 'failed':
            case 'echec':
                return 'bg-rose-100 text-rose-800';
            default:
                return 'bg-slate-100 text-slate-800';
        }
    };

    const getStatusIcon = (status) => {
        switch ((status || '').toLowerCase()) {
            case 'completed':
            case 'succes':
                return <CheckCircleIcon className="mr-1 h-4 w-4" />;
            case 'pending':
            case 'en attente':
                return <ClockIcon className="mr-1 h-4 w-4" />;
            case 'failed':
            case 'echec':
                return <XCircleIcon className="mr-1 h-4 w-4" />;
            default:
                return null;
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
                    <h1 className="mb-2 text-3xl font-bold text-slate-900">Historique des Transferts</h1>
                    <p className="text-lg text-slate-500">Suivez tous les transferts d'argent effectues</p>
                </div>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm">
                    <ArrowsRightLeftIcon className="mr-2 h-5 w-5" />
                    {transfers.length} Transferts total
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Date & heure</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Description</th>
                                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Montant</th>
                                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transfers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                        <ArrowsRightLeftIcon className="mx-auto mb-3 h-12 w-12 text-slate-200" />
                                        <p>Aucun transfert trouve</p>
                                    </td>
                                </tr>
                            ) : (
                                transfers.map((transfer) => {
                                    const transferDate = resolveTransferDate(transfer);
                                    return (
                                        <tr key={transfer.id} className="transition-colors hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="flex items-center text-sm text-slate-600">
                                                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                                                    {transferDate ? new Date(transferDate).toLocaleDateString('fr-FR') : '-'}
                                                    {transferDate && (
                                                        <>
                                                            <span className="mx-2 text-slate-300">|</span>
                                                            {new Date(transferDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">
                                                    {transfer.type || 'Transfer'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {transfer.description || '-'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right">
                                                <span className="font-mono text-sm font-bold text-slate-900">
                                                    {Number(transfer.amount || 0).toLocaleString()} F
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-center">
                                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusColor(transfer.status)}`}>
                                                    {getStatusIcon(transfer.status)}
                                                    <span>{transfer.status || 'pending'}</span>
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
