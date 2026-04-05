import { execSync } from "child_process";
import type { QAResult } from "../types";

/**
 * Create a GitHub Issue for a failed QA result using the `gh` CLI.
 *
 * Requires `gh` to be installed and authenticated.
 *
 * @param result - The QA result that failed
 * @param repo - GitHub repo in "owner/repo" format (defaults to current repo)
 */
export function reportGitHub(result: QAResult, repo?: string): void {
  if (result.pass) return;

  const criticals = result.issues.filter((i) => i.severity === "critical");
  const title = `[QA ${result.score}/10] ${result.experience} on ${result.device}${criticals.length > 0 ? ` -- ${criticals.length} critical` : ""}`;

  const issueLines = result.issues
    .map(
      (i) =>
        `- **[${i.severity}]** \`${i.element}\`: ${i.description}${i.fixHint ? ` (Fix: ${i.fixHint})` : ""}`,
    )
    .join("\n");

  const body = [
    `## Visual QA Failure`,
    ``,
    `**Experience:** ${result.experience}`,
    `**Device:** ${result.device}`,
    `**Score:** ${result.score}/10`,
    ``,
    `### Issues`,
    issueLines,
    ``,
    `### Screenshot`,
    `See \`${result.screenshotPath}\``,
    ``,
    `---`,
    `_Filed by playwright-opus-qa_`,
  ].join("\n");

  const repoFlag = repo ? ` -R ${repo}` : "";
  const label = result.score <= 5 ? "priority:critical" : "bug";

  try {
    const cmd = `gh issue create${repoFlag} --title "${title.replace(/"/g, '\\"')}" --body "${body.replace(/"/g, '\\"')}" --label "${label}"`;
    const output = execSync(cmd, { timeout: 15_000, encoding: "utf8" });
    console.log(`  Created GitHub issue: ${output.trim()}`);
  } catch (e: any) {
    console.log(
      `  Failed to create GitHub issue: ${e.message?.slice(0, 100)}`,
    );
  }
}
