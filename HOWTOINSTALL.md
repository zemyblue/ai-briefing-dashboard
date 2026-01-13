# 🚀 AI Daily Briefing: 설치 및 배포 가이드

이 프로젝트를 로컬에서 실행하거나, Cloudflare Pages와 같은 정적 호스팅 서비스에 배포하는 방법을 안내합니다.

## 1. 전제 조건 (Prerequisites)
*   **Node.js** 18 버전 이상
*   **Git** 설치 완료
*   **GitHub 계정** 및 레포지토리 생성
*   **Anthropic API Key** (Claude CLI 사용 시 필요)
*   **(선택) n8n** (자동화를 위한 도구)

## 2. 프로젝트 설정 (Local Setup)

1.  **패키지 설치**:
    ```bash
    npm install
    ```

2.  **환경 변수 설정**:
    (Claude CLI 로그인이 되어 있어야 합니다. 터미널에서 `claude login` 수행)

3.  **데이터 초기화**:
    ```bash
    node scripts/init-db.js
    ```

4.  **개발 서버 실행**:
    ```bash
    npm run dev
    ```

---

## 3. 정적 호스팅 배포 (Cloudflare Pages)

이 서비스는 매일 새로운 데이터로 업데이트되어야 합니다. 정적 호스팅(Static Hosting)을 사용하려면 **"데이터 갱신 -> Git Push -> 자동 배포"** 파이프라인을 구축해야 합니다.

### 단계 1: GitHub 업로드
1.  GitHub에 새 Repository를 만듭니다 (예: `ai-briefing-dashboard`).
2.  로컬 코드를 푸시합니다:
    ```bash
    git init
    git remote add origin https://github.com/YOUR_ID/ai-briefing-dashboard.git
    git add .
    git commit -m "Initial commit"
    git push -u origin main
    ```

### 단계 2: Cloudflare Pages 연결
1.  Cloudflare Dashboard에 로그인합니다.
2.  **Workers & Pages** -> **Create Application** -> **Connect to Git** 선택.
3.  방금 만든 GitHub 레포지토리를 선택합니다.
4.  **Build Settings**을 다음과 같이 설정합니다:
    *   **Framework Preset**: `Next.js (Static Export)`
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `out`
5.  **Save and Deploy** 클릭.

### 단계 3: 자동화 (n8n)
매일 아침 9시에 최신 뉴스를 받아오고 Cloudflare에 배포되도록 n8n을 설정합니다.

1.  **n8n**에서 새 워크플로우 생성.
2.  **Schedule Trigger** 노드 추가 (매일 09:00).
3.  **Execute Command** 노드 추가.
    *   Command:
        ```bash
        /bin/bash /Users/zemyblue/Documents/projects/ai_dashboard/ai-briefing-dashboard/run_daily_briefing.sh
        ```
    *   *주의: 이 스크립트 내부에는 `git push` 명령어가 포함되어 있어야 Cloudflare가 변경사항을 감지합니다.*

---

## 4. API 등록 및 키 관리 (API Strategy)

현재 이 프로젝트는 로컬 **Claude CLI**를 사용하므로 별도의 API Key를 코드에 박아넣을 필요가 없습니다. 하지만 추후 Vercel/Cloudflare Functions와 같은 **서버리스(Serverless)** 환경으로 완전히 이전하려면 다음 API가 필요합니다.

1.  **Anthropic API (Claude)**
    *   [console.anthropic.com](https://console.anthropic.com) 접속 -> API Key 발급
    *   `.env.local` 파일에 `ANTHROPIC_API_KEY=sk-...` 추가.

2.  **Tavily API (검색)**
    *   [tavily.com](https://tavily.com) 접속 -> API Key 발급
    *   `.env.local` 파일에 `TAVILY_API_KEY=tvly-...` 추가.

이렇게 설정하면 `run_daily_briefing.sh` 대신 Next.js API Route(`src/app/api/cron/route.ts`)를 호출하는 것만으로 업데이트가 가능해집니다.
