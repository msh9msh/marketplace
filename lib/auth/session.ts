import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "pharmacy" | "supplier" | "admin";

// Admins are provisioned directly in Supabase (user_metadata.role = "admin")
// per CLAUDE.md — no admin self-signup in v1.
export async function getUserRole(): Promise<UserRole> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role;
  if (role === "admin") return "admin";
  if (role === "supplier") return "supplier";
  return "pharmacy";
}

export async function requireUser(locale: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    throw new Error("unreachable");
  }

  return user;
}

export async function requireAdmin(locale: string) {
  const user = await requireUser(locale);
  if (user.user_metadata?.role !== "admin") {
    redirect({ href: "/", locale });
  }

  return user;
}

export async function requireSupplier(locale: string) {
  const user = await requireUser(locale);
  if (user.user_metadata?.role !== "supplier") {
    redirect({ href: "/", locale });
  }

  return user;
}
