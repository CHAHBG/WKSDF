const supabase = require('../config/supabaseClient');

exports.getAllTransfers = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('transfers')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createTransfer = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('transfers')
            .insert([{
                ...req.body,
                date: new Date().toISOString(),
                status: 'pending'
            }])
            .select();

        if (error) throw error;
        res.status(201).json({ id: data[0].id, message: 'Transfer recorded', transfer: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
