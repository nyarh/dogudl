# 도구들

한국어 생활 계산기 모음입니다. `public/` 안의 HTML, CSS, 자바스크립트와 이미지만으로 동작합니다. 계산은 방문자의 브라우저에서 처리합니다.

## 도구

기본 계산기, 퍼센트 계산기, 할인 계산기, 날짜 계산기, 단위 변환기, 더치페이 계산기를 제공합니다. 기본 계산기는 일반 탁상 계산기처럼 입력 순서대로 연산합니다. 백분율 키는 현재 숫자를 100으로 나눕니다. 계산 기록은 탭을 새로 고칠 때까지, 즐겨찾기는 현재 브라우저에 보관합니다.

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

Cloudflare 대시보드의 **Workers & Pages → Create application → Pages → Import an existing Git repository**에서 GitHub의 `nyarh/dogudl`을 선택합니다.

| 설정 | 값 |
| --- | --- |
| 프로덕션 브랜치 | `main` |
| 프레임워크 | None |
| 빌드 명령 | 비워 둠 |
| 빌드 출력 디렉터리 | `public` |
| 루트 디렉터리 | 기본값 |

**Save and Deploy**를 누르면 첫 배포가 시작됩니다. 연결 후에는 `main`에 푸시할 때마다 같은 설정으로 배포됩니다. 배포가 성공하면 **Custom domains**에서 `dogudl.com`을 연결하고 DNS 상태를 확인합니다. [Cloudflare Pages Git 연동 가이드](https://developers.cloudflare.com/pages/get-started/git-integration/)
