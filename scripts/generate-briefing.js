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

// GitHub 레포지토리 README 가져오기
async function fetchGitHubReadme(repoName) {
    if (!repoName || !repoName.includes('/')) return null;

    try {
        const response = await fetch(`https://api.github.com/repos/${repoName}/readme`, {
            headers: {
                'User-Agent': 'AI-Briefing-Dashboard',
                'Accept': 'application/vnd.github.v3.raw'
            }
        });

        if (response.ok) {
            const readme = await response.text();
            const excerpt = readme.substring(0, 1000);
            const cleaned = excerpt
                .replace(/^#{1,6}\s+/gm, '')
                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                .replace(/!\[.*?\]\(.*?\)/g, '')
                .trim();
            return cleaned.substring(0, 500) + '...';
        }
        return null;
    } catch (e) {
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

// GitHub Trending 데이터 가져오기 (공식 API 사용)
async function fetchGitHubTrending() {
    try {
        // GitHub 공식 검색 API로 최근 업데이트된 인기 레포 조회
        // 최근 1주일 이내 푸시된 레포 중 별이 많은 순으로 정렬
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const dateStr = weekAgo.toISOString().split('T')[0];

        // AI 관련 키워드로 검색하여 더 관련성 높은 결과 가져오기
        const query = `pushed:>${dateStr} stars:>500 topic:ai OR topic:machine-learning OR topic:llm OR topic:gpt`;
        const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=15`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'AI-Briefing-Dashboard',
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            console.warn('GitHub API 실패, 대체 검색 시도...', response.status);
            // 대체: AI 키워드 없이 일반 trending
            const fallbackQuery = `pushed:>${dateStr} stars:>1000`;
            const fallbackUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(fallbackQuery)}&sort=stars&order=desc&per_page=15`;
            const fallbackResponse = await fetch(fallbackUrl, {
                headers: {
                    'User-Agent': 'AI-Briefing-Dashboard',
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (!fallbackResponse.ok) return [];
            const fallbackData = await fallbackResponse.json();
            const fallbackRepos = fallbackData.items || [];

            if (fallbackRepos.length === 0) {
                console.warn('Fallback GitHub API returned no repositories');
                return [];
            }

            // README 내용 추가
            const reposWithReadme = await Promise.all(
                fallbackRepos.slice(0, 8).map(async (repo) => {
                    if (!repo || !repo.full_name) {
                        console.warn('Invalid repo object in fallback:', repo);
                        return null;
                    }
                    const readme = await fetchGitHubReadme(repo.full_name);
                    return {
                        name: repo.full_name,
                        description: repo.description || 'No description',
                        reason: `${repo.stargazers_count.toLocaleString()}개의 별을 받은 인기 프로젝트`,
                        stars: repo.stargazers_count || 0,
                        language: repo.language || 'Unknown',
                        url: repo.html_url,
                        readme_excerpt: readme
                    };
                })
            );
            return reposWithReadme.filter(Boolean);
        }

        const data = await response.json();
        const repos = data.items || [];

        if (repos.length === 0) {
            console.warn('GitHub API returned no repositories');
            return [];
        }

        // README 내용 추가
        const reposWithReadme = await Promise.all(
            repos.slice(0, 8).map(async (repo) => {
                if (!repo || !repo.full_name) {
                    console.warn('Invalid repo object:', repo);
                    return null;
                }
                const readme = await fetchGitHubReadme(repo.full_name);
                return {
                    name: repo.full_name,
                    description: repo.description || 'No description',
                    reason: `${repo.stargazers_count.toLocaleString()}개의 별을 받은 AI 프로젝트`,
                    stars: repo.stargazers_count || 0,
                    language: repo.language || 'Unknown',
                    url: repo.html_url,
                    readme_excerpt: readme
                };
            })
        );
        return reposWithReadme.filter(Boolean);
    } catch (e) {
        console.error('GitHub Trending 데이터 수집 실패:', e);
        return [];
    }
}

// HackerNews 최신 AI 관련 뉴스 가져오기
async function fetchHackerNews() {
    try {
        // HackerNews Top Stories API
        const topStoriesResponse = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
        const topStories = await topStoriesResponse.json();

        // 상위 100개 스토리 가져오기 (더 많은 AI 관련 뉴스 확보)
        const storyPromises = topStories.slice(0, 100).map(async (id) => {
            const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
            return storyResponse.json();
        });

        const stories = await Promise.all(storyPromises);

        // AI/ML 관련 키워드 필터링
        const aiKeywords = ['ai', 'ml', 'machine learning', 'deep learning', 'gpt', 'llm', 'neural', 'chatgpt', 'openai', 'artificial intelligence', 'transformer', 'model'];
        const aiStories = stories.filter(story => {
            if (!story || !story.title) return false;
            const text = (story.title + ' ' + (story.text || '')).toLowerCase();
            return aiKeywords.some(keyword => text.includes(keyword));
        });

        return aiStories.slice(0, 15).map(story => {
            // text가 있으면 HTML 태그 제거하고 본문 추가
            let storyText = '';
            if (story.text) {
                storyText = story.text
                    .replace(/<[^>]*>/g, '')
                    .replace(/&#x27;/g, "'")
                    .replace(/&quot;/g, '"')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .trim();
                storyText = storyText.substring(0, 2000) + (storyText.length > 2000 ? '...' : '');
            }

            return {
                title: story.title,
                link: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
                source: 'Hacker News',
                score: story.score || 0,
                text: storyText || null
            };
        });
    } catch (e) {
        console.error('HackerNews 데이터 수집 실패:', e);
        return [];
    }
}

// YouTube AI 관련 최신 영상 가져오기 (RSS 사용)
async function fetchYouTubeVideos() {
    try {
        // 유명 AI 채널의 최신 영상 (RSS 사용)
        const channels = [
            'UCYO_jab_esuFRV4b17AJtAw',  // 3Blue1Brown
            'UCbfYPyITQ-7l4upoX8nvctg',  // Two Minute Papers
            'UCUHW94eEFW7hkUMVaZz4eDg',  // Siraj Raval
        ];

        const videoPromises = channels.map(async (channelId) => {
            try {
                const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
                const xml = await response.text();

                // XML 파싱 (간단한 정규식 사용)
                const videoMatches = [...xml.matchAll(/<entry>[\s\S]*?<\/entry>/g)];
                const videos = videoMatches.slice(0, 3).map(match => {
                    const entry = match[0];
                    const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1];
                    const title = entry.match(/<title>(.*?)<\/title>/)?.[1];
                    const channelName = entry.match(/<name>(.*?)<\/name>/)?.[1];
                    const published = entry.match(/<published>(.*?)<\/published>/)?.[1];

                    // description 추출
                    const descriptionMatch = entry.match(/<media:description>([\s\S]*?)<\/media:description>/);
                    let description = '';
                    if (descriptionMatch && descriptionMatch[1]) {
                        description = descriptionMatch[1]
                            .replace(/<[^>]*>/g, '')
                            .replace(/&#x27;/g, "'")
                            .replace(/&quot;/g, '"')
                            .replace(/&amp;/g, '&')
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .trim();
                        description = description.substring(0, 500) + (description.length > 500 ? '...' : '');
                    }

                    return {
                        title: title || 'Unknown Title',
                        channel: channelName || 'Unknown Channel',
                        link: videoId ? `https://www.youtube.com/watch?v=${videoId}` : '',
                        thumbnail_url: videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '',
                        published: published || '',
                        description: description || null
                    };
                }).filter(v => v.link);

                return videos;
            } catch (e) {
                console.warn(`채널 ${channelId} RSS 수집 실패`);
                return [];
            }
        });

        const allVideos = (await Promise.all(videoPromises)).flat();
        return allVideos.slice(0, 8);
    } catch (e) {
        console.error('YouTube 데이터 수집 실패:', e);
        return [];
    }
}

async function generateBriefing() {
    console.log(`📅 ${today} AI 브리핑 생성 시작...`);

    // 1단계: 실제 데이터 수집
    console.log('📡 실제 데이터 수집 중...');
    const [githubRepos, hackerNewsStories, youtubeVideos] = await Promise.all([
        fetchGitHubTrending(),
        fetchHackerNews(),
        fetchYouTubeVideos()
    ]);

    console.log(`✅ GitHub 트렌딩: ${githubRepos.length}개`);
    console.log(`✅ HackerNews: ${hackerNewsStories.length}개`);
    console.log(`✅ YouTube: ${youtubeVideos.length}개`);

    // 데이터가 너무 적으면 경고
    if (githubRepos.length === 0 && hackerNewsStories.length === 0 && youtubeVideos.length === 0) {
        console.error('❌ 수집된 데이터가 없습니다. 네트워크를 확인하세요.');
        process.exit(1);
    }

    // 2단계: AI에게 실제 데이터를 기반으로 분석 및 한국어 요약 요청
    const prompt = `
    당신은 20년차 시니어 개발자이자 AI 전문가입니다.
    아래는 오늘(${today}) 수집한 실제 AI 관련 데이터입니다.

    === GitHub 트렌딩 레포지토리 ===
    ${JSON.stringify(githubRepos, null, 2)}

    === Hacker News AI 뉴스 ===
    ${JSON.stringify(hackerNewsStories, null, 2)}

    === YouTube AI 영상 ===
    ${JSON.stringify(youtubeVideos, null, 2)}

    위 데이터를 분석하여 아래 JSON 형식으로 브리핑을 생성해주세요:

    **중요 규칙:**
    1. 위에 제공된 실제 데이터만 사용하세요. 절대 새로운 URL이나 데이터를 만들지 마세요.
    2. 뉴스는 HackerNews 데이터를 기반으로 한국어 제목, 요약, 상세 내용을 작성하세요.
    3. GitHub 레포는 제공된 데이터를 그대로 사용하되, reason을 한국어로 번역하세요.
    4. YouTube 영상은 제공된 데이터를 그대로 사용하세요.
    5. keywords는 오늘의 주요 AI 트렌드 키워드 5개를 추출하세요.
    6. 각 항목은 최대 5개까지만 선택하세요 (중요도 순).

    출력 형식 (JSON만 출력):
    {
      "date": "${today}",
      "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
      "news": [
        {
          "title": "한국어 제목",
          "summary": "1-2문장 요약",
          "content": "3-4문장 상세 설명",
          "link": "위에서 제공된 실제 URL",
          "tags": ["AI", "관련태그"]
        }
      ],
      "github_repos": [
        {
          "name": "위 데이터의 name",
          "description": "위 데이터의 description",
          "reason": "한국어로 번역된 트렌딩 이유",
          "stars": 위_데이터의_stars,
          "language": "위 데이터의 language",
          "url": "위 데이터의 url"
        }
      ],
      "youtube_videos": [
        {
          "title": "위 데이터의 title",
          "channel": "위 데이터의 channel",
          "link": "위 데이터의 link",
          "thumbnail_url": "위 데이터의 thumbnail_url",
          "views": ""
        }
      ]
    }
    `;

    const jsonString = await callOpenAI(prompt);

    if (jsonString) {
        try {
            const cleanJson = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleanJson);

            // --- 최종 검증 (실제 URL인지 확인) ---
            console.log("🔍 최종 데이터 검증 중...");

            // 뉴스 링크 재검증
            if (data.news && data.news.length > 0) {
                const newsPromises = data.news.map(async (item) => {
                    // example.com이나 가짜 URL 차단
                    if (!item.link || item.link.includes('example.com') || item.link === '#') {
                        return null;
                    }
                    // 실제 URL 검증
                    if (await validateUrl(item.link)) {
                        return item;
                    }
                    return null;
                });
                const validNews = (await Promise.all(newsPromises)).filter(Boolean);
                data.news = validNews.slice(0, 5);
                console.log(`📰 뉴스: ${data.news.length}개 검증 완료`);
            }

            // GitHub 레포 재검증
            if (data.github_repos && data.github_repos.length > 0) {
                const repoPromises = data.github_repos.map(async (repo) => {
                    if (await validateGitHubRepo(repo.name)) {
                        return repo;
                    }
                    console.log(`❌ 유효하지 않은 레포: ${repo.name}`);
                    return null;
                });
                const validRepos = (await Promise.all(repoPromises)).filter(Boolean);
                data.github_repos = validRepos.slice(0, 5);
                console.log(`💻 GitHub: ${data.github_repos.length}개 검증 완료`);
            }

            // YouTube 검증
            if (data.youtube_videos && data.youtube_videos.length > 0) {
                data.youtube_videos = await validateVideoList(data.youtube_videos);
                data.youtube_videos = data.youtube_videos.slice(0, 5);
                console.log(`📺 YouTube: ${data.youtube_videos.length}개 검증 완료`);
            }

            // 파일로 저장
            const outputDir = path.join(__dirname, '../public/data');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            const outputPath = path.join(outputDir, 'briefing.json');
            fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
            console.log(`✅ 브리핑 데이터 파일 생성 완료: ${outputPath}`);

            // DB에 저장
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
            process.exit(1);
        }
    } else {
        console.log("❌ OpenAI로부터 응답을 받지 못했습니다.");
        process.exit(1);
    }
}

generateBriefing();

