"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { AdminPagination } from '@/components/ui/admin-pagination';
import { Search, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-fuchsia-200/60 via-pink-200/50 to-purple-200/60" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 relative">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-3 py-1 text-fuchsia-700 font-semibold shadow-sm mb-4">
              <Sparkles className="w-4 h-4" />
              <span>All Authors</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Meet the Authors You Love</h1>
            <p className="mt-3 text-lg md:text-xl text-gray-700 max-w-2xl">Discover their works, explore nationalities, and find new favorites.</p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm border border-gray-100 -mt-8 mb-8"
        >
          <div className="text-gray-700"><span className="font-semibold text-gray-900">{totalItems}</span> authors</div>
          <div className="w-full max-w-sm relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search authors..."
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              className="pl-9"
            />
          </div>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mx-auto w-32 h-32 rounded-full bg-gray-200 animate-pulse" />
                <div className="mt-3 h-4 w-3/4 mx-auto rounded bg-gray-200 animate-pulse" />
                <div className="mt-2 h-3 w-1/2 mx-auto rounded bg-gray-200 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {authors.map((author, index) => (
              <motion.div
                key={author._id || author.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.3) }}
                className="group"
              >
                <Link href={`/author/${author.slug}`} className="block">
                  <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                    <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden ring-4 ring-white shadow-md">
                      <Image
                        src={author.profileImage || '/logo.png'}
                        alt={author.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h3 className="mt-3 text-center text-base font-semibold text-gray-900 group-hover:text-fuchsia-700 transition-colors">
                      {author.name}
                    </h3>
                    <div className="mt-1 text-center text-xs text-gray-600 truncate">{author.nationality || '—'}</div>
                    {!!author.booksCount && (
                      <div className="mt-2 text-center">
                        <Badge variant="secondary" className="text-[11px]">{author.booksCount} books</Badge>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && authors.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500">No authors found.</p>
          </div>
        )}

        {/* Pagination */}
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
    </motion.div>
  );
}
