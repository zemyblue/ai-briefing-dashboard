#!/usr/bin/env node
// OpenAI 없이 데이터 수집만 테스트하는 스크립트
const fs = require('fs');
const path = require('path');

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
            // README의 첫 1000자만 추출 (너무 길면 요약)
            const excerpt = readme.substring(0, 1000);
            // 마크다운 헤더와 링크 제거하여 깔끔하게
            const cleaned = excerpt
                .replace(/^#{1,6}\s+/gm, '') // 헤더 제거
                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 링크 텍스트만 남김
                .replace(/!\[.*?\]\(.*?\)/g, '') // 이미지 제거
                .trim();
            return cleaned.substring(0, 500) + '...'; // 500자로 제한
        }
        return null;
    } catch (e) {
        return null;
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

// GitHub Trending 데이터 가져오기 (공식 API 사용)
async function fetchGitHubTrending() {
    try {
        console.log('📡 GitHub Trending 데이터 수집 중...');

        // GitHub 공식 검색 API로 최근 업데이트된 인기 레포 조회
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const dateStr = weekAgo.toISOString().split('T')[0];

        // AI 관련 키워드로 검색
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

            // README 내용을 병렬로 가져오기
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
                        // 추가 정보
                        topics: repo.topics || [],
                        forks: repo.forks_count || 0,
                        watchers: repo.watchers_count || 0,
                        open_issues: repo.open_issues_count || 0,
                        created_at: repo.created_at,
                        updated_at: repo.updated_at,
                        homepage: repo.homepage || null,
                        license: repo.license?.name || 'No license',
                        readme_excerpt: readme || 'README를 가져올 수 없습니다.'
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

        // README 내용을 병렬로 가져오기
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
                    // 추가 정보
                    topics: repo.topics || [],
                    forks: repo.forks_count || 0,
                    watchers: repo.watchers_count || 0,
                    open_issues: repo.open_issues_count || 0,
                    created_at: repo.created_at,
                    updated_at: repo.updated_at,
                    homepage: repo.homepage || null,
                    license: repo.license?.name || 'No license',
                    readme_excerpt: readme || 'README를 가져올 수 없습니다.'
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
        console.log('📡 HackerNews 데이터 수집 중...');

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
            // text가 있으면 HTML 태그 제거하고 500자로 제한
            let storyText = '';
            if (story.text) {
                storyText = story.text
                    .replace(/<[^>]*>/g, '') // HTML 태그 제거
                    .replace(/&#x27;/g, "'") // HTML entity 변환
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
                // 추가 정보
                by: story.by || 'Unknown',
                time: story.time ? new Date(story.time * 1000).toISOString() : null,
                descendants: story.descendants || 0, // 댓글 수
                type: story.type || 'story',
                hn_url: `https://news.ycombinator.com/item?id=${story.id}`,
                text: storyText || null // 본문 텍스트
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
        console.log('📡 YouTube 데이터 수집 중...');

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

                    // description 추출 (media:description 태그에서)
                    const descriptionMatch = entry.match(/<media:description>([\s\S]*?)<\/media:description>/);
                    let description = '';
                    if (descriptionMatch && descriptionMatch[1]) {
                        description = descriptionMatch[1]
                            .replace(/<[^>]*>/g, '') // HTML 태그 제거
                            .replace(/&#x27;/g, "'") // HTML entity 변환
                            .replace(/&quot;/g, '"')
                            .replace(/&amp;/g, '&')
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .trim();
                        description = description.substring(0, 500) + (description.length > 500 ? '...' : '');
                    }

                    const publishedDate = published ? new Date(published) : null;
                    return {
                        title: title || 'Unknown Title',
                        channel: channelName || 'Unknown Channel',
                        link: videoId ? `https://www.youtube.com/watch?v=${videoId}` : '',
                        thumbnail_url: videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '',
                        // 추가 정보
                        video_id: videoId || '',
                        published: published || '',
                        published_date: publishedDate ? publishedDate.toISOString() : null,
                        published_readable: publishedDate ? publishedDate.toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }) : '',
                        description: description || null // 비디오 설명
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

async function testDataCollection() {
    console.log('🚀 데이터 수집 테스트 시작...\n');

    // 모든 데이터 소스에서 데이터 수집
    const [githubRepos, hackerNewsStories, youtubeVideos] = await Promise.all([
        fetchGitHubTrending(),
        fetchHackerNews(),
        fetchYouTubeVideos()
    ]);

    console.log('\n========================================');
    console.log('📊 수집 결과 요약');
    console.log('========================================');
    console.log(`✅ GitHub 트렌딩: ${githubRepos.length}개`);
    console.log(`✅ HackerNews: ${hackerNewsStories.length}개`);
    console.log(`✅ YouTube: ${youtubeVideos.length}개`);
    console.log('========================================\n');

    // 상세 결과 출력
    if (githubRepos.length > 0) {
        console.log('🔥 GitHub 트렌딩 레포:');
        githubRepos.forEach((repo, i) => {
            console.log(`  ${i + 1}. ${repo.name}`);
            console.log(`     ⭐ ${repo.stars.toLocaleString()} | 🍴 ${repo.forks.toLocaleString()} forks | 👁️  ${repo.watchers.toLocaleString()} watchers`);
            console.log(`     📝 ${repo.language} | 🏷️  ${repo.topics.length} topics | 📜 ${repo.license}`);
            console.log(`     ${repo.description.substring(0, 100)}...`);
            if (repo.homepage) console.log(`     🏠 ${repo.homepage}`);
            if (repo.readme_excerpt) {
                console.log(`     📖 ${repo.readme_excerpt.substring(0, 150)}...`);
            }
            console.log(`     ${repo.url}\n`);
        });
    }

    if (hackerNewsStories.length > 0) {
        console.log('📰 HackerNews AI 뉴스:');
        hackerNewsStories.forEach((story, i) => {
            console.log(`  ${i + 1}. ${story.title}`);
            console.log(`     👍 ${story.score} points | 💬 ${story.descendants} comments | 👤 by ${story.by}`);
            console.log(`     🔗 ${story.link}`);
            if (story.text) {
                console.log(`     📝 ${story.text.substring(0, 200)}...`);
            }
            console.log(`     💭 ${story.hn_url}\n`);
        });
    }

    if (youtubeVideos.length > 0) {
        console.log('🎥 YouTube AI 영상:');
        youtubeVideos.forEach((video, i) => {
            console.log(`  ${i + 1}. ${video.title}`);
            console.log(`     📺 ${video.channel}`);
            console.log(`     📅 ${video.published_readable}`);
            if (video.description) {
                console.log(`     📝 ${video.description.substring(0, 200)}...`);
            }
            console.log(`     ${video.link}\n`);
        });
    }

    // JSON 파일로 저장
    const testResults = {
        collected_at: new Date().toISOString(),
        github_repos: githubRepos,
        hacker_news: hackerNewsStories,
        youtube_videos: youtubeVideos
    };

    const outputPath = path.join(__dirname, '../test-data-collection.json');
    fs.writeFileSync(outputPath, JSON.stringify(testResults, null, 2));
    console.log(`\n💾 테스트 결과가 저장되었습니다: ${outputPath}`);

    // 데이터가 하나도 없으면 경고
    if (githubRepos.length === 0 && hackerNewsStories.length === 0 && youtubeVideos.length === 0) {
        console.error('\n❌ 모든 데이터 소스에서 데이터를 가져오지 못했습니다.');
        console.error('네트워크 연결 또는 API 상태를 확인하세요.');
        process.exit(1);
    }

    console.log('\n✅ 데이터 수집 테스트 완료!');
}

testDataCollection().catch(err => {
    console.error('❌ 테스트 중 오류 발생:', err);
    process.exit(1);
});
