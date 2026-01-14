// .env 파일 로드 (로컬 개발용)
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { saveBriefing } = require('../src/lib/db');

// 오늘 날짜 포맷 (한국어)
const today = new Date().toLocaleDateString('ko-KR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

// OpenAI API 키 (환경 변수에서 가져오기)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.');
    console.error('GitHub Secrets에 OPENAI_API_KEY를 추가하거나, 로컬에서는 .env 파일을 사용하세요.');
    process.exit(1);
}

async function callOpenAI(prompt) {
    console.log("🤖 OpenAI에게 질문 중...");

    try {
        const response = await fetch(
            'https://api.openai.com/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',  // 가장 저렴한 모델
                    messages: [{
                        role: 'user',
                        content: prompt
                    }],
                    temperature: 0.7,
                    max_tokens: 8192,
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`OpenAI API 오류 (${response.status}):`, errorText);
            return null;
        }

        const data = await response.json();

        if (data.choices && data.choices[0] && data.choices[0].message) {
            const text = data.choices[0].message.content;
            return text.trim();
        } else {
            console.error('OpenAI API 응답 형식 오류:', JSON.stringify(data, null, 2));
            return null;
        }
    } catch (error) {
        console.error('OpenAI API 호출 실패:', error);
        return null;
    }
}

async function generateBriefing() {
    console.log(`📅 ${today} AI 브리핑 생성 시작...`);

    const prompt = `
    당신은 20년차 시니어 엔지니어이자 AI 전문가입니다.
    오늘(${today}) 기준으로 최신 AI 트렌드, 뉴스, GitHub 인기 리포지토리를 분석해서 브리핑 정보를 생성해주세요.

    다음 필드를 가진 JSON 객체 하나만 출력하세요. (주석이나 설명 금지, 마크다운 코드 블록 없이 순수 JSON만 출력):
    {
      "date": "${today}",
      "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
      "news": [
        {
          "title": "뉴스 제목 (한국어)",
          "summary": "뉴스 요약 2~3문장 (한국어, 개발자 관점)",
          "content": "뉴스의 상세 내용, 배경, 기술적 분석 등을 포함한 긴 글 (3~4 문단, 마크다운 형식 아님, 순수 텍스트)",
          "link": "관련 URL (없으면 #, 유효한 실제 링크 권장)",
          "tags": ["태그1", "태그2"]
        },
        ... (5개, 단순 요약이 아닌 심층 분석 내용 포함)
      ],
      "github_repos": [
        {
          "name": "user/repo",
          "description": "프로젝트 설명 (한국어)",
          "reason": "이 프로젝트가 왜 지금 트렌딩인지 설명 (예: OpenAI 새 API 지원, 해커뉴스 1위 등)",
          "stars": 1000,
          "language": "Python, etc",
          "url": "https://github.com/..."
        },
        ... (5개, 실제 존재하는 최신 트렌딩 AI 프로젝트 위주)
      ],
      "youtube_videos": [
        {
          "title": "영상 제목 (한국어)",
          "channel": "채널명",
          "link": "https://www.youtube.com/watch?v=VIDEO_ID (반드시 실제 존재하는 특정 영상의 직접 링크여야 함)",
          "thumbnail_url": "", 
          "views": "조회수"
        },
        ... (5개, 최근 1개월 이내에 올라온 영상 중, 이전에 다루지 않은 신선한 AI 기술 심층 리뷰나 튜토리얼)
      ]
    }
    
    데이터는 모두 '한국어'로 작성되어야 합니다. 뉴스나 설명이 영어라면 한국어로 번역해서 출력하세요. 
    유튜브 링크는 절대 검색 결과 페이지(results?search_query=...)가 아니어야 하며, 개별 영상 URL이어야 합니다.
    `;

    const jsonString = await callOpenAI(prompt);

    if (jsonString) {
        try {
            // Gemini가 마크다운 코드 블록(```json ... ```)을 포함할 수 있으므로 제거
            const cleanJson = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleanJson);

            // 1. 파일로 저장
            const outputDir = path.join(__dirname, '../public/data');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            const outputPath = path.join(outputDir, 'briefing.json');
            fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
            console.log(`✅ 브리핑 데이터 파일 생성 완료: ${outputPath}`);

            // 2. DB에 저장
            saveBriefing(today, data);

            // 미리보기 출력
            console.log("--- 요약 ---");
            console.log("키워드:", data.keywords ? data.keywords.join(', ') : '없음');
            console.log("뉴스 개수:", data.news ? data.news.length : 0);
            console.log("GitHub 저장소:", data.github_repos ? data.github_repos.length : 0);
            console.log("YouTube 영상:", data.youtube_videos ? data.youtube_videos.length : 0);

        } catch (e) {
            console.error("JSON 파싱 실패:", e);
            console.log("원본 응답:", jsonString);
        }
    } else {
        console.log("❌ OpenAI로부터 응답을 받지 못했습니다.");
    }
}

generateBriefing();

