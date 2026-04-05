import type { Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import type { QAConfig, QAResult, Experience } from "./types";
import { analyzeScreenshot } from "./analyze";
import { runAxeAudit } from "./axe";
import { runPerfCheck } from "./perf";
/** Default device viewports -- duplicated here to avoid circular import with index.ts */
const DEFAULT_DEVICES = [
  { name: "iPhone SE", viewport: { width: 375, height: 667 } },
  { name: "iPhone 14", viewport: { width: 390, height: 844 } },
  { name: "iPhone 14 Pro Max", viewport: { width: 430, height: 932 } },
  { name: "Desktop", viewport: { width: 1280, height: 800 } },
];
import { report } from "./reporters/console";
import { reportJSON } from "./reporters/json";

/**
 * Run the static QA agent across a list of experiences and device viewports.
 *
 * For each (experience, device) pair:
 * 1. Navigate and/or run the setup function
 * 2. Take a screenshot
 * 3. Run axe-core and Web Vitals (if enabled)
 * 4. Send the screenshot to Claude for analysis
 * 5. Collect the result
 *
 * @returns Array of QAResult -- one per (experience, device) combination
 */
export async function runQA(
  page: Page,
  experiences: Experience[],
  config: QAConfig = {},
): Promise<QAResult[]> {
  const devices = config.devices ?? DEFAULT_DEVICES;
  const threshold = config.threshold ?? 9;
  const screenshotDir =
    config.screenshotDir ?? path.join(process.cwd(), "__screenshots__/qa-agent");
  const enableAxe = config.axe !== false;
  const enablePerf = config.perf !== false;

  fs.mkdirSync(screenshotDir, { recursive: true });

  const results: QAResult[] = [];

  for (const exp of experiences) {
    for (const device of devices) {
      // Set viewport
      await page.setViewportSize(device.viewport);

      // Navigate / setup
      if (exp.setup) {
        await exp.setup(page);
      } else if (exp.path) {
        await page.goto(exp.path);
        await page.waitForTimeout(2000);
      }

      // Screenshot
      const slug = `${exp.name}-${device.name.toLowerCase().replace(/\s+/g, "-")}`;
      const screenshotPath = path.join(screenshotDir, `${slug}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: false,
        scale: "css",
      });

      // Axe audit
      let axeReport = "";
      let axeViolations = 0;
      if (enableAxe) {
        const axe = await runAxeAudit(page);
        axeReport = axe.summary;
        axeViolations = axe.violationCount;
      }

      // Web Vitals
      let perfReport = "";
      let perfMetrics: Record<string, number> = {};
      if (enablePerf) {
        const perf = await runPerfCheck(page);
        perfReport = perf.summary;
        perfMetrics = perf.metrics as Record<string, number>;
      }

      // Build context string
      const contextStr = [
        `Page: ${exp.description ?? exp.name}`,
        `Viewport: ${device.viewport.width}x${device.viewport.height} (${device.name})`,
        axeReport,
        perfReport,
      ]
        .filter(Boolean)
        .join("\n");

      // Analyze with Claude
      const analysis = await analyzeScreenshot(screenshotPath, contextStr, config);

      const result: QAResult = {
        experience: exp.name,
        device: device.name,
        score: analysis.score,
        pass: analysis.score >= threshold,
        summary: analysis.summary,
        issues: analysis.issues,
        screenshotPath,
        axeViolations: axeViolations > 0 ? axeViolations : undefined,
        perfMetrics: Object.keys(perfMetrics).length > 0 ? perfMetrics : undefined,
      };

      results.push(result);

      // Report
      const reporter = config.reporter ?? "console";
      if (reporter === "console") {
        report(result);
      } else if (reporter === "json") {
        const jsonPath = screenshotPath.replace(".png", "-results.json");
        reportJSON(result, jsonPath);
      } else if (typeof reporter === "function") {
        for (const issue of result.issues) {
          reporter(issue);
        }
      }
      // github reporter is handled after all results are collected

      // Save per-result JSON alongside screenshot
      fs.writeFileSync(
        screenshotPath.replace(".png", "-results.json"),
        JSON.stringify(result, null, 2),
      );
    }
  }

  return results;
}
