import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, AlertTriangle, Download, Bookmark, Check } from "lucide-react";
import {
  getGuide,
  checkFood,
  checkFoodImage,
  getRecipe,
  scanMenu,
  getMealPlan,
} from "@/utils/diet.functions";
import { useLanguage } from "@/lib/app-prefs";
import { VoiceButton } from "@/components/voice-button";
import { useProfile } from "@/hooks/use-profile";
import { saveItem } from "@/lib/saved.functions";

function SaveButton({
  kind,
  title,
  payload,
}: {
  kind: "food_check" | "recipe" | "menu_scan" | "meal_plan" | "guide";
  title: string;
  payload: unknown;
}) {
  const { accountToken, token } = useProfile();
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  if (!token || !accountToken) return null;
  const onClick = async () => {
    setState("saving");
    try {
      await saveItem({ data: { token, accountToken, kind, title, payload } });
      setState("saved");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("idle");
    }
  };
  return (
    <Button onClick={onClick} variant="outline" size="sm" disabled={state !== "idle"}>
      {state === "saving" && <Loader2 className="w-4 h-4 animate-spin" />}
      {state === "saved" && <Check className="w-4 h-4" />}
      {state === "idle" && <Bookmark className="w-4 h-4" />}
      <span className="ml-2">{state === "saved" ? "Saved" : "Save"}</span>
    </Button>
  );
}

type Verdict = "safe" | "caution" | "avoid" | string;

const verdictStyle: Record<string, { label: string; cls: string }> = {
  safe: { label: "Safe to eat", cls: "bg-primary/15 text-primary border-primary/30" },
  caution: { label: "Eat with caution", cls: "bg-secondary/15 text-secondary border-secondary/30" },
  avoid: { label: "Avoid", cls: "bg-destructive/15 text-destructive border-destructive/30" },
};

