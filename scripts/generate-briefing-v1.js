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

const SEARCH_TOPICS = [
    'Gemini 2.5 Flash tutorial',
    'LLM agents tutorial',
    'RAG implementation tutorial',
    'Vector database comparison 2026',
    'LangGraph tutorial',
    'Model Context Protocol MCP tutorial',
    'vLLM deployment guide',
    'CUDA for AI inference optimization',
    'OpenAI compatible API self host',
    'Prompt engineering for developers',
    'AI coding assistant workflow',
    'Indie hacker AI SaaS build log'
];

// RSS 피드 소스
const RSS_SOURCES = {
    reddit_chatgpt: 'https://www.reddit.com/r/ChatGPT/top/.rss?t=day',
    reddit_singularity: 'https://www.reddit.com/r/Singularity/top/.rss?t=day',

    arxiv_cs_ai: 'https://rss.arxiv.org/rss/cs.AI',
    arxiv_cs_lg: 'https://rss.arxiv.org/rss/cs.LG',
    arxiv_cs_cl: 'https://rss.arxiv.org/rss/cs.CL',
    openai_news: 'https://openai.com/blog/rss.xml',
    hf_blog: 'https://huggingface.co/blog/feed.xml',
    hn_llm: 'https://hnrss.org/newest?q=LLM',
    hn_llm_best: 'https://hnrss.org/best?q=LLM',
    hn_rag: 'https://hnrss.org/newest?q=RAG',
    hn_rag_best: 'https://hnrss.org/best?q=RAG',
    hn_ai_agents: 'https://hnrss.org/newest?q=AI%20agent',
    hn_ai_agents_best: 'https://hnrss.org/best?q=AI%20agent',

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

        const ogImage = $('meta[property="og:image"]').attr('content') ||
                       $('meta[name="twitter:image"]').attr('content');

        let articleBody = '';
        $('article, .article-content, .post-content, .entry-content, main').each((i, el) => {
            const text = $(el).text().trim();
            if (text.length > articleBody.length) {
                articleBody = text;
            }
        });

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


async function fetchAnthropicNews(limit = 20) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch('https://www.anthropic.com/news', {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; AI-Briefing-Bot/1.0)'
            }
        });
        clearTimeout(timeoutId);

        if (!response.ok) return [];

        const html = await response.text();
        const $ = cheerio.load(html);

        const items = [];
        const seen = new Set();

        $('a[href^="/news/"]').each((_, el) => {
            if (items.length >= limit) return;

            const href = $(el).attr('href');
            if (typeof href !== 'string') return;
            if (seen.has(href)) return;
            seen.add(href);

            const link = `https://www.anthropic.com${href}`;
            const title = $(el)
                .find('h1, h2, h3, h4, h5, h6, [class*="__title"]')
                .first()
                .text()
                .trim();
            const pubDate = $(el).find('time').first().text().trim();
            const contentSnippet = $(el).find('p').first().text().trim();

            if (!title) return;

            items.push({
                source: 'Anthropic News',
                title,
                link,
                pubDate,
                contentSnippet
            });
        });

        return items;
    } catch {
        return [];
    }
}

/**
 * 모든 RSS 소스에서 뉴스 수집
 */
