#!/usr/bin/env node
// Usage: node check.js <url> [outDir]
// Loads <url> at phone and desktop widths, saves screenshots, and reports
// problems a human would notice: JS errors, failed requests, horizontal
// scroll, unlabeled controls, images without alt text. Exits 1 if any are found.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const url = process.argv[2];
const outDir = path.resolve(process.argv[3] || 'ui-check-output');
if (!url) { console.error('Usage: node check.js <url> [outDir]'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: 'phone', width: 375, height: 812 },
  { name: 'desktop', width: 1280, height: 800 },
];

(async () => {
  const browser = await chromium.launch();
  const report = { url, viewports: [] };
  let problemCount = 0;

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const problems = [];
    page.on('console', m => { if (m.type() === 'error') problems.push(`console error: ${m.text()}`); });
    page.on('pageerror', e => problems.push(`uncaught exception: ${e.message}`));
    page.on('response', r => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
    page.on('requestfailed', r => problems.push(`request failed: ${r.url()} (${r.failure()?.errorText})`));

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    } catch (e) {
      problems.push(`page did not load: ${e.message}`);
    }

    const audit = await page.evaluate(() => {
      const issues = [];
      if (!document.title.trim()) issues.push('page has no <title>');
      const doc = document.documentElement;
      if (doc.scrollWidth > window.innerWidth + 1) {
        const wide = [...document.querySelectorAll('body *')]
          .filter(el => el.getBoundingClientRect().right > window.innerWidth + 1)
          .slice(0, 3)
          .map(el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''));
        issues.push(`horizontal scroll: page is ${doc.scrollWidth}px wide in a ${window.innerWidth}px viewport (overflowing: ${wide.join(', ')})`);
      }
      document.querySelectorAll('img:not([alt])').forEach(img => issues.push(`image missing alt: ${img.src}`));
      document.querySelectorAll('input:not([type=hidden]), select, textarea').forEach(el => {
        const labelled = el.labels?.length || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title');
        if (!labelled) issues.push(`form control without label: <${el.tagName.toLowerCase()} name="${el.name || ''}" id="${el.id || ''}">`);
      });
      document.querySelectorAll('button, a[href], [role=button]').forEach(el => {
        const name = (el.innerText || '').trim() || el.getAttribute('aria-label') || el.getAttribute('title') || el.querySelector('img[alt]')?.alt;
        if (!name) issues.push(`control with no accessible name: <${el.tagName.toLowerCase()} class="${el.className || ''}">`);
      });
      return { title: document.title, issues, textPreview: document.body?.innerText.slice(0, 300) || '' };
    }).catch(e => ({ title: '', issues: [`audit failed: ${e.message}`], textPreview: '' }));

    problems.push(...audit.issues);
    const shot = path.join(outDir, `${vp.name}.png`);
    await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
    report.viewports.push({ viewport: `${vp.name} ${vp.width}x${vp.height}`, screenshot: shot, title: audit.title, textPreview: audit.textPreview, problems });
    problemCount += problems.length;
    await page.close();
  }

  await browser.close();
  report.problemCount = problemCount;
  console.log(JSON.stringify(report, null, 2));
  process.exit(problemCount ? 1 : 0);
})();
