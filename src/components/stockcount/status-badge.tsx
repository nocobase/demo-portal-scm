import { Badge } from "@/components/ui/badge";
import { optionLabel, type OptionItem } from "@/lib/stockcount/constants";
import { cn } from "@/lib/utils";

const colorClasses: Record<string, string> = {
  default: "bg-muted text-muted-foreground",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  gold: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  geekblue:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
};

export function OptionBadge({
  options,
  value,
  locale,
  className,
}: {
  options: OptionItem[];
  value?: string | null;
  locale?: string;
  className?: string;
}) {
  const option = options.find((item) => item.value === value);
  if (!option) return null;

  return (
    <Badge
      variant="secondary"
      className={cn("shrink-0", colorClasses[option.color ?? "default"], className)}
    >
      {optionLabel(options, value, locale)}
    </Badge>
  );
}
