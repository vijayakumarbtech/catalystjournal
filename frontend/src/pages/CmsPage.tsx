import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useCmsPage } from '@/lib/queries';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { LineSkeleton } from '@/components/common/Skeleton';

const META_TAG_ID = 'cms-page-meta-description';

// The Submission Guidelines landing page cross-links to its three child
// policy pages so a visitor landing here directly still finds them.
const SUBMISSION_GUIDELINES_CHILDREN = [
  { label: 'Open Access Statement & Licensing', to: '/open-access-statement' },
  { label: 'Peer Review Policy', to: '/peer-review-policy' },
  { label: 'Publication Ethics & Malpractice Statement', to: '/publication-ethics' },
];

// Renders any admin-managed static page by slug: submission-guidelines,
// open-access-statement, peer-review-policy, publication-ethics, guidelines.
export default function CmsPage({ slug, title }: { slug: string; title: string }) {
  const { data: page, isLoading, isError } = useCmsPage(slug);

  useEffect(() => {
    document.title = `${title} — The Catalyst`;
  }, [title]);

  // Basic on-page SEO: keep a single <meta name="description"> tag in sync
  // with the admin-authored summary for this page.
  useEffect(() => {
    let tag = document.getElementById(META_TAG_ID) as HTMLMetaElement | null;
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = 'description';
      tag.id = META_TAG_ID;
      document.head.appendChild(tag);
    }
    tag.content = page?.metaDescription || `${title} — The Catalyst, a peer-reviewed international journal.`;

    return () => {
      tag?.remove();
    };
  }, [page?.metaDescription, title]);

  return (
    <>
      <Breadcrumbs items={[{ label: title }]} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8">{page?.title || title}</h1>
        {isLoading && (
          <div className="space-y-3">
            <LineSkeleton />
            <LineSkeleton />
            <LineSkeleton width="w-3/4" />
          </div>
        )}
        {isError && (
          <p className="text-ink-500">This page hasn't been published yet. Please check back soon.</p>
        )}
        {page && (
          <div
            className="prose prose-navy max-w-none prose-headings:font-display prose-headings:text-navy-900 prose-a:text-navy-700"
            dangerouslySetInnerHTML={{ __html: page.contentHtml }}
          />
        )}

        {slug === 'submission-guidelines' && (
          <div className="mt-10 pt-8 border-t border-stone-200">
            <h2 className="font-label text-sm uppercase tracking-wide text-ink-500 mb-4">
              Read Next
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {SUBMISSION_GUIDELINES_CHILDREN.map((child) => (
                <Link
                  key={child.to}
                  to={child.to}
                  className="group flex items-center justify-between gap-2 bg-paper-dim border border-stone-200 rounded-lg px-4 py-3 hover:border-navy-300 transition-colors"
                >
                  <span className="text-sm font-medium text-navy-900">{child.label}</span>
                  <ArrowRight size={16} className="text-ink-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
