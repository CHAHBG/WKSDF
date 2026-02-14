import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { supabase } from '../services/supabase';
import { COLORS, GLASS, SHADOWS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_DURATION_MS = 60 * 1000;
const RESET_EMAIL_COOLDOWN_MS = 30 * 1000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value) => value.trim().toLowerCase();

export default function LoginScreen({ navigation }) {
    const { loginAsAgent } = useAuth();
    const [isAgentLogin, setIsAgentLogin] = useState(false);

    // Admin state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Agent state
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [showCode, setShowCode] = useState(false);

    // Security state
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockUntil, setLockUntil] = useState(0);
    const [resetCooldownUntil, setResetCooldownUntil] = useState(0);
    const [nowMs, setNowMs] = useState(Date.now());

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    const isLocked = !isAgentLogin && lockUntil > nowMs;
    const lockSecondsRemaining = Math.max(Math.ceil((lockUntil - nowMs) / 1000), 0);
    const isResetCoolingDown = !isAgentLogin && resetCooldownUntil > nowMs;
    const resetCooldownSeconds = Math.max(Math.ceil((resetCooldownUntil - nowMs) / 1000), 0);

    useEffect(() => {
        const hasCountdown = lockUntil > Date.now() || resetCooldownUntil > Date.now();
        if (!hasCountdown) return undefined;

        const interval = setInterval(() => setNowMs(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [lockUntil, resetCooldownUntil]);

    const switchMode = (agentMode) => {
        setIsAgentLogin(agentMode);
        setError('');
        setInfo('');
    };

    async function handleForgotPassword() {
        Keyboard.dismiss();
        if (loading) return;

        setError('');
        setInfo('');

        const normalizedEmail = normalizeEmail(email);
        if (!EMAIL_REGEX.test(normalizedEmail)) {
            setError('Veuillez saisir un email valide puis reessayer.');
            return;
        }

        if (isResetCoolingDown) {
            setInfo(`Nouvelle demande possible dans ${resetCooldownSeconds}s.`);
            return;
        }

        setLoading(true);
        try {
            const redirectTo = Linking.createURL('reset-password');
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
                redirectTo,
            });

            if (resetError) {
                if (/rate limit/i.test(resetError.message || '')) {
                    throw new Error('Trop de demandes de reinitialisation. Patientez un moment.');
                }
                throw new Error('Impossible d envoyer l email de reinitialisation pour le moment.');
            }

            setResetCooldownUntil(Date.now() + RESET_EMAIL_COOLDOWN_MS);
            setInfo('Si ce compte existe, un email de reinitialisation a ete envoye.');
            Alert.alert(
                'Email envoye',
                'Ouvrez le lien de reinitialisation. Si l application est installee, elle peut ouvrir la page de changement de mot de passe.'
            );
        } catch (requestError) {
            setError(requestError.message || 'Erreur lors de la demande de reinitialisation.');
        } finally {
            setLoading(false);
        }
    }

    async function handleLogin() {
        Keyboard.dismiss();
        if (loading) return;

        setLoading(true);
        setError('');
        setInfo('');

        try {
            if (isAgentLogin) {
                const sanitizedPhone = phone.replace(/\D/g, '');
                const sanitizedCode = code.replace(/\D/g, '');

                if (!sanitizedPhone || !sanitizedCode) {
                    throw new Error('Veuillez saisir le telephone et le code PIN.');
                }

                const result = await loginAsAgent(sanitizedPhone, sanitizedCode);
                if (!result.success) {
                    throw new Error(result.error || 'Connexion agent impossible.');
                }

                return;
            }

            if (isLocked) {
                throw new Error(`Compte temporairement bloque. Reessayez dans ${lockSecondsRemaining}s.`);
            }

            const normalizedEmail = normalizeEmail(email);
            if (!EMAIL_REGEX.test(normalizedEmail) || !password) {
                throw new Error('Veuillez saisir un email valide et un mot de passe.');
            }

            const { error: loginError } = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password,
            });

            if (loginError) {
                if (/invalid login credentials/i.test(loginError.message || '')) {
                    const nextAttempts = failedAttempts + 1;
                    if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
                        setFailedAttempts(0);
                        setLockUntil(Date.now() + LOGIN_LOCK_DURATION_MS);
                        throw new Error(`Trop de tentatives. Reessayez dans ${Math.ceil(LOGIN_LOCK_DURATION_MS / 1000)}s.`);
                    }
                    setFailedAttempts(nextAttempts);
                    throw new Error('Email ou mot de passe incorrect.');
                }

                throw new Error(loginError.message || 'Connexion impossible.');
            }

            setFailedAttempts(0);
            setLockUntil(0);
        } catch (loginFlowError) {
            setError(loginFlowError.message || 'Connexion impossible.');
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
                    <View style={styles.blobTop} />
                    <View style={styles.blobBottom} />

                    <View style={styles.contentContainer}>
                        <View style={styles.headerContainer}>
                            <Text style={styles.title}>NESS</Text>
                            <Text style={styles.subtitle}>
                                {isAgentLogin ? 'Espace Agent' : 'Connexion Administration'}
                            </Text>
                        </View>

                        <View style={styles.glassContainer}>
                            <View style={styles.toggleContainer}>
                                <Pressable
                                    onPress={() => switchMode(false)}
                                    style={[styles.toggleButton, !isAgentLogin && styles.activeToggle]}
                                >
                                    <Text style={[styles.toggleText, !isAgentLogin && styles.activeToggleText]}>Administration</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => switchMode(true)}
                                    style={[styles.toggleButton, isAgentLogin && styles.activeToggle]}
                                >
                                    <Text style={[styles.toggleText, isAgentLogin && styles.activeToggleText]}>Agent</Text>
                                </Pressable>
                            </View>

                            {!!error && <Text style={styles.errorBanner}>{error}</Text>}
                            {!!info && <Text style={styles.infoBanner}>{info}</Text>}
                            {isLocked && <Text style={styles.warningBanner}>Connexion temporairement bloquee ({lockSecondsRemaining}s).</Text>}

                            {!isAgentLogin ? (
                                <>
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.label}>Email</Text>
                                        <TextInput
                                            onChangeText={setEmail}
                                            value={email}
                                            placeholder="email@adresse.com"
                                            placeholderTextColor={COLORS.textLight}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                            autoComplete="email"
                                            style={styles.input}
                                        />
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <Text style={styles.label}>Mot de passe</Text>
                                        <View style={styles.inputWithAction}>
                                            <TextInput
                                                onChangeText={setPassword}
                                                value={password}
                                                secureTextEntry={!showPassword}
                                                placeholder="Votre mot de passe"
                                                placeholderTextColor={COLORS.textLight}
                                                autoCapitalize="none"
                                                autoComplete="password"
                                                style={[styles.input, styles.inputFlex]}
                                            />
                                            <Pressable onPress={() => setShowPassword((value) => !value)} style={styles.inputAction}>
                                                <Text style={styles.inputActionText}>{showPassword ? 'Masquer' : 'Voir'}</Text>
                                            </Pressable>
                                        </View>
                                    </View>

                                    <View style={styles.forgotRow}>
                                        <Pressable disabled={loading} onPress={handleForgotPassword} style={styles.forgotButton}>
                                            <Text style={styles.forgotButtonText}>Mot de passe oublie ?</Text>
                                        </Pressable>
                                        {isResetCoolingDown && (
                                            <Text style={styles.cooldownText}>{resetCooldownSeconds}s</Text>
                                        )}
                                    </View>
                                </>
                            ) : (
                                <>
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.label}>Telephone</Text>
                                        <TextInput
                                            onChangeText={setPhone}
                                            value={phone}
                                            placeholder="77 123 45 67"
                                            placeholderTextColor={COLORS.textLight}
                                            keyboardType="phone-pad"
                                            autoComplete="tel"
                                            style={styles.input}
                                        />
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <Text style={styles.label}>Code PIN</Text>
                                        <View style={styles.inputWithAction}>
                                            <TextInput
                                                onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
                                                value={code}
                                                secureTextEntry={!showCode}
                                                placeholder="0000"
                                                placeholderTextColor={COLORS.textLight}
                                                keyboardType="number-pad"
                                                maxLength={4}
                                                style={[styles.input, styles.inputFlex, styles.pinInput]}
                                            />
                                            <Pressable onPress={() => setShowCode((value) => !value)} style={styles.inputAction}>
                                                <Text style={styles.inputActionText}>{showCode ? 'Masquer' : 'Voir'}</Text>
                                            </Pressable>
                                        </View>
                                    </View>
                                </>
                            )}

                            <Pressable disabled={loading || isLocked} onPress={handleLogin} style={styles.button}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Se connecter</Text>}
                            </Pressable>

                            {!isAgentLogin && (
                                <Pressable disabled={loading} onPress={() => navigation.navigate('SignUp')} style={styles.secondaryButton}>
                                    <Text style={styles.secondaryButtonText}>Creer un compte</Text>
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
        backgroundColor: 'rgba(15, 23, 42, 0.1)',
    },
    blobBottom: {
        position: 'absolute',
        bottom: -50,
        left: -50,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(217, 119, 6, 0.1)',
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
        marginBottom: 20,
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
    errorBanner: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        borderColor: '#fecaca',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        marginBottom: 10,
    },
    infoBanner: {
        backgroundColor: '#dcfce7',
        color: '#166534',
        borderColor: '#bbf7d0',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        marginBottom: 10,
    },
    warningBanner: {
        backgroundColor: '#fef3c7',
        color: '#92400e',
        borderColor: '#fde68a',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        marginBottom: 10,
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
    inputWithAction: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputFlex: {
        flex: 1,
    },
    inputAction: {
        position: 'absolute',
        right: 14,
        paddingVertical: 6,
        paddingHorizontal: 4,
    },
    inputActionText: {
        color: COLORS.textLight,
        fontWeight: '700',
        fontSize: 12,
    },
    pinInput: {
        letterSpacing: 8,
        fontSize: 18,
    },
    forgotRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: -10,
        marginBottom: 10,
    },
    forgotButton: {
        paddingVertical: 8,
        paddingHorizontal: 6,
    },
    forgotButtonText: {
        color: COLORS.textLight,
        fontWeight: '600',
        fontSize: 14,
    },
    cooldownText: {
        color: COLORS.textLight,
        fontWeight: '600',
        fontSize: 12,
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 6,
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
