import { getTranslations } from "next-intl/server";
import { requireVerifiedSupplier } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { halalasToSar } from "@/lib/money";
import { Link } from "@/i18n/navigation";
import { CatalogItemForm } from "@/components/supplier/CatalogItemForm";

export default async function SupplierCatalogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supplier = await requireVerifiedSupplier(locale);
  const t = await getTranslations("SupplierCatalog");
  const tForm = await getTranslations("SupplierCatalogForm");

  const items = await prisma.catalogItem.findMany({
    where: { supplierId: supplier.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-xl font-semibold">{t("title")}</h1>

      <h2 className="mb-4 text-lg font-medium">{t("addTitle")}</h2>
      <div className="mb-10 rounded border p-6">
        <CatalogItemForm locale={locale} />
      </div>

      {items.length === 0 ? (
        <p className="text-neutral-600">{t("empty")}</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b text-sm text-neutral-500">
              <th className="py-2 text-start">{t("nameCol")}</th>
              <th className="py-2 text-start">{t("typeCol")}</th>
              <th className="py-2 text-start">{t("skuCol")}</th>
              <th className="py-2 text-start">{t("priceCol")}</th>
              <th className="py-2 text-start">{t("discountCol")}</th>
              <th className="py-2 text-start">{t("effectivePriceCol")}</th>
              <th className="py-2 text-start">{t("stockCol")}</th>
              <th className="py-2 text-start">{t("featuredCol")}</th>
              <th className="py-2 text-start">{t("statusCol")}</th>
              <th className="py-2 text-start">{t("actionsCol")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const discount = item.discountPercentage?.toNumber() ?? null;
              const effectivePrice = discount
                ? Math.round(item.price * (1 - discount / 100))
                : item.price;

              return (
                <tr key={item.id} className="border-b">
                  <td className="py-2">{item.productName}</td>
                  <td className="py-2">{item.productType}</td>
                  <td className="py-2">{item.sku ?? "-"}</td>
                  <td className="py-2">{halalasToSar(item.price)}</td>
                  <td className="py-2">{discount ? `${discount}%` : "-"}</td>
                  <td className="py-2">{halalasToSar(effectivePrice)}</td>
                  <td className="py-2">{item.quantityAvailable}</td>
                  <td className="py-2">
                    {item.isFeatured ? t("featuredYes") : "-"}
                  </td>
                  <td className="py-2">
                    {item.status === "active"
                      ? tForm("statusActive")
                      : tForm("statusInactive")}
                  </td>
                  <td className="py-2">
                    <Link
                      href={`/supplier/catalog/${item.id}`}
                      className="underline"
                    >
                      {t("edit")}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
