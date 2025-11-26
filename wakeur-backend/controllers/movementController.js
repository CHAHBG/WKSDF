const supabase = require('../config/supabaseClient');

exports.getAllMovements = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('v_movements_detailed')
            .select('*')
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
        const user_id = req.user ? req.user.id : null; // Assuming auth middleware populates req.user

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
                created_by: user_id // This might need adjustment based on how users are stored (auth.users vs public.users)
            }])
            .select();

        if (movementError) throw movementError;

        // 2. Update product quantity (Application-side logic)
        // Note: Ideally this should be a database trigger or a stored procedure to ensure atomicity.
        // For now, we do it here.

        // Get current product quantity
        const { data: productData, error: productError } = await supabase
            .from('products')
            .select('quantity')
            .eq('id', product_id)
            .single();

        if (productError) throw productError;

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
