# Skill: Brainstorming Kiến Trúc & Giải Pháp NestJS

## Khi Nào Dùng Skill Này
- Developer mô tả một tính năng mới cần thiết kế
- Cần lựa chọn giữa nhiều hướng triển khai
- Muốn phân tích trade-off trước khi code
- Lên kế hoạch refactor module lớn

---

## Quy Trình Brainstorming

### Bước 1: Làm Rõ Bài Toán
Trước khi đề xuất giải pháp, hỏi và xác nhận:
- Tính năng này phục vụ actor nào? (user, admin, system)
- Quy mô dữ liệu dự kiến? (nghìn/triệu records)
- Có yêu cầu real-time không?
- SLA/performance requirement cụ thể?
- Có phụ thuộc vào module/service nào hiện tại không?

### Bước 2: Liệt Kê Các Hướng Tiếp Cận
Đưa ra tối thiểu **2-3 hướng**, mỗi hướng gồm:
- Mô tả ngắn gọn
- Ưu điểm
- Nhược điểm
- Khi nào phù hợp

### Bước 3: Đề Xuất Hướng Khuyến Nghị
Chọn 1 hướng với lý do rõ ràng dựa trên context dự án.

### Bước 4: Phác Thảo Implementation
Vẽ sơ đồ luồng xử lý + code skeleton cơ bản.

---

## Template Brainstorming

### 🎯 Bài Toán
> [Mô tả bài toán bằng 2-3 câu]

### 👥 Actors & Use Cases
| Actor | Hành động | Kết quả mong đợi |
|-------|----------|-----------------|
| | | |

### 📊 Constraints
- Performance: ...
- Scale: ...
- Security: ...
- Deadline: ...

### 🔀 Các Hướng Tiếp Cận

#### Hướng A: [Tên]
```
Mô tả: ...
Pros: ✅ ...
Cons: ❌ ...
Phù hợp khi: ...
```

#### Hướng B: [Tên]
```
Mô tả: ...
Pros: ✅ ...
Cons: ❌ ...
Phù hợp khi: ...
```

### ✅ Khuyến Nghị: Hướng [X]
**Lý do:** ...

### 📐 Sơ Đồ Luồng
```
[Client] → POST /api/feature
    ↓
[FeatureController.create()]
    ↓
[FeatureService.processCreate()]
    ├── Validate business rules
    ├── [ExternalService.call()] (nếu cần)
    └── [FeatureRepository.save()]
         ↓
    [EventEmitter: feature.created]
         ↓
    [NotificationListener] → Gửi email/push
```

### 🗂️ Module Structure Đề Xuất
```
src/modules/<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
├── dto/
├── entities/
└── events/         # Nếu dùng event-driven
```

### ⚠️ Rủi Ro & Cần Lưu Ý
- [ ] Rủi ro 1...
- [ ] Rủi ro 2...

---

## Ví Dụ Thực Tế: Thiết Kế Hệ Thống Thông Báo

### 🎯 Bài Toán
Cần gửi thông báo (email, push, in-app) khi có các sự kiện trong hệ thống như đơn hàng mới, thanh toán thành công, v.v.

### 🔀 Các Hướng

#### Hướng A: Gọi trực tiếp trong Service
```typescript
// ❌ Tight coupling - khó mở rộng
async createOrder(dto: CreateOrderDto) {
  const order = await this.orderRepo.save(dto);
  await this.emailService.sendOrderConfirmation(order);
  await this.pushService.notify(order.userId, '...');
  return order;
}
```
- Pros: Đơn giản, dễ debug
- Cons: Tight coupling, chậm response time, khó thêm loại thông báo mới

#### Hướng B: Event-Driven với EventEmitter2
```typescript
// ✅ Loose coupling - dễ mở rộng
async createOrder(dto: CreateOrderDto) {
  const order = await this.orderRepo.save(dto);
  this.eventEmitter.emit('order.created', new OrderCreatedEvent(order));
  return order; // Trả về ngay, không chờ gửi thông báo
}

@OnEvent('order.created')
async handleOrderCreated(event: OrderCreatedEvent) {
  await this.emailService.sendOrderConfirmation(event.order);
  await this.pushService.notify(event.order.userId, '...');
}
```
- Pros: Loose coupling, response nhanh, dễ thêm listener mới
- Cons: Khó debug hơn, cần xử lý lỗi async

#### Hướng C: Queue với BullMQ
- Phù hợp khi cần retry, delay, priority
- Overkill cho hệ thống nhỏ

### ✅ Khuyến Nghị: Hướng B
Dùng EventEmitter2 cho giai đoạn hiện tại. Migrate sang BullMQ khi có yêu cầu retry/scheduling phức tạp.
