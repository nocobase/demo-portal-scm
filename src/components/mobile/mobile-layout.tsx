import { NavLink, Outlet } from "react-router";
import { ClipboardList, ScanBarcode, TrendingUp } from "lucide-react";
import { useTranslate } from "@refinedev/core";

import { cn } from "@/lib/utils";

const tabs = [
  {
    to: "/scan",
    key: "stockcount.nav.scan",
    labelZh: "扫码盘点",
    labelEn: "Scan",
    icon: ScanBarcode,
  },
  {
    to: "/counts",
    key: "stockcount.nav.counts",
    labelZh: "盘点单",
    labelEn: "Counts",
    icon: ClipboardList,
  },
  {
    to: "/progress",
    key: "stockcount.nav.progress",
    labelZh: "进度",
    labelEn: "Progress",
    icon: TrendingUp,
  },
] as const;

export function MobileBottomNav() {
  const translate = useTranslate();

  return (
    <nav className="sticky bottom-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("size-5", isActive && "stroke-[2.25]")} />
                  <span>
                    {translate(tab.key, { ns: "stockcount" }, tab.labelEn)}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background shadow-[0_0_0_1px_hsl(var(--border))] md:border-x">
      {children}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
}
