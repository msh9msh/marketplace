import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireVerifiedSupplier } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { CatalogItemForm } from "@/components/supplier/CatalogItemForm";

export default async function EditCatalogItemPage({
  params,
}: {
  params: Promise<{ locale: string; itemId: string }>;
}) {
  const { locale, itemId } = await params;
  const supplier = await requireVerifiedSupplier(locale);
  const t = await getTranslations("SupplierCatalog");

  const item = await prisma.catalogItem.findUnique({ where: { id: itemId } });
  if (!item || item.supplierId !== supplier.id) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link href="/supplier/catalog" className="mb-6 inline-block underline">
        {t("back")}
      </Link>
      <h1 className="mb-6 text-xl font-semibold">{t("editTitle")}</h1>
      <CatalogItemForm
        locale={locale}
        item={{
          id: item.id,
          productName: item.productName,
          productType: item.productType,
          sku: item.sku,
          price: item.price,
          discountPercentage: item.discountPercentage?.toNumber() ?? null,
          quantityAvailable: item.quantityAvailable,
          isFeatured: item.isFeatured,
          status: item.status,
        }}
      />
    </main>
  );
}
