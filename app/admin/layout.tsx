'use client';

import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { useAuth } from '@/components/providers/AuthProvider';
import { redirect } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return children;
  }

  return (
    <>
      <style jsx global>{`
        footer {
          display: none !important;
        }
      `}</style>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 ml-64 p-8 bg-gray-50">{children}</main>
      </div>
    </>
  );
}
