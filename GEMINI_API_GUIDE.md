# 🆓 Gemini API 사용 가이드

## ✨ Gemini API로 변경한 이유

- ✅ **완전 무료**: 신용카드 불필요
- ✅ **충분한 할당량**: 일일 1,500 요청 (Flash), 50 요청 (Pro)
- ✅ **빠른 응답**: Gemini 1.5 Flash는 매우 빠름
- ✅ **한국어 지원**: 우수한 한국어 성능

---

## 📊 Gemini API 무료 티어

### Gemini 1.5 Flash (현재 사용 중)
- **분당**: 15 요청
- **일일**: 1,500 요청
- **토큰**: 100만 토큰/분
- **속도**: 매우 빠름

### Gemini 1.5 Pro
- **분당**: 2 요청
- **일일**: 50 요청
- **토큰**: 32,000 토큰/분
- **품질**: 더 높은 품질

**하루 1회 브리핑 생성에는 충분합니다!**

---

## 🔑 Gemini API 키 발급

### 1단계: Google AI Studio 접속

1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. Google 계정으로 로그인

### 2단계: API 키 생성

1. **Get API Key** 또는 **Create API Key** 클릭
2. 프로젝트 선택 또는 새 프로젝트 생성
3. API 키 복사 (예: `AIzaSy...`)

### 3단계: API 키 저장

**로컬 개발:**
```bash
# .env 파일 생성 (프로젝트 루트)
echo "GEMINI_API_KEY=YOUR_API_KEY" > .env
```

**GitHub Actions:**
1. GitHub 레포지토리 → **Settings**
2. **Secrets and variables** → **Actions**
3. **New repository secret** 클릭
4. Name: `GEMINI_API_KEY`
5. Secret: API 키 붙여넣기

---

## 🔧 코드 변경 사항

### 1. `scripts/generate-briefing.js`

**변경 전 (Claude CLI):**
```javascript
const claude = spawn('claude', ['-p', prompt]);
```

**변경 후 (Gemini API):**
```javascript
const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
            }
        })
    }
);
```

### 2. `.github/workflows/daily-briefing.yml`

**변경 전:**
```yaml
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

**변경 후:**
```yaml
env:
  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

---

## 🧪 로컬 테스트

### 1. .env 파일 생성

```bash
# 프로젝트 루트에 .env 파일 생성
cat > .env << EOF
GEMINI_API_KEY=YOUR_ACTUAL_API_KEY
EOF
```

### 2. 테스트 실행

```bash
# 브리핑 생성 테스트
node scripts/generate-briefing.js

# 성공 시 출력:
# 🤖 Gemini에게 질문 중...
# ✅ 브리핑 데이터 파일 생성 완료: /path/to/public/data/briefing.json
# --- 요약 ---
# 키워드: AI, 머신러닝, ...
```

---

## 📈 비용 비교

| 항목 | Claude API | Gemini API |
|------|-----------|------------|
| **무료 티어** | ❌ 없음 | ✅ 있음 |
| **비용** | $15/월 (Pro) | **$0** |
| **일일 요청** | 제한 없음 (유료) | 1,500회 (Flash) |
| **신용카드** | 필요 | 불필요 |
| **한국어** | 우수 | 우수 |

**결론: Gemini API가 이 프로젝트에 완벽합니다!**

---

## 🚨 주의사항

### API 키 보안

1. **.env 파일을 Git에 커밋하지 마세요**
   ```bash
   # .gitignore에 추가 (이미 되어있음)
   .env
   .env.local
   ```

2. **API 키를 코드에 하드코딩하지 마세요**
   ```javascript
   // ❌ 나쁜 예
   const API_KEY = "AIzaSy...";
   
   // ✅ 좋은 예
   const API_KEY = process.env.GEMINI_API_KEY;
   ```

3. **GitHub Secrets 사용**
   - Public 레포지토리에서도 Secrets는 안전하게 보호됨
   - Actions 로그에 노출되지 않음

### API 제한

- **분당 15 요청**: 하루 1회 실행이므로 문제없음
- **일일 1,500 요청**: 충분함
- **토큰 제한**: 응답이 너무 길면 잘릴 수 있음 (maxOutputTokens: 8192)

---

## 🔄 모델 변경 (선택사항)

더 높은 품질이 필요하면 Gemini 1.5 Pro로 변경:

```javascript
// scripts/generate-briefing.js
const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
    // ...
);
```

**트레이드오프:**
- ✅ 더 높은 품질
- ❌ 느린 속도
- ❌ 일일 50회 제한

---

## ✅ 체크리스트

배포 전 확인:

- [ ] Gemini API 키 발급
- [ ] GitHub Secrets에 `GEMINI_API_KEY` 추가
- [ ] 로컬에서 테스트 (`node scripts/generate-briefing.js`)
- [ ] `.env` 파일이 `.gitignore`에 있는지 확인
- [ ] GitHub Actions 수동 실행 테스트

---

## 🎉 완료!

이제 **완전 무료**로 AI 브리핑 시스템을 운영할 수 있습니다!

- ✅ Gemini API: 무료
- ✅ GitHub Actions: 무료 (월 2,000분)
- ✅ Cloudflare Pages: 무료 (월 500 빌드)
- ✅ GitHub Repository: 무료 (1GB)

**총 비용: $0/월** 🎊
