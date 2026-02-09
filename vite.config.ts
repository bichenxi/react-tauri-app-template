import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { fileURLToPath } from "url"

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [
    react(),
    UnoCSS(),
    AutoImport({
      imports: [
        'react',               // 自动引入 useState, useEffect, useRef 等
        'react-router-dom',    // 自动引入 useNavigate, useParams 等（安装后生效）
      ],
      dirs: [
        'src/components/ui',   // 自动引入 shadcn/ui 组件
        'src/hooks',           // 自动引入自定义 hooks
        'src/lib',             // 自动引入工具函数
      ],
      dts: 'src/auto-imports.d.ts', // 生成 TypeScript 声明文件
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
        protocol: "ws",
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
