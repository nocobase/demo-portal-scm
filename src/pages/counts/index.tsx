import {
  useDataProvider,
  useGetLocale,
  useTranslate,
} from "@refinedev/core";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ClipboardList, Plus, RefreshCw } from "lucide-react";

import { OptionBadge } from "@/components/stockcount/status-badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/app-shell/loading-state";
import { cn } from "@/lib/utils";
import { formatDate, formatNumber } from "@/lib/stockcount/format";
import { COUNT_STATUS } from "@/lib/stockcount/constants";
import { createFullStocktake, getCountItems } from "@/lib/stockcount/api";
import { getActiveCountId, setActiveCountId } from "@/lib/stockcount/store";
import type { InventoryCountRecord } from "@/lib/stockcount/types";

type CountRow = InventoryCountRecord & {
  countedItems?: number;
};

export const CountsPage = () => {
  const translate = useTranslate();
  const getLocale = useGetLocale();
  const locale = getLocale();
  const dataProvider = useDataProvider()();
  const navigate = useNavigate();
  const [counts, setCounts] = useState<CountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(() =>
    getActiveCountId()
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await dataProvider.getList<InventoryCountRecord>({
        resource: "scm_inventory_counts",
        pagination: { mode: "server", currentPage: 1, pageSize: 50 },
        sorters: [{ field: "createdAt", order: "desc" }],
      });
      const rows = await Promise.all(
        response.data.map(async (count) => {
          try {
            const items = await getCountItems(dataProvider, count.id);
            const counted = items.filter(
              (item) => item.status === "counted" || item.status === "resolved"
            ).length;
            return { ...count, countedItems: counted };
          } catch {
            return count;
          }
        })
      );
      setCounts(rows);
    } catch {
      setCounts([]);
    } finally {
      setLoading(false);
    }
  }, [dataProvider]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    try {
      const count = await createFullStocktake(dataProvider, undefined, locale);
      setActiveCountId(count.id);
      setActiveId(String(count.id));
      navigate("/progress");
    } finally {
      setCreating(false);
    }
  }, [dataProvider, locale, navigate]);

  const selectCount = (count: InventoryCountRecord) => {
    setActiveCountId(count.id);
    setActiveId(String(count.id));
    navigate("/progress");
  };

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">
            {translate("stockcount.counts.title", { ns: "stockcount" }, "Count orders")}
          </h1>
          <p className="text-xs text-muted-foreground">
            {translate(
              "stockcount.counts.subtitle",
              { ns: "stockcount" },
              "Pick a count to execute. The active one becomes the scan target."
            )}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => void handleCreate()}
          disabled={creating}
        >
          <Plus className="size-4" />
          {creating
            ? translate(
                "stockcount.counts.creating",
                { ns: "stockcount" },
                "Creating..."
              )
            : translate(
                "stockcount.counts.create",
                { ns: "stockcount" },
                "New count"
              )}
        </Button>
      </div>

      <button
        type="button"
        onClick={() => void load()}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <RefreshCw className="size-3.5" />
        {translate("stockcount.counts.refresh", { ns: "stockcount" }, "Refresh")}
      </button>

      {loading ? (
        <LoadingState className="min-h-48" />
      ) : counts.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-14 text-center">
          <ClipboardList className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {translate(
              "stockcount.counts.empty",
              { ns: "stockcount" },
              "No counts yet. Tap to create one."
            )}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {counts.map((count) => {
            const isActive = activeId === String(count.id);
            const total = Number(count.totalItems ?? 0);
            const counted = Number(count.countedItems ?? 0);
            const percent =
              total > 0 ? Math.round((counted / total) * 100) : 0;
            const isEditable = ["draft", "in_progress"].includes(
              count.status ?? ""
            );
            return (
              <li key={count.id}>
                <button
                  type="button"
                  onClick={() => selectCount(count)}
                  className={cn(
                    "w-full rounded-2xl border bg-card p-4 text-left shadow-sm transition-colors",
                    isActive && "border-primary/60 ring-2 ring-primary/20"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-semibold">
                        {count.countNo ?? `#${count.id}`}
                      </span>
                      <OptionBadge
                        options={COUNT_STATUS}
                        value={count.status}
                        locale={locale}
                      />
                    </div>
                    {isActive ? (
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        {translate(
                          "stockcount.counts.active",
                          { ns: "stockcount" },
                          "Active"
                        )}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {translate(
                        "stockcount.counts.countDate",
                        { ns: "stockcount" },
                        "Date"
                      )}{" "}
                      {formatDate(count.countDate, locale)}
                    </span>
                    <span>
                      {translate(
                        "stockcount.counts.countBy",
                        { ns: "stockcount" },
                        "Counted by"
                      )}{" "}
                      {count.countBy || "-"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {Number(count.diffCount ?? 0) > 0
                          ? translate(
                              "stockcount.counts.progressSummary",
                              {
                                ns: "stockcount",
                                total: formatNumber(count.totalItems),
                                counted: formatNumber(counted),
                                diff: formatNumber(count.diffCount),
                              },
                              `${formatNumber(count.totalItems)} items · ${formatNumber(counted)} counted · ${formatNumber(count.diffCount)} diff`
                            )
                          : translate(
                              "stockcount.counts.progressSummaryNoDiff",
                              {
                                ns: "stockcount",
                                total: formatNumber(count.totalItems),
                                counted: formatNumber(counted),
                              },
                              `${formatNumber(count.totalItems)} items · ${formatNumber(counted)} counted`
                            )}
                      </div>
                    </div>
                    {isEditable ? (
                      <span className="shrink-0 text-xs font-medium text-primary">
                        {translate(
                          "stockcount.counts.goCount",
                          { ns: "stockcount" },
                          "Count now →"
                        )}
                      </span>
                    ) : null}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
