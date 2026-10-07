#!/usr/bin/env node
// Compare les styles CALCULÉS de chaque composant entre la maquette et l'application,
// propriété par propriété et état par état. Donne une liste de corrections exactes.
// Usage : node compare-styles.mjs [--config …] [--page id] [--viewport name] [--reuse]
//   --reuse : n'extrait pas de nouveau, relit .fidelity/styles/{mockup,app}/*.json
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, loadConfig, selectPages, selectViewports } from './lib.mjs';
import { extract } from './extract-styles.mjs';

const args = parseArgs();
const cfg = loadConfig(args.config);
const pages = selectPages(cfg, args);
const vps = selectViewports(cfg, args);
const tol = cfg.thresholds.pxTolerance;
const ignore = new Set(cfg.ignoreProps || ['cursor']);

if (!args.reuse) {
  for (const target of ['mockup', 'app']) await extract(cfg, { target, pages, vps, quiet: true });
}

// --- normalisation -----------------------------------------------------------
function normFont(v) {
  // next/font renomme les familles (« __Archivo_3f2a1c », « __Archivo_Fallback_3f2a1c »).
  return v.split(',').map((f) => f.trim().replace(/["']/g, ''))
    .filter((f) => !/_Fallback_/i.test(f))
    .map((f) => f.replace(/^__(.+?)_[0-9a-f]{5,}$/i, '$1'))[0]?.toLowerCase() || '';
}
function normColor(v) {
  return v.replace(/rgba\((\d+), (\d+), (\d+), 1\)/g, 'rgb($1, $2, $3)');
}
const numRe = /-?\d*\.?\d+px/g;
function sameValue(prop, a, b) {
  if (a === b) return true;
  if (prop === 'font-family') return normFont(a) === normFont(b);
  a = normColor(a); b = normColor(b);
  if (a === b) return true;
  // Tolérance numérique sur toutes les longueurs en px d'une même valeur (ex. box-shadow, padding).
  const na = a.match(numRe), nb = b.match(numRe);
  if (na && nb && na.length === nb.length && a.replace(numRe, '#') === b.replace(numRe, '#')) {
    return na.every((x, i) => Math.abs(parseFloat(x) - parseFloat(nb[i])) <= tol);
  }
  return false;
}
const LAYOUT = new Set(['width', 'height', 'min-height', 'max-width']);

// --- diff --------------------------------------------------------------------
const rows = [];
let checked = 0;
for (const pageDef of pages) for (const vp of vps) {
  const load = (t) => {
    const f = path.join(cfg.outDir, 'styles', t, `${pageDef.id}@${vp.name}.json`);
    return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
  };
  const M = load('mockup'), A = load('app');
  if (!M || !A) { rows.push({ where: `${pageDef.id}@${vp.name}`, prop: '—', mockup: M ? 'ok' : 'absent', app: A ? 'ok' : 'absent', kind: 'missing' }); continue; }
  for (const [cid, mc] of Object.entries(M.components)) {
    const ac = A.components[cid];
    if (!mc.found) continue;
    if (!ac || !ac.found) { rows.push({ where: `${pageDef.id}@${vp.name} · ${cid}`, prop: 'élément', mockup: mc.selector, app: `introuvable (${ac?.selector || '[data-fid]'})`, kind: 'missing' }); continue; }
    for (const [state, ms] of Object.entries(mc.states)) {
      const as = ac.states[state]; if (!as) continue;
      const pairs = [['', ms.self, as.self], ...Object.keys(ms.parts || {}).map((k) => [` › ${k}`, ms.parts[k], as.parts?.[k]])];
      for (const [suffix, m, a] of pairs) {
        const where = `${pageDef.id}@${vp.name} · ${cid}${suffix}${state !== 'default' ? ' :' + state : ''}`;
        if (!m) continue;
        if (!a) { rows.push({ where, prop: 'élément', mockup: 'présent', app: 'introuvable', kind: 'missing' }); continue; }
        for (const [prop, mv] of Object.entries(m.styles)) {
          if (ignore.has(prop)) continue;
          checked++;
          const av = a.styles[prop];
          if (!sameValue(prop, mv, av)) rows.push({ where, prop, mockup: mv, app: av, kind: LAYOUT.has(prop) ? 'layout' : 'style' });
        }
        for (const pseudo of ['::before', '::after']) {
          if (!!m[pseudo] !== !!a[pseudo]) rows.push({ where, prop: pseudo, mockup: m[pseudo]?.content || 'aucun', app: a[pseudo]?.content || 'aucun', kind: 'style' });
        }
      }
    }
  }
}

const styleDiffs = rows.filter((r) => r.kind !== 'layout');
const layoutDiffs = rows.filter((r) => r.kind === 'layout');
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|');
let md = `# Rapport de fidélité des styles calculés\n\n${checked} propriétés comparées · ${styleDiffs.length} écart(s) de style · ${layoutDiffs.length} écart(s) de dimension.\n\n`;
md += `Corriger d'abord les écarts de **style** (typo, couleurs, espacements, bordures) : les écarts de **dimension** en découlent souvent.\n\n`;
const table = (list) => `| Où | Propriété | Maquette (cible) | Application (actuel) |\n|---|---|---|---|\n` +
  list.map((r) => `| ${esc(r.where)} | \`${r.prop}\` | \`${esc(r.mockup)}\` | \`${esc(r.app)}\` |`).join('\n') + '\n\n';
if (styleDiffs.length) md += `## Écarts de style\n\n` + table(styleDiffs);
if (layoutDiffs.length) md += `## Écarts de dimension\n\n` + table(layoutDiffs);
if (!rows.length) md += `✅ Aucun écart : les styles calculés sont identiques (tolérance ${tol}px).\n`;
fs.writeFileSync(path.join(cfg.outDir, 'report-styles.md'), md);
fs.writeFileSync(path.join(cfg.outDir, 'report-styles.json'), JSON.stringify(rows, null, 2));
console.log(md);
process.exit(rows.length ? 1 : 0);
