import type { QAResult } from "../types";

/**
 * Print a QA result to the console with severity icons.
 */
export function report(result: QAResult): void {
  console.log(
    `\n  QA: ${result.experience} @ ${result.device} -- Score: ${result.score}/10`,
  );
  console.log(`  ${result.summary}`);
  for (const issue of result.issues) {
    const icon =
      issue.severity === "critical"
        ? "!!!"
        : issue.severity === "warning"
          ? " ! "
          : "   ";
    console.log(
      `  ${icon} [${issue.severity}] ${issue.element}: ${issue.description}`,
    );
    if (issue.fixHint) {
      console.log(`      Fix: ${issue.fixHint}`);
    }
  }
}
