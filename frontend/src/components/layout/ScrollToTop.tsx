import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Because this is an SPA with no full page reloads, we must manually
// reset scroll position whenever the route changes.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}
