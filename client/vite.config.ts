import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "..", "shared"),
      "@assets": path.resolve(__dirname, "..", "attached_assets"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
