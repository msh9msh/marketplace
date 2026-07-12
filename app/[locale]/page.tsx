import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Content />;
}

function Content() {
  const t = useTranslations("HomePage");
  const nav = useTranslations("Nav");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-neutral-600">{t("description")}</p>
      </div>
      <nav className="flex flex-wrap justify-center gap-3 text-sm">
        <Link href="/login" className="underline">
          {nav("login")}
        </Link>
        <Link href="/sign-up" className="underline">
          {nav("signUp")}
        </Link>
        <Link href="/supplier-sign-up" className="underline">
          {nav("supplierSignUp")}
        </Link>
        <Link href="/admin/pharmacies" className="underline">
          {nav("adminPharmacies")}
        </Link>
      </nav>
    </main>
  );
}
