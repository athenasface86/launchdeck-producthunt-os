import { buildBriefInput } from "../domain/brief.js";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

export const launchBriefSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "product_name",
    "tagline",
    "target_user",
    "launch_angle",
    "product_hunt_hook",
    "checklist",
    "risks"
  ],
  properties: {
    product_name: { type: "string" },
    tagline: { type: "string" },
    target_user: { type: "string" },
    launch_angle: { type: "string" },
    product_hunt_hook: { type: "string" },
    checklist: {
      type: "array",
      minItems: 4,
      maxItems: 7,
      items: { type: "string" }
    },
    risks: {
      type: "array",
      minItems: 2,
      maxItems: 5,
      items: { type: "string" }
    }
  }
};

export function getOpenAIKey(env = process.env) {
  return env.OPENAI_API_KEY ?? env.openai_api_key ?? "";
}

export function extractOutputText(payload) {
  if (typeof payload?.output_text === "string") {
    return payload.output_text;
  }

  const chunks = [];
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (typeof content?.text === "string") {
        chunks.push(content.text);
      } else if (typeof content?.output_text === "string") {
        chunks.push(content.output_text);
      }
    }
  }
  return chunks.join("\n").trim();
}

export async function generateLaunchBrief(payload, options = {}) {
  const env = options.env ?? process.env;
  const apiKey = options.apiKey ?? getOpenAIKey(env);
  if (!apiKey) {
    throw new Error("Set OPENAI_API_KEY or openai_api_key before generating an AI launch brief.");
  }

  const briefInput = buildBriefInput(payload);
  const fetchImpl = options.fetchImpl ?? fetch;
  const model = options.model ?? env.OPENAI_MODEL ?? "gpt-5.5";

  const response = await fetchImpl(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      store: false,
      max_output_tokens: 1200,
      instructions:
        "You are a launch strategist for Product Hunt-style launches. Return practical, specific JSON.",
      input: [
        {
          role: "user",
          content:
            `Idea: ${briefInput.idea}\n` +
            `Audience: ${briefInput.audience}\n` +
            `Channels: ${briefInput.channels.join(", ")}\n` +
            `Constraints: ${briefInput.constraints.join(", ") || "none"}`
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "launchdeck_brief",
          strict: true,
          schema: launchBriefSchema
        }
      }
    })
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.message ?? `OpenAI request failed with ${response.status}`;
    throw new Error(message);
  }

  const outputText = extractOutputText(body);
  if (!outputText) {
    throw new Error("OpenAI response did not include output text.");
  }
  return JSON.parse(outputText);
}
