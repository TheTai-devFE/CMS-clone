export const dynamic = 'force-dynamic';

import React from 'react';
import EventLogPageClient from './EventLogPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nhật ký sự kiện | CDM Signage CMS',
  description: 'Lịch sử sự kiện hệ thống ghi nhận từ Redis và Database về hoạt động thiết bị.',
};

export default function EventLogPage() {
  return <EventLogPageClient />;
}
