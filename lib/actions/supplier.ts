"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadSupplierLicenseDocument } from "@/lib/supabase/storage";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function submitSupplierProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Not authenticated" };
  }

  const licenseDoc = formData.get("sfdaLicenseDoc") as File;
  if (!licenseDoc || licenseDoc.size === 0) {
    return { ok: false as const, error: "SFDA license document is required" };
  }

  const sfdaLicenseDocUrl = await uploadSupplierLicenseDocument(
    user.id,
    licenseDoc,
  );

  await prisma.supplier.create({
    data: {
      authUserId: user.id,
      name: String(formData.get("name")),
      sfdaLicenseNumber: String(formData.get("sfdaLicenseNumber")),
      sfdaLicenseDocUrl,
      // Login is phone+OTP only today — email as a login identifier is a
      // documented v4 target (see docs/tech-stack.md) not yet built.
      loginIdentifierType: "mobile",
      mobile: user.phone ?? null,
      email: formData.get("contactEmail")
        ? String(formData.get("contactEmail"))
        : null,
      city: String(formData.get("city")),
      district: formData.get("district")
        ? String(formData.get("district"))
        : null,
    },
  });

  // Role must be set in app_metadata (service-role only), not
  // user_metadata — see lib/auth/session.ts for why.
  const adminClient = createAdminClient();
  const { error: roleError } = await adminClient.auth.admin.updateUserById(
    user.id,
    { app_metadata: { role: "supplier" } },
  );

  if (roleError) {
    return { ok: false as const, error: roleError.message };
  }

  return { ok: true as const };
}

export async function approveSupplier(supplierId: string, locale: string) {
  await requireAdmin(locale);
  await prisma.supplier.update({
    where: { id: supplierId },
    data: { verificationStatus: "verified" },
  });
  revalidatePath(`/${locale}/admin/suppliers`);
}

export async function rejectSupplier(supplierId: string, locale: string) {
  await requireAdmin(locale);
  await prisma.supplier.update({
    where: { id: supplierId },
    data: { verificationStatus: "rejected" },
  });
  revalidatePath(`/${locale}/admin/suppliers`);
}
