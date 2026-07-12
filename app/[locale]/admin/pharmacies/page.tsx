import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { approvePharmacy, rejectPharmacy } from "@/lib/actions/pharmacy";

export default async function AdminPharmaciesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);
  const t = await getTranslations("AdminPharmacies");

  const pharmacies = await prisma.pharmacy.findMany({
    where: { verificationStatus: "pending" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-xl font-semibold">{t("title")}</h1>
      {pharmacies.length === 0 ? (
        <p className="text-neutral-600">{t("empty")}</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b text-sm text-neutral-500">
              <th className="py-2 text-start">{t("nameCol")}</th>
              <th className="py-2 text-start">{t("licenseCol")}</th>
              <th className="py-2 text-start">{t("cityCol")}</th>
              <th className="py-2 text-start">{t("actionsCol")}</th>
            </tr>
          </thead>
          <tbody>
            {pharmacies.map((pharmacy) => {
              async function approve() {
                "use server";
                await approvePharmacy(pharmacy.id, locale);
              }
              async function reject() {
                "use server";
                await rejectPharmacy(pharmacy.id, locale);
              }

              return (
                <tr key={pharmacy.id} className="border-b">
                  <td className="py-2">{pharmacy.name}</td>
                  <td className="py-2">{pharmacy.licenseNumber}</td>
                  <td className="py-2">{pharmacy.city ?? "-"}</td>
                  <td className="flex gap-2 py-2">
                    <form action={approve}>
                      <button
                        type="submit"
                        className="rounded bg-emerald-600 px-3 py-1 text-sm text-white"
                      >
                        {t("approve")}
                      </button>
                    </form>
                    <form action={reject}>
                      <button
                        type="submit"
                        className="rounded bg-red-600 px-3 py-1 text-sm text-white"
                      >
                        {t("reject")}
                      </button>
                    </form>
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
