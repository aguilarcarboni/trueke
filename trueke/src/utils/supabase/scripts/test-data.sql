INSERT INTO public.user (user_id, email, username, first_name, last_name, password_hash, status, is_admin, created_at, end_ban_date_time) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'testuser@example.com', 'testuser', 'Test', 'User', '$2b$10$ZdqzXWTK36WyVuO93uIgYOREj/fdn42Pk7UDjlRIvJNMMgI3hfOA6', 'active', false, NOW(), NULL),
    ('00000000-0000-0000-0000-000000000002', 'testbanned@example.com', 'testbanned', 'Test', 'Banned', '$2b$10$ZdqzXWTK36WyVuO93uIgYOREj/fdn42Pk7UDjlRIvJNMMgI3hfOA6', 'banned', false, NOW(), NOW() + INTERVAL '7 days'),
    ('00000000-0000-0000-0000-000000000003', 'testadmin@example.com', 'testadmin', 'Test', 'Admin', '$2b$10$ZdqzXWTK36WyVuO93uIgYOREj/fdn42Pk7UDjlRIvJNMMgI3hfOA6', 'active', true, NOW(), NULL),
    ('00000000-0000-0000-0000-000000000004', 'testinactive@example.com', 'testinactive', 'Test', 'Inactive', '$2b$10$ZdqzXWTK36WyVuO93uIgYOREj/fdn42Pk7UDjlRIvJNMMgI3hfOA6', 'inactive', false, NOW(), NULL);            

INSERT INTO "address" (address_id, country_code, address_line1, muni_district, canton_city, province_state, zip_code, created_at) VALUES
     ('aa000000-0000-0000-0000-000000000001', 'CR', 'Condominio La Escondida', 'Pozos', 'Santa Ana', 'San José', '10903', NOW());

INSERT INTO "user_address" (user_id, address_id) VALUES
    ('00000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000001');