// 연 이율(%)을 월 전환율의 정수 분수로 바꿔 정확히 0.5원인 경우에도 올림한다.
export function convertRent(amount, annualPercent, toMonthly) {
  const [mantissa, exponent = '0'] = String(annualPercent).split('e');
  const [whole, fraction = ''] = mantissa.split('.');
  const scale = fraction.length - Number(exponent);
  const numerator = BigInt(whole + fraction) * 10n ** BigInt(Math.max(0, -scale));
  const denominator = 1200n * 10n ** BigInt(Math.max(0, scale));
  const [multiplier, divisor] = toMonthly ? [numerator, denominator] : [denominator, numerator];
  return Number((BigInt(amount) * multiplier + divisor / 2n) / divisor);
}
