# Hướng dẫn sử dụng WorkPay

WorkPay hỗ trợ theo dõi chấm công, ước tính lương và ghi nhận các khoản đã nhận. Dữ liệu được lưu trong trình duyệt đang sử dụng.

## 1. Chấm công trong lịch

1. Mở mục **Lịch**, dùng nút **‹** và **›** để chuyển tháng hoặc **Hôm nay** để quay về tháng hiện tại.
2. Chọn ngày cần chấm công. Tiêu đề ngày trong cửa sổ chấm công dùng định dạng **DD-MM-YYYY**.
3. Chọn **Trạng thái** và **Ca**:
   - Ca 5 tiếng
   - Ca 6 tiếng
   - Ca 8 tiếng (ngày) hoặc ca 8 tiếng (đêm)
   - Ca 11 tiếng (ngày) hoặc ca 11 tiếng (đêm)
   - Ca 13 tiếng (6h-19h)
4. Nhập các thông tin cần thiết: đi trễ và số phút đi trễ, làm nửa ngày, tăng ca, phụ cấp, thưởng, khấu trừ, điều chỉnh/tiền nghỉ có lương và ghi chú. Chọn mức tăng ca bằng các nút **0–5 giờ**; nút đang chọn sáng xanh. Nếu mở bản ghi cũ có số giờ tăng ca ngoài các mức này, giá trị cũ vẫn được giữ để bạn có thể kiểm tra hoặc đổi.
5. Xem phần xem trước tổng tiền, sau đó bấm **Lưu**. Bấm **Đóng** để thoát mà không lưu. Nút **Xóa** chỉ xuất hiện với ngày đã có bản ghi.

Lịch đánh dấu riêng Chủ nhật, ngày hiện tại, ngày đang chọn, ngày có ghi chú và trạng thái chấm công. Chấm màu biểu thị âm lịch, ngày lễ hoặc sự kiện. Chọn ngày hoặc dùng bàn phím để mở chi tiết. Đây là thông tin lịch; ngày lễ không tự chuyển trạng thái thành nghỉ và không tự cộng thêm lương.

### Chấm công nhanh và nhân bản ca

- Thẻ **Chấm công nhanh** trên đầu trang Lịch cho biết trạng thái hôm nay. Nhấn **Chấm công hôm nay** để mở biểu mẫu chấm công; nếu đã có bản ghi, nút đổi thành **Sửa chấm công**. Kiểm tra thông tin rồi bấm **Lưu**; ứng dụng không tự chấm công.
- Trong biểu mẫu của ngày đã có bản ghi, nhấn **Nhân bản ca**. Chọn một ngày nguồn có chấm công, rồi chọn một ngày đích, nhiều ngày đích (nhập từng ngày hoặc thêm khoảng ngày), hoặc sao chép theo tuần.
- Với tuần, chọn ngày thứ Hai của tuần nguồn và tuần đích. Chỉ các ngày đã có dữ liệu trong tuần nguồn được đưa vào bản xem trước; ngày trong tuần được ánh xạ sang cùng thứ ở tuần đích.
- Chọn sao chép toàn bộ thông tin hoặc chỉ trạng thái và loại ca. Ghi chú chỉ được sao chép khi bật tùy chọn tương ứng. Bản xem trước nêu rõ các ngày trống và ngày đã có dữ liệu; ngày trùng mặc định được bỏ qua. Muốn thay thế, chọn rõ **Thay thế** cho ngày đó rồi xác nhận lần nữa.
- Dữ liệu được ghi trong một giao dịch IndexedDB; nếu có lỗi hoặc bản ghi nguồn/đích thay đổi trong lúc xem trước, thao tác bị hủy và báo lỗi. Không có hoàn tác tự động; hãy rà soát các ngày thay thế trước khi xác nhận.

## 2. Xem lương và khoản đã nhận

