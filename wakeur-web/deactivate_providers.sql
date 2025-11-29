-- Deactivate specific mobile money providers
UPDATE mm_platforms
SET is_active = false
WHERE name IN ('Bissocash', 'Coris Money', 'Expresso Money', 'Free Money', 'Touch Point');
