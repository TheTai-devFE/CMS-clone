import React from "react";

interface LandingPricingProps {
  onOpenPayment: () => void;
}

export const LandingPricing: React.FC<LandingPricingProps> = ({ onOpenPayment }) => {
  return (
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
            onClick={onOpenPayment}
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
            onClick={onOpenPayment}
            className="w-full py-4 rounded-xl bg-[#8ba370] text-white font-semibold hover:bg-[#4f6538] transition-colors shadow-md"
          >
            🚀 Mua Slot Vĩnh Viễn (PayOS)
          </button>
        </div>
      </div>
    </section>
  );
};
