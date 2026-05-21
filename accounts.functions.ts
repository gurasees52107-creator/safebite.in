import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  accountIdFromToken,
  hashPassword,
  verifyPassword,
  newToken,
  userIdFromToken,
} from "@/integrations/supabase/auth-helpers.server";

const usernameSchema = z
  .string()
  .trim()
  .min(2, "Username must be at least 2 characters")
  .max(24, "Username must be at most 24 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscore only");

const passwordSchema = z.string().min(4).max(100);
const avatarSchema = z.string().min(1).max(40);
const conditionsSchema = z.array(z.string().min(1).max(200)).max(20);

const accountTokenSchema = z.string().min(1);

async function requireAccountId(accountToken: string) {
  const accountId = await accountIdFromToken(accountToken);
  if (!accountId) throw new Error("Sign in to your account first.");
  return accountId;
}

export const createAccount = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        username: usernameSchema,
        password: passwordSchema,
        avatar: avatarSchema.optional(),
        conditions: conditionsSchema.optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const username = data.username;
    const duplicateAccount = await supabaseAdmin
      .from("app_accounts")
      .select("id")
      .ilike("username", username)
      .maybeSingle();
    if (duplicateAccount.data) throw new Error("That account name is already taken.");

    const passwordHash = hashPassword(data.password);
    const { data: account, error: accountError } = await supabaseAdmin
      .from("app_accounts")
      .insert({ username, password_hash: passwordHash })
      .select("id, username")
      .single();
    if (accountError || !account) throw new Error(accountError?.message ?? "Could not create account");

    const { data: user, error: userError } = await supabaseAdmin
      .from("app_users")
      .insert({
        owner_id: account.id,
        username,
        password_hash: passwordHash,
        avatar: data.avatar ?? "leaf",
        conditions: data.conditions ?? [],
      })
      .select("id, username, avatar, conditions")
      .single();
    if (userError || !user) throw new Error(userError?.message ?? "Could not create profile");

    const accountToken = newToken();
    const token = newToken();
    await supabaseAdmin.from("app_account_sessions").insert({ account_id: account.id, token: accountToken });
    await supabaseAdmin.from("app_sessions").insert({ user_id: user.id, token });
    return { accountToken, account, token, user };
  });

export const loginAccount = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ username: z.string().min(1), password: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { data: account } = await supabaseAdmin
      .from("app_accounts")
      .select("id, username, password_hash")
      .ilike("username", data.username)
      .maybeSingle();
    if (!account || !verifyPassword(data.password, account.password_hash)) {
      throw new Error("Invalid username or password.");
    }
    const accountToken = newToken();
    await supabaseAdmin.from("app_account_sessions").insert({ account_id: account.id, token: accountToken });
    return { accountToken, account: { id: account.id, username: account.username } };
  });

export const getAccount = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ accountToken: accountTokenSchema }).parse(d))
  .handler(async ({ data }) => {
    const accountId = await accountIdFromToken(data.accountToken);
    if (!accountId) return null;
    const { data: account } = await supabaseAdmin
      .from("app_accounts")
      .select("id, username")
      .eq("id", accountId)
      .maybeSingle();
    return account ?? null;
  });

export const logoutAccount = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ accountToken: accountTokenSchema }).parse(d))
  .handler(async ({ data }) => {
    await supabaseAdmin.from("app_account_sessions").delete().eq("token", data.accountToken);
    return { ok: true };
  });

