import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings, useNav } from '@/lib/queries';
import { getImageUrl } from '@/lib/api';
import type { NavItemType } from '@/types';

// Rendered until the nav API responds (or if the DB hasn't been seeded
// yet), so the header never appears broken/empty. Mirrors the exact
// required menu order.
const DEFAULT_NAV: NavItemType[] = [
  { _id: 'd1', location: 'header', label: 'Home', path: '/', order: 1, enabled: true, children: [] },
  {
    _id: 'd2',
    location: 'header',
    label: 'Submission Guidelines',
    path: '/submission-guidelines',
    order: 2,
    enabled: true,
    children: [
      { _id: 'd2a', label: 'Open Access Statement & Licensing', path: '/open-access-statement', order: 1, enabled: true },
      { _id: 'd2b', label: 'Peer Review Policy', path: '/peer-review-policy', order: 2, enabled: true },
      { _id: 'd2c', label: 'Publication Ethics & Malpractice Statement', path: '/publication-ethics', order: 3, enabled: true },
    ],
  },
  { _id: 'd3', location: 'header', label: 'Editorial Board', path: '/editorial-board', order: 3, enabled: true, children: [] },
  { _id: 'd4', location: 'header', label: 'Current Issue', path: '/current-issue', order: 4, enabled: true, children: [] },
  { _id: 'd5', location: 'header', label: 'Archives', path: '/archives', order: 5, enabled: true, children: [] },
  { _id: 'd6', location: 'header', label: 'FAQ', path: '/faq', order: 6, enabled: true, children: [] },
  { _id: 'd7', location: 'header', label: 'Contact', path: '/contact', order: 7, enabled: true, children: [] },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { data: settings } = useSettings();
  const { data: nav } = useNav();

  const headerItems = (nav && nav.length > 0 ? nav : DEFAULT_NAV)
    .filter((item) => item.location === 'header')
    .sort((a, b) => a.order - b.order);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Reset the broken-image fallback whenever the admin sets a new logo URL.
  useEffect(() => {
    setLogoError(false);
  }, [settings?.logoUrl]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium px-3 py-2 rounded-md transition-colors duration-200 ${
      isActive ? 'text-navy-900 bg-navy-50 font-semibold' : 'text-ink-700 hover:text-navy-900 hover:bg-navy-50/50'
    }`;

  return (
    <header
      className={`sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b transition-shadow duration-300 ${
        scrolled ? 'border-stone-200 shadow-sm' : 'border-transparent'
      }`}
    >
      {settings?.announcementBar?.enabled && (
        <div className="bg-navy-900 text-white text-center text-xs sm:text-sm py-1.5 px-4 font-medium">
          {settings.announcementBar.linkUrl ? (
            <a href={settings.announcementBar.linkUrl} className="hover:underline">
              {settings.announcementBar.text}
            </a>
          ) : (
            settings.announcementBar.text
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo Section - Reduced gap */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            {settings?.logoUrl && !logoError ? (
              <img
                src={getImageUrl(settings.logoUrl)}
                alt={`${settings.journalName || 'The Catalyst'} logo`}
                className="h-10 w-auto object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-navy-900 border-2 border-gold-500 flex items-center justify-center">
                <span className="font-display text-gold-400 text-lg font-bold">C</span>
              </div>
            )}
            <div className="leading-tight">
              <div className="font-display text-base lg:text-lg font-bold text-navy-900 tracking-tight">
                {settings?.journalName || 'The Catalyst'}
              </div>
              {(settings?.subtitle || settings?.tagline) && (
                <div className="font-label text-[10px] tracking-wider text-ink-500 uppercase hidden sm:block">
                  {settings?.subtitle || 'Intl. Journal of Research & Innovation'}
                </div>
              )}
              {!settings?.subtitle && !settings?.tagline && (
                <div className="font-label text-[10px] tracking-wider text-ink-500 uppercase hidden sm:block">
                  Intl. Journal of Research &amp; Innovation
                </div>
              )}
            </div>
          </Link>

          {/* Navigation - Centered with better spacing */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {headerItems.map((item) =>
              item.children.length === 0 ? (
                <NavLink key={item._id} to={item.path || '/'} className={linkClass}>
                  {item.label}
                </NavLink>
              ) : (
                <div
                  key={item._id}
                  className="relative"
                  onMouseEnter={() => setOpenDropdownId(item._id)}
                  onMouseLeave={() => setOpenDropdownId(null)}
                >
                  <NavLink to={item.path || '#'} className={linkClass}>
                    <span className="flex items-center gap-0.5">
                      {item.label}
                    </span>
                  </NavLink>
                  <AnimatePresence>
                    {openDropdownId === item._id && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full pt-1 w-64"
                      >
                        <div className="bg-white rounded-lg shadow-lg border border-stone-200 py-1.5">
                          {item.children
                            .sort((a, b) => a.order - b.order)
                            .map((child) => (
                              <NavLink
                                key={child._id}
                                to={child.path}
                                className="block px-4 py-2 text-sm text-ink-700 hover:bg-navy-50 hover:text-navy-900 transition-colors duration-150"
                              >
                                {child.label}
                              </NavLink>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            )}
          </nav>

          {/* Action Buttons - Improved colors and spacing */}
          <div className="hidden lg:flex items-center gap-2">
            <Link
              to="/submit-paper"
              className="inline-flex items-center bg-navy-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-navy-800 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Submit Paper
            </Link>
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 bg-gold-500 text-navy-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gold-400 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Lock size={14} />
              Admin
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 -mr-2 text-navy-900 hover:bg-navy-50 rounded-lg transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden border-t border-stone-200 bg-white"
          >
            <div className="px-4 py-3 space-y-0.5">
              {headerItems.map((item) => (
                <div key={item._id} className="border-b border-stone-100 last:border-0">
                  <NavLink
                    to={item.path || '/'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `block py-2.5 text-sm font-medium ${
                        isActive ? 'text-navy-900' : 'text-ink-700'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                  {item.children.length > 0 && (
                    <div className="pl-4 pb-2 flex flex-col gap-0.5">
                      {item.children
                        .sort((a, b) => a.order - b.order)
                        .map((child) => (
                          <NavLink
                            key={child._id}
                            to={child.path}
                            onClick={() => setMobileOpen(false)}
                            className="block py-1.5 text-sm text-ink-500 hover:text-navy-900"
                          >
                            {child.label}
                          </NavLink>
                        ))}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Mobile Action Buttons */}
              <div className="pt-3 space-y-2">
                <Link
                  to="/submit-paper"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center bg-navy-900 text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-navy-800 transition-colors"
                >
                  Submit Paper
                </Link>
                <Link
                  to="/admin/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-1.5 w-full bg-gold-500 text-navy-900 px-5 py-3 rounded-lg text-sm font-semibold hover:bg-gold-400 transition-colors"
                >
                  <Lock size={14} /> Admin Login
                </Link>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}