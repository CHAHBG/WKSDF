import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    MagnifyingGlassIcon,
    MinusIcon,
    PlusIcon,
    ShoppingCartIcon,
    TrashIcon,
    ArrowPathIcon,
    ArchiveBoxIcon
} from '@heroicons/react/24/outline';

const formatAmount = (value = 0) =>
    new Intl.NumberFormat('fr-FR').format(Math.round(Number(value) || 0)) + ' F';

export default function Sales() {
    const { user, userProfile } = useAuth();
    const shopId = userProfile?.shop_id;
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (user && shopId) {
            fetchData();
        }
    }, [user, shopId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                supabase.from('products').select('*').eq('shop_id', shopId).order('name'),
                supabase.from('categories').select('*').eq('shop_id', shopId).order('name'),
            ]);

            setProducts(productsRes.data || []);
            setCategories(categoriesRes.data || []);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        if ((Number(product.quantity) || 0) <= 0) return;
        setCart((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                if (existing.cartQuantity >= product.quantity) return prev;
                return prev.map((item) => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
            }
            return [...prev, { ...product, cartQuantity: 1 }];
        });
    };

    const updateQuantity = (productId, delta) => {
        setCart((prev) => prev.map((item) => {
            if (item.id === productId) {
                const newQuantity = item.cartQuantity + delta;
                if (newQuantity > item.quantity) return item;
                return { ...item, cartQuantity: Math.max(1, newQuantity) };
            }
            return item;
        }));
    };

    const removeFromCart = (productId) => {
        setCart((prev) => prev.filter((item) => item.id !== productId));
    };

    const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (Number(item.unit_price) * item.cartQuantity), 0), [cart]);

    const filteredProducts = useMemo(() => (
        products.filter((product) => {
            const matchesSearch = (product.name || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || String(product.category_id) === selectedCategory;
            return matchesSearch && matchesCategory;
        })
    ), [products, searchQuery, selectedCategory]);

    const handleCheckout = async () => {
        if (cart.length === 0 || processing) return;
        setProcessing(true);
        try {
            const { data: saleData } = await supabase.from('sales').insert([{
                shop_id: shopId,
                amount: cartTotal,
                payment_method: 'CASH',
                status: 'COMPLETED',
                created_by: user?.id,
            }]).select().single();

            const saleItems = cart.map((item) => ({
                sale_id: saleData.id,
                product_id: item.id,
                product_name: item.name,
                quantity: item.cartQuantity,
                unit_price: item.unit_price,
                total_price: item.unit_price * item.cartQuantity,
            }));

            await supabase.from('sale_items').insert(saleItems);

            for (const item of cart) {
                await supabase.from('products').update({ quantity: item.quantity - item.cartQuantity }).eq('id', item.id);
            }

            setCart([]);
            fetchData();
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6 animate-enter">
            {/* Left Column: Products */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">

                {/* Header & Filters */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-serif-display font-bold text-[var(--text-main)]">Point de Vente</h2>
                            <p className="text-sm text-[var(--text-muted)]">Sélectionnez les produits à vendre.</p>
                        </div>
                        <button onClick={fetchData} className="btn-secondary text-xs">
                            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                placeholder="Rechercher un produit..."
                                className="input-modern pl-10 w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select
                            className="input-modern w-full sm:w-48 cursor-pointer"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="all">Toutes les catégories</option>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto pr-2">
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="h-40 bg-[var(--bg-subtle)] rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                            {filteredProducts.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => addToCart(p)}
                                    disabled={p.quantity <= 0}
                                    className={`card-modern p-4 flex flex-col text-left group transition-all duration-200 hover:shadow-md hover:border-[var(--primary)] ${p.quantity <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="p-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-muted)] group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                                            <ArchiveBoxIcon className="w-5 h-5" />
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${p.quantity <= (p.alert_threshold || 5) ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            Stocks: {p.quantity}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-[var(--text-main)] line-clamp-2 leading-tight mb-1">{p.name}</h3>
                                    <p className="text-xs text-[var(--text-muted)] mb-3">{categories.find(c => c.id === p.category_id)?.name || 'Général'}</p>
                                    <div className="mt-auto pt-3 border-t border-[var(--border-subtle)] flex justify-between items-center w-full">
                                        <span className="font-bold text-[var(--primary)] text-lg">{formatAmount(p.unit_price)}</span>
                                        <div className="h-6 w-6 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--text-main)] opacity-0 group-hover:opacity-100 transition-opacity">
                                            <PlusIcon className="w-4 h-4" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Cart */}
            <div className="w-full lg:w-96 flex flex-col card-modern p-0 h-full overflow-hidden border border-[var(--border)] shadow-xl">
                <div className="p-5 border-b border-[var(--border)] bg-[var(--bg-card)]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ShoppingCartIcon className="w-5 h-5 text-[var(--primary)]" />
                            <h2 className="font-bold text-[var(--text-main)]">Panier</h2>
                        </div>
                        {cart.length > 0 && (
                            <button
                                onClick={() => setCart([])}
                                className="text-xs font-medium text-[var(--danger)] hover:underline"
                            >
                                Vider
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--bg-subtle)]">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] opacity-60">
                            <ShoppingCartIcon className="w-12 h-12 mb-3" />
                            <p className="font-medium text-sm">Votre panier est vide</p>
                            <p className="text-xs">Ajoutez des produits pour commencer</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-subtle)] shadow-sm flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm text-[var(--text-main)] truncate">{item.name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{formatAmount(item.unit_price)} / unité</p>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 bg-[var(--bg-subtle)] rounded-lg p-1">
                                        <button
                                            onClick={() => updateQuantity(item.id, -1)}
                                            className="w-6 h-6 flex items-center justify-center rounded bg-white text-[var(--text-main)] shadow-sm hover:text-[var(--primary)]"
                                        >
                                            <MinusIcon className="w-3 h-3" />
                                        </button>
                                        <span className="text-sm font-bold w-4 text-center">{item.cartQuantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className="w-6 h-6 flex items-center justify-center rounded bg-white text-[var(--text-main)] shadow-sm hover:text-[var(--primary)]"
                                        >
                                            <PlusIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <span className="font-bold text-[var(--primary)]">{formatAmount(item.unit_price * item.cartQuantity)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-5 border-t border-[var(--border)] bg-[var(--bg-card)] space-y-4">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-medium text-[var(--text-muted)]">Total à payer</span>
                        <span className="text-2xl font-bold text-[var(--text-main)] tracking-tight">{formatAmount(cartTotal)}</span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || processing}
                        className="btn-primary w-full py-3 text-sm flex justify-center items-center gap-2"
                    >
                        {processing ? (
                            <>
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                Traitement...
                            </>
                        ) : (
                            <>
                                <span>Valider la commande</span>
                                <span className="bg-white/20 px-2 py-0.5 rounded text-xs ml-2">{cart.reduce((a, b) => a + b.cartQuantity, 0)} articles</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
