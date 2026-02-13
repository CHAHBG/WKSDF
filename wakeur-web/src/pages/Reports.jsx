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
        <div className="space-y-12 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Rapports & Archives</h1>
                    <p className="text-zinc-500 font-medium mt-1">Génération de documents PDF pour votre gestion.</p>
                </div>
            </div>

            <div className="premium-card p-10 shadow-2xl shadow-teal-900/5">
                <div className="space-y-2 max-w-sm">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 ml-1">Période d&apos;analyse</label>
                    <div className="flex gap-4">
                        <input type="date" className="input-premium font-bold" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                        <input type="date" className="input-premium font-bold" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="premium-card group hover:border-teal-500/30 transition-all duration-500 shadow-2xl shadow-teal-900/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                    <div className="p-10 border-b border-zinc-100 dark:border-zinc-800 relative z-10">
                        <div className="h-14 w-14 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded-2xl flex items-center justify-center mb-8 font-black border border-teal-100 dark:border-teal-800 group-hover:rotate-6 transition-transform">
                            <ClipboardDocumentListIcon className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Inventaire & Stock</h3>
                        <p className="mt-3 text-zinc-500 font-medium leading-relaxed">État des lieux complet des produits et valorisation marchande en temps réel.</p>
                    </div>
                    <div className="p-8 relative z-10">
                        <button onClick={generateInventoryReport} disabled={loading} className="btn-vibrant w-full !py-5 !text-[10px] !uppercase !tracking-[0.3em]">
                            {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <ArrowDownTrayIcon className="w-5 h-5" />}
                            Exporter l&apos;Inventaire
                        </button>
                    </div>
                </div>

                <div className="premium-card group hover:border-emerald-500/30 transition-all duration-500 shadow-2xl shadow-emerald-900/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                    <div className="p-10 border-b border-zinc-100 dark:border-zinc-800 relative z-10">
                        <div className="h-14 w-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center justify-center mb-8 font-black border border-emerald-100 dark:border-emerald-800 group-hover:rotate-6 transition-transform">
                            <BanknotesIcon className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Mobile Money</h3>
                        <p className="mt-3 text-zinc-500 font-medium leading-relaxed">Analyse détaillée des flux digitaux et transactions financières opérées.</p>
                    </div>
                    <div className="p-8 relative z-10">
                        <button onClick={generateMobileMoneyReport} disabled={loading} className="btn-vibrant w-full !py-5 !text-[10px] !uppercase !tracking-[0.3em] !from-emerald-600 !to-emerald-700 shadow-emerald-600/20">
                            {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <ArrowDownTrayIcon className="w-5 h-5" />}
                            Exporter le Rapport MM
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
