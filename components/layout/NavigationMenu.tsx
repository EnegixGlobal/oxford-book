'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface SubcategoryDto {
  _id?: string;
  name: string;
  slug: string;
}

interface CategoryDto {
  _id?: string;
  name: string;
  slug: string;
  subcategories?: SubcategoryDto[];
}

interface NavigationMenuProps {
  mobile?: boolean;
}

const NavigationMenu = ({ mobile = false }: NavigationMenuProps) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/categories?featured=false', { cache: 'no-store' });
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          if (isMounted) setCategories(json.data);
        }
      } catch (e) {
        // noop for nav
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleCategory = (slug: string) => {
    setOpenCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slug)) {
        newSet.delete(slug);
      } else {
        newSet.add(slug);
      }
      return newSet;
    });
  };

  const allSubcategories = categories.flatMap(cat => (cat.subcategories || []).map(s => ({ name: s.name, slug: s.slug })));

  if (mobile) {
    return (
      <div className="p-4 space-y-4">
        {categories.map((category) => {
          const isOpen = openCategories.has(category.slug);
          const subcats = category.slug === 'fiction' ? allSubcategories : (category.subcategories || []).map(s => ({ name: s.name, slug: s.slug }));
          return (
            <div key={category.slug}>
              <div
                onClick={() => toggleCategory(category.slug)}
                className="flex items-center justify-between py-2 text-gray-700 hover:text-purple-600 transition-colors cursor-pointer"
              >
                <Link href={`/category/${category.slug}`} className="flex-1">
                  {category.name}
                </Link>
                {subcats && subcats.length > 0 && (
                  <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                )}
              </div>
              {isOpen && subcats && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="ml-4 mt-2 space-y-1 overflow-hidden"
                >
          {subcats.map((sub) => (
                    <Link
            key={sub.slug}
            href={`/category/${category.slug}/${sub.slug}`}
                      className="block py-1 text-sm text-gray-600 hover:text-purple-600"
                    >
            {sub.name}
                    </Link>
                  ))}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <nav className="flex justify-center space-x-8">
    {categories.map((category) => (
        <div
          key={category.slug}
          className="relative"
          onMouseEnter={() => setHoveredCategory(category.slug)}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          <Link
            href={`/category/${category.slug}`}
            className="flex items-center space-x-1 py-2 text-gray-700 hover:text-purple-600 transition-colors"
          >
            <span>{category.name}</span>
      {category.subcategories && category.subcategories.length > 0 && <ChevronDown className="w-4 h-4" />}
          </Link>

          {/* Dropdown Menu */}
          <AnimatePresence>
      {hoveredCategory === category.slug && category.subcategories && category.subcategories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50"
              >
        {category.subcategories.map((subcategory) => (
                  <Link
          key={subcategory._id || subcategory.slug}
          href={`/category/${category.slug}/${subcategory.slug}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                  >
          {subcategory.name}
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </nav>
  );
};

export default NavigationMenu;