- Đầu mục **Lương tháng** có **Tổng quan thu nhập** với bộ chọn tháng riêng; các nút tháng trước/sau và **Tháng này** đổi tháng đang xem. Thẻ tổng quan hiển thị lương ước tính sau chuyên cần và BHXH, tiền đã nhận, công quy đổi, tăng ca và mức ước tính trung bình trên mỗi công.
- Phần so sánh nêu chênh lệch lương ước tính và tiền đã nhận so với tháng trước; tỷ lệ phần trăm không được tính khi tháng trước bằng 0 hoặc thiếu dữ liệu. Tháng hiện tại được ghi rõ là chưa kết thúc. Có thể mở **Phân tích thành phần lương** để xem các khoản lưu trong chấm công và **Điều gì thay đổi giữa hai tháng?** để xem chênh lệch công, ca và thành phần đã ghi nhận; đây là so sánh số liệu, không khẳng định nguyên nhân.
- Biểu đồ cho phép chọn 6 tháng, 12 tháng hoặc năm đang chọn trong **Thống kê năm**; chỉ số gồm lương ước tính, tiền đã nhận, ngày công quy đổi và giờ tăng ca. Tháng không có dữ liệu cho chỉ số đang chọn được đánh dấu riêng, không coi là tháng có giá trị 0.
- Mục **Lương tháng** vẫn hiển thị tổng lương dự kiến, tiền đã nhận, chênh lệch, công, giờ làm, giờ tăng ca và các khoản khấu trừ. Tùy chọn **Trừ BHXH tháng này** mặc định không được chọn; khi chọn, số tiền BHXH trong Thiết lập sẽ được trừ riêng cho tháng đó.
- Bảng chi tiết ngày cho biết ca, tiền ca và tổng tiền; bấm vào một dòng để mở ngày chấm công đó.
- Trong phần **Tiền thực nhận**, nhập ngày nhận, số tiền, loại khoản và ghi chú, rồi bấm **Thêm khoản**. Số tiền âm dùng để ghi nhận khoản hoàn trả.
- Dùng **Xuất CSV** để tải chi tiết tháng hoặc **In bảng lương** để in.

## 3. Thống kê năm

Mở **Thống kê năm**, chọn năm cần xem để tra tổng hợp số công, giờ làm, tăng ca, lương dự kiến và tiền thực nhận theo tháng. Nếu năm đó chưa có bản ghi chấm công hoặc khoản đã nhận, biểu đồ sẽ thông báo trạng thái trống.

## 4. Thiết lập lương

Mở **Thiết lập** để xem hoặc thay đổi mức lương, số tiền BHXH mỗi tháng và các thông số tính toán. Các trường được nhóm theo **Mức lương theo ca**, **Phụ cấp và các khoản cố định** và **Quy tắc chấm công**. Nhấn **Lưu làm mặc định** sau khi chỉnh sửa.

- Đơn giá mặc định ban đầu: ca 8 tiếng ban ngày **255.000đ**, ca 13 tiếng **450.000đ**, ca đêm 8 tiếng **309.500đ**, ca đêm 11 tiếng **426.500đ**.
- Ca ngày Chủ nhật 13 tiếng là **832.000đ**; ca đêm Chủ nhật 11 tiếng là **758.500đ**.
- Đơn giá ca 5 tiếng, ca 6 tiếng và ca 11 tiếng ban ngày để trống ban đầu. Khi dùng phương thức lương ngày, các ca này tính theo **Lương giờ × số giờ ca** cho đến khi nhập đơn giá riêng.
- Khi chấm công ngày Chủ nhật, ứng dụng nhận diện ngày theo lịch và chỉ đưa ra **ca ngày 13 tiếng** hoặc **ca đêm 11 tiếng**, đồng thời hiển thị đơn giá Chủ nhật đã thiết lập ngay trong danh sách ca. Nếu bản ghi Chủ nhật cũ dùng loại ca khác, cần chọn một trong hai ca Chủ nhật trước khi lưu.
- Nếu chọn phương thức **Lương giờ**, tiền ca được tính theo số giờ ca nhân với Lương giờ.
- Mức chuyên cần mặc định là **250.000đ** khi đạt ít nhất **26 công quy đổi** trong tháng. Ngày làm đủ tính 1 công, ngày làm nửa ngày tính 0,5 công; trạng thái nghỉ không tính công.
- Mức trừ BHXH mặc định là **557.550đ/tháng**. Việc trừ BHXH phải được bật riêng tại **Lương tháng** cho từng tháng; khi bỏ chọn, tháng đó không bị trừ. Thay đổi mức BHXH trong Thiết lập sẽ cập nhật lương dự kiến của các tháng đã bật khoản trừ này.
- Ca Chủ nhật được xác định theo ngày dương lịch rơi vào Chủ nhật.
- Thiết lập này không tự sửa các bản ghi đã có. Hãy kiểm tra phần xem trước khi lưu chấm công, nhất là sau khi thay đổi mức lương.

