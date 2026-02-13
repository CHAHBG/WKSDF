import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    DocumentArrowDownIcon,
    ClipboardDocumentListIcon,
    BanknotesIcon,
    CalendarDaysIcon,
    ArrowPathIcon,
    ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const formatCurrency = (val) => new Intl.NumberFormat('fr-FR').format(Math.round(val || 0)) + ' F';

export default function Reports() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const getDataUrl = (url) => {
        return new Promise((resolve) => {
            if (!url) { resolve(null); return; }
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = url;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg'));
            };
            img.onerror = () => resolve(null);
        });
    };

    const generateInventoryReport = async () => {
        setLoading(true);
        try {
            const { data: products, error } = await supabase
                .from('v_inventory_with_avoir')
                .select('*')
                .order('name');

            if (error) throw error;

            const doc = new jsPDF();
            const shopName = user?.shop_settings?.shop_name || 'Wakeur Sokhna';

            // Header
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.text(shopName, 14, 20);
            doc.setFontSize(14);
            doc.text('Inventaire Global & Valorisation', 14, 30);
            doc.setFontSize(10);
            doc.text(`Généré le: ${new Date().toLocaleDateString()}`, 196, 30, { align: 'right' });

            const tableData = products.map(p => [
                p.name,
                (p.quantity || 0).toString(),
                formatCurrency(p.unit_price),
                formatCurrency((p.quantity || 0) * (p.unit_price || 0))
            ]);

            autoTable(doc, {
                startY: 50,
                head: [['Produit', 'Quantité', 'Prix Unitaire', 'Valeur Stock']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] },
                columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } }
            });

            doc.save(`Inventaire_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const generateMobileMoneyReport = async () => {
        setLoading(true);
        try {
            const { data: transactions, error } = await supabase
                .from('mm_transactions')
                .select('*, mm_platforms(name)')
                .gte('transaction_date', dateRange.start)
                .lte('transaction_date', `${dateRange.end}T23:59:59`)
                .order('transaction_date', { ascending: false });

            if (error) throw error;

            const doc = new jsPDF();
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.text('Wakeur Sokhna', 14, 20);
            doc.setFontSize(14);
            doc.text('Rapport Mobile Money', 14, 30);
            doc.setFontSize(10);
            doc.text(`${dateRange.start} au ${dateRange.end}`, 196, 30, { align: 'right' });

            const tableRows = transactions.map(t => [
                new Date(t.transaction_date).toLocaleDateString(),
                t.mm_platforms?.name || 'MM',
                t.type === 'encaissement' ? 'Dépôt' : 'Retrait',
                formatCurrency(t.amount),
                formatCurrency(t.fees || 0)
            ]);

            autoTable(doc, {
                startY: 50,
                head: [['Date', 'Opérateur', 'Type', 'Montant', 'Commissions']],
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] },
                columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } }
            });

            doc.save(`Rapport_MM_${dateRange.start}.pdf`);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Rapports & Archives</h1>
                    <p className="mt-2 text-slate-500 font-medium">Téléchargez des rapports PDF professionnels pour votre comptabilité.</p>
                </div>
            </div>

            {/* Date Picker Section */}
            <div className="premium-card p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col md:flex-row items-end gap-6">
                    <div className="flex-1 space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Période du Rapport</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <CalendarDaysIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                                <input
                                    type="date"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-black text-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                />
                            </div>
                            <div className="relative">
                                <CalendarDaysIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                                <input
                                    type="date"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-black text-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                {/* Inventory */}
                <div className="premium-card group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all overflow-hidden">
                    <div className="p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                        <div className="h-16 w-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform duration-500">
                            <ClipboardDocumentListIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Inventaire & Stock</h3>
                        <p className="mt-2 text-slate-500 font-medium leading-relaxed">Générez un état des lieux complet de vos produits, quantités en stock et valeur marchande totale.</p>
                    </div>
                    <div className="p-6">
                        <button
                            onClick={generateInventoryReport}
                            disabled={loading}
                            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all text-xs uppercase tracking-[0.2em]"
                        >
                            {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <ArrowDownTrayIcon className="w-5 h-5" />}
                            Exporter au Format PDF
                        </button>
                    </div>
                </div>

                {/* Mobile Money */}
                <div className="premium-card group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all overflow-hidden">
                    <div className="p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                        <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform duration-500">
                            <BanknotesIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Rapport Mobile Money</h3>
                        <p className="mt-2 text-slate-500 font-medium leading-relaxed">Historique détaillé des transactions digitales, commissions perçues et flux entre opérateurs sélectionnés.</p>
                    </div>
                    <div className="p-6">
                        <button
                            onClick={generateMobileMoneyReport}
                            disabled={loading}
                            className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all text-xs uppercase tracking-[0.2em]"
                        >
                            {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <ArrowDownTrayIcon className="w-5 h-5" />}
                            Générer l&apos;Analyse MM
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
