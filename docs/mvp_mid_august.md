# MVP RELEASE PLAN — TARGET 15/08/2026

> **File chính thức cho 3.5 tuần tới.** File `roadmap_phase2.md` chứa spec chi tiết cho Phase 2 (sau khi MVP live).

---

## 0. CONTEXT

| Mục | Giá trị |
| --- | --- |
| Hôm nay | 23/07/2026 (Thu) |
| Deadline | **15/08/2026 (Sat) — public launch trực tiếp** (không soft launch) |
| Team | **1 dev full-stack** |
| Tiêu chí | **Business Value first** (kiếm tiền sớm, cắt được) |
| Có thể cắt | Có — ưu tiên ship hơn perfect |
| Payment gateway MVP | **PayOS** 🇻🇳 (ATM + Visa/MC + MoMo + ZaloPay + QR trong 1 integration) |
| Email service | **Resend** (3 phút setup, 100 email/ngày free) |
| Thị trường | **Việt Nam** (priority cho local payment + ngân hàng nội địa) |

---

## 0.1. ⚡ ACTION ITEMS — LÀM NGAY HÔM NAY (D1 = 23/07)

> Một số thứ cần đăng ký/verify trước khi code. **Làm trong hôm nay** để không trễ D8 (khi bắt đầu tích hợp PayOS).

| # | Hành động | Thời gian | Tại sao critical |
| --- | --- | --- | --- |
| 1 | **Đăng ký PayOS merchant**: https://payos.vn → Dashboard → lấy `Client ID`, `API Key`, `Checksum Key` (sandbox + production) | 30 phút (sandbox ngay); 1-3 ngày (production KYC) | D11 cần tích hợp PayOS SDK. Sandbox có sẵn nhưng production cần verify giấy phép KD. |
| 2 | **Đăng ký Resend**: https://resend.com → tạo API key, verify domain (dùng subdomain `mail.cms.example.com` nếu có) | 15 phút | D13 cần gửi email credentials. Resend free tier 100 email/ngày đủ cho 5-10 khách đầu. |
| 3 | **Tạo tài khoản ngân hàng doanh nghiệp** (nếu chưa có) | Phụ thuộc bank | PayOS settle về tài khoản doanh nghiệp. Cá nhân có thể được nhưng bị delay. |
| 4 | **Verify domain** cho landing page (nếu dùng domain riêng): mua ở Namecheap/VietnamHost + trỏ DNS về Render | 1-2 giờ | Tránh dùng `yourapp.onrender.com` cho landing — không chuyên nghiệp. |
| 5 | **Setup GitHub repo** (nếu chưa): branch protection, CI hook cho auto-deploy | 30 phút | Auto-deploy mỗi commit lên Render preview. |

> **Cảnh báo**: Nếu không hoàn thành item #1 (PayOS KYC) trong tuần này, plan B là dùng PayOS **sandbox** cho đến khi production approve, rồi switch DNS.

---

## 0.2. PAYMENT GATEWAY: TẠI SAO PAYOS

> Phân tích nhanh các cổng thanh toán phổ biến tại VN để chọn cho MVP.

### Bảng so sánh

| Gateway | Methods hỗ trợ | Fee | Settlement | API quality | KYC time | Phù hợp MVP? |
| --- | --- | --- | --- | --- | --- | --- |
| **PayOS** 🇻🇳 | ATM/IB 40+ bank, Visa/MC, MoMo, ZaloPay, QR | 1.5-2% | T+1 | ⭐⭐⭐⭐⭐ Modern REST, docs TV, sandbox instant | 1-3 ngày | **✅ CHỌN** |
| **VNPay** 🇻🇳 | 40+ bank ATM/IB, QR | 1.5-2.5% | T+1-3 | ⭐⭐⭐ SDK truyền thống, sandbox OK | 3-5 ngày | ⚠️ Backup |
| **MoMo** 🇻🇳 | Chỉ ví MoMo | 1.5-2.2% | T+1 | ⭐⭐⭐⭐ Docs TV tốt | 3-5 ngày | ❌ Subset |
| **ZaloPay** 🇻🇳 | ZaloPay + linked banks | 1.5-2% | T+1 | ⭐⭐⭐⭐ | 3-5 ngày | ❌ Subset |
| **Sepay** 🇻🇳 | Chuyển khoản ngân hàng (tự động) | 0.3-1% hoặc free | Real-time | ⭐⭐⭐⭐ Webhook đơn giản | 1 ngày | ⚠️ Cho B2B invoice |
| **Stripe** 🌏 | Visa/MC/Amex toàn cầu | 2.9% + $0.30 + 1% FX | T+7 | ⭐⭐⭐⭐⭐ Best DX | Phức tạp (offshore) | ❌ Đắt + khó KYC VN |

