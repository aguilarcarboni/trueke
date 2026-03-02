INSERT INTO public.user (email, username, first_name, last_name, password_hash, status, is_admin, created_at, end_ban_date_time) VALUES 
    ('testuser@example.com', 'testuser', 'Test', 'User', '$2b$10$ZdqzXWTK36WyVuO93uIgYOREj/fdn42Pk7UDjlRIvJNMMgI3hfOA6', 'active', false, NOW(), NULL),
    ('testbanned@example.com', 'testbanned', 'Test', 'Banned', '$2b$10$ZdqzXWTK36WyVuO93uIgYOREj/fdn42Pk7UDjlRIvJNMMgI3hfOA6', 'banned', false, NOW(), NOW() + INTERVAL '7 days'),
    ('testadmin@example.com', 'testadmin', 'Test', 'Admin', '$2b$10$ZdqzXWTK36WyVuO93uIgYOREj/fdn42Pk7UDjlRIvJNMMgI3hfOA6', 'active', true, NOW(), NULL),
    ('testinactive@example.com', 'testinactive', 'Test', 'Inactive', '$2b$10$ZdqzXWTK36WyVuO93uIgYOREj/fdn42Pk7UDjlRIvJNMMgI3hfOA6', 'inactive', false, NOW(), NULL);            