import axiosClient from "../lib/axiosClient";

export const uploadDocument = (file: File, folderId: string | null) => {
  const formData = new FormData();
  formData.append("file", file);
  if (folderId && folderId !== "root" && folderId !== "dept_root") {
    formData.append("folderId", folderId);
  }
  return axiosClient.post("/documents", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getDocumentStreamUrl = (id: string) => {
  // We can just construct the URL and let the browser fetch it, but we need Auth token.
  // Since we need to pass Auth header, we should fetch it as a blob.
  return axiosClient.get(`/documents/${id}/view`, {
    responseType: "blob",
  });
};

export const getDocumentVersions = (id: string) => {
  return axiosClient.get(`/documents/${id}/versions`);
};

export const getDocumentVersionStreamUrl = (id: string, versionId: string) => {
  return axiosClient.get(`/documents/${id}/versions/${versionId}/view`, {
    responseType: "blob",
  });
};

export const uploadNewDocumentVersion = (documentId: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return axiosClient.post(`/documents/${documentId}/versions`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getFolderDocuments = (folderId: string | null) => {
  return axiosClient.get("/documents", { params: { folderId } });
};

export const deleteDocument = (id: string) => {
  return axiosClient.delete(`/documents/${id}`);
};

export const signDocument = (
  id: string,
  p12File: File,
  password: string,
  reason?: string,
  location?: string
) => {
  const formData = new FormData();
  formData.append("p12File", p12File);
  formData.append("password", password);
  if (reason) formData.append("reason", reason);
  if (location) formData.append("location", location);

  return axiosClient.post(`/documents/${id}/sign`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const submitForApproval = (id: string, approverId: string) => {
  return axiosClient.put(`/documents/${id}/submit-approval`, null, {
    params: { approverId },
  });
};

export const rejectDocument = (id: string) => {
  return axiosClient.put(`/documents/${id}/reject`);
};

export const approveDocument = (id: string) => {
  return axiosClient.put(`/documents/${id}/approve`);
};

export const getPendingApprovals = () => {
  return axiosClient.get("/documents/pending-approvals");
};

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// 1. Search Toàn bộ tài liệu (có phân trang)
export const searchDocuments = (params: { keyword?: string, folderId?: number, status?: string, page?: number, size?: number }) => {
  return axiosClient.get<PageResponse<any>>("/documents/search", { params });
};

// 2. Lấy danh sách Trash
export const getTrashDocuments = () => {
  return axiosClient.get<any[]>("/documents/trash");
};

// 3. Phục hồi tài liệu
export const restoreDocument = (id: string | number) => {
  return axiosClient.put<any>(`/documents/${id}/restore`);
};

// 4. Xóa cứng tài liệu
export const hardDeleteDocument = (id: string | number) => {
  return axiosClient.delete(`/documents/${id}/hard-delete`);
};