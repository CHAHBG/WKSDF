import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { supabase } from '../services/supabase';
import { COLORS, GLASS, SHADOWS } from '../constants/theme';

const PASSWORD_RULES = [
    { key: 'length', label: '10 caracteres minimum', test: (value) => value.length >= 10 },
    { key: 'upper', label: 'Une lettre majuscule', test: (value) => /[A-Z]/.test(value) },
    { key: 'lower', label: 'Une lettre minuscule', test: (value) => /[a-z]/.test(value) },
    { key: 'digit', label: 'Un chiffre', test: (value) => /\d/.test(value) },
    { key: 'symbol', label: 'Un caractere special', test: (value) => /[^A-Za-z0-9]/.test(value) },
];

const parseRecoveryTokens = (url) => {
    if (!url) return { code: null, accessToken: null, refreshToken: null };

    const [basePart, hashPart = ''] = url.split('#');
    const queryString = basePart.includes('?') ? basePart.split('?')[1] : '';
    const queryParams = new URLSearchParams(queryString);
    const hashParams = new URLSearchParams(hashPart);

    return {
        code: queryParams.get('code') || hashParams.get('code'),
        accessToken: hashParams.get('access_token') || queryParams.get('access_token'),
        refreshToken: hashParams.get('refresh_token') || queryParams.get('refresh_token'),
    };
};

