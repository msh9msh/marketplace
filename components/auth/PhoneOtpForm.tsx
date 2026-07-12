"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { requestOtp, verifyOtp } from "@/lib/actions/auth";

export function PhoneOtpForm({ onVerified }: { onVerified: () => void }) {
  const t = useTranslations("Auth");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleRequestOtp(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await requestOtp(phone);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStep("otp");
  }

  async function handleVerifyOtp(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await verifyOtp(phone, code);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onVerified();
  }

  if (step === "phone") {
    return (
      <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-neutral-600">
          {t("phoneLabel")}
          <input
            type="tel"
            required
            placeholder={t("phonePlaceholder")}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="rounded border px-3 py-2 text-base text-neutral-900"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {t("sendCode")}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm text-neutral-600">
        {t("otpLabel")}
        <input
          type="text"
          required
          inputMode="numeric"
          placeholder={t("otpPlaceholder")}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="rounded border px-3 py-2 text-base text-neutral-900"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {t("verifyCode")}
      </button>
      <button
        type="button"
        onClick={() => setStep("phone")}
        className="text-sm text-neutral-500 underline"
      >
        {t("changePhone")}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
