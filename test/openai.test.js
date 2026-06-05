import assert from "node:assert/strict";
import { test } from "node:test";
import { buildBriefInput } from "../src/domain/brief.js";
import { extractOutputText, generateLaunchBrief, getOpenAIKey } from "../src/integrations/openai.js";

test("buildBriefInput validates and normalizes brief prompts", () => {
  assert.throws(() => buildBriefInput({ idea: "short" }), /at least 20/);
  const input = buildBriefInput({
    idea: "  A serious launch planning workspace for product teams.  ",
    audience: "makers",
    channels: ["Product Hunt"]
  });
  assert.equal(input.idea, "A serious launch planning workspace for product teams.");
  assert.equal(input.audience, "makers");
});

test("getOpenAIKey supports upper and lower case env names", () => {
  assert.equal(getOpenAIKey({ OPENAI_API_KEY: "upper" }), "upper");
  assert.equal(getOpenAIKey({ openai_api_key: "lower" }), "lower");
});

test("extractOutputText supports common Responses API shapes", () => {
  const jsonText = '{"ok":true}';

  assert.equal(extractOutputText({ output_text: jsonText }), jsonText);
  assert.equal(
    extractOutputText({ output: [{ content: [{ type: "output_text", text: jsonText }] }] }),
    jsonText
  );
});

test("generateLaunchBrief sends a structured output request", async () => {
  const expected = {
    product_name: "LaunchDeck",
    tagline: "Launch with less drift.",
    target_user: "founders",
    launch_angle: "Show the workflow from scattered tasks to readiness.",
    product_hunt_hook: "A focused command center for makers preparing public launches.",
    checklist: ["Lock the story", "Record a demo", "Recruit supporters", "Prep launch copy"],
    risks: ["Story may be broad", "Demo may be unclear"]
  };
  let captured;

  const brief = await generateLaunchBrief(
    {
      idea: "A launch planning workspace that helps founders prepare for Product Hunt.",
      audience: "founders"
    },
    {
      env: { openai_api_key: "test-key", OPENAI_MODEL: "gpt-5.5" },
      fetchImpl: async (_url, request) => {
        captured = JSON.parse(request.body);
        return {
          ok: true,
          json: async () => ({ output_text: JSON.stringify(expected) })
        };
      }
    }
  );

  assert.equal(captured.model, "gpt-5.5");
  assert.equal(captured.text.format.type, "json_schema");
  assert.equal(captured.text.format.strict, true);
  assert.deepEqual(brief, expected);
});
