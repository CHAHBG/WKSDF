import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    ArrowsRightLeftIcon,
    UserIcon,
    PhoneIcon,
    CalendarIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

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
            const { data, error } = await supabase
                .from('transfers')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            setTransfers(data || []);
        } catch (error) {
            console.error('Error fetching transfers:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'succès':
                return 'bg-emerald-100 text-emerald-800';
            case 'pending':
            case 'en attente':
                return 'bg-amber-100 text-amber-800';
            case 'failed':
            case 'échec':
                return 'bg-rose-100 text-rose-800';
            default:
                return 'bg-slate-100 text-slate-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'succès':
                return <CheckCircleIcon className="w-4 h-4 mr-1" />;
            case 'pending':
            case 'en attente':
                return <ClockIcon className="w-4 h-4 mr-1" />;
            case 'failed':
            case 'échec':
                return <XCircleIcon className="w-4 h-4 mr-1" />;
            default:
                return null;
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-900 border-t-transparent"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Historique des Transferts</h1>
                    <p className="text-gray-500 text-lg">Suivez tous les transferts d'argent effectués</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-xl border border-gray-100 text-sm font-bold text-blue-600 flex items-center shadow-sm">
                    <ArrowsRightLeftIcon className="w-5 h-5 mr-2" />
                    {transfers.length} Transferts Total
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Heure</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Émetteur</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Destinataire</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Montant</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {transfers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                        <ArrowsRightLeftIcon className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                                        <p>Aucun transfert trouvé</p>
                                    </td>
                                </tr>
                            ) : (
                                transfers.map((transfer) => (
                                    <tr key={transfer.id} className="group hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                                                {new Date(transfer.date).toLocaleDateString()}
                                                <span className="mx-2 text-gray-300">|</span>
                                                {new Date(transfer.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 capitalize">
                                                {transfer.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 flex items-center">
                                                    <UserIcon className="w-3 h-3 mr-1 text-gray-400" />
                                                    {transfer.sender_name}
                                                </span>
                                                <span className="text-xs text-gray-500 flex items-center mt-0.5">
                                                    <PhoneIcon className="w-3 h-3 mr-1" />
                                                    {transfer.sender_phone}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 flex items-center">
                                                    <UserIcon className="w-3 h-3 mr-1 text-gray-400" />
                                                    {transfer.recipient_name}
                                                </span>
                                                <span className="text-xs text-gray-500 flex items-center mt-0.5">
                                                    <PhoneIcon className="w-3 h-3 mr-1" />
                                                    {transfer.recipient_phone}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className="text-sm font-bold text-gray-900 font-mono">
                                                {parseInt(transfer.amount).toLocaleString()} F
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(transfer.status)}`}>
                                                {getStatusIcon(transfer.status)}
                                                <span className="capitalize">{transfer.status}</span>
                                            </span>
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
