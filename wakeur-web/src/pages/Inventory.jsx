import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    CubeIcon,
    CurrencyDollarIcon,
    ExclamationTriangleIcon,
    PlusIcon,
    PencilIcon,
    XMarkIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    FunnelIcon,
    TagIcon
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
        <div className="space-y-8 animate-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-serif-display font-bold text-[var(--text-main)]">Inventaire</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Gérez votre stock et vos références.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchProducts} className="btn-secondary text-xs">
                        <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => { setFormState({ name: '', category_id: '', unit_price: '', quantity: '', alert_threshold: '5' }); setShowAddModal(true); }}
                        className="btn-primary text-xs flex items-center gap-2"
                    >
                        <PlusIcon className="w-4 h-4" /> Nouveau Produit
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-modern p-5 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Total Unités</p>
                        <p className="text-2xl font-bold text-[var(--text-main)] mt-1">{products.reduce((sum, p) => sum + Number(p.quantity), 0).toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--bg-subtle)] text-[var(--primary)]">
                        <CubeIcon className="w-6 h-6" />
                    </div>
                </div>
                <div className="card-modern p-5 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Valeur Stock</p>
                        <p className="text-2xl font-bold text-[var(--text-main)] mt-1">{formatCurrency(products.reduce((sum, p) => sum + (Number(p.quantity) * Number(p.unit_price)), 0))}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--bg-subtle)] text-[var(--success)]">
                        <CurrencyDollarIcon className="w-6 h-6" />
                    </div>
                </div>
                <div className="card-modern p-5 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Alertes Stock</p>
                        <p className="text-2xl font-bold text-[var(--danger)] mt-1">{products.filter(p => Number(p.quantity) <= (p.alert_threshold || 5)).length}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-rose-50 text-[var(--danger)]">
                        <ExclamationTriangleIcon className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Filters & Table */}
            <div className="card-modern overflow-hidden">
                <div className="p-5 border-b border-[var(--border)] flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--bg-card)]">
                    <div className="relative w-full md:w-72">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom..."
                            className="input-modern pl-9 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <FunnelIcon className="h-4 w-4 text-[var(--text-muted)]" />
                        <select
                            className="input-modern w-full md:w-48 cursor-pointer"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="all">Toutes catégories</option>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="table-modern w-full">
                        <thead>
                            <tr>
                                <th className="pl-6">Désignation</th>
                                <th>Catégorie</th>
                                <th className="text-right">Prix Unitaire</th>
                                <th className="text-center">Quantité</th>
                                <th className="text-right pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-[var(--text-muted)] italic">Chargement...</td></tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-[var(--text-muted)] italic">Aucun produit trouvé.</td></tr>
                            ) : filteredProducts.map((p) => (
                                <tr key={p.id} className="group hover:bg-[var(--bg-subtle)] transition-colors">
                                    <td className="pl-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--primary)] font-bold text-xs border border-[var(--border-subtle)]">
                                                {p.name.charAt(0)}
                                            </div>
                                            <span className="font-semibold text-[var(--text-main)]">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-subtle)] text-xs font-medium text-[var(--text-muted)] border border-[var(--border-subtle)]">
                                            <TagIcon className="w-3 h-3" />
                                            {categories.find(c => c.id === p.category_id)?.name || 'Général'}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right font-medium text-[var(--text-main)]">
                                        {formatCurrency(p.unit_price)}
                                    </td>
                                    <td className="py-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${p.quantity <= (p.alert_threshold || 5) ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                            {p.quantity}
                                        </span>
                                    </td>
                                    <td className="pr-6 py-4 text-right">
                                        <button
                                            onClick={() => { setEditingProduct(p); setFormState({ name: p.name, category_id: p.category_id, unit_price: p.unit_price, quantity: p.quantity, alert_threshold: p.alert_threshold }); setShowEditModal(true); }}
                                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {(showAddModal || showEditModal) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-[var(--bg-card)] rounded-2xl shadow-xl border border-[var(--border)] p-6 animate-enter">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-[var(--text-main)] font-serif-display">
                                {showAddModal ? "Ajouter un produit" : "Modifier le produit"}
                            </h2>
                            <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[var(--text-main)]">Désignation</label>
                                <input
                                    type="text"
                                    required
                                    className="input-modern w-full"
                                    value={formState.name}
                                    onChange={e => setFormState({ ...formState, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-[var(--text-main)]">Catégorie</label>
                                    <select
                                        required
                                        className="input-modern w-full"
                                        value={formState.category_id}
                                        onChange={e => setFormState({ ...formState, category_id: e.target.value })}
                                    >
                                        <option value="">Sélectionner</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-[var(--text-main)]">Prix Vente</label>
                                    <input
                                        type="number"
                                        required
                                        className="input-modern w-full"
                                        value={formState.unit_price}
                                        onChange={e => setFormState({ ...formState, unit_price: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-[var(--text-main)]">Quantité Initiale</label>
                                    <input
                                        type="number"
                                        required
                                        className="input-modern w-full"
                                        value={formState.quantity}
                                        onChange={e => setFormState({ ...formState, quantity: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-[var(--text-main)]">Seuil d'alerte</label>
                                    <input
                                        type="number"
                                        className="input-modern w-full"
                                        value={formState.alert_threshold}
                                        onChange={e => setFormState({ ...formState, alert_threshold: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] transition-colors"
                                >
                                    Annuler
                                </button>
                                <button type="submit" className="btn-primary text-sm px-6 py-2">
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
