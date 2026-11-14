# 도구들

한국어 생활 계산기 모음입니다. `public/` 안의 HTML, CSS, 자바스크립트와 이미지만으로 동작합니다. 계산은 방문자의 브라우저에서 처리합니다.

## 도구

기본 계산기, 연봉 실수령액 계산기, 퍼센트 계산기, 할인 계산기, 날짜 계산기, 단위 변환기, 더치페이 계산기를 제공합니다. 기본 계산기는 일반 탁상 계산기처럼 입력 순서대로 연산합니다. 백분율 키는 현재 숫자를 100으로 나눕니다. 계산 기록은 탭을 새로 고칠 때까지, 즐겨찾기는 현재 브라우저에 보관합니다.

연봉 실수령액 계산기는 2026년 7~12월 직장가입자의 월급을 추정합니다. 보험료율과 상·하한은 `public/salary.mjs`에, 홈택스의 2026년 3월 시행 간이세액표는 `public/earned-income-tax-2026.mjs`에 있습니다. 적용 기간과 공식 자료 링크는 계산기에서 확인할 수 있습니다.

[대출 이자 계산기](https://dogudl.com/#loan)는 같은 원금, 고정 연이율, 기간에 대해 원리금균등·원금균등·만기일시상환의 첫 달과 마지막 달 상환액, 총이자를 비교합니다. 방식별 상환표에서 매월 갚는 원금과 이자, 납부 후 잔액을 볼 수 있습니다. 연이율을 12로 나눈 월이율을 사용하고 회차별 잔액과 이자를 원 단위로 반올림합니다.

## 로컬 실행

Python 3이 설치되어 있으면 저장소 루트에서 다음 명령을 실행하고 브라우저에서 `http://localhost:8000`을 엽니다.

```sh
python -m http.server 8000 --bind 127.0.0.1 --directory public
```

Node.js로 계산 검사를 실행할 수 있습니다.

```sh
node --test tests/calculations.test.mjs
```

## Cloudflare Pages 배포

`main`에 푸시하면 GitHub Actions가 계산 테스트를 실행하고, 통과한 커밋의 `public/` 폴더를 Cloudflare Pages의 `dogudl` 프로젝트에 배포합니다. [공개 사이트](https://dogudl.pages.dev/) · [배포 기록](https://github.com/nyarh/dogudl/actions/workflows/deploy.yml)

GitHub 저장소의 **Settings → Secrets and variables → Actions**에서 `CLOUDFLARE_ACCOUNT_ID`는 변수로, `CLOUDFLARE_API_TOKEN`은 시크릿으로 설정합니다. 토큰에는 해당 계정의 **Cloudflare Pages → Edit** 권한이 필요합니다.
