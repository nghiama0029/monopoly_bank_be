# Phiên Bản Thư Viện Sử Dụng – Dependency Versions
**Ngày thêm:** 2026-05-19
**Nguồn:** Trích xuất thông tin trực tiếp từ package.json hiện tại của dự án

## Mô Tả
Tài liệu liệt kê các phiên bản thư viện cốt lõi đang hoạt động trong dự án. Tuyệt đối không tự ý nâng cấp (upgrade) hoặc hạ cấp (downgrade) các thư viện này nếu không được nhà phát triển yêu cầu để tránh các xung đột tương thích.

## Áp Dụng

### Khung Công Cụ Chính (Core Framework)
* **`@nestjs/common`**: `^11.0.1`
* **`@nestjs/core`**: `^11.0.1`
* **`@nestjs/platform-express`**: `^11.0.1`

### Giao Tiếp Real-time & WebSockets
* **`@nestjs/platform-socket.io`**: `^11.1.6`
* **`@nestjs/websockets`**: `^11.1.6`
* **`socket.io`**: `^4.8.1`
* **`socket.io-client`**: `^4.8.1`

### Kết Nối Cơ Sở Dữ Liệu & ORM
* **`typeorm`**: `^0.3.25`
* **`@nestjs/typeorm`**: `^11.0.0`
* **`mysql2`**: `^3.14.3`

### Xác Thực & Bảo Mật
* **`@nestjs/jwt`**: `^11.0.0`
* **`@nestjs/passport`**: `^11.0.5`
* **`passport`**: `^0.7.0`
* **`passport-jwt`**: `^4.0.1`
* **`bcrypt`**: `^6.0.0`

## Lý Do
Đảm bảo tính tương thích và hoạt động ổn định của toàn hệ thống backend. NestJS v11 có các thay đổi quan trọng về cách giải quyết dependency injection và việc nâng cấp tùy tiện các thư viện typeorm/websockets có thể gây lỗi runtime nghiêm trọng.
