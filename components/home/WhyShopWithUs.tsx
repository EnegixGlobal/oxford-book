"use client";

import { ShieldCheck, Truck, RefreshCw, Sparkles, BookOpen, HeadphonesIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: ShieldCheck,
    title: 'Secure Checkout',
    desc: 'Protected payments & encrypted transactions for peace of mind.',
    gradient: 'from-purple-500/10 to-purple-500/5 border-purple-200'
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    desc: 'Swift dispatch & reliable tracking across major cities.',
    gradient: 'from-pink-500/10 to-pink-500/5 border-pink-200'
  },
  {
    icon: RefreshCw,
    title: 'Easy Returns',
    desc: 'Hassle‑free 7-day return policy on eligible books.',
    gradient: 'from-fuchsia-500/10 to-fuchsia-500/5 border-fuchsia-200'
  },
  {
    icon: Sparkles,
    title: 'Curated Picks',
    desc: 'Hand‑selected titles & collections loved by readers.',
    gradient: 'from-rose-500/10 to-rose-500/5 border-rose-200'
  },
  {
    icon: BookOpen,
    title: 'Authentic Editions',
    desc: 'Original prints sourced directly from trusted publishers.',
    gradient: 'from-indigo-500/10 to-indigo-500/5 border-indigo-200'
  },
  {
    icon: HeadphonesIcon,
    title: 'Reader Support',
    desc: 'Need a recommendation? We help you pick the right book.',
    gradient: 'from-amber-500/10 to-amber-500/5 border-amber-200'
  }
];

export default function WhyShopWithUs() {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.12),transparent_60%),radial-gradient(circle_at_80%_50%,rgba(236,72,153,0.12),transparent_65%)]" />
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600"
          >
            Why Shop With Us
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 max-w-2xl mx-auto text-base md:text-lg text-gray-600"
          >
            We’re more than an online bookstore – we’re your reading companion. Enjoy trusted service, fast fulfillment and thoughtful curation.
          </motion.p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, delay: i * 0.05 }}
              className={`group relative overflow-hidden rounded-2xl border bg-white/70 backdrop-blur shadow-md hover:shadow-lg transition-shadow p-6 ${f.gradient}`}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-white/0 via-white/30 to-white/0 pointer-events-none" />
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 text-white flex items-center justify-center shadow-md ring-1 ring-white/40">
                  <f.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              </div>
              <div className="mt-5">
                <div className="h-1 w-16 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 rounded-full group-hover:w-24 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
