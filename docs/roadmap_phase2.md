# ROADMAP TRIỂN KHAI CMS DIGITAL SIGNAGE — GIAI ĐOẠN TIẾP THEO

> Tài liệu phân tích, sắp xếp thứ tự và lập kế hoạch cho **18 yêu cầu nghiệp vụ** (16 ban đầu + 2 case mới: Payment & Billing, Auto Update Player).
> Cập nhật: Phase 1 đã hoàn thành (Auth, Device, Media, Playlist, Player cơ bản).

> **⚠️ FILE NÀY LÀ SPEC DÀI HẠN (PHASE 2+).**
> **File actionable cho 3.5 tuần tới (deadline 15/08/2026): [`mvp_mid_august.md`](./mvp_mid_august.md).**
> Spec chi tiết §3A (Payment) và §3B (Auto Update) bên dưới vẫn dùng để tham khảo khi phát triển các tính năng đầy đủ sau MVP.

---

## 1. TỔNG QUAN 18 YÊU CẦU

> **Chú thích cột MoSCoW**:
> - **P0 (MUST)** = ship trong MVP 15/08/2026 (xem `mvp_mid_august.md`)
> - **P1 (SHOULD)** = làm nếu còn time trong MVP
> - **P2 (COULD)** = Phase 2 (1-2 tháng sau launch)
> - **P3 (WON'T)** = Phase 3+ (defer, có thể không làm)

| ID  | Tên công việc                                       | Component chính               | Priority gốc | MoSCoW (MỚI) |
| --- | ---------------------------------------------------- | ----------------------------- | ------------ | --------------- |
| T1  | Tạo Landing Page (mua gói → gửi mail account)       | `web` + `server`              | Thấp         | **P0 — MVP**    |
| T2  | Cách đăng nhập — auto render email + password        | `web` + `server`              | Cao          | **P0 — MVP**    |
| T3  | Trang Media — bộ lọc Image/Video/PDF/Web             | `web`                         | Thấp         | P2 — Phase 2    |
| T4  | Trang Player — bỏ bộ lọc phê duyệt                  | `web`                         | Thấp         | P3 — Defer      |
| T5  | Trang danh sách phát — redesign + publish flow       | `web` + `server` + `player`   | Cao          | **P0 — MVP (min)** |
| T6  | Quản lý User — kiểm tra license khi thuê/mua         | `web` + `server`              | Cao          | **P0 — MVP**    |
| T7  | Trang quản lý thanh toán + auto-create user          | `web` + `server`              | Cao          | **P1 — MVP if time** |
| T8  | Đóng gói bán server + License Key                    | `server` (build/packaging)    | Cao          | P2 — Phase 2 (on-prem) |
| T9  | Trang cấu hình (background, splash image)           | `web` + `player`              | Thấp         | P2 — Phase 2    |
| T10 | Update app từ xa (OTA khi WiFi) — basic              | `web` + `server` + `player`   | Trung bình   | P3 — absorb vào T18 |
| T11 | Deploy web chạy thử                                  | infra (`docker`/`render`)     | Trung bình   | **P0 — MVP**    |
| T12 | Fix bug chiếu video bị giới hạn 10s/1m               | `player`                      | Cao          | **P0 — MVP**    |
| T13 | Đồng bộ nhiều máy (video wall)                      | `web` + `server` + `player`   | Cao          | P3 — Phase 3 (wow feature) |
| T14 | Đọc PDF trên app                                    | `web` + `server` + `player`   | Cao          | P2 — Phase 2    |
| T15 | Setting — lưu trữ + đọc USB                         | `player`                      | Thấp         | P3 — Defer      |
| T16 | Tài liệu hướng dẫn + Policy                         | `docs/`                       | Thấp         | **P1 — MVP (minimal)** |
| **T17** | **Payment Method & Billing** (multi gateway, subscription, invoice) | `web` + `server` + ext. service | — | **P0 — MVP (PayOS only, cut scope)** |
| **T18** | **Auto Update App Player** (OTA JS + native build, channels, rollback) | `web` + `server` + `player` (EAS) | — | P2 — Phase 2 (ops scale) |

**Thay đổi so với priority gốc**:
- **Hạ thấp**: T13 (video wall) từ Cao → P3, vì "wow" nhưng không block revenue.
- **Nâng cao**: T1 (Landing) từ Thấp → P0, vì là entry point conversion.
- **Merge**: T10 + T18 → T18 Phase 2 (chưa cần thiết cho MVP SaaS đầu tiên).

> **Ghi chú về T2:** "Lấy email khách hàng + password hệ thống render ra" được hiểu là
> *sau khi tạo user (bởi admin hoặc auto từ thanh toán), hệ thống sinh mật khẩu ngẫu nhiên
> và hiển thị một lần cho admin/user copy*. Hỗ trợ trực tiếp cho luồng T1/T7 (khách không tự
> đăng ký — hệ thống tạo sẵn, gửi email kèm thông tin đăng nhập).

---

## 2. MA TRẬN PHỤ THUỘC (DEPENDENCY MAP)

```
T12 (fix video) ─┐
                 ├─►  T5 (Playlist redesign)  ──► T13 (Sync video wall)
                 │
T2  (Login/reveal) ──► T6 (User license) ──► T7 (Payment/auto-user) ──► T1 (Landing)
                                │                       │
                                │                       └─► T17 (Payment & Billing)
                                │                                  │
                                │                                  ├─ Invoice PDF
                                │                                  ├─ Subscription / Recurring
                                │                                  ├─ Dunning
                                │                                  └─ Tax / VAT
                                │
                                └─► T8 (Packaging server + License key)
                                            │
                                            ├─► T9 (Config page)
                                            │
                                            └─► T18 (Auto Update Player)
                                                      │
                                                      ├─ OTA JS (expo-updates)
                                                      ├─ Native build (EAS)
                                                      ├─ Channels (stable/beta)
                                                      └─ Force / optional / rollback

T3, T4, T15 (Quick UI)  — độc lập, làm song song
T14 (PDF)  — phụ thuộc Media filter (T3) + Player (T12 fix trước)
T11 (Deploy) — cuối cùng, sau khi 2→8 ổn định
T16 (Docs)  — cuối cùng
```

**Phụ thuộc theo component:**

| Cần làm trước     | Mở khóa cho                                |
| ----------------- | ------------------------------------------ |
| T12 (Player fix)  | T5, T14, T13, T9, T18                      |
| T2 (Login reveal) | T1, T6, T7, T8, T17 (mọi flow có user)     |
| T6 (User check)   | T7, T8, T17 (license-based billing)        |
| T3 (Media filter) | T14 (PDF là 1 filter)                      |
| T7 (Payment mgmt) | T17 (Payment & Billing đầy đủ)             |
| T8 (License gen)  | T9, T18 (server-distributed)               |
| T18 (Auto update) | T11 (deploy cần pipeline build artifact)   |

---

## 3. ROADMAP — ĐÃ ĐƯỢC RE-PLAN

> **Plan 9 sprint bên dưới đã được thay thế bởi MVP cut 3.5 tuần.**
> Xem file chính: **[`mvp_mid_august.md`](./mvp_mid_august.md)** — 7 task P0 + 2 task P1, 17 working days.
>
> Phần còn lại của file này (sau §3) là spec chi tiết Phase 2, dùng để tham khảo khi build full version sau launch.

### Sprint 0 — FOUNDATION & BUG FIX  *(Tuần 1)*
> Mục tiêu: gỡ bottleneck, có nền tảng sạch để build các flow lớn.

- **T12 — Player: Fix video chỉ phát 10s/1m**
  - File: `player/src/screens/AdPlayerScreen.tsx`
  - Nguyên nhân nghi vấn (xem memory_bank §3.3): `slide timer` fallback 10 phút nhưng
    logic `pl.length > 1 || item.type !== "video"` vẫn set timer ngắn cho 1 video đơn lẻ.
  - Hành động: dùng `playToEnd` event thay vì timer; chỉ set timer cho image/web slide.
- **T2 — Server + Web: Auto-generate password + reveal một lần**
  - `server/src/auth/auth.service.ts`: thêm `randomPassword()` khi admin tạo user hoặc
    checkout thành công; trả về `tempPassword` chỉ 1 lần qua API, không lưu plaintext.
  - `web/src/app/dashboard/admin/`: modal "Đã tạo user" hiển thị email + password + nút copy.
  - `web/src/app/register/`: nếu dùng self-register thì vẫn render lại password sau đăng ký.

### Sprint 1 — QUICK WINS  *(Tuần 2)*
> Mục tiêu: dọn UI tồn đọng, tích lũy velocity.

- **T3 — Media filter (Image/Video/PDF/Web)**: bộ lọc client-side + lưu query param.
- **T4 — Player page: bỏ filter "phê duyệt"**: đơn giản chỉ là ẩn toggle, danh sách device
  phẳng (status, online, group).
- **T15 — Setting: kiểm tra storage + USB**:
  - `player/src/screens/SettingsScreen.tsx`: thêm mục "Bộ nhớ trong / USB".
  - Dùng `expo-file-system` + `expo-usb` (hoặc intent `ACTION_GET_CONTENT` cho Android).

### Sprint 2 — PLAYLIST REDESIGN  *(Tuần 3-4)*
> Mục tiêu: T5 là task phức tạp nhất UI, làm đầu để mở khóa T13, T14.

- **T5 — Trang danh sách phát (refactor)**
  - **Mặc định đơn lẻ (single mode)** + nút bật "Đồng bộ video wall" (chuyển sang group).
  - **Scale**: 2 tùy chọn `fullscreen` / `fit-actual` (CSS `object-fit` + lưu vào layout JSON).
  - **Bỏ** input "thời gian slide" + "mô tả" khỏi form create/edit.
  - **Thêm** loại slide mới `web` (URL) — backend lưu `mediaType='web'`, lúc sync trả URL.
  - **Publish flow (sau khi lưu)**:
    - Modal "Publish to devices" — list devices của user (checkbox).
    - Mỗi device có switch `On/Off` riêng; có switch `All on/off` (chung).
    - Server: thêm bảng `PlaylistPublish(playlistId, deviceId, enabled)` hoặc dùng
      `Device.playlistId` cộng cờ `enabled` để không phá schema cũ.
  - **Player**: hỗ trợ render slide `web` bằng `WebView` (Expo `react-native-webview`).
  - **Mobile Media tab**: bỏ mục "web" khỏi Media grid, vì web chỉ là URL nhúng.

### Sprint 3 — USER & LICENSE  *(Tuần 5)*
> Mục tiêu: chuẩn hóa dữ liệu người dùng trước khi mở bán gói.

- **T6 — Trang quản lý User**
  - Bảng user hiển thị cột `Devices hiện tại / licenseLimit / Trạng thái` với badge
    `Đủ / Vượt / Thiếu`.
  - Filter theo "Đã thuê / Đã mua" (thêm field `purchaseType` enum: `rent|buy`).
  - Action: tăng/giảm license có note audit log.
  - Tách rõ `Subscription` (định kỳ) vs `Lifetime` (mua đứt) để chuẩn bị cho S4.

### Sprint 4 — PAYMENT & BILLING  *(Tuần 6-7)*  ⭐ *Sprint chuyên biệt*
> Mục tiêu: hoàn thiện business flow SaaS, kiếm tiền từ gói dịch vụ.

Xem chi tiết tại **§3A. PAYMENT METHOD & BILLING** bên dưới.

- **T1 — Landing page**:
  - Pricing table (3 gói: Basic / Pro / Enterprise), CTA "Mua ngay" → checkout flow.
  - Form thông tin công ty + số lượng license → chọn payment method.
- **T7 — Trang quản lý thanh toán (Admin)**:
  - List `Order`, `Subscription`, `Invoice`, `Refund`.
  - Filter theo trạng thái: pending / paid / failed / refunded.
  - Manual retry webhook, cancel subscription.
- **T14 — Đọc PDF trên app** (chuyển sang đây để gom content-type):
  - Media: cho phép upload PDF.
  - Player: dùng `expo-pdf` hoặc WebView + PDF.js; auto next sau N giây.
- **T17 — Payment Method & Billing** (case mới): xem §3A.

### Sprint 5 — ON-PREMISE PACKAGING  *(Tuần 8-9)*
> Mục tiêu: sản phẩm đóng gói bán cho khách tự host.

- **T8 — Đóng gói server + License key**
  - Tạo script `pnpm package` → build Docker image + kèm License Generator CLI.
  - License: file JSON ký bằng RSA private key; server verify bằng public key khi boot.
  - License chứa: `customerName`, `deviceLimit`, `expireAt`, `signature`.
  - Module NestJS `license/` đọc file, expire-time check, block register nếu vượt limit.
  - CLI tool: `npx cms-license-gen --customer "ACME" --limit 10 --months 12`.
- **T9 — Trang cấu hình** (cấu hình cho người mua server)
  - Upload background + splash image (3 kích thước) → lưu vào `Settings` table hoặc file.
  - Player pull setting qua `GET /api/player/config` (mở rộng từ `sync`).
  - Cũng cho phép set: tên tenant, logo, color theme, default language.

### Sprint 6 — AUTO UPDATE PLAYER  *(Tuần 10-11)*  ⭐ *Sprint chuyên biệt*
> Mục tiêu: vận hành — đẩy fix/feature đến hàng ngàn thiết bị không cần chạm tay.

Xem chi tiết tại **§3B. AUTO UPDATE APP PLAYER** bên dưới.

- **T10 — Remote app update (cơ bản)**: bump version + APK URL + sha256.
- **T18 — Auto Update App Player** (case mới): xem §3B.

### Sprint 7 — MULTI-DEVICE SYNC  *(Tuần 12-13)*
> Mục tiêu: tính năng cao cấp nhất.

- **T13 — Video wall sync**
  - Đã có sẵn `sync/sync.gateway.ts` với Socket.IO (xem memory_bank §4.2).
  - Web UI: khi tạo playlist, cho chọn "Video wall grid 2x2, 3x3, ..." → tính `slot index`
    cho mỗi device dựa trên thứ tự kéo thả.
  - Player: nâng cấp phát đồng bộ — đo RTT, tính `clockOffset`, master gửi epoch start
    time, slave tua về vị trí `((now - epochStart) % videoDuration)`.

### Sprint 8 — RELEASE  *(Tuần 14-16)*
> Mục tiêu: đưa sản phẩm ra ngoài.

- **T11 — Deploy web chạy thử**
  - Tài liệu: `docs/DEPLOY_RENDER.md` đã có — cập nhật theo schema mới (T6/T7/T8/T17/T18).
  - CI/CD: GitHub Actions build 3 service, push image, deploy Render/Fly.
  - Pipeline OTA: tự động chạy `eas build` → upload artifact lên storage → publish version.
- **T16 — Tài liệu hướng dẫn + Policy**
  - User guide cho SaaS (mua gói, billing portal, tạo playlist, publish).
  - Admin guide (quản lý user, license, thanh toán, refund).
  - On-Premise guide (cài server, cấp license, OTA, cấu hình).
  - Privacy Policy + Terms of Service (bắt buộc cho landing public + GDPR/PDPA).

---

## 3A. PAYMENT METHOD & BILLING  *(Sprint 4 — T17 + T1 + T7 + T14)*

> Mục tiêu: biến sản phẩm thành dịch vụ có doanh thu định kỳ (SaaS).
> Bao trùm T1 (Landing), T7 (Payment management) và mở rộng thành hệ thống Billing hoàn chỉnh.

### 3A.1 Phạm vi

```
┌──────────────────────────────────────────────────────────────────┐
│                       PAYMENT & BILLING                           │
├──────────────────────────────────────────────────────────────────┤
│  A. Payment Methods        B. Plans & Subscriptions               │
│  ─────────────────         ────────────────────────               │
│  • Stripe (global)         • Basic / Pro / Enterprise            │
│  • VNPay (VN)              • Monthly / Yearly / Lifetime          │
│  • MoMo (VN)               • Add-on: extra devices                │
│  • Bank transfer (QR)      • Trial period (7-14 ngày)             │
│  • PayPal (optional)       • Promotional codes                    │
│                                                                  │
│  C. Checkout Flow          D. Billing Portal (User self-serve)   │
│  ────────────────          ────────────────────────────          │
│  • Pricing page →          • Xem invoices                        │
│    Select plan             • Update payment method               │
│  • Form công ty            • Upgrade / downgrade plan            │
│  • Chọn payment method     • Cancel subscription                 │
│  • 3D-Secure verify        • Download VAT invoice (PDF)          │
│  • Webhook nhận kết quả    • Lịch sử thanh toán                  │
│  • Auto-create user (T2)                                       │
│  • Send credentials email                                      │
│                                                                  │
│  E. Admin Dashboard        F. Recurring & Dunning                │
│  ─────────────────         ────────────────────────              │
│  • MRR / ARR chart         • Auto-charge hàng tháng              │
│  • Churn rate              • Retry khi fail (3 lần)              │
│  • LTV estimate            • Email nhắc nợ 3/7/14 ngày           │
│  • Active subscriptions    • Suspend nếu quá hạn                 │
│  • Refund workflow         • Tax / VAT (theo region)             │
│  • Manual adjust credits                                        │
└──────────────────────────────────────────────────────────────────┘
```

### 3A.2 Schema mới (Prisma)

```prisma
model Plan {
  id            String   @id @default(cuid())
  name          String   // Basic / Pro / Enterprise
  interval      Interval // MONTHLY | YEARLY | LIFETIME
  priceCents    Int
  currency      String   @default("VND")
  deviceLimit   Int      // license đi kèm
  features      Json
  active        Boolean  @default(true)
  subscriptions Subscription[]
}

model Subscription {
  id              String   @id @default(cuid())
  userId          String
  planId          String
  status          SubStatus // TRIALING | ACTIVE | PAST_DUE | CANCELED | EXPIRED
  startedAt       DateTime
  currentPeriodEnd DateTime
  cancelAtPeriodEnd Boolean @default(false)
  paymentMethodId String?
  gateway         Gateway   // STRIPE | VNPAY | MOMO | BANK
  gatewaySubId    String?   // id phía gateway
  plan            Plan @relation(...)
  user            User @relation(...)
  invoices        Invoice[]
}

model PaymentMethod {
  id            String @id @default(cuid())
  userId        String
  gateway       Gateway
  token         String  // token hóa từ gateway (không lưu PAN)
  brand         String? // visa / momo / vnbank
  last4         String?
  expMonth      Int?
  expYear       Int?
  isDefault     Boolean @default(false)
}

model Invoice {
  id              String @id @default(cuid())
  subscriptionId  String
  userId          String
  number          String @unique  // INV-2026-0001
  amountCents     Int
  currency        String
  taxCents        Int
  status          InvoiceStatus // DRAFT | OPEN | PAID | VOID | UNCOLLECTIBLE
  issuedAt        DateTime
  paidAt          DateTime?
  pdfUrl          String?  // render ra PDF
  lineItems       Json
  subscription    Subscription @relation(...)
}

model PaymentTransaction {
  id            String @id @default(cuid())
  invoiceId     String?
  subscriptionId String?
  gateway       Gateway
  gatewayTxnId  String  @unique
  amountCents   Int
  currency      String
  status        TxStatus // PENDING | SUCCEEDED | FAILED | REFUNDED
  rawPayload    Json    // full webhook body để audit
  createdAt     DateTime @default(now())
}
```

### 3A.3 Tech stack đề xuất

| Layer        | Lựa chọn                                                |
| ------------ | -------------------------------------------------------- |
| Gateway SDK  | `stripe` (Node), `vnpay`, `momopay-node`                 |
| Webhook      | NestJS controller riêng `/webhooks/{gateway}` + HMAC verify |
| Job queue    | BullMQ + Redis (cho retry charge, email nhắc nợ)         |
| Invoice PDF  | `@react-pdf/renderer` hoặc `pdfkit`                      |
| Email        | Resend / SendGrid (đã có abstraction `MailService` từ T2) |
| Frontend     | Stripe Elements cho card; redirect cho VNPay/MoMo/Bank    |

### 3A.4 Checklist giao hàng Sprint 4

- [ ] Pricing page public, 3 plan, CTA → checkout
- [ ] Checkout flow với ≥ 2 payment method (Stripe + 1 local)
- [ ] Webhook endpoint xác minh chữ ký + idempotency
- [ ] Auto-create user + license + send email (kết nối T2)
- [ ] Subscription table + cron auto-renew (BullMQ)
- [ ] Dunning email sequence (3, 7, 14 ngày quá hạn)
- [ ] User billing portal: xem invoice, cancel, update card
- [ ] Admin dashboard: MRR, churn, danh sách subscription
- [ ] Invoice PDF generation + download
- [ ] Refund flow (admin only)
- [ ] Test E2E với Stripe test mode + VNPay sandbox

---

## 3B. AUTO UPDATE APP PLAYER  *(Sprint 6 — T18 + T10)*

> Mục tiêu: tự động đẩy bản cập nhật đến mọi thiết bị Player đang chạy,
> không cần OTA thủ công hay cắm USB. Bắt buộc cho vận hành ở quy mô lớn.

### 3B.1 Hai tầng cập nhật

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AUTO UPDATE APP PLAYER                           │
├──────────────────────────────┬──────────────────────────────────────┤
│   TẦNG 1 — OTA JS Update     │   TẦNG 2 — Native Build (EAS)        │
│   (expo-updates)             │   (eas build + APK)                  │
├──────────────────────────────┼──────────────────────────────────────┤
│ ✓ Không cần Google Play      │ ✓ Sửa lỗi native (Player, codec)    │
│ ✓ Tải JS bundle mới          │ ✓ Đổi SDK / permission               │
│ ✗ Không sửa code native      │ ✗ Phải cài đè APK                    │
│ ✗ Không đổi dependency       │ ✗ Cần EAS account ($99/tháng Apple)  │
│   native                     │                                      │
│ Thời gian: ~30s/100 devices  │ Thời gian: 5-15 phút/100 devices    │
└──────────────────────────────┴──────────────────────────────────────┘
```

### 3B.2 Phạm vi chi tiết

#### 1. Update Channels
```
stable ──► Mặc định cho thiết bị production
beta   ──► 5% thiết bị đăng ký early-access
canary ──► Thiết bị nội bộ team dev
```
- Dashboard admin chọn channel cho từng nhóm thiết bị.
- Player check channel khi sync → chỉ tải version cùng channel.

#### 2. Update Manifest (server-side)
```prisma
model AppRelease {
  id           String   @id @default(cuid())
  channel      Channel  // STABLE | BETA | CANARY
  version      String   // "1.4.2"
  buildNumber  Int      // monotonic
  platform     Platform // ANDROID | IOS
  updateType   UpdateType  // OTA_JS | NATIVE
  artifactUrl  String   // CDN URL
  sha256       String
  sizeBytes    Int
  mandatory    Boolean  @default(false)  // force update
  minSupportedVersion String?  // chặn version quá cũ
  releaseNotes String?
  publishedAt  DateTime
  rolledBack   Boolean  @default(false)
}
```

#### 3. Player-side Flow
```
1. Sync → GET /api/player/app-update?channel=stable&platform=android
2. Nếu AppRelease.buildNumber > currentBuildNumber:
     a. Nếu mandatory → dialog "Bắt buộc cập nhật" + block playback
     b. Nếu optional → notification "Có bản mới" + Snooze
3. Download artifact về /updates/<version>.bundle (OTA) hoặc .apk
4. Verify SHA256 trước khi apply
5. Apply: expo-updates.reload() (OTA) hoặc Intent.INSTALL_PACKAGE (APK)
6. Report kết quả về server: POST /api/player/app-update/ack
```

#### 4. Rollback & Crash Detection
- Track crash rate per release qua `DeviceCrashReport` (client gửi 5 phút/lần).
- Nếu crashRate > threshold → auto rollback (set `rolledBack=true`,
  thiết bị sẽ tải lại version trước).
- Dashboard hiển thị adoption chart: % thiết bị đã lên version mới.

#### 5. Server API

| Endpoint                                  | Method | Mục đích                          |
| ----------------------------------------- | ------ | --------------------------------- |
| `/api/player/app-update`                  | GET    | Player check bản mới              |
| `/api/player/app-update/ack`              | POST   | Player báo cáo apply xong         |
| `/api/admin/releases`                     | GET    | Admin list releases               |
| `/api/admin/releases`                     | POST   | Publish release mới               |
| `/api/admin/releases/:id/rollback`        | POST   | Rollback release                  |
| `/api/admin/devices/channels`             | PUT    | Gán channel cho device/nhóm       |

### 3B.3 Tech stack

| Layer          | Lựa chọn                                          |
| -------------- | -------------------------------------------------- |
| OTA JS         | `expo-updates`, `expo-dev-client`                  |
| Native build   | `eas build --platform android` (GitHub Action)     |
| Artifact host  | Cloudflare R2 / S3 (signed URL, không public)      |
| Version check  | Server trả JSON manifest; Player so `buildNumber`  |
| Crash report   | Sentry SDK hoặc custom POST                        |
| Dashboard      | Bảng releases + nút Publish / Rollback             |

### 3B.4 Checklist giao hàng Sprint 6

- [ ] `expo-updates` configured với EAS Update
- [ ] GitHub Action tự động chạy `eas build` khi merge `main`
- [ ] Artifact upload lên R2/S3 với SHA256 + signed URL
- [ ] Server endpoint `/api/player/app-update` trả manifest
- [ ] Player check update mỗi 6 giờ (hoặc khi boot)
- [ ] Force update cho version quá cũ (`minSupportedVersion`)
- [ ] Optional update với Snooze
- [ ] Auto rollback khi crash rate > threshold
- [ ] Admin UI publish release + chọn channel + release notes
- [ ] Adoption dashboard (% thiết bị trên mỗi version)
- [ ] Test thành công OTA JS (5 thiết bị trong 5 phút)
- [ ] Test thành công native build (APK tự cài đè)

### 3B.5 Rủi ro & giảm thiểu

| Rủi ro                                              | Giảm thiểu                                                      |
| --------------------------------------------------- | --------------------------------------------------------------- |
| EAS giới hạn bandwidth / queue                     | Có gói trả phí; hoặc tự host OTA server riêng                  |
| User từ chối cập nhật quá lâu, lỗi bảo mật tồn đọng | Set `minSupportedVersion`, cảnh báo trước 7 ngày                |
| APK install fail do signing mismatch                | Cùng keystore cho mọi bản; kiểm tra `v1+v2+v3` signature scheme |
| Crash sau khi OTA JS (do bug mới)                   | Rollback qua `expo-updates`, giữ bản cũ trong cache 1 tuần      |
| Mạng chập chờn ở thiết bị field                    | Chỉ tải khi WiFi + pin > 30% + idle (không phát)               |

---

## 4. WORKSTREAM

> **MVP cut 1 dev fullstack — không parallel.** Xem `mvp_mid_august.md` §8.
> Phần workstream song song bên dưới chỉ áp dụng khi build **Phase 2** sau khi có thêm người.

| Track      | Owner  | Sprint chính                                  | Phạm vi                                                         |
| ---------- | ------ | --------------------------------------------- | --------------------------------------------------------------- |
| **BE-A**   | Dev 1  | S0 → S8 liên tục                              | Auth, License, Subscription, Payment webhook, OTA manifest, Sync gateway |
| **FE-W**   | Dev 1  | S1 → S8                                       | Web Dashboard: filter, playlist UI, publish, config, billing portal, admin |
| **FE-P**   | Dev 2  | S0 (T12) + S2 (T5 webview) + S4 (T14 PDF) + S6 (T18 update flow) + S7 (T13 sync) | Player app |
| **PAYMNT** | Dev 1  | S4                                            | Stripe/VNPay/MoMo integration, webhook, invoice PDF, dunning    |
| **DEVOPS** | Dev 1  | S5 + S6 + S8                                  | EAS Build pipeline, R2/S3 upload, Docker packaging, CI/CD       |
| **DOC**    | All    | S8                                            | User guide, on-prem guide, policy                               |

> Nếu chỉ 1 dev fullstack: làm tuần tự theo thứ tự Sprint 0 → 8, mỗi sprint cuối đều có
> bản chạy được trên local. Ưu tiên tập trung vào S4 (kiếm tiền) và S6 (vận hành) — đây là
> hai trụ cột để scale.

---

## 5. RISK & OPEN QUESTIONS

> **Top 5 risks cho MVP cut xem `mvp_mid_august.md` §5.**
> Danh sách 16 rủi ro bên dưới là dài hạn cho Phase 2+.

| #  | Rủi ro / Câu hỏi                                                                                | Gợi ý giải quyết                                                              |
| -- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| 1  | Cổng thanh toán nào cho T17? → **ĐÃ CHỌN: PayOS** (cho MVP SaaS VN)                          | PayOS cover ATM/QR/Visa/MC/MoMo/ZaloPay trong 1 SDK. Phase 2 add VNPay/Stripenếu cần. |
| 2  | T2 "render password" có cần gửi qua email không?                                                 | Có — tích hợp SMTP/SendGrid. Tạo abstraction `MailService` từ Sprint 0.       |
| 3  | T5 publish flow: dùng schema mới hay extend schema cũ?                                          | Đề xuất: extend `Device` thêm `playlistEnabled` boolean, tránh JOIN.         |
| 4  | T8 license có cần tích hợp payment không, hay tách riêng?                                       | Tách riêng — license là file, payment sinh license. Có thể manual cho POC.   |
| 5  | T18 OTA: Expo Go có hỗ trợ cài APK ngoài không?                                                 | Phải build standalone (`eas build -p android`), cần EAS account trả phí ($99/tháng cho iOS, Android miễn phí). |
| 6  | T13 sync yêu cầu NTP-like clock. Có dùng dịch vụ ngoài?                                        | Đo RTT giữa client-server, không cần dịch vụ ngoài.                           |
| 7  | T9 "background" — chỉ app player hay cả web dashboard?                                          | Clarify: theo mô tả là "khi mở app" → chỉ áp dụng cho Player.                |
| 8  | T15 USB: Android 11+ hạn chế truy cập USB mass storage.                                         | Dùng SAF (Storage Access Framework) qua intent hoặc `expo-document-picker`.   |
| 9  | T1 Landing page có cần đa ngôn ngữ (i18n)?                                                       | Cân nhắc: nếu bán cho Việt Nam, có thể chỉ cần VI ở MVP.                     |
| 10 | Thiếu phân quyền cho "đối tác" (sub-user trong 1 tenant) — có cần làm trong sprint này?          | Hiện tại không nằm trong 18 task → defer sang Phase 7.                       |
| 11 | **T17**: Webhook idempotency — nếu gateway retry thì có tạo duplicate subscription không?       | Dùng `gatewayTxnId` unique constraint + check trước khi insert.               |
| 12 | **T17**: Subscription cancel có refund proration không?                                            | Tùy chính sách — bắt đầu đơn giản: cancel = hết hạn cuối kỳ, không refund.   |
| 13 | **T17**: VAT/Tax theo region — làm từ đầu hay defer?                                             | Nếu bán trong nước VN → dùng VAT config cố định 10%. Quốc tế → dùng Stripe Tax. |
| 14 | **T18**: Crash detection cần Sentry hay tự build?                                                 | Tự build đơn giản (POST + counter), Sentry chỉ cần khi scale > 1k devices.   |
| 15 | **T18**: Khi OTA JS update, làm sao bảo toàn state của player đang phát?                         | `expo-updates.reload()` chấp nhận mất state — schedule update ở idle slot.    |
| 16 | **T18**: Phân biệt mandatory update (security) vs feature update (UX)                              | `minSupportedVersion` cho security; UI banner cho feature.                    |

---

## 6. CHECKLIST NGHIỆM THU TỪNG SPRINT

Mỗi sprint cuối phải đáp ứng:
- [ ] Code merged vào `main`, build thành công.
- [ ] Test thủ công flow chính trên local (docker compose + 2 thiết bị).
- [ ] Cập nhật `memory_bank.md` mục 3 (Done) và 4 (Pending).
- [ ] Demo cho stakeholder 5 phút.
- [ ] Có screenshot / video ngắn cho từng task hoàn thành.

---

## 7. CẬP NHẬT `memory_bank.md` SAU SPRINT

Sau mỗi sprint, tick `[x]` cho task hoàn thành vào mục **4. BACKLOG** của `memory_bank.md`,
đồng thời chuyển sang mục **3. COMPLETED**. Giữ tài liệu là **single source of truth**.

---

*Tạo bởi: opencode planning — dựa trên codebase hiện tại (`server/`, `web/`, `player/`) và
backlog đã ghi trong `memory_bank.md`.*
