import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminAuthProvider } from '@/context/AdminAuthContext';
import PublicLayout from '@/components/layout/PublicLayout';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import PageLoader from '@/components/common/PageLoader';
import FaviconSync from '@/components/common/FaviconSync';

import Home from '@/pages/Home';
import CmsPage from '@/pages/CmsPage';
const EditorialBoard = lazy(() => import('@/pages/EditorialBoard'));
const CurrentIssue = lazy(() => import('@/pages/CurrentIssue'));
const Archives = lazy(() => import('@/pages/Archives'));
const IssueDetail = lazy(() => import('@/pages/IssueDetail'));
const ArticleDetail = lazy(() => import('@/pages/ArticleDetail'));
const CallForPapers = lazy(() => import('@/pages/CallForPapers'));
const SubmissionGuidelines = lazy(() => import('@/pages/SubmissionGuidelines'));
const Faq = lazy(() => import('@/pages/Faq'));
const Contact = lazy(() => import('@/pages/Contact'));
const SubmitPaper = lazy(() => import('@/pages/SubmitPaper'));
const Payment = lazy(() => import('@/pages/Payment'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// News — public list and detail
const NewsListPage = lazy(() =>
  import('@/pages/News').then((m) => ({ default: m.NewsList }))
);
const NewsDetailPage = lazy(() =>
  import('@/pages/News').then((m) => ({ default: m.NewsDetail }))
);

const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminSubmissions = lazy(() => import('@/pages/admin/AdminSubmissions'));
const AdminPayments = lazy(() => import('@/pages/admin/AdminPayments'));
const AdminIssues = lazy(() => import('@/pages/admin/AdminIssues'));
const AdminArticles = lazy(() => import('@/pages/admin/AdminArticles'));
const AdminEditorialBoard = lazy(() => import('@/pages/admin/AdminEditorialBoard'));
const AdminSubmissionGuidelines = lazy(() => import('@/pages/admin/AdminSubmissionGuidelines'));
const AdminPages = lazy(() => import('@/pages/admin/AdminPages'));
const AdminNews = lazy(() => import('@/pages/admin/AdminNews'));
const AdminFaqs = lazy(() => import('@/pages/admin/AdminFaqs'));
const AdminContacts = lazy(() => import('@/pages/admin/AdminContacts'));
const AdminNavigation = lazy(() => import('@/pages/admin/AdminNavigation'));
const AdminHero = lazy(() => import('@/pages/admin/AdminHero'));
const AdminCallForPapers = lazy(() => import('@/pages/admin/AdminCallForPapers'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminCredentials = lazy(() => import('@/pages/admin/AdminCredentials'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <FaviconSync />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public site */}
              <Route element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route
                  path="submission-guidelines"
                  element={<SubmissionGuidelines />}
                />
                <Route
                  path="open-access-statement"
                  element={<CmsPage slug="open-access-statement" title="Open Access Statement & Licensing" />}
                />
                <Route
                  path="peer-review-policy"
                  element={<CmsPage slug="peer-review-policy" title="Peer Review Policy" />}
                />
                <Route
                  path="publication-ethics"
                  element={<CmsPage slug="publication-ethics" title="Publication Ethics & Malpractice Statement" />}
                />
                <Route path="guidelines" element={<CmsPage slug="guidelines" title="Author Guidelines" />} />
                <Route path="editorial-board" element={<EditorialBoard />} />
                <Route path="current-issue" element={<CurrentIssue />} />
                <Route path="archives" element={<Archives />} />
                <Route path="archives/:id" element={<IssueDetail />} />
                <Route path="articles/:slug" element={<ArticleDetail />} />
                <Route path="call-for-papers" element={<CallForPapers />} />
                {/* News — public pages (list + detail) */}
                <Route path="news" element={<NewsListPage />} />
                <Route path="news/:slug" element={<NewsDetailPage />} />
                <Route path="faq" element={<Faq />} />
                <Route path="contact" element={<Contact />} />
                <Route path="submit-paper" element={<SubmitPaper />} />
                <Route path="submit-paper/payment/:submissionId" element={<Payment />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Admin */}
              <Route path="admin/login" element={<AdminLogin />} />
              <Route
                path="admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="submissions" element={<AdminSubmissions />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="issues" element={<AdminIssues />} />
                <Route path="articles" element={<AdminArticles />} />
                <Route path="editorial-board" element={<AdminEditorialBoard />} />
                <Route path="submission-guidelines" element={<AdminSubmissionGuidelines />} />
                <Route path="pages" element={<AdminPages />} />
                <Route path="news" element={<AdminNews />} />
                <Route path="hero" element={<AdminHero />} />
                <Route path="cfps" element={<AdminCallForPapers />} />
                <Route path="faqs" element={<AdminFaqs />} />
                <Route path="contacts" element={<AdminContacts />} />
                <Route path="navigation" element={<AdminNavigation />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="credentials" element={<AdminCredentials />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}
