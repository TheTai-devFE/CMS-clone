export const dynamic = 'force-dynamic';
import OverviewPageClient from './OverviewPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tổng quan Dashboard | CDM Signage CMS',
  description: 'Xem thống kê hệ thống, tình trạng thiết bị và nhật ký hoạt động realtime.',
};

export default function OverviewPage() {
  return <OverviewPageClient />;
}
