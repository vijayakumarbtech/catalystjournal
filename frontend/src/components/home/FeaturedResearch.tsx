import { useFeaturedArticles } from '@/lib/queries';
import SectionHeading from '../common/SectionHeading';
import PaperCard from '../common/PaperCard';
import { CardSkeleton } from '../common/Skeleton';

export default function FeaturedResearch() {
  const { data: articles, isLoading } = useFeaturedArticles();

  return (
    <section className="py-20 bg-paper-dim">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Featured Research"
          title="Recently Published Papers"
          description="A selection of noteworthy contributions from our latest issues."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
            : articles?.map((a) => <PaperCard key={a._id} article={a} />)}
        </div>
      </div>
    </section>
  );
}
