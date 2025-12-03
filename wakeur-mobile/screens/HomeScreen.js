import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, GLASS, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
    const { isOwner, signOut, userProfile } = useAuth();
    const [stats, setStats] = useState({
        salesToday: 0,
        transactionsToday: 0,
        totalStock: 0,
        totalAvoir: 0,
        totalRealMoney: 0
    });
    const [lowStockItems, setLowStockItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [shopName, setShopName] = useState('Ma Boutique');
    const [shopLogo, setShopLogo] = useState(null);

    const userName = userProfile?.full_name || userProfile?.first_name || 'Utilisateur';

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchDashboardData();
            fetchShopSettings();
        });
        return unsubscribe;
    }, [navigation]);

    const fetchDashboardData = async () => {
        try {
            // 1. Fetch Today's Sales
            const today = new Date().toISOString().split('T')[0];
            const { data: sales, error: salesError } = await supabase
                .from('sales')
                .select('*')
                .gte('created_at', today);

            if (salesError) throw salesError;

            const salesSum = (sales || []).reduce((sum, sale) => sum + (sale.amount || 0), 0);

            // 2. Fetch Inventory Stats (Stock, Avoir, Real Money)
            const { data: inventory, error: invError } = await supabase
                .from('v_inventory_with_avoir')
                .select('quantity, avoir, real_money, unit_price');

            if (invError) throw invError;

            const totalStock = (inventory || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
            // Fix: Avoir should be the total inventory value (quantity * unit_price)
            const totalAvoir = (inventory || []).reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);
            // Real Money could be cash on hand, but for now let's keep it distinct or maybe it was meant to be the same?
            // The user said "Avoir also should diplay the value of the inventaire".
            // Currently real_money in view is also quantity * unit_price.
            const totalRealMoney = (inventory || []).reduce((sum, item) => sum + (item.real_money || 0), 0);

            setStats({
                salesToday: salesSum,
                transactionsToday: (sales || []).length,
                totalStock,
                totalAvoir,
                totalRealMoney
            });

            // 3. Fetch Low Stock Alerts
            const { data: lowStock, error: lowStockError } = await supabase
                .from('v_low_stock_alerts')
                .select('*');

            if (lowStockError) throw lowStockError;
            setLowStockItems(lowStock || []);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchShopSettings = async () => {
        try {
            console.log('Fetching shop settings for shop_id:', userProfile?.shop_id);
            if (!userProfile?.shop_id) return;

            const { data, error } = await supabase
                .from('shop_settings')
                .select('*')
                .eq('id', userProfile.shop_id)
                .maybeSingle();

            if (error) throw error;
            if (data) {
                console.log('Shop settings found:', data.shop_name);
                setShopName(data.shop_name || 'Ma Boutique');
                setShopLogo(data.logo_url);
            } else {
                console.log('No shop settings found for this ID');
            }
        } catch (error) {
            console.error('Error fetching shop settings:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.blobTop} />
            <View style={styles.blobBottom} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        {shopLogo ? (
                            <Image source={{ uri: shopLogo }} style={styles.shopLogo} />
                        ) : (
                            <View style={styles.shopLogoPlaceholder}>
                                <Ionicons name="storefront" size={24} color={COLORS.primary} />
                            </View>
                        )}
                        <View>
                            <Text style={styles.greeting}>{shopName}</Text>
                            <Text style={styles.username}>Bonjour, {userName}</Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Pressable style={styles.profileButton} onPress={() => navigation.navigate('Analytics')}>
                            <Ionicons name="stats-chart" size={20} color={COLORS.primary} />
                        </Pressable>
                        <Pressable style={[styles.profileButton, { backgroundColor: '#FEE2E2' }]} onPress={signOut}>
                            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                        </Pressable>
                    </View>
                </View>

                {/* Main Stats Card - Dark Theme */}
                <View style={styles.mainCard}>
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.mainCardTitle}>Aujourd'hui</Text>
                            <Text style={styles.mainCardSubtitle}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                        </View>
                        <View style={styles.mainIconContainer}>
                            <Ionicons name="wallet" size={24} color="white" />
                        </View>
                    </View>

                    <View style={styles.mainStat}>
                        <Text style={styles.mainStatValue}>{stats.salesToday.toLocaleString()} <Text style={styles.mainCurrency}>F</Text></Text>
                        <Text style={styles.mainStatLabel}>Ventes du jour</Text>
                    </View>

                    <View style={styles.mainStatsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.mainStatLabelSmall}>Transactions</Text>
                            <Text style={styles.mainStatValueSmall}>{stats.transactionsToday}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.mainStatLabelSmall}>Stock Total</Text>
                            <Text style={styles.mainStatValueSmall}>{stats.totalStock}</Text>
                        </View>
                    </View>
                </View>

                {/* Financial Overview */}
                <View style={styles.row}>
                    <View style={[styles.glassCard, styles.halfCard]}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
                            <Ionicons name="trending-up" size={24} color={COLORS.accent} />
                        </View>
                        <Text style={styles.statLabel}>Potentiel (Avoir)</Text>
                        <Text style={[styles.statValue, { color: COLORS.accent }]}>{stats.totalAvoir.toLocaleString()} F</Text>
                    </View>
                    <View style={[styles.glassCard, styles.halfCard]}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(5, 150, 105, 0.1)' }]}>
                            <Ionicons name="cash" size={24} color={COLORS.success} />
                        </View>
                        <Text style={styles.statLabel}>Argent Réel</Text>
                        <Text style={[styles.statValue, { color: COLORS.success }]}>{stats.totalRealMoney.toLocaleString()} F</Text>
                    </View>
                </View>

                {/* Actions */}
                <Text style={styles.sectionTitle}>Actions Rapides</Text>
                <View style={styles.actionsGrid}>
                    <Pressable
                        style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
                        onPress={() => navigation.navigate('TransactionEntry')}
                    >
                        <View style={styles.actionIcon}>
                            <Ionicons name="add" size={28} color="white" />
                        </View>
                        <Text style={styles.actionButtonText}>Nouvelle Vente</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.actionButton, { backgroundColor: COLORS.success }]}
                        onPress={() => navigation.navigate('DailyClosing')}
                    >
                        <View style={styles.actionIcon}>
                            <Ionicons name="document-text" size={28} color="white" />
                        </View>
                        <Text style={styles.actionButtonText}>Clôture</Text>
                    </Pressable>
                </View>

                {/* Owner-only: Agent Management */}
                {isOwner() && (
                    <Pressable
                        style={[styles.actionButton, { backgroundColor: COLORS.accent, marginTop: 16, width: '100%', flexDirection: 'row', gap: 12 }]}
                        onPress={() => navigation.navigate('AgentManagement')}
                    >
                        <Ionicons name="people" size={24} color="white" />
                        <Text style={[styles.actionButtonText, { marginTop: 0 }]}>Gestion des Agents</Text>
                    </Pressable>
                )}

                {/* Low Stock Alerts */}
                {lowStockItems.length > 0 && (
                    <View style={[styles.glassCard, { marginTop: 20, borderColor: COLORS.warning, borderWidth: 1 }]}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, { color: COLORS.warning }]}>Alertes Stock</Text>
                            <Ionicons name="warning" size={20} color={COLORS.warning} />
                        </View>
                        {lowStockItems.slice(0, 3).map((item, index) => (
                            <View key={index} style={styles.alertItem}>
                                <Text style={styles.alertText}>{item.name}</Text>
                                <Text style={styles.alertValue}>{item.current_stock} restants</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    blobTop: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
    },
    blobBottom: {
        position: 'absolute',
        bottom: 0,
        left: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(5, 150, 105, 0.08)',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 8,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    shopLogo: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: COLORS.white,
        ...SHADOWS.small,
    },
    shopLogoPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.small,
    },
    greeting: {
        fontSize: 14,
        color: COLORS.textLight,
        fontWeight: '500',
        marginBottom: 2,
    },
    username: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    profileButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    mainCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        ...SHADOWS.medium,
    },
    mainCardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    mainCardSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        textTransform: 'capitalize',
        marginTop: 2,
    },
    mainIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainStat: {
        marginVertical: 24,
    },
    mainStatValue: {
        fontSize: 40,
        fontWeight: 'bold',
        color: 'white',
        letterSpacing: -1,
    },
    mainCurrency: {
        fontSize: 20,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
    },
    mainStatLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 4,
    },
    mainStatsGrid: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.15)',
        paddingTop: 16,
    },
    mainStatLabelSmall: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 4,
    },
    mainStatValueSmall: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    glassCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        ...SHADOWS.small,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statLabel: {
        fontSize: 13,
        color: COLORS.textLight,
        marginBottom: 4,
        fontWeight: '500',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    row: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    halfCard: {
        flex: 1,
        marginBottom: 0,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 16,
        marginLeft: 4,
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    actionButton: {
        flex: 1,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.medium,
    },
    actionIcon: {
        marginBottom: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    alertItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    alertText: {
        fontSize: 15,
        color: COLORS.text,
        fontWeight: '500',
    },
    alertValue: {
        fontSize: 15,
        color: COLORS.warning,
        fontWeight: 'bold',
    },
    statItem: {
        flex: 1,
    },
});
