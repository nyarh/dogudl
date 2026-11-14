import { monthlyTaxTable } from './earned-income-tax-2026.mjs';
import { wonFromManwon } from './money.mjs';

const floorToTen = won => Math.floor(won / 10) * 10;

export const defaultSalaryPeriod = '2026-H2';
// 근로자 부담률을 1bp(0.01%p) 단위로 저장한다. 장기요양 부담률의 기준은 건강보험료다.
export const salaryPeriods = {
  '2026-H2': { label: '2026년 하반기', pensionBps: 475, careBps: 1314, employmentBps: 90 },
  '2027-H1': { label: '2027년 상반기', pensionBps: 500, careBps: 1390, employmentBps: 100,
    employmentAssumption: '고용보험 근로자 부담률은 1.0% 인상안을 가정합니다.' }
};

// 소득세법 시행령 별표 2. 월 1천만원 초과분은 1천만원 행의 세액에 가산한다.
const upperBrackets = [
  { above: 87_000_000, addition: 31_034_600, basisPoints: 4500 },
  { above: 45_000_000, addition: 13_394_600, basisPoints: 4200 },
  { above: 30_000_000, addition: 7_394_600, basisPoints: 4000 },
  { above: 28_000_000, addition: 6_610_600, basisPoints: 3920 },
  { above: 14_000_000, addition: 1_397_000, basisPoints: 3724 },
  { above: 10_000_000, addition: 25_000, basisPoints: 3430 }
];

export function monthlyIncomeTax(taxable, family, children) {
  const row = monthlyTaxTable.findLast(([lower]) => lower * 1000 <= taxable);
  if (!row) return 0;
  let tax = row[Math.min(family, 11)];
  if (family > 11) tax -= (row[10] - row[11]) * (family - 11);
  const bracket = upperBrackets.find(({ above }) => taxable > above);
  if (bracket) tax += bracket.addition + (taxable - bracket.above) * bracket.basisPoints / 10_000;
  if (children === 1) tax -= 20_830;
  if (children >= 2) tax -= 45_830 + (children - 2) * 33_330;
  return tax < 1000 ? 0 : floorToTen(tax);
}

function people(raw, min) {
  const value = Number(raw);
  if (raw == null || String(raw).trim() === '' || !Number.isSafeInteger(value) || value < min) {
    throw new Error('가족 수는 본인 포함 1명 이상, 자녀 수는 0명 이상의 정수로 입력해 주세요.');
  }
  return value;
}

export function monthlySalary(form) {
  const periodId = form.period ?? defaultSalaryPeriod;
  if (!Object.hasOwn(salaryPeriods, periodId)) throw new Error('적용 기간을 선택해 주세요.');
  const period = salaryPeriods[periodId];
  const annual = wonFromManwon(form.annual, '세전 연봉');
  const exempt = wonFromManwon(form.exempt, '월 비과세액');
  const family = people(form.family, 1);
  const children = people(form.children, 0);
  const gross = Math.floor(annual / 12);
  if (gross < 1) throw new Error('세전 월급이 1원 이상이 되도록 연봉을 입력해 주세요.');
  if (exempt > gross) throw new Error('월 비과세액은 세전 월급을 넘을 수 없어요.');
  if (children >= family) throw new Error('자녀 수는 본인을 제외한 공제대상 가족 수 이내로 입력해 주세요.');
  const taxable = gross - exempt;

  // 두 기간 모두 2026.7~2027.6 국민연금 기준소득월액 범위를 적용한다.
  const pensionBase = Math.min(6_590_000, Math.max(410_000, Math.floor(taxable / 1000) * 1000));
  const pension = floorToTen(pensionBase * period.pensionBps / 10_000);
  // 2027년 상반기 예상에도 2026년 건강보험료 상·하한을 사용한다.
  const health = Math.min(4_591_740, Math.max(10_080, floorToTen(taxable * 3595 / 100_000)));
  const care = floorToTen(health * period.careBps / 10_000);
  const employment = floorToTen(taxable * period.employmentBps / 10_000);
  const incomeTax = monthlyIncomeTax(taxable, family, children);
  const localTax = floorToTen(incomeTax / 10);
  const deductions = [
    ['국민연금', pension], ['건강보험', health], ['장기요양보험', care],
    ['고용보험', employment], ['근로소득세', incomeTax], ['지방소득세', localTax]
  ];
  const total = deductions.reduce((sum, [, amount]) => sum + amount, 0);
  if (total > gross) throw new Error('직장가입자 최저 보험료가 월급을 넘어요. 연봉 단위와 가입 조건을 확인해 주세요.');
  return { period, gross, taxable, deductions, total, net: gross - total };
}
