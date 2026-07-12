"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getPostLoginDestination() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return "/login";
  }

  const role = user.app_metadata?.role;

  if (role === "admin") {
    return "/admin/pharmacies";
  }

  if (role === "supplier") {
    const supplier = await prisma.supplier.findUnique({
      where: { authUserId: user.id },
    });

    if (!supplier) {
      return "/supplier-sign-up";
    }

    // No supplier catalog/dashboard screen yet — see docs/roadmap.md.
    return supplier.verificationStatus === "verified" ? "/" : "/pending";
  }

  const pharmacy = await prisma.pharmacy.findUnique({
    where: { authUserId: user.id },
  });

  if (!pharmacy) {
    return "/sign-up";
  }

  return pharmacy.verificationStatus === "verified" ? "/" : "/pending";
}
