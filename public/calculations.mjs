import { monthlySalary } from './salary.mjs?v=2027-h1';
export { defaultSalaryPeriod, salaryPeriods } from './salary.mjs?v=2027-h1';
import { compareLoans } from './loan.mjs';
import { convertRent } from './rent.mjs';
import { wonFromManwon } from './money.mjs';

const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };
const pretty = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 12 });
export function format(value) {
  return value !== 0 && Math.abs(value) < 1e-10 ? value.toExponential(6).replace(/\.?0+e/, 'e') : pretty.format(value);
}
function compact(value) {
  if (!Number.isFinite(value)) throw new Error('계산 범위를 초과했어요.');
  return Number(value.toPrecision(13));
}
function apply(left, op, right) {
  if (op === '/' && right === 0) throw new Error('0으로 나눌 수 없어요.');
  if (op === '+') return compact(left + right);
  if (op === '-') return compact(left - right);
  if (op === '*') return compact(left * right);
  return compact(left / right);
}
export class Calculator {
  constructor() { this.clear(); }
  clear() {
    this.entry = '0';
    this.left = null;
    this.operator = '';
    this.waiting = false;
    this.finished = false;
    this.expression = '';
    this.error = '';
  }
  get display() {
    if (this.error) return '오류';
    if (this.entry.includes('e')) return this.entry;
    const [whole, fraction] = this.entry.split('.');
    return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (fraction === undefined ? '' : '.' + fraction);
  }
  press(key) {
    if (key === 'clear') { this.clear(); return; }
    if (this.error) this.clear();
    if (/^\d$/.test(key) || key === '.') {
      if (this.finished) this.clear();
      if (this.waiting) { this.waiting = false; this.entry = '0'; }
      if (key === '.') {
        if (!this.entry.includes('.') && !this.entry.includes('e')) this.entry += '.';
      } else if (this.entry.replace(/[-.]/g, '').length < 14) {
        this.entry = this.entry.replace(/^(-?)0$/, '$1') + key;
      }
      return;
    }
    if (key === 'back') {
      if (this.finished) { this.clear(); return; }
      if (!this.waiting) this.entry = this.entry.includes('e') ? '0' : this.entry.slice(0,-1).replace(/^-?$/, '0');
      return;
    }
    if (key === 'sign' || key === '%') {
      if (this.waiting) this.entry = '0';
      this.waiting = false;
      if (this.finished) this.expression = '';
      this.finished = false;
      if (key === 'sign') this.entry = this.entry.startsWith('-') ? this.entry.slice(1) : '-' + this.entry;
      else this.entry = String(compact(Number(this.entry) / 100));
      return;
    }
    if (!(key in symbols) && key !== '=') return;
    try {
      let record;
      if (this.operator && (!this.waiting || key === '=')) {
        const right = Number(this.entry);
        const result = apply(this.left, this.operator, right);
        this.expression = format(this.left) + ' ' + symbols[this.operator] + ' ' + format(right) + ' =';
        this.entry = String(result);
        if (key === '=') record = { expression: this.expression, result: format(result) };
      }
      if (key === '=') {
        this.operator = '';
        this.left = null;
        this.waiting = false;
        this.finished = true;
      } else {
        this.left = Number(this.entry);
        this.operator = key;
        this.expression = format(this.left) + ' ' + symbols[key];
        this.waiting = true;
        this.finished = false;
      }
      return record;
    } catch (error) {
      this.clear();
      this.error = error.message;
    }
  }
}

