# 🖥️ CMS Digital Signage - Hệ thống Quản lý Màn hình Quảng cáo Tập trung

Chào mừng bạn đến với **CMS Digital Signage** – giải pháp quản lý nội dung số từ xa, hỗ trợ đồng bộ hóa thời gian thực, lưu trữ cục bộ (offline caching) và cập nhật trạng thái thiết bị theo thời gian thực.

Hệ thống được phát triển theo kiến trúc hiện đại, linh hoạt cho cả mô hình triển khai Cloud (SaaS) và hạ tầng mạng nội bộ (On-Premise).

---

## 🏗️ Kiến trúc Hệ thống

Dưới đây là sơ đồ kết nối và kiến trúc kỹ thuật của hệ thống:

```mermaid
flowchart TD
    subgraph Client ["Thiết bị đầu cuối (Client)"]
        Player["📱 Android Player\n(React Native & Expo)"]
        WebDash["💻 Web Dashboard\n(Next.js & Glassmorphism)"]
    end

    subgraph Service ["Hạ tầng Backend & Lưu trữ"]
        Backend["🚀 NestJS API Server"]
        Postgres[("🐘 PostgreSQL DB\n(Prisma ORM)")]
        Redis[("⚡ Redis Status Cache\n(Heartbeat 30s)")]
        Minio[("📦 MinIO File Storage\n(Tùy chọn)")]
        LocalDisk["📁 Local Disk /uploads\n(Phục vụ file tĩnh)"]
    end

    WebDash -->|Quản lý & Duyệt thiết bị / Upload Media| Backend
    Player -->|Gửi Heartbeat & Đồng bộ Playlist (30s)| Backend
    Backend -->|Lưu trữ quan hệ & Hạn mức| Postgres
    Backend -->|Lưu trữ đệm trạng thái Online/Offline| Redis
    Backend -->|Lưu trữ file media| Minio
    Backend -->|Lưu trữ file tĩnh cục bộ| LocalDisk
```

---

## 📁 Cấu trúc Thư mục Dự án

Hệ thống bao gồm 3 thành phần chính:

*   **`server/`**: RESTful API Backend được xây dựng bằng **NestJS** kết hợp **Prisma ORM** và kết nối cơ sở dữ liệu **PostgreSQL** & bộ nhớ đệm **Redis**.
*   **`web/`**: Giao diện quản trị Admin/User bằng **Next.js** với thiết kế Dark Mode & Glassmorphism cao cấp.
*   **`player/`**: Ứng dụng client chạy trên màn hình quảng cáo được phát triển bằng **React Native (Expo)**, hỗ trợ chạy ẩn thanh trạng thái (Kiosk mode) và quản lý tải/phát file offline.

---