export default function ResetPasswordScreen({ navigation }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [checkingLink, setCheckingLink] = useState(true);
    const [hasRecoverySession, setHasRecoverySession] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    const passwordChecks = useMemo(
        () =>
            PASSWORD_RULES.map((rule) => ({
                ...rule,
                passed: rule.test(password),
            })),
        [password],
    );

    const isPasswordStrongEnough = useMemo(
        () => passwordChecks.every((rule) => rule.passed),
        [passwordChecks],
    );

    useEffect(() => {
        let mounted = true;

        const applyUrlToSession = async (incomingUrl) => {
            const { code, accessToken, refreshToken } = parseRecoveryTokens(incomingUrl);

            if (code) {
                const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                if (exchangeError) throw exchangeError;
                return true;
            }

            if (accessToken && refreshToken) {
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });
                if (sessionError) throw sessionError;
                return true;
            }

            return false;
        };

        const refreshSessionState = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (mounted) setHasRecoverySession(Boolean(session));
        };

        const bootstrap = async () => {
            setCheckingLink(true);
            setError('');

            try {
                const initialUrl = await Linking.getInitialURL();
                if (initialUrl) {
                    await applyUrlToSession(initialUrl);
                }

                await refreshSessionState();
            } catch {
                if (mounted) {
                    setHasRecoverySession(false);
                    setError('Lien de reinitialisation invalide ou expire. Demandez un nouveau lien.');
                }
            } finally {
                if (mounted) setCheckingLink(false);
            }
        };

        bootstrap();

        const linkListener = Linking.addEventListener('url', async ({ url }) => {
            if (!mounted) return;
            try {
                await applyUrlToSession(url);
                await refreshSessionState();
            } catch {
                setHasRecoverySession(false);
                setError('Lien de reinitialisation invalide ou expire. Demandez un nouveau lien.');
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!mounted) return;

            if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                setHasRecoverySession(Boolean(session));
            }

            if (event === 'SIGNED_OUT') {
                setHasRecoverySession(false);
            }
        });

        return () => {
            mounted = false;
            linkListener.remove();
            subscription.unsubscribe();
        };
    }, []);

    const handleSubmit = async () => {
        if (loading || checkingLink) return;

        setError('');
        setInfo('');

        if (!hasRecoverySession) {
            setError('Session de reinitialisation absente. Demandez un nouveau lien.');
            return;
        }

        if (!isPasswordStrongEnough) {
            setError('Le mot de passe ne respecte pas toutes les regles de securite.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Les deux mots de passe ne correspondent pas.');
            return;
        }

        setLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) {
                throw updateError;
            }

            setInfo('Mot de passe mis a jour. Vous pouvez vous reconnecter.');

            await supabase.auth.signOut();
            Alert.alert('Succes', 'Mot de passe mis a jour.', [
                {
                    text: 'OK',
                    onPress: () => navigation.navigate('Login'),
                },
            ]);
        } catch (updateFlowError) {
            if (/session/i.test(updateFlowError.message || '')) {
                setError('Session de reinitialisation expiree. Demandez un nouveau lien.');
            } else {
                setError(updateFlowError.message || 'Impossible de mettre a jour le mot de passe.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
                <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                    <View style={styles.card}>
                        <Text style={styles.title}>Nouveau mot de passe</Text>
                        <Text style={styles.subtitle}>Saisissez un mot de passe robuste pour proteger votre compte.</Text>

                        {checkingLink && (
                            <View style={styles.inlineBox}>
                                <ActivityIndicator color={COLORS.primary} />
                                <Text style={styles.inlineBoxText}>Verification du lien...</Text>
                            </View>
                        )}

                        {!!error && <Text style={styles.errorBanner}>{error}</Text>}
                        {!!info && <Text style={styles.infoBanner}>{info}</Text>}

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Nouveau mot de passe</Text>
                            <View style={styles.inputWithAction}>
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoComplete="password-new"
                                    editable={!loading && !checkingLink && hasRecoverySession}
                                    placeholder="Votre nouveau mot de passe"
                                    placeholderTextColor={COLORS.textLight}
                                    style={[styles.input, styles.inputFlex]}
                                />
                                <Pressable onPress={() => setShowPassword((value) => !value)} style={styles.inputAction}>
                                    <Text style={styles.inputActionText}>{showPassword ? 'Masquer' : 'Voir'}</Text>
                                </Pressable>
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Confirmer</Text>
                            <View style={styles.inputWithAction}>
                                <TextInput
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                    autoComplete="password-new"
                                    editable={!loading && !checkingLink && hasRecoverySession}
                                    placeholder="Confirmez le mot de passe"
                                    placeholderTextColor={COLORS.textLight}
                                    style={[styles.input, styles.inputFlex]}
                                />
                                <Pressable onPress={() => setShowConfirmPassword((value) => !value)} style={styles.inputAction}>
                                    <Text style={styles.inputActionText}>{showConfirmPassword ? 'Masquer' : 'Voir'}</Text>
                                </Pressable>
                            </View>
                        </View>

                        <View style={styles.rulesBox}>
                            <Text style={styles.rulesTitle}>Regles mot de passe</Text>
                            {passwordChecks.map((rule) => (
                                <Text key={rule.key} style={[styles.ruleText, rule.passed && styles.ruleTextOk]}>
                                    {rule.passed ? 'OK' : '...'} {rule.label}
                                </Text>
                            ))}
                        </View>

                        <Pressable
                            onPress={handleSubmit}
                            disabled={loading || checkingLink || !hasRecoverySession}
                            style={[styles.button, (loading || checkingLink || !hasRecoverySession) && styles.buttonDisabled]}
                        >
                            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Mettre a jour</Text>}
                        </Pressable>

                        <Pressable onPress={() => navigation.navigate('Login')} style={styles.secondaryButton}>
                            <Text style={styles.secondaryButtonText}>Retour a la connexion</Text>
                        </Pressable>
                    </View>
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
    flex: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        ...GLASS.panel,
        borderRadius: 24,
        padding: 22,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.primary,
    },
    subtitle: {
        marginTop: 8,
        fontSize: 14,
        color: COLORS.textLight,
        marginBottom: 18,
    },
    inlineBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    inlineBoxText: {
        marginLeft: 10,
        color: COLORS.textLight,
        fontSize: 13,
        fontWeight: '600',
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
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textLight,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputWithAction: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        ...GLASS.input,
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
    rulesBox: {
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    rulesTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textLight,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    ruleText: {
        fontSize: 13,
        color: COLORS.textLight,
        marginBottom: 4,
    },
    ruleTextOk: {
        color: COLORS.success,
        fontWeight: '700',
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    buttonDisabled: {
        opacity: 0.65,
    },
    buttonText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: 16,
    },
    secondaryButton: {
        marginTop: 14,
        alignItems: 'center',
        paddingVertical: 8,
    },
    secondaryButtonText: {
        color: COLORS.textLight,
        fontWeight: '600',
        fontSize: 14,
    },
});
