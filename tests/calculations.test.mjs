import test from 'node:test';
import assert from 'node:assert/strict';
import { Calculator, calculate } from '../public/calculations.mjs';
import { monthlyIncomeTax, monthlySalary } from '../public/salary.mjs';

const salaryExample = { annual: 4800, exempt: 20, family: 1, children: 0 };

const loanExample = { principal: '3000', rate: '4.5', months: '36' };

test('직접 입력한 전환율로 월세 보증금을 반영하여 왕복 환산한다', () => {
  const shared = { deposit: '6000', rate: '5.4' };
  const forward = calculate('rent', { ...shared, direction: 'toMonthly', jeonse: '26000' });
  assert.equal(forward.value, '900,000원');
  const reverse = calculate('rent', { ...shared, direction: 'toJeonse', monthly: forward.amount / 10000 });
  assert.equal(reverse.value, '260,000,000원');
  assert.equal(calculate('rent', { ...shared, rate: '3.6', direction: 'toMonthly', jeonse: '26000' }).amount, 600_000);
});

test('보증금 없는 월세, 보증금 전액 유지, 월세 0원과 전환율 0%를 처리한다', () => {
  const forward = { direction: 'toMonthly', jeonse: '24000', deposit: '0', rate: '4' };
  assert.equal(calculate('rent', forward).amount, 800_000);
  assert.equal(calculate('rent', { ...forward, deposit: '24000' }).amount, 0);
  assert.equal(calculate('rent', { ...forward, rate: '0' }).amount, 0);
  assert.equal(calculate('rent', { direction: 'toJeonse', monthly: '0', deposit: '3500', rate: '4' }).amount, 35_000_000);
});

test('소수 전환율의 반 원 경계와 원 단위 입력을 두 방향에서 반올림한다', () => {
  assert.equal(calculate('rent', { direction: 'toMonthly', jeonse: '6', deposit: '0', rate: '2.01' }).amount, 101);
  assert.equal(calculate('rent', { direction: 'toJeonse', monthly: '0.0001', deposit: '0.0001', rate: '6.4' }).amount, 189);
  assert.equal(calculate('rent', { direction: 'toMonthly', jeonse: '0.0001', deposit: '0', rate: '1e-7' }).amount, 0);
});

test('초과 보증금, 비어 있거나 유효하지 않은 입력, 나눌 수 없는 전환율을 거부한다', () => {
  const forward = { direction: 'toMonthly', jeonse: '10000', deposit: '1000', rate: '5' };
  for (const invalid of [{ deposit: '10001' }, { deposit: -1 }, { jeonse: '' }, { rate: '' }, { rate: -1 },
    { direction: 'bad' }, { jeonse: '0.00001' }, { rate: Infinity }]) {
    assert.throws(() => calculate('rent', { ...forward, ...invalid }));
  }
  for (const invalid of [{ rate: 0 }, { rate: '1e-100' }, { monthly: '' }]) {
    assert.throws(() => calculate('rent', { direction: 'toJeonse', deposit: 0, monthly: 20, rate: 4, ...invalid }));
  }
});

test('대출 3천만원의 세 상환 방식별 첫 달·마지막 달과 총이자를 비교한다', () => {
  const { plans } = calculate('loan', loanExample);
  assert.deepEqual(plans.map(plan => [
    plan.name, plan.rows[0].payment, plan.rows.at(-1).payment, plan.totalInterest
  ]), [
    ['원리금균등', 892_408, 892_408, 2_126_679],
    ['원금균등', 945_833, 836_458, 2_081_250],
    ['만기일시상환', 112_500, 30_112_500, 4_050_000]
  ]);
});

