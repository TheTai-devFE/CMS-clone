# 🚀 Hướng dẫn Deploy CMS Server lên Render

## 📋 Chuẩn bị

### 1. Push code lên GitHub
```bash
cd /Users/huynhtanphat/Documents/Tai/CMS-clone
git add .
git commit -m "chore: add Dockerfile and production config for Render deployment"
git push origin main
```

### 2. Chuẩn bị Environment Variables

Bạn đã có sẵn **Neon PostgreSQL** và **Cloudflare R2** trong `.env`, chỉ cần thêm **Redis**.

**Tạo Redis Free trên Upstash** (khuyến nghị):
1. Truy cập https://upstash.com
2. Sign up → **Create Database**
3. Chọn **Redis** → Region: Singapore
4. Copy 3 giá trị:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

Hoặc dùng biến Redis truyền thống:
   - `REDIS_HOST`
   - `REDIS_PORT`
   - `REDIS_PASSWORD`
     UPSTASH_REDIS_REST_URL="https://fine-hamster-126259.upstash.io"
     UPSTASH_REDIS_REST_TOKEN="gQAAAAAAAe0zAAIgcDExOGM3MTJmMGQwNmY0N2MxYjM5ZTA0NmYwZDM5YWQ1Yw"
---

## 🎯 Deploy Server lên Render

### Bước 1: Tạo Web Service

1. Truy cập https://render.com/dashboard
2. **New → Web Service**
3. Connect repository GitHub của bạn
4. Cấu hình:

| Setting | Value |
|---------|-------|
| **Name** | `cms-api-server` |
| **Region** | Singapore (gần Việt Nam nhất) |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | `Docker` |
| **Instance Type** | **Free** (hoặc Standard $7/tháng) |

### Bước 2: Cấu hình Environment Variables

Trong tab **Environment** của service, thêm các biến sau:

```env
# Database (đã có sẵn từ Neon - copy từ server/.env)
DATABASE_URL=postgresql://neondb_owner:npg_Imtn2SrhB3d@ep-cool-glade-ao3ltlgt-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Redis (từ Upstash Free)
REDIS_HOST=your-redis-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT (THAY ĐỔI thành giá trị ngẫu nhiên mạnh!)
JWT_SECRET=super-secret-jwt-key-change-this-to-random-string-123456789
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Storage (đã có sẵn Cloudflare R2 - copy từ server/.env)
STORAGE_TYPE=r2
UPLOAD_DIR=./images

CLOUDFLARE_R2_ACCESS_KEY_ID=4f0e592f71b3adea7ef94a9660694e9d
CLOUDFLARE_R2_SECRET_ACCESS_KEY=6e13e38dc17176b3c9d8ae9e74985a1bde850036105c766577e4f915c0d8521c
CLOUDFLARE_R2_BUCKET_NAME=signal
CLOUDFLARE_R2_ENDPOINT=https://ec20eaab3df047ea58e8c200db7a068a.r2.cloudflarestorage.com
CLOUDFLARE_R2_PUBLIC_URL=https://pub-561bc66165e84df2b3293d6d7e26f366.r2.dev

# CORS (thêm domain production của bạn sau)
ALLOWED_ORIGINS=http://localhost:3001
```

> **💡 Mẹo**: Mở file `server/.env` để copy chính xác các giá trị `DATABASE_URL` và `CLOUDFLARE_R2_*`

### Bước 3: Deploy

1. Click **Create Web Service**
2. Render sẽ tự động build và deploy (~5-10 phút)
3. Sau khi deploy xong, bạn sẽ nhận được URL dạng:
   ```
   https://cms-api-server.onrender.com
   ```

---

## 🔧 Post-Deployment

### 1. Chạy Prisma Migration

Render không tự động chạy migration. Bạn cần SSH vào container:

```bash
# Từ Render Dashboard → Shell tab
pnpm prisma migrate deploy
```

Hoặc sửa Dockerfile CMD thành:
```dockerfile
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main"]
```

> **⚠️ Lưu ý**: Neon DB yêu cầu `channel_binding=require`, đảm bảo `DATABASE_URL` trong Render Environment Variables có tham số này.

### 2. Kiểm tra API

Truy cập Swagger UI để test:
```
https://cms-api-server.onrender.com/api/docs
```

### 3. Cập nhật CORS cho Frontend

Sau khi deploy frontend (web), thêm domain vào `ALLOWED_ORIGINS`:
```env
ALLOWED_ORIGINS=https://cms-web.onrender.com,https://cms-api-server.onrender.com
```

---

## 📊 API URL Sau Khi Deploy

Bạn sẽ có các endpoint:

| Service | URL |
|---------|-----|
| **API Base URL** | `https://cms-api-server.onrender.com` |
| **Swagger Docs** | `https://cms-api-server.onrender.com/api/docs` |
| **Health Check** | `https://cms-api-server.onrender.com/` |

---

## ⚠️ Lưu ý Quan Trọng

### Free Tier Limitations
- **Sleep after 15 minutes** of inactivity (cold start ~30s)
- **750 hours/month** bandwidth
- **Không có SSL custom domain** (chỉ dùng `*.onrender.com`)

### Upgrade lên Standard ($7/tháng)
- **Không sleep** → luôn sẵn sàng
- **Auto-deploy** từ GitHub
- **Custom domain** + SSL miễn phí
- **Health checks** tự động restart nếu crash

### Security Checklist
- [ ] Thay đổi `JWT_SECRET` thành chuỗi ngẫu nhiên mạnh
- [ ] Giới hạn CORS origins cụ thể
- [ ] Không commit `.env` lên GitHub
- [ ] Sử dụng Render Environment Variables (đã mã hóa)
- [ ] Bật **Auto-Deploy** chỉ từ `main` branch

---

## 🔄 Cập nhật Code Sau Này

1. Push code lên GitHub:
   ```bash
   git push origin main
   ```
2. Render sẽ **auto-deploy** (nếu bật)
3. Hoặc manual deploy từ Dashboard → **Manual Deploy**

---

## 🆘 Troubleshooting

### Lỗi: "Cannot connect to database"
- Kiểm tra `DATABASE_URL` có đúng với Neon DB không (copy từ `server/.env`)
- Đảm bảo Neon project đang active (kiểm tra tại https://console.neon.tech)
- Neon Free tier có thể sleep sau 5 phút inactivity → wake up lại tự động

### Lỗi: "Redis connection refused"
- Kiểm tra `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- Với Upstash: dùng REST URL, không phải TCP URL

### Lỗi: "CORS error"
- Thêm domain frontend vào `ALLOWED_ORIGINS`
- Format: `https://domain1.com,https://domain2.com`

### Lỗi: "Prisma Client not generated"
- Đảm bảo Dockerfile có lệnh `pnpm prisma generate`
- Kiểm tra build logs trên Render

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. **Build Logs**: Render Dashboard → Logs tab
2. **Runtime Logs**: Render Dashboard → Logs tab (chọn Runtime)
3. **Health Check**: Truy cập `/api/docs` để verify API đang chạy
