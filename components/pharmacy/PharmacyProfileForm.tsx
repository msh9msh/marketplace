"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { submitPharmacyProfile } from "@/lib/actions/pharmacy";

export function PharmacyProfileForm() {
  const t = useTranslations("SignUpForm");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await submitPharmacyProfile(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/pending");
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <TextField label={t("nameLabel")} name="name" required />
      <TextField
        label={t("licenseNumberLabel")}
        name="licenseNumber"
        required
      />
      <label className="flex flex-col gap-1 text-sm text-neutral-600">
        {t("licenseDocLabel")}
        <input
          type="file"
          name="licenseDoc"
          required
          accept="application/pdf,image/*"
        />
      </label>
      <TextField label={t("contactEmailLabel")} name="contactEmail" type="email" />
      <TextField label={t("cityLabel")} name="city" required />
      <TextField label={t("addressLabel")} name="address" required />
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

function TextField({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-neutral-600">
      {label}
      <input
        type={type}
        name={name}
        required={required}
        className="rounded border px-3 py-2 text-base text-neutral-900"
      />
    </label>
  );
}
