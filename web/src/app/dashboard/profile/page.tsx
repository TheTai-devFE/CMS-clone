'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cookieStorage } from '../../../utils/cookie';
import UserProfile from '@/components/dashboard/UserProfile';

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = cookieStorage.getUserInfo();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
  }, [router]);

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
