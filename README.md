# 도구들

한국어 생활 계산기 모음입니다. `public/` 안의 HTML, CSS, 자바스크립트와 이미지만으로 동작합니다. 계산은 방문자의 브라우저에서 처리합니다.

## 도구

기본 계산기, 연봉 실수령액 계산기, 퍼센트 계산기, 할인 계산기, 날짜 계산기, 단위 변환기, 더치페이 계산기를 제공합니다. 기본 계산기는 일반 탁상 계산기처럼 입력 순서대로 연산합니다. 백분율 키는 현재 숫자를 100으로 나눕니다. 계산 기록은 탭을 새로 고칠 때까지, 즐겨찾기는 현재 브라우저에 보관합니다.

[연봉 실수령액 계산기](https://dogudl.com/salary/)는 2026년 하반기와 2027년 상반기 예상 기준을 선택해 직장가입자의 월급을 추정합니다. 2027년 상반기는 고용보험 근로자 부담률 1.0% 인상안을 가정하고 2026년 건강보험료 상·하한과 근로소득 간이세액표를 적용합니다. 기간별 보험료율은 `public/salary.mjs`에, 홈택스의 2026년 3월 시행 간이세액표는 `public/earned-income-tax-2026.mjs`에 있습니다. 계산기에서 공식 자료와 적용 기준을 확인할 수 있습니다.

[대출 이자 계산기](https://dogudl.com/loan/)는 같은 원금, 고정 연이율, 기간에 대해 원리금균등·원금균등·만기일시상환의 첫 달과 마지막 달 상환액, 총이자를 비교합니다. 방식별 상환표에서 매월 갚는 원금과 이자, 납부 후 잔액을 볼 수 있습니다. 연이율을 12로 나눈 월이율을 사용하고 회차별 잔액과 이자를 원 단위로 반올림합니다.

[전월세 상호전환 계산기](https://dogudl.com/rent/)는 직접 입력한 연 전환율로 전세 보증금과 월세를 양방향으로 환산합니다. 월세로 바꿀 때는 남길 보증금을 빼고, 전세로 바꿀 때는 현재 월세 보증금을 더합니다. 계산 결과는 원 단위로 반올림합니다.

[전세·월세 실제 비용 비교기](https://dogudl.com/housing-cost/)는 같은 자기자금으로 두 매물에 필요한 대출금을 구하고 월 이자·월세·관리비와 계약기간 전체 비용을 비교합니다. 손익분기 금리는 두 매물의 반올림 전 월 비용이 같아지는 연 대출금리입니다.

## 로컬 실행

Python 3이 설치되어 있으면 저장소 루트에서 다음 명령을 실행하고 브라우저에서 `http://localhost:8000`을 엽니다.

```sh
node scripts/build.mjs
python -m http.server 8000 --bind 127.0.0.1 --directory public
```

Node.js로 계산 검사를 실행할 수 있습니다.

```sh
node --test tests/*.test.mjs
```

## Cloudflare Pages 배포

`main`에 푸시하면 GitHub Actions가 계산 테스트를 실행하고, 통과한 커밋의 `public/` 폴더를 Cloudflare Pages의 `dogudl` 프로젝트에 배포합니다. [공개 사이트](https://dogudl.pages.dev/) · [배포 기록](https://github.com/nyarh/dogudl/actions/workflows/deploy.yml)

GitHub 저장소의 **Settings → Secrets and variables → Actions**에서 `CLOUDFLARE_ACCOUNT_ID`는 변수로, `CLOUDFLARE_API_TOKEN`은 시크릿으로 설정합니다. 토큰에는 해당 계정의 **Cloudflare Pages → Edit** 권한이 필요합니다.

## 검색엔진용 정적 페이지

홈(`/`)은 기본 계산기이며, 나머지 도구는 `/salary/`, `/loan/`, `/rent/`, `/housing-cost/`, `/percent/`, `/discount/`, `/dates/`, `/units/`, `/split/`에서 직접 열 수 있습니다. 예전 `/#loan` 같은 링크는 브라우저에서 해당 주소로 바뀝니다. 주소의 `#workspace`는 접근성용 이동 링크로 유지합니다.

`public/catalog.mjs`의 도구 정보와 설명, `public/form-fields.mjs`의 입력 폼, `templates/page.html`을 수정한 뒤 `node scripts/build.mjs`를 실행하세요. 생성된 HTML, sitemap.xml, robots.txt, 404.html도 함께 커밋합니다. 각 페이지는 자바스크립트 실행 전부터 제목·설명·canonical·Open Graph·계산기 안내·도구 링크·입력 폼을 포함합니다. 실제 계산에는 자바스크립트가 필요합니다. 날짜 입력의 기본값은 방문자의 현재 날짜로 실행 시 채웁니다.

Cloudflare Pages는 최상위 `404.html`로 알 수 없는 경로를 404 처리하며, 계산기 홈으로 응답하는 SPA fallback을 사용하지 않습니다. 배포 워크플로는 정적 페이지를 다시 생성하고 전체 Node 테스트가 통과한 경우에만 배포합니다. Search Console 사이트맵 제출은 코드 배포와 별도로 수행해야 합니다.
