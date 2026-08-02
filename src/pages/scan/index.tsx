import {
  useDataProvider,
  useGetLocale,
  useTranslate,
} from "@refinedev/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  PackageSearch,
  ScanLine,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

import { BarcodeScanner } from "@/components/stockcount/barcode-scanner";
import { OptionBadge } from "@/components/stockcount/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/stockcount/format";
import {
  COUNT_STATUS,
  isCountEditable,
  optionLabel,
  PRODUCT_UNITS,
} from "@/lib/stockcount/constants";
import {
  addItemToCount,
  findProductByCode,
  getActiveCount,
  getCountItem,
  getCountItems,
  saveCountedStock,
} from "@/lib/stockcount/api";
import { getActiveCountId, setActiveCountId } from "@/lib/stockcount/store";
import type {
  CountItemRecord,
  InventoryCountRecord,
  ProductRecord,
} from "@/lib/stockcount/types";

export const ScanPage = () => {
  const translate = useTranslate();
  const getLocale = useGetLocale();
  const locale = getLocale();
  const dataProvider = useDataProvider()();

  const [activeCount, setActiveCount] = useState<InventoryCountRecord>();
  const [product, setProduct] = useState<ProductRecord>();
  const [countItem, setCountItem] = useState<CountItemRecord>();
  const [countedInput, setCountedInput] = useState<string>("");
  const [manualCode, setManualCode] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );
  const [progress, setProgress] = useState({ total: 0, counted: 0, diff: 0 });
  const [paused, setPaused] = useState(false);
  const busyRef = useRef(false);

  const refreshProgress = useCallback(
    async (countId: number | string) => {
      try {
        const items = await getCountItems(dataProvider, countId);
        const counted = items.filter(
          (item) => item.status === "counted" || item.status === "resolved"
        ).length;
        const diff = items.filter(
          (item) => Number(item.diffStock ?? 0) !== 0
        ).length;
        setProgress({ total: items.length, counted, diff });
      } catch {
        // ignore progress errors
      }
    },
    [dataProvider]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      const storedId = getActiveCountId();
      const count = await getActiveCount(dataProvider, storedId);
      if (!mounted) return;
      if (count) {
        setActiveCount(count);
        setActiveCountId(count.id);
        void refreshProgress(count.id);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [dataProvider, refreshProgress]);

  const handleScan = useCallback(
    async (code: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        setPaused(true);
        setMessage(undefined);
        const found = await findProductByCode(dataProvider, code);
        if (!found) {
          setProduct(undefined);
          setCountItem(undefined);
          setCountedInput("");
          setMessageType("error");
          setMessage(
            translate(
              "stockcount.scan.notFound",
              { ns: "stockcount" },
              "Product not found"
            ) + `: ${code}`
          );
          return;
        }
        setProduct(found);
        if (activeCount?.id) {
          const item = await getCountItem(dataProvider, activeCount.id, found.id);
          setCountItem(item);
          setCountedInput(
            item?.countedStock === null || item?.countedStock === undefined
              ? ""
              : String(item.countedStock)
          );
          if (item) {
            void refreshProgress(activeCount.id);
          }
        }
      } finally {
        busyRef.current = false;
      }
    },
    [activeCount?.id, dataProvider, refreshProgress, translate]
  );

  const handleManualLookup = useCallback(() => {
    const code = manualCode.trim();
    if (!code) return;
    void handleScan(code);
  }, [handleScan, manualCode]);

  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoScan = useCallback(
    async (file: File) => {
      if (busyRef.current) return;
      try {
        setMessage(undefined);
        const scanner = new Html5Qrcode("stockcount-photo-scan");
        const text = await scanner.scanFile(file, false);
        if (text) {
          await handleScan(text);
        } else {
          setMessageType("error");
          setMessage(
            translate(
              "stockcount.scan.photoNoCode",
              { ns: "stockcount" },
              "No barcode found in the photo. Retake or type it in."
            )
          );
        }
      } catch {
        setMessageType("error");
        setMessage(
          translate(
            "stockcount.scan.photoError",
            { ns: "stockcount" },
            "Recognition failed. Retake or type it in."
          )
        );
      }
    },
    [handleScan, translate]
  );

  const handleSubmit = useCallback(async () => {
    if (!product || !activeCount?.id || busy) return;
    const parsed = countedInput.trim() === "" ? null : Number(countedInput);
    if (parsed !== null && Number.isNaN(parsed)) return;
    if (parsed !== null && parsed < 0) return;

    setBusy(true);
    try {
      let item = countItem;
      if (!item) {
        const created = await addItemToCount(
          dataProvider,
          activeCount.id,
          product,
          locale
        );
        item = created;
        setCountItem(created);
      }
      await saveCountedStock(dataProvider, item.id, parsed);
      setMessageType("success");
      setMessage(
        parsed === null
          ? translate(
              "stockcount.scan.savedEmpty",
              { ns: "stockcount" },
              "Count cleared"
            )
          : translate(
              "stockcount.scan.saved",
              { ns: "stockcount" },
              "Count saved"
            ) + `: ${parsed}`
      );
      setProduct(undefined);
      setCountItem(undefined);
      setCountedInput("");
      setPaused(false);
      void refreshProgress(activeCount.id);
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : translate(
              "stockcount.scan.saveError",
              { ns: "stockcount" },
              "Failed to save, please retry"
            )
      );
    } finally {
      setBusy(false);
    }
  }, [
    activeCount?.id,
    busy,
    countedInput,
    countItem,
    dataProvider,
    locale,
    product,
    refreshProgress,
    translate,
  ]);

  const systemStock = countItem ? Number(countItem.systemStock ?? 0) : 0;
  const parsedCounted = countedInput.trim() === "" ? null : Number(countedInput);
  const diff =
    parsedCounted !== null && !Number.isNaN(parsedCounted)
      ? parsedCounted - systemStock
      : 0;

  return (
    <div className="space-y-4 px-4 py-4">
      <section className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold">
            {translate("stockcount.scan.title", { ns: "stockcount" }, "Scan & count")}
          </h1>
          <p className="text-xs text-muted-foreground">
            {translate(
              "stockcount.scan.subtitle",
              { ns: "stockcount" },
              "Aim at the barcode, then enter the counted quantity"
            )}
          </p>
        </div>
      </section>

      <ActiveCountCard
        count={activeCount}
        progress={progress}
        translate={translate}
        locale={locale}
      />

      <section className="space-y-2">
        <BarcodeScanner onScan={handleScan} paused={paused} />
        <div className="flex items-center gap-2 rounded-xl border border-dashed bg-card px-3 py-2 text-xs text-muted-foreground">
          <ScanLine className="size-4 shrink-0" />
          <span>
            {translate(
              "stockcount.scan.hint",
              { ns: "stockcount" },
              "Scan a barcode or type a barcode / SKU"
            )}
          </span>
        </div>
      </section>

      <section className="flex items-center gap-2">
        <Input
          value={manualCode}
          onChange={(event) => setManualCode(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleManualLookup();
          }}
          placeholder={translate(
            "stockcount.scan.manualPlaceholder",
            { ns: "stockcount" },
            "Type a barcode or SKU, e.g. 6901000010013"
          )}
          className="h-11 flex-1"
        />
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={handleManualLookup}
        >
          {translate("stockcount.scan.lookup", { ns: "stockcount" }, "Look up")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 gap-1.5 px-3"
          onClick={() => photoInputRef.current?.click()}
        >
          <Camera className="size-4" />
          <span className="hidden sm:inline">
            {translate("stockcount.scan.photo", { ns: "stockcount" }, "Photo scan")}
          </span>
        </Button>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void handlePhotoScan(file);
          }}
        />
        <div id="stockcount-photo-scan" className="hidden" />
      </section>

      {message ? (
        <div
          className={cn(
            "rounded-xl px-3 py-2 text-sm",
            messageType === "success"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          )}
        >
          {message}
        </div>
      ) : null}

      {product ? (
        <ProductCountCard
          product={product}
          countItem={countItem}
          systemStock={systemStock}
          countedInput={countedInput}
          onCountedChange={(value) => setCountedInput(value)}
          diff={diff}
          busy={busy}
          editable={isCountEditable(activeCount?.status)}
          translate={translate}
          locale={locale}
          onSubmit={handleSubmit}
          onDismiss={() => {
            setProduct(undefined);
            setCountItem(undefined);
            setCountedInput("");
            setPaused(false);
          }}
        />
      ) : null}
    </div>
  );
};

