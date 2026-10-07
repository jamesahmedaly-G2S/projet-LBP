// Shared helpers for the html-mockup-fidelity scripts.
// Requires: playwright (+ chromium), pngjs, pixelmatch.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function parseArgs(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) out[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) out[k] = argv[++i];
      else out[k] = true;
    } else out._.push(a);
  }
  return out;
}

export function loadConfig(p = 'fidelity.config.json') {
  const abs = path.resolve(p);
  if (!fs.existsSync(abs)) {
    console.error(`✖ Config introuvable : ${abs}\n  Copiez assets/fidelity.config.example.json et adaptez-le.`);
    process.exit(2);
  }
  const cfg = JSON.parse(fs.readFileSync(abs, 'utf8'));
  cfg.__dir = path.dirname(abs);
  cfg.outDir = path.resolve(cfg.__dir, cfg.outDir || '.fidelity');
  cfg.viewports = cfg.viewports || [{ name: 'desktop', width: 1240, height: 900 }];
  cfg.freeze = Object.assign({ disableAnimations: true, clearStorage: true }, cfg.freeze || {});
  cfg.thresholds = Object.assign(
    { pixel: 0.1, pageMaxDiffRatio: 0.005, componentMaxDiffRatio: 0.001, pxTolerance: 0.5 },
    cfg.thresholds || {}
  );
  return cfg;
}

/** Resolve the URL for a page on a given target ("mockup" | "app"). */
export function pageUrl(cfg, page, target) {
  const side = page[target] || {};
  if (target === 'mockup') {
    const m = cfg.mockup || {};
    if (m.baseUrl) return new URL(side.path || '', m.baseUrl).href;
    const file = path.resolve(cfg.__dir, m.file);
    return pathToFileURL(file).href + (side.hash || '');
  }
  const base = (cfg.app && cfg.app.baseUrl) || 'http://localhost:3000';
  return new URL(side.path || '/', base).href;
}

export function selectPages(cfg, args) {
  let pages = cfg.pages || [];
  if (args.page) {
    const ids = String(args.page).split(',');
    pages = pages.filter((p) => ids.includes(p.id));
    if (!pages.length) { console.error(`✖ Aucune page ne correspond à --page ${args.page}`); process.exit(2); }
  }
  return pages;
}

export function selectViewports(cfg, args) {
  if (!args.viewport) return cfg.viewports;
  const names = String(args.viewport).split(',');
  return cfg.viewports.filter((v) => names.includes(v.name));
}

let _fontCss = null;
/** Builds @font-face rules with base64 data URIs from cfg.localFonts. */
export function buildFontCss(cfg) {
  if (_fontCss) return _fontCss;
  _fontCss = cfg.localFonts.map((f) => {
    const file = path.resolve(cfg.__dir, f.src);
    const b64 = fs.readFileSync(file).toString('base64');
    const fmt = file.endsWith('.woff2') ? 'woff2' : file.endsWith('.woff') ? 'woff' : 'truetype';
    return `@font-face{font-family:'${f.family}';font-style:${f.style || 'normal'};font-weight:${f.weight || '400'};` +
      `font-display:block;src:url(data:font/${fmt};base64,${b64}) format('${fmt}');` +
      (f.unicodeRange ? `unicode-range:${f.unicodeRange};` : '') + '}';
  }).join('\n');
  return _fontCss;
}

const FREEZE_CSS = `
*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;
transition-duration:0s!important;transition-delay:0s!important;caret-color:transparent!important;
scroll-behavior:auto!important}
html{scrollbar-width:none}::-webkit-scrollbar{display:none}`;

/** Init script that freezes Date to a fixed instant (still ticking from there). */
function dateFreezeScript(iso) {
  return `(() => {
    const fixed = new Date(${JSON.stringify(iso)}).getTime();
    const start = Date.now();
    const _Date = Date;
    class FDate extends _Date {
      constructor(...a) { if (a.length === 0) super(fixed); else super(...a); }
      static now() { return fixed; }
    }
    FDate.UTC = _Date.UTC; FDate.parse = _Date.parse;
    window.Date = FDate;
    Math.random = (() => { let s = 42; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  })();`;
}

/**
 * Open a page on a target and bring it to a deterministic state.
 * Returns { page, warnings }.
 */