## ⚙️ Yêu cầu Hệ thống (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
*   [Node.js](https://nodejs.org/) (Khuyến nghị phiên bản LTS v18 trở lên)
*   [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) (Để chạy PostgreSQL, Redis, MinIO một cách nhanh chóng)
*   [Expo Go](https://expo.dev/client) (Cài đặt trên điện thoại Android/iOS nếu muốn kiểm thử thiết bị Player thật)

---

## 📦 Quản lý Thư viện với pnpm (Dành cho người mới)

Nếu bạn quen dùng `npm`, đây là bảng đối chiếu các lệnh tương đương trên `pnpm`:

| Thao tác | Lệnh `npm` tương đương | Lệnh `pnpm` mới |
| :--- | :--- | :--- |
| **Cài đặt toàn bộ thư viện** | `npm install` | `pnpm install` (hoặc `pnpm i`) |
| **Cài thêm thư viện mới** | `npm install <package>` | `pnpm add <package>` |
| **Cài dev dependency** | `npm install -D <package>` | `pnpm add -D <package>` |
| **Gỡ cài đặt thư viện** | `npm uninstall <package>` | `pnpm remove <package>` |
| **Chạy các script trong package.json** | `npm run <script>` | `pnpm <script>` (hoặc `pnpm run <script>`) |
| **Chạy lệnh CLI cục bộ (như npx)** | `npx <command>` | `pnpm exec <command>` (hoặc `pnpx <command>`) |

> [!NOTE]  
> `pnpm` giúp cài đặt thư viện cực nhanh, tiết kiệm dung lượng ổ đĩa nhờ cơ chế Hard Link (chỉ lưu một bản sao duy nhất của thư viện trên máy của bạn).

---

## 🚀 Hướng dẫn Khởi chạy Từng bước (Quick Start Guide)

> [!NOTE]  
> Hướng dẫn này giả định bạn đang làm việc trên hệ điều hành **macOS** (như cấu hình hiện tại của bạn). Các hệ điều hành khác (Linux, Windows) đều thực hiện tương tự.

### Bước 1: Khởi chạy Database, Cache và Storage (Docker Compose)

Hệ thống đã cấu hình sẵn file `docker-compose.yml` ở thư mục gốc để khởi tạo nhanh PostgreSQL, Redis và MinIO.

1. Khởi chạy các container bằng Docker Compose ở chế độ chạy ngầm (detached mode):
   ```bash
   docker compose up -d
   ```
2. Kiểm tra trạng thái của các service đã sẵn sàng chưa:
   ```bash
   docker compose ps
   ```

*Thông tin kết nối mặc định của các dịch vụ Docker:*
*   **PostgreSQL:** Port `5432` (User/Password: `postgres` / `postgres_password`, Database: `cms_db`)
*   **Redis:** Port `6379`
*   **MinIO Console (Web GUI):** [http://localhost:9001](http://localhost:9001) (User/Password: `minioadmin` / `minioadminpassword`)

---

### Bước 2: Cài đặt và Khởi chạy Backend (`/server`)

Thư mục `server` chứa API NestJS để quản lý toàn bộ hệ thống.

1. Di chuyển vào thư mục `server`:
   ```bash
   cd server
   ```
2. Cài đặt các gói phụ thuộc (Dependencies):
   ```bash
   pnpm install
   ```
3. Tạo file môi trường `.env`. Bạn có thể sao chép và điều chỉnh dựa trên file `.env` hiện có:
   ```bash
   # Nếu bạn sử dụng cơ sở dữ liệu Postgres local từ Docker Compose, hãy sửa DATABASE_URL trong .env thành:
   DATABASE_URL="postgresql://postgres:postgres_password@localhost:5432/cms_db?schema=public"
   ```
   > [!IMPORTANT]  
   > Đảm bảo biến `REDIS_HOST` được đặt là `"localhost"` và `REDIS_PORT` là `6379`.
4. Đồng bộ cấu trúc cơ sở dữ liệu (Prisma Schema) và sinh Prisma Client:
   ```bash
   pnpm prisma generate
   ```
5. Chạy các tệp Migration để khởi tạo bảng trên database:
   ```bash
   pnpm prisma migrate dev --name init
   ```
6. Khởi động API Server ở chế độ phát triển (Watch mode):
   ```bash
   pnpm start:dev
   ```
   *API Server sẽ chạy tại địa chỉ: [http://localhost:3000](http://localhost:3000)*

---

### Bước 3: Khởi chạy Web Dashboard (`/web`)

Dashboard là nơi Admin duyệt thiết bị và User tải lên nội dung quảng cáo.

1. Mở một terminal mới và di chuyển vào thư mục `web`:
   ```bash
   cd web
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   pnpm install
   ```
3. Khởi động Next.js dev server:
   ```bash
   # Nếu port 3000 đã bị NestJS backend chiếm dụng, hãy chỉ định chạy trên port 3001
   PORT=3001 pnpm dev
   ```
   *Dashboard sẽ sẵn sàng tại địa chỉ: [http://localhost:3001](http://localhost:3001)*

4. **Tài khoản mặc định:** 
   * Tài khoản đầu tiên đăng ký trên hệ thống sẽ tự động được hệ thống cấu hình làm **Admin**.
   * Các tài khoản tiếp theo đăng ký sẽ là **User**.

---

### Bước 4: Khởi chạy Android Player App (`/player`)

Player App chạy trên Android/iOS để trình chiếu nội dung và đồng bộ offline.

1. Mở một terminal mới và di chuyển vào thư mục `player`:
   ```bash
   cd player
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   pnpm install
   ```
3. Khởi chạy Expo Dev Server:
   ```bash
   pnpm start
   ```
   *Hoặc bạn có thể khởi chạy trực tiếp nền tảng mong muốn:*
   *   Android: `pnpm android`
   *   iOS: `pnpm ios`
   *   Web Preview: `pnpm web`

4. **Kết nối Player vào Server:**
   * Khi mở ứng dụng Player lần đầu tiên, giao diện Setup sẽ hiện ra.
   * Nhập các thông tin kết nối:
     * **Server IP**: Nhập địa chỉ IP mạng nội bộ của máy tính đang chạy Backend (Ví dụ: `192.168.1.100`, không sử dụng `localhost` hoặc `127.0.0.1` vì thiết bị di động cần kết nối chung mạng LAN với máy tính của bạn).
     * **Server Port**: `3000` (Cổng hoạt động của API NestJS).
     * **Device Name**: Nhập tên đặt cho màn hình này (Ví dụ: *Màn hình Sảnh chính*).
   * Ấn **Đăng ký**.

---

## 🔄 Luồng Hoạt động Core (Dành cho Lập trình viên)

1. **Đăng ký thiết bị (Pending state):**
   * Thiết bị Player gửi request đăng ký lần đầu lên Server. Trạng thái của thiết bị lúc này là `pending` (Chờ duyệt).
   * Màn hình của Player hiển thị thông báo chờ phê duyệt từ Admin.
2. **Duyệt & Cấp License (Admin Panel):**
   * Admin đăng nhập vào Web Dashboard, chuyển tới trang **Admin Panel**, chọn thiết bị đang chờ duyệt.
   * Admin phân phối thiết bị đó cho một User cụ thể (Nếu số lượng thiết bị của User đó vẫn nằm trong hạn mức License cho phép).
3. **Phát nội dung & Đồng bộ (Heartbeat & Playlist Sync):**
   * Sau khi được duyệt, Player chuyển sang chế độ trình chiếu (AdPlayerScreen).
   * Mỗi 30 giây, Player gửi một gói tin Heartbeat để cập nhật trạng thái Online lên Redis Cache (Web Dashboard sẽ tự động hiển thị chấm xanh Online realtime).
   * Cứ mỗi 30 giây, Player gọi API `GET /api/player/sync` để kiểm tra danh sách Playlist mới.
   * Player tự động so khớp MD5 Checksum của file để tải ngầm các file media mới về bộ lưu trữ máy (`FileSystem`), và tiến hành lặp phát các tệp tin cục bộ ngoại tuyến.

---

## 🛠️ Xử lý sự cố thường gặp (Troubleshooting)

*   **Lỗi không kết nối được từ Player tới Server:**
    *   Hãy chắc chắn rằng điện thoại chạy app Expo Go và máy tính chạy NestJS đang kết nối vào **cùng một mạng Wi-Fi**.
    *   Đảm bảo bạn nhập đúng địa chỉ IP máy tính cá nhân chứ không nhập `localhost` hay `127.0.0.1`. (Trên Mac, gõ `ifconfig` trong terminal để tìm địa chỉ IP dạng `192.168.x.x`).
*   **Lỗi kết nối Cơ sở dữ liệu Postgres:**
    *   Đảm bảo container Docker `cms_postgres` đang chạy (`docker ps`).
    *   Kiểm tra chuỗi `DATABASE_URL` trong file `.env` đã trùng khớp thông tin port, user và mật khẩu.
*   **Lỗi PORT 3000 bị trùng:**
    *   Hãy chạy Backend NestJS trước (port 3000). Sau đó chạy NextJS Frontend (chỉ định port 3001 bằng cách sử dụng biến `PORT=3001 npm run dev`).

---
*Chúc bạn chạy dự án thành công! Nếu gặp bất kỳ vấn đề gì, hãy hỏi **kan** để được hỗ trợ sửa lỗi ngay lập tức.*
