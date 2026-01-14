# AI Daily Briefing - 빠른 시작 가이드

## 🚀 로컬에서 실행하기

### 1. 프로젝트 디렉토리로 이동
```bash
cd /Users/zemyblue/Documents/projects/ai_dashboard/ai-briefing-dashboard
```

### 2. Gemini API 키 설정

#### API 키 발급
1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. **Get API Key** 클릭
3. API 키 복사

#### .env 파일 생성
```bash
# 프로젝트 루트에서 실행
echo "GEMINI_API_KEY=YOUR_API_KEY_HERE" > .env
```

**또는 직접 파일 생성:**
```bash
# .env 파일 내용
GEMINI_API_KEY=AIzaSy...  # 실제 API 키로 변경
```

### 3. 브리핑 생성 테스트
```bash
node scripts/generate-briefing.js
```

**성공 시 출력:**
```
🤖 Gemini에게 질문 중...
✅ 브리핑 데이터 파일 생성 완료: /path/to/public/data/briefing.json
--- 요약 ---
키워드: AI, 머신러닝, ...
```

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

---

## 📝 주의사항

### ⚠️ 올바른 디렉토리에서 실행하세요!

**❌ 잘못된 예:**
```bash
cd /Users/zemyblue/Documents/projects/ai_dashboard
node scripts/generate-briefing.js  # 오류!
```

**✅ 올바른 예:**
```bash
cd /Users/zemyblue/Documents/projects/ai_dashboard/ai-briefing-dashboard
node scripts/generate-briefing.js  # 성공!
```

### 🔑 .env 파일 확인

```bash
# .env 파일이 있는지 확인
ls -la .env

# .env 파일 내용 확인 (API 키는 숨겨짐)
cat .env
```

---

## 🎯 다음 단계

1. ✅ 로컬 테스트 완료
2. 📖 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 읽기
3. 🚀 GitHub에 Push
4. 🔑 GitHub Secrets 설정
5. 🌐 Cloudflare Pages 배포

---

## 📚 관련 문서

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**: 배포 가이드
- **[GEMINI_API_GUIDE.md](./GEMINI_API_GUIDE.md)**: Gemini API 상세 가이드
- **[HOWTOINSTALL.md](./HOWTOINSTALL.md)**: 설치 가이드
- **[README.md](./README.md)**: 프로젝트 개요
