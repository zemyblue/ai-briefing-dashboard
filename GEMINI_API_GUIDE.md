# Gemini API 사용 가이드 (업데이트됨)

이 프로젝트는 브리핑 생성을 위해 Google Gemini를 사용합니다.

- 로컬/CI에서 필요한 값: `GEMINI_API_KEY`
- 선택 값: `YOUTUBE_API_KEY` (없으면 YouTube 검색을 건너뜁니다)

## 1) API 키 발급

1. Google AI Studio에서 API Key를 발급합니다.
2. 발급한 키를 안전하게 보관합니다.

## 2) 로컬 개발에서 사용

프로젝트 루트에 `.env`를 만들고 아래를 설정합니다.

```bash
GEMINI_API_KEY=YOUR_KEY
# 선택
YOUTUBE_API_KEY=YOUR_KEY
```

그 다음:

```bash
npm run generate:data
```

- 실행 스크립트: `scripts/generate-briefing-v1.js`
- npm 스크립트: `npm run generate:data`

## 3) GitHub Actions에서 사용

GitHub 레포지토리 → **Settings** → **Secrets and variables** → **Actions**:

- `GEMINI_API_KEY` (필수)
- `YOUTUBE_API_KEY` (선택)

워크플로우: `.github/workflows/daily-briefing.yml`

## 4) 구현 메모 (현재 코드 기준)

- Gemini 호출은 `@google/genai` SDK를 사용합니다.
- 생성 결과는 `public/data/` 아래에 다음 형태로 저장됩니다.
  - `public/data/latest.json`
  - `public/data/dates.json`
  - `public/data/YYYY/MM/YYYY-MM-DD.json`

## 5) 보안 주의사항

- `.env` / API 키는 절대 Git에 커밋하지 않습니다.
- GitHub Actions에서는 반드시 Secrets로 관리합니다.
