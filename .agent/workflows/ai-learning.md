# Workflow: AI Learning – Tích Lũy Kiến Thức Dự Án

## Mục Đích
Workflow này giúp agent tự động học và ghi nhớ các pattern, quyết định và convention của dự án theo thời gian. Mỗi lần tương tác là một cơ hội để hiểu sâu hơn về codebase.

---

## Trigger
Workflow này chạy **sau khi hoàn thành** bất kỳ tác vụ nào thuộc loại:
- Tạo file/module mới
- Fix bug
- Refactor code
- Giải thích một cơ chế phức tạp
- Developer chỉnh sửa code agent đề xuất

---

## Quy Trình

### Phase 1: Quan Sát (Trong khi làm việc)
Trong quá trình thực hiện tác vụ, ghi nhận:

```
Quan sát cần học:
- Tên biến/method developer đang dùng
- Pattern mà developer approve vs reject
- Convention trong file hiện có
- Thư viện/helper được ưa dùng
- Comment/feedback của developer về code
```

### Phase 2: Trích Xuất Learning
Sau khi hoàn thành tác vụ, phân tích xem có điều gì đáng ghi nhớ không:

**Câu hỏi tự kiểm tra:**
1. Developer có chỉnh sửa code agent đề xuất không? → Học từ thay đổi đó
2. Có pattern mới xuất hiện chưa có trong learnings không?
3. Có quyết định kiến trúc quan trọng vừa được đưa ra không?
4. Có lỗi nào xảy ra cần tránh lần sau không?

### Phase 3: Xác Nhận Với Developer
**Chỉ hỏi khi có learning thực sự đáng ghi:**

```
"Tôi nhận thấy trong dự án này [observation]. 
Bạn có muốn tôi ghi nhớ điều này để áp dụng nhất quán không?
→ [Nội dung sẽ ghi vào learnings]"
```

**Không hỏi khi:**
- Learning quá hiển nhiên (naming convention cơ bản)
- Đã có trong learnings rồi
- Chỉ là một trường hợp đặc biệt, không phải rule chung

### Phase 4: Ghi Vào Learnings

Khi developer xác nhận, ghi vào file phù hợp trong `.agent/learnings/`:

#### Cấu trúc file learning:
```markdown
# [Tên Learning]
**Ngày thêm:** YYYY-MM-DD
**Nguồn:** [Task gì dẫn đến learning này]

## Mô Tả
[1-2 câu giải thích]

## Áp Dụng
[Code example hoặc rule cụ thể]

## Lý Do
[Tại sao dự án dùng cách này]
```

---

## Ví Dụ Learning Thực Tế

### Ví Dụ 1: Phát Hiện Convention Custom
**Tình huống:** Developer sửa code từ:
```typescript
constructor(private userRepo: Repository<User>) {}
```
thành:
```typescript
constructor(private userRepository: UserRepository) {}
```

**Learning ghi lại:**
```markdown
# Custom Repository Pattern
**Ngày thêm:** 2024-01-15
**Nguồn:** Task tạo UserModule

## Mô Tả
Dự án dùng Custom Repository extend TypeORM Repository thay vì inject Repository<Entity> trực tiếp.

## Áp Dụng
```typescript
// ✅ Đúng
@InjectRepository(User)
constructor(private userRepository: UserRepository) {}

// ❌ Sai
constructor(@InjectRepository(User) private userRepo: Repository<User>) {}
```

## Lý Do
Custom repo cho phép thêm method domain-specific và dễ mock trong test hơn.
```

### Ví Dụ 2: Phát Hiện Business Rule
**Tình huống:** Developer bổ sung điều kiện check khi tạo order.

**Learning ghi lại:**
```markdown
# Business Rule: Giới Hạn Order Hàng Ngày
**Ngày thêm:** 2024-01-20

## Mô Tả
Mỗi user chỉ được tạo tối đa 5 order/ngày.

## Áp Dụng
Kiểm tra trong OrderService.create() trước khi lưu DB:
```typescript
const todayCount = await this.orderRepo.countTodayByUser(userId);
if (todayCount >= MAX_ORDERS_PER_DAY) {
  throw new BusinessException('DAILY_LIMIT_EXCEEDED', 'Đã đạt giới hạn 5 đơn hàng trong ngày');
}
```

## Lý Do
Anti-fraud requirement từ product team (ticket #234).
```

---

## Học Từ Lỗi (Error Learning)

Khi bug được fix, ghi vào `common-mistakes.md`:

```markdown
# [Tên Lỗi]
**Phát Hiện:** YYYY-MM-DD
**Mức Độ:** Critical / Major / Minor

## Triệu Chứng
[User thấy gì]

## Root Cause
[Tại sao xảy ra]

## Cách Fix
[Code fix]

## Cách Phòng Tránh
[Checklist hoặc rule]
```

---

## Metrics Đánh Giá Chất Lượng Learning

Một learning tốt phải:
- [ ] **Actionable**: Có thể áp dụng ngay vào code mà không cần suy nghĩ thêm
- [ ] **Specific**: Không chung chung, có example cụ thể
- [ ] **Justified**: Có lý do tại sao (performance, business rule, convention đội)
- [ ] **Searchable**: Có từ khóa dễ tìm khi cần