test('회차별 원금·이자·잔액과 요약이 일치하고 만기에 잔액이 0원이다', () => {
  const principal = 12_345_678;
  for (const rate of [0, 0.000001, 4.5, 18]) {
    const { plans } = calculate('loan', { principal: '1234.5678', rate, months: 360 });
    for (const plan of plans) {
      let outstanding = principal;
      let payments = 0;
      let interest = 0;
      assert.equal(plan.rows.length, 360);
      for (const [index, row] of plan.rows.entries()) {
        assert.equal(row.month, index + 1);
        assert.ok(Number.isSafeInteger(row.principalPaid) && row.principalPaid >= 0);
        assert.equal(row.interest, Math.round(outstanding * rate / 1200));
        assert.equal(row.payment, row.interest + row.principalPaid);
        outstanding -= row.principalPaid;
        assert.equal(row.balance, outstanding);
        payments += row.payment;
        interest += row.interest;
      }
      assert.equal(outstanding, 0);
      assert.equal(plan.totalPayment, payments);
      assert.equal(plan.totalInterest, interest);
      assert.equal(payments, principal + interest);
    }
  }
});

test('무이자 대출과 1개월 만기, 만기 전 이자만 납부하는 회차를 처리한다', () => {
  const zero = calculate('loan', { principal: '0.001', rate: 0, months: 3 }).plans;
  assert.deepEqual(zero.map(plan => plan.totalInterest), [0, 0, 0]);
  assert.deepEqual(zero[0].rows, zero[1].rows);
  assert.deepEqual(zero[2].rows.map(row => row.payment), [0, 0, 10]);
  const single = calculate('loan', { principal: 120, rate: 12, months: 1 }).plans;
  for (const plan of single) assert.deepEqual(plan.rows, [
    { month: 1, principalPaid: 1_200_000, interest: 12_000, payment: 1_212_000, balance: 0 }
  ]);
});

test('대출 입력에서 빈 값, 음수, 잘못된 기간과 원 미만 금액을 거부한다', () => {
  for (const invalid of [{ principal: 0 }, { principal: 0.00001 }, { rate: '' }, { rate: -1 },
    { rate: Infinity }, { months: '' }, { months: 0 }, { months: 2.5 }, { months: 1201 }]) {
    assert.throws(() => calculate('loan', { ...loanExample, ...invalid }));
  }
});

test('연봉 4,800만원에서 월 비과세 20만원을 포함한 실수령액과 공제액을 보여준다', () => {
  const { value, detail, breakdown } = calculate('salary', salaryExample);
  assert.equal(value, '3,444,560원');
  assert.equal(detail, '세전 월급 4,000,000원 · 월 과세급여 3,800,000원');
  assert.deepEqual(breakdown, [
    ['국민연금', '180,500원'], ['건강보험', '136,610원'], ['장기요양보험', '17,950원'],
    ['고용보험', '34,200원'], ['근로소득세', '169,260원'], ['지방소득세', '16,920원'], ['월 공제 합계', '555,440원']
  ]);
});

test('홈택스 표의 급여 경계, 공제대상 가족 및 2026년 자녀공제를 적용한다', () => {
  assert.equal(monthlyIncomeTax(1_059_999, 1, 0), 0);
  assert.equal(monthlyIncomeTax(1_060_000, 1, 0), 1040);
  assert.equal(monthlyIncomeTax(3_500_000, 4, 0), 49_340);
  assert.equal(monthlyIncomeTax(3_519_999, 4, 1), 28_510);
  assert.equal(monthlyIncomeTax(3_500_000, 4, 2), 3510);
  assert.equal(monthlyIncomeTax(3_500_000, 4, 3), 0);
  assert.equal(monthlyIncomeTax(10_000_000, 12, 3), 960_840 - 30_000 - 79_160);
  assert.equal(monthlyIncomeTax(10_000_001, 1, 0), 1_532_400);
  assert.equal(monthlyIncomeTax(14_000_000, 1, 0), 2_904_400);
  assert.equal(monthlyIncomeTax(15_000_000, 1, 0), 3_276_800);
  assert.equal(monthlyIncomeTax(100_000_000, 1, 0), 38_392_000);
});

