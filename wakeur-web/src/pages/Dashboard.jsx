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
    ArrowTrendingDownIcon,
    ArrowPathIcon
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
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: isDark ? '#161b22' : '#fff',
                titleColor: isDark ? '#f0f6fc' : '#0f172a',
                bodyColor: isDark ? '#8b949e' : '#64748b',
                borderColor: isDark ? '#30363d' : '#e2e8e8',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 12,
                titleFont: { weight: 'bold' }
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10, weight: 'bold' } } },
            y: { grid: { color: isDark ? '#30363d' : '#f0f9f9', drawBorder: false }, ticks: { color: '#64748b', font: { size: 10, weight: 'bold' } } }
        }
    };

    const trendData = {
        labels: salesTrend.labels,
        datasets: [{
            data: salesTrend.values,
            borderColor: '#0d9488',
            backgroundColor: 'rgba(13, 148, 136, 0.05)',
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: '#0d9488',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 6
        }]
    };

    return (
        <div className="space-y-12 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Vue d&apos;ensemble</h1>
                    <p className="text-zinc-500 font-medium mt-1">Gérez votre activité avec une touche de sérénité.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="btn-ghost"
                >
                    <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualiser
                </button>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                {[
                    { label: 'Revenu Total', value: formatCurrency(stats.totalRevenue), icon: BanknotesIcon, color: 'teal' },
                    { label: 'Ventes du jour', value: formatCurrency(stats.todaySales), icon: ShoppingCartIcon, color: 'emerald' },
                    { label: 'Valeur de stock', value: formatCurrency(stats.totalStockValue), icon: CubeIcon, color: 'orange' },
                    { label: 'Alerte Stock', value: stats.lowStock, icon: ExclamationTriangleIcon, color: stats.lowStock > 0 ? 'rose' : 'teal' },
                ].map((m, i) => (
                    <div key={i} className="metric-card-joy group overflow-hidden relative">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-${m.color}-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110`}></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className={`p-3 rounded-2xl bg-${m.color}-50 dark:bg-${m.color}-900/20 text-${m.color}-600 dark:text-${m.color}-400`}>
                                    <m.icon className="w-6 h-6" />
                                </div>
                                {m.label === 'Ventes du jour' && (
                                    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest">
                                        En direct
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-1">{m.label}</p>
                            <div className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{m.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div className="xl:col-span-2 p-10 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] shadow-xl shadow-teal-900/5">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-xs font-black uppercase tracking-[0.25em] text-teal-600">Performance Commerciale (7j)</h3>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                <ArrowTrendingUpIcon className="w-3 h-3" /> +4.2%
                            </div>
                        </div>
                    </div>
                    <div className="h-80">
                        <Line data={trendData} options={chartOptions} />
                    </div>
                </div>

                <div className="p-10 bg-teal-900 dark:bg-zinc-900 text-white rounded-[2.5rem] shadow-2xl shadow-teal-900/40 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-800 to-teal-950 opacity-90"></div>
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 bg-white/10 rounded-xl">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-orange-400" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-[0.25em] text-teal-100">Alertes Stock</h3>
                            </div>

                            {lowStockProducts.length > 0 ? (
                                <div className="space-y-5">
                                    {lowStockProducts.map((p, i) => (
                                        <div key={i} className="flex items-center justify-between group/item p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-default">
                                            <div className="min-w-0">
                                                <p className="text-sm font-black truncate">{p.name}</p>
                                                <p className="text-[10px] text-teal-300 font-bold uppercase tracking-wider">{p.quantity} en stock</p>
                                            </div>
                                            <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                                                <span className="text-[10px] font-black text-orange-400">!</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                        <CubeIcon className="w-6 h-6 text-teal-200" />
                                    </div>
                                    <p className="text-sm font-bold italic">Tout est en ordre</p>
                                </div>
                            )}
                        </div>
                        <button className="mt-10 w-full py-4 bg-white text-teal-950 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-teal-950/20">
                            Gérer le stock
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 p-10 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem]">
                    <h3 className="text-xs font-black uppercase tracking-[0.25em] text-teal-600 mb-8">Top Ventes Produits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {topProducts.map((p, i) => (
                            <div key={i} className="flex items-center justify-between p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl group hover:bg-teal-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-700 flex items-center justify-center text-teal-600 font-black shadow-sm group-hover:rotate-6 transition-transform">
                                        {i + 1}
                                    </div>
                                    <span className="text-sm font-black text-zinc-900 dark:text-zinc-200">{p.name}</span>
                                </div>
                                <span className="text-sm font-black text-teal-600">{formatCurrency(p.revenue)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-10 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-[2.5rem] flex flex-col items-center justify-center group overflow-hidden relative">
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-orange-200/20 rounded-full transition-transform group-hover:scale-150"></div>
                    <div className="relative z-10 text-center">
                        <div className="text-5xl font-black text-orange-600 mb-3 tracking-tighter">{stats.totalProducts}</div>
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Références Actives</div>
                        <p className="mt-6 text-xs font-bold text-orange-800/60 dark:text-orange-400/60 max-w-[150px]">L&apos;excellence dans la diversité.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
