import type { RawCatalogRow } from "@/lib/catalog/parseCatalogWorkbook";

export interface ValidatedCatalogRow {
  rowNumber: number;
  productName: string;
  productType: string;
  sku: string | null;
  priceHalalas: number;
  discountPercentage: number | null;
  quantityAvailable: number;
  isFeatured: boolean;
}

type ValidationResult =
  | { ok: true; value: ValidatedCatalogRow }
  | { ok: false; error: string };

export function validateCatalogRow(raw: RawCatalogRow): ValidationResult {
  if (!raw.product_name) {
    return { ok: false, error: "product_name is required" };
  }
  if (!raw.product_type) {
    return { ok: false, error: "product_type is required" };
  }

  const priceSar = Number(raw.price);
  if (!raw.price || !Number.isFinite(priceSar) || priceSar <= 0) {
    return { ok: false, error: "price must be a positive number" };
  }

  const quantityAvailable = Number(raw.quantity_available);
  if (
    !raw.quantity_available ||
    !Number.isInteger(quantityAvailable) ||
    quantityAvailable < 0
  ) {
    return {
      ok: false,
      error: "quantity_available must be a non-negative whole number",
    };
  }

  let discountPercentage: number | null = null;
  if (raw.discount_percentage) {
    const discount = Number(raw.discount_percentage);
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      return {
        ok: false,
        error: "discount_percentage must be between 0 and 100",
      };
    }
    discountPercentage = discount;
  }

  const isFeatured = raw.is_featured
    ? ["true", "1", "yes"].includes(raw.is_featured.toLowerCase())
    : false;

  return {
    ok: true,
    value: {
      rowNumber: raw.rowNumber,
      productName: raw.product_name,
      productType: raw.product_type,
      sku: raw.sku ?? null,
      priceHalalas: Math.round(priceSar * 100),
      discountPercentage,
      quantityAvailable,
      isFeatured,
    },
  };
}
