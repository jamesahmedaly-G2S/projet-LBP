#!/usr/bin/env node
// Inventaire d'une maquette HTML : vues, classes les plus utilisées (= composants candidats),
// tokens réellement rendus et variables :root résolues. Sert à écrire fidelity.config.json.
// Usage : node inventory.mjs --file maquette.html [--width 1240] [--setup "goView('biblio')"] [--out .fidelity]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { parseArgs, ensureDir } from './lib.mjs';
import { harvestTokens } from './extract-styles.mjs';

const args = parseArgs();
if (!args.file && !args.url) { console.error('Usage : node inventory.mjs --file maquette.html [--setup "js"]'); process.exit(2); }
const url = args.url || pathToFileURL(path.resolve(args.file)).href;
const out = ensureDir(path.resolve(args.out || '.fidelity'));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +(args.width || 1240), height: 900 } });
page.on('dialog', (d) => d.dismiss().catch(() => {}));
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
if (args.setup) await page.evaluate(String(args.setup));
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);

const inv = await page.evaluate(() => {
  const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden'; };
  // Vues / écrans : éléments à id qui ressemblent à des pages (sections, .view, [role=main] enfants…)
  const views = [...document.querySelectorAll('[id]')]
    .filter((el) => /^(v-|view|page|screen|tab-)/i.test(el.id) || el.classList.contains('view') || el.tagName === 'SECTION')
    .map((el) => ({ id: el.id, classes: el.className && String(el.className), visible: visible(el) }));
  // Classes les plus utilisées parmi les éléments visibles = composants candidats
  const counts = {};
  const sample = {};
  for (const el of document.body.querySelectorAll('[class]')) {
    if (!visible(el)) continue;
    for (const c of el.classList) {
      counts[c] = (counts[c] || 0) + 1;
      if (!sample[c]) {
        const cs = getComputedStyle(el);
        sample[c] = { tag: el.tagName.toLowerCase(), font: `${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily.split(',')[0]}`, color: cs.color, bg: cs.backgroundColor, radius: cs.borderRadius, padding: cs.padding, text: (el.innerText || '').trim().slice(0, 40) };
      }
    }
  }
  const classes = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 80).map(([c, n]) => ({ class: c, count: n, ...sample[c] }));
  const fonts = [...document.fonts].map((f) => `${f.family.replace(/["']/g, '')} ${f.weight} ${f.style} — ${f.status}`);
  return { views, classes, fonts };
});
const tokens = await page.evaluate(harvestTokens);
await browser.close();

const top = (m, n = 12) => Object.entries(m).slice(0, n).map(([k, v]) => `\`${k}\` ×${v}`).join(' · ') || '—';
const GENERIC = /^(serif|sans-serif|monospace|system-ui|cursive|fantasy|ui-\w+|-apple-system|BlinkMacSystemFont|inherit)$/i;
const declared = new Set(inv.fonts.map((f) => f.split(' ')[0].toLowerCase()));
const usedFamilies = [...new Set(Object.keys(tokens.used.fontFamilies).map((f) => f.split(',')[0].replace(/["']/g, '').trim()))];
const missingFaces = usedFamilies.filter((f) => !GENERIC.test(f) && !declared.has(f.split(' ')[0].toLowerCase()));
const notLoaded = [...inv.fonts.filter((f) => !f.endsWith('loaded')), ...missingFaces.map((f) => `${f} — utilisée mais aucune @font-face chargée (réseau bloqué ?)`)];
let md = `# Inventaire de la maquette\n\nSource : ${url}${args.setup ? `\nÉtat : \`${args.setup}\`` : ''}\n\n`;
md += `## Polices déclarées\n\n${inv.fonts.map((f) => `- ${f}`).join('\n') || '- aucune @font-face'}\n\n`;
if (missingFaces.length) md += missingFaces.map((f) => `- ⚠ **${f}** est utilisée dans le CSS mais aucune police n'est chargée\n`).join('') + '\n';

if (notLoaded.length) md += `> ⚠ ${notLoaded.length} police(s) non chargée(s) : le rendu actuel utilise une police de repli. Corrigez l'accès réseau ou auto-hébergez les polices avant toute capture.\n\n`;
md += `## Vues détectées\n\n| id | classes | visible |\n|---|---|---|\n${inv.views.map((v) => `| \`${v.id}\` | ${v.classes || ''} | ${v.visible ? 'oui' : ''} |`).join('\n')}\n\n`;
md += `## Composants candidats (classes visibles les plus fréquentes)\n\n| classe | n | balise | typo | couleur | fond | rayon | padding | exemple |\n|---|---|---|---|---|---|---|---|---|\n`;
md += inv.classes.map((c) => `| \`.${c.class}\` | ${c.count} | ${c.tag} | ${c.font} | ${c.color} | ${c.bg} | ${c.radius} | ${c.padding} | ${(c.text || '').replace(/\|/g, ' ').replace(/\n/g, ' ')} |`).join('\n') + '\n\n';
md += `## Tokens réellement rendus\n\n`;
for (const [k, v] of Object.entries(tokens.used)) md += `- **${k}** : ${top(v)}\n`;
md += `\n## Variables :root résolues (après cascade)\n\n| variable | valeur |\n|---|---|\n${Object.entries(tokens.rootVariables).map(([k, v]) => `| \`${k}\` | \`${v}\` |`).join('\n')}\n`;
fs.writeFileSync(path.join(out, 'inventory.md'), md);
fs.writeFileSync(path.join(out, 'inventory.json'), JSON.stringify({ ...inv, tokens }, null, 2));
console.log(`✓ ${path.relative(process.cwd(), path.join(out, 'inventory.md'))}  (${inv.views.length} vues, ${inv.classes.length} classes, ${Object.keys(tokens.rootVariables).length} variables)`);
if (notLoaded.length) console.warn(`⚠ ${notLoaded.length} police(s) non chargée(s) — voir inventory.md`);
