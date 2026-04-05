import type { Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import type { QAConfig, ExplorerStep, ExplorerReport } from "./types";
import { analyzeAndDecide } from "./analyze";
import { runAxeAudit } from "./axe";
import { runPerfCheck } from "./perf";
import { report } from "./reporters/console";

/**
 * Try multiple strategies to find and click a target element identified by
 * the explorer model.
 */
async function clickTarget(page: Page, target: string): Promise<boolean> {
  const strategies = [
    // 1. By data-testid
    () => page.getByTestId(target),
    // 2. By accessible name / role
    () => page.getByRole("button", { name: target }),
    () => page.getByRole("link", { name: target }),
    () => page.getByRole("tab", { name: target }),
    // 3. By text content
    () => page.getByText(target, { exact: false }),
    // 4. By testid pattern (kebab-case variant)
    () =>
      page.locator(
        `[data-testid*="${target.toLowerCase().replace(/\s+/g, "-")}"]`,
      ),
    // 5. By aria-label
    () => page.locator(`[aria-label*="${target}" i]`),
  ];

  for (const getLocator of strategies) {
    try {
      const locator = getLocator();
      const first = locator.first();
      if (await first.isVisible({ timeout: 3000 }).catch(() => false)) {
        await first.scrollIntoViewIfNeeded();
        await first.click({ timeout: 5000 });
        return true;
      }
    } catch {
      continue;
    }
  }
  return false;
}

/**
 * Run the autonomous QA explorer.
 *
 * Starting from `startPath`, the explorer:
 * 1. Screenshots the current state
 * 2. Runs accessibility and performance audits
 * 3. Sends everything to Claude to score and decide what to click next
 * 4. Clicks the target, waits, and repeats
 * 5. Stops when the model returns "done" or `maxExplorerSteps` is reached
 *
 * @returns ExplorerReport with all steps, scores, and the final summary
 */
export async function runExplorer(
  page: Page,
  startPath: string,
  config: QAConfig = {},
): Promise<ExplorerReport> {
  const maxSteps = config.maxExplorerSteps ?? 25;
  const threshold = config.threshold ?? 9;
  const enableAxe = config.axe !== false;
  const enablePerf = config.perf !== false;
  const deviceName =
    config.devices?.[0]?.name ?? "Default";
  const viewport =
    config.devices?.[0]?.viewport ?? { width: 1280, height: 800 };

  const screenshotDir =
    config.screenshotDir ??
    path.join(process.cwd(), "__screenshots__/qa-explorer");
  fs.mkdirSync(screenshotDir, { recursive: true });

  await page.setViewportSize(viewport);
  await page.goto(startPath);
  await page.waitForTimeout(2500);

  const steps: ExplorerStep[] = [];
  const visitedStates: string[] = [];

  for (let step = 1; step <= maxSteps; step++) {
    const currentUrl = page.url();
    const stateKey = `${new URL(currentUrl).pathname}[step${step}]`;

    // Screenshot
    const screenshotPath = path.join(
      screenshotDir,
      `${deviceName.toLowerCase().replace(/\s+/g, "-")}-step-${String(step).padStart(2, "0")}.png`,
    );
    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
      scale: "css",
    });

    // Audits
    let axeReport = "";
    let axeViolations = 0;
    if (enableAxe) {
      const axe = await runAxeAudit(page);
      axeReport = axe.summary;
      axeViolations = axe.violationCount;
    }

    let perfReport = "";
    let perfMetrics: Record<string, number> = {};
    if (enablePerf && step === 1) {
      const perf = await runPerfCheck(page);
      perfReport = perf.summary;
      perfMetrics = perf.metrics as Record<string, number>;
    }

    // Analyze and get next action
    let result;
    try {
      result = await analyzeAndDecide(
        screenshotPath,
        visitedStates,
        viewport,
        axeReport,
        perfReport,
        config,
      );
    } catch (e: any) {
      console.log(`  Step ${step}: Failed to analyze -- ${e.message}`);
      break;
    }

    const stepData: ExplorerStep = {
      step,
      url: currentUrl,
      screenshotPath,
      score: result.score,
      summary: result.summary,
      issues: result.issues,
      action: result.next_action,
      axeViolations: axeViolations > 0 ? axeViolations : undefined,
      perfMetrics: Object.keys(perfMetrics).length > 0 ? perfMetrics : undefined,
    };
    steps.push(stepData);
    visitedStates.push(
      `${stateKey}: ${result.summary} (clicked: "${result.next_action.target}")`,
    );

    // Console output
    const scoreIcon = result.score >= threshold ? "[PASS]" : "[FAIL]";
    console.log(
      `\n  ${scoreIcon} Step ${step} (${result.score}/10): ${result.summary}`,
    );
    console.log(`    URL: ${new URL(currentUrl).pathname}`);
    for (const issue of result.issues) {
      const icon =
        issue.severity === "critical"
          ? "!!!"
          : issue.severity === "warning"
            ? " ! "
            : "   ";
      console.log(
        `    ${icon} [${issue.severity}] ${issue.element}: ${issue.description}`,
      );
    }

    // Check for done
    if (result.next_action.type === "done") {
      console.log(
        `\n  Explorer finished after ${step} steps -- all reachable states explored.`,
      );
      break;
    }

    // Execute next action
    console.log(
      `    -> Clicking: "${result.next_action.target}" (${result.next_action.reason})`,
    );
    const clicked = await clickTarget(page, result.next_action.target);
    if (!clicked) {
      console.log(
        `    Could not find "${result.next_action.target}" -- trying to continue`,
      );
      if (steps.length > 1) {
        await page.goBack().catch(() => {});
      }
    }
    await page.waitForTimeout(2000);
  }

  // Build report
  const avgScore =
    steps.length > 0
      ? steps.reduce((s, x) => s + x.score, 0) / steps.length
      : 0;
  const failedSteps = steps.filter((s) => s.score < threshold);

  const explorerReport: ExplorerReport = {
    device: deviceName,
    viewport,
    startPath,
    totalSteps: steps.length,
    avgScore: Number(avgScore.toFixed(1)),
    failedSteps: failedSteps.length,
    steps,
  };

  // Save report JSON
  const reportPath = path.join(
    screenshotDir,
    `${deviceName.toLowerCase().replace(/\s+/g, "-")}-report.json`,
  );
  fs.writeFileSync(reportPath, JSON.stringify(explorerReport, null, 2));

  // Summary
  console.log(`\n  ========================================`);
  console.log(`  Explorer Report: ${deviceName}`);
  console.log(
    `  Steps: ${steps.length} | Avg Score: ${avgScore.toFixed(1)}/10 | Failures: ${failedSteps.length}`,
  );
  console.log(`  Report: ${reportPath}`);
  console.log(`  ========================================\n`);

  return explorerReport;
}
