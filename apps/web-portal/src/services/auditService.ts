import axiosClient from "../lib/axiosClient";

// Lấy danh sách nhật ký hệ thống (Audit Logs) qua Proxy của Spring Boot (để dùng chung JWT)
export const getAuditLogs = (params?: { limit?: number, action?: string }) => {
  return axiosClient.get<any[]>("/v1/audit/logs", { params });
};
