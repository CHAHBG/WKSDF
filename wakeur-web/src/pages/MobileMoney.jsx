import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    DevicePhoneMobileIcon,
    BanknotesIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    PlusIcon,
    XMarkIcon,
    CalendarIcon,
    CheckCircleIcon,
    WalletIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

const formatCurrency = (val) => new Intl.NumberFormat('fr-FR').format(Math.round(val || 0)) + ' F';

export default function MobileMoney() {
    const { userProfile } = useAuth();
    const shopId = userProfile?.shop_id;
    const [transactions, setTransactions] = useState([]);
    const [platforms, setPlatforms] = useState([]);
    const [dailyReport, setDailyReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showOpeningModal, setShowOpeningModal] = useState(false);
    const [showTransactionModal, setShowTransactionModal] = useState(false);

    const [currentBalances, setCurrentBalances] = useState({ cash: {}, platforms: {} });
    const [cashBreakdown, setCashBreakdown] = useState({ b10000: '', b5000: '', b2000: '', b1000: '', c500: '', c250: '', c200: '', c100: '', c50: '' });
    const [platformBalances, setPlatformBalances] = useState({});
    const [selectedPlatform, setSelectedPlatform] = useState(null);
    const [transactionAmount, setTransactionAmount] = useState('');
    const [transactionType, setTransactionType] = useState('ENCAISSEMENT');
    // Using a simplified cash input for transactions in this design, 
    // or keeping breakdown if strictly required. 
    // For "Clean" design, usually total amount is preferred unless cash breakdown is mandatory per transaction.
    // Assuming we keep the logic but simplify the UI.
    const [transactionCash, setTransactionCash] = useState({ b10000: '', b5000: '', b2000: '', b1000: '', c500: '', c250: '', c200: '', c100: '', c50: '' });

    useEffect(() => {
        if (shopId) {
            checkDailyReport();
            fetchPlatforms();
            fetchTransactions();
        }
    }, [shopId]);

    const calculateCurrentBalances = useCallback(() => {
        if (!dailyReport) return;
        let openingCash = {};
        let openingPlatforms = {};
        try {
            const notes = JSON.parse(dailyReport.notes || '{}');
            openingCash = notes.cash_breakdown || {};
            openingPlatforms = notes.platforms || {};
        } catch (e) { }

        const currentCash = { ...openingCash };
        const currentPlatforms = { ...openingPlatforms };

        transactions.forEach(t => {
            try {
                const notesStr = t.notes || '{}';
                const breakdown = JSON.parse(notesStr.includes('Breakdown:') ? notesStr.replace('Breakdown: ', '') : notesStr).cash_breakdown || {};

                // If breakdown exists, use it. If not (simplified UI), we might need to adjust logic.
                // For now, retaining original logic assuming breakdown is provided or we adapt `transactionCash`

                if (t.operation_type === 'ENCAISSEMENT') {
                    // In (Deposit to customer phone) -> We receive Cash, We lose Float
                    Object.keys(breakdown).forEach(key => currentCash[key] = (parseInt(currentCash[key]) || 0) + (parseInt(breakdown[key]) || 0));
                    currentPlatforms[t.platform_id] = (parseFloat(currentPlatforms[t.platform_id]) || 0) - parseFloat(t.amount);
                } else {
                    // Out (Withdrawal from customer phone) -> We give Cash, We gain Float
                    Object.keys(breakdown).forEach(key => currentCash[key] = (parseInt(currentCash[key]) || 0) - (parseInt(breakdown[key]) || 0));
                    currentPlatforms[t.platform_id] = (parseFloat(currentPlatforms[t.platform_id]) || 0) + parseFloat(t.amount);
                }
            } catch (e) { }
        });
        setCurrentBalances({ cash: currentCash, platforms: currentPlatforms });
    }, [dailyReport, transactions]);

    useEffect(() => { calculateCurrentBalances(); }, [calculateCurrentBalances]);

    const checkDailyReport = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data } = await supabase.from('mm_daily_reports').select('*').eq('report_date', today).eq('is_closed', false).limit(1);
            if (!data?.[0]) setShowOpeningModal(true);
            else setDailyReport(data[0]);
        } finally { setLoading(false); }
    };

    const fetchPlatforms = async () => {
        const { data } = await supabase.from('mm_platforms').select('*').eq('is_active', true).order('name');
        if (data?.length) {
            setPlatforms(data);
            setSelectedPlatform(data[0].id);
        }
    };

    const fetchTransactions = async () => {
        const { data } = await supabase.from('mm_transactions').select('*, mm_platforms(name, code, color)').order('transaction_date', { ascending: false }).limit(50);
        setTransactions(data || []);
    };

    const calculateTotal = (brk) => Object.entries(brk).reduce((sum, [key, qty]) => sum + (parseInt(qty) || 0) * parseInt(key.replace(/[bc]/, '')), 0);

    const handleOpenDay = async () => {
        const today = new Date().toISOString().split('T')[0];
        await supabase.from('mm_daily_reports').insert({ report_date: today, opening_balance: calculateTotal(cashBreakdown), notes: JSON.stringify({ cash_breakdown: cashBreakdown, platforms: platformBalances }), is_closed: false });
        setShowOpeningModal(false);
        checkDailyReport();
    };

    const handleCreateTransaction = async () => {
        const total = calculateTotal(transactionCash);
        if (!total || !selectedPlatform) return;

        await supabase.from('mm_transactions').insert({
            platform_id: selectedPlatform,
            operation_type: transactionType,
            amount: total,
            total_amount: total,
            notes: JSON.stringify({ cash_breakdown: transactionCash }),
            status: 'COMPLETED',
            transaction_date: new Date().toISOString()
        });

        setShowTransactionModal(false);
        setTransactionCash({ b10000: '', b5000: '', b2000: '', b1000: '', c500: '', c250: '', c200: '', c100: '', c50: '' });
        fetchTransactions();
    };

    const totalCash = calculateTotal(currentBalances.cash);
    const totalPlatforms = Object.values(currentBalances.platforms).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const currentTransactionTotal = calculateTotal(transactionCash);

    return (
        <div className="space-y-8 animate-enter">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-serif-display font-bold text-[var(--text-main)]">Mobile Money</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Gestion des opérations et de la liquidité.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchTransactions} className="btn-secondary text-xs">
                        <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setShowTransactionModal(true)}
                        disabled={!dailyReport}
                        className="btn-primary text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <PlusIcon className="w-4 h-4" /> Nouvelle Opération
                    </button>
                </div>
            </div>

            {/* Balances */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-modern p-5 flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Espèces (Caisse)</p>
                            <h3 className="text-2xl font-bold text-[var(--text-main)] mt-1 tracking-tight">{formatCurrency(totalCash)}</h3>
                        </div>
                        <div className="p-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--primary)]">
                            <BanknotesIcon className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                <div className="card-modern p-5 flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Flotte (Numérique)</p>
                            <h3 className="text-2xl font-bold text-[var(--text-main)] mt-1 tracking-tight">{formatCurrency(totalPlatforms)}</h3>
                        </div>
                        <div className="p-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-main)]">
                            <DevicePhoneMobileIcon className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                <div className="card-modern p-5 flex flex-col justify-between h-32 bg-[var(--text-main)] text-[var(--bg-app)]">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Liquidité Totale</p>
                            <h3 className="text-2xl font-bold mt-1 tracking-tight">{formatCurrency(totalCash + totalPlatforms)}</h3>
                        </div>
                        <div className="p-2 rounded-lg bg-white/10">
                            <WalletIcon className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Platform Balances */}
                <div className="card-modern p-0 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-card)]">
                        <h3 className="font-bold text-[var(--text-main)] text-sm">Soldes par Opérateur</h3>
                    </div>
                    <div className="p-2 space-y-1">
                        {platforms.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-3 hover:bg-[var(--bg-subtle)] rounded-xl transition-colors">
                                <span className="text-sm font-medium text-[var(--text-muted)]">{p.name}</span>
                                <span className="text-sm font-bold text-[var(--text-main)]">{formatCurrency(currentBalances.platforms[p.id] || 0)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cash Breakdown */}
                <div className="lg:col-span-2 card-modern p-0 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-card)]">
                        <h3 className="font-bold text-[var(--text-main)] text-sm">Détail des Espèces</h3>
                    </div>
                    <div className="p-4 grid grid-cols-3 sm:grid-cols-5 gap-3">
                        {Object.entries(currentBalances.cash).map(([denom, qty]) => (
                            <div key={denom} className="flex flex-col items-center justify-center p-3 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border-subtle)]">
                                <span className="text-[10px] font-bold text-[var(--text-muted)] mb-1">{denom.replace(/[bc]/, '')}F</span>
                                <span className="text-base font-bold text-[var(--text-main)]">{qty}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="card-modern overflow-hidden">
                <div className="p-5 border-b border-[var(--border)] bg-[var(--bg-card)]">
                    <h3 className="font-bold text-[var(--text-main)]">Transactions Récentes</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="table-modern w-full">
                        <thead>
                            <tr>
                                <th className="pl-6">Date</th>
                                <th>Opération</th>
                                <th>Opérateur</th>
                                <th className="text-right">Montant</th>
                                <th className="text-center pr-6">Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(t => (
                                <tr key={t.id} className="group hover:bg-[var(--bg-subtle)] transition-colors">
                                    <td className="pl-6 py-4 text-sm text-[var(--text-muted)]">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-[var(--text-main)]">{new Date(t.transaction_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
                                            <span className="text-[10px]">{new Date(t.transaction_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${t.operation_type === 'ENCAISSEMENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30' : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/30'}`}>
                                            {t.operation_type === 'ENCAISSEMENT' ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
                                            {t.operation_type === 'ENCAISSEMENT' ? 'Envoi' : 'Retrait'}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <span className="text-sm font-medium text-[var(--text-main)]">{t.mm_platforms?.name}</span>
                                    </td>
                                    <td className="py-4 text-right font-bold text-[var(--text-main)]">
                                        {formatCurrency(t.amount)}
                                    </td>
                                    <td className="pr-6 py-4 text-center">
                                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-[var(--success)]">
                                            <CheckCircleIcon className="w-3 h-3" /> {t.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Opening Modal */}
            {showOpeningModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-2xl bg-[var(--bg-card)] rounded-xl shadow-2xl p-8 border border-[var(--border)] animate-enter">
                        <h2 className="text-xl font-bold text-[var(--text-main)] font-serif-display mb-1">Ouverture de Caisse</h2>
                        <p className="text-sm text-[var(--text-muted)] mb-6">Comptez vos espèces pour initialiser la session.</p>

                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-6">
                            {Object.keys(cashBreakdown).map(k => (
                                <div key={k} className="space-y-1">
                                    <label className="text-[10px] font-bold text-[var(--text-muted)] ml-1">{k.replace(/[bc]/, '')} F</label>
                                    <input
                                        type="number"
                                        className="input-modern w-full !text-center !px-1"
                                        value={cashBreakdown[k]}
                                        onChange={e => setCashBreakdown({ ...cashBreakdown, [k]: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end border-t border-[var(--border)] pt-4">
                            <div className="mr-auto">
                                <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">Total</span>
                                <p className="text-xl font-bold text-[var(--text-main)]">{formatCurrency(calculateTotal(cashBreakdown))}</p>
                            </div>
                            <button onClick={handleOpenDay} className="btn-primary px-8">Activer la Caisse</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction Modal */}
            {showTransactionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-xl bg-[var(--bg-card)] rounded-xl shadow-2xl p-0 border border-[var(--border)] animate-enter overflow-hidden">
                        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-subtle)]">
                            <h2 className="text-lg font-bold text-[var(--text-main)] font-serif-display">Nouvelle Opération</h2>
                            <button onClick={() => setShowTransactionModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]"><XMarkIcon className="w-5 h-5" /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Type Selection */}
                            <div className="flex p-1 bg-[var(--bg-subtle)] rounded-lg">
                                <button
                                    onClick={() => setTransactionType('ENCAISSEMENT')}
                                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${transactionType === 'ENCAISSEMENT' ? 'bg-white text-[var(--text-main)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                                >
                                    Envoi (Cash In)
                                </button>
                                <button
                                    onClick={() => setTransactionType('DECAISSEMENT')}
                                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${transactionType === 'DECAISSEMENT' ? 'bg-white text-[var(--text-main)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                                >
                                    Retrait (Cash Out)
                                </button>
                            </div>

                            {/* Platform Selection */}
                            <div>
                                <label className="text-xs font-semibold text-[var(--text-main)] mb-2 block">Opérateur</label>
                                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-3">
                                    {platforms.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setSelectedPlatform(p.id)}
                                            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${selectedPlatform === p.id ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]' : 'border-[var(--border)] hover:border-[var(--border-hover)] text-[var(--text-muted)]'}`}
                                        >
                                            <DevicePhoneMobileIcon className="w-5 h-5" />
                                            <span className="text-[10px] font-bold uppercase">{p.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Cash Breakdown Input */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-semibold text-[var(--text-main)]">Détail des Espèces</label>
                                    <span className="text-xs font-bold text-[var(--text-main)] bg-[var(--bg-subtle)] px-2 py-1 rounded">Total: {formatCurrency(currentTransactionTotal)}</span>
                                </div>
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                    {Object.keys(transactionCash).map(k => (
                                        <div key={k} className="space-y-1">
                                            <label className="text-[9px] font-bold text-[var(--text-muted)] ml-1">{k.replace(/[bc]/, '')}</label>
                                            <input
                                                type="number"
                                                className={`input-modern w-full !text-center !px-1 !text-xs !h-8 ${transactionCash[k] ? 'border-[var(--primary)] bg-[var(--primary)]/5' : ''}`}
                                                value={transactionCash[k]}
                                                onChange={e => setTransactionCash({ ...transactionCash, [k]: e.target.value })}
                                                placeholder="-"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-subtle)] flex justify-end">
                            <button
                                onClick={handleCreateTransaction}
                                disabled={!currentTransactionTotal || !selectedPlatform}
                                className="btn-primary"
                            >
                                Valider {transactionType === 'ENCAISSEMENT' ? "l'Envoi" : 'le Retrait'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