### Tại sao PayOS cho MVP

1. **All-in-one**: 1 integration → 5+ phương thức thanh toán. Khách VN có thể trả bằng:
   - QR ngân hàng (Vietcombank, Techcombank, MB, ACB, ...)
   - ATM/Internet Banking
   - Ví MoMo, ZaloPay
   - Thẻ quốc tế Visa/MC
2. **API modern**: REST + JSON, webhook có retry, idempotency hỗ trợ sẵn. Dev onboarding ~1 ngày.
3. **Sandbox instant**: tạo test transaction ngay không cần KYC thật. Test E2E trong 2 giờ.
4. **Chi phí thấp**: 1.5-2% cạnh tranh vs Stripe 2.9% + FX.
5. **VN-first**: công ty VN, hỗ trợ tiếng Việt, KYC theo giấy phép KD VN, settle về tài khoản ngân hàng VN.
6. **Webhook chuẩn**: có signature verify (HMAC SHA-256) + retry policy tương tự Stripe.

### Khi nào dùng các cổng khác (Phase 2+)

| Tình huống | Dùng |
| --- | --- |
| Cần phủ thêm Visa/MC ngoài PayOS | Stripe (sau khi onboard) |
| Khách B2B muốn chuyển khoản + tự động match | Sepay |
| Khách đòi MoMo riêng (loyalty) | MoMo gateway riêng |
| Khách đòi VNPay QR (mainstream) | VNPay |

### Setup cần thiết cho PayOS (1-3 ngày)

1. Đăng ký tại **payos.vn** → chọn gói (Starter free / Pro theo volume)
2. Verify giấy phép kinh doanh + CMND/CCCD chủ doanh nghiệp
3. Nhận **Client ID** + **API Key** + **Checksum Key** (production + sandbox)
4. Tạo webhook URL: `https://api.cms.example.com/webhooks/payos`
5. Test với thẻ ngân hàng test hoặc QR test

**Total effort**: 30 phút (sandbox) + 1-3 ngày chờ KYC production.

---

## 1. TRIAGE — MoSCoW

### ✅ MUST (P0) — 7 task, ship bắt buộc

| ID | Task | Lý do business | Days |
| --- | --- | --- | --- |
| **T12** | Fix video chỉ phát 10s/1m | App đang broken → demo khách = mất credibility | 1.5 |
| **T2**  | Login + auto-reveal password | Foundation cho mọi flow (T1/T6/T7) | 1 |
| **T5**  | Playlist redesign (minimum) | Core UX: web embed + publish flow | 3 |
| **T6**  | User license check | Revenue protection — chặn vượt license | 1 |
| **T1**  | Landing page + checkout | Conversion entry — entry point mua gói | 2 |
| **T17** | Payment & Billing (PayOS only) | **Trực tiếp kiếm tiền** | 5 |
| **T11** | Deploy (Render) | Không deploy = không launch | 1 |
| | | **Subtotal** | **14.5** |

### 🟡 SHOULD (P1) — 2 task, làm nếu còn time

| ID | Task | Lý do | Days |
| --- | --- | --- | --- |
| **T7**  | Payment admin view (basic) | Ops nhìn danh sách subscription | 1 |
| **T16** | Quick start doc (minimal) | Customer self-serve giảm support | 0.5 |
| | | **Subtotal** | **1.5** |

### 🟢 COULD (P2) — Phase 2 sau launch

| ID | Task | Defer vì |
| --- | --- | --- |
| T3  | Media filter | Cosmetic, low BV |
| T14 | PDF trên app | Có thể bù bằng "image of PDF" tạm thời |
| T8  | License gen (on-prem) | MVP SaaS-only, chưa bán server |
| T9  | Config page | On-prem only |
| T18 | Auto Update Player | Critical cho ops nhưng không block revenue |

### 🔴 WON'T (P3) — Phase 3 hoặc không làm

| ID | Task | Defer vì |
| --- | --- | --- |
| T4  | Player filter bỏ "phê duyệt" | Cosmetic |
| T10 | OTA basic (đã absorb vào T18) | Phase 3 |
| T13 | Video wall sync | Wow feature, post-launch |
| T15 | USB | Edge case, low BV |

**Tổng effort MVP: 16 ngày + 1 ngày buffer = 17 working days. ✅**

