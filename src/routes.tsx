import { ClipboardList, ScanBarcode, TrendingUp } from "lucide-react";

import { defineAppRoutes } from "@nocobase/portal-sdk/routing";
import { AccessDenied } from "@/components/access-control/access-denied";
import { CanAccess } from "@/components/access-control/can-access";
import { ScanPage } from "@/pages/scan";
import { CountsPage } from "@/pages/counts";
import { ProgressPage } from "@/pages/progress";

// Set this to false when the application no longer needs the example routes
// contributed by installed Registry extensions. Providers, adapters, and the
// development showcase under /dev remain available.
export const registryRoutesEnabled = false;

// Add application-owned business routes here. Installed Registry extensions
// contribute their own route definitions through the same runtime. Add a
// resource entry when a route should also appear in navigation.
export const appRoutes = defineAppRoutes([
  {
    name: "stockcount_scan",
    path: "/scan",
    element: (
      <CanAccess
        resource="scm_inventory_count_items"
        action="view"
        fallback={<AccessDenied />}
      >
        <ScanPage />
      </CanAccess>
    ),
    resource: {
      meta: {
        label: "扫码盘点",
        i18nKey: "stockcount.nav.scan",
        i18nOptions: { ns: "stockcount" },
        icon: <ScanBarcode />,
        priority: 1,
        canCreate: false,
        canDelete: false,
      },
    },
  },
  {
    name: "stockcount_counts",
    path: "/counts",
    element: (
      <CanAccess
        resource="scm_inventory_counts"
        action="view"
        fallback={<AccessDenied />}
      >
        <CountsPage />
      </CanAccess>
    ),
    resource: {
      meta: {
        label: "盘点单",
        i18nKey: "stockcount.nav.counts",
        i18nOptions: { ns: "stockcount" },
        icon: <ClipboardList />,
        priority: 2,
        canCreate: true,
        canDelete: false,
      },
    },
  },
  {
    name: "stockcount_progress",
    path: "/progress",
    element: (
      <CanAccess
        resource="scm_inventory_counts"
        action="view"
        fallback={<AccessDenied />}
      >
        <ProgressPage />
      </CanAccess>
    ),
    resource: {
      meta: {
        label: "进度",
        i18nKey: "stockcount.nav.progress",
        i18nOptions: { ns: "stockcount" },
        icon: <TrendingUp />,
        priority: 3,
        canCreate: false,
        canDelete: false,
      },
    },
  },
]);
