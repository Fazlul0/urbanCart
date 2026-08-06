import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import MiniHeader from '../components/layout/MiniHeader';
import Footer from '../components/layout/Footer';
import ScrollToTop from '../components/ui/ScrollToTop';
import WhatsAppFloat from '../components/ui/WhatsAppFloat';

const MainLayout = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <MiniHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
      <ScrollToTop />
    </div>
  );
};

export default MainLayout;
