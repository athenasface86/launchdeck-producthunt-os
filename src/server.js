import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveConfig } from "./config.js";
import { sendError } from "./http/responses.js";
import { createApiRouter } from "./routes/api.js";
import { createJsonFileStore } from "./storage/jsonStore.js";

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"]
]);

function safeStaticPath(publicDir, requestUrl) {
  const url = new URL(requestUrl ?? "/", "http://localhost");
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const normalized = path.normalize(decodeURIComponent(requestedPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(publicDir, normalized);
  if (!filePath.startsWith(publicDir)) {
    return null;
  }
  return filePath;
}

async function serveStatic(request, response, publicDir) {
  const filePath = safeStaticPath(publicDir, request.url);
  if (!filePath) {
    sendError(response, 403, "Forbidden.");
    return;
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) {
      throw new Error("Not a file.");
    }
    response.writeHead(200, {
      "content-type": contentTypes.get(path.extname(filePath)) ?? "application/octet-stream"
    });
    createReadStream(filePath).pipe(response);
  } catch {
    sendError(response, 404, "Not found.");
  }
}

export function createServer(options = {}) {
  const config = resolveConfig(options.env);
  const store =
    options.store ??
    createJsonFileStore(options.dataFile ?? config.dataFile, options.seedLaunches ?? []);
  const publicDir = options.publicDir ?? config.publicDir;
  const api = createApiRouter({
    store,
    env: options.env,
    fetchImpl: options.fetchImpl
  });

  return http.createServer(async (request, response) => {
    if (request.url?.startsWith("/api/")) {
      const handled = await api.handle(request, response);
      if (!handled) {
        sendError(response, 404, "Not found.");
      }
      return;
    }

    if (request.method === "GET") {
      await serveStatic(request, response, publicDir);
      return;
    }

    sendError(response, 405, "Method not allowed.");
  });
}

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  const config = resolveConfig();
  createServer().listen(config.port, () => {
    console.log(`Listening on http://localhost:${config.port}`);
  });
}
