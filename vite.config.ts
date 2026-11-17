import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig(async ({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const host = process.env.TAURI_DEV_HOST ?? env.TAURI_DEV_HOST;
  const port = Number(process.env.DEV_PORT ?? env.DEV_PORT);

  if (
    command === "serve" &&
    (!Number.isInteger(port) || port < 1 || port > 65535)
  ) {
    throw new Error("Set DEV_PORT to a valid TCP port in .env.");
  }

  return {
    plugins: [vue()],

    clearScreen: false,
    server: {
      port,
      strictPort: true,
      host: host || false,
      hmr: host ? { protocol: "ws", host } : undefined,
      watch: {
        ignored: ["**/src-tauri/**"],
      },
    },
  };
});
