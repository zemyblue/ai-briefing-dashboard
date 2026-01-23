require('dotenv').config();

const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const cheerio = require('cheerio');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_MODEL_CANDIDATES = (process.env.GEMINI_MODEL_CANDIDATES || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);

if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
    process.exit(1);
}

// RSS Parser 초기화
const parser = new Parser({
    timeout: 10000,
    customFields: {
        item: ['media:content', 'media:thumbnail', 'enclosure']
    }
});

// 랜덤 검색 키워드 리스트 (재미있는 토픽)
const SEARCH_TOPICS = [
    'AI Review', 'AI Tool', 'AI Meme', 'Artificial Intelligence funny',
    'GPT funny moments', 'AI fails', 'AI vs Human', 'AI art',
    'ChatGPT tricks', 'AI tutorial', 'Machine learning explained'
];

// RSS 피드 소스
const RSS_SOURCES = {
    reddit_chatgpt: 'https://www.reddit.com/r/ChatGPT/top/.rss?t=day',
    reddit_singularity: 'https://www.reddit.com/r/Singularity/top/.rss?t=day',
    theverge_ai: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    techcrunch_ai: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    simulated: 'https://simulated.substack.com/feed'
};

const now = new Date();
const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
}).format(now);

const today = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
}).format(now);

/**
 * Gemini API 호출 (REST API 직접 사용)
 */
async function callGemini(prompt, maxRetries = 3) {
    console.log("🤖 Gemini에게 질문 중...");

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const modelCandidates = [
        GEMINI_MODEL,
        ...GEMINI_MODEL_CANDIDATES,
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.5-pro',
        'gemini-1.5-flash'
    ]
        .map((m) => m.trim())
        .filter(Boolean)
        .filter((model, index, self) => self.indexOf(model) === index);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        let lastError = null;
        let hitRateLimit = false;

        for (const modelName of modelCandidates) {
            try {
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: [{
                        role: 'user',
                        parts: [{
                            text: prompt
                        }]
                    }]
                });

                const text = response?.text;
                if (typeof text !== 'string' || text.trim().length === 0) {
                    throw new Error('응답이 비어있습니다.');
                }

                return text.trim();
            } catch (error) {
                lastError = error;
                const message = typeof error?.message === 'string' ? error.message : String(error);

                if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('QUOTA')) {
                    hitRateLimit = true;
                    break;
                }

                if (message.includes('404') || message.includes('NOT_FOUND') || message.includes('is not found')) {
                    continue;
                }
            }
        }

        if (lastError) {
            const message = typeof lastError?.message === 'string' ? lastError.message : String(lastError);
            console.error(`Gemini API 오류 (시도 ${attempt + 1}/${maxRetries}):`, message);
        }

        if (hitRateLimit) {
            const waitTime = Math.pow(2, attempt) * 2000;
            console.log(`${waitTime / 1000}초 대기 중...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
        }

        if (attempt === maxRetries - 1 && lastError) {
            throw lastError;
        }
    }

    return null;
}

/**
 * RSS 피드 파싱
 */
async function fetchRSSFeed(url) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; AI-Briefing-Bot/1.0)'
            }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            return [];
        }

        const xml = await response.text();
        const feed = await parser.parseString(xml);
        return feed.items || [];
    } catch (error) {
        console.warn(`RSS 파싱 실패 (${url}):`, error.message);
        return [];
    }
}

/**
 * 웹페이지 크롤링 (og:image, article body 추출)
 */
async function scrapeWebPage(url) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; AI-Briefing-Bot/1.0)'
            }
        });
        clearTimeout(timeoutId);

        if (!response.ok) return null;

        const html = await response.text();
        const $ = cheerio.load(html);

        // og:image 추출
        const ogImage = $('meta[property="og:image"]').attr('content') ||
                       $('meta[name="twitter:image"]').attr('content');

        // article body 추출
        let articleBody = '';
        $('article, .article-content, .post-content, .entry-content, main').each((i, el) => {
            const text = $(el).text().trim();
            if (text.length > articleBody.length) {
                articleBody = text;
            }
        });

        // 본문이 없으면 p 태그 모두 합치기
        if (!articleBody) {
            articleBody = $('p').map((i, el) => $(el).text()).get().join('\n\n').trim();
        }

        return {
            ogImage: ogImage || null,
            articleBody: articleBody ? articleBody.substring(0, 3000) : null
        };
    } catch (error) {
        console.warn(`크롤링 실패 (${url}):`, error.message);
        return null;
    }
}

/**
 * 모든 RSS 소스에서 뉴스 수집
 */
async function fetchAllRSSNews() {
    console.log('📡 RSS 뉴스 수집 중...');

    const allNews = [];

    // 각 소스에서 RSS 파싱
    const feedPromises = Object.entries(RSS_SOURCES).map(async ([source, url]) => {
        const items = await fetchRSSFeed(url);
        return items.map(item => ({
            source: getSourceName(source),
            title: item.title || '',
            link: item.link || '',
            pubDate: item.pubDate || '',
            contentSnippet: item.contentSnippet || item.summary || ''
        }));
    });

    const results = await Promise.all(feedPromises);
    results.forEach(news => allNews.push(...news));

    console.log(`✅ 총 ${allNews.length}개의 뉴스 수집됨`);
    return allNews;
}

/**
 * 소스 이름 변환
 */
function getSourceName(source) {
    const names = {
        reddit_chatgpt: 'Reddit r/ChatGPT',
        reddit_singularity: 'Reddit r/Singularity',
        theverge_ai: 'The Verge AI',
        techcrunch_ai: 'TechCrunch AI',
        simulated: 'Simulated'
    };
    return names[source] || source;
}

/**
 * YouTube 랜덤 검색
 */
async function searchYouTubeVideos(topic = null) {
    if (!YOUTUBE_API_KEY) {
        console.warn('⚠️ YOUTUBE_API_KEY가 없어 YouTube 검색 건너뜀');
        return [];
    }

    const searchQuery = topic || SEARCH_TOPICS[Math.floor(Math.random() * SEARCH_TOPICS.length)];
    console.log(`🔍 YouTube 검색: "${searchQuery}"`);

    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?` +
            `part=snippet&type=video&maxResults=8&q=${encodeURIComponent(searchQuery)}&` +
            `order=relevance&key=${YOUTUBE_API_KEY}`
        );

        if (!response.ok) {
            console.warn('YouTube API 오류:', response.status);
            return [];
        }

        const data = await response.json();

        return (data.items || []).map(item => ({
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            videoId: item.id.videoId,
            link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
            description: item.snippet.description?.substring(0, 300) || ''
        }));
    } catch (error) {
        console.error('YouTube 검색 실패:', error);
        return [];
    }
}

