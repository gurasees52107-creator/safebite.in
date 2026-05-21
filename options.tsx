import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { BookOpen, Apple, Camera, ArrowLeft, Leaf, ChefHat, Utensils, CalendarRange } from "lucide-react";
import {
  GuidePanel,
  CheckFoodPanel,
  ImageCheckPanel,
  RecipePanel,
  MenuScanPanel,
  MealPlannerPanel,
} from "@/components/diet-panels";
import { AppControls } from "@/components/app-controls";

const searchSchema = z.object({ c: z.string().min(1).max(200) });

export const Route = createFileRoute("/options")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Choose an option — Safe Bite" },
      { name: "description", content: "Get a food guide, check a food, or scan a photo for your dietary condition." },
    ],
  }),
  component: Options,
});

type Mode = "guide" | "check" | "photo" | "recipe" | "menu" | "plan" | null;

const tiles: { id: Exclude<Mode, null>; icon: any; title: string; desc: string }[] = [
  { id: "guide", icon: BookOpen, title: "Foods to eat & avoid", desc: "Get a complete personalized list." },
  { id: "check", icon: Apple, title: "Check a specific food", desc: "Ingredients, nutrition, instant verdict." },
  { id: "photo", icon: Camera, title: "Scan a food photo", desc: "Upload an image and get a verdict." },
  { id: "recipe", icon: ChefHat, title: "Safe recipe", desc: "Enter a dish and get a tailored recipe." },
  { id: "menu", icon: Utensils, title: "Restaurant menu scan", desc: "Photo of a menu — items marked safely." },
  { id: "plan", icon: CalendarRange, title: "7-day meal planner", desc: "Weekly plan + shopping list, PDF export." },
];

function Options() {
  const { c } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(null);

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
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
            <button
              onClick={() => navigate({ to: "/" })}
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Change condition
            </button>
            <AppControls />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <p className="text-sm text-muted-foreground">Your condition</p>
          <h1 className="text-3xl sm:text-4xl font-bold mt-1 text-foreground">{c}</h1>
          <p className="mt-3 text-muted-foreground">Choose how you'd like to explore your food options.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {tiles.map((t) => {
            const active = mode === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setMode(t.id)}
                className={`text-left p-6 rounded-2xl border transition-all ${
                  active
                    ? "border-primary shadow-lg -translate-y-0.5 bg-background"
                    : "border-border bg-background/70 hover:border-primary/50 hover:-translate-y-0.5"
                }`}
                style={active ? { boxShadow: "var(--shadow-elegant)" } : undefined}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-primary-foreground mb-4"
                  style={{ background: "var(--gradient-hero)" }}
                >
                  <t.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">{t.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t.desc}</p>
              </button>
            );
          })}
        </div>

        <div className="space-y-6">
          {mode === "guide" && <GuidePanel condition={c} />}
          {mode === "check" && <CheckFoodPanel condition={c} />}
          {mode === "photo" && <ImageCheckPanel condition={c} />}
          {mode === "recipe" && <RecipePanel condition={c} />}
          {mode === "menu" && <MenuScanPanel condition={c} />}
          {mode === "plan" && <MealPlannerPanel condition={c} />}
          {!mode && (
            <p className="text-center text-sm text-muted-foreground">Pick an option above to get started.</p>
          )}
        </div>
      </main>
    </div>
  );
}
