import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { COLORS, GLASS, SHADOWS } from '../constants/theme';

export default function TransactionEntryScreen({ navigation }) {
    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [serviceType, setServiceType] = useState('wave');
    const [transactionType, setTransactionType] = useState('encaissement');
    const [amount, setAmount] = useState('');
    const [senderName, setSenderName] = useState('');
    const [senderPhone, setSenderPhone] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [calculatedCommission, setCalculatedCommission] = useState(0);
    const [currentBalances, setCurrentBalances] = useState({ cash: 0, operator: 0 });
    const [dailyReport, setDailyReport] = useState(null);

    useEffect(() => { fetchAgents(); }, []);

    useEffect(() => {
        if (amount && !isNaN(parseFloat(amount))) calculateCommission();
        else setCalculatedCommission(0);
    }, [amount]);

    useEffect(() => {
        if (selectedAgent && serviceType) {
            fetchBalances();
        }
    }, [selectedAgent, serviceType]);

    const fetchAgents = async () => {
        try {
            const { data, error } = await supabase.from('agents').select('*').order('name', { ascending: true });
            if (error) throw error;
            if (data?.length) { setAgents(data); setSelectedAgent(data[0].id); }
        } catch (err) { console.warn('fetchAgents error', err.message || err); }
    };

    const fetchBalances = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];

            // 1. Fetch Daily Report for Opening Balances
            const { data: report, error: reportError } = await supabase
                .from('mm_daily_reports')
                .select('*')
                .eq('report_date', today)
                .eq('is_closed', false)
                .single();

            if (reportError && reportError.code !== 'PGRST116') throw reportError;
            setDailyReport(report);

            // 2. Fetch Today's Transactions
            const { data: transactions, error: transError } = await supabase
                .from('mm_transactions')
                .select('*')
                .gte('created_at', today);

            if (transError) throw transError;

            // 3. Calculate Cash Balance
            // Cash = Opening Cash + Encaissements (Cash In) - Decaissements (Cash Out)
            // Note: In our DB, 'encaissement' = Dépôt (Client gives cash), 'decaissement' = Retrait (Agent gives cash)
            let cash = report ? (report.opening_balance || 0) : 0;

            // 4. Calculate Operator Balance
            // Operator = Opening Operator + Decaissements (Float In) - Encaissements (Float Out)
            let operator = 0;
            if (report && report.notes) {
                try {
                    const notes = JSON.parse(report.notes);
                    // Find platform ID by name (serviceType is 'wave', 'orange_money' etc)
                    // We need to map serviceType to platform ID. 
                    // Since we don't have platform IDs easily here without fetching platforms, 
                    // let's try to match by name or assume the notes structure uses IDs.
                    // The DailyOpeningScreen saves notes.platforms as { [id]: value }.
                    // We need to find the ID for the current serviceType.

                    // Let's fetch platforms to map serviceType to ID
                    const { data: platforms } = await supabase.from('mm_platforms').select('*');
                    const platform = platforms?.find(p =>
                        p.name.toLowerCase().includes(serviceType.replace('_', ' ')) ||
                        p.name.toLowerCase() === serviceType.replace('_', ' ')
                    );

                    if (platform && notes.platforms && notes.platforms[platform.id]) {
                        operator = parseFloat(notes.platforms[platform.id]) || 0;
                    }
                } catch (e) {
                    console.warn("Error parsing notes for balance", e);
                }
            }

            // Apply transactions
            (transactions || []).forEach(t => {
                // Cash impact
                if (t.type === 'encaissement') cash += (t.amount || 0);
                else if (t.type === 'decaissement') cash -= (t.amount || 0);

                // Operator impact (only for selected service)
                if (t.service === serviceType) {
                    if (t.type === 'encaissement') operator -= (t.amount || 0); // Float Out
                    else if (t.type === 'decaissement') operator += (t.amount || 0); // Float In
                }
            });

            setCurrentBalances({ cash, operator });

        } catch (error) {
            console.error("Error fetching balances:", error);
        }
    };

    const calculateCommission = () => {
        const amt = parseFloat(amount) || 0;
        setCalculatedCommission(Math.round(amt * 0.02));
    };

    const handleSubmit = async () => {
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            Alert.alert('Erreur', 'Veuillez renseigner un montant valide.');
            return;
        }

        const numAmount = parseFloat(amount);

        // Validation Logic
        if (transactionType === 'encaissement') { // Dépôt: Check Operator Balance
            if (currentBalances.operator < numAmount) {
                Alert.alert(
                    'Solde Insuffisant',
                    `Le solde ${serviceType.replace('_', ' ').toUpperCase()} est insuffisant.\nSolde: ${currentBalances.operator.toLocaleString()} F\nMontant: ${numAmount.toLocaleString()} F`
                );
                return;
            }
        } else { // Retrait: Check Cash Balance
            if (currentBalances.cash < numAmount) {
                Alert.alert(
                    'Caisse Insuffisante',
                    `Le montant en caisse est insuffisant.\nCaisse: ${currentBalances.cash.toLocaleString()} F\nMontant: ${numAmount.toLocaleString()} F`
                );
                return;
            }
        }

        setLoading(true);
        try {
            const payload = {
                agent_id: selectedAgent,
                service: serviceType,
                type: transactionType,
                amount: numAmount,
                fees: calculatedCommission,
                sender_name: senderName || null,
                sender_phone: senderPhone || null,
                recipient_name: recipientName || null,
                recipient_phone: recipientPhone || null,
                reference_number: referenceNumber || null,
                status: 'completed',
                transaction_date: new Date().toISOString(),
                daily_report_id: dailyReport?.id // Link to daily report
            };
            const { error } = await supabase.from('mm_transactions').insert(payload);
            if (error) throw error;
            Alert.alert('Succès', 'Transaction enregistrée avec succès', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (err) { console.error(err); Alert.alert('Erreur', 'Échec de l\'enregistrement de la transaction'); }
        finally { setLoading(false); }
    };

    const getServiceColor = (type) => {
        switch (type) {
            case 'wave': return '#1da1f2';
            case 'orange_money': return '#ff7900';
            case 'free': return '#d62d20';
            default: return COLORS.primary;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.blobTop} />
            <View style={styles.blobBottom} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                    </Pressable>
                    <Text style={styles.title}>Nouvelle Transaction</Text>
                </View>

                <View style={styles.glassCard}>
                    <Text style={styles.label}>Agent</Text>
                    <View style={styles.pickerContainer}>
                        <Picker selectedValue={selectedAgent} onValueChange={setSelectedAgent} style={styles.picker}>
                            {agents.map(a => <Picker.Item key={a.id} label={`${a.name} (${a.code || ''})`} value={a.id} color={COLORS.text} />)}
                        </Picker>
                    </View>
                </View>

                <View style={styles.glassCard}>
                    <Text style={styles.label}>Service</Text>
                    <View style={styles.typeContainer}>
                        {['wave', 'orange_money', 'seddo', 'free'].map(t => (
                            <Pressable key={t} style={[styles.typeBtn, serviceType === t && { backgroundColor: getServiceColor(t), borderColor: getServiceColor(t) }]} onPress={() => setServiceType(t)}>
                                <Text style={[styles.typeText, serviceType === t && styles.typeTextActive]}>{t.replace('_', ' ').toUpperCase()}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                <View style={styles.glassCard}>
                    <Text style={styles.label}>Type de Transaction</Text>
                    <View style={styles.typeContainer}>
                        <Pressable style={[styles.typeBtn, transactionType === 'encaissement' && { backgroundColor: COLORS.success, borderColor: COLORS.success }]} onPress={() => setTransactionType('encaissement')}>
                            <Ionicons name="arrow-down-circle-outline" size={18} color={transactionType === 'encaissement' ? 'white' : COLORS.text} style={{ marginRight: 5 }} />
                            <Text style={[styles.typeText, transactionType === 'encaissement' && styles.typeTextActive]}>DÉPÔT</Text>
                        </Pressable>
                        <Pressable style={[styles.typeBtn, transactionType === 'decaissement' && { backgroundColor: COLORS.danger, borderColor: COLORS.danger }]} onPress={() => setTransactionType('decaissement')}>
                            <Ionicons name="arrow-up-circle-outline" size={18} color={transactionType === 'decaissement' ? 'white' : COLORS.text} style={{ marginRight: 5 }} />
                            <Text style={[styles.typeText, transactionType === 'decaissement' && styles.typeTextActive]}>RETRAIT</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.glassCard}>
                    <Text style={styles.label}>Montant (FCFA)</Text>
                    <TextInput style={[styles.input, { fontSize: 24, fontWeight: 'bold', color: COLORS.primary }]} value={amount} onChangeText={setAmount} placeholder="0" placeholderTextColor={COLORS.textLight} keyboardType="numeric" />
                    {calculatedCommission > 0 && (
                        <View style={styles.commissionBox}>
                            <Text style={styles.commissionLabel}>Commission estimée:</Text>
                            <Text style={styles.commissionValue}>{calculatedCommission.toLocaleString()} F</Text>
                        </View>
                    )}

                    {/* Balance Display */}
                    <View style={{ marginTop: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 8 }}>
                        {transactionType === 'encaissement' ? (
                            <Text style={{ fontSize: 12, color: COLORS.textLight }}>
                                Solde {serviceType.replace('_', ' ').toUpperCase()}: <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{currentBalances.operator.toLocaleString()} F</Text>
                            </Text>
                        ) : (
                            <Text style={{ fontSize: 12, color: COLORS.textLight }}>
                                Disponible Caisse: <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{currentBalances.cash.toLocaleString()} F</Text>
                            </Text>
                        )}
                    </View>
                </View>

                <View style={styles.glassCard}>
                    <Text style={styles.sectionTitle}>Détails (Optionnel)</Text>
                    <Text style={styles.label}>Émetteur</Text>
                    <View style={styles.row}>
                        <TextInput style={[styles.input, styles.halfInput]} value={senderName} onChangeText={setSenderName} placeholder="Nom" placeholderTextColor={COLORS.textLight} />
                        <TextInput style={[styles.input, styles.halfInput]} value={senderPhone} onChangeText={setSenderPhone} placeholder="Téléphone" placeholderTextColor={COLORS.textLight} keyboardType="phone-pad" />
                    </View>
                    <Text style={styles.label}>Bénéficiaire</Text>
                    <View style={styles.row}>
                        <TextInput style={[styles.input, styles.halfInput]} value={recipientName} onChangeText={setRecipientName} placeholder="Nom" placeholderTextColor={COLORS.textLight} />
                        <TextInput style={[styles.input, styles.halfInput]} value={recipientPhone} onChangeText={setRecipientPhone} placeholder="Téléphone" placeholderTextColor={COLORS.textLight} keyboardType="phone-pad" />
                    </View>
                    <TextInput style={styles.input} value={referenceNumber} onChangeText={setReferenceNumber} placeholder="ID Transaction" placeholderTextColor={COLORS.textLight} />
                    <Pressable style={[styles.button, loading && styles.disabled]} onPress={handleSubmit} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enregistrer la Transaction</Text>}</Pressable>
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    blobTop: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(37, 99, 235, 0.05)' },
    blobBottom: { position: 'absolute', bottom: 0, left: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(5, 150, 105, 0.05)' },
    scrollContent: { padding: 20, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 10 },
    backButton: { marginRight: 16, padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.5)' },
    title: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
    glassCard: { ...GLASS.card, borderRadius: 16, padding: 16, marginBottom: 16 },
    label: { fontSize: 12, fontWeight: 'bold', color: COLORS.textLight, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginBottom: 16 },
    pickerContainer: { ...GLASS.input, padding: 0, overflow: 'hidden' },
    picker: { height: 50, width: '100%' },
    typeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeBtn: { flex: 1, minWidth: '45%', padding: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.5)', flexDirection: 'row' },
    typeText: { color: COLORS.text, fontSize: 12, fontWeight: '600' },
    typeTextActive: { color: 'white', fontWeight: 'bold' },
    input: { ...GLASS.input },
    row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    halfInput: { flex: 1, marginBottom: 0 },
    commissionBox: { backgroundColor: 'rgba(5, 150, 105, 0.1)', padding: 12, borderRadius: 12, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(5, 150, 105, 0.2)' },
    commissionLabel: { fontSize: 14, fontWeight: '600', color: COLORS.success },
    commissionValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.success },
    button: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 20, ...SHADOWS.medium },
    disabled: { opacity: 0.7 },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