/**
 * 딥 크롤링 - 뉴스에 추가 정보 추출
 */
async function enrichNewsWithCrawling(newsItems, limit = 10) {
    console.log('🕷️ 뉴스 딥 크롤링 중...');

    const enrichedItems = [];

    for (let i = 0; i < Math.min(newsItems.length, limit); i++) {
        const item = newsItems[i];
        console.log(`  ${i + 1}/${Math.min(newsItems.length, limit)}: ${item.title.substring(0, 50)}...`);

        const scraped = await scrapeWebPage(item.link);

        enrichedItems.push({
            ...item,
            ogImage: scraped?.ogImage,
            articleBody: scraped?.articleBody
        });

        // 1초 대기 (서버 부하 방지)
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ ${enrichedItems.length}개의 뉴스 딥 크롤링 완료`);
    return enrichedItems;
}

/**
 * V1 브리핑 데이터 생성
 */
async function generateBriefingV1() {
    console.log(`📅 ${today} V1 브리핑 생성 시작...`);

    // 1단계: 데이터 수집 (테스트용 - AI 없이)
    console.log('📡 데이터 수집 중...');

    const [rssNews, youtubeVideos] = await Promise.all([
        fetchAllRSSNews(),
        searchYouTubeVideos()
    ]);

    console.log(`✅ RSS 뉴스: ${rssNews.length}개`);
    console.log(`✅ YouTube: ${youtubeVideos.length}개`);

    // 테스트용 enrichedNews 생성
    const enrichedNews = rssNews.slice(0, 5).map(item => ({
        ...item,
        ogImage: item.ogImage,
        articleBody: item.contentSnippet
    }));

    console.log(`🔍 수집 완료: RSS ${rssNews.length}개, YouTube ${youtubeVideos.length}개`);


    // 데이터가 너무 적으면 경고
    if (enrichedNews.length === 0 && youtubeVideos.length === 0) {
        console.error('❌ 수집된 데이터가 없습니다.');
        process.exit(1);
    }

    // 3단계: Gemini AI에게 데이터 분석 및 요약 요청
    const prompt = `
당신은 위트 있고 유머러스한 테크 트렌드 세터입니다.
"Fun & Free AI Feed" 스타일로 재미있고 다채로운 AI 브리핑을 만들어주세요.

## 페르소나 지침:
- 딱딱한 요약가가 아닌, 친구들과 수다 떨듯 편안한 톤 사용
- 이모지 적극 활용하여 생동감 추가 🚀
- 기술적인 내용은 쉽게 풀어쓰되, 핵심은 놓치지 않기
- "가십", "반전", "충격" 요소가 있다면 강조
- 개발자와 일반인 모두 흥미를 느낄 수 있도록

## 분석 데이터:

=== RSS 뉴스 (${enrichedNews.length}개) ===
${enrichedNews.map((item, i) => `
[${i + 1}] 제목: ${item.title}
소스: ${item.source}
링크: ${item.link}
요약: ${item.contentSnippet}
${item.articleBody ? `본문: ${item.articleBody.substring(0, 500)}...` : ''}
${item.ogImage ? `이미지: ${item.ogImage}` : ''}
`).join('\n')}

=== YouTube 영상 (${youtubeVideos.length}개) ===
${youtubeVideos.map((video, i) => `
[${i + 1}] 제목: ${video.title}
채널: ${video.channel}
링크: ${video.link}
썸네일: ${video.thumbnail}
`).join('\n')}

## 출력 형식 (JSON만 출력):

{
  "schema_version": 1,
  "date": "${dateStr}",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "sections": {
    "hype_check": [
      {
        "title": "한국어 제목 (재미있게!)",
        "summary": "1-2문장 핵심 펀치라인",
        "content": "3-4문장 상세 설명",
        "link": "실제 URL",
        "source": "소스명",
        "og_image": "이미지 URL (있으면)",
        "tags": ["해시태그", "또는", "키워드"]
      }
    ],
    "tech_deep_dive": [
      {
        "title": "한국어 제목",
        "summary": "1-2문장 요약",
        "content": "3-4문장 상세 설명",
        "link": "실제 URL",
        "source": "소스명",
        "tags": ["Deep", "Dive"]
      }
    ],
    "watch_this": [
      {
        "title": "비디오 제목 (원본 유지)",
        "channel": "채널명",
        "link": "유튜브 링크",
        "thumbnail": "썸네일 URL",
        "description": "200자 내 설명"
      }
    ]
  }
}

## 중요 규칙:
1. 위에 제공된 실제 데이터만 사용하세요. 절대 새로운 URL 생성 금지
2. Hype Check: 가장 자극적이고 재미있는 뉴스 (Reddit, TheVerge)
3. Tech Deep Dive: 진지한 기술 분석 (TechCrunch, Simulated)
4. Watch This: YouTube 영상
5. 각 섹션 최대 5개 항목
6. 한국어로 작성 (헤드라인, 요약, 내용 모두)
7. JSON만 출력 (추가 설명 불필요)
`;

    const jsonString = await callGemini(prompt);

    if (!jsonString) {
        console.error('❌ Gemini로부터 응답을 받지 못했습니다.');
        process.exit(1);
    }

    try {
        const cleanJson = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanJson);

        console.log("🔍 최종 데이터 검증 중...");

        const schemaVersion = typeof data.schema_version === 'number' ? data.schema_version : 1;
        const rawSections = data.sections || {};

        const isValidLink = (link) => {
            return typeof link === 'string' && link.length > 0 && !link.includes('example.com') && link !== '#';
        };

        const normalizeNewsItem = (item) => {
            const ogImage = item?.og_image || item?.ogImage || null;
            const tags = Array.isArray(item?.tags) ? item.tags.filter((t) => typeof t === 'string') : [];

            return {
                title: typeof item?.title === 'string' ? item.title : '',
                summary: typeof item?.summary === 'string' ? item.summary : '',
                content: typeof item?.content === 'string' ? item.content : '',
                link: typeof item?.link === 'string' ? item.link : '',
                source: typeof item?.source === 'string' ? item.source : '',
                og_image: typeof ogImage === 'string' ? ogImage : null,
                tags
            };
        };

        const normalizeVideoItem = (item) => {
            return {
                title: typeof item?.title === 'string' ? item.title : '',
                channel: typeof item?.channel === 'string' ? item.channel : '',
                link: typeof item?.link === 'string' ? item.link : '',
                thumbnail: typeof item?.thumbnail === 'string' ? item.thumbnail : '',
                description: typeof item?.description === 'string' ? item.description : ''
            };
        };

        const rawHypeCheck = rawSections.hype_check || rawSections.hypeCheck || [];
        const rawTechDeepDive = rawSections.tech_deep_dive || rawSections.techDeepDive || [];
        const rawWatchThis = rawSections.watch_this || rawSections.watchThis || [];

        const normalizedData = {
            schema_version: schemaVersion,
            date: dateStr,
            keywords: Array.isArray(data.keywords) ? data.keywords.filter((k) => typeof k === 'string') : [],
            sections: {
                hype_check: (Array.isArray(rawHypeCheck) ? rawHypeCheck : []).filter((item) => isValidLink(item?.link)).map(normalizeNewsItem),
                tech_deep_dive: (Array.isArray(rawTechDeepDive) ? rawTechDeepDive : []).filter((item) => isValidLink(item?.link)).map(normalizeNewsItem),
                watch_this: (Array.isArray(rawWatchThis) ? rawWatchThis : []).filter((item) => isValidLink(item?.link)).map(normalizeVideoItem)
            }
        };

        console.log("🎯 최종 데이터:");
        console.log(`  - 키워드: ${normalizedData.keywords.join(', ') || '없음'}`);
        console.log(`  - Hype Check: ${normalizedData.sections.hype_check.length}개`);
        console.log(`  - Tech Deep Dive: ${normalizedData.sections.tech_deep_dive.length}개`);
        console.log(`  - Watch This: ${normalizedData.sections.watch_this.length}개`);

        const outputDir = path.join(__dirname, '../public/data');
        const [year, month] = dateStr.split('-');
        const monthDir = path.join(outputDir, year, month);
        if (!fs.existsSync(monthDir)) {
            fs.mkdirSync(monthDir, { recursive: true });
        }

        const datePath = path.join(monthDir, `${dateStr}.json`);
        fs.writeFileSync(datePath, JSON.stringify(normalizedData, null, 2));
        console.log(`✅ 날짜별 파일 생성: ${datePath}`);

        const latestPath = path.join(outputDir, 'latest.json');
        fs.writeFileSync(latestPath, JSON.stringify(normalizedData, null, 2));
        console.log(`✅ latest.json 업데이트: ${latestPath}`);

        const datesFile = path.join(outputDir, 'dates.json');
        let dates = [];
        if (fs.existsSync(datesFile)) {
            const parsedDates = JSON.parse(fs.readFileSync(datesFile, 'utf8'));
            dates = Array.isArray(parsedDates?.dates) ? parsedDates.dates : [];
        }
        if (!dates.includes(dateStr)) {
            dates.unshift(dateStr);
            dates = dates.sort().reverse();
        }
        fs.writeFileSync(datesFile, JSON.stringify({ dates }, null, 2));
        console.log(`✅ dates.json 업데이트: ${dates.length}개 날짜`);

        return normalizedData;
    } catch (error) {
        console.error("JSON 파싱 실패:", error);
        console.log("원본 응답:", jsonString);
        process.exit(1);
    }
}

// 실행
generateBriefingV1()
    .then(() => {
        console.log('✅ V1 브리핑 생성 완료!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ 브리핑 생성 실패:', error);
        process.exit(1);
    });
