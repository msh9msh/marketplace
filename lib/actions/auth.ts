"use server";

import { createClient } from "@/lib/supabase/server";

// TODO(email login): docs/data-model.md's login_identifier_type supports
// "mobile" or "email" for both Pharmacy and Supplier, but only phone+OTP
// is implemented here. Email OTP/magic-link is a deliberate, tracked gap
// for this pass — not an oversight — per explicit scope decision when
// building the supplier sign-up screen.
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
