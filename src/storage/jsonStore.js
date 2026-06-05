import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createMemoryStore(seedLaunches = []) {
  let launches = clone(seedLaunches);

  return {
    async listLaunches() {
      return clone(launches);
    },

    async getLaunch(id) {
      return clone(launches.find((launch) => launch.id === id) ?? null);
    },

    async saveLaunch(launch) {
      const index = launches.findIndex((item) => item.id === launch.id);
      if (index === -1) {
        launches.push(clone(launch));
      } else {
        launches[index] = clone(launch);
      }
      return clone(launch);
    },

    async replaceLaunches(nextLaunches) {
      launches = clone(nextLaunches);
      return clone(launches);
    }
  };
}

export function createJsonFileStore(filePath, seedLaunches = []) {
  const memory = createMemoryStore(seedLaunches);
  let loaded = false;

  async function ensureLoaded() {
    if (loaded) {
      return;
    }

    try {
      const raw = await readFile(filePath, "utf8");
      await memory.replaceLaunches(JSON.parse(raw));
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, JSON.stringify(seedLaunches, null, 2), "utf8");
    }
    loaded = true;
  }

  async function persist() {
    const launches = await memory.listLaunches();
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(launches, null, 2), "utf8");
  }

  return {
    async listLaunches() {
      await ensureLoaded();
      return memory.listLaunches();
    },

    async getLaunch(id) {
      await ensureLoaded();
      return memory.getLaunch(id);
    },

    async saveLaunch(launch) {
      await ensureLoaded();
      const saved = await memory.saveLaunch(launch);
      await persist();
      return saved;
    },

    async replaceLaunches(launches) {
      await ensureLoaded();
      const saved = await memory.replaceLaunches(launches);
      await persist();
      return saved;
    }
  };
}
