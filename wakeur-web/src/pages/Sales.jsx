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
} from '@heroicons/react/24/outline';

const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR');
const formatAmount = (value = 0) => NUMBER_FORMATTER.format(Math.round(Number(value) || 0));

const stockTone = (quantity) => {
    const qty = Number(quantity) || 0;
    if (qty <= 0) return 'low';
    if (qty <= 5) return 'warn';
    return 'ok';
};

export default function Sales() {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
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
                supabase.from('categories').select('*').order('name'),
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
                if (existing.cartQuantity >= product.quantity) {
                    alert('Stock insuffisant.');
                    return prev;
                }
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
                if (newQuantity > item.quantity) {
                    alert('Stock insuffisant.');
                    return item;
                }
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
        if (cart.length === 0) return;
        setProcessing(true);

        try {
            const { data: saleData, error: saleError } = await supabase
                .from('sales')
                .insert([{
                    shop_id: user?.shop_id,
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

            const { error: itemsError } = await supabase
                .from('sale_items')
                .insert(saleItems);

            if (itemsError) {
                console.warn('Impossible d’enregistrer le détail des articles vendus.', itemsError);
            }

            for (const item of cart) {
                const { error: stockError } = await supabase
                    .from('products')
                    .update({ quantity: item.quantity - item.cartQuantity })
                    .eq('id', item.id);

                if (stockError) throw stockError;
            }

            setCart([]);
            await fetchData();
            alert('Vente enregistrée avec succès.');
        } catch (error) {
            console.error('Erreur pendant la vente :', error);
            alert(`Erreur lors de la vente : ${error.message}`);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="grid h-[calc(100vh-2rem)] grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_23.5rem] animate-fade-in">
            <section className="flex min-h-0 flex-col gap-6">
                <div className="glass-card sales-toolbar p-6">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Point de vente</h1>
                            <p className="mt-1 text-sm text-slate-500">Sélectionnez les articles à vendre rapidement.</p>
                        </div>
                        <span className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                            {products.length} article{products.length > 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
                        <label className="relative block">
                            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Rechercher un article..."
                                className="input-field pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </label>

                        <select
                            className="input-field cursor-pointer"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="all">Toutes les catégories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={String(category.id)}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                    {filteredProducts.length === 0 ? (
                        <div className="chart-placeholder h-52">
                            Aucun article ne correspond à votre recherche.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                            {filteredProducts.map((product) => {
                                const quantity = Number(product.quantity) || 0;
                                const tone = stockTone(quantity);
                                const isOutOfStock = quantity <= 0;

                                return (
                                    <article
                                        key={product.id}
                                        className={`product-card ${isOutOfStock ? 'product-card--disabled' : ''}`}
                                    >
                                        <div className="product-card__media">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="product-card__placeholder">
                                                    <ShoppingCartIcon className="h-8 w-8" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="product-card__content">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <h3 className="product-card__title">{product.name}</h3>
                                                    <p className="product-card__category">{product.category_name || 'Sans catégorie'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="product-card__price-label">Prix</p>
                                                    <p className="product-card__price">
                                                        {formatAmount(product.unit_price)}
                                                        <span> F</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between gap-2">
                                                <span className={`stock-chip stock-chip--${tone}`}>
                                                    Stock {formatAmount(quantity)}
                                                </span>

                                                <button
                                                    type="button"
                                                    className="product-card__action"
                                                    onClick={() => addToCart(product)}
                                                    disabled={isOutOfStock}
                                                >
                                                    <PlusIcon className="h-4 w-4" />
                                                    {isOutOfStock ? 'Rupture' : 'Ajouter'}
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            <aside className="sales-cart-panel min-h-0">
                <div className="sales-cart-panel__header">
                    <div className="flex items-center gap-2">
                        <ShoppingCartIcon className="h-5 w-5 text-slate-700" />
                        <h2 className="font-bold text-slate-900">Panier actuel</h2>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                        {cart.length} article{cart.length > 1 ? 's' : ''}
                    </span>
                </div>

                <div className="sales-cart-panel__body custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center space-y-3 text-center text-slate-500">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                <ShoppingCartIcon className="h-8 w-8 text-slate-400" />
                            </div>
                            <p className="font-semibold text-slate-700">Votre panier est vide</p>
                            <p className="max-w-[16rem] text-sm text-slate-500">
                                Ajoutez des articles à gauche pour démarrer une vente.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cart.map((item) => (
                                <div key={item.id} className="cart-item">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold text-slate-900">{item.name}</p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {formatAmount(item.unit_price)} F x {item.cartQuantity}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <p className="font-mono text-sm font-semibold text-slate-900">
                                            {formatAmount((item.unit_price || 0) * item.cartQuantity)} F
                                        </p>

                                        <div className="cart-qty">
                                            <button
                                                type="button"
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="cart-qty-btn"
                                            >
                                                <MinusIcon className="h-3.5 w-3.5" />
                                            </button>
                                            <span className="w-6 text-center text-xs font-semibold text-slate-700">{item.cartQuantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="cart-qty-btn"
                                            >
                                                <PlusIcon className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeFromCart(item.id)}
                                        className="cart-remove-btn"
                                        aria-label={`Retirer ${item.name}`}
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="sales-cart-panel__footer">
                    <div className="flex items-end justify-between">
                        <span className="text-sm font-medium text-slate-500">Total à payer</span>
                        <span className="font-mono text-3xl font-bold text-slate-900">
                            {formatAmount(cartTotal)}
                            <span className="text-base font-semibold text-slate-500"> F</span>
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || processing}
                        className="cart-checkout-btn"
                    >
                        {processing ? (
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                        ) : (
                            <>
                                <CheckCircleIcon className="h-5 w-5" />
                                Valider la vente
                            </>
                        )}
                    </button>
                </div>
            </aside>
        </div>
    );
}
