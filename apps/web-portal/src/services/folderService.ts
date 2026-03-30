import axiosClient from "../lib/axiosClient";

export interface FolderCreatePayload {
  name: string;
  parentId: string | null;
}

/**
 * Lấy danh sách nội dung trong một thư mục.
 * @param parentId - null để lấy thư mục gốc
 */
export const getFolderContents = (parentId: string | null) =>
  axiosClient.get("/categories", { params: { parentId } });

/**
 * Tạo thư mục mới.
 */
export const createFolder = (payload: FolderCreatePayload) =>
  axiosClient.post("/categories", payload);

/**
 * Đổi tên thư mục.
 */
export const renameFolder = (id: string, name: string) =>
  axiosClient.put(`/categories/${id}`, { name });

/**
 * Xóa thư mục (chuyển vào thùng rác).
 */
export const deleteFolder = (id: string) =>
  axiosClient.delete(`/categories/${id}`);
