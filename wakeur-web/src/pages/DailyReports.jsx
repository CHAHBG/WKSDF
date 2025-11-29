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
    ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DenominationInput = ({ label, value, onChange, imageFile, isCoin }) => (
    <div className="group flex flex-col items-center">
        {imageFile && (
            <div className={`relative mb-2 transition-all duration-300 transform group-hover:scale-105 ${isCoin ? 'w-14 h-14 rounded-full' : 'w-full h-14 rounded-md'} overflow-hidden bg-gray-100 border border-gray-200 group-hover:border-blue-400 shadow-sm`}>
                <img
                    src={`/images/money/${imageFile}`}
                    alt={`${label} FCFA`}
                    className="w-full h-full object-cover"
                />
            </div>
        )}
        <label className="block text-xs font-bold text-gray-500 mb-1 text-center">{label}</label>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-md text-center font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
            placeholder="0"
            min="0"
        />
    </div>
);

const MobileMoneyInput = ({ label, value, onChange, logo }) => (
    <div className="group">
        {logo && (
            <div className="mb-2 w-full h-14 rounded-lg overflow-hidden bg-white border border-gray-200 p-2 flex items-center justify-center group-hover:border-blue-400 transition-all shadow-sm">
                <img
                    src={`/images/mobile_money/${logo}`}
                    alt={label}
                    className="max-h-full max-w-full object-contain"
                />
            </div>
        )}
        <label className="block text-xs font-bold text-gray-500 mb-1 text-center">{label}</label>
        <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-right font-mono font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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

    // New report form state
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
            const { data, error } = await supabase.from('agents').select('*').order('name');
            if (error) throw error;
            setAgents(data || []);
        } catch (error) {
            console.error('Error fetching agents:', error);
        }
    };

    const fetchReports = async () => {
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
        if (!denominations) return 0;
        const values = {
            b10000: 10000, b5000: 5000, b2000: 2000, b1000: 1000, b500: 500,
            c500: 500, c250: 250, c200: 200, c100: 100, c50: 50, c25: 25, c10: 10, c5: 5
        };
        return Object.entries(denominations).reduce((sum, [key, count]) => {
            return sum + (values[key] || 0) * (parseInt(count) || 0);
        }, 0);
    };

    const calculateMobileMoneyTotal = (balances) => {
        if (!balances) return 0;
        return Object.values(balances).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    };

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

            alert('Rapport soumis avec succès!');
            setShowModal(false);
            setNewReport({
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
            fetchReports();
        } catch (error) {
            console.error('Error:', error);
            alert('Erreur: ' + error.message);
        }
    };

    const generatePDF = (report) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text("Rapport de Clôture Journalier", 105, 15, { align: "center" });

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 105, 22, { align: "center" });

        // Info Box
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(14, 30, 182, 25, 3, 3, "FD");

        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);
        doc.text(`Agent: ${report.agents?.name || 'N/A'}`, 20, 40);
        doc.text(`Date du rapport: ${new Date(report.report_date).toLocaleDateString('fr-FR')}`, 20, 48);
        doc.text(`Statut: ${report.status}`, 120, 40);

        // Financial Summary
        const summaryData = [
            ['Espèces Physiques', `${(report.physical_cash || 0).toLocaleString()} FCFA`],
            ['Solde Théorique', `${(report.theoretical_cash || 0).toLocaleString()} FCFA`],
            ['Écart', `${(report.discrepancy || 0).toLocaleString()} FCFA`]
        ];

        autoTable(doc, {
            startY: 60,
            head: [['Désignation', 'Montant']],
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: [66, 133, 244], textColor: 255, fontStyle: 'bold' },
            columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
            styles: { fontSize: 10, cellPadding: 5 }
        });

        // Cash Details
        let finalY = doc.lastAutoTable.finalY + 10;

        if (report.cash_denominations) {
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text("Détail des Espèces", 14, finalY);

            const cashData = Object.entries(report.cash_denominations)
                .filter(([_, v]) => v > 0)
                .map(([k, v]) => {
                    const label = k.startsWith('b') ? 'Billet' : 'Pièce';
                    const value = parseInt(k.substring(1));
                    return [`${label} ${value}`, v, `${(v * value).toLocaleString()} F`];
                });

            if (cashData.length > 0) {
                autoTable(doc, {
                    startY: finalY + 5,
                    head: [['Coupure', 'Quantité', 'Total']],
                    body: cashData,
                    theme: 'striped',
                    headStyles: { fillColor: [46, 125, 50] },
                    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } },
                    styles: { fontSize: 9 }
                });
                finalY = doc.lastAutoTable.finalY + 10;
            }
        }

        // Mobile Money Details
        if (report.mobile_money_balances) {
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text("Soldes Mobile Money", 14, finalY);

            const mmData = Object.entries(report.mobile_money_balances)
                .filter(([_, v]) => v > 0)
                .map(([k, v]) => [k.replace('_', ' ').toUpperCase(), `${v.toLocaleString()} F`]);

            if (mmData.length > 0) {
                autoTable(doc, {
                    startY: finalY + 5,
                    head: [['Opérateur', 'Solde']],
                    body: mmData,
                    theme: 'striped',
                    headStyles: { fillColor: [255, 111, 0] },
                    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
                    styles: { fontSize: 9 }
                });
                finalY = doc.lastAutoTable.finalY + 10;
            }
        }

        // Notes
        if (report.notes) {
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text("Commentaires", 14, finalY);

            doc.setFontSize(10);
            doc.setTextColor(80, 80, 80);
            const splitNotes = doc.splitTextToSize(report.notes, 180);
            doc.text(splitNotes, 14, finalY + 7);
        }

        doc.save(`Rapport_Cloture_${new Date(report.report_date).toISOString().split('T')[0]}.pdf`);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Rapports de Clôture</h1>
                    <p className="text-gray-500 text-lg">Suivi des clôtures de caisse journalières</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex items-center font-medium"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nouveau Rapport
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Agent</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Espèces</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                        <DocumentChartBarIcon className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                                        <p>Aucun rapport trouvé</p>
                                    </td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                    <tr key={report.id} className="group hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                                                {new Date(report.report_date).toLocaleDateString('fr-FR')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm font-bold text-gray-900">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs mr-3 font-bold">
                                                    {report.agents?.name?.charAt(0)}
                                                </div>
                                                {report.agents?.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900 font-mono">
                                            {(report.physical_cash || 0).toLocaleString()} F
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600 font-mono">
                                            {(report.theoretical_cash || 0).toLocaleString()} F
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => setSelectedReport(report)}
                                                className="text-blue-600 hover:text-blue-800 font-semibold text-sm px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                                            >
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

            {/* New Report Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white w-full max-w-5xl my-8 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 rounded-t-xl">
                            <h3 className="text-xl font-bold text-gray-900">Nouveau Rapport de Clôture</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitReport} className="p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Agent</label>
                                    <select
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        value={newReport.agent_id}
                                        onChange={(e) => setNewReport({ ...newReport, agent_id: e.target.value })}
                                    >
                                        <option value="">Sélectionner un agent</option>
                                        {agents.map(agent => (
                                            <option key={agent.id} value={agent.id}>{agent.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        value={newReport.report_date}
                                        onChange={(e) => setNewReport({ ...newReport, report_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Section Espèces */}
                                <div className="space-y-6">
                                    <h4 className="text-lg font-bold text-gray-900 flex items-center border-b pb-2 border-gray-200">
                                        <BanknotesIcon className="w-5 h-5 mr-2 text-green-600" />
                                        Détail des Espèces
                                    </h4>

                                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                        <h5 className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-wider">Billets</h5>
                                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                                            <DenominationInput label="10000" imageFile="10000FCFA.jpg" value={newReport.cash_denominations.b10000} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, b10000: v } })} />
                                            <DenominationInput label="5000" imageFile="5000FCFA.jpg" value={newReport.cash_denominations.b5000} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, b5000: v } })} />
                                            <DenominationInput label="2000" imageFile="2000FCFA.jpg" value={newReport.cash_denominations.b2000} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, b2000: v } })} />
                                            <DenominationInput label="1000" imageFile="1000FCFA.jpg" value={newReport.cash_denominations.b1000} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, b1000: v } })} />
                                            <DenominationInput label="500" imageFile="500FCFA.jpg" value={newReport.cash_denominations.b500} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, b500: v } })} />
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                        <h5 className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-wider">Pièces</h5>
                                        <div className="grid grid-cols-4 sm:grid-cols-4 gap-4 justify-items-center">
                                            <DenominationInput isCoin label="500" imageFile="500FCFA_piece.jpg" value={newReport.cash_denominations.c500} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, c500: v } })} />
                                            <DenominationInput isCoin label="250" imageFile="250FCFA_piece.jpg" value={newReport.cash_denominations.c250} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, c250: v } })} />
                                            <DenominationInput isCoin label="200" imageFile="200FCFA_piece.png" value={newReport.cash_denominations.c200} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, c200: v } })} />
                                            <DenominationInput isCoin label="100" imageFile="100FCFA_piece.jpg" value={newReport.cash_denominations.c100} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, c100: v } })} />
                                            <DenominationInput isCoin label="50" imageFile="50FCFA_piece.jpg" value={newReport.cash_denominations.c50} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, c50: v } })} />
                                            <DenominationInput isCoin label="25" imageFile="25FCFA_piece.jpg" value={newReport.cash_denominations.c25} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, c25: v } })} />
                                            <DenominationInput isCoin label="10" imageFile="10FCFA_piece.jpg" value={newReport.cash_denominations.c10} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, c10: v } })} />
                                            <DenominationInput isCoin label="5" imageFile="5FCFA_piece.png" value={newReport.cash_denominations.c5} onChange={(v) => setNewReport({ ...newReport, cash_denominations: { ...newReport.cash_denominations, c5: v } })} />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex justify-between items-center">
                                        <span className="text-sm font-bold text-green-800 uppercase">Total Espèces</span>
                                        <span className="text-2xl font-bold text-green-900">{calculateCashTotal(newReport.cash_denominations).toLocaleString()} F</span>
                                    </div>
                                </div>

                                {/* Section Mobile Money */}
                                <div className="space-y-6">
                                    <h4 className="text-lg font-bold text-gray-900 flex items-center border-b pb-2 border-gray-200">
                                        <DevicePhoneMobileIcon className="w-5 h-5 mr-2 text-blue-600" />
                                        Soldes Mobile Money
                                    </h4>

                                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 h-fit">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            <MobileMoneyInput label="Orange Money" logo="OM.png" value={newReport.mobile_money_balances.orange_money} onChange={(v) => setNewReport({ ...newReport, mobile_money_balances: { ...newReport.mobile_money_balances, orange_money: v } })} />
                                            <MobileMoneyInput label="Wave" logo="WAVE.png" value={newReport.mobile_money_balances.wave} onChange={(v) => setNewReport({ ...newReport, mobile_money_balances: { ...newReport.mobile_money_balances, wave: v } })} />
                                            <MobileMoneyInput label="Wizall" logo="WIZALL.png" value={newReport.mobile_money_balances.wizall} onChange={(v) => setNewReport({ ...newReport, mobile_money_balances: { ...newReport.mobile_money_balances, wizall: v } })} />
                                            <MobileMoneyInput label="Kash Kash" logo="KASH_KASH.png" value={newReport.mobile_money_balances.kash_kash} onChange={(v) => setNewReport({ ...newReport, mobile_money_balances: { ...newReport.mobile_money_balances, kash_kash: v } })} />
                                            <MobileMoneyInput label="Post Cash" logo="POST_CASH.png" value={newReport.mobile_money_balances.post_cash} onChange={(v) => setNewReport({ ...newReport, mobile_money_balances: { ...newReport.mobile_money_balances, post_cash: v } })} />
                                            <MobileMoneyInput label="E-Money" logo="E_MONEY.png" value={newReport.mobile_money_balances.e_money} onChange={(v) => setNewReport({ ...newReport, mobile_money_balances: { ...newReport.mobile_money_balances, e_money: v } })} />
                                            <MobileMoneyInput label="KPay" logo="KPAY.jpg" value={newReport.mobile_money_balances.kpay} onChange={(v) => setNewReport({ ...newReport, mobile_money_balances: { ...newReport.mobile_money_balances, kpay: v } })} />
                                            <MobileMoneyInput label="Mixx" logo="MIXX_BY_YASS.png" value={newReport.mobile_money_balances.mixx} onChange={(v) => setNewReport({ ...newReport, mobile_money_balances: { ...newReport.mobile_money_balances, mixx: v } })} />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex justify-between items-center">
                                        <span className="text-sm font-bold text-blue-800 uppercase">Total Mobile Money</span>
                                        <span className="text-2xl font-bold text-blue-900">{calculateMobileMoneyTotal(newReport.mobile_money_balances).toLocaleString()} F</span>
                                    </div>

                                    <div className="mt-8 p-6 bg-gray-900 rounded-xl text-white shadow-xl">
                                        <div className="flex flex-col space-y-2">
                                            <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">Total Général</span>
                                            <span className="text-5xl font-bold tracking-tight">{(calculateCashTotal(newReport.cash_denominations) + calculateMobileMoneyTotal(newReport.mobile_money_balances)).toLocaleString()} <span className="text-2xl text-gray-500">F</span></span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Notes (Optionnel)</label>
                                        <textarea
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            rows="3"
                                            value={newReport.notes}
                                            onChange={(e) => setNewReport({ ...newReport, notes: e.target.value })}
                                            placeholder="Observations..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                >
                                    Soumettre le Rapport
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white w-full max-w-2xl my-8 rounded-xl shadow-xl animate-scale-up">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-xl">
                            <h3 className="text-xl font-bold text-gray-900">Détails du Rapport</h3>
                            <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="px-6 py-2 bg-gray-50 border-b border-gray-100 flex justify-end">
                            <button
                                onClick={() => generatePDF(selectedReport)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                Télécharger PDF
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Agent</p>
                                    <p className="text-lg font-bold text-gray-900">{selectedReport.agents?.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Date</p>
                                    <p className="text-lg font-bold text-gray-900">{new Date(selectedReport.report_date).toLocaleDateString('fr-FR')}</p>
                                </div>
                            </div>

                            {/* Cash Denominations */}
                            {selectedReport.cash_denominations && (
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                                    <h4 className="text-sm font-bold text-gray-800 uppercase mb-4 flex items-center gap-2">
                                        <BanknotesIcon className="w-5 h-5 text-gray-500" />
                                        Détail des Espèces
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Billets</p>
                                            <div className="grid grid-cols-5 gap-2">
                                                {Object.entries(selectedReport.cash_denominations)
                                                    .filter(([k, v]) => k.startsWith('b') && v > 0)
                                                    .map(([key, value]) => (
                                                        <div key={key} className="bg-white p-2 rounded border border-gray-200 text-center">
                                                            <p className="text-xs font-bold text-gray-600">{key.substring(1)} F</p>
                                                            <p className="text-sm font-mono text-blue-600">×{value}</p>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Pièces</p>
                                            <div className="grid grid-cols-5 gap-2">
                                                {Object.entries(selectedReport.cash_denominations)
                                                    .filter(([k, v]) => k.startsWith('c') && v > 0)
                                                    .map(([key, value]) => (
                                                        <div key={key} className="bg-white p-2 rounded border border-gray-200 text-center">
                                                            <p className="text-xs font-bold text-gray-600">{key.substring(1)}</p>
                                                            <p className="text-sm font-mono text-blue-600">×{value}</p>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Mobile Money Balances */}
                            {selectedReport.mobile_money_balances && (
                                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                                    <h4 className="text-sm font-bold text-blue-800 uppercase mb-4 flex items-center gap-2">
                                        <DevicePhoneMobileIcon className="w-5 h-5 text-blue-500" />
                                        Soldes Mobile Money
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(selectedReport.mobile_money_balances)
                                            .filter(([_, v]) => v > 0)
                                            .map(([key, value]) => (
                                                <div key={key} className="bg-white p-3 rounded-lg border border-blue-100">
                                                    <p className="text-xs font-bold text-gray-600 mb-1 capitalize">{key.replace('_', ' ')}</p>
                                                    <p className="text-lg font-bold text-blue-700 font-mono">{value.toLocaleString()} F</p>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Summary */}
                            <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-gray-500">Espèces Physiques:</span>
                                        <span className="text-xl font-bold text-gray-900 font-mono">{(selectedReport.physical_cash || 0).toLocaleString()} F</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-gray-500">Solde Théorique:</span>
                                        <span className="text-xl font-bold text-blue-600 font-mono">{(selectedReport.theoretical_cash || 0).toLocaleString()} F</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                        <span className="text-sm font-bold text-gray-500">Écart:</span>
                                        <span className={`text-xl font-bold font-mono ${selectedReport.discrepancy === 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {selectedReport.discrepancy > 0 ? '+' : ''}{(selectedReport.discrepancy || 0).toLocaleString()} F
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-gray-500">Statut:</span>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 capitalize">
                                            {selectedReport.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedReport.notes && (
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                    <h4 className="text-sm font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                                        <DocumentChartBarIcon className="w-5 h-5 text-gray-400" />
                                        Commentaires
                                    </h4>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedReport.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
