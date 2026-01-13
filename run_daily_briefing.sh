#!/bin/bash

# 환경 변수 설정 (Node.js 및 글로벌 npm 패키지 경로 포함)
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin:/Users/zemyblue/.nvm/versions/node/v20.0.0/bin

# 프로젝트 디렉토리로 이동
cd /Users/zemyblue/Documents/projects/ai_dashboard/ai-briefing-dashboard

# 로그 파일 설정
LOG_FILE="./logs/briefing.log"
mkdir -p ./logs

echo "=== [$(date)] AI 브리핑 생성 시작 ===" >> "$LOG_FILE"

# 3. 브리핑 생성 스크립트 실행 (JSON 파일 생성 & DB 저장)
echo "[$(date)] Generating Briefing Data..." >> "$LOG_FILE"
/usr/local/bin/node scripts/generate-briefing.js >> "$LOG_FILE" 2>&1

EXIT_CODE=$?

# 4. GitHub 자동 배포 (Cloudflare Pages Trigger)
# 데이터가 변경되었으므로 Git에 Commit & Push 하여 배포를 유도합니다.
echo "[$(date)] Pushing to GitHub..." >> "$LOG_FILE"
git add public/data/briefing.json
# 날짜가 이미 같은 날짜로 commited 되어 있을 수 있으므로 allow-empty 또는 변경사항 체크
if [[ `git status --porcelain` ]]; then
  git commit -m "chore: update daily briefing data [$(date +'%Y-%m-%d')]" >> "$LOG_FILE" 2>&1
  git push origin main >> "$LOG_FILE" 2>&1
  echo "[$(date)] Successfully pushed to GitHub!" >> "$LOG_FILE"
else
  echo "[$(date)] No changes to push." >> "$LOG_FILE"
fi

echo "[$(date)] Done!" >> "$LOG_FILE"

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ 브리핑 생성 성공" >> "$LOG_FILE"
else
  echo "❌ 브리핑 생성 실패 (Exit Code: $EXIT_CODE)" >> "$LOG_FILE"
fi

echo "=== [$(date)] 종료 ===" >> "$LOG_FILE"