function VerdictBadge({ verdict, compact = false }: { verdict: Verdict; compact?: boolean }) {
  const v = verdictStyle[verdict] ?? verdictStyle.caution;
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${
        compact ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      } ${v.cls}`}
    >
      {v.label}
    </span>
  );
}

export function GuidePanel({ condition }: { condition: string }) {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<string>("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await getGuide({ data: { condition, language: lang } });
      setContent(r.content);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load guide");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-1">Foods to eat & avoid</h3>
      <p className="text-sm text-muted-foreground mb-4">
        A personalized food guide for <strong>{condition}</strong>.
      </p>
      {!content && !loading && (
        <Button onClick={load} variant="hero">
          Generate my guide
        </Button>
      )}
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Preparing your guide…
        </div>
      )}
      {error && <p className="text-destructive text-sm">{error}</p>}
      {content && (
        <>
          <div className="flex justify-end mb-3">
            <SaveButton kind="guide" title={`Guide: ${condition}`} payload={{ condition, content }} />
          </div>
          <article className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground leading-relaxed">
            {content}
          </article>
        </>
      )}
    </Card>
  );
}

type CheckResult = Awaited<ReturnType<typeof checkFood>>;

export function CheckFoodPanel({ condition }: { condition: string }) {
  const { lang } = useLanguage();
  const [food, setFood] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!food.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const r = await checkFood({ data: { condition, food, language: lang } });
      setResult(r);
    } catch (e: any) {
      setError(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-1">Check a specific food</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Type or speak any food and we'll check it against <strong>{condition}</strong>.
      </p>
      <form onSubmit={submit} className="flex gap-2 mb-4">
        <input
          value={food}
          onChange={(e) => setFood(e.target.value)}
          placeholder="e.g. whole wheat bread"
          className="flex-1 h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <VoiceButton onResult={setFood} lang={lang} className="h-11 w-11" />
        <Button type="submit" disabled={loading} variant="hero">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check"}
        </Button>
      </form>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <VerdictBadge verdict={result.verdict} />
            <SaveButton kind="food_check" title={food} payload={{ food, condition, ...result }} />
          </div>
          <p className="text-foreground leading-relaxed">{result.reason}</p>

          {result.problemIngredients.length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 mb-2 text-destructive font-medium text-sm">
                <AlertTriangle className="w-4 h-4" /> Problem ingredients
              </div>
              <ul className="space-y-1.5">
                {result.problemIngredients.map((p, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-semibold text-foreground">{p.name}</span>{" "}
                    <span className="text-muted-foreground">— {p.issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.nutrition && (
            <div className="rounded-lg border border-border bg-background/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Nutrition (per typical serving)</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                {[
                  ["Calories", result.nutrition.calories],
                  ["Protein", result.nutrition.protein],
                  ["Carbs", result.nutrition.carbs],
                  ["Fat", result.nutrition.fat],
                  ["GI", result.nutrition.glycemicIndex ?? "—"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-muted-foreground">{k}</p>
                    <p className="font-semibold text-foreground">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function ImageCheckPanel({ condition }: { condition: string }) {
  const { lang } = useLanguage();
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ food: string; verdict: string; reason: string } | null>(null);
  const [error, setError] = useState("");

  const onFile = async (file: File) => {
    setError("");
    setResult(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      setLoading(true);
      try {
        const r = await checkFoodImage({ data: { condition, imageDataUrl: dataUrl, language: lang } });
        setResult(r);
      } catch (e: any) {
        setError(e?.message ?? "Failed");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-1">Identify food from a photo</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Upload a picture and we'll tell you if it's compatible with <strong>{condition}</strong>.
      </p>
      <label
        className="block border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/60 transition-colors"
        style={{ background: "var(--gradient-soft)" }}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        {preview ? (
          <img src={preview} alt="Selected food" className="max-h-64 mx-auto rounded-lg shadow-md" />
        ) : (
          <div className="text-muted-foreground">
            <p className="font-medium text-foreground">Click to upload an image</p>
            <p className="text-sm mt-1">JPG, PNG, or HEIC</p>
          </div>
        )}
      </label>
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground mt-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Analyzing image…
        </div>
      )}
      {error && <p className="text-destructive text-sm mt-3">{error}</p>}
      {result && (
        <div className="space-y-3 mt-5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">
              Identified: <span className="font-medium text-foreground">{result.food}</span>
            </p>
            <SaveButton kind="food_check" title={result.food} payload={{ ...result, condition }} />
          </div>
          <VerdictBadge verdict={result.verdict} />
          <p className="text-foreground leading-relaxed">{result.reason}</p>
        </div>
      )}
    </Card>
  );
}

export function RecipePanel({ condition }: { condition: string }) {
  const { lang } = useLanguage();
  const [dish, setDish] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dish.trim()) return;
    setLoading(true);
    setError("");
    setContent("");
    try {
      const r = await getRecipe({ data: { condition, dish, language: lang } });
      setContent(r.content);
    } catch (e: any) {
      setError(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-1">Get a safe recipe</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Enter or speak any dish — we'll adapt the recipe for <strong>{condition}</strong>.
      </p>
      <form onSubmit={submit} className="flex gap-2 mb-4">
        <input
          value={dish}
          onChange={(e) => setDish(e.target.value)}
          placeholder="e.g. chocolate chip cookies"
          className="flex-1 h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <VoiceButton onResult={setDish} lang={lang} className="h-11 w-11" />
        <Button type="submit" disabled={loading} variant="hero">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get recipe"}
        </Button>
      </form>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {content && (
        <>
          <div className="flex justify-end mb-3">
            <SaveButton kind="recipe" title={`Recipe: ${dish}`} payload={{ dish, condition, content }} />
          </div>
          <article className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground leading-relaxed">
            {content}
          </article>
        </>
      )}
    </Card>
  );
}

export function MenuScanPanel({ condition }: { condition: string }) {
  const { lang } = useLanguage();
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<{ name: string; verdict: string; reason: string }[]>([]);
  const [error, setError] = useState("");

  const onFile = async (file: File) => {
    setError("");
    setItems([]);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      setLoading(true);
      try {
        const r = await scanMenu({ data: { condition, imageDataUrl: dataUrl, language: lang } });
        setItems(r.items);
      } catch (e: any) {
        setError(e?.message ?? "Failed");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-1">Restaurant menu scan</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Upload a photo of a menu — we'll mark each dish safe / caution / avoid for <strong>{condition}</strong>.
      </p>
      <label
        className="block border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/60 transition-colors"
        style={{ background: "var(--gradient-soft)" }}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        {preview ? (
          <img src={preview} alt="Selected menu" className="max-h-72 mx-auto rounded-lg shadow-md" />
        ) : (
          <div className="text-muted-foreground">
            <p className="font-medium text-foreground">Click to upload a menu photo</p>
            <p className="text-sm mt-1">JPG, PNG</p>
          </div>
        )}
      </label>
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground mt-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Reading menu…
        </div>
      )}
      {error && <p className="text-destructive text-sm mt-3">{error}</p>}
      {items.length > 0 && (
        <>
          <div className="flex justify-end mt-4">
            <SaveButton kind="menu_scan" title={`Menu scan (${items.length} items)`} payload={{ condition, items }} />
          </div>
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border overflow-hidden">
            {items.map((it, i) => (
              <li key={i} className="p-3 flex items-start gap-3 bg-background/60">
                <VerdictBadge verdict={it.verdict} compact />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{it.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{it.reason}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

export function MealPlannerPanel({ condition }: { condition: string }) {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<Awaited<ReturnType<typeof getMealPlan>> | null>(null);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError("");
    setPlan(null);
    try {
      const r = await getMealPlan({ data: { condition, language: lang } });
      setPlan(r);
    } catch (e: any) {
      setError(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = async () => {
    if (!plan) return;
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 40;
      let y = margin;
      const pageH = doc.internal.pageSize.getHeight();
      const pageW = doc.internal.pageSize.getWidth();
      const wrap = (text: string, width: number) => doc.splitTextToSize(text || "", width);

      const ensure = (h: number) => {
        if (y + h > pageH - margin) {
          doc.addPage();
          y = margin;
        }
      };

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("7-Day Meal Plan — Safe Bite", margin, y);
      y += 24;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Condition: ${condition}`, margin, y);
      y += 20;
      doc.setTextColor(0);

      plan.days.forEach((d) => {
        ensure(80);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text(d.day, margin, y);
        y += 16;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const rows: [string, string][] = [
          ["Breakfast", d.breakfast],
          ["Lunch", d.lunch],
          ["Dinner", d.dinner],
          ["Snack", d.snack],
        ];
        rows.forEach(([k, v]) => {
          const lines = wrap(`${k}: ${v}`, pageW - margin * 2);
          ensure(lines.length * 14 + 4);
          doc.text(lines, margin, y);
          y += lines.length * 14 + 2;
        });
        y += 8;
      });

      if (plan.shoppingList.length) {
        ensure(40);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.text("Shopping list", margin, y);
        y += 18;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        plan.shoppingList.forEach((it) => {
          const lines = wrap(`• ${it}`, pageW - margin * 2);
          ensure(lines.length * 14);
          doc.text(lines, margin, y);
          y += lines.length * 14;
        });
      }

      doc.save("safe-bite-meal-plan.pdf");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
        <h3 className="text-xl font-semibold">7-Day meal planner</h3>
        {plan && (
          <div className="flex items-center gap-2">
            <SaveButton kind="meal_plan" title="7-day meal plan" payload={{ condition, ...plan }} />
            <Button onClick={exportPdf} disabled={exporting} variant="outline" size="sm">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="ml-2">PDF</span>
            </Button>
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        A balanced 7-day meal plan with a shopping list, tailored to <strong>{condition}</strong>.
      </p>
      {!plan && !loading && (
        <Button onClick={generate} variant="hero">
          Generate meal plan
        </Button>
      )}
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Building your week…
        </div>
      )}
      {error && <p className="text-destructive text-sm">{error}</p>}
      {plan && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            {plan.days.map((d) => (
              <div key={d.day} className="rounded-lg border border-border bg-background/60 p-4">
                <p className="font-semibold text-foreground mb-2">{d.day}</p>
                <dl className="space-y-1 text-sm">
                  {[
                    ["Breakfast", d.breakfast],
                    ["Lunch", d.lunch],
                    ["Dinner", d.dinner],
                    ["Snack", d.snack],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <dt className="text-muted-foreground w-20 shrink-0">{k}</dt>
                      <dd className="text-foreground">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          {plan.shoppingList.length > 0 && (
            <div className="rounded-lg border border-border bg-background/60 p-4">
              <p className="font-semibold text-foreground mb-2">Shopping list</p>
              <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-foreground list-disc pl-5">
                {plan.shoppingList.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
