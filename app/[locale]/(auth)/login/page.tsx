"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { PhoneOtpForm } from "@/components/auth/PhoneOtpForm";
import { getPostLoginDestination } from "@/lib/actions/session";

export default function LoginPage() {
  const t = useTranslations("Auth");
  const router = useRouter();

  async function handleVerified() {
    const destination = await getPostLoginDestination();
    router.push(destination);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-8">
      <h1 className="text-xl font-semibold">{t("loginTitle")}</h1>
      <PhoneOtpForm onVerified={handleVerified} />
    </main>
  );
}
