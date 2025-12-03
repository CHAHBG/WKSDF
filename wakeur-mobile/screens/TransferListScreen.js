import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert, StatusBar, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, GLASS, SHADOWS } from '../constants/theme';

export default function TransferListScreen({ navigation }) {
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dailyReport, setDailyReport] = useState(null);

    useFocusEffect(
        React.useCallback(() => {
            checkDailyReport();
            fetchTransfers();
        }, [])
    );

    const checkDailyReport = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('mm_daily_reports')
                .select('*')
                .eq('report_date', today)
                .eq('is_closed', false)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
                console.error('Error checking daily report:', error);
            }

            if (!data) {
                // No open report for today
                Alert.alert(
                    'Ouverture de Caisse',
                    'Aucune session ouverte pour aujourd\'hui. Veuillez ouvrir la caisse pour commencer.',
                    [
                        { text: 'Ouvrir maintenant', onPress: () => navigation.navigate('DailyOpening') },
                        { text: 'Plus tard', style: 'cancel' }
                    ]
                );
            } else {
                setDailyReport(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchTransfers = async () => {
        try {
            const { data, error } = await supabase
                .from('mm_transactions')
                .select('*, mm_platforms(name, code, color)')
                .order('transaction_date', { ascending: false });

            if (error) throw error;
            setTransfers(data || []);
        } catch (error) {
            console.error("Error fetching transfers:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.glassCard}>
            <View style={styles.iconContainer}>
                <View style={[styles.iconCircle, { backgroundColor: item.mm_platforms?.color || COLORS.primary }]}>
                    <Text style={styles.iconText}>{item.mm_platforms?.code ? item.mm_platforms.code[0] : 'T'}</Text>
                </View>
            </View>
            <View style={styles.detailsContainer}>
                <Text style={styles.sender}>{item.operation_type === 'ENCAISSEMENT' ? 'Dépôt' : 'Retrait'} - {item.mm_platforms?.name}</Text>
                <Text style={styles.phone}>{new Date(item.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <View style={styles.amountContainer}>
                <Text style={[styles.amount, { color: item.operation_type === 'ENCAISSEMENT' ? COLORS.success : COLORS.danger }]}>
                    {item.operation_type === 'ENCAISSEMENT' ? '+' : '-'}{parseInt(item.amount).toLocaleString()} F
                </Text>
            </View>
        </View>
    );

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
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mobile Money</Text>
                <View style={styles.headerIcons}>
                    <Pressable onPress={() => navigation.navigate('CreateTransaction')} style={styles.addButton}>
                        <Ionicons name="add" size={24} color="white" />
                    </Pressable>
                    <Pressable onPress={() => navigation.navigate('Analytics')} style={styles.iconButton}>
                        <Ionicons name="stats-chart" size={24} color={COLORS.primary} />
                    </Pressable>
                </View>
            </View>

            <View style={styles.listContainer}>
                {dailyReport && (
                    <View style={styles.statusBanner}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.success} style={{ marginRight: 8 }} />
                        <Text style={styles.statusText}>Session Ouverte • Solde: {dailyReport.opening_balance?.toLocaleString()} F</Text>
                    </View>
                )}
                <Text style={styles.sectionTitle}>Flux de Transactions</Text>
                <FlatList
                    data={transfers}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="documents-outline" size={48} color={COLORS.primary} />
                            </View>
                            <Text style={styles.emptyText}>Aucune transaction aujourd'hui</Text>
                            <Text style={styles.emptySubText}>Les transactions apparaîtront ici une fois enregistrées</Text>
                        </View>
                    }
                />
            </View>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 20,
    },
    headerTitle: {
        color: COLORS.text,
        fontSize: 28,
        fontWeight: 'bold',
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    addButton: {
        backgroundColor: COLORS.primary,
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    iconButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    listContainer: {
        flex: 1,
        paddingHorizontal: 24,
    },
    statusBanner: {
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(5, 150, 105, 0.2)',
    },
    statusText: {
        color: COLORS.success,
        fontWeight: '600',
        fontSize: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: COLORS.text,
    },
    listContent: {
        paddingBottom: 24,
    },
    glassCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        ...SHADOWS.small,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    iconContainer: {
        marginRight: 16,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 20,
    },
    detailsContainer: {
        flex: 1,
    },
    sender: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    phone: {
        fontSize: 13,
        color: COLORS.textLight,
        fontWeight: '500',
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
        paddingHorizontal: 40,
    }
});
