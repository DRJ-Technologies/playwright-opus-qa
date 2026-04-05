import type { Page } from "@playwright/test";

export interface PerfMetrics {
  ttfb?: number;
  fcp?: number;
  lcp?: number;
  cls?: number;
  domContentLoaded?: number;
  resourceCount?: number;
}

/**
 * Collect Web Vitals and navigation timing metrics from the page via the
 * Performance API.  Returns a human-readable summary and the raw metrics.
 */
export async function runPerfCheck(
  page: Page,
): Promise<{ summary: string; metrics: PerfMetrics }> {
  try {
    const raw = await page.evaluate(() => {
      const perf = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType("paint");
      const fcp = paint.find((e) => e.name === "first-contentful-paint");
      const lcp = (performance as any)
        .getEntriesByType?.("largest-contentful-paint")
        ?.slice(-1)[0];
      const cls = (performance as any)
        .getEntriesByType?.("layout-shift")
        ?.filter((e: any) => !e.hadRecentInput)
        ?.reduce((sum: number, e: any) => sum + e.value, 0);

      return {
        ttfb: perf
          ? Math.round(perf.responseStart - perf.requestStart)
          : null,
        fcp: fcp ? Math.round(fcp.startTime) : null,
        lcp: lcp ? Math.round(lcp.startTime) : null,
        cls: cls != null ? Number(cls.toFixed(3)) : null,
        domContentLoaded: perf
          ? Math.round(perf.domContentLoadedEventEnd - perf.fetchStart)
          : null,
        resourceCount: performance.getEntriesByType("resource").length,
      };
    });

    const lines = [
      raw.ttfb != null ? `TTFB: ${raw.ttfb}ms` : null,
      raw.fcp != null ? `FCP: ${raw.fcp}ms` : null,
      raw.lcp != null ? `LCP: ${raw.lcp}ms` : null,
      raw.cls != null ? `CLS: ${raw.cls}` : null,
      raw.domContentLoaded != null ? `DCL: ${raw.domContentLoaded}ms` : null,
      raw.resourceCount != null ? `Resources: ${raw.resourceCount}` : null,
    ].filter(Boolean);

    const flags: string[] = [];
    if (raw.fcp != null && raw.fcp > 2500) flags.push("FCP > 2.5s (slow)");
    if (raw.lcp != null && raw.lcp > 4000) flags.push("LCP > 4s (slow)");
    if (raw.cls != null && raw.cls > 0.1) flags.push("CLS > 0.1 (layout shift)");

    const metrics: PerfMetrics = {};
    if (raw.ttfb != null) metrics.ttfb = raw.ttfb;
    if (raw.fcp != null) metrics.fcp = raw.fcp;
    if (raw.lcp != null) metrics.lcp = raw.lcp;
    if (raw.cls != null) metrics.cls = raw.cls;
    if (raw.domContentLoaded != null)
      metrics.domContentLoaded = raw.domContentLoaded;
    if (raw.resourceCount != null) metrics.resourceCount = raw.resourceCount;

    const summary = `Perf: ${lines.join(", ")}${flags.length > 0 ? `\n!! ${flags.join("; ")}` : ""}`;
    return { summary, metrics };
  } catch {
    return { summary: "Perf: metrics unavailable", metrics: {} };
  }
}
