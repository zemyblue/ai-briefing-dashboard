# AI Daily Briefing: 배포 가이드 (업데이트됨)

이 프로젝트는 **Next.js Static Export**로 빌드한 정적 사이트를 배포하고,
데이터는 런타임에 **GitHub Raw**에서 최신 JSON을 가져오는 방식입니다.

## 아키텍처 요약

- GitHub Actions(`.github/workflows/daily-briefing.yml`)가 매일 `npm run generate:data` 실행
- 생성된 `public/data/*` 변경을 PR로 올리고 자동 merge
- 배포된 정적 사이트는 기본적으로 GitHub Raw에서 `latest.json`을 fetch
  - 기본 URL: `https://raw.githubusercontent.com/zemyblue/ai-briefing-dashboard/main/public/data`
  - 로컬/정적 테스트 override: `NEXT_PUBLIC_DATA_BASE_URL=/data`

## 1) GitHub Secrets 설정

GitHub 레포지토리 → **Settings** → **Secrets and variables** → **Actions**

- `GEMINI_API_KEY` (필수)
- `YOUTUBE_API_KEY` (선택)

## 2) (선택) 초기 데이터 준비

첫 배포 직후 데이터가 없으면 화면에 빈 상태가 보일 수 있습니다. 아래 중 하나를 선택하세요.

- 옵션 A (권장): Secrets 설정 후 Actions에서 `Daily Briefing Update`를 **수동 실행** → PR 자동 생성/merge
- 옵션 B: 로컬에서 `npm run generate:data` 실행 후 `public/data/`를 커밋/푸시

## 3) Cloudflare Pages 배포

### GitHub 연동 (추천)

1. Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Pages**
2. GitHub 레포지토리 연결
3. Build 설정
   - Build command: `npm run build`
   - Build output directory: `out`

## 4) 동작 확인

- 사이트 접속 후 최신 브리핑이 로드되는지 확인
- Raw 데이터 URL이 공개 접근 가능한지 확인 (레포가 Private이면 브라우저 fetch가 막힙니다)

## 5) 문제 해결

- 데이터가 stale이면:
  - UI는 cache-buster와 `cache: 'no-store'`를 사용하도록 구성되어 있어야 합니다.
- 로컬에서 Raw 대신 로컬 파일로 확인하고 싶으면:
  - `NEXT_PUBLIC_DATA_BASE_URL=/data npm run dev`
