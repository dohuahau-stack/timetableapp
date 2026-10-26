# Hướng dẫn sử dụng Thời Khóa Biểu

Ứng dụng dùng Groq API và model `llama-3.3-70b-versatile` để đọc thời khóa biểu Excel. API key chỉ được lưu cục bộ trên máy bạn.

## 1. Tải và mở ứng dụng

1. Tải [timetable-app.exe](https://github.com/dohuahau-stack/timetableapp/raw/refs/heads/main/timetable-app.exe) từ repository chính thức.
2. Mở file trên Windows. Không cần cài Node.js hoặc Rust.
3. Nếu Windows hiện SmartScreen, kiểm tra lại rằng file đến từ repository chính thức trước khi chạy.

## 2. Tạo Groq API key

1. Mở [Groq Console – API Keys](https://console.groq.com/keys) và đăng nhập hoặc tạo tài khoản.
2. Chọn **Create API Key**.
3. Đặt tên cho key nếu Groq yêu cầu, rồi sao chép key có tiền tố `gsk_`.
4. Không gửi key qua chat, email công khai, ảnh chụp, issue hay commit. Nếu key bị lộ, thu hồi nó trong Groq Console và tạo key mới.

## 3. Lưu key trong ứng dụng

1. Mở **Cài đặt** ở thanh bên.
2. Dán key vào trường **Groq API Key**.
3. Giữ model `llama-3.3-70b-versatile`.
4. Chọn **Lưu cài đặt**.

> Key được lưu trong dữ liệu cục bộ của ứng dụng trên máy Windows. Ai có quyền truy cập vào tài khoản Windows của bạn có thể đọc dữ liệu app; ứng dụng không dùng Windows Credential Manager.

## 4. Nhập thời khóa biểu Excel

Ứng dụng nhận file `.xlsx`, `.xls` và `.xlsm`. File nên có thứ/ngày, tên môn và giờ học hoặc số tiết. Ứng dụng trích nội dung từ các sheet có dữ liệu và gửi văn bản đó cùng câu lệnh của bạn tới Groq để sắp lịch.

1. Chọn **Nhập từ Excel bằng AI**.
2. Chọn **Chọn file Excel**, rồi mở file trên máy.
3. Nhập câu lệnh mô tả lớp, giờ học và quy tắc tách môn. Ví dụ:

   > Nhập thời khóa biểu 12A1 vào, môn OTN của tôi ngoài Toán và Văn ra còn có Lý OTN và Anh OTN, giờ vào lớp sáng là 7h15 và chiều là 14h00,mỗi tiết 45 phút, giờ nghỉ giữa các tiết là 5 phút(ngoại trừ giữa tiết 1 và tiết 2 là 10 phút), đừng gộp 2 môn học vào nếu có thấy chúng đứng liên tiếp

4. Bật **Thay thế các môn chính khóa hiện có** nếu muốn thay lịch chính khóa cũ. Môn cố định và môn học thêm vẫn được giữ lại.
5. Chọn **Sắp xếp bằng AI**, sau đó xem lại ngày, buổi, giờ và từng môn trên bảng tuần. Bấm vào môn để sửa nếu cần.

## 5. Thêm môn học thêm thủ công

1. Chọn **Thêm môn học thêm** ở thanh bên.
2. Nhập tên môn, chọn các ngày, giờ bắt đầu và giờ kết thúc.
3. Bật **Cố định qua các tuần** nếu lịch này cần được giữ lại khi reset.
4. Chọn **Thêm lịch học**.

## Lưu ý về dữ liệu và model

- Không nhập workbook chứa dữ liệu nhạy cảm nếu bạn không muốn gửi nội dung đó cho Groq.
- Free/developer tier của Groq có hạn mức. Nếu gặp lỗi 429, xem quota của tài khoản Groq.
- Theo tài liệu Groq hiện tại, `llama-3.3-70b-versatile` đã ngừng trên Free/Developer tier từ 16/08/2026. Nếu Groq báo model không khả dụng, tài khoản của bạn cần quyền Enterprise cho model này hoặc app cần chuyển sang model Groq khác.
- Phiên bản hiện tại nhập Excel vào app, chưa xuất bảng lịch thành Excel.

## Xử lý lỗi thường gặp

- **Chưa có Groq API Key:** mở **Cài đặt** và dán key bắt đầu bằng `gsk_`.
- **401/403:** key không hợp lệ, đã bị thu hồi hoặc không có quyền dùng model.
- **404/model không khả dụng:** kiểm tra quyền dùng `llama-3.3-70b-versatile` trong Groq Console.
- **429:** chờ quota được cấp lại hoặc kiểm tra giới hạn của Groq.
- **Không nhận ra môn/giờ:** bổ sung lớp, thời gian vào học, độ dài tiết và giờ nghỉ vào câu lệnh rồi nhập lại.

## Tham khảo chính thức

- [Groq Console – API Keys](https://console.groq.com/keys)
- [Groq API reference – Chat Completions](https://console.groq.com/docs/api-reference)
- [Groq OpenAI compatibility](https://console.groq.com/docs/openai)
- [Thông tin model Llama 3.3 70B](https://console.groq.com/docs/model/llama-3.3-70b-versatile)
- [Groq model deprecations](https://console.groq.com/docs/deprecations)
