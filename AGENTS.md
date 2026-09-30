# Agent Instructions

<!-- DRJ:CONTEXT BEGIN v=d5f6593 — generated from DRJ-Technologies/drj-context; do not edit here -->
> **Parent context:** [DRJ-Technologies/drj-context](https://github.com/DRJ-Technologies/drj-context)
> is canonical for DRJ platform patterns, preferences, and laws.
> Read the authenticated repository through `gh api` or its registered linked worktree.
> (private repo — a plain web fetch will 404; source edits require an owned linked worktree).
>
> **Everything below the END marker is repo-local and supersedes this block on conflict.**

## DRJ org context (synced — edit in drj-context, never here)

**Secrets** — never print/log/commit credentials; reference locations, not values. → `laws.md#secrets`
**Teams** — create/own your members and reviewers; never share across teams. Only leads communicate across teams; members may inspect read-only. → `operating.md#team-ownership-and-cross-team-boundaries`
**Unfamiliar tools** — read the real interface and prove it on one row first; plausible output can be wrong. → `operating.md`
**Model allocation** — consider Astra 6/xhigh, Sol 6.1/xhigh, Opus 5.5 and Fable 5.1 using task evidence and fresh capacity. → `operating.md#herdr-workflows-model-and-account-aware-planning`

**GitHub** — use `gh` and verify DRJ access before pushing; on SSH-agent failure use the
`gh` credential wrapper. → `patterns.md#git-and-github`

**Stacked PRs** — prefer native GitHub stacks for dependent changes; preserve ownership, checks and merge scope. → `operating.md#prefer-github-stacked-pull-requests`

**Branches** — `agent/<slug>-YYYYMMDD`; other prefixes for human-initiated work.
The date suffix is required; use conventional commit subjects. → `patterns.md#branches-and-commits`

**Shell** — use `cp -f`, `mv -f`, `rm -f` to avoid interactive aliases. → `patterns.md#non-interactive-shell-commands`

**SSM** — no `->`, `()`, heredocs, or streaming commands like `journalctl -f`;
append `|| true` so a correct command doesn't report `Status: Failed`.
→ `patterns.md#ssm-command-escaping`

**Docs** — durable rules in `AGENTS.md`, procedures in `docs/runbooks/`, dated
work products in `docs/log/`. `docs/log/` is **never current posture**. If the
agent file and a runbook disagree, **the runbook wins**.
→ `patterns.md#documentation-structure`

**Agent files** — `AGENTS.md` is canonical and real; `CLAUDE.md` is a git
symlink to it. After creating one, verify `git ls-files -s CLAUDE.md` prints
mode `120000` — a `core.symlinks=false` checkout silently commits a text file
instead and looks fine locally. → `patterns.md#agent-files`

**Roadmaps** — contribute material progress and evidence to the project's
canonical roadmap as work proceeds. When authorized, publish its browser view
and verify the served revision in Chrome/Chromium before claiming rollout.
→ `operating.md#keep-roadmaps-and-browser-views-current`

**Storybook** — in a repo with a catalog: component change ⇒ story change ⇒ story tests
green ⇒ story ids cited in the PR. → `operating.md#keep-the-component-catalog-current`

**Worktrees/tasks** — agents own linked worktrees; keep each team together in its project workspace.
Leads accept tested-head task receipts before worker cleanup; preserve source/history.
→ `operating.md#lead-owned-task-receipts-and-passive-events`, `#agent-completion-and-workspace-closure`
<!-- DRJ:CONTEXT END -->

