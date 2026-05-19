# Workflow: Lập Kế Hoạch Trước Khi Code

## Mục Đích
Trước khi viết bất kỳ dòng code nào cho tác vụ phức tạp, agent PHẢI lập kế hoạch rõ ràng và được developer phê duyệt. Điều này tránh lãng phí thời gian code sai hướng.

---

## Khi Nào Bắt Buộc Lập Kế Hoạch

**Bắt buộc** khi tác vụ thuộc một trong các loại:
- Tạo module mới từ đầu
- Thay đổi database schema (thêm/sửa/xóa migration)
- Refactor ảnh hưởng nhiều file (>3 files)
- Tích hợp third-party service mới
- Thay đổi authentication/authorization flow

**Không cần** khi:
- Fix typo, sửa message lỗi
- Thêm 1 field đơn giản vào DTO
- Viết unit test cho code đã có

---

## Quy Trình Lập Kế Hoạch

### Bước 1: Đọc & Phân Tích Yêu Cầu

Trước khi plan, đọc lại:
- [ ] Rules trong `.agent/rules/`
- [ ] Learnings liên quan trong `.agent/learnings/`
- [ ] Code hiện có của module liên quan

### Bước 2: Tạo Plan Document

Trình bày plan theo template sau và **chờ developer approve** trước khi code:

---

## Template Plan

```markdown
# Plan: [Tên Tính Năng/Task]

## 📋 Tóm Tắt
[1-2 câu mô tả sẽ làm gì]

## 📁 Files Sẽ Thay Đổi/Tạo Mới

### Tạo Mới
- `src/modules/<feature>/<feature>.module.ts`
- `src/modules/<feature>/<feature>.controller.ts`
- `src/modules/<feature>/<feature>.service.ts`
- `src/modules/<feature>/dto/create-<feature>.dto.ts`
- `src/modules/<feature>/entities/<feature>.entity.ts`
- `src/migrations/TIMESTAMP-create-<feature>-table.ts`

### Chỉnh Sửa
- `src/app.module.ts` – Import FeatureModule
- `src/modules/auth/auth.module.ts` – Export AuthService nếu cần

## 🗄️ Database Changes
```sql
-- Migration sẽ tạo
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_features_user_id ON features(user_id);
```

## 🔌 API Endpoints
| Method | Endpoint | Auth | Mô Tả |
|--------|----------|------|-------|
| POST | `/api/features` | JWT | Tạo mới |
| GET | `/api/features` | JWT | Danh sách (có phân trang) |
| GET | `/api/features/:id` | JWT | Chi tiết |
| PATCH | `/api/features/:id` | JWT + Owner | Cập nhật |
| DELETE | `/api/features/:id` | JWT + Admin | Xóa |

## 📐 Sơ Đồ Luồng Xử Lý Chính

### Tạo Feature
```
POST /api/features
    ↓
JwtAuthGuard (verify token)
    ↓
FeatureController.create(dto: CreateFeatureDto)
    ↓
FeatureService.create(userId, dto)
    ├── Validate: kiểm tra giới hạn business rule
    ├── FeatureRepository.save(entity)
    └── EventEmitter.emit('feature.created')
         ↓
    [NotificationListener] → Thông báo
```

## 🔒 Bảo Mật
- [ ] Tất cả endpoint có `@UseGuards(JwtAuthGuard)`
- [ ] Owner check: user chỉ sửa/xóa của mình
- [ ] Admin route có thêm `RolesGuard`
- [ ] Input sanitization cho field text

## 🧪 Test Plan
- Unit test: `FeatureService` (mock repository)
- Unit test: `FeatureController` (mock service)
- E2E test: Happy path CRUD flow

## ⚠️ Rủi Ro & Phụ Thuộc
- Phụ thuộc: `UserModule` phải được import trước
- Migration cần chạy trước khi deploy
- Breaking change: [Có/Không]

## ❓ Câu Hỏi Cần Xác Nhận
1. Soft delete hay hard delete?
2. Cần audit log cho thao tác xóa không?
3. Giới hạn tối đa bao nhiêu feature/user?

---
**Xác nhận để bắt đầu code? (yes/no hoặc có feedback gì không?)**
```

---

## Quy Tắc Sau Khi Được Approve

### Thứ Tự Implementation (Luôn Theo Thứ Tự Này)
1. **Entity** – Định nghĩa database model
2. **Migration** – Tạo/cập nhật schema
3. **Repository** – Custom query methods
4. **DTO** – Input validation schemas
5. **Service** – Business logic
6. **Controller** – HTTP endpoints
7. **Module** – Wire everything together
8. **AppModule** – Register module
9. **Tests** – Unit tests
10. **Swagger** – Verify documentation

### Commit Strategy
Tạo commit nhỏ theo từng bước, không commit một lượt toàn bộ:
```
feat(feature): add Feature entity and migration
feat(feature): add FeatureRepository with custom queries
feat(feature): add FeatureService with business logic
feat(feature): add FeatureController with REST endpoints
feat(feature): register FeatureModule in AppModule
test(feature): add unit tests for FeatureService
```

---

## Cập Nhật Plan Khi Có Thay Đổi

Nếu trong quá trình code phát hiện cần thay đổi so với plan:
1. **Dừng lại** và thông báo cho developer
2. Giải thích lý do cần thay đổi
3. Đề xuất adjustment
4. Chờ approve trước khi tiếp tục

**Không tự ý** thay đổi scope mà không báo trước.
