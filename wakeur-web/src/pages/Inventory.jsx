import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    CubeIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    PlusIcon,
    PencilIcon,
    XMarkIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

const formatCurrency = (val) => new Intl.NumberFormat('fr-FR').format(Math.round(val || 0)) + ' F';

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

    const [formState, setFormState] = useState({
        name: '',
        category_id: '',
        unit_price: '',
        quantity: '',
        alert_threshold: '5'
    });

    useEffect(() => {
        if (userProfile?.shop_id) {
            fetchProducts();
            fetchCategories();
        }
    }, [userProfile?.shop_id]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('products')
                .select('*')
                .eq('shop_id', userProfile.shop_id)
                .order('name');
            setProducts(data || []);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        const { data } = await supabase
            .from('categories')
            .select('*')
            .eq('shop_id', userProfile.shop_id)
            .order('name');
        setCategories(data || []);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const payload = {
            ...formState,
            unit_price: parseFloat(formState.unit_price),
            quantity: parseInt(formState.quantity),
            alert_threshold: parseInt(formState.alert_threshold),
            shop_id: userProfile.shop_id
        };

        if (showEditModal) {
            await supabase.from('products').update(payload).eq('id', editingProduct.id);
        } else {
            await supabase.from('products').insert([payload]);
        }

        setShowAddModal(false);
        setShowEditModal(false);
        fetchProducts();
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || String(p.category_id) === String(selectedCategory);
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Inventaire</h1>
                    <p className="mt-1 text-zinc-500 text-sm">Gestion des références et contrôle des niveaux de stock.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchProducts} className="p-2.5 text-zinc-500 hover:bg-zinc-100 rounded-lg dark:hover:bg-zinc-800 transition-colors">
                        <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={() => { setFormState({ name: '', category_id: '', unit_price: '', quantity: '', alert_threshold: '5' }); setShowAddModal(true); }} className="btn-vibrant !text-xs !uppercase !tracking-widest">
                        <PlusIcon className="w-4 h-4" /> Nouveau Produit
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Rechercher une référence..."
                        className="input-premium pl-11 !text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    className="input-premium !w-auto min-w-[200px] !text-sm font-medium"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    <option value="all">Toutes les catégories</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="table-container">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="table-header">
                            <th className="px-6 py-4">Référence</th>
                            <th className="px-6 py-4">Catégorie</th>
                            <th className="px-6 py-4 text-right">Prix Unitaire</th>
                            <th className="px-6 py-4 text-center">Stock</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-zinc-400 italic">Chargement...</td></tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-zinc-400 italic">Aucun produit trouvé.</td></tr>
                        ) : filteredProducts.map((p) => (
                            <tr key={p.id} className="table-row">
                                <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-200">{p.name}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                                        {categories.find(c => c.id === p.category_id)?.name || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-medium">{formatCurrency(p.unit_price)}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className={`font-bold ${p.quantity <= p.alert_threshold ? 'text-rose-500' : 'text-zinc-900 dark:text-zinc-200'}`}>
                                            {p.quantity}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => { setEditingProduct(p); setFormState({ name: p.name, category_id: p.category_id, unit_price: p.unit_price, quantity: p.quantity, alert_threshold: p.alert_threshold }); setShowEditModal(true); }}
                                        className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {(showAddModal || showEditModal) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-premium border border-zinc-200 dark:border-zinc-800 p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                                {showAddModal ? "Ajouter un produit" : "Modifier le produit"}
                            </h2>
                            <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Dégnisation</label>
                                <input
                                    type="text"
                                    required
                                    className="input-premium"
                                    value={formState.name}
                                    onChange={e => setFormState({ ...formState, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Catégorie</label>
                                    <select
                                        required
                                        className="input-premium"
                                        value={formState.category_id}
                                        onChange={e => setFormState({ ...formState, category_id: e.target.value })}
                                    >
                                        <option value="">Sélectionner</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Prix Vente</label>
                                    <input
                                        type="number"
                                        required
                                        className="input-premium"
                                        value={formState.unit_price}
                                        onChange={e => setFormState({ ...formState, unit_price: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Quantité</label>
                                    <input
                                        type="number"
                                        required
                                        className="input-premium"
                                        value={formState.quantity}
                                        onChange={e => setFormState({ ...formState, quantity: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Alerte Stock</label>
                                    <input
                                        type="number"
                                        className="input-premium"
                                        value={formState.alert_threshold}
                                        onChange={e => setFormState({ ...formState, alert_threshold: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn-vibrant w-full mt-4 !py-3 !text-sm !uppercase !tracking-[0.2em]">
                                Confirmer
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
