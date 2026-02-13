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
    XMarkIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

const formatCurrency = (val) => new Intl.NumberFormat('fr-FR').format(Math.round(val || 0)) + ' CFA';

export default function Inventory() {
    const { userProfile } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [categories, setCategories] = useState([]);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

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
        if (!userProfile?.shop_id) {
            setProducts([]);
            setCategories([]);
            setLoading(false);
            return;
        }

        fetchProducts();
        fetchCategories();
    }, [userProfile?.shop_id]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('v_inventory_with_avoir')
                .select('*')
                .eq('shop_id', userProfile.shop_id)
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
                .eq('shop_id', userProfile.shop_id)
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
        } catch (error) {
            console.error('Error adding product:', error);
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
                .eq('id', editingProduct.id)
                .eq('shop_id', userProfile?.shop_id);

            if (error) throw error;

            setShowEditModal(false);
            setEditingProduct(null);
            fetchProducts();
        } catch (error) {
            console.error('Error updating product:', error);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || String(p.category_id) === String(selectedCategory);
        return matchesSearch && matchesCategory;
    });

    const stats = {
        totalStock: products.reduce((acc, curr) => acc + (curr.quantity || 0), 0),
        totalAvoir: products.reduce((acc, curr) => acc + (curr.avoir || 0), 0),
        totalRealMoney: products.reduce((acc, curr) => acc + (curr.real_money || 0), 0),
        lowStockCount: products.filter(p => p.quantity <= (p.alert_threshold || 10)).length
    };

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Inventaire</h1>
                    <p className="mt-2 text-slate-500 font-medium">Gérez vos produits, surveillez vos stocks et suivez vos actifs.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchProducts}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all dark:bg-slate-900 dark:border-slate-800"
                    >
                        <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 font-bold text-sm"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Nouveau Produit
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="metric-card-new group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 mb-4">
                        <CubeIcon className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unités en Stock</p>
                    <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{stats.totalStock.toLocaleString()}</p>
                </div>
                <div className="metric-card-new group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 mb-4">
                        <CurrencyDollarIcon className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valeur Réelle</p>
                    <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(stats.totalRealMoney).split(' ')[0]}</p>
                </div>
                <div className="metric-card-new group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 mb-4">
                        <ChartBarIcon className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avoir Potentiel</p>
                    <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(stats.totalAvoir).split(' ')[0]}</p>
                </div>
                <div className="metric-card-new group">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stats.lowStockCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'} mb-4`}>
                        <XMarkIcon className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alertes Stock</p>
                    <p className={`mt-1 text-2xl font-black ${stats.lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{stats.lowStockCount}</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un produit..."
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="relative min-w-[200px]">
                    <FunnelIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <select
                        className="w-full pl-12 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-600 appearance-none"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="all">Toutes les catégories</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Table */}
            <div className="premium-card overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Produit</th>
                                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Catégorie</th>
                                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Prix Unitaire</th>
                                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Stock</th>
                                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Avoir / Real</th>
                                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="6" className="px-8 py-20 text-center text-slate-400 font-bold animate-pulse">Chargement de l&apos;inventaire...</td></tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan="6" className="px-8 py-20 text-center text-slate-400 font-bold italic">Aucun produit ne correspond à votre recherche.</td></tr>
                            ) : (
                                filteredProducts.map((p) => {
                                    const isLow = p.quantity <= (p.alert_threshold || 10);
                                    return (
                                        <tr key={p.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform duration-300">
                                                        <CubeIcon className="w-6 h-6" />
                                                    </div>
                                                    <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                                    {p.category_name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right font-black text-slate-700 dark:text-slate-300">
                                                {formatCurrency(p.unit_price)}
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`text-sm font-black ${isLow ? 'text-rose-600' : 'text-emerald-500'}`}>
                                                        {p.quantity}
                                                    </span>
                                                    <div className="w-12 h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                            style={{ width: `${Math.min(100, (p.quantity / (p.alert_threshold || 10)) * 50)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs font-black text-amber-600">{formatCurrency(p.avoir)}</span>
                                                    <span className="text-[10px] font-bold text-emerald-500">{formatCurrency(p.real_money)}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    onClick={() => handleEditClick(p)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                                                >
                                                    <PencilIcon className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals - Simplified for redesign context */}
            {(showAddModal || showEditModal) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                                {showAddModal ? "Ajouter un produit" : "Modifier le produit"}
                            </h2>
                            <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={showAddModal ? handleAddProduct : handleUpdateProduct} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Désignation</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900 dark:text-white"
                                    value={showAddModal ? newProduct.name : editProduct.name}
                                    onChange={e => showAddModal ? setNewProduct({ ...newProduct, name: e.target.value }) : setEditProduct({ ...editProduct, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Catégorie</label>
                                    <select
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-600 appearance-none"
                                        value={showAddModal ? newProduct.category_id : editProduct.category_id}
                                        onChange={e => showAddModal ? setNewProduct({ ...newProduct, category_id: e.target.value }) : setEditProduct({ ...editProduct, category_id: e.target.value })}
                                    >
                                        <option value="">Sélectionner</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Prix Vente</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900 dark:text-white"
                                        value={showAddModal ? newProduct.price : editProduct.price}
                                        onChange={e => showAddModal ? setNewProduct({ ...newProduct, price: e.target.value }) : setEditProduct({ ...editProduct, price: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Quantité</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900 dark:text-white"
                                        value={showAddModal ? newProduct.quantity : editProduct.quantity}
                                        onChange={e => showAddModal ? setNewProduct({ ...newProduct, quantity: e.target.value }) : setEditProduct({ ...editProduct, quantity: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Alerte Stock</label>
                                    <input
                                        type="number"
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900 dark:text-white"
                                        value={showAddModal ? newProduct.alert_threshold : editProduct.alert_threshold}
                                        onChange={e => showAddModal ? setNewProduct({ ...newProduct, alert_threshold: e.target.value }) : setEditProduct({ ...editProduct, alert_threshold: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
                            >
                                {showAddModal ? "Créer maintenant" : "Enregistrer les modifications"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
