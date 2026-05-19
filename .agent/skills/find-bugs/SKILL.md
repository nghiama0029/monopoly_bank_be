# Skill: Tìm & Phân Tích Bug NestJS

## Khi Nào Dùng Skill Này
- Developer báo cáo lỗi runtime hoặc unexpected behavior
- Có exception log cần phân tích
- Test đang fail không rõ nguyên nhân
- Performance bất ngờ giảm sút

---

## Quy Trình Tìm Bug

### Bước 1: Thu Thập Thông Tin
Yêu cầu cung cấp (nếu chưa có):
1. **Error message / Stack trace** đầy đủ
2. **Request payload** gây ra lỗi
3. **Môi trường**: dev/staging/production
4. **Tần suất**: always / intermittent / chỉ dưới tải cao
5. **Thời điểm bắt đầu**: commit/deploy nào gây ra

### Bước 2: Phân Loại Bug
Xác định loại bug để chọn hướng debug phù hợp:

| Loại | Dấu Hiệu | Hướng Kiểm Tra |
|------|----------|----------------|
| **Runtime Exception** | Stack trace rõ ràng | Trace từ dòng lỗi lên |
| **Logic Bug** | Kết quả sai, không crash | So sánh expected vs actual |
| **Race Condition** | Lỗi intermittent, dưới tải | Concurrent operations, transaction |
| **Memory Leak** | Chậm dần theo thời gian | Event listeners, circular refs |
| **Performance** | Timeout, slow response | Query analysis, N+1 |
| **Integration** | Lỗi khi gọi service ngoài | Network, serialization |

### Bước 3: Phân Tích Root Cause
Đừng chỉ fix symptom, tìm root cause thật sự.

---

## Các Bug Pattern Thường Gặp Trong NestJS

### 🐛 Bug #1: Circular Dependency
```
Error: Nest cannot create the UserModule instance.
The module at index [1] of the UserModule "imports" array is undefined.
```
**Root cause:** Module A import Module B, Module B import Module A

**Fix:**
```typescript
// Dùng forwardRef() cho circular deps thực sự cần thiết
@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {}
}
```
**Khuyến nghị:** Refactor để loại bỏ circular dep thay vì dùng forwardRef.

---

### 🐛 Bug #2: TypeORM Repository Not Found
```
Error: No metadata for "User" was found.
```
**Root cause:** Entity chưa được đăng ký trong module

**Fix:**
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User])], // Phải có dòng này
  providers: [UserService, UserRepository],
})
export class UserModule {}
```

---

### 🐛 Bug #3: Async Exception Không Được Catch
```
UnhandledPromiseRejectionWarning: ...
```
**Root cause:** Quên `await` hoặc không return Promise trong async method

```typescript
// ❌ Bug: Exception bị nuốt
@Post()
create(@Body() dto: CreateUserDto) {
  this.userService.create(dto); // Thiếu await!
  return { success: true };
}

// ✅ Fix
@Post()
async create(@Body() dto: CreateUserDto) {
  const user = await this.userService.create(dto);
  return user;
}
```

---

### 🐛 Bug #4: DTO Validation Không Hoạt Động
**Dấu hiệu:** Request với dữ liệu sai vẫn pass qua, không báo lỗi validation

**Root cause thường gặp:**
1. Thiếu `ValidationPipe` global
2. Quên `@Body()` decorator
3. `whitelist: true` chưa bật, field lạ bị ignore thay vì báo lỗi

```typescript
// main.ts - Phải có
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // Loại bỏ field không có trong DTO
  forbidNonWhitelisted: true, // Báo lỗi nếu có field lạ
  transform: true,           // Auto-transform types
  transformOptions: {
    enableImplicitConversion: true,
  },
}));
```

---

### 🐛 Bug #5: JWT Token Decode Sai
**Dấu hiệu:** `req.user` là undefined dù đã có token hợp lệ

**Debug steps:**
```typescript
// Kiểm tra JwtStrategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  validate(payload: JwtPayload) {
    console.log('JWT Payload:', payload); // Debug
    // Nếu return undefined → req.user sẽ undefined
    return { id: payload.sub, email: payload.email }; // Phải return object
  }
}
```

---

### 🐛 Bug #6: N+1 Query Gây Chậm
**Phát hiện bằng cách bật query logging:**
```typescript
// TypeORM logging
TypeOrmModule.forRoot({
  logging: ['query', 'error'], // Bật trong dev
})
```
Nếu thấy cùng 1 query lặp lại N lần → N+1 problem

**Fix:** Dùng `relations` hoặc QueryBuilder với `leftJoinAndSelect`

---

### 🐛 Bug #7: CORS Error Trên Production
**Dấu hiệu:** Hoạt động local nhưng lỗi CORS trên production

```typescript
// ✅ Config CORS đúng
app.enableCors({
  origin: configService.get<string[]>('ALLOWED_ORIGINS'),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
});
```

---

### 🐛 Bug #8: Memory Leak Từ Event Listener
**Dấu hiệu:** Memory tăng dần theo thời gian, không giảm

```typescript
// ❌ Không cleanup listener
@Injectable()
export class SomeService implements OnModuleInit {
  onModuleInit() {
    process.on('message', this.handleMessage); // Leak!
  }
}

// ✅ Cleanup trong OnModuleDestroy
@Injectable()
export class SomeService implements OnModuleInit, OnModuleDestroy {
  private boundHandler = this.handleMessage.bind(this);

  onModuleInit() {
    process.on('message', this.boundHandler);
  }

  onModuleDestroy() {
    process.off('message', this.boundHandler);
  }
}
```

---

## Format Báo Cáo Bug

```markdown
## 🐛 Bug Report

### Mô Tả
[Ngắn gọn: bug gây ra điều gì]

### Root Cause
[Giải thích tại sao xảy ra]

### Reproduce Steps
1. ...
2. ...
3. Kết quả: [actual] vs [expected]

### Fix Đề Xuất
```typescript
// Before
...
// After
...
```

### Phòng Tránh Tương Lai
[Pattern/convention cần thêm vào learnings]
```

---

## Debug Commands Hữu Ích

```bash
# Xem logs realtime
npm run start:dev 2>&1 | grep -E "ERROR|WARN|Exception"

# Kiểm tra TypeORM queries
DEBUG=typeorm:* npm run start:dev

# Memory profiling
node --inspect dist/main.js
# Sau đó mở chrome://inspect

# Kiểm tra circular deps
npx madge --circular --extensions ts src/
```
