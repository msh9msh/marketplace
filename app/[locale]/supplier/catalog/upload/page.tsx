import { getTranslations } from "next-intl/server";
import { requireVerifiedSupplier } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { CatalogUploadForm } from "@/components/supplier/CatalogUploadForm";

interface RowError {
  row: number;
  error: string;
}

function isRowErrorArray(value: unknown): value is RowError[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        "row" in entry &&
        "error" in entry,
    )
  );
}

export default async function SupplierCatalogUploadPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supplier = await requireVerifiedSupplier(locale);
  const t = await getTranslations("SupplierCatalogUpload");

  const uploads = await prisma.inventoryUpload.findMany({
    where: { supplierId: supplier.id },
    orderBy: { uploadedAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link href="/supplier/catalog" className="mb-6 inline-block underline">
        {t("back")}
      </Link>
      <h1 className="mb-2 text-xl font-semibold">{t("title")}</h1>
      <p className="mb-6 text-sm text-neutral-600">{t("columnsHint")}</p>

      <div className="mb-10 rounded border p-6">
        <CatalogUploadForm locale={locale} />
      </div>

      <h2 className="mb-4 text-lg font-medium">{t("historyTitle")}</h2>
      {uploads.length === 0 ? (
        <p className="text-neutral-600">{t("historyEmpty")}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {uploads.map((upload) => {
            const rowErrors = isRowErrorArray(upload.errorDetails)
              ? upload.errorDetails
              : [];

            return (
              <li key={upload.id} className="rounded border p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {upload.uploadedAt.toISOString()}
                  </span>
                  <span>{t(`status_${upload.status}`)}</span>
                  <span className="text-neutral-600">
                    {t("countsSummary", {
                      total: upload.rowCount,
                      success: upload.successCount,
                      errors: upload.errorCount,
                    })}
                  </span>
                </div>
                {rowErrors.length > 0 && (
                  <ul className="mt-2 list-disc ps-5 text-neutral-600">
                    {rowErrors.map((rowError, index) => (
                      <li key={index}>
                        {t("rowError", {
                          row: rowError.row,
                          error: rowError.error,
                        })}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
