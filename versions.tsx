import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, ArrowLeft, BookOpen, Apple, Camera, ChefHat, Mic, Languages, Moon, UserCircle, CalendarRange, Utensils, AlertTriangle, Flame } from "lucide-react";
import { gradientText } from "@/components/app-controls";

export const Route = createFileRoute("/versions")({
  head: () => ({
    meta: [
      { title: "Versions — Safe Bite" },
      { name: "description", content: "Release notes and feature history for Safe Bite." },
      { property: "og:title", content: "Versions — Safe Bite" },
      { property: "og:description", content: "Release notes and feature history for Safe Bite." },
    ],
  }),
  component: Versions,
});

const versions = [
  {
    name: "Version 1",
    tagline: "The launch — core food guidance.",
    features: [
      { icon: BookOpen, title: "Food guide", desc: "Personalized list of foods to eat and avoid for your condition." },
      { icon: Apple, title: "Food checker", desc: "Type any food and get an instant safe / caution / avoid verdict." },
      { icon: Camera, title: "Photo scan", desc: "Upload a picture of a meal and get an instant verdict." },
    ],
  },
  {
    name: "Version 2",
    tagline: "Smarter, more accessible, more personal.",
    features: [
      { icon: ChefHat, title: "Safe recipes", desc: "Enter any dish and get a recipe adapted to your dietary needs." },
      { icon: Mic, title: "Voice support", desc: "Speak your condition, food, or dish instead of typing." },
      { icon: Languages, title: "All languages", desc: "Get answers in 25+ languages including Hindi, Spanish, Arabic, and more." },
      { icon: Moon, title: "Dark mode", desc: "Easier on the eyes, with a brand-matched dark theme." },
    ],
  },
  {
    name: "Version 3",
    tagline: "Smarter, deeper, and more useful day-to-day.",
    features: [
      { icon: UserCircle, title: "User accounts & saved history", desc: "Log in to save past food checks, recipes, and your condition profile. Combine multiple conditions (e.g. diabetes + peanut allergy)." },
      { icon: CalendarRange, title: "7-day meal planner", desc: "Generate a balanced weekly meal plan with a shopping list, exportable as PDF." },
      { icon: Utensils, title: "Restaurant menu scan", desc: "Upload a photo of a menu and instantly see which dishes are safe, caution, or avoid." },
      { icon: AlertTriangle, title: "Ingredient-level breakdown", desc: "Instead of just 'avoid', see exactly which ingredient is the problem and why." },
      { icon: Flame, title: "Nutrition info", desc: "Calories, macros, and glycemic index alongside every food verdict." },
    ],
  },
  {
    name: "Version 4",
    tagline: "Coming soon.",
    features: [
      { icon: BookOpen, title: "More to come", desc: "We're cooking up the next set of features. Stay tuned." },
    ],
    upcoming: true,
  },
];

function Versions() {
  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
            <span
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-primary-foreground"
              style={{ background: "var(--gradient-hero)" }}
            >
              <Leaf className="w-5 h-5" />
            </span>
            <span>Safe Bite</span>
          </Link>
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
            Release notes
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight" style={gradientText}>Versions</h1>
          <p className="mt-3 text-muted-foreground">A short history of what's shipped in Safe Bite.</p>
        </div>

        <div className="space-y-10">
          {versions.map((v) => (
            <section
              key={v.name}
              className={`p-6 rounded-2xl border bg-background/70 backdrop-blur-sm ${
                v.upcoming ? "border-dashed border-primary/40" : "border-border"
              }`}
            >
              <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
                <h2 className="text-2xl font-bold" style={gradientText}>{v.name}</h2>
                {v.upcoming && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/15 text-secondary border border-secondary/30">
                    Coming soon
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-5">{v.tagline}</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {v.features.map((f) => (
                  <div
                    key={f.title}
                    className="p-5 rounded-xl bg-background/70 border border-border backdrop-blur-sm"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-primary-foreground mb-3"
                      style={{ background: "var(--gradient-hero)" }}
                    >
                      <f.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold" style={gradientText}>{f.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
