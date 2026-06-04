'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cookieStorage } from '../utils/cookie';

export default function HomePageClient() {
  const router = useRouter();

  useEffect(() => {
    const token = cookieStorage.getAccessToken();
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
      Đang chuyển hướng hệ thống...
    </div>
  );
}
