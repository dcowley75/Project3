---
name: ui-check
description: See and audit a running web page like a user would. Takes phone (375px) and desktop (1280px) screenshots and reports JS errors, failed requests, horizontal scroll, unlabeled inputs and buttons, and images without alt text. Use after building or changing any UI, and before claiming frontend work is done.
---

# UI check

Code that looks right can still render wrong. This skill lets you **look at the page**.

## Steps
1. Start the app in the background on a free port, e.g. `PORT=3123 node server.js &`,
   and wait until it responds (`curl -s localhost:3123 >/dev/null`). For a static site with
   no server, use `python3 -m http.server 3123 &`.
2. Run the checker (it works from any directory):
   ```
   node .claude/skills/ui-check/scripts/check.js http://localhost:3123 /tmp/ui-check
   ```
   It prints a JSON report and exits 1 if it found problems.
3. **Open the screenshots** (`/tmp/ui-check/phone.png`, `/tmp/ui-check/desktop.png`) with
   the Read tool and look at them. The automated checks can't judge whether it *looks*
   right: overlapping elements, unreadable contrast, broken layout, or an empty state where
   data should be.
4. For a page with interactions, also exercise the main flow with a short Playwright script
   (fill the form, click submit, check the result appears), then re-run the checker.
5. Stop the server (`kill %1`).

## Interpreting results
- `HTTP 404` on `/favicon.ico` is harmless; ignore it.
- Treat everything else as real until proven otherwise. Fix it (if you own the file) or
  report it with the owner.
- In your report, say what you saw in the screenshots, not just the JSON count.

## Notes
- Playwright is preinstalled in this environment; `require('playwright')` resolves
  globally. Elsewhere, run `npm i -D playwright && npx playwright install chromium` first.
- Write output to `/tmp`, never into the repo.
