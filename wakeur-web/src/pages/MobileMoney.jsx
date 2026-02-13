import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    DevicePhoneMobileIcon,
    BanknotesIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ClockIcon,
    PlusIcon,
    XMarkIcon,
    CalendarIcon,
    CheckCircleIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

const formatCurrency = (val) => new Intl.NumberFormat('fr-FR').format(Math.round(val || 0)) + ' CFA';

export default function MobileMoney() {
    const { userProfile } = useAuth();
    const shopId = userProfile?.shop_id;
    const [transactions, setTransactions] = useState([]);
    const [platforms, setPlatforms] = useState([]);
    const [dailyReport, setDailyReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showOpeningModal, setShowOpeningModal] = useState(false);
    const [showTransactionModal, setShowTransactionModal] = useState(false);

    // Balance State
    const [currentBalances, setCurrentBalances] = useState({
        cash: {},
        platforms: {}
    });

    // Opening State
    const [cashBreakdown, setCashBreakdown] = useState({
        b10000: '', b5000: '', b2000: '', b1000: '',
        c500: '', c250: '', c200: '', c100: '', c50: '', c25: '', c10: '', c5: ''
    });
    const [platformBalances, setPlatformBalances] = useState({});

    // Transaction State
    const [selectedPlatform, setSelectedPlatform] = useState(null);
    const [transactionCash, setTransactionCash] = useState({
        b10000: '', b5000: '', b2000: '', b1000: '',
        c500: '', c250: '', c200: '', c100: '', c50: '', c25: '', c10: '', c5: ''
    });

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
        } catch (e) {
            console.error('Error parsing opening balances:', e);
        }

        const currentCash = { ...openingCash };
        const currentPlatforms = { ...openingPlatforms };

        transactions.forEach(t => {
            try {
                const notesStr = t.notes || '{}';
                const breakdown = JSON.parse(notesStr.includes('Breakdown:') ? notesStr.replace('Breakdown: ', '') : notesStr).cash_breakdown || {};

                if (t.operation_type === 'ENCAISSEMENT') {
                    Object.keys(breakdown).forEach(key => {
                        currentCash[key] = (parseInt(currentCash[key]) || 0) + (parseInt(breakdown[key]) || 0);
                    });
                    currentPlatforms[t.platform_id] = (parseFloat(currentPlatforms[t.platform_id]) || 0) - parseFloat(t.amount);
                } else {
                    Object.keys(breakdown).forEach(key => {
                        currentCash[key] = (parseInt(currentCash[key]) || 0) - (parseInt(breakdown[key]) || 0);
                    });
                    currentPlatforms[t.platform_id] = (parseFloat(currentPlatforms[t.platform_id]) || 0) + parseFloat(t.amount);
                }
            } catch (e) {
                console.error('Error processing transaction:', e);
            }
        });

        setCurrentBalances({ cash: currentCash, platforms: currentPlatforms });
    }, [dailyReport, transactions]);

    useEffect(() => {
        calculateCurrentBalances();
    }, [calculateCurrentBalances]);

    const checkDailyReport = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('mm_daily_reports')
                .select('*')
                .eq('report_date', today)
                .eq('is_closed', false)
                .order('opened_at', { ascending: false })
                .limit(1);

            if (error && error.code !== 'PGRST116') throw error;

            const activeReport = Array.isArray(data) ? data[0] : data;
            if (!activeReport) {
                setShowOpeningModal(true);
            } else {
                setDailyReport(activeReport);
            }
        } catch (error) {
            console.error('Error checking daily report:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPlatforms = async () => {
        try {
            const { data } = await supabase
                .from('mm_platforms')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (data && data.length > 0) {
                setPlatforms(data);
                setSelectedPlatform(data[0].id);
                const initial = {};
                data.forEach(p => initial[p.id] = '');
                setPlatformBalances(initial);
            }
        } catch (error) {
            console.error('Error fetching platforms:', error);
        }
    };

    const fetchTransactions = async () => {
        try {
            const { data } = await supabase
                .from('mm_transactions')
                .select('*, mm_platforms(name, code, color)')
                .order('transaction_date', { ascending: false })
                .limit(50);

            setTransactions(data || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const calculateTotal = (breakdown) => {
        return (
            (parseInt(breakdown.b10000) || 0) * 10000 +
            (parseInt(breakdown.b5000) || 0) * 5000 +
            (parseInt(breakdown.b2000) || 0) * 2000 +
            (parseInt(breakdown.b1000) || 0) * 1000 +
            (parseInt(breakdown.c500) || 0) * 500 +
            (parseInt(breakdown.c250) || 0) * 250 +
            (parseInt(breakdown.c200) || 0) * 200 +
            (parseInt(breakdown.c100) || 0) * 100 +
            (parseInt(breakdown.c50) || 0) * 50 +
            (parseInt(breakdown.c25) || 0) * 25 +
            (parseInt(breakdown.c10) || 0) * 10 +
            (parseInt(breakdown.c5) || 0) * 5
        );
    };

    const handleOpenDay = async () => {
        const total = calculateTotal(cashBreakdown);
        try {
            const today = new Date().toISOString().split('T')[0];
            const { error } = await supabase
                .from('mm_daily_reports')
                .insert({
                    report_date: today,
                    opening_balance: total,
                    notes: JSON.stringify({ cash_breakdown: cashBreakdown, platforms: platformBalances }),
                    is_closed: false
                });

            if (error) throw error;
            setShowOpeningModal(false);
            checkDailyReport();
        } catch (error) {
            console.error('Error opening day:', error);
        }
    };

    const handleCreateTransaction = async (type) => {
        const total = calculateTotal(transactionCash);
        if (total === 0 || !selectedPlatform) return;

        try {
            const { error } = await supabase
                .from('mm_transactions')
                .insert({
                    platform_id: selectedPlatform,
                    operation_type: type,
                    amount: total,
                    total_amount: total,
                    fees: 0,
                    notes: JSON.stringify({ cash_breakdown: transactionCash }),
                    status: 'COMPLETED',
                    transaction_date: new Date().toISOString()
                });

            if (error) throw error;
            setShowTransactionModal(false);
            setTransactionCash({
                b10000: '', b5000: '', b2000: '', b1000: '',
                c500: '', c250: '', c200: '', c100: '', c50: '', c25: '', c10: '', c5: ''
            });
            await fetchTransactions();
        } catch (error) {
            console.error('Error creating transaction:', error);
        }
    };

    const totalCash = calculateTotal(currentBalances.cash);
    const totalPlatforms = Object.values(currentBalances.platforms).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

    const DenomInput = ({ label, value, onChange }) => (
        <div className="space-y-1">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{label}</span>
            <input
                type="number"
                placeholder="0"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center font-black text-slate-700 dark:text-white"
                value={value}
                onChange={e => onChange(e.target.value)}
            />
        </div>
    );

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Mobile Money</h1>
                    <p className="mt-2 text-slate-500 font-medium">Gérez vos encaissements et décaissements Orange Money, Wave et Free.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowTransactionModal(true)}
                        disabled={!dailyReport}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 font-bold text-sm disabled:opacity-50 disabled:grayscale"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Nouvelle Opération
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="premium-card p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                            <BanknotesIcon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full">En Caisse</span>
                    </div>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Total Espèces</p>
                        <p className="mt-1 text-4xl font-black text-slate-900 dark:text-white">{formatCurrency(totalCash).split(' ')[0]} <span className="text-lg opacity-40">CFA</span></p>
                    </div>
                </div>

                <div className="premium-card p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <DevicePhoneMobileIcon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Applications</span>
                    </div>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Total Digital</p>
                        <p className="mt-1 text-4xl font-black text-slate-900 dark:text-white">{formatCurrency(totalPlatforms).split(' ')[0]} <span className="text-lg opacity-40">CFA</span></p>
                    </div>
                </div>

                <div className="premium-card p-8 bg-indigo-600 flex flex-col justify-between text-white shadow-xl shadow-indigo-600/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                            <ChartBarIcon className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Solde Combiné</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-widest opacity-60">Liquidité Totale</p>
                        <p className="mt-1 text-4xl font-black">{formatCurrency(totalCash + totalPlatforms).split(' ')[0]} <span className="text-lg opacity-40">CFA</span></p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Platform Balances */}
                <div className="premium-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Soldes Digitaux</h3>
                            <p className="text-xs font-medium text-slate-500">Par opérateur de paiement</p>
                        </div>
                        <DevicePhoneMobileIcon className="w-6 h-6 text-slate-300" />
                    </div>
                    <div className="space-y-4">
                        {platforms.map(p => {
                            const bal = parseFloat(currentBalances.platforms[p.id]) || 0;
                            return (
                                <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-black shadow-lg"
                                            style={{ backgroundColor: p.color }}
                                        >
                                            {p.code.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{p.code}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-slate-900 dark:text-white text-lg">{formatCurrency(bal).split(' ')[0]}</p>
                                        <p className="text-[10px] font-black uppercase text-indigo-500">FCFA</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Cash Details */}
                <div className="premium-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Détail des Espèces</h3>
                            <p className="text-xs font-medium text-slate-500">Ventilation physique de la caisse</p>
                        </div>
                        <BanknotesIcon className="w-6 h-6 text-slate-300" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { k: 'b10000', l: '10.000', v: 10000 },
                            { k: 'b5000', l: '5.000', v: 5000 },
                            { k: 'b2000', l: '2.000', v: 2000 },
                            { k: 'b1000', l: '1.000', v: 1000 },
                            { k: 'c500', l: '500', v: 500 },
                            { k: 'c200', l: '200', v: 200 },
                            { k: 'c100', l: '100', v: 100 },
                            { k: 'c50', l: '50', v: 50 }
                        ].map(d => {
                            const qty = currentBalances.cash[d.k] || 0;
                            return (
                                <div key={d.k} className="flex flex-col p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{d.l} F</span>
                                    <div className="flex items-end justify-between">
                                        <span className="text-lg font-black text-slate-700 dark:text-slate-200">×{qty}</span>
                                        <span className="text-xs font-bold text-slate-400">{(qty * d.v).toLocaleString()}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="premium-card overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Historique d&apos;Activités</h3>
                        <p className="text-xs font-medium text-slate-500">Les 50 dernières opérations Mobile Money</p>
                    </div>
                    <ClockIcon className="w-6 h-6 text-slate-300" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Horodatage</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Opération</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Opérateur</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Montant</th>
                                <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {transactions.map(t => {
                                const isEncaissement = t.operation_type === 'ENCAISSEMENT';
                                return (
                                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon className="w-4 h-4 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                    {new Date(t.transaction_date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                {isEncaissement ? (
                                                    <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                                        <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
                                                    </div>
                                                ) : (
                                                    <div className="h-6 w-6 rounded-full bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center text-rose-600">
                                                        <ArrowTrendingDownIcon className="w-3.5 h-3.5" />
                                                    </div>
                                                )}
                                                <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{t.operation_type}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: t.mm_platforms?.color }} />
                                                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{t.mm_platforms?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right font-black text-slate-900 dark:text-white">
                                            {isEncaissement ? '+' : '-'}{parseInt(t.amount).toLocaleString()} F
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                                {t.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals - Same logic, updated style */}
            {showOpeningModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up overflow-hidden">
                        <div className="bg-slate-900 p-8 flex justify-between items-start text-white">
                            <div>
                                <h2 className="text-3xl font-black tracking-tight">Ouverture de Session</h2>
                                <p className="text-slate-400 font-medium mt-1">Saisissez vos stocks physiques pour démarrer la journée.</p>
                            </div>
                        </div>
                        <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto scrollbar-hide">
                            <div className="space-y-6">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500">Caisse Espèces (Billets & Pièces)</h3>
                                <div className="grid grid-cols-4 md:grid-cols-6 gap-6">
                                    <DenomInput label="10.000" value={cashBreakdown.b10000} onChange={v => setCashBreakdown({ ...cashBreakdown, b10000: v })} />
                                    <DenomInput label="5.000" value={cashBreakdown.b5000} onChange={v => setCashBreakdown({ ...cashBreakdown, b5000: v })} />
                                    <DenomInput label="2.000" value={cashBreakdown.b2000} onChange={v => setCashBreakdown({ ...cashBreakdown, b2000: v })} />
                                    <DenomInput label="1.000" value={cashBreakdown.b1000} onChange={v => setCashBreakdown({ ...cashBreakdown, b1000: v })} />
                                    <DenomInput label="500" value={cashBreakdown.c500} onChange={v => setCashBreakdown({ ...cashBreakdown, c500: v })} />
                                    <DenomInput label="200" value={cashBreakdown.c200} onChange={v => setCashBreakdown({ ...cashBreakdown, c200: v })} />
                                    <DenomInput label="100" value={cashBreakdown.c100} onChange={v => setCashBreakdown({ ...cashBreakdown, c100: v })} />
                                    <DenomInput label="50" value={cashBreakdown.c50} onChange={v => setCashBreakdown({ ...cashBreakdown, c50: v })} />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500">Portefeuilles Digitaux</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    {platforms.map(p => (
                                        <div key={p.id} className="space-y-1">
                                            <div className="flex items-center gap-2 mb-1 px-1">
                                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{p.name}</span>
                                            </div>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-slate-700 dark:text-white"
                                                value={platformBalances[p.id] || ''}
                                                onChange={e => setPlatformBalances({ ...platformBalances, [p.id]: e.target.value })}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Global Ouverture</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(calculateTotal(cashBreakdown) + Object.values(platformBalances).reduce((a, b) => a + (parseFloat(b) || 0), 0))}</p>
                            </div>
                            <button
                                onClick={handleOpenDay}
                                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/30 hover:scale-[1.05] transition-all"
                            >
                                Partir sur ces bases
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showTransactionModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up p-10">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Opération Rapide</h2>
                            <button onClick={() => setShowTransactionModal(false)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Choix de l&apos;Opérateur</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {platforms.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setSelectedPlatform(p.id)}
                                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${selectedPlatform === p.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-600/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                                        >
                                            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-black" style={{ backgroundColor: p.color }}>
                                                {p.code.charAt(0)}
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${selectedPlatform === p.id ? 'text-indigo-600' : 'text-slate-400'}`}>{p.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Détail des Espèces Manipulées</label>
                                <div className="grid grid-cols-4 gap-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl">
                                    <DenomInput label="10.000" value={transactionCash.b10000} onChange={v => setTransactionCash({ ...transactionCash, b10000: v })} />
                                    <DenomInput label="5.000" value={transactionCash.b5000} onChange={v => setTransactionCash({ ...transactionCash, b5000: v })} />
                                    <DenomInput label="2.000" value={transactionCash.b2000} onChange={v => setTransactionCash({ ...transactionCash, b2000: v })} />
                                    <DenomInput label="1.000" value={transactionCash.b1000} onChange={v => setTransactionCash({ ...transactionCash, b1000: v })} />
                                    <DenomInput label="500" value={transactionCash.c500} onChange={v => setTransactionCash({ ...transactionCash, c500: v })} />
                                    <DenomInput label="200" value={transactionCash.c200} onChange={v => setTransactionCash({ ...transactionCash, c200: v })} />
                                    <DenomInput label="100" value={transactionCash.c100} onChange={v => setTransactionCash({ ...transactionCash, c100: v })} />
                                    <DenomInput label="50" value={transactionCash.c50} onChange={v => setTransactionCash({ ...transactionCash, c50: v })} />
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-6 mt-10">
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Montant de la transaction</p>
                                    <p className="text-4xl font-black text-slate-900 dark:text-white">{formatCurrency(calculateTotal(transactionCash))}</p>
                                </div>
                                <div className="w-full grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleCreateTransaction('ENCAISSEMENT')}
                                        className="py-5 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        ENCAISSEMENT
                                    </button>
                                    <button
                                        onClick={() => handleCreateTransaction('DECAISSEMENT')}
                                        className="py-5 bg-rose-500 text-white rounded-2xl font-black shadow-lg shadow-rose-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        DÉCAISSEMENT
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
