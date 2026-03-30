import axiosClient from "../lib/axiosClient";

/**
 * Các API phục vụ Bảng tin nội bộ (Social Newsfeed) - Node.js endpoint
 */

export const getPosts = () => axiosClient.get("/feed/posts");

export const createPost = (data: any) => axiosClient.post("/feed/posts", data);

export const toggleLike = (postId: string | number, userId: number | string) => 
  axiosClient.put(`/feed/posts/${postId}/like`, { userId });

export const addComment = (postId: string | number, data: any) => 
  axiosClient.post(`/feed/posts/${postId}/comments`, data);
