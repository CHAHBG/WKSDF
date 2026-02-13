import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    BanknotesIcon,
    CalendarIcon,
    PlusIcon,
    TrashIcon,
    ChartBarIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    BriefcaseIcon,
    WifiIcon,
    BuildingOfficeIcon,
    ReceiptPercentIcon,
    EllipsisHorizontalIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const formatCurrency = (val) => new Intl.NumberFormat('fr-FR').format(Math.round(val || 0)) + ' CFA';

const EXPENSE_TYPES = [
    { value: 'LOCATION', label: 'Location', icon: BuildingOfficeIcon, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { value: 'WIFI', label: 'Wifi', icon: WifiIcon, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    { value: 'SALARY', label: 'Salaire Agent', icon: BriefcaseIcon, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { value: 'DEPENSES', label: 'Divers', icon: BanknotesIcon, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-500/10' },
    { value: 'COMMISSION', label: 'Commission', icon: ReceiptPercentIcon, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' }
];

export default function Expenses() {
    const { user, userProfile } = useAuth();
    const shopId = userProfile?.shop_id;
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
        if (user && shopId) {
            fetchData();
        }
    }, [user, shopId]);

    const fetchData = async () => {
        if (!shopId) return;
        setLoading(true);
        try {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

            const [expensesRes, monthlySalesRes, monthlyExpensesRes] = await Promise.all([
                supabase.from('expenses').select('*').eq('shop_id', shopId).order('expense_date', { ascending: false }),
                supabase.from('sales').select('amount, status').eq('shop_id', shopId).gte('created_at', `${monthStart}T00:00:00`).lte('created_at', `${monthEnd}T23:59:59`),
                supabase.from('expenses').select('amount, type').eq('shop_id', shopId).gte('expense_date', monthStart).lte('expense_date', monthEnd),
            ]);

            const revenue = (monthlySalesRes.data || []).filter(r => (r.status || 'COMPLETED') === 'COMPLETED').reduce((s, r) => s + (Number(r.amount) || 0), 0);
            const commissions = (monthlyExpensesRes.data || []).filter(r => r.type === 'COMMISSION').reduce((s, r) => s + (Number(r.amount) || 0), 0);
            const expensesTotal = (monthlyExpensesRes.data || []).filter(r => r.type !== 'COMMISSION').reduce((s, r) => s + (Number(r.amount) || 0), 0);

            setExpenses(expensesRes.data || []);
            setFinancials({ revenue, commissions, expenses: expensesTotal, net_revenue: revenue + commissions - expensesTotal });
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('expenses').insert([{ ...newExpense, shop_id: shopId }]);
            if (error) throw error;
            setShowModal(false);
            setNewExpense({ type: 'DEPENSES', amount: '', description: '', payment_method: 'cash', expense_date: new Date().toISOString().split('T')[0] });
            fetchData();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cette dépense ?')) return;
        try {
            await supabase.from('expenses').delete().eq('id', id);
            fetchData();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Gestion Financière</h1>
                    <p className="mt-2 text-slate-500 font-medium">Suivez la rentabilité mensuelle et gérez vos coûts fixes.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 font-bold text-sm"
                >
                    <PlusIcon className="w-5 h-5" />
                    Nouvelle Dépense
                </button>
            </div>

            {/* Monthly Stats */}
            {financials && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="metric-card-new group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600">
                                <ArrowTrendingUpIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ventes du Mois</p>
                        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(financials.revenue).split(' ')[0]}</p>
                    </div>
                    <div className="metric-card-new group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600">
                                <ReceiptPercentIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Commissions MM</p>
                        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(financials.commissions).split(' ')[0]}</p>
                    </div>
                    <div className="metric-card-new group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600">
                                <ArrowTrendingDownIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dépenses Fixes</p>
                        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(financials.expenses).split(' ')[0]}</p>
                    </div>
                    <div className="metric-card-new bg-indigo-600 border-none shadow-xl shadow-indigo-600/20">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                                <ChartBarIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Bénéfice Net</p>
                        <p className="mt-1 text-2xl font-black text-white">{formatCurrency(financials.net_revenue).split(' ')[0]}</p>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="premium-card overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Opérations de Caisse</h3>
                        <p className="text-xs font-medium text-slate-500">Registre complet des sorties de fonds.</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <EllipsisHorizontalIcon className="w-6 h-6" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Nature</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Description</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Mode</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Montant</th>
                                <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="6" className="px-8 py-20 text-center animate-pulse text-slate-400 font-bold">Calcul des flux financiers...</td></tr>
                            ) : expenses.length === 0 ? (
                                <tr><td colSpan="6" className="px-8 py-20 text-center text-slate-400 font-medium italic">Aucune dépense enregistrée ce mois-ci.</td></tr>
                            ) : (
                                expenses.map(ex => {
                                    const info = EXPENSE_TYPES.find(t => t.value === ex.type) || EXPENSE_TYPES[3];
                                    const IconNode = info.icon;
                                    return (
                                        <tr key={ex.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{new Date(ex.expense_date).toLocaleDateString('fr-FR')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${info.bg} ${info.color}`}>
                                                        <IconNode className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-black text-slate-800 dark:text-white">{info.label}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-medium text-slate-500 line-clamp-1">{ex.description || '—'}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${ex.payment_method === 'cash' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'}`}>
                                                    {ex.payment_method === 'cash' ? 'Espèces' : 'M. Money'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right font-black text-slate-900 dark:text-white">
                                                {formatCurrency(ex.amount)}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    onClick={() => handleDelete(ex.id)}
                                                    className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up p-10">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Sortie de Fonds</h2>
                            <button onClick={() => setShowModal(false)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddExpense} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Nature</label>
                                    <select
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-600 appearance-none"
                                        value={newExpense.type}
                                        onChange={e => setNewExpense({ ...newExpense, type: e.target.value })}
                                    >
                                        {EXPENSE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Mode</label>
                                    <select
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-600 appearance-none"
                                        value={newExpense.payment_method}
                                        onChange={e => setNewExpense({ ...newExpense, payment_method: e.target.value })}
                                    >
                                        <option value="cash">Espèces</option>
                                        <option value="mobile_money">Mobile Money</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Montant (CFA)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-slate-900 dark:text-white"
                                        value={newExpense.amount}
                                        onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-600"
                                        value={newExpense.expense_date}
                                        onChange={e => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Commentaire</label>
                                <textarea
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700 dark:text-white h-24 resize-none"
                                    placeholder="Précisez la raison de la dépense..."
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
                            >
                                Valider la dépense
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
