import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "VITE_");
  const serverTarget =
    env.VITE_API_PROXY_TARGET || "http://localhost:8001";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: serverTarget,
          changeOrigin: true,
        },
        "/socket.io": {
          target: serverTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
