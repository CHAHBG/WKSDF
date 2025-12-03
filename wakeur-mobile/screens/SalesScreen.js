import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, GLASS, SHADOWS } from '../constants/theme';

export default function SalesScreen({ navigation }) {
    const { user, userProfile } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [processing, setProcessing] = useState(false);
    const [showCart, setShowCart] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                supabase.from('v_inventory_with_avoir').select('*').order('name'),
                supabase.from('categories').select('*').order('name')
            ]);

            if (productsRes.error) throw productsRes.error;
            if (categoriesRes.error) throw categoriesRes.error;

            setProducts(productsRes.data || []);
            setCategories(categoriesRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Erreur', 'Impossible de charger les données');
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.cartQuantity >= product.quantity) {
                    Alert.alert('Stock insuffisant', `Seulement ${product.quantity} disponibles`);
                    return prev;
                }
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, cartQuantity: item.cartQuantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, cartQuantity: 1 }];
        });
    };

    const updateQuantity = (productId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQuantity = item.cartQuantity + delta;
                if (newQuantity > item.quantity) {
                    Alert.alert('Stock insuffisant');
                    return item;
                }
                if (newQuantity <= 0) return null; // Will filter out later
                return { ...item, cartQuantity: newQuantity };
            }
            return item;
        }).filter(Boolean));
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const cartTotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.unit_price * item.cartQuantity), 0);
    }, [cart]);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setProcessing(true);

        try {
            // 1. Create Sale Record
            const { data: saleData, error: saleError } = await supabase
                .from('sales')
                .insert([{
                    shop_id: userProfile?.shop_id,
                    amount: cartTotal,
                    items: cart,
                    payment_method: 'CASH',
                    status: 'COMPLETED',
                    customer_name: 'Client Mobile',
                    created_by: user?.id
                }])
                .select()
                .single();

            if (saleError) throw saleError;

            // 2. Create Sale Items (Best effort)
            const saleItems = cart.map(item => ({
                sale_id: saleData.id,
                product_id: item.id,
                product_name: item.name,
                quantity: item.cartQuantity,
                unit_price: item.unit_price,
                total_price: item.unit_price * item.cartQuantity
            }));

            const { error: itemsError } = await supabase
                .from('sale_items')
                .insert(saleItems);

            if (itemsError) console.log('Sale items insert skipped/failed', itemsError);

            // 3. Update Inventory Stock
            for (const item of cart) {
                const { error: stockError } = await supabase
                    .from('products')
                    .update({ quantity: item.quantity - item.cartQuantity })
                    .eq('id', item.id);

                if (stockError) throw stockError;
            }

            setCart([]);
            setShowCart(false);
            fetchData();
            Alert.alert('Succès', 'Vente enregistrée avec succès !');

        } catch (error) {
            console.error('Checkout error:', error);
            Alert.alert('Erreur', 'Échec de la vente: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || p.category_id === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const renderProduct = ({ item }) => (
        <TouchableOpacity
            style={[styles.productCard, item.quantity === 0 && styles.productCardDisabled]}
            onPress={() => item.quantity > 0 && addToCart(item)}
            disabled={item.quantity === 0}
        >
            <View style={styles.productImageContainer}>
                {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.productImage} />
                ) : (
                    <Ionicons name="cube" size={24} color={COLORS.primary} />
                )}
                {item.quantity > 0 && (
                    <View style={styles.addOverlay}>
                        <Ionicons name="add" size={20} color="white" />
                    </View>
                )}
            </View>
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.productPrice}>{(item.unit_price || 0).toLocaleString()} F</Text>
                <Text style={[styles.productStock, item.quantity === 0 ? styles.textRed : styles.textGreen]}>
                    {item.quantity === 0 ? 'Rupture' : `${item.quantity} en stock`}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderCategory = ({ item }) => (
        <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === item.id && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(item.id === selectedCategory ? 'All' : item.id)}
        >
            <Text style={[styles.categoryText, selectedCategory === item.id && styles.categoryTextActive]}>
                {item.name}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Point de Vente</Text>
                <TouchableOpacity style={styles.cartButton} onPress={() => setShowCart(true)}>
                    <Ionicons name="cart" size={24} color={COLORS.primary} />
                    {cart.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{cart.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Search & Categories */}
            <View style={styles.filterContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={COLORS.textLight} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <FlatList
                    horizontal
                    data={[{ id: 'All', name: 'Tout' }, ...categories]}
                    renderItem={renderCategory}
                    keyExtractor={item => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryList}
                />
            </View>

            {/* Product Grid */}
            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={filteredProducts}
                    renderItem={renderProduct}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.productList}
                    columnWrapperStyle={styles.columnWrapper}
                />
            )}

            {/* Cart Modal */}
            <Modal visible={showCart} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Panier ({cart.length})</Text>
                        <TouchableOpacity onPress={() => setShowCart(false)}>
                            <Ionicons name="close" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={cart}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.cartList}
                        renderItem={({ item }) => (
                            <View style={styles.cartItem}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cartItemName}>{item.name}</Text>
                                    <Text style={styles.cartItemPrice}>{(item.unit_price || 0).toLocaleString()} F</Text>
                                </View>
                                <View style={styles.quantityControls}>
                                    <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.qtyBtn}>
                                        <Ionicons name="remove" size={16} color={COLORS.text} />
                                    </TouchableOpacity>
                                    <Text style={styles.qtyText}>{item.cartQuantity}</Text>
                                    <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.qtyBtn}>
                                        <Ionicons name="add" size={16} color={COLORS.text} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.itemTotal}>{((item.unit_price || 0) * item.cartQuantity).toLocaleString()} F</Text>
                            </View>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyCart}>
                                <Ionicons name="cart-outline" size={64} color={COLORS.lightGray} />
                                <Text style={styles.emptyCartText}>Votre panier est vide</Text>
                            </View>
                        }
                    />

                    <View style={styles.footer}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalAmount}>{(cartTotal || 0).toLocaleString()} F</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.checkoutButton, (cart.length === 0 || processing) && styles.disabledButton]}
                            onPress={handleCheckout}
                            disabled={cart.length === 0 || processing}
                        >
                            {processing ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.checkoutButtonText}>Valider la Vente</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    cartButton: {
        padding: 8,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: COLORS.accent,
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    filterContainer: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    categoryList: {
        paddingRight: 20,
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
    },
    categoryChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    categoryText: {
        color: COLORS.textLight,
        fontWeight: '600',
    },
    categoryTextActive: {
        color: 'white',
    },
    productList: {
        padding: 20,
        paddingTop: 10,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    productCard: {
        width: '48%',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 12,
        ...SHADOWS.small,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
    },
    productCardDisabled: {
        opacity: 0.6,
    },
    productImageContainer: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    addOverlay: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        padding: 4,
    },
    productInfo: {
        gap: 4,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        height: 40,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    productStock: {
        fontSize: 12,
        fontWeight: '500',
    },
    textGreen: { color: COLORS.success },
    textRed: { color: COLORS.danger },

    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
        backgroundColor: COLORS.white,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    cartList: {
        padding: 20,
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        ...SHADOWS.small,
    },
    cartItemName: {
        fontWeight: '600',
        color: COLORS.text,
    },
    cartItemPrice: {
        color: COLORS.textLight,
        fontSize: 12,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 8,
        padding: 4,
        marginHorizontal: 12,
    },
    qtyBtn: {
        padding: 4,
    },
    qtyText: {
        width: 24,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    itemTotal: {
        fontWeight: 'bold',
        color: COLORS.primary,
        width: 70,
        textAlign: 'right',
    },
    emptyCart: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        opacity: 0.5,
    },
    emptyCartText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        padding: 20,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
        paddingBottom: 40,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 18,
        color: COLORS.textLight,
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    checkoutButton: {
        backgroundColor: COLORS.success,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    disabledButton: {
        backgroundColor: COLORS.gray,
        opacity: 0.7,
    },
    checkoutButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
