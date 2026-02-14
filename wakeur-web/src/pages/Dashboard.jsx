import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
    BanknotesIcon,
    CubeIcon,
    ExclamationTriangleIcon,
    ShoppingCartIcon,
    ArrowPathIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

const formatCurrency = (val) => new Intl.NumberFormat('fr-FR').format(Math.round(val || 0)) + ' F';

export default function Dashboard() {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const [stats, setStats] = useState({
        totalProducts: 0,
        lowStock: 0,
        totalRevenue: 0,
        todaySales: 0,
        thisWeekSales: 0,
        totalStockValue: 0,
    });
    const [salesTrend, setSalesTrend] = useState({ labels: [], values: [] });
    const [topProducts, setTopProducts] = useState([]);
    const [recentSales, setRecentSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [productsRes, salesRes, saleItemsRes] = await Promise.all([
                supabase.from('products').select('*'),
                supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(50),
                supabase.from('sale_items').select('*'),
            ]);

            const products = productsRes.data || [];
            const sales = salesRes.data || [];
            const saleItems = saleItemsRes.data || [];

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todaySales = sales
                .filter(s => new Date(s.created_at) >= today)
                .reduce((sum, s) => sum + Number(s.amount), 0);

            const totalRevenue = sales.reduce((sum, s) => sum + Number(s.amount), 0);
            const totalStockValue = products.reduce((sum, p) => sum + (Number(p.quantity) * Number(p.unit_price)), 0);
            const lowStockCount = products.filter(p => Number(p.quantity) <= (p.alert_threshold || 5)).length;

            setStats({
                totalProducts: products.length,
                lowStock: lowStockCount,
                totalRevenue,
                todaySales,
                thisWeekSales: 0,
                totalStockValue,
            });

            // Sales Trend (Last 7 Days)
            const last7Days = [...Array(7)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toISOString().split('T')[0];
            }).reverse();

            const trendValues = last7Days.map(date =>
                sales.filter(s => s.created_at.startsWith(date))
                    .reduce((sum, s) => sum + Number(s.amount), 0)
            );

            setSalesTrend({
                labels: last7Days.map(d => new Date(d).toLocaleDateString('fr-FR', { weekday: 'short' })),
                values: trendValues
            });

            // Top Products
            const prodStats = saleItems.reduce((acc, item) => {
                if (!acc[item.product_name]) acc[item.product_name] = 0;
                acc[item.product_name] += Number(item.total_price);
                return acc;
            }, {});

            setTopProducts(
                Object.entries(prodStats)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([name, revenue]) => ({ name, revenue }))
            );

            setRecentSales(sales.slice(0, 5));

        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                titleColor: isDark ? '#f8fafc' : '#0f172a',
                bodyColor: isDark ? '#94a3b8' : '#64748b',
                borderColor: isDark ? '#334155' : '#e2e8f0',
                borderWidth: 1,
                padding: 10,
                displayColors: false,
                callbacks: {
                    label: (ctx) => formatCurrency(ctx.raw)
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 11 } }
            },
            y: {
                grid: { color: isDark ? '#334155' : '#f1f5f9', borderDash: [4, 4] },
                ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 11 }, callback: (val) => val >= 1000 ? val / 1000 + 'k' : val },
                border: { display: false }
            }
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
    };

    const trendData = {
        labels: salesTrend.labels,
        datasets: [{
            data: salesTrend.values,
            borderColor: '#0f172a', // Navy
            backgroundColor: (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(15, 23, 42, 0.1)');
                gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
                return gradient;
            },
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#0f172a',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2,
        }]
    };

    if (isDark) {
        trendData.datasets[0].borderColor = '#38bdf8'; // Sky blue in dark mode
        trendData.datasets[0].pointHoverBackgroundColor = '#38bdf8';
    }

    return (
        <div className="space-y-8 animate-enter">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-serif-display font-bold text-[var(--text-main)]">Vue d'ensemble</h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Activité récente et performances.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="btn-secondary text-xs"
                >
                    <ArrowPathIcon className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualiser
                </button>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Revenu Total', value: formatCurrency(stats.totalRevenue), icon: BanknotesIcon, trend: '+12%', trendUp: true },
                    { label: 'Ventes du jour', value: formatCurrency(stats.todaySales), icon: ShoppingCartIcon, trend: 'En direct', trendUp: true },
                    { label: 'Valeur Stock', value: formatCurrency(stats.totalStockValue), icon: CubeIcon, trend: null },
                    { label: 'Alertes', value: stats.lowStock, icon: ExclamationTriangleIcon, trend: stats.lowStock > 0 ? 'Action requise' : 'Stable', trendUp: stats.lowStock === 0 },
                ].map((m, i) => (
                    <div key={i} className="card-modern p-5 flex flex-col justify-between h-32 relative group">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{m.label}</p>
                                <h3 className="text-2xl font-bold text-[var(--text-main)] mt-1 tracking-tight">{m.value}</h3>
                            </div>
                            <div className="p-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-muted)] group-hover:bg-white group-hover:shadow-sm transition-all">
                                <m.icon className="w-5 h-5" />
                            </div>
                        </div>
                        {m.trend && (
                            <div className={`text-xs font-medium flex items-center gap-1 ${m.trendUp ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                                {m.trendUp ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ExclamationTriangleIcon className="w-3 h-3" />}
                                {m.trend}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Chart Section */}
                <div className="lg:col-span-2 card-modern p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-[var(--text-main)]">Performance des Ventes</h3>
                        <select className="text-xs border border-[var(--border)] rounded-lg px-2 py-1 bg-transparent outline-none">
                            <option>7 derniers jours</option>
                            <option>Ce mois</option>
                        </select>
                    </div>
                    <div className="h-64 w-full">
                        <Line data={trendData} options={chartOptions} />
                    </div>
                </div>

                {/* Top Products / Sidebar Widget */}
                <div className="card-modern p-0 flex flex-col">
                    <div className="p-5 border-b border-[var(--border-subtle)]">
                        <h3 className="font-bold text-[var(--text-main)]">Produits Populaires</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {topProducts.map((p, i) => (
                            <div key={i} className="flex items-center justify-between p-3 hover:bg-[var(--bg-subtle)] rounded-xl transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)] group-hover:bg-white group-hover:shadow-sm">
                                        {i + 1}
                                    </div>
                                    <span className="text-sm font-medium text-[var(--text-main)] truncate max-w-[120px]">{p.name}</span>
                                </div>
                                <span className="text-xs font-bold text-[var(--text-main)]">{formatCurrency(p.revenue)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50">
                        <button className="w-full text-center text-xs font-bold text-[var(--primary)] hover:underline">Voir tout l'inventaire</button>
                    </div>
                </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="card-modern overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                    <h3 className="font-bold text-[var(--text-main)]">Transactions Récentes</h3>
                    <button className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--primary)]">Voir tout</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="table-modern">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Client</th>
                                <th>Montant</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentSales.map((sale) => (
                                <tr key={sale.id}>
                                    <td className="text-[var(--text-muted)]">
                                        {new Date(sale.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="font-medium">{sale.customer_name || 'Client de passage'}</td>
                                    <td className="font-bold tabular-nums">{formatCurrency(sale.amount)}</td>
                                    <td>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                            Complété
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {recentSales.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-[var(--text-muted)] italic">
                                        Aucune transaction récente.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
