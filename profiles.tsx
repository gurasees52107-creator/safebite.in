import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Leaf, ArrowLeft, LogOut, Trash2, Save, Plus, X, History, Loader2, AlertTriangle,
} from "lucide-react";
import { AppControls, gradientText } from "@/components/app-controls";
import { useProfile } from "@/hooks/use-profile";
import { updateProfile, deleteProfile } from "@/lib/accounts.functions";
import { listSaved, deleteSaved } from "@/lib/saved.functions";
import { AVATARS, getAvatar } from "@/lib/avatars";

export const Route = createFileRoute("/profiles")({
  head: () => ({ meta: [{ title: "Profile — Safe Bite" }] }),
  component: Profiles,
});

function Profiles() {
  const { accountToken, profile, token, loading, setSession, refresh, logout } = useProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-soft)" }}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!accountToken || !profile || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--gradient-soft)" }}>
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">No profile signed in</h1>
          <p className="text-muted-foreground mb-6">Pick a profile from the home screen to edit it.</p>
          <Button asChild variant="hero"><Link to="/">Go to profile picker</Link></Button>
        </Card>
      </div>
    );
  }

  return <ProfileEditor key={profile.id} />;

  function ProfileEditor() {
    const p = profile!;
    const t = token!;
    const at = accountToken!;
    const [username, setUsername] = useState(p.username);
    const [avatar, setAvatar] = useState(p.avatar);
    const [conditions, setConditions] = useState<string[]>(p.conditions);
    const [newCondition, setNewCondition] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");

    const saveMut = useMutation({
      mutationFn: async () => {
        const r = await updateProfile({
          data: {
            token: t,
            accountToken: at,
            avatar,
            conditions,
            newUsername: username !== p.username ? username : undefined,
            newPassword: newPassword || undefined,
          },
        });
        return r;
      },
      onSuccess: async (r) => {
        setSuccess("Saved.");
        setError("");
        setNewPassword("");
        if (r.user) setSession(t, r.user as any);
        else await refresh();
        await qc.invalidateQueries({ queryKey: ["profiles"] });
        setTimeout(() => setSuccess(""), 2000);
      },
      onError: (e: any) => setError(e?.message ?? "Could not save"),
    });

    const deleteMut = useMutation({
      mutationFn: () => deleteProfile({ data: { token: t, accountToken: at, password: deletePassword } }),
      onSuccess: async () => {
        await logout();
        await qc.invalidateQueries({ queryKey: ["profiles"] });
        navigate({ to: "/" });
      },
      onError: (e: any) => setError(e?.message ?? "Could not delete"),
    });

    const { data: saved = [], refetch: refetchSaved } = useQuery({
      queryKey: ["saved", p.id],
      queryFn: () => listSaved({ data: { token: t, accountToken: at } }),
    });

    const av = getAvatar(avatar);

    const addCondition = () => {
      const c = newCondition.trim();
      if (!c || conditions.includes(c) || conditions.length >= 20) return;
      setConditions([...conditions, c]);
      setNewCondition("");
    };

    return (
      <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
        <header className="border-b border-border/60 bg-background/70 backdrop-blur-md sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/home" className="flex items-center gap-2 font-semibold">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
                <Leaf className="w-5 h-5" />
              </span>
              <span>Safe Bite</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/home"><ArrowLeft className="w-4 h-4 mr-1" /> App</Link>
              </Button>
              <AppControls />
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-sm bg-gradient-to-br ${av.gradient}`}>
              <span>{av.emoji}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={gradientText}>{p.username}</h1>
              <p className="text-sm text-muted-foreground">Edit your profile, conditions, and saved history.</p>
            </div>
          </div>

          <Card className="p-6 space-y-5">
            <h2 className="text-lg font-semibold">Profile details</h2>

            <div>
              <label className="text-xs font-medium">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs font-medium">Avatar</label>
              <div className="mt-2 grid grid-cols-6 sm:grid-cols-12 gap-2">
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

            <div>
              <label className="text-xs font-medium">Your conditions (e.g. diabetes + peanut allergy)</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {conditions.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm text-foreground">
                    {c}
                    <button type="button" onClick={() => setConditions(conditions.filter((x) => x !== c))} className="hover:text-destructive">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                {conditions.length === 0 && (
                  <span className="text-xs text-muted-foreground">No conditions yet.</span>
                )}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCondition(); } }}
                  placeholder="e.g. lactose intolerance"
                  className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button type="button" variant="outline" onClick={addCondition}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium">Change password (optional)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="mt-1 w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}
            {success && <p className="text-primary text-sm">{success}</p>}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={() => saveMut.mutate()} variant="hero" disabled={saveMut.isPending}>
                {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Save changes
              </Button>
              <Button variant="outline" onClick={() => logout().then(() => navigate({ to: "/" }))}>
                <LogOut className="w-4 h-4 mr-1" /> Sign out
              </Button>
              <Button variant="outline" asChild>
                <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" /> Switch profile</Link>
              </Button>
            </div>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold inline-flex items-center gap-2"><History className="w-5 h-5" /> Saved history</h2>
              <span className="text-xs text-muted-foreground">{saved.length} items</span>
            </div>
            {saved.length === 0 && (
              <p className="text-sm text-muted-foreground">No saved items yet. Open a food check, recipe, menu scan, or meal plan and tap "Save".</p>
            )}
            <ul className="divide-y divide-border">
              {saved.map((s: any) => (
                <li key={s.id} className="py-3 flex items-start gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{String(s.kind).replace("_", " ")} • {new Date(s.created_at).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={async () => { await deleteSaved({ data: { token: t, accountToken: at, id: s.id } }); refetchSaved(); }}
                    className="text-muted-foreground hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 border-destructive/30">
            <h2 className="text-lg font-semibold inline-flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" /> Danger zone</h2>
            <p className="text-sm text-muted-foreground mt-1">Permanently delete this profile and all its saved history.</p>
            {!confirmDelete ? (
              <Button variant="outline" className="mt-3 border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete profile
              </Button>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter password to confirm"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button variant="outline" onClick={() => { setConfirmDelete(false); setDeletePassword(""); }}>Cancel</Button>
                <Button variant="destructive" onClick={() => deleteMut.mutate()} disabled={!deletePassword || deleteMut.isPending}>
                  {deleteMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm delete"}
                </Button>
              </div>
            )}
          </Card>
        </main>
      </div>
    );
  }
}
