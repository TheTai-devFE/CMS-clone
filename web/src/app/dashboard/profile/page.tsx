'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cookieStorage } from '../../../utils/cookie';
import UserProfile from '@/components/dashboard/UserProfile';
import { User } from '@/types/dashboard';

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const user = cookieStorage.getUserInfo();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user as User);
  }, [router]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!currentUser) {
    return (
      <div className="loading-container" style={{ minHeight: '300px' }}>
        <span className="spinner"></span>
        <p>Đang tải thông tin tài khoản...</p>
      </div>
    );
  }

  return (
    <UserProfile
      currentUser={currentUser}
      onBack={() => router.push('/dashboard')}
    />
  );
}
