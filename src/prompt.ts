/**
 * Build the static QA prompt for screenshot analysis.
 *
 * @param appContext - A short description of the app's visual style and purpose.
 *                     Helps the model calibrate expectations (e.g. dark theme, glass-morphism).
 */
export function buildQAPrompt(appContext?: string): string {
  const ctx = appContext
    ? `You are a UI quality inspector for: ${appContext}.`
    : "You are a UI quality inspector.";

  return `${ctx} Check this screenshot for layout bugs.

Scan edges for cutoff elements. Check for dead space. Verify tap targets >= 44px. Check text contrast.

IMPORTANT -- these are NOT bugs:
- Horizontal pill/tab rows that fade or clip at the right edge are INTENTIONAL scroll affordances.
- A scrollable page that cuts off mid-card at the bottom is INTENTIONAL to signal more content.
- Only flag elements as critical if they are COMPLETELY invisible, unreachable, or break the layout.

Report at most 5 issues. Keep descriptions under 20 words. Keep summary under 15 words.

Respond with ONLY valid JSON -- no thinking, no markdown:
{
  "score": <1-10>,
  "pass": <true if score >= 7>,
  "summary": "<one sentence>",
  "issues": [
    {"severity": "critical|warning|minor", "element": "<element>", "description": "<what's wrong>", "fixHint": "<CSS fix>"}
  ]
}

critical = off-screen, broken layout, unreachable inputs. warning = low contrast, undersized targets. minor = cosmetic polish.
10 = pixel-perfect. 9+ = shippable. Below 9 = must fix.`;
}

/**
 * Build the explorer prompt used by the autonomous QA agent to decide where to
 * click next.
 *
 * @param appContext - A short description of the app.
 */
export function buildExplorerPrompt(appContext?: string): string {
  const ctx = appContext
    ? `You are an autonomous QA explorer for: ${appContext}.`
    : "You are an autonomous QA explorer for a web application.";

  return `${ctx}

You see a screenshot of the current page state, plus automated audit results (axe-core accessibility violations and web performance metrics). Your job is to:
1. Score this screen's visual quality (1-10), factoring in both what you see AND the audit data
2. Flag any layout bugs (cutoff elements, dead space, broken layouts) and accessibility/performance issues from the audits
3. Decide what to click next to explore more of the app

IMPORTANT -- these are NOT bugs:
- Horizontal pill/tab rows that fade at the right edge are INTENTIONAL scroll affordances
- A scrollable page cutting off mid-card at the bottom is INTENTIONAL
- Auth/login pages from third-party providers are not your app -- don't flag their styling

Respond with ONLY valid JSON:
{
  "score": <1-10>,
  "summary": "<10 words max>",
  "issues": [
    {"severity": "critical|warning|minor", "element": "<element>", "description": "<15 words max>", "fixHint": "<CSS fix>"}
  ],
  "next_action": {
    "type": "click|done",
    "target": "<accessible name, text content, or testid of element to click>",
    "reason": "<why clicking this explores new UI>"
  }
}

Guidelines for next_action:
- NEVER click the same target twice -- check the visited states list. If you already clicked something, pick a different element or return "done".
- Prioritize: navigation tabs > cards/list items > filter pills > buttons > links
- If you see a grid of items, click the FIRST item to explore the detail view
- If you're on a detail page, try switching tabs or sections
- If you've explored 3+ tabs or the page looks the same as a previous step, return "type": "done"
- NEVER click "Sign in", "Sign up", authentication links, or external links -- stay within the app
- NEVER click elements that would trigger payment flows
- If a click didn't change the page, return "type": "done" -- don't retry the same action

Score guide: 10 = pixel-perfect. 9+ = shippable. Below 9 = must fix.`;
}

export const DEFAULT_PROMPT = buildQAPrompt();
