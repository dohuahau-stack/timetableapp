# Thời Khóa Biểu

Ứng dụng thời khóa biểu desktop cho Windows, xây dựng bằng Tauri 2, React, TypeScript và Tailwind. Có lịch 7 ngày, việc cần làm, nhắc lịch và tùy chọn dùng Gemini để gợi ý lịch học từ file Excel.

## Chạy từ mã nguồn

Yêu cầu Node.js 18+, Rust, Microsoft C++ Build Tools và WebView2 Runtime.

```powershell
npm install
npm run tauri dev
```

Tạo bộ cài: `npm run tauri build`.

## Nhập Excel bằng Gemini

1. Mở [Google AI Studio – API keys](https://aistudio.google.com/app/apikey) và đăng nhập.
2. Chọn **Create API key**. Google quyết định khả năng sử dụng và hạn mức miễn phí theo tài khoản/khu vực; hãy kiểm tra điều khoản đang hiển thị trong AI Studio.
3. Giữ key riêng tư. Dán key vào mục **Cài đặt** trong app và nhập tên model được tài khoản AI Studio hỗ trợ.
4. Chọn **Nhập từ Excel bằng AI**, chọn workbook, kiểm tra lịch được gợi ý rồi mới áp dụng.

Prompt mẫu:

> Nhập thời khóa biểu 12A1 vào, môn OTN của tôi ngoài Toán và Văn ra còn có Lý OTN và Anh OTN, giờ vào lớp sáng là 7h15 và chiều là 14h00,mỗi tiết 45 phút, giờ nghỉ giữa các tiết là 5 phút(ngoại trừ giữa tiết 1 và tiết 2 là 10 phút), đừng gộp 2 môn học vào nếu có thấy chúng đứng liên tiếp

## Quyền riêng tư và an toàn

- API key được lưu trong cài đặt cục bộ của app. Không commit key thật. Thu hồi key trong AI Studio nếu nghi ngờ bị lộ.
- Khi nhập Excel, nội dung các sheet và prompt được gửi tới Gemini API của Google. Đừng nhập workbook nhạy cảm nếu bạn không đồng ý gửi nội dung đó.
- Dữ liệu lịch và việc cần làm lưu trên thiết bị.
- Hãy kiểm tra source và quyền Tauri trong `src-tauri/` trước khi cài. Dự án chưa được kiểm toán bảo mật độc lập và không có chứng nhận an toàn.
- Báo cáo lỗ hổng riêng tư qua GitHub Security Advisories. Không đăng key, dữ liệu cá nhân hay chi tiết khai thác lên issue công khai.

## Giấy phép

Repository hiện chưa có file LICENSE. Không nên mặc định rằng mã nguồn được cấp quyền tái phân phối cho đến khi tác giả thêm giấy phép.
