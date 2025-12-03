// ...existing code...
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, Modal, FlatList, Platform, StatusBar, SafeAreaView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { decode } from 'base64-arraybuffer';
import { COLORS, GLASS, SHADOWS } from '../constants/theme';

export default function EditProductScreen({ navigation, route }) {
    const { product } = route.params || {};
    const [name, setName] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [unitPrice, setUnitPrice] = useState('');
    const [quantity, setQuantity] = useState('0');
    const [alertThreshold, setAlertThreshold] = useState('10');
    const [sku, setSku] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [base64, setBase64] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);

    // Load categories on mount
    useEffect(() => {
        fetchCategories();
    }, []);

    // Populate fields when product is provided
    useEffect(() => {
        if (product) {
            setName(product.name || '');
            setSelectedCategory({ id: product.category_id, name: product.category_name });
            setUnitPrice(product.unit_price?.toString() || '');
            setQuantity(product.quantity?.toString() || '0');
            setAlertThreshold(product.alert_threshold?.toString() || '10');
            setSku(product.sku || '');
            setDescription(product.description || '');
            setImage(product.image_url || null);
        }
    }, [product]);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase.from('categories').select('*').order('name');
            if (error) throw error;
            setCategories(data || []);
        } catch (e) {
            console.error('Error fetching categories:', e);
            Alert.alert('Erreur', 'Impossible de charger les catégories');
        }
    };

    const handleImagePick = () => {
        Alert.alert('Ajouter une Photo', 'Choisissez une source', [
            { text: 'Appareil Photo', onPress: pickImageCamera },
            { text: 'Galerie', onPress: pickImageGallery },
            { text: 'Annuler', style: 'cancel' },
        ]);
    };

    const pickImageCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission requise', "L'accès à l'appareil photo est nécessaire pour prendre des photos.");
            return;
        }
        const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true });
        if (!result.canceled) {
            setImage(result.assets[0].uri);
            setBase64(result.assets[0].base64);
        }
    };

    const pickImageGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission requise', "L'accès à la galerie est nécessaire pour sélectionner des photos.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true });
        if (!result.canceled) {
            setImage(result.assets[0].uri);
            setBase64(result.assets[0].base64);
        }
    };

    const uploadImage = async () => {
        if (!base64) return null;
        setUploading(true);
        try {
            const filename = `product_${Date.now()}.jpg`;
            const { data, error } = await supabase.storage.from('products').upload(filename, decode(base64), { contentType: 'image/jpeg' });
            if (error) throw error;
            const publicUrlResp = await supabase.storage.from('products').getPublicUrl(filename);
            return publicUrlResp?.data?.publicUrl || publicUrlResp?.data?.public_url || null;
        } catch (e) {
            console.error('Échec du téléchargement', e);
            Alert.alert('Échec du téléchargement', e.message || String(e));
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!name || !unitPrice || !selectedCategory) {
            Alert.alert('Informations manquantes', 'Veuillez fournir le nom, la catégorie et le prix.');
            return;
        }
        setLoading(true);
        try {
            let imageUrl = image; // keep existing if not changed
            if (base64) {
                const uploaded = await uploadImage();
                if (uploaded) imageUrl = uploaded;
            }
            const payload = {
                name,
                category_id: selectedCategory.id ?? selectedCategory.value ?? null,
                unit_price: parseFloat(unitPrice) || 0,
                quantity: parseInt(quantity) || 0,
                alert_threshold: parseInt(alertThreshold) || 0,
                sku: sku || null,
                description: description || null,
                image_url: imageUrl || null,
            };
            if (product && product.id) {
                const { error } = await supabase.from('products').update(payload).eq('id', product.id);
                if (error) throw error;
                Alert.alert('Succès', 'Produit mis à jour avec succès');
            } else {
                const { error } = await supabase.from('products').insert([payload]);
                if (error) throw error;
                Alert.alert('Succès', 'Produit ajouté avec succès');
            }
            navigation.goBack();
        } catch (e) {
            console.error(e);
            Alert.alert('Erreur', "Échec de l'opération. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    const incrementQuantity = () => setQuantity(prev => (parseInt(prev || '0') + 1).toString());
    const decrementQuantity = () => setQuantity(prev => Math.max(0, parseInt(prev || '0') - 1).toString());

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.blobTop} />
            <View style={styles.blobBottom} />
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{product ? 'Modifier le Produit' : 'Nouveau Produit'}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.glassCard}>
                    <TouchableOpacity style={styles.imageContainer} onPress={handleImagePick}>
                        {image ? (
                            <Image source={{ uri: image }} style={styles.image} />
                        ) : (
                            <View style={styles.placeholder}>
                                <Ionicons name="camera" size={32} color={COLORS.primary} />
                                <Text style={styles.addPhotoText}>Ajouter une Photo</Text>
                            </View>
                        )}
                        <View style={styles.editIcon}>
                            <Ionicons name="pencil" size={16} color="white" />
                        </View>
                    </TouchableOpacity>

                    {/* Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nom du Produit</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="ex. Chanel No. 5"
                            placeholderTextColor={COLORS.textLight}
                        />
                    </View>

                    {/* Category */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Catégorie</Text>
                        <TouchableOpacity style={styles.select} onPress={() => setShowCategoryModal(true)}>
                            <Text style={styles.selectText}>{selectedCategory ? selectedCategory.name : 'Sélectionner une catégorie'}</Text>
                            <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                        </TouchableOpacity>
                    </View>

                    {/* Price */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Prix Unitaire (CFA)</Text>
                        <TextInput
                            style={styles.input}
                            value={unitPrice}
                            onChangeText={setUnitPrice}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={COLORS.textLight}
                        />
                    </View>

                    {/* Quantity */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Quantité</Text>
                        <View style={styles.quantityContainer}>
                            <TouchableOpacity onPress={decrementQuantity} style={styles.qtyButton}>
                                <Ionicons name="remove" size={20} color="white" />
                            </TouchableOpacity>
                            <Text style={styles.qtyValue}>{quantity}</Text>
                            <TouchableOpacity onPress={incrementQuantity} style={styles.qtyButton}>
                                <Ionicons name="add" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Alert Threshold */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Seuil d'Alerte</Text>
                        <TextInput
                            style={styles.input}
                            value={alertThreshold}
                            onChangeText={setAlertThreshold}
                            keyboardType="numeric"
                            placeholder="10"
                            placeholderTextColor={COLORS.textLight}
                        />
                    </View>

                    {/* SKU */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>SKU (optionnel)</Text>
                        <TextInput
                            style={styles.input}
                            value={sku}
                            onChangeText={setSku}
                            placeholder="SKU12345"
                            placeholderTextColor={COLORS.textLight}
                        />
                    </View>

                    {/* Description */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            placeholder="Détails du produit"
                            placeholderTextColor={COLORS.textLight}
                        />
                    </View>

                    {/* Submit */}
                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading || uploading}>
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.submitText}>{product ? 'Mettre à jour' : 'Enregistrer'}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Category Modal */}
            <Modal visible={showCategoryModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Sélectionner une catégorie</Text>
                        <FlatList
                            data={categories}
                            keyExtractor={item => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modalItem} onPress={() => { setSelectedCategory(item); setShowCategoryModal(false); }}>
                                    <Text style={styles.modalItemText}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={styles.modalClose} onPress={() => setShowCategoryModal(false)}>
                            <Ionicons name="close" size={24} color={COLORS.primary} />
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
        paddingBottom: 100,
    },
    glassCard: {
        ...GLASS.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    imageContainer: {
        alignSelf: 'center',
        marginBottom: 20,
        ...SHADOWS.medium,
    },
    image: {
        width: 120,
        height: 120,
        borderRadius: 20,
    },
    placeholder: {
        width: 120,
        height: 120,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    addPhotoText: {
        marginTop: 8,
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    editIcon: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: COLORS.primary,
        borderRadius: 15,
        padding: 6,
        borderWidth: 2,
        borderColor: 'white',
    },
    inputGroup: {
        marginBottom: 15,
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
    select: {
        ...GLASS.input,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectText: {
        fontSize: 16,
        color: COLORS.text,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 12,
        padding: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    qtyButton: {
        backgroundColor: COLORS.primary,
        padding: 10,
        borderRadius: 10,
        width: 40,
        alignItems: 'center',
    },
    qtyValue: {
        marginHorizontal: 20,
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        minWidth: 40,
        textAlign: 'center',
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
        ...SHADOWS.medium,
    },
    submitText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        maxHeight: '70%',
        ...SHADOWS.medium,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: COLORS.primary,
        textAlign: 'center',
    },
    modalItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    modalItemText: {
        fontSize: 16,
        color: COLORS.text,
    },
    modalClose: {
        position: 'absolute',
        top: 15,
        right: 15,
        padding: 5,
    },
});
// ...existing code...