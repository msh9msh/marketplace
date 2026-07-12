import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar", "en", "ur"],
  defaultLocale: "ar",
});

export type Locale = (typeof routing.locales)[number];

export const rtlLocales: ReadonlySet<Locale> = new Set(["ar", "ur"]);
