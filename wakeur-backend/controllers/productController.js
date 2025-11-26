const supabase = require('../config/supabaseClient');

exports.getAllProducts = async (req, res) => {
    try {
        // Use the view that joins with categories
        const { data, error } = await supabase
            .from('v_products_with_category')
            .select('*');

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { name, category_id, unit_price, quantity, alert_threshold, sku, description, image_url } = req.body;
        const user_id = req.user ? req.user.id : null;

        const { data, error } = await supabase
            .from('products')
            .insert([{
                name,
                category_id,
                unit_price,
                quantity,
                alert_threshold,
                sku,
                description,
                image_url,
                created_by: user_id
            }])
            .select();

        if (error) throw error;
        res.status(201).json({ id: data[0].id, message: 'Product created', product: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('products')
            .update(req.body)
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json({ message: 'Product updated', product: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
