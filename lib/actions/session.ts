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

  const role = user.user_metadata?.role;

  if (role === "admin") {
    return "/admin/pharmacies";
  }

  if (role === "supplier") {
    // No supplier catalog/dashboard screens yet — see docs/roadmap.md.
    return "/";
  }

  const pharmacy = await prisma.pharmacy.findUnique({
    where: { authUserId: user.id },
  });

  if (!pharmacy) {
    return "/sign-up";
  }

  return pharmacy.verificationStatus === "verified" ? "/" : "/pending";
}
