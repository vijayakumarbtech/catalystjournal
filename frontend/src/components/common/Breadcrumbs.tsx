import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface Crumb {
  label: string;
  to?: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="bg-paper-dim border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <ol className="flex items-center gap-2 text-sm text-ink-500 flex-wrap">
          <li className="flex items-center gap-2">
            <Link to="/" className="hover:text-navy-900 flex items-center gap-1">
              <Home size={14} /> Home
            </Link>
          </li>
          {items.map((c, i) => (
            <li key={i} className="flex items-center gap-2">
              <ChevronRight size={14} />
              {c.to ? (
                <Link to={c.to} className="hover:text-navy-900">
                  {c.label}
                </Link>
              ) : (
                <span className="text-navy-900 font-medium">{c.label}</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
