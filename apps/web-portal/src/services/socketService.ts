import { io, Socket } from "socket.io-client";

/**
 * Quản lý kết nối Real-time với Socket.IO (Server Node.js)
 */

let socket: Socket | null = null;

export const initSocket = (userId: number | string) => {
  if (socket) return socket;
  
  // Thông tin cấu hình theo API.md
  // Mặc định io client sẽ tìm connect tới server chung port nếu empty url
  // Do chạy qua Nginx, nên có thể dùng gốc '/' hoặc domain tuỳ config
  socket = io("/", {
    auth: { userId }
  });
  
  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
