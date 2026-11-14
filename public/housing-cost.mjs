import { wonFromManwon } from './money.mjs';
import { convertRent } from './rent.mjs';

function propertyCosts(deposit, rent, fee, cash, rate, months) {
  const loan = Math.max(0, deposit - cash);
  const interest = convertRent(loan, rate, true);
  const fixed = rent + fee;
  const monthly = fixed + interest;
  const total = monthly * months;
  if (!Number.isSafeInteger(total)) throw new Error('금액이 계산 범위를 초과했어요. 입력값을 확인해 주세요.');
  return { loan, interest, rent, fee, fixed, monthly, total };
}

export function compareHousingCosts(form, rate, months) {
  if (!Number.isSafeInteger(months) || months < 1) throw new Error('계약기간은 1개월 이상의 정수로 입력해 주세요.');
  const cash = wonFromManwon(form.cash, '자기자금');
  const jeonse = propertyCosts(wonFromManwon(form.jeonseDeposit, '전세 보증금'), 0,
    wonFromManwon(form.jeonseFee, '전세 관리비'), cash, rate, months);
  const rental = propertyCosts(wonFromManwon(form.rentDeposit, '월세 보증금'),
    wonFromManwon(form.rent, '월세 금액'), wonFromManwon(form.rentFee, '월세 관리비'), cash, rate, months);
  // 월 비용 = 월세 + 관리비 + 대출금 × 연이율(%) / 1200
  const loanDelta = jeonse.loan - rental.loan;
  const fixedDelta = rental.fixed - jeonse.fixed;
  const crossing = loanDelta === 0 ? null : fixedDelta / loanDelta * 1200;
  const breakEven = crossing !== null && crossing >= 0 ? Math.abs(crossing) : null;
  return { jeonse, rental, months, breakEven, equalAtAllRates: loanDelta === 0 && fixedDelta === 0 };
}