test('저소득과 고소득의 보험료 상·하한 및 원 미만 월급을 처리한다', () => {
  const low = monthlySalary({ ...salaryExample, annual: '300.0001', exempt: 0 });
  assert.equal(low.gross, 250_000);
  assert.deepEqual(low.deductions.slice(0, 2), [['국민연금', 19_470], ['건강보험', 10_080]]);
  const high = monthlySalary({ ...salaryExample, annual: 240_000, exempt: 0 });
  assert.deepEqual(high.deductions.slice(0, 2), [['국민연금', 313_020], ['건강보험', 4_591_740]]);
  assert.equal(high.net + high.total, high.gross);
});

test('연봉이나 비과세액과 가족 입력이 맞지 않으면 이유를 안내한다', () => {
  for (const invalid of [{ annual: '' }, { annual: -1 }, { annual: 0 }, { exempt: 401 },
    { family: 0 }, { family: 1.5 }, { children: -1 }, { children: 1 }]) {
    assert.throws(() => calculate('salary', { ...salaryExample, ...invalid }));
  }
});

function sequence(...keys) {
  const calc = new Calculator();
  keys.forEach(key => calc.press(key));
  return calc;
}
test('기본 계산기는 입력 순서대로 연산하고 부동소수점 오차를 정리한다', () => {
  assert.equal(sequence('2','+','3','*','4','=').display,'20');
  assert.equal(sequence('0','.','1','+','0','.','2','=').display,'0.3');
  assert.equal(sequence('9','+','*','2','=').display,'18');
  assert.equal(sequence('9','sign','+','2','=').display,'-7');
  assert.equal(sequence('2','5','%').display,'0.25');
  assert.equal(sequence('1','0','0','0','0','back').display,'1,000');
});
test('0으로 나누면 오류를 표시하고 다음 숫자로 새 계산을 시작한다', () => {
  const calc = sequence('5','/','0','=');
  assert.match(calc.error,/0으로/);
  calc.press('2');
  assert.equal(calc.display,'2');
  assert.equal(calc.error,'');
});
test('퍼센트, 비율 및 증감률 계산', () => {
  assert.equal(calculate('percent',{ mode:'portion',base:80000,part:15 }).value,'12,000');
  assert.equal(calculate('percent',{ mode:'ratio',base:80,part:20 }).value,'25%');
  assert.equal(calculate('percent',{ mode:'change',base:100,part:75 }).value,'-25%');
  assert.throws(() => calculate('percent',{mode:'ratio',base:0,part:1}),/기준값/);
});
test('할인 계산은 원 단위이며 양 끝 할인율을 지원한다', () => {
  for (const [rate,value] of [[0,'1,001원'],[50,'500원'],[100,'0원']]) {
    assert.equal(calculate('discount',{price:1001,rate}).value,value);
  }
  assert.throws(() => calculate('discount',{price:1,rate:101}));
});
test('날짜 차이는 윤일과 시작일 포함 옵션을 처리한다', () => {
  assert.equal(calculate('dates',{start:'2024-02-28',end:'2024-03-01'}).value,'2일');
  assert.equal(calculate('dates',{start:'2024-02-29',end:'2024-02-29',inclusive:'on'}).value,'1일');
  assert.throws(() => calculate('dates',{start:'2025-02-29',end:'2025-03-01'}));
  assert.throws(() => calculate('dates',{start:'2024-03-01',end:'2024-02-29'}));
});
test('단위 변환은 평과 제곱미터를 양방향으로 계산한다', () => {
  assert.equal(calculate('units',{category:'area',from:'평',to:'㎡',amount:121}).value,'400 ㎡');
  assert.equal(calculate('units',{category:'area',from:'㎡',to:'평',amount:400}).value,'121 평');
  assert.equal(calculate('units',{category:'length',from:'m',to:'cm',amount:0}).value,'0 cm');
  assert.throws(() => calculate('units',{category:'mass',from:'m',to:'cm',amount:1}));
});
test('더치페이 계산은 나머지 원을 배분하며 빈 값과 잘못된 인원수를 거부한다', () => {
  assert.match(calculate('split',{total:10000,count:3}).detail,/1명은 3,334원, 나머지 2명은 3,333원/);
  assert.equal(calculate('split',{total:0,count:3}).value,'0원');
  for (const count of [0,-1,1.5,'']) assert.throws(() => calculate('split',{total:10000,count}));
});
