import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { userIdFromToken } from "@/integrations/supabase/auth-helpers.server";

const kindSchema = z.enum(["food_check", "recipe", "menu_scan", "meal_plan", "guide"]);

export const saveItem = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        token: z.string(),
        accountToken: z.string().optional(),
        kind: kindSchema,
        title: z.string().min(1).max(200),
        payload: z.any(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const uid = await userIdFromToken(data.token, data.accountToken);
    if (!uid) throw new Error("Sign in to save items.");
    const { error } = await supabaseAdmin.from("saved_items").insert({
      user_id: uid,
      kind: data.kind,
      title: data.title,
      payload: data.payload,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSaved = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string(), accountToken: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    const uid = await userIdFromToken(data.token, data.accountToken);
    if (!uid) return [];
    const { data: rows, error } = await supabaseAdmin
      .from("saved_items")
      .select("id, kind, title, payload, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const deleteSaved = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string(), accountToken: z.string().optional(), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const uid = await userIdFromToken(data.token, data.accountToken);
    if (!uid) throw new Error("Not signed in.");
    await supabaseAdmin.from("saved_items").delete().eq("user_id", uid).eq("id", data.id);
    return { ok: true };
  });
