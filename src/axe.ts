import type { Page } from "@playwright/test";

/**
 * Run axe-core accessibility audit and return a compact summary string plus
 * the raw violation count.
 */
export async function runAxeAudit(
  page: Page,
): Promise<{ summary: string; violationCount: number }> {
  try {
    // Dynamic import so the package stays optional
    const { default: AxeBuilder } = await import("@axe-core/playwright");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "best-practice"])
      .analyze();

    if (results.violations.length === 0) {
      return { summary: "Axe: 0 violations (clean)", violationCount: 0 };
    }

    const top = results.violations.slice(0, 5).map((v) => {
      const nodes = v.nodes.length;
      return `[${v.impact}] ${v.id}: ${v.help} (${nodes} element${nodes > 1 ? "s" : ""})`;
    });

    return {
      summary: `Axe: ${results.violations.length} violation(s):\n${top.join("\n")}`,
      violationCount: results.violations.length,
    };
  } catch {
    return { summary: "Axe: audit unavailable", violationCount: 0 };
  }
}
