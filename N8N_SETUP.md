# n8n 워크플로우 설정 가이드 (호스팅 서비스용)

## 📌 목표
호스팅된 n8n 서비스에서 매일 오전 9시에 GitHub Actions를 트리거하여 AI 브리핑 데이터를 생성하고 Cloudflare Pages에 자동 배포합니다.

---

## 🏗️ 아키텍처

```
┌─────────────────────┐
│   n8n (호스팅)      │  매일 오전 9시
│  Schedule Trigger   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  HTTP Request       │  GitHub API 호출
│  (repository_       │  (repository_dispatch)
│   dispatch)         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  GitHub Actions     │  1. 브리핑 생성
│                     │  2. 빌드
│                     │  3. Cloudflare 배포
└─────────────────────┘
```

---

## 🔑 사전 준비: GitHub Personal Access Token 생성

n8n에서 GitHub API를 호출하려면 Personal Access Token이 필요합니다.

### 1단계: GitHub에서 토큰 생성

1. GitHub 로그인 → 우측 상단 프로필 클릭 → **Settings**
2. 좌측 메뉴 하단 → **Developer settings**
3. **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**
4. 토큰 설정:
   - **Note**: `n8n-automation` (토큰 이름)
   - **Expiration**: `No expiration` 또는 원하는 기간
   - **Select scopes**: 
     - ✅ `repo` (전체 선택)
5. **Generate token** 클릭
6. **생성된 토큰을 복사** (한 번만 표시됨!)

### 2단계: 토큰 안전하게 보관

- 토큰을 안전한 곳에 저장 (비밀번호 관리자 등)
- 절대 코드나 공개 저장소에 노출하지 말 것

---

## 🔧 n8n 워크플로우 생성 (단계별)

### 1단계: n8n 접속

호스팅 중인 n8n 서비스에 로그인합니다.

### 2단계: 새 워크플로우 만들기

1. **+ New workflow** 버튼 클릭
2. 워크플로우 이름을 **"AI Daily Briefing - GitHub Trigger"**로 변경

### 3단계: Schedule Trigger 노드 추가

1. 캔버스에서 **"+"** 버튼 클릭
2. 검색창에 **"Schedule Trigger"** 입력 후 선택
3. 노드 설정:
   - **Trigger Interval**: `Cron` 선택
   - **Cron Expression**: `0 9 * * *`
     - 매일 오전 9시 (n8n 서버 시간 기준)
   - **Timezone**: `Asia/Seoul` (한국 시간)

> 💡 **Cron 표현식 설명**: `0 9 * * *`
> - `0`: 0분
> - `9`: 9시
> - `*`: 매일
> - `*`: 매월
> - `*`: 모든 요일

### 4단계: HTTP Request 노드 추가

1. Schedule Trigger 노드 우측의 **"+"** 버튼 클릭
2. 검색창에 **"HTTP Request"** 입력 후 선택
3. 노드 설정:

#### 기본 설정
- **Method**: `POST`
- **URL**: 
  ```
  https://api.github.com/repos/YOUR_USERNAME/ai-briefing-dashboard/dispatches
  ```
  > ⚠️ `YOUR_USERNAME`을 실제 GitHub 사용자명으로 변경!

#### Authentication
- **Authentication**: `Generic Credential Type` 선택
- **Generic Auth Type**: `Header Auth` 선택
- **Credential for Header Auth** 클릭하여 새 credential 생성:
  - **Name**: `GitHub-API-Token`
  - **Header Name**: `Authorization`
  - **Header Value**: `token YOUR_GITHUB_TOKEN`
    > ⚠️ `YOUR_GITHUB_TOKEN`을 실제 토큰으로 변경!
    > 예: `token ghp_1234567890abcdefghijklmnopqrstuvwxyz`

#### Headers
**Options** → **Add Option** → **Headers** 선택 후 추가:

| Name | Value |
|------|-------|
| `Accept` | `application/vnd.github.v3+json` |
| `User-Agent` | `n8n-automation` |

#### Body
- **Body Content Type**: `JSON`
- **Specify Body**: `Using JSON`
- **JSON**:
  ```json
  {
    "event_type": "daily-briefing"
  }
  ```

### 5단계: (선택사항) 알림 노드 추가

