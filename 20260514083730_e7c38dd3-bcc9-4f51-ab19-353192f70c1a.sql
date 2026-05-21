CREATE TABLE IF NOT EXISTS public.app_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_accounts_username ON public.app_accounts (lower(username));

ALTER TABLE public.app_accounts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.app_users
ADD COLUMN IF NOT EXISTS owner_id UUID;

INSERT INTO public.app_accounts (username, password_hash, created_at, updated_at)
SELECT username, password_hash, created_at, updated_at
FROM public.app_users
ON CONFLICT (username) DO NOTHING;

UPDATE public.app_users u
SET owner_id = a.id
FROM public.app_accounts a
WHERE u.owner_id IS NULL
  AND lower(a.username) = lower(u.username);

ALTER TABLE public.app_users
ALTER COLUMN owner_id SET NOT NULL;

ALTER TABLE public.app_users
DROP CONSTRAINT IF EXISTS app_users_owner_id_fkey;

ALTER TABLE public.app_users
ADD CONSTRAINT app_users_owner_id_fkey
FOREIGN KEY (owner_id) REFERENCES public.app_accounts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_app_users_owner ON public.app_users (owner_id, created_at);

CREATE TABLE IF NOT EXISTS public.app_account_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.app_accounts(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '90 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_account_sessions_account ON public.app_account_sessions (account_id);

ALTER TABLE public.app_account_sessions ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_app_accounts_updated_at ON public.app_accounts;
CREATE TRIGGER update_app_accounts_updated_at
BEFORE UPDATE ON public.app_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();