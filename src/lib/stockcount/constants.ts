import { translate } from "@nocobase/portal-sdk/i18n";

export type OptionItem = {
  value: string;
  /** Translation key; labelEn is the fallback when a locale lacks the key. */
  i18nKey: string;
  labelZh: string;
  labelEn: string;
  color?: string;
};

export const COUNT_STATUS: OptionItem[] = [
  { value: "draft",
    i18nKey: "stockcount.option.countStatus.draft", labelZh: "草稿", labelEn: "Draft", color: "default" },
  {
    value: "in_progress",
    i18nKey: "stockcount.option.countStatus.in_progress",
    labelZh: "进行中",
    labelEn: "In progress",
    color: "blue",
  },
  {
    value: "completed",
    i18nKey: "stockcount.option.countStatus.completed",
    labelZh: "已完成",
    labelEn: "Completed",
    color: "green",
  },
  {
    value: "cancelled",
    i18nKey: "stockcount.option.countStatus.cancelled",
    labelZh: "已取消",
    labelEn: "Cancelled",
    color: "red",
  },
];

export const ITEM_STATUS: OptionItem[] = [
  { value: "pending",
    i18nKey: "stockcount.option.itemStatus.pending", labelZh: "未盘", labelEn: "Pending", color: "default" },
  { value: "counted",
    i18nKey: "stockcount.option.itemStatus.counted", labelZh: "已盘", labelEn: "Counted", color: "blue" },
  {
    value: "resolved",
    i18nKey: "stockcount.option.itemStatus.resolved",
    labelZh: "已处理",
    labelEn: "Resolved",
    color: "green",
  },
];

export const PRODUCT_UNITS: OptionItem[] = [
  { value: "piece",
    i18nKey: "stockcount.option.unit.piece", labelZh: "件", labelEn: "Piece" },
  { value: "box",
    i18nKey: "stockcount.option.unit.box", labelZh: "箱", labelEn: "Box" },
  { value: "case",
    i18nKey: "stockcount.option.unit.case", labelZh: "盒", labelEn: "Case" },
  { value: "kg",
    i18nKey: "stockcount.option.unit.kg", labelZh: "公斤", labelEn: "kg" },
  { value: "meter",
    i18nKey: "stockcount.option.unit.meter", labelZh: "米", labelEn: "meter" },
];

export function optionLabel(
  options: OptionItem[],
  value?: string | null
): string {
  const option = options.find((item) => item.value === value);
  if (!option) return value ?? "-";
  return optionText(option);
}

/** Resolve one option's label in the active locale. */
export function optionText(option: OptionItem): string {
  return translate(option.i18nKey, { ns: "stockcount" }, option.labelEn);
}

export const isCountEditable = (status?: string | null) =>
  status === "draft" || status === "in_progress";
