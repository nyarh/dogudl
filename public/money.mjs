export function wonFromManwon(raw, label) {
  const value = String(raw ?? '').trim();
  if (!/^\d+(?:\.\d{1,4})?$/.test(value)) throw new Error(label + '을 원 단위까지 입력해 주세요.');
  const won = Math.round(Number(value) * 10_000);
  if (!Number.isSafeInteger(won)) throw new Error(label + '의 금액을 확인해 주세요.');
  return won;
}
