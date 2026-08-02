const ACTIVE_COUNT_KEY = "stockcount.activeCountId";

export function getActiveCountId(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_COUNT_KEY);
  } catch {
    return null;
  }
}

export function setActiveCountId(id: string | number): void {
  try {
    window.localStorage.setItem(ACTIVE_COUNT_KEY, String(id));
  } catch {
    // ignore storage errors
  }
}

export function clearActiveCountId(): void {
  try {
    window.localStorage.removeItem(ACTIVE_COUNT_KEY);
  } catch {
    // ignore storage errors
  }
}
