'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Book, Users, Grid, ShoppingCart, MessageSquare, Home, User, Star, Flame, Zap, Tags, Layers, Images, ListOrdered, LayoutGrid } from 'lucide-react';

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: Home
  },
  {
    title: 'Books',
    href: '/admin/books',
    icon: Book
  },
  {
    title: 'Authors',
    href: '/admin/authors',
    icon: Users
  },
  {
    title: 'Genres',
    href: '/admin/genres',
    icon: Tags
  },
  {
    title: 'Age Groups',
    href: '/admin/age-groups',
    icon: Layers
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: User
  },
  {
    title: 'Carousel',
    href: '/admin/carousel',
    icon: Star
  },
  {
    title: 'Hero Slider',
    href: '/admin/hero-slides',
    icon: Images
  },
  {
    title: 'Bestseller',
    href: '/admin/bestseller',
    icon: Flame
  },
  {
    title: 'New Releases',
    href: '/admin/new-releases',
    icon: Zap
  },
  {
    title: 'Book Lists',
    href: '/admin/booklists',
    icon: ListOrdered
  },
  {
    title: 'Promo Banner',
    href: '/admin/promo-banner',
    icon: Images
  },
  {
    title: 'Small Banners',
    href: '/admin/small-banners',
    icon: LayoutGrid
  },
  {
    title: 'Categories',
    href: '/admin/categories',
    icon: Grid
  },
  {
    title: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart
  },
  {
    title: 'Reviews',
    href: '/admin/reviews',
    icon: MessageSquare
  }
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="h-screen w-64 bg-white border-r fixed left-0 top-0 flex flex-col p-4">
      <div className="flex items-center justify-center mb-8 flex-shrink-0">
        <h1 className="text-2xl font-bold text-purple-600">BookHaven</h1>
      </div>
      
      <nav className="space-y-2 overflow-y-auto flex-1">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-purple-50 text-purple-600"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
