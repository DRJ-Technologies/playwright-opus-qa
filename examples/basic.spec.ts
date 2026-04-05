import { test } from "@playwright/test";
import { runQA, runExplorer, DEFAULT_DEVICES } from "playwright-opus-qa";

/**
 * Example: Visual QA for a generic web app.
 *
 * Set ANTHROPIC_API_KEY in your environment, then run:
 *   npx playwright test examples/basic.spec.ts
 */

const config = {
  threshold: 9,
  appContext:
    "A dark-themed SaaS dashboard with blue accents and glass-morphism effects",
  devices: DEFAULT_DEVICES,
};

const experiences = [
  { name: "home", path: "/", description: "Landing page with hero and nav" },
  {
    name: "dashboard",
    path: "/dashboard",
    description: "Main dashboard with charts and metrics",
  },
  {
    name: "settings",
    path: "/settings",
    description: "User settings page",
  },
];

test.describe("Visual QA", () => {
  test("static sweep", async ({ page }) => {
    const results = await runQA(page, experiences, config);
    for (const r of results) {
      console.log(`${r.experience} @ ${r.device}: ${r.score}/10`);
    }
    const failures = results.filter((r) => !r.pass);
    if (failures.length > 0) {
      throw new Error(
        `${failures.length} experience(s) below threshold:\n` +
          failures
            .map((f) => `  ${f.experience} @ ${f.device}: ${f.score}/10`)
            .join("\n"),
      );
    }
  });

  test("explorer", async ({ page }) => {
    const report = await runExplorer(page, "/", config);
    console.log(
      `Explored ${report.steps.length} states, avg ${report.avgScore}/10`,
    );
    if (report.failedSteps > 0) {
      throw new Error(
        `${report.failedSteps} step(s) below threshold ${config.threshold}/10`,
      );
    }
  });
});
