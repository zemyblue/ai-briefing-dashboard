# 🚀 AI Daily Briefing: 최종 배포 가이드

이 가이드는 **방안 3 (dates.json + GitHub Raw)** 방식으로 프로젝트를 배포하는 방법을 안내합니다.

---

## 📋 아키텍처 개요

```
┌─────────────────────────────────────────────┐
│  GitHub Actions (매일 오전 9시 자동 실행)    │
│  1. 브리핑 데이터 생성 (Claude API)          │
│  2. 날짜별 JSON 파일 저장                    │
│  3. latest.json, dates.json 업데이트         │
│  4. Git Push                                │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  GitHub Repository (Public)                 │
│  public/data/                               │
│    ├── latest.json         (최신 브리핑)     │
│    ├── dates.json          (날짜 목록)       │
│    └── 2026/01/14.json     (날짜별 브리핑)   │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Cloudflare CDN (자동 캐싱)                  │
│  GitHub Raw 콘텐츠 캐싱                      │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Cloudflare Pages (1회 배포)                │
│  - 코드 변경 시에만 재배포                   │
│  - 런타임에 GitHub Raw에서 JSON 로드         │
└─────────────────────────────────────────────┘
```

---

## 1️⃣ GitHub 레포지토리 설정

### 1단계: 레포지토리 Public으로 변경

현재 Private 레포지토리를 Public으로 변경합니다.

1. GitHub 레포지토리 페이지 → **Settings**
2. 하단 **Danger Zone** → **Change visibility**
3. **Make public** 선택
4. 레포지토리 이름 입력하여 확인

### 2단계: GitHub Secrets 설정

GitHub 레포지토리 → **Settings** → **Secrets and variables** → **Actions**

**New repository secret** 클릭하여 추가:

| Secret Name | 설명 | 필수 여부 |
|------------|------|-----------|
| `ANTHROPIC_API_KEY` | Claude API 키 | ✅ 필수 |

---

## 2️⃣ 코드 수정

### GitHub 사용자명 업데이트

다음 파일들에서 `YOUR_USERNAME`을 실제 GitHub 사용자명으로 변경:

#### 1. `src/app/page.tsx`
```typescript
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/ai-briefing-dashboard/main/public/data';
```

#### 2. `src/app/archive/page.tsx`
```typescript
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/ai-briefing-dashboard/main/public/data';
```

#### 3. `src/app/archive/[date]/page.tsx`
```typescript
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/ai-briefing-dashboard/main/public/data';
```

**예시:** 사용자명이 `zemyblue`라면:
```typescript
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/zemyblue/ai-briefing-dashboard/main/public/data';
```

---

## 3️⃣ 초기 데이터 생성 (로컬)

배포 전에 초기 데이터를 생성합니다.

```bash
# 1. 환경 변수 설정 (선택사항 - Claude CLI 사용 시)
# Claude CLI 로그인
claude login

# 2. 데이터 생성
node scripts/init-db.js
node scripts/generate-briefing.js

# 3. 생성 확인
ls -lh public/data/briefing.json

# 4. Git Push
git add public/data/
git commit -m "chore: add initial briefing data"
git push
```

---

## 4️⃣ Cloudflare Pages 배포

### 방법 1: GitHub 연동 (추천)

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) 로그인
2. **Workers & Pages** → **Create application** → **Pages**
3. **Connect to Git** 선택
4. GitHub 레포지토리 선택: `ai-briefing-dashboard`
5. **Build settings**:
   - **Framework preset**: `Next.js`
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
6. **Save and Deploy** 클릭

### 방법 2: Wrangler CLI (수동)

```bash
# 1. 빌드
npm run build

# 2. Wrangler 설치
npm install -g wrangler

# 3. Cloudflare 로그인
wrangler login

# 4. 배포
wrangler pages deploy out --project-name=ai-briefing-dashboard
```

---

## 5️⃣ GitHub Actions 테스트

### 수동 실행

1. GitHub 레포지토리 → **Actions** 탭
2. **Daily Briefing Update** 워크플로우 선택
3. **Run workflow** 클릭
4. 실행 결과 확인

### 자동 실행 확인

- 매일 한국 시간 오전 9시에 자동 실행됩니다
- Actions 탭에서 실행 기록 확인 가능

---

## 6️⃣ 확인 사항

### ✅ 체크리스트

- [ ] 레포지토리가 Public으로 변경되었는가?
- [ ] `ANTHROPIC_API_KEY` Secret이 설정되었는가?
- [ ] 코드에서 `YOUR_USERNAME`이 실제 사용자명으로 변경되었는가?
- [ ] 초기 데이터가 생성되었는가? (`public/data/briefing.json`)
- [ ] Cloudflare Pages 배포가 완료되었는가?
- [ ] 사이트에서 브리핑이 정상적으로 표시되는가?

