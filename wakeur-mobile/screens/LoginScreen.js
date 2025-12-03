import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { COLORS, GLASS, SHADOWS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
    const { loginAsAgent } = useAuth();
    const [isAgentLogin, setIsAgentLogin] = useState(false);

    // Admin State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Agent State
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');

    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        Keyboard.dismiss();
        setLoading(true);
        try {
            if (isAgentLogin) {
                // Agent Login
                if (!phone || !code) {
                    Alert.alert('Erreur', 'Veuillez saisir le téléphone et le code PIN');
                    setLoading(false);
                    return;
                }
                const result = await loginAsAgent(phone, code);
                if (!result.success) {
                    Alert.alert('Erreur', result.error);
                }
                // Navigation is handled by AuthContext state change
            } else {
                // Admin Login
                if (!email || !password) {
                    Alert.alert('Erreur', 'Veuillez saisir l\'email et le mot de passe');
                    setLoading(false);
                    return;
                }

                const trimmedEmail = email.trim();
                console.log('Attempting admin login with:', trimmedEmail);

                const { error } = await supabase.auth.signInWithPassword({
                    email: trimmedEmail,
                    password: password,
                });
                if (error) {
                    console.error('Admin login error:', error);
                    Alert.alert('Erreur', error.message);
                }
            }
        } catch (error) {
            Alert.alert('Erreur', error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    {/* Background Elements */}
                    <View style={styles.blobTop} />
                    <View style={styles.blobBottom} />

                    <View style={styles.contentContainer}>
                        <View style={styles.headerContainer}>
                            <Text style={styles.title}>Wakeur Sokhna</Text>
                            <Text style={styles.subtitle}>
                                {isAgentLogin ? 'Espace Agent' : 'Bienvenue sur votre espace'}
                            </Text>
                        </View>

                        <View style={styles.glassContainer}>
                            {/* Toggle Switch */}
                            <View style={styles.toggleContainer}>
                                <Pressable
                                    onPress={() => setIsAgentLogin(false)}
                                    style={[styles.toggleButton, !isAgentLogin && styles.activeToggle]}
                                >
                                    <Text style={[styles.toggleText, !isAgentLogin && styles.activeToggleText]}>Administration</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => setIsAgentLogin(true)}
                                    style={[styles.toggleButton, isAgentLogin && styles.activeToggle]}
                                >
                                    <Text style={[styles.toggleText, isAgentLogin && styles.activeToggleText]}>Agent</Text>
                                </Pressable>
                            </View>

                            {!isAgentLogin ? (
                                <>
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.label}>Email</Text>
                                        <TextInput
                                            onChangeText={(text) => setEmail(text)}
                                            value={email}
                                            placeholder="email@adresse.com"
                                            placeholderTextColor={COLORS.textLight}
                                            autoCapitalize={'none'}
                                            style={styles.input}
                                        />
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <Text style={styles.label}>Mot de passe</Text>
                                        <TextInput
                                            onChangeText={(text) => setPassword(text)}
                                            value={password}
                                            secureTextEntry={true}
                                            placeholder="Votre mot de passe"
                                            placeholderTextColor={COLORS.textLight}
                                            autoCapitalize={'none'}
                                            style={styles.input}
                                        />
                                    </View>
                                </>
                            ) : (
                                <>
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.label}>Téléphone</Text>
                                        <TextInput
                                            onChangeText={(text) => setPhone(text)}
                                            value={phone}
                                            placeholder="77 123 45 67"
                                            placeholderTextColor={COLORS.textLight}
                                            keyboardType="phone-pad"
                                            style={styles.input}
                                        />
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <Text style={styles.label}>Code PIN</Text>
                                        <TextInput
                                            onChangeText={(text) => setCode(text)}
                                            value={code}
                                            secureTextEntry={true}
                                            placeholder="••••"
                                            placeholderTextColor={COLORS.textLight}
                                            keyboardType="number-pad"
                                            maxLength={4}
                                            style={[styles.input, { letterSpacing: 8, fontSize: 18 }]}
                                        />
                                    </View>
                                </>
                            )}

                            <Pressable disabled={loading} onPress={handleLogin} style={styles.button}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Se connecter</Text>}
                            </Pressable>

                            {!isAgentLogin && (
                                <Pressable disabled={loading} onPress={() => navigation.navigate('SignUp')} style={styles.secondaryButton}>
                                    <Text style={styles.secondaryButtonText}>Créer un compte</Text>
                                </Pressable>
                            )}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
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
        backgroundColor: 'rgba(15, 23, 42, 0.1)', // Primary with opacity
    },
    blobBottom: {
        position: 'absolute',
        bottom: -50,
        left: -50,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(217, 119, 6, 0.1)', // Accent with opacity
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    headerContainer: {
        marginBottom: 30,
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
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
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeToggle: {
        backgroundColor: COLORS.white,
        ...SHADOWS.small,
    },
    toggleText: {
        fontWeight: '600',
        color: COLORS.textLight,
        fontSize: 14,
    },
    activeToggleText: {
        color: COLORS.primary,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.textLight,
        marginBottom: 8,
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
    secondaryButton: {
        marginTop: 16,
        alignItems: 'center',
        padding: 10,
    },
    secondaryButtonText: {
        color: COLORS.textLight,
        fontWeight: '600',
        fontSize: 14,
    },
});
