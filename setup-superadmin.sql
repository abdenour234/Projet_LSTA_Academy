-- Script de création du compte SuperAdmin
-- Mot de passe: admin (hashé avec BCrypt)

-- Créer une école de test si elle n'existe pas
INSERT INTO schools (name, address, city, region, level, type, phone, email, created_at, updated_at)
VALUES ('Pasteur', 'Avenue Mohammed V', 'Oujda', 'L''Oriental', 'Primaire', 'Privé', '0536123456', 'contact@pasteur.ma', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Créer le compte SuperAdmin
-- Email: admin@admin.com
-- Mot de passe: admin
INSERT INTO users (full_name, email, password, role, school_id, is_active, created_at, updated_at)
VALUES (
    'Super Admin',
    'admin@admin.com',
    '$2a$10$xvNHQYZBwlH7OzvGxkxhUOQRMlVSHIVHzLxQjz3cjKUmjGRjKWn0K',
    'superadmin',
    1,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Afficher le résultat
SELECT 'SuperAdmin créé avec succès!' as message;
SELECT id, full_name, email, role, school_id, is_active FROM users WHERE email = 'admin@admin.com';
