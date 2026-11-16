import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
const port = Number(process.env.DEV_PORT);

// https://vitejs.dev/config/
export default defineConfig(async ({ command }) => {
  if (
    command === "serve" &&
    (!Number.isInteger(port) || port < 1 || port > 65535)
  ) {
    throw new Error("Set DEV_PORT to a valid TCP port.");
  }

  return {
    plugins: [vue()],

    // Vite options tailored for Tauri development and only applied in
    // `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
      port,
      strictPort: true,
      host: host || false,
      hmr: host ? { protocol: "ws", host } : undefined,
      watch: {
        // 3. tell vite to ignore watching `src-tauri`
        ignored: ["**/src-tauri/**"],
      },
    },
  };
});
