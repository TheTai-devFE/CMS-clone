# Giải pháp Đồng bộ phát đa màn hình & Bức tường Video (Multi-Screen Sync & Video Wall)

Tài liệu này phân tích bài toán gộp nhiều thiết bị phát (Players) độc lập hoạt động đồng bộ như một màn hình lớn duy nhất (Video Wall), tổng hợp cơ chế hiện tại của hệ thống và đề xuất các phương án triển khai phù hợp.

---

## 1. Vấn đề (The Problem)

* **Yêu cầu:** Người dùng có 5 màn hình vật lý (Players) độc lập và muốn ghép chúng lại thành một màn hình lớn duy nhất để chạy chung một Playlist. Mỗi màn hình phải phát đúng phân vùng video được chỉ định theo sơ đồ lắp đặt vật lý đã sắp xếp (không phải tất cả phát video giống nhau).
* **Thử thách kỹ thuật:**
  1. **Đồng bộ thời gian phát (Synchronization):** Các màn hình phải phát video cùng một giây, cùng một khung hình để tránh hiện tượng lệch hình ảnh (đứt gãy khung cảnh) giữa các màn hình ghép.
  2. **Phân phối nội dung:** Làm thế nào để phân chia một video gốc có độ phân giải lớn (hoặc siêu rộng) tới đúng thiết bị phát tương ứng theo vị trí tọa độ của nó trong tổng thể bức tường video.

---

## 2. Tổng quan và tóm tắt cơ chế hệ thống hiện tại

Kiến trúc hiện tại của dự án CMS đã có sẵn thiết kế nền tảng cho tính năng này thông qua cơ chế **Đồng bộ nhóm (Sync Group)** và **Ánh xạ thiết bị (Device Mapping)**:

* **Tại Database & API:**
  - Model `Playlist` lưu trữ trường `isSyncGroup` (Boolean) và `syncLayout` (JSON).
  - Khi thiết lập chế độ đồng bộ nhóm, hệ thống tạo đối tượng `deviceMapping` dạng key-value: Key là số thứ tự slide (ví dụ: `"1"`, `"2"`, ...), và Value là mảng chứa các ID thiết bị phát nhận nhiệm vụ chạy slide đó.
* **Tại Playlist Editor (Frontend):**
  - Component [PlaylistEditor.tsx](file:///Users/huynhtanphat/Documents/Tai/CMS-clone/web/src/app/dashboard/components/playlist-editor/PlaylistEditor.tsx) cho phép bật tính năng **"Đồng bộ nhóm (Sync Group)"**.
  - Khi bật tính năng này, ở thuộc tính của từng slide, người dùng có thể gán danh sách thiết bị phát mục tiêu tương ứng (`targetDeviceIds`).
* **Cơ chế vận hành:**
  - Khi các Player kết nối API đồng bộ, Server sẽ trả về thông số `isSyncGroup` và `syncLayout.deviceMapping`.
  - Từng Player sẽ tự đối chiếu ID của mình để biết mình cần tải và phát slide nào. Khi toàn bộ nhóm thiết bị đồng bộ thời gian chạy (qua NTP hoặc thời gian hệ thống), các màn hình sẽ phát đúng slide của mình cùng lúc, tạo ra hiệu ứng ghép màn hình lớn.

---

## 3. Đề xuất phương án thực hiện

Để giải quyết bài toán 5 màn hình ghép của người dùng, chúng ta có hai phương án tiếp cận:

### Phương án A: Sử dụng cơ chế Đồng bộ nhóm sẵn có (Video Slicing - Khuyên dùng)

Đây là phương án tối ưu về mặt hiệu năng phần cứng cho thiết bị phát (Player Client), tận dụng tối đa kiến trúc hiện tại của hệ thống.

* **Cách thức thực hiện:**
  1. **Cắt video (Video Slicing):** Người dùng sử dụng các phần mềm dựng phim hoặc script FFMPEG để cắt video lớn ban đầu thành 5 file video nhỏ tương ứng với 5 màn hình vật lý (Ví dụ: `Video_Part_1.mp4` cho màn hình 1, ... , `Video_Part_5.mp4` cho màn hình 5).
  2. **Tải lên CMS:** Tải cả 5 video nhỏ này lên thư viện **Media**.
  3. **Cấu hình Playlist đồng bộ:**
     - Tạo một Playlist mới, bật tùy chọn **"Đồng bộ nhóm (Sync Group)"**.
     - Tạo 5 slide trong playlist này.
     - Slide 1 gán file `Video_Part_1.mp4` và cấu hình thiết bị phát mục tiêu là **Player 1**.
     - Làm tương tự từ Slide 2 đến Slide 5 gán tương ứng cho **Player 2** đến **Player 5**.
  4. **Lập lịch phát:** Sử dụng tính năng **Lập lịch phát hàng loạt (Multi-Schedule)** để gán lịch trình hoạt động chung cho cả 5 thiết bị Player này cùng lúc.
* **Ưu điểm:**
  - Nhẹ nhàng cho phần cứng của thiết bị phát vì Player chỉ cần giải mã (decode) một file video nhỏ đúng bằng độ phân giải màn hình của nó.
  - Vận hành cực kỳ ổn định, không yêu cầu thiết bị phát có chip xử lý đồ họa mạnh.
* **Nhược điểm:** Người dùng mất thêm một bước cắt nhỏ video trước khi tải lên hệ thống.

---

### Phương án B: Tự động cắt phía Client (Client-Side Matrix Cropping - Đề xuất phát triển tương lai)

Nếu muốn tối giản thao tác cho người dùng (chỉ cần upload 1 video lớn duy nhất lên CMS), chúng ta cần nâng cấp thêm tính năng cấu hình ma trận hiển thị.

* **Cách thức thực hiện:**
  1. **Nâng cấp Model Device:** Bổ sung các thông số ma trận video wall vào model thiết bị:
     - `matrixRow`: Vị trí dòng (ví dụ: 0)
     - `matrixCol`: Vị trí cột (ví dụ: từ 0 đến 4)
     - `totalRows` / `totalCols`: Tổng số dòng/cột của lưới ghép (ví dụ: lưới 1x5)
  2. **Cấu hình trên CMS:** Quản trị viên chỉ cần tạo 1 Playlist thông thường chứa 1 slide duy nhất là video lớn ban đầu (độ phân giải siêu rộng ghép từ 5 màn hình), gán lịch phát cho cả 5 thiết bị.
  3. **Nâng cấp Player Client App:**
     - Khi Player Client nhận được thông tin phát, nó sẽ lấy các thông số ma trận của chính nó.
     - Sử dụng CSS (ví dụ: `transform: scale() translate()`, `object-fit`, `clip-path`) hoặc Canvas để phóng to video lớn lên đúng bằng kích thước lưới, sau đó tịnh tiến (translate) video để chỉ hiển thị phần khung cảnh tương ứng với vị trí cột/dòng của thiết bị đó trên màn hình.
* **Ưu điểm:** Cực kỳ tiện lợi cho người dùng cuối, không cần cắt nhỏ video thủ công.
* **Nhược điểm:** 
  - Yêu cầu thiết bị phát (Player) phải giải mã một file video có độ phân giải rất cao (file video gộp của 5 màn hình), dễ gây giật lag, quá tải CPU/GPU trên các dòng Android TV Box cấu hình thấp.
  - Phức tạp hơn trong việc lập trình xử lý hiển thị ở Player Client.