---

## 2. ROADMAP — TUẦN 1 → 3

### 📅 Week 1 (23-31/07, 7 ngày) — FOUNDATION

| Day | Date | Task | Output |
| --- | --- | --- | --- |
| **D1** | Thu 23/07 | **T12** Fix video: dùng `playToEnd` event thay timer | Video chạy hết trên 3 file test |
| **D2** | Fri 24/07 | **T12** (cont) test trên 3 thiết bị + edge case | Smoke test pass |
| **D3** | Mon 27/07 | **T2** `randomPassword()` + modal "Đã tạo user" | Admin tạo user → render 1 lần password |
| **D4** | Tue 28/07 | **T5.1** Playlist UI: web embed type, default single mode | Web slide render được |
| **D5** | Wed 29/07 | **T5.2** Publish flow: modal chọn devices + on/off per device | Lưu playlist → publish thành công |
| **D6** | Thu 30/07 | **T5.3** Polish publish flow + scale option (fullscreen/fit) | UX mượt |
| **D7** | Fri 31/07 | **T6** User page: badge `Đủ / Vượt / Thiếu` license | Admin thấy rõ license status |

**End of Week 1 deliverable**: Player chạy đúng + user mgmt ổn + playlist publish được.

---

### 📅 Week 2 (03-08/08, 5 ngày) — REVENUE FRONT-END

| Day | Date | Task | Output |
| --- | --- | --- | --- |
| **D8**  | Mon 03/08 | **T1.1** Landing: hero + 1 pricing tier + CTA | Public page accessible |
| **D9**  | Tue 04/08 | **T1.2** PayOS Checkout integration (hosted) | Click "Mua" → redirect PayOS → success URL |
| **D10** | Wed 05/08 | **T11** Deploy: Render blueprint, env vars, build web + server | URL public hoạt động |
| **D11** | Thu 06/08 | **T17.1** Schema: `Plan`, `Subscription`, `Invoice`, `Transaction` + migration | DB ready |
| **D12** | Fri 07/08 | **T17.2** PayOS webhook endpoint + HMAC verify + idempotency | `/webhooks/payos` nhận event |

**End of Week 2 deliverable**: Khách truy cập landing → PayOS → nhận email account. (Chưa cần admin polish.)

---

### 📅 Week 3 (10-15/08, 5 ngày) — BACKEND + POLISH

| Day | Date | Task | Output |
| --- | --- | --- | --- |
| **D13** | Mon 10/08 | **T17.3** Webhook → auto-create user + license + send email (kết nối T2) | E2E: pay → user exists → email delivered |
| **D14** | Tue 11/08 | **T17.4** E2E test: PayOS sandbox → mua 5 devices → login thành công | Smoke test 100% pass |
| **D15** | Wed 12/08 | **T7** Admin: bảng list subscription + filter by status | Admin thấy danh sách KH đã trả |
| **D16** | Thu 13/08 | **T16** Quick start doc + T17 edge cases (refund, failed payment) | README + 1 FAQ |
| **D17** | Fri 14/08 | **Buffer** — fix bug phát sinh + final smoke test | Cả team nội bộ test E2E |

**🚀 RELEASE: 15/08/2026 (Sat)** — Soft launch tới 5-10 khách đầu tiên.

---

## 3. CUT SCOPE — CẮT GÌ ĐỂ VỪA DEADLINE

### T17 (Payment & Billing) — cắt từ §3A đầy đủ xuống MVP:

| Tính năng | MVP | Phase 2 |
| --- | :---: | :---: |
| PayOS Checkout (hosted) — ATM/QR/Visa/MC/MoMo/ZaloPay | ✅ | ✅ |
| Webhook tự động tạo user | ✅ | ✅ |
| Subscription monthly | ✅ | ✅ |
| Subscription yearly / lifetime | ❌ | ✅ |
| Dunning email (3/7/14 ngày) | ❌ | ✅ |
| Invoice PDF | ❌ (dùng PayOS receipt) | ✅ |
| Refund workflow UI | ❌ (admin xử tay qua PayOS dashboard) | ✅ |
| Multi-currency (USD, EUR...) | ❌ (VND only) | ✅ |
| Tax / VAT engine | ❌ | ✅ |
| MRR / churn dashboard | ❌ | ✅ |
| Trial period (7-14 ngày) | ❌ | ✅ |
| Resend email cho credentials | ✅ | ✅ |

