import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { COLORS, GLASS, SHADOWS } from '../constants/theme';

export default function DailyOpeningScreen({ navigation }) {
    // Cash Breakdown State
    const [cashBreakdown, setCashBreakdown] = useState({
        b10000: '',
        b5000: '',
        b2000: '',
        b1000: '',
        c500: '',
        c250: '',
        c200: '',
        c100: '',
        c50: '',
        c25: '',
        c10: '',
        c5: ''
    });

    const [totalCash, setTotalCash] = useState(0);
    const [platformBalances, setPlatformBalances] = useState({});
    const [platforms, setPlatforms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        fetchPlatforms();
    }, []);

    // Calculate total cash whenever breakdown changes
    useEffect(() => {
        let total = 0;
        total += (parseInt(cashBreakdown.b10000) || 0) * 10000;
        total += (parseInt(cashBreakdown.b5000) || 0) * 5000;
        total += (parseInt(cashBreakdown.b2000) || 0) * 2000;
        total += (parseInt(cashBreakdown.b1000) || 0) * 1000;

        total += (parseInt(cashBreakdown.c500) || 0) * 500;
        total += (parseInt(cashBreakdown.c250) || 0) * 250;
        total += (parseInt(cashBreakdown.c200) || 0) * 200;
        total += (parseInt(cashBreakdown.c100) || 0) * 100;
        total += (parseInt(cashBreakdown.c50) || 0) * 50;
        total += (parseInt(cashBreakdown.c25) || 0) * 25;
        total += (parseInt(cashBreakdown.c10) || 0) * 10;
        total += (parseInt(cashBreakdown.c5) || 0) * 5;

        setTotalCash(total);
    }, [cashBreakdown]);

    const fetchPlatforms = async () => {
        try {
            const { data, error } = await supabase
                .from('mm_platforms')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;

            if (data && data.length > 0) {
                setPlatforms(data);
                const initialBalances = {};
                data.forEach(p => initialBalances[p.id] = '');
                setPlatformBalances(initialBalances);
            } else {
                const dummy = [
                    { id: 'dummy-wave', name: 'Wave' },
                    { id: 'dummy-om', name: 'Orange Money' },
                    { id: 'dummy-free', name: 'Free Money' }
                ];
                setPlatforms(dummy);
                const initial = {};
                dummy.forEach(p => initial[p.id] = '');
                setPlatformBalances(initial);
            }
        } catch (error) {
            console.error('Error fetching platforms:', error);
            Alert.alert('Erreur', 'Impossible de charger les opérateurs.');
        } finally {
            setFetching(false);
        }
    };

    const handleBreakdownChange = (denom, value) => {
        if (!/^\d*$/.test(value)) return;
        setCashBreakdown(prev => ({ ...prev, [denom]: value }));
    };

    const handlePlatformBalanceChange = (id, value) => {
        if (!/^\d*$/.test(value)) return;
        setPlatformBalances(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async () => {
        if (totalCash === 0) {
            Alert.alert('Attention', 'Le montant en caisse est de 0 FCFA. Continuer ?', [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Oui', onPress: processOpening }
            ]);
            return;
        }
        processOpening();
    };

    const processOpening = async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data: existing } = await supabase
                .from('mm_daily_reports')
                .select('*')
                .eq('report_date', today)
                .eq('is_closed', false)
                .single();

            if (existing) {
                Alert.alert('Info', 'Une session est déjà ouverte pour aujourd\'hui.');
                navigation.replace('Main', { screen: 'Mobile Money' });
                return;
            }

            const openingDetails = {
                cash_breakdown: cashBreakdown,
                platforms: platformBalances
            };

            const { error } = await supabase
                .from('mm_daily_reports')
                .insert({
                    report_date: today,
                    opening_balance: totalCash,
                    notes: JSON.stringify({ cash_breakdown: cashBreakdown, platforms: platformBalances }),
                    is_closed: false
                });

            if (error) throw error;

            Alert.alert('Succès', 'Journée ouverte avec succès !');
            navigation.replace('Main', { screen: 'Mobile Money' });

        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', "Échec de l'ouverture de la journée: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.blobTop} />
            <View style={styles.blobBottom} />
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                </Pressable>
                <Text style={styles.headerTitle}>Ouverture de Caisse</Text>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <Text style={styles.subtitle}>Veuillez saisir le détail de la caisse et les soldes Mobile Money.</Text>

                    {/* Cash Breakdown */}
                    <View style={styles.glassCard}>
                        <View style={styles.cardHeader}>
                            <View>
                                <Text style={styles.cardTitle}>Détail Espèces (CFA)</Text>
                                <Text style={styles.cardSubtitle}>Billets et Pièces</Text>
                            </View>
                            <Ionicons name="cash-outline" size={24} color={COLORS.primary} />
                        </View>

                        <Text style={styles.sectionHeader}>Billets</Text>
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.denomLabel}>10.000</Text>
                                <TextInput style={styles.input} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textLight} value={cashBreakdown.b10000} onChangeText={v => handleBreakdownChange('b10000', v)} />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.denomLabel}>5.000</Text>
                                <TextInput style={styles.input} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textLight} value={cashBreakdown.b5000} onChangeText={v => handleBreakdownChange('b5000', v)} />
                            </View>
                        </View>
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.denomLabel}>2.000</Text>
                                <TextInput style={styles.input} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textLight} value={cashBreakdown.b2000} onChangeText={v => handleBreakdownChange('b2000', v)} />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.denomLabel}>1.000</Text>
                                <TextInput style={styles.input} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textLight} value={cashBreakdown.b1000} onChangeText={v => handleBreakdownChange('b1000', v)} />
                            </View>
                        </View>

                        <Text style={styles.sectionHeader}>Pièces</Text>
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.denomLabel}>500</Text>
                                <TextInput style={styles.input} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textLight} value={cashBreakdown.c500} onChangeText={v => handleBreakdownChange('c500', v)} />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.denomLabel}>250</Text>
                                <TextInput style={styles.input} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textLight} value={cashBreakdown.c250} onChangeText={v => handleBreakdownChange('c250', v)} />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.denomLabel}>200</Text>
                                <TextInput style={styles.input} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textLight} value={cashBreakdown.c200} onChangeText={v => handleBreakdownChange('c200', v)} />
                            </View>
                        </View>
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.denomLabel}>100</Text>
                                <TextInput style={styles.input} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textLight} value={cashBreakdown.c100} onChangeText={v => handleBreakdownChange('c100', v)} />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.denomLabel}>50</Text>
                                <TextInput style={styles.input} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textLight} value={cashBreakdown.c50} onChangeText={v => handleBreakdownChange('c50', v)} />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.denomLabel}>25</Text>
                                <TextInput style={styles.input} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textLight} value={cashBreakdown.c25} onChangeText={v => handleBreakdownChange('c25', v)} />
                            </View>
                        </View>
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.denomLabel}>10</Text>
                                <TextInput style={styles.input} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textLight} value={cashBreakdown.c10} onChangeText={v => handleBreakdownChange('c10', v)} />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.denomLabel}>5</Text>
                                <TextInput style={styles.input} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textLight} value={cashBreakdown.c5} onChangeText={v => handleBreakdownChange('c5', v)} />
                            </View>
                            <View style={styles.col} />
                        </View>

                        <View style={styles.totalContainer}>
                            <Text style={styles.totalLabel}>Total Caisse Calculé</Text>
                            <Text style={styles.totalAmount}>{totalCash.toLocaleString()} F</Text>
                        </View>
                    </View>

                    {/* Platform Balances */}
                    <View style={styles.glassCard}>
                        <View style={styles.cardHeader}>
                            <View>
                                <Text style={styles.cardTitle}>Comptes Mobile Money</Text>
                                <Text style={styles.cardSubtitle}>Soldes initiaux</Text>
                            </View>
                            <Ionicons name="phone-portrait-outline" size={24} color={COLORS.accent} />
                        </View>

                        {fetching ? (
                            <ActivityIndicator color={COLORS.primary} />
                        ) : (
                            platforms.map(p => (
                                <View key={p.id} style={styles.inputGroup}>
                                    <Text style={styles.label}>{p.name}</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor={COLORS.textLight}
                                        value={platformBalances[p.id]}
                                        onChangeText={(v) => handlePlatformBalanceChange(p.id, v)}
                                    />
                                </View>
                            ))
                        )}
                    </View>

                    <Pressable
                        style={[styles.submitButton, loading && styles.disabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.submitText}>Valider l'Ouverture</Text>
                        )}
                    </Pressable>

                    <View style={{ height: 50 }} />
                </ScrollView>
            </KeyboardAvoidingView>
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
    subtitle: {
        textAlign: 'center',
        color: COLORS.textLight,
        marginBottom: 20,
        fontSize: 14,
    },
    glassCard: {
        ...GLASS.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    cardSubtitle: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.textLight,
        marginTop: 10,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    row: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    col: {
        flex: 1,
    },
    denomLabel: {
        fontSize: 12,
        color: COLORS.text,
        marginBottom: 4,
        fontWeight: '500',
    },
    input: {
        ...GLASS.input,
        textAlign: 'center',
        paddingVertical: 10,
    },
    totalContainer: {
        marginTop: 20,
        backgroundColor: 'rgba(47, 78, 178, 0.05)',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(47, 78, 178, 0.1)',
    },
    totalLabel: {
        color: COLORS.primary,
        fontSize: 12,
        marginBottom: 5,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    totalAmount: {
        color: COLORS.primary,
        fontSize: 24,
        fontWeight: 'bold',
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        color: COLORS.text,
        marginBottom: 5,
        fontWeight: '500',
    },
    submitButton: {
        backgroundColor: COLORS.success,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        ...SHADOWS.medium,
    },
    disabled: {
        opacity: 0.7,
    },
    submitText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
