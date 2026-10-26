# Thời Khóa Biểu

Ứng dụng thời khóa biểu desktop cho Windows, xây dựng với Tauri 2, React và TypeScript. Ứng dụng quản lý lịch học 7 ngày, việc cần làm và nhắc lịch. Tùy chọn nhập Excel dùng Groq để chuyển bảng thời khóa biểu thành lịch học.

## Chạy từ mã nguồn

Yêu cầu Node.js 18+, Rust toolchain, Microsoft C++ Build Tools và WebView2 Runtime.

```powershell
npm install
npm run tauri dev
```

Tạo bản cài Windows:

```powershell
npm run tauri build
```

## Tải và cài ứng dụng trên Windows

Tải [timetable-app.exe](https://github.com/dohuahau-stack/timetableapp/raw/refs/heads/main/timetable-app.exe) để mở ứng dụng trên Windows. Nút **Code → Download ZIP** chỉ tải mã nguồn; file ZIP không phải ứng dụng đã cài và cần môi trường Node.js, Rust cùng công cụ build để tự biên dịch.

Chỉ tải file từ repository chính thức. GitHub Releases vẫn là nơi phù hợp để phân phối phiên bản có tag, ghi chú phát hành và checksum. Nếu Windows hiện SmartScreen, hãy xác minh file và nguồn trước khi chạy; đừng tắt SmartScreen chỉ để cài ứng dụng.

Nếu chưa có release, người có kinh nghiệm có thể tải source, xem mã và tự build theo hướng dẫn ở trên. Không tải file cài đặt được đăng lại từ nguồn không chính thức.

## Dùng tính năng nhập Excel bằng Groq

Xem [hướng dẫn sử dụng đầy đủ](docs/HUONG_DAN_SU_DUNG.md) để tạo Groq API key, nhập Excel và thêm môn học thêm.

1. Mở [Groq Console API Keys](https://console.groq.com/keys) và đăng nhập/tạo tài khoản Groq.
2. Chọn **Create API Key**, đặt tên nếu được yêu cầu, rồi sao chép key bắt đầu bằng `gsk_`.
3. Không gửi key cho người khác, không dán vào issue, ảnh chụp, source code hoặc commit.
4. Mở **Cài đặt** trong app, dán key vào trường Groq API Key. Model mặc định là `llama-3.3-70b-versatile`.
5. Chọn **Nhập từ Excel bằng AI**, mở file thời khóa biểu, sửa prompt nếu cần rồi xem lại lịch AI đề xuất trước khi áp dụng.

Prompt mẫu (được giữ nguyên trong file để dễ sao chép):

> Nhập thời khóa biểu 12A1 vào, môn OTN của tôi ngoài Toán và Văn ra còn có Lý OTN và Anh OTN, giờ vào lớp sáng là 7h15 và chiều là 14h00,mỗi tiết 45 phút, giờ nghỉ giữa các tiết là 5 phút(ngoại trừ giữa tiết 1 và tiết 2 là 10 phút), đừng gộp 2 môn học vào nếu có thấy chúng đứng liên tiếp

## Quyền riêng tư và an toàn

- API key được lưu trong trạng thái cài đặt của app trên máy người dùng. Không commit key thật. Hãy thu hồi key trong Groq Console nếu nghi ngờ bị lộ.
- Khi nhập Excel, app đọc các sheet và gửi nội dung dạng văn bản cùng prompt tới Groq API để xử lý. Không chọn bảng có dữ liệu nhạy cảm nếu bạn không muốn gửi nội dung đó tới Groq.
- Groq đã ngừng model `llama-3.3-70b-versatile` trên Free/Developer tier từ 16/08/2026. Tài khoản miễn phí có thể không gọi được model mặc định; xem hướng dẫn sử dụng để biết chi tiết.
- Các tính năng lịch, việc cần làm và nhắc giờ hoạt động cục bộ. Dữ liệu ứng dụng lưu trong thư mục dữ liệu app của Windows.
- Hãy xem source và quyền Tauri trong `src-tauri/` trước khi cài. Chỉ tải bản phát hành từ trang **Releases** của repository này; kiểm tra hash/chữ ký phát hành nếu có.
- Đây là phần mềm mã nguồn mở đang được cộng đồng rà soát; chưa có chứng nhận kiểm toán bảo mật độc lập. Báo cáo lỗ hổng riêng tư qua GitHub Security Advisories, không đăng thông tin khai thác hay key thật trong issue công khai.

## Báo lỗi và đóng góp

Mở [GitHub Issues](https://github.com/dohuahau-stack/timetableapp/issues) để báo lỗi không chứa thông tin nhạy cảm. Khi gửi báo cáo, ghi phiên bản Windows, các bước tái hiện và log đã loại bỏ API key/dữ liệu cá nhân.

## Giấy phép

Repository hiện có giấy phép MIT trong file [`LICENSE`](LICENSE). Người dùng có thể xem hoặc tải file đó từ repository; khi sao chép hoặc phân phối mã nguồn, cần giữ lại thông báo bản quyền và nội dung giấy phép. MIT cho phép sử dụng, sửa đổi và phân phối phần mềm theo các điều kiện ghi trong LICENSE, đồng thời cung cấp phần mềm “AS IS” không kèm bảo đảm.
