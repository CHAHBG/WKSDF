const supabase = require('../config/supabaseClient');

exports.getAllTransfers = async (req, res) => {
    try {
        const shop_id = req.user ? req.user.shop_id : null;

        if (!shop_id) {
            return res.json([]);
        }

        const { data, error } = await supabase
            .from('transfers')
            .select('*')
            .eq('shop_id', shop_id)
            .order('date', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createTransfer = async (req, res) => {
    try {
        const shop_id = req.user ? req.user.shop_id : null;

        if (!shop_id) {
            return res.status(400).json({ error: 'User does not belong to a shop' });
        }

        const { data, error } = await supabase
            .from('transfers')
            .insert([{
                ...req.body,
                date: new Date().toISOString(),
                status: 'pending',
                shop_id
            }])
            .select();

        if (error) throw error;
        res.status(201).json({ id: data[0].id, message: 'Transfer recorded', transfer: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
