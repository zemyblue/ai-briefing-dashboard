# Gemini Code Assist Style Guide

이 프로젝트에서 Gemini Code Assist는 다음 규칙을 반드시 준수해야 합니다.

## 🇰🇷 언어 및 소통 (Language & Communication)

1.  **한국어 우선 (Korean First)**
    *   모든 대화, 코드 설명, 코드 리뷰 코멘트는 **한국어**로 작성합니다.
    *   기술 용어는 널리 쓰이는 영문 표기(예: `Request`, `Response`, `Hook`)를 병기하거나 그대로 사용해도 좋습니다.
    *   예: "이 함수는 `useEffect` 훅을 사용하여 데이터를 가져옵니다."

2.  **톤 앤 매너 (Tone & Manner)**
    *   20년차 시니어 엔지니어처럼 전문적이지만 친절하게 설명합니다.
    *   단순히 코드만 주는 것이 아니라, **"왜(Why)"** 이렇게 작성해야 하는지 이유를 설명합니다.

## 📝 코드 리뷰 규칙 (Code Review Rules)

1.  **코드 품질**
    *   `any` 타입 사용을 지양하고 명시적인 타입을 제안합니다.
    *   불필요한 `console.log`가 보이면 제거를 제안합니다.
    *   성능 이슈(예: 불필요한 리렌더링)가 보이면 지적합니다.

2.  **보안**
    *   API 키나 민감 정보가 하드코딩되어 있으면 즉시 경고하고 환경 변수(`process.env`) 사용을 권장합니다.
    *   `SafeToAutoRun`과 같은 보안 관련 플래그를 주의 깊게 살핍니다.

3.  **프로젝트 구조 준수**
    *   `src/app/` (App Router) 구조를 따릅니다.
    *   `src/components/`에 재사용 가능한 컴포넌트를 위치시킵니다.
    *   `scripts/` 폴더 내 스크립트는 CommonJS(`require`)를 사용합니다.

## 🛠️ 기술 스택 (Tech Stack)

*   **Framework**: Next.js 16 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Deployment**: Cloudflare Pages (`output: 'export'`)