export const listProfiles = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ accountToken: accountTokenSchema }).parse(d))
  .handler(async ({ data }) => {
    const accountId = await accountIdFromToken(data.accountToken);
    if (!accountId) return [];
    const { data: rows, error } = await supabaseAdmin
      .from("app_users")
      .select("id, username, avatar")
      .eq("owner_id", accountId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createProfile = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        accountToken: accountTokenSchema,
        username: usernameSchema,
        password: passwordSchema,
        avatar: avatarSchema.optional(),
        conditions: conditionsSchema.optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const accountId = await requireAccountId(data.accountToken);
    const username = data.username;
    const existing = await supabaseAdmin
      .from("app_users")
      .select("id")
      .eq("owner_id", accountId)
      .ilike("username", username)
      .maybeSingle();
    if (existing.data) throw new Error("That profile name is already taken in your account.");

    const { data: user, error } = await supabaseAdmin
      .from("app_users")
      .insert({
        owner_id: accountId,
        username,
        password_hash: hashPassword(data.password),
        avatar: data.avatar ?? "leaf",
        conditions: data.conditions ?? [],
      })
      .select("id, username, avatar, conditions")
      .single();
    if (error || !user) throw new Error(error?.message ?? "Could not create profile");

    const token = newToken();
    await supabaseAdmin.from("app_sessions").insert({ user_id: user.id, token });
    return { token, user };
  });

export const loginProfile = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ accountToken: accountTokenSchema, username: z.string().min(1), password: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    const accountId = await requireAccountId(data.accountToken);
    const { data: user } = await supabaseAdmin
      .from("app_users")
      .select("id, username, avatar, conditions, password_hash")
      .eq("owner_id", accountId)
      .ilike("username", data.username)
      .maybeSingle();
    if (!user || !verifyPassword(data.password, user.password_hash)) {
      throw new Error("Invalid username or password.");
    }
    const token = newToken();
    await supabaseAdmin.from("app_sessions").insert({ user_id: user.id, token });
    return {
      token,
      user: { id: user.id, username: user.username, avatar: user.avatar, conditions: user.conditions },
    };
  });

export const getMe = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string(), accountToken: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    const uid = await userIdFromToken(data.token, data.accountToken);
    if (!uid) return null;
    const { data: user } = await supabaseAdmin
      .from("app_users")
      .select("id, username, avatar, conditions")
      .eq("id", uid)
      .maybeSingle();
    return user ?? null;
  });

export const logoutProfile = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await supabaseAdmin.from("app_sessions").delete().eq("token", data.token);
    return { ok: true };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        token: z.string(),
        accountToken: z.string().optional(),
        avatar: avatarSchema.optional(),
        conditions: conditionsSchema.optional(),
        newPassword: passwordSchema.optional(),
        newUsername: usernameSchema.optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const uid = await userIdFromToken(data.token, data.accountToken);
    if (!uid) throw new Error("Not signed in.");

    const { data: currentUser } = await supabaseAdmin
      .from("app_users")
      .select("owner_id")
      .eq("id", uid)
      .single();
    if (!currentUser) throw new Error("Profile not found.");

    const update: {
      avatar?: string;
      conditions?: string[];
      password_hash?: string;
      username?: string;
    } = {};
    if (data.avatar) update.avatar = data.avatar;
    if (data.conditions) update.conditions = data.conditions;
    if (data.newPassword) update.password_hash = hashPassword(data.newPassword);
    if (data.newUsername) {
      const dup = await supabaseAdmin
        .from("app_users")
        .select("id")
        .eq("owner_id", currentUser.owner_id)
        .ilike("username", data.newUsername)
        .neq("id", uid)
        .maybeSingle();
      if (dup.data) throw new Error("That profile name is already taken in your account.");
      update.username = data.newUsername;
    }
    if (Object.keys(update).length === 0) return { ok: true };

    const { data: user, error } = await supabaseAdmin
      .from("app_users")
      .update(update)
      .eq("id", uid)
      .select("id, username, avatar, conditions")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, user };
  });

export const deleteProfile = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string(), accountToken: z.string().optional(), password: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const uid = await userIdFromToken(data.token, data.accountToken);
    if (!uid) throw new Error("Not signed in.");
    const { data: user } = await supabaseAdmin
      .from("app_users")
      .select("password_hash")
      .eq("id", uid)
      .single();
    if (!user || !verifyPassword(data.password, user.password_hash)) {
      throw new Error("Incorrect password.");
    }
    await supabaseAdmin.from("app_users").delete().eq("id", uid);
    return { ok: true };
  });
