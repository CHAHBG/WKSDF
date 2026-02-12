import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    BanknotesIcon,
    CalendarIcon,
    PlusIcon,
    TrashIcon,
    ChartPieIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

const EXPENSE_TYPES = [
    { value: 'LOCATION', label: 'Location', color: 'bg-blue-100 text-blue-700' },
    { value: 'WIFI', label: 'Wifi', color: 'bg-purple-100 text-purple-700' },
    { value: 'SALARY', label: 'Salaire Agent', color: 'bg-green-100 text-green-700' },
    { value: 'DEPENSES', label: 'Dépenses Diverses', color: 'bg-gray-100 text-gray-700' },
    { value: 'COMMISSION', label: 'Commission Mensuelle', color: 'bg-yellow-100 text-yellow-700' }
];

export default function Expenses() {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [financials, setFinancials] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [newExpense, setNewExpense] = useState({
        type: 'DEPENSES',
        amount: '',
        description: '',
        payment_method: 'cash',
        expense_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const [expensesRes, financialsRes] = await Promise.all([
                supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
                supabase.from('monthly_financials').select('*').order('month', { ascending: false }).limit(1).maybeSingle()
            ]);

            setExpenses(expensesRes.data || []);
            setFinancials(financialsRes.data || null);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('expenses')
                .insert([{
                    ...newExpense,
                    shop_id: user?.shop_id
                }]);

            if (error) throw error;

            setShowModal(false);
            setNewExpense({
                type: 'DEPENSES',
                amount: '',
                description: '',
                payment_method: 'cash',
                expense_date: new Date().toISOString().split('T')[0]
            });
            fetchData();
            alert('Dépense ajoutée avec succès !');
        } catch (error) {
            console.error('Error adding expense:', error);
            alert('Erreur lors de l\'ajout');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;
        try {
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion Financière</h1>
                    <p className="text-gray-500 text-lg">Suivez les dépenses et la rentabilité</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                    <PlusIcon className="w-5 h-5" />
                    Nouvelle Dépense
                </button>
            </div>

            {/* Financial Summary Card */}
            {financials && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
                            </div>
                            <span className="text-gray-500 font-medium">Revenus Ventes</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 font-mono">
                            {(financials.revenue || 0).toLocaleString()} F
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-yellow-50 rounded-lg">
                                <BanknotesIcon className="w-6 h-6 text-yellow-600" />
                            </div>
                            <span className="text-gray-500 font-medium">Commissions</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 font-mono">
                            {(financials.commissions || 0).toLocaleString()} F
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-red-50 rounded-lg">
                                <ArrowTrendingDownIcon className="w-6 h-6 text-red-600" />
                            </div>
                            <span className="text-gray-500 font-medium">Dépenses Totales</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 font-mono">
                            {(financials.expenses || 0).toLocaleString()} F
                        </div>
                    </div>

                    <div className="bg-blue-600 p-6 rounded-xl shadow-lg text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <ChartPieIcon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-blue-100 font-medium">Revenu Net (Mois)</span>
                        </div>
                        <div className="text-3xl font-bold font-mono">
                            {(financials.net_revenue || 0).toLocaleString()} F
                        </div>
                    </div>
                </div>
            )}

            {/* Expenses List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Historique des Dépenses</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Paiement</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Montant</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {expenses.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                        <p>Aucune dépense enregistrée</p>
                                    </td>
                                </tr>
                            ) : (
                                expenses.map((expense) => {
                                    const typeInfo = EXPENSE_TYPES.find(t => t.value === expense.type);
                                    return (
                                        <tr key={expense.id} className="group hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                <div className="flex items-center">
                                                    <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                                                    {new Date(expense.expense_date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${typeInfo?.color || 'bg-gray-100 text-gray-700'}`}>
                                                    {typeInfo?.label || expense.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${expense.payment_method === 'mobile_money' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                                    {expense.payment_method === 'mobile_money' ? 'Mobile Money' : 'Espèces'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {expense.description || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-gray-900">
                                                {expense.amount.toLocaleString()} F
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => handleDelete(expense.id)}
                                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Expense Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-900">Nouvelle Dépense</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <span className="sr-only">Fermer</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleAddExpense} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type de Dépense</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newExpense.type}
                                    onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value })}
                                >
                                    {EXPENSE_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mode de Paiement</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newExpense.payment_method}
                                    onChange={(e) => setNewExpense({ ...newExpense, payment_method: e.target.value })}
                                >
                                    <option value="cash">Espèces</option>
                                    <option value="mobile_money">Mobile Money</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newExpense.expense_date}
                                    onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optionnel)</label>
                                <textarea
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                                    value={newExpense.description}
                                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
