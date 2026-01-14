# 🚀 AI Daily Briefing: 설치 가이드

> ⚠️ **중요**: 이 문서는 기본 설치 가이드입니다. **배포 및 자동화 설정**은 [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md)를 참조하세요.

---

## 📋 개요

이 프로젝트는 AI 기술 관련 최신 뉴스를 매일 자동으로 수집하여 브리핑하는 Next.js 기반 정적 웹사이트입니다.

### 주요 기능
- 📰 AI 관련 최신 뉴스 자동 수집
- 🔍 키워드 트렌드 분석
- 📊 GitHub 트렌딩 저장소
- 🎥 YouTube 인기 영상
- 🤖 Claude AI를 활용한 콘텐츠 생성

---

## 1️⃣ 로컬 개발 환경 설정

### 전제 조건
- **Node.js** 18 버전 이상
- **npm** 또는 **yarn**
- **Git**

### 설치 단계

```bash
# 1. 저장소 클론 (또는 다운로드)
git clone https://github.com/YOUR_USERNAME/ai-briefing-dashboard.git
cd ai-briefing-dashboard

# 2. 패키지 설치
npm install

# 3. 데이터베이스 초기화
node scripts/init-db.js

# 4. 개발 서버 실행
npm run dev
```

개발 서버가 실행되면 브라우저에서 `http://localhost:3000`으로 접속할 수 있습니다.

---

## 2️⃣ 프로젝트 구조

```
ai-briefing-dashboard/
├── .github/
│   └── workflows/
│       └── daily-briefing.yml    # GitHub Actions 워크플로우
├── public/
│   └── data/
│       └── briefing.json         # 브리핑 데이터
├── scripts/
│   ├── init-db.js                # DB 초기화
│   └── generate-briefing.js      # 브리핑 생성
├── src/
│   ├── app/                      # Next.js App Router
│   ├── components/               # React 컴포넌트
│   └── lib/                      # 유틸리티 함수
├── briefings.db                  # SQLite 데이터베이스
├── next.config.js                # Next.js 설정
└── package.json
```

---

## 3️⃣ 주요 명령어

### 개발

```bash
# 개발 서버 실행
npm run dev

# 타입 체크
npm run type-check

# 린트
npm run lint
```

### 빌드 및 배포

```bash
# 정적 사이트 빌드 (out 디렉토리 생성)
npm run build

# 빌드된 사이트 미리보기
npx serve out
```

### 데이터 생성

```bash
# 브리핑 데이터 수동 생성
node scripts/generate-briefing.js

# 데이터베이스 초기화
node scripts/init-db.js
```

---

## 4️⃣ 배포 및 자동화

### 로컬에서 빌드 → Cloudflare Pages 배포

자세한 배포 가이드는 **[`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md)**를 참조하세요.

이 가이드에서는 다음 내용을 다룹니다:
1. ✅ GitHub 레포지토리 설정
2. ✅ GitHub Actions 워크플로우 설정
3. ✅ Cloudflare Pages 연동
4. ✅ n8n을 통한 자동화 (호스팅 서비스)
5. ✅ 매일 자동 업데이트 설정

### n8n 자동화 설정

n8n을 사용한 자동화 설정은 **[`N8N_SETUP.md`](./N8N_SETUP.md)**를 참조하세요.

---

## 5️⃣ 환경 변수 (선택사항)

프로젝트는 기본적으로 환경 변수 없이 작동하지만, GitHub Actions에서 자동화를 위해서는 다음 환경 변수가 필요합니다:

| 변수명 | 설명 | 필수 여부 |
|--------|------|-----------|
| `ANTHROPIC_API_KEY` | Claude API 키 | GitHub Actions에서 필수 |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API 토큰 | 배포 시 필수 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 계정 ID | 배포 시 필수 |

> 💡 **로컬 개발 시**: Claude CLI가 설치되어 있다면 `claude login`으로 인증 후 사용 가능

---

## 6️⃣ 문제 해결

### 개발 서버가 시작되지 않음

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 데이터베이스 오류

```bash
# 데이터베이스 재초기화
rm briefings.db
node scripts/init-db.js
```

### 빌드 오류

```bash
# Next.js 캐시 삭제
rm -rf .next out
npm run build
```

---

## 7️⃣ 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript, JavaScript
- **스타일링**: CSS Modules
- **데이터베이스**: SQLite
- **AI**: Claude (Anthropic)
- **배포**: Cloudflare Pages
- **자동화**: GitHub Actions, n8n

---

## 8️⃣ 다음 단계

1. ✅ 로컬 개발 환경 설정 완료
2. 📖 [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) 읽기
3. 🚀 Cloudflare Pages에 배포
4. 🤖 n8n으로 자동화 설정
5. 🎉 매일 아침 최신 AI 브리핑 받기!

---

## 📞 도움이 필요하신가요?

- 배포 관련: [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md)
- n8n 설정: [`N8N_SETUP.md`](./N8N_SETUP.md)
- 아키텍처: [`ARCHITECTURE_PROPOSAL.md`](./ARCHITECTURE_PROPOSAL.md)

---

**Happy Coding! 🎉**

