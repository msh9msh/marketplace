import { createClient } from "@/lib/supabase/server";

// Bucket must exist in the Supabase project (created once via dashboard/CLI,
// not something Prisma migrations manage) — see docs/roadmap.md Phase 0.
const LICENSE_BUCKET = "pharmacy-licenses";

export async function uploadLicenseDocument(pharmacyAuthId: string, file: File) {
  const supabase = await createClient();
  const path = `${pharmacyAuthId}/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from(LICENSE_BUCKET)
    .upload(path, file, { contentType: file.type });

  if (error) {
    throw new Error(`License upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(LICENSE_BUCKET).getPublicUrl(path);

  return publicUrl;
}
