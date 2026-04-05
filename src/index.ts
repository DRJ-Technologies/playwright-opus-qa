export { runQA } from "./agent";
export { runExplorer } from "./explorer";
export { analyzeScreenshot } from "./analyze";
export { DEFAULT_PROMPT, buildQAPrompt, buildExplorerPrompt } from "./prompt";
export type {
  QAConfig,
  QAResult,
  QAIssue,
  Experience,
  ExplorerStep,
  ExplorerReport,
  AnalysisResult,
} from "./types";

/**
 * Default device viewports covering the most common mobile and desktop sizes.
 */
export const DEFAULT_DEVICES = [
  { name: "iPhone SE", viewport: { width: 375, height: 667 } },
  { name: "iPhone 14", viewport: { width: 390, height: 844 } },
  { name: "iPhone 14 Pro Max", viewport: { width: 430, height: 932 } },
  { name: "Desktop", viewport: { width: 1280, height: 800 } },
];
