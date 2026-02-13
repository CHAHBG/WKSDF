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

const DenominationInput = ({ label, value, onChange, imageFile, isCoin }) => (
    <div className="group flex flex-col items-center">
        {imageFile && (
            <div className={`relative mb-3 transition-all duration-500 transform group-hover:scale-110 group-active:scale-95 ${isCoin ? 'w-16 h-16 rounded-full' : 'w-full h-16 rounded-xl'} overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm group-hover:border-indigo-400 group-hover:shadow-lg group-hover:shadow-indigo-500/20`}>
                <img
                    src={`/images/money/${imageFile}`}
                    alt={`${label} FCFA`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=CFA'; }}
                />
            </div>
        )}
        <label className="block text-[10px] font-black text-slate-400 mb-1 text-center uppercase tracking-widest">{label}</label>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-center font-black text-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            placeholder="0"
            min="0"
        />
    </div>
);

const MobileMoneyInput = ({ label, value, onChange, logo }) => (
    <div className="group">
        <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest px-1">{label}</label>
        <div className="relative">
            <input
                type="number"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-black text-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg overflow-hidden bg-white p-1 shadow-sm ring-1 ring-slate-100">
                <img
                    src={`/images/mobile_money/${logo}`}
                    alt={label}
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=MM'; }}
                />
            </div>
        </div>
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
        cash_denominations: {
            b10000: 0, b5000: 0, b2000: 0, b1000: 0, b500: 0,
            c500: 0, c250: 0, c200: 0, c100: 0, c50: 0, c25: 0, c10: 0, c5: 0
        },
        mobile_money_balances: {
            orange_money: 0,
            wave: 0,
            wizall: 0,
            kash_kash: 0,
            post_cash: 0,
            e_money: 0,
            kpay: 0,
            mixx: 0
        },
        notes: ''
    });

    useEffect(() => {
        if (user) {
            fetchReports();
            fetchAgents();
        }
    }, [user]);

    const fetchAgents = async () => {
        try {
            const { data } = await supabase.from('agents').select('*').order('name');
            setAgents(data || []);
        } catch (error) {
            console.error('Error fetching agents:', error);
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('daily_closing_reports')
                .select('*, agents (name, code)')
                .order('report_date', { ascending: false });

            if (error) throw error;
            setReports(data || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateCashTotal = (denominations) => {
        const values = {
            b10000: 10000, b5000: 5000, b2000: 2000, b1000: 1000, b500: 500,
            c500: 500, c250: 250, c200: 200, c100: 100, c50: 50, c25: 25, c10: 10, c5: 5
        };
        return Object.entries(denominations).reduce((sum, [key, count]) => sum + (values[key] || 0) * (parseInt(count) || 0), 0);
    };

    const calculateMobileMoneyTotal = (balances) => Object.values(balances).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        try {
            const physicalCash = calculateCashTotal(newReport.cash_denominations);
            const mobileMoneyTotal = calculateMobileMoneyTotal(newReport.mobile_money_balances);

            const { error } = await supabase.from('daily_closing_reports').insert([{
                agent_id: newReport.agent_id,
                report_date: newReport.report_date,
                physical_cash: physicalCash,
                theoretical_cash: physicalCash + mobileMoneyTotal,
                discrepancy: 0,
                status: 'submitted',
                cash_denominations: newReport.cash_denominations,
                mobile_money_balances: newReport.mobile_money_balances,
                notes: newReport.notes
            }]);

            if (error) throw error;
            setShowModal(false);
            fetchReports();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const generatePDF = (report) => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text("Wakeur Sokhna Business", 105, 15, { align: "center" });
        doc.setFontSize(14);
        doc.text("Rapport de Clôture Journalier", 105, 22, { align: "center" });
        doc.setFontSize(10);
        doc.text(`Date: ${new Date(report.report_date).toLocaleDateString()}`, 105, 30, { align: "center" });

        autoTable(doc, {
            startY: 40,
            head: [['Détail', 'Valeur']],
            body: [
                ['Agent', report.agents?.name || 'N/A'],
                ['Total Espèces', formatCurrency(report.physical_cash)],
                ['Total Digital', formatCurrency(report.theoretical_cash - report.physical_cash)],
                ['SOLDE GLOBAL', formatCurrency(report.theoretical_cash)]
            ],
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229] }
        });

        doc.save(`Rapport_${report.report_date}.pdf`);
    };

    if (loading) return (
        <div className="flex h-96 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
    );

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Rapports de Clôture</h1>
                    <p className="mt-2 text-slate-500 font-medium">Contrôlez les balances de fin de journée et les inventaires de caisse.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 font-bold text-sm"
                >
                    <PlusIcon className="w-5 h-5" />
                    Nouvelle Clôture
                </button>
            </div>

            {/* List */}
            <div className="premium-card overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Historique des Rapports</h3>
                        <p className="text-xs font-medium text-slate-500">Registre chronologique des sessions clôturées.</p>
                    </div>
                    <button onClick={fetchReports} className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-colors">
                        <ArrowPathIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Agent Référent</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Espèces</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Total Global</th>
                                <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {reports.length === 0 ? (
                                <tr><td colSpan="5" className="px-8 py-20 text-center text-slate-400 italic font-medium">Aucun rapport de clôture disponible.</td></tr>
                            ) : (
                                reports.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <CalendarIcon className="w-4 h-4 text-slate-300" />
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">{new Date(r.report_date).toLocaleDateString('fr-FR')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-[10px] ring-1 ring-slate-100 dark:ring-slate-800">
                                                    {r.agents?.name?.charAt(0)}
                                                </div>
                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{r.agents?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right font-black text-slate-900 dark:text-white">
                                            {formatCurrency(r.physical_cash)}
                                        </td>
                                        <td className="px-6 py-5 text-right font-black text-indigo-600 dark:text-indigo-400">
                                            {formatCurrency(r.theoretical_cash)}
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <button
                                                onClick={() => setSelectedReport(r)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border border-slate-100 dark:border-slate-800"
                                            >
                                                <EyeIcon className="w-3.5 h-3.5" />
                                                Détails
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Nouveau Rapport */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-6xl my-8 rounded-[2.5rem] shadow-2xl relative animate-scale-up overflow-hidden">
                        <div className="sticky top-0 bg-slate-900 text-white p-8 px-10 flex justify-between items-center z-10">
                            <div>
                                <h2 className="text-3xl font-black tracking-tight">Nouvelle Clôture de Caisse</h2>
                                <p className="text-slate-400 font-medium">Effectuez l&apos;inventaire physique pour valider la session.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all">
                                <XMarkIcon className="w-8 h-8" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitReport} className="p-10 space-y-12 max-h-[75vh] overflow-y-auto scrollbar-hide">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500">Informations Globales</label>
                                    <div className="space-y-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agent en Service</label>
                                            <select
                                                required
                                                className="w-full px-4 py-4 bg-white dark:bg-slate-900 border-none rounded-2xl font-black text-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none shadow-sm"
                                                value={newReport.agent_id}
                                                onChange={(e) => setNewReport({ ...newReport, agent_id: e.target.value })}
                                            >
                                                <option value="">Sélectionner l&apos;agent...</option>
                                                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date du Rapport</label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full px-4 py-4 bg-white dark:bg-slate-900 border-none rounded-2xl font-black text-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                                                value={newReport.report_date}
                                                onChange={(e) => setNewReport({ ...newReport, report_date: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-6">
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500">Inventaire des Espèces</label>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl">
                                        <DenominationInput label="10.000" imageFile="10000FCFA.jpg" value={newReport.cash_denominations.b10000} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, b10000: v } })} />
                                        <DenominationInput label="5.000" imageFile="5000FCFA.jpg" value={newReport.cash_denominations.b5000} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, b5000: v } })} />
                                        <DenominationInput label="2.000" imageFile="2000FCFA.jpg" value={newReport.cash_denominations.b2000} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, b2000: v } })} />
                                        <DenominationInput label="1.000" imageFile="1000FCFA.jpg" value={newReport.cash_denominations.b1000} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, b1000: v } })} />
                                        <DenominationInput label="500" imageFile="500FCFA.jpg" value={newReport.cash_denominations.b500} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, b500: v } })} />
                                        <DenominationInput isCoin label="500 P" imageFile="500FCFA_piece.jpg" value={newReport.cash_denominations.c500} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, c500: v } })} />
                                        <DenominationInput isCoin label="250 P" imageFile="250FCFA_piece.jpg" value={newReport.cash_denominations.c250} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, c250: v } })} />
                                        <DenominationInput isCoin label="200 P" imageFile="200FCFA_piece.png" value={newReport.cash_denominations.c200} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, c200: v } })} />
                                        <DenominationInput isCoin label="100 P" imageFile="100FCFA_piece.jpg" value={newReport.cash_denominations.c100} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, c100: v } })} />
                                        <DenominationInput isCoin label="50 P" imageFile="50FCFA_piece.jpg" value={newReport.cash_denominations.c50} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, c50: v } })} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500">Soldes Portefeuilles Digitaux</label>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl">
                                    <MobileMoneyInput label="Orange" logo="OM.png" value={newReport.mobile_money_balances.orange_money} onChange={(v) => setNewReport({ ...newReport, mobile_money_balances: { ...newReport.mobile_money_balances, orange_money: v } })} />
                                    <MobileMoneyInput label="Wave" logo="WAVE.png" value={newReport.mobile_money_balances.wave} onChange={(v) => setNewReport({ ...newReport, mobile_money_balances: { ...newReport.mobile_money_balances, wave: v } })} />
                                    <MobileMoneyInput label="Wizall" logo="WIZALL.png" value={newReport.mobile_money_balances.wizall} onChange={(v) => setNewReport({ ...newReport, mobile_money_balances: { ...newReport.mobile_money_balances, wizall: v } })} />
                                    <MobileMoneyInput label="Kpay" logo="KPAY.jpg" value={newReport.mobile_money_balances.kpay} onChange={(v) => setNewReport({ ...newReport, mobile_money_balances: { ...newReport.mobile_money_balances, kpay: v } })} />
                                </div>
                            </div>
                        </form>

                        <div className="p-8 px-10 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Global Calculé</p>
                                <p className="text-4xl font-black text-slate-900 dark:text-white">
                                    {formatCurrency(calculateCashTotal(newReport.cash_denominations) + calculateMobileMoneyTotal(newReport.mobile_money_balances))}
                                </p>
                            </div>
                            <button
                                onClick={handleSubmitReport}
                                className="px-12 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-2xl shadow-indigo-500/30 hover:scale-105 transition-all"
                            >
                                Soumettre le Rapport
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Détails */}
            {selectedReport && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl animate-scale-up overflow-hidden">
                        <div className="p-8 px-10 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Récapitulatif de Séance</h3>
                                <p className="text-sm font-medium text-slate-500">Du {new Date(selectedReport.report_date).toLocaleDateString('fr-FR')}</p>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 shadow-sm">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Caisse Physique</p>
                                    <p className="text-xl font-black text-emerald-900 dark:text-white">{formatCurrency(selectedReport.physical_cash)}</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Total Digital</p>
                                    <p className="text-xl font-black text-indigo-900 dark:text-white">{formatCurrency(selectedReport.theoretical_cash - selectedReport.physical_cash)}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest px-1">Détail des coupures</h4>
                                <div className="grid grid-cols-4 gap-3">
                                    {Object.entries(selectedReport.cash_denominations || {})
                                        .filter(([, v]) => v > 0)
                                        .map(([k, v]) => (
                                            <div key={k} className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl flex flex-col items-center">
                                                <span className="text-[10px] font-black text-slate-400 uppercase">{k.replace('b', '').replace('c', '')} F</span>
                                                <span className="text-sm font-black text-slate-700 dark:text-white">× {v}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 px-10 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-emerald-500 shadow-sm">
                                    <CheckCircleIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut Final</p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Rapport Validé</p>
                                </div>
                            </div>
                            <button
                                onClick={() => generatePDF(selectedReport)}
                                className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                Exporter PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
