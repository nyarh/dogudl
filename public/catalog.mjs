export const catalog = [
  { id: 'basic', name: '기본 계산기', detail: '사칙연산과 백분율을 간편하게', icon: 'calculator', color: 'blue' },
  { id: 'salary', name: '연봉 실수령액 계산기', detail: '세전 연봉으로 월급과 공제 내역 확인', icon: 'wallet', color: 'green' },
  { id: 'loan', name: '대출 이자 계산기', detail: '원리금균등 · 원금균등 · 만기일시상환 비교', icon: 'bank', color: 'cyan' },
  { id: 'rent', name: '전월세 상호전환 계산기', detail: '전세 보증금과 월세를 원하는 전환율로 환산', icon: 'house', color: 'purple' },
  { id: 'percent', name: '퍼센트 계산기', detail: '전체 비율과 증감률 계산', icon: 'percent', color: 'purple' },
  { id: 'discount', name: '할인 계산기', detail: '할인 금액과 최종 가격 확인', icon: 'tag', color: 'coral' },
  { id: 'dates', name: '날짜 계산기', detail: '두 날짜 사이의 일수 계산', icon: 'calendar', color: 'green' },
  { id: 'units', name: '단위 변환기', detail: '길이, 면적, 무게, 부피 변환', icon: 'ruler', color: 'cyan' },
  { id: 'split', name: '더치페이 계산기', detail: '함께 쓴 금액을 원 단위로 정산', icon: 'users', color: 'pink' }
];
export const siteOrigin = "https://dogudl.com";
export const toolPath = id => id === "basic" ? "/" : `/${id}/`;
export const descriptions = {
  "basic": "숫자와 연산자를 입력하여 더하기, 빼기, 곱하기, 나누기와 백분율을 계산합니다. 일반 탁상 계산기처럼 입력 순서대로 연산하며, % 키는 현재 숫자를 100으로 나눕니다.",
  "salary": "세전 연봉과 월 비과세액, 공제대상 가족 수로 예상 월 실수령액과 공제 내역을 계산합니다. 2026년 하반기와 2027년 상반기 예상 기준을 선택해 비교할 수 있습니다.",
  "loan": "대출금액, 연이율, 대출기간을 입력하여 원리금균등·원금균등·만기일시상환의 총이자와 월별 상환표를 비교합니다. 고정금리와 매월 말 상환을 가정하며 수수료와 별도 거치기간은 제외합니다.",
  "rent": "전세에서 월세로, 월세에서 전세로 보증금을 환산합니다. 전세 보증금, 남길 보증금 또는 현재 월세와 비교할 연 전환율을 입력하세요. 전환율은 직접 지정하는 비교용 값이며 결과는 원 단위로 반올림합니다.",
  "percent": "기준값의 일정 비율, 비교값이 차지하는 비율, 기준값 대비 증감률을 계산합니다. 계산 방식을 선택하고 기준값과 비율 또는 비교값을 입력하세요.",
  "discount": "원래 가격과 할인율을 입력하여 할인 금액과 최종 결제 가격을 계산합니다. 할인율은 0%부터 100%까지 입력할 수 있습니다.",
  "dates": "시작일과 종료일 사이의 일수를 계산합니다. 시작일을 1일로 포함할지 선택하여 기간을 확인하세요.",
  "units": "길이, 면적, 무게, 부피의 단위를 변환합니다. 단위 종류와 값을 입력한 뒤 입력 단위와 결과 단위를 선택하세요.",
  "split": "함께 쓴 총금액과 인원수를 입력하여 1인당 금액을 원 단위로 정산합니다. 나누어떨어지지 않는 금액도 확인할 수 있습니다."
};
export function toolFromPath(path) {
  return catalog.find(tool => toolPath(tool.id) === (path.endsWith("/") ? path : path + "/"));
}
