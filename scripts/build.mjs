import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { catalog, descriptions, siteOrigin, toolPath } from '../public/catalog.mjs';
import { formFields } from '../public/form-fields.mjs';
const root = new URL('../', import.meta.url);
const template = await readFile(new URL('templates/page.html', root), 'utf8');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
for (const tool of catalog) {
  const basic = tool.id === 'basic';
  const title = basic ? '생활 계산기 · 도구들' : `${tool.name} · 도구들`;
  const description = descriptions[tool.id];
  const url = siteOrigin + toolPath(tool.id);
  let form = basic ? '' : `<div class="form-fields">${formFields(tool.id)}<button class="primary" type="submit">계산하기</button></div><div id="form-result" class="form-result" aria-live="polite" hidden></div>`;
  // Runtime fills local dates; never publish a stale build date as the default.
  if (tool.id === 'dates') form = form.replace(/value="\d{4}-\d{2}-\d{2}"/g, 'value=""');
  let html = template
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escape(description)}">\n  <link rel="canonical" href="${url}">\n  <meta property="og:type" content="website">\n  <meta property="og:title" content="${title}">\n  <meta property="og:description" content="${escape(description)}">\n  <meta property="og:url" content="${url}">`)
    .replace('id="hero-title">생활 계산기', `id="hero-title">${basic ? '생활 계산기' : tool.name}`)
    .replace('tabindex="-1">기본 계산기', `tabindex="-1">${tool.name}`)
    .replace('id="active-icon" class="tool-icon blue"', `id="active-icon" class="tool-icon ${tool.color}"`)
    .replace('/assets/icons.svg#calculator', `/assets/icons.svg#${tool.icon}`)
    .replaceAll('{{BASIC_HIDDEN}}', basic ? '' : ' hidden')
    .replace('{{FORM_HIDDEN}}', basic ? ' hidden' : '')
    .replace('{{DETAIL}}', escape(tool.detail))
    .replace('{{DESCRIPTION}}', escape(description))
    .replace('{{FORM}}', form)
    .replace('{{LINKS}}', catalog.filter(item => item !== tool).map(item => `<a class="tool-row" href="${toolPath(item.id)}" data-open="${item.id}"><span class="tool-icon ${item.color}"><svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#${item.icon}"/></svg></span><span class="tool-info"><span class="tool-name">${item.name}</span><span class="tool-detail">${item.detail}</span></span></a>`).join(''));
  if (tool.id === 'salary') html = html.replace('</form>', template.match(/<template id="salary-basis">([\s\S]*?)<\/template>/)[1] + '</form>');
  const dir = new URL('public' + toolPath(tool.id), root);
  await mkdir(dir, { recursive: true });
  await writeFile(new URL('index.html', dir), html);
}
await writeFile(new URL('public/sitemap.xml', root), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${catalog.map(tool => `  <url><loc>${siteOrigin}${toolPath(tool.id)}</loc></url>`).join('\n')}\n</urlset>\n`);
await writeFile(new URL('public/robots.txt', root), `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`);
// A top-level 404 disables Cloudflare Pages' implicit SPA fallback for unknown URLs.
await writeFile(new URL('public/404.html', root), `<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>페이지를 찾을 수 없습니다 · 도구들</title><link rel="stylesheet" href="/styles.css"></head><body><main class="container"><h1>페이지를 찾을 수 없습니다</h1><p>주소를 확인하거나 <a href="/">생활 계산기 홈</a>에서 계산기를 선택하세요.</p></main></body></html>\n`);
console.log(`Built ${catalog.length} pages in ${fileURLToPath(new URL('public/', root))}`);
