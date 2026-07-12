"use server";

import { createClient } from "@/lib/supabase/server";

export async function requestOtp(phone: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}

export async function verifyOtp(phone: string, token: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}
