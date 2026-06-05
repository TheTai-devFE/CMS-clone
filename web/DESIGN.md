# Hệ thống Thiết kế: CDM Digital Signage Dashboard

Hệ thống thiết kế này thiết lập quy chuẩn thẩm mỹ cao cấp, hiện đại và đồng bộ cho toàn bộ giao diện Web CMS của hệ thống quản lý màn hình quảng cáo Control Digital Media (CDM), đặc biệt tập trung tái thiết kế trang quản lý danh sách thiết bị phát (**Player Monitor**).

---

## 1. Phong cách & Không khí Thiết kế (Atmosphere)
* **Độ dày thông tin (Density):** Balanced (6/10) — Bố cục thông tin rõ ràng, khoảng cách đệm (padding) rộng rãi giúp dễ đọc dữ liệu bảng số lớn mà không gây rối mắt.
* **Độ bất đối xứng (Variance):** Asymmetric Offset (7/10) — Sử dụng các khu vực chức năng lệch cân bằng, phân nhóm tác vụ thông minh, tránh bố cục chia cột đều tẻ nhạt.
* **Chuyển động (Motion):** Fluid & Weighted (5/10) — Sử dụng hiệu ứng chuyển động tự nhiên (spring physics) cho các tooltip, dropdown và hiệu ứng hover bảng.
* **Bối cảnh:** Giao diện tối chủ đạo (Premium Dark Mode) tạo cảm giác rạp chiếu phim kỹ thuật số chuyên nghiệp, giảm mỏi mắt cho người vận hành hệ thống 24/7.

---

## 2. Bảng màu & Vai trò (Color Palette)
Hệ thống kế thừa 100% các biến CSS (CSS Variables) có sẵn của website để đảm bảo hiển thị đồng bộ hoàn hảo trên cả hai chế độ **Sáng (Light Mode)** và **Tối (Dark Mode)**:

* **Nền Workspace** (`var(--workspace-bg)`) — Nền tảng chính cho bảng và biểu đồ dữ liệu.
* **Nền Panel** (`var(--panel-bg)`) — Nền cho các thẻ thống kê (Stats Widgets) và thanh lọc (Filter Bar).
* **Màu Viền** (`var(--border-color)` / `var(--panel-border)`) — Phân tách dòng bảng và các khối chức năng.
* **Chữ Chính** (`var(--text-color)`) — Tiêu đề, văn bản chính của bảng.
* **Chữ Phụ** (`var(--ink-secondary)`) — Nhãn, thông số mờ, metadata.
* **Màu Nhấn (Accent)** (`var(--accent)`) — Dùng cho nút chính (CTA), checkbox kích hoạt, trạng thái hoạt động và các vùng được chọn (sẽ tự động chuyển từ xanh Teal ở Light Mode sang màu Cam/Hồng ở Dark Mode theo theme của website).
* **Trạng thái Online** (`var(--success)`) — Màu đại diện cho thiết bị hoạt động bình thường.
* **Trạng thái Offline** (`var(--warning)`) — Trạng thái thiết bị mất kết nối.
* **Trạng thái Lỗi / Xóa** (`var(--error)`) — Tác vụ xóa thiết bị hoặc lỗi nghiêm trọng.

> [!CAUTION]
> **Quy tắc cấm kỵ về màu sắc:**
> * Tuyệt đối không hardcode các mã màu tối (như `#070b13` hay `#1e293b`) đè lên giao diện, điều này sẽ làm hỏng bố cục màu sắc của website khi người dùng chuyển sang Light Mode (chế độ Sáng).
> * Không dùng các nút bấm nổi khối 3D hoặc dải màu gradient bóng bẩy tương phản cao không theo hệ thống của website hiện tại.

---

## 3. Hệ thống Kiểu chữ (Typography)
* **Tiêu đề & Headline:** `Outfit` (Sans-serif) — Căn lề chặt chẽ, khoảng cách chữ hẹp (`letter-spacing: -0.02em`), nhấn mạnh bằng độ dày chữ (Font Weight từ 600 đến 800) thay vì phóng to kích thước quá đà.
* **Nội dung (Body):** `Outfit` — Kích thước tối thiểu `14px`, chiều cao dòng thoáng đạt (`line-height: 1.6`) để tối ưu hóa khả năng đọc.
* **Số liệu & Metadata:** `JetBrains Mono` — Sử dụng bắt buộc cho: Player ID, Địa chỉ IP, Thời gian cập nhật, và Phiên bản để các cột dữ liệu số thẳng hàng tuyệt đối trên bảng.

---

## 4. Thiết kế các Component (Player Monitor)

