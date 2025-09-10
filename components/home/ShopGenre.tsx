'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

const genres = [
  { name: 'Biography & Memoir', description: 'Inspiring life stories', iconPath: '/genre/Biography_Memoir.png', slug: 'biography-memoir' },
  { name: 'Business', description: 'Professional insights', iconPath: '/genre/business-image.avif', slug: 'business' },
  { name: 'Historic Fiction', description: 'Stories from the past', iconPath: '/genre/Hostoric-fiction.avif', slug: 'historic-fiction' },
  { name: 'Mega Comic', description: 'Epic comic adventures', iconPath: '/genre/Mega-comic.avif', slug: 'mega-comic' },
  { name: 'Mystery Thriller', description: 'Suspenseful reads', iconPath: '/genre/mistry thrileer.avif', slug: 'mystery-thriller' },
  { name: 'Occult & Paranormal', description: 'Supernatural mysteries', iconPath: '/genre/Occult_Paranomol-10.webp', slug: 'occult-paranormal' },
  { name: 'Romance', description: 'Love stories', iconPath: '/genre/romance image.png', slug: 'romance' },
  { name: 'Self', description: 'Personal growth', iconPath: '/genre/self-help.avif', slug: 'self' },
];

const ShopGenre = () => {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const results = await Promise.all(
          genres.map(async (g) => {
            try {
              const res = await fetch(`/api/books?genre=${encodeURIComponent(g.slug)}&limit=1`, { cache: 'no-store' });
              const json = await res.json();
              const total = json?.pagination?.totalItems ?? 0;
              return { slug: g.slug, total: Number(total) || 0 };
            } catch {
              return { slug: g.slug, total: 0 };
            }
          })
        );
        if (!alive) return;
        const map: Record<string, number> = {};
        results.forEach((r) => { map[r.slug] = r.total; });
        setCounts(map);
      } catch {}
    };
    load();
    return () => { alive = false; };
  }, []);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop By <span className="text-fuchsia-600">Genre</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover books across various genres
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {genres.map((genre, index) => (
            <motion.div
              key={genre.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Link href={`/genre/${genre.slug}`}>
                <div className="group text-center hover:scale-105 transition-transform duration-300 bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg">
                  <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                    <Image
                      src={genre.iconPath}
                      alt={genre.name}
                      width={96}
                      height={106}
                      className="group-hover:scale-125 transition-transform duration-300 ease-in-out object-cover rounded"
                    />
                  </div>
                </div>
                <div className="text-center mt-2">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {genre.name}
                  </h3>
                  <p className="text-sm text-gray-600">{genre.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{counts[genre.slug] ?? 0} books</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopGenre;