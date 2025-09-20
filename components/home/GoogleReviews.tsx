"use client";
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

const mockReviews: Review[] = [
  {
    id: '1',
    name: 'Amit Verma',
    rating: 5,
    comment: 'Fantastic selection and very quick delivery. Found rare titles easily!',
    date: 'Aug 2025'
  },
  {
    id: '2',
    name: 'Priya Sharma',
    rating: 5,
    comment: 'Clean UI, smooth checkout, and genuine editions. Highly recommended.',
    date: 'Aug 2025'
  },
  {
    id: '3',
    name: 'Rahul Mehta',
    rating: 4,
    comment: 'Great prices and packaging. Would love to see faster restocks.',
    date: 'Jul 2025'
  },
  {
    id: '4',
    name: 'Sneha Kapoor',
    rating: 5,
    comment: 'Customer support helped me instantly. Books arrived in mint condition!',
    date: 'Jul 2025'
  }
];

export default function GoogleReviews() {
  return (
    <section className="py-16 bg-gradient-to-b from-white via-purple-50/40 to-purple-100/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            What Readers Say on <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600">Google</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Trusted by book lovers across India. Real feedback from real customers.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockReviews.map((r, idx) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              className="bg-white/80 backdrop-blur rounded-xl p-5 shadow-sm hover:shadow-md border border-purple-100/60 transition"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white flex items-center justify-center text-sm font-semibold">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{r.name}</p>
                  <p className="text-[11px] text-gray-500">{r.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-5">{r.comment}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow border">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-gray-800">4.8 / 5 Average Rating</span>
          </div>
          <a
            href="https://www.google.com/maps/search/?api=1&query=bookstore"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:opacity-90"
          >
            View more reviews on Google →
          </a>
        </div>
      </div>
    </section>
  );
}
