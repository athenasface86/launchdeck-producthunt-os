export function sendJson(response, status, payload, headers = {}) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    ...headers
  });
  response.end(JSON.stringify(payload));
}

export function sendError(response, status, message, details = undefined) {
  const payload = details ? { error: message, details } : { error: message };
  sendJson(response, status, payload);
}

export async function readText(request, limit = 65_536) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > limit) {
      throw new Error(`Request body exceeds ${limit} bytes.`);
    }
  }
  return body;
}

export async function readJson(request, limit = 65_536) {
  const body = await readText(request, limit);
  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

export function methodNotAllowed(response, allowed) {
  sendJson(response, 405, { error: "Method not allowed.", allowed }, {
    "allow": allowed.join(", ")
  });
}
