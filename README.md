# SMART-EDMS System

Hệ thống quản lý tài liệu điện tử thông minh dựa trên kiến trúc Microservices.

## 🏗 Cấu trúc dự án

```plaintext
SMART-EDMS-SYSTEM/
├── apps/
│   └── web-portal/         # 💻 Giao diện người dùng (React, Vite, TailwindCSS)
├── services/
│   ├── core-service/      # ⚙️ Dịch vụ lõi (Spring Boot, PostgreSQL, MinIO)
│   └── audit-service/     # 📝 Dịch vụ ghi log & thông báo (Node.js, MongoDB, Socket.io)
├── infrastructure/
│   ├── docker-compose.yml # 🐳 Cấu hình các dịch vụ hạ tầng (DB, MinIO, Mongo)
│   └── nginx/             # 🌐 Cấu hình Reverse Proxy
├── .github/               # 🚀 Quy trình CI/CD
└── README.md
```

## 🚀 Hướng dẫn khởi chạy nhanh

### 1. Hạ tầng (Database, Storage)
Di chuyển vào thư mục `infrastructure` và chạy:
```bash
docker-compose up -d
```
Lệnh này sẽ khởi chạy:
- PostgreSQL (Cổng 5432)
- MinIO (Cổng 9000/9001)
- MongoDB (Cổng 27017)

### 2. Core Service (Spring Boot)
Di chuyển vào `services/core-service` và chạy:
```bash
./mvnw spring-boot:run
```
Service chạy tại: `http://localhost:8080`

### 3. Audit Service (Node.js)
Di chuyển vào `services/audit-service` và chạy:
```bash
npm install
npm run dev
```
Service chạy tại: `http://localhost:3000`

### 4. Web Portal (React)
Di chuyển vào `apps/web-portal` và chạy:
```bash
npm install
npm run dev
```
Giao diện chạy tại: `http://localhost:5173`

## 🛠 Công nghệ sử dụng
- **Frontend:** React 19, TypeScript, TailwindCSS v4, Vite.
- **Backend:** Spring Boot 4.x, Java 21, Node.js (Express).
- **Database:** PostgreSQL, MongoDB.
- **Storage:** MinIO (S3 Compatible).
- **Real-time:** Socket.io.
- **DevOps:** Docker, Docker Compose.
