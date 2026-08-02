import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
import { useTranslate } from "@refinedev/core";

import { cn } from "@/lib/utils";

const SCANNER_ELEMENT_ID = "stockcount-barcode-scanner";

export type ScannerStatus =
  | "idle"
  | "starting"
  | "running"
  | "no-camera"
  | "error";

export function BarcodeScanner({
  onScan,
  paused,
}: {
  onScan: (text: string) => void;
  paused?: boolean;
}) {
  const translate = useTranslate();
  const [status, setStatus] = useState<ScannerStatus>("starting");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const pausedRef = useRef(false);
  pausedRef.current = paused ?? false;

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      if (typeof window === "undefined") return;
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cancelled) return;
        if (!cameras?.length) {
          setStatus("no-camera");
          return;
        }
        const preferred =
          cameras.find((camera) => /back|rear|environment/i.test(camera.label)) ??
          cameras[0];
        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = scanner;
        setStatus("running");
        await scanner.start(
          preferred.id,
          {
            fps: 10,
            qrbox: { width: 260, height: 150 },
            aspectRatio: 1.8,
          },
          (decodedText) => {
            if (pausedRef.current) return;
            onScanRef.current(decodedText);
          },
          () => {
            // per-frame failure is expected while the camera runs
          }
        );
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        try {
          void scanner.stop().then(() => scanner.clear()).catch(() => {});
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <div
        id={SCANNER_ELEMENT_ID}
        className={cn(
          "w-full overflow-hidden rounded-2xl bg-black",
          status !== "running" && "flex min-h-56 items-center justify-center"
        )}
      />
      {status === "no-camera" || status === "error" ? (
        <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
          {translate(
            "stockcount.scan.cameraUnavailable",
            { ns: "stockcount" },
            "No camera detected (or the browser denied access). Use the manual input below."
          )}
        </p>
      ) : null}
    </div>
  );
}
