import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    BanknotesIcon,
    ShoppingCartIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    MinusIcon,
    TrashIcon,
    CheckCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

export default function Sales() {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                supabase.from('v_inventory_with_avoir').select('*').order('name'),
                supabase.from('categories').select('*').order('name')
            ]);

            if (productsRes.error) throw productsRes.error;
            if (categoriesRes.error) throw categoriesRes.error;

            setProducts(productsRes.data || []);
            setCategories(categoriesRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.cartQuantity >= product.quantity) {
                    alert('Stock insuffisant !');
                    return prev;
                }
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, cartQuantity: item.cartQuantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, cartQuantity: 1 }];
        });
    };

    const updateQuantity = (productId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQuantity = item.cartQuantity + delta;
                if (newQuantity > item.quantity) {
                    alert('Stock insuffisant !');
                    return item;
                }
                return { ...item, cartQuantity: Math.max(1, newQuantity) };
            }
            return item;
        }));
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const cartTotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.unit_price * item.cartQuantity), 0);
    }, [cart]);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setProcessing(true);

        try {
            // 1. Create Sale Record
            const { data: saleData, error: saleError } = await supabase
                .from('sales')
                .insert([{
                    shop_id: user?.shop_id,
                    amount: cartTotal,
                    items: cart, // Populate existing jsonb column as backup
                    payment_method: 'CASH',
                    status: 'COMPLETED',
                    customer_name: 'Client Comptoir',
                    created_by: user?.id
                }])
                .select()
                .single();

            if (saleError) throw saleError;

            // 2. Create Sale Items & Update Inventory
            const saleItems = cart.map(item => ({
                sale_id: saleData.id,
                product_id: item.id,
                product_name: item.name,
                quantity: item.cartQuantity,
                unit_price: item.unit_price,
                total_price: item.unit_price * item.cartQuantity
            }));

            const { error: itemsError } = await supabase
                .from('sale_items')
                .insert(saleItems);

            if (itemsError) {
                console.warn("Could not save sale items details (table might be missing), but sale recorded.", itemsError);
            }

            // 3. Update Inventory Stock
            for (const item of cart) {
                const { error: stockError } = await supabase
                    .from('products')
                    .update({ quantity: item.quantity - item.cartQuantity })
                    .eq('id', item.id);

                if (stockError) throw stockError;
            }

            // Success
            setCart([]);
            fetchData(); // Refresh products to show new stock
            alert('Vente effectuée avec succès !');

        } catch (error) {
            console.error('Checkout error:', error);
            alert('Erreur lors de la vente: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || p.category_id === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-900 border-t-transparent"></div>
        </div>
    );

    return (
        <div className="h-[calc(100vh-2rem)] flex gap-6 animate-fade-in">
            {/* Left Side: Product Grid */}
            <div className="flex-1 flex flex-col gap-6">
                {/* Header & Search */}
                <div className="glass-card p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Point de Vente</h1>
                            <p className="text-slate-500 text-sm">Sélectionnez les produits à vendre</p>
                        </div>
                        <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-bold text-sm border border-amber-200">
                            {products.length} Produits
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Rechercher un produit..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none cursor-pointer"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="All">Toutes les catégories</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(product => (
                            <div
                                key={product.id}
                                onClick={() => product.quantity > 0 && addToCart(product)}
                                className={`bg-white p-4 rounded-xl border transition-all cursor-pointer group relative overflow-hidden ${product.quantity === 0
                                    ? 'border-slate-100 opacity-60 cursor-not-allowed'
                                    : 'border-slate-100 hover:border-amber-400 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`text-xs font-bold px-2 py-1 rounded-md ${product.quantity > 10 ? 'bg-emerald-50 text-emerald-700' :
                                        product.quantity > 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                                        }`}>
                                        Stock: {product.quantity}
                                    </div>
                                    <div className="font-mono font-bold text-slate-900">
                                        {(product.unit_price || 0).toLocaleString()} F
                                    </div>
                                </div>

                                {/* Image Placeholder or Actual Image */}
                                <div className="h-32 w-full bg-slate-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-slate-300">
                                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                <h3 className="font-bold text-slate-800 mb-1 line-clamp-2 h-10 text-sm">{product.name}</h3>
                                <p className="text-xs text-slate-500">{product.category_name || 'Sans catégorie'}</p>

                                {product.quantity > 0 && (
                                    <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <PlusIcon className="w-10 h-10 text-slate-900 bg-white rounded-full p-2 shadow-lg transform scale-90 group-hover:scale-100 transition-transform" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side: Cart */}
            <div className="w-96 glass-card flex flex-col h-full border-l border-white/50">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <ShoppingCartIcon className="w-5 h-5 text-slate-700" />
                        <h2 className="font-bold text-slate-900">Panier Actuel</h2>
                    </div>
                    <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full">
                        {cart.length} articles
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                                <ShoppingCartIcon className="w-10 h-10 opacity-20" />
                            </div>
                            <p className="text-sm font-medium">Votre panier est vide</p>
                            <p className="text-xs text-slate-400 text-center px-8">Sélectionnez des produits à gauche pour commencer une vente</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm group hover:border-amber-200 transition-colors">
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{item.name}</h4>
                                    <div className="text-xs text-slate-500 font-mono mt-1">
                                        {(item.unit_price || 0).toLocaleString()} F x {item.cartQuantity}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end justify-between gap-2">
                                    <div className="font-bold text-slate-900 font-mono text-sm">
                                        {((item.unit_price || 0) * item.cartQuantity).toLocaleString()} F
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 p-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}
                                            className="p-1 hover:bg-white hover:shadow-sm rounded text-slate-600 transition-all"
                                        >
                                            <MinusIcon className="w-3 h-3" />
                                        </button>
                                        <span className="text-xs font-bold w-5 text-center">{item.cartQuantity}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}
                                            className="p-1 hover:bg-white hover:shadow-sm rounded text-slate-600 transition-all"
                                        >
                                            <PlusIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="text-slate-300 hover:text-red-500 self-start -mt-1 -mr-1 transition-colors"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-5 border-t border-slate-100 bg-slate-50/80 backdrop-blur-sm rounded-b-xl space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Total à payer</span>
                        <span className="text-3xl font-bold text-slate-900 font-mono tracking-tight">
                            {(cartTotal || 0).toLocaleString()} <span className="text-lg text-slate-500 font-sans">F</span>
                        </span>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || processing}
                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] ${cart.length === 0 || processing
                            ? 'bg-slate-300 cursor-not-allowed shadow-none'
                            : 'bg-slate-800 hover:bg-slate-700'
                            }`}
                    >
                        {processing ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <CheckCircleIcon className="w-6 h-6" />
                                <span className="text-lg">Valider la Vente</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}


