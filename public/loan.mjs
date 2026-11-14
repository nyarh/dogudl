export const maxLoanMonths = 1200;

export function compareLoans(principal, annualRate, months) {
  if (!Number.isSafeInteger(principal) || principal < 1) throw new Error('대출금액은 1원 이상으로 입력해 주세요.');
  if (!Number.isFinite(annualRate) || annualRate < 0) throw new Error('연이율은 0% 이상으로 입력해 주세요.');
  if (!Number.isInteger(months) || months < 1 || months > maxLoanMonths) {
    throw new Error('대출기간은 1~1,200개월 사이의 정수로 입력해 주세요.');
  }

  const rate = annualRate / 1200;
  // 잔여 회차의 연금현가 비율로 잔액을 구하면 원 단위 반올림 오차가 이월되지 않는다.
  const logRate = Math.log1p(rate);
  const annuityFactor = remaining => -Math.expm1(-remaining * logRate);
  const fullFactor = annuityFactor(months);
  const equalPrincipal = remaining => principal * (remaining / months);

  function schedule(name, balanceAfter) {
    let balance = principal;
    let totalInterest = 0;
    const rows = [];
    for (let month = 1; month <= months; month++) {
      const nextBalance = Math.round(balanceAfter(months - month));
      const principalPaid = balance - nextBalance;
      const interest = Math.round(balance * annualRate / 1200);
      rows.push({ month, principalPaid, interest, payment: principalPaid + interest, balance: nextBalance });
      totalInterest += interest;
      balance = nextBalance;
    }
    const totalPayment = principal + totalInterest;
    if (!Number.isSafeInteger(totalPayment)) throw new Error('대출금액 또는 연이율이 계산 범위를 초과했어요.');
    return { name, rows, totalInterest, totalPayment };
  }

  return [
    schedule('원리금균등', rate === 0 ? equalPrincipal : remaining => principal * (annuityFactor(remaining) / fullFactor)),
    schedule('원금균등', equalPrincipal),
    schedule('만기일시상환', remaining => remaining === 0 ? 0 : principal)
  ];
}
