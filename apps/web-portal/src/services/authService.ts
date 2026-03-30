import axiosClient from "../lib/axiosClient";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

/**
 * Gọi API đăng nhập, trả về JWT token.
 */
export const login = (payload: LoginPayload) =>
  axiosClient.post<LoginResponse>("/auth/login", payload);

/**
 * Gọi API đăng xuất (nếu backend có endpoint này).
 */
export const logout = () => axiosClient.post("/auth/logout");
