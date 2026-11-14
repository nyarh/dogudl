import { Calculator, calculate, format, salaryPeriods } from './calculations.mjs?v=housing-cost';
import { formFields, unitFields } from './form-fields.mjs?v=housing-cost';
import { renderLoanResult } from './loan-view.js?v=housing-cost';

import { catalog, descriptions, siteOrigin, toolPath, toolFromPath } from './catalog.mjs?v=housing-cost';

const $ = selector => document.querySelector(selector);
const icon = name => `<svg class="icon" aria-hidden="true"><use href="/assets/icons.svg?v=2026-11-rent#${name}"/></svg>`;
const toolIcon = tool => `<span class="tool-icon ${tool.color}">${icon(tool.icon)}</span>`;
const dialog = $('#tool-dialog');
const form = $('#special-view');
const calculator = new Calculator();
let active = catalog[0];
let renderedToolId = null;
let recent = [];
let dialogMode = '';

function readFavorites() {
  try {
    const ids = JSON.parse(localStorage.getItem('dogudl.favorites') || '[]');
    return new Set(Array.isArray(ids) ? ids.filter(id => catalog.some(tool => tool.id === id)) : []);
  } catch { return new Set(); }
}
let favorites = readFavorites();
function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  try { localStorage.setItem('dogudl.favorites', JSON.stringify([...favorites])); } catch { /* Session-only when storage is unavailable. */ }
}
function toolRow(tool) {
  return `<a class="tool-row" href="${toolPath(tool.id)}" data-open="${tool.id}">${toolIcon(tool)}<span class="tool-info"><span class="tool-name">${tool.name}</span><span class="tool-detail">${tool.detail}</span></span><svg class="icon row-arrow" aria-hidden="true"><use href="/assets/icons.svg#arrow"/></svg></a>`;
}
function refreshCalculator() {
  $('#expression').textContent = calculator.error || calculator.expression;
  $('#value').textContent = calculator.display;
  $('#value').classList.toggle('long', calculator.display.length > 13);
}
function enterKey(key) {
  const record = calculator.press(key);
  if (record) recent = [record, ...recent].slice(0,30);
  refreshCalculator();
}

