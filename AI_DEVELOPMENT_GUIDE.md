# AI 개발 가이드 (AI Development Guide)

> 이 문서는 Codex, Claude, Gemini 등 모든 AI 어시스턴트가 이 프로젝트에서 작업할 때 반드시 참고해야 하는 가이드입니다.

---

## 📋 프로젝트 개요

**프로젝트명**: AI Briefing Dashboard  
**목적**: 매일 오전 9시 자동으로 AI 트렌드 브리핑 생성 및 표시  
**스택**: Next.js 16 (Static Export), TypeScript, Tailwind CSS, OpenAI API  
**배포**: Cloudflare Pages (정적 호스팅)  
**자동화**: GitHub Actions (일일 데이터 생성)

---

## ⚠️ 중요 제약사항 (CRITICAL CONSTRAINTS)

### 1. 정적 빌드 전용 (Static Export Only)

```javascript
// next.config.js
output: 'export'  // 절대 변경 금지!
```

**금지사항:**
- ❌ 동적 라우트 (`[param]`) 사용 불가
- ❌ Server Components의 동적 기능 사용 불가
- ❌ API Routes 사용 불가
- ❌ `getServerSideProps`, `getStaticProps` 사용 불가

**허용사항:**
- ✅ Client Components (`'use client'`)
- ✅ 클라이언트 사이드 데이터 fetching
- ✅ Static 페이지만 생성

### 2. CommonJS vs ES Modules

**CommonJS 사용 (ESLint 제외 필요):**
- `scripts/` - Node.js 스크립트
- `src/lib/` - DB 유틸리티

**ES Modules 사용:**
- `src/app/` - Next.js 앱
- `src/components/` - React 컴포넌트

### 3. 데이터 로딩 방식

```typescript
// ❌ 잘못된 방법 (서버 사이드)
const data = readFileSync('data.json');

// ✅ 올바른 방법 (클라이언트 사이드)
const response = await fetch('https://raw.githubusercontent.com/.../data.json');
const data = await response.json();
```

---

## 🏗️ 프로젝트 구조

```
ai-briefing-dashboard/
├── .github/workflows/
│   ├── ci.yml              # PR/Push 시 Lint/Test/Build
│   └── daily-briefing.yml  # 매일 오전 9시 데이터 생성
├── scripts/
│   ├── generate-briefing.js  # OpenAI API 호출 (CommonJS)
│   └── init-db.js            # DB 초기화 (CommonJS)
├── src/
│   ├── app/
│   │   ├── layout.tsx        # 루트 레이아웃
│   │   └── page.tsx          # 메인 페이지 (Client Component)
│   ├── components/
│   │   └── DailyBriefing.tsx # 브리핑 UI 컴포넌트
│   └── lib/
│       └── db.js             # SQLite DB 유틸 (CommonJS)
├── public/data/
│   ├── latest.json           # 최신 브리핑
│   ├── dates.json            # 날짜 목록
│   └── YYYY/MM/DD.json       # 날짜별 브리핑
└── out/                      # 빌드 출력 (Git 무시)
```

---

## 🔧 개발 워크플로우

### 필수 체크리스트 (MANDATORY CHECKLIST)

**모든 코드 변경 후 반드시 실행:**

```bash
# 1. Lint 체크
npm run lint

# 2. 테스트 실행
npm test

# 3. 빌드 확인
npm run build
```

**모두 통과해야만 커밋 가능!**

### 개발 프로세스

1. **기능 개발**
   ```bash
   git checkout -b feat/feature-name
   npm run dev  # 개발 서버 실행
   ```

2. **코드 작성**
   - TypeScript 타입 명시
   - ESLint 규칙 준수
   - 컴포넌트는 `'use client'` 명시

3. **테스트**
   ```bash
   npm run lint   # ESLint 체크
   npm test       # 테스트 실행
   npm run build  # 빌드 확인
   ```

4. **커밋 & Push**
   ```bash
   git add -A
   git commit -m "feat: add feature"
   git push origin feat/feature-name
   ```

5. **PR 생성**
   - GitHub에서 PR 생성
   - CI 자동 실행 확인
   - 모든 체크 통과 확인

---

## 📝 코딩 규칙 (Coding Rules)

### TypeScript

```typescript
// ✅ 좋은 예
interface Props {
  title: string;
  count: number;
}

export default function Component({ title, count }: Props) {
  const [data, setData] = useState<DataType | null>(null);
  // ...
}

// ❌ 나쁜 예
export default function Component({ title, count }: any) {
  const [data, setData] = useState<any>(null);  // any 사용 금지!
  // ...
}
```

### React Components

```typescript
// ✅ 클라이언트 컴포넌트
'use client';

import { useState } from 'react';

export default function MyComponent() {
  const [state, setState] = useState(0);
  return <div>{state}</div>;
}
```

### ESLint

```typescript
// ❌ 사용하지 않는 import
import { Hash, GitBranch } from 'lucide-react';  // 사용 안 함

// ✅ 필요한 것만 import
import { Star, Calendar } from 'lucide-react';

// ❌ 사용하지 않는 변수
catch (e) {  // e 사용 안 함
  console.error('Error');
}

// ✅ 변수 제거
catch {
  console.error('Error');
}
```