성공/실패 알림을 받고 싶다면 추가 노드를 연결할 수 있습니다:
- **Slack** 노드
- **Discord** 노드
- **Email** 노드

### 6단계: 워크플로우 저장 및 활성화

1. 우측 상단 **"Save"** 버튼 클릭
2. 우측 상단 **"Active"** 토글을 **ON**으로 변경 (초록색)

---

## ✅ 테스트 방법

### 수동 실행 테스트

1. n8n 워크플로우에서 **"Test workflow"** 버튼 클릭
2. Schedule Trigger 노드의 **"Execute node"** 클릭
3. HTTP Request 노드가 성공적으로 실행되는지 확인
4. GitHub 레포지토리로 이동:
   - **Actions** 탭 클릭
   - **Daily Briefing Update** 워크플로우가 실행되는지 확인

### 자동 실행 확인

- 다음날 오전 9시에 자동으로 실행됩니다
- 확인 방법:
  1. **n8n**: Executions 탭에서 실행 기록 확인
  2. **GitHub Actions**: Actions 탭에서 워크플로우 실행 확인
  3. **Cloudflare Pages**: Deployments에서 배포 상태 확인

---

## 🚨 문제 해결

### HTTP Request 실패: 401 Unauthorized

**원인**: GitHub 토큰이 잘못되었거나 만료됨

**해결**:
1. GitHub에서 토큰이 유효한지 확인
2. n8n Credential 설정에서 토큰 재확인
3. `Authorization` 헤더 형식 확인: `token YOUR_TOKEN` (앞에 "token" 포함)

### HTTP Request 실패: 404 Not Found

**원인**: 레포지토리 URL이 잘못됨

**해결**:
1. URL 형식 확인: `https://api.github.com/repos/USERNAME/REPO_NAME/dispatches`
2. 레포지토리 이름이 정확한지 확인
3. 레포지토리가 public인지 확인 (또는 토큰에 private repo 권한이 있는지)

### GitHub Actions가 트리거되지 않음

**원인**: `event_type`이 워크플로우 파일과 일치하지 않음

**해결**:
1. n8n HTTP Request Body의 `event_type`: `daily-briefing`
2. GitHub Actions 워크플로우 파일(`.github/workflows/daily-briefing.yml`)의 `types`: `[daily-briefing]`
3. 두 값이 정확히 일치하는지 확인

### 시간대 문제

**원인**: n8n 서버 시간대와 한국 시간이 다름

**해결**:
1. Schedule Trigger 노드에서 **Timezone**: `Asia/Seoul` 설정 확인
2. 또는 UTC 기준으로 Cron 표현식 조정:
   - 한국 시간 09:00 = UTC 00:00
   - Cron: `0 0 * * *`

---

## 📊 워크플로우 구조 (최종)

```
┌─────────────────────────┐
│  Schedule Trigger       │
│  Cron: 0 9 * * *        │
│  (매일 오전 9시)        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  HTTP Request           │
│  POST /dispatches       │
│  event_type:            │
│    daily-briefing       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  (선택) Slack/Discord   │
│  알림 전송              │
└─────────────────────────┘
```

---

## 🔄 전체 플로우 요약

1. **n8n (오전 9시)**: Schedule Trigger 실행
2. **n8n → GitHub**: HTTP Request로 `repository_dispatch` 이벤트 발생
3. **GitHub Actions**: 워크플로우 시작
   - 브리핑 데이터 생성 (`scripts/generate-briefing.js`)
   - Next.js 빌드 (`npm run build`)
   - Cloudflare Pages 배포
4. **Cloudflare**: 새 버전 배포 완료
5. **사용자**: 최신 브리핑 확인!

---

## 🎯 추가 팁

### 여러 시간대에 실행하기

Cron 표현식을 수정하여 하루에 여러 번 실행할 수 있습니다:

```
0 9,18 * * *  # 오전 9시, 오후 6시
```

### 특정 요일만 실행하기

```
0 9 * * 1-5  # 월요일~금요일 오전 9시 (주말 제외)
```

### 실행 기록 확인

n8n에서:
- **Executions** 탭 → 과거 실행 기록 확인
- 각 실행의 입력/출력 데이터 확인 가능

---

이제 완전히 자동화된 AI 브리핑 시스템이 구축되었습니다! 🎉
