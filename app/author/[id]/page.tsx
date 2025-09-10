'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Book, Star, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import BookCard from '@/components/books/BookCard';
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

export default function AuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [author, setAuthor] = useState<AuthorDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [authorBooks, setAuthorBooks] = useState<any[]>([]);
  const [expandBio, setExpandBio] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/authors/${id}`, { cache: 'no-store' });
        const json = await res.json();
        if (json?.success) {
          if (isMounted) setAuthor(json.data);
          const slug = json.data?.slug || id;
          // fetch books by this author via public API
          const bres = await fetch(`/api/books?authorSlug=${encodeURIComponent(slug)}&limit=24`, { cache: 'no-store' });
          const bj = await bres.json();
          if (bj?.success && Array.isArray(bj.data)) {
            // Map backend book shape to BookCard expected fields where needed
            const mapped = bj.data.map((b: any) => ({
              id: b._id || b.id,
              slug: b.slug,
              title: b.title,
              isbn: b.isbn,
              author: b.authorName || b.author,
              publisher: b.publisher || '',
              binding: (b.binding || 'paperback').toString(),
              weight: '',
              language: b.language || 'english',
              description: b.description || '',
              mrp: b.mrp,
              discountedPrice: b.discountedPrice,
              rating: b.rating || 0,
              reviewCount: b.reviewCount || 0,
              category: b.categorySlug,
              subcategory: b.subcategorySlug,
              ageGroup: '',
              coverImage: b.coverImage || '/logo.png',
              inStock: b.inStock,
              featured: !!b.featured,
            }));
            if (isMounted) setAuthorBooks(mapped);
          } else if (Array.isArray(bj)) {
            if (isMounted) setAuthorBooks(bj as any[]);
          }
        }
      } catch (e) {
        if (isMounted) setAuthor(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [id]);

  if (!author && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Author Not Found</h1>
          <Link href="/authors">
            <Button>Back to Authors</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link href="/authors">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Authors
          </Button>
        </Link>

        {/* Author Hero */}
        {!!author && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-2xl mb-10"
          >
            {/* Blurred background */}
            <div className="absolute inset-0 -z-10">
              <Image
                src={author.profileImage || '/logo.png'}
                alt=""
                fill
                priority
                className="object-cover blur-[14px] scale-[1.1] opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/90 to-white/70" />
            </div>

            <div className="p-6 md:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 items-center">
                {/* Avatar */}
                <div className="justify-self-center lg:justify-self-start">
                  <div className="relative w-52 h-64 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white">
                    <Image
                      src={author.profileImage || '/logo.png'}
                      alt={author.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="">
                  <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-3">
                    {author.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mb-5">
                    {author.nationality && (
                      <Badge variant="secondary" className="text-sm">{author.nationality}</Badge>
                    )}
                    <div className="flex items-center gap-2">
                      <Book className="w-5 h-5 text-fuchsia-600" />
                      <span className="text-sm md:text-base font-semibold text-gray-800">
                        {author.booksCount || 0} Books Published
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-400" />
                      <span className="text-sm md:text-base font-semibold text-gray-800">4.6 Avg Rating</span>
                    </div>
                  </div>

                  {author.biography && (
                    <motion.div layout className="relative text-gray-700 leading-relaxed">
                      <p className={`${expandBio ? '' : 'line-clamp-6'} text-base md:text-lg whitespace-pre-line`}>{author.biography}</p>
                      {!expandBio && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
                      )}
                      {author.biography.length > 240 && (
                        <button
                          type="button"
                          onClick={() => setExpandBio((v) => !v)}
                          className="mt-3 inline-flex items-center gap-1.5 text-fuchsia-700 font-semibold hover:underline"
                        >
                          {expandBio ? (
                            <>
                              Read less <ChevronUp className="w-4 h-4" />
                            </>
                          ) : (
                            <>
                              Read more <ChevronDown className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      )}
                    </motion.div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="#author-books">
                      <Button className="bg-fuchsia-700 hover:bg-fuchsia-800">View Books</Button>
                    </Link>
                    <Link href="/authors">
                      <Button variant="outline">Back to Authors</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Author's Books */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {!!author && (
            <h2 id="author-books" className="text-3xl font-bold text-gray-900 mb-8">Books by {author.name}</h2>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {authorBooks.map((book, index) => (
              <motion.div
                key={book._id || book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <BookCard book={book} />
              </motion.div>
            ))}
          </div>

          {authorBooks.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No books available from this author yet.</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}