import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
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
    const { user } = useAuth();
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
    const [shopName, setShopName] = useState('Wakeur Sokhna');

    useEffect(() => {
        if (user) {
            fetchData();
            fetchShopSettings();
        }
    }, [user]);

    const fetchShopSettings = async () => {
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
            console.error('Error fetching shop settings:', error);
        }
    };

    const fetchData = async () => {
        try {
            const [productsRes, salesRes, saleItemsRes] = await Promise.all([
                supabase.from('v_inventory_with_avoir').select('*'),
                supabase.from('sales').select('*'),
                supabase.from('sale_items').select('*')
            ]);

            const products = productsRes.data || [];
            const sales = salesRes.data || [];
            const saleItems = saleItemsRes.data || [];

            // Calculate Stats
            const totalProducts = products.length;
            const lowStock = products.filter(p => p.quantity <= (p.min_stock_level || 5)).length;
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
                        'rgba(79, 98, 120, 0.45)',
                        'rgba(119, 106, 84, 0.45)',
                        'rgba(133, 91, 91, 0.45)',
                        'rgba(85, 118, 112, 0.45)',
                        'rgba(109, 99, 130, 0.45)',
                        'rgba(128, 123, 96, 0.45)',
                    ],
                    borderColor: [
                        'rgba(79, 98, 120, 1)',
                        'rgba(119, 106, 84, 1)',
                        'rgba(133, 91, 91, 1)',
                        'rgba(85, 118, 112, 1)',
                        'rgba(109, 99, 130, 1)',
                        'rgba(128, 123, 96, 1)',
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
                if (Object.prototype.hasOwnProperty.call(salesByDay, saleDate)) {
                    salesByDay[saleDate] += sale.amount || 0;
                }
            });

            setSalesTrendData({
                labels: last7Days.map(d => new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })),
                datasets: [{
                    label: 'Ventes (CFA)',
                    data: last7Days.map(d => salesByDay[d]),
                    borderColor: 'rgb(79, 98, 120)',
                    backgroundColor: 'rgba(79, 98, 120, 0.2)',
                    tension: 0.3
                }]
            });

            // Top Selling Products
            const productSalesMap = {};
            saleItems.forEach(item => {
                if (item.product_id) {
                    if (!productSalesMap[item.product_id]) {
                        productSalesMap[item.product_id] = { revenue: 0, quantity: 0 };
                    }
                    productSalesMap[item.product_id].revenue += item.total_price || 0;
                    productSalesMap[item.product_id].quantity += item.quantity || 0;
                }
            });

            const topSelling = Object.entries(productSalesMap)
                .map(([productId, stats]) => {
                    const product = products.find(p => p.id === productId);
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
                .filter(p => p.quantity <= (p.min_stock_level || 5))
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
                    backgroundColor: 'rgba(95, 112, 134, 0.5)',
                    borderColor: 'rgb(95, 112, 134)',
                    borderWidth: 2
                }]
            });

        } catch (error) {
            console.error("Error loading dashboard data", error);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Tableau de Bord - {shopName}</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Revenue Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Revenu Total</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2 font-mono">
                                {stats.totalRevenue.toLocaleString()} <span className="text-sm font-normal text-gray-500">CFA</span>
                            </h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-green-600 flex items-center font-medium bg-green-50 px-2 py-0.5 rounded-full">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                            {stats.totalTransactions}
                        </span>
                        <span className="text-gray-400 ml-2">transactions</span>
                    </div>
                </div>

                {/* Today Sales Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Ventes Aujourd'hui</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2 font-mono">
                                {stats.todaySales.toLocaleString()} <span className="text-sm font-normal text-gray-500">CFA</span>
                            </h3>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-gray-500">
                            Cette semaine: <span className="font-semibold text-gray-900">{stats.thisWeekSales.toLocaleString()}</span>
                        </span>
                    </div>
                </div>

                {/* Stock Value Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Valeur du Stock</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2 font-mono">
                                {stats.totalStockValue.toLocaleString()} <span className="text-sm font-normal text-gray-500">CFA</span>
                            </h3>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-full">
                            {stats.totalProducts}
                        </span>
                        <span className="text-gray-400 ml-2">produits en stock</span>
                    </div>
                </div>

                {/* Low Stock Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Alertes Stock</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2 font-mono">
                                {stats.lowStock}
                            </h3>
                        </div>
                        <div className={`p-3 rounded-lg ${stats.lowStock > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${stats.lowStock > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        {stats.lowStock > 0 ? (
                            <span className="text-red-600 font-medium flex items-center">
                                <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                                Attention requise
                            </span>
                        ) : (
                            <span className="text-green-600 font-medium flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                Stock sain
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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


