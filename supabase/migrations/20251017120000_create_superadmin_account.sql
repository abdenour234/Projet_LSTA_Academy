-- Create SuperAdmin default account
-- This migration creates the default superadmin account: admin@admin.com / admin

-- Insert superadmin profile (schoolId will be NULL since superadmin manages all schools)
INSERT INTO profiles (id, email, full_name, school_id, password_hash, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'admin@admin.com',
    'Super Admin',
    '0', -- Special schoolId for superadmin (not linked to any specific school)
    '$2a$10$ZQJ8kG9c7vJYLqYxB3K3GuPxVpH4YyEqYUWQqYhPqBxXvMf5g5jSi', -- BCrypt hash for "admin"
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert superadmin role
INSERT INTO user_roles (id, user_id, role)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'superadmin'
) ON CONFLICT (id) DO NOTHING;