**Lý do cắt**: mỗi gateway tích hợp mất 2-3 ngày; dunning cần cron + email template + testing = 1 tuần; tax engine = 1 tuần. Cộng lại không kịp 15/08.

### T5 (Playlist) — cắt từ spec đầy đủ:

| Tính năng | MVP | Phase 2 |
| --- | :---: | :---: |
| Single mode mặc định | ✅ | ✅ |
| Web embed type | ✅ | ✅ |
| Publish flow (devices + on/off) | ✅ | ✅ |
| Scale option (fullscreen/fit) | ✅ | ✅ |
| Bỏ slide duration input | ❌ (giữ nhưng optional) | ✅ |
| Bỏ description field | ❌ (giữ nhưng hide UI) | ✅ |
| Slide `pdf` type | ❌ | ✅ (T14) |
| Slide `template` type (Phase 1 có) | ❌ | ✅ |

### T1 (Landing) — cắt từ spec:

| Phần | MVP | Phase 2 |
| --- | :---: | :---: |
| Pricing 1 tier (Pro) | ✅ | 3 tier |
| CTA → PayOS Checkout | ✅ | ✅ |
| FAQ / testimonials | ❌ | ✅ |
| Đa ngôn ngữ (i18n) | ❌ (VI only) | ✅ |
| Blog / SEO content | ❌ | ✅ |

---

## 4. SUCCESS METRICS — KHI NÀO GỌI LÀ "RELEASE OK"

### Functional (must pass trước khi release)

- [ ] **T12**: Video 3 file khác nhau (mp4 720p, mp4 1080p, mov) chạy **hết 100%** không bị cut
- [ ] **T2**: Admin tạo user → modal hiện email + random password → user login thành công
- [ ] **T5**: Tạo playlist 3 slide (image + video + web URL) → publish → 2 thiết bị phát đúng
- [ ] **T6**: User vượt license (gán device thứ 6 khi limit 5) → server reject
- [ ] **T1+T17**: Click "Mua Pro" trên landing → PayOS Checkout (sandbox) → webhook → user tự tạo → email nhận credentials → login thành công trong **< 60 giây**
- [ ] **T7**: Admin thấy subscription mới trong danh sách
- [ ] **T11**: URL public https://cms.example.com truy cập được, login + dashboard load < 3s

### Non-functional

- [ ] Không có console error / warning đỏ
- [ ] Database backup tự động mỗi ngày
- [ ] PayOS webhook có retry policy + log

### Business (đo sau 1 tuần release)

- **5-10 khách** đăng ký trial / mua gói đầu tiên
- **0 chargeback / refund** trong tuần đầu
- **Email credentials** delivery rate > 95%

---

## 5. TOP 5 RISKS + MITIGATION

| # | Risk | Impact | Mitigation |
| --- | --- | --- | --- |
| 1 | **PayOS integration kéo dài > 5 ngày** (do webhook edge case, signature verify, KYC delay) | Trễ release | Dùng **PayOS Checkout hosted** (redirect URL, ít code). Tránh tự build form. Nếu vẫn chậm → chuyển sang **PayOS sandbox + manual activation** (admin kích hoạt user qua dashboard sau khi nhận tiền). |
| 2 | **T5 publish flow phức tạp hơn dự kiến** (multi-device state, race condition) | Trễ release | MVP chỉ hỗ trợ **1 device per playlist** + flag enable/disable đơn giản. Multi-device batch → Phase 2. |
| 3 | **Resend chưa verify domain** | Email bounce hoặc vào spam | Dùng **Resend free tier** không cần domain (gửi từ `onboarding@resend.dev`). Verify domain sau 1 tuần. Backup: log credentials ra console + admin copy manual. |
| 4 | **Deploy lên Render gặp vấn đề** (env, build, port) | Không release được | Đã có sẵn `docs/DEPLOY_RENDER.md` — follow blueprint. Nếu fail → dùng **Railway** (alternative). Dự phòng 0.5 ngày (D17). |
| 5 | **Bug critical phát sinh ngày cuối** + **không có soft launch** | Cản release | D17 (Fri 14/08) là buffer day duy nhất. Nếu phát hiện bug nghiêm trọng tối T7 (14/08) → **delay launch 1 ngày sang 16/08 (Sun)** để fix. KHÔNG launch với bug blocking. |

---

## 6. RELEASE CHECKLIST (D-1 = 14/08)

