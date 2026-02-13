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
    CubeIcon
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
        <div className="flex h-[calc(100vh-10rem)] gap-8">
            <div className="flex-1 flex flex-col gap-6 min-w-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Point de Vente</h1>
                        <p className="text-zinc-500 text-sm">Sélectionnez les articles pour la transaction.</p>
                    </div>
                    <button onClick={fetchData} className="p-2.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="flex gap-4">
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
                    <select className="input-premium !w-auto min-w-[180px] !text-sm font-medium" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                        <option value="all">Catégories</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-40 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {filteredProducts.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => addToCart(p)}
                                    disabled={p.quantity <= 0}
                                    className={`p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-left hover:border-zinc-400 dark:hover:border-zinc-600 transition-all ${p.quantity <= 0 ? 'opacity-50' : ''}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <CubeIcon className="w-4 h-4 text-zinc-400" />
                                        <span className={`text-[10px] font-bold ${p.quantity <= (p.alert_threshold || 5) ? 'text-rose-500' : 'text-zinc-400'}`}>Stock: {p.quantity}</span>
                                    </div>
                                    <h3 className="font-bold text-zinc-900 dark:text-white text-sm line-clamp-1">{p.name}</h3>
                                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-400 mt-1">{formatAmount(p.unit_price)}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-[360px] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-premium p-8">
                <div className="flex items-center gap-3 mb-8">
                    <ShoppingCartIcon className="w-5 h-5 text-zinc-900 dark:text-white" />
                    <h2 className="text-lg font-bold">Panier de vente</h2>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2 scrollbar-hide">
                    {cart.map(item => (
                        <div key={item.id} className="flex items-center gap-4 py-2 border-b border-zinc-50 dark:border-zinc-800">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">{item.name}</p>
                                <p className="text-xs text-zinc-400">{formatAmount(item.unit_price)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"><MinusIcon className="w-3 h-3" /></button>
                                <span className="text-xs font-bold w-4 text-center">{item.cartQuantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"><PlusIcon className="w-3 h-3" /></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                    <div className="flex justify-between items-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
                        <span>Total</span>
                        <span className="text-xl text-zinc-950 dark:text-white">{formatAmount(cartTotal)}</span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || processing}
                        className="btn-vibrant w-full !py-4 !text-sm !uppercase !tracking-[0.25em]"
                    >
                        {processing ? "Chargement..." : "Finaliser la vente"}
                    </button>
                </div>
            </div>
        </div>
    );
}
