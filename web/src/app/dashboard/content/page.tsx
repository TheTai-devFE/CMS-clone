export const dynamic = 'force-dynamic';

import ContentPageClient from './ContentPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thư viện Media | CDM Signage CMS',
  description: 'Quản lý kho tài nguyên hình ảnh banner và video MP4 phục vụ trình chiếu quảng cáo.',
};

export default function ContentPage() {
  return <ContentPageClient />;
}
