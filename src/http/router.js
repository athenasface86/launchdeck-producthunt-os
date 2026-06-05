function compilePattern(pattern) {
  const keys = [];
  const source = pattern
    .split("/")
    .map((part) => {
      if (!part) {
        return "";
      }
      if (part.startsWith(":")) {
        keys.push(part.slice(1));
        return "([^/]+)";
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");

  return {
    keys,
    regex: new RegExp(`^${source}/?$`)
  };
}

export function createRouter() {
  const routes = [];

  function add(method, pattern, handler) {
    routes.push({
      method: method.toUpperCase(),
      pattern,
      handler,
      compiled: compilePattern(pattern)
    });
  }

  async function handle(request, response, context = {}) {
    const url = new URL(request.url ?? "/", "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    const method = request.method?.toUpperCase() ?? "GET";

    for (const route of routes) {
      if (route.method !== method) {
        continue;
      }

      const match = route.compiled.regex.exec(pathname);
      if (!match) {
        continue;
      }

      const params = Object.fromEntries(
        route.compiled.keys.map((key, index) => [key, match[index + 1]])
      );
      await route.handler({ request, response, params, query: url.searchParams, ...context });
      return true;
    }

    return false;
  }

  return {
    add,
    get: (pattern, handler) => add("GET", pattern, handler),
    post: (pattern, handler) => add("POST", pattern, handler),
    patch: (pattern, handler) => add("PATCH", pattern, handler),
    handle,
    routes: () => routes.map(({ method, pattern }) => ({ method, pattern }))
  };
}
