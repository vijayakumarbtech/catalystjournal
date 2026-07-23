import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppWidget from './WhatsAppWidget';
import BackToTop from './BackToTop';
import ScrollToTop from './ScrollToTop';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <ScrollToTop />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] bg-navy-900 text-white px-4 py-2 rounded"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppWidget />
      <BackToTop />
    </div>
  );
}
