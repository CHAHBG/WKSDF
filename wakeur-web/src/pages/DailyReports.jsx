import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    DocumentChartBarIcon,
    CalendarIcon,
    BanknotesIcon,
    PlusIcon,
    XMarkIcon,
    DevicePhoneMobileIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    CheckCircleIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (val) => new Intl.NumberFormat('fr-FR').format(Math.round(val || 0)) + ' F';

const DenominationInput = ({ label, value, onChange }) => (
    <div className="group flex flex-col items-center">
        <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 text-center uppercase tracking-widest">{label} F</label>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            className="input-premium !text-center !py-2.5 !px-2 font-bold"
            placeholder="0"
            min="0"
        />
    </div>
);

const MobileMoneyInput = ({ label, value, onChange }) => (
    <div className="group">
        <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-widest px-1">{label}</label>
        <input
            type="number"
            className="input-premium font-bold"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
    </div>
);

export default function DailyReports() {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [agents, setAgents] = useState([]);

    const [newReport, setNewReport] = useState({
        agent_id: '',
        report_date: new Date().toISOString().split('T')[0],
        cash_denominations: { b10000: 0, b5000: 0, b2000: 0, b1000: 0, b500: 0, c500: 0, c250: 0, c200: 0, c100: 0, c50: 0 },
        mobile_money_balances: { orange_money: 0, wave: 0, wizall: 0, kpay: 0 },
        notes: ''
    });

    useEffect(() => {
        if (user) { fetchReports(); fetchAgents(); }
    }, [user]);

    const fetchAgents = async () => {
        const { data } = await supabase.from('agents').select('*').order('name');
        setAgents(data || []);
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const { data } = await supabase.from('daily_closing_reports').select('*, agents (name, code)').order('report_date', { ascending: false });
            setReports(data || []);
        } finally { setLoading(false); }
    };

    const calculateCashTotal = (denoms) => Object.entries(denoms).reduce((sum, [key, count]) => sum + (parseInt(key.replace(/[bc]/, '')) || 0) * (parseInt(count) || 0), 0);
    const calculateMobileMoneyTotal = (bals) => Object.values(bals).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        const physicalCash = calculateCashTotal(newReport.cash_denominations);
        const mmTotal = calculateMobileMoneyTotal(newReport.mobile_money_balances);
        await supabase.from('daily_closing_reports').insert([{ agent_id: newReport.agent_id, report_date: newReport.report_date, physical_cash: physicalCash, theoretical_cash: physicalCash + mmTotal, discrepancy: 0, status: 'submitted', cash_denominations: newReport.cash_denominations, mobile_money_balances: newReport.mobile_money_balances, notes: newReport.notes }]);
        setShowModal(false);
        fetchReports();
    };

    const generatePDF = (report) => {
        const doc = new jsPDF();
        doc.setFillColor(24, 24, 27); // zinc-900
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text("RAPPORT DE CLÔTURE", 14, 22);
        doc.setFontSize(12);
        doc.text(`DATE : ${new Date(report.report_date).toLocaleDateString()}`, 14, 32);

        autoTable(doc, {
            startY: 50,
            head: [['Détail', 'Valeur']],
            body: [['Agent', report.agents?.name || 'N/A'], ['Total Espèces', formatCurrency(report.physical_cash)], ['Total Digital', formatCurrency(report.theoretical_cash - report.physical_cash)], ['SOLDE GLOBAL', formatCurrency(report.theoretical_cash)]],
            theme: 'striped',
            headStyles: { fillColor: [39, 39, 42] }
        });
        doc.save(`Rapport_${report.report_date}.pdf`);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Clôtures Journalières</h1>
                    <p className="mt-1 text-zinc-500 text-sm">Contrôle des balances et inventaire physique de fin de session.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-vibrant !text-xs !uppercase !tracking-widest">
                    <PlusIcon className="w-4 h-4" /> Nouvelle Clôture
                </button>
            </div>

            <div className="table-container">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="table-header">
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Agent</th>
                            <th className="px-6 py-4 text-right">Espèces</th>
                            <th className="px-6 py-4 text-right">Total Global</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-zinc-400 italic">Chargement...</td></tr>
                        ) : reports.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-zinc-400 italic">Aucune clôture enregistrée.</td></tr>
                        ) : (
                            reports.map((r) => (
                                <tr key={r.id} className="table-row">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-zinc-500 text-xs">
                                            <CalendarIcon className="w-3.5 h-3.5" />
                                            <span>{new Date(r.report_date).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-200 text-[10px] uppercase tracking-widest">{r.agents?.name}</td>
                                    <td className="px-6 py-4 text-right font-bold text-zinc-900 dark:text-white">{formatCurrency(r.physical_cash)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-zinc-900 dark:text-white">{formatCurrency(r.theoretical_cash)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => setSelectedReport(r)} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                            <EyeIcon className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
                    <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-xl shadow-premium border border-zinc-200 dark:border-zinc-800 p-10 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Inventaire de Clôture</h2>
                            <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-950"><XMarkIcon className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSubmitReport} className="space-y-8 overflow-y-auto pr-2">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Agent Référent</label>
                                    <select required className="input-premium" value={newReport.agent_id} onChange={e => setNewReport({ ...newReport, agent_id: e.target.value })}>
                                        <option value="">Sélectionner...</option>
                                        {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Date</label>
                                    <input type="date" required className="input-premium" value={newReport.report_date} onChange={e => setNewReport({ ...newReport, report_date: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">Inventaire Espèces</h3>
                                <div className="grid grid-cols-5 gap-4">
                                    {Object.keys(newReport.cash_denominations).map(k => (
                                        <DenominationInput key={k} label={k.replace(/[bc]/, '')} value={newReport.cash_denominations[k]} onChange={v => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, [k]: v } })} />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">Soldes Portefeuilles</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    {Object.keys(newReport.mobile_money_balances).map(k => (
                                        <MobileMoneyInput key={k} label={k.replace('_', ' ')} value={newReport.mobile_money_balances[k]} onChange={v => setNewReport({ ...newReport, mobile_money_balances: { ...newReport.mobile_money_balances, [k]: v } })} />
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mb-1">Total Global</p>
                                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">{formatCurrency(calculateCashTotal(newReport.cash_denominations) + calculateMobileMoneyTotal(newReport.mobile_money_balances))}</p>
                                </div>
                                <button type="submit" className="btn-vibrant !py-4 !px-10">Valider la clôture</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-premium border border-zinc-200 dark:border-zinc-800 p-10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Détails Clôture</h3>
                            <button onClick={() => setSelectedReport(null)} className="text-zinc-400 hover:text-zinc-950"><XMarkIcon className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-center">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Caisse</p>
                                    <p className="font-bold text-zinc-900 dark:text-white">{formatCurrency(selectedReport.physical_cash)}</p>
                                </div>
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-center">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Digital</p>
                                    <p className="font-bold text-zinc-900 dark:text-white">{formatCurrency(selectedReport.theoretical_cash - selectedReport.physical_cash)}</p>
                                </div>
                            </div>
                            <button onClick={() => generatePDF(selectedReport)} className="btn-vibrant w-full !py-4">Exporter en PDF</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
