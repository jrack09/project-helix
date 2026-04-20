-- Promote a user to editor or admin role.
-- Usage: after signing up a seed account through the app, look up the auth.users id
--        with `select id, email from auth.users where email = 'you@example.com';`
--        then substitute it below and run.
-- 
-- Roles available: 'member' (default), 'editor', 'admin'.

-- update public.profiles
-- set role = 'editor'
-- where id = '00000000-0000-0000-0000-000000000000';

-- update public.profiles
-- set role = 'admin'
-- where id = '00000000-0000-0000-0000-000000000000';
