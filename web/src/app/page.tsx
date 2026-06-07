export const dynamic = 'force-dynamic';

import React from 'react';
import HomePageClient from './HomePageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CDM Signage CMS - Hệ thống quản lý màn hình quảng cáo',
  description: 'Hệ thống CMS quản lý, đồng bộ và phân phối quảng cáo thời gian thực cho hệ thống màn hình CDM.',
};

export default function Home() {
  return <HomePageClient />;
}
