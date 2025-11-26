import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export default function Sales() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [customPrice, setCustomPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (!error) setCategories(data || []);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('v_inventory_with_avoir')
      .select('*')
      .gt('quantity', 0)
      .order('name');
    if (!error) setProducts(data || []);
  };

  const getFilteredProducts = () => {
    if (!selectedCategory) return [];
    if (!searchText) {
      return products.filter(p => p.category_id === selectedCategory);
    }
    return products.filter(p =>
      p.category_id === selectedCategory &&
      p.name.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setSearchText(product.name);
    setCustomPrice((product.unit_price || 0).toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!selectedProduct) {
      setMessage('Veuillez sélectionner un produit');
      return;
    }
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      setMessage('Veuillez entrer une quantité valide');
      return;
    }
    if (qty > selectedProduct.quantity) {
      setMessage(`Stock insuffisant (max: ${selectedProduct.quantity})`);
      return;
    }
    setLoading(true);
    try {
      const price = parseFloat(customPrice) || 0;
      const totalAmount = price * qty;
      const { error } = await supabase.from('sales').insert({
        product_id: selectedProduct.id,
        quantity: qty,
        amount: totalAmount,
      });
      if (error) throw error;
      setMessage('Vente enregistrée avec succès!');
      setSelectedProduct(null);
      setSearchText('');
      setQuantity('1');
      setCustomPrice('');
      setSelectedCategory('');
      fetchProducts();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors de l'enregistrement de la vente");
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = (parseInt(quantity) || 0) * (parseFloat(customPrice) || 0);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Nouvelle Vente</h1>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setSelectedProduct(null);
                setSearchText('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Product Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Produit</label>
            <input
              type="text"
              value={searchText}
              onChange={e => {
                setSearchText(e.target.value);
                setSelectedProduct(null);
              }}
              placeholder="Rechercher un produit..."
              disabled={!selectedCategory}
              autoComplete="off"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />

            {/* Product Suggestions Dropdown */}
            {selectedCategory && searchText && !selectedProduct && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {getFilteredProducts().map(item => (
                  <div
                    key={item.id}
                    onMouseDown={() => handleProductSelect(item)}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                  >
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Stock: {item.quantity} unités • Prix: {item.unit_price?.toLocaleString()} FCFA
                    </div>
                  </div>
                ))}
                {getFilteredProducts().length === 0 && (
                  <div className="px-4 py-3 text-gray-500 text-center">Aucun produit trouvé</div>
                )}
              </div>
            )}
          </div>

          {/* Selected Product Display */}
          {selectedProduct && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-900">{selectedProduct.name}</div>
                  <div className="text-sm text-gray-600 mt-1">Stock disponible: {selectedProduct.quantity} unités</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(null);
                    setSearchText('');
                    setCustomPrice('');
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Quantity and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantité</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prix Unitaire (FCFA)</label>
              <input
                type="number"
                min="0"
                value={customPrice}
                onChange={e => setCustomPrice(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Total Display */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Total à Payer</div>
              <div className="text-3xl font-bold text-green-600">{totalAmount.toLocaleString()} FCFA</div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Enregistrement...' : 'Valider la Vente'}
          </button>

          {/* Success/Error Message */}
          {message && (
            <div className={`p-4 rounded-lg ${message.includes('succès') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
