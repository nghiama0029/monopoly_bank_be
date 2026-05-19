# Lỗi Thường Gặp Cần Tránh – Common Mistakes
**Ngày thêm:** 2026-05-19
**Nguồn:** Khắc phục lỗi thiếu user ID/name trong transaction logs & logic tính balance

## Mô Tả
Danh sách tổng hợp các lỗi phát triển thường gặp trong dự án này, giúp các tác vụ coding tiếp theo tránh được các lỗi logic tương tự.

## Áp Dụng

### 1. Quên khai báo Nested Relations trong TypeORM Query
**Triệu chứng**: Khi API trả về thông tin chi tiết Room, các trường thông tin của Transaction như `fromUser` hay `toUser` bị `null` hoặc `undefined`, mặc dù Database đã lưu khóa ngoại chính xác.
**Cách xử lý**: Khai báo rõ ràng các nested relation bằng dấu chấm khi query repository.

```typescript
// ✅ ĐÚNG: Nạp đầy đủ quan hệ của thực thể con
const room = await this.roomRepo.findOne({
  where: { id: +roomId },
  relations: [
    'createdBy',
    'roomUsers',
    'roomUsers.user', // Bắt buộc khai báo để hiển thị thông tin User
  ],
});
```

### 2. Xử lý phép tính Balance sai hướng cho loại giao dịch `pass_start`
**Triệu chứng**: Khi người chơi đi qua điểm xuất phát (`pass_start`), họ sẽ nhận tiền thưởng từ ngân hàng. Tuy nhiên, request body gửi lên lại truyền `fromUserId` là ID của chính người chơi đó. Nếu xử lý trừ tiền theo công thức giao dịch thông thường (`balance - amount`), tài khoản người chơi sẽ bị trừ tiền thay vì được cộng.
**Cách xử lý**: Luôn kiểm tra loại giao dịch (`type`) trước khi tính toán số dư.

```typescript
// ✅ ĐÚNG
from.balance =
  body.type === 'pass_start'
    ? from.balance + body.amount // Cộng tiền nếu đi qua điểm xuất phát
    : from.balance - body.amount; // Trừ tiền cho các giao dịch khác (thuế, mua đất,...)
```

## Lý Do
* **TypeORM Lazy-Loading**: Mặc định TypeORM không tự động load các quan hệ để tiết kiệm tài nguyên mạng và CPU, do đó nhà phát triển phải chỉ định chính xác các quan hệ lồng nhau khi cần sử dụng dữ liệu của chúng.
* **Đặc thù nghiệp vụ Monopoly**: Thiết kế API của ứng dụng sử dụng `fromUserId` đại diện cho đối tượng thực hiện thao tác qua điểm xuất phát, dẫn đến cần một nhánh rẽ logic riêng biệt so với việc chuyển tiền thông thường.