### HTML Entities

```typescript
// ❌ 직접 사용
<h2>Today's Keywords</h2>

// ✅ HTML 엔티티 사용
<h2>Today&apos;s Keywords</h2>
```

---

## 🧪 테스트 구조

### 현재 상태

```json
{
  "scripts": {
    "test": "echo 'No tests yet' && exit 0"
  }
}
```

### 향후 테스트 추가 시

```typescript
// __tests__/components/DailyBriefing.test.tsx
import { render, screen } from '@testing-library/react';
import DailyBriefing from '@/components/DailyBriefing';

describe('DailyBriefing', () => {
  it('renders correctly', () => {
    const props = {
      date: '2026-01-15',
      keywords: ['AI', 'ML'],
      news: [],
      github_repos: [],
      youtube_videos: []
    };
    
    render(<DailyBriefing {...props} />);
    expect(screen.getByText('AI Trend Briefing')).toBeInTheDocument();
  });
});
```

---

## 🚨 일반적인 실수 (Common Mistakes)

### 1. 동적 라우트 추가

```typescript
// ❌ 절대 금지!
// src/app/archive/[date]/page.tsx
export default function DatePage({ params }: { params: { date: string } }) {
  // 정적 빌드와 호환 불가!
}
```

**해결책**: 클라이언트 사이드에서 처리하거나 기능 제거

### 2. 서버 사이드 데이터 로딩

```typescript
// ❌ 정적 빌드에서 작동 안 함
import { readFileSync } from 'fs';

export default function Page() {
  const data = readFileSync('data.json');  // 빌드 타임에만 실행
}
```

**해결책**: 클라이언트 사이드 fetch 사용

### 3. any 타입 사용

```typescript
// ❌ ESLint 오류
const [data, setData] = useState<any>(null);

// ✅ 명시적 타입 사용
const [data, setData] = useState<DataType | null>(null);
```

### 4. CommonJS와 ES Modules 혼용

```javascript
// ❌ scripts/에서 ES Modules 사용
import fs from 'fs';  // 오류!

// ✅ CommonJS 사용
const fs = require('fs');
```

---

## 🔄 CI/CD 파이프라인

### PR 생성 시

```yaml
# .github/workflows/ci.yml
1. Checkout code
2. Install dependencies
3. Run ESLint        # 실패 시 PR 블록
4. Run Tests         # 실패 시 PR 블록
5. Build             # 실패 시 PR 블록
6. Upload artifacts
```

### 매일 오전 9시 (KST)

```yaml
# .github/workflows/daily-briefing.yml
1. Checkout code
2. Install dependencies
3. Generate briefing  # OpenAI API 호출
4. Organize data      # 날짜별 파일 생성
5. Commit & Push      # GitHub에 데이터 푸시
```

---

## 📦 배포 프로세스

### Cloudflare Pages

1. **GitHub 연동**
   - Framework: Next.js
   - Build command: `npm run build`
   - Output directory: `out`

2. **환경 변수**
   - 빌드 시: 불필요 (클라이언트 사이드 로딩)
   - GitHub Actions: `OPENAI_API_KEY` 필요

3. **배포 트리거**
   - Main 브랜치 merge 시 자동 배포
   - 데이터 변경은 배포 트리거 안 함

---

## 🛠️ 디버깅 가이드

### 빌드 실패 시

```bash
# 1. TypeScript 오류 확인
npm run build

# 2. 타입 오류 확인
# Type error: Type '{}' is missing properties...
# → 타입 정의 확인 및 수정

# 3. 정적 빌드 호환성 확인
# Page "/[param]" is missing generateStaticParams()
# → 동적 라우트 제거 또는 클라이언트 사이드 처리
```

### ESLint 오류 시

```bash
# 1. 오류 확인
npm run lint

# 2. 자동 수정 시도
npx eslint --fix .

# 3. 수동 수정
# - 사용하지 않는 import 제거
# - 사용하지 않는 변수 제거
# - any 타입 제거
```

---

## 📚 참고 자료

- [Next.js Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [OpenAI API](https://platform.openai.com/docs)

---

## ✅ 작업 완료 체크리스트

**모든 작업 완료 후 반드시 확인:**

- [ ] `npm run lint` 통과 (0 errors, 0 warnings)
- [ ] `npm test` 통과
- [ ] `npm run build` 성공
- [ ] `out/` 디렉토리 생성 확인
- [ ] Git 커밋 메시지 작성 (conventional commits)
- [ ] GitHub에 Push
- [ ] CI 통과 확인

**절대 잊지 말 것:**
> "Lint → Test → Build" 순서로 모두 통과해야만 커밋!

---

## 🎯 핵심 원칙 (Core Principles)

1. **정적 빌드 우선**: 모든 기능은 정적 빌드와 호환되어야 함
2. **타입 안전성**: TypeScript 타입을 명시적으로 정의
3. **코드 품질**: ESLint 규칙 100% 준수
4. **자동화**: 반복 작업은 GitHub Actions로 자동화
5. **문서화**: 모든 변경사항은 문서에 반영

---

**마지막 업데이트**: 2026-01-15  
**작성자**: AI Development Team
