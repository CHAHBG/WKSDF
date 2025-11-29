-- 1. Update RLS Policy to allow viewing global categories
DROP POLICY IF EXISTS "Users view own shop categories" ON categories;
DROP POLICY IF EXISTS "Users view shop and global categories" ON categories;

CREATE POLICY "Users view shop and global categories" ON categories
  FOR SELECT USING (
    shop_id = get_user_shop_id() OR shop_id IS NULL
  );

-- 2. Insert Global Categories
-- We use ON CONFLICT DO NOTHING to avoid duplicates if run multiple times
-- Note: We assume 'name' has a unique constraint or we just check existence. 
-- Since we don't have a unique constraint on name globally, we'll use INSERT WHERE NOT EXISTS.

DO $$
DECLARE
    category_name text;
    categories_list text[] := ARRAY[
        -- Alimentation & Boissons
        'Alimentation', 'Boissons', 'Pâtes', 'Riz', 'Huile', 'Conserves', 'Épices', 'Snacks', 'Lait & Dérivés', 'Eau', 'Jus de fruits', 'Sodas', 'Biscuits', 'Bonbons', 'Café & Thé', 'Sucre', 'Farine', 'Légumes', 'Fruits', 'Viandes', 'Poissons', 'Oeufs', 'Pain & Boulangerie',
        
        -- Vêtements & Mode
        'Vêtements & Mode', 'Chaussures', 'Pantalons', 'Chemises', 'T-shirts', 'Robes', 'Jupes', 'Sous-vêtements', 'Chaussettes', 'Vestes & Manteaux', 'Accessoires Mode', 'Sacs à main', 'Bijoux', 'Montres', 'Lunettes', 'Chapeaux & Casquettes', 'Sandales', 'Baskets', 'Tissus & Textiles',
        
        -- Hygiène & Beauté
        'Cosmétique & Beauté', 'Savons', 'Shampoings', 'Gels Douche', 'Parfums', 'Maquillage', 'Soins corporels', 'Soins capillaires', 'Déodorants', 'Brosses à dents', 'Dentifrice', 'Couches & Bébé', 'Serviettes hygiéniques', 'Rasage & Épilation', 'Crèmes & Lotions',
        
        -- Électronique & Numérique
        'Électronique & Numérique', 'Téléphones', 'Chargeurs', 'Câbles', 'Écouteurs & Casques', 'Écrans', 'Ordinateurs', 'Claviers & Souris', 'Imprimantes', 'Cartouches d''encre', 'Clés USB & Stockage', 'Batteries & Piles', 'Accessoires Téléphone', 'Coques & Étuis', 'Protecteurs d''écran', 'Enceintes Bluetooth',
        
        -- Maison & Entretien
        'Maison & Décoration', 'Produits ménagers', 'Détergents', 'Javel', 'Lessive', 'Vaisselle', 'Ustensiles de cuisine', 'Verres & Tasses', 'Casseroles & Poêles', 'Seaux & Bassines', 'Balais & Serpillères', 'Éponges & Chiffons', 'Linge de maison', 'Draps & Couvertures', 'Rideaux', 'Tapis', 'Meubles', 'Électroménager',
        
        -- Santé & Pharmacie
        'Santé & Pharmacie', 'Médicaments', 'Vitamines & Compléments', 'Premiers Secours', 'Masques & Gants', 'Thermomètres', 'Tensiomètres',
        
        -- Quincaillerie & Bricolage
        'Quincaillerie & Bricolage', 'Outils', 'Peinture', 'Électricité', 'Plomberie', 'Ampoules & Éclairage', 'Vis & Clous', 'Cadenas & Sécurité', 'Matériaux de construction',
        
        -- Librairie & Papeterie
        'Librairie & Papeterie', 'Cahiers', 'Stylos', 'Crayons', 'Feutres & Marqueurs', 'Gommes & Correcteurs', 'Règles & Géométrie', 'Calculatrices', 'Sacs à dos', 'Livres', 'Journaux & Magazines', 'Enveloppes & Papier',
        
        -- Sports & Loisirs
        'Sports & Loisirs', 'Ballons', 'Vélos & Accessoires', 'Tenues de sport', 'Musculation & Fitness', 'Jeux de société',
        
        -- Jouets & Enfants
        'Jouets & Enfants', 'Poupées', 'Voitures & Véhicules', 'Jeux éducatifs', 'Peluches',
        
        -- Automobile
        'Automobile & Pièces', 'Huiles moteur', 'Pneus', 'Accessoires Auto', 'Pièces détachées', 'Entretien Auto',
        
        -- Services
        'Services', 'Recharge Crédit', 'Transfert d''argent', 'Photocopie & Impression', 'Réparation',
        
        -- Autres
        'Autres', 'Divers'
    ];
BEGIN
    FOREACH category_name IN ARRAY categories_list
    LOOP
        INSERT INTO categories (name, shop_id)
        SELECT category_name, NULL
        WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = category_name AND shop_id IS NULL);
    END LOOP;
END $$;
