import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    CheckCircleIcon,
    MagnifyingGlassIcon,
    MinusIcon,
    PlusIcon,
    ShoppingCartIcon,
    XMarkIcon,
    TagIcon,
    ReceiptPercentIcon,
    TrashIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

const formatAmount = (value = 0) =>
    new Intl.NumberFormat('fr-FR').format(Math.round(Number(value) || 0)) + ' CFA';

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
                supabase.from('v_inventory_with_avoir').select('*').eq('shop_id', shopId).order('name'),
                supabase.from('categories').select('*').eq('shop_id', shopId).order('name'),
            ]);

            if (productsRes.error) throw productsRes.error;
            if (categoriesRes.error) throw categoriesRes.error;

            setProducts(productsRes.data || []);
            setCategories(categoriesRes.data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des données :', error);
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
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, cartQuantity: item.cartQuantity + 1 }
                        : item
                );
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

    const cartTotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + (Number(item.unit_price) || 0) * item.cartQuantity, 0);
    }, [cart]);

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
            const { data: saleData, error: saleError } = await supabase
                .from('sales')
                .insert([{
                    shop_id: shopId,
                    amount: cartTotal,
                    items: cart,
                    payment_method: 'CASH',
                    status: 'COMPLETED',
                    customer_name: 'Client comptoir',
                    created_by: user?.id,
                }])
                .select()
                .single();

            if (saleError) throw saleError;

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
                await supabase
                    .from('products')
                    .update({ quantity: item.quantity - item.cartQuantity })
                    .eq('id', item.id);
            }

            setCart([]);
            await fetchData();
        } catch (error) {
            console.error('Erreur pendant la vente :', error);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-10rem)] gap-8 animate-fade-in">
            {/* Left: Product Selection */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Point de Vente</h1>
                        <p className="text-sm font-medium text-slate-500">Gérez vos encaissements rapidement.</p>
                    </div>
                    <button
                        onClick={fetchData}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 transition-all dark:bg-slate-900 dark:border-slate-800"
                    >
                        <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom..."
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="pl-4 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-600 appearance-none min-w-[180px]"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="all">Catégories</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-hide">
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="h-48 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredProducts.map(p => {
                                const isLow = p.quantity <= (p.alert_threshold || 10);
                                const isOut = p.quantity <= 0;
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => addToCart(p)}
                                        disabled={isOut}
                                        className={`group relative flex flex-col p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all text-left ${isOut ? 'opacity-50 grayscale' : ''}`}
                                    >
                                        <div className="mb-3 h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:text-indigo-600 transition-all">
                                            <TagIcon className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{p.name}</h3>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="text-xs font-black text-emerald-500">{formatAmount(p.unit_price).split(' ')[0]}</span>
                                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-wider text-slate-500">
                                                {p.category_name}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className={`text-[10px] font-black uppercase ${isLow ? 'text-rose-500' : 'text-slate-400'}`}>
                                                Stock: {p.quantity}
                                            </span>
                                            {!isOut && (
                                                <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <PlusIcon className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Checkout Sidebar */}
            <div className="w-[380px] flex flex-col premium-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                        <ShoppingCartIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Panier</h2>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">{cart.length} Articles</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto -mx-2 px-2 scrollbar-hide space-y-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <div className="h-20 w-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                                <ShoppingCartIcon className="w-10 h-10 text-slate-300" />
                            </div>
                            <p className="text-slate-400 font-bold italic">Le panier est encore vide.</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="group relative flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{item.name}</h4>
                                    <p className="text-xs font-black text-indigo-600">{formatAmount(item.unit_price)}</p>
                                </div>

                                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <button
                                        onClick={() => updateQuantity(item.id, -1)}
                                        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                                    >
                                        <MinusIcon className="w-4 h-4" />
                                    </button>
                                    <span className="w-4 text-center text-xs font-black">{item.cartQuantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, 1)}
                                        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                    </button>
                                </div>

                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="h-8 w-8 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-bold text-sm">
                            <span>Sous-total</span>
                            <span>{formatAmount(cartTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-indigo-500 font-black text-sm">
                            <span className="flex items-center gap-1">
                                <ReceiptPercentIcon className="w-4 h-4" /> Taxe (0%)
                            </span>
                            <span>0 CFA</span>
                        </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-slate-900 dark:bg-indigo-600 text-white shadow-xl">
                        <div className="flex justify-between items-end mb-6">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total à payer</span>
                            <span className="text-3xl font-black">{formatAmount(cartTotal).split(' ')[0]} <span className="text-sm">CFA</span></span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || processing}
                            className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                        >
                            {processing ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                    Validation...
                                </div>
                            ) : "Valider la vente"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