- [ ] Tất cả P0 task done + merged `main`
- [ ] PayOS sandbox E2E: 3 lần mua thành công liên tiếp
- [ ] Tạo **test plan** tự động: Postman collection / curl script cho các flow chính
- [ ] Database **seed** data: 1 admin, 1 user trial, 1 device, 1 playlist demo
- [ ] Backup DB: `pg_dump` trước launch
- [ ] ENV vars đầy đủ trên Render: `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `RESEND_API_KEY`, `DATABASE_URL`, `REDIS_URL`
- [ ] Monitoring: bật log capture trên Render (free tier có sẵn)
- [ ] **Rollback plan**: giữ image Docker build cũ, nếu lỗi → redeploy trong 5 phút
- [ ] Thông báo nội bộ: link landing + admin credentials cho 3-5 người test (chỉ làm nếu còn time, không phải soft launch chính thức)
- [ ] FAQ nhanh cho 5 câu hỏi khách hay hỏi (gửi kèm email credentials)
- [ ] **Checklist riêng cho "no soft launch"**:
  - [ ] Đã chuẩn bị sẵn 1 hotline/Zalo để nhận feedback khách trong 24h đầu
  - [ ] Dev available 8h liên tục ngày 15-16/08 để fix bug nóng
  - [ ] Đã có status page đơn giản (Google Sheet) để track uptime/issues
  - [ ] Không có campaign marketing/email blast trong 3 ngày đầu (tránh flood)

---

## 7. PHASE 2 BACKLOG (sau 15/08, sẽ re-plan)

> Sau khi MVP live ổn định 1-2 tuần, đánh giá lại user feedback rồi chọn từ list này.
> Spec chi tiết xem `roadmap_phase2.md`.

| ID | Task | Priority | Effort |
| --- | --- | --- | --- |
| T8  | License gen (on-prem packaging) | HIGH | 2 tuần |
| T9  | Config page (background, splash) | MED | 1 tuần |
| T3  | Media filter UI | LOW | 2 ngày |
| T14 | PDF trên app | MED | 1 tuần |
| T4  | Player filter cleanup | LOW | 0.5 ngày |
| T13 | Video wall sync | HIGH | 2-3 tuần |
| T15 | USB storage | LOW | 3 ngày |
| T18 | Auto Update Player | HIGH | 2-3 tuần |
| —  | VNPay / MoMo integration | MED | 1 tuần mỗi cái |
| —  | Invoice PDF | LOW | 3 ngày |
| —  | Multi-plan (Basic/Pro/Enterprise) | MED | 1 tuần |
| —  | Yearly + lifetime subscription | MED | 3 ngày |
| —  | Trial period (7-14 ngày) | MED | 1 tuần |
| —  | Dunning email sequence | MED | 1 tuần |
| —  | MRR / churn dashboard | LOW | 1 tuần |
| —  | Refund UI workflow | LOW | 3 ngày |

---

## 8. WORKSTREAM — 1 DEV FULL-STACK

Vì 1 người, mọi task đều **sequential** (không parallel). Mỗi task thường chạm 2 layer:

```
┌─────────────────────────────────────────────────────┐
│ BE (NestJS + Prisma)   ── 60% thời gian            │
│   • Schema migration                                │
│   • API endpoint + validation                       │
│   • Webhook + background job                        │
│   • Email service abstraction                       │
├─────────────────────────────────────────────────────┤
│ FE (Next.js + Tailwind) ── 30% thời gian            │
│   • Form / list / modal UI                          │
│   • API client (fetch + SWR)                        │
│   • PayOS redirect / hosted checkout page             │
├─────────────────────────────────────────────────────┤
│ Player (Expo) + DevOps ── 10% thời gian             │
│   • Fix bug T12                                     │
│   • WebView cho T5                                  │
│   • Deploy + ENV                                    │
└─────────────────────────────────────────────────────┘
```

**Quy tắc làm việc**:
- Sáng: code BE → test API qua Postman/curl
- Chiều: code FE → test browser
- Tối (optional): fix bug + deploy
- Commit mỗi task xong → push → auto-deploy preview trên Render

---

## 9. DAILY STANDUP (chỉ mình bạn)

Mỗi tối viết 1 dòng vào `memory_bank.md` mục mới **§8. PROGRESS LOG**:

```
2026-07-23: T12 fix video — replaced timer with playToEnd event, test 2/3 files pass
2026-07-24: T12 done — 3/3 files play full, commit a1b2c3
2026-07-27: T2 login reveal — randomPassword util + admin modal done, backend 80%
...
```

---

*Ngày tạo: 23/07/2026. Cập nhật mỗi cuối ngày. Re-plan sau khi release 15/08.*
