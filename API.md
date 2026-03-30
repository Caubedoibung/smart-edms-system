# TÀI LIỆU API CHO FRONTEND (NODE.JS + SOCKET.IO)

Do bộ APIs của Spring Boot (Tài liệu, Thư mục, Phê duyệt, Ký số) đã có sẵn Swagger UI (`/swagger-ui/index.html`), tài liệu này sinh ra để Frontend Team nắm bắt rõ các **APIs và sự kiện Real-time** vừa được bổ sung vào Node.js (Chạy qua cổng chung Nginx `http://localhost/`).

---

## PHẦN 1: BẢNG TIN NỘI BỘ (SOCIAL NEWSFEED)
**Base URL:** `http://localhost/api/feed`

### 1.1. Lấy danh sách Bảng tin (Get Posts)
- **Method:** `GET`
- **Endpoint:** `/posts`
- **Mô tả:** Lấy 20 bài đăng mới nhất (Sắp xếp theo thời gian giảm dần). Hiển thị ngay lúc Frontend vừa load trang Bảng tin.
- **Response (200 OK):**
  ```json
  [
    {
      "_id": "60d...",
      "authorId": 1,
      "authorName": "Admin Đẹp Trai",
      "avatar": "url_to_image",
      "content": "Chào mừng các bạn đến với hệ thống mới!",
      "likes": [2, 5, 8],
      "comments": [
        { "userId": 2, "userName": "Nhân viên A", "content": "Tuyệt vời sếp ơi!", "createdAt": "2026-..." }
      ],
      "createdAt": "2026-..."
    }
  ]
  ```

### 1.2. Tạo Bài đăng mới (Create Post)
- **Method:** `POST`
- **Endpoint:** `/posts`
- **Body:** `{"authorId": 1, "authorName": "Sếp", "avatar": "...", "content": "Tin tức...", "role": "ROLE_MANAGER"}`
- *(Lưu ý: Chỉ tài khoản Admin/Manager mới được đăng)*.

### 1.3. Thả Tim / Bỏ Tim (Toggle Like)
- **Method:** `PUT`
- **Endpoint:** `/posts/:id/like`  *(Thay `:id` bằng mã bài đăng)*
- **Body:** `{"userId": 5}`
- **Mô tả:** Node.js tự động kiểm tra, nếu user rỗng thì thêm Tym vào, nếu có Tym rồi thì rút Tym ra.

### 1.4. Bình Luận (Comment)
- **Method:** `POST`
- **Endpoint:** `/posts/:id/comments` *(Thay `:id` bằng mã bài đăng)*
- **Body:** `{"userId": 5, "userName": "Tên nhân viên", "content": "Nội dung bình luận"}`

---

## PHẦN 2: LƯU TRỮ NHẬT KÝ (AUDIT SERVICE)
**Base URL:** `http://localhost/api/audit`

### 2.1. Lấy Danh sách Nhật Ký Hoạt Động (Danh sách Log)
- **Method:** `GET`
- **Endpoint:** `/logs`
- **Mô tả:** Dùng để đổ dữ liệu ra cho Bảng "Nhật ký hệ thống" trong trang Admin Dashboard.
- **Query Params (Tùy chọn):** `?limit=50&action=CREATE_DOCUMENT`
- **Response (200 OK):** Mảng các hành động đã được hệ thống ghi vết.

*(Note: Phương thức POST dành riêng cho Spring Boot gọi nội bộ, Frontend không cần đụng tới).*

---

## PHẦN 3: TƯƠNG TÁC REAL-TIME (SOCKET.IO)
**Kết nối Socket:** `ws://localhost/socket.io/`

Đây là "Trái tim" của sự kiện Real-time, Frontend phải cài thư viện `socket.io-client`.

### 3.1. Lúc Khởi tạo Kết nối (Handshake)
Frontend phải truyền `userId` vào cấu hình để Node.js biết ai đang đăng nhập:
```javascript
import { io } from "socket.io-client";
const socket = io("http://localhost", {
  auth: { userId: 123 } // Truyền ID của user đang đăng nhập vào đây
});
```

### 3.2. Các Sự kiện (Events) Frontend Cần Lắng Nghe (`socket.on`)

#### 🔹 Sự kiện Trạng Thái Online (Presence)
1. **`ONLINE_USERS_LIST`**: Gửi về một Mảng `[123, 456, 789]` chứa danh sách các User ID **đang online ngay lúc vừa load mạng**. Frontend lấy mảng này tô xanh các chấm đèn.
2. **`USER_ONLINE`**: Server báo tin có 1 user `userId` vừa mới online. FE tô xanh thêm bóng đèn ông này.
3. **`USER_OFFLINE`**: Server báo tin user `userId` vừa tắt tab rời mạng. Cập nhật tắt bóng đèn đỏ/xám.

#### 🔹 Sự kiện Bảng Tin Báo Cáo (Feed & Audit Notifications)
1. **`NEW_POST`**: Sếp vừa đăng 1 bài viết mới. Trả về `Object` bài viết. FE đẩy trực tiếp lên đầu Bảng tin mà không mất công F5 gọi API.
2. **`POST_UPDATED`**: Có người vừa bấm nút Like. Trả về `{ postId, likesCount, likes }`. FE cập nhật lại số Tym đang bay.
3. **`NEW_COMMENT`**: Có người vừa comment. Trả về `{ postId, comment }`. FE chèn comment xuống dưới cùng của danh sách bình luận.
4. **`NOTIFICATION`**: Hàm thông báo dạng Toast (Popup góc phải): Server báo văn bản thông điệp `String` (Ví dụ: "Có người vừa bình luận bài của Sếp...").
5. **`new_audit_log`**: (Của AuditService) Trả về Object Log hệ thống để tự chèn dòng mới vào Bảng "Nhật Ký Quản Sinh" tự động.

---
**Tóm lại (Nhiệm vụ Frontend):**
- Làm giao diện hiển thị List / Post / Like / Comment dựa theo 4 API trên và bắn lại các sự kiện Socket `socket.on('...')` tương ứng để Data nó "nhảy múa" trên UI nhé!
