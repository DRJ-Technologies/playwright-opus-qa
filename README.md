# playwright-opus-qa

A Playwright plugin that uses Claude Opus to visually QA any web app. It screenshots every page across multiple device viewports, sends each screenshot to Claude for analysis, and returns a structured score with specific issues and fix hints. Includes an autonomous explorer mode that clicks through your app like a real user, plus built-in axe-core accessibility auditing and Web Vitals performance checks.

## Install

```bash
npm install playwright-opus-qa @playwright/test
```

Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

## Quick Start

```ts
import { test } from '@playwright/test';
import { runQA, runExplorer, DEFAULT_DEVICES } from 'playwright-opus-qa';

const config = {
  threshold: 9,
  appContext: 'A dark-themed SaaS dashboard',
  devices: DEFAULT_DEVICES,
};

const experiences = [
  { name: 'home', path: '/' },
  { name: 'dashboard', path: '/dashboard', description: 'Main dashboard' },
];

test('visual QA sweep', async ({ page }) => {
  const results = await runQA(page, experiences, config);
  const failures = results.filter(r => !r.pass);
  if (failures.length > 0) throw new Error(`${failures.length} failures`);
});

test('autonomous explorer', async ({ page }) => {
  const report = await runExplorer(page, '/', config);
  console.log(`Explored ${report.steps.length} states, avg ${report.avgScore}/10`);
});
```

## Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | `ANTHROPIC_API_KEY` env | Anthropic API key |
| `model` | `string` | `claude-opus-4-6` | Claude model to use |
| `threshold` | `number` | `9` | Minimum score to pass (1-10) |
| `devices` | `Array<{name, viewport}>` | 4 presets | Device viewports to test |
| `screenshotDir` | `string` | `__screenshots__/` | Where to save screenshots |
| `appContext` | `string` | - | App description for prompt context |
| `prompt` | `string` | Built-in | Custom QA prompt (overrides default) |
| `axe` | `boolean` | `true` | Enable axe-core accessibility audit |
| `perf` | `boolean` | `true` | Enable Web Vitals collection |
| `reporter` | `'console' \| 'github' \| 'json' \| function` | `'console'` | How to report issues |
| `maxExplorerSteps` | `number` | `25` | Max steps for the explorer |
| `collectMode` | `boolean` | `false` | Report without failing tests |

## How Scoring Works

Claude analyzes each screenshot and returns a score from 1-10:

- **10** -- Pixel-perfect, no issues
- **9+** -- Shippable quality
- **7-8** -- Minor issues that should be fixed
- **Below 7** -- Significant problems

Each score comes with up to 5 specific issues categorized by severity:

- **critical** -- Off-screen elements, broken layout, unreachable inputs
- **warning** -- Low contrast, undersized tap targets (< 44px)
- **minor** -- Cosmetic polish, spacing inconsistencies

Issues include a `fixHint` with a suggested CSS fix when applicable.

## How the Explorer Works

The autonomous explorer simulates a real user navigating your app:

1. Starts at the given path and takes a screenshot
2. Sends the screenshot to Claude, which scores the page and decides what to click next
3. Clicks the target element (tries data-testid, role, text, aria-label strategies)
4. Waits for the page to settle, then repeats
5. Stops when Claude returns "done" or the step limit is reached

The explorer tracks visited states to avoid loops and never clicks auth flows or payment buttons. It produces a full report with per-step scores, issues, and screenshots.

## Default Devices

```ts
import { DEFAULT_DEVICES } from 'playwright-opus-qa';
// [
//   { name: 'iPhone SE',           viewport: { width: 375,  height: 667  } },
//   { name: 'iPhone 14',           viewport: { width: 390,  height: 844  } },
//   { name: 'iPhone 14 Pro Max',   viewport: { width: 430,  height: 932  } },
//   { name: 'Desktop',             viewport: { width: 1280, height: 800  } },
// ]
```

## API

### `runQA(page, experiences, config?)`

Runs the static QA agent across all (experience, device) combinations. Returns `QAResult[]`.

### `runExplorer(page, startPath, config?)`

Runs the autonomous explorer from a starting path. Returns `ExplorerReport`.

### `analyzeScreenshot(screenshotPath, context, config?)`

One-shot analysis of a single screenshot. Returns `AnalysisResult` with score, summary, and issues.

### `buildQAPrompt(appContext?)`

Returns the default QA prompt template, optionally customized with your app description.

### `buildExplorerPrompt(appContext?)`

Returns the explorer prompt template.

## License

MIT
