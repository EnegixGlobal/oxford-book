'use client';

import { useState } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { useAuth } from '@/components/providers/AuthProvider';
import { Menu } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user || user.role !== 'admin') {
    return children;
  }

  return (
    <>
      {/* Hide footer on admin pages */}
      <style jsx global>{`
        footer {
          display: none !important;
        }
      `}</style>

      <div className="min-h-screen bg-white">
        {/* ===== MOBILE TOP BAR ===== */}
        <div className="md:hidden bg-white shadow px-4 py-2 flex items-center justify-between flex-wrap gap-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md border shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm whitespace-nowrap">
            Admin Dashboard
          </span>
        </div>

        <div className="flex">
          {/* ===== DESKTOP SIDEBAR ===== */}
          <div className="hidden md:block fixed left-0 top-0 h-screen w-64">
            <AdminSidebar />
          </div>

          {/* ===== MOBILE SIDEBAR DRAWER ===== */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 md:hidden">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-lg">
                <AdminSidebar />
              </div>
            </div>
          )}

          {/* ===== MAIN CONTENT ===== */}
          <main className="flex-1 p-4 sm:p-6 md:p-8 md:ml-64 mt-2 md:mt-0">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}