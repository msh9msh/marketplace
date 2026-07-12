"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PhoneOtpForm } from "@/components/auth/PhoneOtpForm";
import { SupplierProfileForm } from "@/components/supplier/SupplierProfileForm";

export default function SupplierSignUpPage() {
  const t = useTranslations("Auth");
  const [verified, setVerified] = useState(false);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-8">
      <h1 className="text-xl font-semibold">{t("supplierSignUpTitle")}</h1>
      {verified ? (
        <SupplierProfileForm />
      ) : (
        <PhoneOtpForm onVerified={() => setVerified(true)} />
      )}
    </main>
  );
}
