import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Leaf, Plus, UserCog, LogIn, Loader2, LockKeyhole, UserPlus, LogOut } from "lucide-react";
import { AppControls, gradientText } from "@/components/app-controls";
import { createAccount, listProfiles, loginProfile, createProfile, loginAccount } from "@/lib/accounts.functions";
import { AVATARS, getAvatar } from "@/lib/avatars";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Choose your profile — Safe Bite" },
      { name: "description", content: "Pick a private profile to get personalized food guidance, saved checks, recipes, and meal plans." },
    ],
  }),
  component: ProfilePicker,
});

type ProfileTile = {
  id: string;
  username: string;
  avatar: string;
};

type DialogMode =
  | { kind: "none" }
  | { kind: "account-login" }
  | { kind: "account-create" }
  | { kind: "login"; username: string }
  | { kind: "create" };

function ProfilePicker() {
  const navigate = useNavigate();
  const {
    account,
    accountToken,
    profile,
    setAccountSession,
    setSession,
    logoutAccountSession,
    loading: meLoading,
  } = useProfile();
  const [dialog, setDialog] = useState<DialogMode>({ kind: "none" });

  const { data: profiles = [], isLoading, refetch } = useQuery({
    queryKey: ["profiles", accountToken],
    enabled: Boolean(accountToken),
    queryFn: async () => {
      if (!accountToken) return [] as ProfileTile[];
      return (await listProfiles({ data: { accountToken } })) as ProfileTile[];
    },
  });

  useEffect(() => {
    if (!meLoading && profile) {
      navigate({ to: "/home" });
    }
  }, [meLoading, profile, navigate]);

  const header = (
    <header className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
      <div className="flex items-center gap-2 font-semibold text-lg">
        <span
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-primary-foreground"
          style={{ background: "var(--gradient-hero)" }}
        >
          <Leaf className="w-5 h-5" />
        </span>
        <span>Safe Bite</span>
      </div>
      <div className="flex items-center gap-2">
        <a
          href="/versions"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center h-9 px-3 rounded-full border border-border bg-background/80 backdrop-blur-sm shadow-sm text-xs font-semibold hover:border-primary/40 transition-colors"
          style={gradientText}
        >
          Versions
        </a>
        <AppControls />
      </div>
    </header>
  );

  if (!accountToken || !account) {
    return (
      <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
        {header}
        <main className="max-w-3xl mx-auto px-6 pt-10 pb-24 text-center">
          <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center text-primary-foreground mb-6" style={{ background: "var(--gradient-hero)" }}>
            <LockKeyhole className="w-9 h-9" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Sign in to your private account
          </h1>
          <p className="mt-3 text-muted-foreground">
            Only profiles created inside your account will be visible here.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="hero" size="lg" onClick={() => setDialog({ kind: "account-login" })}>
              <LogIn className="w-4 h-4 mr-2" /> Sign in
            </Button>
            <Button variant="outline" size="lg" onClick={() => setDialog({ kind: "account-create" })}>
              <UserPlus className="w-4 h-4 mr-2" /> Create account
            </Button>
          </div>
          <div className="text-center mt-10">
            <Link to="/home" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
              Continue as guest →
            </Link>
          </div>
        </main>

        {dialog.kind === "account-login" && (
          <AccountLoginDialog
            onClose={() => setDialog({ kind: "none" })}
            onSuccess={(newAccountToken, newAccount) => {
              setAccountSession(newAccountToken, newAccount);
              setDialog({ kind: "none" });
            }}
          />
        )}
        {dialog.kind === "account-create" && (
          <CreateAccountDialog
            onClose={() => setDialog({ kind: "none" })}
            onSuccess={(newAccountToken, newAccount, token, user) => {
              setAccountSession(newAccountToken, newAccount);
              setSession(token, user);
              navigate({ to: "/home" });
            }}
          />
        )}
        <VersionFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
      {header}

      <main className="max-w-5xl mx-auto px-6 pt-6 pb-24">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold" style={gradientText}>{account.username}'s private account</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Who's eating?
          </h1>
          <p className="mt-3 text-muted-foreground">
            These profiles are private to this account. Other users cannot see or choose them.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => logoutAccountSession()}>
            <LogOut className="w-4 h-4 mr-2" /> Sign out of account
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <Link
            to="/profiles"
            className="group rounded-2xl p-5 bg-background/80 backdrop-blur-sm border border-border hover:border-primary/40 hover:shadow-md transition-all text-center flex flex-col items-center justify-center"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl text-primary-foreground mb-3"
              style={{ background: "var(--gradient-hero)" }}
            >
              <UserCog className="w-8 h-8" />
            </div>
            <p className="font-semibold text-foreground">Profiles</p>
            <p className="text-xs text-muted-foreground mt-1">Manage & edit</p>
          </Link>

          {isLoading && (
            <div className="col-span-full flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}

          {profiles.map((p) => {
            const av = getAvatar(p.avatar);
            return (
              <button
                key={p.id}
                onClick={() => setDialog({ kind: "login", username: p.username })}
                className="group rounded-2xl p-5 bg-background/80 backdrop-blur-sm border border-border hover:border-primary/40 hover:shadow-md transition-all text-center flex flex-col items-center"
              >
                <div
                  className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-sm bg-gradient-to-br ${av.gradient} mb-3`}
                >
                  <span>{av.emoji}</span>
                </div>
                <p className="font-semibold text-foreground truncate w-full">{p.username}</p>
                <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                  <LogIn className="w-3 h-3" /> Sign in
                </p>
              </button>
            );
          })}

          <button
            onClick={() => setDialog({ kind: "create" })}
            className="group rounded-2xl p-5 bg-background/60 border-2 border-dashed border-border hover:border-primary/60 transition-all text-center flex flex-col items-center justify-center"
          >
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-background border border-border mb-3">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">Add profile</p>
            <p className="text-xs text-muted-foreground mt-1">Private to this account</p>
          </button>
        </div>

        <div className="text-center mt-10">
          <Link to="/home" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Continue as guest →
          </Link>
        </div>
      </main>

      {dialog.kind === "login" && (
        <LoginDialog
          username={dialog.username}
          accountToken={accountToken}
          onClose={() => setDialog({ kind: "none" })}
          onSuccess={(token, user) => {
            setSession(token, user);
            navigate({ to: "/home" });
          }}
        />
      )}
      {dialog.kind === "create" && (
        <CreateDialog
          accountToken={accountToken}
          onClose={() => setDialog({ kind: "none" })}
          onSuccess={async (token, user) => {
            setSession(token, user);
            await refetch();
            navigate({ to: "/home" });
          }}
        />
      )}

      <VersionFooter />
    </div>
  );
}

function VersionFooter() {
  return (
    <footer className="fixed bottom-0 inset-x-0 px-4 py-3 flex justify-between pointer-events-none z-20">
      <span
        className="pointer-events-auto inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border border-primary/30 bg-background/80 backdrop-blur-sm shadow-sm"
        style={gradientText}
      >
        V3.0
      </span>
      <span
        className="pointer-events-auto inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border border-secondary/30 bg-background/80 backdrop-blur-sm shadow-sm"
        style={gradientText}
      >
        V4.0 Coming Soon
      </span>
    </footer>
  );
}

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        {children}
      </Card>
    </div>
  );
}

function AccountLoginDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (accountToken: string, account: any) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await loginAccount({ data: { username, password } });
      onSuccess(r.accountToken, r.account);
    } catch (e: any) {
      setError(e?.message ?? "Could not sign in");
    } finally {
      setLoading(false);
    }
  };
  return (
    <ModalShell onClose={onClose}>
      <h2 className="text-xl font-semibold mb-1">Sign in to your account</h2>
      <p className="text-sm text-muted-foreground mb-4">Enter your account name and password to see only your profiles.</p>
      <form onSubmit={submit} className="space-y-3">
        <input
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Account username"
          className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {error && <p className="text-destructive text-sm">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="hero" disabled={loading || !username || !password}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

function LoginDialog({
  username,
  accountToken,
  onClose,
  onSuccess,
}: {
  username: string;
  accountToken: string;
  onClose: () => void;
  onSuccess: (token: string, user: any) => void;
}) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await loginProfile({ data: { accountToken, username, password } });
      onSuccess(r.token, r.user);
    } catch (e: any) {
      setError(e?.message ?? "Could not sign in");
    } finally {
      setLoading(false);
    }
  };
  return (
    <ModalShell onClose={onClose}>
      <h2 className="text-xl font-semibold mb-1">Welcome back, {username}</h2>
      <p className="text-sm text-muted-foreground mb-4">Enter this profile's password to continue.</p>
      <form onSubmit={submit} className="space-y-3">
        <input
          autoFocus
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Profile password"
          className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {error && <p className="text-destructive text-sm">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="hero" disabled={loading || !password}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

function CreateAccountDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (accountToken: string, account: any, token: string, user: any) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await createAccount({ data: { username, password, avatar } });
      onSuccess(r.accountToken, r.account, r.token, r.user);
    } catch (e: any) {
      setError(e?.message ?? "Could not create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <h2 className="text-xl font-semibold mb-1">Create private account</h2>
      <p className="text-sm text-muted-foreground mb-4">This creates your private account and your first profile.</p>
      <ProfileForm
        username={username}
        password={password}
        avatar={avatar}
        loading={loading}
        error={error}
        submitLabel="Create account"
        onClose={onClose}
        onSubmit={submit}
        setUsername={setUsername}
        setPassword={setPassword}
        setAvatar={setAvatar}
      />
    </ModalShell>
  );
}

function CreateDialog({
  accountToken,
  onClose,
  onSuccess,
}: {
  accountToken: string;
  onClose: () => void;
  onSuccess: (token: string, user: any) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await createProfile({ data: { accountToken, username, password, avatar } });
      onSuccess(r.token, r.user);
    } catch (e: any) {
      setError(e?.message ?? "Could not create profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <h2 className="text-xl font-semibold mb-1">Create a private profile</h2>
      <p className="text-sm text-muted-foreground mb-4">This profile will only appear inside this account.</p>
      <ProfileForm
        username={username}
        password={password}
        avatar={avatar}
        loading={loading}
        error={error}
        submitLabel="Create profile"
        onClose={onClose}
        onSubmit={submit}
        setUsername={setUsername}
        setPassword={setPassword}
        setAvatar={setAvatar}
      />
    </ModalShell>
  );
}

function ProfileForm({
  username,
  password,
  avatar,
  loading,
  error,
  submitLabel,
  onClose,
  onSubmit,
  setUsername,
  setPassword,
  setAvatar,
}: {
  username: string;
  password: string;
  avatar: string;
  loading: boolean;
  error: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  setUsername: (value: string) => void;
  setPassword: (value: string) => void;
  setAvatar: (value: string) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-medium text-foreground">Username</label>
        <input
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. king"
          className="mt-1 w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-foreground">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 4 characters"
          className="mt-1 w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-foreground">Avatar</label>
        <div className="mt-2 grid grid-cols-6 gap-2">
          {AVATARS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAvatar(a.id)}
              className={`aspect-square rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${a.gradient} transition-all ${
                avatar === a.id ? "ring-2 ring-primary ring-offset-2" : "opacity-70 hover:opacity-100"
              }`}
              title={a.label}
            >
              {a.emoji}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="hero" disabled={loading || !username || password.length < 4}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : submitLabel}
        </Button>
      </div>
    </form>
  );
}
