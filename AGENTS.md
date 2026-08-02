# playwright-opus-qa

<!-- DRJ:CONTEXT BEGIN v=27acdf3 — generated from DRJ-Technologies/drj-context; do not edit here -->
> **Parent context:** [DRJ-Technologies/drj-context](https://github.com/DRJ-Technologies/drj-context)
> is canonical for DRJ platform patterns, preferences, and laws.
> Read it in full: `gh repo clone DRJ-Technologies/drj-context`
> (private repo — a plain web fetch will 404).
>
> **Everything below the END marker is repo-local and supersedes this block on conflict.**

## DRJ org context (synced — edit in drj-context, never here)

**Secrets** — never print, echo, log, or commit credentials or secret-bearing
output. Reference a secret by its location, never its value. → `laws.md#secrets`

**Unfamiliar tools** — read the real interface and prove it on one row before
building on it. A wrong flag usually *succeeds* and returns plausible output
measuring the wrong thing. → `operating.md`

**GitHub** — `gh auth switch -u dan-island` before any DRJ remote operation
(`mini-dan` for MiniMastery). If a push fails with `Permission denied
(publickey)` the SSH agent is down; use the gh-credential wrapper rather than
working around it. → `patterns.md#git-and-github`

**Branches** — `agent/<slug>-YYYYMMDD`; other prefixes for human-initiated work.
The date suffix is not optional. Commit subjects use conventional-commit
prefixes. → `patterns.md#branches-and-commits`

**Shell** — always `cp -f`, `mv -f`, `rm -f`. An `-i` alias hangs an agent
indefinitely on input that never comes. → `patterns.md#non-interactive-shell-commands`

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
<!-- DRJ:CONTEXT END -->

<!-- Repo-local instructions go below this line. Anything here supersedes
     the parent-context block above. -->
