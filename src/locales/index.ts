import { registerTranslationResources } from "@nocobase/portal-sdk/i18n";
import { starter as enUSStarter } from "./en-US";
import { starter as zhCNStarter } from "./zh-CN";
import { stockcount as enUSStockcount } from "./stockcount/en-US";
import { stockcount as zhCNStockcount } from "./stockcount/zh-CN";
import { additionalTranslations } from "./generated";

registerTranslationResources("starter", {
  "en-US": enUSStarter,
  "zh-CN": zhCNStarter,
  ...(additionalTranslations["starter"] ?? {}),
});

registerTranslationResources("stockcount", {
  "en-US": enUSStockcount,
  "zh-CN": zhCNStockcount,
  ...(additionalTranslations["stockcount"] ?? {}),
});
