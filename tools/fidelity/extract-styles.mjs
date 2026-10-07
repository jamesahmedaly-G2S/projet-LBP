#!/usr/bin/env node
// Extraction des styles CALCULÉS (après cascade) des composants déclarés dans la config,
// et inventaire des tokens réellement utilisés à l'écran.
// Usage : node extract-styles.mjs [--target mockup|app] [--page id] [--viewport name] [--tokens]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import {
  parseArgs, loadConfig, selectPages, selectViewports, preparePage,
  applyState, resetState, compSelector, ensureDir,
} from './lib.mjs';

export const PROPS = [
  // boîte & mise en page
  'display', 'position', 'box-sizing', 'width', 'height', 'min-height', 'max-width',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'gap', 'row-gap', 'column-gap', 'flex-direction', 'flex-wrap', 'align-items', 'justify-content',
  'grid-template-columns', 'overflow-x', 'overflow-y', 'z-index',
  // typographie
  'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing',
  'text-transform', 'text-align', 'text-decoration-line', 'white-space', 'color',
  // apparence
  'background-color', 'background-image', 'opacity',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
  'box-shadow', 'outline-style', 'outline-width', 'outline-color', 'outline-offset',
  'transform', 'filter', 'backdrop-filter', 'cursor',
];

/** Runs in the browser: computed styles of the first element matching `sel`. */
function readStyles({ sel, props }) {
  const el = document.querySelector(sel);
  if (!el) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const pick = (s) => Object.fromEntries(props.map((p) => [p, s.getPropertyValue(p).trim()]));
  const out = {
    count: document.querySelectorAll(sel).length,
    rect: { x: Math.round(r.x), y: Math.round(r.y + scrollY), width: +r.width.toFixed(1), height: +r.height.toFixed(1) },
    text: (el.innerText || '').trim().slice(0, 80),
    styles: pick(cs),
  };
  for (const pseudo of ['::before', '::after']) {
    const ps = getComputedStyle(el, pseudo);
    if (ps.content && ps.content !== 'none' && ps.content !== 'normal') out[pseudo] = { content: ps.content, ...pick(ps) };
  }
  return out;
}

/** Runs in the browser: tokens actually used by visible elements + resolved :root variables. */
export function harvestTokens() {
  const bump = (m, k) => { if (k && k !== 'none' && k !== 'normal' && k !== '0px' && k !== 'rgba(0, 0, 0, 0)') m[k] = (m[k] || 0) + 1; };
  const T = { colors: {}, backgrounds: {}, borders: {}, fontFamilies: {}, fontSizes: {}, fontWeights: {}, lineHeights: {}, letterSpacings: {}, radii: {}, shadows: {}, paddings: {}, gaps: {} };
  for (const el of document.body.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (hasText) {
      bump(T.colors, cs.color); bump(T.fontFamilies, cs.fontFamily); bump(T.fontSizes, cs.fontSize);
      bump(T.fontWeights, cs.fontWeight); bump(T.lineHeights, cs.lineHeight); bump(T.letterSpacings, cs.letterSpacing);
    }
    bump(T.backgrounds, cs.backgroundColor);
    if (parseFloat(cs.borderTopWidth)) bump(T.borders, `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`);
    bump(T.radii, cs.borderTopLeftRadius); bump(T.shadows, cs.boxShadow);
    if (cs.padding !== '0px') bump(T.paddings, cs.padding);
    if (cs.display.includes('flex') || cs.display.includes('grid')) bump(T.gaps, cs.gap);
  }
  const vars = {};
  const rootCs = getComputedStyle(document.documentElement);
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch (e) { continue; }
    for (const rule of rules) {
      if (!rule.style) continue;
      for (const prop of rule.style) if (prop.startsWith('--')) vars[prop] = rootCs.getPropertyValue(prop).trim();
    }
  }
  const sort = (m) => Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1]));
  for (const k of Object.keys(T)) T[k] = sort(T[k]);
  return { used: T, rootVariables: vars };
}

