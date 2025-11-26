import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
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
    ArcElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

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

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalProducts: 0,
        lowStock: 0,
        totalRevenue: 0,
        todaySales: 0,
        thisWeekSales: 0,
        totalTransactions: 0,
        averageOrderValue: 0,
        totalStockValue: 0
    });
    const [categoryData, setCategoryData] = useState(null);
    const [salesTrendData, setSalesTrendData] = useState(null);
    const [monthlySalesData, setMonthlySalesData] = useState(null);
    const [topProducts, setTopProducts] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [productsRes, salesRes] = await Promise.all([
                supabase.from('v_inventory_with_avoir').select('*'),
                supabase.from('sales').select('*')
            ]);

            const products = productsRes.data || [];
            const sales = salesRes.data || [];

            // Calculate Stats
            const totalProducts = products.length;
            const lowStock = products.filter(p => p.quantity <= (p.alert_threshold || 5)).length;
            const totalStockValue = products.reduce((sum, p) => sum + (p.quantity * p.unit_price), 0);

            // Sales Statistics
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

            const totalRevenue = sales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
            const todaySales = sales.filter(s => new Date(s.created_at) >= today)
                .reduce((sum, sale) => sum + (sale.amount || 0), 0);
            const thisWeekSales = sales.filter(s => new Date(s.created_at) >= weekAgo)
                .reduce((sum, sale) => sum + (sale.amount || 0), 0);

            setStats({
                totalProducts,
                lowStock,
                totalRevenue,
                todaySales,
                thisWeekSales,
                totalTransactions: sales.length,
                averageOrderValue: sales.length > 0 ? totalRevenue / sales.length : 0,
                totalStockValue
            });

            // Category Distribution
            const catMap = {};
            products.forEach(item => {
                const cat = item.category_name || 'Autre';
                if (!catMap[cat]) catMap[cat] = 0;
                catMap[cat] += (item.quantity * item.unit_price);
            });

            const categoryLabels = Object.keys(catMap);
            const categoryValues = Object.values(catMap);

            setCategoryData({
                labels: categoryLabels,
                datasets: [{
                    label: 'Valeur par Catégorie (CFA)',
                    data: categoryValues,
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 159, 64, 0.6)',
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 206, 86, 1)',
                    ],
                    borderWidth: 1,
                }],
            });

            // Sales Trend (Last 7 Days)
            const last7Days = [];
            const salesByDay = {};

            for (let i = 6; i >= 0; i--) {
                const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
                const dateStr = date.toISOString().split('T')[0];
                last7Days.push(dateStr);
                salesByDay[dateStr] = 0;
            }

            sales.forEach(sale => {
                const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
                if (salesByDay.hasOwnProperty(saleDate)) {
                    salesByDay[saleDate] += sale.amount || 0;
                }
            });

            setSalesTrendData({
                labels: last7Days.map(d => new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })),
                datasets: [{
                    label: 'Ventes (CFA)',
                    data: last7Days.map(d => salesByDay[d]),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.3
                }]
            });

            // Top Selling Products
            const productSalesMap = {};
            sales.forEach(sale => {
                if (sale.product_id) {
                    if (!productSalesMap[sale.product_id]) {
                        productSalesMap[sale.product_id] = { revenue: 0, quantity: 0 };
                    }
                    productSalesMap[sale.product_id].revenue += sale.amount || 0;
                    productSalesMap[sale.product_id].quantity += sale.quantity || 0;
                }
            });

            const topSelling = Object.entries(productSalesMap)
                .map(([productId, stats]) => {
                    const product = products.find(p => p.id === parseInt(productId));
                    return {
                        name: product?.name || 'Produit inconnu',
                        ...stats
                    };
                })
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);

            setTopProducts(topSelling);

            // Low Stock Products
            const lowStockItems = products
                .filter(p => p.quantity <= (p.alert_threshold || 5))
                .sort((a, b) => a.quantity - b.quantity)
                .slice(0, 5);
            setLowStockProducts(lowStockItems);

            // Monthly Sales Trend (Last 6 Months)
            const monthsData = [];
            const monthLabels = [];

            for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
                const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

                const monthSales = sales
                    .filter(s => {
                        const saleDate = new Date(s.created_at);
                        return saleDate >= monthStart && saleDate <= monthEnd;
                    })
                    .reduce((sum, sale) => sum + (sale.amount || 0), 0);

                monthsData.push(monthSales);
                monthLabels.push(date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }));
            }

            setMonthlySalesData({
                labels: monthLabels,
                datasets: [{
                    label: 'Ventes Mensuelles (CFA)',
                    data: monthsData,
                    backgroundColor: 'rgba(99, 102, 241, 0.5)',
                    borderColor: 'rgb(99, 102, 241)',
                    borderWidth: 2
                }]
            });

        } catch (error) {
            console.error("Error loading dashboard data", error);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Tableau de Bord</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg text-white">
                    <h3 className="text-sm font-medium opacity-90">Revenu Total</h3>
                    <p className="text-3xl font-bold mt-2">{stats.totalRevenue.toLocaleString()} CFA</p>
                    <p className="text-xs mt-1 opacity-75">{stats.totalTransactions} transactions</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white">
                    <h3 className="text-sm font-medium opacity-90">Ventes Aujourd'hui</h3>
                    <p className="text-3xl font-bold mt-2">{stats.todaySales.toLocaleString()} CFA</p>
                    <p className="text-xs mt-1 opacity-75">Cette semaine: {stats.thisWeekSales.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow-lg text-white">
                    <h3 className="text-sm font-medium opacity-90">Valeur Stock</h3>
                    <p className="text-3xl font-bold mt-2">{stats.totalStockValue.toLocaleString()} CFA</p>
                    <p className="text-xs mt-1 opacity-75">{stats.totalProducts} produits</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg shadow-lg text-white">
                    <h3 className="text-sm font-medium opacity-90">Alertes Stock</h3>
                    <p className="text-3xl font-bold mt-2">{stats.lowStock}</p>
                    <p className="text-xs mt-1 opacity-75">Produits en rupture</p>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Tendance des Ventes (7 jours)</h2>
                    {salesTrendData ? (
                        <div className="h-64">
                            <Line data={salesTrendData} options={{
                                maintainAspectRatio: false,
                                responsive: true,
                                plugins: {
                                    legend: { display: false }
                                }
                            }} />
                        </div>
                    ) : (
                        <p>Chargement...</p>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Distribution par Catégorie</h2>
                    {categoryData ? (
                        <div className="h-64 flex justify-center">
                            <Doughnut data={categoryData} options={{
                                maintainAspectRatio: false,
                                responsive: true
                            }} />
                        </div>
                    ) : (
                        <p>Chargement...</p>
                    )}
                </div>
            </div>

            {/* Charts Row 2 - Monthly Sales & Low Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Monthly Sales Trend */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Ventes Mensuelles (6 Derniers Mois)</h2>
                    {monthlySalesData ? (
                        <div className="h-64">
                            <Bar data={monthlySalesData} options={{
                                maintainAspectRatio: false,
                                responsive: true,
                                plugins: {
                                    legend: { display: false }
                                }
                            }} />
                        </div>
                    ) : (
                        <p>Chargement...</p>
                    )}
                </div>

                {/* Low Stock Alert */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Alertes Stock Faible</h2>
                    {lowStockProducts.length > 0 ? (
                        <div className="space-y-3">
                            {lowStockProducts.map((product, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                        <p className="text-sm text-gray-600">{product.category_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-red-600">{product.quantity}</p>
                                        <p className="text-xs text-gray-500">en stock</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">Aucune alerte de stock faible</p>
                    )}
                </div>
            </div>

            {/* Top Products Table */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Top 5 Produits Vendus</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rang</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité Vendue</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenu</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {topProducts.map((product, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {product.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {product.quantity}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                        {product.revenue.toLocaleString()} CFA
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {topProducts.length === 0 && (
                        <p className="text-center text-gray-500 py-8">Aucune vente enregistrée</p>
                    )}
                </div>
            </div>
        </div>
    );
}
