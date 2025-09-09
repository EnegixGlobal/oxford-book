'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

const ageGroups = [
  {
    name: '0-2',
    description: 'Babies & Toddlers',
    iconPath: '/icons/baby-boy.png',
  slug: '0-2'
  },
  {
    name: '3-5',
    description: 'Preschool',
    iconPath: '/icons/boy.png',
  slug: '3-5'
  },
  {
    name: '6-8',
    description: 'Early Elementary',
    iconPath: '/icons/student.png',
  slug: '6-8'
  },
  {
    name: '9-12',
    description: 'Pre-Teen',
    iconPath: '/icons/teen.png',
  slug: '9-12'
  },
  {
  name: 'teen',
    description: 'Teen',
    iconPath: '/icons/teenage.png',
    slug: 'teen'
  },
  {
  name: 'young-adult',
    description: 'Young Adult',
    iconPath: '/icons/strong.png',
    slug: 'young-adult'
  },
  {
  name: 'old-man',
    description: 'Old Man',
    iconPath: '/icons/tax-inspector.png',
    slug: 'old-man'
  }
];

const ShopByAge = () => {
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
            Shop By <span className="text-fuchsia-600">Age</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Meet the brilliant minds behind your favorite books
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
          {ageGroups.map((group, index) => {
            return (
              <motion.div
                key={group.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link href={`/age/${group.slug}`}>
                  <div className="group text-center hover:scale-105 transition-transform duration-300">
                    <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Image
                        src={group.iconPath}
                        alt={group.name}
                        width={60}
                        height={60}
                        className="group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {group.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {group.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ShopByAge;