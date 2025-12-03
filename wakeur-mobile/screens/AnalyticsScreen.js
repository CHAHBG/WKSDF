import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, SafeAreaView, StatusBar, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { COLORS, GLASS, SHADOWS } from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function AnalyticsScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [categoryStats, setCategoryStats] = useState([]);
    const [totalValue, setTotalValue] = useState(0);
    const [topProducts, setTopProducts] = useState([]);
    const [salesStats, setSalesStats] = useState({
        totalSales: 0,
        totalRevenue: 0,
        todaySales: 0,
        thisWeekSales: 0,
        thisMonthSales: 0,
        averageOrderValue: 0,
        totalTransactions: 0
    });
    const [topSellingProducts, setTopSellingProducts] = useState([]);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            // Fetch Inventory Data
            const { data: products, error: prodError } = await supabase
                .from('v_inventory_with_avoir')
                .select('*');

            if (prodError) throw prodError;

            // Calculate Total Inventory Value
            const total = products.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
            setTotalValue(total);

            // Group by Category
            const catMap = {};
            products.forEach(item => {
                const cat = item.category_name || 'Autre';
                if (!catMap[cat]) catMap[cat] = { count: 0, value: 0 };
                catMap[cat].count += item.quantity;
                catMap[cat].value += (item.quantity * item.unit_price);
            });

            const catStats = Object.keys(catMap).map(key => ({
                name: key,
                count: catMap[key].count,
                value: catMap[key].value
            })).sort((a, b) => b.value - a.value);

            setCategoryStats(catStats);

            // Top Products by Inventory Value
            const top = [...products]
                .sort((a, b) => (b.quantity * b.unit_price) - (a.quantity * a.unit_price))
                .slice(0, 5);
            setTopProducts(top);

            // Fetch Sales Data
            const { data: sales, error: salesError } = await supabase
                .from('sales')
                .select('*');

            if (salesError) throw salesError;

            // Calculate Sales Statistics
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

            const totalRevenue = sales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
            const todaySales = sales.filter(s => new Date(s.created_at) >= today)
                .reduce((sum, sale) => sum + (sale.amount || 0), 0);
            const thisWeekSales = sales.filter(s => new Date(s.created_at) >= weekAgo)
                .reduce((sum, sale) => sum + (sale.amount || 0), 0);
            const thisMonthSales = sales.filter(s => new Date(s.created_at) >= monthAgo)
                .reduce((sum, sale) => sum + (sale.amount || 0), 0);

            setSalesStats({
                totalSales: sales.length,
                totalRevenue,
                todaySales,
                thisWeekSales,
                thisMonthSales,
                averageOrderValue: sales.length > 0 ? totalRevenue / sales.length : 0,
                totalTransactions: sales.length
            });

            // Fetch Sale Items for Product Stats
            const { data: saleItems, error: itemsError } = await supabase
                .from('sale_items')
                .select('*');

            if (itemsError) {
                console.warn("Error fetching sale items:", itemsError);
            }

            // Calculate Top Selling Products
            const productSalesMap = {};
            (saleItems || []).forEach(item => {
                if (item.product_id) {
                    if (!productSalesMap[item.product_id]) {
                        productSalesMap[item.product_id] = {
                            quantity: 0,
                            revenue: 0,
                            name: item.product_name // Store name here
                        };
                    }
                    productSalesMap[item.product_id].quantity += item.quantity || 0;
                    productSalesMap[item.product_id].revenue += item.total_price || 0;
                }
            });

            const topSelling = Object.entries(productSalesMap)
                .map(([productId, stats]) => {
                    // Fix: productId is UUID, do not use parseInt
                    const product = products.find(p => p.id === productId);
                    return {
                        id: productId,
                        name: product?.name || stats.name || 'Produit inconnu', // Use stats.name
                        category: product?.category_name || 'N/A',
                        ...stats
                    };
                })
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);

            setTopSellingProducts(topSelling);

        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const maxCatValue = Math.max(...categoryStats.map(c => c.value), 1);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.blobTop} />
            <View style={styles.blobBottom} />
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                </Pressable>
                <Text style={styles.headerTitle}>Analytique & Stats</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Sales Overview Cards */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: 'rgba(76, 110, 245, 0.9)' }]}>
                        <Ionicons name="cash-outline" size={24} color="white" />
                        <Text style={styles.statCardValue}>{salesStats.totalRevenue.toLocaleString()}</Text>
                        <Text style={styles.statCardLabel}>Revenu Total</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: 'rgba(46, 204, 113, 0.9)' }]}>
                        <Ionicons name="trending-up" size={24} color="white" />
                        <Text style={styles.statCardValue}>{salesStats.todaySales.toLocaleString()}</Text>
                        <Text style={styles.statCardLabel}>Aujourd'hui</Text>
                    </View>
                </View>

                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: 'rgba(255, 159, 67, 0.9)' }]}>
                        <Ionicons name="calendar-outline" size={24} color="white" />
                        <Text style={styles.statCardValue}>{salesStats.thisWeekSales.toLocaleString()}</Text>
                        <Text style={styles.statCardLabel}>Cette Semaine</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: 'rgba(155, 89, 182, 0.9)' }]}>
                        <Ionicons name="stats-chart" size={24} color="white" />
                        <Text style={styles.statCardValue}>{salesStats.thisMonthSales.toLocaleString()}</Text>
                        <Text style={styles.statCardLabel}>Ce Mois</Text>
                    </View>
                </View>

                {/* Additional Metrics */}
                <View style={styles.glassCard}>
                    <Text style={styles.cardTitle}>Métriques Clés</Text>
                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Transactions Totales</Text>
                        <Text style={styles.metricValue}>{salesStats.totalTransactions}</Text>
                    </View>
                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Valeur Moyenne Commande</Text>
                        <Text style={styles.metricValue}>{salesStats.averageOrderValue.toLocaleString()} F</Text>
                    </View>
                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Valeur Stock Actuel</Text>
                        <Text style={styles.metricValue}>{totalValue.toLocaleString()} F</Text>
                    </View>
                </View>

                {/* Top Selling Products */}
                <View style={styles.glassCard}>
                    <Text style={styles.cardTitle}>Top 5 Produits Vendus (Revenu)</Text>
                    {topSellingProducts.map((item, index) => (
                        <View key={index} style={styles.productRow}>
                            <View style={styles.rankCircle}>
                                <Text style={styles.rankText}>{index + 1}</Text>
                            </View>
                            <View style={styles.productInfo}>
                                <Text style={styles.productName}>{item.name}</Text>
                                <Text style={styles.productCat}>{item.category}</Text>
                            </View>
                            <View style={styles.productValue}>
                                <Text style={styles.valueText}>{item.revenue.toLocaleString()} F</Text>
                                <Text style={styles.qtyText}>{item.quantity} vendus</Text>
                            </View>
                        </View>
                    ))}
                    {topSellingProducts.length === 0 && (
                        <Text style={styles.emptyText}>Aucune vente enregistrée</Text>
                    )}
                </View>

                {/* Total Value Card */}
                <View style={styles.glassCard}>
                    <Text style={styles.cardTitle}>Valeur Totale du Stock</Text>
                    <Text style={styles.bigNumber}>{totalValue.toLocaleString()} F</Text>
                    <Text style={styles.subtext}>Basé sur le prix unitaire et la quantité</Text>
                </View>

                {/* Category Distribution */}
                <View style={styles.glassCard}>
                    <Text style={styles.cardTitle}>Répartition par Catégorie (Valeur)</Text>
                    {categoryStats.map((cat, index) => (
                        <View key={index} style={styles.chartRow}>
                            <View style={styles.chartLabelRow}>
                                <Text style={styles.chartLabel}>{cat.name}</Text>
                                <Text style={styles.chartValue}>{cat.value.toLocaleString()} F</Text>
                            </View>
                            <View style={styles.barBackground}>
                                <View style={[styles.barFill, { width: `${(cat.value / maxCatValue) * 100}%` }]} />
                            </View>
                            <Text style={styles.chartCount}>{cat.count} unités</Text>
                        </View>
                    ))}
                </View>

                {/* Top Products by Inventory Value */}
                <View style={styles.glassCard}>
                    <Text style={styles.cardTitle}>Top 5 Produits (Valeur Stock)</Text>
                    {topProducts.map((item, index) => (
                        <View key={index} style={styles.productRow}>
                            <View style={styles.rankCircle}>
                                <Text style={styles.rankText}>{index + 1}</Text>
                            </View>
                            <View style={styles.productInfo}>
                                <Text style={styles.productName}>{item.name}</Text>
                                <Text style={styles.productCat}>{item.category_name}</Text>
                            </View>
                            <View style={styles.productValue}>
                                <Text style={styles.valueText}>{(item.quantity * item.unit_price).toLocaleString()} F</Text>
                                <Text style={styles.qtyText}>{item.quantity} en stock</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    blobTop: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(37, 99, 235, 0.05)',
    },
    blobBottom: {
        position: 'absolute',
        bottom: 0,
        left: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(5, 150, 105, 0.05)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
    },
    backButton: {
        marginRight: 16,
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    headerTitle: {
        color: COLORS.primary,
        fontSize: 24,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        gap: 10,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    statCardValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 8,
        textAlign: 'center',
    },
    statCardLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
        textAlign: 'center',
        fontWeight: '600',
    },
    glassCard: {
        ...GLASS.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    metricLabel: {
        fontSize: 14,
        color: COLORS.text,
    },
    metricValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textLight,
        fontStyle: 'italic',
        paddingVertical: 20,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 15,
    },
    bigNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 5,
    },
    subtext: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    chartRow: {
        marginBottom: 15,
    },
    chartLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    chartLabel: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '600',
    },
    chartValue: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    barBackground: {
        height: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 4,
        marginBottom: 2,
    },
    barFill: {
        height: 8,
        backgroundColor: COLORS.primary,
        borderRadius: 4,
    },
    chartCount: {
        fontSize: 11,
        color: COLORS.textLight,
        textAlign: 'right',
    },
    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        paddingBottom: 10,
    },
    rankCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(47, 78, 178, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    rankText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    productCat: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    productValue: {
        alignItems: 'flex-end',
    },
    valueText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.success,
    },
    qtyText: {
        fontSize: 11,
        color: COLORS.textLight,
    },
});