function updateRentFields() {
  const { direction, jeonse, monthly, deposit } = form.elements;
  const toMonthly = direction.value === 'toMonthly';
  jeonse.disabled = !toMonthly;
  jeonse.labels[0].hidden = !toMonthly;
  monthly.disabled = toMonthly;
  monthly.labels[0].hidden = toMonthly;
  deposit.labels[0].querySelector('span').textContent = toMonthly ? '월세로 바꾼 뒤 남길 보증금 (만원)' : '현재 월세 보증금 (만원)';
}
function updateSalaryBasis() {
  const selected = form.elements.period.value;
  const period = salaryPeriods[selected];
  const hint = $('#salary-assumption');
  hint.textContent = period.employmentAssumption || '';
  hint.hidden = !period.employmentAssumption;
  for (const node of form.querySelectorAll('[data-salary-period]')) {
    node.hidden = node.dataset.salaryPeriod !== selected;
  }
  $('#salary-pension-rate').textContent = (period.pensionBps / 100).toFixed(2) + '%';
  $('#salary-care-rate').textContent = (period.careBps / 100).toFixed(2) + '%';
}
function showHousingComparison(box, { jeonse, rental, breakEven, equalAtAllRates }) {
  const rows = [
    ['필요 대출금', 'loan'], ['월 대출이자', 'interest'], ['월세', 'rent'],
    ['월 관리비', 'fee'], ['월 비용 합계', 'monthly'], ['계약기간 총비용', 'total']
  ];
  const body = rows.map(([label, key]) => `<tr><th scope="row">${label}</th>
    <td>${format(jeonse[key])}원</td><td>${format(rental[key])}원</td></tr>`).join('');
  let threshold;
  if (equalAtAllRates) threshold = '모든 금리에서 두 매물의 비용이 같습니다.';
  else if (breakEven === null) threshold = '0% 이상에서 두 매물의 비용이 같아지는 금리는 없습니다.';
  else {
    const cheaperAbove = jeonse.loan > rental.loan ? '월세' : '전세';
    const displayRate = Number(breakEven.toPrecision(5));
    threshold = `연 ${displayRate === breakEven ? '' : '약 '}${format(displayRate)}% · 이보다 높으면 ${cheaperAbove}가 저렴합니다.`;
  }
  box.insertAdjacentHTML('beforeend', `<table class="housing-table"><caption>매물별 비용 내역</caption>
    <thead><tr><th scope="col">항목</th><th scope="col">전세</th><th scope="col">월세</th></tr></thead>
    <tbody>${body}</tbody></table><p class="housing-threshold"><strong>손익분기 대출금리</strong> ${threshold}</p>`);
}
function renderResult() {
  const box = $('#form-result');
  try {
    const result = calculate(active.id,Object.fromEntries(new FormData(form)));
    box.replaceChildren();
    if (active.id === 'rent') {
      const nextInput = form.elements.direction.value === 'toMonthly' ? form.elements.monthly : form.elements.jeonse;
      nextInput.value = String(result.amount / 10000);
    }
    if (result.plans) {
      renderLoanResult(box, result.plans);
      box.hidden = false;
      return;
    }
    for (const [tag,value] of [['small',result.label],['b',result.value],['p',result.detail]]) {
      const node = document.createElement(tag);
      node.textContent = value;
      box.append(node);
    }
    if (result.note) {
      const note = document.createElement('p');
      note.textContent = result.note;
      box.append(note);
    }
    if (result.comparison) showHousingComparison(box, result.comparison);
    if (result.breakdown) {
      const list = document.createElement('dl');
      list.className = 'deductions';
      list.setAttribute('aria-label', '월 공제 내역');
      for (const [label, value] of result.breakdown) {
        const term = document.createElement('dt');
        const amount = document.createElement('dd');
        term.textContent = label;
        amount.textContent = value;
        list.append(term, amount);
      }
      box.append(list);
    }
  } catch (error) {
    const message = document.createElement('p');
    message.className = 'form-error';
    message.textContent = error.message;
    box.replaceChildren(message);
  }
  box.hidden = false;
}
function showTool() {
  const legacy = catalog.find(tool => '#' + tool.id === location.hash);
  if (legacy) history.replaceState(null, '', toolPath(legacy.id) + location.search);
  active = toolFromPath(location.pathname) || catalog[0];
  $('#hero-title').textContent = active.id === 'basic' ? '생활 계산기' : active.name;
  $('#hero-description').textContent = active.detail;
  $('#tool-description').textContent = descriptions[active.id];
  const title = active.id === 'basic' ? '생활 계산기 · 도구들' : active.name + ' · 도구들';
  const canonical = siteOrigin + toolPath(active.id);
  document.title = title;
  $('meta[name="description"]').content = descriptions[active.id];
  $('link[rel="canonical"]').href = canonical;
  $('meta[property="og:title"]').content = title;
  $('meta[property="og:description"]').content = descriptions[active.id];
  $('meta[property="og:url"]').content = canonical;
  // Anchor-only navigation and repeated clicks must not discard form inputs.
  if (renderedToolId === active.id) return;
  renderedToolId = active.id;
  const basic = active.id === 'basic';
  $('#tool-title').textContent = active.name;
  $('#active-icon').className = 'tool-icon ' + active.color;
  $('#active-icon').innerHTML = icon(active.icon);
  $('#history-trigger').hidden = !basic;
  $('#basic-view').hidden = !basic;
  form.hidden = basic;
  $('#tool-list').innerHTML = catalog.filter(tool => tool !== active).map(toolRow).join('');
  $('#other-count').textContent = (catalog.length - 1) + '개';
  if (!basic) {
    form.innerHTML = '<div class="form-fields">' + formFields(active.id) + '<button class="primary" type="submit">계산하기</button></div><div id="form-result" class="form-result" aria-live="polite" hidden></div>';
    if (active.id === 'rent') {
      updateRentFields();
      renderResult();
    }
    if (active.id === 'loan') {
      form.querySelector('button[type="submit"]').textContent = '상환 방식 비교하기';
      $('#form-result').classList.add('loan-result');
      renderResult();
    }
    if (active.id === 'salary') {
      form.append($('#salary-basis').content.cloneNode(true));
      updateSalaryBasis();
      renderResult();
    }
    if (active.id === 'housing-cost') renderResult();
  } else refreshCalculator();
}
form.addEventListener('input', () => { $('#form-result').hidden = true; });
form.addEventListener('change', event => {
  if (event.target.name === 'period') {
    updateSalaryBasis();
    if (form.checkValidity()) renderResult();
  }
  if (event.target.name === 'direction') {
    updateRentFields();
    if (form.checkValidity()) renderResult();
  }
  if (event.target.name === 'category') $('#unit-fields').innerHTML = unitFields(event.target.value);
  if (event.target.name === 'mode') form.elements.part.labels[0].querySelector('span').textContent = event.target.value === 'portion' ? '비율 (%)' : '비교값';
});
form.addEventListener('submit', event => { event.preventDefault(); renderResult(); });

