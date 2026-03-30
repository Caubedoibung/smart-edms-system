import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://pseudoeconomical-loise-interpolable.ngrok-free.dev/api",
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// ── Request Interceptor ──────────────────────────────────────────────────────
// Tự động đính kèm JWT token vào header Authorization của mỗi request
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor ─────────────────────────────────────────────────────
// Xử lý lỗi 401 hoặc 403 do bắt buộc đổi mật khẩu: xóa token và đẩy về trang Login
// CHÚ Ý: Không auto-logout với các service phụ (audit, feed) vì chúng có auth riêng
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || "";
    // Chỉ coi là service phụ nếu gọi TRỰC TIẾP (không qua /v1 proxy)
    const isAuxiliaryService = (requestUrl.includes("/audit") || requestUrl.includes("/feed")) && !requestUrl.includes("/v1");

    if (!isAuxiliaryService) {
      if (error.response?.status === 401 || (error.response?.status === 403 && error.response?.data?.message === "Bạn phải đổi mật khẩu ở lần đăng nhập đầu tiên")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
      }
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
