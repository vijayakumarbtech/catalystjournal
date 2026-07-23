import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export default function NotFound() {
  useEffect(() => {
    document.title = 'Page Not Found — The Catalyst';
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 py-32 text-center">
      <p className="font-display text-7xl font-bold text-navy-900 mb-4">404</p>
      <h1 className="text-2xl font-bold mb-3">Page not found</h1>
      <p className="text-ink-700 mb-8">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link
        to="/"
        className="btn-primary inline-flex items-center bg-navy-900 text-white px-6 py-3 rounded hover:bg-navy-800 text-sm"
      >
        Return Home
      </Link>
    </div>
  );
}
