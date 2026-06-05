import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function resolveConfig(env = process.env) {
  return {
    port: Number.parseInt(env.PORT ?? "3000", 10),
    dataFile: path.resolve(rootDir, env.DATA_FILE ?? "data/launches.json"),
    publicDir: path.resolve(rootDir, "public"),
    openAIModel: env.OPENAI_MODEL ?? "gpt-5.5"
  };
}
