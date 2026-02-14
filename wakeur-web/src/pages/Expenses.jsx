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
    XMarkIcon,
    TagIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';

const formatCurrency = (val) => new Intl.NumberFormat('fr-FR').format(Math.round(val || 0)) + ' F';

const EXPENSE_TYPES = [
    { value: 'LOCATION', label: 'Location', icon: BuildingOfficeIcon },
    { value: 'WIFI', label: 'Wifi', icon: WifiIcon },
    { value: 'SALARY', label: 'Salaire Agent', icon: BriefcaseIcon },
    { value: 'DEPENSES', label: 'Divers', icon: BanknotesIcon },
    { value: 'COMMISSION', label: 'Commission', icon: ReceiptPercentIcon }
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
        <div className="space-y-8 animate-enter">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-serif-display font-bold text-[var(--text-main)]">Gestion Financière</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Registre des coûts opérationnels et rentabilité.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary text-xs flex items-center gap-2"
                >
                    <PlusIcon className="w-4 h-4" /> Nouvelle Dépense
                </button>
            </div>

            {/* Metrics */}
            {financials && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <div className="card-modern p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Revenu Ventes</p>
                            <p className="text-2xl font-bold text-[var(--text-main)] mt-1">{formatCurrency(financials.revenue)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-[var(--bg-subtle)] text-[var(--primary)]">
                            <ArrowTrendingUpIcon className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="card-modern p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Commissions</p>
                            <p className="text-2xl font-bold text-[var(--text-main)] mt-1">{formatCurrency(financials.commissions)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-[var(--bg-subtle)] text-[var(--success)]">
                            <ReceiptPercentIcon className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="card-modern p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Dépenses</p>
                            <p className="text-2xl font-bold text-[var(--danger)] mt-1">{formatCurrency(financials.expenses)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-[var(--bg-subtle)] text-[var(--danger)]">
                            <ArrowTrendingDownIcon className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="card-modern p-5 flex items-center justify-between bg-[var(--text-main)] text-[var(--bg-app)]">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Bénéfice Net</p>
                            <p className="text-2xl font-bold mt-1">{formatCurrency(financials.net_revenue)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/10 text-current">
                            <ChartBarIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="card-modern overflow-hidden">
                <div className="p-5 border-b border-[var(--border)] bg-[var(--bg-card)]">
                    <h3 className="font-bold text-[var(--text-main)]">Historique des Dépenses</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="table-modern w-full">
                        <thead>
                            <tr>
                                <th className="pl-6">Date</th>
                                <th>Nature</th>
                                <th>Commentaire</th>
                                <th className="text-right">Montant</th>
                                <th className="pr-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-[var(--text-muted)] italic">Analyse des flux financiers...</td></tr>
                            ) : expenses.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-[var(--text-muted)] italic">Aucune dépense enregistrée.</td></tr>
                            ) : (
                                expenses.map(ex => {
                                    const info = EXPENSE_TYPES.find(t => t.value === ex.type) || EXPENSE_TYPES[3];
                                    const Icon = info.icon;
                                    return (
                                        <tr key={ex.id} className="group hover:bg-[var(--bg-subtle)] transition-colors">
                                            <td className="pl-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                                    <CalendarIcon className="w-4 h-4" />
                                                    <span>{new Date(ex.expense_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 rounded-md bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-medium text-[var(--text-main)]">{info.label}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-sm text-[var(--text-muted)] truncate max-w-[200px]">{ex.description || '—'}</td>
                                            <td className="py-4 text-right font-bold text-[var(--text-main)]">{formatCurrency(ex.amount)}</td>
                                            <td className="pr-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(ex.id)}
                                                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--bg-subtle)] transition-colors"
                                                >
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
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-[var(--bg-card)] rounded-xl shadow-2xl p-6 border border-[var(--border)] animate-enter">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-[var(--text-main)] font-serif-display">Nouvelle Dépense</h2>
                            <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-[var(--text-main)]">Nature</label>
                                    <div className="relative">
                                        <select
                                            className="input-modern w-full appearance-none pr-8"
                                            value={newExpense.type}
                                            onChange={e => setNewExpense({ ...newExpense, type: e.target.value })}
                                        >
                                            {EXPENSE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                        <FunnelIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-[var(--text-main)]">Montant</label>
                                    <input
                                        type="number"
                                        required
                                        className="input-modern w-full"
                                        value={newExpense.amount}
                                        onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[var(--text-main)]">Commentaire</label>
                                <textarea
                                    className="input-modern w-full h-24 resize-none"
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] transition-colors"
                                >
                                    Annuler
                                </button>
                                <button type="submit" className="btn-primary text-sm px-6 py-2">
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
