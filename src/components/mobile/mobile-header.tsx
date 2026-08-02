import { useActiveAuthProvider, useLogout, useTranslate } from "@refinedev/core";
import { LogOutIcon, ScanBarcode } from "lucide-react";

import { UserAvatar } from "@/components/app-shell/user-avatar";
import { UserInfo } from "@/components/app-shell/user-info";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { extensionUserMenuItems } from "@/app/extensions";
import { LanguageToggle } from "@/components/app-shell/language-toggle";

export function MobileHeader() {
  const translate = useTranslate();
  const appName = translate(
    "stockcount.appName",
    { ns: "stockcount" },
    "Stock Count"
  );

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-background/95 px-4 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ScanBarcode className="size-4" />
        </span>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-semibold" title={appName}>
            {translate(
              "stockcount.appName",
              { ns: "stockcount" },
              "Stock Count"
            )}
          </div>
          <div className="truncate text-[11px] text-muted-foreground">
            {translate(
              "stockcount.appTagline",
              { ns: "stockcount" },
              "Scan · Count · Adjust"
            )}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <LanguageToggle className="size-9" />
        <ThemeToggle className="size-9" />
        <MobileUserDropdown />
      </div>
    </header>
  );
}

function MobileUserDropdown() {
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const translate = useTranslate();
  const authProvider = useActiveAuthProvider();

  if (!authProvider?.getIdentity) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <UserAvatar />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        <div className="px-2 py-2">
          <UserInfo />
        </div>
        {extensionUserMenuItems.map(({ id, Component }) => (
          <Component key={id} />
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="mt-1 min-h-9 cursor-pointer gap-2 px-2 text-muted-foreground focus:text-foreground"
          onClick={() => logout()}
        >
          <LogOutIcon />
          <span>
            {isLoggingOut
              ? translate("auth.signingOut", "Signing out...")
              : translate("auth.signOut", "Sign out")}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
