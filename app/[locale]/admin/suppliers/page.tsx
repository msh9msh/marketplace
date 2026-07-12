import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { createSupplierWithContract } from "@/lib/actions/supplier";
import { Field } from "@/components/forms/Field";

export default async function AdminSuppliersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);
  const t = await getTranslations("AdminSuppliers");

  const suppliers = await prisma.supplier.findMany({
    include: { contract: true },
    orderBy: { createdAt: "desc" },
  });

  async function createSupplierAction(formData: FormData) {
    "use server";
    await createSupplierWithContract(formData, locale);
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-xl font-semibold">{t("title")}</h1>

      <form
        action={createSupplierAction}
        className="mb-10 grid grid-cols-2 gap-4 rounded border p-6"
      >
        <Field label={t("nameLabel")} name="name" required />
        <Field label={t("sfdaLabel")} name="sfdaLicenseNumber" required />
        <Field
          label={t("slaHoursLabel")}
          name="slaHours"
          type="number"
          defaultValue={48}
        />
        <Field
          label={t("payoutDaysLabel")}
          name="payoutDays"
          type="number"
          required
        />
        <Field
          label={t("rebateRateLabel")}
          name="rebateRate"
          type="number"
          step="0.1"
          required
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm text-neutral-600" htmlFor="targetType">
            {t("targetTypeLabel")}
          </label>
          <select
            id="targetType"
            name="targetType"
            required
            className="rounded border px-2 py-1 text-neutral-900"
          >
            <option value="quantity">{t("targetTypeQuantity")}</option>
            <option value="amount">{t("targetTypeAmount")}</option>
          </select>
        </div>
        <Field
          label={t("targetValueLabel")}
          name="targetValue"
          type="number"
          required
        />
        <Field
          label={t("periodStartLabel")}
          name="periodStart"
          type="date"
          required
        />
        <Field
          label={t("periodEndLabel")}
          name="periodEnd"
          type="date"
          required
        />
        <div className="col-span-2">
          <button
            type="submit"
            className="rounded bg-neutral-900 px-4 py-2 text-white"
          >
            {t("submit")}
          </button>
        </div>
      </form>

      <h2 className="mb-4 text-lg font-medium">{t("listTitle")}</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-sm text-neutral-500">
            <th className="py-2 text-start">{t("nameCol")}</th>
            <th className="py-2 text-start">{t("sfdaCol")}</th>
            <th className="py-2 text-start">{t("payoutDaysCol")}</th>
            <th className="py-2 text-start">{t("rebateCol")}</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.id} className="border-b">
              <td className="py-2">{supplier.name}</td>
              <td className="py-2">{supplier.sfdaLicenseNumber}</td>
              <td className="py-2">{supplier.contract?.payoutDays ?? "-"}</td>
              <td className="py-2">
                {supplier.contract
                  ? `${supplier.contract.rebateRate.toNumber() * 100}%`
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
