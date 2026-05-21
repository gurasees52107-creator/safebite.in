import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

async function callAI(messages: any[]) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI error ${res.status}: ${t}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

const safetyNote =
  "Always include a short reminder that this is general guidance, not medical advice, and to consult a healthcare professional.";

const langInstr = (lang?: string) =>
  lang && lang !== "en"
    ? ` IMPORTANT: Reply entirely in language code "${lang}". Translate all section headings and content to that language. Keep JSON keys in English when JSON is requested.`
    : "";

const langSchema = z.string().min(2).max(10).optional();

function extractJson(content: string): any | null {
  try {
    const m = content.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  } catch {}
  return null;
}

export const getGuide = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ condition: z.string().min(1).max(200), language: langSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    const content = await callAI([
      {
        role: "system",
        content:
          "You are a careful nutrition assistant. Output clean Markdown with two sections: '## Foods you can eat' and '## Foods to avoid'. Use concise bullet lists. " +
          safetyNote +
          langInstr(data.language),
      },
      {
        role: "user",
        content: `Condition / dietary issue: ${data.condition}. Provide a clear, practical food guide.`,
      },
    ]);
    return { content };
  });

export const checkFood = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        condition: z.string().min(1).max(500),
        food: z.string().min(1).max(200),
        language: langSchema,
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const content = await callAI([
      {
        role: "system",
        content:
          "You are a nutrition assistant. Reply ONLY in JSON with keys: " +
          "verdict ('safe' | 'caution' | 'avoid'), " +
          "reason (1-2 sentences), " +
          "problemIngredients (array of {name, issue} — only ingredients in the food that conflict with the condition; empty array if none), " +
          "nutrition ({calories: string with units, protein: string, carbs: string, fat: string, glycemicIndex: string|null} — best estimates per typical serving). " +
          "Keep JSON keys and verdict values in English." +
          langInstr(data.language),
      },
      {
        role: "user",
        content: `Condition / dietary restriction: ${data.condition}. Food: ${data.food}. Can the person eat this?`,
      },
    ]);
    const parsed = extractJson(content);
    return {
      verdict: parsed?.verdict ?? "caution",
      reason: parsed?.reason ?? content,
      problemIngredients: Array.isArray(parsed?.problemIngredients) ? parsed.problemIngredients : [],
      nutrition: parsed?.nutrition ?? null,
    } as {
      verdict: string;
      reason: string;
      problemIngredients: { name: string; issue: string }[];
      nutrition: { calories: string; protein: string; carbs: string; fat: string; glycemicIndex: string | null } | null;
    };
  });

export const checkFoodImage = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        condition: z.string().min(1).max(500),
        imageDataUrl: z.string().min(20),
        language: langSchema,
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const content = await callAI([
      {
        role: "system",
        content:
          "You are a nutrition assistant. Identify the food in the image, then reply ONLY in JSON with keys: food (string, identified item), verdict ('safe' | 'caution' | 'avoid'), reason (1-3 sentences). Keep keys and verdict values in English." +
          langInstr(data.language),
      },
      {
        role: "user",
        content: [
          { type: "text", text: `Condition: ${data.condition}. Identify the food and tell me if I can eat it.` },
          { type: "image_url", image_url: { url: data.imageDataUrl } },
        ],
      },
    ]);
    const parsed = extractJson(content);
    return {
      food: parsed?.food ?? "Unknown",
      verdict: parsed?.verdict ?? "caution",
      reason: parsed?.reason ?? content,
    };
  });

export const getRecipe = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        condition: z.string().min(1).max(500),
        dish: z.string().min(1).max(200),
        language: langSchema,
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const content = await callAI([
      {
        role: "system",
        content:
          "You are a careful nutrition-aware chef. Adapt the requested dish so it is safe for the user's condition. Output clean Markdown with sections: '## Dish' (final adapted name), '## Ingredients' (bulleted, with quantities), '## Steps' (numbered), '## Notes' (substitutions made and why). " +
          safetyNote +
          langInstr(data.language),
      },
      {
        role: "user",
        content: `Condition / dietary restriction: ${data.condition}. Dish requested: ${data.dish}. Give a recipe safe for this condition, swapping unsafe ingredients with clearly noted substitutions.`,
      },
    ]);
    return { content };
  });

export const scanMenu = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        condition: z.string().min(1).max(500),
        imageDataUrl: z.string().min(20),
        language: langSchema,
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const content = await callAI([
      {
        role: "system",
        content:
          "You are a nutrition assistant analyzing a restaurant menu photo. Read every visible dish on the menu, then reply ONLY in JSON: " +
          "{ items: [ { name, verdict: 'safe'|'caution'|'avoid', reason } ] }. " +
          "Order items by verdict (safe first, then caution, then avoid). Keep JSON keys and verdict values in English." +
          langInstr(data.language),
      },
      {
        role: "user",
        content: [
          { type: "text", text: `Condition / dietary restriction: ${data.condition}. Highlight which menu items are safe, caution, or avoid.` },
          { type: "image_url", image_url: { url: data.imageDataUrl } },
        ],
      },
    ]);
    const parsed = extractJson(content);
    return {
      items: Array.isArray(parsed?.items) ? parsed.items : [],
    } as { items: { name: string; verdict: string; reason: string }[] };
  });

export const getMealPlan = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        condition: z.string().min(1).max(500),
        language: langSchema,
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const content = await callAI([
      {
        role: "system",
        content:
          "You are a nutrition-aware meal planner. Build a 7-day meal plan safe for the user's condition. Reply ONLY in JSON: " +
          "{ days: [ { day: 'Monday', breakfast: string, lunch: string, dinner: string, snack: string } ... 7 entries ], shoppingList: [ string ... ] }. " +
          "Keep JSON keys in English. Make the meals realistic, varied, and clearly compatible with the condition." +
          langInstr(data.language),
      },
      {
        role: "user",
        content: `Condition / dietary restriction: ${data.condition}. Build a complete 7-day meal plan with breakfast, lunch, dinner, one snack, and a consolidated shopping list.`,
      },
    ]);
    const parsed = extractJson(content);
    return {
      days: Array.isArray(parsed?.days) ? parsed.days : [],
      shoppingList: Array.isArray(parsed?.shoppingList) ? parsed.shoppingList : [],
    } as {
      days: { day: string; breakfast: string; lunch: string; dinner: string; snack: string }[];
      shoppingList: string[];
    };
  });
