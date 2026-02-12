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

    const chartTextColor = isDark ? '#d2d9e6' : '#475569';
    const chartGridColor = isDark ? 'rgba(134, 148, 174, 0.24)' : 'rgba(148, 163, 184, 0.25)';
    const chartBorderColor = isDark ? '#9fb0cb' : '#607690';
    const categoryPalette = useMemo(() => (
        isDark
            ? ['rgba(122, 145, 186, 0.68)', 'rgba(167, 154, 123, 0.68)', 'rgba(137, 168, 152, 0.68)', 'rgba(165, 129, 134, 0.68)', 'rgba(140, 132, 176, 0.68)', 'rgba(126, 149, 141, 0.68)']
            : ['rgba(90, 112, 145, 0.62)', 'rgba(141, 131, 102, 0.62)', 'rgba(92, 133, 123, 0.62)', 'rgba(141, 103, 108, 0.62)', 'rgba(112, 102, 145, 0.62)', 'rgba(115, 135, 126, 0.62)']
    ), [isDark]);

    const salesTrendData = useMemo(() => ({
        labels: salesTrend.labels,
        datasets: [
            {
                label: 'Ventes (CFA)',
                data: salesTrend.values,
                borderColor: chartBorderColor,
                backgroundColor: isDark ? 'rgba(123, 141, 178, 0.24)' : 'rgba(100, 121, 150, 0.2)',
                fill: true,
                tension: 0.35,
                pointRadius: 3.5,
                pointHoverRadius: 5,
                pointBackgroundColor: isDark ? '#d6e1f5' : '#4f637f',
                pointBorderWidth: 0,
            },
        ],
    }), [salesTrend, chartBorderColor, isDark]);

    const categoryData = useMemo(() => ({
        labels: categoryBreakdown.labels,
        datasets: [
            {
                label: 'Valeur par catégorie (CFA)',
                data: categoryBreakdown.values,
                backgroundColor: categoryBreakdown.labels.map((_, index) => categoryPalette[index % categoryPalette.length]),
                borderColor: isDark ? '#1f2432' : '#f3f5f9',
                borderWidth: 2,
                hoverOffset: 8,
            },
        ],
    }), [categoryBreakdown, categoryPalette, isDark]);

    const monthlySalesData = useMemo(() => ({
        labels: monthlySales.labels,
        datasets: [
            {
                label: 'Ventes mensuelles (CFA)',
                data: monthlySales.values,
                backgroundColor: isDark ? 'rgba(126, 143, 174, 0.62)' : 'rgba(102, 120, 149, 0.55)',
                borderColor: chartBorderColor,
                borderWidth: 1.2,
                borderRadius: 8,
                borderSkipped: false,
                maxBarThickness: 38,
            },
        ],
    }), [monthlySales, chartBorderColor, isDark]);

    const cartesianChartOptions = useMemo(() => ({
        maintainAspectRatio: false,
        responsive: true,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: isDark ? '#111625' : '#1f2937',
                titleColor: '#f8fafc',
                bodyColor: '#f8fafc',
                padding: 10,
                callbacks: {
                    label: (context) => {
                        const value = context.parsed.y ?? context.parsed ?? 0;
                        return `${formatAmount(value)} CFA`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: {
                    color: 'transparent',
                    drawBorder: false,
                },
                ticks: {
                    color: chartTextColor,
                    maxRotation: 0,
                    minRotation: 0,
                    font: {
                        size: 11,
                        weight: 500,
                    },
                },
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: chartGridColor,
                    drawBorder: false,
                },
                ticks: {
                    color: chartTextColor,
                    callback: (value) => formatAmount(value),
                    font: {
                        size: 11,
                    },
                },
            },
        },
    }), [chartGridColor, chartTextColor, isDark]);

    const doughnutOptions = useMemo(() => ({
        maintainAspectRatio: false,
        responsive: true,
        cutout: '58%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: chartTextColor,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    boxWidth: 10,
                    boxHeight: 10,
                    padding: 16,
                    font: {
                        size: 12,
                        weight: 500,
                    },
                },
            },
            tooltip: {
                backgroundColor: isDark ? '#111625' : '#1f2937',
                titleColor: '#f8fafc',
                bodyColor: '#f8fafc',
                padding: 10,
                callbacks: {
                    label: (context) => `${context.label}: ${formatAmount(context.parsed)} CFA`,
                },
            },
        },
    }), [chartTextColor, isDark]);

    const hasSalesTrendData = salesTrend.values.some((value) => value > 0);
    const hasCategoryData = categoryBreakdown.values.some((value) => value > 0);
    const hasMonthlySalesData = monthlySales.values.some((value) => value > 0);

    const metricCards = [
        {
            key: 'revenue',
            label: 'Revenu total',
            value: formatCurrency(stats.totalRevenue),
            meta: `${stats.totalTransactions} transaction${stats.totalTransactions > 1 ? 's' : ''}`,
            tone: 'slate',
            icon: <BanknotesIcon className="h-5 w-5" />,
        },
        {
            key: 'today',
            label: 'Ventes du jour',
            value: formatCurrency(stats.todaySales),
            meta: `Semaine : ${formatCurrency(stats.thisWeekSales)}`,
            tone: 'green',
            icon: <ShoppingCartIcon className="h-5 w-5" />,
        },
        {
            key: 'stockValue',
            label: 'Valeur du stock',
            value: formatCurrency(stats.totalStockValue),
            meta: `${stats.totalProducts} produit${stats.totalProducts > 1 ? 's' : ''} en stock`,
            tone: 'violet',
            icon: <CubeIcon className="h-5 w-5" />,
        },
        {
            key: 'alerts',
            label: 'Alertes stock',
            value: `${stats.lowStock}`,
            meta: stats.lowStock > 0 ? 'Attention requise' : 'Aucune alerte',
            tone: stats.lowStock > 0 ? 'red' : 'green',
            icon: <ExclamationTriangleIcon className="h-5 w-5" />,
        },
    ];

    return (
        <div className="space-y-8">
            <section className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{shopName}</p>
                    <h1 className="mt-1 text-3xl font-bold text-slate-900">Vue d&apos;ensemble financière</h1>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                    {lastUpdated ? `Mise à jour : ${lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : 'Chargement...'}
                </div>
            </section>

            <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                {metricCards.map((card) => (
                    <article key={card.key} className={`metric-card metric-card--${card.tone}`}>
                        <div className="metric-card__head">
                            <p className="metric-card__label">{card.label}</p>
                            <span className="metric-card__icon">{card.icon}</span>
                        </div>
                        <p className="metric-card__value">{card.value}</p>
                        <p className="metric-card__meta">{card.meta}</p>
                    </article>
                ))}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <article className="chart-card">
                    <div className="chart-card__header">
                        <h2 className="chart-card__title">Tendance des ventes</h2>
                        <p className="chart-card__subtitle">7 derniers jours</p>
                    </div>
                    <div className="chart-card__canvas">
                        {!isLoading && hasSalesTrendData ? (
                            <Line data={salesTrendData} options={cartesianChartOptions} />
                        ) : (
                            <div className="chart-placeholder">Pas encore de ventes sur cette période.</div>
                        )}
                    </div>
                </article>

                <article className="chart-card">
                    <div className="chart-card__header">
                        <h2 className="chart-card__title">Répartition par catégorie</h2>
                        <p className="chart-card__subtitle">Valorisation actuelle du stock</p>
                    </div>
                    <div className="chart-card__canvas">
                        {!isLoading && hasCategoryData ? (
                            <Doughnut data={categoryData} options={doughnutOptions} />
                        ) : (
                            <div className="chart-placeholder">Aucune donnée de stock à afficher.</div>
                        )}
                    </div>
                </article>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <article className="chart-card">
                    <div className="chart-card__header">
                        <h2 className="chart-card__title">Ventes mensuelles</h2>
                        <p className="chart-card__subtitle">6 derniers mois</p>
                    </div>
                    <div className="chart-card__canvas">
                        {!isLoading && hasMonthlySalesData ? (
                            <Bar data={monthlySalesData} options={cartesianChartOptions} />
                        ) : (
                            <div className="chart-placeholder">Aucune vente mensuelle enregistrée.</div>
                        )}
                    </div>
                </article>

                <article className="chart-card">
                    <div className="chart-card__header">
                        <h2 className="chart-card__title">Alertes stock faible</h2>
                        <p className="chart-card__subtitle">{stats.lowStock} produit{stats.lowStock > 1 ? 's' : ''} concerné{stats.lowStock > 1 ? 's' : ''}</p>
                    </div>
                    {lowStockProducts.length > 0 ? (
                        <div className="space-y-3">
                            {lowStockProducts.map((product) => (
                                <div key={product.id} className="stock-alert-row">
                                    <div>
                                        <p className="font-semibold text-slate-900">{product.name}</p>
                                        <p className="text-sm text-slate-500">{product.category_name || 'Sans catégorie'}</p>
                                    </div>
                                    <div className="stock-alert-row__count">
                                        {formatAmount(product.quantity)}
                                        <span>en stock</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="chart-placeholder">Aucune alerte de stock faible.</div>
                    )}
                </article>
            </section>

            <section className="chart-card">
                <div className="chart-card__header">
                    <h2 className="chart-card__title">Top 5 produits vendus</h2>
                    <p className="chart-card__subtitle">Classement par chiffre d&apos;affaires</p>
                </div>
                {topProducts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="border-b border-slate-200 text-left">
                                <tr className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                    <th className="px-4 py-3">Rang</th>
                                    <th className="px-4 py-3">Produit</th>
                                    <th className="px-4 py-3">Quantité vendue</th>
                                    <th className="px-4 py-3">Revenu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.map((product, index) => (
                                    <tr key={`${product.name}-${index}`} className="border-b border-slate-100 last:border-b-0">
                                        <td className="px-4 py-3">
                                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{product.name}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{formatAmount(product.quantity)}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-800">{formatCurrency(product.revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="chart-placeholder">Aucune vente enregistrée pour le moment.</div>
                )}
            </section>
        </div>
    );
}
