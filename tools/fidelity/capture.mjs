#!/usr/bin/env node
// Capture des pages et composants, côté maquette et/ou côté application.
// Usage : node capture.mjs --target mockup|app|both [--config fidelity.config.json]
//                          [--page id1,id2] [--viewport desktop,mobile] [--no-components]
import path from 'node:path';
import { chromium } from 'playwright';
import {
  parseArgs, loadConfig, selectPages, selectViewports, preparePage,
  applyState, resetState, compSelector, ensureDir, shotName,
} from './lib.mjs';

const args = parseArgs();
const cfg = loadConfig(args.config);
const targets = args.target === 'both' || !args.target ? ['mockup', 'app'] : [args.target];
const pages = selectPages(cfg, args);
const vps = selectViewports(cfg, args);
const withComponents = !args['no-components'];

const browser = await chromium.launch();
let failures = 0;
const allWarnings = new Set();

for (const target of targets) {
  const dir = ensureDir(path.join(cfg.outDir, 'shots', target));
  for (const pageDef of pages) {
    if (pageDef.skip?.includes?.(target)) continue;
    for (const vp of vps) {
      let prepared;
      try {
        prepared = await preparePage(browser, cfg, pageDef, target, vp);
      } catch (e) {
        failures++; console.error(`✖ [${target}] ${pageDef.id}@${vp.name} : ${e.message}`); continue;
      }
      const { page, ctx, warnings } = prepared;
      warnings.forEach((w) => allWarnings.add(`[${target}] ${w}`));

      const file = path.join(dir, shotName(pageDef.id, vp.name));
      await page.screenshot({
        path: file,
        fullPage: pageDef.fullPage !== false,
        mask: (pageDef.mask || []).map((s) => page.locator(s)),
        maskColor: '#FF00FF',
        animations: 'disabled',
      });
      console.log(`✓ [${target}] ${path.relative(process.cwd(), file)}`);

      if (withComponents) {
        for (const comp of pageDef.components || []) {
          const sel = compSelector(comp, target);
          const loc = page.locator(sel).first();
          if (!(await loc.count())) {
            failures++; console.error(`  ✖ composant « ${comp.id} » introuvable (${sel})`); continue;
          }
          for (const state of comp.states || ['default']) {
            await resetState(page);
            await loc.scrollIntoViewIfNeeded().catch(() => {});
            if (state !== 'default') await applyState(page, sel, state);
            const cfile = path.join(dir, shotName(pageDef.id, vp.name, comp.id, state));
            await loc.screenshot({ path: cfile, animations: 'disabled' });
            console.log(`  ✓ ${comp.id}${state !== 'default' ? ' (' + state + ')' : ''}`);
          }
        }
      }
      await ctx.close();
    }
  }
}
await browser.close();

if (allWarnings.size) {
  console.warn('\n⚠ Avertissements :');
  for (const w of allWarnings) console.warn('  - ' + w);
}
process.exit(failures ? 1 : 0);
