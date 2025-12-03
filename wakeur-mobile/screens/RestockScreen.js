import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator, Modal, FlatList, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { COLORS, GLASS, SHADOWS } from '../constants/theme';

export default function RestockScreen({ navigation }) {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [products, setProducts] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [quantity, setQuantity] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');
            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('name');

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error("Error fetching products:", error);
            Alert.alert("Error", "Failed to load products");
        }
    };

    const getFilteredProducts = () => {
        if (!selectedCategory) return [];
        if (!searchText) {
            return products.filter(p => p.category_id === selectedCategory.id);
        }
        return products.filter(p =>
            p.category_id === selectedCategory.id &&
            p.name.toLowerCase().includes(searchText.toLowerCase())
        );
    };

    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setSearchText(product.name);
        setShowSuggestions(false);
    };

    const handleSubmit = async () => {
        if (!selectedProduct) {
            Alert.alert('Produit Requis', 'Veuillez sélectionner un produit dans la liste de suggestions');
            return;
        }

        if (!quantity || parseInt(quantity) <= 0) {
            Alert.alert('Quantité Requise', 'Veuillez entrer une quantité valide (supérieure à 0)');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('movements')
                .insert({
                    product_id: selectedProduct.id,
                    movement_type: 'Entrée',
                    quantity: parseInt(quantity),
                    unit_price: unitPrice ? parseFloat(unitPrice) : (selectedProduct.price || selectedProduct.unit_price || 0),
                    comment: comment || 'Restock'
                });

            if (error) throw error;

            Alert.alert('Succès', 'Stock mis à jour avec succès');
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', 'Échec de la mise à jour du stock');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.blobTop} />
            <View style={styles.blobBottom} />
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                </Pressable>
                <Text style={styles.headerTitle}>Réapprovisionner</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={styles.glassCard}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Catégorie</Text>
                        <Pressable style={styles.selectInput} onPress={() => setShowCategoryModal(true)}>
                            <Text style={[styles.selectText, !selectedCategory && styles.placeholderText]}>
                                {selectedCategory ? selectedCategory.name : 'Sélectionner une catégorie'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                        </Pressable>
                    </View>

                    <View style={[styles.inputGroup, { zIndex: 10 }]}>
                        <Text style={styles.label}>Nom du Produit</Text>
                        <TextInput
                            style={[styles.input, !selectedCategory && styles.disabledInput]}
                            value={searchText}
                            onChangeText={(text) => {
                                setSearchText(text);
                                setSelectedProduct(null);
                                setShowSuggestions(true);
                            }}
                            placeholder="Taper pour rechercher..."
                            editable={!!selectedCategory}
                            onFocus={() => setShowSuggestions(true)}
                            placeholderTextColor={COLORS.textLight}
                        />
                        {showSuggestions && (searchText.length > 0 || selectedCategory) && (
                            <View style={styles.suggestionsContainer}>
                                {getFilteredProducts().map((item) => (
                                    <Pressable
                                        key={item.id}
                                        style={styles.suggestionItem}
                                        onPress={() => handleProductSelect(item)}
                                    >
                                        <Text style={styles.suggestionText}>{item.name}</Text>
                                        <Text style={styles.suggestionSubText}>Stock Actuel: {item.quantity}</Text>
                                    </Pressable>
                                ))}
                                {getFilteredProducts().length === 0 && (
                                    <View>
                                        <View style={styles.suggestionItem}>
                                            <Text style={{ color: COLORS.textLight, fontStyle: 'italic' }}>Aucun produit correspondant</Text>
                                        </View>
                                        <Pressable
                                            style={styles.createProductButton}
                                            onPress={() => {
                                                setShowSuggestions(false);
                                                navigation.navigate('AddProduct');
                                            }}
                                        >
                                            <Ionicons name="add-circle" size={20} color={COLORS.primary} />
                                            <Text style={styles.createProductText}>Créer "{searchText}" comme nouveau produit</Text>
                                        </Pressable>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Quantité à Ajouter</Text>
                            <TextInput
                                style={styles.input}
                                value={quantity}
                                onChangeText={setQuantity}
                                placeholder="0"
                                keyboardType="numeric"
                                placeholderTextColor={COLORS.textLight}
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                            <Text style={styles.label}>Coût Unitaire (Opt)</Text>
                            <TextInput
                                style={styles.input}
                                value={unitPrice}
                                onChangeText={setUnitPrice}
                                placeholder={selectedProduct ? (selectedProduct.price || selectedProduct.unit_price || "0").toString() : "0"}
                                keyboardType="numeric"
                                placeholderTextColor={COLORS.textLight}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Commentaire / Raison</Text>
                        <TextInput
                            style={styles.input}
                            value={comment}
                            onChangeText={setComment}
                            placeholder="ex. Livraison hebdomadaire"
                            placeholderTextColor={COLORS.textLight}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.disabledButton]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Confirmer le Réapprovisionnement</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal visible={showCategoryModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Sélectionner une Catégorie</Text>
                            <Pressable onPress={() => setShowCategoryModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </Pressable>
                        </View>
                        <FlatList
                            data={categories}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <Pressable
                                    style={styles.categoryItem}
                                    onPress={() => {
                                        setSelectedCategory(item);
                                        setSearchText('');
                                        setSelectedProduct(null);
                                        setShowCategoryModal(false);
                                        setShowSuggestions(true);
                                    }}
                                >
                                    <View style={[styles.categoryIcon, { backgroundColor: 'rgba(47, 78, 178, 0.1)' }]}>
                                        <Ionicons name="pricetag" size={18} color={COLORS.primary} />
                                    </View>
                                    <Text style={styles.categoryText}>{item.name}</Text>
                                    {selectedCategory?.id === item.id && (
                                        <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                                    )}
                                </Pressable>
                            )}
                        />
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
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
    },
    backButton: {
        marginRight: 16,
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    headerTitle: {
        color: COLORS.primary,
        fontSize: 24,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    glassCard: {
        ...GLASS.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
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
    disabledInput: {
        opacity: 0.5,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    selectInput: {
        ...GLASS.input,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectText: {
        fontSize: 16,
        color: COLORS.text,
    },
    placeholderText: {
        color: COLORS.textLight,
    },
    suggestionsContainer: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        borderTopWidth: 0,
        maxHeight: 200,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        ...SHADOWS.medium,
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    suggestionItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    suggestionText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
    },
    suggestionSubText: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 2,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    button: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
        ...SHADOWS.medium,
    },
    disabledButton: {
        opacity: 0.7,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 20,
        maxHeight: '80%',
        ...SHADOWS.medium,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    categoryIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    categoryText: {
        fontSize: 16,
        color: COLORS.text,
        flex: 1,
    },
    createProductButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(47, 78, 178, 0.05)',
        paddingVertical: 12,
        paddingHorizontal: 15,
        marginHorizontal: 10,
        marginBottom: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(47, 78, 178, 0.2)',
        borderStyle: 'dashed',
    },
    createProductText: {
        marginLeft: 8,
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
        flex: 1,
    },
});
