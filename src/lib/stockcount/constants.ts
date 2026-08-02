export type OptionItem = {
  value: string;
  labelZh: string;
  labelEn: string;
  color?: string;
};

export const COUNT_STATUS: OptionItem[] = [
  { value: "draft", labelZh: "草稿", labelEn: "Draft", color: "default" },
  {
    value: "in_progress",
    labelZh: "进行中",
    labelEn: "In progress",
    color: "blue",
  },
  {
    value: "completed",
    labelZh: "已完成",
    labelEn: "Completed",
    color: "green",
  },
  {
    value: "cancelled",
    labelZh: "已取消",
    labelEn: "Cancelled",
    color: "red",
  },
];

export const ITEM_STATUS: OptionItem[] = [
  { value: "pending", labelZh: "未盘", labelEn: "Pending", color: "default" },
  { value: "counted", labelZh: "已盘", labelEn: "Counted", color: "blue" },
  {
    value: "resolved",
    labelZh: "已处理",
    labelEn: "Resolved",
    color: "green",
  },
];

export const PRODUCT_UNITS: OptionItem[] = [
  { value: "piece", labelZh: "件", labelEn: "Piece" },
  { value: "box", labelZh: "箱", labelEn: "Box" },
  { value: "case", labelZh: "盒", labelEn: "Case" },
  { value: "kg", labelZh: "公斤", labelEn: "kg" },
  { value: "meter", labelZh: "米", labelEn: "meter" },
];

export function optionLabel(
  options: OptionItem[],
  value?: string | null,
  locale?: string
): string {
  const option = options.find((item) => item.value === value);
  if (!option) return value ?? "-";
  return locale === "en-US" ? option.labelEn : option.labelZh;
}

export const isCountEditable = (status?: string | null) =>
  status === "draft" || status === "in_progress";
