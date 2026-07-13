"use server";

import { revalidatePath } from "next/cache";
import { requireVerifiedSupplier } from "@/lib/auth/session";
import { uploadSupplierCatalogFile } from "@/lib/supabase/storage";
import { parseCatalogWorkbook } from "@/lib/catalog/parseCatalogWorkbook";
import { validateCatalogRow } from "@/lib/catalog/validateCatalogRow";
import { applyCatalogRow } from "@/lib/catalog/applyCatalogRow";
import { prisma } from "@/lib/prisma";

export async function uploadCatalogFile(formData: FormData, locale: string) {
  const supplier = await requireVerifiedSupplier(locale);

  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    return { ok: false as const, error: "A file is required" };
  }

  const fileUrl = await uploadSupplierCatalogFile(supplier.id, file);
  const buffer = Buffer.from(await file.arrayBuffer());

  let rawRows;
  try {
    rawRows = await parseCatalogWorkbook(buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not read file";
    await prisma.inventoryUpload.create({
      data: {
        supplierId: supplier.id,
        fileUrl,
        status: "failed",
        rowCount: 0,
        successCount: 0,
        errorCount: 0,
        errorDetails: [{ row: 0, error: message }],
      },
    });
    revalidatePath(`/${locale}/supplier/catalog/upload`);
    return { ok: false as const, error: message };
  }

  const errors: { row: number; error: string }[] = [];
  let successCount = 0;

  for (const raw of rawRows) {
    const validated = validateCatalogRow(raw);
    if (!validated.ok) {
      errors.push({ row: raw.rowNumber, error: validated.error });
      continue;
    }
    await applyCatalogRow(supplier.id, validated.value);
    successCount++;
  }

  await prisma.inventoryUpload.create({
    data: {
      supplierId: supplier.id,
      fileUrl,
      status: errors.length === 0 ? "completed" : "completed_with_errors",
      rowCount: rawRows.length,
      successCount,
      errorCount: errors.length,
      errorDetails: errors.length > 0 ? errors : undefined,
    },
  });

  revalidatePath(`/${locale}/supplier/catalog/upload`);
  revalidatePath(`/${locale}/supplier/catalog`);

  return { ok: true as const, successCount, errorCount: errors.length };
}
