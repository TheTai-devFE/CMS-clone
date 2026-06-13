# Các cải tiến cần thiết cho hệ thống hiện tại

Tài liệu này phân tích các hạn chế kỹ thuật hiện tại trong mã nguồn của hệ thống **CMS Digital Signage** và đề xuất các giải pháp cải thiện cụ thể về hiệu năng, độ ổn định, tính bảo mật cũng như trải nghiệm người dùng (UX).

---

## 1. Cơ chế đồng bộ dữ liệu (Communication Protocol)
* **Hạn chế hiện tại:** Android Player gửi Heartbeat định kỳ 30 giây một lần lên server để cập nhật trạng thái và lấy Playlist mới (giao thức HTTP Polling). Khi hệ thống mở rộng lên hàng nghìn thiết bị phát, việc polling liên tục này sẽ gây tải cực kỳ lớn cho CPU server và database.
* **Giải pháp cải thiện:**
  - Chuyển sang giao thức **WebSocket** (qua NestJS Gateway) hoặc **MQTT** (sử dụng EMQX Broker) để duy trì kết nối duy nhất (persistent connection).
  - Khi người dùng thay đổi Playlist hoặc Lịch phát trên Web CMS, Backend sẽ chủ động "push" lệnh đồng bộ tức thời xuống Player mục tiêu.
  - Heartbeat chỉ gửi các thông số phần cứng với tần suất thưa hơn (ví dụ: 2 - 5 phút/lần) thay vì 30 giây/lần.

## 2. Quản lý lưu trữ tệp và băng thông (Storage & Bandwidth Optimization)
* **Hạn chế hiện tại:** Khi Player tải file media (đặc biệt là video độ phân giải cao 4K nặng hàng trăm MB), việc tải trực tiếp từ server API hoặc storage trung tâm (như MinIO/R2) mà không qua CDN sẽ gây nghẽn băng thông đường truyền của backend.
* **Giải pháp cải thiện:**
  - **Tích hợp CDN (Content Delivery Network):** Bắt buộc đặt Cloudflare hoặc AWS CloudFront phía trước Object Storage để cache các file media tĩnh tại các edge node gần thiết bị nhất.
  - **Tải tiếp file bị lỗi (Resume Download):** Cập nhật cơ chế tải file trên Android Player để hỗ trợ HTTP Range Requests. Nếu mạng bị ngắt giữa chừng, thiết bị có thể tiếp tục tải tiếp phần còn lại thay vì tải lại từ đầu.
  - **Tự động tối ưu dung lượng (Transcoding):** Tích hợp dịch vụ nén video tự động (ví dụ dùng FFmpeg ở backend) để convert video tải lên sang các định dạng tối ưu nhất cho thiết bị phát (như WebM hoặc H.264/HEVC) để giảm tối đa dung lượng truyền tải.

## 3. Quản lý ghi nhận nhật ký (Log System & Telemetry)
* **Hạn chế hiện tại:** Nhật ký hoạt động phát (`PlaybackLog`) và nhật ký thiết bị (`HeartbeatLog`) đang được ghi trực tiếp vào PostgreSQL. Các dòng log này phát sinh liên tục theo từng lần chạy file hoặc heartbeat, dẫn tới database quan hệ PostgreSQL bị phình to rất nhanh, gây chậm các tác vụ nghiệp vụ quan trọng khác.
* **Giải pháp cải thiện:**
  - **Tách biệt Database:** Di chuyển dữ liệu nhật ký (Time-series logs) sang một database chuyên dụng như **ClickHouse**, **TimescaleDB** hoặc **ElasticSearch**.
  - **Cơ chế ghi log gom lô (Bulk insert / Queueing):** Sử dụng Message Queue (RabbitMQ hoặc BullMQ/Redis) để lưu tạm thời các log nhận được từ thiết bị, sau đó ghi log theo lô (bulk insert) vào database để giảm thiểu tần suất I/O của database.

## 4. Bảo mật truyền thông thiết bị (Device Security)
* **Hạn chế hiện tại:** Thiết bị liên kết qua API Key đơn giản được lưu trong DB. Quá trình truyền tải dữ liệu và các API thiết bị chưa được bảo mật cao, dễ bị giả lập thiết bị (spoofing) nếu lộ API Key.
* **Giải pháp cải thiện:**
  - Sử dụng cơ chế bắt tay **OAuth2 Device Flow** hoặc cấp phát **JWT Token ngắn hạn** riêng cho thiết bị sau khi thực hiện liên kết thành công.
  - Mã hóa (HTTPS) toàn bộ luồng truyền tải thông tin. Tích hợp chữ ký số trên từng gói tin Heartbeat để đảm bảo dữ liệu gửi lên là từ thiết bị thật.

## 5. Cải thiện trải nghiệm ngoại tuyến ở Player (Offline Caching & Seamless Playback)
* **Hạn chế hiện tại:** Nếu thiết bị mất kết nối internet khi đang tải dở Playlist mới, màn hình có thể bị đơ hoặc hiển thị màn hình đen.
* **Giải pháp cải thiện:**
  - **Cơ chế tải trước (Pre-fetching):** Khi nhận được lịch phát mới, Player vẫn tiếp tục chạy Playlist cũ. Chỉ khi nào toàn bộ file media của Playlist mới được tải về lưu trữ nội bộ thành công, thiết bị mới thực hiện chuyển đổi mượt mà sang Playlist mới.
  - **Trình phát dự phòng (Fallback Playlist):** Luôn duy trì một Playlist mặc định ngoại tuyến (Local Fallback) để tự động phát khi thiết bị gặp lỗi mạng dài hạn hoặc không có lịch phát nào được cấu hình.
