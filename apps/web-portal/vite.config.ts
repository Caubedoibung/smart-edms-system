import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Đã cập nhật trỏ về API Gateway Ngrok (localhost:80)
  const targetUrl = env.VITE_BACKEND_URL || 'https://pseudoeconomical-loise-interpolable.ngrok-free.dev';
  
  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true, // Listen on all network interfaces for Docker
      port: 5173,
      watch: {
        usePolling: true,
      },
      proxy: {
        '/api': {
          target: targetUrl,
          changeOrigin: true,
        }
      }
    },
    preview: {
      proxy: {
        '/api': {
          target: targetUrl,
          changeOrigin: true,
        }
      }
    }
  };
});
