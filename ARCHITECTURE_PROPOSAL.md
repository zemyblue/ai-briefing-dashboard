# 🏗️ AI Daily Briefing: 호스팅 서비스 아키텍처 제안서

로컬 환경(내 컴퓨터)이 아닌 24시간 돌아가는 서버(호스팅 서비스)에서 이 서비스를 운영하기 위한 "AI 협업 아키텍처"를 제안합니다.

## 1. 문제점 분석
*   **현재 방식**: `claude-cli`를 사용. 이는 사용자가 로그인을 한 로컬 터미널에서만 작동함.
*   **서버 환경**: Vercel, AWS, GitHub Actions 같은 서버는 화면(브라우저)이 없고, `claude-cli` 인증을 유지하기 어려움.

## 2. 해결 방안: "API 기반 오케스트레이션"
Code CLI 대신 **표준 API**를 사용하여 어느 서버에서든 실행 가능한 구조로 변경합니다.

### 추천 스택 (Collaboration Stack)
1.  **Orchestrator (지휘)**: **Next.js API Route** 또는 **GitHub Actions**
2.  **Logic & Writing (작가)**: **Anthropic API (Claude 3.5 Sonnet)**
    *   *역할*: 뉴스 요약, 트렌드 분석, JSON 데이터 포맷팅
    *   *이유*: 가장 사람 같은 자연스러운 한국어 작문 능력
3.  **Search & Fact Check (조사)**: **Tavily API** 또는 **Perplexity API**
    *   *역할*: 최신 실시간 뉴스(오늘 날짜) 검색, 유튜브 최신 영상 링크 수집
    *   *이유*: LLM은 최신 정보를 모르므로 검색 API가 필수.
4.  **Database**: **Turso (LibSQL)** 또는 **Supabase (PostgreSQL)**
    *   *역할*: 데이터 영구 저장
    *   *이유*: Vercel 같은 서버리스 환경은 로컬 SQLite 파일 저장이 불가능함(휘발성). 클라우드 DB 필요.

## 3. 구현 로드맵 (Step-by-Step)

### Step A: API 키 준비
*   `ANTHROPIC_API_KEY` 발급 (Claude 사용료 결제 필요)
*   `TAVILY_API_KEY` 발급 (실시간 검색용, 무료 티어 있음)

### Step B: 코드 변경
1.  `scripts/generate-briefing.js` 폐기 -> `src/app/api/cron/route.ts` 생성
2.  로컬 SQLite(`npm install better-sqlite3`) -> 클라우드 DB 클라이언트(`npm install @libsql/client`)

### Step C: 자동화 설정
*   **Vercel Cron** 사용: `vercel.json`에 매일 9시 실행 작업 등록.
*   또는 **n8n (Self-hosted)**: n8n이 `https://내사이트.com/api/cron` 주소를 매일 아침 GET 요청.

---

## 4. 예시 코드 (Next.js API Route)
*아래 코드를 `src/app/api/generate/route.ts`로 저장하여 사용 가능*

```typescript
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // 1. 보안 체크 (Cron Secret)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. 검색 (Tavily 등) - 실제로는 외부 API 호출
    const searchResults = await fetchNewsFromSearchAPI(); 

    // 3. LLM 생성 (Claude API 직접 호출)
    const briefingData = await generateWithClaudeAPI(searchResults);

    // 4. DB 저장 (Cloud DB)
    await saveToCloudDB(briefingData);

    return NextResponse.json({ success: true, date: briefingData.date });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```
