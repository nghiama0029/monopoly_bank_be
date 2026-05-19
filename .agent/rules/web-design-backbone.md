# Rule: Xương Sống Kiến Trúc Monopoly Backend

## Mục Đích
Định nghĩa các nguyên tắc kiến trúc cốt lõi mang tính thực tiễn cao, dựa trên cách dự án đang thực sự được triển khai. Agent phải tuân thủ các rule này thay vì sinh ra các boilerplate code phức tạp mặc định của NestJS.

---

## 1. Cấu Trúc Thư Mục Phẳng (Flat Domain)

Dự án KHÔNG sử dụng thư mục con theo từng feature (như `src/modules/user/`). Thay vào đó, tất cả các thành phần được gom nhóm theo loại kỹ thuật (technical role) ở thư mục gốc `src/`.

```
src/
├── controller/     # Chứa mọi HTTP routes (*.controller.ts)
├── entity/         # Chứa mọi Database schema (*.entity.ts)
├── service/        # Chứa mọi logic nghiệp vụ & DTO (*.service.ts)
├── gateway/        # Chứa mọi kết nối WebSocket (*.gateway.ts)
├── module/         # (Không dùng) Toàn bộ app đăng ký chung trong app.module.ts
```
**Bắt buộc:** Luôn sử dụng file `index.ts` (Barrel import) ở mỗi thư mục trên để dễ dàng import bằng alias `@/`.

---

## 2. Layered Architecture Rút Gọn

```
Request → Controller → Service → TypeORM Repository → Database
```

**Nguyên tắc:**
- **Controller**: Rất mỏng. Chỉ nhận Request (`@Body`, `@Param`), gọi hàm tương ứng trong Service và trả thẳng kết quả.
- **Service**: Dày nhất. Chứa mọi logic tính toán (ví dụ: chuyển lượt, trừ tiền, đổ xí ngầu), gọi TypeORM Repository, và trực tiếp gọi `Gateway` để phát tín hiệu Real-time.
- **Repository**: KHÔNG TẠO CLASS REPOSITORY RIÊNG. Sử dụng trực tiếp `Repository<Entity>` mặc định của TypeORM.

---

## 3. Dependency Injection (DI)

Dự án inject trực tiếp TypeORM entity thông qua `@InjectRepository()`.

```typescript
// ✅ ĐÚNG: Dùng InjectRepository mặc định
@Injectable()
export class GameService {
  constructor(
    @InjectRepository(RoomUser)
    private readonly roomUserRepo: Repository<RoomUser>,
    private readonly ws: GameGateway, // Trực tiếp gọi socket
  ) {}
}

// ❌ SAI: Tạo và gọi Custom Repository Class phức tạp
```

---

## 4. DTO Đơn Giản & Không Class-Validator

Chúng ta sử dụng TypeScript `class` hoặc `interface` thuần túy làm DTO bên trong thư mục `src/service/` (không có thư mục `dto` riêng, không gắn `@IsString()`).

```typescript
// ✅ ĐÚNG: Khai báo ngay trong file service
export class TransactionDto {
  userId: number;
  toUserId?: number;
  amount: number;
  type: TTransactionType;
}
```

---

## 5. Exception Handling Cơ Bản

Chỉ sử dụng các Built-in Exception của NestJS. Tránh tạo Custom Exceptions như `BusinessException`.

```typescript
// ✅ ĐÚNG
throw new NotFoundException('Phòng không tồn tại');
throw new BadRequestException('User đã đầu hàng và không thể giao dịch');
throw new ForbiddenException('Chỉ chủ phòng mới được bắt đầu game');
```

---

## 6. Logic Transaction Thực Dụng

Không bọc `dataSource.transaction()` cho các luồng cơ bản. Thay vào đó, thực hiện tuần tự các bước kiểm tra (throw error sớm nếu lỗi) rồi gọi `await repo.save()` từng phần. Tính toàn vẹn được đảm bảo bằng việc Validate trước khi thao tác DB.

```typescript
// ✅ ĐÚNG: Validate kỹ -> Save tuần tự
if (from.balance < amount) throw new BadRequestException('Thiếu tiền');
from.balance -= amount;
to.balance += amount;

await this.roomUserRepo.save(from);
await this.roomUserRepo.save(to);
```
