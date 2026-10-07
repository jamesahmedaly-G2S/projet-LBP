#!/usr/bin/env node
// Comparaison pixel à pixel des captures maquette vs application.
// Usage : node compare.mjs [--config fidelity.config.json] [--filter texte]
// Produit .fidelity/diff/*.png et .fidelity/report-pixels.{md,json}. Code retour 1 si un seuil est dépassé.
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { parseArgs, loadConfig, ensureDir } from './lib.mjs';

const args = parseArgs();
const cfg = loadConfig(args.config);
const mDir = path.join(cfg.outDir, 'shots', 'mockup');
const aDir = path.join(cfg.outDir, 'shots', 'app');
const dDir = ensureDir(path.join(cfg.outDir, 'diff'));
const T = cfg.thresholds;

if (!fs.existsSync(mDir)) { console.error('✖ Aucune capture maquette. Lancez : node capture.mjs --target mockup'); process.exit(2); }

const read = (f) => PNG.sync.read(fs.readFileSync(f));
/** Pads an image to w×h with magenta so size differences show up in the diff. */
function pad(img, w, h) {
  if (img.width === w && img.height === h) return img;
  const out = new PNG({ width: w, height: h });
  for (let i = 0; i < out.data.length; i += 4) { out.data[i] = 255; out.data[i + 1] = 0; out.data[i + 2] = 255; out.data[i + 3] = 255; }
  PNG.bitblt(img, out, 0, 0, Math.min(img.width, w), Math.min(img.height, h), 0, 0);
  return out;
}

/** Finds the bounding boxes of differing rows/columns bands to tell the agent WHERE to look. */
function hotspots(diff, w, h, cell = 40) {
  const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell);
  const grid = new Array(cols * rows).fill(0);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (diff.data[i] === 255 && diff.data[i + 1] === 0 && diff.data[i + 2] === 0) grid[Math.floor(y / cell) * cols + Math.floor(x / cell)]++;
  }
  return grid.map((n, i) => ({ n, x: (i % cols) * cell, y: Math.floor(i / cols) * cell }))
    .filter((c) => c.n > cell * cell * 0.05).sort((a, b) => b.n - a.n).slice(0, 5)
    .map((c) => `(${c.x},${c.y})→(${c.x + cell},${c.y + cell})`);
}

const files = fs.readdirSync(mDir).filter((f) => f.endsWith('.png') && (!args.filter || f.includes(args.filter)));
const results = [];
for (const f of files) {
  const isComponent = f.includes('__');
  const limit = isComponent ? T.componentMaxDiffRatio : T.pageMaxDiffRatio;
  const appFile = path.join(aDir, f);
  if (!fs.existsSync(appFile)) { results.push({ file: f, status: 'missing', limit }); continue; }
  const a = read(path.join(mDir, f)), b = read(appFile);
  const w = Math.max(a.width, b.width), h = Math.max(a.height, b.height);
  const A = pad(a, w, h), B = pad(b, w, h);
  const diff = new PNG({ width: w, height: h });
  const n = pixelmatch(A.data, B.data, diff.data, w, h, {
    threshold: T.pixel, includeAA: false, alpha: 0.2, diffColor: [255, 0, 0], diffColorAlt: [0, 160, 255],
  });
  const ratio = n / (w * h);
  const sizeDelta = (a.width !== b.width || a.height !== b.height)
    ? { mockup: `${a.width}×${a.height}`, app: `${b.width}×${b.height}` } : null;
  const ok = ratio <= limit && !sizeDelta;
  if (!ok) fs.writeFileSync(path.join(dDir, f), PNG.sync.write(diff));
  else if (fs.existsSync(path.join(dDir, f))) fs.unlinkSync(path.join(dDir, f));
  results.push({ file: f, status: ok ? 'pass' : 'fail', ratio, limit, diffPixels: n, sizeDelta, hotspots: ok ? [] : hotspots(diff, w, h) });
}

results.sort((x, y) => (y.ratio ?? 1) - (x.ratio ?? 1));
const fails = results.filter((r) => r.status !== 'pass');
const pct = (r) => (r == null ? '—' : (r * 100).toFixed(3) + ' %');
let md = `# Rapport de fidélité visuelle (pixels)\n\n${results.length - fails.length}/${results.length} captures conformes.\n\n`;
md += `Seuils : page ≤ ${pct(T.pageMaxDiffRatio)}, composant ≤ ${pct(T.componentMaxDiffRatio)}, tolérance par pixel ${T.pixel}.\n\n`;
md += `| Statut | Capture | Écart | Seuil | Taille | Zones à examiner |\n|---|---|---|---|---|---|\n`;
for (const r of results) {
  const icon = r.status === 'pass' ? '✅' : r.status === 'missing' ? '⛔ manquante' : '❌';
  md += `| ${icon} | \`${r.file}\` | ${pct(r.ratio)} | ${pct(r.limit)} | ${r.sizeDelta ? `maquette ${r.sizeDelta.mockup} / app ${r.sizeDelta.app}` : 'identique'} | ${(r.hotspots || []).join(' ')} |\n`;
}
md += `\nImages de différence (rouge = écart, magenta = zone hors de l'une des deux images) : \`${path.relative(process.cwd(), dDir)}/\`\n`;
fs.writeFileSync(path.join(cfg.outDir, 'report-pixels.md'), md);
fs.writeFileSync(path.join(cfg.outDir, 'report-pixels.json'), JSON.stringify(results, null, 2));
console.log(md);
process.exit(fails.length ? 1 : 0);
