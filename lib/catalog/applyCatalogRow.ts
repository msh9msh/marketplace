import { prisma } from "@/lib/prisma";
import type { ValidatedCatalogRow } from "@/lib/catalog/validateCatalogRow";

// SKU match first (if the row has one), else fall back to a
// case-insensitive product_name match within this supplier's own catalog,
// else create new. See docs/business-rules.md "Weekly Excel sync".
export async function applyCatalogRow(
  supplierId: string,
  row: ValidatedCatalogRow,
): Promise<"created" | "updated"> {
  let existing = row.sku
    ? await prisma.catalogItem.findFirst({
        where: { supplierId, sku: row.sku },
      })
    : null;

  if (!existing) {
    existing = await prisma.catalogItem.findFirst({
      where: {
        supplierId,
        productName: { equals: row.productName, mode: "insensitive" },
      },
    });
  }

  const data = {
    productName: row.productName,
    productType: row.productType,
    sku: row.sku,
    price: row.priceHalalas,
    discountPercentage: row.discountPercentage,
    quantityAvailable: row.quantityAvailable,
    isFeatured: row.isFeatured,
  };

  if (existing) {
    await prisma.catalogItem.update({ where: { id: existing.id }, data });
    return "updated";
  }

  await prisma.catalogItem.create({ data: { supplierId, ...data } });
  return "created";
}
