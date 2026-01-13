# n8n 워크플로우 설정 가이드

## 📌 목표
매일 오전 9시에 자동으로 AI 브리핑 데이터를 생성하고 GitHub에 푸시하여 Cloudflare Pages가 자동 배포되도록 설정합니다.

---

## 🔧 n8n 워크플로우 생성 (단계별)

### 1단계: n8n 접속
브라우저에서 `http://192.168.0.71:5678/` 접속

### 2단계: 새 워크플로우 만들기
1. 좌측 상단 **"+ Add workflow"** 버튼 클릭
2. 워크플로우 이름을 **"AI Daily Briefing"**으로 변경 (상단 입력란)

### 3단계: Schedule Trigger 노드 추가
1. 캔버스에서 **"+"** 버튼 클릭
2. 검색창에 **"Schedule"** 입력
3. **"Schedule Trigger"** 선택
4. 노드 설정:
   - **Trigger Interval**: `Days` 선택
   - **Days Between Triggers**: `1`
   - **Trigger at Hour**: `9` (오전 9시)
   - **Trigger at Minute**: `0`
   - **Timezone**: `Asia/Seoul` (한국 시간)
5. **"Execute"** 버튼 클릭하여 테스트

### 4단계: Execute Command 노드 추가
1. Schedule Trigger 노드 우측의 **"+"** 버튼 클릭
2. 검색창에 **"Execute Command"** 입력
3. **"Execute Command"** 선택
4. 노드 설정:
   - **Command**: 
     ```bash
     /bin/bash /Users/zemyblue/Documents/projects/ai_dashboard/ai-briefing-dashboard/run_daily_briefing.sh
     ```

### 5단계: 워크플로우 저장 및 활성화
1. 우측 상단 **"Save"** 버튼 클릭
2. 우측 상단 **"Active"** 토글을 **ON**으로 변경 (파란색으로 바뀜)

---

## ✅ 테스트 방법

### 수동 실행 테스트
1. Schedule Trigger 노드 선택
2. **"Test step"** 또는 **"Execute node"** 클릭
3. Execute Command 노드로 전파되는지 확인
4. 터미널에서 로그 확인:
   ```bash
   tail -f /Users/zemyblue/Documents/projects/ai_dashboard/ai-briefing-dashboard/logs/briefing.log
   ```

### 자동 실행 확인
- 다음날 오전 9시에 자동으로 실행됩니다
- GitHub 레포지토리에 새 커밋이 푸시되었는지 확인
- Cloudflare Pages 대시보드에서 자동 배포가 시작되었는지 확인

---

## 🚨 문제 해결

### "Permission denied" 에러
```bash
chmod +x /Users/zemyblue/Documents/projects/ai_dashboard/ai-briefing-dashboard/run_daily_briefing.sh
```

### Git push 실패
- GitHub Personal Access Token이 설정되어 있는지 확인
- `git config --global credential.helper store` 실행 후 한 번 수동으로 push

### n8n이 파일에 접근하지 못하는 경우
- n8n이 Docker로 실행 중이라면 볼륨 마운트 필요:
  ```bash
  docker run -v /Users/zemyblue:/Users/zemyblue ...
  ```

---

## 📊 워크플로우 구조 (시각적 참고)

```
┌─────────────────────┐
│  Schedule Trigger   │
│  (매일 09:00)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Execute Command    │
│  (run_daily_...)    │
└─────────────────────┘
```

이 워크플로우가 실행되면:
1. `generate-briefing.js` 실행 → Claude가 최신 AI 뉴스 수집
2. `public/data/briefing.json` 업데이트
3. `git add`, `git commit`, `git push` 자동 실행
4. GitHub 업데이트 감지 → Cloudflare Pages 자동 재배포
5. 웹사이트에 최신 브리핑 반영 완료!