## 5. Sao lưu và phục hồi

Mở **Sao lưu**:

- Bấm **Xuất JSON** để tải bản sao lưu gồm dữ liệu chấm công, khoản thanh toán và thiết lập.
- Khi nhập JSON, chọn **Hợp nhất** để cập nhật/thêm bản ghi theo ID hoặc **Thay thế toàn bộ** để ghi đè dữ liệu đang có, rồi chọn tệp sao lưu.
- Chỉ dùng tệp JSON WorkPay đã xuất. Kiểm tra lựa chọn nhập trước khi xác nhận; chế độ thay thế sẽ xóa dữ liệu hiện có trước khi phục hồi.
- **Xóa toàn bộ dữ liệu** không thể hoàn tác. Hãy xuất và kiểm tra bản sao lưu trước khi dùng.

## 6. Ủng hộ Nhà Phát Triển

- Nhấn **☕ Ủng Hộ** trên thanh đầu trang để xem thông tin Vietcombank, MoMo và liên hệ Zalo.
- Dùng nút **Sao chép** để sao chép số tài khoản/điện thoại; nhấn **Xem QR** để mở mã QR ngay trong cửa sổ.
- Có thể thay ảnh QR bằng ảnh đúng tài khoản tại `public/assets/qr-vietcombank.png` và `public/assets/qr-momo.png`.
- Người ủng hộ tự nhập số tiền và chủ động xác nhận chuyển khoản trong ứng dụng ngân hàng hoặc MoMo. WorkPay không thực hiện giao dịch và không lưu dữ liệu ủng hộ vào IndexedDB.

## 7. Cài đặt và dùng WorkPay ngoại tuyến

- Mở WorkPay bằng Chrome/Edge tương thích rồi nhấn **📱 Cài đặt WorkPay** khi nút được hiển thị. Chấp nhận lời nhắc của trình duyệt để thêm ứng dụng vào màn hình chính.
- Trên iPhone/iPad, mở website bằng Safari, nhấn **📱 Cài WorkPay trên iPhone**, rồi làm theo hướng dẫn **Chia sẻ → Thêm vào Màn hình chính → Thêm**.
- Mở WorkPay khi có mạng ít nhất một lần để Service Worker lưu bộ vỏ ứng dụng và các tài nguyên tĩnh cần thiết trên thiết bị. Lần truy cập ngoại tuyến sau đó vẫn sử dụng được các chức năng chính.
- WorkPay tiếp tục lưu chấm công, thiết lập và khoản đã nhận trong IndexedDB hiện tại trên thiết bị. Cập nhật ứng dụng chỉ thay cache tệp tĩnh, không xóa hoặc thay đổi cơ sở dữ liệu.
- Nếu có bản cập nhật đang chờ, dùng nút **Cập nhật** trong WorkPay để tải bản mới. Export/Restore JSON và CSV tiếp tục xử lý trên thiết bị, không tải dữ liệu lên máy chủ.

## Lưu ý quan trọng

- Dữ liệu lưu bằng IndexedDB trong trình duyệt, gắn với hồ sơ trình duyệt và địa chỉ website hiện tại. Dữ liệu không tự đồng bộ sang thiết bị hoặc trình duyệt khác.
- Xóa dữ liệu website/trình duyệt, dùng hồ sơ ẩn danh hoặc chuyển thiết bị có thể khiến dữ liệu không còn truy cập được. Hãy xuất JSON định kỳ và lưu ở nơi an toàn.
- Sự kiện âm lịch và ngày lễ chỉ để tham khảo lịch, không quyết định trạng thái chấm công hay chế độ hưởng lương.
- Hãy kiểm tra trạng thái, ca và số tiền xem trước trước khi lưu. Các khoản chuyên cần và tiền ca được tính theo thiết lập hiện tại.
- WorkPay là công cụ ghi nhận và ước tính; hãy đối chiếu bảng lương với quy định thực tế của đơn vị trước khi thanh toán.
