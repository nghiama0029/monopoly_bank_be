# Rule: Tải và Áp Dụng Learnings

## Mục Đích
Trước khi thực hiện bất kỳ tác vụ nào liên quan đến code NestJS, agent PHẢI đọc và áp dụng toàn bộ kiến thức đã tích lũy trong thư mục `learnings/`.

## Quy Trình Bắt Buộc

### 1. Khi Bắt Đầu Session
- Đọc tất cả file trong `.agent/learnings/`
- Nạp các pattern, convention và lỗi đã học vào context
- Ưu tiên áp dụng learnings trước khi dùng kiến thức mặc định

### 2. Thứ Tự Ưu Tiên Áp Dụng
```
learnings/ (cao nhất) > skills/ > kiến thức mặc định (thấp nhất)
```

### 3. Các Loại Learnings Cần Tải
- **architectural-decisions.md** – Các quyết định kiến trúc đã được đội thông qua
- **coding-conventions.md** – Convention đặt tên, cấu trúc module, style code
- **common-mistakes.md** – Lỗi thường gặp cần tránh trong dự án này
- **dependency-versions.md** – Phiên bản thư viện đang dùng, tránh upgrade tự ý
- **domain-glossary.md** – Thuật ngữ nghiệp vụ của dự án

## Khi Tạo File Mới

Luôn kiểm tra:
- [ ] Naming convention đã đúng theo learnings chưa?
- [ ] Module structure có khớp với pattern đã học không?
- [ ] DTO, Entity, Service có theo chuẩn dự án không?

## Cập Nhật Learnings

Sau mỗi tác vụ, nếu phát hiện pattern mới hoặc quyết định quan trọng:
1. Hỏi developer xác nhận trước khi ghi vào learnings
2. Ghi ngắn gọn, súc tích, có ví dụ code thực tế
3. Đánh dấu ngày cập nhật

## Ví Dụ Áp Dụng

```typescript
// ❌ Không làm theo mặc định
export class UserService {
  constructor(private userRepo: Repository<User>) {}
}

// ✅ Làm theo learning của dự án (nếu đã học dùng custom repo)
export class UserService {
  constructor(private userRepository: UserRepository) {}
}
```
