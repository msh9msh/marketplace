"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { uploadCatalogFile } from "@/lib/actions/catalog-upload";

export function CatalogUploadForm({ locale }: { locale: string }) {
  const t = useTranslations("SupplierCatalogUpload");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    successCount: number;
    errorCount: number;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [formKey, setFormKey] = useState(0);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setSummary(null);
    const result = await uploadCatalogFile(formData, locale);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSummary({
      successCount: result.successCount,
      errorCount: result.errorCount,
    });
    setFormKey((key) => key + 1);
    router.refresh();
  }

  return (
    <form key={formKey} action={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm text-neutral-600">
        {t("fileLabel")}
        <input
          type="file"
          name="file"
          required
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {t("submit")}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {summary && (
        <p className="text-sm text-neutral-600">
          {t("summary", {
            success: summary.successCount,
            errors: summary.errorCount,
          })}
        </p>
      )}
    </form>
  );
}
