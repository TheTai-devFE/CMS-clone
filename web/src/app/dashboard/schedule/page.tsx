export const dynamic = 'force-dynamic';

import React from 'react';
import SchedulePageClient from './SchedulePageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hẹn giờ phát | CDM Signage CMS',
  description: 'Quản lý lịch trình phát playlist tự động trên các thiết bị màn hình.',
};

export default function SchedulePage() {
  return <SchedulePageClient />;
}
