// Links typed by the user (wishlist items, plan lines): "shop.ee/x" becomes "https://shop.ee/x", and
// anything that isn't http(s) is rejected so it can never turn into a script link.

/** null = left empty, undefined = not a usable web address. */
export function normalizeUrl(raw: string): string | null | undefined {
  const value = raw.trim();
  if (!value) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** Re-checked at render time, so an odd stored value never becomes a live link. */
export function safeHref(url: string | null | undefined) {
  return url && /^https?:\/\//i.test(url) ? url : null;
}
