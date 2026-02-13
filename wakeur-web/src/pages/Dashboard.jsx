import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
    BanknotesIcon,
    CubeIcon,
    ExclamationTriangleIcon,
    ShoppingCartIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon
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
    ArcElement
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
    const [categoryBreakdown, setCategoryBreakdown] = useState({ labels: [], values: [] });
    const [salesTrend, setSalesTrend] = useState({ labels: [], values: [] });
    const [topProducts, setTopProducts] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [productsRes, salesRes, saleItemsRes] = await Promise.all([
                supabase.from('products').select('*'),
                supabase.from('sales').select('*').order('created_at', { ascending: false }),
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
                thisWeekSales: 0, // Simplified for performance
                totalStockValue,
            });

            // Trend
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

            setLowStockProducts(
                products.filter(p => Number(p.quantity) <= (p.alert_threshold || 5))
                    .sort((a, b) => Number(a.quantity) - Number(b.quantity))
                    .slice(0, 5)
            );

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
        plugins: { legend: { display: false }, tooltip: { backgroundColor: isDark ? '#18181b' : '#fff', titleColor: isDark ? '#fff' : '#18181b', bodyColor: isDark ? '#a1a1aa' : '#71717a', borderColor: isDark ? '#27272a' : '#e4e4e7', borderWidth: 1 } },
        scales: {
            x: { grid: { display: false }, ticks: { color: isDark ? '#71717a' : '#a1a1aa', font: { size: 10 } } },
            y: { grid: { color: isDark ? '#27272a' : '#f4f4f5' }, ticks: { color: isDark ? '#71717a' : '#a1a1aa', font: { size: 10 } } }
        }
    };

    const trendData = {
        labels: salesTrend.labels,
        datasets: [{
            data: salesTrend.values,
            borderColor: isDark ? '#fff' : '#18181b',
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(24,24,27,0.03)',
            fill: true,
            tension: 0.1,
            borderWidth: 2,
            pointRadius: 0
        }]
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Vue d&apos;ensemble</h1>
                    <p className="text-zinc-500 text-sm">Indicateurs clés de performance et suivi opérationnel.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchData} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-950 transition-colors">Rafraîchir</button>
                </div>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                    { label: 'Revenu Total', value: formatCurrency(stats.totalRevenue), icon: BanknotesIcon, color: 'zinc' },
                    { label: 'Ventes du jour', value: formatCurrency(stats.todaySales), icon: ShoppingCartIcon, color: 'emerald' },
                    { label: 'Valeur de stock', value: formatCurrency(stats.totalStockValue), icon: CubeIcon, color: 'zinc' },
                    { label: 'Alerte Stock', value: stats.lowStock, icon: ExclamationTriangleIcon, color: stats.lowStock > 0 ? 'rose' : 'zinc' },
                ].map((m, i) => (
                    <div key={i} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">{m.label}</span>
                            <m.icon className={`w-5 h-5 text-${m.color}-500 opacity-80`} />
                        </div>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{m.value}</div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Flux des revenus (7j)</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                <ArrowTrendingUpIcon className="w-3.5 h-3.5" /> +4.2%
                            </div>
                        </div>
                    </div>
                    <div className="h-64">
                        <Line data={trendData} options={chartOptions} />
                    </div>
                </div>

                <div className="p-8 bg-zinc-900 text-white rounded-xl shadow-xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-6">Alertes Prioritaires</h3>
                        {lowStockProducts.length > 0 ? (
                            <div className="space-y-4">
                                {lowStockProducts.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between group">
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold truncate group-hover:text-zinc-400 transition-colors">{p.name}</p>
                                            <p className="text-[10px] text-zinc-500">{p.quantity} unités restantes</p>
                                        </div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-500 italic">Aucune alerte critique.</p>
                        )}
                    </div>
                    <button className="mt-8 w-full py-3 bg-white text-zinc-950 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors">
                        Voir l&apos;inventaire
                    </button>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-400 mb-6">Top Performance Produits</h3>
                    <div className="space-y-4">
                        {topProducts.map((p, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0 dark:border-zinc-800">
                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-300">{p.name}</span>
                                <span className="text-sm font-bold text-zinc-900 dark:text-white">{formatCurrency(p.revenue)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-3xl font-black text-zinc-900 dark:text-white mb-2">{stats.totalProducts}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Références Actives</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
