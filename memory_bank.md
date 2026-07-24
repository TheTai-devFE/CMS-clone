# SYSTEM MEMORY BANK - CMS DIGITAL SIGNAGE

Tài liệu này lưu trữ trạng thái dự án, lịch sử thiết kế hệ thống, các tính năng đã thực hiện (Phase 1) và danh sách các tính năng dự kiến triển khai trong tương lai.

---

## 1. TỔNG QUAN DỰ ÁN
*   **Tên dự án:** Phần mềm quản lý nội dung từ xa (CMS Digital Signage).
*   **Mô tả:** Hệ thống SaaS & On-Premise quản lý màn hình quảng cáo tập trung, hỗ trợ caching offline thông minh, lập lịch phát và ghép màn hình đồng bộ.
*   **Thành phần chính:**
    1.  **Backend (`/server`):** NestJS + Prisma ORM (PostgreSQL) + Redis status cache.
    2.  **Web Dashboard (`/web`):** Next.js (phong cách Premium Glassmorphism & Dark Mode).
    3.  **Android Player (`/player`):** App React Native & Expo chạy trên thiết bị màn hình quảng cáo.

---

## 2. KIẾN TRÚC KỸ THUẬT & QUYẾT ĐỊNH THIẾT KẾ
*   **Quản lý Trạng thái Realtime (Heartbeat):** Để tránh quá tải cơ sở dữ liệu PostgreSQL khi hàng ngàn thiết bị gửi heartbeat liên tục (30s/lần), trạng thái online/offline của thiết bị được ghi nhận và lưu đệm trên **Redis Cache** với thời gian hết hạn (TTL) là 75 giây.
*   **Tải & Phát Offline (Caching Engine):** Thiết bị Android Player tải toàn bộ file video/ảnh về bộ nhớ cục bộ để phát offline, không stream trực tiếp nhằm tiết kiệm băng thông 4G và tránh lag.
*   **Xác thực tệp tin (MD5 Checksum):** Server tự băm MD5 cho mỗi tệp media khi upload. Player đối chiếu MD5 để chỉ tải file mới, tránh tải lại tệp trùng lặp.
*   **Kiểm soát License (Hạn mức):** Sử dụng **Database Transaction** ở Backend để đếm số máy và so khớp với hạn mức của User trước khi cho phép gán thiết bị, tránh lỗi tranh chấp tài nguyên (race condition).
*   **Phục vụ file tĩnh:** Backend NestJS tự serve static files từ thư mục `/uploads` giúp hệ thống chạy độc lập tốt, không bắt buộc phụ thuộc Cloud Storage trong môi trường mạng nội bộ (LAN).

---

## 3. DANH SÁCH TÍNH NĂNG ĐÃ THỰC HIỆN (COMPLETED - PHASE 1)

### 3.1 Backend NestJS (`/server`) - [ĐÃ HOÀN THÀNH 100%]
*   [x] **Prisma Setup:** Khởi tạo Prisma ORM kết nối PostgreSQL và đồng bộ Prisma Client (v7.8.0).
*   [x] **Redis Setup:** Tích hợp `ioredis` và khởi tạo Module Redis Global phục vụ ghi nhận trạng thái thiết bị.
*   [x] **Module Auth (RBAC):** API Đăng ký, Đăng nhập, kiểm tra session. Tích hợp JWT, phân quyền Guards chặt chẽ giữa Admin và User. Tài khoản đầu tiên tự động gán làm Admin.
*   [x] **Module Device:** 
    *   API thiết bị đăng ký trạng thái Chờ duyệt (`pending` & `user_id = null`).
    *   API Heartbeat cập nhật Redis status cache.
    *   API Admin duyệt thiết bị vô chủ và gán cho User kèm kiểm soát hạn mức License.
    *   API lấy danh sách thiết bị của User.
*   [x] **Module Media:** API upload file bằng Multer diskStorage, tự động tính toán mã MD5 Checksum, di chuyển tệp trùng MD5 để tiết kiệm ổ cứng.
*   [x] **Module Playlist & Sync:** API `GET /api/player/sync` trả về Playlist & danh sách media hoạt động cho thiết bị.

### 3.2 Web Dashboard Next.js (`/web`) - [ĐÃ HOÀN THÀNH 100%]
*   [x] **Giao diện Auth:** Giao diện Đăng nhập, Đăng ký phong cách Glassmorphic sang trọng.
*   [x] **Giao diện Admin Panel:** Danh sách thiết bị pending chờ phê duyệt, Modal chọn User để gán thiết bị, và Bảng thống kê hạn mức License của toàn bộ Users.
*   [x] **Giao diện User Panel:**
    *   Danh sách thiết bị (hiển thị trạng thái Online/Offline realtime đọc từ Redis cache).
    *   Thư viện Media Grid hiển thị danh sách video/ảnh, nút tải tệp tin mới và nút xóa.
    *   **Trình xem trước Video (Preview):** Khi click vào file video, mở Modal và phát trực tiếp video đó bằng thẻ HTML5 `<video>` trên web.

