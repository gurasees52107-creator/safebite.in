import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { getAccount, getMe, logoutAccount, logoutProfile } from "@/lib/accounts.functions";

export type Profile = {
  id: string;
  username: string;
  avatar: string;
  conditions: string[];
};

export type Account = {
  id: string;
  username: string;
};

type Ctx = {
  account: Account | null;
  accountToken: string | null;
  profile: Profile | null;
  token: string | null;
  loading: boolean;
  setAccountSession: (accountToken: string, account: Account) => void;
  setSession: (token: string, profile: Profile) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  logoutAccountSession: () => Promise<void>;
};

const ProfileContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "safebite.token";
const ACCOUNT_STORAGE_KEY = "safebite.accountToken";

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [accountToken, setAccountToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const at = typeof window !== "undefined" ? localStorage.getItem(ACCOUNT_STORAGE_KEY) : null;
    const t = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;

    if (!at) {
      localStorage.removeItem(STORAGE_KEY);
      setAccount(null);
      setAccountToken(null);
      setProfile(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const acct = await getAccount({ data: { accountToken: at } });
      if (!acct) {
        localStorage.removeItem(ACCOUNT_STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
        setAccount(null);
        setAccountToken(null);
        setProfile(null);
        setToken(null);
        return;
      }

      setAccount(acct as Account);
      setAccountToken(at);

      if (t) {
        const me = await getMe({ data: { token: t, accountToken: at } });
        if (me) {
          setProfile(me as Profile);
          setToken(t);
        } else {
          localStorage.removeItem(STORAGE_KEY);
          setProfile(null);
          setToken(null);
        }
      } else {
        setProfile(null);
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setAccountSession = useCallback((at: string, a: Account) => {
    localStorage.setItem(ACCOUNT_STORAGE_KEY, at);
    localStorage.removeItem(STORAGE_KEY);
    setAccountToken(at);
    setAccount(a);
    setToken(null);
    setProfile(null);
  }, []);

  const setSession = useCallback((t: string, p: Profile) => {
    localStorage.setItem(STORAGE_KEY, t);
    setToken(t);
    setProfile(p);
  }, []);

  const logout = useCallback(async () => {
    const t = token;
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setProfile(null);
    if (t) {
      try {
        await logoutProfile({ data: { token: t } });
      } catch {}
    }
  }, [token]);

  const logoutAccountSession = useCallback(async () => {
    const at = accountToken;
    const t = token;
    localStorage.removeItem(ACCOUNT_STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    setAccount(null);
    setAccountToken(null);
    setProfile(null);
    setToken(null);
    if (t) {
      try {
        await logoutProfile({ data: { token: t } });
      } catch {}
    }
    if (at) {
      try {
        await logoutAccount({ data: { accountToken: at } });
      } catch {}
    }
  }, [accountToken, token]);

  return (
    <ProfileContext.Provider
      value={{
        account,
        accountToken,
        profile,
        token,
        loading,
        setAccountSession,
        setSession,
        refresh,
        logout,
        logoutAccountSession,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
