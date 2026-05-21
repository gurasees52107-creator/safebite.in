import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Leaf, Apple, Camera, BookOpen, ChefHat, Utensils, CalendarRange, UserCircle } from "lucide-react";
import { AppControls, gradientText } from "@/components/app-controls";
import { VoiceButton } from "@/components/voice-button";
import { useLanguage } from "@/lib/app-prefs";
import { useProfile } from "@/hooks/use-profile";
import { getAvatar } from "@/lib/avatars";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Safe Bite — Personalized food guidance for your condition" },
      {
        name: "description",
        content:
          "Get tailored food advice for allergies and dietary conditions. Check foods by name or photo with Safe Bite.",
      },
      { property: "og:title", content: "Safe Bite — Personalized food guidance" },
      {
        property: "og:description",
        content: "Tailored food advice for your dietary condition. Check foods by name or photo.",
      },
    ],
  }),
  component: Home,
});

const examples = ["Wheat allergy", "Lactose intolerance", "Diabetes", "Peanut allergy", "Gluten-free"];

function Home() {
  const navigate = useNavigate();
  const [condition, setCondition] = useState("");
  const { lang } = useLanguage();
  const { profile } = useProfile();

  useEffect(() => {
    if (profile && profile.conditions.length > 0 && !condition) {
      setCondition(profile.conditions.join(" + "));
    }
  }, [profile]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = condition.trim();
    if (!c) return;
    navigate({ to: "/options", search: { c } });
  };

  const av = profile ? getAvatar(profile.avatar) : null;


  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
      <header className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
          <span
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-primary-foreground"
            style={{ background: "var(--gradient-hero)" }}
          >
            <Leaf className="w-5 h-5" />
          </span>
          <span>Safe Bite</span>
        </Link>
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
          {profile && av ? (
            <Link
              to="/profiles"
              className="inline-flex items-center gap-2 h-9 pl-1 pr-3 rounded-full border border-border bg-background/80 backdrop-blur-sm shadow-sm text-xs font-semibold hover:border-primary/40 transition-colors"
              title="Edit profile"
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-base bg-gradient-to-br ${av.gradient}`}>{av.emoji}</span>
              <span className="text-foreground">{profile.username}</span>
            </Link>
          ) : (
            <Link
              to="/"
              className="inline-flex items-center gap-1 h-9 px-3 rounded-full border border-border bg-background/80 backdrop-blur-sm shadow-sm text-xs font-semibold hover:border-primary/40 transition-colors text-foreground"
            >
              <UserCircle className="w-4 h-4" /> Sign in
            </Link>
          )}
          <AppControls />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-10 pb-24 text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
          <Leaf className="w-3.5 h-3.5" /> Eat with confidence
        </span>
        <h1 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
          Know what's <span style={{ backgroundImage: "var(--gradient-hero)", WebkitBackgroundClip: "text", color: "transparent" }}>safe to eat</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Tell us your dietary condition and get a personalized food guide, food checker, photo analysis, and safe recipes.
        </p>

        <form onSubmit={submit} className="mt-10 max-w-xl mx-auto">
          <label className="block text-left text-sm font-medium text-foreground mb-2">
            What is your condition or dietary restriction?
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              autoFocus
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="e.g. wheat allergy"
              className="flex-1 h-12 rounded-lg border border-input bg-background px-4 text-base focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
            />
            <VoiceButton onResult={setCondition} lang={lang} className="h-12 w-12" />
            <Button type="submit" variant="hero" size="lg" className="h-12 px-6">
              Continue
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setCondition(ex)}
                className="text-xs px-3 py-1.5 rounded-full bg-background border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </form>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-16 text-left">
          {[
            { icon: BookOpen, title: "Food guide", desc: "What to eat and what to avoid." },
            { icon: Apple, title: "Food checker", desc: "Ingredients, nutrition, instant verdict." },
            { icon: Camera, title: "Photo scan", desc: "Upload a picture of any meal." },
            { icon: ChefHat, title: "Safe recipe", desc: "Get a recipe adapted to your needs." },
            { icon: Utensils, title: "Restaurant menu scan", desc: "Photograph a menu, see safe picks." },
            { icon: CalendarRange, title: "7-day meal planner", desc: "Weekly plan + shopping list, PDF." },
          ].map((f) => (
            <div key={f.title} className="p-5 rounded-xl bg-background/70 border border-border backdrop-blur-sm">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-primary-foreground mb-3"
                style={{ background: "var(--gradient-hero)" }}
              >
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

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
    </div>
  );
}
