import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    CalendarIcon,
    PlusIcon,
    XMarkIcon,
    EyeIcon,
    BanknotesIcon,
    ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (val) => new Intl.NumberFormat('fr-FR').format(Math.round(val || 0)) + ' F';

const DenominationInput = ({ label, value, onChange }) => (
    <div className="flex flex-col items-center p-3 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border)]">
        <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 text-center uppercase tracking-wider">{label} F</label>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            className="input-modern !text-center !py-1 !px-1 font-bold w-full bg-[var(--bg-app)]"
            placeholder="0"
            min="0"
        />
    </div>
);

const MobileMoneyInput = ({ label, value, onChange }) => (
    <div className="group">
        <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">{label}</label>
        <div className="relative">
            <input
                type="number"
                className="input-modern font-bold pl-8 w-full"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            />
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <BanknotesIcon className="w-4 h-4" />
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
            const { data } = await supabase
                .from('daily_closing_reports')
                .select('*, agents (name, code)')
                .order('report_date', { ascending: false });
            setReports(data || []);
        } finally { setLoading(false); }
    };

    const calculateCashTotal = (denoms) => Object.entries(denoms).reduce((sum, [key, count]) => sum + (parseInt(key.replace(/[bc]/, '')) || 0) * (parseInt(count) || 0), 0);
    const calculateMobileMoneyTotal = (bals) => Object.values(bals).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        const physicalCash = calculateCashTotal(newReport.cash_denominations);
        const mmTotal = calculateMobileMoneyTotal(newReport.mobile_money_balances);

        await supabase.from('daily_closing_reports').insert([{
            agent_id: newReport.agent_id,
            report_date: newReport.report_date,
            physical_cash: physicalCash,
            theoretical_cash: physicalCash + mmTotal, // Note: Logic seems to imply 'theoretical_cash' stores total assets here. 
            discrepancy: 0,
            status: 'submitted',
            cash_denominations: newReport.cash_denominations,
            mobile_money_balances: newReport.mobile_money_balances,
            notes: newReport.notes
        }]);

        setShowModal(false);
        fetchReports();
    };

    const generatePDF = (report) => {
        const doc = new jsPDF();
        // Modern Header
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text("RAPPORT DE CLÔTURE", 14, 20);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Date: ${new Date(report.report_date).toLocaleDateString()}`, 14, 28);
        doc.text(`Agent: ${report.agents?.name || 'N/A'}`, 14, 34);

        autoTable(doc, {
            startY: 50,
            head: [['Détail', 'Valeur']],
            body: [
                ['Agent', report.agents?.name || 'N/A'],
                ['Total Espèces', formatCurrency(report.physical_cash)],
                ['Total Digital', formatCurrency(report.theoretical_cash - report.physical_cash)],
                ['SOLDE GLOBAL', formatCurrency(report.theoretical_cash)]
            ],
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
        });
        doc.save(`Rapport_Cloture_${report.report_date}.pdf`);
    };

    return (
        <div className="space-y-8 animate-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-serif-display font-bold text-[var(--text-main)]">Clôtures Journalières</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Contrôle des balances et inventaire physique.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary text-xs flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> Nouvelle Clôture
                </button>
            </div>

            <div className="card-modern overflow-hidden">
                <div className="p-5 border-b border-[var(--border)] bg-[var(--bg-card)]">
                    <h3 className="font-bold text-[var(--text-main)]">Historique des Clôtures</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="table-modern w-full">
                        <thead>
                            <tr>
                                <th className="pl-6">Date</th>
                                <th>Agent</th>
                                <th className="text-right">Espèces</th>
                                <th className="text-right">Total Global</th>
                                <th className="pr-6 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-[var(--text-muted)] italic">Chargement...</td></tr>
                            ) : reports.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-[var(--text-muted)] italic">Aucune clôture enregistrée.</td></tr>
                            ) : (
                                reports.map((r) => (
                                    <tr key={r.id} className="group hover:bg-[var(--bg-subtle)] transition-colors">
                                        <td className="pl-6 py-4 text-sm text-[var(--text-muted)]">
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon className="w-4 h-4" />
                                                <span>{new Date(r.report_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <span className="px-2.5 py-1 rounded-md bg-[var(--bg-subtle)] text-xs font-medium text-[var(--text-main)] border border-[var(--border)]">
                                                {r.agents?.name}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right font-medium text-[var(--text-main)]">{formatCurrency(r.physical_cash)}</td>
                                        <td className="py-4 text-right font-bold text-[var(--primary)]">{formatCurrency(r.theoretical_cash)}</td>
                                        <td className="pr-6 py-4 text-center">
                                            <button
                                                onClick={() => setSelectedReport(r)}
                                                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New Report Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-4xl bg-[var(--bg-card)] rounded-xl shadow-2xl p-0 border border-[var(--border)] animate-enter flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-subtle)]">
                            <h2 className="text-lg font-bold text-[var(--text-main)] font-serif-display">Inventaire de Clôture</h2>
                            <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]"><XMarkIcon className="w-5 h-5" /></button>
                        </div>

                        <div className="overflow-y-auto p-8 bg-[var(--bg-app)]">
                            <form id="closing-form" onSubmit={handleSubmitReport} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-[var(--text-main)]">Agent Référent</label>
                                        <select
                                            required
                                            className="input-modern w-full"
                                            value={newReport.agent_id}
                                            onChange={e => setNewReport({ ...newReport, agent_id: e.target.value })}
                                        >
                                            <option value="">Sélectionner...</option>
                                            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-[var(--text-main)]">Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="input-modern w-full"
                                            value={newReport.report_date}
                                            onChange={e => setNewReport({ ...newReport, report_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Inventaire Espèces</h3>
                                        <div className="flex-1"></div>
                                        <span className="text-xs font-bold text-[var(--text-main)] bg-[var(--bg-subtle)] px-2 py-1 rounded">
                                            {formatCurrency(calculateCashTotal(newReport.cash_denominations))}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        {Object.keys(newReport.cash_denominations).map(k => (
                                            <DenominationInput
                                                key={k}
                                                label={k.replace(/[bc]/, '')}
                                                value={newReport.cash_denominations[k]}
                                                onChange={v => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, [k]: v } })}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Soldes Portefeuilles</h3>
                                        <div className="flex-1"></div>
                                        <span className="text-xs font-bold text-[var(--text-main)] bg-[var(--bg-subtle)] px-2 py-1 rounded">
                                            {formatCurrency(calculateMobileMoneyTotal(newReport.mobile_money_balances))}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {Object.keys(newReport.mobile_money_balances).map(k => (
                                            <MobileMoneyInput
                                                key={k}
                                                label={k.replace('_', ' ')}
                                                value={newReport.mobile_money_balances[k]}
                                                onChange={v => setNewReport({ ...newReport, mobile_money_balances: { ...newReport.mobile_money_balances, [k]: v } })}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-[var(--border)] bg-[var(--bg-card)] flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider mb-1">Total Global Estimé</p>
                                <p className="text-2xl font-bold text-[var(--text-main)] font-serif-display">
                                    {formatCurrency(calculateCashTotal(newReport.cash_denominations) + calculateMobileMoneyTotal(newReport.mobile_money_balances))}
                                </p>
                            </div>
                            <button type="submit" form="closing-form" className="btn-primary px-8 py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                                Valider la Clôture
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Report Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-[var(--bg-card)] rounded-xl shadow-2xl p-8 border border-[var(--border)] animate-enter">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-[var(--text-main)] font-serif-display">Détails Clôture</h3>
                                <p className="text-sm text-[var(--text-muted)] mt-1">{new Date(selectedReport.report_date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-[var(--bg-subtle)] rounded-xl text-center border border-[var(--border)]">
                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Caisse Physique</p>
                                    <p className="font-bold text-xl text-[var(--text-main)]">{formatCurrency(selectedReport.physical_cash)}</p>
                                </div>
                                <div className="p-4 bg-[var(--bg-subtle)] rounded-xl text-center border border-[var(--border)]">
                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Digital</p>
                                    <p className="font-bold text-xl text-[var(--text-main)]">{formatCurrency(selectedReport.theoretical_cash - selectedReport.physical_cash)}</p>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-app)] flex justify-between items-center">
                                <span className="font-medium text-[var(--text-main)]">Total Global</span>
                                <span className="font-bold text-xl text-[var(--primary)]">{formatCurrency(selectedReport.theoretical_cash)}</span>

                            </div>

                            <button onClick={() => generatePDF(selectedReport)} className="btn-secondary w-full justify-center py-3">
                                <ArrowDownTrayIcon className="w-5 h-5" />
                                Exporter en PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
