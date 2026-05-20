# Quy Ước Viết Code – Coding Conventions
**Ngày thêm:** 2026-05-19
**Nguồn:** Khảo sát cấu trúc thư mục dự án và các controllers, entities hiện hữu

## Mô Tả
Tài liệu quy định cách tổ chức thư mục, đặt tên tệp tin, viết câu lệnh import và khai báo kiểu dữ liệu nhất quán trên toàn bộ codebase NestJS.

## Áp Dụng

### 1. Tổ Chức Thư Mục Domain/Tính Năng
Tất cả các thành phần logic được gom nhóm theo vai trò kỹ thuật trong thư mục `src/`:
* `src/entity/` chứa các thực thể Database (`*.entity.ts`)
* `src/controller/` chứa định tuyến API (`*.controller.ts`)
* `src/service/` chứa logic xử lý nghiệp vụ (`*.service.ts`)
* `src/gateway/` chứa các cổng WebSocket kết nối real-time (`*.gateway.ts`)

### 2. Mô hình Barrel Imports (`index.ts`)
Mỗi thư mục thành phần bắt buộc phải có một tệp `index.ts` để re-export toàn bộ module con bên trong. Tránh import trực tiếp các file sâu.

```typescript
// ✅ ĐÚNG: Import gọn từ barrel
import { Room, RoomUser, Transaction, User } from '@/entity';

// ❌ SAI: Import trực tiếp file đơn lẻ
import { Room } from '@/entity/room.entity';
```

### 3. Path Aliasing với ký tự `@/`
Sử dụng alias `@/` đại diện cho thư mục `src/` để viết đường dẫn import sạch sẽ, bất kể file đang nằm ở tầng sâu nào.

```typescript
// ✅ ĐÚNG
import { GameGateway } from '@/gateway';

// ❌ SAI
import { GameGateway } from '../gateway/game.gateway';
```

### 4. Định Nghĩa Kiểu Dữ Liệu Khớp Với Database Enums
Khi các trường trong Entity Database dùng kiểu `enum`, code TypeScript tương ứng phải định nghĩa kiểu Union rõ ràng thay vì sử dụng kiểu `string` chung chung.

```typescript
export type TColor = 'red' | 'blue' | 'green' | 'yellow';

@Column({
  default: 'red',
  type: 'enum',
  enum: ['red', 'blue', 'green', 'yellow'],
})
color: TColor;
```

## Lý Do
* **Dễ bảo trì**: Barrel imports kết hợp với Path Alias giúp việc di chuyển vị trí file hay cấu trúc lại thư mục không làm gãy các câu lệnh import ở nơi khác.
* **Type-safety**: Ràng buộc chặt chẽ kiểu dữ liệu ở mức TypeScript giúp IDE bắt lỗi sớm trước khi code chạy đến tầng Database.

### 5. Ép kiểu dữ liệu (Type Casting) cho Controller Params
Các tham số lấy từ URL qua decorator `@Param` mặc định là kiểu chuỗi (string) tại runtime, ngay cả khi được khai báo type là `number` trong Typescript. Điều này dễ gây bug khi so sánh nghiêm ngặt `!==`.

```typescript
// ✅ ĐÚNG: Sử dụng dấu '+' để ép kiểu tham số sang number khi truyền xuống Service
@Patch(':roomId/users/:userId/color')
async changeUserColor(
  @Param('roomId') roomId: string,
  @Param('userId') targetUserId: string,
) {
  return this.roomService.changeUserColor(+roomId, +targetUserId);
}
```