### 🔗 URL 확인

- **사이트**: `https://ai-briefing-dashboard.pages.dev`
- **최신 데이터**: `https://raw.githubusercontent.com/YOUR_USERNAME/ai-briefing-dashboard/main/public/data/latest.json`
- **날짜 목록**: `https://raw.githubusercontent.com/YOUR_USERNAME/ai-briefing-dashboard/main/public/data/dates.json`

---

## 7️⃣ 일일 운영

### 자동 업데이트

- **시간**: 매일 한국 시간 오전 9시
- **작업**: GitHub Actions가 자동으로 실행
  1. 브리핑 데이터 생성
  2. JSON 파일 업데이트
  3. Git Push
- **사이트**: 자동으로 최신 데이터 표시 (재배포 불필요)

### 수동 업데이트

필요시 수동으로 데이터를 업데이트할 수 있습니다:

```bash
# 로컬에서
node scripts/generate-briefing.js

# 날짜별 파일 생성
DATE=$(date +%Y-%m-%d)
YEAR=$(date +%Y)
MONTH=$(date +%m)
DAY=$(date +%d)

mkdir -p public/data/$YEAR/$MONTH
cp public/data/briefing.json public/data/$YEAR/$MONTH/$DAY.json
cp public/data/briefing.json public/data/latest.json

# Git Push
git add public/data/
git commit -m "chore: manual update [$DATE]"
git push
```

---

## 8️⃣ 문제 해결

### GitHub Actions 실패

**증상**: Actions 탭에서 워크플로우 실패

**해결**:
1. 실패한 워크플로우 클릭 → 로그 확인
2. 주요 확인 사항:
   - `ANTHROPIC_API_KEY` Secret이 설정되었는가?
   - API 키가 유효한가?
   - Claude CLI 권한 문제는 없는가?

### 데이터가 표시되지 않음

**증상**: 사이트에서 "데이터를 불러올 수 없습니다" 메시지

**해결**:
1. 브라우저 개발자 도구 (F12) → Console 탭 확인
2. Network 탭에서 JSON 파일 로드 실패 확인
3. URL이 올바른지 확인:
   - `YOUR_USERNAME`이 실제 사용자명으로 변경되었는가?
   - 레포지토리가 Public인가?
   - `public/data/latest.json` 파일이 존재하는가?

### dates.json이 비어있음

**증상**: 아카이브 페이지에 날짜 목록이 없음

**해결**:
```bash
# 로컬에서 dates.json 생성
echo '{"dates":[' > public/data/dates.json
find public/data -type f -name "*.json" -path "*/[0-9][0-9][0-9][0-9]/[0-9][0-9]/*.json" | \
  sed 's|public/data/\([0-9]\{4\}\)/\([0-9]\{2\}\)/\([0-9]\{2\}\)\.json|\1-\2-\3|' | \
  sort -r | \
  sed 's/.*/"&"/' | \
  paste -sd ',' - >> public/data/dates.json
echo ']}' >> public/data/dates.json

# Git Push
git add public/data/dates.json
git commit -m "chore: regenerate dates.json"
git push
```

---

## 9️⃣ 비용 및 제한

### GitHub Actions
- **무료 플랜**: 월 2,000분
- **예상 사용량**: 하루 5분 × 30일 = 150분/월
- **결론**: ✅ 충분함

### GitHub Repository
- **무료 플랜**: 1GB 저장소
- **예상 사용량**: 10KB × 365일 × 10년 = ~36MB
- **결론**: ✅ 충분함 (1GB의 3.6%)

### Cloudflare Pages
- **무료 플랜**: 월 500 빌드, 무제한 요청
- **예상 사용량**: 코드 변경 시에만 빌드 (월 1~2회)
- **결론**: ✅ 충분함

---

## 🎉 완료!

이제 완전 자동화된 AI 브리핑 시스템이 구축되었습니다!

- ✅ 매일 오전 9시 자동 업데이트
- ✅ Cloudflare Pages에서 호스팅
- ✅ GitHub에서 데이터 관리
- ✅ 완전 무료

**사이트 URL**: `https://ai-briefing-dashboard.pages.dev`

---

## 📞 추가 지원

- **GitHub Issues**: 문제 발생 시 이슈 생성
- **문서**: [README.md](./README.md), [HOWTOINSTALL.md](./HOWTOINSTALL.md)
