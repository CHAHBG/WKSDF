import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, TextInput, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, GLASS, SHADOWS } from '../constants/theme';

export default function AgentManagementScreen({ navigation }) {
    const { userProfile, isOwner } = useAuth();
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newAgent, setNewAgent] = useState({
        email: '',
        password: '',
        fullName: '',
        phoneNumber: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOwner()) {
            fetchAgents();
        }
    }, [userProfile]);

    const fetchAgents = async () => {
        try {
            const { data, error } = await supabase
                .from('users_profile')
                .select('*')
                .eq('shop_id', userProfile.shop_id)
                .eq('role', 'agent')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAgents(data || []);
        } catch (error) {
            console.error('Error fetching agents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAgent = async () => {
        // Agent creation requires admin privileges and should be done via web dashboard
        Alert.alert(
            'Créer un Agent',
            'Pour des raisons de sécurité, la création d\'agents doit être effectuée depuis le tableau de bord web.\n\nVeuillez vous connecter au portail web pour ajouter de nouveaux agents.',
            [{ text: 'OK' }]
        );
        setShowAddForm(false);
    };

    const toggleAgentStatus = async (agent) => {
        try {
            const { error } = await supabase
                .from('users_profile')
                .update({ is_active: !agent.is_active })
                .eq('id', agent.id);

            if (error) throw error;
            fetchAgents();
        } catch (error) {
            console.error('Error toggling agent status:', error);
            Alert.alert('Erreur', 'Échec de mise à jour du statut');
        }
    };

    if (!isOwner()) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="lock-closed" size={64} color={COLORS.error} />
                    <Text style={styles.errorText}>Accès réservé aux propriétaires</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    const renderAgent = ({ item }) => (
        <View style={styles.agentCard}>
            <View style={styles.agentInfo}>
                <View style={[styles.statusBadge, item.is_active ? styles.activeBadge : styles.inactiveBadge]}>
                    <Text style={styles.statusText}>{item.is_active ? 'Actif' : 'Inactif'}</Text>
                </View>
                <Text style={styles.agentName}>{item.full_name}</Text>
                <Text style={styles.agentPhone}>{item.phone_number || 'Aucun téléphone'}</Text>
                <Text style={styles.agentDate}>
                    Créé le {new Date(item.created_at).toLocaleDateString('fr-FR')}
                </Text>
            </View>
            <Pressable
                style={styles.toggleButton}
                onPress={() => toggleAgentStatus(item)}
            >
                <Ionicons
                    name={item.is_active ? "toggle" : "toggle-outline"}
                    size={32}
                    color={item.is_active ? COLORS.success : COLORS.textLight}
                />
            </Pressable>
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
                <Text style={styles.title}>Gestion des Agents</Text>
                <Pressable onPress={() => setShowAddForm(!showAddForm)} style={styles.addButton}>
                    <Ionicons name={showAddForm ? "close" : "add"} size={24} color="white" />
                </Pressable>
            </View>

            {showAddForm && (
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>Nouvel Agent</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Nom complet *"
                        value={newAgent.fullName}
                        onChangeText={(text) => setNewAgent({ ...newAgent, fullName: text })}
                        placeholderTextColor={COLORS.textLight}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Email *"
                        value={newAgent.email}
                        onChangeText={(text) => setNewAgent({ ...newAgent, email: text })}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor={COLORS.textLight}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Mot de passe *"
                        value={newAgent.password}
                        onChangeText={(text) => setNewAgent({ ...newAgent, password: text })}
                        secureTextEntry
                        placeholderTextColor={COLORS.textLight}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Téléphone"
                        value={newAgent.phoneNumber}
                        onChangeText={(text) => setNewAgent({ ...newAgent, phoneNumber: text })}
                        keyboardType="phone-pad"
                        placeholderTextColor={COLORS.textLight}
                    />

                    <Pressable
                        style={[styles.submitButton, submitting && styles.disabledButton]}
                        onPress={handleCreateAgent}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.submitButtonText}>Créer l'Agent</Text>
                        )}
                    </Pressable>
                </View>
            )}

            <FlatList
                data={agents}
                renderItem={renderAgent}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons name="people-outline" size={48} color={COLORS.primary} />
                        </View>
                        <Text style={styles.emptyText}>Aucun agent pour le moment</Text>
                        <Text style={styles.emptySubText}>Ajoutez des agents pour vous aider à gérer votre boutique</Text>
                    </View>
                }
            />
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
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 20,
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    formCard: {
        backgroundColor: COLORS.white,
        margin: 24,
        marginTop: 0,
        padding: 24,
        borderRadius: 24,
        ...SHADOWS.medium,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    formTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 20,
    },
    input: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: COLORS.text,
        marginBottom: 16,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
        ...SHADOWS.medium,
    },
    disabledButton: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    list: {
        padding: 24,
        paddingTop: 8,
    },
    agentCard: {
        backgroundColor: COLORS.white,
        flexDirection: 'row',
        padding: 20,
        marginBottom: 16,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'space-between',
        ...SHADOWS.small,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    agentInfo: {
        flex: 1,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        marginBottom: 8,
    },
    activeBadge: {
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
    },
    inactiveBadge: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: COLORS.success,
    },
    agentName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    agentPhone: {
        fontSize: 14,
        color: COLORS.textLight,
        marginBottom: 4,
    },
    agentDate: {
        fontSize: 12,
        color: COLORS.textLight,
        fontWeight: '500',
    },
    toggleButton: {
        padding: 8,
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
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        fontSize: 18,
        color: COLORS.error,
        marginTop: 16,
    },
});
