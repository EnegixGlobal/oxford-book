'use client';

import { motion } from 'framer-motion';
import HeroSection from '@/components/home/HeroSection';
import FeaturedCategories from '@/components/home/FeaturedCategories';
import BestSellers from '@/components/home/BestSellers';
import BookCarousel from '@/components/home/BookCarousel';
import MostAnticipatedBooks from '@/components/home/MostAnticipatedBooks';
import FeaturedAuthors from '@/components/home/FeaturedAuthors';
import ShopByAge from '@/components/home/ShopByAge';
import ShopGenre from '@/components/home/ShopGenre';
import WhatsAppButton from '@/components/common/WhatsAppButton';
import NavigationMenu from '@/components/layout/NavigationMenu';

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100"
    >
      <div className="hidden md:block">
        <NavigationMenu />
      </div>
      <HeroSection />
      {/* <FeaturedCategories /> */}
      <BookCarousel />
      <BestSellers />
      <MostAnticipatedBooks />
      <ShopGenre />
      <ShopByAge />
    
      <FeaturedAuthors />
      <WhatsAppButton />
    </motion.div>
  );
}