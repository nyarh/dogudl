import { format } from './calculations.mjs?v=housing-cost';

const won = amount => format(amount) + '원';
const columns = ['첫 달 상환액', '마지막 달 상환액', '총이자'];
const explanations = [
  '원금과 이자를 합쳐 매달 비슷한 금액을 냅니다.',
  '매달 같은 원금을 갚아 이자와 상환액이 줄어듭니다.',
  '매달 이자만 내고 마지막 달에 원금도 함께 갚습니다.'
];

export function renderLoanResult(box, plans) {
  const comparisonRows = plans.map(({ name, rows, totalInterest }) => {
    const amounts = [rows[0].payment, rows.at(-1).payment, totalInterest];
    const cells = amounts.map((amount, index) =>
      `<td><span class="loan-cell-label" aria-hidden="true">${columns[index]}</span>${won(amount)}</td>`
    ).join('');
    return `<tr><th scope="row">${name}</th>${cells}</tr>`;
  }).join('');
  box.innerHTML = `<table class="loan-comparison">
    <caption>상환 방식별 비교</caption>
    <thead><tr><th scope="col">상환 방식</th>${columns.map(label => `<th scope="col">${label}</th>`).join('')}</tr></thead>
    <tbody>${comparisonRows}</tbody></table>
    <h3>월별 상환 내역</h3>`;
  for (const [index, plan] of plans.entries()) {
    const details = document.createElement('details');
    details.className = 'loan-schedule';
    details.innerHTML = `<summary>${plan.name}</summary>
      <p>${explanations[index]} 총상환액은 <strong>${won(plan.totalPayment)}</strong>입니다.</p>`;
    details.addEventListener('toggle', () => {
      if (!details.open || details.querySelector('table')) return;
      const rows = plan.rows.map(row =>
        `<tr><th scope="row">${row.month}회</th><td>${format(row.principalPaid)}</td><td>${format(row.interest)}</td><td>${format(row.payment)}</td><td>${format(row.balance)}</td></tr>`
      ).join('');
      details.insertAdjacentHTML('beforeend', `<div class="loan-scroll" tabindex="0" role="region" aria-label="${plan.name} 월별 상환표">
        <table><caption>${plan.name} 상환표 (원)</caption>
        <thead><tr><th scope="col">회차</th><th scope="col">상환 원금</th><th scope="col">이자</th><th scope="col">상환액</th><th scope="col">남은 원금</th></tr></thead>
        <tbody>${rows}</tbody></table></div>`);
    });
    box.append(details);
  }
}
