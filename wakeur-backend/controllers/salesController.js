const supabase = require('../config/supabaseClient');

exports.getAllSales = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.recordSale = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('sales')
            .insert([{
                ...req.body,
                date: new Date().toISOString()
            }])
            .select();

        if (error) throw error;
        res.status(201).json({ id: data[0].id, message: 'Sale recorded', sale: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
