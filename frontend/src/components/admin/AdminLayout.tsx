import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Users,
  BookOpen,
  Archive,
  Newspaper,
  HelpCircle,
  Settings,
  LogOut,
  Mail,
  CreditCard,
  Image as ImageIcon,
  Menu as MenuIcon,
  X,
  Shield,
  Megaphone,
  PenTool,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/submissions', label: 'Submissions', icon: FileText },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/issues', label: 'Issues & Volumes', icon: Archive },
  { to: '/admin/articles', label: 'Articles', icon: BookOpen },
  { to: '/admin/editorial-board', label: 'Editorial Board', icon: Users },
  { to: '/admin/pages', label: 'Pages (CMS)', icon: FileText },
  { to: '/admin/hero', label: 'Hero (CMS)', icon: ImageIcon },
  { to: '/admin/cfps', label: 'Call for Papers', icon: Megaphone },
  { to: '/admin/form-fields', label: 'Form CMS', icon: PenTool },
  { to: '/admin/navigation', label: 'Navigation', icon: MenuIcon },
  { to: '/admin/news', label: 'News', icon: Newspaper },
  { to: '/admin/faqs', label: 'FAQs', icon: HelpCircle },
  { to: '/admin/contacts', label: 'Contact Messages', icon: Mail },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/credentials', label: 'Account Security', icon: Shield },
];

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  const sidebarContent = (
    <>
      <div className="px-5 py-6 border-b border-navy-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-navy-900 border-2 border-gold-500 flex items-center justify-center shrink-0">
            <span className="font-display text-gold-400 font-bold text-sm">C</span>
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm">The Catalyst</div>
            <div className="text-[10px] uppercase tracking-wide text-stone-500">Admin Panel</div>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-stone-400 hover:text-white p-1"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-navy-800 text-white border-r-2 border-gold-500'
                  : 'hover:bg-navy-900 hover:text-white'
              }`
            }
          >
            <item.icon size={17} /> {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-navy-800">
        <div className="text-xs text-stone-500 mb-3 px-1 truncate">{admin?.email}</div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-stone-300 hover:text-white w-full px-1"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-paper-dim flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-navy-950 text-stone-300 flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-16 bg-navy-950 text-white flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-navy-900 border-2 border-gold-500 flex items-center justify-center">
            <span className="font-display text-gold-400 font-bold text-xs">C</span>
          </div>
          <span className="font-display font-bold text-sm">Admin Panel</span>
        </div>
        <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="p-1.5">
          <MenuIcon size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key={`overlay-${location.pathname}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="lg:hidden fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-navy-950 text-stone-300 flex flex-col z-50 shadow-lifted"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 min-w-0 pt-16 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
