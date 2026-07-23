import { useEffect } from 'react';
import { useSettings } from '@/lib/queries';

/**
 * Keeps the browser tab favicon in sync with whatever logo the admin has
 * uploaded. Falls back to the static /favicon.svg when no logo is set (or
 * the logo fails to load), and never needs a manual refresh — it reacts to
 * the same cached `settings` query that Navbar/Footer use, which is
 * invalidated automatically the moment an admin uploads a new logo.
 */
export default function FaviconSync() {
  const { data: settings } = useSettings();

  useEffect(() => {
    const link =
      (document.querySelector("link[rel~='icon']") as HTMLLinkElement | null) ??
      (() => {
        const el = document.createElement('link');
        el.rel = 'icon';
        document.head.appendChild(el);
        return el;
      })();

    if (settings?.logoUrl) {
      link.href = settings.logoUrl;
    } else {
      link.href = '/favicon.svg';
    }
  }, [settings?.logoUrl]);

  return null;
}
