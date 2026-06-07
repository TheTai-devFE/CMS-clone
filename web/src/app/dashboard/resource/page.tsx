export const dynamic = 'force-dynamic';

import React from 'react';
import ResourcePageClient from './ResourcePageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tài nguyên & Lịch trình | CDM Signage CMS',
  description: 'Quản lý danh sách phát (Playlist) và sơ đồ lịch trình thời gian phát sóng (Play Schema).',
};

export default function ResourcePage() {
  return <ResourcePageClient />;
}
