"use server";

import { revalidatePath } from "next/cache";
import { requireVerifiedSupplier } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { sarToHalalas } from "@/lib/money";

function parseDiscount(
  value: FormDataEntryValue | null,
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (!value) return { ok: true, value: null };
  const discount = Number(value);
  if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
    return { ok: false, error: "Discount must be between 0 and 100" };
  }
  return { ok: true, value: discount };
}

export async function createCatalogItem(formData: FormData, locale: string) {
  const supplier = await requireVerifiedSupplier(locale);

  const price = sarToHalalas(formData.get("price"));
  if (price === null) {
    return { ok: false as const, error: "Price must be a positive number" };
  }

  const quantityAvailable = Number(formData.get("quantityAvailable"));
  if (!Number.isInteger(quantityAvailable) || quantityAvailable < 0) {
    return {
      ok: false as const,
      error: "Quantity must be a non-negative whole number",
    };
  }

  const discount = parseDiscount(formData.get("discountPercentage"));
  if (!discount.ok) {
    return { ok: false as const, error: discount.error };
  }

  await prisma.catalogItem.create({
    data: {
      supplierId: supplier.id,
      productName: String(formData.get("productName")),
      productType: String(formData.get("productType")),
      sku: formData.get("sku") ? String(formData.get("sku")) : null,
      price,
      discountPercentage: discount.value,
      quantityAvailable,
      isFeatured: formData.get("isFeatured") === "on",
    },
  });

  revalidatePath(`/${locale}/supplier/catalog`);
  return { ok: true as const };
}

export async function updateCatalogItem(
  itemId: string,
  formData: FormData,
  locale: string,
) {
  const supplier = await requireVerifiedSupplier(locale);

  const existing = await prisma.catalogItem.findUnique({
    where: { id: itemId },
  });
  if (!existing || existing.supplierId !== supplier.id) {
    return { ok: false as const, error: "Not found" };
  }

  const price = sarToHalalas(formData.get("price"));
  if (price === null) {
    return { ok: false as const, error: "Price must be a positive number" };
  }

  const quantityAvailable = Number(formData.get("quantityAvailable"));
  if (!Number.isInteger(quantityAvailable) || quantityAvailable < 0) {
    return {
      ok: false as const,
      error: "Quantity must be a non-negative whole number",
    };
  }

  const discount = parseDiscount(formData.get("discountPercentage"));
  if (!discount.ok) {
    return { ok: false as const, error: discount.error };
  }

  await prisma.catalogItem.update({
    where: { id: itemId },
    data: {
      productName: String(formData.get("productName")),
      productType: String(formData.get("productType")),
      sku: formData.get("sku") ? String(formData.get("sku")) : null,
      price,
      discountPercentage: discount.value,
      quantityAvailable,
      isFeatured: formData.get("isFeatured") === "on",
      status: formData.get("status") === "inactive" ? "inactive" : "active",
    },
  });

  revalidatePath(`/${locale}/supplier/catalog`);
  return { ok: true as const };
}
