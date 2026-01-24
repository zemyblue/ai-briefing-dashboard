# AI Daily Briefing Dashboard

매일 AI/개발 트렌드를 자동 수집·요약해서 보여주는 **정적(Static Export) Next.js** 대시보드입니다.

- https://aidailybriefing.zemystudio.com/

## 핵심 특징

- **Daily 브리핑 자동 생성**: GitHub Actions가 `npm run generate:data`를 실행해 `public/data/`에 적재
- **정적 배포 최적화**: Cloudflare Pages/Workers 정적 배포 + 런타임에 GitHub Raw에서 최신 JSON fetch
- **개발자 중심 큐레이션**: Tech Deep Dive를 메인으로, Hype/Watch 섹션 제공

## 아키텍처

이 프로젝트는 **정적(Static Export) 웹앱**과 **일일 데이터 생성 파이프라인**을 분리해서 운영합니다.

### 1) 데이터 생성 (배치)

- 실행 주체: GitHub Actions (`.github/workflows/daily-briefing.yml`)
- 실행 명령: `npm run generate:data` → `node scripts/generate-briefing-v1.js`
- 입력: RSS/웹 소스 + (선택) YouTube Search + Gemini (`GEMINI_API_KEY`)
- 출력: `public/data/` 아래 JSON 파일
  - `public/data/latest.json`
  - `public/data/dates.json` (`{ "dates": ["YYYY-MM-DD", ...] }`)
  - `public/data/YYYY/MM/YYYY-MM-DD.json`

### 2) 웹앱 런타임 데이터 로딩 (클라이언트)

- Next.js App Router + `output: 'export'` 기반이라 **서버 API/SSR 없이** 동작합니다.
- 브라우저에서 `fetch()`로 JSON을 가져옵니다.
- 정적 배포에서 stale을 피하려고 기본적으로 GitHub Raw를 사용합니다.
  - 기본값: `https://raw.githubusercontent.com/zemyblue/ai-briefing-dashboard/main/public/data`
  - 로컬/정적 테스트 override: `NEXT_PUBLIC_DATA_BASE_URL=/data`

### 3) 배포

- 앱 코드는 Cloudflare Pages/Workers 같은 정적 호스팅에 1회 배포
- 데이터는 GitHub Actions가 매일 갱신 (코드 재배포 없이 최신 데이터 반영)

## 로컬 실행

### 1) 설치

```bash
npm install
```

### 2) 환경 변수 설정

프로젝트 루트에 `.env` 생성:

```bash
GEMINI_API_KEY=YOUR_KEY
# 선택
YOUTUBE_API_KEY=YOUR_KEY
# 로컬 public/data 참고
NEXT_PUBLIC_DATA_BASE_URL=/data
```

### 3) 브리핑 데이터 생성

```bash
npm run generate:data
```

생성되는 파일:
- `public/data/latest.json`
- `public/data/dates.json` (`{ "dates": ["YYYY-MM-DD", ...] }`)
- `public/data/YYYY/MM/YYYY-MM-DD.json`

### 4) 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 데이터 로딩 방식

정적 배포에서 stale 데이터를 피하기 위해 기본적으로 GitHub Raw를 사용합니다.

- 기본값: `https://raw.githubusercontent.com/zemyblue/ai-briefing-dashboard/main/public/data`
- 로컬 데이터로 확인하고 싶으면:

```bash
NEXT_PUBLIC_DATA_BASE_URL=/data npm run dev
```

## 자동화 (GitHub Actions)

- 워크플로우: `.github/workflows/daily-briefing.yml`
- 스케줄: `0 0 * * *` (UTC 00:00 = KST 09:00)
  - GitHub 스케줄은 **지연 실행**될 수 있습니다.

필수 Secrets:
- `GEMINI_API_KEY`
선택 Secrets:
- `YOUTUBE_API_KEY`

## 개발 참고

- 에이전트 작업 가이드: `AGENTS.md`
- 배포/운영: `DEPLOYMENT_GUIDE.md`
- Gemini 키/Secrets: `GEMINI_API_GUIDE.md`
- (레거시) 빠른 시작/설치: `QUICKSTART.md`, `HOWTOINSTALL.md`

## 테스트/품질

```bash
npm run lint
npm test   # 현재는 "No tests yet" (no-op)
npm run build
```
