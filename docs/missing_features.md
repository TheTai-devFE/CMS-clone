# Các tính năng còn thiếu trong hệ thống Digital Signage

Tài liệu này phân tích và liệt kê các tính năng thiết yếu còn thiếu của hệ thống **CMS Digital Signage** hiện tại (bao gồm cả Web CMS và Android Player) để đáp ứng được tiêu chuẩn vận hành thực tế ở quy mô doanh nghiệp.

---

## 1. Trình biên tập bố cục trực quan (Visual Multi-Zone Layout Editor)
* **Hiện trạng:** Hệ thống đã có các Model `Template` và `Zone` trong database, nhưng giao diện Web CMS hiện tại chưa có tính năng chỉnh sửa kéo thả (WYSIWYG Editor) để người dùng tự thiết kế bố cục màn hình.
* **Tính năng còn thiếu:**
  - Bộ công cụ kéo thả trực quan trên Web giúp chia màn hình thành nhiều phân vùng (Zones): Ví dụ, vùng chính (70% diện tích) phát Video quảng cáo, vùng bên phải (20%) hiển thị danh sách ảnh sản phẩm, và vùng dưới cùng (10%) hiển thị thanh chữ chạy tin tức.
  - Khả năng cấu hình tỷ lệ khung hình tùy chỉnh cho các Zone (16:9, 9:16, 4:3) hoặc các kích thước bất đối xứng cho màn hình ghép (LED Video Wall).

## 2. Hỗ trợ đa dạng định dạng nội dung (Rich Media Formats)
* **Hiện trạng:** Hệ thống mới chỉ hỗ trợ tải lên và phát các file ảnh (JPEG, PNG) và video (MP4) cơ bản.
* **Tính năng còn thiếu:**
  - **Nhúng trang Web (Web URLs / HTML5 Widgets):** Hỗ trợ hiển thị trực tiếp các đường link web tĩnh hoặc động (như bảng giá vàng, dự báo thời tiết, tỷ giá ngoại tệ, fanpage mạng xã hội).
  - **Luồng video trực tuyến (IP Camera / Live Streams):** Khả năng cấu hình luồng phát trực tiếp qua giao thức RTSP, RTMP hoặc HLS lên một phân vùng của màn hình (ứng dụng cho các sảnh khách sạn, phòng giám sát).
  - **Thành phần chữ chạy (Text Marquee / RSS Ticker):** Cho phép cấu hình dải chữ chạy ngang màn hình để cập nhật tin tức khẩn cấp hoặc tin tức tự động lấy từ nguồn RSS.
  - **Tài liệu văn phòng (PDF / Office Slides):** Hỗ trợ tự động phân tách và trình chiếu các file PDF hoặc tài liệu trình chiếu PowerPoint trực tiếp trên màn hình mà không cần chuyển đổi thủ công sang ảnh.

## 3. Tính năng Giám sát & Chụp ảnh màn hình từ xa (Remote Screen Capture)
* **Hiện trạng:** Người quản trị chỉ biết thiết bị đang "Online" hoặc "Offline" dựa trên tín hiệu Heartbeat từ Redis/PostgreSQL. Họ không biết thiết bị thực tế có đang phát hình hay bị đơ, đen màn hình.
* **Tính năng còn thiếu:**
  - **Chụp ảnh màn hình (Screen Capture API):** Web CMS gửi lệnh yêu cầu Android Player chụp màn hình hiện tại đang phát và gửi ngược lại lên server để người quản trị kiểm tra tình trạng hiển thị thực tế (Proof of Playback trực quan).
  - **Giám sát thông số phần cứng chi tiết:** Hiển thị nhiệt độ CPU, tình trạng bộ nhớ RAM trống, nhiệt độ thiết bị Android, và dung lượng thẻ nhớ còn trống của đầu phát trên giao diện giám sát.

## 4. Hệ thống Lập lịch phát nâng cao (Advanced Scheduling & Priority)
* **Hiện trạng:** Việc gán lịch phát hiện tại đang ở mức cơ bản (theo dải ngày và khung giờ).
* **Tính năng còn thiếu:**
  - **Độ ưu tiên của Lịch (Priority Levels):** Cho phép đặt lịch phát khẩn cấp (Emergency Broadcast) để lập tức đè lên toàn bộ các playlist thông thường khi có hỏa hoạn, thông báo khẩn, sau đó tự quay lại playlist cũ khi hết thời gian.
  - **Lặp lại phức tạp (Cron-like recurrence):** Lập lịch phát lặp lại định kỳ phức tạp (Ví dụ: Chỉ phát vào thứ Hai và thứ Sáu hàng tuần, hoặc phát vào ngày cuối cùng của tháng).
  - **Lập lịch dựa trên thẻ (Tag-based Scheduling):** Tự động phân phối playlist xuống các màn hình có chứa tag tương ứng (Ví dụ: Playlist menu món ăn tự động gán cho tất cả các thiết bị có tag `Màn-hình-Menu`).

## 5. Cập nhật ứng dụng tự động từ xa (App OTA / Silent Update)
* **Hiện trạng:** Khi cập nhật phiên bản mới cho ứng dụng Android Player (App Client), kỹ thuật viên phải đến trực tiếp thiết bị để cài đặt thủ công.
* **Tính năng còn thiếu:**
  - Giao diện Web CMS quản lý các phiên bản ứng dụng Android (file `.apk`).
  - Cơ chế tự động đẩy phiên bản APK mới xuống thiết bị, chạy lệnh cài đặt ngầm (Silent Install - yêu cầu thiết bị root hoặc có quyền Device Owner) để tự nâng cấp phần mềm mà không làm gián đoạn hiển thị của khách hàng.

## 6. Báo cáo đối soát & Phân tích quảng cáo (Playback Analytics & Reporting)
* **Hiện trạng:** Đã có model `PlaybackLog` trong database nhưng chưa có hệ thống tổng hợp báo cáo trực quan cho người dùng.
* **Tính năng còn thiếu:**
  - **Giao diện Báo cáo (Analytics Dashboard):** Biểu đồ thống kê số lượt hiển thị (Impressions), tổng thời lượng đã phát của từng file media/video quảng cáo.
  - **Xuất file đối soát (Export PDF/Excel):** Cho phép người quản trị xuất dữ liệu báo cáo phát quảng cáo theo từng thiết bị, khu vực hoặc khoảng thời gian để gửi cho các đối tác mua quảng cáo.
