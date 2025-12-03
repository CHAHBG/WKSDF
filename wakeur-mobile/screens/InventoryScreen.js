import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, StatusBar, Image, Alert, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, GLASS, SHADOWS } from '../constants/theme';

export default function InventoryScreen({ navigation }) {
    const { isOwner } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('v_inventory_with_avoir')
                .select('*')
                .order('name');

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchProducts();
    };

    const handleDelete = async (product) => {
        Alert.alert(
            'Confirmer la suppression',
            `Êtes-vous sûr de vouloir supprimer "${product.name}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('products')
                                .delete()
                                .eq('id', product.id);

                            if (error) throw error;

                            Alert.alert('Succès', 'Produit supprimé');
                            fetchProducts();
                        } catch (error) {
                            console.error('Error deleting product:', error);
                            Alert.alert('Erreur', 'Impossible de supprimer le produit');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => {
        const isLowStock = item.quantity <= (item.alert_threshold || 5);
        const userIsOwner = isOwner();

        return (
            <View style={styles.card}>
                <View style={styles.cardContent}>
                    <View style={styles.cardLeft}>
                        <View style={styles.imageContainer}>
                            {item.image_url ? (
                                <Image
                                    source={{ uri: item.image_url }}
                                    style={styles.productImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <Ionicons name="cube" size={28} color={COLORS.primary} />
                            )}
                        </View>
                        <View style={styles.productInfo}>
                            <Text style={styles.productName}>{item.name}</Text>
                            <Text style={styles.categoryName}>{item.category_name}</Text>
                            <View style={styles.priceRow}>
                                <Ionicons name="pricetag" size={14} color={COLORS.primary} />
                                <Text style={styles.price}>{item.unit_price?.toLocaleString() || 0} F</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.cardRight}>
                        <View style={[styles.stockBadge, isLowStock ? styles.stockBadgeLow : styles.stockBadgeNormal]}>
                            <Text style={[styles.stockText, isLowStock ? styles.stockTextLow : styles.stockTextNormal]}>
                                {item.quantity}
                            </Text>
                            <Text style={[styles.stockLabel, isLowStock ? styles.stockTextLow : styles.stockTextNormal]}>
                                stock
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Only show action buttons to owners */}
                {userIsOwner && (
                    <View style={styles.cardActions}>
                        <Pressable
                            onPress={() => navigation.navigate('Restock', { product: item })}
                            style={[styles.actionButton, { backgroundColor: 'rgba(5, 150, 105, 0.1)' }]}
                        >
                            <Ionicons name="add-circle" size={18} color={COLORS.success} />
                            <Text style={[styles.actionButtonText, { color: COLORS.success }]}>Restock</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => navigation.navigate('EditProduct', { product: item })}
                            style={[styles.actionButton, { backgroundColor: 'rgba(47, 78, 178, 0.1)' }]}
                        >
                            <Ionicons name="create" size={18} color={COLORS.primary} />
                            <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>Modifier</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => handleDelete(item)}
                            style={[styles.actionButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                        >
                            <Ionicons name="trash" size={18} color={COLORS.danger} />
                            <Text style={[styles.actionButtonText, { color: COLORS.danger }]}>Supprimer</Text>
                        </Pressable>
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.blobTop} />
            <View style={styles.blobBottom} />
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Inventaire</Text>
                    <Text style={styles.headerSubtitle}>{products.length} produits • {isOwner() ? 'Gestion complète' : 'Lecture seule'}</Text>
                </View>
                {/* Only owners can add products */}
                {isOwner() && (
                    <TouchableOpacity
                        onPress={() => navigation.navigate('AddProduct')}
                        style={styles.addButton}
                    >
                        <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={products}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[COLORS.primary]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons name="cube-outline" size={48} color={COLORS.primary} />
                        </View>
                        <Text style={styles.emptyText}>Aucun produit en stock</Text>
                        {isOwner() && (
                            <Text style={styles.emptySubText}>Appuyez sur + pour ajouter votre premier produit</Text>
                        )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: 13,
        color: COLORS.textLight,
        marginTop: 4,
        fontWeight: '500',
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
    listContent: {
        padding: 24,
        paddingTop: 8,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        ...SHADOWS.small,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    imageContainer: {
        width: 60,
        height: 60,
        borderRadius: 16,
        backgroundColor: 'rgba(241, 245, 249, 1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    categoryName: {
        fontSize: 12,
        color: COLORS.textLight,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: '600',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    price: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.primary,
    },
    cardRight: {
        alignItems: 'flex-end',
        paddingLeft: 8,
    },
    stockBadge: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
        minWidth: 64,
    },
    stockBadgeNormal: {
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
    },
    stockBadgeLow: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    stockText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    stockTextNormal: {
        color: COLORS.success,
    },
    stockTextLow: {
        color: COLORS.danger,
    },
    stockLabel: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 16,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        gap: 6,
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '700',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
});
