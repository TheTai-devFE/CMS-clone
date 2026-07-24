'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PaymentModal } from '@/components/ui/PaymentModal';

export default function LandingPageClient() {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Auto scroll for marquee or interactive effects
  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="bg-[#f9f9f7] font-sans text-[#1a1c1b] antialiased min-h-screen">
      {/* Dynamic Material Symbols & Tailwind Link */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />

      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-4 left-0 right-0 z-50 justify-between items-center px-8 max-w-[1440px] mx-auto">
        <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-md border border-[#c5c8bb]/40 gap-2">
          <span className="font-bold text-[#4f6538] text-lg">CMS Digital Signage</span>
        </div>
        <div className="flex items-center space-x-8 bg-white px-6 py-2 rounded-full shadow-md border border-[#c5c8bb]/40">
          <a
            className="text-sm font-medium text-[#44483e] hover:text-[#4f6538] transition-colors"
            href="#features"
          >
            Tính Năng
          </a>
          <a
            className="text-sm font-medium text-[#44483e] hover:text-[#4f6538] transition-colors"
            href="#solutions"
          >
            Giải Pháp
          </a>
          <a
            className="text-sm font-medium text-[#44483e] hover:text-[#4f6538] transition-colors"
            href="#pricing"
          >
            Bảng Giá
          </a>
          <Link
            className="text-sm font-medium text-[#4f6538] bg-transparent border border-[#4f6538] px-4 py-2 rounded-full hover:bg-[#4f6538]/10 transition-colors"
            href="/login"
          >
            Đăng Nhập
          </Link>
          <button
            onClick={() => setIsPaymentOpen(true)}
            className="bg-[#8ba370] hover:bg-[#4f6538] text-white px-6 py-2 rounded-full text-sm font-semibold transition-all active:scale-95 shadow-sm"
          >
            Mua Slot / Dùng Thử
          </button>
        </div>
      </nav>

      {/* Mobile Menu Trigger */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed right-4 top-4 z-[100] w-12 h-12 bg-[#4f6538] text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Toggle Menu"
      >
        <span className="material-symbols-outlined text-[28px]">
          {isMobileMenuOpen ? 'close' : 'menu'}
        </span>
      </button>

      {/* Mobile Side Drawer & Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-[80] transition-opacity md:hidden"
        />
      )}
      <aside
        className={`fixed top-0 right-0 z-[90] h-full w-[260px] bg-white shadow-2xl transition-transform duration-300 transform flex flex-col md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6 border-b border-[#e2e3e1] pb-3">
            <span className="font-bold text-[#4f6538] text-lg">Menu</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="material-symbols-outlined text-[#44483e]"
            >
              close
            </button>
          </div>
          <nav className="flex flex-col gap-3">
            <a
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 p-2 text-[#1a1c1b] font-medium hover:bg-[#f4f4f2] rounded-lg transition-colors"
              href="#features"
            >
              <span className="material-symbols-outlined text-[20px]">featured_play_list</span>
              <span>Tính Năng</span>
            </a>
            <a
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 p-2 text-[#1a1c1b] font-medium hover:bg-[#f4f4f2] rounded-lg transition-colors"
              href="#solutions"
            >
              <span className="material-symbols-outlined text-[20px]">lightbulb</span>
              <span>Giải Pháp</span>
            </a>
            <a
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 p-2 text-[#1a1c1b] font-medium hover:bg-[#f4f4f2] rounded-lg transition-colors"
              href="#pricing"
            >
              <span className="material-symbols-outlined text-[20px]">payments</span>
              <span>Bảng Giá</span>
            </a>
          </nav>
          <div className="mt-auto pt-6 flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full text-center bg-transparent border border-[#4f6538] text-[#4f6538] py-3 rounded-full font-bold text-sm shadow-sm active:scale-95 transition-transform"
            >
              Đăng Nhập
            </Link>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsPaymentOpen(true);
              }}
              className="w-full bg-[#8ba370] text-white py-3 rounded-full font-bold text-sm shadow-md active:scale-95 transition-transform"
            >
              Bắt Đầu Ngay
            </button>
          </div>
        </div>
      </aside>

      <main className="pt-24 md:pt-32 pb-24">
        {/* Hero Section */}
        <section className="relative pt-12 pb-16 overflow-hidden mb-12 max-w-[1440px] mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto space-y-6 relative z-10">
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#1a1c1b] leading-tight tracking-tight">
              Quản Lý Màn Hình Quảng Cáo<br />
              <span className="bg-[#8ba370]/20 text-[#4f6538] px-6 py-2 rounded-2xl inline-block mt-3">
                Thông Minh Từ Xa
              </span>
            </h1>
            <p className="text-base md:text-lg text-[#44483e] max-w-3xl mx-auto leading-relaxed">
              Giải pháp SaaS/On-Premise giúp bạn điều khiển hàng trăm màn hình tập trung, đồng bộ chính xác tới từng milisecond. Tối ưu hóa không gian hiển thị với công nghệ hiện đại.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <button
                onClick={() => setIsPaymentOpen(true)}
                className="bg-[#4f6538] text-white font-semibold text-base px-8 py-4 rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95"
              >
                ⚡ Mua Slot & Dùng Thử Ngay
              </button>
              <Link
                href="/login"
                className="bg-white border border-[#c5c8bb] text-[#1a1c1b] font-semibold text-base px-8 py-4 rounded-xl hover:bg-[#f4f4f2] transition-colors flex items-center gap-2 shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[22px] text-[#4f6538]">
                  play_circle
                </span>
                Vào Dashboard
              </Link>
            </div>
          </div>

          {/* Glassmorphism Dashboard Preview Mockup */}
          <div className="mt-14 relative max-w-5xl mx-auto">
            <div className="bg-white/70 backdrop-blur-md rounded-3xl p-4 md:p-8 shadow-2xl border border-white/60 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-7 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-[#1a1c1b]">CMS Monitoring Control</h3>
                    <div className="bg-[#e2e3e1] px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#4f6538] animate-pulse"></span> 142 Screens Online
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="aspect-video rounded-xl overflow-hidden shadow-sm border border-[#c5c8bb]/30 bg-[#1a1c1b] flex items-center justify-center text-white relative">
                      <img
                        src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80"
                        alt="Digital Signage Banner"
                        className="w-full h-full object-cover opacity-80"
                      />
                      <span className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px]">Main Lobby (4K)</span>
                    </div>
                    <div className="aspect-video rounded-xl border-2 border-dashed border-[#c5c8bb] flex flex-col items-center justify-center text-[#44483e] bg-[#f4f4f2] cursor-pointer hover:bg-[#e8e8e6] transition-colors">
                      <span className="material-symbols-outlined text-[32px] mb-1 text-[#4f6538]">add_circle</span>
                      <span className="text-xs font-semibold">Tạo Playlist Mới</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#c5c8bb]/30 flex items-center justify-between max-w-xs mx-auto md:mx-0">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#4f6538]">sync</span>
                      <div className="text-left">
                        <div className="font-bold text-sm">Sync Latency</div>
                        <div className="text-xs text-[#44483e]">&lt; 10ms (Realtime)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vertical Tablet/Phone Preview */}
                <div className="md:col-span-5 flex justify-center">
                  <div className="relative bg-black rounded-[2.5rem] p-3 shadow-2xl border-4 border-[#dadad8] max-w-[280px]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-b-xl z-20"></div>
                    <div className="aspect-[3/4] rounded-[2rem] overflow-hidden relative bg-[#14161f]">
                      <img
                        src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80"
                        alt="Kiosk App Live Preview"
                        className="w-full h-full object-cover opacity-90"
                      />
                      <div className="absolute bottom-4 left-3 right-3 bg-white/80 backdrop-blur-md p-3 rounded-xl flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#4f6538] text-[20px]">sensors</span>
                          <span className="text-xs font-bold text-[#1a1c1b]">Live Sync Player</span>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-[#4f6538]"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Brand Logos / Social Proof */}
        <section className="py-12 bg-[#f4f4f2] border-y border-[#c5c8bb]/40 overflow-hidden mb-16">
          <div className="max-w-[1440px] mx-auto px-6 text-center">
            <p className="font-semibold text-xs text-[#44483e] uppercase tracking-widest mb-6">
              Hệ thống tin dùng bởi hơn 500+ doanh nghiệp & thương hiệu hàng đầu
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-75 font-extrabold text-xl md:text-2xl text-[#75786d]">
              <span>SAMSUNG</span>
              <span>LG ELECTRONICS</span>
              <span>PANASONIC</span>
              <span>SONY SIGNAGE</span>
              <span>VINCOM</span>
              <span>AEON MALL</span>
              <span>CGV CINEMA</span>
            </div>
          </div>
        </section>

        {/* Solutions Comparison Section */}
        <section className="py-12 max-w-[1440px] mx-auto px-6 mb-16" id="solutions">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-[#1a1c1b] mb-3">
              Tại Sao Bạn Nên Chọn CMS Digital Signage?
            </h2>
            <div className="w-20 h-1 bg-[#8ba370] mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#e8e8e6] rounded-2xl p-8">
              <h3 className="text-xl font-bold text-[#1a1c1b] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ba1a1a]">report_problem</span>
                Vấn Đề Thường Gặp Khi Dùng Cách Cũ
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#ba1a1a] mt-0.5">close</span>
                  <span className="text-[#44483e]">Khó khăn trong việc đồng bộ nội dung trên nhiều màn hình ở các chi nhánh khác nhau.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#ba1a1a] mt-0.5">close</span>
                  <span className="text-[#44483e]">Phải chép USB thủ công, thiếu công cụ quản lý lịch phát tự động.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#ba1a1a] mt-0.5">close</span>
                  <span className="text-[#44483e]">Chi phí bảo trì cao, màn hình bị đen/lỗi mà không hay biết từ xa.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-md border border-[#8ba370]/30">
              <h3 className="text-xl font-bold text-[#4f6538] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4f6538]">verified</span>
                Giải Pháp CMS Digital Signage
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#4f6538] mt-0.5">check_circle</span>
                  <span className="text-[#1a1c1b] font-medium">Hệ thống đồng bộ chính xác tới từng milisecond cho hàng ngàn thiết bị.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#4f6538] mt-0.5">check_circle</span>
                  <span className="text-[#1a1c1b] font-medium">Trình quản lý lịch chiếu thông minh, phát offline an toàn tuyệt đối.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#4f6538] mt-0.5">check_circle</span>
                  <span className="text-[#1a1c1b] font-medium">Giám sát Heartbeat 30s liên tục, cảnh báo màn hình offline tức thì.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Features 4-Column Grid */}
        <section className="py-16 bg-[#f4f4f2] mb-16" id="features">
          <div className="max-w-[1440px] mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-4xl font-bold text-[#1a1c1b] mb-3">Tính Năng Nổi Bật</h2>
              <p className="text-[#44483e] max-w-xl mx-auto">Nền tảng quản lý toàn diện đáp ứng mọi nhu cầu vận hành hệ thống màn hình quảng cáo.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-[#c5c8bb]/40 hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-[#8ba370]/20 rounded-xl flex items-center justify-center text-[#4f6538] mb-4 group-hover:bg-[#4f6538] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">dashboard</span>
                </div>
                <h4 className="text-lg font-bold text-[#1a1c1b] mb-2">CMS Dashboard</h4>
                <p className="text-sm text-[#44483e]">Giao diện quản trị trực quan, hỗ trợ kéo thả, tùy chỉnh bố cục và nội dung linh hoạt.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#c5c8bb]/40 hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-[#8ba370]/20 rounded-xl flex items-center justify-center text-[#4f6538] mb-4 group-hover:bg-[#4f6538] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">aod</span>
                </div>
                <h4 className="text-lg font-bold text-[#1a1c1b] mb-2">Player App Mobile</h4>
                <p className="text-sm text-[#44483e]">Ứng dụng hoạt động ổn định trên Android/Smart TV, hỗ trợ offline caching thông minh.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#c5c8bb]/40 hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-[#8ba370]/20 rounded-xl flex items-center justify-center text-[#4f6538] mb-4 group-hover:bg-[#4f6538] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">dns</span>
                </div>
                <h4 className="text-lg font-bold text-[#1a1c1b] mb-2">PayOS Automatic Slot</h4>
                <p className="text-sm text-[#44483e]">Xử lý thanh toán tự động qua mã QR VietQR PayOS, tự động mở rộng slot màn hình ngay tức khắc.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#c5c8bb]/40 hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-[#8ba370]/20 rounded-xl flex items-center justify-center text-[#4f6538] mb-4 group-hover:bg-[#4f6538] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">perm_media</span>
                </div>
                <h4 className="text-lg font-bold text-[#1a1c1b] mb-2">Quản Lý Media 4K</h4>
                <p className="text-sm text-[#44483e]">Hỗ trợ đa định dạng, phân giải 4K/8K, quản lý thư viện tập trung và kiểm tra MD5 checksum.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Process Steps */}
        <section className="py-16 bg-white mb-16">
          <div className="max-w-[1440px] mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-4xl font-bold text-[#1a1c1b] mb-3">Quy Trình Triển Khai Nhanh Chóng</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 rounded-full border-2 border-[#8ba370] bg-[#f9f9f7] text-[#4f6538] flex items-center justify-center font-bold text-xl mb-4">1</div>
                <h5 className="font-bold text-[#1a1c1b] text-base mb-1">1. Khởi Chạy Player</h5>
                <p className="text-xs text-[#44483e]">Cài đặt ứng dụng Player lên TV/Android Box.</p>
              </div>

              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 rounded-full border-2 border-[#c5c8bb] bg-[#f9f9f7] text-[#75786d] flex items-center justify-center font-bold text-xl mb-4">2</div>
                <h5 className="font-bold text-[#1a1c1b] text-base mb-1">2. Kích Hoạt License</h5>
                <p className="text-xs text-[#44483e]">Quét QR Code thanh toán VietQR PayOS.</p>
              </div>

              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 rounded-full border-2 border-[#c5c8bb] bg-[#f9f9f7] text-[#75786d] flex items-center justify-center font-bold text-xl mb-4">3</div>
                <h5 className="font-bold text-[#1a1c1b] text-base mb-1">3. Tạo Playlist & Lịch</h5>
                <p className="text-xs text-[#44483e]">Kéo thả nội dung và xếp lịch trình chiếu linh hoạt.</p>
              </div>

              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 rounded-full border-2 border-[#c5c8bb] bg-[#f9f9f7] text-[#75786d] flex items-center justify-center font-bold text-xl mb-4">4</div>
                <h5 className="font-bold text-[#1a1c1b] text-base mb-1">4. Trình Chiếu Tức Thì</h5>
                <p className="text-xs text-[#44483e]">Hệ thống đồng bộ và tự động phát tức thì.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 max-w-[1440px] mx-auto px-6 mb-16" id="pricing">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-[#1a1c1b] mb-3">Bảng Giá Mua Slot / License</h2>
            <p className="text-[#44483e] max-w-2xl mx-auto">Lựa chọn mô hình linh hoạt: Thuê theo tháng hoặc Mua sở hữu trọn đời.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Rent Plan */}
            <div className="bg-white p-8 rounded-3xl flex flex-col border border-[#c5c8bb]/50 hover:shadow-xl transition-all duration-300">
              <div className="mb-6">
                <span className="bg-[#8ba370]/15 text-[#4f6538] px-3 py-1 rounded-full text-xs font-bold">MÔ HÌNH THUÊ BAO</span>
                <h3 className="text-2xl font-bold text-[#1a1c1b] mt-3">Thuê Theo Màn Hình</h3>
                <p className="text-sm text-[#44483e]">Phù hợp cho nhu cầu mở rộng linh hoạt theo tháng.</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-[#4f6538]">99.000đ</span>
                <span className="text-sm text-[#44483e]"> / màn hình / tháng</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1 text-sm text-[#44483e]">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#8ba370]">check_circle</span>
                  Thanh toán linh hoạt theo từng slot
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#8ba370]">check_circle</span>
                  Hỗ trợ Media Full HD & 4K
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#8ba370]">check_circle</span>
                  Đồng bộ Realtime & Phát Offline
                </li>
              </ul>
              <button
                onClick={() => setIsPaymentOpen(true)}
                className="w-full py-4 rounded-xl border border-[#4f6538] text-[#4f6538] font-semibold hover:bg-[#4f6538]/10 transition-colors"
              >
                ⚡ Nạp Slot Thuê Ngay
              </button>
            </div>

            {/* Lifetime Buy Plan */}
            <div className="bg-white p-8 rounded-3xl flex flex-col border-2 border-[#8ba370] relative shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#8ba370] text-white px-4 py-1 rounded-full text-xs font-bold">
                TIẾT KIỆM NHẤT TRỌN ĐỜI
              </div>
              <div className="mb-6 mt-2">
                <span className="bg-[#8ba370]/15 text-[#4f6538] px-3 py-1 rounded-full text-xs font-bold">MUA SỞ HỮU TRỌN ĐỜI</span>
                <h3 className="text-2xl font-bold text-[#1a1c1b] mt-3">Mua Đứt Vĩnh Viễn</h3>
                <p className="text-sm text-[#44483e]">Đầu tư một lần, sử dụng vĩnh viễn không phí duy trì.</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-[#4f6538]">1.500.000đ</span>
                <span className="text-sm text-[#44483e]"> / màn hình (Trọn đời)</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1 text-sm text-[#44483e]">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#8ba370]">check_circle</span>
                  Sở hữu vĩnh viễn không hết hạn
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#8ba370]">check_circle</span>
                  Không phát sinh chi phí duy trì hàng tháng
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#8ba370]">check_circle</span>
                  Cập nhật tính năng phần mềm miễn phí
                </li>
              </ul>
              <button
                onClick={() => setIsPaymentOpen(true)}
                className="w-full py-4 rounded-xl bg-[#8ba370] text-white font-semibold hover:bg-[#4f6538] transition-colors shadow-md"
              >
                🚀 Mua Slot Vĩnh Viễn (PayOS)
              </button>
            </div>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="py-16 max-w-3xl mx-auto px-6 mb-16" id="faq">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-[#1a1c1b] mb-3">Câu Hỏi Thường Gặp</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: 'Tôi có thể quản lý nhiều loại màn hình khác nhau không?',
                a: 'Có, hệ thống hỗ trợ quản lý đa dạng các loại màn hình (TV, màn hình chuyên dụng, LED) miễn là cài đặt được Player App (hỗ trợ Android và Smart TV).',
              },
              {
                q: 'Sau khi thanh toán qua VietQR PayOS, slot màn hình được cấp như thế nào?',
                a: 'Hệ thống tự động kích hoạt Webhook từ PayOS trong 2-5 giây và tự động cộng ngay hạn mức màn hình vào tài khoản của bạn trên Dashboard.',
              },
              {
                q: 'Nếu rớt mạng Wi-Fi, màn hình có tiếp tục phát quảng cáo không?',
                a: 'Có! Player App được trang bị tính năng offline caching thông minh, tự động tải nội dung về bộ nhớ thiết bị và phát lại theo kịch bản ngay cả khi mất mạng hoàn toàn.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="border-b border-[#c5c8bb]/50 pb-4">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex justify-between items-center text-left py-3 font-semibold text-lg text-[#1a1c1b] hover:text-[#4f6538] transition-colors"
                >
                  <span>{faq.q}</span>
                  <span
                    className={`material-symbols-outlined transform transition-transform ${
                      openFaq === idx ? 'rotate-180' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </button>
                {openFaq === idx && (
                  <p className="text-sm text-[#44483e] py-2 leading-relaxed">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#e8e8e6] w-full py-12 px-6 border-t border-[#c5c8bb]/40">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="text-xl font-bold text-[#4f6538]">CMS Digital Signage</div>
            <p className="text-sm text-[#44483e]">
              Giải pháp quản lý màn hình quảng cáo tập trung, chuyên nghiệp và hiệu quả.
            </p>
          </div>
          <div>
            <h5 className="font-bold text-[#1a1c1b] mb-3">Sản Phẩm</h5>
            <ul className="space-y-2 text-sm text-[#44483e]">
              <li><a href="#features" className="hover:text-[#4f6538]">Tính Năng</a></li>
              <li><a href="#solutions" className="hover:text-[#4f6538]">Giải Pháp</a></li>
              <li><a href="#pricing" className="hover:text-[#4f6538]">Bảng Giá Slot</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-[#1a1c1b] mb-3">Hỗ Trợ</h5>
            <ul className="space-y-2 text-sm text-[#44483e]">
              <li><Link href="/login" className="hover:text-[#4f6538]">Đăng Nhập Dashboard</Link></li>
              <li><a href="#faq" className="hover:text-[#4f6538]">Trợ Giúp FAQ</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-[#1a1c1b] mb-3">Bản Quyền</h5>
            <p className="text-xs text-[#44483e]">© 2026 CMS Digital Signage. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* PayOS Payment Modal Integration */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
      />
    </div>
  );
}
