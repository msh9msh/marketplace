import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS, never expose to the browser. Used
// only for operations a normal user client can't do, like writing
// app_metadata (role assignment must not be user-writable, unlike
// user_metadata).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
