import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { COLORS, GLASS, SHADOWS } from '../constants/theme';

const LOGO_MAP = {
    'OM': require('../assets/images/mobile_money/OM.png'),
    'WAVE': require('../assets/images/mobile_money/WAVE.png'),
    'WIZALL': require('../assets/images/mobile_money/WIZALL.png'),
    'KASH': require('../assets/images/mobile_money/KASH_KASH.png'),
    'KPAY': require('../assets/images/mobile_money/KPAY.jpg'),
    'MIXX': require('../assets/images/mobile_money/MIXX_BY_YASS.png'),
    'POST': require('../assets/images/mobile_money/POST_CASH.png'),
    'E-MONEY': require('../assets/images/mobile_money/E_MONEY.png'),
};

export default function CreateTransactionScreen({ navigation }) {
    const [selectedPlatform, setSelectedPlatform] = useState(null);
    const [platforms, setPlatforms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingPlatforms, setFetchingPlatforms] = useState(true);

    // Cash Breakdown State
    const [cashBreakdown, setCashBreakdown] = useState({
        b10000: '', b5000: '', b2000: '', b1000: '',
        c500: '', c250: '', c200: '', c100: '', c50: '', c25: '', c10: '', c5: ''
    });

    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        fetchPlatforms();
    }, []);

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
        setTotalAmount(total);
    }, [cashBreakdown]);

    const fetchPlatforms = async () => {
        try {
            const { data, error } = await supabase
                .from('mm_platforms')
                .select('*')
                .eq('is_active', true)
                .not('name', 'in', '("Bissocash","Coris Money","Expresso Money","Free Money","Touch Point")')
                .order('name');

            if (error) throw error;

            if (data && data.length > 0) {
                setPlatforms(data);
                setSelectedPlatform(data[0]);
            } else {
                const defaultPlatforms = [
                    { id: 'dummy-wave', name: 'Wave', color: '#1da1f2' },
                    { id: 'dummy-om', name: 'Orange Money', color: '#ff7900' },
                    { id: 'dummy-wari', name: 'Wari', color: '#00a651' }
                ];
                setPlatforms(defaultPlatforms);
                setSelectedPlatform(defaultPlatforms[0]);
            }
        } catch (error) {
            console.error('Error fetching platforms:', error);
            Alert.alert('Erreur', 'Impossible de charger les opérateurs.');
        } finally {
            setFetchingPlatforms(false);
        }
    };

    const handleQuantityChange = (denomination, value) => {
        if (!/^\d*$/.test(value)) return;
        setCashBreakdown(prev => ({ ...prev, [denomination]: value }));
    };

    const handleSubmit = async (type) => {
        if (totalAmount === 0) {
            Alert.alert('Erreur', 'Le montant total ne peut pas être zéro.');
            return;
        }

        if (!selectedPlatform) {
            Alert.alert('Erreur', 'Veuillez sélectionner un opérateur.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                platform_id: selectedPlatform.id.startsWith('dummy') ? null : selectedPlatform.id,
                operation_type: type,
                amount: totalAmount,
                total_amount: totalAmount,
                fees: 0,
                notes: JSON.stringify({ cash_breakdown: cashBreakdown }),
                status: 'COMPLETED',
                transaction_date: new Date().toISOString()
            };

            if (selectedPlatform.id.startsWith('dummy')) {
                Alert.alert('Mode Démo', 'Base de données vide. Transaction simulée avec succès.');
                navigation.goBack();
                return;
            }

            const { error } = await supabase
                .from('mm_transactions')
                .insert(payload);

            if (error) throw error;

            Alert.alert('Succès', `Transaction ${type} de ${totalAmount.toLocaleString()} FCFA enregistrée.`);
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', "Échec de l'enregistrement de la transaction: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderDenomInput = (label, key, placeholder = "0") => (
        <View style={styles.breakdownRow}>
            <Text style={styles.denomLabel}>{label}</Text>
            <TextInput
                style={styles.denomInput}
                keyboardType="numeric"
                placeholder={placeholder}
                placeholderTextColor={COLORS.textLight}
                value={cashBreakdown[key]}
                onChangeText={(v) => handleQuantityChange(key, v)}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.blobTop} />
            <View style={styles.blobBottom} />
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Nouvelle Transaction</Text>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* Operator Selector */}
                    <View style={styles.card}>
                        <Text style={styles.label}>Service Mobile Money</Text>
                        {fetchingPlatforms ? (
                            <ActivityIndicator color={COLORS.primary} />
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.operatorScroll}>
                                {platforms.map(op => {
                                    // Improved mapping logic
                                    const code = op.code?.toUpperCase();
                                    const name = op.name?.toUpperCase();
                                    let logoSource = null;

                                    if (code === 'OM' || name.includes('ORANGE')) logoSource = LOGO_MAP['OM'];
                                    else if (code === 'WAVE' || name.includes('WAVE')) logoSource = LOGO_MAP['WAVE'];
                                    else if (code === 'WIZALL' || name.includes('WIZALL')) logoSource = LOGO_MAP['WIZALL'];
                                    else if (code === 'KASH' || name.includes('KASH')) logoSource = LOGO_MAP['KASH'];
                                    else if (code === 'KPAY' || name.includes('KPAY')) logoSource = LOGO_MAP['KPAY'];
                                    else if (code === 'MIXX' || name.includes('MIXX')) logoSource = LOGO_MAP['MIXX'];
                                    else if (code === 'POST' || name.includes('POST')) logoSource = LOGO_MAP['POST'];
                                    else if (code === 'E-MONEY' || name.includes('E-MONEY') || name.includes('EMONEY')) logoSource = LOGO_MAP['E-MONEY'];
                                    else logoSource = LOGO_MAP[code] || Object.entries(LOGO_MAP).find(([k]) => code?.startsWith(k))?.[1];

                                    return (
                                        <Pressable
                                            key={op.id}
                                            style={[
                                                styles.operatorBtn,
                                                selectedPlatform?.id === op.id && { backgroundColor: op.color || COLORS.primary, borderColor: op.color || COLORS.primary }
                                            ]}
                                            onPress={() => setSelectedPlatform(op)}
                                        >
                                            {logoSource ? (
                                                <View style={styles.logoContainer}>
                                                    <Image source={logoSource} style={styles.logo} resizeMode="contain" />
                                                </View>
                                            ) : null}
                                            <Text style={[styles.operatorText, selectedPlatform?.id === op.id && styles.operatorTextActive]}>{op.name}</Text>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>

                    {/* Cash Breakdown */}
                    <View style={styles.card}>
                        <Text style={styles.label}>Ventilation des Espèces</Text>

                        <Text style={styles.subHeader}>BILLETS</Text>
                        {renderDenomInput("10,000 F", "b10000")}
                        {renderDenomInput("5,000 F", "b5000")}
                        {renderDenomInput("2,000 F", "b2000")}
                        {renderDenomInput("1,000 F", "b1000")}

                        <View style={styles.divider} />
                        <Text style={styles.subHeader}>PIÈCES</Text>

                        {renderDenomInput("500 F", "c500")}
                        {renderDenomInput("250 F", "c250")}
                        {renderDenomInput("200 F", "c200")}
                        {renderDenomInput("100 F", "c100")}
                        {renderDenomInput("50 F", "c50")}
                        {renderDenomInput("25 F", "c25")}
                        {renderDenomInput("10 F", "c10")}
                        {renderDenomInput("5 F", "c5")}
                    </View>

                    {/* Total Display */}
                    <View style={styles.totalContainer}>
                        <Text style={styles.totalLabel}>Total Espèces</Text>
                        <Text style={styles.totalAmount}>{totalAmount.toLocaleString()} F</Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionContainer}>
                        <Pressable
                            style={[styles.actionButton, styles.depositButton, loading && styles.disabled]}
                            onPress={() => handleSubmit('ENCAISSEMENT')}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Ionicons name="arrow-down-circle" size={24} color="white" />
                                    <Text style={styles.actionText}>ENCAISSEMENT</Text>
                                    <Text style={styles.actionSubtext}>(Entrée Caisse)</Text>
                                </>
                            )}
                        </Pressable>

                        <Pressable
                            style={[styles.actionButton, styles.withdrawButton, loading && styles.disabled]}
                            onPress={() => handleSubmit('DECAISSEMENT')}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Ionicons name="arrow-up-circle" size={24} color="white" />
                                    <Text style={styles.actionText}>DÉCAISSEMENT</Text>
                                    <Text style={styles.actionSubtext}>(Sortie Caisse)</Text>
                                </>
                            )}
                        </Pressable>
                    </View>

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
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 20,
    },
    backButton: {
        marginRight: 16,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    headerTitle: {
        color: COLORS.text,
        fontSize: 24,
        fontWeight: 'bold',
    },
    content: {
        padding: 24,
        paddingTop: 8,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        ...SHADOWS.medium,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textLight,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    subHeader: {
        fontSize: 13,
        color: COLORS.text,
        marginBottom: 12,
        fontWeight: '700',
        marginTop: 8,
    },
    operatorScroll: {
        flexDirection: 'row',
        paddingVertical: 4,
    },
    operatorBtn: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: 12,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        minWidth: 100,
    },
    logoContainer: {
        width: 40,
        height: 40,
        marginBottom: 8,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    operatorText: {
        color: COLORS.text,
        fontWeight: '600',
        fontSize: 15,
    },
    operatorTextActive: {
        color: 'white',
        fontWeight: 'bold',
    },
    breakdownRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    denomLabel: {
        width: 80,
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    denomInput: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: COLORS.text,
        flex: 1,
        textAlign: 'right',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 20,
    },
    totalContainer: {
        backgroundColor: COLORS.primary,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        ...SHADOWS.medium,
    },
    totalLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 8,
        textTransform: 'uppercase',
        fontWeight: '600',
        letterSpacing: 1,
    },
    totalAmount: {
        color: 'white',
        fontSize: 36,
        fontWeight: 'bold',
        letterSpacing: -1,
    },
    actionContainer: {
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
    depositButton: {
        backgroundColor: COLORS.success,
    },
    withdrawButton: {
        backgroundColor: COLORS.danger,
    },
    disabled: {
        opacity: 0.7,
    },
    actionText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 8,
    },
    actionSubtext: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
        marginTop: 2,
    }
});
