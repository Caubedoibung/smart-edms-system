# Test JWT Authentication với Postman/cURL

## 📝 Test Accounts (được tạo tự động khi chạy app)

| Username | Password   | Roles                   |
| -------- | ---------- | ----------------------- |
| admin    | admin123   | ROLE_ADMIN, ROLE_USER   |
| manager  | manager123 | ROLE_MANAGER, ROLE_USER |
| user     | user123    | ROLE_USER               |

---

## 🔐 1. Test Login API

### Endpoint

```
POST http://localhost:8080/api/auth/login
Content-Type: application/json
```

### Request Body cho Admin

```json
{
  "username": "admin",
  "password": "admin123"
}
```

### Response (Success - 200 OK)

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsInJvbGVzIjpbIlJPTEVfQURNSU4iLCJST0xFX1VTRVIiXSwiaWF0IjoxNzA5NjI4MDAwLCJleHAiOjE3MDk3MTQ0MDB9.abc123...",
  "tokenType": "Bearer"
}
```

---

## 🧪 Test với Postman

### Bước 1: Test Login

1. Mở Postman
2. Tạo request mới: `POST http://localhost:8080/api/auth/login`
3. Chọn tab **Body** → **raw** → **JSON**
4. Paste request body:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

5. Click **Send**
6. Copy token từ response

### Bước 2: Test Protected Endpoint (nếu có)

1. Tạo request mới: `GET http://localhost:8080/api/protected-endpoint`
2. Chọn tab **Authorization**
3. Type: **Bearer Token**
4. Paste token vào ô **Token**
5. Click **Send**

---

## 💻 Test với cURL (Command Line)

### Test Login - Admin

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

### Test Login - Manager

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"manager\",\"password\":\"manager123\"}"
```

### Test Login - User

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"user\",\"password\":\"user123\"}"
```

### Test với Token (thay YOUR_TOKEN bằng token thực)

```bash
curl -X GET http://localhost:8080/api/protected-endpoint \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔍 PowerShell (Windows)

### Test Login

```powershell
$body = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

### Test với Token

```powershell
$token = "YOUR_TOKEN_HERE"

Invoke-RestMethod -Uri "http://localhost:8080/api/protected-endpoint" `
    -Method Get `
    -Headers @{Authorization = "Bearer $token"}
```

---

## ✅ Expected Results

### ✓ Login thành công

- Status: 200 OK
- Response chứa `token` và `tokenType: "Bearer"`
- Token là chuỗi JWT hợp lệ (3 phần ngăn cách bởi dấu `.`)

### ✗ Login thất bại (sai password)

- Status: 401 Unauthorized
- Message: "Bad credentials"

### ✗ Login thất bại (user không tồn tại)

- Status: 401 Unauthorized
- Message: "Bad credentials"

### ✗ Access protected endpoint không có token

- Status: 403 Forbidden

### ✗ Access protected endpoint token không hợp lệ

- Status: 403 Forbidden

---

## 🎯 JWT Token Structure

Token bạn nhận được có cấu trúc:

```
header.payload.signature
```

Payload chứa:

```json
{
  "sub": "admin",
  "roles": ["ROLE_ADMIN", "ROLE_USER"],
  "iat": 1709628000,
  "exp": 1709714400
}
```

- `sub`: username
- `roles`: danh sách quyền
- `iat`: issued at time
- `exp`: expiration time (24h sau khi tạo)

---

## 📚 Debugging Tips

1. **Check app đã chạy chưa**: `curl http://localhost:8080/actuator/health` (nếu có actuator)
2. **Check logs**: Xem console có log "Data seeding completed" không
3. **Check database**: Verify users đã được tạo trong bảng `users` và `user_roles`
4. **Decode JWT**: Sử dụng https://jwt.io để decode và xem payload của token
