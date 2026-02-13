const supabase = require('../config/supabaseClient');

exports.getAllCategories = async (req, res) => {
    try {
        const shop_id = req.user ? req.user.shop_id : null;

        if (!shop_id) {
            return res.json([]);
        }

        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('shop_id', shop_id)
            .order('name', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const shop_id = req.user ? req.user.shop_id : null;

        if (!shop_id) {
            return res.status(400).json({ error: 'User does not belong to a shop' });
        }

        const { name, description } = req.body;
        const { data, error } = await supabase
            .from('categories')
            .insert([{ name, description, shop_id }])
            .select();

        if (error) throw error;
        res.status(201).json({ message: 'Category created', category: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
