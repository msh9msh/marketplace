"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { uploadLicenseDocument } from "@/lib/supabase/storage";
import { prisma } from "@/lib/prisma";

export async function submitPharmacyProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Not authenticated" };
  }

  const licenseDoc = formData.get("licenseDoc") as File;
  if (!licenseDoc || licenseDoc.size === 0) {
    return { ok: false as const, error: "License document is required" };
  }

  const licenseDocUrl = await uploadLicenseDocument(user.id, licenseDoc);

  await prisma.pharmacy.create({
    data: {
      authUserId: user.id,
      name: String(formData.get("name")),
      licenseNumber: String(formData.get("licenseNumber")),
      licenseDocUrl,
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
      address: String(formData.get("address")),
    },
  });

  return { ok: true as const };
}

export async function approvePharmacy(pharmacyId: string, locale: string) {
  await requireAdmin(locale);
  await prisma.pharmacy.update({
    where: { id: pharmacyId },
    data: { verificationStatus: "verified" },
  });
  revalidatePath(`/${locale}/admin/pharmacies`);
}

export async function rejectPharmacy(pharmacyId: string, locale: string) {
  await requireAdmin(locale);
  await prisma.pharmacy.update({
    where: { id: pharmacyId },
    data: { verificationStatus: "rejected" },
  });
  revalidatePath(`/${locale}/admin/pharmacies`);
}
