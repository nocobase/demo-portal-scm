import { AccessDenied } from "@/components/access-control/access-denied";
import { CanAccess } from "@/components/access-control/can-access";
import { CountsPage } from "@/pages/counts";
import { ProgressPage } from "@/pages/progress";
import { ScanPage } from "@/pages/scan";

export function StockCountScanRoute() {
  return (
    <CanAccess
      resource="scm_inventory_count_items"
      action="view"
      fallback={<AccessDenied />}
    >
      <ScanPage />
    </CanAccess>
  );
}

export function StockCountListRoute() {
  return (
    <CanAccess
      resource="scm_inventory_counts"
      action="view"
      fallback={<AccessDenied />}
    >
      <CountsPage />
    </CanAccess>
  );
}

export function StockCountProgressRoute() {
  return (
    <CanAccess
      resource="scm_inventory_counts"
      action="view"
      fallback={<AccessDenied />}
    >
      <ProgressPage />
    </CanAccess>
  );
}
