import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    DocumentArrowDownIcon,
    ClipboardDocumentListIcon,
    BanknotesIcon
} from '@heroicons/react/24/outline';

export default function Reports() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const formatCurrency = (amount) => {
        return (amount || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " F";
    };

    const getDataUrl = (url) => {
        return new Promise((resolve, reject) => {
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
            // Fetch Inventory Data
            const { data: products, error } = await supabase
                .from('v_inventory_with_avoir')
                .select('*')
                .order('name');

            if (error) throw error;

            const doc = new jsPDF();
            const shopName = user?.shop_settings?.shop_name || 'Wakeur Sokhna';
            const pageWidth = doc.internal.pageSize.width;
            const startXStats = pageWidth - 80; // X position for stats section

            // --- Header Design ---
            // Background Header
            doc.setFillColor(15, 23, 42); // Deep Navy
            doc.rect(0, 0, pageWidth, 40, 'F');

            // Title
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont("helvetica", "bold");
            doc.text(shopName, 14, 20);

            doc.setFontSize(14);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(203, 213, 225); // Slate-300
            doc.text('Catalogue & Inventaire', 14, 30);

            // Date (Right aligned)
            doc.setFontSize(10);
            doc.text(`Généré le: ${new Date().toLocaleDateString()}`, pageWidth - 14, 30, { align: 'right' });

            let y = 50;
            let totalValue = 0;

            // --- Product Cards ---
            for (const product of products) {
                const stockValue = (product.quantity || 0) * (product.unit_price || 0);
                totalValue += stockValue;

                // Check for page break
                if (y > 250) {
                    doc.addPage();
                    y = 20;
                }

                // Card Background
                doc.setFillColor(248, 250, 252); // Slate-50
                doc.setDrawColor(226, 232, 240); // Slate-200
                doc.roundedRect(14, y, pageWidth - 28, 35, 3, 3, 'FD');

                // Image
                if (product.image_url) {
                    try {
                        const imgData = await getDataUrl(product.image_url);
                        if (imgData) {
                            doc.addImage(imgData, 'JPEG', 16, y + 2.5, 30, 30, undefined, 'FAST');
                        }
                    } catch (e) {
                        console.warn('Failed to load image for PDF', e);
                    }
                } else {
                    // Placeholder box if no image
                    doc.setFillColor(226, 232, 240);
                    doc.rect(16, y + 2.5, 30, 30, 'F');
                    doc.setFontSize(8);
                    doc.setTextColor(100, 116, 139);
                    doc.text('No Image', 31, y + 17, { align: 'center' });
                }

                // Product Name & Category
                doc.setFont("helvetica", "bold");
                doc.setFontSize(12);
                doc.setTextColor(15, 23, 42); // Slate-900
                doc.text(product.name, 50, y + 10);

                doc.setTextColor(15, 23, 42);
                doc.text(formatCurrency(product.unit_price), startXStats, y + 15);

                // Quantity
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text('Quantité', startXStats + 35, y + 10);
                doc.setFontSize(10);
                doc.setTextColor(15, 23, 42);
                doc.setFont("helvetica", "bold");
                if (product.quantity <= (product.min_stock_level || 5)) {
                    doc.setTextColor(220, 38, 38); // Red for low stock
                }
                doc.text((product.quantity || 0).toString(), startXStats + 35, y + 15);

                // Total Value
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text('Valeur Stock', startXStats + 60, y + 10);
                doc.setFontSize(10);
                doc.setTextColor(15, 23, 42);
                doc.setFont("helvetica", "bold");
                doc.text(formatCurrency(stockValue), startXStats + 60, y + 15);

                y += 40; // Move to next card position
            }

            // --- Footer Summary ---
            // Check if we need a new page for summary
            if (y > 250) {
                doc.addPage();
                y = 20;
            }

            y += 10;
            doc.setFillColor(15, 23, 42);
            doc.rect(14, y, pageWidth - 28, 20, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text('VALEUR TOTALE DU STOCK', 20, y + 13);

            doc.text(formatCurrency(totalValue), pageWidth - 20, y + 13, { align: 'right' });

            doc.save(`inventaire_${new Date().toISOString().split('T')[0]}.pdf`);

        } catch (error) {
            console.error('Error generating inventory report:', error);
            alert('Erreur: ' + (error.message || error));
        } finally {
            setLoading(false);
        }
    };

    const generateMobileMoneyReport = async () => {
        setLoading(true);
        try {
            // Fetch Mobile Money Data
            const { data: transactions, error } = await supabase
                .from('mm_transactions')
                .select('*, mm_platforms(name)')
                .gte('transaction_date', dateRange.start)
                .lte('transaction_date', `${dateRange.end}T23:59:59`)
                .order('transaction_date', { ascending: false });

            if (error) throw error;

            const doc = new jsPDF();
            const shopName = user?.shop_settings?.shop_name || 'Wakeur Sokhna';

            // Header
            doc.setFontSize(20);
            doc.text(shopName, 14, 22);
            doc.setFontSize(12);
            doc.text('Rapport Mobile Money', 14, 32);
            doc.text(`Période: ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`, 14, 40);

            // Table
            const tableColumn = ["Date", "Opérateur", "Type", "Montant", "Frais", "Statut"];
            const tableRows = [];

            let totalIn = 0;
            let totalOut = 0;
            let totalFees = 0;

            transactions.forEach(t => {
                if (t.type === 'encaissement') totalIn += t.amount;
                if (t.type === 'decaissement') totalOut += t.amount;
                totalFees += t.fees || 0;

                const rowData = [
                    new Date(t.transaction_date).toLocaleDateString(),
                    t.mm_platforms?.name || t.service?.toUpperCase() || '-',
                    t.type === 'encaissement' ? 'Dépôt' : 'Retrait',
                    formatCurrency(t.amount),
                    formatCurrency(t.fees),
                    t.status
                ];
                tableRows.push(rowData);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 50,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [39, 174, 96] }
            });

            // Summary
            const finalY = doc.lastAutoTable.finalY || 50;
            doc.setFontSize(10);
            doc.text('Résumé de la période:', 14, finalY + 15);
            doc.text(`Total Dépôts (Encaissements): ${formatCurrency(totalIn)}`, 14, finalY + 25);
            doc.text(`Total Retraits (Décaissements): ${formatCurrency(totalOut)}`, 14, finalY + 35);
            doc.text(`Total Commissions: ${formatCurrency(totalFees)}`, 14, finalY + 45);

            doc.save(`mobile_money_${dateRange.start}_${dateRange.end}.pdf`);

        } catch (error) {
            console.error('Error generating MM report:', error);
            alert('Erreur: ' + (error.message || error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Rapports & Analyses</h1>
                <p className="text-gray-500 text-lg">Générez des documents PDF professionnels</p>
            </div>

            {/* Date Filter */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Début</label>
                    <input
                        type="date"
                        className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Fin</label>
                    <input
                        type="date"
                        className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                </div>
            </div>

            {/* Report Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inventory Report Card */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                        <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Rapport d'Inventaire</h3>
                    <p className="text-gray-500 mb-6">
                        État actuel du stock, valorisation (avoir) et détails par produit.
                    </p>
                    <button
                        onClick={generateInventoryReport}
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                        ) : (
                            <>
                                <DocumentArrowDownIcon className="w-5 h-5" />
                                Télécharger PDF
                            </>
                        )}
                    </button>
                </div>

                {/* Mobile Money Report Card */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                        <BanknotesIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Rapport Mobile Money</h3>
                    <p className="text-gray-500 mb-6">
                        Historique des transactions, dépôts, retraits et commissions sur la période sélectionnée.
                    </p>
                    <button
                        onClick={generateMobileMoneyReport}
                        disabled={loading}
                        className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                        ) : (
                            <>
                                <DocumentArrowDownIcon className="w-5 h-5" />
                                Télécharger PDF
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
