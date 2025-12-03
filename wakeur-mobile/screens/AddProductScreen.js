import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, Modal, FlatList, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { decode } from 'base64-arraybuffer';
import { useAuth } from '../contexts/AuthContext';

export default function AddProductScreen({ navigation }) {
    const { userProfile } = useAuth();
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

    useEffect(() => {
        fetchCategories();
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
            Alert.alert("Erreur", "Échec du chargement des catégories");
        }
    };

    const handleImagePick = () => {
        Alert.alert(
            "Ajouter une Photo",
            "Choisissez une source",
            [
                { text: "Appareil Photo", onPress: pickImageCamera },
                { text: "Galerie", onPress: pickImageGallery },
                { text: "Annuler", style: "cancel" }
            ]
        );
    };

    const pickImageCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission requise", "L'accès à l'appareil photo est nécessaire pour prendre des photos.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            setBase64(result.assets[0].base64);
        }
    };

    const pickImageGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission requise", "L'accès à la galerie est nécessaire pour sélectionner des photos.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

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
            const { data, error } = await supabase.storage
                .from('products')
                .upload(filename, decode(base64), {
                    contentType: 'image/jpeg',
                });

            if (error) throw error;

            const publicUrlResp = await supabase.storage.from('products').getPublicUrl(filename);
            const publicUrl = publicUrlResp?.data?.publicUrl || publicUrlResp?.data?.public_url || null;
            return publicUrl;
        } catch (error) {
            console.error("Échec du téléchargement", error);
            Alert.alert("Échec du téléchargement", error.message || String(error));
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
            let imageUrl = null;
            if (base64) {
                imageUrl = await uploadImage();
            }

            const productPayload = {
                name,
                category_id: selectedCategory?.id ?? selectedCategory?.value ?? null,
                unit_price: parseFloat(unitPrice) || 0,
                quantity: parseInt(quantity) || 0,
                alert_threshold: parseInt(alertThreshold) || 0,
                sku: sku || null,
                description: description || null,
                image_url: imageUrl || null,
                shop_id: userProfile?.shop_id,
            };

            const { data: insertData, error: insertError } = await supabase
                .from('products')
                .insert([productPayload]);

            if (insertError) throw insertError;

            Alert.alert('Succès', 'Produit ajouté avec succès !');
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', 'Échec de l\'ajout du produit. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    const incrementQuantity = () => setQuantity((prev) => (parseInt(prev || '0') + 1).toString());
    const decrementQuantity = () => setQuantity((prev) => Math.max(0, parseInt(prev || '0') - 1).toString());

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2f4eb2" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nouveau Produit</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.imageContainer} onPress={handleImagePick}>
                        {image ? (
                            <Image source={{ uri: image }} style={styles.image} />
                        ) : (
                            <View style={styles.placeholder}>
                                <Ionicons name="camera" size={32} color="#2f4eb2" />
                                <Text style={styles.addPhotoText}>Ajouter une Photo</Text>
                            </View>
                        )}
                        <View style={styles.editIcon}>
                            <Ionicons name="pencil" size={16} color="white" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nom du Produit</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="ex. Chanel No. 5"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Catégorie</Text>
                        <TouchableOpacity style={styles.selectInput} onPress={() => setShowCategoryModal(true)}>
                            <Text style={[styles.selectText, !selectedCategory && styles.placeholderText]}>
                                {selectedCategory ? selectedCategory.name : 'Sélectionner une catégorie'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Prix (CFA)</Text>
                            <TextInput
                                style={styles.input}
                                value={unitPrice}
                                onChangeText={setUnitPrice}
                                placeholder="0"
                                keyboardType="numeric"
                                placeholderTextColor="#999"
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                            <Text style={styles.label}>Stock Initial</Text>
                            <View style={styles.quantityContainer}>
                                <TouchableOpacity onPress={decrementQuantity} style={styles.qtyBtn}>
                                    <Ionicons name="remove" size={20} color="#2f4eb2" />
                                </TouchableOpacity>
                                <TextInput
                                    style={styles.qtyInput}
                                    value={quantity}
                                    onChangeText={setQuantity}
                                    keyboardType="numeric"
                                    textAlign="center"
                                />
                                <TouchableOpacity onPress={incrementQuantity} style={styles.qtyBtn}>
                                    <Ionicons name="add" size={20} color="#2f4eb2" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.expandHeader}
                        onPress={() => { /* Optional: Toggle advanced fields */ }}
                    >
                        <Text style={styles.sectionTitle}>Détails Optionnels</Text>
                    </TouchableOpacity>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Seuil d'Alerte</Text>
                        <TextInput
                            style={styles.input}
                            value={alertThreshold}
                            onChangeText={setAlertThreshold}
                            placeholder="10"
                            keyboardType="numeric"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>SKU / Code</Text>
                        <TextInput
                            style={styles.input}
                            value={sku}
                            onChangeText={setSku}
                            placeholder="Optionnel"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Ajouter des détails..."
                            multiline
                            numberOfLines={3}
                            placeholderTextColor="#999"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, (loading || uploading) && styles.disabledButton]}
                        onPress={handleSubmit}
                        disabled={loading || uploading}
                    >
                        {loading || uploading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Enregistrer le Produit</Text>
                        )}
                    </TouchableOpacity>
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal visible={showCategoryModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Sélectionner une Catégorie</Text>
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={categories}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.categoryItem}
                                    onPress={() => {
                                        setSelectedCategory(item);
                                        setShowCategoryModal(false);
                                    }}
                                >
                                    <View style={[styles.categoryIcon, { backgroundColor: '#eef2ff' }]}>
                                        <Ionicons name="pricetag" size={18} color="#2f4eb2" />
                                    </View>
                                    <Text style={styles.categoryText}>{item.name}</Text>
                                    {selectedCategory?.id === item.id && (
                                        <Ionicons name="checkmark" size={20} color="#2f4eb2" />
                                    )}
                                </TouchableOpacity>
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
        backgroundColor: '#2f4eb2',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 20,
        paddingTop: 25,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        marginBottom: 20,
    },
    imageContainer: {
        alignSelf: 'center',
        marginBottom: 25,
        position: 'relative',
    },
    image: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#f0f0f0',
    },
    placeholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#eef2ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#dae0f2',
        borderStyle: 'dashed',
    },
    addPhotoText: {
        color: '#2f4eb2',
        fontSize: 12,
        marginTop: 5,
        fontWeight: '600',
    },
    editIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#2f4eb2',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        color: '#666',
        marginBottom: 8,
        fontWeight: '500',
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#eee',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    selectInput: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
    },
    selectText: {
        fontSize: 16,
        color: '#333',
    },
    placeholderText: {
        color: '#999',
    },
    row: {
        flexDirection: 'row',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        overflow: 'hidden',
    },
    qtyBtn: {
        padding: 12,
        backgroundColor: '#fff',
    },
    qtyInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#f8f9fa',
        textAlign: 'center',
    },
    expandHeader: {
        paddingVertical: 12,
        marginTop: 10,
        marginBottom: 5,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2f4eb2',
    },
    button: {
        backgroundColor: '#2f4eb2',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#2f4eb2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    disabledButton: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
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
        paddingTop: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    categoryIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    categoryText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
});