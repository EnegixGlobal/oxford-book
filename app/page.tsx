'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import HeroSection from '@/components/home/HeroSection';
import FeaturedCategories from '@/components/home/FeaturedCategories';
import BestSellers from '@/components/home/BestSellers';
import FouthComing from '@/components/home/FouthComing';
import BookCarousel from '@/components/home/BookCarousel';
import MostAnticipatedBooks from '@/components/home/MostAnticipatedBooks';
import FeaturedAuthors from '@/components/home/FeaturedAuthors';
import GoogleReviews from '@/components/home/GoogleReviews';
import ShopByAge from '@/components/home/ShopByAge';
import ShopGenre from '@/components/home/ShopGenre';
import WhatsAppButton from '@/components/common/WhatsAppButton';
import NavigationMenu from '@/components/layout/NavigationMenu';
import WhyShopWithUs from '@/components/home/WhyShopWithUs';
import NewReleases from '@/components/home/NewReleases';
import DynamicBookList from '@/components/home/DynamicBookList';
import PromoBanner from '@/components/home/PromoBanner';
import SmallBanners from '@/components/home/SmallBanners';
import DynamicHomeSections from '@/components/home/DynamicHomeSections';

export default function Home() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const halfwayPoint = scrollHeight / 2;

      setShowScrollTop(scrollTop > halfwayPoint);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-screen bg-gradient-to-br from-purple-50 to-purple-100"
    >
      <div className="hidden md:block">
        <NavigationMenu />
      </div>
      <HeroSection />
     <FeaturedCategories />
      {/* <BookCarousel /> */}
      {/* <ShopGenre /> */}
      <NewReleases />
      <DynamicBookList />
      <PromoBanner />
      <BestSellers />
      <SmallBanners />
      <FouthComing />
      <DynamicHomeSections />
      {/* <MostAnticipatedBooks /> */}

      {/* <ShopByAge /> */}
      <FeaturedAuthors />
      <GoogleReviews />
      <WhyShopWithUs />
      <WhatsAppButton />

      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-20 right-8 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg shadow-purple-400/40 transition hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-purple-50"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
    </motion.div>
  );
}