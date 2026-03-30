# Kế hoạch Đại tu Giao diện Admin Dashboard (Bổ sung Biểu đồ)

Mục tiêu: Biến đổi trang Admin Dashboard từ dạng hiển thị thẻ số liệu (cards) đơn giản thành một trung tâm điều khiển (Command Center) chuyên nghiệp, "hùng hố", với nhiều biểu đồ động mang tính phân tích cao.

## Đề xuất Thay đổi (Proposed Changes)

Tôi sẽ sử dụng thư viện **`recharts`** (đã được gọi lệnh cài đặt) để vẽ các biểu đồ theo phong cách hiện đại (Clean UI, bo góc mềm mại, có hiệu ứng hover):

### 1. `apps/web-portal/src/pages/Dashboard.tsx` (Thành phần AdminDashboard)
- **Tái cấu trúc Layout:** Thay vì chỉ có các ô vuông chứa số liệu, ta sẽ gom nhóm thành các khu vực `Analytics` rõ ràng.
- **Biểu đồ 1: Area Chart (Hoạt động hệ thống 7 ngày qua)**
  - Hiển thị mức độ người dùng tương tác, tải file, ký duyệt qua từng ngày.
  - Sử dụng hiệu ứng Gradient Fill và nét cong (curve) tạo cảm giác mượt mà.
  - *Data:* Hiện tại sẽ vẽ Mock data (Dữ liệu giả lập), sau đó lập báo cáo để Backend bổ sung API.
- **Biểu đồ 2: Pie Chart / Doughnut Chart (Phân bổ tài liệu)**
  - Tỉ lệ tài liệu Draft, Waiting, Approved, Signed.
  - *Data:* Tận dụng chính `overview.statusBreakdown` đang có sẵn từ Backend.
- **Biểu đồ 3: Bar Chart (Dung lượng sử dụng theo thư mục/phòng ban)**
  - Phân tích Top các bộ phận tiêu tốn dung lượng Server (MinIO) nhiều nhất.
  - *Data:* Sử dụng Mock data, yêu cầu Backend tính toán và group dung lượng sau để trả về `/api/v1/admin/dashboard/storage-by-dept`.

### 2. `backend_comprehensive_report.md` (Cập nhật sau khi hoàn thành)
- Bổ sung cấu trúc API yêu cầu Backend cung cấp cho các biểu đồ (ví dụ: mảng thống kê 7 ngày, mảng group danh mục) để thay thế cho mảng Mock.

## Cần Bạn Đánh Giá (User Review Required)

> [!IMPORTANT]
> - Việc sử dụng `recharts` đã được cài đặt, nó sẽ tăng nhẹ (khoảng ~1.5MB) dung lượng bundle của Frontend, điều này là đánh đổi hoàn toàn hợp lý với một trang Admin Dashboard.
> - Bố cục "Bảng tin nội bộ" (Social Feed) sẽ được dời sang dạng thu gọn hoặc thu hẹp diện tích sang 1 bên để nhường chỗ "Spotlight" (Tâm điểm) cho các biểu đồ tĩnh/động.

## Kế hoạch Kiểm thử (Verification Plan)
- Chạy thử `npm run dev` để kiểm tra độ render mượt mà của Recharts trên trang chủ.
- Kiểm tra tính Responsive: Biểu đồ phải co giãn tốt khi xem trên điện thoại và laptop.
- Tooltip của Chart phải hiển thị đúng số liệu khi hover chuột vào.
