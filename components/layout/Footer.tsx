import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail, Globe } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Company Info */}
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-semibold mb-4 text-purple-300">Oxford Book House</h3>
            <p className="text-gray-400 mb-4 text-sm sm:text-base">
              Your literary paradise for discovering amazing books across all genres.
            </p>
            <div className="flex justify-center sm:justify-start space-x-4">
              <Link
                href="https://www.facebook.com/oxfordbookhouseofficial"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-purple-300 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </Link>

              <Link
                href="https://share.google/5moYVIlHsl0DVknAK"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-purple-300 transition-colors"
              >
                <Globe className="w-5 h-5" />
              </Link>

              <Link
                href="https://www.instagram.com/oxfordbookhouse.in?igsh=eWdmdXJlNWtnbHp5"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-purple-300 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </Link>

              <Link
                href="mailto:info@oxfordbookhouse.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-purple-300 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </Link>
            </div>

          </div>

          {/* Quick Links */}
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-semibold mb-4 text-purple-300">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/category/fiction" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Fiction</Link></li>
              <li><Link href="/category/non-fiction" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Non-Fiction</Link></li>
              <li><Link href="/category/children" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Children&apos;s Books</Link></li>
              <li><Link href="/bestsellers" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Best Sellers</Link></li>

              <li><Link href="/admin" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Admin Login</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-semibold mb-4 text-purple-300">Customer Service</h3>
            <ul className="space-y-2">
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Contact Us</Link></li>
              <li><Link href="/shipping" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Shipping Info</Link></li>
              <li><Link href="/returns" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Returns</Link></li>
              <li><Link href="/faq" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">FAQ</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="text-center sm:text-left sm:col-span-2 lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-purple-300">Stay Updated</h3>
            <p className="text-gray-400 mb-4 text-sm sm:text-base">Subscribe to our newsletter for the latest book recommendations.</p>
            {/* <div className="flex flex-col sm:flex-row max-w-sm mx-auto sm:mx-0">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md sm:rounded-l-md sm:rounded-r-none focus:outline-none focus:border-purple-500 mb-2 sm:mb-0 text-sm"
              />
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md sm:rounded-l-none sm:rounded-r-md transition-colors text-sm font-medium">
                Subscribe
              </button>
            </div> */}
          </div>
        </div>

        <div className="mt-8 pt-6 sm:pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 Oxford Book House. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;