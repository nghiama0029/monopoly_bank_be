# Thuật Ngữ Nghiệp Vụ – Domain Glossary
**Ngày thêm:** 2026-05-19
**Nguồn:** Khảo sát các entities và controllers của dự án Cờ Tỷ Phú (Monopoly Bank)

## Mô Tả
Tài liệu định nghĩa các thuật ngữ nghiệp vụ cốt lõi của game Cờ Tỷ Phú và cách chúng được ánh xạ vào cấu trúc cơ sở dữ liệu/mã nguồn của ứng dụng.

## Áp Dụng

### 1. Thực Thể Game Cốt Lõi (Core Game Entities)
* **Room (Phòng chơi)**: Đại diện cho một bàn cờ hoặc một phiên chơi game đang hoạt động. Có các trạng thái (`status`): `waiting` (đang đợi), `playing` (đang chơi), `finished` (đã kết thúc).
* **User (Người chơi)**: Tài khoản người chơi trong hệ thống, được định danh bằng một `nickname` duy nhất.
* **RoomUser (Thành viên phòng chơi)**: Thực thể liên kết giữa User và Room. Mỗi người chơi trong một phòng sẽ có một màu sắc đại diện (`red`, `blue`, `green`, `yellow`) và một số dư tài khoản game (`balance`) ban đầu mặc định là 2000.
* **Property (Mẫu đất đai)**: Các ô đất/tài sản mẫu trên bàn cờ tỷ phú.
* **RoomProperty (Đất đai trong phòng)**: Thực thể instance của tài sản nằm trong một phòng chơi cụ thể, lưu trữ thông tin chủ sở hữu (`owner`), số lượng nhà/khách sạn đã xây, và trạng thái thế chấp (`isMortgaged`).

### 2. Giao Dịch Tài Chính (Financial Transactions)
* **Bank (Ngân hàng)**: Là chủ thể tài chính mặc định của game. Trong code, Ngân hàng được biểu diễn gián tiếp khi trường quan hệ người gửi (`fromUser`) hoặc người nhận (`toUser`) mang giá trị `null` hoặc `undefined`.
* **Transaction (Giao dịch)**: Nhật ký biến động số dư tiền tệ giữa các người chơi hoặc giữa người chơi với Ngân hàng.
* **Transaction Types (Loại giao dịch)**:
  * `pass_start`: Đi qua điểm xuất phát, người chơi nhận tiền thưởng (thường là cộng 200) từ Ngân hàng.
  * `buy`: Mua đất đai hoặc tài sản từ Ngân hàng.
  * `rent`: Trả tiền thuê đất cho người chơi khác khi đi vào ô đất của họ.
  * `tax`: Nộp thuế cho Ngân hàng khi đi vào ô thuế.
  * `trade`: Chuyển tiền/giao dịch tự do giữa hai người chơi.
  * `mortgage`: Thế chấp tài sản cho Ngân hàng để nhận tiền cứu trợ.
  * `redeem`: Chuộc lại tài sản đã thế chấp từ Ngân hàng.

## Lý Do
Đảm bảo tất cả các nhà phát triển và agent AI sử dụng chung ngôn ngữ nghiệp vụ thống nhất, tránh việc đặt tên biến lệch chuẩn so với thiết kế trò chơi Cờ Tỷ Phú.
