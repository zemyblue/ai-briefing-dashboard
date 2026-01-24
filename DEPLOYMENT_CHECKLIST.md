# 배포 체크리스트 (업데이트됨)

## 1) 로컬 확인

- [ ] `npm install`
- [ ] `.env`에 `GEMINI_API_KEY` 설정
- [ ] `npm run generate:data` 실행 (선택: 초기 데이터 생성)
- [ ] `npm run lint`
- [ ] `npm run build`

## 2) GitHub 설정

- [ ] GitHub Actions Secrets 설정
  - [ ] `GEMINI_API_KEY` (필수)
  - [ ] `YOUTUBE_API_KEY` (선택)
- [ ] (권장) 레포지토리가 Public인지 확인 (GitHub Raw를 브라우저에서 fetch하려면 Public 필요)

## 3) Cloudflare Pages

- [ ] Build command: `npm run build`
- [ ] Output directory: `out`

## 4) 자동화 확인

- [ ] Actions에서 `Daily Briefing Update` 워크플로우 수동 실행
- [ ] PR이 생성되고 merge되는지 확인
- [ ] `public/data/latest.json`이 갱신되는지 확인

## 5) 프로덕션 동작 확인

- [ ] 사이트에서 최신 브리핑이 보이는지 확인
- [ ] Raw URL이 200으로 열리는지 확인
  - `https://raw.githubusercontent.com/zemyblue/ai-briefing-dashboard/main/public/data/latest.json`