export async function preparePage(browser, cfg, pageDef, target, viewport) {
  const ctx = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.deviceScaleFactor || 1,
    locale: cfg.locale || 'fr-FR',
    timezoneId: cfg.timezone || 'Europe/Paris',
    reducedMotion: 'reduce',
    colorScheme: cfg.colorScheme || 'light',
    ...(cfg[target]?.storageState ? { storageState: path.resolve(cfg.__dir, cfg[target].storageState) } : {}),
  });
  if (cfg.freeze.date) await ctx.addInitScript(dateFreezeScript(cfg.freeze.date));
  const side = pageDef[target] || {};
  const seed = side.localStorage || (cfg[target] && cfg[target].localStorage);
  if (cfg.freeze.clearStorage || seed) {
    await ctx.addInitScript((s) => {
      try {
        if (!sessionStorage.getItem('__fid_init')) {
          localStorage.clear();
          if (s) for (const [k, v] of Object.entries(s)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
          sessionStorage.setItem('__fid_init', '1');
        }
      } catch (e) {}
    }, seed || null);
  }
  if (cfg.localFonts && cfg.localFonts.length) {
    // Polices auto-hébergées : rendu identique hors ligne / en CI, sans dépendre de Google Fonts.
    const css = buildFontCss(cfg);
    await ctx.route(/fonts\.googleapis\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: css }));
    await ctx.route(/fonts\.gstatic\.com/, (r) => r.abort());
    if (target === 'app' && cfg.localFontsOnApp) await ctx.addInitScript((c) => {
      document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = c; document.head.appendChild(st); });
    }, css);
  }
  const page = await ctx.newPage();
  const warnings = [];
  page.on('pageerror', (e) => warnings.push(`JS error: ${e.message}`));
  page.on('dialog', (d) => d.dismiss().catch(() => {}));

  await page.goto(pageUrl(cfg, pageDef, target), { waitUntil: 'load', timeout: 60000 });
  if (cfg.freeze.disableAnimations) await page.addStyleTag({ content: FREEZE_CSS });

  for (const step of [...(cfg[target]?.setup || []), ...(side.setup || [])]) {
    await runStep(page, step);
  }

  // Fonts must be really loaded, otherwise every comparison is meaningless.
  await page.evaluate(() => document.fonts.ready);
  const fontReport = await page.evaluate((expected) => {
    const faces = [...document.fonts];
    return (expected || []).map((fam) => ({
      family: fam,
      loaded: faces.some((f) => f.family.replace(/["']/g, '') === fam && f.status === 'loaded'),
    }));
  }, cfg.fonts || []);
  for (const f of fontReport) if (!f.loaded) warnings.push(`Police non chargée : « ${f.family} » (rendu de repli → comparaison faussée)`);

  if (pageDef.unclip || cfg[target]?.unclip) {
    // Conteneur à défilement interne (ex. application en position:fixed) : on l'isole et on le déplie
    // pour que la capture pleine page contienne tout son contenu, et rien d'autre.
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return;
      let node = el;
      while (node && node !== document.body) {
        for (const sib of node.parentElement.children) if (sib !== node && sib.tagName !== 'SCRIPT' && sib.tagName !== 'STYLE') sib.style.setProperty('display', 'none', 'important');
        node = node.parentElement;
      }
      for (const n of [document.documentElement, document.body]) { n.style.overflow = 'visible'; n.style.height = 'auto'; }
      Object.assign(el.style, { position: 'relative', inset: 'auto', height: 'auto', maxHeight: 'none', overflow: 'visible' });
    }, pageDef.unclip || cfg[target].unclip);
  }

  const hide = [...(cfg.hide || []), ...(pageDef.hide || []), ...(side.hide || [])];
  if (hide.length) await page.addStyleTag({ content: hide.join(',') + '{visibility:hidden!important}' });

  await page.waitForTimeout(side.settle ?? cfg.settle ?? 300);
  return { page, ctx, warnings };
}

export async function runStep(page, step) {
  if (step.eval) await page.evaluate(step.eval);
  else if (step.click) await page.click(step.click);
  else if (step.hover) await page.hover(step.hover);
  else if (step.fill) await page.fill(step.fill, step.value ?? '');
  else if (step.press) await page.keyboard.press(step.press);
  else if (step.waitFor) await page.waitForSelector(step.waitFor, { state: step.state || 'visible', timeout: 15000 });
  else if (step.wait) await page.waitForTimeout(step.wait);
  else if (step.scroll) await page.evaluate((s) => document.querySelector(s)?.scrollIntoView(), step.scroll);
  else throw new Error('Étape inconnue : ' + JSON.stringify(step));
}

/** Bring an element into a given interaction state. */
export async function applyState(page, selector, state) {
  const loc = page.locator(selector).first();
  if (state === 'hover') { await loc.hover({ force: true }); }
  else if (state === 'focus') {
    await page.keyboard.press('Shift'); // keyboard modality → :focus-visible matches
    await loc.focus();
  } else if (state === 'active') {
    const box = await loc.boundingBox();
    if (box) { await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); }
  }
  await page.waitForTimeout(60);
}

export async function resetState(page) {
  await page.mouse.up().catch(() => {});
  await page.mouse.move(0, 0);
  await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
  await page.waitForTimeout(30);
}

/** Selector of a component on a target. Falls back to [data-fid="<id>"] on the app side. */
export function compSelector(comp, target) {
  if (typeof comp[target] === 'string') return comp[target];
  if (target === 'app') return `[data-fid="${comp.id}"]`;
  throw new Error(`Composant « ${comp.id} » : sélecteur ${target} manquant`);
}

export function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); return d; }
export const shotName = (pageId, vp, comp, state) =>
  `${pageId}${comp ? '__' + comp : ''}${state && state !== 'default' ? '--' + state : ''}@${vp}.png`;