function dialogRows(tools) {
  return tools.map(tool => {
    const saved = favorites.has(tool.id);
    return `<div class="dialog-row">${toolRow(tool)}<button class="icon-button ${saved ? 'saved' : ''}" data-save="${tool.id}" aria-label="${tool.name} 즐겨찾기" aria-pressed="${saved}">${icon('star')}</button></div>`;
  }).join('');
}
function filterRows() {
  const query = ($('#query')?.value || '').trim().replace(/\s+/g,'').toLowerCase();
  const tools = catalog.filter(tool => (tool.name + tool.detail).replace(/\s+/g,'').toLowerCase().includes(query) && (dialogMode !== 'favorites' || favorites.has(tool.id)));
  $('#matches').innerHTML = dialogRows(tools) || (dialogMode === 'favorites' ? '<p class="empty">아직 저장한 계산기가 없어요. 도구 검색에서 별을 눌러 추가하세요.</p><button class="primary discover">도구 검색</button>' : '<p class="empty">검색 결과가 없어요. 다른 이름으로 검색해 보세요.</p>');
}
function openDialog(mode) {
  dialogMode = mode;
  $('#dialog-title').textContent = { search:'도구 검색',favorites:'즐겨찾기',history:'계산 기록' }[mode];
  const content = $('#dialog-content');
  if (mode === 'history') {
    content.replaceChildren();
    if (recent.length) {
      const list = document.createElement('ol');
      list.className = 'history-list';
      for (const item of recent) {
        const li = document.createElement('li');
        const expr = document.createElement('small');
        expr.textContent = item.expression;
        const result = document.createElement('strong');
        result.textContent = item.result;
        li.append(expr, result);
        list.append(li);
      }
      content.append(list);
      const clear = document.createElement('button');
      clear.className = 'quiet-button';
      clear.textContent = '기록 모두 지우기';
      clear.addEventListener('click', () => { recent = []; openDialog('history'); });
      content.append(clear);
    } else content.innerHTML = '<p class="empty">아직 계산 기록이 없어요. 기본 계산기에서 등호를 누르면 여기에 표시돼요.</p>';
  } else {
    content.innerHTML = (mode === 'search' ? '<input type="search" id="query" class="dialog-search" aria-label="도구 검색" placeholder="계산기 이름 또는 기능 검색">' : '') + '<div id="matches"></div>';
    $('#query')?.addEventListener('input',filterRows);
    filterRows();
  }
  if (!dialog.open) dialog.showModal();
  if (mode === 'search') $('#query').focus();
}
$('#nav-favorites').addEventListener('click', () => openDialog('favorites'));
$('#history-trigger').addEventListener('click', () => openDialog('history'));
$('#search-trigger').addEventListener('click', () => openDialog('search'));
$('#dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const box = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  const save = event.target.closest('[data-save]');
  if (save) {
    toggleFavorite(save.dataset.save);
    filterRows();
    const focus = dialog.querySelector('[data-save="' + save.dataset.save + '"]') || dialog.querySelector('.discover') || $('#dialog-close');
    focus.focus();
  }
  if (event.target.closest('.discover')) openDialog('search');
});
document.addEventListener('click', event => {
  const link = event.target.closest('[data-open]');
  if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (dialog.open) dialog.close();
  if (location.pathname !== link.pathname || location.hash) history.pushState(null, '', link.pathname);
  showTool();
  $('#tool-title').focus({preventScroll:true});
  $('#workspace').scrollIntoView({block:'nearest'});
});
$('#keypad').addEventListener('click', event => {
  const button = event.target.closest('[data-key]');
  if (button) enterKey(button.dataset.key);
});
document.addEventListener('keydown', event => {
  if (event.altKey && !event.ctrlKey && !event.metaKey && event.code === 'KeyK' && !dialog.open) {
    event.preventDefault();
    openDialog('search');
    return;
  }
  if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey || dialog.open || event.target.closest('input, select, textarea, [contenteditable="true"]')) return;
  if (active.id !== 'basic') return;
  if (event.key === 'Enter' && event.target.closest('button, a')) return;
  const key = ({Enter:'=',Escape:'clear',Delete:'clear',Backspace:'back'})[event.key] || event.key;
  if (!/^[\d.+*/=%-]$/.test(key) && !['clear','back'].includes(key)) return;
  event.preventDefault();
  enterKey(key);
});
window.addEventListener('hashchange',showTool);
window.addEventListener('popstate', () => { if (dialog.open) dialog.close(); showTool(); });
window.addEventListener('storage', event => {
  if (event.key !== 'dogudl.favorites') return;
  favorites = readFavorites();
  if (dialog.open && dialogMode !== 'history') filterRows();
});
showTool();