const BORING = new Set(['none', 'normal', 'auto', '0px', 'static', 'visible', 'rgba(0, 0, 0, 0)', 'start', 'nowrap', 'medium', 'currentcolor', '']);
function toMarkdown(result) {
  let md = `# Spécifications calculées — ${result.page} @ ${result.viewport} (${result.target})\n\n`;
  md += `> Valeurs **après cascade** (getComputedStyle). Ce sont elles qu'il faut reproduire, pas le CSS source.\n\n`;
  for (const [id, c] of Object.entries(result.components)) {
    md += `## ${id}\n\n\`${c.selector}\``;
    if (!c.found) { md += ` — ❌ introuvable\n\n`; continue; }
    md += ` — ${c.count} occurrence(s), ${c.rect.width}×${c.rect.height}px\n\n`;
    for (const [state, s] of Object.entries(c.states)) {
      const blocks = { [id]: s.self, ...Object.fromEntries(Object.entries(s.parts || {}).map(([k, v]) => [`${id} › ${k}`, v])) };
      for (const [label, data] of Object.entries(blocks)) {
        if (!data) { md += `- ${label} : introuvable\n`; continue; }
        md += `### ${label}${state !== 'default' ? ` — :${state}` : ''}\n\n| Propriété | Valeur |\n|---|---|\n`;
        for (const [p, v] of Object.entries(data.styles)) if (!BORING.has(v)) md += `| ${p} | \`${v}\` |\n`;
        for (const pseudo of ['::before', '::after']) if (data[pseudo]) md += `| ${pseudo} content | \`${data[pseudo].content}\` |\n`;
        md += '\n';
      }
    }
  }
  return md;
}

export async function extract(cfg, { target, pages, vps, tokens, quiet }) {
  const browser = await chromium.launch();
  const dir = ensureDir(path.join(cfg.outDir, 'styles', target));
  const written = [];
  for (const pageDef of pages) {
    for (const vp of vps) {
      const { page, ctx, warnings } = await preparePage(browser, cfg, pageDef, target, vp);
      if (!quiet) warnings.forEach((w) => console.warn(`⚠ [${target}] ${w}`));
      const result = { target, page: pageDef.id, viewport: vp.name, components: {} };
      for (const comp of pageDef.components || []) {
        const sel = compSelector(comp, target);
        const entry = { selector: sel, found: false, states: {} };
        for (const state of comp.states || ['default']) {
          await resetState(page);
          if (state !== 'default' && (await page.locator(sel).count())) await applyState(page, sel, state);
          const self = await page.evaluate(readStyles, { sel, props: PROPS });
          if (!self) break;
          entry.found = true; entry.count = self.count; entry.rect = self.rect;
          const parts = {};
          for (const [name, partSel] of Object.entries(comp.parts || {})) {
            const ps = typeof partSel === 'string' ? partSel : partSel[target];
            if (!ps) continue;
            parts[name] = await page.evaluate(readStyles, { sel: `${sel} ${ps}`, props: PROPS });
          }
          entry.states[state] = { self, parts };
        }
        result.components[comp.id] = entry;
      }
      if (tokens) result.tokens = await page.evaluate(harvestTokens);
      const base = path.join(dir, `${pageDef.id}@${vp.name}`);
      fs.writeFileSync(base + '.json', JSON.stringify(result, null, 2));
      fs.writeFileSync(base + '.md', toMarkdown(result));
      written.push(base + '.json');
      if (!quiet) console.log(`✓ [${target}] ${path.relative(process.cwd(), base)}.{json,md}`);
      await ctx.close();
    }
  }
  await browser.close();
  return written;
}

if (import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = parseArgs();
  const cfg = loadConfig(args.config);
  await extract(cfg, {
    target: args.target || 'mockup',
    pages: selectPages(cfg, args),
    vps: selectViewports(cfg, args),
    tokens: !!args.tokens,
  });
}
