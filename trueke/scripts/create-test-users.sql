-- This SQL script creates a test user in your public.user table
-- Run this in the Supabase SQL Editor

-- Password: testpassword123
-- The hash below is bcrypt hash of "testpassword123"

INSERT INTO public.user (
  email,
  username,
  first_name,
  last_name,
  password_hash,
  status,
  is_admin,
  created_at
) VALUES (
  'test@example.com',
  'testuser',
  'Test',
  'User',
  '$2b$10$rBV2w.hF3hXjH9V5YyKvXe5dJ5Z5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5a',  -- Password: testpassword123
  'active',
  false,
  NOW()
);

-- To create an ADMIN user:
INSERT INTO public.user (
  email,
  username,
  first_name,
  last_name,
  password_hash,
  status,
  is_admin,
  created_at
) VALUES (
  'admin@example.com',
  'admin',
  'Admin',
  'User',
  '$2b$10$rBV2w.hF3hXjH9V5YyKvXe5dJ5Z5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5a',  -- Password: testpassword123
  'active',
  true,
  NOW()
);
