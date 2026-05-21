DROP POLICY IF EXISTS "No public access to app accounts" ON public.app_accounts;
CREATE POLICY "No public access to app accounts"
ON public.app_accounts
FOR ALL
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "No public access to account sessions" ON public.app_account_sessions;
CREATE POLICY "No public access to account sessions"
ON public.app_account_sessions
FOR ALL
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "No public access to app users" ON public.app_users;
CREATE POLICY "No public access to app users"
ON public.app_users
FOR ALL
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "No public access to app sessions" ON public.app_sessions;
CREATE POLICY "No public access to app sessions"
ON public.app_sessions
FOR ALL
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "No public access to saved items" ON public.saved_items;
CREATE POLICY "No public access to saved items"
ON public.saved_items
FOR ALL
USING (false)
WITH CHECK (false);