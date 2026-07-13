"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createCatalogItem, updateCatalogItem } from "@/lib/actions/catalog";
import { Field } from "@/components/forms/Field";
import { halalasToSar } from "@/lib/money";

interface CatalogItemFormProps {
  locale: string;
  item?: {
    id: string;
    productName: string;
    productType: string;
    sku: string | null;
    price: number;
    discountPercentage: number | null;
    quantityAvailable: number;
    isFeatured: boolean;
    status: "active" | "inactive";
  };
}

export function CatalogItemForm({ locale, item }: CatalogItemFormProps) {
  const t = useTranslations("SupplierCatalogForm");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Bumped on successful create to remount the form and clear its
  // uncontrolled inputs — edit mode navigates away instead, so it
  // doesn't need this.
  const [formKey, setFormKey] = useState(0);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = item
      ? await updateCatalogItem(item.id, formData, locale)
      : await createCatalogItem(formData, locale);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (item) {
      router.push("/supplier/catalog");
      return;
    }
    setFormKey((key) => key + 1);
    router.refresh();
  }

  return (
    <form key={formKey} action={handleSubmit} className="flex flex-col gap-4">
      <Field
        label={t("productNameLabel")}
        name="productName"
        defaultValue={item?.productName}
        required
      />
      <Field
        label={t("productTypeLabel")}
        name="productType"
        defaultValue={item?.productType}
        required
      />
      <Field
        label={t("skuLabel")}
        name="sku"
        defaultValue={item?.sku ?? undefined}
      />
      <Field
        label={t("priceLabel")}
        name="price"
        type="number"
        step="0.01"
        defaultValue={item ? halalasToSar(item.price) : undefined}
        required
      />
      <Field
        label={t("discountPercentageLabel")}
        name="discountPercentage"
        type="number"
        step="0.01"
        defaultValue={item?.discountPercentage ?? undefined}
      />
      <Field
        label={t("quantityAvailableLabel")}
        name="quantityAvailable"
        type="number"
        defaultValue={item?.quantityAvailable}
        required
      />
      <label className="flex items-center gap-2 text-sm text-neutral-600">
        <input
          type="checkbox"
          name="isFeatured"
          defaultChecked={item?.isFeatured}
        />
        {t("isFeaturedLabel")}
      </label>
      {item && (
        <div className="flex flex-col gap-1">
          <label className="text-sm text-neutral-600" htmlFor="status">
            {t("statusLabel")}
          </label>
          <select
            id="status"
            name="status"
            defaultValue={item.status}
            className="rounded border px-2 py-1 text-neutral-900"
          >
            <option value="active">{t("statusActive")}</option>
            <option value="inactive">{t("statusInactive")}</option>
          </select>
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {item ? t("submitEdit") : t("submitCreate")}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
