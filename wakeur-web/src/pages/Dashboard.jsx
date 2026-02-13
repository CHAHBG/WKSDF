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
    ArrowUpIcon,
    ArrowDownIcon
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

const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR');

const toNumber = (value) => Number(value) || 0;
const formatAmount = (value = 0) => NUMBER_FORMATTER.format(Math.round(toNumber(value)));
const formatCurrency = (value = 0) => `${formatAmount(value)} CFA`;

const isValidDate = (value) => {
    if (!value) return false;
    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime());
};

export default function Dashboard() {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const [stats, setStats] = useState({
        totalProducts: 0,
        lowStock: 0,
        totalRevenue: 0,
        todaySales: 0,
        thisWeekSales: 0,
        totalTransactions: 0,
        averageOrderValue: 0,
        totalStockValue: 0,
    });
    const [categoryBreakdown, setCategoryBreakdown] = useState({ labels: [], values: [] });
    const [salesTrend, setSalesTrend] = useState({ labels: [], values: [] });
    const [monthlySales, setMonthlySales] = useState({ labels: [], values: [] });
    const [topProducts, setTopProducts] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [shopName, setShopName] = useState('Wakeur Sokhna');
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchShopSettings = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('shop_settings')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            if (data) {
                setShopName(data.shop_name || 'Wakeur Sokhna');
            }
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres boutique :', error);
        }
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const [productsRes, salesRes, saleItemsRes] = await Promise.all([
                supabase.from('v_inventory_with_avoir').select('*'),
                supabase.from('sales').select('*'),
                supabase.from('sale_items').select('*'),
            ]);

            if (productsRes.error) throw productsRes.error;
            if (salesRes.error) throw salesRes.error;

            const products = productsRes.data || [];
            const sales = salesRes.data || [];
            const saleItems = saleItemsRes.error ? [] : (saleItemsRes.data || []);

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

            const totalProducts = products.length;
            const lowStock = products.filter((p) => {
                const threshold = p.min_stock_level ? toNumber(p.min_stock_level) : 5;
                return toNumber(p.quantity) <= threshold;
            }).length;
            const totalStockValue = products.reduce((sum, p) => sum + toNumber(p.quantity) * toNumber(p.unit_price), 0);
            const totalRevenue = sales.reduce((sum, sale) => sum + toNumber(sale.amount), 0);

            const todaySales = sales
                .filter((sale) => isValidDate(sale.created_at) && new Date(sale.created_at) >= today)
                .reduce((sum, sale) => sum + toNumber(sale.amount), 0);

            const thisWeekSales = sales
                .filter((sale) => isValidDate(sale.created_at) && new Date(sale.created_at) >= weekAgo)
                .reduce((sum, sale) => sum + toNumber(sale.amount), 0);

            setStats({
                totalProducts,
                lowStock,
                totalRevenue,
                todaySales,
                thisWeekSales,
                totalTransactions: sales.length,
                averageOrderValue: sales.length > 0 ? totalRevenue / sales.length : 0,
                totalStockValue,
            });

            const categoryMap = {};
            products.forEach((product) => {
                const category = product.category_name || 'Sans catégorie';
                if (!categoryMap[category]) {
                    categoryMap[category] = 0;
                }
                categoryMap[category] += toNumber(product.quantity) * toNumber(product.unit_price);
            });

            setCategoryBreakdown({
                labels: Object.keys(categoryMap),
                values: Object.values(categoryMap),
            });

            const last7Days = [];
            const salesByDay = {};

            for (let i = 6; i >= 0; i -= 1) {
                const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
                const dateKey = date.toISOString().split('T')[0];
                last7Days.push(dateKey);
                salesByDay[dateKey] = 0;
            }

            sales.forEach((sale) => {
                if (!isValidDate(sale.created_at)) return;
                const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
                if (Object.prototype.hasOwnProperty.call(salesByDay, saleDate)) {
                    salesByDay[saleDate] += toNumber(sale.amount);
                }
            });

            setSalesTrend({
                labels: last7Days.map((d) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })),
                values: last7Days.map((d) => salesByDay[d]),
            });

            const productSalesMap = {};
            saleItems.forEach((item) => {
                if (!item.product_id) return;
                if (!productSalesMap[item.product_id]) {
                    productSalesMap[item.product_id] = { revenue: 0, quantity: 0 };
                }
                productSalesMap[item.product_id].revenue += toNumber(item.total_price);
                productSalesMap[item.product_id].quantity += toNumber(item.quantity);
            });

            const topSelling = Object.entries(productSalesMap)
                .map(([productId, productStats]) => {
                    const product = products.find((p) => String(p.id) === String(productId));
                    return {
                        name: product?.name || 'Produit inconnu',
                        ...productStats,
                    };
                })
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);

            setTopProducts(topSelling);

            const lowStockItems = products
                .filter((p) => {
                    const threshold = p.min_stock_level ? toNumber(p.min_stock_level) : 5;
                    return toNumber(p.quantity) <= threshold;
                })
                .sort((a, b) => toNumber(a.quantity) - toNumber(b.quantity))
                .slice(0, 5);
            setLowStockProducts(lowStockItems);

            const monthsData = [];
            const monthLabels = [];

            for (let i = 5; i >= 0; i -= 1) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
                const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

                const monthSalesValue = sales
                    .filter((sale) => {
                        if (!isValidDate(sale.created_at)) return false;
                        const saleDate = new Date(sale.created_at);
                        return saleDate >= monthStart && saleDate <= monthEnd;
                    })
                    .reduce((sum, sale) => sum + toNumber(sale.amount), 0);

                monthsData.push(monthSalesValue);
                monthLabels.push(date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }));
            }

            setMonthlySales({
                labels: monthLabels,
                values: monthsData,
            });
        } catch (error) {
            console.error('Erreur lors du chargement du tableau de bord :', error);
        }
    }, []);

    const loadDashboardData = useCallback(async () => {
        setIsLoading(true);
        await Promise.all([fetchData(), fetchShopSettings()]);
        setLastUpdated(new Date());
        setIsLoading(false);
    }, [fetchData, fetchShopSettings]);

    useEffect(() => {
        if (!user) return;
        loadDashboardData();
    }, [user, loadDashboardData]);

    const chartTextColor = isDark ? '#94a3b8' : '#64748b';
    const chartGridColor = isDark ? '#1e293b' : '#f1f5f9';
    const primaryColor = '#4f46e5';

    const categoryPalette = useMemo(() => ([
        'rgba(79, 70, 229, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)'
    ]), []);

    const salesTrendData = useMemo(() => ({
        labels: salesTrend.labels,
        datasets: [
            {
                label: 'Ventes (CFA)',
                data: salesTrend.values,
                borderColor: primaryColor,
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: primaryColor,
                pointBorderWidth: 2,
                pointBorderColor: '#fff',
            },
        ],
    }), [salesTrend]);

    const categoryData = useMemo(() => ({
        labels: categoryBreakdown.labels,
        datasets: [
            {
                data: categoryBreakdown.values,
                backgroundColor: categoryPalette,
                borderColor: isDark ? '#0f172a' : '#fff',
                borderWidth: 4,
                hoverOffset: 15,
            },
        ],
    }), [categoryBreakdown, categoryPalette, isDark]);

    const monthlySalesData = useMemo(() => ({
        labels: monthlySales.labels,
        datasets: [
            {
                label: 'Ventes mensuelles (CFA)',
                data: monthlySales.values,
                backgroundColor: 'rgba(79, 70, 229, 0.8)',
                borderRadius: 8,
                maxBarThickness: 32,
            },
        ],
    }), [monthlySales]);

    const cartesianChartOptions = useMemo(() => ({
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: isDark ? '#1e293b' : '#fff',
                titleColor: isDark ? '#f8fafc' : '#0f172a',
                bodyColor: isDark ? '#94a3b8' : '#64748b',
                padding: 12,
                borderColor: isDark ? '#334155' : '#e2e8f0',
                borderWidth: 1,
                displayColors: false,
                callbacks: {
                    label: (context) => `${formatAmount(context.parsed.y)} CFA`,
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: chartTextColor, font: { size: 11, weight: '600' } },
            },
            y: {
                beginAtZero: true,
                grid: { color: chartGridColor },
                ticks: {
                    color: chartTextColor,
                    font: { size: 10 },
                    callback: (value) => formatAmount(value)
                },
            },
        },
    }), [chartGridColor, chartTextColor, isDark]);

    const doughnutOptions = useMemo(() => ({
        maintainAspectRatio: false,
        responsive: true,
        cutout: '75%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: chartTextColor,
                    usePointStyle: true,
                    padding: 20,
                    font: { size: 12, weight: '600' },
                },
            },
            tooltip: {
                backgroundColor: isDark ? '#1e293b' : '#fff',
                titleColor: isDark ? '#f8fafc' : '#0f172a',
                bodyColor: isDark ? '#94a3b8' : '#64748b',
                padding: 12,
                borderColor: isDark ? '#334155' : '#e2e8f0',
                borderWidth: 1,
                callbacks: {
                    label: (context) => `${context.label}: ${formatAmount(context.parsed)} CFA`,
                },
            },
        },
    }), [chartTextColor, isDark]);

    const metricCards = [
        {
            key: 'revenue',
            label: 'Revenu Total',
            value: formatCurrency(stats.totalRevenue),
            meta: `${stats.totalTransactions} transactions`,
            trend: '+12%',
            trendUp: true,
            icon: <BanknotesIcon className="h-6 w-6" />,
            color: 'indigo'
        },
        {
            key: 'today',
            label: 'Ventes du Jour',
            value: formatCurrency(stats.todaySales),
            meta: `Semaine: ${formatCurrency(stats.thisWeekSales)}`,
            trend: '+5%',
            trendUp: true,
            icon: <ShoppingCartIcon className="h-6 w-6" />,
            color: 'emerald'
        },
        {
            key: 'stockValue',
            label: 'Valeur du Stock',
            value: formatCurrency(stats.totalStockValue),
            meta: `${stats.totalProducts} produits en stock`,
            icon: <CubeIcon className="h-6 w-6" />,
            color: 'amber'
        },
        {
            key: 'alerts',
            label: 'Alertes Stock',
            value: `${stats.lowStock}`,
            meta: stats.lowStock > 0 ? 'Rupture imminente' : 'Stock optimal',
            trend: stats.lowStock > 0 ? '-3%' : '0%',
            trendUp: stats.lowStock === 0,
            icon: <ExclamationTriangleIcon className="h-6 w-6" />,
            color: stats.lowStock > 0 ? 'rose' : 'emerald'
        },
    ];

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
                    <p className="mt-2 text-slate-500 font-medium">Suivez l&apos;activité de <span className="text-indigo-600 dark:text-indigo-400 font-bold">{shopName}</span> en temps réel.</p>
                </div>
                {lastUpdated && (
                    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                        Mis à jour à {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {metricCards.map((card) => (
                    <div key={card.key} className="metric-card-new group h-full flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-${card.color}-50 dark:bg-${card.color}-500/10 text-${card.color}-600 dark:text-${card.color}-400 group-hover:scale-110 transition-transform duration-300`}>
                                {card.icon}
                            </div>
                            {card.trend && (
                                <div className={`flex items-center gap-1 text-xs font-black ${card.trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {card.trendUp ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                                    {card.trend}
                                </div>
                            )}
                        </div>
                        <div className="mt-6">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-500 transition-colors uppercase">{card.label}</h3>
                            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white truncate">{card.value}</p>
                            <p className="mt-1 text-xs font-bold text-slate-400 dark:text-slate-500">{card.meta}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
                {/* Sales Chart */}
                <div className="xl:col-span-2 premium-card p-8 bg-white dark:bg-slate-900">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Performance des Ventes</h2>
                            <p className="text-sm font-bold text-slate-400">Analyse des 7 derniers jours</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="h-2 w-2 rounded-full bg-indigo-600"></div>
                        </div>
                    </div>
                    <div className="h-[320px] w-full">
                        {!isLoading && salesTrend.values.length > 0 ? (
                            <Line data={salesTrendData} options={cartesianChartOptions} />
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                Aucune donnée disponible
                            </div>
                        )}
                    </div>
                </div>

                {/* Category Doughnut */}
                <div className="premium-card p-8 bg-white dark:bg-slate-900 flex flex-col">
                    <div className="mb-8">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Stock par Catégorie</h2>
                        <p className="text-sm font-bold text-slate-400">Valeur totale répartie</p>
                    </div>
                    <div className="relative flex-1 min-h-[300px]">
                        {!isLoading && categoryBreakdown.values.length > 0 ? (
                            <Doughnut data={categoryData} options={doughnutOptions} />
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                Pas de stock
                            </div>
                        )}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center pt-8">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(stats.totalStockValue).split(' ')[0]}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Lists */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Top Products */}
                <div className="premium-card flex flex-col bg-white dark:bg-slate-900">
                    <div className="border-b border-slate-100 dark:border-slate-800 p-8">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Top 5 Produits</h2>
                        <p className="text-sm font-bold text-slate-400">Meilleures performances</p>
                    </div>
                    <div className="p-4 flex-1">
                        {topProducts.length > 0 ? (
                            <div className="space-y-2">
                                {topProducts.map((p, i) => (
                                    <div key={i} className="flex items-center gap-4 rounded-xl p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 font-black text-sm">
                                            #{i + 1}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{p.name}</p>
                                            <p className="text-xs font-bold text-slate-400">{formatAmount(p.quantity)} vendus</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(p.revenue)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center font-bold text-slate-300">Aucune vente enregistrée</div>
                        )}
                    </div>
                </div>

                {/* Stock Alerts */}
                <div className="premium-card flex flex-col bg-white dark:bg-slate-900">
                    <div className="border-b border-slate-100 dark:border-slate-800 p-8">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Alertes de Stock</h2>
                        <p className="text-sm font-bold text-slate-400">Rapprovisionnement nécessaire</p>
                    </div>
                    <div className="p-4 flex-1">
                        {lowStockProducts.length > 0 ? (
                            <div className="space-y-2">
                                {lowStockProducts.map((p, i) => (
                                    <div key={i} className="flex items-center gap-4 rounded-xl p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600">
                                            <ExclamationTriangleIcon className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{p.name}</p>
                                            <p className="text-xs font-bold text-slate-400">{p.category_name || 'Sans catégorie'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-rose-600">{p.quantity} <span className="text-[10px] font-bold text-slate-400 uppercase">restant</span></p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center font-bold text-emerald-400">Stock optimal</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

