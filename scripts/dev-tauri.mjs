import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const port = Number(process.env.DEV_PORT);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("Set DEV_PORT to a valid TCP port in .env.");
}

const cli = fileURLToPath(
  new URL("../node_modules/@tauri-apps/cli/tauri.js", import.meta.url),
);
const config = JSON.stringify({
  build: { devUrl: `http://localhost:${port}` },
});
const result = spawnSync(
  process.execPath,
  [cli, "dev", "--config", config, ...process.argv.slice(2)],
  { stdio: "inherit" },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
