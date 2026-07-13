import { createClient } from "@/lib/supabase/server";

// Buckets must exist in the Supabase project (created once via
// dashboard/CLI, not something Prisma migrations manage) — see
// docs/roadmap.md Phase 0.
const PHARMACY_LICENSE_BUCKET = "pharmacy-licenses";
const SUPPLIER_LICENSE_BUCKET = "supplier-licenses";
const SUPPLIER_CATALOG_UPLOAD_BUCKET = "supplier-catalogs";

async function uploadToBucket(bucket: string, authId: string, file: File) {
  const supabase = await createClient();
  const path = `${authId}/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type });

  if (error) {
    throw new Error(`Upload to ${bucket} failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}

export function uploadLicenseDocument(pharmacyAuthId: string, file: File) {
  return uploadToBucket(PHARMACY_LICENSE_BUCKET, pharmacyAuthId, file);
}

export function uploadSupplierLicenseDocument(
  supplierAuthId: string,
  file: File,
) {
  return uploadToBucket(SUPPLIER_LICENSE_BUCKET, supplierAuthId, file);
}

export function uploadSupplierCatalogFile(supplierId: string, file: File) {
  return uploadToBucket(SUPPLIER_CATALOG_UPLOAD_BUCKET, supplierId, file);
}
