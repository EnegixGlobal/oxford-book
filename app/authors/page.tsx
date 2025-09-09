"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { AdminPagination } from '@/components/ui/admin-pagination';

interface AuthorDto {
  _id?: string;
  name: string;
  slug: string;
  nationality?: string;
  biography?: string;
  profileImage?: string;
  booksCount?: number;
}

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<AuthorDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');

  const fetchAuthors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '12' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/authors?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (json?.success) {
        setAuthors(json.data || []);
        setTotalPages(json.pagination?.totalPages || 1);
        setTotalItems(json.pagination?.totalItems || 0);
      }
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAuthors(); }, [page, search]);

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">All Authors</h1>
          <div className="w-full max-w-sm">
            <Input
              placeholder="Search authors..."
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            />
          </div>
        </div>

        {loading && <p>Loading...</p>}

        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {authors.map((author, index) => (
              <motion.div
                key={author._id || author.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.03 }}
                className="group text-center"
              >
                <Link href={`/author/${author.slug}`} className="block">
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden shadow-lg mb-3">
                    <Image
                      src={author.profileImage || '/logo.png'}
                      alt={author.name}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-base font-semibold">{author.name}</h3>
                  <p className="text-xs text-gray-600 truncate">{author.nationality || ''}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={12}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </div>
    </section>
  );
}
