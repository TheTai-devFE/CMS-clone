'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PaymentModal } from '@/components/ui/PaymentModal';

export default function LandingPageClient() {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  return (
    <div style={styles.container}>
      {/* Navigation Header */}
      <header style={styles.navbar}>
        <div style={styles.logoGroup}>
          <div style={styles.logoIcon}>📺</div>
          <span style={styles.logoText}>CDM Signage CMS</span>
        </div>
        <div style={styles.navLinks}>
          <a href="#features" style={styles.navLink}>Tính Năng</a>
          <a href="#pricing" style={styles.navLink}>Bảng Giá</a>
          <a href="#faq" style={styles.navLink}>Trợ Giúp</a>
          <Link href="/login" style={styles.loginBtn}>
            Đăng Nhập Dashboard
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.badgeHero}>✨ Nền Tảng Digital Signage Thế Hệ Mới</div>
        <h1 style={styles.heroTitle}>
          Quản Lý Màn Hình Quảng Cáo <br />
          <span style={styles.heroGradient}>Tập Trung & Realtime</span>
        </h1>
        <p style={styles.heroSub}>
          Giải pháp SaaS và On-Premise tối ưu cho chuỗi cửa hàng, thương mại và doanh nghiệp. 
          Hỗ trợ phát offline thông minh, lập lịch tự động và ghép màn hình đa thiết bị.
        </p>

        <div style={styles.ctaGroup}>
          <button style={styles.primaryCta} onClick={() => setIsPaymentOpen(true)}>
            ⚡ Đăng Ký Slot / Nạp License Ngay
          </button>
          <Link href="/login" style={styles.secondaryCta}>
            Dùng Thử Dashboard →
          </Link>
        </div>

        {/* Dashboard Preview Mockup */}
        <div style={styles.mockupContainer}>
          <div style={styles.mockupHeader}>
            <span style={{ ...styles.dot, backgroundColor: '#ff5f56' }} />
            <span style={{ ...styles.dot, backgroundColor: '#ffbd2e' }} />
            <span style={{ ...styles.dot, backgroundColor: '#27c93f' }} />
            <span style={styles.mockupTitle}>https://cms.cdmsignage.vn/dashboard</span>
          </div>
          <div style={styles.mockupBody}>
            <div style={styles.mockupGrid}>
              <div style={styles.mockCard}>
                <span style={styles.mockCardTitle}>Màn hình trực tuyến</span>
                <span style={styles.mockCardVal}>12 / 12 Online</span>
                <div style={styles.progressBar}><div style={{ ...styles.progressFill, width: '100%' }} /></div>
              </div>
              <div style={styles.mockCard}>
                <span style={styles.mockCardTitle}>Tài nguyên Media</span>
                <span style={styles.mockCardVal}>128 Files (4.2 GB)</span>
                <div style={styles.progressBar}><div style={{ ...styles.progressFill, width: '65%', backgroundColor: '#0ea5e9' }} /></div>
              </div>
              <div style={styles.mockCard}>
                <span style={styles.mockCardTitle}>Trạng thái Sync</span>
                <span style={styles.mockCardVal}>Đã đồng bộ 100%</span>
                <div style={styles.progressBar}><div style={{ ...styles.progressFill, width: '100%', backgroundColor: '#10b981' }} /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={styles.section}>
        <h2 style={styles.sectionTitle}>Tính Năng Đột Phá</h2>
        <p style={styles.sectionSub}>Tất cả những gì bạn cần để điều hành hàng ngàn màn hình quảng cáo không bị gián đoạn.</p>

        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>📡</div>
            <h3 style={styles.featureTitle}>Offline Caching Smart</h3>
            <p style={styles.featureDesc}>App Player tự động tải toàn bộ nội dung về bộ nhớ nội bộ. Phát hoàn toàn offline không gián đoạn dù mất mạng 4G/Wi-Fi.</p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>⚡</div>
            <h3 style={styles.featureTitle}>PayOS VietQR Nạp Slot</h3>
            <p style={styles.featureDesc}>Tích hợp cổng thanh toán VietQR PayOS tự động. Quét mã nạp slot màn hình nhận tiền trong 2 giây, cấp quyền tức thì.</p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>📅</div>
            <h3 style={styles.featureTitle}>Lập Lịch Phát Linh Hoạt</h3>
            <p style={styles.featureDesc}>Cấu hình khung giờ phát, ngày phát và lặp lại theo thứ trong tuần. Tự động chuyển đổi kịch bản quảng cáo.</p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🖼️</div>
            <h3 style={styles.featureTitle}>Multi-Device Sync</h3>
            <p style={styles.featureDesc}>Thuật toán đồng bộ thời gian NTP cho phép ghép hàng loạt màn hình phát song song khớp từng mili-giây.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={styles.section}>
        <h2 style={styles.sectionTitle}>Bảng Giá Dịch Vụ</h2>
        <p style={styles.sectionSub}>Chi phí minh bạch, mở rộng không giới hạn theo quy mô kinh doanh của bạn.</p>

        <div style={styles.pricingGrid}>
          {/* Plan 1 */}
          <div style={styles.pricingCard}>
            <h3 style={styles.planTitle}>Gói Thuê Bao (Rent)</h3>
            <div style={styles.planPriceBox}>
              <span style={styles.priceNum}>99.000đ</span>
              <span style={styles.pricePeriod}>/ tháng / màn hình</span>
            </div>
            <ul style={styles.planFeatures}>
              <li>✓ Không phí khởi tạo ban đầu</li>
              <li>✓ Cập nhật tính năng mới miễn phí</li>
              <li>✓ Tự động hóa nạp slot qua VietQR</li>
              <li>✓ Hỗ trợ kỹ thuật 24/7</li>
            </ul>
            <button style={styles.planBtn} onClick={() => setIsPaymentOpen(true)}>
              Thanh Toán Qua PayOS
            </button>
          </div>

          {/* Plan 2 */}
          <div style={{ ...styles.pricingCard, borderColor: '#0d9488', backgroundColor: 'rgba(13, 148, 136, 0.05)' }}>
            <div style={styles.popularBadge}>KHUYÊN DÙNG</div>
            <h3 style={styles.planTitle}>Gói Mua Đứt (Buy)</h3>
            <div style={styles.planPriceBox}>
              <span style={styles.priceNum}>1.500.000đ</span>
              <span style={styles.pricePeriod}>/ vĩnh viễn / màn hình</span>
            </div>
            <ul style={styles.planFeatures}>
              <li>✓ Sở hữu vĩnh viễn không đóng phí tháng</li>
              <li>✓ Đầy đủ tính năng Caching & Scheduling</li>
              <li>✓ Tùy chọn On-Premise hoặc Cloud SaaS</li>
              <li>✓ Thanh toán nhanh PayOS tự động cấp phép</li>
            </ul>
            <button style={{ ...styles.planBtn, backgroundColor: '#0d9488', color: '#fff' }} onClick={() => setIsPaymentOpen(true)}>
              Mua Đứt Qua PayOS
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2026 CDM Digital Signage CMS. Tất cả quyền được bảo lưu.</p>
      </footer>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#121214',
    color: '#f5f5f7',
    minHeight: '100vh',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  navbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 40px',
    borderBottom: '1px solid #2c2c30',
    backgroundColor: 'rgba(18, 18, 20, 0.8)',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    fontSize: '24px',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: 700,
    letterSpacing: '-0.5px',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  navLink: {
    color: '#8e8e93',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
  },
  loginBtn: {
    padding: '8px 18px',
    borderRadius: '8px',
    backgroundColor: '#242429',
    border: '1px solid #3a3a3c',
    color: '#f5f5f7',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 600,
  },
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '80px 20px 60px 20px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  badgeHero: {
    padding: '6px 16px',
    borderRadius: '20px',
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    color: '#0d9488',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '20px',
    border: '1px solid rgba(13, 148, 136, 0.3)',
  },
  heroTitle: {
    fontSize: '52px',
    fontWeight: 800,
    lineHeight: '1.15',
    letterSpacing: '-1.5px',
    margin: '0 0 20px 0',
  },
  heroGradient: {
    background: 'linear-gradient(135deg, #0d9488 0%, #38bdf8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSub: {
    fontSize: '18px',
    color: '#8e8e93',
    maxWidth: '700px',
    lineHeight: '1.6',
    margin: '0 0 36px 0',
  },
  ctaGroup: {
    display: 'flex',
    gap: '16px',
    marginBottom: '60px',
  },
  primaryCta: {
    padding: '16px 32px',
    borderRadius: '12px',
    backgroundColor: '#0d9488',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(13, 148, 136, 0.4)',
  },
  secondaryCta: {
    padding: '16px 32px',
    borderRadius: '12px',
    backgroundColor: '#242429',
    border: '1px solid #3a3a3c',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 600,
    textDecoration: 'none',
  },
  mockupContainer: {
    width: '100%',
    maxWidth: '900px',
    backgroundColor: '#1a1a1e',
    borderRadius: '16px',
    border: '1px solid #2c2c30',
    overflow: 'hidden',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
  },
  mockupHeader: {
    padding: '12px 16px',
    backgroundColor: '#121214',
    borderBottom: '1px solid #2c2c30',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  mockupTitle: {
    fontSize: '12px',
    color: '#636366',
    marginLeft: '12px',
    fontFamily: 'monospace',
  },
  mockupBody: {
    padding: '24px',
  },
  mockupGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  },
  mockCard: {
    backgroundColor: '#242429',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #2c2c30',
    textAlign: 'left',
  },
  mockCardTitle: {
    fontSize: '12px',
    color: '#8e8e93',
    display: 'block',
  },
  mockCardVal: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#f5f5f7',
    marginTop: '6px',
    display: 'block',
  },
  progressBar: {
    height: '6px',
    width: '100%',
    backgroundColor: '#121214',
    borderRadius: '3px',
    marginTop: '12px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0d9488',
  },
  section: {
    padding: '80px 20px',
    maxWidth: '1100px',
    margin: '0 auto',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: '36px',
    fontWeight: 800,
    margin: '0 0 12px 0',
  },
  sectionSub: {
    fontSize: '16px',
    color: '#8e8e93',
    marginBottom: '48px',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
  },
  featureCard: {
    backgroundColor: '#1a1a1e',
    border: '1px solid #2c2c30',
    borderRadius: '16px',
    padding: '32px',
    textAlign: 'left',
  },
  featureIcon: {
    fontSize: '32px',
    marginBottom: '16px',
  },
  featureTitle: {
    fontSize: '20px',
    fontWeight: 700,
    margin: '0 0 8px 0',
  },
  featureDesc: {
    fontSize: '14px',
    color: '#8e8e93',
    lineHeight: '1.5',
    margin: 0,
  },
  pricingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '32px',
    maxWidth: '850px',
    margin: '0 auto',
  },
  pricingCard: {
    backgroundColor: '#1a1a1e',
    border: '1px solid #2c2c30',
    borderRadius: '20px',
    padding: '40px 32px',
    textAlign: 'left',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: '-12px',
    right: '24px',
    backgroundColor: '#0d9488',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 700,
    padding: '4px 12px',
    borderRadius: '12px',
  },
  planTitle: {
    fontSize: '22px',
    fontWeight: 700,
    margin: '0 0 16px 0',
  },
  planPriceBox: {
    marginBottom: '24px',
  },
  priceNum: {
    fontSize: '36px',
    fontWeight: 800,
    color: '#f5f5f7',
  },
  pricePeriod: {
    fontSize: '14px',
    color: '#8e8e93',
    marginLeft: '8px',
  },
  planFeatures: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 32px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    fontSize: '14px',
    color: '#c7c7cc',
  },
  planBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid #3a3a3c',
    backgroundColor: '#242429',
    color: '#f5f5f7',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  footer: {
    borderTop: '1px solid #2c2c30',
    padding: '32px',
    textAlign: 'center',
    color: '#636366',
    fontSize: '14px',
  },
};
