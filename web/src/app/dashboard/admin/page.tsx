export const dynamic = 'force-dynamic';

import React from 'react';
import AdminPageClient from './AdminPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hệ thống Quản trị | CDM Signage CMS',
  description: 'Bảng quản lý dành riêng cho quản trị viên: Duyệt thiết bị mới và theo dõi giới hạn license.',
};

export default function AdminPage() {
  return <AdminPageClient />;
}
