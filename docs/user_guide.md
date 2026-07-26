# HƯỚNG DẪN SỬ DỤNG NHANH — CMS DIGITAL SIGNAGE (QUICK START GUIDE)

Chào mừng bạn đến với **CDM Signage CMS** — Hệ thống quản lý, đồng bộ và phân phối nội dung trình chiếu màn hình quảng cáo tập trung từ xa.

---

## 🚀 1. ĐĂNG KÝ & MUA GÓI BẢN QUYỀN (LICENSE)

### Bước 1: Mua gói trên Landing Page hoặc Dashboard
1. Truy cập trang chủ CMS tại: `https://cms.yourdomain.com`.
2. Tại **Bảng giá dịch vụ**, chọn loại hình phù hợp:
   - **Thuê bao theo tháng (Rent)**: 99.000 VNĐ / màn hình / tháng.
   - **Mua đứt bản quyền (Buy)**: 1.500.000 VNĐ / màn hình.
3. Kéo thanh slider để chọn **Số lượng màn hình (License Slots)** cần mua.
4. Nhấn **Mua Ngay** để mở Modal thanh toán VietQR PayOS.

### Bước 2: Thanh toán VietQR qua PayOS
1. Sử dụng App Ngân hàng hoặc Ví điện tử (MoMo, ZaloPay, Vietcombank, Techcombank, MB Bank, ...) quét mã VietQR hiển thị trên màn hình.
2. Kiểm tra thông tin số tiền và nội dung chuyển khoản tự động.
3. Sau khi thanh toán thành công, hệ thống tự động cộng hạn mức số màn hình (License Limit) vào tài khoản của bạn.

---

## 📺 2. KẾT NỐI MÀN HÌNH THIẾT BỊ (APP PLAYER)

### Bước 1: Tải & Khởi chạy App Player
1. Tải và cài đặt file APK **CDM Signage Player** lên Android TV hoặc thiết bị màn hình quảng cáo chuyên dụng.
2. Mở ứng dụng lần đầu. Trên màn hình sẽ hiển thị **Mã kết nối (Pairing Code)** gồm 6 chữ số (Ví dụ: `682910`).

### Bước 2: Gán thiết bị trên Web Dashboard
1. Đăng nhập vào trang quản trị CMS (`/dashboard`).
2. Vào mục **Players** (Quản lý thiết bị) -> Chọn **Kết nối màn hình mới**.
3. Nhập mã 6 chữ số hiển thị trên màn hình TV và đặt tên gợi nhớ cho thiết bị (Ví dụ: `Màn hình Lễ Tân`).
4. Nhấn **Xác nhận kết nối**. Màn hình TV sẽ tự động chuyển sang trạng thái đã kích hoạt và sẵn sàng trình chiếu!

---

## 🎨 3. TẠO & PHÂN PHỐI NỘI DUNG (PLAYLIST & PUBLISH)

### Bước 1: Tải tệp tin lên Thư viện Media
1. Vào mục **Media Library** (`/dashboard/content`).
2. Nhấn nút **Tải tệp lên** để tải các file Hình ảnh (`PNG`, `JPG`), Video (`MP4`), Tài liệu (`PDF`) hoặc nhấn **Nhúng trang Web** để nhập liên kết URL trang web cần phát.

### Bước 2: Soạn thảo Danh sách phát (Playlist)
1. Vào mục **Danh sách phát** (`/dashboard/playlist`) -> Chọn **Tạo danh sách phát mới**.
2. Đặt tên Playlist và chọn độ phân giải màn hình tương ứng (FullHD Ngang/Dọc hoặc 4K Ngang/Dọc).
3. Kéo thả các hình ảnh, video, trang web từ Thư viện sang danh sách slide phát bên trái.
4. Tùy chỉnh thời gian phát cho từng slide (mặc định 10-15 giây đối với ảnh/web, video sẽ tự động phát 100% độ dài).
5. Nhấn **Lưu Playlist**.

### Bước 3: Đẩy nội dung xuống thiết bị (Publish)
1. Sau khi Lưu Playlist, hệ thống tự động hiển thị màn hình **Publish to Devices**.
2. Đánh dấu chọn các thiết bị màn hình bạn muốn phát Playlist này.
3. Bật/Tắt công tắc kích hoạt cho từng màn hình.
4. Nhấn **Xuất bản nội dung (Publish)**. Màn hình TV sẽ tự động tải dữ liệu ngầm và bắt đầu trình chiếu ngay lập tức!

---

## ❓ 4. CÁC CÂU HỎI THƯỜNG GẶP (FAQ)

- **Q: Màn hình TV mất kết nối Internet (WiFi) thì ứng dụng có phát được không?**
  - *Trả lời*: Có! App Player đã được trang bị **Engine Offline Caching**. Mọi video, hình ảnh sau khi tải về thành công sẽ lưu trực tiếp vào bộ nhớ thiết bị và tiếp tục trình chiếu bình thường ngay cả khi không có mạng.
- **Q: Làm sao để thay đổi thứ tự phát quảng cáo?**
  - *Trả lời*: Bạn chỉ cần vào mục **Danh sách phát**, chọn Playlist cần chỉnh sửa và dùng các nút mũi tên lên/xuống để thay đổi vị trí slide, sau đó bấm Lưu.
