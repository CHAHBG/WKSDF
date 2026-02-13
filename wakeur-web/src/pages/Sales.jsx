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
        <div className="flex h-[calc(100vh-12rem)] gap-10 animate-fade-in">
            <div className="flex-1 flex flex-col gap-8 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Point de Vente</h1>
                        <p className="text-zinc-500 font-medium mt-1">Sélectionnez les articles pour une transaction sereine.</p>
                    </div>
                    <button onClick={fetchData} className="btn-ghost !p-3">
                        <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Rechercher une référence..."
                            className="input-premium pl-12"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <select
                            className="input-premium font-bold"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="all">Toutes Sélections</option>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide pr-2">
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="h-48 bg-zinc-100 dark:bg-zinc-800 rounded-[2rem] animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => addToCart(p)}
                                    disabled={p.quantity <= 0}
                                    className={`group flex flex-col p-6 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] text-left hover:scale-[1.03] hover:border-teal-500/30 transition-all duration-300 shadow-premium ${p.quantity <= 0 ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 flex items-center justify-center font-black group-hover:rotate-6 transition-transform">
                                            <CubeIcon className="w-5 h-5" />
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${p.quantity <= (p.alert_threshold || 5) ? 'text-rose-500' : 'text-zinc-400'}`}>
                                            Stock: {p.quantity}
                                        </span>
                                    </div>
                                    <h3 className="font-black text-zinc-900 dark:text-white text-sm line-clamp-1 mb-1 tracking-tight">{p.name}</h3>
                                    <p className="text-xs font-bold text-zinc-400 mb-4">{categories.find(c => c.id === p.category_id)?.name || 'Général'}</p>
                                    <p className="mt-auto text-lg font-black text-teal-600">{formatAmount(p.unit_price)}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-[400px] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[3rem] shadow-2xl shadow-teal-900/5 p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full -mr-16 -mt-16"></div>

                <div className="relative z-10 flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-lg shadow-teal-600/20">
                            <ShoppingCartIcon className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black tracking-tight">Vente en cours</h2>
                    </div>
                    {cart.length > 0 && (
                        <button onClick={() => setCart([])} className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors">
                            Vider
                        </button>
                    )}
                </div>

                <div className="relative z-10 flex-1 overflow-y-auto space-y-5 pr-2 -mr-2 scrollbar-hide">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-10">
                            <ShoppingCartIcon className="w-16 h-16 mb-4" />
                            <p className="font-bold italic">Le panier est vide</p>
                            <p className="text-xs mt-2">Ajoutez des produits pour commencer.</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="group flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-transparent hover:border-teal-500/20 transition-all">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-zinc-900 dark:text-white truncate">{item.name}</p>
                                    <p className="text-xs text-teal-600 font-bold">{formatAmount(item.unit_price)}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-700 rounded-lg shadow-sm text-zinc-500 hover:text-teal-600 transition-colors"><MinusIcon className="w-3 h-3" /></button>
                                    <span className="text-sm font-black w-4 text-center">{item.cartQuantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-700 rounded-lg shadow-sm text-zinc-500 hover:text-teal-600 transition-colors"><PlusIcon className="w-3 h-3" /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="relative z-10 mt-10 pt-8 border-t-2 border-dashed border-zinc-100 dark:border-zinc-800 space-y-6">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Total à payer</span>
                        <span className="text-3xl font-black text-zinc-950 dark:text-white tracking-tighter">{formatAmount(cartTotal)}</span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || processing}
                        className="btn-vibrant w-full !py-5 !text-xs !uppercase !tracking-[0.3em]"
                    >
                        {processing ? "Traitement..." : "Valider la transaction"}
                    </button>
                    <p className="text-[10px] text-center text-zinc-400 font-medium">Une validation instantanée pour plus de fluidité.</p>
                </div>
            </div>
        </div>
    );
}