async function fetchAllRSSNews() {
    console.log('📡 RSS 뉴스 수집 중...');

    const allNews = [];

    const feedPromises = [
        ...Object.entries(RSS_SOURCES).map(async ([source, url]) => {
            const items = await fetchRSSFeed(url);
            return items.map(item => {
                const rawContent = item.content || item['content:encoded'] || '';
                const imgMatch = typeof rawContent === 'string' ? rawContent.match(/<img[^>]+src="([^"]+)"/i) : null;
                const ogImage = imgMatch?.[1] || null;

                return {
                    source: getSourceName(source),
                    title: item.title || '',
                    link: item.link || '',
                    pubDate: item.pubDate || '',
                    contentSnippet: item.contentSnippet || item.summary || '',
                    ogImage
                };
            });
        }),
        fetchAnthropicNews()
    ];

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
        arxiv_cs_ai: 'arXiv cs.AI',
        arxiv_cs_lg: 'arXiv cs.LG',
        arxiv_cs_cl: 'arXiv cs.CL',
        openai_news: 'OpenAI News',
        hf_blog: 'Hugging Face Blog',
        hn_llm: 'Hacker News (LLM)',
        hn_llm_best: 'Hacker News (LLM)',
        hn_rag: 'Hacker News (RAG)',
        hn_rag_best: 'Hacker News (RAG)',
        hn_ai_agents: 'Hacker News (AI agents)',
        hn_ai_agents_best: 'Hacker News (AI agents)',
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

    const isRedditSource = (source) => typeof source === 'string' && source.toLowerCase().includes('reddit');

    const uniqueByLink = (items) => {
        const seen = new Set();
        return items.filter((item) => {
            const link = item?.link;
            if (typeof link !== 'string' || link.length === 0) return false;
            if (seen.has(link)) return false;
            seen.add(link);
            return true;
        });
    };

    const isHackerNewsInternalLink = (link) => {
        return typeof link === 'string' && link.includes('news.ycombinator.com');
    };

    const takeBySource = (items, sourceName, limit) => {
        let filtered = items.filter((item) => item.source === sourceName);

        if (sourceName.startsWith('Hacker News')) {
            filtered = filtered.filter((item) => !isHackerNewsInternalLink(item.link));
        }

        return filtered.slice(0, limit);
    };

    const deepDivePool = rssNews.filter((item) => !isRedditSource(item.source));

    const deepDiveCandidates = uniqueByLink([
        ...takeBySource(deepDivePool, 'OpenAI News', 8),
        ...takeBySource(deepDivePool, 'Anthropic News', 8),
        ...takeBySource(deepDivePool, 'Hugging Face Blog', 8),
        ...takeBySource(deepDivePool, 'Hacker News (LLM)', 6),
        ...takeBySource(deepDivePool, 'Hacker News (RAG)', 6),
        ...takeBySource(deepDivePool, 'Hacker News (AI agents)', 6),
        ...takeBySource(deepDivePool, 'The Verge AI', 8),
        ...takeBySource(deepDivePool, 'TechCrunch AI', 8),
        ...takeBySource(deepDivePool, 'Simulated', 8),
        ...takeBySource(deepDivePool, 'arXiv cs.AI', 10),
        ...takeBySource(deepDivePool, 'arXiv cs.LG', 10),
        ...takeBySource(deepDivePool, 'arXiv cs.CL', 10)
    ]);

    const hypeCandidates = uniqueByLink(rssNews.filter((item) => isRedditSource(item.source))).slice(0, 25);

    const deepDiveEnriched = await enrichNewsWithCrawling(deepDiveCandidates, 8);

    const enrichedNewsForPrompt = [...deepDiveEnriched, ...hypeCandidates].map(item => ({
        ...item,
        ogImage: item.ogImage,
        articleBody: item.articleBody || item.contentSnippet
    }));

    console.log(`🔍 수집 완료: RSS ${rssNews.length}개, YouTube ${youtubeVideos.length}개`);


    if (enrichedNewsForPrompt.length === 0 && youtubeVideos.length === 0) {
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

=== 글/기사 후보 (Tech Deep Dive) (${deepDiveCandidates.length}개) ===
 ${deepDiveCandidates.map((item, i) => `
 [${i + 1}] 제목: ${item.title}
 소스: ${item.source}
 링크: ${item.link}
 요약: ${item.contentSnippet}
 `).join('\n')}

=== 가벼운 이슈 후보 (Hype Check) (${hypeCandidates.length}개) ===
 ${hypeCandidates.map((item, i) => `
 [${i + 1}] 제목: ${item.title}
 소스: ${item.source}
 링크: ${item.link}
 요약: ${item.contentSnippet}
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
 2. hype_check는 반드시 "가벼운 이슈 후보"의 링크만 사용
 3. tech_deep_dive는 반드시 "글/기사 후보"의 링크만 사용 (YouTube 링크 금지)
 4. watch_this는 반드시 YouTube 영상 목록의 링크만 사용
 5. tech_deep_dive, hype_check 항목의 link는 서로 중복되면 안 됨
 6. tech_deep_dive는 가능하면 다음 소스 중 최소 3개 이상 포함: OpenAI News, Anthropic News, Hugging Face Blog, Hacker News
 7. hype_check는 더 많이 뽑아도 됩니다 (권장 10~18개)
 8. tech_deep_dive는 더 많이 뽑아도 됩니다 (권장 10~18개)
 9. watch_this는 더 많이 뽑아도 됩니다 (권장 8~15개)
  10. 한국어로 작성 (헤드라인, 요약, 내용 모두)
  11. JSON만 출력 (추가 설명 불필요)
  `;

    const jsonString = await callGemini(prompt);

    if (!jsonString) {
        console.error('❌ Gemini로부터 응답을 받지 못했습니다.');
        process.exit(1);
    }

    try {
        const stripFences = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonStart = stripFences.indexOf('{');
        const jsonEnd = stripFences.lastIndexOf('}');
        const rawJson = jsonStart >= 0 && jsonEnd >= 0 ? stripFences.slice(jsonStart, jsonEnd + 1) : stripFences;

        const sanitizeJson = (input) => {
            let out = '';
            let inString = false;
            let isEscaped = false;

            for (let i = 0; i < input.length; i++) {
                const ch = input[i];

                if (isEscaped) {
                    out += ch;
                    isEscaped = false;
                    continue;
                }

                if (ch === '\\') {
                    out += ch;
                    isEscaped = true;
                    continue;
                }

                if (inString && (ch === '\n' || ch === '\r')) {
                    out += ch === '\n' ? '\\n' : '\\r';
                    continue;
                }

                if (ch === '"') {
                    if (!inString) {
                        inString = true;
                        out += ch;
                        continue;
                    }

                    let j = i + 1;
                    while (j < input.length && /\s/.test(input[j])) j++;
                    const next = j < input.length ? input[j] : '';
                    const isTerminator = next === ',' || next === '}' || next === ']' || next === ':';

                    if (isTerminator) {
                        inString = false;
                        out += ch;
                        continue;
                    }

                    out += '\\"';
                    continue;
                }

                out += ch;
            }

            return out;
        };

        const data = JSON.parse(sanitizeJson(rawJson));

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


        const fetchRedditPreviewImage = async (link) => {
            try {
                if (typeof link !== 'string') return null;
                const match = link.match(/\/comments\/([^/\s?#]+)/);
                const postId = match?.[1];
                if (!postId) return null;

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                const url = `https://www.reddit.com/comments/${postId}.json?raw_json=1`;

                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; AI-Briefing-Bot/1.0)'
                    }
                });
                clearTimeout(timeoutId);

                if (!response.ok) return null;

                const payload = await response.json();
                const post = payload?.[0]?.data?.children?.[0]?.data;
                const imageUrl = post?.preview?.images?.[0]?.source?.url;

                return typeof imageUrl === 'string' ? imageUrl : null;
            } catch {
                return null;
            }
        };

        const backfillOgImages = async (items, limit) => {
            const filled = [...items];
            const max = Math.min(typeof limit === 'number' ? limit : 0, filled.length);

            for (let i = 0; i < max; i++) {
                const current = filled[i];
                if (!current || current.og_image) continue;
                if (typeof current.link !== 'string' || current.link.length === 0) continue;

                if (current.link.includes('reddit.com')) {
                    const redditImage = await fetchRedditPreviewImage(current.link);
                    if (redditImage) {
                        filled[i] = { ...current, og_image: redditImage };
                        continue;
                    }
                }

                const scraped = await scrapeWebPage(current.link);
                if (scraped?.ogImage && typeof scraped.ogImage === 'string') {
                    filled[i] = { ...current, og_image: scraped.ogImage };
                }
            }

            return filled;
        };

        const rawHypeCheck = rawSections.hype_check || rawSections.hypeCheck || [];
        const rawTechDeepDive = rawSections.tech_deep_dive || rawSections.techDeepDive || [];
        const rawWatchThis = rawSections.watch_this || rawSections.watchThis || [];

        const isYouTubeLink = (link) => {
            if (typeof link !== 'string') return false;
            return link.includes('youtube.com') || link.includes('youtu.be');
        };

        const uniqueByLink = (items) => {
            const seen = new Set();
            return items.filter((item) => {
                const link = item?.link;
                if (typeof link !== 'string' || link.length === 0) return false;
                if (seen.has(link)) return false;
                seen.add(link);
                return true;
            });
        };

        const normalizedHypeCheck = uniqueByLink(
            (Array.isArray(rawHypeCheck) ? rawHypeCheck : []).filter((item) => isValidLink(item?.link)).map(normalizeNewsItem)
        )
            .filter((item) => !isYouTubeLink(item.link))
            .slice(0, 18);

        const normalizedTechDeepDiveFromModel = uniqueByLink(
            (Array.isArray(rawTechDeepDive) ? rawTechDeepDive : []).filter((item) => isValidLink(item?.link)).map(normalizeNewsItem)
        ).filter((item) => !isYouTubeLink(item.link));

        const paperCandidates = Array.isArray(deepDiveCandidates)
            ? deepDiveCandidates
                  .filter((item) => typeof item?.link === 'string' && item.link.includes('arxiv.org/abs'))
                  .map((item) => {
                      const rawText = typeof item?.contentSnippet === 'string' ? item.contentSnippet : '';
                      const normalizedText = rawText.replace(/\s+/g, ' ').trim();
                      const summary = normalizedText.length > 220 ? `${normalizedText.slice(0, 220)}…` : normalizedText;
                      const content = normalizedText.length > 900 ? `${normalizedText.slice(0, 900)}…` : normalizedText;

                      return {
                          title: typeof item?.title === 'string' ? item.title : '',
                          summary,
                          content,
                          link: item.link,
                          source: typeof item?.source === 'string' ? item.source : 'arXiv',
                          og_image: null,
                          tags: ['논문', 'arXiv']
                      };
                  })
            : [];

        const modelHasPapers = normalizedTechDeepDiveFromModel.some((item) => item.link.includes('arxiv.org/abs'));

        const MIN_PAPERS_IN_DEEP_DIVE = 3;

        let normalizedTechDeepDive = [];
        if (!modelHasPapers && paperCandidates.length > 0) {
            const keepCount = Math.max(0, 18 - MIN_PAPERS_IN_DEEP_DIVE);
            normalizedTechDeepDive = uniqueByLink([
                ...normalizedTechDeepDiveFromModel.slice(0, keepCount),
                ...paperCandidates.slice(0, MIN_PAPERS_IN_DEEP_DIVE)
            ]).slice(0, 18);
        } else {
            normalizedTechDeepDive = uniqueByLink(normalizedTechDeepDiveFromModel).slice(0, 18);
        }

        const MIN_TECH_DEEP_DIVE_ITEMS = 12;
        if (normalizedTechDeepDive.length < MIN_TECH_DEEP_DIVE_ITEMS && Array.isArray(deepDiveCandidates)) {
            const supplement = deepDiveCandidates
                .filter((item) => typeof item?.link === 'string')
                .filter((item) => !isYouTubeLink(item.link))
                .map((item) => {
                    const rawText = typeof item?.contentSnippet === 'string' ? item.contentSnippet : '';
                    const normalizedText = rawText.replace(/\s+/g, ' ').trim();
                    const summary = normalizedText.length > 220 ? `${normalizedText.slice(0, 220)}…` : normalizedText;
                    const content = normalizedText.length > 900 ? `${normalizedText.slice(0, 900)}…` : normalizedText;

                    return {
                        title: typeof item?.title === 'string' ? item.title : '',
                        summary,
                        content,
                        link: item.link,
                        source: typeof item?.source === 'string' ? item.source : '',
                        og_image: null,
                        tags: ['Deep', 'Dive']
                    };
                });

            normalizedTechDeepDive = uniqueByLink([...normalizedTechDeepDive, ...supplement]).slice(0, 18);
        }


        normalizedTechDeepDive = await backfillOgImages(normalizedTechDeepDive, 10);
        const normalizedHypeCheckWithImages = await backfillOgImages(normalizedHypeCheck, 6);

        const usedLinks = new Set([...normalizedHypeCheckWithImages, ...normalizedTechDeepDive].map((item) => item.link));

        const normalizedWatchThis = uniqueByLink(
            (Array.isArray(rawWatchThis) ? rawWatchThis : []).filter((item) => isValidLink(item?.link)).map(normalizeVideoItem)
        )
            .filter((item) => isYouTubeLink(item.link))
            .filter((item) => !usedLinks.has(item.link))
            .slice(0, 15);


        const normalizedData = {
            schema_version: schemaVersion,
            date: dateStr,
            keywords: Array.isArray(data.keywords) ? data.keywords.filter((k) => typeof k === 'string') : [],
            sections: {
                hype_check: normalizedHypeCheckWithImages,
                tech_deep_dive: normalizedTechDeepDive,
                watch_this: normalizedWatchThis
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
