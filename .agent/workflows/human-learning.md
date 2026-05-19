# Workflow: Human Learning – Hướng Dẫn Developer

## Mục Đích
Khi developer hỏi về cách làm gì đó trong NestJS hoặc cần giải thích một khái niệm, workflow này đảm bảo agent dạy theo cách hiệu quả nhất: không chỉ cho đáp án mà giúp developer thực sự hiểu và tự làm được lần sau.

---

## Nguyên Tắc Dạy

### 1. Đánh Giá Level Trước
Đọc context từ câu hỏi để xác định level:

| Dấu Hiệu | Level | Cách Dạy |
|----------|-------|----------|
| Hỏi định nghĩa cơ bản | Beginner | Giải thích từ đầu, nhiều ví dụ đơn giản |
| Hiểu concept, hỏi cách implement | Intermediate | Tập trung vào implementation + best practice |
| Hỏi về trade-off, edge case | Advanced | Thảo luận sâu, so sánh hướng tiếp cận |

### 2. Cấu Trúc Giải Thích (WHAT → WHY → HOW → DO)

```
WHAT: Đây là gì? (1-2 câu)
WHY:  Tại sao cần dùng? (use case thực tế trong dự án)
HOW:  Cơ chế hoạt động? (giải thích ngắn)
DO:   Code example thực tế (từ codebase dự án nếu có)
```

### 3. Học Chủ Động
Sau giải thích, khuyến khích developer tự thực hành:
- Đặt câu hỏi kiểm tra hiểu biết
- Giao bài tập nhỏ nếu phù hợp
- Hỏi xem có điểm nào chưa rõ

---

## Template Giải Thích Theo Chủ Đề

### Template: Giải Thích Khái Niệm NestJS

```markdown
## [Tên Khái Niệm]

### 📌 Là Gì?
[1-2 câu định nghĩa đơn giản]

### 🤔 Tại Sao Cần?
[Use case cụ thể, ví dụ thực tế trong dự án]

### ⚙️ Hoạt Động Như Thế Nào?
[Giải thích flow/mechanism]

### 💻 Ví Dụ Code
```typescript
// Ví dụ đơn giản nhất
...

// Ví dụ thực tế hơn từ dự án
...
```

### ⚠️ Lưu Ý Thường Gặp
- Lỗi hay mắc phải: ...
- Best practice: ...

### 🔗 Liên Quan Đến
[Khái niệm nào khác cần biết thêm]
```

---

## Ví Dụ Thực Tế

### Tình Huống: Developer Hỏi Về Interceptor

**Developer:** "Interceptor là gì? Khi nào dùng?"

**Agent trả lời theo workflow:**

---

## Interceptor trong NestJS

### 📌 Là Gì?
Interceptor là class có thể "chen vào" luồng xử lý request/response, chạy trước **và sau** khi route handler thực thi. Giống như middleware nhưng mạnh hơn vì có thể thao tác với cả response.

### 🤔 Tại Sao Cần?
Trong dự án của chúng ta, interceptor đang được dùng để:
- Wrap response theo format chuẩn `{ success, data, timestamp }`
- Log thời gian xử lý mỗi request
- Transform data trước khi trả về client

### ⚙️ Hoạt Động Như Thế Nào?
```
Request → [Interceptor Pre] → Controller → Service → [Interceptor Post] → Response
```
Interceptor dùng RxJS Observable để "bắt" response stream và transform nó.

### 💻 Ví Dụ: Response Transform Interceptor

```typescript
// src/common/interceptors/transform.interceptor.ts
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const now = Date.now();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        message: 'Thành công',
        timestamp: new Date().toISOString(),
        duration: `${Date.now() - now}ms`,
      })),
    );
  }
}

// Đăng ký global trong main.ts
app.useGlobalInterceptors(new TransformInterceptor());
```

### ⚠️ Lưu Ý
- Interceptor chạy **sau** Guard và **trước** Exception Filter
- Nếu cần access request/response thuần: dùng `context.switchToHttp().getRequest()`
- Dùng `@UseInterceptors(LoggingInterceptor)` để áp dụng cho 1 route cụ thể

### 🔗 Liên Quan Đến
- **Middleware**: chạy trước Guard, không biết route handler là gì
- **Guard**: quyết định có cho phép request tiếp tục không
- **Exception Filter**: xử lý lỗi ở cuối pipeline

---

**Kiểm tra hiểu biết:**
> Bạn cần log "User X vừa truy cập endpoint Y lúc Z" cho mọi request. Bạn sẽ dùng Middleware hay Interceptor? Tại sao?

---

## Hướng Dẫn Theo Cấp Độ

### Cho Beginner (Mới học NestJS)
- Giải thích analog với Express/Koa trước
- Chỉ show 1 example đơn giản, không đưa nhiều variant
- Nhắc nhở decorator syntax của TypeScript
- Gợi ý đọc thêm docs chính thức

### Cho Intermediate
- Tập trung vào best practice trong dự án này
- Chỉ ra pitfall thường gặp
- So sánh với cách làm alternative

### Cho Advanced
- Thảo luận trade-off
- Đề cập performance implications
- Source code NestJS internals nếu relevant

---

## Theo Dõi Tiến Độ

Sau khi giải thích, ghi nhận vào `learnings/` nếu phát hiện:
- Knowledge gap phổ biến của team
- Khái niệm developer hay nhầm lẫn
- Best practice mới cần add vào rules
