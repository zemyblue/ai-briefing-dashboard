# AI Daily Briefing - Quickstart (업데이트됨)

이 문서는 **최소 명령만** 모아둔 빠른 시작 문서입니다.
상세 설명은 `README.md`를 참고하세요.

## 1) 설치

```bash
npm install
```

## 2) `.env` 설정

프로젝트 루트에 `.env` 생성:

```bash
GEMINI_API_KEY=YOUR_API_KEY
# 선택
YOUTUBE_API_KEY=YOUR_API_KEY
# 로컬 public/data 참고
NEXT_PUBLIC_DATA_BASE_URL=/data
```

## 3) 데이터 생성

```bash
npm run generate:data
```

## 4) 실행

```bash
npm run dev
```

## 참고

- 빌드: `npm run build`
- 린트: `npm run lint`
- 로컬 데이터로 확인: `NEXT_PUBLIC_DATA_BASE_URL=/data npm run dev`
