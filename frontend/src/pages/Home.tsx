import { useEffect } from 'react';
import Hero from '@/components/home/Hero';
import StatsBar from '@/components/home/StatsBar';
import LatestIssue from '@/components/home/LatestIssue';
import FeaturedResearch from '@/components/home/FeaturedResearch';
import CallForPapersCTA from '@/components/home/CallForPapersCTA';
import LatestNewsPreview from '@/components/home/LatestNewsPreview';
import PublicationProcess from '@/components/home/PublicationProcess';
import WhyPublish from '@/components/home/WhyPublish';
import EditorialBoardPreview from '@/components/home/EditorialBoardPreview';
import FaqPreview from '@/components/home/FaqPreview';
import Reveal from '@/components/common/Reveal';
import { useSettings } from '@/lib/queries';

export default function Home() {
  const { data: settings } = useSettings();

  useEffect(() => {
    const name = settings?.journalName || 'The Catalyst';
    const tagline = settings?.tagline || 'International Journal of Multidisciplinary Research and Innovation';
    document.title = `${name} — ${tagline}`;
  }, [settings]);

  return (
    <>
      <Hero />
      <Reveal><StatsBar /></Reveal>
      <Reveal><LatestIssue /></Reveal>
      <Reveal><FeaturedResearch /></Reveal>
      <Reveal><CallForPapersCTA /></Reveal>
      <Reveal><LatestNewsPreview /></Reveal>
      <Reveal><PublicationProcess /></Reveal>
      <Reveal><WhyPublish /></Reveal>
      <Reveal><EditorialBoardPreview /></Reveal>
      <Reveal><FaqPreview /></Reveal>
    </>
  );
}
