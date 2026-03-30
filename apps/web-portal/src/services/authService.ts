import axiosClient from "../lib/axiosClient";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  mustChangePassword?: boolean;
}

/**
 * Gọi API đăng nhập, trả về JWT token.
 */
export const login = (payload: LoginPayload) =>
  axiosClient.post<LoginResponse>("/auth/login", payload);

export const changePasswordFirstTime = (payload: any) =>
  axiosClient.post("/auth/change-password-first-time", payload);

/**
 * Gọi API đăng xuất (nếu backend có endpoint này).
 */
export const logout = () => axiosClient.post("/auth/logout");
