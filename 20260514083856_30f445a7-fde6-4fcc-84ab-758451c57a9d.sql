ALTER TABLE public.app_users
DROP CONSTRAINT IF EXISTS app_users_username_key;

DROP INDEX IF EXISTS public.idx_app_users_username;

CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_owner_username
ON public.app_users (owner_id, lower(username));