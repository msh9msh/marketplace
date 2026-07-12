"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { submitSupplierProfile } from "@/lib/actions/supplier";
import { Field } from "@/components/forms/Field";

export function SupplierProfileForm() {
  const t = useTranslations("SupplierSignUpForm");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await submitSupplierProfile(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/pending");
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <Field label={t("nameLabel")} name="name" required />
      <Field
        label={t("sfdaLicenseNumberLabel")}
        name="sfdaLicenseNumber"
        required
      />
      <label className="flex flex-col gap-1 text-sm text-neutral-600">
        {t("sfdaLicenseDocLabel")}
        <input
          type="file"
          name="sfdaLicenseDoc"
          required
          accept="application/pdf,image/*"
        />
      </label>
      <Field label={t("contactEmailLabel")} name="contactEmail" type="email" />
      <Field label={t("cityLabel")} name="city" required />
      <Field label={t("districtLabel")} name="district" />
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {t("submit")}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