### A. Khung tìm kiếm & Bộ lọc (Search & Filter)
* Loại bỏ giao diện tìm kiếm dạng ô lưới rời rạc của bản cũ.
* Thay thế bằng một **Filter Bar** tích hợp dạng ngang liền mạch (Single Row Filter Bar):
  * Thanh tìm kiếm chính (Player ID / Tên) nằm bên trái rộng rãi, tích hợp icon kính lúp SVG tinh xảo.
  * Các bộ lọc dropdown (Status, Organization) được thiết kế tối giản, bo tròn góc `8px`, nền mờ đục với mũi tên chỉ xuống tinh tế.
  * Nút "Tìm kiếm" phẳng dạng Outline hoặc Solid Emerald tối giản.

### B. Nhóm Tác vụ Hàng loạt (Batch Actions Bar)
* Giao diện cũ bày biện quá nhiều nút tác vụ rời rạc (`Multi Schedule`, `Install APK`, `Reboot`, v.v.).
* Giao diện mới gom các tác vụ này vào **Action Toolbar** thông minh:
  * Hiển thị số lượng thiết bị đang chọn dạng badge động: `Đã chọn 2 thiết bị`.
  * Các nút hành động được phân nhóm theo ngữ cảnh:
    * **Nhóm Quản lý APK:** `Install APK`, `Uninstall APK` (Gom vào dropdown menu tác vụ phụ).
    * **Nhóm Điều khiển:** `Reboot`, `Volume`, `Reregister` (Thiết kế dạng icon button kèm tooltip tối giản).
    * **Nhóm Nội dung:** `Multi Schedule` (Nút chính nổi bật), `Remove all contents` (Nút màu đỏ nhạt).
  * Chỉ xuất hiện mượt mà (slide up) từ mép dưới hoặc đầu bảng khi người dùng click chọn ít nhất 1 checkbox.

### C. Bảng giám sát Player (Player Table)
* Loại bỏ hoàn toàn đường viền dọc (Vertical Gridlines) cũ kỹ. Chỉ dùng đường viền ngang 1px mờ (`rgba(255, 255, 255, 0.04)`).
* Trạng thái Online/Offline hiển thị dạng **Status Pill** có chấm tròn sáng nhẹ (pulse animation cho Online).
* Hỗ trợ hiệu ứng Hover dòng mượt mà: khi rê chuột qua dòng, nền dòng đổi sang màu xám mờ nhẹ (`rgba(255, 255, 255, 0.02)`) và hiển thị các nút tác vụ nhanh (Quick Actions) ở cột cuối cùng.
* Checkbox thiết kế tùy chỉnh (Custom Checkbox) dạng bo tròn nhẹ `4px`, chuyển màu viền sang Emerald khi được tích chọn.

---

## 5. Quy tắc Bố cục (Layout Principles)
* Toàn bộ trang web được bọc trong container giới hạn chiều rộng tối đa (`max-width: 1600px`) để tránh việc giao diện bị giãn quá mức trên màn hình UltraWide.
* Áp dụng bố cục lưới 2 lớp:
  * **Lớp 1 (Stats Widgets - Trên cùng):** 3 thẻ thống trị biểu đồ nhanh hiển thị: Tổng số thiết bị, Thiết bị đang Online, Thiết bị đang Offline với các con số dạng lớn nổi bật.
  * **Lớp 2 (Main Workspace - Phía dưới):** Khung tìm kiếm và Bảng giám sát chính.

---

## 6. Chuyển động & Hiệu ứng (Motion & Interactions)
* **Hover State:** Tất cả các dòng trong bảng và nút bấm đều có hiệu ứng chuyển đổi trạng thái mượt mà (`transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`).
* **Cascading Entry:** Khi tải trang, danh sách Player sẽ được xuất hiện thác đổ (staggered cascade) nhẹ nhàng từ trên xuống dưới để tăng cảm giác mượt mà.
* **Loading state:** Thay thế vòng xoay spinner cũ kỹ bằng hiệu ứng xương (Skeleton Loader) mờ dạng xung nhịp chạy dọc theo hàng của bảng khi dữ liệu đang tải.

---

## 7. Các điểm cấm kỵ (Anti-Patterns)
* Cấm sử dụng Emoji trong bảng hoặc tiêu đề (sử dụng icon SVG tối giản).
* Cấm sử dụng các nút bấm nổi khối 3D, nút gradient bóng bẩy màu sắc tương phản cao của giao diện cũ.
* Không sử dụng font chữ `Inter` thông thường hoặc font serif (`Times New Roman`) cho trang quản trị này.
* Không dùng từ ngữ mang tính kỹ thuật thô thiển của hệ thống cũ như "To ObtainPlayer" (đổi thành "Quét thiết bị" hoặc "Làm mới danh sách").