export const units = {
  length: { name: '길이', factors: { mm: .001, cm: .01, m: 1, km: 1000, in: .0254, ft: .3048 } },
  area: { name: '면적', factors: { '㎡': 1, '평': 400 / 121, 'ha': 10000 } },
  mass: { name: '무게', factors: { g: .001, kg: 1, t: 1000, lb: .45359237 } },
  volume: { name: '부피', factors: { mL: .001, L: 1, '㎥': 1000 } }
};
function number(raw, label) {
  if (raw == null || String(raw).trim() === '' || !Number.isFinite(Number(raw))) throw new Error(label + ' 값을 입력해 주세요.');
  return Number(raw);
}
function nonNegative(value) {
  if (value < 0) throw new Error('0 이상의 값을 입력해 주세요.');
  return value;
}
function day(raw) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new Error('날짜를 입력해 주세요.');
  const value = Date.parse(raw + 'T00:00:00Z');
  if (!Number.isFinite(value) || new Date(value).toISOString().slice(0,10) !== raw) throw new Error('유효한 날짜를 입력해 주세요.');
  return value / 86400000;
}
export function calculate(id, form) {
  switch (id) {
    case 'rent': {
      const deposit = wonFromManwon(form.deposit, '월세 보증금');
      const rate = nonNegative(number(form.rate, '연 전환율'));
      const won = value => format(value) + '원';
      let amount, label, detail;
      if (form.direction === 'toMonthly') {
        const jeonse = wonFromManwon(form.jeonse, '전세 보증금');
        if (deposit > jeonse) throw new Error('남길 보증금은 전세 보증금 이하로 입력해 주세요.');
        amount = convertRent(jeonse - deposit, rate, true);
        label = '전환 후 월세';
        detail = `(${won(jeonse)} − ${won(deposit)}) × ${rate}% ÷ 12`;
      } else if (form.direction === 'toJeonse') {
        if (rate === 0) throw new Error('월세를 전세로 바꾸려면 0보다 큰 연 전환율을 입력해 주세요.');
        const monthly = wonFromManwon(form.monthly, '월세 금액');
        amount = deposit + convertRent(monthly, rate, false);
        label = '전환 후 전세 보증금';
        detail = `${won(deposit)} + (${won(monthly)} × 12 ÷ ${rate}%)`;
      } else throw new Error('전환 방향을 선택해 주세요.');
      if (!Number.isSafeInteger(amount)) throw new Error('계산 범위를 초과했어요. 금액과 전환율을 확인해 주세요.');
      return { label, value: won(amount), detail, amount };
    }
    case 'loan':
      return { plans: compareLoans(wonFromManwon(form.principal, '대출금액'), number(form.rate, '연이율'), number(form.months, '대출기간')) };
    case 'salary': {
      const { period, gross, taxable, deductions, total, net } = monthlySalary(form);
      return {
        label: period.label + ' · 예상 월 실수령액',
        value: format(net) + '원',
        detail: '세전 월급 ' + format(gross) + '원 · 월 과세급여 ' + format(taxable) + '원',
        note: period.employmentAssumption,
        breakdown: [...deductions, ['월 공제 합계', total]].map(([label, amount]) => [label, format(amount) + '원'])
      };
    }
    case 'percent': {
      const base = number(form.base, '기준값');
      const part = number(form.part, '비율 또는 비교값');
      if (form.mode === 'portion') return { label: '계산 결과', value: format(compact(base * (part / 100))), detail: format(base) + '의 ' + format(part) + '%' };
      if (base === 0) throw new Error('기준값이 0이면 비율을 구할 수 없어요.');
      const change = form.mode === 'change';
      return { label: change ? '증감률' : '차지하는 비율', value: format(compact((change ? part - base : part) / base * 100)) + '%', detail: '기준값 ' + format(base) + ' · 비교값 ' + format(part) };
    }
    case 'discount': {
      const price = nonNegative(number(form.price, '원래 가격'));
      const rate = nonNegative(number(form.rate, '할인율'));
      if (rate > 100) throw new Error('할인율은 100%까지 입력할 수 있어요.');
      if (!Number.isSafeInteger(price)) throw new Error('원래 가격을 원 단위 정수로 입력해 주세요.');
      const savings = Math.round(price * (rate / 100));
      return { label: '할인 적용 가격', value: format(price - savings) + '원', detail: '할인 금액 ' + format(savings) + '원 · 원 단위 반올림' };
    }
    case 'dates': {
      const diff = day(form.end) - day(form.start);
      if (diff < 0) throw new Error('종료일을 시작일과 같거나 이후로 선택해 주세요.');
      return { label: '두 날짜 사이의 기간', value: format(diff + (form.inclusive ? 1 : 0)) + '일', detail: form.start + ' ~ ' + form.end + (form.inclusive ? ' · 시작일 포함' : ' · 시작일 제외') };
    }
    case 'units': {
      const factors = units[form.category]?.factors;
      if (!factors || !Object.hasOwn(factors, form.from) || !Object.hasOwn(factors, form.to)) throw new Error('단위를 선택해 주세요.');
      const value = nonNegative(number(form.amount, '변환할 값'));
      return { label: '변환 결과', value: format(compact(value * (factors[form.from] / factors[form.to]))) + ' ' + form.to, detail: format(value) + ' ' + form.from + ' 기준' };
    }
    case 'split': {
      const total = nonNegative(number(form.total, '총금액'));
      const count = number(form.count, '인원수');
      if (!Number.isSafeInteger(total) || !Number.isSafeInteger(count) || count < 1) throw new Error('금액은 원 단위, 인원수는 1명 이상의 정수로 입력해 주세요.');
      const share = Math.floor(total / count);
      const rest = total % count;
      return { label: '1인당 기본 금액', value: format(share) + '원', detail: rest ? format(rest) + '명은 ' + format(share + 1) + '원, 나머지 ' + format(count - rest) + '명은 ' + format(share) + '원이에요.' : format(count) + '명이 같은 금액을 내면 돼요.' };
    }
    default: throw new Error('계산기를 선택해 주세요.');
  }
}
