# Quyết Định Kiến Trúc – Architectural Decisions
**Ngày thêm:** 2026-05-19
**Nguồn:** Quá trình refactoring chia tách tầng Controller và Service

## Mô Tả
Các quyết định kiến trúc cốt lõi đã được đội ngũ phát triển thông qua trong dự án Monopoly Banking Backend, tối ưu hóa cấu trúc tệp tin và phân tách trách nhiệm rõ ràng.

## Áp Dụng

### 1. Phân Tách Tầng Controller và Service (Controller-Service Pattern)
Luôn tách biệt logic xử lý request (Controller) và logic nghiệp vụ/database (Service). Controller chỉ làm nhiệm vụ tiếp nhận HTTP request, trong khi Service chịu trách nhiệm xử lý logic, giao tiếp với Database (TypeORM Repositories) và phát sự kiện Real-time (WebSocket).

```typescript
// ✅ ĐÚNG: Controller chỉ gọi Service
@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post(':roomId/transaction')
  async transaction(@Param('roomId') roomId: number, @Body() body: TransactionDto) {
    return this.gameService.transaction(roomId, body);
  }
}
```

### 2. Tích hợp Real-time WebSocket từ Service
Phát các sự kiện WebSocket ngay bên trong các phương thức của Service bằng cách inject `GameGateway` và gọi trực tiếp các phương thức phát sóng sự kiện sau khi đã lưu DB thành công.

```typescript
// Trong GameService
async transaction(roomId: number, body: TransactionDto) {
  // 1. Thực hiện logic lưu DB
  await this.txRepo.save(tx);
  
  // 2. Emit sự kiện real-time ngay lập tức
  this.ws.emitTransaction({
    roomId: +roomId,
    id: tx.id,
    amount: tx.amount,
  });
}
```

### 3. Khai thác Decorator `@RelationId` để phẳng hóa Response DTOs
Dùng `@RelationId` để lấy trực tiếp khóa ngoại làm trường thuộc tính kiểu số (hoặc null) mà không cần nạp toàn bộ thực thể quan hệ, giúp API phản hồi cực nhanh.

```typescript
@Entity('transactions')
export class Transaction {
  @ManyToOne(() => User, (user) => user.transactionsFrom, { nullable: true })
  fromUser: User;

  @RelationId((t: Transaction) => t.fromUser)
  fromUserId: number | null;
}
```

## Lý Do
* **Single Responsibility Principle**: Việc tách Service layer giúp code dễ bảo trì, dễ test, và tái sử dụng logic ở nhiều nơi mà không bị dính chặt vào request context.
* **Tối ưu hóa DB**: Tránh việc join không cần thiết bằng cách sử dụng `@RelationId` để lấy ID thay vì load cả Entity.
