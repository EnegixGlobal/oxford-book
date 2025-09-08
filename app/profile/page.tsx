'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ProfilePage = () => {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    // Redirect to profile-info by default
    router.replace('/profile/profile-info');
  }, [user, router]);

  return null;
};

export default ProfilePage;
