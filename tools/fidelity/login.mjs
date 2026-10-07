// Session de test locale (compte de démo du seed Supabase local, jamais un compte réel).
import { chromium } from 'playwright';
import fs from 'node:fs';
const base = process.env.FIDELITY_BASE || 'http://localhost:3100';
const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
await p.goto(base + '/login');
await p.fill('input[name=email]', process.env.FIDELITY_USER || 'c.moreau@alpha.fr');
await p.fill('input[name=password]', process.env.FIDELITY_PASSWORD || 'Demo1234!');
await p.click('button[type=submit]');
await p.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 });
fs.mkdirSync('.fidelity', { recursive: true });
await ctx.storageState({ path: '.fidelity/auth.json' });
console.log('✓ connecté →', p.url());
await b.close();
