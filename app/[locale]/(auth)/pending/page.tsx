import { getTranslations } from "next-intl/server";
import { requireUser, getUserRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function PendingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireUser(locale);
  const role = await getUserRole();
  const t = await getTranslations("Pending");

  const verificationStatus =
    role === "supplier"
      ? (
          await prisma.supplier.findUnique({
            where: { authUserId: user.id },
            select: { verificationStatus: true },
          })
        )?.verificationStatus
      : (
          await prisma.pharmacy.findUnique({
            where: { authUserId: user.id },
            select: { verificationStatus: true },
          })
        )?.verificationStatus;

  const isRejected = verificationStatus === "rejected";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <p className="text-neutral-600">
        {t(isRejected ? "rejectedDescription" : "description")}
      </p>
    </main>
  );
}
