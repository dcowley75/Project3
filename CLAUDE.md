# Working agreement

## Agent team (`.claude/agents/`)
For anything bigger than a small fix, the main session acts as **orchestrator**
and delegates to the specialists:

1. **architect** writes `docs/SPEC.md`, including the API contract and file ownership.
2. In parallel: **backend-builder**, **frontend-builder**, and **test-writer**
   (tests written from the spec).
3. **test-writer** runs the full suite, and **reviewer** reviews the diff.
4. The orchestrator sends failures back to the owning agent, then repeats step 3.
5. The orchestrator commits once the reviewer's verdict is "ship".

Rules: `docs/SPEC.md` is the source of truth; agents edit only the files they own;
contract changes go back through the architect.

## Conventions
- Node + Express (CommonJS), vanilla HTML/CSS/JS on the client, no build step.
- Server reads `PORT` from the environment (default 3000).

## Skills
- `ui-check` (`.claude/skills/ui-check/`): phone and desktop screenshots plus automated
  UI checks. Preloaded into frontend-builder, test-writer and reviewer.
- `engineering:testing-strategy` and `engineering:code-review` come from the engineering
  plugin. If that plugin isn't installed, the agents still work without them.
