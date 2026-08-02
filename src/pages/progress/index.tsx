import {
  useDataProvider,
  useGetLocale,
  useTranslate,
} from "@refinedev/core";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Loader2,
} from "lucide-react";

import { OptionBadge } from "@/components/stockcount/status-badge";
import { AIEmployeeShortcut } from "@/extensions/nocobase-ai/components";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/app-shell/loading-state";
import { cn } from "@/lib/utils";
import { formatDate, formatNumber } from "@/lib/stockcount/format";
import {
  COUNT_STATUS,
  ITEM_STATUS,
  isCountEditable,
  optionLabel,
  PRODUCT_UNITS,
} from "@/lib/stockcount/constants";
import { completeCount, getActiveCount, getCountItems } from "@/lib/stockcount/api";
import { getActiveCountId, setActiveCountId } from "@/lib/stockcount/store";
import type { CountItemRecord, InventoryCountRecord } from "@/lib/stockcount/types";

export const ProgressPage = () => {
  const translate = useTranslate();
  const getLocale = useGetLocale();
  const locale = getLocale();
  const dataProvider = useDataProvider()();
  const navigate = useNavigate();

  const [count, setCount] = useState<InventoryCountRecord>();
  const [items, setItems] = useState<CountItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const count = await getActiveCount(dataProvider, getActiveCountId());
      setCount(count);
      if (count) {
        setActiveCountId(count.id);
        const items = await getCountItems(dataProvider, count.id);
        setItems(items);
      } else {
        setItems([]);
      }
    } catch {
      setError(
        translate(
          "stockcount.progress.loadError",
          { ns: "stockcount" },
          "Failed to load, please retry"
        )
      );
    } finally {
      setLoading(false);
    }
  }, [dataProvider, translate]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleComplete = useCallback(async () => {
    if (!count) return;
    setBusy(true);
    setError(undefined);
    try {
      await completeCount(dataProvider, count.id, locale);
      await load();
      navigate("/counts", { replace: true });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : translate(
              "stockcount.progress.completeError",
              { ns: "stockcount" },
              "Failed to complete the count"
            )
      );
    } finally {
      setBusy(false);
    }
  }, [count, dataProvider, load, locale, navigate, translate]);

  if (loading) {
    return <LoadingState className="min-h-64" />;
  }

  if (!count) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <ClipboardCheck className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {translate(
            "stockcount.progress.noCount",
            { ns: "stockcount" },
            "No count orders yet"
          )}
        </p>
        <Button variant="outline" render={<Link to="/counts" />}>
          {translate(
            "stockcount.progress.gotoCounts",
            { ns: "stockcount" },
            "Choose a count"
          )}
        </Button>
      </div>
    );
  }

  const total = Number(count.totalItems ?? items.length);
  const counted = items.filter(
    (item) => item.status === "counted" || item.status === "resolved"
  ).length;
  const diff = items.filter(
    (item) => Number(item.diffStock ?? 0) !== 0
  ).length;
  const editable = isCountEditable(count.status);

  return (
    <div className="space-y-4 px-4 py-4">
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-base font-semibold">
              {count.countNo ?? `#${count.id}`}
            </span>
            <OptionBadge
              options={COUNT_STATUS}
              value={count.status}
              locale={locale}
            />
          </div>
          <AIEmployeeShortcut
            aiEmployee="viz"
            size={34}
            className="shrink-0"
            tasks={[
              {
                title: translate(
                  "stockcount.progress.aiTask",
                  { ns: "stockcount" },
                  "Analyze count exceptions"
                ),
                message: {
                  system: locale?.startsWith("zh")
                    ? "你是仓库盘点助理。基于盘点进度与差异数据，指出异常项、可能的损耗原因并给出复核建议。回答使用简体中文，简洁。"
                    : "You are a warehouse stocktake assistant. Based on the stocktake progress and variance data, point out abnormal items, likely loss causes, and give recheck suggestions. Answer concisely in English.",
                  user: locale?.startsWith("zh")
                    ? "请分析当前盘点单的进度与差异。"
                    : "Please analyze the progress and variance of the current stocktake.",
                },
                autoSend: true,
              },
            ]}
          />
        </div>

        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat
            label={translate("stockcount.progress.total", { ns: "stockcount" }, "Items")}
            value={formatNumber(total)}
          />
          <Stat
            label={translate("stockcount.progress.counted", { ns: "stockcount" }, "Counted")}
            value={formatNumber(counted)}
          />
          <Stat
            label={translate("stockcount.progress.diff", { ns: "stockcount" }, "Diff")}
            value={formatNumber(diff)}
            tone={diff > 0 ? "warning" : "default"}
          />
        </dl>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${total > 0 ? Math.round((counted / total) * 100) : 0}%`,
            }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {translate(
            "stockcount.progress.countDate",
            { ns: "stockcount" },
            "Count date"
          )}{" "}
          {formatDate(count.countDate, locale)}
          {count.countBy ? ` · ${count.countBy}` : ""}
        </p>

        {error ? (
          <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        ) : null}

        {editable ? (
          <Button
            type="button"
            className="mt-4 h-12 w-full gap-2 text-base"
            disabled={busy}
            onClick={() => void handleComplete()}
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 className="size-5" />}
            {translate(
              "stockcount.progress.complete",
              { ns: "stockcount" },
              "Complete and adjust stock"
            )}
          </Button>
        ) : (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {translate(
              "stockcount.progress.finished",
              { ns: "stockcount" },
              "This count is finished"
            )}
          </p>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {translate("stockcount.progress.items", { ns: "stockcount" }, "Count items")}
          </h2>
          <Link
            to="/counts"
            className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
          >
            {translate("stockcount.progress.switch", { ns: "stockcount" }, "Switch count")}
            <ChevronRight className="size-3.5" />
          </Link>
        </div>

        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            {translate(
              "stockcount.progress.noItems",
              { ns: "stockcount" },
              "No items yet"
            )}
          </p>
        ) : (
          <ul className="overflow-hidden rounded-2xl border bg-card">
            {items.map((item, index) => {
              const systemStock = Number(item.systemStock ?? 0);
              const countedStock = Number(item.countedStock ?? item.systemStock ?? 0);
              const itemDiff = countedStock - systemStock;
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
                >
                  <span className="w-6 shrink-0 text-center text-xs text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {item.product?.name ?? "-"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {item.product?.sku}
                      {item.product?.unit
                        ? ` · ${optionLabel(PRODUCT_UNITS, item.product.unit, locale)}`
                        : ""}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs">
                    <div className="text-muted-foreground">
                      {translate(
                        "stockcount.progress.systemStockShort",
                        { ns: "stockcount" },
                        "Sys"
                      )}{" "}
                      {formatNumber(systemStock)}
                    </div>
                    <div
                      className={cn(
                        "font-semibold",
                        item.status === "counted" ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {translate(
                        "stockcount.progress.countedShort",
                        { ns: "stockcount" },
                        "Cnt"
                      )}{" "}
                      {formatNumber(countedStock)}
                    </div>
                  </div>
                  <div className="w-16 shrink-0 text-right">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        itemDiff > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : itemDiff < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-muted-foreground"
                      )}
                    >
                      {itemDiff > 0 ? "+" : ""}
                      {formatNumber(itemDiff)}
                    </span>
                  </div>
                  <div className="w-16 shrink-0 text-right">
                    <OptionBadge
                      options={ITEM_STATUS}
                      value={item.status}
                      locale={locale}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-xl bg-muted/50 px-2 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-0.5 text-xl font-semibold",
          tone === "warning" && "text-amber-600 dark:text-amber-400"
        )}
      >
        {value}
      </div>
    </div>
  );
}
