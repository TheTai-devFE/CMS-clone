export const dynamic = 'force-dynamic';

import React from 'react';
import RegisterPageClient from './RegisterPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng ký tài khoản | CDM Signage CMS',
  description: 'Đăng ký tài khoản mới để bắt đầu sử dụng dịch vụ CMS quản lý màn hình quảng cáo CDM.',
};

export default function RegisterPage() {
  return <RegisterPageClient />;
}
