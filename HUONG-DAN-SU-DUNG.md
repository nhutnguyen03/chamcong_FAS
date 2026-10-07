# Hướng dẫn sử dụng WorkPay

WorkPay hỗ trợ theo dõi chấm công, ước tính lương và ghi nhận các khoản đã nhận. Dữ liệu được lưu trong trình duyệt đang sử dụng.

## 1. Chấm công trong lịch

1. Mở mục **Lịch**, dùng nút **‹** và **›** để chuyển tháng hoặc **Tháng hiện tại** để quay về tháng hiện tại.
2. Chọn ngày cần chấm công. Tiêu đề ngày trong cửa sổ chấm công dùng định dạng **DD-MM-YYYY**.
3. Chọn **Trạng thái** và **Ca**:
   - Ca 6 tiếng
   - Ca 8 tiếng (ngày) hoặc ca 8 tiếng (đêm)
   - Ca 11 tiếng (ngày) hoặc ca 11 tiếng (đêm)
   - Ca 13 tiếng (6h-19h)
4. Nhập các thông tin cần thiết: đi trễ và số phút đi trễ, làm nửa ngày, tăng ca, phụ cấp, thưởng, khấu trừ, điều chỉnh/tiền nghỉ có lương và ghi chú.
5. Xem phần xem trước tổng tiền, sau đó bấm **Lưu**. Bấm **Đóng** để thoát mà không lưu. Nút **Xóa** chỉ xuất hiện với ngày đã có bản ghi.

Chấm màu trên lịch biểu thị âm lịch, ngày lễ hoặc sự kiện. Chọn ngày để xem chi tiết. Đây là thông tin lịch; ngày lễ không tự chuyển trạng thái thành nghỉ và không tự cộng thêm lương.

## 2. Xem lương và khoản đã nhận

- Mục **Lương tháng** hiển thị tổng lương dự kiến, tiền đã nhận, chênh lệch, công, giờ làm, giờ tăng ca và các khoản khấu trừ.
- Bảng chi tiết ngày cho biết ca, tiền ca và tổng tiền; bấm vào một dòng để mở ngày chấm công đó.
- Trong phần **Tiền thực nhận**, nhập ngày nhận, số tiền, loại khoản và ghi chú, rồi bấm **Thêm khoản**. Số tiền âm dùng để ghi nhận khoản hoàn trả.
- Dùng **Xuất CSV** để tải chi tiết tháng hoặc **In bảng lương** để in.

## 3. Thống kê năm

Mở **Thống kê năm**, chọn năm cần xem để tra tổng hợp số công, giờ làm, tăng ca, lương dự kiến và tiền thực nhận theo tháng.

## 4. Thiết lập lương

Mở **Thiết lập** để xem hoặc thay đổi mức lương và các thông số tính toán. Nhấn **Lưu làm mặc định** sau khi chỉnh sửa.

- Đơn giá mặc định ban đầu: ca 8 tiếng ban ngày **255.000đ**, ca 13 tiếng **450.000đ**, ca đêm 8 tiếng **309.500đ**, ca đêm 11 tiếng **426.500đ**.
- Ca ngày Chủ nhật 13 tiếng là **832.000đ**; ca đêm Chủ nhật 11 tiếng là **758.500đ**.
- Đơn giá ca 6 tiếng và ca 11 tiếng ban ngày để trống ban đầu. Khi dùng phương thức lương ngày, các ca này tính theo **Lương giờ × số giờ ca** cho đến khi nhập đơn giá riêng.
- Nếu chọn phương thức **Lương giờ**, tiền ca được tính theo số giờ ca nhân với Lương giờ.
- Mức chuyên cần mặc định là **250.000đ** khi đạt ít nhất **26 công quy đổi** trong tháng. Ngày làm đủ tính 1 công, ngày làm nửa ngày tính 0,5 công; trạng thái nghỉ không tính công.
- Ca Chủ nhật được xác định theo ngày dương lịch rơi vào Chủ nhật.
- Thiết lập này không tự sửa các bản ghi đã có. Hãy kiểm tra phần xem trước khi lưu chấm công, nhất là sau khi thay đổi mức lương.

## 5. Sao lưu và phục hồi

Mở **Sao lưu**:

- Bấm **Xuất JSON** để tải bản sao lưu gồm dữ liệu chấm công, khoản thanh toán và thiết lập.
- Khi nhập JSON, chọn **Hợp nhất** để cập nhật/thêm bản ghi theo ID hoặc **Thay thế toàn bộ** để ghi đè dữ liệu đang có, rồi chọn tệp sao lưu.
- Chỉ dùng tệp JSON WorkPay đã xuất. Kiểm tra lựa chọn nhập trước khi xác nhận; chế độ thay thế sẽ xóa dữ liệu hiện có trước khi phục hồi.
- **Xóa toàn bộ dữ liệu** không thể hoàn tác. Hãy xuất và kiểm tra bản sao lưu trước khi dùng.

## Lưu ý quan trọng

- Dữ liệu lưu bằng IndexedDB trong trình duyệt, gắn với hồ sơ trình duyệt và địa chỉ website hiện tại. Dữ liệu không tự đồng bộ sang thiết bị hoặc trình duyệt khác.
- Xóa dữ liệu website/trình duyệt, dùng hồ sơ ẩn danh hoặc chuyển thiết bị có thể khiến dữ liệu không còn truy cập được. Hãy xuất JSON định kỳ và lưu ở nơi an toàn.
- Sự kiện âm lịch và ngày lễ chỉ để tham khảo lịch, không quyết định trạng thái chấm công hay chế độ hưởng lương.
- Hãy kiểm tra trạng thái, ca và số tiền xem trước trước khi lưu. Các khoản chuyên cần và tiền ca được tính theo thiết lập hiện tại.
- WorkPay là công cụ ghi nhận và ước tính; hãy đối chiếu bảng lương với quy định thực tế của đơn vị trước khi thanh toán.
