import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Download, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { LineSkeleton } from '@/components/common/Skeleton';
import type { ApiResponse } from '@/types';

type GuidelineDocument = {
  _id: string;
  documentName: string;
  fileType: string;
  fileUrl: string;
  extractedHtml: string;
  isActive: boolean;
  uploadedAt: string;
};

const SUBMISSION_GUIDELINES_CHILDREN = [
  { label: 'Open Access Statement & Licensing', to: '/open-access-statement' },
  { label: 'Peer Review Policy', to: '/peer-review-policy' },
  { label: 'Publication Ethics & Malpractice Statement', to: '/publication-ethics' },
];

export default function SubmissionGuidelines() {
  const { data: guidelineDoc, isLoading, isError } = useQuery({
    queryKey: ['guideline-documents', 'active'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<GuidelineDocument>>('/guideline-documents/active');
      return data.data;
    },
  });

  useEffect(() => {
    document.title = 'Submission Guidelines — The Catalyst';
  }, []);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Submission Guidelines' }]} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8">Submission Guidelines</h1>
        
        {isLoading && (
          <div className="space-y-3">
            <LineSkeleton />
            <LineSkeleton />
            <LineSkeleton width="w-3/4" />
          </div>
        )}
        
        {isError && (
          <p className="text-ink-500">Submission guidelines are not available at this time. Please check back later.</p>
        )}
        
        {guidelineDoc && (
          <div>
            {guidelineDoc.extractedHtml ? (
              <div
                className="prose prose-navy max-w-none prose-headings:font-display prose-headings:text-navy-900 prose-a:text-navy-700"
                dangerouslySetInnerHTML={{ __html: guidelineDoc.extractedHtml }}
              />
            ) : (
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-8 text-center my-8">
                <FileText size={48} className="mx-auto text-ink-300 mb-4" />
                <h3 className="text-lg font-semibold text-navy-900 mb-2">Guidelines Document</h3>
                <p className="text-ink-600 mb-6 max-w-md mx-auto">
                  The submission guidelines are provided as a downloadable document.
                  Please review them before submitting your manuscript.
                </p>
                <a
                  href={guidelineDoc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center gap-2 bg-navy-900 text-white px-6 py-3 rounded-lg hover:bg-navy-800 transition-colors shadow-sm"
                >
                  <Download size={18} />
                  Download Original Document
                </a>
              </div>
            )}
          </div>
        )}

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
      </div>
    </>
  );
}
