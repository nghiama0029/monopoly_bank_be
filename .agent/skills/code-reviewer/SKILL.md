# Skill: Code Reviewer NestJS

## Khi Nào Dùng Skill Này
- Developer yêu cầu review code trước khi merge
- Sau khi sinh code mới, tự review lại trước khi trình bày
- Khi refactor và cần đánh giá chất lượng

---

## Checklist Review Theo Thứ Tự Ưu Tiên

### 🔴 Critical (Phải Fix Trước Khi Merge)

#### Bảo Mật
- [ ] Không có thông tin nhạy cảm hardcode (secret, password, API key)
- [ ] Input từ user đều được validate qua DTO + class-validator
- [ ] SQL injection: không dùng raw query với string interpolation
- [ ] Các route cần auth đều có Guard bảo vệ
- [ ] Không expose thông tin nội bộ qua error message

```typescript
// ❌ SQL Injection Risk
const users = await this.repo.query(`SELECT * FROM users WHERE name = '${name}'`);

// ✅ Safe
const users = await this.repo.query('SELECT * FROM users WHERE name = $1', [name]);
```

#### Logic Nghiệp Vụ
- [ ] Các edge case đã được xử lý (null, empty, boundary values)
- [ ] Race condition trong concurrent operations
- [ ] Transaction bao phủ đúng phạm vi (không thiếu, không thừa)

#### Error Handling
- [ ] Không có `catch` block trống hoặc nuốt lỗi im lặng
- [ ] Lỗi được log đủ context để debug
- [ ] Không throw Error thô ra controller layer

```typescript
// ❌ Nuốt lỗi
try {
  await this.emailService.send(email);
} catch (e) {} // Nguy hiểm

// ✅ Xử lý đúng
try {
  await this.emailService.send(email);
} catch (error) {
  this.logger.error('Gửi email thất bại', { email, error: error.message });
  // Quyết định: throw lên hay chỉ log tùy business rule
}
```

---

### 🟡 Major (Nên Fix, Ảnh Hưởng Maintainability)

#### Kiến Trúc & Separation of Concerns
- [ ] Controller không chứa business logic
- [ ] Service không gọi HTTP request ra ngoài (phải qua dedicated service)
- [ ] Repository không chứa business rule
- [ ] Không có circular dependency giữa modules

#### Performance
- [ ] Không có N+1 query trong loop
- [ ] Các query lớn có phân trang
- [ ] Index đã được thêm vào các field thường query
- [ ] Không load toàn bộ entity khi chỉ cần vài field

```typescript
// ❌ N+1 Query
const orders = await this.orderRepo.find();
for (const order of orders) {
  order.user = await this.userRepo.findOne({ where: { id: order.userId } });
}

// ✅ Eager loading / Join
const orders = await this.orderRepo.find({ relations: ['user'] });
```

#### TypeScript
- [ ] Không dùng `any` (phải có comment lý do nếu bất khả kháng)
- [ ] Return type của method được khai báo rõ ràng
- [ ] Interface/Type thay vì plain object literals cho complex types
- [ ] Enum thay vì magic strings

```typescript
// ❌ Magic strings
if (user.status === 'active') { ... }

// ✅ Enum
if (user.status === UserStatus.ACTIVE) { ... }
```

---

### 🟢 Minor (Nice to Have)

#### Code Style
- [ ] Tên biến/function mô tả đúng intent
- [ ] Method không quá 30 dòng (nếu quá, cân nhắc tách)
- [ ] Không có commented-out code
- [ ] Magic numbers có named constant

#### Documentation
- [ ] Các method phức tạp có JSDoc
- [ ] Swagger decorator đầy đủ trên Controller
- [ ] README cập nhật nếu thay đổi API public

#### Testing
- [ ] Unit test bao phủ happy path + error cases
- [ ] Mock dependencies đúng cách
- [ ] Test name mô tả rõ scenario

---

## Format Output Review

```markdown
## Kết Quả Review: `<tên-file>`

### 🔴 Critical Issues (X issues)
**[Dòng Y]** Mô tả vấn đề
```code trước```
→ Đề xuất: ```code sau```

### 🟡 Major Issues (X issues)
...

### 🟢 Minor Issues (X issues)
...

### ✅ Điểm Tốt
- ...

### 📊 Đánh Giá Tổng Thể
- Sẵn sàng merge: ✅ / ❌ / ⚠️ (cần fix critical)
- Code quality score: X/10
```

---

## Ví Dụ Review Thực Tế

**Input code:**
```typescript
@Post()
async create(@Body() body: any) {
  const user = await this.userService.create(body);
  return user;
}
```

**Output review:**
```
🔴 Critical: Thiếu DTO validation
- `body: any` bỏ qua toàn bộ validation layer
- Có thể inject dữ liệu độc hại vào database

→ Fix: Thay `body: any` bằng `dto: CreateUserDto`

🟡 Major: Thiếu Swagger decorator
→ Thêm @ApiOperation, @ApiBody, @ApiCreatedResponse

🟢 Minor: Thiếu @HttpCode(HttpStatus.CREATED)
```
