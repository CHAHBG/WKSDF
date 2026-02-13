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
        <div className="space-y-12 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Stock & Références</h1>
                    <p className="text-zinc-500 font-medium mt-1">Gérez votre catalogue avec précision et clarté.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={fetchProducts} className="btn-ghost !p-3">
                        <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => { setFormState({ name: '', category_id: '', unit_price: '', quantity: '', alert_threshold: '5' }); setShowAddModal(true); }}
                        className="btn-vibrant"
                    >
                        <PlusIcon className="w-5 h-5" /> Nouveau Produit
                    </button>
                </div>
            </div>

            {/* Joyful Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="metric-card-joy">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 mb-6 font-black">
                        <CubeIcon className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-1">Total Unités</p>
                    <p className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">
                        {products.reduce((sum, p) => sum + Number(p.quantity), 0).toLocaleString()}
                    </p>
                </div>
                <div className="metric-card-joy">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 mb-6 font-black">
                        <BanknotesIcon className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-1">Valeur Stock</p>
                    <p className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">
                        {formatCurrency(products.reduce((sum, p) => sum + (Number(p.quantity) * Number(p.unit_price)), 0))}
                    </p>
                </div>
                <div className="metric-card-joy border-rose-100 dark:border-rose-900/30">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 mb-6 font-black">
                        <ExclamationTriangleIcon className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-1">Alertes Stock</p>
                    <p className="text-4xl font-black text-rose-600 tracking-tighter">
                        {products.filter(p => Number(p.quantity) <= (p.alert_threshold || 5)).length}
                    </p>
                </div>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="relative flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Recherche</p>
                    <MagnifyingGlassIcon className="absolute left-4 bottom-4 h-5 w-5 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Référence, désignation..."
                        className="input-premium pl-12"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-72">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Catégorie</p>
                    <select
                        className="input-premium font-bold"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="all">Toutes les catégories</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Premium Table */}
            <div className="table-container shadow-2xl shadow-teal-900/5">
                <table className="w-full text-left">
                    <thead>
                        <tr className="table-header">
                            <th className="px-8 py-6">Désignation</th>
                            <th className="px-6 py-6">Catégorie</th>
                            <th className="px-6 py-6 text-right">Prix Unitaire</th>
                            <th className="px-6 py-6 text-center">Quantité</th>
                            <th className="px-8 py-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {loading ? (
                            <tr><td colSpan="5" className="px-8 py-16 text-center text-zinc-400 italic font-medium">Chargement des données...</td></tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr><td colSpan="5" className="px-8 py-16 text-center text-zinc-400 italic font-medium">Aucune référence trouvée.</td></tr>
                        ) : filteredProducts.map((p) => (
                            <tr key={p.id} className="table-row group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-teal-50 dark:bg-zinc-800 text-teal-600 flex items-center justify-center font-black border border-teal-100 dark:border-zinc-700 group-hover:rotate-3 transition-transform">
                                            {p.name.charAt(0)}
                                        </div>
                                        <span className="font-black text-zinc-900 dark:text-white tracking-tight">{p.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-6 font-bold text-zinc-500">
                                    <span className="px-3 py-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                        {categories.find(c => c.id === p.category_id)?.name || 'Général'}
                                    </span>
                                </td>
                                <td className="px-6 py-6 text-right font-black text-teal-600">
                                    {formatCurrency(p.unit_price)}
                                </td>
                                <td className="px-6 py-6 text-center">
                                    <div className="inline-flex flex-col items-center">
                                        <span className={`text-sm font-black ${p.quantity <= (p.alert_threshold || 5) ? 'text-rose-500' : 'text-zinc-900 dark:text-zinc-200'}`}>
                                            {p.quantity} {p.quantity <= (p.alert_threshold || 5) && "⚠️"}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => { setEditingProduct(p); setFormState({ name: p.name, category_id: p.category_id, unit_price: p.unit_price, quantity: p.quantity, alert_threshold: p.alert_threshold }); setShowEditModal(true); }}
                                            className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 hover:scale-110 transition-transform border border-teal-100 dark:border-teal-800"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                    </div>
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
