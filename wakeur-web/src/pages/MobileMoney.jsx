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
                if (t.operation_type === 'ENCAISSEMENT') {
                    Object.keys(breakdown).forEach(key => currentCash[key] = (parseInt(currentCash[key]) || 0) + (parseInt(breakdown[key]) || 0));
                    currentPlatforms[t.platform_id] = (parseFloat(currentPlatforms[t.platform_id]) || 0) - parseFloat(t.amount);
                } else {
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

    const handleCreateTransaction = async (type) => {
        const total = calculateTotal(transactionCash);
        if (!total || !selectedPlatform) return;
        await supabase.from('mm_transactions').insert({ platform_id: selectedPlatform, operation_type: type, amount: total, total_amount: total, notes: JSON.stringify({ cash_breakdown: transactionCash }), status: 'COMPLETED', transaction_date: new Date().toISOString() });
        setShowTransactionModal(false);
        setTransactionCash({ b10000: '', b5000: '', b2000: '', b1000: '', c500: '', c250: '', c200: '', c100: '', c50: '' });
        fetchTransactions();
    };

    const totalCash = calculateTotal(currentBalances.cash);
    const totalPlatforms = Object.values(currentBalances.platforms).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

    return (
        <div className="space-y-12 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Mobile Money</h1>
                    <p className="text-zinc-500 font-medium mt-1">Gestion des flux digitaux et espèces de service.</p>
                </div>
                <button
                    onClick={() => setShowTransactionModal(true)}
                    disabled={!dailyReport}
                    className="btn-vibrant disabled:opacity-50"
                >
                    <PlusIcon className="w-5 h-5" /> Nouvelle Opération
                </button>
            </div>

            {/* Joyful Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'En Caisse (Espèces)', value: totalCash, icon: BanknotesIcon, color: 'emerald' },
                    { label: 'En Portefeuille (Digital)', value: totalPlatforms, icon: DevicePhoneMobileIcon, color: 'teal' },
                    { label: 'Liquidité Totale', value: totalCash + totalPlatforms, icon: ChartBarIcon, color: 'orange', highlight: true },
                ].map((s, i) => (
                    <div key={i} className={`metric-card-joy group relative overflow-hidden ${s.highlight ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 !border-transparent' : ''}`}>
                        {!s.highlight && <div className={`absolute top-0 right-0 w-24 h-24 bg-${s.color}-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110`}></div>}
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className={`p-3 rounded-2xl ${s.highlight ? 'bg-white/10 dark:bg-zinc-100 text-white dark:text-zinc-900' : `bg-${s.color}-50 dark:bg-${s.color}-900/20 text-${s.color}-600`}`}>
                                    <s.icon className="w-6 h-6" />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${s.highlight ? 'opacity-50' : 'text-zinc-400'}`}>{s.label}</span>
                            </div>
                            <p className="text-3xl font-black tracking-tighter">{formatCurrency(s.value)}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="premium-card p-10 shadow-2xl shadow-teal-900/5">
                    <h3 className="text-xs font-black uppercase tracking-[0.25em] text-teal-600 mb-8">Soldes Digitaux</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {platforms.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-transparent hover:border-teal-500/20 transition-all group">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{p.name}</span>
                                    <span className="font-black text-zinc-900 dark:text-white tracking-tight">{formatCurrency(currentBalances.platforms[p.id] || 0)}</span>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
                                    <DevicePhoneMobileIcon className="w-4 h-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="premium-card p-10 shadow-2xl shadow-orange-900/5">
                    <h3 className="text-xs font-black uppercase tracking-[0.25em] text-orange-600 mb-8">Détail Espèces</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Object.entries(currentBalances.cash).map(([denom, qty]) => (
                            <div key={denom} className="flex flex-col items-center justify-center p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl border border-orange-100/50 dark:border-orange-900/20">
                                <span className="text-[10px] font-black text-orange-600 mb-1">{denom.replace(/[bc]/, '')}F</span>
                                <span className="text-lg font-black text-zinc-900 dark:text-white">×{qty}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="table-container shadow-2xl shadow-teal-900/5">
                <table className="w-full text-left">
                    <thead>
                        <tr className="table-header">
                            <th className="px-8 py-6">Horodatage</th>
                            <th className="px-6 py-6">Opération</th>
                            <th className="px-6 py-6">Opérateur</th>
                            <th className="px-6 py-6 text-right">Montant</th>
                            <th className="px-8 py-6 text-center">État</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {transactions.map(t => (
                            <tr key={t.id} className="table-row group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2 text-zinc-500 font-bold text-xs">
                                        <CalendarIcon className="w-4 h-4 text-teal-600/50" />
                                        <span>{new Date(t.transaction_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} • {new Date(t.transaction_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-6">
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${t.operation_type === 'ENCAISSEMENT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                        {t.operation_type === 'ENCAISSEMENT' ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
                                        {t.operation_type}
                                    </div>
                                </td>
                                <td className="px-6 py-6">
                                    <span className="px-3 py-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-xs font-black text-zinc-500 uppercase tracking-widest">
                                        {t.mm_platforms?.name}
                                    </span>
                                </td>
                                <td className="px-6 py-6 text-right font-black text-zinc-900 dark:text-white">{formatCurrency(t.amount)}</td>
                                <td className="px-8 py-6 text-center">
                                    <div className="inline-flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                                        <CheckCircleIcon className="w-4 h-4" /> {t.status}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showOpeningModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
                    <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-xl shadow-premium border border-zinc-200 dark:border-zinc-800 p-10">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Ouverture de Session</h2>
                        <p className="text-zinc-500 text-sm mb-8">Vériﬁez vos stocks physiques pour activer le service.</p>
                        <div className="grid grid-cols-4 gap-4 mb-8">
                            {Object.keys(cashBreakdown).map(k => (
                                <div key={k} className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">{k.replace(/[bc]/, '')} F</label>
                                    <input type="number" className="input-premium !text-center" value={cashBreakdown[k]} onChange={e => setCashBreakdown({ ...cashBreakdown, [k]: e.target.value })} />
                                </div>
                            ))}
                        </div>
                        <button onClick={handleOpenDay} className="btn-vibrant w-full !py-4 !uppercase !tracking-widest">Activer la Caisse</button>
                    </div>
                </div>
            )}

            {showTransactionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
                    <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-xl shadow-premium border border-zinc-200 dark:border-zinc-800 p-10">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Opération Rapide</h2>
                            <button onClick={() => setShowTransactionModal(false)} className="text-zinc-400 hover:text-zinc-950"><XMarkIcon className="w-5 h-5" /></button>
                        </div>
                        <div className="flex gap-4 mb-8">
                            {platforms.map(p => (
                                <button key={p.id} onClick={() => setSelectedPlatform(p.id)} className={`flex-1 p-3 rounded-xl border-2 transition-all text-xs font-bold uppercase tracking-widest ${selectedPlatform === p.id ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-100 bg-zinc-50 text-zinc-400'}`}>{p.name}</button>
                            ))}
                        </div>
                        <div className="grid grid-cols-4 gap-4 mb-10">
                            {Object.keys(transactionCash).map(k => (
                                <div key={k} className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">{k.replace(/[bc]/, '')} F</label>
                                    <input type="number" className="input-premium !text-center" value={transactionCash[k]} onChange={e => setTransactionCash({ ...transactionCash, [k]: e.target.value })} />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => handleCreateTransaction('ENCAISSEMENT')} className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest">Encaisser</button>
                            <button onClick={() => handleCreateTransaction('DECAISSEMENT')} className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest">Décaisser</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