### 3.3 Android Player Expo (`/player`) - [ĐÃ HOÀN THÀNH 100%]
*   [x] **Kiosk Mode:** Cấu hình App chạy Fullscreen ẩn hoàn toàn Status Bar hệ thống.
*   [x] **Màn hình Setup:** Giao diện cấu hình Server IP, Port và Device Name để kết nối và đăng ký thiết bị lần đầu.
*   [x] **Màn hình Chờ duyệt:** Hiển thị thông báo khi chưa được Admin kích hoạt trên Web Dashboard.
*   [x] **Background Services:** Timer chạy ngầm tự động gửi Heartbeat (30s) và đồng bộ Playlist (30s) từ server.
*   [x] **Caching Engine:** Đọc danh sách file từ API Sync, so sánh MD5, tự động tải ngầm file mới về bộ nhớ máy (`FileSystem`) và gán đường dẫn ngoại tuyến.
*   [x] **Playback Engine:** Trình phát offline tự lặp lại nội dung (ảnh chạy 10s, video chạy hết thời lượng). Có cơ chế nhảy file nếu phát hiện tệp tin lỗi.

### 3.4 Cổng Thanh Toán PayOS & Landing Page - [ĐÃ HOÀN THÀNH 100%]
*   [x] **PayOS Integration Backend (`/server`):**
    *   Prisma schema bổ sung `Order` và `PaymentTransaction`.
    *   Tích hợp SDK `@payos/node`, API `POST /api/payment/create-checkout` sinh liên kết thanh toán VietQR.
    *   API `POST /api/payment/webhook` xác thực chữ ký PayOS, tự động cập nhật `Order` -> `PAID`, cộng `licenseLimit` cho User và ghi vết `LicenseAudit`.
*   [x] **Landing Page & Modal VietQR (`/web`):**
    *   Landing Page sang trọng phong cách Dark Mode & Glassmorphic tại `web/src/app/page.tsx` (`LandingPageClient.tsx`).
    *   Modal thanh toán VietQR PayOS linh hoạt chọn gói Thuê bao (Rent) / Mua đứt (Buy) và slider số lượng màn hình tại [PaymentModal.tsx](file:///Users/huynhtanphat/Documents/Tai/CMS-clone/web/src/components/ui/PaymentModal.tsx).
    *   Nút bấm nạp Slot trực tiếp trên KpiCards của Web Dashboard.

---

## 4. DANH SÁCH TÍNH NĂNG CHƯA THỰC HIỆN (PENDING / BACKLOG)

### 4.1 Phase 2: Soạn thảo Playlist & Lập lịch biểu nâng cao (Schedules)
*   [ ] **Frontend Playlist Creator:** Xây dựng giao diện kéo thả sắp xếp thứ tự phát nội dung đa phương tiện bằng thư viện `@dnd-kit` hoặc `react-beautiful-dnd`.
*   [ ] **Giao diện Lập lịch (Scheduling UI):** Giao diện cho phép User thiết lập lịch phát cụ thể cho thiết bị: Chọn ngày (Start/End Date), Giờ phát (Start/End Time) và các thứ trong tuần (Day of Week).

### 4.2 Phase 3: Đồng bộ ghép màn hình (Multi-Device Sync)
*   [ ] **Đồng bộ hóa thời gian (NTP Sync):** Cài đặt thuật toán đo RTT trên Client để tính toán độ lệch đồng hồ (`clockOffset`) so với Server.
*   [ ] **Cơ chế phát đồng bộ (Socket.IO):** Server gửi lệnh phát kèm thời gian bắt đầu Unix Epoch trong tương lai để các thiết bị giải mã video khớp nhau đến từng mili-giây.

### 4.3 Phase 4: Thống kê báo cáo & Thu thập tương tác cảm ứng
*   [ ] **Interactive Form Builder:** Giao diện tạo form khảo sát hoặc kịch bản tương tác trên Web Dashboard.
*   [ ] **Interactive App Screen:** App Player nhận diện kịch bản tương tác, hiển thị các nút bấm cảm ứng và gửi dữ liệu tương tác (`interactive_logs`) của người dùng về Server.
*   [ ] **Thống kê Playback & Interactive:** Giao diện biểu đồ thống kê thời lượng đã phát của từng quảng cáo và tổng hợp kết quả tương tác của khách hàng.

### 4.4 Phase 5: Mã hóa Bản quyền (On-Premise Licenses)
*   [ ] **License Generator:** Code sinh License File mã hóa bằng chữ ký số RSA chứa thông tin hạn mức thiết bị.
*   [ ] **License Validator:** Module NestJS Backend tự động verify file bản quyền khi khởi động để giới hạn số lượng thiết bị đăng ký.

---

## 5. HƯỚNG DẪN KHỞI CHẠY NHANH (QUICK START)
1.  **Chạy Database/Cache (local):**
    *   Docker: `docker compose up -d`
    *   Local Mac: `brew services start postgresql` và `brew services start redis`
2.  **Khởi động Server:**
    *   `cd server && npm install && npx prisma generate && npx prisma migrate dev && npm run start:dev`
3.  **Khởi động Web:**
    *   `cd web && npm install && npm run dev`
4.  **Khởi động Player:**
    *   `cd player && npm install && npm run android` (hoặc ios)
