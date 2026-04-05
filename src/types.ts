import type { Page } from "@playwright/test";

export interface QAConfig {
  /** Anthropic API key (or set ANTHROPIC_API_KEY env var) */
  apiKey?: string;
  /** Claude model to use (default: claude-opus-4-6) */
  model?: string;
  /** Minimum score to pass (default: 9) */
  threshold?: number;
  /** Device viewports to test */
  devices?: Array<{ name: string; viewport: { width: number; height: number } }>;
  /** Directory to save screenshots */
  screenshotDir?: string;
  /** App description for the QA prompt context */
  appContext?: string;
  /** Custom QA prompt (overrides default) */
  prompt?: string;
  /** Enable axe-core accessibility auditing (default: true) */
  axe?: boolean;
  /** Enable Web Vitals performance check (default: true) */
  perf?: boolean;
  /** Issue reporter: 'console' | 'github' | 'json' | custom function */
  reporter?: "console" | "github" | "json" | ((issue: QAIssue) => void);
  /** Max steps for autonomous explorer (default: 25) */
  maxExplorerSteps?: number;
  /** Collect mode -- don't fail tests, just report (default: false) */
  collectMode?: boolean;
}

export interface Experience {
  /** Short identifier for this experience */
  name: string;
  /** Human-readable description of what this page shows */
  description: string;
  /** URL path to navigate to (e.g. '/' or '/settings') */
  path?: string;
  /** Custom setup function to prepare page state before screenshotting */
  setup?: (page: Page) => Promise<void>;
}

export interface QAResult {
  experience: string;
  device: string;
  score: number;
  pass: boolean;
  summary: string;
  issues: QAIssue[];
  screenshotPath: string;
  axeViolations?: number;
  perfMetrics?: Record<string, number>;
}

export interface QAIssue {
  severity: "critical" | "warning" | "minor";
  element: string;
  description: string;
  fixHint?: string;
}

export interface ExplorerStep {
  step: number;
  url: string;
  screenshotPath: string;
  score: number;
  summary: string;
  issues: QAIssue[];
  action: { type: string; target: string; reason: string };
  axeViolations?: number;
  perfMetrics?: Record<string, number>;
}

export interface ExplorerReport {
  device: string;
  viewport: { width: number; height: number };
  startPath: string;
  totalSteps: number;
  avgScore: number;
  failedSteps: number;
  steps: ExplorerStep[];
}

export interface AnalysisResult {
  score: number;
  pass: boolean;
  summary: string;
  issues: QAIssue[];
}
