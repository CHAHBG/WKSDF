import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

export default function AddTransferScreen({ navigation }) {
    const [type, setType] = useState('Wave');
    const [amount, setAmount] = useState('');
    const [senderName, setSenderName] = useState('');
    const [senderPhone, setSenderPhone] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!amount || !senderPhone || !recipientPhone) {
            Alert.alert('Erreur', 'Veuillez remplir les champs requis (Montant, Téléphones)');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('transfers')
                .insert({
                    type: type.toLowerCase(),
                    amount: parseFloat(amount),
                    sender_name: senderName,
                    sender_phone: senderPhone,
                    recipient_name: recipientName,
                    recipient_phone: recipientPhone,
                    status: 'completed',
                    date: new Date().toISOString()
                });

            if (error) throw error;

            Alert.alert('Succès', 'Transfert enregistré avec succès');
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', 'Échec de l\'enregistrement du transfert');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2f4eb2" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nouveau Transfert Mobile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <Text style={styles.label}>Type de Service</Text>
                    <View style={styles.typeContainer}>
                        {['Wave', 'Orange Money', 'Free'].map(t => (
                            <TouchableOpacity
                                key={t}
                                style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                                onPress={() => setType(t)}
                            >
                                <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Montant (CFA) *</Text>
                    <TextInput
                        style={styles.input}
                        value={amount}
                        onChangeText={setAmount}
                        placeholder="0"
                        keyboardType="numeric"
                    />

                    <Text style={styles.sectionTitle}>Détails de l'Émetteur</Text>
                    <TextInput
                        style={styles.input}
                        value={senderName}
                        onChangeText={setSenderName}
                        placeholder="Nom de l'émetteur"
                    />
                    <TextInput
                        style={styles.input}
                        value={senderPhone}
                        onChangeText={setSenderPhone}
                        placeholder="Sender Phone *"
                        keyboardType="phone-pad"
                    />

                    <Text style={styles.sectionTitle}>Recipient Details</Text>
                    <TextInput
                        style={styles.input}
                        value={recipientName}
                        onChangeText={setRecipientName}
                        placeholder="Recipient Name"
                    />
                    <TextInput
                        style={styles.input}
                        value={recipientPhone}
                        onChangeText={setRecipientPhone}
                        placeholder="Recipient Phone *"
                        keyboardType="phone-pad"
                    />

                    <TouchableOpacity
                        style={[styles.button, loading && styles.disabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Record Transfer</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2f4eb2',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    label: {
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 10,
    },
    sectionTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        marginTop: 20,
        marginBottom: 10,
        color: '#007bff',
    },
    typeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    typeBtn: {
        flex: 1,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
        marginHorizontal: 2,
        borderRadius: 5,
    },
    typeBtnActive: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    typeText: {
        color: '#333',
    },
    typeTextActive: {
        color: 'white',
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
        marginBottom: 10,
    },
    button: {
        backgroundColor: '#2e7d32',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 50,
    },
    disabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
