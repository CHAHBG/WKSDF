import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, GLASS, SHADOWS } from '../constants/theme';

export default function ShopSetupScreen({ navigation, route }) {
    const { refreshProfile } = useAuth();
    const [shopName, setShopName] = useState('');
    const [location, setLocation] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!shopName.trim()) {
            Alert.alert('Erreur', 'Le nom de la boutique est requis');
            return;
        }

        setLoading(true);
        try {
            // Get current user ID
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Save shop settings
            const { data: shopData, error: shopError } = await supabase
                .from('shop_settings')
                .insert([{
                    shop_name: shopName.trim(),
                    location: location.trim() || null,
                    phone_number: phoneNumber.trim() || null,
                    email: email.trim() || null,
                    logo_url: null,
                    owner_id: user.id
                }])
                .select()
                .single();

            if (shopError) throw shopError;

            // Create owner profile
            const { error: profileError } = await supabase
                .from('users_profile')
                .insert([{
                    id: user.id,
                    shop_id: shopData.id,
                    role: 'owner',
                    full_name: shopName.trim(), // Can be updated later
                    phone_number: phoneNumber.trim() || null,
                    created_by: user.id
                }]);

            if (profileError) throw profileError;

            // Refresh profile in context so App.js updates the view
            await refreshProfile();

            // Navigate back - App.js will detect the profile exists and show Main
            Alert.alert('Succès', 'Paramètres de la boutique enregistrés!', [
                { text: 'OK', onPress: () => { } } // No need to navigate back manually if App.js updates, but safe to keep empty or remove
            ]);
        } catch (error) {
            console.error('Error saving shop settings:', error);
            Alert.alert('Erreur', `Échec de l'enregistrement: ${error.message || 'Erreur inconnue'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.blobTop} />
            <View style={styles.blobBottom} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Ionicons name="storefront" size={64} color={COLORS.primary} />
                    <Text style={styles.title}>Configuration de la Boutique</Text>
                    <Text style={styles.subtitle}>Configurez les informations de votre boutique</Text>

                    {/* Temporary logout button for debugging */}
                    <Pressable
                        onPress={async () => {
                            await supabase.auth.signOut();
                            Alert.alert('Déconnecté', 'Vous avez été déconnecté');
                        }}
                        style={{ marginTop: 10, padding: 8, backgroundColor: '#f87171', borderRadius: 8 }}
                    >
                        <Text style={{ color: 'white', fontSize: 12 }}>Se déconnecter (Debug)</Text>
                    </Pressable>
                </View>

                <View style={styles.glassCard}>
                    {/* Shop Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nom de la Boutique *</Text>
                        <TextInput
                            style={styles.input}
                            value={shopName}
                            onChangeText={setShopName}
                            placeholder="Ex: NESS Boutique"
                            placeholderTextColor={COLORS.textLight}
                        />
                    </View>

                    {/* Location */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Localisation</Text>
                        <TextInput
                            style={styles.input}
                            value={location}
                            onChangeText={setLocation}
                            placeholder="Ex: Dakar, Sénégal"
                            placeholderTextColor={COLORS.textLight}
                        />
                    </View>

                    {/* Phone Number */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Numéro de Téléphone</Text>
                        <TextInput
                            style={styles.input}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            placeholder="Ex: +221 77 123 45 67"
                            placeholderTextColor={COLORS.textLight}
                            keyboardType="phone-pad"
                        />
                    </View>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Ex: contact@wakeur.sn"
                            placeholderTextColor={COLORS.textLight}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <Pressable
                        style={[styles.button, loading && styles.disabledButton]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Enregistrer et Continuer</Text>
                        )}
                    </Pressable>
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
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
    },
    glassCard: {
        ...GLASS.card,
        borderRadius: 16,
        padding: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.textLight,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        ...GLASS.input,
    },
    button: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        ...SHADOWS.medium,
    },
    disabledButton: {
        opacity: 0.7,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
