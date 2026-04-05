import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import type { QAConfig, QAIssue, AnalysisResult } from "./types";
import { buildQAPrompt, buildExplorerPrompt } from "./prompt";

/** Shared Anthropic client -- lazily created per config */
function makeClient(config: QAConfig): Anthropic {
  const apiKey = config.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "playwright-opus-qa: No API key. Set ANTHROPIC_API_KEY env var or pass config.apiKey.",
    );
  }
  return new Anthropic({ apiKey });
}

/** Extract a JSON object containing "score" from raw model output */
function extractJSON(raw: string): string {
  // Try to find a JSON block containing "score"
  const jsonMatch = raw.match(/\{[\s\S]*"score"[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  // Fall back to stripping markdown code fences
  return raw
    .replace(/^```json?\s*/m, "")
    .replace(/```\s*$/m, "")
    .trim();
}

/** Normalize issue keys from the model (fix_hint -> fixHint) */
function normalizeIssue(raw: any): QAIssue {
  return {
    severity: raw.severity ?? "minor",
    element: raw.element ?? "unknown",
    description: raw.description ?? "",
    fixHint: raw.fixHint ?? raw.fix_hint ?? undefined,
  };
}

/**
 * Analyze a single screenshot with Claude.
 *
 * @param screenshotPath - Absolute path to a PNG screenshot
 * @param context - Description of the page / viewport / audit results
 * @param config - QAConfig with API key, model, prompt, etc.
 */
export async function analyzeScreenshot(
  screenshotPath: string,
  context: string,
  config: QAConfig = {},
): Promise<AnalysisResult> {
  const client = makeClient(config);
  const base64 = fs.readFileSync(screenshotPath).toString("base64");
  const prompt = config.prompt ?? buildQAPrompt(config.appContext);

  const response = await client.messages.create({
    model: config.model ?? "claude-opus-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/png", data: base64 },
          },
          { type: "text", text: `${context}\n\n${prompt}` },
        ],
      },
    ],
  });

  const rawText =
    response.content[0].type === "text" ? response.content[0].text : "";
  const parsed = JSON.parse(extractJSON(rawText));
  const threshold = config.threshold ?? 9;

  return {
    score: parsed.score,
    pass: parsed.score >= threshold,
    summary: parsed.summary ?? "",
    issues: (parsed.issues ?? []).map(normalizeIssue),
  };
}

/**
 * Analyze a screenshot and return the next exploration action.
 * Used internally by the explorer.
 */
export async function analyzeAndDecide(
  screenshotPath: string,
  visitedStates: string[],
  viewport: { width: number; height: number },
  axeReport: string,
  perfReport: string,
  config: QAConfig = {},
): Promise<{
  score: number;
  summary: string;
  issues: QAIssue[];
  next_action: { type: string; target: string; reason: string };
}> {
  const client = makeClient(config);
  const base64 = fs.readFileSync(screenshotPath).toString("base64");
  const prompt = buildExplorerPrompt(config.appContext);

  const historyContext =
    visitedStates.length > 0
      ? `\nYou have already visited these states (DO NOT revisit): ${visitedStates.join(", ")}`
      : "";

  const augmentedContext = [
    `Viewport: ${viewport.width}x${viewport.height}`,
    axeReport,
    perfReport,
    historyContext,
  ].join("\n");

  const response = await client.messages.create({
    model: config.model ?? "claude-opus-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/png", data: base64 },
          },
          { type: "text", text: `${augmentedContext}\n\n${prompt}` },
        ],
      },
    ],
  });

  const rawText =
    response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = rawText.match(/\{[\s\S]*"score"[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Explorer returned no JSON: ${rawText.slice(0, 200)}`);
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    score: parsed.score,
    summary: parsed.summary ?? "",
    issues: (parsed.issues ?? []).map(normalizeIssue),
    next_action: parsed.next_action ?? { type: "done", target: "", reason: "" },
  };
}
