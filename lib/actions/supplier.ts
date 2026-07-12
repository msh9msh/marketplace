"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { TargetType } from "@/generated/prisma/client";

export async function createSupplierWithContract(
  formData: FormData,
  locale: string,
) {
  await requireAdmin(locale);

  const periodStart = new Date(String(formData.get("periodStart")));
  const periodEnd = new Date(String(formData.get("periodEnd")));

  await prisma.supplier.create({
    data: {
      name: String(formData.get("name")),
      sfdaLicenseNumber: String(formData.get("sfdaLicenseNumber")),
      slaHours: Number(formData.get("slaHours")) || 48,
      contract: {
        create: {
          payoutDays: Number(formData.get("payoutDays")),
          // Stored as a fraction (e.g. 0.08 for 8%), not a whole percentage.
          rebateRate: Number(formData.get("rebateRate")) / 100,
          targetType: String(formData.get("targetType")) as TargetType,
          targetValue: Number(formData.get("targetValue")),
          periodStart,
          periodEnd,
        },
      },
    },
  });

  revalidatePath(`/${locale}/admin/suppliers`);
}
