import { Calculator, calculate, units } from './calculations.mjs?v=2026-11-loan';
import { maxLoanMonths } from './loan.mjs';
import { renderLoanResult } from './loan-view.js';

const catalog = [
  { id: 'basic', name: '기본 계산기', detail: '사칙연산과 백분율을 간편하게', icon: 'calculator', color: 'blue' },
  { id: 'salary', name: '연봉 실수령액 계산기', detail: '세전 연봉으로 월급과 공제 내역 확인', icon: 'wallet', color: 'green' },
  { id: 'loan', name: '대출 이자 계산기', detail: '원리금균등 · 원금균등 · 만기일시상환 비교', icon: 'bank', color: 'cyan' },
  { id: 'percent', name: '퍼센트 계산기', detail: '전체 비율과 증감률 계산', icon: 'percent', color: 'purple' },
  { id: 'discount', name: '할인 계산기', detail: '할인 금액과 최종 가격 확인', icon: 'tag', color: 'coral' },
  { id: 'dates', name: '날짜 계산기', detail: '두 날짜 사이의 일수 계산', icon: 'calendar', color: 'green' },
  { id: 'units', name: '단위 변환기', detail: '길이, 면적, 무게, 부피 변환', icon: 'ruler', color: 'cyan' },
  { id: 'split', name: '더치페이 계산기', detail: '함께 쓴 금액을 원 단위로 정산', icon: 'users', color: 'pink' }
];
const $ = selector => document.querySelector(selector);
const icon = name => `<svg class="icon" aria-hidden="true"><use href="./assets/icons.svg?v=2026-11-loan#${name}"/></svg>`;
const toolIcon = tool => `<span class="tool-icon ${tool.color}">${icon(tool.icon)}</span>`;
const dialog = $('#tool-dialog');
const form = $('#special-view');
const calculator = new Calculator();
let active = catalog[0];
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
  return `<a class="tool-row" href="#${tool.id}" data-open="${tool.id}">${toolIcon(tool)}<span class="tool-info"><span class="tool-name">${tool.name}</span><span class="tool-detail">${tool.detail}</span></span><svg class="icon row-arrow" aria-hidden="true"><use href="./assets/icons.svg#arrow"/></svg></a>`;
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

function field(name, label, value, options = {}) {
  const { type = 'number', min, max, step = 'any' } = options;
  return `<label class="field"><span>${label}</span><input required name="${name}" type="${type}" value="${value}" ${type === 'number' ? 'step="' + step + '"' : ''} ${min !== undefined ? 'min="' + min + '"' : ''} ${max !== undefined ? 'max="' + max + '"' : ''}></label>`;
}
function select(name, label, entries, selected) {
  const options = entries.map(([id,text]) => `<option value="${id}" ${id === selected ? 'selected' : ''}>${text}</option>`).join('');
  return `<label class="field"><span>${label}</span><select name="${name}">${options}</select></label>`;
}
function unitFields(category) {
  const entries = Object.keys(units[category].factors).map(name => [name,name]);
  const defaultPair = { length:['m','cm'], area:['㎡','평'], mass:['kg','g'], volume:['L','mL'] }[category];
  return select('from','입력 단위',entries,defaultPair[0]) + select('to','결과 단위',entries,defaultPair[1]);
}
function localDate(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
}
function formFields(id) {
  if (id === 'loan') {
    return field('principal', '대출금액 (만원)', 3000, {min:0.0001, step:0.0001})
      + '<div class="pair">' + field('rate', '연이율 (%)', 4.5, {min:0})
      + field('months', '대출기간 (개월)', 36, {min:1, max:maxLoanMonths, step:1}) + '</div>'
      + '<p class="loan-note">고정금리로 매월 말에 상환한다고 가정합니다. 수수료와 별도 거치기간은 제외하며, 은행의 일할 계산이나 반올림 방식에 따라 실제 금액은 달라질 수 있습니다.</p>';
  }
  if (id === 'salary') {
    return '<p class="salary-intro">2026년 7~12월 직장인 기준입니다. 퇴직금을 제외한 연봉을 입력하세요.</p>'
      + field('annual', '세전 연봉 (만원)', 4800, {min:0.0001, step:0.0001})
      + field('exempt', '연봉에 포함된 월 비과세액 (만원)', 20, {min:0, step:0.0001})
      + '<p class="field-hint">식대 등 매월 비과세로 받는 금액을 합산하세요. 없으면 0으로 입력하세요.</p>'
      + '<div class="pair salary-family">' + field('family', '공제대상 가족 (본인 포함)', 1, {min:1, step:1})
      + field('children', '그중 8~20세 자녀', 0, {min:0, step:1}) + '</div>';
  }
  if (id === 'percent') return select('mode','계산 방식',[['portion','기준값의 몇 %는 얼마인가요?'],['ratio','비교값은 기준값의 몇 %인가요?'],['change','기준값에서 몇 % 변했나요?']],'portion') + field('base','기준값',10000) + field('part','비율 (%)',15);
  if (id === 'discount') return field('price','원래 가격 (원)',50000,{min:0,step:1}) + field('rate','할인율 (%)',20,{min:0,max:100});
  if (id === 'dates') return field('start','시작일',localDate(0),{type:'date'}) + field('end','종료일',localDate(7),{type:'date'}) + '<label class="check"><input type="checkbox" name="inclusive">시작일을 1일로 포함</label>';
  if (id === 'units') return select('category','단위 종류',Object.entries(units).map(([id,u]) => [id,u.name]),'length') + field('amount','변환할 값',1,{min:0}) + '<div class="pair" id="unit-fields">' + unitFields('length') + '</div>';
  return field('total','함께 쓴 총금액 (원)',35000,{min:0,step:1}) + field('count','인원수 (명)',3,{min:1,step:1});
}
function renderResult() {
  const box = $('#form-result');
  try {
    const result = calculate(active.id,Object.fromEntries(new FormData(form)));
    box.replaceChildren();
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
  active = catalog.find(tool => '#' + tool.id === location.hash) || catalog[0];
  const basic = active.id === 'basic';
  $('#tool-title').textContent = active.name;
  $('#active-icon').className = 'tool-icon ' + active.color;
  $('#active-icon').innerHTML = icon(active.icon);
  $('#history-trigger').hidden = !basic;
  $('#basic-view').hidden = !basic;
  form.hidden = basic;
  $('#tool-list').innerHTML = catalog.filter(tool => tool !== active).map(toolRow).join('');
  $('#other-count').textContent = (catalog.length - 1) + '개';
  document.title = active.name + ' · 도구들';
  if (!basic) {
    form.innerHTML = '<div class="form-fields">' + formFields(active.id) + '<button class="primary" type="submit">계산하기</button></div><div id="form-result" class="form-result" aria-live="polite" hidden></div>';
    if (active.id === 'loan') {
      form.querySelector('button[type="submit"]').textContent = '상환 방식 비교하기';
      $('#form-result').classList.add('loan-result');
      renderResult();
    }
    if (active.id === 'salary') {
      form.append($('#salary-basis').content.cloneNode(true));
      renderResult();
    }
  } else refreshCalculator();
}
form.addEventListener('input', () => { $('#form-result').hidden = true; });
form.addEventListener('change', event => {
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
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (dialog.open) dialog.close();
  if (location.hash !== link.hash) location.hash = link.hash;
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
window.addEventListener('storage', event => {
  if (event.key !== 'dogudl.favorites') return;
  favorites = readFavorites();
  if (dialog.open && dialogMode !== 'history') filterRows();
});
showTool();
