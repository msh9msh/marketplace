import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type UserRole = "pharmacy" | "supplier" | "admin";

// Role lives in app_metadata, not user_metadata — app_metadata is only
// writable server-side (service role), so a user can never grant
// themselves admin/supplier by calling updateUser() on their own session.
// Admins are provisioned directly in Supabase (dashboard's raw
// app_metadata editor, or the admin API) per CLAUDE.md — no admin
// self-signup in v1. Suppliers get app_metadata.role="supplier" set
// server-side at the end of a successful sign-up (see
// lib/actions/supplier.ts).
export async function getUserRole(): Promise<UserRole> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.app_metadata?.role;
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
  if (user.app_metadata?.role !== "admin") {
    redirect({ href: "/", locale });
  }

  return user;
}

export async function requireSupplier(locale: string) {
  const user = await requireUser(locale);
  if (user.app_metadata?.role !== "supplier") {
    redirect({ href: "/", locale });
  }

  return user;
}

// Catalog/upload/profile screens all sit behind "supplier, and verified" —
// factored here since screens.md items 4-6 all need this same gate.
export async function requireVerifiedSupplier(locale: string) {
  const user = await requireSupplier(locale);
  const supplier = await prisma.supplier.findUnique({
    where: { authUserId: user.id },
  });

  if (!supplier) {
    redirect({ href: "/supplier-sign-up", locale });
    throw new Error("unreachable");
  }

  if (supplier.verificationStatus !== "verified") {
    redirect({ href: "/pending", locale });
    throw new Error("unreachable");
  }

  return supplier;
}
