import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle2, XCircle, CreditCard, Users, TrendingUp, Settings, BookOpen, Archive, Shield, Newspaper } from 'lucide-react';
import { api } from '@/lib/api';

interface DashboardStats {
  totalPapers: number;
  todaysSubmissions: number;
  pendingReview: number;
  accepted: number;
  rejected: number;
  totalPayments: number;
  visitorsToday: number;
}

function StatCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number | string; tone: string }) {
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${tone}`}>
        <Icon size={18} />
      </div>
      <div className="text-2xl font-bold text-navy-900">{value}</div>
      <div className="text-xs text-ink-500 mt-1">{label}</div>
    </div>
  );
}

const quickLinks = [
  { to: '/admin/submissions', label: 'View Submissions', icon: FileText, desc: 'Review and manage paper submissions' },
  { to: '/admin/issues', label: 'Publish Issue', icon: BookOpen, desc: 'Create or update journal issues; auto-archives the previous current issue' },
  { to: '/admin/news', label: 'Post News', icon: Newspaper, desc: 'Publish announcements and news updates' },
  { to: '/admin/pages', label: 'Edit Page Content', icon: Archive, desc: 'Update Submission Guidelines and policy pages' },
  { to: '/admin/settings', label: 'Website Settings', icon: Settings, desc: 'Logo, branding, hero images, contact info, payment methods' },
  { to: '/admin/navigation', label: 'Navigation', icon: TrendingUp, desc: 'Reorder and manage menu items' },
  { to: '/admin/credentials', label: 'Account Security', icon: Shield, desc: 'Change username, email, or password' },
];

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get<{ data: DashboardStats }>('/admin/dashboard/stats');
      return data.data;
    },
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-navy-900 mb-1">Dashboard</h1>
      <p className="text-sm text-ink-500 mb-8">Overview of journal activity and submissions.</p>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-lg p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard icon={FileText} label="Total Papers" value={stats?.totalPapers ?? 0} tone="bg-navy-100 text-navy-900" />
          <StatCard icon={Clock} label="Today's Submissions" value={stats?.todaysSubmissions ?? 0} tone="bg-gold-100 text-gold-600" />
          <StatCard icon={Clock} label="Pending Review" value={stats?.pendingReview ?? 0} tone="bg-amber-100 text-amber-700" />
          <StatCard icon={CheckCircle2} label="Accepted" value={stats?.accepted ?? 0} tone="bg-teal-100 text-teal-700" />
          <StatCard icon={XCircle} label="Rejected" value={stats?.rejected ?? 0} tone="bg-crimson-100 text-crimson-600" />
          <StatCard icon={CreditCard} label="Payments Received" value={stats?.totalPayments ?? 0} tone="bg-navy-100 text-navy-900" />
          <StatCard icon={Users} label="Visitors Today" value={stats?.visitorsToday ?? 0} tone="bg-teal-100 text-teal-700" />
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
          <TrendingUp size={18} /> Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="bg-white border border-stone-200 rounded-lg p-4 hover:shadow-card hover:border-navy-300 transition-all group"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <link.icon size={16} className="text-navy-900" />
                <span className="font-medium text-navy-900 text-sm group-hover:text-navy-700">{link.label}</span>
              </div>
              <p className="text-xs text-ink-500">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
