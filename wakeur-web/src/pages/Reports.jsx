import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    ClipboardDocumentListIcon,
    BanknotesIcon,
    ArrowPathIcon,
    ArrowDownTrayIcon,
    CalendarIcon
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

            // Modern Header
            doc.setFillColor(15, 23, 42); // slate-900
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.text(shopName.toUpperCase(), 14, 20);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text('INVENTAIRE ET VALORISATION DES STOCKS', 14, 28);
            doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 34);

            const tableData = products.map(p => [p.name, p.quantity || 0, formatCurrency(p.unit_price), formatCurrency((p.quantity || 0) * (p.unit_price || 0))]);
            autoTable(doc, {
                startY: 50,
                head: [['Produit', 'Quantité', 'Prix Unitaire', 'Valeur Stock']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: {
                    0: { fontStyle: 'bold' },
                    1: { halign: 'center' },
                    2: { halign: 'right' },
                    3: { halign: 'right', fontStyle: 'bold' }
                },
                styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 }
            });
            doc.save(`Inventaire_${new Date().toISOString().split('T')[0]}.pdf`);
        } finally { setLoading(false); }
    };

    const generateMobileMoneyReport = async () => {
        setLoading(true);
        try {
            const { data: transactions } = await supabase.from('mm_transactions').select('*, mm_platforms(name)').gte('transaction_date', dateRange.start).lte('transaction_date', `${dateRange.end}T23:59:59`).order('transaction_date', { ascending: false });
            const doc = new jsPDF();
            const shopName = user?.shop_settings?.shop_name || 'Wakeur Sokhna';

            // Modern Header
            doc.setFillColor(15, 23, 42); // slate-900
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.text(shopName.toUpperCase(), 14, 20);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text('RAPPORT OPÉRATIONS MOBILE MONEY', 14, 28);
            doc.text(`Période: ${new Date(dateRange.start).toLocaleDateString()} au ${new Date(dateRange.end).toLocaleDateString()}`, 14, 34);


            const tableRows = transactions.map(t => [new Date(t.transaction_date).toLocaleDateString(), t.mm_platforms?.name || 'N/A', t.operation_type, formatCurrency(t.amount)]);
            autoTable(doc, {
                startY: 50,
                head: [['Date', 'Opérateur', 'Type', 'Montant']],
                body: tableRows,
                theme: 'grid',
                headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
                styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 }
            });
            doc.save(`Rapport_MM_${dateRange.start}.pdf`);
        } finally { setLoading(false); }
    };

    return (
        <div className="space-y-8 animate-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-serif-display font-bold text-[var(--text-main)]">Rapports & Archives</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Exportation de documents et analyses.</p>
                </div>
            </div>

            <div className="card-modern p-6 max-w-lg">
                <div className="flex items-center gap-2 mb-4">
                    <CalendarIcon className="w-5 h-5 text-[var(--primary)]" />
                    <h3 className="text-sm font-bold text-[var(--text-main)]">Période d'analyse</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[var(--text-muted)]">Du</label>
                        <input
                            type="date"
                            className="input-modern w-full"
                            value={dateRange.start}
                            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[var(--text-muted)]">Au</label>
                        <input
                            type="date"
                            className="input-modern w-full"
                            value={dateRange.end}
                            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-modern p-0 overflow-hidden flex flex-col group hover:shadow-lg transition-shadow">
                    <div className="p-6 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--primary)] mb-4 group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                            <ClipboardDocumentListIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">Inventaire & Stock</h3>
                        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                            Générez un état complet de vos stocks actuels avec valorisation marchande. Utile pour les points de fin de mois.
                        </p>
                    </div>
                    <div className="p-4 bg-[var(--bg-subtle)] border-t border-[var(--border)]">
                        <button onClick={generateInventoryReport} disabled={loading} className="btn-secondary w-full justify-center">
                            {loading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ArrowDownTrayIcon className="w-4 h-4" />}
                            Exporter en PDF
                        </button>
                    </div>
                </div>

                <div className="card-modern p-0 overflow-hidden flex flex-col group hover:shadow-lg transition-shadow">
                    <div className="p-6 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--success)] mb-4 group-hover:bg-[var(--success)] group-hover:text-white transition-colors">
                            <BanknotesIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">Flux Mobile Money</h3>
                        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                            Exportez le journal détaillé des transactions (dépôts/retraits) sur la période sélectionnée pour réconciliation.
                        </p>
                    </div>
                    <div className="p-4 bg-[var(--bg-subtle)] border-t border-[var(--border)]">
                        <button onClick={generateMobileMoneyReport} disabled={loading} className="btn-secondary w-full justify-center hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200">
                            {loading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ArrowDownTrayIcon className="w-4 h-4" />}
                            Exporter en PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
