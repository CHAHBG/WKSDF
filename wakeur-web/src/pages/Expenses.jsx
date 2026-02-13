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
    XMarkIcon
} from '@heroicons/react/24/outline';

const formatCurrency = (val) => new Intl.NumberFormat('fr-FR').format(Math.round(val || 0)) + ' F';

const EXPENSE_TYPES = [
    { value: 'LOCATION', label: 'Location', icon: BuildingOfficeIcon, color: 'text-zinc-500' },
    { value: 'WIFI', label: 'Wifi', icon: WifiIcon, color: 'text-zinc-500' },
    { value: 'SALARY', label: 'Salaire Agent', icon: BriefcaseIcon, color: 'text-zinc-500' },
    { value: 'DEPENSES', label: 'Divers', icon: BanknotesIcon, color: 'text-zinc-500' },
    { value: 'COMMISSION', label: 'Commission', icon: ReceiptPercentIcon, color: 'text-zinc-500' }
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
        if (user && shopId) fetchData();
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
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        await supabase.from('expenses').insert([{ ...newExpense, shop_id: shopId }]);
        setShowModal(false);
        setNewExpense({ type: 'DEPENSES', amount: '', description: '', payment_method: 'cash', expense_date: new Date().toISOString().split('T')[0] });
        fetchData();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cette dépense ?')) return;
        await supabase.from('expenses').delete().eq('id', id);
        fetchData();
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Gestion Financière</h1>
                    <p className="mt-1 text-zinc-500 text-sm">Registre des coûts opérationnels et rentabilité.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-vibrant !text-xs !uppercase !tracking-widest">
                    <PlusIcon className="w-4 h-4" /> Nouvelle Dépense
                </button>
            </div>

            {financials && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Revenu Ventes', value: formatCurrency(financials.revenue), icon: ArrowTrendingUpIcon, color: 'emerald' },
                        { label: 'Commissions', value: formatCurrency(financials.commissions), icon: ReceiptPercentIcon, color: 'emerald' },
                        { label: 'Dépenses', value: formatCurrency(financials.expenses), icon: ArrowTrendingDownIcon, color: 'rose' },
                        { label: 'Bénéfice Net', value: formatCurrency(financials.net_revenue), icon: ChartBarIcon, color: 'zinc', highlight: true },
                    ].map((f, i) => (
                        <div key={i} className={`p-6 rounded-xl border ${f.highlight ? 'bg-zinc-900 border-zinc-800 text-white dark:bg-white dark:text-zinc-900' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'} transition-all`}>
                            <div className="flex items-center justify-between mb-3">
                                <f.icon className={`h-5 w-5 ${f.highlight ? 'text-zinc-400' : `text-${f.color}-500 opacity-60`}`} />
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{f.label}</span>
                            </div>
                            <p className="text-xl font-bold">{f.value}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="table-container">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="table-header">
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Nature</th>
                            <th className="px-6 py-4">Commentaire</th>
                            <th className="px-6 py-4 text-right">Montant</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-zinc-400 italic">Analyse des flux...</td></tr>
                        ) : expenses.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-zinc-400 italic">Aucune dépense enregistrée.</td></tr>
                        ) : (
                            expenses.map(ex => {
                                const info = EXPENSE_TYPES.find(t => t.value === ex.type) || EXPENSE_TYPES[3];
                                return (
                                    <tr key={ex.id} className="table-row">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-zinc-500 text-xs">
                                                <CalendarIcon className="w-3.5 h-3.5" />
                                                <span>{new Date(ex.expense_date).toLocaleDateString('fr-FR')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-200 text-[10px] uppercase tracking-widest">{info.label}</td>
                                        <td className="px-6 py-4 text-zinc-500 truncate max-w-[200px]">{ex.description || '—'}</td>
                                        <td className="px-6 py-4 text-right font-bold text-zinc-900 dark:text-white">{formatCurrency(ex.amount)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleDelete(ex.id)} className="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-premium border border-zinc-200 dark:border-zinc-800 p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Nouvelle Écriture</h2>
                            <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-950 transition-colors">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddExpense} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Nature</label>
                                    <select className="input-premium" value={newExpense.type} onChange={e => setNewExpense({ ...newExpense, type: e.target.value })}>
                                        {EXPENSE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Montant</label>
                                    <input type="number" required className="input-premium" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Commentaire</label>
                                <textarea className="input-premium h-20 resize-none font-medium" value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} />
                            </div>
                            <button type="submit" className="btn-vibrant w-full !py-4 !text-sm !uppercase !tracking-[0.2em] shadow-lg mt-2">Enregistrer</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