function ActiveCountCard({
  count,
  progress,
  translate,
  locale,
}: {
  count?: InventoryCountRecord;
  progress: { total: number; counted: number; diff: number };
  translate: ReturnType<typeof useTranslate>;
  locale?: string;
}) {
  if (!count) {
    return (
      <Link
        to="/counts"
        className="flex items-center justify-between rounded-2xl border border-dashed bg-card px-4 py-3"
      >
        <span className="text-sm text-muted-foreground">
          {translate(
            "stockcount.scan.noActiveCount",
            { ns: "stockcount" },
            "No active count yet. Tap to choose one."
          )}
        </span>
        <ArrowRight className="size-4 text-muted-foreground" />
      </Link>
    );
  }

  const percent =
    progress.total > 0 ? Math.round((progress.counted / progress.total) * 100) : 0;

  return (
    <Link
      to="/progress"
      className="block rounded-2xl border bg-card p-4 shadow-sm"
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
        <span className="text-xs text-muted-foreground">
          {translate("stockcount.scan.progress", { ns: "stockcount" }, "Counted")}{" "}
          {formatNumber(progress.counted)}/{formatNumber(progress.total)}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {translate("stockcount.scan.countDate", { ns: "stockcount" }, "Count date")}{" "}
          {count.countDate ?? "-"}
        </span>
        {progress.diff > 0 ? (
          <span className="font-medium text-amber-600 dark:text-amber-400">
            {translate("stockcount.scan.diffCount", { ns: "stockcount" }, "Diff")}{" "}
            {formatNumber(progress.diff)}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function ProductCountCard({
  product,
  countItem,
  systemStock,
  countedInput,
  onCountedChange,
  diff,
  busy,
  editable,
  translate,
  locale,
  onSubmit,
  onDismiss,
}: {
  product: ProductRecord;
  countItem?: CountItemRecord;
  systemStock: number;
  countedInput: string;
  onCountedChange: (value: string) => void;
  diff: number;
  busy: boolean;
  editable: boolean;
  translate: ReturnType<typeof useTranslate>;
  locale?: string;
  onSubmit: () => void;
  onDismiss: () => void;
}) {
  const notInCount = !countItem;

  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <PackageSearch className="size-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold leading-tight">
              {product.name}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {product.sku}
              {product.barcode ? ` · ${product.barcode}` : ""}
              {product.unit
                ? ` · ${optionLabel(PRODUCT_UNITS, product.unit, locale)}`
                : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={onDismiss}
        >
          {translate("stockcount.scan.dismiss", { ns: "stockcount" }, "Dismiss")}
        </button>
      </div>

      {notInCount ? (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            {translate(
              "stockcount.scan.notInCount",
              { ns: "stockcount" },
              "This product is not in the current count yet. It will be added automatically on submit."
            )}
          </span>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-muted/60 px-3 py-2">
          <div className="text-xs text-muted-foreground">
            {translate("stockcount.scan.systemStock", { ns: "stockcount" }, "System stock")}
          </div>
          <div className="mt-0.5 text-lg font-semibold">
            {formatNumber(systemStock)}
          </div>
        </div>
        <div className="rounded-xl bg-muted/60 px-3 py-2">
          <div className="text-xs text-muted-foreground">
            {translate("stockcount.scan.liveStock", { ns: "stockcount" }, "Live stock")}
          </div>
          <div className="mt-0.5 text-lg font-semibold">
            {formatNumber(product.currentStock)}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          {translate("stockcount.scan.countedStock", { ns: "stockcount" }, "Counted quantity")}
        </label>
        <Input
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          value={countedInput}
          onChange={(event) => onCountedChange(event.target.value)}
          disabled={!editable || busy}
          placeholder={translate(
            "stockcount.scan.countedPlaceholder",
            { ns: "stockcount" },
            "Enter counted quantity"
          )}
          className="h-12 text-lg font-semibold"
          autoFocus
        />
        {countedInput.trim() !== "" ? (
          <p
            className={cn(
              "text-xs",
              diff === 0
                ? "text-muted-foreground"
                : diff > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            )}
          >
            {translate("stockcount.scan.diff", { ns: "stockcount" }, "Diff")}:{" "}
            {diff > 0 ? "+" : ""}
            {formatNumber(diff)}
          </p>
        ) : null}
      </div>

      {editable ? (
        <Button
          type="button"
          className="h-12 w-full text-base"
          disabled={busy}
          onClick={onSubmit}
        >
          <CheckCircle2 className="size-5" />
          {translate(
            "stockcount.scan.confirm",
            { ns: "stockcount" },
            "Confirm count"
          )}
        </Button>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          {translate(
            "stockcount.scan.countNotEditable",
            { ns: "stockcount" },
            "This count is finished and locked"
          )}
        </p>
      )}
    </section>
  );
}
