# Hướng dẫn sử dụng Thời Khóa Biểu

## Tạo SambaNova API key

1. Đăng nhập vào [SambaCloud](https://cloud.sambanova.ai/).
2. Tạo API key trong phần API Keys của tài khoản/project hoặc endpoint. Nếu dùng SambaStudio riêng, lấy endpoint URL, model ID và API key từ thông tin endpoint được triển khai.
3. Không chia sẻ key, đưa vào ảnh chụp, Excel, prompt hoặc GitHub. Nếu key bị lộ, thu hồi và tạo key mới.

## Cấu hình ứng dụng

1. Mở **Cài đặt**.
2. Dán key vào **SambaNova API Key**.
3. Đặt model thành `Meta-Llama-3.3-70B-Instruct` (model ID phải khớp với model được cấp cho endpoint/tài khoản).
4. Bấm **Lưu cài đặt**. Key được lưu trên máy hiện tại, không được đóng gói trong EXE.

## Nhập Excel

1. Chọn **Nhập từ Excel bằng AI** rồi chọn `.xlsx`, `.xls` hoặc `.xlsm`.
2. Nhập yêu cầu về lớp, giờ học, thời lượng tiết và cách phân biệt môn.
3. Chọn **Sắp xếp bằng AI**, kiểm tra kết quả trên lịch rồi chỉnh sửa nếu cần.

Ứng dụng gửi văn bản trích từ các sheet có dữ liệu cùng prompt đến SambaNova để xử lý. Không nhập file có dữ liệu nhạy cảm nếu không muốn gửi cho dịch vụ.

## Prompt mẫu

> Nhập thời khóa biểu 12A1 vào, môn OTN của tôi ngoài Toán và Văn ra còn có Lý OTN và Anh OTN, giờ vào lớp sáng là 7h15 và chiều là 14h00,mỗi tiết 45 phút, giờ nghỉ giữa các tiết là 5 phút(ngoại trừ giữa tiết 1 và tiết 2 là 10 phút), đừng gộp 2 môn học vào nếu có thấy chúng đứng liên tiếp

## Xử lý lỗi

- **401/403:** kiểm tra key còn hiệu lực và đúng tài khoản/endpoint.
- **404:** kiểm tra model ID và endpoint được SambaNova cung cấp.
- **429/502/503/504:** ứng dụng tự thử lại tối đa 3 lần; nếu vẫn lỗi, chờ rồi thử lại.
- **Lỗi JSON:** thử lại hoặc xác nhận model hỗ trợ JSON response format.

Tham khảo [SambaNova API-compatible endpoint](https://docs.sambanova.ai/docs/en/integrations/vscode), [hướng dẫn endpoints](https://docs.sambanova.ai/sambastudio/latest/endpoints.html) và [model hub](https://docs.sambanova.ai/sambastudio/latest/model-hub.html).
