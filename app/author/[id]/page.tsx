'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Book, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import BookCard from '@/components/books/BookCard';

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

        {/* Author Header */}
        {!!author && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg p-8 mb-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-1">
                <Image
                  src={author.profileImage || '/logo.png'}
                  alt={author.name}
                  width={600}
                  height={800}
                  className="w-full max-w-sm mx-auto rounded-2xl shadow-xl h-auto object-cover"
                  priority
                />
              </div>
              
              <div className="lg:col-span-2">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{author.name}</h1>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">{author.biography || ''}</p>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <Book className="w-5 h-5 text-purple-600 mr-2" />
                    <span className="text-lg font-semibold text-gray-800">
                      {author.booksCount || 0} Books Published
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-400 mr-2" />
                    <span className="text-lg font-semibold text-gray-800">
                      4.6 Average Rating
                    </span>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Books by {author.name}</h2>
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