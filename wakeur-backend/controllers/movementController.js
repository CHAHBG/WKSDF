const supabase = require('../config/supabaseClient');

exports.getAllMovements = async (req, res) => {
    try {
        const shop_id = req.user ? req.user.shop_id : null;

        if (!shop_id) {
            return res.json([]);
        }

        const { data, error } = await supabase
            .from('v_movements_detailed')
            .select('*')
            .eq('shop_id', shop_id)
            .order('movement_date', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createMovement = async (req, res) => {
    try {
        const { product_id, movement_type, quantity, unit_price, comment } = req.body;
        const user_id = req.user ? req.user.id : null;
        const shop_id = req.user ? req.user.shop_id : null;

        if (!shop_id) {
            return res.status(400).json({ error: 'User does not belong to a shop' });
        }

        // Verify product belongs to shop
        const { data: productData, error: productError } = await supabase
            .from('products')
            .select('quantity, shop_id')
            .eq('id', product_id)
            .single();

        if (productError) throw productError;

        if (productData.shop_id !== shop_id) {
            return res.status(403).json({ error: 'Product does not belong to your shop' });
        }

        // 1. Record the movement
        const { data: movementData, error: movementError } = await supabase
            .from('movements')
            .insert([{
                product_id,
                movement_type,
                quantity,
                unit_price,
                total_amount: quantity * (unit_price || 0),
                comment,
                created_by: user_id,
                shop_id
            }])
            .select();

        if (movementError) throw movementError;

        // 2. Update product quantity (Application-side logic)
        // Note: Ideally this should be a database trigger or a stored procedure to ensure atomicity.
        // For now, we do it here.

        let newQuantity = productData.quantity;
        if (movement_type === 'Entrée') {
            newQuantity += parseInt(quantity);
        } else if (movement_type === 'Sortie') {
            newQuantity -= parseInt(quantity);
        }

        // Update product
        const { error: updateError } = await supabase
            .from('products')
            .update({ quantity: newQuantity })
            .eq('id', product_id);

        if (updateError) throw updateError;

        res.status(201).json({ message: 'Movement recorded and stock updated', movement: movementData[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
