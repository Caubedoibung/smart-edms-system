import axiosClient from "../lib/axiosClient";

/**
 * Các API phục vụ Quản trị hệ thống (Admin Dashboard, System Health, Admin Storage)
 */

export const getSystemHealth = () => axiosClient.get("/v1/admin/health");

export const getDashboardOverview = () => axiosClient.get("/v1/admin/dashboard/overview");

export const getDashboardStorage = () => axiosClient.get("/v1/admin/dashboard/storage");

export const getActivityStats = () => axiosClient.get("/v1/admin/dashboard/activity-stats");

export const getStorageByDept = () => axiosClient.get("/v1/admin/dashboard/storage-by-dept");

export const getGlobalTrash = () => axiosClient.get("/v1/admin/storage/trash");

export const emptyGlobalTrash = () => axiosClient.delete("/v1/admin/storage/trash/empty");
