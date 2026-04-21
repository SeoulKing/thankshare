# 감사 나눔 홈페이지

교회 주일 감사 나눔을 작성하고, 전체 글을 보고, 오늘 작성된 글 중에서 관리자만 추첨할 수 있는 Firebase 기반 웹앱입니다.

## 시작하기

1. Firebase 콘솔에서 웹앱을 만들고 Firestore Database를 활성화합니다.
2. `.env.example`을 참고해 `.env.local`을 만들고 Firebase 설정값과 관리자 비밀번호를 넣습니다.
3. 의존성을 설치하고 개발 서버를 실행합니다.

```bash
npm install
npm run dev
```

## 배포

GitHub Actions 자동 배포는 Firebase CLI의 공식 GitHub 연동으로 설정합니다.

```bash
npx firebase-tools init hosting:github --project gratitudesharing-faaec
```

질문에는 `SeoulKing/thankshare`, `npm ci && npm run build`, `main`을 사용합니다.

```bash
npm run build
firebase deploy
```

Firebase CLI가 없다면 먼저 설치하고 로그인해야 합니다.

```bash
npm install -g firebase-tools
firebase login
```

## 속회 목록 수정

속회 목록은 `src/config/groups.ts`에서 수정할 수 있습니다.

## 보안 메모

이 버전의 관리자 비밀번호는 프론트엔드 환경 변수로 동작하므로 교회 내부용의 간단한 접근 제한입니다. 더 강한 보안이 필요하면 Firebase Auth 또는 Cloud Functions 기반 추첨으로 바꾸는 것이 좋습니다.
