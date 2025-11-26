const supabase = require('../config/supabaseClient');

exports.getAllCategories = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const { data, error } = await supabase
            .from('categories')
            .insert([{ name, description }])
            .select();

        if (error) throw error;
        res.status(201).json({ message: 'Category created', category: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
