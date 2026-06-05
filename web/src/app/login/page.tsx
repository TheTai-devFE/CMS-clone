export const dynamic = 'force-dynamic';

import React from 'react';
import LoginPageClient from './LoginPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng nhập | CDM Signage CMS',
  description: 'Đăng nhập vào hệ thống CDM CMS để quản lý thiết bị quảng cáo và thư viện đa phương tiện.',
};

export default function LoginPage() {
  return <LoginPageClient />;
}
