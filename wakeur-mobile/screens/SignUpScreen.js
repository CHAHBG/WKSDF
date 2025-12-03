import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GLASS, SHADOWS } from '../constants/theme';

export default function SignUpScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signUpWithEmail() {
        if (!email || !password || !confirmPassword) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (error) {
            Alert.alert('Erreur', error.message);
        } else {
            Alert.alert('Succès', 'Compte créé ! Veuillez vérifier votre email.', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
        }
        setLoading(false);
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Background Elements */}
            <View style={styles.blobTop} />
            <View style={styles.blobBottom} />

            <View style={styles.contentContainer}>
                <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                </Pressable>

                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Créer un Compte</Text>
                    <Text style={styles.subtitle}>Rejoignez Wakeur Sokhna</Text>
                </View>

                <View style={styles.glassContainer}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            onChangeText={setEmail}
                            value={email}
                            placeholder="email@adresse.com"
                            placeholderTextColor={COLORS.textLight}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Mot de passe</Text>
                        <TextInput
                            style={styles.input}
                            onChangeText={setPassword}
                            value={password}
                            secureTextEntry={true}
                            placeholder="Mot de passe"
                            placeholderTextColor={COLORS.textLight}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Confirmer le mot de passe</Text>
                        <TextInput
                            style={styles.input}
                            onChangeText={setConfirmPassword}
                            value={confirmPassword}
                            secureTextEntry={true}
                            placeholder="Confirmer le mot de passe"
                            placeholderTextColor={COLORS.textLight}
                            autoCapitalize="none"
                        />
                    </View>

                    <Pressable disabled={loading} onPress={signUpWithEmail} style={styles.button}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>S'inscrire</Text>}
                    </Pressable>
                </View>
            </View>
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
        right: -50,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
    },
    blobBottom: {
        position: 'absolute',
        bottom: -50,
        left: -50,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    headerContainer: {
        marginBottom: 30,
        alignItems: 'center',
        marginTop: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textLight,
        textAlign: 'center',
    },
    glassContainer: {
        ...GLASS.panel,
        borderRadius: 24,
        padding: 24,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.textLight,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        ...GLASS.input,
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        ...SHADOWS.medium,
    },
    buttonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
});
