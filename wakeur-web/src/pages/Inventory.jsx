import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    CubeIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

export default function Inventory() {
    const { userProfile } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [categories, setCategories] = useState([]);
    const [editingProduct, setEditingProduct] = useState(null);

    // Form State
    const [newProduct, setNewProduct] = useState({
        name: '',
        category_id: '',
        price: '',
        quantity: '',
        alert_threshold: '10'
    });

    const [editProduct, setEditProduct] = useState({
        name: '',
        category_id: '',
        price: '',
        quantity: '',
        alert_threshold: '10'
    });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
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
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');
            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('products')
                .insert([{
                    name: newProduct.name,
                    category_id: newProduct.category_id,
                    unit_price: parseFloat(newProduct.price),
                    quantity: parseInt(newProduct.quantity),
                    alert_threshold: parseInt(newProduct.alert_threshold),
                    shop_id: userProfile?.shop_id
                }]);

            if (error) throw error;

            setShowAddModal(false);
            setNewProduct({ name: '', category_id: '', price: '', quantity: '', alert_threshold: '10' });
            fetchProducts();
            alert('Produit ajouté avec succès !');
        } catch (error) {
            console.error('Error adding product:', error);
            alert('Échec de l\'ajout du produit');
        }
    };

    const handleEditClick = (product) => {
        setEditingProduct(product);
        setEditProduct({
            name: product.name,
            category_id: product.category_id,
            price: product.unit_price.toString(),
            quantity: product.quantity.toString(),
            alert_threshold: product.alert_threshold?.toString() || '10'
        });
        setShowEditModal(true);
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('products')
                .update({
                    name: editProduct.name,
                    category_id: editProduct.category_id,
                    unit_price: parseFloat(editProduct.price),
                    quantity: parseInt(editProduct.quantity),
                    alert_threshold: parseInt(editProduct.alert_threshold)
                })
                .eq('id', editingProduct.id);

            if (error) throw error;

            setShowEditModal(false);
            setEditingProduct(null);
            fetchProducts();
            alert('Produit modifié avec succès !');
        } catch (error) {
            console.error('Error updating product:', error);
            alert('Échec de la modification du produit');
        }
    };

    // Stats Calculation
    const totalStock = products.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    const totalAvoir = products.reduce((acc, curr) => acc + (curr.avoir || 0), 0);
    const totalRealMoney = products.reduce((acc, curr) => acc + (curr.real_money || 0), 0);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header & Stats */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Gestion de l'Inventaire
                        </h1>
                        <p className="text-gray-500 text-lg">Suivez votre stock, valeur et gains</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Ajouter un Produit
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <CubeIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Stock Total</p>
                            <p className="text-2xl font-bold text-gray-800">{totalStock.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
                            <ChartBarIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Avoir Total (Potentiel)</p>
                            <p className="text-2xl font-bold text-gray-800">{totalAvoir.toLocaleString()} CFA</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-green-50 rounded-xl text-green-600">
                            <CurrencyDollarIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Argent Réel Gagné</p>
                            <p className="text-2xl font-bold text-gray-800">{totalRealMoney.toLocaleString()} CFA</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Produit</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Catégorie</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Prix</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Avoir</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Real Money</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">Chargement de l'inventaire...</td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">Aucun produit trouvé</td></tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                                    {product.image_url ? (
                                                        <img className="h-10 w-10 rounded-lg object-cover" src={product.image_url} alt="" />
                                                    ) : (
                                                        <CubeIcon className="w-6 h-6" />
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-50 text-blue-700">
                                                {product.category_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                            {product.unit_price?.toLocaleString() || 0} CFA
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${product.quantity < (product.alert_threshold || 10)
                                                ? 'bg-red-50 text-red-700'
                                                : 'bg-green-50 text-green-700'
                                                }`}>
                                                {product.quantity} Unités
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600">
                                            {product.avoir?.toLocaleString()} CFA
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                            {product.real_money?.toLocaleString()} CFA
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEditClick(product)}
                                                className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                                Modifier
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Ajouter un Nouveau Produit</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddProduct} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Produit</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    value={newProduct.name}
                                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    value={newProduct.category_id}
                                    onChange={e => setNewProduct({ ...newProduct, category_id: e.target.value })}
                                >
                                    <option value="">Sélectionner une catégorie</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (CFA)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                        value={newProduct.price}
                                        onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Initial</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                        value={newProduct.quantity}
                                        onChange={e => setNewProduct({ ...newProduct, quantity: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 mt-4"
                            >
                                Créer le Produit
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Product Modal */}
            {showEditModal && editingProduct && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Modifier le Produit</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateProduct} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Produit</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    value={editProduct.name}
                                    onChange={e => setEditProduct({ ...editProduct, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    value={editProduct.category_id}
                                    onChange={e => setEditProduct({ ...editProduct, category_id: e.target.value })}
                                >
                                    <option value="">Sélectionner une catégorie</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix (CFA)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                        value={editProduct.price}
                                        onChange={e => setEditProduct({ ...editProduct, price: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                        value={editProduct.quantity}
                                        onChange={e => setEditProduct({ ...editProduct, quantity: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 mt-4"
                            >
                                Mettre à Jour
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
