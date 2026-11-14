import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { catalog, descriptions, toolPath, toolFromPath } from '../public/catalog.mjs';
const read = path => readFile(new URL('../public/' + path, import.meta.url), 'utf8');
test('every calculator has unique initial metadata, useful content, and crawlable links', async () => {
  const titles = new Set();
  for (const tool of catalog) {
    const html = await read(toolPath(tool.id).slice(1) + 'index.html');
    assert.ok(!html.includes('{{'));
    const title = html.match(/<title>(.*?)<\/title>/)[1];
    assert.ok(!titles.has(title)); titles.add(title);
    assert.ok(html.includes(`<link rel="canonical" href="https://dogudl.com${toolPath(tool.id)}">`));
    assert.ok(html.includes(`<meta property="og:url" content="https://dogudl.com${toolPath(tool.id)}">`));
    assert.ok(html.includes(descriptions[tool.id]));
    assert.ok(html.includes(`tabindex="-1">${tool.name}</h2>`));
    for (const other of catalog.filter(item => item !== tool)) assert.ok(html.includes(`href="${toolPath(other.id)}" data-open="${other.id}"`));
    assert.ok(!html.includes('href="./assets/'));
    assert.ok(!html.includes('src="./app.js'));
    if (tool.id !== 'basic') {
      assert.ok(html.includes('<div id="basic-view" hidden>'));
      assert.ok(html.includes('<form id="special-view"><div class="form-fields">'));
    }
    assert.equal(toolFromPath(toolPath(tool.id)), tool);
    assert.equal(toolFromPath(toolPath(tool.id).replace(/\/$/, '') || '/'), tool);
  }
  assert.equal(toolFromPath('/not-a-tool/'), undefined);
});
test('sitemap covers only canonical pages, robots exposes it, and unknown paths have a 404', async () => {
  const sitemap = await read('sitemap.xml');
  assert.equal((sitemap.match(/<loc>/g) || []).length, catalog.length);
  for (const tool of catalog) assert.ok(sitemap.includes(`<loc>https://dogudl.com${toolPath(tool.id)}</loc>`));
  assert.ok(!sitemap.includes('#'));
  assert.ok((await read('robots.txt')).includes('Sitemap: https://dogudl.com/sitemap.xml'));
  assert.ok((await read('404.html')).includes('content="noindex"'));
});
