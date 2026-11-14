import { units, defaultSalaryPeriod, salaryPeriods } from './calculations.mjs?v=2027-h1';
import { maxLoanMonths } from './loan.mjs';
function field(name, label, value, options = {}) {
  const { type = 'number', min, max, step = 'any' } = options;
  return `<label class="field"><span>${label}</span><input required name="${name}" type="${type}" value="${value}" ${type === 'number' ? 'step="' + step + '"' : ''} ${min !== undefined ? 'min="' + min + '"' : ''} ${max !== undefined ? 'max="' + max + '"' : ''}></label>`;
}
function select(name, label, entries, selected) {
  const options = entries.map(([id,text]) => `<option value="${id}" ${id === selected ? 'selected' : ''}>${text}</option>`).join('');
  return `<label class="field"><span>${label}</span><select name="${name}">${options}</select></label>`;
}
export function unitFields(category) {
  const entries = Object.keys(units[category].factors).map(name => [name,name]);
  const defaultPair = { length:['m','cm'], area:['㎡','평'], mass:['kg','g'], volume:['L','mL'] }[category];
  return select('from','입력 단위',entries,defaultPair[0]) + select('to','결과 단위',entries,defaultPair[1]);
}
function localDate(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
}
export function formFields(id) {
  if (id === 'rent') {
    const money = { min: 0, step: 0.0001 };
    return `<fieldset class="rent-direction"><legend>전환 방향</legend><div>
      <label><input type="radio" name="direction" value="toMonthly" checked><span>전세 → 월세</span></label>
      <label><input type="radio" name="direction" value="toJeonse"><span>월세 → 전세</span></label>
      </div></fieldset>`
      + field('jeonse', '현재 전세 보증금 (만원)', 30000, money)
      + field('deposit', '월세로 바꾼 뒤 남길 보증금 (만원)', 10000, money)
      + field('monthly', '현재 월세 (만원)', 80, money)
      + field('rate', '연 전월세 전환율 (%)', 4.8, { min: 0 })
      + '<p class="field-hint">4.8%는 예시입니다. 비교할 전환율을 직접 입력하세요. 결과는 원 단위로 반올림합니다.</p>';
  }
  if (id === 'loan') {
    return field('principal', '대출금액 (만원)', 3000, {min:0.0001, step:0.0001})
      + '<div class="pair">' + field('rate', '연이율 (%)', 4.5, {min:0})
      + field('months', '대출기간 (개월)', 36, {min:1, max:maxLoanMonths, step:1}) + '</div>'
      + '<p class="loan-note">고정금리로 매월 말에 상환한다고 가정합니다. 수수료와 별도 거치기간은 제외하며, 은행의 일할 계산이나 반올림 방식에 따라 실제 금액은 달라질 수 있습니다.</p>';
  }
  if (id === 'salary') {
    const periods = Object.entries(salaryPeriods).map(([id, period]) =>
      [id, period.employmentAssumption ? period.label + ' (예상)' : period.label]);
    return select('period', '적용 기간', periods, defaultSalaryPeriod)
      + '<p class="field-hint" id="salary-assumption" hidden></p>'
      + '<p class="salary-intro">퇴직금을 제외한 직장인 세전 연봉을 입력하세요.</p>'
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
