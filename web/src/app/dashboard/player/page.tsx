export const dynamic = 'force-dynamic';
import PlayerPageClient from './PlayerPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thiết bị hiển thị | CDM Signage CMS',
  description: 'Quản lý, cấu hình và giám sát các màn hình quảng cáo trực tuyến/ngoại tuyến.',
};

export default function PlayerPage() {
  return <PlayerPageClient />;
}
