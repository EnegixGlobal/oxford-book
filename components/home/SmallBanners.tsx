"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface BannerData {
  image: string;
  text: string;
  link: string;
}

const SmallBanners = () => {
  const [banners, setBanners] = useState<BannerData[]>([]);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const res = await fetch("/api/small-banners", { cache: "no-store" });
        const data = await res.json();
        if (data?.success && data.data) {
          setBanners(data.data);
        }
      } catch (error) {
        console.error("Failed to load small banners:", error);
      }
    };
    loadBanners();
  }, []);

  if (banners.length === 0) return null;

  return (
    <section className="py-12 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {banners.map((banner, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={banner.link}>
                <div className="flex flex-col sm:flex-row bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer py-3 px-3">
                  {/* Left: Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={banner.image}
                      alt={banner.text}
                      className="w-full sm:w-[200px] md:w-[300px] h-[120px] sm:h-[146px] object-cover"
                    />
                  </div>
                  {/* Right: Text */}
                  <div className="flex items-center justify-center p-3 sm:p-4 flex-1">
                    <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 text-center">
                      {banner.text}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SmallBanners;

