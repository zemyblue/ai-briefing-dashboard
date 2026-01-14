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

// 일반 URL 유효성 검사 (뉴스 등)
async function validateUrl(url) {
    if (!url || url.includes('example.com') || url === '#') return false;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3초 타임아웃

        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; AI-Briefing-Bot/1.0)' // 봇 차단 방지
            }
        });
        clearTimeout(timeoutId);

        return response.ok;
    } catch (e) {
        // HEAD 메서드가 막힌 경우 GET으로 재시도 (일부 사이트 대응)
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            clearTimeout(timeoutId);
            return response.ok;
        } catch (e2) {
            console.warn(`URL 검증 실패: ${url}`);
            return false;
        }
    }
}

// GitHub 레포지토리 검증
async function validateGitHubRepo(repoName) {
    if (!repoName || !repoName.includes('/')) return false;

    try {
        const response = await fetch(`https://api.github.com/repos/${repoName}`, {
            headers: {
                'User-Agent': 'AI-Briefing-Dashboard'
            }
        });
        return response.status === 200;
    } catch (e) {
        console.warn(`GitHub 레포 검증 실패: ${repoName}`);
        return false;
    }
}

// YouTube 링크 유효성 검사 (oEmbed API 사용 - API Key 불필요)
async function validateYouTubeLink(url) {
    if (!url || !url.includes('youtube.com/watch')) {
        return false;
    }

    try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const response = await fetch(oembedUrl);

        if (response.status === 200) {
            // 유효한 비디오인 경우 썸네일 정보 등을 업데이트할 수 있음
            const data = await response.json();
            return {
                valid: true,
                title: data.title, // 실제 제목으로 교체 가능
                thumbnail_url: data.thumbnail_url
            };
        }
        return { valid: false };
    } catch (e) {
        console.warn(`YouTube 링크 검증 실패: ${url}`, e.message);
        return { valid: false };
    }
}

// 비디오 목록 검증 및 필터링 (병렬 처리)
async function validateVideoList(videos) {
    if (!videos || !Array.isArray(videos)) return [];

    console.log("🔍 YouTube 비디오 링크 검증 중...");

    // 병렬로 모든 비디오 검증 요청 시작
    const validationPromises = videos.map(async (video) => {
        const validation = await validateYouTubeLink(video.link);
        if (validation.valid) {
            console.log(`✅ 유효한 비디오: ${video.title}`);
            if (validation.thumbnail_url) video.thumbnail_url = validation.thumbnail_url;
            if (validation.title) video.title = validation.title;
            return video;
        } else {
            console.log(`❌ 유효하지 않은 비디오 (제거됨): ${video.link}`);
            return null;
        }
    });

    // 모든 검증이 끝날 때까지 대기 후 유효한 것만 필터링
    const results = await Promise.all(validationPromises);
    return results.filter(Boolean);
}

async function generateBriefing() {
    console.log(`📅 ${today} AI 브리핑 생성 시작...`);

    const prompt = `
    당신은 20년차 시니어 엔지니어이자 AI 전문가입니다.
    오늘(${today}) 기준으로 최신 AI 트렌드, 뉴스, GitHub 인기 리포지토리를 분석해서 브리핑 정보를 생성해주세요.
    
    ★ 중요: 실제 존재하는 데이터만 사용해야 합니다. URL을 모르면 절대 지어내지 말고 비워두세요.
    검증을 위해 각 항목을 넉넉하게 7~8개씩 생성해주세요. (검증 후 상위 5개만 사용합니다)

    다음 필드를 가진 JSON 객체 하나만 출력하세요:
    {
      "date": "${today}",
      "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
      "news": [
        {
          "title": "뉴스 제목 (한국어)",
          "summary": "뉴스 요약",
          "content": "상세 내용",
          "link": "실제 뉴스 URL",
          "tags": ["태그"]
        },
        ... (8개)
      ],
      "github_repos": [
        {
          "name": "owner/repo",
          "description": "설명",
          "reason": "트렌딩 이유",
          "stars": 1000,
          "language": "Python",
          "url": "https://github.com/owner/repo"
        },
        ... (8개, 'openai/gpt-4' 같은 가짜 레포 금지. 실제 존재하는 레포만.)
      ],
      "youtube_videos": [
        {
          "title": "영상 제목",
          "channel": "채널명",
          "link": "https://www.youtube.com/watch?v=...",
          "thumbnail_url": "", 
          "views": "조회수"
        },
        ... (8개)
      ]
    }
    `;

    const jsonString = await callOpenAI(prompt);

    if (jsonString) {
        try {
            // Gemini가 마크다운 코드 블록(```json ... ```)을 포함할 수 있으므로 제거
            const cleanJson = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleanJson);

            // --- 데이터 검증 및 필터링 시작 ---
            console.log("🔍 데이터 유효성 검증 시작...");

            // 1. 뉴스 검증 (병렬 처리)
            if (data.news) {
                const newsPromises = data.news.map(async (item) => {
                    if (await validateUrl(item.link)) return item;
                    return null;
                });
                const validNews = (await Promise.all(newsPromises)).filter(Boolean);
                data.news = validNews.slice(0, 5);
                console.log(`📰 뉴스: ${data.news.length}개 유효함`);
            }

            // 2. GitHub 검증 (병렬 처리)
            if (data.github_repos) {
                const repoPromises = data.github_repos.map(async (repo) => {
                    if (await validateGitHubRepo(repo.name)) return repo;
                    console.log(`❌ 가짜 레포 제거됨: ${repo.name}`);
                    return null;
                });
                const validRepos = (await Promise.all(repoPromises)).filter(Boolean);
                data.github_repos = validRepos.slice(0, 5);
                console.log(`💻 GitHub: ${data.github_repos.length}개 유효함`);
            }

            // 3. YouTube 검증 (병렬 처리된 함수 호출)
            if (data.youtube_videos) {
                data.youtube_videos = await validateVideoList(data.youtube_videos);
                if (data.youtube_videos.length > 5) {
                    data.youtube_videos = data.youtube_videos.slice(0, 5);
                }
                console.log(`📺 YouTube: ${data.youtube_videos.length}개 유효함`);
            }
            // --- 데이터 검증 끝 ---

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
            console.log("--- 최종 결과 ---");
            console.log("키워드:", data.keywords ? data.keywords.join(', ') : '없음');
            console.log("뉴스:", data.news ? data.news.length : 0);
            console.log("GitHub:", data.github_repos ? data.github_repos.length : 0);
            console.log("YouTube:", data.youtube_videos ? data.youtube_videos.length : 0);

        } catch (e) {
            console.error("JSON 파싱 실패:", e);
            console.log("원본 응답:", jsonString);
        }
    } else {
        console.log("❌ OpenAI로부터 응답을 받지 못했습니다.");
    }
}

generateBriefing();

