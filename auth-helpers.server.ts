import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "./client.server";

const ITER = 100_000;
const KEYLEN = 32;
const DIGEST = "sha256";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = pbkdf2Sync(password, salt, ITER, KEYLEN, DIGEST).toString("hex");
  return `pbkdf2$${ITER}$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, iterStr, salt, derived] = stored.split("$");
    if (scheme !== "pbkdf2") return false;
    const iter = parseInt(iterStr, 10);
    const test = pbkdf2Sync(password, salt, iter, KEYLEN, DIGEST).toString("hex");
    const a = Buffer.from(test, "hex");
    const b = Buffer.from(derived, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function newToken(): string {
  return randomBytes(32).toString("hex");
}

export async function accountIdFromToken(token: string | null | undefined): Promise<string | null> {
  if (!token) return null;
  const { data } = await supabaseAdmin
    .from("app_account_sessions")
    .select("account_id, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (!data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;
  return data.account_id as string;
}

export async function userIdFromToken(
  token: string | null | undefined,
  accountToken?: string | null | undefined,
): Promise<string | null> {
  if (!token) return null;
  const { data } = await supabaseAdmin
    .from("app_sessions")
    .select("user_id, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (!data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;
  if (accountToken) {
    const accountId = await accountIdFromToken(accountToken);
    if (!accountId) return null;
    const { data: user } = await supabaseAdmin
      .from("app_users")
      .select("owner_id")
      .eq("id", data.user_id)
      .maybeSingle();
    if (!user || user.owner_id !== accountId) return null;
  }
  return data.user_id as string;
}
