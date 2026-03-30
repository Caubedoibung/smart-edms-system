# Báo cáo Yêu cầu Bổ sung API cho Admin Dashboard Analytics

Sau khi thực hiện đại tu giao diện Admin Dashboard với các biểu đồ phân tích chuyên sâu (sử dụng thư viện `recharts`), Frontend hiện đang sử dụng **Mock Data** cho một số thành phần. Để hệ thống hoạt động thực tế, Backend cần bổ sung các Endpoint sau:

---

## 1. Thống kê hoạt động hệ thống (7 ngày qua)
Dùng cho biểu đồ **Area Chart (System Activity)**.

- **Endpoint:** `GET /api/v1/admin/dashboard/activity-stats`
- **Mô tả:** Trả về mảng dữ liệu thống kê số lượng tải file và số lượt ký duyệt trong 7 ngày gần nhất.
- **Cấu trúc mong muốn:**
```json
[
  { "name": "24/03", "uploads": 400, "signs": 240 },
  { "name": "25/03", "uploads": 300, "signs": 139 },
  { "name": "26/03", "uploads": 200, "signs": 980 },
  { "name": "27/03", "uploads": 278, "signs": 390 },
  { "name": "28/03", "uploads": 189, "signs": 480 },
  { "name": "29/03", "uploads": 239, "signs": 380 },
  { "name": "30/03", "uploads": 349, "signs": 430 }
]
```

---

## 2. Thống kê dung lượng theo phòng ban/bộ phận
Dùng cho biểu đồ **Bar Chart (Storage by Department)**.

- **Endpoint:** `GET /api/v1/admin/dashboard/storage-by-dept`
- **Mô tả:** Tính toán tổng dung lượng file (từ MinIO) và group theo phòng ban của người sở hữu file.
- **Cấu trúc mong muốn:**
```json
[
  { "name": "Kỹ thuật", "value": 450 },
  { "name": "Nhân sự", "value": 120 },
  { "name": "Tài chính", "value": 380 },
  { "name": "Kinh doanh", "value": 250 },
  { "name": "Pháp chế", "value": 180 }
]
```
*(Đơn vị: MB hoặc GB tùy Backend quy định, Frontend sẽ format lại)*.

---

## 3. Cập nhật API Overview (Tùy chọn)
Hiện tại `statusBreakdown` trong `GET /v1/admin/dashboard/overview` đã hoạt động tốt. Tuy nhiên, nếu có thêm thông tin về "Top người dùng tích cực nhất", Frontend có thể bổ sung thêm bảng vinh danh.

- **Endpoint:** `GET /api/v1/admin/dashboard/top-users`
- **Cấu trúc:** `[ { "name": "Nguyen Van A", "documents": 50 }, ... ]`

---

**Ghi chú cho Backend Team:**
- Các API này phục vụ mục đích giám sát (Monitoring), có thể cache dữ liệu trong khoảng 5-10 phút để giảm tải cho Database/MinIO.
- Frontend đã sẵn sàng các Component xử lý dữ liệu này, chỉ cần thay đổi URL trong `adminService.ts`.
