import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
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

    const generateInventoryReport = async () => {
        setLoading(true);
        try {
            const { data: products } = await supabase.from('v_inventory_with_avoir').select('*').order('name');
            const doc = new jsPDF();
            const shopName = user?.shop_settings?.shop_name || 'Wakeur Sokhna';

            doc.setFillColor(24, 24, 27); // zinc-900
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.text(shopName.toUpperCase(), 14, 22);
            doc.setFontSize(12);
            doc.text('INVENTAIRE ET VALORISATION DES STOCKS', 14, 32);

            const tableData = products.map(p => [p.name, p.quantity || 0, formatCurrency(p.unit_price), formatCurrency((p.quantity || 0) * (p.unit_price || 0))]);
            autoTable(doc, {
                startY: 50,
                head: [['Produit', 'Quantité', 'Prix Unitaire', 'Valeur Stock']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [39, 39, 42] }, // zinc-800
                columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } }
            });
            doc.save(`Inventaire_${new Date().toISOString().split('T')[0]}.pdf`);
        } finally { setLoading(false); }
    };

    const generateMobileMoneyReport = async () => {
        setLoading(true);
        try {
            const { data: transactions } = await supabase.from('mm_transactions').select('*, mm_platforms(name)').gte('transaction_date', dateRange.start).lte('transaction_date', `${dateRange.end}T23:59:59`).order('transaction_date', { ascending: false });
            const doc = new jsPDF();
            doc.setFillColor(24, 24, 27); // zinc-900
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.text('RAPPORT D\'OPÉRATIONS', 14, 22);
            doc.setFontSize(12);
            doc.text(`MOBILE MONEY : ${dateRange.start} AU ${dateRange.end}`, 14, 32);

            const tableRows = transactions.map(t => [new Date(t.transaction_date).toLocaleDateString(), t.mm_platforms?.name || 'N/A', t.operation_type, formatCurrency(t.amount)]);
            autoTable(doc, {
                startY: 50,
                head: [['Date', 'Opérateur', 'Type', 'Montant']],
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: [39, 39, 42] }, // zinc-800
                columnStyles: { 3: { halign: 'right' } }
            });
            doc.save(`Rapport_MM_${dateRange.start}.pdf`);
        } finally { setLoading(false); }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Rapports & Archives</h1>
                    <p className="mt-1 text-zinc-500 text-sm">Génération de documents PDF pour la comptabilité.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="space-y-1.5 max-w-sm">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Période d&apos;analyse</label>
                    <div className="flex gap-4">
                        <input type="date" className="input-premium !text-sm" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                        <input type="date" className="input-premium !text-sm" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:border-zinc-300 transition-colors">
                    <div className="p-10 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="h-12 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-900 dark:text-white mb-6">
                            <ClipboardDocumentListIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Inventaire & Stock</h3>
                        <p className="mt-2 text-zinc-500 text-sm leading-relaxed">État des lieux complet des produits et valorisation marchande.</p>
                    </div>
                    <div className="p-6">
                        <button onClick={generateInventoryReport} disabled={loading} className="btn-vibrant w-full !py-4 !text-[10px] !uppercase !tracking-[0.2em] shadow-lg">
                            {loading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ArrowDownTrayIcon className="w-4 h-4" />}
                            Exporter Inventaire
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:border-zinc-300 transition-colors">
                    <div className="p-10 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="h-12 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-900 dark:text-white mb-6">
                            <BanknotesIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Mobile Money</h3>
                        <p className="mt-2 text-zinc-500 text-sm leading-relaxed">Analyse des flux digitaux sur la période sélectionnée.</p>
                    </div>
                    <div className="p-6">
                        <button onClick={generateMobileMoneyReport} disabled={loading} className="btn-vibrant w-full !py-4 !text-[10px] !uppercase !tracking-[0.2em] shadow-lg">
                            {loading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ArrowDownTrayIcon className="w-4 h-4" />}
                            Exporter Rapport MM
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
