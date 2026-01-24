# AI Daily Briefing: 설치 가이드 (업데이트됨)

이 문서는 과거 링크 호환을 위해 남겨둔 **간단 설치 가이드**입니다.

- 최신/정확한 안내는 `README.md`를 기준으로 합니다.
- 이 프로젝트는 **DB 없이** `public/data/`에 JSON을 생성하는 방식입니다.
- 데이터 생성 스크립트는 `npm run generate:data` → `scripts/generate-briefing-v1.js` 입니다.

## 전제 조건

- Node.js 18+
- npm

## 로컬 실행

```bash
npm install
```

### 환경 변수

프로젝트 루트에 `.env`를 만들고 아래를 설정합니다.

```bash
GEMINI_API_KEY=YOUR_KEY
# 선택: 없으면 YouTube 검색을 건너뜁니다.
YOUTUBE_API_KEY=YOUR_KEY
```

### 데이터 생성

```bash
npm run generate:data
```

생성되는 파일:

- `public/data/latest.json`
- `public/data/dates.json` (`{ "dates": ["YYYY-MM-DD", ...] }`)
- `public/data/YYYY/MM/YYYY-MM-DD.json`

### 개발 서버

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`

## 자주 겪는 문제

- 데이터가 안 보이면: `NEXT_PUBLIC_DATA_BASE_URL=/data npm run dev`로 로컬 데이터를 강제할 수 있습니다.
- `.env`는 커밋하지 않습니다 (`.gitignore`).

## 다음 문서

- `README.md`: 프로젝트 개요/로컬 실행(권장)
- `DEPLOYMENT_GUIDE.md`: Cloudflare Pages + GitHub Actions 운영
- `GEMINI_API_GUIDE.md`: Gemini API 키 발급/Secrets 설정
